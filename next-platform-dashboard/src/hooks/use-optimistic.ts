// =============================================================================
// OPTIMISTIC UPDATE HOOKS
// =============================================================================
// Optimistic updates with automatic rollback on failure
// Part of PHASE-EH-06: Offline & Rate Limiting

"use client";

import * as React from "react";
import { useCallback, useRef, useState, useMemo, useEffect } from "react";
import { showToast } from "@/lib/toast";

// =============================================================================
// TYPES
// =============================================================================

export interface OptimisticMutationConfig<TData, TVariables, TContext> {
  /** Apply optimistic update before mutation */
  onMutate: (variables: TVariables) => TContext | Promise<TContext>;
  /** Handle successful mutation */
  onSuccess?: (data: TData, variables: TVariables, context: TContext) => void;
  /** Handle mutation error (should rollback) */
  onError?: (error: Error, variables: TVariables, context: TContext) => void;
  /** Called after mutation completes (success or error) */
  onSettled?: (
    data: TData | undefined,
    error: Error | null,
    variables: TVariables,
    context: TContext
  ) => void;
  /** Whether to rollback on error (default: true) */
  rollbackOnError?: boolean;
  /** Show toast notifications */
  showToasts?: boolean;
}

export interface OptimisticMutationResult<TData, TVariables> {
  /** Execute the mutation (fire and forget) */
  mutate: (variables: TVariables) => void;
  /** Execute with async/await */
  mutateAsync: (variables: TVariables) => Promise<TData>;
  /** Whether mutation is in progress */
  isPending: boolean;
  /** Whether mutation succeeded */
  isSuccess: boolean;
  /** Whether mutation failed */
  isError: boolean;
  /** Error from last mutation */
  error: Error | null;
  /** Data from last successful mutation */
  data: TData | undefined;
  /** Reset mutation state */
  reset: () => void;
}

export interface OptimisticListConfig<TItem, TId = string> {
  /** Extract ID from item */
  getId: (item: TItem) => TId;
  /** Compare items for equality */
  isEqual?: (a: TItem, b: TItem) => boolean;
  /** Show toast notifications */
  showToasts?: boolean;
}

export interface OptimisticListResult<TItem, TId = string> {
  /** Current items (includes optimistic updates) */
  items: TItem[];
  /** Set the base items */
  setItems: (items: TItem[]) => void;
  /** Optimistically add an item */
  addItem: (item: TItem, mutation: () => Promise<TItem>) => Promise<void>;
  /** Optimistically update an item */
  updateItem: (
    id: TId,
    updates: Partial<TItem>,
    mutation: () => Promise<TItem>
  ) => Promise<void>;
  /** Optimistically remove an item */
  removeItem: (id: TId, mutation: () => Promise<void>) => Promise<void>;
  /** Reorder items optimistically */
  reorderItems: (
    fromIndex: number,
    toIndex: number,
    mutation: () => Promise<void>
  ) => Promise<void>;
  /** Whether any optimistic operation is pending */
  isPending: boolean;
  /** Get pending operations count */
  pendingCount: number;
  /** Rollback all pending operations */
  rollbackAll: () => void;
}

export interface SyncState {
  /** Whether sync is in progress */
  isSyncing: boolean;
  /** Number of pending changes */
  pendingChanges: number;
  /** Last sync timestamp */
  lastSyncAt: Date | null;
  /** Last sync error */
  lastError: Error | null;
}

// =============================================================================
// USE OPTIMISTIC MUTATION HOOK
// =============================================================================

/**
 * Hook for optimistic mutations with automatic rollback.
 * 
 * @example
 * ```typescript
 * const [user, setUser] = useState({ name: 'John' });
 * 
 * const { mutate, isPending } = useOptimisticMutation(
 *   async (newName: string) => {
 *     return await api.updateUser({ name: newName });
 *   },
 *   {
 *     onMutate: (newName) => {
 *       const previous = user;
 *       setUser({ ...user, name: newName });
 *       return previous;
 *     },
 *     onError: (error, newName, previous) => {
 *       setUser(previous);
 *     },
 *   }
 * );
 * 
 * // Optimistic update happens immediately
 * mutate('Jane');
 * ```
 */
export function useOptimisticMutation<
  TData = unknown,
  TVariables = void,
  TContext = unknown
