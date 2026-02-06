/**
 * PHASE AWD-07: Responsive & Mobile-First System
 * Responsive Rules Engine
 *
 * Default responsive rules and functions to apply them to components.
 * This engine ensures consistent responsive behavior across all components.
 */

import type {
  ResponsiveRules,
  ResponsiveProps,
  ComponentResponsiveConfig,
  Breakpoint,
} from "./types";
import { getComponentResponsiveConfig } from "./component-configs";

// =============================================================================
// DEFAULT RESPONSIVE RULES
// =============================================================================

/**
 * Default responsive rules for the platform
 * These rules provide sensible defaults that work for most use cases
 */
export const defaultResponsiveRules: ResponsiveRules = {
  // Layout rules
  layout: {
    stackColumnsOnMobile: true,
    reverseStackOrder: false,
    singleColumnBreakpoint: "mobile",
    maxColumnsPerBreakpoint: {
      mobile: 1,
      tablet: 2,
      desktop: 4,
      large: 6,
    },
  },

  // Typography rules
  typography: {
    scaleRatios: {
      mobile: 0.875,    // 87.5% of desktop
      tablet: 0.9375,   // 93.75% of desktop
      desktop: 1,       // Base size
      large: 1.0625,    // 106.25% of desktop
    },
    minFontSizes: {
      body: "14px",
      small: "12px",
      heading: "18px",
      heroHeadline: "24px",
    },
    lineHeightAdjustments: {
      mobile: 1.1,      // Slightly tighter on mobile
      tablet: 1.05,
      desktop: 1,
      large: 1,
    },
  },

  // Spacing rules
  spacing: {
    paddingScale: {
      mobile: 0.5,
      tablet: 0.75,
      desktop: 1,
      large: 1.25,
    },
    gapScale: {
      mobile: 0.75,
      tablet: 0.875,
      desktop: 1,
      large: 1.125,
    },
    sectionPadding: {
      mobile: "3rem 1rem",
      tablet: "4rem 1.5rem",
      desktop: "5rem 2rem",
      large: "6rem 2rem",
    },
    containerPadding: {
      mobile: "1rem",
      tablet: "1.5rem",
      desktop: "2rem",
      large: "2rem",
    },
  },

  // Visibility rules
  visibility: {
    hideOnMobile: [],
    showOnlyOnMobile: [],
    simplifyOnMobile: ["Navbar", "Footer", "Gallery", "Team", "Pricing"],
  },

  // Interaction rules
  interactions: {
    touchTargetMinSize: "48px",
    hoverToTapConversion: true,
    swipeEnabled: true,
    pullToRefresh: false,
  },
};

// =============================================================================
// RULES APPLICATION
// =============================================================================

/**
 * Apply responsive rules to component props
 */
export function applyResponsiveRules(
  componentProps: Record<string, unknown>,
  componentType: string,
  rules: ResponsiveRules = defaultResponsiveRules
): Record<string, unknown> & { responsive: ResponsiveProps } {
  const config = getComponentResponsiveConfig(componentType);

  return {
    ...componentProps,

    // Add responsive configuration
    responsive: buildResponsiveProps(config, rules),
  };
}

/**
 * Build responsive props from config and rules
 */
function buildResponsiveProps(
  config: ComponentResponsiveConfig,
  rules: ResponsiveRules
): ResponsiveProps {
  return {
    // Mobile layout
    mobileLayout: config.layoutRules.stackOnMobile ? "stack" : "grid",
    mobileColumns: config.layoutRules.columnsPerBreakpoint.mobile,
    tabletColumns: config.layoutRules.columnsPerBreakpoint.tablet,
    desktopColumns: config.layoutRules.columnsPerBreakpoint.desktop,

    // Mobile visibility
    hideOnMobile: false,
    hideOnTablet: false,
    hideOnDesktop: false,

    // Mobile-specific variant
    mobileVariant: config.mobileVariant,

    // Typography scaling
    mobileTypographyScale: rules.typography.scaleRatios.mobile,

    // Spacing scaling
    mobilePaddingScale: rules.spacing.paddingScale.mobile,

    // Touch-friendly
    touchFriendly: true,
    minTouchTarget: rules.interactions.touchTargetMinSize,
  };
}

// =============================================================================
// LAYOUT TRANSFORMATION
// =============================================================================

/**
 * Transform layout based on responsive rules
 */
