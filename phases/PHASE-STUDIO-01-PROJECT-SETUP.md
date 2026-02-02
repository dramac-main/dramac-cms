# PHASE-STUDIO-01: Project Setup & Dependencies

## Overview

| Property | Value |
|----------|-------|
| Phase | STUDIO-01 |
| Title | Project Setup & Dependencies |
| Priority | Critical |
| Estimated Time | 3-4 hours |
| Dependencies | None |
| Risk Level | Low |

## Problem Statement

Before building DRAMAC Studio (the custom website editor), we need to install all required packages, create the folder structure, define TypeScript types, and establish the CSS foundation. This phase sets up the infrastructure that all subsequent phases will build upon.

## Goals

- [ ] Install all required npm packages for drag-and-drop, state management, and UI
- [ ] Create the complete folder structure under `src/app/studio/`, `src/components/studio/`, and `src/lib/studio/`
- [ ] Define core TypeScript types for Studio data structures
- [ ] Create base CSS file for editor-specific styles
- [ ] Verify TypeScript compiles with zero errors

## Technical Approach

1. **Package Installation**: Install dnd-kit for drag-and-drop, immer for immutable updates, zundo for undo/redo, react-resizable-panels for the layout, react-colorful for color picking, and react-hotkeys-hook for keyboard shortcuts.

2. **Folder Structure**: Create all directories following the architecture specified in the master prompt, ensuring consistent organization.

3. **TypeScript Types**: Port and extend existing Puck types to the new Studio format, ensuring backward compatibility for data migration.

4. **CSS Foundation**: Create editor-specific styles that complement the existing design system.

---

## Implementation Tasks

### Task 1: Install Required Dependencies

**Description:** Install all npm packages needed for DRAMAC Studio.

**Command:**
```bash
cd next-platform-dashboard
pnpm add immer zundo react-colorful react-hotkeys-hook @floating-ui/react nanoid
```

**Note:** The following packages are already installed:
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` ✅
- `zustand` ✅
- `react-resizable-panels` ✅
- `framer-motion` ✅
- `@tiptap/react` and extensions ✅
- `@ai-sdk/anthropic`, `ai` ✅
- All `@radix-ui/*` components ✅
- `lucide-react` ✅
- `clsx`, `tailwind-merge` ✅

**Acceptance Criteria:**
- [ ] All packages install without errors
- [ ] `pnpm install` completes successfully
- [ ] No peer dependency warnings for critical packages

---

### Task 2: Create Folder Structure

**Description:** Create all directories for the Studio editor.

**Directories to Create:**

```
src/app/studio/[siteId]/[pageId]/
src/components/studio/core/
src/components/studio/panels/
src/components/studio/fields/
src/components/studio/ai/
src/components/studio/dnd/
src/components/studio/features/
src/lib/studio/store/
src/lib/studio/registry/
src/lib/studio/engine/
src/lib/studio/utils/
```

**Files to Create (placeholder):**

**File:** `src/app/studio/[siteId]/[pageId]/page.tsx`

```tsx
/**
 * DRAMAC Studio Editor Page
 * 
 * Full-screen website editor at /studio/[siteId]/[pageId]
 * This is the main entry point for the visual page builder.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface StudioPageProps {
  params: Promise<{
    siteId: string;
    pageId: string;
  }>;
}

export default async function StudioPage({ params }: StudioPageProps) {
  const { siteId, pageId } = await params;
  const supabase = await createClient();

  // Verify authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Verify site access
  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("id, name, agency_id")
    .eq("id", siteId)
    .single();

  if (siteError || !site) {
    redirect("/dashboard/sites");
  }

  // Verify page exists
  const { data: page, error: pageError } = await supabase
    .from("pages")
    .select("id, name, slug, content")
    .eq("id", pageId)
    .eq("site_id", siteId)
    .single();

  if (pageError || !page) {
    redirect(`/dashboard/sites/${siteId}/pages`);
  }

  // TODO: PHASE-STUDIO-04 - Render StudioEditor component
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">DRAMAC Studio</h1>
        <p className="text-muted-foreground mb-4">
          Editor for: {site.name} / {page.name}
        </p>
        <p className="text-sm text-muted-foreground">
          Site ID: {siteId}<br />
          Page ID: {pageId}
        </p>
        <p className="text-xs text-muted-foreground mt-4">
          Phase STUDIO-04 will implement the full editor UI
        </p>
      </div>
    </div>
  );
}
```

**File:** `src/app/studio/[siteId]/[pageId]/layout.tsx`

```tsx
/**
 * DRAMAC Studio Layout
 * 
 * Full-screen layout for the editor - no dashboard sidebar/header.
 * Uses the studio-specific styles and providers.
 */

