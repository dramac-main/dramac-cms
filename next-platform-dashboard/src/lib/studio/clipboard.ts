/**
 * DRAMAC Studio Clipboard
 * 
 * Module for copying/pasting components with proper ID regeneration.
 * Supports nested children and session storage backup.
 * 
 * @phase STUDIO-20
 */

import type { StudioComponent } from "@/types/studio";
import { generateComponentId } from "./utils/id-utils";
import { toast } from "sonner";

// =============================================================================
// TYPES
// =============================================================================

interface ClipboardData {
  type: "studio-component";
  component: StudioComponent;
  children: StudioComponent[];
  timestamp: number;
}

// =============================================================================
// CLIPBOARD STATE
// =============================================================================

// In-memory clipboard (survives page refreshes via sessionStorage backup)
let clipboardData: ClipboardData | null = null;

const STORAGE_KEY = "dramac-studio-clipboard";

// Initialize from session storage on load
if (typeof window !== "undefined") {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      clipboardData = JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
}

// =============================================================================
// CLIPBOARD FUNCTIONS
// =============================================================================

/**
 * Copy a component (and its children) to clipboard
 */
export function copyToClipboard(
  component: StudioComponent,
  allComponents: Record<string, StudioComponent>
): void {
  // Get all children recursively
  const children: StudioComponent[] = [];

  function collectChildren(comp: StudioComponent) {
    if (comp.children && comp.children.length > 0) {
      for (const childId of comp.children) {
        const child = allComponents[childId];
        if (child) {
          children.push(structuredClone(child));
          collectChildren(child);
        }
      }
    }
  }

  collectChildren(component);

  clipboardData = {
    type: "studio-component",
    component: structuredClone(component),
    children,
    timestamp: Date.now(),
  };

  // Backup to session storage
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(clipboardData));
  } catch {
    // Session storage might be full or disabled
  }

  toast.success("Component copied to clipboard");
}

/**
 * Get clipboard contents with regenerated IDs
 * Returns null if clipboard is empty or invalid
 */
export function getClipboardData(): {
  component: StudioComponent;
  children: StudioComponent[];
  idMap: Map<string, string>;
} | null {
  if (!clipboardData || clipboardData.type !== "studio-component") {
    return null;
  }

  const idMap = new Map<string, string>();

  // Generate new ID for main component
  const oldId = clipboardData.component.id;
  const newId = generateComponentId();
  idMap.set(oldId, newId);

  // Generate new IDs for all children
  for (const child of clipboardData.children) {
    const newChildId = generateComponentId();
    idMap.set(child.id, newChildId);
  }

  // Clone and update main component
  const newComponent: StudioComponent = {
    ...structuredClone(clipboardData.component),
    id: newId,
    children: clipboardData.component.children?.map(
      (childId) => idMap.get(childId) || childId
    ),
    // Clear parent reference since we're pasting to a new location
    parentId: undefined,
    zoneId: undefined,
  };

  // Clone and update children with new IDs
  const newChildren: StudioComponent[] = clipboardData.children.map((child) => ({
    ...structuredClone(child),
    id: idMap.get(child.id)!,
    parentId: child.parentId ? idMap.get(child.parentId) : undefined,
    children: child.children?.map((childId) => idMap.get(childId) || childId),
  }));

  return {
    component: newComponent,
    children: newChildren,
    idMap,
  };
}

/**
 * Check if clipboard has data
 */
export function hasClipboardData(): boolean {
  return clipboardData !== null && clipboardData.type === "studio-component";
}

/**
 * Clear clipboard
 */
export function clearClipboard(): void {
  clipboardData = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Get clipboard timestamp
 */
export function getClipboardTimestamp(): number | null {
  return clipboardData?.timestamp ?? null;
}

/**
 * Get clipboard component type (for paste preview)
 */
export function getClipboardComponentType(): string | null {
  return clipboardData?.component?.type ?? null;
}
