// =============================================================================
// HAULR AI ESTIMATOR — AI PROMPT TEMPLATES
// =============================================================================

import type { BusinessSettings } from '@/types';

// -----------------------------------------------------------------------------
// System Prompt for Photo Analysis
// -----------------------------------------------------------------------------

export const PHOTO_ANALYSIS_SYSTEM_PROMPT = `You are an expert junk removal estimator AI with 20+ years of field experience. You specialize in:

- Accurately identifying all items visible in photos submitted by customers
- Estimating volume in cubic feet (CF) and total truck space required
- Estimating item weights based on material type and visual size
- Categorizing items: furniture, appliances, electronics, debris, yard waste, metal, hazmat, other
- Flagging hazardous materials that require special handling or disposal
- Identifying donation-worthy items (Goodwill, Habitat ReStores, etc.)
- Identifying recyclable materials (metal, electronics, cardboard, etc.)
- Providing realistic labor estimates based on item count, weight, access difficulty

Standard truck capacity reference: 15 cubic yards (standard 14–17 yd junk removal truck).

Volume estimation guidelines:
- King mattress: ~30 CF | Queen: ~22 CF | Twin: ~15 CF
- Sofa/Sectional: 40–80 CF | Loveseat: 30–50 CF | Chair: 15–25 CF
- Refrigerator: 20–25 CF | Washer: 10–14 CF | Dryer: 10–14 CF
- Dresser (large): 20–30 CF | Dresser (small): 8–15 CF
- Desk: 15–30 CF | Bookshelf (large): 15–25 CF
- TV (55"+): 8–12 CF boxed equivalent | CRT TV: 10–20 CF
- Boxes (moving): 2–4 CF each
- Bags of trash/debris: 2–3 CF each

Labor estimation guidelines:
- Standard 1/4 load: 1–1.5 hours for 2-person crew
- 1/2 load: 1.5–2.5 hours | Full load: 2.5–4 hours
- Add 30–60 min for stairs, narrow hallways, or heavy items
- Hoarding/extreme clutter situations: multiply by 1.5–2x

Weight estimation guidelines:
- Concrete/brick: ~150 lbs/CF | Dirt/gravel: ~100 lbs/CF
- Furniture (wood): ~5–10 lbs/CF | Appliances: ~15–25 lbs/CF
- Electronics: ~10–20 lbs/CF | Mixed debris: ~5–8 lbs/CF

Always err slightly on the conservative/higher side for volume and labor estimates to protect profitability. Be precise and specific — vague estimates are not useful.`;

// -----------------------------------------------------------------------------
// User Prompt Builder for Analysis
// -----------------------------------------------------------------------------

export interface UserContext {
  businessName?: string;
  serviceArea?: string;
  dumpCostPerYard?: number;
  baseLoadPrice?: number;
  laborRate?: number;
  additionalContext?: string;
}

export function buildAnalysisPrompt(userContext?: UserContext): string {
  const contextLines: string[] = [];

  if (userContext?.businessName) {
    contextLines.push(`Business: ${userContext.businessName}`);
  }
  if (userContext?.serviceArea) {
    contextLines.push(`Service area: ${userContext.serviceArea}`);
  }
  if (userContext?.dumpCostPerYard) {
    contextLines.push(`Local dump cost: $${userContext.dumpCostPerYard}/yard`);
  }
  if (userContext?.laborRate) {
    contextLines.push(`Labor rate: $${userContext.laborRate}/man-hour`);
  }
  if (userContext?.additionalContext) {
    contextLines.push(`Additional context: ${userContext.additionalContext}`);
  }

  const contextBlock =
    contextLines.length > 0
      ? `\nBusiness context:\n${contextLines.map((l) => `- ${l}`).join('\n')}\n`
      : '';

  return `Analyze the provided photo(s) of items for junk removal estimation.${contextBlock}

Identify every visible item, estimate dimensions, volume, and weight. Respond ONLY with valid JSON in this exact format — no markdown, no extra text:

{
  "detected_items": [
    {
      "name": "string (specific item name, e.g. 'Queen-size mattress')",
      "quantity": number,
      "volume_cf": number (cubic feet per unit),
      "weight_lbs": number (pounds per unit),
      "category": "furniture|appliance|electronics|debris|yard|metal|hazmat|other",
      "donation_potential": boolean,
      "recycling_potential": boolean,
      "hazardous": boolean,
      "confidence": number (0.0–1.0)
    }
  ],
  "total_cubic_feet": number,
  "total_cubic_yards": number,
  "truck_percentage": number (0–100, based on 15-yard standard truck),
  "estimated_labor_hours": number (for a 2-person crew),
  "dump_cost_estimate": number (dollars, realistic local estimate),
  "hazard_warnings": ["string"],
  "donation_opportunities": ["string"],
  "recycling_opportunities": ["string"],
  "analysis_notes": "string (brief summary of scope, access concerns, special items)",
  "confidence_score": number (0.0–1.0, overall estimate confidence)
}

Rules:
- detected_items must list EVERY distinct visible item type
- volume_cf and weight_lbs are PER UNIT (multiply by quantity for totals)
- total_cubic_feet = sum of (volume_cf × quantity) for all items
- total_cubic_yards = total_cubic_feet / 27
- truck_percentage = (total_cubic_yards / 15) × 100, capped at 100
- estimated_labor_hours is for a standard 2-person crew
- hazard_warnings should include actionable disposal guidance
- confidence_score reflects image quality and item visibility`;
}

// -----------------------------------------------------------------------------
// Estimate Refinement Prompt
// -----------------------------------------------------------------------------

export const ESTIMATE_REFINEMENT_PROMPT = `You are a junk removal estimating assistant. A customer has provided additional context about their job after an initial AI photo analysis. Refine the estimate based on this new information.

Consider:
- Correcting misidentified items
- Adjusting quantities based on customer description
- Adding items mentioned that were not visible in photos
- Adjusting labor estimate for access difficulty described
- Noting any hazardous materials mentioned

Respond with the same JSON format as the initial analysis, with updated values. Include a "refinement_notes" field explaining what changed and why.`;

// -----------------------------------------------------------------------------
// Settings-aware prompt builder
// -----------------------------------------------------------------------------

export function buildAnalysisPromptFromSettings(
  settings: Partial<BusinessSettings>
): string {
  return buildAnalysisPrompt({
    businessName: settings.company_name,
    serviceArea: settings.city && settings.state
      ? `${settings.city}, ${settings.state}`
      : undefined,
    dumpCostPerYard: settings.pricing?.dump_per_yard,
    laborRate: settings.pricing?.labor_rate,
  });
}
