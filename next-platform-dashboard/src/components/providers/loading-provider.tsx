"use client";

import * as React from "react";

// =============================================================================
// LOADING CONTEXT
// =============================================================================

export interface LoadingItem {
  id: string;
  message?: string;
  progress?: number;
  startTime: number;
}

export interface LoadingContextValue {
  /**
   * Currently active loading items
   */
  loadingItems: LoadingItem[];
  /**
   * Check if any loading is in progress
   */
  isLoading: boolean;
  /**
   * Start a loading operation
   */
  startLoading: (id: string, message?: string) => void;
  /**
   * Update loading progress
   */
  updateProgress: (id: string, progress: number) => void;
  /**
   * Update loading message
   */
  updateMessage: (id: string, message: string) => void;
  /**
   * Stop a loading operation
   */
  stopLoading: (id: string) => void;
  /**
   * Stop all loading operations
   */
  stopAll: () => void;
  /**
   * Get loading state for specific id
   */
  getLoadingState: (id: string) => LoadingItem | undefined;
  /**
   * Check if specific id is loading
   */
  isLoadingId: (id: string) => boolean;
}

const LoadingContext = React.createContext<LoadingContextValue | undefined>(undefined);

// =============================================================================
// LOADING PROVIDER
// =============================================================================

export interface LoadingProviderProps {
  /**
   * Children components
   */
  children: React.ReactNode;
  /**
   * Callback when loading starts
   */
  onLoadingStart?: (item: LoadingItem) => void;
  /**
   * Callback when loading stops
   */
  onLoadingStop?: (id: string, duration: number) => void;
}

/**
 * LoadingProvider - Centralized loading state management.
 * 
 * @example
 * ```tsx
 * <LoadingProvider>
 *   <App />
 * </LoadingProvider>
 * 
 * // In a component
 * const { startLoading, stopLoading, isLoading } = useLoading();
 * 
 * const handleSubmit = async () => {
 *   startLoading('submit-form', 'Saving changes...');
 *   try {
 *     await saveData();
 *   } finally {
 *     stopLoading('submit-form');
 *   }
 * };
 * ```
 */
export function LoadingProvider({
  children,
  onLoadingStart,
  onLoadingStop,
}: LoadingProviderProps) {
  const [loadingItems, setLoadingItems] = React.useState<LoadingItem[]>([]);

  const startLoading = React.useCallback((id: string, message?: string) => {
    const item: LoadingItem = {
      id,
      message,
      startTime: Date.now(),
    };

    setLoadingItems((prev) => {
      // Replace if exists, otherwise add
      const exists = prev.find((i) => i.id === id);
      if (exists) {
        return prev.map((i) => (i.id === id ? item : i));
      }
      return [...prev, item];
    });

    onLoadingStart?.(item);
  }, [onLoadingStart]);

  const updateProgress = React.useCallback((id: string, progress: number) => {
    setLoadingItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, progress: Math.min(100, Math.max(0, progress)) } : item
      )
    );
  }, []);

  const updateMessage = React.useCallback((id: string, message: string) => {
    setLoadingItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, message } : item
      )
    );
  }, []);

  const stopLoading = React.useCallback((id: string) => {
    setLoadingItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) {
        onLoadingStop?.(id, Date.now() - item.startTime);
      }
      return prev.filter((i) => i.id !== id);
    });
  }, [onLoadingStop]);

  const stopAll = React.useCallback(() => {
    loadingItems.forEach((item) => {
      onLoadingStop?.(item.id, Date.now() - item.startTime);
    });
    setLoadingItems([]);
  }, [loadingItems, onLoadingStop]);

  const getLoadingState = React.useCallback(
    (id: string) => loadingItems.find((item) => item.id === id),
    [loadingItems]
  );

  const isLoadingId = React.useCallback(
    (id: string) => loadingItems.some((item) => item.id === id),
    [loadingItems]
  );

  const value = React.useMemo<LoadingContextValue>(
    () => ({
      loadingItems,
      isLoading: loadingItems.length > 0,
      startLoading,
      updateProgress,
      updateMessage,
      stopLoading,
      stopAll,
      getLoadingState,
      isLoadingId,
    }),
    [
      loadingItems,
      startLoading,
      updateProgress,
      updateMessage,
      stopLoading,
      stopAll,
      getLoadingState,
      isLoadingId,
    ]
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * useLoading - Hook to access loading context.
 */
export function useLoading(): LoadingContextValue {
  const context = React.useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}

/**
 * useLoadingState - Hook for managing a specific loading operation.
 * 
 * @example
 * ```tsx
 * const { isLoading, start, stop, setProgress } = useLoadingState('my-operation');
 * 
 * const handleClick = async () => {
 *   start('Processing...');
 *   for (let i = 0; i <= 100; i += 10) {
 *     await doWork();
 *     setProgress(i);
 *   }
 *   stop();
 * };
 * ```
 */
export function useLoadingState(id: string) {
  const { startLoading, stopLoading, updateProgress, updateMessage, getLoadingState, isLoadingId } =
    useLoading();

  const start = React.useCallback(
    (message?: string) => startLoading(id, message),
    [id, startLoading]
  );

  const stop = React.useCallback(() => stopLoading(id), [id, stopLoading]);

  const setProgress = React.useCallback(
    (progress: number) => updateProgress(id, progress),
    [id, updateProgress]
  );

  const setMessage = React.useCallback(
    (message: string) => updateMessage(id, message),
    [id, updateMessage]
  );

  const state = getLoadingState(id);
  const isLoading = isLoadingId(id);

  return {
    isLoading,
    state,
    start,
    stop,
    setProgress,
    setMessage,
  };
}

/**
 * useAsyncOperation - Hook for wrapping async operations with loading state.
 * 
 * @example
 * ```tsx
 * const { execute, isLoading, error } = useAsyncOperation('save-contact');
 * 
 * const handleSave = () => execute(async () => {
 *   await saveContact(data);
 * });
 * ```
 */
export function useAsyncOperation<T>(
  id: string,
  options?: {
    onSuccess?: (result: T) => void;
    onError?: (error: Error) => void;
    loadingMessage?: string;
  }
) {
  const { start, stop } = useLoadingState(id);
  const [error, setError] = React.useState<Error | null>(null);
  const [result, setResult] = React.useState<T | null>(null);

  const execute = React.useCallback(
    async (operation: () => Promise<T>): Promise<T | null> => {
      setError(null);
      start(options?.loadingMessage);

      try {
        const res = await operation();
        setResult(res);
        options?.onSuccess?.(res);
        return res;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        return null;
      } finally {
        stop();
      }
    },
    [start, stop, options]
  );

  const { isLoading } = useLoadingState(id);

  return {
    execute,
    isLoading,
    error,
    result,
    clearError: () => setError(null),
  };
}

/**
 * useDeferredLoading - Hook that defers showing loading state to prevent flashing.
 * 
 * @example
 * ```tsx
 * const showLoading = useDeferredLoading(isLoading, 200);
 * // Loading indicator only shows if loading takes > 200ms
 * ```
 */
export function useDeferredLoading(isLoading: boolean, delay: number = 300): boolean {
  const [showLoading, setShowLoading] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (isLoading) {
      timeoutRef.current = setTimeout(() => {
        setShowLoading(true);
      }, delay);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setShowLoading(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading, delay]);

  return showLoading;
}

export { LoadingContext };
