/**
 * DRAMAC Studio Toolbar
 * 
 * Top toolbar with common editor actions.
 * Updated in PHASE-STUDIO-18 with responsive preview controls.
 * Updated in PHASE-STUDIO-20 with keyboard shortcuts button.
 * Updated in PHASE-STUDIO-26 with Help and What's New panels.
 * Updated in PHASE-STUDIO-29 with AI button functionality and toolbar cleanup.
 */

"use client";

import { memo, useCallback, useState } from "react";
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
  Wand2,
  Keyboard,
  Command,
  LayoutGrid,
  ChevronDown,
  MessageSquare,
  HelpCircle,
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
import { toast } from "sonner";
import { useEditorStore, useUIStore, useSelectionStore, useAIStore, undo, redo, useHistoryState } from "@/lib/studio/store";
import { AIPageGenerator } from "@/components/studio/ai";
import { DeviceSelector, DimensionsInput, ZoomControls, HelpPanel, WhatsNewPanel } from "@/components/studio/features";
import { TemplateBrowser } from "@/components/studio/features/template-browser";
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
  
  // Get panel state directly from store (panels are NOT persisted)
  const panels = useUIStore((s) => s.panels);
  const breakpoint = useUIStore((s) => s.breakpoint);
  const togglePanel = useUIStore((s) => s.togglePanel);
  const setBreakpoint = useUIStore((s) => s.setBreakpoint);
  
  // AI Page Generator state
  const [showPageGenerator, setShowPageGenerator] = useState(false);
  
  // Template Browser state (PHASE-STUDIO-24)
  const [showTemplateBrowser, setShowTemplateBrowser] = useState(false);

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

          {/* Add Section Button (PHASE-STUDIO-24) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setShowTemplateBrowser(true)}
                data-template-button
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Add Section</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Browse section templates</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Save Status */}
          <div className="px-2">
            {renderSaveStatus()}
          </div>
        </div>

        {/* Center Section: Device, Dimensions, Zoom & AI */}
        <div className="flex items-center gap-1" data-responsive-controls>
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

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Device Selector (PHASE-STUDIO-18) */}
          <DeviceSelector />
          
          {/* Dimensions Input (PHASE-STUDIO-18) */}
          <DimensionsInput />

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Zoom Controls (PHASE-STUDIO-18) */}
          <ZoomControls />

          <Separator orientation="vertical" className="mx-2 h-6" />

          {/* AI Generate Page Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5"
                onClick={() => setShowPageGenerator(true)}
                data-ai-generate
              >
                <Wand2 className="h-4 w-4 text-primary" />
                <span>Generate Page</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Generate page with AI</TooltipContent>
          </Tooltip>

          {/* AI Dropdown Menu (PHASE-STUDIO-29) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5" 
                data-ai-button
              >
                <Sparkles className="h-4 w-4 text-primary" />
                <span>AI</span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-48">
              <DropdownMenuItem onClick={() => setShowPageGenerator(true)}>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Page
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                togglePanel("bottom");
                toast.success("AI Assistant panel opened");
              }}>
                <MessageSquare className="mr-2 h-4 w-4" />
                AI Assistant
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                toast.info("AI suggestions coming soon!");
              }}>
                <Sparkles className="mr-2 h-4 w-4" />
                Smart Suggestions
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                toast.info("Quick actions coming soon!");
              }}>
                <HelpCircle className="mr-2 h-4 w-4" />
                Quick Actions
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                data-save-button
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

          {/* Command Palette Trigger (PHASE-STUDIO-20) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => useUIStore.getState().setCommandPaletteOpen(true)}
              >
                <Command className="h-4 w-4" />
                <span className="sr-only">Command palette</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Command Palette (⌘K)</TooltipContent>
          </Tooltip>

          {/* Keyboard Shortcuts (PHASE-STUDIO-20) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => useUIStore.getState().setShortcutsPanelOpen(true)}
              >
                <Keyboard className="h-4 w-4" />
                <span className="sr-only">Keyboard shortcuts</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Keyboard Shortcuts (⌘?)</TooltipContent>
          </Tooltip>

          {/* What's New (PHASE-STUDIO-26) */}
          <WhatsNewPanel />

          {/* Help Panel (PHASE-STUDIO-26) */}
          <HelpPanel />

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
      
      {/* AI Page Generator Dialog */}
      <AIPageGenerator
        isOpen={showPageGenerator}
        onClose={() => setShowPageGenerator(false)}
      />
      
      {/* Template Browser Dialog (PHASE-STUDIO-24) */}
      <TemplateBrowser
        open={showTemplateBrowser}
        onOpenChange={setShowTemplateBrowser}
        insertPosition="end"
      />
    </TooltipProvider>
  );
});
