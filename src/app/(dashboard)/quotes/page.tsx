'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Plus, Search, FileText, Send, CheckCircle,
  Clock, DollarSign, MoreHorizontal, Eye, Pencil,
  Trash2, Copy, ArrowUpRight, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

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
// STAT CARD
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
// ACTIONS DROPDOWN
// =============================================================================

interface ActionsMenuProps {
  quoteId: string;
  onDelete: (id: string) => void;
  onSend: (id: string) => void;
}

function ActionsMenu({ quoteId, onDelete, onSend }: ActionsMenuProps) {
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
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
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
              onClick={() => { setOpen(false); onSend(quoteId); }}
            >
              <Send className="h-3.5 w-3.5 text-gray-400" />
              Send
            </button>
            <div className="border-t border-gray-100 my-1" />
            <button
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              onClick={() => { setOpen(false); onDelete(quoteId); }}
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
          ? "Try adjusting your search or filter criteria to find what you're looking for."
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
// LOADING SKELETON
// =============================================================================

function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-50">
          <div className="h-4 bg-gray-200 rounded w-36" />
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-4 bg-gray-200 rounded flex-1" />
          <div className="h-4 bg-gray-200 rounded w-20" />
          <div className="h-5 bg-gray-200 rounded-full w-16" />
          <div className="h-4 bg-gray-200 rounded w-24" />
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// PAGE
// =============================================================================

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/quotes')
      .then((r) => r.json())
      .then(({ data }) => { setQuotes(data ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/quotes/${id}`, { method: 'DELETE' });
      setQuotes((prev) => prev.filter((q) => q.id !== id));
    } catch {
      // silent fail — could add toast here
    }
  };

  const handleSend = async (id: string) => {
    try {
      await fetch(`/api/quotes/${id}/send`, { method: 'POST' });
      setQuotes((prev) => prev.map((q) => q.id === id ? { ...q, status: 'sent' } : q));
    } catch {
      // silent fail
    }
  };

  // Derived stats
  const stats = useMemo(() => {
    const total = quotes.length;
    const drafts = quotes.filter((q) => q.status === 'draft').length;
    const sent = quotes.filter((q) => q.status === 'sent').length;
    const approved = quotes.filter((q) => q.status === 'approved').length;

    const now = new Date();
    const thisMonthRevenue = quotes
      .filter((q) => {
        const d = new Date(q.created_at);
        return (
          q.status === 'approved' &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, q) => sum + (q.total ?? 0), 0);

    return { total, drafts, sent, approved, thisMonthRevenue };
  }, [quotes]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: quotes.length };
    for (const q of quotes) {
      counts[q.status] = (counts[q.status] ?? 0) + 1;
    }
    return counts;
  }, [quotes]);

  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
      const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
      const customerName =
        ((q.customers?.first_name ?? '') + ' ' + (q.customers?.last_name ?? '')).trim();
      const matchesSearch =
        !searchQuery ||
        customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q.quote_number ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q.customers?.email ?? '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [quotes, statusFilter, searchQuery]);

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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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

      {/* Search */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search quotes, customers..."
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
          </div>
        </CardContent>
      </Card>

      {/* Status Tabs */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-max sm:w-fit min-w-full sm:min-w-0">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={cn(
                'flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0',
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
                    statusFilter === tab.id
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-gray-200 text-gray-500'
                  )}
                >
                  {statusCounts[tab.id]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <Card>
        {loading ? (
          <LoadingSkeleton />
        ) : filteredQuotes.length === 0 ? (
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
                {filteredQuotes.map((quote, i) => {
                  const customerName =
                    ((quote.customers?.first_name ?? '') +
                      ' ' +
                      (quote.customers?.last_name ?? '')).trim() ||
                    'Unknown Customer';
                  return (
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
                          {quote.quote_number ?? quote.id}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-sm text-gray-900">{customerName}</div>
                        {quote.customers?.email && (
                          <div className="text-xs text-gray-500">{quote.customers.email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(quote.total ?? 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={quote.status} dot>
                          {quote.status
                            ? quote.status.charAt(0).toUpperCase() + quote.status.slice(1)
                            : 'Unknown'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {quote.created_at ? formatDate(new Date(quote.created_at)) : '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/quotes/${quote.id}`}>
                            <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                              <ArrowUpRight className="h-4 w-4" />
                            </button>
                          </Link>
                          <ActionsMenu
                            quoteId={quote.id}
                            onDelete={handleDelete}
                            onSend={handleSend}
                          />
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
