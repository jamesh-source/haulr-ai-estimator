'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, Clock, AlertTriangle,
  Search, Filter, Eye, Send, CreditCard,
  CheckCircle2, XCircle, FileText, MoreHorizontal,
  ChevronDown, Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'paid'
  | 'overdue'
  | 'payment_failed'
  | 'cancelled';

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  job_address: string;
  total_amount: number;
  paid_amount: number;
  status: InvoiceStatus;
  issued_date: string;
  due_date: string | null;
  paid_at: string | null;
}

// ---------------------------------------------------------------------------
// Mock data (replace with Supabase fetch)
// ---------------------------------------------------------------------------

const MOCK_INVOICES: Invoice[] = [
  {
    id: '1',
    invoice_number: 'INV-20260601-001',
    customer_name: 'Michael Torres',
    customer_email: 'mtorres@email.com',
    job_address: '1234 Oak St, Phoenix, AZ',
    total_amount: 549,
    paid_amount: 549,
    status: 'paid',
    issued_date: '2026-06-01',
    due_date: '2026-06-15',
    paid_at: '2026-06-10',
  },
  {
    id: '2',
    invoice_number: 'INV-20260605-002',
    customer_name: 'Sarah Johnson',
    customer_email: 'sjohnson@gmail.com',
    job_address: '5678 Maple Ave, Scottsdale, AZ',
    total_amount: 879,
    paid_amount: 0,
    status: 'sent',
    issued_date: '2026-06-05',
    due_date: '2026-06-19',
    paid_at: null,
  },
  {
    id: '3',
    invoice_number: 'INV-20260508-003',
    customer_name: 'David Chen',
    customer_email: 'dchen@work.com',
    job_address: '9012 Pine Rd, Tempe, AZ',
    total_amount: 1250,
    paid_amount: 0,
    status: 'overdue',
    issued_date: '2026-05-08',
    due_date: '2026-05-22',
    paid_at: null,
  },
  {
    id: '4',
    invoice_number: 'INV-20260615-004',
    customer_name: 'Emily Rodriguez',
    customer_email: 'emily.r@email.com',
    job_address: '3456 Elm Dr, Mesa, AZ',
    total_amount: 425,
    paid_amount: 0,
    status: 'draft',
    issued_date: '2026-06-15',
    due_date: null,
    paid_at: null,
  },
  {
    id: '5',
    invoice_number: 'INV-20260612-005',
    customer_name: 'James Wilson',
    customer_email: 'jwilson@mail.com',
    job_address: '7890 Cedar Ln, Chandler, AZ',
    total_amount: 695,
    paid_amount: 695,
    status: 'paid',
    issued_date: '2026-06-12',
    due_date: '2026-06-26',
    paid_at: '2026-06-20',
  },
  {
    id: '6',
    invoice_number: 'INV-20260618-006',
    customer_name: 'Lisa Park',
    customer_email: 'lpark@example.com',
    job_address: '2345 Birch Ct, Gilbert, AZ',
    total_amount: 320,
    paid_amount: 0,
    status: 'payment_failed',
    issued_date: '2026-06-18',
    due_date: '2026-07-02',
    paid_at: null,
  },
];

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  draft: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-600',
    icon: <FileText className="w-3 h-3" />,
  },
  sent: {
    label: 'Sent',
    className: 'bg-blue-100 text-blue-700',
    icon: <Send className="w-3 h-3" />,
  },
  paid: {
    label: 'Paid',
    className: 'bg-green-100 text-green-700',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  overdue: {
    label: 'Overdue',
    className: 'bg-red-100 text-red-700',
    icon: <AlertTriangle className="w-3 h-3" />,
  },
  payment_failed: {
    label: 'Failed',
    className: 'bg-orange-100 text-orange-700',
    icon: <XCircle className="w-3 h-3" />,
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-gray-100 text-gray-500',
    icon: <XCircle className="w-3 h-3" />,
  },
};

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  title,
  value,
  icon,
  iconBg,
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  subtitle?: string;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          <div className={cn('p-2.5 rounded-xl', iconBg)}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Invoices page
// ---------------------------------------------------------------------------

