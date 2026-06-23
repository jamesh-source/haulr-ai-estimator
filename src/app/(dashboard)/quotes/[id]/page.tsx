'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Download, Send, CheckCircle, Briefcase, Pencil,
  Clock, MessageSquare, User, MapPin, FileText, X, Save,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QuotePreview } from '@/components/quotes/QuotePreview';
import { downloadQuotePDF } from '@/components/quotes/QuotePDF';
import { cn, formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import type { QuotePreviewData } from '@/components/quotes/QuotePreview';

// =============================================================================
// MOCK DATA
// =============================================================================

const MOCK_QUOTE = {
  id: '2',
  quoteNumber: 'HLR-20260617-2934',
  status: 'sent' as 'draft' | 'sent' | 'approved' | 'rejected' | 'expired',
  customerName: 'Sarah Johnson',
  customerPhone: '(602) 555-4821',
  customerEmail: 'sjohnson@gmail.com',
  serviceAddress: '5678 Maple Ave, Scottsdale, AZ 85251',
  createdAt: new Date('2026-06-17'),
  sentAt: new Date('2026-06-17'),
  expiresAt: new Date('2026-06-24'),
  loadSize: 'Full Load',
  distanceMiles: 18,
  travelMinutes: 32,
  numWorkers: 2,
  hoursOnSite: 3,
  difficulty: 'Moderate',
  notes: 'Customer has a piano that needs special handling. Access through the side gate.',
  terms: 'All junk removal services are subject to our standard terms and conditions. Payment is due upon completion of service.',
  lineItems: [
    { label: 'Base Service Fee', sublabel: 'Minimum service charge', amount: 75 },
    { label: 'Full Load Charge', sublabel: '15 cubic yards', amount: 599 },
    { label: 'Distance Charge', sublabel: '18 miles from office', amount: 25 },
    { label: 'Labor', sublabel: '2 workers × 3 hrs @ $75/hr', amount: 450 },
    { label: 'Heavy Item — Piano', sublabel: '× 1', amount: 150 },
    { label: 'Stair Fee', sublabel: '1 flight', amount: 50 },
  ],
  subtotal: 1349,
  discount: 0,
  tax: 0,
  total: 879,
};

const MOCK_ACTIVITY = [
  {
    id: '1',
    type: 'created',
    message: 'Quote created',
    user: 'You',
    timestamp: new Date('2026-06-17T09:15:00'),
  },
  {
    id: '2',
    type: 'sent',
    message: 'Quote sent to sarah.johnson@gmail.com',
    user: 'You',
    timestamp: new Date('2026-06-17T09:22:00'),
  },
  {
    id: '3',
    type: 'viewed',
    message: 'Customer viewed the quote',
    user: 'Sarah Johnson',
    timestamp: new Date('2026-06-17T14:38:00'),
  },
  {
    id: '4',
    type: 'note',
    message: 'Called customer — they are considering. Follow up Monday.',
    user: 'You',
    timestamp: new Date('2026-06-18T11:00:00'),
  },
];

// =============================================================================
// ACTIVITY ICON
// =============================================================================

function ActivityIcon({ type }: { type: string }) {
  const configs: Record<string, { icon: React.ElementType; color: string }> = {
    created: { icon: FileText, color: 'bg-gray-100 text-gray-600' },
    sent: { icon: Send, color: 'bg-blue-100 text-blue-600' },
    viewed: { icon: User, color: 'bg-purple-100 text-purple-600' },
    approved: { icon: CheckCircle, color: 'bg-green-100 text-green-600' },
    note: { icon: MessageSquare, color: 'bg-yellow-100 text-yellow-600' },
  };

  const config = configs[type] ?? configs.note;
  const Icon = config.icon;

  return (
    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', config.color)}>
      <Icon className="h-3.5 w-3.5" />
    </div>
  );
}

// =============================================================================
// LINE ITEM ROW (EDITABLE)
// =============================================================================

interface LineItem {
  label: string;
  sublabel?: string;
  amount: number;
  isDiscount?: boolean;
}

function LineItemRow({
  item,
  editable,
  onUpdate,
}: {
  item: LineItem;
  editable: boolean;
  onUpdate?: (updated: LineItem) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item);

  if (!editable) {
    return (
      <div className="flex items-start justify-between py-3 border-b border-gray-50 last:border-0">
        <div>
          <div className="text-sm font-medium text-gray-800">{item.label}</div>
          {item.sublabel && <div className="text-xs text-gray-400">{item.sublabel}</div>}
        </div>
        <span
          className={cn(
            'text-sm font-semibold font-mono',
            item.isDiscount ? 'text-green-600' : 'text-gray-800'
          )}
        >
          {item.isDiscount
            ? `-${formatCurrency(item.amount)}`
            : formatCurrency(item.amount)}
        </span>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="py-2 border-b border-orange-100 bg-orange-50/30 rounded-lg px-2">
        <div className="flex gap-2 mb-1.5">
          <input
            value={draft.label}
            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
            className="flex-1 text-sm px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Description"
          />
          <div className="relative w-28">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              value={draft.amount}
              onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })}
              className="w-full pl-6 pr-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => {
              onUpdate?.(draft);
              setEditing(false);
            }}
            className="text-xs text-white bg-orange-500 hover:bg-orange-600 px-3 py-1 rounded-md font-medium transition-colors"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(item);
              setEditing(false);
            }}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-start justify-between py-3 border-b border-gray-50 last:border-0 group cursor-pointer hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors"
      onClick={() => setEditing(true)}
    >
      <div>
        <div className="text-sm font-medium text-gray-800">{item.label}</div>
        {item.sublabel && <div className="text-xs text-gray-400">{item.sublabel}</div>}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold font-mono text-gray-800">
          {formatCurrency(item.amount)}
        </span>
        <Pencil className="h-3 w-3 text-gray-300 group-hover:text-orange-400 transition-colors" />
      </div>
    </div>
  );
}

