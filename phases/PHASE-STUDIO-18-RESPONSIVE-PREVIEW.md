# PHASE-STUDIO-18: Responsive Preview

## Overview

| Property | Value |
|----------|-------|
| Phase | STUDIO-18 |
| Title | Responsive Preview |
| Priority | Medium |
| Estimated Time | 8-10 hours |
| Dependencies | STUDIO-04 (Layout Shell), STUDIO-06 (Canvas), STUDIO-10 (Responsive Fields) |
| Risk Level | Low |

## Problem Statement

Currently, users can switch between mobile/tablet/desktop breakpoints, but the preview experience is limited:
- No visual device frames (iPhone bezel, iPad frame, etc.)
- Cannot test exact custom widths
- No zoom controls for detailed inspection
- No ruler or guides for precise positioning
- Cannot preview how content looks on specific devices

This phase adds **Responsive Preview** features:
- Device preset selector (iPhone, iPad, various desktops)
- Custom width/height inputs
- Zoom controls (50% to 200%)
- Optional device frames (bezels)
- Ruler on canvas edges
- Orientation toggle (portrait/landscape)

## Goals

- [ ] Create device preset selector with common devices
- [ ] Add custom width/height input fields
- [ ] Implement zoom controls (buttons + keyboard shortcuts)
- [ ] Create optional device frame visualization
- [ ] Add ruler component for canvas edges
- [ ] Implement orientation toggle for mobile devices
- [ ] Integrate with existing breakpoint system

## Technical Approach

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  TOOLBAR                                                        │
│  ... │ 📱 iPhone 14 ▼ │ 390 × 844 │ ↻ │ 🔍 100% ▼ │ 📐 │ ...   │
└─────────────────────────────────────────────────────────────────┘

┌─ Ruler (horizontal) ────────────────────────────────────────────┐
│  0    100    200    300    390                                  │
├─┬───────────────────────────────────────────────────────────────┤
│R│  ┌─────────────────────────────────────────┐                  │
│u│  │  ╭──────────────────────────────────╮   │  ← Device Frame  │
│l│  │  │          ┌──────────┐           │   │                  │
│e│  │  │  12:00   │  notch   │    📶🔋   │   │                  │
│r│  │  │          └──────────┘           │   │                  │
│ │  │  │                                  │   │                  │
│(│  │  │                                  │   │                  │
│v│  │  │        CANVAS CONTENT            │   │                  │
│e│  │  │                                  │   │                  │
│r│  │  │                                  │   │                  │
│t│  │  │                                  │   │                  │
│)│  │  ╰──────────────────────────────────╯   │                  │
│ │  └─────────────────────────────────────────┘                  │
└─┴───────────────────────────────────────────────────────────────┘
```

### Device Presets

Define common device dimensions:
- iPhone SE, 14, 14 Pro, 14 Pro Max
- iPad Mini, Air, Pro
- Android phones (Pixel, Samsung)
- Laptops (13", 15", 16")
- Desktops (1080p, 1440p, 4K)
- Custom

### Zoom Behavior

- Zoom range: 25% to 400%
- Zoom steps: 25%, 50%, 75%, 100%, 125%, 150%, 200%, 400%
- Fit to screen: calculate zoom to fit canvas in viewport
- Mouse wheel zoom when holding Ctrl/Cmd (optional)

## Implementation Tasks

### Task 1: Create Device Presets Data

**Description:** Define the device presets with dimensions and metadata.

**Files:**
- CREATE: `src/lib/studio/data/device-presets.ts`

**Code:**

```typescript
// src/lib/studio/data/device-presets.ts

export interface DevicePreset {
  id: string;
  name: string;
  category: 'phone' | 'tablet' | 'laptop' | 'desktop' | 'custom';
  width: number;
  height: number;
  icon: string;
  hasNotch?: boolean;
  hasDynamicIsland?: boolean;
  hasHomeButton?: boolean;
  borderRadius?: number;
  devicePixelRatio?: number;
}

