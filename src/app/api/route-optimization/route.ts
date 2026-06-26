// =============================================================================
// POST /api/route-optimization â€” Optimize job route for a given date
// =============================================================================

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';

const RouteOptimizationSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  job_ids: z.array(z.string().uuid()).max(20).optional(),
  start_location: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      address: z.string().optional(),
    })
    .optional(),
});

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface Coordinates {
  lat: number;
  lng: number;
}

interface JobWithCoords {
  id: string;
  title: string;
  customer_name: string;
  address: string;
  scheduled_time?: string;
  coords: Coordinates | null;
  geocoded: boolean;
}

interface OptimizedStop extends JobWithCoords {
  sequence: number;
  drive_time_minutes: number;
  drive_distance_miles: number;
}

// -----------------------------------------------------------------------------
// Google Maps Geocoding
// -----------------------------------------------------------------------------

async function geocodeAddress(address: string): Promise<Coordinates | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn('[route-optimization] GOOGLE_MAPS_API_KEY not configured â€” using null coords');
    return null;
  }

  try {
    const encoded = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      status: string;
      results: Array<{ geometry: { location: { lat: number; lng: number } } }>;
    };

    if (data.status !== 'OK' || !data.results?.[0]) return null;

    return data.results[0].geometry.location;
  } catch (err) {
    console.error('[geocode] Failed for address:', address, err);
    return null;
  }
}

// -----------------------------------------------------------------------------
// Haversine distance (miles)
// -----------------------------------------------------------------------------

function haversineDistance(a: Coordinates, b: Coordinates): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// Estimate drive time: assume avg 25 mph in service area
function estimateDriveTime(miles: number): number {
  return Math.round((miles / 25) * 60);
}

// -----------------------------------------------------------------------------
// Nearest-neighbor route optimization
// -----------------------------------------------------------------------------

function nearestNeighborRoute(
  stops: JobWithCoords[],
  startCoords: Coordinates
): OptimizedStop[] {
  const stopsWithCoords = stops.filter((s) => s.coords !== null);
  const stopsWithoutCoords = stops.filter((s) => s.coords === null);

  const visited = new Set<string>();
  const route: OptimizedStop[] = [];
  let current: Coordinates = startCoords;

  while (visited.size < stopsWithCoords.length) {
    let nearest: JobWithCoords | null = null;
    let nearestDist = Infinity;

    for (const stop of stopsWithCoords) {
      if (visited.has(stop.id)) continue;
      const dist = haversineDistance(current, stop.coords!);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = stop;
      }
    }

    if (!nearest) break;

    visited.add(nearest.id);
    route.push({
      ...nearest,
      sequence: route.length + 1,
      drive_distance_miles: Math.round(nearestDist * 10) / 10,
      drive_time_minutes: estimateDriveTime(nearestDist),
    });

    current = nearest.coords!;
  }

  // Append ungeocoded stops at the end
  for (const stop of stopsWithoutCoords) {
    route.push({
      ...stop,
      sequence: route.length + 1,
      drive_distance_miles: 0,
      drive_time_minutes: 0,
    });
  }

  return route;
}

