// =============================================================================
// GET /api/customers â€” List customers
// POST /api/customers â€” Create customer
// =============================================================================

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { APP_CONFIG } from '@/lib/constants';

const CreateCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(7).max(20),
  address: z.string().min(1, 'Address is required').max(300),
  city: z.string().min(1).max(100),
  state: z.string().min(2).max(50),
  zip: z.string().min(4).max(10),
  notes: z.string().max(2000).optional(),
  status: z.enum([
    'lead', 'contacted', 'quoted', 'follow_up',
    'scheduled', 'in_progress', 'completed', 'cancelled',
  ]).default('lead'),
  lead_source: z.enum([
    'google', 'website', 'facebook', 'instagram',
    'referral', 'yard_sign', 'flyer', 'other',
  ]).default('other'),
  tags: z.array(z.string()).max(10).optional(),
});

// -----------------------------------------------------------------------------
// GET /api/customers
// -----------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const supabase = await createAdminClient();
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const pageSize = Math.min(100, parseInt(searchParams.get('page_size') ?? String(APP_CONFIG.pagination_page_size), 10));
    const search = searchParams.get('search')?.trim() ?? '';
    const status = searchParams.get('status') ?? '';
    const leadSource = searchParams.get('lead_source') ?? '';
    const sortBy = searchParams.get('sort_by') ?? 'created_at';
    const sortDir = searchParams.get('sort_dir') === 'asc';

    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .eq('clerk_user_id', userId)
      .is('deleted_at', null);

    if (status) query = query.eq('status', status);
    if (leadSource) query = query.eq('lead_source', leadSource);

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,address.ilike.%${search}%`
      );
    }

    const allowedSort = ['created_at', 'updated_at', 'name', 'email', 'status', 'total_revenue', 'total_jobs'];
    const safeSortBy = allowedSort.includes(sortBy) ? sortBy : 'created_at';

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.order(safeSortBy, { ascending: sortDir }).range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error('[customers GET]', error.message);
      return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        customers: data ?? [],
        pagination: {
          page,
          page_size: pageSize,
          total: count ?? 0,
          total_pages: Math.ceil((count ?? 0) / pageSize),
        },
      },
      error: null,
    });
  } catch (err) {
    console.error('[customers GET] Unhandled:', err);
    return NextResponse.json({ error: { message: 'Internal server error' } }, { status: 500 });
  }
}

// -----------------------------------------------------------------------------
// POST /api/customers
// -----------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: { message: 'Invalid JSON body' } }, { status: 400 });
    }

    const parsed = CreateCustomerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: 'Validation failed', details: parsed.error.flatten().fieldErrors } },
        { status: 422 }
      );
    }

    const supabase = await createAdminClient();

    // Check for duplicate email within same user account
    const { data: existing } = await supabase
      .from('customers')
      .select('id, name')
      .eq('clerk_user_id', userId)
      .eq('email', parsed.data.email)
      .is('deleted_at', null)
      .single();

    if (existing) {
      return NextResponse.json(
        {
          error: {
            message: `A customer with this email already exists: ${existing.name}`,
            code: 'DUPLICATE_EMAIL',
            existing_id: existing.id,
          },
        },
        { status: 409 }
      );
    }

    const { data: customer, error } = await supabase
      .from('customers')
      .insert({
        ...parsed.data,
        clerk_user_id: userId,
        total_jobs: 0,
        total_revenue: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('[customers POST]', error.message);
      return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    }

    return NextResponse.json({ data: customer, error: null }, { status: 201 });
  } catch (err) {
    console.error('[customers POST] Unhandled:', err);
    return NextResponse.json({ error: { message: 'Internal server error' } }, { status: 500 });
  }
}
