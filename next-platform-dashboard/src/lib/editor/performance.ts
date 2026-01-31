/**
 * Editor Performance Utilities
 * 
 * Performance optimization utilities for the Puck editor.
 * Includes debouncing, lazy loading helpers, and optimization utilities.
 */

import { useRef, useCallback, useEffect, useState } from "react";

// =============================================================================
// DEBOUNCE UTILITIES
// =============================================================================

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  options?: { leading?: boolean; trailing?: boolean }
): T & { cancel: () => void; flush: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let lastArgs: Parameters<T> | undefined;
  let lastThis: unknown;
  let result: ReturnType<T>;
  const leading = options?.leading ?? false;
  const trailing = options?.trailing ?? true;

  function invokeFunc() {
    if (lastArgs) {
      result = func.apply(lastThis, lastArgs) as ReturnType<T>;
      lastArgs = undefined;
      lastThis = undefined;
    }
    return result;
  }

  function debounced(this: unknown, ...args: Parameters<T>) {
    lastArgs = args;
    lastThis = this;

    if (leading && !timeoutId) {
      invokeFunc();
    }

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (trailing) {
      timeoutId = setTimeout(() => {
        invokeFunc();
        timeoutId = undefined;
      }, wait);
    }

    return result;
  }

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
    lastArgs = undefined;
    lastThis = undefined;
  };

  debounced.flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
    return invokeFunc();
  };

  return debounced as unknown as T & { cancel: () => void; flush: () => void };
}

/**
 * React hook for debounced values
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

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

/**
 * React hook for debounced callbacks
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(
    debounce((...args: unknown[]) => {
      callbackRef.current(...(args as Parameters<T>));
    }, delay),
    [delay, ...deps]
  ) as unknown as T;
}

// =============================================================================
// THROTTLE UTILITIES
// =============================================================================

/**
 * Creates a throttled function that only invokes func at most once per every wait milliseconds.
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  options?: { leading?: boolean; trailing?: boolean }
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let lastTime = 0;
  let lastArgs: Parameters<T> | undefined;
  let lastThis: unknown;
  const leading = options?.leading ?? true;
  const trailing = options?.trailing ?? true;

  function invokeFunc(time: number) {
    if (lastArgs) {
      func.apply(lastThis, lastArgs);
      lastTime = time;
      lastArgs = undefined;
      lastThis = undefined;
    }
  }

  function throttled(this: unknown, ...args: Parameters<T>) {
    const time = Date.now();
    const remaining = wait - (time - lastTime);
    lastArgs = args;
    lastThis = this;

    if (remaining <= 0 || remaining > wait) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }
      if (leading || lastTime !== 0) {
        invokeFunc(time);
      } else {
        lastTime = time;
      }
    } else if (!timeoutId && trailing) {
      timeoutId = setTimeout(() => {
        invokeFunc(Date.now());
        timeoutId = undefined;
      }, remaining);
    }
  }

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
    lastTime = 0;
    lastArgs = undefined;
    lastThis = undefined;
  };

  return throttled as unknown as T & { cancel: () => void };
}

/**
 * React hook for throttled callbacks
 */
export function useThrottledCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(
    throttle((...args: unknown[]) => {
      callbackRef.current(...(args as Parameters<T>));
    }, delay),
    [delay, ...deps]
  ) as unknown as T;
}

// =============================================================================
// LAZY LOADING UTILITIES
// =============================================================================

/**
 * Intersection observer hook for lazy loading
 */
export function useIntersectionObserver(
  options?: IntersectionObserverInit
): [React.RefCallback<Element>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const elementRef = useRef<Element | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const setElement = useCallback((element: Element | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    elementRef.current = element;

    if (element) {
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          setIsIntersecting(entry.isIntersecting);
        },
        {
          threshold: 0.1,
          ...options,
        }
      );
      observerRef.current.observe(element);
    }
  }, [options]);

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return [setElement, isIntersecting];
}

/**
 * Hook for lazy loading with preload support
 */
export function useLazyLoad(options?: {
  rootMargin?: string;
  threshold?: number;
  preload?: boolean;
}): [React.RefCallback<Element>, boolean, boolean] {
  const [ref, isIntersecting] = useIntersectionObserver({
    rootMargin: options?.rootMargin ?? "100px",
    threshold: options?.threshold ?? 0.1,
  });
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (isIntersecting && !hasLoaded) {
      setHasLoaded(true);
    }
  }, [isIntersecting, hasLoaded]);

  // If preload is true, load immediately
  const shouldLoad = options?.preload ?? hasLoaded;

  return [ref, shouldLoad, hasLoaded];
}

