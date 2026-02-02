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
