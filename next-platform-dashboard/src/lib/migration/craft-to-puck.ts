/**
 * Craft.js to Puck Migration Utility
 * 
 * Converts Craft.js page content to Puck format.
 * This is the main migration function used when loading pages.
 */

import type {
  CraftContent,
  CraftNode,
  PuckDataStructure,
  PuckComponent,
  MigrationResult,
  MigrationOptions,
  ContentFormat,
  FormatDetectionResult,
} from "./types";
import { getMappingForType, getSupportedCraftTypes } from "./component-mapping";

/**
 * Detect the format of page content.
 * Returns the detected format with confidence level.
 */
export function detectContentFormat(content: unknown): FormatDetectionResult {
  // Null or undefined
  if (content === null || content === undefined) {
    return { format: "empty", confidence: 1, reason: "Content is null or undefined" };
  }

  // Empty object
  if (typeof content === "object" && Object.keys(content as object).length === 0) {
    return { format: "empty", confidence: 1, reason: "Content is empty object" };
  }

  // Check for Puck format
  if (isPuckFormat(content)) {
    return { format: "puck", confidence: 0.95, reason: "Has content array and root structure" };
  }

  // Check for Craft.js format
  if (isCraftFormat(content)) {
    return { format: "craft", confidence: 0.95, reason: "Has ROOT node with Craft.js structure" };
  }

  return { format: "unknown", confidence: 0, reason: "Content structure not recognized" };
}

/**
 * Check if content is in Puck format
 */
export function isPuckFormat(content: unknown): content is PuckDataStructure {
  if (typeof content !== "object" || content === null) return false;
  const data = content as Record<string, unknown>;
  
  // Puck format has: content (array) and root (object with props)
  if (!Array.isArray(data.content)) return false;
  if (!data.root || typeof data.root !== "object") return false;
  
  const root = data.root as Record<string, unknown>;
  if (!root.props || typeof root.props !== "object") return false;
  
  return true;
}

/**
 * Check if content is in Craft.js format
 */
export function isCraftFormat(content: unknown): content is CraftContent {
  if (typeof content !== "object" || content === null) return false;
  const data = content as Record<string, unknown>;
  
  // Craft format has: ROOT node with type.resolvedName
  const rootNode = data.ROOT;
  if (!rootNode || typeof rootNode !== "object") return false;
  
  const root = rootNode as Record<string, unknown>;
  if (!root.type || typeof root.type !== "object") return false;
  
  const type = root.type as Record<string, unknown>;
  return typeof type.resolvedName === "string";
}

/**
 * Migrate Craft.js content to Puck format.
 * This is the main migration function.
 */
export function migrateCraftToPuck(
  craftContent: CraftContent,
  options: MigrationOptions = {}
): MigrationResult {
  const {
    skipUnmapped = true,
    customMappings = [],
    preserveIds = false,
    verbose = false,
  } = options;

  const result: MigrationResult = {
    success: false,
    data: null,
    errors: [],
    warnings: [],
    stats: {
      totalNodes: 0,
      migratedNodes: 0,
      skippedNodes: 0,
      unmappedTypes: [],
    },
  };

  try {
    // Validate input
    if (!craftContent || typeof craftContent !== "object") {
      result.errors.push("Invalid Craft content: not an object");
      return result;
    }

    const rootNode = craftContent.ROOT;
    if (!rootNode) {
      result.errors.push("Invalid Craft content: missing ROOT node");
      return result;
    }

    // Initialize output
    const puckData: PuckDataStructure = {
      content: [],
      root: {
        props: {
          title: "",
        },
      },
      zones: {},
    };

    // Get root props
    if (rootNode.props) {
      puckData.root.props = {
        title: (rootNode.props.title as string) || "",
        ...rootNode.props,
      };
    }

    // Count total nodes (excluding ROOT)
    const nodeIds = Object.keys(craftContent).filter((id) => id !== "ROOT");
    result.stats.totalNodes = nodeIds.length;

    if (verbose) {
      console.log(`[Migration] Starting migration of ${nodeIds.length} nodes`);
    }

    // Get the children of ROOT
    const rootChildren = rootNode.nodes || [];
    
    // Process each root child in order
    for (const childId of rootChildren) {
      const childNode = craftContent[childId];
      if (!childNode) {
        result.warnings.push(`Node ${childId} referenced but not found`);
        continue;
      }

      const component = migrateNode(
        childId,
        childNode,
        craftContent,
        customMappings,
        preserveIds,
        result,
        skipUnmapped,
        verbose
      );

      if (component) {
        puckData.content.push(component);
      }
    }

    // Calculate stats
    result.stats.migratedNodes = puckData.content.length;
    result.stats.skippedNodes = result.stats.totalNodes - result.stats.migratedNodes;

    // Determine success
    if (result.errors.length === 0) {
      result.success = true;
      result.data = puckData;
    }

    if (verbose) {
      console.log(`[Migration] Complete: ${result.stats.migratedNodes}/${result.stats.totalNodes} nodes migrated`);
      if (result.stats.unmappedTypes.length > 0) {
        console.log(`[Migration] Unmapped types: ${result.stats.unmappedTypes.join(", ")}`);
      }
    }

    return result;
  } catch (error) {
    result.errors.push(`Migration failed: ${error instanceof Error ? error.message : String(error)}`);
    return result;
  }
}

