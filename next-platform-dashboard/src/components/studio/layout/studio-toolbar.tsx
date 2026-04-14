/**
 * DRAMAC Studio Toolbar
 * 
 * Clean, industry-standard toolbar inspired by Webflow/Framer/Figma.
 * 3-section layout: Left (nav), Center (viewport), Right (actions).
 * Secondary tools grouped in popovers to keep the bar uncluttered.
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
  Zap,
  SlidersHorizontal,
  Plus,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
// VIEWPORT CONFIG
// =============================================================================

const viewportIcons: Record<Breakpoint, typeof Monitor> = {
  desktop: Monitor,
  tablet: Tablet,
  mobile: Smartphone,
};

// =============================================================================
// SAVE STATUS BADGE
// =============================================================================

function SaveStatusBadge({ saveStatus, isDirty }: { saveStatus: string; isDirty: boolean }) {
  switch (saveStatus) {
    case "saving":
      return (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span className="text-[11px]">Saving</span>
        </div>
      );
    case "saved":
      return (
        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <Cloud className="h-3 w-3" />
          <span className="text-[11px]">Saved</span>
        </div>
      );
    case "error":
      return (
        <div className="flex items-center gap-1 text-destructive">
          <CloudOff className="h-3 w-3" />
          <span className="text-[11px]">Error</span>
        </div>
      );
    default:
      return isDirty ? (
        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
          <div className="h-1.5 w-1.5 rounded-full bg-current" />
          <span className="text-[11px]">Unsaved</span>
        </div>
      ) : null;
  }
}

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
  const panels = useUIStore((s) => s.panels);
  const breakpoint = useUIStore((s) => s.breakpoint);
  const togglePanel = useUIStore((s) => s.togglePanel);
  const setBreakpoint = useUIStore((s) => s.setBreakpoint);
  const liveEffects = useUIStore((s) => s.liveEffects);
  const toggleLiveEffects = useUIStore((s) => s.toggleLiveEffects);
  const zoom = useUIStore((s) => s.zoom);
  
  // Dialogs
  const [showPageGenerator, setShowPageGenerator] = useState(false);
  const [showTemplateBrowser, setShowTemplateBrowser] = useState(false);

  // Handlers
  const handleUndo = useCallback(() => undo(), []);
  const handleRedo = useCallback(() => redo(), []);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-full items-center justify-between px-2 gap-2">
        
        {/* ─── LEFT: Navigation, History, Add ─── */}
        <div className="flex items-center gap-0.5 min-w-0">
          {/* Back */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
                <Link href={`/dashboard/sites/${siteId}/pages`}>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Back to pages</TooltipContent>
          </Tooltip>

          {/* Page Info — compact */}
          <div className="flex items-center gap-1.5 px-1.5 min-w-0 max-w-45">
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground truncate leading-none">{siteName}</p>
              <p className="text-xs font-medium truncate leading-tight">{pageTitle}</p>
            </div>
            <SaveStatusBadge saveStatus={saveStatus} isDirty={isDirty} />
          </div>

          <Separator orientation="vertical" className="mx-0.5 h-5" />

          {/* Undo / Redo */}
          <div className="flex items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleUndo} disabled={!historyCanUndo}>
                  <Undo2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Undo (Ctrl+Z)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleRedo} disabled={!historyCanRedo}>
                  <Redo2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Redo (Ctrl+Shift+Z)</TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="mx-0.5 h-5" />

          {/* Add Section */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => setShowTemplateBrowser(true)}
                data-template-button
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Add</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Add section template</TooltipContent>
          </Tooltip>
        </div>

        {/* ─── CENTER: Viewport & Zoom ─── */}
        <div className="flex items-center gap-1" data-responsive-controls>
          {/* Viewport Toggle — the main responsive breakpoint switcher */}
          <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
            {(["desktop", "tablet", "mobile"] as Breakpoint[]).map((size) => {
              const Icon = viewportIcons[size];
              return (
                <Toggle
                  key={size}
                  pressed={breakpoint === size}
                  onPressedChange={() => setBreakpoint(size)}
                  size="sm"
                  className="h-6 w-7 rounded-md data-[state=on]:bg-background data-[state=on]:shadow-sm data-[state=on]:text-foreground"
                >
                  <Icon className="h-3.5 w-3.5" />
                </Toggle>
              );
            })}
          </div>

          {/* Zoom Controls — compact inline */}
          <ZoomControls />

          {/* Advanced Viewport Options — collapsed into popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="center" className="w-auto p-3 space-y-3">
              <div className="space-y-2">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Device & Dimensions</p>
                <DeviceSelector />
                <DimensionsInput />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium">Live Effects</p>
                  <p className="text-[11px] text-muted-foreground">Parallax, animations</p>
                </div>
                <Toggle
                  pressed={liveEffects}
                  onPressedChange={toggleLiveEffects}
                  size="sm"
                  className={`h-7 w-7 ${liveEffects ? 'bg-primary text-primary-foreground' : ''}`}
                  disabled={zoom !== 1}
                >
                  <Zap className="h-3.5 w-3.5" />
                </Toggle>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* ─── RIGHT: AI, Panels, Actions ─── */}
        <div className="flex items-center gap-0.5">
          {/* AI — single dropdown for all AI features */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" data-ai-button>
                <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                <span className="hidden lg:inline">AI</span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
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
              <DropdownMenuItem onClick={() => toast.info("Smart Suggestions are being configured for your account.")}>
                <Sparkles className="mr-2 h-4 w-4" />
                Smart Suggestions
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="mx-0.5 h-5" />

          {/* Panel Toggles — compact pill group */}
          <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
            <Toggle
              pressed={panels.left}
              onPressedChange={() => togglePanel("left")}
              size="sm"
              className="h-6 w-7 rounded-md data-[state=on]:bg-background data-[state=on]:shadow-sm"
              title="Components (Ctrl+\)"
            >
              <PanelLeft className="h-3.5 w-3.5" />
            </Toggle>
            <Toggle
              pressed={panels.bottom}
              onPressedChange={() => togglePanel("bottom")}
              size="sm"
              className="h-6 w-7 rounded-md data-[state=on]:bg-background data-[state=on]:shadow-sm"
              title="Layers (Ctrl+J)"
            >
              <PanelBottom className="h-3.5 w-3.5" />
            </Toggle>
            <Toggle
              pressed={panels.right}
              onPressedChange={() => togglePanel("right")}
              size="sm"
              className="h-6 w-7 rounded-md data-[state=on]:bg-background data-[state=on]:shadow-sm"
              title="Properties (Ctrl+Shift+\)"
            >
              <PanelRight className="h-3.5 w-3.5" />
            </Toggle>
          </div>

          <Separator orientation="vertical" className="mx-0.5 h-5" />

          {/* Preview */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onPreview}>
                <Eye className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Preview (Ctrl+P)</TooltipContent>
          </Tooltip>

          {/* Save */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onSave}
                disabled={saveStatus === "saving" || !isDirty}
                data-save-button
              >
                {saveStatus === "saving" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Save (Ctrl+S)</TooltipContent>
          </Tooltip>

          {/* Publish — primary CTA */}
          <Button
            variant="default"
            size="sm"
            className="h-7 gap-1 px-3 text-xs font-medium"
            onClick={onPublish}
          >
            <Play className="h-3 w-3" />
            Publish
          </Button>

          {/* More — everything else lives here */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => useUIStore.getState().setCommandPaletteOpen(true)}>
                <Command className="mr-2 h-4 w-4" />
                Command Palette
                <span className="ml-auto text-[11px] text-muted-foreground">Ctrl+K</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => useUIStore.getState().setShortcutsPanelOpen(true)}>
                <Keyboard className="mr-2 h-4 w-4" />
                Keyboard Shortcuts
                <span className="ml-auto text-[11px] text-muted-foreground">Ctrl+?</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Page Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <LayoutGrid className="mr-2 h-4 w-4" />
                SEO Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Duplicate Page</DropdownMenuItem>
              <DropdownMenuItem>Export HTML</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">Delete Page</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* What's New — subtle dot indicator */}
          <WhatsNewPanel />
          <HelpPanel />
        </div>
      </div>
      
      {/* Dialogs */}
      <AIPageGenerator isOpen={showPageGenerator} onClose={() => setShowPageGenerator(false)} />
      <TemplateBrowser open={showTemplateBrowser} onOpenChange={setShowTemplateBrowser} insertPosition="end" />
    </TooltipProvider>
  );
});
