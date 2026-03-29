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
  | { mobile: string; tablet: string; desktop: string }
  | [string, string, string];

export type SpacingScale =
  | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "8" | "10" | "12"
  | "16" | "20" | "24" | "32" | "40" | "48" | "56" | "64" | "72" | "80" | "96";

export type RadiusScale = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";

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
export const paddingYMap: Record<string, { mobile: string; tablet: string; desktop: string }> = {
  none: { mobile: "py-0", tablet: "sm:py-0", desktop: "lg:py-0" },
  xs: { mobile: "py-2", tablet: "sm:py-3", desktop: "lg:py-4" },
  sm: { mobile: "py-4", tablet: "sm:py-6", desktop: "lg:py-8" },
  md: { mobile: "py-8", tablet: "sm:py-12", desktop: "lg:py-16" },
  lg: { mobile: "py-12", tablet: "sm:py-16", desktop: "lg:py-24" },
  xl: { mobile: "py-16", tablet: "sm:py-24", desktop: "lg:py-32" },
};

/** Horizontal padding: px-* / sm:px-* / lg:px-* */
export const paddingXMap: Record<string, { mobile: string; tablet: string; desktop: string }> = {
  none: { mobile: "px-0", tablet: "sm:px-0", desktop: "lg:px-0" },
  xs: { mobile: "px-2", tablet: "sm:px-3", desktop: "lg:px-4" },
  sm: { mobile: "px-4", tablet: "sm:px-6", desktop: "lg:px-8" },
  md: { mobile: "px-4", tablet: "sm:px-8", desktop: "lg:px-12" },
  lg: { mobile: "px-6", tablet: "sm:px-10", desktop: "lg:px-16" },
};

/** All-around padding: p-* / sm:p-* / lg:p-* */
export const paddingMap: Record<string, { mobile: string; tablet: string; desktop: string }> = {
  none: { mobile: "p-0", tablet: "sm:p-0", desktop: "lg:p-0" },
  xs: { mobile: "p-2", tablet: "sm:p-3", desktop: "lg:p-4" },
  sm: { mobile: "p-3", tablet: "sm:p-4", desktop: "lg:p-5" },
  md: { mobile: "p-4", tablet: "sm:p-6", desktop: "lg:p-8" },
  lg: { mobile: "p-6", tablet: "sm:p-8", desktop: "lg:p-10" },
  xl: { mobile: "p-8", tablet: "sm:p-10", desktop: "lg:p-12" },
};

/** Gap: gap-* / sm:gap-* / lg:gap-* */
export const gapMap: Record<string, { mobile: string; tablet: string; desktop: string }> = {
  none: { mobile: "gap-0", tablet: "sm:gap-0", desktop: "lg:gap-0" },
  xs: { mobile: "gap-1", tablet: "sm:gap-2", desktop: "lg:gap-2" },
  sm: { mobile: "gap-2", tablet: "sm:gap-3", desktop: "lg:gap-4" },
  md: { mobile: "gap-4", tablet: "sm:gap-6", desktop: "lg:gap-8" },
  lg: { mobile: "gap-6", tablet: "sm:gap-8", desktop: "lg:gap-12" },
  xl: { mobile: "gap-8", tablet: "sm:gap-12", desktop: "lg:gap-16" },
};

/** Vertical margin: my-* / sm:my-* / lg:my-* */
export const marginYMap: Record<string, { mobile: string; tablet: string; desktop: string }> = {
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
  1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3",
  4: "grid-cols-4", 5: "grid-cols-5", 6: "grid-cols-6",
  7: "grid-cols-7", 8: "grid-cols-8", 9: "grid-cols-9",
  10: "grid-cols-10", 11: "grid-cols-11", 12: "grid-cols-12",
};

/** sm: prefixed grid columns */
export const smGridColsMap: Record<number, string> = {
  1: "sm:grid-cols-1", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3",
  4: "sm:grid-cols-4", 5: "sm:grid-cols-5", 6: "sm:grid-cols-6",
  7: "sm:grid-cols-7", 8: "sm:grid-cols-8", 9: "sm:grid-cols-9",
  10: "sm:grid-cols-10", 11: "sm:grid-cols-11", 12: "sm:grid-cols-12",
};

/** lg: prefixed grid columns */
export const lgGridColsMap: Record<number, string> = {
  1: "lg:grid-cols-1", 2: "lg:grid-cols-2", 3: "lg:grid-cols-3",
  4: "lg:grid-cols-4", 5: "lg:grid-cols-5", 6: "lg:grid-cols-6",
  7: "lg:grid-cols-7", 8: "lg:grid-cols-8", 9: "lg:grid-cols-9",
  10: "lg:grid-cols-10", 11: "lg:grid-cols-11", 12: "lg:grid-cols-12",
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
export const borderRadiusMap: Record<string, { mobile: string; tablet: string; desktop: string }> = {
  none: { mobile: "rounded-none", tablet: "sm:rounded-none", desktop: "lg:rounded-none" },
  sm: { mobile: "rounded-sm", tablet: "sm:rounded-sm", desktop: "lg:rounded-sm" },
  md: { mobile: "rounded-md", tablet: "sm:rounded-md", desktop: "lg:rounded-md" },
  lg: { mobile: "rounded-lg", tablet: "sm:rounded-lg", desktop: "lg:rounded-lg" },
  xl: { mobile: "rounded-xl", tablet: "sm:rounded-xl", desktop: "lg:rounded-xl" },
  "2xl": { mobile: "rounded-2xl", tablet: "sm:rounded-2xl", desktop: "lg:rounded-2xl" },
  "3xl": { mobile: "rounded-3xl", tablet: "sm:rounded-3xl", desktop: "lg:rounded-3xl" },
  full: { mobile: "rounded-full", tablet: "sm:rounded-full", desktop: "lg:rounded-full" },
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
export const spacerHeightMap: Record<string, { mobile: string; tablet: string; desktop: string }> = {
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
export const spacerWidthMap: Record<string, { mobile: string; tablet: string; desktop: string }> = {
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
    if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
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
      "2xl": "0 0 50px rgba(255,255,255,0.08), 0 16px 32px rgba(255,255,255,0.06)",
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
  curve: "M0,96 Q960,192 1920,96 L1920,0 L0,0 Z",
  triangle: "M960,128 L1920,0 L0,0 Z",
  tilt: "M0,128 L1920,0 L1920,0 L0,0 Z",
  arrow: "M960,128 L1920,0 L1920,0 L0,0 L960,128 Z",
  zigzag: "M0,64 L120,0 L240,64 L360,0 L480,64 L600,0 L720,64 L840,0 L960,64 L1080,0 L1200,64 L1320,0 L1440,64 L1560,0 L1680,64 L1800,0 L1920,64 L1920,0 L0,0 Z",
  clouds: "M0,64 C160,128 320,0 480,64 C640,128 800,32 960,64 C1120,96 1280,0 1440,64 C1600,128 1760,32 1920,64 L1920,0 L0,0 Z",
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
  const stops = gradient.stops
    .map(s => `${s.color} ${s.position}%`)
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