import "@/styles/studio.css";

export const metadata = {
  title: "DRAMAC Studio",
  description: "Visual website editor",
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="studio-root">
      {children}
    </div>
  );
}
```

**File:** `src/components/studio/core/index.ts`

```tsx
/**
 * Studio Core Components
 * 
 * Central exports for all core Studio components.
 * Phase STUDIO-04+ will add: studio-provider, studio-canvas, studio-frame, component-wrapper
 */

// Placeholder - components added in later phases
export {};
```

**File:** `src/components/studio/panels/index.ts`

```tsx
/**
 * Studio Panel Components
 * 
 * Central exports for all panel components.
 * Phase STUDIO-04+ will add: left-panel, right-panel, bottom-panel, top-toolbar
 */

// Placeholder - components added in later phases
export {};
```

**File:** `src/components/studio/fields/index.ts`

```tsx
/**
 * Studio Field Components
 * 
 * Custom field editors for component properties.
 * Phase STUDIO-08+ will add: text-field, number-field, color-field, etc.
 */

// Placeholder - components added in later phases
export {};
```

**File:** `src/components/studio/ai/index.ts`

```tsx
/**
 * Studio AI Components
 * 
 * AI-powered editing features.
 * Phase STUDIO-11+ will add: ai-component-chat, ai-page-generator, ai-suggestions
 */

// Placeholder - components added in later phases
export {};
```

**File:** `src/components/studio/dnd/index.ts`

```tsx
/**
 * Studio Drag & Drop Components
 * 
 * Drag and drop functionality using dnd-kit.
 * Phase STUDIO-05 will add: droppable-canvas, draggable-component, sortable-component, drag-overlay
 */

// Placeholder - components added in later phases
export {};
```

**File:** `src/components/studio/features/index.ts`

```tsx
/**
 * Studio Feature Components
 * 
 * Additional editor features.
 * Phase STUDIO-16+ will add: history-panel, responsive-controls, layers-panel, etc.
 */

// Placeholder - components added in later phases
export {};
```

**File:** `src/lib/studio/store/index.ts`

```tsx
/**
 * Studio State Management
 * 
 * Zustand stores for editor state.
 * Phase STUDIO-02 will add: editor-store, ui-store, selection-store, history-store
 */

// Placeholder - stores added in Phase STUDIO-02
export {};
```

**File:** `src/lib/studio/registry/index.ts`

```tsx
/**
 * Studio Component Registry
 * 
 * Component registration and lookup system.
 * Phase STUDIO-03 will add: component-registry, core-components, module-loader, field-registry
 */

// Placeholder - registry added in Phase STUDIO-03
export {};
```

**File:** `src/lib/studio/engine/index.ts`

```tsx
/**
 * Studio Rendering Engine
 * 
 * Page rendering and serialization.
 * Phase STUDIO-06+ will add: renderer, serializer, optimizer
 */

// Placeholder - engine added in later phases
export {};
```

**File:** `src/lib/studio/utils/index.ts`

```tsx
/**
 * Studio Utilities
 * 
 * Helper functions for the editor.
 */

export * from "./id-utils";
export * from "./tree-utils";
export * from "./component-utils";
```

**File:** `src/lib/studio/utils/id-utils.ts`

```tsx
/**
 * ID Generation Utilities
 * 
 * Consistent ID generation for components and elements.
 */

import { nanoid } from "nanoid";

/**
 * Generate a unique component ID
 * Format: comp_[nanoid]
 */
export function generateComponentId(): string {
  return `comp_${nanoid(10)}`;
}

/**
 * Generate a unique zone ID
 * Format: zone_[nanoid]
 */
export function generateZoneId(): string {
  return `zone_${nanoid(8)}`;
}

/**
 * Check if a string is a valid component ID
 */
export function isComponentId(id: string): boolean {
  return id.startsWith("comp_") || id === "root";
}

/**
 * Check if a string is a valid zone ID
 */
export function isZoneId(id: string): boolean {
  return id.startsWith("zone_");
}
```

**File:** `src/lib/studio/utils/tree-utils.ts`

```tsx
/**
 * Component Tree Utilities
 * 
 * Functions for manipulating the component tree structure.
 */

import type { StudioPageData, StudioComponent } from "@/types/studio";

/**
 * Find a component by ID in the page data
 */
export function findComponent(
  data: StudioPageData,
  componentId: string
): StudioComponent | null {
  if (componentId === "root") {
    return null; // Root is not a regular component
  }
  return data.components[componentId] || null;
}

