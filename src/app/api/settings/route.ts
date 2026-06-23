// =============================================================================
// GET/PUT/POST /api/settings — Business settings
// =============================================================================

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_PRICING_CONFIG, APP_CONFIG } from '@/lib/constants';

// -----------------------------------------------------------------------------
// Zod schemas
// -----------------------------------------------------------------------------

const DistanceBracketSchema = z.object({
  min_miles: z.number().nonnegative(),
  max_miles: z.number().positive(),
  charge: z.number().nonnegative(),
});

const StairFeesSchema = z.object({
  per_flight: z.number().nonnegative(),
  max_flights: z.number().int().positive().max(10),
});

const PricingConfigSchema = z.object({
  load_prices: z.record(z.number().nonnegative()),
  distance_brackets: z.array(DistanceBracketSchema).min(1),
  labor_rate: z.number().nonnegative(),
  stair_fees: StairFeesSchema,
  heavy_item_prices: z.record(z.number().nonnegative()),
  difficulty_multipliers: z.record(z.number().positive().max(5)),
  specialty_fees: z.record(z.number().nonnegative()),
  dump_base_fee: z.number().nonnegative(),
  dump_per_yard: z.number().nonnegative(),
});

const BusinessSettingsSchema = z.object({
  company_name: z.string().min(1).max(200),
  address: z.string().max(300).optional().default(''),
  city: z.string().max(100).optional().default(''),
  state: z.string().max(50).optional().default(''),
  zip: z.string().max(10).optional().default(''),
  phone: z.string().max(20).optional().default(''),
  email: z.string().email().optional().or(z.literal('')).default(''),
  website: z.string().url().optional().or(z.literal('')).default(''),
  logo_url: z.string().url().optional().or(z.literal('')).default(''),
  tax_rate: z.number().min(0).max(0.25).default(APP_CONFIG.default_tax_rate),
  base_price: z.number().nonnegative().default(0),
  pricing: PricingConfigSchema.optional(),
});

const UpdateSettingsSchema = BusinessSettingsSchema.partial();

// -----------------------------------------------------------------------------
// GET /api/settings
// -----------------------------------------------------------------------------

export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: settings, error } = await supabase
      .from('business_settings')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No settings yet — return defaults
        return NextResponse.json({
          data: {
            clerk_user_id: userId,
            company_name: '',
            address: '',
            city: '',
            state: '',
            zip: '',
            phone: '',
            email: '',
            website: '',
            logo_url: '',
            tax_rate: APP_CONFIG.default_tax_rate,
            base_price: 0,
            pricing: DEFAULT_PRICING_CONFIG,
            initialized: false,
          },
          error: null,
        });
      }
      console.error('[settings GET]', error.message);
      return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    }

    // Merge pricing config with defaults for any missing keys
    const pricing = {
      ...DEFAULT_PRICING_CONFIG,
      ...(settings.pricing as object ?? {}),
    };

    return NextResponse.json({ data: { ...settings, pricing, initialized: true }, error: null });
  } catch (err) {
    console.error('[settings GET] Unhandled:', err);
    return NextResponse.json({ error: { message: 'Internal server error' } }, { status: 500 });
  }
}

// -----------------------------------------------------------------------------
// PUT /api/settings — Update existing settings
// -----------------------------------------------------------------------------

export async function PUT(request: NextRequest) {
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

    const parsed = UpdateSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: 'Validation failed', details: parsed.error.flatten().fieldErrors } },
        { status: 422 }
      );
    }

    const supabase = await createClient();

    // Load existing to merge pricing
    const { data: existing } = await supabase
      .from('business_settings')
      .select('pricing')
      .eq('clerk_user_id', userId)
      .single();

    const mergedPricing = parsed.data.pricing
      ? {
          ...DEFAULT_PRICING_CONFIG,
          ...(existing?.pricing as object ?? {}),
          ...parsed.data.pricing,
        }
      : undefined;

    const updatePayload = {
      ...parsed.data,
      ...(mergedPricing ? { pricing: mergedPricing } : {}),
      updated_at: new Date().toISOString(),
    };

    const { data: updated, error } = await supabase
      .from('business_settings')
      .update(updatePayload)
      .eq('clerk_user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Settings row doesn't exist — create it
        return POST(request);
      }
      console.error('[settings PUT]', error.message);
      return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    }

    return NextResponse.json({ data: updated, error: null });
  } catch (err) {
    console.error('[settings PUT] Unhandled:', err);
    return NextResponse.json({ error: { message: 'Internal server error' } }, { status: 500 });
  }
}

// -----------------------------------------------------------------------------
// POST /api/settings — Initialize settings for new user
// -----------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }

    // Check if settings already exist
    const supabase = await createClient();
    const { data: existing } = await supabase
      .from('business_settings')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: { message: 'Settings already initialized. Use PUT to update.', code: 'ALREADY_EXISTS' } },
        { status: 409 }
      );
    }

    let body: Record<string, unknown> = {};
    try {
      const text = await request.text();
      if (text) body = JSON.parse(text);
    } catch {
      // OK — use empty body with defaults
    }

    const parsed = BusinessSettingsSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: 'Validation failed', details: parsed.error.flatten().fieldErrors } },
        { status: 422 }
      );
    }

    const { data: settings, error } = await supabase
      .from('business_settings')
      .insert({
        clerk_user_id: userId,
        company_name: parsed.data.company_name ?? '',
        address: parsed.data.address ?? '',
        city: parsed.data.city ?? '',
        state: parsed.data.state ?? '',
        zip: parsed.data.zip ?? '',
        phone: parsed.data.phone ?? '',
        email: parsed.data.email ?? '',
        website: parsed.data.website ?? '',
        logo_url: parsed.data.logo_url ?? '',
        tax_rate: parsed.data.tax_rate ?? APP_CONFIG.default_tax_rate,
        base_price: parsed.data.base_price ?? 0,
        pricing: DEFAULT_PRICING_CONFIG,
      })
      .select()
      .single();

    if (error) {
      console.error('[settings POST]', error.message);
      return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    }

    return NextResponse.json({ data: settings, error: null }, { status: 201 });
  } catch (err) {
    console.error('[settings POST] Unhandled:', err);
    return NextResponse.json({ error: { message: 'Internal server error' } }, { status: 500 });
  }
}
