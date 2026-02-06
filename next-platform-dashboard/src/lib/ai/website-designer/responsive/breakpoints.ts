/**
 * PHASE AWD-07: Responsive & Mobile-First System
 * Breakpoint Definitions and Utilities
 *
 * Defines the breakpoint system matching Tailwind CSS 4.x
 * All values are mobile-first (min-width based).
 */

import type { BreakpointConfig, BreakpointValues, Breakpoint } from "./types";

// =============================================================================
// BREAKPOINT VALUES (Tailwind CSS 4.x)
// =============================================================================

/**
 * Standard Tailwind CSS breakpoint values
 */
export const TAILWIND_BREAKPOINTS: BreakpointValues = {
  sm: "640px",   // Mobile landscape
  md: "768px",   // Tablet
  lg: "1024px",  // Desktop
  xl: "1280px",  // Large desktop
  "2xl": "1536px", // Extra large
};

/**
 * Breakpoint numeric values (in pixels)
 */
export const BREAKPOINT_PIXELS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

// =============================================================================
// BREAKPOINT CONFIG
// =============================================================================

/**
 * Breakpoint configuration for our responsive system
 */
export const defaultBreakpointConfig: BreakpointConfig = {
  mobile: { max: 639 },
  tablet: { min: 640, max: 1023 },
  desktop: { min: 1024, max: 1279 },
  large: { min: 1280 },
};

// =============================================================================
// BREAKPOINT UTILITIES
// =============================================================================

/**
 * Get the Tailwind prefix for a breakpoint
 */
export function getBreakpointPrefix(breakpoint: Breakpoint): string {
  const prefixMap: Record<Breakpoint, string> = {
    mobile: "", // Mobile is the base, no prefix needed
    tablet: "sm:",
    desktop: "lg:",
    large: "xl:",
  };
  return prefixMap[breakpoint];
}

/**
 * Get the media query for a breakpoint
 */
export function getMediaQuery(breakpoint: Breakpoint): string {
  switch (breakpoint) {
    case "mobile":
      return `(max-width: ${defaultBreakpointConfig.mobile.max}px)`;
    case "tablet":
      return `(min-width: ${defaultBreakpointConfig.tablet.min}px) and (max-width: ${defaultBreakpointConfig.tablet.max}px)`;
    case "desktop":
      return `(min-width: ${defaultBreakpointConfig.desktop.min}px) and (max-width: ${defaultBreakpointConfig.desktop.max}px)`;
    case "large":
      return `(min-width: ${defaultBreakpointConfig.large.min}px)`;
    default:
      return "";
  }
}

/**
 * Get the min-width media query (mobile-first approach)
 */
export function getMinWidthMediaQuery(breakpoint: Breakpoint): string {
  const minWidths: Record<Breakpoint, number> = {
    mobile: 0,
    tablet: defaultBreakpointConfig.tablet.min,
    desktop: defaultBreakpointConfig.desktop.min,
    large: defaultBreakpointConfig.large.min,
  };
  
  const minWidth = minWidths[breakpoint];
  return minWidth === 0 ? "" : `(min-width: ${minWidth}px)`;
}

/**
 * Determine the breakpoint for a given width
 */
export function getBreakpointForWidth(width: number): Breakpoint {
  if (width < defaultBreakpointConfig.tablet.min) {
    return "mobile";
  }
  if (width < defaultBreakpointConfig.desktop.min) {
    return "tablet";
  }
  if (width < defaultBreakpointConfig.large.min) {
    return "desktop";
  }
  return "large";
}

/**
 * Check if a width matches a breakpoint
 */
export function isBreakpoint(width: number, breakpoint: Breakpoint): boolean {
  return getBreakpointForWidth(width) === breakpoint;
}

/**
 * Check if a width is mobile
 */
export function isMobile(width: number): boolean {
  return width < defaultBreakpointConfig.tablet.min;
}

/**
 * Check if a width is tablet
 */
export function isTablet(width: number): boolean {
  return (
    width >= defaultBreakpointConfig.tablet.min &&
    width < defaultBreakpointConfig.desktop.min
  );
}

/**
 * Check if a width is desktop
 */
export function isDesktop(width: number): boolean {
  return width >= defaultBreakpointConfig.desktop.min;
}

/**
 * Check if a width is large desktop
 */
export function isLargeDesktop(width: number): boolean {
  return width >= defaultBreakpointConfig.large.min;
}

// =============================================================================
// RESPONSIVE VALUE UTILITIES
// =============================================================================

/**
 * Get the effective value for a breakpoint from a responsive value
 * Falls back to smaller breakpoints if not defined
 */
