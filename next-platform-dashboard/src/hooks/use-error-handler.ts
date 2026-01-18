"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  formatError, 
  isRetryableError,
  getRetryDelay,
  type FormattedError 
} from "@/lib/errors";
import {
  showErrorToast,
  showAuthErrorToast,
  showNetworkErrorToast,
  showRateLimitToast,
  showServerErrorToast,
  showValidationErrorToast,
} from "@/components/errors/error-toast";
import { 
  isAuthError, 
  isValidationError, 
  isNetworkError, 
  isRateLimitError,
  type ValidationError,
} from "@/lib/errors/error-types";

interface UseErrorHandlerOptions {
  /**
   * Whether to show toast notifications by default
   */
  showToast?: boolean;
  
  /**
   * Custom title for toast notifications
   */
  toastTitle?: string;
  
  /**
   * Redirect to login on auth errors
   */
  redirectOnAuth?: boolean;
  
  /**
   * Custom callback when an error occurs
   */
  onError?: (error: unknown, formatted: FormattedError) => void;
}

interface HandleErrorOptions {
  /**
   * Override the default toast setting for this specific error
   */
  showToast?: boolean;
  
  /**
   * Custom title for this specific error
   */
  title?: string;
  
  /**
   * Custom context/description for logging
   */
  context?: string;
  
  /**
   * Callback for retry action
   */
  onRetry?: () => void;
}

interface UseErrorHandlerReturn {
  /**
   * Handle an error - formats, logs, and optionally shows toast
   */
  handleError: (error: unknown, options?: HandleErrorOptions) => FormattedError;
  
  /**
   * Handle an async function with error handling
   */
  handleAsync: <T>(
    asyncFn: () => Promise<T>,
    options?: HandleErrorOptions
  ) => Promise<T | null>;
  
  /**
   * Handle form submission errors
   */
  handleFormError: (error: unknown) => Record<string, string> | null;
  
  /**
   * Current error state
   */
  error: FormattedError | null;
  
  /**
   * Clear the current error
   */
  clearError: () => void;
  
  /**
   * Whether currently in an error state
   */
  hasError: boolean;
}

/**
 * Hook for consistent error handling throughout the application
 */
export function useErrorHandler(options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn {
  const {
    showToast: defaultShowToast = true,
    toastTitle,
    redirectOnAuth = true,
    onError,
  } = options;

  const router = useRouter();
  const [error, setError] = useState<FormattedError | null>(null);

  const handleError = useCallback((
    err: unknown, 
    handleOptions?: HandleErrorOptions
  ): FormattedError => {
    const formatted = formatError(err);
    const shouldShowToast = handleOptions?.showToast ?? defaultShowToast;
    
    // Store the error in state
    setError(formatted);
    
    // Call custom error handler if provided
    onError?.(err, formatted);
    
    // Handle specific error types
    if (shouldShowToast) {
      if (isAuthError(err)) {
        showAuthErrorToast(() => {
          if (redirectOnAuth) {
            router.push("/login");
          }
        });
      } else if (isValidationError(err)) {
        showValidationErrorToast(
          (err as ValidationError).fields,
          handleOptions?.title || toastTitle || "Validation Error"
        );
      } else if (isNetworkError(err)) {
        showNetworkErrorToast(handleOptions?.onRetry);
      } else if (isRateLimitError(err)) {
        const rateLimitErr = err as { retryAfter?: number };
        showRateLimitToast(rateLimitErr.retryAfter);
      } else if (formatted.statusCode >= 500) {
        showServerErrorToast(handleOptions?.onRetry);
      } else {
        showErrorToast(err, {
          title: handleOptions?.title || toastTitle,
        });
      }
    }
    
    // Log the error
    if (handleOptions?.context) {
      console.error(`[${handleOptions.context}]`, err);
    }
    
    return formatted;
  }, [defaultShowToast, toastTitle, redirectOnAuth, router, onError]);

  const handleAsync = useCallback(async <T,>(
    asyncFn: () => Promise<T>,
    handleOptions?: HandleErrorOptions
  ): Promise<T | null> => {
    try {
      return await asyncFn();
    } catch (err) {
      handleError(err, handleOptions);
      return null;
    }
  }, [handleError]);

  const handleFormError = useCallback((err: unknown): Record<string, string> | null => {
    const formatted = formatError(err);
    setError(formatted);
    
    // Extract field errors from validation errors
    if (isValidationError(err)) {
      const validationErr = err as ValidationError;
      const fieldErrors: Record<string, string> = {};
      
      for (const [field, messages] of Object.entries(validationErr.fields)) {
        if (messages.length > 0) {
          fieldErrors[field] = messages[0];
        }
      }
      
      return Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
    }
    
    return null;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    handleError,
    handleAsync,
    handleFormError,
    error,
    clearError,
    hasError: error !== null,
  };
}

/**
 * Hook for handling errors with automatic retry
 */
export function useRetryableError() {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const maxRetries = 3;

  const executeWithRetry = useCallback(async <T,>(
    asyncFn: () => Promise<T>,
    onError?: (error: unknown) => void
  ): Promise<T | null> => {
    setIsRetrying(true);
    let currentAttempt = 0;
    
    while (currentAttempt <= maxRetries) {
      try {
        const result = await asyncFn();
        setRetryCount(0);
        setIsRetrying(false);
        return result;
      } catch (error) {
        if (isRetryableError(error) && currentAttempt < maxRetries) {
          const delay = getRetryDelay(error, currentAttempt + 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          currentAttempt++;
          setRetryCount(currentAttempt);
          continue;
        }
        
        setIsRetrying(false);
        onError?.(error);
        return null;
      }
    }
    
    setIsRetrying(false);
    return null;
  }, [maxRetries]);

  const reset = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  return {
    executeWithRetry,
    retryCount,
    isRetrying,
    canRetry: retryCount < maxRetries,
    reset,
  };
}

export default useErrorHandler;