>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  config: OptimisticMutationConfig<TData, TVariables, TContext>
): OptimisticMutationResult<TData, TVariables> {
  const {
    onMutate,
    onSuccess,
    onError,
    onSettled,
    rollbackOnError = true,
    showToasts = false,
  } = config;

  const [state, setState] = useState<{
    isPending: boolean;
    isSuccess: boolean;
    isError: boolean;
    error: Error | null;
    data: TData | undefined;
  }>({
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    data: undefined,
  });

  const mutateAsync = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setState((prev) => ({
        ...prev,
        isPending: true,
        isError: false,
        error: null,
      }));

      // Apply optimistic update
      let context: TContext;
      try {
        context = await onMutate(variables);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setState({
          isPending: false,
          isSuccess: false,
          isError: true,
          error,
          data: undefined,
        });
        throw error;
      }

      try {
        const data = await mutationFn(variables);

        setState({
          isPending: false,
          isSuccess: true,
          isError: false,
          error: null,
          data,
        });

        onSuccess?.(data, variables, context);
        onSettled?.(data, null, variables, context);

        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

        setState({
          isPending: false,
          isSuccess: false,
          isError: true,
          error,
          data: undefined,
        });

        // Rollback
        if (rollbackOnError) {
          onError?.(error, variables, context);
          
          if (showToasts) {
            showToast.error(`Operation failed - Changes have been rolled back: ${error.message}`);
          }
        }

        onSettled?.(undefined, error, variables, context);
        throw error;
      }
    },
    [mutationFn, onMutate, onSuccess, onError, onSettled, rollbackOnError, showToasts]
  );

  const mutate = useCallback(
    (variables: TVariables) => {
      mutateAsync(variables).catch(() => {
        // Error already handled in mutateAsync
      });
    },
    [mutateAsync]
  );

  const reset = useCallback(() => {
    setState({
      isPending: false,
      isSuccess: false,
      isError: false,
      error: null,
      data: undefined,
    });
  }, []);

  return {
    mutate,
    mutateAsync,
    isPending: state.isPending,
    isSuccess: state.isSuccess,
    isError: state.isError,
    error: state.error,
    data: state.data,
    reset,
  };
}

// =============================================================================
// USE OPTIMISTIC LIST HOOK
// =============================================================================

interface PendingOperation<TItem> {
  id: string;
  type: "add" | "update" | "remove" | "reorder";
  item?: TItem;
  originalItems?: TItem[];
}

/**
 * Hook for managing lists with optimistic updates.
 * 
 * @example
 * ```typescript
 * const {
 *   items,
 *   setItems,
 *   addItem,
 *   updateItem,
 *   removeItem,
 *   isPending,
 * } = useOptimisticList<Todo>({
 *   getId: (todo) => todo.id,
 * });
 * 
 * // Initialize with server data
 * useEffect(() => {
 *   fetchTodos().then(setItems);
 * }, []);
 * 
 * // Optimistic add
 * await addItem(
 *   { id: 'temp-1', title: 'New todo', completed: false },
 *   () => api.createTodo({ title: 'New todo' })
 * );
 * 
 * // Optimistic update
 * await updateItem(
 *   'todo-1',
 *   { completed: true },
 *   () => api.updateTodo('todo-1', { completed: true })
 * );
 * 
 * // Optimistic remove
 * await removeItem(
 *   'todo-1',
 *   () => api.deleteTodo('todo-1')
 * );
 * ```
 */
