import type {
  LoadFraction,
  PricingConfig,
  ItemCategory,
} from '@/types';

// =============================================================================
// HAULR AI ESTIMATOR — APPLICATION CONSTANTS
// =============================================================================

// -----------------------------------------------------------------------------
// Load Sizes
// -----------------------------------------------------------------------------

export interface LoadSizeOption {
  fraction: LoadFraction;
  label: string;
  description: string;
  cubic_yards: number;
  truck_percentage: number;
}

export const LOAD_SIZES: LoadSizeOption[] = [
  {
    fraction: '1/8',
    label: '1/8 Truck Load',
    description: 'A few small items — fits in the back of a pickup',
    cubic_yards: 1.875,
    truck_percentage: 12.5,
  },
  {
    fraction: '1/4',
    label: '1/4 Truck Load',
    description: 'Several boxes, small furniture, or yard debris',
    cubic_yards: 3.75,
    truck_percentage: 25,
  },
  {
    fraction: '3/8',
    label: '3/8 Truck Load',
    description: 'Medium room worth of items or a garage cleanout',
    cubic_yards: 5.625,
    truck_percentage: 37.5,
  },
  {
    fraction: '1/2',
    label: '1/2 Truck Load',
    description: 'Full room, small apartment, or large cleanout',
    cubic_yards: 7.5,
    truck_percentage: 50,
  },
  {
    fraction: '5/8',
    label: '5/8 Truck Load',
    description: 'Large room or multiple areas of a house',
    cubic_yards: 9.375,
    truck_percentage: 62.5,
  },
  {
    fraction: '3/4',
    label: '3/4 Truck Load',
    description: 'Most of a full home or large commercial space',
    cubic_yards: 11.25,
    truck_percentage: 75,
  },
  {
    fraction: 'full',
    label: 'Full Truck Load',
    description: 'Complete home, estate, or major commercial job',
    cubic_yards: 15,
    truck_percentage: 100,
  },
  {
    fraction: 'custom',
    label: 'Custom Amount',
    description: 'Specify exact cubic yards for precise pricing',
    cubic_yards: 0,
    truck_percentage: 0,
  },
];

// -----------------------------------------------------------------------------
// Item Categories
// -----------------------------------------------------------------------------

export interface ItemCategoryOption {
  value: ItemCategory;
  label: string;
  icon: string;
  donation_likely: boolean;
  recycling_likely: boolean;
}

export const ITEM_CATEGORIES: ItemCategoryOption[] = [
  { value: 'furniture',    label: 'Furniture',    icon: '🛋️',  donation_likely: true,  recycling_likely: false },
  { value: 'appliance',   label: 'Appliances',   icon: '🫙',  donation_likely: true,  recycling_likely: true  },
  { value: 'electronics', label: 'Electronics',  icon: '💻',  donation_likely: false, recycling_likely: true  },
  { value: 'debris',      label: 'Debris/Trash', icon: '🗑️',  donation_likely: false, recycling_likely: false },
  { value: 'yard',        label: 'Yard Waste',   icon: '🌿',  donation_likely: false, recycling_likely: true  },
  { value: 'metal',       label: 'Scrap Metal',  icon: '⚙️',  donation_likely: false, recycling_likely: true  },
  { value: 'hazmat',      label: 'Hazardous',    icon: '⚠️',  donation_likely: false, recycling_likely: false },
  { value: 'other',       label: 'Other',        icon: '📦',  donation_likely: false, recycling_likely: false },
];

// -----------------------------------------------------------------------------
// Heavy Items
// -----------------------------------------------------------------------------

export interface HeavyItem {
  id: string;
  name: string;
  default_price: number;
  estimated_weight_lbs: number;
  estimated_volume_cf: number;
  category: ItemCategory;
  donation_potential: boolean;
  recycling_potential: boolean;
}