export const DEVICE_PRESETS: DevicePreset[] = [
  // Phones - iPhone
  {
    id: 'iphone-se',
    name: 'iPhone SE',
    category: 'phone',
    width: 375,
    height: 667,
    icon: '📱',
    hasHomeButton: true,
    borderRadius: 40,
  },
  {
    id: 'iphone-14',
    name: 'iPhone 14',
    category: 'phone',
    width: 390,
    height: 844,
    icon: '📱',
    hasNotch: true,
    borderRadius: 47,
  },
  {
    id: 'iphone-14-pro',
    name: 'iPhone 14 Pro',
    category: 'phone',
    width: 393,
    height: 852,
    icon: '📱',
    hasDynamicIsland: true,
    borderRadius: 55,
  },
  {
    id: 'iphone-14-pro-max',
    name: 'iPhone 14 Pro Max',
    category: 'phone',
    width: 430,
    height: 932,
    icon: '📱',
    hasDynamicIsland: true,
    borderRadius: 55,
  },
  {
    id: 'iphone-15-pro',
    name: 'iPhone 15 Pro',
    category: 'phone',
    width: 393,
    height: 852,
    icon: '📱',
    hasDynamicIsland: true,
    borderRadius: 55,
  },
  
  // Phones - Android
  {
    id: 'pixel-7',
    name: 'Pixel 7',
    category: 'phone',
    width: 412,
    height: 915,
    icon: '📱',
    borderRadius: 30,
  },
  {
    id: 'samsung-s23',
    name: 'Samsung S23',
    category: 'phone',
    width: 360,
    height: 780,
    icon: '📱',
    borderRadius: 30,
  },
  
  // Tablets
  {
    id: 'ipad-mini',
    name: 'iPad Mini',
    category: 'tablet',
    width: 744,
    height: 1133,
    icon: '💻',
    borderRadius: 20,
  },
  {
    id: 'ipad-air',
    name: 'iPad Air',
    category: 'tablet',
    width: 820,
    height: 1180,
    icon: '💻',
    borderRadius: 20,
  },
  {
    id: 'ipad-pro-11',
    name: 'iPad Pro 11"',
    category: 'tablet',
    width: 834,
    height: 1194,
    icon: '💻',
    borderRadius: 20,
  },
  {
    id: 'ipad-pro-12',
    name: 'iPad Pro 12.9"',
    category: 'tablet',
    width: 1024,
    height: 1366,
    icon: '💻',
    borderRadius: 20,
  },
  
  // Laptops
  {
    id: 'macbook-air-13',
    name: 'MacBook Air 13"',
    category: 'laptop',
    width: 1280,
    height: 800,
    icon: '💻',
  },
  {
    id: 'macbook-pro-14',
    name: 'MacBook Pro 14"',
    category: 'laptop',
    width: 1512,
    height: 982,
    icon: '💻',
  },
  {
    id: 'macbook-pro-16',
    name: 'MacBook Pro 16"',
    category: 'laptop',
    width: 1728,
    height: 1117,
    icon: '💻',
  },
  
  // Desktops
  {
    id: 'desktop-hd',
    name: 'HD (1080p)',
    category: 'desktop',
    width: 1920,
    height: 1080,
    icon: '🖥️',
  },
  {
    id: 'desktop-2k',
    name: '2K (1440p)',
    category: 'desktop',
    width: 2560,
    height: 1440,
    icon: '🖥️',
  },
  {
    id: 'desktop-4k',
    name: '4K (2160p)',
    category: 'desktop',
    width: 3840,
    height: 2160,
    icon: '🖥️',
  },
  
  // Custom
  {
    id: 'custom',
    name: 'Custom',
    category: 'custom',
    width: 0,
    height: 0,
    icon: '⚙️',
  },
];

export const ZOOM_LEVELS = [25, 50, 75, 100, 125, 150, 200, 300, 400];

export const DEFAULT_ZOOM = 100;
export const MIN_ZOOM = 25;
export const MAX_ZOOM = 400;
export const ZOOM_STEP = 25;

/**
 * Get breakpoint category from width
 */
