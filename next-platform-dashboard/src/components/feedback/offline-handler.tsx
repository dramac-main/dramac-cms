// =============================================================================
// OFFLINE HANDLER COMPONENTS
// =============================================================================
// Advanced offline handling with queued operations and sync
// Part of PHASE-EH-06: Offline & Rate Limiting

"use client";

import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cloud,
  CloudOff,
  RefreshCcw,
  Check,
  AlertCircle,
  Loader2,
  Clock,
  Upload,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { showToast } from "@/lib/toast";

// =============================================================================
// TYPES
// =============================================================================

export interface QueuedOperation {
  /** Unique operation ID */
  id: string;
  /** Operation type/name */
  type: string;
  /** Operation data */
  data: unknown;
  /** Timestamp when queued */
  queuedAt: Date;
  /** Number of retry attempts */
  retryCount: number;
  /** Last error (if any) */
  lastError?: string;
  /** Operation description for display */
  description?: string;
}

export interface OfflineQueueConfig {
  /** Maximum queue size */
  maxQueueSize?: number;
  /** Maximum retry attempts per operation */
  maxRetries?: number;
  /** Base delay between retries (ms) */
  retryDelay?: number;
  /** Storage key for persistence */
  storageKey?: string;
  /** Process operations on reconnect */
  processOnReconnect?: boolean;
}

export interface OfflineQueueState {
  /** Whether device is online */
  isOnline: boolean;
  /** Whether queue is being processed */
  isProcessing: boolean;
  /** Queued operations */
  queue: QueuedOperation[];
  /** Number of successful operations */
  successCount: number;
  /** Number of failed operations */
  failedCount: number;
  /** Current operation being processed */
  currentOperation: QueuedOperation | null;
  /** Processing progress (0-100) */
  progress: number;
}

// =============================================================================
// USE OFFLINE QUEUE HOOK
// =============================================================================

export interface UseOfflineQueueOptions extends OfflineQueueConfig {
  /** Operation processor function */
  processOperation: (operation: QueuedOperation) => Promise<void>;
  /** Callback when queue is empty */
  onQueueEmpty?: () => void;
  /** Callback when operation fails permanently */
  onOperationFailed?: (operation: QueuedOperation, error: Error) => void;
  /** Show toast notifications */
  showToasts?: boolean;
}

export interface UseOfflineQueueResult extends OfflineQueueState {
  /** Add operation to queue */
  enqueue: (
    type: string,
    data: unknown,
    description?: string
  ) => QueuedOperation;
  /** Remove operation from queue */
  dequeue: (id: string) => void;
  /** Clear entire queue */
  clearQueue: () => void;
  /** Process queue manually */
  processQueue: () => Promise<void>;
  /** Retry a specific operation */
  retryOperation: (id: string) => Promise<void>;
}

/**
 * Hook for managing offline operation queue.
 * 
 * @example
 * ```typescript
 * const { enqueue, queue, isProcessing, processQueue } = useOfflineQueue({
 *   processOperation: async (op) => {
 *     await api.processOperation(op.type, op.data);
 *   },
 *   showToasts: true,
 * });
 * 
 * // Queue an operation
 * enqueue('createTodo', { title: 'New todo' }, 'Create new todo');
 * 
 * // Operations are processed automatically when online
 * ```
 */
