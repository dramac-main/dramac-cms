/**
 * Module Types Index
 * 
 * Central export for all module-related types
 */

// Module manifest and core types
export * from "./module-manifest";

// Installation types
export * from "./module-installation";

// Permissions system
export * from "./module-permissions";

// Hooks system
export * from "./module-hooks";

// Pricing types
export * from "./module-pricing";

// Module Types V2 - Enterprise Module System (EM-10)
export * from "./module-types-v2";

// Convenience alias - ModuleHookName is the same as ModuleHook
export { type ModuleHook as ModuleHookName } from "./module-manifest";

// Re-export commonly used types at the top level for convenience
// These are already exported via * exports above, but this makes imports cleaner
export type {
  // Manifest (from module-manifest.ts)
  ModuleManifest,
  ModuleHook,
  ModulePermission,
  ModuleInstallLevel,
  ModuleEntryPoints,
  ModuleApiRoute,
  JSONSchema,
} from "./module-manifest";

export type {
  // Installation (from module-installation.ts)
  Module,
  ModuleInstallation,
  AgencyModuleSubscription,
  AgencyModuleInstallation,
  ClientModuleInstallation,
  SiteModuleInstallation,
  ModuleWithInstallation,
  InstalledModuleDetail,
  ModuleRow,
  AgencyModuleSubscriptionRow,
} from "./module-installation";

export type {
  // Permissions (from module-permissions.ts)
  PermissionCheckResult,
  PermissionGroup,
  PermissionRequest,
  PermissionGrant,
} from "./module-permissions";

export type {
  // Hooks (from module-hooks.ts)
  HookInfo,
  HookRegistration,
} from "./module-hooks";

export type {
  // Pricing (from module-pricing.ts)
  PricingType,
  MarkupType,
  BillingCycle,
  BillingStatus,
  WholesalePricing,
  AgencyModulePricing,
  ClientModulePricing,
  MarkupConfig,
  PriceDisplay,
} from "./module-pricing";
