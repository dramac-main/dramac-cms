# PHASE-STUDIO-04: Studio Layout Shell

## Overview

| Property | Value |
|----------|-------|
| Phase | STUDIO-04 |
| Title | Studio Layout Shell |
| Priority | Critical |
| Estimated Time | 6-8 hours |
| Dependencies | PHASE-STUDIO-01, PHASE-STUDIO-02, PHASE-STUDIO-03 |
| Risk Level | Medium |

## Problem Statement

DRAMAC Studio needs a layout shell that:
1. Provides resizable panels (left sidebar, main canvas, right panel, bottom panel)
2. Creates the editor route at `/studio/[siteId]/[pageId]`
3. Implements a top toolbar for common actions
4. Supports panel collapse/expand
5. Uses the existing DRAMAC design system
6. Loads page data and initializes the editor state

This phase creates the foundational layout that all other Studio UI components will build upon.

## Goals

- [ ] Create Studio route with dynamic parameters
- [ ] Implement resizable panel layout with 4 panels
- [ ] Create top toolbar component
- [ ] Create panel header components
- [ ] Implement panel collapse/expand functionality
- [ ] Load page data and initialize stores
- [ ] Add keyboard shortcuts for panel toggles

## Technical Approach

1. **react-resizable-panels**: Use the already-installed library for panel resizing.

2. **Panel State in Zustand**: Use `useUIStore` from Phase 02 to persist panel states.

3. **CSS Variables**: Leverage DRAMAC's design system CSS variables.

4. **Server/Client Split**: Use server component for data fetching, client component for the editor.

---

## Implementation Tasks

### Task 1: Create Studio Route Structure

**Description:** Create the Next.js route for the Studio editor.

**File:** `src/app/(dashboard)/studio/[siteId]/[pageId]/page.tsx`

```tsx
/**
 * DRAMAC Studio Editor Page
 * 
 * Server component that loads page data and renders the Studio editor.
 */

import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudioEditor } from "@/components/studio/studio-editor";
import { StudioLoading } from "@/components/studio/core/studio-loading";
import type { Metadata, ResolvingMetadata } from "next";

// =============================================================================
// TYPES
// =============================================================================

interface StudioPageProps {
  params: Promise<{
    siteId: string;
    pageId: string;
  }>;
}

// =============================================================================
// METADATA
// =============================================================================

export async function generateMetadata(
  { params }: StudioPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { siteId, pageId } = await params;
  const supabase = await createClient();

  // Fetch page title
  const { data: page } = await supabase
    .from("pages")
    .select("title")
    .eq("id", pageId)
    .single();

  return {
    title: page?.title ? `Editing: ${page.title} | DRAMAC Studio` : "DRAMAC Studio",
  };
}

// =============================================================================
// DATA FETCHING
// =============================================================================

async function getPageData(siteId: string, pageId: string) {
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/sign-in");
  }

  // Fetch page with site info
  const { data: page, error: pageError } = await supabase
    .from("pages")
    .select(`
      id,
      title,
      slug,
      path,
      content,
      status,
      is_homepage,
      seo_title,
      seo_description,
      og_image,
      created_at,
      updated_at,
      published_at,
      site:sites!inner (
        id,
        name,
        subdomain,
        custom_domain,
        owner_id,
        brand_settings
      )
    `)
    .eq("id", pageId)
    .eq("site_id", siteId)
    .single();

  if (pageError || !page) {
    console.error("[Studio] Page not found:", pageError);
    notFound();
  }

  // Verify user has access to this site
  // Check if owner or has site_users entry
  const { data: siteAccess } = await supabase
    .from("site_users")
    .select("role")
    .eq("site_id", siteId)
    .eq("user_id", user.id)
    .single();

  const isOwner = page.site.owner_id === user.id;
  const hasAccess = isOwner || siteAccess !== null;

  if (!hasAccess) {
    console.error("[Studio] User does not have access to this site");
    redirect("/sites");
  }

  return {
    page,
    site: page.site,
    user,
    role: isOwner ? "owner" : siteAccess?.role ?? "viewer",
  };
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default async function StudioPage({ params }: StudioPageProps) {
  const { siteId, pageId } = await params;
  const data = await getPageData(siteId, pageId);

  return (
    <Suspense fallback={<StudioLoading />}>
      <StudioEditor
        siteId={siteId}
        pageId={pageId}
        page={data.page}
        site={data.site}
        userId={data.user.id}
        userRole={data.role}
      />
    </Suspense>
  );
}
```