export function transformLayout(
  layout: {
    columns?: number;
    gap?: string;
    direction?: "row" | "column";
  },
  breakpoint: Breakpoint,
  rules: ResponsiveRules = defaultResponsiveRules
): {
  columns: number;
  gap: string;
  direction: "row" | "column";
  shouldStack: boolean;
} {
  const maxColumns = rules.layout.maxColumnsPerBreakpoint[breakpoint];
  const shouldStack =
    breakpoint === "mobile" && rules.layout.stackColumnsOnMobile;

  return {
    columns: Math.min(layout.columns || 1, maxColumns),
    gap: scaleSpacing(layout.gap || "1rem", rules.spacing.gapScale[breakpoint]),
    direction: shouldStack ? "column" : (layout.direction || "row"),
    shouldStack,
  };
}

/**
 * Scale spacing value by a factor
 */
function scaleSpacing(spacing: string, factor: number): string {
  // Extract number and unit
  const match = spacing.match(/^([\d.]+)(.*)$/);
  if (!match) return spacing;

  const value = parseFloat(match[1]);
  const unit = match[2] || "rem";

  return `${(value * factor).toFixed(2)}${unit}`;
}

// =============================================================================
// TYPOGRAPHY SCALING
// =============================================================================

/**
 * Scale typography based on breakpoint
 */
export function scaleTypography(
  baseFontSize: string,
  breakpoint: Breakpoint,
  rules: ResponsiveRules = defaultResponsiveRules
): string {
  const scale = rules.typography.scaleRatios[breakpoint];
  
  // Extract number and unit
  const match = baseFontSize.match(/^([\d.]+)(.*)$/);
  if (!match) return baseFontSize;

  const value = parseFloat(match[1]);
  const unit = match[2] || "rem";

  // Apply scale but respect minimum sizes
  const scaledValue = value * scale;
  const minSize = parseFloat(rules.typography.minFontSizes.body || "14");
  const minUnit = rules.typography.minFontSizes.body?.replace(/[\d.]/g, "") || "px";

  // Convert to same unit for comparison (simplified)
  const effectiveValue = Math.max(scaledValue, minSize * (unit === "px" ? 1 : 0.0625));

  return `${effectiveValue.toFixed(2)}${unit}`;
}

/**
 * Get line height adjustment for breakpoint
 */
export function getLineHeightAdjustment(
  baseLineHeight: number,
  breakpoint: Breakpoint,
  rules: ResponsiveRules = defaultResponsiveRules
): number {
  const adjustment = rules.typography.lineHeightAdjustments[breakpoint];
  return baseLineHeight * adjustment;
}

// =============================================================================
// VISIBILITY DETERMINATION
// =============================================================================

/**
 * Determine if a component should be visible at a breakpoint
 */
export function shouldShowAtBreakpoint(
  componentType: string,
  breakpoint: Breakpoint,
  rules: ResponsiveRules = defaultResponsiveRules
): boolean {
  // Check if hidden on mobile
  if (
    breakpoint === "mobile" &&
    rules.visibility.hideOnMobile.includes(componentType)
  ) {
    return false;
  }

  // Check if show only on mobile
  if (
    breakpoint !== "mobile" &&
    rules.visibility.showOnlyOnMobile.includes(componentType)
  ) {
    return false;
  }

  return true;
}

/**
 * Check if component should be simplified on mobile
 */
export function shouldSimplifyOnMobile(
  componentType: string,
  rules: ResponsiveRules = defaultResponsiveRules
): boolean {
  return rules.visibility.simplifyOnMobile.includes(componentType);
}

// =============================================================================
// TOUCH TARGET VALIDATION
// =============================================================================

/**
 * Validate and adjust touch target size
 */
export function ensureMinimumTouchTarget(
  size: string,
  rules: ResponsiveRules = defaultResponsiveRules
): string {
  const minSize = rules.interactions.touchTargetMinSize;
  
  // Parse sizes
  const currentMatch = size.match(/^([\d.]+)(.*)$/);
  const minMatch = minSize.match(/^([\d.]+)(.*)$/);

  if (!currentMatch || !minMatch) return minSize;

  const currentValue = parseFloat(currentMatch[1]);
  const minValue = parseFloat(minMatch[1]);
  const unit = currentMatch[2] || minMatch[2] || "px";

  return currentValue >= minValue ? size : minSize;
}

/**
 * Get touch-friendly button classes
 */
