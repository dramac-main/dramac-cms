/**
 * DRAMAC Studio Provider
 * 
 * Wraps the editor with necessary providers and initializes state.
 * Handles module component loading for the site.
 * Initializes keyboard shortcuts (PHASE-STUDIO-20).
 * Provides onboarding tutorial for first-time users (PHASE-STUDIO-26).
 */

"use client";

import { useEffect, type ReactNode } from "react";
import { toast } from "sonner";
import {
  useEditorStore,
  useSelectionStore,
  clearHistory,
} from "@/lib/studio/store";
import { initializeRegistry, isRegistryInitialized } from "@/lib/studio/registry";
import { useModuleInitialization, useModuleSync, useStudioShortcuts } from "@/lib/studio/hooks";
import { CommandPalette, ShortcutsPanel } from "@/components/studio/features";
import { TutorialProvider, TutorialOverlay } from "@/components/studio/onboarding";
import type { StudioPageData, PuckDataFormat } from "@/types/studio";
import { createEmptyPageData, validatePageData, migrateFromPuckFormat } from "@/types/studio";

// =============================================================================
// TYPES
// =============================================================================

export interface StudioProviderProps {
  children: ReactNode;
  siteId: string;
  pageId: string;
  siteName: string;
  pageName: string;
  initialData?: unknown;
  /** Callback when save is triggered via shortcut or command palette */
  onSave?: () => Promise<void>;
}

// =============================================================================
// PROVIDER COMPONENT
// =============================================================================

export function StudioProvider({
  children,
  siteId,
  pageId,
  siteName: _siteName,
  pageName,
  initialData,
  onSave,
}: StudioProviderProps) {
  // Store actions
  const initialize = useEditorStore((s) => s.initialize);
  const reset = useEditorStore((s) => s.reset);
  const setError = useEditorStore((s) => s.setError);
  const isDirty = useEditorStore((s) => s.isDirty);
  const clearSelection = useSelectionStore((s) => s.clearSelection);

  // Initialize modules for this site (Phase STUDIO-14)
  // Wait for modules to be loaded before rendering the editor
  const { isLoading: isLoadingModules } = useModuleInitialization(siteId);
  
  // Subscribe to real-time module changes
  useModuleSync(siteId);
  
  // Initialize keyboard shortcuts (Phase STUDIO-20)
  useStudioShortcuts({ enabled: true, onSave });

  // Initialize editor on mount
  useEffect(() => {
    // Initialize registry if not already done
    if (!isRegistryInitialized()) {
      initializeRegistry();
    }

    let data: StudioPageData;

    try {
      if (!initialData) {
        // No data - create empty page
        data = createEmptyPageData();
        data.root.props.title = pageName;
      } else if (validatePageData(initialData)) {
        // Already in Studio format
        data = initialData;
      } else if (
        typeof initialData === "object" &&
        initialData !== null &&
        "content" in initialData
      ) {
        // Puck format - migrate
        data = migrateFromPuckFormat(initialData as PuckDataFormat);
        console.log("Migrated from Puck format to Studio format");
      } else {
        // Unknown format
        console.warn("Unknown page data format, creating empty page");
        data = createEmptyPageData();
        data.root.props.title = pageName;
      }

      initialize(siteId, pageId, data);
      clearHistory();
    } catch (error) {
      console.error("Error initializing editor:", error);
      setError("Failed to load page data");
      toast.error("Failed to load page. Please try again.");
    }

    // Cleanup on unmount
    return () => {
      reset();
      clearSelection();
    };
  }, [siteId, pageId, initialData, pageName, initialize, reset, setError, clearSelection]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Note: Keyboard shortcuts are now handled by useStudioShortcuts hook (Phase STUDIO-20)

  // Show loading state while modules are loading
  if (isLoadingModules) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          <p className="text-sm text-muted-foreground">Loading modules...</p>
        </div>
      </div>
    );
  }

  return (
    <TutorialProvider>
      {children}
      {/* Global dialogs - Phase STUDIO-20 */}
      <CommandPalette onSave={onSave} />
      <ShortcutsPanel />
      {/* Tutorial overlay - Phase STUDIO-26 (renders on top of everything) */}
      <TutorialOverlay />
    </TutorialProvider>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default StudioProvider;
