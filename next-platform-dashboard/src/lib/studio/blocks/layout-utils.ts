/**
 * DRAMAC Studio — Layout Component Utilities
 *
 * Comprehensive Tailwind-safe class maps and shared utilities
 * for ALL layout component renders.
 *
 * CRITICAL: Every dynamic Tailwind class MUST use a pre-built lookup map.
 * NEVER use template literals like `gap-${value}` — Tailwind cannot scan them.
 *
 * @phase Layout Master Plan — Phase 1 Foundation
 */

// ============================================================================
// TYPES
// ============================================================================

export type ResponsiveValue<T> = T | { mobile?: T; tablet?: T; desktop?: T };

type ClassMapValue =
  | string
  | { mobile: string; tablet: string; desktop: string }
  | [string, string, string];

export type SpacingScale =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "8"
  | "10"
  | "12"
  | "16"
  | "20"
  | "24"
  | "32"
  | "40"
  | "48"
  | "56"
  | "64"
  | "72"
  | "80"
  | "96";

export type RadiusScale =
  | "none"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "full";

export type ShadowScale = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "inner";

// ============================================================================
// RESPONSIVE CLASS RESOLVER
// ============================================================================

/**
 * Resolves a responsive prop value to Tailwind classes using lookup maps.
 *
 * Supports both simple values ("md") and responsive objects ({ mobile: "sm", desktop: "lg" }).
 * Mobile = base classes, tablet = sm: prefix (640px+), desktop = lg: prefix (1024px+).
 */
export function getResponsiveClasses<T extends string | number>(
  prop: ResponsiveValue<T> | undefined,
  classMap: Record<string, ClassMapValue>,
): string {
  if (prop === undefined || prop === null) return "";

  const getClassFromMapping = (
    mapping: ClassMapValue,
    breakpoint: "mobile" | "tablet" | "desktop",
  ): string => {
    if (typeof mapping === "string") {
      return breakpoint === "mobile" ? mapping : "";
    }
    if (Array.isArray(mapping)) {
      return breakpoint === "mobile"
        ? mapping[0]
        : breakpoint === "tablet"
          ? mapping[1]
          : mapping[2];
    }
    return mapping[breakpoint];
  };

  if (typeof prop === "string" || typeof prop === "number") {
    const mapping = classMap[String(prop)];
    if (!mapping) return "";
    const mobile = getClassFromMapping(mapping, "mobile");
    const tablet = getClassFromMapping(mapping, "tablet");
    const desktop = getClassFromMapping(mapping, "desktop");
    return `${mobile} ${tablet} ${desktop}`.trim();
  }

  const classes: string[] = [];
  const responsiveProp = prop as { mobile?: T; tablet?: T; desktop?: T };

  if (responsiveProp.mobile !== undefined) {
    const mapping = classMap[String(responsiveProp.mobile)];
    if (mapping) classes.push(getClassFromMapping(mapping, "mobile"));
  }
  if (responsiveProp.tablet !== undefined) {
    const mapping = classMap[String(responsiveProp.tablet)];
    if (mapping) classes.push(getClassFromMapping(mapping, "tablet"));
  }
  if (responsiveProp.desktop !== undefined) {
    const mapping = classMap[String(responsiveProp.desktop)];
    if (mapping) classes.push(getClassFromMapping(mapping, "desktop"));
  }
  return classes.join(" ");
}

// ============================================================================
// SPACING MAPS — Padding, Margin, Gap
// ============================================================================

/** Vertical padding: py-* / sm:py-* / lg:py-* */
export const paddingYMap: Record<
  string,
  { mobile: string; tablet: string; desktop: string }
> = {
  none: { mobile: "py-0", tablet: "sm:py-0", desktop: "lg:py-0" },
  xs: { mobile: "py-2", tablet: "sm:py-3", desktop: "lg:py-4" },
  sm: { mobile: "py-4", tablet: "sm:py-6", desktop: "lg:py-8" },
  md: { mobile: "py-8", tablet: "sm:py-12", desktop: "lg:py-16" },
  lg: { mobile: "py-12", tablet: "sm:py-16", desktop: "lg:py-24" },
  xl: { mobile: "py-16", tablet: "sm:py-24", desktop: "lg:py-32" },
};

/** Horizontal padding: px-* / sm:px-* / lg:px-* */
export const paddingXMap: Record<
  string,
  { mobile: string; tablet: string; desktop: string }
> = {
  none: { mobile: "px-0", tablet: "sm:px-0", desktop: "lg:px-0" },
  xs: { mobile: "px-2", tablet: "sm:px-3", desktop: "lg:px-4" },
  sm: { mobile: "px-4", tablet: "sm:px-6", desktop: "lg:px-8" },
  md: { mobile: "px-4", tablet: "sm:px-8", desktop: "lg:px-12" },
  lg: { mobile: "px-6", tablet: "sm:px-10", desktop: "lg:px-16" },
};

/** All-around padding: p-* / sm:p-* / lg:p-* */
export const paddingMap: Record<
  string,
  { mobile: string; tablet: string; desktop: string }
> = {
  none: { mobile: "p-0", tablet: "sm:p-0", desktop: "lg:p-0" },
  xs: { mobile: "p-2", tablet: "sm:p-3", desktop: "lg:p-4" },
  sm: { mobile: "p-3", tablet: "sm:p-4", desktop: "lg:p-5" },
  md: { mobile: "p-4", tablet: "sm:p-6", desktop: "lg:p-8" },
  lg: { mobile: "p-6", tablet: "sm:p-8", desktop: "lg:p-10" },
  xl: { mobile: "p-8", tablet: "sm:p-10", desktop: "lg:p-12" },
};

/** Gap: gap-* / sm:gap-* / lg:gap-* */
export const gapMap: Record<
  string,
  { mobile: string; tablet: string; desktop: string }
> = {
  none: { mobile: "gap-0", tablet: "sm:gap-0", desktop: "lg:gap-0" },
  xs: { mobile: "gap-1", tablet: "sm:gap-2", desktop: "lg:gap-2" },
  sm: { mobile: "gap-2", tablet: "sm:gap-3", desktop: "lg:gap-4" },
  md: { mobile: "gap-4", tablet: "sm:gap-6", desktop: "lg:gap-8" },
  lg: { mobile: "gap-6", tablet: "sm:gap-8", desktop: "lg:gap-12" },
  xl: { mobile: "gap-8", tablet: "sm:gap-12", desktop: "lg:gap-16" },
};

