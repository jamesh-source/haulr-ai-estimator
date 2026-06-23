import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for use in browser (client) components.
 * Call this inside a Client Component — never import in Server Components.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
