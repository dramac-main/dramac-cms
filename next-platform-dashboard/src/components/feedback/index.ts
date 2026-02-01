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

// Loading wrapper components
export {
  LoadingWrapper,
  AsyncBoundary,
  DataLoadingState,
  RefreshButton,
  LoadingDots,
  LoadingText,
  type LoadingWrapperProps,
  type LoadingState,
  type AsyncBoundaryProps,
  type DataLoadingStateProps,
  type RefreshButtonProps,
  type LoadingDotsProps,
  type LoadingTextProps,
} from "./loading-wrapper";

// Empty state presets
export {
  EmptyStatePreset,
  NoResultsEmptyState,
  FilterEmptyState,
  GettingStartedEmptyState,
  presetConfigs,
  type EmptyStatePresetProps,
  type EmptyStatePreset as EmptyStatePresetType,
  type NoResultsEmptyStateProps,
  type FilterEmptyStateProps,
  type GettingStartedEmptyStateProps,
} from "./empty-state-presets";

// Session timeout components
export {
  SessionTimeoutProvider,
  SessionTimeoutDialog,
  SessionTimeoutBanner,
  useSessionTimeout,
  useIdleTimer,
  type SessionTimeoutContextValue,
  type SessionTimeoutProviderProps,
  type SessionTimeoutBannerProps,
  type UseIdleTimerOptions,
} from "./session-timeout";

// Destructive confirmation components
export {
  DestructiveConfirmDialog,
  BatchActionConfirmDialog,
  AcknowledgmentDialog,
  type DestructiveConfirmDialogProps,
  type BatchActionConfirmDialogProps,
  type AcknowledgmentDialogProps,
} from "./destructive-confirm";

// Offline handling components
export {
  useOfflineQueue,
  SyncStatusIndicator,
  PendingChangesDisplay,
  OfflineBanner,
  type QueuedOperation,
  type OfflineQueueConfig,
  type OfflineQueueState,
  type UseOfflineQueueOptions,
  type UseOfflineQueueResult,
  type SyncStatusIndicatorProps,
  type PendingChangesDisplayProps,
  type OfflineBannerProps,
} from "./offline-handler";
