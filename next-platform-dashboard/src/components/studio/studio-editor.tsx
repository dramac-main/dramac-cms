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
import { useUIStore } from "@/lib/studio/store";
import {
  Layers,
  Settings2,
  MessageSquare,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
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

function ComponentListPlaceholder() {
  const togglePanel = useUIStore((s) => s.togglePanel);
  
  return (
    <div className="flex flex-1 flex-col">
      <PanelHeader
        title="Components"
        icon={Layers}
        position="left"
        onCollapse={() => togglePanel("left")}
      />
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search components..."
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>
      <div className="flex-1 overflow-auto p-3">
        <p className="text-sm text-muted-foreground">
          Component list will be implemented in Phase STUDIO-05
        </p>
      </div>
    </div>
  );
}

function CanvasPlaceholder() {
  const breakpoint = useUIStore((s) => s.breakpoint);
  
  return (
    <div className="flex h-full items-center justify-center bg-muted/50">
      <div className="text-center">
        <p className="text-lg font-medium">Canvas Area</p>
        <p className="text-sm text-muted-foreground">
          Viewport: {breakpoint}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Canvas will be implemented in Phase STUDIO-06
        </p>
      </div>
    </div>
  );
}

function PropertiesPanelPlaceholder() {
  const togglePanel = useUIStore((s) => s.togglePanel);
  
  return (
    <div className="flex flex-1 flex-col">
      <PanelHeader
        title="Properties"
        icon={Settings2}
        position="right"
        onCollapse={() => togglePanel("right")}
      />
      <div className="flex-1 overflow-auto p-3">
        <p className="text-sm text-muted-foreground">
          Select a component to edit its properties.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Property editors will be implemented in Phase STUDIO-08
        </p>
      </div>
    </div>
  );
}

function BottomPanelPlaceholder() {
  const togglePanel = useUIStore((s) => s.togglePanel);
  
  return (
    <div className="flex flex-1 flex-col">
      <PanelHeader
        title="AI Assistant"
        icon={MessageSquare}
        position="bottom"
        onCollapse={() => togglePanel("bottom")}
      />
      <div className="flex-1 overflow-auto p-3">
        <p className="text-sm text-muted-foreground">
          AI chat and tools will be implemented in Phase STUDIO-11
        </p>
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
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave, handlePreview]);

  return (
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
      leftPanel={<ComponentListPlaceholder />}
      canvas={<CanvasPlaceholder />}
      rightPanel={<PropertiesPanelPlaceholder />}
      bottomPanel={<BottomPanelPlaceholder />}
    />
  );
}
