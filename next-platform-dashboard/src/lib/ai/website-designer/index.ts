/**
 * PHASE AWD-03: AI Website Designer Core Engine
 * Public API Exports
 *
 * This file exports all public types, classes, and functions
 * from the AI Website Designer module.
 */

// =============================================================================
// CORE ENGINE
// =============================================================================

export { WebsiteDesignerEngine, generateWebsiteFromPrompt } from "./engine";

// =============================================================================
// TYPES
// =============================================================================

export type {
  // Input types
  WebsiteDesignerInput,
  WebsiteDesignerPreferences,
  WebsiteDesignerConstraints,
  WebsiteStyle,
  ColorPreference,
  LayoutDensity,
  AnimationLevel,
  // Architecture types
  SiteIntent,
  BrandTone,
  DesignTokens,
  SiteArchitecture,
  PagePlan,
  SectionPlan,
  NavbarPlan,
  FooterPlan,
  // Output types
  WebsiteDesignerOutput,
  GeneratedPage,
  GeneratedComponent,
  PageSEO,
  NavigationStructure,
  NavigationItem,
  SiteSettings,
  SEOSettings,
  AppliedDesignSystem,
  ContentSummary,
  // Progress types
  GenerationProgress,
  GenerationEvent,
} from "./types";

// =============================================================================
// SCHEMAS (for validation)
// =============================================================================

export {
  SiteArchitectureSchema,
  PagePlanSchema,
  SectionPlanSchema,
  DesignTokensSchema,
  GeneratedPageSchema,
  GeneratedComponentSchema,
  NavbarComponentSchema,
  FooterComponentSchema,
} from "./schemas";

// =============================================================================
// PROMPTS (for customization)
// =============================================================================

export {
  SITE_ARCHITECT_PROMPT,
  PAGE_GENERATOR_PROMPT,
  NAVBAR_GENERATOR_PROMPT,
  FOOTER_GENERATOR_PROMPT,
  getIndustryContentPrompt,
  buildArchitecturePrompt,
  buildPagePrompt,
} from "./prompts";

// =============================================================================
// DATA CONTEXT (from AWD-02)
// =============================================================================

export { buildDataContext } from "./data-context/builder";
export { formatContextForAI } from "./data-context/formatter";
export { checkDataAvailability, getMissingDataPrompts } from "./data-context/checker";

export type {
  BusinessDataContext,
  DataAvailability,
  DataAvailabilityCategory,
  DataAvailabilityScore,
  MissingDataPrompt,
  FormattedContext,
} from "./data-context/types";

// =============================================================================
// INTELLIGENCE (from AWD-04)
// =============================================================================

export {
  // Industry Templates
  INDUSTRY_TEMPLATES,
  getIndustryTemplate,
  inferIndustry,
  getAllIndustries,
  // Component Scoring
  scoreComponent,
  rankComponentsForSection,
  selectBestComponent,
  buildDataAvailabilityFlags,
  // Page Planning
  generatePagePlan,
  DEFAULT_PAGE_SECTIONS,
} from "./intelligence";

export type {
  IndustryTemplate,
  PageRecommendation,
  ComponentPreference,
  ComponentScore,
  ScoringContext,
  RecommendedPage,
  RecommendedSection,
  PagePlanRecommendation,
  DataAvailabilityFlags,
} from "./intelligence";

// =============================================================================
// DESIGN SYSTEM (from AWD-05)
// =============================================================================

export {
  // Design System Generator
  DesignSystemGenerator,
  generateDesignSystemForIndustry,
  generateDesignSystemFromColor,
  generateDesignTokens,
  // Color Intelligence
  generatePalette,
  generateColorScale,
  generateHarmony,
  getSuggestedPaletteForIndustry,
  calculateContrast,
  meetsWcagAA,
  getAccessibleTextColor,
  // Typography Intelligence
  getFontPairingForMood,
  getTypographyForIndustry,
  generateTypeScale,
  generateGoogleFontsUrl,
  FONT_LIBRARY,
  FONT_PAIRINGS,
  // Spacing System
  getBorderRadiusScale,
  getShadowScale,
  getDesignPreferencesForMood,
} from "./design";

export type {
  DesignSystem,
  DesignSystemInput,
  DesignMood,
  DesignPreferences,
  ColorPalette,
  ColorScale,
  ColorValue,
  FontPairing,
  FontDefinition,
  TypeScale,
  SpacingScale,
  BorderRadiusScale,
  ShadowScale,
} from "./design";

// =============================================================================
// PREVIEW & ITERATION (from AWD-08)
// =============================================================================

export {
  usePreviewStore,
  usePreviewHistory,
  useCurrentPage,
  usePreviewStatus,
  usePreviewState,
  IterationEngine,
  QUICK_REFINEMENTS,
  DEVICE_PRESETS,
  createPreviewState,
  toPreviewPage,
} from "./preview";

export type {
  PreviewStatus,
  PreviewState,
  PreviewPage,
  PreviewComponent,
  ChangeType,
  Change,
  Iteration,
  DeviceType,
  DevicePreview,
  RefinementType,
  RefinementRequest,
  RefinementResult,
  RefinementScope,
} from "./preview";

// =============================================================================
// MODULE INTEGRATION (from AWD-09)
// =============================================================================

export {
  analyzeModuleRequirements,
  getRequiredModules,
  getOptionalModules,
  ModuleConfigurator,
  ComponentInjector,
  ModuleIntegrationOrchestrator,
  getDefaultModuleConfig,
  INDUSTRY_MODULE_MAPPING,
  extractFeatureFlags,
} from "./modules";

export type {
  ModuleType,
  ModulePriority,
  ModuleRequirement,
  ModuleConfig,
  ModuleComponent,
  ModulePage,
  ModuleIntegration,
  EcommerceConfig,
  BookingConfig,
  CRMConfig,
  AutomationConfig,
  SocialMediaConfig,
  ModuleFeatureFlags,
} from "./modules";
