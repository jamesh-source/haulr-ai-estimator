'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import {
  DollarSign,
  TrendingUp,
  Briefcase,
  FileText,
  Sparkles,
  UserPlus,
  CalendarPlus,
  MapPin,
  Clock,
  UserCircle,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RevenueChart, type RevenueDataPoint } from '@/components/dashboard/RevenueChart';
import { TodaysJobs, type TodayJob } from '@/components/dashboard/TodaysJobs';
import { formatCurrency, getStatusColor, getStatusLabel, cn } from '@/lib/utils';
import type { Customer } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardStats {
  revenueThisMonth: number;
  revenuePctChange: number;
  profitThisMonth: number;
  profitPctChange: number;
  jobsCompleted: number;
  jobsPctChange: number;
  pendingQuotes: number;
}

interface RecentLead extends Pick<Customer, 'id' | 'name' | 'phone' | 'status' | 'lead_source' | 'created_at'> {
  address: string;
}

// ---------------------------------------------------------------------------
// Greeting helper
// ---------------------------------------------------------------------------

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// ---------------------------------------------------------------------------
// Loading skeleton for stats row
// ---------------------------------------------------------------------------

function StatsRowSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-9 w-9 bg-gray-200 rounded-lg" />
          </div>
          <div className="h-8 w-32 bg-gray-200 rounded mb-2" />
          <div className="h-12 bg-gray-100 rounded" />
          <div className="h-3 w-20 bg-gray-100 rounded mt-2" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quick actions
// ---------------------------------------------------------------------------

