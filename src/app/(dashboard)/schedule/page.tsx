'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  CalendarPlus,
  Calendar,
  GripVertical,
  MapPin,
  Clock,
  Users,
  Truck,
  ChevronRight,
  X,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScheduleCalendar, CalendarEvent } from '@/components/schedule/ScheduleCalendar';
import { JobScheduleModal, ScheduleFormData } from '@/components/schedule/JobScheduleModal';
import { cn } from '@/lib/utils';
import type { ScheduledJob, Job, Truck as TruckType, Crew } from '@/types';
import { JOB_STATUSES } from '@/lib/constants';
import { format, parseISO } from 'date-fns';

// ---------------------------------------------------------------------------
// Mock data helpers — replace with Supabase queries
// ---------------------------------------------------------------------------

const MOCK_TRUCKS: TruckType[] = [
  { id: 't1', name: 'Truck 1', make: 'Ford', model: 'F-750', year: 2021, license_plate: 'HLR-001', max_cubic_yards: 15, status: 'active' },
  { id: 't2', name: 'Truck 2', make: 'Chevy', model: 'C5500', year: 2019, license_plate: 'HLR-002', max_cubic_yards: 12, status: 'active' },
];

const MOCK_CREW: Crew[] = [
  { id: 'c1', name: 'Marcus Johnson', email: 'm@haulr.com', phone: '5125550011', role: 'lead', status: 'active' },
  { id: 'c2', name: 'Tyler Reeves', email: 't@haulr.com', phone: '5125550012', role: 'worker', status: 'active' },
  { id: 'c3', name: 'Devon Williams', email: 'd@haulr.com', phone: '5125550013', role: 'worker', status: 'active' },
  { id: 'c4', name: 'Ashley Chen', email: 'a@haulr.com', phone: '5125550014', role: 'lead', status: 'active' },
];

const buildMockJobs = (): ScheduledJob[] => {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const nextDay = new Date(today); nextDay.setDate(today.getDate() + 1);
  const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 3);

  return [
    {
      id: 'j1', customer_id: 'cust1', title: 'Full Home Cleanout', description: '3BR home cleanout',
      status: 'scheduled', scheduled_date: fmt(today), scheduled_time: '08:00',
      truck_id: 't1', crew_ids: ['c1', 'c2'],
      customer: { id: 'cust1', name: 'Sarah Mitchell', email: 's@test.com', phone: '5125550101', address: '4512 Oak Blvd', city: 'Austin', state: 'TX', zip: '78745', status: 'scheduled', lead_source: 'google', created_at: '', updated_at: '' },
      truck: MOCK_TRUCKS[0], crew: [MOCK_CREW[0], MOCK_CREW[1]],
      quote: { id: 'q1', total: 599, customer_id: 'cust1', quote_number: 'Q-001', status: 'approved', load_size: { fraction: 'full', cubic_yards: 15, truck_percentage: 100 }, base_charge: 0, load_charge: 599, distance_charge: 0, labor_charge: 0, heavy_item_fees: 0, stair_fees: 0, specialty_fees: 0, construction_fees: 0, custom_fees: [], discounts: [], subtotal: 599, tax_rate: 0, tax_amount: 0, created_at: '', updated_at: '', ai_estimate: { estimated_labor_hours: 4, total_cubic_yards: 15, truck_percentage: 100, trailer_percentage: 0, estimated_dump_cost: 90, suggested_price: 599, suggested_profit_margin: 45, hazard_warnings: [], donation_items: [], recycling_items: [], items_detected: [], confidence_score: 0.9, analysis_notes: '' } },
      created_at: '', updated_at: '',
    },
    {
      id: 'j2', customer_id: 'cust2', title: 'Garage Cleanout', description: '1/2 truck load',
      status: 'in_progress', scheduled_date: fmt(today), scheduled_time: '13:00',
      truck_id: 't2', crew_ids: ['c3'],
      actual_start: new Date().toISOString(),
      customer: { id: 'cust2', name: 'Robert Okafor', email: 'r@test.com', phone: '5125550102', address: '1234 Pecan St', city: 'Austin', state: 'TX', zip: '78701', status: 'in_progress', lead_source: 'referral', created_at: '', updated_at: '' },
      truck: MOCK_TRUCKS[1], crew: [MOCK_CREW[2]],
      quote: { id: 'q2', total: 299, customer_id: 'cust2', quote_number: 'Q-002', status: 'approved', load_size: { fraction: '1/2', cubic_yards: 7.5, truck_percentage: 50 }, base_charge: 0, load_charge: 299, distance_charge: 0, labor_charge: 0, heavy_item_fees: 0, stair_fees: 0, specialty_fees: 0, construction_fees: 0, custom_fees: [], discounts: [], subtotal: 299, tax_rate: 0, tax_amount: 0, created_at: '', updated_at: '', ai_estimate: { estimated_labor_hours: 2, total_cubic_yards: 7.5, truck_percentage: 50, trailer_percentage: 0, estimated_dump_cost: 60, suggested_price: 299, suggested_profit_margin: 50, hazard_warnings: [], donation_items: [], recycling_items: [], items_detected: [], confidence_score: 0.88, analysis_notes: '' } },
      created_at: '', updated_at: '',
    },
    {
      id: 'j3', customer_id: 'cust3', title: 'Office Furniture Removal', description: 'Large office clear',
      status: 'scheduled', scheduled_date: fmt(nextDay), scheduled_time: '09:00',
      truck_id: 't1', crew_ids: ['c1', 'c4'],
      customer: { id: 'cust3', name: 'Elena Vasquez', email: 'e@test.com', phone: '5125550103', address: '7890 Congress Ave', city: 'Austin', state: 'TX', zip: '78704', status: 'scheduled', lead_source: 'google', created_at: '', updated_at: '' },
      truck: MOCK_TRUCKS[0], crew: [MOCK_CREW[0], MOCK_CREW[3]],
      quote: { id: 'q3', total: 439, customer_id: 'cust3', quote_number: 'Q-003', status: 'approved', load_size: { fraction: '3/4', cubic_yards: 11.25, truck_percentage: 75 }, base_charge: 0, load_charge: 439, distance_charge: 0, labor_charge: 0, heavy_item_fees: 0, stair_fees: 0, specialty_fees: 0, construction_fees: 0, custom_fees: [], discounts: [], subtotal: 439, tax_rate: 0, tax_amount: 0, created_at: '', updated_at: '' },
      created_at: '', updated_at: '',
    },
  ];
};