export const HEAVY_ITEMS: HeavyItem[] = [
  { id: 'piano_upright',    name: 'Piano (Upright)',     default_price: 150, estimated_weight_lbs: 500, estimated_volume_cf: 25, category: 'furniture',  donation_potential: true,  recycling_potential: false },
  { id: 'piano_grand',      name: 'Piano (Grand)',       default_price: 300, estimated_weight_lbs: 900, estimated_volume_cf: 50, category: 'furniture',  donation_potential: false, recycling_potential: false },
  { id: 'hot_tub',          name: 'Hot Tub / Spa',       default_price: 300, estimated_weight_lbs: 800, estimated_volume_cf: 60, category: 'other',      donation_potential: false, recycling_potential: true  },
  { id: 'pool_table',       name: 'Pool Table',          default_price: 175, estimated_weight_lbs: 700, estimated_volume_cf: 40, category: 'furniture',  donation_potential: false, recycling_potential: false },
  { id: 'safe_small',       name: 'Safe (small)',        default_price: 75,  estimated_weight_lbs: 200, estimated_volume_cf: 4,  category: 'other',      donation_potential: false, recycling_potential: true  },
  { id: 'safe_large',       name: 'Safe (large/gun)',    default_price: 200, estimated_weight_lbs: 600, estimated_volume_cf: 12, category: 'other',      donation_potential: false, recycling_potential: true  },
  { id: 'refrigerator',     name: 'Refrigerator',        default_price: 50,  estimated_weight_lbs: 250, estimated_volume_cf: 22, category: 'appliance',  donation_potential: true,  recycling_potential: true  },
  { id: 'freezer',          name: 'Freezer (Chest)',     default_price: 50,  estimated_weight_lbs: 200, estimated_volume_cf: 18, category: 'appliance',  donation_potential: true,  recycling_potential: true  },
  { id: 'washer',           name: 'Washer',              default_price: 40,  estimated_weight_lbs: 170, estimated_volume_cf: 12, category: 'appliance',  donation_potential: true,  recycling_potential: true  },
  { id: 'dryer',            name: 'Dryer',               default_price: 40,  estimated_weight_lbs: 130, estimated_volume_cf: 12, category: 'appliance',  donation_potential: true,  recycling_potential: true  },
  { id: 'stove',            name: 'Stove / Range',       default_price: 40,  estimated_weight_lbs: 150, estimated_volume_cf: 10, category: 'appliance',  donation_potential: true,  recycling_potential: true  },
  { id: 'dishwasher',       name: 'Dishwasher',          default_price: 40,  estimated_weight_lbs: 90,  estimated_volume_cf: 8,  category: 'appliance',  donation_potential: true,  recycling_potential: true  },
  { id: 'ac_window',        name: 'AC (Window Unit)',    default_price: 35,  estimated_weight_lbs: 70,  estimated_volume_cf: 4,  category: 'appliance',  donation_potential: false, recycling_potential: true  },
  { id: 'ac_central',       name: 'AC (Central Unit)',   default_price: 100, estimated_weight_lbs: 250, estimated_volume_cf: 12, category: 'appliance',  donation_potential: false, recycling_potential: true  },
  { id: 'treadmill',        name: 'Treadmill',           default_price: 75,  estimated_weight_lbs: 280, estimated_volume_cf: 20, category: 'other',      donation_potential: true,  recycling_potential: false },
  { id: 'elliptical',       name: 'Elliptical Machine',  default_price: 75,  estimated_weight_lbs: 200, estimated_volume_cf: 18, category: 'other',      donation_potential: true,  recycling_potential: false },
  { id: 'mattress_king',    name: 'Mattress (King)',      default_price: 35,  estimated_weight_lbs: 130, estimated_volume_cf: 30, category: 'furniture',  donation_potential: false, recycling_potential: false },
  { id: 'mattress_queen',   name: 'Mattress (Queen)',     default_price: 30,  estimated_weight_lbs: 100, estimated_volume_cf: 22, category: 'furniture',  donation_potential: false, recycling_potential: false },
  { id: 'mattress_twin',    name: 'Mattress (Twin)',      default_price: 25,  estimated_weight_lbs: 60,  estimated_volume_cf: 15, category: 'furniture',  donation_potential: false, recycling_potential: false },
  { id: 'tv_large',         name: 'TV (50"+)',            default_price: 40,  estimated_weight_lbs: 80,  estimated_volume_cf: 10, category: 'electronics', donation_potential: false, recycling_potential: true  },
];

// -----------------------------------------------------------------------------
// Specialty Items
// -----------------------------------------------------------------------------

export interface SpecialtyItem {
  id: string;
  name: string;
  default_price: number;
  requires_permit: boolean;
  hazmat: boolean;
  notes?: string;
}