/** Vertical margin: my-* / sm:my-* / lg:my-* */
export const marginYMap: Record<
  string,
  { mobile: string; tablet: string; desktop: string }
> = {
  none: { mobile: "my-0", tablet: "sm:my-0", desktop: "lg:my-0" },
  xs: { mobile: "my-2", tablet: "sm:my-2", desktop: "lg:my-3" },
  sm: { mobile: "my-3", tablet: "sm:my-4", desktop: "lg:my-6" },
  md: { mobile: "my-4", tablet: "sm:my-6", desktop: "lg:my-8" },
  lg: { mobile: "my-6", tablet: "sm:my-8", desktop: "lg:my-12" },
  xl: { mobile: "my-8", tablet: "sm:my-12", desktop: "lg:my-16" },
};

// ============================================================================
// SIZING MAPS — Width, Height, Grid Columns
// ============================================================================

/** Grid columns: grid-cols-* (base, sm:, lg:) */
export const gridColsMap: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
  7: "grid-cols-7",
  8: "grid-cols-8",
  9: "grid-cols-9",
  10: "grid-cols-10",
  11: "grid-cols-11",
  12: "grid-cols-12",
};

/** sm: prefixed grid columns */
export const smGridColsMap: Record<number, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
  5: "sm:grid-cols-5",
  6: "sm:grid-cols-6",
  7: "sm:grid-cols-7",
  8: "sm:grid-cols-8",
  9: "sm:grid-cols-9",
  10: "sm:grid-cols-10",
  11: "sm:grid-cols-11",
  12: "sm:grid-cols-12",
};

/** lg: prefixed grid columns */
export const lgGridColsMap: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
  7: "lg:grid-cols-7",
  8: "lg:grid-cols-8",
  9: "lg:grid-cols-9",
  10: "lg:grid-cols-10",
  11: "lg:grid-cols-11",
  12: "lg:grid-cols-12",
};

/** Max width classes */
export const maxWidthMap: Record<string, string> = {
  xs: "max-w-xs",
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
  full: "max-w-full",
  prose: "max-w-prose",
  none: "max-w-none",
  "screen-sm": "max-w-screen-sm",
  "screen-md": "max-w-screen-md",
  "screen-lg": "max-w-screen-lg",
  "screen-xl": "max-w-screen-xl",
  "screen-2xl": "max-w-screen-2xl",
};

/** Shadow classes */
export const shadowMap: Record<string, string> = {
  none: "",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  xl: "shadow-xl",
  "2xl": "shadow-2xl",
  inner: "shadow-inner",
};

/** Hover shadow classes */
export const hoverShadowMap: Record<string, string> = {
  none: "",
  sm: "hover:shadow-sm",
  md: "hover:shadow-md",
  lg: "hover:shadow-lg",
  xl: "hover:shadow-xl",
  "2xl": "hover:shadow-2xl",
};

// ============================================================================
// BORDER & RADIUS MAPS
// ============================================================================

/** Border radius: rounded-* / sm:rounded-* / lg:rounded-* */
export const borderRadiusMap: Record<
  string,
  { mobile: string; tablet: string; desktop: string }
> = {
  none: {
    mobile: "rounded-none",
    tablet: "sm:rounded-none",
    desktop: "lg:rounded-none",
  },
  sm: {
    mobile: "rounded-sm",
    tablet: "sm:rounded-sm",
    desktop: "lg:rounded-sm",
  },
  md: {
    mobile: "rounded-md",
    tablet: "sm:rounded-md",
    desktop: "lg:rounded-md",
  },
  lg: {
    mobile: "rounded-lg",
    tablet: "sm:rounded-lg",
    desktop: "lg:rounded-lg",
  },
  xl: {
    mobile: "rounded-xl",
    tablet: "sm:rounded-xl",
    desktop: "lg:rounded-xl",
  },
  "2xl": {
    mobile: "rounded-2xl",
    tablet: "sm:rounded-2xl",
    desktop: "lg:rounded-2xl",
  },
  "3xl": {
    mobile: "rounded-3xl",
    tablet: "sm:rounded-3xl",
    desktop: "lg:rounded-3xl",
  },
  full: {
    mobile: "rounded-full",
    tablet: "sm:rounded-full",
    desktop: "lg:rounded-full",
  },
};

/** Divider width fractions */
export const widthFractionMap: Record<string, string> = {
  full: "w-full",
  "3/4": "w-3/4",
  "2/3": "w-2/3",
  "1/2": "w-1/2",
  "1/3": "w-1/3",
  "1/4": "w-1/4",
};

/** Overflow classes */
export const overflowMap: Record<string, string> = {
  visible: "overflow-visible",
  hidden: "overflow-hidden",
  auto: "overflow-auto",
  scroll: "overflow-scroll",
  clip: "overflow-clip",
};

// ============================================================================
// SPACER HEIGHT / WIDTH MAPS
// ============================================================================

/** Spacer size → height class (vertical spacer) */
export const spacerHeightMap: Record<
  string,
  { mobile: string; tablet: string; desktop: string }
