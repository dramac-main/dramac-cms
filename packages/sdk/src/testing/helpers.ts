/**
 * @dramac/sdk - Test Helpers
 * 
 * Utilities for testing React components and modules
 */

import React, { ReactElement, ReactNode } from 'react';
import { ModuleAuthProvider } from '../auth/module-auth-context';
import { createMockAuth } from './mocks';

/**
 * Custom render options for module testing
 */
export interface ModuleRenderOptions {
  moduleId?: string;
  siteId?: string;
  permissions?: string[];
  roles?: string[];
  user?: { id: string; email: string } | null;
}

/**
 * Create a wrapper component for testing with module context
 */
export function createModuleWrapper(options: ModuleRenderOptions = {}) {
  const {
    moduleId = 'test-module',
    siteId = 'test-site',
  } = options;

  return function ModuleWrapper({ children }: { children: ReactNode }) {
    return React.createElement(
      ModuleAuthProvider,
      { moduleId, siteId, children }
    );
  };
}

/**
 * Wait for async operations to complete
 */
export async function waitForAsync(ms = 0): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 5000, interval = 50 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await waitForAsync(interval);
  }

  throw new Error(`waitFor timeout after ${timeout}ms`);
}

/**
 * Mock window.fetch for testing
 */
export function mockFetch(
  responses: Record<string, unknown | ((url: string, options?: RequestInit) => unknown)>
): () => void {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString();
    
    for (const [pattern, responseOrFn] of Object.entries(responses)) {
      const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
      if (regex.test(url)) {
        const response = typeof responseOrFn === 'function'
          ? responseOrFn(url, init)
          : responseOrFn;

        return {
          ok: true,
          status: 200,
          json: async () => response,
          text: async () => JSON.stringify(response),
          headers: new Headers(),
        } as Response;
      }
    }

    return {
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not found' }),
      text: async () => '{"error": "Not found"}',
      headers: new Headers(),
    } as Response;
  };

  return () => {
    globalThis.fetch = originalFetch;
  };
}

/**
 * Mock localStorage for testing
 */
export function mockLocalStorage(): {
  storage: Map<string, string>;
  restore: () => void;
} {
  const storage = new Map<string, string>();
  const originalStorage = globalThis.localStorage;

  const mockStorage = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
    get length() {
      return storage.size;
    },
    key: (index: number) => Array.from(storage.keys())[index] ?? null,
  };

  Object.defineProperty(globalThis, 'localStorage', {
    value: mockStorage,
    writable: true,
  });

  return {
    storage,
    restore: () => {
      Object.defineProperty(globalThis, 'localStorage', {
        value: originalStorage,
        writable: true,
      });
    },
  };
}

/**
 * Create a spy function that tracks calls
 */
export function createSpy<T extends (...args: unknown[]) => unknown>(
  implementation?: T
): T & {
  calls: Parameters<T>[];
  results: ReturnType<T>[];
  callCount: number;
  reset: () => void;
  lastCall: Parameters<T> | undefined;
  lastResult: ReturnType<T> | undefined;
} {
  const calls: Parameters<T>[] = [];
  const results: ReturnType<T>[] = [];

  const spy = ((...args: Parameters<T>) => {
    calls.push(args);
    const result = implementation?.(...args) as ReturnType<T>;
    results.push(result);
    return result;
  }) as T & {
    calls: Parameters<T>[];
    results: ReturnType<T>[];
    callCount: number;
    reset: () => void;
    lastCall: Parameters<T> | undefined;
    lastResult: ReturnType<T> | undefined;
  };

  spy.calls = calls;
  spy.results = results;

  Object.defineProperty(spy, 'callCount', {
    get: () => calls.length,
  });

  Object.defineProperty(spy, 'lastCall', {
    get: () => calls[calls.length - 1],
  });

  Object.defineProperty(spy, 'lastResult', {
    get: () => results[results.length - 1],
  });

  spy.reset = () => {
    calls.length = 0;
    results.length = 0;
  };

  return spy;
}

/**
 * Assert that a value matches expected shape
 */
export function assertShape<T>(
  value: unknown,
  shape: Record<string, 'string' | 'number' | 'boolean' | 'object' | 'array' | 'function' | 'undefined' | 'null'>
): asserts value is T {
  if (typeof value !== 'object' || value === null) {
    throw new Error(`Expected object, got ${typeof value}`);
  }

  for (const [key, expectedType] of Object.entries(shape)) {
    const actualValue = (value as Record<string, unknown>)[key];
    const actualType = Array.isArray(actualValue)
      ? 'array'
      : actualValue === null
      ? 'null'
      : typeof actualValue;

    if (actualType !== expectedType) {
      throw new Error(
        `Property "${key}" expected ${expectedType}, got ${actualType}`
      );
    }
  }
}

/**
 * Create a deferred promise for testing async flows
 */
export function createDeferred<T>() {
  let resolve: (value: T) => void;
  let reject: (error: Error) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return {
    promise,
    resolve: resolve!,
    reject: reject!,
  };
}

/**
 * Run a function and catch any errors, returning them
 */
export async function catchError<T>(
  fn: () => T | Promise<T>
): Promise<{ result: T; error: null } | { result: null; error: Error }> {
  try {
    const result = await fn();
    return { result, error: null };
  } catch (error) {
    return { result: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}
