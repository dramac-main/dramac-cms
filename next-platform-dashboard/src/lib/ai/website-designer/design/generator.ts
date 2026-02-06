/**
 * PHASE AWD-05: Design System & Brand Intelligence
 * Design System Generator
 *
 * Main entry point for generating complete design systems from brand input.
 */

import type {
  DesignSystem,
  DesignSystemInput,
  DesignTokens,
  DesignMood,
  DesignPreferences,
  ColorPalette,
  ColorScale,
} from "./types";
import {
  generatePalette,
  getSuggestedPaletteForIndustry,
  createColorValue,
} from "./color-intelligence";
import {
  getFontPairingForMood,
  getTypographyForIndustry,
  generateTypeScale,
  generateGoogleFontsUrl,
  TYPE_SCALE_RATIOS,
} from "./typography-intelligence";
import {
  DEFAULT_SPACING_SCALE,
  generateSpacingScale,
  getBorderRadiusScale,
  getShadowScale,
  getDesignPreferencesForMood,
  getTransitionPreset,
} from "./spacing-system";

// =============================================================================
// DESIGN SYSTEM GENERATOR CLASS
// =============================================================================

export class DesignSystemGenerator {
  private input: DesignSystemInput;
  private mood: DesignMood;

  constructor(input: DesignSystemInput = {}) {
    this.input = input;
    this.mood = input.mood || this.inferMood();
  }

  /**
   * Infer design mood from industry
   */
  private inferMood(): DesignMood {
    const industryMoods: Record<string, DesignMood> = {
      restaurant: "friendly",
      "law-firm": "professional",
      healthcare: "professional",
      saas: "tech",
      ecommerce: "bold",
      portfolio: "minimal",
      "real-estate": "elegant",
      construction: "bold",
      education: "friendly",
      nonprofit: "organic",
    };

    return industryMoods[this.input.industry || ""] || "professional";
  }

  /**
   * Generate complete design system
   */
  generate(): DesignSystem {
    // Generate color palette
    const colors = this.generateColors();

    // Generate typography
    const typography = this.generateTypography();

    // Generate spacing
    const spacing = {
      scale: generateSpacingScale(4),
      baseUnit: 4,
    };

    // Get design preferences
    const preferences = getDesignPreferencesForMood(this.mood);

    // Generate borders and shadows
    const borders = {
      radius: getBorderRadiusScale(preferences.cornerStyle),
      widths: {
        thin: "1px",
        medium: "2px",
        thick: "4px",
      },
    };

    const shadows = getShadowScale(preferences.shadowIntensity);

    // Generate CSS variables
    const cssVariables = this.generateCSSVariables(colors, typography, preferences);

    // Generate Tailwind extend config
    const tailwindExtend = this.generateTailwindExtend(colors, typography, borders);

    return {
      colors,
      typography,
      spacing,
      borders,
      shadows,
      preferences,
      cssVariables,
      tailwindExtend,
    };
  }

  /**
   * Generate color palette
   */
  private generateColors(): ColorPalette {
    // If brand colors provided, use them
    if (this.input.brandColors?.primary) {
      return generatePalette(this.input.brandColors.primary, {
        secondaryHex: this.input.brandColors.secondary,
        accentHex: this.input.brandColors.accent,
        mood: this.mood,
      });
    }

    // If industry provided, get industry-specific palette
    if (this.input.industry) {
      return getSuggestedPaletteForIndustry(this.input.industry);
    }

    // Default palette
    return generatePalette("#3b82f6", { mood: this.mood });
  }

  /**
   * Generate typography configuration
   */
  private generateTypography(): DesignSystem["typography"] {
    // If industry provided, get industry-specific typography
    if (this.input.industry) {
      const industryTypo = getTypographyForIndustry(this.input.industry);
      return {
        fonts: industryTypo.pairing,
        scale: industryTypo.scale,
        baseSize: "1rem",
        scaleRatio: industryTypo.scaleRatio,
      };
    }

    // Otherwise use mood-based fonts
    const pairing = getFontPairingForMood(this.mood);
    const scaleRatio = this.getScaleRatioForMood();
    const scale = generateTypeScale(16, scaleRatio);

    return {
      fonts: pairing,
      scale,
      baseSize: "1rem",
      scaleRatio,
    };
  }

  /**
   * Get type scale ratio for mood
   */
  private getScaleRatioForMood(): DesignSystem["typography"]["scaleRatio"] {
    const moodRatios: Record<DesignMood, DesignSystem["typography"]["scaleRatio"]> = {
      professional: "major-second",
      playful: "perfect-fourth",
      elegant: "minor-third",
      bold: "perfect-fourth",
      minimal: "major-second",
      tech: "minor-third",
      organic: "minor-third",
      luxurious: "minor-third",
      friendly: "major-second",
      corporate: "major-second",
    };

    return moodRatios[this.mood] || "minor-third";
  }

