"use client";

import { useEditor } from "@craftjs/core";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Undo2,
  Redo2,
  Smartphone,
  Tablet,
  Monitor,
  Maximize,
  Eye,
  EyeOff,
  Save,
  ArrowLeft,
  Loader2,
  Square,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  PanelRightOpen,
  PanelRightClose,
} from "lucide-react";
import { useState } from "react";
import type { CanvasSettings } from "@/types/editor";
import type { DeviceType } from "@/lib/preview/preview-utils";
import { copyToClipboard } from "@/lib/preview/preview-utils";
import { toast } from "sonner";

interface EditorToolbarProps {
  siteName: string;
  pageName: string;
  siteId: string;
  pageId: string;
  settings: CanvasSettings;
  onSettingsChange: (settings: Partial<CanvasSettings>) => void;
  onSave: () => Promise<void>;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
  // Preview props
  isPreviewMode?: boolean;
  onTogglePreview?: () => void;
  device?: DeviceType;
  onDeviceChange?: (device: DeviceType) => void;
  showPreviewPanel?: boolean;
  onTogglePreviewPanel?: () => void;
  previewUrl?: string;
  onOpenNewWindow?: () => void;
  onRefreshPreview?: () => void;
}

const viewportOptions = [
  { id: "mobile", icon: Smartphone, label: "Mobile", width: 375 },
  { id: "tablet", icon: Tablet, label: "Tablet", width: 768 },
  { id: "desktop", icon: Monitor, label: "Desktop", width: 1280 },
  { id: "full", icon: Maximize, label: "Full Width", width: "100%" },
] as const;

export function EditorToolbar({
  siteName,
  pageName,
  siteId,
  pageId,
  settings,
  onSettingsChange,
  onSave,
  isSaving = false,
  hasUnsavedChanges = false,
  // Preview props with defaults
  isPreviewMode = false,
  onTogglePreview,
  device = "desktop",
  onDeviceChange,
  showPreviewPanel = false,
  onTogglePreviewPanel,
  previewUrl,
  onOpenNewWindow,
  onRefreshPreview,
}: EditorToolbarProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const { canUndo, canRedo, actions } = useEditor((state, query) => ({
    canUndo: query.history.canUndo(),
    canRedo: query.history.canRedo(),
  }));

  const handlePreview = () => {
    // If we have the toggle function, use it; otherwise open in new tab
    if (onTogglePreview) {
      onTogglePreview();
    } else {
      const url = previewUrl || `/preview/${siteId}/${pageId}`;
      window.open(url, "_blank");
    }
  };

  const handleOpenNewWindow = () => {
    if (onOpenNewWindow) {
      onOpenNewWindow();
    } else {
      const url = previewUrl || `/preview/${siteId}/${pageId}`;
      window.open(url, "_blank");
    }
  };

  const handleCopyUrl = async () => {
    const url = previewUrl || `${window.location.origin}/preview/${siteId}/${pageId}`;
    try {
      await copyToClipboard(url);
      setCopied(true);
      toast.success("Preview URL copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy URL");
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-14 border-b bg-background flex items-center justify-between px-4">
        {/* Left section */}
        <div className="flex items-center gap-4 min-w-0 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/sites/${siteId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{pageName}</p>
            <p className="text-xs text-muted-foreground truncate">{siteName}</p>
          </div>
          {hasUnsavedChanges && (
            <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 rounded flex-shrink-0">
              Unsaved
            </span>
          )}
        </div>

        {/* Center section - History & View Controls */}
        <div className="flex items-center gap-1 flex-1 justify-center">
          {/* History - only show when not in preview mode */}
          {!isPreviewMode && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={!canUndo}
                    onClick={() => actions.history.undo()}
                  >
                    <Undo2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={!canRedo}
                    onClick={() => actions.history.redo()}
                  >
                    <Redo2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
              </Tooltip>

              <Separator orientation="vertical" className="h-6 mx-2" />
            </>
          )}

          {/* Viewport - synced with preview device */}
          <div className="flex items-center border rounded-lg p-0.5">
            {viewportOptions.map((option) => {
              const Icon = option.icon;
              // Use preview device when in preview mode or showing panel, otherwise use canvas settings
              const currentWidth = (isPreviewMode || showPreviewPanel) && onDeviceChange 
                ? device 
                : settings.width;
              const isActive = currentWidth === option.id;

              return (
                <Tooltip key={option.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        // Update both canvas settings and preview device
                        onSettingsChange({ width: option.id });
                        if (onDeviceChange) {
                          onDeviceChange(option.id as DeviceType);
                        }
                      }}
                    >
                      <Icon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {option.label}{" "}
                    {typeof option.width === "number" && `(${option.width}px)`}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>

          <Separator orientation="vertical" className="h-6 mx-2" />

          {/* View toggles - only show when not in preview mode */}
          {!isPreviewMode && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={settings.showOutlines ? "secondary" : "ghost"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onSettingsChange({ showOutlines: !settings.showOutlines })}
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle Outlines</TooltipContent>
              </Tooltip>

              <Separator orientation="vertical" className="h-6 mx-2" />
            </>
          )}

          {/* Preview Mode Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isPreviewMode ? "default" : "outline"}
                size="sm"
                onClick={handlePreview}
              >
                {isPreviewMode ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-1.5" />
                    Exit Preview
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1.5" />
                    Preview
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isPreviewMode ? "Exit preview mode (Esc)" : "Enter preview mode"}
            </TooltipContent>
          </Tooltip>

          {/* Side Panel Toggle */}
          {onTogglePreviewPanel && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onTogglePreviewPanel}
                >
                  {showPreviewPanel ? (
                    <PanelRightClose className="h-4 w-4" />
                  ) : (
                    <PanelRightOpen className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {showPreviewPanel ? "Hide preview panel" : "Show side-by-side preview"}
              </TooltipContent>
            </Tooltip>
          )}

          <Separator orientation="vertical" className="h-6 mx-2" />

          {/* Preview Actions */}
          {onRefreshPreview && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onRefreshPreview}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh preview</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleCopyUrl}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{copied ? "Copied!" : "Copy preview URL"}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleOpenNewWindow}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open in new window</TooltipContent>
          </Tooltip>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            onClick={onSave}
            disabled={isSaving || !hasUnsavedChanges}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {hasUnsavedChanges ? "Save" : "Saved"}
              </>
            )}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
