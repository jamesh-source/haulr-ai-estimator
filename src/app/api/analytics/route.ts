// =============================================================================
// GET /api/analytics â€” Analytics data endpoint
// =============================================================================

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface RevenueByDay {
  date: string;
  revenue: number;
  jobs: number;
}

interface JobsByStatus {
  status: string;
  count: number;
}

interface LeadSourceBreakdown {
  source: string;
  count: number;
  revenue: number;
}

interface AnalyticsResult {
  revenue_by_day: RevenueByDay[];
  jobs_by_status: JobsByStatus[];
  avg_ticket: number;
  profit_margin: number;
  lead_sources: LeadSourceBreakdown[];
  total_revenue: number;
  total_jobs: number;
  total_quotes: number;
  conversion_rate: number;
  avg_cubic_yards: number;
  top_items: Array<{ name: string; count: number }>;
  period: {
    start: string;
    end: string;
    days: number;
  };
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function parseDate(dateStr: string | null, fallbackDaysBack: number): string {
  if (dateStr) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  const d = new Date();
  d.setDate(d.getDate() - fallbackDaysBack);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

// -----------------------------------------------------------------------------
// GET /api/analytics
// -----------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const supabase = await createAdminClient();
    const { searchParams } = new URL(request.url);

    const startDate = parseDate(searchParams.get('start_date'), 30);
    const endDate = parseDate(searchParams.get('end_date'), 0);
    const metric = searchParams.get('metric') ?? 'all';

    // Validate date range
    const diffDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000);
    if (diffDays < 0) {
      return NextResponse.json(
        { error: { message: 'start_date must be before end_date', code: 'INVALID_DATE_RANGE' } },
        { status: 422 }
      );
    }

    // Clamp to max 365 days
    const safeStart = diffDays > 365
      ? new Date(new Date(endDate).getTime() - 365 * 86400000).toISOString()
      : startDate;

    // â”€â”€ Completed jobs in range â”€â”€
    const { data: completedJobs } = await supabase
      .from('jobs')
      .select(`
        id,
        status,
        created_at,
        updated_at,
        actual_hours,
        actual_dump_fee,
        actual_cubic_yards,
        customer_id,
        customers(lead_source)
      `)
      .eq('clerk_user_id', userId)
      .eq('status', 'completed')
      .gte('updated_at', safeStart)
      .lte('updated_at', endDate);

    // â”€â”€ Job completion data (revenue actuals) â”€â”€
    const { data: completionData } = await supabase
      .from('job_completion_data')
      .select('job_id, actual_revenue, actual_dump_fee, actual_cubic_yards, recorded_at')
      .eq('clerk_user_id', userId)
      .gte('recorded_at', safeStart)
      .lte('recorded_at', endDate);

    const revenueByJobId = new Map<string, number>();
    const dumpByJobId = new Map<string, number>();
    for (const cd of completionData ?? []) {
      revenueByJobId.set(cd.job_id, Number(cd.actual_revenue ?? 0));
      dumpByJobId.set(cd.job_id, Number(cd.actual_dump_fee ?? 0));
    }

    // â”€â”€ Build revenue by day â”€â”€
    const revByDay = new Map<string, { revenue: number; jobs: number }>();
    let totalRevenue = 0;
    let totalDumpCost = 0;
    let totalCubicYards = 0;

    for (const job of completedJobs ?? []) {
      const dayKey = (job.updated_at as string).slice(0, 10);
      const revenue = revenueByJobId.get(job.id) ?? 0;
      const dump = dumpByJobId.get(job.id) ?? Number(job.actual_dump_fee ?? 0);
      const cy = Number(job.actual_cubic_yards ?? 0);

      totalRevenue += revenue;
      totalDumpCost += dump;
      totalCubicYards += cy;

      const existing = revByDay.get(dayKey) ?? { revenue: 0, jobs: 0 };
      revByDay.set(dayKey, { revenue: existing.revenue + revenue, jobs: existing.jobs + 1 });
    }

    // Fill in zero-value days for the date range
    const revenueByDay: RevenueByDay[] = [];
    const cur = new Date(safeStart);
    const end = new Date(endDate);
    while (cur <= end) {
      const key = cur.toISOString().slice(0, 10);
      const dayData = revByDay.get(key);
      revenueByDay.push({ date: key, revenue: dayData?.revenue ?? 0, jobs: dayData?.jobs ?? 0 });
      cur.setDate(cur.getDate() + 1);
    }

