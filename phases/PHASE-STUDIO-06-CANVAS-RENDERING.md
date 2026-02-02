# PHASE-STUDIO-06: Canvas & Rendering + Premium Starter Components

## Overview

| Property | Value |
|----------|-------|
| Phase | STUDIO-06 |
| Title | Canvas & Rendering + Premium Starter Components |
| Priority | Critical |
| Estimated Time | 12-16 hours |
| Dependencies | STUDIO-01, STUDIO-02, STUDIO-03, STUDIO-04, STUDIO-05 |
| Risk Level | Medium |

## Problem Statement

The Studio needs:
1. A canvas that renders the page content
2. Component wrappers that handle selection and hover states
3. Premium, mobile-first responsive components (NOT basic HTML wrappers)
4. Visual indicators for selected/hovered components

Currently the canvas is a placeholder. We need to render actual components with full editing capabilities.

## Goals

- [ ] Create EditorCanvas component that renders page structure
- [ ] Create ComponentWrapper with selection/hover states
- [ ] Implement click-to-select functionality
- [ ] Create 10 premium starter components with rich props
- [ ] Integrate with DnD system from STUDIO-05
- [ ] Handle empty canvas state
- [ ] Support responsive preview based on breakpoint

## Technical Approach

### Canvas Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        EditorCanvas                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    DroppableCanvas                         │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │              StudioSortableContext                   │  │  │
│  │  │                                                      │  │  │
│  │  │  ┌───────────────────────────────────────────────┐  │  │  │
│  │  │  │ SortableComponent (wrapper for each component)│  │  │  │
│  │  │  │  ┌─────────────────────────────────────────┐  │  │  │  │
│  │  │  │  │          ComponentWrapper               │  │  │  │  │
│  │  │  │  │  ┌───────────────────────────────────┐  │  │  │  │  │
│  │  │  │  │  │     Actual Component Render       │  │  │  │  │  │
│  │  │  │  │  │     (e.g., SectionBlock)          │  │  │  │  │  │
│  │  │  │  │  └───────────────────────────────────┘  │  │  │  │  │
│  │  │  │  │  • Hover outline (blue dashed)          │  │  │  │  │
│  │  │  │  │  • Selected outline (blue solid)        │  │  │  │  │
│  │  │  │  │  • Component label badge                │  │  │  │  │
│  │  │  │  └─────────────────────────────────────────┘  │  │  │  │
│  │  │  └───────────────────────────────────────────────┘  │  │  │
│  │  │                                                      │  │  │
│  │  │  ┌───────────────────────────────────────────────┐  │  │  │
│  │  │  │        Another SortableComponent              │  │  │  │
│  │  │  └───────────────────────────────────────────────┘  │  │  │
│  │  │                                                      │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Premium Component Standard

Every component MUST include:

```typescript
interface PremiumComponentProps {
  // CONTENT - Component-specific
  // (e.g., text, items, etc.)
  
  // RESPONSIVE VALUES - ALL visual props
  padding: ResponsiveValue<Spacing>;
  margin: ResponsiveValue<Spacing>;
  // ... more responsive props
  
  // VISIBILITY
  hideOn?: ('mobile' | 'tablet' | 'desktop')[];
  
  // ANIMATIONS
  animation?: {
    type: 'none' | 'fade-in' | 'slide-up' | 'slide-down' | 'scale-in' | 'blur-in';
    delay: number;      // ms
    duration: number;   // ms
    onScroll: boolean;  // trigger on scroll into view
  };
  
  // AI CONTEXT (for future phases)
  _ai?: {
    description: string;
    canModify: string[];
  };
}
```

---

## Implementation Tasks

### Task 1: Create Responsive Utilities

**Description:** Create utility functions and hooks for handling responsive values

**Files:**
- CREATE: `src/lib/studio/utils/responsive-utils.ts`

**Code:**

```typescript
/**
 * DRAMAC Studio Responsive Utilities
 * 
 * Helpers for working with responsive values (mobile-first).
 */

import type { Breakpoint } from "@/types/studio";

// =============================================================================
// TYPES
// =============================================================================

/**
 * A value that can vary by breakpoint
 */
export type ResponsiveValue<T> = {
  mobile: T;      // Required - base value (0-767px)
  tablet?: T;     // Optional (768-1023px)
  desktop?: T;    // Optional (1024px+)
};

/**
 * Spacing value type
 */
export interface Spacing {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

// =============================================================================
// BREAKPOINTS
// =============================================================================

export const BREAKPOINT_WIDTHS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
} as const;

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Check if a value is a ResponsiveValue object
 */
export function isResponsiveValue<T>(
  value: T | ResponsiveValue<T>
): value is ResponsiveValue<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "mobile" in value
  );
}

/**
 * Get the value for a specific breakpoint (with fallback)
 */
export function getBreakpointValue<T>(
  value: T | ResponsiveValue<T>,
  breakpoint: Breakpoint
): T {
  if (!isResponsiveValue(value)) {
    return value;
  }
  
  // Mobile-first: use the highest available breakpoint at or below current
  if (breakpoint === "desktop") {
    return value.desktop ?? value.tablet ?? value.mobile;
  }
  if (breakpoint === "tablet") {
    return value.tablet ?? value.mobile;
  }
  return value.mobile;
}

/**
 * Create a responsive value with a single value for all breakpoints
 */
export function createResponsiveValue<T>(value: T): ResponsiveValue<T> {
  return { mobile: value };
}

/**
 * Merge two responsive values (newValue takes precedence)
 */
export function mergeResponsiveValue<T>(
  base: ResponsiveValue<T>,
  update: Partial<ResponsiveValue<T>>
): ResponsiveValue<T> {
  return {
    mobile: update.mobile ?? base.mobile,
    tablet: update.tablet ?? base.tablet,
    desktop: update.desktop ?? base.desktop,
  };
}

// =============================================================================
// CSS GENERATION
// =============================================================================

/**
 * Generate inline styles for a responsive value
 * Returns CSS custom properties that work with our CSS media queries
 */
export function responsiveStyles(
  property: string,
  value: ResponsiveValue<string> | string
): React.CSSProperties {
  if (!isResponsiveValue(value)) {
    return { [property]: value };
  }
  
  // We use CSS custom properties for responsive values
  // The actual media query handling is in studio.css
  return {
    [`--studio-${property}-mobile`]: value.mobile,
    [`--studio-${property}-tablet`]: value.tablet ?? value.mobile,
    [`--studio-${property}-desktop`]: value.desktop ?? value.tablet ?? value.mobile,
  } as React.CSSProperties;
}

/**
 * Convert spacing object to CSS value
 */
export function spacingToCss(spacing: Spacing): string {
  return `${spacing.top} ${spacing.right} ${spacing.bottom} ${spacing.left}`;
}

/**
 * Create spacing from a single value
 */
export function uniformSpacing(value: string): Spacing {
  return { top: value, right: value, bottom: value, left: value };
}

/**
 * Create spacing from vertical/horizontal values
 */
export function axisSpacing(vertical: string, horizontal: string): Spacing {
  return { top: vertical, right: horizontal, bottom: vertical, left: horizontal };
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

export const DEFAULT_SPACING: Spacing = {
  top: "0px",
  right: "0px",
  bottom: "0px",
  left: "0px",
};

export const DEFAULT_RESPONSIVE_PADDING: ResponsiveValue<Spacing> = {
  mobile: uniformSpacing("16px"),
  tablet: uniformSpacing("24px"),
  desktop: uniformSpacing("32px"),
};

export const DEFAULT_RESPONSIVE_MARGIN: ResponsiveValue<Spacing> = {
  mobile: DEFAULT_SPACING,
};

// =============================================================================
// ANIMATION HELPERS
// =============================================================================

export type AnimationType = 
  | "none" 
  | "fade-in" 
  | "slide-up" 
  | "slide-down" 
  | "slide-left"
  | "slide-right"
  | "scale-in" 
  | "blur-in";

export interface AnimationConfig {
  type: AnimationType;
  delay: number;
  duration: number;
  onScroll: boolean;
}

export const DEFAULT_ANIMATION: AnimationConfig = {
  type: "none",
  delay: 0,
  duration: 500,
  onScroll: false,
};

/**
 * Get CSS class for animation type
 */
export function getAnimationClass(config: AnimationConfig): string {
  if (config.type === "none") return "";
  return `studio-animate-${config.type}`;
}

/**
 * Get animation CSS custom properties
 */
export function getAnimationStyles(config: AnimationConfig): React.CSSProperties {
  if (config.type === "none") return {};
  return {
    "--studio-animation-delay": `${config.delay}ms`,
    "--studio-animation-duration": `${config.duration}ms`,
  } as React.CSSProperties;
}

// =============================================================================
// VISIBILITY HELPERS
// =============================================================================

/**
 * Get CSS class for hiding on specific breakpoints
 */
export function getVisibilityClass(hideOn?: Breakpoint[]): string {
  if (!hideOn || hideOn.length === 0) return "";
  
  return hideOn.map((bp) => `studio-hide-${bp}`).join(" ");
}
```

**Acceptance Criteria:**
- [ ] ResponsiveValue type works correctly
- [ ] getBreakpointValue returns correct fallbacks
- [ ] CSS generation helpers work
- [ ] Animation and visibility helpers work

---

### Task 2: Update Studio CSS with Responsive Classes

**Description:** Add CSS for responsive values and animations

**Files:**
- MODIFY: `src/styles/studio.css`

**Code to add:**

