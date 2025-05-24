import React, { useEffect } from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const Success = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      // Clear the cart after successful payment
      clearCart();
    }
  }, [sessionId, clearCart]);

  return (
    <Container>
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h3" color="primary" gutterBottom>
          Thank You for Your Order!
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Your payment was successful and your order has been placed.
        </Typography>
        <Typography variant="body1" paragraph>
          Order ID: {sessionId}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          Continue Shopping
        </Button>
      </Box>
    </Container>
  );
};

export default Success; 