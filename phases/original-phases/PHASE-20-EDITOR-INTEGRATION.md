# Phase 20: Editor Integration

> **AI Model**: Claude Opus 4.5 (3x) ⚡
>
> **⚠️ FIRST**: Read `PHASE-00-MASTER-REFERENCE.md` before starting
>
> **CRITICAL PHASE**: This integrates all editor components. Take extra care.

---

## 🎯 Objective

Integrate all visual editor components into the page editor route with save/load functionality.

---

## 📋 Prerequisites

- [ ] Phase 1-19 completed

---

## ✅ Tasks

### Task 20.1: Editor Page Route

**File: `src/app/(dashboard)/dashboard/sites/[siteId]/editor/page.tsx`**

```typescript
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSite } from "@/lib/actions/sites";
import { getPage, getPages } from "@/lib/actions/pages";
import { EditorWrapper } from "@/components/editor/editor-wrapper";

interface EditorPageProps {
  params: { siteId: string };
  searchParams: { page?: string };
}

export async function generateMetadata({
  params,
  searchParams,
}: EditorPageProps): Promise<Metadata> {
  const site = await getSite(params.siteId).catch(() => null);
  return {
    title: site ? `Editor - ${site.name} | DRAMAC` : "Editor",
  };
}

export default async function EditorPage({
  params,
  searchParams,
}: EditorPageProps) {
  const site = await getSite(params.siteId).catch(() => null);

  if (!site) {
    notFound();
  }

  // Get page ID from query or find homepage
  let pageId = searchParams.page;

  if (!pageId) {
    const pages = await getPages(params.siteId);
    const homepage = pages.find((p) => p.is_homepage);

    if (homepage) {
      redirect(`/dashboard/sites/${params.siteId}/editor?page=${homepage.id}`);
    } else if (pages.length > 0) {
      redirect(`/dashboard/sites/${params.siteId}/editor?page=${pages[0].id}`);
    } else {
      // No pages exist, redirect to create page
      redirect(`/dashboard/sites/${params.siteId}/pages/new`);
    }
  }

  const page = await getPage(pageId!).catch(() => null);

  if (!page) {
    // Page not found, redirect to site
    redirect(`/dashboard/sites/${params.siteId}`);
  }

  return (
    <EditorWrapper
      site={site}
      page={page}
    />
  );
}
```

### Task 20.2: Editor Layout (No Sidebar)

**File: `src/app/(dashboard)/dashboard/sites/[siteId]/editor/layout.tsx`**

```typescript
export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Editor has its own layout without the dashboard sidebar
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
```

### Task 20.3: Editor Wrapper Component

**File: `src/components/editor/editor-wrapper.tsx`**

```typescript
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Editor, Frame, Element, useEditor } from "@craftjs/core";
import { toast } from "sonner";
import { componentResolver } from "./resolver";
import { EditorToolbar } from "./toolbar/editor-toolbar";
import { EditorBreadcrumb } from "./toolbar/editor-breadcrumb";
import { EditorToolbox } from "./toolbox";
import { EditorCanvas } from "./canvas";
import { SettingsPanel } from "./settings-panel";
import { savePageContentAction } from "@/lib/actions/pages";
import { useEditorShortcuts } from "@/hooks/use-editor-shortcuts";
import { Container } from "./user-components/container";
import type { Site } from "@/types/site";
import type { Page, PageContent } from "@/types/page";
import type { CanvasSettings } from "@/types/editor";

interface EditorWrapperProps {
  site: Site;
  page: Page;
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
  page: Page;
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
  lastSaved,
  setLastSaved,
}: EditorContentProps) {
  const { actions, query } = useEditor();
  const initialized = useRef(false);

  // Load initial content
  useEffect(() => {
    if (!initialized.current && page.content) {
      try {
        // Deserialize saved content
        actions.deserialize(page.content as any);
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
        pageName={page.title}
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
```

### Task 20.4: Updated Canvas with Frame Loading

**File: `src/components/editor/canvas.tsx`** (Updated)

```typescript
"use client";

import { Frame, Element, useEditor } from "@craftjs/core";
import { Container } from "./user-components/container";
import { cn } from "@/lib/utils";
import type { CanvasSettings } from "@/types/editor";

interface EditorCanvasProps {
  settings: CanvasSettings;
}

const widthClasses = {
  mobile: "max-w-[375px]",
  tablet: "max-w-[768px]",
  desktop: "max-w-[1280px]",
  full: "max-w-full",
};

export function EditorCanvas({ settings }: EditorCanvasProps) {
  const { connectors } = useEditor();

  return (
    <div
      className="flex-1 overflow-auto bg-muted/30 p-4 md:p-8"
      ref={(ref) => ref && connectors.select(connectors.hover(ref, ""), "")}
    >
      <div
        className={cn(
          "mx-auto min-h-[600px] bg-background shadow-lg transition-all duration-300",
          widthClasses[settings.width],
          settings.showOutlines && "editor-outlines"
        )}
      >
        <Frame>
          <Element
            is={Container}
            canvas
            className="min-h-[600px] w-full"
            padding="p-0"
          >
            {/* Content will be loaded via deserialize */}
          </Element>
        </Frame>
      </div>

      {/* CSS for outline mode */}
      <style jsx global>{`
        .editor-outlines [data-cy="craftjs-renderer"] > * {
          outline: 1px dashed hsl(var(--border));
          outline-offset: -1px;
        }
        .editor-outlines [data-cy="craftjs-renderer"] > *:hover {
          outline-color: hsl(var(--primary));
        }
      `}</style>
    </div>
  );
}
```

