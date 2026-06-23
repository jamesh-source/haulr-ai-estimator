'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Truck, Users, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Job, Truck as TruckType, Crew } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScheduleFormData {
  jobId: string;
  date: string;
  time: string;
  durationHours: number;
  truckId: string;
  crewIds: string[];
}

interface JobScheduleModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: ScheduleFormData) => Promise<void>;
  job?: Job | null;
  jobs?: Job[];
  trucks: TruckType[];
  crew: Crew[];
  defaultDate?: string;
  defaultTime?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(h: number) {
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:00 ${period}`;
}

const TIME_OPTIONS = Array.from({ length: 28 }, (_, i) => {
  const totalMinutes = 6 * 60 + i * 30;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  const label = `${displayH}:${String(m).padStart(2, '0')} ${period}`;
  return { value, label };
});

const DURATION_OPTIONS = [
  { value: 1,   label: '1 hour' },
  { value: 1.5, label: '1.5 hours' },
  { value: 2,   label: '2 hours' },
  { value: 3,   label: '3 hours' },
  { value: 4,   label: '4 hours' },
  { value: 5,   label: '5 hours' },
  { value: 6,   label: '6 hours' },
  { value: 8,   label: '8 hours (Full day)' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function JobScheduleModal({
  open,
  onClose,
  onConfirm,
  job,
  jobs = [],
  trucks,
  crew,
  defaultDate,
  defaultTime,
}: JobScheduleModalProps) {
  const today = new Date().toISOString().split('T')[0];

  const [selectedJobId, setSelectedJobId] = useState(job?.id ?? '');
  const [date, setDate] = useState(defaultDate ?? today);
  const [time, setTime] = useState(defaultTime ?? '08:00');
  const [durationHours, setDurationHours] = useState(2);
  const [truckId, setTruckId] = useState('');
  const [crewIds, setCrewIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sync when modal opens with different job/defaults
  useEffect(() => {
    if (open) {
      setSelectedJobId(job?.id ?? '');
      setDate(defaultDate ?? today);
      setTime(defaultTime ?? '08:00');
      setDurationHours(2);
      setTruckId('');
      setCrewIds([]);
      setError('');
    }
  }, [open, job, defaultDate, defaultTime]);

  if (!open) return null;

  const toggleCrew = (id: string) => {
    setCrewIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!selectedJobId) { setError('Please select a job.'); return; }
    if (!date) { setError('Please select a date.'); return; }
    if (!truckId) { setError('Please select a truck.'); return; }
    if (crewIds.length === 0) { setError('Please assign at least one crew member.'); return; }

    setLoading(true);
    setError('');
    try {
      await onConfirm({ jobId: selectedJobId, date, time, durationHours, truckId, crewIds });
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to schedule job.');
    } finally {
      setLoading(false);
    }
  };

  const availableTrucks = trucks.filter((t) => t.status === 'active');
  const activeCrewMembers = crew.filter((c) => c.status === 'active');
  const unscheduledJobs = jobs.filter((j) => !j.scheduled_date || j.status === 'quoted');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Schedule Job</h2>
            <p className="text-sm text-gray-500 mt-0.5">Assign a date, truck, and crew</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Job selector (only when no job is pre-selected) */}
          {!job && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Job <span className="text-red-500">*</span>
              </label>
              {unscheduledJobs.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No unscheduled jobs available.</p>
              ) : (
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select a job…</option>
                  {unscheduledJobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Selected job badge */}
          {job && (
            <div className="bg-orange-50 border border-orange-100 rounded-lg px-4 py-3">
              <p className="text-xs text-orange-600 font-medium uppercase tracking-wide mb-0.5">Scheduling</p>
              <p className="text-sm font-semibold text-gray-900">{job.title}</p>
            </div>
          )}

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Date <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                type="date"
                value={date}
                min={today}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Start Time
                </span>
              </label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Estimated Duration
            </label>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDurationHours(d.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm border transition-colors',
                    durationHours === d.value
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Truck */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5" /> Truck <span className="text-red-500">*</span>
              </span>
            </label>
            <div className="grid grid-cols-1 gap-2">
              {availableTrucks.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTruckId(t.id)}
                  className={cn(
                    'flex items-center justify-between px-4 py-3 rounded-lg border text-sm transition-colors text-left',
                    truckId === t.id
                      ? 'bg-blue-50 border-blue-400 text-blue-900'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                  )}
                >
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.year} {t.make} {t.model} · {t.max_cubic_yards} cu yd</p>
                  </div>
                  {truckId === t.id && <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0" />}
                </button>
              ))}
              {availableTrucks.length === 0 && (
                <p className="text-sm text-gray-400 italic">No active trucks available.</p>
              )}
            </div>
          </div>

          {/* Crew */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> Crew Members <span className="text-red-500">*</span>
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {activeCrewMembers.map((c) => {
                const selected = crewIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleCrew(c.id)}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm transition-colors text-left',
                      selected
                        ? 'bg-green-50 border-green-400 text-green-900'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                    )}
                  >
                    <div
                      className={cn(
                        'h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                        selected ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                      )}
                    >
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{c.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{c.role}</p>
                    </div>
                  </button>
                );
              })}
              {activeCrewMembers.length === 0 && (
                <p className="text-sm text-gray-400 italic col-span-2">No active crew members.</p>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3 rounded-b-2xl">
          <Button variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="flex-1" disabled={loading}>
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Scheduling…</>
            ) : (
              <>Confirm Schedule</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
