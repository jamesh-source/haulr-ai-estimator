'use client';

import * as React from 'react';
import * as RadixSelect from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  placeholder?: string;
  options: SelectOption[];
  label?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  wrapperClassName?: string;
  /** Render as a group with a heading */
  groups?: { heading: string; options: SelectOption[] }[];
}

// =============================================================================
// SUB-COMPONENTS (re-exported for advanced use)
// =============================================================================

export const SelectRoot = RadixSelect.Root;
export const SelectGroup = RadixSelect.Group;
export const SelectValue = RadixSelect.Value;

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof RadixSelect.Trigger>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Trigger> & {
    hasError?: boolean;
  }
>(({ className, children, hasError, ...props }, ref) => (
  <RadixSelect.Trigger
    ref={ref}
    className={cn(
      'flex h-10 w-full items-center justify-between rounded-lg border px-3 py-2',
      'bg-white text-sm text-gray-900 shadow-sm',
      'placeholder:text-gray-400',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400',
      'transition-colors duration-150',
      hasError
        ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
        : 'border-gray-300 focus:border-orange-400 focus:ring-orange-100',
      className
    )}
    {...props}
  >
    {children}
    <RadixSelect.Icon asChild>
      <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
    </RadixSelect.Icon>
  </RadixSelect.Trigger>
));
SelectTrigger.displayName = RadixSelect.Trigger.displayName;

export const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof RadixSelect.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <RadixSelect.ScrollUpButton
    ref={ref}
    className={cn(
      'flex cursor-default items-center justify-center py-1',
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4 text-gray-500" />
  </RadixSelect.ScrollUpButton>
));
SelectScrollUpButton.displayName = RadixSelect.ScrollUpButton.displayName;

export const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof RadixSelect.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <RadixSelect.ScrollDownButton
    ref={ref}
    className={cn(
      'flex cursor-default items-center justify-center py-1',
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4 text-gray-500" />
  </RadixSelect.ScrollDownButton>
));
SelectScrollDownButton.displayName = RadixSelect.ScrollDownButton.displayName;

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof RadixSelect.Content>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <RadixSelect.Portal>
    <RadixSelect.Content
      ref={ref}
      className={cn(
        'relative z-50 max-h-96 min-w-[8rem] overflow-hidden',
        'rounded-lg border border-gray-200 bg-white shadow-lg',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
        'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <RadixSelect.Viewport
        className={cn(
          'p-1',
          position === 'popper' &&
            'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
        )}
      >
        {children}
      </RadixSelect.Viewport>
      <SelectScrollDownButton />
    </RadixSelect.Content>
  </RadixSelect.Portal>
));
SelectContent.displayName = RadixSelect.Content.displayName;

export const SelectLabel = React.forwardRef<
  React.ElementRef<typeof RadixSelect.Label>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Label>
>(({ className, ...props }, ref) => (
  <RadixSelect.Label
    ref={ref}
    className={cn(
      'px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide',
      className
    )}
    {...props}
  />
));
SelectLabel.displayName = RadixSelect.Label.displayName;

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof RadixSelect.Item>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Item>
>(({ className, children, ...props }, ref) => (
  <RadixSelect.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-default select-none items-center',
      'rounded-md py-2 pl-8 pr-2 text-sm text-gray-900',
      'outline-none',
      'focus:bg-orange-50 focus:text-orange-900',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <RadixSelect.ItemIndicator>
        <Check className="h-4 w-4 text-orange-500" />
      </RadixSelect.ItemIndicator>
    </span>
    <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
  </RadixSelect.Item>
));
SelectItem.displayName = RadixSelect.Item.displayName;

export const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof RadixSelect.Separator>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Separator>
>(({ className, ...props }, ref) => (
  <RadixSelect.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-gray-100', className)}
    {...props}
  />
));
SelectSeparator.displayName = RadixSelect.Separator.displayName;

// =============================================================================
// COMPOSED SELECT (batteries-included)
// =============================================================================

export function Select({
  value,
  onValueChange,
  defaultValue,
  placeholder = 'Select…',
  options,
  groups,
  label,
  error,
  helperText,
  disabled,
  required,
  className,
  wrapperClassName,
}: SelectProps) {
  const id = React.useId();
  const hasError = Boolean(error);

  return (
    <div className={cn('flex flex-col gap-1', wrapperClassName)}>
      {label && (
        <label
          htmlFor={id}
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

      <SelectRoot
        value={value}
        onValueChange={onValueChange}
        defaultValue={defaultValue}
        disabled={disabled}
      >
        <SelectTrigger id={id} hasError={hasError} className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent>
          {/* Flat options list */}
          {!groups &&
            options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </SelectItem>
            ))}

          {/* Grouped options */}
          {groups?.map((group, idx) => (
            <React.Fragment key={group.heading}>
              {idx > 0 && <SelectSeparator />}
              <SelectGroup>
                <SelectLabel>{group.heading}</SelectLabel>
                {group.options.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </React.Fragment>
          ))}
        </SelectContent>
      </SelectRoot>

      {hasError && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
      {!hasError && helperText && (
        <p className="text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
}
