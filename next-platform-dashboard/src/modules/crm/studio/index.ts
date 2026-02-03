/**
 * CRM Module - Studio Integration
 * 
 * Placeholder for Studio components and custom fields.
 * Components will be added in future phases.
 */

import type { ModuleStudioExports } from "@/types/studio-module";

// =============================================================================
// STUDIO COMPONENTS (To be added)
// =============================================================================

export const studioComponents: ModuleStudioExports["studioComponents"] = {
  // Will be added in future phases
  // ContactForm: { ... },
  // LeadCapture: { ... },
};

// =============================================================================
// CUSTOM FIELDS (To be added in Phase 15)
// =============================================================================

export const studioFields: ModuleStudioExports["studioFields"] = {
  // Will be added in Phase 15
};

// =============================================================================
// METADATA
// =============================================================================

export const studioMetadata: ModuleStudioExports["studioMetadata"] = {
  name: "CRM",
  icon: "Users",
  category: "forms",
};

// Export as default for compatibility
export default {
  studioComponents,
  studioFields,
  studioMetadata,
};
