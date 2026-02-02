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
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { useEditorStore, useUIStore, useHydratedUIStore, undo, redo, canUndo, canRedo, useHistoryState } from "@/lib/studio/store";
import type { Breakpoint } from "@/types/studio";

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

// =============================================================================
// VIEWPORT ICONS
// =============================================================================

const viewportIcons: Record<Breakpoint, typeof Monitor> = {
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
  const isDirty = useEditorStore((s) => s.isDirty);
  const { canUndo: historyCanUndo, canRedo: historyCanRedo } = useHistoryState();
  
  // Use hydration-safe hook for panel state to prevent SSR mismatch
  const panels = useHydratedUIStore((s) => s.panels);
  const breakpoint = useUIStore((s) => s.breakpoint);
  const togglePanel = useUIStore((s) => s.togglePanel);
  const setBreakpoint = useUIStore((s) => s.setBreakpoint);

  // Handlers
  const handleUndo = useCallback(() => undo(), []);
  const handleRedo = useCallback(() => redo(), []);

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
        return isDirty ? (
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <div className="h-2 w-2 rounded-full bg-current" />
            <span className="text-xs">Unsaved</span>
          </div>
        ) : null;
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-full items-center justify-between px-2">
        {/* Left Section: Navigation & History */}
        <div className="flex items-center gap-1">
          {/* Back to Site */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link href={`/dashboard/sites/${siteId}/pages`}>
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
                disabled={!historyCanUndo}
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
                disabled={!historyCanRedo}
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
            {(["desktop", "tablet", "mobile"] as Breakpoint[]).map((size) => {
              const Icon = viewportIcons[size];
              return (
                <Toggle
                  key={size}
                  pressed={breakpoint === size}
                  onPressedChange={() => setBreakpoint(size)}
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
              pressed={panels.left}
              onPressedChange={() => togglePanel("left")}
              size="sm"
              className="h-7 w-7"
              title="Toggle components panel (⌘\)"
            >
              <PanelLeft className="h-4 w-4" />
            </Toggle>
            <Toggle
              pressed={panels.bottom}
              onPressedChange={() => togglePanel("bottom")}
              size="sm"
              className="h-7 w-7"
              title="Toggle bottom panel (⌘J)"
            >
              <PanelBottom className="h-4 w-4" />
            </Toggle>
            <Toggle
              pressed={panels.right}
              onPressedChange={() => togglePanel("right")}
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
                disabled={saveStatus === "saving" || !isDirty}
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
    </TooltipProvider>
  );
});