**File:** `src/app/(dashboard)/studio/[siteId]/[pageId]/layout.tsx`

```tsx
/**
 * Studio Layout
 * 
 * Provides a clean layout without the dashboard sidebar.
 */

import type { ReactNode } from "react";

interface StudioLayoutProps {
  children: ReactNode;
}

export default function StudioLayout({ children }: StudioLayoutProps) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      {children}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Route accessible at `/studio/[siteId]/[pageId]`
- [ ] Unauthorized users redirected to sign-in
- [ ] Invalid pages show 404
- [ ] Page data loaded server-side

---

### Task 2: Create Studio Loading Component

**Description:** Create loading state for the studio editor.

**File:** `src/components/studio/core/studio-loading.tsx`

```tsx
/**
 * Studio Loading State
 * 
 * Displayed while the studio editor is loading.
 */

import { Loader2 } from "lucide-react";

export function StudioLoading() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        {/* Logo/Brand */}
        <div className="text-2xl font-bold text-primary">DRAMAC Studio</div>
        
        {/* Loading spinner */}
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        
        {/* Loading text */}
        <p className="text-sm text-muted-foreground">Loading editor...</p>
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Loading state displays correctly
- [ ] Spinner animates
- [ ] Matches design system

---

### Task 3: Create Panel Resize Layout

**Description:** Create the main resizable panel layout using react-resizable-panels.

**File:** `src/components/studio/layout/studio-layout.tsx`

