// =============================================================================
// POST /api/jobs/[id]/complete — Complete a job and capture actuals
// =============================================================================

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';

const CompleteJobSchema = z.object({
  actual_hours: z.number().positive().max(24, 'Cannot exceed 24 hours'),
  actual_dump_fee: z.number().nonnegative(),
  actual_revenue: z.number().positive('Revenue must be positive'),
  actual_cubic_yards: z.number().nonnegative(),
  completion_notes: z.string().max(2000).optional(),
  after_photos: z.array(z.string()).max(30).optional(),
  customer_signature: z.string().optional(), // base64 or URL
  crew_ids: z.array(z.string().uuid()).optional(), // who actually worked
});

export async function POST(
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

    const parsed = CompleteJobSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: 'Validation failed', details: parsed.error.flatten().fieldErrors } },
        { status: 422 }
      );
    }

    const supabase = await createAdminClient();

    // Load existing job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select(`*, quotes(id, total, load_size, ai_estimate, subtotal, tax_rate, load_charge, labor_charge)`)
      .eq('id', id)
      .eq('clerk_user_id', userId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: { message: 'Job not found', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    if (job.status === 'completed') {
      return NextResponse.json(
        { error: { message: 'Job is already completed', code: 'ALREADY_COMPLETED' } },
        { status: 409 }
      );
    }

    if (job.status === 'cancelled') {
      return NextResponse.json(
        { error: { message: 'Cannot complete a cancelled job', code: 'JOB_CANCELLED' } },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const {
      actual_hours,
      actual_dump_fee,
      actual_revenue,
      actual_cubic_yards,
      completion_notes,
      after_photos,
      customer_signature,
    } = parsed.data;

    // Calculate profit metrics
    const quote = job.quotes as Record<string, unknown> | null;
    const estimatedRevenue = Number(quote?.total ?? 0);
    const revenueVariance = actual_revenue - estimatedRevenue;
    const estimatedCubicYards = Number((quote?.load_size as Record<string, unknown>)?.cubic_yards ?? 0);
    const cubicYardsVariance = actual_cubic_yards - estimatedCubicYards;
    const profit = actual_revenue - actual_dump_fee;
    const profitMargin = actual_revenue > 0 ? profit / actual_revenue : 0;

    // Update job to completed
    const { data: completedJob, error: updateError } = await supabase
      .from('jobs')
      .update({
        status: 'completed',
        actual_start: job.scheduled_date ? `${job.scheduled_date}T${job.scheduled_time ?? '08:00'}:00.000Z` : now,
        actual_end: now,
        actual_hours,
        actual_dump_fee,
        actual_cubic_yards,
        customer_signature: customer_signature ?? null,
        after_photos: after_photos ?? [],
        notes: completion_notes
          ? `${job.notes ? job.notes + '\n\n' : ''}Completion notes: ${completion_notes}`
          : job.notes,
        updated_at: now,
      })
      .eq('id', id)
      .eq('clerk_user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('[jobs/complete] Failed to update job:', updateError.message);
      return NextResponse.json({ error: { message: updateError.message } }, { status: 500 });
    }

    // Update customer totals
    const { data: customer } = await supabase
      .from('customers')
      .select('id, total_jobs, total_revenue')
      .eq('id', job.customer_id)
      .single();

    if (customer) {
      const newTotalJobs = (Number(customer.total_jobs) || 0) + 1;
      const newTotalRevenue = (Number(customer.total_revenue) || 0) + actual_revenue;

      await supabase
        .from('customers')
        .update({
          status: 'completed',
          total_jobs: newTotalJobs,
          total_revenue: newTotalRevenue,
          updated_at: now,
        })
        .eq('id', job.customer_id)
        .eq('clerk_user_id', userId);
    }

    // Save AI learning data for model improvement
    const learningPayload = {
      clerk_user_id: userId,
      job_id: id,
      quote_id: job.quote_id ?? null,
      customer_id: job.customer_id,

      // Estimates (what we predicted)
      estimated_revenue: estimatedRevenue,
      estimated_cubic_yards: estimatedCubicYards,
      estimated_labor_hours: job.quotes
        ? Number((job.quotes as Record<string, unknown>).labor_charge ?? 0) /
          Math.max(1, Number((job.quotes as Record<string, unknown>).labor_charge ?? 1))
        : null,

      // Actuals (what really happened)
      actual_revenue,
      actual_cubic_yards,
      actual_hours,
      actual_dump_fee,

      // Variance data
      revenue_variance: revenueVariance,
      cubic_yards_variance: cubicYardsVariance,
      profit,
      profit_margin: profitMargin,

      // AI estimate reference
      ai_estimate: quote?.ai_estimate ?? null,

      recorded_at: now,
    };

    // Save learning data — fire and forget (non-blocking)
    void Promise.resolve(
      supabase.from('job_completion_data').insert(learningPayload)
    ).catch((err: unknown) => {
      console.warn('[jobs/complete] Failed to save learning data:', err);
    });

    // Create notification
    void Promise.resolve(
      supabase.from('notifications').insert({
        clerk_user_id: userId,
        type: 'job_completed',
        title: 'Job completed',
        message: `Job "${job.title}" completed. Revenue: $${actual_revenue.toFixed(2)}. Profit margin: ${(profitMargin * 100).toFixed(1)}%.`,
        reference_id: id,
        reference_type: 'job',
        read: false,
      })
    ).catch(() => {});

    return NextResponse.json({
      data: {
        job: completedJob,
        summary: {
          actual_revenue,
          actual_hours,
          actual_dump_fee,
          actual_cubic_yards,
          profit,
          profit_margin: Math.round(profitMargin * 1000) / 10, // as percentage
          revenue_variance: revenueVariance,
          cubic_yards_variance: cubicYardsVariance,
        },
      },
      error: null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    console.error('[jobs/complete] Unhandled:', msg);
    return NextResponse.json({ error: { message: msg } }, { status: 500 });
  }
}
