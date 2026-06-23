// =============================================================================
// HAULR AI ESTIMATOR — AI ESTIMATOR SERVICE
// =============================================================================

import OpenAI from 'openai';
import { z } from 'zod';
import type { AIEstimate, LineItem, LoadFraction, PricingConfig } from '@/types';
import {
  PHOTO_ANALYSIS_SYSTEM_PROMPT,
  buildAnalysisPrompt,
  type UserContext,
} from './prompts';
import { v4 as uuidv4 } from 'uuid';

// -----------------------------------------------------------------------------
// OpenAI client (lazy-initialized to avoid build-time errors)
// -----------------------------------------------------------------------------

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

// -----------------------------------------------------------------------------
// Zod schemas for AI response validation
// -----------------------------------------------------------------------------

const DetectedItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().int().positive(),
  volume_cf: z.number().nonnegative(),
  weight_lbs: z.number().nonnegative(),
  category: z.enum(['furniture', 'appliance', 'electronics', 'debris', 'yard', 'metal', 'hazmat', 'other']),
  donation_potential: z.boolean(),
  recycling_potential: z.boolean(),
  hazardous: z.boolean(),
  confidence: z.number().min(0).max(1),
});

const AIResponseSchema = z.object({
  detected_items: z.array(DetectedItemSchema),
  total_cubic_feet: z.number().nonnegative(),
  total_cubic_yards: z.number().nonnegative(),
  truck_percentage: z.number().min(0).max(100),
  estimated_labor_hours: z.number().nonnegative(),
  dump_cost_estimate: z.number().nonnegative(),
  hazard_warnings: z.array(z.string()),
  donation_opportunities: z.array(z.string()),
  recycling_opportunities: z.array(z.string()),
  analysis_notes: z.string(),
  confidence_score: z.number().min(0).max(1),
});

export type AIAnalysisResponse = z.infer<typeof AIResponseSchema>;

// -----------------------------------------------------------------------------
// Quote line items output
// -----------------------------------------------------------------------------

export interface QuoteLineItems {
  load_charge: number;
  labor_charge: number;
  dump_charge: number;
  specialty_fees: number;
  suggested_total: number;
  line_items: LineItem[];
  load_fraction: LoadFraction;
  cubic_yards: number;
  truck_percentage: number;
}

// -----------------------------------------------------------------------------
// Core analysis function
// -----------------------------------------------------------------------------

export async function analyzePhotos(
  imageUrls: string[],
  userContext?: UserContext
): Promise<AIAnalysisResponse> {
  if (!imageUrls || imageUrls.length === 0) {
    throw new Error('At least one image URL is required for analysis');
  }

  const openai = getOpenAI();

  // Build vision message content
  const imageContent: OpenAI.Chat.ChatCompletionContentPart[] = imageUrls.map((url) => ({
    type: 'image_url' as const,
    image_url: {
      url,
      detail: 'high' as const,
    },
  }));

  const userPrompt = buildAnalysisPrompt(userContext);

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: PHOTO_ANALYSIS_SYSTEM_PROMPT,
    },
    {
      role: 'user',
      content: [
        ...imageContent,
        {
          type: 'text',
          text: userPrompt,
        },
      ],
    },
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    max_tokens: 4096,
    temperature: 0.2, // Low temperature for consistent estimates
    response_format: { type: 'json_object' },
  });

  const rawContent = response.choices[0]?.message?.content;
  if (!rawContent) {
    throw new Error('OpenAI returned an empty response');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    throw new Error('OpenAI returned invalid JSON: ' + rawContent.slice(0, 200));
  }

  const validated = AIResponseSchema.safeParse(parsed);
  if (!validated.success) {
    const issues = validated.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`AI response validation failed: ${issues}`);
  }

  // Recalculate derived fields to ensure consistency
  const result = validated.data;
  const totalCF = result.detected_items.reduce(
    (sum, item) => sum + item.volume_cf * item.quantity,
    0
  );
  result.total_cubic_feet = Math.round(totalCF * 10) / 10;
  result.total_cubic_yards = Math.round((totalCF / 27) * 100) / 100;
  result.truck_percentage = Math.min(
    100,
    Math.round((result.total_cubic_yards / 15) * 100)
  );

  return result;
}

// -----------------------------------------------------------------------------
// Price calculation from AI estimate
// -----------------------------------------------------------------------------

export function calculateSuggestedPrice(
  estimate: AIAnalysisResponse,
  pricingConfig: PricingConfig
): number {
  const { load_prices, dump_base_fee, dump_per_yard, labor_rate } = pricingConfig;

  // Determine load fraction from truck percentage
  const fraction = truckPercentageToFraction(estimate.truck_percentage);
  const loadCharge = load_prices[fraction] ?? load_prices['full'] ?? 599;

  // Labor charge (2-person crew)
  const laborCharge = estimate.estimated_labor_hours * labor_rate * 2;

  // Dump cost (use AI estimate if reasonable, else calculate)
  const calculatedDump = dump_base_fee + estimate.total_cubic_yards * dump_per_yard;
  const dumpCharge = Math.max(
    calculatedDump,
    estimate.dump_cost_estimate > 0 ? estimate.dump_cost_estimate : 0
  );

  // Round to nearest dollar
  return Math.round(loadCharge + dumpCharge);
}

