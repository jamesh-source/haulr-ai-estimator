'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip,
} from 'recharts';

interface SparklinePoint {
  value: number;
}

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number; // percentage change vs last period; positive = up
  changePeriod?: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  iconBg?: string;
  sparklineData?: SparklinePoint[];
  sparklineColor?: string;
  loading?: boolean;
  className?: string;
}

function Sparkline({
  data,
  color,
}: {
  data: SparklinePoint[];
  color: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={48}>
      <LineChart data={data} margin={{ top: 4, right: 0, bottom: 4, left: 0 }}>
        <Tooltip
          content={() => null}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 3, fill: color }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function StatsCard({
  title,
  value,
  change,
  changePeriod = 'vs last month',
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBg = 'bg-blue-50',
  sparklineData,
  sparklineColor = '#3b82f6',
  loading = false,
  className,
}: StatsCardProps) {
  const hasChange = change !== undefined && change !== null;
  const isPositive = (change ?? 0) > 0;
  const isNeutral = change === 0;

  if (loading) {
    return (
      <div
        className={cn(
          'bg-white rounded-xl border border-gray-200 p-5 animate-pulse',
          className
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-8 w-8 bg-gray-200 rounded-lg" />
        </div>
        <div className="h-8 w-32 bg-gray-200 rounded mb-2" />
        <div className="h-3 w-20 bg-gray-100 rounded" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {Icon && (
          <div className={cn('flex items-center justify-center w-9 h-9 rounded-lg', iconBg)}>
            <Icon className={cn('w-4.5 h-4.5', iconColor)} />
          </div>
        )}
      </div>

      <div className="mt-2">
        <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
      </div>

      {/* Sparkline */}
      {sparklineData && sparklineData.length > 1 && (
        <div className="mt-2 -mx-1">
          <Sparkline data={sparklineData} color={sparklineColor} />
        </div>
      )}

      {/* Change badge */}
      {hasChange && (
        <div className="flex items-center gap-1 mt-2">
          {isNeutral ? (
            <>
              <Minus className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-500">No change</span>
            </>
          ) : isPositive ? (
            <>
              <TrendingUp className="w-3.5 h-3.5 text-green-500" />
              <span className="text-xs font-medium text-green-600">
                +{Math.abs(change ?? 0).toFixed(1)}%
              </span>
            </>
          ) : (
            <>
              <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              <span className="text-xs font-medium text-red-600">
                -{Math.abs(change ?? 0).toFixed(1)}%
              </span>
            </>
          )}
          <span className="text-xs text-gray-400">{changePeriod}</span>
        </div>
      )}
    </div>
  );
}
