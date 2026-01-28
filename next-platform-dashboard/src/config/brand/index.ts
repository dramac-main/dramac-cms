/**
 * DRAMAC CMS Brand System
 * 
 * Central export for all brand configuration.
 * Import from here for consistent branding across the application.
 * 
 * @example
 * ```tsx
 * import { brand, colors, getColor } from '@/config/brand';
 * 
 * // Use brand identity
 * <h1>{brand.identity.name}</h1>
 * 
 * // Access colors
 * const primaryHex = colors.primary[500].hex;
 * const primaryHsl = getColor('primary', 500).hsl;
 * ```
 * 
 * @module config/brand
 * @version 1.0.0
 */

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  // Color types
  HSLValue,
  HexColor,
  RGBColor,
  ColorValue,
  ColorScale,
  SemanticColor,
  BrandColors,
  StatusColors,
  NeutralColors,
  ThemeColors,
  ColorConfig,
  
  // Typography types
  FontFamily,
  FontSize,
  FontSizeScale,
  FontWeights,
  TypographyConfig,
  
  // Spacing & Layout types
  SpacingScale,
  BorderRadiusScale,
  ShadowScale,
  Breakpoints,
  
  // Metadata types
  BrandIdentity,
  LogoConfig,
  SEOConfig,
  SocialLinks,
  AnalyticsConfig,
  
  // Complete config types
  SiteConfig,
  PartialSiteConfig,
} from './types';

// =============================================================================
// COLOR EXPORTS
// =============================================================================

export {
  // Color scales
  colors,
  primaryScale,
  secondaryScale,
  accentScale,
  successScale,
  warningScale,
  dangerScale,
  infoScale,
  
  // Theme colors
  brandColors,
  statusColors,
  lightNeutrals,
  darkNeutrals,
  lightTheme,
  darkTheme,
  colorConfig,
  
  // Color utilities
  getColor,
  getHex,
  getHsl,
  
  // Type exports
  type ColorName,
} from './colors';

// Re-export color utilities
export {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  formatHsl,
  parseHsl,
  createColorValue,
  generateColorScale,
  lighten,
  darken,
  saturate,
  withAlpha,
  getLuminance,
  getContrastRatio,
  getContrastTextColor,
  meetsContrastRequirement,
} from './colors/utils';

// =============================================================================
// IDENTITY EXPORTS
// =============================================================================

export {
  identity,
  logo,
  seo,
  social,
  analytics,
  getFullTitle,
  getCopyrightYear,
  getCopyrightText,
  getActiveSocialLinks,
} from './identity';

// =============================================================================
// TOKEN EXPORTS
// =============================================================================

export {
  // Typography
  fontFamilies,
  fontSizes,
  fontWeights,
  typography,
  
  // Spacing
  spacing,
  
  // Borders & Shadows
  borderRadius,
  componentRadius,
  shadows,
  
  // Responsive
  breakpoints,
  containerMaxWidths,
  
  // Animation
  durations,
  easings,
  
  // Z-index
  zIndex,
} from './tokens';

// =============================================================================
// CSS GENERATOR EXPORTS
// =============================================================================

export {
  generateBrandColorVars,
  generateThemeVars,
  generateSpacingVars,
  generateRadiusVars,
  generateShadowVars,
  generateTypographyVars,
  generateLightThemeVars,
  generateDarkThemeVars,
  varsToCss,
  generateBrandCss,
  generateTailwindColorConfig,
} from './css-generator';

// =============================================================================
// UNIFIED BRAND OBJECT
// =============================================================================

import { identity, logo, seo, social, analytics } from './identity';
import { colorConfig } from './colors';
import { 
  typography, 
  spacing, 
  borderRadius, 
  shadows, 
  breakpoints 
} from './tokens';
import type { SiteConfig } from './types';

/**
 * Complete brand configuration object.
 * Use this for comprehensive brand access.
 * 
 * @example
 * ```tsx
 * import { brand } from '@/config/brand';
 * 
 * console.log(brand.identity.name);      // "DRAMAC"
 * console.log(brand.colors.light.brand.primary.scale[500].hex);
 * ```
 */
export const brand: SiteConfig = {
  identity,
  logo,
  seo,
  social,
  analytics,
  colors: colorConfig,
  typography,
  spacing,
  borderRadius,
  shadows,
  breakpoints,
};

// =============================================================================
// BACKWARD COMPATIBILITY EXPORTS
// =============================================================================

/**
 * @deprecated Use `identity.name` instead
 */
export const APP_NAME = identity.name;

/**
 * @deprecated Use `identity.tagline` or `identity.description` instead
 */
export const APP_DESCRIPTION = identity.tagline;

/**
 * @deprecated Use `identity.domain` instead
 */
export const APP_DOMAIN = identity.domain;

/**
 * @deprecated Use `identity.url` instead
 */
export const APP_URL = identity.url;
