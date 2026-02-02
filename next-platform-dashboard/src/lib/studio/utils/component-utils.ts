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
