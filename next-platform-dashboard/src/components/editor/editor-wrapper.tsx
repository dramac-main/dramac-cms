"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Editor, useEditor } from "@craftjs/core";
import { toast } from "sonner";
import { componentResolver } from "./resolver";
import { EditorToolbar } from "./toolbar/editor-toolbar";
import { EditorBreadcrumb } from "./toolbar/editor-breadcrumb";
import { EditorToolbox } from "./toolbox";
import { EditorCanvas } from "./canvas";
import { SettingsPanel } from "./settings-panel";
import { PreviewFrame } from "./preview-frame";
import { PreviewPanel } from "./preview-panel";
import { MobileToolbar, MobileComponentSheet, MobileSettingsSheet } from "./responsive";
import { savePageContentAction } from "@/lib/actions/pages";
import { useEditorShortcuts } from "@/hooks/use-editor-shortcuts";
import { usePreview } from "@/lib/preview/use-preview";
import { cn } from "@/lib/utils";
import type { Site } from "@/types/site";
import type { CanvasSettings } from "@/types/editor";

interface PageWithContent {
  id: string;
  site_id: string;
  name: string;
  slug: string;
  is_homepage: boolean | null;
  content: Record<string, unknown> | null;
}

interface EditorWrapperProps {
  site: Site;
  page: PageWithContent;
}

