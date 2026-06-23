'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSupabase } from './useSupabase';
import { DEFAULT_PRICING_CONFIG } from '@/lib/constants';
import type { PricingConfig } from '@/types';

// =============================================================================
// TYPES
// =============================================================================

export interface BusinessSettings {
  id: string;
  clerk_user_id: string;
  business_name: string;
  business_phone: string | null;
  business_email: string | null;
  business_address: string | null;
  business_city: string | null;
  business_state: string | null;
  business_zip: string | null;
  dump_site_address: string | null;
  logo_url: string | null;
  pricing_config: PricingConfig;
  default_tax_rate: number;
  created_at: string;
  updated_at: string;
}

export type PartialBusinessSettings = Partial<Omit<BusinessSettings, 'id' | 'clerk_user_id' | 'created_at'>>;

export interface UseBusinessSettingsReturn {
  settings: BusinessSettings | null;
  loading: boolean;
  error: string | null;
  /** Refresh the settings from the database */
  refetch: () => Promise<void>;
  /** Optimistically update and persist a subset of settings */
  update: (patch: PartialBusinessSettings) => Promise<void>;
}

// =============================================================================
// MODULE-LEVEL CACHE
// Prevents duplicate fetches when multiple components mount simultaneously.
// =============================================================================

interface CacheEntry {
  data: BusinessSettings;
  fetchedAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const settingsCache = new Map<string, CacheEntry>();

function isCacheValid(entry: CacheEntry): boolean {
  return Date.now() - entry.fetchedAt < CACHE_TTL_MS;
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * useBusinessSettings
 *
 * Fetches and caches the current authenticated user's business settings row.
 * Falls back to sensible defaults (including DEFAULT_PRICING_CONFIG) if no
 * row exists yet, and creates one automatically on first call.
 *
 * @example
 * const { settings, loading, update } = useBusinessSettings();
 *
 * if (loading) return <Spinner />;
 *
 * // Read a field:
 * const name = settings?.business_name ?? 'My Business';
 *
 * // Update a field:
 * await update({ business_name: 'HAULR Pro' });
 */
export function useBusinessSettings(): UseBusinessSettingsReturn {
  const supabase = useSupabase();

  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Store the current user ID so we can cache per-user
  const userIdRef = useRef<string | null>(null);

  // ---- Fetch ----
  const fetchSettings = useCallback(async (): Promise<void> => {
    setError(null);

    try {
      // 1. Get current user
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr || !user) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      userIdRef.current = user.id;

      // 2. Check module-level cache
      const cached = settingsCache.get(user.id);
      if (cached && isCacheValid(cached)) {
        setSettings(cached.data);
        setLoading(false);
        return;
      }

      // 3. Fetch from Supabase
      const { data, error: fetchErr } = await supabase
        .from('business_settings')
        .select('*')
        .eq('clerk_user_id', user.id)
        .single();

      if (fetchErr) {
        // PGRST116 = no rows found — create a default record
        if (fetchErr.code === 'PGRST116') {
          const defaultRow: Omit<BusinessSettings, 'id' | 'created_at' | 'updated_at'> = {
            clerk_user_id:    user.id,
            business_name:    '',
            business_phone:   null,
            business_email:   user.email ?? null,
            business_address: null,
            business_city:    null,
            business_state:   null,
            business_zip:     null,
            dump_site_address: null,
            logo_url:         null,
            pricing_config:   DEFAULT_PRICING_CONFIG,
            default_tax_rate: 0.0825,
          };

          const { data: created, error: createErr } = await supabase
            .from('business_settings')
            .insert(defaultRow)
            .select()
            .single();

          if (createErr) throw new Error(createErr.message);

          const row = created as BusinessSettings;
          settingsCache.set(user.id, { data: row, fetchedAt: Date.now() });
          setSettings(row);
        } else {
          throw new Error(fetchErr.message);
        }
      } else {
        const row = data as BusinessSettings;
        settingsCache.set(user.id, { data: row, fetchedAt: Date.now() });
        setSettings(row);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load business settings';
      setError(message);
      console.error('[useBusinessSettings] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // ---- Update ----
  const update = useCallback(
    async (patch: PartialBusinessSettings): Promise<void> => {
      if (!settings) throw new Error('Settings not loaded yet');

      // Optimistic UI update
      const optimistic = { ...settings, ...patch, updated_at: new Date().toISOString() };
      setSettings(optimistic);

      // Invalidate cache
      if (userIdRef.current) settingsCache.delete(userIdRef.current);

      try {
        const { data, error: updateErr } = await supabase
          .from('business_settings')
          .update({ ...patch, updated_at: new Date().toISOString() })
          .eq('id', settings.id)
          .select()
          .single();

        if (updateErr) throw new Error(updateErr.message);

        const updated = data as BusinessSettings;

        // Store fresh data in cache
        if (userIdRef.current) {
          settingsCache.set(userIdRef.current, {
            data: updated,
            fetchedAt: Date.now(),
          });
        }

        setSettings(updated);
      } catch (err) {
        // Rollback optimistic update on failure
        setSettings(settings);
        const message =
          err instanceof Error ? err.message : 'Failed to update business settings';
        setError(message);
        console.error('[useBusinessSettings] update error:', err);
        throw err; // re-throw so callers can handle via toast etc.
      }
    },
    [settings, supabase]
  );

  // ---- Initial fetch ----
  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    settings,
    loading,
    error,
    refetch: fetchSettings,
    update,
  };
}
