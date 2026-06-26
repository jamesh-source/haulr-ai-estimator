'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, DollarSign, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface LoadSizePrice {
  label: string;
  fraction: string;
  pct: number; // 0-100
  minPrice: number;
  maxPrice: number;
}

interface DistanceBracket {
  id: string;
  minMiles: number;
  maxMiles: number | null;
  surcharge: number;
}

interface PricingData {
  loadSizes: LoadSizePrice[];
  distanceBrackets: DistanceBracket[];
  laborRatePerHour: number;
  stairFeePerFlight: number;
  dumpFeeBase: number;
  dumpFeePerYard: number;
  taxRate: number;
}

const DEFAULT_PRICING: PricingData = {
  loadSizes: [
    { label: '1/8 Load', fraction: '1/8', pct: 13, minPrice: 100, maxPrice: 150 },
    { label: '1/4 Load', fraction: '1/4', pct: 25, minPrice: 150, maxPrice: 225 },
    { label: '3/8 Load', fraction: '3/8', pct: 38, minPrice: 225, maxPrice: 300 },
    { label: '1/2 Load', fraction: '1/2', pct: 50, minPrice: 300, maxPrice: 400 },
    { label: '5/8 Load', fraction: '5/8', pct: 63, minPrice: 400, maxPrice: 500 },
    { label: '3/4 Load', fraction: '3/4', pct: 75, minPrice: 500, maxPrice: 625 },
    { label: '7/8 Load', fraction: '7/8', pct: 88, minPrice: 625, maxPrice: 750 },
    { label: 'Full Load', fraction: '1', pct: 100, minPrice: 700, maxPrice: 900 },
  ],
  distanceBrackets: [
    { id: '1', minMiles: 0, maxMiles: 10, surcharge: 0 },
    { id: '2', minMiles: 10, maxMiles: 20, surcharge: 25 },
    { id: '3', minMiles: 20, maxMiles: 35, surcharge: 50 },
    { id: '4', minMiles: 35, maxMiles: null, surcharge: 75 },
  ],
  laborRatePerHour: 45,
  stairFeePerFlight: 25,
  dumpFeeBase: 26.50,
  dumpFeePerYard: 11,
  taxRate: 8.35,
};

