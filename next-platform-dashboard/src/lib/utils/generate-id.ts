/**
 * Shared ID generation utilities
 * 
 * Consolidates the various `generateId()` implementations
 * scattered across template and studio files.
 */

/**
 * Generate a unique component ID for Puck/Studio templates.
 * Uses Math.random for lightweight, collision-safe IDs
 * suitable for page component keys (not DB primary keys).
 */
export function generateComponentId(): string {
  return `component-${Math.random().toString(36).substring(2, 11)}`;
}
