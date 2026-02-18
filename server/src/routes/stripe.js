import { Router } from 'express';
import Stripe from 'stripe';

const router = Router();
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const PRICE_ID = process.env.STRIPE_PRICE_ID;

/** Create a Stripe Checkout session for subscription. Redirects to Stripe-hosted payment page. */
router.post('/create-checkout-session', async (req, res) => {
  if (!stripe || !PRICE_ID) {
    return res.status(503).json({ error: 'Payments are not configured. Set STRIPE_SECRET_KEY and STRIPE_PRICE_ID.' });
  }
  try {
    const baseUrl = (process.env.FRONTEND_URL || req.get('origin') || 'http://localhost:5173').replace(/\/$/, '');
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      success_url: `${baseUrl}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      allow_promotion_codes: true,
    });
    return res.json({ url: session.url });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Could not create checkout session' });
  }
});

export const stripeRouter = router;
