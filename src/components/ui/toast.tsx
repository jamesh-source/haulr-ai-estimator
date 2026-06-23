'use client';

import { toast as sonnerToast, type ExternalToast } from 'sonner';

// =============================================================================
// TOAST HELPER WRAPPERS
// Provides a consistent interface over sonner with pre-configured styling.
// =============================================================================

type ToastOptions = Omit<ExternalToast, 'description'> & {
  description?: string;
};

/**
 * Show a success toast.
 */
export function toastSuccess(
  message: string,
  options?: ToastOptions
): string | number {
  return sonnerToast.success(message, {
    duration: 4000,
    ...options,
  });
}

/**
 * Show an error toast.
 */
export function toastError(
  message: string,
  options?: ToastOptions
): string | number {
  return sonnerToast.error(message, {
    duration: 6000,
    ...options,
  });
}

/**
 * Show a warning toast.
 */
export function toastWarning(
  message: string,
  options?: ToastOptions
): string | number {
  return sonnerToast.warning(message, {
    duration: 5000,
    ...options,
  });
}

/**
 * Show an info toast.
 */
export function toastInfo(
  message: string,
  options?: ToastOptions
): string | number {
  return sonnerToast.info(message, {
    duration: 4000,
    ...options,
  });
}

/**
 * Show a loading toast. Returns the toast ID so you can dismiss or update it.
 *
 * @example
 * const id = toastLoading('Saving…');
 * // later:
 * toast.dismiss(id);
 * toastSuccess('Saved!');
 */
export function toastLoading(
  message: string,
  options?: ToastOptions
): string | number {
  return sonnerToast.loading(message, {
    duration: Infinity, // loading toasts must be manually dismissed
    ...options,
  });
}

/**
 * Dismiss a specific toast by ID, or all toasts if no ID provided.
 */
export function toastDismiss(id?: string | number): void {
  sonnerToast.dismiss(id);
}

/**
 * Show a promise toast — automatically transitions between loading/success/error.
 *
 * @example
 * toastPromise(saveJob(), {
 *   loading: 'Saving job…',
 *   success: 'Job saved!',
 *   error: 'Failed to save job.',
 * });
 */
export function toastPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((err: unknown) => string);
  },
  options?: ToastOptions
): Promise<T> {
  sonnerToast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
    ...options,
  });
  return promise;
}

/**
 * Re-export the raw sonner toast for advanced use cases.
 */
export { sonnerToast as toast };