export function PricingConfig() {
  const [pricing, setPricing] = useState<PricingData>(DEFAULT_PRICING);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then(({ data }) => {
        if (!data?.pricing) return;
        const p = data.pricing;
        // Map API format back to component format
        const loadSizes = [
          { label: '1/8 Load', fraction: '1/8', pct: 13, minPrice: p.load_prices?.['1/8'] ?? 100, maxPrice: Math.round((p.load_prices?.['1/8'] ?? 100) * 1.5) },
          { label: '1/4 Load', fraction: '1/4', pct: 25, minPrice: p.load_prices?.['1/4'] ?? 150, maxPrice: Math.round((p.load_prices?.['1/4'] ?? 150) * 1.5) },
          { label: '3/8 Load', fraction: '3/8', pct: 38, minPrice: p.load_prices?.['3/8'] ?? 225, maxPrice: Math.round((p.load_prices?.['3/8'] ?? 225) * 1.33) },
          { label: '1/2 Load', fraction: '1/2', pct: 50, minPrice: p.load_prices?.['1/2'] ?? 300, maxPrice: Math.round((p.load_prices?.['1/2'] ?? 300) * 1.33) },
          { label: '5/8 Load', fraction: '5/8', pct: 63, minPrice: p.load_prices?.['5/8'] ?? 400, maxPrice: Math.round((p.load_prices?.['5/8'] ?? 400) * 1.25) },
          { label: '3/4 Load', fraction: '3/4', pct: 75, minPrice: p.load_prices?.['3/4'] ?? 500, maxPrice: Math.round((p.load_prices?.['3/4'] ?? 500) * 1.25) },
          { label: '7/8 Load', fraction: '7/8', pct: 88, minPrice: p.load_prices?.['7/8'] ?? 625, maxPrice: Math.round((p.load_prices?.['7/8'] ?? 625) * 1.2) },
          { label: 'Full Load', fraction: '1', pct: 100, minPrice: p.load_prices?.['1'] ?? 700, maxPrice: Math.round((p.load_prices?.['1'] ?? 700) * 1.28) },
        ];
        setPricing({
          loadSizes,
          distanceBrackets: (p.distance_brackets ?? []).map((b: { min_miles: number; max_miles: number; charge: number }, i: number) => ({
            id: String(i + 1),
            minMiles: b.min_miles,
            maxMiles: b.max_miles >= 9999 ? null : b.max_miles,
            surcharge: b.charge,
          })),
          laborRatePerHour: p.labor_rate ?? 45,
          stairFeePerFlight: p.stair_fees?.per_flight ?? 25,
          dumpFeeBase: p.dump_base_fee ?? 26.5,
          dumpFeePerYard: p.dump_per_yard ?? 11,
          taxRate: (data.tax_rate ?? 0.0835) * 100,
        });
      })
      .catch(() => {});
  }, []);

  const updateLoadSize = (index: number, field: keyof LoadSizePrice, value: number) => {
    const updated = [...pricing.loadSizes];
    updated[index] = { ...updated[index], [field]: value };
    setPricing({ ...pricing, loadSizes: updated });
  };

  const updateDistanceBracket = (id: string, field: keyof DistanceBracket, value: any) => {
    setPricing({
      ...pricing,
      distanceBrackets: pricing.distanceBrackets.map((b) =>
        b.id === id ? { ...b, [field]: value } : b
      ),
    });
  };

  const addDistanceBracket = () => {
    const lastBracket = pricing.distanceBrackets[pricing.distanceBrackets.length - 1];
    const newMin = lastBracket?.maxMiles ?? 0;
    setPricing({
      ...pricing,
      distanceBrackets: [
        ...pricing.distanceBrackets.map((b) =>
          b.maxMiles === null ? { ...b, maxMiles: newMin } : b
        ),
        {
          id: Date.now().toString(),
          minMiles: newMin,
          maxMiles: null,
          surcharge: (lastBracket?.surcharge ?? 0) + 25,
        },
      ],
    });
  };

  const removeDistanceBracket = (id: string) => {
    if (pricing.distanceBrackets.length <= 1) return;
    setPricing({
      ...pricing,
      distanceBrackets: pricing.distanceBrackets.filter((b) => b.id !== id),
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Transform component format to API format
      const load_prices: Record<string, number> = {};
      pricing.loadSizes.forEach((ls) => {
        load_prices[ls.fraction] = ls.minPrice;
      });

      const apiPayload = {
        pricing: {
          load_prices,
          distance_brackets: pricing.distanceBrackets.map((b) => ({
            min_miles: b.minMiles,
            max_miles: b.maxMiles ?? 9999,
            charge: b.surcharge,
          })),
          labor_rate: pricing.laborRatePerHour,
          stair_fees: {
            per_flight: pricing.stairFeePerFlight,
            max_flights: 5,
          },
          heavy_item_prices: {},
          difficulty_multipliers: {
            easy: 1.0,
            moderate: 1.15,
            hard: 1.3,
            extreme: 1.5,
          },
          specialty_fees: {},
          dump_base_fee: pricing.dumpFeeBase,
          dump_per_yard: pricing.dumpFeePerYard,
        },
        tax_rate: pricing.taxRate / 100,
      };

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? JSON.stringify(json));
      toast.success('Pricing settings saved');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[PricingConfig save]', msg);
      toast.error(`Save failed: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  // Sample quote preview
  const sampleRevenue = pricing.loadSizes[3].minPrice;
  const sampleWithStairs = sampleRevenue + pricing.stairFeePerFlight * 2;
  const sampleWithDump = sampleWithStairs + pricing.dumpFeeBase + pricing.dumpFeePerYard * 4;
  const sampleTax = sampleWithDump * (pricing.taxRate / 100);
  const sampleTotal = sampleWithDump + sampleTax;

  return (
    <div className="space-y-8">
      {/* Load Size Pricing Grid */}
      <div>
        <h3 className="text-gray-200 font-semibold text-sm mb-4">Load Size Pricing</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {pricing.loadSizes.map((size, i) => (
            <div key={size.fraction} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-200 font-medium text-sm">{size.label}</span>
                <span className="bg-orange-500/20 text-orange-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {size.pct}%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 text-xs block mb-1">Min Price</label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input
                      type="number"
                      value={size.minPrice}
                      onChange={(e) => updateLoadSize(i, 'minPrice', Number(e.target.value))}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-7 pr-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-gray-500 text-xs block mb-1">Max Price</label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input
                      type="number"
                      value={size.maxPrice}
                      onChange={(e) => updateLoadSize(i, 'maxPrice', Number(e.target.value))}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-7 pr-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Distance Brackets */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-200 font-semibold text-sm">Distance Surcharges</h3>
          <button
            onClick={addDistanceBracket}
            className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Bracket
          </button>
        </div>
        <div className="space-y-2">
          {pricing.distanceBrackets.map((bracket, i) => (
            <div key={bracket.id} className="flex items-center gap-3 bg-gray-800/50 border border-gray-700/50 rounded-xl p-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="flex-1">
                  <label className="text-gray-500 text-xs block mb-1">Min Miles</label>
                  <input
                    type="number"
                    value={bracket.minMiles}
                    onChange={(e) => updateDistanceBracket(bracket.id, 'minMiles', Number(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <span className="text-gray-600 mt-4">-</span>
                <div className="flex-1">
                  <label className="text-gray-500 text-xs block mb-1">Max Miles</label>
                  <input
                    type="number"
                    value={bracket.maxMiles ?? ''}
                    placeholder="∞"
                    onChange={(e) =>
                      updateDistanceBracket(bracket.id, 'maxMiles', e.target.value === '' ? null : Number(e.target.value))
                    }
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-gray-500 text-xs block mb-1">Surcharge ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input
                      type="number"
                      value={bracket.surcharge}
                      onChange={(e) => updateDistanceBracket(bracket.id, 'surcharge', Number(e.target.value))}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-7 pr-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={() => removeDistanceBracket(bracket.id)}
                disabled={pricing.distanceBrackets.length <= 1}
                className="mt-4 text-gray-600 hover:text-red-400 disabled:opacity-30 transition-colors p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Rate Settings */}
      <div>
        <h3 className="text-gray-200 font-semibold text-sm mb-4">Rate Settings</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Labor Rate / Worker / Hr', field: 'laborRatePerHour' as const, suffix: '/hr' },
            { label: 'Stair Fee / Flight', field: 'stairFeePerFlight' as const, suffix: '' },
            { label: 'Dump Fee Base', field: 'dumpFeeBase' as const, suffix: '' },
            { label: 'Dump Fee / Cu Yard', field: 'dumpFeePerYard' as const, suffix: '/yd' },
            { label: 'Tax Rate', field: 'taxRate' as const, suffix: '%', isDollar: false },
          ].map(({ label, field, suffix, isDollar = true }) => (
            <div key={field} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
              <label className="text-gray-500 text-xs block mb-2">{label}</label>
              <div className="relative">
                {isDollar && (
                  <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                )}
                <input
                  type="number"
                  step={field === 'taxRate' ? '0.1' : '1'}
                  value={pricing[field]}
                  onChange={(e) => setPricing({ ...pricing, [field]: Number(e.target.value) })}
                  className={`w-full bg-gray-900 border border-gray-700 rounded-lg ${isDollar ? 'pl-7' : 'pl-3'} pr-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30`}
                />
                {suffix && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">{suffix}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Preview */}
      {showPreview && (
        <div className="bg-gray-800/50 border border-orange-500/20 rounded-xl p-5">
          <h4 className="text-orange-400 font-semibold text-sm mb-4">Sample Quote Preview</h4>
          <p className="text-gray-500 text-xs mb-4">Half load, 2 flights of stairs, 4 cu yd of dump waste, within 10 miles</p>
          <div className="space-y-2">
            {[
              { label: 'Base Load Price (1/2 load)', value: sampleRevenue },
              { label: 'Stair Fee (2 flights)', value: pricing.stairFeePerFlight * 2 },
              { label: 'Dump Fee (base + 4 yd)', value: pricing.dumpFeeBase + pricing.dumpFeePerYard * 4 },
              { label: `Tax (${pricing.taxRate}%)`, value: sampleTax },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">{row.label}</span>
                <span className="text-gray-200 text-sm">${row.value.toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-gray-700 pt-2 flex items-center justify-between">
              <span className="text-white font-bold">Total</span>
              <span className="text-emerald-400 font-bold text-lg">${sampleTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-800">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
        >
          <Eye className="w-4 h-4" />
          {showPreview ? 'Hide' : 'Show'} Quote Preview
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-xl transition-colors"
        >
          {saving ? 'Saving...' : 'Save Pricing'}
        </button>
      </div>
    </div>
  );
}
