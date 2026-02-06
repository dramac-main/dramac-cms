/**
 * PHASE AWD-07: Responsive & Mobile-First System
 * Responsive Utilities
 *
 * Helper functions for generating responsive Tailwind CSS classes
 * and managing responsive behavior across components.
 */

import type {
  Breakpoint,
  ResponsiveValue,
  ResponsiveProps,
} from "./types";
import {
  TAILWIND_BREAKPOINTS,
  getBreakpointPrefix,
  getResponsiveValue,
} from "./breakpoints";
import { getComponentResponsiveConfig } from "./component-configs";

// =============================================================================
// RESPONSIVE CLASS GENERATORS
// =============================================================================

/**
 * Generate responsive grid column classes
 */
export function generateGridClasses(
  componentType: string
): string {
  const config = getComponentResponsiveConfig(componentType);
  const { columnsPerBreakpoint } = config.layoutRules;

  const classes = [
    `grid-cols-${columnsPerBreakpoint.mobile}`,
    `sm:grid-cols-${columnsPerBreakpoint.tablet}`,
    `lg:grid-cols-${columnsPerBreakpoint.desktop}`,
    `xl:grid-cols-${columnsPerBreakpoint.large}`,
  ];

  return classes.join(" ");
}

/**
 * Generate responsive gap classes
 */
export function generateGapClasses(
  componentType: string
): string {
  const config = getComponentResponsiveConfig(componentType);
  const gapPerBreakpoint = config.layoutRules.gapPerBreakpoint;

  // Convert rem values to Tailwind gap classes
  const classes = [
    `gap-${remToTailwindSpacing(gapPerBreakpoint.mobile)}`,
    `sm:gap-${remToTailwindSpacing(gapPerBreakpoint.tablet)}`,
    `lg:gap-${remToTailwindSpacing(gapPerBreakpoint.desktop)}`,
    `xl:gap-${remToTailwindSpacing(gapPerBreakpoint.large)}`,
  ];

  return classes.join(" ");
}

/**
 * Generate responsive padding classes
 */
export function generateSectionPadding(): string {
  // Mobile first: py-12 px-4
  // sm: py-16 px-6
  // lg: py-20 px-8
  // xl: py-24 px-8
  return "py-12 px-4 sm:py-16 sm:px-6 lg:py-20 lg:px-8 xl:py-24";
}

/**
 * Generate responsive container padding
 */
export function generateContainerPadding(): string {
  return "px-4 sm:px-6 lg:px-8";
}

/**
 * Generate responsive text alignment classes
 */
export function generateAlignmentClasses(
  componentType: string
): string {
  const config = getComponentResponsiveConfig(componentType);
  const alignmentPerBreakpoint = config.layoutRules.alignmentPerBreakpoint;

  const alignmentMap: Record<string, string> = {
    start: "text-left",
    center: "text-center",
    end: "text-right",
    between: "text-left", // justify-between is for flex
  };

  const classes = [
    alignmentMap[alignmentPerBreakpoint.mobile] || "text-center",
    `sm:${alignmentMap[alignmentPerBreakpoint.tablet] || "text-left"}`,
    `lg:${alignmentMap[alignmentPerBreakpoint.desktop] || "text-left"}`,
    `xl:${alignmentMap[alignmentPerBreakpoint.large] || "text-left"}`,
  ];

  return classes.join(" ");
}

/**
 * Generate responsive flex alignment classes
 */
export function generateFlexAlignmentClasses(
  componentType: string
): string {
  const config = getComponentResponsiveConfig(componentType);
  const alignmentPerBreakpoint = config.layoutRules.alignmentPerBreakpoint;

  const flexAlignMap: Record<string, string> = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
  };

  const classes = [
    flexAlignMap[alignmentPerBreakpoint.mobile] || "justify-center",
    `sm:${flexAlignMap[alignmentPerBreakpoint.tablet] || "justify-start"}`,
    `lg:${flexAlignMap[alignmentPerBreakpoint.desktop] || "justify-start"}`,
    `xl:${flexAlignMap[alignmentPerBreakpoint.large] || "justify-start"}`,
  ];

  return classes.join(" ");
}

/**
 * Generate responsive flex direction classes
 */
export function generateFlexDirectionClasses(
  stackOnMobile: boolean
): string {
  if (stackOnMobile) {
    return "flex-col lg:flex-row";
  }
  return "flex-row";
}

/**
 * Generate responsive font size classes
 */
