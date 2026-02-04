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

// =============================================================================
// COMPONENT STATE TYPES (PHASE-STUDIO-22)
// =============================================================================

/**
 * Interactive states for components
 */
export type ComponentState = 'default' | 'hover' | 'active' | 'focus';

/**
 * Transition settings for state changes
 */
export interface TransitionSettings {
  property: 'all' | 'transform' | 'opacity' | 'colors' | 'shadow' | 'none';
  duration: number; // milliseconds
  easing: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
  delay?: number; // milliseconds
}

/**
 * Default transition settings
 */
export const DEFAULT_TRANSITION: TransitionSettings = {
  property: 'all',
  duration: 200,
  easing: 'ease-out',
  delay: 0,
};

/**
 * Properties that can be different per state
 * Only visual properties that make sense for interactive states
 */
export const STATE_EDITABLE_PROPERTIES = [
  // Colors
  'backgroundColor',
  'color',
  'borderColor',
  'outlineColor',
  
  // Transform
  'scale',
  'scaleX',
  'scaleY',
  'rotate',
  'translateX',
  'translateY',
  'skewX',
  'skewY',
  
  // Opacity
  'opacity',
  
  // Shadows
  'boxShadow',
  'textShadow',
  
  // Borders
  'borderWidth',
  'borderStyle',
  
  // Outline (for focus)
  'outlineWidth',
  'outlineStyle',
  'outlineOffset',
] as const;

export type StateEditableProperty = typeof STATE_EDITABLE_PROPERTIES[number];

/**
 * State overrides (partial props that override default)
 */
export type StateOverrides = Partial<Record<StateEditableProperty, unknown>>;

/**
 * Helper to check if a property can be edited per state
 */
export function isStateEditableProperty(property: string): property is StateEditableProperty {
  return STATE_EDITABLE_PROPERTIES.includes(property as StateEditableProperty);
}

/**
 * Helper to get effective props for a state
 */
export function getEffectiveProps(
  component: StudioComponent,
  state: ComponentState
): Record<string, unknown> {
  if (state === 'default' || !component.states?.[state]) {
    return component.props;
  }
  
  return {
    ...component.props,
    ...component.states[state],
  };
}

// =============================================================================
// COMPONENT INSTANCE TYPES
// =============================================================================

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
  
  /** State-specific property overrides (PHASE-STUDIO-22) */
  states?: {
    hover?: StateOverrides;
    active?: StateOverrides;
    focus?: StateOverrides;
  };
  
  /** Transition settings for state changes (PHASE-STUDIO-22) */
  transition?: TransitionSettings;
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
  
  /** Field key (property name) - used when iterating as array */
  key?: string;
  
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
  
  /** Whether to show a slider (for number fields) */
  showSlider?: boolean;
  
  /** Preset colors for color field */
  presets?: { name: string; value: string }[];
  
  /** Allow custom color input */
  allowCustom?: boolean;
  
  /** Allow external URLs (for URL fields) */
  allowExternal?: boolean;
  
  /** Validate URL format */
  validateUrl?: boolean;
  
  /**
   * Custom field type identifier for module-specific fields.
   * Format: "moduleSlug:fieldType" (e.g., "ecommerce:product-selector")
   * Only used when type is "custom"
   */
  customType?: string;
  
  /**
   * Additional options for custom fields.
   * Passed to the custom field component.
   */
  customOptions?: Record<string, unknown>;
  
  /**
   * API endpoint for fetching field data.
   * If provided, the custom field can use this to fetch options.
   */
  dataEndpoint?: string;
  
  /**
   * Whether the field supports multiple selection.
   */
  multiple?: boolean;
  
  /**
   * Whether to allow clearing the selection.
   */
  clearable?: boolean;
  
  /**
   * Whether the field supports search/filtering.
   */
  searchable?: boolean;
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
 * Drop zone configuration for containers (legacy - use ZoneDefinition for new components)
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
 * Zone ID format - parentId:zoneName
 */
export type ZoneId = `${string}:${string}`;

/**
 * Definition of a drop zone within a component (Phase STUDIO-19)
 */
export interface ZoneDefinition {
  /** Display name for the zone (e.g., "Header", "Content", "Footer") */
  label: string;
  
  /** List of allowed component types. If undefined, all components allowed */
  allowedComponents?: string[];
  
  /** Whether the zone accepts child components */
  acceptsChildren: boolean;
  
  /** Minimum number of children required */
  minChildren?: number;
  
  /** Maximum number of children allowed */
  maxChildren?: number;
  
  /** Component type to auto-add when zone is created */
  defaultComponent?: string;
  
  /** Custom styling for the zone container */
  className?: string;
  
  /** Placeholder text when zone is empty */
  placeholder?: string;
}

/**
 * Parse zone ID into parent and zone name
 */
export function parseZoneId(zoneId: string): { parentId: string; zoneName: string } | null {
  const colonIndex = zoneId.indexOf(':');
  if (colonIndex === -1) return null;
  return { 
    parentId: zoneId.slice(0, colonIndex), 
    zoneName: zoneId.slice(colonIndex + 1) 
  };
}

