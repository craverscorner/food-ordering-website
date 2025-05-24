import React, { useState, useEffect, useCallback } from 'react';
import { Container, Typography, Box, Button, Grid, Card, CardContent, IconButton, Alert, Snackbar, TextField, InputAdornment, CircularProgress, Divider, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { supabase } from '../supabaseClient';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, PaymentRequestButtonElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '../context/AuthContext';

// Initialize Stripe with the publishable key
const stripePromise = loadStripe('pk_live_51OwkuOP1ZtCJfXVW0FBHdfBnAo20fxfcQn3BIhBGrLhwT8N8Wg63wo3xVeM5RBPb74ATFlblRLawwiBptNauajHP00l5LoeOzz');

// Payment Form Component
const PaymentForm = ({ userInfo, onSuccess, onError, totalPence }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (stripe && totalPence > 0) {
      const pr = stripe.paymentRequest({
        country: 'GB',
        currency: 'gbp',
        total: {
          label: 'Total',
          amount: totalPence,
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });
      pr.canMakePayment().then(result => {
        if (result) {
          setPaymentRequest(pr);
        }
      });
    }
  }, [stripe, totalPence]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) {
      setError('Please wait while we load the payment form...');
      return;
    }
    setProcessing(true);
    setError(null);
    try {
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/success`,
          receipt_email: userInfo.email,
          shipping: {
            name: userInfo.name,
            address: {
              line1: userInfo.address,
              city: userInfo.city,
              postal_code: userInfo.postalCode,
              country: userInfo.country,
            },
          },
        },
      });
      if (submitError) {
        setError(submitError.message);
        onError(submitError);
      } else {
        onSuccess();
      }
    } catch (err) {
      setError(err.message);
      onError(err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {paymentRequest ? (
        <Box sx={{ mb: 2 }}>
          <PaymentRequestButtonElement options={{ paymentRequest }} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            You can pay with Apple Pay or Google Pay if available on your device/browser.
          </Typography>
        </Box>
      ) : null}
      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        <Box sx={{ mb: 2 }}>
          <PaymentElement 
            onReady={() => {
              console.log('PaymentElement is ready');
              setIsReady(true);
            }}
            onChange={(e) => {
              console.log('PaymentElement changed:', e);
              setError(null);
            }}
            options={{
              layout: {
                type: 'tabs',
                defaultCollapsed: false,
              },
            }}
          />
        </Box>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={processing || !isReady}
          sx={{ mt: 2 }}
        >
          {processing ? <CircularProgress size={24} /> : 'Pay Now'}
        </Button>
      </form>
    </Box>
  );
};

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);
  const [couponStatus, setCouponStatus] = useState(null);
  const [validatedCoupon, setValidatedCoupon] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'GB',
  });

  const API_URL = process.env.REACT_APP_API_URL;

  // Calculate subtotal
  const calculateSubtotal = () => {
    return Number(cart.reduce((sum, item) => {
      const itemTotal = Number(item.price) * Number(item.quantity);
      return sum + Number(itemTotal.toFixed(2));
    }, 0).toFixed(2));
  };

  // Calculate discount amount
  const calculateDiscount = (coupon) => {
    if (!coupon) return 0;
    const subtotal = calculateSubtotal();
    let discount = 0;
    
    if (coupon.discount_type === 'percentage') {
      discount = Number((subtotal * Number(coupon.discount_value) / 100).toFixed(2));
      if (coupon.max_discount) {
        discount = Math.min(discount, Number(coupon.max_discount));
      }
    } else {
      discount = Math.min(Number(coupon.discount_value), subtotal);
    }
    
    return Number(discount.toFixed(2));
  };

  // Calculate total
  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const coupon = appliedCoupon || validatedCoupon;
    const discount = calculateDiscount(coupon);
    return Number((subtotal - discount).toFixed(2));
  };

  // Format amount for Stripe (convert to pence)
  const formatAmountForStripe = (amount) => {
    // Convert to pence and ensure it's an integer
    const amountInPence = Math.round(Number(amount) * 100);
    if (!Number.isInteger(amountInPence) || amountInPence < 0) {
      throw new Error(`Invalid amount: ${amount}`);
    }
    return amountInPence;
  };

  // Debounced coupon check
  const debouncedCheckCoupon = useCallback(
    async (code) => {
      if (!code) {
        setCouponStatus(null);
        setCouponError('');
        setValidatedCoupon(null);
        return;
      }

      setIsCheckingCoupon(true);
      try {
        const { data, error } = await supabase
          .from('coupons')
          .select('*')
          .ilike('code', code.toUpperCase())
          .eq('is_active', true)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            setCouponStatus('invalid');
            setCouponError('Invalid coupon code');
            setValidatedCoupon(null);
          } else {
            throw error;
          }
          return;
        }

        if (!data) {
          setCouponStatus('invalid');
          setCouponError('Invalid coupon code');
          setValidatedCoupon(null);
          return;
        }

        // Check if coupon is valid
        const now = new Date();
        const startDate = new Date(data.start_date);
        const endDate = new Date(data.end_date);

        if (now < startDate || now > endDate) {
          setCouponStatus('invalid');
          setCouponError('Coupon is not valid at this time');
          setValidatedCoupon(null);
          return;
        }

        // Check minimum order amount
        const subtotal = calculateSubtotal();
        if (data.min_order_amount && subtotal < data.min_order_amount) {
          setCouponStatus('invalid');
          setCouponError(`Minimum order amount is £${data.min_order_amount}`);
          setValidatedCoupon(null);
          return;
        }

        setCouponStatus('valid');
        setCouponError('');
        setValidatedCoupon(data);
      } catch (err) {
        console.error('Coupon check error:', err);
        setCouponStatus('invalid');
        setCouponError(err.message);
        setValidatedCoupon(null);
      } finally {
        setIsCheckingCoupon(false);
      }
    },
    [cart]
  );

  // Set up debounced effect
  useEffect(() => {
    const timer = setTimeout(() => {
      debouncedCheckCoupon(couponCode);
    }, 500);

    return () => clearTimeout(timer);
  }, [couponCode, debouncedCheckCoupon]);

  const handleApplyCoupon = async () => {
    if (couponStatus !== 'valid') return;
    setAppliedCoupon(validatedCoupon);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setValidatedCoupon(null);
    setCouponCode('');
    setCouponStatus(null);
    setCouponError('');
  };

  const handleCheckout = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { data: { user } } = await supabase.auth.getUser();
      
      const subtotal = calculateSubtotal();
      const coupon = appliedCoupon || validatedCoupon;
      const discount = calculateDiscount(coupon);
      const finalTotal = calculateTotal();
      
      if (subtotal <= 0) {
        throw new Error('Invalid order amount');
      }
      
      if (discount < 0 || discount > subtotal) {
        throw new Error('Invalid discount amount');
      }
      
      if (finalTotal <= 0) {
        throw new Error('Invalid total amount');
      }

      // Format items for server with proper price handling
      const formattedItems = cart.map(item => {
        const price = parseFloat(item.price);
        const quantity = parseInt(item.quantity);
        
        if (isNaN(price) || price < 0) {
          throw new Error(`Invalid price for item ${item.name}`);
        }
        if (isNaN(quantity) || quantity < 1) {
          throw new Error(`Invalid quantity for item ${item.name}`);
        }

        return {
          ...item,
          price: price.toFixed(2),
          quantity: quantity
        };
      });
      
      // Format amounts for Stripe
      const stripeSubtotal = formatAmountForStripe(subtotal);
      const stripeDiscount = formatAmountForStripe(discount);
      const stripeTotal = Math.round(finalTotal * 100);

      const response = await fetch(`${API_URL}/api/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          items: formattedItems,
          userId: user?.id || null,
          couponId: coupon?.id || null,
          subtotal: stripeSubtotal,
          discount: stripeDiscount,
          total: stripeTotal,
          isGuestCheckout: !user,
          userInfo
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
        } else {
          const text = await response.text();
          console.error('Non-JSON response:', text);
          throw new Error(`Server error: ${response.status}`);
        }
      }

      const data = await response.json();
      
      if (!data.clientSecret) {
        throw new Error('No client secret received from server');
      }

      setClientSecret(data.clientSecret);
      setShowPaymentDialog(true);
    } catch (error) {
      console.error('Checkout error:', error);
      setError(error.message || 'Failed to process checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      setLoading(true);
      
      // Confirm the payment
      const response = await fetch(`${API_URL}/api/confirm-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodId: null,
          clientSecret,
          userInfo
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Payment failed');
      }

      clearCart();
      setShowPaymentDialog(false);
      navigate('/success');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentError = (error) => {
    setError(error.message);
  };

  const handleUserInfoChange = (field) => (event) => {
    setUserInfo(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  if (cart.length === 0) {
    return (
      <Container>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h5">Your cart is empty</Typography>
          <Button variant="contained" color="primary" onClick={() => navigate('/')} sx={{ mt: 2 }}>
            Continue Shopping
          </Button>
        </Box>
      </Container>
    );
  }

  const subtotal = calculateSubtotal();
  const discount = calculateDiscount(appliedCoupon || validatedCoupon);
  const total = calculateTotal();
  const stripeTotal = Math.round(total * 100);

  return (
    <Container>
      <Typography variant="h4" sx={{ my: 4 }}>Your Cart</Typography>
      
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {cart.map((item) => (
            <Card key={item.id} sx={{ mb: 2 }}>
              <CardContent>
                <Grid container alignItems="center" spacing={2}>
                  <Grid item xs={12} sm={3}>
                    {item.image_url && (
                      <img 
                        src={item.image_url} 
                        alt={item.name} 
                        style={{ width: '100%', height: 'auto', borderRadius: '4px' }} 
                      />
                    )}
                  </Grid>
                  <Grid item xs={12} sm={5}>
                    <Typography variant="h6">{item.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.price !== undefined && item.price !== null ?
                        item.price.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' }) :
                        ''}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <RemoveIcon />
                      </IconButton>
                      <Typography sx={{ mx: 1 }}>{item.quantity}</Typography>
                      <IconButton onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                        <AddIcon />
                      </IconButton>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={2} sx={{ textAlign: 'right' }}>
                    <IconButton color="error" onClick={() => removeFromCart(item.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Summary
              </Typography>
              
              {/* Coupon Input */}
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="Coupon Code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  error={couponStatus === 'invalid'}
                  helperText={couponError}
                  disabled={!!appliedCoupon}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        {isCheckingCoupon ? (
                          <CircularProgress size={20} />
                        ) : couponStatus === 'valid' ? (
                          <IconButton
                            onClick={handleApplyCoupon}
                            color="success"
                          >
                            <CheckCircleIcon />
                          </IconButton>
                        ) : couponStatus === 'invalid' ? (
                          <IconButton color="error">
                            <ErrorIcon />
                          </IconButton>
                        ) : (
                          <IconButton
                            onClick={handleApplyCoupon}
                            disabled={!couponCode}
                          >
                            <LocalOfferIcon />
                          </IconButton>
                        )}
                      </InputAdornment>
                    ),
                  }}
                />
                {(appliedCoupon || validatedCoupon) && (
                  <Box sx={{ mt: 1, p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="success.contrastText">
                        Coupon {appliedCoupon ? 'applied' : 'available'}: {(appliedCoupon || validatedCoupon).code}
                      </Typography>
                      {appliedCoupon && (
                        <IconButton 
                          size="small" 
                          onClick={handleRemoveCoupon}
                          sx={{ color: 'success.contrastText' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                    <Typography variant="body2" color="success.contrastText">
                      {(appliedCoupon || validatedCoupon).discount_type === 'percentage' 
                        ? `${(appliedCoupon || validatedCoupon).discount_value}% off`
                        : `£${(appliedCoupon || validatedCoupon).discount_value} off`}
                    </Typography>
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1">Subtotal:</Typography>
                  <Typography variant="body1">
                    {subtotal.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })}
                  </Typography>
                </Box>
                
                {(appliedCoupon || validatedCoupon) && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1" color="success.main">Discount:</Typography>
                    <Typography variant="body1" color="success.main">
                      -{discount.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })}
                    </Typography>
                  </Box>
                )}

                <Divider sx={{ my: 1 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">Total:</Typography>
                  <Typography variant="h6">
                    {total.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })}
                  </Typography>
                </Box>

                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth 
                  onClick={handleCheckout}
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  {loading ? 'Processing...' : 'Checkout'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payment Dialog */}
      <Dialog 
        open={showPaymentDialog} 
        onClose={() => setShowPaymentDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Complete Your Order</DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Contact Information</Typography>
              <TextField
                fullWidth
                label="Full Name"
                value={userInfo.name}
                onChange={handleUserInfoChange('name')}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={userInfo.email}
                onChange={handleUserInfoChange('email')}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Phone"
                value={userInfo.phone}
                onChange={handleUserInfoChange('phone')}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Delivery Address</Typography>
              <TextField
                fullWidth
                label="Address"
                value={userInfo.address}
                onChange={handleUserInfoChange('address')}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="City"
                value={userInfo.city}
                onChange={handleUserInfoChange('city')}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Postal Code"
                value={userInfo.postalCode}
                onChange={handleUserInfoChange('postalCode')}
                margin="normal"
                required
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Country</InputLabel>
                <Select
                  value={userInfo.country}
                  onChange={handleUserInfoChange('country')}
                  label="Country"
                  required
                >
                  <MenuItem value="GB">United Kingdom</MenuItem>
                  <MenuItem value="US">United States</MenuItem>
                  {/* Add more countries as needed */}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Payment Information</Typography>
              {clientSecret && (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#1976d2',
                      },
                    },
                  }}
                >
                  <PaymentForm
                    userInfo={userInfo}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    totalPence={stripeTotal}
                  />
                </Elements>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPaymentDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Cart; 