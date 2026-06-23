// =============================================================================
// HAULR AI ESTIMATOR — GLOBAL TYPE DEFINITIONS
// =============================================================================

// -----------------------------------------------------------------------------
// Shared primitives
// -----------------------------------------------------------------------------

export type CustomerStatus =
  | 'lead'
  | 'contacted'
  | 'quoted'
  | 'follow_up'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type LeadSource =
  | 'google'
  | 'website'
  | 'facebook'
  | 'instagram'
  | 'referral'
  | 'yard_sign'
  | 'flyer'
  | 'other';

export type JobStatus =
  | 'draft'
  | 'quoted'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type QuoteStatus =
  | 'draft'
  | 'sent'
  | 'approved'
  | 'rejected'
  | 'expired';

export type TruckStatus = 'active' | 'maintenance' | 'inactive';

export type CrewRole = 'lead' | 'worker';

export type ItemCategory =
  | 'furniture'
  | 'appliance'
  | 'electronics'
  | 'debris'
  | 'yard'
  | 'metal'
  | 'hazmat'
  | 'other';

export type LoadFraction =
  | '1/8'
  | '1/4'
  | '3/8'
  | '1/2'
  | '5/8'
  | '3/4'
  | 'full'
  | 'custom';

// -----------------------------------------------------------------------------
// Customer
// -----------------------------------------------------------------------------

export interface Customer {
  id: string;
  clerk_user_id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes?: string;
  status: CustomerStatus;
  lead_source: LeadSource;
  tags?: string[];
  total_jobs?: number;
  total_revenue?: number;
  created_at: string;
  updated_at: string;
}

// -----------------------------------------------------------------------------
// Truck
// -----------------------------------------------------------------------------

export interface Truck {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  max_cubic_yards: number;
  status: TruckStatus;
  current_location?: {
    lat: number;
    lng: number;
  };
  created_at?: string;
  updated_at?: string;
}

// -----------------------------------------------------------------------------
// Crew Member
// -----------------------------------------------------------------------------

export interface Crew {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: CrewRole;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

// -----------------------------------------------------------------------------
// AI Estimation
// -----------------------------------------------------------------------------

export interface DetectedItem {
  name: string;
  quantity: number;
  estimated_volume_cf: number;
  estimated_weight_lbs: number;
  category: ItemCategory;
  donation_potential: boolean;
  recycling_potential: boolean;
  confidence: number;
}

export interface AIEstimate {
  items_detected: DetectedItem[];
  total_cubic_yards: number;
  truck_percentage: number;
  trailer_percentage: number;
  estimated_labor_hours: number;
  estimated_dump_cost: number;
  suggested_price: number;
  suggested_profit_margin: number;
  hazard_warnings: string[];
  donation_items: string[];
  recycling_items: string[];
  confidence_score: number;
  analysis_notes: string;
}

// -----------------------------------------------------------------------------
// Load Size
// -----------------------------------------------------------------------------

export interface LoadSize {
  fraction: LoadFraction;
  cubic_yards: number;
  truck_percentage: number;
}

// -----------------------------------------------------------------------------
// Line Items
// -----------------------------------------------------------------------------

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  category:
    | 'load'
    | 'distance'
    | 'labor'
    | 'heavy_item'
    | 'stair'
    | 'specialty'
    | 'construction'
    | 'custom'
    | 'discount';
}

// -----------------------------------------------------------------------------
// Quote
// -----------------------------------------------------------------------------

export interface Quote {
  id: string;
  customer_id: string;
  job_id?: string;
  quote_number: string;
  status: QuoteStatus;

  // Load & size
  load_size: LoadSize;

  // Charges
  base_charge: number;
  load_charge: number;
  distance_charge: number;
  labor_charge: number;
  heavy_item_fees: number;
  stair_fees: number;
  specialty_fees: number;
  construction_fees: number;
  custom_fees: LineItem[];
  discounts: LineItem[];

  // Totals
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;

  // Meta
  notes?: string;
  terms?: string;
  expiry_date?: string;
  sent_at?: string;
  approved_at?: string;

  // AI
  ai_estimate?: AIEstimate;

  created_at: string;
  updated_at: string;
}

// -----------------------------------------------------------------------------
// Job
// -----------------------------------------------------------------------------

export interface Job {
  id: string;
  customer_id: string;
  quote_id?: string;
  title: string;
  description?: string;
  status: JobStatus;

  // Scheduling
  scheduled_date?: string;
  scheduled_time?: string;
  crew_ids?: string[];
  truck_id?: string;

  // Actuals (filled in after completion)
  actual_start?: string;
  actual_end?: string;
  actual_hours?: number;
  actual_dump_fee?: number;

  // Documentation
  before_photos?: string[];
  after_photos?: string[];
  customer_signature?: string;
  notes?: string;

  created_at: string;
  updated_at: string;
}

// -----------------------------------------------------------------------------
// Scheduled Job (joined)
// -----------------------------------------------------------------------------

export interface ScheduledJob extends Job {
  customer: Customer;
  truck?: Truck;
  crew?: Crew[];
  quote?: Quote;
}

// -----------------------------------------------------------------------------
// Pricing Configuration
// -----------------------------------------------------------------------------

export interface DistanceBracket {
  min_miles: number;
  max_miles: number;
  charge: number;
}

export interface StairFees {
  per_flight: number;
  max_flights: number;
}

export interface PricingConfig {
  load_prices: Record<LoadFraction | string, number>;
  distance_brackets: DistanceBracket[];
  labor_rate: number;
  stair_fees: StairFees;
  heavy_item_prices: Record<string, number>;
  difficulty_multipliers: Record<string, number>;
  specialty_fees: Record<string, number>;
  dump_base_fee: number;
  dump_per_yard: number;
}

// -----------------------------------------------------------------------------
// Business Settings
// -----------------------------------------------------------------------------

export interface BusinessSettings {
  company_name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  website?: string;
  logo_url?: string;
  tax_rate: number;
  base_price: number;
  pricing: PricingConfig;
}

// -----------------------------------------------------------------------------
// Dashboard / Analytics
// -----------------------------------------------------------------------------

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  jobs: number;
}

export interface DashboardStats {
  total_revenue: number;
  total_jobs: number;
  active_quotes: number;
  scheduled_today: number;
  conversion_rate: number;
  avg_job_value: number;
  revenue_this_month: number;
  revenue_last_month: number;
  jobs_this_month: number;
  jobs_last_month: number;
}

// -----------------------------------------------------------------------------
// API Response wrappers
// -----------------------------------------------------------------------------

export interface ApiSuccess<T> {
  data: T;
  error: null;
}

export interface ApiError {
  data: null;
  error: {
    message: string;
    code?: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// -----------------------------------------------------------------------------
// Form types
// -----------------------------------------------------------------------------

export interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes?: string;
  status: CustomerStatus;
  lead_source: LeadSource;
  tags?: string[];
}

export interface JobFormData {
  customer_id: string;
  quote_id?: string;
  title: string;
  description?: string;
  status: JobStatus;
  scheduled_date?: string;
  scheduled_time?: string;
  crew_ids?: string[];
  truck_id?: string;
  notes?: string;
}

export interface QuoteFormData {
  customer_id: string;
  load_size: LoadSize;
  base_charge: number;
  load_charge: number;
  distance_charge: number;
  labor_charge: number;
  heavy_item_fees: number;
  stair_fees: number;
  specialty_fees: number;
  construction_fees: number;
  custom_fees: LineItem[];
  discounts: LineItem[];
  tax_rate: number;
  notes?: string;
  terms?: string;
  expiry_date?: string;
}
