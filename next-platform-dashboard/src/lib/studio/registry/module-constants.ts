/**
 * DRAMAC Studio Module Constants
 * 
 * Non-async exports for module discovery system.
 * Separated from module-discovery.ts because "use server" files
 * must only export async functions.
 */

// =============================================================================
// KNOWN MODULES
// =============================================================================

/**
 * Known module slugs that have Studio component exports
 * These modules have components defined in src/modules/[slug]/studio/
 */
export const KNOWN_MODULE_SLUGS: string[] = [
  "ecommerce",
  "booking",
  "crm",
  "automation",
  "social-media",
];

/**
 * Get module import path from slug
 * Used for dynamic imports of module Studio exports
 */
export function getModuleImportPath(slug: string): string {
  // Local modules are in src/modules/
  return `@/modules/${slug}/studio`;
}
