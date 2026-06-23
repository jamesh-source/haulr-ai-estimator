import * as React from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// CARD ROOT
// =============================================================================

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Add hover elevation effect */
  hoverable?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-white rounded-xl border border-gray-100 shadow-sm',
        hoverable &&
          'transition-shadow duration-200 hover:shadow-md cursor-pointer',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

// =============================================================================
// CARD HEADER
// =============================================================================

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col gap-1 px-6 pt-6 pb-0', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

// =============================================================================
// CARD TITLE
// =============================================================================

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-tight text-gray-900',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

// =============================================================================
// CARD DESCRIPTION
// =============================================================================

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-gray-500 leading-relaxed', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

// =============================================================================
// CARD CONTENT
// =============================================================================

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('px-6 py-4', className)} {...props} />
));
CardContent.displayName = 'CardContent';

// =============================================================================
// CARD FOOTER
// =============================================================================

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center gap-3 px-6 py-4 pt-0 border-t border-gray-100 mt-2',
      className
    )}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';
