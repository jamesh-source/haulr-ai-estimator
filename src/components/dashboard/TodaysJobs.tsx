'use client';

import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import {
  MapPin,
  Clock,
  Users,
  ChevronRight,
  Briefcase,
  ExternalLink,
} from 'lucide-react';
import { cn, formatTime, getStatusColor, getStatusLabel } from '@/lib/utils';

export interface TodayJob {
  id: string;
  customer_name: string;
  address: string;
  scheduled_time: string; // "HH:mm"
  scheduled_date: string; // ISO date
  status: string;
  crew: string[];
  truck?: string;
  quote_total?: number;
  job_type?: string;
}

interface TodaysJobsProps {
  jobs: TodayJob[];
  loading?: boolean;
  className?: string;
}

function JobSkeleton() {
  return (
    <div className="flex items-start gap-3 p-4 animate-pulse">
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        <div className="h-3 w-12 bg-gray-200 rounded" />
        <div className="h-3 w-8 bg-gray-100 rounded" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="h-4 w-40 bg-gray-200 rounded mb-2" />
        <div className="h-3 w-56 bg-gray-100 rounded mb-2" />
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-gray-100 rounded-full" />
          <div className="h-5 w-20 bg-gray-100 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        getStatusColor(status)
      )}
    >
      {getStatusLabel(status)}
    </span>
  );
}

interface JobRowProps {
  job: TodayJob;
}

function JobRow({ job }: JobRowProps) {
  return (
    <div className="flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors group">
      {/* Time column */}
      <div className="flex-shrink-0 w-14 text-right">
        <p className="text-sm font-semibold text-gray-900 tabular-nums leading-tight">
          {formatTime(job.scheduled_time)}
        </p>
      </div>

      {/* Divider dot */}
      <div className="flex-shrink-0 mt-1.5">
        <div className="w-2 h-2 rounded-full bg-blue-400" />
      </div>

      {/* Job details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{job.customer_name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <p className="text-xs text-gray-500 truncate">{job.address}</p>
            </div>
          </div>
          <StatusBadge status={job.status} />
        </div>

        <div className="flex items-center gap-3 mt-2">
          {/* Crew */}
          {job.crew.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Users className="w-3.5 h-3.5 text-gray-400" />
              <span>{job.crew.join(', ')}</span>
            </div>
          )}

          {/* Truck */}
          {job.truck && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span className="text-gray-400">•</span>
              <span>{job.truck}</span>
            </div>
          )}

          {/* Revenue */}
          {job.quote_total && (
            <div className="flex items-center gap-1 text-xs font-medium text-green-600 ml-auto">
              <span>${job.quote_total.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action arrow */}
      <Link
        href={`/jobs/${job.id}`}
        className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label={`View job for ${job.customer_name}`}
      >
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </Link>
    </div>
  );
}

export function TodaysJobs({ jobs, loading = false, className }: TodaysJobsProps) {
  const today = format(new Date(), 'EEEE, MMMM d');

  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4.5 h-4.5 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">Today's Jobs</h2>
          <span className="text-xs text-gray-400">{today}</span>
        </div>
        <Link
          href="/jobs"
          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          View all
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="divide-y divide-gray-100">
          {Array.from({ length: 3 }).map((_, i) => (
            <JobSkeleton key={i} />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center px-6">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <Briefcase className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-700">No jobs scheduled today</p>
          <p className="text-xs text-gray-400 mt-1">
            Head over to the Schedule to add jobs for today.
          </p>
          <Link
            href="/schedule"
            className="mt-3 inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Go to Schedule
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {jobs.map((job) => (
            <JobRow key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
