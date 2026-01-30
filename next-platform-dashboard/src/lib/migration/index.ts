/**
 * Migration Module Index
 * 
 * Exports all migration utilities for Craft.js to Puck conversion.
 */

// Main migration functions
export {
  detectContentFormat,
  isPuckFormat,
  isCraftFormat,
  migrateCraftToPuck,
  autoMigrateContent,
  getMigrationSummary,
  getSupportedCraftTypes,
} from "./craft-to-puck";

// Component mappings
export {
  defaultComponentMappings,
  getMappingForType,
} from "./component-mapping";

// Types
export type {
  CraftNode,
  CraftContent,
  PuckComponent,
  PuckDataStructure,
  MigrationResult,
  MigrationOptions,
  ContentFormat,
  FormatDetectionResult,
  ComponentMapping,
} from "./types";
