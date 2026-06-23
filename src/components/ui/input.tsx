'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  /** Node rendered inside the left side of the input (e.g. icon or currency symbol) */
  leftIcon?: React.ReactNode;
  /** Node rendered inside the right side of the input (e.g. icon or unit label) */
  suffix?: React.ReactNode;
  /** Wrapper className */
  wrapperClassName?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      suffix,
      className,
      wrapperClassName,
      id,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? React.useId();
    const hasError = Boolean(error);

    return (
      <div className={cn('flex flex-col gap-1', wrapperClassName)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'text-sm font-medium',
              hasError ? 'text-red-600' : 'text-gray-700'
            )}
          >
            {label}
            {required && (
              <span className="ml-0.5 text-red-500" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        {/* Input wrapper */}
        <div className="relative flex items-center">
          {/* Prefix */}
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 flex items-center text-gray-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            aria-invalid={hasError}
            aria-describedby={
              hasError
                ? `${inputId}-error`
                : helperText
                ? `${inputId}-helper`
                : undefined
            }
            className={cn(
              'w-full rounded-lg border bg-white text-sm text-gray-900',
              'placeholder:text-gray-400',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400',
              // sizing
              'h-10 px-3 py-2',
              // leftIcon/suffix padding adjustments
              leftIcon ? 'pl-9' : '',
              suffix ? 'pr-9' : '',
              // state variants
              hasError
                ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                : 'border-gray-300 focus:border-orange-400 focus:ring-orange-100',
              className
            )}
            {...props}
          />

          {/* Suffix */}
          {suffix && (
            <div className="pointer-events-none absolute right-3 flex items-center text-gray-400">
              {suffix}
            </div>
          )}
        </div>

        {/* Error message */}
        {hasError && (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="text-xs text-red-600"
          >
            {error}
          </p>
        )}

        {/* Helper text (only shown when no error) */}
        {!hasError && helperText && (
          <p id={`${inputId}-helper`} className="text-xs text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
