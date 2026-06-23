'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export type ButtonVariant =
  | 'default'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'success';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  asChild?: boolean;
}

// =============================================================================
// VARIANT / SIZE MAPS
// =============================================================================

const variantClasses: Record<ButtonVariant, string> = {
  default:
    'bg-orange-500 text-white shadow-sm hover:bg-orange-600 active:bg-orange-700 focus-visible:ring-orange-500',
  outline:
    'border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 active:bg-gray-100 focus-visible:ring-gray-400',
  ghost:
    'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200 focus-visible:ring-gray-400',
  danger:
    'bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500',
  success:
    'bg-green-600 text-white shadow-sm hover:bg-green-700 active:bg-green-800 focus-visible:ring-green-500',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm:   'h-8 px-3 text-xs gap-1.5',
  md:   'h-10 px-4 text-sm gap-2',
  lg:   'h-12 px-6 text-base gap-2',
  icon: 'h-10 w-10 p-0',
};

// =============================================================================
// COMPONENT
// =============================================================================

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'default',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // base
          'inline-flex items-center justify-center rounded-lg font-medium',
          'transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {size !== 'icon' && children}
        {!loading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
