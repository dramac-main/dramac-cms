# Phase 66: Mobile Editor Responsiveness - Touch-Friendly Visual Editor

> **AI Model**: Claude Opus 4.5 (1x)
>
> **Priority**: 🟡 HIGH
>
> **Estimated Time**: 3-4 hours

---

## 🎯 Objective

Make the visual editor fully responsive and touch-friendly for tablet and mobile devices. While full editing on mobile may be limited, users should be able to view previews, make quick text edits, and navigate comfortably.

---

## 📋 Prerequisites

- [ ] Phase 65 Export/Import completed
- [ ] Visual editor foundation working
- [ ] Craft.js integration stable

---

## 💼 Business Value

1. **Accessibility** - Edit on the go from any device
2. **Client Reviews** - Clients can review on tablets
3. **Quick Fixes** - Make urgent text changes anywhere
4. **Modern Expectations** - Users expect mobile support
5. **Competitive Edge** - Many builders lack mobile editing

---

## 📁 Files to Create

```
src/components/editor/
├── responsive/
│   ├── mobile-toolbar.tsx       # Mobile-optimized toolbar
│   ├── touch-handler.tsx        # Touch gesture handling
│   ├── bottom-sheet.tsx         # Mobile settings panel
│   ├── mobile-preview.tsx       # Mobile preview mode
│   └── device-switcher.tsx      # Device preview selector

src/hooks/
├── use-device.ts                # Device detection hook
├── use-touch-gestures.ts        # Touch gesture hook
├── use-responsive-editor.ts     # Responsive editor state

src/lib/editor/
├── responsive-config.ts         # Responsive breakpoints
├── touch-utils.ts               # Touch utilities
```

---

## ✅ Tasks

### Task 66.1: Device Detection Hook

**File: `src/hooks/use-device.ts`**

```typescript
"use client";

import { useState, useEffect } from "react";

export type DeviceType = "mobile" | "tablet" | "desktop";

interface DeviceInfo {
  type: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: "portrait" | "landscape";
}

const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
};

export function useDevice(): DeviceInfo {
  const [device, setDevice] = useState<DeviceInfo>(() => ({
    type: "desktop",
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    screenWidth: typeof window !== "undefined" ? window.innerWidth : 1920,
    screenHeight: typeof window !== "undefined" ? window.innerHeight : 1080,
    orientation: "landscape",
  }));

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isTouchDevice = 
        "ontouchstart" in window || 
        navigator.maxTouchPoints > 0;

      let type: DeviceType;
      if (width < BREAKPOINTS.mobile) {
        type = "mobile";
      } else if (width < BREAKPOINTS.tablet) {
        type = "tablet";
      } else {
        type = "desktop";
      }

      setDevice({
        type,
        isMobile: type === "mobile",
        isTablet: type === "tablet",
        isDesktop: type === "desktop",
        isTouchDevice,
        screenWidth: width,
        screenHeight: height,
        orientation: height > width ? "portrait" : "landscape",
      });
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    window.addEventListener("orientationchange", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
      window.removeEventListener("orientationchange", checkDevice);
    };
  }, []);

  return device;
}
```

---

### Task 66.2: Touch Gestures Hook

**File: `src/hooks/use-touch-gestures.ts`**

