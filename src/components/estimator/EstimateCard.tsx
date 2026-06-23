'use client';

import { useState } from 'react';
import {
  Truck,
  Clock,
  DollarSign,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Edit3,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatCurrency } from '@/lib/utils';
import type { AIEstimate } from '@/types';

// ---------------------------------------------------------------------------
// Truck load arc visualization
// ---------------------------------------------------------------------------

function TruckLoadArc({ percentage }: { percentage: number }) {
  const clamped = Math.min(100, Math.max(0, percentage));
  const radius = 54;
  const circumference = Math.PI * radius; // half circle
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  const color =
    clamped >= 90 ? '#ef4444' :
    clamped >= 70 ? '#f59e0b' :
    '#3b82f6';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-20">
        <svg
          width="144"
          height="80"
          viewBox="0 0 144 80"
          className="overflow-visible"
        >
          {/* Track */}
          <path
            d="M 8 72 A 64 64 0 0 1 136 72"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Progress */}
          <path
            d="M 8 72 A 64 64 0 0 1 136 72"
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.4s ease' }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-0">
          <span className="text-3xl font-bold text-gray-900">{clamped}%</span>
        </div>
      </div>
      <div className="mt-1 flex items-center gap-1.5">
        <Truck className="h-4 w-4 text-gray-400" />
        <span className="text-xs text-gray-500 font-medium">Truck Usage</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Profit margin indicator
// ---------------------------------------------------------------------------

