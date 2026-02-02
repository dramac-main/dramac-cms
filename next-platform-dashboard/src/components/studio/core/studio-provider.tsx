/**
 * DRAMAC Studio Provider
 * 
 * Wraps the editor with necessary providers and initializes state.
 */

"use client";

import { useEffect, type ReactNode } from "react";
import { toast } from "sonner";
import {
  useEditorStore,
  useSelectionStore,
  clearHistory,
} from "@/lib/studio/store";
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
}

// =============================================================================
// PROVIDER COMPONENT
// =============================================================================

export function StudioProvider({
  children,
  siteId,
  pageId,
  siteName,
  pageName,
  initialData,
}: StudioProviderProps) {
  // Store actions
  const initialize = useEditorStore((s) => s.initialize);
  const reset = useEditorStore((s) => s.reset);
  const setError = useEditorStore((s) => s.setError);
  const isDirty = useEditorStore((s) => s.isDirty);
  const clearSelection = useSelectionStore((s) => s.clearSelection);

  // Initialize editor on mount
  useEffect(() => {
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

  // Handle keyboard shortcuts for save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        // TODO: Implement save action in later phase
        toast.info("Save functionality coming in Phase STUDIO-06");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return <>{children}</>;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default StudioProvider;
