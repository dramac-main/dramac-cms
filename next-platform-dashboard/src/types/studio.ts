/**
 * DRAMAC Studio Type Definitions
 * 
 * Core types for the Studio editor data structures.
 * Designed for compatibility with existing Puck data format.
 */

import type { ComponentType } from "react";

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
  | "slider"
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
  
  /** Conditional visibility - shorthand { field: value } or explicit format */
  showWhen?: Record<string, unknown> | {
    field: string;
    value: unknown;
  };
  
  /** Placeholder text for input fields */
  placeholder?: string;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultProps: Record<string, any>;
  
  /** React component for rendering */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render: ComponentType<any>;
  
  /** Does this component accept children? */
  acceptsChildren?: boolean;
  
  /** What component types can be children? */
  allowedChildren?: string[];
  
  /** What component types can be children (alias) */
  allowedChildTypes?: string[];
  
  /** Named drop zones */
  zones?: DropZoneConfig[];
  
  /** AI configuration */
  ai?: ComponentAIConfig;
  
  /** AI context string (shorthand for simple AI descriptions) */
  aiContext?: string;
  
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
      parentId: undefined,
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

// =============================================================================
// DRAG & DROP TYPES
// =============================================================================

/**
 * Identifies what type of drag operation is happening
 */
export type DragSource = "library" | "canvas";

/**
 * Data attached to draggable items from the library
 */
export interface LibraryDragData {
  source: "library";
  componentType: string;
  label: string;
  icon: string;
}

/**
 * Data attached to sortable items on the canvas
 */
export interface CanvasDragData {
  source: "canvas";
  componentId: string;
  componentType: string;
  parentId: string | null;
  index: number;
}

/**
 * Union type for all drag data
 */
export type DragData = LibraryDragData | CanvasDragData;

/**
 * Drop target information
 */
export interface DropTarget {
  parentId: string; // "root" or component ID
  index: number;
  zoneId?: string;
}

/**
 * Type guard for library drag
 */
export function isLibraryDrag(data: DragData): data is LibraryDragData {
  return data.source === "library";
}

/**
 * Type guard for canvas drag
 */
export function isCanvasDrag(data: DragData): data is CanvasDragData {
  return data.source === "canvas";
}
