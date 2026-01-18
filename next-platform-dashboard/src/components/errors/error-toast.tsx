"use client";

import { toast } from "sonner";
import { 
  formatErrorForDisplay,
} from "@/lib/errors";

/**
 * Toast options for different error types
 */
interface ErrorToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Show an error toast notification
 */
export function showErrorToast(error: unknown, options?: ErrorToastOptions) {
  const formatted = formatErrorForDisplay(error);
  
  toast.error(options?.title || formatted.title, {
    description: options?.description || formatted.message,
    duration: options?.duration || 5000,
    action: options?.action ? {
      label: options.action.label,
      onClick: options.action.onClick,
    } : undefined,
  });
}

/**
 * Show a warning toast notification
 */
export function showWarningToast(message: string, options?: Omit<ErrorToastOptions, "title">) {
  toast.warning("Warning", {
    description: message,
    duration: options?.duration || 4000,
    action: options?.action ? {
      label: options.action.label,
      onClick: options.action.onClick,
    } : undefined,
  });
}

/**
 * Show an info toast notification
 */
export function showInfoToast(message: string, title?: string) {
  toast.info(title || "Info", {
    description: message,
    duration: 4000,
  });
}

/**
 * Show a success toast notification
 */
export function showSuccessToast(message: string, title?: string) {
  toast.success(title || "Success", {
    description: message,
    duration: 3000,
  });
}

/**
 * Show a validation error toast
 * Displays field errors in a formatted way
 */
export function showValidationErrorToast(
  errors: Record<string, string | string[]>,
  title = "Validation Error"
) {
  const errorMessages = Object.entries(errors)
    .map(([field, messages]) => {
      const messageArray = Array.isArray(messages) ? messages : [messages];
      return `${field}: ${messageArray.join(", ")}`;
    })
    .join("\n");

  toast.error(title, {
    description: errorMessages,
    duration: 6000,
  });
}

/**
 * Show a network error toast with retry action
 */
export function showNetworkErrorToast(onRetry?: () => void) {
  toast.error("Connection Error", {
    description: "Unable to connect. Please check your internet connection.",
    duration: 5000,
    action: onRetry ? {
      label: "Retry",
      onClick: onRetry,
    } : undefined,
  });
}

/**
 * Show an authentication error toast with login action
 */
export function showAuthErrorToast(onLogin?: () => void) {
  toast.error("Authentication Required", {
    description: "Please sign in to continue.",
    duration: 5000,
    action: onLogin ? {
      label: "Sign In",
      onClick: onLogin,
    } : undefined,
  });
}

/**
 * Show a rate limit error toast
 */
export function showRateLimitToast(retryAfter?: number) {
  const message = retryAfter
    ? `Please wait ${retryAfter} seconds before trying again.`
    : "Too many requests. Please wait a moment.";

  toast.warning("Slow Down", {
    description: message,
    duration: Math.max(retryAfter || 5, 5) * 1000,
  });
}

/**
 * Show a server error toast
 */
export function showServerErrorToast(onRetry?: () => void) {
  toast.error("Server Error", {
    description: "Something went wrong on our end. Please try again later.",
    duration: 5000,
    action: onRetry ? {
      label: "Try Again",
      onClick: onRetry,
    } : undefined,
  });
}

/**
 * Show a permission denied toast
 */
export function showPermissionDeniedToast() {
  toast.error("Access Denied", {
    description: "You don't have permission to perform this action.",
    duration: 5000,
  });
}

/**
 * Show a not found toast
 */
export function showNotFoundToast(resource = "Resource") {
  toast.error("Not Found", {
    description: `The ${resource.toLowerCase()} you're looking for doesn't exist.`,
    duration: 4000,
  });
}

/**
 * Show an upload error toast
 */
export function showUploadErrorToast(fileName?: string, reason?: string) {
  const description = fileName
    ? `Failed to upload "${fileName}"${reason ? `: ${reason}` : ""}`
    : reason || "Upload failed. Please try again.";

  toast.error("Upload Failed", {
    description,
    duration: 5000,
  });
}

/**
 * Show a payment error toast
 */
export function showPaymentErrorToast(message?: string) {
  toast.error("Payment Failed", {
    description: message || "There was an issue processing your payment. Please try again.",
    duration: 6000,
  });
}

/**
 * Promise-based toast for async operations
 * Shows loading, success, and error states
 */
export function toastPromise<T>(
  promise: Promise<T>,
  options: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: unknown) => string);
  }
): Promise<T> {
  toast.promise(promise, {
    loading: options.loading,
    success: (data) => 
      typeof options.success === "function" 
        ? options.success(data) 
        : options.success,
    error: (error) => {
      if (typeof options.error === "function") {
        return options.error(error);
      }
      return options.error;
    },
  });
  
  return promise;
}

/**
 * Dismiss all toasts
 */
export function dismissAllToasts() {
  toast.dismiss();
}

/**
 * Dismiss a specific toast
 */
export function dismissToast(toastId: string | number) {
  toast.dismiss(toastId);
}
