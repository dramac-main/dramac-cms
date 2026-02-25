/**
 * Brand Color Resolution System
 * 
 * Derives a complete, coherent color palette from a small set of brand colors.
 * This is the single source of truth for how brand identity flows into components.
 * 
 * ARCHITECTURE:
 *   site.settings.primary_color  ──┐
 *   site.settings.secondary_color ─┤
 *   site.settings.accent_color   ──┼──► resolveBrandColors() ──► BrandColorPalette
 *   site.settings.theme.* ────────┤
 *   component.props.primaryColor ──┘    (complete derived palette)
 * 
 * The renderer injects brand-derived defaults into every component at render time.
 * Components keep their individual color fields for studio overrides, but any
 * UNSET color field automatically inherits from the brand palette.
 * 
 * This eliminates the problem of 146 color fields with 83% having no defaults:
 * now they all fall back to brand-consistent values.
 * 
 * @phase BRAND-COLOR-SYSTEM - Centralized brand color inheritance
 */

// ============================================================================
// Types
// ============================================================================

export interface BrandColorPalette {
  /** Core brand colors */
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;

  /** Derived semantic colors */
  primaryForeground: string;     // Text on primary bg (usually white)
  secondaryForeground: string;   // Text on secondary bg
  accentForeground: string;      // Text on accent bg
  muted: string;                 // Muted/disabled backgrounds
  mutedForeground: string;       // Text on muted bg
  border: string;                // Default border color
  divider: string;               // Divider/separator color
  card: string;                  // Card backgrounds
  cardBorder: string;            // Card border color
  input: string;                 // Input background
  inputBorder: string;           // Input border color
  inputFocus: string;            // Input focus ring color (usually primary)

  /** State colors */
  success: string;
  error: string;
  warning: string;

  /** Interactive element colors */
  buttonBg: string;              // Primary button background (= primary)
  buttonText: string;            // Primary button text (= primaryForeground)
  buttonHover: string;           // Primary button hover
  secondaryButtonBg: string;     // Secondary button bg
  secondaryButtonText: string;   // Secondary button text

  /** Module-specific (booking/ecommerce) */
  selectedBg: string;            // Selected card/slot background
  selectedBorder: string;        // Selected card/slot border
  selectedText: string;          // Text on selected items
  priceBadge: string;            // Price highlight color
  ratingColor: string;           // Star rating color
}

export interface BrandColorSource {
  /** From site.settings flat fields (branding) */
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;

  /** From site.settings.theme (if set by AI or user) */
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    backgroundColor?: string;
    textColor?: string;
  } | null;
}

// ============================================================================
// Color Manipulation Utilities
// ============================================================================

/** Parse hex color to RGB */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace(/^#/, "");
  const expanded = clean.length === 3
    ? clean.split("").map(c => c + c).join("")
    : clean;
  if (expanded.length !== 6) return null;
  return {
    r: parseInt(expanded.slice(0, 2), 16),
    g: parseInt(expanded.slice(2, 4), 16),
    b: parseInt(expanded.slice(4, 6), 16),
  };
}