```typescript
"use client";

import { useCallback, useRef, useState, useEffect } from "react";

interface TouchPosition {
  x: number;
  y: number;
}

interface TouchGestureState {
  isTouching: boolean;
  startPosition: TouchPosition | null;
  currentPosition: TouchPosition | null;
  delta: TouchPosition;
  velocity: TouchPosition;
  scale: number;
  rotation: number;
}

interface TouchGestureHandlers {
  onTap?: (position: TouchPosition) => void;
  onDoubleTap?: (position: TouchPosition) => void;
  onLongPress?: (position: TouchPosition) => void;
  onSwipe?: (direction: "left" | "right" | "up" | "down", velocity: number) => void;
  onPinch?: (scale: number) => void;
  onPan?: (delta: TouchPosition) => void;
}

const LONG_PRESS_DURATION = 500;
const DOUBLE_TAP_DELAY = 300;
const SWIPE_THRESHOLD = 50;
const SWIPE_VELOCITY = 0.5;

export function useTouchGestures(
  elementRef: React.RefObject<HTMLElement>,
  handlers: TouchGestureHandlers
) {
  const [state, setState] = useState<TouchGestureState>({
    isTouching: false,
    startPosition: null,
    currentPosition: null,
    delta: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    scale: 1,
    rotation: 0,
  });

  const lastTapRef = useRef<number>(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const initialDistanceRef = useRef<number>(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    const position = { x: touch.clientX, y: touch.clientY };
    startTimeRef.current = Date.now();

    setState((prev) => ({
      ...prev,
      isTouching: true,
      startPosition: position,
      currentPosition: position,
      delta: { x: 0, y: 0 },
    }));

    // Long press detection
    longPressTimerRef.current = setTimeout(() => {
      handlers.onLongPress?.(position);
    }, LONG_PRESS_DURATION);

    // Pinch detection
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
    }
  }, [handlers]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!state.startPosition) return;

    const touch = e.touches[0];
    const position = { x: touch.clientX, y: touch.clientY };
    const delta = {
      x: position.x - state.startPosition.x,
      y: position.y - state.startPosition.y,
    };

    // Cancel long press if moved
    if (Math.abs(delta.x) > 10 || Math.abs(delta.y) > 10) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }

    // Pinch handling
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const scale = distance / initialDistanceRef.current;
      
      setState((prev) => ({ ...prev, scale }));
      handlers.onPinch?.(scale);
      return;
    }

    setState((prev) => ({
      ...prev,
      currentPosition: position,
      delta,
    }));

    handlers.onPan?.(delta);
  }, [state.startPosition, handlers]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    const endTime = Date.now();
    const duration = endTime - startTimeRef.current;
    const { delta } = state;

    // Swipe detection
    if (duration < 300 && (Math.abs(delta.x) > SWIPE_THRESHOLD || Math.abs(delta.y) > SWIPE_THRESHOLD)) {
      const velocity = Math.sqrt(delta.x * delta.x + delta.y * delta.y) / duration;
      
      if (velocity > SWIPE_VELOCITY) {
        if (Math.abs(delta.x) > Math.abs(delta.y)) {
          handlers.onSwipe?.(delta.x > 0 ? "right" : "left", velocity);
        } else {
          handlers.onSwipe?.(delta.y > 0 ? "down" : "up", velocity);
        }
      }
    }

    // Tap detection
    if (duration < 200 && Math.abs(delta.x) < 10 && Math.abs(delta.y) < 10) {
      const now = Date.now();
      if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
        handlers.onDoubleTap?.(state.startPosition!);
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
        handlers.onTap?.(state.startPosition!);
      }
    }

    setState((prev) => ({
      ...prev,
      isTouching: false,
      startPosition: null,
      currentPosition: null,
      delta: { x: 0, y: 0 },
      scale: 1,
    }));
  }, [state, handlers]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, { passive: true });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [elementRef, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return state;
}
```

---

### Task 66.3: Responsive Editor Hook

**File: `src/hooks/use-responsive-editor.ts`**

