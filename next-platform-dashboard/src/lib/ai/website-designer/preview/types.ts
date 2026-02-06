/**
 * PHASE AWD-08: Preview & Iteration System
 * Type Definitions
 *
 * These types define the preview state, iteration tracking,
 * version history, and refinement system.
 */

import type { GeneratedPage, AppliedDesignSystem, SiteArchitecture } from "../types";

// =============================================================================
// PREVIEW STATE TYPES
// =============================================================================

/**
 * Status of the preview
 */
export type PreviewStatus =
  | "generating"
  | "preview"
  | "iterating"
  | "approved"
  | "applied";

/**
 * Main preview state
 */
export interface PreviewState {
  id: string;
  siteId: string;
  version: number;
  generatedAt: Date;
  pages: PreviewPage[];
  designSystem: AppliedDesignSystem;
  status: PreviewStatus;
  iterations: Iteration[];
  currentIteration: number;
  architecture?: SiteArchitecture;
}

/**
 * Preview page structure
 */
export interface PreviewPage {
  id: string;
  name: string;
  slug: string;
  title: string;
  description: string;
  isHomepage: boolean;
  components: PreviewComponent[];
  seo: PageSEO;
  order: number;
}

/**
 * Preview component with tracking metadata
 */
export interface PreviewComponent {
  id: string;
  type: string;
  props: Record<string, unknown>;
  renderKey: string;
  highlighted?: boolean;
  hasChanges?: boolean;
  aiNotes?: string;
}

/**
 * Page SEO settings
 */
export interface PageSEO {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  noIndex?: boolean;
}

// =============================================================================
// ITERATION TYPES
// =============================================================================

/**
 * Change type categories
 */
export type ChangeType = "component" | "page" | "style" | "content";

/**
 * Individual change record
 */
export interface Change {
  type: ChangeType;
  target: string;
  field?: string;
  oldValue?: unknown;
  newValue: unknown;
  description: string;
}

/**
 * Iteration record
 */
export interface Iteration {
  id: string;
  version: number;
  request: string;
  changes: Change[];
  timestamp: Date;
  approved: boolean;
}

// =============================================================================
// DEVICE PREVIEW TYPES
// =============================================================================

/**
 * Device type options
 */
export type DeviceType = "mobile" | "tablet" | "desktop";

/**
 * Device preview configuration
 */
export interface DevicePreview {
  device: DeviceType;
  width: number;
  height: number;
  scale: number;
}

/**
 * Device presets
 */
export const DEVICE_PRESETS: Record<DeviceType, DevicePreview> = {
  mobile: { device: "mobile", width: 375, height: 812, scale: 0.6 },
  tablet: { device: "tablet", width: 768, height: 1024, scale: 0.5 },
  desktop: { device: "desktop", width: 1440, height: 900, scale: 0.65 },
};

// =============================================================================
// REFINEMENT TYPES
// =============================================================================

/**
 * Refinement request type categories
 */
export type RefinementType =
  | "component"
  | "page"
  | "style"
  | "content"
  | "general";

/**
 * Refinement request from user
 */
export interface RefinementRequest {
  type: RefinementType;
  target?: string;
  request: string;
  context?: Record<string, unknown>;
}

/**
 * Result of a refinement operation
 */
export interface RefinementResult {
  success: boolean;
  changes: Change[];
  explanation: string;
  requiresRegeneration: boolean;
}

/**
 * Scope analysis result
 */
export interface RefinementScope {
  type: RefinementType;
  targets: string[];
  requiresRegeneration: boolean;
  confidence: number;
}

// =============================================================================
// STORE TYPES
// =============================================================================

/**
 * Preview store state
 */
export interface PreviewStoreState {
  // State
  previewState: PreviewState | null;
  stateHistory: PreviewState[];
  currentIndex: number;
  isRefining: boolean;
  activeDevice: DeviceType;
  activePage: number;
  showRefinementPanel: boolean;

  // Actions
  setPreviewState: (state: PreviewState) => void;
  setActiveDevice: (device: DeviceType) => void;
  setActivePage: (index: number) => void;
  setShowRefinementPanel: (show: boolean) => void;
  pushState: (state: PreviewState) => void;
  undo: () => void;
  redo: () => void;
  setRefining: (refining: boolean) => void;
  approve: () => PreviewState | null;
  reset: () => void;
}

// =============================================================================
// CONVERSION UTILITIES
// =============================================================================

/**
 * Convert GeneratedPage to PreviewPage
 */
export function toPreviewPage(page: GeneratedPage): PreviewPage {
  return {
    id: page.id,
    name: page.name,
    slug: page.slug,
    title: page.title,
    description: page.description,
    isHomepage: page.isHomepage,
    components: page.components.map((c) => ({
      id: c.id,
      type: c.type,
      props: c.props as Record<string, unknown>,
      renderKey: `${c.id}-${Date.now()}`,
      highlighted: false,
      hasChanges: false,
      aiNotes: c.aiNotes,
    })),
    seo: page.seo,
    order: page.order,
  };
}

/**
 * Create initial preview state from generation output
 */
export function createPreviewState(
  siteId: string,
  pages: GeneratedPage[],
  designSystem: AppliedDesignSystem,
  architecture?: SiteArchitecture
): PreviewState {
  return {
    id: crypto.randomUUID(),
    siteId,
    version: 1,
    generatedAt: new Date(),
    pages: pages.map(toPreviewPage),
    designSystem,
    status: "preview",
    iterations: [],
    currentIteration: -1,
    architecture,
  };
}
