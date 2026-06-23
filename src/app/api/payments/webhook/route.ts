import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { constructWebhookEvent } from '@/lib/stripe/client';
import { createAdminClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// Stripe requires the raw body for signature verification — disable Next.js
// body parsing by exporting a config with no body parser.
// ---------------------------------------------------------------------------

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// POST /api/payments/webhook
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Return 200 immediately; process asynchronously
  const rawBody = await req.arrayBuffer();
  const payload = Buffer.from(rawBody);

  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No stripe-signature header' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error('[webhook] signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Acknowledge immediately before async processing
  const response = NextResponse.json({ received: true }, { status: 200 });

  // Process async — do not await in the response path
  processEvent(event).catch((err) => {
    console.error('[webhook] async processing error:', err);
  });

  return response;
}

// ---------------------------------------------------------------------------
// Async event processor
// ---------------------------------------------------------------------------

async function processEvent(event: Stripe.Event): Promise<void> {
  const supabase = await createAdminClient();

  switch (event.type) {
    // -----------------------------------------------------------------------
    case 'payment_intent.succeeded': {
      const intent = event.data.object as Stripe.PaymentIntent;
      const invoiceId = intent.metadata?.invoice_id;

      if (!invoiceId) {
        console.warn('[webhook] payment_intent.succeeded: no invoice_id in metadata');
        break;
      }

      // Fetch invoice for amount
      const { data: invoice } = await supabase
        .from('invoices')
        .select('id, total_amount, customer_id, job_id')
        .eq('id', invoiceId)
        .single();

      if (!invoice) {
        console.warn('[webhook] invoice not found:', invoiceId);
        break;
      }

      // Mark invoice paid
      await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          stripe_payment_intent_id: intent.id,
        })
        .eq('id', invoiceId);

      // Create a payment record
      await supabase.from('payments').insert({
        invoice_id: invoiceId,
        customer_id: invoice.customer_id,
        job_id: invoice.job_id ?? null,
        amount: intent.amount / 100,
        currency: intent.currency.toUpperCase(),
        stripe_payment_intent_id: intent.id,
        payment_method: 'card',
        status: 'succeeded',
        paid_at: new Date().toISOString(),
      });

      // Create notification
      await supabase.from('notifications').insert({
        type: 'payment_received',
        title: 'Payment Received',
        message: `Invoice payment of $${(intent.amount / 100).toFixed(2)} received.`,
        metadata: { invoice_id: invoiceId, payment_intent_id: intent.id },
        is_read: false,
      });

      console.log('[webhook] payment_intent.succeeded processed for invoice:', invoiceId);
      break;
    }

    // -----------------------------------------------------------------------
    case 'payment_intent.payment_failed': {
      const intent = event.data.object as Stripe.PaymentIntent;
      const invoiceId = intent.metadata?.invoice_id;

      if (!invoiceId) break;

      const failureMessage =
        intent.last_payment_error?.message ?? 'Payment failed';

      await supabase
        .from('invoices')
        .update({ status: 'payment_failed' })
        .eq('id', invoiceId);

      await supabase.from('notifications').insert({
        type: 'payment_failed',
        title: 'Payment Failed',
        message: `Payment failed for invoice: ${failureMessage}`,
        metadata: { invoice_id: invoiceId, payment_intent_id: intent.id },
        is_read: false,
      });

      console.log('[webhook] payment_intent.payment_failed for invoice:', invoiceId);
      break;
    }

    // -----------------------------------------------------------------------
    case 'invoice.paid': {
      // Handle subscription-based invoice payments
      const stripeInvoice = event.data.object as Stripe.Invoice;
      const customerId = stripeInvoice.customer as string;

      // Attempt to find matching subscription record
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('id, customer_id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (subscription) {
        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            current_period_end: stripeInvoice.lines?.data?.[0]?.period?.end
              ? new Date(
                  (stripeInvoice.lines.data[0].period.end as number) * 1000
                ).toISOString()
              : null,
          })
          .eq('id', subscription.id);
      }

      console.log('[webhook] invoice.paid for stripe customer:', customerId);
      break;
    }

    // -----------------------------------------------------------------------
    default:
      console.log('[webhook] unhandled event type:', event.type);
  }
}