```typescript
"use client";

import { useState, useCallback, useMemo } from "react";
import { useDevice, type DeviceType } from "./use-device";

export type EditorMode = "edit" | "preview" | "settings";
export type PreviewDevice = "mobile" | "tablet" | "desktop" | "responsive";

interface ResponsiveEditorState {
  mode: EditorMode;
  previewDevice: PreviewDevice;
  isToolbarCollapsed: boolean;
  isSettingsPanelOpen: boolean;
  selectedComponentId: string | null;
  zoom: number;
}

export function useResponsiveEditor() {
  const device = useDevice();
  
  const [state, setState] = useState<ResponsiveEditorState>({
    mode: device.isMobile ? "preview" : "edit",
    previewDevice: "desktop",
    isToolbarCollapsed: device.isMobile,
    isSettingsPanelOpen: false,
    selectedComponentId: null,
    zoom: device.isMobile ? 0.5 : 1,
  });

  const setMode = useCallback((mode: EditorMode) => {
    setState((prev) => ({ ...prev, mode }));
  }, []);

  const setPreviewDevice = useCallback((previewDevice: PreviewDevice) => {
    setState((prev) => ({ ...prev, previewDevice }));
  }, []);

  const toggleToolbar = useCallback(() => {
    setState((prev) => ({ 
      ...prev, 
      isToolbarCollapsed: !prev.isToolbarCollapsed 
    }));
  }, []);

  const toggleSettingsPanel = useCallback(() => {
    setState((prev) => ({ 
      ...prev, 
      isSettingsPanelOpen: !prev.isSettingsPanelOpen 
    }));
  }, []);

  const selectComponent = useCallback((id: string | null) => {
    setState((prev) => ({ 
      ...prev, 
      selectedComponentId: id,
      isSettingsPanelOpen: id !== null && device.isMobile,
    }));
  }, [device.isMobile]);

  const setZoom = useCallback((zoom: number) => {
    setState((prev) => ({ 
      ...prev, 
      zoom: Math.max(0.25, Math.min(2, zoom)) 
    }));
  }, []);

  // Computed values
  const canEdit = useMemo(() => {
    // On mobile, only allow basic text editing
    return !device.isMobile || state.mode === "preview";
  }, [device.isMobile, state.mode]);

  const canDragDrop = useMemo(() => {
    // Disable drag-drop on mobile
    return !device.isMobile && state.mode === "edit";
  }, [device.isMobile, state.mode]);

  const previewWidth = useMemo(() => {
    switch (state.previewDevice) {
      case "mobile": return 375;
      case "tablet": return 768;
      case "desktop": return 1280;
      case "responsive": return "100%";
      default: return "100%";
    }
  }, [state.previewDevice]);

  return {
    ...state,
    device,
    canEdit,
    canDragDrop,
    previewWidth,
    setMode,
    setPreviewDevice,
    toggleToolbar,
    toggleSettingsPanel,
    selectComponent,
    setZoom,
  };
}
```

---

### Task 66.4: Responsive Configuration

**File: `src/lib/editor/responsive-config.ts`**

```typescript
export const RESPONSIVE_BREAKPOINTS = {
  mobile: {
    max: 767,
    defaultWidth: 375,
    icon: "Smartphone",
  },
  tablet: {
    min: 768,
    max: 1023,
    defaultWidth: 768,
    icon: "Tablet",
  },
  desktop: {
    min: 1024,
    defaultWidth: 1280,
    icon: "Monitor",
  },
} as const;

export const EDITOR_LAYOUT_CONFIG = {
  mobile: {
    showSidebar: false,
    showTopToolbar: false,
    showBottomSheet: true,
    showFloatingToolbar: true,
    toolbarPosition: "bottom" as const,
    defaultZoom: 0.5,
    minZoom: 0.25,
    maxZoom: 1,
  },
  tablet: {
    showSidebar: true,
    showTopToolbar: true,
    showBottomSheet: false,
    showFloatingToolbar: false,
    toolbarPosition: "top" as const,
    defaultZoom: 0.75,
    minZoom: 0.5,
    maxZoom: 1.5,
  },
  desktop: {
    showSidebar: true,
    showTopToolbar: true,
    showBottomSheet: false,
    showFloatingToolbar: false,
    toolbarPosition: "top" as const,
    defaultZoom: 1,
    minZoom: 0.5,
    maxZoom: 2,
  },
};

export const TOUCH_CONFIG = {
  tapHoldDuration: 500,
  doubleTapDelay: 300,
  swipeThreshold: 50,
  swipeVelocity: 0.5,
  pinchThreshold: 0.1,
};

export type BreakpointName = keyof typeof RESPONSIVE_BREAKPOINTS;
export type LayoutConfig = (typeof EDITOR_LAYOUT_CONFIG)[BreakpointName];
```

---

### Task 66.5: Touch Utilities

**File: `src/lib/editor/touch-utils.ts`**

