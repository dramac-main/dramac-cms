/**
 * PHASE AWD-07: Responsive & Mobile-First System
 * Type Definitions for Responsive Configuration
 *
 * These types define the responsive system that ensures every generated
 * website looks award-winning on every device size.
 */

// =============================================================================
// BREAKPOINT TYPES
// =============================================================================

/**
 * Supported breakpoint names
 */
export type Breakpoint = "mobile" | "tablet" | "desktop" | "large";

/**
 * Breakpoint configuration with pixel values
 */
export interface BreakpointConfig {
  mobile: { max: number };
  tablet: { min: number; max: number };
  desktop: { min: number; max: number };
  large: { min: number };
}

/**
 * Breakpoint pixel values (matching Tailwind CSS 4.x)
 */
export interface BreakpointValues {
  sm: string;  // 640px - Mobile landscape
  md: string;  // 768px - Tablet
  lg: string;  // 1024px - Desktop
  xl: string;  // 1280px - Large desktop
  "2xl": string; // 1536px - Extra large
}

// =============================================================================
// RESPONSIVE RULES TYPES
// =============================================================================

/**
 * Layout transformation rules
 */
export interface LayoutRules {
  stackColumnsOnMobile: boolean;
  reverseStackOrder: boolean;
  singleColumnBreakpoint: "mobile" | "tablet";
  maxColumnsPerBreakpoint: Record<Breakpoint, number>;
}

/**
 * Typography scaling rules
 */
export interface TypographyRules {
  scaleRatios: Record<Breakpoint, number>;
  minFontSizes: Record<string, string>;
  lineHeightAdjustments: Record<Breakpoint, number>;
}

/**
 * Spacing adjustment rules
 */
export interface SpacingRules {
  paddingScale: Record<Breakpoint, number>;
  gapScale: Record<Breakpoint, number>;
  sectionPadding: Record<Breakpoint, string>;
  containerPadding: Record<Breakpoint, string>;
}

/**
 * Visibility rules for responsive display
 */
export interface VisibilityRules {
  hideOnMobile: string[];
  showOnlyOnMobile: string[];
  simplifyOnMobile: string[];
}

/**
 * Touch and interaction rules
 */
export interface InteractionRules {
  touchTargetMinSize: string;
  hoverToTapConversion: boolean;
  swipeEnabled: boolean;
  pullToRefresh: boolean;
}

/**
 * Complete responsive rules configuration
 */
export interface ResponsiveRules {
  layout: LayoutRules;
  typography: TypographyRules;
  spacing: SpacingRules;
  visibility: VisibilityRules;
  interactions: InteractionRules;
}

// =============================================================================
// COMPONENT RESPONSIVE CONFIG TYPES
// =============================================================================

/**
 * Typography override for a specific breakpoint
 */
export interface TypographyOverride {
  headingSize?: string;
  bodySize?: string;
  lineHeight?: string;
}

/**
 * Spacing override for a specific breakpoint
 */
export interface SpacingOverride {
  padding?: string;
  gap?: string;
  margin?: string;
}

/**
 * Interaction override for mobile vs desktop
 */
export interface InteractionOverride {
  mobileInteraction: string;
  desktopInteraction: string;
}

/**
 * Layout rules specific to a component
 */
export interface ComponentLayoutRules {
  stackOnMobile: boolean;
  columnsPerBreakpoint: Record<Breakpoint, number>;
  gapPerBreakpoint: Record<Breakpoint, string>;
  alignmentPerBreakpoint: Record<Breakpoint, "start" | "center" | "end" | "between">;
  hideElements?: string[];
  showElements?: string[];
}

/**
 * Typography rules for component configs
 */
export interface ComponentTypographyRules {
  fontSizeScale: Record<Breakpoint, number>;
  lineHeightScale: Record<Breakpoint, number>;
}

/**
 * Visibility rules for component configs
 */
export interface ComponentVisibilityRules {
  elementsToHide: Record<Breakpoint, string[]>;
  elementsToShow: Record<Breakpoint, string[]>;
}

/**
 * Complete responsive configuration for a component
 */
