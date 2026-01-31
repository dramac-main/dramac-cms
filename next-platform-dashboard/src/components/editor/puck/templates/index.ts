/**
 * Puck Template Components Index
 * PHASE-ED-07A: Template System - Categories
 * 
 * Barrel exports for all template-related components.
 */

// Main Components
export { PuckTemplateLibrary } from "./puck-template-library";
export { default as PuckTemplateLibraryDefault } from "./puck-template-library";
export { TemplateCard } from "./template-card";
export { default as TemplateCardDefault } from "./template-card";
export { TemplatePreviewModal } from "./template-preview-modal";
export { default as TemplatePreviewModalDefault } from "./template-preview-modal";

// Re-export types
export type {
  PuckTemplate,
  TemplateCategory,
  CategoryInfo,
  TemplateColorScheme,
  TemplateMetadata,
  TemplateFilterState,
  TemplateLibraryState,
  TemplateCollection,
  SectionType,
  SectionInfo,
} from "@/types/puck-templates";

// Re-export utilities
export {
  TEMPLATE_CATEGORIES,
  SECTION_TYPES,
  getCategoryInfo,
  getCategoryIcon,
  getCategoryLabel,
  getCategoryColor,
  getSectionInfo,
  getAllCategoryIds,
  getCategoriesGrouped,
  searchCategories,
} from "@/lib/templates/puck-template-categories";

export {
  STARTER_TEMPLATES,
  getStarterTemplates,
  getStarterTemplateById,
  getStarterTemplatesByCategory,
  getFeaturedStarterTemplates,
  searchStarterTemplates,
} from "@/lib/templates/puck-templates";