```typescript
// Prevent default touch behaviors that interfere with editor
export function preventDefaultTouch(e: TouchEvent): void {
  if (e.touches.length > 1) {
    e.preventDefault();
  }
}

// Check if touch is on an interactive element
export function isTouchOnInteractive(e: TouchEvent): boolean {
  const target = e.target as HTMLElement;
  const interactiveElements = ["INPUT", "TEXTAREA", "BUTTON", "A", "SELECT"];
  
  return (
    interactiveElements.includes(target.tagName) ||
    target.isContentEditable ||
    target.closest("[role='button']") !== null ||
    target.closest("[data-interactive]") !== null
  );
}

// Calculate pinch center point
export function getPinchCenter(e: TouchEvent): { x: number; y: number } {
  if (e.touches.length < 2) {
    return { x: 0, y: 0 };
  }
  
  return {
    x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
    y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
  };
}

// Calculate pinch distance
export function getPinchDistance(e: TouchEvent): number {
  if (e.touches.length < 2) {
    return 0;
  }
  
  const dx = e.touches[0].clientX - e.touches[1].clientX;
  const dy = e.touches[0].clientY - e.touches[1].clientY;
  
  return Math.sqrt(dx * dx + dy * dy);
}

// Smooth scroll to element
export function scrollToElement(
  element: HTMLElement,
  container: HTMLElement,
  options: { offset?: number; behavior?: "smooth" | "auto" } = {}
): void {
  const { offset = 0, behavior = "smooth" } = options;
  
  const elementRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  
  const scrollTop = 
    elementRect.top - 
    containerRect.top + 
    container.scrollTop - 
    offset;
  
  container.scrollTo({
    top: scrollTop,
    behavior,
  });
}

// Enable/disable body scroll
export function setBodyScroll(enabled: boolean): void {
  if (enabled) {
    document.body.style.overflow = "";
    document.body.style.position = "";
    document.body.style.top = "";
  } else {
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.overflow = "hidden";
  }
}

// Get safe area insets (for notched devices)
export function getSafeAreaInsets(): {
  top: number;
  right: number;
  bottom: number;
  left: number;
} {
  const computedStyle = getComputedStyle(document.documentElement);
  
  return {
    top: parseInt(computedStyle.getPropertyValue("--sat") || "0", 10),
    right: parseInt(computedStyle.getPropertyValue("--sar") || "0", 10),
    bottom: parseInt(computedStyle.getPropertyValue("--sab") || "0", 10),
    left: parseInt(computedStyle.getPropertyValue("--sal") || "0", 10),
  };
}
```

---

### Task 66.6: Mobile Toolbar

**File: `src/components/editor/responsive/mobile-toolbar.tsx`**

```tsx
"use client";

import { useState } from "react";
import { 
  Eye, 
  Pencil, 
  Settings, 
  ChevronUp, 
  ChevronDown,
  Undo,
  Redo,
  Save,
  Smartphone,
  Tablet,
  Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EditorMode, PreviewDevice } from "@/hooks/use-responsive-editor";

interface MobileToolbarProps {
  mode: EditorMode;
  previewDevice: PreviewDevice;
  canUndo: boolean;
  canRedo: boolean;
  isSaving: boolean;
  onModeChange: (mode: EditorMode) => void;
  onPreviewDeviceChange: (device: PreviewDevice) => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
}

export function MobileToolbar({
  mode,
  previewDevice,
  canUndo,
  canRedo,
  isSaving,
  onModeChange,
  onPreviewDeviceChange,
  onUndo,
  onRedo,
  onSave,
}: MobileToolbarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 safe-area-pb">
      {/* Expanded toolbar */}
      {isExpanded && (
        <div className="bg-background border-t p-2 flex items-center justify-around">
          <Button
            variant={previewDevice === "mobile" ? "default" : "ghost"}
            size="icon"
            onClick={() => onPreviewDeviceChange("mobile")}
          >
            <Smartphone className="h-5 w-5" />
          </Button>
          <Button
            variant={previewDevice === "tablet" ? "default" : "ghost"}
            size="icon"
            onClick={() => onPreviewDeviceChange("tablet")}
          >
            <Tablet className="h-5 w-5" />
          </Button>
          <Button
            variant={previewDevice === "desktop" ? "default" : "ghost"}
            size="icon"
            onClick={() => onPreviewDeviceChange("desktop")}
          >
            <Monitor className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Main toolbar */}
      <div className="bg-background border-t shadow-lg">
        <div className="flex items-center justify-between p-2 gap-2">
          {/* Left: Mode toggle */}
          <div className="flex items-center gap-1">
            <Button
              variant={mode === "preview" ? "default" : "ghost"}
              size="sm"
              onClick={() => onModeChange("preview")}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant={mode === "edit" ? "default" : "ghost"}
              size="sm"
              onClick={() => onModeChange("edit")}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant={mode === "settings" ? "default" : "ghost"}
              size="sm"
              onClick={() => onModeChange("settings")}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {/* Center: Undo/Redo */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              disabled={!canUndo}
              onClick={onUndo}
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={!canRedo}
              onClick={onRedo}
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>

          {/* Right: Save & Expand */}
          <div className="flex items-center gap-1">
            <Button
              variant="default"
              size="sm"
              onClick={onSave}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### Task 66.7: Bottom Sheet Component

**File: `src/components/editor/responsive/bottom-sheet.tsx`**

```tsx
"use client";

