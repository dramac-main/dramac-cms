/**
 * DRAMAC CMS Color Utilities
 * 
 * Provides color conversion and manipulation utilities for the brand system.
 * All functions are pure and side-effect free.
 * 
 * @module config/brand/colors/utils
 * @version 1.0.0
 */

import type { HSLValue, HexColor, RGBColor, ColorValue, ColorScale } from '../types';

// =============================================================================
// COLOR CONVERSION UTILITIES
// =============================================================================

/**
 * Converts a hex color to RGB values.
 * @param hex - Hex color string (e.g., "#6366f1")
 * @returns RGB color object
 */
export function hexToRgb(hex: HexColor): RGBColor {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Converts RGB values to hex color.
 * @param rgb - RGB color object
 * @returns Hex color string
 */
export function rgbToHex(rgb: RGBColor): HexColor {
  const toHex = (n: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}` as HexColor;
}

/**
 * Converts RGB values to HSL.
 * @param rgb - RGB color object
 * @returns HSL values as [h, s, l] tuple
 */
export function rgbToHsl(rgb: RGBColor): [number, number, number] {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

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

  return [
    Math.round(h * 360),
    Math.round(s * 100),
    Math.round(l * 100),
  ];
}

/**
 * Converts HSL values to RGB.
 * @param h - Hue (0-360)
 * @param s - Saturation (0-100)
 * @param l - Lightness (0-100)
 * @returns RGB color object
 */
export function hslToRgb(h: number, s: number, l: number): RGBColor {
  const sNorm = s / 100;
  const lNorm = l / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

/**
 * Formats HSL values as a CSS variable value string.
 * @param h - Hue (0-360)
 * @param s - Saturation (0-100)
 * @param l - Lightness (0-100)
 * @returns HSL string for CSS variables
 */
export function formatHsl(h: number, s: number, l: number): HSLValue {
  return `${h} ${s}% ${l}%` as HSLValue;
}

/**
 * Parses an HSL string back to individual values.
 * @param hsl - HSL string (e.g., "238 76% 68%")
 * @returns Tuple of [h, s, l]
 */
export function parseHsl(hsl: HSLValue): [number, number, number] {
  const parts = hsl.split(' ');
  return [
    parseInt(parts[0]),
    parseInt(parts[1]),
    parseInt(parts[2]),
  ];
}

/**
 * Creates a complete ColorValue from a hex color.
 * @param hex - Hex color string
 * @returns Complete color value with all formats
 */
export function createColorValue(hex: HexColor): ColorValue {
  const rgb = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(rgb);
  return {
    hex,
    rgb,
    hsl: formatHsl(h, s, l),
  };
}

// =============================================================================
// COLOR SCALE GENERATION
// =============================================================================

/**
 * Lightness values for each shade in the scale.
 * Optimized for accessible color contrast ratios.
 */
const LIGHTNESS_SCALE: Record<keyof ColorScale, number> = {
  50: 97,
  100: 94,
  200: 86,
  300: 77,
  400: 66,
  500: 55,
  600: 47,
  700: 39,
  800: 32,
  900: 24,
  950: 14,
};

/**
 * Saturation adjustments for each shade.
 * Lighter shades have reduced saturation for better aesthetics.
 */
const SATURATION_ADJUSTMENTS: Record<keyof ColorScale, number> = {
  50: 0.25,
  100: 0.35,
  200: 0.50,
  300: 0.70,
  400: 0.85,
  500: 1.00,
  600: 1.00,
  700: 0.95,
  800: 0.90,
  900: 0.85,
  950: 0.80,
};

/**
 * Generates a complete color scale from a base hex color.
 * The 500 shade will be closest to the input color.
 * 
 * @param baseHex - Base color in hex format
 * @param options - Optional adjustments
 * @returns Complete color scale (50-950)
 */
export function generateColorScale(
  baseHex: HexColor,
  options: {
    /** Hue shift for warmer/cooler variations */
    hueShift?: number;
    /** Overall saturation multiplier */
    saturationMultiplier?: number;
  } = {}
): ColorScale {
  const { hueShift = 0, saturationMultiplier = 1 } = options;
  
  const rgb = hexToRgb(baseHex);
  const [baseH, baseS] = rgbToHsl(rgb);

  const scale = {} as ColorScale;
  const shades: (keyof ColorScale)[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

  for (const shade of shades) {
    const h = (baseH + hueShift + 360) % 360;
    const s = Math.min(100, Math.max(0, baseS * SATURATION_ADJUSTMENTS[shade] * saturationMultiplier));
    const l = LIGHTNESS_SCALE[shade];

    const shadeRgb = hslToRgb(h, s, l);
    const shadeHex = rgbToHex(shadeRgb);

    scale[shade] = {
      hex: shadeHex,
      rgb: shadeRgb,
      hsl: formatHsl(h, Math.round(s), l),
    };
  }

  return scale;
}

// =============================================================================
// COLOR MANIPULATION
// =============================================================================

/**
 * Lightens a color by a percentage.
 * @param color - Color value to lighten
 * @param amount - Amount to lighten (0-100)
 * @returns New lightened color
 */
export function lighten(color: ColorValue, amount: number): ColorValue {
  const [h, s, l] = parseHsl(color.hsl);
  const newL = Math.min(100, l + amount);
  const rgb = hslToRgb(h, s, newL);
  return {
    hex: rgbToHex(rgb),
    rgb,
    hsl: formatHsl(h, s, newL),
  };
}

/**
 * Darkens a color by a percentage.
 * @param color - Color value to darken
 * @param amount - Amount to darken (0-100)
 * @returns New darkened color
 */
export function darken(color: ColorValue, amount: number): ColorValue {
  const [h, s, l] = parseHsl(color.hsl);
  const newL = Math.max(0, l - amount);
  const rgb = hslToRgb(h, s, newL);
  return {
    hex: rgbToHex(rgb),
    rgb,
    hsl: formatHsl(h, s, newL),
  };
}

/**
 * Adjusts the saturation of a color.
 * @param color - Color value to adjust
 * @param amount - Amount to adjust (-100 to 100)
 * @returns New adjusted color
 */
export function saturate(color: ColorValue, amount: number): ColorValue {
  const [h, s, l] = parseHsl(color.hsl);
  const newS = Math.min(100, Math.max(0, s + amount));
  const rgb = hslToRgb(h, newS, l);
  return {
    hex: rgbToHex(rgb),
    rgb,
    hsl: formatHsl(h, newS, l),
  };
}

/**
 * Creates an alpha/opacity variant of a color.
 * @param color - Color value
 * @param alpha - Alpha value (0-1)
 * @returns CSS rgba string
 */
export function withAlpha(color: ColorValue, alpha: number): string {
  const { r, g, b } = color.rgb;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Calculates the relative luminance of a color for contrast calculations.
 * @param color - Color value
 * @returns Relative luminance (0-1)
 */
export function getLuminance(color: ColorValue): number {
  const { r, g, b } = color.rgb;
  const [rs, gs, bs] = [r, g, b].map(c => {
    const sRGB = c / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculates the contrast ratio between two colors.
 * @param color1 - First color
 * @param color2 - Second color
 * @returns Contrast ratio (1 to 21)
 */
export function getContrastRatio(color1: ColorValue, color2: ColorValue): number {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Determines if text should be light or dark on a given background.
 * @param background - Background color
 * @returns "light" or "dark"
 */
export function getContrastTextColor(background: ColorValue): 'light' | 'dark' {
  const luminance = getLuminance(background);
  return luminance > 0.179 ? 'dark' : 'light';
}

/**
 * Checks if a color combination meets WCAG AA contrast requirements.
 * @param foreground - Foreground color
 * @param background - Background color
 * @param level - WCAG level ("AA" or "AAA")
 * @param size - Text size ("normal" or "large")
 * @returns Whether the combination passes
 */
export function meetsContrastRequirement(
  foreground: ColorValue,
  background: ColorValue,
  level: 'AA' | 'AAA' = 'AA',
  size: 'normal' | 'large' = 'normal'
): boolean {
  const ratio = getContrastRatio(foreground, background);
  
  if (level === 'AAA') {
    return size === 'large' ? ratio >= 4.5 : ratio >= 7;
  }
  return size === 'large' ? ratio >= 3 : ratio >= 4.5;
}
