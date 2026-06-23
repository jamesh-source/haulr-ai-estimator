'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import {
  ArrowLeft, Send, Download, Printer, CreditCard,
  CheckCircle2, AlertTriangle, Loader2, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InvoiceView, type InvoiceData } from '@/components/invoices/InvoiceView';
import { StripePaymentForm } from '@/components/payments/StripePaymentForm';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Stripe (publishable key only — safe for browser)
// ---------------------------------------------------------------------------

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''
);

// ---------------------------------------------------------------------------
// Mock invoice data (replace with Supabase fetch)
// ---------------------------------------------------------------------------

const MOCK_INVOICE: InvoiceData = {
  id: '1',
  invoice_number: 'INV-20260601-001',
  status: 'sent',
  issued_date: '2026-06-01',
  due_date: '2026-06-15',
  paid_at: null,
  subtotal: 549,
  tax_rate: 0,
  tax_amount: 0,
  total_amount: 549,
  notes: 'Thank you for choosing HAULR for your junk removal needs!',
  line_items: [
    {
      id: '1',
      description: 'Junk Removal — Full Load (residential)',
      quantity: 1,
      unit_price: 449,
      amount: 449,
    },
    {
      id: '2',
      description: 'Heavy item surcharge (appliances)',
      quantity: 2,
      unit_price: 50,
      amount: 100,
    },
  ],
  customer: {
    name: 'Michael Torres',
    email: 'mtorres@email.com',
    phone: '(602) 555-1234',
    address: '1234 Oak St, Phoenix, AZ 85001',
  },
  company: {
    name: 'HAULR',
    address: 'Phoenix, AZ',
    phone: '(602) 555-HAUL',
    email: 'billing@haulr.com',
  },
};

// ---------------------------------------------------------------------------
// Invoice detail page
// ---------------------------------------------------------------------------

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const invoiceId = params.id;

  const [invoice] = useState<InvoiceData>(MOCK_INVOICE);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // -------------------------------------------------------------------------
  // Fetch PaymentIntent client secret
  // -------------------------------------------------------------------------
  const handleInitiatePayment = async () => {
    setIsLoadingPayment(true);
    setPaymentError(null);

    try {
      const res = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: invoiceId,
          amount: invoice.total_amount,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to initialize payment');
      }

      setClientSecret(data.clientSecret);
      setShowPaymentForm(true);
    } catch (err) {
      setPaymentError(
        err instanceof Error ? err.message : 'Failed to initialize payment'
      );
    } finally {
      setIsLoadingPayment(false);
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
    setShowPaymentForm(false);
  };

  const isPaid = invoice.status === 'paid' || paymentSuccess;
  const canPay = !isPaid && ['sent', 'overdue', 'payment_failed'].includes(invoice.status);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* Top bar                                                             */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Invoices
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Send className="w-4 h-4" />
            Send Reminder
          </Button>
          {canPay && !showPaymentForm && (
            <Button
              size="sm"
              className="gap-2 bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handleInitiatePayment}
              disabled={isLoadingPayment}
            >
              {isLoadingPayment ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              Record Payment
            </Button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Payment success banner                                              */}
      {/* ------------------------------------------------------------------ */}
      {paymentSuccess && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">Payment Successful</p>
            <p className="text-xs text-green-600 mt-0.5">
              {formatCurrency(invoice.total_amount)} received for{' '}
              {invoice.invoice_number}.
            </p>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Payment error banner                                                */}
      {/* ------------------------------------------------------------------ */}
      {paymentError && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{paymentError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ---------------------------------------------------------------- */}
        {/* Invoice display                                                  */}
        {/* ---------------------------------------------------------------- */}
        <div className="lg:col-span-2">
          <InvoiceView invoice={invoice} />
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Sidebar: payment + actions                                       */}
        {/* ---------------------------------------------------------------- */}
        <div className="space-y-4">
          {/* Payment status card */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">
                Payment Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total</span>
                <span className="font-semibold">
                  {formatCurrency(invoice.total_amount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span
                  className={cn(
                    'font-medium capitalize',
                    isPaid ? 'text-green-600' : 'text-gray-900'
                  )}
                >
                  {isPaid ? 'Paid' : invoice.status.replace('_', ' ')}
                </span>
              </div>
              {invoice.due_date && !isPaid && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Due</span>
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
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Paid On</span>
                  <span className="font-medium text-green-600">
                    {formatDate(invoice.paid_at)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stripe payment form */}
          {showPaymentForm && clientSecret && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  Pay by Card
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Elements
                  stripe={stripePromise}
                  options={{ clientSecret, appearance: { theme: 'stripe' } }}
                >
                  <StripePaymentForm
                    amount={invoice.total_amount}
                    invoiceId={invoiceId}
                    invoiceNumber={invoice.invoice_number}
                    clientSecret={clientSecret}
                    onSuccess={handlePaymentSuccess}
                    onError={(msg) => setPaymentError(msg)}
                  />
                </Elements>
              </CardContent>
            </Card>
          )}

          {/* Quick actions */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 text-gray-700"
              >
                <ExternalLink className="w-4 h-4" />
                Open Customer Portal
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 text-gray-700"
              >
                <Printer className="w-4 h-4" />
                Print Invoice
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
