require('dotenv').config();

const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();

app.use(express.json());

// Place this helper at the top of your file (outside any function)
function toStripeAmount(value) {
  // Always returns a true integer in pence
  const amount = Math.round(Number(value) * 100);
  if (!Number.isInteger(amount) || amount < 0) {
    throw new Error(`Invalid amount: ${value}`);
  }
  return amount;
}

function getStripeImage(img) {
  return img && img.length < 200 ? img : 'https://via.placeholder.com/150';
}

app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { items, userId, couponId, subtotal, discount, total, isGuestCheckout, userInfo } = req.body;
    console.log('Received amounts:', { subtotal, discount, total });

    // Validate input amounts
    if (!Number.isInteger(subtotal) || subtotal < 0) {
      throw new Error(`Invalid subtotal amount: ${subtotal}`);
    }
    if (!Number.isInteger(discount) || discount < 0) {
      throw new Error(`Invalid discount amount: ${discount}`);
    }
    if (!Number.isInteger(total) || total < 0) {
      throw new Error(`Invalid total amount: ${total}`);
    }

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: 'gbp',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: userId || '',
        couponId: couponId || '',
        isGuestCheckout: isGuestCheckout ? 'true' : 'false',
        items: JSON.stringify(items),
        userInfo: JSON.stringify(userInfo)
      }
    });

    res.json({ clientSecret: paymentIntent.client_secret });

  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/confirm-payment', async (req, res) => {
  try {
    const { paymentMethodId, clientSecret, userInfo } = req.body;

    // Confirm the payment intent
    const paymentIntent = await stripe.paymentIntents.confirm(clientSecret, {
      payment_method: paymentMethodId,
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
    });

    if (paymentIntent.status === 'succeeded') {
      // Here you would typically:
      // 1. Save the order to your database
      // 2. Send confirmation emails
      // 3. Update inventory
      // 4. etc.

      res.json({ success: true, paymentIntent });
    } else {
      res.status(400).json({ error: 'Payment failed' });
    }

  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});