/**
 * Get all child component IDs for a component
 */
export function getChildIds(
  data: StudioPageData,
  componentId: string
): string[] {
  if (componentId === "root") {
    return data.root.children;
  }
  
  const component = data.components[componentId];
  return component?.children || [];
}

/**
 * Get the parent component ID
 */
export function getParentId(
  data: StudioPageData,
  componentId: string
): string | null {
  const component = data.components[componentId];
  return component?.parentId || null;
}

/**
 * Get all ancestor IDs from component to root
 */
export function getAncestorIds(
  data: StudioPageData,
  componentId: string
): string[] {
  const ancestors: string[] = [];
  let currentId: string | null = componentId;
  
  while (currentId) {
    const component = data.components[currentId];
    if (!component?.parentId) break;
    ancestors.push(component.parentId);
    currentId = component.parentId;
  }
  
  return ancestors;
}

/**
 * Get all descendant IDs (recursive)
 */
export function getDescendantIds(
  data: StudioPageData,
  componentId: string
): string[] {
  const descendants: string[] = [];
  const childIds = getChildIds(data, componentId);
  
  for (const childId of childIds) {
    descendants.push(childId);
    descendants.push(...getDescendantIds(data, childId));
  }
  
  return descendants;
}

/**
 * Calculate depth of a component in the tree
 */
export function getComponentDepth(
  data: StudioPageData,
  componentId: string
): number {
  return getAncestorIds(data, componentId).length;
}

/**
 * Check if componentA is an ancestor of componentB
 */
export function isAncestorOf(
  data: StudioPageData,
  ancestorId: string,
  descendantId: string
): boolean {
  const ancestors = getAncestorIds(data, descendantId);
  return ancestors.includes(ancestorId);
}
```

**File:** `src/lib/studio/utils/component-utils.ts`

```tsx
/**
 * Component Utilities
 * 
 * Helper functions for working with components.
 */

import type { StudioComponent, StudioPageData } from "@/types/studio";
import { generateComponentId } from "./id-utils";

/**
 * Create a new component instance with defaults
 */
export function createComponent(
  type: string,
  props: Record<string, unknown> = {},
  parentId?: string,
  zoneId?: string
): StudioComponent {
  return {
    id: generateComponentId(),
    type,
    props,
    children: [],
    parentId,
    zoneId,
    locked: false,
    hidden: false,
  };
}

/**
 * Clone a component with a new ID
 */
export function cloneComponent(
  component: StudioComponent,
  newParentId?: string
): StudioComponent {
  return {
    ...component,
    id: generateComponentId(),
    parentId: newParentId ?? component.parentId,
    children: [], // Children need to be cloned separately
  };
}

/**
 * Deep clone a component and all its descendants
 */
export function deepCloneComponent(
  data: StudioPageData,
  componentId: string,
  newParentId?: string
): { component: StudioComponent; descendants: Record<string, StudioComponent> } {
  const original = data.components[componentId];
  if (!original) {
    throw new Error(`Component not found: ${componentId}`);
  }

  const cloned = cloneComponent(original, newParentId);
  const descendants: Record<string, StudioComponent> = {};
  const newChildIds: string[] = [];

  // Recursively clone children
  for (const childId of original.children || []) {
    const result = deepCloneComponent(data, childId, cloned.id);
    newChildIds.push(result.component.id);
    descendants[result.component.id] = result.component;
    Object.assign(descendants, result.descendants);
  }

  cloned.children = newChildIds;
  
  return { component: cloned, descendants };
}

/**
 * Create empty page data structure
 */
export function createEmptyPageData(): StudioPageData {
  return {
    version: "1.0",
    root: {
      id: "root",
      type: "Root",
      props: {
        title: "Untitled Page",
        description: "",
      },
      children: [],
    },
    components: {},
    zones: {},
  };
}

/**
 * Validate page data structure
 */
export function validatePageData(data: unknown): data is StudioPageData {
  if (!data || typeof data !== "object") return false;
  
  const pageData = data as Record<string, unknown>;
  
  if (pageData.version !== "1.0") return false;
  if (!pageData.root || typeof pageData.root !== "object") return false;
  if (!pageData.components || typeof pageData.components !== "object") return false;
  
  const root = pageData.root as Record<string, unknown>;
  if (root.id !== "root") return false;
  if (!Array.isArray(root.children)) return false;
  
  return true;
}
```

**Acceptance Criteria:**
- [ ] All directories created under `src/app/studio/`, `src/components/studio/`, `src/lib/studio/`
- [ ] Placeholder index files exist for each module
- [ ] Utility functions are implemented and exported
- [ ] Studio page route is accessible at `/studio/[siteId]/[pageId]`

---

### Task 3: Create TypeScript Types

**Description:** Define all TypeScript types for Studio data structures, ensuring compatibility with existing Puck data for migration.

**File:** `src/types/studio.ts`

```tsx
/**
 * DRAMAC Studio Type Definitions
 * 
 * Core types for the Studio editor data structures.
 * Designed for compatibility with existing Puck data format.
 */

