// =============================================================================
// HAULR AI ESTIMATOR — QUOTE VALIDATION SCHEMAS
// Zod schemas for all quote-related forms and API payloads
// =============================================================================

import { z } from 'zod';

// =============================================================================
// SHARED / PRIMITIVE SCHEMAS
// =============================================================================

const moneySchema = z
  .number({ invalid_type_error: 'Must be a number' })
  .nonnegative('Amount cannot be negative')
  .multipleOf(0.01, 'Amount must have at most 2 decimal places');

const percentSchema = z
  .number()
  .min(0, 'Percentage must be at least 0')
  .max(100, 'Percentage cannot exceed 100');

const uuidSchema = z.string().uuid('Invalid ID format');

// =============================================================================
// LINE ITEM SCHEMA
// =============================================================================

export const lineItemSchema = z.object({
  id: z.string().min(1, 'Line item ID is required'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(255, 'Description must be 255 characters or less'),
  quantity: z
    .number({ invalid_type_error: 'Quantity must be a number' })
    .int('Quantity must be a whole number')
    .positive('Quantity must be greater than 0'),
  unit_price: moneySchema,
  total: moneySchema,
  category: z.enum(['load', 'labor', 'specialty', 'discount', 'other'], {
    errorMap: () => ({ message: 'Invalid line item category' }),
  }),
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
});

export type LineItemInput = z.infer<typeof lineItemSchema>;

// =============================================================================
// CUSTOMER INFO SCHEMA (embedded in quote)
// =============================================================================

export const customerInfoSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be 100 characters or less')
    .trim(),
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(255, 'Email must be 255 characters or less')
    .toLowerCase()
    .trim()
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .min(7, 'Phone number is too short')
    .max(20, 'Phone number is too long')
    .regex(
      /^[\d\s\-\+\(\)\.]+$/,
      'Phone number can only contain digits, spaces, dashes, and parentheses'
    )
    .trim()
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .max(500, 'Address must be 500 characters or less')
    .trim()
    .optional()
    .or(z.literal('')),
})
  .refine(
    (data) => (data.email && data.email.length > 0) || (data.phone && data.phone.length > 0),
    {
      message: 'Please provide at least an email or phone number',
      path: ['email'],
    }
  );

export type CustomerInfoInput = z.infer<typeof customerInfoSchema>;

// =============================================================================
// CREATE QUOTE SCHEMA
// =============================================================================

export const createQuoteSchema = z.object({
  // Customer reference
  customerId: uuidSchema.optional(),
  customerInfo: customerInfoSchema.optional(),

  // Job details
  jobAddress: z
    .string()
    .min(5, 'Job address must be at least 5 characters')
    .max(500, 'Job address must be 500 characters or less')
    .trim(),
  jobDescription: z
    .string()
    .max(2000, 'Job description must be 2000 characters or less')
    .optional()
    .or(z.literal('')),

  // Photo references
  photoUrls: z
    .array(z.string().url('Invalid photo URL'))
    .min(1, 'At least one photo is required')
    .max(20, 'Maximum 20 photos allowed'),

  // Line items
  lineItems: z
    .array(lineItemSchema)
    .min(1, 'At least one line item is required')
    .max(50, 'Maximum 50 line items allowed'),

  // Pricing
  subtotal: moneySchema,
  discountAmount: moneySchema.optional().default(0),
  discountPercent: percentSchema.optional().default(0),
  taxRate: percentSchema.optional().default(0),
  taxAmount: moneySchema.optional().default(0),
  totalAmount: moneySchema,

  // AI estimate data
  aiCubicYards: z.number().nonnegative().optional(),
  aiTruckPercentage: z.number().min(0).max(100).optional(),
  aiConfidenceScore: z.number().min(0).max(1).optional(),
  aiLaborHours: z.number().nonnegative().optional(),
  aiAnalysisNotes: z.string().max(2000).optional(),

  // Quote settings
  validDays: z
    .number()
    .int()
    .min(1, 'Quote must be valid for at least 1 day')
    .max(365, 'Quote validity cannot exceed 365 days')
    .default(30),
  notes: z
    .string()
    .max(2000, 'Notes must be 2000 characters or less')
    .optional()
    .or(z.literal('')),
  internalNotes: z
    .string()
    .max(2000, 'Internal notes must be 2000 characters or less')
    .optional()
    .or(z.literal('')),
  requiresDeposit: z.boolean().default(false),
  depositPercent: percentSchema.optional().default(0),
  depositAmount: moneySchema.optional().default(0),
})
  .refine(
    (data) => data.customerId !== undefined || data.customerInfo !== undefined,
    {
      message: 'Either a customer ID or customer info is required',
      path: ['customerId'],
    }
  )
  .refine(
    (data) => {
      // Validate total is approximately correct
      const expectedTotal =
        data.subtotal -
        (data.discountAmount ?? 0) +
        (data.taxAmount ?? 0);
      return Math.abs(data.totalAmount - expectedTotal) < 1; // allow $1 rounding diff
    },
    {
      message: 'Total amount does not match subtotal minus discounts plus tax',
      path: ['totalAmount'],
    }
  );

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;

