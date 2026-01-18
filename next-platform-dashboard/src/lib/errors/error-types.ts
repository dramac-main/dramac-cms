/**
 * Custom Error Types for the Application
 * These provide consistent error handling throughout the app
 */

// Base application error
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;

  constructor(
    message: string,
    options: {
      code?: string;
      statusCode?: number;
      isOperational?: boolean;
    } = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = options.code || "UNKNOWN_ERROR";
    this.statusCode = options.statusCode || 500;
    this.isOperational = options.isOperational ?? true;
    this.timestamp = new Date();
    
    // Maintain proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
    };
  }
}

// Authentication errors
export class AuthError extends AppError {
  constructor(message = "Authentication required") {
    super(message, { code: "AUTH_ERROR", statusCode: 401 });
  }
}

export class SessionExpiredError extends AppError {
  constructor(message = "Your session has expired. Please sign in again.") {
    super(message, { code: "SESSION_EXPIRED", statusCode: 401 });
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message = "Invalid email or password") {
    super(message, { code: "INVALID_CREDENTIALS", statusCode: 401 });
  }
}

// Authorization errors
export class ForbiddenError extends AppError {
  constructor(message = "Access denied") {
    super(message, { code: "FORBIDDEN", statusCode: 403 });
  }
}

export class InsufficientPermissionsError extends AppError {
  public readonly requiredPermission?: string;

  constructor(message = "You don't have permission to perform this action", requiredPermission?: string) {
    super(message, { code: "INSUFFICIENT_PERMISSIONS", statusCode: 403 });
    this.requiredPermission = requiredPermission;
  }
}

// Validation errors
export class ValidationError extends AppError {
  public readonly fields: Record<string, string[]>;

  constructor(message = "Validation failed", fields: Record<string, string[]> = {}) {
    super(message, { code: "VALIDATION_ERROR", statusCode: 400 });
    this.fields = fields;
  }

  /**
   * Create a ValidationError from a single field error
   */
  static fromField(field: string, message: string): ValidationError {
    return new ValidationError("Validation failed", { [field]: [message] });
  }

  /**
   * Create a ValidationError from multiple field errors
   */
  static fromFields(fields: Record<string, string | string[]>): ValidationError {
    const normalizedFields: Record<string, string[]> = {};
    
    for (const [key, value] of Object.entries(fields)) {
      normalizedFields[key] = Array.isArray(value) ? value : [value];
    }
    
    return new ValidationError("Validation failed", normalizedFields);
  }

  /**
   * Check if a specific field has errors
   */
  hasFieldError(field: string): boolean {
    return field in this.fields && this.fields[field].length > 0;
  }

  /**
   * Get errors for a specific field
   */
  getFieldErrors(field: string): string[] {
    return this.fields[field] || [];
  }
}

// Resource errors
export class NotFoundError extends AppError {
  public readonly resource: string;
  public readonly resourceId?: string;

  constructor(resource = "Resource", id?: string) {
    super(`${resource} not found${id ? `: ${id}` : ""}`, {
      code: "NOT_FOUND",
      statusCode: 404,
    });
    this.resource = resource;
    this.resourceId = id;
  }
}

export class ResourceAlreadyExistsError extends AppError {
  public readonly resource: string;

  constructor(resource = "Resource", identifier?: string) {
    super(`${resource} already exists${identifier ? `: ${identifier}` : ""}`, {
      code: "ALREADY_EXISTS",
      statusCode: 409,
    });
    this.resource = resource;
  }
}

// Rate limiting
export class RateLimitError extends AppError {
  public readonly retryAfter: number;

  constructor(retryAfter = 60) {
    super("Too many requests. Please try again later.", {
      code: "RATE_LIMITED",
      statusCode: 429,
    });
    this.retryAfter = retryAfter;
  }
}

// API errors
export class ApiError extends AppError {
  public readonly endpoint?: string;

  constructor(message: string, statusCode = 500, endpoint?: string) {
    super(message, { code: "API_ERROR", statusCode });
    this.endpoint = endpoint;
  }
}

// Network errors
export class NetworkError extends AppError {
  constructor(message = "Network error. Please check your connection.") {
    super(message, { code: "NETWORK_ERROR", statusCode: 0 });
  }
}

export class TimeoutError extends AppError {
  public readonly timeoutMs: number;

  constructor(timeoutMs = 30000) {
    super(`Request timed out after ${timeoutMs / 1000} seconds`, {
      code: "TIMEOUT",
      statusCode: 408,
    });
    this.timeoutMs = timeoutMs;
  }
}

// Server errors
export class ServerError extends AppError {
  constructor(message = "An internal server error occurred") {
    super(message, { code: "SERVER_ERROR", statusCode: 500, isOperational: false });
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service = "Service", _retryAfter?: number) {
    super(`${service} is temporarily unavailable. Please try again later.`, {
      code: "SERVICE_UNAVAILABLE",
      statusCode: 503,
    });
  }
}

// Database errors
export class DatabaseError extends AppError {
  constructor(message = "A database error occurred") {
    super(message, { code: "DATABASE_ERROR", statusCode: 500, isOperational: false });
  }
}

// File/Media errors
export class FileUploadError extends AppError {
  public readonly fileName?: string;
  public readonly fileSize?: number;

  constructor(message = "File upload failed", fileName?: string, fileSize?: number) {
    super(message, { code: "FILE_UPLOAD_ERROR", statusCode: 400 });
    this.fileName = fileName;
    this.fileSize = fileSize;
  }
}

export class FileTooLargeError extends AppError {
  public readonly maxSize: number;
  public readonly fileName?: string;
  public readonly actualSize?: number;

  constructor(maxSize: number, fileName?: string, actualSize?: number) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    super(`File exceeds maximum size of ${maxSizeMB}MB`, {
      code: "FILE_TOO_LARGE",
      statusCode: 400,
    });
    this.maxSize = maxSize;
    this.fileName = fileName;
    this.actualSize = actualSize;
  }
}

export class UnsupportedFileTypeError extends AppError {
  public readonly fileType: string;
  public readonly supportedTypes: string[];
  public readonly fileName?: string;

  constructor(fileType: string, supportedTypes: string[], fileName?: string) {
    super(
      `File type "${fileType}" is not supported. Supported types: ${supportedTypes.join(", ")}`,
      {
        code: "UNSUPPORTED_FILE_TYPE",
        statusCode: 400,
      }
    );
    this.fileType = fileType;
    this.supportedTypes = supportedTypes;
    this.fileName = fileName;
  }
}

// Payment/Billing errors
export class PaymentError extends AppError {
  public readonly paymentId?: string;

  constructor(message = "Payment processing failed", paymentId?: string) {
    super(message, { code: "PAYMENT_ERROR", statusCode: 402 });
    this.paymentId = paymentId;
  }
}

export class SubscriptionError extends AppError {
  constructor(message = "Subscription error occurred") {
    super(message, { code: "SUBSCRIPTION_ERROR", statusCode: 402 });
  }
}

// Configuration errors
export class ConfigurationError extends AppError {
  public readonly configKey?: string;

  constructor(message = "Configuration error", configKey?: string) {
    super(message, { code: "CONFIG_ERROR", statusCode: 500, isOperational: false });
    this.configKey = configKey;
  }
}

// Type guard functions
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError;
}