/**
 * Create zone ID from parent ID and zone name
 */
export function createZoneId(parentId: string, zoneName: string): ZoneId {
  return `${parentId}:${zoneName}` as ZoneId;
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
  
  /** Named drop zones (legacy array format) */
  dropZones?: DropZoneConfig[];
  
  /** Named drop zones keyed by zone name (Phase STUDIO-19) */
  zones?: Record<string, ZoneDefinition>;
  
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
  
  /** Layout direction for container children (vertical or horizontal) */
  layoutDirection?: "vertical" | "horizontal";
  
  /** Field groups for organizing in properties panel */
  fieldGroups?: FieldGroup[];
}

// =============================================================================
// FIELD VALUE TYPES (for Properties Panel)
// =============================================================================

/**
 * Spacing value for padding/margin
 */
export type SpacingValue = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

/**
 * Responsive value wrapper - stores different values per breakpoint
 */
export type ResponsiveValue<T> = {
  mobile: T;      // REQUIRED - this is the base/default
  tablet?: T;     // Optional override for tablet
  desktop?: T;    // Optional override for desktop
};

/**
 * All possible field value types
 */
export type FieldValue =
  | string
  | number
  | boolean
  | SpacingValue
  | string[]
  | ResponsiveValue<string>
  | ResponsiveValue<number>
  | ResponsiveValue<SpacingValue>
  | Record<string, unknown>
  | null
  | undefined;

/**
 * Props for any field editor component
 */
export interface FieldEditorProps<T = FieldValue> {
  /** The field definition */
  field: FieldDefinition;
  /** Current field value */
  value: T;
  /** Called when value changes */
  onChange: (value: T) => void;
  /** Whether to show responsive controls */
  showResponsive?: boolean;
  /** Current breakpoint for responsive editing */
  activeBreakpoint?: Breakpoint;
  /** Called when breakpoint changes */
  onBreakpointChange?: (breakpoint: Breakpoint) => void;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Field editor component type
 */
export type FieldEditorComponent<T = FieldValue> = React.ComponentType<FieldEditorProps<T>>;

/**
 * Field group for organizing related fields
 */
export interface FieldGroup {
  id: string;
  label: string;
  fields: string[]; // Field keys
  defaultExpanded?: boolean;
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
export type DragSource = "library" | "canvas" | "symbol";

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
 * Data attached to draggable symbols from the symbols panel
 * Phase: STUDIO-25
 */
export interface SymbolDragData {
  source: "symbol";
  symbolId: string;
  symbolName: string;
}

/**
 * Union type for all drag data
 */
export type DragData = LibraryDragData | CanvasDragData | SymbolDragData;

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

/**
 * Type guard for symbol drag
 * Phase: STUDIO-25
 */
export function isSymbolDrag(data: DragData): data is SymbolDragData {
  return data.source === "symbol";
}

// =============================================================================
// ADVANCED FIELD VALUE TYPES (Phase STUDIO-09)
// =============================================================================

/**
 * Spacing value with CSS units (for margin/padding fields with full CSS support)
 */
export interface SpacingValueCSS {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

/**
 * Typography value type
 */
export interface TypographyValue {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: number;
  lineHeight?: string;
  letterSpacing?: string;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}

/**
 * Image value type
 */
export interface ImageValue {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

/**
 * Link value type
 */
export interface LinkValue {
  href: string;
  target?: '_blank' | '_self';
  pageId?: string;
  type?: 'page' | 'url' | 'email' | 'phone';
}

/**
 * Field editor props base
 */
export interface BaseFieldEditorProps<T> {
  value: T;
  onChange: (value: T) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}

/**
 * Color field props
 */
export interface ColorFieldEditorProps extends BaseFieldEditorProps<string> {
  showAlpha?: boolean;
  presets?: string[];
}

/**
 * Image field props
 */
export interface ImageFieldEditorProps extends BaseFieldEditorProps<ImageValue> {
  accepts?: string[];
  maxSize?: number;
}

/**
 * Link field props
 */
export interface LinkFieldEditorProps extends BaseFieldEditorProps<LinkValue> {
  allowedTypes?: Array<'page' | 'url' | 'email' | 'phone'>;
  siteId?: string;
}

/**
 * Spacing field props (with CSS units)
 */
export interface SpacingFieldEditorProps extends BaseFieldEditorProps<SpacingValueCSS> {
  allowNegative?: boolean;
  units?: string[];
}

/**
 * Typography field props
 */
export interface TypographyFieldEditorProps extends BaseFieldEditorProps<TypographyValue> {
  showPreview?: boolean;
}

/**
 * Array field props
 */
export interface ArrayFieldEditorProps extends BaseFieldEditorProps<unknown[]> {
  itemFields: Record<string, FieldDefinition>;
  itemLabel?: string;
  minItems?: number;
  maxItems?: number;
}

/**
 * Object field props
 */
export interface ObjectFieldEditorProps extends BaseFieldEditorProps<Record<string, unknown>> {
  fields: Record<string, FieldDefinition>;
  collapsible?: boolean;
}
