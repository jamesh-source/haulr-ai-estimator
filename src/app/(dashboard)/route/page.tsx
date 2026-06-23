'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Route,
  Clock,
  Navigation,
  Truck,
  Package,
  ExternalLink,
  Loader2,
  RefreshCw,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RouteMap } from '@/components/route/RouteMap';
import { RouteList, RouteStop } from '@/components/route/RouteList';
import { cn } from '@/lib/utils';
import type { ScheduledJob } from '@/types';
import { format, isToday, parseISO } from 'date-fns';

// ---------------------------------------------------------------------------
// Mock data — replace with Supabase fetch
// ---------------------------------------------------------------------------

const MOCK_ROUTE_JOBS: ScheduledJob[] = [
  {
    id: 'j1', customer_id: 'c1', title: 'Full Home Cleanout', status: 'scheduled',
    scheduled_date: new Date().toISOString().split('T')[0], scheduled_time: '08:00',
    truck_id: 't1', crew_ids: ['cr1', 'cr2'],
    customer: { id: 'c1', name: 'Sarah Mitchell', email: 's@test.com', phone: '5125550101', address: '4512 Oak Blvd', city: 'Austin', state: 'TX', zip: '78745', status: 'scheduled', lead_source: 'google', created_at: '', updated_at: '' },
    truck: { id: 't1', name: 'Truck 1', make: 'Ford', model: 'F-750', year: 2021, license_plate: 'HLR-001', max_cubic_yards: 15, status: 'active' },
    crew: [{ id: 'cr1', name: 'Marcus Johnson', email: '', phone: '', role: 'lead', status: 'active' }, { id: 'cr2', name: 'Tyler Reeves', email: '', phone: '', role: 'worker', status: 'active' }],
    quote: { id: 'q1', customer_id: 'c1', quote_number: 'Q-001', status: 'approved', load_size: { fraction: 'full', cubic_yards: 15, truck_percentage: 100 }, base_charge: 0, load_charge: 599, distance_charge: 0, labor_charge: 0, heavy_item_fees: 0, stair_fees: 0, specialty_fees: 0, construction_fees: 0, custom_fees: [], discounts: [], subtotal: 599, tax_rate: 0, tax_amount: 0, total: 599, created_at: '', updated_at: '', ai_estimate: { estimated_labor_hours: 4, total_cubic_yards: 15, truck_percentage: 100, trailer_percentage: 0, estimated_dump_cost: 90, suggested_price: 599, suggested_profit_margin: 45, hazard_warnings: [], donation_items: [], recycling_items: [], items_detected: [], confidence_score: 0.9, analysis_notes: '' } },
    created_at: '', updated_at: '',
  },
  {
    id: 'j2', customer_id: 'c2', title: 'Garage Cleanout', status: 'scheduled',
    scheduled_date: new Date().toISOString().split('T')[0], scheduled_time: '10:00',
    truck_id: 't1', crew_ids: ['cr1', 'cr2'],
    customer: { id: 'c2', name: 'Robert Okafor', email: 'r@test.com', phone: '5125550102', address: '1234 Pecan St', city: 'Austin', state: 'TX', zip: '78701', status: 'scheduled', lead_source: 'referral', created_at: '', updated_at: '' },
    truck: { id: 't1', name: 'Truck 1', make: 'Ford', model: 'F-750', year: 2021, license_plate: 'HLR-001', max_cubic_yards: 15, status: 'active' },
    crew: [{ id: 'cr1', name: 'Marcus Johnson', email: '', phone: '', role: 'lead', status: 'active' }],
    quote: { id: 'q2', customer_id: 'c2', quote_number: 'Q-002', status: 'approved', load_size: { fraction: '1/2', cubic_yards: 7.5, truck_percentage: 50 }, base_charge: 0, load_charge: 299, distance_charge: 0, labor_charge: 0, heavy_item_fees: 0, stair_fees: 0, specialty_fees: 0, construction_fees: 0, custom_fees: [], discounts: [], subtotal: 299, tax_rate: 0, tax_amount: 0, total: 299, created_at: '', updated_at: '', ai_estimate: { estimated_labor_hours: 2, total_cubic_yards: 7.5, truck_percentage: 50, trailer_percentage: 0, estimated_dump_cost: 60, suggested_price: 299, suggested_profit_margin: 50, hazard_warnings: [], donation_items: [], recycling_items: [], items_detected: [], confidence_score: 0.88, analysis_notes: '' } },
    created_at: '', updated_at: '',
  },
  {
    id: 'j3', customer_id: 'c3', title: 'Office Furniture Removal', status: 'scheduled',
    scheduled_date: new Date().toISOString().split('T')[0], scheduled_time: '13:00',
    truck_id: 't1', crew_ids: ['cr1', 'cr2'],
    customer: { id: 'c3', name: 'Elena Vasquez', email: 'e@test.com', phone: '5125550103', address: '7890 Congress Ave', city: 'Austin', state: 'TX', zip: '78704', status: 'scheduled', lead_source: 'google', created_at: '', updated_at: '' },
    truck: { id: 't1', name: 'Truck 1', make: 'Ford', model: 'F-750', year: 2021, license_plate: 'HLR-001', max_cubic_yards: 15, status: 'active' },
    crew: [{ id: 'cr1', name: 'Marcus Johnson', email: '', phone: '', role: 'lead', status: 'active' }, { id: 'cr2', name: 'Tyler Reeves', email: '', phone: '', role: 'worker', status: 'active' }],
    quote: { id: 'q3', customer_id: 'c3', quote_number: 'Q-003', status: 'approved', load_size: { fraction: '3/4', cubic_yards: 11.25, truck_percentage: 75 }, base_charge: 0, load_charge: 439, distance_charge: 25, labor_charge: 0, heavy_item_fees: 75, stair_fees: 0, specialty_fees: 0, construction_fees: 0, custom_fees: [], discounts: [], subtotal: 539, tax_rate: 0, tax_amount: 0, total: 539, created_at: '', updated_at: '' },
    created_at: '', updated_at: '',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildETA(baseTime: string, addHours: number): string {
  const [h, m] = baseTime.split(':').map(Number);
  const totalMins = h * 60 + m + Math.round(addHours * 60);
  const newH = Math.floor(totalMins / 60) % 24;
  const newM = totalMins % 60;
  const period = newH >= 12 ? 'PM' : 'AM';
  const displayH = newH > 12 ? newH - 12 : newH === 0 ? 12 : newH;
  return `${displayH}:${String(newM).padStart(2, '0')} ${period}`;
}

function buildRouteStops(jobs: ScheduledJob[]): RouteStop[] {
  return jobs.map((job, idx) => {
    const laborHours = job.quote?.ai_estimate?.estimated_labor_hours ?? 2;
    const loadFraction = job.quote?.load_size?.fraction ?? '1/2';
    const prevHours = jobs.slice(0, idx).reduce((sum, j) => sum + (j.quote?.ai_estimate?.estimated_labor_hours ?? 2), 0);

    return {
      job,
      stopNumber: idx + 1,
      eta: job.scheduled_time ? buildETA(job.scheduled_time, 0) : undefined,
      distanceFromPrev: idx === 0 ? undefined : `${(3 + Math.random() * 8).toFixed(1)} mi`,
      loadDescription: `${loadFraction} truck load`,
    };
  });
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function RouteStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
      <div className="h-9 w-9 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Truck utilization bar
// ---------------------------------------------------------------------------

function TruckUtilization({ jobs }: { jobs: ScheduledJob[] }) {
  const totalCapacity = 15; // cu yd
  const totalLoad = jobs.reduce((sum, j) => sum + (j.quote?.load_size?.cubic_yards ?? 0), 0);
  const pct = Math.min(100, Math.round((totalLoad / totalCapacity) * 100));

  const color = pct >= 90 ? 'bg-red-500' : pct >= 65 ? 'bg-amber-500' : 'bg-green-500';

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <Truck className="h-4 w-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-900">Truck Utilization — Truck 1</h3>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
        <span>{totalLoad.toFixed(1)} cu yd loaded</span>
        <span>{totalCapacity} cu yd capacity</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-gray-500 mt-1.5 text-right font-medium">{pct}% full</p>

      <div className="mt-3 pt-3 border-t border-gray-50 grid grid-cols-3 gap-3 text-center">
        {jobs.map((j, idx) => (
          <div key={j.id} className="text-xs">
            <div
              className="h-1.5 rounded-full mb-1"
              style={{ background: ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6'][idx % 5] }}
            />
            <p className="text-gray-600 truncate">{j.customer?.name?.split(' ')[0]}</p>
            <p className="text-gray-400">{j.quote?.load_size?.cubic_yards ?? 0} cu yd</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RoutePage() {
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [stops, setStops] = useState<RouteStop[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setJobs(MOCK_ROUTE_JOBS);
      setStops(buildRouteStops(MOCK_ROUTE_JOBS));
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const handleOptimize = async () => {
    setOptimizing(true);
    await new Promise((r) => setTimeout(r, 1200));
    // In production: call Google Routes API or similar
    const shuffled = [...stops].sort(() => Math.random() - 0.5).map((s, i) => ({ ...s, stopNumber: i + 1 }));
    setStops(shuffled);
    setOptimizing(false);
  };

  const routeStats = useMemo(() => {
    const totalHours = jobs.reduce((sum, j) => sum + (j.quote?.ai_estimate?.estimated_labor_hours ?? 2), 0);
    const estMiles = stops.reduce((sum, s, i) => {
      if (i === 0) return sum;
      return sum + parseFloat(s.distanceFromPrev ?? '5');
    }, 0);
    return {
      stops: stops.length,
      estMiles: estMiles.toFixed(1),
      estHours: totalHours.toFixed(1),
    };
  }, [jobs, stops]);

  const todayStr = format(new Date(), 'EEEE, MMMM d, yyyy');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Route Optimization</h1>
          <p className="text-gray-500 text-sm mt-0.5">{todayStr}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            leftIcon={optimizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            onClick={handleOptimize}
            disabled={optimizing}
          >
            {optimizing ? 'Optimizing…' : 'Optimize Route'}
          </Button>
          <a
            href={`https://www.google.com/maps/dir/${stops.map((s) => encodeURIComponent(`${s.job.customer?.address}, ${s.job.customer?.city}, ${s.job.customer?.state}`)).join('/')}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button leftIcon={<Navigation className="h-4 w-4" />}>Open Full Route in Maps</Button>
          </a>
        </div>
      </div>

      {/* Route stats */}
      <div className="grid grid-cols-3 gap-4">
        <RouteStat icon={<MapPin className="h-5 w-5" />} label="Total Stops" value={String(routeStats.stops)} />
        <RouteStat icon={<Route className="h-5 w-5" />} label="Est. Miles" value={`${routeStats.estMiles} mi`} />
        <RouteStat icon={<Clock className="h-5 w-5" />} label="Est. Job Hours" value={`~${routeStats.estHours} hrs`} />
      </div>

      {jobs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
          <MapPin className="h-12 w-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-semibold text-lg">No jobs scheduled today</p>
          <p className="text-gray-400 text-sm mt-2">Schedule jobs to build today's route</p>
          <a href="/schedule" className="mt-4 inline-block text-orange-600 font-medium hover:underline">
            Go to Schedule
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Map — larger */}
          <div className="lg:col-span-3 space-y-4">
            <RouteMap stops={stops} className="h-[480px]" />
            <TruckUtilization jobs={jobs} />
          </div>

          {/* Route list */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Stop Order</h2>
              <p className="text-xs text-gray-400">Drag to reorder manually</p>
            </div>
            <RouteList stops={stops} onReorder={setStops} />
          </div>
        </div>
      )}
    </div>
  );
}