> = {
  "0": { mobile: "h-0", tablet: "sm:h-0", desktop: "lg:h-0" },
  "1": { mobile: "h-1", tablet: "sm:h-1", desktop: "lg:h-1" },
  "2": { mobile: "h-2", tablet: "sm:h-2", desktop: "lg:h-2" },
  "3": { mobile: "h-3", tablet: "sm:h-3", desktop: "lg:h-3" },
  "4": { mobile: "h-4", tablet: "sm:h-4", desktop: "lg:h-4" },
  "5": { mobile: "h-5", tablet: "sm:h-5", desktop: "lg:h-5" },
  "6": { mobile: "h-6", tablet: "sm:h-6", desktop: "lg:h-6" },
  "8": { mobile: "h-8", tablet: "sm:h-8", desktop: "lg:h-8" },
  "10": { mobile: "h-10", tablet: "sm:h-10", desktop: "lg:h-10" },
  "12": { mobile: "h-12", tablet: "sm:h-12", desktop: "lg:h-12" },
  "16": { mobile: "h-16", tablet: "sm:h-16", desktop: "lg:h-16" },
  "20": { mobile: "h-20", tablet: "sm:h-20", desktop: "lg:h-20" },
  "24": { mobile: "h-24", tablet: "sm:h-24", desktop: "lg:h-24" },
  "32": { mobile: "h-32", tablet: "sm:h-32", desktop: "lg:h-32" },
  "40": { mobile: "h-40", tablet: "sm:h-40", desktop: "lg:h-40" },
  "48": { mobile: "h-48", tablet: "sm:h-48", desktop: "lg:h-48" },
  "56": { mobile: "h-56", tablet: "sm:h-56", desktop: "lg:h-56" },
  "64": { mobile: "h-64", tablet: "sm:h-64", desktop: "lg:h-64" },
  // Named sizes for backward compatibility
  xs: { mobile: "h-2", tablet: "sm:h-2", desktop: "lg:h-2" },
  sm: { mobile: "h-4", tablet: "sm:h-4", desktop: "lg:h-4" },
  md: { mobile: "h-8", tablet: "sm:h-8", desktop: "lg:h-8" },
  lg: { mobile: "h-12", tablet: "sm:h-12", desktop: "lg:h-12" },
  xl: { mobile: "h-16", tablet: "sm:h-16", desktop: "lg:h-16" },
  "2xl": { mobile: "h-24", tablet: "sm:h-24", desktop: "lg:h-24" },
};

/** Spacer size → width class (horizontal spacer) */
export const spacerWidthMap: Record<
  string,
  { mobile: string; tablet: string; desktop: string }
> = {
  "0": { mobile: "w-0", tablet: "sm:w-0", desktop: "lg:w-0" },
  "1": { mobile: "w-1", tablet: "sm:w-1", desktop: "lg:w-1" },
  "2": { mobile: "w-2", tablet: "sm:w-2", desktop: "lg:w-2" },
  "3": { mobile: "w-3", tablet: "sm:w-3", desktop: "lg:w-3" },
  "4": { mobile: "w-4", tablet: "sm:w-4", desktop: "lg:w-4" },
  "5": { mobile: "w-5", tablet: "sm:w-5", desktop: "lg:w-5" },
  "6": { mobile: "w-6", tablet: "sm:w-6", desktop: "lg:w-6" },
  "8": { mobile: "w-8", tablet: "sm:w-8", desktop: "lg:w-8" },
  "10": { mobile: "w-10", tablet: "sm:w-10", desktop: "lg:w-10" },
  "12": { mobile: "w-12", tablet: "sm:w-12", desktop: "lg:w-12" },
  "16": { mobile: "w-16", tablet: "sm:w-16", desktop: "lg:w-16" },
  "20": { mobile: "w-20", tablet: "sm:w-20", desktop: "lg:w-20" },
  "24": { mobile: "w-24", tablet: "sm:w-24", desktop: "lg:w-24" },
  "32": { mobile: "w-32", tablet: "sm:w-32", desktop: "lg:w-32" },
  xs: { mobile: "w-2", tablet: "sm:w-2", desktop: "lg:w-2" },
  sm: { mobile: "w-4", tablet: "sm:w-4", desktop: "lg:w-4" },
  md: { mobile: "w-8", tablet: "sm:w-8", desktop: "lg:w-8" },
  lg: { mobile: "w-12", tablet: "sm:w-12", desktop: "lg:w-12" },
  xl: { mobile: "w-16", tablet: "sm:w-16", desktop: "lg:w-16" },
  "2xl": { mobile: "w-24", tablet: "sm:w-24", desktop: "lg:w-24" },
};

// ============================================================================
// ALIGNMENT MAPS
// ============================================================================

export const alignItemsMap: Record<string, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
};

export const justifyContentMap: Record<string, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
  evenly: "justify-evenly",
};

export const contentAlignMap: Record<string, string> = {
  left: "items-start text-left",
  center: "items-center text-center",
  right: "items-end text-right",
};

export const verticalAlignMap: Record<string, string> = {
  top: "justify-start",
  center: "justify-center",
  bottom: "justify-end",
};

// ============================================================================
// DARK BACKGROUND DETECTION
// ============================================================================

/**
 * Detect whether a background color is dark.
 * Uses perceived brightness formula (ITU-R BT.601).
 * Returns false for transparent, undefined, or non-hex colors.
 */