export const SPECIALTY_ITEMS: SpecialtyItem[] = [
  { id: 'paint_cans',         name: 'Paint Cans (per can)',         default_price: 10,  requires_permit: false, hazmat: true,  notes: 'Latex only; no oil-based' },
  { id: 'propane_tank_small', name: 'Propane Tank (small, <20lb)',  default_price: 25,  requires_permit: false, hazmat: true  },
  { id: 'propane_tank_large', name: 'Propane Tank (large, 100lb+)', default_price: 75,  requires_permit: true,  hazmat: true  },
  { id: 'motor_oil',          name: 'Motor Oil (per gallon)',        default_price: 15,  requires_permit: false, hazmat: true  },
  { id: 'batteries_car',      name: 'Car Battery',                  default_price: 15,  requires_permit: false, hazmat: true  },
  { id: 'batteries_lead',     name: 'Lead-Acid Battery',            default_price: 20,  requires_permit: false, hazmat: true  },
  { id: 'fluorescent_tubes',  name: 'Fluorescent Tubes (per box)',  default_price: 25,  requires_permit: false, hazmat: true,  notes: 'Contains mercury' },
  { id: 'crt_monitor',        name: 'CRT Monitor / TV',             default_price: 30,  requires_permit: false, hazmat: true  },
  { id: 'tire_car',           name: 'Tire (car, per tire)',          default_price: 15,  requires_permit: false, hazmat: false },
  { id: 'tire_truck',         name: 'Tire (truck, per tire)',        default_price: 25,  requires_permit: false, hazmat: false },
  { id: 'shed_small',         name: 'Shed Demolition (small)',       default_price: 250, requires_permit: false, hazmat: false },
  { id: 'shed_large',         name: 'Shed Demolition (large)',       default_price: 500, requires_permit: false, hazmat: false },
  { id: 'deck_small',         name: 'Deck Demolition (small)',       default_price: 400, requires_permit: true,  hazmat: false },
  { id: 'deck_large',         name: 'Deck Demolition (large)',       default_price: 800, requires_permit: true,  hazmat: false },
  { id: 'fence_wood',         name: 'Fence Removal (per 10ft)',      default_price: 50,  requires_permit: false, hazmat: false },
];

// -----------------------------------------------------------------------------
// Construction / C&D Items
// -----------------------------------------------------------------------------

export interface ConstructionItem {
  id: string;
  name: string;
  unit: string;
  default_price_per_unit: number;
  estimated_weight_lbs_per_unit: number;
  estimated_volume_cf_per_unit: number;
}

export const CONSTRUCTION_ITEMS: ConstructionItem[] = [
  { id: 'concrete',       name: 'Concrete / Asphalt',  unit: 'ton',      default_price_per_unit: 175, estimated_weight_lbs_per_unit: 2000, estimated_volume_cf_per_unit: 13  },
  { id: 'brick',          name: 'Brick / Block',       unit: 'ton',      default_price_per_unit: 175, estimated_weight_lbs_per_unit: 2000, estimated_volume_cf_per_unit: 18  },
  { id: 'dirt',           name: 'Dirt / Soil',         unit: 'yard',     default_price_per_unit: 80,  estimated_weight_lbs_per_unit: 2700, estimated_volume_cf_per_unit: 27  },
  { id: 'gravel',         name: 'Gravel / Rock',       unit: 'yard',     default_price_per_unit: 90,  estimated_weight_lbs_per_unit: 2800, estimated_volume_cf_per_unit: 27  },
  { id: 'drywall',        name: 'Drywall',             unit: 'sheet',    default_price_per_unit: 5,   estimated_weight_lbs_per_unit: 54,   estimated_volume_cf_per_unit: 4   },
  { id: 'lumber_2x4',     name: 'Lumber (2x4)',        unit: 'board',    default_price_per_unit: 1,   estimated_weight_lbs_per_unit: 4,    estimated_volume_cf_per_unit: 0.2 },
  { id: 'roofing_bundle', name: 'Shingles',            unit: 'bundle',   default_price_per_unit: 15,  estimated_weight_lbs_per_unit: 80,   estimated_volume_cf_per_unit: 3   },
  { id: 'carpet',         name: 'Carpet',              unit: 'sq_yard',  default_price_per_unit: 3,   estimated_weight_lbs_per_unit: 5,    estimated_volume_cf_per_unit: 0.5 },
  { id: 'flooring',       name: 'Hardwood / Tile',     unit: 'sq_foot',  default_price_per_unit: 1.5, estimated_weight_lbs_per_unit: 4,    estimated_volume_cf_per_unit: 0.1 },
  { id: 'scrap_metal',    name: 'Scrap Metal',         unit: 'lb',       default_price_per_unit: 0.1, estimated_weight_lbs_per_unit: 1,    estimated_volume_cf_per_unit: 0.01},
];

