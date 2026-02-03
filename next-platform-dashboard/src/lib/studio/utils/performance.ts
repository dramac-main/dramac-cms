/**
 * DRAMAC Studio Performance Utilities
 * 
 * Performance monitoring and measurement utilities.
 * 
 * @phase STUDIO-21
 */

"use client";

import { useRef, useEffect, useCallback } from "react";

// =============================================================================
// PERFORMANCE MEASUREMENT
// =============================================================================

export interface PerformanceMetrics {
  name: string;
  duration: number;
  timestamp: number;
  type: "render" | "async" | "custom";
  metadata?: Record<string, unknown>;
}

const metrics: PerformanceMetrics[] = [];
const MAX_METRICS = 100;

/**
 * Add a metric to the performance log
 */
function addMetric(metric: PerformanceMetrics): void {
  metrics.push(metric);
  if (metrics.length > MAX_METRICS) {
    metrics.shift();
  }
}

/**
 * Get all recorded metrics
 */
export function getPerformanceMetrics(): PerformanceMetrics[] {
  return [...metrics];
}

/**
 * Clear all metrics
 */
export function clearPerformanceMetrics(): void {
  metrics.length = 0;
}

/**
 * Measure the execution time of a synchronous function
 */
export function measureSync<T>(name: string, fn: () => T): T {
  const start = performance.now();
  try {
    return fn();
  } finally {
    const duration = performance.now() - start;
    addMetric({
      name,
      duration,
      timestamp: Date.now(),
      type: "custom",
    });

    if (process.env.NODE_ENV === "development" && duration > 16) {
      console.warn(`[Performance] ${name} took ${duration.toFixed(2)}ms (> 16ms frame budget)`);
    }
  }
}

/**
 * Measure the execution time of an async function
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    const duration = performance.now() - start;
    addMetric({
      name,
      duration,
      timestamp: Date.now(),
      type: "async",
    });

    if (process.env.NODE_ENV === "development") {
      console.debug(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    }
  }
}

/**
 * Create a performance marker for detailed profiling
 */
export function mark(name: string): void {
  if (typeof performance !== "undefined" && performance.mark) {
    performance.mark(name);
  }
}

/**
 * Measure between two marks
 */
export function measureMarks(
  name: string,
  startMark: string,
  endMark: string
): number | null {
  if (typeof performance !== "undefined" && performance.measure) {
    try {
      const measure = performance.measure(name, startMark, endMark);
      return measure.duration;
    } catch {
      return null;
    }
  }
  return null;
}

// =============================================================================
// RENDER METRICS HOOK
// =============================================================================

export interface RenderMetricsResult {
  renderCount: number;
  lastRenderTime: number | null;
  averageRenderTime: number | null;
  maxRenderTime: number | null;
  reset: () => void;
}

/**
 * Hook to track component render metrics
 */
export function useRenderMetrics(componentName: string): RenderMetricsResult {
  const metricsRef = useRef({
    renderCount: 0,
    totalTime: 0,
    maxTime: 0,
    lastTime: null as number | null,
  });

  const startTimeRef = useRef<number | null>(null);

  // Start timing at the beginning of render
  startTimeRef.current = performance.now();

  useEffect(() => {
    const endTime = performance.now();
    const duration = startTimeRef.current ? endTime - startTimeRef.current : 0;

    metricsRef.current.renderCount++;
    metricsRef.current.totalTime += duration;
    metricsRef.current.lastTime = duration;
    metricsRef.current.maxTime = Math.max(metricsRef.current.maxTime, duration);

    addMetric({
      name: componentName,
      duration,
      timestamp: Date.now(),
      type: "render",
    });

    if (process.env.NODE_ENV === "development" && duration > 16) {
      console.warn(
        `[Render] ${componentName} took ${duration.toFixed(2)}ms (render #${metricsRef.current.renderCount})`
      );
    }
  });

  const reset = useCallback(() => {
    metricsRef.current = {
      renderCount: 0,
      totalTime: 0,
      maxTime: 0,
      lastTime: null,
    };
  }, []);

  return {
    renderCount: metricsRef.current.renderCount,
    lastRenderTime: metricsRef.current.lastTime,
    averageRenderTime:
      metricsRef.current.renderCount > 0
        ? metricsRef.current.totalTime / metricsRef.current.renderCount
        : null,
    maxRenderTime: metricsRef.current.maxTime > 0 ? metricsRef.current.maxTime : null,
    reset,
  };
}

// =============================================================================
// FRAME RATE MONITORING
// =============================================================================

export interface FrameRateResult {
  fps: number;
  isLowFps: boolean;
  start: () => void;
  stop: () => void;
}

/**
 * Hook to monitor frame rate
 */
export function useFrameRate(): FrameRateResult {
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const fpsRef = useRef(60);
  const rafIdRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);

  const measureFrame = useCallback(() => {
    frameCountRef.current++;
    const now = performance.now();
    const elapsed = now - lastTimeRef.current;

    if (elapsed >= 1000) {
      fpsRef.current = Math.round((frameCountRef.current * 1000) / elapsed);
      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }

    if (isRunningRef.current) {
      rafIdRef.current = requestAnimationFrame(measureFrame);
    }
  }, []);

  const start = useCallback(() => {
    if (!isRunningRef.current) {
      isRunningRef.current = true;
      lastTimeRef.current = performance.now();
      frameCountRef.current = 0;
      rafIdRef.current = requestAnimationFrame(measureFrame);
    }
  }, [measureFrame]);

  const stop = useCallback(() => {
    isRunningRef.current = false;
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    fps: fpsRef.current,
    isLowFps: fpsRef.current < 30,
    start,
    stop,
  };
}

// =============================================================================
// MEMORY MONITORING (dev only)
// =============================================================================

export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usagePercent: number;
}

/**
 * Get current memory usage (Chrome only, dev mode)
 */
export function getMemoryInfo(): MemoryInfo | null {
  if (
    typeof performance !== "undefined" &&
    "memory" in performance &&
    process.env.NODE_ENV === "development"
  ) {
    const memory = (performance as Performance & { memory: MemoryInfo }).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usagePercent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
    };
  }
  return null;
}

// =============================================================================
// REQUEST IDLE CALLBACK UTILITY
// =============================================================================

type IdleCallback = (deadline: IdleDeadline) => void;

/**
 * Schedule a callback to run when the browser is idle
 */
export function scheduleIdle(
  callback: IdleCallback,
  timeout?: number
): number | ReturnType<typeof setTimeout> {
  if (typeof requestIdleCallback !== "undefined") {
    return requestIdleCallback(callback, timeout ? { timeout } : undefined);
  }
  // Fallback for Safari
  return setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining: () => 50,
    });
  }, 1);
}

/**
 * Cancel a scheduled idle callback
 */
export function cancelIdle(id: number | ReturnType<typeof setTimeout>): void {
  if (typeof cancelIdleCallback !== "undefined" && typeof id === "number") {
    cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}
