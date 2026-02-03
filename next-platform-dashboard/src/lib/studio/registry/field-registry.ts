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
  render?: ComponentType<FieldRenderProps>;
  
  /** Validate field value */
  validate?: (value: unknown, field: FieldDefinition) => string | null;
  
  /** Transform value before save */
  serialize?: (value: unknown) => unknown;
  
  /** Transform value after load */
  deserialize?: (value: unknown) => unknown;
}

/**
 * Custom field definition for module-specific fields
 */
export interface CustomFieldDefinition {
  /** Custom field type identifier (e.g., "ecommerce:product-selector") */
  type: string;
  
  /** Display name */
  label: string;
  
  /** Module this field belongs to */
  moduleId: string;
  moduleName: string;
  
  /** The editor component */
  render: ComponentType<FieldRenderProps>;
  
  /** Default options */
  defaultOptions?: Record<string, unknown>;
  
  /** Validate value */
  validate?: (value: unknown, options?: Record<string, unknown>) => string | null;
}

// =============================================================================
// REGISTRY
// =============================================================================

class FieldRegistry {
  private fields: Map<FieldType, FieldTypeDefinition> = new Map();
  private customRenderers: Map<string, ComponentType<FieldRenderProps>> = new Map();
  private customDefinitions: Map<string, CustomFieldDefinition> = new Map();

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

  // ===========================================================================
  // CUSTOM FIELD METHODS
  // ===========================================================================

  /**
   * Register a custom field from a module
   */
  registerCustomField(definition: CustomFieldDefinition): void {
    this.customDefinitions.set(definition.type, definition);
    this.customRenderers.set(definition.type, definition.render);
    
    console.debug(`[FieldRegistry] Registered custom field: ${definition.type}`);
  }

  /**
   * Unregister custom fields from a module
   */
  unregisterModuleFields(moduleId: string): void {
    for (const [type, def] of this.customDefinitions.entries()) {
      if (def.moduleId === moduleId) {
        this.customDefinitions.delete(type);
        this.customRenderers.delete(type);
      }
    }
  }

  /**
   * Get custom field definition
   */
  getCustomFieldDefinition(type: string): CustomFieldDefinition | undefined {
    return this.customDefinitions.get(type);
  }

  /**
   * Get all custom fields for a module
   */
  getModuleCustomFields(moduleId: string): CustomFieldDefinition[] {
    return Array.from(this.customDefinitions.values())
      .filter(def => def.moduleId === moduleId);
  }

  /**
   * Check if custom field exists
   */
  hasCustomField(type: string): boolean {
    return this.customDefinitions.has(type);
  }