export function EditorWrapper({ site, page }: EditorWrapperProps) {
  const [settings, setSettings] = useState<CanvasSettings>({
    width: "desktop",
    showGrid: false,
    showOutlines: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isContentLoaded, setIsContentLoaded] = useState(false);
  
  // Use ref to track content loaded state for the callback
  const isContentLoadedRef = useRef(false);
  
  // Update ref when state changes
  useEffect(() => {
    isContentLoadedRef.current = isContentLoaded;
  }, [isContentLoaded]);

  const handleSettingsChange = useCallback((newSettings: Partial<CanvasSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  // Handle nodes change - only track changes after initial content is loaded
  // Use ref instead of state to avoid stale closure issues
  const handleNodesChange = useCallback(() => {
    if (isContentLoadedRef.current) {
      console.log("[EditorWrapper] Change detected, marking as unsaved");
      setHasChanges(true);
    }
  }, []);

  return (
    <Editor
      resolver={componentResolver}
      enabled={true}
      onNodesChange={handleNodesChange}
    >
      <EditorContent
        site={site}
        page={page}
        settings={settings}
        onSettingsChange={handleSettingsChange}
        isSaving={isSaving}
        setIsSaving={setIsSaving}
        hasChanges={hasChanges}
        setHasChanges={setHasChanges}
        lastSaved={lastSaved}
        setLastSaved={setLastSaved}
        setIsContentLoaded={setIsContentLoaded}
      />
    </Editor>
  );
}

interface EditorContentProps {
  site: Site;
  page: PageWithContent;
  settings: CanvasSettings;
  onSettingsChange: (settings: Partial<CanvasSettings>) => void;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
  hasChanges: boolean;
  setHasChanges: (changes: boolean) => void;
  lastSaved: Date | null;
  setLastSaved: (date: Date | null) => void;
  setIsContentLoaded: (loaded: boolean) => void;
}

function EditorContent({
  site,
  page,
  settings,
  onSettingsChange,
  isSaving,
  setIsSaving,
  hasChanges,
  setHasChanges,
  lastSaved,
  setLastSaved,
  setIsContentLoaded,
}: EditorContentProps) {
  const { actions, query } = useEditor();
  const initialized = useRef(false);

  // Mobile sheet states
  const [showMobileComponents, setShowMobileComponents] = useState(false);
  const [showMobileSettings, setShowMobileSettings] = useState(false);

  // Preview state management
  const {
    isPreviewMode,
    togglePreviewMode,
    device,
    setDevice,
    showPreviewPanel,
    togglePreviewPanel,
    previewUrl,
    previewKey,
    refreshPreview,
    openInNewWindow,
  } = usePreview({ siteId: site.id, pageId: page.id });

  // Load initial content
  useEffect(() => {
    if (!initialized.current && page.content) {
      try {
        console.log("[EditorContent] Loading content:", {
          pageId: page.id,
          contentType: typeof page.content,
          hasContent: !!page.content,
          contentKeys: Object.keys(page.content || {}),
        });
        
        // Content should be an object (Craft.js node tree)
        // We need to serialize it for Craft.js's deserialize function
        const serialized = typeof page.content === 'string' 
          ? page.content 
          : JSON.stringify(page.content);
        
        console.log("[EditorContent] Deserializing content...");
        actions.deserialize(serialized);
        
        // Use setTimeout to ensure the deserialize operation completes
        // and any onChange events are fired before we mark as loaded
        setTimeout(() => {
          setHasChanges(false); // Reset hasChanges after initial load
          setIsContentLoaded(true); // Now track changes from here on
          console.log("[EditorContent] Content loaded successfully, hasChanges reset, now tracking changes");
        }, 100);
        
        initialized.current = true;
      } catch (error) {
        console.error("[EditorContent] Failed to load page content:", error);
        toast.error("Failed to load page content");
        initialized.current = true; // Mark as initialized to prevent retry loops
        setIsContentLoaded(true); // Still allow change tracking
      }
    } else if (!page.content) {
      console.log("[EditorContent] No content to load, marking as loaded");
      initialized.current = true;
      setIsContentLoaded(true);
    }
  }, [page.content, actions, page.id, setHasChanges, setIsContentLoaded]);

  // Save handler
  const handleSave = useCallback(async () => {
    if (isSaving || !hasChanges) return;

    setIsSaving(true);

    try {
      const content = query.serialize();
      const parsedContent = JSON.parse(content);
      
      const result = await savePageContentAction(page.id, parsedContent);

      if (result.error) {
        toast.error(result.error);
      } else {
        setHasChanges(false);
        setLastSaved(new Date());
        toast.success("Page saved successfully");
        // Refresh preview after successful save
        refreshPreview();
      }
    } catch (error) {
      console.error("[EditorWrapper] Save error:", error);
      toast.error(`Failed to save page: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, hasChanges, query, page.id, setIsSaving, setHasChanges, setLastSaved, refreshPreview]);

  // Auto-save every 30 seconds when there are changes
  useEffect(() => {
    if (!hasChanges) return;

    const autoSaveInterval = setInterval(() => {
      if (hasChanges && !isSaving) {
        handleSave();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [hasChanges, isSaving, handleSave]);

  // Keyboard shortcuts including Escape to exit preview
  useEditorShortcuts({ onSave: handleSave });

  // Handle Escape key to exit preview mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isPreviewMode) {
        togglePreviewMode();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPreviewMode, togglePreviewMode]);

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

  return (
    <div className="h-screen flex flex-col">
      {/* Top Toolbar with Preview Controls */}
      <EditorToolbar
        siteName={site.name}
        pageName={page.name}
        siteId={site.id}
        pageId={page.id}
        settings={settings}
        onSettingsChange={onSettingsChange}
        onSave={handleSave}
        isSaving={isSaving}
        hasUnsavedChanges={hasChanges}
        // Preview props
        isPreviewMode={isPreviewMode}
        onTogglePreview={togglePreviewMode}
        device={device}
        onDeviceChange={setDevice}
        showPreviewPanel={showPreviewPanel}
        onTogglePreviewPanel={togglePreviewPanel}
        previewUrl={previewUrl}
        onOpenNewWindow={openInNewWindow}
        onRefreshPreview={refreshPreview}
      />

      {/* Breadcrumb - hidden in preview mode */}
      {!isPreviewMode && <EditorBreadcrumb />}

      {/* Main Editor Area */}
      <div className={cn(
        "flex-1 flex overflow-hidden",
        showPreviewPanel && "mr-[50vw]"
      )}>
        {/* Full preview mode - shows preview in main area */}
        <div className={cn(
          "flex-1 p-4 bg-muted/20",
          !isPreviewMode && "hidden"
        )}>
          <PreviewFrame
            url={previewUrl}
            device={device}
            refreshKey={previewKey}
            className="h-full w-full"
            showDeviceFrame={device !== "full"}
          />
        </div>

        {/* Editor workspace - hidden during preview but stays mounted */}
        <div className={cn(
          "flex-1 flex",
          isPreviewMode && "hidden"
        )}>
          {/* Toolbox (Left) */}
          <EditorToolbox />

          {/* Canvas (Center) */}
          <EditorCanvas settings={settings} />

          {/* Settings (Right) */}
          <SettingsPanel />
        </div>
      </div>

      {/* Side-by-side Preview Panel */}
      <PreviewPanel
        isOpen={showPreviewPanel}
        onClose={togglePreviewPanel}
        url={previewUrl}
        device={device}
        onDeviceChange={setDevice}
        refreshKey={previewKey}
        onRefresh={refreshPreview}
      />

      {/* Mobile Toolbar - auto-shows on touch devices */}
      <MobileToolbar
        onAddComponent={() => setShowMobileComponents(true)}
        onUndo={() => actions.history.undo()}
        onRedo={() => actions.history.redo()}
        onPreview={togglePreviewMode}
        onSave={handleSave}
        onSettings={() => setShowMobileSettings(true)}
        onDeviceChange={(d) => setDevice(d as "mobile" | "tablet" | "desktop" | "full")}
        currentDevice={device}
        canUndo={query.history.canUndo()}
        canRedo={query.history.canRedo()}
        isSaving={isSaving}
        hasChanges={hasChanges}
      />

      {/* Mobile Component Sheet */}
      <MobileComponentSheet
        open={showMobileComponents}
        onOpenChange={setShowMobileComponents}
        components={[]}
        onSelect={() => {
          // Component will be handled by drag-drop in toolbox
          setShowMobileComponents(false);
        }}
      />

      {/* Mobile Settings Sheet */}
      <MobileSettingsSheet
        open={showMobileSettings}
        onOpenChange={setShowMobileSettings}
        title="Component Settings"
      >
        <SettingsPanel />
      </MobileSettingsSheet>
    </div>
  );
}