/** Convert RGB to hex */
function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${clamp(r).toString(16).padStart(2, "0")}${clamp(g).toString(16).padStart(2, "0")}${clamp(b).toString(16).padStart(2, "0")}`;
}

/** Calculate relative luminance (WCAG 2.1) */
function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.5;
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(rgb.r) + 0.7152 * toLinear(rgb.g) + 0.0722 * toLinear(rgb.b);
}

/** Is this color light? (luminance > 0.45) */
function isLight(hex: string): boolean {
  return luminance(hex) > 0.45;
}

/** Lighten a hex color by a factor (0=no change, 1=white) */
function lighten(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#f8fafc";
  return rgbToHex(
    rgb.r + (255 - rgb.r) * amount,
    rgb.g + (255 - rgb.g) * amount,
    rgb.b + (255 - rgb.b) * amount,
  );
}

/** Darken a hex color by a factor (0=no change, 1=black) */
function darken(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#1e293b";
  return rgbToHex(
    rgb.r * (1 - amount),
    rgb.g * (1 - amount),
    rgb.b * (1 - amount),
  );
}

/** Get a contrasting foreground color for a given background */
function contrastingForeground(bgHex: string): string {
  return isLight(bgHex) ? "#0f172a" : "#ffffff";
}

/** Create a very light tint of a color (for card/muted backgrounds) */
function tint(hex: string, amount = 0.92): string {
  return lighten(hex, amount);
}

// ============================================================================
// Main Resolution Function
// ============================================================================

/**
 * Resolve a complete brand color palette from partial brand color inputs.
 * 
 * This function takes whatever brand colors are available (from site settings,
 * theme, or component props) and derives a complete, consistent palette.
 * 
 * Priority order:
 * 1. theme.* colors (set by AI designer or theme editor)
 * 2. site settings flat colors (set in site branding)
 * 3. Sensible defaults
 */
export function resolveBrandColors(source: BrandColorSource): BrandColorPalette {
  // Resolve core colors with priority: theme > site settings > defaults
  const primary = source.theme?.primaryColor || source.primaryColor || "#3b82f6";
  const secondary = source.theme?.secondaryColor || source.secondaryColor || darken(primary, 0.15);
  const accent = source.theme?.accentColor || source.accentColor || "#f59e0b";
  const background = source.theme?.backgroundColor || source.backgroundColor || "#ffffff";
  const foreground = source.theme?.textColor || source.textColor || "#0f172a";

  // Derive the full palette from core colors
  const primaryFg = contrastingForeground(primary);
  const secondaryFg = contrastingForeground(secondary);
  const accentFg = contrastingForeground(accent);

  return {
    // Core
    primary,
    secondary,
    accent,
    background,
    foreground,

    // Derived foregrounds
    primaryForeground: primaryFg,
    secondaryForeground: secondaryFg,
    accentForeground: accentFg,

    // Surfaces
    muted: lighten(foreground, 0.93),         // Very light gray
    mutedForeground: lighten(foreground, 0.4), // Dimmed text
    border: lighten(foreground, 0.82),         // Subtle border
    divider: lighten(foreground, 0.87),        // Even subtler
    card: background,                          // Card bg = page bg
    cardBorder: lighten(foreground, 0.85),     // Card border
    input: background,                         // Input bg
    inputBorder: lighten(foreground, 0.78),    // Slightly darker border for inputs
    inputFocus: primary,                       // Focus ring = primary

    // State colors (semantic, don't change with brand)
    success: "#22c55e",
    error: "#ef4444",
    warning: "#f59e0b",

    // Buttons
    buttonBg: primary,
    buttonText: primaryFg,
    buttonHover: darken(primary, 0.1),
    secondaryButtonBg: "transparent",
    secondaryButtonText: primary,

    // Selection states
    selectedBg: tint(primary, 0.88),
    selectedBorder: primary,
    selectedText: isLight(tint(primary, 0.88)) ? foreground : "#ffffff",
    priceBadge: primary,
    ratingColor: "#f59e0b",                   // Stars are always amber/gold
  };
}

// ============================================================================
// Component Color Injection
// ============================================================================

/**
 * Maps brand palette keys to common component color prop names.
 * 
 * When a component has a color prop that isn't explicitly set,
 * the renderer looks up this map to find the brand palette value to inject.
 * 
 * This covers the 146 color fields across booking components (and beyond).
 * Components still accept explicit overrides — this only fills gaps.
 */
const BRAND_COLOR_MAP: Record<string, keyof BrandColorPalette> = {
  // Primary / accent
  primaryColor: "primary",
  secondaryColor: "secondary",
  accentColor: "accent",

  // Background & text
  backgroundColor: "background",
  textColor: "foreground",
  
  // Header area
  headerBackgroundColor: "background",
  headerTextColor: "foreground",

  // Card colors
  cardBackgroundColor: "card",
  cardBorderColor: "cardBorder",
  cardHoverBgColor: "muted",
  cardSelectedBgColor: "selectedBg",
  cardSelectedBorderColor: "selectedBorder",

  // Button colors
  buttonBackgroundColor: "buttonBg",
  buttonTextColor: "buttonText",
  buttonHoverColor: "buttonHover",
  secondaryButtonBgColor: "secondaryButtonBg",
  secondaryButtonTextColor: "secondaryButtonText",

  // Slot / selection colors (booking)
  slotBgColor: "muted",
  slotSelectedBgColor: "primary",
  slotSelectedTextColor: "primaryForeground",
  selectedDayBgColor: "primary",
  selectedDayTextColor: "primaryForeground",
  todayBgColor: "selectedBg",

  // Input colors
  inputBorderColor: "inputBorder",
  inputFocusBorderColor: "inputFocus",
  inputBackgroundColor: "input",

  // Border & divider
  borderColor: "border",
  dividerColor: "divider",

  // State colors
  successColor: "success",
  errorColor: "error",
  warningColor: "warning",

  // Content colors
  priceColor: "primary",
  priceBadgeColor: "priceBadge",
  ratingColor: "ratingColor",
  starColor: "ratingColor",

  // Semantic / status
  availableDotColor: "success",
  unavailableDotColor: "error",
  copySuccessColor: "success",

  // Summary / progress
  summaryBgColor: "muted",
  progressBarBgColor: "primary",

  // Step indicator (booking widget)
  stepActiveColor: "primary",
  stepCompletedColor: "primary",
  stepInactiveColor: "border",

  // Tab / toolbar
  tabActiveColor: "primary",
  tabActiveBgColor: "selectedBg",
  tabInactiveColor: "mutedForeground",
  toolbarBackgroundColor: "background",
  toolbarTextColor: "foreground",

  // Code block (embed)
  codeBackgroundColor: "muted",
  codeTextColor: "foreground",

  // Embed specific
  embedBorderColor: "border",
  embedBackgroundColor: "background",
  noSiteIconColor: "mutedForeground",

  // Typography colors
  titleColor: "foreground",
  subtitleColor: "mutedForeground",
  descriptionColor: "mutedForeground",
  categoryColor: "mutedForeground",
  categoryBgColor: "muted",
  durationColor: "mutedForeground",

  // Badge colors
  featuredBadgeBgColor: "primary",
  featuredBadgeTextColor: "primaryForeground",

  // Search
  searchBgColor: "input",
  searchBorderColor: "inputBorder",

  // Specialty tags (staff)
  specialtyBgColor: "muted",
  specialtyTextColor: "foreground",
};

/**
 * Inject brand-derived color defaults into a component's props.
 * 
 * Only fills in colors that are NOT already explicitly set.
 * This preserves any studio customizations while ensuring consistency
 * for the ~83% of color fields that typically have no value.
 * 
 * @param props - The component's current props
 * @param palette - The resolved brand color palette
 * @returns Props with brand colors filled in for any unset color fields
 */
export function injectBrandColors(
  props: Record<string, unknown>,
  palette: BrandColorPalette,
): Record<string, unknown> {
  const result = { ...props };

  for (const [propName, paletteKey] of Object.entries(BRAND_COLOR_MAP)) {
    // Only inject if the prop is not already set
    const currentValue = result[propName];
    if (
      currentValue === undefined ||
      currentValue === null ||
      currentValue === ""
    ) {
      result[propName] = palette[paletteKey];
    }
  }

  return result;
}

/**
 * Extract brand color source from site settings (as stored in the DB).
 * 
 * Handles both flat settings (site.settings.primary_color) and
 * nested theme (site.settings.theme.primaryColor).
 */
export function extractBrandSource(siteSettings: Record<string, unknown>): BrandColorSource {
  const theme = siteSettings.theme as BrandColorSource["theme"] | undefined;

  return {
    primaryColor: siteSettings.primary_color as string | undefined,
    secondaryColor: siteSettings.secondary_color as string | undefined,
    accentColor: siteSettings.accent_color as string | undefined,
    backgroundColor: siteSettings.background_color as string | undefined,
    textColor: siteSettings.text_color as string | undefined,
    theme: theme || null,
  };
}

// ============================================================================
// CSS Custom Property Generation
// ============================================================================

/**
 * Convert hex color to HSL component string (e.g., "220 15% 93%").
 * 
 * This is the format used by Tailwind CSS variables in brand-variables.css.
 * The Tailwind config maps `bg-card` → `hsl(var(--color-card))`, where
 * `--color-card` must be space-separated HSL values WITHOUT the `hsl()` wrapper.
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hexToHslString(hex: string): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return "0 0% 100%";
  return `${hsl.h} ${hsl.s}% ${hsl.l}%`;
}

/**
 * Generate a complete set of CSS custom property overrides from a brand palette.
 * 
 * ARCHITECTURE:
 * This is the GLOBAL BRANDING CSS VARIABLE LAYER. When applied to `.studio-renderer`,
 * it overrides EVERY CSS variable that Tailwind utilities and shadcn/ui components
 * reference. This means:
 * 
 * - `bg-card` → uses site's card color (NOT dashboard's)
 * - `text-foreground` → uses site's text color (NOT dashboard's)
 * - `bg-primary` → uses site's primary color (NOT dashboard's)
 * - `bg-muted` → uses site's muted color (NOT dashboard's)
 * - `border` → uses site's border color (NOT dashboard's)
 * 
 * This is the ONE fix that ensures ALL shadcn components (used by ecommerce,
 * booking, and any other module) render with the site's brand colors.
 * 
 * It also forces LIGHT MODE by setting light-appropriate values, which means
 * even if the dashboard is in dark mode, published site components stay light.
 * 
 * @param palette - The resolved brand color palette
 * @param fontHeading - Google Font name for headings (e.g., "Playfair Display")
 * @param fontBody - Google Font name for body text (e.g., "Inter")
 * @returns Record of CSS custom properties to spread on the wrapper element
 */
export function generateBrandCSSVars(
  palette: BrandColorPalette,
  fontHeading?: string | null,
  fontBody?: string | null,
): Record<string, string> {
  const vars: Record<string, string> = {};

  // ── Tailwind --color-* HSL variables ──────────────────────────────────
  // These are the variables referenced by Tailwind via `hsl(var(--color-*))`.
  // Setting them here overrides the dashboard's :root / .dark values.
  vars["--color-background"] = hexToHslString(palette.background);
  vars["--color-foreground"] = hexToHslString(palette.foreground);
  vars["--color-card"] = hexToHslString(palette.card);
  vars["--color-card-foreground"] = hexToHslString(palette.foreground);
  vars["--color-popover"] = hexToHslString(palette.card);
  vars["--color-popover-foreground"] = hexToHslString(palette.foreground);
  vars["--color-muted"] = hexToHslString(palette.muted);
  vars["--color-muted-foreground"] = hexToHslString(palette.mutedForeground);
  vars["--color-border"] = hexToHslString(palette.border);
  vars["--color-input"] = hexToHslString(palette.inputBorder);
  vars["--color-ring"] = hexToHslString(palette.primary);
  vars["--color-primary"] = hexToHslString(palette.primary);
  vars["--color-primary-foreground"] = hexToHslString(palette.primaryForeground);
  vars["--color-secondary"] = hexToHslString(palette.secondary);
  vars["--color-secondary-foreground"] = hexToHslString(palette.secondaryForeground);
  vars["--color-accent"] = hexToHslString(palette.accent);
  vars["--color-accent-foreground"] = hexToHslString(palette.accentForeground);
  vars["--color-success"] = hexToHslString(palette.success);
  vars["--color-warning"] = hexToHslString(palette.warning);
  vars["--color-danger"] = hexToHslString(palette.error);

  // ── Shadcn v2 direct CSS variables ────────────────────────────────────
  // Some shadcn components or raw CSS references use these variables directly
  // (without the hsl() wrapper). We set them to hex for maximum compatibility.
  vars["--background"] = palette.background;
  vars["--foreground"] = palette.foreground;
  vars["--card"] = palette.card;
  vars["--card-foreground"] = palette.foreground;
  vars["--popover"] = palette.card;
  vars["--popover-foreground"] = palette.foreground;
  vars["--muted"] = palette.muted;
  vars["--muted-foreground"] = palette.mutedForeground;
  vars["--primary"] = palette.primary;
  vars["--primary-foreground"] = palette.primaryForeground;
  vars["--secondary"] = palette.secondary;
  vars["--secondary-foreground"] = palette.secondaryForeground;
  vars["--accent"] = palette.accent;
  vars["--accent-foreground"] = palette.accentForeground;
  vars["--destructive"] = palette.error;
  vars["--border"] = palette.border;
  vars["--input"] = palette.inputBorder;
  vars["--ring"] = palette.primary;

  // ── Font families ─────────────────────────────────────────────────────
  // These override the dashboard's --font-sans and --font-display variables.
  // All components that use `font-sans` (body text) or headings get the site's fonts.
  if (fontBody) {
    vars["--font-sans"] = `'${fontBody}', ui-sans-serif, system-ui, -apple-system, sans-serif`;
  }
  if (fontHeading) {
    vars["--font-display"] = `'${fontHeading}', ui-sans-serif, system-ui, sans-serif`;
  }

  return vars;
}
