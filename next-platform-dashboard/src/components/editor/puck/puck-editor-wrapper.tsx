/**
 * Puck Editor Wrapper
 * 
 * Main wrapper component that integrates Puck Editor with the DRAMAC CMS.
 * Handles loading, saving, and rendering of page content.
 */

"use client";

import { Puck, Render } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { puckConfig } from "./puck-config";
import type { PuckData } from "@/types/puck";
import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Loader2, Save, Eye, Edit2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export interface PuckEditorWrapperProps {
  /** Initial page content data */
  initialData?: PuckData;
  /** Page ID for saving */
  pageId?: string;
  /** Callback when content changes */
  onChange?: (data: PuckData) => void;
  /** Callback when content is saved */
  onSave?: (data: PuckData) => Promise<void>;
  /** Whether to show the editor or just render content */
  mode?: "edit" | "preview" | "render";
  /** Custom header component */
  headerContent?: React.ReactNode;
  /** Custom save button label */
  saveButtonLabel?: string;
  /** Auto-save interval in milliseconds (0 to disable) */
  autoSaveInterval?: number;
  /** Whether the editor is loading */
  isLoading?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Custom class name */
  className?: string;
}

// Default empty page data
const emptyData: PuckData = {
  content: [],
  root: { props: { title: "" } },
};

/**
 * Main Puck Editor Wrapper Component
 */
export function PuckEditorWrapper({
  initialData,
  pageId,
  onChange,
  onSave,
  mode = "edit",
  headerContent,
  saveButtonLabel = "Save Changes",
  autoSaveInterval = 0,
  isLoading = false,
  error,
  className,
}: PuckEditorWrapperProps) {
  // State
  const [data, setData] = useState<PuckData>(initialData || emptyData);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentMode, setCurrentMode] = useState<"edit" | "preview">(
    mode === "render" ? "preview" : mode
  );
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Update data when initialData changes
  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setHasUnsavedChanges(false);
    }
  }, [initialData]);

  // Handle data changes
  const handleChange = useCallback(
    (newData: PuckData) => {
      setData(newData);
      setHasUnsavedChanges(true);
      onChange?.(newData);
    },
    [onChange]
  );

  // Handle save
  const handleSave = useCallback(async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      await onSave(data);
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      toast.success("Page saved successfully");
    } catch (err) {
      console.error("Failed to save:", err);
      toast.error("Failed to save page");
    } finally {
      setIsSaving(false);
    }
  }, [data, onSave]);

  // Auto-save effect
  useEffect(() => {
    if (autoSaveInterval <= 0 || !hasUnsavedChanges || !onSave) return;

    const timer = setTimeout(() => {
      handleSave();
    }, autoSaveInterval);

    return () => clearTimeout(timer);
  }, [autoSaveInterval, hasUnsavedChanges, handleSave, onSave]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center h-screen", className)}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading editor...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn("flex items-center justify-center h-screen", className)}>
        <div className="flex flex-col items-center gap-4 text-center max-w-md p-6">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <h2 className="text-lg font-semibold">Failed to load editor</h2>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render-only mode (no editor UI)
  if (mode === "render") {
    return (
      <div className={className}>
        <Render config={puckConfig} data={data} />
      </div>
    );
  }

  // Editor mode
  return (
    <div className={cn("h-screen flex flex-col", className)}>
      {/* Custom Header or Default Header */}
      {headerContent ? (
        headerContent
      ) : (
        <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
          <div className="flex items-center gap-4">
            <h1 className="font-semibold">Page Editor</h1>
            {hasUnsavedChanges && (
              <span className="text-xs text-amber-500 flex items-center gap-1">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                Unsaved changes
              </span>
            )}
            {lastSaved && !hasUnsavedChanges && (
              <span className="text-xs text-muted-foreground">
                Last saved: {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Toggle */}
            <div className="flex items-center border rounded-md overflow-hidden">
              <button
                onClick={() => setCurrentMode("edit")}
                className={cn(
                  "px-3 py-1.5 text-sm flex items-center gap-1.5",
                  currentMode === "edit"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => setCurrentMode("preview")}
                className={cn(
                  "px-3 py-1.5 text-sm flex items-center gap-1.5",
                  currentMode === "preview"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
            </div>

            {/* Save Button */}
            {onSave && (
              <button
                onClick={handleSave}
                disabled={isSaving || !hasUnsavedChanges}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2",
                  hasUnsavedChanges
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {saveButtonLabel}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden">
        {currentMode === "preview" ? (
          <div className="h-full overflow-auto">
            <Render config={puckConfig} data={data} />
          </div>
        ) : (
          <Puck
            config={puckConfig}
            data={data}
            onChange={handleChange}
            onPublish={handleSave}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Render-only component for displaying Puck content
 * Use this when you just need to render saved content without editing
 */
export function PuckRenderer({
  data,
  className,
}: {
  data: PuckData;
  className?: string;
}) {
  return (
    <div className={className}>
      <Render config={puckConfig} data={data} />
    </div>
  );
}

export default PuckEditorWrapper;