import type { ReactNode, ComponentType } from "react";

// =============================================================================
// PAGE DATA TYPES
// =============================================================================

/**
 * Root styles configuration
 */
export interface RootStyles {
  backgroundColor?: string;
  backgroundImage?: string;
  fontFamily?: string;
  fontSize?: string;
  color?: string;
  maxWidth?: string;
  padding?: string;
}

/**
 * Root component props
 */
export interface RootProps {
  title?: string;
  description?: string;
  styles?: RootStyles;
}

/**
 * Complete page data structure
 * This is what gets saved to and loaded from the database
 */
export interface StudioPageData {
  /** Schema version for migrations */
  version: "1.0";
  
  /** Root configuration */
  root: {
    id: "root";
    type: "Root";
    props: RootProps;
    children: string[]; // Top-level component IDs
  };
  
  /** All components indexed by ID */
  components: Record<string, StudioComponent>;
  
  /** Named drop zones for nested components */
  zones?: Record<string, string[]>;
}

/**
 * Individual component instance
 */
export interface StudioComponent {
  /** Unique identifier */
  id: string;
  
  /** Component type (matches registry key) */
  type: string;
  
  /** Component properties */
  props: Record<string, unknown>;
  
  /** Child component IDs (for containers) */
  children?: string[];
  
  /** Parent component ID */
  parentId?: string;
  
  /** Zone ID if inside a named zone */
  zoneId?: string;
  
  /** Prevent editing */
  locked?: boolean;
  
  /** Hide in canvas (but keep in data) */
  hidden?: boolean;
}

// =============================================================================
// COMPONENT DEFINITION TYPES
// =============================================================================

/**
 * Field type enumeration
 */
export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "radio"
  | "checkbox"
  | "toggle"
  | "color"
  | "image"
  | "link"
  | "spacing"
  | "typography"
  | "array"
  | "object"
  | "richtext"
  | "code"
  | "custom";

/**
 * Option for select/radio fields
 */
export interface FieldOption {
  label: string;
  value: string | number | boolean;
}

/**
 * Field definition for component properties
 */
export interface FieldDefinition {
  /** Field type */
  type: FieldType;
  
  /** Display label */
  label: string;
  
  /** Help text */
  description?: string;
  
  /** Default value */
  defaultValue?: unknown;
  
  /** Is this field required? */
  required?: boolean;
  
  /** Options for select/radio */
  options?: FieldOption[];
  
  /** Minimum value (number) */
  min?: number;
  
  /** Maximum value (number) */
  max?: number;
  
  /** Step increment (number) */
  step?: number;
  
  /** Number of rows (textarea) */
  rows?: number;
  
  /** Accepted MIME types (image) */
  accepts?: string[];
  
  /** Nested field definitions (object type) */
  fields?: Record<string, FieldDefinition>;
  
  /** Item field definitions (array type) */
  itemFields?: Record<string, FieldDefinition>;
  
  /** Show per-breakpoint controls */
  responsive?: boolean;
  
  /** Custom field renderer */
  render?: ComponentType<FieldRenderProps>;
  
  /** Group name for organizing in UI */
  group?: string;
  
  /** Conditional visibility */
  showWhen?: {
    field: string;
    value: unknown;
  };
}

/**
 * Props passed to custom field renderers
 */
export interface FieldRenderProps {
  value: unknown;
  onChange: (value: unknown) => void;
  field: FieldDefinition;
  componentType: string;
}

/**
 * Component category for sidebar organization
 */
export type ComponentCategory =
  | "layout"
  | "typography"
  | "buttons"
  | "media"
  | "sections"
  | "navigation"
  | "forms"
  | "ecommerce"
  | "interactive"
  | "marketing"
  | "content"
  | "3d"
  | "module";

/**
 * AI configuration for a component
 */
export interface ComponentAIConfig {
  /** Description for AI context */
  description: string;
  
  /** Which props AI can modify */
  canModify: string[];
  
  /** Suggested quick actions */
  suggestions?: string[];
}

/**
 * Module source information
 */
