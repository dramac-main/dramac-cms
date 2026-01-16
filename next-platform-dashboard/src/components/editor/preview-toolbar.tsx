"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  ExternalLink,
  Copy,
  PanelRightOpen,
  PanelRightClose,
  Check,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { PreviewDeviceSwitcher } from "./preview-device-switcher";
import type { DeviceType } from "@/lib/preview/preview-utils";
import { copyToClipboard } from "@/lib/preview/preview-utils";
import { toast } from "sonner";

interface PreviewToolbarProps {
  isPreviewMode: boolean;
  onTogglePreview: () => void;
  device: DeviceType;
  onDeviceChange: (device: DeviceType) => void;
  showPanel: boolean;
  onTogglePanel: () => void;
  previewUrl: string;
  onOpenNewWindow: () => void;
  onRefresh: () => void;
  className?: string;
}

/**
 * Preview toolbar component with device switcher and preview controls
 * Provides preview mode toggle, device switching, URL copying, and new window opening
 */
export function PreviewToolbar({
  isPreviewMode,
  onTogglePreview,
  device,
  onDeviceChange,
  showPanel,
  onTogglePanel,
  previewUrl,
  onOpenNewWindow,
  onRefresh,
  className,
}: PreviewToolbarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = async () => {
    try {
      await copyToClipboard(previewUrl);
      setCopied(true);
      toast.success("Preview URL copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy URL");
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      {/* Device Switcher */}
      <PreviewDeviceSwitcher
        value={device}
        onChange={onDeviceChange}
        disabled={!isPreviewMode && !showPanel}
      />

      <Separator orientation="vertical" className="h-6" />

      {/* Preview Mode Toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isPreviewMode ? "default" : "outline"}
            size="sm"
            onClick={onTogglePreview}
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
          <p>{isPreviewMode ? "Exit preview mode (Esc)" : "Enter preview mode"}</p>
        </TooltipContent>
      </Tooltip>

      {/* Side Panel Toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="outline" 
            size="icon"
            className="h-8 w-8"
            onClick={onTogglePanel}
          >
            {showPanel ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{showPanel ? "Hide preview panel" : "Show side-by-side preview"}</p>
        </TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="h-6" />

      {/* Refresh Preview */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8"
            onClick={onRefresh}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Refresh preview</p>
        </TooltipContent>
      </Tooltip>

      {/* Copy URL */}
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
        <TooltipContent>
          <p>{copied ? "Copied!" : "Copy preview URL"}</p>
        </TooltipContent>
      </Tooltip>

      {/* Open in New Window */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8"
            onClick={onOpenNewWindow}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Open in new window</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