export function isDarkBackground(backgroundColor?: string): boolean {
  if (!backgroundColor || backgroundColor === "transparent") return false;
  if (!backgroundColor.startsWith("#")) return false;
  try {
    let hex = backgroundColor.replace(/^#/, "");
    if (hex.length === 3)
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    if (hex.length !== 6) return false;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance <= 0.45;
  } catch {
    return false;
  }
}

// ============================================================================
// OVERLAY-AWARE DARKNESS DETECTION
// ============================================================================

/**
 * Determine if a section is VISUALLY dark, accounting for:
 * 1. Explicit dark backgroundColor
 * 2. Background image (most are dark or have dark overlays)
 * 3. Overlay color and opacity
 *
 * This is the single source of truth for "should text be light?"
 * Used by all premium components to resolve brand-injected text colors.
 */
export function isEffectivelyDark(
  backgroundColor: string | undefined,
  bgImageUrl: string | undefined | null,
  backgroundOverlay?: boolean | string,
  backgroundOverlayColor?: string,
  backgroundOverlayOpacity?: number,
): boolean {
  const bgIsDark = isDarkBackground(backgroundColor);
  const hasImage = !!bgImageUrl;

  if (!hasImage) return bgIsDark;

  // Has background image — check overlay to determine visual darkness
  const overlayActive =
    typeof backgroundOverlay === "string"
      ? !!backgroundOverlay // SectionRender passes overlay as color string
      : !!backgroundOverlay;
  const overlayColor =
    typeof backgroundOverlay === "string"
      ? backgroundOverlay
      : backgroundOverlayColor || "#000000";
  // Normalize opacity: some components use 0-1 range, others use 0-100
  const rawOpacity = backgroundOverlayOpacity ?? 50;
  const overlayOpacity = rawOpacity > 0 && rawOpacity <= 1 ? rawOpacity * 100 : rawOpacity;

  if (overlayActive && overlayOpacity >= 30) {
    // Overlay has significant opacity → use overlay color for darkness
    return isDarkBackground(overlayColor);
  }

  // Image without significant overlay → assume dark (conservative safe default)
  return true;
}

/**
 * Resolve a color for a dark/light section context.
 * When the section is effectively dark and brand injection set a dark color,
 * override to white for readability. When no color is provided, returns
 * white for dark contexts or the fallback for light contexts.
 */
export function resolveContrastColor(
  color: string | undefined,
  effectivelyDark: boolean,
  fallback?: string,
): string | undefined {
  if (color) {
    if (effectivelyDark && isDarkBackground(color)) return "#ffffff";
    return color;
  }
  return effectivelyDark ? "#ffffff" : fallback;
}

// ============================================================================
// DARK-AWARE SHADOW SYSTEM (Section 12.3)
// ============================================================================

/**
 * Returns dark-aware box-shadow CSS value.
 * On dark backgrounds: subtle glow effect (white glow).
 * On light backgrounds: returns empty string → use Tailwind shadow classes instead.
 */
export function resolveShadow(
  shadow: "none" | "sm" | "md" | "lg" | "xl" | "2xl",
  isDarkBg: boolean,
): string {
  if (shadow === "none") return "";

  if (isDarkBg) {
    const glowMap: Record<string, string> = {
      sm: "0 0 8px rgba(255,255,255,0.04), 0 1px 2px rgba(255,255,255,0.02)",
      md: "0 0 15px rgba(255,255,255,0.05), 0 2px 4px rgba(255,255,255,0.03)",
      lg: "0 0 25px rgba(255,255,255,0.06), 0 4px 8px rgba(255,255,255,0.04)",
      xl: "0 0 35px rgba(255,255,255,0.07), 0 8px 16px rgba(255,255,255,0.05)",
      "2xl":
        "0 0 50px rgba(255,255,255,0.08), 0 16px 32px rgba(255,255,255,0.06)",
    };
    return glowMap[shadow] || "";
  }

  // On light backgrounds, use Tailwind classes (shadow-sm, etc.) not inline style
  return "";
}

// ============================================================================
// DARK-AWARE GLASSMORPHISM (Section 12.4)
// ============================================================================

/**
 * Returns dark-aware glassmorphism CSS properties.
 */
export function resolveGlassmorphism(isDarkBg: boolean): {
  background: string;
  backdropFilter: string;
  WebkitBackdropFilter: string;
  border: string;
} {
  if (isDarkBg) {
    return {
      background: "rgba(255, 255, 255, 0.05)",
      backdropFilter: "blur(16px) saturate(150%)",
      WebkitBackdropFilter: "blur(16px) saturate(150%)",
      border: "1px solid rgba(255, 255, 255, 0.08)",
    };
  }
  return {
    background: "rgba(255, 255, 255, 0.7)",
    backdropFilter: "blur(12px) saturate(180%)",
    WebkitBackdropFilter: "blur(12px) saturate(180%)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
  };
}

// ============================================================================
// DARK-AWARE DEFAULTS
// ============================================================================

/**
 * Returns adaptive default colors based on background darkness.
 */
export function getDarkAwareDefaults(isDarkBg: boolean) {
  return {
    borderColor: isDarkBg ? "rgba(255,255,255,0.1)" : "#e5e7eb",
    textColor: isDarkBg ? "#f8fafc" : "#0f172a",
    mutedTextColor: isDarkBg ? "#9ca3af" : "#6b7280",
    dividerColor: isDarkBg ? "rgba(255,255,255,0.15)" : "#e5e7eb",
    overlayBg: isDarkBg ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.5)",
    particleColor: isDarkBg ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)",
    patternColor: isDarkBg ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
    glowOpacity: isDarkBg ? 0.25 : 0.1,
  };
}

// ============================================================================
// VISIBILITY CLASSES
// ============================================================================

/**
 * Generates visibility classes from hide-on-breakpoint props.
 */
export function getVisibilityClasses(props: {
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  hideOnDesktop?: boolean;
}): string {
  const classes: string[] = [];
  if (props.hideOnMobile) classes.push("hidden sm:block");
  if (props.hideOnTablet) classes.push("sm:hidden lg:block");
  if (props.hideOnDesktop) classes.push("lg:hidden");
  return classes.join(" ");
}

// ============================================================================
// SHAPE DIVIDER SVG PATHS
// ============================================================================

export const shapeDividerPaths: Record<string, string> = {
  wave: "M0,64 C320,128 640,0 960,64 C1280,128 1600,0 1920,64 L1920,0 L0,0 Z",
  "wave-smooth":
    "M0,48 C480,128 960,0 1440,80 C1680,112 1920,48 1920,48 L1920,0 L0,0 Z",
  curve: "M0,96 Q960,192 1920,96 L1920,0 L0,0 Z",
  triangle: "M960,128 L1920,0 L0,0 Z",
  tilt: "M0,128 L1920,0 L1920,0 L0,0 Z",
  arrow: "M960,128 L1920,0 L1920,0 L0,0 L960,128 Z",
  zigzag:
    "M0,64 L120,0 L240,64 L360,0 L480,64 L600,0 L720,64 L840,0 L960,64 L1080,0 L1200,64 L1320,0 L1440,64 L1560,0 L1680,64 L1800,0 L1920,64 L1920,0 L0,0 Z",
  clouds:
    "M0,64 C160,128 320,0 480,64 C640,128 800,32 960,64 C1120,96 1280,0 1440,64 C1600,128 1760,32 1920,64 L1920,0 L0,0 Z",
  mountains:
    "M0,128 L320,32 L480,96 L640,16 L800,80 L960,0 L1120,64 L1280,24 L1440,96 L1600,48 L1760,80 L1920,16 L1920,0 L0,0 Z",
  drops:
    "M0,0 C80,64 160,64 240,0 C320,64 400,64 480,0 C560,64 640,64 720,0 C800,64 880,64 960,0 C1040,64 1120,64 1200,0 C1280,64 1360,64 1440,0 C1520,64 1600,64 1680,0 C1760,64 1840,64 1920,0 L1920,0 L0,0 Z",
  pyramids:
    "M0,128 L160,0 L320,128 L480,0 L640,128 L800,0 L960,128 L1120,0 L1280,128 L1440,0 L1600,128 L1760,0 L1920,128 L1920,0 L0,0 Z",
};