export function generateFontSizeClasses(
  baseSize: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl",
  componentType?: string
): string {
  // Font size scale map
  const scaleMap: Record<string, Record<string, string>> = {
    xs: { mobile: "text-xs", tablet: "text-xs", desktop: "text-xs", large: "text-xs" },
    sm: { mobile: "text-xs", tablet: "text-sm", desktop: "text-sm", large: "text-sm" },
    base: { mobile: "text-sm", tablet: "text-base", desktop: "text-base", large: "text-base" },
    lg: { mobile: "text-base", tablet: "text-lg", desktop: "text-lg", large: "text-xl" },
    xl: { mobile: "text-lg", tablet: "text-xl", desktop: "text-xl", large: "text-2xl" },
    "2xl": { mobile: "text-xl", tablet: "text-2xl", desktop: "text-2xl", large: "text-3xl" },
    "3xl": { mobile: "text-2xl", tablet: "text-3xl", desktop: "text-3xl", large: "text-4xl" },
    "4xl": { mobile: "text-2xl", tablet: "text-3xl", desktop: "text-4xl", large: "text-5xl" },
    "5xl": { mobile: "text-3xl", tablet: "text-4xl", desktop: "text-5xl", large: "text-6xl" },
    "6xl": { mobile: "text-4xl", tablet: "text-5xl", desktop: "text-6xl", large: "text-7xl" },
  };

  const sizes = scaleMap[baseSize] || scaleMap.base;

  return `${sizes.mobile} sm:${sizes.tablet} lg:${sizes.desktop} xl:${sizes.large}`;
}

/**
 * Generate responsive heading classes
 */
export function generateHeadingClasses(
  level: 1 | 2 | 3 | 4 | 5 | 6
): string {
  const headingMap: Record<number, string> = {
    1: generateFontSizeClasses("5xl"),
    2: generateFontSizeClasses("4xl"),
    3: generateFontSizeClasses("3xl"),
    4: generateFontSizeClasses("2xl"),
    5: generateFontSizeClasses("xl"),
    6: generateFontSizeClasses("lg"),
  };

  return headingMap[level] || headingMap[2];
}

// =============================================================================
// VISIBILITY CLASSES
// =============================================================================

/**
 * Generate hide on mobile class
 */
export function hideOnMobile(): string {
  return "hidden sm:block";
}

/**
 * Generate show only on mobile class
 */
export function showOnlyOnMobile(): string {
  return "sm:hidden";
}

/**
 * Generate hide on tablet class
 */
export function hideOnTablet(): string {
  return "sm:hidden lg:block";
}

/**
 * Generate hide on desktop class
 */
export function hideOnDesktop(): string {
  return "lg:hidden";
}

/**
 * Generate conditional visibility classes
 */
export function generateVisibilityClasses(
  visibility: {
    mobile: boolean;
    tablet: boolean;
    desktop: boolean;
    large: boolean;
  }
): string {
  const classes: string[] = [];

  // Start with base visibility
  if (!visibility.mobile) {
    classes.push("hidden");
  }

  // Add breakpoint-specific visibility
  if (visibility.tablet && !visibility.mobile) {
    classes.push("sm:block");
  } else if (!visibility.tablet && visibility.mobile) {
    classes.push("sm:hidden");
  }

  if (visibility.desktop && !visibility.tablet) {
    classes.push("lg:block");
  } else if (!visibility.desktop && visibility.tablet) {
    classes.push("lg:hidden");
  }

  if (visibility.large && !visibility.desktop) {
    classes.push("xl:block");
  } else if (!visibility.large && visibility.desktop) {
    classes.push("xl:hidden");
  }

  return classes.join(" ");
}

// =============================================================================
// SPACING UTILITIES
// =============================================================================

/**
 * Generate responsive margin classes
 */
export function generateMarginClasses(
  values: ResponsiveValue<string> | string
): string {
  const classes: string[] = [];

  if (typeof values === "string") {
    classes.push(`m-${remToTailwindSpacing(values)}`);
  } else {
    if (values.mobile) classes.push(`m-${remToTailwindSpacing(values.mobile)}`);
    if (values.tablet) classes.push(`sm:m-${remToTailwindSpacing(values.tablet)}`);
    if (values.desktop) classes.push(`lg:m-${remToTailwindSpacing(values.desktop)}`);
    if (values.large) classes.push(`xl:m-${remToTailwindSpacing(values.large)}`);
  }

  return classes.join(" ");
}

/**
 * Generate responsive padding classes from values
 */
export function generatePaddingClasses(
  values: ResponsiveValue<string> | string
): string {
  const classes: string[] = [];

  if (typeof values === "string") {
    classes.push(`p-${remToTailwindSpacing(values)}`);
  } else {
    if (values.mobile) classes.push(`p-${remToTailwindSpacing(values.mobile)}`);
    if (values.tablet) classes.push(`sm:p-${remToTailwindSpacing(values.tablet)}`);
    if (values.desktop) classes.push(`lg:p-${remToTailwindSpacing(values.desktop)}`);
    if (values.large) classes.push(`xl:p-${remToTailwindSpacing(values.large)}`);
  }

  return classes.join(" ");
}

// =============================================================================
// TOUCH OPTIMIZATION
// =============================================================================

/**
 * Generate touch-friendly button classes
 */
export function touchFriendlyButton(): string {
  return "min-h-[48px] min-w-[48px] touch-manipulation";
}

/**
 * Generate touch-friendly link classes
 */
export function touchFriendlyLink(): string {
  return "py-3 px-4 -my-3 -mx-4 touch-manipulation";
}

/**
 * Generate touch-friendly input classes
 */
