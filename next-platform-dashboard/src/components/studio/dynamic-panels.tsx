/**
 * DRAMAC Studio Code-Split Panel Imports
 * 
 * Uses Next.js dynamic imports for code-splitting heavy panel components.
 * Reduces initial bundle size and improves time-to-interactive.
 * 
 * @phase STUDIO-21
 */

"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// =============================================================================
// LOADING COMPONENT
// =============================================================================

function PanelLoading() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}

// =============================================================================
// DYNAMIC PANEL IMPORTS
// =============================================================================

/**
 * Properties Panel (RightPanel) - Heavy component with form controls
 * Loaded only when right panel is opened
 */
export const DynamicPropertiesPanel = dynamic(
  () => import("@/components/studio/properties/properties-panel").then((mod) => mod.PropertiesPanel),
  {
    loading: () => <PanelLoading />,
    ssr: false,
  }
);

/**
 * Component Library Panel (LeftPanel) - Heavy component with all available components
 * Loaded only when left panel is opened
 */
export const DynamicComponentLibrary = dynamic(
  () => import("@/components/studio/panels/component-library").then((mod) => mod.ComponentLibrary),
  {
    loading: () => <PanelLoading />,
    ssr: false,
  }
);

/**
 * AI Page Generator - Heavy modal with AI generation
 * Loaded only when page generator is opened
 */
export const DynamicAIPageGenerator = dynamic(
  () => import("@/components/studio/ai/ai-page-generator").then((mod) => mod.AIPageGenerator),
  {
    loading: () => <PanelLoading />,
    ssr: false,
  }
);

/**
 * Virtualized Component List - For large component trees
 * Loaded only when component count exceeds threshold
 */
export const DynamicVirtualizedList = dynamic(
  () => import("@/components/studio/panels/virtualized-component-list").then((mod) => mod.VirtualizedComponentList),
  {
    loading: () => <PanelLoading />,
    ssr: false,
  }
);

// =============================================================================
// CONDITIONAL LOADING HELPERS
// =============================================================================

/**
 * Create a component that only loads when visible
 */
export function createVisibleLoadedPanel<P extends object>(
  loader: () => Promise<{ default: React.ComponentType<P> }>,
  displayName: string
) {
  const Component = dynamic(loader, {
    loading: () => <PanelLoading />,
    ssr: false,
  });
  Component.displayName = displayName;
  return Component;
}

export default {
  DynamicPropertiesPanel,
  DynamicComponentLibrary,
  DynamicAIPageGenerator,
  DynamicVirtualizedList,
};