// ============================================================================
// GRADIENT BUILDER
// ============================================================================

export interface GradientConfig {
  type: "linear" | "radial" | "conic";
  angle?: number;
  stops: Array<{ color: string; position: number }>;
}

/**
 * Builds a CSS gradient string from a GradientConfig.
 */
export function buildGradientCSS(gradient: GradientConfig): string {
  if (!gradient?.stops?.length) return "";
  const stops = gradient.stops
    .map((s) => `${s.color} ${s.position}%`)
    .join(", ");

  switch (gradient.type) {
    case "linear":
      return `linear-gradient(${gradient.angle ?? 180}deg, ${stops})`;
    case "radial":
      return `radial-gradient(circle, ${stops})`;
    case "conic":
      return `conic-gradient(from ${gradient.angle ?? 0}deg, ${stops})`;
    default:
      return `linear-gradient(180deg, ${stops})`;
  }
}

// ============================================================================
// ASPECT RATIO MAP
// ============================================================================

export const aspectRatioMap: Record<string, string> = {
  auto: "aspect-auto",
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[3/4]",
  wide: "aspect-[21/9]",
};

// ============================================================================
// SCROLL SNAP ALIGNMENT MAP
// ============================================================================

export const scrollSnapMap: Record<string, string> = {
  none: "",
  start: "snap-start",
  center: "snap-center",
  end: "snap-end",
};

// ============================================================================
// POSITION MAP
// ============================================================================

export const positionMap: Record<string, string> = {
  static: "static",
  relative: "relative",
  sticky: "sticky",
  fixed: "fixed",
  absolute: "absolute",
};

// ============================================================================
// PHASE 2: NEW COMPONENT UTILITY MAPS
// ============================================================================

// --- Flex Direction Map (responsive) ---
export const flexDirectionMap: Record<string, ClassMapValue> = {
  row: { mobile: "flex-row", tablet: "sm:flex-row", desktop: "lg:flex-row" },
  column: { mobile: "flex-col", tablet: "sm:flex-col", desktop: "lg:flex-col" },
  "row-reverse": {
    mobile: "flex-row-reverse",
    tablet: "sm:flex-row-reverse",
    desktop: "lg:flex-row-reverse",
  },
  "column-reverse": {
    mobile: "flex-col-reverse",
    tablet: "sm:flex-col-reverse",
    desktop: "lg:flex-col-reverse",
  },
  // Stack aliases
  vertical: {
    mobile: "flex-col",
    tablet: "sm:flex-col",
    desktop: "lg:flex-col",
  },
  horizontal: {
    mobile: "flex-row",
    tablet: "sm:flex-row",
    desktop: "lg:flex-row",
  },
};

// --- Flex Wrap Map (responsive) ---
export const flexWrapMap: Record<string, ClassMapValue> = {
  nowrap: {
    mobile: "flex-nowrap",
    tablet: "sm:flex-nowrap",
    desktop: "lg:flex-nowrap",
  },
  wrap: {
    mobile: "flex-wrap",
    tablet: "sm:flex-wrap",
    desktop: "lg:flex-wrap",
  },
  "wrap-reverse": {
    mobile: "flex-wrap-reverse",
    tablet: "sm:flex-wrap-reverse",
    desktop: "lg:flex-wrap-reverse",
  },
};

// --- Align Content Map (responsive) ---
export const alignContentMap: Record<string, ClassMapValue> = {
  start: {
    mobile: "content-start",
    tablet: "sm:content-start",
    desktop: "lg:content-start",
  },
  center: {
    mobile: "content-center",
    tablet: "sm:content-center",
    desktop: "lg:content-center",
  },
  end: {
    mobile: "content-end",
    tablet: "sm:content-end",
    desktop: "lg:content-end",
  },
  between: {
    mobile: "content-between",
    tablet: "sm:content-between",
    desktop: "lg:content-between",
  },
  around: {
    mobile: "content-around",
    tablet: "sm:content-around",
    desktop: "lg:content-around",
  },
  stretch: {
    mobile: "content-stretch",
    tablet: "sm:content-stretch",
    desktop: "lg:content-stretch",
  },
  evenly: {
    mobile: "content-evenly",
    tablet: "sm:content-evenly",
    desktop: "lg:content-evenly",
  },
};

// --- Justify Items Map (responsive) ---
export const justifyItemsMap: Record<string, ClassMapValue> = {
  start: {
    mobile: "justify-items-start",
    tablet: "sm:justify-items-start",
    desktop: "lg:justify-items-start",
  },
  center: {
    mobile: "justify-items-center",
    tablet: "sm:justify-items-center",
    desktop: "lg:justify-items-center",
  },
  end: {
    mobile: "justify-items-end",
    tablet: "sm:justify-items-end",
    desktop: "lg:justify-items-end",
  },
  stretch: {
    mobile: "justify-items-stretch",
    tablet: "sm:justify-items-stretch",
    desktop: "lg:justify-items-stretch",
  },
};

// --- Place Items Map (responsive) ---
export const placeItemsMap: Record<string, ClassMapValue> = {
  start: {
    mobile: "place-items-start",
    tablet: "sm:place-items-start",
    desktop: "lg:place-items-start",
  },
  center: {
    mobile: "place-items-center",
    tablet: "sm:place-items-center",
    desktop: "lg:place-items-center",
  },
  end: {
    mobile: "place-items-end",
    tablet: "sm:place-items-end",
    desktop: "lg:place-items-end",
  },
  stretch: {
    mobile: "place-items-stretch",
    tablet: "sm:place-items-stretch",
    desktop: "lg:place-items-stretch",
  },
};