// -----------------------------------------------------------------------------
// POST handler
// -----------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: { message: 'Invalid JSON body' } }, { status: 400 });
    }

    const parsed = RouteOptimizationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: 'Validation failed', details: parsed.error.flatten().fieldErrors } },
        { status: 422 }
      );
    }

    const { date, job_ids, start_location } = parsed.data;
    const supabase = await createAdminClient();

    // Load jobs for the date
    let query = supabase
      .from('jobs')
      .select(`
        id,
        title,
        scheduled_date,
        scheduled_time,
        status,
        customers(name, address, city, state, zip)
      `)
      .eq('clerk_user_id', userId)
      .eq('scheduled_date', date)
      .in('status', ['scheduled', 'in_progress']);

    if (job_ids && job_ids.length > 0) {
      query = query.in('id', job_ids);
    }

    const { data: jobs, error: jobsError } = await query;

    if (jobsError) {
      console.error('[route-optimization]', jobsError.message);
      return NextResponse.json({ error: { message: jobsError.message } }, { status: 500 });
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({
        data: {
          date,
          optimized_route: [],
          total_stops: 0,
          total_drive_distance_miles: 0,
          total_drive_time_minutes: 0,
          note: 'No scheduled jobs found for this date.',
        },
        error: null,
      });
    }

    // Build job stop list with full address strings
    const stops: JobWithCoords[] = [];
    for (const job of jobs) {
      const customer = job.customers as unknown as Record<string, string> | null;
      const addressParts = [
        customer?.address,
        customer?.city,
        customer?.state,
        customer?.zip,
      ].filter(Boolean);
      const address = addressParts.join(', ');

      stops.push({
        id: job.id,
        title: job.title,
        customer_name: customer?.name ?? 'Unknown',
        address,
        scheduled_time: job.scheduled_time ?? undefined,
        coords: null,
        geocoded: false,
      });
    }

    // Geocode all addresses in parallel (with concurrency limit)
    const BATCH_SIZE = 5;
    for (let i = 0; i < stops.length; i += BATCH_SIZE) {
      const batch = stops.slice(i, i + BATCH_SIZE);
      const coords = await Promise.all(
        batch.map((stop) =>
          stop.address ? geocodeAddress(stop.address) : Promise.resolve(null)
        )
      );
      for (let j = 0; j < batch.length; j++) {
        batch[j].coords = coords[j];
        batch[j].geocoded = coords[j] !== null;
      }
    }

    // Geocode start location if not provided
    let startCoords: Coordinates;
    if (start_location) {
      startCoords = { lat: start_location.lat, lng: start_location.lng };
    } else {
      // Load company address from settings
      const { data: settings } = await supabase
        .from('business_settings')
        .select('address, city, state, zip')
        .eq('clerk_user_id', userId)
        .single();

      if (settings) {
        const companyAddr = [settings.address, settings.city, settings.state, settings.zip]
          .filter(Boolean)
          .join(', ');
        startCoords = (await geocodeAddress(companyAddr)) ?? { lat: 0, lng: 0 };
      } else {
        // Fallback: use centroid of job locations
        const geocodedStops = stops.filter((s) => s.coords);
        if (geocodedStops.length > 0) {
          const avgLat = geocodedStops.reduce((s, st) => s + st.coords!.lat, 0) / geocodedStops.length;
          const avgLng = geocodedStops.reduce((s, st) => s + st.coords!.lng, 0) / geocodedStops.length;
          startCoords = { lat: avgLat, lng: avgLng };
        } else {
          startCoords = { lat: 0, lng: 0 };
        }
      }
    }

    // Optimize route
    const optimizedRoute = nearestNeighborRoute(stops, startCoords);

    const totalDistance = optimizedRoute.reduce((s, stop) => s + stop.drive_distance_miles, 0);
    const totalDriveTime = optimizedRoute.reduce((s, stop) => s + stop.drive_time_minutes, 0);
    const geocodedCount = optimizedRoute.filter((s) => s.geocoded).length;

    return NextResponse.json({
      data: {
        date,
        start_location: start_location ?? null,
        optimized_route: optimizedRoute.map((stop) => ({
          sequence: stop.sequence,
          job_id: stop.id,
          title: stop.title,
          customer_name: stop.customer_name,
          address: stop.address,
          scheduled_time: stop.scheduled_time ?? null,
          coords: stop.coords,
          drive_distance_miles: stop.drive_distance_miles,
          drive_time_minutes: stop.drive_time_minutes,
          geocoded: stop.geocoded,
        })),
        total_stops: optimizedRoute.length,
        total_drive_distance_miles: Math.round(totalDistance * 10) / 10,
        total_drive_time_minutes: totalDriveTime,
        geocoded_stops: geocodedCount,
        ungeocoded_stops: optimizedRoute.length - geocodedCount,
        optimization_method: 'nearest_neighbor',
      },
      error: null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    console.error('[route-optimization] Unhandled:', msg);
    return NextResponse.json({ error: { message: msg } }, { status: 500 });
  }
}
