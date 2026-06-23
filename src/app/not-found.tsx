import Link from 'next/link';
import { Zap, ArrowLeft, LayoutDashboard } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="mx-auto max-w-md text-center">
        {/* HAULR Logo */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-900">HAULR</span>
        </div>

        {/* 404 Display */}
        <div className="mb-6">
          <span className="text-8xl font-black text-blue-100 select-none">404</span>
        </div>

        {/* Heading */}
        <h1 className="mb-3 text-2xl font-bold text-gray-900">
          Page not found
        </h1>

        {/* Message */}
        <p className="mb-8 text-gray-600">
          We hauled this page away. It might have been moved or deleted.
        </p>

        {/* Actions */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />
            Go to dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Go back
          </Link>
        </div>

        {/* Help links */}
        <div className="mt-10 flex items-center justify-center gap-6 text-sm text-gray-500">
          <Link href="/dashboard/quotes" className="hover:text-gray-900 transition-colors">
            Quotes
          </Link>
          <Link href="/dashboard/customers" className="hover:text-gray-900 transition-colors">
            Customers
          </Link>
          <Link href="/dashboard/jobs" className="hover:text-gray-900 transition-colors">
            Jobs
          </Link>
          <Link href="/dashboard/settings" className="hover:text-gray-900 transition-colors">
            Settings
          </Link>
        </div>
      </div>
    </div>
  );
}