### Task 20.5: Page Selector for Multi-Page Sites

**File: `src/components/editor/page-selector.tsx`**

```typescript
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Home } from "lucide-react";
import type { Page } from "@/types/page";

interface PageSelectorProps {
  siteId: string;
  currentPageId: string;
  pages: Page[];
}

export function PageSelector({ siteId, currentPageId, pages }: PageSelectorProps) {
  const router = useRouter();

  const handlePageChange = (pageId: string) => {
    if (pageId === "new") {
      router.push(`/dashboard/sites/${siteId}/pages/new`);
    } else {
      router.push(`/dashboard/sites/${siteId}/editor?page=${pageId}`);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={currentPageId} onValueChange={handlePageChange}>
        <SelectTrigger className="w-[200px] h-8">
          <SelectValue placeholder="Select page" />
        </SelectTrigger>
        <SelectContent>
          {pages.map((page) => (
            <SelectItem key={page.id} value={page.id}>
              <div className="flex items-center gap-2">
                {page.is_homepage ? (
                  <Home className="h-3 w-3" />
                ) : (
                  <FileText className="h-3 w-3" />
                )}
                {page.title}
              </div>
            </SelectItem>
          ))}
          <SelectItem value="new">
            <div className="flex items-center gap-2 text-primary">
              <Plus className="h-3 w-3" />
              New Page
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
```

### Task 20.6: Auto-Save Hook

**File: `src/hooks/use-auto-save.ts`**

```typescript
"use client";

import { useEffect, useRef, useCallback } from "react";

interface UseAutoSaveOptions {
  onSave: () => Promise<void>;
  hasChanges: boolean;
  delay?: number; // ms
  enabled?: boolean;
}

export function useAutoSave({
  onSave,
  hasChanges,
  delay = 30000, // 30 seconds default
  enabled = true,
}: UseAutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<number>(Date.now());

  const save = useCallback(async () => {
    if (!hasChanges) return;

    try {
      await onSave();
      lastSaveRef.current = Date.now();
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  }, [hasChanges, onSave]);

  // Reset timer when changes are made
  useEffect(() => {
    if (!enabled || !hasChanges) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(save, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, hasChanges, delay, save]);

  // Save on visibility change (tab hidden)
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden && hasChanges) {
        save();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [enabled, hasChanges, save]);

  return {
    lastSave: lastSaveRef.current,
    triggerSave: save,
  };
}
```

### Task 20.7: Export New Components

**File: `src/components/editor/index.ts`** (Updated)

```typescript
// Provider
export * from "./editor-provider";
export * from "./editor-wrapper";

// Main components
export * from "./canvas";
export * from "./toolbox";
export * from "./settings-panel";
export * from "./page-selector";

// Toolbar
export * from "./toolbar";

// Resolver
export * from "./resolver";

// User components
export * from "./user-components/container";
export * from "./user-components/text";
export * from "./user-components/button-component";
export * from "./user-components/image-component";

// Settings
export * from "./settings";
```

---

## 📐 Acceptance Criteria

- [ ] Editor page loads with correct site and page
- [ ] Redirects to homepage if no page specified
- [ ] Redirects to create page if no pages exist
- [ ] Page content loads from database
- [ ] Changes are detected and enable save button
- [ ] Save persists content to database
- [ ] Auto-save triggers after delay
- [ ] Unsaved changes warning on page leave
- [ ] Keyboard shortcuts work
- [ ] All panels (toolbox, canvas, settings) render
- [ ] Page selector allows switching pages
- [ ] Editor has full height without dashboard nav

---

## 📁 Files Created This Phase

```
src/app/(dashboard)/dashboard/sites/[siteId]/editor/
├── page.tsx
└── layout.tsx

src/components/editor/
├── editor-wrapper.tsx
├── canvas.tsx (updated)
├── page-selector.tsx
└── index.ts (updated)

src/hooks/
└── use-auto-save.ts
```

---

## ➡️ Next Phase

**Phase 21: Advanced Editor Components** - Hero sections, feature grids, testimonials, CTAs.
