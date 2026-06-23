'use client';

/**
 * QuotePDF — PDF generation using @react-pdf/renderer
 *
 * Usage:
 *   import { generateQuotePDF } from '@/components/quotes/QuotePDF';
 *   const blob = await generateQuotePDF(quoteData);
 *   // Then use blob to trigger download or send via email
 *
 * The React components (QuotePDFDocument etc.) are exported so they can
 * also be rendered server-side via renderToStream for email attachments.
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
  Image,
} from '@react-pdf/renderer';

// =============================================================================
// TYPES
// =============================================================================

export interface PDFLineItem {
  label: string;
  sublabel?: string;
  amount: number;
  isDiscount?: boolean;
}

export interface QuotePDFData {
  quoteNumber: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  serviceAddress: string;
  createdAt: Date | string;
  expiresAt?: Date | string;

  // Company
  companyName: string;
  companyPhone: string;
  companyEmail: string;
  companyAddress: string;
  companyLogoUrl?: string;

  // Line items
  lineItems: PDFLineItem[];
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;

  // Content
  notes?: string;
  terms?: string;
  photos?: string[]; // URLs of job photos
}

// =============================================================================
// STYLES
// =============================================================================

const ORANGE = '#f97316';
const ORANGE_LIGHT = '#fff7ed';
const GRAY_900 = '#111827';
const GRAY_700 = '#374151';
const GRAY_500 = '#6b7280';
const GRAY_300 = '#d1d5db';
const GRAY_100 = '#f3f4f6';
const GREEN = '#16a34a';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    fontSize: 9,
    color: GRAY_700,
  },

  // Header
  header: {
    backgroundColor: ORANGE,
    paddingHorizontal: 32,
    paddingVertical: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  companyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  logoBox: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
  },
  companyName: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
  },
  companySubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 8,
  },
  companyInfo: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 8,
    lineHeight: 1.5,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  quoteLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  quoteNumber: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
  },
  quoteDate: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 8,
    marginTop: 4,
  },

  // Bill to section
  billToSection: {
    paddingHorizontal: 32,
    paddingVertical: 20,
    flexDirection: 'row',
    gap: 48,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_300,
  },
  billToColumn: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: GRAY_500,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  customerName: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: GRAY_900,
    marginBottom: 2,
  },
  customerInfo: {
    fontSize: 9,
    color: GRAY_700,
    lineHeight: 1.5,
  },
  serviceAddress: {
    fontSize: 9,
    color: GRAY_700,
    lineHeight: 1.5,
  },

  // Line items table
  tableSection: {
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: GRAY_300,
    paddingBottom: 6,
    marginBottom: 4,
  },
  tableHeaderDesc: {
    flex: 1,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: GRAY_500,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  tableHeaderAmount: {
    width: 80,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: GRAY_500,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_100,
    alignItems: 'center',
  },
  tableRowDesc: {
    flex: 1,
  },
  tableRowLabel: {
    fontSize: 9,
    color: GRAY_900,
    fontFamily: 'Helvetica-Bold',
  },
  tableRowSublabel: {
    fontSize: 7.5,
    color: GRAY_500,
    marginTop: 1,
  },
  tableRowAmount: {
    width: 80,
    textAlign: 'right',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: GRAY_900,
  },
  discountLabel: {
    color: GREEN,
  },
  discountAmount: {
    color: GREEN,
  },

  // Totals
  totalsSection: {
    paddingHorizontal: 32,
    paddingBottom: 20,
    alignItems: 'flex-end',
  },
  totalsBox: {
    width: 220,
    borderTopWidth: 2,
    borderTopColor: GRAY_300,
    paddingTop: 8,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totalsLabel: {
    fontSize: 9,
    color: GRAY_700,
  },
  totalsValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: GRAY_700,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 2,
    borderTopColor: GRAY_900,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: GRAY_900,
  },
  grandTotalValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: GRAY_900,
  },

  // Notes
  notesSection: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: GRAY_100,
    borderTopWidth: 1,
    borderTopColor: GRAY_300,
  },
  notesText: {
    fontSize: 8.5,
    color: GRAY_700,
    lineHeight: 1.6,
  },

  // Terms
  termsSection: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: GRAY_300,
  },
  termsText: {
    fontSize: 7.5,
    color: GRAY_500,
    lineHeight: 1.6,
  },

  // Photos
  photosSection: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: GRAY_300,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoItem: {
    width: 120,
    height: 90,
    borderRadius: 4,
    objectFit: 'cover',
  },

  // Signature
  signatureSection: {
    paddingHorizontal: 32,
    paddingVertical: 24,
    flexDirection: 'row',
    gap: 48,
    borderTopWidth: 1,
    borderTopColor: GRAY_300,
    backgroundColor: GRAY_100,
  },
  signatureBox: {
    flex: 1,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: GRAY_500,
    marginBottom: 4,
    height: 24,
  },
  signatureLabel: {
    fontSize: 7.5,
    color: GRAY_500,
  },
  signatureDateLabel: {
    fontSize: 7.5,
    color: GRAY_500,
    marginTop: 2,
  },

  // Footer
  footer: {
    backgroundColor: ORANGE,
    paddingHorizontal: 32,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 8,
    textAlign: 'center',
  },
});

// =============================================================================
// HELPERS
// =============================================================================

function formatCurrencyPDF(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDatePDF(date: Date | string | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// =============================================================================
// PDF DOCUMENT COMPONENT
// =============================================================================

export function QuotePDFDocument({ data }: { data: QuotePDFData }) {
  const nonZeroItems = data.lineItems.filter((item) => item.amount !== 0);
  const hasPhotos = data.photos && data.photos.length > 0;

  return (
    <Document
      title={`Quote #${data.quoteNumber}`}
      author={data.companyName}
      subject="Junk Removal Quote"
    >
      <Page size="A4" style={styles.page}>
        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.companyNameRow}>
              <View style={styles.logoBox}>
                <Text style={styles.logoLetter}>H</Text>
              </View>
              <View>
                <Text style={styles.companyName}>{data.companyName}</Text>
                <Text style={styles.companySubtitle}>Junk Removal &amp; Hauling</Text>
              </View>
            </View>
            <Text style={styles.companyInfo}>{data.companyPhone}</Text>
            <Text style={styles.companyInfo}>{data.companyEmail}</Text>
            <Text style={styles.companyInfo}>{data.companyAddress}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.quoteLabel}>Quote</Text>
            <Text style={styles.quoteNumber}>#{data.quoteNumber}</Text>
            <Text style={styles.quoteDate}>Issued: {formatDatePDF(data.createdAt)}</Text>
            {data.expiresAt && (
              <Text style={styles.quoteDate}>Expires: {formatDatePDF(data.expiresAt)}</Text>
            )}
          </View>
        </View>

        {/* ── BILL TO ────────────────────────────────────────────────────── */}
        <View style={styles.billToSection}>
          <View style={styles.billToColumn}>
            <Text style={styles.sectionLabel}>Bill To</Text>
            <Text style={styles.customerName}>{data.customerName}</Text>
            {data.customerPhone && (
              <Text style={styles.customerInfo}>{data.customerPhone}</Text>
            )}
            {data.customerEmail && (
              <Text style={styles.customerInfo}>{data.customerEmail}</Text>
            )}
          </View>
          <View style={styles.billToColumn}>
            <Text style={styles.sectionLabel}>Service Location</Text>
            <Text style={styles.serviceAddress}>{data.serviceAddress}</Text>
          </View>
        </View>

        {/* ── LINE ITEMS ─────────────────────────────────────────────────── */}
        <View style={styles.tableSection}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderDesc}>Description</Text>
            <Text style={styles.tableHeaderAmount}>Amount</Text>
          </View>

          {nonZeroItems.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <View style={styles.tableRowDesc}>
                <Text
                  style={[
                    styles.tableRowLabel,
                    item.isDiscount ? styles.discountLabel : {},
                  ]}
                >
                  {item.label}
                </Text>
                {item.sublabel && (
                  <Text style={styles.tableRowSublabel}>{item.sublabel}</Text>
                )}
              </View>
              <Text
                style={[
                  styles.tableRowAmount,
                  item.isDiscount ? styles.discountAmount : {},
                ]}
              >
                {item.isDiscount
                  ? `-${formatCurrencyPDF(item.amount)}`
                  : formatCurrencyPDF(item.amount)}
              </Text>
            </View>
          ))}
        </View>

        {/* ── TOTALS ─────────────────────────────────────────────────────── */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>{formatCurrencyPDF(data.subtotal)}</Text>
            </View>
            {(data.discount ?? 0) > 0 && (
              <View style={styles.totalsRow}>
                <Text style={[styles.totalsLabel, { color: GREEN }]}>Discount</Text>
                <Text style={[styles.totalsValue, { color: GREEN }]}>
                  -{formatCurrencyPDF(data.discount ?? 0)}
                </Text>
              </View>
            )}
            {(data.tax ?? 0) > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Tax</Text>
                <Text style={styles.totalsValue}>{formatCurrencyPDF(data.tax ?? 0)}</Text>
              </View>
            )}
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>TOTAL</Text>
              <Text style={styles.grandTotalValue}>{formatCurrencyPDF(data.total)}</Text>
            </View>
          </View>
        </View>

        {/* ── PHOTOS ─────────────────────────────────────────────────────── */}
        {hasPhotos && (
          <View style={styles.photosSection}>
            <Text style={styles.sectionLabel}>Job Photos</Text>
            <View style={styles.photosGrid}>
              {(data.photos ?? []).slice(0, 6).map((url, i) => (
                <Image key={i} src={url} style={styles.photoItem} />
              ))}
            </View>
          </View>
        )}

        {/* ── NOTES ──────────────────────────────────────────────────────── */}
        {data.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionLabel}>Notes</Text>
            <Text style={styles.notesText}>{data.notes}</Text>
          </View>
        )}

        {/* ── TERMS ──────────────────────────────────────────────────────── */}
        {data.terms && (
          <View style={styles.termsSection}>
            <Text style={styles.sectionLabel}>Terms &amp; Conditions</Text>
            <Text style={styles.termsText}>{data.terms}</Text>
          </View>
        )}

        {/* ── SIGNATURE ──────────────────────────────────────────────────── */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Customer Signature</Text>
            <Text style={styles.signatureDateLabel}>Date: ________________</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Authorized Representative</Text>
            <Text style={styles.signatureDateLabel}>Date: ________________</Text>
          </View>
        </View>

        {/* ── FOOTER ─────────────────────────────────────────────────────── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Thank you for choosing {data.companyName}  ·  {data.companyPhone}  ·  {data.companyEmail}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

// =============================================================================
// GENERATE BLOB (client-side)
// =============================================================================

export async function generateQuotePDF(data: QuotePDFData): Promise<Blob> {
  const document = <QuotePDFDocument data={data} />;
  const blob = await pdf(document).toBlob();
  return blob;
}

// =============================================================================
// DOWNLOAD HELPER
// =============================================================================

export async function downloadQuotePDF(data: QuotePDFData): Promise<void> {
  const blob = await generateQuotePDF(data);
  const url = URL.createObjectURL(blob);
  const a = window.document.createElement('a');
  a.href = url;
  a.download = `Quote-${data.quoteNumber}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