// -----------------------------------------------------------------------------
// Difficulty Levels
// -----------------------------------------------------------------------------

export interface DifficultyLevel {
  id: string;
  label: string;
  description: string;
  multiplier: number;
}

export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  {
    id: 'standard',
    label: 'Standard Access',
    description: 'Ground floor, easy driveway access, no obstacles',
    multiplier: 1.0,
  },
  {
    id: 'moderate',
    label: 'Moderate Difficulty',
    description: 'Some stairs, narrow hallways, or moderate clutter',
    multiplier: 1.2,
  },
  {
    id: 'difficult',
    label: 'Difficult Access',
    description: 'Multiple flights of stairs, tight spaces, or heavy clutter',
    multiplier: 1.4,
  },
  {
    id: 'extreme',
    label: 'Extreme Difficulty',
    description: 'Hoarding situation, basement/attic only access, or major obstacles',
    multiplier: 1.7,
  },
];

// -----------------------------------------------------------------------------
// Stair Fee Options
// -----------------------------------------------------------------------------

export interface StairFeeOption {
  id: string;
  label: string;
  flights: number;
  default_fee: number;
}

export const STAIR_FEE_OPTIONS: StairFeeOption[] = [
  { id: 'none',     label: 'No Stairs (Ground Level)', flights: 0, default_fee: 0   },
  { id: 'flight_1', label: '1 Flight (6–15 steps)',     flights: 1, default_fee: 25  },
  { id: 'flight_2', label: '2 Flights (16–25 steps)',   flights: 2, default_fee: 50  },
  { id: 'flight_3', label: '3 Flights (26–35 steps)',   flights: 3, default_fee: 75  },
  { id: 'flight_4', label: '4+ Flights (36+ steps)',    flights: 4, default_fee: 100 },
];

// -----------------------------------------------------------------------------
// Lead Sources
// -----------------------------------------------------------------------------

export interface LeadSourceOption {
  value: string;
  label: string;
  icon?: string;
}

export const LEAD_SOURCES: LeadSourceOption[] = [
  { value: 'google',    label: 'Google Search',      icon: '🔍' },
  { value: 'website',   label: 'Website',            icon: '🌐' },
  { value: 'facebook',  label: 'Facebook',           icon: '📘' },
  { value: 'instagram', label: 'Instagram',          icon: '📸' },
  { value: 'referral',  label: 'Customer Referral',  icon: '🤝' },
  { value: 'yard_sign', label: 'Yard Sign',          icon: '🪧' },
  { value: 'flyer',     label: 'Flyer / Mailer',     icon: '📄' },
  { value: 'other',     label: 'Other',              icon: '❓' },
];

// -----------------------------------------------------------------------------
// Job Statuses
// -----------------------------------------------------------------------------

export interface StatusOption {
  value: string;
  label: string;
  color: string;         // Tailwind background + text
  dotColor: string;      // Tailwind bg for status dot
  description: string;
}

export const JOB_STATUSES: StatusOption[] = [
  {
    value: 'draft',
    label: 'Draft',
    color: 'bg-gray-100 text-gray-700',
    dotColor: 'bg-gray-400',
    description: 'Quote or job created but not yet sent',
  },
  {
    value: 'quoted',
    label: 'Quoted',
    color: 'bg-purple-100 text-purple-700',
    dotColor: 'bg-purple-400',
    description: 'Quote sent to customer, awaiting response',
  },
  {
    value: 'scheduled',
    label: 'Scheduled',
    color: 'bg-indigo-100 text-indigo-700',
    dotColor: 'bg-indigo-400',
    description: 'Job confirmed and on the calendar',
  },
  {
    value: 'in_progress',
    label: 'In Progress',
    color: 'bg-orange-100 text-orange-700',
    dotColor: 'bg-orange-400',
    description: 'Crew is currently on site',
  },
  {
    value: 'completed',
    label: 'Completed',
    color: 'bg-green-100 text-green-700',
    dotColor: 'bg-green-500',
    description: 'Job finished and closed out',
  },
  {
    value: 'cancelled',
    label: 'Cancelled',
    color: 'bg-red-100 text-red-700',
    dotColor: 'bg-red-400',
    description: 'Job or quote cancelled',
  },
];