export function useOfflineQueue(
  options: UseOfflineQueueOptions
): UseOfflineQueueResult {
  const {
    processOperation,
    maxQueueSize = 100,
    maxRetries = 3,
    retryDelay = 1000,
    storageKey = "offline-queue",
    processOnReconnect = true,
    onQueueEmpty,
    onOperationFailed,
    showToasts = false,
  } = options;

  const [state, setState] = useState<OfflineQueueState>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    isProcessing: false,
    queue: [],
    successCount: 0,
    failedCount: 0,
    currentOperation: null,
    progress: 0,
  });

  const processOperationRef = useRef(processOperation);
  processOperationRef.current = processOperation;

  const processingRef = useRef(false);

  // Load queue from storage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const queue = JSON.parse(stored).map((op: QueuedOperation) => ({
          ...op,
          queuedAt: new Date(op.queuedAt),
        }));
        setState((prev) => ({ ...prev, queue }));
      }
    } catch {
      // Ignore storage errors
    }
  }, [storageKey]);

  // Save queue to storage on change
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(state.queue));
    } catch {
      // Ignore storage errors
    }
  }, [state.queue, storageKey]);

  // Monitor online status
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true }));
      
      if (showToasts) {
        showToast.success("Back online - Syncing pending changes...");
      }
    };

    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOnline: false }));
      
      if (showToasts) {
        showToast.warning("You're offline - Changes will be synced when you reconnect");
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [showToasts]);

  // Process queue when online
  useEffect(() => {
    if (
      processOnReconnect &&
      state.isOnline &&
      state.queue.length > 0 &&
      !state.isProcessing
    ) {
      processQueueInternal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isOnline, processOnReconnect]);

  // Generate unique ID
  const generateId = useCallback(() => {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Add operation to queue
  const enqueue = useCallback(
    (type: string, data: unknown, description?: string): QueuedOperation => {
      const operation: QueuedOperation = {
        id: generateId(),
        type,
        data,
        queuedAt: new Date(),
        retryCount: 0,
        description,
      };

      setState((prev) => {
        const newQueue = [...prev.queue, operation].slice(-maxQueueSize);
        return { ...prev, queue: newQueue };
      });

      return operation;
    },
    [generateId, maxQueueSize]
  );

  // Remove operation from queue
  const dequeue = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      queue: prev.queue.filter((op) => op.id !== id),
    }));
  }, []);

  // Clear queue
  const clearQueue = useCallback(() => {
    setState((prev) => ({
      ...prev,
      queue: [],
      successCount: 0,
      failedCount: 0,
    }));
  }, []);

  // Process single operation
  const processOperationInternal = useCallback(
    async (operation: QueuedOperation): Promise<boolean> => {
      try {
        await processOperationRef.current(operation);
        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        
        // Update operation with error
        setState((prev) => ({
          ...prev,
          queue: prev.queue.map((op) =>
            op.id === operation.id
              ? {
                  ...op,
                  retryCount: op.retryCount + 1,
                  lastError: error.message,
                }
              : op
          ),
        }));

        // Check if max retries reached
        if (operation.retryCount + 1 >= maxRetries) {
          onOperationFailed?.(operation, error);
          return false;
        }

        // Wait before retry
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * Math.pow(2, operation.retryCount))
        );

        return false;
      }
    },
    [maxRetries, retryDelay, onOperationFailed]
  );

  // Process queue
  const processQueueInternal = useCallback(async () => {
    if (processingRef.current || !state.isOnline || state.queue.length === 0) {
      return;
    }

    processingRef.current = true;
    setState((prev) => ({ ...prev, isProcessing: true, progress: 0 }));

    const totalOperations = state.queue.length;
    let processed = 0;
    let successCount = 0;
    let failedCount = 0;

    const operationsToProcess = [...state.queue];

    for (const operation of operationsToProcess) {
      if (!state.isOnline) break;

      setState((prev) => ({ ...prev, currentOperation: operation }));

      const success = await processOperationInternal(operation);

      if (success) {
        successCount++;
        dequeue(operation.id);
      } else if (operation.retryCount + 1 >= maxRetries) {
        failedCount++;
        dequeue(operation.id);
      }

      processed++;
      setState((prev) => ({
        ...prev,
        progress: Math.round((processed / totalOperations) * 100),
      }));
    }

    setState((prev) => ({
      ...prev,
      isProcessing: false,
      currentOperation: null,
      successCount: prev.successCount + successCount,
      failedCount: prev.failedCount + failedCount,
    }));

    processingRef.current = false;

    if (state.queue.length === 0) {
      onQueueEmpty?.();
      
      if (showToasts && successCount > 0) {
        showToast.success(
          `Sync complete - ${successCount} operation${successCount > 1 ? "s" : ""} synced successfully`
        );
      }
    }
  }, [
    state.isOnline,
    state.queue,
    processOperationInternal,
    dequeue,
    maxRetries,
    onQueueEmpty,
    showToasts,
  ]);

  // Retry specific operation
  const retryOperation = useCallback(
    async (id: string) => {
      const operation = state.queue.find((op) => op.id === id);
      if (!operation) return;

      setState((prev) => ({
        ...prev,
        queue: prev.queue.map((op) =>
          op.id === id ? { ...op, retryCount: 0, lastError: undefined } : op
        ),
      }));

      // Trigger queue processing
      processQueueInternal();
    },
    [state.queue, processQueueInternal]
  );

  return {
    ...state,
    enqueue,
    dequeue,
    clearQueue,
    processQueue: processQueueInternal,
    retryOperation,
  };
}

