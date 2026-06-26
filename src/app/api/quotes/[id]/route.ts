// =============================================================================
// GET/PUT/DELETE /api/quotes/[id]
// =============================================================================

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';

const LineItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unit_price: z.number(),
  total: z.number(),
  category: z.enum(['load', 'distance', 'labor', 'heavy_item', 'stair', 'specialty', 'construction', 'custom', 'discount']),
});

const UpdateQuoteSchema = z.object({
  status: z.enum(['draft', 'sent', 'approved', 'rejected', 'expired']).optional(),
  load_size: z.object({
    fraction: z.enum(['1/8', '1/4', '3/8', '1/2', '5/8', '3/4', 'full', 'custom']),
    cubic_yards: z.number().nonnegative(),
    truck_percentage: z.number().min(0).max(100),
  }).optional(),
  base_charge: z.number().nonnegative().optional(),
  load_charge: z.number().nonnegative().optional(),
  distance_charge: z.number().nonnegative().optional(),
  labor_charge: z.number().nonnegative().optional(),
  heavy_item_fees: z.number().nonnegative().optional(),
  stair_fees: z.number().nonnegative().optional(),
  specialty_fees: z.number().nonnegative().optional(),
  construction_fees: z.number().nonnegative().optional(),
  custom_fees: z.array(LineItemSchema).optional(),
  discounts: z.array(LineItemSchema).optional(),
  subtotal: z.number().nonnegative().optional(),
  tax_rate: z.number().min(0).max(0.25).optional(),
  tax_amount: z.number().nonnegative().optional(),
  total: z.number().nonnegative().optional(),
  notes: z.string().max(2000).optional(),
  terms: z.string().max(5000).optional(),
  expiry_date: z.string().datetime().optional(),
});

// -----------------------------------------------------------------------------
// GET /api/quotes/[id]
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

    const { data: quote, error } = await supabase
      .from('quotes')
      .select(
        `*,
         customers(*),
         jobs(id, title, status, scheduled_date, scheduled_time)`
      )
      .eq('id', id)
      .eq('clerk_user_id', userId)
      .single();

    if (error || !quote) {
      return NextResponse.json(
        { error: { message: 'Quote not found', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    // Fetch photo uploads associated with this quote
    const { data: photos } = await supabase
      .from('photo_uploads')
      .select('id, storage_path, public_url, created_at')
      .eq('quote_id', id)
      .order('created_at', { ascending: true });

    return NextResponse.json({ data: { ...quote, photos: photos ?? [] }, error: null });
  } catch (err) {
    console.error('[quotes/[id] GET] Unhandled:', err);
    return NextResponse.json({ error: { message: 'Internal server error' } }, { status: 500 });
  }
}

// -----------------------------------------------------------------------------
// PUT /api/quotes/[id]
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

    const parsed = UpdateQuoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: 'Validation failed', details: parsed.error.flatten().fieldErrors } },
        { status: 422 }
      );
    }

    const supabase = await createAdminClient();

    // Verify ownership
    const { data: existing } = await supabase
      .from('quotes')
      .select('id, status')
      .eq('id', id)
      .eq('clerk_user_id', userId)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: { message: 'Quote not found', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    const { data: updated, error } = await supabase
      .from('quotes')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('clerk_user_id', userId)
      .select(`*, customers(id, name, email, phone)`)
      .single();

    if (error) {
      console.error('[quotes/[id] PUT]', error.message);
      return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    }

    return NextResponse.json({ data: updated, error: null });
  } catch (err) {
    console.error('[quotes/[id] PUT] Unhandled:', err);
    return NextResponse.json({ error: { message: 'Internal server error' } }, { status: 500 });
  }
}

// -----------------------------------------------------------------------------
// DELETE /api/quotes/[id] — only drafts can be deleted
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
      .from('quotes')
      .select('id, status')
      .eq('id', id)
      .eq('clerk_user_id', userId)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: { message: 'Quote not found', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    if (existing.status !== 'draft') {
      return NextResponse.json(
        {
          error: {
            message: `Cannot delete a quote with status "${existing.status}". Only draft quotes can be deleted.`,
            code: 'DELETE_NOT_ALLOWED',
          },
        },
        { status: 409 }
      );
    }

    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id)
      .eq('clerk_user_id', userId);

    if (error) {
      console.error('[quotes/[id] DELETE]', error.message);
      return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    }

    return NextResponse.json({ data: { deleted: true, id }, error: null });
  } catch (err) {
    console.error('[quotes/[id] DELETE] Unhandled:', err);
    return NextResponse.json({ error: { message: 'Internal server error' } }, { status: 500 });
  }
}
