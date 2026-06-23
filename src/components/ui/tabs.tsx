'use client';

import * as React from 'react';
import * as RadixTabs from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

// =============================================================================
// RADIX PRIMITIVES (re-exported)
// =============================================================================

export const TabsRoot = RadixTabs.Root;

// =============================================================================
// TABS LIST
// =============================================================================

export const TabsList = React.forwardRef<
  React.ElementRef<typeof RadixTabs.List>,
  React.ComponentPropsWithoutRef<typeof RadixTabs.List>
>(({ className, ...props }, ref) => (
  <RadixTabs.List
    ref={ref}
    className={cn(
      'flex border-b border-gray-200 gap-0',
      className
    )}
    {...props}
  />
));
TabsList.displayName = RadixTabs.List.displayName;

// =============================================================================
// TABS TRIGGER (underline style)
// =============================================================================

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof RadixTabs.Trigger>,
  React.ComponentPropsWithoutRef<typeof RadixTabs.Trigger>
>(({ className, ...props }, ref) => (
  <RadixTabs.Trigger
    ref={ref}
    className={cn(
      // layout
      'relative inline-flex items-center gap-2 px-4 py-2.5',
      // typography
      'text-sm font-medium whitespace-nowrap',
      // colors
      'text-gray-500 hover:text-gray-700',
      // focus
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-inset',
      // transition
      'transition-colors duration-150',
      // disabled
      'disabled:pointer-events-none disabled:opacity-50',
      // active state — underline indicator
      'data-[state=active]:text-orange-600',
      'data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0',
      'data-[state=active]:after:h-0.5 data-[state=active]:after:w-full data-[state=active]:after:bg-orange-500',
      'data-[state=active]:after:rounded-t-full',
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = RadixTabs.Trigger.displayName;

// =============================================================================
// TABS CONTENT
// =============================================================================

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof RadixTabs.Content>,
  React.ComponentPropsWithoutRef<typeof RadixTabs.Content>
>(({ className, ...props }, ref) => (
  <RadixTabs.Content
    ref={ref}
    className={cn(
      'mt-4',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
));
TabsContent.displayName = RadixTabs.Content.displayName;

// =============================================================================
// COMPOSED TABS
// =============================================================================

export interface TabItem {
  value: string;
  label: string;
  /** Optional badge/count shown after the label */
  badge?: number | string;
  icon?: React.ReactNode;
  disabled?: boolean;
  content: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  listClassName?: string;
  contentClassName?: string;
}

export function Tabs({
  items,
  defaultValue,
  value,
  onValueChange,
  className,
  listClassName,
  contentClassName,
}: TabsProps) {
  return (
    <TabsRoot
      defaultValue={defaultValue ?? items[0]?.value}
      value={value}
      onValueChange={onValueChange}
      className={className}
    >
      <TabsList className={listClassName}>
        {items.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            disabled={item.disabled}
          >
            {item.icon}
            {item.label}
            {item.badge !== undefined && (
              <span className="ml-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">
                {item.badge}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>

      {items.map((item) => (
        <TabsContent
          key={item.value}
          value={item.value}
          className={contentClassName}
        >
          {item.content}
        </TabsContent>
      ))}
    </TabsRoot>
  );
}