const UNSCHEDULED_JOBS: Job[] = [
  { id: 'u1', customer_id: 'c10', title: 'Basement Cleanout — Kim Torres', status: 'quoted', created_at: '', updated_at: '' },
  { id: 'u2', customer_id: 'c11', title: 'Estate Cleanout — Williams Family', status: 'quoted', created_at: '', updated_at: '' },
  { id: 'u3', customer_id: 'c12', title: 'Deck Demolition — Greg Marsh', status: 'quoted', created_at: '', updated_at: '' },
];

// ---------------------------------------------------------------------------
// Unscheduled job sidebar item
// ---------------------------------------------------------------------------

function UnscheduledJobItem({ job, onSchedule }: { job: Job; onSchedule: (j: Job) => void }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 hover:border-orange-300 hover:shadow-sm transition-all group cursor-pointer">
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 text-gray-300 flex-shrink-0 mt-0.5 group-hover:text-gray-400" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{job.title}</p>
          <span className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">Quoted</span>
        </div>
        <button
          onClick={() => onSchedule(job)}
          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 p-1 hover:bg-orange-50 rounded"
        >
          <ChevronRight className="h-4 w-4 text-orange-500" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Job detail popup
// ---------------------------------------------------------------------------

function JobDetailPopup({ event, onClose }: { event: CalendarEvent; onClose: () => void }) {
  const statusDef = JOB_STATUSES.find((s) => s.value === event.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg">
          <X className="h-4 w-4 text-gray-500" />
        </button>

        <div className="space-y-3">
          {statusDef && (
            <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', statusDef.color)}>
              <span className={cn('h-1.5 w-1.5 rounded-full', statusDef.dotColor)} />
              {statusDef.label}
            </span>
          )}
          <h3 className="font-semibold text-gray-900 text-base">{event.customer}</h3>
          <div className="space-y-2 text-sm text-gray-600">
            {event.start instanceof Date && event.end instanceof Date && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>
                  {format(event.start, 'EEE, MMM d')} ·{' '}
                  {format(event.start, 'h:mm a')} – {format(event.end, 'h:mm a')}
                </span>
              </div>
            )}
            {event.address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>{event.address}</span>
              </div>
            )}
            {event.crew?.length > 0 && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-400" />
                <span>{event.crew.join(', ')}</span>
              </div>
            )}
            {event.truckName && (
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-gray-400" />
                <span>{event.truckName}</span>
              </div>
            )}
          </div>
          <div className="pt-2 flex gap-2">
            <a
              href={`/jobs/${event.jobId}`}
              className="flex-1 text-center px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              View Job
            </a>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SchedulePage() {
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedJobToSchedule, setSelectedJobToSchedule] = useState<Job | null>(null);
  const [defaultSlotDate, setDefaultSlotDate] = useState<string | undefined>();
  const [defaultSlotTime, setDefaultSlotTime] = useState<string | undefined>();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    // Simulate fetch — replace with Supabase call
    const timer = setTimeout(() => {
      setJobs(buildMockJobs());
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const handleSelectSlot = useCallback((slotInfo: any) => {
    const start: Date = slotInfo.start;
    const date = format(start, 'yyyy-MM-dd');
    const time = format(start, 'HH:mm');
    setDefaultSlotDate(date);
    setDefaultSlotTime(time);
    setSelectedJobToSchedule(null);
    setScheduleModalOpen(true);
  }, []);

  const handleScheduleUnscheduled = (job: Job) => {
    setSelectedJobToSchedule(job);
    setDefaultSlotDate(undefined);
    setDefaultSlotTime(undefined);
    setScheduleModalOpen(true);
  };

  const handleEventDrop = useCallback((jobId: string, start: Date, end: Date) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              scheduled_date: format(start, 'yyyy-MM-dd'),
              scheduled_time: format(start, 'HH:mm'),
            }
          : j
      )
    );
    // TODO: persist to Supabase
  }, []);

  const handleConfirmSchedule = async (data: ScheduleFormData) => {
    // TODO: POST to /api/jobs/[id]/schedule
    await new Promise((r) => setTimeout(r, 800));
    console.log('Schedule confirmed:', data);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
          <p className="text-gray-500 text-sm mt-0.5">Drag jobs onto the calendar to schedule them</p>
        </div>
        <Button
          leftIcon={<CalendarPlus className="h-4 w-4" />}
          onClick={() => { setSelectedJobToSchedule(null); setScheduleModalOpen(true); }}
        >
          Schedule Job
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* Calendar — full width on mobile, flex-1 on desktop */}
          <div className="w-full flex-1 min-w-0">
            <ScheduleCalendar
              jobs={jobs}
              onSelectEvent={setSelectedEvent}
              onSelectSlot={handleSelectSlot}
              onEventDrop={handleEventDrop}
            />
          </div>

          {/* Unscheduled sidebar — below calendar on mobile, left on desktop */}
          <div className="w-full lg:w-72 lg:flex-shrink-0 space-y-3 order-last lg:order-none">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="px-4 pt-4 pb-2 border-b border-gray-50">
                <h2 className="text-sm font-semibold text-gray-900">Unscheduled Jobs</h2>
                <p className="text-xs text-gray-400 mt-0.5">Tap arrow to schedule</p>
              </div>
              <div className="p-3 space-y-2 max-h-64 lg:max-h-[calc(100vh-260px)] overflow-y-auto">
                {UNSCHEDULED_JOBS.length === 0 ? (
                  <div className="text-center py-6">
                    <Calendar className="h-6 w-6 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">All jobs are scheduled</p>
                  </div>
                ) : (
                  UNSCHEDULED_JOBS.map((job) => (
                    <UnscheduledJobItem
                      key={job.id}
                      job={job}
                      onSchedule={handleScheduleUnscheduled}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Status legend */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Status Legend</h3>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                {[
                  { label: 'Scheduled', color: '#3B82F6' },
                  { label: 'In Progress', color: '#F59E0B' },
                  { label: 'Completed', color: '#10B981' },
                  { label: 'Quoted', color: '#8B5CF6' },
                  { label: 'Cancelled', color: '#EF4444' },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm flex-shrink-0" style={{ background: s.color }} />
                    <span className="text-xs text-gray-600">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule modal */}
      <JobScheduleModal
        open={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        onConfirm={handleConfirmSchedule}
        job={selectedJobToSchedule}
        jobs={UNSCHEDULED_JOBS}
        trucks={MOCK_TRUCKS}
        crew={MOCK_CREW}
        defaultDate={defaultSlotDate}
        defaultTime={defaultSlotTime}
      />

      {/* Event detail popup */}
      {selectedEvent && (
        <JobDetailPopup event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}
