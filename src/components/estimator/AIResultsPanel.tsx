'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  Recycle,
  Heart,
  Package,
  Tv,
  Sofa,
  Zap,
  Leaf,
  Wrench,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  BarChart3,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { cn } from '@/lib/utils';
import type { AIEstimate, DetectedItem, ItemCategory } from '@/types';

// ---------------------------------------------------------------------------
// Category config
// ---------------------------------------------------------------------------

const CATEGORY_CONFIG: Record<
  ItemCategory,
  { label: string; Icon: React.ComponentType<{ className?: string }>; color: string; barColor: string }
> = {
  furniture:   { label: 'Furniture',    Icon: Sofa,       color: 'text-amber-600',   barColor: '#f59e0b' },
  appliance:   { label: 'Appliances',   Icon: Zap,        color: 'text-blue-600',    barColor: '#3b82f6' },
  electronics: { label: 'Electronics',  Icon: Tv,         color: 'text-purple-600',  barColor: '#9333ea' },
  debris:      { label: 'Debris',       Icon: Package,    color: 'text-gray-600',    barColor: '#6b7280' },
  yard:        { label: 'Yard Waste',   Icon: Leaf,       color: 'text-green-600',   barColor: '#16a34a' },
  metal:       { label: 'Metal',        Icon: Wrench,     color: 'text-slate-600',   barColor: '#475569' },
  hazmat:      { label: 'Hazmat',       Icon: AlertTriangle, color: 'text-red-600',  barColor: '#dc2626' },
  other:       { label: 'Other',        Icon: ShoppingBag, color: 'text-gray-500',   barColor: '#9ca3af' },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ConfidenceBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 80 ? 'bg-emerald-100 text-emerald-700' :
    pct >= 60 ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700';
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', color)}>
      {pct}%
    </span>
  );
}

// ---------------------------------------------------------------------------
// Detected Item Row
// ---------------------------------------------------------------------------

function ItemRow({ item }: { item: DetectedItem }) {
  const cfg = CATEGORY_CONFIG[item.category] ?? CATEGORY_CONFIG.other;
  const { Icon } = cfg;

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50', cfg.color)}>
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-900 capitalize">
            {item.name}
          </span>
          {item.quantity > 1 && (
            <span className="text-xs text-gray-500">×{item.quantity}</span>
          )}
          {item.donation_potential && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200">
              <Heart className="h-2.5 w-2.5" /> Donate
            </span>
          )}
          {item.recycling_potential && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-200">
              <Recycle className="h-2.5 w-2.5" /> Recycle
            </span>
          )}
          {item.category === 'hazmat' && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700 border border-red-200">
              <AlertTriangle className="h-2.5 w-2.5" /> Hazmat
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          ~{item.estimated_volume_cf} cu ft · {item.estimated_weight_lbs} lbs
        </p>
      </div>

      <ConfidenceBadge score={item.confidence} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Volume Chart
// ---------------------------------------------------------------------------

function VolumeChart({ items }: { items: DetectedItem[] }) {
  // Aggregate by category
  const grouped: Record<string, number> = {};
  for (const item of items) {
    const key = CATEGORY_CONFIG[item.category]?.label ?? 'Other';
    grouped[key] = (grouped[key] ?? 0) + item.estimated_volume_cf * item.quantity;
  }

  const data = Object.entries(grouped)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value: Math.round(value * 10) / 10 }));

  if (data.length === 0) return null;

  const categoryColors = Object.fromEntries(
    Object.values(CATEGORY_CONFIG).map(c => [c.label, c.barColor])
  );

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-700">Volume by Category (cu ft)</span>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
            formatter={(v: number) => [`${v} cu ft`, 'Volume']}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map(entry => (
              <Cell
                key={entry.name}
                fill={categoryColors[entry.name] ?? '#9ca3af'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface AIResultsPanelProps {
  estimate: AIEstimate;
  className?: string;
}

export function AIResultsPanel({ estimate, className }: AIResultsPanelProps) {
  const [showAll, setShowAll] = useState(false);
  const [showChart, setShowChart] = useState(true);

  const displayItems = showAll
    ? estimate.items_detected
    : estimate.items_detected.slice(0, 6);

  const hasHazards = estimate.hazard_warnings.length > 0;
  const hasDonations = estimate.donation_items.length > 0;
  const hasRecycling = estimate.recycling_items.length > 0;
  const overallConfidence = Math.round(estimate.confidence_score * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('space-y-4', className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <h3 className="font-semibold text-gray-900">AI Analysis Complete</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Overall confidence</span>
          <ConfidenceBadge score={estimate.confidence_score} />
        </div>
      </div>

      {/* Analysis notes */}
      {estimate.analysis_notes && (
        <div className="flex gap-2 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2.5">
          <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">{estimate.analysis_notes}</p>
        </div>
      )}

      {/* Hazard warnings */}
      <AnimatePresence>
        {hasHazards && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="rounded-xl bg-red-50 border border-red-200 p-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-semibold text-red-800">Hazmat Detected</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {estimate.hazard_warnings.map((w, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-full bg-red-100 border border-red-300 px-2.5 py-0.5 text-xs font-medium text-red-800"
                >
                  {w}
                </span>
              ))}
            </div>
            <p className="text-xs text-red-600 mt-2">
              Special disposal may be required. Verify compliance before removal.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Donation & Recycling callouts */}
      {(hasDonations || hasRecycling) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {hasDonations && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-800">Donation Opportunities</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {estimate.donation_items.map((item, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-xs text-emerald-800 capitalize"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
          {hasRecycling && (
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Recycle className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-800">Recyclable Items</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {estimate.recycling_items.map((item, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-blue-100 border border-blue-300 px-2 py-0.5 text-xs text-blue-800 capitalize"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detected items */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
          <span className="text-sm font-semibold text-gray-800">
            Detected Items ({estimate.items_detected.length})
          </span>
          <button
            onClick={() => setShowChart(v => !v)}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            {showChart ? 'Hide' : 'Show'} chart
          </button>
        </div>

        <div className="divide-y divide-gray-100 px-4">
          {displayItems.map((item, i) => (
            <ItemRow key={i} item={item} />
          ))}
        </div>

        {estimate.items_detected.length > 6 && (
          <div className="border-t border-gray-100 px-4 py-2">
            <button
              onClick={() => setShowAll(v => !v)}
              className="flex w-full items-center justify-center gap-1 text-sm text-blue-600 hover:text-blue-700 py-1"
            >
              {showAll ? (
                <>Show less <ChevronUp className="h-3.5 w-3.5" /></>
              ) : (
                <>Show {estimate.items_detected.length - 6} more <ChevronDown className="h-3.5 w-3.5" /></>
              )}
            </button>
          </div>
        )}

        {/* Volume chart */}
        <AnimatePresence>
          {showChart && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-gray-100 px-4 pb-4"
            >
              <VolumeChart items={estimate.items_detected} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
