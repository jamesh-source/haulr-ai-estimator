// =============================================================================
// GET /api/quotes — List quotes
// POST /api/quotes — Create quote
// =============================================================================

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/lib/supabase/server';
import { APP_CONFIG } from '@/lib/constants';

// -----------------------------------------------------------------------------
// Zod schema for creating a quote
// -----------------------------------------------------------------------------

const LineItemSchema = z.object({
  id: z.string().default(() => uuidv4()),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unit_price: z.number(),
  total: z.number(),
  category: z.enum(['load', 'distance', 'labor', 'heavy_item', 'stair', 'specialty', 'construction', 'custom', 'discount']),
});

const LoadSizeSchema = z.object({
  fraction: z.enum(['1/8', '1/4', '3/8', '1/2', '5/8', '3/4', 'full', 'custom']),
  cubic_yards: z.number().nonnegative(),
  truck_percentage: z.number().min(0).max(100),
});

const CreateQuoteSchema = z.object({
  customer_id: z.string().uuid('Invalid customer ID'),
  job_id: z.string().uuid().optional(),
  ai_analysis_id: z.string().uuid().optional(),

  load_size: LoadSizeSchema,

  base_charge: z.number().nonnegative().default(0),
  load_charge: z.number().nonnegative().default(0),
  distance_charge: z.number().nonnegative().default(0),
  labor_charge: z.number().nonnegative().default(0),
  heavy_item_fees: z.number().nonnegative().default(0),
  stair_fees: z.number().nonnegative().default(0),
  specialty_fees: z.number().nonnegative().default(0),
  construction_fees: z.number().nonnegative().default(0),
  custom_fees: z.array(LineItemSchema).default([]),
  discounts: z.array(LineItemSchema).default([]),

  subtotal: z.number().nonnegative(),
  tax_rate: z.number().min(0).max(0.25).default(0.0825),
  tax_amount: z.number().nonnegative(),
  total: z.number().nonnegative(),

  notes: z.string().max(2000).optional(),
  terms: z.string().max(5000).optional(),
  expiry_date: z.string().datetime().optional(),

  ai_estimate: z.record(z.unknown()).optional(),
});

// -----------------------------------------------------------------------------
// Generate unique quote number: HLR-YYYYMM-XXXX
// -----------------------------------------------------------------------------

function generateQuoteNumber(): string {
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `HLR-${ym}-${rand}`;
}

// -----------------------------------------------------------------------------
// GET /api/quotes
// -----------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const pageSize = Math.min(100, parseInt(searchParams.get('page_size') ?? String(APP_CONFIG.pagination_page_size), 10));
    const search = searchParams.get('search')?.trim() ?? '';
    const status = searchParams.get('status') ?? '';
    const customerId = searchParams.get('customer_id') ?? '';
    const startDate = searchParams.get('start_date') ?? '';
    const endDate = searchParams.get('end_date') ?? '';
    const sortBy = searchParams.get('sort_by') ?? 'created_at';
    const sortDir = searchParams.get('sort_dir') === 'asc' ? true : false;

    let query = supabase
      .from('quotes')
      .select(
        `*,
         customers(id, name, email, phone, address, city, state)`,
        { count: 'exact' }
      )
      .eq('clerk_user_id', userId);

    if (status) query = query.eq('status', status);
    if (customerId) query = query.eq('customer_id', customerId);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    if (search) {
      query = query.or(
        `quote_number.ilike.%${search}%,customers.name.ilike.%${search}%,customers.email.ilike.%${search}%`
      );
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const allowedSortFields = ['created_at', 'updated_at', 'total', 'status', 'quote_number'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';

    query = query.order(safeSortBy, { ascending: sortDir }).range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error('[quotes GET]', error.message);
      return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        quotes: data ?? [],
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
    console.error('[quotes GET] Unhandled:', err);
    return NextResponse.json({ error: { message: 'Internal server error' } }, { status: 500 });
  }
}

// -----------------------------------------------------------------------------
// POST /api/quotes
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

    const parsed = CreateQuoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: 'Validation failed', details: parsed.error.flatten().fieldErrors } },
        { status: 422 }
      );
    }

    const supabase = await createClient();

    // Verify customer belongs to this user
    const { data: customer, error: custError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', parsed.data.customer_id)
      .eq('clerk_user_id', userId)
      .single();

    if (custError || !customer) {
      return NextResponse.json(
        { error: { message: 'Customer not found or access denied', code: 'CUSTOMER_NOT_FOUND' } },
        { status: 404 }
      );
    }

    // Generate quote number (retry up to 3 times on collision)
    let quoteNumber = generateQuoteNumber();
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data: existing } = await supabase
        .from('quotes')
        .select('id')
        .eq('quote_number', quoteNumber)
        .single();
      if (!existing) break;
      quoteNumber = generateQuoteNumber();
    }

    // Set expiry date if not provided
    const expiryDate =
      parsed.data.expiry_date ??
      new Date(Date.now() + APP_CONFIG.quote_expiry_days * 86400000).toISOString();

    const { data: quote, error: insertError } = await supabase
      .from('quotes')
      .insert({
        ...parsed.data,
        clerk_user_id: userId,
        quote_number: quoteNumber,
        status: 'draft',
        expiry_date: expiryDate,
      })
      .select(`*, customers(id, name, email, phone)`)
      .single();

    if (insertError) {
      console.error('[quotes POST]', insertError.message);
      return NextResponse.json({ error: { message: insertError.message } }, { status: 500 });
    }

    return NextResponse.json({ data: quote, error: null }, { status: 201 });
  } catch (err) {
    console.error('[quotes POST] Unhandled:', err);
    return NextResponse.json({ error: { message: 'Internal server error' } }, { status: 500 });
  }
}