// --- Display Map (responsive) ---
export const displayMap: Record<string, ClassMapValue> = {
  block: { mobile: "block", tablet: "sm:block", desktop: "lg:block" },
  flex: { mobile: "flex", tablet: "sm:flex", desktop: "lg:flex" },
  grid: { mobile: "grid", tablet: "sm:grid", desktop: "lg:grid" },
  inline: { mobile: "inline", tablet: "sm:inline", desktop: "lg:inline" },
  "inline-flex": {
    mobile: "inline-flex",
    tablet: "sm:inline-flex",
    desktop: "lg:inline-flex",
  },
  "inline-grid": {
    mobile: "inline-grid",
    tablet: "sm:inline-grid",
    desktop: "lg:inline-grid",
  },
  contents: {
    mobile: "contents",
    tablet: "sm:contents",
    desktop: "lg:contents",
  },
  none: { mobile: "hidden", tablet: "sm:hidden", desktop: "lg:hidden" },
};

// --- Text Align Map (responsive) ---
export const textAlignMap: Record<string, ClassMapValue> = {
  left: {
    mobile: "text-left",
    tablet: "sm:text-left",
    desktop: "lg:text-left",
  },
  center: {
    mobile: "text-center",
    tablet: "sm:text-center",
    desktop: "lg:text-center",
  },
  right: {
    mobile: "text-right",
    tablet: "sm:text-right",
    desktop: "lg:text-right",
  },
};

// --- Width Map (responsive) ---
export const widthMap: Record<string, ClassMapValue> = {
  auto: { mobile: "w-auto", tablet: "sm:w-auto", desktop: "lg:w-auto" },
  full: { mobile: "w-full", tablet: "sm:w-full", desktop: "lg:w-full" },
  fit: { mobile: "w-fit", tablet: "sm:w-fit", desktop: "lg:w-fit" },
  min: { mobile: "w-min", tablet: "sm:w-min", desktop: "lg:w-min" },
  max: { mobile: "w-max", tablet: "sm:w-max", desktop: "lg:w-max" },
};

// --- Height Map (responsive) ---
export const heightMap: Record<string, ClassMapValue> = {
  auto: { mobile: "h-auto", tablet: "sm:h-auto", desktop: "lg:h-auto" },
  full: { mobile: "h-full", tablet: "sm:h-full", desktop: "lg:h-full" },
  screen: { mobile: "h-screen", tablet: "sm:h-screen", desktop: "lg:h-screen" },
  fit: { mobile: "h-fit", tablet: "sm:h-fit", desktop: "lg:h-fit" },
  min: { mobile: "h-min", tablet: "sm:h-min", desktop: "lg:h-min" },
  max: { mobile: "h-max", tablet: "sm:h-max", desktop: "lg:h-max" },
};

// --- Aspect Ratio Box Map (ratio format: "1:1", "16:9", etc.) ---
export const aspectRatioBoxMap: Record<string, string> = {
  "1:1": "aspect-square",
  "16:9": "aspect-video",
  "4:3": "aspect-4/3",
  "3:2": "aspect-3/2",
  "21:9": "aspect-21/9",
  "2:3": "aspect-2/3",
  "3:4": "aspect-3/4",
  "9:16": "aspect-9/16",
};

/**
 * Parse an aspect ratio string like "4:3" to CSS aspect-ratio value "4/3".
 * Returns undefined if the string is not a valid ratio.
 */
export function parseAspectRatio(ratio: string): string | undefined {
  const match = ratio.match(/^(\d+):(\d+)$/);
  if (!match) return undefined;
  return `${match[1]}/${match[2]}`;
}

// --- Object Fit Map ---
export const objectFitMap: Record<string, string> = {
  cover: "object-cover",
  contain: "object-contain",
  fill: "object-fill",
  none: "object-none",
  "scale-down": "object-scale-down",
};

// --- Backdrop Blur Map ---
export const backdropBlurMap: Record<string, string> = {
  none: "",
  sm: "backdrop-blur-sm",
  md: "backdrop-blur-md",
  lg: "backdrop-blur-lg",
  xl: "backdrop-blur-xl",
};

// --- Margin Map (responsive) ---
export const marginMap: Record<string, ClassMapValue> = {
  auto: { mobile: "m-auto", tablet: "sm:m-auto", desktop: "lg:m-auto" },
  "0": { mobile: "m-0", tablet: "sm:m-0", desktop: "lg:m-0" },
  "1": { mobile: "m-1", tablet: "sm:m-1", desktop: "lg:m-1" },
  "2": { mobile: "m-2", tablet: "sm:m-2", desktop: "lg:m-2" },
  "3": { mobile: "m-3", tablet: "sm:m-3", desktop: "lg:m-3" },
  "4": { mobile: "m-4", tablet: "sm:m-4", desktop: "lg:m-4" },
  "5": { mobile: "m-5", tablet: "sm:m-5", desktop: "lg:m-5" },
  "6": { mobile: "m-6", tablet: "sm:m-6", desktop: "lg:m-6" },
  "8": { mobile: "m-8", tablet: "sm:m-8", desktop: "lg:m-8" },
  "10": { mobile: "m-10", tablet: "sm:m-10", desktop: "lg:m-10" },
  "12": { mobile: "m-12", tablet: "sm:m-12", desktop: "lg:m-12" },
  "16": { mobile: "m-16", tablet: "sm:m-16", desktop: "lg:m-16" },
  "20": { mobile: "m-20", tablet: "sm:m-20", desktop: "lg:m-20" },
  "24": { mobile: "m-24", tablet: "sm:m-24", desktop: "lg:m-24" },
};

// --- Align Self Map (responsive) ---
export const alignSelfMap: Record<string, ClassMapValue> = {
  start: {
    mobile: "self-start",
    tablet: "sm:self-start",
    desktop: "lg:self-start",
  },
  center: {
    mobile: "self-center",
    tablet: "sm:self-center",
    desktop: "lg:self-center",
  },
  end: { mobile: "self-end", tablet: "sm:self-end", desktop: "lg:self-end" },
  stretch: {
    mobile: "self-stretch",
    tablet: "sm:self-stretch",
    desktop: "lg:self-stretch",
  },
  baseline: {
    mobile: "self-baseline",
    tablet: "sm:self-baseline",
    desktop: "lg:self-baseline",
  },
};

// --- Justify Self Map (responsive) ---
export const justifySelfMap: Record<string, ClassMapValue> = {
  start: {
    mobile: "justify-self-start",
    tablet: "sm:justify-self-start",
    desktop: "lg:justify-self-start",
  },
  center: {
    mobile: "justify-self-center",
    tablet: "sm:justify-self-center",
    desktop: "lg:justify-self-center",
  },
  end: {
    mobile: "justify-self-end",
    tablet: "sm:justify-self-end",
    desktop: "lg:justify-self-end",
  },
  stretch: {
    mobile: "justify-self-stretch",
    tablet: "sm:justify-self-stretch",
    desktop: "lg:justify-self-stretch",
  },
};

