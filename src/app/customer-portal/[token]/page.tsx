'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import {
  CheckCircle2, MessageSquare, Upload, CreditCard,
  MapPin, Package, Truck, Calendar, Clock,
  AlertCircle, Loader2, Image as ImageIcon, X,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StripePaymentForm } from '@/components/payments/StripePaymentForm';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Stripe client (publishable key — browser-safe)
// ---------------------------------------------------------------------------

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  total_amount: number;
  due_date: string | null;
  paid_at: string | null;
  stripe_payment_intent_id: string | null;
}

interface Job {
  id: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  status: string;
  notes: string | null;
  invoices?: Invoice[];
}

interface Quote {
  id: string;
  quote_number: string;
  status: string;
  service_address: string;
  load_size: string;
  estimated_volume_cf: number;
  truck_percentage: number;
  suggested_price: number;
  notes: string | null;
  created_at: string;
  expires_at: string | null;
  customers: Customer | null;
  jobs: Job | null;
  ai_analysis: {
    items_detected?: { name: string; quantity: number }[];
    hazard_warnings?: string[];
    analysis_notes?: string;
  } | null;
}

type PortalView = 'quote' | 'changes' | 'payment' | 'success';

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const QUOTE_STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  sent: 'Awaiting Your Approval',
  approved: 'Approved',
  rejected: 'Declined',
  expired: 'Expired',
  changes_requested: 'Changes Requested',
};

const QUOTE_STATUS_COLOR: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  expired: 'bg-yellow-100 text-yellow-700',
  changes_requested: 'bg-orange-100 text-orange-700',
};

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
        <p className="text-sm text-gray-500 mt-3">Loading your quote…</p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Quote Not Found
        </h2>
        <p className="text-sm text-gray-500">{message}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main portal page
// ---------------------------------------------------------------------------

