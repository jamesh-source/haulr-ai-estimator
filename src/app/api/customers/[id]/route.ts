// =============================================================================
// GET/PUT/DELETE /api/customers/[id]
// =============================================================================

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';

const UpdateCustomerSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(7).max(20).optional(),
  address: z.string().min(1).max(300).optional(),
  city: z.string().min(1).max(100).optional(),
  state: z.string().min(2).max(50).optional(),
  zip: z.string().min(4).max(10).optional(),
  notes: z.string().max(2000).optional(),
  status: z.enum([
    'lead', 'contacted', 'quoted', 'follow_up',
    'scheduled', 'in_progress', 'completed', 'cancelled',
  ]).optional(),
  lead_source: z.enum([
    'google', 'website', 'facebook', 'instagram',
    'referral', 'yard_sign', 'flyer', 'other',
  ]).optional(),
  tags: z.array(z.string()).max(10).optional(),
});

// -----------------------------------------------------------------------------
// GET /api/customers/[id]
// -----------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createAdminClient();

    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .eq('clerk_user_id', userId)
      .is('deleted_at', null)
      .single();

    if (error || !customer) {
      return NextResponse.json(
        { error: { message: 'Customer not found', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    // Fetch related quotes
    const { data: quotes } = await supabase
      .from('quotes')
      .select('id, quote_number, status, total, created_at')
      .eq('customer_id', id)
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    // Fetch related jobs
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id, title, status, scheduled_date, created_at')
      .eq('customer_id', id)
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    // Fetch photos
    const { data: photos } = await supabase
      .from('photo_uploads')
      .select('id, public_url, created_at')
      .eq('customer_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      data: {
        ...customer,
        quotes: quotes ?? [],
        jobs: jobs ?? [],
        photos: photos ?? [],
      },
      error: null,
    });
  } catch (err) {
    console.error('[customers/[id] GET] Unhandled:', err);
    return NextResponse.json({ error: { message: 'Internal server error' } }, { status: 500 });
  }
}

// -----------------------------------------------------------------------------
// PUT /api/customers/[id]
// -----------------------------------------------------------------------------

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const { id } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: { message: 'Invalid JSON body' } }, { status: 400 });
    }

    const parsed = UpdateCustomerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: 'Validation failed', details: parsed.error.flatten().fieldErrors } },
        { status: 422 }
      );
    }

    const supabase = await createAdminClient();

    // Verify ownership
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('id', id)
      .eq('clerk_user_id', userId)
      .is('deleted_at', null)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: { message: 'Customer not found', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    // If updating email, check for duplicates
    if (parsed.data.email) {
      const { data: duplicate } = await supabase
        .from('customers')
        .select('id, name')
        .eq('clerk_user_id', userId)
        .eq('email', parsed.data.email)
        .neq('id', id)
        .is('deleted_at', null)
        .single();

      if (duplicate) {
        return NextResponse.json(
          {
            error: {
              message: `Email already in use by another customer: ${duplicate.name}`,
              code: 'DUPLICATE_EMAIL',
            },
          },
          { status: 409 }
        );
      }
    }

    const { data: updated, error } = await supabase
      .from('customers')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('clerk_user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('[customers/[id] PUT]', error.message);
      return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    }

    return NextResponse.json({ data: updated, error: null });
  } catch (err) {
    console.error('[customers/[id] PUT] Unhandled:', err);
    return NextResponse.json({ error: { message: 'Internal server error' } }, { status: 500 });
  }
}

// -----------------------------------------------------------------------------
// DELETE /api/customers/[id] — soft delete if has jobs, hard delete otherwise
// -----------------------------------------------------------------------------

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createAdminClient();

    const { data: existing } = await supabase
      .from('customers')
      .select('id, name')
      .eq('id', id)
      .eq('clerk_user_id', userId)
      .is('deleted_at', null)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: { message: 'Customer not found', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    // Check for linked jobs or quotes
    const { count: jobCount } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', id);

    const { count: quoteCount } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', id);

    const hasHistory = (jobCount ?? 0) > 0 || (quoteCount ?? 0) > 0;

    if (hasHistory) {
      // Soft delete — preserve history
      const { error } = await supabase
        .from('customers')
        .update({ deleted_at: new Date().toISOString(), status: 'cancelled' })
        .eq('id', id)
        .eq('clerk_user_id', userId);

      if (error) {
        console.error('[customers/[id] DELETE soft]', error.message);
        return NextResponse.json({ error: { message: error.message } }, { status: 500 });
      }

      return NextResponse.json({
        data: {
          deleted: true,
          soft_deleted: true,
          id,
          message: `Customer "${existing.name}" was archived (has ${jobCount} job(s) and ${quoteCount} quote(s)).`,
        },
        error: null,
      });
    }

    // Hard delete — no history
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)
      .eq('clerk_user_id', userId);

    if (error) {
      console.error('[customers/[id] DELETE hard]', error.message);
      return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    }

    return NextResponse.json({
      data: { deleted: true, soft_deleted: false, id },
      error: null,
    });
  } catch (err) {
    console.error('[customers/[id] DELETE] Unhandled:', err);
    return NextResponse.json({ error: { message: 'Internal server error' } }, { status: 500 });
  }
}
