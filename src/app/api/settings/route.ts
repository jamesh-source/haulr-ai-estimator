// =============================================================================
// GET/PUT/POST /api/settings â€” Business settings
// =============================================================================

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
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

const UpdateSettingsSchema = z.object({
  company_name: z.string().max(200).optional(),
  address: z.string().max(300).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zip: z.string().max(10).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  logo_url: z.string().url().optional().or(z.literal('')),
  tax_rate: z.number().min(0).max(0.25).optional(),
  // 'pricing' is the frontend name; DB column is 'pricing_config'
  pricing: PricingConfigSchema.optional(),
});

// -----------------------------------------------------------------------------
// GET /api/settings
// -----------------------------------------------------------------------------

export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const supabase = await createAdminClient();

    const { data: settings, error } = await supabase
      .from('business_settings')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No settings yet â€” return defaults
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
            pricing: DEFAULT_PRICING_CONFIG,
            initialized: false,
          },
          error: null,
        });
      }
      console.error('[settings GET]', error.message);
      return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    }

    // pricing_config is the DB column; expose it as 'pricing' to the frontend
    const pricing = {
      ...DEFAULT_PRICING_CONFIG,
      ...(settings.pricing_config as object ?? {}),
    };

    // Exclude raw pricing_config from the response; use the merged 'pricing' key instead
    const { pricing_config: _raw, ...settingsRest } = settings;
    void _raw;
    return NextResponse.json({ data: { ...settingsRest, pricing, initialized: true }, error: null });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    console.error('[settings GET] Unhandled:', msg);
    return NextResponse.json({ error: { message: msg } }, { status: 500 });
  }
}

// -----------------------------------------------------------------------------
// PUT /api/settings â€” Update existing settings
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

    const supabase = await createAdminClient();

    // Load existing pricing_config to merge (DB column is pricing_config)
    const { data: existing } = await supabase
      .from('business_settings')
      .select('pricing_config')
      .eq('clerk_user_id', userId)
      .single();

    // Build the merged pricing_config value for the DB
    const mergedPricingConfig = parsed.data.pricing
      ? {
          ...DEFAULT_PRICING_CONFIG,
          ...(existing?.pricing_config as object ?? {}),
          ...parsed.data.pricing,
        }
      : undefined;

    // Strip 'pricing' (frontend name) from parsed data; write as 'pricing_config' (DB column)
    const { pricing: _pricingField, ...restFields } = parsed.data;
    void _pricingField;

    const updatePayload = {
      ...restFields,
      ...(mergedPricingConfig ? { pricing_config: mergedPricingConfig } : {}),
      updated_at: new Date().toISOString(),
    };

    const { data: updated, error } = await supabase
      .from('business_settings')
      .upsert(
        { clerk_user_id: userId, ...updatePayload },
        { onConflict: 'clerk_user_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('[settings PUT]', error.message);
      return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    }

    return NextResponse.json({ data: updated, error: null });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    console.error('[settings PUT] Unhandled:', msg);
    return NextResponse.json({ error: { message: msg } }, { status: 500 });
  }
}

// -----------------------------------------------------------------------------
// POST /api/settings â€” Initialize settings for new user
// -----------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }

    // Check if settings already exist
    const supabase = await createAdminClient();
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
      // OK â€” use empty body with defaults
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
    const msg = err instanceof Error ? err.message : 'Internal server error';
    console.error('[settings POST] Unhandled:', msg);
    return NextResponse.json({ error: { message: msg } }, { status: 500 });
  }
}
