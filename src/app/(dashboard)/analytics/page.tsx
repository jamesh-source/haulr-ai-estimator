'use client';

import { BarChart2, TrendingUp, DollarSign, Briefcase } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-gray-100 text-2xl font-bold">Analytics</h1>
        <p className="text-gray-500 text-sm mt-0.5">Business performance insights</p>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 bg-gray-800 border border-gray-700 rounded-2xl flex items-center justify-center mb-6">
          <BarChart2 className="w-10 h-10 text-gray-600" />
        </div>
        <h2 className="text-gray-200 text-xl font-semibold mb-2">No data yet</h2>
        <p className="text-gray-500 text-sm max-w-sm">
          Complete some jobs and your analytics will start filling in — revenue, profit margins, crew costs, and more.
        </p>

        {/* Preview of what's coming */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-10 w-full max-w-2xl">
          {[
            { label: 'Total Revenue', icon: DollarSign },
            { label: 'Profit Margin', icon: TrendingUp },
            { label: 'Jobs Completed', icon: Briefcase },
            { label: 'Avg Ticket Size', icon: BarChart2 },
          ].map(({ label, icon: Icon }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 opacity-40 select-none">
              <Icon className="w-5 h-5 text-orange-400 mb-2" />
              <div className="h-6 bg-gray-700 rounded w-16 mb-1" />
              <p className="text-gray-600 text-xs">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