export function getBreakpointFromWidth(width: number): 'mobile' | 'tablet' | 'desktop' {
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Get device preset by ID
 */
export function getDevicePreset(id: string): DevicePreset | undefined {
  return DEVICE_PRESETS.find(d => d.id === id);
}

/**
 * Group presets by category
 */
export function getPresetsByCategory(): Record<string, DevicePreset[]> {
  return DEVICE_PRESETS.reduce((acc, preset) => {
    if (!acc[preset.category]) acc[preset.category] = [];
    acc[preset.category].push(preset);
    return acc;
  }, {} as Record<string, DevicePreset[]>);
}
```

**Acceptance Criteria:**
- [ ] All device presets defined with dimensions
- [ ] Zoom levels defined
- [ ] Helper functions for breakpoint/preset lookup
- [ ] Presets grouped by category

---

### Task 2: Extend UI Store with Responsive Preview State

**Description:** Add viewport dimensions, zoom, and device selection to UI store.

**Files:**
- MODIFY: `src/lib/studio/store/ui-store.ts`

**Code:**

```typescript
// Add to UIState interface in ui-store.ts

import { 
  DEFAULT_ZOOM, 
  MIN_ZOOM, 
  MAX_ZOOM, 
  ZOOM_STEP,
  getBreakpointFromWidth,
} from '@/lib/studio/data/device-presets';

interface UIState {
  // ... existing properties
  
  // Responsive preview state
  selectedDeviceId: string;
  viewportWidth: number;
  viewportHeight: number;
  zoom: number;
  isLandscape: boolean;
  showDeviceFrame: boolean;
  showRuler: boolean;
  
  // Actions
  setDevice: (deviceId: string, width: number, height: number) => void;
  setViewportDimensions: (width: number, height: number) => void;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  fitToScreen: (containerWidth: number, containerHeight: number) => void;
  toggleOrientation: () => void;
  toggleDeviceFrame: () => void;
  toggleRuler: () => void;
}

// Add implementations:
export const useUIStore = create<UIState>((set, get) => ({
  // ... existing state
  
  // Responsive preview defaults
  selectedDeviceId: 'desktop-hd',
  viewportWidth: 1920,
  viewportHeight: 1080,
  zoom: DEFAULT_ZOOM,
  isLandscape: false,
  showDeviceFrame: false,
  showRuler: false,
  
  setDevice: (deviceId, width, height) => {
    set({
      selectedDeviceId: deviceId,
      viewportWidth: width,
      viewportHeight: height,
      breakpoint: getBreakpointFromWidth(width),
    });
  },
  
  setViewportDimensions: (width, height) => {
    set({
      viewportWidth: width,
      viewportHeight: height,
      breakpoint: getBreakpointFromWidth(width),
      selectedDeviceId: 'custom',
    });
  },
  
  setZoom: (zoom) => {
    set({ zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom)) });
  },
  
  zoomIn: () => {
    const { zoom } = get();
    const nextZoom = Math.min(MAX_ZOOM, zoom + ZOOM_STEP);
    set({ zoom: nextZoom });
  },
  
  zoomOut: () => {
    const { zoom } = get();
    const nextZoom = Math.max(MIN_ZOOM, zoom - ZOOM_STEP);
    set({ zoom: nextZoom });
  },
  
  resetZoom: () => {
    set({ zoom: DEFAULT_ZOOM });
  },
  
  fitToScreen: (containerWidth, containerHeight) => {
    const { viewportWidth, viewportHeight } = get();
    const padding = 80; // Padding around canvas
    
    const availableWidth = containerWidth - padding * 2;
    const availableHeight = containerHeight - padding * 2;
    
    const scaleX = availableWidth / viewportWidth;
    const scaleY = availableHeight / viewportHeight;
    const scale = Math.min(scaleX, scaleY, 1); // Don't exceed 100%
    
    set({ zoom: Math.round(scale * 100) });
  },
  
  toggleOrientation: () => {
    const { viewportWidth, viewportHeight, isLandscape } = get();
    set({
      viewportWidth: viewportHeight,
      viewportHeight: viewportWidth,
      isLandscape: !isLandscape,
      breakpoint: getBreakpointFromWidth(viewportHeight), // Swapped
    });
  },
  
  toggleDeviceFrame: () => {
    set((state) => ({ showDeviceFrame: !state.showDeviceFrame }));
  },
  
  toggleRuler: () => {
    set((state) => ({ showRuler: !state.showRuler }));
  },
}));
```

**Acceptance Criteria:**
- [ ] Device selection updates viewport and breakpoint
- [ ] Custom dimensions update breakpoint
- [ ] Zoom controls work with min/max limits
- [ ] Fit to screen calculates appropriate zoom
- [ ] Orientation toggle swaps dimensions
- [ ] Device frame and ruler toggles work

---

### Task 3: Create Device Selector Component

**Description:** Create a dropdown for selecting device presets.

**Files:**
- CREATE: `src/components/studio/features/device-selector.tsx`

**Code:**

```typescript
// src/components/studio/features/device-selector.tsx
'use client';

import React, { useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Smartphone, Tablet, Laptop, Monitor, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/lib/studio/store/ui-store';
import { DEVICE_PRESETS, getPresetsByCategory } from '@/lib/studio/data/device-presets';

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  phone: Smartphone,
  tablet: Tablet,
  laptop: Laptop,
  desktop: Monitor,
  custom: Settings,
};

const categoryLabels: Record<string, string> = {
  phone: 'Phones',
  tablet: 'Tablets',
  laptop: 'Laptops',
  desktop: 'Desktops',
  custom: 'Custom',
};