// =============================================================================
// SYNC STATUS INDICATOR
// =============================================================================

export interface SyncStatusIndicatorProps {
  /** Whether currently syncing */
  isSyncing: boolean;
  /** Number of pending changes */
  pendingChanges: number;
  /** Last sync time */
  lastSyncAt?: Date | null;
  /** Last error */
  lastError?: Error | null;
  /** Show as compact */
  compact?: boolean;
  /** Trigger manual sync */
  onSync?: () => void;
  /** Additional class name */
  className?: string;
}

/**
 * Visual indicator for sync status.
 */
export function SyncStatusIndicator({
    className,
    isSyncing,
    pendingChanges,
    lastSyncAt,
    lastError,
    compact = false,
    onSync,
  }: SyncStatusIndicatorProps) {
    const formatTime = (date: Date): string => {
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      
      return date.toLocaleDateString();
    };

    const getStatusConfig = () => {
      if (isSyncing) {
        return {
          icon: Loader2,
          iconClass: "animate-spin text-blue-500",
          label: "Syncing...",
          bgClass: "bg-blue-500/10",
        };
      }
      if (lastError) {
        return {
          icon: AlertCircle,
          iconClass: "text-destructive",
          label: "Sync failed",
          bgClass: "bg-destructive/10",
        };
      }
      if (pendingChanges > 0) {
        return {
          icon: Clock,
          iconClass: "text-amber-500",
          label: `${pendingChanges} pending`,
          bgClass: "bg-amber-500/10",
        };
      }
      return {
        icon: Check,
        iconClass: "text-emerald-500",
        label: "Synced",
        bgClass: "bg-emerald-500/10",
      };
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    if (compact) {
      return (
        <div
          className={cn(
            "flex items-center gap-1.5 text-xs text-muted-foreground",
            className
          )}
        >
          <Icon className={cn("h-3 w-3", config.iconClass)} />
          <span>{config.label}</span>
        </div>
      );
    }

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 gap-2", className)}
          >
            <Icon className={cn("h-4 w-4", config.iconClass)} />
            <span className="text-xs">{config.label}</span>
            {pendingChanges > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {pendingChanges}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="end">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Sync Status</span>
              {onSync && !isSyncing && pendingChanges > 0 && (
                <Button variant="ghost" size="sm" className="h-7" onClick={onSync}>
                  <RefreshCcw className="mr-1 h-3 w-3" />
                  Sync now
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pending changes</span>
                <span className="font-medium">{pendingChanges}</span>
              </div>

              {lastSyncAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last synced</span>
                  <span className="font-medium">{formatTime(lastSyncAt)}</span>
                </div>
              )}

              {lastError && (
                <div className="mt-2 rounded-md bg-destructive/10 p-2">
                  <p className="text-xs text-destructive">{lastError.message}</p>
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

// =============================================================================
// PENDING CHANGES DISPLAY
// =============================================================================

export interface PendingChangesDisplayProps {
  /** Queued operations */
  operations: QueuedOperation[];
  /** Whether currently processing */
  isProcessing: boolean;
  /** Processing progress */
  progress: number;
  /** Retry operation handler */
  onRetry?: (id: string) => void;
  /** Remove operation handler */
  onRemove?: (id: string) => void;
  /** Clear all handler */
  onClearAll?: () => void;
  /** Additional class name */
  className?: string;
}

/**
 * Display for pending offline changes.
 */
export function PendingChangesDisplay({
    className,
    operations,
    isProcessing,
    progress,
    onRetry,
    onRemove,
    onClearAll,
  }: PendingChangesDisplayProps) {
    if (operations.length === 0) {
      return (
        <div
          className={cn(
            "flex flex-col items-center justify-center p-6 text-center",
            className
          )}
        >
          <Cloud className="h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            All changes synced
          </p>
        </div>
      );
    }

    return (
      <div className={cn("space-y-4", className)}>
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Syncing...</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {operations.length} pending change{operations.length > 1 ? "s" : ""}
          </span>
          {onClearAll && operations.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              onClick={onClearAll}
            >
              Clear all
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {operations.slice(0, 5).map((operation) => (
              <motion.div
                key={operation.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full",
                      operation.lastError ? "bg-destructive/10" : "bg-muted"
                    )}
                  >
                    {operation.lastError ? (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    ) : (
                      <Upload className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {operation.description || operation.type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {operation.lastError || `Queued ${formatTimeAgo(operation.queuedAt)}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {operation.lastError && onRetry && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onRetry(operation.id)}
                    >
                      <RefreshCcw className="h-3 w-3" />
                    </Button>
                  )}
                  {onRemove && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onRemove(operation.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {operations.length > 5 && (
            <p className="text-center text-xs text-muted-foreground">
              +{operations.length - 5} more pending
            </p>
          )}
        </div>
      </div>
    );
  }

// Helper function
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  
  if (diffSecs < 60) return "just now";
  if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
  if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
  return `${Math.floor(diffSecs / 86400)}d ago`;
}

// =============================================================================
// OFFLINE BANNER
// =============================================================================

export interface OfflineBannerProps {
  /** Number of pending operations */
  pendingCount?: number;
  /** Retry handler */
  onRetry?: () => void;
  /** Dismiss handler */
  onDismiss?: () => void;
  /** Force show (for testing) */
  forceShow?: boolean;
  /** Additional class name */
  className?: string;
}

/**
 * Banner shown when offline with pending changes.
 */
export function OfflineBanner({ className, pendingCount = 0, onRetry, onDismiss, forceShow }: OfflineBannerProps) {
    const [isOnline, setIsOnline] = useState(
      forceShow !== undefined ? !forceShow : typeof navigator !== "undefined" ? navigator.onLine : true
    );
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
      if (forceShow !== undefined) {
        setIsOnline(!forceShow);
        return;
      }

      const handleOnline = () => {
        setIsOnline(true);
        setDismissed(false);
      };
      const handleOffline = () => setIsOnline(false);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }, [forceShow]);

    if (isOnline || dismissed) return null;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className={cn(
            "fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-amber-500 px-4 py-2 text-amber-50 shadow-lg",
            className
          )}
        >
          <div className="flex items-center gap-3">
            <CloudOff className="h-4 w-4" />
            <span className="text-sm font-medium">
              You're offline
              {pendingCount > 0 && ` • ${pendingCount} pending change${pendingCount > 1 ? "s" : ""}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onRetry && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-amber-50 hover:text-amber-100 hover:bg-amber-600"
                onClick={onRetry}
              >
                <RefreshCcw className="mr-1 h-3 w-3" />
                Retry
              </Button>
            )}
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-amber-50 hover:text-amber-100 hover:bg-amber-600"
                onClick={() => {
                  setDismissed(true);
                  onDismiss();
                }}
              >
                ✕
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }
