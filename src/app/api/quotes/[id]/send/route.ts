// =============================================================================
// POST /api/quotes/[id]/send — Send quote to customer via email
// =============================================================================

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';

const SendQuoteSchema = z.object({
  custom_message: z.string().max(2000).optional(),
  reply_to: z.string().email().optional(),
  cc: z.array(z.string().email()).max(5).optional(),
});

// -----------------------------------------------------------------------------
// Email sending stub — ready for SendGrid / Resend integration
// -----------------------------------------------------------------------------

interface SendEmailOptions {
  to: string;
  toName: string;
  from: string;
  fromName: string;
  replyTo?: string;
  cc?: string[];
  subject: string;
  html: string;
  text: string;
}

async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string }> {
  // -------------------------------------------------------------------------
  // INTEGRATION POINT: Replace this block with SendGrid or Resend
  //
  // SendGrid example:
  //   const sgMail = require('@sendgrid/mail');
  //   sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
  //   const result = await sgMail.send({ to, from, subject, html, text });
  //   return { success: true, messageId: result[0].headers['x-message-id'] };
  //
  // Resend example:
  //   const resend = new Resend(process.env.RESEND_API_KEY!);
  //   const { id } = await resend.emails.send({ from, to, subject, html });
  //   return { success: true, messageId: id };
  // -------------------------------------------------------------------------

  console.log('[email/send] Would send email:', {
    to: options.to,
    toName: options.toName,
    from: options.from,
    fromName: options.fromName,
    replyTo: options.replyTo,
    cc: options.cc,
    subject: options.subject,
    previewText: options.text.slice(0, 100),
  });

  // Simulate success
  return { success: true, messageId: `stub-${Date.now()}` };
}

// -----------------------------------------------------------------------------
// Build email HTML
// -----------------------------------------------------------------------------

