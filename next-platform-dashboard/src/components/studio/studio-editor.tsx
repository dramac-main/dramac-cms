/**
 * DRAMAC Studio Editor
 * 
 * Main editor component that assembles the complete studio experience.
 */

"use client";

import { useEffect, useCallback, useState } from "react";
import { StudioLayout } from "@/components/studio/layout/studio-layout";
import { StudioToolbar } from "@/components/studio/layout/studio-toolbar";
import { PanelHeader } from "@/components/studio/layout/panel-header";
import { DndProvider } from "@/components/studio/dnd";
import { EditorCanvas } from "@/components/studio/canvas";
import { ComponentLibrary } from "@/components/studio/panels";
import { PropertiesPanel } from "@/components/studio/properties";
import { LayersPanel, HistoryPanel } from "@/components/studio/features";
import { useUIStore, useEditorStore, useAIStore, useSelectionStore, useHistoryStore, undo, redo, useHistoryState } from "@/lib/studio/store";
import { initializeRegistry } from "@/lib/studio/registry";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { savePageContentAction } from "@/lib/actions/pages";
import { publishSite } from "@/lib/publishing/publish-service";
import type { Json } from "@/types/database";

// =============================================================================
// TYPES
// =============================================================================

interface StudioEditorProps {
  siteId: string;
  pageId: string;
  siteName: string;
  pageName: string;
  siteSubdomain?: string;
  siteCustomDomain?: string | null;
  pageSlug?: string;
  pagePath?: string;
}

// =============================================================================
// PLACEHOLDER PANELS (to be replaced in later phases)
// =============================================================================

function CanvasArea() {
  return <EditorCanvas />;
}

