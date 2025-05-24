# Food Ordering Website

A full-stack food ordering application built with React, Node/Express, and Supabase.

## Features
- User registration and login
- Browse food items
- Add items to cart
- Checkout process
- Order history

## Tech Stack
- **Frontend:** React
- **Backend:** Node/Express
- **Database:** Supabase

## Setup Instructions
1. Clone the repository
2. Navigate to the client directory and run `npm install`
3. Navigate to the server directory and run `npm install`
4. Start the backend server with `npm start`
5. Start the frontend with `npm start`

## License
MIT 

# Food Ordering Backend

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create a `.env` file in the `server` directory:**
   ```env
   STRIPE_SECRET_KEY=sk_test_your_secret_key_here
   ```
   Replace with your actual Stripe secret key.

3. **Start the server:**
   ```bash
   npm run dev
   ```
   The backend will run on port 3001 by default.

## Environment Variables
- `STRIPE_SECRET_KEY`: Your Stripe secret key (starts with `sk_test_...` or `sk_live_...`).

## Notes
- The backend expects the frontend to run on `http://localhost:3000` or `http://localhost:3002` (CORS is enabled for these origins).
- The `/api/create-checkout-session` endpoint creates a Stripe Checkout session and returns the URL for redirection. 