  /**
   * Get all custom field types
   */
  getCustomFieldTypes(): string[] {
    return Array.from(this.customDefinitions.keys());
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
// FIELD TYPE METADATA (Phase STUDIO-09)
// =============================================================================

/**
 * Field type metadata for UI
 */
export interface FieldTypeMeta {
  type: FieldType;
  label: string;
  description: string;
  icon: string;
  supportsResponsive: boolean;
}

/**
 * Registry of all field types with metadata
 */
export const FIELD_TYPE_REGISTRY: Record<FieldType, FieldTypeMeta> = {
  text: {
    type: 'text',
    label: 'Text',
    description: 'Single line text input',
    icon: 'type',
    supportsResponsive: false,
  },
  textarea: {
    type: 'textarea',
    label: 'Text Area',
    description: 'Multi-line text input',
    icon: 'align-left',
    supportsResponsive: false,
  },
  number: {
    type: 'number',
    label: 'Number',
    description: 'Numeric input with optional min/max',
    icon: 'hash',
    supportsResponsive: true,
  },
  select: {
    type: 'select',
    label: 'Select',
    description: 'Dropdown selection',
    icon: 'chevron-down',
    supportsResponsive: false,
  },
  radio: {
    type: 'radio',
    label: 'Radio',
    description: 'Radio button selection',
    icon: 'circle-dot',
    supportsResponsive: false,
  },
  checkbox: {
    type: 'checkbox',
    label: 'Checkbox',
    description: 'Boolean checkbox',
    icon: 'check-square',
    supportsResponsive: false,
  },
  toggle: {
    type: 'toggle',
    label: 'Toggle',
    description: 'Boolean switch',
    icon: 'toggle-right',
    supportsResponsive: false,
  },
  color: {
    type: 'color',
    label: 'Color',
    description: 'Color picker with presets',
    icon: 'palette',
    supportsResponsive: false,
  },
  image: {
    type: 'image',
    label: 'Image',
    description: 'Image upload or URL',
    icon: 'image',
    supportsResponsive: false,
  },
  link: {
    type: 'link',
    label: 'Link',
    description: 'URL or page link',
    icon: 'link',
    supportsResponsive: false,
  },
  spacing: {
    type: 'spacing',
    label: 'Spacing',
    description: 'Visual margin/padding editor',
    icon: 'square',
    supportsResponsive: true,
  },
  typography: {
    type: 'typography',
    label: 'Typography',
    description: 'Font and text settings',
    icon: 'type',
    supportsResponsive: true,
  },
  array: {
    type: 'array',
    label: 'Array',
    description: 'List of items',
    icon: 'list',
    supportsResponsive: false,
  },
  object: {
    type: 'object',
    label: 'Object',
    description: 'Nested object fields',
    icon: 'braces',
    supportsResponsive: false,
  },
  richtext: {
    type: 'richtext',
    label: 'Rich Text',
    description: 'Rich text editor (TipTap)',
    icon: 'file-text',
    supportsResponsive: false,
  },
  code: {
    type: 'code',
    label: 'Code',
    description: 'Code editor input',
    icon: 'code',
    supportsResponsive: false,
  },
  slider: {
    type: 'slider',
    label: 'Slider',
    description: 'Range slider input',
    icon: 'sliders',
    supportsResponsive: true,
  },
  custom: {
    type: 'custom',
    label: 'Custom',
    description: 'Custom field renderer',
    icon: 'puzzle',
    supportsResponsive: false,
  },
};

/**
 * Helper to check if field supports responsive mode
 */
export function fieldSupportsResponsive(type: FieldType): boolean {
  return FIELD_TYPE_REGISTRY[type]?.supportsResponsive ?? false;
}

/**
 * Create field definition helper
 */
export function createField<T extends FieldType>(
  type: T,
  label: string,
  options?: Partial<FieldDefinition>
): FieldDefinition {
  return {
    type,
    label,
    ...options,
  };
}

/**
 * Commonly used field presets
 */
export const FieldPresets = {
  // Text presets
  title: () => createField('text', 'Title', { required: true }),
  subtitle: () => createField('text', 'Subtitle'),
  description: () => createField('textarea', 'Description', { rows: 3 }),
  
  // Visual presets
  backgroundColor: () => createField('color', 'Background Color', { 
    defaultValue: 'transparent' 
  }),
  textColor: () => createField('color', 'Text Color', { 
    defaultValue: 'inherit' 
  }),
  
  // Spacing presets
  padding: () => createField('spacing', 'Padding', { 
    responsive: true,
    defaultValue: { top: 16, right: 16, bottom: 16, left: 16 },
  }),
  margin: () => createField('spacing', 'Margin', { 
    responsive: true,
    defaultValue: { top: 0, right: 0, bottom: 0, left: 0 },
  }),
  
  // Typography preset
  typography: () => createField('typography', 'Typography', { 
    responsive: true 
  }),
  
  // Link preset
  link: () => createField('link', 'Link', {
    defaultValue: { href: '', target: '_self', type: 'url' },
  }),
  
  // Image preset
  image: () => createField('image', 'Image', {
    defaultValue: { url: '', alt: '' },
  }),
};

