'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Truck,
  FileText,
  Camera,
  StickyNote,
  Play,
  CheckCircle2,
  Timer,
  DollarSign,
  User,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Save,
  Loader2,
  X,
  Plus,
  CalendarCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ScheduledJob, JobStatus, Crew, Truck as TruckType } from '@/types';
import { JOB_STATUSES } from '@/lib/constants';
import { format, parseISO, differenceInMinutes } from 'date-fns';

// ---------------------------------------------------------------------------
// Mock data — replace with Supabase fetch
// ---------------------------------------------------------------------------

const MOCK_ALL_CREW: Crew[] = [
  { id: 'cr1', name: 'Marcus Johnson', email: 'm@haulr.com', phone: '5125550011', role: 'lead', status: 'active' },
  { id: 'cr2', name: 'Tyler Reeves', email: 't@haulr.com', phone: '5125550012', role: 'worker', status: 'active' },
  { id: 'cr3', name: 'Devon Williams', email: 'd@haulr.com', phone: '5125550013', role: 'worker', status: 'active' },
  { id: 'cr4', name: 'Ashley Chen', email: 'a@haulr.com', phone: '5125550014', role: 'lead', status: 'active' },
];

const MOCK_ALL_TRUCKS: TruckType[] = [
  { id: 't1', name: 'Truck 1', make: 'Ford', model: 'F-750', year: 2021, license_plate: 'HLR-001', max_cubic_yards: 15, status: 'active' },
  { id: 't2', name: 'Truck 2', make: 'Chevy', model: 'C5500', year: 2019, license_plate: 'HLR-002', max_cubic_yards: 12, status: 'active' },
];

