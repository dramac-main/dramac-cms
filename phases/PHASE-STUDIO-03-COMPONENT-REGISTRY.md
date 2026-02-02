# PHASE-STUDIO-03: Component Registry System

## Overview

| Property | Value |
|----------|-------|
| Phase | STUDIO-03 |
| Title | Component Registry System |
| Priority | Critical |
| Estimated Time | 6-8 hours |
| Dependencies | PHASE-STUDIO-01, PHASE-STUDIO-02 |
| Risk Level | Medium |

## Problem Statement

DRAMAC Studio needs a component registry that:
1. Registers all 116+ existing Puck component renders with Studio metadata
2. Organizes components into categories for the sidebar
3. Provides component lookup and search functionality
4. Supports dynamic registration of module components
5. Defines field schemas for property editing

This phase creates the registry infrastructure and registers all existing components.

## Goals

- [ ] Create component registration API with TypeScript support
- [ ] Define field registry for property editors
- [ ] Register all existing Puck components (116+) with Studio metadata
- [ ] Implement category system for sidebar organization
- [ ] Create component lookup and search utilities
- [ ] Support module component registration

## Technical Approach

1. **Adapter Pattern**: Create wrappers around existing Puck render components, adding Studio metadata without rewriting them.

2. **Category System**: Organize components into logical categories matching the existing Puck toolbox.

3. **Field Definitions**: Map existing Puck field types to Studio field definitions.

4. **Registry Pattern**: Use a singleton registry that components register to on load.

5. **Module Support**: Design the API to support dynamic registration from modules.

---

## Implementation Tasks

### Task 1: Create Field Registry

**Description:** Define field types and create a registry for custom field renderers.

**File:** `src/lib/studio/registry/field-registry.ts`

```tsx
/**
 * DRAMAC Studio Field Registry
 * 
 * Registry for field type definitions and custom field renderers.
 */

import type { ComponentType } from "react";
import type { FieldDefinition, FieldType, FieldRenderProps } from "@/types/studio";

// =============================================================================
// TYPES
// =============================================================================

export interface FieldTypeDefinition {
  /** Field type identifier */
  type: FieldType;
  
  /** Display name */
  label: string;
  
  /** Default renderer component */
  render: ComponentType<FieldRenderProps>;
  
  /** Validate field value */
  validate?: (value: unknown, field: FieldDefinition) => string | null;
  
  /** Transform value before save */
  serialize?: (value: unknown) => unknown;
  
  /** Transform value after load */
  deserialize?: (value: unknown) => unknown;
}

// =============================================================================
// REGISTRY
// =============================================================================

class FieldRegistry {
  private fields: Map<FieldType, FieldTypeDefinition> = new Map();
  private customRenderers: Map<string, ComponentType<FieldRenderProps>> = new Map();

  /**
   * Register a field type
   */
  register(definition: FieldTypeDefinition): void {
    this.fields.set(definition.type, definition);
  }

  /**
   * Register a custom field renderer
   * Used for module-specific field types
   */
  registerCustomRenderer(
    name: string,
    renderer: ComponentType<FieldRenderProps>
  ): void {
    this.customRenderers.set(name, renderer);
  }

  /**
   * Get field type definition
   */
  get(type: FieldType): FieldTypeDefinition | undefined {
    return this.fields.get(type);
  }

  /**
   * Get custom renderer
   */
  getCustomRenderer(name: string): ComponentType<FieldRenderProps> | undefined {
    return this.customRenderers.get(name);
  }

  /**
   * Get all registered field types
   */
  getAll(): FieldTypeDefinition[] {
    return Array.from(this.fields.values());
  }

  /**
   * Check if field type exists
   */
  has(type: FieldType): boolean {
    return this.fields.has(type);
  }

  /**
   * Validate a value against field definition
   */
  validate(value: unknown, field: FieldDefinition): string | null {
    // Required check
    if (field.required && (value === undefined || value === null || value === "")) {
      return `${field.label} is required`;
    }

    // Type-specific validation
    const typeDefinition = this.fields.get(field.type);
    if (typeDefinition?.validate) {
      return typeDefinition.validate(value, field);
    }

    return null;
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const fieldRegistry = new FieldRegistry();

// =============================================================================
// DEFAULT FIELD VALIDATORS
// =============================================================================

/**
 * Validate number field
 */
export function validateNumber(value: unknown, field: FieldDefinition): string | null {
  if (value === undefined || value === null || value === "") return null;
  
  const num = Number(value);
  if (isNaN(num)) return `${field.label} must be a number`;
  
  if (field.min !== undefined && num < field.min) {
    return `${field.label} must be at least ${field.min}`;
  }
  
  if (field.max !== undefined && num > field.max) {
    return `${field.label} must be at most ${field.max}`;
  }
  
  return null;
}

/**
 * Validate text field
 */
export function validateText(value: unknown, field: FieldDefinition): string | null {
  if (value === undefined || value === null) return null;
  
  const str = String(value);
  
  if (field.min !== undefined && str.length < field.min) {
    return `${field.label} must be at least ${field.min} characters`;
  }
  
  if (field.max !== undefined && str.length > field.max) {
    return `${field.label} must be at most ${field.max} characters`;
  }
  
  return null;
}

// =============================================================================
// DEFAULT FIELD DEFINITIONS
// =============================================================================

/**
 * Common field definitions for reuse
 */
export const commonFields = {
  // Text fields
  text: (label: string, defaultValue = ""): FieldDefinition => ({
    type: "text",
    label,
    defaultValue,
  }),
  
  textarea: (label: string, rows = 3): FieldDefinition => ({
    type: "textarea",
    label,
    rows,
    defaultValue: "",
  }),
  
  // Number fields
  number: (label: string, defaultValue = 0, min?: number, max?: number): FieldDefinition => ({
    type: "number",
    label,
    defaultValue,
    min,
    max,
  }),
  
  // Select fields
  select: (label: string, options: { label: string; value: string }[], defaultValue?: string): FieldDefinition => ({
    type: "select",
    label,
    options,
    defaultValue: defaultValue ?? options[0]?.value,
  }),
  
  // Boolean fields
  toggle: (label: string, defaultValue = false): FieldDefinition => ({
    type: "toggle",
    label,
    defaultValue,
  }),
  
  checkbox: (label: string, defaultValue = false): FieldDefinition => ({
    type: "checkbox",
    label,
    defaultValue,
  }),
  
  // Color field
  color: (label: string, defaultValue = "#000000"): FieldDefinition => ({
    type: "color",
    label,
    defaultValue,
  }),
  
  // Image field
  image: (label: string): FieldDefinition => ({
    type: "image",
    label,
    accepts: ["image/*"],
  }),
  
  // Link field
  link: (label: string): FieldDefinition => ({
    type: "link",
    label,
    defaultValue: "",
  }),
  
  // Spacing field (for margin/padding)
  spacing: (label: string): FieldDefinition => ({
    type: "spacing",
    label,
    defaultValue: { top: 0, right: 0, bottom: 0, left: 0 },
  }),
  
  // Typography field
  typography: (label: string): FieldDefinition => ({
    type: "typography",
    label,
    defaultValue: {},
  }),
};

// =============================================================================
// PRESET OPTIONS
// =============================================================================

export const presetOptions = {
  padding: [
    { label: "None", value: "none" },
    { label: "Small", value: "sm" },
    { label: "Medium", value: "md" },
    { label: "Large", value: "lg" },
    { label: "Extra Large", value: "xl" },
  ],
  
  maxWidth: [
    { label: "Small", value: "sm" },
    { label: "Medium", value: "md" },
    { label: "Large", value: "lg" },
    { label: "Extra Large", value: "xl" },
    { label: "Full Width", value: "full" },
  ],
  
  alignment: [
    { label: "Left", value: "left" },
    { label: "Center", value: "center" },
    { label: "Right", value: "right" },
  ],
  
  textAlign: [
    { label: "Left", value: "left" },
    { label: "Center", value: "center" },
    { label: "Right", value: "right" },
    { label: "Justify", value: "justify" },
  ],
  
  headingLevel: [
    { label: "H1", value: "h1" },
    { label: "H2", value: "h2" },
    { label: "H3", value: "h3" },
    { label: "H4", value: "h4" },
    { label: "H5", value: "h5" },
    { label: "H6", value: "h6" },
  ],
  
  buttonVariant: [
    { label: "Primary", value: "primary" },
    { label: "Secondary", value: "secondary" },
    { label: "Outline", value: "outline" },
    { label: "Ghost", value: "ghost" },
  ],
  
  buttonSize: [
    { label: "Small", value: "sm" },
    { label: "Medium", value: "md" },
    { label: "Large", value: "lg" },
  ],
  
  fontSize: [
    { label: "Small", value: "sm" },
    { label: "Base", value: "base" },
    { label: "Large", value: "lg" },
    { label: "Extra Large", value: "xl" },
  ],
  
  shadow: [
    { label: "None", value: "none" },
    { label: "Small", value: "sm" },
    { label: "Medium", value: "md" },
    { label: "Large", value: "lg" },
  ],
  
  borderRadius: [
    { label: "None", value: "none" },
    { label: "Small", value: "sm" },
    { label: "Medium", value: "md" },
    { label: "Large", value: "lg" },
    { label: "Full", value: "full" },
  ],
  
  gap: [
    { label: "None", value: "none" },
    { label: "Small", value: "sm" },
    { label: "Medium", value: "md" },
    { label: "Large", value: "lg" },
  ],
  
  verticalAlign: [
    { label: "Top", value: "top" },
    { label: "Center", value: "center" },
    { label: "Bottom", value: "bottom" },
    { label: "Stretch", value: "stretch" },
  ],
  
  aspectRatio: [
    { label: "16:9", value: "16:9" },
    { label: "4:3", value: "4:3" },
    { label: "1:1", value: "1:1" },
    { label: "9:16", value: "9:16" },
  ],
  
  objectFit: [
    { label: "Cover", value: "cover" },
    { label: "Contain", value: "contain" },
    { label: "Fill", value: "fill" },
  ],
};

// =============================================================================
// EXPORTS
// =============================================================================

export type { FieldTypeDefinition };
```

