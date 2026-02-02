/**
 * DRAMAC Studio Responsive Utilities
 * 
 * Helpers for working with responsive values (mobile-first).
 */

import type { Breakpoint } from "@/types/studio";

// =============================================================================
// TYPES
// =============================================================================

/**
 * A value that can vary by breakpoint
 */
export type ResponsiveValue<T> = {
  mobile: T;      // Required - base value (0-767px)
  tablet?: T;     // Optional (768-1023px)
  desktop?: T;    // Optional (1024px+)
};

/**
 * Spacing value type
 */
export interface Spacing {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

// =============================================================================
// BREAKPOINTS
// =============================================================================

export const BREAKPOINT_WIDTHS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
} as const;

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Check if a value is a ResponsiveValue object
 */
export function isResponsiveValue<T>(
  value: T | ResponsiveValue<T>
): value is ResponsiveValue<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "mobile" in value
  );
}

/**
 * Get the value for a specific breakpoint (with fallback)
 */
export function getBreakpointValue<T>(
  value: T | ResponsiveValue<T>,
  breakpoint: Breakpoint
): T {
  if (!isResponsiveValue(value)) {
    return value;
  }
  
  // Mobile-first: use the highest available breakpoint at or below current
  if (breakpoint === "desktop") {
    return value.desktop ?? value.tablet ?? value.mobile;
  }
  if (breakpoint === "tablet") {
    return value.tablet ?? value.mobile;
  }
  return value.mobile;
}

/**
 * Create a responsive value with a single value for all breakpoints
 */
export function createResponsiveValue<T>(value: T): ResponsiveValue<T> {
  return { mobile: value };
}

/**
 * Merge two responsive values (newValue takes precedence)
 */
export function mergeResponsiveValue<T>(
  base: ResponsiveValue<T>,
  update: Partial<ResponsiveValue<T>>
): ResponsiveValue<T> {
  return {
    mobile: update.mobile ?? base.mobile,
    tablet: update.tablet ?? base.tablet,
    desktop: update.desktop ?? base.desktop,
  };
}

// =============================================================================
// CSS GENERATION
// =============================================================================

/**
 * Generate inline styles for a responsive value
 * Returns CSS custom properties that work with our CSS media queries
 */
export function responsiveStyles(
  property: string,
  value: ResponsiveValue<string> | string
): React.CSSProperties {
  if (!isResponsiveValue(value)) {
    return { [property]: value };
  }
  
  // We use CSS custom properties for responsive values
  // The actual media query handling is in studio.css
  return {
    [`--studio-${property}-mobile`]: value.mobile,
    [`--studio-${property}-tablet`]: value.tablet ?? value.mobile,
    [`--studio-${property}-desktop`]: value.desktop ?? value.tablet ?? value.mobile,
  } as React.CSSProperties;
}

/**
 * Convert spacing object to CSS value
 */
export function spacingToCss(spacing: Spacing): string {
  return `${spacing.top} ${spacing.right} ${spacing.bottom} ${spacing.left}`;
}

/**
 * Create spacing from a single value
 */
export function uniformSpacing(value: string): Spacing {
  return { top: value, right: value, bottom: value, left: value };
}

/**
 * Create spacing from vertical/horizontal values
 */
export function axisSpacing(vertical: string, horizontal: string): Spacing {
  return { top: vertical, right: horizontal, bottom: vertical, left: horizontal };
}

/**
 * Parse a CSS shorthand spacing value to Spacing object
 */
export function parseSpacing(value: string): Spacing {
  const parts = value.trim().split(/\s+/);
  if (parts.length === 1) {
    return uniformSpacing(parts[0]);
  }
  if (parts.length === 2) {
    return axisSpacing(parts[0], parts[1]);
  }
  if (parts.length === 3) {
    return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[1] };
  }
  return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] };
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

export const DEFAULT_SPACING: Spacing = {
  top: "0px",
  right: "0px",
  bottom: "0px",
  left: "0px",
};

export const DEFAULT_RESPONSIVE_PADDING: ResponsiveValue<Spacing> = {
  mobile: uniformSpacing("16px"),
  tablet: uniformSpacing("24px"),
  desktop: uniformSpacing("32px"),
};

export const DEFAULT_RESPONSIVE_MARGIN: ResponsiveValue<Spacing> = {
  mobile: DEFAULT_SPACING,
};

// =============================================================================
// ANIMATION HELPERS
// =============================================================================

