import Stripe from 'stripe';

// ---------------------------------------------------------------------------
// Stripe server-side client (singleton)
// ---------------------------------------------------------------------------

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    stripeInstance = new Stripe(key, {
      apiVersion: '2024-06-20',
      typescript: true,
    });
  }
  return stripeInstance;
}

// ---------------------------------------------------------------------------
// Helper: format dollar amount to Stripe cents
// ---------------------------------------------------------------------------

/**
 * Converts a dollar amount to Stripe's smallest currency unit (cents).
 * @example formatAmount(19.99) // 1999
 */
export function formatAmount(amount: number): number {
  return Math.round(amount * 100);
}

// ---------------------------------------------------------------------------
// createCustomer
// ---------------------------------------------------------------------------

/**
 * Creates a Stripe Customer and returns the customer ID.
 */
export async function createCustomer(
  name: string,
  email: string,
  metadata?: Record<string, string>
): Promise<string> {
  const stripe = getStripe();
  const customer = await stripe.customers.create({
    name,
    email,
    metadata: metadata ?? {},
  });
  return customer.id;
}

// ---------------------------------------------------------------------------
// createPaymentIntent
// ---------------------------------------------------------------------------

/**
 * Creates a Stripe PaymentIntent.
 * @param amount - dollar amount (not cents)
 * @param customerId - Stripe customer ID
 * @param metadata - arbitrary key/value pairs stored on the intent
 */
export async function createPaymentIntent(
  amount: number,
  customerId: string,
  metadata?: Record<string, string>
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripe();
  return stripe.paymentIntents.create({
    amount: formatAmount(amount),
    currency: 'usd',
    customer: customerId,
    payment_method_types: ['card'],
    metadata: metadata ?? {},
  });
}

// ---------------------------------------------------------------------------
// retrievePaymentIntent
// ---------------------------------------------------------------------------

export async function retrievePaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripe();
  return stripe.paymentIntents.retrieve(paymentIntentId);
}

// ---------------------------------------------------------------------------
// constructWebhookEvent
// ---------------------------------------------------------------------------

export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(payload, signature, secret);
}
