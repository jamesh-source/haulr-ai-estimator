'use client';

import { useState, useEffect } from 'react';

/**
 * useDebounce
 *
 * Returns a debounced version of `value` that only updates after `delay` ms
 * of inactivity. Useful for deferring expensive operations (API searches, etc.)
 * until the user stops typing.
 *
 * @param value   The value to debounce
 * @param delay   Debounce delay in milliseconds (default: 400)
 *
 * @example
 * const debouncedSearch = useDebounce(searchQuery, 400);
 *
 * useEffect(() => {
 *   if (debouncedSearch) fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