function ProfitIndicator({ margin }: { margin: number }) {
  const pct = Math.round(margin * 100);

  if (pct >= 40) {
    return (
      <div className="flex items-center gap-1.5 text-emerald-600">
        <CheckCircle2 className="h-4 w-4" />
        <span className="text-sm font-semibold">{pct}% margin — Excellent</span>
      </div>
    );
  }
  if (pct >= 25) {
    return (
      <div className="flex items-center gap-1.5 text-yellow-600">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm font-semibold">{pct}% margin — Good</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-red-600">
      <XCircle className="h-4 w-4" />
      <span className="text-sm font-semibold">{pct}% margin — Low</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Metric row
// ---------------------------------------------------------------------------

function MetricRow({
  icon: Icon,
  label,
  value,
  subValue,
  iconColor = 'text-gray-400',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subValue?: string;
  iconColor?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2.5">
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50', iconColor)}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-gray-900">{value}</p>
        {subValue && <p className="text-xs text-gray-400">{subValue}</p>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Override input
// ---------------------------------------------------------------------------

function OverrideInput({
  label,
  value,
  onChange,
  prefix,
  suffix,
  min = 0,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">{prefix}</span>
        )}
        <input
          type="number"
          min={min}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className={cn(
            'w-full rounded-lg border border-gray-300 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
            prefix ? 'pl-7 pr-3' : 'pl-3 pr-3',
            suffix ? 'pr-8' : ''
          )}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">{suffix}</span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export interface EstimateOverrides {
  suggestedPrice: number;
  laborHours: number;
  dumpFee: number;
  cubicYards: number;
}

interface EstimateCardProps {
  estimate: AIEstimate;
  overrides: EstimateOverrides;
  onOverridesChange: (overrides: EstimateOverrides) => void;
  onBuildQuote: () => void;
  className?: string;
}

export function EstimateCard({
  estimate,
  overrides,
  onOverridesChange,
  onBuildQuote,
  className,
}: EstimateCardProps) {
  const [mode, setMode] = useState<'ai' | 'modify'>('ai');
  const [showBreakdown, setShowBreakdown] = useState(false);

  const activePrice = mode === 'ai' ? estimate.suggested_price : overrides.suggestedPrice;
  const activeLabor = mode === 'ai' ? estimate.estimated_labor_hours : overrides.laborHours;
  const activeDump = mode === 'ai' ? estimate.estimated_dump_cost : overrides.dumpFee;
  const activeYards = mode === 'ai' ? estimate.total_cubic_yards : overrides.cubicYards;

  const laborCost = activeLabor * 35; // assume $35/hr
  const profit = activePrice - activeDump - laborCost;
  const margin = activePrice > 0 ? profit / activePrice : 0;
  const truckPct = Math.round((activeYards / 15) * 100);

  function update(field: keyof EstimateOverrides, val: number) {
    onOverridesChange({ ...overrides, [field]: val });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden', className)}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-xs font-medium uppercase tracking-wide">AI Estimate</p>
            <p className="text-white text-2xl font-bold mt-0.5">{formatCurrency(activePrice)}</p>
          </div>
          <div className="text-right">
            <p className="text-blue-200 text-xs">Est. Profit</p>
            <p className="text-white font-bold text-lg">
              {formatCurrency(profit)}
            </p>
          </div>
        </div>
      </div>

      {/* Truck arc + cubic yards */}
      <div className="flex items-center justify-around px-5 py-5 border-b border-gray-100">
        <TruckLoadArc percentage={truckPct} />
        <div className="text-center">
          <p className="text-5xl font-bold text-gray-900">{activeYards.toFixed(1)}</p>
          <p className="text-sm text-gray-500 mt-1">Cubic Yards</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="px-5 py-2">
        <MetricRow
          icon={Clock}
          label="Estimated Labor"
          value={`${activeLabor} hours`}
          subValue={`~${formatCurrency(activeLabor * 35)} labor cost`}
          iconColor="text-indigo-500"
        />
        <MetricRow
          icon={DollarSign}
          label="Estimated Dump Fee"
          value={formatCurrency(activeDump)}
          iconColor="text-orange-500"
        />
        <MetricRow
          icon={TrendingUp}
          label="Profit"
          value={formatCurrency(profit)}
          subValue={`${Math.round(margin * 100)}% margin`}
          iconColor={margin >= 0.4 ? 'text-emerald-500' : margin >= 0.25 ? 'text-yellow-500' : 'text-red-500'}
        />
      </div>

      {/* Profit indicator */}
      <div className="px-5 py-3 border-t border-gray-100">
        <ProfitIndicator margin={margin} />
      </div>

      {/* Accept / Modify toggle */}
      <div className="px-5 pb-4 border-t border-gray-100 pt-4">
        <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-gray-50 p-1 gap-1">
          <button
            onClick={() => setMode('ai')}
            className={cn(
              'flex-1 rounded-lg py-2 text-sm font-medium transition-all',
              mode === 'ai'
                ? 'bg-white shadow text-blue-700 border border-blue-100'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            Accept AI Estimate
          </button>
          <button
            onClick={() => setMode('modify')}
            className={cn(
              'flex-1 rounded-lg py-2 text-sm font-medium transition-all flex items-center justify-center gap-1.5',
              mode === 'modify'
                ? 'bg-white shadow text-blue-700 border border-blue-100'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Edit3 className="h-3.5 w-3.5" />
            Modify
          </button>
        </div>

        {/* Override fields */}
        <AnimatePresence>
          {mode === 'modify' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 grid grid-cols-2 gap-3 overflow-hidden"
            >
              <OverrideInput
                label="Suggested Price"
                value={overrides.suggestedPrice}
                onChange={v => update('suggestedPrice', v)}
                prefix="$"
                min={0}
              />
              <OverrideInput
                label="Cubic Yards"
                value={overrides.cubicYards}
                onChange={v => update('cubicYards', v)}
                suffix="yd³"
                min={0}
              />
              <OverrideInput
                label="Labor Hours"
                value={overrides.laborHours}
                onChange={v => update('laborHours', v)}
                suffix="hrs"
                min={0}
              />
              <OverrideInput
                label="Dump Fee"
                value={overrides.dumpFee}
                onChange={v => update('dumpFee', v)}
                prefix="$"
                min={0}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Price breakdown expandable */}
      <div className="border-t border-gray-100">
        <button
          onClick={() => setShowBreakdown(v => !v)}
          className="flex w-full items-center justify-between px-5 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <span className="font-medium">Price Breakdown</span>
          {showBreakdown ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        <AnimatePresence>
          {showBreakdown && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-4 space-y-2">
                {[
                  { label: 'Load / Haul', value: activePrice * 0.6 },
                  { label: 'Labor', value: activeLabor * 35 },
                  { label: 'Dump Fee', value: activeDump },
                  { label: 'Subtotal', value: activePrice * 0.6 + activeLabor * 35 + activeDump },
                  { label: 'Margin', value: profit, highlight: true },
                ].map(row => (
                  <div
                    key={row.label}
                    className={cn(
                      'flex justify-between text-sm',
                      row.highlight
                        ? 'font-semibold text-gray-900 pt-2 border-t border-gray-100'
                        : 'text-gray-600'
                    )}
                  >
                    <span>{row.label}</span>
                    <span className={row.highlight && row.value < 0 ? 'text-red-600' : ''}>
                      {formatCurrency(row.value)}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Build Quote CTA */}
      <div className="px-5 pb-5 pt-2">
        <button
          onClick={onBuildQuote}
          className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-3.5 text-sm font-semibold text-white shadow-md hover:from-blue-700 hover:to-blue-600 transition-all active:scale-[0.98]"
        >
          Build Quote →
        </button>
      </div>
    </motion.div>
  );
}
