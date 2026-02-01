// src/components/providers/error-provider.tsx
'use client';

import { createContext, useContext, useCallback, useState, ReactNode } from 'react';
import { ActionError, ErrorCode } from '@/lib/types/result';

// =============================================================================
// TYPES
// =============================================================================

interface ErrorState {
  /** Current global error, if any */
  error: ActionError | null;
  /** Stack of errors (for nested error handling) */
  errorStack: ActionError[];
  /** Whether error modal should be shown */
  showErrorModal: boolean;
}

interface ErrorContextValue extends ErrorState {
  /** Set a global error */
  setError: (error: ActionError | null) => void;
  /** Push an error onto the stack */
  pushError: (error: ActionError) => void;
  /** Pop the latest error from the stack */
  popError: () => ActionError | null;
  /** Clear all errors */
  clearErrors: () => void;
  /** Show error modal */
  openErrorModal: () => void;
  /** Hide error modal */
  closeErrorModal: () => void;
  /** Check if there's an error of specific type */
  hasError: (code?: ErrorCode) => boolean;
  /** Handle an error with optional callback */
  handleError: (error: ActionError, options?: HandleErrorOptions) => void;
}

interface HandleErrorOptions {
  /** Show toast notification */
  showToast?: boolean;
  /** Show error modal */
  showModal?: boolean;
  /** Custom handler callback */
  onHandle?: (error: ActionError) => void;
  /** Retry callback for retriable errors */
  onRetry?: () => void;
}

// =============================================================================
// CONTEXT
// =============================================================================

const ErrorContext = createContext<ErrorContextValue | undefined>(undefined);

// =============================================================================
// PROVIDER
// =============================================================================

interface ErrorProviderProps {
  children: ReactNode;
  /** Optional custom error handler */
  onError?: (error: ActionError) => void;
}

export function ErrorProvider({ children, onError }: ErrorProviderProps) {
  const [state, setState] = useState<ErrorState>({
    error: null,
    errorStack: [],
    showErrorModal: false,
  });

  const setError = useCallback((error: ActionError | null) => {
    setState(prev => ({ ...prev, error }));
    if (error) {
      onError?.(error);
    }
  }, [onError]);

  const pushError = useCallback((error: ActionError) => {
    setState(prev => ({
      ...prev,
      errorStack: [...prev.errorStack, error],
      error,
    }));
    onError?.(error);
  }, [onError]);

  const popError = useCallback(() => {
    let poppedError: ActionError | null = null;
    setState(prev => {
      const newStack = [...prev.errorStack];
      poppedError = newStack.pop() || null;
      return {
        ...prev,
        errorStack: newStack,
        error: newStack[newStack.length - 1] || null,
      };
    });
    return poppedError;
  }, []);

  const clearErrors = useCallback(() => {
    setState({
      error: null,
      errorStack: [],
      showErrorModal: false,
    });
  }, []);

  const openErrorModal = useCallback(() => {
    setState(prev => ({ ...prev, showErrorModal: true }));
  }, []);

  const closeErrorModal = useCallback(() => {
    setState(prev => ({ ...prev, showErrorModal: false }));
  }, []);

  const hasError = useCallback((code?: ErrorCode) => {
    if (!state.error) return false;
    if (code) return state.error.code === code;
    return true;
  }, [state.error]);

  const handleError = useCallback((error: ActionError, options: HandleErrorOptions = {}) => {
    const { showToast = true, showModal = false, onHandle, onRetry } = options;

    // Set the error in state
    setError(error);

    // Show modal if requested
    if (showModal) {
      openErrorModal();
    }

    // Custom handler
    onHandle?.(error);

    // Log error
    console.error('[ErrorProvider] Error handled:', error);

    // Note: Toast showing should be done by the calling component using the toast utility
    // This keeps the provider focused on state management
  }, [setError, openErrorModal]);

  const value: ErrorContextValue = {
    ...state,
    setError,
    pushError,
    popError,
    clearErrors,
    openErrorModal,
    closeErrorModal,
    hasError,
    handleError,
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook to access the error context
 * @throws Error if used outside of ErrorProvider
 */
export function useError(): ErrorContextValue {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
}

/**
 * Hook that returns error context or null if not in provider
 * Useful for optional error handling
 */
export function useErrorOptional(): ErrorContextValue | null {
  return useContext(ErrorContext) || null;
}

/**
 * Hook for checking if a specific error exists
 */
export function useHasError(code?: ErrorCode): boolean {
  const context = useContext(ErrorContext);
  if (!context) return false;
  return context.hasError(code);
}

/**
 * Hook for getting current error
 */
export function useCurrentError(): ActionError | null {
  const context = useContext(ErrorContext);
  return context?.error || null;
}
