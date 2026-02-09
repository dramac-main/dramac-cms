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
import { getImageUrl, getImageAlt, type ImageValue } from "@/lib/studio/utils/image-helpers";

// ============================================================================
// RESPONSIVE UTILITIES
// ============================================================================

type ResponsiveValue<T> = T | { mobile?: T; tablet?: T; desktop?: T };

type ClassMapValue = { mobile: string; tablet: string; desktop: string } | [string, string, string];

function getResponsiveClasses<T extends string | number>(
  prop: ResponsiveValue<T> | undefined,
  classMap: Record<string, ClassMapValue>
): string {
  if (!prop) return "";
  
  const getClassFromMapping = (mapping: ClassMapValue, breakpoint: "mobile" | "tablet" | "desktop"): string => {
    if (Array.isArray(mapping)) {
      return breakpoint === "mobile" ? mapping[0] : breakpoint === "tablet" ? mapping[1] : mapping[2];
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
const paddingYMap: Record<string, { mobile: string; tablet: string; desktop: string }> = {
  none: { mobile: "py-0", tablet: "md:py-0", desktop: "lg:py-0" },
  xs: { mobile: "py-2", tablet: "md:py-3", desktop: "lg:py-4" },
  sm: { mobile: "py-4", tablet: "md:py-6", desktop: "lg:py-8" },
  md: { mobile: "py-8", tablet: "md:py-12", desktop: "lg:py-16" },
  lg: { mobile: "py-12", tablet: "md:py-16", desktop: "lg:py-24" },
  xl: { mobile: "py-16", tablet: "md:py-24", desktop: "lg:py-32" },
};

const paddingXMap: Record<string, { mobile: string; tablet: string; desktop: string }> = {
  none: { mobile: "px-0", tablet: "md:px-0", desktop: "lg:px-0" },
  xs: { mobile: "px-2", tablet: "md:px-3", desktop: "lg:px-4" },
  sm: { mobile: "px-4", tablet: "md:px-6", desktop: "lg:px-8" },
  md: { mobile: "px-4", tablet: "md:px-8", desktop: "lg:px-12" },
  lg: { mobile: "px-6", tablet: "md:px-10", desktop: "lg:px-16" },
};

const gapMap: Record<string, { mobile: string; tablet: string; desktop: string }> = {
  none: { mobile: "gap-0", tablet: "md:gap-0", desktop: "lg:gap-0" },
  xs: { mobile: "gap-1", tablet: "md:gap-2", desktop: "lg:gap-2" },
  sm: { mobile: "gap-2", tablet: "md:gap-3", desktop: "lg:gap-4" },
  md: { mobile: "gap-4", tablet: "md:gap-6", desktop: "lg:gap-8" },
  lg: { mobile: "gap-6", tablet: "md:gap-8", desktop: "lg:gap-12" },
  xl: { mobile: "gap-8", tablet: "md:gap-12", desktop: "lg:gap-16" },
};

const borderRadiusMap: Record<string, { mobile: string; tablet: string; desktop: string }> = {
  none: { mobile: "rounded-none", tablet: "md:rounded-none", desktop: "lg:rounded-none" },
  sm: { mobile: "rounded-sm", tablet: "md:rounded-sm", desktop: "lg:rounded-sm" },
  md: { mobile: "rounded-md", tablet: "md:rounded-md", desktop: "lg:rounded-md" },
  lg: { mobile: "rounded-lg", tablet: "md:rounded-lg", desktop: "lg:rounded-lg" },
  xl: { mobile: "rounded-xl", tablet: "md:rounded-xl", desktop: "lg:rounded-xl" },
  "2xl": { mobile: "rounded-2xl", tablet: "md:rounded-2xl", desktop: "lg:rounded-2xl" },
  full: { mobile: "rounded-full", tablet: "md:rounded-full", desktop: "lg:rounded-full" },
};

// ============================================================================
// SECTION - Full-width section with all options
// ============================================================================

export interface SectionProps {
  children?: React.ReactNode;
  backgroundColor?: string;
  backgroundImage?: string | ImageValue;
  backgroundPosition?: "center" | "top" | "bottom" | "left" | "right";
  backgroundSize?: "cover" | "contain" | "auto";
  backgroundOverlay?: string;
  backgroundOverlayOpacity?: number;
  paddingY?: ResponsiveValue<"none" | "xs" | "sm" | "md" | "lg" | "xl">;
  paddingX?: ResponsiveValue<"none" | "xs" | "sm" | "md" | "lg">;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full" | "none";
  minHeight?: string;
  fullHeight?: boolean;
  contentAlign?: "left" | "center" | "right";
  verticalAlign?: "top" | "center" | "bottom";
  borderTop?: boolean;
  borderBottom?: boolean;
  borderColor?: string;
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  hideOnDesktop?: boolean;
  id?: string;
  className?: string;
}

export function SectionRender({
  children,
  backgroundColor,
  backgroundImage,
  backgroundPosition = "center",
  backgroundSize = "cover",
  backgroundOverlay,
  backgroundOverlayOpacity = 50,
  paddingY = "md",
  paddingX = "sm",
  maxWidth = "xl",
  minHeight,
  fullHeight = false,
  contentAlign = "left",
  verticalAlign = "top",
  borderTop = false,
  borderBottom = false,
  borderColor = "#e5e7eb",
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

  const maxWClass = {
    sm: "max-w-screen-sm",
    md: "max-w-screen-md",
    lg: "max-w-screen-lg",
    xl: "max-w-screen-xl",
    "2xl": "max-w-screen-2xl",
    full: "max-w-full",
    none: "max-w-none",
  }[maxWidth];

  const vAlignClass = { top: "justify-start", center: "justify-center", bottom: "justify-end" }[verticalAlign];
  const cAlignClass = { left: "items-start text-left", center: "items-center text-center", right: "items-end text-right" }[contentAlign];

  const visibility = [
    hideOnMobile ? "hidden md:block" : "",
    hideOnTablet ? "md:hidden lg:block" : "",
    hideOnDesktop ? "lg:hidden" : "",
  ].filter(Boolean).join(" ");

  return (
    <section
      id={id}
      className={`relative w-full ${pyClasses} ${fullHeight ? "min-h-screen flex flex-col " + vAlignClass : ""} ${visibility} ${borderTop ? "border-t" : ""} ${borderBottom ? "border-b" : ""} ${className}`}
      style={{
        backgroundColor: backgroundOverlay ? undefined : backgroundColor,
        backgroundImage: bgImageUrl ? `url(${bgImageUrl})` : undefined,
        backgroundPosition,
        backgroundSize,
        minHeight: fullHeight ? "100vh" : minHeight,
        borderColor: borderTop || borderBottom ? borderColor : undefined,
      }}
    >
      {backgroundOverlay && (
        <div className="absolute inset-0 z-0" style={{ backgroundColor: backgroundOverlay, opacity: backgroundOverlayOpacity / 100 }} aria-hidden="true" />
      )}
      <div className={`relative z-10 w-full mx-auto ${pxClasses} ${maxWClass} flex flex-col ${cAlignClass}`}>
        {children}
      </div>
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
  borderRadius?: ResponsiveValue<"none" | "sm" | "md" | "lg" | "xl" | "2xl">;
  border?: boolean;
  borderColor?: string;
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
  id?: string;
  className?: string;
}

export function ContainerRender({
  children,
  maxWidth = "xl",
  paddingX = "sm",
  paddingY,
  backgroundColor,
  borderRadius = "none",
  border = false,
  borderColor = "#e5e7eb",
  shadow = "none",
  id,
  className = "",
}: ContainerProps) {
  const maxWClass = { xs: "max-w-xs", sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg", xl: "max-w-screen-xl", "2xl": "max-w-screen-2xl", full: "max-w-full", prose: "max-w-prose" }[maxWidth];
  const pxClasses = getResponsiveClasses(paddingX, paddingXMap);
  const pyClasses = paddingY ? getResponsiveClasses(paddingY, paddingYMap) : "";
  const radiusClasses = getResponsiveClasses(borderRadius, borderRadiusMap);
  const shadowClass = { none: "", sm: "shadow-sm", md: "shadow-md", lg: "shadow-lg", xl: "shadow-xl" }[shadow];

  return (
    <div
      id={id}
      className={`w-full mx-auto ${maxWClass} ${pxClasses} ${pyClasses} ${radiusClasses} ${shadowClass} ${border ? "border" : ""} ${className}`}
      style={{ backgroundColor, borderColor: border ? borderColor : undefined }}
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
  const tabletCols = typeof columns === "object" ? columns.tablet || cols : cols;
  
  const gridColsClass = stackOnMobile
    ? `grid-cols-1 md:grid-cols-${tabletCols} lg:grid-cols-${cols}`
    : `grid-cols-${cols}`;

  const alignClass = { start: "items-start", center: "items-center", end: "items-end", stretch: "items-stretch" }[verticalAlign];

  return (
    <div
      id={id}
      className={`grid ${gridColsClass} ${gapClasses} ${alignClass} ${reverseOnMobile && stackOnMobile ? "flex flex-col-reverse md:grid" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

// ============================================================================
// CARD - Card container with shadow
// ============================================================================

export interface CardProps {
  children?: React.ReactNode;
  padding?: ResponsiveValue<"none" | "xs" | "sm" | "md" | "lg" | "xl">;
  backgroundColor?: string;
  borderRadius?: ResponsiveValue<"none" | "sm" | "md" | "lg" | "xl" | "2xl">;
  border?: boolean;
  borderColor?: string;
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
  hoverShadow?: "none" | "sm" | "md" | "lg" | "xl";
  hoverScale?: boolean;
  overflow?: "visible" | "hidden" | "auto";
  id?: string;
  className?: string;
  onClick?: () => void;
}

export function CardRender({
  children,
  padding = "md",
  backgroundColor = "#ffffff",
  borderRadius = "lg",
  border = false,
  borderColor = "#e5e7eb",
  shadow = "md",
  hoverShadow,
  hoverScale = false,
  overflow = "hidden",
  id,
  className = "",
  onClick,
}: CardProps) {
  const paddingMap: Record<string, { mobile: string; tablet: string; desktop: string }> = {
    none: { mobile: "p-0", tablet: "md:p-0", desktop: "lg:p-0" },
    xs: { mobile: "p-2", tablet: "md:p-3", desktop: "lg:p-4" },
    sm: { mobile: "p-3", tablet: "md:p-4", desktop: "lg:p-5" },
    md: { mobile: "p-4", tablet: "md:p-6", desktop: "lg:p-8" },
    lg: { mobile: "p-6", tablet: "md:p-8", desktop: "lg:p-10" },
    xl: { mobile: "p-8", tablet: "md:p-10", desktop: "lg:p-12" },
  };

  const pClasses = getResponsiveClasses(padding, paddingMap);
  const radiusClasses = getResponsiveClasses(borderRadius, borderRadiusMap);
  const shadowClass = { none: "", sm: "shadow-sm", md: "shadow-md", lg: "shadow-lg", xl: "shadow-xl" }[shadow];
  const hoverShadowClass = hoverShadow ? `hover:shadow-${hoverShadow}` : "";
  const overflowClass = { visible: "overflow-visible", hidden: "overflow-hidden", auto: "overflow-auto" }[overflow];

  return (
    <div
      id={id}
      className={`${pClasses} ${radiusClasses} ${shadowClass} ${hoverShadowClass} ${border ? "border" : ""} ${overflowClass} ${hoverScale ? "hover:scale-[1.02] transition-transform duration-200" : ""} transition-shadow ${onClick ? "cursor-pointer" : ""} ${className}`}
      style={{ backgroundColor, borderColor: border ? borderColor : undefined }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}

// ============================================================================
// SPACER - Vertical spacing
// ============================================================================

export interface SpacerProps {
  height?: number | { mobile?: number; tablet?: number; desktop?: number };
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  hideOnDesktop?: boolean;
  id?: string;
  className?: string;
}

export function SpacerRender({
  height,
  size,
  hideOnMobile = false,
  hideOnTablet = false,
  hideOnDesktop = false,
  id,
  className = "",
}: SpacerProps) {
  const sizeHeights = { xs: 8, sm: 16, md: 32, lg: 48, xl: 64, "2xl": 96 };
  const visibility = [hideOnMobile ? "hidden md:block" : "", hideOnTablet ? "md:hidden lg:block" : "", hideOnDesktop ? "lg:hidden" : ""].filter(Boolean).join(" ");

  let h = 32;
  if (size) h = sizeHeights[size];
  else if (typeof height === "number") h = height;

  return <div id={id} className={`w-full ${visibility} ${className}`} style={{ height: `${h}px` }} aria-hidden="true" />;
}

// ============================================================================
// DIVIDER - Horizontal line separator
// ============================================================================

export interface DividerProps {
  color?: string;
  thickness?: 1 | 2 | 4;
  style?: "solid" | "dashed" | "dotted";
  width?: "full" | "3/4" | "1/2" | "1/4";
  align?: "left" | "center" | "right";
  text?: string;
  textColor?: string;
  marginY?: ResponsiveValue<"none" | "xs" | "sm" | "md" | "lg" | "xl">;
  id?: string;
  className?: string;
}

export function DividerRender({
  color = "#e5e7eb",
  thickness = 1,
  style = "solid",
  width = "full",
  align = "center",
  text,
  textColor = "#6b7280",
  marginY = "md",
  id,
  className = "",
}: DividerProps) {
  const marginYMapLocal: Record<string, { mobile: string; tablet: string; desktop: string }> = {
    none: { mobile: "my-0", tablet: "md:my-0", desktop: "lg:my-0" },
    xs: { mobile: "my-2", tablet: "md:my-2", desktop: "lg:my-3" },
    sm: { mobile: "my-3", tablet: "md:my-4", desktop: "lg:my-6" },
    md: { mobile: "my-4", tablet: "md:my-6", desktop: "lg:my-8" },
    lg: { mobile: "my-6", tablet: "md:my-8", desktop: "lg:my-12" },
    xl: { mobile: "my-8", tablet: "md:my-12", desktop: "lg:my-16" },
  };

  const myClasses = getResponsiveClasses(marginY, marginYMapLocal);
  const widthClass = { full: "w-full", "3/4": "w-3/4", "1/2": "w-1/2", "1/4": "w-1/4" }[width];
  const alignClass = { left: "mr-auto", center: "mx-auto", right: "ml-auto" }[align];
  const thicknessClass = { 1: "border-t", 2: "border-t-2", 4: "border-t-4" }[thickness];
  const styleClass = { solid: "border-solid", dashed: "border-dashed", dotted: "border-dotted" }[style];

  if (text) {
    return (
      <div id={id} className={`flex items-center ${myClasses} ${widthClass} ${alignClass} ${className}`} role="separator">
        <div className={`flex-grow ${thicknessClass} ${styleClass}`} style={{ borderColor: color }} />
        <span className="px-4 text-sm font-medium" style={{ color: textColor }}>{text}</span>
        <div className={`flex-grow ${thicknessClass} ${styleClass}`} style={{ borderColor: color }} />
      </div>
    );
  }

  return <hr id={id} className={`${thicknessClass} ${styleClass} ${myClasses} ${widthClass} ${alignClass} ${className}`} style={{ borderColor: color }} role="separator" />;
}

// ============================================================================
// HEADING - Responsive heading with all options
// ============================================================================

export interface HeadingProps {
  text?: string;
  children?: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  color?: string;
  align?: ResponsiveValue<"left" | "center" | "right">;
  fontWeight?: "light" | "normal" | "medium" | "semibold" | "bold" | "extrabold";
  uppercase?: boolean;
  gradient?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
  marginBottom?: ResponsiveValue<"none" | "xs" | "sm" | "md" | "lg">;
  id?: string;
  className?: string;
}

export function HeadingRender({
  text = "Heading",
  children,
  level = 2,
  color,
  align = "left",
  fontWeight = "bold",
  uppercase = false,
  gradient = false,
  gradientFrom = "#3b82f6",
  gradientTo = "#8b5cf6",
  marginBottom = "md",
  id,
  className = "",
}: HeadingProps) {
  const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;

  const defaultSizes: Record<number, string> = {
    1: "text-3xl md:text-4xl lg:text-5xl xl:text-6xl",
    2: "text-2xl md:text-3xl lg:text-4xl",
    3: "text-xl md:text-2xl lg:text-3xl",
    4: "text-lg md:text-xl lg:text-2xl",
    5: "text-base md:text-lg lg:text-xl",
    6: "text-sm md:text-base lg:text-lg",
  };

  const alignMap: Record<string, { mobile: string; tablet: string; desktop: string }> = {
    left: { mobile: "text-left", tablet: "md:text-left", desktop: "lg:text-left" },
    center: { mobile: "text-center", tablet: "md:text-center", desktop: "lg:text-center" },
    right: { mobile: "text-right", tablet: "md:text-right", desktop: "lg:text-right" },
  };

  const marginBottomMap: Record<string, { mobile: string; tablet: string; desktop: string }> = {
    none: { mobile: "mb-0", tablet: "md:mb-0", desktop: "lg:mb-0" },
    xs: { mobile: "mb-1", tablet: "md:mb-2", desktop: "lg:mb-2" },
    sm: { mobile: "mb-2", tablet: "md:mb-3", desktop: "lg:mb-4" },
    md: { mobile: "mb-3", tablet: "md:mb-4", desktop: "lg:mb-6" },
    lg: { mobile: "mb-4", tablet: "md:mb-6", desktop: "lg:mb-8" },
  };

  const alignClasses = getResponsiveClasses(align, alignMap);
  const mbClasses = getResponsiveClasses(marginBottom, marginBottomMap);
  const weightClass = { light: "font-light", normal: "font-normal", medium: "font-medium", semibold: "font-semibold", bold: "font-bold", extrabold: "font-extrabold" }[fontWeight];

  return (
    <Tag
      id={id}
      className={`${defaultSizes[level]} ${alignClasses} ${mbClasses} ${weightClass} ${uppercase ? "uppercase tracking-wider" : ""} leading-tight ${gradient ? "bg-clip-text text-transparent" : ""} ${className}`}
      style={{
        color: gradient ? undefined : color,
        backgroundImage: gradient ? `linear-gradient(to right, ${gradientFrom}, ${gradientTo})` : undefined,
      }}
    >
      {children || text}
    </Tag>
  );
}

// ============================================================================
// TEXT - Paragraph text
// ============================================================================

export interface TextProps {
  text?: string;
  children?: React.ReactNode;
  color?: string;
  align?: ResponsiveValue<"left" | "center" | "right" | "justify">;
  alignment?: ResponsiveValue<"left" | "center" | "right" | "justify">; // Alternative name from registry
  fontSize?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "8xl";
  fontWeight?: "light" | "normal" | "medium" | "semibold" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900" | number;
  lineHeight?: "tight" | "normal" | "relaxed" | "loose" | string;
  italic?: boolean;
  underline?: boolean;
  maxWidth?: "none" | "prose" | "md" | "lg" | "xl" | string;
  marginBottom?: ResponsiveValue<"none" | "xs" | "sm" | "md" | "lg">;
  // New typography fields
  htmlTag?: "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "span" | "div";
  fontFamily?: string;
  letterSpacing?: string;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  textDecoration?: "none" | "underline" | "line-through";
  textShadow?: string;
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
  // New typography props
  htmlTag = "p",
  fontFamily,
  letterSpacing = "0",
  textTransform = "none",
  textDecoration = "none",
  textShadow,
  id,
  className = "",
}: TextProps) {
  // Use alignment if align is not provided (for backward compatibility)
  const effectiveAlign = alignment || align;
  
  const alignMap: Record<string, { mobile: string; tablet: string; desktop: string }> = {
    left: { mobile: "text-left", tablet: "md:text-left", desktop: "lg:text-left" },
    center: { mobile: "text-center", tablet: "md:text-center", desktop: "lg:text-center" },
    right: { mobile: "text-right", tablet: "md:text-right", desktop: "lg:text-right" },
    justify: { mobile: "text-justify", tablet: "md:text-justify", desktop: "lg:text-justify" },
  };

  const marginBottomMap: Record<string, { mobile: string; tablet: string; desktop: string }> = {
    none: { mobile: "mb-0", tablet: "md:mb-0", desktop: "lg:mb-0" },
    xs: { mobile: "mb-1", tablet: "md:mb-1", desktop: "lg:mb-2" },
    sm: { mobile: "mb-2", tablet: "md:mb-2", desktop: "lg:mb-3" },
    md: { mobile: "mb-3", tablet: "md:mb-4", desktop: "lg:mb-4" },
    lg: { mobile: "mb-4", tablet: "md:mb-5", desktop: "lg:mb-6" },
  };

  const alignClasses = getResponsiveClasses(effectiveAlign, alignMap);
  const mbClasses = getResponsiveClasses(marginBottom, marginBottomMap);
  
  // Font size mapping - supports both old preset values and new values
  const fontSizeMap: Record<string, string> = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
    "3xl": "text-3xl",
    "4xl": "text-4xl",
    "5xl": "text-5xl",
    "6xl": "text-6xl",
    "7xl": "text-7xl",
    "8xl": "text-8xl",
    "9xl": "text-9xl",
  };
  const sizeClass = fontSizeMap[fontSize] || "text-base";
  
  // Font weight mapping - supports both string names and numeric values
  const fontWeightMap: Record<string, string> = {
    light: "font-light",
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
    "100": "font-thin",
    "200": "font-extralight",
    "300": "font-light",
    "400": "font-normal",
    "500": "font-medium",
    "600": "font-semibold",
    "700": "font-bold",
    "800": "font-extrabold",
    "900": "font-black",
  };
  const weightClass = fontWeightMap[String(fontWeight)] || "font-normal";
  
  // Line height mapping
  const lineHeightMap: Record<string, string> = {
    tight: "leading-tight",
    normal: "leading-normal",
    relaxed: "leading-relaxed",
    loose: "leading-loose",
    "1": "leading-none",
    "1.25": "leading-tight",
    "1.375": "leading-snug",
    "1.5": "leading-normal",
    "1.625": "leading-relaxed",
    "2": "leading-loose",
  };
  const leadingClass = lineHeightMap[String(lineHeight)] || "leading-normal";
  
  // Max width - support both preset values and custom values
  const maxWidthMap: Record<string, string> = {
    none: "",
    prose: "max-w-prose",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };
  const maxWClass = maxWidthMap[maxWidth] || "";
  
  // Text transform classes
  const textTransformClass = textTransform !== "none" ? `${textTransform}` : "";
  
  // Text decoration (replaces underline prop)
  const textDecorationClass = textDecoration !== "none" ? textDecoration : (underline ? "underline" : "");
  
  // Dynamic styles
  const style: React.CSSProperties = {
    color,
    fontFamily: fontFamily || undefined,
    letterSpacing: letterSpacing !== "0" ? letterSpacing : undefined,
    textTransform: textTransform !== "none" ? textTransform : undefined,
    textShadow: textShadow || undefined,
    maxWidth: !maxWidthMap[maxWidth] && maxWidth !== "none" ? maxWidth : undefined,
  };
  
  // Valid HTML tags for text content
  const validTags = ["p", "span", "div", "h1", "h2", "h3", "h4", "h5", "h6"] as const;
  type ValidTag = typeof validTags[number];
  const tag: ValidTag = validTags.includes(htmlTag as ValidTag) ? (htmlTag as ValidTag) : "p";
  
  const baseClassName = `${sizeClass} ${alignClasses} ${mbClasses} ${weightClass} ${leadingClass} ${maxWClass} ${italic ? "italic" : ""} ${textDecorationClass} ${textTransformClass} ${className}`.trim().replace(/\s+/g, ' ');
  
  // Render based on tag type
  switch (tag) {
    case "h1":
      return <h1 id={id} className={baseClassName} style={style}>{children || text}</h1>;
    case "h2":
      return <h2 id={id} className={baseClassName} style={style}>{children || text}</h2>;
    case "h3":
      return <h3 id={id} className={baseClassName} style={style}>{children || text}</h3>;
    case "h4":
      return <h4 id={id} className={baseClassName} style={style}>{children || text}</h4>;
    case "h5":
      return <h5 id={id} className={baseClassName} style={style}>{children || text}</h5>;
    case "h6":
      return <h6 id={id} className={baseClassName} style={style}>{children || text}</h6>;
    case "span":
      return <span id={id} className={baseClassName} style={style}>{children || text}</span>;
    case "div":
      return <div id={id} className={baseClassName} style={style}>{children || text}</div>;
    default:
      return <p id={id} className={baseClassName} style={style}>{children || text}</p>;
  }
}

// ============================================================================
// RICH TEXT - HTML content
// ============================================================================

export interface RichTextProps {
  content?: string;
  color?: string;
  proseSize?: "sm" | "base" | "lg" | "xl";
  maxWidth?: "none" | "prose" | "md" | "lg" | "xl";
  id?: string;
  className?: string;
}

export function RichTextRender({
  content = "<p>Rich text content</p>",
  color,
  proseSize = "base",
  maxWidth = "prose",
  id,
  className = "",
}: RichTextProps) {
  const proseSizeClass = { sm: "prose-sm", base: "prose", lg: "prose-lg", xl: "prose-xl" }[proseSize];
  const maxWClass = { none: "max-w-none", prose: "max-w-prose", md: "max-w-md", lg: "max-w-lg", xl: "max-w-xl" }[maxWidth];

  return <div id={id} className={`${proseSizeClass} ${maxWClass} ${className}`} style={{ color }} dangerouslySetInnerHTML={{ __html: content }} />;
}

// ============================================================================
// QUOTE - Blockquote with author
// ============================================================================

export interface QuoteProps {
  text?: string;
  author?: string;
  authorTitle?: string;
  authorImage?: string | ImageValue;
  borderColor?: string;
  backgroundColor?: string;
  textColor?: string;
  variant?: "simple" | "bordered" | "card" | "modern";
  size?: "sm" | "md" | "lg";
  id?: string;
  className?: string;
}

export function QuoteRender({
  text = "Quote text here...",
  author = "Author Name",
  authorTitle,
  authorImage,
  borderColor = "#3b82f6",
  backgroundColor,
  textColor = "#374151",
  variant = "bordered",
  size = "md",
  id,
  className = "",
}: QuoteProps) {
  // Normalize image value
  const authorImageUrl = getImageUrl(authorImage);
  
  const sizeStyles = {
    sm: { text: "text-base md:text-lg", author: "text-sm", padding: "p-4 md:p-6", avatar: "w-8 h-8" },
    md: { text: "text-lg md:text-xl lg:text-2xl", author: "text-sm md:text-base", padding: "p-6 md:p-8", avatar: "w-10 h-10" },
    lg: { text: "text-xl md:text-2xl lg:text-3xl", author: "text-base md:text-lg", padding: "p-8 md:p-10", avatar: "w-12 h-12" },
  }[size];

  if (variant === "bordered") {
    return (
      <blockquote id={id} className={`border-l-4 ${sizeStyles.padding} pl-6 ${className}`} style={{ borderColor, backgroundColor }}>
        <p className={`${sizeStyles.text} italic leading-relaxed`} style={{ color: textColor }}>&ldquo;{text}&rdquo;</p>
        {author && (
          <footer className={`mt-4 ${sizeStyles.author} flex items-center gap-3`}>
            {authorImageUrl && <img src={authorImageUrl} alt={author} className={`${sizeStyles.avatar} rounded-full object-cover`} />}
            <div>
              <cite className="not-italic font-medium block">— {author}</cite>
              {authorTitle && <span className="opacity-75">{authorTitle}</span>}
            </div>
          </footer>
        )}
      </blockquote>
    );
  }

  if (variant === "card") {
    return (
      <blockquote id={id} className={`${sizeStyles.padding} rounded-xl shadow-lg text-center ${className}`} style={{ backgroundColor: backgroundColor || "#ffffff" }}>
        <svg className="w-8 h-8 mb-4 mx-auto opacity-20" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
        </svg>
        <p className={`${sizeStyles.text} leading-relaxed`} style={{ color: textColor }}>{text}</p>
        {author && (
          <footer className={`mt-6 ${sizeStyles.author} flex items-center justify-center gap-3`}>
            {authorImageUrl && <img src={authorImageUrl} alt={author} className={`${sizeStyles.avatar} rounded-full object-cover`} />}
            <div className="text-center">
              <cite className="not-italic font-semibold block" style={{ color: textColor }}>{author}</cite>
              {authorTitle && <span className="opacity-75">{authorTitle}</span>}
            </div>
          </footer>
        )}
      </blockquote>
    );
  }

  // Simple variant
  return (
    <blockquote id={id} className={`${sizeStyles.padding} ${className}`}>
      <p className={`${sizeStyles.text} italic font-serif leading-relaxed`} style={{ color: textColor }}>&ldquo;{text}&rdquo;</p>
      {author && (
        <footer className={`mt-4 ${sizeStyles.author}`}>
          <cite className="not-italic font-medium">— {author}</cite>
          {authorTitle && <span className="block opacity-75 mt-1">{authorTitle}</span>}
        </footer>
      )}
    </blockquote>
  );
}

// ============================================================================
// BUTTON PROPS - Premium Button with 60+ properties
// ============================================================================

export interface ButtonProps {
  // Content
  label?: string;
  children?: React.ReactNode;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  iconEmoji?: string;
  iconPosition?: "left" | "right" | "only";
  
  // Link & Action
  href?: string;
  target?: "_self" | "_blank";
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  
  // Variant & Style
  variant?: "primary" | "secondary" | "outline" | "ghost" | "link" | "destructive" | "success" | "warning" | "gradient";
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
  gradientDirection?: "to-r" | "to-l" | "to-t" | "to-b" | "to-br" | "to-bl" | "to-tr" | "to-tl";
  
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
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  letterSpacing?: "normal" | "wide" | "wider" | "widest";
  
  // Animation & Effects
  hoverEffect?: "none" | "lift" | "scale" | "pulse" | "shine";
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
  gradientFrom = "#3b82f6",
  gradientTo = "#8b5cf6",
  gradientDirection = "to-r",
  
  // Border & Radius
  borderRadius = "md",
  borderWidth = "1",
  borderStyle = "solid",
  
  // Shadow
  shadow = "none",
  hoverShadow,
  glowOnHover = false,
  glowColor = "#3b82f6",
  
  // Width & Sizing
  fullWidth = false,
  fullWidthMobile = false,
  minWidth,
  paddingX,
  paddingY,
  
  // Typography
  fontWeight = "medium",
  fontFamily,
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
  focusRingColor = "#3b82f6",
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
    ghost: "bg-transparent hover:opacity-80 active:opacity-70 border-transparent",
    link: "bg-transparent hover:underline border-transparent p-0",
    destructive: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 border-transparent",
    success: "bg-green-600 text-white hover:bg-green-700 active:bg-green-800 border-transparent",
    warning: "bg-yellow-500 text-white hover:bg-yellow-600 active:bg-yellow-700 border-transparent",
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
  const hoverShadowClass = hoverShadow ? {
    none: "hover:shadow-none",
    sm: "hover:shadow-sm",
    md: "hover:shadow",
    lg: "hover:shadow-md",
    xl: "hover:shadow-lg",
  }[hoverShadow] : "";

  // Width
  const widthClasses = fullWidth ? "w-full justify-center" : fullWidthMobile ? "w-full md:w-auto justify-center md:justify-start" : "";

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
  `.replace(/\s+/g, " ").trim();

  // Custom styles
  const customStyles: React.CSSProperties = {
    fontFamily: fontFamily || undefined,
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
    customStyles.background = `linear-gradient(${gradientDir}, ${gradientFrom}, ${gradientTo})`;
    customStyles.color = textColor || "#ffffff";
  } else if (variant === "primary") {
    customStyles.backgroundColor = backgroundColor || "#3b82f6";
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
  } else {
    if (backgroundColor) customStyles.backgroundColor = backgroundColor;
    if (textColor) customStyles.color = textColor;
  }

  if (borderColor) customStyles.borderColor = borderColor;

  // Glow effect
  if (glowOnHover) {
    customStyles.boxShadow = `0 0 20px ${glowColor}40`;
  }

  // Loading spinner
  const renderLoadingIndicator = () => {
    if (loadingAnimation === "spinner") {
      return (
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      );
    }
    if (loadingAnimation === "dots") {
      return <span className="flex gap-1"><span className="animate-bounce">.</span><span className="animate-bounce delay-100">.</span><span className="animate-bounce delay-200">.</span></span>;
    }
    return <span className="animate-pulse">●</span>;
  };

  // Render icon
  const renderIcon = (position: "left" | "right") => {
    if (loading) return null;
    
    const icon = iconEmoji ? (
      <span className={iconSizeClass} style={{ color: iconColor }}>{iconEmoji}</span>
    ) : position === "left" ? iconLeft : iconRight;
    
    if (iconPosition === "only" && position === "left") {
      return icon;
    }
    
    if (position === "left" && (iconLeft || (iconEmoji && iconPosition === "left"))) {
      return icon;
    }
    
    if (position === "right" && (iconRight || (iconEmoji && iconPosition === "right"))) {
      return icon;
    }
    
    return null;
  };

  // Content
  const buttonContent = (
    <>
      {loading && renderLoadingIndicator()}
      {renderIcon("left")}
      {iconPosition !== "only" && (loading && loadingText ? loadingText : (children || label))}
      {renderIcon("right")}
      
      {/* Shine effect overlay */}
      {hoverEffect === "shine" && (
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
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
        <span className={`absolute ${tooltipPositionClasses} px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50`}>
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
  aspectRatio?: "auto" | "square" | "video" | "4/3" | "3/2" | "16/9" | "21/9" | "9/16" | "3/4" | "2/3";
  
  // Object Fit & Position
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  objectPosition?: "center" | "top" | "bottom" | "left" | "right" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  
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
  badgeColor = "#3b82f6",
  badgePosition = "top-right",
  
  // Misc
  id,
  className = "",
}: ImageProps) {
  const imageUrl = getImageUrl(src) || "/placeholder.svg";
  const imageAlt = alt || getImageAlt(src, "Image");

  // Width class
  const widthClass = typeof width === "string" ? {
    full: "w-full",
    "3/4": "w-3/4",
    "2/3": "w-2/3",
    "1/2": "w-1/2",
    "1/3": "w-1/3",
    "1/4": "w-1/4",
    auto: "w-auto",
  }[width] : "";

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
  const hoverShadowClass = hoverShadow ? {
    none: "hover:shadow-none",
    sm: "hover:shadow-sm",
    md: "hover:shadow-md",
    lg: "hover:shadow-lg",
    xl: "hover:shadow-xl",
    "2xl": "hover:shadow-2xl",
  }[hoverShadow] : "";

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
  if (hoverRotate) hoverClasses.push(`group-hover:rotate-[${hoverRotateDegrees}deg]`);
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
  const animationLoadClass = animateOnLoad ? {
    fade: "animate-fadeIn",
    scale: "animate-scaleIn",
    "slide-up": "animate-slideUp",
    "slide-down": "animate-slideDown",
  }[animationType] : "";

  // Frame styles
  const frameStyles: React.CSSProperties = showFrame ? {
    backgroundColor: frameColor,
    boxShadow: frameStyle === "shadow-box" ? "0 4px 20px rgba(0,0,0,0.15)" : undefined,
  } : {};

  // Build image element
  const imageElement = (
    <img
      id={id}
      src={imageUrl}
      alt={imageAlt}
      title={title}
      loading={loading}
      className={`
        ${widthClass} ${aspectClass} ${fitClass} ${posClass} ${radiusClass}
        ${shadowClass} ${hoverShadowClass}
        ${border ? "border" : ""}
        ${hoverClasses.join(" ")}
        ${animationLoadClass}
        ${className}
      `.replace(/\s+/g, " ").trim()}
      style={imageStyles}
    />
  );

  // Wrapper with overlay
  const imageWithOverlay = showOverlay || showBadge ? (
    <div className={`relative group overflow-hidden ${radiusClass}`}>
      {imageElement}
      
      {/* Overlay */}
      {showOverlay && (
        <div
          className={`absolute inset-0 flex ${overlayPositionClass} transition-opacity ${durationClass}`}
          style={{
            backgroundColor: overlayColor,
            opacity: overlayHoverOpacity !== undefined ? undefined : overlayOpacity,
          }}
        >
          {overlayContent && (
            <span className={`${overlayContentSizeClass} font-medium`} style={{ color: overlayContentColor }}>
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
  ) : imageElement;

  // Frame wrapper
  const framedImage = showFrame ? (
    <div
      className={`inline-block ${framePaddingClass} ${frameStyle === "polaroid" ? "pb-8" : ""} ${frameStyle === "rounded" ? "rounded-lg" : ""}`}
      style={frameStyles}
    >
      {imageWithOverlay}
    </div>
  ) : imageWithOverlay;

  // Link wrapper
  const linkedImage = href ? (
    <a href={href} target={target} rel={target === "_blank" ? "noopener noreferrer" : undefined} className="block">
      {framedImage}
    </a>
  ) : framedImage;

  // Caption
  if (caption) {
    if (captionPosition === "below") {
      return (
        <figure>
          {linkedImage}
          <figcaption
            className={`mt-2 text-sm text-${captionAlign} ${captionPaddingClass}`}
            style={{ color: captionColor, backgroundColor: captionBackgroundColor }}
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
          style={{ color: captionColor, backgroundColor: captionBackgroundColor || "rgba(0,0,0,0.5)" }}
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
  loadingSpinnerColor = "#3b82f6",
  
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
  
  // Misc
  id,
  className = "",
}: VideoProps) {
  const posterUrl = typeof poster === "object" && poster?.url ? poster.url : poster as string;

  // Width class
  const widthClass = {
    full: "w-full",
    "3/4": "w-3/4",
    "2/3": "w-2/3",
    "1/2": "w-1/2",
    auto: "w-auto",
  }[width];

  // Aspect ratio
  const aspectClass = aspectRatio === "custom" && customAspect ? "" : {
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
    aspectRatio: aspectRatio === "custom" && customAspect ? customAspect : undefined,
  };

  const videoStyles: React.CSSProperties = {
    borderColor: border ? borderColor : undefined,
    borderWidth: border ? `${borderWidth}px` : undefined,
    borderStyle: border ? "solid" : undefined,
  };

  // Build YouTube embed URL
  const getYouTubeEmbed = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/)?.[1];
    if (!videoId) return null;
    
    const baseUrl = privacyEnhanced ? "https://www.youtube-nocookie.com" : "https://www.youtube.com";
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
            backgroundColor: playButtonStyle !== "minimal" ? `${playButtonColor}20` : undefined,
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
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  };

  // Video element based on type
  let videoElement: React.ReactNode;

  // YouTube
  if (src.includes("youtube.com") || src.includes("youtu.be") || type === "youtube") {
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
    videoElement = (
      <video
        id={id}
        src={src}
        poster={posterUrl}
        autoPlay={autoplay}
        muted={muted}
        loop={loop}
        controls={controls}
        playsInline={playsinline}
        preload={preload}
        className={`${widthClass} ${aspectClass} ${radiusClass} ${shadowClass} ${className}`}
        style={{
          ...videoStyles,
          playbackRate: playbackSpeed !== 1 ? playbackSpeed : undefined,
        } as React.CSSProperties}
        aria-label={ariaLabel}
      />
    );
  }

  // Container with optional overlays
  const wrappedVideo = (
    <div
      className={`relative group ${radiusClass} overflow-hidden ${paddingClass}`}
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

export interface MapProps {
  // Location
  address?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  
  // Provider
  provider?: "google" | "openstreetmap" | "mapbox";
  apiKey?: string;
  
  // Map Settings
  zoom?: number;
  mapType?: "roadmap" | "satellite" | "hybrid" | "terrain";
  
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
  mapStyle?: "default" | "silver" | "retro" | "dark" | "night" | "aubergine" | "custom";
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
  
  // Provider
  provider = "google",
  
  // Map Settings
  zoom = 14,
  mapType = "roadmap",
  
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
  const aspectClass = aspectRatio !== "auto" ? {
    video: "aspect-video",
    square: "aspect-square",
    "4/3": "aspect-[4/3]",
    "21/9": "aspect-[21/9]",
  }[aspectRatio] : "";

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
  const buildGoogleMapUrl = () => {
    const baseUrl = "https://maps.google.com/maps";
    const params = new URLSearchParams();
    
    // Location
    if (latitude && longitude) {
      params.set("q", `${latitude},${longitude}`);
    } else {
      params.set("q", address);
    }
    
    params.set("z", String(zoom));
    params.set("output", "embed");
    params.set("t", { roadmap: "m", satellite: "k", hybrid: "h", terrain: "p" }[mapType]);
    
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
  const mapStyles: React.CSSProperties = {
    height: aspectRatio === "auto" ? `${height}px` : undefined,
    borderColor: border ? borderColor : undefined,
    borderWidth: border ? `${borderWidth}px` : undefined,
    borderStyle: border ? "solid" : undefined,
    filter: grayscale ? "grayscale(100%)" : saturation !== 100 ? `saturate(${saturation}%)` : undefined,
  };

  // Render directions link
  const renderDirectionsLink = () => {
    if (!showDirectionsLink) return null;

    const link = (
      <a
        href={getDirectionsUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
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
  const mapUrl = provider === "openstreetmap" ? buildOsmUrl() : buildGoogleMapUrl();
  
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
          <svg className="w-8 h-8 text-gray-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
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
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
          <h4 className="font-semibold text-gray-900">{infoWindowTitle}</h4>
          <p className="text-sm text-gray-600 mt-1">{address}</p>
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
  subtitle?: string;
  description?: string;
  variant?: "centered" | "split" | "fullscreen" | "minimal" | "video";
  backgroundColor?: string;
  backgroundImage?: string | ImageValue;
  backgroundOverlay?: boolean;
  backgroundOverlayOpacity?: number;
  textColor?: string;
  primaryButtonText?: string;
  primaryButtonLink?: string;
  primaryButtonColor?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  image?: string | ImageValue;
  imageAlt?: string;
  imagePosition?: "left" | "right";
  videoSrc?: string;
  badge?: string;
  badgeColor?: string;
  minHeight?: "auto" | "screen" | "half";
  contentAlign?: "left" | "center" | "right";
  paddingY?: "sm" | "md" | "lg" | "xl";
  id?: string;
  className?: string;
}

export function HeroRender({
  title = "Welcome to Our Platform",
  subtitle,
  description = "Build amazing experiences with our powerful tools and beautiful components.",
  variant = "centered",
  backgroundColor = "#ffffff",
  backgroundImage,
  backgroundOverlay = true,
  backgroundOverlayOpacity = 50,
  textColor,
  primaryButtonText = "Get Started",
  primaryButtonLink = "#",
  primaryButtonColor = "#3b82f6",
  secondaryButtonText,
  secondaryButtonLink = "#",
  image,
  imageAlt = "Hero image",
  imagePosition = "right",
  videoSrc,
  badge,
  badgeColor = "#3b82f6",
  minHeight = "auto",
  contentAlign = "center",
  paddingY = "lg",
  id,
  className = "",
}: HeroProps) {
  // Normalize image values
  const bgImageUrl = getImageUrl(backgroundImage);
  const heroImageUrl = getImageUrl(image);
  const heroImageAlt = imageAlt || getImageAlt(image, "Hero image");
  
  const paddingClasses = {
    sm: "py-12 md:py-16",
    md: "py-16 md:py-24",
    lg: "py-20 md:py-32 lg:py-40",
    xl: "py-24 md:py-40 lg:py-52",
  }[paddingY];

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

  // Centered Hero
  if (variant === "centered" || variant === "minimal") {
    return (
      <section
        id={id}
        className={`relative w-full ${paddingClasses} ${heightClasses} px-4 flex flex-col justify-center ${className}`}
        style={{
          backgroundColor: bgImageUrl ? undefined : backgroundColor,
          backgroundImage: bgImageUrl ? `url(${bgImageUrl})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {bgImageUrl && backgroundOverlay && (
          <div className="absolute inset-0 bg-black" style={{ opacity: backgroundOverlayOpacity / 100 }} aria-hidden="true" />
        )}
        <div className={`relative z-10 max-w-4xl mx-auto flex flex-col ${alignClasses}`}>
          {badge && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs md:text-sm font-medium text-white mb-4 md:mb-6 self-center" style={{ backgroundColor: badgeColor }}>
              {badge}
            </span>
          )}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 md:mb-6 leading-tight" style={{ color: textColor }}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-lg md:text-xl lg:text-2xl font-medium mb-2 md:mb-4 opacity-90" style={{ color: textColor }}>
              {subtitle}
            </p>
          )}
          <p className="text-base md:text-lg lg:text-xl max-w-2xl mb-6 md:mb-8 opacity-80 leading-relaxed" style={{ color: textColor }}>
            {description}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <a
              href={primaryButtonLink}
              className="inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 text-base md:text-lg font-medium text-white rounded-lg hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
              style={{ backgroundColor: primaryButtonColor }}
            >
              {primaryButtonText}
            </a>
            {secondaryButtonText && (
              <a
                href={secondaryButtonLink}
                className="inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 text-base md:text-lg font-medium border-2 rounded-lg hover:opacity-80 transition-all"
                style={{ borderColor: textColor || "#374151", color: textColor || "#374151" }}
              >
                {secondaryButtonText}
              </a>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Split Hero with Image
  if (variant === "split") {
    const contentOrder = imagePosition === "left" ? "md:order-2" : "md:order-1";
    const imageOrder = imagePosition === "left" ? "md:order-1" : "md:order-2";

    return (
      <section id={id} className={`relative w-full ${paddingClasses} px-4 ${className}`} style={{ backgroundColor }}>
        <div className="max-w-screen-xl mx-auto grid md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
          <div className={`flex flex-col ${contentOrder}`}>
            {badge && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs md:text-sm font-medium text-white mb-4 self-start" style={{ backgroundColor: badgeColor }}>
                {badge}
              </span>
            )}
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 md:mb-6 leading-tight" style={{ color: textColor }}>
              {title}
            </h1>
            {subtitle && <p className="text-lg md:text-xl font-medium mb-2 opacity-90" style={{ color: textColor }}>{subtitle}</p>}
            <p className="text-base md:text-lg mb-6 md:mb-8 opacity-80 leading-relaxed" style={{ color: textColor }}>
              {description}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <a href={primaryButtonLink} className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white rounded-lg hover:opacity-90 transition-all shadow-lg" style={{ backgroundColor: primaryButtonColor }}>
                {primaryButtonText}
              </a>
              {secondaryButtonText && (
                <a href={secondaryButtonLink} className="inline-flex items-center justify-center px-6 py-3 text-base font-medium border-2 rounded-lg hover:opacity-80 transition-all" style={{ borderColor: textColor || "#374151", color: textColor || "#374151" }}>
                  {secondaryButtonText}
                </a>
              )}
            </div>
          </div>
          <div className={`${imageOrder}`}>
            {heroImageUrl && <img src={heroImageUrl} alt={heroImageAlt} className="w-full h-auto rounded-xl shadow-2xl" loading="lazy" />}
          </div>
        </div>
      </section>
    );
  }

  // Video Hero (PHASE-STUDIO-29 Enhancement)
  if (variant === "video" && videoSrc) {
    return (
      <section
        id={id}
        className={`relative w-full min-h-screen flex items-center justify-center px-4 overflow-hidden ${className}`}
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
            className="absolute inset-0 bg-black" 
            style={{ opacity: backgroundOverlayOpacity / 100 }} 
            aria-hidden="true" 
          />
        )}
        
        {/* Content */}
        <div className={`relative z-10 max-w-4xl mx-auto flex flex-col ${alignClasses}`}>
          {badge && (
            <span 
              className="inline-flex items-center px-3 py-1 rounded-full text-xs md:text-sm font-medium text-white mb-4 md:mb-6" 
              style={{ backgroundColor: badgeColor }}
            >
              {badge}
            </span>
          )}
          <h1 
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight" 
            style={{ color: textColor || "#ffffff" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p 
              className="text-lg md:text-xl lg:text-2xl font-medium mb-4 opacity-90" 
              style={{ color: textColor || "#ffffff" }}
            >
              {subtitle}
            </p>
          )}
          <p 
            className="text-lg md:text-xl lg:text-2xl mb-8 opacity-90 max-w-2xl" 
            style={{ color: textColor || "#ffffff" }}
          >
            {description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a 
              href={primaryButtonLink} 
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white rounded-lg hover:opacity-90 transition-all shadow-lg" 
              style={{ backgroundColor: primaryButtonColor }}
            >
              {primaryButtonText}
            </a>
            {secondaryButtonText && (
              <a 
                href={secondaryButtonLink} 
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium border-2 rounded-lg hover:opacity-80 transition-all"
                style={{ borderColor: textColor || "#ffffff", color: textColor || "#ffffff" }}
              >
                {secondaryButtonText}
              </a>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Fullscreen Hero
  return (
    <section
      id={id}
      className={`relative w-full min-h-screen flex items-center justify-center px-4 ${className}`}
      style={{
        backgroundImage: bgImageUrl ? `url(${bgImageUrl})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor,
      }}
    >
      {bgImageUrl && backgroundOverlay && <div className="absolute inset-0 bg-black" style={{ opacity: backgroundOverlayOpacity / 100 }} aria-hidden="true" />}
      <div className={`relative z-10 max-w-4xl mx-auto flex flex-col ${alignClasses}`}>
        {badge && <span className="inline-flex items-center px-3 py-1 rounded-full text-xs md:text-sm font-medium text-white mb-4 md:mb-6" style={{ backgroundColor: badgeColor }}>{badge}</span>}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight" style={{ color: textColor || "#ffffff" }}>{title}</h1>
        <p className="text-lg md:text-xl lg:text-2xl mb-8 opacity-90 max-w-2xl" style={{ color: textColor || "#ffffff" }}>{description}</p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a href={primaryButtonLink} className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white rounded-lg hover:opacity-90 transition-all shadow-lg" style={{ backgroundColor: primaryButtonColor }}>{primaryButtonText}</a>
          {secondaryButtonText && <a href={secondaryButtonLink} className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium border-2 rounded-lg hover:opacity-80 transition-all" style={{ borderColor: textColor || "#ffffff", color: textColor || "#ffffff" }}>{secondaryButtonText}</a>}
        </div>
      </div>
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
  variant?: "cards" | "minimal" | "centered" | "icons-left" | "icons-top" | "alternating" | "bento" | "list" | "timeline" | "masonry";
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
  backgroundGradientDirection?: "to-r" | "to-l" | "to-t" | "to-b" | "to-br" | "to-bl";
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
  decoratorPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "both-sides";
  
  // Animation
  animateOnScroll?: boolean;
  animationType?: "fade" | "slide-up" | "slide-left" | "slide-right" | "scale" | "stagger";
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
  badgeColor = "#3b82f6",
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
  featuredCardBackground = "#3b82f610",
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
  defaultIconColor = "#3b82f6",
  defaultIconBackgroundColor,
  iconBorder = false,
  iconBorderColor = "#3b82f6",
  
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
  linkColor = "#3b82f6",
  linkHoverColor = "#2563eb",
  defaultLinkText = "Learn more",
  
  // Numbering
  showNumbers = false,
  numberStyle = "circle",
  numberColor = "#ffffff",
  numberBackgroundColor,
  
  // Highlight/Featured
  highlightFeatured = false,
  featuredBorderColor = "#3b82f6",
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
  decoratorColor = "#3b82f6",
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
  accentColor = "#3b82f6",
  
  id,
  className = "",
}: FeaturesProps) {
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

  // Column classes
  const columnClasses = {
    2: `grid-cols-${mobileColumns} md:grid-cols-2`,
    3: `grid-cols-${mobileColumns} md:grid-cols-2 lg:grid-cols-3`,
    4: `grid-cols-${mobileColumns} md:grid-cols-2 lg:grid-cols-4`,
    5: `grid-cols-${mobileColumns} md:grid-cols-3 lg:grid-cols-5`,
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
    outlined: "px-4 py-1.5 rounded-full text-sm font-medium border-2 bg-transparent",
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
                <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: decoratorColor }} />
              ))}
            </div>
          );
        case "circles":
          return (
            <div className="relative w-40 h-40 opacity-20">
              <div className="absolute w-full h-full rounded-full border-4" style={{ borderColor: decoratorColor }} />
              <div className="absolute w-2/3 h-2/3 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-4" style={{ borderColor: decoratorColor }} />
            </div>
          );
        case "blur":
          return <div className="w-64 h-64 rounded-full blur-3xl opacity-30" style={{ backgroundColor: decoratorColor }} />;
        default:
          return null;
      }
    };
    
    if (decoratorPosition === "both-sides") {
      return (
        <>
          <div className="absolute top-0 left-0 pointer-events-none">{decoratorElement()}</div>
          <div className="absolute bottom-0 right-0 pointer-events-none">{decoratorElement()}</div>
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
    
    return <div className={`absolute ${positionClasses} pointer-events-none`}>{decoratorElement()}</div>;
  };

  // CTA button classes
  const ctaButtonClasses = {
    primary: "px-6 py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90",
    secondary: "px-6 py-3 rounded-lg font-semibold transition-all hover:opacity-90",
    outline: "px-6 py-3 rounded-lg font-semibold border-2 bg-transparent transition-all hover:bg-opacity-10",
  }[ctaButtonStyle];

  // Render feature icon
  const renderIcon = (feature: FeatureItem, index: number) => {
    const iconBgColor = feature.iconBackgroundColor || defaultIconBackgroundColor || `${feature.iconColor || defaultIconColor}20`;
    
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
        onMouseEnter={(e) => { e.currentTarget.style.color = linkHoverColor; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = linkColor; }}
      >
        {text}
        {linkStyle === "arrow" && (
          <svg className="w-4 h-4 ml-1 transition-transform group-hover/link:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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
          style={{ backgroundColor: backgroundOverlayColor, opacity: backgroundOverlayOpacity }}
        />
      )}
      
      {/* Background pattern */}
      {backgroundPattern && (
        <div className="absolute inset-0 z-0" style={{ opacity: backgroundPatternOpacity }}>
          {backgroundPattern === "dots" && (
            <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(circle, ${accentColor} 1px, transparent 1px)`, backgroundSize: "20px 20px" }} />
          )}
          {backgroundPattern === "grid" && (
            <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(${accentColor}20 1px, transparent 1px), linear-gradient(90deg, ${accentColor}20 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
          )}
        </div>
      )}
      
      {/* Decorators */}
      {renderDecorators()}
      
      <div className={`${maxWidthClasses} mx-auto relative z-10`}>
        {/* Header */}
        <div className={`${sectionGapClasses} ${headerAlign === "center" ? "text-center" : headerAlign === "right" ? "text-right" : "text-left"}`}>
          {/* Badge */}
          {badge && (
            <div className={`inline-flex items-center gap-2 mb-4 ${badgeClasses}`} style={{
              backgroundColor: badgeStyle !== "outlined" ? badgeColor : "transparent",
              color: badgeStyle === "outlined" ? badgeColor : badgeTextColor,
              borderColor: badgeStyle === "outlined" ? badgeColor : undefined,
            }}>
              {badgeIcon && <span>{badgeIcon}</span>}
              {badge}
            </div>
          )}
          
          {/* Subtitle */}
          {subtitle && (
            <p className="text-sm md:text-base font-semibold uppercase tracking-wider mb-2" style={{ color: subtitleColor || accentColor }}>
              {subtitle}
            </p>
          )}
          
          {/* Title */}
          <h2
            className={`${titleSizeClasses} font-bold mb-4`}
            style={{ color: titleColor || textColor, fontFamily: titleFont }}
          >
            {title}
          </h2>
          
          {/* Description */}
          {description && (
            <p
              className={`text-base md:text-lg max-w-2xl ${headerAlign === "center" ? "mx-auto" : ""} opacity-80`}
              style={{ color: descriptionColor || textColor }}
            >
              {description}
            </p>
          )}
        </div>
        
        {/* Features Grid */}
        <div className={`grid ${columnClasses} ${gapClasses} ${compactOnMobile ? "gap-3 md:gap-6" : ""}`}>
          {features.map((feature, i) => (
            <div
              key={i}
              className={`flex ${iconPosition === "left" ? "flex-row" : "flex-col"} ${contentAlignClasses} ${variant === "cards" ? `${cardPaddingClasses} ${borderRadiusClasses}` : ""} ${showShadow && variant === "cards" ? shadowClasses : ""} ${hoverEffectClasses} ${getAnimationClasses(i)} ${showBorder && variant === "cards" ? "border" : ""} ${feature.isFeatured && highlightFeatured ? "ring-2 relative" : ""} group`}
              style={{
                backgroundColor: variant === "cards" ? (feature.isFeatured ? featuredCardBackground : cardBackgroundColor) : undefined,
                borderColor: showBorder ? cardBorderColor : undefined,
                borderWidth: showBorder ? `${cardBorderWidth}px` : undefined,
                animationDelay: animateOnScroll ? `${animationDelay + (i * staggerDelay)}ms` : undefined,
                // @ts-expect-error - Custom CSS property for ring-color
                "--tw-ring-color": feature.isFeatured && highlightFeatured ? featuredBorderColor : undefined,
              }}
            >
              {/* Featured badge */}
              {feature.isFeatured && highlightFeatured && (
                <span
                  className="absolute -top-3 left-4 px-3 py-1 text-xs font-medium rounded-full"
                  style={{ backgroundColor: featuredBorderColor, color: "#ffffff" }}
                >
                  {feature.badge || featuredBadgeText}
                </span>
              )}
              
              {/* Icon */}
              <div className={`${iconPosition === "left" ? "mr-4 flex-shrink-0" : "mb-4"} ${contentAlign === "center" && iconPosition !== "left" ? "mx-auto" : ""}`}>
                {renderIcon(feature, i)}
              </div>
              
              {/* Content */}
              <div className={iconPosition === "left" ? "flex-1" : ""}>
                <h3
                  className={`${featureTitleSizeClasses} ${featureTitleWeightClasses} mb-2`}
                  style={{ color: featureTitleColor || textColor, fontFamily: featureTitleFont }}
                >
                  {feature.title}
                </h3>
                <p
                  className={`${featureDescriptionSizeClasses} opacity-75 leading-relaxed`}
                  style={{
                    color: featureDescriptionColor || textColor,
                    ...(descriptionMaxLines > 0 ? {
                      display: "-webkit-box",
                      WebkitLineClamp: descriptionMaxLines,
                      WebkitBoxOrient: "vertical" as const,
                      overflow: "hidden",
                    } : {}),
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
          <div className="mt-12 md:mt-16 text-center p-8 md:p-12 rounded-2xl" style={{ backgroundColor: `${accentColor}10` }}>
            <h3 className="text-xl md:text-2xl font-bold mb-2" style={{ color: textColor }}>{ctaTitle}</h3>
            <p className="text-base opacity-80 mb-6 max-w-lg mx-auto" style={{ color: textColor }}>{ctaDescription}</p>
            <a
              href={ctaButtonLink}
              className={ctaButtonClasses}
              style={{
                backgroundColor: ctaButtonStyle === "primary" ? accentColor : ctaButtonStyle === "secondary" ? `${accentColor}20` : "transparent",
                borderColor: ctaButtonStyle === "outline" ? accentColor : undefined,
                color: ctaButtonStyle === "outline" ? accentColor : ctaButtonStyle === "secondary" ? textColor : "#ffffff",
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
  variant?: "centered" | "left" | "right" | "split" | "splitReverse" | "banner" | "floating" | "minimal" | "gradient" | "glass";
  contentAlign?: "left" | "center" | "right";
  contentWidth?: "sm" | "md" | "lg" | "xl" | "full";
  buttonLayout?: "horizontal" | "vertical" | "stacked";
  buttonGap?: "sm" | "md" | "lg";
  
  // === Background ===
  backgroundColor?: string;
  backgroundGradient?: boolean;
  backgroundGradientFrom?: string;
  backgroundGradientTo?: string;
  backgroundGradientDirection?: "to-r" | "to-l" | "to-b" | "to-t" | "to-br" | "to-bl" | "to-tr" | "to-tl";
  backgroundImage?: string | ImageValue;
  backgroundImagePosition?: "center" | "top" | "bottom" | "left" | "right";
  backgroundImageSize?: "cover" | "contain" | "auto";
  backgroundImageFixed?: boolean;
  backgroundOverlay?: boolean;
  backgroundOverlayColor?: string;
  backgroundOverlayOpacity?: number;
  backgroundPattern?: "none" | "dots" | "grid" | "diagonal" | "waves" | "circuit";
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
  animationType?: "fadeIn" | "slideUp" | "slideDown" | "slideLeft" | "slideRight" | "zoom" | "flip";
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
  countdownLabels?: { days?: string; hours?: string; minutes?: string; seconds?: string };
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
  badgeColor = "#3b82f6",
  badgeTextColor = "#ffffff",
  badgeStyle = "pill",
  badgeIcon,
  badgePosition = "top",
  // Primary Button
  buttonText = "Get Started Free",
  buttonLink = "#",
  buttonColor = "#ffffff",
  buttonTextColor,
  buttonSize = "lg",
  buttonRadius = "lg",
  buttonStyle = "solid",
  buttonGradientFrom = "#3b82f6",
  buttonGradientTo = "#8b5cf6",
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
  backgroundColor = "#3b82f6",
  backgroundGradient = false,
  backgroundGradientFrom = "#3b82f6",
  backgroundGradientTo = "#8b5cf6",
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
  countdownLabels = { days: "Days", hours: "Hours", minutes: "Minutes", seconds: "Seconds" },
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
  // Normalize image values
  const bgImageUrl = getImageUrl(backgroundImage);
  const ctaImageUrl = getImageUrl(image);
  
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
  
  const paddingYClasses = {
    none: "py-0",
    sm: "py-8 md:py-12",
    md: "py-12 md:py-16",
    lg: "py-16 md:py-24",
    xl: "py-20 md:py-32",
    "2xl": "py-24 md:py-40",
  }[paddingY];
  
  const paddingXClasses = { sm: "px-4", md: "px-6", lg: "px-8", xl: "px-12" }[paddingX];
  
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
  
  // Button size classes
  const buttonSizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-6 py-3 text-base md:text-lg",
    xl: "px-8 py-4 text-lg md:text-xl",
  }[buttonSize];
  
  const buttonRadiusClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  }[buttonRadius];
  
  // Button shadow — use inline boxShadow for glow instead of hardcoded blue Tailwind
  const buttonShadowClasses = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
    glow: "shadow-lg",
  }[buttonShadow];
  // Dynamic glow shadow using the button's own color
  const buttonGlowStyle: React.CSSProperties = buttonShadow === "glow" ? { boxShadow: `0 10px 25px -5px ${buttonColor}80` } : {};
  
  const buttonHoverClasses = {
    none: "",
    scale: "hover:scale-105",
    lift: "hover:-translate-y-1",
    glow: "hover:shadow-xl",
    shine: "overflow-hidden relative",
    pulse: "hover:animate-pulse",
  }[buttonHoverEffect];
  
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
  const glassClasses = glassEffect ? `backdrop-blur-${glassBlur} bg-opacity-80` : "";
  
  // Button icons
  const ButtonIcon = ({ type, position }: { type: string; position: "left" | "right" }) => {
    const iconClass = `w-5 h-5 ${position === "left" ? "mr-2" : "ml-2"} transition-transform group-hover:translate-x-1`;
    switch (type) {
      case "arrow":
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>;
      case "chevron":
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;
      case "rocket":
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></svg>;
      case "sparkle":
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>;
      case "play":
        return <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24"><path d="M5 3l14 9-14 9V3z" /></svg>;
      default:
        return null;
    }
  };
  
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
          backgroundColor: badgeStyle === "outline" ? "transparent" : badgeColor,
          color: badgeStyle === "outline" ? badgeColor : badgeTextColor,
          borderColor: badgeStyle === "outline" ? badgeColor : undefined,
          boxShadow: badgeStyle === "glow" ? `0 0 20px ${badgeColor}50` : undefined,
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
      <div className={`flex flex-wrap justify-center items-center gap-6 ${trustBadgesPosition === "top" ? "mb-8" : "mt-8"}`}>
        {trustBadges.map((item, i) => (
          <div key={i} className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
            {item.image && <img src={getImageUrl(item.image) || ""} alt={item.text || ""} className="h-8 w-auto" />}
            {item.icon && <span className="text-xl">{item.icon}</span>}
            {item.text && <span className="text-sm font-medium" style={{ color: textColor }}>{item.text}</span>}
          </div>
        ))}
      </div>
    );
  };
  
  // Pattern overlay
  const PatternOverlay = () => {
    if (backgroundPattern === "none") return null;
    const patternStyles: Record<string, React.CSSProperties> = {
      dots: { backgroundImage: `radial-gradient(${backgroundPatternColor} 1px, transparent 1px)`, backgroundSize: "20px 20px" },
      grid: { backgroundImage: `linear-gradient(${backgroundPatternColor} 1px, transparent 1px), linear-gradient(90deg, ${backgroundPatternColor} 1px, transparent 1px)`, backgroundSize: "40px 40px" },
      diagonal: { backgroundImage: `repeating-linear-gradient(45deg, ${backgroundPatternColor} 0, ${backgroundPatternColor} 1px, transparent 0, transparent 50%)`, backgroundSize: "20px 20px" },
      waves: { backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='${encodeURIComponent(backgroundPatternColor)}' d='M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E")`, backgroundSize: "cover" },
      circuit: { backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath fill='none' stroke='${encodeURIComponent(backgroundPatternColor)}' stroke-width='0.5' d='M10,10 L90,10 M10,50 L90,50 M10,90 L90,90 M50,10 L50,90 M10,10 L10,90 M90,10 L90,90'/%3E%3C/svg%3E")` },
    };
    return (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ ...patternStyles[backgroundPattern], opacity: backgroundPatternOpacity / 100 }}
        aria-hidden="true"
      />
    );
  };
  
  // Decorator element
  const DecoratorElement = () => {
    if (!showDecorator) return null;
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity: decoratorOpacity / 100 }}>
        {decoratorType === "circles" && (
          <>
            <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full" style={{ backgroundColor: decoratorColor }} />
            <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full" style={{ backgroundColor: decoratorColor }} />
          </>
        )}
        {decoratorType === "dots" && (
          <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(${decoratorColor} 2px, transparent 2px)`, backgroundSize: "32px 32px" }} />
        )}
      </div>
    );
  };
  
  // Primary button styling
  const getPrimaryButtonStyle = (): React.CSSProperties => {
    if (buttonStyle === "gradient") {
      return {
        background: `linear-gradient(135deg, ${buttonGradientFrom}, ${buttonGradientTo})`,
        color: buttonTextColor || "#ffffff",
      };
    }
    if (buttonStyle === "outline") {
      return {
        backgroundColor: "transparent",
        border: `2px solid ${buttonColor}`,
        color: buttonColor,
      };
    }
    if (buttonStyle === "3d") {
      return {
        backgroundColor: buttonColor,
        color: buttonTextColor || "#ffffff",
        boxShadow: `0 4px 0 ${buttonColor}cc, 0 6px 20px rgba(0,0,0,0.2)`,
        transform: "translateY(-2px)",
      };
    }
    // CRITICAL: Never use backgroundColor as text fallback — it creates invisible buttons
    // (e.g. white button with white text, or blue button with blue text)
    return {
      backgroundColor: buttonColor,
      color: buttonTextColor || "#ffffff",
      ...buttonGlowStyle,
    };
  };
  
  // Secondary button styling
  const getSecondaryButtonStyle = (): React.CSSProperties => {
    const color = secondaryButtonColor || textColor;
    const txtColor = secondaryButtonTextColor || color;
    switch (secondaryButtonStyle) {
      case "solid":
        return { backgroundColor: color, color: backgroundColor };
      case "outline":
        return { backgroundColor: "transparent", border: `2px solid ${color}`, color: txtColor };
      case "ghost":
        return { backgroundColor: "transparent", color: txtColor };
      case "text":
      case "link":
        return { backgroundColor: "transparent", color: txtColor, textDecoration: secondaryButtonStyle === "link" ? "underline" : "none" };
      default:
        return { backgroundColor: "transparent", border: `2px solid ${color}`, color: txtColor };
    }
  };
  
  const secButtonRadiusClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  }[secondaryButtonRadius];
  
  const secButtonSizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-6 py-3 text-base md:text-lg",
  }[secondaryButtonSize];

  // Hide on mobile check
  if (hideOnMobile && _breakpoint === "mobile" && _isEditor) {
    return <div className="p-8 text-center text-gray-500 bg-gray-100 rounded-lg">Hidden on mobile</div>;
  }

  // Split variant with image
  if ((variant === "split" || variant === "splitReverse") && ctaImageUrl) {
    const isReverse = variant === "splitReverse" || imagePosition === "left";
    return (
      <section id={id} className={`w-full ${paddingYClasses} ${paddingXClasses} ${marginClasses} ${className}`}>
        <div className={`${maxWidthClasses} mx-auto grid md:grid-cols-2 gap-8 md:gap-12 items-center ${borderRadiusClasses} ${shadowClasses} overflow-hidden`} style={bgStyle}>
          {/* Content */}
          <div className={`p-8 md:p-12 ${isReverse ? "md:order-2" : ""} ${contentAlignClasses}`}>
            {backgroundOverlay && bgImageUrl && (
              <div className="absolute inset-0" style={{ backgroundColor: backgroundOverlayColor, opacity: backgroundOverlayOpacity / 100 }} />
            )}
            <div className="relative z-10 flex flex-col">
              {badgePosition === "top" && <BadgeElement />}
              {subtitle && (
                <p className={`text-${subtitleSize} font-${subtitleWeight} uppercase tracking-wider mb-2`} style={{ color: subtitleColor || textColor }}>
                  {subtitle}
                </p>
              )}
              <h2 className={`${titleSizeClasses} ${titleWeightClasses} mb-4`} style={{ color: titleColor || textColor }}>
                {title}
              </h2>
              {description && (
                <p className={`${descriptionSizeClasses} ${descriptionMaxWidthClasses} mb-6 opacity-90`} style={{ color: descriptionColor || textColor }}>
                  {description}
                </p>
              )}
              {badgePosition === "inline" && <BadgeElement />}
              <div className={`flex ${buttonLayoutClasses} ${buttonGapClasses} ${mobileButtonFullWidth ? "w-full" : ""}`}>
                {buttonText && (
                  <a
                    href={buttonLink}
                    className={`group inline-flex items-center justify-center font-medium transition-all duration-300 ${buttonSizeClasses} ${buttonRadiusClasses} ${buttonShadowClasses} ${buttonHoverClasses} ${mobileButtonFullWidth ? "w-full md:w-auto" : ""}`}
                    style={getPrimaryButtonStyle()}
                  >
                    {buttonIcon !== "none" && buttonIconPosition === "left" && <ButtonIcon type={buttonIcon} position="left" />}
                    {buttonText}
                    {buttonIcon !== "none" && buttonIconPosition === "right" && <ButtonIcon type={buttonIcon} position="right" />}
                  </a>
                )}
                {secondaryButtonText && (
                  <a
                    href={secondaryButtonLink}
                    className={`inline-flex items-center justify-center font-medium transition-all duration-300 ${secButtonSizeClasses} ${secButtonRadiusClasses} hover:opacity-80 ${mobileButtonFullWidth ? "w-full md:w-auto" : ""}`}
                    style={getSecondaryButtonStyle()}
                  >
                    {secondaryButtonText}
                    {secondaryButtonIcon !== "none" && <ButtonIcon type={secondaryButtonIcon} position="right" />}
                  </a>
                )}
              </div>
            </div>
          </div>
          {/* Image */}
          <div className={`${isReverse ? "md:order-1" : ""} hidden md:block`}>
            <img
              src={ctaImageUrl}
              alt={imageAlt}
              className={`w-full h-full object-${imageFit} ${imageRoundedClasses} ${imageShadowClasses} ${imageBorder ? "border-2" : ""}`}
              style={imageBorder ? { borderColor: imageBorderColor } : undefined}
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
      <section id={id} className={`relative w-full ${paddingYClasses} ${paddingXClasses} ${marginClasses} ${className}`} style={bgStyle}>
        {backgroundOverlay && bgImageUrl && (
          <div className="absolute inset-0" style={{ backgroundColor: backgroundOverlayColor, opacity: backgroundOverlayOpacity / 100 }} aria-hidden="true" />
        )}
        <PatternOverlay />
        <DecoratorElement />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className={`backdrop-blur-lg bg-white/10 border border-white/20 ${borderRadiusClasses || "rounded-2xl"} p-8 md:p-12 ${contentAlignClasses} flex flex-col`}>
            {trustBadgesPosition === "top" && <TrustBadgesElement />}
            {badgePosition === "top" && <BadgeElement />}
            {subtitle && <p className={`text-${subtitleSize} font-${subtitleWeight} uppercase tracking-wider mb-2`} style={{ color: subtitleColor || textColor }}>{subtitle}</p>}
            <h2 className={`${titleSizeClasses} ${titleWeightClasses} mb-4`} style={{ color: titleColor || textColor }}>{title}</h2>
            {description && <p className={`${descriptionSizeClasses} ${descriptionMaxWidthClasses} mb-8 opacity-90 mx-auto`} style={{ color: descriptionColor || textColor }}>{description}</p>}
            <div className={`flex ${buttonLayoutClasses} ${buttonGapClasses} justify-center`}>
              {buttonText && (
                <a href={buttonLink} className={`group inline-flex items-center justify-center font-medium transition-all duration-300 ${buttonSizeClasses} ${buttonRadiusClasses} ${buttonShadowClasses} ${buttonHoverClasses}`} style={getPrimaryButtonStyle()}>
                  {buttonIcon !== "none" && buttonIconPosition === "left" && <ButtonIcon type={buttonIcon} position="left" />}
                  {buttonText}
                  {buttonIcon !== "none" && buttonIconPosition === "right" && <ButtonIcon type={buttonIcon} position="right" />}
                </a>
              )}
              {secondaryButtonText && (
                <a href={secondaryButtonLink} className={`inline-flex items-center justify-center font-medium transition-all duration-300 ${secButtonSizeClasses} ${secButtonRadiusClasses} hover:opacity-80`} style={getSecondaryButtonStyle()}>
                  {secondaryButtonText}
                </a>
              )}
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
      <section id={id} className={`w-full py-4 md:py-6 ${paddingXClasses} ${borderRadiusClasses} ${shadowClasses} ${className}`} style={bgStyle}>
        <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {badge && <BadgeElement />}
            <p className="font-medium" style={{ color: textColor }}>{title}</p>
          </div>
          <div className="flex gap-3">
            {buttonText && (
              <a href={buttonLink} className={`inline-flex items-center justify-center font-medium transition-all ${buttonSizeClasses} ${buttonRadiusClasses}`} style={getPrimaryButtonStyle()}>
                {buttonText}
              </a>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Floating variant (card style)
  if (variant === "floating") {
    return (
      <section id={id} className={`w-full ${paddingYClasses} ${paddingXClasses} ${className}`}>
        <div className={`${maxWidthClasses} mx-auto`}>
          <div className={`${borderRadiusClasses || "rounded-2xl"} ${shadowClasses || "shadow-2xl"} p-8 md:p-12 lg:p-16 ${contentAlignClasses} flex flex-col`} style={bgStyle}>
            {backgroundOverlay && bgImageUrl && (
              <div className={`absolute inset-0 ${borderRadiusClasses}`} style={{ backgroundColor: backgroundOverlayColor, opacity: backgroundOverlayOpacity / 100 }} />
            )}
            <PatternOverlay />
            <DecoratorElement />
            <div className="relative z-10">
              {trustBadgesPosition === "top" && <TrustBadgesElement />}
              {badgePosition === "top" && <BadgeElement />}
              {subtitle && <p className={`text-${subtitleSize} font-${subtitleWeight} uppercase tracking-wider mb-2`} style={{ color: subtitleColor || textColor }}>{subtitle}</p>}
              <h2 className={`${titleSizeClasses} ${titleWeightClasses} mb-4`} style={{ color: titleColor || textColor }}>{title}</h2>
              {description && <p className={`${descriptionSizeClasses} ${descriptionMaxWidthClasses} mb-8 opacity-90 mx-auto`} style={{ color: descriptionColor || textColor }}>{description}</p>}
              <div className={`flex ${buttonLayoutClasses} ${buttonGapClasses} justify-center`}>
                {buttonText && (
                  <a href={buttonLink} className={`group inline-flex items-center justify-center font-medium transition-all duration-300 ${buttonSizeClasses} ${buttonRadiusClasses} ${buttonShadowClasses} ${buttonHoverClasses}`} style={getPrimaryButtonStyle()}>
                    {buttonIcon !== "none" && buttonIconPosition === "left" && <ButtonIcon type={buttonIcon} position="left" />}
                    {buttonText}
                    {buttonIcon !== "none" && buttonIconPosition === "right" && <ButtonIcon type={buttonIcon} position="right" />}
                  </a>
                )}
                {secondaryButtonText && (
                  <a href={secondaryButtonLink} className={`inline-flex items-center justify-center font-medium transition-all duration-300 ${secButtonSizeClasses} ${secButtonRadiusClasses} hover:opacity-80`} style={getSecondaryButtonStyle()}>
                    {secondaryButtonText}
                  </a>
                )}
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
      <section id={id} className={`relative w-full ${minHeightClasses} ${paddingYClasses} ${paddingXClasses} ${borderRadiusClasses} ${marginClasses} ${shadowClasses} ${border ? `border-${borderWidth}` : ""} ${className}`} style={{ ...bgStyle, borderColor: border ? borderColor : undefined }}>
        {backgroundOverlay && bgImageUrl && (
          <div className="absolute inset-0" style={{ backgroundColor: backgroundOverlayColor, opacity: backgroundOverlayOpacity / 100 }} aria-hidden="true" />
        )}
        <PatternOverlay />
        <DecoratorElement />
        <div className={`relative z-10 ${maxWidthClasses} mx-auto flex flex-col ${variant === "left" ? "items-start text-left" : "items-end text-right"}`}>
          {trustBadgesPosition === "top" && <TrustBadgesElement />}
          {badgePosition === "top" && <BadgeElement />}
          {subtitle && <p className={`text-${subtitleSize} font-${subtitleWeight} uppercase tracking-wider mb-2`} style={{ color: subtitleColor || textColor }}>{subtitle}</p>}
          <h2 className={`${titleSizeClasses} ${titleWeightClasses} mb-4 ${contentWidthClasses}`} style={{ color: titleColor || textColor }}>{title}</h2>
          {description && <p className={`${descriptionSizeClasses} ${descriptionMaxWidthClasses} mb-8 opacity-90`} style={{ color: descriptionColor || textColor }}>{description}</p>}
          <div className={`flex ${buttonLayoutClasses} ${buttonGapClasses}`}>
            {buttonText && (
              <a href={buttonLink} className={`group inline-flex items-center justify-center font-medium transition-all duration-300 ${buttonSizeClasses} ${buttonRadiusClasses} ${buttonShadowClasses} ${buttonHoverClasses}`} style={getPrimaryButtonStyle()}>
                {buttonIcon !== "none" && buttonIconPosition === "left" && <ButtonIcon type={buttonIcon} position="left" />}
                {buttonText}
                {buttonIcon !== "none" && buttonIconPosition === "right" && <ButtonIcon type={buttonIcon} position="right" />}
              </a>
            )}
            {secondaryButtonText && (
              <a href={secondaryButtonLink} className={`inline-flex items-center justify-center font-medium transition-all duration-300 ${secButtonSizeClasses} ${secButtonRadiusClasses} hover:opacity-80`} style={getSecondaryButtonStyle()}>
                {secondaryButtonText}
              </a>
            )}
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
        <div className="absolute inset-0" style={{ backgroundColor: backgroundOverlayColor, opacity: backgroundOverlayOpacity / 100 }} aria-hidden="true" />
      )}
      <PatternOverlay />
      <DecoratorElement />
      <div className={`relative z-10 w-full ${contentWidthClasses} mx-auto ${contentAlignClasses} flex flex-col`}>
        {trustBadgesPosition === "top" && <TrustBadgesElement />}
        {badgePosition === "top" && <BadgeElement />}
        {subtitle && (
          <p className={`text-${subtitleSize} font-${subtitleWeight} uppercase tracking-wider mb-2`} style={{ color: subtitleColor || textColor }}>
            {subtitle}
          </p>
        )}
        <h2 className={`${titleSizeClasses} ${titleWeightClasses} mb-4 md:mb-6`} style={{ color: titleColor || textColor }}>
          {title}
        </h2>
        {description && (
          <p className={`${descriptionSizeClasses} ${descriptionMaxWidthClasses} mb-6 md:mb-8 opacity-90 mx-auto`} style={{ color: descriptionColor || textColor }}>
            {description}
          </p>
        )}
        <div className={`flex ${buttonLayoutClasses} ${buttonGapClasses} justify-center ${mobileButtonFullWidth ? "w-full md:w-auto" : ""}`}>
          {buttonText && (
            <a
              href={buttonLink}
              className={`group inline-flex items-center justify-center font-medium transition-all duration-300 ${buttonSizeClasses} ${buttonRadiusClasses} ${buttonShadowClasses} ${buttonHoverClasses} ${mobileButtonFullWidth ? "w-full md:w-auto" : ""}`}
              style={getPrimaryButtonStyle()}
            >
              {buttonIcon !== "none" && buttonIconPosition === "left" && <ButtonIcon type={buttonIcon} position="left" />}
              {buttonText}
              {buttonIcon !== "none" && buttonIconPosition === "right" && <ButtonIcon type={buttonIcon} position="right" />}
            </a>
          )}
          {secondaryButtonText && (
            <a
              href={secondaryButtonLink}
              className={`inline-flex items-center justify-center font-medium transition-all duration-300 ${secButtonSizeClasses} ${secButtonRadiusClasses} hover:opacity-80 ${mobileButtonFullWidth ? "w-full md:w-auto" : ""}`}
              style={getSecondaryButtonStyle()}
            >
              {secondaryButtonText}
              {secondaryButtonIcon !== "none" && <ButtonIcon type={secondaryButtonIcon} position="right" />}
            </a>
          )}
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
  variant?: "cards" | "minimal" | "quote" | "carousel" | "masonry" | "slider" | "grid" | "featured" | "bubble" | "timeline";
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
  backgroundGradientDirection?: "to-r" | "to-l" | "to-b" | "to-t" | "to-br" | "to-bl";
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
  dotsColor = "#3b82f6",
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
  featuredBorderColor = "#3b82f6",
  // Decorative
  showDecorator = false,
  decoratorType = "quotes",
  decoratorColor = "#3b82f6",
  decoratorOpacity = 10,
  textColor,
  accentColor = "#3b82f6",
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
  
  const paddingXClasses = { sm: "px-4", md: "px-6", lg: "px-8", xl: "px-12" }[paddingX];
  
  const maxWidthClasses = {
    sm: "max-w-3xl",
    md: "max-w-4xl",
    lg: "max-w-5xl",
    xl: "max-w-6xl",
    "2xl": "max-w-7xl",
    full: "max-w-none",
  }[maxWidth];
  
  const gapClasses = { sm: "gap-4", md: "gap-6", lg: "gap-8", xl: "gap-10" }[gap];
  
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
  
  // Quote icon component
  const QuoteIcon = () => (
    <svg className={`${quoteIconSizeClasses} opacity-30`} fill="currentColor" viewBox="0 0 24 24" style={{ color: quoteIconColor || accentColor }}>
      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
    </svg>
  );
  
  // Rating component
  const RatingStars = ({ rating }: { rating: number }) => {
    if (ratingStyle === "numeric") {
      return <span className="font-bold text-lg" style={{ color: ratingColor }}>{rating}/{maxRating}</span>;
    }
    
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: maxRating }).map((_, j) => {
          if (ratingStyle === "hearts") {
            return (
              <svg key={j} className={`w-5 h-5 ${j < (rating || 0) ? "" : "opacity-30"}`} fill="currentColor" viewBox="0 0 24 24" style={{ color: j < (rating || 0) ? ratingColor : "#d1d5db" }}>
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            );
          }
          if (ratingStyle === "thumbs") {
            return (
              <svg key={j} className={`w-5 h-5 ${j < (rating || 0) ? "" : "opacity-30"}`} fill="currentColor" viewBox="0 0 24 24" style={{ color: j < (rating || 0) ? ratingColor : "#d1d5db" }}>
                <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
              </svg>
            );
          }
          return (
            <svg key={j} className={`w-5 h-5`} fill="currentColor" viewBox="0 0 20 20" style={{ color: j < (rating || 0) ? ratingColor : "#d1d5db" }}>
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          );
        })}
      </div>
    );
  };
  
  // Testimonial card
  const TestimonialCard = ({ testimonial, index }: { testimonial: NonNullable<TestimonialsProps["testimonials"]>[0]; index: number }) => {
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
          boxShadow: isFeatured ? `0 25px 50px -12px rgba(0,0,0,0.25)` : undefined,
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
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24" style={{ color: quoteIconColor || accentColor }}>
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
            style={avatarBorder ? { "--tw-ring-color": avatarBorderColor } as React.CSSProperties : undefined}
            loading="lazy"
          />
        )}
        
        {/* Quote */}
        <blockquote className={`${quoteFontSizeClasses} ${quoteStyleClasses} leading-relaxed flex-1 mb-6`} style={{ color: quoteColor || textColor }}>
          &ldquo;{testimonial.quote}&rdquo;
        </blockquote>
        
        {/* Rating - Bottom */}
        {showRating && testimonial.rating && ratingPosition === "bottom" && (
          <div className="mb-4">
            <RatingStars rating={testimonial.rating} />
          </div>
        )}
        
        {/* Author section */}
        <div className={`flex items-center gap-4 ${avatarPosition === "left" ? "flex-row" : avatarPosition === "inline" ? "flex-row" : ""} ${contentAlign === "center" ? "justify-center" : ""}`}>
          {/* Avatar - Inline/Left */}
          {showAvatar && authorImgUrl && (avatarPosition === "bottom" || avatarPosition === "inline" || avatarPosition === "left") && (
            <img
              src={authorImgUrl}
              alt={testimonial.author}
              className={`${avatarSizeClasses} ${avatarShapeClasses} object-cover ${avatarBorder ? "ring-2 ring-offset-2" : ""}`}
              style={avatarBorder ? { "--tw-ring-color": avatarBorderColor } as React.CSSProperties : undefined}
              loading="lazy"
            />
          )}
          <div>
            <p className="font-semibold" style={{ color: textColor }}>{testimonial.author}</p>
            {(testimonial.role || (showCompanyName && testimonial.company)) && (
              <p className="text-sm opacity-75" style={{ color: textColor }}>
                {testimonial.role}
                {testimonial.role && showCompanyName && testimonial.company && ", "}
                {showCompanyName && testimonial.company}
              </p>
            )}
            {/* Rating - Inline */}
            {showRating && testimonial.rating && ratingPosition === "inline" && (
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
    <section id={id} className={`relative w-full ${paddingYClasses} ${paddingXClasses} ${className}`} style={bgStyle}>
      {/* Background overlay */}
      {backgroundOverlay && bgImageUrl && (
        <div className="absolute inset-0" style={{ backgroundColor: backgroundOverlayColor, opacity: backgroundOverlayOpacity / 100 }} aria-hidden="true" />
      )}
      
      {/* Pattern */}
      {backgroundPattern !== "none" && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: backgroundPattern === "dots" ? `radial-gradient(${decoratorColor || "#000"} 1px, transparent 1px)` : backgroundPattern === "grid" ? `linear-gradient(${decoratorColor || "#000"} 1px, transparent 1px), linear-gradient(90deg, ${decoratorColor || "#000"} 1px, transparent 1px)` : undefined,
            backgroundSize: "20px 20px",
            opacity: decoratorOpacity / 100,
          }}
          aria-hidden="true"
        />
      )}
      
      {/* Decorative quote marks */}
      {showDecorator && decoratorType === "quotes" && (
        <div className="absolute top-10 left-10 pointer-events-none" style={{ opacity: decoratorOpacity / 100 }}>
          <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24" style={{ color: decoratorColor }}>
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
        </div>
      )}
      
      <div className={`relative z-10 ${maxWidthClasses} mx-auto`}>
        {/* Header */}
        {(title || subtitle || description) && (
          <div className={`${titleAlign === "center" ? "text-center" : titleAlign === "right" ? "text-right" : "text-left"} mb-12 md:mb-16`}>
            {subtitle && (
              <p className="text-sm md:text-base font-semibold uppercase tracking-wider mb-2" style={{ color: subtitleColor || accentColor }}>
                {subtitle}
              </p>
            )}
            {title && (
              <h2 className={`${titleSizeClasses} ${titleWeightClasses} mb-4`} style={{ color: titleColor || textColor }}>
                {title}
              </h2>
            )}
            {description && (
              <p className="text-base md:text-lg opacity-80 max-w-2xl mx-auto" style={{ color: descriptionColor || textColor }}>
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
  variant?: "accordion" | "cards" | "two-column" | "minimal" | "tabs" | "timeline" | "bubble" | "modern" | "grid" | "floating";
  columns?: 1 | 2;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  contentWidth?: "narrow" | "medium" | "wide" | "full";
  
  // Accordion Behavior
  defaultOpen?: number | "all" | "none";
  allowMultiple?: boolean;
  collapseOthers?: boolean;
  animationSpeed?: "slow" | "normal" | "fast";
  
  // Accordion Styling
  accordionStyle?: "default" | "bordered" | "separated" | "connected" | "minimal";
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
  decoratorPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "both-sides";
  
  // Background
  backgroundStyle?: "solid" | "gradient" | "pattern" | "image";
  backgroundGradientFrom?: string;
  backgroundGradientTo?: string;
  backgroundGradientDirection?: "to-r" | "to-l" | "to-t" | "to-b" | "to-br" | "to-bl" | "to-tr" | "to-tl";
  backgroundPattern?: "dots" | "grid" | "lines" | "waves";
  backgroundPatternOpacity?: number;
  backgroundImage?: string | ImageValue;
  backgroundOverlay?: boolean;
  backgroundOverlayColor?: string;
  backgroundOverlayOpacity?: number;
  
  // Animation
  animateOnScroll?: boolean;
  animationType?: "fade" | "slide-up" | "slide-left" | "slide-right" | "scale" | "stagger";
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
  badgeColor = "#3b82f6",
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
  accentColor = "#3b82f6",
  textColor,
  
  // Categories & Search
  showCategories = false,
  categoryPosition = "top",
  categoryStyle = "pills",
  categoryColor = "#6b7280",
  activeCategoryColor = "#3b82f6",
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
  numberBackgroundColor = "#3b82f6",
  
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
  decoratorColor = "#3b82f6",
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
    const delay = animationDelay + (index * staggerDelay);
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
    const color = iconColor || textColor || "#6b7280";
    
    if (expandedIcon && collapsedIcon) {
      return <span style={{ color }}>{isOpen ? expandedIcon : collapsedIcon}</span>;
    }
    
    switch (iconStyle) {
      case "plus":
        return (
          <svg className={iconClass} fill="none" stroke={color} viewBox="0 0 24 24">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            )}
          </svg>
        );
      case "arrow":
        return (
          <svg className={iconClass} fill="none" stroke={color} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
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
          <svg className={iconClass} fill="none" stroke={color} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        );
    }
  };

  // Badge styles
  const badgeClasses = {
    pill: "px-4 py-1.5 rounded-full text-sm font-medium",
    outlined: "px-4 py-1.5 rounded-full text-sm font-medium border-2 bg-transparent",
    solid: "px-4 py-2 rounded-md text-sm font-medium",
    gradient: "px-4 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r",
  }[badgeStyle];

  // Number style classes
  const getNumberClasses = () => {
    const base = "flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0";
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
  const categories = [...new Set(items.map(item => item.category).filter(Boolean))];

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
                <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: decoratorColor }} />
              ))}
            </div>
          );
        case "circles":
          return (
            <div className="relative w-40 h-40 opacity-20">
              <div className="absolute w-full h-full rounded-full border-4" style={{ borderColor: decoratorColor }} />
              <div className="absolute w-3/4 h-3/4 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-4" style={{ borderColor: decoratorColor }} />
            </div>
          );
        case "blur":
          return (
            <div className="w-64 h-64 rounded-full blur-3xl opacity-30" style={{ backgroundColor: decoratorColor }} />
          );
        default:
          return null;
      }
    };
    
    if (decoratorPosition === "both-sides") {
      return (
        <>
          <div className={`${decoratorClass} top-0 left-0`}>{decoratorElement()}</div>
          <div className={`${decoratorClass} bottom-0 right-0`}>{decoratorElement()}</div>
        </>
      );
    }
    
    return <div className={`${decoratorClass} ${positionClasses}`}>{decoratorElement()}</div>;
  };

  // Contact CTA button classes
  const contactButtonClasses = {
    primary: "px-6 py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90",
    secondary: "px-6 py-3 rounded-lg font-semibold transition-all hover:opacity-90",
    outline: "px-6 py-3 rounded-lg font-semibold border-2 bg-transparent transition-all hover:bg-opacity-10",
  }[contactButtonStyle];

  // Render helpful buttons
  const renderHelpful = () => {
    if (!showHelpful) return null;
    return (
      <div className="flex items-center gap-3 mt-4 pt-4 border-t" style={{ borderColor: dividerColor }}>
        <span className="text-sm opacity-70" style={{ color: textColor }}>{helpfulText}</span>
        <button className="px-3 py-1 text-sm rounded border hover:opacity-80 transition-colors" style={{ borderColor: dividerColor, color: textColor }}>
          {helpfulYesText}
        </button>
        <button className="px-3 py-1 text-sm rounded border hover:opacity-80 transition-colors" style={{ borderColor: dividerColor, color: textColor }}>
          {helpfulNoText}
        </button>
      </div>
    );
  };

  // Generate Schema.org JSON-LD
  const schemaData = enableSchema ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": items.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  } : null;

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
          style={{ backgroundColor: backgroundOverlayColor, opacity: backgroundOverlayOpacity }}
        />
      )}
      
      {/* Background pattern */}
      {backgroundPattern && (
        <div
          className="absolute inset-0 z-0"
          style={{ opacity: backgroundPatternOpacity }}
        >
          {backgroundPattern === "dots" && (
            <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(circle, ${accentColor} 1px, transparent 1px)`, backgroundSize: "20px 20px" }} />
          )}
          {backgroundPattern === "grid" && (
            <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(${accentColor}20 1px, transparent 1px), linear-gradient(90deg, ${accentColor}20 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
          )}
        </div>
      )}
      
      {/* Decorators */}
      {renderDecorators()}
      
      {/* Schema.org JSON-LD */}
      {schemaData && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }} />
      )}
      
      <div className={`${maxWidthClasses} mx-auto relative z-10`}>
        {/* Header */}
        <div className={`${sectionGapClasses} ${headerAlign === "center" ? "text-center" : headerAlign === "right" ? "text-right" : "text-left"}`}>
          {/* Badge */}
          {badge && (
            <div className={`inline-flex items-center gap-2 mb-4 ${badgeClasses}`} style={{
              backgroundColor: badgeStyle !== "outlined" ? badgeColor : "transparent",
              color: badgeStyle === "outlined" ? badgeColor : badgeTextColor,
              borderColor: badgeStyle === "outlined" ? badgeColor : undefined,
            }}>
              {badgeIcon && <span>{badgeIcon}</span>}
              {badge}
            </div>
          )}
          
          {/* Subtitle */}
          {subtitle && (
            <p className="text-sm md:text-base font-semibold uppercase tracking-wider mb-2" style={{ color: subtitleColor || accentColor }}>
              {subtitle}
            </p>
          )}
          
          {/* Title */}
          <h2
            className={`${titleSizeClasses} font-bold mb-4`}
            style={{ color: titleColor || textColor, fontFamily: titleFont }}
          >
            {title}
          </h2>
          
          {/* Description */}
          {description && (
            <p
              className={`text-base md:text-lg max-w-2xl ${headerAlign === "center" ? "mx-auto" : ""} opacity-80 ${hideDescriptionOnMobile ? "hidden md:block" : ""}`}
              style={{ color: descriptionColor || textColor }}
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
                style={{ borderColor: cardBorderColor, backgroundColor: cardBackgroundColor }}
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        )}
        
        {/* Categories */}
        {showCategories && categories.length > 0 && categoryPosition === "top" && (
          <div className={`flex flex-wrap gap-2 mb-8 ${headerAlign === "center" ? "justify-center" : ""}`}>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all`}
              style={{ backgroundColor: activeCategoryColor, color: "#ffffff" }}
            >
              All
            </button>
            {categories.map((category, i) => (
              <button
                key={i}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all hover:opacity-80`}
                style={{ backgroundColor: cardBackgroundColor, color: categoryColor }}
              >
                {category}
              </button>
            ))}
          </div>
        )}
        
        {/* FAQ Items - Accordion Variant */}
        <div className={`${gapClasses} ${columns === 2 ? "grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6" : ""}`}>
          {items.map((item, i) => (
            <details
              key={i}
              open={defaultOpen === "all" || (typeof defaultOpen === "number" && i === defaultOpen)}
              className={`group ${borderRadiusClasses} overflow-hidden transition-all ${animationSpeedClasses} ${shadowClasses} ${hoverEffectClasses} ${cardBorder ? `border` : ""} ${accordionStyle === "separated" ? "" : accordionStyle === "connected" && i > 0 ? "border-t-0 rounded-t-none" : ""} ${getAnimationClasses(i)}`}
              style={{
                backgroundColor: cardBackgroundColor,
                borderColor: cardBorder ? cardBorderColor : undefined,
                borderWidth: cardBorder ? `${cardBorderWidth}px` : undefined,
              }}
            >
              <summary
                className={`${questionPaddingClasses} cursor-pointer list-none flex items-center ${iconPosition === "left" ? "flex-row-reverse" : ""} justify-between gap-4 ${questionFontSizeClasses} ${questionFontWeightClasses} transition-all`}
                style={{ color: questionColor || textColor }}
              >
                <div className="flex items-center gap-3 flex-1">
                  {/* Number */}
                  {showNumbers && (
                    <span
                      className={getNumberClasses()}
                      style={{
                        backgroundColor: numberStyle !== "outlined" ? numberBackgroundColor : "transparent",
                        color: numberStyle === "outlined" ? numberBackgroundColor : numberColor,
                        borderColor: numberStyle === "outlined" ? numberBackgroundColor : undefined,
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
                      style={{ backgroundColor: popularBadgeColor, color: "#ffffff" }}
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
                  color: answerColor || textColor,
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
          <div className="mt-12 md:mt-16 text-center p-8 md:p-12 rounded-2xl" style={{ backgroundColor: cardBackgroundColor }}>
            <h3 className="text-xl md:text-2xl font-bold mb-2" style={{ color: textColor }}>{contactTitle}</h3>
            <p className="text-base opacity-80 mb-6 max-w-lg mx-auto" style={{ color: textColor }}>{contactDescription}</p>
            <a
              href={contactButtonLink}
              className={contactButtonClasses}
              style={{
                backgroundColor: contactButtonStyle === "primary" ? accentColor : contactButtonStyle === "secondary" ? cardBackgroundColor : "transparent",
                borderColor: contactButtonStyle === "outline" ? accentColor : undefined,
                color: contactButtonStyle === "outline" ? accentColor : contactButtonStyle === "secondary" ? textColor : "#ffffff",
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
  variant?: "simple" | "cards" | "bordered" | "icons" | "minimal" | "gradient" | "glass" | "outline" | "split" | "circular";
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
  backgroundGradientDirection?: "to-r" | "to-l" | "to-t" | "to-b" | "to-br" | "to-bl" | "to-tr" | "to-tl";
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
  decoratorPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "both-sides";
  
  // Animation
  animateOnScroll?: boolean;
  animationType?: "fade" | "slide-up" | "slide-left" | "slide-right" | "scale" | "stagger";
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
  badgeColor = "#3b82f6",
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
  iconBackgroundColor = "#3b82f620",
  defaultIconColor = "#3b82f6",
  
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
  highlightedCardBackground = "#3b82f620",
  cardBorder = false,
  cardBorderColor = "#ffffff20",
  cardBorderWidth = "1",
  cardBorderRadius = "xl",
  cardShadow = "none",
  cardHoverShadow = "lg",
  cardPadding = "lg",
  hoverEffect = "lift",
  
  // Accent & Dividers
  accentColor = "#3b82f6",
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
  decoratorColor = "#3b82f6",
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

  // Column classes
  const columnClasses = {
    2: `grid-cols-${mobileColumns} md:grid-cols-2`,
    3: `grid-cols-${mobileColumns} md:grid-cols-3`,
    4: `grid-cols-${mobileColumns} md:grid-cols-4`,
    5: `grid-cols-${mobileColumns} md:grid-cols-5`,
    6: `grid-cols-${mobileColumns} md:grid-cols-3 lg:grid-cols-6`,
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
    outlined: "px-4 py-1.5 rounded-full text-sm font-medium border-2 bg-transparent",
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
  const getCardStyles = (stat: StatItem, index: number): { className: string; style: React.CSSProperties } => {
    const baseStyle: React.CSSProperties = {};
    let baseClasses = `flex flex-col ${contentAlignClasses}`;
    
    switch (variant) {
      case "cards":
        baseClasses += ` ${cardPaddingClasses} ${borderRadiusClasses} ${shadowClasses} ${hoverEffectClasses}`;
        baseStyle.backgroundColor = stat?.isHighlighted ? highlightedCardBackground : cardBackgroundColor;
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
        baseClasses += " w-32 h-32 md:w-40 md:h-40 rounded-full justify-center mx-auto";
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
      if (animationType === "slide-up") baseClasses += " slide-in-from-bottom-4";
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
    
    const iconBgStyle: React.CSSProperties = iconStyle !== "default" ? {
      backgroundColor: iconStyle === "gradient" 
        ? `linear-gradient(135deg, ${stat.iconColor || defaultIconColor}, ${stat.iconColor || defaultIconColor}80)` 
        : iconBackgroundColor,
    } : {};
    
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
                <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: decoratorColor }} />
              ))}
            </div>
          );
        case "circles":
          return (
            <div className="relative w-40 h-40 opacity-20">
              <div className="absolute w-full h-full rounded-full border-4" style={{ borderColor: decoratorColor }} />
              <div className="absolute w-2/3 h-2/3 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-4" style={{ borderColor: decoratorColor }} />
            </div>
          );
        case "blur":
          return (
            <div className="w-64 h-64 rounded-full blur-3xl opacity-30" style={{ backgroundColor: decoratorColor }} />
          );
        default:
          return null;
      }
    };
    
    if (decoratorPosition === "both-sides") {
      return (
        <>
          <div className="absolute top-0 left-0 pointer-events-none">{decoratorElement()}</div>
          <div className="absolute bottom-0 right-0 pointer-events-none">{decoratorElement()}</div>
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
    
    return <div className={`absolute ${positionClasses} pointer-events-none`}>{decoratorElement()}</div>;
  };

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
          style={{ backgroundColor: backgroundOverlayColor, opacity: backgroundOverlayOpacity }}
        />
      )}
      
      {/* Background pattern */}
      {backgroundPattern && (
        <div
          className="absolute inset-0 z-0"
          style={{ opacity: backgroundPatternOpacity }}
        >
          {backgroundPattern === "dots" && (
            <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(circle, ${accentColor} 1px, transparent 1px)`, backgroundSize: "20px 20px" }} />
          )}
          {backgroundPattern === "grid" && (
            <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(${accentColor}20 1px, transparent 1px), linear-gradient(90deg, ${accentColor}20 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
          )}
        </div>
      )}
      
      {/* Decorators */}
      {renderDecorators()}
      
      <div className={`${maxWidthClasses} mx-auto relative z-10`}>
        {/* Header */}
        {(title || subtitle || description || badge) && (
          <div className={`${sectionGapClasses} ${headerAlign === "center" ? "text-center" : headerAlign === "right" ? "text-right" : "text-left"}`}>
            {/* Badge */}
            {badge && (
              <div className={`inline-flex items-center gap-2 mb-4 ${badgeClasses}`} style={{
                backgroundColor: badgeStyle !== "outlined" ? badgeColor : "transparent",
                color: badgeStyle === "outlined" ? badgeColor : badgeTextColor,
                borderColor: badgeStyle === "outlined" ? badgeColor : undefined,
              }}>
                {badgeIcon && <span>{badgeIcon}</span>}
                {badge}
              </div>
            )}
            
            {/* Subtitle */}
            {subtitle && (
              <p className="text-sm md:text-base font-semibold uppercase tracking-wider mb-2" style={{ color: subtitleColor || accentColor }}>
                {subtitle}
              </p>
            )}
            
            {/* Title */}
            {title && (
              <h2
                className={`${titleSizeClasses} font-bold mb-4`}
                style={{ color: titleColor || textColor, fontFamily: titleFont }}
              >
                {title}
              </h2>
            )}
            
            {/* Description */}
            {description && (
              <p
                className={`text-base md:text-lg max-w-2xl ${headerAlign === "center" ? "mx-auto" : ""} opacity-80`}
                style={{ color: descriptionColor || textColor }}
              >
                {description}
              </p>
            )}
          </div>
        )}
        
        {/* Stats Grid */}
        <div className={`grid ${columnClasses} ${gapClasses} ${compactOnMobile ? "gap-3 md:gap-6" : ""}`}>
          {stats.map((stat, i) => {
            const { className: cardClasses, style: cardStyle } = getCardStyles(stat, i);
            const StatWrapper = stat.link ? "a" : "div";
            const wrapperProps = stat.link ? { href: stat.link } : {};
            
            return (
              <StatWrapper
                key={i}
                {...wrapperProps}
                className={`${cardClasses} ${stat.link ? "cursor-pointer" : ""} ${showDividers && i > 0 ? "relative" : ""}`}
                style={{
                  ...cardStyle,
                  animationDelay: animateOnScroll ? `${entranceDelay + (i * 100)}ms` : undefined,
                }}
              >
                {/* Divider */}
                {showDividers && i > 0 && variant === "simple" && (
                  <div
                    className="absolute left-0 top-1/4 h-1/2 w-px hidden md:block"
                    style={{ 
                      backgroundColor: dividerColor,
                      borderStyle: dividerStyle === "solid" ? undefined : dividerStyle,
                    }}
                  />
                )}
                
                {/* Icon - Top */}
                {iconPosition === "top" && renderIcon(stat)}
                
                {/* Content with Icon Left */}
                <div className={`flex ${iconPosition === "left" ? "flex-row items-center" : "flex-col"} ${contentAlignClasses}`}>
                  {/* Icon - Left */}
                  {iconPosition === "left" && renderIcon(stat)}
                  
                  <div className={`flex flex-col ${contentAlignClasses}`}>
                    {/* Label - Above */}
                    {labelPosition === "above" && (
                      <div 
                        className={`${labelSizeClasses} mb-2`}
                        style={{ color: labelColor || textColor, opacity: labelOpacity }}
                      >
                        {stat.label}
                      </div>
                    )}
                    
                    {/* Value */}
                    <div 
                      className={`${valueSizeClasses} ${valueFontWeightClasses} flex items-center`}
                      style={{ color: valueColor || textColor, fontFamily: valueFont }}
                    >
                      {/* Icon - Inline */}
                      {iconPosition === "inline" && renderIcon(stat)}
                      <span>{stat.prefix}{stat.value}{stat.suffix}</span>
                      {/* Trend - Inline */}
                      {trendPosition === "inline" && renderTrend(stat)}
                    </div>
                    
                    {/* Label - Below */}
                    {labelPosition === "below" && (
                      <div 
                        className={`${labelSizeClasses} mt-2`}
                        style={{ color: labelColor || textColor, opacity: labelOpacity }}
                      >
                        {stat.label}
                      </div>
                    )}
                    
                    {/* Description */}
                    {showDescription && stat.description && (
                      <p 
                        className={`${descriptionSizeClasses} mt-2 opacity-60 ${hideDescriptionOnMobile ? "hidden md:block" : ""}`}
                        style={{ color: textColor }}
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
  variant?: "cards" | "minimal" | "detailed" | "grid" | "list" | "magazine" | "overlap" | "circular" | "modern" | "hover-reveal";
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
  backgroundGradientDirection?: "to-r" | "to-l" | "to-t" | "to-b" | "to-br" | "to-bl" | "to-tr" | "to-tl";
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
  decoratorPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "both-sides";
  
  // Animation
  animateOnScroll?: boolean;
  animationType?: "fade" | "slide-up" | "slide-left" | "slide-right" | "scale" | "stagger";
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
  badgeColor = "#3b82f6",
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
  featuredCardBackground = "#3b82f610",
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
  imageBorderColor = "#3b82f6",
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
  socialHoverColor = "#3b82f6",
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
  skillColor = "#3b82f6",
  skillBackgroundColor = "#3b82f620",
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
  decoratorColor = "#3b82f6",
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
  accentColor = "#3b82f6",
  
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

  // Column classes
  const columnClasses = {
    2: `grid-cols-${mobileColumns} md:grid-cols-2`,
    3: `grid-cols-${mobileColumns} md:grid-cols-3`,
    4: `grid-cols-${mobileColumns} md:grid-cols-2 lg:grid-cols-4`,
    5: `grid-cols-${mobileColumns} md:grid-cols-3 lg:grid-cols-5`,
    6: `grid-cols-${mobileColumns} md:grid-cols-3 lg:grid-cols-6`,
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
    outlined: "px-4 py-1.5 rounded-full text-sm font-medium border-2 bg-transparent",
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
    const delay = animationDelay + (index * staggerDelay);
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
                <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: decoratorColor }} />
              ))}
            </div>
          );
        case "circles":
          return (
            <div className="relative w-40 h-40 opacity-20">
              <div className="absolute w-full h-full rounded-full border-4" style={{ borderColor: decoratorColor }} />
              <div className="absolute w-2/3 h-2/3 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-4" style={{ borderColor: decoratorColor }} />
            </div>
          );
        case "blur":
          return (
            <div className="w-64 h-64 rounded-full blur-3xl opacity-30" style={{ backgroundColor: decoratorColor }} />
          );
        default:
          return null;
      }
    };
    
    if (decoratorPosition === "both-sides") {
      return (
        <>
          <div className="absolute top-0 left-0 pointer-events-none">{decoratorElement()}</div>
          <div className="absolute bottom-0 right-0 pointer-events-none">{decoratorElement()}</div>
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
    
    return <div className={`absolute ${positionClasses} pointer-events-none`}>{decoratorElement()}</div>;
  };

  // Render social links
  const renderSocialLinks = (member: TeamMember) => {
    if (!showSocial) return null;
    
    const links = [];
    
    if (showLinkedIn && member.linkedin) {
      links.push({ href: member.linkedin, icon: "linkedin", label: "LinkedIn" });
    }
    if (showTwitter && member.twitter) {
      links.push({ href: member.twitter, icon: "twitter", label: "Twitter" });
    }
    if (showInstagram && member.instagram) {
      links.push({ href: member.instagram, icon: "instagram", label: "Instagram" });
    }
    if (showGithub && member.github) {
      links.push({ href: member.github, icon: "github", label: "GitHub" });
    }
    if (showWebsite && member.website) {
      links.push({ href: member.website, icon: "website", label: "Website" });
    }
    if (showEmail && member.email) {
      links.push({ href: `mailto:${member.email}`, icon: "email", label: "Email" });
    }
    if (showPhone && member.phone) {
      links.push({ href: `tel:${member.phone}`, icon: "phone", label: "Phone" });
    }
    
    if (links.length === 0) return null;
    
    const containerClasses = socialPosition === "overlay" 
      ? "absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
      : socialPosition === "inline"
      ? "inline-flex gap-2 ml-2"
      : "flex gap-3 mt-4";
    
    const renderIcon = (iconType: string) => {
      switch (iconType) {
        case "linkedin":
          return <svg className={socialSizeClasses} fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>;
        case "twitter":
          return <svg className={socialSizeClasses} fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>;
        case "email":
          return <svg className={socialSizeClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
        case "github":
          return <svg className={socialSizeClasses} fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>;
        case "instagram":
          return <svg className={socialSizeClasses} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>;
        default:
          return <svg className={socialSizeClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>;
      }
    };
    
    return (
      <div className={`${containerClasses} ${contentAlign === "center" ? "justify-center" : ""}`}>
        {links.map((link, i) => (
          <a
            key={i}
            href={link.href}
            target={link.icon !== "email" && link.icon !== "phone" ? "_blank" : undefined}
            rel="noopener noreferrer"
            className={`transition-colors duration-200 ${socialStyle === "buttons" ? "p-2 rounded-lg" : socialStyle === "pills" ? "px-3 py-1 rounded-full flex items-center gap-1 text-xs" : ""}`}
            style={{ color: socialColor, backgroundColor: (socialStyle === "buttons" || socialStyle === "pills") ? `${socialColor}15` : undefined }}
            onMouseEnter={(e) => { e.currentTarget.style.color = socialHoverColor; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = socialColor; }}
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
  const departments = [...new Set(members.map(m => m.department).filter(Boolean))];

  // CTA button classes
  const ctaButtonClasses = {
    primary: "px-6 py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90",
    secondary: "px-6 py-3 rounded-lg font-semibold transition-all hover:opacity-90",
    outline: "px-6 py-3 rounded-lg font-semibold border-2 bg-transparent transition-all hover:bg-opacity-10",
  }[ctaButtonStyle];

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
          style={{ backgroundColor: backgroundOverlayColor, opacity: backgroundOverlayOpacity }}
        />
      )}
      
      {/* Background pattern */}
      {backgroundPattern && (
        <div
          className="absolute inset-0 z-0"
          style={{ opacity: backgroundPatternOpacity }}
        >
          {backgroundPattern === "dots" && (
            <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(circle, ${accentColor} 1px, transparent 1px)`, backgroundSize: "20px 20px" }} />
          )}
          {backgroundPattern === "grid" && (
            <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(${accentColor}20 1px, transparent 1px), linear-gradient(90deg, ${accentColor}20 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
          )}
        </div>
      )}
      
      {/* Decorators */}
      {renderDecorators()}
      
      <div className={`${maxWidthClasses} mx-auto relative z-10`}>
        {/* Header */}
        <div className={`${sectionGapClasses} ${headerAlign === "center" ? "text-center" : headerAlign === "right" ? "text-right" : "text-left"}`}>
          {/* Badge */}
          {badge && (
            <div className={`inline-flex items-center gap-2 mb-4 ${badgeClasses}`} style={{
              backgroundColor: badgeStyle !== "outlined" ? badgeColor : "transparent",
              color: badgeStyle === "outlined" ? badgeColor : badgeTextColor,
              borderColor: badgeStyle === "outlined" ? badgeColor : undefined,
            }}>
              {badgeIcon && <span>{badgeIcon}</span>}
              {badge}
            </div>
          )}
          
          {/* Subtitle */}
          {subtitle && (
            <p className="text-sm md:text-base font-semibold uppercase tracking-wider mb-2" style={{ color: subtitleColor || accentColor }}>
              {subtitle}
            </p>
          )}
          
          {/* Title */}
          <h2
            className={`${titleSizeClasses} font-bold mb-4`}
            style={{ color: titleColor || textColor, fontFamily: titleFont }}
          >
            {title}
          </h2>
          
          {/* Description */}
          {description && (
            <p
              className={`text-base md:text-lg max-w-2xl ${headerAlign === "center" ? "mx-auto" : ""} opacity-80`}
              style={{ color: descriptionColor || textColor }}
            >
              {description}
            </p>
          )}
        </div>
        
        {/* Filter */}
        {showFilter && departments.length > 0 && (
          <div className={`flex flex-wrap gap-2 mb-8 ${headerAlign === "center" ? "justify-center" : ""}`}>
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
                style={{ backgroundColor: cardBackgroundColor, color: textColor }}
              >
                {dept}
              </button>
            ))}
          </div>
        )}
        
        {/* Team Grid */}
        <div className={`grid ${columnClasses} ${gapClasses} ${compactOnMobile ? "gap-3 md:gap-6" : ""}`}>
          {members.map((member, i) => (
            <div
              key={i}
              className={`flex flex-col ${contentAlignClasses} ${variant === "cards" ? `${cardPaddingClasses} ${borderRadiusClasses} ${shadowClasses}` : ""} ${hoverEffectClasses} ${getAnimationClasses(i)} ${cardBorder ? "border" : ""} ${member.isFeatured || (highlightLeadership && member.isLeadership) ? "ring-2" : ""} relative group`}
              style={{
                backgroundColor: variant === "cards" ? (member.isFeatured ? featuredCardBackground : cardBackgroundColor) : undefined,
                borderColor: cardBorder ? cardBorderColor : undefined,
                borderWidth: cardBorder ? `${cardBorderWidth}px` : undefined,
                animationDelay: animateOnScroll ? `${animationDelay + (i * staggerDelay)}ms` : undefined,
                // @ts-expect-error - Custom CSS property for ring-color
                "--tw-ring-color": member.isFeatured || (highlightLeadership && member.isLeadership) ? accentColor : undefined,
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
              <div className={`relative ${imagePosition === "top" ? "mb-4" : ""}`}>
                <img
                  src={getImageUrl(member.image) || "/placeholder-avatar.svg"}
                  alt={member.name}
                  className={`${imageSizeClasses} ${imageShapeClasses} object-cover mx-auto ${imageBorder ? "ring-2 ring-offset-2" : ""} ${imageGrayscale ? "grayscale" : ""} ${imageGrayscaleHover ? "grayscale-0 group-hover:grayscale" : imageGrayscale ? "group-hover:grayscale-0" : ""} transition-all duration-300`}
                  style={imageBorder ? { "--tw-ring-color": imageBorderColor } as React.CSSProperties : undefined}
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
                style={{ color: nameColor || textColor, fontFamily: nameFont }}
              >
                {member.name}
              </h3>
              
              {/* Role */}
              <p
                className={`${roleSizeClasses} ${roleStyle === "uppercase" ? "uppercase tracking-wider" : ""} ${roleStyle === "badge" ? "px-2 py-0.5 rounded-full" : ""} opacity-75 mb-1`}
                style={{ 
                  color: roleColor || textColor,
                  backgroundColor: roleStyle === "badge" ? `${accentColor}20` : undefined,
                }}
              >
                {member.role}
              </p>
              
              {/* Department */}
              {showDepartment && member.department && (
                <p className="text-xs opacity-60 mb-2" style={{ color: departmentColor || textColor }}>
                  {member.department}
                </p>
              )}
              
              {/* Location */}
              {showLocation && member.location && (
                <p className="text-xs opacity-60 mb-2 flex items-center gap-1" style={{ color: locationColor || textColor }}>
                  {locationIcon && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
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
                <div className={`flex flex-wrap gap-1 mb-3 ${contentAlign === "center" ? "justify-center" : ""} ${hideSkillsOnMobile ? "hidden md:flex" : ""}`}>
                  {member.skills.slice(0, maxSkillsShown).map((skill, si) => (
                    <span
                      key={si}
                      className={`text-xs px-2 py-0.5 ${skillStyle === "pills" ? "rounded-full" : skillStyle === "tags" ? "rounded" : ""}`}
                      style={{ color: skillColor, backgroundColor: skillBackgroundColor }}
                    >
                      {skill}
                    </span>
                  ))}
                  {member.skills.length > maxSkillsShown && (
                    <span className="text-xs opacity-60" style={{ color: textColor }}>
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
          <div className="mt-12 md:mt-16 text-center p-8 md:p-12 rounded-2xl" style={{ backgroundColor: cardBackgroundColor }}>
            <h3 className="text-xl md:text-2xl font-bold mb-2" style={{ color: textColor }}>{ctaTitle}</h3>
            <p className="text-base opacity-80 mb-6 max-w-lg mx-auto" style={{ color: textColor }}>{ctaDescription}</p>
            <a
              href={ctaButtonLink}
              className={ctaButtonClasses}
              style={{
                backgroundColor: ctaButtonStyle === "primary" ? accentColor : ctaButtonStyle === "secondary" ? cardBackgroundColor : "transparent",
                borderColor: ctaButtonStyle === "outline" ? accentColor : undefined,
                color: ctaButtonStyle === "outline" ? accentColor : ctaButtonStyle === "secondary" ? textColor : "#ffffff",
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
  variant?: "grid" | "masonry" | "carousel" | "justified" | "spotlight" | "collage" | "pinterest" | "slider";
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
  hoverEffect?: "none" | "zoom" | "zoom-out" | "overlay" | "slide-up" | "blur" | "grayscale" | "brightness" | "tilt";
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
  backgroundGradientDirection?: "to-r" | "to-l" | "to-t" | "to-b" | "to-br" | "to-bl";
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
  decoratorPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "both-sides";
  
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
  badgeColor = "#3b82f6",
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
  backgroundColor = "#ffffff",
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
  decoratorColor = "#3b82f6",
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
  accentColor = "#3b82f6",
  
  id,
  className = "",
}: GalleryProps) {
  // State for filtering and load more
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [visibleCount, setVisibleCount] = React.useState(enableLoadMore ? initialCount : images.length);

  // Get unique categories
  const categories = [...new Set(images.map(img => img.category).filter(Boolean))] as string[];
  
  // Filter images
  const filteredImages = selectedCategory 
    ? images.filter(img => img.category === selectedCategory)
    : images;
  
  // Visible images based on load more
  const displayImages = enableLoadMore 
    ? filteredImages.slice(0, visibleCount)
    : filteredImages;

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

  // Column classes
  const columnClasses = {
    2: `grid-cols-${mobileColumns} md:grid-cols-2`,
    3: `grid-cols-${mobileColumns} md:grid-cols-3`,
    4: `grid-cols-${mobileColumns} md:grid-cols-2 lg:grid-cols-4`,
    5: `grid-cols-${mobileColumns} md:grid-cols-3 lg:grid-cols-5`,
    6: `grid-cols-${mobileColumns} md:grid-cols-3 lg:grid-cols-6`,
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
    outlined: "px-4 py-1.5 rounded-full text-sm font-medium border-2 bg-transparent",
    solid: "px-4 py-2 rounded-md text-sm font-medium",
    gradient: "px-4 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r",
  }[badgeStyle];

  // Hover effect classes
  const getHoverEffectClasses = () => {
    switch (hoverEffect) {
      case "zoom": return "group-hover:scale-105 transition-transform duration-300";
      case "zoom-out": return "scale-110 group-hover:scale-100 transition-transform duration-300";
      case "grayscale": return "grayscale group-hover:grayscale-0 transition-all duration-300";
      case "brightness": return "brightness-90 group-hover:brightness-110 transition-all duration-300";
      case "blur": return "group-hover:blur-sm transition-all duration-300";
      default: return "";
    }
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
                <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: decoratorColor }} />
              ))}
            </div>
          );
        case "circles":
          return (
            <div className="relative w-40 h-40 opacity-20">
              <div className="absolute w-full h-full rounded-full border-4" style={{ borderColor: decoratorColor }} />
              <div className="absolute w-2/3 h-2/3 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-4" style={{ borderColor: decoratorColor }} />
            </div>
          );
        case "blur":
          return <div className="w-64 h-64 rounded-full blur-3xl opacity-30" style={{ backgroundColor: decoratorColor }} />;
        default:
          return null;
      }
    };
    
    if (decoratorPosition === "both-sides") {
      return (
        <>
          <div className="absolute top-0 left-0 pointer-events-none">{decoratorElement()}</div>
          <div className="absolute bottom-0 right-0 pointer-events-none">{decoratorElement()}</div>
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
    
    return <div className={`absolute ${positionClasses} pointer-events-none`}>{decoratorElement()}</div>;
  };

  // CTA button classes
  const ctaButtonClasses = {
    primary: "px-6 py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90",
    secondary: "px-6 py-3 rounded-lg font-semibold transition-all hover:opacity-90",
    outline: "px-6 py-3 rounded-lg font-semibold border-2 bg-transparent transition-all hover:bg-opacity-10",
  }[ctaButtonStyle];

  // Filter alignment
  const filterAlignClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  }[filterAlign];

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
          style={{ backgroundColor: backgroundOverlayColor, opacity: backgroundOverlayOpacity }}
        />
      )}
      
      {/* Background pattern */}
      {backgroundPattern && (
        <div className="absolute inset-0 z-0" style={{ opacity: backgroundPatternOpacity }}>
          {backgroundPattern === "dots" && (
            <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(circle, ${accentColor} 1px, transparent 1px)`, backgroundSize: "20px 20px" }} />
          )}
          {backgroundPattern === "grid" && (
            <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(${accentColor}20 1px, transparent 1px), linear-gradient(90deg, ${accentColor}20 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
          )}
        </div>
      )}
      
      {/* Decorators */}
      {renderDecorators()}
      
      <div className={`${maxWidthClasses} mx-auto relative z-10`}>
        {/* Header */}
        {(title || subtitle || description || badge) && (
          <div className={`${sectionGapClasses} ${headerAlign === "center" ? "text-center" : headerAlign === "right" ? "text-right" : "text-left"}`}>
            {/* Badge */}
            {badge && (
              <div className={`inline-flex items-center gap-2 mb-4 ${badgeClasses}`} style={{
                backgroundColor: badgeStyle !== "outlined" ? badgeColor : "transparent",
                color: badgeStyle === "outlined" ? badgeColor : badgeTextColor,
                borderColor: badgeStyle === "outlined" ? badgeColor : undefined,
              }}>
                {badgeIcon && <span>{badgeIcon}</span>}
                {badge}
              </div>
            )}
            
            {/* Subtitle */}
            {subtitle && (
              <p className="text-sm md:text-base font-semibold uppercase tracking-wider mb-2" style={{ color: subtitleColor || accentColor }}>
                {subtitle}
              </p>
            )}
            
            {/* Title */}
            {title && (
              <h2
                className={`${titleSizeClasses} font-bold mb-4`}
                style={{ color: titleColor || textColor, fontFamily: titleFont }}
              >
                {title}
              </h2>
            )}
            
            {/* Description */}
            {description && (
              <p
                className={`text-base md:text-lg max-w-2xl ${headerAlign === "center" ? "mx-auto" : ""} opacity-80`}
                style={{ color: descriptionColor || textColor }}
              >
                {description}
              </p>
            )}
          </div>
        )}
        
        {/* Filter */}
        {showFilter && categories.length > 0 && (
          <div className={`flex flex-wrap gap-2 mb-8 ${filterAlignClasses} ${hideFilterOnMobile ? "hidden md:flex" : ""}`}>
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${filterStyle === "pills" ? "" : filterStyle === "buttons" ? "rounded-md" : "rounded-lg"}`}
              style={{
                backgroundColor: selectedCategory === null ? (filterActiveColor || accentColor) : "transparent",
                color: selectedCategory === null ? "#ffffff" : (filterInactiveColor || textColor),
                border: selectedCategory === null ? "none" : `1px solid ${filterInactiveColor || "#e5e7eb"}`,
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
                  backgroundColor: selectedCategory === cat ? (filterActiveColor || accentColor) : "transparent",
                  color: selectedCategory === cat ? "#ffffff" : (filterInactiveColor || textColor),
                  border: selectedCategory === cat ? "none" : `1px solid ${filterInactiveColor || "#e5e7eb"}`,
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
        
        {/* Gallery Grid */}
        <div className={`grid ${columnClasses} ${gapClasses} ${compactOnMobile ? "gap-2 md:gap-4" : ""}`}>
          {displayImages.map((image, i) => {
            const imageSrc = getImageUrl(image.src);
            return (
              <div
                key={i}
                className={`relative overflow-hidden ${radiusClasses} ${shadowClasses} group cursor-pointer ${getAnimationClasses(i)} ${imageBorder ? "border" : ""}`}
                style={{
                  borderColor: imageBorder ? imageBorderColor : undefined,
                  borderWidth: imageBorder ? `${imageBorderWidth}px` : undefined,
                  animationDelay: animateOnScroll ? `${animationDelay + (i * staggerDelay)}ms` : undefined,
                }}
              >
                <img
                  src={imageSrc || "/placeholder.svg"}
                  alt={image.alt || `Gallery image ${i + 1}`}
                  className={`w-full h-full object-cover ${aspectClasses} ${getHoverEffectClasses()}`}
                  loading="lazy"
                />
                
                {/* Overlay on hover */}
                {(hoverEffect === "overlay" || showCaptionOnHover || showTitleOnHover) && (
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center"
                    style={{
                      backgroundColor: `${hoverOverlayColor}${Math.round(hoverOverlayOpacity * 255).toString(16).padStart(2, '0')}`,
                    }}
                  >
                    {showTitleOnHover && image.title && (
                      <h3 className={`${imagesTitleSizeClasses} font-bold mb-2`} style={{ color: imagesTitleColor }}>
                        {image.title}
                      </h3>
                    )}
                    {showCaptionOnHover && image.caption && (
                      <p className={`${captionSizeClasses} px-4 ${captionAlign === "center" ? "text-center" : ""}`} style={{ color: captionColor }}>
                        {image.caption}
                      </p>
                    )}
                  </div>
                )}
                
                {/* Caption below */}
                {showCaption && captionPosition === "below" && image.caption && (
                  <div
                    className={`py-3 px-2 ${captionAlign === "center" ? "text-center" : captionAlign === "right" ? "text-right" : "text-left"}`}
                    style={{ backgroundColor: captionBackgroundColor }}
                  >
                    <p className={captionSizeClasses} style={{ color: captionColor }}>
                      {image.caption}
                    </p>
                  </div>
                )}
                
                {/* Title below */}
                {showTitle && titlePosition === "below" && image.title && (
                  <div className="py-3 px-2">
                    <h3 className={`${imagesTitleSizeClasses} font-semibold`} style={{ color: imagesTitleColor }}>
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
        
        {/* Load More */}
        {enableLoadMore && loadMoreStyle === "button" && visibleCount < filteredImages.length && (
          <div className="mt-8 md:mt-12 text-center">
            <button
              onClick={() => setVisibleCount(prev => prev + loadMoreCount)}
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
            {Array.from({ length: Math.ceil(filteredImages.length / loadMoreCount) }).map((_, i) => (
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
          <div className="mt-12 md:mt-16 text-center p-8 md:p-12 rounded-2xl" style={{ backgroundColor: `${accentColor}10` }}>
            <h3 className="text-xl md:text-2xl font-bold mb-2" style={{ color: textColor }}>{ctaTitle}</h3>
            <p className="text-base opacity-80 mb-6 max-w-lg mx-auto" style={{ color: textColor }}>{ctaDescription}</p>
            <a
              href={ctaButtonLink}
              className={ctaButtonClasses}
              style={{
                backgroundColor: ctaButtonStyle === "primary" ? accentColor : ctaButtonStyle === "secondary" ? `${accentColor}20` : "transparent",
                borderColor: ctaButtonStyle === "outline" ? accentColor : undefined,
                color: ctaButtonStyle === "outline" ? accentColor : ctaButtonStyle === "secondary" ? textColor : "#ffffff",
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
    icon?: string;
  }>;
  linkAlignment?: "left" | "center" | "right";
  linkSpacing?: "sm" | "md" | "lg";
  linkSize?: "sm" | "md" | "lg";
  linkWeight?: "normal" | "medium" | "semibold" | "bold";
  linkHoverStyle?: "opacity" | "underline" | "color";
  
  // CTA Button
  ctaText?: string;
  ctaLink?: string;
  ctaVariant?: "solid" | "outline" | "ghost";
  ctaColor?: string;
  ctaSize?: "sm" | "md" | "lg";
  ctaRadius?: "none" | "sm" | "md" | "lg" | "full";
  showCtaOnMobile?: boolean;
  
  // Secondary CTA
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  secondaryCtaVariant?: "solid" | "outline" | "ghost";
  
  // Layout
  layout?: "standard" | "centered" | "split";
  maxWidth?: "full" | "container" | "narrow";
  height?: "sm" | "md" | "lg";
  paddingX?: "sm" | "md" | "lg";
  
  // Style
  backgroundColor?: string;
  textColor?: string;
  borderBottom?: boolean;
  borderColor?: string;
  shadow?: "none" | "sm" | "md" | "lg";
  
  // Behavior
  sticky?: boolean;
  transparent?: boolean;
  blurBackground?: boolean;
  hideOnScroll?: boolean;
  
  // Mobile Menu
  mobileBreakpoint?: "sm" | "md" | "lg";
  mobileMenuPosition?: "left" | "right" | "full";
  mobileMenuAnimation?: "slide" | "fade" | "scale";
  showOverlay?: boolean;
  
  id?: string;
  className?: string;
  _breakpoint?: "mobile" | "tablet" | "desktop";
  _isEditor?: boolean;
}

function NavbarWithMenu({
  logo,
  logoText = "Logo",
  logoLink = "/",
  logoHeight = 40,
  logoPosition = "left",
  links = [],
  linkAlignment = "right",
  linkSpacing = "md",
  linkSize = "md",
  linkWeight = "medium",
  linkHoverStyle = "opacity",
  ctaText,
  ctaLink = "#",
  ctaVariant = "solid",
  ctaColor = "#3b82f6",
  ctaSize = "md",
  ctaRadius = "md",
  showCtaOnMobile = true,
  secondaryCtaText,
  secondaryCtaLink = "#",
  secondaryCtaVariant = "outline",
  layout = "standard",
  maxWidth = "container",
  height = "md",
  paddingX = "md",
  backgroundColor = "#ffffff",
  textColor = "#1f2937",
  borderBottom = false,
  borderColor = "#e5e7eb",
  shadow = "sm",
  sticky = true,
  transparent = false,
  blurBackground = false,
  hideOnScroll = false,
  mobileBreakpoint = "md",
  mobileMenuPosition = "full",
  mobileMenuAnimation = "slide",
  showOverlay = true,
  id,
  className = "",
  _breakpoint = "desktop",
  _isEditor = false,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  
  const logoUrl = getImageUrl(logo);
  const logoAlt = logoText || getImageAlt(logo, "Logo");
  
  // Responsive behavior
  const isMobile = _isEditor ? _breakpoint === "mobile" : false;
  const showMobileMenu = _isEditor ? isMobile : true;
  const showDesktopNav = _isEditor ? !isMobile : true;
  
  // Style calculations
  const heightClasses = { sm: "h-14", md: "h-16", lg: "h-20" }[height];
  const paddingClasses = { sm: "px-4", md: "px-6", lg: "px-8" }[paddingX];
  const maxWidthClasses = { full: "max-w-none", container: "max-w-7xl mx-auto", narrow: "max-w-5xl mx-auto" }[maxWidth];
  const shadowClasses = { none: "", sm: "shadow-sm", md: "shadow-md", lg: "shadow-lg" }[shadow];
  const linkSpacingClass = { sm: "gap-4", md: "gap-6", lg: "gap-8" }[linkSpacing];
  const linkSizeClass = { sm: "text-sm", md: "text-base", lg: "text-lg" }[linkSize];
  const linkWeightClass = { normal: "font-normal", medium: "font-medium", semibold: "font-semibold", bold: "font-bold" }[linkWeight];
  const ctaSizeClasses = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2 text-base", lg: "px-6 py-3 text-lg" }[ctaSize];
  const ctaRadiusClass = { none: "rounded-none", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", full: "rounded-full" }[ctaRadius];
  
  const linkHoverClass = {
    opacity: "hover:opacity-70 transition-opacity",
    underline: "hover:underline underline-offset-4",
    color: "hover:opacity-80 transition-colors"
  }[linkHoverStyle];
  
  const navBgStyle: React.CSSProperties = {
    backgroundColor: transparent ? "transparent" : backgroundColor,
    backdropFilter: blurBackground ? "blur(10px)" : undefined,
  };
  
  return (
    <>
      <nav
        id={id}
        className={`w-full z-50 ${sticky ? "sticky top-0" : ""} ${shadowClasses} ${borderBottom ? "border-b" : ""} ${className}`}
        style={{ ...navBgStyle, borderColor }}
      >
        <div className={`${heightClasses} ${paddingClasses} ${maxWidthClasses} flex items-center ${layout === "centered" ? "justify-center" : "justify-between"}`}>
          {/* Logo */}
          {(layout === "standard" || layout === "split") && (
            <a href={logoLink} className="flex items-center gap-2 shrink-0">
              {logoUrl && <img src={logoUrl} alt={logoAlt} style={{ height: logoHeight }} className="w-auto" />}
              {!logoUrl && <span className="text-xl font-bold" style={{ color: textColor }}>{logoText}</span>}
            </a>
          )}
          
          {/* Desktop Navigation */}
          {showDesktopNav && (
            <div className={`hidden md:flex items-center ${linkSpacingClass} ${linkAlignment === "center" ? "flex-1 justify-center" : linkAlignment === "right" ? "flex-1 justify-end" : ""}`}>
              {links.map((link, i) => (
                <a 
                  key={i} 
                  href={link.href || "#"} 
                  className={`${linkSizeClass} ${linkWeightClass} ${linkHoverClass}`}
                  style={{ color: textColor }}
                >
                  {link.label || link.text || `Link ${i + 1}`}
                </a>
              ))}
            </div>
          )}
          
          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            {secondaryCtaText && showDesktopNav && (
              <a
                href={secondaryCtaLink}
                className={`hidden md:inline-flex items-center ${ctaSizeClasses} ${ctaRadiusClass} font-medium transition-all
                  ${secondaryCtaVariant === "solid" ? "text-white" : ""}
                  ${secondaryCtaVariant === "outline" ? "border-2" : ""}
                  ${secondaryCtaVariant === "ghost" ? "hover:opacity-80" : ""}
                `}
                style={{
                  backgroundColor: secondaryCtaVariant === "solid" ? ctaColor : "transparent",
                  borderColor: secondaryCtaVariant === "outline" ? ctaColor : undefined,
                  color: secondaryCtaVariant !== "solid" ? ctaColor : "#ffffff",
                }}
              >
                {secondaryCtaText}
              </a>
            )}
            
            {ctaText && (
              <a
                href={ctaLink}
                className={`${showCtaOnMobile ? "" : "hidden md:inline-flex"} ${showCtaOnMobile ? "inline-flex" : ""} items-center ${ctaSizeClasses} ${ctaRadiusClass} font-medium transition-all
                  ${ctaVariant === "solid" ? "text-white hover:opacity-90" : ""}
                  ${ctaVariant === "outline" ? "border-2 hover:bg-opacity-10" : ""}
                  ${ctaVariant === "ghost" ? "hover:opacity-80" : ""}
                `}
                style={{
                  backgroundColor: ctaVariant === "solid" ? ctaColor : "transparent",
                  borderColor: ctaVariant === "outline" ? ctaColor : undefined,
                  color: ctaVariant !== "solid" ? ctaColor : "#ffffff",
                }}
              >
                {ctaText}
              </a>
            )}
            
            {/* Hamburger Button */}
            {showMobileMenu && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:opacity-80 transition-colors"
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: textColor }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: textColor }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      </nav>
      
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && showOverlay && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      {/* Mobile Menu Panel */}
      <div
        className={`fixed top-[${parseInt(heightClasses.match(/\d+/)?.[0] || "16") * 4}px] ${mobileMenuPosition === "left" ? "left-0" : mobileMenuPosition === "right" ? "right-0" : "left-0 right-0"} bottom-0 z-50 md:hidden transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : mobileMenuPosition === "right" ? "translate-x-full" : "-translate-x-full"
        }`}
        style={{ backgroundColor, maxWidth: mobileMenuPosition === "full" ? "100%" : "320px" }}
      >
        <div className="h-full overflow-y-auto p-6 space-y-1">
          {links.map((link, i) => (
            <a
              key={i}
              href={link.href || "#"}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 rounded-lg text-base font-medium hover:opacity-80 transition-colors"
              style={{ color: textColor }}
            >
              {link.label || link.text || `Link ${i + 1}`}
            </a>
          ))}
          
          {secondaryCtaText && (
            <a
              href={secondaryCtaLink}
              onClick={() => setMobileMenuOpen(false)}
              className={`block w-full px-4 py-3 mt-4 text-center rounded-lg font-medium transition-all ${
                secondaryCtaVariant === "outline" ? "border-2" : ""
              }`}
              style={{
                backgroundColor: secondaryCtaVariant === "solid" ? ctaColor : "transparent",
                borderColor: secondaryCtaVariant === "outline" ? ctaColor : undefined,
                color: secondaryCtaVariant === "solid" ? "#ffffff" : ctaColor,
              }}
            >
              {secondaryCtaText}
            </a>
          )}
          
          {!showCtaOnMobile && ctaText && (
            <a
              href={ctaLink}
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full px-4 py-3 mt-4 text-center rounded-lg font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: ctaColor }}
            >
              {ctaText}
            </a>
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
  logo?: string | ImageValue;
  logoText?: string;
  description?: string;
  columns?: Array<{
    title?: string;
    links?: Array<{ label?: string; href?: string }>;
  }>;
  socialLinks?: Array<{
    platform?: "facebook" | "twitter" | "instagram" | "linkedin" | "youtube" | "github";
    url?: string;
  }>;
  copyright?: string;
  bottomLinks?: Array<{ label?: string; href?: string }>;
  newsletter?: boolean;
  newsletterTitle?: string;
  newsletterPlaceholder?: string;
  newsletterButtonText?: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  variant?: "simple" | "columns" | "centered";
  paddingY?: "sm" | "md" | "lg";
  id?: string;
  className?: string;
}

export function FooterRender({
  logo,
  logoText = "Company",
  description,
  columns = [],
  socialLinks = [],
  copyright = `© ${new Date().getFullYear()} Company. All rights reserved.`,
  bottomLinks = [],
  newsletter = false,
  newsletterTitle = "Subscribe to our newsletter",
  newsletterPlaceholder = "Enter your email",
  newsletterButtonText = "Subscribe",
  backgroundColor = "#111827",
  textColor = "#ffffff",
  linkColor = "#94a3b8",
  linkHoverColor = "#ffffff",
  accentColor = "#3b82f6",
  variant = "columns",
  paddingY = "lg",
  id,
  className = "",
}: FooterProps & { linkColor?: string; linkHoverColor?: string }) {
  // Normalize logo image
  const logoUrl = getImageUrl(logo);
  
  const paddingClasses = { sm: "py-8 md:py-12", md: "py-12 md:py-16", lg: "py-16 md:py-20" }[paddingY];

  const SocialIcon = ({ platform }: { platform?: string }) => {
    const icons: Record<string, React.ReactNode> = {
      facebook: <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />,
      twitter: <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />,
      instagram: <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />,
      linkedin: <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />,
      youtube: <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />,
      github: <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />,
    };
    return <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">{icons[platform || ""] || null}</svg>;
  };

  return (
    <footer id={id} className={`w-full ${paddingClasses} px-4 ${className}`} style={{ backgroundColor }}>
      <div className="max-w-screen-xl mx-auto">
        {variant === "columns" && columns.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1 lg:col-span-2">
              {logoUrl && <img src={logoUrl} alt={logoText} className="h-8 mb-4" />}
              {!logoUrl && <p className="text-xl font-bold mb-4" style={{ color: textColor }}>{logoText}</p>}
              {description && <p className="text-sm opacity-75 mb-4 max-w-xs" style={{ color: textColor }}>{description}</p>}
              {socialLinks.length > 0 && (
                <div className="flex gap-4">
                  {socialLinks.map((social, i) => (
                    <a key={i} href={social.url || "#"} target="_blank" rel="noopener noreferrer" className="opacity-75 hover:opacity-100 transition-opacity" style={{ color: textColor }} aria-label={social.platform}>
                      <SocialIcon platform={social.platform} />
                    </a>
                  ))}
                </div>
              )}
            </div>
            {columns.map((column, i) => (
              <div key={i}>
                <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider" style={{ color: textColor }}>{column.title}</h3>
                <ul className="space-y-2">
                  {(column.links || []).map((link, j) => (
                    <li key={j}>
                      <a 
                        href={link.href || "#"} 
                        className="text-sm transition-colors"
                        style={{ color: linkColor }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = linkHoverColor; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = linkColor; }}
                      >{link.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        {newsletter && (
          <div className="border-t pt-8 mb-8" style={{ borderColor: `${textColor}15` }}>
            <div className="max-w-md">
              <h3 className="font-semibold mb-4" style={{ color: textColor }}>{newsletterTitle}</h3>
              <form className="flex flex-col sm:flex-row gap-2">
                <input type="email" placeholder={newsletterPlaceholder} className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30" />
                <button type="submit" className="px-6 py-2 rounded-lg font-medium transition-opacity hover:opacity-90 whitespace-nowrap" style={{ backgroundColor: accentColor, color: "#ffffff" }}>{newsletterButtonText}</button>
              </form>
            </div>
          </div>
        )}
        <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderColor: `${textColor}15` }}>
          <p className="text-sm opacity-75" style={{ color: textColor }}>{copyright}</p>
          {bottomLinks.length > 0 && (
            <div className="flex flex-wrap gap-4 md:gap-6">
              {bottomLinks.map((link, i) => (
                <a 
                  key={i} 
                  href={link.href || "#"} 
                  className="text-sm transition-colors"
                  style={{ color: linkColor }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = linkHoverColor; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = linkColor; }}
                >{link.label}</a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}

// ============================================================================
// SOCIAL LINKS - Social Media Icons
// ============================================================================

export interface SocialLinksProps {
  links?: Array<{
    platform?: "facebook" | "twitter" | "instagram" | "linkedin" | "youtube" | "github" | "tiktok" | "pinterest";
    url?: string;
    label?: string;
  }>;
  size?: "sm" | "md" | "lg";
  variant?: "icons" | "buttons" | "rounded";
  color?: string;
  hoverColor?: string;
  gap?: "sm" | "md" | "lg";
  id?: string;
  className?: string;
}

export function SocialLinksRender({
  links = [],
  size = "md",
  variant = "icons",
  color = "#6b7280",
  hoverColor = "#3b82f6",
  gap = "md",
  id,
  className = "",
}: SocialLinksProps) {
  const sizeClasses = { sm: "w-4 h-4", md: "w-5 h-5", lg: "w-6 h-6" }[size];
  const gapClasses = { sm: "gap-2", md: "gap-4", lg: "gap-6" }[gap];
  const containerClasses = { icons: "", buttons: "p-2 rounded-lg hover:opacity-80", rounded: "p-2 rounded-full border hover:opacity-80" }[variant];

  return (
    <div id={id} className={`flex items-center ${gapClasses} ${className}`}>
      {links.map((link, i) => (
        <a key={i} href={link.url || "#"} target="_blank" rel="noopener noreferrer" className={`transition-colors ${containerClasses}`} style={{ color }} aria-label={link.label || link.platform}>
          <svg className={sizeClasses} fill="currentColor" viewBox="0 0 24 24">
            {link.platform === "facebook" && <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />}
            {link.platform === "twitter" && <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />}
            {link.platform === "instagram" && <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />}
            {link.platform === "linkedin" && <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />}
          </svg>
        </a>
      ))}
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
  enctype?: "application/x-www-form-urlencoded" | "multipart/form-data" | "text/plain";
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
  submitColor = "#3b82f6",
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
}: FormProps) {
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
  const animationClass = animateOnLoad ? {
    fade: "animate-fadeIn",
    slide: "animate-slideUp",
    scale: "animate-scaleIn",
  }[animationType] : "";

  // Border styles
  const borderStyles: React.CSSProperties = border ? {
    borderColor,
    borderWidth: `${borderWidth}px`,
    borderStyle: "solid",
  } : {};

  return (
    <form
      id={id}
      action={action}
      method={method}
      encType={enctype}
      noValidate={novalidate}
      autoComplete={autocomplete}
      className={`
        ${layoutClasses} ${gapClasses} ${maxWClasses} ${paddingClasses}
        ${radiusClasses} ${shadowClasses} ${animationClass}
        ${fullWidth ? "w-full" : ""} ${className}
      `.replace(/\s+/g, " ").trim()}
      style={{ backgroundColor, ...borderStyles }}
      onSubmit={onSubmit}
    >
      {/* Header */}
      {showHeader && (title || description) && (
        <div className={`${layout === "horizontal" || layout.startsWith("grid") ? "col-span-full" : ""} ${headerSpacingClasses} text-${headerAlign}`}>
          {title && (
            <h3 className={`${titleSizeClasses} font-bold`} style={{ color: titleColor }}>
              {title}
            </h3>
          )}
          {description && (
            <p className="mt-2 text-sm" style={{ color: descriptionColor || "#6b7280" }}>
              {description}
            </p>
          )}
          {showDividers && <hr className="mt-4" style={{ borderColor: dividerColor }} />}
        </div>
      )}

      {/* Form Fields */}
      {children}

      {/* Success Message */}
      {successMessage && (
        <div className={`${layout === "horizontal" || layout.startsWith("grid") ? "col-span-full" : ""} p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2`}>
          {showSuccessIcon && <span>✓</span>}
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className={`${layout === "horizontal" || layout.startsWith("grid") ? "col-span-full" : ""} p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2`}>
          {showErrorIcon && <span>✕</span>}
          {errorMessage}
        </div>
      )}

      {/* Buttons */}
      {(showSubmitButton || showResetButton) && (
        <div className={`${layout === "horizontal" || layout.startsWith("grid") ? "col-span-full" : ""} flex ${submitPositionClasses} gap-3 mt-2`}>
          {showResetButton && (
            <button
              type="reset"
              className="px-4 py-2 opacity-70 hover:opacity-100 transition-opacity"
              disabled={disabled || isLoading}
            >
              {resetText}
            </button>
          )}
          {showSubmitButton && (
            <button
              type="submit"
              className={`${submitButtonClasses} ${submitSizeClasses} ${submitFullWidth || submitPosition === "full" ? "w-full" : ""} rounded-lg font-medium transition-all disabled:opacity-50`}
              style={submitVariant === "primary" ? { backgroundColor: submitColor } : submitVariant === "secondary" ? { backgroundColor: `${submitColor}18`, color: submitColor } : { borderColor: submitColor, color: submitColor }}
              disabled={disabled || isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {loadingText}
                </span>
              ) : submitText}
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
  type?: "text" | "email" | "password" | "tel" | "url" | "number" | "date" | "time" | "datetime-local" | "textarea" | "select" | "checkbox" | "radio" | "range" | "file" | "color" | "hidden";
  
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
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
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
  focusBorderColor = "#3b82f6",
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
  `.replace(/\s+/g, " ").trim();

  // Inline styles for theme-aware input styling
  const inputStyles: React.CSSProperties = {
    backgroundColor: variant === "underline" || variant === "ghost" ? "transparent" : backgroundColor,
    color: textColor || undefined,
    borderColor: error ? "#ef4444" : success ? "#22c55e" : borderColor,
    // Use focusBorderColor via CSS custom properties
  };
  const focusRingColor = error ? "rgba(239,68,68,0.2)" : success ? "rgba(34,197,94,0.2)" : `${focusBorderColor}33`;
  const inputFocusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      if (!error && !success) {
        e.currentTarget.style.borderColor = focusBorderColor;
        e.currentTarget.style.boxShadow = `0 0 0 3px ${focusRingColor}`;
      }
      onFocus?.(e);
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      if (!error && !success) {
        e.currentTarget.style.borderColor = borderColor;
        e.currentTarget.style.boxShadow = "none";
      }
      onBlur?.(e);
    },
  };

  const fieldId = id || name;
  const inputType = type === "password" && showPassword ? "text" : type;

  // Handle change with char count
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
          {...inputFocusHandlers}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
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
            style={{ accentColor: focusBorderColor || "#3b82f6" }}
            onChange={handleChange}
          />
          {label && !hideLabel && (
            <label htmlFor={fieldId} className="text-sm" style={{ color: labelColor || "inherit" }}>
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
        {...inputFocusHandlers}
      />
    );
  };

  // For checkbox/radio, return simple layout
  if (type === "checkbox" || type === "radio") {
    return (
      <div className={`${className} ${containerClassName}`}>
        {renderInput()}
        {helpText && !error && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
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
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: prefixColor }}>
            {prefix}
          </div>
        )}

        {/* Icon Left */}
        {iconEmoji && iconPosition === "left" && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: iconColor }}>
            {iconEmoji}
          </div>
        )}

        {/* Input */}
        {renderInput()}

        {/* Icon Right */}
        {iconEmoji && iconPosition === "right" && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: iconColor }}>
            {iconEmoji}
          </div>
        )}

        {/* Suffix */}
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: suffixColor }}>
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
          {helpText && !error && !success && <p className="text-sm opacity-60">{helpText}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && !error && <p className="text-sm text-green-600">{success}</p>}
        </div>
        
        {/* Character Count */}
        {(showCharCount || maxLength) && type !== "select" && (
          <span className="text-xs opacity-50">
            {charCount}{maxLength ? `/${maxLength}` : ""}
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
  successMessage,
  action = "#",
  id,
  className = "",
}: ContactFormProps) {
  const paddingClasses = { sm: "p-4 md:p-6", md: "p-6 md:p-8", lg: "p-8 md:p-10" }[padding];
  const radiusClasses = { none: "", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", xl: "rounded-xl" }[borderRadius];
  const shadowClasses = { none: "", sm: "shadow-sm", md: "shadow-md", lg: "shadow-lg", xl: "shadow-xl" }[shadow];
  // Detect if we're on a dark background
  const isDark = backgroundColor ? parseInt(backgroundColor.replace('#','').substring(0,2), 16) < 100 : false;
  const resolvedButtonColor = buttonColor || (isDark ? "#e5a956" : "#3b82f6");
  const resolvedTextColor = textColor || (isDark ? "#f9fafb" : "#1f2937");
  const resolvedSubtitleColor = isDark ? "#9ca3af" : "#6b7280";
  const resolvedInputBg = inputBackgroundColor || (isDark ? "#374151" : "#ffffff");
  const resolvedInputBorder = inputBorderColor || (isDark ? "#4b5563" : "#d1d5db");
  const resolvedInputText = inputTextColor || (isDark ? "#f9fafb" : "#1f2937");
  const resolvedLabelColor = labelColor || (isDark ? "#e5e7eb" : "#374151");

  return (
    <div id={id} className={`max-w-lg mx-auto ${paddingClasses} ${radiusClasses} ${shadowClasses} ${className}`} style={{ backgroundColor }}>
      {title && <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2" style={{ color: resolvedTextColor }}>{title}</h2>}
      {subtitle && <p className="mb-6" style={{ color: resolvedSubtitleColor }}>{subtitle}</p>}
      <form action={action} method="POST" className="space-y-4 md:space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <FormFieldRender label={nameLabel} name="name" placeholder="John Doe" required labelColor={resolvedLabelColor} backgroundColor={resolvedInputBg} borderColor={resolvedInputBorder} textColor={resolvedInputText} focusBorderColor={resolvedButtonColor} />
          <FormFieldRender label={emailLabel} name="email" type="email" placeholder="john@example.com" required labelColor={resolvedLabelColor} backgroundColor={resolvedInputBg} borderColor={resolvedInputBorder} textColor={resolvedInputText} focusBorderColor={resolvedButtonColor} />
        </div>
        {(showPhone || showSubject) && (
          <div className="grid md:grid-cols-2 gap-4">
            {showPhone && <FormFieldRender label={phoneLabel} name="phone" type="tel" placeholder="+1 (555) 000-0000" labelColor={resolvedLabelColor} backgroundColor={resolvedInputBg} borderColor={resolvedInputBorder} textColor={resolvedInputText} focusBorderColor={resolvedButtonColor} />}
            {showSubject && <FormFieldRender label={subjectLabel} name="subject" placeholder="How can we help?" labelColor={resolvedLabelColor} backgroundColor={resolvedInputBg} borderColor={resolvedInputBorder} textColor={resolvedInputText} focusBorderColor={resolvedButtonColor} />}
          </div>
        )}
        <FormFieldRender label={messageLabel} name="message" type="textarea" placeholder="Your message..." rows={5} required labelColor={resolvedLabelColor} backgroundColor={resolvedInputBg} borderColor={resolvedInputBorder} textColor={resolvedInputText} focusBorderColor={resolvedButtonColor} />
        <button type="submit" className="w-full px-6 py-3 font-medium rounded-lg transition-all duration-200 hover:opacity-90 focus:ring-2 focus:ring-offset-2" style={{ backgroundColor: resolvedButtonColor, color: buttonTextColor, boxShadow: `0 0 0 0 transparent`, ['--tw-ring-color' as string]: resolvedButtonColor }}>
          {submitText}
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
  textColor?: string;
  size?: "sm" | "md" | "lg";
  successMessage?: string;
  action?: string;
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
  buttonColor = "#3b82f6",
  textColor,
  size = "md",
  successMessage,
  action = "#",
  id,
  className = "",
}: NewsletterProps) {
  const sizeClasses = { sm: "text-sm", md: "text-base", lg: "text-lg" }[size];
  const inputSizeClasses = { sm: "px-3 py-2", md: "px-4 py-2.5", lg: "px-5 py-3" }[size];

  // Determine input styling based on background darkness
  const bgDark = backgroundColor ? (() => {
    const hex = backgroundColor.replace('#', '');
    if (hex.length < 6) return false;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
  })() : false;

  const resolvedTextColor = textColor || (bgDark ? "#f8fafc" : "#1f2937");
  const inputBorderColor = bgDark ? "rgba(255,255,255,0.2)" : `${buttonColor}30`;
  const inputTextColor = bgDark ? "#f8fafc" : "#1f2937";
  const placeholderStyle = bgDark ? "placeholder-white/50" : "placeholder-gray-400";

  if (variant === "card") {
    return (
      <section id={id} className={`w-full py-12 md:py-16 px-4 ${className}`} style={{ backgroundColor: backgroundColor || undefined }}>
        <div className="max-w-2xl mx-auto">
          <div className="p-8 md:p-10 rounded-2xl shadow-lg text-center" style={{ backgroundColor: bgDark ? "rgba(255,255,255,0.05)" : "#ffffff", border: bgDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e5e7eb" }}>
            <h3 className={`font-bold mb-3 ${size === "lg" ? "text-xl md:text-2xl" : "text-lg md:text-xl"}`} style={{ color: resolvedTextColor }}>{title}</h3>
            <p className={`${sizeClasses} mb-6`} style={{ color: resolvedTextColor, opacity: 0.8 }}>{description}</p>
            <form action={action} method="POST" className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input type="email" name="email" placeholder={placeholder} required className={`flex-1 ${inputSizeClasses} border rounded-lg focus:ring-2 focus:outline-none ${placeholderStyle}`} style={{ borderColor: inputBorderColor, backgroundColor: bgDark ? "rgba(255,255,255,0.08)" : "transparent", color: inputTextColor }} />
              <button type="submit" className={`${inputSizeClasses} px-6 font-medium text-white rounded-lg transition-opacity hover:opacity-90 whitespace-nowrap`} style={{ backgroundColor: buttonColor }}>{buttonText}</button>
            </form>
          </div>
        </div>
      </section>
    );
  }

  // Inline/stacked variant — ALWAYS wrapped in a proper section container
  return (
    <section id={id} className={`w-full py-12 md:py-16 px-4 ${className}`} style={{ backgroundColor: backgroundColor || undefined }}>
      <div className={`max-w-2xl mx-auto ${variant === "stacked" ? "text-center" : ""}`}>
        {title && <h3 className={`font-bold mb-3 ${size === "lg" ? "text-xl md:text-2xl" : "text-lg"}`} style={{ color: resolvedTextColor }}>{title}</h3>}
        {description && <p className={`${sizeClasses} mb-6`} style={{ color: resolvedTextColor, opacity: 0.8 }}>{description}</p>}
        <form action={action} method="POST" className={`flex ${variant === "stacked" ? "flex-col max-w-md mx-auto" : "flex-col sm:flex-row"} gap-3`}>
          <input type="email" name="email" placeholder={placeholder} required className={`flex-1 ${inputSizeClasses} border rounded-lg focus:ring-2 focus:outline-none ${placeholderStyle}`} style={{ borderColor: inputBorderColor, backgroundColor: bgDark ? "rgba(255,255,255,0.08)" : "transparent", color: inputTextColor }} />
          <button type="submit" className={`${inputSizeClasses} px-6 font-medium text-white rounded-lg transition-opacity hover:opacity-90 whitespace-nowrap`} style={{ backgroundColor: buttonColor }}>{buttonText}</button>
        </form>
      </div>
    </section>
  );
}
// ============================================================================
// CAROUSEL - Image/Content Carousel
// ============================================================================

export interface CarouselProps {
  items?: Array<{
    image?: string | ImageValue;
    title?: string;
    description?: string;
    link?: string;
    buttonText?: string;
  }>;
  autoplay?: boolean;
  interval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  aspectRatio?: "video" | "square" | "wide" | "auto";
  borderRadius?: "none" | "sm" | "md" | "lg" | "xl";
  overlay?: boolean;
  overlayOpacity?: number;
  textColor?: string;
  id?: string;
  className?: string;
}

export function CarouselRender({
  items = [],
  autoplay = false,
  interval = 5000,
  showDots = true,
  showArrows = true,
  aspectRatio = "video",
  borderRadius = "lg",
  overlay = true,
  overlayOpacity = 40,
  textColor = "#ffffff",
  id,
  className = "",
}: CarouselProps) {
  const aspectClasses = { video: "aspect-video", square: "aspect-square", wide: "aspect-[21/9]", auto: "" }[aspectRatio];
  const radiusClasses = { none: "", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", xl: "rounded-xl" }[borderRadius];

  return (
    <div id={id} className={`relative overflow-hidden ${radiusClasses} ${className}`}>
      <div className={`flex transition-transform duration-500 ${aspectClasses}`}>
        {items.map((item, i) => {
          const itemImageUrl = getImageUrl(item.image);
          return (
          <div key={i} className="flex-none w-full h-full relative">
            <img src={itemImageUrl || "/placeholder.svg"} alt={item.title || `Slide ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
            {overlay && <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity / 100})` }} />}
            {(item.title || item.description) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                {item.title && <h3 className="text-xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-4" style={{ color: textColor }}>{item.title}</h3>}
                {item.description && <p className="text-sm md:text-lg max-w-2xl mb-4" style={{ color: textColor }}>{item.description}</p>}
                {item.link && item.buttonText && <a href={item.link} className="px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-colors" style={{ backgroundColor: "rgba(255,255,255,0.95)", color: "#111827" }}>{item.buttonText}</a>}
              </div>
            )}
          </div>
        )})}
      </div>
      {showArrows && items.length > 1 && (
        <>
          <button className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full shadow-lg transition-colors" style={{ backgroundColor: "rgba(255,255,255,0.8)" }} aria-label="Previous slide">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full shadow-lg transition-colors" style={{ backgroundColor: "rgba(255,255,255,0.8)" }} aria-label="Next slide">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </>
      )}
      {showDots && items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {items.map((_, i) => <button key={i} className={`w-2.5 h-2.5 rounded-full transition-colors`} style={{ backgroundColor: i === 0 ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.5)" }} aria-label={`Go to slide ${i + 1}`} />)}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COUNTDOWN - Countdown Timer
// ============================================================================

export interface CountdownProps {
  targetDate?: string;
  title?: string;
  subtitle?: string;
  labels?: { days?: string; hours?: string; minutes?: string; seconds?: string };
  variant?: "simple" | "cards" | "circles";
  size?: "sm" | "md" | "lg";
  backgroundColor?: string;
  cardBackgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  showLabels?: boolean;
  id?: string;
  className?: string;
}

export function CountdownRender({
  targetDate,
  title,
  subtitle,
  labels = { days: "Days", hours: "Hours", minutes: "Minutes", seconds: "Seconds" },
  variant = "simple",
  size = "md",
  backgroundColor,
  cardBackgroundColor = "#f3f4f6",
  textColor,
  accentColor = "#3b82f6",
  showLabels = true,
  id,
  className = "",
}: CountdownProps) {
  const sizeClasses = {
    sm: { number: "text-2xl md:text-3xl", label: "text-xs", gap: "gap-3 md:gap-4", padding: "p-3" },
    md: { number: "text-3xl md:text-5xl", label: "text-xs md:text-sm", gap: "gap-4 md:gap-6", padding: "p-4 md:p-5" },
    lg: { number: "text-4xl md:text-6xl lg:text-7xl", label: "text-sm md:text-base", gap: "gap-6 md:gap-8", padding: "p-5 md:p-6" },
  }[size];

  const units = [
    { value: "00", label: labels.days },
    { value: "00", label: labels.hours },
    { value: "00", label: labels.minutes },
    { value: "00", label: labels.seconds },
  ];

  return (
    <div id={id} className={`text-center ${className}`} style={{ backgroundColor }}>
      {title && <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2" style={{ color: textColor }}>{title}</h2>}
      {subtitle && <p className="text-sm md:text-base opacity-80 mb-6 md:mb-8" style={{ color: textColor }}>{subtitle}</p>}
      <div className={`flex justify-center ${sizeClasses.gap}`}>
        {units.map((unit, i) => (
          <div key={i} className={`text-center ${variant === "cards" ? `${sizeClasses.padding} rounded-xl` : ""}`} style={variant === "cards" ? { backgroundColor: cardBackgroundColor } : undefined}>
            <div className={`${sizeClasses.number} font-bold tabular-nums`} style={{ color: accentColor }}>{unit.value}</div>
            {showLabels && <div className={`${sizeClasses.label} opacity-75 mt-1`} style={{ color: textColor }}>{unit.label}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// PRICING - Pricing Plans
// ============================================================================

export interface PricingProps {
  title?: string;
  subtitle?: string;
  description?: string;
  plans?: Array<{
    name?: string;
    price?: string;
    period?: string;
    description?: string;
    features?: string[];
    buttonText?: string;
    buttonLink?: string;
    popular?: boolean;
    badge?: string;
  }>;
  variant?: "cards" | "comparison" | "simple";
  columns?: 2 | 3 | 4;
  backgroundColor?: string;
  cardBackgroundColor?: string;
  popularBorderColor?: string;
  textColor?: string;
  paddingY?: "sm" | "md" | "lg" | "xl";
  id?: string;
  className?: string;
}

export function PricingRender({
  title = "Pricing Plans",
  subtitle,
  description,
  plans = [],
  variant = "cards",
  columns = 3,
  backgroundColor = "#ffffff",
  cardBackgroundColor = "#ffffff",
  popularBorderColor = "#3b82f6",
  textColor,
  paddingY = "lg",
  id,
  className = "",
}: PricingProps) {
  const paddingClasses = { sm: "py-12 md:py-16", md: "py-16 md:py-20", lg: "py-20 md:py-28", xl: "py-24 md:py-32" }[paddingY];
  const colClasses = { 2: "md:grid-cols-2 max-w-3xl", 3: "md:grid-cols-2 lg:grid-cols-3", 4: "md:grid-cols-2 lg:grid-cols-4" }[columns];

  return (
    <section id={id} className={`w-full ${paddingClasses} px-4 ${className}`} style={{ backgroundColor }}>
      <div className="max-w-screen-xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          {subtitle && <p className="text-sm md:text-base font-semibold uppercase tracking-wider mb-2" style={{ color: popularBorderColor }}>{subtitle}</p>}
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4" style={{ color: textColor }}>{title}</h2>
          {description && <p className="text-base md:text-lg max-w-2xl mx-auto opacity-80" style={{ color: textColor }}>{description}</p>}
        </div>
        <div className={`grid grid-cols-1 ${colClasses} gap-6 md:gap-8 mx-auto`}>
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`relative p-6 md:p-8 rounded-xl border-2 transition-all duration-300 hover:shadow-xl ${plan.popular ? "shadow-lg scale-[1.02]" : "hover:-translate-y-1"}`}
              style={{
                backgroundColor: cardBackgroundColor,
                borderColor: plan.popular ? popularBorderColor : `${textColor || "#000000"}15`,
              }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-semibold text-white rounded-full" style={{ backgroundColor: popularBorderColor }}>
                  {plan.badge || "Most Popular"}
                </div>
              )}
              <h3 className="text-lg md:text-xl font-bold mb-2" style={{ color: textColor }}>{plan.name}</h3>
              {plan.description && <p className="text-sm opacity-75 mb-4" style={{ color: textColor }}>{plan.description}</p>}
              <div className="mb-6">
                <span className="text-3xl md:text-4xl lg:text-5xl font-bold" style={{ color: textColor }}>{plan.price}</span>
                {plan.period && <span className="text-sm opacity-75 ml-1" style={{ color: textColor }}>/{plan.period}</span>}
              </div>
              <ul className="space-y-3 mb-8">
                {(Array.isArray(plan.features) ? plan.features : []).map((feature: string | { text?: string; label?: string }, j: number) => {
                  // Handle both string array and object array formats
                  const featureText = typeof feature === 'string' ? feature : (feature?.text || feature?.label || '');
                  if (!featureText) return null;
                  return (
                    <li key={j} className="flex items-start gap-3 text-sm" style={{ color: textColor }}>
                      <svg className="w-5 h-5 flex-shrink-0 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {featureText}
                    </li>
                  );
                })}
              </ul>
              <a
                href={plan.buttonLink || "#"}
                className={`block w-full py-3 text-center font-medium rounded-lg transition-all ${plan.popular ? "text-white hover:opacity-90" : "border-2 hover:opacity-80"}`}
                style={plan.popular ? { backgroundColor: popularBorderColor } : { borderColor: popularBorderColor, color: popularBorderColor }}
              >
                {plan.buttonText || "Get Started"}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// ACCORDION - Expandable Content
// ============================================================================

export interface AccordionProps {
  items?: Array<{
    title?: string;
    content?: string;
    icon?: string;
    defaultOpen?: boolean;
  }>;
  variant?: "simple" | "bordered" | "separated" | "filled";
  allowMultiple?: boolean;
  iconPosition?: "left" | "right";
  backgroundColor?: string;
  borderColor?: string;
  activeColor?: string;
  textColor?: string;
  id?: string;
  className?: string;
}

export function AccordionRender({
  items = [],
  variant = "bordered",
  allowMultiple = true,
  iconPosition = "right",
  backgroundColor = "#ffffff",
  borderColor = "#e5e7eb",
  activeColor = "#3b82f6",
  textColor,
  id,
  className = "",
}: AccordionProps) {
  const variantClasses = {
    simple: "",
    bordered: "border rounded-lg overflow-hidden divide-y",
    separated: "space-y-3",
    filled: "space-y-2",
  }[variant];

  const itemClasses = {
    simple: "border-b last:border-b-0",
    bordered: "",
    separated: "border rounded-lg overflow-hidden",
    filled: "rounded-lg overflow-hidden",
  }[variant];

  return (
    <div id={id} className={`${variantClasses} ${className}`} style={{ borderColor }}>
      {items.map((item, i) => (
        <details
          key={i}
          open={item.defaultOpen}
          className={`group ${itemClasses}`}
          style={variant === "filled" ? { backgroundColor: "#f9fafb" } : { backgroundColor }}
        >
          <summary className={`p-4 md:p-5 cursor-pointer list-none flex items-center ${iconPosition === "left" ? "flex-row-reverse justify-end" : "justify-between"} gap-4 font-medium transition-colors hover:opacity-80`} style={{ color: textColor }}>
            <span className="flex-1">{item.title}</span>
            <svg className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-open:rotate-180`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="px-4 md:px-5 pb-4 md:pb-5 text-sm md:text-base leading-relaxed opacity-80" style={{ color: textColor }}>
            {item.content}
          </div>
        </details>
      ))}
    </div>
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
  }>;
  defaultTab?: number;
  variant?: "underline" | "pills" | "boxed";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  centered?: boolean;
  backgroundColor?: string;
  activeColor?: string;
  textColor?: string;
  id?: string;
  className?: string;
}

export function TabsRender({
  tabs = [],
  defaultTab = 0,
  variant = "underline",
  size = "md",
  fullWidth = false,
  centered = false,
  backgroundColor,
  activeColor = "#3b82f6",
  textColor,
  id,
  className = "",
}: TabsProps) {
  const sizeClasses = { sm: "text-sm px-3 py-1.5", md: "text-base px-4 py-2", lg: "text-lg px-5 py-2.5" }[size];

  const variantClasses = {
    underline: "border-b-2 border-transparent data-[active=true]:border-current",
    pills: "rounded-lg data-[active=true]:bg-blue-100 data-[active=true]:text-blue-600",
    boxed: "border-2 border-transparent data-[active=true]:border-gray-300 data-[active=true]:bg-white rounded-t-lg",
  }[variant];

  return (
    <div id={id} className={className} style={{ backgroundColor }}>
      <div className={`flex ${fullWidth ? "w-full" : ""} ${centered ? "justify-center" : ""} ${variant === "underline" ? "border-b border-gray-200" : ""} ${variant === "boxed" ? "bg-gray-100 p-1 rounded-lg gap-1" : "gap-1"}`}>
        {tabs.map((tab, i) => (
          <button
            key={i}
            data-active={i === defaultTab}
            className={`${sizeClasses} ${variantClasses} ${fullWidth ? "flex-1" : ""} font-medium transition-all`}
            style={{ color: i === defaultTab ? activeColor : textColor }}
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>
      {tabs[defaultTab]?.content && (
        <div className="p-4 md:p-6" style={{ color: textColor }}>
          {tabs[defaultTab].content}
        </div>
      )}
    </div>
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
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
  closeOnOverlay?: boolean;
  centered?: boolean;
  backgroundColor?: string;
  overlayOpacity?: number;
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
  showCloseButton = true,
  closeOnOverlay = true,
  centered = true,
  backgroundColor = "#ffffff",
  overlayOpacity = 50,
  id,
  className = "",
  onClose,
}: ModalProps) {
  const sizeClasses = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg", xl: "max-w-xl", full: "max-w-full mx-4" }[size];

  if (!isOpen) return null;

  return (
    <div id={id} className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${centered ? "" : "items-start pt-20"} ${className}`} role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black transition-opacity" style={{ opacity: overlayOpacity / 100 }} onClick={closeOnOverlay ? onClose : undefined} aria-hidden="true" />
      <div className={`relative ${sizeClasses} w-full p-6 md:p-8 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200`} style={{ backgroundColor }}>
        {showCloseButton && (
          <button className="absolute top-4 right-4 p-1 rounded-lg hover:opacity-80 transition-colors" onClick={onClose} aria-label="Close modal">
            <svg className="w-5 h-5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {title && <h2 className="text-xl md:text-2xl font-bold mb-2">{title}</h2>}
        {description && <p className="opacity-70 mb-6">{description}</p>}
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// BADGE - Status/Label Badge
// ============================================================================

export interface BadgeProps {
  text?: string;
  variant?: "default" | "primary" | "success" | "warning" | "error" | "info";
  size?: "sm" | "md" | "lg";
  rounded?: "default" | "full";
  outline?: boolean;
  dot?: boolean;
  icon?: React.ReactNode;
  backgroundColor?: string;
  textColor?: string;
  id?: string;
  className?: string;
}

export function BadgeRender({
  text = "Badge",
  variant = "default",
  size = "md",
  rounded = "full",
  outline = false,
  dot = false,
  icon,
  backgroundColor,
  textColor,
  id,
  className = "",
}: BadgeProps) {
  const sizeClasses = { sm: "text-xs px-2 py-0.5", md: "text-xs px-2.5 py-1", lg: "text-sm px-3 py-1" }[size];
  const roundedClasses = { default: "rounded-md", full: "rounded-full" }[rounded];

  const variantStyles: Record<string, { bg: string; text: string; border: string }> = {
    default: { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" },
    primary: { bg: "#dbeafe", text: "#1e40af", border: "#93c5fd" },
    success: { bg: "#dcfce7", text: "#166534", border: "#86efac" },
    warning: { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
    error: { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
    info: { bg: "#e0f2fe", text: "#075985", border: "#7dd3fc" },
  };

  const styles = variantStyles[variant];

  return (
    <span
      id={id}
      className={`inline-flex items-center gap-1.5 font-medium ${sizeClasses} ${roundedClasses} ${outline ? "border-2 bg-transparent" : ""} ${className}`}
      style={{
        backgroundColor: backgroundColor || (outline ? "transparent" : styles.bg),
        color: textColor || styles.text,
        borderColor: outline ? styles.border : undefined,
      }}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: textColor || styles.text }} />}
      {icon}
      {text}
    </span>
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
  id,
  className = "",
}: AvatarProps) {
  // Normalize src image
  const srcUrl = getImageUrl(src);
  const srcAlt = getImageAlt(src) || alt;
  
  const sizeClasses = { xs: "w-6 h-6 text-xs", sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-12 h-12 text-base", xl: "w-16 h-16 text-lg", "2xl": "w-20 h-20 text-xl" }[size];
  const shapeClasses = { circle: "rounded-full", rounded: "rounded-lg", square: "rounded-none" }[shape];
  const statusSizeClasses = { xs: "w-1.5 h-1.5", sm: "w-2 h-2", md: "w-2.5 h-2.5", lg: "w-3 h-3", xl: "w-3.5 h-3.5", "2xl": "w-4 h-4" }[size];
  const statusPositionClasses = { "top-right": "top-0 right-0", "bottom-right": "bottom-0 right-0" }[statusPosition];
  const statusColors = { online: "#22c55e", offline: "#6b7280", busy: "#ef4444", away: "#f59e0b" };

  const initials = name ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "";

  return (
    <div id={id} className={`relative inline-flex ${className}`}>
      {srcUrl ? (
        <img src={srcUrl} alt={srcAlt} className={`${sizeClasses} ${shapeClasses} object-cover ${border ? "ring-2 ring-white" : ""}`} loading="lazy" />
      ) : (
        <div className={`${sizeClasses} ${shapeClasses} flex items-center justify-center font-medium ${border ? "ring-2 ring-white" : ""}`} style={{ backgroundColor: fallbackColor }}>
          {initials}
        </div>
      )}
      {status && (
        <span className={`absolute ${statusPositionClasses} ${statusSizeClasses} rounded-full ring-2 ring-white`} style={{ backgroundColor: statusColors[status] }} aria-label={status} />
      )}
    </div>
  );
}

// ============================================================================
// PROGRESS - Progress Bar
// ============================================================================

export interface ProgressProps {
  value?: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "gradient" | "striped";
  color?: string;
  backgroundColor?: string;
  rounded?: boolean;
  animate?: boolean;
  id?: string;
  className?: string;
}

export function ProgressRender({
  value = 0,
  max = 100,
  label,
  showValue = false,
  size = "md",
  variant = "default",
  color = "#3b82f6",
  backgroundColor = "#e5e7eb",
  rounded = true,
  animate = false,
  id,
  className = "",
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const sizeClasses = { sm: "h-1.5", md: "h-2.5", lg: "h-4" }[size];

  return (
    <div id={id} className={className}>
      {(label || showValue) && (
        <div className="flex justify-between mb-1.5 text-sm">
          {label && <span className="font-medium text-gray-700">{label}</span>}
          {showValue && <span className="text-gray-500">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className={`w-full ${sizeClasses} ${rounded ? "rounded-full" : ""} overflow-hidden`} style={{ backgroundColor }} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
        <div
          className={`h-full transition-all duration-500 ${rounded ? "rounded-full" : ""} ${animate ? "animate-pulse" : ""} ${variant === "striped" ? "bg-[length:1rem_1rem] bg-gradient-to-r from-white/20 via-transparent to-transparent" : ""}`}
          style={{
            width: `${percentage}%`,
            backgroundColor: variant === "gradient" ? undefined : color,
            backgroundImage: variant === "gradient" ? `linear-gradient(90deg, ${color}, #8b5cf6)` : undefined,
          }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// ALERT - Alert/Notification
// ============================================================================

export interface AlertProps {
  title?: string;
  message?: string;
  variant?: "info" | "success" | "warning" | "error";
  size?: "sm" | "md" | "lg";
  icon?: boolean;
  closable?: boolean;
  action?: { label?: string; onClick?: () => void };
  id?: string;
  className?: string;
  onClose?: () => void;
}

export function AlertRender({
  title,
  message,
  variant = "info",
  size = "md",
  icon = true,
  closable = false,
  action,
  id,
  className = "",
  onClose,
}: AlertProps) {
  const variantStyles: Record<string, { bg: string; border: string; text: string; iconColor: string }> = {
    info: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", iconColor: "text-blue-500" },
    success: { bg: "bg-green-50", border: "border-green-200", text: "text-green-800", iconColor: "text-green-500" },
    warning: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-800", iconColor: "text-yellow-500" },
    error: { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", iconColor: "text-red-500" },
  };

  const icons: Record<string, React.ReactNode> = {
    info: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    success: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
    warning: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
    error: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />,
  };

  const styles = variantStyles[variant];
  const sizeClasses = { sm: "p-3 text-sm", md: "p-4 text-base", lg: "p-5 text-lg" }[size];

  return (
    <div id={id} className={`${styles.bg} ${styles.text} border ${styles.border} rounded-lg ${sizeClasses} ${className}`} role="alert">
      <div className="flex items-start gap-3">
        {icon && (
          <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${styles.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {icons[variant]}
          </svg>
        )}
        <div className="flex-1">
          {title && <p className="font-semibold mb-1">{title}</p>}
          {message && <p className="opacity-90">{message}</p>}
          {action && (
            <button className="mt-2 font-medium underline hover:no-underline" onClick={action.onClick}>
              {action.label}
            </button>
          )}
        </div>
        {closable && (
          <button className="p-1 hover:opacity-75 transition-opacity" onClick={onClose} aria-label="Close">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// TOOLTIP - Hover Tooltip
// ============================================================================

export interface TooltipProps {
  children?: React.ReactNode;
  text?: string;
  position?: "top" | "bottom" | "left" | "right";
  variant?: "dark" | "light";
  delay?: number;
  id?: string;
  className?: string;
}

export function TooltipRender({
  children,
  text = "Tooltip",
  position = "top",
  variant = "dark",
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

  const variantClasses = {
    dark: "bg-gray-900 text-white",
    light: "bg-white text-gray-900 border shadow-lg",
  }[variant];

  return (
    <span id={id} className={`relative inline-flex group ${className}`}>
      {children}
      <span className={`absolute ${positionClasses} ${variantClasses} px-2 py-1 text-xs rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50`}>
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
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  loop?: boolean;
  cursor?: boolean;
  cursorChar?: string;
  textSize?: ResponsiveValue<"xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl">;
  textColor?: string;
  fontWeight?: "normal" | "medium" | "semibold" | "bold";
  prefix?: string;
  suffix?: string;
  id?: string;
  className?: string;
}

export function TypewriterRender({
  texts = ["Hello World", "Welcome", "Start Typing"],
  typingSpeed = 100,
  deletingSpeed = 50,
  pauseDuration = 2000,
  loop = true,
  cursor = true,
  cursorChar = "|",
  textSize = "2xl",
  textColor = "text-gray-900",
  fontWeight = "bold",
  prefix = "",
  suffix = "",
  id,
  className = "",
}: TypewriterProps) {
  const sizeClasses = getResponsiveClasses(textSize, {
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

  const weightClasses = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
  }[fontWeight];

  // In production, this would use React state and useEffect for animation
  // For SSR/preview, we show the first text
  const displayText = texts[0] || "Type something...";

  return (
    <span id={id} className={`inline-flex items-center ${sizeClasses} ${textColor} ${weightClasses} ${className}`}>
      {prefix && <span className="mr-1">{prefix}</span>}
      <span className="typewriter-text">{displayText}</span>
      {cursor && (
        <span className="animate-pulse ml-0.5">{cursorChar}</span>
      )}
      {suffix && <span className="ml-1">{suffix}</span>}
    </span>
  );
}

// ============================================================================
// PARALLAX - Parallax Scrolling Background
// ============================================================================

export interface ParallaxProps {
  children?: React.ReactNode;
  backgroundImage?: string | ImageValue;
  backgroundPosition?: "center" | "top" | "bottom";
  speed?: number;
  overlay?: boolean;
  overlayColor?: string;
  overlayOpacity?: number;
  minHeight?: ResponsiveValue<"sm" | "md" | "lg" | "xl" | "screen" | "auto">;
  contentAlignment?: "start" | "center" | "end";
  id?: string;
  className?: string;
}

export function ParallaxRender({
  children,
  backgroundImage = "/placeholder.jpg",
  backgroundPosition = "center",
  speed = 0.5,
  overlay = true,
  overlayColor = "bg-black",
  overlayOpacity = 50,
  minHeight = "lg",
  contentAlignment = "center",
  id,
  className = "",
}: ParallaxProps) {
  // Normalize image value
  const bgImageUrl = getImageUrl(backgroundImage) || "/placeholder.jpg";
  
  const heightClasses = getResponsiveClasses(minHeight, {
    sm: ["min-h-[200px]", "md:min-h-[250px]", "lg:min-h-[300px]"],
    md: ["min-h-[300px]", "md:min-h-[400px]", "lg:min-h-[500px]"],
    lg: ["min-h-[400px]", "md:min-h-[500px]", "lg:min-h-[600px]"],
    xl: ["min-h-[500px]", "md:min-h-[600px]", "lg:min-h-[800px]"],
    screen: ["min-h-screen", "md:min-h-screen", "lg:min-h-screen"],
    auto: ["min-h-auto", "md:min-h-auto", "lg:min-h-auto"],
  });

  const alignmentClasses = {
    start: "items-start justify-start",
    center: "items-center justify-center",
    end: "items-end justify-end",
  }[contentAlignment];

  const positionClasses = {
    center: "bg-center",
    top: "bg-top",
    bottom: "bg-bottom",
  }[backgroundPosition];

  return (
    <div
      id={id}
      className={`relative overflow-hidden ${heightClasses} ${className}`}
      style={{
        backgroundImage: `url(${bgImageUrl})`,
        backgroundAttachment: "fixed",
        backgroundSize: "cover",
      }}
    >
      <div className={`absolute inset-0 ${positionClasses} bg-cover bg-fixed`} />
      {overlay && (
        <div 
          className={`absolute inset-0 ${overlayColor}`}
          style={{ opacity: overlayOpacity / 100 }}
        />
      )}
      <div className={`relative z-10 flex ${alignmentClasses} w-full h-full p-4 md:p-8 lg:p-12`}>
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// ANNOUNCEMENT BAR - Top Banner Notification
// ============================================================================

export interface AnnouncementBarProps {
  text?: string;
  link?: string;
  linkText?: string;
  dismissible?: boolean;
  position?: "top" | "bottom";
  variant?: "default" | "success" | "warning" | "error" | "info" | "gradient";
  icon?: React.ReactNode;
  textAlign?: "left" | "center" | "right";
  size?: "sm" | "md" | "lg";
  sticky?: boolean;
  id?: string;
  className?: string;
}

export function AnnouncementBarRender({
  text = "📢 Big announcement! Check out our latest updates.",
  link,
  linkText = "Learn more →",
  dismissible = true,
  position = "top",
  variant = "default",
  icon,
  textAlign = "center",
  size = "md",
  sticky = true,
  id,
  className = "",
}: AnnouncementBarProps) {
  const variantClasses = {
    default: "bg-gray-900 text-white",
    success: "bg-green-600 text-white",
    warning: "bg-yellow-500 text-black",
    error: "bg-red-600 text-white",
    info: "bg-blue-600 text-white",
    gradient: "bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 text-white",
  }[variant];

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

  const positionClasses = position === "top" ? "top-0" : "bottom-0";
  const stickyClasses = sticky ? `sticky ${positionClasses} z-50` : "";

  return (
    <div
      id={id}
      className={`w-full ${variantClasses} ${sizeClasses} ${stickyClasses} ${className}`}
    >
      <div className={`max-w-7xl mx-auto flex items-center gap-2 md:gap-4 ${alignClasses}`}>
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span className="flex-1 md:flex-none">{text}</span>
        {link && (
          <a
            href={link}
            className="font-semibold underline underline-offset-2 hover:no-underline flex-shrink-0"
          >
            {linkText}
          </a>
        )}
        {dismissible && (
          <button className="ml-2 md:ml-4 p-1 rounded hover:bg-white/20 transition-colors flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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

export interface SocialProofProps {
  rating?: number;
  maxRating?: number;
  reviewCount?: number;
  platform?: string;
  platformLogo?: string | ImageValue;
  variant?: "stars" | "score" | "compact" | "detailed";
  size?: ResponsiveValue<"sm" | "md" | "lg">;
  showCount?: boolean;
  showPlatform?: boolean;
  starColor?: string;
  id?: string;
  className?: string;
}

export function SocialProofRender({
  rating = 4.8,
  maxRating = 5,
  reviewCount = 1250,
  platform = "Google Reviews",
  platformLogo,
  variant = "stars",
  size = "md",
  showCount = true,
  showPlatform = true,
  starColor = "text-yellow-400",
  id,
  className = "",
}: SocialProofProps) {
  // Normalize platformLogo image
  const platformLogoUrl = getImageUrl(platformLogo);
  
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
    <div className="flex items-center">
      {[...Array(fullStars)].map((_, i) => (
        <svg key={`full-${i}`} className={`${starSize} ${starColor} fill-current`} viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      ))}
      {hasHalfStar && (
        <svg className={`${starSize} ${starColor}`} viewBox="0 0 20 20">
          <defs>
            <linearGradient id="halfStar">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="#D1D5DB" />
            </linearGradient>
          </defs>
          <path fill="url(#halfStar)" d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <svg key={`empty-${i}`} className={`${starSize} text-gray-300 fill-current`} viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      ))}
    </div>
  );

  if (variant === "compact") {
    return (
      <div id={id} className={`inline-flex items-center ${sizeClasses} ${className}`}>
        <svg className={`${starSize} ${starColor} fill-current`} viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
        <span className="font-semibold ml-1">{rating}</span>
        {showCount && <span className="text-gray-500">({reviewCount.toLocaleString()})</span>}
      </div>
    );
  }

  if (variant === "score") {
    return (
      <div id={id} className={`inline-flex items-center ${sizeClasses} ${className}`}>
        <div className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-lg bg-green-500 text-white font-bold text-lg md:text-xl">
          {rating}
        </div>
        <div className="ml-3">
          <div className="font-semibold">Excellent</div>
          {showCount && <div className="text-gray-500">{reviewCount.toLocaleString()} reviews</div>}
          {showPlatform && <div className="text-gray-400 text-xs">{platform}</div>}
        </div>
      </div>
    );
  }

  return (
    <div id={id} className={`inline-flex flex-col items-center ${sizeClasses} ${className}`}>
      {renderStars()}
      <div className="flex items-center gap-1 mt-1">
        <span className="font-semibold">{rating}</span>
        {showCount && <span className="text-gray-500">({reviewCount.toLocaleString()} reviews)</span>}
      </div>
      {showPlatform && (
        <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
          {platformLogoUrl && <img src={platformLogoUrl} alt={platform} className="w-4 h-4" />}
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
  image: string;
  alt: string;
  link?: string;
}

export interface TrustBadgesProps {
  badges?: TrustBadge[];
  title?: string;
  layout?: ResponsiveValue<"row" | "grid">;
  columns?: ResponsiveValue<2 | 3 | 4 | 5 | 6>;
  size?: ResponsiveValue<"sm" | "md" | "lg">;
  grayscale?: boolean;
  hoverEffect?: boolean;
  gap?: ResponsiveValue<"sm" | "md" | "lg">;
  alignment?: "start" | "center" | "end";
  id?: string;
  className?: string;
}

export function TrustBadgesRender({
  badges = [
    { image: "/badges/ssl.svg", alt: "SSL Secure" },
    { image: "/badges/money-back.svg", alt: "Money Back Guarantee" },
    { image: "/badges/verified.svg", alt: "Verified Business" },
    { image: "/badges/support.svg", alt: "24/7 Support" },
  ],
  title,
  layout = "row",
  columns = 4,
  size = "md",
  grayscale = false,
  hoverEffect = true,
  gap = "md",
  alignment = "center",
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
    <div id={id} className={className}>
      {title && (
        <p className="text-xs md:text-sm text-gray-500 text-center mb-4">{title}</p>
      )}
      <div className={`${layoutClasses} ${typeof layout === "object" && layout.mobile === "grid" ? columnClasses : ""} ${gapClasses} ${alignClasses} items-center`}>
        {badges.map((badge, index) => {
          const imageElement = (
            <img
              src={badge.image}
              alt={badge.alt}
              className={`${sizeClasses} w-auto object-contain transition-all duration-300 ${
                grayscale ? "grayscale hover:grayscale-0" : ""
              } ${hoverEffect ? "hover:scale-110 hover:opacity-100 opacity-70" : ""}`}
            />
          );

          return badge.link ? (
            <a key={index} href={badge.link} target="_blank" rel="noopener noreferrer">
              {imageElement}
            </a>
          ) : (
            <div key={index}>{imageElement}</div>
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
  columns?: ResponsiveValue<2 | 3 | 4 | 5 | 6>;
  grayscale?: boolean;
  hoverColor?: boolean;
  variant?: "simple" | "cards" | "marquee";
  gap?: ResponsiveValue<"sm" | "md" | "lg" | "xl">;
  logoHeight?: ResponsiveValue<"sm" | "md" | "lg">;
  background?: string;
  padding?: ResponsiveValue<"none" | "sm" | "md" | "lg">;
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
  columns = { mobile: 2, tablet: 3, desktop: 6 },
  grayscale = true,
  hoverColor = true,
  variant = "simple",
  gap = "lg",
  logoHeight = "md",
  background,
  padding = "lg",
  id,
  className = "",
}: LogoCloudProps) {
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

  const paddingClasses = getResponsiveClasses(padding, {
    none: ["p-0", "md:p-0", "lg:p-0"],
    sm: ["py-6 px-4", "md:py-8 md:px-6", "lg:py-10 lg:px-8"],
    md: ["py-10 px-4", "md:py-12 md:px-8", "lg:py-16 lg:px-12"],
    lg: ["py-12 px-4", "md:py-16 md:px-8", "lg:py-20 lg:px-16"],
  });

  const renderLogo = (logo: LogoItem, index: number) => {
    const imgClasses = `${heightClasses} w-auto object-contain transition-all duration-300 ${
      grayscale ? "grayscale" : ""
    } ${hoverColor && grayscale ? "hover:grayscale-0" : ""} ${
      variant === "cards" ? "" : "opacity-60 hover:opacity-100"
    }`;

    const img = <img src={logo.image} alt={logo.alt} className={imgClasses} />;

    if (variant === "cards") {
      const cardContent = (
        <div className="flex items-center justify-center p-4 md:p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
          {img}
        </div>
      );
      return logo.link ? (
        <a key={index} href={logo.link} target="_blank" rel="noopener noreferrer">
          {cardContent}
        </a>
      ) : (
        <div key={index}>{cardContent}</div>
      );
    }

    return logo.link ? (
      <a key={index} href={logo.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
        {img}
      </a>
    ) : (
      <div key={index} className="flex items-center justify-center">
        {img}
      </div>
    );
  };

  if (variant === "marquee") {
    return (
      <div id={id} className={`${paddingClasses} ${background || ""} overflow-hidden ${className}`}>
        {(title || subtitle) && (
          <div className="text-center mb-8 md:mb-12">
            {title && <h3 className="text-sm md:text-base font-semibold text-gray-500 uppercase tracking-wide">{title}</h3>}
            {subtitle && <p className="text-gray-400 mt-2">{subtitle}</p>}
          </div>
        )}
        <div className="flex animate-marquee">
          {[...logos, ...logos].map((logo, index) => (
            <div key={index} className="flex-shrink-0 mx-8 md:mx-12">
              {renderLogo(logo, index)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div id={id} className={`${paddingClasses} ${background || ""} ${className}`}>
      {(title || subtitle) && (
        <div className="text-center mb-8 md:mb-12">
          {title && <h3 className="text-sm md:text-base font-semibold text-gray-500 uppercase tracking-wide">{title}</h3>}
          {subtitle && <p className="text-gray-400 mt-2">{subtitle}</p>}
        </div>
      )}
      <div className={`grid ${columnClasses} ${gapClasses} items-center`}>
        {logos.map((logo, index) => renderLogo(logo, index))}
      </div>
    </div>
  );
}

// ============================================================================
// COMPARISON TABLE - Feature Comparison
// ============================================================================

export interface ComparisonColumn {
  name: string;
  highlight?: boolean;
  price?: string;
  priceSubtext?: string;
}

export interface ComparisonRow {
  feature: string;
  tooltip?: string;
  values: (boolean | string)[];
}

export interface ComparisonTableProps {
  columns?: ComparisonColumn[];
  rows?: ComparisonRow[];
  title?: string;
  subtitle?: string;
  variant?: "simple" | "cards" | "striped";
  highlightColor?: string;
  checkColor?: string;
  crossColor?: string;
  stickyHeader?: boolean;
  stickyColumn?: boolean;
  id?: string;
  className?: string;
}

export function ComparisonTableRender({
  columns = [
    { name: "Basic", price: "K9/mo" },
    { name: "Pro", price: "K29/mo", highlight: true },
    { name: "Enterprise", price: "K99/mo" },
  ],
  rows = [
    { feature: "Users", values: ["1", "5", "Unlimited"] },
    { feature: "Storage", values: ["5GB", "50GB", "500GB"] },
    { feature: "API Access", values: [false, true, true] },
    { feature: "Priority Support", values: [false, false, true] },
    { feature: "Custom Domain", values: [false, true, true] },
  ],
  title,
  subtitle,
  variant = "simple",
  highlightColor = "bg-blue-50 border-blue-500",
  checkColor = "text-green-500",
  crossColor = "text-gray-300",
  stickyHeader = true,
  stickyColumn = true,
  id,
  className = "",
}: ComparisonTableProps) {
  const renderValue = (value: boolean | string) => {
    if (typeof value === "boolean") {
      return value ? (
        <svg className={`w-5 h-5 mx-auto ${checkColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className={`w-5 h-5 mx-auto ${crossColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    }
    return <span className="text-sm md:text-base">{value}</span>;
  };

  return (
    <div id={id} className={className}>
      {(title || subtitle) && (
        <div className="text-center mb-8 md:mb-12">
          {title && <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>}
          {subtitle && <p className="text-gray-600 mt-2">{subtitle}</p>}
        </div>
      )}
      
      <div className="overflow-x-auto -mx-4 md:mx-0">
        <table className="w-full min-w-[600px]">
          <thead className={stickyHeader ? "sticky top-0 z-10" : ""}>
            <tr className="bg-gray-50">
              <th className={`text-left p-3 md:p-4 font-semibold text-gray-900 ${stickyColumn ? "sticky left-0 bg-gray-50 z-20" : ""}`}>
                Features
              </th>
              {columns.map((col, index) => (
                <th
                  key={index}
                  className={`text-center p-3 md:p-4 ${col.highlight ? highlightColor + " border-t-4" : ""}`}
                >
                  <div className="font-bold text-gray-900">{col.name}</div>
                  {col.price && <div className="text-lg md:text-xl font-bold mt-1">{col.price}</div>}
                  {col.priceSubtext && <div className="text-xs text-gray-500">{col.priceSubtext}</div>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={variant === "striped" && rowIndex % 2 === 1 ? "bg-gray-50" : ""}
              >
                <td className={`p-3 md:p-4 font-medium text-gray-900 border-b ${stickyColumn ? "sticky left-0 bg-white z-10" : ""}`}>
                  <span className="flex items-center gap-1">
                    {row.feature}
                    {row.tooltip && (
                      <span className="text-gray-400 cursor-help" title={row.tooltip}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                    )}
                  </span>
                </td>
                {row.values.map((value, colIndex) => (
                  <td
                    key={colIndex}
                    className={`p-3 md:p-4 text-center border-b ${columns[colIndex]?.highlight ? highlightColor.split(" ")[0] : ""}`}
                  >
                    {renderValue(value)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
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
    <div id={id} className={`rounded-lg overflow-hidden ${themeClasses} ${className}`}>
      {(title || showLanguage || showCopyButton) && (
        <div className={`flex items-center justify-between px-4 py-2 border-b ${headerThemeClasses}`}>
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
              <span className="text-xs font-mono uppercase opacity-70">{language}</span>
            )}
            {showCopyButton && (
              <button className="text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors">
                Copy
              </button>
            )}
          </div>
        </div>
      )}
      <div className={`overflow-auto ${heightClasses} p-4`}>
        <pre className={`font-mono text-sm ${wrap ? "whitespace-pre-wrap" : "whitespace-pre"}`}>
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
                    <span className={`select-none w-8 md:w-12 text-right pr-4 ${lineNumberClasses}`}>
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
  frontDescription?: string;
  backTitle?: string;
  backDescription?: string;
  flipOn?: "hover" | "click";
  width?: ResponsiveValue<"sm" | "md" | "lg" | "xl" | "full">;
  height?: ResponsiveValue<"sm" | "md" | "lg" | "xl">;
  borderRadius?: ResponsiveValue<"none" | "sm" | "md" | "lg" | "xl" | "2xl">;
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
  id?: string;
  className?: string;
  children?: React.ReactNode;
}

export function CardFlip3DRender({
  frontBackgroundColor = "#6366f1",
  backBackgroundColor = "#ec4899",
  frontImage,
  backImage,
  frontTitle = "Front Side",
  frontDescription = "Hover to flip",
  backTitle = "Back Side",
  backDescription = "Amazing content here",
  flipOn = "hover",
  width = "md",
  height = "md",
  borderRadius = "lg",
  shadow = "lg",
  id,
  className = "",
}: CardFlip3DProps) {
  const [isFlipped, setIsFlipped] = React.useState(false);
  
  // Normalize image values
  const frontImageUrl = getImageUrl(frontImage);
  const backImageUrl = getImageUrl(backImage);
  
  const widthMap: Record<string, string> = {
    sm: "w-48",
    md: "w-64",
    lg: "w-80",
    xl: "w-96",
    full: "w-full",
  };
  
  const heightMap: Record<string, string> = {
    sm: "h-48",
    md: "h-64",
    lg: "h-80",
    xl: "h-96",
  };
  
  const shadowMap: Record<string, string> = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
  };
  
  const widthClass = widthMap[typeof width === "string" ? width : width?.desktop || "md"];
  const heightClass = heightMap[typeof height === "string" ? height : height?.desktop || "md"];
  const radiusClasses = getResponsiveClasses(borderRadius, borderRadiusMap);
  
  return (
    <div
      id={id}
      className={`relative cursor-pointer ${widthClass} ${heightClass} ${className}`}
      style={{ perspective: "1000px" }}
      onMouseEnter={() => flipOn === "hover" && setIsFlipped(true)}
      onMouseLeave={() => flipOn === "hover" && setIsFlipped(false)}
      onClick={() => flipOn === "click" && setIsFlipped(!isFlipped)}
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 ${shadowMap[shadow]}`}
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front Face */}
        <div
          className={`absolute inset-0 w-full h-full ${radiusClasses} overflow-hidden flex flex-col items-center justify-center text-white p-6`}
          style={{
            backfaceVisibility: "hidden",
            backgroundColor: frontImageUrl ? undefined : frontBackgroundColor,
            backgroundImage: frontImageUrl ? `url(${frontImageUrl})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {frontImageUrl && <div className="absolute inset-0 bg-black/30" />}
          <div className="relative z-10 text-center">
            <h3 className="text-xl font-bold mb-2">{frontTitle}</h3>
            <p className="text-sm opacity-80">{frontDescription}</p>
          </div>
        </div>
        
        {/* Back Face */}
        <div
          className={`absolute inset-0 w-full h-full ${radiusClasses} overflow-hidden flex flex-col items-center justify-center text-white p-6`}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            backgroundColor: backImageUrl ? undefined : backBackgroundColor,
            backgroundImage: backImageUrl ? `url(${backImageUrl})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {backImageUrl && <div className="absolute inset-0 bg-black/30" />}
          <div className="relative z-10 text-center">
            <h3 className="text-xl font-bold mb-2">{backTitle}</h3>
            <p className="text-sm opacity-80">{backDescription}</p>
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
  description?: string;
  backgroundColor?: string;
  backgroundImage?: string | ImageValue;
  textColor?: string;
  maxRotation?: number;
  scale?: number;
  glare?: boolean;
  padding?: ResponsiveValue<"none" | "xs" | "sm" | "md" | "lg">;
  borderRadius?: ResponsiveValue<"none" | "sm" | "md" | "lg" | "xl" | "2xl">;
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
  id?: string;
  className?: string;
}

export function TiltCardRender({
  title = "Tilt Card",
  description = "Hover to see 3D tilt effect",
  backgroundColor = "#1f2937",
  backgroundImage,
  textColor = "#ffffff",
  maxRotation = 15,
  scale = 1.05,
  glare = true,
  padding = "lg",
  borderRadius = "xl",
  shadow = "xl",
  id,
  className = "",
}: TiltCardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [transform, setTransform] = React.useState("rotateX(0deg) rotateY(0deg)");
  const [glarePosition, setGlarePosition] = React.useState({ x: 50, y: 50 });
  
  // Normalize image value
  const bgImageUrl = getImageUrl(backgroundImage);
  
  const paddingClasses = getResponsiveClasses(padding, paddingYMap);
  const radiusClasses = getResponsiveClasses(borderRadius, borderRadiusMap);
  
  const shadowMap: Record<string, string> = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -maxRotation;
    const rotateY = ((x - centerX) / centerX) * maxRotation;
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`);
    setGlarePosition({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  };
  
  const handleMouseLeave = () => {
    setTransform("perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)");
  };
  
  return (
    <div
      id={id}
      ref={cardRef}
      className={`relative overflow-hidden ${radiusClasses} ${shadowMap[shadow]} ${paddingClasses} ${className}`}
      style={{
        backgroundColor: bgImageUrl ? undefined : backgroundColor,
        backgroundImage: bgImageUrl ? `url(${bgImageUrl})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: textColor,
        transform,
        transition: "transform 0.1s ease-out",
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {bgImageUrl && <div className="absolute inset-0 bg-black/30" />}
      {glare && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.3), transparent 50%)`,
          }}
        />
      )}
      <div className="relative z-10">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-sm opacity-80">{description}</p>
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
  description?: string;
  preset?: "light" | "dark" | "colored" | "subtle" | "heavy";
  blur?: number;
  tint?: string;
  borderOpacity?: number;
  padding?: ResponsiveValue<"none" | "xs" | "sm" | "md" | "lg">;
  borderRadius?: ResponsiveValue<"none" | "sm" | "md" | "lg" | "xl" | "2xl">;
  textColor?: string;
  id?: string;
  className?: string;
}

export function GlassCardRender({
  title = "Glass Card",
  description = "Beautiful frosted glass effect",
  preset = "light",
  blur = 10,
  tint,
  borderOpacity = 0.2,
  padding = "lg",
  borderRadius = "xl",
  textColor = "#ffffff",
  id,
  className = "",
}: GlassCardProps) {
  const presets = {
    light: { blur: 10, bg: "rgba(255,255,255,0.25)", border: 0.2 },
    dark: { blur: 12, bg: "rgba(0,0,0,0.3)", border: 0.1 },
    colored: { blur: 15, bg: "rgba(99,102,241,0.2)", border: 0.3 },
    subtle: { blur: 5, bg: "rgba(255,255,255,0.1)", border: 0 },
    heavy: { blur: 25, bg: "rgba(255,255,255,0.4)", border: 0.4 },
  };
  
  const config = presets[preset];
  const actualBlur = blur || config.blur;
  const actualTint = tint || config.bg;
  const actualBorderOpacity = borderOpacity ?? config.border;
  
  const paddingClasses = getResponsiveClasses(padding, paddingYMap);
  const radiusClasses = getResponsiveClasses(borderRadius, borderRadiusMap);
  
  return (
    <div
      id={id}
      className={`${paddingClasses} ${radiusClasses} ${className}`}
      style={{
        backgroundColor: actualTint,
        backdropFilter: `blur(${actualBlur}px) saturate(120%)`,
        WebkitBackdropFilter: `blur(${actualBlur}px) saturate(120%)`,
        border: actualBorderOpacity > 0 ? `1px solid rgba(255,255,255,${actualBorderOpacity})` : undefined,
        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
        color: textColor,
      }}
    >
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-sm opacity-80">{description}</p>
    </div>
  );
}

// ============================================================================
// 3D EFFECTS: PARTICLE BACKGROUND
// ============================================================================

export interface ParticleBackgroundProps {
  particleCount?: number;
  particleColor?: string;
  particleSize?: number;
  speed?: number;
  connected?: boolean;
  connectionDistance?: number;
  backgroundColor?: string;
  height?: ResponsiveValue<"sm" | "md" | "lg" | "xl" | "screen">;
  children?: React.ReactNode;
  id?: string;
  className?: string;
}

export function ParticleBackgroundRender({
  particleCount = 50,
  particleColor = "#6366f1",
  particleSize = 4,
  speed = 1,
  connected = true,
  connectionDistance = 150,
  backgroundColor = "#0f172a",
  height = "md",
  children,
  id,
  className = "",
}: ParticleBackgroundProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const animationRef = React.useRef<number | undefined>(undefined);
  const particlesRef = React.useRef<Array<{ x: number; y: number; size: number; speedX: number; speedY: number; opacity: number }>>([]);
  
  const heightMap: Record<string, string> = {
    sm: "h-48",
    md: "h-64",
    lg: "h-96",
    xl: "h-[32rem]",
    screen: "h-screen",
  };
  
  const heightClass = heightMap[typeof height === "string" ? height : height?.desktop || "md"];
  
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * particleSize + 1,
      speedX: (Math.random() - 0.5) * speed,
      speedY: (Math.random() - 0.5) * speed,
      opacity: Math.random() * 0.6 + 0.2,
    }));
    
    const animate = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particlesRef.current.forEach((particle, i) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particleColor;
        ctx.globalAlpha = particle.opacity;
        ctx.fill();
        
        if (connected) {
          for (let j = i + 1; j < particlesRef.current.length; j++) {
            const other = particlesRef.current[j];
            const dx = particle.x - other.x;
            const dy = particle.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < connectionDistance) {
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(other.x, other.y);
              ctx.strokeStyle = particleColor;
              ctx.globalAlpha = (1 - distance / connectionDistance) * 0.3;
              ctx.stroke();
            }
          }
        }
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [particleCount, particleColor, particleSize, speed, connected, connectionDistance]);
  
  return (
    <div
      id={id}
      className={`relative overflow-hidden ${heightClass} ${className}`}
      style={{ backgroundColor }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
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
  animation?: "fade-up" | "fade-down" | "fade-left" | "fade-right" | "zoom-in" | "zoom-out" | "flip-up" | "flip-left" | "bounce-in" | "rotate-in";
  delay?: number;
  duration?: number;
  threshold?: number;
  once?: boolean;
  title?: string;
  description?: string;
  backgroundColor?: string;
  padding?: ResponsiveValue<"none" | "xs" | "sm" | "md" | "lg">;
  id?: string;
  className?: string;
}

export function ScrollAnimateRender({
  animation = "fade-up",
  delay = 0,
  duration = 600,
  threshold = 0.1,
  once = true,
  title = "Scroll Animation",
  description = "This content animates when you scroll",
  backgroundColor = "#f8fafc",
  padding = "lg",
  id,
  className = "",
}: ScrollAnimateProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = React.useState(false);
  const [hasAnimated, setHasAnimated] = React.useState(false);
  
  const paddingClasses = getResponsiveClasses(padding, paddingYMap);
  
  const animations: Record<string, { initial: React.CSSProperties; animate: React.CSSProperties }> = {
    "fade-up": { initial: { opacity: 0, transform: "translateY(40px)" }, animate: { opacity: 1, transform: "translateY(0)" } },
    "fade-down": { initial: { opacity: 0, transform: "translateY(-40px)" }, animate: { opacity: 1, transform: "translateY(0)" } },
    "fade-left": { initial: { opacity: 0, transform: "translateX(40px)" }, animate: { opacity: 1, transform: "translateX(0)" } },
    "fade-right": { initial: { opacity: 0, transform: "translateX(-40px)" }, animate: { opacity: 1, transform: "translateX(0)" } },
    "zoom-in": { initial: { opacity: 0, transform: "scale(0.8)" }, animate: { opacity: 1, transform: "scale(1)" } },
    "zoom-out": { initial: { opacity: 0, transform: "scale(1.2)" }, animate: { opacity: 1, transform: "scale(1)" } },
    "flip-up": { initial: { opacity: 0, transform: "perspective(1000px) rotateX(-90deg)" }, animate: { opacity: 1, transform: "perspective(1000px) rotateX(0)" } },
    "flip-left": { initial: { opacity: 0, transform: "perspective(1000px) rotateY(90deg)" }, animate: { opacity: 1, transform: "perspective(1000px) rotateY(0)" } },
    "bounce-in": { initial: { opacity: 0, transform: "scale(0.3)" }, animate: { opacity: 1, transform: "scale(1)" } },
    "rotate-in": { initial: { opacity: 0, transform: "rotate(-180deg) scale(0)" }, animate: { opacity: 1, transform: "rotate(0) scale(1)" } },
  };
  
  const config = animations[animation];
  
  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
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
      { threshold }
    );
    
    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, once]);
  
  const shouldAnimate = isVisible && (!once || !hasAnimated);
  
  return (
    <div
      id={id}
      ref={ref}
      className={`${paddingClasses} rounded-lg ${className}`}
      style={{
        backgroundColor,
        ...config.initial,
        ...(shouldAnimate ? config.animate : {}),
        transition: `all ${duration}ms ease-out ${delay}ms`,
      }}
    >
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}