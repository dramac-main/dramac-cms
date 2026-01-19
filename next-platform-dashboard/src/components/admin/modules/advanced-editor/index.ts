/**
 * Advanced Module Editor Components
 * 
 * Export all components for the advanced module development experience.
 * These components support Phase 81C features including:
 * - Multi-file module editing
 * - NPM dependency management via CDN
 * - API route building
 * - Module manifest configuration
 */

export { MultiFileEditor } from "./multi-file-editor";
export type { ModuleFile } from "./multi-file-editor";

export { FileTree } from "./file-tree";
export type { FileItem } from "./file-tree";

export { DependencyManager } from "./dependency-manager";
export type { Dependency, PackageSearchResult } from "./dependency-manager";

export { ApiRouteBuilder } from "./api-route-builder";
export type { ApiRoute } from "./api-route-builder";

export { ManifestEditor } from "./manifest-editor";
export type {
  ModuleManifest,
  ModulePermission,
  ManifestSetting,
  ModuleHook,
  ModuleSlot,
  ModuleEventDef,
} from "./manifest-editor";
