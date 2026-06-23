-- ============================================================
-- HAULR AI Estimator - Seed Data
-- Migration: 002_seed_data.sql
--
-- NOTE: The clerk_user_id 'REPLACE_WITH_YOUR_CLERK_USER_ID'
--       must be updated to a real Clerk user ID before use.
--       This seed is safe to run in development/staging only.
-- ============================================================

-- ============================================================
-- DEFAULT PRICING CONFIG STRUCTURE (reference comment)
-- ============================================================
-- The pricing_config JSONB field in business_settings supports
-- the following structure:
--
-- {
--   "base_charge": 99,              -- Flat trip/show-up fee ($)
--   "price_per_cubic_yard": 45,     -- Per cubic yard charge ($)
--   "dump_fee_per_yard": 8,         -- Dump/disposal cost passed through ($)
--   "labor_rate_per_hour": 75,      -- Per labor-hour charge ($)
--   "min_crew_size": 2,             -- Minimum crew members
--   "travel_rate_per_mile": 1.50,   -- Travel/distance surcharge ($/mile)
--   "free_miles": 10,               -- Miles included before distance charge kicks in
--   "stair_fee_per_flight": 25,     -- Stair carry surcharge per flight ($)
--   "heavy_item_fee": 50,           -- Fee per heavy/oversized item ($)
--   "specialty_item_fee": 75,       -- Fee for specialty items (piano, safe, etc.) ($)
--   "construction_debris_multiplier": 1.5, -- Multiplier for C&D debris pricing
--   "minimum_charge": 149,          -- Minimum job charge regardless of size ($)
--   "fuel_surcharge_pct": 0.05,     -- Fuel surcharge as % of subtotal (0.05 = 5%)
--   "truck_sizes": {
--     "quarter":  { "label": "1/4 Truck", "cubic_yards": 3.5 },
--     "half":     { "label": "1/2 Truck", "cubic_yards": 7   },
--     "three_quarter": { "label": "3/4 Truck", "cubic_yards": 10.5 },
--     "full":     { "label": "Full Truck", "cubic_yards": 14  }
--   },
--   "heavy_items": [
--     "Piano", "Safe", "Hot Tub", "Pool Table", "Refrigerator",
--     "Washer", "Dryer", "Treadmill", "Exercise Equipment"
--   ],
--   "specialty_items": [
--     "Electronics", "Mattress", "Paint", "Chemicals", "Tires"
--   ],
--   "discount_codes": {
--     "NEIGHBOR10": { "type": "percent", "value": 10 },
--     "REFERRAL25":  { "type": "fixed",   "value": 25 }
--   }
-- }
-- ============================================================

-- ============================================================
-- SAMPLE: Default business_settings row
-- Replace 'REPLACE_WITH_YOUR_CLERK_USER_ID' with actual ID
-- ============================================================
INSERT INTO business_settings (
  clerk_user_id,
  company_name,
  address,
  city,
  state,
  zip,
  phone,
  email,
  website,
  tax_rate,
  pricing_config
) VALUES (
  'REPLACE_WITH_YOUR_CLERK_USER_ID',
  'HAULR Junk Removal',
  '123 Main Street',
  'Austin',
  'TX',
  '78701',
  '(512) 555-0100',
  'info@haulrjunk.com',
  'https://haulrjunk.com',
  0.0825, -- 8.25% Texas sales tax
  '{
    "base_charge": 99,
    "price_per_cubic_yard": 45,
    "dump_fee_per_yard": 8,
    "labor_rate_per_hour": 75,
    "min_crew_size": 2,
    "travel_rate_per_mile": 1.50,
    "free_miles": 10,
    "stair_fee_per_flight": 25,
    "heavy_item_fee": 50,
    "specialty_item_fee": 75,
    "construction_debris_multiplier": 1.5,
    "minimum_charge": 149,
    "fuel_surcharge_pct": 0.05,
    "truck_sizes": {
      "quarter":       { "label": "1/4 Truck",   "cubic_yards": 3.5  },
      "half":          { "label": "1/2 Truck",   "cubic_yards": 7.0  },
      "three_quarter": { "label": "3/4 Truck",   "cubic_yards": 10.5 },
      "full":          { "label": "Full Truck",  "cubic_yards": 14.0 }
    },
    "heavy_items": [
      "Piano", "Safe", "Hot Tub", "Pool Table",
      "Refrigerator", "Washer", "Dryer",
      "Treadmill", "Exercise Equipment", "Gun Safe"
    ],
    "specialty_items": [
      "Electronics", "Mattress", "Paint",
      "Chemicals", "Tires", "Propane Tank"
    ],
    "discount_codes": {
      "NEIGHBOR10": { "type": "percent", "value": 10, "description": "Neighbor referral discount" },
      "REFERRAL25":  { "type": "fixed",   "value": 25, "description": "Referral credit" },
      "FIRSTTIME":   { "type": "percent", "value": 15, "description": "First-time customer discount" }
    }
  }'::jsonb
)
ON CONFLICT (clerk_user_id) DO NOTHING;

-- ============================================================
-- SAMPLE: Default truck fleet
-- Replace clerk_user_id before running
-- ============================================================
INSERT INTO trucks (
  clerk_user_id,
  name,
  make,
  model,
  year,
  license_plate,
  max_cubic_yards,
  status
) VALUES
  (
    'REPLACE_WITH_YOUR_CLERK_USER_ID',
    'Big Blue',
    'Ford',
    'F-450',
    2022,
    'HTX-1001',
    14.0,
    'active'
  ),
  (
    'REPLACE_WITH_YOUR_CLERK_USER_ID',
    'The Hauler',
    'Chevrolet',
    'Silverado 3500',
    2021,
    'HTX-1002',
    14.0,
    'active'
  )
ON CONFLICT DO NOTHING;

-- ============================================================
-- SAMPLE: Default crew members
-- Replace clerk_user_id before running
-- ============================================================
INSERT INTO crew_members (
  clerk_user_id,
  name,
  email,
  phone,
  role,
  status,
  hourly_rate
) VALUES
  (
    'REPLACE_WITH_YOUR_CLERK_USER_ID',
    'Marcus Johnson',
    'marcus@haulrjunk.com',
    '(512) 555-0201',
    'lead',
    'active',
    22.00
  ),
  (
    'REPLACE_WITH_YOUR_CLERK_USER_ID',
    'Derek Williams',
    'derek@haulrjunk.com',
    '(512) 555-0202',
    'driver',
    'active',
    20.00
  ),
  (
    'REPLACE_WITH_YOUR_CLERK_USER_ID',
    'Tony Rivera',
    'tony@haulrjunk.com',
    '(512) 555-0203',
    'worker',
    'active',
    17.00
  )
ON CONFLICT DO NOTHING;