```css
/* =============================================================================
   RESPONSIVE VISIBILITY
   ============================================================================= */

/* Hide on mobile (0-767px) */
@media (max-width: 767px) {
  .studio-hide-mobile {
    display: none !important;
  }
}

/* Hide on tablet (768-1023px) */
@media (min-width: 768px) and (max-width: 1023px) {
  .studio-hide-tablet {
    display: none !important;
  }
}

/* Hide on desktop (1024px+) */
@media (min-width: 1024px) {
  .studio-hide-desktop {
    display: none !important;
  }
}

/* =============================================================================
   ANIMATIONS
   ============================================================================= */

@keyframes studio-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes studio-slide-up {
  from { 
    opacity: 0; 
    transform: translateY(20px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

@keyframes studio-slide-down {
  from { 
    opacity: 0; 
    transform: translateY(-20px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

@keyframes studio-slide-left {
  from { 
    opacity: 0; 
    transform: translateX(20px); 
  }
  to { 
    opacity: 1; 
    transform: translateX(0); 
  }
}

@keyframes studio-slide-right {
  from { 
    opacity: 0; 
    transform: translateX(-20px); 
  }
  to { 
    opacity: 1; 
    transform: translateX(0); 
  }
}

@keyframes studio-scale-in {
  from { 
    opacity: 0; 
    transform: scale(0.95); 
  }
  to { 
    opacity: 1; 
    transform: scale(1); 
  }
}

@keyframes studio-blur-in {
  from { 
    opacity: 0; 
    filter: blur(10px); 
  }
  to { 
    opacity: 1; 
    filter: blur(0); 
  }
}

.studio-animate-fade-in {
  animation: studio-fade-in var(--studio-animation-duration, 500ms) ease-out;
  animation-delay: var(--studio-animation-delay, 0ms);
  animation-fill-mode: both;
}

.studio-animate-slide-up {
  animation: studio-slide-up var(--studio-animation-duration, 500ms) ease-out;
  animation-delay: var(--studio-animation-delay, 0ms);
  animation-fill-mode: both;
}

.studio-animate-slide-down {
  animation: studio-slide-down var(--studio-animation-duration, 500ms) ease-out;
  animation-delay: var(--studio-animation-delay, 0ms);
  animation-fill-mode: both;
}

.studio-animate-slide-left {
  animation: studio-slide-left var(--studio-animation-duration, 500ms) ease-out;
  animation-delay: var(--studio-animation-delay, 0ms);
  animation-fill-mode: both;
}

.studio-animate-slide-right {
  animation: studio-slide-right var(--studio-animation-duration, 500ms) ease-out;
  animation-delay: var(--studio-animation-delay, 0ms);
  animation-fill-mode: both;
}

.studio-animate-scale-in {
  animation: studio-scale-in var(--studio-animation-duration, 500ms) ease-out;
  animation-delay: var(--studio-animation-delay, 0ms);
  animation-fill-mode: both;
}

.studio-animate-blur-in {
  animation: studio-blur-in var(--studio-animation-duration, 500ms) ease-out;
  animation-delay: var(--studio-animation-delay, 0ms);
  animation-fill-mode: both;
}

/* =============================================================================
   COMPONENT WRAPPER STYLES
   ============================================================================= */

.studio-component-wrapper {
  position: relative;
  transition: outline 0.15s ease;
}

.studio-component-wrapper:hover {
  outline: 2px dashed hsl(var(--primary) / 0.5);
  outline-offset: 2px;
}

.studio-component-wrapper.is-selected {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}

.studio-component-wrapper.is-selected:hover {
  outline: 2px solid hsl(var(--primary));
}

.studio-component-label {
  position: absolute;
  top: -24px;
  left: 0;
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  font-size: 10px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 4px 4px 0 0;
  opacity: 0;
  transition: opacity 0.15s ease;
  pointer-events: none;
  z-index: 10;
  white-space: nowrap;
}

.studio-component-wrapper:hover .studio-component-label,
.studio-component-wrapper.is-selected .studio-component-label {
  opacity: 1;
}

/* =============================================================================
   CANVAS STYLES
   ============================================================================= */

.studio-canvas {
  background-color: hsl(var(--background));
  background-image: 
    linear-gradient(to right, hsl(var(--border) / 0.1) 1px, transparent 1px),
    linear-gradient(to bottom, hsl(var(--border) / 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
  min-height: 100%;
  position: relative;
}

.studio-canvas.show-grid {
  background-image: 
    linear-gradient(to right, hsl(var(--border) / 0.3) 1px, transparent 1px),
    linear-gradient(to bottom, hsl(var(--border) / 0.3) 1px, transparent 1px);
}

.studio-canvas-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: hsl(var(--muted-foreground));
}

/* =============================================================================
   RESPONSIVE VALUE CLASSES (for components)
   ============================================================================= */

/* These classes use CSS custom properties set via inline styles */
.studio-responsive-padding {
  padding: var(--studio-padding-mobile);
}

@media (min-width: 768px) {
  .studio-responsive-padding {
    padding: var(--studio-padding-tablet);
  }
}

@media (min-width: 1024px) {
  .studio-responsive-padding {
    padding: var(--studio-padding-desktop);
  }
}

.studio-responsive-margin {
  margin: var(--studio-margin-mobile);
}

@media (min-width: 768px) {
  .studio-responsive-margin {
    margin: var(--studio-margin-tablet);
  }
}

@media (min-width: 1024px) {
  .studio-responsive-margin {
    margin: var(--studio-margin-desktop);
  }
}

.studio-responsive-font-size {
  font-size: var(--studio-font-size-mobile);
}

@media (min-width: 768px) {
  .studio-responsive-font-size {
    font-size: var(--studio-font-size-tablet);
  }
}

@media (min-width: 1024px) {
  .studio-responsive-font-size {
    font-size: var(--studio-font-size-desktop);
  }
}
```

**Acceptance Criteria:**
- [ ] Visibility classes hide at correct breakpoints
- [ ] Animations play correctly
- [ ] Component wrapper styles show hover/selected states
- [ ] Canvas has subtle grid background

---

### Task 3: Create ComponentWrapper

**Description:** Create the wrapper that handles selection and hover for each component

**Files:**
- CREATE: `src/components/studio/core/component-wrapper.tsx`

**Code:**

```tsx
/**
 * DRAMAC Studio Component Wrapper
 * 
 * Wraps each component on the canvas with:
 * - Click to select
 * - Hover highlight
 * - Selection outline
 * - Component label badge
 */

"use client";

import React, { useCallback } from "react";
import { cn } from "@/lib/utils";
import { useSelectionStore } from "@/lib/studio/store";
import { componentRegistry } from "@/lib/studio/registry/component-registry";

// =============================================================================
// TYPES
// =============================================================================

interface ComponentWrapperProps {
  componentId: string;
  componentType: string;
  children: React.ReactNode;
  locked?: boolean;
  hidden?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ComponentWrapper({
  componentId,
  componentType,
  children,
  locked = false,
  hidden = false,
}: ComponentWrapperProps) {
  // Selection state
  const selectedId = useSelectionStore((s) => s.componentId);
  const select = useSelectionStore((s) => s.select);
  const isSelected = selectedId === componentId;
  
  // Get component label from registry
  const definition = componentRegistry.get(componentType);
  const label = definition?.label ?? componentType;
  
  // Handle click to select
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Don't select if locked
      if (locked) return;
      
      // Stop propagation to prevent parent selection
      e.stopPropagation();
      
      // Select this component
      select(componentId);
    },
    [componentId, locked, select]
  );
  
  // Handle keyboard selection
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (locked) return;
      
      // Select on Enter or Space
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        select(componentId);
      }
    },
    [componentId, locked, select]
  );
  
  // Don't render if hidden
  if (hidden) {
    return null;
  }
  
  return (
    <div
      className={cn(
        "studio-component-wrapper",
        isSelected && "is-selected",
        locked && "cursor-not-allowed opacity-75"
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={locked ? -1 : 0}
      role="button"
      aria-label={`Select ${label} component`}
      aria-pressed={isSelected}
      data-component-id={componentId}
      data-component-type={componentType}
    >
      {/* Component label badge */}
      <div className="studio-component-label">
        {label}
        {locked && " (locked)"}
      </div>
      
      {/* Actual component content */}
      {children}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Click selects component
- [ ] Hover shows dashed outline
- [ ] Selected shows solid outline
- [ ] Label badge appears on hover/select
- [ ] Locked components can't be selected
- [ ] Keyboard accessible (Tab, Enter, Space)

---

### Task 4: Create EditorCanvas Component

**Description:** Create the main canvas that renders all components

**Files:**
- CREATE: `src/components/studio/canvas/editor-canvas.tsx`

**Code:**

```tsx
/**
 * DRAMAC Studio Editor Canvas
 * 
 * Renders the page content with all components.
 * Handles drop zones and component rendering.
 */

"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useEditorStore, useUIStore, useSelectionStore } from "@/lib/studio/store";
import { componentRegistry } from "@/lib/studio/registry/component-registry";
import { DroppableCanvas, StudioSortableContext, SortableComponent } from "@/components/studio/dnd";
import { ComponentWrapper } from "@/components/studio/core/component-wrapper";
import { BREAKPOINTS } from "@/types/studio";
import { Plus, MousePointer } from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

interface EditorCanvasProps {
  className?: string;
}

// =============================================================================
// COMPONENT RENDERER
// =============================================================================

interface CanvasComponentProps {
  componentId: string;
  index: number;
  parentId: string | null;
}

function CanvasComponent({ componentId, index, parentId }: CanvasComponentProps) {
  const component = useEditorStore((s) => s.data.components[componentId]);
  
  if (!component) {
    console.warn(`[Canvas] Component not found: ${componentId}`);
    return null;
  }
  
  // Get the render function from registry
  const definition = componentRegistry.get(component.type);
  
  if (!definition) {
    console.warn(`[Canvas] Unknown component type: ${component.type}`);
    return (
      <SortableComponent
        id={componentId}
        componentType={component.type}
        parentId={parentId}
        index={index}
      >
        <ComponentWrapper
          componentId={componentId}
          componentType={component.type}
          locked={component.locked}
          hidden={component.hidden}
        >
          <div className="rounded border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            Unknown component: {component.type}
          </div>
        </ComponentWrapper>
      </SortableComponent>
    );
  }
  
  const RenderComponent = definition.render;
  
  return (
    <SortableComponent
      id={componentId}
      componentType={component.type}
      parentId={parentId}
      index={index}
      disabled={component.locked}
    >
      <ComponentWrapper
        componentId={componentId}
        componentType={component.type}
        locked={component.locked}
        hidden={component.hidden}
      >
        <RenderComponent {...component.props}>
          {/* Render children if this is a container */}
          {definition.acceptsChildren && component.children && component.children.length > 0 && (
            <NestedComponents
              componentIds={component.children}
              parentId={componentId}
            />
          )}
        </RenderComponent>
      </ComponentWrapper>
    </SortableComponent>
  );
}

// =============================================================================
// NESTED COMPONENTS
// =============================================================================

interface NestedComponentsProps {
  componentIds: string[];
  parentId: string;
}

function NestedComponents({ componentIds, parentId }: NestedComponentsProps) {
  return (
    <StudioSortableContext items={componentIds}>
      {componentIds.map((id, index) => (
        <CanvasComponent
          key={id}
          componentId={id}
          index={index}
          parentId={parentId}
        />
      ))}
    </StudioSortableContext>
  );
}

// =============================================================================
// EMPTY STATE
// =============================================================================