export const CUSTOMER_STATUSES: StatusOption[] = [
  {
    value: 'lead',
    label: 'Lead',
    color: 'bg-gray-100 text-gray-700',
    dotColor: 'bg-gray-400',
    description: 'New contact, not yet reached',
  },
  {
    value: 'contacted',
    label: 'Contacted',
    color: 'bg-blue-100 text-blue-700',
    dotColor: 'bg-blue-400',
    description: 'Made first contact',
  },
  {
    value: 'quoted',
    label: 'Quoted',
    color: 'bg-purple-100 text-purple-700',
    dotColor: 'bg-purple-400',
    description: 'Quote sent to customer',
  },
  {
    value: 'follow_up',
    label: 'Follow Up',
    color: 'bg-yellow-100 text-yellow-700',
    dotColor: 'bg-yellow-400',
    description: 'Needs follow-up contact',
  },
  {
    value: 'scheduled',
    label: 'Scheduled',
    color: 'bg-indigo-100 text-indigo-700',
    dotColor: 'bg-indigo-400',
    description: 'Job scheduled',
  },
  {
    value: 'in_progress',
    label: 'In Progress',
    color: 'bg-orange-100 text-orange-700',
    dotColor: 'bg-orange-400',
    description: 'Job currently underway',
  },
  {
    value: 'completed',
    label: 'Completed',
    color: 'bg-green-100 text-green-700',
    dotColor: 'bg-green-500',
    description: 'Job(s) complete',
  },
  {
    value: 'cancelled',
    label: 'Cancelled',
    color: 'bg-red-100 text-red-700',
    dotColor: 'bg-red-400',
    description: 'Customer cancelled or lost',
  },
];

// -----------------------------------------------------------------------------
// Default Pricing Configuration
// -----------------------------------------------------------------------------

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  load_prices: {
    '1/8':    99,
    '1/4':   159,
    '3/8':   229,
    '1/2':   299,
    '5/8':   369,
    '3/4':   439,
    'full':  599,
    'custom': 0,
  },
  distance_brackets: [
    { min_miles: 0,   max_miles: 10,  charge: 0   },
    { min_miles: 11,  max_miles: 20,  charge: 25  },
    { min_miles: 21,  max_miles: 30,  charge: 50  },
    { min_miles: 31,  max_miles: 50,  charge: 75  },
    { min_miles: 51,  max_miles: 999, charge: 125 },
  ],
  labor_rate: 75, // per man-hour
  stair_fees: {
    per_flight: 25,
    max_flights: 4,
  },
  heavy_item_prices: {
    piano_upright:    150,
    piano_grand:      300,
    hot_tub:          300,
    pool_table:       175,
    safe_small:        75,
    safe_large:       200,
    refrigerator:      50,
    freezer:           50,
    washer:            40,
    dryer:             40,
    stove:             40,
    dishwasher:        40,
    ac_window:         35,
    ac_central:       100,
    treadmill:         75,
    elliptical:        75,
    mattress_king:     35,
    mattress_queen:    30,
    mattress_twin:     25,
    tv_large:          40,
  },
  difficulty_multipliers: {
    standard:  1.0,
    moderate:  1.2,
    difficult: 1.4,
    extreme:   1.7,
  },
  specialty_fees: {
    paint_cans:          10,
    propane_tank_small:  25,
    propane_tank_large:  75,
    motor_oil:           15,
    batteries_car:       15,
    batteries_lead:      20,
    fluorescent_tubes:   25,
    crt_monitor:         30,
    tire_car:            15,
    tire_truck:          25,
    shed_small:         250,
    shed_large:         500,
    deck_small:         400,
    deck_large:         800,
    fence_wood:          50,
  },
  dump_base_fee:   60,  // Minimum dump fee
  dump_per_yard:   15,  // Additional cost per cubic yard at dump
};

// -----------------------------------------------------------------------------
// App-wide limits & configuration
// -----------------------------------------------------------------------------

export const APP_CONFIG = {
  max_photo_size_mb:         20,
  max_photos_per_job:        30,
  accepted_image_types:      ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
  quote_expiry_days:         30,
  default_tax_rate:           0.0825, // 8.25%
  default_truck_capacity_cy: 15,
  max_crew_per_job:           6,
  pagination_page_size:      25,
} as const;