    // â”€â”€ Jobs by status (all time for context, filtered for range) â”€â”€
    const { data: statusCounts } = await supabase
      .from('jobs')
      .select('status')
      .eq('clerk_user_id', userId)
      .gte('created_at', safeStart)
      .lte('created_at', endDate);

    const statusMap = new Map<string, number>();
    for (const row of statusCounts ?? []) {
      const s = row.status as string;
      statusMap.set(s, (statusMap.get(s) ?? 0) + 1);
    }
    const jobsByStatus: JobsByStatus[] = Array.from(statusMap.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);

    // â”€â”€ Totals â”€â”€
    const totalCompletedJobs = completedJobs?.length ?? 0;
    const avgTicket = totalCompletedJobs > 0 ? totalRevenue / totalCompletedJobs : 0;
    const profitMargin = totalRevenue > 0 ? (totalRevenue - totalDumpCost) / totalRevenue : 0;
    const avgCubicYards = totalCompletedJobs > 0 ? totalCubicYards / totalCompletedJobs : 0;

    // â”€â”€ Quotes in range â”€â”€
    const { count: totalQuotes } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('clerk_user_id', userId)
      .gte('created_at', safeStart)
      .lte('created_at', endDate);

    const conversionRate = (totalQuotes ?? 0) > 0
      ? totalCompletedJobs / (totalQuotes ?? 1)
      : 0;

    // â”€â”€ Lead sources â”€â”€
    const leadSourceMap = new Map<string, { count: number; revenue: number }>();
    for (const job of completedJobs ?? []) {
      const customer = job.customers as unknown as Record<string, string> | null;
      const source = customer?.lead_source ?? 'other';
      const revenue = revenueByJobId.get(job.id) ?? 0;
      const existing = leadSourceMap.get(source) ?? { count: 0, revenue: 0 };
      leadSourceMap.set(source, { count: existing.count + 1, revenue: existing.revenue + revenue });
    }
    const leadSources: LeadSourceBreakdown[] = Array.from(leadSourceMap.entries())
      .map(([source, data]) => ({ source, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    // â”€â”€ AI analysis items (top detected) â”€â”€
    const { data: aiAnalyses } = await supabase
      .from('ai_analysis_results')
      .select('detected_items')
      .eq('clerk_user_id', userId)
      .gte('created_at', safeStart)
      .lte('created_at', endDate)
      .limit(200);

    const itemCountMap = new Map<string, number>();
    for (const analysis of aiAnalyses ?? []) {
      const items = analysis.detected_items as Array<{ name: string; quantity: number }> ?? [];
      for (const item of items) {
        const key = item.name;
        itemCountMap.set(key, (itemCountMap.get(key) ?? 0) + (item.quantity ?? 1));
      }
    }
    const topItems = Array.from(itemCountMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const result: AnalyticsResult = {
      revenue_by_day: revenueByDay,
      jobs_by_status: jobsByStatus,
      avg_ticket: Math.round(avgTicket * 100) / 100,
      profit_margin: Math.round(profitMargin * 10000) / 10000,
      lead_sources: leadSources,
      total_revenue: Math.round(totalRevenue * 100) / 100,
      total_jobs: totalCompletedJobs,
      total_quotes: totalQuotes ?? 0,
      conversion_rate: Math.round(conversionRate * 10000) / 10000,
      avg_cubic_yards: Math.round(avgCubicYards * 100) / 100,
      top_items: topItems,
      period: {
        start: safeStart.slice(0, 10),
        end: endDate.slice(0, 10),
        days: Math.min(365, diffDays),
      },
    };

    // Filter by metric if requested
    if (metric && metric !== 'all') {
      const metricMap: Record<string, unknown> = {
        revenue_by_day: result.revenue_by_day,
        jobs_by_status: result.jobs_by_status,
        avg_ticket: result.avg_ticket,
        profit_margin: result.profit_margin,
        lead_sources: result.lead_sources,
        total_revenue: result.total_revenue,
        top_items: result.top_items,
      };
      if (metric in metricMap) {
        return NextResponse.json({
          data: { [metric]: metricMap[metric], period: result.period },
          error: null,
        });
      }
    }

    return NextResponse.json({ data: result, error: null });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    console.error('[analytics GET] Unhandled:', msg);
    return NextResponse.json({ error: { message: msg } }, { status: 500 });
  }
}
