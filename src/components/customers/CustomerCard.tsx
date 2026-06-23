'use client';

import { Phone, Mail, MapPin, Clock, DollarSign, MoreVertical, Eye, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { formatPhone, formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Customer } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu';

interface CustomerCardProps {
  customer: Customer;
  compact?: boolean;
  onStatusChange?: (id: string, status: string) => void;
  className?: string;
}

export function CustomerCard({ customer, compact = false, onStatusChange, className }: CustomerCardProps) {
  const router = useRouter();

  const initials = customer.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const avatarColors: Record<string, string> = {
    lead:        'bg-gray-100 text-gray-600',
    contacted:   'bg-blue-100 text-blue-700',
    quoted:      'bg-purple-100 text-purple-700',
    follow_up:   'bg-yellow-100 text-yellow-700',
    scheduled:   'bg-indigo-100 text-indigo-700',
    in_progress: 'bg-orange-100 text-orange-700',
    completed:   'bg-green-100 text-green-700',
    cancelled:   'bg-red-100 text-red-700',
  };

  const avatarColor = avatarColors[customer.status] ?? 'bg-gray-100 text-gray-600';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={className}
    >
      <Card
        hoverable
        className="cursor-pointer group"
        onClick={() => router.push(`/customers/${customer.id}`)}
      >
        <div className={cn('p-4', compact ? 'p-3' : 'p-4')}>
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Avatar */}
              <div
                className={cn(
                  'flex-shrink-0 rounded-full flex items-center justify-center font-semibold',
                  compact ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm',
                  avatarColor
                )}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <p className={cn('font-semibold text-gray-900 truncate', compact ? 'text-sm' : 'text-base')}>
                  {customer.name}
                </p>
                {customer.city && (
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    {customer.city}, {customer.state}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              <StatusBadge status={customer.status} size="sm" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 bg-white border border-gray-100 rounded-lg shadow-lg p-1 z-50">
                  <DropdownMenuItem
                    className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 rounded-md hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/customers/${customer.id}`)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 rounded-md hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/quotes/new?customer_id=${customer.id}`)}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Create Quote
                  </DropdownMenuItem>
                  {onStatusChange && (
                    <>
                      <div className="h-px bg-gray-100 my-1" />
                      {['lead', 'contacted', 'quoted', 'follow_up', 'scheduled', 'completed'].map((s) => (
                        <DropdownMenuItem
                          key={s}
                          className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 rounded-md hover:bg-gray-50 cursor-pointer capitalize"
                          onClick={() => onStatusChange(customer.id, s)}
                        >
                          Move to {s.replace('_', ' ')}
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Contact info */}
          {!compact && (
            <div className="space-y-1 mb-3">
              {customer.phone && (
                <a
                  href={`tel:${customer.phone}`}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-orange-600 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Phone className="h-3 w-3 flex-shrink-0" />
                  {formatPhone(customer.phone)}
                </a>
              )}
              {customer.email && (
                <a
                  href={`mailto:${customer.email}`}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-orange-600 transition-colors truncate"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Mail className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{customer.email}</span>
                </a>
              )}
            </div>
          )}

          {/* Footer stats */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-50">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="h-3 w-3" />
              {formatDate(customer.updated_at)}
            </div>
            {customer.total_revenue !== undefined && customer.total_revenue > 0 && (
              <div className="flex items-center gap-1 text-xs font-medium text-gray-700">
                <DollarSign className="h-3 w-3 text-green-500" />
                {formatCurrency(customer.total_revenue)}
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
