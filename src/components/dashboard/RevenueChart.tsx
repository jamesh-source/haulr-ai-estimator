'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export interface RevenueDataPoint {
  date: string; // ISO date string
  revenue: number;
  jobs: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number; payload: RevenueDataPoint }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const revenue = payload[0].value;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-900 mb-1">
        {label ? format(parseISO(label), 'MMMM d, yyyy') : ''}
      </p>
      <div className="space-y-0.5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-500">Revenue</span>
          <span className="font-medium text-gray-900">
            ${revenue.toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-500">Jobs</span>
          <span className="font-medium text-gray-900">{data.jobs}</span>
        </div>
      </div>
    </div>
  );
}

interface RevenueChartProps {
  data: RevenueDataPoint[];
  loading?: boolean;
  className?: string;
  highlightColor?: string;
  barColor?: string;
}

export function RevenueChart({
  data,
  loading = false,
  className,
  highlightColor = '#2563eb',
  barColor = '#93c5fd',
}: RevenueChartProps) {
  if (loading) {
    return (
      <div className={cn('bg-white rounded-xl border border-gray-200 p-5', className)}>
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-36 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="h-48 bg-gray-50 rounded-lg animate-pulse flex items-end justify-around px-2 pb-2 gap-1">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-gray-200 rounded-sm"
              style={{ height: `${20 + Math.random() * 60}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className={cn('bg-white rounded-xl border border-gray-200 p-5', className)}>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">30-Day Revenue</h3>
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          No revenue data yet
        </div>
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue));
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);

  // Find today's index to highlight it
  const todayStr = new Date().toISOString().split('T')[0];
  const todayIndex = data.findIndex((d) => d.date.startsWith(todayStr));

  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 p-5', className)}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">30-Day Revenue</h3>
          <p className="text-xl font-bold text-gray-900 mt-0.5 tabular-nums">
            ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </p>
        </div>
        <div className="text-xs text-gray-500 text-right">
          <p>Peak day</p>
          <p className="font-medium text-gray-900">
            ${maxRevenue.toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={192}>
        <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }} barSize={8}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(value: string) => {
              try {
                return format(parseISO(value), 'd');
              } catch {
                return value;
              }
            }}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            interval={4}
          />
          <YAxis
            tickFormatter={(value: number) =>
              value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`
            }
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(59,130,246,0.06)', radius: 4 }}
          />
          <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  index === todayIndex
                    ? highlightColor
                    : barColor
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
