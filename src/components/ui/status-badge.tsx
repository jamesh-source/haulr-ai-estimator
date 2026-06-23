import * as React from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// STATUS CONFIG MAP
// Full mapping of every job/customer/quote/asset status
// =============================================================================

interface StatusConfig {
  label: string;
  textColor: string;
  bgColor: string;
  dotColor: string;
  borderColor: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  // ---- Customer statuses ----
  lead: {
    label: 'Lead',
    textColor: 'text-gray-600',
    bgColor: 'bg-gray-100',
    dotColor: 'bg-gray-400',
    borderColor: 'border-gray-200',
  },
  contacted: {
    label: 'Contacted',
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-50',
    dotColor: 'bg-blue-500',
    borderColor: 'border-blue-200',
  },
  follow_up: {
    label: 'Follow Up',
    textColor: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    dotColor: 'bg-yellow-500',
    borderColor: 'border-yellow-200',
  },
  // ---- Shared statuses (job + customer) ----
  quoted: {
    label: 'Quoted',
    textColor: 'text-purple-700',
    bgColor: 'bg-purple-50',
    dotColor: 'bg-purple-500',
    borderColor: 'border-purple-200',
  },
  scheduled: {
    label: 'Scheduled',
    textColor: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    dotColor: 'bg-indigo-500',
    borderColor: 'border-indigo-200',
  },
  in_progress: {
    label: 'In Progress',
    textColor: 'text-orange-700',
    bgColor: 'bg-orange-50',
    dotColor: 'bg-orange-500',
    borderColor: 'border-orange-200',
  },
  completed: {
    label: 'Completed',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
    dotColor: 'bg-green-500',
    borderColor: 'border-green-200',
  },
  cancelled: {
    label: 'Cancelled',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    dotColor: 'bg-red-500',
    borderColor: 'border-red-200',
  },
  // ---- Quote statuses ----
  draft: {
    label: 'Draft',
    textColor: 'text-gray-600',
    bgColor: 'bg-gray-100',
    dotColor: 'bg-gray-400',
    borderColor: 'border-gray-200',
  },
  sent: {
    label: 'Sent',
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-50',
    dotColor: 'bg-blue-500',
    borderColor: 'border-blue-200',
  },
  approved: {
    label: 'Approved',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
    dotColor: 'bg-green-500',
    borderColor: 'border-green-200',
  },
  rejected: {
    label: 'Rejected',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    dotColor: 'bg-red-500',
    borderColor: 'border-red-200',
  },
  expired: {
    label: 'Expired',
    textColor: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    dotColor: 'bg-yellow-500',
    borderColor: 'border-yellow-200',
  },
  // ---- Truck / asset statuses ----
  active: {
    label: 'Active',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
    dotColor: 'bg-green-500',
    borderColor: 'border-green-200',
  },
  maintenance: {
    label: 'Maintenance',
    textColor: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    dotColor: 'bg-yellow-500',
    borderColor: 'border-yellow-200',
  },
  inactive: {
    label: 'Inactive',
    textColor: 'text-gray-600',
    bgColor: 'bg-gray-100',
    dotColor: 'bg-gray-400',
    borderColor: 'border-gray-200',
  },
};

const FALLBACK_CONFIG: StatusConfig = {
  label: '',
  textColor: 'text-gray-600',
  bgColor: 'bg-gray-100',
  dotColor: 'bg-gray-400',
  borderColor: 'border-gray-200',
};

// =============================================================================
// COMPONENT
// =============================================================================

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: string;
  /** Override the display label */
  label?: string;
  /** Omit the dot indicator */
  hideDot?: boolean;
  /** Small variant (tighter padding, smaller font) */
  size?: 'sm' | 'md';
}

export function StatusBadge({
  status,
  label,
  hideDot = false,
  size = 'md',
  className,
  ...props
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    ...FALLBACK_CONFIG,
    label: status.replace(/_/g, ' '),
  };

  const displayLabel = label ?? (config.label || status.replace(/_/g, ' '));

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium border rounded-full whitespace-nowrap',
        config.textColor,
        config.bgColor,
        config.borderColor,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        className
      )}
      {...props}
    >
      {!hideDot && (
        <span
          className={cn(
            'flex-shrink-0 rounded-full',
            config.dotColor,
            size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2'
          )}
          aria-hidden="true"
        />
      )}
      <span className="capitalize">{displayLabel}</span>
    </span>
  );
}
