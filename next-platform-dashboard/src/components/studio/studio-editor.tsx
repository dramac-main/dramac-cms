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

  // Initialize registry on mount
  useEffect(() => {
    initializeRegistry();
  }, []);

  // Save handler
  const handleSave = useCallback(async () => {
    try {
      setSaveStatus("saving");
      // TODO: Implement save logic in Phase STUDIO-06
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate save
      setSaveStatus("saved");
      toast.success("Page saved successfully");
      
      // Reset status after a delay
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("[Studio] Save failed:", error);
      setSaveStatus("error");
      toast.error("Failed to save page");
    }
  }, []);

  // Preview handler
  const handlePreview = useCallback(() => {
    // Open preview in new tab
    const path = pagePath || `/${pageSlug || ""}`;
    const previewUrl = siteCustomDomain
      ? `https://${siteCustomDomain}${path}`
      : siteSubdomain
        ? `https://${siteSubdomain}.dramac.com${path}`
        : `/preview/${siteId}${path}`;
    
    window.open(previewUrl, "_blank");
  }, [siteCustomDomain, siteSubdomain, siteId, pageSlug, pagePath]);

  // Publish handler
  const handlePublish = useCallback(async () => {
    // Save first, then publish
    await handleSave();
    // TODO: Implement publish logic
    toast.info("Publish functionality coming in a future phase");
  }, [handleSave]);

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