export interface ComponentModuleSource {
  /** Module ID */
  id: string;
  
  /** Module display name */
  name: string;
  
  /** Module icon */
  icon?: string;
}

/**
 * Drop zone configuration for containers
 */
export interface DropZoneConfig {
  /** Zone identifier */
  id: string;
  
  /** Display name */
  label?: string;
  
  /** Allowed component types (empty = all) */
  allowedTypes?: string[];
  
  /** Maximum children */
  maxChildren?: number;
}

/**
 * Component definition in the registry
 */
export interface ComponentDefinition {
  /** Unique type identifier */
  type: string;
  
  /** Display name */
  label: string;
  
  /** Description for tooltip */
  description?: string;
  
  /** Sidebar category */
  category: ComponentCategory;
  
  /** Icon name (lucide-react) */
  icon: string;
  
  /** Field definitions */
  fields: Record<string, FieldDefinition>;
  
  /** Default prop values */
  defaultProps: Record<string, unknown>;
  
  /** React component for rendering */
  render: ComponentType<any>;
  
  /** Does this component accept children? */
  acceptsChildren?: boolean;
  
  /** What component types can be children? */
  allowedChildren?: string[];
  
  /** Named drop zones */
  zones?: DropZoneConfig[];
  
  /** AI configuration */
  ai?: ComponentAIConfig;
  
  /** Module source (if from a module) */
  module?: ComponentModuleSource;
  
  /** Preview thumbnail URL */
  thumbnail?: string;
  
  /** Search keywords */
  keywords?: string[];
  
  /** Is this a container component? */
  isContainer?: boolean;
  
  /** Can this component be deleted? */
  canDelete?: boolean;
  
  /** Can this component be duplicated? */
  canDuplicate?: boolean;
  
  /** Can this component be moved? */
  canMove?: boolean;
}

// =============================================================================
// EDITOR STATE TYPES
// =============================================================================

/**
 * Viewport/breakpoint for responsive editing
 */
export type Breakpoint = "mobile" | "tablet" | "desktop";

/**
 * Breakpoint configurations
 */
export interface BreakpointConfig {
  name: string;
  width: number;
  icon: string;
}

export const BREAKPOINTS: Record<Breakpoint, BreakpointConfig> = {
  mobile: { name: "Mobile", width: 375, icon: "Smartphone" },
  tablet: { name: "Tablet", width: 768, icon: "Tablet" },
  desktop: { name: "Desktop", width: 1280, icon: "Monitor" },
};

/**
 * Selection state
 */
export interface SelectionState {
  /** Currently selected component ID */
  componentId: string | null;
  
  /** Multi-select component IDs */
  componentIds: string[];
  
  /** Is multi-select mode active? */
  isMultiSelect: boolean;
}

/**
 * Editor mode
 */
export type EditorMode = "edit" | "preview" | "code";

/**
 * Panel visibility state
 */
export interface PanelState {
  left: boolean;
  right: boolean;
  bottom: boolean;
}

/**
 * UI state
 */
export interface UIState {
  /** Current breakpoint */
  breakpoint: Breakpoint;
  
  /** Canvas zoom level (1 = 100%) */
  zoom: number;
  
  /** Panel visibility */
  panels: PanelState;
  
  /** Editor mode */
  mode: EditorMode;
  
  /** Is dragging a component? */
  isDragging: boolean;
  
  /** Component being dragged (from library) */
  draggedType: string | null;
  
  /** Show grid overlay */
  showGrid: boolean;
  
  /** Show component outlines */
  showOutlines: boolean;
}

/**
 * History entry for undo/redo
 */
export interface HistoryEntry {
  /** Timestamp */
  timestamp: number;
  
  /** Action description */
  action: string;
  
  /** Page data snapshot */
  data: StudioPageData;
}

// =============================================================================
// AI TYPES
// =============================================================================

/**
 * AI chat message
 */
export interface AIMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

/**
 * AI component context for prompts
 */
export interface AIComponentContext {
  componentType: string;
  currentProps: Record<string, unknown>;
  componentDefinition: ComponentDefinition;
  pageContext: {
    title: string;
    businessType?: string;
    existingContent: string[];
  };
}

/**
 * AI prop update response
 */
export interface AIPropsUpdate {
  props: Partial<Record<string, unknown>>;
  explanation: string;
}

// =============================================================================
// MIGRATION TYPES
// =============================================================================

/**
 * Puck data format (for migration)
 */
export interface PuckDataFormat {
  root: {
    props: Record<string, unknown>;
  };
  content: Array<{
    type: string;
    props: Record<string, unknown>;
  }>;
  zones?: Record<string, Array<{
    type: string;
    props: Record<string, unknown>;
  }>>;
}

