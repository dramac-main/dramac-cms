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