// --- Grid Auto Flow Map ---
export const gridAutoFlowMap: Record<string, string> = {
  row: "grid-flow-row",
  column: "grid-flow-col",
  dense: "grid-flow-dense",
  "row dense": "grid-flow-row-dense",
  "column dense": "grid-flow-col-dense",
};

// --- Col/Row Span Maps ---
export const colSpanMap: Record<number | string, string> = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
  5: "col-span-5",
  6: "col-span-6",
  7: "col-span-7",
  8: "col-span-8",
  9: "col-span-9",
  10: "col-span-10",
  11: "col-span-11",
  12: "col-span-12",
  full: "col-span-full",
};

export const rowSpanMap: Record<number | string, string> = {
  1: "row-span-1",
  2: "row-span-2",
  3: "row-span-3",
  4: "row-span-4",
  5: "row-span-5",
  6: "row-span-6",
  full: "row-span-full",
};

// --- Row Gap / Column Gap Maps (responsive) ---
export const rowGapMap: Record<string, ClassMapValue> = {
  "0": { mobile: "gap-y-0", tablet: "sm:gap-y-0", desktop: "lg:gap-y-0" },
  "1": { mobile: "gap-y-1", tablet: "sm:gap-y-1", desktop: "lg:gap-y-1" },
  "2": { mobile: "gap-y-2", tablet: "sm:gap-y-2", desktop: "lg:gap-y-2" },
  "3": { mobile: "gap-y-3", tablet: "sm:gap-y-3", desktop: "lg:gap-y-3" },
  "4": { mobile: "gap-y-4", tablet: "sm:gap-y-4", desktop: "lg:gap-y-4" },
  "5": { mobile: "gap-y-5", tablet: "sm:gap-y-5", desktop: "lg:gap-y-5" },
  "6": { mobile: "gap-y-6", tablet: "sm:gap-y-6", desktop: "lg:gap-y-6" },
  "8": { mobile: "gap-y-8", tablet: "sm:gap-y-8", desktop: "lg:gap-y-8" },
  "10": { mobile: "gap-y-10", tablet: "sm:gap-y-10", desktop: "lg:gap-y-10" },
  "12": { mobile: "gap-y-12", tablet: "sm:gap-y-12", desktop: "lg:gap-y-12" },
  "16": { mobile: "gap-y-16", tablet: "sm:gap-y-16", desktop: "lg:gap-y-16" },
  "20": { mobile: "gap-y-20", tablet: "sm:gap-y-20", desktop: "lg:gap-y-20" },
  "24": { mobile: "gap-y-24", tablet: "sm:gap-y-24", desktop: "lg:gap-y-24" },
};

export const columnGapMap: Record<string, ClassMapValue> = {
  "0": { mobile: "gap-x-0", tablet: "sm:gap-x-0", desktop: "lg:gap-x-0" },
  "1": { mobile: "gap-x-1", tablet: "sm:gap-x-1", desktop: "lg:gap-x-1" },
  "2": { mobile: "gap-x-2", tablet: "sm:gap-x-2", desktop: "lg:gap-x-2" },
  "3": { mobile: "gap-x-3", tablet: "sm:gap-x-3", desktop: "lg:gap-x-3" },
  "4": { mobile: "gap-x-4", tablet: "sm:gap-x-4", desktop: "lg:gap-x-4" },
  "5": { mobile: "gap-x-5", tablet: "sm:gap-x-5", desktop: "lg:gap-x-5" },
  "6": { mobile: "gap-x-6", tablet: "sm:gap-x-6", desktop: "lg:gap-x-6" },
  "8": { mobile: "gap-x-8", tablet: "sm:gap-x-8", desktop: "lg:gap-x-8" },
  "10": { mobile: "gap-x-10", tablet: "sm:gap-x-10", desktop: "lg:gap-x-10" },
  "12": { mobile: "gap-x-12", tablet: "sm:gap-x-12", desktop: "lg:gap-x-12" },
  "16": { mobile: "gap-x-16", tablet: "sm:gap-x-16", desktop: "lg:gap-x-16" },
  "20": { mobile: "gap-x-20", tablet: "sm:gap-x-20", desktop: "lg:gap-x-20" },
  "24": { mobile: "gap-x-24", tablet: "sm:gap-x-24", desktop: "lg:gap-x-24" },
};

// --- Overlay Position Map ---
export const overlayPositionMap: Record<string, string> = {
  fill: "absolute inset-0",
  top: "absolute top-0 left-0 right-0",
  bottom: "absolute bottom-0 left-0 right-0",
  left: "absolute top-0 left-0 bottom-0",
  right: "absolute top-0 right-0 bottom-0",
  center: "absolute inset-0 flex items-center justify-center",
  "top-left": "absolute top-0 left-0",
  "top-right": "absolute top-0 right-0",
  "bottom-left": "absolute bottom-0 left-0",
  "bottom-right": "absolute bottom-0 right-0",
};

// --- Grid Preset Templates ---
export const gridPresetMap: Record<string, { columns: string; rows?: string }> =
  {
    dashboard: { columns: "repeat(4, 1fr)", rows: "auto" },
    blog: { columns: "2fr 1fr" },
    gallery: { columns: "repeat(3, 1fr)" },
    portfolio: { columns: "repeat(auto-fill, minmax(280px, 1fr))" },
    split: { columns: "1fr 1fr" },
    "feature-grid": { columns: "repeat(3, 1fr)" },
    pricing: { columns: "repeat(3, 1fr)" },
  };

// ============================================================================
// PHASE 3: ADVANCED EXPERIENCES UTILITY MAPS
// ============================================================================

// --- Entrance Animation Presets ---
// Maps animation type to { initial, animate } CSS property objects
export interface AnimationKeyframe {
  opacity?: number;
  transform?: string;
  filter?: string;
  clipPath?: string;
}

export const entranceAnimationPresets: Record<
  string,
  { initial: AnimationKeyframe; animate: AnimationKeyframe }