/**
 * Convert Puck format to Studio format
 */
export function migrateFromPuckFormat(puckData: PuckDataFormat): StudioPageData {
  const studioData: StudioPageData = {
    version: "1.0",
    root: {
      id: "root",
      type: "Root",
      props: {
        title: (puckData.root.props.title as string) || "Untitled",
        description: (puckData.root.props.description as string) || "",
      },
      children: [],
    },
    components: {},
    zones: {},
  };

  // Migrate top-level content
  let idCounter = 0;
  for (const item of puckData.content || []) {
    const id = `comp_migrated_${idCounter++}`;
    studioData.components[id] = {
      id,
      type: item.type,
      props: item.props,
      parentId: "root",
    };
    studioData.root.children.push(id);
  }

  // Migrate zones
  for (const [zoneName, zoneContent] of Object.entries(puckData.zones || {})) {
    studioData.zones![zoneName] = [];
    for (const item of zoneContent) {
      const id = `comp_migrated_${idCounter++}`;
      studioData.components[id] = {
        id,
        type: item.type,
        props: item.props,
        zoneId: zoneName,
      };
      studioData.zones![zoneName].push(id);
    }
  }

  return studioData;
}
```

**Acceptance Criteria:**
- [ ] All types defined in `src/types/studio.ts`
- [ ] Types are exported and accessible throughout the project
- [ ] Migration function handles Puck data format
- [ ] Types are compatible with React 19 and TypeScript 5.x

---

### Task 4: Create Studio CSS File

**Description:** Create editor-specific styles that complement the existing design system.

**File:** `src/styles/studio.css`

```css
/**
 * DRAMAC Studio Editor Styles
 * 
 * Editor-specific styles that complement the main design system.
 * Uses CSS variables from globals.css for consistency.
 */

/* =============================================================================
   STUDIO ROOT
   ============================================================================= */

.studio-root {
  /* Full screen, no scroll */
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  overflow: hidden;
  
  /* Prevent text selection during drag */
  user-select: none;
}

.studio-root.is-dragging {
  cursor: grabbing;
}

/* =============================================================================
   PANEL LAYOUT
   ============================================================================= */

.studio-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.studio-panel {
  background: hsl(var(--card));
  border-color: hsl(var(--border));
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.studio-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid hsl(var(--border));
  background: hsl(var(--muted) / 0.5);
  min-height: 2.75rem;
}

.studio-panel-title {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: hsl(var(--muted-foreground));
}

.studio-panel-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Left Panel (Components Library) */
.studio-panel-left {
  border-right: 1px solid hsl(var(--border));
}

/* Right Panel (Properties) */
.studio-panel-right {
  border-left: 1px solid hsl(var(--border));
}

/* Bottom Panel (Layers) */
.studio-panel-bottom {
  border-top: 1px solid hsl(var(--border));
}

/* =============================================================================
   TOP TOOLBAR
   ============================================================================= */

.studio-toolbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: hsl(var(--card));
  border-bottom: 1px solid hsl(var(--border));
  min-height: 3rem;
}

.studio-toolbar-section {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.studio-toolbar-divider {
  width: 1px;
  height: 1.5rem;
  background: hsl(var(--border));
  margin: 0 0.5rem;
}

.studio-toolbar-spacer {
  flex: 1;
}

/* =============================================================================
   CANVAS
   ============================================================================= */

.studio-canvas-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: hsl(var(--muted) / 0.3);
  overflow: auto;
  padding: 2rem;
}

.studio-canvas {
  background: hsl(var(--background));
  box-shadow: 
    0 0 0 1px hsl(var(--border)),
    0 4px 6px -1px rgb(0 0 0 / 0.1),
    0 2px 4px -2px rgb(0 0 0 / 0.1);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: width 0.2s ease, height 0.2s ease;
}

.studio-canvas-inner {
  min-height: 100%;
  position: relative;
}

/* =============================================================================
   COMPONENT WRAPPER
   ============================================================================= */

.studio-component {
  position: relative;
  outline: 2px solid transparent;
  outline-offset: -2px;
  transition: outline-color 0.15s ease;
}

.studio-component:hover {
  outline-color: hsl(var(--primary) / 0.3);
}

.studio-component.is-selected {
  outline-color: hsl(var(--primary));
}

.studio-component.is-locked {
  opacity: 0.6;
  pointer-events: none;
}

.studio-component.is-hidden {
  opacity: 0.3;
}

