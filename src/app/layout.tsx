import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'HAULR | AI-Powered Junk Removal Estimating',
    template: '%s | HAULR',
  },
  description:
    'AI-powered estimating, scheduling, and operations platform for junk removal companies.',
  keywords: ['junk removal', 'estimating', 'AI', 'scheduling', 'operations'],
  authors: [{ name: 'HAULR' }],
  robots: { index: false, follow: false },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'HAULR | AI-Powered Junk Removal Estimating',
    description: 'AI-powered estimating, scheduling, and operations for junk removal companies.',
    siteName: 'HAULR',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={inter.variable} suppressHydrationWarning>
        <head>
          <meta charSet="utf-8" />
          <meta name="color-scheme" content="light dark" />
        </head>
        <body className="min-h-screen bg-gray-50 font-sans antialiased">
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              duration: 4000,
              classNames: {
                toast: 'font-sans',
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
