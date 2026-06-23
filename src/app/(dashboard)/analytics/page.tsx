'use client';

import { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart2,
  Users,
  Package,
  Truck,
  Target,
  ChevronDown,
  Calendar,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { RevenueChart } from '@/components/analytics/RevenueChart';
import { LeadSourceChart } from '@/components/analytics/LeadSourceChart';
import { ProfitabilityTable } from '@/components/analytics/ProfitabilityTable';

// ─── Mock data generators ──────────────────────────────────────────────────────

const MONTHS_12 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function generateMonthlyData(multiplier: number) {
  return MONTHS_12.map((month, i) => {
    const base = 8000 + Math.sin(i * 0.7) * 3000 + i * 400;
    const revenue = Math.round(base * multiplier + Math.random() * 2000);
    const profit = Math.round(revenue * (0.28 + Math.random() * 0.15));
    return { month, revenue, profit };
  });
}

const JOB_STATUS_DATA = [
  { name: 'Completed', value: 142, color: '#10b981' },
  { name: 'Scheduled', value: 38, color: '#3b82f6' },
  { name: 'In Progress', value: 12, color: '#f97316' },
  { name: 'Cancelled', value: 8, color: '#ef4444' },
  { name: 'Pending', value: 21, color: '#f59e0b' },
];

const LEAD_SOURCE_DATA = [
  { source: 'Google Ads', leads: 84, converted: 52, revenue: 68400, conversionRate: 62 },
  { source: 'Referral', leads: 61, converted: 49, revenue: 71200, conversionRate: 80 },
  { source: 'Facebook', leads: 47, converted: 22, revenue: 28900, conversionRate: 47 },
  { source: 'Yelp', leads: 33, converted: 18, revenue: 23400, conversionRate: 55 },
  { source: 'Website', leads: 28, converted: 14, revenue: 19600, conversionRate: 50 },
  { source: 'Walk-in', leads: 12, converted: 9, revenue: 11700, conversionRate: 75 },
];

const PROFITABILITY_DATA = [
  { jobType: 'Full House Cleanout', jobCount: 34, avgRevenue: 1240, avgCost: 680, avgProfit: 560, margin: 45.2, trend: 'up' as const, trendPct: 8 },
  { jobType: 'Garage Cleanout', jobCount: 52, avgRevenue: 480, avgCost: 255, avgProfit: 225, margin: 46.9, trend: 'up' as const, trendPct: 3 },
  { jobType: 'Construction Debris', jobCount: 28, avgRevenue: 890, avgCost: 610, avgProfit: 280, margin: 31.5, trend: 'flat' as const, trendPct: 0 },
  { jobType: 'Appliance Removal', jobCount: 67, avgRevenue: 220, avgCost: 120, avgProfit: 100, margin: 45.5, trend: 'up' as const, trendPct: 5 },
  { jobType: 'Furniture Removal', jobCount: 41, avgRevenue: 350, avgCost: 220, avgProfit: 130, margin: 37.1, trend: 'down' as const, trendPct: 4 },
  { jobType: 'Yard Waste', jobCount: 38, avgRevenue: 280, avgCost: 195, avgProfit: 85, margin: 30.4, trend: 'down' as const, trendPct: 2 },
  { jobType: 'Office Cleanout', jobCount: 14, avgRevenue: 1580, avgCost: 820, avgProfit: 760, margin: 48.1, trend: 'up' as const, trendPct: 12 },
];

const ACCURACY_DATA = [
  { month: 'Jul', estimated: 850, actual: 920 },
  { month: 'Aug', estimated: 780, actual: 810 },
  { month: 'Sep', estimated: 920, actual: 890 },
  { month: 'Oct', estimated: 1100, actual: 1080 },
  { month: 'Nov', estimated: 960, actual: 1020 },
  { month: 'Dec', estimated: 1240, actual: 1190 },
];

const DUMP_TRENDS = [
  { month: 'Jul', fee: 48 },
  { month: 'Aug', fee: 52 },
  { month: 'Sep', fee: 51 },
  { month: 'Oct', fee: 55 },
  { month: 'Nov', fee: 58 },
  { month: 'Dec', fee: 62 },
];

type DateRange = '7d' | '30d' | '90d' | '1yr' | 'custom';

interface KPICardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  suffix?: string;
}

