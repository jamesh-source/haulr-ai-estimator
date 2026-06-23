import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Creates a Supabase client suitable for use inside Next.js middleware.
 * Middleware cannot use next/headers directly, so cookies are read from
 * the incoming request and written to both the request and response objects
 * so they propagate to subsequent Server Components.
 *
 * Returns both the client and the (potentially mutated) response so the
 * caller can forward it.
 *
 * @example
 * // In middleware.ts:
 * const { supabase, response } = createMiddlewareClient(request);
 * const { data: { session } } = await supabase.auth.getSession();
 */
export function createMiddlewareClient(request: NextRequest) {
  // Start with a plain pass-through response that we'll augment with cookies.
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          // Write cookies to the outgoing request headers so Server
          // Components can read the refreshed session.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          // Rebuild the response with the updated request headers.
          response = NextResponse.next({ request });

          // Also set the cookies on the response so the browser stores them.
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
          );
        },
      },
    }
  );

  return { supabase, response };
}