import { useRef, useEffect, useState } from "react";
import { X, GripHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTouchGestures } from "@/hooks/use-touch-gestures";
import { setBodyScroll } from "@/lib/editor/touch-utils";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapPoints?: number[];
  defaultSnap?: number;
}

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  snapPoints = [0.3, 0.6, 0.9],
  defaultSnap = 0.6,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(defaultSnap);
  const [isDragging, setIsDragging] = useState(false);

  // Handle body scroll lock
  useEffect(() => {
    if (open) {
      setBodyScroll(false);
    } else {
      setBodyScroll(true);
    }

    return () => setBodyScroll(true);
  }, [open]);

  useTouchGestures(sheetRef, {
    onPan: (delta) => {
      if (!sheetRef.current) return;
      
      const windowHeight = window.innerHeight;
      const currentPx = height * windowHeight;
      const newPx = currentPx - delta.y;
      const newHeight = Math.max(0.1, Math.min(0.95, newPx / windowHeight));
      
      setHeight(newHeight);
      setIsDragging(true);
    },
    onSwipe: (direction) => {
      setIsDragging(false);
      
      if (direction === "down") {
        // Find nearest lower snap point
        const lowerSnaps = snapPoints.filter((s) => s < height);
        if (lowerSnaps.length > 0) {
          setHeight(lowerSnaps[lowerSnaps.length - 1]);
        } else {
          onClose();
        }
      } else if (direction === "up") {
        // Find nearest higher snap point
        const higherSnaps = snapPoints.filter((s) => s > height);
        if (higherSnaps.length > 0) {
          setHeight(higherSnaps[0]);
        }
      }
    },
  });

  // Snap to nearest point when dragging ends
  useEffect(() => {
    if (!isDragging) {
      const nearestSnap = snapPoints.reduce((prev, curr) =>
        Math.abs(curr - height) < Math.abs(prev - height) ? curr : prev
      );
      setHeight(nearestSnap);
    }
  }, [isDragging, height, snapPoints]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-background rounded-t-xl z-50",
          "transition-transform duration-200 ease-out",
          isDragging && "transition-none"
        )}
        style={{
          height: `${height * 100}vh`,
          transform: open ? "translateY(0)" : "translateY(100%)",
        }}
      >
        {/* Handle */}
        <div className="flex justify-center py-2 touch-none cursor-grab active:cursor-grabbing">
          <div className="w-10 h-1 bg-muted-foreground/20 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <h3 className="font-semibold">{title}</h3>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Content */}
        <div className="overflow-auto p-4" style={{ height: "calc(100% - 60px)" }}>
          {children}
        </div>
      </div>
    </>
  );
}
```

---

### Task 66.8: Device Switcher

**File: `src/components/editor/responsive/device-switcher.tsx`**

```tsx
"use client";

