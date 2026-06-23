'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, MapPin, Users, Clock, ArrowUp, Package, Wrench, Zap,
  Percent, Plus, Trash2, Tag, FileText, ChevronDown, ChevronUp,
  TrendingUp, DollarSign, AlertCircle, Loader2,
} from 'lucide-react';
import { cn, formatCurrency, generateQuoteNumber } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadSizeSelector, LOAD_SIZES, type LoadSize } from './LoadSizeSelector';

// =============================================================================
// CONSTANTS / CONFIG
// =============================================================================

const DIFFICULTY_OPTIONS = [
  { id: 'easy', label: 'Easy', multiplier: 1.0, color: 'text-green-600' },
  { id: 'moderate', label: 'Moderate', multiplier: 1.15, color: 'text-yellow-600' },
  { id: 'hard', label: 'Hard', multiplier: 1.3, color: 'text-orange-600' },
  { id: 'extreme', label: 'Extreme', multiplier: 1.5, color: 'text-red-600' },
] as const;

const STAIR_OPTIONS = [
  { id: 'none', label: 'No Stairs', fee: 0 },
  { id: 'one', label: '1 Flight', fee: 50 },
  { id: 'two', label: '2 Flights', fee: 100 },
  { id: 'three_plus', label: '3+ Flights', fee: 175 },
] as const;

const HEAVY_ITEMS = [
  { id: 'piano', label: 'Piano', price: 150 },
  { id: 'safe', label: 'Safe', price: 125 },
  { id: 'gun_safe', label: 'Gun Safe', price: 125 },
  { id: 'hot_tub', label: 'Hot Tub', price: 200 },
  { id: 'pool_table', label: 'Pool Table', price: 175 },
  { id: 'treadmill', label: 'Treadmill', price: 75 },
  { id: 'refrigerator', label: 'Refrigerator', price: 65 },
  { id: 'washer', label: 'Washer', price: 50 },
  { id: 'dryer', label: 'Dryer', price: 50 },
  { id: 'commercial', label: 'Commercial', price: 250 },
] as const;

const DEBRIS_TYPES = [
  { id: 'concrete', label: 'Concrete', unit: 'cubic yards', pricePerUnit: 95 },
  { id: 'brick', label: 'Brick', unit: 'cubic yards', pricePerUnit: 85 },
  { id: 'dirt', label: 'Dirt', unit: 'cubic yards', pricePerUnit: 75 },
  { id: 'tile', label: 'Tile', unit: 'cubic yards', pricePerUnit: 80 },
  { id: 'shingles', label: 'Shingles', unit: 'cubic yards', pricePerUnit: 90 },
  { id: 'drywall', label: 'Drywall', unit: 'cubic yards', pricePerUnit: 70 },
  { id: 'lumber', label: 'Lumber', unit: 'cubic yards', pricePerUnit: 65 },
  { id: 'cabinets', label: 'Cabinets', unit: 'cubic yards', pricePerUnit: 75 },
  { id: 'mixed_demo', label: 'Mixed Demo', unit: 'cubic yards', pricePerUnit: 100 },
] as const;

const SPECIALTY_ITEMS = [
  { id: 'electronics', label: 'Electronics', price: 25 },
  { id: 'tires', label: 'Tires', price: 20 },
  { id: 'paint', label: 'Paint Cans', price: 15 },
  { id: 'chemicals', label: 'Chemicals', price: 35 },
  { id: 'propane', label: 'Propane Tanks', price: 30 },
  { id: 'mattresses', label: 'Mattresses', price: 40 },
  { id: 'box_springs', label: 'Box Springs', price: 35 },
] as const;

const DISCOUNT_TYPES = [
  { id: 'senior', label: 'Senior Discount' },
  { id: 'veteran', label: 'Veteran Discount' },
  { id: 'referral', label: 'Referral Discount' },
  { id: 'coupon', label: 'Coupon Code' },
  { id: 'manual', label: 'Manual Discount' },
] as const;

const DISTANCE_BRACKETS = [
  { max: 10, charge: 0, label: 'Local (0-10 mi)' },
  { max: 20, charge: 25, label: '11-20 miles' },
  { max: 30, charge: 50, label: '21-30 miles' },
  { max: 50, charge: 85, label: '31-50 miles' },
  { max: 9999, charge: 150, label: '50+ miles' },
];

// =============================================================================
// SCHEMA & TYPES
// =============================================================================

