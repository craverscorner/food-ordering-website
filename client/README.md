# Food Ordering Frontend

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Stripe Publishable Key:**
   - Use your Stripe publishable key (starts with `pk_test_...`) in your frontend code where you initialize Stripe.js or `@stripe/stripe-js`.
   - Example:
     ```js
     import { loadStripe } from '@stripe/stripe-js';
     const stripePromise = loadStripe('pk_live_51OwkuOP1ZtCJfXVW0FBHdfBnAo20fxfcQn3BIhBGrLhwT8N8Wg63wo3xVeM5RBPb74ATFlblRLawwiBptNauajHP00l5LoeOzz');
     ```
   - If you are only redirecting to the Stripe Checkout URL returned by the backend, you do not need to use the publishable key directly.

3. **Start the frontend:**
   ```bash
   npm start
   ```
   The frontend will run on port 3000 or 3002 by default.

## Deployment Instructions

1. **Set up environment variables:**
   - Create a `.env` file in the `client` directory based on the example below.
   - Required variables:
     - `REACT_APP_SUPABASE_URL`
     - `REACT_APP_SUPABASE_ANON_KEY`
     - `REACT_APP_STRIPE_PUBLIC_KEY`
     - (Add any other keys you use)

2. **Build for production:**
   ```bash
   npm run build
   ```
   The build output will be in the `client/build` directory.

3. **Serve the build:**
   - You can use [serve](https://www.npmjs.com/package/serve) or deploy to Vercel, Netlify, etc.

## Environment Variables Example

Create a `.env` file in the `client` directory:

```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

## Notes
- The frontend expects the backend to run on `http://localhost:3001`.
- The checkout process will redirect to Stripe using the URL returned by the backend.
- All debug code and console logs have been removed for production.
- All API keys and secrets should be loaded from environment variables, never hardcoded.
- For backend deployment, follow similar steps and ensure all secrets are in environment variables. 