export function useOptimisticList<TItem, TId = string>(
  config: OptimisticListConfig<TItem, TId>
): OptimisticListResult<TItem, TId> {
  const { getId, isEqual, showToasts = false } = config;

  const [baseItems, setBaseItems] = useState<TItem[]>([]);
  const [optimisticItems, setOptimisticItems] = useState<TItem[]>([]);
  const [pendingOps, setPendingOps] = useState<PendingOperation<TItem>[]>([]);

  const pendingOpsRef = useRef(pendingOps);
  pendingOpsRef.current = pendingOps;

  // Compute items with optimistic updates
  const items = useMemo(() => {
    return optimisticItems.length > 0 ? optimisticItems : baseItems;
  }, [baseItems, optimisticItems]);

  // Set items and clear optimistic state
  const setItems = useCallback((newItems: TItem[]) => {
    setBaseItems(newItems);
    setOptimisticItems([]);
    setPendingOps([]);
  }, []);

  // Generate unique operation ID
  const generateOpId = useCallback(() => {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Rollback a specific operation
  const rollback = useCallback((opId: string) => {
    const op = pendingOpsRef.current.find((o) => o.id === opId);
    if (!op) return;

    if (op.originalItems) {
      setOptimisticItems(op.originalItems);
    }

    setPendingOps((prev) => prev.filter((o) => o.id !== opId));
  }, []);

  // Add item optimistically
  const addItem = useCallback(
    async (item: TItem, mutation: () => Promise<TItem>): Promise<void> => {
      const opId = generateOpId();
      const originalItems = items;

      // Apply optimistic update
      setOptimisticItems([...items, item]);
      setPendingOps((prev) => [
        ...prev,
        { id: opId, type: "add", item, originalItems },
      ]);

      try {
        const result = await mutation();
        
        // Replace temp item with server response
        setOptimisticItems((prev) =>
          prev.map((i) => (getId(i) === getId(item) ? result : i))
        );
        
        // Update base items
        setBaseItems((prev) => [...prev, result]);
        
        // Clear optimistic state if no more pending ops
        setPendingOps((prev) => {
          const remaining = prev.filter((o) => o.id !== opId);
          if (remaining.length === 0) {
            setOptimisticItems([]);
          }
          return remaining;
        });
      } catch (error) {
        rollback(opId);
        
        if (showToasts) {
          showToast.error("Failed to add item - Changes have been rolled back");
        }
        
        throw error;
      }
    },
    [items, getId, generateOpId, rollback, showToasts]
  );

  // Update item optimistically
  const updateItem = useCallback(
    async (
      id: TId,
      updates: Partial<TItem>,
      mutation: () => Promise<TItem>
    ): Promise<void> => {
      const opId = generateOpId();
      const originalItems = items;

      // Apply optimistic update
      setOptimisticItems(
        items.map((item) =>
          getId(item) === id ? ({ ...item, ...updates } as TItem) : item
        )
      );
      setPendingOps((prev) => [
        ...prev,
        { id: opId, type: "update", originalItems },
      ]);

      try {
        const result = await mutation();
        
        // Replace with server response
        setOptimisticItems((prev) =>
          prev.map((i) => (getId(i) === id ? result : i))
        );
        
        // Update base items
        setBaseItems((prev) =>
          prev.map((i) => (getId(i) === id ? result : i))
        );
        
        // Clear optimistic state if no more pending ops
        setPendingOps((prev) => {
          const remaining = prev.filter((o) => o.id !== opId);
          if (remaining.length === 0) {
            setOptimisticItems([]);
          }
          return remaining;
        });
      } catch (error) {
        rollback(opId);
        
        if (showToasts) {
          showToast.error("Failed to update item - Changes have been rolled back");
        }
        
        throw error;
      }
    },
    [items, getId, generateOpId, rollback, showToasts]
  );

  // Remove item optimistically
  const removeItem = useCallback(
    async (id: TId, mutation: () => Promise<void>): Promise<void> => {
      const opId = generateOpId();
      const originalItems = items;
      const removedItem = items.find((item) => getId(item) === id);

      // Apply optimistic update
      setOptimisticItems(items.filter((item) => getId(item) !== id));
      setPendingOps((prev) => [
        ...prev,
        { id: opId, type: "remove", item: removedItem, originalItems },
      ]);

      try {
        await mutation();
        
        // Update base items
        setBaseItems((prev) => prev.filter((i) => getId(i) !== id));
        
        // Clear optimistic state if no more pending ops
        setPendingOps((prev) => {
          const remaining = prev.filter((o) => o.id !== opId);
          if (remaining.length === 0) {
            setOptimisticItems([]);
          }
          return remaining;
        });
      } catch (error) {
        rollback(opId);
        
        if (showToasts) {
          showToast.error("Failed to remove item - Changes have been rolled back");
        }
        
        throw error;
      }
    },
    [items, getId, generateOpId, rollback, showToasts]
  );

  // Reorder items optimistically
  const reorderItems = useCallback(
    async (
      fromIndex: number,
      toIndex: number,
      mutation: () => Promise<void>
    ): Promise<void> => {
      const opId = generateOpId();
      const originalItems = items;

      // Apply optimistic reorder
      const newItems = [...items];
      const [removed] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, removed);
      
      setOptimisticItems(newItems);
      setPendingOps((prev) => [
        ...prev,
        { id: opId, type: "reorder", originalItems },
      ]);

      try {
        await mutation();
        
        // Update base items
        setBaseItems(newItems);
        
        // Clear optimistic state if no more pending ops
        setPendingOps((prev) => {
          const remaining = prev.filter((o) => o.id !== opId);
          if (remaining.length === 0) {
            setOptimisticItems([]);
          }
          return remaining;
        });
      } catch (error) {
        rollback(opId);
        
        if (showToasts) {
          showToast.error("Failed to reorder items - Changes have been rolled back");
        }
        
        throw error;
      }
    },
    [items, generateOpId, rollback, showToasts]
  );

  // Rollback all pending operations
  const rollbackAll = useCallback(() => {
    if (pendingOps.length > 0 && pendingOps[0].originalItems) {
      setOptimisticItems(pendingOps[0].originalItems);
    } else {
      setOptimisticItems([]);
    }
    setPendingOps([]);
  }, [pendingOps]);

  return {
    items,
    setItems,
    addItem,
    updateItem,
    removeItem,
    reorderItems,
    isPending: pendingOps.length > 0,
    pendingCount: pendingOps.length,
    rollbackAll,
  };
}

// =============================================================================
// USE SYNC STATE HOOK
// =============================================================================

export interface UseSyncStateOptions {
  /** Auto-sync interval (ms) */
  syncInterval?: number;
  /** Sync on window focus */
  syncOnFocus?: boolean;
  /** Sync on reconnect */
  syncOnReconnect?: boolean;
}

export interface UseSyncStateResult extends SyncState {
  /** Trigger manual sync */
  sync: () => Promise<void>;
  /** Mark changes as pending */
  markPending: (count?: number) => void;
  /** Clear pending changes */
  clearPending: () => void;
  /** Reset sync state */
  reset: () => void;
}

/**
 * Hook for managing sync state.
 * 
 * @example
 * ```typescript
 * const { isSyncing, pendingChanges, sync, markPending } = useSyncState({
 *   syncInterval: 30000,
 *   syncOnFocus: true,
 *   syncOnReconnect: true,
 * });
 * 
 * // Mark changes when editing
 * const handleChange = () => {
 *   markPending();
 *   // ... handle change
 * };
 * 
 * // Manual sync
 * await sync();
 * ```
 */
export function useSyncState(
  syncFn: () => Promise<void>,
  options: UseSyncStateOptions = {}
): UseSyncStateResult {
  const { syncInterval, syncOnFocus = true, syncOnReconnect = true } = options;

  const [state, setState] = useState<SyncState>({
    isSyncing: false,
    pendingChanges: 0,
    lastSyncAt: null,
    lastError: null,
  });

  const syncFnRef = useRef(syncFn);
  syncFnRef.current = syncFn;

  const sync = useCallback(async () => {
    if (state.isSyncing) return;

    setState((prev) => ({ ...prev, isSyncing: true, lastError: null }));

    try {
      await syncFnRef.current();
      setState((prev) => ({
        ...prev,
        isSyncing: false,
        pendingChanges: 0,
        lastSyncAt: new Date(),
        lastError: null,
      }));
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setState((prev) => ({
        ...prev,
        isSyncing: false,
        lastError: error,
      }));
    }
  }, [state.isSyncing]);

  const markPending = useCallback((count = 1) => {
    setState((prev) => ({
      ...prev,
      pendingChanges: prev.pendingChanges + count,
    }));
  }, []);

  const clearPending = useCallback(() => {
    setState((prev) => ({ ...prev, pendingChanges: 0 }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isSyncing: false,
      pendingChanges: 0,
      lastSyncAt: null,
      lastError: null,
    });
  }, []);

  // Auto-sync interval
  useEffect(() => {
    if (!syncInterval) return;

    const interval = setInterval(() => {
      if (state.pendingChanges > 0) {
        sync();
      }
    }, syncInterval);

    return () => clearInterval(interval);
  }, [syncInterval, sync, state.pendingChanges]);

  // Sync on focus
  useEffect(() => {
    if (!syncOnFocus) return;

    const handleFocus = () => {
      if (state.pendingChanges > 0) {
        sync();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [syncOnFocus, sync, state.pendingChanges]);

  // Sync on reconnect
  useEffect(() => {
    if (!syncOnReconnect) return;

    const handleOnline = () => {
      if (state.pendingChanges > 0) {
        sync();
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [syncOnReconnect, sync, state.pendingChanges]);

  return {
    ...state,
    sync,
    markPending,
    clearPending,
    reset,
  };
}
