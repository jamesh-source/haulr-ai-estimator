'use client';

import { useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

// =============================================================================
// HOOK
// =============================================================================

/**
 * useSupabase
 *
 * Returns a memoized browser Supabase client. Safe to call on every render —
 * the underlying client is only created once per component tree.
 *
 * Use this in Client Components. For Server Components / Route Handlers /
 * Middleware, use the server or middleware clients from @/lib/supabase/server
 * and @/lib/supabase/middleware respectively.
 *
 * @example
 * const supabase = useSupabase();
 *
 * const { data, error } = await supabase
 *   .from('jobs')
 *   .select('*')
 *   .order('created_at', { ascending: false });
 */
export function useSupabase(): SupabaseClient {
  // createClient() itself calls createBrowserClient which is already
  // memoised internally, but wrapping in useMemo keeps the reference
  // stable across re-renders within this component instance.
  const client = useMemo(() => createClient(), []);
  return client;
}
