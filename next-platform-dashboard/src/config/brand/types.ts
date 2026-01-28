/**
 * DRAMAC CMS Brand System Types
 * 
 * Enterprise-grade type definitions for the branding configuration system.
 * All brand elements are strictly typed for maximum type safety and IDE support.
 * 
 * @module config/brand/types
 * @version 1.0.0
 */

// =============================================================================
// COLOR TYPES
// =============================================================================

/**
 * HSL color value in the format used by CSS variables.
 * Example: "238 76% 68%" (hue saturation% lightness%)
 */
export type HSLValue = `${number} ${number}% ${number}%`;

/**
 * Hex color value for programmatic use.
 * Example: "#6366f1"
 */
export type HexColor = `#${string}`;

/**
 * RGB color value for programmatic use.
 * Example: { r: 99, g: 102, b: 241 }
 */
export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Complete color representation with all formats.
 */
export interface ColorValue {
  /** HSL value for CSS variables (e.g., "238 76% 68%") */
  hsl: HSLValue;
  /** Hex value for programmatic use (e.g., "#6366f1") */
  hex: HexColor;
  /** RGB values for advanced color manipulation */
  rgb: RGBColor;
}

/**
 * Standard Tailwind-compatible color scale (50-950).
 * Provides 11 shades for each color for maximum design flexibility.
 */
export interface ColorScale {
  50: ColorValue;
  100: ColorValue;
  200: ColorValue;
  300: ColorValue;
  400: ColorValue;
  500: ColorValue;  // Primary shade (main)
  600: ColorValue;
  700: ColorValue;
  800: ColorValue;
  900: ColorValue;
  950: ColorValue;
}

/**
 * Semantic color with DEFAULT and foreground.
 * Used for UI elements like buttons, alerts, cards.
 */
export interface SemanticColor {
  /** Full color scale for the semantic color */
  scale: ColorScale;
  /** Default shade index (usually 500) */
  DEFAULT: keyof ColorScale;
  /** Foreground color for text on this color */
  foreground: ColorValue;
}

/**
 * Brand color palette with all semantic colors.
 */
export interface BrandColors {
  /** Primary brand color (main CTA, links) */
  primary: SemanticColor;
  /** Secondary brand color (accents) */
  secondary: SemanticColor;
  /** Accent color (highlights, special elements) */
  accent: SemanticColor;
}

/**
 * Status/feedback colors for UI states.
 */
export interface StatusColors {
  /** Success states (green) */
  success: SemanticColor;
  /** Warning states (amber/yellow) */
  warning: SemanticColor;
  /** Danger/error states (red) */
  danger: SemanticColor;
  /** Info/neutral states (blue) */
  info: SemanticColor;
}

/**
 * Neutral colors for backgrounds, text, borders.
 */
export interface NeutralColors {
  /** Page background color */
  background: ColorValue;
  /** Main text color */
  foreground: ColorValue;
  /** Card backgrounds */
  card: {
    DEFAULT: ColorValue;
    foreground: ColorValue;
  };
  /** Popover/dropdown backgrounds */
  popover: {
    DEFAULT: ColorValue;
    foreground: ColorValue;
  };
  /** Muted/subtle backgrounds */
  muted: {
    DEFAULT: ColorValue;
    foreground: ColorValue;
  };
  /** Border colors */
  border: ColorValue;
  /** Input field borders */
  input: ColorValue;
  /** Focus ring color */
  ring: ColorValue;
}

/**
 * Complete color configuration for a theme.
 */
export interface ThemeColors {
  brand: BrandColors;
  status: StatusColors;
  neutral: NeutralColors;
}

/**
 * Full color configuration with light and dark themes.
 */
export interface ColorConfig {
  light: ThemeColors;
  dark: ThemeColors;
}

// =============================================================================
// TYPOGRAPHY TYPES
// =============================================================================

/**
 * Font family configuration.
 */
export interface FontFamily {
  /** Sans-serif font stack */
  sans: string;
  /** Monospace font stack */
  mono: string;
  /** Optional display/heading font */
  display?: string;
}

/**
 * Font size with associated line height.
 */
export interface FontSize {
  /** Size value (e.g., "1rem") */
  size: string;
  /** Line height value */
  lineHeight: string;
  /** Letter spacing (optional) */
  letterSpacing?: string;
}

/**
 * Complete font size scale.
 */
export interface FontSizeScale {
  xs: FontSize;
  sm: FontSize;
  base: FontSize;
  lg: FontSize;
  xl: FontSize;
  '2xl': FontSize;
  '3xl': FontSize;
  '4xl': FontSize;
  '5xl': FontSize;
  '6xl': FontSize;
  '7xl': FontSize;
  '8xl': FontSize;
  '9xl': FontSize;
}

/**
 * Font weight scale.
 */
export interface FontWeights {
  thin: 100;
  extralight: 200;
  light: 300;
  normal: 400;
  medium: 500;
  semibold: 600;
  bold: 700;
  extrabold: 800;
  black: 900;
}