  /**
   * Generate CSS custom properties
   */
  private generateCSSVariables(
    colors: ColorPalette,
    typography: DesignSystem["typography"],
    preferences: DesignPreferences
  ): Record<string, string> {
    const vars: Record<string, string> = {};

    // Color variables
    const colorKeys: (keyof ColorPalette)[] = [
      "primary",
      "secondary",
      "accent",
      "neutral",
      "success",
      "warning",
      "error",
      "info",
    ];

    for (const colorName of colorKeys) {
      const scale = colors[colorName] as ColorScale | undefined;
      if (scale && typeof scale === "object" && "500" in scale) {
        const steps = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"] as const;
        for (const step of steps) {
          vars[`--color-${colorName}-${step}`] = scale[step];
        }
      }
    }

    // Font variables
    vars["--font-heading"] = `'${typography.fonts.heading.family}', ${typography.fonts.heading.fallback}`;
    vars["--font-body"] = `'${typography.fonts.body.family}', ${typography.fonts.body.fallback}`;
    if (typography.fonts.code) {
      vars["--font-code"] = `'${typography.fonts.code.family}', ${typography.fonts.code.fallback}`;
    }

    // Type scale variables
    for (const [key, value] of Object.entries(typography.scale)) {
      vars[`--text-${key}`] = value.size;
      vars[`--leading-${key}`] = value.lineHeight;
    }

    // Transitions
    const transitions = getTransitionPreset(preferences.animationLevel);
    vars["--transition-fast"] = transitions.fast;
    vars["--transition-normal"] = transitions.normal;
    vars["--transition-slow"] = transitions.slow;
    vars["--easing"] = transitions.easing;

    return vars;
  }

  /**
   * Generate Tailwind config extension
   */
  private generateTailwindExtend(
    colors: ColorPalette,
    typography: DesignSystem["typography"],
    borders: DesignSystem["borders"]
  ): Record<string, unknown> {
    return {
      colors: {
        primary: this.colorScaleToTailwind(colors.primary),
        secondary: this.colorScaleToTailwind(colors.secondary),
        accent: this.colorScaleToTailwind(colors.accent),
      },
      fontFamily: {
        heading: [typography.fonts.heading.family, ...typography.fonts.heading.fallback.split(", ")],
        body: [typography.fonts.body.family, ...typography.fonts.body.fallback.split(", ")],
        ...(typography.fonts.code && {
          code: [typography.fonts.code.family, ...typography.fonts.code.fallback.split(", ")],
        }),
      },
      borderRadius: borders.radius,
    };
  }

  /**
   * Convert color scale to Tailwind format
   */
  private colorScaleToTailwind(scale: ColorScale): Record<string, string> {
    return {
      50: scale[50],
      100: scale[100],
      200: scale[200],
      300: scale[300],
      400: scale[400],
      500: scale[500],
      600: scale[600],
      700: scale[700],
      800: scale[800],
      900: scale[900],
      950: scale[950],
      DEFAULT: scale[500],
    };
  }

  /**
   * Get Google Fonts import URL
   */
  getFontsUrl(): string {
    const typography = this.generateTypography();
    return generateGoogleFontsUrl(typography.fonts);
  }

  /**
   * Export as design tokens
   */
  toDesignTokens(): DesignTokens {
    const system = this.generate();

    // Build colors object
    const colors: Record<string, string | Record<string, string>> = {};
    const colorKeys: (keyof ColorPalette)[] = [
      "primary",
      "secondary",
      "accent",
      "neutral",
      "success",
      "warning",
      "error",
      "info",
    ];

    for (const colorName of colorKeys) {
      const scale = system.colors[colorName] as ColorScale | undefined;
      if (scale && typeof scale === "object" && "500" in scale) {
        colors[colorName] = { ...scale };
      }
    }

    // Build font sizes
    const fontSize: DesignTokens["fontSize"] = {};
    for (const [key, value] of Object.entries(system.typography.scale)) {
      fontSize[key] = [value.size, { lineHeight: value.lineHeight }];
    }

    return {
      colors,
      fontFamily: {
        heading: `'${system.typography.fonts.heading.family}', ${system.typography.fonts.heading.fallback}`,
        body: `'${system.typography.fonts.body.family}', ${system.typography.fonts.body.fallback}`,
      },
      fontSize,
      spacing: Object.fromEntries(
        Object.entries(system.spacing.scale).map(([k, v]) => [String(k), v])
      ),
      borderRadius: Object.fromEntries(
        Object.entries(system.borders.radius).map(([k, v]) => [String(k), v])
      ),
      boxShadow: Object.fromEntries(
        Object.entries(system.shadows).map(([k, v]) => [String(k), v])
      ),
    };
  }

  /**
   * Export as CSS string
   */
  toCSS(): string {
    const vars = this.generate().cssVariables;
    const lines = Object.entries(vars).map(([key, value]) => `  ${key}: ${value};`);
    return `:root {\n${lines.join("\n")}\n}`;
  }
}

// =============================================================================
// QUICK GENERATION FUNCTIONS
// =============================================================================

/**
 * Quick generate design system from industry
 */
export function generateDesignSystemForIndustry(industry: string): DesignSystem {
  return new DesignSystemGenerator({ industry }).generate();
}

/**
 * Quick generate design system from brand color
 */
export function generateDesignSystemFromColor(
  primaryColor: string,
  mood?: DesignMood
): DesignSystem {
  return new DesignSystemGenerator({
    brandColors: { primary: primaryColor },
    mood,
  }).generate();
}

/**
 * Quick generate design tokens
 */
export function generateDesignTokens(input: DesignSystemInput): DesignTokens {
  return new DesignSystemGenerator(input).toDesignTokens();
}