function buildQuoteEmailHtml(quote: Record<string, unknown>, settings: Record<string, unknown>, customMessage?: string): string {
  const customer = quote.customers as Record<string, string> | null;
  const companyName = (settings.company_name as string) ?? 'Haulr Junk Removal';
  const companyPhone = (settings.phone as string) ?? '';
  const companyEmail = (settings.email as string) ?? '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Your Junk Removal Quote - ${quote.quote_number}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; }
    .header { background: #1e40af; color: white; padding: 32px 40px; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .header p { margin: 8px 0 0; opacity: 0.85; }
    .body { padding: 40px; }
    .greeting { font-size: 18px; color: #1e293b; margin-bottom: 16px; }
    .message-box { background: #f1f5f9; border-left: 4px solid #1e40af; padding: 16px 20px; border-radius: 4px; margin-bottom: 24px; }
    .quote-box { border: 2px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 32px; }
    .quote-header { background: #f8fafc; padding: 20px 24px; border-bottom: 1px solid #e2e8f0; }
    .quote-number { font-size: 20px; font-weight: 700; color: #1e293b; }
    .quote-meta { color: #64748b; font-size: 14px; margin-top: 4px; }
    .total-box { background: #1e40af; color: white; padding: 20px 24px; text-align: center; }
    .total-label { font-size: 14px; opacity: 0.85; text-transform: uppercase; letter-spacing: 0.05em; }
    .total-amount { font-size: 36px; font-weight: 800; margin-top: 4px; }
    .cta-btn { display: block; width: fit-content; margin: 32px auto; background: #1e40af; color: white; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; }
    .footer { background: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { margin: 4px 0; color: #64748b; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${companyName}</h1>
      <p>Junk Removal &amp; Hauling Services</p>
    </div>
    <div class="body">
      <p class="greeting">Hi ${customer?.name?.split(' ')[0] ?? 'there'},</p>
      <p>Thank you for contacting ${companyName}! Your free estimate is ready for review.</p>
      ${customMessage ? `<div class="message-box">${customMessage.replace(/\n/g, '<br>')}</div>` : ''}
      <div class="quote-box">
        <div class="quote-header">
          <div class="quote-number">Quote #${quote.quote_number}</div>
          <div class="quote-meta">
            Valid until ${quote.expiry_date ? new Date(quote.expiry_date as string).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '30 days from today'}
          </div>
        </div>
        <div class="total-box">
          <div class="total-label">Estimated Total</div>
          <div class="total-amount">$${Number(quote.total ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
      </div>
      <p style="color: #64748b; font-size: 14px;">Questions? Call us at <strong>${companyPhone}</strong> or reply to this email — we typically respond within 2 hours.</p>
    </div>
    <div class="footer">
      <p><strong>${companyName}</strong></p>
      <p>${companyPhone} &bull; ${companyEmail}</p>
      <p style="margin-top: 12px; font-size: 11px;">You received this because a quote was created for your contact information. If this was in error, please disregard.</p>
    </div>
  </div>
</body>
</html>`;
}

// -----------------------------------------------------------------------------
// POST handler
// -----------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const { id } = await params;

    let body: unknown = {};
    try {
      const text = await request.text();
      if (text) body = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: { message: 'Invalid JSON body' } }, { status: 400 });
    }

    const parsed = SendQuoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: 'Validation failed', details: parsed.error.flatten().fieldErrors } },
        { status: 422 }
      );
    }

    const supabase = await createAdminClient();

    // Load quote with customer info
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select(`*, customers(id, name, email, phone)`)
      .eq('id', id)
      .eq('clerk_user_id', userId)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json(
        { error: { message: 'Quote not found', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    const customer = quote.customers as Record<string, string> | null;
    if (!customer?.email) {
      return NextResponse.json(
        { error: { message: 'Customer has no email address on file', code: 'NO_CUSTOMER_EMAIL' } },
        { status: 422 }
      );
    }

    // Load business settings
    const { data: settings } = await supabase
      .from('business_settings')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();

    const companyName = settings?.company_name ?? 'Haulr Junk Removal';
    const companyEmail = settings?.email ?? 'noreply@haulr.com';

    // Build and send email
    const html = buildQuoteEmailHtml(
      quote as Record<string, unknown>,
      (settings ?? {}) as Record<string, unknown>,
      parsed.data.custom_message
    );

    const emailResult = await sendEmail({
      to: customer.email,
      toName: customer.name,
      from: companyEmail,
      fromName: companyName,
      replyTo: parsed.data.reply_to ?? companyEmail,
      cc: parsed.data.cc,
      subject: `Your Junk Removal Quote #${quote.quote_number} — ${companyName}`,
      html,
      text: `Hi ${customer.name?.split(' ')[0] ?? 'there'},\n\nYour quote #${quote.quote_number} from ${companyName} is ready.\n\nTotal: $${Number(quote.total ?? 0).toFixed(2)}\n\nQuestions? Call ${settings?.phone ?? ''} or reply to this email.\n\n${companyName}`,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: { message: 'Failed to send email. Please try again.', code: 'EMAIL_SEND_FAILED' } },
        { status: 502 }
      );
    }

    // Update quote status
    const { data: updatedQuote, error: updateError } = await supabase
      .from('quotes')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('clerk_user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('[quotes/send] Failed to update status:', updateError.message);
    }

    // Create notification record
    void Promise.resolve(
      supabase.from('notifications').insert({
        clerk_user_id: userId,
        type: 'quote_sent',
        title: 'Quote sent',
        message: `Quote #${quote.quote_number} was sent to ${customer.name} (${customer.email})`,
        reference_id: id,
        reference_type: 'quote',
        read: false,
      })
    ).catch(() => {}); // fire-and-forget

    return NextResponse.json({
      data: {
        quote: updatedQuote ?? quote,
        email_sent: true,
        message_id: emailResult.messageId,
        sent_to: customer.email,
      },
      error: null,
    });
  } catch (err) {
    console.error('[quotes/send] Unhandled:', err);
    return NextResponse.json({ error: { message: 'Internal server error' } }, { status: 500 });
  }
}
