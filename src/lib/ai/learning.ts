// =============================================================================
// HAULR AI ESTIMATOR — AI LEARNING SYSTEM
// Records job completion data and improves future estimates based on accuracy
// =============================================================================

import { createClient } from '@/lib/supabase/server';
import type { AIEstimate } from '@/types';

// =============================================================================
// TYPES
// =============================================================================

export interface CompletedJob {
  jobId: string;
  userId: string;
  quoteId: string;

  // What the AI estimated
  aiEstimate: {
    cubicYards: number;
    laborHours: number;
    dumpFee: number;
    totalPrice: number;
  };

  // What actually happened
  actualOutcome: {
    cubicYards: number;
    laborHours: number;
    dumpFee: number;
    finalPrice: number;
  };

  // Job metadata
  completedAt: string;
  jobCategory?: string;
  notes?: string;
}

export interface MetricAccuracy {
  averageRatio: number;       // actual / estimated — 1.0 = perfect
  averageErrorPct: number;    // abs % error, e.g. 0.12 = 12% off
  sampleCount: number;
  trend: 'improving' | 'stable' | 'degrading';
}

export interface AccuracyStats {
  userId: string;
  cubicYards: MetricAccuracy;
  laborHours: MetricAccuracy;
  dumpFee: MetricAccuracy;
  totalPrice: MetricAccuracy;
  overallAccuracyPct: number; // 0–100, higher is better
  jobsAnalyzed: number;
  lastUpdated: string;
}

// =============================================================================
// RECORD JOB COMPLETION
// =============================================================================

/**
 * Records a completed job's actual vs estimated metrics for AI learning.
 * Upserts into the job_accuracy table keyed by jobId.
 */
export async function recordJobCompletion(job: CompletedJob): Promise<void> {
  const supabase = await createClient();

  const cubicYardsRatio =
    job.actualOutcome.cubicYards > 0 && job.aiEstimate.cubicYards > 0
      ? job.actualOutcome.cubicYards / job.aiEstimate.cubicYards
      : 1;

  const laborHoursRatio =
    job.actualOutcome.laborHours > 0 && job.aiEstimate.laborHours > 0
      ? job.actualOutcome.laborHours / job.aiEstimate.laborHours
      : 1;

  const dumpFeeRatio =
    job.actualOutcome.dumpFee > 0 && job.aiEstimate.dumpFee > 0
      ? job.actualOutcome.dumpFee / job.aiEstimate.dumpFee
      : 1;

  const priceRatio =
    job.actualOutcome.finalPrice > 0 && job.aiEstimate.totalPrice > 0
      ? job.actualOutcome.finalPrice / job.aiEstimate.totalPrice
      : 1;

  const { error } = await supabase.from('job_accuracy').upsert({
    job_id: job.jobId,
    user_id: job.userId,
    quote_id: job.quoteId,

    // AI estimates
    estimated_cubic_yards: job.aiEstimate.cubicYards,
    estimated_labor_hours: job.aiEstimate.laborHours,
    estimated_dump_fee: job.aiEstimate.dumpFee,
    estimated_total_price: job.aiEstimate.totalPrice,

    // Actual outcomes
    actual_cubic_yards: job.actualOutcome.cubicYards,
    actual_labor_hours: job.actualOutcome.laborHours,
    actual_dump_fee: job.actualOutcome.dumpFee,
    actual_final_price: job.actualOutcome.finalPrice,

    // Computed accuracy ratios
    cubic_yards_ratio: Math.round(cubicYardsRatio * 10000) / 10000,
    labor_hours_ratio: Math.round(laborHoursRatio * 10000) / 10000,
    dump_fee_ratio: Math.round(dumpFeeRatio * 10000) / 10000,
    price_ratio: Math.round(priceRatio * 10000) / 10000,

    // Metadata
    job_category: job.jobCategory ?? null,
    notes: job.notes ?? null,
    completed_at: job.completedAt,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error('[AI Learning] Failed to record job completion:', error);
    throw new Error(`Failed to record job completion: ${error.message}`);
  }
}

// =============================================================================
// GET ESTIMATE ACCURACY
// =============================================================================

/**
 * Returns average accuracy statistics for a user's completed jobs.
 * Uses the last 50 jobs to keep stats recent and relevant.
 */
export async function getEstimateAccuracy(userId: string): Promise<AccuracyStats> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('job_accuracy')
    .select(
      'cubic_yards_ratio, labor_hours_ratio, dump_fee_ratio, price_ratio, completed_at'
    )
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[AI Learning] Failed to fetch accuracy stats:', error);
    // Return neutral stats (1.0 ratios = no correction needed)
    return buildNeutralStats(userId);
  }

  if (!data || data.length === 0) {
    return buildNeutralStats(userId);
  }

  // Calculate per-metric stats
  const cubicYards = computeMetricAccuracy(
    data.map((r) => r.cubic_yards_ratio),
    data.slice(0, 10).map((r) => r.cubic_yards_ratio)
  );

  const laborHours = computeMetricAccuracy(
    data.map((r) => r.labor_hours_ratio),
    data.slice(0, 10).map((r) => r.labor_hours_ratio)
  );

  const dumpFee = computeMetricAccuracy(
    data.map((r) => r.dump_fee_ratio),
    data.slice(0, 10).map((r) => r.dump_fee_ratio)
  );

  const totalPrice = computeMetricAccuracy(
    data.map((r) => r.price_ratio),
    data.slice(0, 10).map((r) => r.price_ratio)
  );

  // Overall accuracy: inverse of average error across all metrics
  const avgError =
    (cubicYards.averageErrorPct +
      laborHours.averageErrorPct +
      dumpFee.averageErrorPct +
      totalPrice.averageErrorPct) /
    4;

  const overallAccuracyPct = Math.round(Math.max(0, (1 - avgError) * 100));

  return {
    userId,
    cubicYards,
    laborHours,
    dumpFee,
    totalPrice,
    overallAccuracyPct,
    jobsAnalyzed: data.length,
    lastUpdated: new Date().toISOString(),
  };
}

