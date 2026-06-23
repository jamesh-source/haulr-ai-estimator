// =============================================================================
// HAULR AI ESTIMATOR — PRICING CALCULATOR
// =============================================================================

import type { LineItem, LoadFraction, PricingConfig } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// -----------------------------------------------------------------------------
// Output types
// -----------------------------------------------------------------------------

export interface QuoteTotals {
  subtotal: number;
  tax_amount: number;
  total: number;
  effective_tax_rate: number;
}

export interface DiscountInput {
  description: string;
  amount: number; // positive dollar amount (will be applied as negative)
  is_percentage?: boolean; // if true, amount is % of subtotal
}

export interface HeavyItemInput {
  item_id: string;
  quantity: number;
  unit_price?: number; // override pricing config price
}

export interface ConstructionItemInput {
  item_id: string;
  quantity: number;
  unit?: string;
  unit_price?: number; // override
}

export interface SpecialtyItemInput {
  item_id: string;
  quantity: number;
  unit_price?: number; // override
}

// -----------------------------------------------------------------------------
// Load charge
// -----------------------------------------------------------------------------

export function calculateLoadCharge(
  fraction: LoadFraction,
  pricingConfig: PricingConfig,
  customCubicYards?: number
): number {
  if (fraction === 'custom' && customCubicYards != null) {
    // Prorate between known fractions
    const pct = (customCubicYards / 15) * 100;
    if (pct <= 14) return pricingConfig.load_prices['1/8'] ?? 99;
    if (pct <= 31) return pricingConfig.load_prices['1/4'] ?? 159;
    if (pct <= 43) return pricingConfig.load_prices['3/8'] ?? 229;
    if (pct <= 56) return pricingConfig.load_prices['1/2'] ?? 299;
    if (pct <= 68) return pricingConfig.load_prices['5/8'] ?? 369;
    if (pct <= 87) return pricingConfig.load_prices['3/4'] ?? 439;
    return pricingConfig.load_prices['full'] ?? 599;
  }

  return pricingConfig.load_prices[fraction] ?? 0;
}

// -----------------------------------------------------------------------------
// Distance charge
// -----------------------------------------------------------------------------

export function calculateDistanceCharge(
  miles: number,
  pricingConfig: PricingConfig
): number {
  const bracket = pricingConfig.distance_brackets.find(
    (b) => miles >= b.min_miles && miles <= b.max_miles
  );
  return bracket?.charge ?? 0;
}

// -----------------------------------------------------------------------------
// Labor charge
// -----------------------------------------------------------------------------

export function calculateLaborCharge(
  workers: number,
  hours: number,
  rate: number,
  difficulty: string
): number {
  // Clamp to reasonable bounds
  const clampedWorkers = Math.max(1, Math.min(workers, 8));
  const clampedHours = Math.max(0, Math.min(hours, 16));
  const baseLabor = clampedWorkers * clampedHours * rate;

  // Apply difficulty multiplier table
  const multipliers: Record<string, number> = {
    standard: 1.0,
    moderate: 1.2,
    difficult: 1.4,
    extreme: 1.7,
  };
  const multiplier = multipliers[difficulty] ?? 1.0;

  return Math.round(baseLabor * multiplier);
}

// -----------------------------------------------------------------------------
// Stair fee
// -----------------------------------------------------------------------------

export function calculateStairFee(
  flights: number,
  pricingConfig: PricingConfig
): number {
  if (flights <= 0) return 0;
  const maxFlights = pricingConfig.stair_fees.max_flights ?? 4;
  const clampedFlights = Math.min(flights, maxFlights);
  return clampedFlights * pricingConfig.stair_fees.per_flight;
}

// -----------------------------------------------------------------------------
// Heavy item fees
// -----------------------------------------------------------------------------

export function calculateHeavyItemFees(
  items: HeavyItemInput[],
  pricingConfig: PricingConfig
): number {
  return items.reduce((total, item) => {
    const price =
      item.unit_price ?? pricingConfig.heavy_item_prices[item.item_id] ?? 0;
    return total + price * item.quantity;
  }, 0);
}