// -----------------------------------------------------------------------------
// Convert truck percentage to load fraction
// -----------------------------------------------------------------------------

export function truckPercentageToFraction(pct: number): LoadFraction {
  if (pct <= 14) return '1/8';
  if (pct <= 31) return '1/4';
  if (pct <= 43) return '3/8';
  if (pct <= 56) return '1/2';
  if (pct <= 68) return '5/8';
  if (pct <= 87) return '3/4';
  return 'full';
}

// -----------------------------------------------------------------------------
// Build structured quote line items from AI result
// -----------------------------------------------------------------------------

export function buildEstimateFromAI(
  aiResult: AIAnalysisResponse,
  pricingConfig: PricingConfig
): QuoteLineItems {
  const { load_prices, dump_base_fee, dump_per_yard, labor_rate } = pricingConfig;

  const fraction = truckPercentageToFraction(aiResult.truck_percentage);
  const loadCharge = load_prices[fraction] ?? 299;
  const laborCharge = Math.round(aiResult.estimated_labor_hours * labor_rate * 2);
  const dumpCharge = Math.max(
    dump_base_fee + aiResult.total_cubic_yards * dump_per_yard,
    aiResult.dump_cost_estimate || 0
  );

  // Specialty fees for hazardous items
  let specialtyFees = 0;
  const hazardousItems = aiResult.detected_items.filter((i) => i.hazardous);
  for (const item of hazardousItems) {
    // Default $25/unit for unpriced hazardous items
    specialtyFees += 25 * item.quantity;
  }

  const line_items: LineItem[] = [
    {
      id: uuidv4(),
      description: `${fraction} Truck Load (${aiResult.total_cubic_yards.toFixed(1)} cubic yards)`,
      quantity: 1,
      unit_price: loadCharge,
      total: loadCharge,
      category: 'load',
    },
    {
      id: uuidv4(),
      description: `Labor (${aiResult.estimated_labor_hours.toFixed(1)} hrs × 2-person crew @ $${labor_rate}/hr)`,
      quantity: 1,
      unit_price: laborCharge,
      total: laborCharge,
      category: 'labor',
    },
    {
      id: uuidv4(),
      description: `Disposal / Dump Fee (${aiResult.total_cubic_yards.toFixed(1)} yards)`,
      quantity: 1,
      unit_price: Math.round(dumpCharge),
      total: Math.round(dumpCharge),
      category: 'load',
    },
  ];

  if (specialtyFees > 0) {
    line_items.push({
      id: uuidv4(),
      description: `Hazardous Item Handling (${hazardousItems.length} item type${hazardousItems.length !== 1 ? 's' : ''})`,
      quantity: 1,
      unit_price: specialtyFees,
      total: specialtyFees,
      category: 'specialty',
    });
  }

  const suggestedTotal = loadCharge + laborCharge + Math.round(dumpCharge) + specialtyFees;

  return {
    load_charge: loadCharge,
    labor_charge: laborCharge,
    dump_charge: Math.round(dumpCharge),
    specialty_fees: specialtyFees,
    suggested_total: suggestedTotal,
    line_items,
    load_fraction: fraction,
    cubic_yards: aiResult.total_cubic_yards,
    truck_percentage: aiResult.truck_percentage,
  };
}

// -----------------------------------------------------------------------------
// Convert AIAnalysisResponse to AIEstimate (app type)
// -----------------------------------------------------------------------------

export function toAIEstimate(
  aiResult: AIAnalysisResponse,
  pricingConfig: PricingConfig
): AIEstimate {
  const lineItems = buildEstimateFromAI(aiResult, pricingConfig);
  const suggestedPrice = lineItems.suggested_total;
  const dumpCost = lineItems.dump_charge;
  const profitMargin = suggestedPrice > 0
    ? Math.round(((suggestedPrice - dumpCost) / suggestedPrice) * 100) / 100
    : 0;

  return {
    items_detected: aiResult.detected_items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      estimated_volume_cf: item.volume_cf,
      estimated_weight_lbs: item.weight_lbs,
      category: item.category as AIEstimate['items_detected'][number]['category'],
      donation_potential: item.donation_potential,
      recycling_potential: item.recycling_potential,
      confidence: item.confidence,
    })),
    total_cubic_yards: aiResult.total_cubic_yards,
    truck_percentage: aiResult.truck_percentage,
    trailer_percentage: 0,
    estimated_labor_hours: aiResult.estimated_labor_hours,
    estimated_dump_cost: dumpCost,
    suggested_price: suggestedPrice,
    suggested_profit_margin: profitMargin,
    hazard_warnings: aiResult.hazard_warnings,
    donation_items: aiResult.donation_opportunities,
    recycling_items: aiResult.recycling_opportunities,
    confidence_score: aiResult.confidence_score,
    analysis_notes: aiResult.analysis_notes,
  };
}