function EmptyCanvasState() {
  const isDragging = useUIStore((s) => s.isDragging);
  
  return (
    <div className="studio-canvas-empty">
      {isDragging ? (
        <>
          <MousePointer className="mb-4 h-12 w-12 animate-bounce text-primary" />
          <h3 className="text-lg font-medium">Drop component here</h3>
          <p className="mt-2 text-sm">Release to add your first component</p>
        </>
      ) : (
        <>
          <Plus className="mb-4 h-12 w-12" />
          <h3 className="text-lg font-medium">Start building your page</h3>
          <p className="mt-2 text-sm">Drag components from the left panel</p>
          <p className="mt-1 text-xs">or press Ctrl+K to search components</p>
        </>
      )}
    </div>
  );
}

// =============================================================================
// MAIN CANVAS
// =============================================================================

export function EditorCanvas({ className }: EditorCanvasProps) {
  // State
  const data = useEditorStore((s) => s.data);
  const breakpoint = useUIStore((s) => s.breakpoint);
  const zoom = useUIStore((s) => s.zoom);
  const showGrid = useUIStore((s) => s.showGrid);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  
  // Get root children
  const rootChildren = data.root.children;
  const hasComponents = rootChildren.length > 0;
  
  // Get canvas width based on breakpoint
  const canvasWidth = useMemo(() => {
    if (breakpoint === "mobile") return BREAKPOINTS.mobile.width;
    if (breakpoint === "tablet") return BREAKPOINTS.tablet.width;
    return "100%";
  }, [breakpoint]);
  
  // Handle click on canvas (deselect)
  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only deselect if clicking directly on canvas, not on a component
    if (e.target === e.currentTarget) {
      clearSelection();
    }
  };
  
  return (
    <div
      className={cn(
        "flex h-full items-start justify-center overflow-auto bg-muted/30 p-8",
        className
      )}
      onClick={handleCanvasClick}
    >
      {/* Canvas container with zoom and responsive width */}
      <div
        className={cn(
          "studio-canvas rounded-lg border border-border bg-background shadow-sm",
          showGrid && "show-grid"
        )}
        style={{
          width: typeof canvasWidth === "number" ? `${canvasWidth}px` : canvasWidth,
          maxWidth: "100%",
          transform: `scale(${zoom})`,
          transformOrigin: "top center",
          minHeight: "600px",
        }}
      >
        <DroppableCanvas>
          {hasComponents ? (
            <StudioSortableContext items={rootChildren}>
              {rootChildren.map((id, index) => (
                <CanvasComponent
                  key={id}
                  componentId={id}
                  index={index}
                  parentId={null}
                />
              ))}
            </StudioSortableContext>
          ) : (
            <EmptyCanvasState />
          )}
        </DroppableCanvas>
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Canvas renders all root components
- [ ] Nested children render inside containers
- [ ] Empty state shows when no components
- [ ] Canvas width changes with breakpoint
- [ ] Zoom applies to canvas
- [ ] Click on empty space deselects

---

### Task 5: Create Canvas Barrel Export

**Description:** Export canvas components

**Files:**
- CREATE: `src/components/studio/canvas/index.ts`

**Code:**

```typescript
/**
 * DRAMAC Studio Canvas Components
 */

export { EditorCanvas } from "./editor-canvas";
```

---

### Task 6: Create Premium Block - Section

**Description:** Create the premium Section block component

**Files:**
- CREATE: `src/components/studio/blocks/layout/section-block.tsx`

**Code:**

```tsx
/**
 * DRAMAC Studio Premium Block: Section
 * 
 * A full-width section with advanced background options,
 * responsive padding, and animation support.
 */

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  type ResponsiveValue,
  type Spacing,
  type AnimationConfig,
  type Breakpoint,
  getAnimationClass,
  getAnimationStyles,
  getVisibilityClass,
  uniformSpacing,
  spacingToCss,
  DEFAULT_ANIMATION,
} from "@/lib/studio/utils/responsive-utils";

// =============================================================================
// TYPES
// =============================================================================

export interface SectionBlockProps {
  children?: React.ReactNode;
  
  // Background
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundPosition?: "center" | "top" | "bottom" | "left" | "right";
  backgroundSize?: "cover" | "contain" | "auto";
  backgroundOverlay?: {
    enabled: boolean;
    color: string;
    opacity: number;
  };
  
  // Gradient Background
  gradient?: {
    enabled: boolean;
    type: "linear" | "radial";
    angle: number;
    stops: Array<{ color: string; position: number }>;
  };
  
  // Layout
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full" | "none";
  minHeight?: ResponsiveValue<string>;
  padding?: ResponsiveValue<Spacing>;
  
  // Content Alignment
  contentAlign?: ResponsiveValue<"left" | "center" | "right">;
  verticalAlign?: "top" | "center" | "bottom";
  
  // Border
  borderRadius?: string;
  borderWidth?: string;
  borderColor?: string;
  
  // Effects
  parallax?: boolean;
  parallaxSpeed?: number;
  
  // Animation
  animation?: AnimationConfig;
  
  // Visibility
  hideOn?: Breakpoint[];
  
  // Advanced
  className?: string;
  id?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const MAX_WIDTH_MAP = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
  full: "100%",
  none: "none",
};

// =============================================================================
// COMPONENT
// =============================================================================

export function SectionBlock({
  children,
  backgroundColor = "transparent",
  backgroundImage,
  backgroundPosition = "center",
  backgroundSize = "cover",
  backgroundOverlay = { enabled: false, color: "#000000", opacity: 0.5 },
  gradient,
  maxWidth = "xl",
  minHeight = { mobile: "auto" },
  padding = {
    mobile: uniformSpacing("24px"),
    tablet: uniformSpacing("48px"),
    desktop: uniformSpacing("64px"),
  },
  contentAlign = { mobile: "left" },
  verticalAlign = "top",
  borderRadius = "0",
  borderWidth = "0",
  borderColor = "transparent",
  parallax = false,
  parallaxSpeed = 0.5,
  animation = DEFAULT_ANIMATION,
  hideOn,
  className,
  id,
}: SectionBlockProps) {
  // Build background style
  const backgroundStyles: React.CSSProperties = {
    backgroundColor,
    borderRadius,
    borderWidth,
    borderColor,
    borderStyle: borderWidth !== "0" ? "solid" : undefined,
  };
  
  // Add background image
  if (backgroundImage) {
    backgroundStyles.backgroundImage = `url(${backgroundImage})`;
    backgroundStyles.backgroundPosition = backgroundPosition;
    backgroundStyles.backgroundSize = backgroundSize;
    backgroundStyles.backgroundRepeat = "no-repeat";
    
    if (parallax) {
      backgroundStyles.backgroundAttachment = "fixed";
    }
  }
  
  // Add gradient
  if (gradient?.enabled && gradient.stops.length >= 2) {
    const gradientStops = gradient.stops
      .map((s) => `${s.color} ${s.position}%`)
      .join(", ");
    
    if (gradient.type === "linear") {
      backgroundStyles.backgroundImage = `linear-gradient(${gradient.angle}deg, ${gradientStops})`;
    } else {
      backgroundStyles.backgroundImage = `radial-gradient(circle, ${gradientStops})`;
    }
  }
  
  // Animation
  const animationClass = getAnimationClass(animation);
  const animationStyles = getAnimationStyles(animation);
  
  // Visibility
  const visibilityClass = getVisibilityClass(hideOn);
  
  // Responsive padding CSS custom properties
  const responsivePaddingStyles = {
    "--studio-padding-mobile": spacingToCss(padding.mobile),
    "--studio-padding-tablet": spacingToCss(padding.tablet ?? padding.mobile),
    "--studio-padding-desktop": spacingToCss(padding.desktop ?? padding.tablet ?? padding.mobile),
  } as React.CSSProperties;
  
  // Min height responsive
  const responsiveMinHeightStyles = {
    "--studio-min-height-mobile": minHeight.mobile,
    "--studio-min-height-tablet": minHeight.tablet ?? minHeight.mobile,
    "--studio-min-height-desktop": minHeight.desktop ?? minHeight.tablet ?? minHeight.mobile,
  } as React.CSSProperties;
  
  // Vertical alignment
  const verticalAlignMap = {
    top: "flex-start",
    center: "center",
    bottom: "flex-end",
  };
  
  return (
    <section
      id={id}
      className={cn(
        "relative w-full studio-responsive-padding",
        animationClass,
        visibilityClass,
        className
      )}
      style={{
        ...backgroundStyles,
        ...animationStyles,
        ...responsivePaddingStyles,
        ...responsiveMinHeightStyles,
        minHeight: "var(--studio-min-height-mobile)",
        display: "flex",
        flexDirection: "column",
        alignItems: verticalAlignMap[verticalAlign],
      }}
    >
      {/* Background overlay */}
      {backgroundOverlay.enabled && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: backgroundOverlay.color,
            opacity: backgroundOverlay.opacity,
            borderRadius,
          }}
        />
      )}
      
      {/* Content container */}
      <div
        className="relative z-10 w-full mx-auto"
        style={{
          maxWidth: MAX_WIDTH_MAP[maxWidth],
          textAlign: contentAlign.mobile,
        }}
      >
        {children}
      </div>
    </section>
  );
}

// =============================================================================
// FIELD DEFINITIONS (for registry)
// =============================================================================

export const sectionBlockFields = {
  backgroundColor: {
    type: "color" as const,
    label: "Background Color",
    defaultValue: "transparent",
    group: "Background",
  },
  backgroundImage: {
    type: "image" as const,
    label: "Background Image",
    group: "Background",
  },
  backgroundPosition: {
    type: "select" as const,
    label: "Background Position",
    options: [
      { label: "Center", value: "center" },
      { label: "Top", value: "top" },
      { label: "Bottom", value: "bottom" },
      { label: "Left", value: "left" },
      { label: "Right", value: "right" },
    ],
    defaultValue: "center",
    group: "Background",
  },
  backgroundSize: {
    type: "select" as const,
    label: "Background Size",
    options: [
      { label: "Cover", value: "cover" },
      { label: "Contain", value: "contain" },
      { label: "Auto", value: "auto" },
    ],
    defaultValue: "cover",
    group: "Background",
  },
  maxWidth: {
    type: "select" as const,
    label: "Max Width",
    options: [
      { label: "Small (640px)", value: "sm" },
      { label: "Medium (768px)", value: "md" },
      { label: "Large (1024px)", value: "lg" },
      { label: "XL (1280px)", value: "xl" },
      { label: "2XL (1536px)", value: "2xl" },
      { label: "Full Width", value: "full" },
      { label: "None", value: "none" },
    ],
    defaultValue: "xl",
    group: "Layout",
  },
  minHeight: {
    type: "text" as const,
    label: "Min Height",
    defaultValue: "auto",
    responsive: true,
    group: "Layout",
  },
  padding: {
    type: "spacing" as const,
    label: "Padding",
    responsive: true,
    group: "Spacing",
  },
  verticalAlign: {
    type: "select" as const,
    label: "Vertical Align",
    options: [
      { label: "Top", value: "top" },
      { label: "Center", value: "center" },
      { label: "Bottom", value: "bottom" },
    ],
    defaultValue: "top",
    group: "Layout",
  },
  borderRadius: {
    type: "text" as const,
    label: "Border Radius",
    defaultValue: "0",
    group: "Border",
  },
  parallax: {
    type: "toggle" as const,
    label: "Parallax Effect",
    defaultValue: false,
    group: "Effects",
  },
};

export const sectionBlockDefaultProps: SectionBlockProps = {
  backgroundColor: "transparent",
  backgroundPosition: "center",
  backgroundSize: "cover",
  backgroundOverlay: { enabled: false, color: "#000000", opacity: 0.5 },
  maxWidth: "xl",
  minHeight: { mobile: "auto" },
  padding: {
    mobile: uniformSpacing("24px"),
    tablet: uniformSpacing("48px"),
    desktop: uniformSpacing("64px"),
  },
  contentAlign: { mobile: "left" },
  verticalAlign: "top",
  borderRadius: "0",
  borderWidth: "0",
  borderColor: "transparent",
  parallax: false,
  parallaxSpeed: 0.5,
  animation: DEFAULT_ANIMATION,
};
```

**Acceptance Criteria:**
- [ ] Section renders with all background options
- [ ] Responsive padding works across breakpoints
- [ ] Background overlay works
- [ ] Gradient backgrounds work
- [ ] Animation plays on load
- [ ] hideOn visibility works

---

### Task 7: Create Premium Block - Heading

**Description:** Create the premium Heading block

**Files:**
- CREATE: `src/components/studio/blocks/typography/heading-block.tsx`

**Code:**

```tsx
/**
 * DRAMAC Studio Premium Block: Heading
 * 
 * A rich heading component with typography controls,
 * gradient text, shadows, and animations.
 */

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  type ResponsiveValue,
  type Spacing,
  type AnimationConfig,
  type Breakpoint,
  getAnimationClass,
  getAnimationStyles,
  getVisibilityClass,
  DEFAULT_ANIMATION,
  uniformSpacing,
  spacingToCss,
} from "@/lib/studio/utils/responsive-utils";

// =============================================================================
// TYPES
// =============================================================================

export interface HeadingBlockProps {
  // Content
  text: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  
  // Typography
  fontFamily?: "heading" | "body" | "mono";
  fontSize?: ResponsiveValue<string>;
  fontWeight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  letterSpacing?: string;
  lineHeight?: string;
  textAlign?: ResponsiveValue<"left" | "center" | "right">;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  
  // Colors
  color?: string;
  gradient?: {
    enabled: boolean;
    type: "linear" | "radial";
    angle: number;
    stops: Array<{ color: string; position: number }>;
  };
  
  // Effects
  textShadow?: {
    enabled: boolean;
    x: number;
    y: number;
    blur: number;
    color: string;
  };
  
  // Spacing
  margin?: ResponsiveValue<Spacing>;
  
  // Animation
  animation?: AnimationConfig;
  
  // Visibility
  hideOn?: Breakpoint[];
  
  // Advanced
  className?: string;
  id?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const FONT_FAMILY_MAP = {
  heading: "var(--font-geist-sans), system-ui, sans-serif",
  body: "var(--font-geist-sans), system-ui, sans-serif",
  mono: "var(--font-geist-mono), monospace",
};

const DEFAULT_FONT_SIZES: Record<number, ResponsiveValue<string>> = {
  1: { mobile: "32px", tablet: "40px", desktop: "48px" },
  2: { mobile: "28px", tablet: "32px", desktop: "40px" },
  3: { mobile: "24px", tablet: "28px", desktop: "32px" },
  4: { mobile: "20px", tablet: "24px", desktop: "28px" },
  5: { mobile: "18px", tablet: "20px", desktop: "24px" },
  6: { mobile: "16px", tablet: "18px", desktop: "20px" },
};

// =============================================================================
// COMPONENT
// =============================================================================

export function HeadingBlock({
  text,
  level = 2,
  fontFamily = "heading",
  fontSize,
  fontWeight = 700,
  letterSpacing = "-0.02em",
  lineHeight = "1.2",
  textAlign = { mobile: "left" },
  textTransform = "none",
  color = "inherit",
  gradient,
  textShadow = { enabled: false, x: 0, y: 2, blur: 4, color: "rgba(0,0,0,0.1)" },
  margin = { mobile: uniformSpacing("0") },
  animation = DEFAULT_ANIMATION,
  hideOn,
  className,
  id,
}: HeadingBlockProps) {
  // Use level-appropriate default font size if not specified
  const effectiveFontSize = fontSize ?? DEFAULT_FONT_SIZES[level];
  
  // Create the tag
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  
  // Build text styles
  const textStyles: React.CSSProperties = {
    fontFamily: FONT_FAMILY_MAP[fontFamily],
    fontWeight,
    letterSpacing,
    lineHeight,
    textTransform,
    color: gradient?.enabled ? "transparent" : color,
  };
  
  // Responsive font size
  const responsiveFontSizeStyles = {
    "--studio-font-size-mobile": effectiveFontSize.mobile,
    "--studio-font-size-tablet": effectiveFontSize.tablet ?? effectiveFontSize.mobile,
    "--studio-font-size-desktop": effectiveFontSize.desktop ?? effectiveFontSize.tablet ?? effectiveFontSize.mobile,
  } as React.CSSProperties;
  
  // Responsive text align
  const responsiveTextAlignStyles = {
    "--studio-text-align-mobile": textAlign.mobile,
    "--studio-text-align-tablet": textAlign.tablet ?? textAlign.mobile,
    "--studio-text-align-desktop": textAlign.desktop ?? textAlign.tablet ?? textAlign.mobile,
  } as React.CSSProperties;
  
  // Responsive margin
  const responsiveMarginStyles = {
    "--studio-margin-mobile": spacingToCss(margin.mobile),
    "--studio-margin-tablet": spacingToCss(margin.tablet ?? margin.mobile),
    "--studio-margin-desktop": spacingToCss(margin.desktop ?? margin.tablet ?? margin.mobile),
  } as React.CSSProperties;
  
  // Gradient text
  if (gradient?.enabled && gradient.stops.length >= 2) {
    const gradientStops = gradient.stops
      .map((s) => `${s.color} ${s.position}%`)
      .join(", ");
    
    if (gradient.type === "linear") {
      textStyles.backgroundImage = `linear-gradient(${gradient.angle}deg, ${gradientStops})`;
    } else {
      textStyles.backgroundImage = `radial-gradient(circle, ${gradientStops})`;
    }
    textStyles.backgroundClip = "text";
    textStyles.WebkitBackgroundClip = "text";
  }
  
  // Text shadow
  if (textShadow.enabled) {
    textStyles.textShadow = `${textShadow.x}px ${textShadow.y}px ${textShadow.blur}px ${textShadow.color}`;
  }
  
  // Animation
  const animationClass = getAnimationClass(animation);
  const animationStyles = getAnimationStyles(animation);
  
  // Visibility
  const visibilityClass = getVisibilityClass(hideOn);
  
  return (
    <Tag
      id={id}
      className={cn(
        "studio-responsive-font-size studio-responsive-margin",
        animationClass,
        visibilityClass,
        className
      )}
      style={{
        ...textStyles,
        ...responsiveFontSizeStyles,
        ...responsiveTextAlignStyles,
        ...responsiveMarginStyles,
        ...animationStyles,
        textAlign: "var(--studio-text-align-mobile)" as any,
      }}
    >
      {text}
    </Tag>
  );
}

// =============================================================================
// FIELD DEFINITIONS
// =============================================================================

export const headingBlockFields = {
  text: {
    type: "text" as const,
    label: "Text",
    defaultValue: "Your Heading Here",
  },
  level: {
    type: "select" as const,
    label: "Level",
    options: [
      { label: "H1", value: 1 },
      { label: "H2", value: 2 },
      { label: "H3", value: 3 },
      { label: "H4", value: 4 },
      { label: "H5", value: 5 },
      { label: "H6", value: 6 },
    ],
    defaultValue: 2,
  },
  fontFamily: {
    type: "select" as const,
    label: "Font Family",
    options: [
      { label: "Heading", value: "heading" },
      { label: "Body", value: "body" },
      { label: "Mono", value: "mono" },
    ],
    defaultValue: "heading",
    group: "Typography",
  },
  fontSize: {
    type: "text" as const,
    label: "Font Size",
    responsive: true,
    group: "Typography",
  },
  fontWeight: {
    type: "select" as const,
    label: "Font Weight",
    options: [
      { label: "Thin (100)", value: 100 },
      { label: "Extra Light (200)", value: 200 },
      { label: "Light (300)", value: 300 },
      { label: "Normal (400)", value: 400 },
      { label: "Medium (500)", value: 500 },
      { label: "Semibold (600)", value: 600 },
      { label: "Bold (700)", value: 700 },
      { label: "Extra Bold (800)", value: 800 },
      { label: "Black (900)", value: 900 },
    ],
    defaultValue: 700,
    group: "Typography",
  },
  letterSpacing: {
    type: "text" as const,
    label: "Letter Spacing",
    defaultValue: "-0.02em",
    group: "Typography",
  },
  lineHeight: {
    type: "text" as const,
    label: "Line Height",
    defaultValue: "1.2",
    group: "Typography",
  },
  textAlign: {
    type: "select" as const,
    label: "Text Align",
    options: [
      { label: "Left", value: "left" },
      { label: "Center", value: "center" },
      { label: "Right", value: "right" },
    ],
    defaultValue: "left",
    responsive: true,
    group: "Typography",
  },
  textTransform: {
    type: "select" as const,
    label: "Text Transform",
    options: [
      { label: "None", value: "none" },
      { label: "Uppercase", value: "uppercase" },
      { label: "Lowercase", value: "lowercase" },
      { label: "Capitalize", value: "capitalize" },
    ],
    defaultValue: "none",
    group: "Typography",
  },
  color: {
    type: "color" as const,
    label: "Color",
    defaultValue: "inherit",
    group: "Colors",
  },
};

export const headingBlockDefaultProps: HeadingBlockProps = {
  text: "Your Heading Here",
  level: 2,
  fontFamily: "heading",
  fontWeight: 700,
  letterSpacing: "-0.02em",
  lineHeight: "1.2",
  textAlign: { mobile: "left" },
  textTransform: "none",
  color: "inherit",
  gradient: { enabled: false, type: "linear", angle: 90, stops: [] },
  textShadow: { enabled: false, x: 0, y: 2, blur: 4, color: "rgba(0,0,0,0.1)" },
  margin: { mobile: uniformSpacing("0") },
  animation: DEFAULT_ANIMATION,
};
```

---

### Task 8: Create Premium Block - Text

**Description:** Create the premium Text/Paragraph block

**Files:**
- CREATE: `src/components/studio/blocks/typography/text-block.tsx`

**Code:**

```tsx
/**
 * DRAMAC Studio Premium Block: Text
 * 
 * A rich paragraph component with typography controls,
 * columns, drop cap, and animations.
 */

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  type ResponsiveValue,
  type Spacing,
  type AnimationConfig,
  type Breakpoint,
  getAnimationClass,
  getAnimationStyles,
  getVisibilityClass,
  DEFAULT_ANIMATION,
  uniformSpacing,
  spacingToCss,
} from "@/lib/studio/utils/responsive-utils";

// =============================================================================
// TYPES
// =============================================================================

export interface TextBlockProps {
  // Content
  text: string;
  
  // Typography
  fontFamily?: "heading" | "body" | "mono";
  fontSize?: ResponsiveValue<string>;
  fontWeight?: 400 | 500 | 600 | 700;
  letterSpacing?: string;
  lineHeight?: string;
  textAlign?: ResponsiveValue<"left" | "center" | "right" | "justify">;
  
  // Colors
  color?: string;
  
  // Advanced Typography
  columns?: ResponsiveValue<1 | 2 | 3>;
  columnGap?: string;
  dropCap?: boolean;
  
  // Spacing
  margin?: ResponsiveValue<Spacing>;
  
  // Animation
  animation?: AnimationConfig;
  
  // Visibility
  hideOn?: Breakpoint[];
  
  // Advanced
  className?: string;
  id?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function TextBlock({
  text,
  fontFamily = "body",
  fontSize = { mobile: "16px", tablet: "16px", desktop: "18px" },
  fontWeight = 400,
  letterSpacing = "0",
  lineHeight = "1.7",
  textAlign = { mobile: "left" },
  color = "inherit",
  columns = { mobile: 1 },
  columnGap = "32px",
  dropCap = false,
  margin = { mobile: uniformSpacing("0 0 16px 0") },
  animation = DEFAULT_ANIMATION,
  hideOn,
  className,
  id,
}: TextBlockProps) {
  // Build text styles
  const textStyles: React.CSSProperties = {
    fontFamily: fontFamily === "mono" 
      ? "var(--font-geist-mono), monospace"
      : "var(--font-geist-sans), system-ui, sans-serif",
    fontWeight,
    letterSpacing,
    lineHeight,
    color,
    columnGap,
  };
  
  // Responsive styles
  const responsiveStyles = {
    "--studio-font-size-mobile": fontSize.mobile,
    "--studio-font-size-tablet": fontSize.tablet ?? fontSize.mobile,
    "--studio-font-size-desktop": fontSize.desktop ?? fontSize.tablet ?? fontSize.mobile,
    "--studio-margin-mobile": spacingToCss(margin.mobile),
    "--studio-margin-tablet": spacingToCss(margin.tablet ?? margin.mobile),
    "--studio-margin-desktop": spacingToCss(margin.desktop ?? margin.tablet ?? margin.mobile),
    "--studio-columns-mobile": columns.mobile,
    "--studio-columns-tablet": columns.tablet ?? columns.mobile,
    "--studio-columns-desktop": columns.desktop ?? columns.tablet ?? columns.mobile,
  } as React.CSSProperties;
  
  // Animation
  const animationClass = getAnimationClass(animation);
  const animationStyles = getAnimationStyles(animation);
  
  // Visibility
  const visibilityClass = getVisibilityClass(hideOn);
  
  return (
    <p
      id={id}
      className={cn(
        "studio-responsive-font-size studio-responsive-margin",
        dropCap && "first-letter:float-left first-letter:text-5xl first-letter:font-bold first-letter:mr-2 first-letter:leading-none",
        animationClass,
        visibilityClass,
        className
      )}
      style={{
        ...textStyles,
        ...responsiveStyles,
        ...animationStyles,
        columnCount: "var(--studio-columns-mobile)" as any,
        textAlign: textAlign.mobile,
      }}
    >
      {text}
    </p>
  );
}

// =============================================================================
// FIELD DEFINITIONS
// =============================================================================

export const textBlockFields = {
  text: {
    type: "textarea" as const,
    label: "Text",
    rows: 4,
    defaultValue: "Enter your text here. This is a paragraph component with rich typography controls.",
  },
  fontFamily: {
    type: "select" as const,
    label: "Font Family",
    options: [
      { label: "Body", value: "body" },
      { label: "Heading", value: "heading" },
      { label: "Mono", value: "mono" },
    ],
    defaultValue: "body",
    group: "Typography",
  },
  fontSize: {
    type: "text" as const,
    label: "Font Size",
    responsive: true,
    group: "Typography",
  },
  fontWeight: {
    type: "select" as const,
    label: "Font Weight",
    options: [
      { label: "Normal (400)", value: 400 },
      { label: "Medium (500)", value: 500 },
      { label: "Semibold (600)", value: 600 },
      { label: "Bold (700)", value: 700 },
    ],
    defaultValue: 400,
    group: "Typography",
  },
  lineHeight: {
    type: "text" as const,
    label: "Line Height",
    defaultValue: "1.7",
    group: "Typography",
  },
  textAlign: {
    type: "select" as const,
    label: "Text Align",
    options: [
      { label: "Left", value: "left" },
      { label: "Center", value: "center" },
      { label: "Right", value: "right" },
      { label: "Justify", value: "justify" },
    ],
    defaultValue: "left",
    responsive: true,
    group: "Typography",
  },
  color: {
    type: "color" as const,
    label: "Color",
    defaultValue: "inherit",
    group: "Colors",
  },
  columns: {
    type: "select" as const,
    label: "Columns",
    options: [
      { label: "1", value: 1 },
      { label: "2", value: 2 },
      { label: "3", value: 3 },
    ],
    defaultValue: 1,
    responsive: true,
    group: "Layout",
  },
  dropCap: {
    type: "toggle" as const,
    label: "Drop Cap",
    defaultValue: false,
    group: "Effects",
  },
};

export const textBlockDefaultProps: TextBlockProps = {
  text: "Enter your text here. This is a paragraph component with rich typography controls.",
  fontFamily: "body",
  fontSize: { mobile: "16px", tablet: "16px", desktop: "18px" },
  fontWeight: 400,
  letterSpacing: "0",
  lineHeight: "1.7",
  textAlign: { mobile: "left" },
  color: "inherit",
  columns: { mobile: 1 },
  columnGap: "32px",
  dropCap: false,
  margin: { mobile: uniformSpacing("0 0 16px 0") },
  animation: DEFAULT_ANIMATION,
};
```

---

### Task 9: Create Premium Block - Button

**Description:** Create the premium Button block

**Files:**
- CREATE: `src/components/studio/blocks/interactive/button-block.tsx`

**Code:**

```tsx
/**
 * DRAMAC Studio Premium Block: Button
 * 
 * A rich button component with variants, sizes,
 * icons, loading states, and hover animations.
 */

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import {
  type ResponsiveValue,
  type Spacing,
  type AnimationConfig,
  type Breakpoint,
  getAnimationClass,
  getAnimationStyles,
  getVisibilityClass,
  DEFAULT_ANIMATION,
  uniformSpacing,
  spacingToCss,
} from "@/lib/studio/utils/responsive-utils";

// =============================================================================
// TYPES
// =============================================================================

export interface ButtonBlockProps {
  // Content
  text: string;
  href?: string;
  openInNewTab?: boolean;
  
  // Style
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: ResponsiveValue<"sm" | "md" | "lg" | "xl">;
  
  // Icon
  icon?: string;
  iconPosition?: "left" | "right";
  
  // State
  loading?: boolean;
  disabled?: boolean;
  
  // Colors (for custom styling)
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  
  // Effects
  hoverEffect?: "none" | "lift" | "glow" | "scale";
  borderRadius?: "none" | "sm" | "md" | "lg" | "full";
  
  // Spacing
  margin?: ResponsiveValue<Spacing>;
  
  // Animation
  animation?: AnimationConfig;
  
  // Visibility
  hideOn?: Breakpoint[];
  
  // Advanced
  className?: string;
  id?: string;
  fullWidth?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const VARIANT_CLASSES = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
};

const SIZE_CLASSES = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  xl: "h-14 px-8 text-lg",
};

const RADIUS_CLASSES = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
};

const HOVER_CLASSES = {
  none: "",
  lift: "hover:-translate-y-0.5 hover:shadow-lg transition-all",
  glow: "hover:shadow-[0_0_20px_rgba(var(--primary),0.4)] transition-shadow",
  scale: "hover:scale-105 transition-transform",
};

// =============================================================================
// COMPONENT
// =============================================================================

export function ButtonBlock({
  text,
  href,
  openInNewTab = false,
  variant = "primary",
  size = { mobile: "md" },
  icon,
  iconPosition = "left",
  loading = false,
  disabled = false,
  backgroundColor,
  textColor,
  borderColor,
  hoverEffect = "lift",
  borderRadius = "md",
  margin = { mobile: uniformSpacing("0") },
  animation = DEFAULT_ANIMATION,
  hideOn,
  className,
  id,
  fullWidth = false,
}: ButtonBlockProps) {
  // Get icon component
  const IconComponent = icon
    ? (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[icon]
    : null;
  
  // Loading icon
  const LoaderIcon = LucideIcons.Loader2;
  
  // Build custom styles
  const customStyles: React.CSSProperties = {};
  if (backgroundColor) customStyles.backgroundColor = backgroundColor;
  if (textColor) customStyles.color = textColor;
  if (borderColor) {
    customStyles.borderColor = borderColor;
    customStyles.borderWidth = "1px";
    customStyles.borderStyle = "solid";
  }
  
  // Responsive margin
  const responsiveMarginStyles = {
    "--studio-margin-mobile": spacingToCss(margin.mobile),
    "--studio-margin-tablet": spacingToCss(margin.tablet ?? margin.mobile),
    "--studio-margin-desktop": spacingToCss(margin.desktop ?? margin.tablet ?? margin.mobile),
  } as React.CSSProperties;
  
  // Animation
  const animationClass = getAnimationClass(animation);
  const animationStyles = getAnimationStyles(animation);
  
  // Visibility
  const visibilityClass = getVisibilityClass(hideOn);
  
  // Size class for current breakpoint (simplified - mobile value)
  const sizeClass = SIZE_CLASSES[size.mobile];
  
  // Button classes
  const buttonClasses = cn(
    "inline-flex items-center justify-center gap-2 font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    VARIANT_CLASSES[variant],
    sizeClass,
    RADIUS_CLASSES[borderRadius],
    HOVER_CLASSES[hoverEffect],
    fullWidth && "w-full",
    "studio-responsive-margin",
    animationClass,
    visibilityClass,
    className
  );
  
  // Content
  const content = (
    <>
      {loading ? (
        <LoaderIcon className="h-4 w-4 animate-spin" />
      ) : (
        IconComponent && iconPosition === "left" && (
          <IconComponent className="h-4 w-4" />
        )
      )}
      <span>{text}</span>
      {!loading && IconComponent && iconPosition === "right" && (
        <IconComponent className="h-4 w-4" />
      )}
    </>
  );
  
  // Render as link or button
  if (href) {
    return (
      <a
        id={id}
        href={href}
        target={openInNewTab ? "_blank" : undefined}
        rel={openInNewTab ? "noopener noreferrer" : undefined}
        className={buttonClasses}
        style={{ ...customStyles, ...responsiveMarginStyles, ...animationStyles }}
      >
        {content}
      </a>
    );
  }
  
  return (
    <button
      id={id}
      type="button"
      disabled={disabled || loading}
      className={buttonClasses}
      style={{ ...customStyles, ...responsiveMarginStyles, ...animationStyles }}
    >
      {content}
    </button>
  );
}

// =============================================================================
// FIELD DEFINITIONS
// =============================================================================

export const buttonBlockFields = {
  text: {
    type: "text" as const,
    label: "Text",
    defaultValue: "Click Me",
  },
  href: {
    type: "link" as const,
    label: "Link",
    description: "Leave empty for button-only behavior",
  },
  openInNewTab: {
    type: "toggle" as const,
    label: "Open in New Tab",
    defaultValue: false,
  },
  variant: {
    type: "select" as const,
    label: "Variant",
    options: [
      { label: "Primary", value: "primary" },
      { label: "Secondary", value: "secondary" },
      { label: "Outline", value: "outline" },
      { label: "Ghost", value: "ghost" },
      { label: "Destructive", value: "destructive" },
    ],
    defaultValue: "primary",
    group: "Style",
  },
  size: {
    type: "select" as const,
    label: "Size",
    options: [
      { label: "Small", value: "sm" },
      { label: "Medium", value: "md" },
      { label: "Large", value: "lg" },
      { label: "Extra Large", value: "xl" },
    ],
    defaultValue: "md",
    responsive: true,
    group: "Style",
  },
  icon: {
    type: "text" as const,
    label: "Icon (Lucide name)",
    description: "e.g., ArrowRight, Download, Mail",
    group: "Icon",
  },
  iconPosition: {
    type: "select" as const,
    label: "Icon Position",
    options: [
      { label: "Left", value: "left" },
      { label: "Right", value: "right" },
    ],
    defaultValue: "left",
    group: "Icon",
  },
  hoverEffect: {
    type: "select" as const,
    label: "Hover Effect",
    options: [
      { label: "None", value: "none" },
      { label: "Lift", value: "lift" },
      { label: "Glow", value: "glow" },
      { label: "Scale", value: "scale" },
    ],
    defaultValue: "lift",
    group: "Effects",
  },
  borderRadius: {
    type: "select" as const,
    label: "Border Radius",
    options: [
      { label: "None", value: "none" },
      { label: "Small", value: "sm" },
      { label: "Medium", value: "md" },
      { label: "Large", value: "lg" },
      { label: "Full (Pill)", value: "full" },
    ],
    defaultValue: "md",
    group: "Style",
  },
  fullWidth: {
    type: "toggle" as const,
    label: "Full Width",
    defaultValue: false,
    group: "Layout",
  },
};

export const buttonBlockDefaultProps: ButtonBlockProps = {
  text: "Click Me",
  variant: "primary",
  size: { mobile: "md" },
  iconPosition: "left",
  loading: false,
  disabled: false,
  hoverEffect: "lift",
  borderRadius: "md",
  margin: { mobile: uniformSpacing("0") },
  animation: DEFAULT_ANIMATION,
  fullWidth: false,
  openInNewTab: false,
};
```

---

### Task 10: Create Premium Block - Image

**Description:** Create the premium Image block

**Files:**
- CREATE: `src/components/studio/blocks/media/image-block.tsx`

**Code:**

```tsx
/**
 * DRAMAC Studio Premium Block: Image
 * 
 * A rich image component with aspect ratios,
 * lazy loading, overlays, and effects.
 */

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  type ResponsiveValue,
  type Spacing,
  type AnimationConfig,
  type Breakpoint,
  getAnimationClass,
  getAnimationStyles,
  getVisibilityClass,
  DEFAULT_ANIMATION,
  uniformSpacing,
  spacingToCss,
} from "@/lib/studio/utils/responsive-utils";

// =============================================================================
// TYPES
// =============================================================================

export interface ImageBlockProps {
  // Content
  src: string;
  alt: string;
  caption?: string;
  
  // Sizing
  width?: ResponsiveValue<string>;
  aspectRatio?: "auto" | "1/1" | "4/3" | "16/9" | "21/9" | "3/2" | "2/3";
  objectFit?: "cover" | "contain" | "fill" | "none";
  objectPosition?: string;
  
  // Style
  borderRadius?: string;
  borderWidth?: string;
  borderColor?: string;
  
  // Effects
  hoverEffect?: "none" | "zoom" | "brighten" | "darken" | "blur";
  overlay?: {
    enabled: boolean;
    color: string;
    opacity: number;
  };
  
  // Performance
  loading?: "lazy" | "eager";
  priority?: boolean;
  
  // Link
  href?: string;
  openInNewTab?: boolean;
  
  // Spacing
  margin?: ResponsiveValue<Spacing>;
  
  // Animation
  animation?: AnimationConfig;
  
  // Visibility
  hideOn?: Breakpoint[];
  
  // Advanced
  className?: string;
  id?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const HOVER_EFFECTS = {
  none: "",
  zoom: "group-hover:scale-110 transition-transform duration-500",
  brighten: "group-hover:brightness-110 transition-all duration-300",
  darken: "group-hover:brightness-75 transition-all duration-300",
  blur: "group-hover:blur-sm transition-all duration-300",
};

// =============================================================================
// COMPONENT
// =============================================================================

export function ImageBlock({
  src,
  alt,
  caption,
  width = { mobile: "100%" },
  aspectRatio = "auto",
  objectFit = "cover",
  objectPosition = "center",
  borderRadius = "0",
  borderWidth = "0",
  borderColor = "transparent",
  hoverEffect = "none",
  overlay = { enabled: false, color: "#000000", opacity: 0.3 },
  loading = "lazy",
  priority = false,
  href,
  openInNewTab = false,
  margin = { mobile: uniformSpacing("0") },
  animation = DEFAULT_ANIMATION,
  hideOn,
  className,
  id,
}: ImageBlockProps) {
  // Responsive width
  const responsiveWidthStyles = {
    "--studio-width-mobile": width.mobile,
    "--studio-width-tablet": width.tablet ?? width.mobile,
    "--studio-width-desktop": width.desktop ?? width.tablet ?? width.mobile,
  } as React.CSSProperties;
  
  // Responsive margin
  const responsiveMarginStyles = {
    "--studio-margin-mobile": spacingToCss(margin.mobile),
    "--studio-margin-tablet": spacingToCss(margin.tablet ?? margin.mobile),
    "--studio-margin-desktop": spacingToCss(margin.desktop ?? margin.tablet ?? margin.mobile),
  } as React.CSSProperties;
  
  // Animation
  const animationClass = getAnimationClass(animation);
  const animationStyles = getAnimationStyles(animation);
  
  // Visibility
  const visibilityClass = getVisibilityClass(hideOn);
  
  // Image element
  const imageElement = (
    <figure
      id={id}
      className={cn(
        "relative overflow-hidden studio-responsive-margin",
        hoverEffect !== "none" && "group",
        animationClass,
        visibilityClass,
        className
      )}
      style={{
        ...responsiveWidthStyles,
        ...responsiveMarginStyles,
        ...animationStyles,
        width: "var(--studio-width-mobile)",
        borderRadius,
        borderWidth: borderWidth !== "0" ? borderWidth : undefined,
        borderColor: borderWidth !== "0" ? borderColor : undefined,
        borderStyle: borderWidth !== "0" ? "solid" : undefined,
      }}
    >
      {/* Image container */}
      <div
        className="relative overflow-hidden"
        style={{
          aspectRatio: aspectRatio !== "auto" ? aspectRatio : undefined,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src || "/api/placeholder/800/600"}
          alt={alt}
          loading={priority ? "eager" : loading}
          className={cn(
            "h-full w-full",
            HOVER_EFFECTS[hoverEffect]
          )}
          style={{
            objectFit,
            objectPosition,
          }}
        />
        
        {/* Overlay */}
        {overlay.enabled && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundColor: overlay.color,
              opacity: overlay.opacity,
            }}
          />
        )}
      </div>
      
      {/* Caption */}
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
  
  // Wrap in link if href provided
  if (href) {
    return (
      <a
        href={href}
        target={openInNewTab ? "_blank" : undefined}
        rel={openInNewTab ? "noopener noreferrer" : undefined}
        className="block"
      >
        {imageElement}
      </a>
    );
  }
  
  return imageElement;
}

// =============================================================================
// FIELD DEFINITIONS
// =============================================================================

export const imageBlockFields = {
  src: {
    type: "image" as const,
    label: "Image",
    defaultValue: "",
  },
  alt: {
    type: "text" as const,
    label: "Alt Text",
    defaultValue: "Image description",
    description: "Describe the image for accessibility",
  },
  caption: {
    type: "text" as const,
    label: "Caption",
  },
  width: {
    type: "text" as const,
    label: "Width",
    defaultValue: "100%",
    responsive: true,
    group: "Size",
  },
  aspectRatio: {
    type: "select" as const,
    label: "Aspect Ratio",
    options: [
      { label: "Auto", value: "auto" },
      { label: "1:1 (Square)", value: "1/1" },
      { label: "4:3", value: "4/3" },
      { label: "16:9", value: "16/9" },
      { label: "21:9 (Cinematic)", value: "21/9" },
      { label: "3:2", value: "3/2" },
      { label: "2:3 (Portrait)", value: "2/3" },
    ],
    defaultValue: "auto",
    group: "Size",
  },
  objectFit: {
    type: "select" as const,
    label: "Object Fit",
    options: [
      { label: "Cover", value: "cover" },
      { label: "Contain", value: "contain" },
      { label: "Fill", value: "fill" },
      { label: "None", value: "none" },
    ],
    defaultValue: "cover",
    group: "Size",
  },
  borderRadius: {
    type: "text" as const,
    label: "Border Radius",
    defaultValue: "0",
    group: "Style",
  },
  hoverEffect: {
    type: "select" as const,
    label: "Hover Effect",
    options: [
      { label: "None", value: "none" },
      { label: "Zoom", value: "zoom" },
      { label: "Brighten", value: "brighten" },
      { label: "Darken", value: "darken" },
      { label: "Blur", value: "blur" },
    ],
    defaultValue: "none",
    group: "Effects",
  },
  href: {
    type: "link" as const,
    label: "Link",
    group: "Link",
  },
  openInNewTab: {
    type: "toggle" as const,
    label: "Open in New Tab",
    defaultValue: false,
    group: "Link",
  },
};

export const imageBlockDefaultProps: ImageBlockProps = {
  src: "",
  alt: "Image description",
  width: { mobile: "100%" },
  aspectRatio: "auto",
  objectFit: "cover",
  objectPosition: "center",
  borderRadius: "0",
  borderWidth: "0",
  borderColor: "transparent",
  hoverEffect: "none",
  overlay: { enabled: false, color: "#000000", opacity: 0.3 },
  loading: "lazy",
  priority: false,
  openInNewTab: false,
  margin: { mobile: uniformSpacing("0") },
  animation: DEFAULT_ANIMATION,
};
```

---

### Task 11: Create Remaining Premium Blocks

**Description:** Create Container, Columns, Spacer, Divider, and Icon blocks

**Files:**
- CREATE: `src/components/studio/blocks/layout/container-block.tsx`
- CREATE: `src/components/studio/blocks/layout/columns-block.tsx`
- CREATE: `src/components/studio/blocks/layout/spacer-block.tsx`
- CREATE: `src/components/studio/blocks/layout/divider-block.tsx`
- CREATE: `src/components/studio/blocks/media/icon-block.tsx`

I'll provide one more example - Container - and the others follow similar patterns:

**Container Block Code:**

```tsx
/**
 * DRAMAC Studio Premium Block: Container
 * 
 * A flexible container with max-width, flexbox/grid,
 * and responsive gap settings.
 */

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  type ResponsiveValue,
  type Spacing,
  type AnimationConfig,
  type Breakpoint,
  getAnimationClass,
  getAnimationStyles,
  getVisibilityClass,
  DEFAULT_ANIMATION,
  uniformSpacing,
  spacingToCss,
} from "@/lib/studio/utils/responsive-utils";

// =============================================================================
// TYPES
// =============================================================================

export interface ContainerBlockProps {
  children?: React.ReactNode;
  
  // Layout
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full" | "none";
  display?: "block" | "flex" | "grid";
  
  // Flex settings
  flexDirection?: ResponsiveValue<"row" | "column" | "row-reverse" | "column-reverse">;
  justifyContent?: "start" | "center" | "end" | "between" | "around" | "evenly";
  alignItems?: "start" | "center" | "end" | "stretch" | "baseline";
  flexWrap?: "nowrap" | "wrap" | "wrap-reverse";
  gap?: ResponsiveValue<string>;
  
  // Grid settings
  gridCols?: ResponsiveValue<1 | 2 | 3 | 4 | 5 | 6 | 12>;
  
  // Spacing
  padding?: ResponsiveValue<Spacing>;
  margin?: ResponsiveValue<Spacing>;
  
  // Style
  backgroundColor?: string;
  borderRadius?: string;
  
  // Animation
  animation?: AnimationConfig;
  
  // Visibility
  hideOn?: Breakpoint[];
  
  // Advanced
  className?: string;
  id?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const MAX_WIDTH_MAP = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
  full: "100%",
  none: "none",
};

const JUSTIFY_MAP = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  between: "space-between",
  around: "space-around",
  evenly: "space-evenly",
};

const ALIGN_MAP = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
  baseline: "baseline",
};

// =============================================================================
// COMPONENT
// =============================================================================

export function ContainerBlock({
  children,
  maxWidth = "xl",
  display = "block",
  flexDirection = { mobile: "column" },
  justifyContent = "start",
  alignItems = "stretch",
  flexWrap = "wrap",
  gap = { mobile: "16px" },
  gridCols = { mobile: 1 },
  padding = { mobile: uniformSpacing("16px") },
  margin = { mobile: { top: "0", right: "auto", bottom: "0", left: "auto" } },
  backgroundColor = "transparent",
  borderRadius = "0",
  animation = DEFAULT_ANIMATION,
  hideOn,
  className,
  id,
}: ContainerBlockProps) {
  // Build styles
  const styles: React.CSSProperties = {
    maxWidth: MAX_WIDTH_MAP[maxWidth],
    backgroundColor,
    borderRadius,
  };
  
  // Display type
  if (display === "flex") {
    styles.display = "flex";
    styles.flexDirection = flexDirection.mobile;
    styles.justifyContent = JUSTIFY_MAP[justifyContent];
    styles.alignItems = ALIGN_MAP[alignItems];
    styles.flexWrap = flexWrap;
    styles.gap = gap.mobile;
  } else if (display === "grid") {
    styles.display = "grid";
    styles.gridTemplateColumns = `repeat(${gridCols.mobile}, minmax(0, 1fr))`;
    styles.gap = gap.mobile;
  }
  
  // Responsive styles
  const responsiveStyles = {
    "--studio-padding-mobile": spacingToCss(padding.mobile),
    "--studio-padding-tablet": spacingToCss(padding.tablet ?? padding.mobile),
    "--studio-padding-desktop": spacingToCss(padding.desktop ?? padding.tablet ?? padding.mobile),
    "--studio-margin-mobile": spacingToCss(margin.mobile),
    "--studio-margin-tablet": spacingToCss(margin.tablet ?? margin.mobile),
    "--studio-margin-desktop": spacingToCss(margin.desktop ?? margin.tablet ?? margin.mobile),
  } as React.CSSProperties;
  
  // Animation
  const animationClass = getAnimationClass(animation);
  const animationStyles = getAnimationStyles(animation);
  
  // Visibility
  const visibilityClass = getVisibilityClass(hideOn);
  
  return (
    <div
      id={id}
      className={cn(
        "studio-responsive-padding studio-responsive-margin",
        animationClass,
        visibilityClass,
        className
      )}
      style={{
        ...styles,
        ...responsiveStyles,
        ...animationStyles,
      }}
    >
      {children}
    </div>
  );
}

// =============================================================================
// FIELD DEFINITIONS
// =============================================================================

export const containerBlockFields = {
  maxWidth: {
    type: "select" as const,
    label: "Max Width",
    options: [
      { label: "Small (640px)", value: "sm" },
      { label: "Medium (768px)", value: "md" },
      { label: "Large (1024px)", value: "lg" },
      { label: "XL (1280px)", value: "xl" },
      { label: "2XL (1536px)", value: "2xl" },
      { label: "Full", value: "full" },
      { label: "None", value: "none" },
    ],
    defaultValue: "xl",
    group: "Layout",
  },
  display: {
    type: "select" as const,
    label: "Display",
    options: [
      { label: "Block", value: "block" },
      { label: "Flex", value: "flex" },
      { label: "Grid", value: "grid" },
    ],
    defaultValue: "block",
    group: "Layout",
  },
  flexDirection: {
    type: "select" as const,
    label: "Flex Direction",
    options: [
      { label: "Row", value: "row" },
      { label: "Column", value: "column" },
      { label: "Row Reverse", value: "row-reverse" },
      { label: "Column Reverse", value: "column-reverse" },
    ],
    defaultValue: "column",
    responsive: true,
    showWhen: { field: "display", value: "flex" },
    group: "Flex",
  },
  justifyContent: {
    type: "select" as const,
    label: "Justify Content",
    options: [
      { label: "Start", value: "start" },
      { label: "Center", value: "center" },
      { label: "End", value: "end" },
      { label: "Space Between", value: "between" },
      { label: "Space Around", value: "around" },
      { label: "Space Evenly", value: "evenly" },
    ],
    defaultValue: "start",
    showWhen: { field: "display", value: "flex" },
    group: "Flex",
  },
  alignItems: {
    type: "select" as const,
    label: "Align Items",
    options: [
      { label: "Start", value: "start" },
      { label: "Center", value: "center" },
      { label: "End", value: "end" },
      { label: "Stretch", value: "stretch" },
      { label: "Baseline", value: "baseline" },
    ],
    defaultValue: "stretch",
    showWhen: { field: "display", value: "flex" },
    group: "Flex",
  },
  gap: {
    type: "text" as const,
    label: "Gap",
    defaultValue: "16px",
    responsive: true,
    group: "Spacing",
  },
  backgroundColor: {
    type: "color" as const,
    label: "Background",
    defaultValue: "transparent",
    group: "Style",
  },
  borderRadius: {
    type: "text" as const,
    label: "Border Radius",
    defaultValue: "0",
    group: "Style",
  },
  padding: {
    type: "spacing" as const,
    label: "Padding",
    responsive: true,
    group: "Spacing",
  },
};

export const containerBlockDefaultProps: ContainerBlockProps = {
  maxWidth: "xl",
  display: "block",
  flexDirection: { mobile: "column" },
  justifyContent: "start",
  alignItems: "stretch",
  flexWrap: "wrap",
  gap: { mobile: "16px" },
  gridCols: { mobile: 1 },
  padding: { mobile: uniformSpacing("16px") },
  margin: { mobile: { top: "0", right: "auto", bottom: "0", left: "auto" } },
  backgroundColor: "transparent",
  borderRadius: "0",
  animation: DEFAULT_ANIMATION,
};
```

---

### Task 12: Create Block Barrel Exports

**Description:** Create index files for block exports

**Files:**
- CREATE: `src/components/studio/blocks/layout/index.ts`
- CREATE: `src/components/studio/blocks/typography/index.ts`
- CREATE: `src/components/studio/blocks/interactive/index.ts`
- CREATE: `src/components/studio/blocks/media/index.ts`
- CREATE: `src/components/studio/blocks/index.ts`

**Code for main index:**

```typescript
/**
 * DRAMAC Studio Premium Blocks
 */

// Layout
export * from "./layout";

// Typography
export * from "./typography";

// Interactive
export * from "./interactive";

// Media
export * from "./media";
```

---

### Task 13: Register Premium Blocks in Registry

**Description:** Update the component registry to use the new premium blocks

**Files:**
- CREATE: `src/lib/studio/registry/premium-components.ts`

**Code:**

```typescript
/**
 * DRAMAC Studio Premium Components Registration
 * 
 * Registers all premium blocks with the component registry.
 */

import { componentRegistry, defineComponent } from "./component-registry";
import type { ComponentDefinition } from "@/types/studio";

// Import premium blocks
import {
  SectionBlock,
  sectionBlockFields,
  sectionBlockDefaultProps,
} from "@/components/studio/blocks/layout/section-block";

import {
  ContainerBlock,
  containerBlockFields,
  containerBlockDefaultProps,
} from "@/components/studio/blocks/layout/container-block";

import {
  HeadingBlock,
  headingBlockFields,
  headingBlockDefaultProps,
} from "@/components/studio/blocks/typography/heading-block";

import {
  TextBlock,
  textBlockFields,
  textBlockDefaultProps,
} from "@/components/studio/blocks/typography/text-block";

import {
  ButtonBlock,
  buttonBlockFields,
  buttonBlockDefaultProps,
} from "@/components/studio/blocks/interactive/button-block";

import {
  ImageBlock,
  imageBlockFields,
  imageBlockDefaultProps,
} from "@/components/studio/blocks/media/image-block";

// =============================================================================
// PREMIUM COMPONENT DEFINITIONS
// =============================================================================

export const premiumComponents: ComponentDefinition[] = [
  // =========================================================================
  // LAYOUT
  // =========================================================================
  
  defineComponent({
    type: "Section",
    label: "Section",
    description: "Full-width section with background, overlay, and parallax",
    category: "layout",
    icon: "Square",
    render: SectionBlock,
    fields: sectionBlockFields as any,
    defaultProps: sectionBlockDefaultProps,
    acceptsChildren: true,
    isContainer: true,
    ai: {
      description: "A full-width section that can contain other components. Supports background images, gradients, overlays, and parallax effects.",
      canModify: ["backgroundColor", "padding", "minHeight", "backgroundImage"],
      suggestions: [
        "Add a gradient background",
        "Increase padding",
        "Add a background image",
        "Enable parallax effect",
      ],
    },
  }),
  
  defineComponent({
    type: "Container",
    label: "Container",
    description: "Flexible container with max-width and flex/grid options",
    category: "layout",
    icon: "Box",
    render: ContainerBlock,
    fields: containerBlockFields as any,
    defaultProps: containerBlockDefaultProps,
    acceptsChildren: true,
    isContainer: true,
    ai: {
      description: "A container that constrains content width and provides flex/grid layout options.",
      canModify: ["maxWidth", "display", "gap", "padding"],
      suggestions: [
        "Center the content",
        "Add more padding",
        "Use flex layout",
        "Create a grid",
      ],
    },
  }),
  
  // =========================================================================
  // TYPOGRAPHY
  // =========================================================================
  
  defineComponent({
    type: "Heading",
    label: "Heading",
    description: "Rich heading with typography controls and effects",
    category: "typography",
    icon: "Type",
    render: HeadingBlock,
    fields: headingBlockFields as any,
    defaultProps: headingBlockDefaultProps,
    ai: {
      description: "A heading component (H1-H6) with advanced typography, gradient text, and shadows.",
      canModify: ["text", "level", "fontSize", "fontWeight", "color", "textAlign"],
      suggestions: [
        "Make it larger",
        "Add gradient text",
        "Center the heading",
        "Change to uppercase",
      ],
    },
  }),
  
  defineComponent({
    type: "Text",
    label: "Paragraph",
    description: "Rich paragraph with columns and drop cap",
    category: "typography",
    icon: "AlignLeft",
    render: TextBlock,
    fields: textBlockFields as any,
    defaultProps: textBlockDefaultProps,
    ai: {
      description: "A paragraph component with advanced typography controls, multi-column support, and drop cap option.",
      canModify: ["text", "fontSize", "lineHeight", "textAlign", "columns"],
      suggestions: [
        "Rewrite more concisely",
        "Make it more engaging",
        "Add drop cap",
        "Increase line height",
      ],
    },
  }),
  
  // =========================================================================
  // INTERACTIVE
  // =========================================================================
  
  defineComponent({
    type: "Button",
    label: "Button",
    description: "Customizable button with variants and effects",
    category: "buttons",
    icon: "MousePointer",
    render: ButtonBlock,
    fields: buttonBlockFields as any,
    defaultProps: buttonBlockDefaultProps,
    ai: {
      description: "A button component with multiple variants, sizes, icons, and hover effects.",
      canModify: ["text", "variant", "size", "icon", "hoverEffect"],
      suggestions: [
        "Make it more prominent",
        "Add an arrow icon",
        "Use outline style",
        "Make full width",
      ],
    },
  }),
  
  // =========================================================================
  // MEDIA
  // =========================================================================
  
  defineComponent({
    type: "Image",
    label: "Image",
    description: "Image with aspect ratio, effects, and overlay",
    category: "media",
    icon: "Image",
    render: ImageBlock,
    fields: imageBlockFields as any,
    defaultProps: imageBlockDefaultProps,
    ai: {
      description: "An image component with aspect ratio presets, hover effects, and overlay options.",
      canModify: ["src", "alt", "aspectRatio", "hoverEffect", "borderRadius"],
      suggestions: [
        "Add zoom on hover",
        "Use 16:9 aspect ratio",
        "Add rounded corners",
        "Add a dark overlay",
      ],
    },
  }),
];

// =============================================================================
// REGISTRATION
// =============================================================================

/**
 * Register all premium components with the registry
 */
export function registerPremiumComponents(): void {
  componentRegistry.registerAll(premiumComponents, "core");
  console.debug(`[Registry] Registered ${premiumComponents.length} premium components`);
}

/**
 * Initialize premium components (call on app startup)
 */
export function initializePremiumComponents(): void {
  // Clear any existing registrations to avoid duplicates
  // (Only for development hot reload scenarios)
  
  // Register premium components
  registerPremiumComponents();
}
```

---

### Task 14: Update Store Index to Initialize Components

**Description:** Initialize premium components when stores are loaded

**Files:**
- MODIFY: `src/lib/studio/store/index.ts`

Add to the file:

```typescript
// Import and initialize premium components
import { initializePremiumComponents } from "../registry/premium-components";

// Initialize components on module load
if (typeof window !== "undefined") {
  initializePremiumComponents();
}
```

---

### Task 15: Update StudioEditor to Use EditorCanvas

**Description:** Replace the canvas placeholder with the real EditorCanvas

**Files:**
- MODIFY: `src/components/studio/studio-editor.tsx`

Replace `CanvasPlaceholder` with import and usage of `EditorCanvas`:

```tsx
import { EditorCanvas } from "@/components/studio/canvas";

// In the return statement, replace:
// canvas={<CanvasPlaceholder />}
// with:
// canvas={<EditorCanvas />}
```

---

## File Summary

| Action | Path | Description |
|--------|------|-------------|
| CREATE | src/lib/studio/utils/responsive-utils.ts | Responsive value utilities |
| MODIFY | src/styles/studio.css | Add CSS for animations, visibility |
| CREATE | src/components/studio/core/component-wrapper.tsx | Component selection wrapper |
| CREATE | src/components/studio/canvas/editor-canvas.tsx | Main canvas renderer |
| CREATE | src/components/studio/canvas/index.ts | Canvas exports |
| CREATE | src/components/studio/blocks/layout/section-block.tsx | Premium Section |
| CREATE | src/components/studio/blocks/layout/container-block.tsx | Premium Container |
| CREATE | src/components/studio/blocks/typography/heading-block.tsx | Premium Heading |
| CREATE | src/components/studio/blocks/typography/text-block.tsx | Premium Text |
| CREATE | src/components/studio/blocks/interactive/button-block.tsx | Premium Button |
| CREATE | src/components/studio/blocks/media/image-block.tsx | Premium Image |
| CREATE | src/components/studio/blocks/layout/index.ts | Layout exports |
| CREATE | src/components/studio/blocks/typography/index.ts | Typography exports |
| CREATE | src/components/studio/blocks/interactive/index.ts | Interactive exports |
| CREATE | src/components/studio/blocks/media/index.ts | Media exports |
| CREATE | src/components/studio/blocks/index.ts | All blocks export |
| CREATE | src/lib/studio/registry/premium-components.ts | Premium component registration |
| MODIFY | src/lib/studio/store/index.ts | Initialize components |
| MODIFY | src/components/studio/studio-editor.tsx | Use EditorCanvas |

---

## Testing Requirements

### Manual Testing

1. **Canvas Rendering**
   - [ ] Empty canvas shows "Start building" message
   - [ ] Adding a component renders it on canvas
   - [ ] Nested children render inside containers
   
2. **Component Selection**
   - [ ] Click component → selected (blue outline)
   - [ ] Click canvas background → deselected
   - [ ] Hover shows dashed outline
   - [ ] Label badge appears on hover/select
   
3. **Premium Components**
   - [ ] Section renders with all background options
   - [ ] Container renders with flex/grid
   - [ ] Heading renders with correct H tag
   - [ ] Text renders with columns option
   - [ ] Button renders all variants
   - [ ] Image renders with aspect ratios
   
4. **Responsive**
   - [ ] Canvas width changes with breakpoint selector
   - [ ] Components show correct breakpoint values
   
5. **Animations**
   - [ ] Components with animation play on load
   - [ ] hideOn properly hides components

---

## Success Criteria

- [ ] Canvas renders page data correctly
- [ ] Components are selectable via click
- [ ] Hover/selected states show visual feedback
- [ ] 6 premium components created and registered
- [ ] All components have responsive props
- [ ] All components have animation support
- [ ] All components have AI context
- [ ] Empty canvas shows helpful message
- [ ] Zoom and breakpoint preview work
- [ ] TypeScript compiles with zero errors