**Acceptance Criteria:**
- [ ] Field registry singleton created
- [ ] Common field definitions available
- [ ] Preset options exported
- [ ] Validation functions work

---

### Task 2: Create Component Registry

**Description:** Create the main component registry with registration API and lookup functions.

**File:** `src/lib/studio/registry/component-registry.ts`

```tsx
/**
 * DRAMAC Studio Component Registry
 * 
 * Central registry for all editor components.
 * Supports core components and dynamic module components.
 */

import type { ComponentDefinition, ComponentCategory } from "@/types/studio";

// =============================================================================
// TYPES
// =============================================================================

export interface ComponentRegistryEntry {
  definition: ComponentDefinition;
  source: "core" | "module";
  moduleId?: string;
}

export interface CategoryInfo {
  id: ComponentCategory;
  label: string;
  description?: string;
  icon: string;
  order: number;
}

// =============================================================================
// CATEGORY DEFINITIONS
// =============================================================================

export const CATEGORIES: CategoryInfo[] = [
  { id: "layout", label: "Layout", icon: "LayoutGrid", order: 1, description: "Structural components" },
  { id: "typography", label: "Typography", icon: "Type", order: 2, description: "Text and headings" },
  { id: "buttons", label: "Buttons", icon: "MousePointer", order: 3, description: "Clickable elements" },
  { id: "media", label: "Media", icon: "Image", order: 4, description: "Images, videos, maps" },
  { id: "sections", label: "Sections", icon: "Layers", order: 5, description: "Pre-built sections" },
  { id: "navigation", label: "Navigation", icon: "Menu", order: 6, description: "Menus and footers" },
  { id: "forms", label: "Forms", icon: "FormInput", order: 7, description: "Form elements" },
  { id: "content", label: "Content", icon: "FileText", order: 8, description: "Rich content blocks" },
  { id: "interactive", label: "Interactive", icon: "Sparkles", order: 9, description: "Animated elements" },
  { id: "marketing", label: "Marketing", icon: "Megaphone", order: 10, description: "Conversion elements" },
  { id: "ecommerce", label: "E-Commerce", icon: "ShoppingCart", order: 11, description: "Store components" },
  { id: "3d", label: "3D & Effects", icon: "Box", order: 12, description: "3D and visual effects" },
  { id: "module", label: "Modules", icon: "Puzzle", order: 99, description: "From installed modules" },
];

// =============================================================================
// REGISTRY CLASS
// =============================================================================

class ComponentRegistry {
  private components: Map<string, ComponentRegistryEntry> = new Map();
  private categories: Map<ComponentCategory, CategoryInfo> = new Map();
  private moduleComponents: Map<string, Set<string>> = new Map(); // moduleId -> componentTypes

  constructor() {
    // Initialize categories
    for (const category of CATEGORIES) {
      this.categories.set(category.id, category);
    }
  }

  // ---------------------------------------------------------------------------
  // REGISTRATION
  // ---------------------------------------------------------------------------

  /**
   * Register a component definition
   */
  register(definition: ComponentDefinition, source: "core" | "module" = "core", moduleId?: string): void {
    const entry: ComponentRegistryEntry = {
      definition,
      source,
      moduleId,
    };

    this.components.set(definition.type, entry);

    // Track module components
    if (source === "module" && moduleId) {
      if (!this.moduleComponents.has(moduleId)) {
        this.moduleComponents.set(moduleId, new Set());
      }
      this.moduleComponents.get(moduleId)!.add(definition.type);
    }

    console.debug(`[Registry] Registered component: ${definition.type} (${source})`);
  }

  /**
   * Register multiple components
   */
  registerAll(definitions: ComponentDefinition[], source: "core" | "module" = "core", moduleId?: string): void {
    for (const definition of definitions) {
      this.register(definition, source, moduleId);
    }
  }

  /**
   * Unregister a component
   */
  unregister(type: string): boolean {
    const entry = this.components.get(type);
    if (!entry) return false;

    // Remove from module tracking
    if (entry.moduleId) {
      this.moduleComponents.get(entry.moduleId)?.delete(type);
    }

    return this.components.delete(type);
  }

  /**
   * Unregister all components from a module
   */
  unregisterModule(moduleId: string): void {
    const types = this.moduleComponents.get(moduleId);
    if (types) {
      for (const type of types) {
        this.components.delete(type);
      }
      this.moduleComponents.delete(moduleId);
    }
  }

  // ---------------------------------------------------------------------------
  // LOOKUP
  // ---------------------------------------------------------------------------

  /**
   * Get a component definition by type
   */
  get(type: string): ComponentDefinition | undefined {
    return this.components.get(type)?.definition;
  }

  /**
   * Get component entry with metadata
   */
  getEntry(type: string): ComponentRegistryEntry | undefined {
    return this.components.get(type);
  }

  /**
   * Check if component type exists
   */
  has(type: string): boolean {
    return this.components.has(type);
  }

  /**
   * Get all component definitions
   */
  getAll(): ComponentDefinition[] {
    return Array.from(this.components.values()).map((e) => e.definition);
  }

  /**
   * Get components by category
   */
  getByCategory(category: ComponentCategory): ComponentDefinition[] {
    return Array.from(this.components.values())
      .filter((e) => e.definition.category === category)
      .map((e) => e.definition)
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  /**
   * Get components grouped by category
   */
  getGroupedByCategory(): Map<ComponentCategory, ComponentDefinition[]> {
    const grouped = new Map<ComponentCategory, ComponentDefinition[]>();

    for (const category of this.categories.keys()) {
      const components = this.getByCategory(category);
      if (components.length > 0) {
        grouped.set(category, components);
      }
    }

    return grouped;
  }

  /**
   * Get category info
   */
  getCategory(id: ComponentCategory): CategoryInfo | undefined {
    return this.categories.get(id);
  }

  /**
   * Get all categories with components
   */
  getActiveCategories(): CategoryInfo[] {
    return CATEGORIES.filter((cat) => this.getByCategory(cat.id).length > 0)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Get module components
   */
  getModuleComponents(moduleId: string): ComponentDefinition[] {
    const types = this.moduleComponents.get(moduleId);
    if (!types) return [];

    return Array.from(types)
      .map((type) => this.get(type))
      .filter((d): d is ComponentDefinition => d !== undefined);
  }

  // ---------------------------------------------------------------------------
  // SEARCH
  // ---------------------------------------------------------------------------

  /**
   * Search components by text
   */
  search(query: string): ComponentDefinition[] {
    if (!query.trim()) {
      return this.getAll();
    }

    const lowerQuery = query.toLowerCase();

    return Array.from(this.components.values())
      .filter((entry) => {
        const def = entry.definition;
        return (
          def.type.toLowerCase().includes(lowerQuery) ||
          def.label.toLowerCase().includes(lowerQuery) ||
          def.description?.toLowerCase().includes(lowerQuery) ||
          def.keywords?.some((k) => k.toLowerCase().includes(lowerQuery))
        );
      })
      .map((e) => e.definition);
  }

  // ---------------------------------------------------------------------------
  // UTILITIES
  // ---------------------------------------------------------------------------

  /**
   * Get default props for a component type
   */
  getDefaultProps(type: string): Record<string, unknown> {
    const definition = this.get(type);
    if (!definition) return {};

    // Merge field defaults with explicit defaultProps
    const defaults: Record<string, unknown> = {};

    for (const [key, field] of Object.entries(definition.fields)) {
      if (field.defaultValue !== undefined) {
        defaults[key] = field.defaultValue;
      }
    }

    return { ...defaults, ...definition.defaultProps };
  }

  /**
   * Get component count
   */
  get count(): number {
    return this.components.size;
  }

  /**
   * Get core component count
   */
  get coreCount(): number {
    return Array.from(this.components.values()).filter((e) => e.source === "core").length;
  }

  /**
   * Get module component count
   */
  get moduleCount(): number {
    return Array.from(this.components.values()).filter((e) => e.source === "module").length;
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const componentRegistry = new ComponentRegistry();

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create a component definition with defaults
 */
export function defineComponent(
  partial: Partial<ComponentDefinition> & Pick<ComponentDefinition, "type" | "label" | "category" | "icon" | "render">
): ComponentDefinition {
  return {
    fields: {},
    defaultProps: {},
    acceptsChildren: false,
    canDelete: true,
    canDuplicate: true,
    canMove: true,
    ...partial,
  };
}

/**
 * Register a component (shorthand)
 */
export function registerComponent(definition: ComponentDefinition): void {
  componentRegistry.register(definition);
}

/**
 * Get component (shorthand)
 */
export function getComponent(type: string): ComponentDefinition | undefined {
  return componentRegistry.get(type);
}
```

