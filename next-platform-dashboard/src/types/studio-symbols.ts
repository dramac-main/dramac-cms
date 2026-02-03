/**
 * DRAMAC Studio Symbols Types
 * 
 * Type definitions for reusable component symbols.
 * Symbols are user-saved component groups that can be reused across pages.
 * Updating a symbol updates all instances.
 * 
 * Phase: STUDIO-25 Symbols & Reusable Components
 */

import type { StudioComponent } from './studio';

// =============================================================================
// CORE SYMBOL TYPES
// =============================================================================

/**
 * A Symbol (master component) - the source of truth for reusable components
 */
export interface StudioSymbol {
  /** Unique identifier */
  id: string;
  
  /** User-defined name */
  name: string;
  
  /** Optional description */
  description?: string;
  
  /** Category for organization */
  category: string;
  
  /** Tags for search */
  tags: string[];
  
  /** The component tree that makes up this symbol */
  components: StudioComponent[];
  
  /** ID of the root component in the symbol */
  rootComponentId: string;
  
  /** Thumbnail/preview image URL */
  thumbnail?: string;
  
  /** Symbol version for tracking changes */
  version: number;
  
  /** When the symbol was created */
  createdAt: string;
  
  /** When the symbol was last updated */
  updatedAt: string;
  
  /** User who created the symbol */
  createdBy?: string;
  
  /** Whether this is a global (agency-wide) symbol */
  isGlobal: boolean;
  
  /** Site ID if this is a site-specific symbol */
  siteId?: string;
  
  /** The symbol's default size/dimensions hint */
  defaultSize?: {
    width?: string | number;
    height?: string | number;
    minWidth?: string | number;
    minHeight?: string | number;
  };
}

/**
 * A Symbol Instance - a reference to a symbol placed on a page
 */
export interface SymbolInstance {
  /** Unique instance ID (also used as component ID in page data) */
  id: string;
  
  /** Reference to the source symbol */
  symbolId: string;
  
  /** Instance-level property overrides (sparse) */
  overrides: SymbolOverrides;
  
  /** Version of the symbol this instance was last synced with */
  syncedVersion: number;
  
  /** Whether this instance is detached from the symbol */
  isDetached: boolean;
}

/**
 * Overrides that can be applied at the instance level
 */
export interface SymbolOverrides {
  /** 
   * Map of component ID (within symbol) to property overrides 
   * Key format: componentId.propName
   */
  props: Record<string, unknown>;
  
  /** Instance-level style overrides */
  styles?: Record<string, unknown>;
  
  /** Override visibility of child components */
  visibility?: Record<string, boolean>;
}

/**
 * Extended StudioComponent for symbol instance rendering
 */
export interface SymbolInstanceComponent extends StudioComponent {
  /** Marks this as a symbol instance */
  isSymbolInstance: true;
  
  /** Reference to the symbol */
  symbolId: string;
  
  /** Instance overrides */
  symbolOverrides?: SymbolOverrides;
  
  /** Synced version */
  symbolVersion?: number;
  
  /** Is detached from symbol */
  isDetached?: boolean;
}

// =============================================================================
// SYMBOL CATEGORIES
// =============================================================================

/**
 * Symbol category for organization
 */
export interface SymbolCategory {
  id: string;
  label: string;
  description?: string;
  icon?: string;
}

/**
 * Default symbol categories
 */
export const DEFAULT_SYMBOL_CATEGORIES: SymbolCategory[] = [
  { id: 'headers', label: 'Headers', description: 'Header and navigation components' },
  { id: 'footers', label: 'Footers', description: 'Footer components' },
  { id: 'cards', label: 'Cards', description: 'Card and tile components' },
  { id: 'forms', label: 'Forms', description: 'Form and input components' },
  { id: 'buttons', label: 'Buttons', description: 'Button variations' },
  { id: 'navigation', label: 'Navigation', description: 'Navigation elements' },
  { id: 'content', label: 'Content Blocks', description: 'Reusable content blocks' },
  { id: 'custom', label: 'Custom', description: 'User-defined components' },
];

// =============================================================================
// SYMBOL OPERATIONS
// =============================================================================

/**
 * Data for creating a new symbol from components
 */
export interface CreateSymbolData {
  name: string;
  description?: string;
  category: string;
  tags?: string[];
  components: StudioComponent[];
  isGlobal?: boolean;
  siteId?: string;
}

/**
 * Data for updating an existing symbol
 */
export interface UpdateSymbolData {
  name?: string;
  description?: string;
  category?: string;
  tags?: string[];
  components?: StudioComponent[];
  thumbnail?: string;
}

/**
 * Result of a symbol sync check
 */
export interface SymbolSyncStatus {
  instanceId: string;
  symbolId: string;
  isUpToDate: boolean;
  currentVersion: number;
  latestVersion: number;
  hasOverrides: boolean;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Check if a component is a symbol instance
 */
export function isSymbolInstance(
  component: StudioComponent
): component is SymbolInstanceComponent {
  return (component as SymbolInstanceComponent).isSymbolInstance === true;
}

/**
 * Create a symbol instance component
 */
export function createSymbolInstance(
  symbolId: string,
  symbol: StudioSymbol,
  position?: { x?: number; y?: number }
): SymbolInstanceComponent {
  return {
    id: `instance-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type: 'SymbolInstance',
    isSymbolInstance: true,
    symbolId,
    symbolVersion: symbol.version,
    symbolOverrides: {
      props: {},
    },
    props: {
      ...symbol.defaultSize,
      ...position,
    },
    children: [],
  };
}

/**
 * Apply overrides to a symbol's components for rendering
 */
export function applySymbolOverrides(
  components: StudioComponent[],
  overrides: SymbolOverrides
): StudioComponent[] {
  return components.map((component) => {
    const overriddenProps: Record<string, unknown> = { ...component.props };
    
    // Apply prop overrides for this component
    for (const [key, value] of Object.entries(overrides.props)) {
      const [compId, propName] = key.split('.');
      if (compId === component.id && propName) {
        overriddenProps[propName] = value;
      }
    }
    
    // Apply style overrides
    if (overrides.styles) {
      for (const [key, value] of Object.entries(overrides.styles)) {
        const [compId, styleName] = key.split('.');
        if (compId === component.id && styleName) {
          overriddenProps[styleName] = value;
        }
      }
    }
    
    // Apply visibility overrides
    const isVisible = overrides.visibility?.[component.id] ?? true;
    if (!isVisible) {
      overriddenProps.hidden = true;
    }
    
    return {
      ...component,
      props: overriddenProps,
    };
  });
}

/**
 * Merge instance overrides with symbol defaults
 */
export function mergeOverrides(
  existing: SymbolOverrides,
  updates: Partial<SymbolOverrides>
): SymbolOverrides {
  return {
    props: {
      ...existing.props,
      ...updates.props,
    },
    styles: {
      ...existing.styles,
      ...updates.styles,
    },
    visibility: {
      ...existing.visibility,
      ...updates.visibility,
    },
  };
}

/**
 * Check if overrides object has any values
 */
export function hasOverrides(overrides: SymbolOverrides): boolean {
  return (
    Object.keys(overrides.props).length > 0 ||
    Object.keys(overrides.styles || {}).length > 0 ||
    Object.keys(overrides.visibility || {}).length > 0
  );
}
