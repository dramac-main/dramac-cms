/**
 * PHASE AWD-08: Preview & Iteration System
 * Device Frame Component
 *
 * Renders a device frame around the preview content
 * with proper sizing and styling for different devices.
 */

"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { DeviceType, DevicePreview } from "@/lib/ai/website-designer/preview/types";

interface DeviceFrameProps {
  device: DevicePreview;
  children: ReactNode;
  className?: string;
}

export function DeviceFrame({ device, children, className }: DeviceFrameProps) {
  const isMobile = device.device === "mobile";
  const isTablet = device.device === "tablet";

  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-800 shadow-2xl overflow-hidden transition-all duration-300",
        isMobile && "rounded-[2.5rem]",
        isTablet && "rounded-2xl",
        !isMobile && !isTablet && "rounded-lg",
        className
      )}
      style={{
        width: device.width,
        height: device.height,
        transform: `scale(${device.scale})`,
        transformOrigin: "center",
      }}
    >
      {/* Device Notch for Mobile */}
      {isMobile && (
        <div className="h-7 bg-black flex items-center justify-center relative">
          {/* Dynamic Island */}
          <div className="w-24 h-6 bg-black rounded-full relative flex items-center justify-center">
            <div className="w-16 h-[18px] bg-gray-900 rounded-full" />
          </div>
        </div>
      )}

      {/* Tablet Top Bar */}
      {isTablet && (
        <div className="h-6 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-600" />
        </div>
      )}

      {/* Content Area */}
      <div
        className="overflow-auto"
        style={{
          height: isMobile
            ? device.height - 28
            : isTablet
            ? device.height - 24
            : device.height,
        }}
      >
        {children}
      </div>

      {/* Mobile Bottom Indicator */}
      {isMobile && (
        <div className="h-5 bg-black flex items-center justify-center">
          <div className="w-32 h-1 bg-white/30 rounded-full" />
        </div>
      )}
    </div>
  );
}

/**
 * Device selector button component
 */
interface DeviceSelectorProps {
  currentDevice: DeviceType;
  onDeviceChange: (device: DeviceType) => void;
}

export function DeviceSelector({
  currentDevice,
  onDeviceChange,
}: DeviceSelectorProps) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
      <DeviceButton
        device="mobile"
        icon={
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <rect x="7" y="2" width="10" height="20" rx="2" strokeWidth={2} />
            <line x1="12" y1="18" x2="12" y2="18" strokeWidth={2} strokeLinecap="round" />
          </svg>
        }
        isActive={currentDevice === "mobile"}
        onClick={() => onDeviceChange("mobile")}
      />
      <DeviceButton
        device="tablet"
        icon={
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <rect x="4" y="2" width="16" height="20" rx="2" strokeWidth={2} />
            <line x1="12" y1="18" x2="12" y2="18" strokeWidth={2} strokeLinecap="round" />
          </svg>
        }
        isActive={currentDevice === "tablet"}
        onClick={() => onDeviceChange("tablet")}
      />
      <DeviceButton
        device="desktop"
        icon={
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" strokeWidth={2} />
            <line x1="8" y1="21" x2="16" y2="21" strokeWidth={2} />
            <line x1="12" y1="17" x2="12" y2="21" strokeWidth={2} />
          </svg>
        }
        isActive={currentDevice === "desktop"}
        onClick={() => onDeviceChange("desktop")}
      />
    </div>
  );
}

interface DeviceButtonProps {
  device: DeviceType;
  icon: ReactNode;
  isActive: boolean;
  onClick: () => void;
}

function DeviceButton({ device, icon, isActive, onClick }: DeviceButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-8 w-8 flex items-center justify-center rounded transition-colors",
        isActive
          ? "bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white"
          : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      )}
      title={`${device.charAt(0).toUpperCase() + device.slice(1)} view`}
    >
      {icon}
    </button>
  );
}