**Acceptance Criteria:**
- [ ] Registry singleton created
- [ ] Registration/unregistration works
- [ ] Category system works
- [ ] Search functionality works
- [ ] Module component tracking works

---

### Task 3: Create Core Component Definitions

**Description:** Register all existing Puck components with Studio metadata. This creates wrapper definitions that use the existing render components.

**File:** `src/lib/studio/registry/core-components.ts`

```tsx
/**
 * DRAMAC Studio Core Components
 * 
 * Registers all built-in components from the existing Puck implementation.
 * Uses adapter pattern to wrap existing renders with Studio metadata.
 */

import { componentRegistry, defineComponent } from "./component-registry";
import { presetOptions, commonFields } from "./field-registry";
import type { ComponentDefinition, FieldDefinition } from "@/types/studio";

// Import existing render components
import {
  SectionRender,
  ContainerRender,
  ColumnsRender,
  CardRender,
  SpacerRender,
  DividerRender,
} from "@/components/editor/puck/components/layout";

import {
  HeadingRender,
  TextRender,
} from "@/components/editor/puck/components/typography";

import {
  ButtonRender,
  ButtonGroupRender,
  IconButtonRender,
} from "@/components/editor/puck/components/buttons";

import {
  ImageRender,
  VideoRender,
  MapRender,
} from "@/components/editor/puck/components/media";

import {
  HeroRender,
  FeaturesRender,
  CTARender,
  TestimonialsRender,
  FAQRender,
  StatsRender,
  TeamRender,
  GalleryRender,
} from "@/components/editor/puck/components/sections";

import {
  NavbarRender,
  FooterRender,
  SocialLinksRender,
} from "@/components/editor/puck/components/navigation";

import {
  FormRender,
  FormFieldRender,
  ContactFormRender,
  NewsletterRender,
} from "@/components/editor/puck/components/forms";

// =============================================================================
// LAYOUT COMPONENTS
// =============================================================================

const layoutComponents: ComponentDefinition[] = [
  defineComponent({
    type: "Section",
    label: "Section",
    description: "Full-width section with background options",
    category: "layout",
    icon: "Square",
    render: SectionRender,
    acceptsChildren: true,
    isContainer: true,
    fields: {
      backgroundColor: { type: "color", label: "Background Color" },
      backgroundImage: { type: "image", label: "Background Image" },
      padding: {
        type: "select",
        label: "Padding",
        options: presetOptions.padding,
        defaultValue: "md",
      },
      maxWidth: {
        type: "select",
        label: "Max Width",
        options: presetOptions.maxWidth,
        defaultValue: "xl",
      },
      minHeight: {
        type: "number",
        label: "Min Height (px)",
        min: 0,
        max: 1000,
        defaultValue: 0,
      },
    },
    defaultProps: {
      padding: "md",
      maxWidth: "xl",
      minHeight: 0,
    },
    ai: {
      description: "A full-width section that can contain other components",
      canModify: ["backgroundColor", "padding", "minHeight"],
      suggestions: ["Change background color", "Adjust padding"],
    },
  }),

  defineComponent({
    type: "Container",
    label: "Container",
    description: "Centered container with max-width",
    category: "layout",
    icon: "Box",
    render: ContainerRender,
    acceptsChildren: true,
    isContainer: true,
    fields: {
      maxWidth: {
        type: "select",
        label: "Max Width",
        options: presetOptions.maxWidth,
        defaultValue: "xl",
      },
      padding: {
        type: "select",
        label: "Padding",
        options: presetOptions.padding,
        defaultValue: "md",
      },
      backgroundColor: { type: "color", label: "Background Color" },
    },
    defaultProps: {
      maxWidth: "xl",
      padding: "md",
    },
    ai: {
      description: "A centered container with max-width constraint",
      canModify: ["maxWidth", "padding", "backgroundColor"],
    },
  }),

  defineComponent({
    type: "Columns",
    label: "Columns",
    description: "Multi-column layout grid",
    category: "layout",
    icon: "Columns",
    render: ColumnsRender,
    acceptsChildren: true,
    isContainer: true,
    zones: [
      { id: "column-1", label: "Column 1" },
      { id: "column-2", label: "Column 2" },
      { id: "column-3", label: "Column 3" },
      { id: "column-4", label: "Column 4" },
    ],
    fields: {
      columns: {
        type: "select",
        label: "Number of Columns",
        options: [
          { label: "2 Columns", value: "2" },
          { label: "3 Columns", value: "3" },
          { label: "4 Columns", value: "4" },
        ],
        defaultValue: "2",
      },
      gap: {
        type: "select",
        label: "Gap",
        options: presetOptions.gap,
        defaultValue: "md",
      },
      verticalAlign: {
        type: "select",
        label: "Vertical Align",
        options: presetOptions.verticalAlign,
        defaultValue: "top",
      },
      reverseOnMobile: {
        type: "toggle",
        label: "Reverse on Mobile",
        defaultValue: false,
      },
    },
    defaultProps: {
      columns: 2,
      gap: "md",
      verticalAlign: "top",
      reverseOnMobile: false,
    },
    ai: {
      description: "A multi-column layout grid",
      canModify: ["columns", "gap", "verticalAlign"],
    },
  }),

  defineComponent({
    type: "Card",
    label: "Card",
    description: "Card container with shadow and border",
    category: "layout",
    icon: "CreditCard",
    render: CardRender,
    acceptsChildren: true,
    isContainer: true,
    fields: {
      padding: {
        type: "select",
        label: "Padding",
        options: presetOptions.padding,
        defaultValue: "md",
      },
      shadow: {
        type: "select",
        label: "Shadow",
        options: presetOptions.shadow,
        defaultValue: "md",
      },
      borderRadius: {
        type: "select",
        label: "Border Radius",
        options: presetOptions.borderRadius,
        defaultValue: "md",
      },
      backgroundColor: { type: "color", label: "Background Color" },
      border: { type: "toggle", label: "Show Border", defaultValue: true },
    },
    defaultProps: {
      padding: "md",
      shadow: "md",
      borderRadius: "md",
      border: true,
    },
    ai: {
      description: "A card container with shadow and optional border",
      canModify: ["padding", "shadow", "backgroundColor"],
    },
  }),

  defineComponent({
    type: "Spacer",
    label: "Spacer",
    description: "Vertical spacing element",
    category: "layout",
    icon: "ArrowUpDown",
    render: SpacerRender,
    fields: {
      height: {
        type: "number",
        label: "Height (px)",
        min: 0,
        max: 500,
        defaultValue: 32,
      },
      mobileHeight: {
        type: "number",
        label: "Mobile Height (px)",
        min: 0,
        max: 500,
      },
    },
    defaultProps: {
      height: 32,
    },
    ai: {
      description: "Adds vertical spacing between components",
      canModify: ["height", "mobileHeight"],
    },
  }),

  defineComponent({
    type: "Divider",
    label: "Divider",
    description: "Horizontal line separator",
    category: "layout",
    icon: "Minus",
    render: DividerRender,
    fields: {
      color: { type: "color", label: "Color", defaultValue: "#e5e7eb" },
      thickness: {
        type: "number",
        label: "Thickness (px)",
        min: 1,
        max: 10,
        defaultValue: 1,
      },
      style: {
        type: "select",
        label: "Style",
        options: [
          { label: "Solid", value: "solid" },
          { label: "Dashed", value: "dashed" },
          { label: "Dotted", value: "dotted" },
        ],
        defaultValue: "solid",
      },
      margin: {
        type: "select",
        label: "Margin",
        options: presetOptions.padding,
        defaultValue: "md",
      },
    },
    defaultProps: {
      color: "#e5e7eb",
      thickness: 1,
      style: "solid",
      margin: "md",
    },
    ai: {
      description: "A horizontal line separator",
      canModify: ["color", "thickness", "style"],
    },
  }),
];

// =============================================================================
// TYPOGRAPHY COMPONENTS
// =============================================================================

const typographyComponents: ComponentDefinition[] = [
  defineComponent({
    type: "Heading",
    label: "Heading",
    description: "Heading text (H1-H6)",
    category: "typography",
    icon: "Heading",
    render: HeadingRender,
    fields: {
      text: {
        type: "textarea",
        label: "Text",
        rows: 2,
        defaultValue: "Heading Text",
      },
      level: {
        type: "select",
        label: "Level",
        options: presetOptions.headingLevel,
        defaultValue: "h2",
      },
      alignment: {
        type: "select",
        label: "Alignment",
        options: presetOptions.alignment,
        defaultValue: "left",
      },
      color: { type: "color", label: "Color" },
    },
    defaultProps: {
      text: "Heading Text",
      level: "h2",
      alignment: "left",
    },
    ai: {
      description: "A heading element for titles and section headers",
      canModify: ["text", "level", "alignment", "color"],
      suggestions: ["Make it more exciting", "Shorten it", "Add an emoji"],
    },
  }),

  defineComponent({
    type: "Text",
    label: "Text",
    description: "Paragraph text block",
    category: "typography",
    icon: "AlignLeft",
    render: TextRender,
    fields: {
      text: {
        type: "textarea",
        label: "Text",
        rows: 4,
        defaultValue: "Your text content goes here.",
      },
      alignment: {
        type: "select",
        label: "Alignment",
        options: presetOptions.textAlign,
        defaultValue: "left",
      },
      color: { type: "color", label: "Color" },
      fontSize: {
        type: "select",
        label: "Font Size",
        options: presetOptions.fontSize,
        defaultValue: "base",
      },
    },
    defaultProps: {
      text: "Your text content goes here.",
      alignment: "left",
      fontSize: "base",
    },
    ai: {
      description: "A paragraph text block",
      canModify: ["text", "alignment", "color", "fontSize"],
      suggestions: ["Make it shorter", "Make it longer", "Improve clarity"],
    },
  }),
];

// =============================================================================
// BUTTON COMPONENTS
// =============================================================================

const buttonComponents: ComponentDefinition[] = [
  defineComponent({
    type: "Button",
    label: "Button",
    description: "Clickable button with link",
    category: "buttons",
    icon: "MousePointer",
    render: ButtonRender,
    fields: {
      text: {
        type: "text",
        label: "Text",
        defaultValue: "Click Me",
      },
      link: { type: "link", label: "Link" },
      variant: {
        type: "select",
        label: "Variant",
        options: presetOptions.buttonVariant,
        defaultValue: "primary",
      },
      size: {
        type: "select",
        label: "Size",
        options: presetOptions.buttonSize,
        defaultValue: "md",
      },
      fullWidth: {
        type: "toggle",
        label: "Full Width",
        defaultValue: false,
      },
      openInNewTab: {
        type: "toggle",
        label: "Open in New Tab",
        defaultValue: false,
      },
    },
    defaultProps: {
      text: "Click Me",
      variant: "primary",
      size: "md",
      fullWidth: false,
      openInNewTab: false,
    },
    ai: {
      description: "A clickable button that can link to pages or URLs",
      canModify: ["text", "variant", "size"],
      suggestions: ["Make CTA more urgent", "Change to secondary style"],
    },
  }),

  defineComponent({
    type: "ButtonGroup",
    label: "Button Group",
    description: "Group of buttons",
    category: "buttons",
    icon: "Grid2X2",
    render: ButtonGroupRender,
    fields: {
      buttons: {
        type: "array",
        label: "Buttons",
        itemFields: {
          text: { type: "text", label: "Text" },
          link: { type: "link", label: "Link" },
          variant: {
            type: "select",
            label: "Variant",
            options: presetOptions.buttonVariant,
          },
        },
      },
      alignment: {
        type: "select",
        label: "Alignment",
        options: presetOptions.alignment,
        defaultValue: "left",
      },
      gap: {
        type: "select",
        label: "Gap",
        options: presetOptions.gap,
        defaultValue: "sm",
      },
    },
    defaultProps: {
      buttons: [
        { text: "Primary", variant: "primary" },
        { text: "Secondary", variant: "secondary" },
      ],
      alignment: "left",
      gap: "sm",
    },
    ai: {
      description: "A group of buttons displayed together",
      canModify: ["buttons", "alignment", "gap"],
    },
  }),

  defineComponent({
    type: "IconButton",
    label: "Icon Button",
    description: "Button with icon",
    category: "buttons",
    icon: "CircleDot",
    render: IconButtonRender,
    fields: {
      icon: {
        type: "text",
        label: "Icon Name",
        description: "Lucide icon name (e.g., ArrowRight)",
        defaultValue: "ArrowRight",
      },
      text: { type: "text", label: "Text (optional)" },
      link: { type: "link", label: "Link" },
      variant: {
        type: "select",
        label: "Variant",
        options: presetOptions.buttonVariant,
        defaultValue: "primary",
      },
      iconPosition: {
        type: "select",
        label: "Icon Position",
        options: [
          { label: "Left", value: "left" },
          { label: "Right", value: "right" },
        ],
        defaultValue: "left",
      },
    },
    defaultProps: {
      icon: "ArrowRight",
      variant: "primary",
      iconPosition: "left",
    },
    ai: {
      description: "A button with an icon",
      canModify: ["icon", "text", "variant"],
    },
  }),
];

// =============================================================================
// MEDIA COMPONENTS
// =============================================================================

const mediaComponents: ComponentDefinition[] = [
  defineComponent({
    type: "Image",
    label: "Image",
    description: "Image with responsive options",
    category: "media",
    icon: "Image",
    render: ImageRender,
    fields: {
      src: { type: "image", label: "Image" },
      alt: { type: "text", label: "Alt Text", defaultValue: "" },
      width: {
        type: "select",
        label: "Width",
        options: [
          { label: "Auto", value: "auto" },
          { label: "Full Width", value: "full" },
          { label: "Fixed", value: "fixed" },
        ],
        defaultValue: "full",
      },
      fixedWidth: {
        type: "number",
        label: "Fixed Width (px)",
        min: 50,
        max: 2000,
        showWhen: { field: "width", value: "fixed" },
      },
      height: {
        type: "select",
        label: "Height",
        options: [
          { label: "Auto", value: "auto" },
          { label: "Fixed", value: "fixed" },
        ],
        defaultValue: "auto",
      },
      fixedHeight: {
        type: "number",
        label: "Fixed Height (px)",
        min: 50,
        max: 2000,
        showWhen: { field: "height", value: "fixed" },
      },
      objectFit: {
        type: "select",
        label: "Object Fit",
        options: presetOptions.objectFit,
        defaultValue: "cover",
      },
      borderRadius: {
        type: "select",
        label: "Border Radius",
        options: presetOptions.borderRadius,
        defaultValue: "none",
      },
    },
    defaultProps: {
      alt: "",
      width: "full",
      height: "auto",
      objectFit: "cover",
      borderRadius: "none",
    },
    ai: {
      description: "An image element with responsive sizing",
      canModify: ["alt", "width", "height", "borderRadius"],
      suggestions: ["Add descriptive alt text"],
    },
  }),

  defineComponent({
    type: "Video",
    label: "Video",
    description: "Embedded video player",
    category: "media",
    icon: "Video",
    render: VideoRender,
    fields: {
      url: { type: "text", label: "Video URL" },
      type: {
        type: "select",
        label: "Type",
        options: [
          { label: "YouTube", value: "youtube" },
          { label: "Vimeo", value: "vimeo" },
          { label: "File", value: "file" },
        ],
        defaultValue: "youtube",
      },
      autoplay: { type: "toggle", label: "Autoplay", defaultValue: false },
      muted: { type: "toggle", label: "Muted", defaultValue: false },
      loop: { type: "toggle", label: "Loop", defaultValue: false },
      controls: { type: "toggle", label: "Show Controls", defaultValue: true },
      aspectRatio: {
        type: "select",
        label: "Aspect Ratio",
        options: presetOptions.aspectRatio,
        defaultValue: "16:9",
      },
    },
    defaultProps: {
      type: "youtube",
      autoplay: false,
      muted: false,
      loop: false,
      controls: true,
      aspectRatio: "16:9",
    },
    ai: {
      description: "An embedded video player (YouTube, Vimeo, or file)",
      canModify: ["aspectRatio", "autoplay", "controls"],
    },
  }),

  defineComponent({
    type: "Map",
    label: "Map",
    description: "Embedded map",
    category: "media",
    icon: "MapPin",
    render: MapRender,
    fields: {
      address: { type: "text", label: "Address" },
      latitude: { type: "number", label: "Latitude" },
      longitude: { type: "number", label: "Longitude" },
      zoom: {
        type: "number",
        label: "Zoom",
        min: 1,
        max: 20,
        defaultValue: 15,
      },
      height: {
        type: "number",
        label: "Height (px)",
        min: 100,
        max: 800,
        defaultValue: 400,
      },
      style: {
        type: "select",
        label: "Style",
        options: [
          { label: "Roadmap", value: "roadmap" },
          { label: "Satellite", value: "satellite" },
          { label: "Hybrid", value: "hybrid" },
          { label: "Terrain", value: "terrain" },
        ],
        defaultValue: "roadmap",
      },
    },
    defaultProps: {
      zoom: 15,
      height: 400,
      style: "roadmap",
    },
    ai: {
      description: "An embedded map showing a location",
      canModify: ["address", "zoom", "height", "style"],
    },
  }),
];

// =============================================================================
// SECTION COMPONENTS
// =============================================================================

const sectionComponents: ComponentDefinition[] = [
  defineComponent({
    type: "Hero",
    label: "Hero",
    description: "Hero section with title, subtitle, and CTA",
    category: "sections",
    icon: "Star",
    render: HeroRender,
    fields: {
      title: {
        type: "text",
        label: "Title",
        defaultValue: "Welcome to Our Site",
      },
      subtitle: {
        type: "textarea",
        label: "Subtitle",
        rows: 2,
        defaultValue: "Discover amazing features and services.",
      },
      buttonText: { type: "text", label: "Button Text", defaultValue: "Get Started" },
      buttonLink: { type: "link", label: "Button Link" },
      backgroundColor: { type: "color", label: "Background Color" },
      backgroundImage: { type: "image", label: "Background Image" },
      textColor: { type: "color", label: "Text Color" },
      alignment: {
        type: "select",
        label: "Alignment",
        options: presetOptions.alignment,
        defaultValue: "center",
      },
      minHeight: {
        type: "number",
        label: "Min Height (px)",
        min: 200,
        max: 1000,
        defaultValue: 500,
      },
      overlay: { type: "toggle", label: "Show Overlay", defaultValue: false },
      overlayOpacity: {
        type: "number",
        label: "Overlay Opacity",
        min: 0,
        max: 100,
        defaultValue: 50,
        showWhen: { field: "overlay", value: true },
      },
    },
    defaultProps: {
      title: "Welcome to Our Site",
      subtitle: "Discover amazing features and services.",
      buttonText: "Get Started",
      alignment: "center",
      minHeight: 500,
      overlay: false,
      overlayOpacity: 50,
    },
    ai: {
      description: "A hero section with title, subtitle, and call-to-action button",
      canModify: ["title", "subtitle", "buttonText", "backgroundColor", "alignment"],
      suggestions: ["Make title more impactful", "Add urgency to CTA", "Change color scheme"],
    },
  }),

  defineComponent({
    type: "Features",
    label: "Features",
    description: "Feature grid with icons",
    category: "sections",
    icon: "Grid3X3",
    render: FeaturesRender,
    fields: {
      title: { type: "text", label: "Section Title", defaultValue: "Our Features" },
      subtitle: { type: "textarea", label: "Section Subtitle" },
      features: {
        type: "array",
        label: "Features",
        itemFields: {
          icon: { type: "text", label: "Icon Name" },
          title: { type: "text", label: "Title" },
          description: { type: "textarea", label: "Description" },
        },
      },
      columns: {
        type: "select",
        label: "Columns",
        options: [
          { label: "2 Columns", value: "2" },
          { label: "3 Columns", value: "3" },
          { label: "4 Columns", value: "4" },
        ],
        defaultValue: "3",
      },
    },
    defaultProps: {
      title: "Our Features",
      features: [
        { icon: "Zap", title: "Fast", description: "Lightning quick performance" },
        { icon: "Shield", title: "Secure", description: "Enterprise-grade security" },
        { icon: "Heart", title: "Loved", description: "Used by thousands" },
      ],
      columns: 3,
    },
    ai: {
      description: "A grid of features with icons, titles, and descriptions",
      canModify: ["title", "subtitle", "features", "columns"],
      suggestions: ["Add more features", "Improve feature descriptions"],
    },
  }),

  defineComponent({
    type: "CTA",
    label: "CTA",
    description: "Call-to-action section",
    category: "sections",
    icon: "Megaphone",
    render: CTARender,
    fields: {
      title: { type: "text", label: "Title", defaultValue: "Ready to Get Started?" },
      subtitle: { type: "textarea", label: "Subtitle" },
      buttonText: { type: "text", label: "Button Text", defaultValue: "Start Now" },
      buttonLink: { type: "link", label: "Button Link" },
      secondaryButtonText: { type: "text", label: "Secondary Button Text" },
      secondaryButtonLink: { type: "link", label: "Secondary Button Link" },
      backgroundColor: { type: "color", label: "Background Color" },
      textColor: { type: "color", label: "Text Color" },
    },
    defaultProps: {
      title: "Ready to Get Started?",
      buttonText: "Start Now",
    },
    ai: {
      description: "A call-to-action section to drive conversions",
      canModify: ["title", "subtitle", "buttonText", "backgroundColor"],
      suggestions: ["Add urgency", "Make CTA more compelling"],
    },
  }),

  defineComponent({
    type: "Testimonials",
    label: "Testimonials",
    description: "Customer testimonials section",
    category: "sections",
    icon: "Quote",
    render: TestimonialsRender,
    fields: {
      title: { type: "text", label: "Section Title", defaultValue: "What Our Customers Say" },
      testimonials: {
        type: "array",
        label: "Testimonials",
        itemFields: {
          quote: { type: "textarea", label: "Quote" },
          author: { type: "text", label: "Author Name" },
          role: { type: "text", label: "Role/Company" },
          avatar: { type: "image", label: "Avatar" },
        },
      },
      layout: {
        type: "select",
        label: "Layout",
        options: [
          { label: "Grid", value: "grid" },
          { label: "Carousel", value: "carousel" },
        ],
        defaultValue: "grid",
      },
    },
    defaultProps: {
      title: "What Our Customers Say",
      testimonials: [
        { quote: "Amazing product!", author: "John Doe", role: "CEO, Company" },
      ],
      layout: "grid",
    },
    ai: {
      description: "A section displaying customer testimonials",
      canModify: ["title", "testimonials", "layout"],
      suggestions: ["Add more testimonials", "Improve quote impact"],
    },
  }),

  defineComponent({
    type: "FAQ",
    label: "FAQ",
    description: "Frequently asked questions",
    category: "sections",
    icon: "HelpCircle",
    render: FAQRender,
    fields: {
      title: { type: "text", label: "Section Title", defaultValue: "Frequently Asked Questions" },
      faqs: {
        type: "array",
        label: "FAQs",
        itemFields: {
          question: { type: "text", label: "Question" },
          answer: { type: "textarea", label: "Answer" },
        },
      },
    },
    defaultProps: {
      title: "Frequently Asked Questions",
      faqs: [
        { question: "How does it work?", answer: "It's simple and easy to use." },
      ],
    },
    ai: {
      description: "An FAQ accordion section",
      canModify: ["title", "faqs"],
      suggestions: ["Add more FAQs", "Improve answer clarity"],
    },
  }),

  defineComponent({
    type: "Stats",
    label: "Stats",
    description: "Statistics/numbers section",
    category: "sections",
    icon: "BarChart3",
    render: StatsRender,
    fields: {
      title: { type: "text", label: "Section Title" },
      stats: {
        type: "array",
        label: "Stats",
        itemFields: {
          value: { type: "text", label: "Value" },
          label: { type: "text", label: "Label" },
          prefix: { type: "text", label: "Prefix" },
          suffix: { type: "text", label: "Suffix" },
        },
      },
      backgroundColor: { type: "color", label: "Background Color" },
    },
    defaultProps: {
      stats: [
        { value: "100", label: "Customers", suffix: "+" },
        { value: "50", label: "Projects", suffix: "K" },
        { value: "99", label: "Satisfaction", suffix: "%" },
      ],
    },
    ai: {
      description: "A section displaying statistics and numbers",
      canModify: ["title", "stats", "backgroundColor"],
      suggestions: ["Update numbers", "Add more stats"],
    },
  }),

  defineComponent({
    type: "Team",
    label: "Team",
    description: "Team members section",
    category: "sections",
    icon: "Users",
    render: TeamRender,
    fields: {
      title: { type: "text", label: "Section Title", defaultValue: "Our Team" },
      members: {
        type: "array",
        label: "Team Members",
        itemFields: {
          name: { type: "text", label: "Name" },
          role: { type: "text", label: "Role" },
          image: { type: "image", label: "Photo" },
          bio: { type: "textarea", label: "Bio" },
        },
      },
      columns: {
        type: "select",
        label: "Columns",
        options: [
          { label: "3 Columns", value: "3" },
          { label: "4 Columns", value: "4" },
        ],
        defaultValue: "4",
      },
    },
    defaultProps: {
      title: "Our Team",
      members: [],
      columns: 4,
    },
    ai: {
      description: "A section displaying team member profiles",
      canModify: ["title", "members", "columns"],
    },
  }),

  defineComponent({
    type: "Gallery",
    label: "Gallery",
    description: "Image gallery grid",
    category: "sections",
    icon: "Images",
    render: GalleryRender,
    fields: {
      title: { type: "text", label: "Section Title" },
      images: {
        type: "array",
        label: "Images",
        itemFields: {
          src: { type: "image", label: "Image" },
          alt: { type: "text", label: "Alt Text" },
          caption: { type: "text", label: "Caption" },
        },
      },
      columns: {
        type: "select",
        label: "Columns",
        options: [
          { label: "2 Columns", value: "2" },
          { label: "3 Columns", value: "3" },
          { label: "4 Columns", value: "4" },
        ],
        defaultValue: "3",
      },
      gap: {
        type: "select",
        label: "Gap",
        options: presetOptions.gap,
        defaultValue: "md",
      },
    },
    defaultProps: {
      images: [],
      columns: 3,
      gap: "md",
    },
    ai: {
      description: "An image gallery displayed in a grid",
      canModify: ["title", "columns", "gap"],
    },
  }),
];

// =============================================================================
// NAVIGATION COMPONENTS
// =============================================================================

const navigationComponents: ComponentDefinition[] = [
  defineComponent({
    type: "Navbar",
    label: "Navbar",
    description: "Site navigation header",
    category: "navigation",
    icon: "Menu",
    render: NavbarRender,
    fields: {
      logo: { type: "image", label: "Logo" },
      logoText: { type: "text", label: "Logo Text" },
      links: {
        type: "array",
        label: "Navigation Links",
        itemFields: {
          text: { type: "text", label: "Text" },
          href: { type: "link", label: "Link" },
        },
      },
      ctaText: { type: "text", label: "CTA Button Text" },
      ctaLink: { type: "link", label: "CTA Button Link" },
      sticky: { type: "toggle", label: "Sticky Header", defaultValue: false },
      backgroundColor: { type: "color", label: "Background Color" },
    },
    defaultProps: {
      links: [
        { text: "Home", href: "/" },
        { text: "About", href: "/about" },
        { text: "Contact", href: "/contact" },
      ],
      sticky: false,
    },
    ai: {
      description: "A navigation header with logo and links",
      canModify: ["logoText", "links", "ctaText", "backgroundColor"],
    },
  }),

  defineComponent({
    type: "Footer",
    label: "Footer",
    description: "Site footer",
    category: "navigation",
    icon: "Footprints",
    render: FooterRender,
    fields: {
      logo: { type: "image", label: "Logo" },
      companyName: { type: "text", label: "Company Name" },
      description: { type: "textarea", label: "Description" },
      columns: {
        type: "array",
        label: "Link Columns",
        itemFields: {
          title: { type: "text", label: "Column Title" },
          links: {
            type: "array",
            label: "Links",
            itemFields: {
              text: { type: "text", label: "Text" },
              href: { type: "link", label: "Link" },
            },
          },
        },
      },
      copyright: { type: "text", label: "Copyright Text" },
      backgroundColor: { type: "color", label: "Background Color" },
    },
    defaultProps: {
      companyName: "Your Company",
      copyright: "© 2024 Your Company. All rights reserved.",
      columns: [],
    },
    ai: {
      description: "A site footer with links and copyright",
      canModify: ["companyName", "description", "copyright", "backgroundColor"],
    },
  }),

  defineComponent({
    type: "SocialLinks",
    label: "Social Links",
    description: "Social media icon links",
    category: "navigation",
    icon: "Share2",
    render: SocialLinksRender,
    fields: {
      links: {
        type: "array",
        label: "Social Links",
        itemFields: {
          platform: {
            type: "select",
            label: "Platform",
            options: [
              { label: "Facebook", value: "facebook" },
              { label: "Twitter", value: "twitter" },
              { label: "Instagram", value: "instagram" },
              { label: "LinkedIn", value: "linkedin" },
              { label: "YouTube", value: "youtube" },
              { label: "TikTok", value: "tiktok" },
            ],
          },
          url: { type: "link", label: "URL" },
        },
      },
      size: {
        type: "select",
        label: "Icon Size",
        options: presetOptions.buttonSize,
        defaultValue: "md",
      },
      color: { type: "color", label: "Icon Color" },
    },
    defaultProps: {
      links: [],
      size: "md",
    },
    ai: {
      description: "Social media icon links",
      canModify: ["links", "size", "color"],
    },
  }),
];

// =============================================================================
// FORM COMPONENTS
// =============================================================================

const formComponents: ComponentDefinition[] = [
  defineComponent({
    type: "Form",
    label: "Form",
    description: "Custom form container",
    category: "forms",
    icon: "ClipboardList",
    render: FormRender,
    acceptsChildren: true,
    isContainer: true,
    fields: {
      action: { type: "text", label: "Form Action URL" },
      method: {
        type: "select",
        label: "Method",
        options: [
          { label: "POST", value: "post" },
          { label: "GET", value: "get" },
        ],
        defaultValue: "post",
      },
      submitText: { type: "text", label: "Submit Button Text", defaultValue: "Submit" },
      successMessage: { type: "text", label: "Success Message" },
    },
    defaultProps: {
      method: "post",
      submitText: "Submit",
    },
    ai: {
      description: "A form container for custom forms",
      canModify: ["submitText", "successMessage"],
    },
  }),

  defineComponent({
    type: "FormField",
    label: "Form Field",
    description: "Form input field",
    category: "forms",
    icon: "FormInput",
    render: FormFieldRender,
    fields: {
      label: { type: "text", label: "Label" },
      name: { type: "text", label: "Field Name" },
      type: {
        type: "select",
        label: "Type",
        options: [
          { label: "Text", value: "text" },
          { label: "Email", value: "email" },
          { label: "Phone", value: "tel" },
          { label: "Number", value: "number" },
          { label: "Textarea", value: "textarea" },
          { label: "Select", value: "select" },
          { label: "Checkbox", value: "checkbox" },
        ],
        defaultValue: "text",
      },
      placeholder: { type: "text", label: "Placeholder" },
      required: { type: "toggle", label: "Required", defaultValue: false },
      options: {
        type: "array",
        label: "Options (for Select)",
        itemFields: {
          label: { type: "text", label: "Label" },
          value: { type: "text", label: "Value" },
        },
        showWhen: { field: "type", value: "select" },
      },
    },
    defaultProps: {
      type: "text",
      required: false,
    },
    ai: {
      description: "A form input field",
      canModify: ["label", "placeholder", "required"],
    },
  }),

  defineComponent({
    type: "ContactForm",
    label: "Contact Form",
    description: "Pre-built contact form",
    category: "forms",
    icon: "Mail",
    render: ContactFormRender,
    fields: {
      title: { type: "text", label: "Title", defaultValue: "Contact Us" },
      subtitle: { type: "textarea", label: "Subtitle" },
      emailTo: { type: "text", label: "Send To Email" },
      submitText: { type: "text", label: "Submit Button Text", defaultValue: "Send Message" },
      successMessage: { type: "text", label: "Success Message", defaultValue: "Thanks! We'll be in touch." },
      showPhone: { type: "toggle", label: "Show Phone Field", defaultValue: true },
      showSubject: { type: "toggle", label: "Show Subject Field", defaultValue: true },
    },
    defaultProps: {
      title: "Contact Us",
      submitText: "Send Message",
      successMessage: "Thanks! We'll be in touch.",
      showPhone: true,
      showSubject: true,
    },
    ai: {
      description: "A pre-built contact form with name, email, and message fields",
      canModify: ["title", "subtitle", "submitText", "successMessage"],
    },
  }),

  defineComponent({
    type: "Newsletter",
    label: "Newsletter",
    description: "Email signup form",
    category: "forms",
    icon: "Newspaper",
    render: NewsletterRender,
    fields: {
      title: { type: "text", label: "Title", defaultValue: "Subscribe to our newsletter" },
      subtitle: { type: "textarea", label: "Subtitle" },
      placeholder: { type: "text", label: "Placeholder", defaultValue: "Enter your email" },
      submitText: { type: "text", label: "Button Text", defaultValue: "Subscribe" },
      successMessage: { type: "text", label: "Success Message", defaultValue: "Thanks for subscribing!" },
      layout: {
        type: "select",
        label: "Layout",
        options: [
          { label: "Inline", value: "inline" },
          { label: "Stacked", value: "stacked" },
        ],
        defaultValue: "inline",
      },
    },
    defaultProps: {
      title: "Subscribe to our newsletter",
      placeholder: "Enter your email",
      submitText: "Subscribe",
      successMessage: "Thanks for subscribing!",
      layout: "inline",
    },
    ai: {
      description: "An email newsletter signup form",
      canModify: ["title", "subtitle", "submitText", "successMessage"],
    },
  }),
];

// =============================================================================
// REGISTER ALL COMPONENTS
// =============================================================================

/**
 * Register all core components with the registry
 */
export function registerCoreComponents(): void {
  const allComponents = [
    ...layoutComponents,
    ...typographyComponents,
    ...buttonComponents,
    ...mediaComponents,
    ...sectionComponents,
    ...navigationComponents,
    ...formComponents,
  ];

  componentRegistry.registerAll(allComponents, "core");
  
  console.log(`[Studio] Registered ${componentRegistry.coreCount} core components`);
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  layoutComponents,
  typographyComponents,
  buttonComponents,
  mediaComponents,
  sectionComponents,
  navigationComponents,
  formComponents,
};
```