function getMockJob(id: string): ScheduledJob {
  return {
    id,
    customer_id: 'c1',
    quote_id: 'q1',
    title: 'Full Home Cleanout',
    description: '3-bedroom home cleanout. Owner is relocating. Items include furniture, appliances, and general household debris. Second floor access via interior stairs.',
    status: 'scheduled',
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '08:00',
    truck_id: 't1',
    crew_ids: ['cr1', 'cr2'],
    notes: 'Customer will be present. Gate code is 4512. Park on the street.',
    before_photos: [],
    after_photos: [],
    customer: {
      id: 'c1', name: 'Sarah Mitchell', email: 'sarah.mitchell@email.com', phone: '5125550101',
      address: '4512 Oak Blvd', city: 'Austin', state: 'TX', zip: '78745',
      status: 'scheduled', lead_source: 'google', created_at: '', updated_at: '',
    },
    truck: MOCK_ALL_TRUCKS[0],
    crew: [MOCK_ALL_CREW[0], MOCK_ALL_CREW[1]],
    quote: {
      id: 'q1', customer_id: 'c1', quote_number: 'Q-001', status: 'approved',
      load_size: { fraction: 'full', cubic_yards: 15, truck_percentage: 100 },
      base_charge: 0, load_charge: 599, distance_charge: 0, labor_charge: 0,
      heavy_item_fees: 150, stair_fees: 50, specialty_fees: 0, construction_fees: 0,
      custom_fees: [], discounts: [],
      subtotal: 799, tax_rate: 0.0825, tax_amount: 65.92, total: 864.92,
      created_at: '', updated_at: '',
    },
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-50">
        <div className="text-gray-400">{icon}</div>
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
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
    <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold', def.color)}>
      <span className={cn('h-2 w-2 rounded-full', def.dotColor)} />
      {def.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Timer display
// ---------------------------------------------------------------------------

function TimerDisplay({ startTime }: { startTime: string }) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const update = () => {
      const minutes = differenceInMinutes(new Date(), parseISO(startTime));
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      setElapsed(`${h}h ${String(m).padStart(2, '0')}m`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="flex items-center gap-2 text-orange-600 font-mono font-bold text-lg">
      <Timer className="h-5 w-5 animate-pulse" />
      {elapsed}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Photo upload grid
// ---------------------------------------------------------------------------

function PhotoGrid({ label, photos, onAdd, onRemove }: { label: string; photos: string[]; onAdd: () => void; onRemove: (url: string) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 border border-orange-200 hover:border-orange-300 rounded-lg px-2.5 py-1.5 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Photo
        </button>
      </div>
      {photos.length === 0 ? (
        <div
          onClick={onAdd}
          className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-orange-300 hover:bg-orange-50/30 transition-colors"
        >
          <Camera className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Click to upload photos</p>
          <p className="text-xs text-gray-300 mt-1">JPG, PNG, HEIC up to 20MB</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => onRemove(url)}
                className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <button
            onClick={onAdd}
            className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center hover:border-orange-300 hover:bg-orange-50/30 transition-colors"
          >
            <Plus className="h-6 w-6 text-gray-300" />
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;

  const [job, setJob] = useState<ScheduledJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [notes, setNotes] = useState('');
  const [selectedCrewIds, setSelectedCrewIds] = useState<string[]>([]);
  const [selectedTruckId, setSelectedTruckId] = useState('');
  const [actualHours, setActualHours] = useState('');
  const [actualDumpFee, setActualDumpFee] = useState('');
  const [beforePhotos, setBeforePhotos] = useState<string[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<string[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const mockJob = getMockJob(jobId);
      setJob(mockJob);
      setNotes(mockJob.notes ?? '');
      setSelectedCrewIds(mockJob.crew_ids ?? []);
      setSelectedTruckId(mockJob.truck_id ?? '');
      setActualHours(String(mockJob.actual_hours ?? ''));
      setActualDumpFee(String(mockJob.actual_dump_fee ?? ''));
      setBeforePhotos(mockJob.before_photos ?? []);
      setAfterPhotos(mockJob.after_photos ?? []);
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [jobId]);

  const handleStatusChange = async (newStatus: JobStatus) => {
    if (!job) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    const updates: Partial<ScheduledJob> = { status: newStatus };
    if (newStatus === 'in_progress') updates.actual_start = new Date().toISOString();
    if (newStatus === 'completed') updates.actual_end = new Date().toISOString();
    setJob((prev) => prev ? { ...prev, ...updates } : prev);
    setSaving(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    setJob((prev) =>
      prev
        ? {
            ...prev,
            notes,
            crew_ids: selectedCrewIds,
            crew: MOCK_ALL_CREW.filter((c) => selectedCrewIds.includes(c.id)),
            truck_id: selectedTruckId,
            truck: MOCK_ALL_TRUCKS.find((t) => t.id === selectedTruckId),
            actual_hours: actualHours ? parseFloat(actualHours) : undefined,
            actual_dump_fee: actualDumpFee ? parseFloat(actualDumpFee) : undefined,
            before_photos: beforePhotos,
            after_photos: afterPhotos,
          }
        : prev
    );
    setSaving(false);
  };

  const toggleCrew = (id: string) => {
    setSelectedCrewIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Job not found.</p>
        <Link href="/jobs" className="mt-3 inline-block text-orange-600 font-medium hover:underline">Back to Jobs</Link>
      </div>
    );
  }

  const customer = job.customer!;

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Back + Header */}
      <div>
        <Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <StatusBadge status={job.status} />
              {job.quote && (
                <span className="text-sm text-gray-500 font-medium">
                  Quote #{job.quote.quote_number}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
            {job.description && (
              <p className="text-gray-500 text-sm mt-1">{job.description}</p>
            )}
          </div>

          {/* Status workflow buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {job.status === 'quoted' && (
              <Button
                leftIcon={<CalendarCheck className="h-4 w-4" />}
                variant="outline"
                onClick={() => handleStatusChange('scheduled')}
                disabled={saving}
              >
                Schedule
              </Button>
            )}
            {job.status === 'scheduled' && (
              <Button
                leftIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                className="bg-amber-500 hover:bg-amber-600"
                onClick={() => handleStatusChange('in_progress')}
                disabled={saving}
              >
                Start Job
              </Button>
            )}
            {job.status === 'in_progress' && (
              <Button
                leftIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                variant="success"
                onClick={() => handleStatusChange('completed')}
                disabled={saving}
              >
                Complete Job
              </Button>
            )}
            <Button
              variant="outline"
              leftIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              onClick={handleSave}
              disabled={saving}
            >
              Save
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main content (left 2 cols) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Time tracking (when in progress) */}
          {job.status === 'in_progress' && job.actual_start && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-amber-900">Job In Progress</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Started at {format(parseISO(job.actual_start), 'h:mm a')}
                  </p>
                </div>
                <TimerDisplay startTime={job.actual_start} />
              </div>
            </div>
          )}

          {/* Schedule */}
          <Section title="Schedule" icon={<Calendar className="h-4 w-4" />}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Date</label>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {job.scheduled_date
                    ? format(parseISO(job.scheduled_date), 'EEEE, MMMM d, yyyy')
                    : <span className="text-gray-400 font-normal italic">Not scheduled</span>}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Start Time</label>
                <p className="text-sm font-semibold text-gray-900 mt-1">{job.scheduled_time ?? '—'}</p>
              </div>
              {job.actual_start && (
                <div>
                  <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Actual Start</label>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{format(parseISO(job.actual_start), 'h:mm a')}</p>
                </div>
              )}
              {job.actual_end && (
                <div>
                  <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Actual End</label>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{format(parseISO(job.actual_end), 'h:mm a')}</p>
                </div>
              )}
            </div>
          </Section>

          {/* Crew assignment */}
          <Section title="Crew Assignment" icon={<Users className="h-4 w-4" />}>
            <div className="grid grid-cols-2 gap-2">
              {MOCK_ALL_CREW.filter((c) => c.status === 'active').map((c) => {
                const selected = selectedCrewIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleCrew(c.id)}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm text-left transition-colors',
                      selected ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className={cn('h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0', selected ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600')}>
                      {c.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{c.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{c.role}</p>
                    </div>
                    {selected && <CheckCircle2 className="h-4 w-4 text-blue-500 ml-auto flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Truck assignment */}
          <Section title="Truck Assignment" icon={<Truck className="h-4 w-4" />}>
            <div className="space-y-2">
              {MOCK_ALL_TRUCKS.filter((t) => t.status === 'active').map((t) => {
                const selected = selectedTruckId === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTruckId(t.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm text-left transition-colors',
                      selected ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.year} {t.make} {t.model} · {t.max_cubic_yards} cu yd · {t.license_plate}</p>
                    </div>
                    {selected && <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Before photos */}
          <Section title="Before Photos" icon={<Camera className="h-4 w-4" />}>
            <PhotoGrid
              label="Document condition before work begins"
              photos={beforePhotos}
              onAdd={() => {
                // TODO: open file picker / camera
                setBeforePhotos((p) => [...p, `https://picsum.photos/seed/${Date.now()}/400/300`]);
              }}
              onRemove={(url) => setBeforePhotos((p) => p.filter((x) => x !== url))}
            />
          </Section>

          {/* After photos */}
          <Section title="After Photos" icon={<Camera className="h-4 w-4" />}>
            <PhotoGrid
              label="Document completed work"
              photos={afterPhotos}
              onAdd={() => {
                setAfterPhotos((p) => [...p, `https://picsum.photos/seed/${Date.now() + 1}/400/300`]);
              }}
              onRemove={(url) => setAfterPhotos((p) => p.filter((x) => x !== url))}
            />
          </Section>

          {/* Notes */}
          <Section title="Job Notes" icon={<StickyNote className="h-4 w-4" />}>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Add notes about access, special instructions, customer preferences…"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </Section>

          {/* Completion form */}
          {(job.status === 'in_progress' || job.status === 'completed') && (
            <Section title="Job Completion" icon={<CheckCircle2 className="h-4 w-4" />}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Actual Hours</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={actualHours}
                    onChange={(e) => setActualHours(e.target.value)}
                    placeholder="e.g. 3.5"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Actual Dump Fee ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={actualDumpFee}
                    onChange={(e) => setActualDumpFee(e.target.value)}
                    placeholder="e.g. 75"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              {job.quote && (
                <div className="mt-4 bg-green-50 border border-green-100 rounded-lg px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-green-900">Job Revenue</p>
                    <p className="text-lg font-bold text-green-700">
                      ${job.quote.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              )}
            </Section>
          )}
        </div>

        {/* Sidebar (right col) */}
        <div className="space-y-5">
          {/* Customer */}
          <Section title="Customer" icon={<User className="h-4 w-4" />}>
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-gray-900">{customer.name}</p>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span>{customer.address}, {customer.city}, {customer.state} {customer.zip}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <a href={`tel:${customer.phone}`} className="hover:text-orange-600 transition-colors">
                    {customer.phone}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <a href={`mailto:${customer.email}`} className="hover:text-orange-600 transition-colors truncate">
                    {customer.email}
                  </a>
                </div>
              </div>
              <Link
                href={`/customers/${customer.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 mt-1"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View Customer
              </Link>
            </div>
          </Section>

          {/* Quote */}
          {job.quote && (
            <Section title="Quote" icon={<FileText className="h-4 w-4" />}>
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Quote #</span>
                  <span className="font-medium text-gray-900">{job.quote.quote_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Load Size</span>
                  <span className="font-medium text-gray-900">{job.quote.load_size.fraction} truck</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Load Charge</span>
                  <span className="font-medium">${job.quote.load_charge.toFixed(2)}</span>
                </div>
                {job.quote.heavy_item_fees > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Heavy Items</span>
                    <span className="font-medium">${job.quote.heavy_item_fees.toFixed(2)}</span>
                  </div>
                )}
                {job.quote.stair_fees > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Stair Fee</span>
                    <span className="font-medium">${job.quote.stair_fees.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax</span>
                  <span className="font-medium">${job.quote.tax_amount.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex justify-between text-sm font-bold">
                  <span className="text-gray-900">Total</span>
                  <span className="text-green-700 text-base">${job.quote.total.toFixed(2)}</span>
                </div>
                <Link
                  href={`/quotes/${job.quote.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 mt-1"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Full Quote
                </Link>
              </div>
            </Section>
          )}

          {/* Created info */}
          <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3 text-xs text-gray-500 space-y-1">
            <div className="flex justify-between">
              <span>Created</span>
              <span>{format(parseISO(job.created_at), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex justify-between">
              <span>Last updated</span>
              <span>{format(parseISO(job.updated_at), 'MMM d, h:mm a')}</span>
            </div>
            <div className="flex justify-between">
              <span>Job ID</span>
              <span className="font-mono">{job.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