```tsx
/**
 * DRAMAC Studio Layout
 * 
 * Main layout shell with resizable panels.
 * 
 * Layout structure:
 * ┌─────────────────────────────────────────────────────────┐
 * │                     Top Toolbar                         │
 * ├──────────┬───────────────────────────┬─────────────────┤
 * │          │                           │                  │
 * │   Left   │        Canvas             │      Right       │
 * │  Panel   │        (Main)             │      Panel       │
 * │          │                           │                  │
 * │          ├───────────────────────────┤                  │
 * │          │     Bottom Panel          │                  │
 * └──────────┴───────────────────────────┴─────────────────┘
 */

"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  type ImperativePanelHandle,
} from "react-resizable-panels";
import { useUIStore } from "@/lib/studio/stores/ui-store";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

interface StudioLayoutProps {
  toolbar: React.ReactNode;
  leftPanel: React.ReactNode;
  canvas: React.ReactNode;
  rightPanel: React.ReactNode;
  bottomPanel: React.ReactNode;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const PANEL_SIZES = {
  left: { min: 200, default: 260, max: 400 },
  right: { min: 280, default: 320, max: 500 },
  bottom: { min: 150, default: 200, max: 400 },
};

// =============================================================================
// COMPONENT
// =============================================================================

export function StudioLayout({
  toolbar,
  leftPanel,
  canvas,
  rightPanel,
  bottomPanel,
}: StudioLayoutProps) {
  const {
    leftPanelOpen,
    rightPanelOpen,
    bottomPanelOpen,
    leftPanelWidth,
    rightPanelWidth,
    bottomPanelHeight,
    setLeftPanelWidth,
    setRightPanelWidth,
    setBottomPanelHeight,
    toggleLeftPanel,
    toggleRightPanel,
    toggleBottomPanel,
  } = useUIStore();

  // Panel refs for imperative control
  const leftPanelRef = useRef<ImperativePanelHandle>(null);
  const rightPanelRef = useRef<ImperativePanelHandle>(null);
  const bottomPanelRef = useRef<ImperativePanelHandle>(null);

  // =============================================================================
  // KEYBOARD SHORTCUTS
  // =============================================================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for meta key (Cmd on Mac, Ctrl on Windows)
      const isMeta = e.metaKey || e.ctrlKey;
      
      if (isMeta && e.key === "\\") {
        e.preventDefault();
        toggleLeftPanel();
      }
      
      if (isMeta && e.shiftKey && e.key === "\\") {
        e.preventDefault();
        toggleRightPanel();
      }
      
      if (isMeta && e.key === "j") {
        e.preventDefault();
        toggleBottomPanel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleLeftPanel, toggleRightPanel, toggleBottomPanel]);

  // =============================================================================
  // PANEL RESIZE HANDLERS
  // =============================================================================

  const handleLeftPanelResize = useCallback((size: number) => {
    // Size is percentage, convert to approximate pixels
    const containerWidth = window.innerWidth;
    const pixelWidth = (size / 100) * containerWidth;
    setLeftPanelWidth(Math.round(pixelWidth));
  }, [setLeftPanelWidth]);

  const handleRightPanelResize = useCallback((size: number) => {
    const containerWidth = window.innerWidth;
    const pixelWidth = (size / 100) * containerWidth;
    setRightPanelWidth(Math.round(pixelWidth));
  }, [setRightPanelWidth]);

  const handleBottomPanelResize = useCallback((size: number) => {
    const containerHeight = window.innerHeight - 48; // Minus toolbar
    const pixelHeight = (size / 100) * containerHeight;
    setBottomPanelHeight(Math.round(pixelHeight));
  }, [setBottomPanelHeight]);

  // =============================================================================
  // CALCULATE PANEL PERCENTAGES
  // =============================================================================

  const containerWidth = typeof window !== "undefined" ? window.innerWidth : 1920;
  const containerHeight = typeof window !== "undefined" ? window.innerHeight - 48 : 1080;

  const leftSizePercent = (leftPanelWidth / containerWidth) * 100;
  const rightSizePercent = (rightPanelWidth / containerWidth) * 100;
  const bottomSizePercent = (bottomPanelHeight / containerHeight) * 100;

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className="flex h-screen w-screen flex-col bg-background">
      {/* Top Toolbar */}
      <div className="studio-toolbar h-12 shrink-0 border-b border-border">
        {toolbar}
      </div>

      {/* Main Panel Layout */}
      <PanelGroup
        direction="horizontal"
        className="flex-1"
        autoSaveId="studio-horizontal"
      >
        {/* Left Panel (Component List) */}
        {leftPanelOpen && (
          <>
            <Panel
              ref={leftPanelRef}
              id="left-panel"
              order={1}
              defaultSize={leftSizePercent}
              minSize={(PANEL_SIZES.left.min / containerWidth) * 100}
              maxSize={(PANEL_SIZES.left.max / containerWidth) * 100}
              onResize={handleLeftPanelResize}
              className="studio-panel-left"
            >
              <div className="flex h-full flex-col border-r border-border bg-muted/30">
                {leftPanel}
              </div>
            </Panel>
            <PanelResizeHandle className="studio-resize-handle-horizontal" />
          </>
        )}

        {/* Center Area (Canvas + Bottom Panel) */}
        <Panel id="center-panel" order={2}>
          <PanelGroup
            direction="vertical"
            autoSaveId="studio-vertical"
          >
            {/* Canvas */}
            <Panel
              id="canvas-panel"
              order={1}
              minSize={30}
              className="studio-panel-canvas"
            >
              <div className="flex h-full flex-col">
                {canvas}
              </div>
            </Panel>

            {/* Bottom Panel (Timeline, AI Chat, etc.) */}
            {bottomPanelOpen && (
              <>
                <PanelResizeHandle className="studio-resize-handle-vertical" />
                <Panel
                  ref={bottomPanelRef}
                  id="bottom-panel"
                  order={2}
                  defaultSize={bottomSizePercent}
                  minSize={(PANEL_SIZES.bottom.min / containerHeight) * 100}
                  maxSize={(PANEL_SIZES.bottom.max / containerHeight) * 100}
                  onResize={handleBottomPanelResize}
                  className="studio-panel-bottom"
                >
                  <div className="flex h-full flex-col border-t border-border bg-muted/30">
                    {bottomPanel}
                  </div>
                </Panel>
              </>
            )}
          </PanelGroup>
        </Panel>

        {/* Right Panel (Properties) */}
        {rightPanelOpen && (
          <>
            <PanelResizeHandle className="studio-resize-handle-horizontal" />
            <Panel
              ref={rightPanelRef}
              id="right-panel"
              order={3}
              defaultSize={rightSizePercent}
              minSize={(PANEL_SIZES.right.min / containerWidth) * 100}
              maxSize={(PANEL_SIZES.right.max / containerWidth) * 100}
              onResize={handleRightPanelResize}
              className="studio-panel-right"
            >
              <div className="flex h-full flex-col border-l border-border bg-muted/30">
                {rightPanel}
              </div>
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] All 4 panels render correctly
- [ ] Panels resize smoothly
- [ ] Panel sizes persist via Zustand
- [ ] Keyboard shortcuts work

---

### Task 4: Create Resize Handles CSS

**Description:** Add CSS for custom resize handles.

**File:** `src/styles/studio.css` (Add to existing file)

```css
/* =============================================================================
   PANEL RESIZE HANDLES
   ============================================================================= */

