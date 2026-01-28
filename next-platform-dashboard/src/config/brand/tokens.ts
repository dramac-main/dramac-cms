/**
 * DRAMAC CMS Design Tokens Configuration
 * 
 * Typography, spacing, borders, shadows, and breakpoints.
 * These tokens ensure consistent design across the platform.
 * 
 * @module config/brand/tokens
 * @version 1.0.0
 */

import type {
  TypographyConfig,
  SpacingScale,
  BorderRadiusScale,
  ShadowScale,
  Breakpoints,
  FontFamily,
  FontSizeScale,
  FontWeights,
} from './types';

// =============================================================================
// TYPOGRAPHY
// =============================================================================

/**
 * Font family configuration.
 * Uses Geist font family with system font fallbacks.
 */
export const fontFamilies: FontFamily = {
  /** Sans-serif font stack */
  sans: 'var(--font-geist-sans), ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  
  /** Monospace font stack */
  mono: 'var(--font-geist-mono), ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  
  /** Display font (optional, same as sans by default) */
  display: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
};

/**
 * Font size scale with line heights.
 * Based on a 1.25 major third scale.
 */
export const fontSizes: FontSizeScale = {
  xs: { size: '0.75rem', lineHeight: '1rem' },           // 12px
  sm: { size: '0.875rem', lineHeight: '1.25rem' },       // 14px
  base: { size: '1rem', lineHeight: '1.5rem' },          // 16px
  lg: { size: '1.125rem', lineHeight: '1.75rem' },       // 18px
  xl: { size: '1.25rem', lineHeight: '1.75rem' },        // 20px
  '2xl': { size: '1.5rem', lineHeight: '2rem' },         // 24px
  '3xl': { size: '1.875rem', lineHeight: '2.25rem' },    // 30px
  '4xl': { size: '2.25rem', lineHeight: '2.5rem' },      // 36px
  '5xl': { size: '3rem', lineHeight: '1' },              // 48px
  '6xl': { size: '3.75rem', lineHeight: '1' },           // 60px
  '7xl': { size: '4.5rem', lineHeight: '1' },            // 72px
  '8xl': { size: '6rem', lineHeight: '1' },              // 96px
  '9xl': { size: '8rem', lineHeight: '1' },              // 128px
};

/**
 * Font weight scale.
 */
export const fontWeights: FontWeights = {
  thin: 100,
  extralight: 200,
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
};

/**
 * Complete typography configuration.
 */
export const typography: TypographyConfig = {
  families: fontFamilies,
  sizes: fontSizes,
  weights: fontWeights,
};

// =============================================================================
// SPACING
// =============================================================================

/**
 * Spacing scale based on 4px base unit.
 * Matches Tailwind's default spacing scale.
 */
export const spacing: SpacingScale = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',   // 2px
  1: '0.25rem',      // 4px
  1.5: '0.375rem',   // 6px
  2: '0.5rem',       // 8px
  2.5: '0.625rem',   // 10px
  3: '0.75rem',      // 12px
  3.5: '0.875rem',   // 14px
  4: '1rem',         // 16px
  5: '1.25rem',      // 20px
  6: '1.5rem',       // 24px
  7: '1.75rem',      // 28px
  8: '2rem',         // 32px
  9: '2.25rem',      // 36px
  10: '2.5rem',      // 40px
  11: '2.75rem',     // 44px
  12: '3rem',        // 48px
  14: '3.5rem',      // 56px
  16: '4rem',        // 64px
  20: '5rem',        // 80px
  24: '6rem',        // 96px
  28: '7rem',        // 112px
  32: '8rem',        // 128px
  36: '9rem',        // 144px
  40: '10rem',       // 160px
  44: '11rem',       // 176px
  48: '12rem',       // 192px
  52: '13rem',       // 208px
  56: '14rem',       // 224px
  60: '15rem',       // 240px
  64: '16rem',       // 256px
  72: '18rem',       // 288px
  80: '20rem',       // 320px
  96: '24rem',       // 384px
};

// =============================================================================
// BORDER RADIUS
// =============================================================================

/**
 * Border radius scale.
 * Provides consistent rounding across components.
 */
export const borderRadius: BorderRadiusScale = {
  none: '0',
  sm: '0.125rem',     // 2px
  DEFAULT: '0.25rem', // 4px
  md: '0.375rem',     // 6px
  lg: '0.5rem',       // 8px
  xl: '0.75rem',      // 12px
  '2xl': '1rem',      // 16px
  '3xl': '1.5rem',    // 24px
  full: '9999px',
};

/**
 * Component-specific radius (for shadcn/ui compatibility).
 */
export const componentRadius = '0.625rem'; // 10px

// =============================================================================
// SHADOWS
// =============================================================================

/**
 * Shadow scale for depth and elevation.
 */
export const shadows: ShadowScale = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: 'none',
};

// =============================================================================
// BREAKPOINTS
// =============================================================================

/**
 * Responsive breakpoint configuration.
 * Mobile-first approach with min-width queries.
 */
export const breakpoints: Breakpoints = {
  xs: '475px',    // Extra small devices (large phones)
  sm: '640px',    // Small devices (landscape phones)
  md: '768px',    // Medium devices (tablets)
  lg: '1024px',   // Large devices (laptops)
  xl: '1280px',   // Extra large devices (desktops)
  '2xl': '1536px', // 2X large devices (large desktops)
};

/**
 * Container max-widths for each breakpoint.
 */
export const containerMaxWidths: Record<keyof Breakpoints, string> = {
  xs: '100%',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1400px',
};

// =============================================================================
// ANIMATION
// =============================================================================

/**
 * Animation duration tokens.
 */
export const durations = {
  fastest: '50ms',
  faster: '100ms',
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  slower: '400ms',
  slowest: '500ms',
} as const;

/**
 * Animation easing functions.
 */
export const easings = {
  linear: 'linear',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

// =============================================================================
// Z-INDEX
// =============================================================================

/**
 * Z-index scale for layering.
 */
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;
