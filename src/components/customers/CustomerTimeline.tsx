'use client';

import { useState } from 'react';
import {
  FileText,
  Send,
  CheckCircle,
  XCircle,
  Briefcase,
  Calendar,
  Clock,
  DollarSign,
  StickyNote,
  ArrowRight,
  User,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export type TimelineEventType =
  | 'quote_created'
  | 'quote_sent'
  | 'quote_approved'
  | 'quote_rejected'
  | 'job_scheduled'
  | 'job_started'
  | 'job_completed'
  | 'job_cancelled'
  | 'payment_received'
  | 'note_added'
  | 'status_changed'
  | 'customer_created';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  description?: string;
  amount?: number;
  user?: string;
  timestamp: string;
  metadata?: Record<string, string | number | boolean>;
}

// =============================================================================
// CONFIG
// =============================================================================

const EVENT_CONFIG: Record<
  TimelineEventType,
  { icon: React.ElementType; color: string; bg: string; border: string }
> = {
  quote_created:    { icon: FileText,     color: 'text-purple-600', bg: 'bg-purple-50',  border: 'border-purple-200' },
  quote_sent:       { icon: Send,         color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-200'   },
  quote_approved:   { icon: CheckCircle,  color: 'text-green-600',  bg: 'bg-green-50',   border: 'border-green-200'  },
  quote_rejected:   { icon: XCircle,      color: 'text-red-600',    bg: 'bg-red-50',     border: 'border-red-200'    },
  job_scheduled:    { icon: Calendar,     color: 'text-indigo-600', bg: 'bg-indigo-50',  border: 'border-indigo-200' },
  job_started:      { icon: Clock,        color: 'text-orange-600', bg: 'bg-orange-50',  border: 'border-orange-200' },
  job_completed:    { icon: CheckCircle,  color: 'text-green-600',  bg: 'bg-green-50',   border: 'border-green-200'  },
  job_cancelled:    { icon: XCircle,      color: 'text-red-600',    bg: 'bg-red-50',     border: 'border-red-200'    },
  payment_received: { icon: DollarSign,   color: 'text-green-600',  bg: 'bg-green-50',   border: 'border-green-200'  },
  note_added:       { icon: StickyNote,   color: 'text-yellow-600', bg: 'bg-yellow-50',  border: 'border-yellow-200' },
  status_changed:   { icon: ArrowRight,   color: 'text-gray-600',   bg: 'bg-gray-50',    border: 'border-gray-200'   },
  customer_created: { icon: User,         color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-200'   },
};

// =============================================================================
// HELPERS
// =============================================================================

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// =============================================================================
// SUBCOMPONENTS
// =============================================================================

interface TimelineItemProps {
  event: TimelineEvent;
  isLast: boolean;
}

function TimelineItem({ event, isLast }: TimelineItemProps) {
  const config = EVENT_CONFIG[event.type] ?? EVENT_CONFIG.note_added;
  const Icon = config.icon;

  return (
    <div className="relative flex gap-4">
      {/* Vertical line */}
      {!isLast && (
        <div className="absolute left-5 top-10 bottom-0 w-px bg-gray-200" />
      )}

      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 h-10 w-10 rounded-full border flex items-center justify-center z-10',
          config.bg,
          config.border
        )}
      >
        <Icon className={cn('h-4 w-4', config.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">{event.title}</p>
            {event.description && (
              <p className="text-sm text-gray-500 mt-0.5 whitespace-pre-wrap">{event.description}</p>
            )}
            {event.amount !== undefined && (
              <p className="text-sm font-medium text-green-700 mt-1">
                {formatAmount(event.amount)}
              </p>
            )}
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-xs text-gray-400 whitespace-nowrap">{formatDateTime(event.timestamp)}</p>
            {event.user && (
              <p className="text-xs text-gray-400 mt-0.5">{event.user}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface CustomerTimelineProps {
  events: TimelineEvent[];
  loading?: boolean;
}

export function CustomerTimeline({ events, loading }: CustomerTimelineProps) {
  const [filter, setFilter] = useState<'all' | 'quotes' | 'jobs' | 'payments' | 'notes'>('all');

  const FILTER_OPTIONS = [
    { key: 'all',      label: 'All Activity' },
    { key: 'quotes',   label: 'Quotes' },
    { key: 'jobs',     label: 'Jobs' },
    { key: 'payments', label: 'Payments' },
    { key: 'notes',    label: 'Notes' },
  ] as const;

  const filtered = events.filter((e) => {
    if (filter === 'all') return true;
    if (filter === 'quotes') return e.type.startsWith('quote_');
    if (filter === 'jobs') return e.type.startsWith('job_');
    if (filter === 'payments') return e.type === 'payment_received';
    if (filter === 'notes') return e.type === 'note_added';
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="h-10 w-10 rounded-full bg-gray-200 flex-shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-4 bg-gray-200 rounded w-48" />
              <div className="h-3 bg-gray-100 rounded w-64" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-100 pb-1 overflow-x-auto">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors',
              filter === opt.key
                ? 'bg-orange-50 text-orange-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <StickyNote className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No activity yet</p>
        </div>
      ) : (
        <div>
          {filtered.map((event, idx) => (
            <TimelineItem
              key={event.id}
              event={event}
              isLast={idx === filtered.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
