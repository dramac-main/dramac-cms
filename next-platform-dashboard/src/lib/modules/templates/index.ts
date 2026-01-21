/**
 * Module Templates Library
 * Phase EM-22: Module Templates Library
 *
 * Exports template registry, generator, and related utilities.
 */

// Template Registry
export {
  MODULE_TEMPLATES,
  getTemplateById,
  getTemplatesByCategory,
  searchTemplates,
  getTemplatesByComplexity,
  getTemplatesByTag,
  getAllTemplateTags,
  getTemplateCountByCategory,
} from "./template-registry";

export type {
  ModuleTemplate,
  TemplateFile,
  TemplateVariable,
} from "./template-registry";

// Template Generator
export {
  generateFromTemplate,
  validateVariables,
  previewGeneration,
} from "./template-generator";

export type { GenerateOptions, GenerationResult } from "./template-generator";
