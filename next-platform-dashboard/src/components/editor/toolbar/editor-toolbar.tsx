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
  Save,
  ArrowLeft,
  Loader2,
  Square,
} from "lucide-react";
import type { CanvasSettings } from "@/types/editor";

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
}: EditorToolbarProps) {
  const router = useRouter();
  const { canUndo, canRedo, actions } = useEditor((state, query) => ({
    canUndo: query.history.canUndo(),
    canRedo: query.history.canRedo(),
  }));

  const handlePreview = () => {
    // Open preview in new tab
    const previewUrl = `/preview/${siteId}/${pageId}`;
    window.open(previewUrl, "_blank");
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-14 border-b bg-background flex items-center justify-between px-4">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/sites/${siteId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <p className="text-sm font-medium">{pageName}</p>
            <p className="text-xs text-muted-foreground">{siteName}</p>
          </div>
        </div>

        {/* Center section - History & View */}
        <div className="flex items-center gap-1">
          {/* History */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
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
                disabled={!canRedo}
                onClick={() => actions.history.redo()}
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-2" />

          {/* Viewport */}
          <div className="flex items-center border rounded-lg p-0.5">
            {viewportOptions.map((option) => {
              const Icon = option.icon;
              const isActive = settings.width === option.id;

              return (
                <Tooltip key={option.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onSettingsChange({ width: option.id })}
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

          {/* View toggles */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={settings.showOutlines ? "secondary" : "ghost"}
                size="icon"
                onClick={() => onSettingsChange({ showOutlines: !settings.showOutlines })}
              >
                <Square className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Outlines</TooltipContent>
          </Tooltip>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={handlePreview}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </TooltipTrigger>
            <TooltipContent>Preview in new tab</TooltipContent>
          </Tooltip>

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
