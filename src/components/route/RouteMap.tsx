'use client';

/// <reference types="@types/google.maps" />

import React, { useEffect, useRef, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { cn } from '@/lib/utils';
import type { ScheduledJob } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RouteStop {
  job: ScheduledJob;
  stopNumber: number;
  eta?: string;
  distanceFromPrev?: string;
}

interface RouteMapProps {
  stops: RouteStop[];
  className?: string;
  apiKey?: string;
}

// ---------------------------------------------------------------------------
// Stop colors
// ---------------------------------------------------------------------------

const STOP_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F43F5E', '#6366F1',
];

function getStopColor(index: number): string {
  return STOP_COLORS[index % STOP_COLORS.length];
}

// ---------------------------------------------------------------------------
// Custom marker SVG
// ---------------------------------------------------------------------------

function createMarkerSvg(number: number, color: string): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
      <path d="M18 0C8.06 0 0 8.06 0 18c0 12 18 26 18 26S36 30 36 18C36 8.06 27.94 0 18 0z" fill="${color}" />
      <circle cx="18" cy="18" r="10" fill="white"/>
      <text x="18" y="23" font-family="Arial,sans-serif" font-size="${number >= 10 ? '10' : '12'}" font-weight="bold" fill="${color}" text-anchor="middle">${number}</text>
    </svg>
  `;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RouteMap({ stops, className, apiKey }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const effectiveKey = apiKey ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

  const clearMap = useCallback(() => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
  }, []);

  const buildMap = useCallback(async () => {
    if (!mapRef.current || !effectiveKey) return;

    // Initialize map once
    if (!mapInstanceRef.current) {
      const loader = new Loader({
        apiKey: effectiveKey,
        version: 'weekly',
        libraries: ['geometry'],
      });
      await loader.load();

      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        zoom: 11,
        center: { lat: 30.2672, lng: -97.7431 }, // Default: Austin TX
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        styles: [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        ],
      });

      infoWindowRef.current = new google.maps.InfoWindow();
    }

    clearMap();

    const map = mapInstanceRef.current;
    const bounds = new google.maps.LatLngBounds();
    const path: google.maps.LatLngLiteral[] = [];

    // Geocode each stop by address (or use coordinates if available)
    const geocoder = new google.maps.Geocoder();

    const geocodeStop = (stop: RouteStop): Promise<google.maps.LatLngLiteral | null> =>
      new Promise((resolve) => {
        const addr = stop.job.customer?.address
          ? `${stop.job.customer.address}, ${stop.job.customer.city}, ${stop.job.customer.state} ${stop.job.customer.zip}`
          : '';
        if (!addr) { resolve(null); return; }
        geocoder.geocode({ address: addr }, (results, status) => {
          if (status === 'OK' && results?.[0]) {
            const loc = results[0].geometry.location;
            resolve({ lat: loc.lat(), lng: loc.lng() });
          } else {
            resolve(null);
          }
        });
      });

    const positions = await Promise.all(stops.map(geocodeStop));

    stops.forEach((stop, idx) => {
      const pos = positions[idx];
      if (!pos) return;

      bounds.extend(pos);
      path.push(pos);

      const color = getStopColor(idx);
      const svgContent = createMarkerSvg(stop.stopNumber, color);

      const marker = new google.maps.Marker({
        position: pos,
        map,
        title: stop.job.customer?.name ?? `Stop ${stop.stopNumber}`,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgContent)}`,
          scaledSize: new google.maps.Size(36, 44),
          anchor: new google.maps.Point(18, 44),
        },
        zIndex: 100 - idx,
      });

      // Info window content
      const customer = stop.job.customer;
      const content = `
        <div style="font-family:sans-serif;min-width:200px;padding:4px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <div style="width:28px;height:28px;border-radius:50%;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;flex-shrink:0">${stop.stopNumber}</div>
            <div>
              <div style="font-weight:600;font-size:14px;color:#111">${customer?.name ?? 'Unknown'}</div>
              <div style="font-size:12px;color:#6B7280">${stop.job.title}</div>
            </div>
          </div>
          ${customer?.address ? `<div style="font-size:12px;color:#374151;margin-bottom:6px">📍 ${customer.address}, ${customer.city}</div>` : ''}
          ${stop.eta ? `<div style="font-size:12px;color:#374151;margin-bottom:4px">🕐 ETA: ${stop.eta}</div>` : ''}
          ${stop.distanceFromPrev ? `<div style="font-size:12px;color:#374151;margin-bottom:4px">📏 ${stop.distanceFromPrev} from prev stop</div>` : ''}
          ${stop.job.scheduled_time ? `<div style="font-size:12px;color:#374151">⏱ Scheduled: ${stop.job.scheduled_time}</div>` : ''}
          <div style="margin-top:8px">
            <a href="/jobs/${stop.job.id}" style="color:#F97316;font-size:12px;font-weight:600;text-decoration:none">View Job →</a>
          </div>
        </div>
      `;

      marker.addListener('click', () => {
        infoWindowRef.current?.setContent(content);
        infoWindowRef.current?.open(map, marker);
      });

      markersRef.current.push(marker);
    });

    // Draw route polyline
    if (path.length > 1) {
      polylineRef.current = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#F97316',
        strokeOpacity: 0.85,
        strokeWeight: 3,
        map,
      });
    }

    // Fit bounds
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { top: 60, right: 40, bottom: 40, left: 40 });
    }
  }, [stops, effectiveKey, clearMap]);

  useEffect(() => {
    buildMap();
  }, [buildMap]);

  if (!effectiveKey) {
    return (
      <div className={cn('bg-gray-100 rounded-xl flex items-center justify-center', className ?? 'h-96')}>
        <div className="text-center">
          <p className="text-gray-500 text-sm font-medium">Google Maps API key not configured</p>
          <p className="text-gray-400 text-xs mt-1">Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative rounded-xl overflow-hidden shadow-sm border border-gray-100', className ?? 'h-96')}>
      <div ref={mapRef} className="w-full h-full" />

      {/* Legend */}
      {stops.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md border border-gray-100 px-3 py-2">
          <p className="text-xs font-semibold text-gray-700 mb-1.5">Route Legend</p>
          <div className="space-y-1">
            {stops.slice(0, 5).map((stop, idx) => (
              <div key={stop.job.id} className="flex items-center gap-2">
                <div
                  className="h-5 w-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                  style={{ background: getStopColor(idx) }}
                >
                  {stop.stopNumber}
                </div>
                <span className="text-xs text-gray-600 truncate max-w-[120px]">
                  {stop.job.customer?.name ?? `Stop ${stop.stopNumber}`}
                </span>
              </div>
            ))}
            {stops.length > 5 && (
              <p className="text-xs text-gray-400">+{stops.length - 5} more stops</p>
            )}
          </div>
        </div>
      )}

      {stops.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80">
          <p className="text-gray-500 text-sm font-medium">No stops to display</p>
        </div>
      )}
    </div>
  );
}