> = {
  none: { initial: {}, animate: {} },
  fade: { initial: { opacity: 0 }, animate: { opacity: 1 } },
  "fade-up": {
    initial: { opacity: 0, transform: "translateY(40px)" },
    animate: { opacity: 1, transform: "translateY(0)" },
  },
  "fade-down": {
    initial: { opacity: 0, transform: "translateY(-40px)" },
    animate: { opacity: 1, transform: "translateY(0)" },
  },
  "fade-left": {
    initial: { opacity: 0, transform: "translateX(40px)" },
    animate: { opacity: 1, transform: "translateX(0)" },
  },
  "fade-right": {
    initial: { opacity: 0, transform: "translateX(-40px)" },
    animate: { opacity: 1, transform: "translateX(0)" },
  },
  "slide-up": {
    initial: { opacity: 0, transform: "translateY(80px)" },
    animate: { opacity: 1, transform: "translateY(0)" },
  },
  "slide-down": {
    initial: { opacity: 0, transform: "translateY(-80px)" },
    animate: { opacity: 1, transform: "translateY(0)" },
  },
  "slide-left": {
    initial: { opacity: 0, transform: "translateX(80px)" },
    animate: { opacity: 1, transform: "translateX(0)" },
  },
  "slide-right": {
    initial: { opacity: 0, transform: "translateX(-80px)" },
    animate: { opacity: 1, transform: "translateX(0)" },
  },
  "scale-up": {
    initial: { opacity: 0, transform: "scale(0.8)" },
    animate: { opacity: 1, transform: "scale(1)" },
  },
  "scale-down": {
    initial: { opacity: 0, transform: "scale(1.2)" },
    animate: { opacity: 1, transform: "scale(1)" },
  },
  "rotate-in": {
    initial: { opacity: 0, transform: "rotate(-180deg) scale(0.5)" },
    animate: { opacity: 1, transform: "rotate(0) scale(1)" },
  },
  "flip-x": {
    initial: { opacity: 0, transform: "perspective(1000px) rotateX(-90deg)" },
    animate: { opacity: 1, transform: "perspective(1000px) rotateX(0)" },
  },
  "flip-y": {
    initial: { opacity: 0, transform: "perspective(1000px) rotateY(90deg)" },
    animate: { opacity: 1, transform: "perspective(1000px) rotateY(0)" },
  },
  bounce: {
    initial: { opacity: 0, transform: "scale(0.3)" },
    animate: { opacity: 1, transform: "scale(1)" },
  },
  elastic: {
    initial: { opacity: 0, transform: "scale(0.5)" },
    animate: { opacity: 1, transform: "scale(1)" },
  },
  "clip-top": {
    initial: { clipPath: "inset(0 0 100% 0)" },
    animate: { clipPath: "inset(0 0 0 0)" },
  },
  "clip-bottom": {
    initial: { clipPath: "inset(100% 0 0 0)" },
    animate: { clipPath: "inset(0 0 0 0)" },
  },
  "clip-left": {
    initial: { clipPath: "inset(0 100% 0 0)" },
    animate: { clipPath: "inset(0 0 0 0)" },
  },
  "clip-right": {
    initial: { clipPath: "inset(0 0 0 100%)" },
    animate: { clipPath: "inset(0 0 0 0)" },
  },
  "blur-in": {
    initial: { opacity: 0, filter: "blur(20px)" },
    animate: { opacity: 1, filter: "blur(0px)" },
  },
};

// --- Loop Animation CSS Keyframes ---
// Maps loop type to CSS animation class name (using Tailwind where possible)
export const loopAnimationMap: Record<string, string> = {
  none: "",
  pulse: "animate-pulse",
  bounce: "animate-bounce",
  spin: "animate-spin",
  ping: "animate-ping",
};

// For custom loops not in Tailwind, we use inline keyframes
export const customLoopKeyframes: Record<
  string,
  { keyframes: string; defaultDuration: number }
> = {
  float: {
    keyframes:
      "0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}",
    defaultDuration: 3000,
  },
  shimmer: {
    keyframes:
      "0%{background-position:-200% 0}100%{background-position:200% 0}",
    defaultDuration: 2000,
  },
  breathe: {
    keyframes: "0%,100%{transform:scale(1)}50%{transform:scale(1.05)}",
    defaultDuration: 4000,
  },
  wiggle: {
    keyframes:
      "0%,100%{transform:rotate(0)}25%{transform:rotate(-3deg)}75%{transform:rotate(3deg)}",
    defaultDuration: 1000,
  },
  swing: {
    keyframes:
      "0%,100%{transform:rotate(0)}20%{transform:rotate(15deg)}40%{transform:rotate(-10deg)}60%{transform:rotate(5deg)}80%{transform:rotate(-5deg)}",
    defaultDuration: 2000,
  },
};

// --- Easing Presets ---
export const easingMap: Record<string, string> = {
  ease: "ease",
  "ease-in": "ease-in",
  "ease-out": "ease-out",
  "ease-in-out": "ease-in-out",
  spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
};

// --- Sticky Width Map (for StickyContainer) ---
export const stickyWidthMap: Record<
  string,
  { mobile: string; tablet: string; desktop: string }
> = {
  "1/3": { mobile: "w-full", tablet: "sm:w-1/3", desktop: "lg:w-1/3" },
  "2/5": { mobile: "w-full", tablet: "sm:w-2/5", desktop: "lg:w-2/5" },
  "1/2": { mobile: "w-full", tablet: "sm:w-1/2", desktop: "lg:w-1/2" },
  "3/5": { mobile: "w-full", tablet: "sm:w-3/5", desktop: "lg:w-3/5" },
  "2/3": { mobile: "w-full", tablet: "sm:w-2/3", desktop: "lg:w-2/3" },
};

// --- Scroll Snap Type Map ---
export const scrollSnapTypeMap: Record<string, string> = {
  mandatory: "snap-mandatory",
  proximity: "snap-proximity",
  none: "",
};

// --- Scroll Section Direction Map ---
export const scrollDirectionMap: Record<
  string,
  { snap: string; child: string }
> = {
  vertical: { snap: "snap-y", child: "min-h-screen" },
  horizontal: { snap: "snap-x", child: "min-w-screen" },
};