**Note:** This file registers a subset of components. Additional components (content, interactive, marketing, ecommerce, 3D, spline) should be added following the same pattern. The full implementation would include all 116+ components.

**Acceptance Criteria:**
- [ ] All component categories registered
- [ ] Components have proper field definitions
- [ ] AI config added to components
- [ ] Default props provided
- [ ] Render components imported from existing Puck files

---

### Task 4: Create Registry Index and Initialization

**Description:** Create the main registry exports and initialization function.

**File:** `src/lib/studio/registry/index.ts`

```tsx
/**
 * DRAMAC Studio Component Registry
 * 
 * Central exports for the component registry system.
 */

export {
  componentRegistry,
  defineComponent,
  registerComponent,
  getComponent,
  CATEGORIES,
  type ComponentRegistryEntry,
  type CategoryInfo,
} from "./component-registry";

export {
  fieldRegistry,
  commonFields,
  presetOptions,
  validateNumber,
  validateText,
  type FieldTypeDefinition,
} from "./field-registry";

export { registerCoreComponents } from "./core-components";

// =============================================================================
// INITIALIZATION
// =============================================================================

let initialized = false;

/**
 * Initialize the Studio component registry
 * Call this once at app startup
 */
export function initializeRegistry(): void {
  if (initialized) {
    console.warn("[Studio] Registry already initialized");
    return;
  }

  const { registerCoreComponents } = require("./core-components");
  registerCoreComponents();
  
  initialized = true;
  console.log("[Studio] Registry initialized");
}

/**
 * Check if registry is initialized
 */
export function isRegistryInitialized(): boolean {
  return initialized;
}
```