export type AnimationType = 
  | "none" 
  | "fade-in" 
  | "slide-up" 
  | "slide-down" 
  | "slide-left"
  | "slide-right"
  | "scale-in" 
  | "blur-in";

export interface AnimationConfig {
  type: AnimationType;
  delay: number;
  duration: number;
  onScroll: boolean;
}

export const DEFAULT_ANIMATION: AnimationConfig = {
  type: "none",
  delay: 0,
  duration: 500,
  onScroll: false,
};

/**
 * Get CSS class for animation type
 */
export function getAnimationClass(config: AnimationConfig): string {
  if (config.type === "none") return "";
  return `studio-animate-${config.type}`;
}

/**
 * Get animation CSS custom properties
 */
export function getAnimationStyles(config: AnimationConfig): React.CSSProperties {
  if (config.type === "none") return {};
  return {
    "--studio-animation-delay": `${config.delay}ms`,
    "--studio-animation-duration": `${config.duration}ms`,
  } as React.CSSProperties;
}

// =============================================================================
// VISIBILITY HELPERS
// =============================================================================

/**
 * Get CSS class for hiding on specific breakpoints
 */
export function getVisibilityClass(hideOn?: Breakpoint[]): string {
  if (!hideOn || hideOn.length === 0) return "";
  
  return hideOn.map((bp) => `studio-hide-${bp}`).join(" ");
}

// =============================================================================
// RESPONSIVE VALUE SETTERS (for field editing)
// =============================================================================

/**
 * Set a value for a specific breakpoint, returning a new ResponsiveValue
 */
export function setBreakpointValue<T>(
  currentValue: T | ResponsiveValue<T>,
  breakpoint: Breakpoint,
  newValue: T
): ResponsiveValue<T> {
  if (!isResponsiveValue(currentValue)) {
    // Convert to responsive, using current value as mobile base
    const base: ResponsiveValue<T> = { mobile: currentValue };
    base[breakpoint] = newValue;
    return base;
  }
  
  return {
    ...currentValue,
    [breakpoint]: newValue,
  };
}

/**
 * Convert a plain value to a responsive value object
 */
export function toResponsiveValue<T>(value: T): ResponsiveValue<T> {
  if (isResponsiveValue(value)) {
    return value;
  }
  return { mobile: value };
}

/**
 * Convert a responsive value back to plain (using mobile as default)
 */
export function fromResponsiveValue<T>(value: T | ResponsiveValue<T>): T {
  if (isResponsiveValue(value)) {
    return value.mobile;
  }
  return value;
}

/**
 * Check if all breakpoints have the same value
 */
export function areAllBreakpointsSame<T>(value: ResponsiveValue<T>): boolean {
  const mobile = value.mobile;
  const tablet = value.tablet ?? mobile;
  const desktop = value.desktop ?? tablet;
  
  // For objects, compare JSON
  if (typeof mobile === "object" && mobile !== null) {
    return JSON.stringify(mobile) === JSON.stringify(tablet) &&
           JSON.stringify(tablet) === JSON.stringify(desktop);
  }
  
  return mobile === tablet && tablet === desktop;
}

/**
 * Get a summary string of all breakpoint values
 */
export function getResponsiveSummary<T>(
  value: T | ResponsiveValue<T>,
  formatter?: (val: T) => string
): string {
  const format = formatter || ((v: T) => String(v));
  
  if (!isResponsiveValue(value)) {
    return format(value);
  }
  
  const parts: string[] = [];
  parts.push(`📱 ${format(value.mobile)}`);
  
  if (value.tablet !== undefined) {
    parts.push(`💻 ${format(value.tablet)}`);
  }
  
  if (value.desktop !== undefined) {
    parts.push(`🖥️ ${format(value.desktop)}`);
  }
  
  return parts.join(" | ");
}

// =============================================================================
// BREAKPOINT CONSTANTS FOR UI
// =============================================================================

export const BREAKPOINT_LABELS: Record<Breakpoint, string> = {
  mobile: "Mobile",
  tablet: "Tablet",
  desktop: "Desktop",
} as const;

export const BREAKPOINT_ICONS: Record<Breakpoint, string> = {
  mobile: "📱",
  tablet: "💻",
  desktop: "🖥️",
} as const;

export const BREAKPOINT_PIXELS: Record<Breakpoint, number> = {
  mobile: 375,
  tablet: 768,
  desktop: 1280,
} as const;
