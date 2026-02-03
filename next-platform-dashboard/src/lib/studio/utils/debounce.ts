/**
 * DRAMAC Studio Debounce Utilities
 * 
 * Debounce and throttle utilities for performance optimization.
 * 
 * @phase STUDIO-21
 */

"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// =============================================================================
// DEBOUNCE FUNCTION
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: () => void;
  pending: () => boolean;
}

/**
 * Simple debounce implementation that doesn't require external dependencies
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): DebouncedFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debounced = (...args: Parameters<T>) => {
    lastArgs = args;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      if (lastArgs) {
        fn(...lastArgs);
        lastArgs = null;
      }
      timeoutId = null;
    }, delay);
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
  };

  debounced.flush = () => {
    if (timeoutId && lastArgs) {
      clearTimeout(timeoutId);
      fn(...lastArgs);
      timeoutId = null;
      lastArgs = null;
    }
  };

  debounced.pending = () => {
    return timeoutId !== null;
  };

  return debounced;
}

// =============================================================================
// THROTTLE FUNCTION
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ThrottledFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  cancel: () => void;
}

/**
 * Throttle function - limits execution to once per wait period
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  wait: number
): ThrottledFunction<T> {
  let lastCallTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const throttled = (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = wait - (now - lastCallTime);

    lastArgs = args;

    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCallTime = now;
      fn(...args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCallTime = Date.now();
        timeoutId = null;
        if (lastArgs) {
          fn(...lastArgs);
        }
      }, remaining);
    }
  };

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
  };

  return throttled;
}

// =============================================================================
// REACT HOOKS
// =============================================================================

/**
 * Hook for debounced value
 * Returns a value that only updates after the specified delay
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for debounced callback
 * Returns a stable debounced function that doesn't change between renders
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): DebouncedFunction<T> {
  const callbackRef = useRef(callback);
  const debouncedRef = useRef<DebouncedFunction<T> | null>(null);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Create debounced function once
  const debouncedFn = useMemo(() => {
    if (debouncedRef.current) {
      debouncedRef.current.cancel();
    }

    const debounced = debounce((...args: Parameters<T>) => {
      callbackRef.current(...args);
    }, delay) as DebouncedFunction<T>;

    debouncedRef.current = debounced;
    return debounced;
  }, [delay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedRef.current?.cancel();
    };
  }, []);

  return debouncedFn;
}

/**
 * Hook for throttled callback
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  wait: number
): ThrottledFunction<T> {
  const callbackRef = useRef(callback);
  const throttledRef = useRef<ThrottledFunction<T> | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledFn = useMemo(() => {
    if (throttledRef.current) {
      throttledRef.current.cancel();
    }

    const throttled = throttle((...args: Parameters<T>) => {
      callbackRef.current(...args);
    }, wait) as ThrottledFunction<T>;

    throttledRef.current = throttled;
    return throttled;
  }, [wait]);

  useEffect(() => {
    return () => {
      throttledRef.current?.cancel();
    };
  }, []);

  return throttledFn;
}

/**
 * Hook that returns true if the value hasn't changed for the specified duration
 */
export function useStableValue<T>(value: T, delay: number): boolean {
  const [isStable, setIsStable] = useState(true);
  const previousValueRef = useRef(value);

  useEffect(() => {
    if (previousValueRef.current !== value) {
      setIsStable(false);
      previousValueRef.current = value;

      const timer = setTimeout(() => {
        setIsStable(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [value, delay]);

  return isStable;
}
