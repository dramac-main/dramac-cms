/**
 * PHASE AWD-08: Preview & Iteration System
 * Public Exports
 */

// Types
export type {
  PreviewStatus,
  PreviewState,
  PreviewPage,
  PreviewComponent,
  PageSEO,
  ChangeType,
  Change,
  Iteration,
  DeviceType,
  DevicePreview,
  RefinementType,
  RefinementRequest,
  RefinementResult,
  RefinementScope,
  PreviewStoreState,
} from "./types";

export { DEVICE_PRESETS, toPreviewPage, createPreviewState } from "./types";

// Store
export {
  usePreviewStore,
  selectPreviewState,
  selectCanUndo,
  selectCanRedo,
  selectCurrentPage,
  selectIterationCount,
  selectStatus,
  usePreviewHistory,
  useCurrentPage,
  usePreviewStatus,
} from "./store";

// Iteration Engine
export { IterationEngine, QUICK_REFINEMENTS } from "./iteration-engine";

// Hooks
export { usePreviewState } from "./use-preview-state";
