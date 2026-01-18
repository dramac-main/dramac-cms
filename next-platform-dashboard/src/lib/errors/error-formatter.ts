import {
  ValidationError,
  isAppError,
  isValidationError,
} from "./error-types";

/**
 * User-friendly error display information
 */
export interface ErrorDisplay {
  title: string;
  message: string;
  details?: string;
  action?: {
    label: string;
    type: "retry" | "login" | "upgrade" | "contact" | "dismiss" | "back";
  };
  icon?: "error" | "warning" | "info" | "auth" | "forbidden" | "notfound" | "network" | "payment";
}

/**
 * Map error codes to user-friendly titles
 */
const ERROR_TITLES: Record<string, string> = {
  AUTH_ERROR: "Authentication Required",
  SESSION_EXPIRED: "Session Expired",
  INVALID_CREDENTIALS: "Login Failed",
  FORBIDDEN: "Access Denied",
  INSUFFICIENT_PERMISSIONS: "Permission Required",
  VALIDATION_ERROR: "Invalid Input",
  NOT_FOUND: "Not Found",
  ALREADY_EXISTS: "Already Exists",
  RATE_LIMITED: "Slow Down",
  API_ERROR: "Request Failed",
  NETWORK_ERROR: "Connection Error",
  TIMEOUT: "Request Timeout",
  SERVER_ERROR: "Server Error",
  SERVICE_UNAVAILABLE: "Service Unavailable",
  DATABASE_ERROR: "Server Error",
  FILE_UPLOAD_ERROR: "Upload Failed",
  FILE_TOO_LARGE: "File Too Large",
  UNSUPPORTED_FILE_TYPE: "Invalid File Type",
  PAYMENT_ERROR: "Payment Failed",
  SUBSCRIPTION_ERROR: "Subscription Error",
  CONFIG_ERROR: "Configuration Error",
  UNKNOWN_ERROR: "Error",
};

/**
 * Map error codes to icons
 */
const ERROR_ICONS: Record<string, ErrorDisplay["icon"]> = {
  AUTH_ERROR: "auth",
  SESSION_EXPIRED: "auth",
  INVALID_CREDENTIALS: "auth",
  FORBIDDEN: "forbidden",
  INSUFFICIENT_PERMISSIONS: "forbidden",
  VALIDATION_ERROR: "warning",
  NOT_FOUND: "notfound",
  ALREADY_EXISTS: "warning",
  RATE_LIMITED: "warning",
  API_ERROR: "error",
  NETWORK_ERROR: "network",
  TIMEOUT: "network",
  SERVER_ERROR: "error",
  SERVICE_UNAVAILABLE: "error",
  DATABASE_ERROR: "error",
  FILE_UPLOAD_ERROR: "warning",
  FILE_TOO_LARGE: "warning",
  UNSUPPORTED_FILE_TYPE: "warning",
  PAYMENT_ERROR: "payment",
  SUBSCRIPTION_ERROR: "payment",
  CONFIG_ERROR: "error",
  UNKNOWN_ERROR: "error",
};

/**
 * Get suggested action for error
 */
function getErrorAction(error: unknown): ErrorDisplay["action"] | undefined {
  if (!isAppError(error)) {
    return { label: "Try Again", type: "retry" };
  }

  switch (error.code) {
    case "AUTH_ERROR":
    case "SESSION_EXPIRED":
    case "INVALID_CREDENTIALS":
      return { label: "Sign In", type: "login" };
    
    case "FORBIDDEN":
    case "INSUFFICIENT_PERMISSIONS":
      return { label: "Go Back", type: "back" };
    
    case "RATE_LIMITED":
      return { label: "Wait and Retry", type: "retry" };
    
    case "NETWORK_ERROR":
    case "TIMEOUT":
      return { label: "Try Again", type: "retry" };
    
    case "SERVER_ERROR":
    case "SERVICE_UNAVAILABLE":
    case "DATABASE_ERROR":
      return { label: "Try Again Later", type: "retry" };
    
    case "PAYMENT_ERROR":
    case "SUBSCRIPTION_ERROR":
      return { label: "Update Payment", type: "upgrade" };
    
    case "VALIDATION_ERROR":
    case "FILE_TOO_LARGE":
    case "UNSUPPORTED_FILE_TYPE":
    case "FILE_UPLOAD_ERROR":
      return { label: "Fix and Retry", type: "retry" };
    
    case "NOT_FOUND":
      return { label: "Go Back", type: "back" };
    
    default:
      return { label: "Dismiss", type: "dismiss" };
  }
}

