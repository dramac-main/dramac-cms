"use client";

import { cn } from "@/lib/utils";
import { useTouchDevice } from "@/hooks/use-touch-device";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Undo2,
  Redo2,
  Eye,
  Save,
  MoreVertical,
  Settings,
  HelpCircle,
  Layers,
  Smartphone,
  Tablet,
  Monitor,
  Maximize,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { type DeviceType } from "@/lib/preview/preview-utils";

interface MobileToolbarProps {
  onAddComponent?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onPreview?: () => void;
  onSave?: () => void;
  onSettings?: () => void;
  onHelp?: () => void;
  onLayerView?: () => void;
  onDeviceChange?: (device: DeviceType) => void;
  currentDevice?: DeviceType;
  canUndo?: boolean;
  canRedo?: boolean;
  isSaving?: boolean;
  hasChanges?: boolean;
  className?: string;
  /** Force show toolbar even on non-mobile devices (useful for testing) */
  forceShow?: boolean;
}

const deviceIcons: Record<DeviceType, typeof Smartphone> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
  full: Maximize,
};

const deviceLabels: Record<DeviceType, string> = {
  mobile: "Mobile",
  tablet: "Tablet",
  desktop: "Desktop",
  full: "Full Width",
};

export function MobileToolbar({
  onAddComponent,
  onUndo,
  onRedo,
  onPreview,
  onSave,
  onSettings,
  onHelp,
  onLayerView,
  onDeviceChange,
  currentDevice = "desktop",
  canUndo = false,
  canRedo = false,
  isSaving = false,
  hasChanges = false,
  className,
  forceShow = false,
}: MobileToolbarProps) {
  const { isMobile, isTablet, isTouchDevice } = useTouchDevice();

  // Show on mobile/tablet or when forced
  const shouldShow = forceShow || isMobile || (isTablet && isTouchDevice);

  if (!shouldShow) return null;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-background/95 backdrop-blur-sm border-t shadow-lg",
        "flex items-center justify-around",
        "px-2 py-2",
        "safe-area-inset-bottom",
        className
      )}
      role="toolbar"
      aria-label="Mobile editor toolbar"
    >
      {/* Add Component Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onAddComponent}
        className="touch-manipulation h-11 w-11"
        aria-label="Add component"
      >
        <Plus className="h-5 w-5" />
      </Button>

      {/* Undo Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onUndo}
        disabled={!canUndo}
        className="touch-manipulation h-11 w-11"
        aria-label="Undo"
      >
        <Undo2 className="h-5 w-5" />
      </Button>

      {/* Redo Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onRedo}
        disabled={!canRedo}
        className="touch-manipulation h-11 w-11"
        aria-label="Redo"
      >
        <Redo2 className="h-5 w-5" />
      </Button>

      {/* Preview Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onPreview}
        className="touch-manipulation h-11 w-11"
        aria-label="Preview"
      >
        <Eye className="h-5 w-5" />
      </Button>

      {/* Save Button */}
      <Button
        variant={hasChanges ? "default" : "ghost"}
        size="icon"
        onClick={onSave}
        disabled={isSaving || !hasChanges}
        className={cn(
          "touch-manipulation h-11 w-11",
          hasChanges && "bg-primary text-primary-foreground"
        )}
        aria-label={isSaving ? "Saving..." : "Save"}
      >
        <Save className={cn("h-5 w-5", isSaving && "animate-pulse")} />
      </Button>

      {/* More Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="touch-manipulation h-11 w-11"
            aria-label="More options"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-48">
          {/* Device Switcher */}
          {onDeviceChange && (
            <>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  {(() => {
                    const Icon = deviceIcons[currentDevice];
                    return <Icon className="mr-2 h-4 w-4" />;
                  })()}
                  {deviceLabels[currentDevice]}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {(Object.keys(deviceIcons) as DeviceType[]).map((device) => {
                    const Icon = deviceIcons[device];
                    return (
                      <DropdownMenuItem
                        key={device}
                        onClick={() => onDeviceChange(device)}
                        className={cn(
                          device === currentDevice && "bg-accent"
                        )}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {deviceLabels[device]}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Layer View */}
          {onLayerView && (
            <DropdownMenuItem onClick={onLayerView}>
              <Layers className="mr-2 h-4 w-4" />
              Layer View
            </DropdownMenuItem>
          )}

          {/* Settings */}
          {onSettings && (
            <DropdownMenuItem onClick={onSettings}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
          )}

          {/* Help */}
          {onHelp && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onHelp}>
                <HelpCircle className="mr-2 h-4 w-4" />
                Help
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