// =============================================================================
// UPDATE QUOTE SCHEMA
// =============================================================================

export const updateQuoteSchema = z.object({
  // All fields are optional for patch-style updates
  jobAddress: z
    .string()
    .min(5)
    .max(500)
    .trim()
    .optional(),
  jobDescription: z.string().max(2000).optional(),

  lineItems: z
    .array(lineItemSchema)
    .min(1)
    .max(50)
    .optional(),

  subtotal: moneySchema.optional(),
  discountAmount: moneySchema.optional(),
  discountPercent: percentSchema.optional(),
  taxRate: percentSchema.optional(),
  taxAmount: moneySchema.optional(),
  totalAmount: moneySchema.optional(),

  status: z
    .enum(['draft', 'sent', 'viewed', 'accepted', 'declined', 'expired', 'invoiced'], {
      errorMap: () => ({ message: 'Invalid quote status' }),
    })
    .optional(),

  validDays: z.number().int().min(1).max(365).optional(),
  notes: z.string().max(2000).optional(),
  internalNotes: z.string().max(2000).optional(),
  requiresDeposit: z.boolean().optional(),
  depositPercent: percentSchema.optional(),
  depositAmount: moneySchema.optional(),
  sentAt: z.string().datetime().optional(),
  acceptedAt: z.string().datetime().optional(),
  declinedAt: z.string().datetime().optional(),
  declineReason: z.string().max(500).optional(),
});

export type UpdateQuoteInput = z.infer<typeof updateQuoteSchema>;

// =============================================================================
// SEND QUOTE SCHEMA
// =============================================================================

export const sendQuoteSchema = z.object({
  quoteId: uuidSchema,
  sendVia: z
    .array(z.enum(['email', 'sms']))
    .min(1, 'Select at least one delivery method'),
  emailTo: z
    .string()
    .email('Invalid email address')
    .optional(),
  phoneTo: z
    .string()
    .regex(/^[\d\s\-\+\(\)\.]+$/, 'Invalid phone number')
    .optional(),
  message: z
    .string()
    .max(1000, 'Message must be 1000 characters or less')
    .optional(),
});

export type SendQuoteInput = z.infer<typeof sendQuoteSchema>;

// =============================================================================
// ACCEPT / DECLINE QUOTE SCHEMA (customer-facing)
// =============================================================================

export const acceptQuoteSchema = z.object({
  quoteId: uuidSchema,
  token: z.string().min(1, 'Token is required'),
  customerSignature: z.string().optional(), // Base64 signature image
  depositPaymentIntentId: z.string().optional(),
});

export type AcceptQuoteInput = z.infer<typeof acceptQuoteSchema>;

export const declineQuoteSchema = z.object({
  quoteId: uuidSchema,
  token: z.string().min(1, 'Token is required'),
  reason: z
    .string()
    .max(500, 'Reason must be 500 characters or less')
    .optional(),
});

export type DeclineQuoteInput = z.infer<typeof declineQuoteSchema>;