**File:** `src/components/studio/core/studio-provider.tsx` (Update to initialize registry)

Add this import and call at the top of the StudioProvider:

```tsx
import { initializeRegistry, isRegistryInitialized } from "@/lib/studio/registry";

// ... in the useEffect for initialization:
useEffect(() => {
  // Initialize registry if not already done
  if (!isRegistryInitialized()) {
    initializeRegistry();
  }
  
  // ... rest of initialization
}, [...]);
```

**Acceptance Criteria:**
- [ ] Registry initializes on first load
- [ ] Multiple initializations prevented
- [ ] All exports available from index

---

### Task 5: Create Registry Hooks

**Description:** Create React hooks for accessing the registry.

**File:** `src/lib/studio/registry/hooks.ts`

```tsx
/**
 * DRAMAC Studio Registry Hooks
 * 
 * React hooks for accessing component and field registries.
 */

import { useMemo, useCallback } from "react";
import { componentRegistry, CATEGORIES, type CategoryInfo } from "./component-registry";
import { fieldRegistry } from "./field-registry";
import type { ComponentDefinition, FieldDefinition, ComponentCategory } from "@/types/studio";

/**
 * Hook to get all components
 */
export function useComponents(): ComponentDefinition[] {
  return useMemo(() => componentRegistry.getAll(), []);
}

/**
 * Hook to get a specific component definition
 */
export function useComponent(type: string): ComponentDefinition | undefined {
  return useMemo(() => componentRegistry.get(type), [type]);
}

/**
 * Hook to get components by category
 */
export function useComponentsByCategory(category: ComponentCategory): ComponentDefinition[] {
  return useMemo(() => componentRegistry.getByCategory(category), [category]);
}

/**
 * Hook to get components grouped by category
 */
export function useComponentsGrouped(): Map<ComponentCategory, ComponentDefinition[]> {
  return useMemo(() => componentRegistry.getGroupedByCategory(), []);
}

/**
 * Hook to get active categories (categories with components)
 */
export function useActiveCategories(): CategoryInfo[] {
  return useMemo(() => componentRegistry.getActiveCategories(), []);
}

/**
 * Hook to get all categories
 */
export function useCategories(): CategoryInfo[] {
  return CATEGORIES;
}

/**
 * Hook to search components
 */
export function useComponentSearch(query: string): ComponentDefinition[] {
  return useMemo(() => componentRegistry.search(query), [query]);
}

/**
 * Hook to get default props for a component type
 */
export function useDefaultProps(type: string): Record<string, unknown> {
  return useMemo(() => componentRegistry.getDefaultProps(type), [type]);
}

/**
 * Hook to validate field values
 */
export function useFieldValidator() {
  return useCallback((value: unknown, field: FieldDefinition): string | null => {
    return fieldRegistry.validate(value, field);
  }, []);
}

/**
 * Hook to get component count
 */
export function useComponentCount(): { total: number; core: number; module: number } {
  return useMemo(() => ({
    total: componentRegistry.count,
    core: componentRegistry.coreCount,
    module: componentRegistry.moduleCount,
  }), []);
}
```