// =============================================================================
// ANIMATION FRAME UTILITIES
// =============================================================================

/**
 * Request animation frame hook for smooth animations
 */
export function useAnimationFrame(callback: (deltaTime: number) => void): void {
  const callbackRef = useRef(callback);
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  callbackRef.current = callback;

  useEffect(() => {
    const animate = (time: number) => {
      if (lastTimeRef.current) {
        const deltaTime = time - lastTimeRef.current;
        callbackRef.current(deltaTime);
      }
      lastTimeRef.current = time;
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);
}

// =============================================================================
// MEMORY UTILITIES
// =============================================================================

/**
 * Cache with LRU eviction
 */
export class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Evict oldest (first) entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

/**
 * Memoize function results with LRU cache
 */
export function memoizeWithLRU<T extends (...args: unknown[]) => unknown>(
  fn: T,
  maxSize: number = 100,
  keyFn?: (...args: Parameters<T>) => string
): T {
  const cache = new LRUCache<string, ReturnType<T>>(maxSize);

  return ((...args: Parameters<T>) => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  }) as T;
}

// =============================================================================
// PERFORMANCE MONITORING
// =============================================================================

/**
 * Performance monitor for tracking render times
 */
export function useRenderPerformance(componentName: string, enabled = false): void {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(performance.now());

  useEffect(() => {
    if (!enabled) return;

    const currentTime = performance.now();
    const renderTime = currentTime - lastRenderTimeRef.current;
    renderCountRef.current += 1;

    if (renderTime > 16.67) {
      // Longer than 60fps frame budget
      console.warn(
        `[Performance] ${componentName} render #${renderCountRef.current} took ${renderTime.toFixed(2)}ms (over 16.67ms budget)`
      );
    } else if (process.env.NODE_ENV === "development") {
      console.debug(
        `[Performance] ${componentName} render #${renderCountRef.current}: ${renderTime.toFixed(2)}ms`
      );
    }

    lastRenderTimeRef.current = currentTime;
  });
}

/**
 * Measure execution time of a function
 */
export function measureTime<T extends (...args: unknown[]) => unknown>(
  fn: T,
  label?: string
): T {
  return ((...args: Parameters<T>) => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    
    if (process.env.NODE_ENV === "development") {
      console.debug(
        `[Performance] ${label || fn.name || "Function"} executed in ${(end - start).toFixed(2)}ms`
      );
    }
    
    return result;
  }) as T;
}

// =============================================================================
// CONTENT CHUNKING
// =============================================================================

/**
 * Split array into chunks for progressive rendering
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Hook for progressive rendering of large lists
 */
export function useProgressiveList<T>(
  items: T[],
  chunkSize: number = 10,
  delay: number = 50
): T[] {
  const [visibleItems, setVisibleItems] = useState<T[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setVisibleItems([]);
    setCurrentIndex(0);
  }, [items]);

  useEffect(() => {
    if (currentIndex >= items.length) return;

    const timer = setTimeout(() => {
      setVisibleItems((prev) => [
        ...prev,
        ...items.slice(currentIndex, currentIndex + chunkSize),
      ]);
      setCurrentIndex((prev) => prev + chunkSize);
    }, delay);

    return () => clearTimeout(timer);
  }, [items, currentIndex, chunkSize, delay]);

  return visibleItems;
}

// =============================================================================
// IDLE CALLBACK UTILITIES
// =============================================================================

/**
 * Schedule work during browser idle periods
 */
export function scheduleIdleWork(
  callback: () => void,
  options?: { timeout?: number }
): number {
  if (typeof window === "undefined") {
    return 0;
  }
  if ("requestIdleCallback" in window) {
    return (window as Window & { requestIdleCallback: (cb: IdleRequestCallback, opts?: IdleRequestOptions) => number }).requestIdleCallback(callback, options);
  }
  // Fallback for browsers without requestIdleCallback
  return setTimeout(callback, 1) as unknown as number;
}

/**
 * Cancel scheduled idle work
 */
export function cancelIdleWork(handle: number): void {
  if (typeof window === "undefined") {
    return;
  }
  if ("cancelIdleCallback" in window) {
    (window as Window & { cancelIdleCallback: (handle: number) => void }).cancelIdleCallback(handle);
  } else {
    clearTimeout(handle);
  }
}

/**
 * Hook for scheduling work during idle time
 */
export function useIdleCallback(
  callback: () => void,
  deps: React.DependencyList = []
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const handle = scheduleIdleWork(() => {
      callbackRef.current();
    });

    return () => {
      cancelIdleWork(handle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
