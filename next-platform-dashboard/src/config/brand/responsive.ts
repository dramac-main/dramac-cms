/**
 * DRAMAC CMS Responsive System
 * 
 * Enterprise-grade responsive utilities including fluid typography,
 * container queries, breakpoint utilities, and responsive helpers.
 * 
 * @module config/brand/responsive
 * @version 1.0.0
 */

import { breakpoints, containerMaxWidths } from './tokens';

// =============================================================================
// TYPES
// =============================================================================

export interface FluidTypeConfig {
  /** Minimum font size (rem) */
  minSize: number;
  /** Maximum font size (rem) */
  maxSize: number;
  /** Minimum viewport width (px) */
  minViewport?: number;
  /** Maximum viewport width (px) */
  maxViewport?: number;
}

export interface ResponsiveValue<T> {
  base?: T;
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
}

export interface ContainerSize {
  name: string;
  minWidth: string;
}

export type BreakpointKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

// =============================================================================
// FLUID TYPOGRAPHY
// =============================================================================

/**
 * Calculate fluid typography using CSS clamp().
 * Creates a value that smoothly scales between min and max sizes.
 * 
 * @example
 * ```css
 * font-size: clamp(1rem, 0.5rem + 2vw, 2rem);
 * ```
 */
export function fluidType({
  minSize,
  maxSize,
  minViewport = 375,
  maxViewport = 1400,
}: FluidTypeConfig): string {
  // Convert viewport widths to rem (assuming 16px base)
  const minVw = minViewport / 16;
  const maxVw = maxViewport / 16;
  
  // Calculate the slope and intercept
  const slope = (maxSize - minSize) / (maxVw - minVw);
  const intercept = minSize - slope * minVw;
  
  // Format the values
  const slopeVw = (slope * 100).toFixed(4);
  const interceptRem = intercept.toFixed(4);
  
  return `clamp(${minSize}rem, ${interceptRem}rem + ${slopeVw}vw, ${maxSize}rem)`;
}

/**
 * Predefined fluid type scale for consistent typography.
 * Each size smoothly scales between mobile and desktop.
 */
export const fluidTypeScale = {
  /** 12px → 14px */
  xs: fluidType({ minSize: 0.75, maxSize: 0.875 }),
  /** 14px → 16px */
  sm: fluidType({ minSize: 0.875, maxSize: 1 }),
  /** 16px → 18px */
  base: fluidType({ minSize: 1, maxSize: 1.125 }),
  /** 18px → 22px */
  lg: fluidType({ minSize: 1.125, maxSize: 1.375 }),
  /** 20px → 28px */
  xl: fluidType({ minSize: 1.25, maxSize: 1.75 }),
  /** 24px → 36px */
  '2xl': fluidType({ minSize: 1.5, maxSize: 2.25 }),
  /** 30px → 48px */
  '3xl': fluidType({ minSize: 1.875, maxSize: 3 }),
  /** 36px → 60px */
  '4xl': fluidType({ minSize: 2.25, maxSize: 3.75 }),
  /** 48px → 80px */
  '5xl': fluidType({ minSize: 3, maxSize: 5 }),
  /** 60px → 96px */
  '6xl': fluidType({ minSize: 3.75, maxSize: 6 }),
} as const;

/**
 * Fluid spacing that scales with viewport.
 * Useful for padding, margins, and gaps.
 */
export const fluidSpacing = {
  /** 8px → 16px */
  xs: fluidType({ minSize: 0.5, maxSize: 1 }),
  /** 16px → 24px */
  sm: fluidType({ minSize: 1, maxSize: 1.5 }),
  /** 24px → 40px */
  md: fluidType({ minSize: 1.5, maxSize: 2.5 }),
  /** 32px → 64px */
  lg: fluidType({ minSize: 2, maxSize: 4 }),
  /** 48px → 96px */
  xl: fluidType({ minSize: 3, maxSize: 6 }),
  /** 64px → 128px */
  '2xl': fluidType({ minSize: 4, maxSize: 8 }),
} as const;

// =============================================================================
// CONTAINER QUERIES
// =============================================================================

/**
 * Container query sizes matching component needs.
 * Use with @container CSS rules.
 */
export const containerSizes: ContainerSize[] = [
  { name: 'xxs', minWidth: '200px' },
  { name: 'xs', minWidth: '320px' },
  { name: 'sm', minWidth: '480px' },
  { name: 'md', minWidth: '640px' },
  { name: 'lg', minWidth: '768px' },
  { name: 'xl', minWidth: '1024px' },
];

/**
 * Generate container query media rule.
 * 
 * @example
 * ```css
 * @container (min-width: 480px) { ... }
 * ```
 */
export function containerQuery(minWidth: string): string {
  return `@container (min-width: ${minWidth})`;
}

/**
 * CSS for defining a container query context.
 */
export const containerStyles = {
  /** Standard container with inline-size containment */
  inline: 'container-type: inline-size;',
  /** Named container for specific targeting */
  named: (name: string) => `container-type: inline-size; container-name: ${name};`,
} as const;

// =============================================================================
// BREAKPOINT UTILITIES
// =============================================================================

/**
 * Get breakpoint value in pixels (as number).
 */
export function getBreakpointPx(key: BreakpointKey): number {
  return parseInt(breakpoints[key], 10);
}

