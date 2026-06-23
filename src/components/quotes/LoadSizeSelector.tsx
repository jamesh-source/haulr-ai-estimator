'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export interface LoadSize {
  id: string;
  label: string;
  fraction: string;
  cubicYards: number;
  truckPercent: number;
  price: number;
  description: string;
}

export interface LoadSizeSelectorProps {
  selected: string | null;
  onSelect: (loadSize: LoadSize) => void;
  basePrice?: number;
  className?: string;
}

// =============================================================================
// LOAD SIZE DATA
// =============================================================================

export const LOAD_SIZES: LoadSize[] = [
  {
    id: 'eighth',
    label: '1/8 Load',
    fraction: '⅛',
    cubicYards: 1.875,
    truckPercent: 12,
    price: 149,
    description: 'Small pickup worth',
  },
  {
    id: 'quarter',
    label: '1/4 Load',
    fraction: '¼',
    cubicYards: 3.75,
    truckPercent: 25,
    price: 249,
    description: 'Small room cleanout',
  },
  {
    id: 'three_eighths',
    label: '3/8 Load',
    fraction: '⅜',
    cubicYards: 5.625,
    truckPercent: 37,
    price: 329,
    description: 'One large room',
  },
  {
    id: 'half',
    label: '1/2 Load',
    fraction: '½',
    cubicYards: 7.5,
    truckPercent: 50,
    price: 399,
    description: 'Two rooms or garage',
  },
  {
    id: 'five_eighths',
    label: '5/8 Load',
    fraction: '⅝',
    cubicYards: 9.375,
    truckPercent: 62,
    price: 469,
    description: 'Large cleanout',
  },
  {
    id: 'three_quarters',
    label: '3/4 Load',
    fraction: '¾',
    cubicYards: 11.25,
    truckPercent: 75,
    price: 529,
    description: 'Most of the truck',
  },
  {
    id: 'full',
    label: 'Full Load',
    fraction: '1',
    cubicYards: 15,
    truckPercent: 100,
    price: 599,
    description: 'Entire truck capacity',
  },
  {
    id: 'custom',
    label: 'Custom',
    fraction: '?',
    cubicYards: 0,
    truckPercent: 0,
    price: 0,
    description: 'Enter custom amount',
  },
];

// =============================================================================
// TRUCK SVG FILL INDICATOR
// =============================================================================

function TruckFillIndicator({ percent }: { percent: number }) {
  const fillHeight = percent === 0 ? 0 : Math.max(8, (percent / 100) * 36);
  const fillColor =
    percent === 0
      ? 'transparent'
      : percent <= 33
      ? '#86efac'
      : percent <= 66
      ? '#fdba74'
      : '#f97316';

  return (
    <svg
      viewBox="0 0 64 40"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-8"
    >
      {/* Truck body outline */}
      <rect
        x="2"
        y="4"
        width="42"
        height="28"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-gray-400"
      />
      {/* Cargo fill */}
      {percent > 0 && (
        <rect
          x="3"
          y={32 - fillHeight}
          width="40"
          height={fillHeight}
          fill={fillColor}
          rx="1"
          opacity="0.8"
        />
      )}
      {/* Cab */}
      <path
        d="M44 14 L44 32 L60 32 L60 22 L52 14 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-gray-400"
      />
      {/* Windshield */}
      <path
        d="M46 14 L46 21 L58 21 L58 22 L52 15 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        className="text-gray-300"
      />
      {/* Wheels */}
      <circle cx="12" cy="34" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-500" />
      <circle cx="12" cy="34" r="1.5" fill="currentColor" className="text-gray-500" />
      <circle cx="34" cy="34" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-500" />
      <circle cx="34" cy="34" r="1.5" fill="currentColor" className="text-gray-500" />
      <circle cx="54" cy="34" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-500" />
      <circle cx="54" cy="34" r="1.5" fill="currentColor" className="text-gray-500" />
    </svg>
  );
}

// =============================================================================
// LOAD SIZE CARD
// =============================================================================

function LoadSizeCard({
  loadSize,
  isSelected,
  onSelect,
}: {
  loadSize: LoadSize;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const isCustom = loadSize.id === 'custom';

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all duration-150 text-left w-full',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1',
        isSelected
          ? 'border-orange-500 bg-orange-50 shadow-md shadow-orange-100'
          : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/30'
      )}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
          <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-white" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {/* Fraction label */}
      <span
        className={cn(
          'text-2xl font-bold leading-none',
          isSelected ? 'text-orange-600' : 'text-gray-700'
        )}
      >
        {loadSize.fraction}
      </span>

      {/* Truck visual */}
      <div className={cn('w-full', isCustom ? 'opacity-20' : '')}>
        <TruckFillIndicator percent={loadSize.truckPercent} />
      </div>

      {/* Label */}
      <span
        className={cn(
          'text-xs font-semibold',
          isSelected ? 'text-orange-700' : 'text-gray-600'
        )}
      >
        {loadSize.label}
      </span>

      {/* Yards */}
      {!isCustom && (
        <span className="text-[10px] text-gray-400">
          {loadSize.cubicYards} cu yd
        </span>
      )}

      {/* Price */}
      <span
        className={cn(
          'text-sm font-bold mt-0.5',
          isSelected ? 'text-orange-600' : 'text-gray-800'
        )}
      >
        {isCustom ? 'Custom $' : `$${loadSize.price}`}
      </span>

      {/* Percent bar */}
      {!isCustom && (
        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              loadSize.truckPercent <= 33
                ? 'bg-green-400'
                : loadSize.truckPercent <= 66
                ? 'bg-orange-400'
                : 'bg-orange-500'
            )}
            style={{ width: `${loadSize.truckPercent}%` }}
          />
        </div>
      )}
    </motion.button>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function LoadSizeSelector({
  selected,
  onSelect,
  className,
}: LoadSizeSelectorProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="grid grid-cols-4 gap-2">
        {LOAD_SIZES.map((loadSize) => (
          <LoadSizeCard
            key={loadSize.id}
            loadSize={loadSize}
            isSelected={selected === loadSize.id}
            onSelect={() => onSelect(loadSize)}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 rounded-sm bg-green-400" />
          <span>Small load</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 rounded-sm bg-orange-400" />
          <span>Medium load</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 rounded-sm bg-orange-500" />
          <span>Large load</span>
        </div>
        <span className="ml-auto">15 yd³ truck capacity</span>
      </div>
    </div>
  );
}
