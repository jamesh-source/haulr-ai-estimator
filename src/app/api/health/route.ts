// =============================================================================
// HAULR AI ESTIMATOR — HEALTH CHECK ENDPOINT
// GET /api/health
// Returns service status for uptime monitoring, load balancers, and CI checks
// =============================================================================

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Never cache health checks
export const runtime = 'nodejs';

interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: 'ok' | 'unchecked' | 'error';
    openai: 'ok' | 'unchecked' | 'error';
    storage: 'ok' | 'unchecked' | 'error';
  };
}

export async function GET(): Promise<NextResponse<HealthStatus>> {
  const startTime = Date.now();

  // Basic response — extended checks can be added as needed
  // Keep this lightweight so it doesn't time out on health probes
  const health: HealthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime ? Math.floor(process.uptime()) : 0,
    version: process.env.npm_package_version ?? '0.0.0',
    environment: process.env.NODE_ENV ?? 'production',
    services: {
      // Mark as unchecked by default — full checks can be done separately
      // to avoid adding latency to every health probe
      database: 'unchecked',
      openai: 'unchecked',
      storage: 'unchecked',
    },
  };

  // Optional: verify required environment variables are set
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'OPENAI_API_KEY',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  ];

  const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
  if (missingVars.length > 0) {
    health.status = 'degraded';
    console.warn('[Health] Missing environment variables:', missingVars);
  }

  const responseTime = Date.now() - startTime;

  return NextResponse.json(health, {
    status: health.status === 'ok' ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Response-Time': `${responseTime}ms`,
    },
  });
}