/**
 * Generate media query string for a breakpoint.
 * 
 * @example
 * ```ts
 * mediaQuery('md') // '@media (min-width: 768px)'
 * ```
 */
export function mediaQuery(breakpoint: BreakpointKey): string {
  return `@media (min-width: ${breakpoints[breakpoint]})`;
}

/**
 * Generate max-width media query (for mobile-first edge cases).
 */
export function mediaQueryMax(breakpoint: BreakpointKey): string {
  const px = getBreakpointPx(breakpoint) - 1;
  return `@media (max-width: ${px}px)`;
}

/**
 * Generate range media query (between two breakpoints).
 */
export function mediaQueryBetween(min: BreakpointKey, max: BreakpointKey): string {
  const minPx = breakpoints[min];
  const maxPx = getBreakpointPx(max) - 1;
  return `@media (min-width: ${minPx}) and (max-width: ${maxPx}px)`;
}

/**
 * Check if a breakpoint is currently active (client-side only).
 * Returns null during SSR.
 */
export function isBreakpointActive(breakpoint: BreakpointKey): boolean | null {
  if (typeof window === 'undefined') return null;
  return window.matchMedia(`(min-width: ${breakpoints[breakpoint]})`).matches;
}

/**
 * Get the current active breakpoint (client-side only).
 */
export function getCurrentBreakpoint(): BreakpointKey | 'base' | null {
  if (typeof window === 'undefined') return null;
  
  const orderedBreakpoints: BreakpointKey[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
  
  for (const bp of orderedBreakpoints) {
    if (window.matchMedia(`(min-width: ${breakpoints[bp]})`).matches) {
      return bp;
    }
  }
  
  return 'base';
}

// =============================================================================
// RESPONSIVE VALUE HELPERS
// =============================================================================

/**
 * Get the appropriate value for the current breakpoint.
 * Falls back to smaller breakpoints if not defined.
 * 
 * @example
 * ```ts
 * const padding = getResponsiveValue(
 *   { base: '1rem', md: '2rem', xl: '4rem' },
 *   'lg' // returns '2rem' (falls back to md)
 * );
 * ```
 */
export function getResponsiveValue<T>(
  values: ResponsiveValue<T>,
  currentBreakpoint: BreakpointKey | 'base'
): T | undefined {
  const order: Array<BreakpointKey | 'base'> = ['base', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  const currentIndex = order.indexOf(currentBreakpoint);
  
  // Start from current and work backwards
  for (let i = currentIndex; i >= 0; i--) {
    const key = order[i];
    const value = values[key as keyof ResponsiveValue<T>];
    if (value !== undefined) {
      return value;
    }
  }
  
  return undefined;
}

/**
 * Create responsive CSS custom property value.
 * 
 * @example
 * ```ts
 * responsiveCssVar('--gap', { base: '1rem', lg: '2rem' })
 * // Returns CSS with media queries
 * ```
 */
export function responsiveCssVars(
  varName: string,
  values: ResponsiveValue<string>
): string {
  let css = '';
  
  // Base value (no media query)
  if (values.base) {
    css += `${varName}: ${values.base};\n`;
  }
  
  // Responsive values with media queries
  const breakpointOrder: BreakpointKey[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  
  for (const bp of breakpointOrder) {
    const value = values[bp];
    if (value) {
      css += `${mediaQuery(bp)} { ${varName}: ${value}; }\n`;
    }
  }
  
  return css;
}

// =============================================================================
// ASPECT RATIOS
// =============================================================================

/**
 * Common aspect ratios for responsive media.
 */
export const aspectRatios = {
  square: '1 / 1',
  video: '16 / 9',
  cinema: '21 / 9',
  portrait: '3 / 4',
  landscape: '4 / 3',
  wide: '2 / 1',
  ultrawide: '32 / 9',
  golden: '1.618 / 1',
} as const;

// =============================================================================
// VIEWPORT UNITS HELPERS
// =============================================================================

/**
 * Safe viewport units that account for mobile browser chrome.
 * Uses dvh/dvw (dynamic viewport) with fallback.
 */
export const safeViewportUnits = {
  /** Full viewport height accounting for mobile chrome */
  vh: 'min(100vh, 100dvh)',
  /** Full viewport width */
  vw: 'min(100vw, 100dvw)',
  /** Small viewport height (excludes browser UI) */
  svh: '100svh',
  /** Large viewport height (assumes browser UI hidden) */
  lvh: '100lvh',
  /** Dynamic viewport height (responds to browser UI) */
  dvh: '100dvh',
} as const;

// =============================================================================
// GRID UTILITIES
// =============================================================================

/**
 * Responsive grid column configurations.
 */
export const gridColumns = {
  /** 1 column on mobile, 2 on tablet, 3 on desktop */
  responsive: {
    base: 1,
    sm: 2,
    lg: 3,
  },
  /** Auto-fit with minimum column width */
  autoFit: (minWidth: string) => `repeat(auto-fit, minmax(${minWidth}, 1fr))`,
  /** Auto-fill with minimum column width */
  autoFill: (minWidth: string) => `repeat(auto-fill, minmax(${minWidth}, 1fr))`,
} as const;

/**
 * Generate CSS grid template for responsive columns.
 */
export function responsiveGridCss(minColumnWidth: string = '280px'): string {
  return `
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(${minColumnWidth}, 100%), 1fr));
    gap: var(--spacing-4);
  `;
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  breakpoints,
  containerMaxWidths,
};
