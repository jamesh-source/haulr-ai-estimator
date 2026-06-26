'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Eye,
  Play,
  ChevronDown,
  DollarSign,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { JobStatus } from '@/types';
import { JOB_STATUSES } from '@/lib/constants';
import { format, parseISO, isToday, isThisWeek, isThisMonth } from 'date-fns';

// ---------------------------------------------------------------------------
// Types for API response
// ---------------------------------------------------------------------------

interface ApiJob {
  id: string;
  job_number?: string;
  status: JobStatus;
  scheduled_date?: string;
  scheduled_time?: string;
  customer_id: string;
  customers?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    address?: string;
    city?: string;
  };
  total_charged?: number;
  quote_id?: string;
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center', color)}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: JobStatus }) {
  const def = JOB_STATUSES.find((s) => s.value === status);
  if (!def) return null;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium', def.color)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', def.dotColor)} />
      {def.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function JobsPage() {
  const [jobs, setJobs] = useState<ApiJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');

  useEffect(() => {
    fetch('/api/jobs')
      .then((r) => r.json())
      .then(({ data }) => { setJobs(data ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Stats
  const stats = useMemo(() => {
    const todayJobs = jobs.filter(
      (j) => j.scheduled_date && isToday(parseISO(j.scheduled_date))
    );
    const weekJobs = jobs.filter(
      (j) => j.scheduled_date && isThisWeek(parseISO(j.scheduled_date))
    );
    const completedMonth = jobs.filter(
      (j) =>
        j.status === 'completed' &&
        j.scheduled_date &&
        isThisMonth(parseISO(j.scheduled_date))
    );
    const revenue = jobs
      .filter((j) => j.status === 'completed')
      .reduce((sum, j) => sum + (j.total_charged ?? 0), 0);
    return {
      todayJobs: todayJobs.length,
      weekJobs: weekJobs.length,
      completedMonth: completedMonth.length,
      revenue,
    };
  }, [jobs]);

  // Filter
  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      const customerName =
        ((j.customers?.first_name ?? '') + ' ' + (j.customers?.last_name ?? '')).trim();
      const matchSearch =
        !search ||
        (j.job_number ?? '').toLowerCase().includes(search.toLowerCase()) ||
        customerName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || j.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [jobs, search, statusFilter]);

  const handleStatusChange = async (jobId: string, newStatus: JobStatus) => {
    // Optimistic update
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
    );
    try {
      await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      // Rollback not implemented — could add toast here
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
          <p className="text-gray-500 text-sm mt-0.5">{jobs.length} total jobs</p>
        </div>
        <Link href="/quotes/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>New Job</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<CalendarDays className="h-5 w-5 text-blue-600" />}
          label="Today's Jobs"
          value={String(stats.todayJobs)}
          sub="scheduled for today"
          color="bg-blue-50"
        />
        <StatCard
          icon={<Briefcase className="h-5 w-5 text-orange-600" />}
          label="This Week"
          value={String(stats.weekJobs)}
          sub="jobs this week"
          color="bg-orange-50"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
          label="Completed This Month"
          value={String(stats.completedMonth)}
          sub="jobs closed out"
          color="bg-green-50"
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5 text-purple-600" />}
          label="Revenue"
          value={`$${stats.revenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          sub="from completed jobs"
          color="bg-purple-50"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs or customers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as JobStatus | 'all')}
              className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            >
              <option value="all">All Statuses</option>
              {JOB_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          </div>

          <div className="text-sm text-gray-500 font-medium ml-auto">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Job #</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Charged</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                    No jobs found. Try adjusting your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((job) => {
                  const customerName =
                    ((job.customers?.first_name ?? '') +
                      ' ' +
                      (job.customers?.last_name ?? '')).trim() || 'Unknown';
                  return (
                    <tr key={job.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900 font-mono text-xs">
                          {job.job_number ?? job.id}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-gray-800">{customerName}</p>
                        {job.customers?.city && (
                          <p className="text-xs text-gray-400">{job.customers.city}</p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-gray-600">
                        {job.scheduled_date ? (
                          <div>
                            <p>{format(parseISO(job.scheduled_date), 'MMM d, yyyy')}</p>
                            {job.scheduled_time && (
                              <p className="text-xs text-gray-400">{job.scheduled_time}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs italic">Unscheduled</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={job.status} />
                          {job.status === 'scheduled' && (
                            <button
                              onClick={() => handleStatusChange(job.id, 'in_progress')}
                              className="opacity-0 group-hover:opacity-100 text-xs font-medium text-amber-600 hover:text-amber-700 transition-opacity"
                            >
                              <Play className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {job.status === 'in_progress' && (
                            <button
                              onClick={() => handleStatusChange(job.id, 'completed')}
                              className="opacity-0 group-hover:opacity-100 text-xs font-medium text-green-600 hover:text-green-700 transition-opacity"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        {job.total_charged != null ? (
                          <span className="font-semibold text-gray-900">
                            ${job.total_charged.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
