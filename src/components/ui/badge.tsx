import * as React from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// STATUS COLOR MAP
// =============================================================================

export const STATUS_COLORS: Record<string, string> = {
  // Customer statuses
  lead:        'bg-gray-100 text-gray-700 border-gray-200',
  contacted:   'bg-blue-100 text-blue-700 border-blue-200',
  quoted:      'bg-purple-100 text-purple-700 border-purple-200',
  follow_up:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  scheduled:   'bg-indigo-100 text-indigo-700 border-indigo-200',
  in_progress: 'bg-orange-100 text-orange-700 border-orange-200',
  completed:   'bg-green-100 text-green-700 border-green-200',
  cancelled:   'bg-red-100 text-red-700 border-red-200',

  // Quote statuses
  draft:    'bg-gray-100 text-gray-700 border-gray-200',
  sent:     'bg-blue-100 text-blue-700 border-blue-200',
  approved: 'bg-green-100 text-green-700 border-green-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  expired:  'bg-yellow-100 text-yellow-700 border-yellow-200',

  // Truck / asset statuses
  active:      'bg-green-100 text-green-700 border-green-200',
  maintenance: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  inactive:    'bg-gray-100 text-gray-700 border-gray-200',

  // Generic color aliases
  default: 'bg-gray-100 text-gray-700 border-gray-200',
  primary: 'bg-orange-100 text-orange-700 border-orange-200',
  success: 'bg-green-100 text-green-700 border-green-200',
  warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  danger:  'bg-red-100 text-red-700 border-red-200',
  info:    'bg-blue-100 text-blue-700 border-blue-200',
};

// =============================================================================
// TYPES
// =============================================================================

export type BadgeVariant = keyof typeof STATUS_COLORS | string;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  /** Render a leading dot indicator */
  dot?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', dot = false, className, children, ...props }, ref) => {
    const colorClasses =
      STATUS_COLORS[variant] ?? STATUS_COLORS['default'];

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5',
          'rounded-full text-xs font-medium border',
          'whitespace-nowrap',
          colorClasses,
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'inline-block h-1.5 w-1.5 rounded-full flex-shrink-0',
              // Derive dot color from text color class
              variant === 'completed' || variant === 'active' || variant === 'approved' || variant === 'success'
                ? 'bg-green-500'
                : variant === 'in_progress' || variant === 'primary'
                ? 'bg-orange-500'
                : variant === 'cancelled' || variant === 'rejected' || variant === 'danger'
                ? 'bg-red-500'
                : variant === 'follow_up' || variant === 'maintenance' || variant === 'warning' || variant === 'expired'
                ? 'bg-yellow-500'
                : variant === 'contacted' || variant === 'sent' || variant === 'info'
                ? 'bg-blue-500'
                : variant === 'scheduled'
                ? 'bg-indigo-500'
                : variant === 'quoted'
                ? 'bg-purple-500'
                : 'bg-gray-400'
            )}
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
