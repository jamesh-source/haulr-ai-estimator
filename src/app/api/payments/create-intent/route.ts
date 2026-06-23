import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createCustomer, createPaymentIntent } from '@/lib/stripe/client';

// ---------------------------------------------------------------------------
// POST /api/payments/create-intent
// Body: { invoice_id: string; amount: number }
// Returns: { clientSecret: string }
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { invoice_id, amount } = body as { invoice_id: string; amount: number };

    if (!invoice_id || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'invoice_id and a positive amount are required' },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    // -----------------------------------------------------------------------
    // 1. Fetch the invoice with its related customer/job info
    // -----------------------------------------------------------------------
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        status,
        stripe_customer_id,
        stripe_payment_intent_id,
        customer_id,
        customers (
          id,
          name,
          email,
          stripe_customer_id
        )
      `)
      .eq('id', invoice_id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.status === 'paid') {
      return NextResponse.json({ error: 'Invoice is already paid' }, { status: 400 });
    }

    // -----------------------------------------------------------------------
    // 2. Ensure a Stripe customer exists
    // -----------------------------------------------------------------------
    const customer = invoice.customers as unknown as {
      id: string;
      name: string;
      email: string;
      stripe_customer_id: string | null;
    } | null;

    let stripeCustomerId: string = invoice.stripe_customer_id ?? '';

    if (!stripeCustomerId && customer) {
      // Check if the customer record already has a stripe id
      if (customer.stripe_customer_id) {
        stripeCustomerId = customer.stripe_customer_id;
      } else {
        // Create a new Stripe customer
        stripeCustomerId = await createCustomer(
          customer.name ?? 'Unknown',
          customer.email ?? '',
          { supabase_customer_id: customer.id }
        );

        // Persist the stripe customer id back to the customers table
        await supabase
          .from('customers')
          .update({ stripe_customer_id: stripeCustomerId })
          .eq('id', customer.id);
      }
    }

    // -----------------------------------------------------------------------
    // 3. Create (or reuse) the PaymentIntent
    // -----------------------------------------------------------------------
    let clientSecret: string;

    if (invoice.stripe_payment_intent_id) {
      // Retrieve existing intent so the client can confirm it
      const { default: Stripe } = await import('stripe');
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2024-06-20',
      });
      const existing = await stripe.paymentIntents.retrieve(
        invoice.stripe_payment_intent_id
      );
      clientSecret = existing.client_secret!;
    } else {
      const intent = await createPaymentIntent(amount, stripeCustomerId, {
        invoice_id,
        invoice_number: invoice.invoice_number ?? '',
      });
      clientSecret = intent.client_secret!;

      // Persist the intent id to the invoice
      await supabase
        .from('invoices')
        .update({
          stripe_payment_intent_id: intent.id,
          stripe_customer_id: stripeCustomerId,
        })
        .eq('id', invoice_id);
    }

    return NextResponse.json({ clientSecret });
  } catch (err: unknown) {
    console.error('[create-intent] error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