export default function InvoicesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [invoices] = useState<Invoice[]>(MOCK_INVOICES);

  // Stats
  const stats = useMemo(() => {
    const totalInvoiced = invoices.reduce((s, i) => s + i.total_amount, 0);
    const collected = invoices
      .filter((i) => i.status === 'paid')
      .reduce((s, i) => s + i.paid_amount, 0);
    const outstanding = invoices
      .filter((i) => ['sent', 'payment_failed'].includes(i.status))
      .reduce((s, i) => s + i.total_amount, 0);
    const overdue = invoices
      .filter((i) => i.status === 'overdue')
      .reduce((s, i) => s + i.total_amount, 0);
    return { totalInvoiced, collected, outstanding, overdue };
  }, [invoices]);

  // Filtered invoices
  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesStatus =
        statusFilter === 'all' || inv.status === statusFilter;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        inv.invoice_number.toLowerCase().includes(q) ||
        inv.customer_name.toLowerCase().includes(q) ||
        inv.customer_email.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [invoices, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* Page header                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage and track all customer invoices
          </p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
          <Plus className="w-4 h-4" />
          New Invoice
        </Button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Stats                                                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Invoiced"
          value={formatCurrency(stats.totalInvoiced)}
          icon={<DollarSign className="w-5 h-5 text-gray-600" />}
          iconBg="bg-gray-100"
          subtitle={`${invoices.length} invoices`}
        />
        <StatCard
          title="Collected"
          value={formatCurrency(stats.collected)}
          icon={<TrendingUp className="w-5 h-5 text-green-600" />}
          iconBg="bg-green-50"
          subtitle={`${invoices.filter((i) => i.status === 'paid').length} paid`}
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(stats.outstanding)}
          icon={<Clock className="w-5 h-5 text-blue-600" />}
          iconBg="bg-blue-50"
          subtitle="Awaiting payment"
        />
        <StatCard
          title="Overdue"
          value={formatCurrency(stats.overdue)}
          icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
          iconBg="bg-red-50"
          subtitle={`${invoices.filter((i) => i.status === 'overdue').length} past due`}
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Filters                                                             */}
      {/* ------------------------------------------------------------------ */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search invoices, customers…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-colors"
              />
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-2 flex-wrap">
              {(['all', 'draft', 'sent', 'paid', 'overdue', 'payment_failed'] as const).map(
                (s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize',
                      statusFilter === s
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label ?? s}
                  </button>
                )
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* Invoices table                                                       */}
      {/* ------------------------------------------------------------------ */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Invoice #
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Job Address
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Paid
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Due Date
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-sm text-gray-400"
                  >
                    No invoices found.
                  </td>
                </tr>
              )}
              {filtered.map((invoice, idx) => {
                const statusCfg = STATUS_CONFIG[invoice.status];
                return (
                  <motion.tr
                    key={invoice.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="hover:bg-orange-50/30 transition-colors"
                  >
                    {/* Invoice number */}
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="font-mono text-xs font-medium text-orange-600 hover:text-orange-700"
                      >
                        {invoice.invoice_number}
                      </Link>
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-gray-900">
                        {invoice.customer_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {invoice.customer_email}
                      </p>
                    </td>

                    {/* Job address */}
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <p className="text-gray-600 text-xs">{invoice.job_address}</p>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3.5 text-right">
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(invoice.total_amount)}
                      </span>
                    </td>

                    {/* Paid */}
                    <td className="px-4 py-3.5 text-right hidden md:table-cell">
                      <span
                        className={cn(
                          'text-sm font-medium',
                          invoice.paid_amount > 0
                            ? 'text-green-600'
                            : 'text-gray-400'
                        )}
                      >
                        {formatCurrency(invoice.paid_amount)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
                          statusCfg.className
                        )}
                      >
                        {statusCfg.icon}
                        {statusCfg.label}
                      </span>
                    </td>

                    {/* Due date */}
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span
                        className={cn(
                          'text-sm',
                          invoice.status === 'overdue'
                            ? 'text-red-600 font-medium'
                            : 'text-gray-500'
                        )}
                      >
                        {formatDate(invoice.due_date)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/invoices/${invoice.id}`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-700"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </Link>

                        {invoice.status === 'draft' || invoice.status === 'sent' ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600"
                            title="Send reminder"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </Button>
                        ) : null}

                        {['sent', 'overdue', 'payment_failed'].includes(
                          invoice.status
                        ) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-green-600"
                            title="Record payment"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-400">
            Showing {filtered.length} of {invoices.length} invoices
          </p>
        </div>
      </Card>
    </div>
  );
}
