import * as React from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// SKELETON BASE
// =============================================================================

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Round the skeleton into a circle (avatar use case) */
  circle?: boolean;
}

export function Skeleton({ className, circle = false, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200',
        circle ? 'rounded-full' : 'rounded-md',
        className
      )}
      {...props}
    />
  );
}

// =============================================================================
// PREBUILT SKELETON SHAPES
// =============================================================================

/** Single line of text skeleton */
export function SkeletonText({
  className,
  lines = 1,
  lastLineWidth = '75%',
}: {
  className?: string;
  lines?: number;
  lastLineWidth?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4 w-full"
          style={
            i === lines - 1 && lines > 1
              ? { width: lastLineWidth }
              : undefined
          }
        />
      ))}
    </div>
  );
}

/** Avatar / profile image skeleton */
export function SkeletonAvatar({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Skeleton
      circle
      className={className}
      style={{ width: size, height: size, flexShrink: 0 }}
    />
  );
}

/** Card-shaped skeleton */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-100 bg-white p-6 shadow-sm',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <SkeletonAvatar size={48} />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

/** Table row skeleton */
export function SkeletonTableRow({
  columns = 5,
  className,
}: {
  columns?: number;
  className?: string;
}) {
  return (
    <tr className={className}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

/** Grid of skeleton cards */
export function SkeletonGrid({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3',
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
