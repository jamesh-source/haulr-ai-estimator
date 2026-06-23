'use client';

import { SignIn } from '@clerk/nextjs';
import { Truck } from 'lucide-react';

export default function SignInPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(59,130,246,0.3) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(37,99,235,0.2) 0%, transparent 50%)`,
        }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 flex flex-col items-center w-full px-4">
        {/* Logo & brand */}
        <div className="flex flex-col items-center mb-8 space-y-3">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500 shadow-lg shadow-blue-500/30">
            <Truck className="w-9 h-9 text-white" strokeWidth={1.75} />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white">HAULR</h1>
            <p className="mt-1 text-sm text-blue-300 font-medium">
              AI-Powered Junk Removal Estimating
            </p>
          </div>
        </div>

        {/* Clerk sign-in widget */}
        <SignIn
          appearance={{
            elements: {
              rootBox: 'w-full max-w-md',
              card: 'rounded-2xl shadow-2xl border border-white/10 bg-white/95 backdrop-blur-sm',
              headerTitle: 'text-gray-900 font-semibold',
              headerSubtitle: 'text-gray-500',
              socialButtonsBlockButton:
                'border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium',
              dividerLine: 'bg-gray-200',
              dividerText: 'text-gray-400 text-sm',
              formFieldLabel: 'text-gray-700 text-sm font-medium',
              formFieldInput:
                'rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm',
              formButtonPrimary:
                'bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors',
              footerActionLink: 'text-blue-600 hover:text-blue-700 font-medium',
              identityPreviewEditButton: 'text-blue-600',
              formResendCodeLink: 'text-blue-600',
              otpCodeFieldInput: 'border-gray-300 rounded-lg',
              alertText: 'text-sm',
            },
          }}
          redirectUrl="/dashboard"
          signUpUrl="/sign-up"
        />

        <p className="mt-6 text-xs text-blue-300/60 text-center">
          &copy; {new Date().getFullYear()} HAULR. All rights reserved.
        </p>
      </div>
    </main>
  );
}
