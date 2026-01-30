/**
 * Migration Types
 * 
 * Type definitions for Craft.js to Puck data migration.
 */

/**
 * Craft.js Node Structure
 * This is the structure used by Craft.js to store component data.
 */
export interface CraftNode {
  type: {
    resolvedName: string;
  };
  isCanvas?: boolean;
  props: Record<string, unknown>;
  displayName?: string;
  custom?: Record<string, unknown>;
  parent?: string | null;
  hidden?: boolean;
  nodes?: string[];
  linkedNodes?: Record<string, string>;
}

/**
 * Craft.js Content Structure
 * The complete content structure stored in the database.
 */
export interface CraftContent {
  ROOT?: CraftNode;
  [nodeId: string]: CraftNode | undefined;
}

/**
 * Puck Component Data
 * Single component in Puck format.
 */
export interface PuckComponent {
  type: string;
  props: Record<string, unknown>;
}

/**
 * Puck Data Structure
 * The complete content structure for Puck.
 */
export interface PuckDataStructure {
  content: PuckComponent[];
  root: {
    props: {
      title?: string;
      [key: string]: unknown;
    };
  };
  zones?: Record<string, PuckComponent[]>;
}

/**
 * Migration Result
 * Returned after attempting a migration.
 */
export interface MigrationResult {
  success: boolean;
  data: PuckDataStructure | null;
  errors: string[];
  warnings: string[];
  stats: {
    totalNodes: number;
    migratedNodes: number;
    skippedNodes: number;
    unmappedTypes: string[];
  };
}

/**
 * Component Mapping Entry
 * Maps a Craft.js component to its Puck equivalent.
 */
export interface ComponentMapping {
  craftType: string;
  puckType: string;
  propsTransform?: (craftProps: Record<string, unknown>) => Record<string, unknown>;
}

/**
 * Migration Options
 */
export interface MigrationOptions {
  /** Skip unmapped components instead of erroring */
  skipUnmapped?: boolean;
  /** Custom component mappings to override defaults */
  customMappings?: ComponentMapping[];
  /** Preserve Craft.js node IDs */
  preserveIds?: boolean;
  /** Log migration progress */
  verbose?: boolean;
}

/**
 * Content Format Detection
 */
export type ContentFormat = "craft" | "puck" | "empty" | "unknown";

/**
 * Format Detection Result
 */
export interface FormatDetectionResult {
  format: ContentFormat;
  confidence: number;
  reason: string;
}