/* Component label */
.studio-component-label {
  position: absolute;
  top: 0;
  left: 0;
  transform: translateY(-100%);
  padding: 0.125rem 0.5rem;
  font-size: 0.625rem;
  font-weight: 500;
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  opacity: 0;
  pointer-events: none;
  white-space: nowrap;
  transition: opacity 0.15s ease;
}

.studio-component:hover .studio-component-label,
.studio-component.is-selected .studio-component-label {
  opacity: 1;
}

/* Component actions */
.studio-component-actions {
  position: absolute;
  top: 0;
  right: 0;
  transform: translateY(-100%);
  display: flex;
  gap: 0.125rem;
  padding: 0.125rem;
  background: hsl(var(--primary));
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
}

.studio-component.is-selected .studio-component-actions {
  opacity: 1;
  pointer-events: auto;
}

/* =============================================================================
   DROP ZONES
   ============================================================================= */

.studio-dropzone {
  min-height: 3rem;
  border: 2px dashed transparent;
  border-radius: var(--radius-md);
  transition: all 0.15s ease;
}

.studio-dropzone.is-over {
  border-color: hsl(var(--primary));
  background: hsl(var(--primary) / 0.1);
}

.studio-dropzone.is-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: hsl(var(--muted-foreground));
  font-size: 0.875rem;
}

/* Drop indicator line */
.studio-drop-indicator {
  position: absolute;
  left: 0;
  right: 0;
  height: 3px;
  background: hsl(var(--primary));
  border-radius: 2px;
  pointer-events: none;
  z-index: 100;
}

/* =============================================================================
   DRAG OVERLAY
   ============================================================================= */

.studio-drag-overlay {
  padding: 0.5rem 1rem;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius-md);
  box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.1);
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  opacity: 0.9;
}

/* =============================================================================
   COMPONENT LIBRARY ITEMS
   ============================================================================= */

.studio-library-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  border-radius: var(--radius-md);
  cursor: grab;
  transition: background-color 0.15s ease;
}

.studio-library-item:hover {
  background: hsl(var(--accent));
}

.studio-library-item:active {
  cursor: grabbing;
}

.studio-library-item-icon {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: hsl(var(--muted));
  border-radius: var(--radius-sm);
  color: hsl(var(--muted-foreground));
}

.studio-library-item-info {
  flex: 1;
  min-width: 0;
}

.studio-library-item-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: hsl(var(--foreground));
}

.studio-library-item-description {
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* =============================================================================
   FIELD STYLES
   ============================================================================= */

.studio-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.studio-field-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: hsl(var(--foreground));
}

.studio-field-description {
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
}

.studio-field-group {
  padding: 0.75rem;
  border-bottom: 1px solid hsl(var(--border));
}

.studio-field-group-title {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: hsl(var(--muted-foreground));
  margin-bottom: 0.75rem;
}

/* =============================================================================
   LAYERS PANEL
   ============================================================================= */

.studio-layer-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.5rem;
  font-size: 0.8125rem;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background-color 0.1s ease;
}

.studio-layer-item:hover {
  background: hsl(var(--accent));
}

.studio-layer-item.is-selected {
  background: hsl(var(--primary) / 0.1);
  color: hsl(var(--primary));
}

.studio-layer-item-indent {
  width: 1rem;
  flex-shrink: 0;
}

.studio-layer-item-icon {
  width: 1rem;
  height: 1rem;
  color: hsl(var(--muted-foreground));
  flex-shrink: 0;
}

.studio-layer-item-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* =============================================================================
   RESPONSIVE INDICATOR
   ============================================================================= */

.studio-breakpoint-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  background: hsl(var(--muted));
  border-radius: var(--radius-sm);
}

/* =============================================================================
   ZOOM CONTROLS
   ============================================================================= */

.studio-zoom-control {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.studio-zoom-value {
  min-width: 3.5rem;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 500;
  color: hsl(var(--muted-foreground));
}

/* =============================================================================
   AI CHAT
   ============================================================================= */

.studio-ai-button {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: hsl(var(--primary));
  background: hsl(var(--primary) / 0.1);
  border: 1px solid hsl(var(--primary) / 0.2);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s ease;
}

.studio-ai-button:hover {
  background: hsl(var(--primary) / 0.15);
  border-color: hsl(var(--primary) / 0.3);
}

.studio-ai-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.studio-ai-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.studio-ai-message {
  margin-bottom: 1rem;
  padding: 0.75rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  line-height: 1.5;
}

.studio-ai-message.user {
  background: hsl(var(--muted));
  margin-left: 2rem;
}

.studio-ai-message.assistant {
  background: hsl(var(--primary) / 0.1);
  margin-right: 2rem;
}

.studio-ai-input {
  padding: 1rem;
  border-top: 1px solid hsl(var(--border));
}

/* =============================================================================
   UTILITY CLASSES
   ============================================================================= */

.studio-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--border)) transparent;
}