Add to `src/lib/studio/registry/index.ts`:

```tsx
export * from "./hooks";
```

**Acceptance Criteria:**
- [ ] All hooks work correctly
- [ ] Hooks are memoized properly
- [ ] TypeScript types are correct

---

## File Summary

| Action | Path | Description |
|--------|------|-------------|
| CREATE | `src/lib/studio/registry/field-registry.ts` | Field type definitions and registry |
| CREATE | `src/lib/studio/registry/component-registry.ts` | Component registration and lookup |
| CREATE | `src/lib/studio/registry/core-components.ts` | All core component definitions |
| CREATE | `src/lib/studio/registry/hooks.ts` | React hooks for registry access |
| UPDATE | `src/lib/studio/registry/index.ts` | Export all registry modules |
| UPDATE | `src/components/studio/core/studio-provider.tsx` | Initialize registry |

---

## Testing Requirements

### Manual Testing
- [ ] Load studio page - registry should initialize
- [ ] Check console for "Registered X core components" message
- [ ] Verify `componentRegistry.count` returns expected number
- [ ] Test search functionality
- [ ] Test category filtering

### Unit Tests (Optional)
- [ ] Test component registration
- [ ] Test component lookup
- [ ] Test search functionality
- [ ] Test field validation

---

## Dependencies to Install