/**
 * Format validation field errors for display
 */
export function formatValidationErrors(error: ValidationError): string {
  const fieldErrors = Object.entries(error.fields);
  
  if (fieldErrors.length === 0) {
    return error.message;
  }

  if (fieldErrors.length === 1) {
    const [field, errors] = fieldErrors[0];
    return errors[0] || `Invalid ${field}`;
  }

  return `Please fix the following: ${fieldErrors
    .map(([field, errors]) => errors[0] || `Invalid ${field}`)
    .join(", ")}`;
}

/**
 * Format error for user display
 */
export function formatErrorForDisplay(error: unknown): ErrorDisplay {
  // Handle AppError instances
  if (isAppError(error)) {
    const title = ERROR_TITLES[error.code] || ERROR_TITLES.UNKNOWN_ERROR;
    const icon = ERROR_ICONS[error.code] || ERROR_ICONS.UNKNOWN_ERROR;
    const action = getErrorAction(error);

    // Special handling for validation errors
    if (isValidationError(error)) {
      return {
        title,
        message: formatValidationErrors(error),
        icon,
        action,
      };
    }

    return {
      title,
      message: error.message,
      icon,
      action,
    };
  }

  // Handle standard Error
  if (error instanceof Error) {
    return {
      title: "Error",
      message: error.message || "An unexpected error occurred",
      icon: "error",
      action: { label: "Try Again", type: "retry" },
    };
  }

  // Handle string errors
  if (typeof error === "string") {
    return {
      title: "Error",
      message: error,
      icon: "error",
      action: { label: "Dismiss", type: "dismiss" },
    };
  }

  // Handle unknown errors
  return {
    title: "Unexpected Error",
    message: "An unexpected error occurred. Please try again.",
    icon: "error",
    action: { label: "Try Again", type: "retry" },
  };
}

/**
 * Format error for toast notification
 */
export function formatErrorForToast(error: unknown): {
  title: string;
  description: string;
  variant: "default" | "destructive";
} {
  const display = formatErrorForDisplay(error);
  
  return {
    title: display.title,
    description: display.message,
    variant: "destructive",
  };
}

/**
 * Get a short error message for inline display
 */
export function getInlineErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "An error occurred";
}

/**
 * Format HTTP status code to user-friendly message
 */
export function formatHttpStatusMessage(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return "Bad request. Please check your input.";
    case 401:
      return "Please sign in to continue.";
    case 403:
      return "You don't have permission to access this.";
    case 404:
      return "The requested resource was not found.";
    case 408:
      return "Request timed out. Please try again.";
    case 409:
      return "This resource already exists or conflicts with another.";
    case 422:
      return "The request was understood but contained invalid data.";
    case 429:
      return "Too many requests. Please wait a moment.";
    case 500:
      return "Server error. Please try again later.";
    case 502:
      return "Service temporarily unavailable. Please try again.";
    case 503:
      return "Service is temporarily down for maintenance.";
    case 504:
      return "Request took too long. Please try again.";
    default:
      if (statusCode >= 400 && statusCode < 500) {
        return "Request failed. Please try again.";
      }
      if (statusCode >= 500) {
        return "Server error. Please try again later.";
      }
      return "An error occurred.";
  }
}

/**
 * Extract field-level errors from validation error for form integration
 */
export function extractFieldErrors(error: unknown): Record<string, string> | null {
  if (!isValidationError(error)) {
    return null;
  }

  const fieldErrors: Record<string, string> = {};
  
  for (const [field, errors] of Object.entries(error.fields)) {
    if (errors.length > 0) {
      fieldErrors[field] = errors[0];
    }
  }

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
}

/**
 * Create a user-friendly error summary for multiple errors
 */
export function summarizeErrors(errors: unknown[]): string {
  if (errors.length === 0) {
    return "No errors";
  }

  if (errors.length === 1) {
    return getInlineErrorMessage(errors[0]);
  }

  const messages = errors.map(getInlineErrorMessage);
  return `${errors.length} errors occurred: ${messages.slice(0, 3).join("; ")}${
    errors.length > 3 ? "..." : ""
  }`;
}
