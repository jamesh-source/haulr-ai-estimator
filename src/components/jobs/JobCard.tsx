'use client';

import React from 'react';
import Link from 'next/link';
import {
  MapPin,
  Calendar,
  Clock,
  Truck,
  Users,
  Play,
  CheckCircle2,
  Eye,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { ScheduledJob, JobStatus } from '@/types';
import { JOB_STATUSES } from '@/lib/constants';
import { format, parseISO } from 'date-fns';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface JobCardProps {
  job: ScheduledJob;
  onStart?: (jobId: string) => void;
  onComplete?: (jobId: string) => void;
  className?: string;
  compact?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: JobStatus }) {
  const def = JOB_STATUSES.find((s) => s.value === status);
  if (!def) return null;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', def.color)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', def.dotColor)} />
      {def.label}
    </span>
  );
}

function formatScheduledDate(date?: string, time?: string) {
  if (!date) return null;
  try {
    const parsed = parseISO(date);
    const dateStr = format(parsed, 'EEE, MMM d');
    if (time) {
      const [h, m] = time.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
      return `${dateStr} at ${displayH}:${String(m).padStart(2, '0')} ${period}`;
    }
    return dateStr;
  } catch {
    return date;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function JobCard({ job, onStart, onComplete, className, compact = false }: JobCardProps) {
  const scheduledDisplay = formatScheduledDate(job.scheduled_date, job.scheduled_time);
  const crewList = (job.crew ?? []).slice(0, 3);
  const extraCrew = (job.crew?.length ?? 0) - 3;

  const canStart = job.status === 'scheduled' && !!onStart;
  const canComplete = job.status === 'in_progress' && !!onComplete;

  // Revenue from quote
  const revenue = job.quote?.total;

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200',
        compact ? 'p-3' : 'p-4',
        className
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <StatusBadge status={job.status} />
            {revenue && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full">
                <DollarSign className="h-3 w-3" />
                {revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 text-sm leading-snug truncate">{job.title}</h3>
          <p className="text-sm text-gray-600 font-medium mt-0.5">{job.customer?.name}</p>
        </div>
      </div>

      {/* Details */}
      <div className={cn('space-y-1.5', compact ? 'text-xs' : 'text-sm')}>
        {/* Address */}
        {job.customer?.address && (
          <div className="flex items-start gap-2 text-gray-500">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            <span className="truncate">
              {job.customer.address}, {job.customer.city}
            </span>
          </div>
        )}

        {/* Schedule */}
        {scheduledDisplay && (
          <div className="flex items-center gap-2 text-gray-500">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{scheduledDisplay}</span>
          </div>
        )}

        {/* Truck */}
        {job.truck && (
          <div className="flex items-center gap-2 text-gray-500">
            <Truck className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{job.truck.name}</span>
          </div>
        )}

        {/* Crew */}
        {crewList.length > 0 && (
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
            <div className="flex items-center gap-1 flex-wrap">
              {crewList.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-200 text-xs font-bold text-gray-600"
                  title={c.name}
                >
                  {c.name.charAt(0).toUpperCase()}
                </span>
              ))}
              {extraCrew > 0 && (
                <span className="text-xs text-gray-400">+{extraCrew}</span>
              )}
              <span className="text-xs text-gray-500 ml-1">
                {crewList.map((c) => c.name).join(', ')}
                {extraCrew > 0 ? ` +${extraCrew}` : ''}
              </span>
            </div>
          </div>
        )}

        {/* Actual time if in progress */}
        {job.actual_start && (
          <div className="flex items-center gap-2 text-orange-600">
            <Clock className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="font-medium">
              Started {format(parseISO(job.actual_start), 'h:mm a')}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      {!compact && (
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-50">
          <Link href={`/jobs/${job.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              View
            </Button>
          </Link>
          {canStart && (
            <Button
              size="sm"
              onClick={() => onStart?.(job.id)}
              className="flex-1 gap-1.5 bg-amber-500 hover:bg-amber-600"
            >
              <Play className="h-3.5 w-3.5" />
              Start
            </Button>
          )}
          {canComplete && (
            <Button
              size="sm"
              variant="success"
              onClick={() => onComplete?.(job.id)}
              className="flex-1 gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Complete
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
