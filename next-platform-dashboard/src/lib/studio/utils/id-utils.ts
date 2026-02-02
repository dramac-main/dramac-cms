/**
 * ID Generation Utilities
 * 
 * Consistent ID generation for components and elements.
 */

import { nanoid } from "nanoid";

/**
 * Generate a unique component ID
 * Format: comp_[nanoid]
 */
export function generateComponentId(): string {
  return `comp_${nanoid(10)}`;
}

/**
 * Generate a unique zone ID
 * Format: zone_[nanoid]
 */
export function generateZoneId(): string {
  return `zone_${nanoid(8)}`;
}

/**
 * Check if a string is a valid component ID
 */
export function isComponentId(id: string): boolean {
  return id.startsWith("comp_") || id === "root";
}

/**
 * Check if a string is a valid zone ID
 */
export function isZoneId(id: string): boolean {
  return id.startsWith("zone_");
}
