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
    const comp: StudioComponent | undefined = data.components[currentId];
    if (!comp?.parentId) break;
    ancestors.push(comp.parentId);
    currentId = comp.parentId;
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
