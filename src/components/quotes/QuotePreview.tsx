'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Send, Printer } from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// =============================================================================
// TYPES
// =============================================================================

export interface QuotePreviewItem {
  label: string;
  sublabel?: string;
  amount: number;
  isDiscount?: boolean;
}

export interface QuotePreviewData {
  quoteNumber: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  serviceAddress: string;
  createdAt: Date;
  expiresAt?: Date;
  companyName: string;
  companyPhone: string;
  companyEmail: string;
  companyAddress: string;
  lineItems: QuotePreviewItem[];
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
  notes?: string;
  terms?: string;
}

export interface QuotePreviewProps {
  open: boolean;
  onClose: () => void;
  data: QuotePreviewData;
  onDownloadPDF?: () => void;
  onSend?: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function QuotePreview({
  open,
  onClose,
  data,
  onDownloadPDF,
  onSend,
}: QuotePreviewProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-8 lg:inset-16 z-50 flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Quote Preview</h2>
                <p className="text-sm text-gray-500">
                  This is how the customer will see the quote
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Printer className="h-3.5 w-3.5" />}
                  onClick={() => window.print()}
                >
                  Print
                </Button>
                {onDownloadPDF && (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Download className="h-3.5 w-3.5" />}
                    onClick={onDownloadPDF}
                  >
                    Download PDF
                  </Button>
                )}
                {onSend && (
                  <Button
                    size="sm"
                    leftIcon={<Send className="h-3.5 w-3.5" />}
                    onClick={onSend}
                  >
                    Send to Customer
                  </Button>
                )}
                <button
                  onClick={onClose}
                  className="ml-2 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Quote Document */}
            <div className="flex-1 overflow-y-auto p-8 bg-gray-100">
              <div className="max-w-2xl mx-auto">
                <QuoteDocument data={data} />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// QUOTE DOCUMENT (also used in PDF)
// =============================================================================

export function QuoteDocument({ data }: { data: QuotePreviewData }) {
  const nonZeroItems = data.lineItems.filter((item) => item.amount !== 0);

  return (
    <div className="bg-white shadow-xl rounded-xl overflow-hidden print:shadow-none print:rounded-none">
      {/* Header Band */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-6">
        <div className="flex items-start justify-between">
          <div>
            {/* Logo placeholder */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-white font-black text-lg">H</span>
              </div>
              <div>
                <div className="text-white font-bold text-xl leading-tight">
                  {data.companyName}
                </div>
                <div className="text-orange-100 text-xs">Junk Removal & Hauling</div>
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-orange-100 text-sm">{data.companyPhone}</div>
              <div className="text-orange-100 text-sm">{data.companyEmail}</div>
              <div className="text-orange-100 text-sm">{data.companyAddress}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-white/60 text-xs uppercase tracking-wider font-medium mb-1">
              Quote
            </div>
            <div className="text-white font-bold text-2xl">#{data.quoteNumber}</div>
            <div className="text-orange-100 text-sm mt-2">
              Issued: {formatDate(data.createdAt)}
            </div>
            {data.expiresAt && (
              <div className="text-orange-100 text-sm">
                Expires: {formatDate(data.expiresAt)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bill To Section */}
      <div className="px-8 py-6 border-b border-gray-100">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Bill To
            </div>
            <div className="font-bold text-gray-900 text-lg">{data.customerName}</div>
            {data.customerPhone && (
              <div className="text-gray-600 text-sm">{data.customerPhone}</div>
            )}
            {data.customerEmail && (
              <div className="text-gray-600 text-sm">{data.customerEmail}</div>
            )}
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Service Location
            </div>
            <div className="text-gray-800 text-sm leading-relaxed">
              {data.serviceAddress}
            </div>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="px-8 py-6">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider pb-2">
                Description
              </th>
              <th className="text-right text-xs font-bold text-gray-500 uppercase tracking-wider pb-2">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {nonZeroItems.map((item, i) => (
              <tr key={i} className="group">
                <td className="py-3 pr-4">
                  <div
                    className={cn(
                      'font-medium text-sm',
                      item.isDiscount ? 'text-green-700' : 'text-gray-800'
                    )}
                  >
                    {item.label}
                  </div>
                  {item.sublabel && (
                    <div className="text-xs text-gray-400 mt-0.5">{item.sublabel}</div>
                  )}
                </td>
                <td
                  className={cn(
                    'py-3 text-right font-mono text-sm font-semibold',
                    item.isDiscount ? 'text-green-600' : 'text-gray-800'
                  )}
                >
                  {item.isDiscount
                    ? `-${formatCurrency(item.amount)}`
                    : formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-col gap-1.5 w-64 ml-auto">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold text-gray-800">
                {formatCurrency(data.subtotal)}
              </span>
            </div>
            {(data.discount ?? 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Discount</span>
                <span className="font-semibold text-green-600">
                  -{formatCurrency(data.discount ?? 0)}
                </span>
              </div>
            )}
            {(data.tax ?? 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="font-semibold text-gray-800">
                  {formatCurrency(data.tax ?? 0)}
                </span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-800">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-bold text-xl text-gray-900">
                {formatCurrency(data.total)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {data.notes && (
        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
            Notes
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{data.notes}</p>
        </div>
      )}

      {/* Terms */}
      {data.terms && (
        <div className="px-8 py-4 border-t border-gray-100">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
            Terms & Conditions
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">{data.terms}</p>
        </div>
      )}

      {/* Signature Line */}
      <div className="px-8 py-6 border-t border-gray-100 bg-gray-50">
        <div className="grid grid-cols-2 gap-12">
          <div>
            <div className="border-b border-gray-400 mb-1 h-8" />
            <div className="text-xs text-gray-500">Customer Signature</div>
            <div className="text-xs text-gray-400 mt-0.5">Date: ________________</div>
          </div>
          <div>
            <div className="border-b border-gray-400 mb-1 h-8" />
            <div className="text-xs text-gray-500">Authorized Representative</div>
            <div className="text-xs text-gray-400 mt-0.5">Date: ________________</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-8 py-3 bg-orange-500 text-center">
        <p className="text-white/80 text-xs">
          Thank you for choosing {data.companyName} &mdash; {data.companyPhone} &mdash;{' '}
          {data.companyEmail}
        </p>
      </div>
    </div>
  );
}
