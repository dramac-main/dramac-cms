/**
 * Puck Editor Integrated
 * 
 * This is the main editor component that replaces the Craft.js editor.
 * It integrates the Puck editor with the existing DRAMAC CMS infrastructure.
 */

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Puck, Render, type Data } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { toast } from "sonner";
import { puckConfig } from "./puck/puck-config";
import { EditorProvider } from "./editor-context";
import { savePageContentAction } from "@/lib/actions/pages";
import { usePreview } from "@/lib/preview/use-preview";
import { cn } from "@/lib/utils";
import { detectContentFormat, migrateCraftToPuck, isPuckFormat } from "@/lib/migration/craft-to-puck";
import type { Site } from "@/types/site";
import type { PuckData } from "@/types/puck";
import type { Json } from "@/types/database";
import {
  Eye,
  Edit2,
  Save,
  Loader2,
  Undo2,
  Redo2,
  ExternalLink,
  Monitor,
  Tablet,
  Smartphone,
  RefreshCw,
  ChevronLeft,
  AlertCircle,
  Info,
} from "lucide-react";

interface PageWithContent {
  id: string;
  site_id: string;
  name: string;
  slug: string;
  is_homepage: boolean | null;
  content: Record<string, unknown> | null;
}

interface PuckEditorIntegratedProps {
  site: Site;
  page: PageWithContent;
}

// Default empty page data for Puck
const emptyPuckData: PuckData = {
  content: [],
  root: { props: { title: "" } },
};

/**
 * Convert page content to Puck format if needed
 */
function convertToPuckFormat(content: Record<string, unknown> | null): { data: PuckData; wasMigrated: boolean } {
  if (!content || Object.keys(content).length === 0) {
    return { data: emptyPuckData, wasMigrated: false };
  }

  // Check if already Puck format
  if (isPuckFormat(content)) {
    return { data: content as PuckData, wasMigrated: false };
  }

  // Detect format and migrate if needed
  const detection = detectContentFormat(content);
  
  if (detection.format === "craft") {
    console.log("[PuckEditorIntegrated] Migrating Craft.js content to Puck format...");
    const migrationResult = migrateCraftToPuck(content as never);
    
    if (migrationResult.success && migrationResult.data) {
      console.log("[PuckEditorIntegrated] Migration successful:", migrationResult.stats);
      return { data: migrationResult.data as PuckData, wasMigrated: true };
    } else {
      console.error("[PuckEditorIntegrated] Migration failed:", migrationResult.errors);
      toast.error("Failed to migrate content. Starting with empty page.");
      return { data: emptyPuckData, wasMigrated: false };
    }
  }

  // Unknown format - return empty
  console.warn("[PuckEditorIntegrated] Unknown content format, starting fresh");
  return { data: emptyPuckData, wasMigrated: false };
}

