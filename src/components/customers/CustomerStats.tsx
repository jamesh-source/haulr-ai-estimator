'use client';

import { DollarSign, Briefcase, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';

interface CustomerStatsProps {
  totalJobs: number;
  totalRevenue: number;
  avgTicket: number;
  lastServiceDate: string | null;
}

export function CustomerStats({
  totalJobs,
  totalRevenue,
  avgTicket,
  lastServiceDate,
}: CustomerStatsProps) {
  const stats = [
    {
      label: 'Total Jobs',
      value: totalJobs.toString(),
      icon: Briefcase,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      sub: totalJobs === 1 ? '1 completed job' : `${totalJobs} completed jobs`,
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-50',
      sub: 'lifetime spend',
    },
    {
      label: 'Avg Ticket',
      value: avgTicket > 0 ? formatCurrency(avgTicket) : '—',
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      sub: 'per job average',
    },
    {
      label: 'Last Service',
      value: lastServiceDate ? formatDate(lastServiceDate) : 'Never',
      icon: Calendar,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      sub: lastServiceDate ? 'most recent job' : 'no jobs yet',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${stat.bg} flex-shrink-0`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                  <p className="text-lg font-bold text-gray-900 truncate">{stat.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
