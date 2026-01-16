"use client";

import { X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PreviewFrame } from "./preview-frame";
import { PreviewDeviceSwitcher } from "./preview-device-switcher";
import type { DeviceType } from "@/lib/preview/preview-utils";
import { cn } from "@/lib/utils";

interface PreviewPanelProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  device: DeviceType;
  onDeviceChange: (device: DeviceType) => void;
  refreshKey: number;
  onRefresh?: () => void;
}

/**
 * Side-by-side preview panel component
 * Displays a live preview alongside the editor canvas
 */
export function PreviewPanel({
  isOpen,
  onClose,
  url,
  device,
  onDeviceChange,
  refreshKey,
  onRefresh,
}: PreviewPanelProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed right-0 top-0 h-screen bg-background border-l shadow-lg z-40 transition-all duration-300 ease-in-out",
        isOpen ? "w-[50vw] translate-x-0" : "w-0 translate-x-full"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-background">
          <div className="flex items-center gap-4">
            <h3 className="font-medium text-sm">Live Preview</h3>
            <PreviewDeviceSwitcher value={device} onChange={onDeviceChange} />
          </div>
          <div className="flex items-center gap-1">
            {onRefresh && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onRefresh}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Preview Frame */}
        <div className="flex-1 p-4 overflow-auto bg-muted/20">
          <PreviewFrame
            url={url}
            device={device}
            refreshKey={refreshKey}
            className="h-full w-full"
            showDeviceFrame={device !== "full"}
          />
        </div>
      </div>
    </div>
  );
}
