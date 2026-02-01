// src/lib/toast.ts
/**
 * Unified toast notification utility
 * 
 * Provides consistent toast patterns across the application with:
 * - Standard success/error/warning/info toasts
 * - Error-to-toast conversion
 * - Promise-based loading toasts
 * - Undo pattern for destructive actions
 * - Action buttons
 * 
 * @example
 * ```tsx
 * import { showToast } from '@/lib/toast';
 * 
 * // Simple toasts
 * showToast.success('Changes saved');
 * showToast.error('Failed to save');
 * 
 * // From ActionResult
 * const result = await createItem(data);
 * if (!result.success) {
 *   showToast.actionError(result.error);
 * }
 * 
 * // Promise toast
 * showToast.promise(saveData(), {
 *   loading: 'Saving...',
 *   success: 'Saved!',
 *   error: 'Failed to save',
 * });
 * 
 * // Undo pattern
 * showToast.undo('Item deleted', async () => {
 *   await restoreItem(id);
 * });
 * ```
 */

import { toast, ExternalToast } from 'sonner';
import { ActionError, ErrorCode } from '@/lib/types/result';

// =============================================================================
// TYPES
// =============================================================================

export interface ToastOptions extends ExternalToast {
  /** Duration in milliseconds */
  duration?: number;
}

export interface PromiseToastMessages<T> {
  loading: string;
  success: string | ((data: T) => string);
  error: string | ((error: Error) => string);
}

export interface UndoOptions {
  /** Duration before undo expires (default: 5000ms) */
  duration?: number;
  /** Called if undo is NOT clicked before duration */
  onComplete?: () => void;
  /** Description text */
  description?: string;
}

// =============================================================================
// ERROR MESSAGE MAPPING
// =============================================================================

const ERROR_TITLES: Record<ErrorCode, string> = {
  VALIDATION_ERROR: 'Validation Error',
  NOT_FOUND: 'Not Found',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Access Denied',
  CONFLICT: 'Conflict',
  RATE_LIMITED: 'Too Many Requests',
  SERVER_ERROR: 'Server Error',
  NETWORK_ERROR: 'Connection Error',
  TIMEOUT: 'Request Timeout',
  MODULE_NOT_ENABLED: 'Module Not Enabled',
  SUBSCRIPTION_REQUIRED: 'Subscription Required',
  USAGE_LIMIT_EXCEEDED: 'Limit Exceeded',
};

// =============================================================================
// TOAST UTILITIES
// =============================================================================

/**
 * Unified toast utility object
 */