.studio-resize-handle-horizontal {
  width: 4px;
  background: transparent;
  transition: background-color 0.15s ease;
  cursor: col-resize;
  position: relative;
}

.studio-resize-handle-horizontal:hover,
.studio-resize-handle-horizontal[data-resize-handle-active] {
  background: oklch(var(--primary) / 0.3);
}

.studio-resize-handle-horizontal::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 2px;
  height: 32px;
  background: oklch(var(--muted-foreground) / 0.3);
  border-radius: 1px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.studio-resize-handle-horizontal:hover::before {
  opacity: 1;
}

.studio-resize-handle-vertical {
  height: 4px;
  background: transparent;
  transition: background-color 0.15s ease;
  cursor: row-resize;
  position: relative;
}

.studio-resize-handle-vertical:hover,
.studio-resize-handle-vertical[data-resize-handle-active] {
  background: oklch(var(--primary) / 0.3);
}

.studio-resize-handle-vertical::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 32px;
  height: 2px;
  background: oklch(var(--muted-foreground) / 0.3);
  border-radius: 1px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.studio-resize-handle-vertical:hover::before {
  opacity: 1;
}

/* =============================================================================
   PANEL STYLES
   ============================================================================= */

.studio-panel-left,
.studio-panel-right,
.studio-panel-bottom {
  overflow: hidden;
}

.studio-panel-canvas {
  background: oklch(var(--muted) / 0.1);
  overflow: hidden;
}
```

**Acceptance Criteria:**
- [ ] Resize handles have hover effect
- [ ] Cursor changes appropriately
- [ ] Visual indicator appears on hover

---

### Task 5: Create Panel Header Component

**Description:** Create reusable panel header with title and collapse button.

**File:** `src/components/studio/layout/panel-header.tsx`

```tsx
/**
 * Studio Panel Header
 * 
 * Reusable header for studio panels with title and collapse functionality.
 */

"use client";