export function PuckEditorIntegrated({ site, page }: PuckEditorIntegratedProps) {
  // Convert content on load
  const { data: initialData, wasMigrated } = convertToPuckFormat(page.content);
  
  // State
  const [data, setData] = useState<PuckData>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(wasMigrated); // Mark as changed if migrated
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showMigrationNotice, setShowMigrationNotice] = useState(wasMigrated);
  
  // Preview management
  const {
    device,
    setDevice,
    previewUrl,
    previewKey,
    refreshPreview,
    openInNewWindow,
  } = usePreview({ siteId: site.id, pageId: page.id });

  // Handle data changes
  const handleChange = useCallback((newData: Data) => {
    setData(newData as PuckData);
    setHasChanges(true);
  }, []);

  // Save handler
  const handleSave = useCallback(async (dataToSave: Data) => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      const result = await savePageContentAction(page.id, dataToSave as unknown as Json);

      if (result.error) {
        toast.error(result.error);
      } else {
        setHasChanges(false);
        setLastSaved(new Date());
        setShowMigrationNotice(false); // Hide migration notice after first save
        toast.success("Page saved successfully");
        refreshPreview();
      }
    } catch (error) {
      console.error("[PuckEditorIntegrated] Save error:", error);
      toast.error(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, page.id, refreshPreview]);

  // Auto-save every 60 seconds when there are changes
  useEffect(() => {
    if (!hasChanges) return;

    const autoSaveInterval = setInterval(() => {
      if (hasChanges && !isSaving) {
        handleSave(data);
      }
    }, 60000);

    return () => clearInterval(autoSaveInterval);
  }, [hasChanges, isSaving, handleSave, data]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Save: Ctrl/Cmd + S
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (hasChanges) {
          handleSave(data);
        }
      }
      // Preview: Ctrl/Cmd + P
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        setIsPreviewMode(!isPreviewMode);
      }
      // Escape to exit preview
      if (e.key === "Escape" && isPreviewMode) {
        setIsPreviewMode(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasChanges, data, handleSave, isPreviewMode]);

  // Preview mode - render without editor chrome
  if (isPreviewMode) {
    return (
      <EditorProvider site={site}>
        <div className="h-screen flex flex-col bg-muted/20">
          {/* Preview Header */}
          <div className="h-14 border-b bg-background flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsPreviewMode(false)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Editor
              </button>
              <span className="text-sm font-medium">{page.name} - Preview</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Device selector */}
              <div className="flex items-center gap-1 border rounded-lg p-1">
                <button
                  onClick={() => setDevice("mobile")}
                  className={cn(
                    "p-1.5 rounded",
                    device === "mobile" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                  title="Mobile"
                >
                  <Smartphone className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDevice("tablet")}
                  className={cn(
                    "p-1.5 rounded",
                    device === "tablet" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                  title="Tablet"
                >
                  <Tablet className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDevice("desktop")}
                  className={cn(
                    "p-1.5 rounded",
                    device === "desktop" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                  title="Desktop"
                >
                  <Monitor className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={refreshPreview}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title="Refresh Preview"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                onClick={openInNewWindow}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title="Open in New Window"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* Preview Content */}
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
            <div
              className={cn(
                "bg-background shadow-2xl rounded-lg overflow-hidden transition-all",
                device === "mobile" && "w-[375px]",
                device === "tablet" && "w-[768px]",
                device === "desktop" && "w-full max-w-[1200px]"
              )}
              style={{ height: device === "desktop" ? "100%" : "auto", minHeight: "600px" }}
            >
              <Render config={puckConfig} data={data} />
            </div>
          </div>
        </div>
      </EditorProvider>
    );
  }

  // Edit mode - full Puck editor
  return (
    <EditorProvider site={site}>
      <div className="h-screen flex flex-col">
        {/* Migration Notice */}
        {showMigrationNotice && (
          <div className="bg-blue-50 dark:bg-blue-950 border-b border-blue-200 dark:border-blue-800 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-sm">
              <Info className="h-4 w-4" />
              <span>Content was migrated from the previous editor format. Save to confirm the migration.</span>
            </div>
            <button
              onClick={() => setShowMigrationNotice(false)}
              className="text-blue-500 hover:text-blue-700 text-sm"
            >
              Dismiss
            </button>
          </div>
        )}
        
        {/* Custom Header */}
        <div className="h-14 border-b bg-background flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-4">
            <a
              href={`/dashboard/sites/${site.id}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              {site.name}
            </a>
            <div className="h-4 w-px bg-border" />
            <span className="text-sm font-medium">{page.name}</span>
            {hasChanges && (
              <span className="text-xs text-orange-500 font-medium">Unsaved changes</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {lastSaved && (
              <span className="text-xs text-muted-foreground">
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => setIsPreviewMode(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-muted transition-colors"
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>
            <button
              onClick={() => handleSave(data)}
              disabled={isSaving || !hasChanges}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors",
                hasChanges
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
        
        {/* Puck Editor */}
        <div className="flex-1 overflow-hidden">
          <Puck
            config={puckConfig}
            data={data}
            onChange={handleChange}
            onPublish={handleSave}
          />
        </div>
      </div>
    </EditorProvider>
  );
}

/**
 * Puck Renderer Component
 * For rendering Puck content without the editor (view-only mode)
 */
export function PuckRenderer({ content }: { content: Record<string, unknown> | null }) {
  const { data } = convertToPuckFormat(content);
  
  return <Render config={puckConfig} data={data} />;
}
