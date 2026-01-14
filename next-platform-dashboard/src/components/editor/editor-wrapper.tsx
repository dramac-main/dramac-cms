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
import { savePageContentAction } from "@/lib/actions/pages";
import { useEditorShortcuts } from "@/hooks/use-editor-shortcuts";
import type { Site } from "@/types/site";
import type { CanvasSettings } from "@/types/editor";

interface PageWithContent {
  id: string;
  site_id: string;
  name: string;
  slug: string;
  is_homepage: boolean;
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

  const handleSettingsChange = useCallback((newSettings: Partial<CanvasSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  return (
    <Editor
      resolver={componentResolver}
      enabled={true}
      onNodesChange={() => {
        setHasChanges(true);
      }}
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
  lastSaved: _lastSaved,
  setLastSaved,
}: EditorContentProps) {
  const { actions, query } = useEditor();
  const initialized = useRef(false);

  // Load initial content
  useEffect(() => {
    if (!initialized.current && page.content) {
      try {
        // Deserialize saved content
        actions.deserialize(JSON.stringify(page.content));
        initialized.current = true;
      } catch (error) {
        console.error("Failed to load page content:", error);
        toast.error("Failed to load page content");
      }
    }
  }, [page.content, actions]);

  // Save handler
  const handleSave = useCallback(async () => {
    if (isSaving || !hasChanges) return;

    setIsSaving(true);

    try {
      const content = query.serialize();
      const result = await savePageContentAction(page.id, JSON.parse(content));

      if (result.error) {
        toast.error(result.error);
      } else {
        setHasChanges(false);
        setLastSaved(new Date());
        toast.success("Page saved successfully");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save page");
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, hasChanges, query, page.id, setIsSaving, setHasChanges, setLastSaved]);

  // Keyboard shortcuts
  useEditorShortcuts({ onSave: handleSave });

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
      {/* Top Toolbar */}
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
      />

      {/* Breadcrumb */}
      <EditorBreadcrumb />

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Toolbox (Left) */}
        <EditorToolbox />

        {/* Canvas (Center) */}
        <EditorCanvas settings={settings} />

        {/* Settings (Right) */}
        <SettingsPanel />
      </div>
    </div>
  );
}
