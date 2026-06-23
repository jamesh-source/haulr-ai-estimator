import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ token: string }> };

// ---------------------------------------------------------------------------
// GET /api/customer-portal/[token]
// Public — no auth required. Fetches quote + job + invoice by portal token.
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: Params
): Promise<NextResponse> {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Lookup quote by portal_token
    const { data: quote, error } = await supabase
      .from('quotes')
      .select(`
        id,
        quote_number,
        status,
        service_address,
        load_size,
        estimated_volume_cf,
        truck_percentage,
        suggested_price,
        notes,
        created_at,
        expires_at,
        customer_id,
        job_id,
        ai_analysis,
        customers (
          id,
          name,
          email,
          phone
        ),
        jobs (
          id,
          scheduled_date,
          scheduled_time,
          status,
          notes,
          invoices (
            id,
            invoice_number,
            status,
            total_amount,
            due_date,
            paid_at,
            stripe_payment_intent_id
          )
        )
      `)
      .eq('portal_token', token)
      .single();

    if (error || !quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    return NextResponse.json({ quote });
  } catch (err) {
    console.error('[customer-portal GET] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/customer-portal/[token]
// Public — handles customer actions: approve, request_changes, upload_photos
// Body: { action: 'approve' | 'request_changes'; message?: string }
// ---------------------------------------------------------------------------

export async function POST(
  req: NextRequest,
  { params }: Params
): Promise<NextResponse> {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    const body = await req.json();
    const { action, message } = body as {
      action: 'approve' | 'request_changes';
      message?: string;
    };

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Fetch quote by token
    const { data: quote, error: fetchError } = await supabase
      .from('quotes')
      .select('id, status, customer_id')
      .eq('portal_token', token)
      .single();

    if (fetchError || !quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    if (action === 'approve') {
      if (quote.status === 'approved') {
        return NextResponse.json({ error: 'Quote already approved' }, { status: 400 });
      }

      const { error: updateError } = await supabase
        .from('quotes')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('id', quote.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      // Create a notification for the team
      await supabase.from('notifications').insert({
        type: 'quote_approved',
        title: 'Quote Approved',
        message: `A customer approved a quote via the customer portal.`,
        metadata: { quote_id: quote.id },
        is_read: false,
      });

      // Update customer status
      if (quote.customer_id) {
        await supabase
          .from('customers')
          .update({ status: 'scheduled' })
          .eq('id', quote.customer_id);
      }

      return NextResponse.json({ success: true, status: 'approved' });
    }

    if (action === 'request_changes') {
      if (!message?.trim()) {
        return NextResponse.json(
          { error: 'message is required for request_changes' },
          { status: 400 }
        );
      }

      // Log the change request
      const { error: noteError } = await supabase
        .from('quote_change_requests')
        .insert({
          quote_id: quote.id,
          customer_id: quote.customer_id,
          message: message.trim(),
          submitted_at: new Date().toISOString(),
          status: 'pending',
        });

      if (noteError) {
        // Table may not exist yet — log but don't fail
        console.warn('[customer-portal] quote_change_requests insert error:', noteError);
      }

      // Update quote status
      await supabase
        .from('quotes')
        .update({ status: 'changes_requested' })
        .eq('id', quote.id);

      // Notify team
      await supabase.from('notifications').insert({
        type: 'changes_requested',
        title: 'Customer Requested Changes',
        message: message.trim().slice(0, 200),
        metadata: { quote_id: quote.id },
        is_read: false,
      });

      return NextResponse.json({ success: true, status: 'changes_requested' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('[customer-portal POST] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