const quoteSchema = z.object({
  // Customer
  customerName: z.string().min(1, 'Name required'),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal('')),
  serviceAddress: z.string().min(1, 'Service address required'),

  // Load
  loadSizeId: z.string().min(1, 'Select a load size'),
  customLoadPrice: z.number().optional(),

  // Distance
  distanceMiles: z.number().min(0),
  travelMinutes: z.number().min(0),

  // Labor
  numWorkers: z.number().min(1).max(6),
  hoursOnSite: z.number().min(0.5).max(24),
  includeTravelTime: z.boolean(),
  hourlyRate: z.number().min(0),

  // Stairs
  stairOption: z.string(),

  // Heavy items (map of id -> qty)
  heavyItems: z.record(z.number().min(0)),

  // Debris
  debrisType: z.string().optional(),
  debrisQuantity: z.number().min(0).optional(),

  // Specialty items (map of id -> qty)
  specialtyItems: z.record(z.number().min(0)),

  // Difficulty
  difficulty: z.string(),

  // Custom fees
  customFees: z.array(z.object({
    id: z.string(),
    description: z.string(),
    amount: z.number(),
  })),

  // Discount
  discountType: z.string().optional(),
  discountAmount: z.number().min(0).optional(),
  discountIsPercent: z.boolean(),
  couponCode: z.string().optional(),

  // Notes
  notes: z.string().optional(),
  terms: z.string().optional(),
});

type QuoteFormData = z.infer<typeof quoteSchema>;

interface QuoteTotals {
  baseCharge: number;
  loadCharge: number;
  distanceCharge: number;
  laborCharge: number;
  heavyItemsCharge: number;
  debrisCharge: number;
  specialtyCharge: number;
  stairFee: number;
  customFeesTotal: number;
  subtotal: number;
  discountAmount: number;
  tax: number;
  total: number;
  // Profit analysis
  dumpFee: number;
  laborCost: number;
  fuelCost: number;
  estimatedProfit: number;
  profitMargin: number;
}

export interface QuoteBuilderProps {
  initialData?: Partial<QuoteFormData>;
  quoteId?: string;
  onSaveDraft?: (data: QuoteFormData, totals: QuoteTotals) => Promise<void>;
  onSendQuote?: (data: QuoteFormData, totals: QuoteTotals) => Promise<void>;
  onPreview?: (data: QuoteFormData, totals: QuoteTotals) => void;
}

// =============================================================================
// SECTION WRAPPER
// =============================================================================

