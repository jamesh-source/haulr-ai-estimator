// =============================================================================
// HAULR AI ESTIMATOR — PWA MANIFEST CONFIGURATION
// Used by Next.js metadata API to generate web app manifest
// =============================================================================

export const pwaManifest = {
  name: 'HAULR AI Estimator',
  short_name: 'HAULR',
  description:
    'AI-powered junk removal estimating — upload photos, get instant quotes.',
  theme_color: '#2563eb',
  background_color: '#ffffff',
  display: 'standalone' as const,
  display_override: ['standalone', 'minimal-ui', 'browser'] as const,
  orientation: 'portrait-primary' as const,
  start_url: '/dashboard',
  scope: '/',
  lang: 'en-US',
  dir: 'ltr' as const,
  categories: ['business', 'productivity', 'utilities'],

  icons: [
    {
      src: '/icon-72x72.png',
      sizes: '72x72',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/icon-96x96.png',
      sizes: '96x96',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/icon-128x128.png',
      sizes: '128x128',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/icon-144x144.png',
      sizes: '144x144',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/icon-152x152.png',
      sizes: '152x152',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/icon-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/icon-384x384.png',
      sizes: '384x384',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/icon-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/icon-maskable-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'maskable',
    },
    {
      src: '/icon-maskable-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],

  shortcuts: [
    {
      name: 'New Quote',
      short_name: 'New Quote',
      description: 'Create a new AI estimate',
      url: '/dashboard/quotes/new',
      icons: [{ src: '/shortcut-quote.png', sizes: '96x96' }],
    },
    {
      name: 'Customers',
      short_name: 'Customers',
      description: 'View all customers',
      url: '/dashboard/customers',
      icons: [{ src: '/shortcut-customers.png', sizes: '96x96' }],
    },
    {
      name: "Today's Jobs",
      short_name: "Today's Jobs",
      description: "View today's scheduled jobs",
      url: '/dashboard/jobs?filter=today',
      icons: [{ src: '/shortcut-jobs.png', sizes: '96x96' }],
    },
  ],

  screenshots: [
    {
      src: '/screenshot-dashboard.png',
      sizes: '1280x720',
      type: 'image/png',
      form_factor: 'wide',
      label: 'HAULR Dashboard',
    },
    {
      src: '/screenshot-estimate.png',
      sizes: '390x844',
      type: 'image/png',
      form_factor: 'narrow',
      label: 'AI Estimate View',
    },
  ],

  related_applications: [],
  prefer_related_applications: false,
} as const;

export type PWAManifest = typeof pwaManifest;
