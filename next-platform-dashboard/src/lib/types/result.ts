// src/lib/types/result.ts

/**
 * Standardized result type for all server actions
 * Usage: export async function myAction(): Promise<ActionResult<MyData>>
 */
export type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: ActionError };

/**
 * Standardized error object structure
 */
export interface ActionError {
  /** Error category for programmatic handling */
  code: ErrorCode;
  /** User-friendly error message */
  message: string;
  /** Field-specific validation errors */
  details?: Record<string, string[]>;
  /** Specific field that caused the error */
  field?: string;
  /** Original error for debugging (not sent to client) */
  originalError?: unknown;
}

/**
 * All possible error codes in the platform
 */
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'MODULE_NOT_ENABLED'
  | 'SUBSCRIPTION_REQUIRED'
  | 'USAGE_LIMIT_EXCEEDED';

/**
 * Error factory functions for consistent error creation
 */
export const Errors = {
  /** Validation failed - use for form/input errors */
  validation: (message: string, details?: Record<string, string[]>): ActionError => ({
    code: 'VALIDATION_ERROR',
    message,
    details,
  }),

  /** Resource not found */
  notFound: (resource: string): ActionError => ({
    code: 'NOT_FOUND',
    message: `${resource} not found`,
  }),

  /** User not authenticated */
  unauthorized: (message?: string): ActionError => ({
    code: 'UNAUTHORIZED',
    message: message || 'You must be logged in to perform this action',
  }),

  /** User lacks permission */
  forbidden: (action?: string): ActionError => ({
    code: 'FORBIDDEN',
    message: action ? `You don't have permission to ${action}` : 'Access denied',
  }),

  /** Resource conflict (e.g., duplicate) */
  conflict: (message: string): ActionError => ({
    code: 'CONFLICT',
    message,
  }),

  /** Rate limit exceeded */
  rateLimited: (retryAfter?: number): ActionError => ({
    code: 'RATE_LIMITED',
    message: retryAfter 
      ? `Too many requests. Please try again in ${retryAfter} seconds`
      : 'Too many requests. Please slow down',
  }),

  /** Generic server error */
  server: (message = 'An unexpected error occurred. Please try again.'): ActionError => ({
    code: 'SERVER_ERROR',
    message,
  }),

  /** Network/connectivity error */
  network: (): ActionError => ({
    code: 'NETWORK_ERROR',
    message: 'Unable to connect. Please check your internet connection.',
  }),

  /** Request timeout */
  timeout: (): ActionError => ({
    code: 'TIMEOUT',
    message: 'Request timed out. Please try again.',
  }),

  /** Module not enabled for site */
  moduleNotEnabled: (moduleName: string): ActionError => ({
    code: 'MODULE_NOT_ENABLED',
    message: `The ${moduleName} module is not enabled for this site. Enable it in the Modules tab.`,
  }),

  /** Subscription required */
  subscriptionRequired: (feature: string): ActionError => ({
    code: 'SUBSCRIPTION_REQUIRED',
    message: `A subscription is required to access ${feature}.`,
  }),

  /** Usage limit exceeded */
  usageLimitExceeded: (limit: string): ActionError => ({
    code: 'USAGE_LIMIT_EXCEEDED',
    message: `You've reached your ${limit} limit. Please upgrade your plan.`,
  }),

  /** Create from unknown error */
  fromError: (error: unknown): ActionError => {
    if (error instanceof Error) {
      // Handle Supabase errors
      if ('code' in error && typeof (error as { code: string }).code === 'string') {
        const code = (error as { code: string }).code;
        if (code === '23505') {
          return Errors.conflict('A record with this value already exists');
        }
        if (code === '23503') {
          return Errors.notFound('Referenced record');
        }
        if (code === 'PGRST116') {
          return Errors.notFound('Resource');
        }
      }
      return {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred. Please try again.',
        originalError: error,
      };
    }
    return Errors.server();
  },
};

/**
 * Type guard to check if result is successful
 */
export function isSuccess<T>(result: ActionResult<T>): result is { success: true; data: T } {
  return result.success === true;
}

/**
 * Type guard to check if result is an error
 */
export function isError<T>(result: ActionResult<T>): result is { success: false; error: ActionError } {
  return result.success === false;
}

/**
 * Helper to extract data from result or throw
 */
export function unwrap<T>(result: ActionResult<T>): T {
  if (isSuccess(result)) {
    return result.data;
  }
  throw new Error(result.error.message);
}
