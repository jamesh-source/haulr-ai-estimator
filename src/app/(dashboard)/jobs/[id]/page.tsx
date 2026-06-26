'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
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
  ChevronDown,
  UserMinus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { JOB_STATUSES } from '@/lib/constants';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface JobData {
  id: string;
  title: string;
  description: string | null;
  status: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  estimated_hours: number | null;
  actual_revenue: number | null;
  actual_dump_fee: number | null;
  actual_start: string | null;
  actual_end: string | null;
  notes: string | null;
  truck_id: string | null;
  before_photos: string[];
  after_photos: string[];
  created_at: string;
  updated_at: string;
  customers: CustomerData | null;
  quotes: QuoteData | null;
}

interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

interface QuoteData {
  id: string;
  quote_number: string;
  total: number;
  status: string;
}

interface TruckData {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  max_cubic_yards: number;
  status: string;
}

interface AssignedCrewMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  hourly_rate: number;
  pay_type: 'hourly' | 'percent';
  pay_percent: number;
  status: string;
}

interface JobCrewRow {
  crew_member_id: string;
  assigned_at: string;
  crew_members: AssignedCrewMember;
}

interface RosterMember {
  id: string;
  name: string;
  role: string;
  hourly_rate: number;
  pay_type: 'hourly' | 'percent';
  pay_percent: number;
  status: string;
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

function StatusBadge({ status }: { status: string }) {
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
  const jobId = params?.id as string;

  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Real data
  const [assignedCrew, setAssignedCrew] = useState<AssignedCrewMember[]>([]);
  const [roster, setRoster] = useState<RosterMember[]>([]);
  const [trucks, setTrucks] = useState<TruckData[]>([]);

  // Form state
  const [notes, setNotes] = useState('');
  const [selectedTruckId, setSelectedTruckId] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [actualHours, setActualHours] = useState('');
  const [actualDumpFee, setActualDumpFee] = useState('');
  const [beforePhotos, setBeforePhotos] = useState<string[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<string[]>([]);

  // UI state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const loadJob = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to load job');
      const j: JobData = json.data;
      setJob(j);
      setNotes(j.notes ?? '');
      setSelectedTruckId(j.truck_id ?? '');
      setEstimatedHours(j.estimated_hours?.toString() ?? '');
      setActualHours(j.actual_revenue?.toString() ?? '');
      setActualDumpFee(j.actual_dump_fee?.toString() ?? '');
      setBeforePhotos(j.before_photos ?? []);
      setAfterPhotos(j.after_photos ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load job');
    }
  }, [jobId]);

