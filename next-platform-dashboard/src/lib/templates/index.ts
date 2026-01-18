/**
 * Templates Library Index
 * Phase 68: Industry Templates UI
 */

// Types
export type {
  IndustryCategory,
  Template,
  IndustryInfo,
} from "./template-types";

export {
  INDUSTRIES,
  getIndustryInfo,
  getIndustryIcon,
  getIndustryLabel,
} from "./template-types";

// Data
export {
  TEMPLATES,
  getTemplatesByIndustry,
  getTemplateById,
  getPopularTemplates,
  getTemplatesByFeature,
  searchTemplates,
  getTemplateCountByIndustry,
} from "./template-data";
