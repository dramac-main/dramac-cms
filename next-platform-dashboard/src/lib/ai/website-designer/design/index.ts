/**
 * PHASE AWD-05: Design System & Brand Intelligence
 * Public API Exports
 */

// Types
export type {
  ColorValue,
  ColorScale,
  ColorPalette,
  ColorHarmony,
  ExtractedColors,
  FontCategory,
  FontDefinition,
  FontPairing,
  TypeScale,
  TypeScaleStep,
  TypeScaleRatio,
  SpacingScale,
  BorderRadiusScale,
  ShadowScale,
  DesignMood,
  DesignPreferences,
  DesignSystem,
  DesignSystemInput,
  DesignTokens,
  FontWeight,
} from "./types";

// Color Intelligence
export {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  createColorValue,
  generateColorScale,
  generateNeutralScale,
  generateHarmony,
  suggestHarmony,
  generateSemanticColors,
  generatePalette,
  calculateContrast,
  meetsWcagAA,
  getAccessibleTextColor,
  getBestTextColor,
  INDUSTRY_COLOR_SUGGESTIONS,
  getSuggestedPaletteForIndustry,
} from "./color-intelligence";

// Typography Intelligence
export {
  TYPE_SCALE_RATIOS,
  getRatioValue,
  RECOMMENDED_RATIOS,
  FONT_LIBRARY,
  FONT_PAIRINGS,
  getFontPairingForMood,
  getFontPairingByCategory,
  generateTypeScale,
  getLineHeight,
  getLetterSpacing,
  INDUSTRY_TYPOGRAPHY,
  getTypographyForIndustry,
  generateGoogleFontsUrl,
  generateFontFaceCSS,
} from "./typography-intelligence";

// Spacing System
export {
  DEFAULT_SPACING_SCALE,
  generateSpacingScale,
  BORDER_RADIUS_PRESETS,
  getBorderRadiusScale,
  MOOD_CORNER_STYLES,
  SHADOW_PRESETS,
  getShadowScale,
  MOOD_SHADOW_INTENSITY,
  generateColoredShadow,
  getDesignPreferencesForMood,
  TRANSITION_PRESETS,
  getTransitionPreset,
} from "./spacing-system";
