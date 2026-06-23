// =============================================================================
// HAULR AI ESTIMATOR — CUSTOMER VALIDATION SCHEMAS
// =============================================================================

import { z } from 'zod';

// =============================================================================
// SHARED
// =============================================================================

const phoneSchema = z
  .string()
  .regex(
    /^[\d\s\-\+\(\)\.]+$/,
    'Phone number can only contain digits, spaces, dashes, and parentheses'
  )
  .min(7, 'Phone number is too short')
  .max(20, 'Phone number is too long')
  .trim();

const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .max(255, 'Email must be 255 characters or less')
  .toLowerCase()
  .trim();

// =============================================================================
// CREATE CUSTOMER SCHEMA
// =============================================================================

export const createCustomerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be 100 characters or less')
    .trim(),

  email: emailSchema.optional().or(z.literal('')),

  phone: phoneSchema.optional().or(z.literal('')),

  // Service address
  address: z
    .string()
    .max(500, 'Address must be 500 characters or less')
    .trim()
    .optional()
    .or(z.literal('')),
  city: z
    .string()
    .max(100, 'City must be 100 characters or less')
    .trim()
    .optional()
    .or(z.literal('')),
  state: z
    .string()
    .length(2, 'State must be a 2-letter abbreviation')
    .toUpperCase()
    .optional()
    .or(z.literal('')),
  zip: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code')
    .optional()
    .or(z.literal('')),

  // Optional metadata
  source: z
    .enum(['manual', 'website', 'referral', 'google', 'yelp', 'facebook', 'other'], {
      errorMap: () => ({ message: 'Invalid lead source' }),
    })
    .default('manual'),

  tags: z
    .array(z.string().max(50))
    .max(20, 'Maximum 20 tags allowed')
    .default([]),

  notes: z
    .string()
    .max(2000, 'Notes must be 2000 characters or less')
    .optional()
    .or(z.literal('')),

  // Opt-ins
  emailOptIn: z.boolean().default(false),
  smsOptIn: z.boolean().default(false),
})
  .refine(
    (data) =>
      (data.email && data.email.length > 0) ||
      (data.phone && data.phone.length > 0),
    {
      message: 'At least an email or phone number is required',
      path: ['email'],
    }
  );

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

// =============================================================================
// UPDATE CUSTOMER SCHEMA
// =============================================================================

export const updateCustomerSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  email: emailSchema.optional().or(z.literal('')),
  phone: phoneSchema.optional().or(z.literal('')),
  address: z.string().max(500).trim().optional().or(z.literal('')),
  city: z.string().max(100).trim().optional().or(z.literal('')),
  state: z.string().length(2).toUpperCase().optional().or(z.literal('')),
  zip: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/)
    .optional()
    .or(z.literal('')),
  source: z
    .enum(['manual', 'website', 'referral', 'google', 'yelp', 'facebook', 'other'])
    .optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  notes: z.string().max(2000).optional().or(z.literal('')),
  emailOptIn: z.boolean().optional(),
  smsOptIn: z.boolean().optional(),
  archivedAt: z.string().datetime().nullable().optional(),
});

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

// =============================================================================
// CUSTOMER SEARCH / FILTER SCHEMA
// =============================================================================

export const customerSearchSchema = z.object({
  q: z
    .string()
    .max(100, 'Search query must be 100 characters or less')
    .optional(),
  source: z
    .enum(['manual', 'website', 'referral', 'google', 'yelp', 'facebook', 'other'])
    .optional(),
  tags: z.array(z.string()).optional(),
  hasEmail: z.boolean().optional(),
  hasPhone: z.boolean().optional(),
  archived: z.boolean().default(false),
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(25),
  sortBy: z
    .enum(['name', 'created_at', 'last_job_at', 'total_spent'])
    .default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CustomerSearchInput = z.infer<typeof customerSearchSchema>;

// =============================================================================
// CUSTOMER NOTE SCHEMA
// =============================================================================

export const customerNoteSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  content: z
    .string()
    .min(1, 'Note content is required')
    .max(2000, 'Note must be 2000 characters or less'),
  type: z
    .enum(['note', 'call', 'email', 'sms', 'visit', 'other'])
    .default('note'),
});

export type CustomerNoteInput = z.infer<typeof customerNoteSchema>;

// =============================================================================
// MERGE CUSTOMERS SCHEMA
// =============================================================================

export const mergeCustomersSchema = z.object({
  primaryId: z.string().uuid('Invalid primary customer ID'),
  duplicateId: z.string().uuid('Invalid duplicate customer ID'),
  keepFields: z
    .object({
      name: z.enum(['primary', 'duplicate']).default('primary'),
      email: z.enum(['primary', 'duplicate']).default('primary'),
      phone: z.enum(['primary', 'duplicate']).default('primary'),
      address: z.enum(['primary', 'duplicate']).default('primary'),
    })
    .default({}),
}).refine((data) => data.primaryId !== data.duplicateId, {
  message: 'Primary and duplicate customers must be different',
  path: ['duplicateId'],
});

export type MergeCustomersInput = z.infer<typeof mergeCustomersSchema>;