export interface ComponentResponsiveConfig {
  componentType: string;
  breakpointConfig: BreakpointConfig;
  layoutRules: ComponentLayoutRules;
  typographyRules: ComponentTypographyRules;
  visibilityRules: ComponentVisibilityRules;
  mobileVariant: string;
  touchOptimized: boolean;
  priority: "critical" | "high" | "medium" | "low";
  // Legacy support
  tabletVariant?: string;
  typographyOverrides?: Record<Breakpoint, TypographyOverride>;
  spacingOverrides?: Record<Breakpoint, SpacingOverride>;
  interactionOverrides?: InteractionOverride;
}

// =============================================================================
// COMPLETE RESPONSIVE CONFIG TYPE
// =============================================================================

/**
 * Complete responsive configuration
 */
export interface ResponsiveConfig {
  breakpoints: BreakpointConfig;
  rules: ResponsiveRules;
  componentConfigs: Record<string, ComponentResponsiveConfig>;
}

// =============================================================================
// RESPONSIVE VALUE TYPES
// =============================================================================

/**
 * Responsive value that changes per breakpoint
 * Mobile-first: mobile is required, others are optional overrides
 */
export interface ResponsiveValue<T> {
  mobile: T;
  tablet?: T;
  desktop?: T;
  large?: T;
}

/**
 * Responsive string value
 */
export type ResponsiveString = ResponsiveValue<string>;

/**
 * Responsive number value
 */
export type ResponsiveNumber = ResponsiveValue<number>;

/**
 * Responsive boolean value
 */
export type ResponsiveBoolean = ResponsiveValue<boolean>;

// =============================================================================
// RESPONSIVE PROPS TYPES
// =============================================================================

/**
 * Standard responsive props added to components
 */
export interface ResponsiveProps {
  // Mobile layout
  mobileLayout?: "stack" | "grid";
  mobileColumns?: number;
  tabletColumns?: number;
  desktopColumns?: number;

  // Visibility
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  hideOnDesktop?: boolean;

  // Mobile-specific variant
  mobileVariant?: string;

  // Typography scaling
  mobileTypographyScale?: number;

  // Spacing scaling
  mobilePaddingScale?: number;

  // Touch-friendly settings
  touchFriendly?: boolean;
  minTouchTarget?: string;
}

// =============================================================================
// AI RESPONSIVE GENERATION TYPES
// =============================================================================

/**
 * Input for AI responsive config generation
 */
export interface AIResponsiveInput {
  componentType: string;
  componentProps?: Record<string, unknown>;
  industryType?: string;
  componentPurpose?: string;
  contentElements?: string[];
  designContext?: {
    industry?: string;
    targetAudience?: string;
    style?: string;
    primaryColor?: string;
  };
  targetDevices?: Breakpoint[];
  existingStyles?: string;
}

/**
 * Output from AI responsive config generation
 */
export interface AIResponsiveOutput {
  success: boolean;
  config: ComponentResponsiveConfig;
  tailwindClasses: {
    mobile: string;
    tablet: string;
    desktop: string;
    large: string;
  };
  recommendations: string[];
  // Legacy support
  mobileVariant?: string;
  mobileColumns?: number;
  tabletColumns?: number;
  desktopColumns?: number;
  stackOnMobile?: boolean;
  mobileInteraction?: "tap" | "swipe" | "accordion" | "drawer" | "none";
  hideElementsOnMobile?: string[];
  mobileTypographyScale?: number;
}

// =============================================================================
// UTILITY CLASS TYPES
// =============================================================================

/**
 * Responsive utility class groups
 */
export interface ResponsiveUtilityClasses {
  grid: Record<Breakpoint, string>;
  flex: Record<string, string>;
  text: Record<string, Record<Breakpoint, string>>;
  padding: Record<string, Record<Breakpoint, string>>;
  gap: Record<string, Record<Breakpoint, string>>;
  display: Record<string, string>;
  touch: Record<string, string>;
}

/**
 * Generated responsive classes result
 */
export interface GeneratedResponsiveClasses {
  gridClasses: string;
  visibilityClasses: string;
  spacingClasses: string;
  typographyClasses: string;
  interactionClasses: string;
  all: string;
}