.studio-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.studio-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.studio-scrollbar::-webkit-scrollbar-thumb {
  background: hsl(var(--border));
  border-radius: 3px;
}

.studio-scrollbar::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.3);
}

/* Fade edges for scrollable content */
.studio-fade-edge {
  position: relative;
}

.studio-fade-edge::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2rem;
  background: linear-gradient(to top, hsl(var(--card)), transparent);
  pointer-events: none;
}
```

**Acceptance Criteria:**
- [ ] CSS file created at `src/styles/studio.css`
- [ ] Uses CSS variables from design system
- [ ] All major UI sections have base styles
- [ ] Imported in studio layout

---

### Task 5: Verify TypeScript Compilation

**Description:** Ensure all new files compile without errors.

**Command:**
```bash
cd next-platform-dashboard
npx tsc --noEmit
```

**Acceptance Criteria:**
- [ ] Zero TypeScript errors
- [ ] All imports resolve correctly
- [ ] No circular dependencies

---

## File Summary

| Action | Path | Description |
|--------|------|-------------|
| CREATE | `src/app/studio/[siteId]/[pageId]/page.tsx` | Editor page route |
| CREATE | `src/app/studio/[siteId]/[pageId]/layout.tsx` | Editor layout (full-screen) |
| CREATE | `src/components/studio/core/index.ts` | Core components exports |
| CREATE | `src/components/studio/panels/index.ts` | Panel components exports |
| CREATE | `src/components/studio/fields/index.ts` | Field components exports |
| CREATE | `src/components/studio/ai/index.ts` | AI components exports |
| CREATE | `src/components/studio/dnd/index.ts` | DnD components exports |
| CREATE | `src/components/studio/features/index.ts` | Feature components exports |
| CREATE | `src/lib/studio/store/index.ts` | Store exports |
| CREATE | `src/lib/studio/registry/index.ts` | Registry exports |
| CREATE | `src/lib/studio/engine/index.ts` | Engine exports |
| CREATE | `src/lib/studio/utils/index.ts` | Utils exports |
| CREATE | `src/lib/studio/utils/id-utils.ts` | ID generation utilities |
| CREATE | `src/lib/studio/utils/tree-utils.ts` | Tree manipulation utilities |
| CREATE | `src/lib/studio/utils/component-utils.ts` | Component utilities |
| CREATE | `src/types/studio.ts` | All Studio TypeScript types |
| CREATE | `src/styles/studio.css` | Editor-specific styles |

---

## Testing Requirements

### Manual Testing
- [ ] Navigate to `/studio/test-site-id/test-page-id` - should show placeholder
- [ ] Check browser console for any errors
- [ ] Verify styles load correctly (inspect studio-root class)

### TypeScript Validation
- [ ] Run `npx tsc --noEmit` - zero errors
- [ ] Check that all imports in new files resolve

---

## Dependencies to Install

```bash
cd next-platform-dashboard
pnpm add immer zundo react-colorful react-hotkeys-hook @floating-ui/react nanoid
```

---

## Environment Variables

No new environment variables required for this phase.

---

## Database Changes

No database changes required for this phase.

---

## Rollback Plan

1. Remove installed packages: `pnpm remove immer zundo react-colorful react-hotkeys-hook @floating-ui/react nanoid`
2. Delete created directories and files
3. No database changes to revert

---

## Success Criteria

- [ ] All npm packages installed successfully
- [ ] Folder structure created under `src/app/studio/`, `src/components/studio/`, `src/lib/studio/`
- [ ] TypeScript types defined in `src/types/studio.ts`
- [ ] CSS file created at `src/styles/studio.css`
- [ ] Studio route accessible at `/studio/[siteId]/[pageId]`
- [ ] `npx tsc --noEmit` returns zero errors
- [ ] Utility functions work correctly (id generation, tree utils)

---

## Notes for Implementation

1. **Existing Packages**: Many packages are already installed. Only install the ones listed in Task 1.

2. **CSS Variables**: All colors use `hsl(var(--variable))` format to match the existing design system.

3. **Type Migration**: The `migrateFromPuckFormat` function allows loading existing Puck pages.

4. **Placeholder Files**: Most component files are placeholders that will be implemented in subsequent phases.

5. **Route Protection**: The page component already checks for authentication and site/page access.
