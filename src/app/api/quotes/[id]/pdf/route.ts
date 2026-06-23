// =============================================================================
// GET /api/quotes/[id]/pdf — Generate and stream PDF of quote
// =============================================================================

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib';

// -----------------------------------------------------------------------------
// Color helpers (pdf-lib uses 0–1 RGB)
// -----------------------------------------------------------------------------

const COLOR = {
  brand: rgb(0.118, 0.251, 0.686),        // #1e40af
  brandLight: rgb(0.937, 0.945, 0.98),    // #eef0fa
  dark: rgb(0.118, 0.176, 0.235),         // #1e2d3c
  gray: rgb(0.388, 0.455, 0.525),         // #637585
  lightGray: rgb(0.878, 0.91, 0.937),     // #e0e8ef
  white: rgb(1, 1, 1),
  green: rgb(0.133, 0.545, 0.133),
  red: rgb(0.8, 0.1, 0.1),
};

// -----------------------------------------------------------------------------
// PDF generation
// -----------------------------------------------------------------------------

async function generateQuotePDF(
  quote: Record<string, unknown>,
  customer: Record<string, string>,
  settings: Record<string, unknown>,
  photos: { public_url: string }[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const page = pdfDoc.addPage(PageSizes.Letter);
  const { width, height } = page.getSize();
  const margin = 48;
  let y = height - margin;

  const companyName = (settings.company_name as string) ?? 'Haulr Junk Removal';
  const companyPhone = (settings.phone as string) ?? '';
  const companyEmail = (settings.email as string) ?? '';
  const companyAddress = [settings.address, settings.city, settings.state, settings.zip]
    .filter(Boolean)
    .join(', ');

  // ---- HEADER BAND ----
  page.drawRectangle({ x: 0, y: height - 90, width, height: 90, color: COLOR.brand });

  page.drawText(companyName, {
    x: margin,
    y: height - 44,
    size: 22,
    font: helveticaBold,
    color: COLOR.white,
  });

  page.drawText('Junk Removal Estimate', {
    x: margin,
    y: height - 64,
    size: 12,
    font: helvetica,
    color: rgb(0.8, 0.87, 1),
  });

  // Quote number (right-aligned)
  const qnLabel = `QUOTE #${quote.quote_number}`;
  const qnWidth = helveticaBold.widthOfTextAtSize(qnLabel, 13);
  page.drawText(qnLabel, {
    x: width - margin - qnWidth,
    y: height - 44,
    size: 13,
    font: helveticaBold,
    color: COLOR.white,
  });

  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const dateWidth = helvetica.widthOfTextAtSize(dateStr, 10);
  page.drawText(dateStr, {
    x: width - margin - dateWidth,
    y: height - 62,
    size: 10,
    font: helvetica,
    color: rgb(0.8, 0.87, 1),
  });

  y = height - 110;

  // ---- COMPANY / CUSTOMER INFO ----
  const colW = (width - margin * 2) / 2;

  // Company info (left)
  page.drawText('From', { x: margin, y, size: 9, font: helveticaBold, color: COLOR.gray });
  y -= 14;
  page.drawText(companyName, { x: margin, y, size: 11, font: helveticaBold, color: COLOR.dark });
  y -= 14;
  if (companyAddress) {
    page.drawText(companyAddress, { x: margin, y, size: 9, font: helvetica, color: COLOR.gray });
    y -= 12;
  }
  if (companyPhone) {
    page.drawText(companyPhone, { x: margin, y, size: 9, font: helvetica, color: COLOR.gray });
    y -= 12;
  }
  if (companyEmail) {
    page.drawText(companyEmail, { x: margin, y, size: 9, font: helvetica, color: COLOR.gray });
  }

  // Customer info (right)
  let cy = height - 110;
  const cx = margin + colW + 20;
  page.drawText('Bill To', { x: cx, y: cy, size: 9, font: helveticaBold, color: COLOR.gray });
  cy -= 14;
  page.drawText(customer.name ?? '', { x: cx, y: cy, size: 11, font: helveticaBold, color: COLOR.dark });
  cy -= 14;

  const customerAddr = [customer.address, customer.city, customer.state, customer.zip]
    .filter(Boolean)
    .join(', ');
  if (customerAddr) {
    page.drawText(customerAddr, { x: cx, y: cy, size: 9, font: helvetica, color: COLOR.gray });
    cy -= 12;
  }
  if (customer.phone) {
    page.drawText(customer.phone, { x: cx, y: cy, size: 9, font: helvetica, color: COLOR.gray });
    cy -= 12;
  }
  if (customer.email) {
    page.drawText(customer.email, { x: cx, y: cy, size: 9, font: helvetica, color: COLOR.gray });
  }

  y -= 40;

  // ---- DIVIDER ----
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: COLOR.lightGray });
  y -= 20;

  // ---- LINE ITEMS TABLE ----
  const tableX = margin;
  const tableW = width - margin * 2;
  const colDescW = tableW * 0.55;
  const colQtyW = tableW * 0.1;
  const colUnitW = tableW * 0.175;
  const colTotalW = tableW * 0.175;

  // Table header
  page.drawRectangle({ x: tableX, y: y - 4, width: tableW, height: 20, color: COLOR.brandLight });
  page.drawText('Description', { x: tableX + 8, y: y + 2, size: 9, font: helveticaBold, color: COLOR.brand });
  page.drawText('Qty', { x: tableX + colDescW + 4, y: y + 2, size: 9, font: helveticaBold, color: COLOR.brand });
  page.drawText('Unit Price', { x: tableX + colDescW + colQtyW + 4, y: y + 2, size: 9, font: helveticaBold, color: COLOR.brand });
  page.drawText('Total', { x: tableX + colDescW + colQtyW + colUnitW + 4, y: y + 2, size: 9, font: helveticaBold, color: COLOR.brand });
  y -= 24;

  // Line items
  const lineItems = (quote.custom_fees as unknown[]) ?? [];
  const allLineItems: Array<{ description: string; quantity: number; unit_price: number; total: number }> = [];

  // Collect structured line items from quote fields
  const addIfNonZero = (desc: string, amount: number) => {
    if (amount && amount !== 0) {
      allLineItems.push({ description: desc, quantity: 1, unit_price: amount, total: amount });
    }
  };

  addIfNonZero('Load / Haul Charge', quote.load_charge as number);
  addIfNonZero('Base Service Charge', quote.base_charge as number);
  addIfNonZero('Distance Fee', quote.distance_charge as number);
  addIfNonZero('Labor', quote.labor_charge as number);
  addIfNonZero('Heavy Item Fees', quote.heavy_item_fees as number);
  addIfNonZero('Stair Fees', quote.stair_fees as number);
  addIfNonZero('Specialty / Hazmat Fees', quote.specialty_fees as number);
  addIfNonZero('Construction & Debris Fees', quote.construction_fees as number);

  // Custom line items
  for (const li of lineItems) {
    const item = li as { description: string; quantity: number; unit_price: number; total: number };
    allLineItems.push(item);
  }

  // Discounts
  const discounts = (quote.discounts as Array<{ description: string; quantity: number; unit_price: number; total: number }>) ?? [];
  for (const d of discounts) {
    allLineItems.push(d);
  }

  for (let i = 0; i < allLineItems.length; i++) {
    const item = allLineItems[i];
    const rowBg = i % 2 === 0 ? COLOR.white : rgb(0.97, 0.98, 1);
    page.drawRectangle({ x: tableX, y: y - 4, width: tableW, height: 18, color: rowBg });

    const isDiscount = item.total < 0;
    const textColor = isDiscount ? COLOR.green : COLOR.dark;

    page.drawText(item.description?.slice(0, 60) ?? '', {
      x: tableX + 8, y: y + 2, size: 9, font: helvetica, color: textColor,
    });
    page.drawText(String(item.quantity ?? 1), {
      x: tableX + colDescW + 4, y: y + 2, size: 9, font: helvetica, color: textColor,
    });

    const unitStr = `$${Math.abs(Number(item.unit_price ?? 0)).toFixed(2)}${isDiscount ? ' OFF' : ''}`;
    page.drawText(unitStr, {
      x: tableX + colDescW + colQtyW + 4, y: y + 2, size: 9, font: helvetica, color: textColor,
    });

    const totalStr = `${isDiscount ? '-' : ''}$${Math.abs(Number(item.total ?? 0)).toFixed(2)}`;
    const totalStrWidth = helvetica.widthOfTextAtSize(totalStr, 9);
    page.drawText(totalStr, {
      x: tableX + colDescW + colQtyW + colUnitW + colTotalW - totalStrWidth - 4,
      y: y + 2, size: 9, font: helvetica, color: textColor,
    });

    y -= 18;
    if (y < 120) {
      // Simple overflow guard — add new page
      const newPage = pdfDoc.addPage(PageSizes.Letter);
      y = newPage.getSize().height - margin;
    }
  }

  // ---- TOTALS ----
  y -= 8;
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: COLOR.lightGray });
  y -= 16;

  const totalsX = width - margin - 200;

  const drawTotalRow = (label: string, value: string, bold = false) => {
    const font = bold ? helveticaBold : helvetica;
    page.drawText(label, { x: totalsX, y, size: 10, font, color: COLOR.dark });
    const vw = font.widthOfTextAtSize(value, 10);
    page.drawText(value, { x: width - margin - vw, y, size: 10, font, color: COLOR.dark });
    y -= 16;
  };

  drawTotalRow('Subtotal', `$${Number(quote.subtotal ?? 0).toFixed(2)}`);
  const taxRate = Number(quote.tax_rate ?? 0);
  if (taxRate > 0) {
    drawTotalRow(`Tax (${(taxRate * 100).toFixed(2)}%)`, `$${Number(quote.tax_amount ?? 0).toFixed(2)}`);
  }

  // Total box
  y -= 4;
  page.drawRectangle({ x: totalsX - 8, y: y - 6, width: width - margin - totalsX + 8, height: 28, color: COLOR.brand });
  page.drawText('TOTAL', { x: totalsX, y: y + 6, size: 12, font: helveticaBold, color: COLOR.white });
  const totalStr = `$${Number(quote.total ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const totalWidth = helveticaBold.widthOfTextAtSize(totalStr, 13);
  page.drawText(totalStr, { x: width - margin - totalWidth, y: y + 5, size: 13, font: helveticaBold, color: COLOR.white });

  y -= 40;

  // ---- NOTES ----
  if (quote.notes) {
    page.drawText('Notes', { x: margin, y, size: 10, font: helveticaBold, color: COLOR.dark });
    y -= 14;
    const noteLines = String(quote.notes).match(/.{1,90}/g) ?? [];
    for (const line of noteLines.slice(0, 6)) {
      page.drawText(line, { x: margin, y, size: 9, font: helvetica, color: COLOR.gray });
      y -= 12;
    }
    y -= 4;
  }

  // ---- TERMS ----
  if (quote.terms) {
    page.drawText('Terms & Conditions', { x: margin, y, size: 10, font: helveticaBold, color: COLOR.dark });
    y -= 14;
    const termLines = String(quote.terms).match(/.{1,90}/g) ?? [];
    for (const line of termLines.slice(0, 8)) {
      page.drawText(line, { x: margin, y, size: 8, font: helvetica, color: COLOR.gray });
      y -= 11;
    }
  }

  // ---- FOOTER ----
  const footerY = 30;
  page.drawLine({ start: { x: margin, y: footerY + 14 }, end: { x: width - margin, y: footerY + 14 }, thickness: 0.3, color: COLOR.lightGray });
  const footerText = `${companyName} • ${companyPhone} • ${companyEmail} | Quote valid until ${quote.expiry_date ? new Date(quote.expiry_date as string).toLocaleDateString() : '30 days'}`;
  page.drawText(footerText, { x: margin, y: footerY, size: 8, font: helvetica, color: COLOR.gray });

  // Embed photos if any (first 4)
  if (photos.length > 0) {
    const photoPage = pdfDoc.addPage(PageSizes.Letter);
    const pw = photoPage.getSize().width;
    const ph = photoPage.getSize().height;
    photoPage.drawText('Job Photos', { x: margin, y: ph - margin, size: 16, font: helveticaBold, color: COLOR.dark });

    const photoW = (pw - margin * 2 - 12) / 2;
    const photoH = photoW * 0.7;
    const positions = [
      { x: margin, y: ph - margin - 28 - photoH },
      { x: margin + photoW + 12, y: ph - margin - 28 - photoH },
      { x: margin, y: ph - margin - 28 - photoH * 2 - 16 },
      { x: margin + photoW + 12, y: ph - margin - 28 - photoH * 2 - 16 },
    ];

    for (let i = 0; i < Math.min(photos.length, 4); i++) {
      try {
        const res = await fetch(photos[i].public_url);
        if (!res.ok) continue;
        const buf = await res.arrayBuffer();
        const contentType = res.headers.get('content-type') ?? '';
        let img;
        if (contentType.includes('jpeg') || contentType.includes('jpg')) {
          img = await pdfDoc.embedJpg(buf);
        } else if (contentType.includes('png')) {
          img = await pdfDoc.embedPng(buf);
        } else {
          continue; // Skip unsupported types
        }
        const pos = positions[i];
        photoPage.drawImage(img, { x: pos.x, y: pos.y, width: photoW, height: photoH });
      } catch {
        // Skip failed photo embeds silently
      }
    }
  }

  return pdfDoc.save();
}

// -----------------------------------------------------------------------------
// GET handler
// -----------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient();

    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select(`*, customers(*)`)
      .eq('id', id)
      .eq('clerk_user_id', userId)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json(
        { error: { message: 'Quote not found', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    const { data: settings } = await supabase
      .from('business_settings')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();

    const { data: photos } = await supabase
      .from('photo_uploads')
      .select('public_url')
      .eq('quote_id', id)
      .order('created_at', { ascending: true })
      .limit(8);

    const customer = (quote.customers ?? {}) as Record<string, string>;

    const pdfBytes = await generateQuotePDF(
      quote as Record<string, unknown>,
      customer,
      (settings ?? {}) as Record<string, unknown>,
      photos ?? []
    );

    const filename = `quote-${quote.quote_number ?? id}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBytes.byteLength),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[quotes/pdf] Unhandled:', err);
    return NextResponse.json({ error: { message: 'Failed to generate PDF' } }, { status: 500 });
  }
}