export function getResponsiveValue<T>(
  value: { mobile: T; tablet?: T; desktop?: T; large?: T },
  breakpoint: Breakpoint
): T {
  switch (breakpoint) {
    case "large":
      return value.large ?? value.desktop ?? value.tablet ?? value.mobile;
    case "desktop":
      return value.desktop ?? value.tablet ?? value.mobile;
    case "tablet":
      return value.tablet ?? value.mobile;
    case "mobile":
    default:
      return value.mobile;
  }
}

/**
 * Create a responsive value with the same value for all breakpoints
 */
export function createUniformResponsiveValue<T>(value: T): {
  mobile: T;
  tablet: T;
  desktop: T;
  large: T;
} {
  return {
    mobile: value,
    tablet: value,
    desktop: value,
    large: value,
  };
}

/**
 * Merge two responsive values, with override taking precedence
 */
export function mergeResponsiveValues<T>(
  base: { mobile: T; tablet?: T; desktop?: T; large?: T },
  override: Partial<{ mobile: T; tablet: T; desktop: T; large: T }>
): { mobile: T; tablet?: T; desktop?: T; large?: T } {
  return {
    mobile: override.mobile ?? base.mobile,
    tablet: override.tablet ?? base.tablet,
    desktop: override.desktop ?? base.desktop,
    large: override.large ?? base.large,
  };
}

// =============================================================================
// TAILWIND CLASS UTILITIES
// =============================================================================

/**
 * Generate responsive Tailwind classes from a responsive value
 */
export function generateResponsiveClasses(
  property: string,
  values: { mobile: string; tablet?: string; desktop?: string; large?: string }
): string {
  const classes: string[] = [];

  // Mobile (base)
  classes.push(`${property}-${values.mobile}`);

  // Tablet (sm:)
  if (values.tablet && values.tablet !== values.mobile) {
    classes.push(`sm:${property}-${values.tablet}`);
  }

  // Desktop (lg:)
  if (values.desktop && values.desktop !== (values.tablet ?? values.mobile)) {
    classes.push(`lg:${property}-${values.desktop}`);
  }

  // Large (xl:)
  if (values.large && values.large !== (values.desktop ?? values.tablet ?? values.mobile)) {
    classes.push(`xl:${property}-${values.large}`);
  }

  return classes.join(" ");
}

/**
 * Generate responsive grid columns classes
 */
export function generateGridColsClasses(columns: {
  mobile: number;
  tablet?: number;
  desktop?: number;
  large?: number;
}): string {
  const classes: string[] = [];

  classes.push(`grid-cols-${columns.mobile}`);

  if (columns.tablet && columns.tablet !== columns.mobile) {
    classes.push(`sm:grid-cols-${columns.tablet}`);
  }

  if (columns.desktop && columns.desktop !== (columns.tablet ?? columns.mobile)) {
    classes.push(`lg:grid-cols-${columns.desktop}`);
  }

  if (columns.large && columns.large !== (columns.desktop ?? columns.tablet ?? columns.mobile)) {
    classes.push(`xl:grid-cols-${columns.large}`);
  }

  return classes.join(" ");
}

/**
 * Generate visibility classes
 */
export function generateVisibilityClasses(options: {
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  hideOnDesktop?: boolean;
  showOnlyOnMobile?: boolean;
  showOnlyOnDesktop?: boolean;
}): string {
  const classes: string[] = [];

  if (options.showOnlyOnMobile) {
    classes.push("block sm:hidden");
  } else if (options.showOnlyOnDesktop) {
    classes.push("hidden lg:block");
  } else {
    if (options.hideOnMobile) {
      classes.push("hidden sm:block");
    }
    if (options.hideOnTablet) {
      classes.push("sm:hidden lg:block");
    }
    if (options.hideOnDesktop) {
      classes.push("lg:hidden");
    }
  }

  return classes.join(" ");
}

// =============================================================================
// ORDERED BREAKPOINTS
// =============================================================================

/**
 * Breakpoints in order from smallest to largest
 */
export const BREAKPOINT_ORDER: Breakpoint[] = ["mobile", "tablet", "desktop", "large"];

/**
 * Get all breakpoints at or above a given breakpoint
 */
export function getBreakpointsAbove(breakpoint: Breakpoint): Breakpoint[] {
  const index = BREAKPOINT_ORDER.indexOf(breakpoint);
  return BREAKPOINT_ORDER.slice(index);
}

/**
 * Get all breakpoints at or below a given breakpoint
 */
export function getBreakpointsBelow(breakpoint: Breakpoint): Breakpoint[] {
  const index = BREAKPOINT_ORDER.indexOf(breakpoint);
  return BREAKPOINT_ORDER.slice(0, index + 1);
}