No new dependencies required for this phase.

---

## Notes for Implementation

1. **Component Imports**: The core-components.ts file imports from existing Puck render files. If any import fails, check the actual export names in those files.

2. **Partial Implementation**: This phase registers a subset of components. Additional components should be added following the same pattern.

3. **Field Types**: The field registry prepares for Phase STUDIO-08+ when field renderers are implemented.

4. **Module Support**: The registry is designed to support module components added in Phase STUDIO-14.

5. **AI Config**: Each component includes AI configuration for Phase STUDIO-11+.

---

## Success Criteria

- [ ] Field registry created with common field definitions
- [ ] Component registry created with category system
- [ ] Core components registered (40+ initially, 116+ full)
- [ ] Search functionality works
- [ ] Category grouping works
- [ ] Hooks provide easy access to registry data
- [ ] Registry initializes automatically in provider
- [ ] `npx tsc --noEmit` returns zero errors

---

## Component Count Target

| Category | Target Count |
|----------|-------------|
| Layout | 6 |
| Typography | 2 |
| Buttons | 3 |
| Media | 3 |
| Sections | 8 |
| Navigation | 3 |
| Forms | 4 |
| Content | 16 |
| Interactive | 10 |
| Marketing | 10 |
| E-Commerce | 20 |
| 3D/Spline | 10 |
| **Total** | **95+** |

The full implementation should match or exceed the existing Puck component count.