function Section({
  icon: Icon,
  title,
  children,
  defaultOpen = true,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Icon className="h-4 w-4 text-orange-500" />
          <span className="font-semibold text-gray-800 text-sm">{title}</span>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4 bg-white">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// STEPPER COMPONENT
// =============================================================================

function Stepper({
  value,
  onChange,
  min = 0,
  max = 99,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-sm text-gray-600 min-w-0 flex-1">{label}</span>}
      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="px-3 py-1.5 text-gray-500 hover:bg-gray-100 transition-colors text-sm font-medium"
        >
          −
        </button>
        <span className="px-4 py-1.5 text-sm font-semibold text-gray-800 min-w-[2.5rem] text-center border-x border-gray-200">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="px-3 py-1.5 text-gray-500 hover:bg-gray-100 transition-colors text-sm font-medium"
        >
          +
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// PRICE ROW
// =============================================================================

function PriceRow({
  label,
  amount,
  sub,
  isDiscount,
  isBold,
  isTotal,
}: {
  label: string;
  amount: number;
  sub?: string;
  isDiscount?: boolean;
  isBold?: boolean;
  isTotal?: boolean;
}) {
  if (amount === 0 && !isBold && !isTotal) return null;

  return (
    <div
      className={cn(
        'flex items-baseline justify-between gap-2 py-1',
        isTotal && 'py-2 border-t-2 border-gray-800 mt-1'
      )}
    >
      <div className="flex flex-col">
        <span
          className={cn(
            'text-sm',
            isTotal ? 'text-gray-900 font-bold text-base' : isBold ? 'font-semibold text-gray-800' : 'text-gray-600'
          )}
        >
          {label}
        </span>
        {sub && <span className="text-xs text-gray-400">{sub}</span>}
      </div>
      <span
        className={cn(
          'font-mono text-sm shrink-0',
          isDiscount ? 'text-green-600 font-semibold' : isTotal ? 'text-gray-900 font-bold text-lg' : 'text-gray-800 font-medium'
        )}
      >
        {isDiscount ? `-${formatCurrency(amount)}` : formatCurrency(amount)}
      </span>
    </div>
  );
}

// =============================================================================
// CALCULATE TOTALS
// =============================================================================

function calculateTotals(data: Partial<QuoteFormData>): QuoteTotals {
  const loadSize = LOAD_SIZES.find((l) => l.id === data.loadSizeId);
  const baseCharge = 75; // Minimum service fee
  const loadCharge =
    data.loadSizeId === 'custom'
      ? data.customLoadPrice ?? 0
      : (loadSize?.price ?? 0);

  const distanceBracket = DISTANCE_BRACKETS.find(
    (b) => (data.distanceMiles ?? 0) <= b.max
  );
  const distanceCharge = distanceBracket?.charge ?? 0;

  const difficultyMultiplier =
    DIFFICULTY_OPTIONS.find((d) => d.id === data.difficulty)?.multiplier ?? 1.0;
  const numWorkers = data.numWorkers ?? 2;
  const hoursOnSite = data.hoursOnSite ?? 2;
  const hourlyRate = data.hourlyRate ?? 75;
  const travelHours = data.includeTravelTime ? (data.travelMinutes ?? 0) / 60 : 0;
  const laborCharge =
    numWorkers * (hoursOnSite + travelHours) * hourlyRate * difficultyMultiplier;

  const stairOption = STAIR_OPTIONS.find((s) => s.id === data.stairOption);
  const stairFee = stairOption?.fee ?? 0;

  let heavyItemsCharge = 0;
  if (data.heavyItems) {
    for (const item of HEAVY_ITEMS) {
      const qty = data.heavyItems[item.id] ?? 0;
      heavyItemsCharge += qty * item.price;
    }
  }

  const debrisType = DEBRIS_TYPES.find((d) => d.id === data.debrisType);
  const debrisCharge = debrisType
    ? (data.debrisQuantity ?? 0) * debrisType.pricePerUnit
    : 0;

  let specialtyCharge = 0;
  if (data.specialtyItems) {
    for (const item of SPECIALTY_ITEMS) {
      const qty = data.specialtyItems[item.id] ?? 0;
      specialtyCharge += qty * item.price;
    }
  }

  const customFeesTotal = (data.customFees ?? []).reduce(
    (sum, f) => sum + (f.amount ?? 0),
    0
  );

  const subtotal =
    baseCharge +
    loadCharge +
    distanceCharge +
    laborCharge +
    stairFee +
    heavyItemsCharge +
    debrisCharge +
    specialtyCharge +
    customFeesTotal;

  let discountAmount = 0;
  if (data.discountType && (data.discountAmount ?? 0) > 0) {
    if (data.discountIsPercent) {
      discountAmount = subtotal * ((data.discountAmount ?? 0) / 100);
    } else {
      discountAmount = data.discountAmount ?? 0;
    }
  }

  const taxRate = 0; // Junk removal typically not taxed; configure as needed
  const tax = (subtotal - discountAmount) * taxRate;
  const total = subtotal - discountAmount + tax;

  // Profit analysis
  const dumpFee = loadCharge * 0.25; // ~25% of load charge goes to dump fees
  const laborCost = numWorkers * (hoursOnSite + travelHours) * 22; // $22/hr labor cost
  const fuelCost = (data.distanceMiles ?? 0) * 0.65 * 2; // Round trip @ $0.65/mi
  const estimatedProfit = total - dumpFee - laborCost - fuelCost;
  const profitMargin = total > 0 ? (estimatedProfit / total) * 100 : 0;

  return {
    baseCharge,
    loadCharge,
    distanceCharge,
    laborCharge,
    heavyItemsCharge,
    debrisCharge,
    specialtyCharge,
    stairFee,
    customFeesTotal,
    subtotal,
    discountAmount,
    tax,
    total,
    dumpFee,
    laborCost,
    fuelCost,
    estimatedProfit,
    profitMargin,
  };
}

// =============================================================================
// PROFIT BAR
// =============================================================================

function ProfitBar({ margin }: { margin: number }) {
  const clampedMargin = Math.max(0, Math.min(100, margin));
  const color =
    margin >= 40
      ? 'bg-green-500'
      : margin >= 25
      ? 'bg-yellow-400'
      : 'bg-red-400';

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-gray-500">
        <span>Profit Margin</span>
        <span
          className={cn(
            'font-semibold',
            margin >= 40
              ? 'text-green-600'
              : margin >= 25
              ? 'text-yellow-600'
              : 'text-red-600'
          )}
        >
          {margin.toFixed(1)}%
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', color)}
          initial={{ width: 0 }}
          animate={{ width: `${clampedMargin}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-gray-400">
        <span>Poor</span>
        <span>Good</span>
        <span>Excellent</span>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function QuoteBuilder({
  initialData,
  quoteId,
  onSaveDraft,
  onSendQuote,
  onPreview,
}: QuoteBuilderProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [totals, setTotals] = useState<QuoteTotals>(calculateTotals({}));
  const [distanceLoading, setDistanceLoading] = useState(false);

  const { control, watch, handleSubmit, setValue, getValues, formState: { errors } } =
    useForm<QuoteFormData>({
      resolver: zodResolver(quoteSchema),
      defaultValues: {
        customerName: initialData?.customerName ?? '',
        customerPhone: initialData?.customerPhone ?? '',
        customerEmail: initialData?.customerEmail ?? '',
        serviceAddress: initialData?.serviceAddress ?? '',
        loadSizeId: initialData?.loadSizeId ?? '',
        customLoadPrice: initialData?.customLoadPrice ?? 0,
        distanceMiles: initialData?.distanceMiles ?? 0,
        travelMinutes: initialData?.travelMinutes ?? 0,
        numWorkers: initialData?.numWorkers ?? 2,
        hoursOnSite: initialData?.hoursOnSite ?? 2,
        includeTravelTime: initialData?.includeTravelTime ?? true,
        hourlyRate: initialData?.hourlyRate ?? 75,
        stairOption: initialData?.stairOption ?? 'none',
        heavyItems: initialData?.heavyItems ?? {},
        debrisType: initialData?.debrisType ?? '',
        debrisQuantity: initialData?.debrisQuantity ?? 0,
        specialtyItems: initialData?.specialtyItems ?? {},
        difficulty: initialData?.difficulty ?? 'easy',
        customFees: initialData?.customFees ?? [],
        discountType: initialData?.discountType ?? '',
        discountAmount: initialData?.discountAmount ?? 0,
        discountIsPercent: initialData?.discountIsPercent ?? false,
        couponCode: initialData?.couponCode ?? '',
        notes: initialData?.notes ?? '',
        terms: initialData?.terms ?? 'All junk removal services are subject to our standard terms and conditions. Payment is due upon completion of service. We reserve the right to adjust pricing based on actual load size.',
      },
    });

  const watchedValues = watch();

  // Recalculate totals whenever form changes
  useEffect(() => {
    const newTotals = calculateTotals(watchedValues);
    setTotals(newTotals);
  }, [watchedValues]);

  const handleLoadSizeSelect = useCallback(
    (loadSize: LoadSize) => {
      setValue('loadSizeId', loadSize.id, { shouldValidate: true });
    },
    [setValue]
  );

  const handleAddressBlur = useCallback(
    async (address: string) => {
      if (!address || address.length < 10) return;
      setDistanceLoading(true);
      try {
        // Simulate distance calculation (replace with actual Google Maps call)
        await new Promise((r) => setTimeout(r, 800));
        const mockMiles = Math.round(5 + Math.random() * 25);
        const mockMinutes = Math.round(mockMiles * 1.8);
        setValue('distanceMiles', mockMiles);
        setValue('travelMinutes', mockMinutes);
      } catch (e) {
        console.error('Distance calc error:', e);
      } finally {
        setDistanceLoading(false);
      }
    },
    [setValue]
  );

  const handleAddCustomFee = useCallback(() => {
    const current = getValues('customFees') ?? [];
    setValue('customFees', [
      ...current,
      { id: `fee_${Date.now()}`, description: '', amount: 0 },
    ]);
  }, [getValues, setValue]);

  const handleRemoveCustomFee = useCallback(
    (index: number) => {
      const current = getValues('customFees') ?? [];
      setValue(
        'customFees',
        current.filter((_, i) => i !== index)
      );
    },
    [getValues, setValue]
  );

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const data = getValues();
      await onSaveDraft?.(data, totals);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSend = handleSubmit(async (data) => {
    setIsSending(true);
    try {
      await onSendQuote?.(data, totals);
    } finally {
      setIsSending(false);
    }
  });

  const loadSizeId = watch('loadSizeId');
  const stairOption = watch('stairOption');
  const difficulty = watch('difficulty');
  const numWorkers = watch('numWorkers');
  const hoursOnSite = watch('hoursOnSite');
  const includeTravelTime = watch('includeTravelTime');
  const distanceMiles = watch('distanceMiles');
  const travelMinutes = watch('travelMinutes');
  const heavyItems = watch('heavyItems');
  const specialtyItems = watch('specialtyItems');
  const customFees = watch('customFees');
  const discountIsPercent = watch('discountIsPercent');
  const debrisType = watch('debrisType');

  return (
    <div className="flex gap-6 min-h-screen">
      {/* =====================================================================
          LEFT PANEL — FORM
      ===================================================================== */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Quote number header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {quoteId ? `Quote #${quoteId}` : 'New Quote'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {quoteId ? 'Edit quote details below' : generateQuoteNumber()}
            </p>
          </div>
          <Badge variant="draft" dot>
            Draft
          </Badge>
        </div>

        {/* 1. Customer */}
        <Section icon={User} title="Customer Information">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Full Name *
              </label>
              <Controller
                control={control}
                name="customerName"
                render={({ field }) => (
                  <input
                    {...field}
                    placeholder="John Smith"
                    className={cn(
                      'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500',
                      errors.customerName ? 'border-red-400' : 'border-gray-200'
                    )}
                  />
                )}
              />
              {errors.customerName && (
                <p className="text-xs text-red-500 mt-1">{errors.customerName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <Controller
                control={control}
                name="customerPhone"
                render={({ field }) => (
                  <input
                    {...field}
                    placeholder="(555) 000-0000"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                )}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <Controller
                control={control}
                name="customerEmail"
                render={({ field }) => (
                  <input
                    {...field}
                    type="email"
                    placeholder="john@example.com"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                )}
              />
            </div>
          </div>
        </Section>

        {/* 2. Load Size */}
        <Section icon={Package} title="Load Size">
          <Controller
            control={control}
            name="loadSizeId"
            render={() => (
              <LoadSizeSelector
                selected={loadSizeId}
                onSelect={handleLoadSizeSelect}
              />
            )}
          />
          {loadSizeId === 'custom' && (
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Custom Load Price
              </label>
              <Controller
                control={control}
                name="customLoadPrice"
                render={({ field }) => (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      {...field}
                      type="number"
                      min={0}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="0.00"
                    />
                  </div>
                )}
              />
            </div>
          )}
          {errors.loadSizeId && (
            <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.loadSizeId.message}
            </p>
          )}
        </Section>

        {/* 3. Distance & Travel */}
        <Section icon={MapPin} title="Distance & Travel">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Service Address *
              </label>
              <Controller
                control={control}
                name="serviceAddress"
                render={({ field }) => (
                  <input
                    {...field}
                    placeholder="123 Main St, City, State 12345"
                    onBlur={(e) => {
                      field.onBlur();
                      handleAddressBlur(e.target.value);
                    }}
                    className={cn(
                      'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500',
                      errors.serviceAddress ? 'border-red-400' : 'border-gray-200'
                    )}
                  />
                )}
              />
              {distanceLoading && (
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Calculating distance...
                </p>
              )}
            </div>

            {distanceMiles > 0 && (
              <div className="flex gap-3">
                <div className="flex-1 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-center">
                  <div className="text-lg font-bold text-blue-700">{distanceMiles}</div>
                  <div className="text-xs text-blue-500">miles</div>
                </div>
                <div className="flex-1 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-center">
                  <div className="text-lg font-bold text-blue-700">{travelMinutes}</div>
                  <div className="text-xs text-blue-500">min travel</div>
                </div>
                <div className="flex-1 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 text-center">
                  <div className="text-lg font-bold text-orange-700">
                    {formatCurrency(
                      DISTANCE_BRACKETS.find((b) => distanceMiles <= b.max)?.charge ?? 0
                    )}
                  </div>
                  <div className="text-xs text-orange-500">distance fee</div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Distance (miles)
                </label>
                <Controller
                  control={control}
                  name="distanceMiles"
                  render={({ field }) => (
                    <input
                      {...field}
                      type="number"
                      min={0}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  )}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Travel Time (min)
                </label>
                <Controller
                  control={control}
                  name="travelMinutes"
                  render={({ field }) => (
                    <input
                      {...field}
                      type="number"
                      min={0}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  )}
                />
              </div>
            </div>
          </div>
        </Section>

        {/* 4. Labor */}
        <Section icon={Users} title="Labor Configuration">
          <div className="space-y-4">
            <Controller
              control={control}
              name="numWorkers"
              render={({ field }) => (
                <Stepper
                  label="Number of Workers"
                  value={field.value}
                  onChange={field.onChange}
                  min={1}
                  max={6}
                />
              )}
            />

            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1.5">
                <span className="font-medium">Hours on Site</span>
                <span className="font-semibold text-orange-600">
                  {hoursOnSite} hrs
                </span>
              </div>
              <Controller
                control={control}
                name="hoursOnSite"
                render={({ field }) => (
                  <input
                    type="range"
                    min={0.5}
                    max={12}
                    step={0.5}
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    className="w-full accent-orange-500"
                  />
                )}
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                <span>0.5 hr</span>
                <span>12 hrs</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Include Travel Time in Labor</span>
              <Controller
                control={control}
                name="includeTravelTime"
                render={({ field }) => (
                  <button
                    type="button"
                    onClick={() => field.onChange(!field.value)}
                    className={cn(
                      'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                      field.value ? 'bg-orange-500' : 'bg-gray-200'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform',
                        field.value ? 'translate-x-5' : 'translate-x-0.5'
                      )}
                    />
                  </button>
                )}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Hourly Rate ($/hr per worker)
              </label>
              <Controller
                control={control}
                name="hourlyRate"
                render={({ field }) => (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input
                      {...field}
                      type="number"
                      min={0}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                )}
              />
            </div>

            <div className="bg-orange-50 rounded-lg p-3 text-sm">
              <span className="text-gray-600">Labor Total: </span>
              <span className="font-bold text-orange-700">
                {formatCurrency(totals.laborCharge)}
              </span>
              <span className="text-xs text-gray-500 ml-2">
                ({numWorkers} workers × {hoursOnSite} hrs
                {includeTravelTime && travelMinutes > 0
                  ? ` + ${travelMinutes} min travel`
                  : ''}
                )
              </span>
            </div>
          </div>
        </Section>

        {/* 5. Stairs */}
        <Section icon={ArrowUp} title="Stair Fees" defaultOpen={false}>
          <div className="grid grid-cols-2 gap-2">
            {STAIR_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setValue('stairOption', option.id)}
                className={cn(
                  'flex flex-col items-start p-3 rounded-lg border-2 transition-all',
                  stairOption === option.id
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 bg-white hover:border-orange-300'
                )}
              >
                <span className="font-semibold text-sm text-gray-800">{option.label}</span>
                <span className="text-xs text-gray-500 mt-0.5">
                  {option.fee === 0 ? 'No charge' : `+${formatCurrency(option.fee)}`}
                </span>
              </button>
            ))}
          </div>
        </Section>

        {/* 6. Heavy Items */}
        <Section icon={Package} title="Heavy Items" defaultOpen={false}>
          <div className="grid grid-cols-2 gap-2">
            {HEAVY_ITEMS.map((item) => {
              const qty = heavyItems?.[item.id] ?? 0;
              return (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center justify-between p-2.5 rounded-lg border transition-all',
                    qty > 0 ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-white'
                  )}
                >
                  <div>
                    <div className="text-sm font-medium text-gray-800">{item.label}</div>
                    <div className="text-xs text-gray-500">{formatCurrency(item.price)} ea</div>
                  </div>
                  <Stepper
                    value={qty}
                    onChange={(v) => {
                      setValue(`heavyItems.${item.id}`, v);
                    }}
                    min={0}
                    max={10}
                  />
                </div>
              );
            })}
          </div>
        </Section>

        {/* 7. Construction Debris */}
        <Section icon={Wrench} title="Construction Debris" defaultOpen={false}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Debris Type
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {DEBRIS_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() =>
                      setValue('debrisType', debrisType === type.id ? '' : type.id)
                    }
                    className={cn(
                      'px-2 py-1.5 rounded-lg border text-xs font-medium transition-all',
                      debrisType === type.id
                        ? 'border-orange-500 bg-orange-500 text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300'
                    )}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {debrisType && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Quantity (cubic yards)
                  </label>
                  <Controller
                    control={control}
                    name="debrisQuantity"
                    render={({ field }) => (
                      <input
                        {...field}
                        type="number"
                        min={0}
                        step={0.5}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    )}
                  />
                </div>
                <div className="bg-orange-50 rounded-lg p-3 flex flex-col justify-center">
                  <div className="text-xs text-gray-500">Debris charge</div>
                  <div className="text-lg font-bold text-orange-700">
                    {formatCurrency(totals.debrisCharge)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* 8. Specialty Items */}
        <Section icon={Zap} title="Specialty Items" defaultOpen={false}>
          <div className="grid grid-cols-2 gap-2">
            {SPECIALTY_ITEMS.map((item) => {
              const qty = specialtyItems?.[item.id] ?? 0;
              return (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center justify-between p-2.5 rounded-lg border transition-all',
                    qty > 0 ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-white'
                  )}
                >
                  <div>
                    <div className="text-sm font-medium text-gray-800">{item.label}</div>
                    <div className="text-xs text-gray-500">{formatCurrency(item.price)} ea</div>
                  </div>
                  <Stepper
                    value={qty}
                    onChange={(v) => setValue(`specialtyItems.${item.id}`, v)}
                    min={0}
                    max={99}
                  />
                </div>
              );
            })}
          </div>
        </Section>

        {/* 9. Difficulty */}
        <Section icon={TrendingUp} title="Difficulty Multiplier" defaultOpen={false}>
          <div className="grid grid-cols-4 gap-2">
            {DIFFICULTY_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setValue('difficulty', opt.id)}
                className={cn(
                  'flex flex-col items-center p-3 rounded-xl border-2 transition-all',
                  difficulty === opt.id
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 bg-white hover:border-orange-300'
                )}
              >
                <span className={cn('text-xs font-bold', opt.color)}>
                  {opt.multiplier}x
                </span>
                <span className="text-xs font-medium text-gray-700 mt-1">
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Difficulty multiplier applies to the labor portion of the quote only.
          </p>
        </Section>

        {/* 10. Custom Fees */}
        <Section icon={Plus} title="Custom Fees" defaultOpen={false}>
          <div className="space-y-2">
            {(customFees ?? []).map((fee, index) => (
              <div key={fee.id} className="flex gap-2 items-center">
                <Controller
                  control={control}
                  name={`customFees.${index}.description`}
                  render={({ field }) => (
                    <input
                      {...field}
                      placeholder="Fee description"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  )}
                />
                <div className="relative w-28">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <Controller
                    control={control}
                    name={`customFees.${index}.amount`}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="number"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        placeholder="0.00"
                        className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    )}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveCustomFee(index)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={handleAddCustomFee}
            >
              Add Custom Fee
            </Button>
          </div>
        </Section>

        {/* 11. Discounts */}
        <Section icon={Tag} title="Discounts" defaultOpen={false}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Discount Type
              </label>
              <div className="flex flex-wrap gap-2">
                {DISCOUNT_TYPES.map((type) => {
                  const selected = watch('discountType') === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() =>
                        setValue('discountType', selected ? '' : type.id)
                      }
                      className={cn(
                        'px-3 py-1.5 rounded-full border text-xs font-medium transition-all',
                        selected
                          ? 'border-orange-500 bg-orange-500 text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300'
                      )}
                    >
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {watch('discountType') === 'coupon' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Coupon Code
                </label>
                <Controller
                  control={control}
                  name="couponCode"
                  render={({ field }) => (
                    <input
                      {...field}
                      placeholder="SAVE10"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 uppercase"
                    />
                  )}
                />
              </div>
            )}

            {watch('discountType') && (
              <div className="flex gap-3 items-start">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      {discountIsPercent ? '%' : '$'}
                    </span>
                    <Controller
                      control={control}
                      name="discountAmount"
                      render={({ field }) => (
                        <input
                          {...field}
                          type="number"
                          min={0}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      )}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Type
                  </label>
                  <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setValue('discountIsPercent', false)}
                      className={cn(
                        'px-3 py-2 text-sm font-medium transition-colors',
                        !discountIsPercent ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      $
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue('discountIsPercent', true)}
                      className={cn(
                        'px-3 py-2 text-sm font-medium transition-colors border-l border-gray-200',
                        discountIsPercent ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      %
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* 12. Notes & Terms */}
        <Section icon={FileText} title="Notes & Terms" defaultOpen={false}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Internal Notes
              </label>
              <Controller
                control={control}
                name="notes"
                render={({ field }) => (
                  <textarea
                    {...field}
                    rows={3}
                    placeholder="Notes visible only to your team..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  />
                )}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Terms & Conditions
              </label>
              <Controller
                control={control}
                name="terms"
                render={({ field }) => (
                  <textarea
                    {...field}
                    rows={4}
                    placeholder="Terms shown on the customer quote..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  />
                )}
              />
            </div>
          </div>
        </Section>
      </div>

      {/* =====================================================================
          RIGHT PANEL — LIVE PRICE BREAKDOWN (STICKY)
      ===================================================================== */}
      <div className="w-80 shrink-0">
        <div className="sticky top-6 space-y-4">
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-orange-500" />
                Live Price Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-0.5">
              <PriceRow
                label="Base Charge"
                amount={totals.baseCharge}
                sub="Minimum service fee"
              />
              {totals.loadCharge > 0 && (
                <PriceRow
                  label={`Load Charge`}
                  amount={totals.loadCharge}
                  sub={LOAD_SIZES.find((l) => l.id === loadSizeId)?.label}
                />
              )}
              {totals.distanceCharge > 0 && (
                <PriceRow
                  label="Distance Charge"
                  amount={totals.distanceCharge}
                  sub={`${distanceMiles} miles`}
                />
              )}
              {totals.laborCharge > 0 && (
                <PriceRow
                  label="Labor"
                  amount={totals.laborCharge}
                  sub={`${numWorkers} workers × ${hoursOnSite} hrs`}
                />
              )}
              {totals.heavyItemsCharge > 0 && (
                <PriceRow label="Heavy Items" amount={totals.heavyItemsCharge} />
              )}
              {totals.debrisCharge > 0 && (
                <PriceRow label="Construction Debris" amount={totals.debrisCharge} />
              )}
              {totals.specialtyCharge > 0 && (
                <PriceRow label="Specialty Items" amount={totals.specialtyCharge} />
              )}
              {totals.stairFee > 0 && (
                <PriceRow label="Stair Fee" amount={totals.stairFee} />
              )}
              {totals.customFeesTotal > 0 && (
                <PriceRow label="Custom Fees" amount={totals.customFeesTotal} />
              )}

              {/* Divider */}
              <div className="border-t border-gray-100 my-2" />

              <PriceRow
                label="Subtotal"
                amount={totals.subtotal}
                isBold
              />
              {totals.discountAmount > 0 && (
                <PriceRow
                  label="Discount"
                  amount={totals.discountAmount}
                  isDiscount
                />
              )}
              {totals.tax > 0 && (
                <PriceRow label="Tax" amount={totals.tax} />
              )}

              {/* Total */}
              <PriceRow
                label="TOTAL"
                amount={totals.total}
                isTotal
              />
            </CardContent>
          </Card>

          {/* Profit Analysis */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Profit Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Dump Fee (est.)</span>
                  <span className="text-gray-700 font-medium">
                    -{formatCurrency(totals.dumpFee)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Labor Cost</span>
                  <span className="text-gray-700 font-medium">
                    -{formatCurrency(totals.laborCost)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Fuel Cost</span>
                  <span className="text-gray-700 font-medium">
                    -{formatCurrency(totals.fuelCost)}
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-1.5 flex justify-between font-semibold">
                  <span className="text-gray-700">Est. Profit</span>
                  <span
                    className={cn(
                      totals.estimatedProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {formatCurrency(totals.estimatedProfit)}
                  </span>
                </div>
              </div>

              <ProfitBar margin={totals.profitMargin} />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              className="w-full"
              variant="outline"
              loading={isSaving}
              onClick={handleSaveDraft}
              leftIcon={<FileText className="h-4 w-4" />}
            >
              Save as Draft
            </Button>
            <Button
              className="w-full"
              variant="ghost"
              onClick={() => onPreview?.(getValues(), totals)}
              leftIcon={<Zap className="h-4 w-4" />}
            >
              Preview Quote
            </Button>
            <Button
              className="w-full"
              loading={isSending}
              onClick={handleSend}
              leftIcon={<Users className="h-4 w-4" />}
            >
              Send to Customer
            </Button>
          </div>

          {/* Quote total callout */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white text-center">
            <div className="text-xs font-medium opacity-80 mb-1">Quote Total</div>
            <div className="text-3xl font-bold">{formatCurrency(totals.total)}</div>
            {totals.discountAmount > 0 && (
              <div className="text-xs opacity-70 mt-1">
                Saves {formatCurrency(totals.discountAmount)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
