/**
 * DRAMAC Studio Component Renders - Premium Mobile-First Components
 *
 * PART 1: Layout, Typography, Buttons, and Core Media Components
 *
 * All components are:
 * - Mobile-first responsive (base styles for mobile, scale up)
 * - Fully customizable with extensive props
 * - Accessible (ARIA, semantic HTML)
 * - Performance optimized
 *
 * @version 2.0.0
 * @phase STUDIO-27 - Platform Integration
 */

import React from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Download,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Plus,
  Minus,
  X,
  Search,
  ShoppingCart,
  Heart,
  Share2,
  Mail,
  Phone,
  Calendar,
  Play,
  Send,
  Star,
  AlertCircle,
  Info,
  CheckCircle2,
  Clock,
  Zap,
} from "lucide-react";
import {
  getImageUrl,
  getImageAlt,
  type ImageValue,
} from "@/lib/studio/utils/image-helpers";
import {
  getResponsiveClasses as getResponsiveClassesUtil,
  gridColsMap,
  smGridColsMap,
  lgGridColsMap,
  alignItemsMap as alignItemsLookup,
  paddingMap as paddingMapUtil,
  paddingYMap as paddingYMapUtil,
  paddingXMap as paddingXMapUtil,
  gapMap as gapMapUtil,
  marginYMap as marginYMapUtil,
  borderRadiusMap as borderRadiusMapUtil,
  shadowMap as shadowMapUtil,
  hoverShadowMap as hoverShadowMapUtil,
  overflowMap as overflowMapUtil,
  widthFractionMap,
  spacerHeightMap,
  spacerWidthMap,
  maxWidthMap as maxWidthMapUtil,
  isDarkBackground,
  isEffectivelyDark,
  resolveContrastColor,
  resolveShadow,
  resolveGlassmorphism,
  getDarkAwareDefaults,
  getVisibilityClasses,
  buildGradientCSS,
  shapeDividerPaths,
  scrollSnapMap,
  verticalAlignMap,
  contentAlignMap,
  aspectRatioMap,
  flexDirectionMap,
  flexWrapMap,
  alignContentMap as alignContentMapUtil,
  justifyItemsMap,
  placeItemsMap,
  displayMap,
  textAlignMap,
  widthMap,
  heightMap,
  aspectRatioBoxMap,
  parseAspectRatio,
  objectFitMap,
  backdropBlurMap,
  marginMap,
  alignSelfMap,
  justifySelfMap,
  gridAutoFlowMap,
  colSpanMap,
  rowSpanMap,
  rowGapMap,
  columnGapMap,
  overlayPositionMap,
  gridPresetMap,
  // Phase 3 imports
  entranceAnimationPresets,
  loopAnimationMap,
  customLoopKeyframes,
  easingMap,
  stickyWidthMap,
  scrollSnapTypeMap,
  scrollDirectionMap,
  positionMap,
  type AnimationKeyframe,
  type ResponsiveValue as UtilResponsiveValue,
  type GradientConfig,
} from "@/lib/studio/blocks/layout-utils";

// ============================================================================
// RESPONSIVE UTILITIES
// ============================================================================

type ResponsiveValue<T> = T | { mobile?: T; tablet?: T; desktop?: T };

type ClassMapValue =
  | string
  | { mobile: string; tablet: string; desktop: string }
  | [string, string, string];

function getResponsiveClasses<T extends string | number>(
  prop: ResponsiveValue<T> | undefined,
  classMap: Record<string, ClassMapValue>,
): string {
  if (!prop) return "";

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
    // For simple value, return all breakpoint classes
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

// Spacing Maps
const paddingYMap: Record<
  string,
  { mobile: string; tablet: string; desktop: string }
> = {
  none: { mobile: "py-0", tablet: "md:py-0", desktop: "lg:py-0" },
  xs: { mobile: "py-2", tablet: "md:py-3", desktop: "lg:py-4" },
  sm: { mobile: "py-4", tablet: "md:py-6", desktop: "lg:py-8" },
  md: { mobile: "py-8", tablet: "md:py-12", desktop: "lg:py-16" },
  lg: { mobile: "py-12", tablet: "md:py-16", desktop: "lg:py-24" },
  xl: { mobile: "py-16", tablet: "md:py-24", desktop: "lg:py-32" },
};

const paddingXMap: Record<
  string,
  { mobile: string; tablet: string; desktop: string }
> = {
  none: { mobile: "px-0", tablet: "md:px-0", desktop: "lg:px-0" },
  xs: { mobile: "px-2", tablet: "md:px-3", desktop: "lg:px-4" },
  sm: { mobile: "px-4", tablet: "md:px-6", desktop: "lg:px-8" },
  md: { mobile: "px-4", tablet: "md:px-8", desktop: "lg:px-12" },
  lg: { mobile: "px-6", tablet: "md:px-10", desktop: "lg:px-16" },
};

const gapMap: Record<
  string,
  { mobile: string; tablet: string; desktop: string }
> = {
  none: { mobile: "gap-0", tablet: "md:gap-0", desktop: "lg:gap-0" },
  xs: { mobile: "gap-1", tablet: "md:gap-2", desktop: "lg:gap-2" },
  sm: { mobile: "gap-2", tablet: "md:gap-3", desktop: "lg:gap-4" },
  md: { mobile: "gap-4", tablet: "md:gap-6", desktop: "lg:gap-8" },
  lg: { mobile: "gap-6", tablet: "md:gap-8", desktop: "lg:gap-12" },
  xl: { mobile: "gap-8", tablet: "md:gap-12", desktop: "lg:gap-16" },
};

const borderRadiusMap: Record<
  string,
  { mobile: string; tablet: string; desktop: string }
> = {
  none: {
    mobile: "rounded-none",
    tablet: "md:rounded-none",
    desktop: "lg:rounded-none",
  },
  sm: {
    mobile: "rounded-sm",
    tablet: "md:rounded-sm",
    desktop: "lg:rounded-sm",
  },
  md: {
    mobile: "rounded-md",
    tablet: "md:rounded-md",
    desktop: "lg:rounded-md",
  },
  lg: {
    mobile: "rounded-lg",
    tablet: "md:rounded-lg",
    desktop: "lg:rounded-lg",
  },
  xl: {
    mobile: "rounded-xl",
    tablet: "md:rounded-xl",
    desktop: "lg:rounded-xl",
  },
  "2xl": {
    mobile: "rounded-2xl",
    tablet: "md:rounded-2xl",
    desktop: "lg:rounded-2xl",
  },
  full: {
    mobile: "rounded-full",
    tablet: "md:rounded-full",
    desktop: "lg:rounded-full",
  },
};

// ============================================================================
// SECTION - Full-width section with all options
// ============================================================================

export interface SectionProps {
  children?: React.ReactNode;
  backgroundColor?: string;
  textColor?: string;
  backgroundImage?: string | ImageValue;
  backgroundPosition?: "center" | "top" | "bottom" | "left" | "right";
  backgroundSize?: "cover" | "contain" | "auto";
  backgroundOverlay?: string;
  backgroundOverlayOpacity?: number;
  backgroundGradient?: GradientConfig;
  backgroundVideo?: {
    url: string;
    poster?: string;
    playbackRate?: number;
    loop?: boolean;
    muted?: boolean;
    overlay?: string;
  };
  paddingY?: ResponsiveValue<"none" | "xs" | "sm" | "md" | "lg" | "xl">;
  paddingX?: ResponsiveValue<"none" | "xs" | "sm" | "md" | "lg">;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full" | "none";
  minHeight?: string;
  fullHeight?: boolean;
  height?: "auto" | "screen" | "half-screen";
  contentAlign?: "left" | "center" | "right";
  verticalAlign?: "top" | "center" | "bottom";
  borderTop?: boolean;
  borderBottom?: boolean;
  borderColor?: string;
  scrollSnap?: "none" | "start" | "center" | "end";
  shapeDividerTop?: {
    shape:
      | "wave"
      | "curve"
      | "triangle"
      | "tilt"
      | "arrow"
      | "zigzag"
      | "clouds";
    color: string;
    height?: number;
    flip?: boolean;
  };
  shapeDividerBottom?: {
    shape:
      | "wave"
      | "curve"
      | "triangle"
      | "tilt"
      | "arrow"
      | "zigzag"
      | "clouds";
    color: string;
    height?: number;
    flip?: boolean;
  };
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  hideOnDesktop?: boolean;
  id?: string;
  className?: string;
}

export function SectionRender({
  children,
  backgroundColor,
  textColor,
  backgroundImage,
  backgroundPosition = "center",
  backgroundSize = "cover",
  backgroundOverlay,
  backgroundOverlayOpacity = 50,
  backgroundGradient,
  backgroundVideo,
  paddingY = "md",
  paddingX = "sm",
  maxWidth = "xl",
  minHeight,
  fullHeight = false,
  height = "auto",
  contentAlign = "left",
  verticalAlign = "top",
  borderTop = false,
  borderBottom = false,
  borderColor = "#e5e7eb",
  scrollSnap = "none",
  shapeDividerTop,
  shapeDividerBottom,
  hideOnMobile = false,
  hideOnTablet = false,
  hideOnDesktop = false,
  id,
  className = "",
}: SectionProps) {
  // Normalize backgroundImage to URL string
  const bgImageUrl = getImageUrl(backgroundImage);

  const pyClasses = getResponsiveClasses(paddingY, paddingYMap);
  const pxClasses = getResponsiveClasses(paddingX, paddingXMap);

  // Section uses screen-* max-widths for its inner container
  const sectionMaxWidthMap: Record<string, string> = {
    sm: "max-w-screen-sm",
    md: "max-w-screen-md",
    lg: "max-w-screen-lg",
    xl: "max-w-screen-xl",
    "2xl": "max-w-screen-2xl",
    full: "max-w-full",
    none: "max-w-none",
  };
  const maxWClass = sectionMaxWidthMap[maxWidth] || "max-w-screen-xl";

  const vAlignClass = verticalAlignMap[verticalAlign] || "justify-start";
  const cAlignClass = contentAlignMap[contentAlign] || "items-start text-left";

  const visibility = getVisibilityClasses({
    hideOnMobile,
    hideOnTablet,
    hideOnDesktop,
  });

  // Dual-default render pattern (Section 12.7.5)
  const hasExplicitBg = backgroundColor && backgroundColor !== "";
  const hasExplicitText = textColor && textColor !== "";
  const bgClass = hasExplicitBg ? "" : "bg-background";
  const textClass = hasExplicitText ? "" : "text-foreground";

  // Dark-aware defaults
  const darkBg = isDarkBackground(backgroundColor);
  const darkDefaults = getDarkAwareDefaults(darkBg);
  // Overlay-aware: SectionRender uses backgroundOverlay as the overlay COLOR string
  const effectivelyDark = isEffectivelyDark(
    backgroundColor,
    bgImageUrl,
    backgroundOverlay,
    undefined,
    backgroundOverlayOpacity,
  );

  // Background gradient CSS
  const gradientCSS = backgroundGradient
    ? buildGradientCSS(backgroundGradient)
    : undefined;

  // Scroll snap
  const scrollSnapClass =
    scrollSnap !== "none" ? scrollSnapMap[scrollSnap] || "" : "";

  // Height resolution
  const heightMap: Record<string, string> = {
    auto: "",
    screen: "min-h-screen",
    "half-screen": "min-h-[50vh]",
  };
  const heightClass = heightMap[height] || "";

  // Build inline styles
  const sectionStyle: React.CSSProperties = {};
  if (hasExplicitBg && !backgroundOverlay)
    sectionStyle.backgroundColor = backgroundColor;
  if (bgImageUrl) sectionStyle.backgroundImage = `url(${bgImageUrl})`;
  if (gradientCSS && !bgImageUrl) sectionStyle.backgroundImage = gradientCSS;
  if (bgImageUrl || gradientCSS) {
    sectionStyle.backgroundPosition = backgroundPosition;
    sectionStyle.backgroundSize = backgroundSize;
  }
  if (fullHeight) sectionStyle.minHeight = "100vh";
  else if (minHeight) sectionStyle.minHeight = minHeight;
  if (borderTop || borderBottom) {
    sectionStyle.borderColor = hasExplicitBg
      ? darkDefaults.borderColor
      : borderColor;
  }
  if (hasExplicitText) {
    sectionStyle.color = resolveContrastColor(textColor, effectivelyDark);
  } else if (effectivelyDark) sectionStyle.color = "#f9fafb";
  else if (bgImageUrl) sectionStyle.color = "#ffffff";

  // Shape divider renderer
  const renderShapeDivider = (
    config: NonNullable<SectionProps["shapeDividerTop"]>,
    position: "top" | "bottom",
  ) => {
    const path = shapeDividerPaths[config.shape];
    if (!path) return null;
    const h = config.height || 64;
    return (
      <div
        className={`absolute left-0 right-0 z-1 overflow-hidden pointer-events-none ${
          position === "top" ? "top-0" : "bottom-0"
        }`}
        style={{
          height: `${h}px`,
          transform:
            position === "bottom"
              ? "rotate(180deg)"
              : config.flip
                ? "scaleX(-1)"
                : undefined,
        }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 1920 128"
          preserveAspectRatio="none"
          className="block w-full h-full"
          fill={config.color}
        >
          <path d={path} />
        </svg>
      </div>
    );
  };

  return (
    <section
      id={id}
      className={`relative w-full ${bgClass} ${textClass} ${pyClasses} ${heightClass} ${fullHeight ? "min-h-screen flex flex-col " + vAlignClass : ""} ${scrollSnapClass} ${visibility} ${borderTop ? "border-t" : ""} ${borderBottom ? "border-b" : ""} ${className}`}
      style={Object.keys(sectionStyle).length > 0 ? sectionStyle : undefined}
    >
      {/* Shape divider top */}
      {shapeDividerTop && renderShapeDivider(shapeDividerTop, "top")}

      {/* Video background */}
      {backgroundVideo && (
        <div
          className="absolute inset-0 z-0 overflow-hidden"
          aria-hidden="true"
        >
          <video
            className="w-full h-full object-cover"
            autoPlay
            loop={backgroundVideo.loop !== false}
            muted={backgroundVideo.muted !== false}
            playsInline
            poster={backgroundVideo.poster}
            style={
              {
                playbackRate: backgroundVideo.playbackRate,
              } as React.CSSProperties
            }
          >
            <source src={backgroundVideo.url} />
          </video>
          {backgroundVideo.overlay && (
            <div
              className="absolute inset-0"
              style={{ backgroundColor: backgroundVideo.overlay, opacity: 0.5 }}
            />
          )}
        </div>
      )}

      {/* Background overlay */}
      {backgroundOverlay && (
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundColor: backgroundOverlay,
            opacity: backgroundOverlayOpacity / 100,
          }}
          aria-hidden="true"
        />
      )}

      {/* Content */}
      <div
        className={`relative z-10 w-full mx-auto ${pxClasses} ${maxWClass} flex flex-col ${cAlignClass}`}
      >
        {children}
      </div>

      {/* Shape divider bottom */}
      {shapeDividerBottom && renderShapeDivider(shapeDividerBottom, "bottom")}
    </section>
  );
}

// ============================================================================
// CONTAINER - Centered container with max-width
// ============================================================================

export interface ContainerProps {
  children?: React.ReactNode;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "full" | "prose";
  paddingX?: ResponsiveValue<"none" | "xs" | "sm" | "md" | "lg">;
  paddingY?: ResponsiveValue<"none" | "xs" | "sm" | "md" | "lg" | "xl">;
  backgroundColor?: string;
  textColor?: string;
  backgroundGradient?: GradientConfig;
  borderRadius?: ResponsiveValue<"none" | "sm" | "md" | "lg" | "xl" | "2xl">;
  border?: boolean;
  borderColor?: string;
  shadow?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  glassmorphism?: boolean;
  gradientBorder?: {
    gradient: string;
    width?: number;
    radius?: string;
  };
  aspectRatio?: "auto" | "square" | "video" | "portrait" | "wide";
  overflow?: "visible" | "hidden" | "auto" | "clip";
  id?: string;
  className?: string;
}

export function ContainerRender({
  children,
  maxWidth = "xl",
  paddingX = "sm",
  paddingY,
  backgroundColor,
  textColor,
  backgroundGradient,
  borderRadius = "none",
  border = false,
  borderColor = "#e5e7eb",
  shadow = "none",
  glassmorphism = false,
  gradientBorder,
  aspectRatio,
  overflow,
  id,
  className = "",
}: ContainerProps) {
  const containerMaxWMap: Record<string, string> = {
    xs: "max-w-xs",
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-screen-xl",
    "2xl": "max-w-screen-2xl",
    full: "max-w-full",
    prose: "max-w-prose",
  };
  const maxWClass = containerMaxWMap[maxWidth] || "max-w-screen-xl";
  const pxClasses = getResponsiveClasses(paddingX, paddingXMap);
  const pyClasses = paddingY ? getResponsiveClasses(paddingY, paddingYMap) : "";
  const radiusClasses = getResponsiveClasses(borderRadius, borderRadiusMap);

  // Dual-default render pattern (Section 12.7.5)
  const hasExplicitBg = backgroundColor && backgroundColor !== "";
  const hasExplicitText = textColor && textColor !== "";
  const bgClass = hasExplicitBg ? "" : ""; // Container defaults to transparent
  const textClass = hasExplicitText ? "" : ""; // Container inherits text color

  // Dark-aware shadow
  const darkBg = isDarkBackground(backgroundColor);
  const darkDefaults = getDarkAwareDefaults(darkBg);
  const shadowClass = shadowMapUtil[shadow] || "";
  const darkShadowStyle = darkBg
    ? resolveShadow(shadow as "none" | "sm" | "md" | "lg" | "xl" | "2xl", true)
    : "";

  // Glassmorphism
  const glassStyles = glassmorphism ? resolveGlassmorphism(darkBg) : null;

  // Aspect ratio
  const aspectClass = aspectRatio ? aspectRatioMap[aspectRatio] || "" : "";

  // Overflow
  const overflowClass = overflow ? overflowMapUtil[overflow] || "" : "";

  // Gradient background
  const gradientCSS = backgroundGradient
    ? buildGradientCSS(backgroundGradient)
    : undefined;

  // Build styles
  const containerStyle: React.CSSProperties = {};
  if (hasExplicitBg && !glassmorphism)
    containerStyle.backgroundColor = backgroundColor;
  if (hasExplicitText) containerStyle.color = textColor;
  if (gradientCSS) containerStyle.backgroundImage = gradientCSS;
  if (border)
    containerStyle.borderColor = darkBg
      ? darkDefaults.borderColor
      : borderColor;
  if (darkShadowStyle) containerStyle.boxShadow = darkShadowStyle;
  if (glassStyles) {
    containerStyle.background = glassStyles.background;
    containerStyle.backdropFilter = glassStyles.backdropFilter;
    containerStyle.WebkitBackdropFilter = glassStyles.WebkitBackdropFilter;
    containerStyle.border = glassStyles.border;
  }

  // Gradient border wrapper
  if (gradientBorder) {
    const gbWidth = gradientBorder.width || 2;
    const gbRadius = gradientBorder.radius || "inherit";
    return (
      <div
        id={id}
        className={`w-full mx-auto ${maxWClass}`}
        style={{
          padding: `${gbWidth}px`,
          background: gradientBorder.gradient,
          borderRadius: gbRadius,
        }}
      >
        <div
          className={`w-full ${pxClasses} ${pyClasses} ${radiusClasses} ${shadowClass} ${aspectClass} ${overflowClass} ${bgClass} ${textClass} ${className}`}
          style={{
            ...containerStyle,
            borderRadius: gbRadius,
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      id={id}
      className={`w-full mx-auto ${maxWClass} ${pxClasses} ${pyClasses} ${radiusClasses} ${shadowClass} ${border ? "border" : ""} ${aspectClass} ${overflowClass} ${bgClass} ${textClass} ${className}`}
      style={
        Object.keys(containerStyle).length > 0 ? containerStyle : undefined
      }
    >
      {children}
    </div>
  );
}

// ============================================================================
// COLUMNS - Responsive grid columns
// ============================================================================

export interface ColumnsProps {
  children?: React.ReactNode;
  columns?: number | { mobile?: number; tablet?: number; desktop?: number };
  gap?: ResponsiveValue<"none" | "xs" | "sm" | "md" | "lg" | "xl">;
  verticalAlign?: "start" | "center" | "end" | "stretch";
  stackOnMobile?: boolean;
  reverseOnMobile?: boolean;
  id?: string;
  className?: string;
}

export function ColumnsRender({
  children,
  columns = 2,
  gap = "md",
  verticalAlign = "stretch",
  stackOnMobile = true,
  reverseOnMobile = false,
  id,
  className = "",
}: ColumnsProps) {
  const gapClasses = getResponsiveClasses(gap, gapMap);
  const cols = typeof columns === "number" ? columns : columns.desktop || 2;
  const tabletCols =
    typeof columns === "object" ? columns.tablet || cols : cols;
  const mobileCols =
    typeof columns === "object"
      ? columns.mobile || 1
      : stackOnMobile
        ? 1
        : cols;

  // Use lookup maps — NEVER template literals for Tailwind classes
  const mobileColClass = gridColsMap[mobileCols] || "grid-cols-1";
  const tabletColClass = smGridColsMap[tabletCols] || "sm:grid-cols-2";
  const desktopColClass = lgGridColsMap[cols] || "lg:grid-cols-2";

  const gridColsClass = stackOnMobile
    ? `grid-cols-1 ${tabletColClass} ${desktopColClass}`
    : `${mobileColClass} ${tabletColClass} ${desktopColClass}`;

  const alignClass = alignItemsLookup[verticalAlign] || "items-stretch";

  return (
    <div
      id={id}
      className={`grid ${gridColsClass} ${gapClasses} ${alignClass} ${reverseOnMobile && stackOnMobile ? "flex flex-col-reverse sm:grid" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

// ============================================================================
// CARD - Content surface with variants and effects
// ============================================================================

export interface CardProps {
  children?: React.ReactNode;
  variant?: "elevated" | "outlined" | "filled" | "ghost" | "glass" | "flat";
  padding?: ResponsiveValue<"none" | "xs" | "sm" | "md" | "lg" | "xl">;
  backgroundColor?: string;
  textColor?: string;
  backgroundGradient?: GradientConfig;
  borderRadius?: ResponsiveValue<"none" | "sm" | "md" | "lg" | "xl" | "2xl">;
  border?: boolean;
  borderColor?: string;
  shadow?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  hoverShadow?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  hoverEffect?: "none" | "lift" | "grow" | "glow" | "border" | "shadow";
  hoverScale?: boolean;
  glassmorphism?: boolean;
  gradientBorder?: {
    gradient: string;
    width?: number;
  };
  overflow?: "visible" | "hidden" | "auto" | "clip";
  linkUrl?: string;
  linkTarget?: "_self" | "_blank";
  id?: string;
  className?: string;
  onClick?: () => void;
}

export function CardRender({
  children,
  variant = "elevated",
  padding = "md",
  backgroundColor,
  textColor,
  backgroundGradient,
  borderRadius = "lg",
  border,
  borderColor,
  shadow,
  hoverShadow,
  hoverEffect = "none",
  hoverScale = false,
  glassmorphism = false,
  gradientBorder,
  overflow = "hidden",
  linkUrl,
  linkTarget = "_self",
  id,
  className = "",
  onClick,
}: CardProps) {
  // Dual-default render pattern (Section 12.7.5): bg-card / text-card-foreground
  const hasExplicitBg = backgroundColor && backgroundColor !== "";
  const hasExplicitText = textColor && textColor !== "";

  // Variant-based defaults
  const variantDefaults: Record<
    string,
    {
      bgClass: string;
      textClass: string;
      borderClass: string;
      shadowClass: string;
    }
  > = {
    elevated: {
      bgClass: "bg-card",
      textClass: "text-card-foreground",
      borderClass: "",
      shadowClass: "shadow-md",
    },
    outlined: {
      bgClass: "bg-card",
      textClass: "text-card-foreground",
      borderClass: "border",
      shadowClass: "",
    },
    filled: {
      bgClass: "bg-muted",
      textClass: "text-foreground",
      borderClass: "",
      shadowClass: "",
    },
    ghost: {
      bgClass: "bg-transparent",
      textClass: "text-foreground",
      borderClass: "",
      shadowClass: "",
    },
    glass: {
      bgClass: "",
      textClass: "text-foreground",
      borderClass: "",
      shadowClass: "",
    },
    flat: {
      bgClass: "bg-card",
      textClass: "text-card-foreground",
      borderClass: "",
      shadowClass: "",
    },
  };
  const vd = variantDefaults[variant] || variantDefaults.elevated;

  const bgClass = hasExplicitBg ? "" : vd.bgClass;
  const txtClass = hasExplicitText ? "" : vd.textClass;

  // Dark-aware shadow resolution
  const darkBg = isDarkBackground(backgroundColor);
  const resolvedShadow = shadow ?? (variant === "elevated" ? "md" : "none");
  const shadowClass = darkBg
    ? "" // Will use inline glow style instead
    : shadowMapUtil[resolvedShadow] || "";
  const darkShadowStyle = darkBg
    ? resolveShadow(
        resolvedShadow as "none" | "sm" | "md" | "lg" | "xl" | "2xl",
        true,
      )
    : "";
  const hoverShadowClass = hoverShadow
    ? hoverShadowMapUtil[hoverShadow] || ""
    : "";

  const pClasses = getResponsiveClasses(padding, paddingMapUtil);
  const radiusClasses = getResponsiveClasses(borderRadius, borderRadiusMap);
  const overflowClass = overflowMapUtil[overflow] || "overflow-hidden";

  // Border resolution
  const hasBorder = border ?? variant === "outlined";
  const darkDefaults = getDarkAwareDefaults(darkBg);

  // Glassmorphism (variant="glass" or explicit)
  const isGlass = glassmorphism || variant === "glass";
  const glassStyles = isGlass ? resolveGlassmorphism(darkBg) : null;

  // Gradient background
  const gradientCSS = backgroundGradient
    ? buildGradientCSS(backgroundGradient)
    : undefined;

  // Hover effect classes
  const hoverEffectClasses: Record<string, string> = {
    none: "",
    lift: "hover:-translate-y-1 transition-transform duration-200",
    grow: "hover:scale-[1.02] transition-transform duration-200",
    glow: "hover:ring-2 hover:ring-primary/20 transition-all duration-200",
    border: "hover:border-primary transition-colors duration-200",
    shadow: "hover:shadow-xl transition-shadow duration-200",
  };
  const hoverClass = hoverEffectClasses[hoverEffect] || "";

  // Build styles
  const cardStyle: React.CSSProperties = {};
  if (hasExplicitBg && !isGlass) cardStyle.backgroundColor = backgroundColor;
  if (hasExplicitText) cardStyle.color = textColor;
  if (gradientCSS) cardStyle.backgroundImage = gradientCSS;
  if (hasBorder)
    cardStyle.borderColor = darkBg
      ? darkDefaults.borderColor
      : borderColor || "#e5e7eb";
  if (darkShadowStyle) cardStyle.boxShadow = darkShadowStyle;
  if (glassStyles) {
    cardStyle.background = glassStyles.background;
    cardStyle.backdropFilter = glassStyles.backdropFilter;
    cardStyle.WebkitBackdropFilter = glassStyles.WebkitBackdropFilter;
    if (!hasBorder) cardStyle.border = glassStyles.border;
  }

  // Base class composition
  const baseClasses = `${pClasses} ${radiusClasses} ${bgClass} ${txtClass} ${shadowClass} ${hoverShadowClass} ${hasBorder ? "border" : ""} ${vd.borderClass} ${overflowClass} ${hoverClass} ${hoverScale ? "hover:scale-[1.02] transition-transform duration-200" : ""} transition-shadow ${onClick || linkUrl ? "cursor-pointer" : ""} ${className}`;

  // Gradient border wrapper
  if (gradientBorder) {
    const gbWidth = gradientBorder.width || 2;
    const content = (
      <div
        style={{
          padding: `${gbWidth}px`,
          background: gradientBorder.gradient,
          borderRadius: "inherit",
        }}
      >
        <div
          id={id}
          className={baseClasses}
          style={{ ...cardStyle, borderRadius: "inherit" }}
          onClick={onClick}
          role={onClick ? "button" : undefined}
          tabIndex={onClick ? 0 : undefined}
        >
          {children}
        </div>
      </div>
    );
    if (linkUrl) {
      return (
        <a
          href={linkUrl}
          target={linkTarget}
          rel={linkTarget === "_blank" ? "noopener noreferrer" : undefined}
          className={`block ${radiusClasses}`}
        >
          {content}
        </a>
      );
    }
    return content;
  }

  const cardElement = (
    <div
      id={id}
      className={baseClasses}
      style={Object.keys(cardStyle).length > 0 ? cardStyle : undefined}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );

  if (linkUrl) {
    return (
      <a
        href={linkUrl}
        target={linkTarget}
        rel={linkTarget === "_blank" ? "noopener noreferrer" : undefined}
        className={`block ${radiusClasses}`}
      >
        {cardElement}
      </a>
    );
  }

  return cardElement;
}

// ============================================================================
// SPACER - Vertical spacing
// ============================================================================

export interface SpacerProps {
  height?: number | { mobile?: number; tablet?: number; desktop?: number };
  size?: ResponsiveValue<"xs" | "sm" | "md" | "lg" | "xl" | "2xl">;
  direction?: "vertical" | "horizontal";
  customSize?: string;
  showDivider?: boolean;
  dividerColor?: string;
  dividerStyle?: "solid" | "dashed" | "dotted";
  dividerWidth?: "full" | "3/4" | "2/3" | "1/2" | "1/3" | "1/4";
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  hideOnDesktop?: boolean;
  id?: string;
  className?: string;
}

export function SpacerRender({
  height,
  size,
  direction = "vertical",
  customSize,
  showDivider = false,
  dividerColor = "#e5e7eb",
  dividerStyle = "solid",
  dividerWidth = "full",
  hideOnMobile = false,
  hideOnTablet = false,
  hideOnDesktop = false,
  id,
  className = "",
}: SpacerProps) {
  const visibility = getVisibilityClasses({
    hideOnMobile,
    hideOnTablet,
    hideOnDesktop,
  });
  const isHorizontal = direction === "horizontal";

  // Custom size via inline style
  if (customSize) {
    return (
      <div
        id={id}
        className={`${isHorizontal ? "h-full" : "w-full"} ${visibility} ${className}`}
        style={isHorizontal ? { width: customSize } : { height: customSize }}
        aria-hidden="true"
      >
        {showDivider && (
          <div
            className={`${isHorizontal ? "h-full border-l" : `w-full border-t ${widthFractionMap[dividerWidth] || "w-full"} mx-auto`}`}
            style={{
              borderColor: dividerColor,
              borderStyle: dividerStyle,
              [isHorizontal ? "height" : "width"]: "100%",
            }}
          />
        )}
      </div>
    );
  }

  // Size prop using Tailwind class maps (responsive-safe)
  if (size) {
    const sizeMap = isHorizontal ? spacerWidthMap : spacerHeightMap;
    const sizeClasses = getResponsiveClasses(size, sizeMap);
    return (
      <div
        id={id}
        className={`${isHorizontal ? "h-full inline-block" : "w-full"} ${sizeClasses} ${visibility} ${className}`}
        aria-hidden="true"
      >
        {showDivider && (
          <div
            className={`${isHorizontal ? "h-full border-l" : `border-t ${widthFractionMap[dividerWidth] || "w-full"} mx-auto`} absolute inset-0 m-auto`}
            style={{ borderColor: dividerColor, borderStyle: dividerStyle }}
          />
        )}
      </div>
    );
  }

  // Height prop — fallback to inline style for arbitrary pixel values
  const sizeHeights: Record<string, number> = {
    xs: 8,
    sm: 16,
    md: 32,
    lg: 48,
    xl: 64,
    "2xl": 96,
  };
  let h = 32;
  if (typeof height === "number") h = height;
  else if (typeof height === "object") {
    // Responsive height object — use CSS custom property approach
    const mobileH = height.mobile ?? 32;
    return (
      <div
        id={id}
        className={`w-full ${visibility} ${className}`}
        style={{
          height: `${mobileH}px`,
          // Mobile-first — tablet/desktop handled via media queries in style
        }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      id={id}
      className={`${isHorizontal ? "h-full inline-block" : "w-full"} ${visibility} ${className}`}
      style={isHorizontal ? { width: `${h}px` } : { height: `${h}px` }}
      aria-hidden="true"
    />
  );
}

// ============================================================================
// DIVIDER - Horizontal / vertical line separator
// ============================================================================

export interface DividerProps {
  color?: string;
  thickness?: 1 | 2 | 4;
  style?: "solid" | "dashed" | "dotted";
  width?: "full" | "3/4" | "2/3" | "1/2" | "1/3" | "1/4";
  align?: "left" | "center" | "right";
  text?: string;
  textColor?: string;
  direction?: "horizontal" | "vertical";
  gradientColors?: [string, string];
  gradientDirection?: "left-right" | "right-left" | "center-out";
  fade?: boolean;
  icon?: string;
  spacing?: ResponsiveValue<"none" | "xs" | "sm" | "md" | "lg" | "xl">;
  marginY?: ResponsiveValue<"none" | "xs" | "sm" | "md" | "lg" | "xl">;
  id?: string;
  className?: string;
}

export function DividerRender({
  color,
  thickness = 1,
  style = "solid",
  width = "full",
  align = "center",
  text,
  textColor,
  direction = "horizontal",
  gradientColors,
  gradientDirection = "left-right",
  fade = false,
  icon,
  spacing,
  marginY = "md",
  id,
  className = "",
}: DividerProps) {
  // Use marginYMap from layout-utils (corrected sm: prefix) or spacing if provided
  const spacingProp = spacing || marginY;
  const myClasses = getResponsiveClasses(spacingProp, marginYMapUtil);
  const widthClass = widthFractionMap[width] || "w-full";
  const alignClass =
    { left: "mr-auto", center: "mx-auto", right: "ml-auto" }[align] ||
    "mx-auto";
  const thicknessClass =
    { 1: "border-t", 2: "border-t-2", 4: "border-t-4" }[thickness] ||
    "border-t";
  const vertThicknessClass =
    { 1: "border-l", 2: "border-l-2", 4: "border-l-4" }[thickness] ||
    "border-l";
  const styleClass =
    {
      solid: "border-solid",
      dashed: "border-dashed",
      dotted: "border-dotted",
    }[style] || "border-solid";

  // Dark-aware default color
  const resolvedColor = color || "var(--border, #e5e7eb)";
  const resolvedTextColor = textColor || "var(--muted-foreground, #6b7280)";

  // Gradient line style
  const getGradientStyle = (): React.CSSProperties | undefined => {
    if (gradientColors) {
      const [c1, c2] = gradientColors;
      const dirMap = {
        "left-right": `linear-gradient(to right, ${c1}, ${c2})`,
        "right-left": `linear-gradient(to left, ${c1}, ${c2})`,
        "center-out": `linear-gradient(to right, transparent, ${c1}, ${c2}, transparent)`,
      };
      return {
        borderImage: dirMap[gradientDirection] || dirMap["left-right"],
        borderImageSlice: 1,
      };
    }
    if (fade) {
      return {
        borderImage: `linear-gradient(to right, transparent, ${resolvedColor} 20%, ${resolvedColor} 80%, transparent) 1`,
      };
    }
    return { borderColor: resolvedColor };
  };

  // Vertical divider
  if (direction === "vertical") {
    return (
      <div
        id={id}
        className={`inline-block self-stretch ${vertThicknessClass} ${styleClass} ${className}`}
        style={getGradientStyle()}
        role="separator"
        aria-orientation="vertical"
      />
    );
  }

  // Text or icon divider
  if (text || icon) {
    return (
      <div
        id={id}
        className={`flex items-center ${myClasses} ${widthClass} ${alignClass} ${className}`}
        role="separator"
      >
        <div
          className={`grow ${thicknessClass} ${styleClass}`}
          style={getGradientStyle()}
        />
        {text && (
          <span
            className="px-4 text-sm font-medium"
            style={{ color: resolvedTextColor }}
          >
            {text}
          </span>
        )}
        {icon && !text && (
          <span className="px-3 text-muted-foreground" aria-hidden="true">
            {icon}
          </span>
        )}
        <div
          className={`grow ${thicknessClass} ${styleClass}`}
          style={getGradientStyle()}
        />
      </div>
    );
  }

  return (
    <hr
      id={id}
      className={`${thicknessClass} ${styleClass} ${myClasses} ${widthClass} ${alignClass} ${className}`}
      style={getGradientStyle()}
      role="separator"
    />
  );
}

// ============================================================================
// STACK — Simple vertical/horizontal stacker (Phase 2)
// Default: bg-transparent text-inherit (structural component)
// ============================================================================

export interface StackProps {
  direction?: UtilResponsiveValue<"vertical" | "horizontal">;
  spacing?: UtilResponsiveValue<string>;
  align?: UtilResponsiveValue<"start" | "center" | "end" | "stretch">;
  justify?: UtilResponsiveValue<
    "start" | "center" | "end" | "between" | "around"
  >;
  wrap?: UtilResponsiveValue<boolean>;
  divider?: boolean;
  dividerColor?: string;
  dividerThickness?: "thin" | "medium";
  width?: UtilResponsiveValue<"auto" | "full" | string>;
  maxWidth?: UtilResponsiveValue<string>;
  padding?: UtilResponsiveValue<string>;
  paddingX?: UtilResponsiveValue<string>;
  paddingY?: UtilResponsiveValue<string>;
  backgroundColor?: string;
  borderRadius?: UtilResponsiveValue<string>;
  shadow?: UtilResponsiveValue<string>;
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  hideOnDesktop?: boolean;
  id?: string;
  className?: string;
  children?: React.ReactNode;
}

export function StackRender({
  direction = "vertical",
  spacing = "4",
  align,
  justify,
  wrap,
  divider = false,
  dividerColor,
  dividerThickness = "thin",
  width,
  maxWidth,
  padding,
  paddingX,
  paddingY,
  backgroundColor,
  borderRadius,
  shadow,
  hideOnMobile,
  hideOnTablet,
  hideOnDesktop,
  id,
  className = "",
  children,
}: StackProps) {
  // Direction classes
  const dirClasses = getResponsiveClassesUtil(direction, flexDirectionMap);

  // Gap
  const gapClasses = getResponsiveClassesUtil(spacing, gapMapUtil);

  // Alignment
  const alignClasses = getResponsiveClassesUtil(align, alignItemsLookup);

  // Justify
  const justifyMap: Record<string, string> = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
    around: "justify-around",
  };
  const justifyClass =
    justify && typeof justify === "string" ? justifyMap[justify] || "" : "";

  // Wrap
  const wrapClass = wrap === true ? "flex-wrap" : "";

  // Sizing
  const widthClasses = width ? getResponsiveClassesUtil(width, widthMap) : "";
  const maxWClasses = maxWidth
    ? getResponsiveClassesUtil(maxWidth, maxWidthMapUtil)
    : "";

  // Padding
  const padClasses = getResponsiveClassesUtil(padding, paddingMapUtil);
  const padXClasses = getResponsiveClassesUtil(paddingX, paddingXMapUtil);
  const padYClasses = getResponsiveClassesUtil(paddingY, paddingYMapUtil);

  // Visual
  const radiusClasses = getResponsiveClassesUtil(
    borderRadius,
    borderRadiusMapUtil,
  );
  const shadowClasses = getResponsiveClassesUtil(shadow, shadowMapUtil);

  // Visibility
  const visClasses = getVisibilityClasses({
    hideOnMobile,
    hideOnTablet,
    hideOnDesktop,
  });

  // Inline style for explicit background only
  const inlineStyle: React.CSSProperties = {};
  if (backgroundColor) inlineStyle.backgroundColor = backgroundColor;

  // Divider rendering
  const renderChildren = () => {
    if (!divider || !children) return children;
    const childArray = React.Children.toArray(children).filter(Boolean);
    const isVertical =
      typeof direction === "string" ? direction === "vertical" : true;
    const divThickness = dividerThickness === "medium" ? "2px" : "1px";
    const divColor = dividerColor || "var(--border, #e5e7eb)";
    return childArray.map((child, i) => (
      <React.Fragment key={i}>
        {child}
        {i < childArray.length - 1 && (
          <div
            aria-hidden="true"
            style={{
              [isVertical ? "borderBottomWidth" : "borderRightWidth"]:
                divThickness,
              [isVertical ? "borderBottomStyle" : "borderRightStyle"]: "solid",
              borderColor: divColor,
              [isVertical ? "width" : "height"]: "100%",
              flexShrink: 0,
            }}
          />
        )}
      </React.Fragment>
    ));
  };

  return (
    <div
      id={id}
      className={`flex ${dirClasses} ${gapClasses} ${alignClasses} ${justifyClass} ${wrapClass} ${widthClasses} ${maxWClasses} ${padClasses} ${padXClasses} ${padYClasses} ${radiusClasses} ${shadowClasses} ${visClasses} ${className}`
        .replace(/\s+/g, " ")
        .trim()}
      style={Object.keys(inlineStyle).length > 0 ? inlineStyle : undefined}
    >
      {divider ? renderChildren() : children}
    </div>
  );
}

// ============================================================================
// FLEXBOX — Dedicated flexbox layout builder (Phase 2)
// Default: bg-transparent text-inherit (structural component)
// ============================================================================

export interface FlexBoxProps {
  direction?: UtilResponsiveValue<
    "row" | "column" | "row-reverse" | "column-reverse"
  >;
  wrap?: UtilResponsiveValue<"nowrap" | "wrap" | "wrap-reverse">;
  justify?: UtilResponsiveValue<
    "start" | "center" | "end" | "between" | "around" | "evenly"
  >;
  align?: UtilResponsiveValue<
    "start" | "center" | "end" | "stretch" | "baseline"
  >;
  alignContent?: UtilResponsiveValue<
    "start" | "center" | "end" | "between" | "around" | "stretch"
  >;
  gap?: UtilResponsiveValue<string>;
  rowGap?: UtilResponsiveValue<string>;
  columnGap?: UtilResponsiveValue<string>;
  padding?: UtilResponsiveValue<string>;
  paddingX?: UtilResponsiveValue<string>;
  paddingY?: UtilResponsiveValue<string>;
  equalHeight?: boolean;
  width?: UtilResponsiveValue<"auto" | "full" | string>;
  maxWidth?: UtilResponsiveValue<string>;
  height?: UtilResponsiveValue<"auto" | "full" | "screen" | string>;
  minHeight?: string;
  backgroundColor?: string;
  backgroundGradient?: GradientConfig;
  borderRadius?: UtilResponsiveValue<string>;
  shadow?: UtilResponsiveValue<string>;
  overflow?: UtilResponsiveValue<string>;
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  hideOnDesktop?: boolean;
  id?: string;
  className?: string;
  children?: React.ReactNode;
}

export function FlexBoxRender({
  direction = "row",
  wrap = "nowrap",
  justify,
  align,
  alignContent,
  gap = "4",
  rowGap,
  columnGap,
  padding,
  paddingX,
  paddingY,
  equalHeight = false,
  width,
  maxWidth,
  height,
  minHeight,
  backgroundColor,
  backgroundGradient,
  borderRadius,
  shadow,
  overflow,
  hideOnMobile,
  hideOnTablet,
  hideOnDesktop,
  id,
  className = "",
  children,
}: FlexBoxProps) {
  const dirClasses = getResponsiveClassesUtil(direction, flexDirectionMap);
  const wrapClasses = getResponsiveClassesUtil(wrap, flexWrapMap);
  const justifyClasses = getResponsiveClassesUtil(justify, {
    start: {
      mobile: "justify-start",
      tablet: "sm:justify-start",
      desktop: "lg:justify-start",
    },
    center: {
      mobile: "justify-center",
      tablet: "sm:justify-center",
      desktop: "lg:justify-center",
    },
    end: {
      mobile: "justify-end",
      tablet: "sm:justify-end",
      desktop: "lg:justify-end",
    },
    between: {
      mobile: "justify-between",
      tablet: "sm:justify-between",
      desktop: "lg:justify-between",
    },
    around: {
      mobile: "justify-around",
      tablet: "sm:justify-around",
      desktop: "lg:justify-around",
    },
    evenly: {
      mobile: "justify-evenly",
      tablet: "sm:justify-evenly",
      desktop: "lg:justify-evenly",
    },
  });
  const alignClasses = getResponsiveClassesUtil(align, alignItemsLookup);
  const alignCClasses = getResponsiveClassesUtil(
    alignContent,
    alignContentMapUtil,
  );
  const gapClasses = getResponsiveClassesUtil(gap, gapMapUtil);
  const rGapClasses = getResponsiveClassesUtil(rowGap, rowGapMap);
  const cGapClasses = getResponsiveClassesUtil(columnGap, columnGapMap);
  const padClasses = getResponsiveClassesUtil(padding, paddingMapUtil);
  const padXClasses = getResponsiveClassesUtil(paddingX, paddingXMapUtil);
  const padYClasses = getResponsiveClassesUtil(paddingY, paddingYMapUtil);
  const widthClasses = width ? getResponsiveClassesUtil(width, widthMap) : "";
  const maxWClasses = maxWidth
    ? getResponsiveClassesUtil(maxWidth, maxWidthMapUtil)
    : "";
  const heightClasses = height
    ? getResponsiveClassesUtil(height, heightMap)
    : "";
  const radiusClasses = getResponsiveClassesUtil(
    borderRadius,
    borderRadiusMapUtil,
  );
  const shadowClasses = getResponsiveClassesUtil(shadow, shadowMapUtil);
  const overflowClasses = getResponsiveClassesUtil(overflow, overflowMapUtil);
  const visClasses = getVisibilityClasses({
    hideOnMobile,
    hideOnTablet,
    hideOnDesktop,
  });

  const equalHeightClass = equalHeight ? "items-stretch" : "";

  const inlineStyle: React.CSSProperties = {};
  if (backgroundColor) inlineStyle.backgroundColor = backgroundColor;
  if (backgroundGradient)
    inlineStyle.backgroundImage = buildGradientCSS(backgroundGradient);
  if (minHeight) inlineStyle.minHeight = minHeight;

  return (
    <div
      id={id}
      className={`flex ${dirClasses} ${wrapClasses} ${justifyClasses} ${alignClasses} ${alignCClasses} ${gapClasses} ${rGapClasses} ${cGapClasses} ${padClasses} ${padXClasses} ${padYClasses} ${equalHeightClass} ${widthClasses} ${maxWClasses} ${heightClasses} ${radiusClasses} ${shadowClasses} ${overflowClasses} ${visClasses} ${className}`
        .replace(/\s+/g, " ")
        .trim()}
      style={Object.keys(inlineStyle).length > 0 ? inlineStyle : undefined}
    >
      {children}
    </div>
  );
}

// ============================================================================
// GRID — Dedicated CSS Grid layout builder (Phase 2)
// Default: bg-transparent text-inherit (structural component)
// ============================================================================

export interface GridProps {
  columns?: UtilResponsiveValue<string>;
  rows?: UtilResponsiveValue<string>;
  areas?: UtilResponsiveValue<string>;
  autoFlow?: string;
  autoColumns?: string;
  autoRows?: string;
  justifyItems?: UtilResponsiveValue<"start" | "center" | "end" | "stretch">;
  alignItems?: UtilResponsiveValue<"start" | "center" | "end" | "stretch">;
  justifyContent?: UtilResponsiveValue<
    "start" | "center" | "end" | "between" | "around" | "evenly" | "stretch"
  >;
  alignContent?: UtilResponsiveValue<
    "start" | "center" | "end" | "between" | "around" | "evenly" | "stretch"
  >;
  placeItems?: UtilResponsiveValue<"start" | "center" | "end" | "stretch">;
  gap?: UtilResponsiveValue<string>;
  rowGap?: UtilResponsiveValue<string>;
  columnGap?: UtilResponsiveValue<string>;
  padding?: UtilResponsiveValue<string>;
  preset?: string;
  width?: UtilResponsiveValue<"auto" | "full" | string>;
  maxWidth?: UtilResponsiveValue<string>;
  height?: UtilResponsiveValue<"auto" | "full" | "screen" | string>;
  minHeight?: string;
  backgroundColor?: string;
  backgroundGradient?: GradientConfig;
  borderRadius?: UtilResponsiveValue<string>;
  shadow?: UtilResponsiveValue<string>;
  overflow?: UtilResponsiveValue<string>;
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  hideOnDesktop?: boolean;
  id?: string;
  className?: string;
  children?: React.ReactNode;
}

export function GridRender({
  columns,
  rows,
  areas,
  autoFlow,
  autoColumns,
  autoRows,
  justifyItems,
  alignItems,
  justifyContent,
  alignContent,
  placeItems,
  gap = "4",
  rowGap,
  columnGap,
  padding,
  preset,
  width,
  maxWidth,
  height,
  minHeight,
  backgroundColor,
  backgroundGradient,
  borderRadius,
  shadow,
  overflow,
  hideOnMobile,
  hideOnTablet,
  hideOnDesktop,
  id,
  className = "",
  children,
}: GridProps) {
  // Apply preset if no explicit columns
  const resolvedPreset = preset && !columns ? gridPresetMap[preset] : undefined;

  const gapClasses = getResponsiveClassesUtil(gap, gapMapUtil);
  const rGapClasses = getResponsiveClassesUtil(rowGap, rowGapMap);
  const cGapClasses = getResponsiveClassesUtil(columnGap, columnGapMap);
  const padClasses = getResponsiveClassesUtil(padding, paddingMapUtil);
  const jItemsClasses = getResponsiveClassesUtil(justifyItems, justifyItemsMap);
  const aItemsClasses = getResponsiveClassesUtil(alignItems, alignItemsLookup);
  const jContentClasses = getResponsiveClassesUtil(justifyContent, {
    start: {
      mobile: "justify-start",
      tablet: "sm:justify-start",
      desktop: "lg:justify-start",
    },
    center: {
      mobile: "justify-center",
      tablet: "sm:justify-center",
      desktop: "lg:justify-center",
    },
    end: {
      mobile: "justify-end",
      tablet: "sm:justify-end",
      desktop: "lg:justify-end",
    },
    between: {
      mobile: "justify-between",
      tablet: "sm:justify-between",
      desktop: "lg:justify-between",
    },
    around: {
      mobile: "justify-around",
      tablet: "sm:justify-around",
      desktop: "lg:justify-around",
    },
    evenly: {
      mobile: "justify-evenly",
      tablet: "sm:justify-evenly",
      desktop: "lg:justify-evenly",
    },
    stretch: {
      mobile: "justify-stretch",
      tablet: "sm:justify-stretch",
      desktop: "lg:justify-stretch",
    },
  });
  const aCClasses = getResponsiveClassesUtil(alignContent, alignContentMapUtil);
  const pItemsClasses = getResponsiveClassesUtil(placeItems, placeItemsMap);
  const widthClasses = width ? getResponsiveClassesUtil(width, widthMap) : "";
  const maxWClasses = maxWidth
    ? getResponsiveClassesUtil(maxWidth, maxWidthMapUtil)
    : "";
  const heightClasses = height
    ? getResponsiveClassesUtil(height, heightMap)
    : "";
  const radiusClasses = getResponsiveClassesUtil(
    borderRadius,
    borderRadiusMapUtil,
  );
  const shadowClasses = getResponsiveClassesUtil(shadow, shadowMapUtil);
  const overflowClasses = getResponsiveClassesUtil(overflow, overflowMapUtil);
  const visClasses = getVisibilityClasses({
    hideOnMobile,
    hideOnTablet,
    hideOnDesktop,
  });
  const autoFlowClass = autoFlow ? gridAutoFlowMap[autoFlow] || "" : "";

  const inlineStyle: React.CSSProperties = {};
  // Grid template via inline style (custom CSS values)
  const gridCols = columns || resolvedPreset?.columns;
  const gridRows = rows || resolvedPreset?.rows;
  if (gridCols)
    inlineStyle.gridTemplateColumns =
      typeof gridCols === "string" ? gridCols : undefined;
  if (gridRows)
    inlineStyle.gridTemplateRows =
      typeof gridRows === "string" ? gridRows : undefined;
  if (areas && typeof areas === "string") inlineStyle.gridTemplateAreas = areas;
  if (autoColumns) inlineStyle.gridAutoColumns = autoColumns;
  if (autoRows) inlineStyle.gridAutoRows = autoRows;
  if (backgroundColor) inlineStyle.backgroundColor = backgroundColor;
  if (backgroundGradient)
    inlineStyle.backgroundImage = buildGradientCSS(backgroundGradient);
  if (minHeight) inlineStyle.minHeight = minHeight;

  return (
    <div
      id={id}
      className={`grid ${autoFlowClass} ${gapClasses} ${rGapClasses} ${cGapClasses} ${padClasses} ${jItemsClasses} ${aItemsClasses} ${jContentClasses} ${aCClasses} ${pItemsClasses} ${widthClasses} ${maxWClasses} ${heightClasses} ${radiusClasses} ${shadowClasses} ${overflowClasses} ${visClasses} ${className}`
        .replace(/\s+/g, " ")
        .trim()}
      style={Object.keys(inlineStyle).length > 0 ? inlineStyle : undefined}
    >
      {children}
    </div>
  );
}

// ============================================================================
// GRID ITEM — Child placement within Grid (Phase 2)
// ============================================================================

export interface GridItemProps {
  colSpan?: number;
  rowSpan?: number;
  colStart?: number | "auto";
  colEnd?: number | "auto";
  rowStart?: number | "auto";
  rowEnd?: number | "auto";
  area?: string;
  alignSelf?: UtilResponsiveValue<"start" | "center" | "end" | "stretch">;
  justifySelf?: UtilResponsiveValue<"start" | "center" | "end" | "stretch">;
  order?: number;
  id?: string;
  className?: string;
  children?: React.ReactNode;
}

export function GridItemRender({
  colSpan,
  rowSpan,
  colStart,
  colEnd,
  rowStart,
  rowEnd,
  area,
  alignSelf,
  justifySelf,
  order,
  id,
  className = "",
  children,
}: GridItemProps) {
  const colSpanClass = colSpan ? colSpanMap[colSpan] || "" : "";
  const rowSpanClass = rowSpan ? rowSpanMap[rowSpan] || "" : "";
  const aSelfClasses = getResponsiveClassesUtil(alignSelf, alignSelfMap);
  const jSelfClasses = getResponsiveClassesUtil(justifySelf, justifySelfMap);

  const inlineStyle: React.CSSProperties = {};
  if (colStart !== undefined && colStart !== "auto")
    inlineStyle.gridColumnStart = colStart;
  if (colStart === "auto") inlineStyle.gridColumnStart = "auto";
  if (colEnd !== undefined && colEnd !== "auto")
    inlineStyle.gridColumnEnd = colEnd;
  if (colEnd === "auto") inlineStyle.gridColumnEnd = "auto";
  if (rowStart !== undefined && rowStart !== "auto")
    inlineStyle.gridRowStart = rowStart;
  if (rowStart === "auto") inlineStyle.gridRowStart = "auto";
  if (rowEnd !== undefined && rowEnd !== "auto")
    inlineStyle.gridRowEnd = rowEnd;
  if (rowEnd === "auto") inlineStyle.gridRowEnd = "auto";
  if (area) inlineStyle.gridArea = area;
  if (order !== undefined) inlineStyle.order = order;

  return (
    <div
      id={id}
      className={`${colSpanClass} ${rowSpanClass} ${aSelfClasses} ${jSelfClasses} ${className}`
        .replace(/\s+/g, " ")
        .trim()}
      style={Object.keys(inlineStyle).length > 0 ? inlineStyle : undefined}
    >
      {children}
    </div>
  );
}

// ============================================================================
// WRAPPER — Invisible layout helper (Phase 2)
// No visual styling defaults — pure structural component
// ============================================================================

export interface WrapperProps {
  display?: UtilResponsiveValue<
    | "block"
    | "flex"
    | "grid"
    | "inline"
    | "inline-flex"
    | "inline-grid"
    | "contents"
    | "none"
  >;
  position?: UtilResponsiveValue<
    "static" | "relative" | "absolute" | "sticky" | "fixed"
  >;
  inset?: { top?: string; right?: string; bottom?: string; left?: string };
  zIndex?: number;
  width?: UtilResponsiveValue<"auto" | "full" | "fit" | "min" | "max" | string>;
  height?: UtilResponsiveValue<
    "auto" | "full" | "fit" | "min" | "max" | string
  >;
  margin?: UtilResponsiveValue<"auto" | string>;
  padding?: UtilResponsiveValue<string>;
  flexGrow?: boolean;
  flexShrink?: boolean;
  alignSelf?: UtilResponsiveValue<
    "start" | "center" | "end" | "stretch" | "baseline"
  >;
  order?: number;
  colSpan?: number;
  rowSpan?: number;
  area?: string;
  overflow?: UtilResponsiveValue<string>;
  textAlign?: UtilResponsiveValue<"left" | "center" | "right">;
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  hideOnDesktop?: boolean;
  id?: string;
  className?: string;
  children?: React.ReactNode;
}

export function WrapperRender({
  display,
  position,
  inset,
  zIndex,
  width,
  height,
  margin,
  padding,
  flexGrow,
  flexShrink,
  alignSelf,
  order,
  colSpan,
  rowSpan,
  area,
  overflow,
  textAlign,
  hideOnMobile,
  hideOnTablet,
  hideOnDesktop,
  id,
  className = "",
  children,
}: WrapperProps) {
  const displayClasses = getResponsiveClassesUtil(display, displayMap);
  const widthClasses = width ? getResponsiveClassesUtil(width, widthMap) : "";
  const heightClasses = height
    ? getResponsiveClassesUtil(height, heightMap)
    : "";
  const marginClasses = margin
    ? getResponsiveClassesUtil(margin, marginMap)
    : "";
  const padClasses = getResponsiveClassesUtil(padding, paddingMapUtil);
  const aSelfClasses = getResponsiveClassesUtil(alignSelf, alignSelfMap);
  const overflowClasses = getResponsiveClassesUtil(overflow, overflowMapUtil);
  const textAlignClasses = getResponsiveClassesUtil(textAlign, textAlignMap);
  const visClasses = getVisibilityClasses({
    hideOnMobile,
    hideOnTablet,
    hideOnDesktop,
  });

  const posClass =
    position && typeof position === "string" ? position || "" : "";
  const growClass = flexGrow ? "grow" : "";
  const shrinkClass = flexShrink === false ? "shrink-0" : "";
  const colSpanClass = colSpan ? colSpanMap[colSpan] || "" : "";
  const rowSpanClass = rowSpan ? rowSpanMap[rowSpan] || "" : "";

  const inlineStyle: React.CSSProperties = {};
  if (inset?.top) inlineStyle.top = inset.top;
  if (inset?.right) inlineStyle.right = inset.right;
  if (inset?.bottom) inlineStyle.bottom = inset.bottom;
  if (inset?.left) inlineStyle.left = inset.left;
  if (zIndex !== undefined) inlineStyle.zIndex = zIndex;
  if (area) inlineStyle.gridArea = area;
  if (order !== undefined) inlineStyle.order = order;

  return (
    <div
      id={id}
      className={`${displayClasses} ${posClass} ${widthClasses} ${heightClasses} ${marginClasses} ${padClasses} ${aSelfClasses} ${growClass} ${shrinkClass} ${colSpanClass} ${rowSpanClass} ${overflowClasses} ${textAlignClasses} ${visClasses} ${className}`
        .replace(/\s+/g, " ")
        .trim()}
      style={Object.keys(inlineStyle).length > 0 ? inlineStyle : undefined}
    >
      {children}
    </div>
  );
}

// ============================================================================
// ASPECT RATIO BOX — Ratio-preserving container (Phase 2)
// Default: bg-transparent, overflow hidden
// ============================================================================

export interface AspectRatioBoxProps {
  ratio?: UtilResponsiveValue<
    "1:1" | "4:3" | "3:2" | "16:9" | "21:9" | "2:3" | "3:4" | "9:16" | string
  >;
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  objectPosition?: string;
  backgroundColor?: string;
  borderRadius?: UtilResponsiveValue<string>;
  shadow?: UtilResponsiveValue<string>;
  overflow?: "hidden" | "visible";
  width?: UtilResponsiveValue<"full" | "auto" | string>;
  maxWidth?: string;
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  hideOnDesktop?: boolean;
  id?: string;
  className?: string;
  children?: React.ReactNode;
}

export function AspectRatioBoxRender({
  ratio = "16:9",
  objectFit,
  objectPosition,
  backgroundColor,
  borderRadius,
  shadow,
  overflow = "hidden",
  width,
  maxWidth,
  hideOnMobile,
  hideOnTablet,
  hideOnDesktop,
  id,
  className = "",
  children,
}: AspectRatioBoxProps) {
  // Resolve ratio: use map for known ratios, parse for custom
  const resolvedRatio = typeof ratio === "string" ? ratio : "16:9";
  const ratioClass = aspectRatioBoxMap[resolvedRatio] || "";
  const radiusClasses = getResponsiveClassesUtil(
    borderRadius,
    borderRadiusMapUtil,
  );
  const shadowClasses = getResponsiveClassesUtil(shadow, shadowMapUtil);
  const widthClasses = width ? getResponsiveClassesUtil(width, widthMap) : "";
  const overflowClass =
    overflow === "visible" ? "overflow-visible" : "overflow-hidden";
  const objectFitClass = objectFit ? objectFitMap[objectFit] || "" : "";
  const visClasses = getVisibilityClasses({
    hideOnMobile,
    hideOnTablet,
    hideOnDesktop,
  });

  const inlineStyle: React.CSSProperties = {};
  if (backgroundColor) inlineStyle.backgroundColor = backgroundColor;
  if (maxWidth) inlineStyle.maxWidth = maxWidth;
  if (objectPosition) inlineStyle.objectPosition = objectPosition;
  // Custom ratio via inline style when not in the map
  if (!ratioClass && resolvedRatio) {
    const parsed = parseAspectRatio(resolvedRatio);
    if (parsed) inlineStyle.aspectRatio = parsed;
  }

  return (
    <div
      id={id}
      className={`${ratioClass} ${overflowClass} ${radiusClasses} ${shadowClasses} ${widthClasses} ${objectFitClass} ${visClasses} ${className}`
        .replace(/\s+/g, " ")
        .trim()}
      style={Object.keys(inlineStyle).length > 0 ? inlineStyle : undefined}
    >
      {children}
    </div>
  );
}

// ============================================================================
// OVERLAY — Layer component for overlaid content (Phase 2)
// Default: transparent/semi-transparent, requires parent with relative positioning
// ============================================================================

export interface OverlayProps {
  position?:
    | "fill"
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "center"
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right";
  inset?: UtilResponsiveValue<string>;
  backgroundColor?: string;
  backgroundGradient?: GradientConfig;
  backdropBlur?: "none" | "sm" | "md" | "lg" | "xl";
  contentAlign?: "start" | "center" | "end";
  contentJustify?: "start" | "center" | "end";
  showOn?: "always" | "hover" | "focus" | "group-hover";
  transition?: "fade" | "slide-up" | "slide-down" | "scale" | "none";
  transitionDuration?: number;
  width?: string;
  height?: string;
  padding?: UtilResponsiveValue<string>;
  zIndex?: number;
  id?: string;
  className?: string;
  children?: React.ReactNode;
}

export function OverlayRender({
  position = "fill",
  inset,
  backgroundColor,
  backgroundGradient,
  backdropBlur,
  contentAlign = "center",
  contentJustify = "center",
  showOn = "always",
  transition = "fade",
  transitionDuration = 300,
  width,
  height,
  padding,
  zIndex = 10,
  id,
  className = "",
  children,
}: OverlayProps) {
  // Position classes
  const posClasses = overlayPositionMap[position] || overlayPositionMap.fill;

  // Padding
  const padClasses = getResponsiveClassesUtil(padding, paddingMapUtil);

  // Backdrop blur
  const blurClass = backdropBlur ? backdropBlurMap[backdropBlur] || "" : "";

  // Content alignment (for non-fill positions that don't include flex)
  const alignMap: Record<string, string> = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
  };
  const justifyMap: Record<string, string> = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
  };
  const needsFlex = position !== "center"; // center already includes flex
  const flexClasses =
    needsFlex && children
      ? `flex ${alignMap[contentAlign] || ""} ${justifyMap[contentJustify] || ""}`
      : "";

  // Show/hide behavior
  const visibilityClasses: Record<string, string> = {
    always: "",
    hover: "opacity-0 hover:opacity-100",
    focus: "opacity-0 focus-within:opacity-100",
    "group-hover": "opacity-0 group-hover:opacity-100",
  };
  const showClass = visibilityClasses[showOn] || "";

  // Transition classes
  const transitionMap: Record<string, string> = {
    none: "",
    fade: "transition-opacity",
    "slide-up": "transition-all translate-y-2 hover:translate-y-0",
    "slide-down": "transition-all -translate-y-2 hover:translate-y-0",
    scale: "transition-transform scale-95 hover:scale-100",
  };
  const transClass = showOn !== "always" ? transitionMap[transition] || "" : "";

  const inlineStyle: React.CSSProperties = {
    zIndex,
    transitionDuration: transClass ? `${transitionDuration}ms` : undefined,
  };
  if (backgroundColor) inlineStyle.backgroundColor = backgroundColor;
  if (backgroundGradient)
    inlineStyle.backgroundImage = buildGradientCSS(backgroundGradient);
  if (width) inlineStyle.width = width;
  if (height) inlineStyle.height = height;

  return (
    <div
      id={id}
      className={`${posClasses} ${flexClasses} ${padClasses} ${blurClass} ${showClass} ${transClass} ${className}`
        .replace(/\s+/g, " ")
        .trim()}
      style={inlineStyle}
      aria-hidden={!children ? true : undefined}
    >
      {children}
    </div>
  );
}

// ============================================================================
// SCROLL SECTION — Full-page scroll-snap experience (Phase 3)
// ============================================================================

export interface ScrollSectionItemProps {
  snapAlign?: "start" | "center" | "end";
  backgroundColor?: string;
  backgroundImage?: string;
  id?: string;
  className?: string;
  children?: React.ReactNode;
}

export interface ScrollSectionProps {
  snapType?: "mandatory" | "proximity" | "none";
  direction?: "vertical" | "horizontal";
  smoothScroll?: boolean;
  backgroundColor?: string;
  showProgress?: boolean;
  progressStyle?: "dots" | "line" | "numbers";
  progressPosition?: "right" | "left" | "bottom";
  progressColor?: string;
  showNavigation?: boolean;
  keyboardNavigation?: boolean;
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  hideOnDesktop?: boolean;
  id?: string;
  className?: string;
  children?: React.ReactNode;
}

export function ScrollSectionItemRender({
  snapAlign = "start",
  backgroundColor,
  backgroundImage,
  id,
  className = "",
  children,
}: ScrollSectionItemProps) {
  const snapClass = scrollSnapMap[snapAlign] || "snap-start";

  const inlineStyle: React.CSSProperties = {};
  if (backgroundColor) inlineStyle.backgroundColor = backgroundColor;
  if (backgroundImage) {
    inlineStyle.backgroundImage = `url(${backgroundImage})`;
    inlineStyle.backgroundSize = "cover";
    inlineStyle.backgroundPosition = "center";
  }

  return (
    <div
      id={id}
      className={`min-h-screen flex items-center justify-center ${snapClass} ${className}`.trim()}
      style={Object.keys(inlineStyle).length > 0 ? inlineStyle : undefined}
    >
      {children}
    </div>
  );
}

export function ScrollSectionRender({
  snapType = "mandatory",
  direction = "vertical",
  smoothScroll = true,
  backgroundColor,
  showProgress = false,
  progressStyle = "dots",
  progressPosition = "right",
  progressColor,
  showNavigation = false,
  keyboardNavigation = true,
  hideOnMobile,
  hideOnTablet,
  hideOnDesktop,
  id,
  className = "",
  children,
}: ScrollSectionProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);

  const childCount = React.Children.count(children);
  const isVertical = direction === "vertical";

  // Snap type class
  const snapTypeClass = scrollSnapTypeMap[snapType] || "";
  const dirClass = isVertical ? "snap-y" : "snap-x";
  const scrollClass = smoothScroll ? "scroll-smooth" : "";
  const layoutClass = isVertical
    ? "overflow-y-auto h-screen"
    : "overflow-x-auto flex h-screen";

  const visClasses = getVisibilityClasses({
    hideOnMobile,
    hideOnTablet,
    hideOnDesktop,
  });

  // Track scroll position for progress indicator
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || !showProgress) return;

    const handleScroll = () => {
      if (isVertical) {
        const scrollTop = container.scrollTop;
        const sectionHeight = container.clientHeight;
        const idx = Math.round(scrollTop / sectionHeight);
        setActiveIndex(Math.min(idx, childCount - 1));
      } else {
        const scrollLeft = container.scrollLeft;
        const sectionWidth = container.clientWidth;
        const idx = Math.round(scrollLeft / sectionWidth);
        setActiveIndex(Math.min(idx, childCount - 1));
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [showProgress, isVertical, childCount]);

  // Keyboard navigation
  React.useEffect(() => {
    if (!keyboardNavigation) return;
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isVertical) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          container.scrollBy({
            top: container.clientHeight,
            behavior: "smooth",
          });
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          container.scrollBy({
            top: -container.clientHeight,
            behavior: "smooth",
          });
        }
      } else {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          container.scrollBy({
            left: container.clientWidth,
            behavior: "smooth",
          });
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          container.scrollBy({
            left: -container.clientWidth,
            behavior: "smooth",
          });
        }
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    container.tabIndex = 0;
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [keyboardNavigation, isVertical]);

  // Navigate to specific section
  const navigateTo = (index: number) => {
    const container = containerRef.current;
    if (!container) return;
    if (isVertical) {
      container.scrollTo({
        top: index * container.clientHeight,
        behavior: "smooth",
      });
    } else {
      container.scrollTo({
        left: index * container.clientWidth,
        behavior: "smooth",
      });
    }
  };

  // Progress indicator
  const renderProgress = () => {
    if (!showProgress || childCount <= 1) return null;

    const positionClasses: Record<string, string> = {
      right: "fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2",
      left: "fixed left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2",
      bottom: "fixed bottom-4 left-1/2 -translate-x-1/2 flex flex-row gap-2",
    };

    const color = progressColor || "currentColor";

    if (progressStyle === "dots") {
      return (
        <div
          className={positionClasses[progressPosition] || positionClasses.right}
          style={{ zIndex: 50 }}
        >
          {Array.from({ length: childCount }, (_, i) => (
            <button
              key={i}
              onClick={() => navigateTo(i)}
              className={`rounded-full transition-all duration-300 ${i === activeIndex ? "w-3 h-3" : "w-2 h-2 opacity-50"}`}
              style={{ backgroundColor: color }}
              aria-label={`Go to section ${i + 1}`}
            />
          ))}
        </div>
      );
    }

    if (progressStyle === "line") {
      const progress =
        childCount > 1 ? (activeIndex / (childCount - 1)) * 100 : 0;
      const isHoriz = progressPosition === "bottom";
      return (
        <div
          className={
            isHoriz
              ? "fixed bottom-0 left-0 right-0 h-1"
              : "fixed right-0 top-0 bottom-0 w-1"
          }
          style={{ zIndex: 50, backgroundColor: "rgba(128,128,128,0.3)" }}
        >
          <div
            className="transition-all duration-300"
            style={{
              backgroundColor: color,
              ...(isHoriz
                ? { height: "100%", width: `${progress}%` }
                : { width: "100%", height: `${progress}%` }),
            }}
          />
        </div>
      );
    }

    if (progressStyle === "numbers") {
      return (
        <div
          className={positionClasses[progressPosition] || positionClasses.right}
          style={{ zIndex: 50, color }}
        >
          <span className="text-sm font-mono font-bold">
            {activeIndex + 1}/{childCount}
          </span>
        </div>
      );
    }

    return null;
  };

  // Navigation arrows
  const renderNavigation = () => {
    if (!showNavigation || childCount <= 1) return null;
    return (
      <>
        {activeIndex > 0 && (
          <button
            onClick={() => navigateTo(activeIndex - 1)}
            className={`fixed z-50 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors ${isVertical ? "top-4 left-1/2 -translate-x-1/2" : "left-4 top-1/2 -translate-y-1/2"}`}
            aria-label="Previous section"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={isVertical ? "M5 15l7-7 7 7" : "M15 19l-7-7 7-7"}
              />
            </svg>
          </button>
        )}
        {activeIndex < childCount - 1 && (
          <button
            onClick={() => navigateTo(activeIndex + 1)}
            className={`fixed z-50 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors ${isVertical ? "bottom-4 left-1/2 -translate-x-1/2" : "right-4 top-1/2 -translate-y-1/2"}`}
            aria-label="Next section"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={isVertical ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"}
              />
            </svg>
          </button>
        )}
      </>
    );
  };

  const inlineStyle: React.CSSProperties = {};
  if (backgroundColor) inlineStyle.backgroundColor = backgroundColor;

  return (
    <div
      className={`relative ${visClasses}`}
      style={Object.keys(inlineStyle).length > 0 ? inlineStyle : undefined}
    >
      <div
        ref={containerRef}
        id={id}
        className={`${layoutClass} ${dirClass} ${snapTypeClass} ${scrollClass} ${className}`
          .replace(/\s+/g, " ")
          .trim()}
        style={{ outline: "none" }}
      >
        {children}
      </div>
      {renderProgress()}
      {renderNavigation()}
    </div>
  );
}

// ============================================================================
// STICKY CONTAINER — Scroll storytelling component (Phase 3)
// Default: bg-transparent text-inherit (structural component)
// ============================================================================

export interface StickyContainerProps {
  stickyPosition?: "left" | "right" | "top";
  stickyWidth?: UtilResponsiveValue<"1/3" | "2/5" | "1/2" | "3/5" | "2/3">;
  stickyOffset?: string;
  gap?: UtilResponsiveValue<string>;
  stackOnMobile?: boolean;
  mobileOrder?: "sticky-first" | "scroll-first";
  padding?: UtilResponsiveValue<string>;
  backgroundColor?: string;
  minHeight?: string;
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  hideOnDesktop?: boolean;
  id?: string;
  className?: string;
  children?: React.ReactNode;
}

export function StickyContainerRender({
  stickyPosition = "left",
  stickyWidth = "1/3",
  stickyOffset = "0px",
  gap = "8",
  stackOnMobile = true,
  mobileOrder = "sticky-first",
  padding,
  backgroundColor,
  minHeight,
  hideOnMobile,
  hideOnTablet,
  hideOnDesktop,
  id,
  className = "",
  children,
}: StickyContainerProps) {
  const childArray = React.Children.toArray(children).filter(Boolean);
  const stickyChild = childArray[0];
  const scrollChildren = childArray.slice(1);

  const gapClasses = getResponsiveClassesUtil(gap, gapMapUtil);
  const padClasses = getResponsiveClassesUtil(padding, paddingMapUtil);
  const visClasses = getVisibilityClasses({
    hideOnMobile,
    hideOnTablet,
    hideOnDesktop,
  });
  const widthClasses = getResponsiveClassesUtil(stickyWidth, stickyWidthMap);

  // Mobile stacking
  const mobileLayout = stackOnMobile ? "flex-col" : "";
  const mobileOrderClass =
    mobileOrder === "scroll-first" ? "order-2 sm:order-none" : "";
  const scrollOrderClass =
    mobileOrder === "scroll-first" ? "order-1 sm:order-none" : "";

  // Direction: top = column, left/right = row
  const isTop = stickyPosition === "top";
  const isRight = stickyPosition === "right";

  const flexDirection = isTop
    ? "flex-col"
    : isRight
      ? "sm:flex-row-reverse"
      : "sm:flex-row";

  const inlineStyle: React.CSSProperties = {};
  if (backgroundColor) inlineStyle.backgroundColor = backgroundColor;
  if (minHeight) inlineStyle.minHeight = minHeight;

  return (
    <div
      id={id}
      className={`flex ${mobileLayout} ${flexDirection} ${gapClasses} ${padClasses} ${visClasses} ${className}`
        .replace(/\s+/g, " ")
        .trim()}
      style={Object.keys(inlineStyle).length > 0 ? inlineStyle : undefined}
    >
      {/* Sticky element */}
      <div
        className={`${isTop ? "" : widthClasses} ${mobileOrderClass} shrink-0`.trim()}
        style={{
          position: "sticky",
          top: stickyOffset,
          alignSelf: "flex-start",
        }}
      >
        {stickyChild}
      </div>

      {/* Scrolling content */}
      <div className={`grow min-w-0 ${scrollOrderClass}`.trim()}>
        {scrollChildren}
      </div>
    </div>
  );
}

// ============================================================================
// ANIMATE — Universal animation wrapper (Phase 3)
// Entrance, loop, scroll-driven, stagger children
// ============================================================================

export interface AnimateEntranceConfig {
  type?: keyof typeof entranceAnimationPresets;
  duration?: number;
  delay?: number;
  easing?:
    | "ease"
    | "ease-in"
    | "ease-out"
    | "ease-in-out"
    | "spring"
    | "bounce";
  once?: boolean;
  threshold?: number;
}

export interface AnimateLoopConfig {
  type?:
    | "none"
    | "pulse"
    | "bounce"
    | "spin"
    | "ping"
    | "float"
    | "shimmer"
    | "breathe"
    | "wiggle"
    | "swing";
  duration?: number;
  delay?: number;
}

export interface AnimateScrollConfig {
  type?:
    | "none"
    | "parallax"
    | "fade-on-scroll"
    | "scale-on-scroll"
    | "rotate-on-scroll"
    | "slide-on-scroll"
    | "progress-reveal";
  speed?: number;
  direction?: "up" | "down" | "left" | "right";
  range?: [number, number];
}

export interface AnimateStaggerConfig {
  enabled?: boolean;
  delay?: number;
  direction?: "normal" | "reverse" | "center";
}

export interface AnimateProps {
  entrance?: AnimateEntranceConfig;
  loop?: AnimateLoopConfig;
  scroll?: AnimateScrollConfig;
  stagger?: AnimateStaggerConfig;
  id?: string;
  className?: string;
  children?: React.ReactNode;
}

export function AnimateRender({
  entrance,
  loop,
  scroll: scrollConfig,
  stagger,
  id,
  className = "",
  children,
}: AnimateProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = React.useState(false);
  const [hasAnimated, setHasAnimated] = React.useState(false);
  const [scrollProgress, setScrollProgress] = React.useState(0);

  /* --- Prefetch reduced motion preference --- */
  const prefersReducedMotion = React.useRef(false);
  React.useEffect(() => {
    prefersReducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
  }, []);

  /* --- Entrance: IntersectionObserver --- */
  const entranceType = entrance?.type || "none";
  const once = entrance?.once !== false;
  const threshold = entrance?.threshold ?? 0.2;

  React.useEffect(() => {
    if (entranceType === "none" || prefersReducedMotion.current) {
      setIsVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            setHasAnimated(true);
            observer.disconnect();
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [entranceType, threshold, once]);

  /* --- Scroll-driven animation --- */
  const scrollType = scrollConfig?.type || "none";

  React.useEffect(() => {
    if (scrollType === "none" || prefersReducedMotion.current) return;
    const el = ref.current;
    if (!el) return;

    const handleScroll = () => {
      const rect = el.getBoundingClientRect();
      const viewH = window.innerHeight;
      const progress = Math.max(0, Math.min(1, 1 - rect.top / viewH));
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrollType]);

  /* --- Build entrance styles --- */
  const preset =
    entranceAnimationPresets[entranceType] || entranceAnimationPresets.none;
  const shouldShow =
    isVisible && (!once || !hasAnimated || entranceType === "none");
  const entranceDuration = entrance?.duration ?? 600;
  const entranceDelay = entrance?.delay ?? 0;
  const entranceEasing =
    easingMap[entrance?.easing || "ease-out"] || "ease-out";

  const entranceStyle: React.CSSProperties = {
    ...(shouldShow
      ? (preset.animate as React.CSSProperties)
      : (preset.initial as React.CSSProperties)),
    transition:
      entranceType !== "none"
        ? `all ${entranceDuration}ms ${entranceEasing} ${entranceDelay}ms`
        : undefined,
  };

  /* --- Build scroll-driven styles --- */
  const scrollStyle: React.CSSProperties = {};
  if (scrollType !== "none") {
    const speed = scrollConfig?.speed ?? 1;
    const range = scrollConfig?.range || [0, 1];
    const normalized = Math.max(
      0,
      Math.min(1, (scrollProgress - range[0]) / (range[1] - range[0])),
    );
    const dir = scrollConfig?.direction || "up";

    switch (scrollType) {
      case "parallax": {
        const offset = (normalized - 0.5) * 100 * speed;
        const axis = dir === "left" || dir === "right" ? "X" : "Y";
        const sign = dir === "down" || dir === "right" ? 1 : -1;
        scrollStyle.transform = `translate${axis}(${offset * sign}px)`;
        break;
      }
      case "fade-on-scroll":
        scrollStyle.opacity = normalized;
        break;
      case "scale-on-scroll":
        scrollStyle.transform = `scale(${0.5 + normalized * 0.5 * speed})`;
        break;
      case "rotate-on-scroll":
        scrollStyle.transform = `rotate(${normalized * 360 * speed}deg)`;
        break;
      case "slide-on-scroll": {
        const axis = dir === "left" || dir === "right" ? "X" : "Y";
        const sign = dir === "right" || dir === "down" ? 1 : -1;
        const dist = (1 - normalized) * 200 * speed;
        scrollStyle.transform = `translate${axis}(${dist * sign}px)`;
        break;
      }
      case "progress-reveal":
        scrollStyle.clipPath = `inset(0 ${(1 - normalized) * 100}% 0 0)`;
        break;
    }
  }

  /* --- Build loop classes/styles --- */
  const loopType = loop?.type || "none";
  let loopClass = "";
  let loopStyleTag: React.ReactNode = null;
  const loopAnimName = `dramac-loop-${loopType}`;

  if (loopType !== "none" && !prefersReducedMotion.current) {
    const tailwindLoop = loopAnimationMap[loopType];
    if (tailwindLoop) {
      loopClass = tailwindLoop;
    } else {
      const custom = customLoopKeyframes[loopType];
      if (custom) {
        const dur = loop?.duration || custom.defaultDuration;
        const del = loop?.delay || 0;
        loopStyleTag = (
          <style>{`@keyframes ${loopAnimName}{${custom.keyframes}}`}</style>
        );
        Object.assign(scrollStyle, {
          animation: `${loopAnimName} ${dur}ms ease-in-out ${del}ms infinite`,
        });
      }
    }
  }

  /* --- Stagger children --- */
  const renderChildren = () => {
    if (!stagger?.enabled || !children) return children;
    const staggerDelay = stagger.delay ?? 100;
    const childArray = React.Children.toArray(children);
    const staggerDir = stagger.direction || "normal";

    return childArray.map((child, i) => {
      let delayIdx = i;
      if (staggerDir === "reverse") delayIdx = childArray.length - 1 - i;
      if (staggerDir === "center")
        delayIdx = Math.abs(i - Math.floor(childArray.length / 2));

      return (
        <div
          key={i}
          style={{
            transitionDelay: `${delayIdx * staggerDelay}ms`,
            ...(shouldShow
              ? (preset.animate as React.CSSProperties)
              : (preset.initial as React.CSSProperties)),
            transition: `all ${entranceDuration}ms ${entranceEasing} ${delayIdx * staggerDelay}ms`,
          }}
        >
          {child}
        </div>
      );
    });
  };

  const mergedStyle: React.CSSProperties = { ...entranceStyle, ...scrollStyle };

  return (
    <>
      {loopStyleTag}
      <div
        ref={ref}
        id={id}
        className={`${loopClass} ${className}`.trim()}
        style={Object.keys(mergedStyle).length > 0 ? mergedStyle : undefined}
      >
        {stagger?.enabled ? renderChildren() : children}
      </div>
    </>
  );
}

// ============================================================================
// TILT 3D CONTAINER — Cursor-tracking perspective tilt (Phase 3)
// ============================================================================

export interface Tilt3DContainerProps {
  enabled?: boolean;
  maxAngle?: number;
  speed?: number;
  glare?: boolean;
  glareMaxOpacity?: number;
  scale?: number;
  perspective?: number;
  children?: React.ReactNode;
  id?: string;
  className?: string;
}

export function Tilt3DContainerRender({
  enabled = true,
  maxAngle = 10,
  speed = 400,
  glare = false,
  glareMaxOpacity = 0.3,
  scale = 1.02,
  perspective = 1000,
  children,
  id,
  className = "",
}: Tilt3DContainerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = React.useState<React.CSSProperties>({});
  const [glarePos, setGlarePos] = React.useState({ x: 50, y: 50 });

  // Detect touch device — disable tilt on touch
  const isTouch = React.useRef(false);
  React.useEffect(() => {
    isTouch.current = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  }, []);

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent) => {
      if (!enabled || isTouch.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -maxAngle;
      const rotateY = ((x - centerX) / centerX) * maxAngle;

      setTiltStyle({
        transform: `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`,
        transition: `transform ${speed}ms cubic-bezier(0.03, 0.98, 0.52, 0.99)`,
        transformStyle: "preserve-3d",
      });
      setGlarePos({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
    },
    [enabled, maxAngle, perspective, scale, speed],
  );

  const handleMouseLeave = React.useCallback(() => {
    setTiltStyle({
      transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale(1)`,
      transition: `transform ${speed}ms cubic-bezier(0.03, 0.98, 0.52, 0.99)`,
      transformStyle: "preserve-3d",
    });
  }, [perspective, speed]);

  return (
    <div
      ref={containerRef}
      id={id}
      className={`relative ${className}`.trim()}
      style={enabled ? tiltStyle : undefined}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {glare && enabled && (
        <div
          className="absolute inset-0 pointer-events-none rounded-inherit"
          style={{
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,${glareMaxOpacity}), transparent 60%)`,
            borderRadius: "inherit",
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

// ============================================================================
// SHAPE DIVIDER — SVG section separator (Phase 3)
// Positioned absolutely at section top/bottom
// ============================================================================

export interface ShapeDividerProps {
  position?: "top" | "bottom";
  shape?:
    | "wave"
    | "wave-smooth"
    | "curve"
    | "tilt"
    | "triangle"
    | "arrow"
    | "zigzag"
    | "clouds"
    | "mountains"
    | "drops"
    | "pyramids";
  color?: string;
  height?: number;
  width?: number;
  flip?: boolean;
  invert?: boolean;
  animated?: boolean;
  id?: string;
  className?: string;
}

export function ShapeDividerRender({
  position = "bottom",
  shape = "wave",
  color = "#ffffff",
  height = 60,
  width = 100,
  flip = false,
  invert = false,
  animated = false,
  id,
  className = "",
}: ShapeDividerProps) {
  const pathData = shapeDividerPaths[shape] || shapeDividerPaths.wave;

  // Position: absolute top or bottom
  const posClass = position === "top" ? "top-0" : "bottom-0";

  // Flip/invert transforms
  const transforms: string[] = [];
  if (invert) transforms.push("scaleY(-1)");
  if (flip) transforms.push("scaleX(-1)");
  if (position === "bottom") transforms.push("rotate(180deg)");
  const transformStr = transforms.length > 0 ? transforms.join(" ") : undefined;

  // Animation: gentle morphing via CSS
  const animationStyle: React.CSSProperties = animated
    ? { animation: "dramac-shape-breathe 6s ease-in-out infinite" }
    : {};

  return (
    <>
      {animated && (
        <style>{`@keyframes dramac-shape-breathe{0%,100%{transform:${transformStr || "none"} scaleY(1)}50%{transform:${transformStr || "none"} scaleY(1.1)}}`}</style>
      )}
      <div
        id={id}
        className={`absolute left-0 right-0 ${posClass} pointer-events-none overflow-hidden ${className}`.trim()}
        style={{
          height: `${height}px`,
          transform: animated ? undefined : transformStr,
          lineHeight: 0,
          ...animationStyle,
        }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 1920 128"
          preserveAspectRatio="none"
          className="block w-full h-full"
          style={{ width: `${width}%`, minWidth: "100%" }}
        >
          <path d={pathData} fill={color} />
        </svg>
      </div>
    </>
  );
}

// ============================================================================
// CURSOR EFFECT — Spotlight, magnetic, tilt, glow, trail (Phase 3)
// ============================================================================

export interface CursorEffectProps {
  type?: "none" | "spotlight" | "tilt" | "magnetic" | "glow" | "trail";
  intensity?: number;
  color?: string;
  children?: React.ReactNode;
  id?: string;
  className?: string;
}

export function CursorEffectRender({
  type = "spotlight",
  intensity = 0.5,
  color = "rgba(255,255,255,0.15)",
  children,
  id,
  className = "",
}: CursorEffectProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = React.useState(false);
  const [magnetOffset, setMagnetOffset] = React.useState({ x: 0, y: 0 });

  // Detect touch device
  const isTouch = React.useRef(false);
  React.useEffect(() => {
    isTouch.current = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  }, []);

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent) => {
      if (type === "none" || isTouch.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePos({ x, y });

      // Magnetic: move element subtly toward cursor
      if (type === "magnetic") {
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const maxDist = 20 * intensity;
        const dx = ((x - centerX) / centerX) * maxDist;
        const dy = ((y - centerY) / centerY) * maxDist;
        setMagnetOffset({ x: dx, y: dy });
      }
    },
    [type, intensity],
  );

  const handleMouseLeave = React.useCallback(() => {
    setIsHovering(false);
    setMagnetOffset({ x: 0, y: 0 });
  }, []);

  if (type === "none") {
    return (
      <div id={id} className={className}>
        {children}
      </div>
    );
  }

  // Build effect overlay/styles
  let effectOverlay: React.ReactNode = null;
  const containerStyle: React.CSSProperties = {
    position: "relative",
    overflow: "hidden",
  };

  if (type === "spotlight") {
    effectOverlay = isHovering ? (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle 200px at ${mousePos.x}px ${mousePos.y}px, ${color}, transparent)`,
          opacity: intensity,
        }}
        aria-hidden="true"
      />
    ) : null;
  }

  if (type === "glow") {
    effectOverlay = isHovering ? (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: `inset 0 0 80px ${color}`,
          opacity: intensity,
        }}
        aria-hidden="true"
      />
    ) : null;
  }

  if (type === "magnetic") {
    containerStyle.transform = `translate(${magnetOffset.x}px, ${magnetOffset.y}px)`;
    containerStyle.transition = "transform 0.3s ease-out";
  }

  if (type === "tilt") {
    if (containerRef.current && isHovering) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const maxTilt = 10 * intensity;
      const rotateX = ((mousePos.y - centerY) / centerY) * -maxTilt;
      const rotateY = ((mousePos.x - centerX) / centerX) * maxTilt;
      containerStyle.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      containerStyle.transition = "transform 0.1s ease-out";
    }
  }

  if (type === "trail" && isHovering) {
    const trailCount = Math.round(5 * intensity);
    effectOverlay = (
      <>
        {Array.from({ length: trailCount }, (_, i) => (
          <div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: mousePos.x - 4,
              top: mousePos.y - 4,
              width: 8 - i,
              height: 8 - i,
              backgroundColor: color,
              opacity: (1 - i / trailCount) * intensity,
              transition: `all ${0.05 + i * 0.05}s ease-out`,
              transform: `translate(${-i * 2}px, ${-i * 2}px)`,
            }}
            aria-hidden="true"
          />
        ))}
      </>
    );
  }

  return (
    <div
      ref={containerRef}
      id={id}
      className={`${className}`.trim()}
      style={containerStyle}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {effectOverlay}
    </div>
  );
}

// ============================================================================
// HEADING - Responsive heading with type-scale CSS variables
// ============================================================================

export interface HeadingProps {
  text?: string;
  children?: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  color?: string;
  align?: ResponsiveValue<"left" | "center" | "right">;
  fontWeight?:
    | "light"
    | "normal"
    | "medium"
    | "semibold"
    | "bold"
    | "extrabold"
    | "100"
    | "200"
    | "300"
    | "400"
    | "500"
    | "600"
    | "700"
    | "800"
    | "900"
    | number;
  fontFamily?: string;
  fontSize?: string;
  lineHeight?: string;
  letterSpacing?: string;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  fontStyle?: "normal" | "italic";
  gradient?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
  gradientDirection?:
    | "to right"
    | "to left"
    | "to bottom"
    | "to top"
    | "to bottom right"
    | "to bottom left"
    | "to top right"
    | "to top left";
  textShadow?: string;
  textDecoration?: "none" | "underline" | "line-through";
  maxWidth?: string;
  textWrap?: "balance" | "pretty" | "wrap" | "nowrap";
  marginBottom?: ResponsiveValue<"none" | "xs" | "sm" | "md" | "lg">;
  uppercase?: boolean; // Backwards compat — prefer textTransform
  id?: string;
  className?: string;
}

// Default typography per heading level — used when CSS vars unavailable
const HEADING_DEFAULTS: Record<
  number,
  { size: string; lineHeight: string; letterSpacing: string; weight: number }
> = {
  1: {
    size: "3rem",
    lineHeight: "1.1",
    letterSpacing: "-0.025em",
    weight: 800,
  },
  2: {
    size: "2.25rem",
    lineHeight: "1.2",
    letterSpacing: "-0.02em",
    weight: 700,
  },
  3: {
    size: "1.875rem",
    lineHeight: "1.25",
    letterSpacing: "-0.015em",
    weight: 700,
  },
  4: {
    size: "1.5rem",
    lineHeight: "1.3",
    letterSpacing: "-0.01em",
    weight: 600,
  },
  5: {
    size: "1.25rem",
    lineHeight: "1.4",
    letterSpacing: "-0.005em",
    weight: 600,
  },
  6: { size: "1.125rem", lineHeight: "1.4", letterSpacing: "0em", weight: 600 },
};

export function HeadingRender({
  text = "Heading",
  children,
  level = 2,
  color,
  align = "left",
  fontWeight,
  fontFamily,
  fontSize,
  lineHeight,
  letterSpacing,
  textTransform = "none",
  fontStyle = "normal",
  gradient = false,
  gradientFrom = "",
  gradientTo = "",
  gradientDirection = "to right",
  textShadow,
  textDecoration = "none",
  maxWidth,
  textWrap = "balance",
  marginBottom = "md",
  uppercase = false,
  id,
  className = "",
}: HeadingProps) {
  const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;
  const defaults = HEADING_DEFAULTS[level] || HEADING_DEFAULTS[2];

  const alignMap: Record<
    string,
    { mobile: string; tablet: string; desktop: string }
  > = {
    left: {
      mobile: "text-left",
      tablet: "md:text-left",
      desktop: "lg:text-left",
    },
    center: {
      mobile: "text-center",
      tablet: "md:text-center",
      desktop: "lg:text-center",
    },
    right: {
      mobile: "text-right",
      tablet: "md:text-right",
      desktop: "lg:text-right",
    },
  };

  const marginBottomMap: Record<
    string,
    { mobile: string; tablet: string; desktop: string }
  > = {
    none: { mobile: "mb-0", tablet: "md:mb-0", desktop: "lg:mb-0" },
    xs: { mobile: "mb-1", tablet: "md:mb-2", desktop: "lg:mb-2" },
    sm: { mobile: "mb-2", tablet: "md:mb-3", desktop: "lg:mb-4" },
    md: { mobile: "mb-3", tablet: "md:mb-4", desktop: "lg:mb-6" },
    lg: { mobile: "mb-4", tablet: "md:mb-6", desktop: "lg:mb-8" },
  };

  const alignClasses = getResponsiveClasses(align, alignMap);
  const mbClasses = getResponsiveClasses(marginBottom, marginBottomMap);

  // Resolve font weight — accept numeric or named values
  const resolvedWeight = (() => {
    if (typeof fontWeight === "number") return fontWeight;
    if (fontWeight && /^\d+$/.test(String(fontWeight)))
      return Number(fontWeight);
    const namedWeights: Record<string, number> = {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    };
    return fontWeight
      ? namedWeights[fontWeight] || defaults.weight
      : defaults.weight;
  })();

  // Resolve textTransform — backwards compat with `uppercase` boolean
  const resolvedTransform =
    textTransform !== "none" ? textTransform : uppercase ? "uppercase" : "none";

  // Build inline styles using CSS vars with smart fallbacks
  const headingVar = `h${level}`;
  const style: React.CSSProperties = {
    fontFamily: fontFamily || `var(--font-heading, inherit)`,
    fontSize: fontSize || `var(--type-${headingVar}, ${defaults.size})`,
    lineHeight:
      lineHeight || `var(--leading-${headingVar}, ${defaults.lineHeight})`,
    letterSpacing:
      letterSpacing ||
      `var(--tracking-${headingVar}, ${defaults.letterSpacing})`,
    fontWeight: resolvedWeight,
    fontStyle: fontStyle !== "normal" ? fontStyle : undefined,
    textTransform: resolvedTransform !== "none" ? resolvedTransform : undefined,
    textDecoration: textDecoration !== "none" ? textDecoration : undefined,
    textShadow: textShadow || undefined,
    maxWidth: maxWidth || undefined,
    textWrap: textWrap !== "wrap" ? textWrap : undefined,
    color: gradient ? undefined : color || undefined,
    backgroundImage: gradient
      ? `linear-gradient(${gradientDirection}, ${gradientFrom}, ${gradientTo})`
      : undefined,
  } as React.CSSProperties;

  return (
    <Tag
      id={id}
      className={`${alignClasses} ${mbClasses} ${gradient ? "bg-clip-text text-transparent" : ""} ${className}`.trim()}
      style={style}
    >
      {children || text}
    </Tag>
  );
}

// ============================================================================
// TEXT - Paragraph text with full typography controls
// ============================================================================

export interface TextProps {
  text?: string;
  children?: React.ReactNode;
  color?: string;
  align?: ResponsiveValue<"left" | "center" | "right" | "justify">;
  alignment?: ResponsiveValue<"left" | "center" | "right" | "justify">; // Alternative name from registry
  fontSize?:
    | "xs"
    | "sm"
    | "base"
    | "lg"
    | "xl"
    | "2xl"
    | "3xl"
    | "4xl"
    | "5xl"
    | "6xl"
    | "7xl"
    | "8xl";
  fontWeight?:
    | "light"
    | "normal"
    | "medium"
    | "semibold"
    | "bold"
    | "100"
    | "200"
    | "300"
    | "400"
    | "500"
    | "600"
    | "700"
    | "800"
    | "900"
    | number;
  lineHeight?: "tight" | "normal" | "relaxed" | "loose" | string;
  italic?: boolean;
  underline?: boolean;
  maxWidth?: "none" | "prose" | "md" | "lg" | "xl" | string;
  marginBottom?: ResponsiveValue<"none" | "xs" | "sm" | "md" | "lg">;
  // Typography controls
  htmlTag?: "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "span" | "div";
  fontFamily?: string;
  letterSpacing?: string;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  textDecoration?: "none" | "underline" | "line-through";
  textShadow?: string;
  // Advanced typography
  dropCap?: boolean;
  columns?: 1 | 2 | 3;
  textWrap?: "balance" | "pretty" | "wrap" | "nowrap";
  hyphens?: "none" | "auto" | "manual";
  truncate?: boolean | number; // true = 1 line, number = N lines
  id?: string;
  className?: string;
}

export function TextRender({
  text = "Text content",
  children,
  color,
  align = "left",
  alignment, // Alternative prop name from registry
  fontSize = "base",
  fontWeight = "normal",
  lineHeight = "relaxed",
  italic = false,
  underline = false,
  maxWidth = "none",
  marginBottom = "md",
  // Typography props
  htmlTag = "p",
  fontFamily,
  letterSpacing = "0",
  textTransform = "none",
  textDecoration = "none",
  textShadow,
  // Advanced typography
  dropCap = false,
  columns,
  textWrap,
  hyphens,
  truncate,
  id,
  className = "",
}: TextProps) {
  // Use alignment if align is not provided (for backward compatibility)
  const effectiveAlign = alignment || align;

  const alignMap: Record<
    string,
    { mobile: string; tablet: string; desktop: string }
  > = {
    left: {
      mobile: "text-left",
      tablet: "md:text-left",
      desktop: "lg:text-left",
    },
    center: {
      mobile: "text-center",
      tablet: "md:text-center",
      desktop: "lg:text-center",
    },
    right: {
      mobile: "text-right",
      tablet: "md:text-right",
      desktop: "lg:text-right",
    },
    justify: {
      mobile: "text-justify",
      tablet: "md:text-justify",
      desktop: "lg:text-justify",
    },
  };

  const marginBottomMap: Record<
    string,
    { mobile: string; tablet: string; desktop: string }
  > = {
    none: { mobile: "mb-0", tablet: "md:mb-0", desktop: "lg:mb-0" },
    xs: { mobile: "mb-1", tablet: "md:mb-1", desktop: "lg:mb-2" },
    sm: { mobile: "mb-2", tablet: "md:mb-2", desktop: "lg:mb-3" },
    md: { mobile: "mb-3", tablet: "md:mb-4", desktop: "lg:mb-4" },
    lg: { mobile: "mb-4", tablet: "md:mb-5", desktop: "lg:mb-6" },
  };

  const alignClasses = getResponsiveClasses(effectiveAlign, alignMap);
  const mbClasses = getResponsiveClasses(marginBottom, marginBottomMap);

  // Resolve font weight — accept numeric or named values
  const resolvedWeight = (() => {
    if (typeof fontWeight === "number") return fontWeight;
    if (/^\d+$/.test(String(fontWeight))) return Number(fontWeight);
    const namedWeights: Record<string, number> = {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    };
    return namedWeights[String(fontWeight)] || 400;
  })();

  // Max width classes
  const maxWidthPresets: Record<string, string> = {
    none: "",
    prose: "max-w-prose",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };
  const maxWClass = maxWidthPresets[maxWidth] || "";

  // Text decoration (replaces underline prop)
  const textDecorationClass =
    textDecoration !== "none" ? textDecoration : underline ? "underline" : "";

  // Truncate classes
  const truncateClass = (() => {
    if (!truncate) return "";
    if (truncate === true || truncate === 1) return "truncate";
    const clampMap: Record<number, string> = {
      2: "line-clamp-2",
      3: "line-clamp-3",
      4: "line-clamp-4",
      5: "line-clamp-5",
      6: "line-clamp-6",
    };
    return clampMap[truncate as number] || "line-clamp-3";
  })();

  // Column classes
  const columnClass =
    columns && columns > 1
      ? `${({ 2: "columns-2", 3: "columns-3" } as Record<number, string>)[columns] || "columns-2"} gap-8`
      : "";

  // Drop cap styles
  const dropCapCSS = dropCap
    ? "[&::first-letter]:text-[3em] [&::first-letter]:font-bold [&::first-letter]:float-left [&::first-letter]:leading-[0.8] [&::first-letter]:mr-2 [&::first-letter]:mt-1"
    : "";

  // Build inline styles using CSS vars with fallbacks
  const style: React.CSSProperties = {
    color: color || undefined,
    fontFamily: fontFamily || `var(--font-body, inherit)`,
    fontSize: `var(--type-${fontSize}, ${fontSize === "base" ? "1rem" : undefined})`,
    fontWeight: resolvedWeight,
    lineHeight:
      lineHeight === "tight"
        ? "1.25"
        : lineHeight === "normal"
          ? "1.5"
          : lineHeight === "relaxed"
            ? "1.625"
            : lineHeight === "loose"
              ? "2"
              : lineHeight || undefined,
    letterSpacing: letterSpacing !== "0" ? letterSpacing : undefined,
    textTransform: textTransform !== "none" ? textTransform : undefined,
    textShadow: textShadow || undefined,
    textWrap: textWrap && textWrap !== "wrap" ? textWrap : undefined,
    hyphens: hyphens && hyphens !== "none" ? hyphens : undefined,
    maxWidth:
      !maxWidthPresets[maxWidth] && maxWidth !== "none" ? maxWidth : undefined,
  } as React.CSSProperties;

  // Validate tag
  const validTags = [
    "p",
    "span",
    "div",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
  ] as const;
  type ValidTag = (typeof validTags)[number];
  const tag: ValidTag = validTags.includes(htmlTag as ValidTag)
    ? (htmlTag as ValidTag)
    : "p";

  const baseClassName =
    `${alignClasses} ${mbClasses} ${maxWClass} ${italic ? "italic" : ""} ${textDecorationClass} ${truncateClass} ${columnClass} ${dropCapCSS} ${className}`
      .trim()
      .replace(/\s+/g, " ");

  return React.createElement(
    tag,
    { id, className: baseClassName, style },
    children || text,
  );
}

// ============================================================================
// RICH TEXT - Full section content block with title, subtitle, layout, colors
// ============================================================================

export interface RichTextProps {
  // Content
  content?: string;
  title?: string;
  subtitle?: string;
  pullQuote?: string;
  // Layout
  layout?: "centered" | "left" | "two-column" | "wide";
  // Colors — all optional, inherit from brand vars when unset
  color?: string;
  textColor?: string;
  titleColor?: string;
  subtitleColor?: string;
  accentColor?: string;
  pullQuoteColor?: string;
  backgroundColor?: string;
  cardBackgroundColor?: string;
  // Divider
  showDivider?: boolean;
  dividerColor?: string;
  highlightColor?: string;
  // Typography
  proseSize?: "sm" | "base" | "lg" | "xl";
  maxWidth?: "none" | "prose" | "md" | "lg" | "xl" | "4xl" | "6xl";
  titleLevel?: "h1" | "h2" | "h3" | "h4";
  titleFontFamily?: string;
  bodyFontFamily?: string;
  titleFontSize?: string;
  id?: string;
  className?: string;
}

/**
 * Converts markdown-style formatting in text to HTML.
 * Handles: **bold**, *italic*, headings (#-####), [links](url),
 * `inline code`, bullet/numbered lists, horizontal rules, newlines.
 * Shared by RichText, Accordion, and Tabs renderers.
 */
function markdownToHtml(text: string): string {
  if (!text) return "";
  // If it already looks like HTML, return as-is
  if (/<[a-z][\s\S]*>/i.test(text)) return text;

  let html = text;

  // Headings: #### h4, ### h3, ## h2, # h1 (must be at start of line)
  html = html.replace(
    /^####\s+(.+)$/gm,
    '<h4 class="text-lg font-semibold mt-6 mb-2">$1</h4>',
  );
  html = html.replace(
    /^###\s+(.+)$/gm,
    '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>',
  );
  html = html.replace(
    /^##\s+(.+)$/gm,
    '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>',
  );
  html = html.replace(
    /^#\s+(.+)$/gm,
    '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>',
  );

  // Horizontal rules: --- or *** or ___
  html = html.replace(
    /^(?:---|\*\*\*|___)\s*$/gm,
    '<hr class="my-6 border-current opacity-20" />',
  );

  // Bold: **text** or __text__
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");

  // Italic: *text* or _text_
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/_(.+?)_/g, "<em>$1</em>");

  // Inline code: `code`
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="px-1.5 py-0.5 rounded bg-black/5 text-[0.9em] font-mono">$1</code>',
  );

  // Links: [text](url)
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="underline underline-offset-2 hover:opacity-80" rel="noopener noreferrer">$1</a>',
  );

  // Ordered lists: lines starting with 1. 2. etc
  html = html.replace(
    /(?:^|\n)\d+\.\s+(.+)/g,
    '<li class="ml-6 list-decimal">$1</li>',
  );

  // Bullet lists: lines starting with • or -
  html = html.replace(
    /(?:^|\n)[•\-]\s*(.+)/g,
    '<li class="ml-6 list-disc">$1</li>',
  );

  // Wrap consecutive <li> elements in <ul>/<ol>
  html = html.replace(
    /(<li class="ml-6 list-disc">[\s\S]*?<\/li>)+/g,
    '<ul class="my-4 space-y-1">$&</ul>',
  );
  html = html.replace(
    /(<li class="ml-6 list-decimal">[\s\S]*?<\/li>)+/g,
    '<ol class="my-4 space-y-1">$&</ol>',
  );

  // Paragraphs from double newlines
  html = html.replace(/\n\n/g, "</p><p>");
  // Single newlines to line breaks
  html = html.replace(/\n/g, "<br/>");

  return html;
}

export function RichTextRender({
  content = "",
  title,
  subtitle,
  pullQuote,
  layout = "centered",
  color,
  textColor,
  titleColor,
  subtitleColor,
  accentColor,
  pullQuoteColor,
  backgroundColor,
  cardBackgroundColor,
  showDivider = false,
  dividerColor,
  highlightColor,
  proseSize = "lg",
  maxWidth = "4xl",
  titleLevel = "h2",
  titleFontFamily,
  bodyFontFamily,
  titleFontSize,
  id,
  className = "",
}: RichTextProps) {
  // Colors — all inherit from CSS vars when unset (no hardcoded fallbacks)
  const resolvedTextColor = textColor || color || undefined;
  const resolvedTitleColor = titleColor || accentColor || resolvedTextColor;
  const resolvedSubtitleColor = subtitleColor || resolvedTextColor;
  const resolvedPullQuoteColor =
    pullQuoteColor || accentColor || resolvedTitleColor;
  const resolvedDividerColor =
    dividerColor || highlightColor || accentColor || resolvedTitleColor;

  const proseSizeClass =
    { sm: "prose-sm", base: "prose", lg: "prose-lg", xl: "prose-xl" }[
      proseSize
    ] || "prose";
  const maxWClass =
    {
      none: "max-w-none",
      prose: "max-w-prose",
      md: "max-w-md",
      lg: "max-w-lg",
      xl: "max-w-xl",
      "4xl": "max-w-4xl",
      "6xl": "max-w-6xl",
    }[maxWidth] || "max-w-4xl";

  const htmlContent = markdownToHtml(content);
  const hasTitle = title && title.length > 0;
  const hasSubtitle = subtitle && subtitle.length > 0;
  const hasPullQuote = pullQuote && pullQuote.length > 0;
  const isTwoColumn = layout === "two-column";
  const isCentered = layout === "centered";

  const TitleTag = titleLevel as keyof React.JSX.IntrinsicElements;

  return (
    <section
      id={id}
      className={`py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 ${className}`}
      style={{ backgroundColor: backgroundColor || undefined }}
    >
      <div className={`${maxWClass} mx-auto`}>
        {/* Title & Subtitle */}
        {(hasTitle || hasSubtitle) && (
          <div className={`mb-10 md:mb-12 ${isCentered ? "text-center" : ""}`}>
            {hasTitle && (
              <TitleTag
                className="font-bold leading-tight mb-4"
                style={{
                  color: resolvedTitleColor || undefined,
                  fontFamily: titleFontFamily || `var(--font-heading, inherit)`,
                  fontSize:
                    titleFontSize ||
                    `var(--type-${titleLevel}, var(--type-4xl, 2.25rem))`,
                  lineHeight: `var(--leading-${titleLevel}, 1.2)`,
                  letterSpacing: `var(--tracking-${titleLevel}, -0.02em)`,
                }}
              >
                {title}
              </TitleTag>
            )}
            {showDivider && (
              <div
                className={`w-16 h-1 rounded-full mb-6 ${isCentered ? "mx-auto" : ""}`}
                style={{ backgroundColor: resolvedDividerColor || undefined }}
              />
            )}
            {hasSubtitle && (
              <p
                className="text-lg md:text-xl leading-relaxed max-w-3xl"
                style={{
                  color: resolvedSubtitleColor || undefined,
                  fontFamily: bodyFontFamily || `var(--font-body, inherit)`,
                  ...(isCentered
                    ? { marginLeft: "auto", marginRight: "auto" }
                    : {}),
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Content area */}
        <div
          className={
            isTwoColumn ? "grid md:grid-cols-2 gap-8 md:gap-12 items-start" : ""
          }
        >
          {/* Main content */}
          <div
            className={`${proseSizeClass} max-w-none prose-headings:font-bold prose-p:leading-relaxed prose-strong:font-semibold [&_*]:!text-inherit`}
            style={{
              color: resolvedTextColor || undefined,
              fontFamily: bodyFontFamily || `var(--font-body, inherit)`,
              ...(accentColor
                ? ({ "--tw-prose-links": accentColor } as React.CSSProperties)
                : {}),
            }}
            dangerouslySetInnerHTML={{
              __html: htmlContent || "<p>Content goes here.</p>",
            }}
          />

          {/* Pull quote (right column in two-column, or below content) */}
          {hasPullQuote && (
            <div
              className={`${isTwoColumn ? "" : "mt-10 md:mt-12"}`}
              style={
                cardBackgroundColor
                  ? {
                      backgroundColor: cardBackgroundColor,
                      borderRadius: "12px",
                      padding: "2rem",
                    }
                  : undefined
              }
            >
              <blockquote
                className="border-l-4 pl-6 py-2 text-xl md:text-2xl font-medium italic leading-relaxed"
                style={{
                  borderColor: resolvedDividerColor || undefined,
                  color: resolvedPullQuoteColor || undefined,
                }}
              >
                &ldquo;{pullQuote}&rdquo;
              </blockquote>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// QUOTE - Blockquote with multiple variants and full typography controls
// ============================================================================

export interface QuoteProps {
  text?: string;
  author?: string;
  authorTitle?: string;
  authorImage?: string | ImageValue;
  borderColor?: string;
  backgroundColor?: string;
  textColor?: string;
  variant?:
    | "simple"
    | "bordered"
    | "card"
    | "modern"
    | "pullquote"
    | "testimonial";
  size?: "sm" | "md" | "lg";
  fontFamily?: string;
  fontStyle?: "normal" | "italic";
  id?: string;
  className?: string;
}

export function QuoteRender({
  text = "Quote text here...",
  author = "Author Name",
  authorTitle,
  authorImage,
  borderColor,
  backgroundColor,
  textColor,
  variant = "bordered",
  size = "md",
  fontFamily,
  fontStyle = "italic",
  id,
  className = "",
}: QuoteProps) {
  // Normalize image value
  const authorImageUrl = getImageUrl(authorImage);

  const sizeStyles = {
    sm: {
      text: "text-base md:text-lg",
      author: "text-sm",
      padding: "p-4 md:p-6",
      avatar: "w-8 h-8",
    },
    md: {
      text: "text-lg md:text-xl lg:text-2xl",
      author: "text-sm md:text-base",
      padding: "p-6 md:p-8",
      avatar: "w-10 h-10",
    },
    lg: {
      text: "text-xl md:text-2xl lg:text-3xl",
      author: "text-base md:text-lg",
      padding: "p-8 md:p-10",
      avatar: "w-12 h-12",
    },
  }[size];

  const resolvedFontFamily = fontFamily || `var(--font-body, inherit)`;
  const dark = isDarkBackground(backgroundColor);
  const resolvedTextColor = resolveContrastColor(textColor || (dark ? "#f8fafc" : "#1f2937"), dark);

  // Author footer — shared across variants
  const renderAuthor = (centered = false) =>
    author ? (
      <footer
        className={`mt-4 ${sizeStyles.author} flex items-center gap-3 ${centered ? "justify-center" : ""}`}
      >
        {authorImageUrl && (
          <img
            src={authorImageUrl}
            alt={author}
            className={`${sizeStyles.avatar} rounded-full object-cover`}
          />
        )}
        <div className={centered ? "text-center" : ""}>
          <cite
            className="not-italic font-semibold block"
            style={{ color: resolvedTextColor }}
          >
            {centered ? author : `— ${author}`}
          </cite>
          {authorTitle && (
            <span className="opacity-75 block">{authorTitle}</span>
          )}
        </div>
      </footer>
    ) : null;

  if (variant === "bordered") {
    return (
      <blockquote
        id={id}
        className={`border-l-4 ${sizeStyles.padding} pl-6 ${className}`}
        style={{
          borderColor: borderColor || undefined,
          backgroundColor: backgroundColor || undefined,
          fontFamily: resolvedFontFamily,
        }}
      >
        <p
          className={`${sizeStyles.text} ${fontStyle === "italic" ? "italic" : ""} leading-relaxed`}
          style={{ color: resolvedTextColor }}
        >
          &ldquo;{text}&rdquo;
        </p>
        {renderAuthor()}
      </blockquote>
    );
  }

  if (variant === "card") {
    return (
      <blockquote
        id={id}
        className={`${sizeStyles.padding} rounded-xl shadow-lg text-center ${className}`}
        style={{
          backgroundColor: backgroundColor || undefined,
          fontFamily: resolvedFontFamily,
        }}
      >
        <svg
          className="w-8 h-8 mb-4 mx-auto opacity-20"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
        </svg>
        <p
          className={`${sizeStyles.text} leading-relaxed`}
          style={{ color: resolvedTextColor }}
        >
          {text}
        </p>
        {renderAuthor(true)}
      </blockquote>
    );
  }

  if (variant === "modern") {
    return (
      <blockquote
        id={id}
        className={`${sizeStyles.padding} relative ${className}`}
        style={{
          backgroundColor: backgroundColor || undefined,
          fontFamily: resolvedFontFamily,
        }}
      >
        {/* Large decorative quote mark */}
        <span
          className="absolute top-0 left-4 text-[6rem] leading-none opacity-10 font-serif pointer-events-none select-none"
          style={{ color: borderColor || resolvedTextColor }}
          aria-hidden="true"
        >
          &ldquo;
        </span>
        <p
          className={`${sizeStyles.text} ${fontStyle === "italic" ? "italic" : ""} leading-relaxed relative z-10 pt-10`}
          style={{ color: resolvedTextColor }}
        >
          {text}
        </p>
        {author && (
          <footer
            className={`mt-6 ${sizeStyles.author} flex items-center gap-4`}
          >
            {authorImageUrl && (
              <img
                src={authorImageUrl}
                alt={author}
                className={`${sizeStyles.avatar} rounded-full object-cover`}
              />
            )}
            <div>
              <div
                className="w-8 h-0.5 mb-2 rounded-full"
                style={{
                  backgroundColor: borderColor || resolvedTextColor,
                }}
              />
              <cite
                className="not-italic font-semibold block"
                style={{ color: resolvedTextColor }}
              >
                {author}
              </cite>
              {authorTitle && (
                <span className="opacity-75 block">{authorTitle}</span>
              )}
            </div>
          </footer>
        )}
      </blockquote>
    );
  }

  if (variant === "pullquote") {
    return (
      <blockquote
        id={id}
        className={`${sizeStyles.padding} border-y-2 text-center ${className}`}
        style={{
          borderColor: borderColor || undefined,
          fontFamily: resolvedFontFamily,
        }}
      >
        <p
          className={`${sizeStyles.text} ${fontStyle === "italic" ? "italic" : ""} font-medium leading-relaxed`}
          style={{ color: resolvedTextColor }}
        >
          &ldquo;{text}&rdquo;
        </p>
        {renderAuthor(true)}
      </blockquote>
    );
  }

  if (variant === "testimonial") {
    return (
      <blockquote
        id={id}
        className={`${sizeStyles.padding} rounded-2xl text-center ${className}`}
        style={{
          backgroundColor: backgroundColor || undefined,
          fontFamily: resolvedFontFamily,
        }}
      >
        {/* Star rating decoration */}
        <div className="flex justify-center gap-1 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              className="w-5 h-5"
              fill={borderColor || "currentColor"}
              viewBox="0 0 20 20"
              style={{ opacity: 0.8 }}
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <p
          className={`${sizeStyles.text} leading-relaxed`}
          style={{ color: resolvedTextColor }}
        >
          &ldquo;{text}&rdquo;
        </p>
        {author && (
          <footer
            className={`mt-6 ${sizeStyles.author} flex flex-col items-center gap-3`}
          >
            {authorImageUrl && (
              <img
                src={authorImageUrl}
                alt={author}
                className={`${sizeStyles.avatar} rounded-full object-cover`}
              />
            )}
            <div className="text-center">
              <cite
                className="not-italic font-semibold block"
                style={{ color: resolvedTextColor }}
              >
                {author}
              </cite>
              {authorTitle && (
                <span className="opacity-75 block">{authorTitle}</span>
              )}
            </div>
          </footer>
        )}
      </blockquote>
    );
  }

  // Simple variant (default fallback)
  return (
    <blockquote
      id={id}
      className={`${sizeStyles.padding} ${className}`}
      style={{ fontFamily: resolvedFontFamily }}
    >
      <p
        className={`${sizeStyles.text} ${fontStyle === "italic" ? "italic" : ""} leading-relaxed`}
        style={{
          color: resolvedTextColor,
          fontFamily: resolvedFontFamily,
        }}
      >
        &ldquo;{text}&rdquo;
      </p>
      {author && (
        <footer className={`mt-4 ${sizeStyles.author}`}>
          <cite className="not-italic font-medium">— {author}</cite>
          {authorTitle && (
            <span className="block opacity-75 mt-1">{authorTitle}</span>
          )}
        </footer>
      )}
    </blockquote>
  );
}

// ============================================================================
// LABEL - Small utility text for tags, badges, categories, overlines
// ============================================================================

export interface LabelProps {
  text?: string;
  children?: React.ReactNode;
  variant?:
    | "default"
    | "badge"
    | "overline"
    | "tag"
    | "pill"
    | "outline"
    | "subtle";
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  size?: "xs" | "sm" | "md";
  fontWeight?: number | string;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  letterSpacing?: string;
  fontFamily?: string;
  id?: string;
  className?: string;
}

export function LabelRender({
  text = "Label",
  children,
  variant = "default",
  color,
  backgroundColor,
  borderColor,
  size = "sm",
  fontWeight,
  textTransform = "uppercase",
  letterSpacing = "0.05em",
  fontFamily,
  id,
  className = "",
}: LabelProps) {
  const sizeStyles = {
    xs: { text: "text-[0.625rem]", padding: "px-1.5 py-0.5" },
    sm: { text: "text-xs", padding: "px-2 py-1" },
    md: { text: "text-sm", padding: "px-3 py-1.5" },
  }[size];

  const resolvedWeight =
    typeof fontWeight === "number"
      ? fontWeight
      : fontWeight
        ? Number(fontWeight) || 600
        : 600;

  const baseStyle: React.CSSProperties = {
    color: color || undefined,
    fontFamily: fontFamily || `var(--font-body, inherit)`,
    fontWeight: resolvedWeight,
    textTransform: textTransform !== "none" ? textTransform : undefined,
    letterSpacing,
  };

  if (variant === "badge" || variant === "pill") {
    return (
      <span
        id={id}
        className={`inline-flex items-center ${sizeStyles.text} ${sizeStyles.padding} ${variant === "pill" ? "rounded-full" : "rounded-md"} ${className}`}
        style={{
          ...baseStyle,
          backgroundColor: backgroundColor || undefined,
        }}
      >
        {children || text}
      </span>
    );
  }

  if (variant === "outline") {
    return (
      <span
        id={id}
        className={`inline-flex items-center ${sizeStyles.text} ${sizeStyles.padding} rounded-md border ${className}`}
        style={{
          ...baseStyle,
          borderColor: borderColor || color || undefined,
        }}
      >
        {children || text}
      </span>
    );
  }

  if (variant === "tag") {
    return (
      <span
        id={id}
        className={`inline-flex items-center ${sizeStyles.text} ${sizeStyles.padding} rounded ${className}`}
        style={{
          ...baseStyle,
          backgroundColor: backgroundColor || undefined,
        }}
      >
        {children || text}
      </span>
    );
  }

  if (variant === "overline") {
    return (
      <span
        id={id}
        className={`block ${sizeStyles.text} mb-2 ${className}`}
        style={baseStyle}
      >
        {children || text}
      </span>
    );
  }

  if (variant === "subtle") {
    return (
      <span
        id={id}
        className={`${sizeStyles.text} opacity-70 ${className}`}
        style={baseStyle}
      >
        {children || text}
      </span>
    );
  }

  // Default variant
  return (
    <span
      id={id}
      className={`${sizeStyles.text} ${className}`}
      style={baseStyle}
    >
      {children || text}
    </span>
  );
}

// ============================================================================
// LIST - Styled list with multiple variants
// ============================================================================

export interface ListProps {
  items?: string[];
  variant?:
    | "bullet"
    | "numbered"
    | "check"
    | "arrow"
    | "dash"
    | "icon"
    | "none";
  color?: string;
  iconColor?: string;
  fontSize?: string;
  lineHeight?: string;
  spacing?: "tight" | "normal" | "relaxed";
  fontFamily?: string;
  columns?: 1 | 2 | 3;
  id?: string;
  className?: string;
}

export function ListRender({
  items = ["First item", "Second item", "Third item"],
  variant = "bullet",
  color,
  iconColor,
  fontSize,
  lineHeight,
  spacing = "normal",
  fontFamily,
  columns = 1,
  id,
  className = "",
}: ListProps) {
  const spacingClass = {
    tight: "space-y-1",
    normal: "space-y-2",
    relaxed: "space-y-4",
  }[spacing];

  const columnClass =
    columns > 1
      ? `grid ${({ 2: "grid-cols-2", 3: "grid-cols-3" } as Record<number, string>)[columns] || "grid-cols-2"} gap-x-8`
      : "";

  const resolvedIconColor = iconColor || color || undefined;

  const getMarker = (index: number) => {
    switch (variant) {
      case "numbered":
        return (
          <span
            className="font-semibold mr-3 shrink-0 tabular-nums"
            style={{ color: resolvedIconColor }}
          >
            {index + 1}.
          </span>
        );
      case "check":
        return (
          <svg
            className="w-5 h-5 mr-3 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke={resolvedIconColor || "currentColor"}
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case "arrow":
        return (
          <span className="mr-3 shrink-0" style={{ color: resolvedIconColor }}>
            →
          </span>
        );
      case "dash":
        return (
          <span className="mr-3 shrink-0" style={{ color: resolvedIconColor }}>
            —
          </span>
        );
      case "icon":
        return (
          <span className="mr-3 shrink-0" style={{ color: resolvedIconColor }}>
            •
          </span>
        );
      case "none":
        return null;
      default:
        // bullet
        return (
          <span
            className="mr-3 shrink-0 mt-2 w-1.5 h-1.5 rounded-full inline-block"
            style={{ backgroundColor: resolvedIconColor || "currentColor" }}
          />
        );
    }
  };

  const listStyle: React.CSSProperties = {
    color: color || undefined,
    fontFamily: fontFamily || `var(--font-body, inherit)`,
    fontSize: fontSize ? `var(--type-${fontSize}, ${fontSize})` : undefined,
    lineHeight: lineHeight || undefined,
  };

  const Tag = variant === "numbered" ? "ol" : "ul";

  return (
    <Tag
      id={id}
      className={`${spacingClass} ${columnClass} ${className}`}
      style={listStyle}
    >
      {items.map((item, index) => (
        <li key={index} className="flex items-start">
          {getMarker(index)}
          <span>{item}</span>
        </li>
      ))}
    </Tag>
  );
}

// ============================================================================
// DISPLAY TEXT - Large decorative display text for hero sections
// ============================================================================

export interface DisplayTextProps {
  text?: string;
  children?: React.ReactNode;
  color?: string;
  fontSize?: string;
  fontWeight?: number | string;
  fontFamily?: string;
  lineHeight?: string;
  letterSpacing?: string;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  gradient?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
  gradientDirection?: string;
  textWrap?: "balance" | "pretty" | "wrap" | "nowrap";
  align?: "left" | "center" | "right";
  textShadow?: string;
  maxWidth?: string;
  id?: string;
  className?: string;
}

export function DisplayTextRender({
  text = "Display",
  children,
  color,
  fontSize,
  fontWeight,
  fontFamily,
  lineHeight,
  letterSpacing = "-0.04em",
  textTransform = "none",
  gradient = false,
  gradientFrom = "",
  gradientTo = "",
  gradientDirection = "to right",
  textWrap = "balance",
  align = "center",
  textShadow,
  maxWidth,
  id,
  className = "",
}: DisplayTextProps) {
  const resolvedWeight =
    typeof fontWeight === "number"
      ? fontWeight
      : fontWeight
        ? Number(fontWeight) || 900
        : 900;

  const alignClass =
    align === "center"
      ? "text-center"
      : align === "right"
        ? "text-right"
        : "text-left";

  const style: React.CSSProperties = {
    fontFamily: fontFamily || `var(--font-heading, inherit)`,
    fontSize: fontSize || `var(--type-9xl, 8rem)`,
    fontWeight: resolvedWeight,
    lineHeight: lineHeight || "1",
    letterSpacing,
    textTransform: textTransform !== "none" ? textTransform : undefined,
    textWrap: textWrap !== "wrap" ? textWrap : undefined,
    textShadow: textShadow || undefined,
    maxWidth: maxWidth || undefined,
    color: gradient ? undefined : color || undefined,
    backgroundImage: gradient
      ? `linear-gradient(${gradientDirection}, ${gradientFrom}, ${gradientTo})`
      : undefined,
  } as React.CSSProperties;

  return (
    <div
      id={id}
      className={`${alignClass} ${gradient ? "bg-clip-text text-transparent" : ""} ${className}`.trim()}
      style={style}
      role="heading"
      aria-level={1}
    >
      {children || text}
    </div>
  );
}

// ============================================================================
// DIVIDER TEXT - Text with decorative divider lines
// ============================================================================

export interface DividerTextProps {
  text?: string;
  variant?: "line-through" | "line-sides" | "dots" | "gradient" | "ornament";
  color?: string;
  lineColor?: string;
  fontSize?: string;
  fontWeight?: number | string;
  fontFamily?: string;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  letterSpacing?: string;
  spacing?: "sm" | "md" | "lg";
  id?: string;
  className?: string;
}

export function DividerTextRender({
  text = "Section",
  variant = "line-sides",
  color,
  lineColor,
  fontSize,
  fontWeight,
  fontFamily,
  textTransform = "uppercase",
  letterSpacing = "0.1em",
  spacing = "md",
  id,
  className = "",
}: DividerTextProps) {
  const resolvedWeight =
    typeof fontWeight === "number"
      ? fontWeight
      : fontWeight
        ? Number(fontWeight) || 600
        : 600;

  const spacingMap = { sm: "my-4", md: "my-8", lg: "my-12" };
  const resolvedLineColor = lineColor || color || undefined;

  const textStyle: React.CSSProperties = {
    color: color || undefined,
    fontFamily: fontFamily || `var(--font-body, inherit)`,
    fontSize: fontSize || `var(--type-sm, 0.875rem)`,
    fontWeight: resolvedWeight,
    textTransform: textTransform !== "none" ? textTransform : undefined,
    letterSpacing,
  };

  if (variant === "line-sides") {
    return (
      <div
        id={id}
        role="separator"
        className={`flex items-center gap-4 ${spacingMap[spacing]} ${className}`}
      >
        <div
          className="flex-1 h-px"
          style={{
            backgroundColor: resolvedLineColor || "currentColor",
            opacity: 0.2,
          }}
        />
        <span style={textStyle}>{text}</span>
        <div
          className="flex-1 h-px"
          style={{
            backgroundColor: resolvedLineColor || "currentColor",
            opacity: 0.2,
          }}
        />
      </div>
    );
  }

  if (variant === "line-through") {
    return (
      <div
        id={id}
        role="separator"
        className={`relative text-center ${spacingMap[spacing]} ${className}`}
      >
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div
            className="w-full h-px"
            style={{
              backgroundColor: resolvedLineColor || "currentColor",
              opacity: 0.2,
            }}
          />
        </div>
        <span
          className="relative px-4"
          style={{
            ...textStyle,
            backgroundColor: "inherit",
          }}
        >
          {text}
        </span>
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div
        id={id}
        role="separator"
        className={`flex items-center justify-center gap-3 ${spacingMap[spacing]} ${className}`}
      >
        <span
          className="flex gap-1.5"
          style={{ color: resolvedLineColor || "currentColor", opacity: 0.3 }}
        >
          •••
        </span>
        <span style={textStyle}>{text}</span>
        <span
          className="flex gap-1.5"
          style={{ color: resolvedLineColor || "currentColor", opacity: 0.3 }}
        >
          •••
        </span>
      </div>
    );
  }

  if (variant === "gradient") {
    return (
      <div
        id={id}
        role="separator"
        className={`flex items-center gap-4 ${spacingMap[spacing]} ${className}`}
      >
        <div
          className="flex-1 h-px"
          style={{
            background: `linear-gradient(to right, transparent, ${resolvedLineColor || "currentColor"})`,
            opacity: 0.3,
          }}
        />
        <span style={textStyle}>{text}</span>
        <div
          className="flex-1 h-px"
          style={{
            background: `linear-gradient(to left, transparent, ${resolvedLineColor || "currentColor"})`,
            opacity: 0.3,
          }}
        />
      </div>
    );
  }

  if (variant === "ornament") {
    return (
      <div
        id={id}
        role="separator"
        className={`flex items-center justify-center gap-4 ${spacingMap[spacing]} ${className}`}
      >
        <span
          style={{ color: resolvedLineColor || "currentColor", opacity: 0.4 }}
        >
          ✦
        </span>
        <span style={textStyle}>{text}</span>
        <span
          style={{ color: resolvedLineColor || "currentColor", opacity: 0.4 }}
        >
          ✦
        </span>
      </div>
    );
  }

  // Default: line-sides
  return (
    <div
      id={id}
      role="separator"
      className={`flex items-center gap-4 ${spacingMap[spacing]} ${className}`}
    >
      <div
        className="flex-1 h-px"
        style={{
          backgroundColor: resolvedLineColor || "currentColor",
          opacity: 0.2,
        }}
      />
      <span style={textStyle}>{text}</span>
      <div
        className="flex-1 h-px"
        style={{
          backgroundColor: resolvedLineColor || "currentColor",
          opacity: 0.2,
        }}
      />
    </div>
  );
}

// ============================================================================
// STAT NUMBER - Animated statistics/metrics display
// ============================================================================

export interface StatNumberProps {
  value?: string;
  label?: string;
  prefix?: string;
  suffix?: string;
  color?: string;
  labelColor?: string;
  valueSize?: string;
  labelSize?: string;
  fontFamily?: string;
  fontWeight?: number | string;
  align?: "left" | "center" | "right";
  layout?: "stacked" | "inline";
  id?: string;
  className?: string;
}

export function StatNumberRender({
  value = "100",
  label = "Statistic",
  prefix = "",
  suffix = "+",
  color,
  labelColor,
  valueSize,
  labelSize,
  fontFamily,
  fontWeight,
  align = "center",
  layout = "stacked",
  id,
  className = "",
}: StatNumberProps) {
  const resolvedWeight =
    typeof fontWeight === "number"
      ? fontWeight
      : fontWeight
        ? Number(fontWeight) || 800
        : 800;

  const alignClass =
    align === "center"
      ? "text-center"
      : align === "right"
        ? "text-right"
        : "text-left";

  const isInline = layout === "inline";

  return (
    <div
      id={id}
      aria-label={`${prefix}${value}${suffix} ${label}`}
      className={`${alignClass} ${isInline ? "flex items-baseline gap-3" : ""} ${className}`.trim()}
    >
      <div
        className={isInline ? "" : "mb-1"}
        style={{
          fontFamily: fontFamily || `var(--font-heading, inherit)`,
          fontSize: valueSize || `var(--type-5xl, 3rem)`,
          fontWeight: resolvedWeight,
          lineHeight: "1.1",
          letterSpacing: "-0.02em",
          color: color || undefined,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {prefix}
        {value}
        {suffix}
      </div>
      <div
        style={{
          fontFamily: `var(--font-body, inherit)`,
          fontSize: labelSize || `var(--type-sm, 0.875rem)`,
          fontWeight: 500,
          letterSpacing: "0.025em",
          textTransform: "uppercase" as const,
          color: labelColor || undefined,
          opacity: labelColor ? 1 : 0.7,
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ============================================================================
// BUTTON PROPS - Premium Button with 60+ properties
// ============================================================================

// Pre-bundled icon map for the `iconName` string prop (avoids full Lucide bundle)
const BUTTON_ICONS: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  "arrow-right": ArrowRight,
  "arrow-left": ArrowLeft,
  check: Check,
  download: Download,
  "external-link": ExternalLink,
  "chevron-right": ChevronRight,
  "chevron-down": ChevronDown,
  plus: Plus,
  minus: Minus,
  x: X,
  search: Search,
  "shopping-cart": ShoppingCart,
  heart: Heart,
  share: Share2,
  mail: Mail,
  phone: Phone,
  calendar: Calendar,
  play: Play,
  send: Send,
  star: Star,
};

export interface ButtonProps {
  // Content
  label?: string;
  children?: React.ReactNode;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  iconEmoji?: string;
  iconName?: string;
  iconPosition?: "left" | "right" | "only";

  // Link & Action
  href?: string;
  target?: "_self" | "_blank";
  type?: "button" | "submit" | "reset";
  onClick?: () => void;

  // Variant & Style
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "link"
    | "destructive"
    | "success"
    | "warning"
    | "gradient"
    | "ring";
  size?: "xs" | "sm" | "md" | "lg" | "xl";

  // Colors
  backgroundColor?: string;
  hoverBackgroundColor?: string;
  activeBackgroundColor?: string;
  textColor?: string;
  hoverTextColor?: string;
  borderColor?: string;
  hoverBorderColor?: string;

  // Gradient (for gradient variant)
  gradientFrom?: string;
  gradientTo?: string;
  gradientVia?: string;
  gradientDirection?:
    | "to-r"
    | "to-l"
    | "to-t"
    | "to-b"
    | "to-br"
    | "to-bl"
    | "to-tr"
    | "to-tl";

  // Border & Radius
  borderRadius?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  borderWidth?: "0" | "1" | "2" | "3";
  borderStyle?: "solid" | "dashed" | "dotted";

  // Shadow
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
  hoverShadow?: "none" | "sm" | "md" | "lg" | "xl";
  glowOnHover?: boolean;
  glowColor?: string;

  // Width & Sizing
  fullWidth?: boolean;
  fullWidthMobile?: boolean;
  minWidth?: string;
  paddingX?: "xs" | "sm" | "md" | "lg" | "xl";
  paddingY?: "xs" | "sm" | "md" | "lg" | "xl";

  // Typography
  fontWeight?: "normal" | "medium" | "semibold" | "bold";
  fontFamily?: string;
  fontSize?: string;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  letterSpacing?: "normal" | "wide" | "wider" | "widest";

  // Animation & Effects
  hoverEffect?:
    | "none"
    | "lift"
    | "scale"
    | "pulse"
    | "shine"
    | "ripple"
    | "glow";
  transitionDuration?: "fast" | "normal" | "slow";
  animateOnLoad?: boolean;
  loadingAnimation?: "spinner" | "dots" | "pulse";

  // States
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;

  // Focus
  focusRingColor?: string;
  focusRingWidth?: "1" | "2" | "3" | "4";
  focusRingOffset?: "0" | "1" | "2";

  // Icon Styling
  iconSize?: "xs" | "sm" | "md" | "lg";
  iconGap?: "xs" | "sm" | "md" | "lg";
  iconColor?: string;

  // Badge/Notification
  showBadge?: boolean;
  badgeText?: string;
  badgeColor?: string;
  badgeTextColor?: string;
  badgePosition?: "top-right" | "top-left" | "bottom-right" | "bottom-left";

  // Tooltip
  tooltip?: string;
  tooltipPosition?: "top" | "bottom" | "left" | "right";

  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
  tabIndex?: number;

  // Misc
  id?: string;
  className?: string;
}

export function ButtonRender({
  // Content
  label = "Button",
  children,
  iconLeft,
  iconRight,
  iconEmoji,
  iconName,
  iconPosition = "left",

  // Link & Action
  href,
  target = "_self",
  type = "button",
  onClick,

  // Variant & Style
  variant = "primary",
  size = "md",

  // Colors
  backgroundColor,
  hoverBackgroundColor,
  textColor,
  hoverTextColor,
  borderColor,
  hoverBorderColor,

  // Gradient
  gradientFrom = "",
  gradientTo = "",
  gradientVia,
  gradientDirection = "to-r",

  // Border & Radius
  borderRadius = "md",
  borderWidth = "1",
  borderStyle = "solid",

  // Shadow
  shadow = "none",
  hoverShadow,
  glowOnHover = false,
  glowColor = "",

  // Width & Sizing
  fullWidth = false,
  fullWidthMobile = false,
  minWidth,
  paddingX,
  paddingY,

  // Typography
  fontWeight = "medium",
  fontFamily,
  fontSize: fontSizeOverride,
  textTransform = "none",
  letterSpacing = "normal",

  // Animation & Effects
  hoverEffect = "none",
  transitionDuration = "normal",
  loadingAnimation = "spinner",

  // States
  disabled = false,
  loading = false,
  loadingText,

  // Focus
  focusRingColor = "",
  focusRingWidth = "2",
  focusRingOffset = "2",

  // Icon Styling
  iconSize = "md",
  iconGap = "sm",
  iconColor,

  // Badge
  showBadge = false,
  badgeText,
  badgeColor = "#ef4444",
  badgeTextColor = "#ffffff",
  badgePosition = "top-right",

  // Tooltip
  tooltip,
  tooltipPosition = "top",

  // Accessibility
  ariaLabel,
  ariaDescribedBy,
  tabIndex,

  // Misc
  id,
  className = "",
}: ButtonProps) {
  // Size classes
  const sizeClasses = {
    xs: "px-2.5 py-1 text-xs",
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm md:text-base",
    lg: "px-6 py-3 text-base md:text-lg",
    xl: "px-8 py-4 text-lg md:text-xl",
  }[size];

  // Variant classes — structural only; colors applied via inline styles (backgroundColor, textColor props)
  // This avoids hardcoded Tailwind colors that break on dark/themed sites
  const variantClasses = {
    primary: "hover:opacity-90 active:opacity-80 border-transparent",
    secondary: "hover:opacity-90 active:opacity-80 border-transparent",
    outline: "bg-transparent border-2 hover:opacity-80 active:opacity-70",
    ghost:
      "bg-transparent hover:opacity-80 active:opacity-70 border-transparent",
    link: "bg-transparent hover:underline border-transparent p-0",
    destructive: "hover:opacity-90 active:opacity-80 border-transparent",
    success: "hover:opacity-90 active:opacity-80 border-transparent",
    warning: "hover:opacity-90 active:opacity-80 border-transparent",
    ring: "bg-transparent border-2 hover:opacity-80 active:opacity-70",
    gradient: "",
  }[variant];

  // Radius
  const radiusClass = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    full: "rounded-full",
  }[borderRadius];

  // Shadow
  const shadowClass = {
    none: "",
    sm: "shadow-sm",
    md: "shadow",
    lg: "shadow-md",
    xl: "shadow-lg",
  }[shadow];

  // Hover shadow
  const hoverShadowClass = hoverShadow
    ? {
        none: "hover:shadow-none",
        sm: "hover:shadow-sm",
        md: "hover:shadow",
        lg: "hover:shadow-md",
        xl: "hover:shadow-lg",
      }[hoverShadow]
    : "";

  // Width
  const widthClasses = fullWidth
    ? "w-full justify-center"
    : fullWidthMobile
      ? "w-full md:w-auto justify-center md:justify-start"
      : "";

  // Font weight
  const weightClass = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
  }[fontWeight];

  // Text transform
  const transformClass = {
    none: "",
    uppercase: "uppercase",
    lowercase: "lowercase",
    capitalize: "capitalize",
  }[textTransform];

  // Letter spacing
  const spacingClass = {
    normal: "",
    wide: "tracking-wide",
    wider: "tracking-wider",
    widest: "tracking-widest",
  }[letterSpacing];

  // Transition
  const transitionClass = {
    fast: "transition-all duration-150",
    normal: "transition-all duration-200",
    slow: "transition-all duration-300",
  }[transitionDuration];

  // Hover effect
  const hoverEffectClass = {
    none: "",
    lift: "hover:-translate-y-0.5",
    scale: "hover:scale-105",
    pulse: "hover:animate-pulse",
    shine: "overflow-hidden",
    ripple: "overflow-hidden",
    glow: "",
  }[hoverEffect];

  // Icon gap
  const gapClass = {
    xs: "gap-1",
    sm: "gap-1.5",
    md: "gap-2",
    lg: "gap-3",
  }[iconGap];

  // Icon size
  const iconSizeClass = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  }[iconSize];

  // Badge position
  const badgePositionClass = {
    "top-right": "-top-1 -right-1",
    "top-left": "-top-1 -left-1",
    "bottom-right": "-bottom-1 -right-1",
    "bottom-left": "-bottom-1 -left-1",
  }[badgePosition];

  // Build class string
  const baseClasses = `
    inline-flex items-center justify-center ${weightClass}
    ${transitionClass} focus:outline-none
    disabled:opacity-50 disabled:cursor-not-allowed
    ${sizeClasses} ${variant !== "gradient" ? variantClasses : ""} ${radiusClass}
    ${shadowClass} ${hoverShadowClass} ${widthClasses}
    ${transformClass} ${spacingClass} ${gapClass}
    ${hoverEffectClass}
    ${borderWidth !== "0" && variant !== "gradient" ? `border-${borderWidth}` : ""}
    ${className}
  `
    .replace(/\s+/g, " ")
    .trim();

  // Custom styles
  const customStyles: React.CSSProperties = {
    fontFamily: fontFamily || undefined,
    fontSize: fontSizeOverride || undefined,
    minWidth: minWidth || undefined,
    borderStyle: borderStyle !== "solid" ? borderStyle : undefined,
    ["--tw-ring-color" as keyof React.CSSProperties]: focusRingColor,
  };

  if (variant === "gradient") {
    const gradientDir = {
      "to-r": "to right",
      "to-l": "to left",
      "to-t": "to top",
      "to-b": "to bottom",
      "to-br": "to bottom right",
      "to-bl": "to bottom left",
      "to-tr": "to top right",
      "to-tl": "to top left",
    }[gradientDirection];
    const stops = gradientVia
      ? `${gradientFrom}, ${gradientVia}, ${gradientTo}`
      : `${gradientFrom}, ${gradientTo}`;
    customStyles.background = `linear-gradient(${gradientDir}, ${stops})`;
    customStyles.color = textColor || "#ffffff";
  } else if (variant === "primary") {
    customStyles.backgroundColor =
      backgroundColor || "var(--brand-primary, #3b82f6)";
    customStyles.color = textColor || "#ffffff";
  } else if (variant === "secondary") {
    customStyles.backgroundColor = backgroundColor || "rgba(107,114,128,0.12)";
    customStyles.color = textColor || "inherit";
  } else if (variant === "outline") {
    customStyles.borderColor = borderColor || backgroundColor || "currentColor";
    customStyles.color = textColor || backgroundColor || "inherit";
  } else if (variant === "ghost") {
    customStyles.color = textColor || "inherit";
  } else if (variant === "link") {
    customStyles.color = textColor || backgroundColor || "inherit";
  } else if (variant === "destructive") {
    customStyles.backgroundColor =
      backgroundColor || "var(--destructive, #dc2626)";
    customStyles.color = textColor || "var(--destructive-foreground, #ffffff)";
  } else if (variant === "success") {
    customStyles.backgroundColor = backgroundColor || "var(--success, #16a34a)";
    customStyles.color = textColor || "var(--success-foreground, #ffffff)";
  } else if (variant === "warning") {
    customStyles.backgroundColor = backgroundColor || "var(--warning, #d97706)";
    customStyles.color = textColor || "var(--warning-foreground, #ffffff)";
  } else if (variant === "ring") {
    customStyles.borderColor =
      borderColor || backgroundColor || "var(--primary, #3b82f6)";
    customStyles.color = textColor || "var(--primary, #3b82f6)";
  } else {
    if (backgroundColor) customStyles.backgroundColor = backgroundColor;
    if (textColor) customStyles.color = textColor;
  }

  if (borderColor) customStyles.borderColor = borderColor;

  // Glow effect (from glowOnHover prop or glow hoverEffect)
  if (glowOnHover || hoverEffect === "glow") {
    const gColor = glowColor || backgroundColor || "var(--primary, #3b82f6)";
    customStyles.boxShadow = `0 0 20px ${gColor}40`;
  }

  // Loading spinner
  const renderLoadingIndicator = () => {
    if (loadingAnimation === "spinner") {
      return (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      );
    }
    if (loadingAnimation === "dots") {
      return (
        <span className="flex gap-1">
          <span className="animate-bounce">.</span>
          <span className="animate-bounce delay-100">.</span>
          <span className="animate-bounce delay-200">.</span>
        </span>
      );
    }
    return <span className="animate-pulse">●</span>;
  };

  // Render icon
  const renderIcon = (position: "left" | "right") => {
    if (loading) return null;

    // Resolve iconName from pre-bundled map
    const ResolvedIcon = iconName ? BUTTON_ICONS[iconName] : null;

    if (ResolvedIcon) {
      const shouldShow =
        iconPosition === "only"
          ? position === "left"
          : iconPosition === position;
      if (!shouldShow) return null;
      return (
        <ResolvedIcon
          className={iconSizeClass}
          style={iconColor ? { color: iconColor } : undefined}
        />
      );
    }

    const icon = iconEmoji ? (
      <span className={iconSizeClass} style={{ color: iconColor }}>
        {iconEmoji}
      </span>
    ) : position === "left" ? (
      iconLeft
    ) : (
      iconRight
    );

    if (iconPosition === "only" && position === "left") {
      return icon;
    }

    if (
      position === "left" &&
      (iconLeft || (iconEmoji && iconPosition === "left"))
    ) {
      return icon;
    }

    if (
      position === "right" &&
      (iconRight || (iconEmoji && iconPosition === "right"))
    ) {
      return icon;
    }

    return null;
  };

  // Content
  const buttonContent = (
    <>
      {loading && renderLoadingIndicator()}
      {renderIcon("left")}
      {iconPosition !== "only" &&
        (loading && loadingText ? loadingText : children || label)}
      {renderIcon("right")}

      {/* Shine effect overlay */}
      {hoverEffect === "shine" && (
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      )}

      {/* Ripple effect overlay — CSS-only radial pulse on hover */}
      {hoverEffect === "ripple" && (
        <span
          className="absolute inset-0 rounded-[inherit] pointer-events-none opacity-0 group-hover:opacity-100 group-hover:animate-ping bg-current/10"
          style={{ animationDuration: "600ms", animationIterationCount: "1" }}
        />
      )}

      {/* Badge */}
      {showBadge && badgeText && (
        <span
          className={`absolute ${badgePositionClass} px-1.5 py-0.5 text-xs font-medium rounded-full`}
          style={{ backgroundColor: badgeColor, color: badgeTextColor }}
        >
          {badgeText}
        </span>
      )}
    </>
  );

  // Wrapper for tooltip and badge positioning
  const buttonElement = href ? (
    <a
      id={id}
      href={href}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      className={`${baseClasses} relative group`}
      style={customStyles}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-busy={loading || undefined}
      tabIndex={tabIndex}
    >
      {buttonContent}
    </a>
  ) : (
    <button
      id={id}
      type={type}
      className={`${baseClasses} relative group`}
      style={customStyles}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-busy={loading || undefined}
      aria-disabled={disabled || undefined}
      tabIndex={tabIndex}
    >
      {buttonContent}
    </button>
  );

  // Wrap with tooltip if present
  if (tooltip) {
    const tooltipPositionClasses = {
      top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
      bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
      left: "right-full top-1/2 -translate-y-1/2 mr-2",
      right: "left-full top-1/2 -translate-y-1/2 ml-2",
    }[tooltipPosition];

    return (
      <div className="relative inline-flex group/tooltip">
        {buttonElement}
        <span
          className={`absolute ${tooltipPositionClasses} px-2 py-1 text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50`}
          style={{
            backgroundColor: "var(--foreground, #111827)",
            color: "var(--background, #ffffff)",
          }}
        >
          {tooltip}
        </span>
      </div>
    );
  }

  return buttonElement;
}

// ============================================================================
// IMAGE PROPS - Premium Image with 50+ properties
// ============================================================================

export interface ImageProps {
  // Source
  src?: string | ImageValue;
  alt?: string;
  title?: string;

  // Sizing
  width?: "full" | "3/4" | "2/3" | "1/2" | "1/3" | "1/4" | "auto" | number;
  height?: "auto" | number;
  maxWidth?: string;
  maxHeight?: string;
  minWidth?: string;
  minHeight?: string;
  aspectRatio?:
    | "auto"
    | "square"
    | "video"
    | "4/3"
    | "3/2"
    | "16/9"
    | "21/9"
    | "9/16"
    | "3/4"
    | "2/3";

  // Object Fit & Position
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  objectPosition?:
    | "center"
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right";

  // Border & Radius
  borderRadius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
  border?: boolean;
  borderColor?: string;
  borderWidth?: "1" | "2" | "3" | "4";
  borderStyle?: "solid" | "dashed" | "dotted" | "double";

  // Shadow & Effects
  shadow?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "inner";
  hoverShadow?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";

  // Hover Effects
  hoverZoom?: boolean;
  hoverZoomScale?: number;
  hoverRotate?: boolean;
  hoverRotateDegrees?: number;
  hoverBrightness?: boolean;
  hoverBlur?: boolean;

  // Filters
  grayscale?: boolean;
  grayscaleHoverOff?: boolean;
  blur?: number;
  brightness?: number;
  contrast?: number;
  saturate?: number;
  sepia?: boolean;
  opacity?: number;

  // Overlay
  showOverlay?: boolean;
  overlayColor?: string;
  overlayOpacity?: number;
  overlayHoverOpacity?: number;
  overlayContent?: string;
  overlayContentColor?: string;
  overlayContentSize?: "sm" | "md" | "lg" | "xl";
  overlayPosition?: "center" | "top" | "bottom" | "left" | "right";

  // Caption
  caption?: string;
  captionAlign?: "left" | "center" | "right";
  captionColor?: string;
  captionBackgroundColor?: string;
  captionPosition?: "below" | "overlay-bottom" | "overlay-top";
  captionPadding?: "sm" | "md" | "lg";

  // Link
  href?: string;
  target?: "_self" | "_blank";

  // Loading
  loading?: "eager" | "lazy";
  priority?: boolean;
  placeholder?: "blur" | "empty" | "skeleton";
  blurDataURL?: string;
  placeholderColor?: string;

  // Responsive source set
  srcSet?: string;
  sizes?: string;

  // Animation
  animateOnLoad?: boolean;
  animationType?: "fade" | "scale" | "slide-up" | "slide-down";
  animationDuration?: "fast" | "normal" | "slow";
  animationDelay?: number;

  // Responsive
  hideOnMobile?: boolean;
  hideOnDesktop?: boolean;
  mobileWidth?: "full" | "3/4" | "1/2" | "auto";

  // Frame/Container
  showFrame?: boolean;
  frameColor?: string;
  framePadding?: "sm" | "md" | "lg" | "xl";
  frameStyle?: "simple" | "polaroid" | "shadow-box" | "rounded";

  // Decorators
  showBadge?: boolean;
  badgeText?: string;
  badgeColor?: string;
  badgePosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right";

  // Misc
  id?: string;
  className?: string;
}

export function ImageRender({
  // Source
  src = "/placeholder.svg",
  alt = "Image",
  title,

  // Sizing
  width = "full",
  height = "auto",
  maxWidth,
  maxHeight,
  aspectRatio = "auto",

  // Object Fit & Position
  objectFit = "cover",
  objectPosition = "center",

  // Border & Radius
  borderRadius = "none",
  border = false,
  borderColor = "#e5e7eb",
  borderWidth = "1",
  borderStyle = "solid",

  // Shadow
  shadow = "none",
  hoverShadow,

  // Hover Effects
  hoverZoom = false,
  hoverZoomScale = 1.05,
  hoverRotate = false,
  hoverRotateDegrees = 2,
  hoverBrightness = false,

  // Filters
  grayscale = false,
  grayscaleHoverOff = false,
  blur = 0,
  brightness = 100,
  contrast = 100,
  saturate = 100,
  sepia = false,
  opacity = 100,

  // Overlay
  showOverlay = false,
  overlayColor = "#000000",
  overlayOpacity = 0.5,
  overlayHoverOpacity,
  overlayContent,
  overlayContentColor = "#ffffff",
  overlayContentSize = "md",
  overlayPosition = "center",

  // Caption
  caption,
  captionAlign = "center",
  captionColor = "#6b7280",
  captionBackgroundColor,
  captionPosition = "below",
  captionPadding = "sm",

  // Link
  href,
  target = "_self",

  // Loading
  loading = "lazy",
  placeholder = "empty",
  placeholderColor,
  blurDataURL,
  srcSet,
  sizes,
  priority,

  // Animation
  animateOnLoad = false,
  animationType = "fade",
  animationDuration = "normal",
  animationDelay = 0,

  // Frame
  showFrame = false,
  frameColor = "#ffffff",
  framePadding = "md",
  frameStyle = "simple",

  // Badge
  showBadge = false,
  badgeText,
  badgeColor = "",
  badgePosition = "top-right",

  // Misc
  id,
  className = "",
}: ImageProps) {
  const imageUrl = getImageUrl(src) || "/placeholder.svg";
  const imageAlt = alt || getImageAlt(src, "Image");

  // Generate srcSet for Supabase images if not provided
  const resolvedSrcSet =
    srcSet ||
    (imageUrl.includes("supabase.co/storage")
      ? [640, 960, 1280, 1920]
          .map((w) => `${imageUrl}?width=${w}&quality=80 ${w}w`)
          .join(", ")
      : undefined);
  const resolvedSizes =
    sizes ||
    (resolvedSrcSet
      ? "(max-width: 640px) 100vw, (max-width: 1024px) 75vw, 50vw"
      : undefined);
  const resolvedLoading = priority ? ("eager" as const) : loading;

  // Width class
  const widthClass =
    typeof width === "string"
      ? {
          full: "w-full",
          "3/4": "w-3/4",
          "2/3": "w-2/3",
          "1/2": "w-1/2",
          "1/3": "w-1/3",
          "1/4": "w-1/4",
          auto: "w-auto",
        }[width]
      : "";

  // Aspect ratio
  const aspectClass = {
    auto: "",
    square: "aspect-square",
    video: "aspect-video",
    "4/3": "aspect-[4/3]",
    "3/2": "aspect-[3/2]",
    "16/9": "aspect-[16/9]",
    "21/9": "aspect-[21/9]",
    "9/16": "aspect-[9/16]",
    "3/4": "aspect-[3/4]",
    "2/3": "aspect-[2/3]",
  }[aspectRatio];

  // Object fit
  const fitClass = {
    contain: "object-contain",
    cover: "object-cover",
    fill: "object-fill",
    none: "object-none",
    "scale-down": "object-scale-down",
  }[objectFit];

  // Object position
  const posClass = {
    center: "object-center",
    top: "object-top",
    bottom: "object-bottom",
    left: "object-left",
    right: "object-right",
    "top-left": "object-left-top",
    "top-right": "object-right-top",
    "bottom-left": "object-left-bottom",
    "bottom-right": "object-right-bottom",
  }[objectPosition];

  // Border radius
  const radiusClass = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    "3xl": "rounded-3xl",
    full: "rounded-full",
  }[borderRadius];

  // Shadow
  const shadowClass = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
    "2xl": "shadow-2xl",
    inner: "shadow-inner",
  }[shadow];

  // Hover shadow
  const hoverShadowClass = hoverShadow
    ? {
        none: "hover:shadow-none",
        sm: "hover:shadow-sm",
        md: "hover:shadow-md",
        lg: "hover:shadow-lg",
        xl: "hover:shadow-xl",
        "2xl": "hover:shadow-2xl",
      }[hoverShadow]
    : "";

  // Animation duration
  const durationClass = {
    fast: "duration-150",
    normal: "duration-300",
    slow: "duration-500",
  }[animationDuration];

  // Frame padding
  const framePaddingClass = {
    sm: "p-2",
    md: "p-4",
    lg: "p-6",
    xl: "p-8",
  }[framePadding];

  // Caption padding
  const captionPaddingClass = {
    sm: "p-2",
    md: "p-3",
    lg: "p-4",
  }[captionPadding];

  // Overlay content size
  const overlayContentSizeClass = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  }[overlayContentSize];

  // Overlay position
  const overlayPositionClass = {
    center: "items-center justify-center",
    top: "items-start justify-center pt-4",
    bottom: "items-end justify-center pb-4",
    left: "items-center justify-start pl-4",
    right: "items-center justify-end pr-4",
  }[overlayPosition];

  // Badge position
  const badgePositionClass = {
    "top-left": "top-2 left-2",
    "top-right": "top-2 right-2",
    "bottom-left": "bottom-2 left-2",
    "bottom-right": "bottom-2 right-2",
  }[badgePosition];

  // Build filter string
  const filterStyles: string[] = [];
  if (grayscale) filterStyles.push("grayscale(100%)");
  if (blur > 0) filterStyles.push(`blur(${blur}px)`);
  if (brightness !== 100) filterStyles.push(`brightness(${brightness}%)`);
  if (contrast !== 100) filterStyles.push(`contrast(${contrast}%)`);
  if (saturate !== 100) filterStyles.push(`saturate(${saturate}%)`);
  if (sepia) filterStyles.push("sepia(100%)");

  // Hover effects
  const hoverClasses: string[] = ["transition-all", durationClass];
  if (hoverZoom) hoverClasses.push("group-hover:scale-105");
  if (hoverRotate)
    hoverClasses.push(`group-hover:rotate-[${hoverRotateDegrees}deg]`);
  if (hoverBrightness) hoverClasses.push("group-hover:brightness-110");
  if (grayscaleHoverOff) hoverClasses.push("group-hover:grayscale-0");

  // Custom styles
  const imageStyles: React.CSSProperties = {
    width: typeof width === "number" ? `${width}px` : undefined,
    height: typeof height === "number" ? `${height}px` : undefined,
    maxWidth: maxWidth || undefined,
    maxHeight: maxHeight || undefined,
    borderColor: border ? borderColor : undefined,
    borderWidth: border ? `${borderWidth}px` : undefined,
    borderStyle: border ? borderStyle : undefined,
    filter: filterStyles.length > 0 ? filterStyles.join(" ") : undefined,
    opacity: opacity !== 100 ? opacity / 100 : undefined,
    transform: hoverZoom ? `scale(${hoverZoomScale})` : undefined,
  };

  // Animation classes for load
  const animationLoadClass = animateOnLoad
    ? {
        fade: "animate-fadeIn",
        scale: "animate-scaleIn",
        "slide-up": "animate-slideUp",
        "slide-down": "animate-slideDown",
      }[animationType]
    : "";

  // Frame styles
  const frameStyles: React.CSSProperties = showFrame
    ? {
        backgroundColor: frameColor,
        boxShadow:
          frameStyle === "shadow-box"
            ? "0 4px 20px rgba(0,0,0,0.15)"
            : undefined,
      }
    : {};

  // Build image element
  const imageElement = (
    <img
      id={id}
      src={imageUrl}
      srcSet={resolvedSrcSet}
      sizes={resolvedSizes}
      alt={imageAlt}
      title={title}
      loading={resolvedLoading}
      fetchPriority={priority ? "high" : undefined}
      className={`
        ${widthClass} ${aspectClass} ${fitClass} ${posClass} ${radiusClass}
        ${shadowClass} ${hoverShadowClass}
        ${border ? "border" : ""}
        ${hoverClasses.join(" ")}
        ${animationLoadClass}
        ${className}
      `
        .replace(/\s+/g, " ")
        .trim()}
      style={{
        ...imageStyles,
        backgroundColor:
          placeholder === "blur" && blurDataURL
            ? undefined
            : placeholderColor || undefined,
        backgroundImage:
          placeholder === "blur" && blurDataURL
            ? `url(${blurDataURL})`
            : undefined,
        backgroundSize:
          placeholder === "blur" && blurDataURL ? "cover" : undefined,
      }}
    />
  );

  // Wrapper with overlay
  const imageWithOverlay =
    showOverlay || showBadge ? (
      <div className={`relative group overflow-hidden ${radiusClass}`}>
        {imageElement}

        {/* Overlay */}
        {showOverlay && (
          <div
            className={`absolute inset-0 flex ${overlayPositionClass} transition-opacity ${durationClass}`}
            style={{
              backgroundColor: overlayColor,
              opacity:
                overlayHoverOpacity !== undefined ? undefined : overlayOpacity,
            }}
          >
            {overlayContent && (
              <span
                className={`${overlayContentSizeClass} font-medium`}
                style={{ color: overlayContentColor }}
              >
                {overlayContent}
              </span>
            )}
          </div>
        )}

        {/* Badge */}
        {showBadge && badgeText && (
          <span
            className={`absolute ${badgePositionClass} px-2 py-1 text-xs font-medium text-white rounded`}
            style={{ backgroundColor: badgeColor }}
          >
            {badgeText}
          </span>
        )}
      </div>
    ) : hoverZoom || hoverRotate ? (
      <div className={`overflow-hidden group ${radiusClass}`}>
        {imageElement}
      </div>
    ) : (
      imageElement
    );

  // Frame wrapper
  const framedImage = showFrame ? (
    <div
      className={`inline-block ${framePaddingClass} ${frameStyle === "polaroid" ? "pb-8" : ""} ${frameStyle === "rounded" ? "rounded-lg" : ""}`}
      style={frameStyles}
    >
      {imageWithOverlay}
    </div>
  ) : (
    imageWithOverlay
  );

  // Link wrapper
  const linkedImage = href ? (
    <a
      href={href}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      className="block"
    >
      {framedImage}
    </a>
  ) : (
    framedImage
  );

  // Caption
  if (caption) {
    if (captionPosition === "below") {
      return (
        <figure>
          {linkedImage}
          <figcaption
            className={`mt-2 text-sm text-${captionAlign} ${captionPaddingClass}`}
            style={{
              color: captionColor,
              backgroundColor: captionBackgroundColor,
            }}
          >
            {caption}
          </figcaption>
        </figure>
      );
    }

    // Overlay caption
    return (
      <figure className="relative">
        {linkedImage}
        <figcaption
          className={`absolute ${captionPosition === "overlay-bottom" ? "bottom-0" : "top-0"} left-0 right-0 text-sm text-${captionAlign} ${captionPaddingClass}`}
          style={{
            color: captionColor,
            backgroundColor: captionBackgroundColor || "rgba(0,0,0,0.5)",
          }}
        >
          {caption}
        </figcaption>
      </figure>
    );
  }

  return linkedImage;
}

// ============================================================================
// VIDEO PROPS - Premium Video with 50+ properties
// ============================================================================

export interface VideoProps {
  // Source
  src?: string;
  poster?: string | ImageValue;
  type?: "file" | "youtube" | "vimeo" | "embed";

  // Sizing
  width?: "full" | "3/4" | "2/3" | "1/2" | "auto";
  maxWidth?: string;
  height?: number;
  aspectRatio?: "video" | "square" | "4/3" | "21/9" | "9/16" | "1/1" | "custom";
  customAspect?: string;

  // Playback
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  playsinline?: boolean;
  preload?: "auto" | "metadata" | "none";
  startTime?: number;
  endTime?: number;
  playbackSpeed?: number;

  // YouTube/Vimeo Options
  showRelated?: boolean;
  showInfo?: boolean;
  modestBranding?: boolean;
  privacyEnhanced?: boolean;
  enableJsApi?: boolean;
  origin?: string;

  // Appearance
  borderRadius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  shadow?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  border?: boolean;
  borderColor?: string;
  borderWidth?: "1" | "2" | "3" | "4";

  // Overlay & Thumbnail
  showThumbnailOverlay?: boolean;
  thumbnailOverlayColor?: string;
  thumbnailOverlayOpacity?: number;
  customPlayButton?: boolean;
  playButtonColor?: string;
  playButtonSize?: "sm" | "md" | "lg" | "xl";
  playButtonStyle?: "circle" | "rounded" | "minimal";

  // Loading
  loading?: "eager" | "lazy";
  showLoadingSpinner?: boolean;
  loadingSpinnerColor?: string;

  // Caption
  caption?: string;
  captionAlign?: "left" | "center" | "right";
  captionColor?: string;
  captionSize?: "sm" | "md" | "lg";

  // Container
  backgroundColor?: string;
  padding?: "none" | "sm" | "md" | "lg";

  // Title Bar
  showTitleBar?: boolean;
  title?: string;
  titleBarColor?: string;
  titleBarTextColor?: string;

  // Responsive
  hideOnMobile?: boolean;
  mobileAspectRatio?: "video" | "square" | "4/3";

  // Background mode (hero videos)
  background?: boolean;
  backgroundOverlay?: boolean;
  backgroundOverlayOpacity?: number;

  // Captions
  captionsSrc?: string;
  captionsLabel?: string;
  captionsSrcLang?: string;

  // Accessibility
  ariaLabel?: string;

  // Misc
  id?: string;
  className?: string;
}

export function VideoRender({
  // Source
  src = "",
  poster,
  type = "file",

  // Sizing
  width = "full",
  maxWidth,
  aspectRatio = "video",
  customAspect,

  // Playback
  autoplay = false,
  muted = false,
  loop = false,
  controls = true,
  playsinline = true,
  preload = "metadata",
  startTime = 0,
  endTime,
  playbackSpeed = 1,

  // YouTube/Vimeo Options
  showRelated = false,
  showInfo = true,
  modestBranding = true,
  privacyEnhanced = true,

  // Appearance
  borderRadius = "lg",
  shadow = "md",
  border = false,
  borderColor = "#e5e7eb",
  borderWidth = "1",

  // Overlay
  showThumbnailOverlay = false,
  thumbnailOverlayColor = "#000000",
  thumbnailOverlayOpacity = 0.3,
  customPlayButton = false,
  playButtonColor = "#ffffff",
  playButtonSize = "lg",
  playButtonStyle = "circle",

  // Loading
  loading = "lazy",
  showLoadingSpinner = false,
  loadingSpinnerColor = "",

  // Caption
  caption,
  captionAlign = "center",
  captionColor = "#6b7280",
  captionSize = "sm",

  // Container
  backgroundColor,
  padding = "none",

  // Title Bar
  showTitleBar = false,
  title,
  titleBarColor = "#1f2937",
  titleBarTextColor = "#ffffff",

  // Accessibility
  ariaLabel,

  // Background mode
  background = false,
  backgroundOverlay = false,
  backgroundOverlayOpacity = 0.4,

  // Captions
  captionsSrc,
  captionsLabel = "Captions",
  captionsSrcLang = "en",

  // Misc
  id,
  className = "",
}: VideoProps) {
  const posterUrl =
    typeof poster === "object" && poster?.url ? poster.url : (poster as string);

  // Width class
  const widthClass = {
    full: "w-full",
    "3/4": "w-3/4",
    "2/3": "w-2/3",
    "1/2": "w-1/2",
    auto: "w-auto",
  }[width];

  // Aspect ratio
  const aspectClass =
    aspectRatio === "custom" && customAspect
      ? ""
      : {
          video: "aspect-video",
          square: "aspect-square",
          "4/3": "aspect-[4/3]",
          "21/9": "aspect-[21/9]",
          "9/16": "aspect-[9/16]",
          "1/1": "aspect-square",
          custom: "",
        }[aspectRatio] || "aspect-video";

  // Border radius
  const radiusClass = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
  }[borderRadius];

  // Shadow
  const shadowClass = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
    "2xl": "shadow-2xl",
  }[shadow];

  // Padding
  const paddingClass = {
    none: "",
    sm: "p-2",
    md: "p-4",
    lg: "p-6",
  }[padding];

  // Caption size
  const captionSizeClass = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  }[captionSize];

  // Play button size
  const playButtonSizeClass = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-20 h-20",
    xl: "w-24 h-24",
  }[playButtonSize];

  // Custom styles
  const containerStyles: React.CSSProperties = {
    maxWidth: maxWidth || undefined,
    backgroundColor: backgroundColor || undefined,
    aspectRatio:
      aspectRatio === "custom" && customAspect ? customAspect : undefined,
  };

  const videoStyles: React.CSSProperties = {
    borderColor: border ? borderColor : undefined,
    borderWidth: border ? `${borderWidth}px` : undefined,
    borderStyle: border ? "solid" : undefined,
  };

  // Build YouTube embed URL
  const getYouTubeEmbed = (url: string) => {
    const videoId = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    )?.[1];
    if (!videoId) return null;

    const baseUrl = privacyEnhanced
      ? "https://www.youtube-nocookie.com"
      : "https://www.youtube.com";
    const params = new URLSearchParams({
      ...(autoplay && { autoplay: "1" }),
      ...(muted && { mute: "1" }),
      ...(loop && { loop: "1", playlist: videoId }),
      ...(!controls && { controls: "0" }),
      ...(!showRelated && { rel: "0" }),
      ...(!showInfo && { showinfo: "0" }),
      ...(modestBranding && { modestbranding: "1" }),
      ...(startTime > 0 && { start: String(startTime) }),
      ...(endTime && { end: String(endTime) }),
      playsinline: "1",
    });

    return `${baseUrl}/embed/${videoId}?${params.toString()}`;
  };

  // Build Vimeo embed URL
  const getVimeoEmbed = (url: string) => {
    const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
    if (!videoId) return null;

    const params = new URLSearchParams({
      ...(autoplay && { autoplay: "1" }),
      ...(muted && { muted: "1" }),
      ...(loop && { loop: "1" }),
      ...(!showInfo && { title: "0", byline: "0", portrait: "0" }),
    });

    return `https://player.vimeo.com/video/${videoId}?${params.toString()}`;
  };

  // Render play button
  const renderPlayButton = () => {
    if (!customPlayButton) return null;

    const shapeClass = {
      circle: "rounded-full",
      rounded: "rounded-xl",
      minimal: "bg-transparent",
    }[playButtonStyle];

    return (
      <div
        className={`absolute inset-0 flex items-center justify-center cursor-pointer group-hover:scale-105 transition-transform`}
      >
        <div
          className={`${playButtonSizeClass} ${shapeClass} flex items-center justify-center`}
          style={{
            backgroundColor:
              playButtonStyle !== "minimal"
                ? `${playButtonColor}20`
                : undefined,
            backdropFilter: "blur(8px)",
          }}
        >
          <svg
            className="w-1/2 h-1/2 ml-1"
            fill={playButtonColor}
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    );
  };

  // Render loading spinner
  const renderLoadingSpinner = () => {
    if (!showLoadingSpinner) return null;

    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          className="animate-spin w-8 h-8"
          style={{ color: loadingSpinnerColor }}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>
    );
  };

  // Video element based on type
  let videoElement: React.ReactNode;

  // YouTube
  if (
    src.includes("youtube.com") ||
    src.includes("youtu.be") ||
    type === "youtube"
  ) {
    const embedUrl = getYouTubeEmbed(src);
    if (embedUrl) {
      videoElement = (
        <iframe
          id={id}
          src={embedUrl}
          className={`${widthClass} ${aspectClass} ${radiusClass} ${shadowClass} ${className}`}
          style={videoStyles}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading={loading}
          aria-label={ariaLabel}
        />
      );
    }
  }
  // Vimeo
  else if (src.includes("vimeo.com") || type === "vimeo") {
    const embedUrl = getVimeoEmbed(src);
    if (embedUrl) {
      videoElement = (
        <iframe
          id={id}
          src={embedUrl}
          className={`${widthClass} ${aspectClass} ${radiusClass} ${shadowClass} ${className}`}
          style={videoStyles}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          loading={loading}
          aria-label={ariaLabel}
        />
      );
    }
  }
  // Generic embed
  else if (type === "embed") {
    videoElement = (
      <iframe
        id={id}
        src={src}
        className={`${widthClass} ${aspectClass} ${radiusClass} ${shadowClass} ${className}`}
        style={videoStyles}
        allowFullScreen
        loading={loading}
        aria-label={ariaLabel}
      />
    );
  }
  // Native video
  else {
    const isBackground = background;
    const videoRef = React.useRef<HTMLVideoElement>(null);

    // Keyboard controls for native video
    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLVideoElement>) => {
        const video = videoRef.current;
        if (!video) return;
        switch (e.key) {
          case " ":
          case "k":
            e.preventDefault();
            video.paused ? video.play() : video.pause();
            break;
          case "m":
            video.muted = !video.muted;
            break;
          case "f":
            if (document.fullscreenElement) {
              document.exitFullscreen();
            } else {
              video.requestFullscreen?.();
            }
            break;
          case "ArrowLeft":
            e.preventDefault();
            video.currentTime = Math.max(0, video.currentTime - 10);
            break;
          case "ArrowRight":
            e.preventDefault();
            video.currentTime = Math.min(
              video.duration,
              video.currentTime + 10,
            );
            break;
        }
      },
      [],
    );

    videoElement = (
      <video
        ref={videoRef}
        id={id}
        src={src}
        poster={posterUrl}
        autoPlay={isBackground ? true : autoplay}
        muted={isBackground ? true : muted}
        loop={isBackground ? true : loop}
        controls={isBackground ? false : controls}
        playsInline={isBackground ? true : playsinline}
        preload={preload}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className={`${widthClass} ${aspectClass} ${radiusClass} ${shadowClass} ${isBackground ? "absolute inset-0 w-full h-full object-cover" : ""} ${className}`}
        style={
          {
            ...videoStyles,
            playbackRate: playbackSpeed !== 1 ? playbackSpeed : undefined,
          } as React.CSSProperties
        }
        aria-label={ariaLabel}
      >
        {captionsSrc && (
          <track
            kind="captions"
            src={captionsSrc}
            srcLang={captionsSrcLang}
            label={captionsLabel}
          />
        )}
      </video>
    );
  }

  // Container with optional overlays
  const wrappedVideo = (
    <div
      className={`relative group ${radiusClass} overflow-hidden ${paddingClass} ${background ? "min-h-[300px]" : ""}`}
      style={containerStyles}
    >
      {/* Title bar */}
      {showTitleBar && title && (
        <div
          className="px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: titleBarColor, color: titleBarTextColor }}
        >
          {title}
        </div>
      )}

      {/* Video */}
      {videoElement}

      {/* Background overlay (for background video mode) */}
      {background && backgroundOverlay && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: "#000000",
            opacity: backgroundOverlayOpacity,
          }}
        />
      )}

      {/* Thumbnail overlay */}
      {showThumbnailOverlay && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: thumbnailOverlayColor,
            opacity: thumbnailOverlayOpacity,
          }}
        />
      )}

      {/* Custom play button */}
      {renderPlayButton()}

      {/* Loading spinner */}
      {renderLoadingSpinner()}
    </div>
  );

  // Caption
  if (caption) {
    return (
      <figure>
        {wrappedVideo}
        <figcaption
          className={`mt-2 ${captionSizeClass} text-${captionAlign}`}
          style={{ color: captionColor }}
        >
          {caption}
        </figcaption>
      </figure>
    );
  }

  return wrappedVideo;
}

// ============================================================================
// MAP PROPS - Premium Map with 40+ properties
// ============================================================================

export interface MapMarker {
  lat: number;
  lng: number;
  label?: string;
  color?: string;
}

export interface MapProps {
  // Location
  address?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;

  // Multiple markers
  markers?: MapMarker[];

  // Provider
  provider?: "google" | "openstreetmap" | "mapbox";
  apiKey?: string;

  // Map Settings
  zoom?: number;
  mapType?: "roadmap" | "satellite" | "hybrid" | "terrain";

  // Auto dark mode
  autoTheme?: boolean;

  // Sizing
  height?: number;
  width?: "full" | "3/4" | "2/3" | "1/2" | "auto";
  maxWidth?: string;
  aspectRatio?: "auto" | "video" | "square" | "4/3" | "21/9";

  // Appearance
  borderRadius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
  border?: boolean;
  borderColor?: string;
  borderWidth?: "1" | "2" | "3" | "4";

  // Marker
  showMarker?: boolean;
  markerColor?: string;
  markerLabel?: string;
  customMarkerIcon?: string;

  // Controls
  showZoomControls?: boolean;
  showFullscreenButton?: boolean;
  showMapTypeControl?: boolean;
  showStreetViewControl?: boolean;
  showScaleControl?: boolean;

  // Interaction
  allowScrollZoom?: boolean;
  allowDragging?: boolean;
  allowClickableIcons?: boolean;

  // Style/Theme
  mapStyle?:
    | "default"
    | "silver"
    | "retro"
    | "dark"
    | "night"
    | "aubergine"
    | "custom";
  customStyleJson?: string;
  grayscale?: boolean;
  saturation?: number;

  // Info Window
  showInfoWindow?: boolean;
  infoWindowTitle?: string;
  infoWindowDescription?: string;
  infoWindowImage?: string;

  // Directions
  showDirectionsLink?: boolean;
  directionsLinkText?: string;
  directionsLinkPosition?: "above" | "below" | "overlay";

  // Loading
  loading?: "eager" | "lazy";
  showLoadingPlaceholder?: boolean;
  placeholderColor?: string;

  // Caption
  caption?: string;
  captionAlign?: "left" | "center" | "right";
  captionColor?: string;

  // Container
  backgroundColor?: string;
  padding?: "none" | "sm" | "md" | "lg";

  // Responsive
  mobileHeight?: number;
  hideOnMobile?: boolean;

  // Accessibility
  ariaLabel?: string;
  title?: string;

  // Misc
  id?: string;
  className?: string;
}

export function MapRender({
  // Location
  address = "New York, NY",
  latitude,
  longitude,

  // Multiple markers
  markers = [],

  // Provider
  provider = "google",

  // Map Settings
  zoom = 14,
  mapType = "roadmap",

  // Auto Theme
  autoTheme = false,

  // Sizing
  height = 300,
  width = "full",
  maxWidth,
  aspectRatio = "auto",

  // Appearance
  borderRadius = "lg",
  shadow = "md",
  border = false,
  borderColor = "#e5e7eb",
  borderWidth = "1",

  // Marker
  showMarker = true,
  markerColor = "#ef4444",
  markerLabel,

  // Controls
  showZoomControls = true,
  showFullscreenButton = true,
  showMapTypeControl = false,
  showStreetViewControl = false,
  showScaleControl = false,

  // Interaction
  allowScrollZoom = false,
  allowDragging = true,

  // Style
  mapStyle = "default",
  grayscale = false,
  saturation = 100,

  // Info Window
  showInfoWindow = false,
  infoWindowTitle,

  // Directions
  showDirectionsLink = false,
  directionsLinkText = "Get Directions",
  directionsLinkPosition = "below",

  // Loading
  loading = "lazy",
  showLoadingPlaceholder = true,
  placeholderColor = "#f3f4f6",

  // Caption
  caption,
  captionAlign = "center",
  captionColor = "#6b7280",

  // Container
  backgroundColor,
  padding = "none",

  // Responsive
  mobileHeight,

  // Accessibility
  ariaLabel,
  title,

  // Misc
  id,
  className = "",
}: MapProps) {
  // Width class
  const widthClass = {
    full: "w-full",
    "3/4": "w-3/4",
    "2/3": "w-2/3",
    "1/2": "w-1/2",
    auto: "w-auto",
  }[width];

  // Aspect ratio
  const aspectClass =
    aspectRatio !== "auto"
      ? {
          video: "aspect-video",
          square: "aspect-square",
          "4/3": "aspect-[4/3]",
          "21/9": "aspect-[21/9]",
        }[aspectRatio]
      : "";

  // Border radius
  const radiusClass = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
  }[borderRadius];

  // Shadow
  const shadowClass = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
  }[shadow];

  // Padding
  const paddingClass = {
    none: "",
    sm: "p-2",
    md: "p-4",
    lg: "p-6",
  }[padding];

  // Build Google Maps URL with options
  // Resolve auto theme — if autoTheme is on, detect dark context and swap style
  const resolvedMapStyle = React.useMemo(() => {
    if (!autoTheme || mapStyle !== "default") return mapStyle;
    // Server-side safe: default to "default"
    if (typeof window === "undefined") return "default";
    const isDark =
      document.documentElement.getAttribute("data-theme") === "dark" ||
      document.documentElement.classList.contains("dark") ||
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    return isDark ? "dark" : "default";
  }, [autoTheme, mapStyle]);

  const buildGoogleMapUrl = () => {
    const baseUrl = "https://maps.google.com/maps";
    const params = new URLSearchParams();

    // Multi-marker: use first marker or primary location as center
    if (markers.length > 0) {
      params.set("q", `${markers[0].lat},${markers[0].lng}`);
    } else if (latitude && longitude) {
      params.set("q", `${latitude},${longitude}`);
    } else {
      params.set("q", address);
    }

    // Auto-fit zoom for multiple markers
    const effectiveZoom = markers.length > 1 ? Math.min(zoom, 12) : zoom;
    params.set("z", String(effectiveZoom));
    params.set("output", "embed");
    params.set(
      "t",
      { roadmap: "m", satellite: "k", hybrid: "h", terrain: "p" }[mapType],
    );

    // Disable controls via URL params where possible
    if (!allowScrollZoom) {
      params.set("scrollwheel", "0");
    }

    return `${baseUrl}?${params.toString()}`;
  };

  // Build OpenStreetMap URL
  const buildOsmUrl = () => {
    if (latitude && longitude) {
      return `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${latitude + 0.01}&layer=mapnik&marker=${latitude},${longitude}`;
    }
    const encodedAddress = encodeURIComponent(address);
    return `https://www.openstreetmap.org/export/embed.html?bbox=-74.1,40.6,-73.9,40.8&layer=mapnik&marker=40.7128,-74.006`;
  };

  // Get directions URL
  const getDirectionsUrl = () => {
    if (latitude && longitude) {
      return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  };

  // Container styles
  const containerStyles: React.CSSProperties = {
    maxWidth: maxWidth || undefined,
    backgroundColor: backgroundColor || undefined,
  };

  // Map styles
  const darkFilter =
    resolvedMapStyle === "dark" ? "invert(90%) hue-rotate(180deg)" : "";
  const mapStyles: React.CSSProperties = {
    height: aspectRatio === "auto" ? `${height}px` : undefined,
    borderColor: border ? borderColor : undefined,
    borderWidth: border ? `${borderWidth}px` : undefined,
    borderStyle: border ? "solid" : undefined,
    filter:
      [
        grayscale
          ? "grayscale(100%)"
          : saturation !== 100
            ? `saturate(${saturation}%)`
            : "",
        darkFilter,
      ]
        .filter(Boolean)
        .join(" ") || undefined,
  };

  // Render directions link
  const renderDirectionsLink = () => {
    if (!showDirectionsLink) return null;

    const link = (
      <a
        href={getDirectionsUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium hover:underline"
        style={{ color: "var(--brand-primary, #3b82f6)" }}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        {directionsLinkText}
      </a>
    );

    if (directionsLinkPosition === "overlay") {
      return (
        <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-md">
          {link}
        </div>
      );
    }

    return link;
  };

  // Map iframe
  const mapUrl =
    provider === "openstreetmap" ? buildOsmUrl() : buildGoogleMapUrl();

  const mapElement = (
    <div
      className={`relative ${radiusClass} ${shadowClass} overflow-hidden ${paddingClass}`}
      style={containerStyles}
    >
      {/* Loading placeholder */}
      {showLoadingPlaceholder && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: placeholderColor }}
        >
          <svg
            className="w-8 h-8 text-gray-400 animate-pulse"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
      )}

      {/* Map iframe */}
      <iframe
        id={id}
        src={mapUrl}
        className={`${widthClass} ${aspectClass} border-0 ${className}`}
        style={mapStyles}
        loading={loading}
        allowFullScreen={showFullscreenButton}
        aria-label={ariaLabel || `Map showing ${address}`}
        title={title || `Map of ${address}`}
      />

      {/* Info window overlay */}
      {showInfoWindow && infoWindowTitle && (
        <div
          className="absolute top-4 left-4 rounded-lg shadow-lg p-3 max-w-xs"
          style={{ backgroundColor: "var(--color-card, #ffffff)" }}
        >
          <h4
            className="font-semibold"
            style={{ color: "var(--color-foreground, #111827)" }}
          >
            {infoWindowTitle}
          </h4>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--color-muted-foreground, #6b7280)" }}
          >
            {address}
          </p>
        </div>
      )}

      {/* Multi-marker labels overlay */}
      {markers.length > 1 && (
        <div
          className="absolute bottom-4 left-4 rounded-lg shadow-md p-2"
          style={{ backgroundColor: "var(--color-card, #ffffff)" }}
        >
          <div
            className="text-xs font-medium mb-1"
            style={{ color: "var(--color-foreground, #111827)" }}
          >
            {markers.length} locations
          </div>
          {markers.slice(0, 5).map((m, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs py-0.5">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: m.color || markerColor }}
              />
              <span style={{ color: "var(--color-muted-foreground, #6b7280)" }}>
                {m.label || `${m.lat.toFixed(4)}, ${m.lng.toFixed(4)}`}
              </span>
            </div>
          ))}
          {markers.length > 5 && (
            <div
              className="text-xs mt-0.5"
              style={{ color: "var(--color-muted-foreground, #6b7280)" }}
            >
              +{markers.length - 5} more
            </div>
          )}
        </div>
      )}

      {/* Overlay directions link */}
      {directionsLinkPosition === "overlay" && renderDirectionsLink()}
    </div>
  );

  // With directions and caption
  const fullElement = (
    <div className={widthClass}>
      {directionsLinkPosition === "above" && renderDirectionsLink()}
      {mapElement}
      {directionsLinkPosition === "below" && renderDirectionsLink()}
    </div>
  );

  // Caption
  if (caption) {
    return (
      <figure className={widthClass}>
        {fullElement}
        <figcaption
          className={`mt-2 text-sm text-${captionAlign}`}
          style={{ color: captionColor }}
        >
          {caption}
        </figcaption>
      </figure>
    );
  }

  return fullElement;
}

// ============================================================================
// HERO - Premium Hero Section with Multiple Variants
// ============================================================================

export interface HeroProps {
  title?: string;
  titleSize?: "sm" | "md" | "lg" | "xl" | "2xl";
  subtitle?: string;
  description?: string;
  descriptionMaxWidth?: "sm" | "md" | "lg" | "xl" | "full";
  variant?: "centered" | "split" | "fullscreen" | "minimal" | "video";
  backgroundColor?: string;
  backgroundImage?: string | ImageValue;
  backgroundGradient?: GradientConfig;
  backgroundOverlay?: boolean;
  backgroundOverlayColor?: string;
  backgroundOverlayOpacity?: number;
  showPattern?: boolean;
  patternType?: "dots" | "grid" | "diagonal" | "waves";
  patternOpacity?: number;
  textColor?: string;
  primaryButtonText?: string;
  primaryButtonLink?: string;
  primaryButtonColor?: string;
  primaryButtonTextColor?: string;
  primaryButtonRadius?: "sm" | "md" | "lg" | "full";
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  secondaryButtonColor?: string;
  image?: string | ImageValue;
  imageAlt?: string;
  imagePosition?: "left" | "right";
  imageRounded?: "none" | "md" | "lg" | "xl" | "2xl";
  imageShadow?: "none" | "md" | "lg" | "xl" | "2xl";
  videoSrc?: string;
  badge?: string;
  badgeColor?: string;
  badgeTextColor?: string;
  badgeStyle?: "filled" | "outline" | "pill";
  minHeight?: "auto" | "screen" | "half";
  maxWidth?: "md" | "lg" | "xl" | "2xl" | "full";
  contentAlign?: "left" | "center" | "right";
  paddingY?: "sm" | "md" | "lg" | "xl";
  paddingX?: "sm" | "md" | "lg" | "xl";
  showScrollIndicator?: boolean;
  scrollIndicatorColor?: string;
  animateOnLoad?: boolean;
  animationType?: "fade" | "slide-up" | "slide-down" | "zoom";
  id?: string;
  className?: string;
}

export function HeroRender({
  title = "Welcome to Our Platform",
  titleSize = "xl",
  subtitle,
  description = "Build amazing experiences with our powerful tools and beautiful components.",
  descriptionMaxWidth = "lg",
  variant = "centered",
  backgroundColor = "#ffffff",
  backgroundImage,
  backgroundGradient,
  backgroundOverlay = true,
  backgroundOverlayColor = "#000000",
  backgroundOverlayOpacity = 50,
  showPattern = false,
  patternType = "dots",
  patternOpacity = 10,
  textColor,
  primaryButtonText = "Get Started",
  primaryButtonLink = "#",
  primaryButtonColor = "",
  primaryButtonTextColor = "#ffffff",
  primaryButtonRadius = "lg",
  secondaryButtonText,
  secondaryButtonLink = "#",
  secondaryButtonColor,
  image,
  imageAlt = "Hero image",
  imagePosition = "right",
  imageRounded = "xl",
  imageShadow = "2xl",
  videoSrc,
  badge,
  badgeColor = "",
  badgeTextColor = "#ffffff",
  badgeStyle = "filled",
  minHeight = "auto",
  maxWidth = "xl",
  contentAlign = "center",
  paddingY = "lg",
  paddingX = "md",
  showScrollIndicator = false,
  scrollIndicatorColor,
  animateOnLoad = false,
  animationType = "fade",
  id,
  className = "",
}: HeroProps) {
  // Normalize image values
  const bgImageUrl = getImageUrl(backgroundImage);
  const heroImageUrl = getImageUrl(image);
  const heroImageAlt = imageAlt || getImageAlt(image, "Hero image");
  const hasBackgroundImage = !!bgImageUrl;
  const dark = isDarkBackground(backgroundColor);
  // Overlay-aware darkness: considers bg color, bg image, AND overlay color/opacity
  const effectivelyDark = isEffectivelyDark(
    backgroundColor,
    bgImageUrl,
    backgroundOverlay,
    backgroundOverlayColor,
    backgroundOverlayOpacity,
  );

  // Dark-aware text color: force light text when section is visually dark.
  // Brand injection may set textColor to a dark foreground — override when invisible.
  const resolvedTextColor = resolveContrastColor(textColor, effectivelyDark);

  const pyClasses = paddingYMapUtil[paddingY] || paddingYMapUtil.lg;
  const pxClasses = paddingXMapUtil[paddingX] || paddingXMapUtil.md;

  const titleSizeClasses = {
    sm: "text-2xl sm:text-3xl md:text-4xl",
    md: "text-3xl sm:text-4xl md:text-5xl",
    lg: "text-3xl sm:text-4xl md:text-5xl lg:text-6xl",
    xl: "text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl",
    "2xl": "text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl",
  }[titleSize];

  const descMaxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-3xl",
    full: "max-w-full",
  }[descriptionMaxWidth];

  const contentMaxWidthClasses = {
    md: "max-w-3xl",
    lg: "max-w-4xl",
    xl: "max-w-5xl",
    "2xl": "max-w-6xl",
    full: "max-w-screen-xl",
  }[maxWidth];

  const heightClasses = {
    auto: "",
    screen: "min-h-screen",
    half: "min-h-[50vh]",
  }[minHeight];

  const alignClasses = {
    left: "text-left items-start",
    center: "text-center items-center",
    right: "text-right items-end",
  }[contentAlign];

  const imageRoundedClasses = {
    none: "",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
  }[imageRounded];

  const imageShadowClasses = {
    none: "",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
    "2xl": "shadow-2xl",
  }[imageShadow];

  const buttonRadiusClasses = {
    sm: "rounded",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  }[primaryButtonRadius];

  const resolvedBtnColor =
    primaryButtonColor && primaryButtonColor !== "transparent"
      ? primaryButtonColor
      : effectivelyDark
        ? "#e5a956"
        : "var(--brand-primary, #3b82f6)";
  const resolvedSecondaryColor = (() => {
    const sec =
      secondaryButtonColor === "transparent"
        ? undefined
        : secondaryButtonColor;
    return resolveContrastColor(
      sec,
      effectivelyDark,
      resolvedTextColor || "#374151",
    );
  })();

  const animationClasses = animateOnLoad
    ? {
        fade: "animate-in fade-in duration-700",
        "slide-up": "animate-in slide-in-from-bottom-4 duration-700",
        "slide-down": "animate-in slide-in-from-top-4 duration-700",
        zoom: "animate-in zoom-in-95 duration-700",
      }[animationType] || ""
    : "";

  // Build background styles
  const backgroundStyles: React.CSSProperties = {};
  if (backgroundGradient) {
    backgroundStyles.backgroundImage = buildGradientCSS(backgroundGradient);
  } else if (bgImageUrl) {
    backgroundStyles.backgroundImage = `url(${bgImageUrl})`;
    backgroundStyles.backgroundSize = "cover";
    backgroundStyles.backgroundPosition = "center";
  } else {
    backgroundStyles.backgroundColor = backgroundColor;
  }

  // Pattern SVG backgrounds
  const patternSvgs: Record<string, string> = {
    dots: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1.5' cy='1.5' r='1.5' fill='%23${dark ? "ffffff" : "000000"}'/%3E%3C/svg%3E")`,
    grid: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none' stroke='%23${dark ? "ffffff" : "000000"}' stroke-width='0.5'/%3E%3C/svg%3E")`,
    diagonal: `url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 16L16 0' stroke='%23${dark ? "ffffff" : "000000"}' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`,
    waves: `url("data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10c25 0 25-10 50-10s25 10 50 10' stroke='%23${dark ? "ffffff" : "000000"}' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`,
  };

  // Badge rendering
  const renderBadge = (centerSelf?: boolean) => {
    if (!badge) return null;
    const badgeStyles: React.CSSProperties =
      badgeStyle === "outline"
        ? {
            borderColor: badgeColor || resolvedBtnColor,
            color: badgeColor || resolvedBtnColor,
            backgroundColor: "transparent",
          }
        : {
            backgroundColor: badgeColor || resolvedBtnColor,
            color: badgeTextColor,
          };
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs md:text-sm font-medium mb-4 md:mb-6 ${centerSelf ? "self-center" : "self-start"} ${badgeStyle === "outline" ? "border" : ""}`}
        style={badgeStyles}
      >
        {badge}
      </span>
    );
  };

  // Scroll indicator
  const renderScrollIndicator = () => {
    if (!showScrollIndicator) return null;
    const indicatorColor =
      scrollIndicatorColor || resolvedTextColor || (effectivelyDark ? "#ffffff" : "#374151");
    return (
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce z-10">
        <svg
          className="w-6 h-6"
          style={{ color: indicatorColor }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </div>
    );
  };

  // Overlay & pattern layers
  const renderOverlays = () => (
    <>
      {(bgImageUrl || backgroundGradient) && backgroundOverlay && (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: backgroundOverlayColor,
            opacity: backgroundOverlayOpacity / 100,
          }}
          aria-hidden="true"
        />
      )}
      {showPattern && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: patternSvgs[patternType] || patternSvgs.dots,
            backgroundRepeat: "repeat",
            opacity: (patternOpacity || 10) / 100,
          }}
          aria-hidden="true"
        />
      )}
    </>
  );

  // Centered Hero
  if (variant === "centered" || variant === "minimal") {
    return (
      <section
        id={id}
        className={`relative w-full ${pyClasses} ${pxClasses} ${heightClasses} flex flex-col justify-center ${animationClasses} ${className}`}
        style={backgroundStyles}
      >
        {renderOverlays()}
        <div
          className={`relative z-10 ${contentMaxWidthClasses} mx-auto flex flex-col ${alignClasses}`}
        >
          {renderBadge(contentAlign === "center")}
          <h1
            className={`${titleSizeClasses} font-bold mb-4 md:mb-6 leading-tight`}
            style={{ color: resolvedTextColor }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="text-lg md:text-xl lg:text-2xl font-medium mb-2 md:mb-4 opacity-90"
              style={{ color: resolvedTextColor }}
            >
              {subtitle}
            </p>
          )}
          <p
            className={`text-base md:text-lg lg:text-xl ${descMaxWidthClasses} mb-6 md:mb-8 opacity-80 leading-relaxed`}
            style={{ color: resolvedTextColor }}
          >
            {description}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <a
              href={primaryButtonLink}
              className={`inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 text-base md:text-lg font-medium ${buttonRadiusClasses} hover:opacity-90 transition-all shadow-lg hover:shadow-xl`}
              style={{
                backgroundColor: resolvedBtnColor,
                color: primaryButtonTextColor,
              }}
            >
              {primaryButtonText}
            </a>
            {secondaryButtonText && (
              <a
                href={secondaryButtonLink}
                className={`inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 text-base md:text-lg font-medium border-2 ${buttonRadiusClasses} hover:opacity-80 transition-all`}
                style={{
                  borderColor: resolvedSecondaryColor,
                  color: resolvedSecondaryColor,
                }}
              >
                {secondaryButtonText}
              </a>
            )}
          </div>
        </div>
        {renderScrollIndicator()}
      </section>
    );
  }

  // Split Hero with Image
  if (variant === "split") {
    const contentOrder = imagePosition === "left" ? "md:order-2" : "md:order-1";
    const imageOrder = imagePosition === "left" ? "md:order-1" : "md:order-2";

    return (
      <section
        id={id}
        className={`relative w-full ${pyClasses} ${pxClasses} ${animationClasses} ${className}`}
        style={backgroundStyles}
      >
        {renderOverlays()}
        <div className="relative z-10 max-w-screen-xl mx-auto grid md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
          <div className={`flex flex-col ${contentOrder}`}>
            {renderBadge(false)}
            <h1
              className={`${titleSizeClasses} font-bold mb-4 md:mb-6 leading-tight`}
              style={{ color: resolvedTextColor }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className="text-lg md:text-xl font-medium mb-2 opacity-90"
                style={{ color: resolvedTextColor }}
              >
                {subtitle}
              </p>
            )}
            <p
              className="text-base md:text-lg mb-6 md:mb-8 opacity-80 leading-relaxed"
              style={{ color: resolvedTextColor }}
            >
              {description}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <a
                href={primaryButtonLink}
                className={`inline-flex items-center justify-center px-6 py-3 text-base font-medium ${buttonRadiusClasses} hover:opacity-90 transition-all shadow-lg`}
                style={{
                  backgroundColor: resolvedBtnColor,
                  color: primaryButtonTextColor,
                }}
              >
                {primaryButtonText}
              </a>
              {secondaryButtonText && (
                <a
                  href={secondaryButtonLink}
                  className={`inline-flex items-center justify-center px-6 py-3 text-base font-medium border-2 ${buttonRadiusClasses} hover:opacity-80 transition-all`}
                  style={{
                    borderColor: resolvedSecondaryColor,
                    color: resolvedSecondaryColor,
                  }}
                >
                  {secondaryButtonText}
                </a>
              )}
            </div>
          </div>
          <div className={`${imageOrder}`}>
            {heroImageUrl && (
              <img
                src={heroImageUrl}
                alt={heroImageAlt}
                className={`w-full h-auto ${imageRoundedClasses} ${imageShadowClasses}`}
                loading="lazy"
              />
            )}
          </div>
        </div>
        {renderScrollIndicator()}
      </section>
    );
  }

  // Video Hero
  if (variant === "video" && videoSrc) {
    return (
      <section
        id={id}
        className={`relative w-full min-h-screen flex items-center justify-center ${pxClasses} overflow-hidden ${animationClasses} ${className}`}
      >
        {/* Video Background */}
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster={bgImageUrl}
        >
          <source src={videoSrc} type="video/mp4" />
          {/* Fallback to background image if video doesn't load */}
        </video>

        {/* Overlay */}
        {backgroundOverlay && (
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: backgroundOverlayColor,
              opacity: backgroundOverlayOpacity / 100,
            }}
            aria-hidden="true"
          />
        )}

        {/* Content */}
        <div
          className={`relative z-10 ${contentMaxWidthClasses} mx-auto flex flex-col ${alignClasses}`}
        >
          {renderBadge(contentAlign === "center")}
          <h1
            className={`${titleSizeClasses} font-bold mb-6 leading-tight`}
            style={{ color: resolvedTextColor || "#ffffff" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="text-lg md:text-xl lg:text-2xl font-medium mb-4 opacity-90"
              style={{ color: resolvedTextColor || "#ffffff" }}
            >
              {subtitle}
            </p>
          )}
          <p
            className={`text-lg md:text-xl lg:text-2xl mb-8 opacity-90 ${descMaxWidthClasses}`}
            style={{ color: resolvedTextColor || "#ffffff" }}
          >
            {description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href={primaryButtonLink}
              className={`inline-flex items-center justify-center px-8 py-4 text-lg font-medium ${buttonRadiusClasses} hover:opacity-90 transition-all shadow-lg`}
              style={{
                backgroundColor: resolvedBtnColor,
                color: primaryButtonTextColor,
              }}
            >
              {primaryButtonText}
            </a>
            {secondaryButtonText && (
              <a
                href={secondaryButtonLink}
                className={`inline-flex items-center justify-center px-8 py-4 text-lg font-medium border-2 ${buttonRadiusClasses} hover:opacity-80 transition-all`}
                style={{
                  borderColor: resolvedSecondaryColor,
                  color: resolvedSecondaryColor,
                }}
              >
                {secondaryButtonText}
              </a>
            )}
          </div>
        </div>
        {renderScrollIndicator()}
      </section>
    );
  }

  // Fullscreen Hero
  return (
    <section
      id={id}
      className={`relative w-full min-h-screen flex items-center justify-center ${pxClasses} ${animationClasses} ${className}`}
      style={backgroundStyles}
    >
      {renderOverlays()}
      <div
        className={`relative z-10 ${contentMaxWidthClasses} mx-auto flex flex-col ${alignClasses}`}
      >
        {renderBadge(contentAlign === "center")}
        <h1
          className={`${titleSizeClasses} font-bold mb-6 leading-tight`}
          style={{ color: resolvedTextColor || "#ffffff" }}
        >
          {title}
        </h1>
        <p
          className={`text-lg md:text-xl lg:text-2xl mb-8 opacity-90 ${descMaxWidthClasses}`}
          style={{ color: resolvedTextColor || "#ffffff" }}
        >
          {description}
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href={primaryButtonLink}
            className={`inline-flex items-center justify-center px-8 py-4 text-lg font-medium ${buttonRadiusClasses} hover:opacity-90 transition-all shadow-lg`}
            style={{
              backgroundColor: resolvedBtnColor,
              color: primaryButtonTextColor,
            }}
          >
            {primaryButtonText}
          </a>
          {secondaryButtonText && (
            <a
              href={secondaryButtonLink}
              className={`inline-flex items-center justify-center px-8 py-4 text-lg font-medium border-2 ${buttonRadiusClasses} hover:opacity-80 transition-all`}
              style={{
                borderColor: resolvedSecondaryColor,
                color: resolvedSecondaryColor,
              }}
            >
              {secondaryButtonText}
            </a>
          )}
        </div>
      </div>
      {renderScrollIndicator()}
    </section>
  );
}

// ============================================================================
// FEATURES - Feature Grid with Icons
// ============================================================================

export interface FeatureItem {
  title?: string;
  description?: string;
  icon?: string;
  iconColor?: string;
  iconBackgroundColor?: string;
  image?: string | ImageValue;
  link?: string;
  linkText?: string;
  badge?: string;
  isFeatured?: boolean;
}

export interface FeaturesProps {
  // Header Content
  title?: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  badgeIcon?: string;

  // Header Styling
  headerAlign?: "left" | "center" | "right";
  titleSize?: "sm" | "md" | "lg" | "xl" | "2xl";
  titleColor?: string;
  titleFont?: string;
  subtitleColor?: string;
  descriptionColor?: string;
  badgeStyle?: "pill" | "outlined" | "solid" | "gradient";
  badgeColor?: string;
  badgeTextColor?: string;

  // Features Array
  features?: FeatureItem[];

  // Layout & Variant
  variant?:
    | "cards"
    | "minimal"
    | "centered"
    | "icons-left"
    | "icons-top"
    | "alternating"
    | "bento"
    | "list"
    | "timeline"
    | "masonry";
  columns?: 2 | 3 | 4 | 5;
  maxWidth?: "md" | "lg" | "xl" | "2xl" | "full";
  contentAlign?: "left" | "center" | "right";

  // Card Styling
  backgroundColor?: string;
  cardBackgroundColor?: string;
  cardHoverBackgroundColor?: string;
  featuredCardBackground?: string;
  showBorder?: boolean;
  cardBorderColor?: string;
  cardBorderWidth?: "1" | "2" | "3";
  cardBorderRadius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  showShadow?: boolean;
  cardShadow?: "none" | "sm" | "md" | "lg" | "xl";
  cardHoverShadow?: "none" | "sm" | "md" | "lg" | "xl";
  cardPadding?: "sm" | "md" | "lg" | "xl";
  hoverEffect?: "none" | "lift" | "scale" | "glow" | "border";

  // Icon Styling
  iconStyle?: "emoji" | "icon" | "image" | "number";
  iconSize?: "sm" | "md" | "lg" | "xl";
  iconShape?: "circle" | "square" | "rounded" | "none";
  iconPosition?: "top" | "left" | "inline";
  showIconBackground?: boolean;
  defaultIconColor?: string;
  defaultIconBackgroundColor?: string;
  iconBorder?: boolean;
  iconBorderColor?: string;

  // Title & Description
  featureTitleSize?: "sm" | "md" | "lg" | "xl";
  featureTitleColor?: string;
  featureTitleFont?: string;
  featureTitleWeight?: "normal" | "medium" | "semibold" | "bold";
  featureDescriptionSize?: "xs" | "sm" | "md";
  featureDescriptionColor?: string;
  descriptionMaxLines?: number;

  // Links
  showLinks?: boolean;
  linkStyle?: "text" | "button" | "arrow";
  linkColor?: string;
  linkHoverColor?: string;
  defaultLinkText?: string;

  // Numbering
  showNumbers?: boolean;
  numberStyle?: "circle" | "plain" | "badge";
  numberColor?: string;
  numberBackgroundColor?: string;

  // Highlight/Featured
  highlightFeatured?: boolean;
  featuredBorderColor?: string;
  featuredBadgeText?: string;

  // Section Sizing
  paddingY?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  paddingX?: "none" | "sm" | "md" | "lg" | "xl";
  gap?: "sm" | "md" | "lg" | "xl";
  sectionGap?: "sm" | "md" | "lg" | "xl";

  // Background
  backgroundStyle?: "solid" | "gradient" | "pattern" | "image";
  backgroundGradientFrom?: string;
  backgroundGradientTo?: string;
  backgroundGradientDirection?:
    | "to-r"
    | "to-l"
    | "to-t"
    | "to-b"
    | "to-br"
    | "to-bl";
  backgroundPattern?: "dots" | "grid" | "lines";
  backgroundPatternOpacity?: number;
  backgroundImage?: string | ImageValue;
  backgroundOverlay?: boolean;
  backgroundOverlayColor?: string;
  backgroundOverlayOpacity?: number;

  // Decorative
  showDecorators?: boolean;
  decoratorStyle?: "dots" | "circles" | "blur";
  decoratorColor?: string;
  decoratorPosition?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "both-sides";

  // Animation
  animateOnScroll?: boolean;
  animationType?:
    | "fade"
    | "slide-up"
    | "slide-left"
    | "slide-right"
    | "scale"
    | "stagger";
  animationDelay?: number;
  staggerDelay?: number;

  // CTA
  showCta?: boolean;
  ctaTitle?: string;
  ctaDescription?: string;
  ctaButtonText?: string;
  ctaButtonLink?: string;
  ctaButtonStyle?: "primary" | "secondary" | "outline";

  // Responsive
  mobileColumns?: 1 | 2;
  stackOnMobile?: boolean;
  compactOnMobile?: boolean;

  // Colors
  textColor?: string;
  accentColor?: string;

  id?: string;
  className?: string;
}

export function FeaturesRender({
  // Header Content
  title = "Amazing Features",
  subtitle,
  description,
  badge,
  badgeIcon,

  // Header Styling
  headerAlign = "center",
  titleSize = "lg",
  titleColor,
  titleFont,
  subtitleColor,
  descriptionColor,
  badgeStyle = "pill",
  badgeColor = "",
  badgeTextColor = "#ffffff",

  // Features
  features = [],

  // Layout & Variant
  variant = "cards",
  columns = 3,
  maxWidth = "xl",
  contentAlign = "left",

  // Card Styling
  backgroundColor = "#ffffff",
  cardBackgroundColor = "#ffffff",
  cardHoverBackgroundColor,
  featuredCardBackground = "",
  showBorder = true,
  cardBorderColor = "#e5e7eb",
  cardBorderWidth = "1",
  cardBorderRadius = "xl",
  showShadow = true,
  cardShadow = "sm",
  cardHoverShadow = "lg",
  cardPadding = "lg",
  hoverEffect = "lift",

  // Icon Styling
  iconStyle = "emoji",
  iconSize = "lg",
  iconShape = "rounded",
  iconPosition = "top",
  showIconBackground = true,
  defaultIconColor = "",
  defaultIconBackgroundColor,
  iconBorder = false,
  iconBorderColor = "",

  // Title & Description
  featureTitleSize = "lg",
  featureTitleColor,
  featureTitleFont,
  featureTitleWeight = "semibold",
  featureDescriptionSize = "sm",
  featureDescriptionColor,
  descriptionMaxLines = 0,

  // Links
  showLinks = true,
  linkStyle = "arrow",
  linkColor = "",
  linkHoverColor = "",
  defaultLinkText = "Learn more",

  // Numbering
  showNumbers = false,
  numberStyle = "circle",
  numberColor = "#ffffff",
  numberBackgroundColor,

  // Highlight/Featured
  highlightFeatured = false,
  featuredBorderColor = "",
  featuredBadgeText = "Popular",

  // Section Sizing
  paddingY = "lg",
  paddingX = "md",
  gap = "lg",
  sectionGap = "lg",

  // Background
  backgroundStyle = "solid",
  backgroundGradientFrom = "#ffffff",
  backgroundGradientTo = "#f3f4f6",
  backgroundGradientDirection = "to-b",
  backgroundPattern,
  backgroundPatternOpacity = 0.1,
  backgroundImage,
  backgroundOverlay = false,
  backgroundOverlayColor = "#000000",
  backgroundOverlayOpacity = 0.5,

  // Decorative
  showDecorators = false,
  decoratorStyle = "blur",
  decoratorColor = "",
  decoratorPosition = "both-sides",

  // Animation
  animateOnScroll = false,
  animationType = "fade",
  animationDelay = 0,
  staggerDelay = 100,

  // CTA
  showCta = false,
  ctaTitle = "Ready to Get Started?",
  ctaDescription = "Join thousands of satisfied customers today.",
  ctaButtonText = "Get Started",
  ctaButtonLink = "#",
  ctaButtonStyle = "primary",

  // Responsive
  mobileColumns = 1,
  stackOnMobile = true,
  compactOnMobile = false,

  // Colors
  textColor,
  accentColor = "",

  id,
  className = "",
}: FeaturesProps) {
  // Overlay-aware darkness detection for brand-injected color correction
  const featBgImageUrl = backgroundStyle === "image" ? getImageUrl(backgroundImage) : undefined;
  const effectivelyDark = isEffectivelyDark(
    backgroundColor,
    featBgImageUrl,
    backgroundOverlay,
    backgroundOverlayColor,
    backgroundOverlayOpacity,
  );
  const resolvedTextColor = resolveContrastColor(textColor, effectivelyDark);

  // Padding classes
  const paddingYClasses = {
    none: "",
    sm: "py-8 md:py-12",
    md: "py-12 md:py-16",
    lg: "py-16 md:py-24",
    xl: "py-20 md:py-32",
    "2xl": "py-24 md:py-40",
  }[paddingY];

  const paddingXClasses = {
    none: "",
    sm: "px-4",
    md: "px-4 md:px-6",
    lg: "px-4 md:px-8",
    xl: "px-4 md:px-12",
  }[paddingX];

  // Max width classes
  const maxWidthClasses = {
    md: "max-w-3xl",
    lg: "max-w-5xl",
    xl: "max-w-7xl",
    "2xl": "max-w-screen-2xl",
    full: "max-w-full",
  }[maxWidth];

  // Column classes — use static lookup so Tailwind JIT can detect them
  const mobileColsClass =
    ({ 1: "grid-cols-1", 2: "grid-cols-2" } as Record<number, string>)[
      mobileColumns
    ] || "grid-cols-1";

  const columnClasses = {
    2: `${mobileColsClass} md:grid-cols-2`,
    3: `${mobileColsClass} md:grid-cols-2 lg:grid-cols-3`,
    4: `${mobileColsClass} md:grid-cols-2 lg:grid-cols-4`,
    5: `${mobileColsClass} md:grid-cols-3 lg:grid-cols-5`,
  }[columns];

  // Title size classes
  const titleSizeClasses = {
    sm: "text-xl md:text-2xl",
    md: "text-2xl md:text-3xl",
    lg: "text-3xl md:text-4xl lg:text-5xl",
    xl: "text-4xl md:text-5xl lg:text-6xl",
    "2xl": "text-5xl md:text-6xl lg:text-7xl",
  }[titleSize];

  // Feature title size classes
  const featureTitleSizeClasses = {
    sm: "text-sm md:text-base",
    md: "text-base md:text-lg",
    lg: "text-lg md:text-xl",
    xl: "text-xl md:text-2xl",
  }[featureTitleSize];

  // Feature title weight classes
  const featureTitleWeightClasses = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
  }[featureTitleWeight];

  // Feature description size classes
  const featureDescriptionSizeClasses = {
    xs: "text-xs md:text-sm",
    sm: "text-sm md:text-base",
    md: "text-base md:text-lg",
  }[featureDescriptionSize];

  // Icon size classes
  const iconSizeClasses = {
    sm: "w-8 h-8 md:w-10 md:h-10 text-lg",
    md: "w-10 h-10 md:w-12 md:h-12 text-xl",
    lg: "w-12 h-12 md:w-14 md:h-14 text-2xl",
    xl: "w-14 h-14 md:w-16 md:h-16 text-3xl",
  }[iconSize];

  // Icon shape classes
  const iconShapeClasses = {
    circle: "rounded-full",
    square: "rounded-none",
    rounded: "rounded-lg",
    none: "",
  }[iconShape];

  // Card padding classes
  const cardPaddingClasses = {
    sm: "p-4",
    md: "p-5 md:p-6",
    lg: "p-6 md:p-8",
    xl: "p-8 md:p-10",
  }[cardPadding];

  // Border radius classes
  const borderRadiusClasses = {
    none: "rounded-none",
    sm: "rounded",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
  }[cardBorderRadius];

  // Shadow classes
  const shadowClasses = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
  }[cardShadow];

  // Hover effect classes
  const hoverEffectClasses = {
    none: "",
    lift: "hover:-translate-y-2 transition-all duration-300",
    scale: "hover:scale-105 transition-transform duration-300",
    glow: "hover:ring-2 hover:ring-offset-2 transition-all duration-300",
    border: "transition-all duration-300",
  }[hoverEffect];

  // Gap classes
  const gapClasses = {
    sm: "gap-4 md:gap-5",
    md: "gap-5 md:gap-6",
    lg: "gap-6 md:gap-8",
    xl: "gap-8 md:gap-10",
  }[gap];

  // Section gap classes
  const sectionGapClasses = {
    sm: "mb-8 md:mb-10",
    md: "mb-10 md:mb-12",
    lg: "mb-12 md:mb-16",
    xl: "mb-16 md:mb-20",
  }[sectionGap];

  // Content alignment
  const contentAlignClasses = {
    left: "text-left items-start",
    center: "text-center items-center",
    right: "text-right items-end",
  }[contentAlign];

  // Badge styles
  const badgeClasses = {
    pill: "px-4 py-1.5 rounded-full text-sm font-medium",
    outlined:
      "px-4 py-1.5 rounded-full text-sm font-medium border-2 bg-transparent",
    solid: "px-4 py-2 rounded-md text-sm font-medium",
    gradient: "px-4 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r",
  }[badgeStyle];

  // Get background style
  const getBackgroundStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = {};

    if (backgroundStyle === "solid") {
      style.backgroundColor = backgroundColor;
    } else if (backgroundStyle === "gradient") {
      const direction = {
        "to-r": "to right",
        "to-l": "to left",
        "to-t": "to top",
        "to-b": "to bottom",
        "to-br": "to bottom right",
        "to-bl": "to bottom left",
      }[backgroundGradientDirection];
      style.background = `linear-gradient(${direction}, ${backgroundGradientFrom}, ${backgroundGradientTo})`;
    } else if (backgroundStyle === "image" && backgroundImage) {
      style.backgroundImage = `url(${getImageUrl(backgroundImage)})`;
      style.backgroundSize = "cover";
      style.backgroundPosition = "center";
    }

    return style;
  };

  // Animation classes
  const getAnimationClasses = (index: number) => {
    if (!animateOnScroll) return "";
    const baseClasses = "animate-in duration-500";
    const typeClasses = {
      fade: "fade-in",
      "slide-up": "slide-in-from-bottom-4",
      "slide-left": "slide-in-from-left-4",
      "slide-right": "slide-in-from-right-4",
      scale: "zoom-in-95",
      stagger: "fade-in slide-in-from-bottom-2",
    }[animationType];
    return `${baseClasses} ${typeClasses}`;
  };

  // Render decorators
  const renderDecorators = () => {
    if (!showDecorators) return null;

    const decoratorElement = () => {
      switch (decoratorStyle) {
        case "dots":
          return (
            <div className="grid grid-cols-4 gap-2 w-24 h-24 opacity-20">
              {Array.from({ length: 16 }).map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: decoratorColor }}
                />
              ))}
            </div>
          );
        case "circles":
          return (
            <div className="relative w-40 h-40 opacity-20">
              <div
                className="absolute w-full h-full rounded-full border-4"
                style={{ borderColor: decoratorColor }}
              />
              <div
                className="absolute w-2/3 h-2/3 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-4"
                style={{ borderColor: decoratorColor }}
              />
            </div>
          );
        case "blur":
          return (
            <div
              className="w-64 h-64 rounded-full blur-3xl opacity-30"
              style={{ backgroundColor: decoratorColor }}
            />
          );
        default:
          return null;
      }
    };

    if (decoratorPosition === "both-sides") {
      return (
        <>
          <div className="absolute top-0 left-0 pointer-events-none">
            {decoratorElement()}
          </div>
          <div className="absolute bottom-0 right-0 pointer-events-none">
            {decoratorElement()}
          </div>
        </>
      );
    }

    const positionClasses = {
      "top-left": "top-0 left-0",
      "top-right": "top-0 right-0",
      "bottom-left": "bottom-0 left-0",
      "bottom-right": "bottom-0 right-0",
      "both-sides": "",
    }[decoratorPosition];

    return (
      <div className={`absolute ${positionClasses} pointer-events-none`}>
        {decoratorElement()}
      </div>
    );
  };

  // CTA button classes
  const ctaButtonClasses = {
    primary:
      "px-6 py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90",
    secondary:
      "px-6 py-3 rounded-lg font-semibold transition-all hover:opacity-90",
    outline:
      "px-6 py-3 rounded-lg font-semibold border-2 bg-transparent transition-all hover:bg-opacity-10",
  }[ctaButtonStyle];

  // Render feature icon
  const renderIcon = (feature: FeatureItem, index: number) => {
    const iconBgColor =
      feature.iconBackgroundColor ||
      defaultIconBackgroundColor ||
      `${feature.iconColor || defaultIconColor}20`;

    if (showNumbers) {
      return (
        <div
          className={`${iconSizeClasses} ${numberStyle === "circle" ? "rounded-full" : numberStyle === "badge" ? "rounded-lg" : ""} flex items-center justify-center font-bold`}
          style={{
            backgroundColor: numberBackgroundColor || accentColor,
            color: numberColor,
          }}
        >
          {index + 1}
        </div>
      );
    }

    if (iconStyle === "image" && feature.image) {
      return (
        <img
          src={getImageUrl(feature.image) || "/placeholder.svg"}
          alt={feature.title || "Feature"}
          className={`${iconSizeClasses} ${iconShapeClasses} object-cover`}
        />
      );
    }

    return (
      <div
        className={`${iconSizeClasses} ${iconShapeClasses} flex items-center justify-center ${iconBorder ? "ring-2 ring-offset-2" : ""}`}
        style={{
          backgroundColor: showIconBackground ? iconBgColor : "transparent",
          color: feature.iconColor || defaultIconColor,
          // @ts-expect-error - Custom CSS property for ring-color
          "--tw-ring-color": iconBorder ? iconBorderColor : undefined,
        }}
      >
        <span>{feature.icon || "✨"}</span>
      </div>
    );
  };

  // Render link
  const renderLink = (feature: FeatureItem) => {
    if (!showLinks || !feature.link) return null;

    const text = feature.linkText || defaultLinkText;

    if (linkStyle === "button") {
      return (
        <a
          href={feature.link}
          className="mt-4 inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ backgroundColor: `${linkColor}20`, color: linkColor }}
        >
          {text}
        </a>
      );
    }

    return (
      <a
        href={feature.link}
        className="mt-4 inline-flex items-center text-sm font-medium transition-colors group/link"
        style={{ color: linkColor }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = linkHoverColor;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = linkColor;
        }}
      >
        {text}
        {linkStyle === "arrow" && (
          <svg
            className="w-4 h-4 ml-1 transition-transform group-hover/link:translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        )}
      </a>
    );
  };

  return (
    <section
      id={id}
      className={`w-full ${paddingYClasses} ${paddingXClasses} relative overflow-hidden ${className}`}
      style={getBackgroundStyle()}
    >
      {/* Background overlay for images */}
      {backgroundStyle === "image" && backgroundOverlay && (
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundColor: backgroundOverlayColor,
            opacity: backgroundOverlayOpacity,
          }}
        />
      )}

      {/* Background pattern */}
      {backgroundPattern && (
        <div
          className="absolute inset-0 z-0"
          style={{ opacity: backgroundPatternOpacity }}
        >
          {backgroundPattern === "dots" && (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle, ${accentColor} 1px, transparent 1px)`,
                backgroundSize: "20px 20px",
              }}
            />
          )}
          {backgroundPattern === "grid" && (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `linear-gradient(${accentColor}20 1px, transparent 1px), linear-gradient(90deg, ${accentColor}20 1px, transparent 1px)`,
                backgroundSize: "40px 40px",
              }}
            />
          )}
        </div>
      )}

      {/* Decorators */}
      {renderDecorators()}

      <div className={`${maxWidthClasses} mx-auto relative z-10`}>
        {/* Header */}
        <div
          className={`${sectionGapClasses} ${headerAlign === "center" ? "text-center" : headerAlign === "right" ? "text-right" : "text-left"}`}
        >
          {/* Badge */}
          {badge && (
            <div
              className={`inline-flex items-center gap-2 mb-4 ${badgeClasses}`}
              style={{
                backgroundColor:
                  badgeStyle !== "outlined" ? badgeColor : "transparent",
                color: badgeStyle === "outlined" ? badgeColor : badgeTextColor,
                borderColor: badgeStyle === "outlined" ? badgeColor : undefined,
              }}
            >
              {badgeIcon && <span>{badgeIcon}</span>}
              {badge}
            </div>
          )}

          {/* Subtitle */}
          {subtitle && (
            <p
              className="text-sm md:text-base font-semibold uppercase tracking-wider mb-2"
              style={{ color: resolveContrastColor(subtitleColor || accentColor, effectivelyDark) }}
            >
              {subtitle}
            </p>
          )}

          {/* Title */}
          <h2
            className={`${titleSizeClasses} font-bold mb-4`}
            style={{
              color: titleColor ? resolveContrastColor(titleColor, effectivelyDark) : resolvedTextColor,
              fontFamily: titleFont || undefined,
            }}
          >
            {title}
          </h2>

          {/* Description */}
          {description && (
            <p
              className={`text-base md:text-lg max-w-2xl ${headerAlign === "center" ? "mx-auto" : ""} opacity-80`}
              style={{ color: resolveContrastColor(descriptionColor || textColor, effectivelyDark) }}
            >
              {description}
            </p>
          )}
        </div>

        {/* Features Grid */}
        <div
          className={`grid ${columnClasses} ${gapClasses} ${compactOnMobile ? "gap-3 md:gap-6" : ""}`}
        >
          {features.map((feature, i) => (
            <div
              key={i}
              className={`flex ${iconPosition === "left" ? "flex-row" : "flex-col"} ${contentAlignClasses} ${variant === "cards" ? `${cardPaddingClasses} ${borderRadiusClasses}` : ""} ${showShadow && variant === "cards" ? shadowClasses : ""} ${hoverEffectClasses} ${getAnimationClasses(i)} ${showBorder && variant === "cards" ? "border" : ""} ${feature.isFeatured && highlightFeatured ? "ring-2 relative" : ""} group`}
              style={{
                backgroundColor:
                  variant === "cards"
                    ? feature.isFeatured
                      ? featuredCardBackground
                      : cardBackgroundColor
                    : undefined,
                borderColor: showBorder ? cardBorderColor : undefined,
                borderWidth: showBorder ? `${cardBorderWidth}px` : undefined,
                animationDelay: animateOnScroll
                  ? `${animationDelay + i * staggerDelay}ms`
                  : undefined,
                // @ts-expect-error - Custom CSS property for ring-color
                "--tw-ring-color":
                  feature.isFeatured && highlightFeatured
                    ? featuredBorderColor
                    : undefined,
              }}
            >
              {/* Featured badge */}
              {feature.isFeatured && highlightFeatured && (
                <span
                  className="absolute -top-3 left-4 px-3 py-1 text-xs font-medium rounded-full"
                  style={{
                    backgroundColor: featuredBorderColor,
                    color: "#ffffff",
                  }}
                >
                  {feature.badge || featuredBadgeText}
                </span>
              )}

              {/* Icon */}
              <div
                className={`${iconPosition === "left" ? "mr-4 flex-shrink-0" : "mb-4"} ${contentAlign === "center" && iconPosition !== "left" ? "mx-auto" : ""}`}
              >
                {renderIcon(feature, i)}
              </div>

              {/* Content */}
              <div className={iconPosition === "left" ? "flex-1" : ""}>
                <h3
                  className={`${featureTitleSizeClasses} ${featureTitleWeightClasses} mb-2`}
                  style={{
                    color: resolveContrastColor(featureTitleColor, effectivelyDark) || resolvedTextColor,
                    fontFamily: featureTitleFont || undefined,
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  className={`${featureDescriptionSizeClasses} opacity-75 leading-relaxed`}
                  style={{
                    color: resolveContrastColor(featureDescriptionColor, effectivelyDark) || resolvedTextColor,
                    ...(descriptionMaxLines > 0
                      ? {
                          display: "-webkit-box",
                          WebkitLineClamp: descriptionMaxLines,
                          WebkitBoxOrient: "vertical" as const,
                          overflow: "hidden",
                        }
                      : {}),
                  }}
                >
                  {feature.description}
                </p>
                {renderLink(feature)}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        {showCta && (
          <div
            className="mt-12 md:mt-16 text-center p-8 md:p-12 rounded-2xl"
            style={{ backgroundColor: `${accentColor}10` }}
          >
            <h3
              className="text-xl md:text-2xl font-bold mb-2"
              style={{ color: resolvedTextColor }}
            >
              {ctaTitle}
            </h3>
            <p
              className="text-base opacity-80 mb-6 max-w-lg mx-auto"
              style={{ color: resolvedTextColor }}
            >
              {ctaDescription}
            </p>
            <a
              href={ctaButtonLink}
              className={ctaButtonClasses}
              style={{
                backgroundColor:
                  ctaButtonStyle === "primary"
                    ? accentColor
                    : ctaButtonStyle === "secondary"
                      ? `${accentColor}20`
                      : "transparent",
                borderColor:
                  ctaButtonStyle === "outline" ? accentColor : undefined,
                color:
                  ctaButtonStyle === "outline"
                    ? accentColor
                    : ctaButtonStyle === "secondary"
                      ? resolvedTextColor
                      : "#ffffff",
              }}
            >
              {ctaButtonText}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================================
// CTA - Call To Action Section (PREMIUM - 80+ Properties)
// ============================================================================

export interface CTAProps {
  // === Content ===
  title?: string;
  titleSize?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  titleColor?: string;
  titleWeight?: "normal" | "medium" | "semibold" | "bold" | "extrabold";
  titleAlign?: "left" | "center" | "right";
  titleAnimation?: "none" | "fadeIn" | "slideUp" | "slideDown" | "typewriter";
  subtitle?: string;
  subtitleSize?: "xs" | "sm" | "md" | "lg";
  subtitleColor?: string;
  subtitleWeight?: "normal" | "medium" | "semibold";
  description?: string;
  descriptionSize?: "sm" | "md" | "lg";
  descriptionColor?: string;
  descriptionMaxWidth?: "sm" | "md" | "lg" | "xl" | "full";

  // === Badge ===
  badge?: string;
  badgeColor?: string;
  badgeTextColor?: string;
  badgeStyle?: "solid" | "outline" | "pill" | "glow";
  badgeIcon?: string;
  badgePosition?: "top" | "inline";

  // === Primary CTA Button ===
  buttonText?: string;
  buttonLink?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  /** Alias for buttonColor — AI sometimes generates this naming convention */
  primaryButtonColor?: string;
  /** Alias for buttonTextColor — AI sometimes generates this naming convention */
  primaryButtonTextColor?: string;
  buttonSize?: "sm" | "md" | "lg" | "xl";
  buttonRadius?: "none" | "sm" | "md" | "lg" | "full";
  buttonStyle?: "solid" | "outline" | "gradient" | "glow" | "3d";
  buttonGradientFrom?: string;
  buttonGradientTo?: string;
  buttonIcon?: "none" | "arrow" | "chevron" | "rocket" | "sparkle" | "play";
  buttonIconPosition?: "left" | "right";
  buttonShadow?: "none" | "sm" | "md" | "lg" | "xl" | "glow";
  buttonHoverEffect?: "none" | "scale" | "lift" | "glow" | "shine" | "pulse";
  buttonAnimation?: "none" | "bounce" | "pulse" | "shake";

  // === Secondary CTA Button ===
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  secondaryButtonColor?: string;
  secondaryButtonTextColor?: string;
  secondaryButtonStyle?: "solid" | "outline" | "ghost" | "text" | "link";
  secondaryButtonSize?: "sm" | "md" | "lg";
  secondaryButtonRadius?: "none" | "sm" | "md" | "lg" | "full";
  secondaryButtonIcon?: "none" | "arrow" | "chevron" | "external";

  // === Layout ===
  variant?:
    | "centered"
    | "left"
    | "right"
    | "split"
    | "splitReverse"
    | "banner"
    | "floating"
    | "minimal"
    | "gradient"
    | "glass";
  contentAlign?: "left" | "center" | "right";
  contentWidth?: "sm" | "md" | "lg" | "xl" | "full";
  buttonLayout?: "horizontal" | "vertical" | "stacked";
  buttonGap?: "sm" | "md" | "lg";

  // === Background ===
  backgroundColor?: string;
  backgroundGradient?: boolean;
  backgroundGradientFrom?: string;
  backgroundGradientTo?: string;
  backgroundGradientDirection?:
    | "to-r"
    | "to-l"
    | "to-b"
    | "to-t"
    | "to-br"
    | "to-bl"
    | "to-tr"
    | "to-tl";
  backgroundImage?: string | ImageValue;
  backgroundImagePosition?: "center" | "top" | "bottom" | "left" | "right";
  backgroundImageSize?: "cover" | "contain" | "auto";
  backgroundImageFixed?: boolean;
  backgroundOverlay?: boolean;
  backgroundOverlayColor?: string;
  backgroundOverlayOpacity?: number;
  backgroundPattern?:
    | "none"
    | "dots"
    | "grid"
    | "diagonal"
    | "waves"
    | "circuit";
  backgroundPatternColor?: string;
  backgroundPatternOpacity?: number;

  // === Image (Split Layouts) ===
  image?: string | ImageValue;
  imageAlt?: string;
  imagePosition?: "left" | "right";
  imageFit?: "cover" | "contain" | "fill";
  imageRounded?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  imageShadow?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  imageAnimation?: "none" | "fadeIn" | "slideIn" | "zoom" | "float";
  imageBorder?: boolean;
  imageBorderColor?: string;

  // === Sizing & Spacing ===
  minHeight?: "auto" | "sm" | "md" | "lg" | "xl" | "screen";
  paddingY?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  paddingX?: "sm" | "md" | "lg" | "xl";
  borderRadius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  margin?: "none" | "sm" | "md" | "lg" | "xl";
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";

  // === Effects ===
  textColor?: string;
  shadow?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "inner";
  border?: boolean;
  borderColor?: string;
  borderWidth?: "1" | "2" | "4";
  glassEffect?: boolean;
  glassBlur?: "sm" | "md" | "lg";

  // === Animation ===
  animateOnScroll?: boolean;
  animationType?:
    | "fadeIn"
    | "slideUp"
    | "slideDown"
    | "slideLeft"
    | "slideRight"
    | "zoom"
    | "flip";
  animationDuration?: "fast" | "normal" | "slow";
  animationDelay?: "none" | "sm" | "md" | "lg";

  // === Decorative Elements ===
  showDecorator?: boolean;
  decoratorType?: "circles" | "lines" | "dots" | "waves" | "shapes";
  decoratorColor?: string;
  decoratorOpacity?: number;
  decoratorPosition?: "background" | "corners" | "sides";

  // === Trust Signals ===
  trustBadges?: Array<{
    icon?: string;
    text?: string;
    image?: string | ImageValue;
  }>;
  trustBadgesPosition?: "top" | "bottom";
  trustBadgesStyle?: "icons" | "logos" | "text";

  // === Countdown Timer ===
  showCountdown?: boolean;
  countdownDate?: string;
  countdownLabels?: {
    days?: string;
    hours?: string;
    minutes?: string;
    seconds?: string;
  };
  countdownStyle?: "simple" | "cards" | "minimal";
  countdownColor?: string;

  // === Responsive ===
  hideOnMobile?: boolean;
  mobileLayout?: "stacked" | "default";
  mobileButtonFullWidth?: boolean;

  id?: string;
  className?: string;
  _breakpoint?: "mobile" | "tablet" | "desktop";
  _isEditor?: boolean;
}

export function CTARender({
  // Content
  title = "Ready to get started?",
  titleSize = "xl",
  titleColor,
  titleWeight = "bold",
  titleAlign = "center",
  titleAnimation = "none",
  subtitle,
  subtitleSize = "sm",
  subtitleColor,
  subtitleWeight = "semibold",
  description = "Join thousands of satisfied customers using our platform today.",
  descriptionSize = "md",
  descriptionColor,
  descriptionMaxWidth = "lg",
  // Badge
  badge,
  badgeColor = "",
  badgeTextColor = "#ffffff",
  badgeStyle = "pill",
  badgeIcon,
  badgePosition = "top",
  // Primary Button
  buttonText = "Get Started Free",
  buttonLink = "#",
  buttonColor,
  buttonTextColor,
  // Accept primaryButtonColor/primaryButtonTextColor as aliases (AI generates both naming conventions)
  primaryButtonColor,
  primaryButtonTextColor,
  buttonSize = "lg",
  buttonRadius = "lg",
  buttonStyle = "solid",
  buttonGradientFrom = "",
  buttonGradientTo = "",
  buttonIcon = "arrow",
  buttonIconPosition = "right",
  buttonShadow = "lg",
  buttonHoverEffect = "lift",
  buttonAnimation = "none",
  // Secondary Button
  secondaryButtonText,
  secondaryButtonLink = "#",
  secondaryButtonColor,
  secondaryButtonTextColor,
  secondaryButtonStyle = "outline",
  secondaryButtonSize = "lg",
  secondaryButtonRadius = "lg",
  secondaryButtonIcon = "none",
  // Layout
  variant = "centered",
  contentAlign = "center",
  contentWidth = "lg",
  buttonLayout = "horizontal",
  buttonGap = "md",
  // Background
  backgroundColor = "",
  backgroundGradient = false,
  backgroundGradientFrom = "",
  backgroundGradientTo = "",
  backgroundGradientDirection = "to-br",
  backgroundImage,
  backgroundImagePosition = "center",
  backgroundImageSize = "cover",
  backgroundImageFixed = false,
  backgroundOverlay = true,
  backgroundOverlayColor = "#000000",
  backgroundOverlayOpacity = 50,
  backgroundPattern = "none",
  backgroundPatternColor = "#ffffff",
  backgroundPatternOpacity = 10,
  // Image (Split)
  image,
  imageAlt = "CTA image",
  imagePosition = "right",
  imageFit = "cover",
  imageRounded = "lg",
  imageShadow = "xl",
  imageAnimation = "fadeIn",
  imageBorder = false,
  imageBorderColor = "#e5e7eb",
  // Sizing
  minHeight = "auto",
  paddingY = "lg",
  paddingX = "md",
  borderRadius = "none",
  margin = "none",
  maxWidth = "full",
  // Effects
  textColor = "#ffffff",
  shadow = "none",
  border = false,
  borderColor = "#e5e7eb",
  borderWidth = "1",
  glassEffect = false,
  glassBlur = "md",
  // Animation
  animateOnScroll = false,
  animationType = "fadeIn",
  animationDuration = "normal",
  animationDelay = "none",
  // Decorators
  showDecorator = false,
  decoratorType = "circles",
  decoratorColor = "#ffffff",
  decoratorOpacity = 20,
  decoratorPosition = "background",
  // Trust Badges
  trustBadges = [],
  trustBadgesPosition = "bottom",
  trustBadgesStyle = "logos",
  // Countdown
  showCountdown = false,
  countdownDate,
  countdownLabels = {
    days: "Days",
    hours: "Hours",
    minutes: "Minutes",
    seconds: "Seconds",
  },
  countdownStyle = "cards",
  countdownColor,
  // Responsive
  hideOnMobile = false,
  mobileLayout = "stacked",
  mobileButtonFullWidth = true,
  id,
  className = "",
  _breakpoint = "desktop",
  _isEditor = false,
}: CTAProps) {
  // ==========================================================================
  // CRITICAL: Resolve button colors with contrast-aware defaults
  // The AI generates both buttonColor and primaryButtonColor naming conventions.
  // We accept both and compute contrast-safe defaults when neither is set.
  // ==========================================================================

  // Normalize image values early — needed for background-aware color resolution
  const bgImageUrl = getImageUrl(backgroundImage);
  const ctaImageUrl = getImageUrl(image);
  const hasBackgroundImage = !!bgImageUrl;

  // Overlay-aware darkness detection
  const effectivelyDark = isEffectivelyDark(
    backgroundColor,
    bgImageUrl,
    backgroundOverlay,
    backgroundOverlayColor,
    backgroundOverlayOpacity,
  );
  const bgIsLight = !effectivelyDark;

  // Resolve final button color: prefer explicit > primary alias > contrast-aware default
  const resolvedButtonColor =
    buttonColor || primaryButtonColor || (bgIsLight ? "#0f172a" : "#ffffff");
  const resolvedButtonTextColor =
    buttonTextColor ||
    primaryButtonTextColor ||
    (bgIsLight ? "#ffffff" : "#0f172a");

  // Contrast-aware text color using shared utility
  const resolvedTextColor = resolveContrastColor(textColor, effectivelyDark);

  // Size classes
  const titleSizeClasses = {
    sm: "text-xl md:text-2xl",
    md: "text-2xl md:text-3xl",
    lg: "text-3xl md:text-4xl",
    xl: "text-3xl md:text-4xl lg:text-5xl",
    "2xl": "text-4xl md:text-5xl lg:text-6xl",
    "3xl": "text-5xl md:text-6xl lg:text-7xl",
  }[titleSize];

  const titleWeightClasses = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
    extrabold: "font-extrabold",
  }[titleWeight];

  const descriptionSizeClasses = {
    sm: "text-sm md:text-base",
    md: "text-base md:text-lg",
    lg: "text-lg md:text-xl",
  }[descriptionSize];

  const descriptionMaxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-xl",
    xl: "max-w-2xl",
    full: "max-w-none",
  }[descriptionMaxWidth];

  // Subtitle size/weight class maps (avoids dynamic interpolation for Tailwind scanner)
  const subtitleSizeClass =
    (
      {
        xs: "text-xs",
        sm: "text-sm",
        md: "text-base",
        base: "text-base",
        lg: "text-lg",
      } as Record<string, string>
    )[subtitleSize] || "text-sm";
  const subtitleWeightClass =
    (
      {
        normal: "font-normal",
        medium: "font-medium",
        semibold: "font-semibold",
      } as Record<string, string>
    )[subtitleWeight] || "font-normal";

  const paddingYClasses = {
    none: "py-0",
    sm: "py-8 md:py-12",
    md: "py-12 md:py-16",
    lg: "py-16 md:py-24",
    xl: "py-20 md:py-32",
    "2xl": "py-24 md:py-40",
  }[paddingY];

  const paddingXClasses = { sm: "px-4", md: "px-6", lg: "px-8", xl: "px-12" }[
    paddingX
  ];

  const borderRadiusClasses = {
    none: "",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
  }[borderRadius];

  const marginClasses = {
    none: "",
    sm: "mx-4",
    md: "mx-8",
    lg: "mx-12",
    xl: "mx-16",
  }[margin];

  const maxWidthClasses = {
    sm: "max-w-3xl",
    md: "max-w-4xl",
    lg: "max-w-5xl",
    xl: "max-w-6xl",
    "2xl": "max-w-7xl",
    full: "max-w-none",
  }[maxWidth];

  const minHeightClasses = {
    auto: "",
    sm: "min-h-[300px]",
    md: "min-h-[400px]",
    lg: "min-h-[500px]",
    xl: "min-h-[600px]",
    screen: "min-h-screen",
  }[minHeight];

  const shadowClasses = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
    "2xl": "shadow-2xl",
    inner: "shadow-inner",
  }[shadow];

  const contentAlignClasses = {
    left: "text-left items-start",
    center: "text-center items-center",
    right: "text-right items-end",
  }[contentAlign];

  const buttonLayoutClasses = {
    horizontal: "flex-row",
    vertical: "flex-col",
    stacked: "flex-col sm:flex-row",
  }[buttonLayout];

  const buttonGapClasses = { sm: "gap-2", md: "gap-3", lg: "gap-4" }[buttonGap];

  // Image styling (for split variant)
  const imageRoundedClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
  }[imageRounded];

  const imageShadowClasses = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
    "2xl": "shadow-2xl",
  }[imageShadow];

  const contentWidthClasses = {
    sm: "max-w-lg",
    md: "max-w-2xl",
    lg: "max-w-3xl",
    xl: "max-w-4xl",
    full: "max-w-none",
  }[contentWidth];

  // Build background style
  const bgStyle: React.CSSProperties = {};

  if (backgroundGradient) {
    const gradientDirMap: Record<string, string> = {
      "to-r": "to right",
      "to-l": "to left",
      "to-b": "to bottom",
      "to-t": "to top",
      "to-br": "to bottom right",
      "to-bl": "to bottom left",
      "to-tr": "to top right",
      "to-tl": "to top left",
    };
    bgStyle.background = `linear-gradient(${gradientDirMap[backgroundGradientDirection]}, ${backgroundGradientFrom}, ${backgroundGradientTo})`;
  } else if (bgImageUrl) {
    bgStyle.backgroundImage = `url(${bgImageUrl})`;
    bgStyle.backgroundSize = backgroundImageSize;
    bgStyle.backgroundPosition = backgroundImagePosition;
    if (backgroundImageFixed) bgStyle.backgroundAttachment = "fixed";
  } else {
    bgStyle.backgroundColor = backgroundColor;
  }

  // Glass effect
  const glassClasses = glassEffect
    ? `backdrop-blur-${glassBlur} bg-opacity-80`
    : "";

  // Badge component
  const BadgeElement = () => {
    if (!badge) return null;
    const badgeStyleClasses = {
      solid: "px-3 py-1 rounded-md",
      outline: "px-3 py-1 rounded-md border-2",
      pill: "px-4 py-1.5 rounded-full",
      glow: "px-4 py-1.5 rounded-full shadow-lg",
    }[badgeStyle];

    return (
      <span
        className={`inline-flex items-center gap-2 text-sm font-semibold ${badgeStyleClasses} mb-4`}
        style={{
          backgroundColor:
            badgeStyle === "outline" ? "transparent" : badgeColor,
          color: badgeStyle === "outline" ? badgeColor : badgeTextColor,
          borderColor: badgeStyle === "outline" ? badgeColor : undefined,
          boxShadow:
            badgeStyle === "glow" ? `0 0 20px ${badgeColor}50` : undefined,
        }}
      >
        {badgeIcon && <span>{badgeIcon}</span>}
        {badge}
      </span>
    );
  };

  // Trust badges component
  const TrustBadgesElement = () => {
    if (!trustBadges || trustBadges.length === 0) return null;
    return (
      <div
        className={`flex flex-wrap justify-center items-center gap-6 ${trustBadgesPosition === "top" ? "mb-8" : "mt-8"}`}
      >
        {trustBadges.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity"
          >
            {item.image && (
              <img
                src={getImageUrl(item.image) || ""}
                alt={item.text || ""}
                className="h-8 w-auto"
              />
            )}
            {item.icon && <span className="text-xl">{item.icon}</span>}
            {item.text && (
              <span
                className="text-sm font-medium"
                style={{ color: resolvedTextColor }}
              >
                {item.text}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Pattern overlay
  const PatternOverlay = () => {
    if (backgroundPattern === "none") return null;
    const patternStyles: Record<string, React.CSSProperties> = {
      dots: {
        backgroundImage: `radial-gradient(${backgroundPatternColor} 1px, transparent 1px)`,
        backgroundSize: "20px 20px",
      },
      grid: {
        backgroundImage: `linear-gradient(${backgroundPatternColor} 1px, transparent 1px), linear-gradient(90deg, ${backgroundPatternColor} 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
      },
      diagonal: {
        backgroundImage: `repeating-linear-gradient(45deg, ${backgroundPatternColor} 0, ${backgroundPatternColor} 1px, transparent 0, transparent 50%)`,
        backgroundSize: "20px 20px",
      },
      waves: {
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='${encodeURIComponent(backgroundPatternColor)}' d='M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E")`,
        backgroundSize: "cover",
      },
      circuit: {
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath fill='none' stroke='${encodeURIComponent(backgroundPatternColor)}' stroke-width='0.5' d='M10,10 L90,10 M10,50 L90,50 M10,90 L90,90 M50,10 L50,90 M10,10 L10,90 M90,10 L90,90'/%3E%3C/svg%3E")`,
      },
    };
    return (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          ...patternStyles[backgroundPattern],
          opacity: backgroundPatternOpacity / 100,
        }}
        aria-hidden="true"
      />
    );
  };

  // Decorator element
  const DecoratorElement = () => {
    if (!showDecorator) return null;
    return (
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ opacity: decoratorOpacity / 100 }}
      >
        {decoratorType === "circles" && (
          <>
            <div
              className="absolute -top-20 -left-20 w-80 h-80 rounded-full"
              style={{ backgroundColor: decoratorColor }}
            />
            <div
              className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full"
              style={{ backgroundColor: decoratorColor }}
            />
          </>
        )}
        {decoratorType === "dots" && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(${decoratorColor} 2px, transparent 2px)`,
              backgroundSize: "32px 32px",
            }}
          />
        )}
      </div>
    );
  };

  // Primary button styling — composed via ButtonRender
  const primaryButtonVariant: ButtonProps["variant"] = (() => {
    if (buttonStyle === "gradient") return "gradient";
    if (buttonStyle === "outline") return "outline";
    return "primary";
  })();

  const primaryButtonRenderProps: Partial<ButtonProps> = {
    label: buttonText,
    href: buttonLink,
    variant: primaryButtonVariant,
    size: buttonSize as ButtonProps["size"],
    backgroundColor: resolvedButtonColor,
    textColor: resolvedButtonTextColor,
    borderRadius: buttonRadius as ButtonProps["borderRadius"],
    shadow: (buttonShadow === "glow"
      ? "lg"
      : buttonShadow) as ButtonProps["shadow"],
    hoverEffect: buttonHoverEffect as ButtonProps["hoverEffect"],
    iconName: buttonIcon !== "none" ? buttonIcon : undefined,
    iconPosition: buttonIconPosition as ButtonProps["iconPosition"],
    fullWidth: false,
    className: mobileButtonFullWidth ? "w-full md:w-auto" : "",
    ...(buttonStyle === "gradient"
      ? {
          gradientFrom: buttonGradientFrom,
          gradientTo: buttonGradientTo,
          gradientDirection: "to-br" as const,
        }
      : {}),
    ...(buttonStyle === "3d" ? { shadow: "lg" as const } : {}),
    ...(buttonShadow === "glow"
      ? { glowOnHover: true, glowColor: resolvedButtonColor }
      : {}),
  };

  // Secondary button styling — composed via ButtonRender
  const secondaryButtonVariant: ButtonProps["variant"] = (() => {
    if (secondaryButtonStyle === "solid") return "secondary";
    if (secondaryButtonStyle === "ghost") return "ghost";
    if (secondaryButtonStyle === "text" || secondaryButtonStyle === "link")
      return "link";
    return "outline";
  })();

  const secondaryButtonRenderProps: Partial<ButtonProps> = {
    label: secondaryButtonText || "",
    href: secondaryButtonLink,
    variant: secondaryButtonVariant,
    size: (secondaryButtonSize || buttonSize) as ButtonProps["size"],
    backgroundColor: (() => {
      const c = secondaryButtonColor || resolvedTextColor;
      if (c === "transparent") return resolvedTextColor;
      return resolveContrastColor(c, effectivelyDark, resolvedTextColor);
    })(),
    textColor: (() => {
      const c =
        secondaryButtonTextColor || secondaryButtonColor || resolvedTextColor;
      if (c === "transparent") return resolvedTextColor;
      return resolveContrastColor(c, effectivelyDark, resolvedTextColor);
    })(),
    borderRadius: secondaryButtonRadius as ButtonProps["borderRadius"],
    iconName: secondaryButtonIcon !== "none" ? secondaryButtonIcon : undefined,
    iconPosition: "right",
    fullWidth: false,
    className: mobileButtonFullWidth ? "w-full md:w-auto" : "",
  };

  // Reusable: render primary CTA button
  const renderPrimaryButton = () =>
    buttonText ? (
      <ButtonRender {...(primaryButtonRenderProps as ButtonProps)} />
    ) : null;

  // Reusable: render secondary CTA button
  const renderSecondaryButton = () =>
    secondaryButtonText ? (
      <ButtonRender {...(secondaryButtonRenderProps as ButtonProps)} />
    ) : null;

  // Hide on mobile check
  if (hideOnMobile && _breakpoint === "mobile" && _isEditor) {
    return (
      <div className="p-8 text-center text-gray-500 bg-gray-100 rounded-lg">
        Hidden on mobile
      </div>
    );
  }

  // Split variant with image
  if ((variant === "split" || variant === "splitReverse") && ctaImageUrl) {
    const isReverse = variant === "splitReverse" || imagePosition === "left";
    return (
      <section
        id={id}
        className={`w-full ${paddingYClasses} ${paddingXClasses} ${marginClasses} ${className}`}
      >
        <div
          className={`${maxWidthClasses} mx-auto grid md:grid-cols-2 gap-8 md:gap-12 items-center ${borderRadiusClasses} ${shadowClasses} overflow-hidden`}
          style={bgStyle}
        >
          {/* Content */}
          <div
            className={`p-8 md:p-12 ${isReverse ? "md:order-2" : ""} ${contentAlignClasses}`}
          >
            {backgroundOverlay && bgImageUrl && (
              <div
                className="absolute inset-0"
                style={{
                  backgroundColor: backgroundOverlayColor,
                  opacity: backgroundOverlayOpacity / 100,
                }}
              />
            )}
            <div className="relative z-10 flex flex-col">
              {badgePosition === "top" && <BadgeElement />}
              {subtitle && (
                <p
                  className={`${subtitleSizeClass} ${subtitleWeightClass} uppercase tracking-wider mb-2`}
                  style={{ color: subtitleColor || resolvedTextColor }}
                >
                  {subtitle}
                </p>
              )}
              <h2
                className={`${titleSizeClasses} ${titleWeightClasses} mb-4`}
                style={{ color: titleColor || resolvedTextColor }}
              >
                {title}
              </h2>
              {description && (
                <p
                  className={`${descriptionSizeClasses} ${descriptionMaxWidthClasses} mb-6 opacity-90`}
                  style={{ color: descriptionColor || resolvedTextColor }}
                >
                  {description}
                </p>
              )}
              {badgePosition === "inline" && <BadgeElement />}
              <div
                className={`flex ${buttonLayoutClasses} ${buttonGapClasses} ${mobileButtonFullWidth ? "w-full" : ""}`}
              >
                {renderPrimaryButton()}
                {renderSecondaryButton()}
              </div>
            </div>
          </div>
          {/* Image */}
          <div className={`${isReverse ? "md:order-1" : ""} hidden md:block`}>
            <img
              src={ctaImageUrl}
              alt={imageAlt}
              className={`w-full h-full object-${imageFit} ${imageRoundedClasses} ${imageShadowClasses} ${imageBorder ? "border-2" : ""}`}
              style={
                imageBorder ? { borderColor: imageBorderColor } : undefined
              }
              loading="lazy"
            />
          </div>
        </div>
      </section>
    );
  }

  // Glass variant
  if (variant === "glass") {
    return (
      <section
        id={id}
        className={`relative w-full ${paddingYClasses} ${paddingXClasses} ${marginClasses} ${className}`}
        style={bgStyle}
      >
        {backgroundOverlay && bgImageUrl && (
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: backgroundOverlayColor,
              opacity: backgroundOverlayOpacity / 100,
            }}
            aria-hidden="true"
          />
        )}
        <PatternOverlay />
        <DecoratorElement />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div
            className={`backdrop-blur-lg bg-white/10 border border-white/20 ${borderRadiusClasses || "rounded-2xl"} p-8 md:p-12 ${contentAlignClasses} flex flex-col`}
          >
            {trustBadgesPosition === "top" && <TrustBadgesElement />}
            {badgePosition === "top" && <BadgeElement />}
            {subtitle && (
              <p
                className={`${subtitleSizeClass} ${subtitleWeightClass} uppercase tracking-wider mb-2`}
                style={{ color: subtitleColor || resolvedTextColor }}
              >
                {subtitle}
              </p>
            )}
            <h2
              className={`${titleSizeClasses} ${titleWeightClasses} mb-4`}
              style={{ color: titleColor || resolvedTextColor }}
            >
              {title}
            </h2>
            {description && (
              <p
                className={`${descriptionSizeClasses} ${descriptionMaxWidthClasses} mb-8 opacity-90 mx-auto`}
                style={{ color: descriptionColor || resolvedTextColor }}
              >
                {description}
              </p>
            )}
            <div
              className={`flex ${buttonLayoutClasses} ${buttonGapClasses} justify-center`}
            >
              {renderPrimaryButton()}
              {renderSecondaryButton()}
            </div>
            {trustBadgesPosition === "bottom" && <TrustBadgesElement />}
          </div>
        </div>
      </section>
    );
  }

  // Banner variant (full-width compact)
  if (variant === "banner") {
    return (
      <section
        id={id}
        className={`w-full py-4 md:py-6 ${paddingXClasses} ${borderRadiusClasses} ${shadowClasses} ${className}`}
        style={bgStyle}
      >
        <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {badge && <BadgeElement />}
            <p className="font-medium" style={{ color: resolvedTextColor }}>
              {title}
            </p>
          </div>
          <div className="flex gap-3">{renderPrimaryButton()}</div>
        </div>
      </section>
    );
  }

  // Floating variant (card style)
  if (variant === "floating") {
    return (
      <section
        id={id}
        className={`w-full ${paddingYClasses} ${paddingXClasses} ${className}`}
      >
        <div className={`${maxWidthClasses} mx-auto`}>
          <div
            className={`${borderRadiusClasses || "rounded-2xl"} ${shadowClasses || "shadow-2xl"} p-8 md:p-12 lg:p-16 ${contentAlignClasses} flex flex-col`}
            style={bgStyle}
          >
            {backgroundOverlay && bgImageUrl && (
              <div
                className={`absolute inset-0 ${borderRadiusClasses}`}
                style={{
                  backgroundColor: backgroundOverlayColor,
                  opacity: backgroundOverlayOpacity / 100,
                }}
              />
            )}
            <PatternOverlay />
            <DecoratorElement />
            <div className="relative z-10">
              {trustBadgesPosition === "top" && <TrustBadgesElement />}
              {badgePosition === "top" && <BadgeElement />}
              {subtitle && (
                <p
                  className={`${subtitleSizeClass} ${subtitleWeightClass} uppercase tracking-wider mb-2`}
                  style={{ color: subtitleColor || resolvedTextColor }}
                >
                  {subtitle}
                </p>
              )}
              <h2
                className={`${titleSizeClasses} ${titleWeightClasses} mb-4`}
                style={{ color: titleColor || resolvedTextColor }}
              >
                {title}
              </h2>
              {description && (
                <p
                  className={`${descriptionSizeClasses} ${descriptionMaxWidthClasses} mb-8 opacity-90 mx-auto`}
                  style={{ color: descriptionColor || resolvedTextColor }}
                >
                  {description}
                </p>
              )}
              <div
                className={`flex ${buttonLayoutClasses} ${buttonGapClasses} justify-center`}
              >
                {renderPrimaryButton()}
                {renderSecondaryButton()}
              </div>
              {trustBadgesPosition === "bottom" && <TrustBadgesElement />}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Left/Right aligned variants
  if (variant === "left" || variant === "right") {
    return (
      <section
        id={id}
        className={`relative w-full ${minHeightClasses} ${paddingYClasses} ${paddingXClasses} ${borderRadiusClasses} ${marginClasses} ${shadowClasses} ${border ? `border-${borderWidth}` : ""} ${className}`}
        style={{ ...bgStyle, borderColor: border ? borderColor : undefined }}
      >
        {backgroundOverlay && bgImageUrl && (
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: backgroundOverlayColor,
              opacity: backgroundOverlayOpacity / 100,
            }}
            aria-hidden="true"
          />
        )}
        <PatternOverlay />
        <DecoratorElement />
        <div
          className={`relative z-10 ${maxWidthClasses} mx-auto flex flex-col ${variant === "left" ? "items-start text-left" : "items-end text-right"}`}
        >
          {trustBadgesPosition === "top" && <TrustBadgesElement />}
          {badgePosition === "top" && <BadgeElement />}
          {subtitle && (
            <p
              className={`${subtitleSizeClass} ${subtitleWeightClass} uppercase tracking-wider mb-2`}
              style={{ color: subtitleColor || resolvedTextColor }}
            >
              {subtitle}
            </p>
          )}
          <h2
            className={`${titleSizeClasses} ${titleWeightClasses} mb-4 ${contentWidthClasses}`}
            style={{ color: titleColor || resolvedTextColor }}
          >
            {title}
          </h2>
          {description && (
            <p
              className={`${descriptionSizeClasses} ${descriptionMaxWidthClasses} mb-8 opacity-90`}
              style={{ color: descriptionColor || resolvedTextColor }}
            >
              {description}
            </p>
          )}
          <div className={`flex ${buttonLayoutClasses} ${buttonGapClasses}`}>
            {renderPrimaryButton()}
            {renderSecondaryButton()}
          </div>
          {trustBadgesPosition === "bottom" && <TrustBadgesElement />}
        </div>
      </section>
    );
  }

  // Centered (default) and minimal variants
  return (
    <section
      id={id}
      className={`relative w-full ${minHeightClasses} ${paddingYClasses} ${paddingXClasses} ${borderRadiusClasses} ${marginClasses} ${shadowClasses} ${glassClasses} ${border ? `border-${borderWidth}` : ""} flex items-center ${className}`}
      style={{ ...bgStyle, borderColor: border ? borderColor : undefined }}
    >
      {backgroundOverlay && bgImageUrl && (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: backgroundOverlayColor,
            opacity: backgroundOverlayOpacity / 100,
          }}
          aria-hidden="true"
        />
      )}
      <PatternOverlay />
      <DecoratorElement />
      <div
        className={`relative z-10 w-full ${contentWidthClasses} mx-auto ${contentAlignClasses} flex flex-col`}
      >
        {trustBadgesPosition === "top" && <TrustBadgesElement />}
        {badgePosition === "top" && <BadgeElement />}
        {subtitle && (
          <p
            className={`${subtitleSizeClass} ${subtitleWeightClass} uppercase tracking-wider mb-2`}
            style={{ color: subtitleColor || resolvedTextColor }}
          >
            {subtitle}
          </p>
        )}
        <h2
          className={`${titleSizeClasses} ${titleWeightClasses} mb-4 md:mb-6`}
          style={{ color: titleColor || resolvedTextColor }}
        >
          {title}
        </h2>
        {description && (
          <p
            className={`${descriptionSizeClasses} ${descriptionMaxWidthClasses} mb-6 md:mb-8 opacity-90 mx-auto`}
            style={{ color: descriptionColor || resolvedTextColor }}
          >
            {description}
          </p>
        )}
        <div
          className={`flex ${buttonLayoutClasses} ${buttonGapClasses} justify-center ${mobileButtonFullWidth ? "w-full md:w-auto" : ""}`}
        >
          {renderPrimaryButton()}
          {renderSecondaryButton()}
        </div>
        {trustBadgesPosition === "bottom" && <TrustBadgesElement />}
      </div>
    </section>
  );
}
// ============================================================================
// TESTIMONIALS - Customer Testimonials (PREMIUM - 60+ Properties)
// ============================================================================

export interface TestimonialsProps {
  // === Header ===
  title?: string;
  titleSize?: "sm" | "md" | "lg" | "xl" | "2xl";
  titleColor?: string;
  titleWeight?: "normal" | "medium" | "semibold" | "bold" | "extrabold";
  titleAlign?: "left" | "center" | "right";
  subtitle?: string;
  subtitleColor?: string;
  description?: string;
  descriptionColor?: string;

  // === Testimonial Items ===
  testimonials?: Array<{
    quote?: string;
    author?: string;
    role?: string;
    company?: string;
    image?: string | ImageValue;
    rating?: number;
    companyLogo?: string | ImageValue;
    featured?: boolean;
    videoUrl?: string;
  }>;

  // === Layout ===
  columns?: 1 | 2 | 3 | 4;
  variant?:
    | "cards"
    | "minimal"
    | "quote"
    | "carousel"
    | "masonry"
    | "slider"
    | "grid"
    | "featured"
    | "bubble"
    | "timeline";
  layout?: "grid" | "list" | "masonry" | "carousel";
  contentAlign?: "left" | "center" | "right";
  gap?: "sm" | "md" | "lg" | "xl";

  // === Card Styling ===
  cardBackgroundColor?: string;
  cardBorderRadius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  cardShadow?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  cardBorder?: boolean;
  cardBorderColor?: string;
  cardPadding?: "sm" | "md" | "lg" | "xl";
  cardHoverEffect?: "none" | "lift" | "scale" | "glow" | "border";
  cardHoverScale?: number;

  // === Avatar ===
  showAvatar?: boolean;
  avatarSize?: "sm" | "md" | "lg" | "xl";
  avatarShape?: "circle" | "square" | "rounded";
  avatarBorder?: boolean;
  avatarBorderColor?: string;
  avatarPosition?: "top" | "bottom" | "inline" | "left";

  // === Rating ===
  showRating?: boolean;
  ratingStyle?: "stars" | "hearts" | "numeric" | "thumbs";
  ratingColor?: string;
  ratingPosition?: "top" | "bottom" | "inline";
  maxRating?: number;

  // === Quote ===
  quoteStyle?: "normal" | "italic" | "large";
  quoteFontSize?: "sm" | "md" | "lg" | "xl";
  quoteColor?: string;
  showQuoteIcon?: boolean;
  quoteIconColor?: string;
  quoteIconSize?: "sm" | "md" | "lg";
  quoteIconPosition?: "top-left" | "top-right" | "background";

  // === Company/Logo ===
  showCompanyLogo?: boolean;
  logoSize?: "sm" | "md" | "lg";
  logoPosition?: "top" | "bottom" | "inline";
  showCompanyName?: boolean;

  // === Background ===
  backgroundColor?: string;
  backgroundGradient?: boolean;
  backgroundGradientFrom?: string;
  backgroundGradientTo?: string;
  backgroundGradientDirection?:
    | "to-r"
    | "to-l"
    | "to-b"
    | "to-t"
    | "to-br"
    | "to-bl";
  backgroundImage?: string | ImageValue;
  backgroundOverlay?: boolean;
  backgroundOverlayColor?: string;
  backgroundOverlayOpacity?: number;
  backgroundPattern?: "none" | "dots" | "grid" | "diagonal";

  // === Sizing ===
  paddingY?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  paddingX?: "sm" | "md" | "lg" | "xl";
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";

  // === Carousel Settings ===
  autoplay?: boolean;
  autoplaySpeed?: number;
  showArrows?: boolean;
  showDots?: boolean;
  arrowStyle?: "circle" | "square" | "minimal";
  arrowColor?: string;
  dotsColor?: string;
  dotsPosition?: "bottom" | "side";
  infiniteLoop?: boolean;
  slidesToShow?: 1 | 2 | 3 | 4;

  // === Animation ===
  animateOnScroll?: boolean;
  animationType?: "fadeIn" | "slideUp" | "slideIn" | "zoom" | "stagger";
  animationDuration?: "fast" | "normal" | "slow";
  staggerDelay?: number;

  // === Featured Style ===
  featuredCardScale?: number;
  featuredCardShadow?: "lg" | "xl" | "2xl";
  featuredBorderColor?: string;

  // === Decorative ===
  showDecorator?: boolean;
  decoratorType?: "quotes" | "lines" | "dots" | "gradient-blur";
  decoratorColor?: string;
  decoratorOpacity?: number;

  textColor?: string;
  accentColor?: string;
  id?: string;
  className?: string;
  _breakpoint?: "mobile" | "tablet" | "desktop";
  _isEditor?: boolean;
}

export function TestimonialsRender({
  // Header
  title = "What Our Customers Say",
  titleSize = "lg",
  titleColor,
  titleWeight = "bold",
  titleAlign = "center",
  subtitle,
  subtitleColor,
  description,
  descriptionColor,
  // Items
  testimonials = [],
  // Layout
  columns = 3,
  variant = "cards",
  layout = "grid",
  contentAlign = "left",
  gap = "lg",
  // Card
  cardBackgroundColor = "#ffffff",
  cardBorderRadius = "xl",
  cardShadow = "sm",
  cardBorder = false,
  cardBorderColor = "#e5e7eb",
  cardPadding = "lg",
  cardHoverEffect = "lift",
  cardHoverScale = 1.02,
  // Avatar
  showAvatar = true,
  avatarSize = "md",
  avatarShape = "circle",
  avatarBorder = false,
  avatarBorderColor = "#ffffff",
  avatarPosition = "bottom",
  // Rating
  showRating = true,
  ratingStyle = "stars",
  ratingColor = "#fbbf24",
  ratingPosition = "top",
  maxRating = 5,
  // Quote
  quoteStyle = "normal",
  quoteFontSize = "md",
  quoteColor,
  showQuoteIcon = true,
  quoteIconColor,
  quoteIconSize = "md",
  quoteIconPosition = "top-left",
  // Company
  showCompanyLogo = false,
  logoSize = "md",
  logoPosition = "bottom",
  showCompanyName = true,
  // Background
  backgroundColor = "#f9fafb",
  backgroundGradient = false,
  backgroundGradientFrom = "#f9fafb",
  backgroundGradientTo = "#ffffff",
  backgroundGradientDirection = "to-b",
  backgroundImage,
  backgroundOverlay = false,
  backgroundOverlayColor = "#000000",
  backgroundOverlayOpacity = 50,
  backgroundPattern = "none",
  // Sizing
  paddingY = "lg",
  paddingX = "md",
  maxWidth = "xl",
  // Carousel
  autoplay = false,
  autoplaySpeed = 5000,
  showArrows = true,
  showDots = true,
  arrowStyle = "circle",
  arrowColor = "#374151",
  dotsColor = "",
  dotsPosition = "bottom",
  infiniteLoop = true,
  slidesToShow = 3,
  // Animation
  animateOnScroll = false,
  animationType = "fadeIn",
  animationDuration = "normal",
  staggerDelay = 100,
  // Featured
  featuredCardScale = 1.05,
  featuredCardShadow = "xl",
  featuredBorderColor = "",
  // Decorative
  showDecorator = false,
  decoratorType = "quotes",
  decoratorColor = "",
  decoratorOpacity = 10,
  textColor,
  accentColor = "",
  id,
  className = "",
  _breakpoint = "desktop",
  _isEditor = false,
}: TestimonialsProps) {
  // Sizing classes
  const paddingYClasses = {
    none: "py-0",
    sm: "py-8 md:py-12",
    md: "py-12 md:py-16",
    lg: "py-16 md:py-24",
    xl: "py-20 md:py-32",
    "2xl": "py-24 md:py-40",
  }[paddingY];

  const paddingXClasses = { sm: "px-4", md: "px-6", lg: "px-8", xl: "px-12" }[
    paddingX
  ];

  const maxWidthClasses = {
    sm: "max-w-3xl",
    md: "max-w-4xl",
    lg: "max-w-5xl",
    xl: "max-w-6xl",
    "2xl": "max-w-7xl",
    full: "max-w-none",
  }[maxWidth];

  const gapClasses = { sm: "gap-4", md: "gap-6", lg: "gap-8", xl: "gap-10" }[
    gap
  ];

  const colClasses = {
    1: "grid-cols-1 max-w-2xl mx-auto",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  }[columns];

  const titleSizeClasses = {
    sm: "text-xl md:text-2xl",
    md: "text-2xl md:text-3xl",
    lg: "text-3xl md:text-4xl",
    xl: "text-3xl md:text-4xl lg:text-5xl",
    "2xl": "text-4xl md:text-5xl lg:text-6xl",
  }[titleSize];

  const titleWeightClasses = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
    extrabold: "font-extrabold",
  }[titleWeight];

  const cardBorderRadiusClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
  }[cardBorderRadius];

  const cardShadowClasses = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
    "2xl": "shadow-2xl",
  }[cardShadow];

  const cardPaddingClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-6 md:p-8",
    xl: "p-8 md:p-10",
  }[cardPadding];

  const cardHoverClasses = {
    none: "",
    lift: "hover:-translate-y-1 transition-transform duration-300",
    scale: "hover:scale-[1.02] transition-transform duration-300",
    glow: "hover:shadow-xl transition-shadow duration-300",
    border: "transition-colors duration-300",
  }[cardHoverEffect];

  const avatarSizeClasses = {
    sm: "w-10 h-10",
    md: "w-12 h-12",
    lg: "w-14 h-14",
    xl: "w-16 h-16",
  }[avatarSize];

  const avatarShapeClasses = {
    circle: "rounded-full",
    square: "rounded-none",
    rounded: "rounded-lg",
  }[avatarShape];

  const quoteFontSizeClasses = {
    sm: "text-sm",
    md: "text-base md:text-lg",
    lg: "text-lg md:text-xl",
    xl: "text-xl md:text-2xl",
  }[quoteFontSize];

  const quoteStyleClasses = {
    normal: "",
    italic: "italic",
    large: "font-medium",
  }[quoteStyle];

  const quoteIconSizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  }[quoteIconSize];

  // Background style
  const bgStyle: React.CSSProperties = {};
  if (backgroundGradient) {
    const gradientDirMap: Record<string, string> = {
      "to-r": "to right",
      "to-l": "to left",
      "to-b": "to bottom",
      "to-t": "to top",
      "to-br": "to bottom right",
      "to-bl": "to bottom left",
    };
    bgStyle.background = `linear-gradient(${gradientDirMap[backgroundGradientDirection]}, ${backgroundGradientFrom}, ${backgroundGradientTo})`;
  } else {
    bgStyle.backgroundColor = backgroundColor;
  }

  const bgImageUrl = getImageUrl(backgroundImage);
  if (bgImageUrl) {
    bgStyle.backgroundImage = `url(${bgImageUrl})`;
    bgStyle.backgroundSize = "cover";
    bgStyle.backgroundPosition = "center";
  }

  const effectivelyDark = isEffectivelyDark(backgroundColor, bgImageUrl, backgroundOverlay, backgroundOverlayColor, backgroundOverlayOpacity);
  const resolvedTextColor = resolveContrastColor(textColor, effectivelyDark);

  // Quote icon component
  const QuoteIcon = () => (
    <svg
      className={`${quoteIconSizeClasses} opacity-30`}
      fill="currentColor"
      viewBox="0 0 24 24"
      style={{ color: quoteIconColor || accentColor }}
    >
      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
    </svg>
  );

  // Rating component
  const RatingStars = ({ rating }: { rating: number }) => {
    if (ratingStyle === "numeric") {
      return (
        <span className="font-bold text-lg" style={{ color: ratingColor }}>
          {rating}/{maxRating}
        </span>
      );
    }

    return (
      <div className="flex gap-0.5">
        {Array.from({ length: maxRating }).map((_, j) => {
          if (ratingStyle === "hearts") {
            return (
              <svg
                key={j}
                className={`w-5 h-5 ${j < (rating || 0) ? "" : "opacity-30"}`}
                fill="currentColor"
                viewBox="0 0 24 24"
                style={{ color: j < (rating || 0) ? ratingColor : "#d1d5db" }}
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            );
          }
          if (ratingStyle === "thumbs") {
            return (
              <svg
                key={j}
                className={`w-5 h-5 ${j < (rating || 0) ? "" : "opacity-30"}`}
                fill="currentColor"
                viewBox="0 0 24 24"
                style={{ color: j < (rating || 0) ? ratingColor : "#d1d5db" }}
              >
                <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
              </svg>
            );
          }
          return (
            <svg
              key={j}
              className={`w-5 h-5`}
              fill="currentColor"
              viewBox="0 0 20 20"
              style={{ color: j < (rating || 0) ? ratingColor : "#d1d5db" }}
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          );
        })}
      </div>
    );
  };

  // Testimonial card
  const TestimonialCard = ({
    testimonial,
    index,
  }: {
    testimonial: NonNullable<TestimonialsProps["testimonials"]>[0];
    index: number;
  }) => {
    const isFeatured = testimonial.featured && variant === "featured";
    const authorImgUrl = getImageUrl(testimonial.image);
    const logoUrl = getImageUrl(testimonial.companyLogo);

    return (
      <div
        className={`relative flex flex-col ${cardBorderRadiusClasses} ${cardShadowClasses} ${cardPaddingClasses} ${cardHoverClasses} ${cardBorder ? "border" : ""} ${isFeatured ? "ring-2" : ""} ${contentAlign === "center" ? "items-center text-center" : contentAlign === "right" ? "items-end text-right" : "items-start text-left"}`}
        style={{
          backgroundColor: cardBackgroundColor,
          borderColor: cardBorder ? cardBorderColor : undefined,
          transform: isFeatured ? `scale(${featuredCardScale})` : undefined,
          boxShadow: isFeatured
            ? `0 25px 50px -12px rgba(0,0,0,0.25)`
            : undefined,
          // Ring color is applied via CSS variable for Tailwind ring utility
          // @ts-expect-error - Custom CSS property for ring-color
          "--tw-ring-color": isFeatured ? featuredBorderColor : undefined,
        }}
      >
        {/* Quote Icon */}
        {showQuoteIcon && quoteIconPosition === "top-left" && (
          <div className="mb-4">
            <QuoteIcon />
          </div>
        )}
        {showQuoteIcon && quoteIconPosition === "background" && (
          <div className="absolute top-4 right-4 opacity-10">
            <svg
              className="w-16 h-16"
              fill="currentColor"
              viewBox="0 0 24 24"
              style={{ color: quoteIconColor || accentColor }}
            >
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
          </div>
        )}

        {/* Company Logo - Top */}
        {showCompanyLogo && logoUrl && logoPosition === "top" && (
          <img
            src={logoUrl}
            alt={testimonial.company || "Company"}
            className={`mb-4 object-contain grayscale hover:grayscale-0 transition-all ${logoSize === "sm" ? "h-6" : logoSize === "md" ? "h-8" : "h-10"}`}
          />
        )}

        {/* Rating - Top */}
        {showRating && testimonial.rating && ratingPosition === "top" && (
          <div className="mb-4">
            <RatingStars rating={testimonial.rating} />
          </div>
        )}

        {/* Avatar - Top */}
        {showAvatar && authorImgUrl && avatarPosition === "top" && (
          <img
            src={authorImgUrl}
            alt={testimonial.author}
            className={`${avatarSizeClasses} ${avatarShapeClasses} object-cover mb-4 ${avatarBorder ? "ring-2 ring-offset-2" : ""}`}
            style={
              avatarBorder
                ? ({
                    "--tw-ring-color": avatarBorderColor,
                  } as React.CSSProperties)
                : undefined
            }
            loading="lazy"
          />
        )}

        {/* Quote */}
        <blockquote
          className={`${quoteFontSizeClasses} ${quoteStyleClasses} leading-relaxed flex-1 mb-6`}
          style={{ color: resolveContrastColor(quoteColor, effectivelyDark) || resolvedTextColor }}
        >
          &ldquo;{testimonial.quote}&rdquo;
        </blockquote>

        {/* Rating - Bottom */}
        {showRating && testimonial.rating && ratingPosition === "bottom" && (
          <div className="mb-4">
            <RatingStars rating={testimonial.rating} />
          </div>
        )}

        {/* Author section */}
        <div
          className={`flex items-center gap-4 ${avatarPosition === "left" ? "flex-row" : avatarPosition === "inline" ? "flex-row" : ""} ${contentAlign === "center" ? "justify-center" : ""}`}
        >
          {/* Avatar - Inline/Left */}
          {showAvatar &&
            authorImgUrl &&
            (avatarPosition === "bottom" ||
              avatarPosition === "inline" ||
              avatarPosition === "left") && (
              <img
                src={authorImgUrl}
                alt={testimonial.author}
                className={`${avatarSizeClasses} ${avatarShapeClasses} object-cover ${avatarBorder ? "ring-2 ring-offset-2" : ""}`}
                style={
                  avatarBorder
                    ? ({
                        "--tw-ring-color": avatarBorderColor,
                      } as React.CSSProperties)
                    : undefined
                }
                loading="lazy"
              />
            )}
          <div>
            <p className="font-semibold" style={{ color: resolvedTextColor }}>
              {testimonial.author}
            </p>
            {(testimonial.role || (showCompanyName && testimonial.company)) && (
              <p className="text-sm opacity-75" style={{ color: resolvedTextColor }}>
                {testimonial.role}
                {testimonial.role &&
                  showCompanyName &&
                  testimonial.company &&
                  ", "}
                {showCompanyName && testimonial.company}
              </p>
            )}
            {/* Rating - Inline */}
            {showRating &&
              testimonial.rating &&
              ratingPosition === "inline" && (
                <div className="mt-1">
                  <RatingStars rating={testimonial.rating} />
                </div>
              )}
          </div>
        </div>

        {/* Company Logo - Bottom */}
        {showCompanyLogo && logoUrl && logoPosition === "bottom" && (
          <img
            src={logoUrl}
            alt={testimonial.company || "Company"}
            className={`mt-4 object-contain grayscale hover:grayscale-0 transition-all ${logoSize === "sm" ? "h-6" : logoSize === "md" ? "h-8" : "h-10"}`}
          />
        )}
      </div>
    );
  };

  return (
    <section
      id={id}
      className={`relative w-full ${paddingYClasses} ${paddingXClasses} ${className}`}
      style={bgStyle}
    >
      {/* Background overlay */}
      {backgroundOverlay && bgImageUrl && (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: backgroundOverlayColor,
            opacity: backgroundOverlayOpacity / 100,
          }}
          aria-hidden="true"
        />
      )}

      {/* Pattern */}
      {backgroundPattern !== "none" && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              backgroundPattern === "dots"
                ? `radial-gradient(${decoratorColor || "#000"} 1px, transparent 1px)`
                : backgroundPattern === "grid"
                  ? `linear-gradient(${decoratorColor || "#000"} 1px, transparent 1px), linear-gradient(90deg, ${decoratorColor || "#000"} 1px, transparent 1px)`
                  : undefined,
            backgroundSize: "20px 20px",
            opacity: decoratorOpacity / 100,
          }}
          aria-hidden="true"
        />
      )}

      {/* Decorative quote marks */}
      {showDecorator && decoratorType === "quotes" && (
        <div
          className="absolute top-10 left-10 pointer-events-none"
          style={{ opacity: decoratorOpacity / 100 }}
        >
          <svg
            className="w-24 h-24"
            fill="currentColor"
            viewBox="0 0 24 24"
            style={{ color: decoratorColor }}
          >
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
        </div>
      )}

      <div className={`relative z-10 ${maxWidthClasses} mx-auto`}>
        {/* Header */}
        {(title || subtitle || description) && (
          <div
            className={`${titleAlign === "center" ? "text-center" : titleAlign === "right" ? "text-right" : "text-left"} mb-12 md:mb-16`}
          >
            {subtitle && (
              <p
                className="text-sm md:text-base font-semibold uppercase tracking-wider mb-2"
                style={{ color: resolveContrastColor(subtitleColor, effectivelyDark) || accentColor }}
              >
                {subtitle}
              </p>
            )}
            {title && (
              <h2
                className={`${titleSizeClasses} ${titleWeightClasses} mb-4`}
                style={{ color: resolveContrastColor(titleColor, effectivelyDark) || resolvedTextColor }}
              >
                {title}
              </h2>
            )}
            {description && (
              <p
                className="text-base md:text-lg opacity-80 max-w-2xl mx-auto"
                style={{ color: resolveContrastColor(descriptionColor, effectivelyDark) || resolvedTextColor }}
              >
                {description}
              </p>
            )}
          </div>
        )}

        {/* Grid Layout */}
        <div className={`grid ${colClasses} ${gapClasses}`}>
          {testimonials.map((testimonial, i) => (
            <TestimonialCard key={i} testimonial={testimonial} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// FAQ - Frequently Asked Questions
// ============================================================================

export interface FAQProps {
  // Header Content
  title?: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  badgeIcon?: string;

  // Header Styling
  headerAlign?: "left" | "center" | "right";
  titleSize?: "sm" | "md" | "lg" | "xl" | "2xl";
  titleColor?: string;
  titleFont?: string;
  subtitleColor?: string;
  descriptionColor?: string;
  badgeStyle?: "pill" | "outlined" | "solid" | "gradient";
  badgeColor?: string;
  badgeTextColor?: string;

  // FAQ Items
  items?: Array<{
    question?: string;
    answer?: string;
    category?: string;
    icon?: string;
    isPopular?: boolean;
    helpfulVotes?: number;
  }>;

  // Layout & Variant
  variant?:
    | "accordion"
    | "cards"
    | "two-column"
    | "minimal"
    | "tabs"
    | "timeline"
    | "bubble"
    | "modern"
    | "grid"
    | "floating";
  columns?: 1 | 2;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  contentWidth?: "narrow" | "medium" | "wide" | "full";

  // Accordion Behavior
  defaultOpen?: number | "all" | "none";
  allowMultiple?: boolean;
  collapseOthers?: boolean;
  animationSpeed?: "slow" | "normal" | "fast";

  // Accordion Styling
  accordionStyle?:
    | "default"
    | "bordered"
    | "separated"
    | "connected"
    | "minimal";
  accordionGap?: "none" | "sm" | "md" | "lg";
  questionPadding?: "sm" | "md" | "lg";
  answerPadding?: "sm" | "md" | "lg";

  // Icon Settings
  showIcon?: boolean;
  iconPosition?: "left" | "right";
  iconStyle?: "chevron" | "plus" | "arrow" | "caret" | "custom";
  iconSize?: "sm" | "md" | "lg";
  iconColor?: string;
  iconRotation?: boolean;
  expandedIcon?: string;
  collapsedIcon?: string;

  // Question Styling
  questionFontSize?: "sm" | "md" | "lg" | "xl";
  questionFontWeight?: "normal" | "medium" | "semibold" | "bold";
  questionColor?: string;
  questionHoverColor?: string;

  // Answer Styling
  answerFontSize?: "sm" | "md" | "lg";
  answerColor?: string;
  answerLineHeight?: "tight" | "normal" | "relaxed" | "loose";
  answerMaxLines?: number;

  // Card/Item Background
  backgroundColor?: string;
  cardBackgroundColor?: string;
  cardHoverBackgroundColor?: string;
  expandedBackgroundColor?: string;

  // Border Settings
  cardBorder?: boolean;
  cardBorderColor?: string;
  cardBorderWidth?: "1" | "2" | "3";
  cardBorderRadius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  dividerStyle?: "solid" | "dashed" | "dotted" | "none";
  dividerColor?: string;

  // Shadow & Effects
  cardShadow?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  cardHoverShadow?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  hoverEffect?: "none" | "lift" | "glow" | "border" | "background";

  // Section Sizing
  paddingY?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  paddingX?: "none" | "sm" | "md" | "lg" | "xl";
  sectionGap?: "sm" | "md" | "lg" | "xl";

  // Accent & Theme
  accentColor?: string;
  textColor?: string;

  // Categories & Search
  showCategories?: boolean;
  categoryPosition?: "top" | "sidebar" | "tabs";
  categoryStyle?: "pills" | "buttons" | "underline" | "minimal";
  categoryColor?: string;
  activeCategoryColor?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  searchPosition?: "top" | "sidebar";

  // Popular/Featured
  showPopularBadge?: boolean;
  popularBadgeText?: string;
  popularBadgeColor?: string;
  highlightPopular?: boolean;

  // Numbering
  showNumbers?: boolean;
  numberStyle?: "circle" | "square" | "plain" | "outlined";
  numberColor?: string;
  numberBackgroundColor?: string;

  // Helpful Section
  showHelpful?: boolean;
  helpfulText?: string;
  helpfulYesText?: string;
  helpfulNoText?: string;

  // Contact CTA
  showContactCta?: boolean;
  contactTitle?: string;
  contactDescription?: string;
  contactButtonText?: string;
  contactButtonLink?: string;
  contactButtonStyle?: "primary" | "secondary" | "outline";

  // Decorative Elements
  showDecorators?: boolean;
  decoratorStyle?: "dots" | "lines" | "circles" | "gradient" | "blur";
  decoratorColor?: string;
  decoratorPosition?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "both-sides";

  // Background
  backgroundStyle?: "solid" | "gradient" | "pattern" | "image";
  backgroundGradientFrom?: string;
  backgroundGradientTo?: string;
  backgroundGradientDirection?:
    | "to-r"
    | "to-l"
    | "to-t"
    | "to-b"
    | "to-br"
    | "to-bl"
    | "to-tr"
    | "to-tl";
  backgroundPattern?: "dots" | "grid" | "lines" | "waves";
  backgroundPatternOpacity?: number;
  backgroundImage?: string | ImageValue;
  backgroundOverlay?: boolean;
  backgroundOverlayColor?: string;
  backgroundOverlayOpacity?: number;

  // Animation
  animateOnScroll?: boolean;
  animationType?:
    | "fade"
    | "slide-up"
    | "slide-left"
    | "slide-right"
    | "scale"
    | "stagger";
  animationDelay?: number;
  staggerDelay?: number;

  // Schema.org / SEO
  enableSchema?: boolean;
  schemaType?: "FAQPage" | "HowTo" | "QAPage";

  // Responsive
  mobileColumns?: 1;
  mobileVariant?: "accordion" | "cards";
  hideDescriptionOnMobile?: boolean;

  // Accessibility
  ariaLabel?: string;

  id?: string;
  className?: string;
}

export function FAQRender({
  // Header Content
  title = "Frequently Asked Questions",
  subtitle,
  description,
  badge,
  badgeIcon,

  // Header Styling
  headerAlign = "center",
  titleSize = "lg",
  titleColor,
  titleFont,
  subtitleColor,
  descriptionColor,
  badgeStyle = "pill",
  badgeColor = "",
  badgeTextColor = "#ffffff",

  // FAQ Items
  items = [],

  // Layout & Variant
  variant = "accordion",
  columns = 1,
  maxWidth = "lg",
  contentWidth = "medium",

  // Accordion Behavior
  defaultOpen = 0,
  allowMultiple = false,
  collapseOthers: _collapseOthers = true,
  animationSpeed = "normal",

  // Accordion Styling
  accordionStyle = "default",
  accordionGap = "md",
  questionPadding = "md",
  answerPadding = "md",

  // Icon Settings
  showIcon = true,
  iconPosition = "right",
  iconStyle = "chevron",
  iconSize = "md",
  iconColor,
  iconRotation = true,
  expandedIcon,
  collapsedIcon,

  // Question Styling
  questionFontSize = "md",
  questionFontWeight = "medium",
  questionColor,
  questionHoverColor,

  // Answer Styling
  answerFontSize = "md",
  answerColor,
  answerLineHeight = "relaxed",
  answerMaxLines,

  // Card/Item Background
  backgroundColor = "#ffffff",
  cardBackgroundColor = "#f9fafb",
  cardHoverBackgroundColor,
  expandedBackgroundColor,

  // Border Settings
  cardBorder = false,
  cardBorderColor = "#e5e7eb",
  cardBorderWidth = "1",
  cardBorderRadius = "lg",
  dividerStyle = "solid",
  dividerColor = "#e5e7eb",

  // Shadow & Effects
  cardShadow = "none",
  cardHoverShadow = "md",
  hoverEffect = "lift",

  // Section Sizing
  paddingY = "lg",
  paddingX = "md",
  sectionGap = "lg",

  // Accent & Theme
  accentColor = "",
  textColor,

  // Categories & Search
  showCategories = false,
  categoryPosition = "top",
  categoryStyle = "pills",
  categoryColor = "#6b7280",
  activeCategoryColor = "",
  showSearch = false,
  searchPlaceholder = "Search questions...",
  searchPosition: _searchPosition = "top",

  // Popular/Featured
  showPopularBadge = false,
  popularBadgeText = "Popular",
  popularBadgeColor = "#f59e0b",
  highlightPopular = false,

  // Numbering
  showNumbers = false,
  numberStyle = "circle",
  numberColor = "#ffffff",
  numberBackgroundColor = "",

  // Helpful Section
  showHelpful = false,
  helpfulText = "Was this helpful?",
  helpfulYesText = "Yes",
  helpfulNoText = "No",

  // Contact CTA
  showContactCta = false,
  contactTitle = "Still have questions?",
  contactDescription = "Can't find the answer you're looking for? Please chat to our friendly team.",
  contactButtonText = "Get in touch",
  contactButtonLink = "/contact",
  contactButtonStyle = "primary",

  // Decorative Elements
  showDecorators = false,
  decoratorStyle = "dots",
  decoratorColor = "",
  decoratorPosition = "top-right",

  // Background
  backgroundStyle = "solid",
  backgroundGradientFrom = "#ffffff",
  backgroundGradientTo = "#f3f4f6",
  backgroundGradientDirection = "to-b",
  backgroundPattern,
  backgroundPatternOpacity = 0.1,
  backgroundImage,
  backgroundOverlay = false,
  backgroundOverlayColor = "#000000",
  backgroundOverlayOpacity = 0.5,

  // Animation
  animateOnScroll = false,
  animationType = "fade",
  animationDelay = 0,
  staggerDelay = 100,

  // Schema.org / SEO
  enableSchema = false,
  schemaType: _schemaType = "FAQPage",

  // Responsive
  mobileColumns: _mobileColumns = 1,
  mobileVariant: _mobileVariant = "accordion",
  hideDescriptionOnMobile = false,

  // Accessibility
  ariaLabel,

  id,
  className = "",
}: FAQProps) {
  // Padding classes
  const paddingYClasses = {
    none: "",
    sm: "py-8 md:py-12",
    md: "py-12 md:py-16",
    lg: "py-16 md:py-24",
    xl: "py-20 md:py-32",
    "2xl": "py-24 md:py-40",
  }[paddingY];

  const paddingXClasses = {
    none: "",
    sm: "px-4",
    md: "px-4 md:px-6",
    lg: "px-4 md:px-8",
    xl: "px-4 md:px-12",
  }[paddingX];

  // Max width classes
  const maxWidthClasses = {
    sm: "max-w-2xl",
    md: "max-w-3xl",
    lg: "max-w-4xl",
    xl: "max-w-5xl",
    "2xl": "max-w-6xl",
    full: "max-w-full",
  }[maxWidth];

  // Title size classes
  const titleSizeClasses = {
    sm: "text-xl md:text-2xl",
    md: "text-2xl md:text-3xl",
    lg: "text-3xl md:text-4xl lg:text-5xl",
    xl: "text-4xl md:text-5xl lg:text-6xl",
    "2xl": "text-5xl md:text-6xl lg:text-7xl",
  }[titleSize];

  // Accordion gap classes
  const gapClasses = {
    none: "space-y-0",
    sm: "space-y-2",
    md: "space-y-3 md:space-y-4",
    lg: "space-y-4 md:space-y-6",
  }[accordionGap];

  // Question padding classes
  const questionPaddingClasses = {
    sm: "p-3 md:p-4",
    md: "p-4 md:p-6",
    lg: "p-5 md:p-8",
  }[questionPadding];

  // Answer padding classes
  const answerPaddingClasses = {
    sm: "px-3 pb-3 md:px-4 md:pb-4",
    md: "px-4 pb-4 md:px-6 md:pb-6",
    lg: "px-5 pb-5 md:px-8 md:pb-8",
  }[answerPadding];

  // Icon size classes
  const iconSizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  }[iconSize];

  // Question font size classes
  const questionFontSizeClasses = {
    sm: "text-sm md:text-base",
    md: "text-base md:text-lg",
    lg: "text-lg md:text-xl",
    xl: "text-xl md:text-2xl",
  }[questionFontSize];

  // Question font weight classes
  const questionFontWeightClasses = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
  }[questionFontWeight];

  // Answer font size classes
  const answerFontSizeClasses = {
    sm: "text-xs md:text-sm",
    md: "text-sm md:text-base",
    lg: "text-base md:text-lg",
  }[answerFontSize];

  // Answer line height classes
  const lineHeightClasses = {
    tight: "leading-tight",
    normal: "leading-normal",
    relaxed: "leading-relaxed",
    loose: "leading-loose",
  }[answerLineHeight];

  // Card border radius classes
  const borderRadiusClasses = {
    none: "rounded-none",
    sm: "rounded",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    full: "rounded-3xl",
  }[cardBorderRadius];

  // Card shadow classes
  const shadowClasses = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
    "2xl": "shadow-2xl",
  }[cardShadow];

  // Hover effect classes
  const hoverEffectClasses = {
    none: "",
    lift: "hover:-translate-y-1 hover:shadow-lg",
    glow: "hover:ring-2 hover:ring-offset-2",
    border: "hover:border-2",
    background: "hover:bg-opacity-90",
  }[hoverEffect];

  // Animation speed classes
  const animationSpeedClasses = {
    slow: "duration-500",
    normal: "duration-300",
    fast: "duration-150",
  }[animationSpeed];

  // Section gap classes
  const sectionGapClasses = {
    sm: "mb-8 md:mb-10",
    md: "mb-10 md:mb-12",
    lg: "mb-12 md:mb-16",
    xl: "mb-16 md:mb-20",
  }[sectionGap];

  // Animation classes
  const getAnimationClasses = (index: number) => {
    if (!animateOnScroll) return "";
    const delay = animationDelay + index * staggerDelay;
    const baseClasses = `animate-in ${animationSpeedClasses}`;
    const typeClasses = {
      fade: "fade-in",
      "slide-up": "slide-in-from-bottom-4",
      "slide-left": "slide-in-from-left-4",
      "slide-right": "slide-in-from-right-4",
      scale: "zoom-in-95",
      stagger: "fade-in slide-in-from-bottom-2",
    }[animationType];
    return `${baseClasses} ${typeClasses}`;
  };

  // Get background style
  const getBackgroundStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = {};

    if (backgroundStyle === "solid") {
      style.backgroundColor = backgroundColor;
    } else if (backgroundStyle === "gradient") {
      const direction = {
        "to-r": "to right",
        "to-l": "to left",
        "to-t": "to top",
        "to-b": "to bottom",
        "to-br": "to bottom right",
        "to-bl": "to bottom left",
        "to-tr": "to top right",
        "to-tl": "to top left",
      }[backgroundGradientDirection];
      style.background = `linear-gradient(${direction}, ${backgroundGradientFrom}, ${backgroundGradientTo})`;
    } else if (backgroundStyle === "image" && backgroundImage) {
      style.backgroundImage = `url(${getImageUrl(backgroundImage)})`;
      style.backgroundSize = "cover";
      style.backgroundPosition = "center";
    }

    return style;
  };

  // Render icon based on style
  const renderIcon = (isOpen: boolean) => {
    if (!showIcon) return null;

    const iconClass = `${iconSizeClasses} flex-shrink-0 transition-transform ${iconRotation && isOpen ? "rotate-180" : ""} ${animationSpeedClasses}`;
    const color = iconColor || resolvedTextColor || "#6b7280";

    if (expandedIcon && collapsedIcon) {
      return (
        <span style={{ color }}>{isOpen ? expandedIcon : collapsedIcon}</span>
      );
    }

    switch (iconStyle) {
      case "plus":
        return (
          <svg
            className={iconClass}
            fill="none"
            stroke={color}
            viewBox="0 0 24 24"
          >
            {isOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 12H4"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            )}
          </svg>
        );
      case "arrow":
        return (
          <svg
            className={iconClass}
            fill="none"
            stroke={color}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
            />
          </svg>
        );
      case "caret":
        return (
          <svg className={iconClass} fill={color} viewBox="0 0 24 24">
            <path d={isOpen ? "M7 14l5-5 5 5H7z" : "M7 10l5 5 5-5H7z"} />
          </svg>
        );
      default: // chevron
        return (
          <svg
            className={iconClass}
            fill="none"
            stroke={color}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        );
    }
  };

  // Badge styles
  const badgeClasses = {
    pill: "px-4 py-1.5 rounded-full text-sm font-medium",
    outlined:
      "px-4 py-1.5 rounded-full text-sm font-medium border-2 bg-transparent",
    solid: "px-4 py-2 rounded-md text-sm font-medium",
    gradient: "px-4 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r",
  }[badgeStyle];

  // Number style classes
  const getNumberClasses = () => {
    const base =
      "flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0";
    switch (numberStyle) {
      case "circle":
        return `${base} w-8 h-8 rounded-full`;
      case "square":
        return `${base} w-8 h-8 rounded-md`;
      case "outlined":
        return `${base} w-8 h-8 rounded-full border-2 bg-transparent`;
      default:
        return `${base}`;
    }
  };

  // Category filter component
  const categories = [
    ...new Set(items.map((item) => item.category).filter(Boolean)),
  ];

  // Render decorators
  const renderDecorators = () => {
    if (!showDecorators) return null;

    const decoratorClass = "absolute pointer-events-none";
    const positionClasses = {
      "top-left": "top-0 left-0",
      "top-right": "top-0 right-0",
      "bottom-left": "bottom-0 left-0",
      "bottom-right": "bottom-0 right-0",
      "both-sides": "",
    }[decoratorPosition];

    const decoratorElement = () => {
      switch (decoratorStyle) {
        case "dots":
          return (
            <div className="grid grid-cols-5 gap-2 w-32 h-32 opacity-20">
              {Array.from({ length: 25 }).map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: decoratorColor }}
                />
              ))}
            </div>
          );
        case "circles":
          return (
            <div className="relative w-40 h-40 opacity-20">
              <div
                className="absolute w-full h-full rounded-full border-4"
                style={{ borderColor: decoratorColor }}
              />
              <div
                className="absolute w-3/4 h-3/4 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-4"
                style={{ borderColor: decoratorColor }}
              />
            </div>
          );
        case "blur":
          return (
            <div
              className="w-64 h-64 rounded-full blur-3xl opacity-30"
              style={{ backgroundColor: decoratorColor }}
            />
          );
        default:
          return null;
      }
    };

    if (decoratorPosition === "both-sides") {
      return (
        <>
          <div className={`${decoratorClass} top-0 left-0`}>
            {decoratorElement()}
          </div>
          <div className={`${decoratorClass} bottom-0 right-0`}>
            {decoratorElement()}
          </div>
        </>
      );
    }

    return (
      <div className={`${decoratorClass} ${positionClasses}`}>
        {decoratorElement()}
      </div>
    );
  };

  // Contact CTA button classes
  const contactButtonClasses = {
    primary:
      "px-6 py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90",
    secondary:
      "px-6 py-3 rounded-lg font-semibold transition-all hover:opacity-90",
    outline:
      "px-6 py-3 rounded-lg font-semibold border-2 bg-transparent transition-all hover:bg-opacity-10",
  }[contactButtonStyle];

  // Render helpful buttons
  const renderHelpful = () => {
    if (!showHelpful) return null;
    return (
      <div
        className="flex items-center gap-3 mt-4 pt-4 border-t"
        style={{ borderColor: dividerColor }}
      >
        <span className="text-sm opacity-70" style={{ color: resolvedTextColor }}>
          {helpfulText}
        </span>
        <button
          className="px-3 py-1 text-sm rounded border hover:opacity-80 transition-colors"
          style={{ borderColor: dividerColor, color: resolvedTextColor }}
        >
          {helpfulYesText}
        </button>
        <button
          className="px-3 py-1 text-sm rounded border hover:opacity-80 transition-colors"
          style={{ borderColor: dividerColor, color: resolvedTextColor }}
        >
          {helpfulNoText}
        </button>
      </div>
    );
  };

  // Generate Schema.org JSON-LD
  const schemaData = enableSchema
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      }
    : null;

  const faqBgImageUrl = backgroundStyle === "image" ? getImageUrl(backgroundImage) : undefined;
  const effectivelyDark = isEffectivelyDark(backgroundColor, faqBgImageUrl, backgroundOverlay, backgroundOverlayColor, backgroundOverlayOpacity);
  const resolvedTextColor = resolveContrastColor(textColor, effectivelyDark);

  return (
    <section
      id={id}
      className={`w-full ${paddingYClasses} ${paddingXClasses} relative overflow-hidden ${className}`}
      style={getBackgroundStyle()}
      aria-label={ariaLabel || "Frequently Asked Questions"}
    >
      {/* Background overlay for images */}
      {backgroundStyle === "image" && backgroundOverlay && (
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundColor: backgroundOverlayColor,
            opacity: backgroundOverlayOpacity,
          }}
        />
      )}

      {/* Background pattern */}
      {backgroundPattern && (
        <div
          className="absolute inset-0 z-0"
          style={{ opacity: backgroundPatternOpacity }}
        >
          {backgroundPattern === "dots" && (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle, ${accentColor} 1px, transparent 1px)`,
                backgroundSize: "20px 20px",
              }}
            />
          )}
          {backgroundPattern === "grid" && (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `linear-gradient(${accentColor}20 1px, transparent 1px), linear-gradient(90deg, ${accentColor}20 1px, transparent 1px)`,
                backgroundSize: "40px 40px",
              }}
            />
          )}
        </div>
      )}

      {/* Decorators */}
      {renderDecorators()}

      {/* Schema.org JSON-LD */}
      {schemaData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      )}

      <div className={`${maxWidthClasses} mx-auto relative z-10`}>
        {/* Header */}
        <div
          className={`${sectionGapClasses} ${headerAlign === "center" ? "text-center" : headerAlign === "right" ? "text-right" : "text-left"}`}
        >
          {/* Badge */}
          {badge && (
            <div
              className={`inline-flex items-center gap-2 mb-4 ${badgeClasses}`}
              style={{
                backgroundColor:
                  badgeStyle !== "outlined" ? badgeColor : "transparent",
                color: badgeStyle === "outlined" ? badgeColor : badgeTextColor,
                borderColor: badgeStyle === "outlined" ? badgeColor : undefined,
              }}
            >
              {badgeIcon && <span>{badgeIcon}</span>}
              {badge}
            </div>
          )}

          {/* Subtitle */}
          {subtitle && (
            <p
              className="text-sm md:text-base font-semibold uppercase tracking-wider mb-2"
              style={{ color: subtitleColor || accentColor }}
            >
              {subtitle}
            </p>
          )}

          {/* Title */}
          <h2
            className={`${titleSizeClasses} font-bold mb-4`}
            style={{
              color: titleColor || textColor,
              fontFamily: titleFont || undefined,
            }}
          >
            {title}
          </h2>

          {/* Description */}
          {description && (
            <p
              className={`text-base md:text-lg max-w-2xl ${headerAlign === "center" ? "mx-auto" : ""} opacity-80 ${hideDescriptionOnMobile ? "hidden md:block" : ""}`}
              style={{ color: descriptionColor || resolvedTextColor }}
            >
              {description}
            </p>
          )}
        </div>

        {/* Search */}
        {showSearch && (
          <div className="mb-8">
            <div className="relative max-w-md mx-auto">
              <input
                type="text"
                placeholder={searchPlaceholder}
                className="w-full px-4 py-3 pl-12 rounded-lg border focus:ring-2 focus:outline-none transition-all"
                style={{
                  borderColor: cardBorderColor,
                  backgroundColor: cardBackgroundColor,
                }}
              />
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Categories */}
        {showCategories &&
          categories.length > 0 &&
          categoryPosition === "top" && (
            <div
              className={`flex flex-wrap gap-2 mb-8 ${headerAlign === "center" ? "justify-center" : ""}`}
            >
              <button
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all`}
                style={{
                  backgroundColor: activeCategoryColor,
                  color: "#ffffff",
                }}
              >
                All
              </button>
              {categories.map((category, i) => (
                <button
                  key={i}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-all hover:opacity-80`}
                  style={{
                    backgroundColor: cardBackgroundColor,
                    color: categoryColor,
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
          )}

        {/* FAQ Items - Accordion Variant */}
        <div
          className={`${gapClasses} ${columns === 2 ? "grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6" : ""}`}
        >
          {items.map((item, i) => (
            <details
              key={i}
              open={
                defaultOpen === "all" ||
                (typeof defaultOpen === "number" && i === defaultOpen)
              }
              className={`group ${borderRadiusClasses} overflow-hidden transition-all ${animationSpeedClasses} ${shadowClasses} ${hoverEffectClasses} ${cardBorder ? `border` : ""} ${accordionStyle === "separated" ? "" : accordionStyle === "connected" && i > 0 ? "border-t-0 rounded-t-none" : ""} ${getAnimationClasses(i)}`}
              style={{
                backgroundColor: cardBackgroundColor,
                borderColor: cardBorder ? cardBorderColor : undefined,
                borderWidth: cardBorder ? `${cardBorderWidth}px` : undefined,
              }}
            >
              <summary
                className={`${questionPaddingClasses} cursor-pointer list-none flex items-center ${iconPosition === "left" ? "flex-row-reverse" : ""} justify-between gap-4 ${questionFontSizeClasses} ${questionFontWeightClasses} transition-all`}
                style={{ color: resolveContrastColor(questionColor, effectivelyDark) || resolvedTextColor }}
              >
                <div className="flex items-center gap-3 flex-1">
                  {/* Number */}
                  {showNumbers && (
                    <span
                      className={getNumberClasses()}
                      style={{
                        backgroundColor:
                          numberStyle !== "outlined"
                            ? numberBackgroundColor
                            : "transparent",
                        color:
                          numberStyle === "outlined"
                            ? numberBackgroundColor
                            : numberColor,
                        borderColor:
                          numberStyle === "outlined"
                            ? numberBackgroundColor
                            : undefined,
                      }}
                    >
                      {i + 1}
                    </span>
                  )}

                  {/* Item icon */}
                  {item.icon && <span className="text-xl">{item.icon}</span>}

                  <span className="flex-1">{item.question}</span>

                  {/* Popular badge */}
                  {showPopularBadge && item.isPopular && (
                    <span
                      className="px-2 py-0.5 text-xs font-medium rounded-full"
                      style={{
                        backgroundColor: popularBadgeColor,
                        color: "#ffffff",
                      }}
                    >
                      {popularBadgeText}
                    </span>
                  )}
                </div>

                {/* Icon */}
                {renderIcon(false)}
              </summary>

              <div
                className={`${answerPaddingClasses} ${answerFontSizeClasses} ${lineHeightClasses} opacity-80`}
                style={{
                  color: resolveContrastColor(answerColor, effectivelyDark) || resolvedTextColor,
                  WebkitLineClamp: answerMaxLines,
                  display: answerMaxLines ? "-webkit-box" : undefined,
                  WebkitBoxOrient: answerMaxLines ? "vertical" : undefined,
                  overflow: answerMaxLines ? "hidden" : undefined,
                }}
              >
                {item.answer}

                {/* Helpful */}
                {renderHelpful()}
              </div>
            </details>
          ))}
        </div>

        {/* Contact CTA */}
        {showContactCta && (
          <div
            className="mt-12 md:mt-16 text-center p-8 md:p-12 rounded-2xl"
            style={{ backgroundColor: cardBackgroundColor }}
          >
            <h3
              className="text-xl md:text-2xl font-bold mb-2"
              style={{ color: resolvedTextColor }}
            >
              {contactTitle}
            </h3>
            <p
              className="text-base opacity-80 mb-6 max-w-lg mx-auto"
              style={{ color: resolvedTextColor }}
            >
              {contactDescription}
            </p>
            <a
              href={contactButtonLink}
              className={contactButtonClasses}
              style={{
                backgroundColor:
                  contactButtonStyle === "primary"
                    ? accentColor
                    : contactButtonStyle === "secondary"
                      ? cardBackgroundColor
                      : "transparent",
                borderColor:
                  contactButtonStyle === "outline" ? accentColor : undefined,
                color:
                  contactButtonStyle === "outline"
                    ? accentColor
                    : contactButtonStyle === "secondary"
                      ? resolvedTextColor
                      : "#ffffff",
              }}
            >
              {contactButtonText}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================================
// STATS - Statistics/Metrics Display
// ============================================================================

export interface StatItem {
  value?: string;
  label?: string;
  description?: string;
  prefix?: string;
  suffix?: string;
  icon?: string;
  iconColor?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  link?: string;
  isHighlighted?: boolean;
}

export interface StatsProps {
  // Header Content
  title?: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  badgeIcon?: string;

  // Header Styling
  headerAlign?: "left" | "center" | "right";
  titleSize?: "sm" | "md" | "lg" | "xl" | "2xl";
  titleColor?: string;
  titleFont?: string;
  subtitleColor?: string;
  descriptionColor?: string;
  badgeStyle?: "pill" | "outlined" | "solid" | "gradient";
  badgeColor?: string;
  badgeTextColor?: string;

  // Stats Items
  stats?: StatItem[];

  // Layout & Variant
  variant?:
    | "simple"
    | "cards"
    | "bordered"
    | "icons"
    | "minimal"
    | "gradient"
    | "glass"
    | "outline"
    | "split"
    | "circular";
  columns?: 2 | 3 | 4 | 5 | 6;
  maxWidth?: "md" | "lg" | "xl" | "2xl" | "full";
  contentAlign?: "left" | "center" | "right";

  // Value Styling
  valueSize?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  valueColor?: string;
  valueFont?: string;
  valueFontWeight?: "normal" | "medium" | "semibold" | "bold" | "extrabold";

  // Label Styling
  labelSize?: "xs" | "sm" | "md" | "lg";
  labelColor?: string;
  labelPosition?: "above" | "below";
  labelOpacity?: number;
  showDescription?: boolean;
  descriptionSize?: "xs" | "sm" | "md";

  // Icon Settings
  showIcons?: boolean;
  iconPosition?: "top" | "left" | "inline";
  iconSize?: "sm" | "md" | "lg" | "xl";
  iconStyle?: "default" | "circle" | "square" | "rounded" | "gradient";
  iconBackgroundColor?: string;
  defaultIconColor?: string;

  // Counter Animation
  animateNumbers?: boolean;
  animationDuration?: number;
  animationDelay?: number;
  staggerAnimation?: boolean;
  staggerDelay?: number;
  startFromZero?: boolean;
  countingType?: "linear" | "easeOut" | "easeInOut";

  // Card Styling
  backgroundColor?: string;
  cardBackgroundColor?: string;
  cardHoverBackgroundColor?: string;
  highlightedCardBackground?: string;
  cardBorder?: boolean;
  cardBorderColor?: string;
  cardBorderWidth?: "1" | "2" | "3";
  cardBorderRadius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  cardShadow?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  cardHoverShadow?: "none" | "sm" | "md" | "lg" | "xl";
  cardPadding?: "sm" | "md" | "lg" | "xl";
  hoverEffect?: "none" | "lift" | "scale" | "glow" | "border";

  // Accent & Dividers
  accentColor?: string;
  textColor?: string;
  showDividers?: boolean;
  dividerStyle?: "solid" | "dashed" | "dotted" | "gradient";
  dividerColor?: string;

  // Trend Indicators
  showTrends?: boolean;
  trendUpColor?: string;
  trendDownColor?: string;
  trendNeutralColor?: string;
  trendPosition?: "inline" | "below";

  // Section Sizing
  paddingY?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  paddingX?: "none" | "sm" | "md" | "lg" | "xl";
  gap?: "sm" | "md" | "lg" | "xl";
  sectionGap?: "sm" | "md" | "lg" | "xl";

  // Background
  backgroundStyle?: "solid" | "gradient" | "pattern" | "image";
  backgroundGradientFrom?: string;
  backgroundGradientTo?: string;
  backgroundGradientDirection?:
    | "to-r"
    | "to-l"
    | "to-t"
    | "to-b"
    | "to-br"
    | "to-bl"
    | "to-tr"
    | "to-tl";
  backgroundPattern?: "dots" | "grid" | "lines" | "waves";
  backgroundPatternOpacity?: number;
  backgroundImage?: string | ImageValue;
  backgroundOverlay?: boolean;
  backgroundOverlayColor?: string;
  backgroundOverlayOpacity?: number;

  // Decorative Elements
  showDecorators?: boolean;
  decoratorStyle?: "dots" | "circles" | "blur" | "lines";
  decoratorColor?: string;
  decoratorPosition?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "both-sides";

  // Animation
  animateOnScroll?: boolean;
  animationType?:
    | "fade"
    | "slide-up"
    | "slide-left"
    | "slide-right"
    | "scale"
    | "stagger";
  entranceDelay?: number;

  // Responsive
  mobileColumns?: 1 | 2;
  hideDescriptionOnMobile?: boolean;
  compactOnMobile?: boolean;

  // Accessibility
  ariaLabel?: string;

  id?: string;
  className?: string;
}

export function StatsRender({
  // Header Content
  title,
  subtitle,
  description,
  badge,
  badgeIcon,

  // Header Styling
  headerAlign = "center",
  titleSize = "lg",
  titleColor,
  titleFont,
  subtitleColor,
  descriptionColor,
  badgeStyle = "pill",
  badgeColor = "",
  badgeTextColor = "#ffffff",

  // Stats Items
  stats = [],

  // Layout & Variant
  variant = "simple",
  columns = 4,
  maxWidth = "xl",
  contentAlign = "center",

  // Value Styling
  valueSize = "xl",
  valueColor,
  valueFont,
  valueFontWeight = "bold",

  // Label Styling
  labelSize = "md",
  labelColor,
  labelPosition = "below",
  labelOpacity = 0.7,
  showDescription = false,
  descriptionSize = "sm",

  // Icon Settings
  showIcons = false,
  iconPosition = "top",
  iconSize = "lg",
  iconStyle = "default",
  iconBackgroundColor = "",
  defaultIconColor = "",

  // Counter Animation
  animateNumbers = false,
  animationDuration: _animationDuration = 2000,
  animationDelay: _animationDelay = 0,
  staggerAnimation: _staggerAnimation = true,
  staggerDelay: _staggerDelay = 200,
  startFromZero: _startFromZero = true,
  countingType: _countingType = "easeOut",

  // Card Styling
  backgroundColor = "#111827",
  cardBackgroundColor = "rgba(255,255,255,0.05)",
  cardHoverBackgroundColor,
  highlightedCardBackground = "",
  cardBorder = false,
  cardBorderColor = "#ffffff20",
  cardBorderWidth = "1",
  cardBorderRadius = "xl",
  cardShadow = "none",
  cardHoverShadow = "lg",
  cardPadding = "lg",
  hoverEffect = "lift",

  // Accent & Dividers
  accentColor = "",
  textColor = "#ffffff",
  showDividers = false,
  dividerStyle = "solid",
  dividerColor = "#ffffff20",

  // Trend Indicators
  showTrends = false,
  trendUpColor = "#22c55e",
  trendDownColor = "#ef4444",
  trendNeutralColor = "#9ca3af",
  trendPosition = "below",

  // Section Sizing
  paddingY = "lg",
  paddingX = "md",
  gap = "lg",
  sectionGap = "lg",

  // Background
  backgroundStyle = "solid",
  backgroundGradientFrom = "#111827",
  backgroundGradientTo = "#1f2937",
  backgroundGradientDirection = "to-br",
  backgroundPattern,
  backgroundPatternOpacity = 0.1,
  backgroundImage,
  backgroundOverlay = false,
  backgroundOverlayColor = "#000000",
  backgroundOverlayOpacity = 0.6,

  // Decorative Elements
  showDecorators = false,
  decoratorStyle = "blur",
  decoratorColor = "",
  decoratorPosition = "both-sides",

  // Animation
  animateOnScroll = false,
  animationType = "fade",
  entranceDelay = 0,

  // Responsive
  mobileColumns = 2,
  hideDescriptionOnMobile = false,
  compactOnMobile = false,

  // Accessibility
  ariaLabel,

  id,
  className = "",
}: StatsProps) {
  // Padding classes
  const paddingYClasses = {
    none: "",
    sm: "py-8 md:py-12",
    md: "py-12 md:py-16",
    lg: "py-16 md:py-24",
    xl: "py-20 md:py-32",
    "2xl": "py-24 md:py-40",
  }[paddingY];

  const paddingXClasses = {
    none: "",
    sm: "px-4",
    md: "px-4 md:px-6",
    lg: "px-4 md:px-8",
    xl: "px-4 md:px-12",
  }[paddingX];

  // Max width classes
  const maxWidthClasses = {
    md: "max-w-3xl",
    lg: "max-w-5xl",
    xl: "max-w-7xl",
    "2xl": "max-w-screen-2xl",
    full: "max-w-full",
  }[maxWidth];

  // Column classes — use static lookup so Tailwind JIT can detect them
  const mobileColsClass =
    (
      { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3" } as Record<
        number,
        string
      >
    )[mobileColumns] || "grid-cols-2";

  const columnClasses = {
    2: `${mobileColsClass} md:grid-cols-2`,
    3: `${mobileColsClass} md:grid-cols-2 lg:grid-cols-3`,
    4: `${mobileColsClass} md:grid-cols-2 lg:grid-cols-4`,
    5: `${mobileColsClass} md:grid-cols-3 lg:grid-cols-5`,
    6: `${mobileColsClass} md:grid-cols-3 lg:grid-cols-6`,
  }[columns];

  // Title size classes
  const titleSizeClasses = {
    sm: "text-xl md:text-2xl",
    md: "text-2xl md:text-3xl",
    lg: "text-3xl md:text-4xl lg:text-5xl",
    xl: "text-4xl md:text-5xl lg:text-6xl",
    "2xl": "text-5xl md:text-6xl lg:text-7xl",
  }[titleSize];

  // Value size classes
  const valueSizeClasses = {
    sm: "text-2xl md:text-3xl",
    md: "text-3xl md:text-4xl",
    lg: "text-4xl md:text-5xl",
    xl: "text-5xl md:text-6xl",
    "2xl": "text-6xl md:text-7xl",
    "3xl": "text-7xl md:text-8xl",
  }[valueSize];

  // Value font weight classes
  const valueFontWeightClasses = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
    extrabold: "font-extrabold",
  }[valueFontWeight];

  // Label size classes
  const labelSizeClasses = {
    xs: "text-xs md:text-sm",
    sm: "text-sm md:text-base",
    md: "text-base md:text-lg",
    lg: "text-lg md:text-xl",
  }[labelSize];

  // Description size classes
  const descriptionSizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
  }[descriptionSize];

  // Icon size classes
  const iconSizeClasses = {
    sm: "text-xl md:text-2xl",
    md: "text-2xl md:text-3xl",
    lg: "text-3xl md:text-4xl",
    xl: "text-4xl md:text-5xl",
  }[iconSize];

  // Card padding classes
  const cardPaddingClasses = {
    sm: "p-4 md:p-5",
    md: "p-5 md:p-6",
    lg: "p-6 md:p-8",
    xl: "p-8 md:p-10",
  }[cardPadding];

  // Card border radius classes
  const borderRadiusClasses = {
    none: "rounded-none",
    sm: "rounded",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    full: "rounded-3xl",
  }[cardBorderRadius];

  // Card shadow classes
  const shadowClasses = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
    "2xl": "shadow-2xl",
  }[cardShadow];

  // Hover effect classes
  const hoverEffectClasses = {
    none: "",
    lift: "hover:-translate-y-1 transition-transform duration-300",
    scale: "hover:scale-105 transition-transform duration-300",
    glow: "hover:ring-2 hover:ring-offset-2 transition-all duration-300",
    border: "hover:border-2 transition-all duration-300",
  }[hoverEffect];

  // Gap classes
  const gapClasses = {
    sm: "gap-4 md:gap-5",
    md: "gap-5 md:gap-6",
    lg: "gap-6 md:gap-8",
    xl: "gap-8 md:gap-10",
  }[gap];

  // Section gap classes
  const sectionGapClasses = {
    sm: "mb-8 md:mb-10",
    md: "mb-10 md:mb-12",
    lg: "mb-12 md:mb-16",
    xl: "mb-16 md:mb-20",
  }[sectionGap];

  // Content alignment
  const contentAlignClasses = {
    left: "text-left items-start",
    center: "text-center items-center",
    right: "text-right items-end",
  }[contentAlign];

  // Badge styles
  const badgeClasses = {
    pill: "px-4 py-1.5 rounded-full text-sm font-medium",
    outlined:
      "px-4 py-1.5 rounded-full text-sm font-medium border-2 bg-transparent",
    solid: "px-4 py-2 rounded-md text-sm font-medium",
    gradient: "px-4 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r",
  }[badgeStyle];

  // Get background style
  const getBackgroundStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = {};

    if (backgroundStyle === "solid") {
      style.backgroundColor = backgroundColor;
    } else if (backgroundStyle === "gradient") {
      const direction = {
        "to-r": "to right",
        "to-l": "to left",
        "to-t": "to top",
        "to-b": "to bottom",
        "to-br": "to bottom right",
        "to-bl": "to bottom left",
        "to-tr": "to top right",
        "to-tl": "to top left",
      }[backgroundGradientDirection];
      style.background = `linear-gradient(${direction}, ${backgroundGradientFrom}, ${backgroundGradientTo})`;
    } else if (backgroundStyle === "image" && backgroundImage) {
      style.backgroundImage = `url(${getImageUrl(backgroundImage)})`;
      style.backgroundSize = "cover";
      style.backgroundPosition = "center";
    }

    return style;
  };

  // Get card styles based on variant
  const getCardStyles = (
    stat: StatItem,
    index: number,
  ): { className: string; style: React.CSSProperties } => {
    const baseStyle: React.CSSProperties = {};
    let baseClasses = `flex flex-col ${contentAlignClasses}`;

    switch (variant) {
      case "cards":
        baseClasses += ` ${cardPaddingClasses} ${borderRadiusClasses} ${shadowClasses} ${hoverEffectClasses}`;
        baseStyle.backgroundColor = stat?.isHighlighted
          ? highlightedCardBackground
          : cardBackgroundColor;
        if (cardBorder) {
          baseStyle.borderWidth = `${cardBorderWidth}px`;
          baseStyle.borderColor = cardBorderColor;
          baseStyle.borderStyle = "solid";
        }
        break;
      case "bordered":
        baseClasses += " border-l-4 pl-6";
        baseStyle.borderColor = accentColor;
        break;
      case "gradient":
        baseClasses += ` ${cardPaddingClasses} ${borderRadiusClasses}`;
        baseStyle.background = `linear-gradient(135deg, ${accentColor}20, transparent)`;
        break;
      case "glass":
        baseClasses += ` ${cardPaddingClasses} ${borderRadiusClasses} backdrop-blur-sm`;
        baseStyle.backgroundColor = "rgba(255,255,255,0.1)";
        baseStyle.borderWidth = "1px";
        baseStyle.borderColor = "rgba(255,255,255,0.2)";
        break;
      case "outline":
        baseClasses += ` ${cardPaddingClasses} ${borderRadiusClasses} border-2`;
        baseStyle.borderColor = cardBorderColor || accentColor;
        break;
      case "circular":
        baseClasses +=
          " w-32 h-32 md:w-40 md:h-40 rounded-full justify-center mx-auto";
        baseStyle.backgroundColor = cardBackgroundColor;
        break;
      case "minimal":
        // No special styling for minimal
        break;
      default:
        // Simple variant - no special styling
        break;
    }

    // Animation classes
    if (animateOnScroll) {
      baseClasses += ` animate-in fade-in duration-500`;
      if (animationType === "slide-up")
        baseClasses += " slide-in-from-bottom-4";
      if (animationType === "scale") baseClasses += " zoom-in-95";
    }

    return { className: baseClasses, style: baseStyle };
  };

  // Render icon
  const renderIcon = (stat: StatItem) => {
    if (!showIcons || !stat?.icon) return null;

    const iconBgClasses = {
      default: "",
      circle: "rounded-full p-3 md:p-4",
      square: "rounded-md p-3 md:p-4",
      rounded: "rounded-lg p-3 md:p-4",
      gradient: "rounded-full p-3 md:p-4",
    }[iconStyle];

    const iconBgStyle: React.CSSProperties =
      iconStyle !== "default"
        ? {
            backgroundColor:
              iconStyle === "gradient"
                ? `linear-gradient(135deg, ${stat.iconColor || defaultIconColor}, ${stat.iconColor || defaultIconColor}80)`
                : iconBackgroundColor,
          }
        : {};

    return (
      <div
        className={`${iconSizeClasses} ${iconBgClasses} ${iconPosition === "top" ? "mb-4" : iconPosition === "left" ? "mr-4" : "mr-2"}`}
        style={{ ...iconBgStyle, color: stat.iconColor || defaultIconColor }}
      >
        {stat.icon}
      </div>
    );
  };

  // Render trend indicator
  const renderTrend = (stat: StatItem) => {
    if (!showTrends || !stat?.trend) return null;

    const trendColor = {
      up: trendUpColor,
      down: trendDownColor,
      neutral: trendNeutralColor,
    }[stat.trend];

    const trendIcon = {
      up: "↑",
      down: "↓",
      neutral: "→",
    }[stat.trend];

    return (
      <span
        className={`inline-flex items-center gap-1 text-sm font-medium ${trendPosition === "inline" ? "ml-2" : "mt-1"}`}
        style={{ color: trendColor }}
      >
        {trendIcon} {stat.trendValue}
      </span>
    );
  };

  // Render decorators
  const renderDecorators = () => {
    if (!showDecorators) return null;

    const decoratorElement = () => {
      switch (decoratorStyle) {
        case "dots":
          return (
            <div className="grid grid-cols-4 gap-2 w-24 h-24 opacity-20">
              {Array.from({ length: 16 }).map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: decoratorColor }}
                />
              ))}
            </div>
          );
        case "circles":
          return (
            <div className="relative w-40 h-40 opacity-20">
              <div
                className="absolute w-full h-full rounded-full border-4"
                style={{ borderColor: decoratorColor }}
              />
              <div
                className="absolute w-2/3 h-2/3 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-4"
                style={{ borderColor: decoratorColor }}
              />
            </div>
          );
        case "blur":
          return (
            <div
              className="w-64 h-64 rounded-full blur-3xl opacity-30"
              style={{ backgroundColor: decoratorColor }}
            />
          );
        default:
          return null;
      }
    };

    if (decoratorPosition === "both-sides") {
      return (
        <>
          <div className="absolute top-0 left-0 pointer-events-none">
            {decoratorElement()}
          </div>
          <div className="absolute bottom-0 right-0 pointer-events-none">
            {decoratorElement()}
          </div>
        </>
      );
    }

    const positionClasses = {
      "top-left": "top-0 left-0",
      "top-right": "top-0 right-0",
      "bottom-left": "bottom-0 left-0",
      "bottom-right": "bottom-0 right-0",
      "both-sides": "",
    }[decoratorPosition];

    return (
      <div className={`absolute ${positionClasses} pointer-events-none`}>
        {decoratorElement()}
      </div>
    );
  };

  const statsBgImageUrl = backgroundStyle === "image" ? getImageUrl(backgroundImage) : undefined;
  const effectivelyDark = isEffectivelyDark(backgroundColor, statsBgImageUrl, backgroundOverlay, backgroundOverlayColor, backgroundOverlayOpacity);
  const resolvedTextColor = resolveContrastColor(textColor, effectivelyDark);

  return (
    <section
      id={id}
      className={`w-full ${paddingYClasses} ${paddingXClasses} relative overflow-hidden ${className}`}
      style={getBackgroundStyle()}
      aria-label={ariaLabel || "Statistics"}
    >
      {/* Background overlay for images */}
      {backgroundStyle === "image" && backgroundOverlay && (
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundColor: backgroundOverlayColor,
            opacity: backgroundOverlayOpacity,
          }}
        />
      )}

      {/* Background pattern */}
      {backgroundPattern && (
        <div
          className="absolute inset-0 z-0"
          style={{ opacity: backgroundPatternOpacity }}
        >
          {backgroundPattern === "dots" && (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle, ${accentColor} 1px, transparent 1px)`,
                backgroundSize: "20px 20px",
              }}
            />
          )}
          {backgroundPattern === "grid" && (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `linear-gradient(${accentColor}20 1px, transparent 1px), linear-gradient(90deg, ${accentColor}20 1px, transparent 1px)`,
                backgroundSize: "40px 40px",
              }}
            />
          )}
        </div>
      )}

      {/* Decorators */}
      {renderDecorators()}

      <div className={`${maxWidthClasses} mx-auto relative z-10`}>
        {/* Header */}
        {(title || subtitle || description || badge) && (
          <div
            className={`${sectionGapClasses} ${headerAlign === "center" ? "text-center" : headerAlign === "right" ? "text-right" : "text-left"}`}
          >
            {/* Badge */}
            {badge && (
              <div
                className={`inline-flex items-center gap-2 mb-4 ${badgeClasses}`}
                style={{
                  backgroundColor:
                    badgeStyle !== "outlined" ? badgeColor : "transparent",
                  color:
                    badgeStyle === "outlined" ? badgeColor : badgeTextColor,
                  borderColor:
                    badgeStyle === "outlined" ? badgeColor : undefined,
                }}
              >
                {badgeIcon && <span>{badgeIcon}</span>}
                {badge}
              </div>
            )}

            {/* Subtitle */}
            {subtitle && (
              <p
                className="text-sm md:text-base font-semibold uppercase tracking-wider mb-2"
                style={{ color: resolveContrastColor(subtitleColor, effectivelyDark) || accentColor }}
              >
                {subtitle}
              </p>
            )}

            {/* Title */}
            {title && (
              <h2
                className={`${titleSizeClasses} font-bold mb-4`}
                style={{
                  color: resolveContrastColor(titleColor, effectivelyDark) || resolvedTextColor,
                  fontFamily: titleFont || undefined,
                }}
              >
                {title}
              </h2>
            )}

            {/* Description */}
            {description && (
              <p
                className={`text-base md:text-lg max-w-2xl ${headerAlign === "center" ? "mx-auto" : ""} opacity-80`}
                style={{ color: resolveContrastColor(descriptionColor, effectivelyDark) || resolvedTextColor }}
              >
                {description}
              </p>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div
          className={`grid ${columnClasses} ${gapClasses} ${compactOnMobile ? "gap-3 md:gap-6" : ""}`}
        >
          {stats.map((stat, i) => {
            const { className: cardClasses, style: cardStyle } = getCardStyles(
              stat,
              i,
            );
            const StatWrapper = stat.link ? "a" : "div";
            const wrapperProps = stat.link ? { href: stat.link } : {};

            return (
              <StatWrapper
                key={i}
                {...wrapperProps}
                className={`${cardClasses} ${stat.link ? "cursor-pointer" : ""} ${showDividers && i > 0 ? "relative" : ""}`}
                style={{
                  ...cardStyle,
                  animationDelay: animateOnScroll
                    ? `${entranceDelay + i * 100}ms`
                    : undefined,
                }}
              >
                {/* Divider */}
                {showDividers && i > 0 && variant === "simple" && (
                  <div
                    className="absolute left-0 top-1/4 h-1/2 w-px hidden md:block"
                    style={{
                      backgroundColor: dividerColor,
                      borderStyle:
                        dividerStyle === "solid" ? undefined : dividerStyle,
                    }}
                  />
                )}

                {/* Icon - Top */}
                {iconPosition === "top" && renderIcon(stat)}

                {/* Content with Icon Left */}
                <div
                  className={`flex ${iconPosition === "left" ? "flex-row items-center" : "flex-col"} ${contentAlignClasses}`}
                >
                  {/* Icon - Left */}
                  {iconPosition === "left" && renderIcon(stat)}

                  <div className={`flex flex-col ${contentAlignClasses}`}>
                    {/* Label - Above */}
                    {labelPosition === "above" && (
                      <div
                        className={`${labelSizeClasses} mb-2`}
                        style={{
                          color: resolveContrastColor(labelColor, effectivelyDark) || resolvedTextColor,
                          opacity: labelOpacity,
                        }}
                      >
                        {stat.label}
                      </div>
                    )}

                    {/* Value */}
                    <div
                      className={`${valueSizeClasses} ${valueFontWeightClasses} flex items-center`}
                      style={{
                        color: resolveContrastColor(valueColor, effectivelyDark) || resolvedTextColor,
                        fontFamily: valueFont || undefined,
                      }}
                    >
                      {/* Icon - Inline */}
                      {iconPosition === "inline" && renderIcon(stat)}
                      <span>
                        {stat.prefix}
                        {stat.value}
                        {stat.suffix}
                      </span>
                      {/* Trend - Inline */}
                      {trendPosition === "inline" && renderTrend(stat)}
                    </div>

                    {/* Label - Below */}
                    {labelPosition === "below" && (
                      <div
                        className={`${labelSizeClasses} mt-2`}
                        style={{
                          color: resolveContrastColor(labelColor, effectivelyDark) || resolvedTextColor,
                          opacity: labelOpacity,
                        }}
                      >
                        {stat.label}
                      </div>
                    )}

                    {/* Description */}
                    {showDescription && stat.description && (
                      <p
                        className={`${descriptionSizeClasses} mt-2 opacity-60 ${hideDescriptionOnMobile ? "hidden md:block" : ""}`}
                        style={{ color: resolvedTextColor }}
                      >
                        {stat.description}
                      </p>
                    )}

                    {/* Trend - Below */}
                    {trendPosition === "below" && renderTrend(stat)}
                  </div>
                </div>
              </StatWrapper>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// TIMELINE - Visual Timeline / Process Steps
// ============================================================================

export interface TimelineItem {
  title?: string;
  description?: string;
  date?: string;
  iconName?: string;
  iconColor?: string;
  image?: string | ImageValue;
  badge?: string;
  badgeColor?: string;
}

export interface TimelineProps {
  items?: TimelineItem[];

  // Header
  title?: string;
  subtitle?: string;
  description?: string;

  // Layout
  variant?: "vertical" | "horizontal" | "alternating";
  maxWidth?: "md" | "lg" | "xl" | "2xl" | "full";

  // Line
  lineColor?: string;
  lineWidth?: number;
  lineStyle?: "solid" | "dashed" | "dotted";

  // Node
  nodeSize?: "sm" | "md" | "lg";
  nodeColor?: string;
  nodeStyle?: "dot" | "ring" | "icon";

  // Card
  cardBackgroundColor?: string;
  cardBorderColor?: string;
  cardBorderRadius?: "none" | "sm" | "md" | "lg";
  cardShadow?: "none" | "sm" | "md";

  // Content colours
  titleColor?: string;
  descriptionColor?: string;
  dateColor?: string;
  headerTitleColor?: string;
  headerSubtitleColor?: string;
  headerDescriptionColor?: string;

  // Background
  backgroundColor?: string;

  // Spacing
  paddingY?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  paddingX?: "none" | "sm" | "md" | "lg" | "xl";
  gap?: "sm" | "md" | "lg" | "xl";

  // Animation
  animateOnScroll?: boolean;

  // Responsive
  mobileVariant?: "vertical";

  // Accessibility
  ariaLabel?: string;

  id?: string;
  className?: string;
}

export function TimelineRender({
  items = [],
  title,
  subtitle,
  description,
  variant = "vertical",
  maxWidth = "xl",
  lineColor,
  lineWidth = 2,
  lineStyle = "solid",
  nodeSize = "md",
  nodeColor,
  nodeStyle = "dot",
  cardBackgroundColor,
  cardBorderColor,
  cardBorderRadius = "lg",
  cardShadow = "sm",
  titleColor,
  descriptionColor,
  dateColor,
  headerTitleColor,
  headerSubtitleColor,
  headerDescriptionColor,
  backgroundColor,
  paddingY = "lg",
  paddingX = "md",
  gap = "lg",
  animateOnScroll = false,
  mobileVariant: _mobileVariant = "vertical",
  ariaLabel,
  id,
  className = "",
}: TimelineProps) {
  const resolvedLineColor = lineColor || "var(--color-border, #e5e7eb)";
  const resolvedNodeColor = nodeColor || "var(--color-primary, #3b82f6)";
  const resolvedCardBg = cardBackgroundColor || "var(--color-card, #ffffff)";
  const resolvedCardBorder = cardBorderColor || "var(--color-border, #e5e7eb)";
  const resolvedTitleColor = titleColor || "var(--color-foreground, #111827)";
  const resolvedDescColor =
    descriptionColor || "var(--color-muted-foreground, #6b7280)";
  const resolvedDateColor =
    dateColor || "var(--color-muted-foreground, #9ca3af)";
  const resolvedHeaderTitle =
    headerTitleColor || "var(--color-foreground, #111827)";
  const resolvedHeaderSubtitle =
    headerSubtitleColor || "var(--color-muted-foreground, #6b7280)";
  const resolvedHeaderDesc =
    headerDescriptionColor || "var(--color-muted-foreground, #6b7280)";
  const resolvedBg = backgroundColor || "var(--color-background, transparent)";

  const paddingYClasses = paddingYMapUtil[paddingY] || "";
  const paddingXClasses = paddingXMapUtil[paddingX] || "";
  const maxWidthClasses = maxWidthMapUtil[maxWidth] || "max-w-7xl";

  const nodeSizePx = { sm: 12, md: 16, lg: 24 }[nodeSize];
  const gapClasses = { sm: "gap-6", md: "gap-8", lg: "gap-12", xl: "gap-16" }[
    gap
  ];

  const cardRadiusClasses = {
    none: "rounded-none",
    sm: "rounded",
    md: "rounded-md",
    lg: "rounded-lg",
  }[cardBorderRadius];

  const cardShadowClasses = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
  }[cardShadow];

  const renderNode = (item: TimelineItem, index: number) => {
    const color = item.iconColor || resolvedNodeColor;
    const size = nodeSizePx;

    if (nodeStyle === "ring") {
      return (
        <div
          className="rounded-full flex-shrink-0"
          style={{
            width: size,
            height: size,
            border: `${lineWidth + 1}px solid ${color}`,
            backgroundColor:
              resolvedBg === "transparent"
                ? "var(--color-background, #ffffff)"
                : resolvedBg,
          }}
          aria-hidden="true"
        />
      );
    }

    if (nodeStyle === "icon" && item.iconName) {
      return (
        <div
          className="rounded-full flex items-center justify-center flex-shrink-0 text-white"
          style={{
            width: size + 8,
            height: size + 8,
            backgroundColor: color,
            fontSize: size * 0.6,
          }}
          aria-hidden="true"
        >
          {item.iconName}
        </div>
      );
    }

    // Default: dot
    return (
      <div
        className="rounded-full flex-shrink-0"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
        }}
        aria-hidden="true"
      />
    );
  };

  const renderCard = (item: TimelineItem, index: number) => (
    <div
      className={`${cardRadiusClasses} ${cardShadowClasses} p-4 md:p-6`}
      style={{
        backgroundColor: resolvedCardBg,
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: resolvedCardBorder,
        ...(animateOnScroll
          ? {
              animationDelay: `${index * 150}ms`,
              animationFillMode: "both",
            }
          : {}),
      }}
    >
      {item.badge && (
        <span
          className="inline-block px-2 py-0.5 text-xs font-medium rounded-full mb-2"
          style={{
            backgroundColor: item.badgeColor || resolvedNodeColor,
            color: "#ffffff",
          }}
        >
          {item.badge}
        </span>
      )}
      {item.date && (
        <time
          className="block text-xs md:text-sm mb-1"
          style={{ color: resolvedDateColor }}
        >
          {item.date}
        </time>
      )}
      {item.title && (
        <h3
          className="text-base md:text-lg font-semibold mb-1"
          style={{ color: resolvedTitleColor }}
        >
          {item.title}
        </h3>
      )}
      {item.description && (
        <p
          className="text-sm md:text-base"
          style={{ color: resolvedDescColor }}
        >
          {item.description}
        </p>
      )}
      {item.image && (
        <img
          src={getImageUrl(item.image)}
          alt={item.title || `Timeline item ${index + 1}`}
          className="mt-3 rounded w-full object-cover max-h-48"
          loading="lazy"
        />
      )}
    </div>
  );

  // Vertical layout
  const renderVertical = () => (
    <div className={`relative ${gapClasses} flex flex-col`}>
      {/* Timeline line */}
      <div
        className="absolute left-2 md:left-3 top-0 bottom-0"
        style={{
          width: lineWidth,
          backgroundColor:
            lineStyle === "solid" ? resolvedLineColor : undefined,
          borderLeftWidth: lineStyle !== "solid" ? lineWidth : undefined,
          borderLeftStyle: lineStyle !== "solid" ? lineStyle : undefined,
          borderLeftColor:
            lineStyle !== "solid" ? resolvedLineColor : undefined,
          marginLeft: (nodeSizePx - lineWidth) / 2,
        }}
        aria-hidden="true"
      />

      {items.map((item, i) => (
        <div key={i} className="relative flex items-start gap-4 md:gap-6">
          <div className="relative z-10 mt-1">{renderNode(item, i)}</div>
          <div className="flex-1 min-w-0 pb-2">{renderCard(item, i)}</div>
        </div>
      ))}
    </div>
  );

  // Horizontal layout
  const renderHorizontal = () => (
    <div className="relative">
      {/* Timeline line */}
      <div
        className="absolute top-3 md:top-4 left-0 right-0"
        style={{
          height: lineWidth,
          backgroundColor:
            lineStyle === "solid" ? resolvedLineColor : undefined,
          borderTopWidth: lineStyle !== "solid" ? lineWidth : undefined,
          borderTopStyle: lineStyle !== "solid" ? lineStyle : undefined,
          borderTopColor: lineStyle !== "solid" ? resolvedLineColor : undefined,
        }}
        aria-hidden="true"
      />

      <div
        className={`grid grid-cols-2 ${({ 1: "md:grid-cols-1", 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4" } as Record<number, string>)[Math.min(items.length, 4)] || "md:grid-cols-4"} ${gapClasses}`}
      >
        {items.map((item, i) => (
          <div
            key={i}
            className="relative flex flex-col items-center text-center"
          >
            <div className="relative z-10 mb-4">{renderNode(item, i)}</div>
            {renderCard(item, i)}
          </div>
        ))}
      </div>
    </div>
  );

  // Alternating layout
  const renderAlternating = () => (
    <div className={`relative ${gapClasses} flex flex-col`}>
      {/* Centre line (desktop) / left line (mobile) */}
      <div
        className="absolute left-2 md:left-1/2 top-0 bottom-0 md:-translate-x-1/2"
        style={{
          width: lineWidth,
          backgroundColor:
            lineStyle === "solid" ? resolvedLineColor : undefined,
          borderLeftWidth: lineStyle !== "solid" ? lineWidth : undefined,
          borderLeftStyle: lineStyle !== "solid" ? lineStyle : undefined,
          borderLeftColor:
            lineStyle !== "solid" ? resolvedLineColor : undefined,
        }}
        aria-hidden="true"
      />

      {items.map((item, i) => {
        const isLeft = i % 2 === 0;
        return (
          <div key={i} className="relative flex items-start gap-4 md:gap-6">
            {/* Mobile: standard left-aligned */}
            <div className="md:hidden relative z-10 mt-1">
              {renderNode(item, i)}
            </div>
            <div className="md:hidden flex-1 min-w-0 pb-2">
              {renderCard(item, i)}
            </div>

            {/* Desktop: alternating */}
            <div className="hidden md:flex w-full items-start">
              {/* Left content */}
              <div className={`w-[calc(50%-20px)] ${isLeft ? "" : "order-3"}`}>
                {(isLeft ? true : false) && renderCard(item, i)}
              </div>

              {/* Centre node */}
              <div className="relative z-10 flex-shrink-0 mx-2 order-2 mt-1">
                {renderNode(item, i)}
              </div>

              {/* Right content */}
              <div className={`w-[calc(50%-20px)] ${isLeft ? "order-3" : ""}`}>
                {(isLeft ? false : true) && renderCard(item, i)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <section
      id={id}
      className={`w-full ${paddingYClasses} ${paddingXClasses} ${className}`}
      style={{ backgroundColor: resolvedBg }}
      aria-label={ariaLabel || "Timeline"}
      role="list"
    >
      <div className={`${maxWidthClasses} mx-auto`}>
        {/* Header */}
        {(title || subtitle || description) && (
          <div className="text-center mb-10 md:mb-14">
            {subtitle && (
              <p
                className="text-sm font-semibold uppercase tracking-wider mb-2"
                style={{ color: resolvedHeaderSubtitle }}
              >
                {subtitle}
              </p>
            )}
            {title && (
              <h2
                className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3"
                style={{ color: resolvedHeaderTitle }}
              >
                {title}
              </h2>
            )}
            {description && (
              <p
                className="text-base md:text-lg max-w-2xl mx-auto"
                style={{ color: resolvedHeaderDesc }}
              >
                {description}
              </p>
            )}
          </div>
        )}

        {/* Timeline content */}
        {variant === "horizontal"
          ? renderHorizontal()
          : variant === "alternating"
            ? renderAlternating()
            : renderVertical()}
      </div>
    </section>
  );
}

// ============================================================================
// BEFORE/AFTER - Image Comparison Slider
// ============================================================================

export interface BeforeAfterProps {
  beforeImage?: string | ImageValue;
  afterImage?: string | ImageValue;
  beforeLabel?: string;
  afterLabel?: string;

  // Slider
  initialPosition?: number;
  orientation?: "horizontal" | "vertical";

  // Handle
  handleStyle?: "line" | "circle" | "arrows";
  handleColor?: string;
  handleSize?: "sm" | "md" | "lg";

  // Display
  showLabels?: boolean;
  labelPosition?: "top" | "bottom" | "overlay";
  aspectRatio?: "square" | "video" | "portrait" | "wide" | "auto";
  borderRadius?: "none" | "sm" | "md" | "lg" | "xl";

  // Caption
  caption?: string;
  captionColor?: string;

  // Colours
  labelBackgroundColor?: string;
  labelTextColor?: string;

  // Accessibility
  ariaLabel?: string;

  id?: string;
  className?: string;
}

export function BeforeAfterRender({
  beforeImage,
  afterImage,
  beforeLabel = "Before",
  afterLabel = "After",
  initialPosition = 50,
  orientation = "horizontal",
  handleStyle = "arrows",
  handleColor,
  handleSize = "md",
  showLabels = true,
  labelPosition = "overlay",
  aspectRatio = "video",
  borderRadius = "lg",
  caption,
  captionColor,
  labelBackgroundColor,
  labelTextColor,
  ariaLabel,
  id,
  className = "",
}: BeforeAfterProps) {
  const [position, setPosition] = React.useState(initialPosition);
  const [isDragging, setIsDragging] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const resolvedHandleColor = handleColor || "var(--color-primary, #3b82f6)";
  const resolvedLabelBg =
    labelBackgroundColor || "var(--color-background, rgba(0,0,0,0.6))";
  const resolvedLabelText =
    labelTextColor || "var(--color-foreground, #ffffff)";
  const resolvedCaptionColor =
    captionColor || "var(--color-muted-foreground, #6b7280)";

  const isHorizontal = orientation === "horizontal";

  const aspectRatioClasses = {
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[3/4]",
    wide: "aspect-[21/9]",
    auto: "",
  }[aspectRatio];

  const borderRadiusClasses = {
    none: "rounded-none",
    sm: "rounded",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
  }[borderRadius];

  const handleSizePx = { sm: 32, md: 40, lg: 48 }[handleSize];

  const updatePosition = React.useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      let pct: number;
      if (isHorizontal) {
        pct = ((clientX - rect.left) / rect.width) * 100;
      } else {
        pct = ((clientY - rect.top) / rect.height) * 100;
      }
      setPosition(Math.max(0, Math.min(100, pct)));
    },
    [isHorizontal],
  );

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      updatePosition(clientX, clientY);
    };

    const handleUp = () => setIsDragging(false);

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [isDragging, updatePosition]);

  // Keyboard support
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      const step = 5;
      if (isHorizontal) {
        if (e.key === "ArrowLeft") setPosition((p) => Math.max(0, p - step));
        if (e.key === "ArrowRight") setPosition((p) => Math.min(100, p + step));
      } else {
        if (e.key === "ArrowUp") setPosition((p) => Math.max(0, p - step));
        if (e.key === "ArrowDown") setPosition((p) => Math.min(100, p + step));
      }
    },
    [isHorizontal],
  );

  const beforeSrc = beforeImage ? getImageUrl(beforeImage) : "";
  const afterSrc = afterImage ? getImageUrl(afterImage) : "";

  const clipPath = isHorizontal
    ? `inset(0 ${100 - position}% 0 0)`
    : `inset(0 0 ${100 - position}% 0)`;

  const renderHandle = () => {
    const commonStyle: React.CSSProperties = {
      position: "absolute",
      zIndex: 10,
      ...(isHorizontal
        ? {
            left: `${position}%`,
            top: 0,
            bottom: 0,
            transform: "translateX(-50%)",
          }
        : {
            top: `${position}%`,
            left: 0,
            right: 0,
            transform: "translateY(-50%)",
          }),
    };

    return (
      <div style={commonStyle}>
        {/* Line */}
        <div
          style={{
            position: "absolute",
            backgroundColor: resolvedHandleColor,
            ...(isHorizontal
              ? {
                  width: 2,
                  top: 0,
                  bottom: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                }
              : {
                  height: 2,
                  left: 0,
                  right: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                }),
          }}
        />

        {/* Handle grip */}
        <div
          className="absolute flex items-center justify-center"
          style={{
            width: handleSizePx,
            height: handleSizePx,
            ...(isHorizontal
              ? { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
              : {
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }),
            backgroundColor: resolvedHandleColor,
            borderRadius: handleStyle === "line" ? 4 : "50%",
            cursor: isHorizontal ? "ew-resize" : "ns-resize",
            color: "#ffffff",
            fontSize: handleSizePx * 0.45,
          }}
        >
          {handleStyle === "arrows" && (isHorizontal ? "⟨ ⟩" : "⟨ ⟩")}
          {handleStyle === "circle" && "●"}
        </div>
      </div>
    );
  };

  const renderLabels = () => {
    if (!showLabels) return null;

    const labelStyle: React.CSSProperties = {
      backgroundColor: resolvedLabelBg,
      color: resolvedLabelText,
    };

    if (labelPosition === "overlay") {
      return (
        <>
          <span
            className="absolute z-5 top-3 left-3 px-2 py-1 text-xs font-medium rounded"
            style={labelStyle}
          >
            {beforeLabel}
          </span>
          <span
            className="absolute z-5 top-3 right-3 px-2 py-1 text-xs font-medium rounded"
            style={labelStyle}
          >
            {afterLabel}
          </span>
        </>
      );
    }

    const wrapperClass = labelPosition === "top" ? "mb-2" : "mt-2";
    return (
      <div
        className={`flex justify-between text-sm font-medium ${wrapperClass}`}
      >
        <span style={{ color: resolvedLabelText }}>{beforeLabel}</span>
        <span style={{ color: resolvedLabelText }}>{afterLabel}</span>
      </div>
    );
  };

  if (!beforeSrc || !afterSrc) {
    return (
      <div
        id={id}
        className={`${aspectRatioClasses} ${borderRadiusClasses} flex items-center justify-center ${className}`}
        style={{ backgroundColor: "var(--color-muted, #f3f4f6)" }}
      >
        <p style={{ color: "var(--color-muted-foreground, #9ca3af)" }}>
          Please add before and after images
        </p>
      </div>
    );
  }

  return (
    <figure id={id} className={className}>
      {labelPosition === "top" && renderLabels()}

      <div
        ref={containerRef}
        className={`relative overflow-hidden select-none ${aspectRatioClasses} ${borderRadiusClasses}`}
        role="slider"
        aria-label={ariaLabel || "Before and after comparison"}
        aria-valuenow={Math.round(position)}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onMouseDown={(e) => {
          setIsDragging(true);
          updatePosition(e.clientX, e.clientY);
        }}
        onTouchStart={(e) => {
          setIsDragging(true);
          updatePosition(e.touches[0].clientX, e.touches[0].clientY);
        }}
        style={{
          cursor: isDragging
            ? isHorizontal
              ? "ew-resize"
              : "ns-resize"
            : "pointer",
        }}
      >
        {/* After image (full, behind) */}
        <img
          src={afterSrc}
          alt={`After: ${afterLabel}`}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          draggable={false}
        />

        {/* Before image (clipped) */}
        <img
          src={beforeSrc}
          alt={`Before: ${beforeLabel}`}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ clipPath }}
          loading="lazy"
          draggable={false}
        />

        {/* Handle */}
        {renderHandle()}

        {/* Labels */}
        {labelPosition === "overlay" && renderLabels()}
      </div>

      {labelPosition === "bottom" && renderLabels()}

      {caption && (
        <figcaption
          className="text-sm mt-2 text-center"
          style={{ color: resolvedCaptionColor }}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

// ============================================================================
// ICON - SVG Icon Display
// ============================================================================

export interface IconProps {
  name?: string;

  // Size
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

  // Colours
  color?: string;
  backgroundColor?: string;

  // Background shape
  backgroundShape?: "none" | "circle" | "rounded" | "square";
  backgroundPadding?: "sm" | "md" | "lg";

  // Stroke
  strokeWidth?: number;

  // Animation
  animation?: "none" | "spin" | "pulse" | "bounce" | "float";

  // Accessibility
  ariaLabel?: string;
  decorative?: boolean;

  id?: string;
  className?: string;
}

export function IconRender({
  name = "Zap",
  size = "md",
  color,
  backgroundColor,
  backgroundShape = "none",
  backgroundPadding = "md",
  strokeWidth = 2,
  animation = "none",
  ariaLabel,
  decorative = true,
  id,
  className = "",
}: IconProps) {
  const resolvedColor = color || "var(--color-foreground, currentColor)";
  const resolvedBgColor = backgroundColor || "var(--color-primary, #3b82f6)";

  const sizePx = {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 48,
    "2xl": 64,
    "3xl": 96,
  }[size];

  const paddingPx = {
    sm: 6,
    md: 10,
    lg: 16,
  }[backgroundPadding];

  const animationClasses = {
    none: "",
    spin: "animate-spin",
    pulse: "animate-pulse",
    bounce: "animate-bounce",
    float: "",
  }[animation];

  // Float animation via inline style since Tailwind doesn't have it
  const floatStyle: React.CSSProperties =
    animation === "float"
      ? {
          animation: "float 3s ease-in-out infinite",
        }
      : {};

  const bgShapeClasses = {
    none: "",
    circle: "rounded-full",
    rounded: "rounded-lg",
    square: "rounded-none",
  }[backgroundShape];

  // Known Lucide icon map — render as SVG placeholder referencing the name
  // In the actual platform, a Lucide resolver maps `name` → React component
  // Here we render a generic SVG container with the icon name for the renderer
  const renderIcon = () => (
    <svg
      width={sizePx}
      height={sizePx}
      viewBox="0 0 24 24"
      fill="none"
      stroke={resolvedColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={decorative ? "presentation" : "img"}
      aria-label={!decorative ? ariaLabel || name : undefined}
      aria-hidden={decorative ? "true" : undefined}
    >
      {/* Fallback content — platform's Lucide resolver replaces this */}
      <text
        x="12"
        y="12"
        textAnchor="middle"
        dominantBaseline="central"
        fill={resolvedColor}
        stroke="none"
        fontSize="10"
        fontFamily="sans-serif"
      >
        {(name || "?").charAt(0).toUpperCase()}
      </text>
    </svg>
  );

  if (backgroundShape === "none") {
    return (
      <span
        id={id}
        className={`inline-flex items-center justify-center ${animationClasses} ${className}`}
        style={floatStyle}
      >
        {renderIcon()}
      </span>
    );
  }

  return (
    <span
      id={id}
      className={`inline-flex items-center justify-center ${bgShapeClasses} ${animationClasses} ${className}`}
      style={{
        backgroundColor: resolvedBgColor,
        padding: paddingPx,
        ...floatStyle,
      }}
    >
      {renderIcon()}
    </span>
  );
}

// ============================================================================
// AUDIO - Audio Player with 3 variants (full, compact, minimal)
// ============================================================================

export interface AudioProps {
  src?: string;
  title?: string;
  artist?: string;
  cover?: string | ImageValue;

  // Playback
  autoplay?: boolean;
  loop?: boolean;
  preload?: "auto" | "metadata" | "none";

  // Style
  variant?: "full" | "compact" | "minimal";
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  waveformColor?: string;
  waveformProgressColor?: string;

  // Display
  showWaveform?: boolean;
  showDuration?: boolean;
  showDownload?: boolean;
  showSpeed?: boolean;

  // Shape
  borderRadius?: "none" | "sm" | "md" | "lg" | "xl";
  shadow?: "none" | "sm" | "md" | "lg";

  // Accessibility
  ariaLabel?: string;

  id?: string;
  className?: string;
}

export function AudioRender({
  src = "",
  title = "Audio Track",
  artist,
  cover,
  autoplay = false,
  loop = false,
  preload = "metadata",
  variant = "full",
  accentColor,
  backgroundColor,
  textColor,
  waveformColor,
  waveformProgressColor,
  showWaveform = true,
  showDuration = true,
  showDownload = false,
  showSpeed = false,
  borderRadius = "lg",
  shadow = "md",
  ariaLabel,
  id,
  className = "",
}: AudioProps) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [playbackRate, setPlaybackRate] = React.useState(1);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const resolvedAccent = accentColor || "var(--color-primary, #3b82f6)";
  const resolvedBg = backgroundColor || "var(--color-card, #ffffff)";
  const resolvedText = textColor || "var(--color-foreground, #111827)";
  const resolvedWaveform = waveformColor || "var(--color-border, #e5e7eb)";
  const resolvedWaveformProgress = waveformProgressColor || resolvedAccent;

  const coverUrl = getImageUrl(cover) || undefined;

  const radiusClass = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
  }[borderRadius];
  const shadowClass = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
  }[shadow];

  const formatTime = (t: number) => {
    const mins = Math.floor(t / 60);
    const secs = Math.floor(t % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const togglePlay = React.useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleTimeUpdate = React.useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = React.useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, []);

  const handleSeek = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current;
      if (!audio || !duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width),
      );
      audio.currentTime = percent * duration;
    },
    [duration],
  );

  const cycleSpeed = React.useCallback(() => {
    const speeds = [0.75, 1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const newRate = speeds[nextIdx];
    setPlaybackRate(newRate);
    if (audioRef.current) audioRef.current.playbackRate = newRate;
  }, [playbackRate]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Play/Pause button SVG
  const PlayPauseIcon = () => (
    <svg viewBox="0 0 24 24" fill={resolvedAccent} className="w-full h-full">
      {isPlaying ? (
        <>
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </>
      ) : (
        <path d="M8 5v14l11-7z" />
      )}
    </svg>
  );

  // Waveform bars (visual representation)
  const renderWaveform = () => {
    if (!showWaveform || variant === "minimal") return null;
    const barCount = variant === "compact" ? 30 : 50;
    return (
      <div
        className="flex items-end gap-[2px] h-12 cursor-pointer flex-1"
        onClick={handleSeek}
        role="slider"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Audio progress"
        tabIndex={0}
      >
        {Array.from({ length: barCount }, (_, i) => {
          const barHeight = 20 + Math.sin(i * 0.5) * 30 + Math.random() * 20;
          const isPlayed = (i / barCount) * 100 <= progress;
          return (
            <div
              key={i}
              className="flex-1 min-w-[2px] rounded-sm transition-colors"
              style={{
                height: `${barHeight}%`,
                backgroundColor: isPlayed
                  ? resolvedWaveformProgress
                  : resolvedWaveform,
              }}
            />
          );
        })}
      </div>
    );
  };

  // Progress bar (for compact/minimal)
  const renderProgressBar = () => (
    <div
      className="flex-1 h-1.5 rounded-full cursor-pointer"
      style={{ backgroundColor: resolvedWaveform }}
      onClick={handleSeek}
      role="slider"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Audio progress"
      tabIndex={0}
    >
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${progress}%`, backgroundColor: resolvedAccent }}
      />
    </div>
  );

  if (!src) {
    return (
      <div
        id={id}
        className={`flex items-center justify-center p-8 ${radiusClass} ${shadowClass} ${className}`}
        style={{ backgroundColor: resolvedBg, color: resolvedText }}
      >
        <p className="text-sm opacity-60">No audio source provided</p>
      </div>
    );
  }

  return (
    <div
      id={id}
      className={`${radiusClass} ${shadowClass} overflow-hidden ${className}`}
      style={{ backgroundColor: resolvedBg }}
      aria-label={ariaLabel || `Audio player: ${title}`}
      role="region"
    >
      <audio
        ref={audioRef}
        src={src}
        autoPlay={autoplay}
        loop={loop}
        preload={preload}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      {variant === "full" && (
        <div className="flex gap-4 p-4">
          {/* Cover art */}
          {coverUrl && (
            <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
              <img
                src={coverUrl}
                alt={`${title} cover`}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 flex flex-col justify-between min-w-0">
            {/* Title & artist */}
            <div>
              <h3
                className="font-semibold text-sm truncate"
                style={{ color: resolvedText }}
              >
                {title}
              </h3>
              {artist && (
                <p
                  className="text-xs opacity-60 truncate"
                  style={{ color: resolvedText }}
                >
                  {artist}
                </p>
              )}
            </div>
            {/* Waveform */}
            {showWaveform ? renderWaveform() : renderProgressBar()}
            {/* Controls */}
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={togglePlay}
                className="w-8 h-8 flex-shrink-0"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                <PlayPauseIcon />
              </button>
              {showDuration && (
                <span
                  className="text-xs tabular-nums"
                  style={{ color: resolvedText }}
                >
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              )}
              {showSpeed && (
                <button
                  onClick={cycleSpeed}
                  className="text-xs px-1.5 py-0.5 rounded font-medium"
                  style={{
                    backgroundColor: resolvedAccent + "20",
                    color: resolvedAccent,
                  }}
                  aria-label={`Playback speed: ${playbackRate}x`}
                >
                  {playbackRate}x
                </button>
              )}
              {showDownload && src && (
                <a
                  href={src}
                  download
                  className="ml-auto text-xs opacity-60 hover:opacity-100"
                  style={{ color: resolvedText }}
                  aria-label="Download audio"
                >
                  ⬇
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {variant === "compact" && (
        <div className="flex items-center gap-3 p-3">
          <button
            onClick={togglePlay}
            className="w-8 h-8 flex-shrink-0"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            <PlayPauseIcon />
          </button>
          {showWaveform ? renderWaveform() : renderProgressBar()}
          {showDuration && (
            <span
              className="text-xs tabular-nums flex-shrink-0"
              style={{ color: resolvedText }}
            >
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          )}
          {showSpeed && (
            <button
              onClick={cycleSpeed}
              className="text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0"
              style={{
                backgroundColor: resolvedAccent + "20",
                color: resolvedAccent,
              }}
            >
              {playbackRate}x
            </button>
          )}
        </div>
      )}

      {variant === "minimal" && (
        <div className="flex items-center gap-2 p-2">
          <button
            onClick={togglePlay}
            className="w-6 h-6 flex-shrink-0"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            <PlayPauseIcon />
          </button>
          {renderProgressBar()}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EMBED - Secure iframe embed container
// ============================================================================

export interface EmbedProps {
  src?: string;
  title?: string;

  // Size
  aspectRatio?: "1:1" | "4:3" | "16:9" | "21:9" | "auto";
  width?: string;
  height?: string;
  maxWidth?: string;

  // Style
  borderRadius?: "none" | "sm" | "md" | "lg" | "xl";
  border?: boolean;
  borderColor?: string;
  shadow?: "none" | "sm" | "md" | "lg";
  backgroundColor?: string;

  // Loading
  loading?: "lazy" | "eager";
  showLoadingPlaceholder?: boolean;

  // Security
  sandbox?: string;
  allow?: string;

  // Caption
  caption?: string;
  captionAlign?: "left" | "center" | "right";
  captionColor?: string;

  // Accessibility
  ariaLabel?: string;

  id?: string;
  className?: string;
}

export function EmbedRender({
  src = "",
  title = "Embedded content",
  aspectRatio = "16:9",
  width,
  height,
  maxWidth,
  borderRadius = "lg",
  border = false,
  borderColor,
  shadow = "sm",
  backgroundColor,
  loading = "lazy",
  showLoadingPlaceholder = true,
  sandbox = "allow-scripts allow-same-origin allow-forms allow-popups",
  allow = "autoplay; encrypted-media",
  caption,
  captionAlign = "center",
  captionColor,
  ariaLabel,
  id,
  className = "",
}: EmbedProps) {
  const [isLoaded, setIsLoaded] = React.useState(false);

  const resolvedBg = backgroundColor || "var(--color-muted, #f3f4f6)";
  const resolvedBorderColor = borderColor || "var(--color-border, #e5e7eb)";
  const resolvedCaptionColor =
    captionColor || "var(--color-muted-foreground, #6b7280)";

  const radiusClass = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
  }[borderRadius];
  const shadowClass = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
  }[shadow];

  const aspectMap: Record<string, string> = {
    "1:1": "1/1",
    "4:3": "4/3",
    "16:9": "16/9",
    "21:9": "21/9",
    auto: "auto",
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: maxWidth || undefined,
    width: width || undefined,
    backgroundColor: resolvedBg,
    aspectRatio: height ? undefined : aspectMap[aspectRatio] || "16/9",
    height: height || undefined,
  };

  if (!src) {
    return (
      <div
        id={id}
        className={`flex items-center justify-center p-8 ${radiusClass} ${shadowClass} ${className}`}
        style={{ ...containerStyle, minHeight: "200px" }}
      >
        <p
          className="text-sm opacity-60"
          style={{ color: resolvedCaptionColor }}
        >
          No embed URL provided
        </p>
      </div>
    );
  }

  const iframeElement = (
    <div
      className={`relative overflow-hidden ${radiusClass} ${shadowClass} ${className}`}
      style={containerStyle}
    >
      {/* Loading placeholder */}
      {showLoadingPlaceholder && !isLoaded && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: resolvedBg }}
        >
          <svg
            className="animate-spin w-6 h-6 opacity-40"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
      )}
      <iframe
        id={id}
        src={src}
        title={title}
        sandbox={sandbox}
        allow={allow}
        loading={loading}
        onLoad={() => setIsLoaded(true)}
        className="w-full h-full border-0"
        style={{
          borderWidth: border ? "1px" : undefined,
          borderStyle: border ? "solid" : undefined,
          borderColor: border ? resolvedBorderColor : undefined,
          borderRadius: "inherit",
        }}
        aria-label={ariaLabel || title}
      />
    </div>
  );

  if (caption) {
    return (
      <figure>
        {iframeElement}
        <figcaption
          className={`mt-2 text-sm text-${captionAlign}`}
          style={{ color: resolvedCaptionColor }}
        >
          {caption}
        </figcaption>
      </figure>
    );
  }

  return iframeElement;
}

// ============================================================================
// AVATAR GROUP - Stacked avatar collection with overflow badge
// ============================================================================

export interface AvatarGroupItem {
  src?: string | ImageValue;
  alt?: string;
  name?: string;
  href?: string;
}

export interface AvatarGroupProps {
  avatars?: AvatarGroupItem[];
  max?: number;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  overlap?: "sm" | "md" | "lg";
  direction?: "left" | "right";
  overflowStyle?: "count" | "hidden";
  overflowColor?: string;
  overflowTextColor?: string;
  ringColor?: string;

  id?: string;
  className?: string;
}

export function AvatarGroupRender({
  avatars = [],
  max = 5,
  size = "md",
  overlap = "md",
  direction = "left",
  overflowStyle = "count",
  overflowColor,
  overflowTextColor,
  ringColor,
  id,
  className = "",
}: AvatarGroupProps) {
  const sizeMap = { xs: 24, sm: 32, md: 40, lg: 48, xl: 56 };
  const overlapMap = { sm: 8, md: 16, lg: 24 };
  const fontSizeMap = {
    xs: "0.5rem",
    sm: "0.625rem",
    md: "0.75rem",
    lg: "0.875rem",
    xl: "1rem",
  };

  const px = sizeMap[size] || 40;
  const overlapPx = overlapMap[overlap] || 16;
  const fontSize = fontSizeMap[size] || "0.75rem";

  const resolvedRing = ringColor || "var(--color-background, #ffffff)";
  const resolvedOverflowBg = overflowColor || "var(--color-muted, #e5e7eb)";
  const resolvedOverflowText =
    overflowTextColor || "var(--color-muted-foreground, #6b7280)";

  const visible = avatars.slice(0, max);
  const overflowCount = avatars.length - max;

  const renderAvatar = (item: AvatarGroupItem, idx: number) => {
    const imgUrl = getImageUrl(item.src) || undefined;
    const initials = (item.name || item.alt || "?").charAt(0).toUpperCase();
    const ml = idx > 0 ? `-${overlapPx}px` : "0";
    const zIndex = direction === "left" ? visible.length - idx : idx;

    const avatarContent = (
      <div
        className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
        style={{
          width: px,
          height: px,
          marginLeft: ml,
          zIndex,
          border: `2px solid ${resolvedRing}`,
          backgroundColor: imgUrl ? undefined : "var(--color-muted, #d1d5db)",
          position: "relative",
        }}
        title={item.name || item.alt}
      >
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={item.alt || item.name || "Avatar"}
            className="w-full h-full object-cover"
          />
        ) : (
          <span
            className="font-medium"
            style={{ fontSize, color: resolvedOverflowText }}
          >
            {initials}
          </span>
        )}
      </div>
    );

    if (item.href) {
      return (
        <a
          key={idx}
          href={item.href}
          className="focus:outline-none focus:ring-2 rounded-full"
          style={{ zIndex, marginLeft: ml }}
        >
          {avatarContent}
        </a>
      );
    }

    return <React.Fragment key={idx}>{avatarContent}</React.Fragment>;
  };

  return (
    <div
      id={id}
      className={`flex items-center ${className}`}
      role="group"
      aria-label={`Group of ${avatars.length} avatars`}
    >
      {visible.map(renderAvatar)}

      {overflowCount > 0 && overflowStyle === "count" && (
        <div
          className="rounded-full flex-shrink-0 flex items-center justify-center font-medium"
          style={{
            width: px,
            height: px,
            marginLeft: `-${overlapPx}px`,
            zIndex: 0,
            border: `2px solid ${resolvedRing}`,
            backgroundColor: resolvedOverflowBg,
            color: resolvedOverflowText,
            fontSize,
          }}
          aria-label={`${overflowCount} more`}
        >
          +{overflowCount}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TEAM - Team Members Grid
// ============================================================================

export interface TeamMember {
  name?: string;
  role?: string;
  department?: string;
  bio?: string;
  image?: string | ImageValue;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  github?: string;
  website?: string;
  email?: string;
  phone?: string;
  location?: string;
  skills?: string[];
  isLeadership?: boolean;
  isFeatured?: boolean;
}

export interface TeamProps {
  // Header Content
  title?: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  badgeIcon?: string;

  // Header Styling
  headerAlign?: "left" | "center" | "right";
  titleSize?: "sm" | "md" | "lg" | "xl" | "2xl";
  titleColor?: string;
  titleFont?: string;
  subtitleColor?: string;
  descriptionColor?: string;
  badgeStyle?: "pill" | "outlined" | "solid" | "gradient";
  badgeColor?: string;
  badgeTextColor?: string;

  // Team Members
  members?: TeamMember[];

  // Layout & Variant
  variant?:
    | "cards"
    | "minimal"
    | "detailed"
    | "grid"
    | "list"
    | "magazine"
    | "overlap"
    | "circular"
    | "modern"
    | "hover-reveal";
  columns?: 2 | 3 | 4 | 5 | 6;
  maxWidth?: "md" | "lg" | "xl" | "2xl" | "full";
  contentAlign?: "left" | "center" | "right";

  // Card Styling
  backgroundColor?: string;
  cardBackgroundColor?: string;
  cardHoverBackgroundColor?: string;
  featuredCardBackground?: string;
  cardBorder?: boolean;
  cardBorderColor?: string;
  cardBorderWidth?: "1" | "2" | "3";
  cardBorderRadius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  cardShadow?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  cardHoverShadow?: "none" | "sm" | "md" | "lg" | "xl";
  cardPadding?: "sm" | "md" | "lg" | "xl";
  hoverEffect?: "none" | "lift" | "scale" | "glow" | "flip" | "slide-up";

  // Image Styling
  imageSize?: "sm" | "md" | "lg" | "xl" | "2xl";
  imageShape?: "circle" | "square" | "rounded" | "rounded-lg";
  imageBorder?: boolean;
  imageBorderColor?: string;
  imageBorderWidth?: "2" | "3" | "4";
  imagePosition?: "top" | "left" | "background" | "side";
  showImageOverlay?: boolean;
  imageOverlayColor?: string;
  imageGrayscale?: boolean;
  imageGrayscaleHover?: boolean;

  // Name & Role Styling
  nameSize?: "sm" | "md" | "lg" | "xl";
  nameColor?: string;
  nameFont?: string;
  nameFontWeight?: "normal" | "medium" | "semibold" | "bold";
  roleSize?: "xs" | "sm" | "md";
  roleColor?: string;
  roleStyle?: "normal" | "badge" | "uppercase";
  showDepartment?: boolean;
  departmentColor?: string;

  // Bio Settings
  showBio?: boolean;
  bioMaxLines?: number;
  bioSize?: "xs" | "sm" | "md";
  bioColor?: string;

  // Social Links
  showSocial?: boolean;
  socialPosition?: "bottom" | "overlay" | "inline" | "hover";
  socialSize?: "sm" | "md" | "lg";
  socialStyle?: "icons" | "buttons" | "pills";
  socialColor?: string;
  socialHoverColor?: string;
  showLinkedIn?: boolean;
  showTwitter?: boolean;
  showInstagram?: boolean;
  showGithub?: boolean;
  showWebsite?: boolean;
  showEmail?: boolean;
  showPhone?: boolean;

  // Skills
  showSkills?: boolean;
  skillStyle?: "tags" | "pills" | "list";
  skillColor?: string;
  skillBackgroundColor?: string;
  maxSkillsShown?: number;

  // Location
  showLocation?: boolean;
  locationIcon?: boolean;
  locationColor?: string;

  // Filtering & Categories
  showFilter?: boolean;
  filterBy?: "department" | "role" | "none";
  filterPosition?: "top" | "sidebar";
  filterStyle?: "pills" | "dropdown" | "tabs";

  // Featured/Leadership
  highlightLeadership?: boolean;
  leadershipLabel?: string;
  featuredScale?: number;

  // Section Sizing
  paddingY?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  paddingX?: "none" | "sm" | "md" | "lg" | "xl";
  gap?: "sm" | "md" | "lg" | "xl";
  sectionGap?: "sm" | "md" | "lg" | "xl";

  // Background
  backgroundStyle?: "solid" | "gradient" | "pattern" | "image";
  backgroundGradientFrom?: string;
  backgroundGradientTo?: string;
  backgroundGradientDirection?:
    | "to-r"
    | "to-l"
    | "to-t"
    | "to-b"
    | "to-br"
    | "to-bl"
    | "to-tr"
    | "to-tl";
  backgroundPattern?: "dots" | "grid" | "lines";
  backgroundPatternOpacity?: number;
  backgroundImage?: string | ImageValue;
  backgroundOverlay?: boolean;
  backgroundOverlayColor?: string;
  backgroundOverlayOpacity?: number;

  // Decorative Elements
  showDecorators?: boolean;
  decoratorStyle?: "dots" | "circles" | "blur";
  decoratorColor?: string;
  decoratorPosition?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "both-sides";

  // Animation
  animateOnScroll?: boolean;
  animationType?:
    | "fade"
    | "slide-up"
    | "slide-left"
    | "slide-right"
    | "scale"
    | "stagger";
  animationDelay?: number;
  staggerDelay?: number;

  // CTA
  showCta?: boolean;
  ctaTitle?: string;
  ctaDescription?: string;
  ctaButtonText?: string;
  ctaButtonLink?: string;
  ctaButtonStyle?: "primary" | "secondary" | "outline";

  // Responsive
  mobileColumns?: 1 | 2;
  hideBioOnMobile?: boolean;
  hideSkillsOnMobile?: boolean;
  compactOnMobile?: boolean;

  // Text colors (legacy support)
  textColor?: string;
  accentColor?: string;

  id?: string;
  className?: string;
}

export function TeamRender({
  // Header Content
  title = "Meet Our Team",
  subtitle,
  description,
  badge,
  badgeIcon,

  // Header Styling
  headerAlign = "center",
  titleSize = "lg",
  titleColor,
  titleFont,
  subtitleColor,
  descriptionColor,
  badgeStyle = "pill",
  badgeColor = "",
  badgeTextColor = "#ffffff",

  // Team Members
  members = [],

  // Layout & Variant
  variant = "cards",
  columns = 4,
  maxWidth = "xl",
  contentAlign = "center",

  // Card Styling
  backgroundColor = "#ffffff",
  cardBackgroundColor = "#f9fafb",
  cardHoverBackgroundColor,
  featuredCardBackground = "",
  cardBorder = false,
  cardBorderColor = "#e5e7eb",
  cardBorderWidth = "1",
  cardBorderRadius = "xl",
  cardShadow = "sm",
  cardHoverShadow = "lg",
  cardPadding = "lg",
  hoverEffect = "lift",

  // Image Styling
  imageSize = "lg",
  imageShape = "circle",
  imageBorder = false,
  imageBorderColor = "",
  imageBorderWidth = "3",
  imagePosition = "top",
  showImageOverlay = false,
  imageOverlayColor = "#000000",
  imageGrayscale = false,
  imageGrayscaleHover = false,

  // Name & Role Styling
  nameSize = "lg",
  nameColor,
  nameFont,
  nameFontWeight = "semibold",
  roleSize = "sm",
  roleColor,
  roleStyle = "normal",
  showDepartment = false,
  departmentColor,

  // Bio Settings
  showBio = false,
  bioMaxLines = 3,
  bioSize = "sm",
  bioColor,

  // Social Links
  showSocial = true,
  socialPosition = "bottom",
  socialSize = "md",
  socialStyle = "icons",
  socialColor = "#9ca3af",
  socialHoverColor = "",
  showLinkedIn = true,
  showTwitter = true,
  showInstagram = false,
  showGithub = false,
  showWebsite = false,
  showEmail = true,
  showPhone = false,

  // Skills
  showSkills = false,
  skillStyle = "tags",
  skillColor = "",
  skillBackgroundColor = "",
  maxSkillsShown = 3,

  // Location
  showLocation = false,
  locationIcon = true,
  locationColor,

  // Filtering & Categories
  showFilter = false,
  filterBy = "department",
  filterPosition: _filterPosition = "top",
  filterStyle: _filterStyle = "pills",

  // Featured/Leadership
  highlightLeadership = false,
  leadershipLabel = "Leadership",
  featuredScale: _featuredScale = 1.05,

  // Section Sizing
  paddingY = "lg",
  paddingX = "md",
  gap = "lg",
  sectionGap = "lg",

  // Background
  backgroundStyle = "solid",
  backgroundGradientFrom = "#ffffff",
  backgroundGradientTo = "#f3f4f6",
  backgroundGradientDirection = "to-b",
  backgroundPattern,
  backgroundPatternOpacity = 0.1,
  backgroundImage,
  backgroundOverlay = false,
  backgroundOverlayColor = "#000000",
  backgroundOverlayOpacity = 0.5,

  // Decorative Elements
  showDecorators = false,
  decoratorStyle = "blur",
  decoratorColor = "",
  decoratorPosition = "both-sides",

  // Animation
  animateOnScroll = false,
  animationType = "fade",
  animationDelay = 0,
  staggerDelay = 100,

  // CTA
  showCta = false,
  ctaTitle = "Join Our Team",
  ctaDescription = "We're always looking for talented individuals to join us.",
  ctaButtonText = "View Openings",
  ctaButtonLink = "/careers",
  ctaButtonStyle = "primary",

  // Responsive
  mobileColumns = 2,
  hideBioOnMobile = true,
  hideSkillsOnMobile = true,
  compactOnMobile = false,

  // Text colors
  textColor,
  accentColor = "",

  id,
  className = "",
}: TeamProps) {
  // Padding classes
  const paddingYClasses = {
    none: "",
    sm: "py-8 md:py-12",
    md: "py-12 md:py-16",
    lg: "py-16 md:py-24",
    xl: "py-20 md:py-32",
    "2xl": "py-24 md:py-40",
  }[paddingY];

  const paddingXClasses = {
    none: "",
    sm: "px-4",
    md: "px-4 md:px-6",
    lg: "px-4 md:px-8",
    xl: "px-4 md:px-12",
  }[paddingX];

  // Max width classes
  const maxWidthClasses = {
    md: "max-w-3xl",
    lg: "max-w-5xl",
    xl: "max-w-7xl",
    "2xl": "max-w-screen-2xl",
    full: "max-w-full",
  }[maxWidth];

  // Column classes — use static lookup so Tailwind JIT can detect them
  const mobileColsClass =
    ({ 1: "grid-cols-1", 2: "grid-cols-2" } as Record<number, string>)[
      mobileColumns
    ] || "grid-cols-1";

  const columnClasses = {
    2: `${mobileColsClass} md:grid-cols-2`,
    3: `${mobileColsClass} md:grid-cols-3`,
    4: `${mobileColsClass} md:grid-cols-2 lg:grid-cols-4`,
    5: `${mobileColsClass} md:grid-cols-3 lg:grid-cols-5`,
    6: `${mobileColsClass} md:grid-cols-3 lg:grid-cols-6`,
  }[columns];

  // Title size classes
  const titleSizeClasses = {
    sm: "text-xl md:text-2xl",
    md: "text-2xl md:text-3xl",
    lg: "text-3xl md:text-4xl lg:text-5xl",
    xl: "text-4xl md:text-5xl lg:text-6xl",
    "2xl": "text-5xl md:text-6xl lg:text-7xl",
  }[titleSize];

  // Image size classes
  const imageSizeClasses = {
    sm: "w-16 h-16 md:w-20 md:h-20",
    md: "w-20 h-20 md:w-24 md:h-24",
    lg: "w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32",
    xl: "w-28 h-28 md:w-32 md:h-32 lg:w-40 lg:h-40",
    "2xl": "w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48",
  }[imageSize];

  // Image shape classes
  const imageShapeClasses = {
    circle: "rounded-full",
    square: "rounded-none",
    rounded: "rounded-lg",
    "rounded-lg": "rounded-xl",
  }[imageShape];

  // Name size classes
  const nameSizeClasses = {
    sm: "text-sm md:text-base",
    md: "text-base md:text-lg",
    lg: "text-lg md:text-xl",
    xl: "text-xl md:text-2xl",
  }[nameSize];

  // Name font weight classes
  const nameFontWeightClasses = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
  }[nameFontWeight];

  // Role size classes
  const roleSizeClasses = {
    xs: "text-xs md:text-sm",
    sm: "text-sm md:text-base",
    md: "text-base md:text-lg",
  }[roleSize];

  // Bio size classes
  const bioSizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
  }[bioSize];

  // Card padding classes
  const cardPaddingClasses = {
    sm: "p-4",
    md: "p-5 md:p-6",
    lg: "p-6 md:p-8",
    xl: "p-8 md:p-10",
  }[cardPadding];

  // Border radius classes
  const borderRadiusClasses = {
    none: "rounded-none",
    sm: "rounded",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    full: "rounded-3xl",
  }[cardBorderRadius];

  // Shadow classes
  const shadowClasses = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
    "2xl": "shadow-2xl",
  }[cardShadow];

  // Hover effect classes
  const hoverEffectClasses = {
    none: "",
    lift: "hover:-translate-y-2 transition-all duration-300",
    scale: "hover:scale-105 transition-transform duration-300",
    glow: "hover:ring-2 hover:ring-offset-2 transition-all duration-300",
    flip: "group [perspective:1000px]",
    "slide-up": "group overflow-hidden",
  }[hoverEffect];

  // Gap classes
  const gapClasses = {
    sm: "gap-4 md:gap-5",
    md: "gap-5 md:gap-6",
    lg: "gap-6 md:gap-8",
    xl: "gap-8 md:gap-10",
  }[gap];

  // Section gap classes
  const sectionGapClasses = {
    sm: "mb-8 md:mb-10",
    md: "mb-10 md:mb-12",
    lg: "mb-12 md:mb-16",
    xl: "mb-16 md:mb-20",
  }[sectionGap];

  // Social size classes
  const socialSizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  }[socialSize];

  // Content alignment
  const contentAlignClasses = {
    left: "text-left items-start",
    center: "text-center items-center",
    right: "text-right items-end",
  }[contentAlign];

  // Badge styles
  const badgeClasses = {
    pill: "px-4 py-1.5 rounded-full text-sm font-medium",
    outlined:
      "px-4 py-1.5 rounded-full text-sm font-medium border-2 bg-transparent",
    solid: "px-4 py-2 rounded-md text-sm font-medium",
    gradient: "px-4 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r",
  }[badgeStyle];

  // Get background style
  const getBackgroundStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = {};

    if (backgroundStyle === "solid") {
      style.backgroundColor = backgroundColor;
    } else if (backgroundStyle === "gradient") {
      const direction = {
        "to-r": "to right",
        "to-l": "to left",
        "to-t": "to top",
        "to-b": "to bottom",
        "to-br": "to bottom right",
        "to-bl": "to bottom left",
        "to-tr": "to top right",
        "to-tl": "to top left",
      }[backgroundGradientDirection];
      style.background = `linear-gradient(${direction}, ${backgroundGradientFrom}, ${backgroundGradientTo})`;
    } else if (backgroundStyle === "image" && backgroundImage) {
      style.backgroundImage = `url(${getImageUrl(backgroundImage)})`;
      style.backgroundSize = "cover";
      style.backgroundPosition = "center";
    }

    return style;
  };

  // Animation classes
  const getAnimationClasses = (index: number) => {
    if (!animateOnScroll) return "";
    const delay = animationDelay + index * staggerDelay;
    const baseClasses = "animate-in duration-500";
    const typeClasses = {
      fade: "fade-in",
      "slide-up": "slide-in-from-bottom-4",
      "slide-left": "slide-in-from-left-4",
      "slide-right": "slide-in-from-right-4",
      scale: "zoom-in-95",
      stagger: "fade-in slide-in-from-bottom-2",
    }[animationType];
    return `${baseClasses} ${typeClasses}`;
  };

  // Render decorators
  const renderDecorators = () => {
    if (!showDecorators) return null;

    const decoratorElement = () => {
      switch (decoratorStyle) {
        case "dots":
          return (
            <div className="grid grid-cols-4 gap-2 w-24 h-24 opacity-20">
              {Array.from({ length: 16 }).map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: decoratorColor }}
                />
              ))}
            </div>
          );
        case "circles":
          return (
            <div className="relative w-40 h-40 opacity-20">
              <div
                className="absolute w-full h-full rounded-full border-4"
                style={{ borderColor: decoratorColor }}
              />
              <div
                className="absolute w-2/3 h-2/3 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-4"
                style={{ borderColor: decoratorColor }}
              />
            </div>
          );
        case "blur":
          return (
            <div
              className="w-64 h-64 rounded-full blur-3xl opacity-30"
              style={{ backgroundColor: decoratorColor }}
            />
          );
        default:
          return null;
      }
    };

    if (decoratorPosition === "both-sides") {
      return (
        <>
          <div className="absolute top-0 left-0 pointer-events-none">
            {decoratorElement()}
          </div>
          <div className="absolute bottom-0 right-0 pointer-events-none">
            {decoratorElement()}
          </div>
        </>
      );
    }

    const positionClasses = {
      "top-left": "top-0 left-0",
      "top-right": "top-0 right-0",
      "bottom-left": "bottom-0 left-0",
      "bottom-right": "bottom-0 right-0",
      "both-sides": "",
    }[decoratorPosition];

    return (
      <div className={`absolute ${positionClasses} pointer-events-none`}>
        {decoratorElement()}
      </div>
    );
  };

  // Render social links
  const renderSocialLinks = (member: TeamMember) => {
    if (!showSocial) return null;

    const links = [];

    if (showLinkedIn && member.linkedin) {
      links.push({
        href: member.linkedin,
        icon: "linkedin",
        label: "LinkedIn",
      });
    }
    if (showTwitter && member.twitter) {
      links.push({ href: member.twitter, icon: "twitter", label: "Twitter" });
    }
    if (showInstagram && member.instagram) {
      links.push({
        href: member.instagram,
        icon: "instagram",
        label: "Instagram",
      });
    }
    if (showGithub && member.github) {
      links.push({ href: member.github, icon: "github", label: "GitHub" });
    }
    if (showWebsite && member.website) {
      links.push({ href: member.website, icon: "website", label: "Website" });
    }
    if (showEmail && member.email) {
      links.push({
        href: `mailto:${member.email}`,
        icon: "email",
        label: "Email",
      });
    }
    if (showPhone && member.phone) {
      links.push({
        href: `tel:${member.phone}`,
        icon: "phone",
        label: "Phone",
      });
    }

    if (links.length === 0) return null;

    const containerClasses =
      socialPosition === "overlay"
        ? "absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
        : socialPosition === "inline"
          ? "inline-flex gap-2 ml-2"
          : "flex gap-3 mt-4";

    const renderIcon = (iconType: string) => {
      switch (iconType) {
        case "linkedin":
          return (
            <svg
              className={socialSizeClasses}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
            </svg>
          );
        case "twitter":
          return (
            <svg
              className={socialSizeClasses}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
            </svg>
          );
        case "email":
          return (
            <svg
              className={socialSizeClasses}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          );
        case "github":
          return (
            <svg
              className={socialSizeClasses}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          );
        case "instagram":
          return (
            <svg
              className={socialSizeClasses}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          );
        default:
          return (
            <svg
              className={socialSizeClasses}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          );
      }
    };

    return (
      <div
        className={`${containerClasses} ${contentAlign === "center" ? "justify-center" : ""}`}
      >
        {links.map((link, i) => (
          <a
            key={i}
            href={link.href}
            target={
              link.icon !== "email" && link.icon !== "phone"
                ? "_blank"
                : undefined
            }
            rel="noopener noreferrer"
            className={`transition-colors duration-200 ${socialStyle === "buttons" ? "p-2 rounded-lg" : socialStyle === "pills" ? "px-3 py-1 rounded-full flex items-center gap-1 text-xs" : ""}`}
            style={{
              color: socialColor,
              backgroundColor:
                socialStyle === "buttons" || socialStyle === "pills"
                  ? `${socialColor}15`
                  : undefined,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = socialHoverColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = socialColor;
            }}
            aria-label={link.label}
          >
            {renderIcon(link.icon)}
            {socialStyle === "pills" && <span>{link.label}</span>}
          </a>
        ))}
      </div>
    );
  };

  // Get filter categories
  const departments = [
    ...new Set(members.map((m) => m.department).filter(Boolean)),
  ];

  // CTA button classes
  const ctaButtonClasses = {
    primary:
      "px-6 py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90",
    secondary:
      "px-6 py-3 rounded-lg font-semibold transition-all hover:opacity-90",
    outline:
      "px-6 py-3 rounded-lg font-semibold border-2 bg-transparent transition-all hover:bg-opacity-10",
  }[ctaButtonStyle];

  const teamBgImageUrl = backgroundStyle === "image" ? getImageUrl(backgroundImage) : undefined;
  const effectivelyDark = isEffectivelyDark(backgroundColor, teamBgImageUrl, backgroundOverlay, backgroundOverlayColor, backgroundOverlayOpacity);
  const resolvedTextColor = resolveContrastColor(textColor, effectivelyDark);

  return (
    <section
      id={id}
      className={`w-full ${paddingYClasses} ${paddingXClasses} relative overflow-hidden ${className}`}
      style={getBackgroundStyle()}
    >
      {/* Background overlay for images */}
      {backgroundStyle === "image" && backgroundOverlay && (
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundColor: backgroundOverlayColor,
            opacity: backgroundOverlayOpacity,
          }}
        />
      )}

      {/* Background pattern */}
      {backgroundPattern && (
        <div
          className="absolute inset-0 z-0"
          style={{ opacity: backgroundPatternOpacity }}
        >
          {backgroundPattern === "dots" && (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle, ${accentColor} 1px, transparent 1px)`,
                backgroundSize: "20px 20px",
              }}
            />
          )}
          {backgroundPattern === "grid" && (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `linear-gradient(${accentColor}20 1px, transparent 1px), linear-gradient(90deg, ${accentColor}20 1px, transparent 1px)`,
                backgroundSize: "40px 40px",
              }}
            />
          )}
        </div>
      )}

      {/* Decorators */}
      {renderDecorators()}

      <div className={`${maxWidthClasses} mx-auto relative z-10`}>
        {/* Header */}
        <div
          className={`${sectionGapClasses} ${headerAlign === "center" ? "text-center" : headerAlign === "right" ? "text-right" : "text-left"}`}
        >
          {/* Badge */}
          {badge && (
            <div
              className={`inline-flex items-center gap-2 mb-4 ${badgeClasses}`}
              style={{
                backgroundColor:
                  badgeStyle !== "outlined" ? badgeColor : "transparent",
                color: badgeStyle === "outlined" ? badgeColor : badgeTextColor,
                borderColor: badgeStyle === "outlined" ? badgeColor : undefined,
              }}
            >
              {badgeIcon && <span>{badgeIcon}</span>}
              {badge}
            </div>
          )}

          {/* Subtitle */}
          {subtitle && (
            <p
              className="text-sm md:text-base font-semibold uppercase tracking-wider mb-2"
              style={{ color: resolveContrastColor(subtitleColor, effectivelyDark) || accentColor }}
            >
              {subtitle}
            </p>
          )}

          {/* Title */}
          <h2
            className={`${titleSizeClasses} font-bold mb-4`}
            style={{
              color: resolveContrastColor(titleColor, effectivelyDark) || resolvedTextColor,
              fontFamily: titleFont || undefined,
            }}
          >
            {title}
          </h2>

          {/* Description */}
          {description && (
            <p
              className={`text-base md:text-lg max-w-2xl ${headerAlign === "center" ? "mx-auto" : ""} opacity-80`}
              style={{ color: resolveContrastColor(descriptionColor, effectivelyDark) || resolvedTextColor }}
            >
              {description}
            </p>
          )}
        </div>

        {/* Filter */}
        {showFilter && departments.length > 0 && (
          <div
            className={`flex flex-wrap gap-2 mb-8 ${headerAlign === "center" ? "justify-center" : ""}`}
          >
            <button
              className="px-4 py-2 text-sm font-medium rounded-full transition-all"
              style={{ backgroundColor: accentColor, color: "#ffffff" }}
            >
              All
            </button>
            {departments.map((dept, i) => (
              <button
                key={i}
                className="px-4 py-2 text-sm font-medium rounded-full transition-all hover:opacity-80"
                style={{
                  backgroundColor: cardBackgroundColor,
                  color: resolvedTextColor,
                }}
              >
                {dept}
              </button>
            ))}
          </div>
        )}

        {/* Team Grid */}
        <div
          className={`grid ${columnClasses} ${gapClasses} ${compactOnMobile ? "gap-3 md:gap-6" : ""}`}
        >
          {members.map((member, i) => (
            <div
              key={i}
              className={`flex flex-col ${contentAlignClasses} ${variant === "cards" ? `${cardPaddingClasses} ${borderRadiusClasses} ${shadowClasses}` : ""} ${hoverEffectClasses} ${getAnimationClasses(i)} ${cardBorder ? "border" : ""} ${member.isFeatured || (highlightLeadership && member.isLeadership) ? "ring-2" : ""} relative group`}
              style={{
                backgroundColor:
                  variant === "cards"
                    ? member.isFeatured
                      ? featuredCardBackground
                      : cardBackgroundColor
                    : undefined,
                borderColor: cardBorder ? cardBorderColor : undefined,
                borderWidth: cardBorder ? `${cardBorderWidth}px` : undefined,
                animationDelay: animateOnScroll
                  ? `${animationDelay + i * staggerDelay}ms`
                  : undefined,
                // @ts-expect-error - Custom CSS property for ring-color
                "--tw-ring-color":
                  member.isFeatured ||
                  (highlightLeadership && member.isLeadership)
                    ? accentColor
                    : undefined,
              }}
            >
              {/* Leadership badge */}
              {highlightLeadership && member.isLeadership && (
                <span
                  className="absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded-full"
                  style={{ backgroundColor: accentColor, color: "#ffffff" }}
                >
                  {leadershipLabel}
                </span>
              )}

              {/* Image */}
              <div
                className={`relative ${imagePosition === "top" ? "mb-4" : ""}`}
              >
                <img
                  src={getImageUrl(member.image) || "/placeholder-avatar.svg"}
                  alt={member.name}
                  className={`${imageSizeClasses} ${imageShapeClasses} object-cover mx-auto ${imageBorder ? "ring-2 ring-offset-2" : ""} ${imageGrayscale ? "grayscale" : ""} ${imageGrayscaleHover ? "grayscale-0 group-hover:grayscale" : imageGrayscale ? "group-hover:grayscale-0" : ""} transition-all duration-300`}
                  style={
                    imageBorder
                      ? ({
                          "--tw-ring-color": imageBorderColor,
                        } as React.CSSProperties)
                      : undefined
                  }
                  loading="lazy"
                />
                {showImageOverlay && (
                  <div
                    className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-40 transition-opacity duration-300"
                    style={{ backgroundColor: imageOverlayColor }}
                  />
                )}
                {/* Social links on overlay */}
                {socialPosition === "overlay" && renderSocialLinks(member)}
              </div>

              {/* Name */}
              <h3
                className={`${nameSizeClasses} ${nameFontWeightClasses} mb-1`}
                style={{
                  color: nameColor || resolvedTextColor,
                  fontFamily: nameFont || undefined,
                }}
              >
                {member.name}
              </h3>

              {/* Role */}
              <p
                className={`${roleSizeClasses} ${roleStyle === "uppercase" ? "uppercase tracking-wider" : ""} ${roleStyle === "badge" ? "px-2 py-0.5 rounded-full" : ""} opacity-75 mb-1`}
                style={{
                  color: roleColor || resolvedTextColor,
                  backgroundColor:
                    roleStyle === "badge" ? `${accentColor}20` : undefined,
                }}
              >
                {member.role}
              </p>

              {/* Department */}
              {showDepartment && member.department && (
                <p
                  className="text-xs opacity-60 mb-2"
                  style={{ color: departmentColor || resolvedTextColor }}
                >
                  {member.department}
                </p>
              )}

              {/* Location */}
              {showLocation && member.location && (
                <p
                  className="text-xs opacity-60 mb-2 flex items-center gap-1"
                  style={{ color: locationColor || resolvedTextColor }}
                >
                  {locationIcon && (
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                  {member.location}
                </p>
              )}

              {/* Bio */}
              {showBio && member.bio && (
                <p
                  className={`${bioSizeClasses} opacity-60 mb-3 ${hideBioOnMobile ? "hidden md:block" : ""}`}
                  style={{
                    color: bioColor || textColor,
                    WebkitLineClamp: bioMaxLines,
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {member.bio}
                </p>
              )}

              {/* Skills */}
              {showSkills && member.skills && member.skills.length > 0 && (
                <div
                  className={`flex flex-wrap gap-1 mb-3 ${contentAlign === "center" ? "justify-center" : ""} ${hideSkillsOnMobile ? "hidden md:flex" : ""}`}
                >
                  {member.skills.slice(0, maxSkillsShown).map((skill, si) => (
                    <span
                      key={si}
                      className={`text-xs px-2 py-0.5 ${skillStyle === "pills" ? "rounded-full" : skillStyle === "tags" ? "rounded" : ""}`}
                      style={{
                        color: skillColor,
                        backgroundColor: skillBackgroundColor,
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                  {member.skills.length > maxSkillsShown && (
                    <span
                      className="text-xs opacity-60"
                      style={{ color: resolvedTextColor }}
                    >
                      +{member.skills.length - maxSkillsShown}
                    </span>
                  )}
                </div>
              )}

              {/* Social links - bottom/inline */}
              {socialPosition !== "overlay" && renderSocialLinks(member)}
            </div>
          ))}
        </div>

        {/* CTA */}
        {showCta && (
          <div
            className="mt-12 md:mt-16 text-center p-8 md:p-12 rounded-2xl"
            style={{ backgroundColor: cardBackgroundColor }}
          >
            <h3
              className="text-xl md:text-2xl font-bold mb-2"
              style={{ color: resolvedTextColor }}
            >
              {ctaTitle}
            </h3>
            <p
              className="text-base opacity-80 mb-6 max-w-lg mx-auto"
              style={{ color: resolvedTextColor }}
            >
              {ctaDescription}
            </p>
            <a
              href={ctaButtonLink}
              className={ctaButtonClasses}
              style={{
                backgroundColor:
                  ctaButtonStyle === "primary"
                    ? accentColor
                    : ctaButtonStyle === "secondary"
                      ? cardBackgroundColor
                      : "transparent",
                borderColor:
                  ctaButtonStyle === "outline" ? accentColor : undefined,
                color:
                  ctaButtonStyle === "outline"
                    ? accentColor
                    : ctaButtonStyle === "secondary"
                      ? resolvedTextColor
                      : "#ffffff",
              }}
            >
              {ctaButtonText}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================================
// GALLERY - Image Gallery
// ============================================================================

export interface GalleryImage {
  src?: string | ImageValue;
  alt?: string;
  caption?: string;
  title?: string;
  category?: string;
  link?: string;
  linkTarget?: "_self" | "_blank";
}

export interface GalleryProps {
  // Header Content
  title?: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  badgeIcon?: string;

  // Header Styling
  headerAlign?: "left" | "center" | "right";
  titleSize?: "sm" | "md" | "lg" | "xl" | "2xl";
  titleColor?: string;
  titleFont?: string;
  subtitleColor?: string;
  descriptionColor?: string;
  badgeStyle?: "pill" | "outlined" | "solid" | "gradient";
  badgeColor?: string;
  badgeTextColor?: string;

  // Images
  images?: GalleryImage[];

  // Layout & Variant
  variant?:
    | "grid"
    | "masonry"
    | "carousel"
    | "justified"
    | "spotlight"
    | "collage"
    | "pinterest"
    | "slider";
  columns?: 2 | 3 | 4 | 5 | 6;
  maxWidth?: "md" | "lg" | "xl" | "2xl" | "full";

  // Image Styling
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  aspectRatio?: "square" | "video" | "portrait" | "wide" | "auto";
  borderRadius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  imageBorder?: boolean;
  imageBorderColor?: string;
  imageBorderWidth?: "1" | "2" | "3";
  imageShadow?: "none" | "sm" | "md" | "lg" | "xl";

  // Hover Effects
  hoverEffect?:
    | "none"
    | "zoom"
    | "zoom-out"
    | "overlay"
    | "slide-up"
    | "blur"
    | "grayscale"
    | "brightness"
    | "tilt";
  hoverOverlayColor?: string;
  hoverOverlayOpacity?: number;
  hoverScale?: number;
  showCaptionOnHover?: boolean;
  showTitleOnHover?: boolean;

  // Caption/Title Display
  showCaption?: boolean;
  captionPosition?: "overlay" | "below" | "above";
  captionAlign?: "left" | "center" | "right";
  captionSize?: "xs" | "sm" | "md";
  captionColor?: string;
  captionBackgroundColor?: string;
  showTitle?: boolean;
  titlePosition?: "overlay" | "below";
  imagesTitleSize?: "sm" | "md" | "lg";
  imagesTitleColor?: string;

  // Lightbox
  lightbox?: boolean;
  lightboxStyle?: "default" | "fullscreen" | "minimal";
  lightboxBackground?: string;
  showLightboxCaption?: boolean;
  showLightboxCounter?: boolean;
  enableLightboxZoom?: boolean;

  // Filtering
  showFilter?: boolean;
  filterPosition?: "top" | "sidebar";
  filterStyle?: "pills" | "dropdown" | "tabs" | "buttons";
  filterAlign?: "left" | "center" | "right";
  filterActiveColor?: string;
  filterInactiveColor?: string;

  // Load More / Pagination
  enableLoadMore?: boolean;
  loadMoreStyle?: "button" | "infinite" | "pagination";
  initialCount?: number;
  loadMoreCount?: number;
  loadMoreText?: string;
  loadingAnimation?: boolean;

  // Section Sizing
  paddingY?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  paddingX?: "none" | "sm" | "md" | "lg" | "xl";
  sectionGap?: "sm" | "md" | "lg" | "xl";

  // Background
  backgroundColor?: string;
  backgroundStyle?: "solid" | "gradient" | "pattern" | "image";
  backgroundGradientFrom?: string;
  backgroundGradientTo?: string;
  backgroundGradientDirection?:
    | "to-r"
    | "to-l"
    | "to-t"
    | "to-b"
    | "to-br"
    | "to-bl";
  backgroundPattern?: "dots" | "grid" | "lines";
  backgroundPatternOpacity?: number;
  backgroundImage?: string | ImageValue;
  backgroundOverlay?: boolean;
  backgroundOverlayColor?: string;
  backgroundOverlayOpacity?: number;

  // Decorative
  showDecorators?: boolean;
  decoratorStyle?: "dots" | "circles" | "blur";
  decoratorColor?: string;
  decoratorPosition?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "both-sides";

  // Animation
  animateOnScroll?: boolean;
  animationType?: "fade" | "slide-up" | "scale" | "stagger" | "flip";
  animationDelay?: number;
  staggerDelay?: number;

  // CTA
  showCta?: boolean;
  ctaTitle?: string;
  ctaDescription?: string;
  ctaButtonText?: string;
  ctaButtonLink?: string;
  ctaButtonStyle?: "primary" | "secondary" | "outline";

  // Responsive
  mobileColumns?: 1 | 2;
  tabletColumns?: 2 | 3;
  hideFilterOnMobile?: boolean;
  compactOnMobile?: boolean;

  // Colors
  textColor?: string;
  accentColor?: string;

  // Mixed media (Phase 5)
  items?: Array<{
    type?: "image" | "video";
    image?: string | ImageValue;
    videoSrc?: string;
    alt?: string;
    title?: string;
    caption?: string;
    category?: string;
    link?: string;
    linkTarget?: string;
  }>;

  // Virtualisation (Phase 5)
  virtualise?: boolean;

  // Infinite scroll (Phase 5)
  infiniteScroll?: boolean;

  id?: string;
  className?: string;
}

export function GalleryRender({
  // Header Content
  title,
  subtitle,
  description,
  badge,
  badgeIcon,

  // Header Styling
  headerAlign = "center",
  titleSize = "lg",
  titleColor,
  titleFont,
  subtitleColor,
  descriptionColor,
  badgeStyle = "pill",
  badgeColor = "",
  badgeTextColor = "#ffffff",

  // Images
  images = [],

  // Layout & Variant
  variant = "grid",
  columns = 3,
  maxWidth = "xl",

  // Image Styling
  gap = "md",
  aspectRatio = "square",
  borderRadius = "lg",
  imageBorder = false,
  imageBorderColor = "#e5e7eb",
  imageBorderWidth = "1",
  imageShadow = "none",

  // Hover Effects
  hoverEffect = "zoom",
  hoverOverlayColor = "#000000",
  hoverOverlayOpacity = 0.5,
  hoverScale = 1.05,
  showCaptionOnHover = true,
  showTitleOnHover = false,

  // Caption/Title Display
  showCaption = true,
  captionPosition = "overlay",
  captionAlign = "center",
  captionSize = "sm",
  captionColor = "#ffffff",
  captionBackgroundColor = "transparent",
  showTitle = false,
  titlePosition = "overlay",
  imagesTitleSize = "md",
  imagesTitleColor = "#ffffff",

  // Lightbox
  lightbox = false,
  lightboxStyle: _lightboxStyle = "default",
  lightboxBackground: _lightboxBackground = "#000000",
  showLightboxCaption: _showLightboxCaption = true,
  showLightboxCounter: _showLightboxCounter = true,
  enableLightboxZoom: _enableLightboxZoom = true,

  // Filtering
  showFilter = false,
  filterPosition: _filterPosition = "top",
  filterStyle = "pills",
  filterAlign = "center",
  filterActiveColor,
  filterInactiveColor,

  // Load More
  enableLoadMore = false,
  loadMoreStyle = "button",
  initialCount = 6,
  loadMoreCount = 6,
  loadMoreText = "Load More",
  loadingAnimation: _loadingAnimation = true,

  // Section Sizing
  paddingY = "lg",
  paddingX = "md",
  sectionGap = "lg",

  // Background
  backgroundColor,
  backgroundStyle = "solid",
  backgroundGradientFrom,
  backgroundGradientTo,
  backgroundGradientDirection = "to-b",
  backgroundPattern,
  backgroundPatternOpacity = 0.1,
  backgroundImage,
  backgroundOverlay = false,
  backgroundOverlayColor = "#000000",
  backgroundOverlayOpacity = 0.5,

  // Decorative
  showDecorators = false,
  decoratorStyle = "blur",
  decoratorColor = "",
  decoratorPosition = "both-sides",

  // Animation
  animateOnScroll = false,
  animationType = "fade",
  animationDelay = 0,
  staggerDelay = 100,

  // CTA
  showCta = false,
  ctaTitle = "Want to See More?",
  ctaDescription = "Explore our full collection.",
  ctaButtonText = "View All",
  ctaButtonLink = "/gallery",
  ctaButtonStyle = "primary",

  // Responsive
  mobileColumns = 2,
  tabletColumns: _tabletColumns = 2,
  hideFilterOnMobile = false,
  compactOnMobile = false,

  // Colors
  textColor,
  accentColor = "",

  // Mixed media (Phase 5)
  items,

  // Virtualisation (Phase 5)
  virtualise = false,

  // Infinite scroll (Phase 5)
  infiniteScroll = false,

  id,
  className = "",
}: GalleryProps) {
  // Merge items (mixed media) with legacy images array
  const mergedImages = React.useMemo(() => {
    if (items && items.length > 0) {
      return items.map((item) => ({
        src: item.image,
        alt: item.alt,
        title: item.title,
        caption: item.caption,
        category: item.category,
        link: item.link,
        linkTarget: item.linkTarget,
        _type: item.type || ("image" as const),
        _videoSrc: item.videoSrc,
      }));
    }
    return images.map((img) => ({
      ...img,
      _type: "image" as const,
      _videoSrc: undefined,
    }));
  }, [items, images]);

  // State for filtering and load more
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    null,
  );
  const [visibleCount, setVisibleCount] = React.useState(
    enableLoadMore ? initialCount : mergedImages.length,
  );

  // Virtual scroll: IntersectionObserver for galleries > 50 items
  const [visibleRange, setVisibleRange] = React.useState({
    start: 0,
    end: virtualise ? 20 : Infinity,
  });
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!virtualise || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleRange((prev) => ({
            ...prev,
            end: Math.min(prev.end + 20, mergedImages.length),
          }));
        }
      },
      { rootMargin: "200px" },
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [virtualise, mergedImages.length]);

  // Infinite scroll effect
  React.useEffect(() => {
    if (!infiniteScroll || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) =>
            Math.min(prev + loadMoreCount, filteredImages.length),
          );
        }
      },
      { rootMargin: "200px" },
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [infiniteScroll]);

  // Get unique categories
  const categories = [
    ...new Set(mergedImages.map((img) => img.category).filter(Boolean)),
  ] as string[];

  // Filter images
  const filteredImages = selectedCategory
    ? mergedImages.filter((img) => img.category === selectedCategory)
    : mergedImages;

  // Visible images based on load more + virtualisation
  const displayImages = (() => {
    let result = enableLoadMore
      ? filteredImages.slice(0, visibleCount)
      : filteredImages;
    if (virtualise) {
      result = result.slice(visibleRange.start, visibleRange.end);
    }
    return result;
  })();

  // Padding classes
  const paddingYClasses = {
    none: "",
    sm: "py-8 md:py-12",
    md: "py-12 md:py-16",
    lg: "py-16 md:py-24",
    xl: "py-20 md:py-32",
    "2xl": "py-24 md:py-40",
  }[paddingY];

  const paddingXClasses = {
    none: "",
    sm: "px-4",
    md: "px-4 md:px-6",
    lg: "px-4 md:px-8",
    xl: "px-4 md:px-12",
  }[paddingX];

  // Max width classes
  const maxWidthClasses = {
    md: "max-w-3xl",
    lg: "max-w-5xl",
    xl: "max-w-7xl",
    "2xl": "max-w-screen-2xl",
    full: "max-w-full",
  }[maxWidth];

  // Column classes — use static lookup so Tailwind JIT can detect them
  const mobileColsClass =
    ({ 1: "grid-cols-1", 2: "grid-cols-2" } as Record<number, string>)[
      mobileColumns
    ] || "grid-cols-1";

  const columnClasses = {
    2: `${mobileColsClass} md:grid-cols-2`,
    3: `${mobileColsClass} md:grid-cols-3`,
    4: `${mobileColsClass} md:grid-cols-2 lg:grid-cols-4`,
    5: `${mobileColsClass} md:grid-cols-3 lg:grid-cols-5`,
    6: `${mobileColsClass} md:grid-cols-3 lg:grid-cols-6`,
  }[columns];

  // Title size classes
  const titleSizeClasses = {
    sm: "text-xl md:text-2xl",
    md: "text-2xl md:text-3xl",
    lg: "text-3xl md:text-4xl lg:text-5xl",
    xl: "text-4xl md:text-5xl lg:text-6xl",
    "2xl": "text-5xl md:text-6xl lg:text-7xl",
  }[titleSize];

  // Gap classes
  const gapClasses = {
    none: "gap-0",
    xs: "gap-1",
    sm: "gap-2 md:gap-3",
    md: "gap-3 md:gap-4",
    lg: "gap-4 md:gap-6",
    xl: "gap-6 md:gap-8",
  }[gap];

  // Aspect ratio classes
  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[3/4]",
    wide: "aspect-[16/9]",
    auto: "",
  }[aspectRatio];

  // Border radius classes
  const radiusClasses = {
    none: "rounded-none",
    sm: "rounded",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
  }[borderRadius];

  // Shadow classes
  const shadowClasses = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
  }[imageShadow];

  // Section gap
  const sectionGapClasses = {
    sm: "mb-8 md:mb-10",
    md: "mb-10 md:mb-12",
    lg: "mb-12 md:mb-16",
    xl: "mb-16 md:mb-20",
  }[sectionGap];

  // Caption size classes
  const captionSizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
  }[captionSize];

  // Image title size classes
  const imagesTitleSizeClasses = {
    sm: "text-sm md:text-base",
    md: "text-base md:text-lg",
    lg: "text-lg md:text-xl",
  }[imagesTitleSize];

  // Badge styles
  const badgeClasses = {
    pill: "px-4 py-1.5 rounded-full text-sm font-medium",
    outlined:
      "px-4 py-1.5 rounded-full text-sm font-medium border-2 bg-transparent",
    solid: "px-4 py-2 rounded-md text-sm font-medium",
    gradient: "px-4 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r",
  }[badgeStyle];

  // Hover effect classes
  const getHoverEffectClasses = () => {
    switch (hoverEffect) {
      case "zoom":
        return "group-hover:scale-105 transition-transform duration-300";
      case "zoom-out":
        return "scale-110 group-hover:scale-100 transition-transform duration-300";
      case "grayscale":
        return "grayscale group-hover:grayscale-0 transition-all duration-300";
      case "brightness":
        return "brightness-90 group-hover:brightness-110 transition-all duration-300";
      case "blur":
        return "group-hover:blur-sm transition-all duration-300";
      default:
        return "";
    }
  };

  // Get background style
  const getBackgroundStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = {};

    if (backgroundStyle === "solid") {
      style.backgroundColor =
        backgroundColor || "var(--color-background, #ffffff)";
    } else if (backgroundStyle === "gradient") {
      const direction = {
        "to-r": "to right",
        "to-l": "to left",
        "to-t": "to top",
        "to-b": "to bottom",
        "to-br": "to bottom right",
        "to-bl": "to bottom left",
      }[backgroundGradientDirection];
      const from = backgroundGradientFrom || "var(--color-background, #ffffff)";
      const to = backgroundGradientTo || "var(--color-muted, #f3f4f6)";
      style.background = `linear-gradient(${direction}, ${from}, ${to})`;
    } else if (backgroundStyle === "image" && backgroundImage) {
      style.backgroundImage = `url(${getImageUrl(backgroundImage)})`;
      style.backgroundSize = "cover";
      style.backgroundPosition = "center";
    }

    return style;
  };

  // Animation classes
  const getAnimationClasses = (index: number) => {
    if (!animateOnScroll) return "";
    const baseClasses = "animate-in duration-500";
    const typeClasses = {
      fade: "fade-in",
      "slide-up": "slide-in-from-bottom-4",
      scale: "zoom-in-95",
      stagger: "fade-in slide-in-from-bottom-2",
      flip: "fade-in",
    }[animationType];
    return `${baseClasses} ${typeClasses}`;
  };

  // Render decorators
  const renderDecorators = () => {
    if (!showDecorators) return null;

    const decoratorElement = () => {
      switch (decoratorStyle) {
        case "dots":
          return (
            <div className="grid grid-cols-4 gap-2 w-24 h-24 opacity-20">
              {Array.from({ length: 16 }).map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: decoratorColor }}
                />
              ))}
            </div>
          );
        case "circles":
          return (
            <div className="relative w-40 h-40 opacity-20">
              <div
                className="absolute w-full h-full rounded-full border-4"
                style={{ borderColor: decoratorColor }}
              />
              <div
                className="absolute w-2/3 h-2/3 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-4"
                style={{ borderColor: decoratorColor }}
              />
            </div>
          );
        case "blur":
          return (
            <div
              className="w-64 h-64 rounded-full blur-3xl opacity-30"
              style={{ backgroundColor: decoratorColor }}
            />
          );
        default:
          return null;
      }
    };

    if (decoratorPosition === "both-sides") {
      return (
        <>
          <div className="absolute top-0 left-0 pointer-events-none">
            {decoratorElement()}
          </div>
          <div className="absolute bottom-0 right-0 pointer-events-none">
            {decoratorElement()}
          </div>
        </>
      );
    }

    const positionClasses = {
      "top-left": "top-0 left-0",
      "top-right": "top-0 right-0",
      "bottom-left": "bottom-0 left-0",
      "bottom-right": "bottom-0 right-0",
      "both-sides": "",
    }[decoratorPosition];

    return (
      <div className={`absolute ${positionClasses} pointer-events-none`}>
        {decoratorElement()}
      </div>
    );
  };

  // CTA button classes
  const ctaButtonClasses = {
    primary:
      "px-6 py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90",
    secondary:
      "px-6 py-3 rounded-lg font-semibold transition-all hover:opacity-90",
    outline:
      "px-6 py-3 rounded-lg font-semibold border-2 bg-transparent transition-all hover:bg-opacity-10",
  }[ctaButtonStyle];

  // Filter alignment
  const filterAlignClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  }[filterAlign];

  const galleryBgImageUrl = backgroundStyle === "image" ? getImageUrl(backgroundImage) : undefined;
  const effectivelyDark = isEffectivelyDark(backgroundColor, galleryBgImageUrl, backgroundOverlay, backgroundOverlayColor, backgroundOverlayOpacity);
  const resolvedTextColor = resolveContrastColor(textColor, effectivelyDark);

  return (
    <section
      id={id}
      className={`w-full ${paddingYClasses} ${paddingXClasses} relative overflow-hidden ${className}`}
      style={getBackgroundStyle()}
    >
      {/* Background overlay for images */}
      {backgroundStyle === "image" && backgroundOverlay && (
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundColor: backgroundOverlayColor,
            opacity: backgroundOverlayOpacity,
          }}
        />
      )}

      {/* Background pattern */}
      {backgroundPattern && (
        <div
          className="absolute inset-0 z-0"
          style={{ opacity: backgroundPatternOpacity }}
        >
          {backgroundPattern === "dots" && (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle, ${accentColor} 1px, transparent 1px)`,
                backgroundSize: "20px 20px",
              }}
            />
          )}
          {backgroundPattern === "grid" && (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `linear-gradient(${accentColor}20 1px, transparent 1px), linear-gradient(90deg, ${accentColor}20 1px, transparent 1px)`,
                backgroundSize: "40px 40px",
              }}
            />
          )}
        </div>
      )}

      {/* Decorators */}
      {renderDecorators()}

      <div className={`${maxWidthClasses} mx-auto relative z-10`}>
        {/* Header */}
        {(title || subtitle || description || badge) && (
          <div
            className={`${sectionGapClasses} ${headerAlign === "center" ? "text-center" : headerAlign === "right" ? "text-right" : "text-left"}`}
          >
            {/* Badge */}
            {badge && (
              <div
                className={`inline-flex items-center gap-2 mb-4 ${badgeClasses}`}
                style={{
                  backgroundColor:
                    badgeStyle !== "outlined" ? badgeColor : "transparent",
                  color:
                    badgeStyle === "outlined" ? badgeColor : badgeTextColor,
                  borderColor:
                    badgeStyle === "outlined" ? badgeColor : undefined,
                }}
              >
                {badgeIcon && <span>{badgeIcon}</span>}
                {badge}
              </div>
            )}

            {/* Subtitle */}
            {subtitle && (
              <p
                className="text-sm md:text-base font-semibold uppercase tracking-wider mb-2"
                style={{ color: resolveContrastColor(subtitleColor, effectivelyDark) || accentColor }}
              >
                {subtitle}
              </p>
            )}

            {/* Title */}
            {title && (
              <h2
                className={`${titleSizeClasses} font-bold mb-4`}
                style={{
                  color: resolveContrastColor(titleColor, effectivelyDark) || resolvedTextColor,
                  fontFamily: titleFont || undefined,
                }}
              >
                {title}
              </h2>
            )}

            {/* Description */}
            {description && (
              <p
                className={`text-base md:text-lg max-w-2xl ${headerAlign === "center" ? "mx-auto" : ""} opacity-80`}
                style={{ color: resolveContrastColor(descriptionColor, effectivelyDark) || resolvedTextColor }}
              >
                {description}
              </p>
            )}
          </div>
        )}

        {/* Filter */}
        {showFilter && categories.length > 0 && (
          <div
            className={`flex flex-wrap gap-2 mb-8 ${filterAlignClasses} ${hideFilterOnMobile ? "hidden md:flex" : ""}`}
          >
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${filterStyle === "pills" ? "" : filterStyle === "buttons" ? "rounded-md" : "rounded-lg"}`}
              style={{
                backgroundColor:
                  selectedCategory === null
                    ? filterActiveColor || accentColor
                    : "transparent",
                color:
                  selectedCategory === null
                    ? "#ffffff"
                    : filterInactiveColor || textColor,
                border:
                  selectedCategory === null
                    ? "none"
                    : `1px solid ${filterInactiveColor || "#e5e7eb"}`,
              }}
            >
              All
            </button>
            {categories.map((cat, i) => (
              <button
                key={i}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${filterStyle === "pills" ? "" : filterStyle === "buttons" ? "rounded-md" : "rounded-lg"}`}
                style={{
                  backgroundColor:
                    selectedCategory === cat
                      ? filterActiveColor || accentColor
                      : "transparent",
                  color:
                    selectedCategory === cat
                      ? "#ffffff"
                      : filterInactiveColor || textColor,
                  border:
                    selectedCategory === cat
                      ? "none"
                      : `1px solid ${filterInactiveColor || "#e5e7eb"}`,
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Gallery Grid */}
        <div
          className={`grid ${columnClasses} ${gapClasses} ${compactOnMobile ? "gap-2 md:gap-4" : ""}`}
        >
          {displayImages.map((image, i) => {
            const imageSrc = getImageUrl(image.src);
            const isVideo =
              (image as any)._type === "video" && (image as any)._videoSrc;
            return (
              <div
                key={i}
                className={`relative overflow-hidden ${radiusClasses} ${shadowClasses} group cursor-pointer ${getAnimationClasses(i)} ${imageBorder ? "border" : ""}`}
                style={{
                  borderColor: imageBorder ? imageBorderColor : undefined,
                  borderWidth: imageBorder
                    ? `${imageBorderWidth}px`
                    : undefined,
                  animationDelay: animateOnScroll
                    ? `${animationDelay + i * staggerDelay}ms`
                    : undefined,
                }}
              >
                {isVideo ? (
                  <video
                    src={(image as any)._videoSrc}
                    poster={imageSrc || undefined}
                    className={`w-full h-full object-cover ${aspectClasses} ${getHoverEffectClasses()}`}
                    muted
                    loop
                    playsInline
                    onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                    onMouseLeave={(e) => {
                      const v = e.target as HTMLVideoElement;
                      v.pause();
                      v.currentTime = 0;
                    }}
                  />
                ) : (
                  <img
                    src={imageSrc || "/placeholder.svg"}
                    alt={image.alt || `Gallery image ${i + 1}`}
                    className={`w-full h-full object-cover ${aspectClasses} ${getHoverEffectClasses()}`}
                    loading="lazy"
                  />
                )}

                {/* Overlay on hover */}
                {(hoverEffect === "overlay" ||
                  showCaptionOnHover ||
                  showTitleOnHover) && (
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center"
                    style={{
                      backgroundColor: `${hoverOverlayColor}${Math.round(
                        hoverOverlayOpacity * 255,
                      )
                        .toString(16)
                        .padStart(2, "0")}`,
                    }}
                  >
                    {showTitleOnHover && image.title && (
                      <h3
                        className={`${imagesTitleSizeClasses} font-bold mb-2`}
                        style={{ color: imagesTitleColor }}
                      >
                        {image.title}
                      </h3>
                    )}
                    {showCaptionOnHover && image.caption && (
                      <p
                        className={`${captionSizeClasses} px-4 ${captionAlign === "center" ? "text-center" : ""}`}
                        style={{ color: captionColor }}
                      >
                        {image.caption}
                      </p>
                    )}
                  </div>
                )}

                {/* Caption below */}
                {showCaption &&
                  captionPosition === "below" &&
                  image.caption && (
                    <div
                      className={`py-3 px-2 ${captionAlign === "center" ? "text-center" : captionAlign === "right" ? "text-right" : "text-left"}`}
                      style={{ backgroundColor: captionBackgroundColor }}
                    >
                      <p
                        className={captionSizeClasses}
                        style={{ color: captionColor }}
                      >
                        {image.caption}
                      </p>
                    </div>
                  )}

                {/* Title below */}
                {showTitle && titlePosition === "below" && image.title && (
                  <div className="py-3 px-2">
                    <h3
                      className={`${imagesTitleSizeClasses} font-semibold`}
                      style={{ color: imagesTitleColor }}
                    >
                      {image.title}
                    </h3>
                  </div>
                )}

                {/* Link */}
                {image.link && (
                  <a
                    href={image.link}
                    target={image.linkTarget || "_self"}
                    className="absolute inset-0"
                    aria-label={image.alt || "View image"}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Virtual scroll / Infinite scroll sentinel */}
        {(virtualise || infiniteScroll) && (
          <div ref={sentinelRef} className="h-4" aria-hidden="true" />
        )}

        {/* Load More */}
        {enableLoadMore &&
          loadMoreStyle === "button" &&
          visibleCount < filteredImages.length && (
            <div className="mt-8 md:mt-12 text-center">
              <button
                onClick={() => setVisibleCount((prev) => prev + loadMoreCount)}
                className="px-8 py-3 rounded-lg font-semibold transition-all hover:opacity-90"
                style={{ backgroundColor: accentColor, color: "#ffffff" }}
              >
                {loadMoreText}
              </button>
            </div>
          )}

        {/* Pagination */}
        {enableLoadMore && loadMoreStyle === "pagination" && (
          <div className="mt-8 md:mt-12 flex justify-center gap-2">
            {Array.from({
              length: Math.ceil(filteredImages.length / loadMoreCount),
            }).map((_, i) => (
              <button
                key={i}
                onClick={() => setVisibleCount((i + 1) * loadMoreCount)}
                className={`w-10 h-10 rounded-full font-medium transition-all ${visibleCount >= (i + 1) * loadMoreCount ? "opacity-100" : "opacity-50"}`}
                style={{ backgroundColor: accentColor, color: "#ffffff" }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}

        {/* CTA */}
        {showCta && (
          <div
            className="mt-12 md:mt-16 text-center p-8 md:p-12 rounded-2xl"
            style={{ backgroundColor: `${accentColor}10` }}
          >
            <h3
              className="text-xl md:text-2xl font-bold mb-2"
              style={{ color: resolvedTextColor }}
            >
              {ctaTitle}
            </h3>
            <p
              className="text-base opacity-80 mb-6 max-w-lg mx-auto"
              style={{ color: resolvedTextColor }}
            >
              {ctaDescription}
            </p>
            <a
              href={ctaButtonLink}
              className={ctaButtonClasses}
              style={{
                backgroundColor:
                  ctaButtonStyle === "primary"
                    ? accentColor
                    : ctaButtonStyle === "secondary"
                      ? `${accentColor}20`
                      : "transparent",
                borderColor:
                  ctaButtonStyle === "outline" ? accentColor : undefined,
                color:
                  ctaButtonStyle === "outline"
                    ? accentColor
                    : ctaButtonStyle === "secondary"
                      ? resolvedTextColor
                      : "#ffffff",
              }}
            >
              {ctaButtonText}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
// ============================================================================
// NAVBAR - Professional Navigation (Wix Studio Style)
// ============================================================================

export interface NavbarProps {
  // Logo
  logo?: string | ImageValue;
  logoText?: string;
  logoLink?: string;
  logoHeight?: number;
  logoPosition?: "left" | "center";

  // Navigation Links
  links?: Array<{
    label?: string;
    text?: string;
    href?: string;
    target?: "_self" | "_blank";
    icon?: string;
    hasDropdown?: boolean;
    dropdownLinks?: Array<{
      label?: string;
      href?: string;
      description?: string;
    }>;
  }>;
  linkAlignment?: "left" | "center" | "right";
  linkSpacing?: "compact" | "normal" | "wide" | "sm" | "md" | "lg";
  linkFontSize?: "sm" | "md" | "lg";
  linkFontWeight?: "normal" | "medium" | "semibold" | "bold";
  linkTextTransform?: "none" | "uppercase" | "capitalize";
  linkHoverEffect?: "none" | "opacity" | "underline" | "color" | "background";
  linkActiveIndicator?: "none" | "underline" | "dot" | "background";

  // Backwards compat aliases (old render names)
  linkSize?: "sm" | "md" | "lg";
  linkWeight?: "normal" | "medium" | "semibold" | "bold";
  linkHoverStyle?: "opacity" | "underline" | "color";

  // Primary CTA
  ctaText?: string;
  ctaLink?: string;
  ctaStyle?: "solid" | "outline" | "ghost" | "gradient";
  ctaColor?: string;
  ctaTextColor?: string;
  ctaSize?: "sm" | "md" | "lg";
  ctaBorderRadius?: "none" | "sm" | "md" | "lg" | "full";
  ctaIcon?: "none" | "arrow" | "chevron";

  // Backwards compat aliases
  ctaVariant?: "solid" | "outline" | "ghost";
  ctaRadius?: "none" | "sm" | "md" | "lg" | "full";
  showCtaOnMobile?: boolean;

  // Secondary CTA
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  secondaryCtaStyle?: "solid" | "outline" | "ghost" | "text";
  secondaryCtaVariant?: "solid" | "outline" | "ghost";

  // Layout
  layout?: "standard" | "centered" | "split" | "minimal";
  maxWidth?: "full" | "7xl" | "6xl" | "5xl" | "container" | "narrow";
  height?: "sm" | "md" | "lg" | "xl";
  paddingX?: "sm" | "md" | "lg" | "xl";

  // Appearance
  backgroundColor?: string;
  backgroundOpacity?: number;
  textColor?: string;
  borderBottom?: boolean;
  borderColor?: string;
  borderWidth?: number;
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
  glassEffect?: boolean;
  glassBlur?: number;

  // Position & Behavior
  position?: "relative" | "sticky" | "absolute" | "fixed";
  sticky?: boolean; // backwards compat
  stickyOffset?: number;
  transparent?: boolean;
  hideOnScroll?: boolean;
  showOnScrollUp?: boolean;
  transparentUntilScroll?: boolean;
  scrollThreshold?: number;
  blurBackground?: boolean;

  // Mobile Menu
  mobileBreakpoint?: "sm" | "md" | "lg";
  mobileMenuStyle?: "fullscreen" | "slideRight" | "slideLeft" | "dropdown";
  mobileMenuPosition?: "left" | "right" | "full"; // backwards compat
  mobileMenuBackground?: string;
  mobileMenuTextColor?: string;
  mobileMenuAnimation?: "slide" | "fade" | "scale" | "none";
  mobileMenuDuration?: number;
  showMobileMenuOverlay?: boolean;
  showOverlay?: boolean; // backwards compat
  mobileMenuOverlayColor?: string;
  mobileMenuOverlayOpacity?: number;
  hamburgerSize?: number;
  hamburgerColor?: string;
  showCtaInMobileMenu?: boolean;
  mobileMenuLinkSpacing?: "compact" | "normal" | "spacious";

  // Scroll Progress
  showScrollProgress?: boolean;
  scrollProgressPosition?: "top" | "bottom";
  scrollProgressHeight?: number;
  scrollProgressColor?: string;
  scrollProgressBackground?: string;
  scrollProgressStyle?: "bar" | "line" | "gradient";

  // Accessibility
  ariaLabel?: string;
  skipToContent?: string;

  id?: string;
  className?: string;
  _breakpoint?: "mobile" | "tablet" | "desktop";
  _isEditor?: boolean;
}

function NavbarWithMenu(props: NavbarProps) {
  const {
    logo,
    logoText = "Logo",
    logoLink = "/",
    logoHeight = 40,
    logoPosition = "left",

    links = [],
    linkAlignment = "right",

    ctaText,
    ctaLink = "#",
    ctaColor = "",
    ctaTextColor = "#ffffff",
    ctaSize = "md",
    ctaIcon = "none",
    showCtaOnMobile,

    secondaryCtaText,
    secondaryCtaLink = "#",

    layout = "standard",
    height = "md",
    paddingX = "md",

    backgroundColor = "#ffffff",
    backgroundOpacity = 100,
    textColor = "#1f2937",
    borderBottom = false,
    borderColor = "#e5e7eb",
    borderWidth = 1,
    shadow = "sm",
    glassEffect = false,
    glassBlur = 10,
    transparent = false,
    blurBackground = false,

    stickyOffset = 0,
    hideOnScroll = false,
    showOnScrollUp = false,
    transparentUntilScroll = false,
    scrollThreshold = 100,

    mobileBreakpoint = "md",
    mobileMenuBackground,
    mobileMenuTextColor,
    mobileMenuAnimation = "slide",
    mobileMenuDuration = 300,
    mobileMenuOverlayColor = "#000000",
    mobileMenuOverlayOpacity = 50,
    hamburgerSize = 24,
    hamburgerColor,

    showScrollProgress = false,
    scrollProgressPosition = "top",
    scrollProgressHeight = 3,
    scrollProgressColor,
    scrollProgressBackground = "transparent",
    scrollProgressStyle = "bar",

    ariaLabel = "Main navigation",
    skipToContent,

    id,
    className = "",
    _breakpoint = "desktop",
    _isEditor = false,
  } = props;

  // Resolve backwards-compatible aliases (prefer new registry names)
  const resolvedFontSize = props.linkFontSize || props.linkSize || "md";
  const resolvedFontWeight =
    props.linkFontWeight || props.linkWeight || "medium";
  const resolvedHoverEffect =
    props.linkHoverEffect || props.linkHoverStyle || "opacity";
  const resolvedLinkSpacing = props.linkSpacing || "normal";
  const resolvedCtaStyle = props.ctaStyle || props.ctaVariant || "solid";
  const resolvedCtaRadius = props.ctaBorderRadius || props.ctaRadius || "md";
  const resolvedSecondaryStyle =
    props.secondaryCtaStyle || props.secondaryCtaVariant || "outline";
  const resolvedShowOverlay =
    props.showMobileMenuOverlay ?? props.showOverlay ?? true;
  const resolvedShowCtaInMobile =
    props.showCtaInMobileMenu ?? props.showCtaOnMobile ?? true;
  const resolvedMobileMenuBg = mobileMenuBackground || backgroundColor;
  const resolvedMobileLinkSpacing = props.mobileMenuLinkSpacing || "normal";
  const resolvedLinkTextTransform = props.linkTextTransform || "none";
  const resolvedLinkActiveIndicator = props.linkActiveIndicator || "none";

  // Resolve maxWidth (accept both old and new values)
  const resolvedMaxWidth = (() => {
    const mw = props.maxWidth || "7xl";
    if (mw === "container") return "7xl";
    if (mw === "narrow") return "5xl";
    return mw;
  })();

  // Resolve position (accept both `position` field and `sticky` boolean)
  const resolvedPosition =
    props.position || (props.sticky ? "sticky" : "relative");

  // Resolve mobile menu style
  const resolvedMobileMenuStyle = (() => {
    if (props.mobileMenuStyle) return props.mobileMenuStyle;
    if (props.mobileMenuPosition === "left") return "slideLeft";
    if (props.mobileMenuPosition === "right") return "slideRight";
    if (props.mobileMenuPosition === "full") return "fullscreen";
    return "fullscreen";
  })();

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [openDropdown, setOpenDropdown] = React.useState<number | null>(null);
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const [isHidden, setIsHidden] = React.useState(false);
  const [hasScrolled, setHasScrolled] = React.useState(false);
  const lastScrollY = React.useRef(0);
  const navRef = React.useRef<HTMLElement>(null);

  const logoUrl = getImageUrl(logo);
  const logoAlt = logoText || getImageAlt(logo, "Logo");

  // Contrast-safe text color
  const navDark = isDarkBackground(backgroundColor);
  const resolvedTextColor = resolveContrastColor(textColor || (navDark ? "#f8fafc" : "#1f2937"), navDark);
  const resolvedMobileMenuText = mobileMenuTextColor || resolvedTextColor;

  // Responsive behavior
  const isMobile = _isEditor ? _breakpoint === "mobile" : false;
  const showMobileMenu = _isEditor ? isMobile : true;
  const showDesktopNav = _isEditor ? !isMobile : true;

  // --- Scroll effects ---
  React.useEffect(() => {
    if (_isEditor) return;
    if (
      !hideOnScroll &&
      !showOnScrollUp &&
      !transparentUntilScroll &&
      !showScrollProgress
    )
      return;

    const handleScroll = () => {
      const currentY = window.scrollY;

      // Scroll progress
      if (showScrollProgress) {
        const docHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        setScrollProgress(docHeight > 0 ? (currentY / docHeight) * 100 : 0);
      }

      // Has scrolled past threshold
      setHasScrolled(currentY > scrollThreshold);

      // Hide/show on scroll direction
      if (hideOnScroll || showOnScrollUp) {
        if (currentY > lastScrollY.current && currentY > 100) {
          setIsHidden(true);
        } else if (showOnScrollUp || currentY < lastScrollY.current) {
          setIsHidden(false);
        }
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [
    hideOnScroll,
    showOnScrollUp,
    transparentUntilScroll,
    showScrollProgress,
    scrollThreshold,
    _isEditor,
  ]);

  // --- Escape key + body scroll lock for mobile menu ---
  React.useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // --- Click outside to close dropdown ---
  React.useEffect(() => {
    if (openDropdown === null) return;
    const handleClick = () => setOpenDropdown(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [openDropdown]);

  // Style calculations
  const heightClasses: Record<string, string> = {
    sm: "h-14",
    md: "h-16",
    lg: "h-20",
    xl: "h-24",
  };
  const paddingClasses: Record<string, string> = {
    sm: "px-4",
    md: "px-6",
    lg: "px-8",
    xl: "px-12",
  };
  const maxWidthClasses: Record<string, string> = {
    full: "max-w-none",
    "7xl": "max-w-7xl mx-auto",
    "6xl": "max-w-6xl mx-auto",
    "5xl": "max-w-5xl mx-auto",
  };
  const shadowClasses: Record<string, string> = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
  };
  const linkSpacingClass: Record<string, string> = {
    compact: "gap-3",
    sm: "gap-4",
    normal: "gap-6",
    md: "gap-6",
    wide: "gap-8",
    lg: "gap-8",
  };
  const linkSizeClass: Record<string, string> = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };
  const linkWeightClass: Record<string, string> = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
  };
  const textTransformClass: Record<string, string> = {
    none: "",
    uppercase: "uppercase tracking-wider",
    capitalize: "capitalize",
  };
  const ctaSizeClasses: Record<string, string> = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };
  const ctaRadiusClass: Record<string, string> = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  };
  const mobileLinkSpacingClass: Record<string, string> = {
    compact: "space-y-0",
    normal: "space-y-1",
    spacious: "space-y-3",
  };

  const linkHoverClass =
    {
      none: "",
      opacity: "hover:opacity-70 transition-opacity",
      underline: "hover:underline underline-offset-4",
      color: "hover:opacity-80 transition-colors",
      background: "hover:bg-black/5 rounded-md px-2 py-1 transition-colors",
    }[resolvedHoverEffect] || "hover:opacity-70 transition-opacity";

  // Background with opacity
  const isTransparentNow =
    transparent || (transparentUntilScroll && !hasScrolled);
  const bgOpacity = backgroundOpacity / 100;
  const useGlass = glassEffect || blurBackground;

  const navBgStyle: React.CSSProperties = {
    backgroundColor: isTransparentNow
      ? "transparent"
      : bgOpacity < 1
        ? `${backgroundColor}${Math.round(bgOpacity * 255)
            .toString(16)
            .padStart(2, "0")}`
        : backgroundColor,
    backdropFilter: useGlass ? `blur(${glassBlur}px)` : undefined,
    WebkitBackdropFilter: useGlass ? `blur(${glassBlur}px)` : undefined,
    top:
      resolvedPosition === "sticky" || resolvedPosition === "fixed"
        ? stickyOffset
        : undefined,
    borderColor,
    borderBottomWidth: borderBottom ? borderWidth : 0,
  };

  const positionClass =
    {
      relative: "",
      sticky: "sticky top-0",
      absolute: "absolute top-0 left-0 right-0",
      fixed: "fixed top-0 left-0 right-0",
    }[resolvedPosition] || "";

  const hiddenStyle: React.CSSProperties = isHidden
    ? {
        transform: "translateY(-100%)",
        transition: `transform ${mobileMenuDuration}ms ease`,
      }
    : {
        transform: "translateY(0)",
        transition: `transform ${mobileMenuDuration}ms ease`,
      };

  // Breakpoint class for hiding/showing mobile nav
  const bpHidden =
    { sm: "sm:hidden", md: "md:hidden", lg: "lg:hidden" }[mobileBreakpoint] ||
    "md:hidden";
  const bpFlex =
    { sm: "hidden sm:flex", md: "hidden md:flex", lg: "hidden lg:flex" }[
      mobileBreakpoint
    ] || "hidden md:flex";

  // CTA rendering helper
  const renderCta = (
    text: string,
    link: string,
    style: string,
    color: string,
    txtColor: string,
    size: string,
    radius: string,
    icon?: string,
    extraClass?: string,
  ) => {
    const iconEl =
      icon === "arrow" ? (
        <svg
          className="w-4 h-4 ml-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 8l4 4m0 0l-4 4m4-4H3"
          />
        </svg>
      ) : icon === "chevron" ? (
        <svg
          className="w-4 h-4 ml-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      ) : null;

    return (
      <a
        href={link}
        className={`inline-flex items-center ${ctaSizeClasses[size] || ctaSizeClasses.md} ${ctaRadiusClass[radius] || ctaRadiusClass.md} font-medium transition-all
          ${style === "solid" ? "hover:opacity-90" : ""}
          ${style === "outline" ? "border-2 hover:bg-opacity-10" : ""}
          ${style === "ghost" || style === "text" ? "hover:opacity-80" : ""}
          ${style === "gradient" ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:opacity-90" : ""}
          ${extraClass || ""}
        `}
        style={
          style === "gradient"
            ? {}
            : {
                backgroundColor:
                  style === "solid"
                    ? color || "var(--primary, #3b82f6)"
                    : "transparent",
                borderColor:
                  style === "outline"
                    ? color || "var(--primary, #3b82f6)"
                    : undefined,
                color:
                  style === "solid"
                    ? txtColor
                    : color || "var(--primary, #3b82f6)",
              }
        }
      >
        {text}
        {iconEl}
      </a>
    );
  };

  // Dropdown rendering
  const renderDropdown = (
    dropdownLinks: Array<{
      label?: string;
      href?: string;
      description?: string;
    }>,
    parentIdx: number,
  ) => (
    <div
      className="absolute top-full left-0 mt-1 min-w-[220px] bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50"
      style={{ backgroundColor, borderColor }}
      role="menu"
      aria-orientation="vertical"
    >
      {dropdownLinks.map((dl, j) => (
        <a
          key={j}
          href={dl.href || "#"}
          className="block px-4 py-2.5 hover:bg-black/5 transition-colors"
          style={{ color: resolvedTextColor }}
          role="menuitem"
        >
          <div className="text-sm font-medium">
            {dl.label || `Link ${j + 1}`}
          </div>
          {dl.description && (
            <div className="text-xs mt-0.5 opacity-60">{dl.description}</div>
          )}
        </a>
      ))}
    </div>
  );

  return (
    <>
      {/* Skip to Content */}
      {skipToContent && (
        <a
          href={skipToContent}
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded-md focus:shadow-lg"
        >
          Skip to content
        </a>
      )}

      <nav
        ref={navRef}
        id={id}
        className={`w-full z-50 ${positionClass} ${shadowClasses[shadow] || ""} ${borderBottom ? "border-b" : ""} ${className}`}
        style={{ ...navBgStyle, ...hiddenStyle }}
        role="navigation"
        aria-label={ariaLabel}
      >
        {/* Scroll Progress - Top */}
        {showScrollProgress && scrollProgressPosition === "top" && (
          <div
            className="w-full"
            style={{
              height: scrollProgressHeight,
              backgroundColor: scrollProgressBackground,
            }}
          >
            <div
              className="h-full transition-all duration-150"
              style={{
                width: `${scrollProgress}%`,
                background:
                  scrollProgressStyle === "gradient"
                    ? `linear-gradient(to right, ${scrollProgressColor || "var(--primary, #3b82f6)"}, ${scrollProgressColor ? scrollProgressColor + "80" : "#8b5cf6"})`
                    : scrollProgressColor || "var(--primary, #3b82f6)",
              }}
            />
          </div>
        )}

        <div
          className={`${heightClasses[height] || heightClasses.md} ${paddingClasses[paddingX] || paddingClasses.md} ${maxWidthClasses[resolvedMaxWidth] || maxWidthClasses["7xl"]} flex items-center ${layout === "centered" ? "justify-center" : "justify-between"}`}
        >
          {/* Logo */}
          {(layout === "standard" ||
            layout === "split" ||
            layout === "minimal") && (
            <a href={logoLink} className="flex items-center gap-2 shrink-0">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={logoAlt}
                  style={{ height: logoHeight }}
                  className="w-auto"
                />
              ) : (
                <span
                  className="text-xl font-bold"
                  style={{ color: resolvedTextColor }}
                >
                  {logoText}
                </span>
              )}
            </a>
          )}

          {/* Centered Layout Logo */}
          {layout === "centered" && (
            <a
              href={logoLink}
              className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2"
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={logoAlt}
                  style={{ height: logoHeight }}
                  className="w-auto"
                />
              ) : (
                <span
                  className="text-xl font-bold"
                  style={{ color: resolvedTextColor }}
                >
                  {logoText}
                </span>
              )}
            </a>
          )}

          {/* Desktop Navigation */}
          {showDesktopNav && layout !== "minimal" && (
            <div
              className={`${bpFlex} items-center ${linkSpacingClass[resolvedLinkSpacing] || linkSpacingClass.normal} ${linkAlignment === "center" ? "flex-1 justify-center" : linkAlignment === "right" ? "flex-1 justify-end" : ""}`}
            >
              {links.map((link, i) => {
                const hasDD =
                  link.hasDropdown &&
                  link.dropdownLinks &&
                  link.dropdownLinks.length > 0;
                return (
                  <div key={i} className="relative">
                    <a
                      href={hasDD ? undefined : link.href || "#"}
                      target={link.target}
                      rel={
                        link.target === "_blank"
                          ? "noopener noreferrer"
                          : undefined
                      }
                      className={`${linkSizeClass[resolvedFontSize] || linkSizeClass.md} ${linkWeightClass[resolvedFontWeight] || linkWeightClass.medium} ${linkHoverClass} ${textTransformClass[resolvedLinkTextTransform] || ""} inline-flex items-center gap-1 cursor-pointer`}
                      style={{ color: resolvedTextColor }}
                      role={hasDD ? "button" : undefined}
                      aria-expanded={hasDD ? openDropdown === i : undefined}
                      aria-haspopup={hasDD ? "true" : undefined}
                      onClick={
                        hasDD
                          ? (e: React.MouseEvent) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setOpenDropdown(openDropdown === i ? null : i);
                            }
                          : undefined
                      }
                      onKeyDown={
                        hasDD
                          ? (e: React.KeyboardEvent) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setOpenDropdown(openDropdown === i ? null : i);
                              }
                              if (e.key === "Escape") setOpenDropdown(null);
                            }
                          : undefined
                      }
                    >
                      {link.label || link.text || `Link ${i + 1}`}
                      {hasDD && (
                        <svg
                          className={`w-3.5 h-3.5 transition-transform ${openDropdown === i ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      )}
                    </a>
                    {hasDD &&
                      openDropdown === i &&
                      renderDropdown(link.dropdownLinks!, i)}
                  </div>
                );
              })}
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            {secondaryCtaText && showDesktopNav && (
              <span className={bpFlex}>
                {renderCta(
                  secondaryCtaText,
                  secondaryCtaLink,
                  resolvedSecondaryStyle,
                  ctaColor,
                  ctaTextColor,
                  ctaSize,
                  resolvedCtaRadius,
                )}
              </span>
            )}

            {ctaText && (
              <span className={resolvedShowCtaInMobile ? "" : bpFlex}>
                {renderCta(
                  ctaText,
                  ctaLink,
                  resolvedCtaStyle,
                  ctaColor,
                  ctaTextColor,
                  ctaSize,
                  resolvedCtaRadius,
                  ctaIcon,
                )}
              </span>
            )}

            {/* Hamburger Button */}
            {showMobileMenu && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`${bpHidden} p-2 rounded-lg hover:opacity-80 transition-colors`}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenuOpen}
                aria-controls="navbar-mobile-menu"
              >
                {mobileMenuOpen ? (
                  <svg
                    style={{
                      width: hamburgerSize,
                      height: hamburgerSize,
                      color: hamburgerColor || resolvedTextColor,
                    }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    style={{
                      width: hamburgerSize,
                      height: hamburgerSize,
                      color: hamburgerColor || resolvedTextColor,
                    }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Scroll Progress - Bottom */}
        {showScrollProgress && scrollProgressPosition === "bottom" && (
          <div
            className="w-full"
            style={{
              height: scrollProgressHeight,
              backgroundColor: scrollProgressBackground,
            }}
          >
            <div
              className="h-full transition-all duration-150"
              style={{
                width: `${scrollProgress}%`,
                background:
                  scrollProgressStyle === "gradient"
                    ? `linear-gradient(to right, ${scrollProgressColor || "var(--primary, #3b82f6)"}, ${scrollProgressColor ? scrollProgressColor + "80" : "#8b5cf6"})`
                    : scrollProgressColor || "var(--primary, #3b82f6)",
              }}
            />
          </div>
        )}
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && resolvedShowOverlay && (
        <div
          className={`fixed inset-0 z-40 ${bpHidden}`}
          style={{
            backgroundColor: mobileMenuOverlayColor,
            opacity: mobileMenuOverlayOpacity / 100,
          }}
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Panel */}
      <div
        id="navbar-mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile menu"
        className={`fixed z-50 ${bpHidden} transition-all overflow-hidden ${
          resolvedMobileMenuStyle === "fullscreen"
            ? "inset-0 top-14"
            : resolvedMobileMenuStyle === "dropdown"
              ? "left-0 right-0 top-14"
              : resolvedMobileMenuStyle === "slideLeft"
                ? "left-0 top-0 bottom-0 w-[320px] max-w-[85vw]"
                : "right-0 top-0 bottom-0 w-[320px] max-w-[85vw]"
        }`}
        style={{
          backgroundColor: resolvedMobileMenuBg,
          transitionDuration: `${mobileMenuDuration}ms`,
          ...(mobileMenuOpen
            ? {
                transform: "translateX(0) translateY(0)",
                opacity: 1,
                visibility: "visible" as const,
              }
            : resolvedMobileMenuStyle === "slideLeft"
              ? {
                  transform: "translateX(-100%)",
                  opacity: 0,
                  visibility: "hidden" as const,
                }
              : resolvedMobileMenuStyle === "slideRight"
                ? {
                    transform: "translateX(100%)",
                    opacity: 0,
                    visibility: "hidden" as const,
                  }
                : resolvedMobileMenuStyle === "dropdown"
                  ? {
                      transform: "translateY(-10px)",
                      opacity: 0,
                      visibility: "hidden" as const,
                    }
                  : {
                      transform: "translateY(0)",
                      opacity: 0,
                      visibility: "hidden" as const,
                    }),
        }}
      >
        <div
          className={`h-full overflow-y-auto p-6 ${mobileLinkSpacingClass[resolvedMobileLinkSpacing] || mobileLinkSpacingClass.normal}`}
        >
          {links.map((link, i) => {
            const hasDD =
              link.hasDropdown &&
              link.dropdownLinks &&
              link.dropdownLinks.length > 0;
            return (
              <div key={i}>
                <a
                  href={hasDD ? undefined : link.href || "#"}
                  onClick={() => {
                    if (hasDD) {
                      setOpenDropdown(openDropdown === i ? null : i);
                    } else {
                      setMobileMenuOpen(false);
                    }
                  }}
                  className="flex items-center justify-between px-4 py-3 rounded-lg text-base font-medium hover:opacity-80 transition-colors cursor-pointer"
                  style={{ color: resolvedMobileMenuText }}
                >
                  <span>{link.label || link.text || `Link ${i + 1}`}</span>
                  {hasDD && (
                    <svg
                      className={`w-4 h-4 transition-transform ${openDropdown === i ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  )}
                </a>
                {hasDD && openDropdown === i && (
                  <div
                    className="ml-4 border-l-2 pl-4"
                    style={{ borderColor: `${resolvedMobileMenuText}20` }}
                  >
                    {link.dropdownLinks!.map((dl, j) => (
                      <a
                        key={j}
                        href={dl.href || "#"}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-4 py-2.5 rounded-lg text-sm hover:opacity-80 transition-colors"
                        style={{ color: resolvedMobileMenuText }}
                      >
                        {dl.label || `Link ${j + 1}`}
                        {dl.description && (
                          <span className="block text-xs opacity-60 mt-0.5">
                            {dl.description}
                          </span>
                        )}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Mobile CTAs */}
          {resolvedShowCtaInMobile && (
            <div className="mt-6 space-y-3 px-4">
              {secondaryCtaText && (
                <a
                  href={secondaryCtaLink}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block w-full py-3 text-center rounded-lg font-medium transition-all ${resolvedSecondaryStyle === "outline" ? "border-2" : ""}`}
                  style={{
                    backgroundColor:
                      resolvedSecondaryStyle === "solid"
                        ? ctaColor
                        : "transparent",
                    borderColor:
                      resolvedSecondaryStyle === "outline"
                        ? ctaColor
                        : undefined,
                    color:
                      resolvedSecondaryStyle === "solid"
                        ? ctaTextColor
                        : ctaColor,
                  }}
                >
                  {secondaryCtaText}
                </a>
              )}
              {ctaText && (
                <a
                  href={ctaLink}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-3 text-center rounded-lg font-medium transition-opacity hover:opacity-90"
                  style={{
                    backgroundColor: ctaColor || "var(--primary, #3b82f6)",
                    color: ctaTextColor,
                  }}
                >
                  {ctaText}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function NavbarRender(props: NavbarProps) {
  return <NavbarWithMenu {...props} />;
}

// ============================================================================
// FOOTER - Comprehensive Footer
// ============================================================================

export interface FooterProps {
  // Branding
  logo?: string | ImageValue;
  logoText?: string;
  logoHeight?: number;
  companyName?: string;
  description?: string;
  // Columns
  columns?: Array<{
    title?: string;
    links?: Array<{ label?: string; href?: string; isNew?: boolean }>;
  }>;
  columnsLayout?: "2" | "3" | "4" | "auto";
  // Newsletter
  showNewsletter?: boolean;
  newsletter?: boolean; // backwards compat
  newsletterTitle?: string;
  newsletterDescription?: string;
  newsletterPlaceholder?: string;
  newsletterButtonText?: string;
  newsletterButtonColor?: string;
  // Social
  showSocialLinks?: boolean;
  socialLinksTitle?: string;
  socialLinks?: Array<{
    platform?:
      | "facebook"
      | "twitter"
      | "instagram"
      | "linkedin"
      | "youtube"
      | "github"
      | "tiktok"
      | "pinterest";
    url?: string;
  }>;
  socialIconSize?: "sm" | "md" | "lg";
  socialIconStyle?: "default" | "filled" | "outline";
  // Contact
  showContactInfo?: boolean;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  // App badges
  showAppBadges?: boolean;
  appStoreUrl?: string;
  playStoreUrl?: string;
  // Legal
  copyright?: string;
  legalLinks?: Array<{ label?: string; href?: string }>;
  bottomLinks?: Array<{ label?: string; href?: string }>; // backwards compat
  showMadeWith?: boolean;
  madeWithText?: string;
  // Layout
  variant?: "standard" | "centered" | "simple" | "extended" | "columns";
  maxWidth?: "full" | "7xl" | "6xl" | "5xl";
  paddingTop?: string;
  paddingBottom?: string;
  paddingX?: "sm" | "md" | "lg" | "xl";
  paddingY?: "sm" | "md" | "lg"; // backwards compat
  // Appearance
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  linkColor?: string;
  linkHoverColor?: string;
  borderTop?: boolean;
  borderColor?: string;
  dividerColor?: string;
  id?: string;
  className?: string;
}

export function FooterRender(props: FooterProps) {
  const {
    logo,
    logoText,
    logoHeight = 40,
    description,
    columns = [],
    socialLinks = [],
    copyright = `© ${new Date().getFullYear()} Company. All rights reserved.`,
    socialIconSize = "md",
    socialIconStyle = "default",
    showContactInfo = false,
    contactEmail,
    contactPhone,
    contactAddress,
    showAppBadges = false,
    appStoreUrl,
    playStoreUrl,
    showMadeWith = false,
    madeWithText = "Made with ❤️",
    maxWidth = "7xl",
    paddingX = "md",
    backgroundColor = "#111827",
    textColor = "#f9fafb",
    linkColor: linkColorProp = "#9ca3af",
    linkHoverColor: linkHoverColorProp = "#ffffff",
    borderTop = false,
    borderColor = "#374151",
    dividerColor = "#374151",
    id,
    className = "",
  } = props;

  // Backwards-compat aliases
  const companyName = props.companyName || logoText || "Company";
  const resolvedVariant =
    props.variant === "columns" ? "standard" : props.variant || "standard";
  const showNewsletter = props.showNewsletter ?? props.newsletter ?? false;
  const newsletterTitle = props.newsletterTitle || "Stay Updated";
  const newsletterDescription = props.newsletterDescription || "";
  const newsletterPlaceholder =
    props.newsletterPlaceholder || "Enter your email";
  const newsletterButtonText = props.newsletterButtonText || "Subscribe";
  const newsletterButtonColor =
    props.newsletterButtonColor || props.accentColor || linkHoverColorProp;
  const showSocialLinks = props.showSocialLinks ?? true;
  const socialLinksTitle = props.socialLinksTitle || "";
  const columnsLayout = props.columnsLayout || "auto";
  const resolvedLegalLinks = props.legalLinks || props.bottomLinks || [];

  // Contrast-aware link colors: adjust defaults when background changes
  const bgIsDark = isDarkBackground(backgroundColor);
  // Resolve textColor against footer background: brand injection may replace
  // light textColor (e.g. "#f9fafb") with dark foreground → invisible on dark footer
  const resolvedTextColor = resolveContrastColor(textColor, bgIsDark);
  const linkColor = (() => {
    // Default gray — adjust for background
    if (linkColorProp === "#9ca3af")
      return bgIsDark ? "#9ca3af" : "#4b5563";
    // Brand-injected link color: ensure it contrasts with footer bg
    if (bgIsDark && isDarkBackground(linkColorProp)) return "#9ca3af";
    if (!bgIsDark && !isDarkBackground(linkColorProp)) return "#4b5563";
    return linkColorProp;
  })();
  const linkHoverColor =
    linkHoverColorProp === "#ffffff"
      ? bgIsDark
        ? "#ffffff"
        : "#111827"
      : linkHoverColorProp;

  // Padding
  const paddingTopClass: Record<string, string> = {
    none: "pt-0",
    xs: "pt-4",
    sm: "pt-8",
    md: "pt-12",
    lg: "pt-16",
    xl: "pt-20",
    "2xl": "pt-24",
  };
  const paddingBottomClass: Record<string, string> = {
    none: "pb-0",
    xs: "pb-4",
    sm: "pb-8",
    md: "pb-12",
    lg: "pb-16",
    xl: "pb-20",
    "2xl": "pb-24",
  };
  const paddingYFallback: Record<string, [string, string]> = {
    sm: ["sm", "sm"],
    md: ["md", "md"],
    lg: ["lg", "lg"],
  };
  const [ptKey, pbKey] = props.paddingTop
    ? [props.paddingTop, props.paddingBottom || props.paddingTop]
    : props.paddingY
      ? paddingYFallback[props.paddingY] || ["lg", "lg"]
      : ["xl", "lg"];
  const ptClass = paddingTopClass[ptKey] || "pt-20";
  const pbClass = paddingBottomClass[pbKey] || "pt-16";
  const pxClass =
    {
      sm: "px-4",
      md: "px-6 lg:px-8",
      lg: "px-8 lg:px-12",
      xl: "px-12 lg:px-16",
    }[paddingX] || "px-6 lg:px-8";
  const maxWClass =
    {
      full: "max-w-full",
      "7xl": "max-w-7xl",
      "6xl": "max-w-6xl",
      "5xl": "max-w-5xl",
    }[maxWidth] || "max-w-7xl";

  // Logo
  const logoUrl = getImageUrl(logo);

  // Social icon sizes
  const iconSizeClass =
    { sm: "w-4 h-4", md: "w-5 h-5", lg: "w-6 h-6" }[socialIconSize] ||
    "w-5 h-5";

  const SocialIcon = ({ platform }: { platform?: string }) => {
    const icons: Record<string, React.ReactNode> = {
      facebook: (
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      ),
      twitter: (
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      ),
      instagram: (
        <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
      ),
      linkedin: (
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      ),
      youtube: (
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      ),
      github: (
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      ),
      tiktok: (
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      ),
      pinterest: (
        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0z" />
      ),
    };
    return (
      <svg className={iconSizeClass} fill="currentColor" viewBox="0 0 24 24">
        {icons[platform || ""] || null}
      </svg>
    );
  };

  // Social icon wrapper for filled/outline styles
  const renderSocialIcon = (
    social: { platform?: string; url?: string },
    i: number,
  ) => {
    const baseStyle =
      socialIconStyle === "filled"
        ? "p-2 rounded-full transition-colors"
        : socialIconStyle === "outline"
          ? "p-2 rounded-full border transition-colors"
          : "transition-opacity opacity-75 hover:opacity-100";
    const fillBg =
      socialIconStyle === "filled" ? `${resolvedTextColor}15` : "transparent";
    const borderStyle =
      socialIconStyle === "outline" ? `1px solid ${dividerColor}` : "none";
    return (
      <a
        key={i}
        href={social.url || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className={baseStyle}
        style={{
          color: resolvedTextColor,
          backgroundColor: fillBg,
          border: borderStyle,
        }}
        aria-label={social.platform}
      >
        <SocialIcon platform={social.platform} />
      </a>
    );
  };

  // Column grid classes
  const columnGridClass =
    columnsLayout === "2"
      ? "grid-cols-1 sm:grid-cols-2"
      : columnsLayout === "3"
        ? "grid-cols-2 sm:grid-cols-3"
        : columnsLayout === "4"
          ? "grid-cols-2 sm:grid-cols-4"
          : `grid-cols-2 ${columns.length >= 4 ? "sm:grid-cols-4" : columns.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`;

  // Link renderer helper
  const renderLink = (
    link: { label?: string; href?: string; isNew?: boolean },
    j: number,
  ) => (
    <li key={j}>
      <a
        href={link.href || "#"}
        className="text-sm transition-colors inline-flex items-center gap-1.5"
        style={{ color: linkColor }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = linkHoverColor;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = linkColor;
        }}
      >
        {link.label}
        {link.isNew && (
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: newsletterButtonColor, color: "#fff" }}
          >
            NEW
          </span>
        )}
      </a>
    </li>
  );

  // Newsletter section
  const renderNewsletter = () => {
    if (!showNewsletter) return null;
    return (
      <div className="max-w-md">
        <h3 className="font-semibold mb-2" style={{ color: resolvedTextColor }}>
          {newsletterTitle}
        </h3>
        {newsletterDescription && (
          <p className="text-sm opacity-75 mb-4" style={{ color: resolvedTextColor }}>
            {newsletterDescription}
          </p>
        )}
        <form
          className="flex flex-col sm:flex-row gap-2"
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            type="email"
            placeholder={newsletterPlaceholder}
            aria-label={newsletterPlaceholder}
            className="flex-1 px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
            style={{ color: resolvedTextColor }}
          />
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg font-medium transition-opacity hover:opacity-90 whitespace-nowrap"
            style={{
              backgroundColor: newsletterButtonColor,
              color: isDarkBackground(newsletterButtonColor)
                ? "#ffffff"
                : "#000000",
            }}
          >
            {newsletterButtonText}
          </button>
        </form>
      </div>
    );
  };

  // Contact info section
  const renderContactInfo = () => {
    if (!showContactInfo) return null;
    return (
      <div className="space-y-2">
        {contactEmail && (
          <a
            href={`mailto:${contactEmail}`}
            className="flex items-center gap-2 text-sm transition-colors"
            style={{ color: linkColor }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = linkHoverColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = linkColor;
            }}
          >
            <svg
              className="w-4 h-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            {contactEmail}
          </a>
        )}
        {contactPhone && (
          <a
            href={`tel:${contactPhone}`}
            className="flex items-center gap-2 text-sm transition-colors"
            style={{ color: linkColor }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = linkHoverColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = linkColor;
            }}
          >
            <svg
              className="w-4 h-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            {contactPhone}
          </a>
        )}
        {contactAddress && (
          <div
            className="flex items-start gap-2 text-sm"
            style={{ color: linkColor }}
          >
            <svg
              className="w-4 h-4 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>{contactAddress}</span>
          </div>
        )}
      </div>
    );
  };

  // App store badges
  const renderAppBadges = () => {
    if (!showAppBadges || (!appStoreUrl && !playStoreUrl)) return null;
    return (
      <div className="flex flex-wrap gap-3">
        {appStoreUrl && (
          <a
            href={appStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-opacity hover:opacity-80"
            style={{ borderColor: dividerColor, color: resolvedTextColor }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            <div className="text-left">
              <div className="text-[10px] opacity-75">Download on the</div>
              <div className="text-sm font-semibold -mt-0.5">App Store</div>
            </div>
          </a>
        )}
        {playStoreUrl && (
          <a
            href={playStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-opacity hover:opacity-80"
            style={{ borderColor: dividerColor, color: resolvedTextColor }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 010 1.732l-2.808 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
            </svg>
            <div className="text-left">
              <div className="text-[10px] opacity-75">GET IT ON</div>
              <div className="text-sm font-semibold -mt-0.5">Google Play</div>
            </div>
          </a>
        )}
      </div>
    );
  };

  // Bottom bar with copyright, legal links, made-with
  const renderBottomBar = () => (
    <div
      className="border-t pt-6 mt-8 flex flex-col md:flex-row items-center justify-between gap-4"
      style={{ borderColor: dividerColor }}
    >
      <p className="text-sm opacity-75" style={{ color: resolvedTextColor }}>
        {copyright}
      </p>
      <div className="flex flex-wrap items-center gap-4 md:gap-6">
        {resolvedLegalLinks.map((link, i) => (
          <a
            key={i}
            href={link.href || "#"}
            className="text-sm transition-colors"
            style={{ color: linkColor }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = linkHoverColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = linkColor;
            }}
          >
            {link.label}
          </a>
        ))}
        {showMadeWith && (
          <span className="text-sm opacity-60" style={{ color: resolvedTextColor }}>
            {madeWithText}
          </span>
        )}
      </div>
    </div>
  );

  // === SIMPLE VARIANT ===
  if (resolvedVariant === "simple") {
    return (
      <footer
        id={id}
        role="contentinfo"
        className={`w-full ${ptClass} ${pbClass} ${pxClass} ${className}`}
        style={{
          backgroundColor,
          ...(borderTop ? { borderTop: `1px solid ${borderColor}` } : {}),
        }}
      >
        <div
          className={`${maxWClass} mx-auto flex flex-col items-center text-center gap-4`}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={companyName}
              style={{ height: logoHeight }}
            />
          ) : (
            <p className="text-lg font-bold" style={{ color: resolvedTextColor }}>
              {companyName}
            </p>
          )}
          {description && (
            <p
              className="text-sm opacity-75 max-w-md"
              style={{ color: resolvedTextColor }}
            >
              {description}
            </p>
          )}
          {showSocialLinks && socialLinks.length > 0 && (
            <div className="flex gap-3">
              {socialLinks.map(renderSocialIcon)}
            </div>
          )}
          <p className="text-sm opacity-75" style={{ color: resolvedTextColor }}>
            {copyright}
          </p>
          {resolvedLegalLinks.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4">
              {resolvedLegalLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.href || "#"}
                  className="text-sm transition-colors"
                  style={{ color: linkColor }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = linkHoverColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = linkColor;
                  }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </footer>
    );
  }

  // === CENTERED VARIANT ===
  if (resolvedVariant === "centered") {
    return (
      <footer
        id={id}
        role="contentinfo"
        className={`w-full ${ptClass} ${pbClass} ${pxClass} ${className}`}
        style={{
          backgroundColor,
          ...(borderTop ? { borderTop: `1px solid ${borderColor}` } : {}),
        }}
      >
        <div
          className={`${maxWClass} mx-auto flex flex-col items-center text-center gap-6`}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={companyName}
              style={{ height: logoHeight }}
            />
          ) : (
            <p className="text-xl font-bold" style={{ color: resolvedTextColor }}>
              {companyName}
            </p>
          )}
          {description && (
            <p
              className="text-sm opacity-75 max-w-lg"
              style={{ color: resolvedTextColor }}
            >
              {description}
            </p>
          )}
          {/* Flat link list from all columns */}
          {columns.length > 0 && (
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {columns
                .flatMap((col) => col.links || [])
                .map((link, i) => (
                  <a
                    key={i}
                    href={link.href || "#"}
                    className="text-sm transition-colors"
                    style={{ color: linkColor }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = linkHoverColor;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = linkColor;
                    }}
                  >
                    {link.label}
                  </a>
                ))}
            </nav>
          )}
          {renderNewsletter()}
          {showSocialLinks && socialLinks.length > 0 && (
            <div className="flex flex-col items-center gap-2">
              {socialLinksTitle && (
                <p className="text-sm font-medium" style={{ color: resolvedTextColor }}>
                  {socialLinksTitle}
                </p>
              )}
              <div className="flex gap-3">
                {socialLinks.map(renderSocialIcon)}
              </div>
            </div>
          )}
          {renderAppBadges()}
          {renderBottomBar()}
        </div>
      </footer>
    );
  }

  // === EXTENDED VARIANT (mega footer) ===
  if (resolvedVariant === "extended") {
    return (
      <footer
        id={id}
        role="contentinfo"
        className={`w-full ${ptClass} ${pbClass} ${pxClass} ${className}`}
        style={{
          backgroundColor,
          ...(borderTop ? { borderTop: `1px solid ${borderColor}` } : {}),
        }}
      >
        <div className={`${maxWClass} mx-auto`}>
          {/* Top: newsletter full-width bar */}
          {showNewsletter && (
            <div
              className="border-b pb-8 mb-10"
              style={{ borderColor: dividerColor }}
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                  <h3
                    className="text-lg font-semibold"
                    style={{ color: resolvedTextColor }}
                  >
                    {newsletterTitle}
                  </h3>
                  {newsletterDescription && (
                    <p
                      className="text-sm opacity-75 mt-1"
                      style={{ color: resolvedTextColor }}
                    >
                      {newsletterDescription}
                    </p>
                  )}
                </div>
                <form
                  className="flex flex-col sm:flex-row gap-2 sm:min-w-[360px]"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <input
                    type="email"
                    placeholder={newsletterPlaceholder}
                    aria-label={newsletterPlaceholder}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                    style={{ color: resolvedTextColor }}
                  />
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-lg font-medium transition-opacity hover:opacity-90 whitespace-nowrap"
                    style={{
                      backgroundColor: newsletterButtonColor,
                      color: isDarkBackground(newsletterButtonColor)
                        ? "#ffffff"
                        : "#000000",
                    }}
                  >
                    {newsletterButtonText}
                  </button>
                </form>
              </div>
            </div>
          )}
          {/* Middle: brand + columns + contact */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
            {/* Brand column */}
            <div className="lg:col-span-4 space-y-4">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={companyName}
                  style={{ height: logoHeight }}
                />
              ) : (
                <p className="text-xl font-bold" style={{ color: resolvedTextColor }}>
                  {companyName}
                </p>
              )}
              {description && (
                <p
                  className="text-sm opacity-75 max-w-xs"
                  style={{ color: resolvedTextColor }}
                >
                  {description}
                </p>
              )}
              {renderContactInfo()}
              {renderAppBadges()}
            </div>
            {/* Link columns */}
            <nav
              aria-label="Footer navigation"
              className={`${showContactInfo || showAppBadges ? "lg:col-span-5" : "lg:col-span-8"} grid ${columnGridClass} gap-8`}
            >
              {columns.map((column, i) => (
                <div key={i}>
                  <h3
                    className="font-semibold mb-4 text-sm uppercase tracking-wider"
                    style={{ color: resolvedTextColor }}
                  >
                    {column.title}
                  </h3>
                  <ul className="space-y-2.5">
                    {(column.links || []).map(renderLink)}
                  </ul>
                </div>
              ))}
            </nav>
            {/* Social column */}
            {showSocialLinks && socialLinks.length > 0 && (
              <div className="lg:col-span-3">
                {socialLinksTitle && (
                  <h3
                    className="font-semibold mb-4 text-sm uppercase tracking-wider"
                    style={{ color: resolvedTextColor }}
                  >
                    {socialLinksTitle}
                  </h3>
                )}
                <div className="flex flex-wrap gap-3">
                  {socialLinks.map(renderSocialIcon)}
                </div>
              </div>
            )}
          </div>
          {renderBottomBar()}
        </div>
      </footer>
    );
  }

  // === STANDARD VARIANT (default) ===
  return (
    <footer
      id={id}
      role="contentinfo"
      className={`w-full ${ptClass} ${pbClass} ${pxClass} ${className}`}
      style={{
        backgroundColor,
        ...(borderTop ? { borderTop: `1px solid ${borderColor}` } : {}),
      }}
    >
      <div className={`${maxWClass} mx-auto`}>
        {columns.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
            {/* Brand sidebar */}
            <div className="lg:col-span-4 space-y-4">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={companyName}
                  style={{ height: logoHeight }}
                />
              ) : (
                <p className="text-xl font-bold" style={{ color: resolvedTextColor }}>
                  {companyName}
                </p>
              )}
              {description && (
                <p
                  className="text-sm opacity-75 max-w-xs"
                  style={{ color: resolvedTextColor }}
                >
                  {description}
                </p>
              )}
              {showSocialLinks && socialLinks.length > 0 && (
                <div>
                  {socialLinksTitle && (
                    <p
                      className="text-sm font-medium mb-2"
                      style={{ color: resolvedTextColor }}
                    >
                      {socialLinksTitle}
                    </p>
                  )}
                  <div className="flex gap-3">
                    {socialLinks.map(renderSocialIcon)}
                  </div>
                </div>
              )}
              {renderContactInfo()}
            </div>
            {/* Link columns */}
            <nav
              aria-label="Footer navigation"
              className={`lg:col-span-8 grid ${columnGridClass} gap-8`}
            >
              {columns.map((column, i) => (
                <div key={i}>
                  <h3
                    className="font-semibold mb-4 text-sm uppercase tracking-wider"
                    style={{ color: resolvedTextColor }}
                  >
                    {column.title}
                  </h3>
                  <ul className="space-y-2.5">
                    {(column.links || []).map(renderLink)}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        )}
        {/* Newsletter */}
        {showNewsletter && (
          <div
            className="border-t pt-8 mb-8"
            style={{ borderColor: dividerColor }}
          >
            {renderNewsletter()}
          </div>
        )}
        {/* App badges */}
        {showAppBadges && <div className="mb-8">{renderAppBadges()}</div>}
        {renderBottomBar()}
      </div>
    </footer>
  );
}

// ============================================================================
// SOCIAL LINKS - Social Media Icons (V2 — 15+ platforms, brand colours)
// ============================================================================

const SOCIAL_PLATFORMS: Record<
  string,
  { path: string; brandColor: string; label: string; viewBox?: string }
> = {
  facebook: {
    path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
    brandColor: "#1877F2",
    label: "Facebook",
  },
  x: {
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
    brandColor: "#000000",
    label: "X (Twitter)",
  },
  twitter: {
    path: "M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z",
    brandColor: "#1DA1F2",
    label: "Twitter",
  },
  instagram: {
    path: "M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z",
    brandColor: "#E4405F",
    label: "Instagram",
  },
  linkedin: {
    path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
    brandColor: "#0A66C2",
    label: "LinkedIn",
  },
  youtube: {
    path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
    brandColor: "#FF0000",
    label: "YouTube",
  },
  github: {
    path: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
    brandColor: "#181717",
    label: "GitHub",
  },
  tiktok: {
    path: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
    brandColor: "#000000",
    label: "TikTok",
  },
  pinterest: {
    path: "M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0z",
    brandColor: "#BD081C",
    label: "Pinterest",
  },
  whatsapp: {
    path: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z",
    brandColor: "#25D366",
    label: "WhatsApp",
  },
  telegram: {
    path: "M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z",
    brandColor: "#26A5E4",
    label: "Telegram",
  },
  discord: {
    path: "M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.8732.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z",
    brandColor: "#5865F2",
    label: "Discord",
  },
  threads: {
    path: "M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017C1.5 8.418 2.35 5.564 3.995 3.517 5.845 1.213 8.598.032 12.179.008h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.29 3.276-.776.964-1.846 1.544-3.18 1.726-1.126.152-2.255-.058-3.18-.594-.986-.57-1.63-1.463-1.812-2.512-.325-1.87.756-3.608 2.74-4.408.83-.335 1.796-.536 2.883-.602-.15-.79-.442-1.367-.877-1.728-.524-.437-1.283-.66-2.254-.66l-.036.001c-1.207.014-2.14.453-2.772 1.31l-1.7-1.24C7.677 5.443 9.07 4.753 10.82 4.726l.05-.001c1.462 0 2.631.406 3.476 1.208.788.748 1.292 1.795 1.515 3.126 1.1.148 2.09.455 2.956.916 1.136.604 2.018 1.456 2.553 2.638.795 1.756.82 4.517-1.265 6.56C18.32 20.876 16.069 21.679 12.84 21.71l-.001.001z",
    brandColor: "#000000",
    label: "Threads",
  },
  snapchat: {
    path: "M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.076-.375-.075-.81-.149-1.364-.149-.39 0-.794.029-1.199.135-.66.18-1.168.593-1.663 1.006-.704.585-1.424 1.185-2.7 1.185-.045 0-.09 0-.135-.015-.044.015-.089.015-.119.015-1.274 0-1.994-.6-2.699-1.185-.494-.42-1.004-.825-1.662-1.006-.405-.105-.809-.135-1.199-.135-.554 0-.989.074-1.364.149-.225.045-.403.076-.539.076-.284.001-.478-.134-.554-.405-.061-.194-.105-.374-.135-.553-.044-.194-.104-.479-.164-.57-1.873-.283-2.905-.702-3.146-1.271-.029-.075-.044-.149-.044-.225-.015-.24.164-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.135-.044-.24-.09-.359-.119-.822-.33-1.213-.72-1.213-1.17 0-.36.284-.69.734-.838.15-.06.328-.09.51-.09.12 0 .284.015.449.104.374.18.719.3 1.019.3.255-.015.375-.09.42-.119-.015-.255-.03-.494-.046-.748v-.06c-.104-1.624-.225-3.654.3-4.843 1.577-3.545 4.937-3.821 5.914-3.821h.223z",
    brandColor: "#FFFC00",
    label: "Snapchat",
  },
  reddit: {
    path: "M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z",
    brandColor: "#FF4500",
    label: "Reddit",
  },
};

export interface SocialLinksProps {
  links?: Array<{
    platform?: keyof typeof SOCIAL_PLATFORMS | string;
    url?: string;
    label?: string;
  }>;

  // Display
  variant?: "icons" | "buttons" | "rounded" | "pill" | "text";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  gap?: "xs" | "sm" | "md" | "lg";
  alignment?: "left" | "center" | "right";
  direction?: "horizontal" | "vertical";

  // Colours
  useBrandColors?: boolean;
  color?: string;
  hoverColor?: string;
  backgroundColor?: string;
  hoverBackgroundColor?: string;

  // Animation
  hoverEffect?: "none" | "lift" | "scale" | "glow" | "bounce";

  // Accessibility
  showLabels?: boolean;
  ariaLabel?: string;

  id?: string;
  className?: string;
}

export function SocialLinksRender({
  links = [],
  variant = "icons",
  size = "md",
  gap = "md",
  alignment = "left",
  direction = "horizontal",
  useBrandColors = false,
  color,
  backgroundColor,
  hoverEffect = "none",
  showLabels = false,
  ariaLabel,
  id,
  className = "",
}: SocialLinksProps) {
  const sizeClasses = {
    xs: "w-3.5 h-3.5",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-7 h-7",
  }[size];

  const containerSize = {
    xs: "w-7 h-7",
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-14 h-14",
  }[size];

  const gapClasses = {
    xs: "gap-1",
    sm: "gap-2",
    md: "gap-3",
    lg: "gap-4",
  }[gap];

  const alignClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  }[alignment];

  const directionClass =
    direction === "vertical" ? "flex-col" : "flex-row flex-wrap";

  const hoverClass = {
    none: "",
    lift: "hover:-translate-y-0.5",
    scale: "hover:scale-110",
    glow: "hover:shadow-lg",
    bounce: "hover:animate-bounce",
  }[hoverEffect];

  const textSize = {
    xs: "text-xs",
    sm: "text-xs",
    md: "text-sm",
    lg: "text-sm",
    xl: "text-base",
  }[size];

  const defaultColor = color || "var(--muted-foreground, #6b7280)";

  return (
    <div
      id={id}
      role="list"
      aria-label={ariaLabel || "Social media links"}
      className={`flex items-center ${directionClass} ${gapClasses} ${alignClasses} ${className}`}
    >
      {links.map((link, i) => {
        const platform = SOCIAL_PLATFORMS[link.platform || ""];
        if (!platform) return null;

        const iconColor = useBrandColors ? platform.brandColor : defaultColor;
        const bgColor =
          variant === "buttons" || variant === "pill"
            ? useBrandColors
              ? platform.brandColor
              : backgroundColor || "var(--muted, #f3f4f6)"
            : undefined;
        const fgColor =
          variant === "buttons" || variant === "pill"
            ? useBrandColors
              ? "#ffffff"
              : defaultColor
            : iconColor;

        const variantClasses = {
          icons: "inline-flex items-center justify-center",
          buttons: `${containerSize} inline-flex items-center justify-center rounded-lg`,
          rounded: `${containerSize} inline-flex items-center justify-center rounded-full border`,
          pill: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
          text: "inline-flex items-center gap-1.5",
        }[variant];

        return (
          <a
            key={i}
            role="listitem"
            href={link.url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={`transition-all ${variantClasses} ${hoverClass} hover:opacity-80`}
            style={{
              color: fgColor,
              backgroundColor: bgColor,
              borderColor:
                variant === "rounded"
                  ? useBrandColors
                    ? platform.brandColor
                    : "var(--border, #e5e7eb)"
                  : undefined,
            }}
            aria-label={link.label || platform.label}
          >
            <svg
              className={sizeClasses}
              fill="currentColor"
              viewBox={platform.viewBox || "0 0 24 24"}
              aria-hidden="true"
            >
              <path d={platform.path} />
            </svg>
            {(showLabels || variant === "text") && (
              <span className={textSize}>{link.label || platform.label}</span>
            )}
          </a>
        );
      })}
    </div>
  );
}
// ============================================================================
// FORM - Premium Form Container with 40+ properties
// ============================================================================

export interface FormProps {
  // Content
  children?: React.ReactNode;
  title?: string;
  description?: string;

  // Form Settings
  action?: string;
  method?: "GET" | "POST";
  enctype?:
    | "application/x-www-form-urlencoded"
    | "multipart/form-data"
    | "text/plain";
  novalidate?: boolean;
  autocomplete?: "on" | "off";

  // Layout
  layout?: "vertical" | "horizontal" | "inline" | "grid-2" | "grid-3";
  gap?: "xs" | "sm" | "md" | "lg" | "xl";
  labelPosition?: "top" | "left" | "floating";
  alignItems?: "start" | "center" | "end";

  // Sizing
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  fullWidth?: boolean;

  // Appearance
  backgroundColor?: string;
  padding?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  borderRadius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
  border?: boolean;
  borderColor?: string;
  borderWidth?: "1" | "2" | "3";

  // Header Styling
  showHeader?: boolean;
  headerAlign?: "left" | "center" | "right";
  titleSize?: "sm" | "md" | "lg" | "xl";
  titleColor?: string;
  descriptionColor?: string;
  headerSpacing?: "sm" | "md" | "lg";

  // Dividers
  showDividers?: boolean;
  dividerColor?: string;

  // Submit Button (built-in)
  showSubmitButton?: boolean;
  submitText?: string;
  submitVariant?: "primary" | "secondary" | "outline";
  submitSize?: "sm" | "md" | "lg";
  submitFullWidth?: boolean;
  submitColor?: string;
  submitPosition?: "left" | "center" | "right" | "full";

  // Reset Button
  showResetButton?: boolean;
  resetText?: string;

  // Loading & States
  isLoading?: boolean;
  loadingText?: string;
  disabled?: boolean;

  // Success/Error States
  successMessage?: string;
  errorMessage?: string;
  showSuccessIcon?: boolean;
  showErrorIcon?: boolean;

  // Animation
  animateOnLoad?: boolean;
  animationType?: "fade" | "slide" | "scale";

  // Misc
  id?: string;
  className?: string;
  onSubmit?: (e: React.FormEvent) => void;

  // Platform submission
  siteId?: string;
  formId?: string;
  enablePlatformSubmission?: boolean;
}

export function FormRender({
  // Content
  children,
  title,
  description,

  // Form Settings
  action = "#",
  method = "POST",
  enctype,
  novalidate = false,
  autocomplete = "on",

  // Layout
  layout = "vertical",
  gap = "md",
  labelPosition = "top",
  alignItems = "start",

  // Sizing
  maxWidth = "full",
  fullWidth = false,

  // Appearance
  backgroundColor,
  padding = "none",
  borderRadius = "none",
  shadow = "none",
  border = false,
  borderColor = "#e5e7eb",
  borderWidth = "1",

  // Header Styling
  showHeader = true,
  headerAlign = "left",
  titleSize = "lg",
  titleColor,
  descriptionColor,
  headerSpacing = "md",

  // Dividers
  showDividers = false,
  dividerColor = "#e5e7eb",

  // Submit Button
  showSubmitButton = true,
  submitText = "Submit",
  submitVariant = "primary",
  submitSize = "md",
  submitFullWidth = false,
  submitColor = "",
  submitPosition = "left",

  // Reset Button
  showResetButton = false,
  resetText = "Reset",

  // Loading & States
  isLoading = false,
  loadingText = "Submitting...",
  disabled = false,

  // Success/Error States
  successMessage,
  errorMessage,
  showSuccessIcon = true,
  showErrorIcon = true,

  // Animation
  animateOnLoad = false,
  animationType = "fade",

  // Misc
  id,
  className = "",
  onSubmit,

  // Platform submission
  siteId,
  formId,
  enablePlatformSubmission,
}: FormProps) {
  // Auto-enable platform submission when siteId is available (renderer always injects it)
  // This ensures every AI-generated Form submits to the platform out of the gate
  const effectivePlatformSubmission = enablePlatformSubmission ?? !!siteId;

  const [platformStatus, setPlatformStatus] = React.useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [platformError, setPlatformError] = React.useState("");
  const formRef = React.useRef<HTMLFormElement>(null);

  const handlePlatformSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (platformStatus === "submitting") return;

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Honeypot check
    if (formData.get("_honeypot")) {
      setPlatformStatus("success");
      return;
    }

    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
      if (!key.startsWith("_")) {
        data[key] = String(value);
      }
    });

    setPlatformStatus("submitting");
    setPlatformError("");

    try {
      const res = await fetch("/api/forms/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          formId: formId || "form",
          data,
          honeypot: formData.get("_honeypot") || "",
        }),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        setPlatformError(
          result.error || "Something went wrong. Please try again.",
        );
        setPlatformStatus("error");
        return;
      }

      setPlatformStatus("success");
      formRef.current?.reset();
    } catch {
      setPlatformError(
        "Network error. Please check your connection and try again.",
      );
      setPlatformStatus("error");
    }
  };

  const resolvedOnSubmit = effectivePlatformSubmission
    ? handlePlatformSubmit
    : onSubmit;
  const resolvedIsLoading = effectivePlatformSubmission
    ? platformStatus === "submitting"
    : isLoading;
  const resolvedSuccessMessage =
    effectivePlatformSubmission && platformStatus === "success"
      ? successMessage || "Submitted successfully!"
      : successMessage;
  const resolvedErrorMessage =
    effectivePlatformSubmission && platformStatus === "error"
      ? platformError
      : errorMessage;

  // Gap classes
  const gapClasses = {
    xs: "gap-2",
    sm: "gap-3",
    md: "gap-4 md:gap-6",
    lg: "gap-6 md:gap-8",
    xl: "gap-8 md:gap-10",
  }[gap];

  // Max width classes
  const maxWClasses = {
    xs: "max-w-xs",
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    full: "max-w-full",
  }[maxWidth];

  // Padding classes
  const paddingClasses = {
    none: "",
    xs: "p-2",
    sm: "p-4",
    md: "p-6 md:p-8",
    lg: "p-8 md:p-10",
    xl: "p-10 md:p-12",
  }[padding];

  // Border radius classes
  const radiusClasses = {
    none: "",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
  }[borderRadius];

  // Shadow classes
  const shadowClasses = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
  }[shadow];

  // Layout classes
  const layoutClasses = {
    vertical: "flex flex-col",
    horizontal: "grid md:grid-cols-2",
    inline: "flex flex-wrap items-end",
    "grid-2": "grid grid-cols-1 md:grid-cols-2",
    "grid-3": "grid grid-cols-1 md:grid-cols-3",
  }[layout];

  // Title size classes
  const titleSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  }[titleSize];

  // Header spacing classes
  const headerSpacingClasses = {
    sm: "mb-4",
    md: "mb-6",
    lg: "mb-8",
  }[headerSpacing];

  // Submit position classes
  const submitPositionClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
    full: "",
  }[submitPosition];

  // Submit button variant classes — colors applied via inline styles (submitColor prop)
  const submitButtonClasses = {
    primary: `text-white hover:opacity-90`,
    secondary: `hover:opacity-90`,
    outline: `bg-transparent border-2 border-current hover:opacity-80`,
  }[submitVariant];

  // Submit size classes
  const submitSizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-2.5 text-base",
    lg: "px-8 py-3 text-lg",
  }[submitSize];

  // Animation classes
  const animationClass = animateOnLoad
    ? {
        fade: "animate-fadeIn",
        slide: "animate-slideUp",
        scale: "animate-scaleIn",
      }[animationType]
    : "";

  // Border styles
  const borderStyles: React.CSSProperties = border
    ? {
        borderColor,
        borderWidth: `${borderWidth}px`,
        borderStyle: "solid",
      }
    : {};

  return (
    <form
      ref={formRef}
      id={id}
      action={effectivePlatformSubmission ? undefined : action}
      method={effectivePlatformSubmission ? undefined : method}
      encType={enctype}
      noValidate={novalidate}
      autoComplete={autocomplete}
      className={`
        ${layoutClasses} ${gapClasses} ${maxWClasses} ${paddingClasses}
        ${radiusClasses} ${shadowClasses} ${animationClass}
        ${fullWidth ? "w-full" : ""} ${className}
      `
        .replace(/\s+/g, " ")
        .trim()}
      style={{ backgroundColor, ...borderStyles }}
      onSubmit={resolvedOnSubmit}
    >
      {/* Honeypot field for platform submission */}
      {effectivePlatformSubmission && (
        <input
          type="text"
          name="_honeypot"
          tabIndex={-1}
          autoComplete="off"
          style={{
            position: "absolute",
            left: "-9999px",
            opacity: 0,
            height: 0,
            width: 0,
          }}
          aria-hidden="true"
        />
      )}
      {/* Header */}
      {showHeader && (title || description) && (
        <div
          className={`${layout === "horizontal" || layout.startsWith("grid") ? "col-span-full" : ""} ${headerSpacingClasses} text-${headerAlign}`}
        >
          {title && (
            <h3
              className={`${titleSizeClasses} font-bold`}
              style={{ color: titleColor }}
            >
              {title}
            </h3>
          )}
          {description && (
            <p
              className="mt-2 text-sm"
              style={{ color: descriptionColor || "#6b7280" }}
            >
              {description}
            </p>
          )}
          {showDividers && (
            <hr className="mt-4" style={{ borderColor: dividerColor }} />
          )}
        </div>
      )}

      {/* Form Fields */}
      {children}

      {/* Success Message */}
      {resolvedSuccessMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`${layout === "horizontal" || layout.startsWith("grid") ? "col-span-full" : ""} p-4 rounded-lg flex items-center gap-2`}
          style={{ backgroundColor: "#f0fdf4", color: "#15803d" }}
        >
          {showSuccessIcon && <span>✓</span>}
          {resolvedSuccessMessage}
        </div>
      )}

      {/* Error Message */}
      {resolvedErrorMessage && (
        <div
          role="alert"
          className={`${layout === "horizontal" || layout.startsWith("grid") ? "col-span-full" : ""} p-4 rounded-lg flex items-center gap-2`}
          style={{ backgroundColor: "#fef2f2", color: "#b91c1c" }}
        >
          {showErrorIcon && <span>✕</span>}
          {resolvedErrorMessage}
        </div>
      )}

      {/* Buttons */}
      {(showSubmitButton || showResetButton) && (
        <div
          className={`${layout === "horizontal" || layout.startsWith("grid") ? "col-span-full" : ""} flex ${submitPositionClasses} gap-3 mt-2`}
        >
          {showResetButton && (
            <button
              type="reset"
              className="px-4 py-2 opacity-70 hover:opacity-100 transition-opacity"
              disabled={disabled || resolvedIsLoading}
            >
              {resetText}
            </button>
          )}
          {showSubmitButton && (
            <button
              type="submit"
              className={`${submitButtonClasses} ${submitSizeClasses} ${submitFullWidth || submitPosition === "full" ? "w-full" : ""} rounded-lg font-medium transition-all disabled:opacity-50`}
              style={
                submitVariant === "primary"
                  ? { backgroundColor: submitColor }
                  : submitVariant === "secondary"
                    ? {
                        backgroundColor: `${submitColor}18`,
                        color: submitColor,
                      }
                    : { borderColor: submitColor, color: submitColor }
              }
              disabled={disabled || resolvedIsLoading}
              aria-busy={resolvedIsLoading}
            >
              {resolvedIsLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  {loadingText}
                </span>
              ) : (
                submitText
              )}
            </button>
          )}
        </div>
      )}
    </form>
  );
}

// ============================================================================
// FORM FIELD - Premium Input Field with 50+ properties
// ============================================================================

export interface FormFieldProps {
  // Label & Name
  label?: string;
  name?: string;

  // Input Type
  type?:
    | "text"
    | "email"
    | "password"
    | "tel"
    | "url"
    | "number"
    | "date"
    | "time"
    | "datetime-local"
    | "textarea"
    | "select"
    | "checkbox"
    | "radio"
    | "range"
    | "file"
    | "color"
    | "hidden";

  // Values
  placeholder?: string;
  value?: string;
  defaultValue?: string;

  // Validation
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  min?: number;
  max?: number;
  step?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;

  // Select/Radio Options
  options?: Array<{ value?: string; label?: string; disabled?: boolean }>;

  // Textarea
  rows?: number;
  cols?: number;
  resize?: "none" | "vertical" | "horizontal" | "both";

  // File
  accept?: string;
  multiple?: boolean;

  // Autocomplete
  autocomplete?: string;
  autofocus?: boolean;
  spellcheck?: boolean;

  // Help & Error
  helpText?: string;
  error?: string;
  success?: string;
  showCharCount?: boolean;

  // Styling
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "default" | "filled" | "underline" | "ghost";
  fullWidth?: boolean;

  // Label
  hideLabel?: boolean;
  labelPosition?: "top" | "left" | "floating";
  labelSize?: "sm" | "md" | "lg";
  labelColor?: string;
  labelWeight?: "normal" | "medium" | "semibold" | "bold";
  requiredIndicator?: "*" | "required" | "none";

  // Icon
  iconEmoji?: string;
  iconPosition?: "left" | "right";
  iconColor?: string;

  // Prefix/Suffix
  prefix?: string;
  suffix?: string;
  prefixColor?: string;
  suffixColor?: string;

  // Border & Colors
  borderColor?: string;
  focusBorderColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: "none" | "sm" | "md" | "lg" | "xl" | "full";

  // States
  showSuccessState?: boolean;
  showErrorState?: boolean;

  // Clear Button
  showClearButton?: boolean;

  // Password Toggle
  showPasswordToggle?: boolean;

  // Counter
  showCounter?: boolean;

  // Misc
  id?: string;
  className?: string;
  containerClassName?: string;
  inputClassName?: string;
  onChange?: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  onBlur?: (
    e: React.FocusEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  onFocus?: (
    e: React.FocusEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
}

export function FormFieldRender({
  // Label & Name
  label,
  name,

  // Input Type
  type = "text",

  // Values
  placeholder,
  value,
  defaultValue,

  // Validation
  required = false,
  disabled = false,
  readonly = false,
  min,
  max,
  step,
  minLength,
  maxLength,
  pattern,

  // Select Options
  options = [],

  // Textarea
  rows = 4,
  cols,
  resize = "vertical",

  // File
  accept,
  multiple = false,

  // Autocomplete
  autocomplete,
  autofocus = false,
  spellcheck,

  // Help & Error
  helpText,
  error,
  success,
  showCharCount = false,

  // Styling
  size = "md",
  variant = "default",
  fullWidth = true,

  // Label
  hideLabel = false,
  labelPosition = "top",
  labelSize = "sm",
  labelColor,
  labelWeight = "medium",
  requiredIndicator = "*",

  // Icon
  iconEmoji,
  iconPosition = "left",
  iconColor = "#9ca3af",

  // Prefix/Suffix
  prefix,
  suffix,
  prefixColor = "#6b7280",
  suffixColor = "#6b7280",

  // Border & Colors
  borderColor = "#d1d5db",
  focusBorderColor = "",
  backgroundColor = "#ffffff",
  textColor,
  borderRadius = "lg",

  // Clear Button
  showClearButton = false,

  // Password Toggle
  showPasswordToggle = false,

  // Misc
  id,
  className = "",
  containerClassName = "",
  inputClassName = "",
  onChange,
  onBlur,
  onFocus,
}: FormFieldProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [charCount, setCharCount] = React.useState(0);

  // Size classes
  const sizeClasses = {
    xs: "px-2 py-1 text-xs",
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-base",
    lg: "px-5 py-3 text-lg",
    xl: "px-6 py-4 text-xl",
  }[size];

  // Variant classes — use inline backgroundColor instead of hardcoded Tailwind
  const variantClasses = {
    default: "border",
    filled: "border-0",
    underline: "border-0 border-b-2 bg-transparent rounded-none",
    ghost: "border-0 bg-transparent",
  }[variant];

  // Border radius classes
  const radiusClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    full: "rounded-full",
  }[borderRadius];

  // Label size classes
  const labelSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  }[labelSize];

  // Label weight classes
  const labelWeightClasses = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
  }[labelWeight];

  // State classes — use focusBorderColor prop instead of hardcoded blue
  const stateClasses = error
    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
    : success
      ? "border-green-500 focus:border-green-500 focus:ring-green-500/20"
      : "focus:ring-2";

  // Base input classes
  const baseClasses = `
    ${sizeClasses} ${variantClasses} ${radiusClasses} ${stateClasses}
    ${fullWidth ? "w-full" : ""} 
    ${disabled ? "opacity-50 cursor-not-allowed" : ""} 
    transition-all duration-200 outline-none
    ${iconEmoji && iconPosition === "left" ? "pl-10" : ""}
    ${iconEmoji && iconPosition === "right" ? "pr-10" : ""}
    ${prefix ? "pl-8" : ""}
    ${suffix || showClearButton || (type === "password" && showPasswordToggle) ? "pr-10" : ""}
    ${inputClassName}
  `
    .replace(/\s+/g, " ")
    .trim();

  // Inline styles for theme-aware input styling
  const inputStyles: React.CSSProperties = {
    backgroundColor:
      variant === "underline" || variant === "ghost"
        ? "transparent"
        : backgroundColor,
    color: textColor || undefined,
    borderColor: error ? "#ef4444" : success ? "#22c55e" : borderColor,
    // Use focusBorderColor via CSS custom properties
  };
  const focusRingColor = error
    ? "rgba(239,68,68,0.2)"
    : success
      ? "rgba(34,197,94,0.2)"
      : `${focusBorderColor}33`;
  const inputFocusHandlers = {
    onFocus: (
      e: React.FocusEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      if (!error && !success) {
        e.currentTarget.style.borderColor = focusBorderColor;
        e.currentTarget.style.boxShadow = `0 0 0 3px ${focusRingColor}`;
      }
      onFocus?.(e);
    },
    onBlur: (
      e: React.FocusEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      if (!error && !success) {
        e.currentTarget.style.borderColor = borderColor;
        e.currentTarget.style.boxShadow = "none";
      }
      onBlur?.(e);
    },
  };

  const fieldId = id || name;
  const inputType = type === "password" && showPassword ? "text" : type;
  const helpId = helpText ? `${fieldId}-help` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const successId = success ? `${fieldId}-success` : undefined;
  const describedBy =
    [errorId, successId, helpId].filter(Boolean).join(" ") || undefined;
  const ariaProps = {
    "aria-required": required || undefined,
    "aria-invalid": error ? (true as const) : undefined,
    "aria-describedby": describedBy,
  };

  // Handle change with char count
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    if (showCharCount || maxLength) {
      setCharCount(e.target.value.length);
    }
    onChange?.(e);
  };

  // Render the input element
  const renderInput = () => {
    // Theme-aware styles using the resolved input styling
    const commonStyles: React.CSSProperties = {
      ...inputStyles,
    };

    if (type === "textarea") {
      return (
        <textarea
          id={fieldId}
          name={name}
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          required={required}
          disabled={disabled}
          readOnly={readonly}
          rows={rows}
          cols={cols}
          minLength={minLength}
          maxLength={maxLength}
          autoFocus={autofocus}
          spellCheck={spellcheck}
          className={baseClasses}
          style={{ ...commonStyles, resize }}
          onChange={handleChange}
          {...ariaProps}
          {...inputFocusHandlers}
        />
      );
    }

    if (type === "select") {
      return (
        <select
          id={fieldId}
          name={name}
          value={value}
          defaultValue={defaultValue}
          required={required}
          disabled={disabled}
          className={baseClasses}
          style={commonStyles}
          onChange={handleChange}
          {...ariaProps}
          {...inputFocusHandlers}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt, i) => (
            <option key={i} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    if (type === "checkbox" || type === "radio") {
      return (
        <div className="flex items-center gap-2">
          <input
            id={fieldId}
            name={name}
            type={type}
            value={value}
            defaultValue={defaultValue}
            required={required}
            disabled={disabled}
            className="w-4 h-4 rounded"
            style={{
              accentColor: focusBorderColor || "var(--brand-primary, #3b82f6)",
            }}
            onChange={handleChange}
          />
          {label && !hideLabel && (
            <label
              htmlFor={fieldId}
              className="text-sm"
              style={{ color: labelColor || "inherit" }}
            >
              {label}
            </label>
          )}
        </div>
      );
    }

    return (
      <input
        id={fieldId}
        name={name}
        type={inputType}
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        required={required}
        disabled={disabled}
        readOnly={readonly}
        min={min}
        max={max}
        step={step}
        minLength={minLength}
        maxLength={maxLength}
        pattern={pattern}
        autoComplete={autocomplete}
        autoFocus={autofocus}
        spellCheck={spellcheck}
        accept={accept}
        multiple={multiple}
        className={baseClasses}
        style={commonStyles}
        onChange={handleChange}
        {...ariaProps}
        {...inputFocusHandlers}
      />
    );
  };

  // For checkbox/radio, return simple layout
  if (type === "checkbox" || type === "radio") {
    return (
      <div className={`${className} ${containerClassName}`}>
        {renderInput()}
        {helpText && !error && (
          <p id={helpId} className="mt-1 text-xs text-gray-500">
            {helpText}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="mt-1 text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`${className} ${containerClassName}`}>
      {/* Label */}
      {label && !hideLabel && labelPosition !== "floating" && (
        <label
          htmlFor={fieldId}
          className={`block ${labelSizeClasses} ${labelWeightClasses} mb-1.5`}
          style={{ color: labelColor || "#374151" }}
        >
          {label}
          {required && requiredIndicator !== "none" && (
            <span className="text-red-500 ml-1">
              {requiredIndicator === "*" ? "*" : "(required)"}
            </span>
          )}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Prefix */}
        {prefix && (
          <div
            className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
            style={{ color: prefixColor }}
          >
            {prefix}
          </div>
        )}

        {/* Icon Left */}
        {iconEmoji && iconPosition === "left" && (
          <div
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: iconColor }}
          >
            {iconEmoji}
          </div>
        )}

        {/* Input */}
        {renderInput()}

        {/* Icon Right */}
        {iconEmoji && iconPosition === "right" && (
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: iconColor }}
          >
            {iconEmoji}
          </div>
        )}

        {/* Suffix */}
        {suffix && (
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
            style={{ color: suffixColor }}
          >
            {suffix}
          </div>
        )}

        {/* Password Toggle */}
        {type === "password" && showPasswordToggle && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-80"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "👁️" : "👁️‍🗨️"}
          </button>
        )}

        {/* Clear Button */}
        {showClearButton && value && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-80"
          >
            ✕
          </button>
        )}
      </div>

      {/* Help Text / Error / Success */}
      <div className="flex justify-between mt-1.5">
        <div>
          {helpText && !error && !success && (
            <p id={helpId} className="text-sm opacity-60">
              {helpText}
            </p>
          )}
          {error && (
            <p id={errorId} role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          {success && !error && (
            <p id={successId} className="text-sm text-green-600">
              {success}
            </p>
          )}
        </div>

        {/* Character Count */}
        {(showCharCount || maxLength) && type !== "select" && (
          <span className="text-xs opacity-50">
            {charCount}
            {maxLength ? `/${maxLength}` : ""}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// CONTACT FORM - Pre-built Contact Form
// ============================================================================

export interface ContactFormProps {
  title?: string;
  subtitle?: string;
  nameLabel?: string;
  emailLabel?: string;
  phoneLabel?: string;
  subjectLabel?: string;
  messageLabel?: string;
  submitText?: string;
  showPhone?: boolean;
  showSubject?: boolean;
  backgroundColor?: string;
  borderRadius?: "none" | "sm" | "md" | "lg" | "xl";
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
  padding?: "sm" | "md" | "lg";
  buttonColor?: string;
  buttonTextColor?: string;
  textColor?: string;
  inputBackgroundColor?: string;
  inputBorderColor?: string;
  inputTextColor?: string;
  labelColor?: string;
  successMessage?: string;
  action?: string;
  siteId?: string;
  emailTo?: string;
  id?: string;
  className?: string;
}

export function ContactFormRender({
  title = "Contact Us",
  subtitle,
  nameLabel = "Full Name",
  emailLabel = "Email Address",
  phoneLabel = "Phone Number",
  subjectLabel = "Subject",
  messageLabel = "Message",
  submitText = "Send Message",
  showPhone = false,
  showSubject = true,
  backgroundColor = "#ffffff",
  borderRadius = "xl",
  shadow = "lg",
  padding = "lg",
  buttonColor,
  buttonTextColor = "#ffffff",
  textColor,
  inputBackgroundColor,
  inputBorderColor,
  inputTextColor,
  labelColor,
  successMessage = "Thanks! We'll be in touch.",
  siteId,
  emailTo,
  id,
  className = "",
}: ContactFormProps) {
  const [status, setStatus] = React.useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = React.useState("");
  const formRef = React.useRef<HTMLFormElement>(null);

  const paddingClasses = {
    sm: "p-4 md:p-6",
    md: "p-6 md:p-8",
    lg: "p-8 md:p-10",
  }[padding];
  const radiusClasses = {
    none: "",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
  }[borderRadius];
  const shadowClasses = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
  }[shadow];
  const isDark = isDarkBackground(backgroundColor);
  const resolvedButtonColor =
    buttonColor || (isDark ? "#e5a956" : "var(--brand-primary, #3b82f6)");
  const resolvedTextColor = resolveContrastColor(textColor || (isDark ? "#f9fafb" : "#1f2937"), isDark);
  const resolvedSubtitleColor = isDark ? "#9ca3af" : "#6b7280";
  const resolvedInputBg =
    inputBackgroundColor || (isDark ? "#374151" : "#ffffff");
  const resolvedInputBorder =
    inputBorderColor || (isDark ? "#4b5563" : "#d1d5db");
  const resolvedInputText = inputTextColor || (isDark ? "#f9fafb" : "#1f2937");
  const resolvedLabelColor = labelColor || (isDark ? "#e5e7eb" : "#374151");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "submitting") return;

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Honeypot check — if the hidden field has a value, silently "succeed"
    if (formData.get("_honeypot")) {
      setStatus("success");
      return;
    }

    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
      if (!key.startsWith("_")) {
        data[key] = String(value);
      }
    });
    if (emailTo) {
      data._emailTo = emailTo;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/forms/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          formId: "contact-form",
          data,
          honeypot: formData.get("_honeypot") || "",
        }),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        setErrorMessage(
          result.error || "Something went wrong. Please try again.",
        );
        setStatus("error");
        return;
      }

      setStatus("success");
      formRef.current?.reset();
    } catch {
      setErrorMessage(
        "Network error. Please check your connection and try again.",
      );
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div
        id={id}
        role="status"
        aria-live="polite"
        className={`max-w-lg mx-auto ${paddingClasses} ${radiusClasses} ${shadowClasses} ${className}`}
        style={{ backgroundColor }}
      >
        <div className="text-center py-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ backgroundColor: `${resolvedButtonColor}20` }}
          >
            <svg
              className="w-8 h-8"
              style={{ color: resolvedButtonColor }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3
            className="text-lg font-semibold mb-2"
            style={{ color: resolvedTextColor }}
          >
            {successMessage}
          </h3>
          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="mt-4 text-sm underline opacity-70 hover:opacity-100 transition-opacity"
            style={{ color: resolvedTextColor }}
          >
            Send another message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      id={id}
      className={`max-w-lg mx-auto ${paddingClasses} ${radiusClasses} ${shadowClasses} ${className}`}
      style={{ backgroundColor }}
    >
      {title && (
        <h2
          className="text-xl md:text-2xl lg:text-3xl font-bold mb-2"
          style={{ color: resolvedTextColor }}
        >
          {title}
        </h2>
      )}
      {subtitle && (
        <p className="mb-6" style={{ color: resolvedSubtitleColor }}>
          {subtitle}
        </p>
      )}
      {status === "error" && errorMessage && (
        <div
          role="alert"
          className="mb-4 p-3 rounded-lg text-sm"
          style={{
            backgroundColor: "#fef2f2",
            color: "#991b1b",
            border: "1px solid #fecaca",
          }}
        >
          {errorMessage}
        </div>
      )}
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="space-y-4 md:space-y-6"
      >
        {/* Honeypot field — hidden from real users, bots fill it triggering spam detection */}
        <input
          type="text"
          name="_honeypot"
          tabIndex={-1}
          autoComplete="off"
          style={{
            position: "absolute",
            left: "-9999px",
            opacity: 0,
            height: 0,
            width: 0,
          }}
          aria-hidden="true"
        />
        <div className="grid md:grid-cols-2 gap-4">
          <FormFieldRender
            label={nameLabel}
            name="name"
            placeholder="Full Name"
            required
            labelColor={resolvedLabelColor}
            backgroundColor={resolvedInputBg}
            borderColor={resolvedInputBorder}
            textColor={resolvedInputText}
            focusBorderColor={resolvedButtonColor}
          />
          <FormFieldRender
            label={emailLabel}
            name="email"
            type="email"
            placeholder="john@example.com"
            required
            labelColor={resolvedLabelColor}
            backgroundColor={resolvedInputBg}
            borderColor={resolvedInputBorder}
            textColor={resolvedInputText}
            focusBorderColor={resolvedButtonColor}
          />
        </div>
        {(showPhone || showSubject) && (
          <div className="grid md:grid-cols-2 gap-4">
            {showPhone && (
              <FormFieldRender
                label={phoneLabel}
                name="phone"
                type="tel"
                placeholder="+260 97X XXX XXX"
                labelColor={resolvedLabelColor}
                backgroundColor={resolvedInputBg}
                borderColor={resolvedInputBorder}
                textColor={resolvedInputText}
                focusBorderColor={resolvedButtonColor}
              />
            )}
            {showSubject && (
              <FormFieldRender
                label={subjectLabel}
                name="subject"
                placeholder="How can we help?"
                labelColor={resolvedLabelColor}
                backgroundColor={resolvedInputBg}
                borderColor={resolvedInputBorder}
                textColor={resolvedInputText}
                focusBorderColor={resolvedButtonColor}
              />
            )}
          </div>
        )}
        <FormFieldRender
          label={messageLabel}
          name="message"
          type="textarea"
          placeholder="Your message..."
          rows={5}
          required
          labelColor={resolvedLabelColor}
          backgroundColor={resolvedInputBg}
          borderColor={resolvedInputBorder}
          textColor={resolvedInputText}
          focusBorderColor={resolvedButtonColor}
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          aria-busy={status === "submitting"}
          className="w-full px-6 py-3 font-medium rounded-lg transition-all duration-200 hover:opacity-90 focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            backgroundColor: resolvedButtonColor,
            color: buttonTextColor,
            boxShadow: `0 0 0 0 transparent`,
            ["--tw-ring-color" as string]: resolvedButtonColor,
          }}
        >
          {status === "submitting" ? "Sending..." : submitText}
        </button>
      </form>
    </div>
  );
}

// ============================================================================
// NEWSLETTER - Newsletter Signup
// ============================================================================

export interface NewsletterProps {
  title?: string;
  description?: string;
  placeholder?: string;
  buttonText?: string;
  variant?: "inline" | "stacked" | "card";
  backgroundColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  textColor?: string;
  inputBackgroundColor?: string;
  inputBorderColor?: string;
  inputTextColor?: string;
  size?: "sm" | "md" | "lg";
  successMessage?: string;
  errorMessage?: string;
  borderRadius?: "none" | "sm" | "md" | "lg" | "xl";
  siteId?: string;
  id?: string;
  className?: string;
}

export function NewsletterRender({
  title = "Subscribe to our newsletter",
  description = "Get the latest news and updates delivered to your inbox.",
  placeholder = "Enter your email",
  buttonText = "Subscribe",
  variant = "inline",
  backgroundColor,
  buttonColor = "",
  buttonTextColor = "#ffffff",
  textColor,
  inputBackgroundColor,
  inputBorderColor: inputBorderColorProp,
  inputTextColor: inputTextColorProp,
  size = "md",
  successMessage = "Thanks for subscribing!",
  errorMessage: errorMessageProp,
  borderRadius = "lg",
  siteId,
  id,
  className = "",
}: NewsletterProps) {
  const [status, setStatus] = React.useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = React.useState("");

  const sizeClasses = { sm: "text-sm", md: "text-base", lg: "text-lg" }[size];
  const inputSizeClasses = {
    sm: "px-3 py-2",
    md: "px-4 py-2.5",
    lg: "px-5 py-3",
  }[size];
  const radiusClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
  }[borderRadius];

  const bgDark = isDarkBackground(backgroundColor);

  const resolvedTextColor = resolveContrastColor(textColor || (bgDark ? "#f8fafc" : "#1f2937"), bgDark);
  const resolvedInputBorder =
    inputBorderColorProp ||
    (bgDark ? "rgba(255,255,255,0.2)" : `${buttonColor || "#d1d5db"}30`);
  const resolvedInputText =
    inputTextColorProp || (bgDark ? "#f8fafc" : "#1f2937");
  const resolvedInputBg =
    inputBackgroundColor || (bgDark ? "rgba(255,255,255,0.08)" : "transparent");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "loading") return;

    const formData = new FormData(e.currentTarget);

    // Honeypot check — bots fill it, real users can't see it
    if (formData.get("_honeypot")) {
      setStatus("success");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/forms/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          formId: "newsletter",
          data: { email: formData.get("email") },
          honeypot: formData.get("_honeypot") || "",
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        setErrorMsg(
          result.error ||
            errorMessageProp ||
            "Something went wrong. Please try again.",
        );
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  };

  const emailInputId = `newsletter-email-${id || "default"}`;

  // Honeypot field — hidden from real users, bots fill it
  const honeypotField = (
    <input
      type="text"
      name="_honeypot"
      tabIndex={-1}
      autoComplete="off"
      style={{
        position: "absolute",
        left: "-9999px",
        opacity: 0,
        height: 0,
        width: 0,
      }}
      aria-hidden="true"
    />
  );

  // Success state
  if (status === "success") {
    return (
      <section
        id={id}
        className={`w-full py-12 md:py-16 px-4 ${className}`}
        style={{ backgroundColor: backgroundColor || undefined }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
            style={{ backgroundColor: `${buttonColor || "#22c55e"}20` }}
          >
            <svg
              className="w-6 h-6"
              style={{ color: buttonColor || "#22c55e" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p
            className={`${sizeClasses} font-medium`}
            style={{ color: resolvedTextColor }}
            role="status"
            aria-live="polite"
          >
            {successMessage}
          </p>
          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="mt-3 text-sm underline opacity-70 hover:opacity-100 transition-opacity"
            style={{ color: resolvedTextColor }}
          >
            Subscribe another email
          </button>
        </div>
      </section>
    );
  }

  if (variant === "card") {
    return (
      <section
        id={id}
        className={`w-full py-12 md:py-16 px-4 ${className}`}
        style={{ backgroundColor: backgroundColor || undefined }}
      >
        <div className="max-w-2xl mx-auto">
          <div
            className={`p-8 md:p-10 ${radiusClasses === "rounded-lg" ? "rounded-2xl" : radiusClasses} shadow-lg text-center`}
            style={{
              backgroundColor: bgDark ? "rgba(255,255,255,0.05)" : "#ffffff",
              border: bgDark
                ? "1px solid rgba(255,255,255,0.1)"
                : "1px solid #e5e7eb",
            }}
          >
            <h3
              className={`font-bold mb-3 ${size === "lg" ? "text-xl md:text-2xl" : "text-lg md:text-xl"}`}
              style={{ color: resolvedTextColor }}
            >
              {title}
            </h3>
            <p
              className={`${sizeClasses} mb-6`}
              style={{ color: resolvedTextColor, opacity: 0.8 }}
            >
              {description}
            </p>
            {status === "error" && errorMsg && (
              <div
                className="mb-4 p-3 rounded-lg text-sm"
                role="alert"
                style={{
                  backgroundColor: "#fef2f2",
                  color: "#991b1b",
                  border: "1px solid #fecaca",
                }}
              >
                {errorMsg}
              </div>
            )}
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              {honeypotField}
              <label htmlFor={emailInputId} className="sr-only">
                Email address
              </label>
              <input
                id={emailInputId}
                type="email"
                name="email"
                placeholder={placeholder}
                required
                aria-required="true"
                className={`flex-1 ${inputSizeClasses} border ${radiusClasses} focus:ring-2 focus:outline-none`}
                style={{
                  borderColor: resolvedInputBorder,
                  backgroundColor: resolvedInputBg,
                  color: resolvedInputText,
                }}
              />
              <button
                type="submit"
                disabled={status === "loading"}
                aria-busy={status === "loading"}
                className={`${inputSizeClasses} px-6 font-medium ${radiusClasses} transition-opacity hover:opacity-90 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed`}
                style={{ backgroundColor: buttonColor, color: buttonTextColor }}
              >
                {status === "loading" ? "Subscribing..." : buttonText}
              </button>
            </form>
          </div>
        </div>
      </section>
    );
  }

  // Inline/stacked variant
  return (
    <section
      id={id}
      className={`w-full py-12 md:py-16 px-4 ${className}`}
      style={{ backgroundColor: backgroundColor || undefined }}
    >
      <div
        className={`max-w-2xl mx-auto ${variant === "stacked" ? "text-center" : ""}`}
      >
        {title && (
          <h3
            className={`font-bold mb-3 ${size === "lg" ? "text-xl md:text-2xl" : "text-lg"}`}
            style={{ color: resolvedTextColor }}
          >
            {title}
          </h3>
        )}
        {description && (
          <p
            className={`${sizeClasses} mb-6`}
            style={{ color: resolvedTextColor, opacity: 0.8 }}
          >
            {description}
          </p>
        )}
        {status === "error" && errorMsg && (
          <div
            className="mb-4 p-3 rounded-lg text-sm"
            role="alert"
            style={{
              backgroundColor: "#fef2f2",
              color: "#991b1b",
              border: "1px solid #fecaca",
            }}
          >
            {errorMsg}
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          className={`flex ${variant === "stacked" ? "flex-col max-w-md mx-auto" : "flex-col sm:flex-row"} gap-3`}
        >
          {honeypotField}
          <label htmlFor={`${emailInputId}-alt`} className="sr-only">
            Email address
          </label>
          <input
            id={`${emailInputId}-alt`}
            type="email"
            name="email"
            placeholder={placeholder}
            required
            aria-required="true"
            className={`flex-1 ${inputSizeClasses} border ${radiusClasses} focus:ring-2 focus:outline-none`}
            style={{
              borderColor: resolvedInputBorder,
              backgroundColor: resolvedInputBg,
              color: resolvedInputText,
            }}
          />
          <button
            type="submit"
            disabled={status === "loading"}
            aria-busy={status === "loading"}
            className={`${inputSizeClasses} px-6 font-medium ${radiusClasses} transition-opacity hover:opacity-90 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed`}
            style={{ backgroundColor: buttonColor, color: buttonTextColor }}
          >
            {status === "loading" ? "Subscribing..." : buttonText}
          </button>
        </form>
      </div>
    </section>
  );
}
// ============================================================================
// CAROUSEL - Image/Content Carousel
// ============================================================================

export interface CarouselItem {
  image?: string | ImageValue;
  title?: string;
  subtitle?: string;
  description?: string;
  link?: string;
  buttonText?: string;
  buttonStyle?: "primary" | "secondary" | "outline";
  tag?: string;
  overlayColor?: string;
  overlayOpacity?: number;
}

export interface CarouselProps {
  // Header
  title?: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  headerAlign?: "left" | "center" | "right";

  // Slides
  slides?: CarouselItem[];

  // Behaviour
  autoplay?: boolean;
  interval?: number;
  pauseOnHover?: boolean;
  loop?: boolean;
  enableKeyboard?: boolean;
  enableSwipe?: boolean;
  lazyLoad?: boolean;

  // Display
  slidesToShow?: 1 | 2 | 3;
  slidesToScroll?: number;
  variant?: "fullWidth" | "cards" | "thumbnail";
  transition?: "slide" | "fade" | "zoom";
  transitionDuration?: number;
  slideHeight?: "auto" | "sm" | "md" | "lg" | "xl" | "full";

  // Navigation
  showDots?: boolean;
  dotColor?: string;
  activeDotColor?: string;
  dotStyle?: "circle" | "bar" | "number";
  showArrows?: boolean;
  arrowColor?: string;
  arrowBackgroundColor?: string;
  arrowStyle?: "circle" | "square" | "minimal";
  showCounter?: boolean;
  counterColor?: string;

  // Content Overlay
  contentPosition?: "center" | "bottom-left" | "bottom-center" | "top-left";
  overlay?: boolean;
  overlayOpacity?: number;
  textColor?: string;

  // Styling
  aspectRatio?: "video" | "square" | "wide" | "auto";
  borderRadius?: "none" | "sm" | "md" | "lg" | "xl";
  backgroundColor?: string;
  gap?: "none" | "sm" | "md" | "lg";
  paddingY?: "sm" | "md" | "lg" | "xl";
  paddingX?: "sm" | "md" | "lg" | "xl";

  // Accessibility
  ariaLabel?: string;

  id?: string;
  className?: string;
}

export function CarouselRender({
  title,
  subtitle,
  badge,
  badgeColor,
  headerAlign = "center",
  slides = [],
  autoplay = false,
  interval = 5000,
  pauseOnHover = true,
  loop = true,
  enableKeyboard = true,
  enableSwipe = true,
  lazyLoad = true,
  slidesToShow = 1,
  slidesToScroll,
  variant = "fullWidth",
  transition = "slide",
  transitionDuration = 500,
  slideHeight = "auto",
  showDots = true,
  dotColor,
  activeDotColor,
  dotStyle = "circle",
  showArrows = true,
  arrowColor,
  arrowBackgroundColor,
  arrowStyle = "circle",
  showCounter = false,
  counterColor,
  contentPosition = "center",
  overlay = true,
  overlayOpacity = 40,
  textColor = "#ffffff",
  aspectRatio = "video",
  borderRadius = "lg",
  backgroundColor,
  gap = "none",
  paddingY = "lg",
  paddingX = "md",
  ariaLabel = "Image carousel",
  id,
  className = "",
}: CarouselProps) {
  const dark = isDarkBackground(backgroundColor);
  const resolvedTextColor = resolveContrastColor(textColor || "#ffffff", true);
  const resolvedBadgeColor =
    badgeColor || (dark ? "#e5a956" : "var(--brand-primary, #3b82f6)");
  const resolvedHeaderText = dark
    ? "#f8fafc"
    : "var(--color-foreground, #1f2937)";
  const resolvedDotColor =
    dotColor || "var(--color-muted-foreground, rgba(255,255,255,0.5))";
  const resolvedActiveDotColor =
    activeDotColor || "var(--color-foreground, rgba(255,255,255,1))";
  const resolvedArrowBg =
    arrowBackgroundColor || "var(--color-background, rgba(255,255,255,0.8))";
  const resolvedArrowColor = arrowColor || "var(--color-foreground, #111827)";
  const resolvedCounterColor = counterColor || "#ffffff";
  const resolvedSlidesToScroll = slidesToScroll || slidesToShow;

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const [touchStart, setTouchStart] = React.useState<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const totalSlides = slides.length;
  const maxIndex = Math.max(0, totalSlides - slidesToShow);

  // Autoplay
  React.useEffect(() => {
    if (!autoplay || isPaused || totalSlides <= slidesToShow) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + resolvedSlidesToScroll;
        if (next > maxIndex) return loop ? 0 : prev;
        return next;
      });
    }, interval);
    return () => clearInterval(timer);
  }, [
    autoplay,
    isPaused,
    interval,
    loop,
    maxIndex,
    resolvedSlidesToScroll,
    totalSlides,
    slidesToShow,
  ]);

  const goTo = React.useCallback(
    (index: number) => {
      if (index < 0) {
        setCurrentIndex(loop ? maxIndex : 0);
      } else if (index > maxIndex) {
        setCurrentIndex(loop ? 0 : maxIndex);
      } else {
        setCurrentIndex(index);
      }
    },
    [loop, maxIndex],
  );

  const goNext = React.useCallback(
    () => goTo(currentIndex + resolvedSlidesToScroll),
    [currentIndex, resolvedSlidesToScroll, goTo],
  );
  const goPrev = React.useCallback(
    () => goTo(currentIndex - resolvedSlidesToScroll),
    [currentIndex, resolvedSlidesToScroll, goTo],
  );

  // Keyboard navigation
  React.useEffect(() => {
    if (!enableKeyboard) return;
    const el = containerRef.current;
    if (!el) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };
    el.addEventListener("keydown", handleKeyDown);
    return () => el.removeEventListener("keydown", handleKeyDown);
  }, [enableKeyboard, goNext, goPrev]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!enableSwipe) return;
    setTouchStart(e.touches[0].clientX);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!enableSwipe || touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
    setTouchStart(null);
  };

  const pyClasses = paddingYMapUtil[paddingY] || paddingYMapUtil.lg;
  const pxClasses = paddingXMapUtil[paddingX] || paddingXMapUtil.md;

  const heightClasses = {
    auto: "",
    sm: "h-[300px] md:h-[400px]",
    md: "h-[400px] md:h-[500px]",
    lg: "h-[500px] md:h-[600px]",
    xl: "h-[600px] md:h-[700px]",
    full: "h-screen",
  }[slideHeight];

  const aspectClasses =
    slideHeight !== "auto"
      ? ""
      : {
          video: "aspect-video",
          square: "aspect-square",
          wide: "aspect-[21/9]",
          auto: "",
        }[aspectRatio];

  const radiusClasses =
    borderRadiusMapUtil[borderRadius]?.mobile || "rounded-lg";

  const gapClasses = {
    none: "gap-0",
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
  }[gap];

  const arrowShapeClasses = {
    circle: "p-2 rounded-full shadow-lg",
    square: "p-2 rounded-md shadow-lg",
    minimal: "p-1",
  }[arrowStyle];

  const alignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[headerAlign];

  const contentPositionClasses = {
    center: "items-center justify-center text-center",
    "bottom-left": "items-start justify-end text-left pb-8 pl-8",
    "bottom-center": "items-center justify-end text-center pb-8",
    "top-left": "items-start justify-start text-left pt-8 pl-8",
  }[contentPosition];

  const hasHeader = title || subtitle || badge;

  // Determine which slides should be loaded (for lazy loading)
  const shouldLoadSlide = (index: number) => {
    if (!lazyLoad) return true;
    return Math.abs(index - currentIndex) <= slidesToShow;
  };

  // Slide width percentage
  const slideWidthPercent = 100 / slidesToShow;

  // Transition styles
  const getSlideContainerStyle = (): React.CSSProperties => {
    if (transition === "fade") {
      return { position: "relative", width: "100%", height: "100%" };
    }
    return {
      display: "flex",
      transform: `translateX(-${currentIndex * slideWidthPercent}%)`,
      transition: `transform ${transitionDuration}ms ease-in-out`,
    };
  };

  const getSlideStyle = (index: number): React.CSSProperties => {
    if (transition === "fade") {
      return {
        position: index === 0 ? "relative" : "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        opacity: index === currentIndex ? 1 : 0,
        transition: `opacity ${transitionDuration}ms ease-in-out`,
        zIndex: index === currentIndex ? 1 : 0,
      };
    }
    if (transition === "zoom") {
      return {
        flex: `0 0 ${slideWidthPercent}%`,
        transform: index === currentIndex ? "scale(1)" : "scale(0.9)",
        opacity: index === currentIndex ? 1 : 0.5,
        transition: `transform ${transitionDuration}ms ease-in-out, opacity ${transitionDuration}ms ease-in-out`,
      };
    }
    return {
      flex: `0 0 ${slideWidthPercent}%`,
    };
  };

  return (
    <section
      id={id}
      className={`w-full ${pyClasses} ${pxClasses} ${className}`}
      style={{ backgroundColor: backgroundColor || undefined }}
    >
      <div className="max-w-screen-xl mx-auto">
        {/* Section Header */}
        {hasHeader && (
          <div className={`${alignClasses} mb-8 md:mb-12`}>
            {badge && (
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-xs md:text-sm font-medium mb-4"
                style={{
                  backgroundColor: `${resolvedBadgeColor}20`,
                  color: resolvedBadgeColor,
                }}
              >
                {badge}
              </span>
            )}
            {title && (
              <h2
                className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3"
                style={{ color: resolvedHeaderText }}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p
                className="text-base md:text-lg opacity-80 max-w-2xl"
                style={{
                  color: resolvedHeaderText,
                  ...(headerAlign === "center" ? { margin: "0 auto" } : {}),
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Carousel */}
        <div
          ref={containerRef}
          className={`relative overflow-hidden ${radiusClasses} ${heightClasses} ${aspectClasses}`}
          role="region"
          aria-label={ariaLabel}
          aria-roledescription="carousel"
          tabIndex={enableKeyboard ? 0 : undefined}
          onMouseEnter={pauseOnHover ? () => setIsPaused(true) : undefined}
          onMouseLeave={pauseOnHover ? () => setIsPaused(false) : undefined}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className={transition !== "fade" ? `${gapClasses}` : ""}
            style={getSlideContainerStyle()}
          >
            {slides.map((item, i) => {
              const itemImageUrl = getImageUrl(item.image);
              const loaded = shouldLoadSlide(i);
              const itemOverlayColor = item.overlayColor || "rgba(0,0,0,1)";
              const itemOverlayOpacity =
                item.overlayOpacity != null
                  ? item.overlayOpacity / 100
                  : overlayOpacity / 100;

              return (
                <div
                  key={i}
                  className={`${variant === "cards" ? radiusClasses + " overflow-hidden" : ""} w-full h-full relative`}
                  style={getSlideStyle(i)}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`Slide ${i + 1} of ${totalSlides}`}
                >
                  {loaded ? (
                    <img
                      src={itemImageUrl || "/placeholder.svg"}
                      alt={item.title || `Slide ${i + 1}`}
                      className="w-full h-full object-cover"
                      loading={i === 0 ? "eager" : "lazy"}
                    />
                  ) : (
                    <div
                      className="w-full h-full"
                      style={{ backgroundColor: "var(--color-muted, #e5e7eb)" }}
                    />
                  )}
                  {overlay && (
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundColor: itemOverlayColor,
                        opacity: itemOverlayOpacity,
                      }}
                    />
                  )}
                  {item.tag && (
                    <span
                      className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium z-10"
                      style={{
                        backgroundColor: "rgba(0,0,0,0.5)",
                        color: "#ffffff",
                      }}
                    >
                      {item.tag}
                    </span>
                  )}
                  {(item.title || item.description || item.subtitle) && (
                    <div
                      className={`absolute inset-0 flex flex-col ${contentPositionClasses} p-6 z-[2]`}
                    >
                      {item.title && (
                        <h3
                          className="text-xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-3"
                          style={{ color: resolvedTextColor }}
                        >
                          {item.title}
                        </h3>
                      )}
                      {item.subtitle && (
                        <p
                          className="text-sm md:text-base font-medium mb-2 opacity-90"
                          style={{ color: resolvedTextColor }}
                        >
                          {item.subtitle}
                        </p>
                      )}
                      {item.description && (
                        <p
                          className="text-sm md:text-lg max-w-2xl mb-4"
                          style={{ color: resolvedTextColor }}
                        >
                          {item.description}
                        </p>
                      )}
                      {item.link && item.buttonText && (
                        <a
                          href={item.link}
                          className="inline-block px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-colors"
                          style={
                            item.buttonStyle === "outline"
                              ? {
                                  border: "2px solid " + resolvedTextColor,
                                  color: resolvedTextColor,
                                }
                              : item.buttonStyle === "secondary"
                                ? {
                                    backgroundColor: "rgba(255,255,255,0.2)",
                                    color: resolvedTextColor,
                                    backdropFilter: "blur(4px)",
                                  }
                                : {
                                    backgroundColor: "rgba(255,255,255,0.95)",
                                    color: "#111827",
                                  }
                          }
                        >
                          {item.buttonText}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Arrows */}
          {showArrows && totalSlides > slidesToShow && (
            <>
              <button
                className={`absolute left-4 top-1/2 -translate-y-1/2 ${arrowShapeClasses} transition-colors z-10`}
                style={{
                  backgroundColor: resolvedArrowBg,
                  color: resolvedArrowColor,
                }}
                aria-label="Previous slide"
                onClick={goPrev}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                className={`absolute right-4 top-1/2 -translate-y-1/2 ${arrowShapeClasses} transition-colors z-10`}
                style={{
                  backgroundColor: resolvedArrowBg,
                  color: resolvedArrowColor,
                }}
                aria-label="Next slide"
                onClick={goNext}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          )}

          {/* Counter */}
          {showCounter && totalSlides > 1 && (
            <div
              className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium z-10"
              style={{
                backgroundColor: "rgba(0,0,0,0.5)",
                color: resolvedCounterColor,
              }}
            >
              {currentIndex + 1} / {totalSlides}
            </div>
          )}

          {/* Dots */}
          {showDots && totalSlides > slidesToShow && (
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10"
              role="tablist"
            >
              {Array.from({
                length: Math.ceil(totalSlides / resolvedSlidesToScroll),
              }).map((_, i) => {
                const isActive =
                  Math.floor(currentIndex / resolvedSlidesToScroll) === i;
                return (
                  <button
                    key={i}
                    className={`transition-all ${
                      dotStyle === "bar"
                        ? `h-1 rounded-full ${isActive ? "w-6" : "w-2.5"}`
                        : dotStyle === "number"
                          ? "w-6 h-6 rounded-full text-xs font-medium flex items-center justify-center"
                          : "w-2.5 h-2.5 rounded-full"
                    }`}
                    style={{
                      backgroundColor: isActive
                        ? resolvedActiveDotColor
                        : resolvedDotColor,
                      ...(dotStyle === "number" && isActive
                        ? { color: "#000000" }
                        : {}),
                      ...(dotStyle === "number" && !isActive
                        ? { color: "#ffffff" }
                        : {}),
                    }}
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Go to slide ${i + 1}`}
                    onClick={() => goTo(i * resolvedSlidesToScroll)}
                  >
                    {dotStyle === "number" ? i + 1 : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// COUNTDOWN - Countdown Timer
// ============================================================================

export interface CountdownProps {
  targetDate?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  badgeColor?: string;
  labels?: {
    days?: string;
    hours?: string;
    minutes?: string;
    seconds?: string;
  };
  variant?: "default" | "simple" | "cards" | "circles";
  size?: "sm" | "md" | "lg";
  backgroundColor?: string;
  cardBackgroundColor?: string;
  cardBorderRadius?: "sm" | "md" | "lg" | "xl";
  textColor?: string;
  numberColor?: string;
  labelColor?: string;
  accentColor?: string;
  showLabels?: boolean;
  showSeparator?: boolean;
  separator?: ":" | "/" | "•";
  separatorColor?: string;
  expiredMessage?: string;
  ctaText?: string;
  ctaLink?: string;
  ctaColor?: string;
  headerAlign?: "left" | "center" | "right";
  paddingY?: "sm" | "md" | "lg" | "xl";
  paddingX?: "sm" | "md" | "lg" | "xl";
  id?: string;
  className?: string;
}

export function CountdownRender({
  targetDate,
  title,
  subtitle,
  description,
  badge,
  badgeColor,
  labels = {
    days: "Days",
    hours: "Hours",
    minutes: "Minutes",
    seconds: "Seconds",
  },
  variant = "default",
  size = "md",
  backgroundColor,
  cardBackgroundColor,
  cardBorderRadius = "xl",
  textColor,
  numberColor,
  labelColor,
  accentColor = "",
  showLabels = true,
  showSeparator = false,
  separator = ":",
  separatorColor,
  expiredMessage = "This event has ended",
  ctaText,
  ctaLink = "#",
  ctaColor,
  headerAlign = "center",
  paddingY = "lg",
  paddingX = "md",
  id,
  className = "",
}: CountdownProps) {
  const dark = isDarkBackground(backgroundColor);
  const resolvedTextColor = resolveContrastColor(textColor || (dark ? "#f8fafc" : "#1f2937"), dark);
  const resolvedNumberColor = numberColor || accentColor || resolvedTextColor;
  const resolvedLabelColor = labelColor || (dark ? "#94a3b8" : "#6b7280");
  const resolvedCardBg = cardBackgroundColor || (dark ? "#1e293b" : "#f3f4f6");
  const resolvedSepColor = separatorColor || (dark ? "#475569" : "#d1d5db");
  const resolvedCtaColor =
    ctaColor || accentColor || "var(--brand-primary, #3b82f6)";
  const resolvedBadgeColor = badgeColor || accentColor || resolvedCtaColor;

  const pyClasses = paddingYMapUtil[paddingY] || paddingYMapUtil.lg;
  const pxClasses = paddingXMapUtil[paddingX] || paddingXMapUtil.md;

  const cardRadiusClasses =
    borderRadiusMapUtil[cardBorderRadius]?.mobile || "rounded-xl";

  const alignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[headerAlign];

  const sizeClasses = {
    sm: {
      number: "text-2xl md:text-3xl",
      label: "text-xs",
      gap: "gap-3 md:gap-4",
      padding: "p-3",
      separator: "text-xl md:text-2xl",
    },
    md: {
      number: "text-3xl md:text-5xl",
      label: "text-xs md:text-sm",
      gap: "gap-4 md:gap-6",
      padding: "p-4 md:p-5",
      separator: "text-2xl md:text-4xl",
    },
    lg: {
      number: "text-4xl md:text-6xl lg:text-7xl",
      label: "text-sm md:text-base",
      gap: "gap-6 md:gap-8",
      padding: "p-5 md:p-6",
      separator: "text-3xl md:text-5xl",
    },
  }[size];

  const units = [
    { value: "00", label: labels.days },
    { value: "00", label: labels.hours },
    { value: "00", label: labels.minutes },
    { value: "00", label: labels.seconds },
  ];

  return (
    <section
      id={id}
      className={`w-full ${pyClasses} ${pxClasses} ${alignClasses} ${className}`}
      style={{ backgroundColor: backgroundColor || undefined }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        {(badge || title || subtitle || description) && (
          <div className="mb-8 md:mb-10">
            {badge && (
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-xs md:text-sm font-medium mb-4"
                style={{
                  backgroundColor: `${resolvedBadgeColor}20`,
                  color: resolvedBadgeColor,
                }}
              >
                {badge}
              </span>
            )}
            {title && (
              <h2
                className="text-xl md:text-2xl lg:text-3xl font-bold mb-2"
                style={{ color: resolvedTextColor }}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p
                className="text-base md:text-lg font-medium mb-1 opacity-90"
                style={{ color: resolvedTextColor }}
              >
                {subtitle}
              </p>
            )}
            {description && (
              <p
                className="text-sm md:text-base opacity-70 max-w-2xl mx-auto"
                style={{ color: resolvedTextColor }}
              >
                {description}
              </p>
            )}
          </div>
        )}

        {/* Countdown Units */}
        <div className={`flex justify-center items-center ${sizeClasses.gap}`}>
          {units.map((unit, i) => (
            <React.Fragment key={i}>
              {showSeparator && i > 0 && (
                <span
                  className={`${sizeClasses.separator} font-bold self-start mt-1`}
                  style={{ color: resolvedSepColor }}
                >
                  {separator}
                </span>
              )}
              <div
                className={`text-center ${variant === "cards" ? `${sizeClasses.padding} ${cardRadiusClasses}` : ""}`}
                style={
                  variant === "cards"
                    ? { backgroundColor: resolvedCardBg }
                    : undefined
                }
              >
                <div
                  className={`${sizeClasses.number} font-bold tabular-nums`}
                  style={{ color: resolvedNumberColor }}
                >
                  {unit.value}
                </div>
                {showLabels && (
                  <div
                    className={`${sizeClasses.label} mt-1`}
                    style={{ color: resolvedLabelColor }}
                  >
                    {unit.label}
                  </div>
                )}
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* CTA Button */}
        {ctaText && (
          <div className="mt-8 md:mt-10">
            <a
              href={ctaLink}
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white rounded-lg hover:opacity-90 transition-all shadow-lg"
              style={{ backgroundColor: resolvedCtaColor }}
            >
              {ctaText}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================================
// PRICING - Pricing Plans
// ============================================================================

export interface PricingPlan {
  name?: string;
  price?: string;
  monthlyPrice?: string;
  yearlyPrice?: string;
  currency?: string;
  period?: string;
  description?: string;
  features?: (string | { text?: string; label?: string; included?: boolean })[];
  buttonText?: string;
  buttonLink?: string;
  popular?: boolean;
  badge?: string;
}

export interface PricingProps {
  title?: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  badgeColor?: string;
  headerAlign?: "left" | "center" | "right";
  plans?: PricingPlan[];
  showToggle?: boolean;
  toggleLabels?: { monthly?: string; yearly?: string };
  defaultBilling?: "monthly" | "yearly";
  toggleSavingsText?: string;
  savingsColor?: string;
  variant?: "cards" | "comparison" | "simple";
  columns?: 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
  backgroundColor?: string;
  cardBackgroundColor?: string;
  cardBorderRadius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  cardShadow?: "none" | "sm" | "md" | "lg" | "xl";
  cardBorderColor?: string;
  popularBorderColor?: string;
  popularScale?: boolean;
  textColor?: string;
  priceColor?: string;
  periodColor?: string;
  checkIconColor?: string;
  buttonStyle?: "filled" | "outline";
  showGuarantee?: boolean;
  guaranteeText?: string;
  animateOnScroll?: boolean;
  paddingY?: "sm" | "md" | "lg" | "xl";
  paddingX?: "sm" | "md" | "lg" | "xl";
  id?: string;
  className?: string;
}

export function PricingRender({
  title = "Pricing Plans",
  subtitle,
  description,
  badge,
  badgeColor,
  headerAlign = "center",
  plans = [],
  showToggle = false,
  toggleLabels = { monthly: "Monthly", yearly: "Yearly" },
  defaultBilling = "monthly",
  toggleSavingsText = "Save 20%",
  savingsColor,
  variant = "cards",
  columns = 3,
  gap = "md",
  backgroundColor = "#ffffff",
  cardBackgroundColor = "#ffffff",
  cardBorderRadius = "xl",
  cardShadow = "none",
  cardBorderColor,
  popularBorderColor = "",
  popularScale = true,
  textColor,
  priceColor,
  periodColor,
  checkIconColor = "#22c55e",
  buttonStyle = "filled",
  showGuarantee = false,
  guaranteeText = "30-day money-back guarantee",
  animateOnScroll = false,
  paddingY = "lg",
  paddingX = "md",
  id,
  className = "",
}: PricingProps) {
  const [billing, setBilling] = React.useState<"monthly" | "yearly">(
    defaultBilling,
  );

  const dark = isDarkBackground(backgroundColor);
  const resolvedTextColor = resolveContrastColor(textColor || (dark ? "#f8fafc" : "#1f2937"), dark);
  const resolvedPriceColor = priceColor || resolvedTextColor;
  const resolvedPeriodColor = periodColor || (dark ? "#94a3b8" : "#6b7280");
  const resolvedCardBg = cardBackgroundColor || (dark ? "#1e293b" : "#ffffff");
  const resolvedCardBorder = cardBorderColor || (dark ? "#334155" : "#e5e7eb");
  const resolvedCheckColor = checkIconColor;
  const resolvedSavingsColor = savingsColor || popularBorderColor || "#22c55e";

  const pyClasses = paddingYMapUtil[paddingY] || paddingYMapUtil.lg;
  const pxClasses = paddingXMapUtil[paddingX] || paddingXMapUtil.md;

  const colClasses = {
    2: "md:grid-cols-2 max-w-3xl",
    3: "md:grid-cols-2 lg:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  }[columns];

  const gapClasses = {
    sm: "gap-4 md:gap-5",
    md: "gap-6 md:gap-8",
    lg: "gap-8 md:gap-10",
  }[gap];

  const radiusClasses =
    borderRadiusMapUtil[cardBorderRadius]?.mobile || "rounded-xl";
  const shadowClasses = shadowMapUtil[cardShadow] || "";

  const alignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[headerAlign];

  const getPlanPrice = (plan: PricingPlan) => {
    if (showToggle && plan.monthlyPrice && plan.yearlyPrice) {
      return billing === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
    }
    return plan.price;
  };

  const getPlanPeriod = (plan: PricingPlan) => {
    if (showToggle && plan.monthlyPrice && plan.yearlyPrice) {
      return billing === "monthly" ? "mo" : "yr";
    }
    return plan.period;
  };

  return (
    <section
      id={id}
      className={`w-full ${pyClasses} ${pxClasses} ${className}`}
      style={{ backgroundColor }}
    >
      <div className="max-w-screen-xl mx-auto">
        {/* Header */}
        <div
          className={`${alignClasses} mb-12 md:mb-16 ${headerAlign === "center" ? "max-w-3xl mx-auto" : ""}`}
        >
          {badge && (
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-xs md:text-sm font-medium mb-4"
              style={{
                backgroundColor: badgeColor
                  ? `${badgeColor}20`
                  : `${popularBorderColor}20`,
                color: badgeColor || popularBorderColor || resolvedTextColor,
              }}
            >
              {badge}
            </span>
          )}
          {subtitle && (
            <p
              className="text-sm md:text-base font-semibold uppercase tracking-wider mb-2"
              style={{ color: popularBorderColor || resolvedTextColor }}
            >
              {subtitle}
            </p>
          )}
          <h2
            className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4"
            style={{ color: resolvedTextColor }}
          >
            {title}
          </h2>
          {description && (
            <p
              className="text-base md:text-lg max-w-2xl opacity-80"
              style={{
                color: resolvedTextColor,
                ...(headerAlign === "center" ? { margin: "0 auto" } : {}),
              }}
            >
              {description}
            </p>
          )}
        </div>

        {/* Billing Toggle */}
        {showToggle && (
          <div className="flex items-center justify-center gap-3 mb-10 md:mb-14">
            <span
              className={`text-sm font-medium transition-colors ${billing === "monthly" ? "opacity-100" : "opacity-50"}`}
              style={{ color: resolvedTextColor }}
            >
              {toggleLabels.monthly}
            </span>
            <button
              type="button"
              onClick={() =>
                setBilling(billing === "monthly" ? "yearly" : "monthly")
              }
              className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{
                backgroundColor:
                  billing === "yearly"
                    ? popularBorderColor || "var(--brand-primary, #3b82f6)"
                    : dark
                      ? "#475569"
                      : "#d1d5db",
              }}
              aria-label="Toggle billing period"
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${billing === "yearly" ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
            <span
              className={`text-sm font-medium transition-colors ${billing === "yearly" ? "opacity-100" : "opacity-50"}`}
              style={{ color: resolvedTextColor }}
            >
              {toggleLabels.yearly}
            </span>
            {toggleSavingsText && billing === "yearly" && (
              <span
                className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full"
                style={{
                  backgroundColor: `${resolvedSavingsColor}20`,
                  color: resolvedSavingsColor,
                }}
              >
                {toggleSavingsText}
              </span>
            )}
          </div>
        )}

        {/* Plan Cards */}
        <div className={`grid grid-cols-1 ${colClasses} ${gapClasses} mx-auto`}>
          {plans.map((plan, i) => {
            const currentPrice = getPlanPrice(plan);
            const currentPeriod = getPlanPeriod(plan);
            const isPopular = plan.popular;

            return (
              <div
                key={i}
                className={`relative p-6 md:p-8 ${radiusClasses} border-2 transition-all duration-300 hover:shadow-xl ${shadowClasses} ${isPopular && popularScale ? "shadow-lg scale-[1.02]" : "hover:-translate-y-1"}`}
                style={{
                  backgroundColor: resolvedCardBg,
                  borderColor: isPopular
                    ? popularBorderColor
                    : resolvedCardBorder,
                }}
              >
                {isPopular && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-semibold text-white rounded-full"
                    style={{ backgroundColor: popularBorderColor }}
                  >
                    {plan.badge || "Most Popular"}
                  </div>
                )}
                <h3
                  className="text-lg md:text-xl font-bold mb-2"
                  style={{ color: resolvedTextColor }}
                >
                  {plan.name}
                </h3>
                {plan.description && (
                  <p
                    className="text-sm opacity-75 mb-4"
                    style={{ color: resolvedTextColor }}
                  >
                    {plan.description}
                  </p>
                )}
                <div className="mb-6">
                  {plan.currency && (
                    <span
                      className="text-lg font-medium align-super mr-0.5"
                      style={{ color: resolvedPriceColor }}
                    >
                      {plan.currency}
                    </span>
                  )}
                  <span
                    className="text-3xl md:text-4xl lg:text-5xl font-bold"
                    style={{ color: resolvedPriceColor }}
                  >
                    {currentPrice}
                  </span>
                  {currentPeriod && (
                    <span
                      className="text-sm ml-1"
                      style={{ color: resolvedPeriodColor }}
                    >
                      /{currentPeriod}
                    </span>
                  )}
                </div>
                <ul className="space-y-3 mb-8">
                  {(Array.isArray(plan.features) ? plan.features : []).map(
                    (
                      feature:
                        | string
                        | { text?: string; label?: string; included?: boolean },
                      j: number,
                    ) => {
                      const featureText =
                        typeof feature === "string"
                          ? feature
                          : feature?.text || feature?.label || "";
                      const featureIncluded =
                        typeof feature === "object" &&
                        feature?.included === false
                          ? false
                          : true;
                      if (!featureText) return null;
                      return (
                        <li
                          key={j}
                          className={`flex items-start gap-3 text-sm ${!featureIncluded ? "opacity-40 line-through" : ""}`}
                          style={{ color: resolvedTextColor }}
                        >
                          <svg
                            className={`w-5 h-5 flex-shrink-0 mt-0.5`}
                            style={{
                              color: featureIncluded
                                ? resolvedCheckColor
                                : dark
                                  ? "#475569"
                                  : "#d1d5db",
                            }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            {featureIncluded ? (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            ) : (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            )}
                          </svg>
                          {featureText}
                        </li>
                      );
                    },
                  )}
                </ul>
                <a
                  href={plan.buttonLink || "#"}
                  className={`block w-full py-3 text-center font-medium rounded-lg transition-all ${
                    isPopular || buttonStyle === "filled"
                      ? isPopular
                        ? "text-white hover:opacity-90"
                        : "border-2 hover:opacity-80"
                      : "border-2 hover:opacity-80"
                  }`}
                  style={
                    isPopular
                      ? {
                          backgroundColor: popularBorderColor,
                          color: "#ffffff",
                        }
                      : buttonStyle === "filled"
                        ? {
                            backgroundColor:
                              popularBorderColor || resolvedTextColor,
                            color: dark ? "#0f172a" : "#ffffff",
                          }
                        : {
                            borderColor:
                              popularBorderColor || resolvedTextColor,
                            color: popularBorderColor || resolvedTextColor,
                          }
                  }
                >
                  {plan.buttonText || "Get Started"}
                </a>
              </div>
            );
          })}
        </div>

        {/* Guarantee */}
        {showGuarantee && guaranteeText && (
          <div className="mt-10 md:mt-14 text-center">
            <p
              className="inline-flex items-center gap-2 text-sm opacity-70"
              style={{ color: resolvedTextColor }}
            >
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              {guaranteeText}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================================
// ACCORDION - Expandable Content
// ============================================================================

export interface AccordionItem {
  title?: string;
  content?: string;
  icon?: string;
  defaultOpen?: boolean;
}

export interface AccordionProps {
  items?: AccordionItem[];
  title?: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  headerAlign?: "left" | "center" | "right";
  variant?: "simple" | "bordered" | "separated" | "filled";
  allowMultiple?: boolean;
  iconPosition?: "left" | "right";
  backgroundColor?: string;
  borderColor?: string;
  activeColor?: string;
  accentColor?: string;
  iconColor?: string;
  textColor?: string;
  titleColor?: string;
  subtitleColor?: string;
  itemBorderRadius?: "none" | "sm" | "md" | "lg" | "xl";
  paddingY?: "sm" | "md" | "lg" | "xl";
  paddingX?: "sm" | "md" | "lg" | "xl";
  id?: string;
  className?: string;
}

/**
 * Converts plain-text content with markdown-like formatting to HTML.
 * Reuses markdownToHtml defined above.
 */
const contentToHtml = markdownToHtml;

export function AccordionRender({
  items = [],
  title,
  subtitle,
  badge,
  badgeColor,
  headerAlign = "center",
  variant = "bordered",
  allowMultiple = true,
  iconPosition = "right",
  backgroundColor = "#ffffff",
  borderColor = "#e5e7eb",
  activeColor = "",
  accentColor,
  iconColor,
  textColor,
  titleColor,
  subtitleColor,
  itemBorderRadius = "lg",
  paddingY = "lg",
  paddingX = "md",
  id,
  className = "",
}: AccordionProps) {
  const dark = isDarkBackground(backgroundColor);
  const resolvedTitleColor =
    titleColor || accentColor || textColor || (dark ? "#f8fafc" : "#1f2937");
  const resolvedSubtitleColor =
    subtitleColor || textColor || (dark ? "#94a3b8" : "#6b7280");
  const resolvedIconColor =
    iconColor ||
    accentColor ||
    activeColor ||
    (dark ? "#e5a956" : "var(--brand-primary, #3b82f6)");
  const resolvedTextColor = resolveContrastColor(textColor || (dark ? "#e2e8f0" : "#374151"), dark);
  const resolvedBorderColor = borderColor || (dark ? "#334155" : "#e5e7eb");
  const resolvedBadgeColor = badgeColor || resolvedIconColor;
  const resolvedFilledBg = dark ? "#1e293b" : "#f9fafb";

  const pyClasses = paddingYMapUtil[paddingY] || paddingYMapUtil.lg;
  const pxClasses = paddingXMapUtil[paddingX] || paddingXMapUtil.md;
  const itemRadiusClasses =
    borderRadiusMapUtil[itemBorderRadius]?.mobile || "rounded-lg";

  const alignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[headerAlign];

  const variantClasses = {
    simple: "",
    bordered: `border ${itemRadiusClasses} overflow-hidden divide-y`,
    separated: "space-y-3",
    filled: "space-y-2",
  }[variant];

  const itemClasses = {
    simple: "border-b last:border-b-0",
    bordered: "",
    separated: `border ${itemRadiusClasses} overflow-hidden`,
    filled: `${itemRadiusClasses} overflow-hidden`,
  }[variant];

  return (
    <section
      id={id}
      className={`w-full ${pyClasses} ${pxClasses} ${className}`}
      style={{ backgroundColor }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        {(title || subtitle || badge) && (
          <div className={`${alignClasses} mb-10 md:mb-12`}>
            {badge && (
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-xs md:text-sm font-medium mb-4"
                style={{
                  backgroundColor: `${resolvedBadgeColor}20`,
                  color: resolvedBadgeColor,
                }}
              >
                {badge}
              </span>
            )}
            {title && (
              <h2
                className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3"
                style={{ color: resolvedTitleColor }}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p
                className="text-base md:text-lg leading-relaxed max-w-3xl opacity-85"
                style={{
                  color: resolvedSubtitleColor,
                  ...(headerAlign === "center" ? { margin: "0 auto" } : {}),
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        )}
        {/* Accordion items */}
        <div
          className={variantClasses}
          style={{ borderColor: resolvedBorderColor }}
        >
          {items.map((item, i) => (
            <details
              key={i}
              open={item.defaultOpen || i === 0}
              className={`group ${itemClasses}`}
              style={{
                ...(variant === "filled"
                  ? { backgroundColor: resolvedFilledBg }
                  : {}),
                ...(variant === "separated" || variant === "simple"
                  ? { borderColor: resolvedBorderColor }
                  : {}),
              }}
            >
              <summary
                className={`p-4 md:p-5 cursor-pointer list-none flex items-center ${iconPosition === "left" ? "flex-row-reverse justify-end" : "justify-between"} gap-4 font-semibold text-base md:text-lg transition-colors hover:opacity-80`}
                style={{ color: resolvedTextColor }}
              >
                <span className="flex-1">
                  {item.icon && <span className="mr-2">{item.icon}</span>}
                  {item.title}
                </span>
                <svg
                  className="w-5 h-5 flex-shrink-0 transition-transform duration-200 group-open:rotate-180"
                  style={{ color: resolvedIconColor }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </summary>
              <div
                className="px-4 md:px-5 pb-4 md:pb-5 text-sm md:text-base leading-relaxed"
                style={{ color: resolvedTextColor, opacity: 0.85 }}
                dangerouslySetInnerHTML={{
                  __html: contentToHtml(item.content || ""),
                }}
              />
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
// ============================================================================
// TABS - Tabbed Content
// ============================================================================

export interface TabsProps {
  tabs?: Array<{
    label?: string;
    content?: string;
    icon?: string;
    badge?: string;
    badgeColor?: string;
    disabled?: boolean;
    hidden?: boolean;
  }>;
  title?: string;
  subtitle?: string;
  // Behavior
  defaultTab?: number;
  keepAlive?: boolean;
  lazyLoad?: boolean;
  // Style
  variant?:
    | "underline"
    | "pills"
    | "boxed"
    | "enclosed"
    | "soft"
    | "minimal"
    | "lifted";
  backgroundColor?: string;
  activeColor?: string;
  inactiveColor?: string;
  activeBackgroundColor?: string;
  hoverColor?: string;
  // Backwards compat
  activeTabColor?: string;
  activeTabTextColor?: string;
  inactiveTabColor?: string;
  inactiveTabTextColor?: string;
  tabBorderColor?: string;
  accentColor?: string;
  textColor?: string;
  titleColor?: string;
  subtitleColor?: string;
  // Size & Layout
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  centered?: boolean;
  gap?: "none" | "sm" | "md" | "lg";
  tabsPosition?: "top" | "bottom" | "left" | "right";
  // Border & Indicator
  showBorder?: boolean;
  borderColor?: string;
  borderWidth?: "1" | "2";
  borderRadius?: string;
  indicatorStyle?: "underline" | "background" | "pill" | "none";
  indicatorColor?: string;
  indicatorHeight?: "1" | "2" | "3" | "4";
  // Content
  contentPadding?: string;
  contentBackgroundColor?: string;
  contentBorderRadius?: string;
  contentMinHeight?: "auto" | "sm" | "md" | "lg";
  // Animation
  animationType?: "none" | "fade" | "slide" | "scale";
  animationDuration?: number;
  slideDirection?: "horizontal" | "vertical";
  // Icons
  showIcons?: boolean;
  iconPosition?: "left" | "right" | "top";
  iconSize?: "sm" | "md" | "lg";
  // Badges
  showBadges?: boolean;
  badgeStyle?: "dot" | "count" | "text";
  // Overflow
  overflowBehavior?: "scroll" | "dropdown" | "wrap";
  showScrollButtons?: boolean;
  scrollButtonStyle?: "arrow" | "chevron";
  // Responsive
  mobileVariant?: "same" | "pills" | "dropdown";
  collapseOnMobile?: boolean;
  mobileDropdown?: boolean;
  // Accessibility
  ariaLabel?: string;
  enableKeyboard?: boolean;
  id?: string;
  className?: string;
}

export function TabsRender(props: TabsProps) {
  const {
    tabs: rawTabs = [],
    title,
    subtitle,
    defaultTab = 0,
    keepAlive = true,
    size = "md",
    fullWidth = false,
    backgroundColor,
    gap = "sm",
    showBorder = false,
    borderWidth = "1",
    indicatorHeight = "2",
    contentMinHeight = "auto",
    animationType = "fade",
    animationDuration = 200,
    showIcons = false,
    iconPosition = "left",
    iconSize = "md",
    showBadges = false,
    badgeStyle = "count",
    overflowBehavior = "scroll",
    ariaLabel = "Tabs",
    enableKeyboard = true,
    id,
    className = "",
  } = props;

  // Backwards-compat alias resolution
  const variant = props.variant || "underline";
  const tabsPosition = props.tabsPosition || "top";
  const centered = props.centered ?? true;
  const resolvedActiveColor =
    props.activeColor ||
    props.activeTabTextColor ||
    props.accentColor ||
    "var(--brand-primary, #3b82f6)";
  const resolvedActiveBg =
    props.activeBackgroundColor ||
    props.activeTabColor ||
    (variant === "underline" || variant === "minimal"
      ? "transparent"
      : resolvedActiveColor);
  const resolvedActiveText =
    variant === "underline" || variant === "minimal"
      ? resolvedActiveColor
      : props.activeTabTextColor || "#ffffff";
  const resolvedInactiveColor =
    props.inactiveColor ||
    props.inactiveTabTextColor ||
    props.textColor ||
    "#6b7280";
  const resolvedInactiveBg = props.inactiveTabColor || "transparent";
  const resolvedHoverColor = props.hoverColor || resolvedActiveColor;
  const resolvedIndicatorColor = props.indicatorColor || resolvedActiveColor;
  const resolvedBorderColor =
    props.borderColor || props.tabBorderColor || "#e5e7eb";
  const resolvedContentBg = props.contentBackgroundColor || undefined;
  const tabsDark = isDarkBackground(backgroundColor);
  const resolvedTitleColor = resolveContrastColor(props.titleColor || props.textColor || (tabsDark ? "#f8fafc" : "#1f2937"), tabsDark);
  const resolvedSubtitleColor = resolveContrastColor(props.subtitleColor || props.textColor || (tabsDark ? "#94a3b8" : "#6b7280"), tabsDark);
  const textColor = props.textColor;
  const resolvedTextColor = resolveContrastColor(textColor || (tabsDark ? "#f8fafc" : "#1f2937"), tabsDark);

  // Filter hidden tabs
  const tabs = rawTabs.filter((tab) => !tab.hidden);

  const [activeTab, setActiveTab] = React.useState(() => {
    const idx = Math.min(defaultTab, tabs.length - 1);
    return idx >= 0 ? idx : 0;
  });
  const [visitedTabs, setVisitedTabs] = React.useState<Set<number>>(
    () => new Set([activeTab]),
  );
  const tabListRef = React.useRef<HTMLDivElement>(null);
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  const handleTabChange = (index: number) => {
    if (tabs[index]?.disabled) return;
    setActiveTab(index);
    setVisitedTabs((prev) => new Set(prev).add(index));
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    if (!enableKeyboard) return;
    const isVertical = tabsPosition === "left" || tabsPosition === "right";
    const prevKey = isVertical ? "ArrowUp" : "ArrowLeft";
    const nextKey = isVertical ? "ArrowDown" : "ArrowRight";
    let targetIndex = -1;

    if (e.key === prevKey) {
      e.preventDefault();
      for (let i = currentIndex - 1; i >= 0; i--) {
        if (!tabs[i]?.disabled) {
          targetIndex = i;
          break;
        }
      }
      if (targetIndex === -1) {
        for (let i = tabs.length - 1; i > currentIndex; i--) {
          if (!tabs[i]?.disabled) {
            targetIndex = i;
            break;
          }
        }
      }
    } else if (e.key === nextKey) {
      e.preventDefault();
      for (let i = currentIndex + 1; i < tabs.length; i++) {
        if (!tabs[i]?.disabled) {
          targetIndex = i;
          break;
        }
      }
      if (targetIndex === -1) {
        for (let i = 0; i < currentIndex; i++) {
          if (!tabs[i]?.disabled) {
            targetIndex = i;
            break;
          }
        }
      }
    } else if (e.key === "Home") {
      e.preventDefault();
      for (let i = 0; i < tabs.length; i++) {
        if (!tabs[i]?.disabled) {
          targetIndex = i;
          break;
        }
      }
    } else if (e.key === "End") {
      e.preventDefault();
      for (let i = tabs.length - 1; i >= 0; i--) {
        if (!tabs[i]?.disabled) {
          targetIndex = i;
          break;
        }
      }
    }

    if (targetIndex >= 0) {
      handleTabChange(targetIndex);
      tabRefs.current[targetIndex]?.focus();
    }
  };

  // Size classes
  const sizeClasses =
    {
      sm: "text-sm px-3 py-1.5",
      md: "text-sm px-4 py-2",
      lg: "text-base px-5 py-2.5",
    }[size] || "text-sm px-4 py-2";
  const gapClass =
    { none: "gap-0", sm: "gap-1", md: "gap-2", lg: "gap-4" }[gap] || "gap-1";
  const iconSizeClass =
    { sm: "text-sm", md: "text-base", lg: "text-lg" }[iconSize] || "text-base";
  const contentPadClass: Record<string, string> = {
    none: "p-0",
    xs: "p-2",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
    xl: "p-10",
    "2xl": "p-12",
  };
  const contentPad = contentPadClass[props.contentPadding || "md"] || "p-6";
  const contentMinHClass =
    { auto: "", sm: "min-h-[150px]", md: "min-h-[250px]", lg: "min-h-[350px]" }[
      contentMinHeight
    ] || "";
  const contentRadiusClass: Record<string, string> = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    full: "rounded-full",
  };
  const contentRadius =
    contentRadiusClass[props.contentBorderRadius || "none"] || "";
  const tabRadiusClass: Record<string, string> = {
    none: "",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    full: "rounded-full",
  };

  // Variant-specific tab styles
  const getTabStyle = (isActive: boolean): React.CSSProperties => {
    const base: React.CSSProperties = {
      transition: `all ${animationDuration}ms ease`,
    };
    switch (variant) {
      case "pills":
        return {
          ...base,
          backgroundColor: isActive ? resolvedActiveBg : resolvedInactiveBg,
          color: isActive ? resolvedActiveText : resolvedInactiveColor,
          borderRadius: "9999px",
        };
      case "boxed":
        return {
          ...base,
          backgroundColor: isActive ? resolvedActiveBg : resolvedInactiveBg,
          color: isActive ? resolvedActiveText : resolvedInactiveColor,
          border: `1px solid ${isActive ? resolvedActiveBg : resolvedBorderColor}`,
          borderRadius: tabRadiusClass[props.borderRadius || "md"]
            ? undefined
            : "0.375rem",
        };
      case "enclosed":
        return {
          ...base,
          backgroundColor: isActive
            ? resolvedContentBg || "#ffffff"
            : "transparent",
          color: isActive ? resolvedActiveColor : resolvedInactiveColor,
          borderTop: `2px solid ${isActive ? resolvedIndicatorColor : "transparent"}`,
          borderLeft: `1px solid ${isActive ? resolvedBorderColor : "transparent"}`,
          borderRight: `1px solid ${isActive ? resolvedBorderColor : "transparent"}`,
          borderBottom: isActive
            ? `1px solid ${resolvedContentBg || "#ffffff"}`
            : `1px solid ${resolvedBorderColor}`,
          marginBottom: isActive ? "-1px" : "0",
          borderRadius: "0.375rem 0.375rem 0 0",
        };
      case "soft":
        return {
          ...base,
          backgroundColor: isActive
            ? `${resolvedActiveColor}15`
            : "transparent",
          color: isActive ? resolvedActiveColor : resolvedInactiveColor,
          borderRadius: "0.5rem",
        };
      case "minimal":
        return {
          ...base,
          backgroundColor: "transparent",
          color: isActive ? resolvedActiveColor : resolvedInactiveColor,
          fontWeight: isActive ? 600 : 400,
        };
      case "lifted":
        return {
          ...base,
          backgroundColor: isActive
            ? resolvedContentBg || "#ffffff"
            : "transparent",
          color: isActive ? resolvedActiveColor : resolvedInactiveColor,
          boxShadow: isActive ? "0 -2px 8px rgba(0,0,0,0.08)" : "none",
          borderRadius: "0.5rem 0.5rem 0 0",
          transform: isActive ? "translateY(-2px)" : "none",
          zIndex: isActive ? 1 : 0,
        };
      case "underline":
      default:
        return {
          ...base,
          backgroundColor: "transparent",
          color: isActive ? resolvedActiveColor : resolvedInactiveColor,
          borderBottom: `${indicatorHeight}px solid ${isActive ? resolvedIndicatorColor : "transparent"}`,
        };
    }
  };

  // Icon rendering
  const renderIcon = (tab: (typeof tabs)[0]) => {
    if (!showIcons || !tab.icon) return null;
    return <span className={`${iconSizeClass} shrink-0`}>{tab.icon}</span>;
  };

  // Badge rendering
  const renderBadge = (tab: (typeof tabs)[0]) => {
    if (!showBadges || !tab.badge) return null;
    const badgeColor = tab.badgeColor || resolvedActiveColor;
    if (badgeStyle === "dot") {
      return (
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: badgeColor }}
        />
      );
    }
    return (
      <span
        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
        style={{ backgroundColor: badgeColor, color: "#fff" }}
      >
        {tab.badge}
      </span>
    );
  };

  // Content animation styles
  const getContentAnimation = (): React.CSSProperties => {
    if (animationType === "none") return {};
    if (animationType === "fade")
      return { animation: `tabFadeIn ${animationDuration}ms ease` };
    if (animationType === "scale")
      return { animation: `tabScaleIn ${animationDuration}ms ease` };
    return {};
  };

  // Build tab button
  const renderTabButton = (tab: (typeof tabs)[0], index: number) => {
    const isActive = index === activeTab;
    const tabId = `${id || "tabs"}-tab-${index}`;
    const panelId = `${id || "tabs"}-panel-${index}`;
    const isDisabled = !!tab.disabled;
    const iconEl = renderIcon(tab);
    const badgeEl = renderBadge(tab);
    const isIconTop = iconPosition === "top" && showIcons && tab.icon;

    return (
      <button
        key={index}
        ref={(el) => {
          tabRefs.current[index] = el;
        }}
        id={tabId}
        role="tab"
        aria-selected={isActive}
        aria-controls={panelId}
        aria-disabled={isDisabled || undefined}
        tabIndex={isActive ? 0 : -1}
        onClick={() => handleTabChange(index)}
        onKeyDown={(e) => handleKeyDown(e, index)}
        className={`${sizeClasses} ${fullWidth ? "flex-1" : ""} font-medium transition-all cursor-pointer whitespace-nowrap ${isIconTop ? "flex flex-col items-center gap-1" : "inline-flex items-center gap-1.5"} ${isDisabled ? "opacity-40 cursor-not-allowed" : ""}`}
        style={getTabStyle(isActive)}
        disabled={isDisabled}
      >
        {iconPosition === "left" && iconEl}
        {isIconTop && iconEl}
        <span>{tab.label}</span>
        {iconPosition === "right" && iconEl}
        {badgeEl}
      </button>
    );
  };

  const isVertical = tabsPosition === "left" || tabsPosition === "right";

  // Tab list
  const tabListEl = (
    <div
      ref={tabListRef}
      role="tablist"
      aria-label={ariaLabel}
      aria-orientation={isVertical ? "vertical" : "horizontal"}
      className={`flex ${isVertical ? "flex-col" : `flex-row ${overflowBehavior === "wrap" ? "flex-wrap" : "overflow-x-auto"}`} ${gapClass} ${!isVertical && centered ? "justify-center" : ""} ${!isVertical && fullWidth ? "w-full" : ""} ${isVertical ? "min-w-[140px]" : ""}`}
      style={{
        ...(showBorder && !isVertical && variant === "underline"
          ? { borderBottom: `${borderWidth}px solid ${resolvedBorderColor}` }
          : {}),
        ...(showBorder && isVertical
          ? {
              [tabsPosition === "left" ? "borderRight" : "borderLeft"]:
                `${borderWidth}px solid ${resolvedBorderColor}`,
            }
          : {}),
      }}
    >
      {tabs.map(renderTabButton)}
    </div>
  );

  // Tab panels
  const panelEls = tabs.map((tab, index) => {
    const isActive = index === activeTab;
    const panelId = `${id || "tabs"}-panel-${index}`;
    const tabId = `${id || "tabs"}-tab-${index}`;
    const shouldRender = keepAlive ? visitedTabs.has(index) : isActive;
    if (!shouldRender) return null;
    return (
      <div
        key={index}
        id={panelId}
        role="tabpanel"
        aria-labelledby={tabId}
        tabIndex={0}
        hidden={!isActive}
        className={`${contentPad} ${contentMinHClass} ${contentRadius} text-base leading-relaxed focus:outline-none`}
        style={{
          color: resolvedTextColor,
          backgroundColor: resolvedContentBg,
          ...(isActive ? getContentAnimation() : {}),
        }}
        dangerouslySetInnerHTML={
          tab.content ? { __html: contentToHtml(tab.content) } : undefined
        }
      />
    );
  });

  return (
    <>
      {/* Keyframe animations injected via style tag */}
      {animationType !== "none" && (
        <style>{`
          @keyframes tabFadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes tabScaleIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        `}</style>
      )}
      <section
        id={id}
        className={`py-8 px-4 sm:px-6 lg:px-8 ${className}`}
        style={{ backgroundColor: backgroundColor || undefined }}
      >
        <div className="max-w-4xl mx-auto">
          {(title || subtitle) && (
            <div className="mb-8 text-center">
              {title && (
                <h2
                  className="text-3xl md:text-4xl font-bold mb-3"
                  style={{ color: resolvedTitleColor }}
                >
                  {title}
                </h2>
              )}
              {subtitle && (
                <p
                  className="text-lg leading-relaxed max-w-3xl mx-auto opacity-85"
                  style={{ color: resolvedSubtitleColor }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          )}
          <div
            className={`${isVertical ? "flex gap-6" : ""} ${isVertical && tabsPosition === "right" ? "flex-row-reverse" : ""}`}
          >
            {tabsPosition !== "bottom" && tabListEl}
            <div className={`${isVertical ? "flex-1" : ""}`}>{panelEls}</div>
            {tabsPosition === "bottom" && tabListEl}
          </div>
        </div>
      </section>
    </>
  );
}

// ============================================================================
// MODAL - Dialog/Modal Component
// ============================================================================

export interface ModalProps {
  children?: React.ReactNode;
  title?: string;
  description?: string;
  isOpen?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "full";
  showHeader?: boolean;
  showFooter?: boolean;
  showCloseButton?: boolean;
  closeButtonPosition?: "header-right" | "outside" | "header-left";
  closeButtonStyle?: "icon" | "text" | "circle";
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  centered?: boolean;
  position?: "center" | "top" | "bottom" | "left" | "right";
  backgroundColor?: string;
  borderRadius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  shadow?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  showBorder?: boolean;
  borderColor?: string;
  overlayColor?: string;
  overlayOpacity?: number;
  overlayBlur?: number;
  animationType?: "fade" | "scale" | "slide" | "zoom" | "none";
  animationDuration?: number;
  animationDirection?: "up" | "down" | "left" | "right";
  headerAlign?: "left" | "center" | "right";
  footerAlign?: "left" | "center" | "right" | "space-between";
  primaryButtonText?: string;
  primaryButtonAction?: string;
  secondaryButtonText?: string;
  secondaryButtonAction?: string;
  mobileFullScreen?: boolean;
  mobilePosition?: "center" | "bottom";
  ariaLabel?: string;
  role?: "dialog" | "alertdialog";
  id?: string;
  className?: string;
  onClose?: () => void;
}

export function ModalRender({
  children,
  title,
  description,
  isOpen = true,
  size = "md",
  showHeader = true,
  showFooter = false,
  showCloseButton = true,
  closeButtonPosition = "header-right",
  closeButtonStyle = "icon",
  closeOnOverlay = true,
  closeOnEscape = true,
  centered = true,
  position = "center",
  backgroundColor = "#ffffff",
  borderRadius = "lg",
  shadow = "xl",
  showBorder = false,
  borderColor,
  overlayColor = "#000000",
  overlayOpacity = 50,
  overlayBlur = 0,
  animationType = "scale",
  animationDuration = 200,
  animationDirection = "up",
  headerAlign = "left",
  footerAlign = "right",
  primaryButtonText,
  primaryButtonAction,
  secondaryButtonText,
  secondaryButtonAction,
  mobileFullScreen = false,
  mobilePosition = "center",
  ariaLabel,
  role = "dialog",
  id,
  className = "",
  onClose,
}: ModalProps) {
  const sizeClasses = {
    xs: "max-w-xs",
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-full mx-4",
  }[size];

  const radiusClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
  }[borderRadius];

  const shadowClasses = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
    "2xl": "shadow-2xl",
  }[shadow];

  const positionClasses = {
    center: centered
      ? "items-center justify-center"
      : "items-start pt-20 justify-center",
    top: "items-start pt-8 justify-center",
    bottom: "items-end pb-8 justify-center",
    left: "items-center justify-start pl-4",
    right: "items-center justify-end pr-4",
  }[position];

  const headerAlignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[headerAlign];

  const footerAlignClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
    "space-between": "justify-between",
  }[footerAlign];

  // Animation CSS
  const getAnimationStyle = (): React.CSSProperties => {
    const duration = `${animationDuration}ms`;
    if (animationType === "none") return {};
    if (animationType === "fade")
      return { animation: `modalFadeIn ${duration} ease-out` };
    if (animationType === "zoom")
      return { animation: `modalZoomIn ${duration} ease-out` };
    if (animationType === "slide") {
      const slideMap = {
        up: `modalSlideUp ${duration} ease-out`,
        down: `modalSlideDown ${duration} ease-out`,
        left: `modalSlideLeft ${duration} ease-out`,
        right: `modalSlideRight ${duration} ease-out`,
      };
      return { animation: slideMap[animationDirection] };
    }
    return { animation: `modalScaleIn ${duration} ease-out` };
  };

  const hasFooter = showFooter && (primaryButtonText || secondaryButtonText);
  const hasHeader = showHeader && (title || description);

  // Close button SVG
  const closeIcon = (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );

  if (!isOpen) return null;

  const dark = isDarkBackground(backgroundColor);
  const resolvedTextColor = dark
    ? "#f8fafc"
    : "var(--color-foreground, #1f2937)";
  const resolvedSecondaryText = dark
    ? "#94a3b8"
    : "var(--color-muted-foreground, #6b7280)";

  return (
    <>
      {/* Keyframe animations */}
      <style>{`
        @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalScaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes modalZoomIn { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
        @keyframes modalSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes modalSlideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes modalSlideLeft { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes modalSlideRight { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
      <div
        id={id}
        className={`fixed inset-0 z-50 flex ${positionClasses} p-4 ${mobileFullScreen ? "max-md:p-0" : ""} ${mobilePosition === "bottom" ? "max-md:items-end max-md:pb-0" : ""} ${className}`}
        role={role}
        aria-modal="true"
        aria-label={ariaLabel || title || undefined}
      >
        {/* Overlay */}
        <div
          className="absolute inset-0 transition-opacity"
          style={{
            backgroundColor: overlayColor,
            opacity: overlayOpacity / 100,
            ...(overlayBlur > 0
              ? { backdropFilter: `blur(${overlayBlur}px)` }
              : {}),
          }}
          onClick={closeOnOverlay ? onClose : undefined}
          aria-hidden="true"
        />

        {/* Dialog */}
        <div
          className={`relative ${sizeClasses} w-full ${radiusClasses} ${shadowClasses} ${mobileFullScreen ? "max-md:max-w-full max-md:h-full max-md:rounded-none" : ""} flex flex-col`}
          style={{
            backgroundColor,
            ...getAnimationStyle(),
            ...(showBorder
              ? {
                  border: `1px solid ${borderColor || "var(--color-border, #e5e7eb)"}`,
                }
              : {}),
          }}
        >
          {/* Close button (outside position) */}
          {showCloseButton && closeButtonPosition === "outside" && (
            <button
              className="absolute -top-3 -right-3 p-1.5 rounded-full transition-opacity hover:opacity-80 z-10"
              style={{
                backgroundColor: "var(--color-background, #ffffff)",
                color: resolvedTextColor,
              }}
              onClick={onClose}
              aria-label="Close"
            >
              {closeIcon}
            </button>
          )}

          {/* Header */}
          {hasHeader && (
            <div
              className={`px-6 pt-6 ${hasFooter || children ? "pb-4" : "pb-6"} ${headerAlignClasses} flex items-start gap-4`}
            >
              {/* Close button (header-left) */}
              {showCloseButton && closeButtonPosition === "header-left" && (
                <button
                  className="p-1 rounded-lg hover:opacity-80 transition-opacity flex-shrink-0"
                  style={{ color: resolvedSecondaryText }}
                  onClick={onClose}
                  aria-label="Close"
                >
                  {closeButtonStyle === "circle" ? (
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: dark
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.05)",
                      }}
                    >
                      {closeIcon}
                    </span>
                  ) : closeButtonStyle === "text" ? (
                    <span className="text-sm font-medium">Close</span>
                  ) : (
                    closeIcon
                  )}
                </button>
              )}
              <div className="flex-1">
                {title && (
                  <h2
                    className="text-xl md:text-2xl font-bold mb-1"
                    style={{ color: resolvedTextColor }}
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p
                    className="text-sm"
                    style={{ color: resolvedSecondaryText }}
                  >
                    {description}
                  </p>
                )}
              </div>
              {/* Close button (header-right — default) */}
              {showCloseButton && closeButtonPosition === "header-right" && (
                <button
                  className="p-1 rounded-lg hover:opacity-80 transition-opacity flex-shrink-0"
                  style={{ color: resolvedSecondaryText }}
                  onClick={onClose}
                  aria-label="Close"
                >
                  {closeButtonStyle === "circle" ? (
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: dark
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.05)",
                      }}
                    >
                      {closeIcon}
                    </span>
                  ) : closeButtonStyle === "text" ? (
                    <span className="text-sm font-medium">Close</span>
                  ) : (
                    closeIcon
                  )}
                </button>
              )}
            </div>
          )}

          {/* No header but still need close button */}
          {!hasHeader &&
            showCloseButton &&
            closeButtonPosition !== "outside" && (
              <button
                className={`absolute ${closeButtonPosition === "header-left" ? "top-4 left-4" : "top-4 right-4"} p-1 rounded-lg hover:opacity-80 transition-opacity z-10`}
                style={{ color: resolvedSecondaryText }}
                onClick={onClose}
                aria-label="Close"
              >
                {closeIcon}
              </button>
            )}

          {/* Body */}
          {children && (
            <div className="px-6 py-2 flex-1 overflow-y-auto">{children}</div>
          )}

          {/* Footer */}
          {hasFooter && (
            <div
              className={`px-6 pb-6 pt-4 flex items-center gap-3 ${footerAlignClasses}`}
            >
              {secondaryButtonText && (
                <a
                  href={secondaryButtonAction || "#"}
                  className="px-4 py-2 text-sm font-medium rounded-lg border transition-opacity hover:opacity-80"
                  style={{
                    borderColor: dark
                      ? "rgba(255,255,255,0.2)"
                      : "var(--color-border, #d1d5db)",
                    color: resolvedTextColor,
                  }}
                >
                  {secondaryButtonText}
                </a>
              )}
              {primaryButtonText && (
                <a
                  href={primaryButtonAction || "#"}
                  className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "var(--brand-primary, #3b82f6)" }}
                >
                  {primaryButtonText}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ============================================================================
// BADGE - Status/Label Badge
// ============================================================================

export interface BadgeProps {
  text?: string;
  variant?:
    | "default"
    | "primary"
    | "success"
    | "warning"
    | "error"
    | "info"
    | "outline";
  size?: "xs" | "sm" | "md" | "lg";
  rounded?: "default" | "full";
  outline?: boolean;
  dot?: boolean;
  pulse?: boolean;
  icon?: React.ReactNode;
  iconName?: string;
  iconPosition?: "left" | "right";
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  dotColor?: string;

  // Interactive
  href?: string;
  target?: "_self" | "_blank";
  onDismiss?: () => void;

  // Animation
  animateIn?: "none" | "fade" | "scale" | "slide";

  id?: string;
  className?: string;
}

// Pre-bundled icon subset for badge iconName resolution
const BADGE_ICONS: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  check: Check,
  x: X,
  star: Star,
  heart: Heart,
  "alert-circle": AlertCircle,
  info: Info,
  "check-circle": CheckCircle2,
  "shopping-cart": ShoppingCart,
  "external-link": ExternalLink,
  mail: Mail,
  calendar: Calendar,
  clock: Clock,
  zap: Zap,
};

export function BadgeRender({
  text = "Badge",
  variant = "default",
  size = "md",
  rounded = "full",
  outline = false,
  dot = false,
  pulse = false,
  icon,
  iconName,
  iconPosition = "left",
  backgroundColor,
  textColor,
  borderColor: borderColorProp,
  dotColor,
  href,
  target = "_self",
  onDismiss,
  animateIn = "none",
  id,
  className = "",
}: BadgeProps) {
  const sizeClasses = {
    xs: "text-[10px] px-1.5 py-0.5",
    sm: "text-xs px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
    lg: "text-sm px-3 py-1",
  }[size];
  const roundedClasses = { default: "rounded-md", full: "rounded-full" }[
    rounded
  ];

  const iconSizeClass = {
    xs: "w-2.5 h-2.5",
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  }[size];

  const isOutline = outline || variant === "outline";

  const variantStyles: Record<
    string,
    { bg: string; text: string; border: string }
  > = {
    default: {
      bg: "var(--muted, #f3f4f6)",
      text: "var(--muted-foreground, #374151)",
      border: "var(--border, #d1d5db)",
    },
    primary: {
      bg: "color-mix(in srgb, var(--primary, #3b82f6) 15%, transparent)",
      text: "var(--primary, #1e40af)",
      border: "color-mix(in srgb, var(--primary, #3b82f6) 40%, transparent)",
    },
    success: {
      bg: "color-mix(in srgb, var(--success, #16a34a) 15%, transparent)",
      text: "var(--success, #166534)",
      border: "color-mix(in srgb, var(--success, #16a34a) 40%, transparent)",
    },
    warning: {
      bg: "color-mix(in srgb, var(--warning, #d97706) 15%, transparent)",
      text: "var(--warning, #92400e)",
      border: "color-mix(in srgb, var(--warning, #d97706) 40%, transparent)",
    },
    error: {
      bg: "color-mix(in srgb, var(--destructive, #dc2626) 15%, transparent)",
      text: "var(--destructive, #991b1b)",
      border:
        "color-mix(in srgb, var(--destructive, #dc2626) 40%, transparent)",
    },
    info: {
      bg: "color-mix(in srgb, var(--info, #0ea5e9) 15%, transparent)",
      text: "var(--info, #075985)",
      border: "color-mix(in srgb, var(--info, #0ea5e9) 40%, transparent)",
    },
    outline: {
      bg: "transparent",
      text: "var(--foreground, #374151)",
      border: "var(--border, #e5e7eb)",
    },
  };

  const styles = variantStyles[variant] || variantStyles.default;

  const animationClass = {
    none: "",
    fade: "animate-in fade-in duration-300",
    scale: "animate-in zoom-in-95 duration-200",
    slide: "animate-in slide-in-from-bottom-1 duration-200",
  }[animateIn];

  // Resolve iconName from pre-bundled map
  const ResolvedIcon = iconName ? BADGE_ICONS[iconName] : null;

  const renderIcon = () => {
    if (ResolvedIcon) {
      return <ResolvedIcon className={iconSizeClass} />;
    }
    return icon || null;
  };

  const content = (
    <>
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${pulse ? "animate-pulse" : ""}`}
          style={{ backgroundColor: dotColor || textColor || styles.text }}
        />
      )}
      {iconPosition === "left" && renderIcon()}
      {text}
      {iconPosition === "right" && renderIcon()}
      {onDismiss && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDismiss();
          }}
          className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full hover:opacity-70 transition-opacity shrink-0 -mr-0.5 cursor-pointer"
          aria-label={`Dismiss ${text}`}
        >
          ×
        </button>
      )}
    </>
  );

  const sharedClasses = `inline-flex items-center gap-1.5 font-medium ${sizeClasses} ${roundedClasses} ${isOutline ? "border bg-transparent" : ""} ${animationClass} ${className}`;
  const sharedStyle: React.CSSProperties = {
    backgroundColor: backgroundColor || (isOutline ? "transparent" : styles.bg),
    color: textColor || styles.text,
    borderColor: isOutline ? borderColorProp || styles.border : undefined,
  };

  if (href) {
    return (
      <a
        id={id}
        href={href}
        target={target}
        rel={target === "_blank" ? "noopener noreferrer" : undefined}
        className={`${sharedClasses} hover:opacity-80 transition-opacity no-underline`}
        style={sharedStyle}
      >
        {content}
      </a>
    );
  }

  return (
    <span id={id} className={sharedClasses} style={sharedStyle}>
      {content}
    </span>
  );
}

// ============================================================================
// LINK - Inline Text Link
// ============================================================================

export interface LinkProps {
  text?: string;
  href?: string;
  target?: "_self" | "_blank";
  rel?: string;

  // Style
  variant?:
    | "default"
    | "underline"
    | "hover-underline"
    | "subtle"
    | "bold"
    | "nav";
  color?: string;
  hoverColor?: string;

  // Icon
  iconName?: string;
  iconPosition?: "left" | "right";
  showExternalIcon?: boolean;

  // Typography
  fontSize?: string;
  fontWeight?: "normal" | "medium" | "semibold" | "bold";

  // Animation
  underlineAnimation?: "none" | "slide-in" | "expand-center" | "expand-left";

  // Accessibility
  ariaLabel?: string;

  id?: string;
  className?: string;
}

export function LinkRender({
  text = "Link",
  href = "#",
  target = "_self",
  rel,

  variant = "default",
  color,
  hoverColor,

  iconName,
  iconPosition = "right",
  showExternalIcon = false,

  fontSize,
  fontWeight = "normal",

  underlineAnimation = "none",

  ariaLabel,

  id,
  className = "",
}: LinkProps) {
  const weightClass = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
  }[fontWeight];

  const variantClasses = {
    default: "hover:underline",
    underline: "underline underline-offset-2",
    "hover-underline": "no-underline hover:underline",
    subtle: "no-underline hover:underline",
    bold: "font-bold no-underline",
    nav: "no-underline hover:opacity-80",
  }[variant];

  const defaultColor =
    variant === "subtle"
      ? "inherit"
      : variant === "nav"
        ? "inherit"
        : "var(--primary, #3b82f6)";

  const linkColor = color || defaultColor;

  const animationClass = {
    none: "",
    "slide-in": "group",
    "expand-center": "group",
    "expand-left": "group",
  }[underlineAnimation];

  const showExternal =
    showExternalIcon || (target === "_blank" && showExternalIcon !== false);

  const computedRel =
    rel || (target === "_blank" ? "noopener noreferrer" : undefined);

  return (
    <a
      id={id}
      href={href}
      target={target}
      rel={computedRel}
      className={`inline-flex items-center gap-1 transition-colors ${weightClass} ${variantClasses} ${animationClass} ${className}`}
      style={{
        color: linkColor,
        fontSize: fontSize,
      }}
      aria-label={ariaLabel}
    >
      {iconName && iconPosition === "left" && (
        <span className="inline-flex shrink-0" aria-hidden="true">
          ›
        </span>
      )}
      <span
        className={
          underlineAnimation !== "none"
            ? "relative after:absolute after:bottom-0 after:left-0 after:h-px after:bg-current after:transition-all after:duration-300 " +
              (underlineAnimation === "slide-in"
                ? "after:w-0 group-hover:after:w-full"
                : underlineAnimation === "expand-center"
                  ? "after:w-0 after:left-1/2 group-hover:after:w-full group-hover:after:left-0"
                  : "after:w-0 group-hover:after:w-full")
            : ""
        }
      >
        {text}
      </span>
      {iconName && iconPosition === "right" && (
        <span className="inline-flex shrink-0" aria-hidden="true">
          ›
        </span>
      )}
      {showExternal && target === "_blank" && (
        <svg
          className="inline-block w-3 h-3 ml-0.5 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      )}
    </a>
  );
}

// ============================================================================
// BUTTON GROUP - Adjacent Button Container
// ============================================================================

export interface ButtonGroupProps {
  children?: React.ReactNode;

  // Layout
  direction?: "horizontal" | "vertical";
  size?: "xs" | "sm" | "md" | "lg";
  gap?: "none" | "xs" | "sm";
  fullWidth?: boolean;

  // Style
  variant?: "connected" | "separated" | "toggle";
  borderRadius?: "none" | "sm" | "md" | "lg" | "xl" | "full";

  // Accessibility
  ariaLabel?: string;
  role?: "group" | "toolbar";

  id?: string;
  className?: string;
}

export function ButtonGroupRender({
  children,

  direction = "horizontal",
  gap = "none",
  fullWidth = false,

  variant = "connected",
  borderRadius = "md",

  ariaLabel,
  role = "group",

  id,
  className = "",
}: ButtonGroupProps) {
  const directionClass = direction === "horizontal" ? "flex-row" : "flex-col";

  const gapClass = {
    none: "gap-0",
    xs: "gap-1",
    sm: "gap-2",
    md: "gap-3",
    lg: "gap-4",
  }[gap];

  const radiusClass = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    full: "rounded-full",
  }[borderRadius];

  const connectedStyles =
    variant === "connected" && gap === "none"
      ? direction === "horizontal"
        ? `[&>*]:rounded-none [&>*:first-child]:rounded-l-${borderRadius === "full" ? "full" : borderRadius} [&>*:last-child]:rounded-r-${borderRadius === "full" ? "full" : borderRadius} [&>*:not(:first-child)]:-ml-px`
        : `[&>*]:rounded-none [&>*:first-child]:rounded-t-${borderRadius === "full" ? "full" : borderRadius} [&>*:last-child]:rounded-b-${borderRadius === "full" ? "full" : borderRadius} [&>*:not(:first-child)]:-mt-px`
      : "";

  return (
    <div
      id={id}
      role={role}
      aria-label={ariaLabel}
      className={`inline-flex ${directionClass} ${gapClass} ${fullWidth ? "w-full [&>*]:flex-1" : ""} ${connectedStyles} ${className}`}
    >
      {children}
    </div>
  );
}

// ============================================================================
// CHIP - Interactive Tag / Filter
// ============================================================================

export interface ChipProps {
  label?: string;

  // State
  selected?: boolean;
  disabled?: boolean;

  // Style
  variant?: "filled" | "outline" | "subtle";
  size?: "sm" | "md" | "lg";
  rounded?: "default" | "full";

  // Colours
  color?: string;
  selectedColor?: string;
  selectedTextColor?: string;

  // Icon
  iconName?: string;
  avatar?: string;

  // Interactive
  onClick?: () => void;
  onDelete?: () => void;

  // Accessibility
  ariaLabel?: string;

  id?: string;
  className?: string;
}

export function ChipRender({
  label = "Chip",

  selected = false,
  disabled = false,

  variant = "filled",
  size = "md",
  rounded = "full",

  color,
  selectedColor,
  selectedTextColor,

  avatar,

  onClick,
  onDelete,

  ariaLabel,

  id,
  className = "",
}: ChipProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm px-3 py-1 gap-1.5",
    lg: "text-base px-4 py-1.5 gap-2",
  }[size];

  const roundedClass = rounded === "full" ? "rounded-full" : "rounded-md";

  const avatarSize = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  }[size];

  const chipColor = color || "var(--primary, #3b82f6)";
  const activeColor = selectedColor || chipColor;
  const activeTextColor = selectedTextColor || "#ffffff";

  const getStyles = (): React.CSSProperties => {
    if (selected) {
      return {
        backgroundColor: activeColor,
        color: activeTextColor,
        borderColor: activeColor,
      };
    }
    switch (variant) {
      case "filled":
        return {
          backgroundColor: "var(--muted, #f3f4f6)",
          color: "var(--muted-foreground, #374151)",
          borderColor: "transparent",
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          color: "var(--foreground, #374151)",
          borderColor: "var(--border, #d1d5db)",
        };
      case "subtle":
        return {
          backgroundColor: `color-mix(in srgb, ${chipColor} 10%, transparent)`,
          color: chipColor,
          borderColor: "transparent",
        };
      default:
        return {};
    }
  };

  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || label}
      aria-pressed={selected}
      className={`inline-flex items-center border transition-colors cursor-pointer select-none ${sizeClasses} ${roundedClass} ${disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"} ${className}`}
      style={getStyles()}
    >
      {avatar && (
        <img
          src={avatar}
          alt=""
          className={`${avatarSize} rounded-full object-cover shrink-0`}
        />
      )}
      {label}
      {onDelete && (
        <span
          role="button"
          tabIndex={0}
          aria-label={`Remove ${label}`}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              onDelete();
            }
          }}
          className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:opacity-70 cursor-pointer shrink-0"
        >
          ×
        </span>
      )}
    </button>
  );
}

// ============================================================================
// BREADCRUMB - Navigation Trail
// ============================================================================

export interface BreadcrumbItem {
  label: string;
  href?: string;
  iconName?: string;
}

export interface BreadcrumbProps {
  items?: BreadcrumbItem[];

  // Style
  separator?: "/" | ">" | "→" | "•" | "chevron" | "slash" | "arrow" | "dot";
  variant?: "default" | "contained" | "pills";
  size?: "sm" | "md" | "lg";

  // Colours
  color?: string;
  activeColor?: string;
  hoverColor?: string;
  separatorColor?: string;
  backgroundColor?: string;

  // Truncation
  maxItems?: number;
  showHome?: boolean;

  // Accessibility
  ariaLabel?: string;

  id?: string;
  className?: string;
}

export function BreadcrumbRender({
  items = [],

  separator = "chevron",
  variant = "default",
  size = "md",

  color,
  activeColor,
  separatorColor,
  backgroundColor,

  maxItems,
  showHome = false,

  ariaLabel = "Breadcrumb navigation",

  id,
  className = "",
}: BreadcrumbProps) {
  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }[size];

  const defaultColor = color || "var(--muted-foreground, #6b7280)";
  const currentColor = activeColor || "var(--foreground, #111827)";
  const sepColor = separatorColor || "var(--muted-foreground, #9ca3af)";

  const separatorContent = {
    "/": "/",
    ">": ">",
    "→": "→",
    "•": "•",
    slash: "/",
    arrow: "→",
    dot: "•",
    chevron: (
      <svg
        className={
          size === "sm" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-4 h-4"
        }
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    ),
  }[separator];

  // Truncate items if maxItems is set
  let displayItems = items;
  if (maxItems && items.length > maxItems) {
    const boundary = Math.floor(maxItems / 2);
    const start = items.slice(0, boundary);
    const end = items.slice(-boundary);
    displayItems = [...start, { label: "…", href: undefined }, ...end];
  }

  const containerClasses =
    variant === "contained"
      ? "px-3 py-1.5 rounded-lg"
      : variant === "pills"
        ? "gap-1"
        : "";

  return (
    <nav
      id={id}
      aria-label={ariaLabel}
      className={`${sizeClasses} ${className}`}
    >
      <ol
        className={`inline-flex items-center gap-1.5 ${containerClasses}`}
        style={{
          backgroundColor:
            variant === "contained"
              ? backgroundColor || "var(--muted, #f3f4f6)"
              : undefined,
        }}
      >
        {showHome && (
          <>
            <li>
              <a
                href="/"
                className="inline-flex items-center hover:opacity-80 transition-opacity"
                style={{ color: defaultColor }}
                aria-label="Home"
              >
                <svg
                  className={
                    size === "sm"
                      ? "w-3 h-3"
                      : size === "lg"
                        ? "w-5 h-5"
                        : "w-4 h-4"
                  }
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1"
                  />
                </svg>
              </a>
            </li>
            {displayItems.length > 0 && (
              <li
                className="inline-flex items-center"
                style={{ color: sepColor }}
                aria-hidden="true"
              >
                {separatorContent}
              </li>
            )}
          </>
        )}
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const isEllipsis = item.label === "…";
          const pillClasses =
            variant === "pills"
              ? "px-2 py-0.5 rounded-md hover:bg-black/5"
              : "";

          return (
            <li key={index} className="inline-flex items-center gap-1.5">
              {isEllipsis ? (
                <span style={{ color: sepColor }}>…</span>
              ) : isLast || !item.href ? (
                <span
                  className={`font-medium ${pillClasses}`}
                  style={{ color: currentColor }}
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <a
                  href={item.href}
                  className={`hover:opacity-80 transition-opacity ${pillClasses}`}
                  style={{ color: defaultColor }}
                >
                  {item.label}
                </a>
              )}
              {!isLast && (
                <span
                  className="inline-flex items-center"
                  style={{ color: sepColor }}
                  aria-hidden="true"
                >
                  {separatorContent}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ============================================================================
// PAGINATION - Page Navigation
// ============================================================================

export interface PaginationProps {
  currentPage?: number;
  totalPages?: number;

  // Style
  variant?: "default" | "simple" | "minimal" | "dots";
  size?: "sm" | "md" | "lg";
  shape?: "rounded" | "circle" | "square";

  // Colours
  activeColor?: string;
  activeTextColor?: string;
  color?: string;
  hoverColor?: string;

  // Display
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  siblingsCount?: number;
  boundaryCount?: number;

  // Labels
  prevLabel?: string;
  nextLabel?: string;

  // Callback
  onPageChange?: (page: number) => void;

  // Accessibility
  ariaLabel?: string;

  id?: string;
  className?: string;
}

export function PaginationRender({
  currentPage = 1,
  totalPages = 1,

  variant = "default",
  size = "md",
  shape = "rounded",

  activeColor,
  activeTextColor,
  color,

  showFirstLast = false,
  showPrevNext = true,
  siblingsCount = 1,
  boundaryCount = 1,

  prevLabel = "Previous",
  nextLabel = "Next",

  onPageChange,

  ariaLabel = "Pagination",

  id,
  className = "",
}: PaginationProps) {
  const sizeClasses = {
    sm: "h-8 min-w-8 text-xs px-2",
    md: "h-10 min-w-10 text-sm px-3",
    lg: "h-12 min-w-12 text-base px-4",
  }[size];

  const shapeClass = {
    rounded: "rounded-md",
    circle: "rounded-full",
    square: "rounded-none",
  }[shape];

  const btnColor = color || "var(--muted-foreground, #6b7280)";
  const acColor = activeColor || "var(--primary, #3b82f6)";
  const acTextColor = activeTextColor || "#ffffff";

  // Generate page numbers
  const generatePages = (): (number | "...")[] => {
    if (totalPages <= 1) return [1];

    const pages: (number | "...")[] = [];
    const left = Math.max(1, currentPage - siblingsCount);
    const right = Math.min(totalPages, currentPage + siblingsCount);

    // Boundary start
    for (let i = 1; i <= Math.min(boundaryCount, totalPages); i++) {
      if (!pages.includes(i)) pages.push(i);
    }

    // Ellipsis before siblings
    if (left > boundaryCount + 1) {
      pages.push("...");
    } else {
      for (let i = boundaryCount + 1; i < left; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
    }

    // Sibling range
    for (let i = left; i <= right; i++) {
      if (!pages.includes(i)) pages.push(i);
    }

    // Ellipsis after siblings
    if (right < totalPages - boundaryCount) {
      pages.push("...");
    } else {
      for (let i = right + 1; i <= totalPages - boundaryCount; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
    }

    // Boundary end
    for (
      let i = Math.max(1, totalPages - boundaryCount + 1);
      i <= totalPages;
      i++
    ) {
      if (!pages.includes(i)) pages.push(i);
    }

    return pages;
  };

  const pages = generatePages();

  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange?.(page);
    }
  };

  // Simple variant: just prev/next with page info
  if (variant === "simple") {
    return (
      <nav id={id} aria-label={ariaLabel} className={className}>
        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            onClick={() => handlePageClick(currentPage - 1)}
            disabled={currentPage <= 1}
            className={`${sizeClasses} ${shapeClass} inline-flex items-center justify-center border transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80`}
            style={{
              color: btnColor,
              borderColor: "var(--border, #e5e7eb)",
            }}
          >
            {prevLabel}
          </button>
          <span className="text-sm tabular-nums" style={{ color: btnColor }}>
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => handlePageClick(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className={`${sizeClasses} ${shapeClass} inline-flex items-center justify-center border transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80`}
            style={{
              color: btnColor,
              borderColor: "var(--border, #e5e7eb)",
            }}
          >
            {nextLabel}
          </button>
        </div>
      </nav>
    );
  }

  // Minimal variant: just page numbers
  if (variant === "minimal") {
    return (
      <nav id={id} aria-label={ariaLabel} className={className}>
        <div className="inline-flex items-center gap-1">
          {pages.map((page, idx) =>
            page === "..." ? (
              <span
                key={`e-${idx}`}
                className="px-1"
                style={{ color: btnColor }}
              >
                …
              </span>
            ) : (
              <button
                key={page}
                type="button"
                onClick={() => handlePageClick(page)}
                aria-current={page === currentPage ? "page" : undefined}
                className={`${sizeClasses} inline-flex items-center justify-center transition-opacity hover:opacity-80`}
                style={{
                  color: page === currentPage ? acColor : btnColor,
                  fontWeight: page === currentPage ? 600 : 400,
                }}
              >
                {page}
              </button>
            ),
          )}
        </div>
      </nav>
    );
  }

  // Dots variant
  if (variant === "dots") {
    return (
      <nav id={id} aria-label={ariaLabel} className={className}>
        <div className="inline-flex items-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => handlePageClick(page)}
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? "page" : undefined}
              className={`${page === currentPage ? "w-3 h-3" : "w-2 h-2"} rounded-full transition-all hover:opacity-80`}
              style={{
                backgroundColor:
                  page === currentPage ? acColor : "var(--border, #d1d5db)",
              }}
            />
          ))}
        </div>
      </nav>
    );
  }

  // Default variant: full pagination
  const chevronLeft = (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 19l-7-7 7-7"
      />
    </svg>
  );
  const chevronRight = (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
  const chevronsLeft = (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
      />
    </svg>
  );
  const chevronsRight = (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 5l7 7-7 7M5 5l7 7-7 7"
      />
    </svg>
  );

  return (
    <nav id={id} aria-label={ariaLabel} className={className}>
      <div className="inline-flex items-center gap-1">
        {showFirstLast && (
          <button
            type="button"
            onClick={() => handlePageClick(1)}
            disabled={currentPage <= 1}
            aria-label="First page"
            className={`${sizeClasses} ${shapeClass} inline-flex items-center justify-center transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80`}
            style={{ color: btnColor }}
          >
            {chevronsLeft}
          </button>
        )}
        {showPrevNext && (
          <button
            type="button"
            onClick={() => handlePageClick(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Previous page"
            className={`${sizeClasses} ${shapeClass} inline-flex items-center justify-center transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80`}
            style={{ color: btnColor }}
          >
            {chevronLeft}
          </button>
        )}
        {pages.map((page, idx) =>
          page === "..." ? (
            <span
              key={`e-${idx}`}
              className={`${sizeClasses} inline-flex items-center justify-center`}
              style={{ color: btnColor }}
            >
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => handlePageClick(page)}
              aria-current={page === currentPage ? "page" : undefined}
              className={`${sizeClasses} ${shapeClass} inline-flex items-center justify-center transition-all hover:opacity-80`}
              style={{
                backgroundColor: page === currentPage ? acColor : "transparent",
                color: page === currentPage ? acTextColor : btnColor,
                fontWeight: page === currentPage ? 600 : 400,
              }}
            >
              {page}
            </button>
          ),
        )}
        {showPrevNext && (
          <button
            type="button"
            onClick={() => handlePageClick(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label="Next page"
            className={`${sizeClasses} ${shapeClass} inline-flex items-center justify-center transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80`}
            style={{ color: btnColor }}
          >
            {chevronRight}
          </button>
        )}
        {showFirstLast && (
          <button
            type="button"
            onClick={() => handlePageClick(totalPages)}
            disabled={currentPage >= totalPages}
            aria-label="Last page"
            className={`${sizeClasses} ${shapeClass} inline-flex items-center justify-center transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80`}
            style={{ color: btnColor }}
          >
            {chevronsRight}
          </button>
        )}
      </div>
    </nav>
  );
}

// ============================================================================
// AVATAR - User Avatar
// ============================================================================

export interface AvatarProps {
  src?: string | ImageValue;
  alt?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  shape?: "circle" | "rounded" | "square";
  status?: "online" | "offline" | "busy" | "away";
  statusPosition?: "top-right" | "bottom-right";
  border?: boolean;
  borderColor?: string;
  fallbackColor?: string;
  // Link
  href?: string;
  target?: "_self" | "_blank";
  // Tooltip
  showTooltip?: boolean;
  // Ring
  ring?: boolean;
  ringColor?: string;
  ringWidth?: number;
  id?: string;
  className?: string;
}

export function AvatarRender({
  src,
  alt = "Avatar",
  name,
  size = "md",
  shape = "circle",
  status,
  statusPosition = "bottom-right",
  border = false,
  borderColor = "#ffffff",
  fallbackColor = "#e5e7eb",
  href,
  target = "_self",
  showTooltip = false,
  ring = false,
  ringColor,
  ringWidth = 2,
  id,
  className = "",
}: AvatarProps) {
  // Normalize src image
  const srcUrl = getImageUrl(src);
  const srcAlt = getImageAlt(src) || alt;

  const sizeClasses = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
    "2xl": "w-20 h-20 text-xl",
  }[size];
  const shapeClasses = {
    circle: "rounded-full",
    rounded: "rounded-lg",
    square: "rounded-none",
  }[shape];
  const statusSizeClasses = {
    xs: "w-1.5 h-1.5",
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
    xl: "w-3.5 h-3.5",
    "2xl": "w-4 h-4",
  }[size];
  const statusPositionClasses = {
    "top-right": "top-0 right-0",
    "bottom-right": "bottom-0 right-0",
  }[statusPosition];
  const statusColors = {
    online: "#22c55e",
    offline: "#6b7280",
    busy: "#ef4444",
    away: "#f59e0b",
  };

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "";

  const resolvedRingColor = ringColor || "var(--color-primary, #3b82f6)";

  // Merge ring + border: ring goes outside border
  const combinedShadow = [
    border ? `0 0 0 2px ${borderColor}` : "",
    ring ? `0 0 0 ${(border ? 2 : 0) + ringWidth}px ${resolvedRingColor}` : "",
  ]
    .filter(Boolean)
    .join(", ");

  const avatarShadowStyle: React.CSSProperties = combinedShadow
    ? { boxShadow: combinedShadow }
    : {};

  const avatarContent = (
    <div id={id} className={`group relative inline-flex ${className}`}>
      {srcUrl ? (
        <img
          src={srcUrl}
          alt={srcAlt}
          className={`${sizeClasses} ${shapeClasses} object-cover`}
          style={avatarShadowStyle}
          loading="lazy"
        />
      ) : (
        <div
          className={`${sizeClasses} ${shapeClasses} flex items-center justify-center font-medium`}
          style={{
            backgroundColor: fallbackColor,
            ...avatarShadowStyle,
          }}
        >
          {initials}
        </div>
      )}
      {status && (
        <span
          className={`absolute ${statusPositionClasses} ${statusSizeClasses} rounded-full`}
          style={{
            backgroundColor: statusColors[status],
            boxShadow: `0 0 0 2px ${borderColor}`,
          }}
          aria-label={status}
        />
      )}
      {showTooltip && name && (
        <span
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 whitespace-nowrap rounded px-2 py-1 text-xs opacity-0 transition-opacity group-hover:opacity-100"
          style={{
            backgroundColor: "var(--color-foreground, #1f2937)",
            color: "var(--color-background, #ffffff)",
          }}
          role="tooltip"
        >
          {name}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={target === "_blank" ? "noopener noreferrer" : undefined}
        className="inline-flex transition-opacity hover:opacity-80"
      >
        {avatarContent}
      </a>
    );
  }

  return avatarContent;
}

// ============================================================================
// PROGRESS - Progress Bar
// ============================================================================

export interface ProgressProps {
  value?: number;
  max?: number;
  indeterminate?: boolean;
  showValue?: boolean;
  valuePosition?: "inside" | "outside-right" | "above" | "below";
  valueFormat?: "percent" | "fraction" | "value";
  valueSuffix?: string;
  label?: string;
  labelPosition?: "above" | "left" | "below";
  description?: string;
  showMinMax?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  customHeight?: number;
  rounded?: "none" | "sm" | "md" | "lg" | "full";
  customBorderRadius?: string;
  variant?: "default" | "gradient" | "striped" | "segmented";
  color?: string;
  trackColor?: string;
  gradient?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
  gradientDirection?: "to-r" | "to-l" | "diagonal";
  segmented?: boolean;
  segmentCount?: number;
  segmentGap?: number;
  striped?: boolean;
  stripeAngle?: number;
  stripeWidth?: number;
  stripeColor?: string;
  animatedStripes?: boolean;
  glowEffect?: boolean;
  glowColor?: string;
  shadow?: "none" | "sm" | "md";
  innerShadow?: boolean;
  showMilestones?: boolean;
  milestones?: string;
  milestoneStyle?: "line" | "dot" | "diamond";
  milestoneColor?: string;
  animate?: boolean;
  animationDuration?: number;
  animateOnMount?: boolean;
  pulseAnimation?: boolean;
  useStatusColors?: boolean;
  successThreshold?: number;
  warningThreshold?: number;
  successColor?: string;
  warningColor?: string;
  errorColor?: string;
  circular?: boolean;
  circularSize?: number;
  circularStrokeWidth?: number;
  circularShowCenter?: boolean;
  hideOnMobile?: boolean;
  mobileSize?: "same" | "smaller";
  ariaLabel?: string;
  ariaValueText?: string;
  id?: string;
  className?: string;
}

export function ProgressRender({
  value = 50,
  max = 100,
  indeterminate = false,
  showValue = true,
  valuePosition = "outside-right",
  valueFormat = "percent",
  valueSuffix = "",
  label,
  labelPosition = "above",
  description,
  showMinMax = false,
  size = "md",
  customHeight,
  rounded = "full",
  customBorderRadius,
  variant = "default",
  color = "",
  trackColor = "",
  gradient = false,
  gradientFrom = "",
  gradientTo = "",
  gradientDirection = "to-r",
  segmented = false,
  segmentCount = 5,
  segmentGap = 2,
  striped = false,
  stripeAngle = 45,
  stripeWidth = 10,
  stripeColor,
  animatedStripes = false,
  glowEffect = false,
  glowColor,
  shadow = "none",
  innerShadow = false,
  showMilestones = false,
  milestones = "25,50,75",
  milestoneStyle = "line",
  milestoneColor,
  animate = true,
  animationDuration = 1000,
  animateOnMount = true,
  pulseAnimation = false,
  useStatusColors = false,
  successThreshold = 100,
  warningThreshold = 50,
  successColor = "#10b981",
  warningColor = "#f59e0b",
  errorColor = "#ef4444",
  circular = false,
  circularSize = 120,
  circularStrokeWidth = 10,
  circularShowCenter = true,
  hideOnMobile = false,
  mobileSize = "same",
  ariaLabel,
  ariaValueText,
  id,
  className = "",
}: ProgressProps) {
  const percentage = indeterminate
    ? 50
    : Math.min(100, Math.max(0, (value / max) * 100));

  // Resolve bar color (status colors take priority)
  const resolvedBarColor = (() => {
    if (useStatusColors) {
      if (percentage >= successThreshold) return successColor;
      if (percentage >= warningThreshold) return warningColor;
      return errorColor;
    }
    return color || "var(--brand-primary, #3b82f6)";
  })();

  const resolvedTrackBg = trackColor || "var(--color-muted, #e5e7eb)";
  const textColor = "var(--color-foreground, #374151)";
  const mutedColor = "var(--color-muted-foreground, #6b7280)";

  // Size classes
  const heightPx =
    customHeight || { xs: 4, sm: 6, md: 10, lg: 16, xl: 24 }[size];
  const mobileHeightPx =
    mobileSize === "smaller" ? Math.max(4, (heightPx || 10) * 0.7) : heightPx;

  // Border radius
  const radiusMap = {
    none: "0",
    sm: "2px",
    md: "4px",
    lg: "8px",
    full: "9999px",
  };
  const resolvedRadius = customBorderRadius || radiusMap[rounded] || "9999px";

  // Shadow
  const shadowStyle =
    shadow === "sm"
      ? "0 1px 2px rgba(0,0,0,0.1)"
      : shadow === "md"
        ? "0 2px 4px rgba(0,0,0,0.15)"
        : "none";

  // Gradient background
  const gradientBg = (() => {
    if (gradient || variant === "gradient") {
      const from = gradientFrom || resolvedBarColor;
      const to = gradientTo || "var(--brand-secondary, #8b5cf6)";
      if (gradientDirection === "diagonal")
        return `linear-gradient(135deg, ${from}, ${to})`;
      if (gradientDirection === "to-l")
        return `linear-gradient(270deg, ${from}, ${to})`;
      return `linear-gradient(90deg, ${from}, ${to})`;
    }
    return undefined;
  })();

  // Stripe background
  const stripeBg =
    striped || variant === "striped"
      ? `repeating-linear-gradient(${stripeAngle}deg, transparent, transparent ${stripeWidth}px, ${stripeColor || "rgba(255,255,255,0.2)"} ${stripeWidth}px, ${stripeColor || "rgba(255,255,255,0.2)"} ${stripeWidth * 2}px)`
      : undefined;

  // Format value display
  const formatValue = () => {
    if (indeterminate) return "...";
    if (valueFormat === "fraction") return `${value}/${max}${valueSuffix}`;
    if (valueFormat === "value") return `${value}${valueSuffix}`;
    return `${Math.round(percentage)}%${valueSuffix}`;
  };

  // Milestone markers
  const milestoneValues = showMilestones
    ? milestones
        .split(",")
        .map((m) => parseFloat(m.trim()))
        .filter((m) => !isNaN(m))
    : [];

  // Glow
  const glowStyle = glowEffect
    ? { boxShadow: `0 0 8px 2px ${glowColor || resolvedBarColor}40` }
    : {};

  // ── Circular mode ──
  if (circular) {
    const svgSize = circularSize;
    const radius = (svgSize - circularStrokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = indeterminate
      ? circumference * 0.25
      : circumference * (1 - percentage / 100);

    return (
      <div
        id={id}
        className={`inline-flex flex-col items-center ${hideOnMobile ? "hidden md:inline-flex" : ""} ${className}`}
      >
        {label && labelPosition === "above" && (
          <span
            className="text-sm font-medium mb-2"
            style={{ color: textColor }}
          >
            {label}
          </span>
        )}
        <div className="relative" style={{ width: svgSize, height: svgSize }}>
          <svg
            width={svgSize}
            height={svgSize}
            className={indeterminate ? "animate-spin" : ""}
            style={{ transform: "rotate(-90deg)" }}
          >
            {/* Track */}
            <circle
              cx={svgSize / 2}
              cy={svgSize / 2}
              r={radius}
              fill="none"
              stroke={resolvedTrackBg}
              strokeWidth={circularStrokeWidth}
            />
            {/* Progress */}
            <circle
              cx={svgSize / 2}
              cy={svgSize / 2}
              r={radius}
              fill="none"
              stroke={gradientBg ? undefined : resolvedBarColor}
              strokeWidth={circularStrokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{
                transition: animate
                  ? `stroke-dashoffset ${animationDuration}ms ease-out`
                  : "none",
                ...glowStyle,
              }}
            />
          </svg>
          {circularShowCenter && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold" style={{ color: textColor }}>
                {formatValue()}
              </span>
            </div>
          )}
        </div>
        {label && labelPosition === "below" && (
          <span
            className="text-sm font-medium mt-2"
            style={{ color: textColor }}
          >
            {label}
          </span>
        )}
        {description && (
          <span className="text-xs mt-1" style={{ color: mutedColor }}>
            {description}
          </span>
        )}
      </div>
    );
  }

  // ── Linear mode ──

  // Label row (above)
  const labelAbove =
    labelPosition === "above" &&
    (label || (showValue && valuePosition === "above"));
  const labelBelow = labelPosition === "below" && label;

  // Segmented rendering
  const renderSegments = segmented || variant === "segmented";
  const segmentWidth = renderSegments
    ? `calc((100% - ${(segmentCount - 1) * segmentGap}px) / ${segmentCount})`
    : undefined;
  const filledSegments = renderSegments
    ? Math.round((percentage / 100) * segmentCount)
    : 0;

  return (
    <div
      id={id}
      className={`${hideOnMobile ? "hidden md:block" : ""} ${className}`}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={ariaLabel || label || undefined}
      aria-valuetext={
        ariaValueText || (indeterminate ? "Loading" : formatValue())
      }
    >
      {/* Animated stripes keyframe */}
      {animatedStripes && (striped || variant === "striped") && (
        <style>{`@keyframes progressStripeMove { 0% { background-position: 0 0; } 100% { background-position: ${stripeWidth * 4}px 0; } }`}</style>
      )}
      {/* Indeterminate keyframe */}
      {indeterminate && (
        <style>{`@keyframes progressIndeterminate { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }`}</style>
      )}
      {/* Pulse keyframe */}
      {pulseAnimation && (
        <style>{`@keyframes progressPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }`}</style>
      )}

      {/* Label above + value */}
      {labelAbove && (
        <div className="flex justify-between mb-1.5 text-sm">
          {label && (
            <span className="font-medium" style={{ color: textColor }}>
              {label}
            </span>
          )}
          {showValue && valuePosition === "above" && (
            <span style={{ color: mutedColor }}>{formatValue()}</span>
          )}
        </div>
      )}

      {/* Label left layout */}
      <div
        className={labelPosition === "left" ? "flex items-center gap-3" : ""}
      >
        {labelPosition === "left" && label && (
          <span
            className="text-sm font-medium flex-shrink-0"
            style={{ color: textColor }}
          >
            {label}
          </span>
        )}

        <div className="flex-1 flex items-center gap-2">
          {/* Track */}
          {renderSegments ? (
            /* Segmented bar */
            <div className="flex-1 flex" style={{ gap: `${segmentGap}px` }}>
              {Array.from({ length: segmentCount }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: segmentWidth,
                    height: `${heightPx}px`,
                    borderRadius: resolvedRadius,
                    backgroundColor:
                      i < filledSegments ? resolvedBarColor : resolvedTrackBg,
                    transition: animate
                      ? `background-color ${animationDuration}ms ease-out`
                      : "none",
                    boxShadow: shadowStyle === "none" ? undefined : shadowStyle,
                  }}
                />
              ))}
            </div>
          ) : (
            /* Standard bar */
            <div
              className="flex-1 overflow-hidden relative"
              style={{
                height: `${heightPx}px`,
                borderRadius: resolvedRadius,
                backgroundColor: resolvedTrackBg,
                boxShadow: innerShadow
                  ? "inset 0 1px 3px rgba(0,0,0,0.15)"
                  : shadowStyle === "none"
                    ? undefined
                    : shadowStyle,
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: indeterminate ? "40%" : `${percentage}%`,
                  borderRadius: resolvedRadius,
                  backgroundColor: gradientBg ? undefined : resolvedBarColor,
                  backgroundImage: gradientBg || stripeBg || undefined,
                  backgroundSize: stripeBg
                    ? `${stripeWidth * 4}px ${stripeWidth * 4}px`
                    : undefined,
                  transition:
                    animate && !indeterminate
                      ? `width ${animationDuration}ms ease-out`
                      : "none",
                  animation: indeterminate
                    ? "progressIndeterminate 1.5s ease-in-out infinite"
                    : animatedStripes && stripeBg
                      ? `progressStripeMove 1s linear infinite`
                      : pulseAnimation
                        ? "progressPulse 2s ease-in-out infinite"
                        : undefined,
                  ...glowStyle,
                }}
              >
                {/* Value inside bar */}
                {showValue &&
                  valuePosition === "inside" &&
                  (heightPx || 10) >= 14 && (
                    <span
                      className="absolute inset-0 flex items-center justify-center text-xs font-medium"
                      style={{
                        color: isDarkBackground(resolvedBarColor)
                          ? "#ffffff"
                          : "#1f2937",
                      }}
                    >
                      {formatValue()}
                    </span>
                  )}
              </div>
              {/* Milestones */}
              {milestoneValues.map((m) => (
                <div
                  key={m}
                  className="absolute top-0 bottom-0"
                  style={{ left: `${m}%` }}
                >
                  {milestoneStyle === "line" && (
                    <div
                      className="w-0.5 h-full"
                      style={{
                        backgroundColor: milestoneColor || "rgba(0,0,0,0.3)",
                      }}
                    />
                  )}
                  {milestoneStyle === "dot" && (
                    <div
                      className="w-2 h-2 rounded-full absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                      style={{
                        backgroundColor: milestoneColor || "rgba(0,0,0,0.4)",
                      }}
                    />
                  )}
                  {milestoneStyle === "diamond" && (
                    <div
                      className="w-2 h-2 absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rotate-45"
                      style={{
                        backgroundColor: milestoneColor || "rgba(0,0,0,0.4)",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Value outside-right */}
          {showValue && valuePosition === "outside-right" && (
            <span
              className="text-sm flex-shrink-0"
              style={{ color: mutedColor }}
            >
              {formatValue()}
            </span>
          )}
        </div>
      </div>

      {/* Label below */}
      {labelBelow && (
        <span
          className="text-sm font-medium mt-1.5 block"
          style={{ color: textColor }}
        >
          {label}
        </span>
      )}

      {/* Value below */}
      {showValue && valuePosition === "below" && (
        <span className="text-sm mt-1 block" style={{ color: mutedColor }}>
          {formatValue()}
        </span>
      )}

      {/* Min/Max labels */}
      {showMinMax && (
        <div
          className="flex justify-between mt-1 text-xs"
          style={{ color: mutedColor }}
        >
          <span>0</span>
          <span>{max}</span>
        </div>
      )}

      {/* Description */}
      {description && (
        <p className="text-xs mt-1" style={{ color: mutedColor }}>
          {description}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// ALERT - Alert/Notification
// ============================================================================

export interface AlertProps {
  title?: string;
  message?: string;
  description?: string;
  variant?: "info" | "success" | "warning" | "error" | "neutral" | "custom";
  customBackgroundColor?: string;
  customTextColor?: string;
  customBorderColor?: string;
  customIconColor?: string;
  showIcon?: boolean;
  customIcon?: string;
  iconPosition?: "left" | "top";
  iconSize?: "sm" | "md" | "lg";
  size?: "sm" | "md" | "lg";
  layout?: "horizontal" | "vertical";
  fullWidth?: boolean;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
  showBorder?: boolean;
  borderWidth?: "1" | "2" | "4";
  borderStyle?: "solid" | "dashed";
  borderPosition?: "all" | "left" | "top" | "bottom";
  borderRadius?: "none" | "sm" | "md" | "lg";
  shadow?: "none" | "sm" | "md" | "lg";
  shadowColor?: string;
  showActions?: boolean;
  primaryActionText?: string;
  primaryActionLink?: string;
  secondaryActionText?: string;
  secondaryActionLink?: string;
  closable?: boolean;
  closeButtonPosition?: "top-right" | "center-right";
  closeButtonStyle?: "icon" | "text";
  autoClose?: boolean;
  autoCloseDelay?: number;
  showProgress?: boolean;
  progressValue?: number;
  progressColor?: string;
  progressPosition?: "top" | "bottom";
  showLink?: boolean;
  linkText?: string;
  linkUrl?: string;
  linkTarget?: "_self" | "_blank";
  animateOnMount?: boolean;
  animationType?: "fade" | "slide-down" | "slide-up" | "scale";
  animationDuration?: number;
  hideOnMobile?: boolean;
  mobileSize?: "same" | "smaller";
  stackOnMobile?: boolean;
  ariaLabel?: string;
  role?: "alert" | "status" | "log";
  live?: "off" | "polite" | "assertive";
  id?: string;
  className?: string;
  onClose?: () => void;
}

export function AlertRender({
  title,
  message,
  description,
  variant = "info",
  customBackgroundColor,
  customTextColor,
  customBorderColor,
  customIconColor,
  showIcon = true,
  customIcon,
  iconPosition = "left",
  iconSize = "md",
  size = "md",
  layout = "horizontal",
  fullWidth = true,
  maxWidth = "full",
  showBorder = true,
  borderWidth = "1",
  borderStyle = "solid",
  borderPosition = "all",
  borderRadius = "md",
  shadow = "none",
  shadowColor,
  showActions = false,
  primaryActionText,
  primaryActionLink,
  secondaryActionText,
  secondaryActionLink,
  closable = false,
  closeButtonPosition = "top-right",
  closeButtonStyle = "icon",
  autoClose = false,
  autoCloseDelay = 5,
  showProgress = false,
  progressValue = 0,
  progressColor,
  progressPosition = "bottom",
  showLink = false,
  linkText = "Learn more",
  linkUrl,
  linkTarget = "_self",
  animateOnMount = true,
  animationType = "fade",
  animationDuration = 300,
  hideOnMobile = false,
  mobileSize = "same",
  stackOnMobile = true,
  ariaLabel,
  role = "alert",
  live = "polite",
  id,
  className = "",
  onClose,
}: AlertProps) {
  // Variant color schemes
  const variantStyles: Record<
    string,
    { bg: string; border: string; text: string; iconColor: string }
  > = {
    info: {
      bg: "#f0f9ff",
      border: "#bae6fd",
      text: "#075985",
      iconColor: "#0ea5e9",
    },
    success: {
      bg: "#f0fdf4",
      border: "#bbf7d0",
      text: "#166534",
      iconColor: "#22c55e",
    },
    warning: {
      bg: "#fefce8",
      border: "#fde68a",
      text: "#854d0e",
      iconColor: "#eab308",
    },
    error: {
      bg: "#fef2f2",
      border: "#fecaca",
      text: "#991b1b",
      iconColor: "#ef4444",
    },
    neutral: {
      bg: "#f9fafb",
      border: "#e5e7eb",
      text: "#374151",
      iconColor: "#6b7280",
    },
    custom: {
      bg: customBackgroundColor || "#f9fafb",
      border: customBorderColor || "#e5e7eb",
      text: customTextColor || "#374151",
      iconColor: customIconColor || "#6b7280",
    },
  };

  const icons: Record<string, React.ReactNode> = {
    info: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
    success: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
    warning: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    ),
    error: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
    neutral: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
    custom: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  };

  const styles = variantStyles[variant] || variantStyles.info;

  // Size
  const sizeStyles = {
    sm: { padding: "12px", fontSize: "14px" },
    md: { padding: "16px", fontSize: "16px" },
    lg: { padding: "20px", fontSize: "18px" },
  }[mobileSize === "smaller" && size !== "sm" ? "sm" : size];

  // Icon size
  const iconSizeClasses = { sm: "w-4 h-4", md: "w-5 h-5", lg: "w-6 h-6" }[
    iconSize
  ];

  // Border
  const borderMap: Record<string, React.CSSProperties> = {
    all: { border: `${borderWidth}px ${borderStyle} ${styles.border}` },
    left: {
      borderLeft: `${Number(borderWidth) * 2 || 4}px ${borderStyle} ${styles.border}`,
    },
    top: {
      borderTop: `${Number(borderWidth) * 2 || 4}px ${borderStyle} ${styles.border}`,
    },
    bottom: {
      borderBottom: `${Number(borderWidth) * 2 || 4}px ${borderStyle} ${styles.border}`,
    },
  };
  const borderStyles = showBorder
    ? borderMap[borderPosition] || borderMap.all
    : {};

  // Border radius
  const radiusMap = { none: "0", sm: "4px", md: "8px", lg: "12px" };
  const resolvedRadius = radiusMap[borderRadius] || "8px";

  // Shadow
  const shadowMap = {
    none: "none",
    sm: shadowColor ? `0 1px 2px ${shadowColor}` : "0 1px 2px rgba(0,0,0,0.1)",
    md: shadowColor ? `0 2px 8px ${shadowColor}` : "0 2px 8px rgba(0,0,0,0.12)",
    lg: shadowColor
      ? `0 4px 16px ${shadowColor}`
      : "0 4px 16px rgba(0,0,0,0.15)",
  };

  // Max width
  const maxWidthMap = {
    sm: "24rem",
    md: "28rem",
    lg: "32rem",
    xl: "36rem",
    full: "100%",
  };

  // Animation
  const animationMap: Record<string, string> = {
    fade: `alertFadeIn ${animationDuration}ms ease-out`,
    "slide-down": `alertSlideDown ${animationDuration}ms ease-out`,
    "slide-up": `alertSlideUp ${animationDuration}ms ease-out`,
    scale: `alertScaleIn ${animationDuration}ms ease-out`,
  };

  const isVertical = layout === "vertical" || iconPosition === "top";
  const hasActions = showActions && (primaryActionText || secondaryActionText);
  const hasProgressBar = showProgress && progressValue > 0;

  // Close button
  const closeButton = closable && (
    <button
      className={`flex-shrink-0 hover:opacity-75 transition-opacity ${closeButtonPosition === "center-right" ? "self-center" : ""}`}
      style={{ color: styles.text, padding: "4px" }}
      onClick={onClose}
      aria-label="Close"
    >
      {closeButtonStyle === "text" ? (
        <span className="text-sm font-medium">Dismiss</span>
      ) : (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      )}
    </button>
  );

  // Progress bar element
  const progressBar = hasProgressBar && (
    <div
      className="overflow-hidden"
      style={{
        height: "3px",
        backgroundColor: `${styles.border}`,
        ...(progressPosition === "top"
          ? { borderRadius: `${resolvedRadius} ${resolvedRadius} 0 0` }
          : { borderRadius: `0 0 ${resolvedRadius} ${resolvedRadius}` }),
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${Math.min(100, Math.max(0, progressValue))}%`,
          backgroundColor: progressColor || styles.iconColor,
          transition: "width 300ms ease-out",
        }}
      />
    </div>
  );

  // Icon element
  const iconElement =
    showIcon &&
    (customIcon ? (
      <span
        className={`flex-shrink-0 ${iconSizeClasses.replace("w-", "text-").replace(/h-\S+/, "")}`}
        style={{ color: styles.iconColor }}
      >
        {customIcon}
      </span>
    ) : (
      <svg
        className={`${iconSizeClasses} flex-shrink-0`}
        style={{ color: styles.iconColor }}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        {icons[variant] || icons.info}
      </svg>
    ));

  return (
    <>
      {animateOnMount && (
        <style>{`
          @keyframes alertFadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes alertSlideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes alertSlideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes alertScaleIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
        `}</style>
      )}
      <div
        id={id}
        className={`${hideOnMobile ? "hidden md:block" : ""} ${fullWidth ? "w-full" : "inline-block"} ${className}`}
        style={{
          maxWidth: maxWidthMap[maxWidth] || "100%",
          backgroundColor: styles.bg,
          color: styles.text,
          borderRadius: resolvedRadius,
          boxShadow: shadowMap[shadow],
          padding: sizeStyles.padding,
          fontSize: sizeStyles.fontSize,
          ...borderStyles,
          ...(animateOnMount ? { animation: animationMap[animationType] } : {}),
        }}
        role={role}
        aria-label={ariaLabel || undefined}
        aria-live={live !== "off" ? live : undefined}
      >
        {/* Progress bar top */}
        {hasProgressBar && progressPosition === "top" && (
          <div
            style={{
              margin: `-${sizeStyles.padding} -${sizeStyles.padding} 12px -${sizeStyles.padding}`,
            }}
          >
            {progressBar}
          </div>
        )}

        {/* Main content */}
        <div
          className={`flex ${isVertical ? "flex-col gap-2" : "items-start gap-3"} ${stackOnMobile && !isVertical ? "max-md:flex-col max-md:gap-2" : ""}`}
        >
          {iconElement}
          <div className="flex-1 min-w-0">
            {title && <p className="font-semibold mb-0.5">{title}</p>}
            {message && <p className="opacity-90">{message}</p>}
            {description && (
              <p className="opacity-70 text-sm mt-1">{description}</p>
            )}

            {/* Link */}
            {showLink && linkUrl && (
              <a
                href={linkUrl}
                target={linkTarget}
                rel={
                  linkTarget === "_blank" ? "noopener noreferrer" : undefined
                }
                className="inline-block mt-2 font-medium underline hover:no-underline text-sm"
                style={{ color: styles.iconColor }}
              >
                {linkText}
              </a>
            )}

            {/* Actions */}
            {hasActions && (
              <div className="flex items-center gap-3 mt-3">
                {primaryActionText && (
                  <a
                    href={primaryActionLink || "#"}
                    className="px-3 py-1.5 text-sm font-medium rounded-md text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: styles.iconColor }}
                  >
                    {primaryActionText}
                  </a>
                )}
                {secondaryActionText && (
                  <a
                    href={secondaryActionLink || "#"}
                    className="px-3 py-1.5 text-sm font-medium rounded-md transition-opacity hover:opacity-80"
                    style={{
                      border: `1px solid ${styles.border}`,
                      color: styles.text,
                    }}
                  >
                    {secondaryActionText}
                  </a>
                )}
              </div>
            )}
          </div>
          {closeButton}
        </div>

        {/* Progress bar bottom */}
        {hasProgressBar && progressPosition === "bottom" && (
          <div
            style={{
              margin: `12px -${sizeStyles.padding} -${sizeStyles.padding} -${sizeStyles.padding}`,
            }}
          >
            {progressBar}
          </div>
        )}
      </div>
    </>
  );
}

// ============================================================================
// TOOLTIP - Hover Tooltip
// ============================================================================

export interface TooltipProps {
  children?: React.ReactNode;
  text?: string;
  position?: "top" | "bottom" | "left" | "right";
  variant?:
    | "dark"
    | "light"
    | "primary"
    | "success"
    | "warning"
    | "error"
    | "custom";
  customBackgroundColor?: string;
  customTextColor?: string;
  delay?: number;
  id?: string;
  className?: string;
}

export function TooltipRender({
  children,
  text = "Tooltip",
  position = "top",
  variant = "dark",
  customBackgroundColor,
  customTextColor,
  delay = 0,
  id,
  className = "",
}: TooltipProps) {
  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  }[position];

  const variantStyles: Record<
    string,
    { bg: string; text: string; extra?: string }
  > = {
    dark: { bg: "#111827", text: "#ffffff" },
    light: {
      bg: "#ffffff",
      text: "#111827",
      extra: "border border-gray-200 shadow-lg",
    },
    primary: { bg: "#2563eb", text: "#ffffff" },
    success: { bg: "#16a34a", text: "#ffffff" },
    warning: { bg: "#d97706", text: "#ffffff" },
    error: { bg: "#dc2626", text: "#ffffff" },
    custom: {
      bg: customBackgroundColor || "#111827",
      text: customTextColor || "#ffffff",
    },
  };

  const styles = variantStyles[variant] || variantStyles.dark;

  return (
    <span id={id} className={`relative inline-flex group ${className}`}>
      {children}
      <span
        className={`absolute ${positionClasses} ${styles.extra || ""} px-2 py-1 text-xs rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50`}
        style={{ backgroundColor: styles.bg, color: styles.text }}
      >
        {text}
      </span>
    </span>
  );
}

// ============================================================================
// TYPEWRITER - Animated Typing Effect
// ============================================================================

export interface TypewriterProps {
  texts?: string[];
  prefix?: string;
  suffix?: string;
  // Timing
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  startDelay?: number;
  delayBetweenTexts?: number;
  // Behavior
  loop?: boolean;
  loopCount?: number;
  deleteOnComplete?: boolean;
  shuffleTexts?: boolean;
  startTypingOnView?: boolean;
  // Cursor
  showCursor?: boolean;
  cursor?: boolean; // backward compat alias
  cursorChar?: string;
  cursorColor?: string;
  cursorBlinkSpeed?: "slow" | "normal" | "fast";
  cursorStyle?: "bar" | "block" | "underscore";
  hideCursorOnComplete?: boolean;
  // Typography
  fontSize?: string;
  textSize?: ResponsiveValue<
    "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl"
  >;
  fontWeight?: "normal" | "medium" | "semibold" | "bold" | "extrabold";
  fontFamily?: string;
  letterSpacing?: string;
  textColor?: string;
  highlightColor?: string;
  // Animations
  typingAnimation?: "default" | "smooth" | "mechanical" | "bounce";
  deleteAnimation?: "default" | "fade" | "collapse";
  errorEffect?: boolean;
  errorProbability?: number;
  // Layout
  multiline?: boolean;
  lineHeight?: string;
  textAlign?: "left" | "center" | "right";
  minHeight?: string;
  // Container styling
  backgroundColor?: string;
  padding?: string;
  borderRadius?: string;
  // Responsive
  hideOnMobile?: boolean;
  mobileFontSize?: string;
  // Accessibility
  ariaLabel?: string;
  reduceMotion?: boolean;
  id?: string;
  className?: string;
}

export function TypewriterRender({
  texts = ["Hello World", "Welcome", "Start Typing"],
  prefix = "",
  suffix = "",
  typingSpeed = 100,
  deletingSpeed = 50,
  pauseDuration = 2000,
  startDelay = 0,
  delayBetweenTexts = 500,
  loop = true,
  loopCount,
  deleteOnComplete = true,
  shuffleTexts = false,
  startTypingOnView = false,
  showCursor,
  cursor = true,
  cursorChar = "|",
  cursorColor = "",
  cursorBlinkSpeed = "normal",
  cursorStyle = "bar",
  hideCursorOnComplete = false,
  fontSize = "",
  textSize = "2xl",
  fontWeight = "bold",
  fontFamily = "",
  letterSpacing = "",
  textColor = "",
  highlightColor = "",
  typingAnimation = "default",
  deleteAnimation = "default",
  errorEffect = false,
  errorProbability = 0.05,
  multiline = false,
  lineHeight = "",
  textAlign = "left",
  minHeight = "",
  backgroundColor = "",
  padding = "",
  borderRadius = "",
  hideOnMobile = false,
  mobileFontSize = "",
  ariaLabel = "",
  reduceMotion = false,
  id,
  className = "",
}: TypewriterProps) {
  const showCursorResolved = showCursor ?? cursor;
  const prefersReducedMotion =
    typeof window !== "undefined"
      ? window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
      : false;
  const shouldAnimate = !reduceMotion && !prefersReducedMotion;

  // Typing state machine
  const [displayText, setDisplayText] = React.useState("");
  const [textIndex, setTextIndex] = React.useState(0);
  const [charIndex, setCharIndex] = React.useState(0);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isComplete, setIsComplete] = React.useState(false);
  const [isStarted, setIsStarted] = React.useState(
    !startTypingOnView && startDelay === 0,
  );
  const [loopsCompleted, setLoopsCompleted] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout>>(null);

  // Get ordered text list
  const textList = React.useMemo(() => {
    if (!texts || texts.length === 0) return ["Type something..."];
    if (shuffleTexts) {
      const arr = [...texts];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }
    return texts;
  }, [texts, shuffleTexts]);

  // Start delay
  React.useEffect(() => {
    if (startDelay > 0 && !startTypingOnView) {
      const timer = setTimeout(() => setIsStarted(true), startDelay);
      return () => clearTimeout(timer);
    }
  }, [startDelay, startTypingOnView]);

  // Scroll-into-view trigger
  React.useEffect(() => {
    if (!startTypingOnView || !containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (startDelay > 0) {
            setTimeout(() => setIsStarted(true), startDelay);
          } else {
            setIsStarted(true);
          }
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [startTypingOnView, startDelay]);

  // Main typing engine
  React.useEffect(() => {
    if (!shouldAnimate || !isStarted || isComplete) {
      if (!shouldAnimate) setDisplayText(textList[0] || "");
      return;
    }

    const currentText = textList[textIndex] || "";

    if (!isDeleting) {
      // Typing phase
      if (charIndex < currentText.length) {
        let delay = typingSpeed;
        // Animation variants
        if (typingAnimation === "mechanical")
          delay = typingSpeed + Math.random() * typingSpeed * 0.5;
        if (typingAnimation === "bounce")
          delay = typingSpeed * (0.5 + Math.random() * 1);

        // Error effect — occasionally type wrong character then fix
        if (errorEffect && Math.random() < errorProbability && charIndex > 0) {
          const wrongChar = String.fromCharCode(
            97 + Math.floor(Math.random() * 26),
          );
          setDisplayText(currentText.slice(0, charIndex) + wrongChar);
          timerRef.current = setTimeout(() => {
            setDisplayText(currentText.slice(0, charIndex + 1));
            setCharIndex((c) => c + 1);
          }, delay * 2);
          return;
        }

        timerRef.current = setTimeout(() => {
          setDisplayText(currentText.slice(0, charIndex + 1));
          setCharIndex((c) => c + 1);
        }, delay);
      } else {
        // Finished typing current text
        const isLast = textIndex === textList.length - 1;
        const shouldLoop =
          loop && (loopCount === undefined || loopsCompleted < loopCount);

        if (isLast && !shouldLoop && !deleteOnComplete) {
          setIsComplete(true);
          return;
        }

        timerRef.current = setTimeout(() => {
          if (deleteOnComplete || !isLast || shouldLoop) {
            setIsDeleting(true);
          } else {
            setIsComplete(true);
          }
        }, pauseDuration);
      }
    } else {
      // Deleting phase
      if (charIndex > 0) {
        let delay = deletingSpeed;
        if (deleteAnimation === "fade") delay = deletingSpeed * 0.5;
        if (deleteAnimation === "collapse") delay = deletingSpeed * 0.3;

        timerRef.current = setTimeout(() => {
          setDisplayText(currentText.slice(0, charIndex - 1));
          setCharIndex((c) => c - 1);
        }, delay);
      } else {
        // Finished deleting, move to next text
        setIsDeleting(false);
        const nextIndex = (textIndex + 1) % textList.length;
        if (nextIndex === 0) {
          setLoopsCompleted((l) => l + 1);
          if (loopCount !== undefined && loopsCompleted + 1 >= loopCount) {
            setIsComplete(true);
            return;
          }
        }
        timerRef.current = setTimeout(() => {
          setTextIndex(nextIndex);
          setCharIndex(0);
          setDisplayText("");
        }, delayBetweenTexts);
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    shouldAnimate,
    isStarted,
    isComplete,
    charIndex,
    isDeleting,
    textIndex,
    textList,
    typingSpeed,
    deletingSpeed,
    pauseDuration,
    delayBetweenTexts,
    loop,
    loopCount,
    loopsCompleted,
    deleteOnComplete,
    typingAnimation,
    deleteAnimation,
    errorEffect,
    errorProbability,
  ]);

  // Size classes
  const sizeClasses = fontSize
    ? ""
    : getResponsiveClasses(textSize, {
        xs: ["text-xs", "md:text-xs", "lg:text-xs"],
        sm: ["text-sm", "md:text-sm", "lg:text-sm"],
        base: ["text-base", "md:text-base", "lg:text-base"],
        lg: ["text-lg", "md:text-lg", "lg:text-lg"],
        xl: ["text-xl", "md:text-xl", "lg:text-xl"],
        "2xl": ["text-xl", "md:text-2xl", "lg:text-2xl"],
        "3xl": ["text-2xl", "md:text-3xl", "lg:text-3xl"],
        "4xl": ["text-3xl", "md:text-4xl", "lg:text-4xl"],
        "5xl": ["text-4xl", "md:text-5xl", "lg:text-5xl"],
      });

  const weightClasses: Record<string, string> = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
    extrabold: "font-extrabold",
  };

  const cursorBlinkClasses: Record<string, string> = {
    slow: "animate-pulse",
    normal: "animate-[blink_1s_step-end_infinite]",
    fast: "animate-[blink_0.5s_step-end_infinite]",
  };

  const cursorStyleChar =
    cursorStyle === "block"
      ? "█"
      : cursorStyle === "underscore"
        ? "_"
        : cursorChar;

  const containerStyle: React.CSSProperties = {
    ...(backgroundColor ? { backgroundColor } : {}),
    ...(padding ? { padding } : {}),
    ...(borderRadius ? { borderRadius } : {}),
    ...(minHeight ? { minHeight } : {}),
    ...(textAlign ? { textAlign } : {}),
    ...(fontFamily ? { fontFamily } : {}),
    ...(fontSize ? { fontSize } : {}),
    ...(letterSpacing ? { letterSpacing } : {}),
    ...(lineHeight ? { lineHeight } : {}),
  };

  const textStyle: React.CSSProperties = {
    color: resolveContrastColor(textColor || "var(--color-foreground, #111827)", isDarkBackground(backgroundColor)),
    ...(highlightColor
      ? {
          backgroundColor: highlightColor,
          padding: "0 0.2em",
          borderRadius: "0.15em",
        }
      : {}),
  };

  const showCursorNow =
    showCursorResolved && !(isComplete && hideCursorOnComplete);

  // Fallback for SSR / reduced motion
  const finalText = shouldAnimate ? displayText : textList[0] || "";

  return (
    <div
      ref={containerRef}
      id={id}
      className={`${multiline ? "block" : "inline-flex items-center"} ${sizeClasses} ${weightClasses[fontWeight] || "font-bold"} ${hideOnMobile ? "hidden md:inline-flex" : ""} ${className}`}
      style={containerStyle}
      aria-label={ariaLabel || `Typewriter: ${textList.join(", ")}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {prefix && <span className="mr-1">{prefix}</span>}
      <span className="typewriter-text" style={textStyle}>
        {finalText}
      </span>
      {showCursorNow && (
        <span
          className={`ml-0.5 ${cursorBlinkClasses[cursorBlinkSpeed] || cursorBlinkClasses.normal}`}
          style={{
            color: cursorColor || textStyle.color || "var(--color-foreground)",
          }}
          aria-hidden="true"
        >
          {cursorStyleChar}
        </span>
      )}
      {suffix && <span className="ml-1">{suffix}</span>}
      {mobileFontSize && (
        <style>{`@media (max-width: 768px) { #${id || "typewriter"} .typewriter-text { font-size: ${mobileFontSize} !important; } }`}</style>
      )}
    </div>
  );
}

// ============================================================================
// PARALLAX - Parallax Scrolling Background
// ============================================================================

export interface ParallaxProps {
  children?: React.ReactNode;
  backgroundImage?: string | ImageValue;
  backgroundVideo?: string;
  backgroundPosition?: "center" | "top" | "bottom" | "left" | "right";
  backgroundSize?: "cover" | "contain" | "auto";
  backgroundRepeat?: "no-repeat" | "repeat" | "repeat-x" | "repeat-y";
  speed?: number;
  direction?: "up" | "down" | "left" | "right";
  maxOffset?: number;
  easing?: "linear" | "ease" | "ease-in" | "ease-out";
  disabled?: boolean;
  // Overlay
  overlay?: boolean;
  showOverlay?: boolean; // alias
  overlayColor?: string;
  overlayOpacity?: number;
  overlayGradient?: boolean;
  overlayGradientDirection?:
    | "to-bottom"
    | "to-top"
    | "to-left"
    | "to-right"
    | "radial";
  // Height
  height?: string;
  minHeight?:
    | ResponsiveValue<"sm" | "md" | "lg" | "xl" | "screen" | "auto">
    | string;
  maxHeight?: string;
  fullScreen?: boolean;
  // Content
  contentPosition?: "top" | "center" | "bottom";
  contentAlignment?: "start" | "center" | "end";
  contentAlign?: "left" | "center" | "right"; // alias
  contentMaxWidth?: string;
  contentPadding?: string;
  // Layers
  layers?: Array<{
    image?: string;
    speed?: number;
    opacity?: number;
    zIndex?: number;
  }>;
  // Effects
  blur?: number;
  scale?: number;
  rotate?: number;
  opacity?: number;
  fadeOnScroll?: boolean;
  // Border/shadow
  borderRadius?: string;
  shadow?: string;
  showBorder?: boolean;
  borderColor?: string;
  // Animations
  animateOnMount?: boolean;
  animationType?: "fade" | "scale" | "slide" | "blur";
  animationDuration?: number;
  // Mobile
  disableOnMobile?: boolean;
  mobileHeight?: string;
  mobileFallbackImage?: string | ImageValue;
  // Accessibility
  ariaLabel?: string;
  reducedMotion?: boolean;
  id?: string;
  className?: string;
}

export function ParallaxRender({
  children,
  backgroundImage = "/placeholder.jpg",
  backgroundVideo = "",
  backgroundPosition = "center",
  backgroundSize = "cover",
  backgroundRepeat = "no-repeat",
  speed = 0.5,
  direction = "up",
  maxOffset = 200,
  easing = "linear",
  disabled = false,
  overlay,
  showOverlay,
  overlayColor = "#000000",
  overlayOpacity = 50,
  overlayGradient = false,
  overlayGradientDirection = "to-bottom",
  height = "",
  minHeight = "lg",
  maxHeight = "",
  fullScreen = false,
  contentPosition = "center",
  contentAlignment = "center",
  contentAlign,
  contentMaxWidth = "",
  contentPadding = "",
  layers = [],
  blur: blurAmount = 0,
  scale: scaleAmount = 1,
  rotate: rotateAmount = 0,
  opacity: bgOpacity = 100,
  fadeOnScroll = false,
  borderRadius = "",
  shadow = "",
  showBorder = false,
  borderColor = "",
  animateOnMount = false,
  animationType = "fade",
  animationDuration = 600,
  disableOnMobile = false,
  mobileHeight = "",
  mobileFallbackImage,
  ariaLabel = "",
  reducedMotion = false,
  id,
  className = "",
}: ParallaxProps) {
  const bgImageUrl = getImageUrl(backgroundImage) || "/placeholder.jpg";
  const mobileFallbackUrl = mobileFallbackImage
    ? getImageUrl(mobileFallbackImage)
    : "";
  const showOverlayResolved = showOverlay ?? overlay ?? true;
  const contentAlignResolved = contentAlign || contentAlignment;

  const prefersReducedMotion =
    typeof window !== "undefined"
      ? window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
      : false;
  const shouldAnimate = !disabled && !reducedMotion && !prefersReducedMotion;

  // Parallax scroll tracking
  const containerRef = React.useRef<HTMLDivElement>(null);
  const bgRef = React.useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(false);
  const [scrollFade, setScrollFade] = React.useState(1);

  React.useEffect(() => {
    if (animateOnMount) {
      const timer = setTimeout(() => setMounted(true), 50);
      return () => clearTimeout(timer);
    } else {
      setMounted(true);
    }
  }, [animateOnMount]);

  // Parallax scroll effect
  React.useEffect(() => {
    if (!shouldAnimate || !containerRef.current || !bgRef.current) return;

    let rafId: number;
    const handleScroll = () => {
      rafId = requestAnimationFrame(() => {
        const container = containerRef.current;
        const bg = bgRef.current;
        if (!container || !bg) return;

        const rect = container.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const scrollProgress =
          (viewportHeight - rect.top) / (viewportHeight + rect.height);

        // Calculate parallax offset clamped to maxOffset
        const clampedProgress = Math.max(0, Math.min(1, scrollProgress));
        const offset = (clampedProgress - 0.5) * 2 * maxOffset * speed;

        let tx = 0,
          ty = 0;
        if (direction === "up" || direction === "down") {
          ty = direction === "up" ? -offset : offset;
        } else {
          tx = direction === "left" ? -offset : offset;
        }

        const transforms: string[] = [];
        if (tx !== 0 || ty !== 0)
          transforms.push(`translate3d(${tx}px, ${ty}px, 0)`);
        if (scaleAmount !== 1) transforms.push(`scale(${scaleAmount})`);
        if (rotateAmount !== 0) transforms.push(`rotate(${rotateAmount}deg)`);

        bg.style.transform = transforms.join(" ") || "none";
        bg.style.transition =
          easing === "linear" ? "none" : `transform 0.1s ${easing}`;

        // Fade on scroll
        if (fadeOnScroll) {
          const fadeVal = 1 - clampedProgress * 0.7;
          setScrollFade(Math.max(0.3, fadeVal));
        }
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [
    shouldAnimate,
    speed,
    direction,
    maxOffset,
    easing,
    scaleAmount,
    rotateAmount,
    fadeOnScroll,
  ]);

  // Height classes
  const heightClasses = fullScreen
    ? "min-h-screen"
    : typeof minHeight === "string" &&
        !["sm", "md", "lg", "xl", "screen", "auto"].includes(minHeight)
      ? ""
      : getResponsiveClasses(
          minHeight as ResponsiveValue<
            "sm" | "md" | "lg" | "xl" | "screen" | "auto"
          >,
          {
            sm: ["min-h-[200px]", "md:min-h-[250px]", "lg:min-h-[300px]"],
            md: ["min-h-[300px]", "md:min-h-[400px]", "lg:min-h-[500px]"],
            lg: ["min-h-[400px]", "md:min-h-[500px]", "lg:min-h-[600px]"],
            xl: ["min-h-[500px]", "md:min-h-[600px]", "lg:min-h-[800px]"],
            screen: ["min-h-screen", "md:min-h-screen", "lg:min-h-screen"],
            auto: ["min-h-auto", "md:min-h-auto", "lg:min-h-auto"],
          },
        );

  const alignmentMap: Record<string, string> = {
    start: "items-start justify-start",
    center: "items-center justify-center",
    end: "items-end justify-end",
    left: "items-start justify-start",
    right: "items-end justify-end",
  };

  const positionMap: Record<string, string> = {
    top: "items-start",
    center: "items-center",
    bottom: "items-end",
  };

  // Overlay gradient
  const overlayGradientStyle: React.CSSProperties = overlayGradient
    ? (() => {
        const dir =
          overlayGradientDirection === "radial"
            ? ""
            : overlayGradientDirection === "to-bottom"
              ? "to bottom"
              : overlayGradientDirection === "to-top"
                ? "to top"
                : overlayGradientDirection === "to-left"
                  ? "to left"
                  : "to right";
        const color = overlayColor || "#000000";
        const op = (overlayOpacity || 50) / 100;
        if (overlayGradientDirection === "radial") {
          return {
            background: `radial-gradient(circle, ${color}00 0%, ${color} 100%)`,
            opacity: op,
          };
        }
        return {
          background: `linear-gradient(${dir}, ${color}00 0%, ${color} 100%)`,
          opacity: op,
        };
      })()
    : { backgroundColor: overlayColor, opacity: (overlayOpacity || 50) / 100 };

  // Mount animation
  const mountStyle: React.CSSProperties = animateOnMount
    ? {
        transition: `all ${animationDuration}ms ease-out`,
        opacity: mounted
          ? 1
          : animationType === "fade" || animationType === "blur"
            ? 0
            : 1,
        transform: mounted
          ? "none"
          : animationType === "scale"
            ? "scale(0.95)"
            : animationType === "slide"
              ? "translateY(20px)"
              : "none",
        filter: mounted
          ? "none"
          : animationType === "blur"
            ? "blur(10px)"
            : "none",
      }
    : {};

  // Container style
  const containerStyle: React.CSSProperties = {
    ...mountStyle,
    ...(height ? { height } : {}),
    ...(typeof minHeight === "string" &&
    !["sm", "md", "lg", "xl", "screen", "auto"].includes(minHeight)
      ? { minHeight }
      : {}),
    ...(maxHeight ? { maxHeight } : {}),
    ...(borderRadius ? { borderRadius } : {}),
    ...(shadow ? { boxShadow: shadow } : {}),
    ...(showBorder
      ? { border: `1px solid ${borderColor || "var(--color-border)"}` }
      : {}),
  };

  // Background style
  const bgStyle: React.CSSProperties = {
    backgroundImage: `url(${bgImageUrl})`,
    backgroundPosition,
    backgroundSize,
    backgroundRepeat,
    ...(blurAmount > 0 ? { filter: `blur(${blurAmount}px)` } : {}),
    opacity: (bgOpacity / 100) * scrollFade,
    // Extend bg for parallax movement
    top: shouldAnimate ? `-${maxOffset}px` : "0",
    bottom: shouldAnimate ? `-${maxOffset}px` : "0",
    left: shouldAnimate
      ? direction === "left" || direction === "right"
        ? `-${maxOffset}px`
        : "0"
      : "0",
    right: shouldAnimate
      ? direction === "left" || direction === "right"
        ? `-${maxOffset}px`
        : "0"
      : "0",
  };

  return (
    <div
      ref={containerRef}
      id={id}
      className={`relative overflow-hidden ${heightClasses} ${disableOnMobile ? "hidden md:block" : ""} ${className}`}
      style={containerStyle}
      role={ariaLabel ? "region" : undefined}
      aria-label={ariaLabel || undefined}
    >
      {/* Main background */}
      {backgroundVideo ? (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src={backgroundVideo}
          autoPlay
          muted
          loop
          playsInline
          style={{ opacity: (bgOpacity / 100) * scrollFade }}
        />
      ) : (
        <div
          ref={bgRef}
          className="absolute will-change-transform"
          style={bgStyle}
        />
      )}

      {/* Layers */}
      {Array.isArray(layers) &&
        layers.map((layer, i) => {
          const layerUrl = layer.image ? getImageUrl(layer.image) : "";
          if (!layerUrl) return null;
          return (
            <div
              key={i}
              className="absolute inset-0 will-change-transform"
              style={{
                backgroundImage: `url(${layerUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                opacity: layer.opacity ?? 0.5,
                zIndex: layer.zIndex ?? i + 1,
              }}
            />
          );
        })}

      {/* Overlay */}
      {showOverlayResolved && (
        <div className="absolute inset-0" style={overlayGradientStyle} />
      )}

      {/* Content */}
      <div
        className={`relative z-10 flex flex-col ${positionMap[contentPosition] || "items-center"} ${alignmentMap[contentAlignResolved] || "items-center justify-center"} w-full h-full`}
        style={{
          padding: contentPadding || "1rem 2rem",
          ...(contentMaxWidth
            ? { maxWidth: contentMaxWidth, margin: "0 auto" }
            : {}),
        }}
      >
        {children}
      </div>

      {/* Mobile fallback */}
      {mobileFallbackUrl && (
        <style>{`@media (max-width: 768px) { #${id || "parallax"} { background-image: url(${mobileFallbackUrl}) !important; } }`}</style>
      )}
      {mobileHeight && (
        <style>{`@media (max-width: 768px) { #${id || "parallax"} { min-height: ${mobileHeight} !important; } }`}</style>
      )}
    </div>
  );
}

// ============================================================================
// ANNOUNCEMENT BAR - Top Banner Notification
// ============================================================================

export interface AnnouncementBarProps {
  message?: string;
  linkUrl?: string;
  linkText?: string;
  closable?: boolean;
  position?: "top" | "bottom";
  variant?:
    | "default"
    | "gradient"
    | "glass"
    | "outlined"
    | "minimal"
    | "animated"
    | "success"
    | "warning"
    | "error"
    | "info"
    | "custom";
  iconName?: React.ReactNode;
  textAlign?: "left" | "center" | "right";
  size?: "sm" | "md" | "lg";
  sticky?: boolean;
  backgroundColor?: string;
  textColor?: string;
  linkColor?: string;
  backgroundGradient?: GradientConfig;
  fontWeight?: "normal" | "medium" | "semibold" | "bold";
  id?: string;
  className?: string;
}

export function AnnouncementBarRender({
  message = "📢 Big announcement! Check out our latest updates.",
  linkUrl,
  linkText = "Learn more →",
  closable = true,
  position = "top",
  variant = "default",
  iconName,
  textAlign = "center",
  size = "md",
  sticky = true,
  backgroundColor,
  textColor,
  linkColor,
  backgroundGradient,
  fontWeight = "normal",
  id,
  className = "",
}: AnnouncementBarProps) {
  const isCustom = variant === "custom" || backgroundColor;

  // Variant styles using inline colors (no Tailwind color classes)
  const variantColorMap: Record<string, { bg: string; text: string }> = {
    default: { bg: "#111827", text: "#ffffff" },
    success: { bg: "#16a34a", text: "#ffffff" },
    warning: { bg: "#eab308", text: "#000000" },
    error: { bg: "#dc2626", text: "#ffffff" },
    info: { bg: "#0284c7", text: "#ffffff" },
    gradient: { bg: "transparent", text: "#ffffff" },
    glass: { bg: "rgba(255,255,255,0.15)", text: "#ffffff" },
    outlined: { bg: "transparent", text: "#111827" },
    minimal: { bg: "transparent", text: "#111827" },
    animated: { bg: "#111827", text: "#ffffff" },
    custom: { bg: backgroundColor || "#111827", text: textColor || "#ffffff" },
  };

  const colors = variantColorMap[variant] || variantColorMap.default;

  const sizeClasses = {
    sm: "py-1.5 px-3 text-xs",
    md: "py-2 px-4 text-sm",
    lg: "py-3 px-6 text-base",
  }[size];

  const alignClasses = {
    left: "justify-start text-left",
    center: "justify-center text-center",
    right: "justify-end text-right",
  }[textAlign];

  const weightClasses = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
  }[fontWeight];

  const positionClasses = position === "top" ? "top-0" : "bottom-0";
  const stickyClasses = sticky ? `sticky ${positionClasses} z-50` : "";

  const gradientCss = backgroundGradient
    ? buildGradientCSS(backgroundGradient)
    : variant === "gradient"
      ? "linear-gradient(to right, #9333ea, #ec4899, #ef4444)"
      : undefined;

  const resolvedBg = isCustom ? backgroundColor || colors.bg : colors.bg;
  const dark = isCustom
    ? isDarkBackground(backgroundColor)
    : !["warning", "outlined", "minimal"].includes(variant);
  const resolvedTextColor = resolveContrastColor(textColor || (dark ? "#ffffff" : "#111827"), dark);
  const resolvedLinkColor = linkColor || resolvedTextColor;

  // Variant-specific extra styles
  const variantExtraStyle: React.CSSProperties = {};
  if (variant === "glass") {
    variantExtraStyle.backdropFilter = "blur(12px)";
    variantExtraStyle.WebkitBackdropFilter = "blur(12px)";
  }
  if (variant === "outlined") {
    variantExtraStyle.border = "1px solid #e5e7eb";
  }

  return (
    <div
      id={id}
      role="banner"
      aria-label="Announcement"
      className={`w-full ${sizeClasses} ${weightClasses} ${stickyClasses} ${className}`}
      style={{
        backgroundColor: gradientCss ? undefined : resolvedBg,
        background: gradientCss || undefined,
        color: resolvedTextColor,
        ...variantExtraStyle,
      }}
    >
      <div
        className={`max-w-7xl mx-auto flex items-center gap-2 md:gap-4 ${alignClasses}`}
      >
        {iconName && <span className="flex-shrink-0">{iconName}</span>}
        <span className="flex-1 md:flex-none">{message}</span>
        {linkUrl && (
          <a
            href={linkUrl}
            className="font-semibold underline underline-offset-2 hover:no-underline flex-shrink-0"
            style={{ color: resolvedLinkColor }}
          >
            {linkText}
          </a>
        )}
        {closable && (
          <button
            className="ml-2 md:ml-4 p-1 rounded hover:bg-white/20 transition-colors flex-shrink-0"
            aria-label="Close announcement"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SOCIAL PROOF - Rating & Review Display
// ============================================================================

export interface SocialProofAvatar {
  image: string;
  alt?: string;
  name?: string;
}

export interface SocialProofProps {
  mode?: "rating" | "count";
  // Rating mode props
  rating?: number;
  maxRating?: number;
  reviewCount?: number;
  platform?: string;
  platformLogo?: string | ImageValue;
  variant?: "stars" | "score" | "compact" | "detailed";
  size?: ResponsiveValue<"sm" | "md" | "lg">;
  showCount?: boolean;
  showPlatform?: boolean;
  ratingColor?: string;
  ratingEmptyColor?: string;
  scoreBackgroundColor?: string;
  scoreTextColor?: string;
  mutedTextColor?: string;
  // Count mode props
  count?: number;
  countSuffix?: string;
  label?: string;
  showAvatars?: boolean;
  avatars?: SocialProofAvatar[];
  maxVisible?: number;
  showBadge?: boolean;
  badgeText?: string;
  badgeColor?: string;
  animateCount?: boolean;
  // Schema.org
  schemaType?: "AggregateRating" | "Product" | "LocalBusiness" | false;
  schemaName?: string;
  // Animation
  animateOnScroll?: boolean;
  id?: string;
  className?: string;
}

export function SocialProofRender({
  mode = "rating",
  rating = 4.8,
  maxRating = 5,
  reviewCount = 1250,
  platform = "Google Reviews",
  platformLogo,
  variant = "stars",
  size = "md",
  showCount = true,
  showPlatform = true,
  ratingColor,
  ratingEmptyColor,
  scoreBackgroundColor,
  scoreTextColor,
  mutedTextColor,
  count = 2500,
  countSuffix = "+",
  label = "happy customers",
  showAvatars = true,
  avatars = [],
  maxVisible = 4,
  showBadge = false,
  badgeText = "Verified",
  badgeColor,
  animateCount = false,
  schemaType = false,
  schemaName,
  animateOnScroll = false,
  id,
  className = "",
}: SocialProofProps) {
  // Normalize platformLogo image
  const platformLogoUrl = getImageUrl(platformLogo);

  // Resolve colours with CSS variable fallbacks
  const resolvedRatingColor = ratingColor || "var(--color-star, #facc15)";
  const resolvedRatingEmptyColor =
    ratingEmptyColor || "var(--color-star-empty, #d1d5db)";
  const resolvedScoreBg =
    scoreBackgroundColor || "var(--color-success, #22c55e)";
  const resolvedScoreText = scoreTextColor || "#ffffff";
  const resolvedMutedText =
    mutedTextColor || "var(--color-muted-foreground, #6b7280)";
  const resolvedBadgeColor = badgeColor || "var(--color-success, #22c55e)";

  // Schema.org JSON-LD for SEO
  const schemaJsonLd = schemaType ? (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": schemaType,
          ...(schemaName
            ? {
                itemReviewed: {
                  "@type": "Organization",
                  name: schemaName,
                },
              }
            : {}),
          ratingValue: String(rating),
          bestRating: String(maxRating),
          worstRating: "1",
          ratingCount: String(reviewCount),
        }),
      }}
    />
  ) : null;

  const sizeClasses = getResponsiveClasses(size, {
    sm: ["text-xs gap-1", "md:text-xs md:gap-1", "lg:text-xs lg:gap-1"],
    md: ["text-sm gap-2", "md:text-sm md:gap-2", "lg:text-sm lg:gap-2"],
    lg: ["text-base gap-3", "md:text-base md:gap-3", "lg:text-lg lg:gap-3"],
  });

  const starSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const currentSize = typeof size === "string" ? size : size.mobile || "md";
  const starSize = starSizes[currentSize];

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);

  const renderStars = () => (
    <div className="flex items-center" aria-hidden="true">
      {[...Array(fullStars)].map((_, i) => (
        <svg
          key={`full-${i}`}
          className={`${starSize} fill-current`}
          style={{ color: resolvedRatingColor }}
          viewBox="0 0 20 20"
        >
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      ))}
      {hasHalfStar && (
        <svg
          className={`${starSize}`}
          style={{ color: resolvedRatingColor }}
          viewBox="0 0 20 20"
        >
          <defs>
            <linearGradient id="halfStar">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor={resolvedRatingEmptyColor} />
            </linearGradient>
          </defs>
          <path
            fill="url(#halfStar)"
            d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"
          />
        </svg>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <svg
          key={`empty-${i}`}
          className={`${starSize} fill-current`}
          style={{ color: resolvedRatingEmptyColor }}
          viewBox="0 0 20 20"
        >
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      ))}
    </div>
  );

  // ── Count mode ──────────────────────────────────────────────────────
  if (mode === "count") {
    const visibleAvatars = avatars.slice(0, maxVisible);
    const overflowCount = Math.max(0, avatars.length - maxVisible);
    const formattedCount =
      count >= 1000
        ? `${(count / 1000).toFixed(count % 1000 === 0 ? 0 : 1)}k`
        : String(count);

    return (
      <div
        id={id}
        role="status"
        aria-label={`${count.toLocaleString()}${countSuffix} ${label}`}
        className={`inline-flex items-center ${sizeClasses} ${className}`}
      >
        {schemaJsonLd}
        {showAvatars && visibleAvatars.length > 0 && (
          <div className="flex items-center -space-x-2 mr-3">
            {visibleAvatars.map((avatar, i) => (
              <img
                key={i}
                src={getImageUrl(avatar.image) || ""}
                alt={avatar.alt || avatar.name || `User ${i + 1}`}
                className="w-8 h-8 rounded-full border-2 border-white object-cover"
              />
            ))}
            {overflowCount > 0 && (
              <div
                className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium"
                style={{ backgroundColor: resolvedMutedText, color: "#ffffff" }}
              >
                +{overflowCount}
              </div>
            )}
          </div>
        )}
        <div className="flex flex-col">
          <span className="font-bold text-lg leading-tight">
            {formattedCount}
            {countSuffix}
          </span>
          {label && (
            <span className="text-sm" style={{ color: resolvedMutedText }}>
              {label}
            </span>
          )}
        </div>
        {showBadge && badgeText && (
          <span
            className="ml-3 px-2 py-0.5 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: resolvedBadgeColor }}
          >
            {badgeText}
          </span>
        )}
      </div>
    );
  }

  // ── Rating mode variants ───────────────────────────────────────────
  if (variant === "compact") {
    return (
      <div
        id={id}
        aria-label={`Rated ${rating} out of ${maxRating}`}
        className={`inline-flex items-center ${sizeClasses} ${className}`}
      >
        <svg
          className={`${starSize} fill-current`}
          style={{ color: resolvedRatingColor }}
          viewBox="0 0 20 20"
        >
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
        <span className="font-semibold ml-1">{rating}</span>
        {showCount && (
          <span style={{ color: resolvedMutedText }}>
            ({reviewCount.toLocaleString()})
          </span>
        )}
      </div>
    );
  }

  if (variant === "score") {
    return (
      <div
        id={id}
        aria-label={`Rated ${rating} out of ${maxRating}`}
        className={`inline-flex items-center ${sizeClasses} ${className}`}
      >
        <div
          className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-lg font-bold text-lg md:text-xl"
          style={{ backgroundColor: resolvedScoreBg, color: resolvedScoreText }}
        >
          {rating}
        </div>
        <div className="ml-3">
          <div className="font-semibold">Excellent</div>
          {showCount && (
            <div style={{ color: resolvedMutedText }}>
              {reviewCount.toLocaleString()} reviews
            </div>
          )}
          {showPlatform && (
            <div className="text-xs" style={{ color: resolvedMutedText }}>
              {platform}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      id={id}
      aria-label={`Rated ${rating} out of ${maxRating}`}
      className={`inline-flex flex-col items-center ${sizeClasses} ${className}`}
    >
      {schemaJsonLd}
      {renderStars()}
      <div className="flex items-center gap-1 mt-1">
        <span className="font-semibold">{rating}</span>
        {showCount && (
          <span style={{ color: resolvedMutedText }}>
            ({reviewCount.toLocaleString()} reviews)
          </span>
        )}
      </div>
      {showPlatform && (
        <div
          className="flex items-center gap-1 text-xs mt-1"
          style={{ color: resolvedMutedText }}
        >
          {platformLogoUrl && (
            <img src={platformLogoUrl} alt={platform} className="w-4 h-4" />
          )}
          <span>{platform}</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TRUST BADGES - Trust Indicator Images
// ============================================================================

export interface TrustBadge {
  image?: string;
  icon?: string;
  text?: string;
  description?: string;
  alt?: string;
  link?: string;
  featured?: boolean;
  badgeColor?: string;
}

export interface TrustBadgesProps {
  badges?: TrustBadge[];
  title?: string;
  variant?: "default" | "pills" | "cards" | "minimal";
  layout?: ResponsiveValue<"row" | "grid">;
  columns?: ResponsiveValue<2 | 3 | 4 | 5 | 6>;
  size?: ResponsiveValue<"sm" | "md" | "lg">;
  grayscale?: boolean;
  hoverEffect?: boolean;
  gap?: ResponsiveValue<"sm" | "md" | "lg">;
  alignment?: "start" | "center" | "end";
  // Animation
  animateOnScroll?: boolean;
  staggerDelay?: number;
  id?: string;
  className?: string;
}

export function TrustBadgesRender({
  badges = [
    { image: "/badges/ssl.svg", alt: "SSL Secure", text: "SSL Secure" },
    {
      image: "/badges/money-back.svg",
      alt: "Money Back Guarantee",
      text: "Money Back",
    },
    {
      image: "/badges/verified.svg",
      alt: "Verified Business",
      text: "Verified",
    },
    { image: "/badges/support.svg", alt: "24/7 Support", text: "24/7 Support" },
  ],
  title,
  variant = "default",
  layout = "row",
  columns = 4,
  size = "md",
  grayscale = false,
  hoverEffect = true,
  gap = "md",
  alignment = "center",
  animateOnScroll = false,
  staggerDelay = 100,
  id,
  className = "",
}: TrustBadgesProps) {
  const layoutClasses = getResponsiveClasses(layout, {
    row: ["flex flex-wrap", "md:flex", "lg:flex"],
    grid: ["grid", "md:grid", "lg:grid"],
  });

  const columnClasses = getResponsiveClasses(columns, {
    2: ["grid-cols-2", "md:grid-cols-2", "lg:grid-cols-2"],
    3: ["grid-cols-2", "md:grid-cols-3", "lg:grid-cols-3"],
    4: ["grid-cols-2", "md:grid-cols-4", "lg:grid-cols-4"],
    5: ["grid-cols-2", "md:grid-cols-3", "lg:grid-cols-5"],
    6: ["grid-cols-3", "md:grid-cols-4", "lg:grid-cols-6"],
  });

  const gapClasses = getResponsiveClasses(gap, {
    sm: ["gap-2", "md:gap-3", "lg:gap-4"],
    md: ["gap-4", "md:gap-5", "lg:gap-6"],
    lg: ["gap-6", "md:gap-8", "lg:gap-10"],
  });

  const sizeClasses = getResponsiveClasses(size, {
    sm: ["h-8", "md:h-10", "lg:h-12"],
    md: ["h-12", "md:h-14", "lg:h-16"],
    lg: ["h-16", "md:h-20", "lg:h-24"],
  });

  const alignClasses = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
  }[alignment];

  return (
    <div
      id={id}
      className={className}
      role="list"
      aria-label={title || "Trust badges"}
    >
      {title && (
        <p
          className="text-xs md:text-sm text-center mb-4"
          style={{ color: "var(--color-muted-foreground, #6b7280)" }}
        >
          {title}
        </p>
      )}
      <div
        className={`${layoutClasses} ${typeof layout === "object" && layout.mobile === "grid" ? columnClasses : ""} ${gapClasses} ${alignClasses} items-center`}
      >
        {badges.map((badge, index) => {
          const animStyle: React.CSSProperties = animateOnScroll
            ? {
                opacity: 0,
                animation: "fadeInUp 0.5s ease-out forwards",
                animationDelay: `${index * staggerDelay}ms`,
              }
            : {};
          const featuredStyle: React.CSSProperties = badge.featured
            ? {
                borderColor:
                  badge.badgeColor || "var(--color-primary, #3b82f6)",
                borderWidth: "2px",
              }
            : {};

          // Determine badge content: image-based or icon+text
          const hasImage = badge.image && badge.image.length > 0;
          const badgeContent = hasImage ? (
            <img
              src={badge.image}
              alt={badge.alt || badge.text || ""}
              className={`${sizeClasses} w-auto object-contain transition-all duration-300 ${
                grayscale ? "grayscale hover:grayscale-0" : ""
              } ${hoverEffect ? "hover:scale-110 hover:opacity-100 opacity-70" : ""}`}
            />
          ) : (
            <div
              className={`flex items-center gap-2 transition-all duration-300 ${
                hoverEffect
                  ? "hover:scale-105 hover:opacity-100 opacity-80"
                  : ""
              }`}
            >
              {badge.icon && (
                <span className="text-lg" role="img" aria-hidden="true">
                  {badge.icon}
                </span>
              )}
              <div className="flex flex-col">
                {badge.text && (
                  <span className="text-sm font-medium leading-tight">
                    {badge.text}
                  </span>
                )}
                {badge.description && (
                  <span
                    className="text-xs"
                    style={{ color: "var(--color-muted-foreground, #6b7280)" }}
                  >
                    {badge.description}
                  </span>
                )}
              </div>
            </div>
          );

          // Variant wrappers
          const variantClasses = {
            default: "",
            pills:
              "px-3 py-1.5 rounded-full border border-gray-200 bg-white/50 backdrop-blur-sm",
            cards:
              "px-4 py-3 rounded-lg border border-gray-200 bg-white shadow-sm",
            minimal: "",
          }[variant];

          const wrappedContent = (
            <div
              role="listitem"
              className={`inline-flex items-center ${variantClasses}`}
              style={{ ...animStyle, ...featuredStyle }}
            >
              {badgeContent}
            </div>
          );

          return badge.link ? (
            <a
              key={index}
              href={badge.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              {wrappedContent}
            </a>
          ) : (
            <div key={index}>{wrappedContent}</div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// LOGO CLOUD - Partner/Client Logos
// ============================================================================

export interface LogoItem {
  image: string;
  alt: string;
  link?: string;
}

export interface LogoCloudProps {
  logos?: LogoItem[];
  title?: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  headerAlign?: "left" | "center" | "right";
  columns?: ResponsiveValue<2 | 3 | 4 | 5 | 6>;
  grayscale?: boolean;
  hoverColor?: boolean;
  variant?: "simple" | "cards" | "marquee";
  gap?: ResponsiveValue<"sm" | "md" | "lg" | "xl">;
  logoHeight?: ResponsiveValue<"sm" | "md" | "lg">;
  backgroundColor?: string;
  background?: string;
  cardBackgroundColor?: string;
  paddingY?: "sm" | "md" | "lg" | "xl";
  paddingX?: "sm" | "md" | "lg" | "xl";
  padding?: ResponsiveValue<"none" | "sm" | "md" | "lg">;
  // Marquee controls (Phase 5)
  marqueeSpeed?: "slow" | "normal" | "fast";
  pauseOnHover?: boolean;
  id?: string;
  className?: string;
}

export function LogoCloudRender({
  logos = [
    { image: "/logos/company1.svg", alt: "Company 1" },
    { image: "/logos/company2.svg", alt: "Company 2" },
    { image: "/logos/company3.svg", alt: "Company 3" },
    { image: "/logos/company4.svg", alt: "Company 4" },
    { image: "/logos/company5.svg", alt: "Company 5" },
    { image: "/logos/company6.svg", alt: "Company 6" },
  ],
  title = "Trusted by leading companies",
  subtitle,
  badge,
  badgeColor,
  headerAlign = "center",
  columns = { mobile: 2, tablet: 3, desktop: 6 },
  grayscale = true,
  hoverColor = true,
  variant = "simple",
  gap = "lg",
  logoHeight = "md",
  backgroundColor,
  background,
  cardBackgroundColor,
  paddingY = "lg",
  paddingX = "md",
  padding,
  marqueeSpeed = "normal",
  pauseOnHover = true,
  id,
  className = "",
}: LogoCloudProps) {
  const dark = isDarkBackground(backgroundColor);
  const resolvedTitleColor = dark ? "#94a3b8" : "#6b7280";
  const resolvedSubtitleColor = dark ? "#64748b" : "#9ca3af";
  const resolvedBadgeColor =
    badgeColor || (dark ? "#e5a956" : "var(--brand-primary, #3b82f6)");
  const resolvedCardBg = cardBackgroundColor || (dark ? "#1e293b" : "#ffffff");

  // Use new padding utils if paddingY/paddingX are specified; fall back to legacy responsive padding
  const useLegacyPadding = !backgroundColor && padding;
  const pyClasses = useLegacyPadding
    ? ""
    : paddingYMapUtil[paddingY] || paddingYMapUtil.lg;
  const pxClasses = useLegacyPadding
    ? ""
    : paddingXMapUtil[paddingX] || paddingXMapUtil.md;
  const legacyPaddingClasses = useLegacyPadding
    ? getResponsiveClasses(padding!, {
        none: ["p-0", "md:p-0", "lg:p-0"],
        sm: ["py-6 px-4", "md:py-8 md:px-6", "lg:py-10 lg:px-8"],
        md: ["py-10 px-4", "md:py-12 md:px-8", "lg:py-16 lg:px-12"],
        lg: ["py-12 px-4", "md:py-16 md:px-8", "lg:py-20 lg:px-16"],
      })
    : "";

  const columnClasses = getResponsiveClasses(columns, {
    2: ["grid-cols-2", "md:grid-cols-2", "lg:grid-cols-2"],
    3: ["grid-cols-2", "md:grid-cols-3", "lg:grid-cols-3"],
    4: ["grid-cols-2", "md:grid-cols-3", "lg:grid-cols-4"],
    5: ["grid-cols-2", "md:grid-cols-3", "lg:grid-cols-5"],
    6: ["grid-cols-2", "md:grid-cols-3", "lg:grid-cols-6"],
  });

  const gapClasses = getResponsiveClasses(gap, {
    sm: ["gap-4", "md:gap-4", "lg:gap-4"],
    md: ["gap-6", "md:gap-8", "lg:gap-8"],
    lg: ["gap-8", "md:gap-10", "lg:gap-12"],
    xl: ["gap-10", "md:gap-12", "lg:gap-16"],
  });

  const heightClasses = getResponsiveClasses(logoHeight, {
    sm: ["h-6", "md:h-8", "lg:h-8"],
    md: ["h-8", "md:h-10", "lg:h-12"],
    lg: ["h-10", "md:h-12", "lg:h-16"],
  });

  const alignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[headerAlign];

  const renderLogo = (logo: LogoItem, index: number) => {
    const imgClasses = `${heightClasses} w-auto object-contain transition-all duration-300 ${
      grayscale ? "grayscale" : ""
    } ${hoverColor && grayscale ? "hover:grayscale-0" : ""} ${
      variant === "cards" ? "" : "opacity-60 hover:opacity-100"
    }`;

    const img = <img src={logo.image} alt={logo.alt} className={imgClasses} />;

    if (variant === "cards") {
      const cardContent = (
        <div
          className="flex items-center justify-center p-4 md:p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          style={{ backgroundColor: resolvedCardBg }}
        >
          {img}
        </div>
      );
      return logo.link ? (
        <a
          key={index}
          href={logo.link}
          target="_blank"
          rel="noopener noreferrer"
        >
          {cardContent}
        </a>
      ) : (
        <div key={index}>{cardContent}</div>
      );
    }

    return logo.link ? (
      <a
        key={index}
        href={logo.link}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center"
      >
        {img}
      </a>
    ) : (
      <div key={index} className="flex items-center justify-center">
        {img}
      </div>
    );
  };

  const renderHeader = () => {
    if (!title && !subtitle && !badge) return null;
    return (
      <div className={`${alignClasses} mb-8 md:mb-12`}>
        {badge && (
          <span
            className="inline-flex items-center px-3 py-1 rounded-full text-xs md:text-sm font-medium mb-4"
            style={{
              backgroundColor: `${resolvedBadgeColor}20`,
              color: resolvedBadgeColor,
            }}
          >
            {badge}
          </span>
        )}
        {title && (
          <h3
            className="text-sm md:text-base font-semibold uppercase tracking-wide"
            style={{ color: resolvedTitleColor }}
          >
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="mt-2" style={{ color: resolvedSubtitleColor }}>
            {subtitle}
          </p>
        )}
      </div>
    );
  };

  if (variant === "marquee") {
    const speedDuration = { slow: "40s", normal: "25s", fast: "15s" }[
      marqueeSpeed
    ];
    return (
      <section
        id={id}
        className={`w-full ${pyClasses} ${pxClasses} ${legacyPaddingClasses} ${background || ""} overflow-hidden ${className}`}
        style={{ backgroundColor: backgroundColor || undefined }}
      >
        {renderHeader()}
        <div
          className="flex animate-marquee"
          style={{
            animationDuration: speedDuration,
            animationPlayState: "running",
          }}
          onMouseEnter={(e) => {
            if (pauseOnHover)
              e.currentTarget.style.animationPlayState = "paused";
          }}
          onMouseLeave={(e) => {
            if (pauseOnHover)
              e.currentTarget.style.animationPlayState = "running";
          }}
        >
          {[...logos, ...logos].map((logo, index) => (
            <div key={index} className="flex-shrink-0 mx-8 md:mx-12">
              {renderLogo(logo, index)}
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      id={id}
      className={`w-full ${pyClasses} ${pxClasses} ${legacyPaddingClasses} ${background || ""} ${className}`}
      style={{ backgroundColor: backgroundColor || undefined }}
    >
      {renderHeader()}
      <div className={`grid ${columnClasses} ${gapClasses} items-center`}>
        {logos.map((logo, index) => renderLogo(logo, index))}
      </div>
    </section>
  );
}

// ============================================================================
// COMPARISON TABLE - Feature Comparison
// ============================================================================

export interface ComparisonColumn {
  name: string;
  highlighted?: boolean;
  badge?: string;
  price?: string;
  priceNote?: string;
  ctaText?: string;
  ctaLink?: string;
  ctaVariant?: "primary" | "outline";
}

export interface ComparisonRow {
  label: string;
  description?: string;
  category?: string;
  values: (boolean | string)[];
}

export interface ComparisonTableProps {
  columns?: ComparisonColumn[];
  rows?: ComparisonRow[];
  title?: string;
  subtitle?: string;
  variant?: "simple" | "cards" | "striped";
  highlightBackgroundColor?: string;
  highlightBorderColor?: string;
  checkColor?: string;
  crossColor?: string;
  headerBackground?: string;
  titleColor?: string;
  subtitleColor?: string;
  featureTextColor?: string;
  rowHoverColor?: string;
  stickyHeader?: boolean;
  stickyFirstColumn?: boolean;
  mobileStack?: boolean;
  id?: string;
  className?: string;
  // Legacy support
  highlightColor?: string;
}

export function ComparisonTableRender({
  columns = [
    { name: "Basic", price: "$9/mo" },
    { name: "Pro", price: "$29/mo", highlighted: true },
    { name: "Enterprise", price: "$99/mo" },
  ],
  rows = [
    { label: "Users", values: ["1", "5", "Unlimited"] },
    { label: "Storage", values: ["5GB", "50GB", "500GB"] },
    { label: "API Access", values: [false, true, true] },
    { label: "Priority Support", values: [false, false, true] },
    { label: "Custom Domain", values: [false, true, true] },
  ],
  title,
  subtitle,
  variant = "simple",
  highlightBackgroundColor,
  highlightBorderColor,
  checkColor,
  crossColor,
  headerBackground,
  titleColor,
  subtitleColor,
  featureTextColor,
  rowHoverColor,
  stickyHeader = true,
  stickyFirstColumn = true,
  mobileStack = false,
  id,
  className = "",
  highlightColor,
}: ComparisonTableProps) {
  // Resolve colours with CSS variable fallbacks
  const resolvedHighlightBg =
    highlightBackgroundColor ||
    "var(--color-highlight-bg, rgba(14,165,233,0.08))";
  const resolvedHighlightBorder =
    highlightBorderColor || "var(--color-highlight-border, #0ea5e9)";
  const resolvedCheckColor = checkColor || "var(--color-check, #22c55e)";
  const resolvedCrossColor = crossColor || "var(--color-cross, #9ca3af)";
  const resolvedHeaderBg = headerBackground || "var(--color-muted, #f9fafb)";
  const resolvedTitleColor = titleColor || "var(--color-foreground, #111827)";
  const resolvedSubtitleColor =
    subtitleColor || "var(--color-muted-foreground, #6b7280)";
  const resolvedFeatureColor =
    featureTextColor || "var(--color-foreground, #111827)";
  const resolvedRowHover =
    rowHoverColor || "var(--color-muted, rgba(0,0,0,0.03))";

  const renderValue = (value: boolean | string) => {
    if (typeof value === "boolean") {
      return value ? (
        <svg
          className="w-5 h-5 mx-auto"
          style={{ color: resolvedCheckColor }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ) : (
        <svg
          className="w-5 h-5 mx-auto"
          style={{ color: resolvedCrossColor }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      );
    }
    return <span className="text-sm md:text-base">{value}</span>;
  };

  // Normalize rows: handle legacy "feature" field and comma-separated string values
  const normalizedRows = rows.map((row: any) => ({
    ...row,
    label: row.label || row.feature || "",
    values: Array.isArray(row.values)
      ? row.values
      : typeof row.values === "string"
        ? row.values.split(",").map((v: string) => {
            const t = v.trim().toLowerCase();
            return t === "yes" || t === "true"
              ? true
              : t === "no" || t === "false"
                ? false
                : v.trim();
          })
        : [],
  }));

  // Group rows by category label
  const groupedRows: { category?: string; rows: ComparisonRow[] }[] = [];
  let currentGroup: { category?: string; rows: ComparisonRow[] } = { rows: [] };
  normalizedRows.forEach((row) => {
    if (row.category && row.category !== currentGroup.category) {
      if (currentGroup.rows.length > 0) groupedRows.push(currentGroup);
      currentGroup = { category: row.category, rows: [row] };
    } else {
      currentGroup.rows.push(row);
    }
  });
  if (currentGroup.rows.length > 0) groupedRows.push(currentGroup);

  return (
    <div
      id={id}
      role="region"
      aria-label={title || "Feature comparison"}
      className={className}
    >
      {(title || subtitle) && (
        <div className="text-center mb-8 md:mb-12">
          {title && (
            <h2
              className="text-2xl md:text-3xl font-bold"
              style={{ color: resolvedTitleColor }}
            >
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="mt-2" style={{ color: resolvedSubtitleColor }}>
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Mobile stacked layout */}
      {mobileStack && (
        <div className="md:hidden flex flex-col gap-4">
          {columns.map((col, colIndex) => (
            <div
              key={colIndex}
              className="rounded-lg overflow-hidden"
              style={{
                border: col.highlighted
                  ? `2px solid ${resolvedHighlightBorder}`
                  : `1px solid var(--color-border, #e5e7eb)`,
                backgroundColor: col.highlighted
                  ? resolvedHighlightBg
                  : "var(--color-background, #ffffff)",
              }}
            >
              <div
                className="p-4 text-center"
                style={{ backgroundColor: resolvedHeaderBg }}
              >
                {col.badge && (
                  <span
                    className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-1"
                    style={{
                      backgroundColor: resolvedHighlightBorder,
                      color: "#ffffff",
                    }}
                  >
                    {col.badge}
                  </span>
                )}
                <div
                  className="font-bold text-lg"
                  style={{ color: resolvedFeatureColor }}
                >
                  {col.name}
                </div>
                {col.price && (
                  <div className="text-xl font-bold mt-1">{col.price}</div>
                )}
                {col.priceNote && (
                  <div
                    className="text-xs"
                    style={{ color: resolvedSubtitleColor }}
                  >
                    {col.priceNote}
                  </div>
                )}
              </div>
              <div
                className="divide-y"
                style={{ borderColor: "var(--color-border, #e5e7eb)" }}
              >
                {rows.map((row, rowIndex) => (
                  <div
                    key={rowIndex}
                    className="flex items-center justify-between p-3"
                  >
                    <span
                      className="text-sm font-medium"
                      style={{ color: resolvedFeatureColor }}
                    >
                      {row.label}
                    </span>
                    <span className="text-sm">
                      {renderValue(row.values[colIndex])}
                    </span>
                  </div>
                ))}
              </div>
              {col.ctaText && (
                <div className="p-4 text-center">
                  <a
                    href={col.ctaLink || "#"}
                    className="inline-block w-full px-6 py-2 rounded-lg font-medium transition-colors text-center"
                    style={
                      col.ctaVariant === "outline"
                        ? {
                            border: `2px solid ${resolvedHighlightBorder}`,
                            color: resolvedHighlightBorder,
                          }
                        : {
                            backgroundColor: resolvedHighlightBorder,
                            color: "#ffffff",
                          }
                    }
                  >
                    {col.ctaText}
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Table layout (default scroll mode, or desktop for stack mode) */}
      <div
        className={`overflow-x-auto -mx-4 md:mx-0 ${mobileStack ? "hidden md:block" : ""}`}
      >
        <table className="w-full min-w-[600px]" role="table">
          <thead className={stickyHeader ? "sticky top-0 z-10" : ""}>
            <tr style={{ backgroundColor: resolvedHeaderBg }}>
              <th
                scope="col"
                className={`text-left p-3 md:p-4 font-semibold ${stickyFirstColumn ? "sticky left-0 z-20" : ""}`}
                style={{
                  color: resolvedFeatureColor,
                  backgroundColor: resolvedHeaderBg,
                }}
              >
                Features
              </th>
              {columns.map((col, index) => (
                <th
                  key={index}
                  scope="col"
                  className="text-center p-3 md:p-4"
                  style={
                    col.highlighted
                      ? {
                          backgroundColor: resolvedHighlightBg,
                          borderTop: `4px solid ${resolvedHighlightBorder}`,
                        }
                      : undefined
                  }
                >
                  {col.badge && (
                    <span
                      className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-1"
                      style={{
                        backgroundColor: resolvedHighlightBorder,
                        color: "#ffffff",
                      }}
                    >
                      {col.badge}
                    </span>
                  )}
                  <div
                    className="font-bold"
                    style={{ color: resolvedFeatureColor }}
                  >
                    {col.name}
                  </div>
                  {col.price && (
                    <div className="text-lg md:text-xl font-bold mt-1">
                      {col.price}
                    </div>
                  )}
                  {col.priceNote && (
                    <div
                      className="text-xs"
                      style={{ color: resolvedSubtitleColor }}
                    >
                      {col.priceNote}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groupedRows.map((group, gIdx) => (
              <React.Fragment key={gIdx}>
                {group.category && (
                  <tr>
                    <td
                      colSpan={columns.length + 1}
                      className="p-3 md:p-4 font-bold text-sm uppercase tracking-wide"
                      style={{
                        color: resolvedSubtitleColor,
                        backgroundColor: resolvedHeaderBg,
                      }}
                    >
                      {group.category}
                    </td>
                  </tr>
                )}
                {group.rows.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={
                      variant === "striped" && rowIndex % 2 === 1 ? "" : ""
                    }
                    style={
                      variant === "striped" && rowIndex % 2 === 1
                        ? { backgroundColor: resolvedHeaderBg }
                        : undefined
                    }
                  >
                    <td
                      className={`p-3 md:p-4 font-medium border-b ${stickyFirstColumn ? "sticky left-0 z-10" : ""}`}
                      style={{
                        color: resolvedFeatureColor,
                        backgroundColor: "var(--color-background, #ffffff)",
                      }}
                    >
                      <span className="flex items-center gap-1">
                        {row.label}
                        {row.description && (
                          <span
                            className="cursor-help"
                            style={{ color: resolvedCrossColor }}
                            title={row.description}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </span>
                        )}
                      </span>
                    </td>
                    {row.values.map((value, colIndex) => (
                      <td
                        key={colIndex}
                        className="p-3 md:p-4 text-center border-b"
                        style={
                          columns[colIndex]?.highlighted
                            ? { backgroundColor: resolvedHighlightBg }
                            : undefined
                        }
                      >
                        {renderValue(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
          {/* CTA Row */}
          {columns.some((c) => c.ctaText) && (
            <tfoot>
              <tr>
                <td className="p-3 md:p-4"></td>
                {columns.map((col, index) => (
                  <td key={index} className="p-3 md:p-4 text-center">
                    {col.ctaText && (
                      <a
                        href={col.ctaLink || "#"}
                        className="inline-block px-6 py-2 rounded-lg font-medium transition-colors"
                        style={
                          col.ctaVariant === "outline"
                            ? {
                                border: `2px solid ${resolvedHighlightBorder}`,
                                color: resolvedHighlightBorder,
                              }
                            : {
                                backgroundColor: resolvedHighlightBorder,
                                color: "#ffffff",
                              }
                        }
                      >
                        {col.ctaText}
                      </a>
                    )}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// CODE BLOCK - Syntax Highlighted Code
// ============================================================================

export interface CodeBlockProps {
  code?: string;
  language?: string;
  showLineNumbers?: boolean;
  showCopyButton?: boolean;
  showLanguage?: boolean;
  title?: string;
  theme?: "dark" | "light" | "github" | "monokai";
  highlightLines?: number[];
  maxHeight?: ResponsiveValue<"sm" | "md" | "lg" | "xl" | "none">;
  wrap?: boolean;
  id?: string;
  className?: string;
}

export function CodeBlockRender({
  code = `function hello() {\n  console.log("Hello, World!");\n}`,
  language = "javascript",
  showLineNumbers = true,
  showCopyButton = true,
  showLanguage = true,
  title,
  theme = "dark",
  highlightLines = [],
  maxHeight = "lg",
  wrap = false,
  id,
  className = "",
}: CodeBlockProps) {
  const themeClasses = {
    dark: "bg-gray-900 text-gray-100",
    light: "bg-gray-50 text-gray-900 border",
    github: "bg-[#0d1117] text-[#c9d1d9]",
    monokai: "bg-[#272822] text-[#f8f8f2]",
  }[theme];

  const headerThemeClasses = {
    dark: "bg-gray-800 border-gray-700",
    light: "bg-gray-100 border-gray-200",
    github: "bg-[#161b22] border-[#30363d]",
    monokai: "bg-[#1e1f1c] border-[#3e3d32]",
  }[theme];

  const lineNumberClasses = {
    dark: "text-gray-500",
    light: "text-gray-400",
    github: "text-[#484f58]",
    monokai: "text-[#90908a]",
  }[theme];

  const heightClasses = getResponsiveClasses(maxHeight, {
    sm: ["max-h-48", "md:max-h-48", "lg:max-h-48"],
    md: ["max-h-64", "md:max-h-72", "lg:max-h-80"],
    lg: ["max-h-80", "md:max-h-96", "lg:max-h-[500px]"],
    xl: ["max-h-96", "md:max-h-[500px]", "lg:max-h-[700px]"],
    none: ["max-h-none", "md:max-h-none", "lg:max-h-none"],
  });

  const lines = code.split("\n");

  return (
    <div
      id={id}
      className={`rounded-lg overflow-hidden ${themeClasses} ${className}`}
    >
      {(title || showLanguage || showCopyButton) && (
        <div
          className={`flex items-center justify-between px-4 py-2 border-b ${headerThemeClasses}`}
        >
          <div className="flex items-center gap-3">
            {/* Window controls */}
            <div className="hidden md:flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
            </div>
            {title && <span className="text-sm font-medium">{title}</span>}
          </div>
          <div className="flex items-center gap-3">
            {showLanguage && (
              <span className="text-xs font-mono uppercase opacity-70">
                {language}
              </span>
            )}
            {showCopyButton && (
              <button
                className="text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors"
                aria-label={`Copy ${language} code to clipboard`}
              >
                Copy
              </button>
            )}
          </div>
        </div>
      )}
      <div className={`overflow-auto ${heightClasses} p-4`}>
        <pre
          className={`font-mono text-sm ${wrap ? "whitespace-pre-wrap" : "whitespace-pre"}`}
        >
          <code>
            {lines.map((line, index) => {
              const lineNumber = index + 1;
              const isHighlighted = highlightLines.includes(lineNumber);
              return (
                <div
                  key={index}
                  className={`flex ${isHighlighted ? "bg-yellow-500/20 -mx-4 px-4" : ""}`}
                >
                  {showLineNumbers && (
                    <span
                      className={`select-none w-8 md:w-12 text-right pr-4 ${lineNumberClasses}`}
                    >
                      {lineNumber}
                    </span>
                  )}
                  <span className="flex-1">{line || " "}</span>
                </div>
              );
            })}
          </code>
        </pre>
      </div>
    </div>
  );
}

// ============================================================================
// 3D EFFECTS: CARD FLIP 3D
// ============================================================================

export interface CardFlip3DProps {
  frontContent?: React.ReactNode;
  backContent?: React.ReactNode;
  frontBackgroundColor?: string;
  backBackgroundColor?: string;
  frontImage?: string | ImageValue;
  backImage?: string | ImageValue;
  frontTitle?: string;
  frontSubtitle?: string;
  frontDescription?: string;
  frontGradient?: boolean;
  frontGradientFrom?: string;
  frontGradientTo?: string;
  frontIcon?: string;
  frontBadge?: string;
  backTitle?: string;
  backSubtitle?: string;
  backDescription?: string;
  backGradient?: boolean;
  backGradientFrom?: string;
  backGradientTo?: string;
  flipOn?: "hover" | "click" | "both" | "manual";
  flipDirection?: "horizontal" | "vertical" | "diagonal";
  flipDuration?: number;
  flipEasing?: "ease" | "ease-in-out" | "linear" | "spring";
  startFlipped?: boolean;
  disableFlip?: boolean;
  width?: ResponsiveValue<"sm" | "md" | "lg" | "xl" | "full" | "custom">;
  height?: ResponsiveValue<"sm" | "md" | "lg" | "xl" | "custom">;
  customWidth?: string;
  customHeight?: string;
  aspectRatio?: "none" | "1/1" | "4/3" | "16/9" | "3/4";
  borderRadius?: ResponsiveValue<"none" | "sm" | "md" | "lg" | "xl" | "2xl">;
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
  frontTextColor?: string;
  backTextColor?: string;
  frontOpacity?: number;
  backOpacity?: number;
  showBorder?: boolean;
  frontBorderColor?: string;
  backBorderColor?: string;
  borderWidth?: string;
  borderStyle?: "solid" | "dashed" | "dotted";
  hoverGlow?: boolean;
  glowColor?: string;
  glowIntensity?: "low" | "medium" | "high";
  hoverScale?: number;
  reflectionEffect?: boolean;
  depthEffect?: boolean;
  showButton?: boolean;
  buttonText?: string;
  buttonLink?: string;
  buttonPosition?: "front" | "back" | "both";
  buttonVariant?: "primary" | "secondary" | "outline" | "ghost";
  showFlipIndicator?: boolean;
  indicatorPosition?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  indicatorText?: string;
  indicatorStyle?: "icon" | "text" | "dot";
  animateOnMount?: boolean;
  mountAnimation?: "fade" | "scale" | "slide";
  hoverPause?: boolean;
  hideOnMobile?: boolean;
  mobileFlipOn?: "click" | "tap";
  mobileWidth?: "sm" | "md" | "lg" | "full";
  ariaLabel?: string;
  ariaDescription?: string;
  reducedMotion?: boolean;
  id?: string;
  className?: string;
  children?: React.ReactNode;
}

export function CardFlip3DRender({
  frontBackgroundColor = "",
  backBackgroundColor = "#ec4899",
  frontImage,
  backImage,
  frontTitle = "Front Side",
  frontSubtitle,
  frontDescription = "Hover to flip",
  frontGradient = false,
  frontGradientFrom = "",
  frontGradientTo = "#ec4899",
  frontIcon,
  frontBadge,
  backTitle = "Back Side",
  backSubtitle,
  backDescription = "Amazing content here",
  backGradient = false,
  backGradientFrom = "#ec4899",
  backGradientTo = "",
  backContent: backContentText,
  flipOn = "hover",
  flipDirection = "horizontal",
  flipDuration = 600,
  flipEasing = "ease-in-out",
  startFlipped = false,
  disableFlip = false,
  width = "md",
  height = "md",
  customWidth,
  customHeight,
  aspectRatio = "none",
  borderRadius = "lg",
  shadow = "lg",
  frontTextColor = "#ffffff",
  backTextColor = "#ffffff",
  frontOpacity = 1,
  backOpacity = 1,
  showBorder = false,
  frontBorderColor,
  backBorderColor,
  borderWidth = "2",
  borderStyle = "solid",
  hoverGlow = false,
  glowColor = "",
  glowIntensity = "medium",
  hoverScale = 1,
  reflectionEffect = false,
  depthEffect = true,
  showButton = false,
  buttonText = "Learn More",
  buttonLink,
  buttonPosition = "back",
  buttonVariant = "primary",
  showFlipIndicator = true,
  indicatorPosition = "top-right",
  indicatorText,
  indicatorStyle = "icon",
  animateOnMount = false,
  mountAnimation = "fade",
  hoverPause = false,
  hideOnMobile = false,
  mobileFlipOn = "click",
  mobileWidth = "full",
  ariaLabel,
  ariaDescription,
  reducedMotion = true,
  id,
  className = "",
}: CardFlip3DProps) {
  const [isFlipped, setIsFlipped] = React.useState(startFlipped);
  const [isMounted, setIsMounted] = React.useState(!animateOnMount);
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    if (reducedMotion) {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mq.matches);
    }
    if (animateOnMount) {
      const t = setTimeout(() => setIsMounted(true), 50);
      return () => clearTimeout(t);
    }
  }, [reducedMotion, animateOnMount]);

  const frontImageUrl = getImageUrl(frontImage);
  const backImageUrl = getImageUrl(backImage);

  const widthMap: Record<string, string> = {
    sm: "w-48",
    md: "w-64",
    lg: "w-80",
    xl: "w-96",
    full: "w-full",
    custom: "",
  };
  const heightMap: Record<string, string> = {
    sm: "h-48",
    md: "h-64",
    lg: "h-80",
    xl: "h-96",
    custom: "",
  };
  const shadowMap: Record<string, string> = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
  };
  const aspectMap: Record<string, string> = {
    none: "",
    "1/1": "aspect-square",
    "4/3": "aspect-4/3",
    "16/9": "aspect-video",
    "3/4": "aspect-3/4",
  };
  const glowIntensityMap: Record<string, string> = {
    low: "0 0 15px",
    medium: "0 0 30px",
    high: "0 0 50px",
  };
  const borderWidthMap: Record<string, string> = {
    "1": "1px",
    "2": "2px",
    "3": "3px",
    "4": "4px",
  };

  const widthVal = typeof width === "string" ? width : width?.desktop || "md";
  const heightVal =
    typeof height === "string" ? height : height?.desktop || "md";
  const widthClass =
    widthVal === "custom" && customWidth ? "" : widthMap[widthVal] || "w-64";
  const heightClass =
    heightVal === "custom" && customHeight
      ? ""
      : heightMap[heightVal] || "h-64";
  const radiusClasses = getResponsiveClasses(borderRadius, borderRadiusMap);
  const aspectClass = aspectMap[aspectRatio] || "";
  const actualDuration = prefersReducedMotion ? 0 : flipDuration;
  const easingValue =
    flipEasing === "spring" ? "cubic-bezier(0.34, 1.56, 0.64, 1)" : flipEasing;

  // Flip transform based on direction
  const getFlipTransform = (flipped: boolean) => {
    if (!flipped) return "none";
    switch (flipDirection) {
      case "vertical":
        return "rotateX(180deg)";
      case "diagonal":
        return "rotateX(180deg) rotateY(180deg)";
      default:
        return "rotateY(180deg)";
    }
  };

  // Flip handlers
  const handleMouseEnter = () => {
    if (disableFlip || prefersReducedMotion) return;
    if (flipOn === "hover" || flipOn === "both") setIsFlipped(true);
  };
  const handleMouseLeave = () => {
    if (disableFlip) return;
    if (flipOn === "hover" || flipOn === "both") setIsFlipped(false);
  };
  const handleClick = () => {
    if (disableFlip) return;
    if (flipOn === "click" || flipOn === "both") setIsFlipped(!isFlipped);
  };

  // Build face background styles
  const buildFaceBackground = (
    image: string | undefined,
    bgColor: string,
    gradient: boolean,
    gradFrom: string,
    gradTo: string,
  ): React.CSSProperties => {
    if (image)
      return {
        backgroundImage: `url(${image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    if (gradient && gradFrom && gradTo)
      return { background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})` };
    return { backgroundColor: bgColor || "var(--color-primary, #6366f1)" };
  };

  // Back face rotation offset for backface-visibility
  const getBackFaceTransform = () => {
    switch (flipDirection) {
      case "vertical":
        return "rotateX(180deg)";
      case "diagonal":
        return "rotateX(180deg) rotateY(180deg)";
      default:
        return "rotateY(180deg)";
    }
  };

  // Button component
  const renderButton = (side: "front" | "back") => {
    if (!showButton || (buttonPosition !== side && buttonPosition !== "both"))
      return null;
    const variantClasses: Record<string, string> = {
      primary: "bg-white text-gray-900 hover:bg-gray-100",
      secondary: "bg-white/20 text-white hover:bg-white/30",
      outline: "border border-white text-white hover:bg-white/10",
      ghost: "text-white hover:bg-white/10",
    };
    return (
      <a
        href={buttonLink || "#"}
        className={`mt-3 inline-block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${variantClasses[buttonVariant] || variantClasses.primary}`}
        onClick={(e) => e.stopPropagation()}
      >
        {buttonText}
      </a>
    );
  };

  // Flip indicator
  const renderIndicator = () => {
    if (!showFlipIndicator || disableFlip) return null;
    const posMap: Record<string, string> = {
      "top-right": "top-2 right-2",
      "top-left": "top-2 left-2",
      "bottom-right": "bottom-2 right-2",
      "bottom-left": "bottom-2 left-2",
    };
    return (
      <div
        className={`absolute ${posMap[indicatorPosition] || "top-2 right-2"} z-20 text-white/70`}
        aria-hidden="true"
      >
        {indicatorStyle === "dot" && (
          <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
        )}
        {indicatorStyle === "text" && (
          <span className="text-xs">{indicatorText || "Flip"}</span>
        )}
        {indicatorStyle === "icon" && (
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
            />
          </svg>
        )}
      </div>
    );
  };

  // Mount animation style
  const mountStyle: React.CSSProperties = animateOnMount
    ? {
        opacity: isMounted ? 1 : 0,
        transform: isMounted
          ? "none"
          : mountAnimation === "scale"
            ? "scale(0.9)"
            : mountAnimation === "slide"
              ? "translateY(20px)"
              : "none",
        transition: `opacity 0.5s ease-out, transform 0.5s ease-out`,
      }
    : {};

  // Hover glow + scale container style
  const containerStyle: React.CSSProperties = {
    perspective: "1000px",
    ...(customWidth && widthVal === "custom" ? { width: customWidth } : {}),
    ...(customHeight && heightVal === "custom" ? { height: customHeight } : {}),
    ...mountStyle,
  };

  // Shared face border
  const buildBorderStyle = (faceColor?: string): React.CSSProperties => {
    if (!showBorder) return {};
    return {
      border: `${borderWidthMap[borderWidth] || "2px"} ${borderStyle} ${faceColor || "rgba(255,255,255,0.3)"}`,
    };
  };

  return (
    <div
      id={id}
      className={`relative cursor-pointer ${widthClass} ${heightClass} ${aspectClass} ${hideOnMobile ? "hidden md:block" : ""} ${className}`}
      style={containerStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel || `${frontTitle} - flip card`}
      aria-description={ariaDescription}
      aria-pressed={isFlipped}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Hover glow */}
      {hoverGlow && (
        <div
          className="absolute -inset-1 rounded-inherit opacity-0 hover:opacity-100 transition-opacity pointer-events-none z-0"
          style={{
            boxShadow: `${glowIntensityMap[glowIntensity] || "0 0 30px"} ${glowColor || "var(--color-primary, #6366f1)"}`,
            borderRadius: "inherit",
          }}
          aria-hidden="true"
        />
      )}
      <div
        className={`relative w-full h-full ${shadowMap[shadow] || ""}`}
        style={{
          transformStyle: "preserve-3d",
          transform: `${getFlipTransform(isFlipped)}${hoverScale > 1 ? ` scale(${isFlipped ? hoverScale : 1})` : ""}`,
          transition: prefersReducedMotion
            ? "none"
            : `transform ${actualDuration}ms ${easingValue}`,
        }}
      >
        {/* Front Face */}
        <div
          className={`absolute inset-0 w-full h-full ${radiusClasses} overflow-hidden flex flex-col items-center justify-center p-6`}
          style={{
            backfaceVisibility: "hidden",
            color: frontTextColor,
            opacity: frontOpacity,
            ...buildFaceBackground(
              frontImageUrl,
              frontBackgroundColor,
              frontGradient,
              frontGradientFrom,
              frontGradientTo,
            ),
            ...buildBorderStyle(frontBorderColor),
          }}
        >
          {frontImageUrl && (
            <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
          )}
          {reflectionEffect && (
            <div
              className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"
              aria-hidden="true"
            />
          )}
          {renderIndicator()}
          <div className="relative z-10 text-center">
            {frontIcon && <div className="text-3xl mb-2">{frontIcon}</div>}
            {frontBadge && (
              <span className="inline-block px-2 py-0.5 rounded-full bg-white/20 text-xs font-medium mb-2">
                {frontBadge}
              </span>
            )}
            <h3 className="text-xl font-bold mb-1">{frontTitle}</h3>
            {frontSubtitle && (
              <p className="text-sm font-medium opacity-90 mb-1">
                {frontSubtitle}
              </p>
            )}
            <p className="text-sm opacity-80">{frontDescription}</p>
            {renderButton("front")}
          </div>
        </div>

        {/* Back Face */}
        <div
          className={`absolute inset-0 w-full h-full ${radiusClasses} overflow-hidden flex flex-col items-center justify-center p-6`}
          style={{
            backfaceVisibility: "hidden",
            transform: getBackFaceTransform(),
            color: backTextColor,
            opacity: backOpacity,
            ...buildFaceBackground(
              backImageUrl,
              backBackgroundColor,
              backGradient,
              backGradientFrom,
              backGradientTo,
            ),
            ...buildBorderStyle(backBorderColor),
          }}
        >
          {backImageUrl && (
            <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
          )}
          {reflectionEffect && (
            <div
              className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"
              aria-hidden="true"
            />
          )}
          <div className="relative z-10 text-center">
            <h3 className="text-xl font-bold mb-1">{backTitle}</h3>
            {backSubtitle && (
              <p className="text-sm font-medium opacity-90 mb-1">
                {backSubtitle}
              </p>
            )}
            <p className="text-sm opacity-80">{backDescription}</p>
            {backContentText && (
              <p className="text-sm mt-2 opacity-90">{backContentText}</p>
            )}
            {renderButton("back")}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3D EFFECTS: TILT CARD
// ============================================================================

export interface TiltCardProps {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  badge?: string;
  badgeColor?: string;
  backgroundColor?: string;
  backgroundImage?: string | ImageValue;
  backgroundGradient?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
  gradientDirection?: string;
  overlay?: boolean;
  overlayOpacity?: number;
  textColor?: string;
  maxRotation?: number;
  perspective?: number;
  speed?: number;
  scale?: number;
  easing?: "ease" | "ease-out" | "linear";
  axis?: "both" | "x" | "y";
  disabled?: boolean;
  glare?: boolean;
  glareMaxOpacity?: number;
  glareColor?: string;
  glarePosition?: "all" | "top" | "bottom";
  glareReverse?: boolean;
  padding?: ResponsiveValue<"none" | "xs" | "sm" | "md" | "lg">;
  borderRadius?: ResponsiveValue<"none" | "sm" | "md" | "lg" | "xl" | "2xl">;
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
  shadowOnHover?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  showBorder?: boolean;
  borderColor?: string;
  borderWidth?: string;
  borderGlow?: boolean;
  shine?: boolean;
  shineColor?: string;
  floatEffect?: boolean;
  floatIntensity?: "subtle" | "medium" | "strong";
  gyroscope?: boolean;
  showButton?: boolean;
  buttonText?: string;
  buttonLink?: string;
  buttonVariant?: "primary" | "secondary" | "outline" | "ghost";
  buttonPosition?: "bottom" | "top" | "center";
  showIcon?: boolean;
  iconPosition?: "top" | "center" | "bottom";
  iconSize?: "sm" | "md" | "lg" | "xl";
  iconColor?: string;
  iconBackgroundColor?: string;
  animateOnMount?: boolean;
  mountAnimation?: "fade" | "scale" | "slide";
  animationDuration?: number;
  hideOnMobile?: boolean;
  disableOnMobile?: boolean;
  mobileScale?: number;
  ariaLabel?: string;
  reducedMotion?: boolean;
  id?: string;
  className?: string;
}

export function TiltCardRender({
  title = "Tilt Card",
  subtitle,
  description = "Hover to see 3D tilt effect",
  icon,
  badge,
  badgeColor = "",
  backgroundColor = "#1f2937",
  backgroundImage,
  backgroundGradient = false,
  gradientFrom = "",
  gradientTo = "#ec4899",
  gradientDirection = "to-br",
  overlay = false,
  overlayOpacity = 0.3,
  textColor = "#ffffff",
  maxRotation = 15,
  perspective = 1000,
  speed = 500,
  scale = 1.05,
  easing = "ease-out",
  axis = "both",
  disabled = false,
  glare = true,
  glareMaxOpacity = 0.35,
  glareColor = "#ffffff",
  glarePosition = "all",
  glareReverse = false,
  padding = "lg",
  borderRadius = "xl",
  shadow = "xl",
  shadowOnHover = "2xl",
  showBorder = false,
  borderColor = "#ffffff20",
  borderWidth = "1",
  borderGlow = false,
  shine = false,
  shineColor = "#ffffff40",
  floatEffect = false,
  floatIntensity = "subtle",
  gyroscope = false,
  showButton = false,
  buttonText = "Learn More",
  buttonLink,
  buttonVariant = "primary",
  buttonPosition = "bottom",
  showIcon = false,
  iconPosition = "top",
  iconSize = "lg",
  iconColor,
  iconBackgroundColor,
  animateOnMount = true,
  mountAnimation = "fade",
  animationDuration = 300,
  hideOnMobile = false,
  disableOnMobile = true,
  mobileScale = 1,
  ariaLabel,
  reducedMotion = true,
  id,
  className = "",
}: TiltCardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [transform, setTransform] = React.useState("none");
  const [glarePos, setGlarePos] = React.useState({ x: 50, y: 50 });
  const [isMounted, setIsMounted] = React.useState(!animateOnMount);
  const [isHovering, setIsHovering] = React.useState(false);
  const isTouch = React.useRef(false);
  const prefersReduced = React.useRef(false);

  React.useEffect(() => {
    isTouch.current = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (reducedMotion) {
      prefersReduced.current = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
    }
    if (animateOnMount) {
      const t = setTimeout(() => setIsMounted(true), 50);
      return () => clearTimeout(t);
    }
  }, [reducedMotion, animateOnMount]);

  const bgImageUrl = getImageUrl(backgroundImage);
  const paddingClasses = getResponsiveClasses(padding, paddingYMap);
  const radiusClasses = getResponsiveClasses(borderRadius, borderRadiusMap);

  const effectivelyDark = isEffectivelyDark(backgroundColor, bgImageUrl, overlay, undefined, overlayOpacity ? overlayOpacity * 100 : undefined);
  const resolvedTextColor = resolveContrastColor(textColor, effectivelyDark) || textColor;

  const shadowMap: Record<string, string> = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
    "2xl": "shadow-2xl",
  };

  const iconSizeMap: Record<string, string> = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
    xl: "text-4xl",
  };
  const borderWidthMap: Record<string, string> = {
    "1": "1px",
    "2": "2px",
    "3": "3px",
    "4": "4px",
  };
  const floatMap: Record<string, string> = {
    subtle: "3px",
    medium: "6px",
    strong: "10px",
  };
  const gradientMap: Record<string, string> = {
    "to-r": "to right",
    "to-l": "to left",
    "to-t": "to top",
    "to-b": "to bottom",
    "to-br": "to bottom right",
    "to-bl": "to bottom left",
    "to-tr": "to top right",
    "to-tl": "to top left",
  };

  const effectivelyDisabled =
    disabled || (disableOnMobile && isTouch.current) || prefersReduced.current;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (effectivelyDisabled || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotX = axis !== "x" ? ((y - cy) / cy) * -maxRotation : 0;
    const rotY = axis !== "y" ? ((x - cx) / cx) * maxRotation : 0;
    setTransform(
      `perspective(${perspective}px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${scale})`,
    );
    const gx = glareReverse
      ? 100 - (x / rect.width) * 100
      : (x / rect.width) * 100;
    const gy = glareReverse
      ? 100 - (y / rect.height) * 100
      : (y / rect.height) * 100;
    setGlarePos({ x: gx, y: gy });
  };

  const handleMouseLeave = () => {
    setTransform("none");
    setIsHovering(false);
  };

  // Background style
  const bgStyle: React.CSSProperties = bgImageUrl
    ? {
        backgroundImage: `url(${bgImageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : backgroundGradient && gradientFrom && gradientTo
      ? {
          background: `linear-gradient(${gradientMap[gradientDirection] || "to bottom right"}, ${gradientFrom}, ${gradientTo})`,
        }
      : { backgroundColor };

  // Border style
  const borderStyle: React.CSSProperties = showBorder
    ? {
        border: `${borderWidthMap[borderWidth] || "1px"} solid ${borderColor}`,
        ...(borderGlow ? { boxShadow: `0 0 15px ${borderColor}` } : {}),
      }
    : {};

  // Mount animation
  const mountStyle: React.CSSProperties = animateOnMount
    ? {
        opacity: isMounted ? 1 : 0,
        transform: isMounted
          ? transform
          : mountAnimation === "scale"
            ? "scale(0.9)"
            : mountAnimation === "slide"
              ? "translateY(20px)"
              : "none",
        transition: `opacity ${animationDuration}ms ease-out, transform ${speed}ms ${easing}`,
      }
    : {};

  // Float animation
  const floatClass =
    floatEffect && !prefersReduced.current ? "animate-bounce" : "";

  // Button rendering
  const renderButton = () => {
    if (!showButton) return null;
    const variants: Record<string, string> = {
      primary: "bg-white text-gray-900 hover:bg-gray-100",
      secondary: "bg-white/20 text-white hover:bg-white/30",
      outline: "border border-white text-white hover:bg-white/10",
      ghost: "text-white hover:bg-white/10",
    };
    return (
      <a
        href={buttonLink || "#"}
        className={`inline-block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${variants[buttonVariant] || variants.primary}`}
        onClick={(e) => e.stopPropagation()}
      >
        {buttonText}
      </a>
    );
  };

  // Icon rendering
  const renderIcon = () => {
    if (!showIcon || !icon) return null;
    return (
      <div
        className={`${iconSizeMap[iconSize] || "text-3xl"} mb-2 ${iconBackgroundColor ? "inline-flex items-center justify-center w-12 h-12 rounded-xl" : ""}`}
        style={{
          color: iconColor || resolvedTextColor,
          backgroundColor: iconBackgroundColor || undefined,
        }}
      >
        {icon}
      </div>
    );
  };

  return (
    <div
      id={id}
      ref={cardRef}
      className={`relative overflow-hidden ${radiusClasses} ${shadowMap[shadow] || ""} ${paddingClasses} ${floatClass} ${hideOnMobile ? "hidden md:block" : ""} ${className}`}
      style={{
        ...bgStyle,
        ...borderStyle,
        color: resolvedTextColor,
        transform: effectivelyDisabled ? "none" : transform,
        transition: `transform ${speed}ms ${easing}, box-shadow 0.3s ease`,
        transformStyle: "preserve-3d",
        ...mountStyle,
        ...(isHovering && shadowOnHover ? {} : {}),
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={handleMouseLeave}
      role="article"
      aria-label={ariaLabel || title}
    >
      {/* Image overlay */}
      {(bgImageUrl || overlay) && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }}
          aria-hidden="true"
        />
      )}

      {/* Glare effect */}
      {glare && !effectivelyDisabled && (
        <div
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            background:
              glarePosition === "top"
                ? `linear-gradient(to bottom, rgba(${glareColor === "#ffffff" ? "255,255,255" : "255,255,255"},${isHovering ? glareMaxOpacity : 0}), transparent 50%)`
                : glarePosition === "bottom"
                  ? `linear-gradient(to top, rgba(${glareColor === "#ffffff" ? "255,255,255" : "255,255,255"},${isHovering ? glareMaxOpacity : 0}), transparent 50%)`
                  : `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,${isHovering ? glareMaxOpacity : 0}), transparent 50%)`,
            transition: `opacity ${speed}ms ${easing}`,
          }}
          aria-hidden="true"
        />
      )}

      {/* Shine sweep */}
      {shine && !prefersReduced.current && (
        <div
          className="absolute inset-0 pointer-events-none z-20 overflow-hidden"
          aria-hidden="true"
        >
          <div
            className="absolute -inset-full"
            style={{
              background: `linear-gradient(90deg, transparent, ${shineColor}, transparent)`,
              animation: "shine-sweep 3s ease-in-out infinite",
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {iconPosition === "top" && renderIcon()}
        {badge && (
          <span
            className="inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-2"
            style={{
              backgroundColor: badgeColor || "rgba(255,255,255,0.2)",
              color: resolvedTextColor,
            }}
          >
            {badge}
          </span>
        )}
        <h3 className="text-xl font-bold mb-1">{title}</h3>
        {subtitle && (
          <p className="text-sm font-medium opacity-90 mb-1">{subtitle}</p>
        )}
        <p className="text-sm opacity-80">{description}</p>
        {iconPosition === "center" && renderIcon()}
        {buttonPosition === "top" && renderButton()}
        {buttonPosition !== "top" &&
          buttonPosition !== "bottom" &&
          renderButton()}
        {iconPosition === "bottom" && renderIcon()}
        {buttonPosition === "bottom" && (
          <div className="mt-3">{renderButton()}</div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 3D EFFECTS: GLASS CARD
// ============================================================================

export interface GlassCardProps {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  badge?: string;
  preset?:
    | "light"
    | "dark"
    | "colored"
    | "subtle"
    | "heavy"
    | "frosted"
    | "crystal";
  blur?: number;
  saturation?: number;
  brightness?: number;
  contrast?: number;
  noise?: boolean;
  tint?: string;
  tintOpacity?: number;
  backgroundGradient?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
  gradientAngle?: number;
  showBorder?: boolean;
  borderOpacity?: number;
  borderColor?: string;
  borderWidth?: string;
  borderGradient?: boolean;
  borderGlowColor?: string;
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
  shadowColor?: string;
  shadowBlur?: number;
  innerShadow?: boolean;
  textColor?: string;
  headingColor?: string;
  padding?: ResponsiveValue<"none" | "xs" | "sm" | "md" | "lg">;
  borderRadius?: ResponsiveValue<"none" | "sm" | "md" | "lg" | "xl" | "2xl">;
  minHeight?: "auto" | "sm" | "md" | "lg";
  showButton?: boolean;
  buttonText?: string;
  buttonLink?: string;
  buttonVariant?: "glass" | "solid" | "outline";
  showIcon?: boolean;
  iconSize?: "sm" | "md" | "lg" | "xl";
  iconColor?: string;
  iconBackgroundColor?: string;
  iconBackgroundBlur?: boolean;
  hoverScale?: number;
  hoverBlur?: number;
  hoverBrightness?: number;
  hoverBorderGlow?: boolean;
  animateOnMount?: boolean;
  mountAnimation?: "fade" | "scale" | "blur";
  shimmerEffect?: boolean;
  floatEffect?: boolean;
  hideOnMobile?: boolean;
  mobileBlur?: number;
  mobilePadding?: "same" | "smaller";
  ariaLabel?: string;
  reducedMotion?: boolean;
  id?: string;
  className?: string;
}

export function GlassCardRender({
  title = "Glass Card",
  subtitle,
  description = "Beautiful frosted glass effect",
  icon,
  badge,
  preset = "light",
  blur = 10,
  saturation = 100,
  brightness = 100,
  contrast = 100,
  noise = false,
  tint,
  tintOpacity = 0.3,
  backgroundGradient = false,
  gradientFrom = "#ffffff30",
  gradientTo = "#ffffff10",
  gradientAngle = 135,
  showBorder = true,
  borderOpacity = 0.2,
  borderColor = "#ffffff",
  borderWidth = "1",
  borderGradient = false,
  borderGlowColor,
  shadow = "lg",
  shadowColor = "#00000020",
  shadowBlur = 20,
  innerShadow = false,
  textColor = "#ffffff",
  headingColor,
  padding = "lg",
  borderRadius = "xl",
  minHeight = "auto",
  showButton = false,
  buttonText = "Learn More",
  buttonLink,
  buttonVariant = "glass",
  showIcon = false,
  iconSize = "lg",
  iconColor,
  iconBackgroundColor = "#ffffff20",
  iconBackgroundBlur = true,
  hoverScale = 1.02,
  hoverBlur = 2,
  hoverBrightness = 105,
  hoverBorderGlow = false,
  animateOnMount = true,
  mountAnimation = "fade",
  shimmerEffect = false,
  floatEffect = false,
  hideOnMobile = false,
  mobileBlur = 5,
  mobilePadding = "same",
  ariaLabel,
  reducedMotion = true,
  id,
  className = "",
}: GlassCardProps) {
  const [isHovering, setIsHovering] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(!animateOnMount);
  const isMobile = React.useRef(false);
  const prefersReduced = React.useRef(false);

  React.useEffect(() => {
    isMobile.current = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (reducedMotion) {
      prefersReduced.current = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
    }
    if (animateOnMount) {
      const t = setTimeout(() => setIsMounted(true), 50);
      return () => clearTimeout(t);
    }
  }, [reducedMotion, animateOnMount]);

  const presets: Record<string, { blur: number; bg: string; border: number }> =
    {
      light: { blur: 10, bg: "rgba(255,255,255,0.25)", border: 0.2 },
      dark: { blur: 12, bg: "rgba(0,0,0,0.3)", border: 0.1 },
      colored: { blur: 15, bg: "rgba(99,102,241,0.2)", border: 0.3 },
      subtle: { blur: 5, bg: "rgba(255,255,255,0.1)", border: 0 },
      heavy: { blur: 25, bg: "rgba(255,255,255,0.4)", border: 0.4 },
      frosted: { blur: 20, bg: "rgba(255,255,255,0.15)", border: 0.15 },
      crystal: { blur: 30, bg: "rgba(255,255,255,0.1)", border: 0.3 },
    };

  const config = presets[preset] || presets.light;
  // Glass cards are typically on dark backgrounds; resolve contrast
  const glassIsDark = ["dark", "heavy", "frosted", "crystal", "colored"].includes(preset);
  const resolvedTextColor = resolveContrastColor(textColor || "#ffffff", glassIsDark);
  const actualBlur = isMobile.current ? mobileBlur : blur || config.blur;
  const baseBlur = isHovering ? actualBlur + hoverBlur : actualBlur;
  const actualTint = tint || config.bg;
  const actualBorderOpacity = borderOpacity ?? config.border;
  const actualSat = isHovering ? saturation + 20 : saturation;
  const actualBright = isHovering ? hoverBrightness : brightness;

  const paddingClasses = getResponsiveClasses(padding, paddingYMap);
  const radiusClasses = getResponsiveClasses(borderRadius, borderRadiusMap);
  const minHeightMap: Record<string, string> = {
    auto: "",
    sm: "min-h-[8rem]",
    md: "min-h-[12rem]",
    lg: "min-h-[16rem]",
  };
  const iconSizeMap: Record<string, string> = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
    xl: "text-4xl",
  };
  const shadowMap: Record<string, string> = {
    none: "none",
    sm: `0 2px 8px ${shadowColor}`,
    md: `0 4px 15px ${shadowColor}`,
    lg: `0 10px ${shadowBlur}px ${shadowColor}`,
    xl: `0 20px 40px ${shadowColor}`,
  };

  const backdropVal = `blur(${baseBlur}px) saturate(${actualSat}%) brightness(${actualBright}%) contrast(${contrast}%)`;

  // Background
  const bgStyle =
    backgroundGradient && gradientFrom && gradientTo
      ? `linear-gradient(${gradientAngle}deg, ${gradientFrom}, ${gradientTo})`
      : actualTint;

  // Border
  const borderStyle: React.CSSProperties = showBorder
    ? {
        border: borderGradient
          ? undefined
          : `${borderWidth === "2" ? "2px" : "1px"} solid rgba(${borderColor === "#ffffff" ? "255,255,255" : "255,255,255"},${actualBorderOpacity})`,
        ...(borderGradient
          ? {
              borderImage: `linear-gradient(${gradientAngle}deg, rgba(255,255,255,${actualBorderOpacity}), rgba(255,255,255,0)) 1`,
            }
          : {}),
      }
    : {};

  // Shadow
  const boxShadows: string[] = [];
  if (shadow !== "none") boxShadows.push(shadowMap[shadow] || shadowMap.lg);
  if (innerShadow) boxShadows.push("inset 0 2px 4px rgba(255,255,255,0.1)");
  if ((isHovering && hoverBorderGlow) || borderGlowColor) {
    boxShadows.push(`0 0 20px ${borderGlowColor || "rgba(255,255,255,0.3)"}`);
  }

  // Mount animation
  const mountStyle: React.CSSProperties = animateOnMount
    ? {
        opacity: isMounted ? 1 : 0,
        transform: isMounted
          ? isHovering
            ? `scale(${hoverScale})`
            : "none"
          : mountAnimation === "scale"
            ? "scale(0.95)"
            : "none",
        filter: isMounted
          ? undefined
          : mountAnimation === "blur"
            ? "blur(10px)"
            : undefined,
        transition:
          "opacity 0.4s ease-out, transform 0.3s ease-out, filter 0.4s ease-out, backdrop-filter 0.3s ease",
      }
    : {
        transform: isHovering ? `scale(${hoverScale})` : "none",
        transition: "transform 0.3s ease, backdrop-filter 0.3s ease",
      };

  const renderButton = () => {
    if (!showButton) return null;
    const variants: Record<string, string> = {
      glass:
        "bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20",
      solid: "bg-white text-gray-900 hover:bg-gray-100",
      outline: "border border-white/40 text-white hover:bg-white/10",
    };
    return (
      <a
        href={buttonLink || "#"}
        className={`inline-block px-4 py-2 rounded-lg text-sm font-medium transition-colors mt-3 ${variants[buttonVariant] || variants.glass}`}
        onClick={(e) => e.stopPropagation()}
      >
        {buttonText}
      </a>
    );
  };

  const renderIcon = () => {
    if (!showIcon || !icon) return null;
    return (
      <div
        className={`${iconSizeMap[iconSize] || "text-3xl"} mb-3 inline-flex items-center justify-center w-12 h-12 rounded-xl`}
        style={{
          color: iconColor || resolvedTextColor,
          backgroundColor: iconBackgroundColor || undefined,
          ...(iconBackgroundBlur ? { backdropFilter: "blur(8px)" } : {}),
        }}
      >
        {icon}
      </div>
    );
  };

  return (
    <div
      id={id}
      className={`relative overflow-hidden ${paddingClasses} ${radiusClasses} ${minHeightMap[minHeight] || ""} ${hideOnMobile ? "hidden md:block" : ""} ${mobilePadding === "smaller" ? "max-md:p-3" : ""} ${floatEffect && !prefersReduced.current ? "animate-bounce" : ""} ${className}`}
      style={{
        background: bgStyle,
        backdropFilter: backdropVal,
        WebkitBackdropFilter: backdropVal,
        ...borderStyle,
        boxShadow: boxShadows.length > 0 ? boxShadows.join(", ") : undefined,
        color: resolvedTextColor,
        ...mountStyle,
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      role="article"
      aria-label={ariaLabel || title}
    >
      {/* Noise texture overlay */}
      {noise && (
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03] z-0"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
            backgroundRepeat: "repeat",
          }}
          aria-hidden="true"
        />
      )}

      {/* Shimmer sweep */}
      {shimmerEffect && !prefersReduced.current && (
        <div
          className="absolute inset-0 pointer-events-none z-10 overflow-hidden"
          aria-hidden="true"
        >
          <div
            className="absolute -inset-full"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
              animation: "shine-sweep 3s ease-in-out infinite",
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {renderIcon()}
        {badge && (
          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-2 bg-white/10 backdrop-blur-sm">
            {badge}
          </span>
        )}
        <h3
          className="text-xl font-bold mb-1"
          style={{ color: headingColor || resolvedTextColor }}
        >
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm font-medium opacity-90 mb-1">{subtitle}</p>
        )}
        <p className="text-sm opacity-80">{description}</p>
        {renderButton()}
      </div>
    </div>
  );
}

// ============================================================================
// 3D EFFECTS: PARTICLE BACKGROUND
// ============================================================================

export interface ParticleBackgroundProps {
  particleCount?: number;
  particleShape?:
    | "circle"
    | "square"
    | "triangle"
    | "star"
    | "polygon"
    | "image";
  particleSize?: number;
  particleSizeVariation?: number;
  particleOpacity?: number;
  particleOpacityVariation?: number;
  particleColor?: string;
  multiColor?: boolean;
  colorPalette?: string;
  colorMode?: "single" | "random" | "gradient";
  colorTransition?: boolean;
  speed?: number;
  direction?:
    | "none"
    | "up"
    | "down"
    | "left"
    | "right"
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right";
  randomDirection?: boolean;
  bounce?: boolean;
  gravity?: number;
  wind?: number;
  windDirection?: number;
  connected?: boolean;
  connectionDistance?: number;
  connectionOpacity?: number;
  connectionColor?: string;
  connectionWidth?: number;
  connectionCurved?: boolean;
  interactivity?: boolean;
  hoverMode?: "none" | "repulse" | "attract" | "grab" | "bubble";
  hoverDistance?: number;
  clickMode?: "none" | "push" | "remove" | "repulse" | "bubble";
  clickParticleCount?: number;
  repulseDistance?: number;
  attractDistance?: number;
  backgroundColor?: string;
  backgroundGradient?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
  gradientDirection?: "to-b" | "to-r" | "to-br" | "radial";
  backgroundImage?: string | ImageValue;
  backgroundOpacity?: number;
  height?: ResponsiveValue<"sm" | "md" | "lg" | "xl" | "screen" | "custom">;
  fullScreen?: boolean;
  minHeight?: string;
  maxHeight?: string;
  twinkle?: boolean;
  twinkleFrequency?: number;
  trail?: boolean;
  trailLength?: number;
  pulsate?: boolean;
  glow?: boolean;
  glowIntensity?: number;
  spawnRate?: number;
  spawnPosition?: "random" | "bottom" | "top" | "center";
  lifetime?: number;
  fadeIn?: boolean;
  fadeOut?: boolean;
  fps?: number;
  pauseOnBlur?: boolean;
  reducedOnMobile?: boolean;
  mobileParticleCount?: number;
  ariaLabel?: string;
  reducedMotion?: boolean;
  pauseOnReducedMotion?: boolean;
  children?: React.ReactNode;
  id?: string;
  className?: string;
}

export function ParticleBackgroundRender({
  particleCount = 50,
  particleShape = "circle",
  particleSize = 4,
  particleSizeVariation = 2,
  particleOpacity = 0.8,
  particleOpacityVariation = 0.2,
  particleColor = "",
  multiColor = false,
  colorPalette,
  colorMode = "single",
  colorTransition = false,
  speed = 1,
  direction = "none",
  randomDirection = true,
  bounce = true,
  gravity = 0,
  wind = 0,
  windDirection = 0,
  connected = true,
  connectionDistance = 150,
  connectionOpacity = 0.4,
  connectionColor,
  connectionWidth = 1,
  connectionCurved = false,
  interactivity = true,
  hoverMode = "repulse",
  hoverDistance = 100,
  clickMode = "push",
  clickParticleCount = 4,
  repulseDistance = 100,
  attractDistance = 100,
  backgroundColor = "#0f172a",
  backgroundGradient = false,
  gradientFrom = "#0f172a",
  gradientTo = "#1e1b4b",
  gradientDirection = "to-b",
  backgroundImage,
  backgroundOpacity = 1,
  height = "md",
  fullScreen = false,
  minHeight,
  maxHeight,
  twinkle = false,
  twinkleFrequency = 0.5,
  trail = false,
  trailLength = 5,
  pulsate = false,
  glow = false,
  glowIntensity = 5,
  spawnRate = 0,
  spawnPosition = "random",
  lifetime = 0,
  fadeIn = false,
  fadeOut = false,
  fps = 60,
  pauseOnBlur = true,
  reducedOnMobile = true,
  mobileParticleCount = 25,
  ariaLabel = "Animated particle background",
  reducedMotion = true,
  pauseOnReducedMotion = true,
  children,
  id,
  className = "",
}: ParticleBackgroundProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const animationRef = React.useRef<number | undefined>(undefined);
  const mouseRef = React.useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });
  const particlesRef = React.useRef<
    Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      color: string;
      age: number;
      maxAge: number;
      baseOpacity: number;
      twinklePhase: number;
      pulsatePhase: number;
    }>
  >([]);

  const bgImageUrl = getImageUrl(backgroundImage);

  const heightMap: Record<string, string> = {
    sm: "h-48",
    md: "h-64",
    lg: "h-96",
    xl: "h-[32rem]",
    screen: "h-screen",
    custom: "",
  };
  const heightClass = fullScreen
    ? "h-screen"
    : heightMap[typeof height === "string" ? height : height?.desktop || "md"];

  // Parse color palette
  const paletteColors = React.useMemo(() => {
    if (multiColor && colorPalette) {
      return colorPalette
        .split(",")
        .map((c: string) => c.trim())
        .filter(Boolean);
    }
    return [particleColor || "#ffffff"];
  }, [multiColor, colorPalette, particleColor]);

  // Direction vectors
  const dirVectors: Record<string, { x: number; y: number }> = {
    none: { x: 0, y: 0 },
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
    "top-left": { x: -0.7, y: -0.7 },
    "top-right": { x: 0.7, y: -0.7 },
    "bottom-left": { x: -0.7, y: 0.7 },
    "bottom-right": { x: 0.7, y: 0.7 },
  };

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Check reduced motion
    if (
      reducedMotion &&
      pauseOnReducedMotion &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const isMobile = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const count =
      reducedOnMobile && isMobile ? mobileParticleCount : particleCount;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Pause on blur
    let paused = false;
    const handleBlur = () => {
      if (pauseOnBlur) paused = true;
    };
    const handleFocus = () => {
      paused = false;
    };
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    // Mouse interactivity
    const handleMouseMove = (e: MouseEvent) => {
      if (!interactivity || !canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };
    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };
    const handleClick = (e: MouseEvent) => {
      if (!interactivity || clickMode === "none" || !canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      if (clickMode === "push") {
        for (let i = 0; i < clickParticleCount; i++) {
          createParticle(
            mx + (Math.random() - 0.5) * 20,
            my + (Math.random() - 0.5) * 20,
          );
        }
      } else if (clickMode === "remove") {
        particlesRef.current.splice(
          0,
          Math.min(clickParticleCount, particlesRef.current.length),
        );
      }
    };
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    canvas.addEventListener("click", handleClick);

    const dir = dirVectors[direction] || dirVectors.none;

    function createParticle(
      x?: number,
      y?: number,
    ): (typeof particlesRef.current)[0] {
      const cw = canvas!.width;
      const ch = canvas!.height;
      let px = x ?? Math.random() * cw;
      let py = y ?? Math.random() * ch;
      if (!x && spawnPosition !== "random") {
        if (spawnPosition === "bottom") py = ch;
        else if (spawnPosition === "top") py = 0;
        else if (spawnPosition === "center") {
          px = cw / 2 + (Math.random() - 0.5) * cw * 0.3;
          py = ch / 2 + (Math.random() - 0.5) * ch * 0.3;
        }
      }
      const colorIdx =
        colorMode === "random"
          ? Math.floor(Math.random() * paletteColors.length)
          : 0;
      return {
        x: px,
        y: py,
        size: Math.random() * particleSizeVariation + particleSize * 0.5,
        speedX: randomDirection
          ? (Math.random() - 0.5) * speed + dir.x * speed
          : dir.x * speed,
        speedY: randomDirection
          ? (Math.random() - 0.5) * speed + dir.y * speed
          : dir.y * speed,
        opacity:
          particleOpacity + (Math.random() - 0.5) * particleOpacityVariation,
        baseOpacity:
          particleOpacity + (Math.random() - 0.5) * particleOpacityVariation,
        color: paletteColors[colorIdx],
        age: 0,
        maxAge: lifetime > 0 ? lifetime * 60 + Math.random() * 60 : 0,
        twinklePhase: Math.random() * Math.PI * 2,
        pulsatePhase: Math.random() * Math.PI * 2,
      };
    }

    particlesRef.current = Array.from({ length: count }, () =>
      createParticle(),
    );

    let lastSpawn = 0;
    const frameInterval = 1000 / fps;
    let lastFrame = 0;

    const animate = (timestamp: number) => {
      if (!canvas || !ctx) return;
      if (paused) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      // FPS limiting
      if (timestamp - lastFrame < frameInterval) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      lastFrame = timestamp;

      // Trail effect: don't fully clear
      if (trail) {
        ctx.fillStyle = `rgba(0,0,0,${1 / trailLength})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      // Spawn new particles
      if (spawnRate > 0 && timestamp - lastSpawn > 1000 / spawnRate) {
        particlesRef.current.push(createParticle());
        lastSpawn = timestamp;
      }

      const windRad = (windDirection * Math.PI) / 180;
      const windX = wind * Math.cos(windRad);
      const windY = wind * Math.sin(windRad);

      particlesRef.current = particlesRef.current.filter((p) => {
        // Age / lifetime
        if (p.maxAge > 0) {
          p.age++;
          if (p.age > p.maxAge) return false;
          if (fadeIn && p.age < 30) p.opacity = p.baseOpacity * (p.age / 30);
          else if (fadeOut && p.age > p.maxAge - 30)
            p.opacity = p.baseOpacity * ((p.maxAge - p.age) / 30);
        }

        // Movement
        p.speedY += gravity * 0.01;
        p.x += p.speedX + windX;
        p.y += p.speedY + windY;

        // Bounce or wrap
        if (bounce) {
          if (p.x <= 0 || p.x >= canvas.width) p.speedX *= -1;
          if (p.y <= 0 || p.y >= canvas.height) p.speedY *= -1;
          p.x = Math.max(0, Math.min(canvas.width, p.x));
          p.y = Math.max(0, Math.min(canvas.height, p.y));
        } else {
          if (p.x < -10) p.x = canvas.width + 10;
          if (p.x > canvas.width + 10) p.x = -10;
          if (p.y < -10) p.y = canvas.height + 10;
          if (p.y > canvas.height + 10) p.y = -10;
        }

        // Twinkle
        if (twinkle) {
          p.twinklePhase += twinkleFrequency * 0.05;
          p.opacity = p.baseOpacity * (0.5 + 0.5 * Math.sin(p.twinklePhase));
        }

        // Pulsate
        let drawSize = p.size;
        if (pulsate) {
          p.pulsatePhase += 0.03;
          drawSize = p.size * (0.8 + 0.4 * Math.sin(p.pulsatePhase));
        }

        // Mouse interactivity
        if (interactivity && mouseRef.current.active && hoverMode !== "none") {
          const dx = p.x - mouseRef.current.x;
          const dy = p.y - mouseRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (hoverMode === "repulse" && dist < repulseDistance) {
            const force = (repulseDistance - dist) / repulseDistance;
            p.x += (dx / dist) * force * 3;
            p.y += (dy / dist) * force * 3;
          } else if (hoverMode === "attract" && dist < attractDistance) {
            const force = (attractDistance - dist) / attractDistance;
            p.x -= (dx / dist) * force * 2;
            p.y -= (dy / dist) * force * 2;
          }
        }

        // Draw particle
        ctx.globalAlpha = Math.max(0, Math.min(1, p.opacity));
        ctx.fillStyle = p.color;

        if (glow) {
          ctx.shadowColor = p.color;
          ctx.shadowBlur = glowIntensity;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        if (particleShape === "square") {
          ctx.fillRect(
            p.x - drawSize / 2,
            p.y - drawSize / 2,
            drawSize,
            drawSize,
          );
        } else if (particleShape === "triangle") {
          ctx.moveTo(p.x, p.y - drawSize);
          ctx.lineTo(p.x - drawSize, p.y + drawSize);
          ctx.lineTo(p.x + drawSize, p.y + drawSize);
          ctx.closePath();
          ctx.fill();
        } else if (particleShape === "star") {
          for (let k = 0; k < 5; k++) {
            const angle = (k * 4 * Math.PI) / 5 - Math.PI / 2;
            const method = k === 0 ? "moveTo" : "lineTo";
            ctx[method](
              p.x + Math.cos(angle) * drawSize,
              p.y + Math.sin(angle) * drawSize,
            );
          }
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.arc(p.x, p.y, drawSize, 0, Math.PI * 2);
          ctx.fill();
        }

        return true;
      });

      // Connections
      if (connected) {
        ctx.shadowBlur = 0;
        const connColor = connectionColor || particleColor || "#ffffff";
        ctx.lineWidth = connectionWidth;
        particlesRef.current.forEach((p, i) => {
          for (let j = i + 1; j < particlesRef.current.length; j++) {
            const other = particlesRef.current[j];
            const dx = p.x - other.x;
            const dy = p.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < connectionDistance) {
              ctx.beginPath();
              ctx.strokeStyle = connColor;
              ctx.globalAlpha =
                (1 - distance / connectionDistance) * connectionOpacity;
              if (connectionCurved) {
                const midX = (p.x + other.x) / 2;
                const midY = (p.y + other.y) / 2 - distance * 0.1;
                ctx.moveTo(p.x, p.y);
                ctx.quadraticCurveTo(midX, midY, other.x, other.y);
              } else {
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(other.x, other.y);
              }
              ctx.stroke();
            }
          }
        });
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      canvas.removeEventListener("click", handleClick);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [
    particleCount,
    particleShape,
    particleSize,
    particleSizeVariation,
    particleOpacity,
    particleOpacityVariation,
    particleColor,
    multiColor,
    colorPalette,
    colorMode,
    colorTransition,
    speed,
    direction,
    randomDirection,
    bounce,
    gravity,
    wind,
    windDirection,
    connected,
    connectionDistance,
    connectionOpacity,
    connectionColor,
    connectionWidth,
    connectionCurved,
    interactivity,
    hoverMode,
    hoverDistance,
    clickMode,
    clickParticleCount,
    repulseDistance,
    attractDistance,
    twinkle,
    twinkleFrequency,
    trail,
    trailLength,
    pulsate,
    glow,
    glowIntensity,
    spawnRate,
    spawnPosition,
    lifetime,
    fadeIn,
    fadeOut,
    fps,
    pauseOnBlur,
    reducedOnMobile,
    mobileParticleCount,
    reducedMotion,
    pauseOnReducedMotion,
    paletteColors,
  ]);

  // Background style
  const bgStyle: React.CSSProperties = backgroundGradient
    ? {
        background:
          gradientDirection === "radial"
            ? `radial-gradient(circle, ${gradientFrom}, ${gradientTo})`
            : `linear-gradient(${gradientDirection === "to-b" ? "to bottom" : gradientDirection === "to-r" ? "to right" : "to bottom right"}, ${gradientFrom}, ${gradientTo})`,
        opacity: backgroundOpacity,
      }
    : { backgroundColor, opacity: backgroundOpacity };

  return (
    <div
      id={id}
      className={`relative overflow-hidden ${heightClass} ${className}`}
      style={{
        ...bgStyle,
        ...(minHeight ? { minHeight } : {}),
        ...(maxHeight ? { maxHeight } : {}),
      }}
      role="presentation"
      aria-label={ariaLabel}
    >
      {bgImageUrl && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${bgImageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: backgroundOpacity,
          }}
          aria-hidden="true"
        />
      )}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full ${interactivity ? "" : "pointer-events-none"}`}
      />
      {children && (
        <div className="relative z-10 flex items-center justify-center h-full">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 3D EFFECTS: SCROLL ANIMATE
// ============================================================================

export interface ScrollAnimateProps {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  description?: string;
  richContent?: string;
  animation?:
    | "fade-up"
    | "fade-down"
    | "fade-left"
    | "fade-right"
    | "zoom-in"
    | "zoom-out"
    | "flip-up"
    | "flip-down"
    | "flip-left"
    | "flip-right"
    | "bounce-in"
    | "rotate-in"
    | "slide-up"
    | "slide-down"
    | "scale-up"
    | "reveal"
    | "custom";
  customAnimation?: string;
  duration?: number;
  delay?: number;
  easing?:
    | "ease"
    | "ease-in"
    | "ease-out"
    | "ease-in-out"
    | "linear"
    | "spring"
    | "bounce";
  threshold?: number;
  triggerOnce?: boolean;
  triggerMargin?: string;
  triggerPosition?: "top" | "center" | "bottom";
  stagger?: boolean;
  staggerDelay?: number;
  staggerDirection?: "forward" | "reverse" | "center";
  staggerFrom?: "first" | "last" | "center" | "random";
  translateX?: number;
  translateY?: number;
  scale?: number;
  rotate?: number;
  skew?: number;
  backgroundColor?: string;
  textColor?: string;
  padding?: ResponsiveValue<"none" | "xs" | "sm" | "md" | "lg">;
  borderRadius?: ResponsiveValue<"none" | "sm" | "md" | "lg" | "xl" | "2xl">;
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
  progressBased?: boolean;
  progressStart?: number;
  progressEnd?: number;
  progressProperty?: "opacity" | "scale" | "translateY" | "rotate";
  parallax?: boolean;
  parallaxSpeed?: number;
  parallaxDirection?: "vertical" | "horizontal";
  blur?: number;
  opacity?: number;
  scaleStart?: number;
  rotateStart?: number;
  showCounter?: boolean;
  counterStart?: number;
  counterEnd?: number;
  counterDuration?: number;
  counterSuffix?: string;
  hideOnMobile?: boolean;
  mobileAnimation?: "same" | "fade" | "none";
  reducedMotionAnimation?: "fade" | "none";
  ariaLabel?: string;
  reducedMotion?: boolean;
  id?: string;
  className?: string;
}

export function ScrollAnimateRender({
  animation = "fade-up",
  customAnimation,
  delay = 0,
  duration = 600,
  easing = "ease-out",
  threshold = 0.1,
  triggerOnce = true,
  triggerMargin,
  triggerPosition = "bottom",
  stagger = false,
  staggerDelay = 100,
  staggerDirection = "forward",
  staggerFrom = "first",
  translateX = 0,
  translateY = 50,
  scale = 1,
  rotate = 0,
  skew = 0,
  title = "Scroll Animation",
  subtitle,
  description = "This content animates when you scroll",
  richContent,
  backgroundColor = "#f8fafc",
  textColor,
  padding = "lg",
  borderRadius = "none",
  shadow = "none",
  progressBased = false,
  progressStart = 0,
  progressEnd = 1,
  progressProperty = "opacity",
  parallax = false,
  parallaxSpeed = 0.3,
  parallaxDirection = "vertical",
  blur = 0,
  opacity = 0,
  scaleStart = 1,
  rotateStart = 0,
  showCounter = false,
  counterStart = 0,
  counterEnd = 100,
  counterDuration = 2000,
  counterSuffix,
  hideOnMobile = false,
  mobileAnimation = "same",
  reducedMotionAnimation = "fade",
  ariaLabel,
  reducedMotion = true,
  children,
  id,
  className = "",
}: ScrollAnimateProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = React.useState(false);
  const [hasAnimated, setHasAnimated] = React.useState(false);
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const [counterValue, setCounterValue] = React.useState(counterStart);
  const prefersReduced = React.useRef(false);
  const isMobile = React.useRef(false);

  React.useEffect(() => {
    isMobile.current = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (reducedMotion) {
      prefersReduced.current = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
    }
  }, [reducedMotion]);

  const paddingClasses = getResponsiveClasses(padding, paddingYMap);
  const radiusClasses = getResponsiveClasses(borderRadius, borderRadiusMap);
  const scrollDark = isDarkBackground(backgroundColor);
  const resolvedTextColor = resolveContrastColor(textColor || (scrollDark ? "#f8fafc" : "#1f2937"), scrollDark);
  const shadowMap: Record<string, string> = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
  };

  const easingMap: Record<string, string> = {
    ease: "ease",
    "ease-in": "ease-in",
    "ease-out": "ease-out",
    "ease-in-out": "ease-in-out",
    linear: "linear",
    spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  };

  // Build animation configs including new types
  const animations: Record<
    string,
    { initial: React.CSSProperties; animate: React.CSSProperties }
  > = {
    "fade-up": {
      initial: { opacity: opacity, transform: `translateY(${translateY}px)` },
      animate: { opacity: 1, transform: "translateY(0)" },
    },
    "fade-down": {
      initial: { opacity: opacity, transform: `translateY(-${translateY}px)` },
      animate: { opacity: 1, transform: "translateY(0)" },
    },
    "fade-left": {
      initial: {
        opacity: opacity,
        transform: `translateX(${translateX || 40}px)`,
      },
      animate: { opacity: 1, transform: "translateX(0)" },
    },
    "fade-right": {
      initial: {
        opacity: opacity,
        transform: `translateX(-${translateX || 40}px)`,
      },
      animate: { opacity: 1, transform: "translateX(0)" },
    },
    "zoom-in": {
      initial: { opacity: opacity, transform: `scale(${scaleStart || 0.8})` },
      animate: { opacity: 1, transform: "scale(1)" },
    },
    "zoom-out": {
      initial: { opacity: opacity, transform: "scale(1.2)" },
      animate: { opacity: 1, transform: "scale(1)" },
    },
    "flip-up": {
      initial: {
        opacity: opacity,
        transform: `perspective(1000px) rotateX(${rotateStart || -90}deg)`,
      },
      animate: { opacity: 1, transform: "perspective(1000px) rotateX(0)" },
    },
    "flip-down": {
      initial: {
        opacity: opacity,
        transform: `perspective(1000px) rotateX(${rotateStart || 90}deg)`,
      },
      animate: { opacity: 1, transform: "perspective(1000px) rotateX(0)" },
    },
    "flip-left": {
      initial: {
        opacity: opacity,
        transform: `perspective(1000px) rotateY(${rotateStart || 90}deg)`,
      },
      animate: { opacity: 1, transform: "perspective(1000px) rotateY(0)" },
    },
    "flip-right": {
      initial: {
        opacity: opacity,
        transform: `perspective(1000px) rotateY(${rotateStart || -90}deg)`,
      },
      animate: { opacity: 1, transform: "perspective(1000px) rotateY(0)" },
    },
    "bounce-in": {
      initial: { opacity: opacity, transform: "scale(0.3)" },
      animate: { opacity: 1, transform: "scale(1)" },
    },
    "rotate-in": {
      initial: {
        opacity: opacity,
        transform: `rotate(${rotateStart || -180}deg) scale(${scaleStart || 0})`,
      },
      animate: { opacity: 1, transform: "rotate(0) scale(1)" },
    },
    "slide-up": {
      initial: { transform: `translateY(${translateY || 100}px)` },
      animate: { transform: "translateY(0)" },
    },
    "slide-down": {
      initial: { transform: `translateY(-${translateY || 100}px)` },
      animate: { transform: "translateY(0)" },
    },
    "scale-up": {
      initial: { opacity: opacity, transform: `scale(${scaleStart || 0.5})` },
      animate: { opacity: 1, transform: `scale(${scale})` },
    },
    reveal: {
      initial: { clipPath: "inset(0 0 100% 0)" },
      animate: { clipPath: "inset(0 0 0% 0)" },
    },
    custom: customAnimation
      ? {
          initial: { opacity: opacity, transform: customAnimation },
          animate: { opacity: 1, transform: "none" },
        }
      : {
          initial: { opacity: opacity },
          animate: { opacity: 1 },
        },
  };

  // Pick effective animation for mobile/reduced motion
  let effectiveAnimation = animation;
  if (prefersReduced.current) {
    effectiveAnimation =
      reducedMotionAnimation === "fade" ? "fade-up" : "fade-up";
  } else if (isMobile.current && mobileAnimation !== "same") {
    effectiveAnimation = mobileAnimation === "fade" ? "fade-up" : "fade-up";
  }

  const config = animations[effectiveAnimation] || animations["fade-up"];

  // Add blur to initial state
  const initialWithBlur: React.CSSProperties = {
    ...config.initial,
    ...(blur > 0 ? { filter: `blur(${blur}px)` } : {}),
    ...(skew !== 0
      ? { transform: `${config.initial.transform || ""} skew(${skew}deg)` }
      : {}),
  };
  const animateWithBlur: React.CSSProperties = {
    ...config.animate,
    ...(blur > 0 ? { filter: "blur(0px)" } : {}),
    ...(skew !== 0
      ? { transform: `${config.animate.transform || ""} skew(0deg)` }
      : {}),
  };

  // Intersection observer
  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Reduced motion: none means show immediately
    if (prefersReduced.current && reducedMotionAnimation === "none") {
      setIsVisible(true);
      setHasAnimated(true);
      return;
    }

    const rootMargin =
      triggerMargin ||
      (triggerPosition === "top"
        ? "-20% 0px 0px 0px"
        : triggerPosition === "center"
          ? "-40% 0px -40% 0px"
          : "0px");

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            setHasAnimated(true);
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [
    threshold,
    triggerOnce,
    triggerMargin,
    triggerPosition,
    reducedMotionAnimation,
  ]);

  // Scroll progress tracking
  React.useEffect(() => {
    if (!progressBased && !parallax) return;
    const element = ref.current;
    if (!element) return;

    const handleScroll = () => {
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const progress = Math.max(0, Math.min(1, 1 - rect.top / windowHeight));
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [progressBased, parallax]);

  // Counter animation
  React.useEffect(() => {
    if (!showCounter || !isVisible) return;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / counterDuration);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCounterValue(
        Math.round(counterStart + (counterEnd - counterStart) * eased),
      );
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [showCounter, isVisible, counterStart, counterEnd, counterDuration]);

  const shouldAnimate = isVisible && (!triggerOnce || !hasAnimated);

  // Progress-based styles
  const progressStyle: React.CSSProperties = progressBased
    ? (() => {
        const p = Math.max(
          progressStart,
          Math.min(progressEnd, scrollProgress),
        );
        const norm = (p - progressStart) / (progressEnd - progressStart);
        if (progressProperty === "opacity") return { opacity: norm };
        if (progressProperty === "scale")
          return { transform: `scale(${0.5 + norm * 0.5})` };
        if (progressProperty === "translateY")
          return { transform: `translateY(${(1 - norm) * 100}px)` };
        if (progressProperty === "rotate")
          return { transform: `rotate(${(1 - norm) * 180}deg)` };
        return {};
      })()
    : {};

  // Parallax style
  const parallaxStyle: React.CSSProperties = parallax
    ? {
        transform:
          parallaxDirection === "horizontal"
            ? `translateX(${scrollProgress * parallaxSpeed * 100}px)`
            : `translateY(${scrollProgress * parallaxSpeed * -100}px)`,
      }
    : {};

  return (
    <div
      id={id}
      ref={ref}
      className={`${paddingClasses} ${radiusClasses} ${shadowMap[shadow] || ""} ${hideOnMobile ? "hidden md:block" : ""} ${className}`}
      style={{
        backgroundColor,
        ...(resolvedTextColor ? { color: resolvedTextColor } : {}),
        ...(progressBased
          ? progressStyle
          : {
              ...initialWithBlur,
              ...(shouldAnimate ? animateWithBlur : {}),
              transition:
                prefersReduced.current && reducedMotionAnimation === "none"
                  ? "none"
                  : `all ${duration}ms ${easingMap[easing] || "ease-out"} ${delay}ms`,
            }),
        ...parallaxStyle,
      }}
      role={ariaLabel ? "region" : undefined}
      aria-label={ariaLabel}
    >
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      {subtitle && (
        <p className="text-sm font-medium opacity-90 mb-1">{subtitle}</p>
      )}
      <p
        className="text-sm"
        style={{ color: resolvedTextColor || "var(--color-muted-foreground, #4b5563)" }}
      >
        {description}
      </p>
      {richContent && (
        <div
          className="mt-2 text-sm"
          dangerouslySetInnerHTML={{ __html: richContent }}
        />
      )}
      {showCounter && isVisible && (
        <div className="mt-3 text-3xl font-bold">
          {counterValue}
          {counterSuffix}
        </div>
      )}
      {children}
    </div>
  );
}

// ============================================================================
// BLOG PREVIEW - Blog Post Cards
// ============================================================================

export interface BlogPost {
  title?: string;
  excerpt?: string;
  image?: string | ImageValue;
  author?: string;
  authorAvatar?: string | ImageValue;
  date?: string;
  category?: string;
  readTime?: string;
  link?: string;
}

export interface BlogPreviewProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  headerAlign?: "left" | "center" | "right";
  posts?: BlogPost[];
  variant?: "grid" | "list" | "featured" | "cards";
  columns?: 2 | 3 | 4;
  showAuthor?: boolean;
  showDate?: boolean;
  showCategory?: boolean;
  showReadTime?: boolean;
  showExcerpt?: boolean;
  imageAspectRatio?: "video" | "square" | "wide";
  imageRounded?: "none" | "sm" | "md" | "lg" | "xl";
  cardBorderRadius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  cardShadow?: "none" | "sm" | "md" | "lg";
  cardBorderColor?: string;
  backgroundColor?: string;
  cardBackgroundColor?: string;
  categoryColor?: string;
  titleColor?: string;
  excerptColor?: string;
  metaColor?: string;
  ctaText?: string;
  ctaLink?: string;
  ctaColor?: string;
  paddingY?: "sm" | "md" | "lg" | "xl";
  paddingX?: "sm" | "md" | "lg" | "xl";
  id?: string;
  className?: string;
}

export function BlogPreviewRender({
  title = "Latest Posts",
  subtitle,
  badge,
  badgeColor,
  headerAlign = "center",
  posts = [],
  variant = "grid",
  columns = 3,
  showAuthor = true,
  showDate = true,
  showCategory = true,
  showReadTime = false,
  showExcerpt = true,
  imageAspectRatio = "video",
  imageRounded = "lg",
  cardBorderRadius = "xl",
  cardShadow = "md",
  cardBorderColor,
  backgroundColor,
  cardBackgroundColor,
  categoryColor,
  titleColor,
  excerptColor,
  metaColor,
  ctaText,
  ctaLink,
  ctaColor,
  paddingY = "lg",
  paddingX = "md",
  id,
  className = "",
}: BlogPreviewProps) {
  const dark = isDarkBackground(backgroundColor);
  const resolvedTitleColor = titleColor || (dark ? "#f8fafc" : "#111827");
  const resolvedExcerptColor = excerptColor || (dark ? "#94a3b8" : "#6b7280");
  const resolvedMetaColor = metaColor || (dark ? "#64748b" : "#9ca3af");
  const resolvedCategoryColor =
    categoryColor || (dark ? "#e5a956" : "var(--brand-primary, #3b82f6)");
  const resolvedBadgeColor = badgeColor || resolvedCategoryColor;
  const resolvedCardBg = cardBackgroundColor || (dark ? "#1e293b" : "#ffffff");
  const resolvedCardBorder = cardBorderColor || (dark ? "#334155" : "#e5e7eb");
  const resolvedCtaColor = ctaColor || resolvedCategoryColor;

  const pyClasses = paddingYMapUtil[paddingY] || paddingYMapUtil.lg;
  const pxClasses = paddingXMapUtil[paddingX] || paddingXMapUtil.md;
  const cardRadiusClasses =
    borderRadiusMapUtil[cardBorderRadius]?.mobile || "rounded-xl";
  const cardShadowClasses =
    (shadowMapUtil as Record<string, string>)[cardShadow] || "shadow-md";
  const imageRadiusClasses =
    borderRadiusMapUtil[imageRounded]?.mobile || "rounded-lg";

  const aspectClasses = {
    video: "aspect-video",
    square: "aspect-square",
    wide: "aspect-[21/9]",
  }[imageAspectRatio];

  const colClasses = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-2 lg:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  }[columns];

  const alignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[headerAlign];

  const renderPostCard = (post: BlogPost, index: number) => {
    const imgUrl = getImageUrl(post.image);
    const avatarUrl = getImageUrl(post.authorAvatar);

    const card = (
      <article
        key={index}
        className={`group overflow-hidden ${cardRadiusClasses} ${cardShadowClasses} hover:shadow-lg transition-shadow duration-300`}
        style={{
          backgroundColor: resolvedCardBg,
          border: `1px solid ${resolvedCardBorder}`,
        }}
      >
        {/* Image */}
        {imgUrl && (
          <div className={`${aspectClasses} overflow-hidden`}>
            <img
              src={imgUrl}
              alt={post.title || "Blog post"}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-5 md:p-6">
          {/* Category */}
          {showCategory && post.category && (
            <span
              className="inline-block text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: resolvedCategoryColor }}
            >
              {post.category}
            </span>
          )}

          {/* Title */}
          {post.title && (
            <h3
              className="text-lg md:text-xl font-bold mb-2 line-clamp-2 group-hover:opacity-80 transition-opacity"
              style={{ color: resolvedTitleColor }}
            >
              {post.title}
            </h3>
          )}

          {/* Excerpt */}
          {showExcerpt && post.excerpt && (
            <p
              className="text-sm md:text-base mb-4 line-clamp-3"
              style={{ color: resolvedExcerptColor }}
            >
              {post.excerpt}
            </p>
          )}

          {/* Meta */}
          <div
            className="flex items-center gap-3 text-sm"
            style={{ color: resolvedMetaColor }}
          >
            {showAuthor && post.author && (
              <div className="flex items-center gap-2">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={post.author}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
                    style={{ backgroundColor: resolvedCategoryColor }}
                  >
                    {post.author.charAt(0).toUpperCase()}
                  </div>
                )}
                <span>{post.author}</span>
              </div>
            )}
            {showDate && post.date && (
              <>
                {showAuthor && post.author && <span>·</span>}
                <span>{post.date}</span>
              </>
            )}
            {showReadTime && post.readTime && (
              <>
                <span>·</span>
                <span>{post.readTime}</span>
              </>
            )}
          </div>
        </div>
      </article>
    );

    if (post.link) {
      return (
        <a key={index} href={post.link} className="block no-underline">
          {card}
        </a>
      );
    }
    return card;
  };

  const renderListPost = (post: BlogPost, index: number) => {
    const imgUrl = getImageUrl(post.image);
    const avatarUrl = getImageUrl(post.authorAvatar);

    const item = (
      <article
        key={index}
        className="group flex gap-5 md:gap-6 py-5 border-b last:border-b-0"
        style={{ borderColor: resolvedCardBorder }}
      >
        {imgUrl && (
          <div
            className={`flex-shrink-0 w-32 md:w-48 ${aspectClasses} ${imageRadiusClasses} overflow-hidden`}
          >
            <img
              src={imgUrl}
              alt={post.title || "Blog post"}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {showCategory && post.category && (
            <span
              className="inline-block text-xs font-semibold uppercase tracking-wide mb-1"
              style={{ color: resolvedCategoryColor }}
            >
              {post.category}
            </span>
          )}
          {post.title && (
            <h3
              className="text-base md:text-lg font-bold mb-1 line-clamp-2 group-hover:opacity-80 transition-opacity"
              style={{ color: resolvedTitleColor }}
            >
              {post.title}
            </h3>
          )}
          {showExcerpt && post.excerpt && (
            <p
              className="text-sm mb-2 line-clamp-2 hidden md:block"
              style={{ color: resolvedExcerptColor }}
            >
              {post.excerpt}
            </p>
          )}
          <div
            className="flex items-center gap-2 text-xs md:text-sm"
            style={{ color: resolvedMetaColor }}
          >
            {showAuthor && post.author && (
              <div className="flex items-center gap-1.5">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={post.author}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : null}
                <span>{post.author}</span>
              </div>
            )}
            {showDate && post.date && (
              <>
                {showAuthor && post.author && <span>·</span>}
                <span>{post.date}</span>
              </>
            )}
            {showReadTime && post.readTime && (
              <>
                <span>·</span>
                <span>{post.readTime}</span>
              </>
            )}
          </div>
        </div>
      </article>
    );

    if (post.link) {
      return (
        <a key={index} href={post.link} className="block no-underline">
          {item}
        </a>
      );
    }
    return item;
  };

  const renderFeatured = () => {
    if (posts.length === 0) return null;
    const [featured, ...rest] = posts;
    const featuredImgUrl = getImageUrl(featured.image);

    return (
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Featured Post */}
        <article
          className={`group overflow-hidden ${cardRadiusClasses} ${cardShadowClasses}`}
          style={{
            backgroundColor: resolvedCardBg,
            border: `1px solid ${resolvedCardBorder}`,
          }}
        >
          {featuredImgUrl && (
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src={featuredImgUrl}
                alt={featured.title || "Featured post"}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            </div>
          )}
          <div className="p-6 md:p-8">
            {showCategory && featured.category && (
              <span
                className="inline-block text-xs font-semibold uppercase tracking-wide mb-3"
                style={{ color: resolvedCategoryColor }}
              >
                {featured.category}
              </span>
            )}
            {featured.title && (
              <h3
                className="text-xl md:text-2xl font-bold mb-3"
                style={{ color: resolvedTitleColor }}
              >
                {featured.title}
              </h3>
            )}
            {showExcerpt && featured.excerpt && (
              <p
                className="text-base mb-4 line-clamp-3"
                style={{ color: resolvedExcerptColor }}
              >
                {featured.excerpt}
              </p>
            )}
            <div
              className="flex items-center gap-3 text-sm"
              style={{ color: resolvedMetaColor }}
            >
              {showAuthor && featured.author && <span>{featured.author}</span>}
              {showDate && featured.date && (
                <>
                  {showAuthor && featured.author && <span>·</span>}
                  <span>{featured.date}</span>
                </>
              )}
            </div>
          </div>
        </article>

        {/* Side Posts */}
        <div className="space-y-4">
          {rest.slice(0, 3).map((post, i) => renderListPost(post, i))}
        </div>
      </div>
    );
  };

  return (
    <section
      id={id}
      className={`w-full ${pyClasses} ${pxClasses} ${className}`}
      style={{ backgroundColor: backgroundColor || undefined }}
    >
      <div className="max-w-screen-xl mx-auto">
        {/* Header */}
        {(title || subtitle || badge) && (
          <div className={`${alignClasses} mb-10 md:mb-14`}>
            {badge && (
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-xs md:text-sm font-medium mb-4"
                style={{
                  backgroundColor: `${resolvedBadgeColor}20`,
                  color: resolvedBadgeColor,
                }}
              >
                {badge}
              </span>
            )}
            {title && (
              <h2
                className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3"
                style={{ color: resolvedTitleColor }}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p
                className="text-base md:text-lg opacity-80 max-w-2xl"
                style={{
                  color: resolvedExcerptColor,
                  ...(headerAlign === "center" ? { margin: "0 auto" } : {}),
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Posts */}
        {variant === "featured" ? (
          renderFeatured()
        ) : variant === "list" ? (
          <div
            className="max-w-3xl mx-auto divide-y"
            style={{ borderColor: resolvedCardBorder }}
          >
            {posts.map((post, i) => renderListPost(post, i))}
          </div>
        ) : (
          <div className={`grid gap-6 md:gap-8 ${colClasses}`}>
            {posts.map((post, i) => renderPostCard(post, i))}
          </div>
        )}

        {/* CTA */}
        {ctaText && (
          <div
            className={`${headerAlign === "center" ? "text-center" : alignClasses} mt-10 md:mt-14`}
          >
            <a
              href={ctaLink || "#"}
              className="inline-flex items-center gap-2 text-base font-semibold hover:opacity-80 transition-opacity"
              style={{ color: resolvedCtaColor }}
            >
              {ctaText}
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
