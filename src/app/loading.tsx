import { Zap } from 'lucide-react';

export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        {/* Animated logo */}
        <div className="relative flex h-16 w-16 items-center justify-center">
          {/* Pulsing ring */}
          <div className="absolute inset-0 animate-ping rounded-full bg-blue-100 opacity-75" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/25">
            <Zap className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Brand name */}
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">HAULR</p>
          <p className="text-sm text-gray-500">Loading...</p>
        </div>

        {/* Progress bar */}
        <div className="h-1 w-32 overflow-hidden rounded-full bg-gray-200">
          <div className="h-full w-full origin-left animate-pulse rounded-full bg-blue-600" />
        </div>
      </div>
    </div>
  );
}
