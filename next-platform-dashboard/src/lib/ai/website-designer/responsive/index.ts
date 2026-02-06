/**
 * PHASE AWD-07: Responsive & Mobile-First System
 * Public API Exports
 *
 * Central export point for the responsive system module.
 */

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  // Core types
  Breakpoint,
  BreakpointConfig,
  BreakpointValues,
  
  // Responsive rules types
  ResponsiveRules,
  LayoutRules,
  TypographyRules,
  SpacingRules,
  VisibilityRules,
  InteractionRules,
  
  // Component config types
  ComponentResponsiveConfig,
  ComponentLayoutRules,
  ComponentTypographyRules,
  ComponentVisibilityRules,
  ResponsiveValue,
  ResponsiveProps,
  
  // AI types
  AIResponsiveInput,
  AIResponsiveOutput,
} from "./types";

// =============================================================================
// BREAKPOINT EXPORTS
// =============================================================================

export {
  // Constants
  TAILWIND_BREAKPOINTS,
  defaultBreakpointConfig,
  
  // Functions
  getBreakpointPrefix,
  getMediaQuery,
  getBreakpointForWidth,
  isBreakpoint,
  getResponsiveValue,
  generateGridColsClasses,
  generateVisibilityClasses as generateBreakpointVisibilityClasses,
} from "./breakpoints";

// =============================================================================
// RULES ENGINE EXPORTS
// =============================================================================

export {
  // Default rules
  defaultResponsiveRules,
  
  // Rule application
  applyResponsiveRules,
  transformLayout,
  scaleTypography,
  getLineHeightAdjustment,
  
  // Visibility
  shouldShowAtBreakpoint,
  shouldSimplifyOnMobile,
  
  // Touch targets
  ensureMinimumTouchTarget,
  getTouchFriendlyClasses,
  
  // Spacing
  getSectionPadding,
  getContainerPadding,
  generatePaddingClasses as generateRulesPaddingClasses,
  
  // Rule merging
  mergeResponsiveRules,
  createIndustryRules,
} from "./rules-engine";

// =============================================================================
// COMPONENT CONFIG EXPORTS
// =============================================================================

export {
  // Configuration object
  componentResponsiveConfigs,
  
  // Getter functions
  getComponentResponsiveConfig,
  getAllResponsiveComponentTypes,
  hasResponsiveConfig,
  getColumnsForBreakpoint,
  getGapForBreakpoint,
  shouldStackOnMobile,
  getMobileVariant,
} from "./component-configs";

// =============================================================================
// UTILITIES EXPORTS
// =============================================================================

export {
  // Class generators
  generateGridClasses,
  generateGapClasses,
  generateSectionPadding,
  generateContainerPadding,
  generateAlignmentClasses,
  generateFlexAlignmentClasses,
  generateFlexDirectionClasses,
  generateFontSizeClasses,
  generateHeadingClasses,
  generateVisibilityClasses,
  generateMarginClasses,
  generatePaddingClasses,
  generateGridWrapperClasses,
  generateImageClasses,
  generateBgImageClasses,
  
  // Visibility helpers
  hideOnMobile,
  showOnlyOnMobile,
  hideOnTablet,
  hideOnDesktop,
  
  // Touch optimization
  touchFriendlyButton,
  touchFriendlyLink,
  touchFriendlyInput,
  
  // Component-specific
  generateHeroClasses,
  generateNavbarClasses,
  generateFooterClasses,
  generateCardClasses,
  
  // Utilities
  cn,
  responsive,
  responsiveUtilities,
} from "./utilities";

// =============================================================================
// AI CONFIG EXPORTS
// =============================================================================

export {
  // AI generation
  generateResponsiveConfig,
  generateBatchResponsiveConfigs,
  
  // Validation
  validateResponsiveConfig,
  
  // Optimization
  optimizeResponsiveConfig,
} from "./ai-config";

// =============================================================================
// CONVENIENCE EXPORTS
// =============================================================================

/**
 * Responsive system configuration object
 * Provides a unified interface for the responsive system
 */
export const responsiveSystem = {
  // Breakpoints
  breakpoints: {
    config: () => import("./breakpoints").then((m) => m.defaultBreakpointConfig),
    tailwind: () => import("./breakpoints").then((m) => m.TAILWIND_BREAKPOINTS),
    getPrefix: (bp: import("./types").Breakpoint) =>
      import("./breakpoints").then((m) => m.getBreakpointPrefix(bp)),
    getMediaQuery: (bp: import("./types").Breakpoint) =>
      import("./breakpoints").then((m) => m.getMediaQuery(bp)),
  },

  // Rules
  rules: {
    defaults: () => import("./rules-engine").then((m) => m.defaultResponsiveRules),
    apply: (props: Record<string, unknown>, type: string) =>
      import("./rules-engine").then((m) => m.applyResponsiveRules(props, type)),
    forIndustry: (industry: string) =>
      import("./rules-engine").then((m) => m.createIndustryRules(industry)),
  },

  // Components
  components: {
    getConfig: (type: string) =>
      import("./component-configs").then((m) => m.getComponentResponsiveConfig(type)),
    getAllTypes: () =>
      import("./component-configs").then((m) => m.getAllResponsiveComponentTypes()),
    hasConfig: (type: string) =>
      import("./component-configs").then((m) => m.hasResponsiveConfig(type)),
  },

  // AI
  ai: {
    generate: (input: import("./types").AIResponsiveInput) =>
      import("./ai-config").then((m) => m.generateResponsiveConfig(input)),
    validate: (config: import("./types").ComponentResponsiveConfig) =>
      import("./ai-config").then((m) => m.validateResponsiveConfig(config)),
    optimize: (config: import("./types").ComponentResponsiveConfig) =>
      import("./ai-config").then((m) => m.optimizeResponsiveConfig(config)),
  },

  // Utilities
  utils: () => import("./utilities").then((m) => m.responsiveUtilities),
};
