/**
 * AI Website Designer - Output Converter
 * 
 * Converts the AI-generated website output (GeneratedPage[], GeneratedComponent[])
 * to the Studio format (StudioPageData) that can be rendered and saved.
 * 
 * This is the critical bridge between AI generation and the real Studio rendering system.
 */

import { nanoid } from "nanoid";
import type { StudioPageData, StudioComponent } from "@/types/studio";
import type { GeneratedPage, GeneratedComponent, WebsiteDesignerOutput } from "./types";

// =============================================================================
// DESIGN TOKENS — Color system from AI architecture
// =============================================================================

/**
 * Design tokens from the AI architecture phase.
 * These ensure ALL components use consistent, themed colors
 * instead of hardcoded fallbacks like #3b82f6.
 */
export interface DesignTokens {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontHeading?: string;
  fontBody?: string;
  borderRadius?: string;
  shadowStyle?: string;
}

/** Current design tokens for the active conversion — set per-conversion call */
let activeDesignTokens: DesignTokens = {};

// =============================================================================
// PROFESSIONAL COLOR HARMONY SYSTEM
// =============================================================================
// Based on WCAG 2.1 guidelines, Material Design color system,
// and proven color theory: complementary, analogous, split-complementary,
// triadic, and monochromatic harmonies.
// =============================================================================

/** Parse hex color to RGB */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  const full = clean.length === 3
    ? clean.split("").map(c => c + c).join("")
    : clean;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