export function getTouchFriendlyClasses(
  rules: ResponsiveRules = defaultResponsiveRules
): string {
  const minSize = rules.interactions.touchTargetMinSize;
  return `min-h-[${minSize}] min-w-[${minSize}]`;
}

// =============================================================================
// SPACING APPLICATION
// =============================================================================

/**
 * Get section padding for a breakpoint
 */
export function getSectionPadding(
  breakpoint: Breakpoint,
  rules: ResponsiveRules = defaultResponsiveRules
): string {
  return rules.spacing.sectionPadding[breakpoint];
}

/**
 * Get container padding for a breakpoint
 */
export function getContainerPadding(
  breakpoint: Breakpoint,
  rules: ResponsiveRules = defaultResponsiveRules
): string {
  return rules.spacing.containerPadding[breakpoint];
}

/**
 * Generate responsive padding classes
 */
export function generatePaddingClasses(
  rules: ResponsiveRules = defaultResponsiveRules
): string {
  const { sectionPadding } = rules.spacing;
  
  // Parse and generate classes
  const classes = [
    parsePaddingToClasses(sectionPadding.mobile, ""),
    parsePaddingToClasses(sectionPadding.tablet, "sm:"),
    parsePaddingToClasses(sectionPadding.desktop, "lg:"),
    parsePaddingToClasses(sectionPadding.large, "xl:"),
  ];

  return classes.filter(Boolean).join(" ");
}

/**
 * Parse padding value to Tailwind classes
 */
function parsePaddingToClasses(padding: string, prefix: string): string {
  // Handle "3rem 1rem" format (py px)
  const parts = padding.split(" ").map((p) => p.trim());
  
  if (parts.length === 2) {
    const py = remToTailwind(parts[0]);
    const px = remToTailwind(parts[1]);
    return `${prefix}py-${py} ${prefix}px-${px}`;
  } else if (parts.length === 1) {
    const p = remToTailwind(parts[0]);
    return `${prefix}p-${p}`;
  }

  return "";
}

/**
 * Convert rem value to Tailwind spacing value
 */
function remToTailwind(rem: string): string {
  const value = parseFloat(rem);
  // Tailwind spacing: 1 = 0.25rem, 4 = 1rem, 16 = 4rem
  const tailwindValue = Math.round(value * 4);
  return String(tailwindValue);
}

// =============================================================================
// RULE MERGING
// =============================================================================

/**
 * Merge custom rules with defaults
 */
export function mergeResponsiveRules(
  customRules: Partial<ResponsiveRules>
): ResponsiveRules {
  return {
    layout: {
      ...defaultResponsiveRules.layout,
      ...customRules.layout,
    },
    typography: {
      ...defaultResponsiveRules.typography,
      ...customRules.typography,
    },
    spacing: {
      ...defaultResponsiveRules.spacing,
      ...customRules.spacing,
    },
    visibility: {
      ...defaultResponsiveRules.visibility,
      ...customRules.visibility,
    },
    interactions: {
      ...defaultResponsiveRules.interactions,
      ...customRules.interactions,
    },
  };
}

/**
 * Create industry-specific rules
 */
export function createIndustryRules(industry: string): ResponsiveRules {
  // Industry-specific adjustments
  const adjustments: Partial<ResponsiveRules> = {};

  switch (industry.toLowerCase()) {
    case "restaurant":
    case "food":
      // Restaurants need larger touch targets for menu items
      adjustments.interactions = {
        ...defaultResponsiveRules.interactions,
        touchTargetMinSize: "56px",
      };
      break;

    case "ecommerce":
    case "retail":
      // E-commerce needs more columns on larger screens
      adjustments.layout = {
        ...defaultResponsiveRules.layout,
        maxColumnsPerBreakpoint: {
          mobile: 2,
          tablet: 3,
          desktop: 4,
          large: 5,
        },
      };
      break;

    case "portfolio":
    case "photography":
      // Portfolio sites can have more visual density
      adjustments.spacing = {
        ...defaultResponsiveRules.spacing,
        gapScale: {
          mobile: 0.5,
          tablet: 0.75,
          desktop: 1,
          large: 1.25,
        },
      };
      break;

    case "healthcare":
    case "medical":
      // Healthcare needs maximum readability
      adjustments.typography = {
        ...defaultResponsiveRules.typography,
        minFontSizes: {
          body: "16px",
          small: "14px",
          heading: "20px",
          heroHeadline: "28px",
        },
      };
      break;
  }

  return mergeResponsiveRules(adjustments);
}