function KPICard({ title, value, change, icon, suffix }: KPICardProps) {
  const isPositive = change >= 0;
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">{title}</span>
        <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center text-orange-400">
          {icon}
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-gray-100 text-2xl font-bold">{value}</span>
        {suffix && <span className="text-gray-500 text-sm mb-0.5">{suffix}</span>}
      </div>
      <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        <span>{isPositive ? '+' : ''}{change}% vs last period</span>
      </div>
    </div>
  );
}

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
        <p className="text-white text-sm font-semibold">{payload[0].name}</p>
        <p className="text-gray-400 text-xs">{payload[0].value} jobs</p>
        <p className="text-orange-400 text-xs font-medium">
          {((payload[0].value / JOB_STATUS_DATA.reduce((s, d) => s + d.value, 0)) * 100).toFixed(1)}%
        </p>
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const multiplierMap: Record<DateRange, number> = { '7d': 0.25, '30d': 1, '90d': 3, '1yr': 12, custom: 1 };
  const monthlyData = useMemo(() => generateMonthlyData(1), [dateRange]);

  const totalRevenue = monthlyData.reduce((s, d) => s + d.revenue, 0);
  const totalProfit = monthlyData.reduce((s, d) => s + d.profit, 0);
  const profitMargin = ((totalProfit / totalRevenue) * 100).toFixed(1);
  const avgTicket = Math.round(totalRevenue / 142);

  const RANGE_BUTTONS: { label: string; value: DateRange }[] = [
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
    { label: '90 Days', value: '90d' },
    { label: '1 Year', value: '1yr' },
    { label: 'Custom', value: 'custom' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-gray-100 text-2xl font-bold">Analytics</h1>
          <p className="text-gray-500 text-sm mt-0.5">Business performance insights</p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-gray-900 border border-gray-800 rounded-xl p-1 gap-1">
            {RANGE_BUTTONS.map((btn) => (
              <button
                key={btn.value}
                onClick={() => {
                  setDateRange(btn.value);
                  setShowCustom(btn.value === 'custom');
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  dateRange === btn.value
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
          {showCustom && (
            <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl px-3 py-1.5">
              <Calendar className="w-4 h-4 text-gray-500" />
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-transparent text-gray-300 text-sm focus:outline-none"
              />
              <span className="text-gray-600">-</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-transparent text-gray-300 text-sm focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* ROW 1 — KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Revenue"
          value={`$${(totalRevenue / 1000).toFixed(0)}k`}
          change={12.4}
          icon={<DollarSign className="w-4 h-4" />}
        />
        <KPICard
          title="Total Profit"
          value={`$${(totalProfit / 1000).toFixed(0)}k`}
          change={8.7}
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <KPICard
          title="Profit Margin"
          value={profitMargin}
          suffix="%"
          change={-1.2}
          icon={<Target className="w-4 h-4" />}
        />
        <KPICard
          title="Avg Ticket Size"
          value={`$${avgTicket}`}
          change={5.3}
          icon={<BarChart2 className="w-4 h-4" />}
        />
      </div>

      {/* ROW 2 — Revenue Chart + Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-gray-100 font-semibold">Monthly Revenue & Profit</h2>
              <p className="text-gray-500 text-xs mt-0.5">12-month overview</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-orange-500 inline-block" />
                <span className="text-gray-500 text-xs">Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
                <span className="text-gray-500 text-xs">Profit</span>
              </div>
            </div>
          </div>
          <RevenueChart data={monthlyData} />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-gray-100 font-semibold mb-1">Job Status</h2>
          <p className="text-gray-500 text-xs mb-4">
            {JOB_STATUS_DATA.reduce((s, d) => s + d.value, 0)} total jobs
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={JOB_STATUS_DATA}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {JOB_STATUS_DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {JOB_STATUS_DATA.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-400 text-xs">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-200 text-xs font-medium">{item.value}</span>
                  <span className="text-gray-600 text-xs">
                    ({((item.value / JOB_STATUS_DATA.reduce((s, d) => s + d.value, 0)) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 3 — Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Lead Source Chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-gray-100 font-semibold mb-1">Revenue by Lead Source</h2>
          <p className="text-gray-500 text-xs mb-4">Leads, conversions & attribution</p>
          <LeadSourceChart data={LEAD_SOURCE_DATA} />
        </div>

        {/* Profitability Table */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-gray-100 font-semibold mb-1">Job Type Profitability</h2>
          <p className="text-gray-500 text-xs mb-4">Sorted by profit margin</p>
          <ProfitabilityTable data={PROFITABILITY_DATA} />
        </div>
      </div>

      {/* Estimate Accuracy Chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-gray-100 font-semibold mb-1">Estimate Accuracy</h2>
        <p className="text-gray-500 text-xs mb-4">Estimated vs actual job revenue (last 6 months)</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={ACCURACY_DATA} margin={{ top: 5, right: 16, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v}`}
              width={52}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#9ca3af', fontSize: '12px' }}
              itemStyle={{ fontSize: '12px' }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '12px' }}
              formatter={(value) => (
                <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                  {value === 'estimated' ? 'Estimated' : 'Actual'}
                </span>
              )}
            />
            <Line type="monotone" dataKey="estimated" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 4 }} strokeDasharray="5 5" />
            <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ROW 4 — Operations Grid */}
      <div>
        <h2 className="text-gray-100 font-semibold mb-4">Operations Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {[
            { label: 'Avg Labor Hours / Job', value: '3.2 hrs', sub: 'Per completed job', icon: <Users className="w-4 h-4" />, change: -0.3 },
            { label: 'Avg Cu Yards / Job', value: '4.8 yd', sub: 'Volume removed', icon: <Package className="w-4 h-4" />, change: 0.5 },
            { label: 'Avg Dump Fee / Job', value: '$56', sub: 'Tipping costs', icon: <Truck className="w-4 h-4" />, change: 8 },
            { label: 'Jobs / Crew Member', value: '18.2', sub: 'Per month avg', icon: <BarChart2 className="w-4 h-4" />, change: 2.1 },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-xs">{stat.label}</span>
                <div className="text-orange-400">{stat.icon}</div>
              </div>
              <div className="text-gray-100 text-xl font-bold">{stat.value}</div>
              <div className="text-gray-600 text-xs mt-0.5">{stat.sub}</div>
              <div className={`flex items-center gap-1 mt-2 text-xs ${stat.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {stat.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{stat.change >= 0 ? '+' : ''}{stat.change} vs last period</span>
              </div>
            </div>
          ))}
        </div>

        {/* Dump fee trend */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-gray-200 font-medium mb-1">Dump Fee Trends</h3>
          <p className="text-gray-500 text-xs mb-4">Average dump/tipping fee per job over time</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={DUMP_TRENDS} margin={{ top: 5, right: 16, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v}`}
                width={44}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#9ca3af', fontSize: '12px' }}
                formatter={(v: any) => [`$${v}`, 'Avg Dump Fee']}
              />
              <Line
                type="monotone"
                dataKey="fee"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ fill: '#f59e0b', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Marketing Section */}
      <div>
        <h2 className="text-gray-100 font-semibold mb-4">Marketing Attribution</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Lead source breakdown */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-gray-200 font-medium mb-4">Lead Source Breakdown</h3>
            <div className="space-y-3">
              {LEAD_SOURCE_DATA.sort((a, b) => b.revenue - a.revenue).map((source, i) => {
                const maxRevenue = Math.max(...LEAD_SOURCE_DATA.map((s) => s.revenue));
                const pct = (source.revenue / maxRevenue) * 100;
                return (
                  <div key={source.source} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm">{source.source}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500 text-xs">{source.leads} leads</span>
                        <span className="text-emerald-400 text-xs font-medium">{source.conversionRate}% conv.</span>
                        <span className="text-gray-200 text-sm font-semibold">${source.revenue.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-gray-800 rounded-full">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-orange-600 to-orange-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Revenue attribution summary */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-gray-200 font-medium mb-4">Revenue Attribution</h3>
            <div className="space-y-3">
              {LEAD_SOURCE_DATA.map((source) => {
                const totalRev = LEAD_SOURCE_DATA.reduce((s, d) => s + d.revenue, 0);
                const pct = ((source.revenue / totalRev) * 100).toFixed(1);
                const roi = ((source.revenue / (source.leads * 8)) * 100).toFixed(0);
                return (
                  <div key={source.source} className="flex items-center justify-between bg-gray-800/50 rounded-lg px-3 py-2.5">
                    <div>
                      <p className="text-gray-200 text-sm font-medium">{source.source}</p>
                      <p className="text-gray-500 text-xs">{source.converted} converted jobs</p>
                    </div>
                    <div className="text-right">
                      <p className="text-orange-400 font-bold text-sm">{pct}%</p>
                      <p className="text-gray-500 text-xs">of revenue</p>
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center justify-between bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2.5">
                <span className="text-orange-300 font-semibold text-sm">Total Attribution</span>
                <span className="text-orange-400 font-bold">
                  ${LEAD_SOURCE_DATA.reduce((s, d) => s + d.revenue, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
