// =============================================================================
// POST /api/ai/analyze â€” AI Photo Analysis Route
// =============================================================================

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { analyzePhotos, buildEstimateFromAI, toAIEstimate } from '@/lib/ai/estimator';
import { DEFAULT_PRICING_CONFIG } from '@/lib/constants';
import type { PricingConfig } from '@/types';

// -----------------------------------------------------------------------------
// Request schema
// -----------------------------------------------------------------------------

const AnalyzeRequestSchema = z.object({
  image_urls: z
    .array(z.string().url())
    .min(1, 'At least one image URL is required')
    .max(20, 'Maximum 20 images per analysis'),
  quote_id: z.string().uuid().optional(),
  job_id: z.string().uuid().optional(),
  additional_context: z.string().max(500).optional(),
});

// -----------------------------------------------------------------------------
// Rate limiting helper (10 analyses/hour per user)
// -----------------------------------------------------------------------------

async function checkRateLimit(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  userId: string
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const LIMIT = 10;

  const { count, error } = await supabase
    .from('ai_analysis_results')
    .select('*', { count: 'exact', head: true })
    .eq('clerk_user_id', userId)
    .gte('created_at', hourAgo);

  if (error) {
    // If we can't check, allow through (fail open)
    return { allowed: true, remaining: LIMIT, resetAt: new Date(Date.now() + 3600000) };
  }

  const used = count ?? 0;
  const remaining = Math.max(0, LIMIT - used);
  const resetAt = new Date(Date.now() + 3600000);

  return { allowed: used < LIMIT, remaining, resetAt };
}

// -----------------------------------------------------------------------------
// POST handler
// -----------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // Auth
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const supabase = await createAdminClient();

    // Rate limit check
    const rateLimit = await checkRateLimit(supabase, userId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: {
            message: 'Rate limit exceeded. You can run 10 analyses per hour.',
            code: 'RATE_LIMIT_EXCEEDED',
          },
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetAt.toISOString(),
            'Retry-After': String(Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)),
          },
        }
      );
    }

    // Parse and validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: { message: 'Invalid JSON body', code: 'INVALID_BODY' } },
        { status: 400 }
      );
    }

    const parseResult = AnalyzeRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: parseResult.error.flatten().fieldErrors,
          },
        },
        { status: 422 }
      );
    }

    const { image_urls, quote_id, job_id, additional_context } = parseResult.data;

    // Load business settings for pricing
    const { data: settingsRow } = await supabase
      .from('business_settings')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();

    const pricingConfig: PricingConfig =
      (settingsRow?.pricing as PricingConfig) ?? DEFAULT_PRICING_CONFIG;

    // Run AI analysis
    let aiResult;
    try {
      aiResult = await analyzePhotos(image_urls, {
        businessName: settingsRow?.company_name,
        serviceArea:
          settingsRow?.city && settingsRow?.state
            ? `${settingsRow.city}, ${settingsRow.state}`
            : undefined,
        dumpCostPerYard: pricingConfig.dump_per_yard,
        laborRate: pricingConfig.labor_rate,
        additionalContext: additional_context,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'AI analysis failed';

      // Map known OpenAI errors to better messages
      if (message.includes('quota') || message.includes('billing')) {
        return NextResponse.json(
          {
            error: {
              message: 'AI service quota exceeded. Please check your OpenAI billing.',
              code: 'QUOTA_EXCEEDED',
            },
          },
          { status: 503 }
        );
      }
      if (message.includes('rate_limit') || message.includes('429')) {
        return NextResponse.json(
          {
            error: {
              message: 'AI service rate limit reached. Please try again in a moment.',
              code: 'AI_RATE_LIMIT',
            },
          },
          { status: 503 }
        );
      }

      console.error('[ai/analyze] OpenAI error:', message);
      return NextResponse.json(
        {
          error: {
            message: 'AI analysis failed. Please try again.',
            code: 'AI_ERROR',
          },
        },
        { status: 500 }
      );
    }

    // Calculate pricing
    const lineItems = buildEstimateFromAI(aiResult, pricingConfig);
    const aiEstimate = toAIEstimate(aiResult, pricingConfig);

    // Save to database
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('ai_analysis_results')
      .insert({
        clerk_user_id: userId,
        quote_id: quote_id ?? null,
        job_id: job_id ?? null,
        image_urls,
        detected_items: aiResult.detected_items,
        total_cubic_feet: aiResult.total_cubic_feet,
        total_cubic_yards: aiResult.total_cubic_yards,
        truck_percentage: aiResult.truck_percentage,
        estimated_labor_hours: aiResult.estimated_labor_hours,
        dump_cost_estimate: aiResult.dump_cost_estimate,
        hazard_warnings: aiResult.hazard_warnings,
        donation_opportunities: aiResult.donation_opportunities,
        recycling_opportunities: aiResult.recycling_opportunities,
        analysis_notes: aiResult.analysis_notes,
        confidence_score: aiResult.confidence_score,
        suggested_price: lineItems.suggested_total,
        load_fraction: lineItems.load_fraction,
        line_items: lineItems.line_items,
        raw_response: aiResult,
      })
      .select()
      .single();

    if (saveError) {
      // Log but don't fail â€” return results even if save fails
      console.error('[ai/analyze] Failed to save analysis:', saveError.message);
    }

    return NextResponse.json(
      {
        data: {
          analysis_id: savedAnalysis?.id ?? null,
          ai_result: aiResult,
          ai_estimate: aiEstimate,
          pricing: {
            suggested_price: lineItems.suggested_total,
            load_fraction: lineItems.load_fraction,
            line_items: lineItems.line_items,
            cubic_yards: lineItems.cubic_yards,
            truck_percentage: lineItems.truck_percentage,
          },
        },
        error: null,
      },
      {
        status: 200,
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': String(rateLimit.remaining - 1),
          'X-RateLimit-Reset': rateLimit.resetAt.toISOString(),
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[ai/analyze] Unhandled error:', message);
    return NextResponse.json(
      { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
