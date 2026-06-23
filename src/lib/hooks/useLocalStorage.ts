'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// =============================================================================
// HELPERS
// =============================================================================

function readFromStorage<T>(key: string, initialValue: T): T {
  if (typeof window === 'undefined') return initialValue;

  try {
    const item = window.localStorage.getItem(key);
    if (item === null) return initialValue;
    return JSON.parse(item) as T;
  } catch (err) {
    console.warn(`[useLocalStorage] Failed to read key "${key}":`, err);
    return initialValue;
  }
}

function writeToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[useLocalStorage] Failed to write key "${key}":`, err);
  }
}

function removeFromStorage(key: string): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(key);
  } catch (err) {
    console.warn(`[useLocalStorage] Failed to remove key "${key}":`, err);
  }
}

// =============================================================================
// HOOK
// =============================================================================

export interface UseLocalStorageReturn<T> {
  value: T;
  setValue: (value: T | ((prev: T) => T)) => void;
  removeValue: () => void;
}

/**
 * useLocalStorage
 *
 * Persists state to localStorage, synced across tabs via the `storage` event.
 *
 * @param key           localStorage key
 * @param initialValue  Initial value if nothing is stored
 *
 * @example
 * const { value: theme, setValue: setTheme } = useLocalStorage('theme', 'light');
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): UseLocalStorageReturn<T> {
  // Initialise from storage (SSR-safe: falls back to initialValue on server)
  const [storedValue, setStoredValue] = useState<T>(() =>
    readFromStorage(key, initialValue)
  );

  // Keep a ref to the latest key so event handlers always see the current key
  const keyRef = useRef(key);
  keyRef.current = key;

  // Keep a ref to the latest initialValue for re-keying
  const initialValueRef = useRef(initialValue);
  initialValueRef.current = initialValue;

  // Re-read from storage when the key changes
  useEffect(() => {
    setStoredValue(readFromStorage(key, initialValue));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Sync across tabs / windows
  useEffect(() => {
    function handleStorageEvent(event: StorageEvent) {
      if (event.key !== keyRef.current) return;

      if (event.newValue === null) {
        setStoredValue(initialValueRef.current);
      } else {
        try {
          setStoredValue(JSON.parse(event.newValue) as T);
        } catch {
          // ignore parse errors from other tabs
        }
      }
    }

    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, []);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        writeToStorage(keyRef.current, next);
        return next;
      });
    },
    []
  );

  const removeValue = useCallback(() => {
    removeFromStorage(keyRef.current);
    setStoredValue(initialValueRef.current);
  }, []);

  return { value: storedValue, setValue, removeValue };
}
