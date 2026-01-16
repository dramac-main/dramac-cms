"use client";

import { Smartphone, Tablet, Monitor, Maximize2 } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DeviceType } from "@/lib/preview/preview-utils";
import { DEVICES } from "@/lib/preview/preview-utils";

interface PreviewDeviceSwitcherProps {
  value: DeviceType;
  onChange: (device: DeviceType) => void;
  disabled?: boolean;
  className?: string;
}

const DEVICE_ICONS: Record<DeviceType, React.ComponentType<{ className?: string }>> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
  full: Maximize2,
};

/**
 * Device switcher component for responsive preview
 * Allows users to switch between mobile, tablet, desktop, and full width views
 */
export function PreviewDeviceSwitcher({
  value,
  onChange,
  disabled,
  className,
}: PreviewDeviceSwitcherProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => {
        if (v) {
          onChange(v as DeviceType);
        }
      }}
      disabled={disabled}
      className={className}
    >
      {DEVICES.map((device) => {
        const Icon = DEVICE_ICONS[device.id];
        return (
          <Tooltip key={device.id}>
            <TooltipTrigger asChild>
              <ToggleGroupItem 
                value={device.id} 
                aria-label={device.label}
                className="h-8 w-8 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                <Icon className="h-4 w-4" />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>
                {device.label}
                {device.width > 0 && (
                  <span className="text-muted-foreground ml-1">
                    ({device.width}px)
                  </span>
                )}
              </p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </ToggleGroup>
  );
}