function BottomPanelContent() {
  const togglePanel = useUIStore((s) => s.togglePanel);
  const [activeTab, setActiveTab] = useState<"layers" | "ai">("layers");
  
  return (
    <div className="flex flex-1 flex-col">
      {/* Tab header */}
      <div className="flex items-center border-b bg-muted/30 px-2">
        <button
          className={`px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === "layers" 
              ? "border-b-2 border-primary text-foreground" 
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("layers")}
        >
          Layers
        </button>
        <button
          className={`px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === "ai" 
              ? "border-b-2 border-primary text-foreground" 
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("ai")}
        >
          AI Assistant
        </button>
        <div className="flex-1" />
        <button
          className="p-1 text-muted-foreground hover:text-foreground"
          onClick={() => togglePanel("bottom")}
        >
          ×
        </button>
      </div>
      
      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "layers" ? (
          <LayersPanel />
        ) : (
          <div className="flex-1 overflow-auto p-3">
            <p className="text-sm text-muted-foreground">
              AI chat and tools will be implemented in Phase STUDIO-11
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function StudioEditor({
  siteId,
  pageId,
  siteName,
  pageName,
  siteSubdomain,
  siteCustomDomain,
  pageSlug,
  pagePath,
}: StudioEditorProps) {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const addComponent = useEditorStore((s) => s.addComponent);
  const moveComponent = useEditorStore((s) => s.moveComponent);
  const deleteComponent = useEditorStore((s) => s.deleteComponent);
  const updateComponent = useEditorStore((s) => s.updateComponent);
  const editorData = useEditorStore((s) => s.data);
  const components = editorData.components;
  const recordAction = useHistoryStore((s) => s.recordAction);
  
  // AI Chat store
  const { openChat, closeChat, isOpen: aiChatOpen } = useAIStore();
  const selectedId = useSelectionStore((s) => s.componentId);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  
  // Get markSaved to reset dirty state after save
  const markSaved = useEditorStore((s) => s.markSaved);

  // Initialize registry on mount
  useEffect(() => {
    initializeRegistry();
  }, []);

  // Save handler - actually saves to database with enhanced error handling
  const handleSave = useCallback(async () => {
    try {
      setSaveStatus("saving");
      
      // Get current editor data in Studio format
      const currentData = useEditorStore.getState().data;
      
      // DEBUG: Log the data being saved
      console.log("[Studio] Saving data:", {
        pageId,
        componentsCount: Object.keys(currentData.components).length,
        rootChildren: currentData.root.children.length,
      });
      
      // Validate data before save
      if (!currentData.root || !currentData.components) {
        throw new Error("Invalid page data structure");
      }
      
      // Check for empty page
      if (Object.keys(currentData.components).length === 0) {
        console.log("[Studio] Saving empty page");
      }
      
      // Save to database - cast to Json type for Supabase
      const result = await savePageContentAction(pageId, currentData as unknown as Json);
      
      if (result.error) {
        console.error("[Studio] Save error:", result.error);
        throw new Error(result.error);
      }
      
      // Mark as not dirty after successful save
      markSaved();
      setSaveStatus("saved");
      toast.success("Page saved successfully", {
        description: `${Object.keys(currentData.components).length} components saved`,
      });
      
      // Reset status after a delay
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("[Studio] Save failed:", error);
      setSaveStatus("error");
      toast.error(error instanceof Error ? error.message : "Failed to save page", {
        description: "Check console for details",
      });
    }
  }, [pageId, markSaved]);

  // Preview handler - opens preview in new tab
  const handlePreview = useCallback(() => {
    // Use the preview route with siteId and pageId
    const previewUrl = `/preview/${siteId}/${pageId}`;
    window.open(previewUrl, "_blank");
  }, [siteId, pageId]);

  // Publish handler - saves and publishes the site with enhanced error handling
  const handlePublish = useCallback(async () => {
    try {
      setSaveStatus("saving");
      
      // Save first
      await handleSave();
      
      // Wait a moment for save to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Then publish the site
      console.log("[Studio] Publishing site:", siteId);
      const result = await publishSite(siteId);
      
      if (!result.success) {
        throw new Error(result.error || "Failed to publish site");
      }
      
      console.log("[Studio] Publish success:", result);
      
      toast.success("Site published successfully!", {
        description: result.siteUrl ? `Available at ${result.siteUrl}` : undefined,
        action: result.siteUrl ? {
          label: "View Site",
          onClick: () => window.open(result.siteUrl, "_blank"),
        } : undefined,
      });
    } catch (error) {
      console.error("[Studio] Publish failed:", error);
      toast.error(error instanceof Error ? error.message : "Failed to publish site");
    }
  }, [handleSave, siteId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;

      // Save: Cmd/Ctrl + S
      if (isMeta && e.key === "s") {
        e.preventDefault();
        handleSave();
      }

      // Preview: Cmd/Ctrl + P (when not printing)
      if (isMeta && e.key === "p" && !e.shiftKey) {
        e.preventDefault();
        handlePreview();
      }
      
      // Undo: Cmd/Ctrl + Z
      if (isMeta && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      
      // Redo: Cmd/Ctrl + Shift + Z
      if (isMeta && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      
      // Toggle AI Chat: Cmd/Ctrl + /
      if (isMeta && e.key === "/") {
        e.preventDefault();
        if (aiChatOpen) {
          closeChat();
        } else if (selectedId) {
          openChat(selectedId);
        }
      }
      
      // Zoom In: Cmd/Ctrl + = or Cmd/Ctrl + +
      if (isMeta && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        useUIStore.getState().zoomIn();
      }
      
      // Zoom Out: Cmd/Ctrl + -
      if (isMeta && e.key === "-") {
        e.preventDefault();
        useUIStore.getState().zoomOut();
      }
      
      // Reset Zoom: Cmd/Ctrl + 0
      if (isMeta && e.key === "0") {
        e.preventDefault();
        useUIStore.getState().resetZoom();
      }
      
      // Fit to Screen: Cmd/Ctrl + 1
      if (isMeta && e.key === "1") {
        e.preventDefault();
        const container = document.querySelector('[data-canvas-container]');
        if (container) {
          const { clientWidth, clientHeight } = container;
          useUIStore.getState().fitToScreen(clientWidth, clientHeight);
        }
      }
      
      // Toggle Lock: Cmd/Ctrl + L
      if (isMeta && e.key === "l" && selectedId) {
        e.preventDefault();
        const component = components[selectedId];
        if (component) {
          const newLocked = !component.locked;
          updateComponent(selectedId, { locked: newLocked });
          recordAction(newLocked ? "component.lock" : "component.unlock", editorData, selectedId, component.type);
          toast.success(newLocked ? "Component locked" : "Component unlocked");
        }
      }
      
      // Toggle Hide: Cmd/Ctrl + H (when component selected)
      if (isMeta && e.key === "h" && selectedId) {
        e.preventDefault();
        const component = components[selectedId];
        if (component) {
          const newHidden = !component.hidden;
          updateComponent(selectedId, { hidden: newHidden });
          recordAction(newHidden ? "component.hide" : "component.show", editorData, selectedId, component.type);
          toast.success(newHidden ? "Component hidden" : "Component visible");
        }
      }
      
      // Delete component: Delete or Backspace (when not in input)
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        const target = e.target as HTMLElement;
        const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
        if (!isInput) {
          e.preventDefault();
          deleteComponent(selectedId);
        }
      }
      
      // Escape: Clear selection
      if (e.key === "Escape" && selectedId) {
        clearSelection();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave, handlePreview, aiChatOpen, closeChat, openChat, selectedId, deleteComponent, clearSelection, components, updateComponent, recordAction, editorData]);

  return (
    <DndProvider>
      <StudioLayout
        toolbar={
          <StudioToolbar
            siteId={siteId}
            pageId={pageId}
            pageTitle={pageName}
            siteName={siteName}
            onSave={handleSave}
            onPreview={handlePreview}
            onPublish={handlePublish}
            saveStatus={saveStatus}
          />
        }
        leftPanel={<ComponentLibrary />}
        canvas={<CanvasArea />}
        rightPanel={<PropertiesPanel />}
        bottomPanel={<BottomPanelContent />}
      />
    </DndProvider>
  );
}