// =============================================================================
// PAGE
// =============================================================================

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.id as string;

  const [editMode, setEditMode] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [activity, setActivity] = useState(MOCK_ACTIVITY);
  const [lineItems, setLineItems] = useState<LineItem[]>(MOCK_QUOTE.lineItems);

  // In production, fetch quote by quoteId from Supabase
  const quote = MOCK_QUOTE;

  const previewData: QuotePreviewData = {
    quoteNumber: quote.quoteNumber,
    customerName: quote.customerName,
    customerPhone: quote.customerPhone,
    customerEmail: quote.customerEmail,
    serviceAddress: quote.serviceAddress,
    createdAt: quote.createdAt,
    expiresAt: quote.expiresAt,
    companyName: 'HAULR Junk Removal',
    companyPhone: '(602) 555-0123',
    companyEmail: 'quotes@haulr.com',
    companyAddress: '1234 Business Park Dr, Phoenix, AZ 85001',
    lineItems,
    subtotal: lineItems.reduce((s, i) => s + i.amount, 0),
    discount: quote.discount,
    tax: quote.tax,
    total: quote.total,
    notes: quote.notes,
    terms: quote.terms,
  };

  const handleMarkApproved = () => {
    toast.success('Quote marked as approved');
    router.push('/quotes');
  };

  const handleConvertToJob = () => {
    toast.success('Converting quote to job...');
    router.push('/jobs/new?quoteId=' + quoteId);
  };

  const handleSendQuote = () => {
    toast.success(`Quote sent to ${quote.customerEmail}`);
    setActivity([
      ...activity,
      {
        id: Date.now().toString(),
        type: 'sent',
        message: `Quote re-sent to ${quote.customerEmail}`,
        user: 'You',
        timestamp: new Date(),
      },
    ]);
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    setActivity([
      ...activity,
      {
        id: Date.now().toString(),
        type: 'note',
        message: newNote,
        user: 'You',
        timestamp: new Date(),
      },
    ]);
    setNewNote('');
    toast.success('Note added');
  };

  const handleDownloadPDF = async () => {
    try {
      await downloadQuotePDF({
        ...previewData,
      });
      toast.success('PDF downloaded');
    } catch (e) {
      toast.error('Failed to generate PDF');
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/quotes"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Quotes
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-medium text-gray-900">{quote.quoteNumber}</span>
          <Badge variant={quote.status} dot>
            {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="h-3.5 w-3.5" />}
            onClick={handleDownloadPDF}
          >
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<FileText className="h-3.5 w-3.5" />}
            onClick={() => setPreviewOpen(true)}
          >
            Preview
          </Button>
          {editMode ? (
            <Button
              size="sm"
              leftIcon={<Save className="h-3.5 w-3.5" />}
              onClick={() => {
                setEditMode(false);
                toast.success('Quote saved');
              }}
            >
              Save Changes
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Pencil className="h-3.5 w-3.5" />}
              onClick={() => setEditMode(true)}
            >
              Edit
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* ── MAIN CONTENT ───────────────────────────────────────────── */}
        <div className="col-span-2 space-y-5">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-orange-500" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-0.5">Name</div>
                <div className="font-semibold text-gray-900">{quote.customerName}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-0.5">Phone</div>
                <div className="font-medium text-gray-800">{quote.customerPhone}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-0.5">Email</div>
                <div className="font-medium text-gray-800">{quote.customerEmail}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-0.5">Service Address</div>
                <div className="font-medium text-gray-800">{quote.serviceAddress}</div>
              </div>
            </CardContent>
          </Card>

          {/* Job Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-orange-500" />
                Job Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-gray-900">{quote.loadSize}</div>
                  <div className="text-xs text-gray-500">Load Size</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-gray-900">{quote.distanceMiles} mi</div>
                  <div className="text-xs text-gray-500">Distance</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-gray-900">{quote.numWorkers}</div>
                  <div className="text-xs text-gray-500">Workers</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-gray-900">{quote.hoursOnSite} hrs</div>
                  <div className="text-xs text-gray-500">On Site</div>
                </div>
              </div>

              {quote.notes && (
                <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-sm text-gray-700">
                  <div className="font-medium text-gray-900 mb-1 text-xs uppercase tracking-wide">
                    Notes
                  </div>
                  {quote.notes}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Line Items
                  {editMode && (
                    <span className="ml-2 text-xs font-normal text-orange-500">
                      Click any row to edit
                    </span>
                  )}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                {lineItems.map((item, i) => (
                  <LineItemRow
                    key={i}
                    item={item}
                    editable={editMode}
                    onUpdate={(updated) => {
                      const next = [...lineItems];
                      next[i] = updated;
                      setLineItems(next);
                    }}
                  />
                ))}
              </div>

              {/* Totals */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-col gap-1 w-48 ml-auto text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-semibold">{formatCurrency(lineItems.reduce((s, i) => s + i.amount, 0))}</span>
                  </div>
                  {quote.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-green-600">Discount</span>
                      <span className="text-green-600 font-semibold">
                        -{formatCurrency(quote.discount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-300 mt-1">
                    <span className="font-bold text-gray-900 text-base">Total</span>
                    <span className="font-bold text-gray-900 text-base">
                      {formatCurrency(quote.total)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              className="flex-1"
              leftIcon={<Send className="h-4 w-4" />}
              onClick={handleSendQuote}
            >
              {quote.status === 'sent' ? 'Re-send Quote' : 'Send Quote'}
            </Button>
            {quote.status !== 'approved' && (
              <Button
                variant="success"
                className="flex-1"
                leftIcon={<CheckCircle className="h-4 w-4" />}
                onClick={handleMarkApproved}
              >
                Mark Approved
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-1"
              leftIcon={<Briefcase className="h-4 w-4" />}
              onClick={handleConvertToJob}
            >
              Convert to Job
            </Button>
          </div>
        </div>

        {/* ── SIDEBAR ────────────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Quote Meta */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quote Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Quote #</span>
                <span className="font-mono font-semibold text-gray-800">
                  {quote.quoteNumber}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-800">{formatDate(quote.createdAt)}</span>
              </div>
              {quote.sentAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Sent</span>
                  <span className="text-gray-800">{formatDate(quote.sentAt)}</span>
                </div>
              )}
              {quote.expiresAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Expires</span>
                  <span className="text-yellow-600 font-medium">
                    {formatDate(quote.expiresAt)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm pt-1 border-t border-gray-100">
                <span className="text-gray-500">Total</span>
                <span className="font-bold text-gray-900 text-base">
                  {formatCurrency(quote.total)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-orange-500" />
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <div className="space-y-3">
                {activity.map((entry, i) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex gap-3"
                  >
                    <ActivityIcon type={entry.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 leading-snug">{entry.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {entry.user} · {formatDateTime(entry.timestamp)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Add Note */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
                <Button
                  size="sm"
                  className="mt-2 w-full"
                  variant="outline"
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                >
                  Add Note
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Modal */}
      <QuotePreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        data={previewData}
        onDownloadPDF={handleDownloadPDF}
        onSend={handleSendQuote}
      />
    </div>
  );
}
