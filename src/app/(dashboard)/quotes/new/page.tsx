'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { QuoteBuilder } from '@/components/quotes/QuoteBuilder';
import { QuotePreview } from '@/components/quotes/QuotePreview';
import { downloadQuotePDF } from '@/components/quotes/QuotePDF';
import { generateQuoteNumber } from '@/lib/utils';
import type { QuotePreviewData } from '@/components/quotes/QuotePreview';

// =============================================================================
// PAGE
// =============================================================================

export default function NewQuotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<QuotePreviewData | null>(null);
  const quoteNumber = generateQuoteNumber();
  const [companyInfo, setCompanyInfo] = useState({ name: '', phone: '', email: '', address: '', city: '', state: '', zip: '' });

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(({ data }) => {
      if (data) setCompanyInfo({ name: data.company_name ?? '', phone: data.phone ?? '', email: data.email ?? '', address: data.address ?? '', city: data.city ?? '', state: data.state ?? '', zip: data.zip ?? '' });
    }).catch(() => {});
  }, []);

  // Pre-fill from estimator query params
  const initialData = {
    customerName: searchParams.get('customerName') ?? '',
    customerPhone: searchParams.get('customerPhone') ?? '',
    customerEmail: searchParams.get('customerEmail') ?? '',
    serviceAddress: searchParams.get('address') ?? '',
    loadSizeId: searchParams.get('loadSize') ?? '',
  };

  const handleSaveDraft = async (data: any, totals: any) => {
    // TODO: persist to Supabase
    toast.success('Quote saved as draft');
    router.push('/quotes');
  };

  const handleSendQuote = async (data: any, totals: any) => {
    // TODO: send via email / SMS
    toast.success(`Quote sent to ${data.customerEmail || data.customerPhone}`);
    router.push('/quotes');
  };

  const handlePreview = (data: any, totals: any) => {
    const lineItems = [
      { label: 'Base Service Fee', amount: totals.baseCharge },
      { label: 'Load Charge', sublabel: data.loadSizeId, amount: totals.loadCharge },
      {
        label: 'Distance Charge',
        sublabel: `${data.distanceMiles} miles`,
        amount: totals.distanceCharge,
      },
      {
        label: 'Labor',
        sublabel: `${data.numWorkers} workers × ${data.hoursOnSite} hrs`,
        amount: totals.laborCharge,
      },
      { label: 'Heavy Items', amount: totals.heavyItemsCharge },
      { label: 'Construction Debris', amount: totals.debrisCharge },
      { label: 'Specialty Items', amount: totals.specialtyCharge },
      { label: 'Stair Fee', amount: totals.stairFee },
      { label: 'Custom Fees', amount: totals.customFeesTotal },
      ...(totals.discountAmount > 0
        ? [{ label: 'Discount', amount: totals.discountAmount, isDiscount: true }]
        : []),
    ].filter((item) => item.amount > 0);

    setPreviewData({
      quoteNumber,
      customerName: data.customerName || 'Customer',
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      serviceAddress: data.serviceAddress,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      companyName: companyInfo.name || 'HAULR Junk Removal',
      companyPhone: companyInfo.phone || '(602) 555-0123',
      companyEmail: companyInfo.email || 'quotes@haulr.com',
      companyAddress: [companyInfo.address, companyInfo.city, companyInfo.state, companyInfo.zip].filter(Boolean).join(', ') || '1234 Business Park Dr, Phoenix, AZ 85001',
      lineItems,
      subtotal: totals.subtotal,
      discount: totals.discountAmount,
      tax: totals.tax,
      total: totals.total,
      notes: data.notes,
      terms: data.terms,
    });
    setPreviewOpen(true);
  };

  const handleDownloadPDF = async () => {
    if (!previewData) return;
    try {
      await downloadQuotePDF({
        ...previewData,
        lineItems: previewData.lineItems,
      });
      toast.success('PDF downloaded successfully');
    } catch (err) {
      toast.error('Failed to generate PDF');
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link
          href="/quotes"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Quotes
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium text-gray-900">New Quote</span>
      </div>

      {/* Builder */}
      <QuoteBuilder
        initialData={initialData}
        onSaveDraft={handleSaveDraft}
        onSendQuote={handleSendQuote}
        onPreview={handlePreview}
      />

      {/* Preview Modal */}
      {previewData && (
        <QuotePreview
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          data={previewData}
          onDownloadPDF={handleDownloadPDF}
          onSend={() => {
            setPreviewOpen(false);
            toast.success('Quote sent!');
            router.push('/quotes');
          }}
        />
      )}
    </div>
  );
}
