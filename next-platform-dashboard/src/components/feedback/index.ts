// =============================================================================
// FEEDBACK COMPONENTS BARREL EXPORT
// =============================================================================

/**
 * This module exports all feedback components for the DRAMAC CMS platform.
 * Includes loading states, empty states, error handling, and form validation.
 * 
 * @module @/components/feedback
 * @version 1.0.0
 */

// Loading components
export {
  PageLoader,
  ContentLoader,
  InlineLoader,
  LoadingOverlay,
  Skeleton,
  type PageLoaderProps,
  type ContentLoaderProps,
  type ContentLoaderVariant,
  type InlineLoaderProps,
  type LoadingOverlayProps,
} from "./page-loader";

// Empty state components
export {
  EmptyState,
  NoResults,
  GettingStarted,
  type EmptyStateProps,
  type EmptyStateAction,
  type EmptyStateIllustration,
  type NoResultsProps,
  type GettingStartedStep,
  type GettingStartedProps,
} from "./empty-state";

// Error handling components
export {
  ErrorBoundary,
  ErrorState,
  InlineError,
  OfflineIndicator,
  ConnectionStatus,
  type ErrorBoundaryProps,
  type ErrorStateProps,
  type ErrorSeverity,
  type InlineErrorProps,
  type OfflineIndicatorProps,
  type ConnectionStatusProps,
} from "./error-state";

// Confirmation dialogs
export {
  ConfirmDialog,
  DeleteDialog,
  AlertBanner,
  type ConfirmDialogProps,
  type ConfirmDialogVariant,
  type DeleteDialogProps,
  type AlertBannerProps,
  type AlertBannerVariant,
} from "./confirm-dialog";

// Form validation components
export {
  FormFieldError,
  FormFieldSuccess,
  FormSummaryError,
  FormStatus,
  ValidationHint,
  type FormFieldErrorProps,
  type FormFieldSuccessProps,
  type FormSummaryErrorProps,
  type FormStatusProps,
  type FormStatusType,
  type ValidationHintProps,
} from "./form-validation";