export default function CustomerPortalPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<PortalView>('quote');
  const [changesMessage, setChangesMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Photo upload
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);
  const [uploadPreviewUrls, setUploadPreviewUrls] = useState<string[]>([]);

  // Payment
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Details accordion
  const [showDetails, setShowDetails] = useState(false);

  // -------------------------------------------------------------------------
  // Fetch quote data
  // -------------------------------------------------------------------------
  const fetchQuote = useCallback(async () => {
    try {
      const res = await fetch(`/api/customer-portal/${token}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Quote not found');
      }
      const data = await res.json();
      setQuote(data.quote);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quote');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  // -------------------------------------------------------------------------
  // Approve quote
  // -------------------------------------------------------------------------
  const handleApprove = async () => {
    setIsSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/customer-portal/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to approve');

      setQuote((prev) => prev ? { ...prev, status: 'approved' } : prev);
      setView('success');
      setActionSuccess('Your quote has been approved! We will contact you shortly to confirm scheduling.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to approve quote');
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------------------
  // Submit change request
  // -------------------------------------------------------------------------
  const handleRequestChanges = async () => {
    if (!changesMessage.trim()) {
      setActionError('Please describe the changes you need.');
      return;
    }

    setIsSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/customer-portal/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request_changes',
          message: changesMessage.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to submit');

      setQuote((prev) => prev ? { ...prev, status: 'changes_requested' } : prev);
      setView('success');
      setActionSuccess('Your change request has been submitted. We will review it and get back to you within 1 business day.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------------------
  // Handle photo selection
  // -------------------------------------------------------------------------
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const newFiles = files.slice(0, 5 - uploadedPhotos.length);
    const newUrls = newFiles.map((f) => URL.createObjectURL(f));
    setUploadedPhotos((prev) => [...prev, ...newFiles]);
    setUploadPreviewUrls((prev) => [...prev, ...newUrls]);
  };

  const removePhoto = (idx: number) => {
    URL.revokeObjectURL(uploadPreviewUrls[idx]);
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== idx));
    setUploadPreviewUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  // -------------------------------------------------------------------------
  // Initiate payment
  // -------------------------------------------------------------------------
  const handleInitiatePayment = async (invoiceId: string, amount: number) => {
    setIsLoadingPayment(true);

    try {
      const res = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: invoiceId, amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to initialize payment');
      setClientSecret(data.clientSecret);
      setView('payment');
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to initialize payment'
      );
    } finally {
      setIsLoadingPayment(false);
    }
  };

  // -------------------------------------------------------------------------
  // Guards
  // -------------------------------------------------------------------------
  if (isLoading) return <LoadingState />;
  if (error || !quote) return <ErrorState message={error ?? 'Quote not found'} />;

  const invoice = quote.jobs?.invoices?.[0] ?? null;
  const customer = quote.customers;
  const hasPayableInvoice =
    invoice && !['paid', 'cancelled'].includes(invoice.status);

  const statusLabel = QUOTE_STATUS_LABEL[quote.status] ?? quote.status;
  const statusColor =
    QUOTE_STATUS_COLOR[quote.status] ?? 'bg-gray-100 text-gray-700';

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">HAULR</p>
              <p className="text-xs text-gray-400">Customer Portal</p>
            </div>
          </div>
          <span
            className={cn(
              'px-3 py-1 rounded-full text-xs font-semibold',
              statusColor
            )}
          >
            {statusLabel}
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* ---------------------------------------------------------------- */}
        {/* Success view                                                     */}
        {/* ---------------------------------------------------------------- */}
        {view === 'success' && actionSuccess && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {quote.status === 'approved' ? 'Quote Approved!' : 'Request Submitted!'}
            </h2>
            <p className="text-sm text-gray-600 max-w-sm mx-auto">{actionSuccess}</p>
            <Button
              className="mt-6 bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => setView('quote')}
            >
              Back to Quote
            </Button>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Payment success                                                  */}
        {/* ---------------------------------------------------------------- */}
        {paymentSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-3" />
            <p className="font-semibold text-green-800">Payment Received!</p>
            <p className="text-sm text-green-600 mt-1">
              Thank you. A receipt has been sent to {customer?.email}.
            </p>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Error banner                                                     */}
        {/* ---------------------------------------------------------------- */}
        {actionError && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{actionError}</p>
          </div>
        )}

        {view !== 'success' && (
          <>
            {/* ------------------------------------------------------------ */}
            {/* Quote summary card                                            */}
            {/* ------------------------------------------------------------ */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Banner */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 text-white">
                <p className="text-sm font-medium opacity-80">Quote</p>
                <p className="text-2xl font-bold mt-1 font-mono">
                  {quote.quote_number}
                </p>
                <p className="text-sm opacity-80 mt-1">
                  {customer?.name ?? 'Valued Customer'}
                </p>
              </div>

              {/* Key details */}
              <div className="px-6 py-5 space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium">
                      Service Address
                    </p>
                    <p className="text-sm text-gray-900 mt-0.5">
                      {quote.service_address}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Package className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Load Size</p>
                    <p className="text-sm text-gray-900 mt-0.5">
                      {quote.load_size} ({quote.truck_percentage}% truck capacity,{' '}
                      {quote.estimated_volume_cf} cu ft)
                    </p>
                  </div>
                </div>

                {quote.jobs?.scheduled_date && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400 font-medium">
                        Scheduled Date
                      </p>
                      <p className="text-sm text-gray-900 mt-0.5">
                        {formatDate(quote.jobs.scheduled_date)}
                        {quote.jobs.scheduled_time
                          ? ` at ${quote.jobs.scheduled_time}`
                          : ''}
                      </p>
                    </div>
                  </div>
                )}

                {/* Price */}
                <div className="rounded-xl bg-orange-50 border border-orange-100 px-4 py-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Estimated Price
                  </span>
                  <span className="text-2xl font-bold text-orange-600">
                    {formatCurrency(quote.suggested_price)}
                  </span>
                </div>

                {/* Expiry */}
                {quote.expires_at && (
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Quote expires {formatDate(quote.expires_at)}
                  </p>
                )}

                {/* AI-detected items (collapsible) */}
                {quote.ai_analysis?.items_detected &&
                  quote.ai_analysis.items_detected.length > 0 && (
                    <div>
                      <button
                        onClick={() => setShowDetails((p) => !p)}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        {showDetails ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                        {showDetails ? 'Hide' : 'Show'} detected items
                      </button>

                      {showDetails && (
                        <ul className="mt-3 space-y-1">
                          {quote.ai_analysis.items_detected.map((item, i) => (
                            <li
                              key={i}
                              className="flex items-center justify-between text-sm text-gray-700 py-1 border-b border-gray-50 last:border-0"
                            >
                              <span className="capitalize">{item.name}</span>
                              <span className="text-gray-400">
                                x{item.quantity}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                {/* Hazard warnings */}
                {quote.ai_analysis?.hazard_warnings &&
                  quote.ai_analysis.hazard_warnings.length > 0 && (
                    <div className="rounded-xl bg-yellow-50 border border-yellow-100 px-4 py-3">
                      <p className="text-xs font-semibold text-yellow-700 mb-1">
                        Special Handling Items
                      </p>
                      {quote.ai_analysis.hazard_warnings.map((w, i) => (
                        <p key={i} className="text-xs text-yellow-600">
                          • {w}
                        </p>
                      ))}
                    </div>
                  )}

                {quote.notes && (
                  <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                    <p className="text-xs font-semibold text-gray-500 mb-1">
                      Notes
                    </p>
                    <p className="text-sm text-gray-700">{quote.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* Action buttons (only when status is 'sent')                  */}
            {/* ------------------------------------------------------------ */}
            {quote.status === 'sent' && view === 'quote' && (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  className="h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold gap-2"
                  onClick={handleApprove}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Approve Quote
                </Button>
                <Button
                  variant="outline"
                  className="h-12 gap-2 font-semibold"
                  onClick={() => setView('changes')}
                >
                  <MessageSquare className="w-4 h-4" />
                  Request Changes
                </Button>
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* Request changes form                                          */}
            {/* ------------------------------------------------------------ */}
            {view === 'changes' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                <h3 className="font-semibold text-gray-900">Request Changes</h3>
                <p className="text-sm text-gray-500">
                  Please describe what you&apos;d like changed. We&apos;ll review your
                  request and send an updated quote.
                </p>
                <textarea
                  value={changesMessage}
                  onChange={(e) => setChangesMessage(e.target.value)}
                  placeholder="E.g., Please remove the furniture items — we only need the appliances hauled away…"
                  rows={5}
                  className="w-full text-sm rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-colors resize-none"
                />
                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white gap-2"
                    onClick={handleRequestChanges}
                    disabled={isSubmitting || !changesMessage.trim()}
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Submit Request
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setView('quote');
                      setActionError(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* Additional photos upload                                      */}
            {/* ------------------------------------------------------------ */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold text-gray-900">
                  Upload Additional Photos
                </h3>
              </div>
              <p className="text-sm text-gray-500">
                Have additional items or angles? Upload up to 5 photos to help
                us give you the most accurate estimate.
              </p>

              {/* Preview grid */}
              {uploadPreviewUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {uploadPreviewUrls.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removePhoto(idx)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {uploadedPhotos.length < 5 && (
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors">
                  <Upload className="w-6 h-6 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    Click to upload photos
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    JPG, PNG, HEIC — up to 10 MB each
                  </p>
                  <input
                    type="file"
                    accept="image/*,.heic"
                    multiple
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                </label>
              )}

              {uploadedPhotos.length > 0 && (
                <Button
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => {
                    // TODO: Implement actual upload to Supabase storage
                    alert(
                      `${uploadedPhotos.length} photo(s) ready to upload. Connect to your storage provider to complete.`
                    );
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Send {uploadedPhotos.length} Photo
                  {uploadedPhotos.length !== 1 ? 's' : ''} to HAULR
                </Button>
              )}
            </div>

            {/* ------------------------------------------------------------ */}
            {/* Payment section                                               */}
            {/* ------------------------------------------------------------ */}
            {hasPayableInvoice && invoice && !paymentSuccess && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-orange-500" />
                    <h3 className="font-semibold text-gray-900">
                      Invoice Payment
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Invoice {invoice.invoice_number} —{' '}
                    {formatCurrency(invoice.total_amount)}
                    {invoice.due_date ? ` due ${formatDate(invoice.due_date)}` : ''}
                  </p>
                </div>

                <div className="px-6 py-5">
                  {view !== 'payment' ? (
                    <Button
                      className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold gap-2"
                      onClick={() =>
                        handleInitiatePayment(invoice.id, invoice.total_amount)
                      }
                      disabled={isLoadingPayment}
                    >
                      {isLoadingPayment ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CreditCard className="w-4 h-4" />
                      )}
                      Pay {formatCurrency(invoice.total_amount)} Now
                    </Button>
                  ) : clientSecret ? (
                    <Elements
                      stripe={stripePromise}
                      options={{
                        clientSecret,
                        appearance: { theme: 'stripe' },
                      }}
                    >
                      <StripePaymentForm
                        amount={invoice.total_amount}
                        invoiceId={invoice.id}
                        invoiceNumber={invoice.invoice_number}
                        clientSecret={clientSecret}
                        onSuccess={() => {
                          setPaymentSuccess(true);
                          setView('quote');
                        }}
                        onError={(msg) => setActionError(msg)}
                      />
                    </Elements>
                  ) : (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="text-center pb-6">
          <p className="text-xs text-gray-400">
            Questions? Contact us at{' '}
            <a
              href="tel:6025554285"
              className="text-orange-500 hover:underline"
            >
              (602) 555-HAUL
            </a>{' '}
            or{' '}
            <a
              href="mailto:info@haulr.com"
              className="text-orange-500 hover:underline"
            >
              info@haulr.com
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
