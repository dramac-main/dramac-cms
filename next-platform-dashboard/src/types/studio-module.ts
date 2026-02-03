/**
 * DRAMAC Studio Module Types
 * 
 * Types for module Studio integration - components and custom fields.
 * Used by Phase STUDIO-14 (Module Component Loader) and STUDIO-15 (Module-Specific Fields).
 */

import type { ComponentType } from "react";
import type { ComponentDefinition, FieldRenderProps } from "./studio";

// =============================================================================
// MODULE STUDIO EXPORTS
// =============================================================================

/**
 * Custom field editor component props
 */
export interface CustomFieldEditorProps extends FieldRenderProps {
  /** Site ID for fetching module-specific data */
  siteId: string;
  /** Module ID this field belongs to */
  moduleId: string;
}

/**
 * Custom field editor component type
 */
export type CustomFieldEditor = ComponentType<CustomFieldEditorProps>;

/**
 * What a module exports for Studio integration
 */
export interface ModuleStudioExports {
  /** Component definitions for the editor */
  studioComponents?: Record<string, Omit<ComponentDefinition, "module">>;
  
  /** Custom field type editors */
  studioFields?: Record<string, CustomFieldEditor>;
  
  /** Module metadata (optional, can be inferred) */
  studioMetadata?: {
    name: string;
    icon?: string;
    category?: string;
  };
}

// =============================================================================
// INSTALLED MODULE INFO
// =============================================================================

/**
 * Installed module info from database
 * 
 * Combines data from site_module_installations and modules_v2 tables.
 */
export interface InstalledModuleInfo {
  /** Module ID (from modules_v2) */
  id: string;
  
  /** Module display name */
  name: string;
  
  /** Module slug for imports */
  slug: string;
  
  /** Installation status */
  status: "active" | "inactive" | "suspended";
  
  /** Module version */
  version: string;
  
  /** Module category */
  category?: string;
  
  /** Module icon */
  icon?: string;
  
  /** Has Studio components - modules can opt-in to Studio integration */
  hasStudioComponents?: boolean;
  
  /** Installation ID from site_module_installations */
  installationId?: string;
}

// =============================================================================
// LOADER STATE
// =============================================================================

/**
 * Module loader state
 */
export interface ModuleLoaderState {
  /** Loading status */
  isLoading: boolean;
  
  /** Loaded module IDs */
  loadedModules: string[];
  
  /** Failed module IDs with errors */
  failedModules: Record<string, string>;
  
  /** Last load timestamp */
  lastLoadTime: number | null;
}

// =============================================================================
// MODULE COMPONENT METADATA
// =============================================================================

/**
 * Extended component info when from a module
 */
export interface ModuleComponentInfo {
  /** The component definition */
  definition: ComponentDefinition;
  
  /** Source module ID */
  moduleId: string;
  
  /** Source module name */
  moduleName: string;
  
  /** Module icon */
  moduleIcon?: string;
  
  /** Whether module is currently active */
  isActive: boolean;
}

// =============================================================================
// MODULE SYNC EVENTS
// =============================================================================

/**
 * Real-time module sync event types
 */
export type ModuleSyncEventType = "installed" | "uninstalled" | "status_changed";

/**
 * Module sync event payload
 */
export interface ModuleSyncEvent {
  type: ModuleSyncEventType;
  moduleId: string;
  siteId: string;
  status?: InstalledModuleInfo["status"];
}
