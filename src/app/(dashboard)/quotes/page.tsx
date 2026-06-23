'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Plus, Search, Filter, FileText, Send, CheckCircle,
  Clock, DollarSign, MoreHorizontal, Eye, Pencil,
  Trash2, Copy, ArrowUpRight, ChevronDown, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

// =============================================================================
// MOCK DATA
// =============================================================================

type QuoteStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';

interface Quote {
  id: string;
  quoteNumber: string;
  customerName: string;
  customerEmail: string;
  serviceAddress: string;
  amount: number;
  status: QuoteStatus;
  createdAt: Date;
  sentAt?: Date;
  expiresAt?: Date;
  loadSize: string;
}

const MOCK_QUOTES: Quote[] = [
  {
    id: '1',
    quoteNumber: 'HLR-20260615-4821',
    customerName: 'Michael Torres',
    customerEmail: 'mtorres@email.com',
    serviceAddress: '1234 Oak St, Phoenix, AZ 85001',
    amount: 549,
    status: 'approved',
    createdAt: new Date('2026-06-15'),
    sentAt: new Date('2026-06-15'),
    loadSize: '1/2 Load',
  },
  {
    id: '2',
    quoteNumber: 'HLR-20260617-2934',
    customerName: 'Sarah Johnson',
    customerEmail: 'sjohnson@gmail.com',
    serviceAddress: '5678 Maple Ave, Scottsdale, AZ 85251',
    amount: 879,
    status: 'sent',
    createdAt: new Date('2026-06-17'),
    sentAt: new Date('2026-06-17'),
    expiresAt: new Date('2026-06-24'),
    loadSize: 'Full Load',
  },
  {
    id: '3',
    quoteNumber: 'HLR-20260618-7751',
    customerName: 'Robert Chen',
    customerEmail: 'rchen@business.com',
    serviceAddress: '9012 Pine Rd, Tempe, AZ 85281',
    amount: 325,
    status: 'draft',
    createdAt: new Date('2026-06-18'),
    loadSize: '1/4 Load',
  },
  {
    id: '4',
    quoteNumber: 'HLR-20260619-3318',
    customerName: 'Amanda Williams',
    customerEmail: 'awilliams@email.com',
    serviceAddress: '3456 Elm Dr, Mesa, AZ 85201',
    amount: 699,
    status: 'draft',
    createdAt: new Date('2026-06-19'),
    loadSize: '3/4 Load',
  },
  {
    id: '5',
    quoteNumber: 'HLR-20260620-5582',
    customerName: 'David Martinez',
    customerEmail: 'dmartinez@email.com',
    serviceAddress: '7890 Cedar Ln, Chandler, AZ 85224',
    amount: 1249,
    status: 'approved',
    createdAt: new Date('2026-06-20'),
    sentAt: new Date('2026-06-20'),
    loadSize: 'Full Load',
  },
  {
    id: '6',
    quoteNumber: 'HLR-20260621-9943',
    customerName: 'Lisa Thompson',
    customerEmail: 'lthompson@email.com',
    serviceAddress: '2345 Birch Blvd, Gilbert, AZ 85234',
    amount: 449,
    status: 'rejected',
    createdAt: new Date('2026-06-21'),
    sentAt: new Date('2026-06-21'),
    loadSize: '3/8 Load',
  },
  {
    id: '7',
    quoteNumber: 'HLR-20260622-1127',
    customerName: 'James Wilson',
    customerEmail: 'jwilson@email.com',
    serviceAddress: '6789 Walnut Way, Peoria, AZ 85345',
    amount: 795,
    status: 'sent',
    createdAt: new Date('2026-06-22'),
    sentAt: new Date('2026-06-22'),
    expiresAt: new Date('2026-06-29'),
    loadSize: 'Full Load',
  },
];

// =============================================================================
// STATS BAR
// =============================================================================

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  sub?: string;
}

function StatCard({ label, value, icon: Icon, color, bgColor, sub }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          </div>
          <div className={cn('p-2.5 rounded-xl', bgColor)}>
            <Icon className={cn('h-5 w-5', color)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// STATUS FILTER TABS
// =============================================================================

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'sent', label: 'Sent' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'expired', label: 'Expired' },
] as const;

// =============================================================================
// ACTIONS DROPDOWN
// =============================================================================