/**
 * Complete typography configuration.
 */
export interface TypographyConfig {
  families: FontFamily;
  sizes: FontSizeScale;
  weights: FontWeights;
}

// =============================================================================
// SPACING TYPES
// =============================================================================

/**
 * Spacing scale matching Tailwind's default scale.
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

// =============================================================================
// BORDER & SHADOW TYPES
// =============================================================================

/**
 * Border radius scale.
 */
export interface BorderRadiusScale {
  none: string;
  sm: string;
  DEFAULT: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  full: string;
}

/**
 * Shadow scale.
 */
export interface ShadowScale {
  sm: string;
  DEFAULT: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  inner: string;
  none: string;
}

// =============================================================================
// BREAKPOINT TYPES
// =============================================================================

/**
 * Responsive breakpoint configuration.
 */
export interface Breakpoints {
  /** Extra small devices (phones) */
  xs: string;
  /** Small devices (large phones) */
  sm: string;
  /** Medium devices (tablets) */
  md: string;
  /** Large devices (desktops) */
  lg: string;
  /** Extra large devices (large desktops) */
  xl: string;
  /** 2X large devices (wide screens) */
  '2xl': string;
}

// =============================================================================
// METADATA TYPES
// =============================================================================

/**
 * Social media links configuration.
 */
export interface SocialLinks {
  twitter?: string;
  github?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  discord?: string;
  tiktok?: string;
}

/**
 * SEO metadata configuration.
 */
export interface SEOConfig {
  /** Default page title */
  title: string;
  /** Title template for sub-pages (e.g., "%s | DRAMAC") */
  titleTemplate: string;
  /** Default meta description */
  description: string;
  /** Open Graph image URL */
  ogImage?: string;
  /** Twitter card type */
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  /** Twitter handle */
  twitterHandle?: string;
  /** Canonical URL base */
  canonicalBase?: string;
  /** Robots meta directives */
  robots?: string;
}

/**
 * Brand identity configuration.
 */
export interface BrandIdentity {
  /** Full business/product name */
  name: string;
  /** Short name for compact spaces */
  shortName?: string;
  /** Tagline/slogan */
  tagline: string;
  /** Detailed description */
  description: string;
  /** Primary domain */
  domain: string;
  /** Full site URL */
  url: string;
  /** Support email */
  supportEmail?: string;
  /** Sales email */
  salesEmail?: string;
  /** Copyright holder name */
  copyrightName?: string;
  /** Founded year */
  foundedYear?: number;
}

/**
 * Logo configuration.
 */
export interface LogoConfig {
  /** Main logo (light backgrounds) */
  main: string;
  /** Dark mode logo (dark backgrounds) */
  dark?: string;
  /** Small icon/favicon */
  icon: string;
  /** Apple touch icon */
  appleTouchIcon?: string;
  /** Logo alt text */
  alt: string;
  /** Logo dimensions */
  dimensions?: {
    width: number;
    height: number;
  };
}

// =============================================================================
// ANALYTICS TYPES
// =============================================================================

/**
 * Analytics and tracking configuration.
 */
export interface AnalyticsConfig {
  /** Google Analytics 4 measurement ID */
  googleAnalyticsId?: string;
  /** Vercel Analytics enabled */
  vercelAnalytics?: boolean;
  /** PostHog project key */
  posthogKey?: string;
  /** Mixpanel project token */
  mixpanelToken?: string;
  /** Hotjar site ID */
  hotjarId?: string;
  /** Custom analytics endpoint */
  customEndpoint?: string;
}

// =============================================================================
// COMPLETE SITE CONFIG
// =============================================================================

/**
 * Complete site configuration combining all brand elements.
 */
export interface SiteConfig {
  /** Brand identity information */
  identity: BrandIdentity;
  /** Logo assets */
  logo: LogoConfig;
  /** SEO configuration */
  seo: SEOConfig;
  /** Social media links */
  social: SocialLinks;
  /** Analytics configuration */
  analytics: AnalyticsConfig;
  /** Color configuration */
  colors: ColorConfig;
  /** Typography configuration */
  typography: TypographyConfig;
  /** Spacing scale */
  spacing: SpacingScale;
  /** Border radius scale */
  borderRadius: BorderRadiusScale;
  /** Shadow scale */
  shadows: ShadowScale;
  /** Responsive breakpoints */
  breakpoints: Breakpoints;
  /** Feature flags */
  features?: Record<string, boolean>;
  /** Custom metadata */
  custom?: Record<string, unknown>;
}

/**
 * Partial site config for overrides (white-labeling).
 */
export type PartialSiteConfig = Partial<{
  identity: Partial<BrandIdentity>;
  logo: Partial<LogoConfig>;
  seo: Partial<SEOConfig>;
  social: Partial<SocialLinks>;
  analytics: Partial<AnalyticsConfig>;
  colors: Partial<ColorConfig>;
  features: Record<string, boolean>;
  custom: Record<string, unknown>;
}>;