/** Convert RGB to hex */
function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${clamp(r).toString(16).padStart(2, "0")}${clamp(g).toString(16).padStart(2, "0")}${clamp(b).toString(16).padStart(2, "0")}`;
}

/** Convert RGB to HSL */
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s, l };
}

/** Convert HSL to RGB */
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
}

/**
 * Calculate WCAG 2.1 contrast ratio between two colors
 * Returns ratio value (1:1 to 21:1). Minimum 4.5:1 for normal text, 3:1 for large.
 */
function getContrastRatio(hex1: string, hex2: string): number {
  const relativeLuminance = (hex: string) => {
    const { r, g, b } = hexToRgb(hex);
    const [rs, gs, bs] = [r / 255, g / 255, b / 255].map(c =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    );
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Ensure text color has sufficient contrast against background
 * Adjusts the text color to meet WCAG AA (4.5:1) if needed
 */
function ensureContrast(textHex: string, bgHex: string, minRatio = 4.5): string {
  const ratio = getContrastRatio(textHex, bgHex);
  if (ratio >= minRatio) return textHex;
  // If contrast is insufficient, pick white or dark text
  const whiteRatio = getContrastRatio("#ffffff", bgHex);
  const darkRatio = getContrastRatio("#111827", bgHex);
  return whiteRatio > darkRatio ? "#ffffff" : "#111827";
}

/** Lighten a hex color by a percentage (0-100) */
function lightenColor(hex: string, amount: number): string {
  const { h, s, l } = rgbToHsl(...Object.values(hexToRgb(hex)) as [number, number, number]);
  const newL = Math.min(1, l + (amount / 100) * (1 - l));
  const rgb = hslToRgb(h, s, newL);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

/** Darken a hex color by a percentage (0-100) */
function darkenColor(hex: string, amount: number): string {
  const { h, s, l } = rgbToHsl(...Object.values(hexToRgb(hex)) as [number, number, number]);
  const newL = Math.max(0, l - (amount / 100) * l);
  const rgb = hslToRgb(h, s, newL);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

/** Add alpha (transparency) to a hex color, returns rgba string */
function withAlpha(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Generate a complete, harmonious color palette from a primary color.
 * This ensures ALL components look professional together.
 * 
 * Produces colors for:
 * - Cards, borders, inputs (surface variants)
 * - Hover states, focus rings, shadows
 * - Text hierarchy (heading, body, muted)
 * - Button variants (primary, secondary, outline)
 * - Gradients
 */
interface ColorPalette {
  // Surfaces
  cardBg: string;
  cardBorder: string;
  cardHoverBorder: string;
  inputBg: string;
  inputBorder: string;
  inputFocusBorder: string;
  surfaceElevated: string;
  surfaceOverlay: string;
  // Text hierarchy
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnPrimary: string;
  textOnDark: string;
  // Accent & interactive
  primary: string;
  primaryHover: string;
  primaryMuted: string;  // 10-15% opacity for backgrounds
  secondary: string;
  accent: string;
  // Borders & dividers
  borderDefault: string;
  borderStrong: string;
  divider: string;
  // Focus & feedback
  focusRing: string;
  shadowColor: string;
  // Gradients
  gradientFrom: string;
  gradientTo: string;
}

function generateColorPalette(tokens: DesignTokens): ColorPalette {
  const primary = tokens.primaryColor || "#3b82f6";
  const accent = tokens.accentColor || tokens.secondaryColor || lightenColor(primary, 20);
  const bg = tokens.backgroundColor || "#ffffff";
  const text = tokens.textColor || "#111827";
  const dark = isDarkTheme();

  if (dark) {
    // === DARK THEME PALETTE ===
    // Industry-proven dark mode colors (Material Design 3 / Tailwind dark patterns)
    return {
      // Surfaces — layered dark (elevated surfaces get lighter)
      cardBg: "#1e293b",          // slate-800
      cardBorder: "#334155",       // slate-700
      cardHoverBorder: lightenColor(primary, 15),
      inputBg: "#1e293b",          // slightly raised
      inputBorder: "#475569",      // slate-600
      inputFocusBorder: primary,
      surfaceElevated: "#1e293b",
      surfaceOverlay: "rgba(0,0,0,0.6)",
      // Text — high contrast for readability
      textPrimary: "#f8fafc",      // slate-50
      textSecondary: "#cbd5e1",    // slate-300
      textMuted: "#94a3b8",        // slate-400
      textOnPrimary: ensureContrast("#ffffff", primary),
      textOnDark: "#f8fafc",
      // Accent
      primary,
      primaryHover: lightenColor(primary, 15),
      primaryMuted: withAlpha(primary, 0.15),
      secondary: accent,
      accent,
      // Borders
      borderDefault: "#334155",
      borderStrong: "#475569",
      divider: "#1e293b",
      // Focus
      focusRing: withAlpha(primary, 0.5),
      shadowColor: "rgba(0,0,0,0.4)",
      // Gradients
      gradientFrom: bg || "#0f172a",
      gradientTo: "#1e293b",
    };
  } else {
    // === LIGHT THEME PALETTE ===
    return {
      // Surfaces — clean whites with subtle elevation
      cardBg: "#ffffff",
      cardBorder: "#e2e8f0",       // slate-200
      cardHoverBorder: lightenColor(primary, 30),
      inputBg: "#ffffff",
      inputBorder: "#cbd5e1",      // slate-300
      inputFocusBorder: primary,
      surfaceElevated: "#ffffff",
      surfaceOverlay: "rgba(0,0,0,0.5)",
      // Text
      textPrimary: text || "#0f172a",
      textSecondary: "#475569",    // slate-600
      textMuted: "#94a3b8",        // slate-400
      textOnPrimary: ensureContrast("#ffffff", primary),
      textOnDark: "#ffffff",
      // Accent
      primary,
      primaryHover: darkenColor(primary, 12),
      primaryMuted: withAlpha(primary, 0.08),
      secondary: accent,
      accent,
      // Borders
      borderDefault: "#e2e8f0",
      borderStrong: "#cbd5e1",
      divider: "#f1f5f9",
      // Focus
      focusRing: withAlpha(primary, 0.3),
      shadowColor: "rgba(0,0,0,0.08)",
      // Gradients
      gradientFrom: "#ffffff",
      gradientTo: "#f8fafc",
    };
  }
}

/** Cached palette — regenerated when design tokens change */
let cachedPalette: ColorPalette | null = null;

/** Get the current color palette (generates if needed) */
function palette(): ColorPalette {
  if (!cachedPalette) {
    cachedPalette = generateColorPalette(activeDesignTokens);
  }
  return cachedPalette;
}

/** Get the themed primary color, falling back to a sensible neutral if no tokens */
function themePrimary(): string {
  return activeDesignTokens.primaryColor || "#3b82f6";
}

/** Get the themed accent color */
function themeAccent(): string {
  return activeDesignTokens.accentColor || activeDesignTokens.primaryColor || "#f59e0b";
}

/** Get the themed background color */
function themeBackground(): string {
  return activeDesignTokens.backgroundColor || "#ffffff";
}

/** Get the themed text color */
function themeText(): string {
  return activeDesignTokens.textColor || "#111827";
}

/** Determine if the site theme is dark (dark background) */
function isDarkTheme(): boolean {
  const bg = themeBackground().toLowerCase();
  // Parse hex to check luminance
  if (bg.startsWith("#") && bg.length >= 7) {
    const r = parseInt(bg.slice(1, 3), 16);
    const g = parseInt(bg.slice(3, 5), 16);
    const b = parseInt(bg.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  }
  return false;
}

// =============================================================================
// LINK VALIDATION & FIXING
// =============================================================================

/** 
 * Default valid routes - these are common page types we expect
 * The actual pages generated will be used to validate links
 */
const DEFAULT_ROUTES = ["/", "/about", "/services", "/contact", "/menu", "/portfolio", "/work", "/gallery", "/team", "/pricing", "/faq", "/blog", "/shop", "/products", "/book", "/reserve", "/packages"];

/** Current page slugs being generated - set via setGeneratedPageSlugs() */
// NOTE: This is module-level mutable state. For thread safety in concurrent
// generations, the caller should use convertOutputToStudioPages() which 
// internally sets this before processing. For sequential use this is fine.
let generatedPageSlugs: string[] = [];

/**
 * Set the actual page slugs from the generated website
 * This should be called before converting pages to ensure links are valid
 * @deprecated Use convertOutputToStudioPages() which sets slugs automatically
 */
export function setGeneratedPageSlugs(slugs: string[]): void {
  generatedPageSlugs = slugs.map(s => s.startsWith('/') ? s : `/${s}`);
}

/**
 * Set design tokens for the converter to use as themed color defaults.
 * Call this BEFORE convertPageToStudioFormat() when not using convertOutputToStudioPages().
 */
export function setDesignTokens(tokens: DesignTokens): void {
  activeDesignTokens = tokens;
  cachedPalette = null; // Regenerate palette for new tokens
}

/**
 * Get the combined list of valid routes (generated pages + defaults)
 */
function getValidRoutes(): string[] {
  return [...new Set([...generatedPageSlugs, ...DEFAULT_ROUTES])];
}

/**
 * Find the best matching route for a broken/placeholder link
 */
function findBestRoute(context: string, validRoutes: string[]): string {
  const contextLower = context.toLowerCase();
  
  // Priority mappings - check in order
  const mappings: [string[], string[]][] = [
    [["contact", "quote", "reach", "call", "email"], ["/contact"]],
    [["book", "reserve", "appointment", "schedule"], ["/book", "/reserve", "/contact"]],
    [["menu", "food", "dish", "eat", "drink"], ["/menu"]],
    [["service", "what we", "offer"], ["/services"]],
    [["about", "story", "who we", "our team", "meet"], ["/about", "/team"]],
    [["work", "portfolio", "project", "case stud"], ["/portfolio", "/work", "/gallery"]],
    [["shop", "product", "buy", "store", "purchase"], ["/shop", "/products"]],
    [["price", "pricing", "cost", "plan"], ["/pricing"]],
    [["faq", "question", "help"], ["/faq"]],
    [["blog", "news", "article", "post"], ["/blog"]],
    [["gallery", "photo", "image"], ["/gallery"]],
    [["home", "start", "get started", "learn more"], ["/"]],
  ];

  for (const [keywords, possibleRoutes] of mappings) {
    if (keywords.some(kw => contextLower.includes(kw))) {
      // Find first matching route that exists
      for (const route of possibleRoutes) {
        if (validRoutes.includes(route)) {
          return route;
        }
      }
    }
  }
  
  // Default fallback - prefer contact if it exists, otherwise home
  if (validRoutes.includes("/contact")) return "/contact";
  return "/";
}

/**
 * Fix a link to ensure it's a valid route
 * Converts placeholder links (#, #section, empty) to appropriate pages
 */
function fixLink(href: string | undefined | null, context: string = "default"): string {
  const validRoutes = getValidRoutes();
  
  if (!href || href === "#" || href === "" || href.startsWith("#section")) {
    return findBestRoute(context, validRoutes);
  }
  
  // Preserve external URLs — never modify these
  if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return href;
  }
  
  // Normalize the href
  let normalizedHref = href.toLowerCase().trim();
  
  // If it's already a valid-looking path
  if (normalizedHref.startsWith("/")) {
    // Check if this exact route exists
    if (validRoutes.includes(normalizedHref)) {
      return normalizedHref;
    }
    // Try without trailing slash
    const withoutTrailing = normalizedHref.replace(/\/$/, '');
    if (validRoutes.includes(withoutTrailing)) {
      return withoutTrailing;
    }
    // Route doesn't exist, find best match based on context
    return findBestRoute(context || normalizedHref, validRoutes);
  }
  
  // If it looks like a URL fragment, try to make it a route
  if (normalizedHref.startsWith("#")) {
    const routeGuess = normalizedHref.replace("#", "/");
    if (validRoutes.includes(routeGuess)) {
      return routeGuess;
    }
    return findBestRoute(context || routeGuess, validRoutes);
  }
  
  // Otherwise, prepend with / and check
  const asRoute = "/" + normalizedHref.replace(/\s+/g, "-");
  if (validRoutes.includes(asRoute)) {
    return asRoute;
  }
  
  // Fallback to context-based matching
  return findBestRoute(context, validRoutes);
}

/**
 * Recursively fix all links in an object
 */
function fixLinksInObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  // Keys that are navigation links (should be fixed)
  const navLinkKeys = ["link", "href", "ctaLink", "buttonLink", "primaryButtonLink", "secondaryButtonLink", "logoLink"];
  // Keys that are asset/image URLs (should NOT be fixed)
  const assetUrlKeys = ["logoUrl", "logo_url", "imageUrl", "image_url", "src", "image", "backgroundImage", "videoPoster", "videoSrc", "avatarUrl", "avatar_url", "icon"];
  
  for (const [key, value] of Object.entries(obj)) {
    const keyLower = key.toLowerCase();
    
    // Skip asset/image URL keys entirely
    if (assetUrlKeys.some(k => keyLower === k.toLowerCase())) {
      result[key] = value;
      continue;
    }
    
    // Check if this is a navigation link field
    const isNavLink = navLinkKeys.some(k => keyLower === k.toLowerCase()) || 
                      (keyLower.includes("link") || keyLower.includes("href")) && !keyLower.includes("url");
    
    if (isNavLink) {
      if (typeof value === "string") {
        result[key] = fixLink(value, String(obj.label || obj.text || obj.title || obj.ctaText || ""));
      } else {
        result[key] = value;
      }
    } else if (Array.isArray(value)) {
      // Recursively fix arrays
      result[key] = value.map((item) => {
        if (typeof item === "object" && item !== null) {
          return fixLinksInObject(item as Record<string, unknown>);
        }
        return item;
      });
    } else if (typeof value === "object" && value !== null) {
      // Recursively fix nested objects
      result[key] = fixLinksInObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

// =============================================================================
// CONVERTER FUNCTIONS
// =============================================================================

/**
 * Convert a single GeneratedPage to StudioPageData format
 */
export function convertPageToStudioFormat(page: GeneratedPage): StudioPageData {
  const components: Record<string, StudioComponent> = {};
  const rootChildren: string[] = [];

  // Process each component in the page
  for (const genComponent of page.components) {
    const studioComponent = convertComponentToStudio(genComponent);
    components[studioComponent.id] = studioComponent;
    rootChildren.push(studioComponent.id);
  }

  return {
    version: "1.0",
    root: {
      id: "root",
      type: "Root",
      props: {
        title: page.seo?.title || page.title,
        description: page.seo?.description || page.description,
      },
      children: rootChildren,
    },
    components,
    zones: {},
  };
}

/**
 * Convert a GeneratedComponent to StudioComponent format
 */
function convertComponentToStudio(genComponent: GeneratedComponent): StudioComponent {
  // Map AI component types to Studio component types
  const typeMap: Record<string, string> = {
    // AI tends to generate these types - map to Studio types
    "HeroBlock": "Hero",
    "HeroSection": "Hero",
    "FeaturesGridBlock": "Features",
    "FeaturesBlock": "Features",
    "FeatureGrid": "Features",
    "CTABlock": "CTA",
    "CTASection": "CTA",
    "ContentBlock": "RichText",
    "TextBlock": "Text",
    "ServicesGridBlock": "Features",
    "ServicesBlock": "Features",
    "TeamGridBlock": "Team",
    "TeamBlock": "Team",
    "ContactFormBlock": "ContactForm",
    "TestimonialsBlock": "Testimonials",
    "TestimonialBlock": "Testimonials",
    "PricingBlock": "Pricing",
    "PricingSection": "Pricing",
    "FAQBlock": "FAQ",
    "GalleryBlock": "Gallery",
    "StatsBlock": "Stats",
    "NavbarBlock": "Navbar",
    "FooterBlock": "Footer",
    "SectionBlock": "Section",
    "QuoteBlock": "Quote",
    "NewsletterBlock": "Newsletter",
    // Direct mappings
    "Hero": "Hero",
    "Features": "Features",
    "CTA": "CTA",
    "Testimonials": "Testimonials",
    "Pricing": "Pricing",
    "FAQ": "FAQ",
    "Gallery": "Gallery",
    "Stats": "Stats",
    "Team": "Team",
    "ContactForm": "ContactForm",
    "Navbar": "Navbar",
    "Footer": "Footer",
    "Section": "Section",
    "Container": "Container",
    "Heading": "Heading",
    "Text": "Text",
    "RichText": "RichText",
    "Image": "Image",
    "Button": "Button",
    "Divider": "Divider",
    "Spacer": "Spacer",
    // Module component type mappings
    "ServiceSelector": "BookingServiceSelector",
    "BookingServiceSelector": "BookingServiceSelector",
    "BookingWidget": "BookingWidget",
    "BookingCalendar": "BookingCalendar",
    "BookingForm": "BookingForm",
    "BookingEmbed": "BookingEmbed",
    "BookingStaffGrid": "BookingStaffGrid",
    "ProductGrid": "ProductGrid",
    "CartItems": "CartItems",
    "CartSummary": "CartSummary",
    "CheckoutForm": "CheckoutForm",
  };

  const studioType = typeMap[genComponent.type] || genComponent.type;

  // First, fix all links in the props
  const fixedProps = fixLinksInObject(genComponent.props || {});
  
  // Transform props to match Studio component expectations
  const studioProps = transformPropsForStudio(studioType, fixedProps);

  return {
    id: genComponent.id || nanoid(10),
    type: studioType,
    props: studioProps,
    parentId: "root",
  };
}

/**
 * Transform AI-generated props to match Studio component field expectations
 * 
 * CRITICAL: This converter ensures proper defaults for:
 * - Hero overlays (readability on images)
 * - Navbar scroll behavior  
 * - Consistent styling
 * - Mobile-friendly configurations
 * - Valid links (no placeholders!)
 */
function transformPropsForStudio(
  type: string,
  props: Record<string, unknown>
): Record<string, unknown> {
  const transformed = { ...props };

  // Common transformations across all components
  
  // Hero component - ENSURE PROPER OVERLAY FOR READABILITY
  if (type === "Hero") {
    const hasBackgroundImage = !!(props.backgroundImage || props.image);
    const ctaText = String(props.ctaText || props.buttonText || props.primaryButtonText || "Get Started");
    
    return {
      // Content
      title: props.headline || props.title || "Welcome",
      subtitle: props.subheadline || props.subtitle || "",
      description: props.description || props.subheadline || props.subtitle || "", // NEVER let it fall to registry default
      
      // CTA Buttons - ALWAYS use fixLink to ensure valid routes
      primaryButtonText: ctaText,
      primaryButtonLink: fixLink(
        String(props.ctaLink || props.buttonLink || props.primaryButtonLink || ""),
        ctaText
      ),
      primaryButtonColor: props.primaryButtonColor || props.ctaColor || themePrimary(),
      primaryButtonTextColor: props.primaryButtonTextColor || "#ffffff",
      primaryButtonStyle: props.primaryButtonStyle || "solid",
      primaryButtonSize: props.primaryButtonSize || "lg",
      primaryButtonRadius: props.primaryButtonRadius || "md",
      
      secondaryButtonText: props.secondaryButtonText || props.secondaryCtaText || "",
      secondaryButtonLink: fixLink(
        String(props.secondaryButtonLink || props.secondaryCtaLink || ""),
        String(props.secondaryButtonText || "")
      ),
      secondaryButtonColor: props.secondaryButtonColor || themePrimary(),
      
      // Background
      backgroundImage: props.backgroundImage || props.image || "",
      backgroundColor: props.backgroundColor || props.gradientFrom || (isDarkTheme() ? "#1f2937" : "#ffffff"),
      
      // Gradient background for modern look
      backgroundGradient: props.backgroundGradient ?? (isDarkTheme() && !hasBackgroundImage),
      backgroundGradientFrom: props.backgroundGradientFrom || (isDarkTheme() ? "#111827" : "#ffffff"),
      backgroundGradientTo: props.backgroundGradientTo || (isDarkTheme() ? "#1e293b" : "#f9fafb"),
      backgroundGradientDirection: props.backgroundGradientDirection || "to-b",
      
      // CRITICAL: Always add overlay when there's a background image for text readability
      backgroundOverlay: hasBackgroundImage ? true : (props.backgroundOverlay ?? false),
      backgroundOverlayColor: props.backgroundOverlayColor || "#000000",
      backgroundOverlayOpacity: hasBackgroundImage ? (props.backgroundOverlayOpacity || 70) : 0,
      
      // Text colors - ensure readability
      titleColor: hasBackgroundImage ? "#ffffff" : (props.titleColor || (isDarkTheme() ? "#ffffff" : "#1f2937")),
      subtitleColor: hasBackgroundImage ? "rgba(255,255,255,0.9)" : (props.subtitleColor || (isDarkTheme() ? "rgba(255,255,255,0.9)" : "#4b5563")),
      descriptionColor: hasBackgroundImage ? "rgba(255,255,255,0.85)" : (props.descriptionColor || (isDarkTheme() ? "rgba(255,255,255,0.85)" : "#6b7280")),
      
      // Layout
      contentAlign: props.alignment || props.contentAlign || "center",
      variant: props.variant || "centered",
      verticalAlign: props.verticalAlign || "center",
      
      // Typography sizing
      titleSize: props.titleSize || "xl",
      titleWeight: props.titleWeight || "bold",
      titleAlign: props.titleAlign || "",
      subtitleSize: props.subtitleSize || "",
      descriptionSize: props.descriptionSize || "",
      descriptionMaxWidth: props.descriptionMaxWidth || "",
      
      // Badge
      badge: props.badge || "",
      badgeColor: props.badgeColor || "",
      badgeTextColor: props.badgeTextColor || "",
      
      // Split variant image
      image: props.image || props.heroImage || "",
      imageAlt: props.imageAlt || "",
      imagePosition: props.imagePosition || "right",
      
      // Size — proper defaults prevent squished hero sections
      minHeight: props.minHeight || "75vh",
      maxWidth: props.maxWidth || "7xl",
      paddingTop: props.paddingTop || "xl",
      paddingBottom: props.paddingBottom || "xl",
      
      // Animation
      animateOnLoad: props.animateOnLoad ?? true,
      animationType: props.animationType || "fade-up",
    };
  }

  // Navbar component - ENSURE PROPER SCROLL BEHAVIOR
  if (type === "Navbar") {
    const links = props.links || props.navItems || props.navLinks || props.navigation || [];
    const ctaText = String(props.ctaText || props.buttonText || "Contact Us");
    
    return {
      // Logo
      logoText: props.logoText || props.brandName || "Brand",
      logo: props.logo || props.logoImage || "",
      logoLink: "/",
      logoHeight: props.logoHeight || 40,
      
      // Links - ensure they're properly formatted with valid routes
      links: Array.isArray(links) ? links.map((link: Record<string, unknown>) => ({
        label: link.label || link.text || link.name || "",
        href: fixLink(String(link.href || link.url || link.link || ""), String(link.label || link.text || "")),
        target: link.isExternal ? "_blank" : (link.target || "_self"),
      })) : [],
      
      // CTA - ALWAYS use fixLink
      ctaText,
      ctaLink: fixLink(String(props.ctaLink || props.buttonLink || ""), ctaText),
      ctaStyle: props.ctaStyle || "solid",
      ctaColor: props.ctaColor || themePrimary(),
      ctaTextColor: props.ctaTextColor || "#ffffff",
      ctaSize: props.ctaSize || "md",
      ctaBorderRadius: props.ctaBorderRadius || "md",
      
      // CRITICAL: Scroll behavior for better UX
      position: "sticky",
      hideOnScroll: true,
      showOnScrollUp: true,
      
      // Mobile menu - MUST match site theme (not hardcoded white)
      mobileMenuStyle: props.mobileMenuStyle || "fullscreen",
      mobileBreakpoint: props.mobileBreakpoint || "md",
      showCtaInMobileMenu: true,
      mobileMenuLinkSpacing: props.mobileMenuLinkSpacing || "spacious",
      mobileMenuBackground: props.mobileMenuBackground || (isDarkTheme() ? "#111827" : "#ffffff"),
      mobileMenuTextColor: props.mobileMenuTextColor || (isDarkTheme() ? "#f9fafb" : "#1f2937"),
      hamburgerColor: props.hamburgerColor || (isDarkTheme() ? "#f9fafb" : "#1f2937"),
      
      // Appearance — inherit site theme colors
      backgroundColor: props.backgroundColor || (isDarkTheme() ? "#111827" : "#ffffff"),
      textColor: props.textColor || (isDarkTheme() ? "#f9fafb" : "#1f2937"),
      shadow: props.shadow || (isDarkTheme() ? "none" : "sm"),
      borderBottom: props.borderBottom ?? !isDarkTheme(),
      borderColor: props.borderColor || (isDarkTheme() ? "#374151" : "#e5e7eb"),
      
      // Link styling
      linkHoverEffect: props.linkHoverEffect || "opacity",
      linkFontWeight: props.linkFontWeight || "medium",
    };
  }

  // Features component
  if (type === "Features") {
    const features = props.features || props.items || [];
    return {
      title: props.headline || props.title || "Features",
      subtitle: props.subtitle || "",
      description: props.description || "",
      features: Array.isArray(features) ? features.map((f: Record<string, unknown>, i: number) => ({
        id: String(i + 1),
        title: f.title || f.name || `Feature ${i + 1}`,
        description: f.description || f.content || "",
        icon: f.icon || "star",
        iconColor: f.iconColor || props.iconColor || themePrimary(),
        iconBackgroundColor: f.iconBackgroundColor || (isDarkTheme() ? `${themePrimary()}20` : ""),
      })) : [],
      variant: props.variant || "cards",
      columns: props.columns || 3,
      iconStyle: props.iconStyle || "emoji", // Use emoji by default — they render everywhere
      // Card styling — use palette for consistent theming
      showBorder: props.showBorder ?? true,
      showShadow: props.showShadow ?? !isDarkTheme(),
      cardBackgroundColor: props.cardBackgroundColor || palette().cardBg,
      cardBorderColor: props.cardBorderColor || palette().cardBorder,
      cardBorderRadius: props.cardBorderRadius || "lg",
      cardPadding: props.cardPadding || "lg",
      hoverEffect: props.hoverEffect || "lift",
      gap: props.gap || "md",
      // Section background — must match site theme
      backgroundColor: props.backgroundColor || (isDarkTheme() ? themeBackground() : ""),
      textColor: props.textColor || palette().textPrimary,
      titleColor: props.titleColor || palette().textPrimary,
      subtitleColor: props.subtitleColor || (isDarkTheme() ? palette().accent : ""),
      accentColor: props.accentColor || themePrimary(),
    };
  }

  // CTA component — Studio uses 'buttonText' NOT 'ctaText'
  if (type === "CTA") {
    const buttonText = String(props.ctaText || props.buttonText || "Contact Us");
    const ctaBg = props.backgroundColor || (isDarkTheme() ? "#111827" : "#1f2937");
    return {
      title: props.headline || props.title || "Ready to Get Started?",
      subtitle: props.subtitle || "",
      description: props.description || "",
      // Studio CTA uses buttonText/buttonLink
      buttonText,
      buttonLink: fixLink(String(props.ctaLink || props.buttonLink || ""), buttonText),
      // CRITICAL: buttonColor must be the PRIMARY brand color, NOT white.
      // The CTA render defaults buttonColor to #ffffff which is invisible on light bg.
      buttonColor: props.buttonColor || props.ctaColor || themePrimary(),
      buttonTextColor: props.buttonTextColor || props.ctaTextColor || "#ffffff",
      buttonSize: props.buttonSize || "lg",
      buttonRadius: props.buttonRadius || "md",
      buttonStyle: props.buttonStyle || "solid",
      buttonIcon: props.buttonIcon || "arrow",
      // Secondary button — ensure visible by using proper contrast colors
      secondaryButtonText: props.secondaryButtonText || props.secondaryCtaText || "",
      secondaryButtonLink: fixLink(
        String(props.secondaryButtonLink || props.secondaryCtaLink || ""),
        String(props.secondaryButtonText || "")
      ),
      secondaryButtonColor: props.secondaryButtonColor || "#ffffff",
      secondaryButtonTextColor: props.secondaryButtonTextColor || "#ffffff",
      secondaryButtonStyle: props.secondaryButtonStyle || "outline",
      // Background — use gradient for modern look
      backgroundColor: ctaBg,
      backgroundGradient: props.backgroundGradient ?? true,
      backgroundGradientFrom: props.backgroundGradientFrom || ctaBg,
      backgroundGradientTo: props.backgroundGradientTo || (isDarkTheme() ? "#1e293b" : "#111827"),
      backgroundGradientDirection: props.backgroundGradientDirection || "to-br",
      backgroundImage: props.backgroundImage || "",
      backgroundOverlay: props.backgroundOverlay ?? false,
      backgroundOverlayColor: props.backgroundOverlayColor || "#000000",
      backgroundOverlayOpacity: props.backgroundOverlayOpacity || 60,
      // Text
      textColor: props.textColor || "#ffffff",
      titleColor: props.titleColor || "",
      // Layout
      variant: props.variant || "centered",
      contentAlign: props.contentAlign || "center",
      // Badge
      badge: props.badge || "",
      badgeColor: props.badgeColor || themePrimary(),
      badgeTextColor: props.badgeTextColor || "#ffffff",
    };
  }

  // Testimonials component
  if (type === "Testimonials") {
    const testimonials = props.testimonials || props.items || [];
    return {
      title: props.headline || props.title || "What Our Customers Say",
      subtitle: props.subtitle || "",
      description: props.description || "",
      testimonials: Array.isArray(testimonials) ? testimonials.map((t: Record<string, unknown>, i: number) => ({
        id: String(i + 1),
        quote: t.quote || t.text || t.content || "",
        author: t.author || t.name || `Customer ${i + 1}`,
        role: t.role || t.title || t.position || "",
        company: t.company || t.organization || "",
        image: t.avatar || t.image || "",
        rating: t.rating ?? 5,
      })) : [],
      variant: props.variant || "cards",
      columns: props.columns || 3,
      // Avatar settings
      showAvatar: props.showAvatar ?? true,
      avatarSize: props.avatarSize || "md",
      avatarShape: props.avatarShape || "circle",
      // Rating
      showRating: props.showRating ?? true,
      ratingStyle: props.ratingStyle || "stars",
      ratingColor: props.ratingColor || "#f59e0b",
      // Quote icon
      showQuoteIcon: props.showQuoteIcon ?? true,
      // Card styling — use palette for harmonious colors
      cardBackgroundColor: props.cardBackgroundColor || palette().cardBg,
      cardBorderColor: props.cardBorderColor || palette().cardBorder,
      cardBorderRadius: props.cardBorderRadius || "lg",
      // Background — must match site theme
      backgroundColor: props.backgroundColor || (isDarkTheme() ? themeBackground() : ""),
      textColor: props.textColor || palette().textPrimary,
      accentColor: props.accentColor || themePrimary(),
    };
  }

  // Team component
  if (type === "Team") {
    const members = props.members || props.team || props.items || [];
    return {
      title: props.headline || props.title || "Meet Our Team",
      subtitle: props.subtitle || "",
      description: props.description || "",
      members: Array.isArray(members) ? members.map((m: Record<string, unknown>, i: number) => ({
        id: String(i + 1),
        name: m.name || `Team Member ${i + 1}`,
        role: m.role || m.title || m.position || "",
        bio: m.bio || m.description || "",
        image: m.avatar || m.image || "",
        linkedin: m.linkedin || "",
        twitter: m.twitter || "",
        instagram: m.instagram || "",
        email: m.email || "",
      })) : [],
      variant: props.variant || "cards",
      columns: props.columns || 2,
      // Social & bio
      showSocial: props.showSocial ?? true,
      showBio: props.showBio ?? true,
      bioMaxLines: props.bioMaxLines || 3,
      // Image
      imageShape: props.imageShape || "circle",
      imageBorderColor: props.imageBorderColor || themePrimary(),
      // Styling — use palette for harmonious colors
      backgroundColor: props.backgroundColor || (isDarkTheme() ? themeBackground() : ""),
      cardBackgroundColor: props.cardBackgroundColor || palette().cardBg,
      cardBorderColor: props.cardBorderColor || palette().cardBorder,
      textColor: props.textColor || palette().textPrimary,
      accentColor: props.accentColor || themePrimary(),
    };
  }

  // ContactForm component
  if (type === "ContactForm") {
    return {
      headline: props.headline || props.title || "Contact Us",
      description: props.description || "",
      fields: props.fields || ["name", "email", "message"],
      submitText: props.submitText || props.submitButtonText || props.buttonText || "Send Message",
      successMessage: props.successMessage || "Thank you for your message!",
      // Form styling to match site theme
      backgroundColor: props.backgroundColor || palette().cardBg,
      textColor: props.textColor || palette().textPrimary,
      // CRITICAL: buttonColor must use brand primary, NOT default blue-600
      buttonColor: props.buttonColor || themePrimary(),
      buttonTextColor: props.buttonTextColor || palette().textOnPrimary,
      // Form field theming — uses harmonious palette
      inputBackgroundColor: props.inputBackgroundColor || palette().inputBg,
      inputBorderColor: props.inputBorderColor || palette().inputBorder,
      inputTextColor: props.inputTextColor || palette().textPrimary,
      labelColor: props.labelColor || palette().textSecondary,
    };
  }

  // Footer component - aligned with Studio Footer fields
  if (type === "Footer") {
    const linkColumns = props.columns || props.sections || props.linkColumns || [];
    const socialLinks = props.socialLinks || props.social || [];
    
    return {
      // Branding — use Studio's actual field names
      companyName: props.companyName || props.businessName || props.logoText || "Brand",
      logo: typeof props.logo === "string" && props.logo.includes("/") ? props.logo : "",
      logoText: props.logoText || props.companyName || props.businessName || "",
      description: props.description || props.tagline || "",
      
      // Link columns
      columns: Array.isArray(linkColumns) ? linkColumns.map((col: Record<string, unknown>, i: number) => ({
        title: col.title || col.heading || `Column ${i + 1}`,
        links: Array.isArray(col.links) ? col.links.map((link: Record<string, unknown>) => {
          const label = String(link.label || link.text || link.name || "");
          return {
            label,
            href: fixLink(String(link.href || link.url || ""), label),
          };
        }) : [],
      })) : [],
      
      // Social links (external URLs - don't fix)
      showSocialLinks: Array.isArray(socialLinks) && socialLinks.length > 0,
      socialLinks: Array.isArray(socialLinks) ? socialLinks.map((social: Record<string, unknown>) => ({
        platform: social.platform || social.name || "facebook",
        url: social.url || social.href || social.link || "#",
      })) : [],
      
      // Contact info
      // Contact info — filter out generic placeholders
      showContactInfo: (() => {
        const email = props.email || props.contactEmail || "";
        const phone = props.phone || props.contactPhone || "";
        const address = props.address || props.contactAddress || "";
        // Don't show contact info if it's all placeholder data
        const isPlaceholder = (v: unknown) => {
          const s = String(v || "");
          return !s || s.includes("555") || s.includes("hello@company") || s.includes("123 Main") || s.includes("info@company");
        };
        return !isPlaceholder(email) || !isPlaceholder(phone) || !isPlaceholder(address);
      })(),
      contactEmail: (() => {
        const e = String(props.email || props.contactEmail || "");
        return e.includes("hello@company") || e.includes("info@company") ? "" : e;
      })(),
      contactPhone: (() => {
        const p = String(props.phone || props.contactPhone || "");
        return p.includes("555") || p.includes("(555)") || p.includes("97X") ? "" : p;
      })(),
      contactAddress: (() => {
        const a = String(props.address || props.contactAddress || "");
        return a.includes("123 Main") ? "" : a;
      })(),
      
      // Copyright & Legal
      copyright: props.copyrightText || props.copyright || `© ${new Date().getFullYear()} All rights reserved.`,
      legalLinks: props.legalLinks || [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
      ],
      
      // Newsletter
      showNewsletter: props.showNewsletter ?? false,
      newsletterTitle: props.newsletterTitle || "Stay Updated",
      newsletterDescription: props.newsletterDescription || "",
      newsletterButtonColor: props.newsletterButtonColor || themePrimary(),
      
      // Styling — theme-aware footer colors
      variant: props.variant || "standard",
      backgroundColor: props.backgroundColor || (isDarkTheme() ? "#111827" : palette().cardBg),
      textColor: props.textColor || (isDarkTheme() ? "#f8fafc" : palette().textPrimary),
      // Footer links: readable in ALL themes — gray on dark, muted text on light
      linkColor: props.linkColor || (isDarkTheme() ? "#94a3b8" : palette().textSecondary),
      linkHoverColor: props.linkHoverColor || (isDarkTheme() ? "#ffffff" : themePrimary()),
      borderTop: props.borderTop ?? false,
    };
  }

  // FAQ component
  if (type === "FAQ") {
    const faqs = props.faqs || props.items || props.questions || [];
    return {
      title: props.headline || props.title || "Frequently Asked Questions",
      subtitle: props.subtitle || "",
      description: props.description || "",
      items: Array.isArray(faqs) ? faqs.map((f: Record<string, unknown>, i: number) => ({
        id: String(i + 1),
        question: f.question || f.title || `Question ${i + 1}`,
        answer: f.answer || f.content || f.response || "",
      })) : [],
      variant: props.variant || "accordion",
      backgroundColor: props.backgroundColor || (isDarkTheme() ? themeBackground() : ""),
      textColor: props.textColor || palette().textPrimary,
      accentColor: props.accentColor || themePrimary(),
    };
  }

  // Stats component
  if (type === "Stats") {
    const stats = props.stats || props.items || [];
    return {
      title: props.headline || props.title || "",
      subtitle: props.subtitle || "",
      description: props.description || "",
      stats: Array.isArray(stats) ? stats.map((s: Record<string, unknown>, i: number) => ({
        id: String(i + 1),
        value: s.value || s.number || "0",
        label: s.label || s.title || s.name || `Stat ${i + 1}`,
        description: s.description || "",
        suffix: s.suffix || "",
        prefix: s.prefix || "",
        icon: s.icon || "",
        iconColor: s.iconColor || "",
      })) : [],
      variant: props.variant || "simple",
      columns: props.columns || 4,
      // Number animation
      animateNumbers: props.animateNumbers ?? true,
      animationDuration: props.animationDuration || 2000,
      // Styling
      valueSize: props.valueSize || "3xl",
      valueColor: props.valueColor || themePrimary(),
      backgroundColor: props.backgroundColor || (isDarkTheme() ? themeBackground() : ""),
      textColor: props.textColor || palette().textPrimary,
      accentColor: props.accentColor || themePrimary(),
    };
  }

  // Pricing component
  if (type === "Pricing") {
    const plans = props.plans || props.tiers || props.items || [];
    return {
      title: props.headline || props.title || "Pricing",
      subtitle: props.subtitle || "",
      description: props.description || "",
      plans: Array.isArray(plans) ? plans.map((p: Record<string, unknown>, i: number) => {
        const btnText = String(p.ctaText || p.buttonText || "Get Started");
        return {
          id: String(i + 1),
          name: p.name || p.title || `Plan ${i + 1}`,
          description: p.description || "",
          monthlyPrice: p.price || p.monthlyPrice || "0",
          currency: p.currency || "ZMW",
          period: p.period || "month",
          features: Array.isArray(p.features) ? p.features.map((f: unknown) => {
            if (typeof f === "string") return { text: f, included: true };
            if (typeof f === "object" && f !== null) {
              const feat = f as Record<string, unknown>;
              return { text: feat.text || feat.name || "", included: feat.included ?? true };
            }
            return { text: String(f), included: true };
          }) : [],
          buttonText: btnText,
          buttonLink: fixLink(String(p.ctaLink || p.buttonLink || ""), btnText),
          popular: p.highlighted || p.featured || p.popular || false,
        };
      }) : [],
      variant: props.variant || "cards",
      columns: props.columns || 3,
      backgroundColor: props.backgroundColor || (isDarkTheme() ? themeBackground() : ""),
      cardBackgroundColor: props.cardBackgroundColor || palette().cardBg,
      textColor: props.textColor || palette().textPrimary,
      popularBorderColor: props.popularBorderColor || themePrimary(),
    };
  }

  // Section wrapper
  if (type === "Section") {
    return {
      backgroundColor: props.backgroundColor || "",
      backgroundImage: props.backgroundImage || "",
      padding: props.padding || "md",
      maxWidth: props.maxWidth || "xl",
    };
  }

  // Text/RichText
  if (type === "Text" || type === "RichText") {
    return {
      content: props.content || props.text || props.body || "",
      alignment: props.alignment || "left",
    };
  }

  // Heading
  if (type === "Heading") {
    return {
      text: props.text || props.title || props.content || "",
      level: props.level || "h2",
      alignment: props.alignment || "left",
    };
  }

  // Gallery component
  if (type === "Gallery") {
    const images = props.images || props.items || props.gallery || [];
    return {
      title: props.title || props.headline || "Gallery",
      subtitle: props.subtitle || "",
      description: props.description || "",
      images: Array.isArray(images) ? images.map((img: Record<string, unknown>, i: number) => ({
        id: String(i + 1),
        src: img.src || img.url || img.image || "",
        alt: img.alt || img.caption || img.title || `Image ${i + 1}`,
        title: img.title || "",
        caption: img.caption || "",
        category: img.category || "",
      })) : [],
      variant: props.variant || "grid",
      columns: props.columns || 4,
      gap: props.gap || "md",
      borderRadius: props.borderRadius || "lg",
      hoverEffect: props.hoverEffect || "zoom",
      lightbox: props.lightbox ?? true,
      // Dark theme backgrounds — use palette
      backgroundColor: props.backgroundColor || (isDarkTheme() ? themeBackground() : ""),
      textColor: props.textColor || palette().textPrimary,
      titleColor: props.titleColor || palette().textPrimary,
      subtitleColor: props.subtitleColor || (isDarkTheme() ? palette().accent : ""),
    };
  }

  // Newsletter component
  if (type === "Newsletter") {
    return {
      title: props.title || props.headline || "Stay Updated",
      description: props.description || props.subtitle || "Subscribe to our newsletter for the latest updates.",
      buttonText: props.buttonText || props.ctaText || props.submitText || "Subscribe",
      placeholder: props.placeholder || "Enter your email",
      variant: props.variant || props.layout || "inline",
      buttonColor: props.buttonColor || themePrimary(),
      backgroundColor: props.backgroundColor || (isDarkTheme() ? themeBackground() : ""),
      textColor: props.textColor || palette().textPrimary,
    };
  }

  // LogoCloud component
  if (type === "LogoCloud") {
    const logos = props.logos || props.items || props.brands || props.partners || [];
    return {
      title: props.title || props.headline || "Trusted By",
      subtitle: props.subtitle || "",
      description: props.description || "",
      logos: Array.isArray(logos) ? logos.map((logo: Record<string, unknown>, i: number) => ({
        image: logo.image || logo.src || logo.logo || logo.url || "",
        alt: logo.alt || logo.name || `Partner ${i + 1}`,
        link: logo.link || logo.url || logo.href || "",
      })) : [],
      variant: props.variant || "simple",
      columns: props.columns || 5,
      logoGrayscale: props.logoGrayscale ?? true,
      logoGrayscaleHover: props.logoGrayscaleHover ?? false,
      backgroundColor: props.backgroundColor || "",
    };
  }

  // TrustBadges component
  if (type === "TrustBadges") {
    const badges = props.badges || props.items || [];
    return {
      title: props.title || props.headline || "",
      subtitle: props.subtitle || "",
      badges: Array.isArray(badges) ? badges.map((b: Record<string, unknown>, i: number) => ({
        icon: b.icon || "shield-check",
        text: b.text || b.title || b.label || `Badge ${i + 1}`,
        description: b.description || "",
      })) : [],
      variant: props.variant || "horizontal",
      alignment: props.alignment || "center",
      backgroundColor: props.backgroundColor || "",
      textColor: props.textColor || "",
    };
  }

  // Quote component
  if (type === "Quote") {
    return {
      text: props.text || props.quote || props.content || "",
      author: props.author || props.attribution || "",
      source: props.source || props.role || props.company || "",
      style: props.style || props.variant || "default",
    };
  }

  // =============================================================================
  // MODULE COMPONENT HANDLERS
  // Booking & E-commerce modules: inject branding, containment, and theming
  // so they don't stretch full-screen or look unbranded
  // =============================================================================

  const MODULE_TYPES = [
    "BookingServiceSelector", "BookingWidget", "BookingCalendar",
    "BookingForm", "BookingEmbed", "BookingStaffGrid",
    "ProductGrid", "CartItems", "CartSummary", "CheckoutForm",
  ];

  if (MODULE_TYPES.includes(type)) {
    const pal = palette();
    return {
      ...transformed,
      // Containment — prevent edge-to-edge stretching
      maxWidth: props.maxWidth || "1280px",
      containerClassName: props.containerClassName || "max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8",
      // Branding — apply site design tokens
      primaryColor: props.primaryColor || themePrimary(),
      accentColor: props.accentColor || themeAccent(),
      backgroundColor: props.backgroundColor || (isDarkTheme() ? themeBackground() : ""),
      textColor: props.textColor || pal.textPrimary,
      cardBackgroundColor: props.cardBackgroundColor || pal.cardBg,
      cardBorderColor: props.cardBorderColor || pal.cardBorder,
      buttonColor: props.buttonColor || themePrimary(),
      buttonTextColor: props.buttonTextColor || pal.textOnPrimary,
      // Section wrapper props
      sectionPaddingY: props.sectionPaddingY || "py-12 md:py-16",
      sectionPaddingX: props.sectionPaddingX || "px-4 sm:px-6 lg:px-8",
      // Ensure module title matches brand
      headingColor: props.headingColor || pal.textPrimary,
      borderRadius: props.borderRadius || activeDesignTokens.borderRadius || "0.75rem",
    };
  }

  // Return original props for unknown types
  return transformed;
}

/**
 * Convert entire WebsiteDesignerOutput to a map of page slug -> StudioPageData
 * 
 * This function sets the page slugs AND design tokens internally before conversion
 * to ensure all links are validated and colors are themed consistently.
 * 
 * @param output - The AI-generated website output
 * @param designTokens - Optional design tokens from architecture for consistent theming
 */
export function convertOutputToStudioPages(
  output: WebsiteDesignerOutput,
  designTokens?: DesignTokens
): Map<string, { page: GeneratedPage; studioData: StudioPageData }> {
  // Set page slugs BEFORE conversion for link validation (thread-safe per call)
  const allSlugs = output.pages.map(p => p.slug.startsWith('/') ? p.slug : `/${p.slug}`);
  generatedPageSlugs = allSlugs;
  
  // Set design tokens for themed color defaults across all components
  activeDesignTokens = designTokens || output.designSystem?.colors ? {
    primaryColor: output.designSystem?.colors?.primary,
    secondaryColor: output.designSystem?.colors?.secondary,
    accentColor: output.designSystem?.colors?.accent,
    backgroundColor: output.designSystem?.colors?.background,
    textColor: output.designSystem?.colors?.text,
  } : {};
  cachedPalette = null; // Regenerate palette for new tokens
  
  const result = new Map<string, { page: GeneratedPage; studioData: StudioPageData }>();

  for (const page of output.pages) {
    const studioData = convertPageToStudioFormat(page);
    result.set(page.slug, { page, studioData });
  }

  return result;
}

/**
 * Get default empty Studio data
 */
export function getEmptyStudioData(): StudioPageData {
  return {
    version: "1.0",
    root: {
      id: "root",
      type: "Root",
      props: {},
      children: [],
    },
    components: {},
    zones: {},
  };
}