// =============================================================================
// IMPROVE ESTIMATE WITH HISTORY
// =============================================================================

/**
 * Applies historical correction factors to an AI estimate.
 * For example, if the AI consistently underestimates cubic yards by 15%,
 * this function multiplies the cubic yards estimate by 1.15.
 *
 * Only applies corrections when:
 * 1. There are at least 5 historical jobs (MIN_SAMPLES)
 * 2. The correction factor is between 0.5 and 2.0 (sanity bounds)
 * 3. The error is meaningful (> 5%)
 */
export function improveEstimateWithHistory(
  aiEstimate: AIEstimate,
  accuracy: AccuracyStats
): AIEstimate {
  const MIN_SAMPLES = 5;
  const MIN_ERROR_TO_CORRECT = 0.05; // 5% — don't correct tiny errors
  const MAX_CORRECTION = 2.0;
  const MIN_CORRECTION = 0.5;

  if (accuracy.jobsAnalyzed < MIN_SAMPLES) {
    // Not enough data — return original estimate unchanged
    return aiEstimate;
  }

  const improved = { ...aiEstimate };

  // --- Cubic yards correction ---
  const cyError = accuracy.cubicYards.averageErrorPct;
  const cyRatio = accuracy.cubicYards.averageRatio;
  if (
    cyError > MIN_ERROR_TO_CORRECT &&
    cyRatio >= MIN_CORRECTION &&
    cyRatio <= MAX_CORRECTION
  ) {
    improved.total_cubic_yards =
      Math.round(aiEstimate.total_cubic_yards * cyRatio * 100) / 100;
    improved.truck_percentage = Math.min(
      100,
      Math.round(improved.total_cubic_yards / 15 * 100)
    );
  }

  // --- Labor hours correction ---
  const lhError = accuracy.laborHours.averageErrorPct;
  const lhRatio = accuracy.laborHours.averageRatio;
  if (
    lhError > MIN_ERROR_TO_CORRECT &&
    lhRatio >= MIN_CORRECTION &&
    lhRatio <= MAX_CORRECTION
  ) {
    improved.estimated_labor_hours =
      Math.round(aiEstimate.estimated_labor_hours * lhRatio * 10) / 10;
  }

  // --- Dump fee correction ---
  const dfError = accuracy.dumpFee.averageErrorPct;
  const dfRatio = accuracy.dumpFee.averageRatio;
  if (
    dfError > MIN_ERROR_TO_CORRECT &&
    dfRatio >= MIN_CORRECTION &&
    dfRatio <= MAX_CORRECTION
  ) {
    improved.estimated_dump_cost =
      Math.round(aiEstimate.estimated_dump_cost * dfRatio);
  }

  // --- Price correction ---
  const priceError = accuracy.totalPrice.averageErrorPct;
  const priceRatio = accuracy.totalPrice.averageRatio;
  if (
    priceError > MIN_ERROR_TO_CORRECT &&
    priceRatio >= MIN_CORRECTION &&
    priceRatio <= MAX_CORRECTION
  ) {
    improved.suggested_price = Math.round(aiEstimate.suggested_price * priceRatio);
  }

  // Add note about learning correction if any were applied
  const corrections: string[] = [];
  if (improved.total_cubic_yards !== aiEstimate.total_cubic_yards) {
    corrections.push(`volume ×${cyRatio.toFixed(2)}`);
  }
  if (improved.estimated_labor_hours !== aiEstimate.estimated_labor_hours) {
    corrections.push(`labor ×${lhRatio.toFixed(2)}`);
  }
  if (improved.estimated_dump_cost !== aiEstimate.estimated_dump_cost) {
    corrections.push(`dump fee ×${dfRatio.toFixed(2)}`);
  }
  if (improved.suggested_price !== aiEstimate.suggested_price) {
    corrections.push(`price ×${priceRatio.toFixed(2)}`);
  }

  if (corrections.length > 0) {
    improved.analysis_notes = [
      aiEstimate.analysis_notes,
      `[Learning AI] Applied historical corrections based on ${accuracy.jobsAnalyzed} jobs: ${corrections.join(', ')}.`,
    ]
      .filter(Boolean)
      .join(' ');
  }

  return improved;
}

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

