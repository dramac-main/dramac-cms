// Error Types
export {
  AppError,
  AuthError,
  SessionExpiredError,
  InvalidCredentialsError,
  ForbiddenError,
  InsufficientPermissionsError,
  ValidationError,
  NotFoundError,
  ResourceAlreadyExistsError,
  RateLimitError,
  ApiError,
  NetworkError,
  TimeoutError,
  ServerError,
  ServiceUnavailableError,
  DatabaseError,
  FileUploadError,
  FileTooLargeError,
  UnsupportedFileTypeError,
  PaymentError,
  SubscriptionError,
  ConfigurationError,
  // Type guards
  isAppError,
  isValidationError,
  isAuthError,
  isNotFoundError,
  isNetworkError,
  isRateLimitError,
} from "./error-types";

// Error Handler
export {
  formatError,
  errorResponse,
  handleError,
  logError,
  getErrorSeverity,
  getSafeErrorMessage,
  isRetryableError,
  getRetryDelay,
  withErrorHandling,
  type FormattedError,
  type ErrorSeverity,
  type ErrorContext,
} from "./error-handler";

// Error Formatter
export {
  formatErrorForDisplay,
  formatErrorForToast,
  formatValidationErrors,
  getInlineErrorMessage,
  formatHttpStatusMessage,
  extractFieldErrors,
  summarizeErrors,
  type ErrorDisplay,
} from "./error-formatter";
