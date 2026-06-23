import * as React from 'react';
import { InboxIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export interface EmptyStateProps {
  /** Icon rendered above the title. Defaults to InboxIcon */
  icon?: React.ReactNode;
  title: string;
  description?: string;
  /** Call-to-action element (e.g. a Button) */
  cta?: React.ReactNode;
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function EmptyState({
  icon,
  title,
  description,
  cta,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 py-12 px-6 text-center',
        className
      )}
    >
      {/* Icon */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        {icon ?? <InboxIcon className="h-8 w-8" />}
      </div>

      {/* Text */}
      <div className="space-y-1 max-w-xs">
        <p className="text-base font-semibold text-gray-800">{title}</p>
        {description && (
          <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
        )}
      </div>

      {/* CTA */}
      {cta && <div className="mt-2">{cta}</div>}
    </div>
  );
}