export function DeviceSelector() {
  const { selectedDeviceId, setDevice, viewportWidth, viewportHeight } = useUIStore();
  
  const presetsByCategory = useMemo(() => getPresetsByCategory(), []);
  
  const selectedPreset = DEVICE_PRESETS.find(d => d.id === selectedDeviceId);
  const SelectedIcon = selectedPreset 
    ? categoryIcons[selectedPreset.category] || Monitor
    : Monitor;
  
  const handleValueChange = (deviceId: string) => {
    const preset = DEVICE_PRESETS.find(d => d.id === deviceId);
    if (preset && preset.id !== 'custom') {
      setDevice(deviceId, preset.width, preset.height);
    } else {
      setDevice('custom', viewportWidth, viewportHeight);
    }
  };
  
  return (
    <Select value={selectedDeviceId} onValueChange={handleValueChange}>
      <SelectTrigger className="w-[180px] h-8">
        <div className="flex items-center gap-2">
          <SelectedIcon className="h-4 w-4" />
          <SelectValue placeholder="Select device" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(presetsByCategory).map(([category, presets]) => (
          <SelectGroup key={category}>
            <SelectLabel className="flex items-center gap-2">
              {React.createElement(categoryIcons[category] || Monitor, { 
                className: 'h-3 w-3' 
              })}
              {categoryLabels[category]}
            </SelectLabel>
            {presets.map((preset) => (
              <SelectItem 
                key={preset.id} 
                value={preset.id}
                className="pl-6"
              >
                <div className="flex items-center justify-between w-full">
                  <span>{preset.name}</span>
                  {preset.id !== 'custom' && (
                    <span className="text-xs text-muted-foreground ml-2">
                      {preset.width}×{preset.height}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
```

**Acceptance Criteria:**
- [ ] Shows all device presets grouped by category
- [ ] Displays device icon and name
- [ ] Shows dimensions in dropdown
- [ ] Selection updates viewport

---

### Task 4: Create Dimensions Input Component

**Description:** Create editable width/height inputs.

**Files:**
- CREATE: `src/components/studio/features/dimensions-input.tsx`

**Code:**

```typescript
// src/components/studio/features/dimensions-input.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { X, RotateCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUIStore } from '@/lib/studio/store/ui-store';

export function DimensionsInput() {
  const { 
    viewportWidth, 
    viewportHeight, 
    setViewportDimensions,
    toggleOrientation,
    isLandscape,
  } = useUIStore();
  
  const [width, setWidth] = useState(String(viewportWidth));
  const [height, setHeight] = useState(String(viewportHeight));
  
  // Sync with store
  useEffect(() => {
    setWidth(String(viewportWidth));
  }, [viewportWidth]);
  
  useEffect(() => {
    setHeight(String(viewportHeight));
  }, [viewportHeight]);
  
  const handleWidthBlur = () => {
    const numWidth = parseInt(width, 10);
    if (!isNaN(numWidth) && numWidth > 0) {
      setViewportDimensions(numWidth, viewportHeight);
    } else {
      setWidth(String(viewportWidth));
    }
  };
  
  const handleHeightBlur = () => {
    const numHeight = parseInt(height, 10);
    if (!isNaN(numHeight) && numHeight > 0) {
      setViewportDimensions(viewportWidth, numHeight);
    } else {
      setHeight(String(viewportHeight));
    }
  };
  
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    type: 'width' | 'height'
  ) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
    
    // Arrow key adjustments
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const delta = e.shiftKey ? 10 : 1;
      const direction = e.key === 'ArrowUp' ? 1 : -1;
      
      if (type === 'width') {
        const newWidth = Math.max(1, viewportWidth + delta * direction);
        setViewportDimensions(newWidth, viewportHeight);
      } else {
        const newHeight = Math.max(1, viewportHeight + delta * direction);
        setViewportDimensions(viewportWidth, newHeight);
      }
    }
  };
  
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Input
              type="text"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              onBlur={handleWidthBlur}
              onKeyDown={(e) => handleKeyDown(e, 'width')}
              className="w-16 h-8 text-center text-sm"
            />
          </TooltipTrigger>
          <TooltipContent>
            Width (px). Use ↑↓ to adjust.
          </TooltipContent>
        </Tooltip>
        
        <X className="h-3 w-3 text-muted-foreground" />
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Input
              type="text"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              onBlur={handleHeightBlur}
              onKeyDown={(e) => handleKeyDown(e, 'height')}
              className="w-16 h-8 text-center text-sm"
            />
          </TooltipTrigger>
          <TooltipContent>
            Height (px). Use ↑↓ to adjust.
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleOrientation}
            >
              <RotateCw className={`h-4 w-4 ${isLandscape ? 'text-primary' : ''}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Toggle orientation
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
```

**Acceptance Criteria:**
- [ ] Width and height editable
- [ ] Enter key commits changes
- [ ] Arrow keys adjust values
- [ ] Shift+Arrow for larger steps
- [ ] Orientation toggle swaps values

---

### Task 5: Create Zoom Controls Component

**Description:** Create zoom controls with buttons and dropdown.

**Files:**
- CREATE: `src/components/studio/features/zoom-controls.tsx`

**Code:**

```typescript
// src/components/studio/features/zoom-controls.tsx
'use client';

import React, { useRef, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { useUIStore } from '@/lib/studio/store/ui-store';
import { ZOOM_LEVELS } from '@/lib/studio/data/device-presets';

interface ZoomControlsProps {
  canvasContainerRef?: React.RefObject<HTMLElement>;
}

export function ZoomControls({ canvasContainerRef }: ZoomControlsProps) {
  const { 
    zoom, 
    setZoom, 
    zoomIn, 
    zoomOut, 
    resetZoom, 
    fitToScreen,
    showRuler,
    showDeviceFrame,
    toggleRuler,
    toggleDeviceFrame,
  } = useUIStore();
  
  const handleFitToScreen = useCallback(() => {
    if (canvasContainerRef?.current) {
      const { clientWidth, clientHeight } = canvasContainerRef.current;
      fitToScreen(clientWidth, clientHeight);
    } else {
      // Fallback to window dimensions
      fitToScreen(window.innerWidth - 600, window.innerHeight - 200);
    }
  }, [canvasContainerRef, fitToScreen]);
  
  const handleZoomSelect = (value: string) => {
    if (value === 'fit') {
      handleFitToScreen();
    } else {
      setZoom(parseInt(value, 10));
    }
  };
  
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={zoomOut}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom Out (⌘-)</TooltipContent>
        </Tooltip>
        
        <Select value={String(zoom)} onValueChange={handleZoomSelect}>
          <SelectTrigger className="w-[85px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fit">Fit</SelectItem>
            <Separator className="my-1" />
            {ZOOM_LEVELS.map((level) => (
              <SelectItem key={level} value={String(level)}>
                {level}%
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={zoomIn}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom In (⌘+)</TooltipContent>
        </Tooltip>
        
        <Separator orientation="vertical" className="h-6 mx-1" />
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${showRuler ? 'bg-accent' : ''}`}
              onClick={toggleRuler}
            >
              <Ruler className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle Ruler</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${showDeviceFrame ? 'bg-accent' : ''}`}
              onClick={toggleDeviceFrame}
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle Device Frame</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
```

**Acceptance Criteria:**
- [ ] Zoom in/out buttons work
- [ ] Dropdown shows zoom levels
- [ ] Fit option calculates appropriate zoom
- [ ] Ruler toggle button
- [ ] Device frame toggle button

---

### Task 6: Create Ruler Component

**Description:** Create horizontal and vertical rulers for the canvas.

**Files:**
- CREATE: `src/components/studio/features/ruler.tsx`

**Code:**

```typescript
// src/components/studio/features/ruler.tsx
'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface RulerProps {
  orientation: 'horizontal' | 'vertical';
  length: number; // Viewport width or height
  zoom: number; // Zoom percentage
  className?: string;
}

const MAJOR_TICK_INTERVAL = 100; // Major tick every 100px
const MINOR_TICK_INTERVAL = 10; // Minor tick every 10px

export function Ruler({ orientation, length, zoom, className }: RulerProps) {
  const isHorizontal = orientation === 'horizontal';
  const scale = zoom / 100;
  
  // Calculate visible ticks based on zoom
  const ticks = useMemo(() => {
    const result: Array<{ position: number; isMajor: boolean; label?: string }> = [];
    const scaledLength = length;
    
    for (let i = 0; i <= scaledLength; i += MINOR_TICK_INTERVAL) {
      const isMajor = i % MAJOR_TICK_INTERVAL === 0;
      result.push({
        position: i * scale,
        isMajor,
        label: isMajor ? String(i) : undefined,
      });
    }
    
    return result;
  }, [length, scale]);
  
  return (
    <div
      className={cn(
        'bg-muted/50 border-border select-none overflow-hidden',
        isHorizontal ? 'h-5 border-b flex' : 'w-5 border-r',
        className
      )}
      style={{
        [isHorizontal ? 'width' : 'height']: length * scale,
      }}
    >
      {isHorizontal ? (
        // Horizontal ruler
        <svg 
          width={length * scale} 
          height={20} 
          className="text-muted-foreground"
        >
          {ticks.map((tick, i) => (
            <g key={i}>
              <line
                x1={tick.position}
                y1={tick.isMajor ? 0 : 12}
                x2={tick.position}
                y2={20}
                stroke="currentColor"
                strokeWidth={tick.isMajor ? 1 : 0.5}
                opacity={tick.isMajor ? 0.6 : 0.3}
              />
              {tick.label && (
                <text
                  x={tick.position + 3}
                  y={10}
                  fontSize={9}
                  fill="currentColor"
                  opacity={0.7}
                >
                  {tick.label}
                </text>
              )}
            </g>
          ))}
        </svg>
      ) : (
        // Vertical ruler
        <svg 
          width={20} 
          height={length * scale} 
          className="text-muted-foreground"
        >
          {ticks.map((tick, i) => (
            <g key={i}>
              <line
                x1={tick.isMajor ? 0 : 12}
                y1={tick.position}
                x2={20}
                y2={tick.position}
                stroke="currentColor"
                strokeWidth={tick.isMajor ? 1 : 0.5}
                opacity={tick.isMajor ? 0.6 : 0.3}
              />
              {tick.label && (
                <text
                  x={2}
                  y={tick.position + 10}
                  fontSize={9}
                  fill="currentColor"
                  opacity={0.7}
                  writingMode="vertical-rl"
                  textAnchor="start"
                >
                  {tick.label}
                </text>
              )}
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}

interface RulerContainerProps {
  width: number;
  height: number;
  zoom: number;
  children: React.ReactNode;
}

export function RulerContainer({ width, height, zoom, children }: RulerContainerProps) {
  return (
    <div className="relative">
      {/* Corner */}
      <div className="absolute top-0 left-0 w-5 h-5 bg-muted/50 border-r border-b z-10" />
      
      {/* Horizontal ruler */}
      <div className="absolute top-0 left-5">
        <Ruler orientation="horizontal" length={width} zoom={zoom} />
      </div>
      
      {/* Vertical ruler */}
      <div className="absolute top-5 left-0">
        <Ruler orientation="vertical" length={height} zoom={zoom} />
      </div>
      
      {/* Content with offset */}
      <div className="pl-5 pt-5">
        {children}
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Horizontal ruler shows pixel markers
- [ ] Vertical ruler shows pixel markers
- [ ] Major ticks every 100px with labels
- [ ] Minor ticks every 10px
- [ ] Rulers scale with zoom

---

### Task 7: Create Device Frame Component

**Description:** Create visual device frame with bezel styling.

**Files:**
- CREATE: `src/components/studio/features/device-frame.tsx`

**Code:**

```typescript
// src/components/studio/features/device-frame.tsx
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { DevicePreset } from '@/lib/studio/data/device-presets';

interface DeviceFrameProps {
  preset?: DevicePreset;
  width: number;
  height: number;
  zoom: number;
  children: React.ReactNode;
  className?: string;
}

export function DeviceFrame({ 
  preset, 
  width, 
  height, 
  zoom, 
  children,
  className,
}: DeviceFrameProps) {
  const scale = zoom / 100;
  const isPhone = preset?.category === 'phone';
  const isTablet = preset?.category === 'tablet';
  const showFrame = isPhone || isTablet;
  
  if (!showFrame) {
    // Desktop/laptop - no frame, just shadow
    return (
      <div
        className={cn(
          'bg-background shadow-2xl rounded-lg overflow-hidden',
          className
        )}
        style={{
          width: width * scale,
          height: height * scale,
          transform: `scale(1)`,
          transformOrigin: 'top left',
        }}
      >
        <div
          style={{
            width: width,
            height: height,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {children}
        </div>
      </div>
    );
  }
  
  // Phone or tablet frame
  const borderRadius = preset?.borderRadius || 40;
  const bezelWidth = isPhone ? 12 : 16;
  const frameWidth = width + bezelWidth * 2;
  const frameHeight = height + bezelWidth * 2;
  
  return (
    <div
      className={cn('relative', className)}
      style={{
        width: frameWidth * scale,
        height: frameHeight * scale,
      }}
    >
      {/* Device bezel */}
      <div
        className="absolute inset-0 bg-gray-900 shadow-2xl"
        style={{
          borderRadius: (borderRadius + bezelWidth) * scale,
        }}
      />
      
      {/* Screen area */}
      <div
        className="absolute bg-background overflow-hidden"
        style={{
          top: bezelWidth * scale,
          left: bezelWidth * scale,
          width: width * scale,
          height: height * scale,
          borderRadius: borderRadius * scale,
        }}
      >
        {/* Status bar for phones */}
        {isPhone && (
          <div 
            className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-1"
            style={{
              height: 44 * scale,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.05), transparent)',
            }}
          >
            <span className="text-xs font-medium" style={{ fontSize: 12 * scale }}>
              9:41
            </span>
            
            {/* Notch or Dynamic Island */}
            {preset?.hasNotch && (
              <div
                className="absolute left-1/2 -translate-x-1/2 bg-black rounded-b-xl"
                style={{
                  width: 150 * scale,
                  height: 30 * scale,
                }}
              />
            )}
            {preset?.hasDynamicIsland && (
              <div
                className="absolute left-1/2 -translate-x-1/2 top-2 bg-black rounded-full"
                style={{
                  width: 120 * scale,
                  height: 34 * scale,
                }}
              />
            )}
            
            <div className="flex items-center gap-1">
              <span style={{ fontSize: 12 * scale }}>📶</span>
              <span style={{ fontSize: 12 * scale }}>🔋</span>
            </div>
          </div>
        )}
        
        {/* Home indicator for newer phones */}
        {isPhone && !preset?.hasHomeButton && (
          <div 
            className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-gray-800 rounded-full"
            style={{
              width: 134 * scale,
              height: 5 * scale,
            }}
          />
        )}
        
        {/* Actual content */}
        <div
          className="absolute inset-0 overflow-auto"
          style={{
            top: isPhone ? 44 * scale : 0,
            bottom: isPhone && !preset?.hasHomeButton ? 34 * scale : 0,
          }}
        >
          <div
            style={{
              width: width,
              height: height - (isPhone ? 44 + 34 : 0),
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            {children}
          </div>
        </div>
      </div>
      
      {/* Side buttons (decorative) */}
      {isPhone && (
        <>
          {/* Volume buttons */}
          <div
            className="absolute bg-gray-800 rounded-l"
            style={{
              left: 0,
              top: 100 * scale,
              width: 3 * scale,
              height: 30 * scale,
            }}
          />
          <div
            className="absolute bg-gray-800 rounded-l"
            style={{
              left: 0,
              top: 140 * scale,
              width: 3 * scale,
              height: 60 * scale,
            }}
          />
          {/* Power button */}
          <div
            className="absolute bg-gray-800 rounded-r"
            style={{
              right: 0,
              top: 120 * scale,
              width: 3 * scale,
              height: 80 * scale,
            }}
          />
        </>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Phone frame with bezel
- [ ] Notch/Dynamic Island for supported devices
- [ ] Status bar with time
- [ ] Home indicator for newer phones
- [ ] Side buttons decorative
- [ ] Desktop shows shadow only

---

### Task 8: Create Studio Frame Wrapper

**Description:** Wrap the canvas with rulers and device frame based on settings.

**Files:**
- MODIFY: `src/components/studio/core/studio-frame.tsx`

**Code:**

```typescript
// src/components/studio/core/studio-frame.tsx
'use client';

import React, { useRef } from 'react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/lib/studio/store/ui-store';
import { getDevicePreset } from '@/lib/studio/data/device-presets';
import { RulerContainer } from '@/components/studio/features/ruler';
import { DeviceFrame } from '@/components/studio/features/device-frame';

interface StudioFrameProps {
  children: React.ReactNode;
  className?: string;
}

export function StudioFrame({ children, className }: StudioFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    viewportWidth,
    viewportHeight,
    zoom,
    showDeviceFrame,
    showRuler,
    selectedDeviceId,
  } = useUIStore();
  
  const devicePreset = getDevicePreset(selectedDeviceId);
  
  const content = showDeviceFrame ? (
    <DeviceFrame
      preset={devicePreset}
      width={viewportWidth}
      height={viewportHeight}
      zoom={zoom}
    >
      {children}
    </DeviceFrame>
  ) : (
    <div
      className="bg-background shadow-lg rounded-lg overflow-hidden"
      style={{
        width: viewportWidth * (zoom / 100),
        height: viewportHeight * (zoom / 100),
      }}
    >
      <div
        style={{
          width: viewportWidth,
          height: viewportHeight,
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  );
  
  return (
    <div
      ref={containerRef}
      className={cn(
        'flex-1 overflow-auto',
        'bg-[repeating-conic-gradient(hsl(var(--muted))_0%_25%,transparent_0%_50%)]',
        'bg-[length:20px_20px]',
        className
      )}
    >
      <div className="min-h-full flex items-start justify-center p-8">
        {showRuler ? (
          <RulerContainer
            width={viewportWidth}
            height={viewportHeight}
            zoom={zoom}
          >
            {content}
          </RulerContainer>
        ) : (
          content
        )}
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Canvas shows checkered background
- [ ] Device frame wraps canvas when enabled
- [ ] Ruler shows when enabled
- [ ] Canvas centered in viewport
- [ ] Zoom applied correctly

---

### Task 9: Update Toolbar with Responsive Controls

**Description:** Add responsive controls to the studio toolbar.

**Files:**
- MODIFY: `src/components/studio/layout/studio-toolbar.tsx`

**Code:**

```typescript
// Add to studio-toolbar.tsx

import { DeviceSelector } from '@/components/studio/features/device-selector';
import { DimensionsInput } from '@/components/studio/features/dimensions-input';
import { ZoomControls } from '@/components/studio/features/zoom-controls';

// In the toolbar JSX, add between breakpoint selector and save button:
<Separator orientation="vertical" className="h-6" />

{/* Device selector */}
<DeviceSelector />

{/* Dimensions input */}
<DimensionsInput />

<Separator orientation="vertical" className="h-6" />

{/* Zoom controls */}
<ZoomControls />

<Separator orientation="vertical" className="h-6" />
```

**Acceptance Criteria:**
- [ ] Device selector in toolbar
- [ ] Dimensions input in toolbar
- [ ] Zoom controls in toolbar
- [ ] Controls properly spaced

---

### Task 10: Add Keyboard Shortcuts for Zoom

**Description:** Add keyboard shortcuts for zoom controls.

**Files:**
- MODIFY: `src/components/studio/studio-editor.tsx`

**Code:**

```typescript
// Add to studio-editor.tsx keyboard shortcuts

import { useUIStore } from '@/lib/studio/store/ui-store';

// Zoom in - Ctrl/Cmd + =
useHotkeys('mod+=', (e) => {
  e.preventDefault();
  useUIStore.getState().zoomIn();
}, []);

// Zoom in (alternative) - Ctrl/Cmd + +
useHotkeys('mod+plus', (e) => {
  e.preventDefault();
  useUIStore.getState().zoomIn();
}, []);

// Zoom out - Ctrl/Cmd + -
useHotkeys('mod+-', (e) => {
  e.preventDefault();
  useUIStore.getState().zoomOut();
}, []);

// Reset zoom - Ctrl/Cmd + 0
useHotkeys('mod+0', (e) => {
  e.preventDefault();
  useUIStore.getState().resetZoom();
}, []);

// Fit to screen - Ctrl/Cmd + 1
useHotkeys('mod+1', (e) => {
  e.preventDefault();
  const container = document.querySelector('[data-canvas-container]');
  if (container) {
    const { clientWidth, clientHeight } = container;
    useUIStore.getState().fitToScreen(clientWidth, clientHeight);
  }
}, []);
```

**Acceptance Criteria:**
- [ ] Ctrl/Cmd + = zooms in
- [ ] Ctrl/Cmd + - zooms out
- [ ] Ctrl/Cmd + 0 resets to 100%
- [ ] Ctrl/Cmd + 1 fits to screen

---

### Task 11: Export Responsive Components

**Description:** Export all responsive preview components.

**Files:**
- MODIFY: `src/components/studio/features/index.ts`

**Code:**

```typescript
// Add to src/components/studio/features/index.ts
export { DeviceSelector } from './device-selector';
export { DimensionsInput } from './dimensions-input';
export { ZoomControls } from './zoom-controls';
export { Ruler, RulerContainer } from './ruler';
export { DeviceFrame } from './device-frame';
```

**Acceptance Criteria:**
- [ ] All components exported

---

## File Summary

| Action | Path | Description |
|--------|------|-------------|
| CREATE | `src/lib/studio/data/device-presets.ts` | Device presets and zoom data |
| MODIFY | `src/lib/studio/store/ui-store.ts` | Add responsive preview state |
| CREATE | `src/components/studio/features/device-selector.tsx` | Device dropdown |
| CREATE | `src/components/studio/features/dimensions-input.tsx` | Width/height inputs |
| CREATE | `src/components/studio/features/zoom-controls.tsx` | Zoom buttons and dropdown |
| CREATE | `src/components/studio/features/ruler.tsx` | Ruler component |
| CREATE | `src/components/studio/features/device-frame.tsx` | Device bezel frame |
| MODIFY | `src/components/studio/core/studio-frame.tsx` | Integrate frame and rulers |
| MODIFY | `src/components/studio/layout/studio-toolbar.tsx` | Add controls to toolbar |
| MODIFY | `src/components/studio/studio-editor.tsx` | Add keyboard shortcuts |
| MODIFY | `src/components/studio/features/index.ts` | Export components |

## Testing Requirements

### Unit Tests
- [ ] getBreakpointFromWidth returns correct breakpoint
- [ ] getDevicePreset finds presets by ID
- [ ] Zoom calculations stay within limits
- [ ] fitToScreen calculates correct zoom

### Integration Tests
- [ ] Device selection updates canvas size
- [ ] Zoom affects canvas scale
- [ ] Breakpoint updates when device changes

### Manual Testing
- [ ] Select various devices and verify dimensions
- [ ] Enter custom width/height
- [ ] Toggle orientation for phones
- [ ] Zoom in/out with buttons
- [ ] Zoom with keyboard shortcuts
- [ ] Enable device frame and verify appearance
- [ ] Enable ruler and verify measurements
- [ ] Fit to screen works

## Dependencies to Install

```bash
# No new dependencies needed
```

## Rollback Plan

1. Remove new files in `src/lib/studio/data/` and `src/components/studio/features/`
2. Revert changes to ui-store.ts
3. Revert changes to studio-toolbar.tsx
4. Revert changes to studio-editor.tsx

## Success Criteria

- [ ] Device preset selector works with 15+ devices
- [ ] Custom width/height input functional
- [ ] Orientation toggle swaps dimensions
- [ ] Zoom controls work (25% to 400%)
- [ ] Zoom keyboard shortcuts work
- [ ] Fit to screen calculates appropriate zoom
- [ ] Device frame shows for phones/tablets
- [ ] Frame includes notch/Dynamic Island
- [ ] Ruler shows with accurate measurements
- [ ] Breakpoint auto-updates based on width
- [ ] Canvas centered with checkered background
