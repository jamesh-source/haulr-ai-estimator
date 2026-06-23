'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('[HAULR Error Boundary]', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="mx-auto max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-10 w-10 text-red-600" />
        </div>

        {/* Heading */}
        <h1 className="mb-3 text-2xl font-bold text-gray-900">
          Something went wrong
        </h1>

        {/* Message */}
        <p className="mb-2 text-gray-600">
          An unexpected error occurred. Our team has been notified.
        </p>

        {/* Error digest for support */}
        {error.digest && (
          <p className="mb-6 font-mono text-xs text-gray-400">
            Error ID: {error.digest}
          </p>
        )}

        {/* Dev mode error message */}
        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-left">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-700">
              Dev Error
            </p>
            <pre className="overflow-auto whitespace-pre-wrap text-xs text-red-600">
              {error.message}
            </pre>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Home className="h-4 w-4" />
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
