'use client';

import React from 'react';
import { CheckCircle2, Clock, AlertCircle, XCircle, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface InvoiceData {
  id: string;
  invoice_number: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'payment_failed' | 'cancelled';
  issued_date: string;
  due_date: string | null;
  paid_at: string | null;
  subtotal: number;
  tax_rate?: number;
  tax_amount?: number;
  total_amount: number;
  notes?: string | null;
  line_items: InvoiceLineItem[];
  customer: {
    name: string;
    email: string;
    phone?: string | null;
    address?: string | null;
  };
  company?: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
}

interface InvoiceViewProps {
  invoice: InvoiceData;
  className?: string;
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; className: string }
> = {
  draft: {
    label: 'Draft',
    icon: <FileText className="w-3.5 h-3.5" />,
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  sent: {
    label: 'Sent',
    icon: <Clock className="w-3.5 h-3.5" />,
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  paid: {
    label: 'Paid',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    className: 'bg-green-50 text-green-700 border-green-200',
  },
  overdue: {
    label: 'Overdue',
    icon: <AlertCircle className="w-3.5 h-3.5" />,
    className: 'bg-red-50 text-red-700 border-red-200',
  },
  payment_failed: {
    label: 'Payment Failed',
    icon: <XCircle className="w-3.5 h-3.5" />,
    className: 'bg-red-50 text-red-700 border-red-200',
  },
  cancelled: {
    label: 'Cancelled',
    icon: <XCircle className="w-3.5 h-3.5" />,
    className: 'bg-gray-100 text-gray-500 border-gray-200',
  },
};

// ---------------------------------------------------------------------------
// InvoiceView
// ---------------------------------------------------------------------------

export function InvoiceView({ invoice, className }: InvoiceViewProps) {
  const statusConfig = STATUS_CONFIG[invoice.status] ?? STATUS_CONFIG.draft;
  const taxRate = invoice.tax_rate ?? 0;
  const taxAmount = invoice.tax_amount ?? 0;

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden',
        className
      )}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">INVOICE</h1>
            <p className="text-orange-100 text-sm mt-1 font-mono">
              #{invoice.invoice_number}
            </p>
          </div>
          <div className="text-right">
            <div
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border',
                statusConfig.className
              )}
            >
              {statusConfig.icon}
              {statusConfig.label}
            </div>
          </div>
        </div>

        {/* Company info */}
        {invoice.company && (
          <div className="mt-6">
            <p className="font-bold text-lg">{invoice.company.name}</p>
            {invoice.company.address && (
              <p className="text-orange-100 text-sm">{invoice.company.address}</p>
            )}
            {invoice.company.phone && (
              <p className="text-orange-100 text-sm">{invoice.company.phone}</p>
            )}
            {invoice.company.email && (
              <p className="text-orange-100 text-sm">{invoice.company.email}</p>
            )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Bill To + Dates                                                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="px-8 py-6 grid grid-cols-2 gap-8 border-b border-gray-100">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Bill To
          </p>
          <p className="font-semibold text-gray-900">{invoice.customer.name}</p>
          <p className="text-sm text-gray-600">{invoice.customer.email}</p>
          {invoice.customer.phone && (
            <p className="text-sm text-gray-600">{invoice.customer.phone}</p>
          )}
          {invoice.customer.address && (
            <p className="text-sm text-gray-600 mt-1">{invoice.customer.address}</p>
          )}
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Issue Date</span>
            <span className="font-medium text-gray-900">
              {formatDate(invoice.issued_date)}
            </span>
          </div>
          {invoice.due_date && (
            <div className="flex justify-between">
              <span className="text-gray-500">Due Date</span>
              <span
                className={cn(
                  'font-medium',
                  invoice.status === 'overdue'
                    ? 'text-red-600'
                    : 'text-gray-900'
                )}
              >
                {formatDate(invoice.due_date)}
              </span>
            </div>
          )}
          {invoice.paid_at && (
            <div className="flex justify-between">
              <span className="text-gray-500">Paid On</span>
              <span className="font-medium text-green-600">
                {formatDate(invoice.paid_at)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Line items                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="px-8 py-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Description
              </th>
              <th className="text-right py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider w-20">
                Qty
              </th>
              <th className="text-right py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider w-28">
                Unit Price
              </th>
              <th className="text-right py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider w-28">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {invoice.line_items.map((item) => (
              <tr key={item.id}>
                <td className="py-3 text-gray-800">{item.description}</td>
                <td className="py-3 text-right text-gray-600">{item.quantity}</td>
                <td className="py-3 text-right text-gray-600">
                  {formatCurrency(item.unit_price)}
                </td>
                <td className="py-3 text-right font-medium text-gray-900">
                  {formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-6 ml-auto max-w-xs space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{formatCurrency(invoice.subtotal)}</span>
          </div>
          {taxRate > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Tax ({(taxRate * 100).toFixed(1)}%)</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between pt-3 border-t border-gray-200 text-base font-bold text-gray-900">
            <span>Total</span>
            <span>{formatCurrency(invoice.total_amount)}</span>
          </div>
          {invoice.status === 'paid' && (
            <div className="flex justify-between text-green-600 font-semibold">
              <span>Amount Paid</span>
              <span>{formatCurrency(invoice.total_amount)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Notes                                                               */}
      {/* ------------------------------------------------------------------ */}
      {invoice.notes && (
        <div className="px-8 pb-6">
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Notes
            </p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-8 py-4 bg-gray-50 border-t border-gray-100">
        <p className="text-center text-xs text-gray-400">
          Thank you for choosing HAULR — Arizona&apos;s Premier Junk Removal Service
        </p>
      </div>
    </div>
  );
}