import { memo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

interface PanelHeaderProps {
  title: string;
  icon?: LucideIcon;
  position: "left" | "right" | "bottom";
  onCollapse?: () => void;
  collapsed?: boolean;
  actions?: React.ReactNode;
  className?: string;
}

// =============================================================================
// COLLAPSE ICONS
// =============================================================================

const collapseIcons = {
  left: { expand: ChevronRight, collapse: ChevronLeft },
  right: { expand: ChevronLeft, collapse: ChevronRight },
  bottom: { expand: ChevronUp, collapse: ChevronDown },
};

// =============================================================================
// COMPONENT
// =============================================================================

export const PanelHeader = memo(function PanelHeader({
  title,
  icon: Icon,
  position,
  onCollapse,
  collapsed = false,
  actions,
  className,
}: PanelHeaderProps) {
  const CollapseIcon = collapsed
    ? collapseIcons[position].expand
    : collapseIcons[position].collapse;

  return (
    <div
      className={cn(
        "flex h-10 shrink-0 items-center justify-between border-b border-border bg-background px-3",
        className
      )}
    >
      {/* Left side: Icon and Title */}
      <div className="flex items-center gap-2">
        {Icon && (
          <Icon className="h-4 w-4 text-muted-foreground" />
        )}
        <h3 className="text-sm font-medium">{title}</h3>
      </div>

      {/* Right side: Actions and Collapse */}
      <div className="flex items-center gap-1">
        {actions}
        
        {onCollapse && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onCollapse}
            title={collapsed ? "Expand panel" : "Collapse panel"}
          >
            <CollapseIcon className="h-4 w-4" />
            <span className="sr-only">
              {collapsed ? "Expand" : "Collapse"} {title}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
});
```

**Acceptance Criteria:**
- [ ] Header displays title and icon
- [ ] Collapse button toggles panel
- [ ] Actions slot works
- [ ] Icons change based on position

---

### Task 6: Create Top Toolbar

**Description:** Create the main toolbar with common actions.

**File:** `src/components/studio/layout/studio-toolbar.tsx`

```tsx
/**
 * DRAMAC Studio Toolbar
 * 
 * Top toolbar with common editor actions.
 */

"use client";

import { memo, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Save,
  Eye,
  Play,
  Settings,
  PanelLeft,
  PanelRight,
  PanelBottom,
  Monitor,
  Tablet,
  Smartphone,
  MoreHorizontal,
  Loader2,
  Check,
  Cloud,
  CloudOff,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { useEditorStore } from "@/lib/studio/stores/editor-store";
import { useUIStore } from "@/lib/studio/stores/ui-store";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

interface StudioToolbarProps {
  siteId: string;
  pageId: string;
  pageTitle: string;
  siteName: string;
  onSave?: () => Promise<void>;
  onPreview?: () => void;
  onPublish?: () => void;
  saveStatus?: "idle" | "saving" | "saved" | "error";
}

type ViewportSize = "desktop" | "tablet" | "mobile";

// =============================================================================
// VIEWPORT ICONS
// =============================================================================

const viewportIcons: Record<ViewportSize, typeof Monitor> = {
  desktop: Monitor,
  tablet: Tablet,
  mobile: Smartphone,
};

// =============================================================================
// COMPONENT
// =============================================================================

export const StudioToolbar = memo(function StudioToolbar({
  siteId,
  pageId,
  pageTitle,
  siteName,
  onSave,
  onPreview,
  onPublish,
  saveStatus = "idle",
}: StudioToolbarProps) {
  // Store hooks
  const { canUndo, canRedo, undo, redo, hasChanges } = useEditorStore();
  const {
    leftPanelOpen,
    rightPanelOpen,
    bottomPanelOpen,
    toggleLeftPanel,
    toggleRightPanel,
    toggleBottomPanel,
    viewportSize,
    setViewportSize,
  } = useUIStore();

  // Handlers
  const handleUndo = useCallback(() => undo(), [undo]);
  const handleRedo = useCallback(() => redo(), [redo]);

  // Save status indicator
  const renderSaveStatus = () => {
    switch (saveStatus) {
      case "saving":
        return (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="text-xs">Saving...</span>
          </div>
        );
      case "saved":
        return (
          <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
            <Cloud className="h-3.5 w-3.5" />
            <span className="text-xs">Saved</span>
          </div>
        );
      case "error":
        return (
          <div className="flex items-center gap-1.5 text-destructive">
            <CloudOff className="h-3.5 w-3.5" />
            <span className="text-xs">Error</span>
          </div>
        );
      default:
        return hasChanges ? (
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <div className="h-2 w-2 rounded-full bg-current" />
            <span className="text-xs">Unsaved</span>
          </div>
        ) : null;
    }
  };

  return (
    <div className="flex h-full items-center justify-between px-2">
      {/* Left Section: Navigation & History */}
      <div className="flex items-center gap-1">
        {/* Back to Site */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link href={`/sites/${siteId}/pages`}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to pages</span>
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Back to pages</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Page Info */}
        <div className="flex flex-col px-2">
          <span className="text-xs text-muted-foreground">{siteName}</span>
          <span className="text-sm font-medium leading-tight">{pageTitle}</span>
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Undo/Redo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleUndo}
              disabled={!canUndo()}
            >
              <Undo2 className="h-4 w-4" />
              <span className="sr-only">Undo</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo (⌘Z)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRedo}
              disabled={!canRedo()}
            >
              <Redo2 className="h-4 w-4" />
              <span className="sr-only">Redo</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Redo (⌘⇧Z)</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Save Status */}
        <div className="px-2">
          {renderSaveStatus()}
        </div>
      </div>

      {/* Center Section: Viewport & AI */}
      <div className="flex items-center gap-1">
        {/* Viewport Toggle */}
        <div className="flex items-center rounded-md border border-border p-0.5">
          {(["desktop", "tablet", "mobile"] as ViewportSize[]).map((size) => {
            const Icon = viewportIcons[size];
            return (
              <Toggle
                key={size}
                pressed={viewportSize === size}
                onPressedChange={() => setViewportSize(size)}
                size="sm"
                className="h-7 w-7 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                <Icon className="h-4 w-4" />
                <span className="sr-only">{size} view</span>
              </Toggle>
            );
          })}
        </div>

        <Separator orientation="vertical" className="mx-2 h-6" />

        {/* AI Assist Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>AI</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Open AI Assistant (⌘K)</TooltipContent>
        </Tooltip>
      </div>

      {/* Right Section: Actions & Panels */}
      <div className="flex items-center gap-1">
        {/* Panel Toggles */}
        <div className="flex items-center rounded-md border border-border p-0.5">
          <Toggle
            pressed={leftPanelOpen}
            onPressedChange={toggleLeftPanel}
            size="sm"
            className="h-7 w-7"
            title="Toggle components panel (⌘\)"
          >
            <PanelLeft className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={bottomPanelOpen}
            onPressedChange={toggleBottomPanel}
            size="sm"
            className="h-7 w-7"
            title="Toggle bottom panel (⌘J)"
          >
            <PanelBottom className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={rightPanelOpen}
            onPressedChange={toggleRightPanel}
            size="sm"
            className="h-7 w-7"
            title="Toggle properties panel (⌘⇧\)"
          >
            <PanelRight className="h-4 w-4" />
          </Toggle>
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Preview */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={onPreview}
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Preview</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Preview page (⌘P)</TooltipContent>
        </Tooltip>

        {/* Save */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={onSave}
              disabled={saveStatus === "saving" || !hasChanges}
            >
              {saveStatus === "saving" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Save</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Save changes (⌘S)</TooltipContent>
        </Tooltip>

        {/* Publish */}
        <Button
          variant="default"
          size="sm"
          className="gap-1.5"
          onClick={onPublish}
        >
          <Play className="h-4 w-4" />
          <span>Publish</span>
        </Button>

        {/* More Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">More actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Page settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              SEO settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              Duplicate page
            </DropdownMenuItem>
            <DropdownMenuItem>
              Export HTML
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              Delete page
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
});
```

**Acceptance Criteria:**
- [ ] Toolbar renders with all sections
- [ ] Undo/redo buttons work
- [ ] Panel toggles work
- [ ] Viewport selector works
- [ ] Save status displays correctly

---

### Task 7: Create Studio Editor Container

**Description:** Create the main editor container that combines all components.

**File:** `src/components/studio/studio-editor.tsx`

```tsx
/**
 * DRAMAC Studio Editor
 * 
 * Main editor component that assembles the complete studio experience.
 */

"use client";

import { useEffect, useCallback, useState } from "react";
import { StudioProvider } from "@/components/studio/core/studio-provider";
import { StudioLayout } from "@/components/studio/layout/studio-layout";
import { StudioToolbar } from "@/components/studio/layout/studio-toolbar";
import { PanelHeader } from "@/components/studio/layout/panel-header";
import { useEditorStore } from "@/lib/studio/stores/editor-store";
import { useUIStore } from "@/lib/studio/stores/ui-store";
import {
  Layers,
  Settings2,
  MessageSquare,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import type { PageData, SiteData } from "@/types/studio";

// =============================================================================
// TYPES
// =============================================================================

interface StudioEditorProps {
  siteId: string;
  pageId: string;
  page: PageData;
  site: SiteData;
  userId: string;
  userRole: string;
}

// =============================================================================
// PLACEHOLDER PANELS (to be replaced in later phases)
// =============================================================================

function ComponentListPlaceholder() {
  return (
    <div className="flex flex-1 flex-col">
      <PanelHeader
        title="Components"
        icon={Layers}
        position="left"
        onCollapse={useUIStore.getState().toggleLeftPanel}
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
  const viewportSize = useUIStore((s) => s.viewportSize);
  
  return (
    <div className="flex h-full items-center justify-center bg-muted/50">
      <div className="text-center">
        <p className="text-lg font-medium">Canvas Area</p>
        <p className="text-sm text-muted-foreground">
          Viewport: {viewportSize}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Canvas will be implemented in Phase STUDIO-06
        </p>
      </div>
    </div>
  );
}

function PropertiesPanelPlaceholder() {
  return (
    <div className="flex flex-1 flex-col">
      <PanelHeader
        title="Properties"
        icon={Settings2}
        position="right"
        onCollapse={useUIStore.getState().toggleRightPanel}
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
  return (
    <div className="flex flex-1 flex-col">
      <PanelHeader
        title="AI Assistant"
        icon={MessageSquare}
        position="bottom"
        onCollapse={useUIStore.getState().toggleBottomPanel}
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

function StudioEditorInner({
  siteId,
  pageId,
  page,
  site,
  userId,
  userRole,
}: StudioEditorProps) {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const { loadPage, savePage, hasChanges } = useEditorStore();

  // Load page data on mount
  useEffect(() => {
    loadPage(page);
  }, [page, loadPage]);

  // Auto-save timer
  useEffect(() => {
    if (!hasChanges) return;

    const timer = setTimeout(() => {
      handleSave();
    }, 30000); // Auto-save after 30 seconds of no changes

    return () => clearTimeout(timer);
  }, [hasChanges]);

  // Save handler
  const handleSave = useCallback(async () => {
    try {
      setSaveStatus("saving");
      await savePage(siteId, pageId);
      setSaveStatus("saved");
      
      // Reset status after a delay
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("[Studio] Save failed:", error);
      setSaveStatus("error");
    }
  }, [siteId, pageId, savePage]);

  // Preview handler
  const handlePreview = useCallback(() => {
    // Open preview in new tab
    const previewUrl = site.custom_domain
      ? `https://${site.custom_domain}${page.path || `/${page.slug}`}`
      : `https://${site.subdomain}.dramac.com${page.path || `/${page.slug}`}`;
    
    window.open(previewUrl, "_blank");
  }, [site, page]);

  // Publish handler
  const handlePublish = useCallback(async () => {
    // Save first, then publish
    await handleSave();
    // TODO: Implement publish logic
    console.log("[Studio] Publishing page...");
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
          pageTitle={page.title}
          siteName={site.name}
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

// =============================================================================
// EXPORT WITH PROVIDER
// =============================================================================

export function StudioEditor(props: StudioEditorProps) {
  return (
    <StudioProvider
      siteId={props.siteId}
      pageId={props.pageId}
      userId={props.userId}
    >
      <StudioEditorInner {...props} />
    </StudioProvider>
  );
}
```

**Acceptance Criteria:**
- [ ] Editor initializes with page data
- [ ] All panels render
- [ ] Keyboard shortcuts work
- [ ] Save functionality works
- [ ] Preview opens in new tab

---

### Task 8: Create Layout Index Exports

**Description:** Create index file for layout components.

**File:** `src/components/studio/layout/index.ts`

```tsx
/**
 * Studio Layout Components
 */

export { StudioLayout } from "./studio-layout";
export { StudioToolbar } from "./studio-toolbar";
export { PanelHeader } from "./panel-header";
```

**File:** `src/components/studio/index.ts`

```tsx
/**
 * DRAMAC Studio Components
 */

// Layout
export * from "./layout";

// Core
export * from "./core/studio-provider";
export * from "./core/studio-loading";

// Main Editor
export { StudioEditor } from "./studio-editor";
```

**Acceptance Criteria:**
- [ ] All exports accessible from index
- [ ] TypeScript compiles without errors

---

## File Summary

| Action | Path | Description |
|--------|------|-------------|
| CREATE | `src/app/(dashboard)/studio/[siteId]/[pageId]/page.tsx` | Studio route page |
| CREATE | `src/app/(dashboard)/studio/[siteId]/[pageId]/layout.tsx` | Studio layout wrapper |
| CREATE | `src/components/studio/core/studio-loading.tsx` | Loading state component |
| CREATE | `src/components/studio/layout/studio-layout.tsx` | Resizable panel layout |
| CREATE | `src/components/studio/layout/panel-header.tsx` | Panel header component |
| CREATE | `src/components/studio/layout/studio-toolbar.tsx` | Top toolbar component |
| CREATE | `src/components/studio/layout/index.ts` | Layout exports |
| CREATE | `src/components/studio/studio-editor.tsx` | Main editor component |
| CREATE | `src/components/studio/index.ts` | Studio exports |
| UPDATE | `src/styles/studio.css` | Add resize handle styles |

---

## Testing Requirements

### Manual Testing
- [ ] Navigate to `/studio/[siteId]/[pageId]` with valid IDs
- [ ] Verify unauthorized users are redirected
- [ ] Verify invalid page IDs show 404
- [ ] Test panel resizing (drag handles)
- [ ] Test panel collapse (toolbar toggles)
- [ ] Test keyboard shortcuts (Cmd+\, Cmd+Shift+\, Cmd+J, Cmd+S, Cmd+P)
- [ ] Test viewport switching
- [ ] Test undo/redo buttons (even if no actions yet)

### Browser Testing
- [ ] Chrome - all features work
- [ ] Firefox - all features work
- [ ] Safari - all features work
- [ ] Mobile - graceful degradation

---

## Dependencies Required

No new dependencies - uses already installed packages:
- `react-resizable-panels` (already in package.json)

---

## Notes for Implementation

1. **Server Components**: The page component is a server component that fetches data. The editor is a client component.

2. **Placeholder Panels**: The panel contents are placeholders. They will be replaced in later phases:
   - Left Panel → Phase STUDIO-05 (Component List)
   - Canvas → Phase STUDIO-06 (Canvas Implementation)
   - Right Panel → Phase STUDIO-08 (Property Editors)
   - Bottom Panel → Phase STUDIO-11 (AI Integration)

3. **Keyboard Shortcuts**: Basic shortcuts are implemented. Phase STUDIO-10 will add the full keyboard shortcut system.

4. **Save Logic**: The save function in editor-store needs to be implemented to actually persist to Supabase.

5. **Panel Persistence**: Panel sizes are stored in Zustand. Consider adding localStorage persistence via middleware.

---

## Success Criteria

- [ ] Studio route accessible at `/studio/[siteId]/[pageId]`
- [ ] Resizable panel layout renders correctly
- [ ] All 4 panels visible and resizable
- [ ] Panel collapse/expand works
- [ ] Toolbar renders with all actions
- [ ] Keyboard shortcuts work
- [ ] Page data loads from server
- [ ] Save status indicator works
- [ ] `npx tsc --noEmit` returns zero errors

---

## Keyboard Shortcuts Reference

| Shortcut | Action |
|----------|--------|
| `⌘\` | Toggle left panel (components) |
| `⌘⇧\` | Toggle right panel (properties) |
| `⌘J` | Toggle bottom panel |
| `⌘S` | Save page |
| `⌘P` | Preview page |
| `⌘Z` | Undo |
| `⌘⇧Z` | Redo |
