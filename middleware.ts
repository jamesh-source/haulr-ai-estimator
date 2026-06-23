import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// =============================================================================
// ROUTE MATCHERS
// =============================================================================

// Routes accessible without authentication
const isPublicRoute = createRouteMatcher([
  '/',                       // Landing / marketing page
  '/sign-in(.*)',            // Clerk sign-in flow
  '/sign-up(.*)',            // Clerk sign-up flow
  '/api/webhooks/(.*)',      // Stripe, Clerk webhooks — must be public
  '/api/health',             // Health check endpoint
  '/customer-portal/(.*)',   // Customer-facing quote portal (no auth required)
]);

// API routes that should never be redirected to sign-in (return 401 instead)
const isApiRoute = createRouteMatcher([
  '/api/(.*)',
]);

// =============================================================================
// MIDDLEWARE
// =============================================================================

export default clerkMiddleware(async (auth, request: NextRequest) => {
  // Allow public routes through without authentication
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  // For protected API routes: return 401 JSON instead of redirect
  if (isApiRoute(request)) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // For all other protected routes: redirect to sign-in
  const { userId } = await auth();
  if (!userId) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirect_url', request.url);
    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