function ActionsMenu({ quoteId }: { quoteId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-40 overflow-hidden">
            <Link
              href={`/quotes/${quoteId}`}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setOpen(false)}
            >
              <Eye className="h-3.5 w-3.5 text-gray-400" />
              View
            </Link>
            <Link
              href={`/quotes/${quoteId}`}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setOpen(false)}
            >
              <Pencil className="h-3.5 w-3.5 text-gray-400" />
              Edit
            </Link>
            <button
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setOpen(false)}
            >
              <Copy className="h-3.5 w-3.5 text-gray-400" />
              Duplicate
            </button>
            <button
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setOpen(false)}
            >
              <Send className="h-3.5 w-3.5 text-gray-400" />
              Send
            </button>
            <div className="border-t border-gray-100 my-1" />
            <button
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              onClick={() => setOpen(false)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// =============================================================================
// EMPTY STATE
// =============================================================================

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-4">
        <FileText className="h-8 w-8 text-orange-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        {filtered ? 'No quotes match your filters' : 'No quotes yet'}
      </h3>
      <p className="text-sm text-gray-500 max-w-xs mb-6">
        {filtered
          ? 'Try adjusting your search or filter criteria to find what you\'re looking for.'
          : 'Create your first professional quote and start winning more jobs.'}
      </p>
      {!filtered && (
        <Link href="/quotes/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>Create First Quote</Button>
        </Link>
      )}
    </div>
  );
}

// =============================================================================
// PAGE
// =============================================================================

export default function QuotesPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Derived stats
  const stats = useMemo(() => {
    const total = MOCK_QUOTES.length;
    const drafts = MOCK_QUOTES.filter((q) => q.status === 'draft').length;
    const sent = MOCK_QUOTES.filter((q) => q.status === 'sent').length;
    const approved = MOCK_QUOTES.filter((q) => q.status === 'approved').length;

    // This month revenue (approved quotes)
    const now = new Date();
    const thisMonthRevenue = MOCK_QUOTES.filter((q) => {
      const d = q.createdAt;
      return (
        q.status === 'approved' &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }).reduce((sum, q) => sum + q.amount, 0);

    return { total, drafts, sent, approved, thisMonthRevenue };
  }, []);

  // Filtered quotes
  const filteredQuotes = useMemo(() => {
    return MOCK_QUOTES.filter((q) => {
      const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
      const matchesSearch =
        !searchQuery ||
        q.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.serviceAddress.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [statusFilter, searchQuery]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: MOCK_QUOTES.length };
    for (const q of MOCK_QUOTES) {
      counts[q.status] = (counts[q.status] ?? 0) + 1;
    }
    return counts;
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotes</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage and track all your customer quotes
          </p>
        </div>
        <Link href="/quotes/new">
          <Button leftIcon={<Plus className="h-4 w-4" />} size="lg">
            New Quote
          </Button>
        </Link>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard
          label="Total Quotes"
          value={stats.total}
          icon={FileText}
          color="text-gray-600"
          bgColor="bg-gray-100"
        />
        <StatCard
          label="Draft"
          value={stats.drafts}
          icon={Clock}
          color="text-gray-500"
          bgColor="bg-gray-100"
          sub="Pending send"
        />
        <StatCard
          label="Sent"
          value={stats.sent}
          icon={Send}
          color="text-blue-600"
          bgColor="bg-blue-100"
          sub="Awaiting response"
        />
        <StatCard
          label="Approved"
          value={stats.approved}
          icon={CheckCircle}
          color="text-green-600"
          bgColor="bg-green-100"
          sub="Ready to schedule"
        />
        <StatCard
          label="This Month Revenue"
          value={formatCurrency(stats.thisMonthRevenue)}
          icon={DollarSign}
          color="text-orange-600"
          bgColor="bg-orange-100"
          sub="From approved quotes"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search quotes, customers, addresses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Date filter */}
            <div className="relative">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-600"
              />
            </div>

            {/* Filter button */}
            <Button variant="outline" size="md" leftIcon={<Filter className="h-4 w-4" />}>
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
              statusFilter === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.label}
            {statusCounts[tab.id] !== undefined && (
              <span
                className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full font-medium',
                  statusFilter === tab.id ? 'bg-orange-100 text-orange-700' : 'bg-gray-200 text-gray-500'
                )}
              >
                {statusCounts[tab.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <Card>
        {filteredQuotes.length === 0 ? (
          <EmptyState filtered={statusFilter !== 'all' || !!searchQuery} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Quote #
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Load / Address
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredQuotes.map((quote, i) => (
                  <motion.tr
                    key={quote.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="hover:bg-gray-50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/quotes/${quote.id}`}
                        className="font-mono text-sm font-semibold text-orange-600 hover:text-orange-700 hover:underline"
                      >
                        {quote.quoteNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-sm text-gray-900">
                        {quote.customerName}
                      </div>
                      <div className="text-xs text-gray-500">{quote.customerEmail}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-700">{quote.loadSize}</div>
                      <div className="text-xs text-gray-400 truncate max-w-[200px]">
                        {quote.serviceAddress}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-gray-900">
                        {formatCurrency(quote.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={quote.status} dot>
                        {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {formatDate(quote.createdAt)}
                      </div>
                      {quote.expiresAt && (
                        <div className="text-xs text-yellow-600">
                          Exp {formatDate(quote.expiresAt)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/quotes/${quote.id}`}>
                          <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                            <ArrowUpRight className="h-4 w-4" />
                          </button>
                        </Link>
                        <ActionsMenu quoteId={quote.id} />
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