const QUICK_ACTIONS = [
  {
    label: 'New Estimate',
    href: '/estimator',
    icon: Sparkles,
    color: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  {
    label: 'Add Customer',
    href: '/customers/new',
    icon: UserPlus,
    color: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200',
  },
  {
    label: 'Schedule Job',
    href: '/schedule',
    icon: CalendarPlus,
    color: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200',
  },
  {
    label: 'View Route',
    href: '/route',
    icon: MapPin,
    color: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200',
  },
];

// ---------------------------------------------------------------------------
// Recent Leads row
// ---------------------------------------------------------------------------

function RecentLeadRow({ lead }: { lead: RecentLead }) {
  return (
    <Link
      href={`/customers/${lead.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
        {lead.name
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{lead.name}</p>
        <p className="text-xs text-gray-500 truncate">{lead.address || 'No address'}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
            getStatusColor(lead.status)
          )}
        >
          {getStatusLabel(lead.status)}
        </span>
        <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Dashboard page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const { user } = useUser();
  const supabase = createClient();

  const [statsLoading, setStatsLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);

  const [stats, setStats] = useState<DashboardStats>({
    revenueThisMonth: 0,
    revenuePctChange: 0,
    profitThisMonth: 0,
    profitPctChange: 0,
    jobsCompleted: 0,
    jobsPctChange: 0,
    pendingQuotes: 0,
  });
  const [todaysJobs, setTodaysJobs] = useState<TodayJob[]>([]);
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
  const [chartData, setChartData] = useState<RevenueDataPoint[]>([]);
  const [revenueSparkline, setRevenueSparkline] = useState<{ value: number }[]>([]);

  const firstName = user?.firstName ?? user?.username ?? 'there';
  const greeting = getGreeting();
  const today = format(new Date(), 'EEEE, MMMM d, yyyy');

  // ------------------------------------------------------------------
  // Fetch dashboard stats
  // ------------------------------------------------------------------
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

      // Revenue & jobs this month (from completed jobs joined to quotes)
      const { data: thisMonthJobs } = await supabase
        .from('jobs')
        .select('id, quote_id, quotes(total)')
        .eq('status', 'completed')
        .gte('updated_at', startOfMonth);

      const { data: lastMonthJobs } = await supabase
        .from('jobs')
        .select('id, quote_id, quotes(total)')
        .eq('status', 'completed')
        .gte('updated_at', startOfLastMonth)
        .lte('updated_at', endOfLastMonth);

      const sumRevenue = (jobs: typeof thisMonthJobs) =>
        (jobs ?? []).reduce((acc, j) => {
          const q = j.quotes as { total?: number } | null;
          return acc + (q?.total ?? 0);
        }, 0);

      const revThis = sumRevenue(thisMonthJobs);
      const revLast = sumRevenue(lastMonthJobs);
      const revPct = revLast > 0 ? ((revThis - revLast) / revLast) * 100 : 0;

      const jobsThis = (thisMonthJobs ?? []).length;
      const jobsLast = (lastMonthJobs ?? []).length;
      const jobsPct = jobsLast > 0 ? ((jobsThis - jobsLast) / jobsLast) * 100 : 0;

      // Estimate profit at 35% margin
      const profitThis = revThis * 0.35;
      const profitLast = revLast * 0.35;
      const profitPct = profitLast > 0 ? ((profitThis - profitLast) / profitLast) * 100 : 0;

      // Pending quotes
      const { count: pendingCount } = await supabase
        .from('quotes')
        .select('id', { count: 'exact', head: true })
        .in('status', ['draft', 'sent']);

      setStats({
        revenueThisMonth: revThis,
        revenuePctChange: revPct,
        profitThisMonth: profitThis,
        profitPctChange: profitPct,
        jobsCompleted: jobsThis,
        jobsPctChange: jobsPct,
        pendingQuotes: pendingCount ?? 0,
      });
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [supabase]);

  // ------------------------------------------------------------------
  // Fetch today's jobs
  // ------------------------------------------------------------------
  const fetchTodaysJobs = useCallback(async () => {
    setJobsLoading(true);
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');

      const { data } = await supabase
        .from('jobs')
        .select(
          `
          id,
          status,
          scheduled_time,
          scheduled_date,
          crew_ids,
          customers (name, address, city, state),
          trucks (name),
          quotes (total)
        `
        )
        .eq('scheduled_date', todayStr)
        .in('status', ['scheduled', 'in_progress', 'completed'])
        .order('scheduled_time', { ascending: true });

      const mapped: TodayJob[] = (data ?? []).map((j: any) => ({
        id: j.id,
        customer_name: j.customers?.name ?? 'Unknown',
        address: j.customers
          ? `${j.customers.address}, ${j.customers.city}, ${j.customers.state}`
          : '',
        scheduled_time: j.scheduled_time ?? '00:00',
        scheduled_date: j.scheduled_date ?? todayStr,
        status: j.status,
        crew: Array.isArray(j.crew_ids) ? j.crew_ids : [],
        truck: j.trucks?.name,
        quote_total: j.quotes?.total,
      }));

      setTodaysJobs(mapped);
    } catch (err) {
      console.error('Failed to fetch today\'s jobs:', err);
    } finally {
      setJobsLoading(false);
    }
  }, [supabase]);

  // ------------------------------------------------------------------
  // Fetch recent leads
  // ------------------------------------------------------------------
  const fetchRecentLeads = useCallback(async () => {
    setLeadsLoading(true);
    try {
      const { data } = await supabase
        .from('customers')
        .select('id, name, phone, address, city, state, status, lead_source, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      const mapped: RecentLead[] = (data ?? []).map((c: any) => ({
        id: c.id,
        name: c.name,
        phone: c.phone ?? '',
        address: c.address ? `${c.address}, ${c.city}, ${c.state}` : '',
        status: c.status,
        lead_source: c.lead_source,
        created_at: c.created_at,
      }));

      setRecentLeads(mapped);
    } catch (err) {
      console.error('Failed to fetch recent leads:', err);
    } finally {
      setLeadsLoading(false);
    }
  }, [supabase]);

  // ------------------------------------------------------------------
  // Fetch 30-day revenue chart data
  // ------------------------------------------------------------------
  const fetchChartData = useCallback(async () => {
    setChartLoading(true);
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

      const { data } = await supabase
        .from('jobs')
        .select('updated_at, quotes(total)')
        .eq('status', 'completed')
        .gte('updated_at', thirtyDaysAgo.toISOString())
        .order('updated_at', { ascending: true });

      // Build a date map for 30 days
      const dateMap: Record<string, { revenue: number; jobs: number }> = {};
      for (let i = 0; i < 30; i++) {
        const d = new Date(thirtyDaysAgo);
        d.setDate(d.getDate() + i);
        const key = format(d, 'yyyy-MM-dd');
        dateMap[key] = { revenue: 0, jobs: 0 };
      }

      // Aggregate
      (data ?? []).forEach((j: any) => {
        const key = format(new Date(j.updated_at), 'yyyy-MM-dd');
        if (dateMap[key]) {
          const q = j.quotes as { total?: number } | null;
          dateMap[key].revenue += q?.total ?? 0;
          dateMap[key].jobs += 1;
        }
      });

      const points: RevenueDataPoint[] = Object.entries(dateMap).map(([date, vals]) => ({
        date,
        revenue: vals.revenue,
        jobs: vals.jobs,
      }));

      setChartData(points);
      setRevenueSparkline(points.map((p) => ({ value: p.revenue })));
    } catch (err) {
      console.error('Failed to fetch chart data:', err);
    } finally {
      setChartLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void fetchStats();
    void fetchTodaysJobs();
    void fetchRecentLeads();
    void fetchChartData();
  }, [fetchStats, fetchTodaysJobs, fetchRecentLeads, fetchChartData]);

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Greeting header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-sm shadow-blue-200">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">
              {greeting}, {firstName}!
            </h1>
            <p className="mt-1 text-blue-100 text-sm">{today}</p>
            <p className="mt-2 text-blue-50 text-sm">
              {todaysJobs.length > 0
                ? `You have ${todaysJobs.length} job${todaysJobs.length > 1 ? 's' : ''} scheduled today.`
                : "You have no jobs scheduled today. A great day to close some quotes!"}
            </p>
          </div>
          <div className="hidden sm:flex items-center justify-center w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
        </div>
      </div>

      {/* Stats row */}
      {statsLoading ? (
        <StatsRowSkeleton />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Revenue This Month"
            value={formatCurrency(stats.revenueThisMonth)}
            change={stats.revenuePctChange}
            icon={DollarSign}
            iconColor="text-green-600"
            iconBg="bg-green-50"
            sparklineData={revenueSparkline}
            sparklineColor="#16a34a"
          />
          <StatsCard
            title="Profit This Month"
            value={formatCurrency(stats.profitThisMonth)}
            change={stats.profitPctChange}
            icon={TrendingUp}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
          />
          <StatsCard
            title="Jobs Completed"
            value={stats.jobsCompleted}
            change={stats.jobsPctChange}
            icon={Briefcase}
            iconColor="text-purple-600"
            iconBg="bg-purple-50"
          />
          <StatsCard
            title="Pending Quotes"
            value={stats.pendingQuotes}
            icon={FileText}
            iconColor="text-orange-600"
            iconBg="bg-orange-50"
          />
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm',
                  action.color
                )}
              >
                <Icon className="w-4 h-4" />
                {action.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Today's Jobs + Recent Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Jobs */}
        <TodaysJobs jobs={todaysJobs} loading={jobsLoading} />

        {/* Recent Leads */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <UserCircle className="w-4.5 h-4.5 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">Recent Leads</h2>
            </div>
            <Link
              href="/customers"
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              View all
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {leadsLoading ? (
            <div className="divide-y divide-gray-100">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-gray-200 rounded mb-1" />
                    <div className="h-3 w-48 bg-gray-100 rounded" />
                  </div>
                  <div className="h-5 w-16 bg-gray-100 rounded-full" />
                </div>
              ))}
            </div>
          ) : recentLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-6">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <UserCircle className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-700">No customers yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Add your first customer to get started.
              </p>
              <Link
                href="/customers/new"
                className="mt-3 inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Add Customer
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentLeads.map((lead) => (
                <RecentLeadRow key={lead.id} lead={lead} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Revenue Chart */}
      <RevenueChart data={chartData} loading={chartLoading} />
    </div>
  );
}