function computeMetricAccuracy(
  allRatios: number[],
  recentRatios: number[]
): MetricAccuracy {
  const valid = allRatios.filter((r) => r > 0 && isFinite(r));
  if (valid.length === 0) {
    return { averageRatio: 1, averageErrorPct: 0, sampleCount: 0, trend: 'stable' };
  }

  const avgRatio = valid.reduce((a, b) => a + b, 0) / valid.length;
  const avgError = valid.reduce((a, b) => a + Math.abs(b - 1), 0) / valid.length;

  // Trend: compare recent average error to overall average error
  const validRecent = recentRatios.filter((r) => r > 0 && isFinite(r));
  let trend: MetricAccuracy['trend'] = 'stable';
  if (validRecent.length >= 3) {
    const recentError =
      validRecent.reduce((a, b) => a + Math.abs(b - 1), 0) / validRecent.length;
    const diff = recentError - avgError;
    if (diff < -0.03) trend = 'improving';
    else if (diff > 0.03) trend = 'degrading';
  }

  return {
    averageRatio: Math.round(avgRatio * 10000) / 10000,
    averageErrorPct: Math.round(avgError * 10000) / 10000,
    sampleCount: valid.length,
    trend,
  };
}

function buildNeutralStats(userId: string): AccuracyStats {
  const neutral: MetricAccuracy = {
    averageRatio: 1,
    averageErrorPct: 0,
    sampleCount: 0,
    trend: 'stable',
  };
  return {
    userId,
    cubicYards: neutral,
    laborHours: neutral,
    dumpFee: neutral,
    totalPrice: neutral,
    overallAccuracyPct: 100,
    jobsAnalyzed: 0,
    lastUpdated: new Date().toISOString(),
  };
}