export function touchFriendlyInput(): string {
  return "min-h-[48px] text-base touch-manipulation";
}

// =============================================================================
// COMPONENT-SPECIFIC UTILITIES
// =============================================================================

/**
 * Generate responsive hero layout classes
 */
export function generateHeroClasses(): string {
  return [
    // Container
    "relative overflow-hidden",
    // Section padding
    generateSectionPadding(),
    // Min height
    "min-h-[60vh] sm:min-h-[70vh] lg:min-h-[80vh]",
    // Flex layout
    "flex flex-col lg:flex-row items-center",
    // Gap
    "gap-8 lg:gap-12 xl:gap-16",
  ].join(" ");
}

/**
 * Generate responsive navbar classes
 */
export function generateNavbarClasses(): string {
  return [
    // Positioning
    "sticky top-0 z-50",
    // Background
    "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
    // Border
    "border-b",
    // Container padding
    generateContainerPadding(),
    // Height
    "h-16 sm:h-18 lg:h-20",
    // Flex
    "flex items-center justify-between",
  ].join(" ");
}

/**
 * Generate responsive footer classes
 */
export function generateFooterClasses(): string {
  return [
    // Section padding
    "py-12 sm:py-16 lg:py-20",
    generateContainerPadding(),
    // Border
    "border-t",
  ].join(" ");
}

/**
 * Generate responsive card classes
 */
export function generateCardClasses(): string {
  return [
    // Background
    "bg-card",
    // Border
    "border rounded-lg",
    // Shadow
    "shadow-sm hover:shadow-md transition-shadow",
    // Padding
    "p-4 sm:p-5 lg:p-6",
    // Full width on mobile
    "w-full",
  ].join(" ");
}

/**
 * Generate responsive grid wrapper classes
 */
export function generateGridWrapperClasses(
  componentType: string
): string {
  return [
    "grid",
    generateGridClasses(componentType),
    generateGapClasses(componentType),
  ].join(" ");
}

// =============================================================================
// IMAGE RESPONSIVE UTILITIES
// =============================================================================

/**
 * Generate responsive image classes
 */
export function generateImageClasses(
  aspectRatio?: "square" | "video" | "portrait" | "wide"
): string {
  const ratioClasses: Record<string, string> = {
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[3/4]",
    wide: "aspect-[21/9]",
  };

  return [
    "w-full h-auto",
    "object-cover",
    ratioClasses[aspectRatio || "video"] || "",
  ].filter(Boolean).join(" ");
}

/**
 * Generate responsive background image classes
 */
export function generateBgImageClasses(): string {
  return "bg-cover bg-center bg-no-repeat";
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Convert rem value to Tailwind spacing value
 */
function remToTailwindSpacing(rem: string): string {
  // Extract number from rem string
  const match = rem.match(/^([\d.]+)/);
  if (!match) return "4"; // Default to 1rem

  const value = parseFloat(match[1]);
  
  // Tailwind spacing: 1 = 0.25rem, 4 = 1rem
  const tailwindValue = Math.round(value * 4);
  
  // Clamp to valid Tailwind values
  const validValues = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96];
  
  // Find closest valid value
  const closest = validValues.reduce((prev, curr) => {
    return Math.abs(curr - tailwindValue) < Math.abs(prev - tailwindValue) ? curr : prev;
  });

  return String(closest);
}

/**
 * Join multiple class strings, filtering out empty values
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Create responsive value helper
 */
export function responsive<T>(
  mobile: T,
  tablet?: T,
  desktop?: T,
  large?: T
): ResponsiveValue<T> {
  return {
    mobile,
    tablet: tablet ?? mobile,
    desktop: desktop ?? tablet ?? mobile,
    large: large ?? desktop ?? tablet ?? mobile,
  };
}

// =============================================================================
// RESPONSIVE UTILITIES OBJECT
// =============================================================================

/**
 * Exported utilities object for easy access
 */
export const responsiveUtilities = {
  // Class generators
  grid: generateGridClasses,
  gap: generateGapClasses,
  sectionPadding: generateSectionPadding,
  containerPadding: generateContainerPadding,
  alignment: generateAlignmentClasses,
  flexAlignment: generateFlexAlignmentClasses,
  flexDirection: generateFlexDirectionClasses,
  fontSize: generateFontSizeClasses,
  heading: generateHeadingClasses,
  visibility: generateVisibilityClasses,
  margin: generateMarginClasses,
  padding: generatePaddingClasses,
  gridWrapper: generateGridWrapperClasses,
  image: generateImageClasses,
  bgImage: generateBgImageClasses,

  // Visibility helpers
  hideOnMobile,
  showOnlyOnMobile,
  hideOnTablet,
  hideOnDesktop,

  // Touch optimization
  touchButton: touchFriendlyButton,
  touchLink: touchFriendlyLink,
  touchInput: touchFriendlyInput,

  // Component-specific
  hero: generateHeroClasses,
  navbar: generateNavbarClasses,
  footer: generateFooterClasses,
  card: generateCardClasses,

  // Utilities
  cn,
  responsive,
};
