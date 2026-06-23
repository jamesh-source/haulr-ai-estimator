'use client';

import React, { useState } from 'react';
import {
  useStripe,
  useElements,
  CardElement,
} from '@stripe/react-stripe-js';
import { Loader2, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StripePaymentFormProps {
  amount: number;
  invoiceId: string;
  invoiceNumber: string;
  clientSecret: string;
  onSuccess?: () => void;
  onError?: (message: string) => void;
  className?: string;
}

type PaymentStatus = 'idle' | 'processing' | 'succeeded' | 'error';

// ---------------------------------------------------------------------------
// Card element styling
// ---------------------------------------------------------------------------

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#111827',
      fontFamily: '"Inter", system-ui, sans-serif',
      fontSmoothing: 'antialiased',
      '::placeholder': {
        color: '#9ca3af',
      },
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
  hidePostalCode: false,
};

// ---------------------------------------------------------------------------
// StripePaymentForm
// ---------------------------------------------------------------------------

export function StripePaymentForm({
  amount,
  invoiceId,
  invoiceNumber,
  clientSecret,
  onSuccess,
  onError,
  className,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [cardReady, setCardReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setErrorMessage('Stripe has not loaded yet. Please try again.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setErrorMessage('Card element not found.');
      return;
    }

    setStatus('processing');
    setErrorMessage('');

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (error) {
        const msg = error.message ?? 'Payment failed. Please try again.';
        setStatus('error');
        setErrorMessage(msg);
        onError?.(msg);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        setStatus('succeeded');
        onSuccess?.();
      } else {
        const msg = 'Payment did not complete. Please try again.';
        setStatus('error');
        setErrorMessage(msg);
        onError?.(msg);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'An unexpected error occurred.';
      setStatus('error');
      setErrorMessage(msg);
      onError?.(msg);
    }
  };

  // -------------------------------------------------------------------------
  // Succeeded state
  // -------------------------------------------------------------------------
  if (status === 'succeeded') {
    return (
      <div
        className={cn(
          'flex flex-col items-center gap-4 py-8 text-center',
          className
        )}
      >
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900">Payment Successful!</p>
          <p className="text-sm text-gray-500 mt-1">
            {formatCurrency(amount)} received for invoice {invoiceNumber}.
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Payment form
  // -------------------------------------------------------------------------
  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {/* Amount summary */}
      <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Amount Due</span>
          <span className="text-2xl font-bold text-gray-900">
            {formatCurrency(amount)}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-1">Invoice {invoiceNumber}</p>
      </div>

      {/* Card input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Card Details
        </label>
        <div
          className={cn(
            'rounded-lg border bg-white px-4 py-3 transition-colors',
            status === 'error'
              ? 'border-red-300 focus-within:border-red-400'
              : 'border-gray-300 focus-within:border-orange-400'
          )}
        >
          <CardElement
            options={CARD_ELEMENT_OPTIONS}
            onReady={() => setCardReady(true)}
            onChange={(e) => {
              if (e.error) {
                setErrorMessage(e.error.message);
              } else {
                setErrorMessage('');
              }
            }}
          />
        </div>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{errorMessage}</p>
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        disabled={!stripe || !cardReady || status === 'processing'}
        className={cn(
          'w-full h-12 text-base font-semibold',
          'bg-orange-500 hover:bg-orange-600 text-white',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {status === 'processing' ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing…
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Pay {formatCurrency(amount)}
          </span>
        )}
      </Button>

      {/* Security note */}
      <p className="text-center text-xs text-gray-400">
        Payments are processed securely by Stripe. Your card details are never
        stored on our servers.
      </p>
    </form>
  );
}
