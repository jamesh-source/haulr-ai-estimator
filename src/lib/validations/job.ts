// =============================================================================
// HAULR AI ESTIMATOR — JOB VALIDATION SCHEMAS
// =============================================================================

import { z } from 'zod';

// =============================================================================
// SHARED
// =============================================================================

const uuidSchema = z.string().uuid('Invalid ID format');

const moneySchema = z
  .number({ invalid_type_error: 'Must be a number' })
  .nonnegative('Amount cannot be negative')
  .multipleOf(0.01);

const dateTimeSchema = z
  .string()
  .datetime({ message: 'Must be a valid ISO 8601 datetime' });

// =============================================================================
// SCHEDULE SLOT SCHEMA
// =============================================================================

export const scheduleSlotSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must be in HH:MM format'),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'End time must be in HH:MM format'),
  duration: z
    .number()
    .int()
    .min(15, 'Duration must be at least 15 minutes')
    .max(480, 'Duration cannot exceed 8 hours'),
}).refine(
  (data) => data.startTime < data.endTime,
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
);

export type ScheduleSlotInput = z.infer<typeof scheduleSlotSchema>;

// =============================================================================
// CREATE JOB SCHEMA
// =============================================================================

export const createJobSchema = z.object({
  // References
  quoteId: uuidSchema.optional(),
  customerId: uuidSchema,

  // Job details
  title: z
    .string()
    .min(3, 'Job title must be at least 3 characters')
    .max(200, 'Job title must be 200 characters or less')
    .trim(),
  description: z
    .string()
    .max(2000, 'Description must be 2000 characters or less')
    .optional()
    .or(z.literal('')),

  // Address
  serviceAddress: z
    .string()
    .min(5, 'Service address must be at least 5 characters')
    .max(500)
    .trim(),
  serviceCity: z.string().max(100).trim().optional().or(z.literal('')),
  serviceState: z.string().length(2).toUpperCase().optional().or(z.literal('')),
  serviceZip: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code')
    .optional()
    .or(z.literal('')),
  serviceLatLng: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),

  // Schedule
  scheduledSlot: scheduleSlotSchema.optional(),

  // Crew
  crewSize: z
    .number()
    .int()
    .min(1, 'At least 1 crew member required')
    .max(10, 'Maximum crew size is 10')
    .default(2),
  truckCount: z
    .number()
    .int()
    .min(1)
    .max(5, 'Maximum 5 trucks per job')
    .default(1),

  // Financials
  estimatedAmount: moneySchema.optional(),
  finalAmount: moneySchema.optional(),

  // Priority
  priority: z
    .enum(['low', 'normal', 'high', 'urgent'], {
      errorMap: () => ({ message: 'Invalid priority level' }),
    })
    .default('normal'),

  // Internal notes
  internalNotes: z
    .string()
    .max(2000)
    .optional()
    .or(z.literal('')),

  tags: z.array(z.string().max(50)).max(20).default([]),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;

// =============================================================================
// UPDATE JOB SCHEMA
// =============================================================================

export const updateJobSchema = z.object({
  title: z.string().min(3).max(200).trim().optional(),
  description: z.string().max(2000).optional().or(z.literal('')),

  serviceAddress: z.string().min(5).max(500).trim().optional(),
  serviceCity: z.string().max(100).trim().optional().or(z.literal('')),
  serviceState: z.string().length(2).toUpperCase().optional().or(z.literal('')),
  serviceZip: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/)
    .optional()
    .or(z.literal('')),
  serviceLatLng: z
    .object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) })
    .optional(),

  status: z
    .enum([
      'scheduled',
      'en_route',
      'in_progress',
      'completed',
      'cancelled',
      'no_show',
      'rescheduled',
    ], {
      errorMap: () => ({ message: 'Invalid job status' }),
    })
    .optional(),

  scheduledSlot: scheduleSlotSchema.optional(),
  crewSize: z.number().int().min(1).max(10).optional(),
  truckCount: z.number().int().min(1).max(5).optional(),

  estimatedAmount: moneySchema.optional(),
  finalAmount: moneySchema.optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  internalNotes: z.string().max(2000).optional().or(z.literal('')),
  tags: z.array(z.string().max(50)).max(20).optional(),

  // Completion data
  startedAt: dateTimeSchema.optional().nullable(),
  completedAt: dateTimeSchema.optional().nullable(),
  cancelledAt: dateTimeSchema.optional().nullable(),
  cancellationReason: z.string().max(500).optional().or(z.literal('')),
});

export type UpdateJobInput = z.infer<typeof updateJobSchema>;

// =============================================================================
// COMPLETE JOB SCHEMA
// =============================================================================

export const completeJobSchema = z.object({
  jobId: uuidSchema,

  // Actual outcomes
  actualCubicYards: z
    .number()
    .nonnegative('Cubic yards cannot be negative')
    .optional(),
  actualLaborHours: z
    .number()
    .nonnegative('Labor hours cannot be negative')
    .max(24, 'Labor hours cannot exceed 24')
    .optional(),
  actualDumpFee: moneySchema.optional(),
  finalAmount: moneySchema,

  // Payment
  paymentMethod: z
    .enum(['cash', 'card', 'check', 'venmo', 'zelle', 'other'])
    .optional(),
  paymentCollected: z.boolean().default(false),
  depositApplied: moneySchema.optional(),

  // Photo documentation
  afterPhotoUrls: z
    .array(z.string().url())
    .max(10, 'Maximum 10 after photos')
    .default([]),

  // Customer feedback
  customerSatisfaction: z
    .number()
    .int()
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5')
    .optional(),
  customerFeedback: z.string().max(1000).optional().or(z.literal('')),

  completionNotes: z.string().max(2000).optional().or(z.literal('')),
  completedAt: dateTimeSchema.default(() => new Date().toISOString()),
});

export type CompleteJobInput = z.infer<typeof completeJobSchema>;

// =============================================================================
// JOB FILTER / SEARCH SCHEMA
// =============================================================================

export const jobSearchSchema = z.object({
  q: z.string().max(100).optional(),
  status: z
    .array(
      z.enum([
        'scheduled',
        'en_route',
        'in_progress',
        'completed',
        'cancelled',
        'no_show',
        'rescheduled',
      ])
    )
    .optional(),
  customerId: uuidSchema.optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  tags: z.array(z.string()).optional(),
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(25),
  sortBy: z
    .enum(['scheduled_date', 'created_at', 'final_amount', 'customer_name'])
    .default('scheduled_date'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type JobSearchInput = z.infer<typeof jobSearchSchema>;

// =============================================================================
// JOB NOTE SCHEMA
// =============================================================================

export const jobNoteSchema = z.object({
  jobId: uuidSchema,
  content: z
    .string()
    .min(1, 'Note content is required')
    .max(2000, 'Note must be 2000 characters or less'),
  type: z
    .enum(['note', 'status_change', 'payment', 'issue', 'other'])
    .default('note'),
  isInternal: z.boolean().default(true),
});

export type JobNoteInput = z.infer<typeof jobNoteSchema>;
