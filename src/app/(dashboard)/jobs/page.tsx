'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Filter,
  CalendarDays,
  TrendingUp,
  CheckCircle2,
  Loader2,
  Eye,
  Play,
  ChevronDown,
  DollarSign,
  Briefcase,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ScheduledJob, JobStatus } from '@/types';
import { JOB_STATUSES } from '@/lib/constants';
import { format, parseISO, isToday, isThisWeek, isThisMonth } from 'date-fns';

// ---------------------------------------------------------------------------
// Mock data (replace with Supabase fetch)
// ---------------------------------------------------------------------------

const MOCK_JOBS: ScheduledJob[] = [
  {
    id: 'j1', customer_id: 'c1', title: 'Full Home Cleanout', description: '3BR home', status: 'completed',
    scheduled_date: '2026-06-20', scheduled_time: '08:00', truck_id: 't1', crew_ids: ['cr1', 'cr2'],
    customer: { id: 'c1', name: 'Sarah Mitchell', email: '', phone: '5125550001', address: '4512 Oak Blvd', city: 'Austin', state: 'TX', zip: '78745', status: 'completed', lead_source: 'google', created_at: '', updated_at: '' },
    truck: { id: 't1', name: 'Truck 1', make: 'Ford', model: 'F-750', year: 2021, license_plate: 'HLR-001', max_cubic_yards: 15, status: 'active' },
    crew: [{ id: 'cr1', name: 'Marcus Johnson', email: '', phone: '', role: 'lead', status: 'active' }, { id: 'cr2', name: 'Tyler Reeves', email: '', phone: '', role: 'worker', status: 'active' }],
    quote: { id: 'q1', customer_id: 'c1', quote_number: 'Q-001', status: 'approved', load_size: { fraction: 'full', cubic_yards: 15, truck_percentage: 100 }, base_charge: 0, load_charge: 599, distance_charge: 0, labor_charge: 0, heavy_item_fees: 0, stair_fees: 0, specialty_fees: 0, construction_fees: 0, custom_fees: [], discounts: [], subtotal: 599, tax_rate: 0.0825, tax_amount: 49.42, total: 648.42, created_at: '', updated_at: '' },
    actual_hours: 4, created_at: '', updated_at: '',
  },
  {
    id: 'j2', customer_id: 'c2', title: 'Garage Cleanout', status: 'in_progress',
    scheduled_date: new Date().toISOString().split('T')[0], scheduled_time: '13:00', truck_id: 't2', crew_ids: ['cr3'],
    actual_start: new Date().toISOString(),
    customer: { id: 'c2', name: 'Robert Okafor', email: '', phone: '5125550002', address: '1234 Pecan St', city: 'Austin', state: 'TX', zip: '78701', status: 'in_progress', lead_source: 'referral', created_at: '', updated_at: '' },
    truck: { id: 't2', name: 'Truck 2', make: 'Chevy', model: 'C5500', year: 2019, license_plate: 'HLR-002', max_cubic_yards: 12, status: 'active' },
    crew: [{ id: 'cr3', name: 'Devon Williams', email: '', phone: '', role: 'worker', status: 'active' }],
    quote: { id: 'q2', customer_id: 'c2', quote_number: 'Q-002', status: 'approved', load_size: { fraction: '1/2', cubic_yards: 7.5, truck_percentage: 50 }, base_charge: 0, load_charge: 299, distance_charge: 0, labor_charge: 0, heavy_item_fees: 0, stair_fees: 0, specialty_fees: 0, construction_fees: 0, custom_fees: [], discounts: [], subtotal: 299, tax_rate: 0.0825, tax_amount: 24.67, total: 323.67, created_at: '', updated_at: '' },
    created_at: '', updated_at: '',
  },
  {
    id: 'j3', customer_id: 'c3', title: 'Office Furniture Removal', status: 'scheduled',
    scheduled_date: new Date().toISOString().split('T')[0], scheduled_time: '09:00', truck_id: 't1', crew_ids: ['cr1', 'cr4'],
    customer: { id: 'c3', name: 'Elena Vasquez', email: '', phone: '5125550003', address: '7890 Congress Ave', city: 'Austin', state: 'TX', zip: '78704', status: 'scheduled', lead_source: 'google', created_at: '', updated_at: '' },
    truck: { id: 't1', name: 'Truck 1', make: 'Ford', model: 'F-750', year: 2021, license_plate: 'HLR-001', max_cubic_yards: 15, status: 'active' },
    crew: [{ id: 'cr1', name: 'Marcus Johnson', email: '', phone: '', role: 'lead', status: 'active' }, { id: 'cr4', name: 'Ashley Chen', email: '', phone: '', role: 'lead', status: 'active' }],
    quote: { id: 'q3', customer_id: 'c3', quote_number: 'Q-003', status: 'approved', load_size: { fraction: '3/4', cubic_yards: 11.25, truck_percentage: 75 }, base_charge: 0, load_charge: 439, distance_charge: 25, labor_charge: 0, heavy_item_fees: 75, stair_fees: 0, specialty_fees: 0, construction_fees: 0, custom_fees: [], discounts: [], subtotal: 539, tax_rate: 0.0825, tax_amount: 44.47, total: 583.47, created_at: '', updated_at: '' },
    created_at: '', updated_at: '',
  },
  {
    id: 'j4', customer_id: 'c4', title: 'Estate Cleanout', status: 'quoted',
    customer: { id: 'c4', name: 'James Patterson', email: '', phone: '5125550004', address: '2200 Riverside Dr', city: 'Austin', state: 'TX', zip: '78741', status: 'quoted', lead_source: 'referral', created_at: '', updated_at: '' },
    quote: { id: 'q4', customer_id: 'c4', quote_number: 'Q-004', status: 'sent', load_size: { fraction: 'full', cubic_yards: 15, truck_percentage: 100 }, base_charge: 0, load_charge: 599, distance_charge: 0, labor_charge: 0, heavy_item_fees: 150, stair_fees: 50, specialty_fees: 0, construction_fees: 0, custom_fees: [], discounts: [], subtotal: 799, tax_rate: 0.0825, tax_amount: 65.92, total: 864.92, created_at: '', updated_at: '' },
    created_at: '', updated_at: '',
  },
  {
    id: 'j5', customer_id: 'c5', title: 'Basement & Attic Cleanout', status: 'completed',
    scheduled_date: '2026-06-15', scheduled_time: '07:30', truck_id: 't1', crew_ids: ['cr1', 'cr2', 'cr3'],
    customer: { id: 'c5', name: 'Patricia Chen', email: '', phone: '5125550005', address: '500 W 5th St', city: 'Austin', state: 'TX', zip: '78701', status: 'completed', lead_source: 'google', created_at: '', updated_at: '' },
    truck: { id: 't1', name: 'Truck 1', make: 'Ford', model: 'F-750', year: 2021, license_plate: 'HLR-001', max_cubic_yards: 15, status: 'active' },
    crew: [{ id: 'cr1', name: 'Marcus Johnson', email: '', phone: '', role: 'lead', status: 'active' }],
    quote: { id: 'q5', customer_id: 'c5', quote_number: 'Q-005', status: 'approved', load_size: { fraction: 'full', cubic_yards: 15, truck_percentage: 100 }, base_charge: 0, load_charge: 599, distance_charge: 0, labor_charge: 225, heavy_item_fees: 300, stair_fees: 100, specialty_fees: 0, construction_fees: 0, custom_fees: [], discounts: [], subtotal: 1224, tax_rate: 0.0825, tax_amount: 100.98, total: 1324.98, created_at: '', updated_at: '' },
    actual_hours: 6, created_at: '', updated_at: '',
  },
];

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; color: string }) {
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
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');
  const [crewFilter, setCrewFilter] = useState('all');
  const [truckFilter, setTruckFilter] = useState('all');

  useEffect(() => {
    const timer = setTimeout(() => {
      setJobs(MOCK_JOBS);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Stats
  const stats = useMemo(() => {
    const todayJobs = jobs.filter((j) => j.scheduled_date && isToday(parseISO(j.scheduled_date)));
    const weekJobs = jobs.filter((j) => j.scheduled_date && isThisWeek(parseISO(j.scheduled_date)));
    const completedMonth = jobs.filter((j) => j.status === 'completed' && j.scheduled_date && isThisMonth(parseISO(j.scheduled_date)));
    const revenue = jobs.filter((j) => j.status === 'completed').reduce((sum, j) => sum + (j.quote?.total ?? 0), 0);
    return { todayJobs: todayJobs.length, weekJobs: weekJobs.length, completedMonth: completedMonth.length, revenue };
  }, [jobs]);

  // Filter
  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      const matchSearch = !search ||
        j.title.toLowerCase().includes(search.toLowerCase()) ||
        j.customer?.name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || j.status === statusFilter;
      const matchTruck = truckFilter === 'all' || j.truck_id === truckFilter;
      const matchCrew = crewFilter === 'all' || j.crew_ids?.includes(crewFilter);
      return matchSearch && matchStatus && matchTruck && matchCrew;
    });
  }, [jobs, search, statusFilter, truckFilter, crewFilter]);

  const handleStatusChange = async (jobId: string, newStatus: JobStatus) => {
    setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, status: newStatus } : j));
    // TODO: persist to Supabase
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
        <Link href="/jobs/new">
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
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Job</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Crew</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Truck</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Revenue</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-400">
                    No jobs found. Try adjusting your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{job.title}</p>
                        {job.description && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{job.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-gray-800">{job.customer?.name}</p>
                        <p className="text-xs text-gray-400">{job.customer?.city}, {job.customer?.state}</p>
                      </div>
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
                        {/* Quick status actions */}
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
                    <td className="px-4 py-4">
                      {job.crew && job.crew.length > 0 ? (
                        <div className="flex items-center gap-1">
                          {job.crew.slice(0, 3).map((c) => (
                            <div
                              key={c.id}
                              className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600"
                              title={c.name}
                            >
                              {c.name.charAt(0)}
                            </div>
                          ))}
                          {job.crew.length > 3 && (
                            <span className="text-xs text-gray-400 ml-0.5">+{job.crew.length - 3}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-gray-600 text-xs">
                      {job.truck?.name ?? <span className="text-gray-300 italic">None</span>}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {job.quote?.total ? (
                        <span className="font-semibold text-gray-900">
                          ${job.quote.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
