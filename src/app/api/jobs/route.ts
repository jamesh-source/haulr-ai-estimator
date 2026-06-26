// =============================================================================
// GET /api/jobs â€” List jobs
// POST /api/jobs â€” Create job
// =============================================================================

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { APP_CONFIG } from '@/lib/constants';

const CreateJobSchema = z.object({
  customer_id: z.string().uuid('Invalid customer ID'),
  quote_id: z.string().uuid().optional(),
  title: z.string().min(1, 'Title is required').max(300),
  description: z.string().max(2000).optional(),
  status: z.enum(['draft', 'quoted', 'scheduled', 'in_progress', 'completed', 'cancelled']).default('draft'),
  scheduled_date: z.string().optional(), // ISO date string YYYY-MM-DD
  scheduled_time: z.string().optional(), // HH:MM
  crew_ids: z.array(z.string().uuid()).max(APP_CONFIG.max_crew_per_job).optional(),
  truck_id: z.string().uuid().optional(),
  notes: z.string().max(2000).optional(),
});

// -----------------------------------------------------------------------------
// GET /api/jobs
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
    const customerId = searchParams.get('customer_id') ?? '';
    const startDate = searchParams.get('start_date') ?? '';
    const endDate = searchParams.get('end_date') ?? '';
    const scheduledDate = searchParams.get('scheduled_date') ?? '';
    const sortBy = searchParams.get('sort_by') ?? 'created_at';
    const sortDir = searchParams.get('sort_dir') === 'asc';

    let query = supabase
      .from('jobs')
      .select(
        `*,
         customers(id, name, email, phone, address, city, state, zip),
         quotes(id, quote_number, total)`,
        { count: 'exact' }
      )
      .eq('clerk_user_id', userId);

    if (status) query = query.eq('status', status);
    if (customerId) query = query.eq('customer_id', customerId);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);
    if (scheduledDate) query = query.eq('scheduled_date', scheduledDate);

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    const allowedSort = ['created_at', 'updated_at', 'scheduled_date', 'status', 'title'];
    const safeSortBy = allowedSort.includes(sortBy) ? sortBy : 'created_at';

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.order(safeSortBy, { ascending: sortDir }).range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error('[jobs GET]', error.message);
      return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        jobs: data ?? [],
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
    console.error('[jobs GET] Unhandled:', err);
    return NextResponse.json({ error: { message: 'Internal server error' } }, { status: 500 });
  }
}

// -----------------------------------------------------------------------------
// POST /api/jobs
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

    const parsed = CreateJobSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: 'Validation failed', details: parsed.error.flatten().fieldErrors } },
        { status: 422 }
      );
    }

    const supabase = await createAdminClient();

    // Verify customer ownership
    const { data: customer } = await supabase
      .from('customers')
      .select('id, name')
      .eq('id', parsed.data.customer_id)
      .eq('clerk_user_id', userId)
      .single();

    if (!customer) {
      return NextResponse.json(
        { error: { message: 'Customer not found or access denied', code: 'CUSTOMER_NOT_FOUND' } },
        { status: 404 }
      );
    }

    // Verify quote if provided
    if (parsed.data.quote_id) {
      const { data: quote } = await supabase
        .from('quotes')
        .select('id')
        .eq('id', parsed.data.quote_id)
        .eq('clerk_user_id', userId)
        .single();

      if (!quote) {
        return NextResponse.json(
          { error: { message: 'Quote not found or access denied', code: 'QUOTE_NOT_FOUND' } },
          { status: 404 }
        );
      }
    }

    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        ...parsed.data,
        clerk_user_id: userId,
      })
      .select(`*, customers(id, name, email, phone), quotes(id, quote_number, total)`)
      .single();

    if (error) {
      console.error('[jobs POST]', error.message);
      return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    }

    // Update customer status to scheduled if job is scheduled
    if (parsed.data.status === 'scheduled') {
      await supabase
        .from('customers')
        .update({ status: 'scheduled', updated_at: new Date().toISOString() })
        .eq('id', parsed.data.customer_id)
        .eq('clerk_user_id', userId);
    }

    return NextResponse.json({ data: job, error: null }, { status: 201 });
  } catch (err) {
    console.error('[jobs POST] Unhandled:', err);
    return NextResponse.json({ error: { message: 'Internal server error' } }, { status: 500 });
  }
}
