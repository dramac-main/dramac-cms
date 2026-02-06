/**
 * PHASE AWD-05: Design System & Brand Intelligence
 * Type Definitions
 *
 * Types for design system generation, color intelligence,
 * typography pairing, and spacing systems.
 */

// =============================================================================
// COLOR SYSTEM TYPES
// =============================================================================

/**
 * Represents a color in multiple formats
 */
export interface ColorValue {
  hex: string;
  hsl: { h: number; s: number; l: number };
  rgb: { r: number; g: number; b: number };
}

/**
 * Color shade scale (50-950)
 */
export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

/**
 * Complete color palette for a brand
 */
export interface ColorPalette {
  primary: ColorScale;
  secondary: ColorScale;
  accent: ColorScale;
  neutral: ColorScale;

  // Semantic colors
  success: ColorScale;
  warning: ColorScale;
  error: ColorScale;
  info: ColorScale;

  // Brand colors extracted from logo
  brand?: {
    colors: ColorValue[];
    dominant: ColorValue;
    accent: ColorValue;
  };
}

/**
 * Color harmony types
 */
export type ColorHarmony =
  | "complementary"
  | "analogous"
  | "triadic"
  | "split-complementary"
  | "monochromatic";

/**
 * Color extraction result from an image
 */
export interface ExtractedColors {
  dominant: ColorValue;
  palette: ColorValue[];
  vibrant: ColorValue | null;
  muted: ColorValue | null;
  darkVibrant: ColorValue | null;
  lightVibrant: ColorValue | null;
}

// =============================================================================
// TYPOGRAPHY TYPES
// =============================================================================

/**
 * Font category classification
 */
export type FontCategory =
  | "serif"
  | "sans-serif"
  | "display"
  | "monospace"
  | "handwriting";

/**
 * Font weight options
 */
export type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

/**
 * Typography font definition
 */
export interface FontDefinition {
  family: string;
  category: FontCategory;
  weights: FontWeight[];
  fallback: string;
  googleFontsUrl?: string;
  variable?: string; // CSS variable font
}

/**
 * Font pairing configuration
 */
export interface FontPairing {
  heading: FontDefinition;
  body: FontDefinition;
  accent?: FontDefinition;
  code?: FontDefinition;
}

/**
 * Type scale step
 */
export interface TypeScaleStep {
  size: string;
  lineHeight: string;
  letterSpacing: string;
  fontWeight: FontWeight;
}

/**
 * Complete type scale
 */
export interface TypeScale {
  xs: TypeScaleStep;
  sm: TypeScaleStep;
  base: TypeScaleStep;
  lg: TypeScaleStep;
  xl: TypeScaleStep;
  "2xl": TypeScaleStep;
  "3xl": TypeScaleStep;
  "4xl": TypeScaleStep;
  "5xl": TypeScaleStep;
  "6xl": TypeScaleStep;
  "7xl": TypeScaleStep;
  "8xl": TypeScaleStep;
  "9xl": TypeScaleStep;
}

/**
 * Type scale ratio options
 */
export type TypeScaleRatio =
  | "minor-second" // 1.067
  | "major-second" // 1.125
  | "minor-third" // 1.2
  | "major-third" // 1.25
  | "perfect-fourth" // 1.333
  | "augmented-fourth" // 1.414
  | "perfect-fifth" // 1.5
  | "golden-ratio"; // 1.618

// =============================================================================
// SPACING TYPES
// =============================================================================

/**
 * Spacing scale configuration
 */
export interface SpacingScale {
  0: string;
  px: string;
  0.5: string;
  1: string;
  1.5: string;
  2: string;
  2.5: string;
  3: string;
  3.5: string;
  4: string;
  5: string;
  6: string;
  7: string;
  8: string;
  9: string;
  10: string;
  11: string;
  12: string;
  14: string;
  16: string;
  20: string;
  24: string;
  28: string;
  32: string;
  36: string;
  40: string;
  44: string;
  48: string;
  52: string;
  56: string;
  60: string;
  64: string;
  72: string;
  80: string;
  96: string;
}

/**
 * Border radius scale
 */
export interface BorderRadiusScale {
  none: string;
  sm: string;
  DEFAULT: string;
  md: string;
  lg: string;
  xl: string;
  "2xl": string;
  "3xl": string;
  full: string;
}

/**
 * Shadow scale
 */
export interface ShadowScale {
  sm: string;
  DEFAULT: string;
  md: string;
  lg: string;
  xl: string;
  "2xl": string;
  inner: string;
  none: string;
}

// =============================================================================
// DESIGN SYSTEM TYPES
// =============================================================================

/**
 * Design mood/style
 */
export type DesignMood =
  | "professional"
  | "playful"
  | "elegant"
  | "bold"
  | "minimal"
  | "tech"
  | "organic"
  | "luxurious"
  | "friendly"
  | "corporate";

/**
 * Design style preferences
 */
export interface DesignPreferences {
  mood: DesignMood;
  cornerStyle: "sharp" | "soft" | "rounded" | "pill";
  shadowIntensity: "none" | "subtle" | "medium" | "strong";
  colorContrast: "low" | "medium" | "high";
  animationLevel: "none" | "subtle" | "moderate" | "dynamic";
}

/**
 * Complete design system
 */
export interface DesignSystem {
  colors: ColorPalette;
  typography: {
    fonts: FontPairing;
    scale: TypeScale;
    baseSize: string;
    scaleRatio: TypeScaleRatio;
  };
  spacing: {
    scale: SpacingScale;
    baseUnit: number; // in pixels
  };
  borders: {
    radius: BorderRadiusScale;
    widths: { thin: string; medium: string; thick: string };
  };
  shadows: ShadowScale;
  preferences: DesignPreferences;

  // CSS variables output
  cssVariables: Record<string, string>;

  // Tailwind config extension
  tailwindExtend: Record<string, unknown>;
}

/**
 * Design system generation input
 */
export interface DesignSystemInput {
  brandColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  logoUrl?: string;
  industry?: string;
  mood?: DesignMood;
  fontPreferences?: {
    headingStyle?: FontCategory;
    bodyStyle?: FontCategory;
  };
  existingBrandGuidelines?: {
    fonts?: string[];
    colors?: string[];
  };
}

/**
 * Design token output format
 */
export interface DesignTokens {
  colors: Record<string, string | Record<string, string>>;
  fontFamily: Record<string, string>;
  fontSize: Record<string, [string, { lineHeight: string; letterSpacing?: string }]>;
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  boxShadow: Record<string, string>;
}
