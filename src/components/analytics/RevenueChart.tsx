'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface RevenueDataPoint {
  month: string;
  revenue: number;
  profit: number;
}

interface RevenueChartProps {
  data: RevenueDataPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const revenue = payload.find((p: any) => p.dataKey === 'revenue');
    const profit = payload.find((p: any) => p.dataKey === 'profit');
    const margin = revenue && profit ? ((profit.value / revenue.value) * 100).toFixed(1) : 0;

    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
        <p className="text-gray-400 text-xs font-medium mb-2">{label}</p>
        {revenue && (
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-orange-500 inline-block" />
            <span className="text-gray-300 text-xs">Revenue:</span>
            <span className="text-white text-xs font-bold">${revenue.value.toLocaleString()}</span>
          </div>
        )}
        {profit && (
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
            <span className="text-gray-300 text-xs">Profit:</span>
            <span className="text-white text-xs font-bold">${profit.value.toLocaleString()}</span>
          </div>
        )}
        {revenue && profit && (
          <div className="border-t border-gray-700 mt-2 pt-2">
            <span className="text-gray-400 text-xs">Margin: </span>
            <span className="text-emerald-400 text-xs font-bold">{margin}%</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={data}
        margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
        barCategoryGap="25%"
        barGap={2}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: '#9ca3af', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#9ca3af', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Legend
          wrapperStyle={{ paddingTop: '16px' }}
          formatter={(value) => (
            <span style={{ color: '#9ca3af', fontSize: '12px' }}>
              {value === 'revenue' ? 'Revenue' : 'Profit'}
            </span>
          )}
        />
        <Bar dataKey="revenue" fill="#f97316" radius={[3, 3, 0, 0]} maxBarSize={32} />
        <Bar dataKey="profit" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
}