/**
 * Migrate a single Craft.js node to Puck component
 */
function migrateNode(
  nodeId: string,
  node: CraftNode,
  allNodes: CraftContent,
  customMappings: MigrationOptions["customMappings"],
  preserveIds: boolean,
  result: MigrationResult,
  skipUnmapped: boolean,
  verbose: boolean
): PuckComponent | null {
  const craftType = node.type?.resolvedName;
  
  if (!craftType) {
    result.warnings.push(`Node ${nodeId} has no type`);
    return null;
  }

  // Skip hidden nodes
  if (node.hidden) {
    if (verbose) {
      console.log(`[Migration] Skipping hidden node: ${nodeId} (${craftType})`);
    }
    return null;
  }

  // Get mapping
  const mapping = getMappingForType(craftType, customMappings);
  
  if (!mapping) {
    if (!result.stats.unmappedTypes.includes(craftType)) {
      result.stats.unmappedTypes.push(craftType);
    }
    
    if (skipUnmapped) {
      result.warnings.push(`No mapping for type "${craftType}", skipping`);
      return null;
    } else {
      result.errors.push(`No mapping for type "${craftType}"`);
      return null;
    }
  }

  // Transform props
  let props: Record<string, unknown> = { ...node.props };
  
  if (mapping.propsTransform) {
    try {
      props = mapping.propsTransform(node.props);
    } catch (error) {
      result.warnings.push(
        `Failed to transform props for ${craftType}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Add ID if preserving
  if (preserveIds) {
    props.id = nodeId;
  } else {
    props.id = `${mapping.puckType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Create component
  const component: PuckComponent = {
    type: mapping.puckType,
    props,
  };

  if (verbose) {
    console.log(`[Migration] Migrated ${craftType} -> ${mapping.puckType}`);
  }

  return component;
}

/**
 * Auto-migrate content if needed.
 * Detects format and migrates if in Craft format.
 */
export function autoMigrateContent(
  content: unknown,
  options: MigrationOptions = {}
): PuckDataStructure {
  // Empty content
  if (!content || (typeof content === "object" && Object.keys(content).length === 0)) {
    return {
      content: [],
      root: { props: { title: "" } },
    };
  }

  // Detect format
  const detection = detectContentFormat(content);

  switch (detection.format) {
    case "puck":
      // Already in Puck format
      return content as PuckDataStructure;

    case "craft":
      // Migrate from Craft
      const result = migrateCraftToPuck(content as CraftContent, options);
      if (result.success && result.data) {
        return result.data;
      }
      // If migration fails, return empty
      console.error("Migration failed:", result.errors);
      return {
        content: [],
        root: { props: { title: "" } },
      };

    case "empty":
      return {
        content: [],
        root: { props: { title: "" } },
      };

    default:
      console.warn("Unknown content format, returning empty");
      return {
        content: [],
        root: { props: { title: "" } },
      };
  }
}

/**
 * Get migration summary for reporting
 */
export function getMigrationSummary(result: MigrationResult): string {
  const lines: string[] = [];
  
  lines.push(`Migration ${result.success ? "succeeded" : "failed"}`);
  lines.push(`  Total nodes: ${result.stats.totalNodes}`);
  lines.push(`  Migrated: ${result.stats.migratedNodes}`);
  lines.push(`  Skipped: ${result.stats.skippedNodes}`);
  
  if (result.stats.unmappedTypes.length > 0) {
    lines.push(`  Unmapped types: ${result.stats.unmappedTypes.join(", ")}`);
  }
  
  if (result.errors.length > 0) {
    lines.push(`  Errors:`);
    result.errors.forEach((e) => lines.push(`    - ${e}`));
  }
  
  if (result.warnings.length > 0) {
    lines.push(`  Warnings:`);
    result.warnings.forEach((w) => lines.push(`    - ${w}`));
  }
  
  return lines.join("\n");
}

// Re-export for convenience
export { getSupportedCraftTypes };