// -----------------------------------------------------------------------------
// Construction / C&D fees
// -----------------------------------------------------------------------------

export function calculateConstructionFees(
  items: ConstructionItemInput[],
  pricingConfig: PricingConfig
): number {
  // Construction items use specialty_fees if keyed the same way, or a passed price
  return items.reduce((total, item) => {
    const price =
      item.unit_price ??
      pricingConfig.specialty_fees[item.item_id] ??
      0;
    return total + price * item.quantity;
  }, 0);
}

// -----------------------------------------------------------------------------
// Specialty item fees (hazmat, disposal items)
// -----------------------------------------------------------------------------

export function calculateSpecialtyFees(
  items: SpecialtyItemInput[],
  pricingConfig: PricingConfig
): number {
  return items.reduce((total, item) => {
    const price =
      item.unit_price ?? pricingConfig.specialty_fees[item.item_id] ?? 0;
    return total + price * item.quantity;
  }, 0);
}

// -----------------------------------------------------------------------------
// Dump cost
// -----------------------------------------------------------------------------

export function calculateDumpCost(
  cubicYards: number,
  pricingConfig: PricingConfig
): number {
  const cost =
    pricingConfig.dump_base_fee + cubicYards * pricingConfig.dump_per_yard;
  return Math.round(cost);
}

// -----------------------------------------------------------------------------
// Build line items array
// -----------------------------------------------------------------------------

export interface BuildLineItemsInput {
  fraction: LoadFraction;
  customCubicYards?: number;
  cubicYards: number;
  distanceMiles?: number;
  workers?: number;
  laborHours?: number;
  difficulty?: string;
  stairFlights?: number;
  heavyItems?: HeavyItemInput[];
  constructionItems?: ConstructionItemInput[];
  specialtyItems?: SpecialtyItemInput[];
  customItems?: Omit<LineItem, 'id'>[];
  discountInputs?: DiscountInput[];
  pricingConfig: PricingConfig;
}

