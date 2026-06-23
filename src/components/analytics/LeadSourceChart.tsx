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

interface LeadSourceDataPoint {
  source: string;
  leads: number;
  converted: number;
  revenue: number;
  conversionRate: number;
}

interface LeadSourceChartProps {
  data: LeadSourceDataPoint[];
}

const COLORS = ['#f97316', '#3b82f6', '#8b5cf6', '#10b981', '#ec4899', '#f59e0b'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0]?.payload as LeadSourceDataPoint;
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
        <p className="text-white text-sm font-semibold mb-2">{d.source}</p>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-gray-400 text-xs">Leads</span>
            <span className="text-white text-xs font-medium">{d.leads}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400 text-xs">Converted</span>
            <span className="text-emerald-400 text-xs font-medium">{d.converted}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400 text-xs">Conv. Rate</span>
            <span className="text-orange-400 text-xs font-medium">{d.conversionRate}%</span>
          </div>
          <div className="flex justify-between gap-4 border-t border-gray-700 pt-1 mt-1">
            <span className="text-gray-400 text-xs">Revenue</span>
            <span className="text-white text-xs font-bold">${d.revenue.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function LeadSourceChart({ data }: LeadSourceChartProps) {
  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
          barCategoryGap="30%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            dataKey="source"
            type="category"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={90}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="leads" radius={[0, 3, 3, 0]} maxBarSize={20}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Conversion rate indicators */}
      <div className="grid grid-cols-2 gap-2">
        {data.map((item, index) => (
          <div key={item.source} className="flex items-center justify-between bg-gray-800/50 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-gray-300 text-xs truncate">{item.source}</span>
            </div>
            <div className="flex items-center gap-2 ml-2 flex-shrink-0">
              <div className="w-12 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${item.conversionRate}%` }}
                />
              </div>
              <span className="text-emerald-400 text-xs font-medium w-8 text-right">
                {item.conversionRate}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
