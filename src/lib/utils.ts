import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, isValid } from 'date-fns';

// -----------------------------------------------------------------------------
// Tailwind class merging
// -----------------------------------------------------------------------------

/**
 * Merges Tailwind CSS class names, deduplicating conflicting utilities.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// -----------------------------------------------------------------------------
// Currency formatting
// -----------------------------------------------------------------------------

/**
 * Formats a number as USD currency.
 * @example formatCurrency(1234.5) // "$1,234.50"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// -----------------------------------------------------------------------------
// Date formatting
// -----------------------------------------------------------------------------

/**
 * Formats an ISO date string or Date object into "MMM d, yyyy" (e.g. "Jan 5, 2025").
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';

  const d = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(d)) return '—';

  return format(d, 'MMM d, yyyy');
}

/**
 * Formats an ISO date string or Date object into "MMM d, yyyy h:mm a".
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';

  const d = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(d)) return '—';

  return format(d, 'MMM d, yyyy h:mm a');
}

/**
 * Formats a 24-hour time string "HH:mm" into "h:mm a" (e.g. "14:30" → "2:30 PM").
 */
export function formatTime(time: string | null | undefined): string {
  if (!time) return '—';

  const [hours, minutes] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);

  return format(d, 'h:mm a');
}

// -----------------------------------------------------------------------------
// Phone formatting
// -----------------------------------------------------------------------------

/**
 * Formats a raw phone string into (###) ###-#### US format.
 * Strips all non-digit characters first.
 * @example formatPhone("5555551234") // "(555) 555-1234"
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '—';

  const digits = phone.replace(/\D/g, '');

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  if (digits.length === 11 && digits[0] === '1') {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  // Return as-is if it doesn't match a recognizable pattern
  return phone;
}

// -----------------------------------------------------------------------------
// Distance calculation (Google Maps Distance Matrix API)
// -----------------------------------------------------------------------------

export interface DistanceResult {
  distance_miles: number;
  duration_minutes: number;
  distance_text: string;
  duration_text: string;
}

/**
 * Calculates driving distance and duration between two addresses using the
 * Google Maps Distance Matrix API (server-side via fetch).
 * Requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to be set.
 */
export async function calculateDistance(
  origin: string,
  destination: string
): Promise<DistanceResult> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not configured');
  }

  const params = new URLSearchParams({
    origins: origin,
    destinations: destination,
    units: 'imperial',
    key: apiKey,
  });

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?${params.toString()}`;

  const res = await fetch(url, { cache: 'no-store' });

  if (!res.ok) {
    throw new Error(`Distance Matrix API error: ${res.statusText}`);
  }

  const json = await res.json();

  if (json.status !== 'OK') {
    throw new Error(`Distance Matrix API returned status: ${json.status}`);
  }

  const element = json?.rows?.[0]?.elements?.[0];

  if (!element || element.status !== 'OK') {
    throw new Error(
      `No route found between "${origin}" and "${destination}"`
    );
  }

  // Distance Matrix returns meters; convert to miles
  const meters: number = element.distance.value;
  const seconds: number = element.duration.value;

  return {
    distance_miles: Math.round((meters / 1609.344) * 10) / 10,
    duration_minutes: Math.round(seconds / 60),
    distance_text: element.distance.text,
    duration_text: element.duration.text,
  };
}

// -----------------------------------------------------------------------------
// Quote number generation
// -----------------------------------------------------------------------------

/**
 * Generates a unique quote number in the format HLR-YYYYMMDD-XXXX where XXXX
 * is a random 4-digit number.
 * @example generateQuoteNumber() // "HLR-20250115-4823"
 */
export function generateQuoteNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);

  return `HLR-${year}${month}${day}-${rand}`;
}

// -----------------------------------------------------------------------------
// Status helpers
// -----------------------------------------------------------------------------

type StatusColorMap = Record<string, string>;

const STATUS_COLORS: StatusColorMap = {
  // Customer statuses
  lead:        'bg-gray-100 text-gray-700',
  contacted:   'bg-blue-100 text-blue-700',
  quoted:      'bg-purple-100 text-purple-700',
  follow_up:   'bg-yellow-100 text-yellow-700',
  scheduled:   'bg-indigo-100 text-indigo-700',
  in_progress: 'bg-orange-100 text-orange-700',
  completed:   'bg-green-100 text-green-700',
  cancelled:   'bg-red-100 text-red-700',

  // Quote statuses
  draft:    'bg-gray-100 text-gray-700',
  sent:     'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  expired:  'bg-yellow-100 text-yellow-700',

  // Truck statuses
  active:      'bg-green-100 text-green-700',
  maintenance: 'bg-yellow-100 text-yellow-700',
  inactive:    'bg-gray-100 text-gray-700',
};

/**
 * Returns a Tailwind CSS class string for a given status badge.
 */
export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700';
}

const STATUS_LABELS: Record<string, string> = {
  lead:        'Lead',
  contacted:   'Contacted',
  quoted:      'Quoted',
  follow_up:   'Follow Up',
  scheduled:   'Scheduled',
  in_progress: 'In Progress',
  completed:   'Completed',
  cancelled:   'Cancelled',
  draft:       'Draft',
  sent:        'Sent',
  approved:    'Approved',
  rejected:    'Rejected',
  expired:     'Expired',
  active:      'Active',
  maintenance: 'Maintenance',
  inactive:    'Inactive',
};

/**
 * Returns a human-readable label for a given status key.
 */
export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

// -----------------------------------------------------------------------------
// Misc helpers
// -----------------------------------------------------------------------------

/**
 * Truncates a string to `maxLength` characters, appending "…" if truncated.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + '…';
}

/**
 * Converts bytes to a human-readable file size string.
 * @example formatFileSize(1536000) // "1.5 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Clamps a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Converts cubic feet to cubic yards.
 */
export function cfToYards(cf: number): number {
  return Math.round((cf / 27) * 100) / 100;
}

/**
 * Converts cubic yards to a truck percentage (assumes 15-yard truck).
 */
export function yardsToTruckPercent(yards: number, truckCapacity = 15): number {
  return Math.round((yards / truckCapacity) * 100);
}
