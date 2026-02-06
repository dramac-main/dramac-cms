/**
 * PHASE AWD-09: Module Integration Intelligence
 * Public Exports
 */

// Types
export type {
  ModuleType,
  ModulePriority,
  ModuleRequirement,
  ModuleConfig,
  ModuleComponent,
  ModulePage,
  ModuleIntegration,
  ShippingZone,
  ShippingMethod,
  EcommerceConfig,
  BookingConfig,
  CRMConfig,
  AutomationWorkflow,
  AutomationConfig,
  SocialMediaConfig,
  BusinessDataContext,
  IndustryModuleMapping,
  ModuleFeatureFlags,
} from "./types";

export { INDUSTRY_MODULE_MAPPING, extractFeatureFlags } from "./types";

// Default Configs
export { getDefaultModuleConfig } from "./default-configs";

// Analyzer
export {
  analyzeModuleRequirements,
  getRequiredModules,
  getOptionalModules,
} from "./analyzer";

// Configurator
export { ModuleConfigurator } from "./configurator";

// Component Injector
export { ComponentInjector } from "./component-injector";

// Orchestrator
export { ModuleIntegrationOrchestrator } from "./orchestrator";