import { Smartphone, Tablet, Monitor, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { PreviewDevice } from "@/hooks/use-responsive-editor";

interface DeviceSwitcherProps {
  value: PreviewDevice;
  onChange: (device: PreviewDevice) => void;
  className?: string;
}

const DEVICES: { value: PreviewDevice; icon: React.ElementType; label: string; width: string }[] = [
  { value: "mobile", icon: Smartphone, label: "Mobile (375px)", width: "375px" },
  { value: "tablet", icon: Tablet, label: "Tablet (768px)", width: "768px" },
  { value: "desktop", icon: Monitor, label: "Desktop (1280px)", width: "1280px" },
  { value: "responsive", icon: Maximize2, label: "Responsive (100%)", width: "100%" },
];

export function DeviceSwitcher({ value, onChange, className }: DeviceSwitcherProps) {
  return (
    <div className={cn("flex items-center gap-1 p-1 bg-muted rounded-lg", className)}>
      {DEVICES.map(({ value: deviceValue, icon: Icon, label, width }) => (
        <Tooltip key={deviceValue}>
          <TooltipTrigger asChild>
            <Button
              variant={value === deviceValue ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => onChange(deviceValue)}
            >
              <Icon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
```

---

### Task 66.9: Mobile Preview Component

**File: `src/components/editor/responsive/mobile-preview.tsx`**

```tsx
"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { useDevice } from "@/hooks/use-device";
import type { PreviewDevice } from "@/hooks/use-responsive-editor";

interface MobilePreviewProps {
  previewDevice: PreviewDevice;
  zoom: number;
  children: React.ReactNode;
  className?: string;
}

const PREVIEW_WIDTHS: Record<PreviewDevice, number | "100%"> = {
  mobile: 375,
  tablet: 768,
  desktop: 1280,
  responsive: "100%",
};

export function MobilePreview({
  previewDevice,
  zoom,
  children,
  className,
}: MobilePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const device = useDevice();

  const width = PREVIEW_WIDTHS[previewDevice];
  const showDeviceFrame = !device.isMobile && previewDevice !== "responsive";

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex-1 overflow-auto bg-muted/50 p-4",
        device.isMobile && "p-0",
        className
      )}
    >
      <div
        className="mx-auto transition-all duration-200"
        style={{
          width: typeof width === "number" ? `${width * zoom}px` : width,
          transform: `scale(${zoom})`,
          transformOrigin: "top center",
        }}
      >
        {showDeviceFrame && previewDevice === "mobile" && (
          <div className="bg-background rounded-[40px] p-3 shadow-xl border-4 border-gray-800">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-800 rounded-b-2xl" />
            
            {/* Screen */}
            <div className="rounded-[30px] overflow-hidden bg-white">
              {children}
            </div>
          </div>
        )}

        {showDeviceFrame && previewDevice === "tablet" && (
          <div className="bg-gray-800 rounded-[20px] p-4 shadow-xl">
            {/* Camera */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-700 rounded-full" />
            
            {/* Screen */}
            <div className="rounded-lg overflow-hidden bg-white">
              {children}
            </div>
          </div>
        )}

        {(!showDeviceFrame || previewDevice === "desktop" || previewDevice === "responsive") && (
          <div className="bg-background shadow-lg rounded-lg overflow-hidden">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### Task 66.10: Touch Handler Wrapper

**File: `src/components/editor/responsive/touch-handler.tsx`**

```tsx
"use client";

import { useRef, useCallback, useEffect } from "react";
import { useDevice } from "@/hooks/use-device";
import { useTouchGestures } from "@/hooks/use-touch-gestures";

interface TouchHandlerProps {
  children: React.ReactNode;
  onComponentSelect?: (id: string | null) => void;
  onComponentEdit?: (id: string) => void;
  onZoomChange?: (zoom: number) => void;
  zoom?: number;
}

export function TouchHandler({
  children,
  onComponentSelect,
  onComponentEdit,
  onZoomChange,
  zoom = 1,
}: TouchHandlerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const device = useDevice();

  const handleTap = useCallback((position: { x: number; y: number }) => {
    // Find component at tap position
    const element = document.elementFromPoint(position.x, position.y);
    const component = element?.closest("[data-craft-id]");
    
    if (component) {
      const id = component.getAttribute("data-craft-id");
      onComponentSelect?.(id);
    } else {
      onComponentSelect?.(null);
    }
  }, [onComponentSelect]);

  const handleDoubleTap = useCallback((position: { x: number; y: number }) => {
    const element = document.elementFromPoint(position.x, position.y);
    const component = element?.closest("[data-craft-id]");
    
    if (component) {
      const id = component.getAttribute("data-craft-id");
      if (id) {
        onComponentEdit?.(id);
      }
    }
  }, [onComponentEdit]);

  const handlePinch = useCallback((scale: number) => {
    if (onZoomChange) {
      const newZoom = zoom * scale;
      onZoomChange(Math.max(0.25, Math.min(2, newZoom)));
    }
  }, [zoom, onZoomChange]);

  useTouchGestures(containerRef, {
    onTap: device.isTouchDevice ? handleTap : undefined,
    onDoubleTap: device.isTouchDevice ? handleDoubleTap : undefined,
    onPinch: device.isTouchDevice ? handlePinch : undefined,
  });

  // Prevent default touch behaviors
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    container.addEventListener("touchstart", preventZoom, { passive: false });
    
    return () => {
      container.removeEventListener("touchstart", preventZoom);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="touch-pan-y touch-pinch-zoom"
    >
      {children}
    </div>
  );
}
```

---

### Task 66.11: CSS Safe Area Support

**File: `src/app/globals.css`** (ADD to existing)

```css
/* Safe area insets for notched devices */
:root {
  --sat: env(safe-area-inset-top);
  --sar: env(safe-area-inset-right);
  --sab: env(safe-area-inset-bottom);
  --sal: env(safe-area-inset-left);
}

/* Safe area utilities */
.safe-area-pt { padding-top: var(--sat); }
.safe-area-pr { padding-right: var(--sar); }
.safe-area-pb { padding-bottom: var(--sab); }
.safe-area-pl { padding-left: var(--sal); }
.safe-area-p {
  padding-top: var(--sat);
  padding-right: var(--sar);
  padding-bottom: var(--sab);
  padding-left: var(--sal);
}

/* Touch action utilities */
.touch-pan-x { touch-action: pan-x; }
.touch-pan-y { touch-action: pan-y; }
.touch-pinch-zoom { touch-action: pinch-zoom; }
.touch-manipulation { touch-action: manipulation; }

/* Prevent text selection on touch */
.touch-none-select {
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}

/* Mobile editor specific */
@media (max-width: 767px) {
  .editor-canvas {
    touch-action: pan-y pinch-zoom;
    overflow-x: hidden;
  }
  
  .editor-component {
    min-height: 44px; /* Minimum touch target size */
    min-width: 44px;
  }
  
  .editor-toolbar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding-bottom: var(--sab);
  }
}

/* Hide scrollbars on touch devices */
@media (pointer: coarse) {
  .hide-scrollbar-touch::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar-touch {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
}
```

---

## 🧪 Testing Checklist

### Device Tests
- [ ] Mobile viewport renders correctly
- [ ] Tablet viewport renders correctly
- [ ] Touch gestures work on touch devices
- [ ] Safe area insets are respected

### Interaction Tests
- [ ] Tap to select component works
- [ ] Double-tap to edit works
- [ ] Pinch to zoom works
- [ ] Swipe gestures work
- [ ] Bottom sheet opens/closes

### Layout Tests
- [ ] Mobile toolbar displays correctly
- [ ] Device switcher changes preview
- [ ] Preview frames render properly
- [ ] Zoom controls work

---

## ✅ Completion Checklist

- [ ] Device detection hook created
- [ ] Touch gestures hook created
- [ ] Responsive editor hook created
- [ ] Mobile toolbar component created
- [ ] Bottom sheet component created
- [ ] Device switcher component created
- [ ] Mobile preview component created
- [ ] Touch handler wrapper created
- [ ] CSS safe area utilities added
- [ ] Tests on real devices passing

---

**Next Phase**: Phase 67 - AI Regeneration