  const loadCrew = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/crew`);
      const json = await res.json();
      if (!res.ok) return;
      setAssignedCrew((json.data as JobCrewRow[]).map((r) => r.crew_members).filter(Boolean));
    } catch { /* non-fatal */ }
  }, [jobId]);

  const loadRoster = useCallback(async () => {
    try {
      const res = await fetch('/api/crew');
      const json = await res.json();
      if (!res.ok) return;
      setRoster((json.data as RosterMember[]).filter((m) => m.status === 'active'));
    } catch { /* non-fatal */ }
  }, []);

  const loadTrucks = useCallback(async () => {
    try {
      const res = await fetch('/api/trucks');
      const json = await res.json();
      if (!res.ok) return;
      setTrucks((json.data as TruckData[]).filter((t) => t.status === 'active'));
    } catch { /* non-fatal */ }
  }, []);

  useEffect(() => {
    Promise.all([loadJob(), loadCrew(), loadRoster(), loadTrucks()]).finally(() => setLoading(false));
  }, [loadJob, loadCrew, loadRoster, loadTrucks]);

  // Click-outside handler for crew picker
  useEffect(() => {
    if (!pickerOpen) return;
    const handle = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-crew-picker]')) setPickerOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [pickerOpen]);

  const handleStatusChange = async (newStatus: string) => {
    if (!job) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to update status');
      setJob((prev) => prev ? { ...prev, status: newStatus } : prev);
      toast.success(`Job marked as ${newStatus.replace('_', ' ')}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!job) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        notes,
        truck_id: selectedTruckId || null,
        before_photos: beforePhotos,
        after_photos: afterPhotos,
      };
      if (estimatedHours !== '') body.estimated_hours = Number(estimatedHours);
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to save');
      toast.success('Job saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const assignCrew = async (crewMemberId: string) => {
    setAssigning(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/crew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crew_member_id: crewMemberId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to assign crew');
      await loadCrew();
      setPickerOpen(false);
      toast.success('Crew member assigned');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to assign crew');
    } finally {
      setAssigning(false);
    }
  };

  const removeCrew = async (crewMemberId: string) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/crew/${crewMemberId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to remove crew');
      setAssignedCrew((prev) => prev.filter((m) => m.id !== crewMemberId));
      toast.success('Crew member removed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove crew');
    }
  };

  // Payout calculations
  const jobTotal = job?.quotes?.total ?? job?.actual_revenue ?? 0;
  const dumpFee = job?.actual_dump_fee ?? 0;
  const estimatedHoursNum = job?.estimated_hours ?? null;
  const crewPayouts = assignedCrew.map((m) => {
    const payout = m.pay_type === 'percent'
      ? (jobTotal * m.pay_percent) / 100
      : m.hourly_rate * (estimatedHoursNum ?? 0);
    return { member: m, payout };
  });
  const totalCrewCost = crewPayouts.reduce((sum, c) => sum + c.payout, 0);
  const ownerTake = jobTotal - totalCrewCost - dumpFee;

  // Available roster (exclude already assigned)
  const assignedIds = new Set(assignedCrew.map((m) => m.id));
  const availableRoster = roster.filter((m) => !assignedIds.has(m.id));

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

  const customer = job.customers;

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
              {job.quotes && (
                <span className="text-sm text-gray-500 font-medium">
                  Quote #{job.quotes.quote_number}
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
            {/* Add crew picker */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500">{assignedCrew.length} crew member{assignedCrew.length !== 1 ? 's' : ''} assigned</p>
              <div className="relative" data-crew-picker>
                <button
                  onClick={() => setPickerOpen((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 border border-orange-200 hover:border-orange-300 rounded-lg px-2.5 py-1.5 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Crew
                  <ChevronDown className={`h-3 w-3 transition-transform ${pickerOpen ? 'rotate-180' : ''}`} />
                </button>
                {pickerOpen && (
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden">
                    {availableRoster.length === 0 ? (
                      <p className="text-gray-400 text-xs p-3 text-center">
                        {roster.length === 0 ? 'No active crew members' : 'All crew already assigned'}
                      </p>
                    ) : (
                      availableRoster.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => assignCrew(m.id)}
                          disabled={assigning}
                          className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-orange-50 transition-colors text-left"
                        >
                          <div className="h-7 w-7 rounded-full bg-orange-100 flex items-center justify-center text-xs font-bold text-orange-600 flex-shrink-0">
                            {m.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
                            <p className="text-xs text-gray-500">
                              {m.pay_type === 'percent' ? `${m.pay_percent}%` : `$${m.hourly_rate}/hr`}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Assigned crew list */}
            {assignedCrew.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No crew assigned yet. Use Add Crew to assign.</p>
            ) : (
              <div className="space-y-2">
                {assignedCrew.map((member) => (
                  <div key={member.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-gray-200 bg-white">
                    <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-xs font-bold text-orange-600 flex-shrink-0">
                      {member.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{member.name}</p>
                      <p className="text-xs text-gray-500 capitalize">
                        {member.role} · {member.pay_type === 'percent' ? `${member.pay_percent}% of job` : `$${member.hourly_rate}/hr`}
                      </p>
                    </div>
                    <button
                      onClick={() => removeCrew(member.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors p-1"
                      title="Remove from job"
                    >
                      <UserMinus className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Payout breakdown */}
          {assignedCrew.length > 0 && jobTotal > 0 && (
            <Section title="Payout Breakdown" icon={<DollarSign className="h-4 w-4" />}>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between font-medium text-gray-900">
                  <span>Job total</span>
                  <span>${jobTotal.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-100 my-2" />
                {crewPayouts.map(({ member, payout }) => (
                  <div key={member.id} className="flex justify-between">
                    <span className="text-gray-600">
                      {member.name}
                      <span className="text-gray-400 ml-1.5 text-xs">
                        {member.pay_type === 'percent'
                          ? `${member.pay_percent}%`
                          : `$${member.hourly_rate}/hr × ${estimatedHoursNum ?? 0}h`}
                      </span>
                    </span>
                    <span className="font-medium text-orange-600">${payout.toFixed(2)}</span>
                  </div>
                ))}
                {dumpFee > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Dump fee</span>
                    <span className="text-red-500">-${dumpFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-gray-100 my-2" />
                <div className="flex justify-between font-bold text-base">
                  <span className="text-gray-900">Your take</span>
                  <span className={ownerTake >= 0 ? 'text-green-700' : 'text-red-600'}>${ownerTake.toFixed(2)}</span>
                </div>
              </div>
            </Section>
          )}

          {/* Truck assignment */}
          <Section title="Truck Assignment" icon={<Truck className="h-4 w-4" />}>
            {trucks.length === 0 ? (
              <p className="text-sm text-gray-400">No trucks found. Add trucks in Settings.</p>
            ) : (
              <div className="space-y-2">
                {trucks.map((t) => {
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
            )}
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
              {job.quotes && (
                <div className="mt-4 bg-green-50 border border-green-100 rounded-lg px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-green-900">Job Revenue</p>
                    <p className="text-lg font-bold text-green-700">
                      ${job.quotes.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              )}
            </Section>
          )}
        </div>

        {/* Sidebar (right col) */}
        <div className="space-y-5">
          {/* Estimated Duration */}
          <Section title="Estimated Duration" icon={<Timer className="h-4 w-4" />}>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  min={0}
                  step={0.5}
                  placeholder="e.g. 2.5"
                  className="w-full rounded-lg border border-gray-200 px-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">hrs</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">Used to calculate hourly crew pay</p>
          </Section>

          {/* Customer */}
          {customer && (
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
          )}

          {/* Quote */}
          {job.quotes && (
            <Section title="Quote" icon={<FileText className="h-4 w-4" />}>
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Quote #</span>
                  <span className="font-medium text-gray-900">{job.quotes.quote_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  <span className="font-medium text-gray-900 capitalize">{job.quotes.status}</span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex justify-between text-sm font-bold">
                  <span className="text-gray-900">Total</span>
                  <span className="text-green-700 text-base">${job.quotes.total.toFixed(2)}</span>
                </div>
                <Link
                  href={`/quotes/${job.quotes.id}`}
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
