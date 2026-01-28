/**
 * DRAMAC CMS Brand Colors Configuration
 * 
 * Single source of truth for all brand colors.
 * Edit colors here and they will propagate throughout the application.
 * 
 * Color values are defined in hex for readability and automatically
 * converted to HSL for CSS variables and RGB for programmatic use.
 * 
 * @module config/brand/colors
 * @version 1.0.0
 */

import type { 
  ColorScale, 
  SemanticColor, 
  BrandColors, 
  StatusColors, 
  NeutralColors,
  ThemeColors,
  ColorConfig,
  ColorValue,
  HexColor,
} from '../types';
import { 
  generateColorScale, 
  createColorValue,
} from './utils';

// =============================================================================
// BRAND COLOR DEFINITIONS
// =============================================================================

/**
 * Primary brand color - Violet/Purple spectrum
 * Used for: Primary buttons, links, active states, focus rings
 */
const PRIMARY_HEX: HexColor = '#8b5cf6';

/**
 * Secondary brand color - Teal/Cyan spectrum
 * Used for: Charts, accents, success states
 */
const SECONDARY_HEX: HexColor = '#14b8a6';

/**
 * Accent brand color - Pink
 * Used for: Special highlights, promotional elements, badges
 */
const ACCENT_HEX: HexColor = '#ec4899';

// =============================================================================
// STATUS COLOR DEFINITIONS
// =============================================================================

/**
 * Success color - Emerald Green
 * Used for: Success messages, completed states, positive actions
 */
const SUCCESS_HEX: HexColor = '#10b981';

/**
 * Warning color - Amber
 * Used for: Warning messages, pending states, caution indicators
 */
const WARNING_HEX: HexColor = '#f59e0b';

/**
 * Danger color - Red
 * Used for: Error messages, destructive actions, critical alerts
 */
const DANGER_HEX: HexColor = '#ef4444';

/**
 * Info color - Sky Blue
 * Used for: Informational messages, neutral notifications, help text
 */
const INFO_HEX: HexColor = '#0ea5e9';

// =============================================================================
// GENERATED COLOR SCALES
// =============================================================================

/** Primary color scale (50-950) */
export const primaryScale: ColorScale = generateColorScale(PRIMARY_HEX);

/** Secondary color scale (50-950) */
export const secondaryScale: ColorScale = generateColorScale(SECONDARY_HEX);

/** Accent color scale (50-950) */
export const accentScale: ColorScale = generateColorScale(ACCENT_HEX);

/** Success color scale (50-950) */
export const successScale: ColorScale = generateColorScale(SUCCESS_HEX);

/** Warning color scale (50-950) */
export const warningScale: ColorScale = generateColorScale(WARNING_HEX);

/** Danger color scale (50-950) */
export const dangerScale: ColorScale = generateColorScale(DANGER_HEX);

/** Info color scale (50-950) */
export const infoScale: ColorScale = generateColorScale(INFO_HEX);

// =============================================================================
// SEMANTIC COLOR CONFIGURATIONS
// =============================================================================

/** White color value */
const white: ColorValue = createColorValue('#ffffff');

/** Black color value */
const black: ColorValue = createColorValue('#000000');

/**
 * Creates a semantic color with scale and foreground.
 */
function createSemanticColor(
  scale: ColorScale, 
  defaultShade: keyof ColorScale = 500,
  foreground: ColorValue = white
): SemanticColor {
  return {
    scale,
    DEFAULT: defaultShade,
    foreground,
  };
}

/**
 * Brand colors configuration.
 */
export const brandColors: BrandColors = {
  primary: createSemanticColor(primaryScale),
  secondary: createSemanticColor(secondaryScale),
  accent: createSemanticColor(accentScale),
};

/**
 * Status colors configuration.
 */
export const statusColors: StatusColors = {
  success: createSemanticColor(successScale),
  warning: createSemanticColor(warningScale, 500, black),
  danger: createSemanticColor(dangerScale),
  info: createSemanticColor(infoScale),
};

// =============================================================================
// NEUTRAL COLORS - LIGHT THEME
// =============================================================================

/**
 * Light theme neutral colors.
 */
export const lightNeutrals: NeutralColors = {
  background: createColorValue('#f8fafc'),
  foreground: createColorValue('#0f172a'),
  card: {
    DEFAULT: createColorValue('#ffffff'),
    foreground: createColorValue('#0f172a'),
  },
  popover: {
    DEFAULT: createColorValue('#ffffff'),
    foreground: createColorValue('#0f172a'),
  },
  muted: {
    DEFAULT: createColorValue('#f1f5f9'),
    foreground: createColorValue('#475569'),
  },
  border: createColorValue('#e2e8f0'),
  input: createColorValue('#e2e8f0'),
  ring: primaryScale[500],
};

// =============================================================================
// NEUTRAL COLORS - DARK THEME
// =============================================================================

/**
 * Dark theme neutral colors.
 * Deep purple-tinted backgrounds for dark mode harmony.
 */
export const darkNeutrals: NeutralColors = {
  background: createColorValue('#0c0a14'),
  foreground: createColorValue('#ffffff'),
  card: {
    DEFAULT: createColorValue('#13101c'),
    foreground: createColorValue('#ffffff'),
  },
  popover: {
    DEFAULT: createColorValue('#1a1625'),
    foreground: createColorValue('#ffffff'),
  },
  muted: {
    DEFAULT: createColorValue('#231e30'),
    foreground: createColorValue('#a1a1aa'),
  },
  border: createColorValue('#2a2438'),
  input: createColorValue('#2a2438'),
  ring: primaryScale[400],
};

// =============================================================================
// THEME CONFIGURATIONS
// =============================================================================

/**
 * Light theme colors.
 */
export const lightTheme: ThemeColors = {
  brand: brandColors,
  status: statusColors,
  neutral: lightNeutrals,
};

/**
 * Dark theme colors.
 */
export const darkTheme: ThemeColors = {
  brand: brandColors,
  status: statusColors,
  neutral: darkNeutrals,
};

/**
 * Complete color configuration with both themes.
 */
export const colorConfig: ColorConfig = {
  light: lightTheme,
  dark: darkTheme,
};

// =============================================================================
// CONVENIENCE EXPORTS
// =============================================================================

/**
 * Quick access to main brand colors.
 */
export const colors = {
  primary: primaryScale,
  secondary: secondaryScale,
  accent: accentScale,
  success: successScale,
  warning: warningScale,
  danger: dangerScale,
  info: infoScale,
} as const;

/**
 * Get a specific color shade.
 * @example getColor('primary', 500) // Returns ColorValue for primary-500
 */
export function getColor(
  colorName: keyof typeof colors,
  shade: keyof ColorScale = 500
): ColorValue {
  return colors[colorName][shade];
}

/**
 * Get a color's hex value.
 * @example getHex('primary', 500) // Returns "#6366f1"
 */
export function getHex(
  colorName: keyof typeof colors,
  shade: keyof ColorScale = 500
): HexColor {
  return colors[colorName][shade].hex;
}

/**
 * Get a color's HSL value for CSS variables.
 * @example getHsl('primary', 500) // Returns "238 76% 55%"
 */
export function getHsl(
  colorName: keyof typeof colors,
  shade: keyof ColorScale = 500
): string {
  return colors[colorName][shade].hsl;
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type ColorName = keyof typeof colors;
export type { ColorScale, SemanticColor, BrandColors, StatusColors, NeutralColors };
