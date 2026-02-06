/**
 * PHASE AWD-05: Design System & Brand Intelligence
 * Color Intelligence Module
 *
 * Handles color extraction, palette generation, and color theory operations.
 */

import type {
  ColorValue,
  ColorScale,
  ColorPalette,
  ColorHarmony,
  ExtractedColors,
  DesignMood,
} from "./types";

// =============================================================================
// COLOR CONVERSION UTILITIES
// =============================================================================

/**
 * Convert hex to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace("#", "");
  const bigint = parseInt(normalized, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

/**
 * Convert RGB to hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(
  r: number,
  g: number,
  b: number
): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(
  h: number,
  s: number,
  l: number
): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Create a complete ColorValue from hex
 */
export function createColorValue(hex: string): ColorValue {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  return { hex, rgb, hsl };
}

// =============================================================================
// COLOR SCALE GENERATION
// =============================================================================

/**
 * Generate a full color scale from a base color
 */
export function generateColorScale(baseHex: string): ColorScale {
  const { h, s } = rgbToHsl(...Object.values(hexToRgb(baseHex)) as [number, number, number]);

  // Lightness values for each step
  const lightnessMap: Record<keyof ColorScale, number> = {
    50: 97,
    100: 94,
    200: 86,
    300: 76,
    400: 62,
    500: 50,
    600: 42,
    700: 34,
    800: 26,
    900: 18,
    950: 10,
  };

  // Saturation adjustments for light/dark ends
  const saturationAdjust = (l: number): number => {
    if (l > 90) return Math.max(10, s - 30);
    if (l > 70) return Math.max(20, s - 10);
    if (l < 20) return Math.min(100, s + 10);
    return s;
  };

  const scale = {} as ColorScale;

  const steps: (keyof ColorScale)[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  for (const step of steps) {
    const lightness = lightnessMap[step];
    const adjustedS = saturationAdjust(lightness);
    const rgb = hslToRgb(h, adjustedS, lightness);
    scale[step] = rgbToHex(rgb.r, rgb.g, rgb.b);
  }

  return scale;
}

/**
 * Generate neutral (gray) scale
 */
export function generateNeutralScale(warmth: number = 0): ColorScale {
  // warmth: -10 (cool) to +10 (warm)
  const baseHue = warmth > 0 ? 30 : warmth < 0 ? 220 : 0;
  const baseSat = Math.abs(warmth) * 0.5;

  const lightnessMap: Record<keyof ColorScale, number> = {
    50: 98,
    100: 96,
    200: 90,
    300: 82,
    400: 64,
    500: 46,
    600: 38,
    700: 30,
    800: 22,
    900: 14,
    950: 6,
  };

  const scale = {} as ColorScale;

  const steps: (keyof ColorScale)[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  for (const step of steps) {
    const lightness = lightnessMap[step];
    const sat = baseSat * (1 - (lightness - 50) / 100);
    const rgb = hslToRgb(baseHue, Math.max(0, sat), lightness);
    scale[step] = rgbToHex(rgb.r, rgb.g, rgb.b);
  }

  return scale;
}

// =============================================================================
// COLOR HARMONY
// =============================================================================

/**
 * Generate harmonious colors based on color theory
 */
export function generateHarmony(
  baseHex: string,
  harmony: ColorHarmony
): string[] {
  const { h, s, l } = rgbToHsl(...Object.values(hexToRgb(baseHex)) as [number, number, number]);

  const normalizeHue = (hue: number): number => ((hue % 360) + 360) % 360;

  const harmonies: Record<ColorHarmony, number[]> = {
    complementary: [h, normalizeHue(h + 180)],
    analogous: [normalizeHue(h - 30), h, normalizeHue(h + 30)],
    triadic: [h, normalizeHue(h + 120), normalizeHue(h + 240)],
    "split-complementary": [h, normalizeHue(h + 150), normalizeHue(h + 210)],
    monochromatic: [h, h, h], // Same hue, different saturation/lightness
  };

  const hues = harmonies[harmony];

  return hues.map((hue, index) => {
    let adjustedS = s;
    let adjustedL = l;

    // For monochromatic, vary saturation and lightness
    if (harmony === "monochromatic") {
      adjustedS = Math.max(20, s - index * 15);
      adjustedL = Math.min(80, l + (index - 1) * 15);
    }

    const rgb = hslToRgb(hue, adjustedS, adjustedL);
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  });
}

/**
 * Get best color harmony for an industry/mood
 */
export function suggestHarmony(mood: DesignMood): ColorHarmony {
  const moodHarmonies: Record<DesignMood, ColorHarmony> = {
    professional: "analogous",
    playful: "triadic",
    elegant: "monochromatic",
    bold: "complementary",
    minimal: "monochromatic",
    tech: "split-complementary",
    organic: "analogous",
    luxurious: "monochromatic",
    friendly: "analogous",
    corporate: "analogous",
  };

  return moodHarmonies[mood] || "analogous";
}

// =============================================================================
// SEMANTIC COLORS
// =============================================================================

/**
 * Generate semantic color scales
 */
export function generateSemanticColors(): Pick<
  ColorPalette,
  "success" | "warning" | "error" | "info"
> {
  return {
    success: generateColorScale("#22c55e"), // Green
    warning: generateColorScale("#f59e0b"), // Amber
    error: generateColorScale("#ef4444"), // Red
    info: generateColorScale("#3b82f6"), // Blue
  };
}

// =============================================================================
// PALETTE GENERATION
// =============================================================================

/**
 * Generate a complete color palette from brand colors
 */
export function generatePalette(
  primaryHex: string,
  options?: {
    secondaryHex?: string;
    accentHex?: string;
    mood?: DesignMood;
    neutralWarmth?: number;
  }
): ColorPalette {
  const mood = options?.mood || "professional";
  const harmony = suggestHarmony(mood);
  const harmonyColors = generateHarmony(primaryHex, harmony);

  // Determine secondary and accent colors
  const secondaryHex =
    options?.secondaryHex ||
    harmonyColors[1] ||
    harmonyColors[0];
  const accentHex =
    options?.accentHex ||
    harmonyColors[2] ||
    harmonyColors[1] ||
    generateHarmony(primaryHex, "complementary")[1];

  return {
    primary: generateColorScale(primaryHex),
    secondary: generateColorScale(secondaryHex),
    accent: generateColorScale(accentHex),
    neutral: generateNeutralScale(options?.neutralWarmth),
    ...generateSemanticColors(),
  };
}

// =============================================================================
// COLOR ANALYSIS
// =============================================================================

/**
 * Calculate color contrast ratio (WCAG)
 */
export function calculateContrast(color1: string, color2: string): number {
  const getLuminance = (hex: string): number => {
    const { r, g, b } = hexToRgb(hex);
    const [rs, gs, bs] = [r, g, b].map((c) => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if colors meet WCAG AA standards
 */
export function meetsWcagAA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  const ratio = calculateContrast(foreground, background);
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Find accessible text color for a background
 */
export function getAccessibleTextColor(background: string): string {
  const whiteContrast = calculateContrast("#ffffff", background);
  const blackContrast = calculateContrast("#000000", background);
  return whiteContrast > blackContrast ? "#ffffff" : "#000000";
}

/**
 * Get best color from a scale for text on a background
 */
export function getBestTextColor(
  scale: ColorScale,
  background: string,
  preference: "light" | "dark" = "dark"
): string {
  const darkSteps: (keyof ColorScale)[] = [950, 900, 800, 700, 600];
  const lightSteps: (keyof ColorScale)[] = [50, 100, 200, 300, 400];
  const steps = preference === "dark" ? darkSteps : lightSteps;

  for (const step of steps) {
    if (meetsWcagAA(scale[step], background)) {
      return scale[step];
    }
  }

  // Fallback to pure black/white
  return preference === "dark" ? "#000000" : "#ffffff";
}

// =============================================================================
// INDUSTRY-SPECIFIC PALETTES
// =============================================================================

/**
 * Suggested colors for different industries
 */
export const INDUSTRY_COLOR_SUGGESTIONS: Record<string, { primary: string; mood: DesignMood }> = {
  restaurant: { primary: "#dc2626", mood: "friendly" },
  "law-firm": { primary: "#1e3a5f", mood: "professional" },
  healthcare: { primary: "#0891b2", mood: "professional" },
  saas: { primary: "#7c3aed", mood: "tech" },
  ecommerce: { primary: "#2563eb", mood: "bold" },
  portfolio: { primary: "#000000", mood: "minimal" },
  "real-estate": { primary: "#065f46", mood: "elegant" },
  construction: { primary: "#d97706", mood: "bold" },
  education: { primary: "#0284c7", mood: "friendly" },
  nonprofit: { primary: "#059669", mood: "organic" },
};

/**
 * Get suggested palette for an industry
 */
export function getSuggestedPaletteForIndustry(
  industry: string
): ColorPalette {
  const suggestion = INDUSTRY_COLOR_SUGGESTIONS[industry] || {
    primary: "#3b82f6",
    mood: "professional",
  };

  return generatePalette(suggestion.primary, { mood: suggestion.mood });
}