export const showToast = {
  /**
   * Show a success toast
   */
  success: (message: string, options?: ToastOptions) => {
    return toast.success(message, {
      duration: 4000,
      ...options,
    });
  },

  /**
   * Show an error toast
   */
  error: (message: string, options?: ToastOptions) => {
    return toast.error(message, {
      duration: 6000,
      ...options,
    });
  },

  /**
   * Show a warning toast
   */
  warning: (message: string, options?: ToastOptions) => {
    return toast.warning(message, {
      duration: 5000,
      ...options,
    });
  },

  /**
   * Show an info toast
   */
  info: (message: string, options?: ToastOptions) => {
    return toast.info(message, {
      duration: 4000,
      ...options,
    });
  },

  /**
   * Show a toast from an ActionError
   */
  actionError: (error: ActionError, options?: ToastOptions) => {
    const title = ERROR_TITLES[error.code] || 'Error';
    return toast.error(title, {
      description: error.message,
      duration: 6000,
      ...options,
    });
  },

  /**
   * Show a toast from any error (Error object or ActionError)
   */
  fromError: (error: Error | ActionError | string, options?: ToastOptions) => {
    if (typeof error === 'string') {
      return toast.error(error, { duration: 6000, ...options });
    }
    
    if ('code' in error) {
      return showToast.actionError(error as ActionError, options);
    }
    
    return toast.error(error.message || 'An error occurred', {
      duration: 6000,
      ...options,
    });
  },

  /**
   * Show a loading toast that updates on promise resolution
   */
  promise: <T>(
    promise: Promise<T>,
    messages: PromiseToastMessages<T>,
    options?: ToastOptions
  ) => {
    return toast.promise(promise, {
      ...messages,
      ...options,
    });
  },

  /**
   * Show a toast with an action button
   */
  action: (
    message: string,
    action: { label: string; onClick: () => void },
    options?: ToastOptions
  ) => {
    return toast(message, {
      action: {
        label: action.label,
        onClick: action.onClick,
      },
      ...options,
    });
  },

  /**
   * Show a toast with undo action for destructive operations
   * 
   * @param message - The message to display
   * @param onUndo - Callback when undo is clicked
   * @param options - Additional options
   * @returns The toast ID
   * 
   * @example
   * ```tsx
   * const handleDelete = async (id: string) => {
   *   // Optimistically update UI
   *   setItems(prev => prev.filter(item => item.id !== id));
   *   
   *   showToast.undo(
   *     'Item deleted',
   *     () => {
   *       // Restore item in UI
   *       setItems(prev => [...prev, deletedItem]);
   *     },
   *     {
   *       duration: 5000,
   *       onComplete: async () => {
   *         // Actually delete after undo window passes
   *         await deleteItem(id);
   *       },
   *     }
   *   );
   * };
   * ```
   */
  undo: (
    message: string,
    onUndo: () => void | Promise<void>,
    options: UndoOptions = {}
  ) => {
    const { duration = 5000, onComplete, description } = options;
    let undoClicked = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const toastId = toast(message, {
      description,
      duration,
      action: {
        label: 'Undo',
        onClick: async () => {
          undoClicked = true;
          clearTimeout(timeoutId);
          try {
            await onUndo();
            toast.success('Action undone');
          } catch (error) {
            toast.error('Failed to undo');
            console.error('Undo failed:', error);
          }
        },
      },
      onDismiss: () => {
        if (!undoClicked) {
          clearTimeout(timeoutId);
          onComplete?.();
        }
      },
    });

    // Also trigger onComplete after duration if toast is not dismissed
    if (onComplete) {
      timeoutId = setTimeout(() => {
        if (!undoClicked) {
          onComplete();
        }
      }, duration);
    }

    return toastId;
  },

  /**
   * Show a loading toast (for manual control)
   */
  loading: (message: string, options?: ToastOptions) => {
    return toast.loading(message, options);
  },

  /**
   * Dismiss a toast by ID
   */
  dismiss: (toastId?: string | number) => {
    toast.dismiss(toastId);
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    toast.dismiss();
  },

  /**
   * Show a custom toast with ReactNode content
   */
  custom: (content: React.ReactNode, options?: ToastOptions) => {
    return toast.custom(() => content as React.ReactElement, options);
  },

  /**
   * Update an existing toast
   */
  update: (
    toastId: string | number,
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info'
  ) => {
    toast.dismiss(toastId);
    switch (type) {
      case 'success':
        return toast.success(message);
      case 'error':
        return toast.error(message);
      case 'warning':
        return toast.warning(message);
      default:
        return toast.info(message);
    }
  },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Show appropriate toast based on ActionResult
 */
export function showResultToast<T>(
  result: { success: true; data: T } | { success: false; error: ActionError },
  options: {
    successMessage?: string | ((data: T) => string);
    errorMessage?: string;
  } = {}
): void {
  if (result.success) {
    const message = typeof options.successMessage === 'function'
      ? options.successMessage(result.data)
      : options.successMessage || 'Success';
    showToast.success(message);
  } else {
    showToast.actionError(result.error);
  }
}

/**
 * Create a promise toast handler for server actions
 */
export function createActionToast<T>(
  messages: PromiseToastMessages<T>
): (promise: Promise<{ success: true; data: T } | { success: false; error: ActionError }>) => Promise<{ success: true; data: T } | { success: false; error: ActionError }> {
  return async (promise) => {
    const toastId = showToast.loading(messages.loading);
    
    try {
      const result = await promise;
      
      toast.dismiss(toastId);
      
      if (result.success) {
        const successMsg = typeof messages.success === 'function'
          ? messages.success(result.data)
          : messages.success;
        showToast.success(successMsg);
      } else {
        showToast.actionError(result.error);
      }
      
      return result;
    } catch (error) {
      toast.dismiss(toastId);
      const errorMsg = typeof messages.error === 'function' && error instanceof Error
        ? messages.error(error)
        : typeof messages.error === 'string' 
          ? messages.error 
          : 'An error occurred';
      showToast.error(errorMsg);
      throw error;
    }
  };
}

// Default export for convenience
export default showToast;
