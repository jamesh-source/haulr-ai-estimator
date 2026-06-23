'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface JobTypeProfit {
  jobType: string;
  jobCount: number;
  avgRevenue: number;
  avgCost: number;
  avgProfit: number;
  margin: number;
  trend: 'up' | 'down' | 'flat';
  trendPct: number;
}

interface ProfitabilityTableProps {
  data: JobTypeProfit[];
}

function TrendBadge({ trend, pct }: { trend: 'up' | 'down' | 'flat'; pct: number }) {
  if (trend === 'up') {
    return (
      <span className="inline-flex items-center gap-0.5 text-emerald-400 text-xs font-medium">
        <TrendingUp className="w-3 h-3" />
        +{pct}%
      </span>
    );
  }
  if (trend === 'down') {
    return (
      <span className="inline-flex items-center gap-0.5 text-red-400 text-xs font-medium">
        <TrendingDown className="w-3 h-3" />
        -{pct}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-gray-500 text-xs font-medium">
      <Minus className="w-3 h-3" />
      {pct}%
    </span>
  );
}

function MarginBar({ margin }: { margin: number }) {
  const color = margin >= 40 ? 'bg-emerald-500' : margin >= 25 ? 'bg-orange-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(margin, 100)}%` }} />
      </div>
      <span
        className={`text-xs font-semibold ${
          margin >= 40 ? 'text-emerald-400' : margin >= 25 ? 'text-orange-400' : 'text-red-400'
        }`}
      >
        {margin.toFixed(1)}%
      </span>
    </div>
  );
}

export function ProfitabilityTable({ data }: ProfitabilityTableProps) {
  const sorted = [...data].sort((a, b) => b.margin - a.margin);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="text-left text-gray-500 font-medium text-xs pb-3 pr-4">#</th>
            <th className="text-left text-gray-500 font-medium text-xs pb-3 pr-4">Job Type</th>
            <th className="text-left text-gray-500 font-medium text-xs pb-3 pr-4">Jobs</th>
            <th className="text-left text-gray-500 font-medium text-xs pb-3 pr-4">Avg Revenue</th>
            <th className="text-left text-gray-500 font-medium text-xs pb-3 pr-4">Avg Profit</th>
            <th className="text-left text-gray-500 font-medium text-xs pb-3 pr-4">Margin</th>
            <th className="text-left text-gray-500 font-medium text-xs pb-3">Trend</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/50">
          {sorted.map((row, i) => (
            <tr key={row.jobType} className="hover:bg-gray-800/20 transition-colors">
              <td className="py-3 pr-4">
                <span className="text-gray-600 text-xs font-mono">{i + 1}</span>
              </td>
              <td className="py-3 pr-4">
                <span className="text-gray-200 font-medium text-sm">{row.jobType}</span>
              </td>
              <td className="py-3 pr-4">
                <span className="text-gray-400 text-sm">{row.jobCount}</span>
              </td>
              <td className="py-3 pr-4">
                <span className="text-gray-200 text-sm">${row.avgRevenue.toLocaleString()}</span>
              </td>
              <td className="py-3 pr-4">
                <span className="text-emerald-400 text-sm font-medium">${row.avgProfit.toLocaleString()}</span>
              </td>
              <td className="py-3 pr-4">
                <MarginBar margin={row.margin} />
              </td>
              <td className="py-3">
                <TrendBadge trend={row.trend} pct={row.trendPct} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