export function buildLineItems(input: BuildLineItemsInput): LineItem[] {
  const lines: LineItem[] = [];

  // 1. Load charge
  const loadCharge = calculateLoadCharge(input.fraction, input.pricingConfig, input.customCubicYards);
  if (loadCharge > 0) {
    lines.push({
      id: uuidv4(),
      description: `${input.fraction === 'custom' ? 'Custom' : input.fraction} Truck Load (${input.cubicYards.toFixed(1)} yds)`,
      quantity: 1,
      unit_price: loadCharge,
      total: loadCharge,
      category: 'load',
    });
  }

  // 2. Distance charge
  if (input.distanceMiles != null && input.distanceMiles > 0) {
    const distanceCharge = calculateDistanceCharge(input.distanceMiles, input.pricingConfig);
    if (distanceCharge > 0) {
      lines.push({
        id: uuidv4(),
        description: `Distance Fee (${input.distanceMiles} miles)`,
        quantity: 1,
        unit_price: distanceCharge,
        total: distanceCharge,
        category: 'distance',
      });
    }
  }

  // 3. Labor charge
  if (input.laborHours != null && input.laborHours > 0) {
    const workers = input.workers ?? 2;
    const rate = input.pricingConfig.labor_rate;
    const difficulty = input.difficulty ?? 'standard';
    const laborCharge = calculateLaborCharge(workers, input.laborHours, rate, difficulty);
    if (laborCharge > 0) {
      lines.push({
        id: uuidv4(),
        description: `Labor (${workers} workers × ${input.laborHours}h @ $${rate}/hr${difficulty !== 'standard' ? `, ${difficulty} access` : ''})`,
        quantity: 1,
        unit_price: laborCharge,
        total: laborCharge,
        category: 'labor',
      });
    }
  }

  // 4. Stair fees
  if (input.stairFlights != null && input.stairFlights > 0) {
    const stairFee = calculateStairFee(input.stairFlights, input.pricingConfig);
    if (stairFee > 0) {
      lines.push({
        id: uuidv4(),
        description: `Stair Carry Fee (${input.stairFlights} flight${input.stairFlights !== 1 ? 's' : ''})`,
        quantity: 1,
        unit_price: stairFee,
        total: stairFee,
        category: 'stair',
      });
    }
  }

  // 5. Heavy item fees
  if (input.heavyItems && input.heavyItems.length > 0) {
    for (const hi of input.heavyItems) {
      const price = hi.unit_price ?? input.pricingConfig.heavy_item_prices[hi.item_id] ?? 0;
      if (price > 0) {
        lines.push({
          id: uuidv4(),
          description: `Heavy Item: ${hi.item_id.replace(/_/g, ' ')}`,
          quantity: hi.quantity,
          unit_price: price,
          total: price * hi.quantity,
          category: 'heavy_item',
        });
      }
    }
  }

  // 6. Construction items
  if (input.constructionItems && input.constructionItems.length > 0) {
    for (const ci of input.constructionItems) {
      const price = ci.unit_price ?? input.pricingConfig.specialty_fees[ci.item_id] ?? 0;
      if (price > 0) {
        lines.push({
          id: uuidv4(),
          description: `C&D: ${ci.item_id.replace(/_/g, ' ')} (${ci.unit ?? 'unit'})`,
          quantity: ci.quantity,
          unit_price: price,
          total: price * ci.quantity,
          category: 'construction',
        });
      }
    }
  }

  // 7. Specialty fees
  if (input.specialtyItems && input.specialtyItems.length > 0) {
    for (const si of input.specialtyItems) {
      const price = si.unit_price ?? input.pricingConfig.specialty_fees[si.item_id] ?? 0;
      if (price > 0) {
        lines.push({
          id: uuidv4(),
          description: `Specialty: ${si.item_id.replace(/_/g, ' ')}`,
          quantity: si.quantity,
          unit_price: price,
          total: price * si.quantity,
          category: 'specialty',
        });
      }
    }
  }

  // 8. Custom line items
  if (input.customItems && input.customItems.length > 0) {
    for (const ci of input.customItems) {
      lines.push({ id: uuidv4(), ...ci });
    }
  }

  // 9. Discounts (applied last, as negative values)
  if (input.discountInputs && input.discountInputs.length > 0) {
    const subtotalBeforeDiscounts = lines.reduce((s, l) => s + l.total, 0);
    for (const disc of input.discountInputs) {
      const discountAmount = disc.is_percentage
        ? Math.round(subtotalBeforeDiscounts * (disc.amount / 100))
        : disc.amount;
      lines.push({
        id: uuidv4(),
        description: disc.description,
        quantity: 1,
        unit_price: -discountAmount,
        total: -discountAmount,
        category: 'discount',
      });
    }
  }

  return lines;
}

// -----------------------------------------------------------------------------
// Calculate totals from line items
// -----------------------------------------------------------------------------

export function calculateTotal(
  lineItems: LineItem[],
  taxRate: number,
  extraDiscounts?: LineItem[]
): QuoteTotals {
  const allItems = extraDiscounts ? [...lineItems, ...extraDiscounts] : lineItems;

  const subtotal = allItems.reduce((sum, item) => sum + item.total, 0);
  const clampedTaxRate = Math.max(0, Math.min(taxRate, 0.25)); // Max 25% tax sanity check
  const tax_amount = Math.round(subtotal * clampedTaxRate * 100) / 100;
  const total = Math.round((subtotal + tax_amount) * 100) / 100;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax_amount,
    total,
    effective_tax_rate: clampedTaxRate,
  };
}

// -----------------------------------------------------------------------------
// Quick-calculate: full estimate from simple inputs
// -----------------------------------------------------------------------------

export interface SimpleEstimateInput {
  fraction: LoadFraction;
  cubicYards: number;
  distanceMiles?: number;
  workers?: number;
  laborHours?: number;
  difficulty?: string;
  stairFlights?: number;
  taxRate?: number;
  pricingConfig: PricingConfig;
}

export function quickEstimate(input: SimpleEstimateInput): {
  lineItems: LineItem[];
  totals: QuoteTotals;
} {
  const lineItems = buildLineItems({ ...input, pricingConfig: input.pricingConfig });
  const totals = calculateTotal(lineItems, input.taxRate ?? 0);
  return { lineItems, totals };
}
