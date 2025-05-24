const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Helper to get a short image URL or a placeholder
function getStripeSafeImageUrl(imageUrl) {
  // Try to extract just the file name from the Supabase URL
  if (imageUrl && typeof imageUrl === 'string') {
    // Example: https://xyz.supabase.co/storage/v1/object/public/menu-images/filename.jpg
    const match = imageUrl.match(/menu-images\/(.+)$/);
    if (match && match[1] && match[1].length < 100) {
      // Use a short public URL
      return `https://i.imgur.com/empty.png`; // Use a placeholder or your own CDN if you want
    }
    // If the file name is still too long, use a placeholder
  }
  return 'https://via.placeholder.com/150';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { items, userId } = req.body;

    // Insert cart into Supabase
    const { data: cartData, error: cartError } = await supabase
      .from('carts')
      .insert({
        user_id: userId || null,
        items, // JSON array of products
        status: 'pending',
      })
      .select('id')
      .single();
    if (cartError) throw cartError;
    const cartId = cartData.id;

    // Generate a URL for the cart (or order)
    const cartUrl = `${req.headers.origin}/cart/${cartId}`;

    // Stripe: Only use a short image URL or a placeholder
    const getStripeImage = (img) => (img && img.length < 200 ? img : 'https://via.placeholder.com/150');

    // Stripe metadata: only short values
    const metadata = {
      cart_id: cartId,
      cart_url: cartUrl,
      user_id: userId || '',
    };
    console.log('Stripe metadata:', metadata);

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map(item => ({
        price_data: {
          currency: 'gbp',
          product_data: {
            name: item.name,
            images: [getStripeImage(item.image)],
            ...(item.description ? { description: item.description } : {}),
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cart`,
      metadata,
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
} 