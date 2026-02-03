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
  backgroundImage?: string;
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
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
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
  fontSize?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl";
  fontWeight?: "light" | "normal" | "medium" | "semibold" | "bold";
  lineHeight?: "tight" | "normal" | "relaxed" | "loose";
  italic?: boolean;
  underline?: boolean;
  maxWidth?: "none" | "prose" | "md" | "lg" | "xl";
  marginBottom?: ResponsiveValue<"none" | "xs" | "sm" | "md" | "lg">;
  id?: string;
  className?: string;
}

export function TextRender({
  text = "Text content",
  children,
  color,
  align = "left",
  fontSize = "base",
  fontWeight = "normal",
  lineHeight = "relaxed",
  italic = false,
  underline = false,
  maxWidth = "none",
  marginBottom = "md",
  id,
  className = "",
}: TextProps) {
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

  const alignClasses = getResponsiveClasses(align, alignMap);
  const mbClasses = getResponsiveClasses(marginBottom, marginBottomMap);
  const sizeClass = { xs: "text-xs", sm: "text-sm md:text-sm", base: "text-base md:text-base", lg: "text-base md:text-lg", xl: "text-lg md:text-xl", "2xl": "text-xl md:text-2xl" }[fontSize];
  const weightClass = { light: "font-light", normal: "font-normal", medium: "font-medium", semibold: "font-semibold", bold: "font-bold" }[fontWeight];
  const leadingClass = { tight: "leading-tight", normal: "leading-normal", relaxed: "leading-relaxed", loose: "leading-loose" }[lineHeight];
  const maxWClass = { none: "", prose: "max-w-prose", md: "max-w-md", lg: "max-w-lg", xl: "max-w-xl" }[maxWidth];

  return (
    <p
      id={id}
      className={`${sizeClass} ${alignClasses} ${mbClasses} ${weightClass} ${leadingClass} ${maxWClass} ${italic ? "italic" : ""} ${underline ? "underline" : ""} ${className}`}
      style={{ color }}
    >
      {children || text}
    </p>
  );
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
  authorImage?: string;
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
            {authorImage && <img src={authorImage} alt={author} className={`${sizeStyles.avatar} rounded-full object-cover`} />}
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
            {authorImage && <img src={authorImage} alt={author} className={`${sizeStyles.avatar} rounded-full object-cover`} />}
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
// BUTTON - Fully customizable button
// ============================================================================

export interface ButtonProps {
  label?: string;
  children?: React.ReactNode;
  href?: string;
  target?: "_self" | "_blank";
  variant?: "primary" | "secondary" | "outline" | "ghost" | "link" | "destructive";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderRadius?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  fullWidth?: boolean;
  fullWidthMobile?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  shadow?: "none" | "sm" | "md" | "lg";
  id?: string;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

export function ButtonRender({
  label = "Button",
  children,
  href,
  target = "_self",
  variant = "primary",
  size = "md",
  backgroundColor,
  textColor,
  borderColor,
  borderRadius = "md",
  fullWidth = false,
  fullWidthMobile = false,
  iconLeft,
  iconRight,
  disabled = false,
  loading = false,
  shadow = "none",
  id,
  className = "",
  onClick,
  type = "button",
}: ButtonProps) {
  const sizeClasses = {
    xs: "px-2.5 py-1 text-xs gap-1",
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2 text-sm md:text-base gap-2",
    lg: "px-6 py-3 text-base md:text-lg gap-2",
    xl: "px-8 py-4 text-lg md:text-xl gap-2.5",
  }[size];

  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 border-transparent",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 border-transparent",
    outline: "bg-transparent text-gray-900 hover:bg-gray-50 active:bg-gray-100 border-gray-300 border",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200 border-transparent",
    link: "bg-transparent text-blue-600 hover:text-blue-700 hover:underline border-transparent p-0",
    destructive: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 border-transparent",
  }[variant];

  const radiusClass = { none: "rounded-none", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", xl: "rounded-xl", full: "rounded-full" }[borderRadius];
  const shadowClass = { none: "", sm: "shadow-sm hover:shadow", md: "shadow hover:shadow-md", lg: "shadow-md hover:shadow-lg" }[shadow];
  const widthClasses = fullWidth ? "w-full justify-center" : fullWidthMobile ? "w-full md:w-auto justify-center md:justify-start" : "";

  const baseClasses = `inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${radiusClass} ${shadowClass} ${widthClasses} ${className}`;

  const customStyles: React.CSSProperties = {};
  if (backgroundColor) customStyles.backgroundColor = backgroundColor;
  if (textColor) customStyles.color = textColor;
  if (borderColor) customStyles.borderColor = borderColor;

  const content = (
    <>
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {!loading && iconLeft}
      {children || label}
      {!loading && iconRight}
    </>
  );

  if (href) {
    return (
      <a id={id} href={href} target={target} rel={target === "_blank" ? "noopener noreferrer" : undefined} className={baseClasses} style={customStyles}>
        {content}
      </a>
    );
  }

  return (
    <button id={id} type={type} className={baseClasses} style={customStyles} onClick={onClick} disabled={disabled || loading}>
      {content}
    </button>
  );
}

// ============================================================================
// IMAGE - Responsive image with all options
// ============================================================================

export interface ImageProps {
  src?: string;
  alt?: string;
  width?: "full" | "3/4" | "1/2" | "1/3" | "1/4" | "auto" | number;
  aspectRatio?: "auto" | "square" | "video" | "4/3" | "3/2" | "16/9" | "21/9";
  objectFit?: "contain" | "cover" | "fill" | "none";
  objectPosition?: "center" | "top" | "bottom" | "left" | "right";
  borderRadius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  border?: boolean;
  borderColor?: string;
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
  hoverZoom?: boolean;
  grayscale?: boolean;
  caption?: string;
  captionAlign?: "left" | "center" | "right";
  loading?: "eager" | "lazy";
  href?: string;
  target?: "_self" | "_blank";
  id?: string;
  className?: string;
}

export function ImageRender({
  src = "/placeholder.svg",
  alt = "Image",
  width = "full",
  aspectRatio = "auto",
  objectFit = "cover",
  objectPosition = "center",
  borderRadius = "none",
  border = false,
  borderColor = "#e5e7eb",
  shadow = "none",
  hoverZoom = false,
  grayscale = false,
  caption,
  captionAlign = "center",
  loading = "lazy",
  href,
  target = "_self",
  id,
  className = "",
}: ImageProps) {
  const widthClass = typeof width === "string" ? { full: "w-full", "3/4": "w-3/4", "1/2": "w-1/2", "1/3": "w-1/3", "1/4": "w-1/4", auto: "w-auto" }[width] : "";
  const aspectClass = { auto: "", square: "aspect-square", video: "aspect-video", "4/3": "aspect-[4/3]", "3/2": "aspect-[3/2]", "16/9": "aspect-[16/9]", "21/9": "aspect-[21/9]" }[aspectRatio];
  const fitClass = { contain: "object-contain", cover: "object-cover", fill: "object-fill", none: "object-none" }[objectFit];
  const posClass = { center: "object-center", top: "object-top", bottom: "object-bottom", left: "object-left", right: "object-right" }[objectPosition];
  const radiusClass = { none: "rounded-none", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", xl: "rounded-xl", "2xl": "rounded-2xl", full: "rounded-full" }[borderRadius];
  const shadowClass = { none: "", sm: "shadow-sm", md: "shadow-md", lg: "shadow-lg", xl: "shadow-xl" }[shadow];

  const imageElement = (
    <img
      id={id}
      src={src}
      alt={alt}
      loading={loading}
      className={`${widthClass} ${aspectClass} ${fitClass} ${posClass} ${radiusClass} ${shadowClass} ${border ? "border" : ""} ${grayscale ? "grayscale hover:grayscale-0 transition-all duration-300" : ""} ${hoverZoom ? "hover:scale-105 transition-transform duration-300" : ""} ${className}`}
      style={{ borderColor: border ? borderColor : undefined, width: typeof width === "number" ? `${width}px` : undefined }}
    />
  );

  const wrappedImage = href ? (
    <a href={href} target={target} rel={target === "_blank" ? "noopener noreferrer" : undefined} className={hoverZoom ? "block overflow-hidden" : ""}>
      {imageElement}
    </a>
  ) : hoverZoom ? (
    <div className="overflow-hidden">{imageElement}</div>
  ) : (
    imageElement
  );

  if (caption) {
    return (
      <figure>
        {wrappedImage}
        <figcaption className={`mt-2 text-sm text-gray-500 text-${captionAlign}`}>{caption}</figcaption>
      </figure>
    );
  }

  return wrappedImage;
}

// ============================================================================
// VIDEO - Responsive video player
// ============================================================================

export interface VideoProps {
  src?: string;
  poster?: string;
  width?: "full" | "3/4" | "1/2" | "auto";
  aspectRatio?: "video" | "square" | "4/3" | "21/9";
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  borderRadius?: "none" | "sm" | "md" | "lg" | "xl";
  shadow?: "none" | "sm" | "md" | "lg";
  caption?: string;
  captionAlign?: "left" | "center" | "right";
  id?: string;
  className?: string;
}

export function VideoRender({
  src = "",
  poster,
  width = "full",
  aspectRatio = "video",
  autoplay = false,
  muted = false,
  loop = false,
  controls = true,
  borderRadius = "lg",
  shadow = "md",
  caption,
  captionAlign = "center",
  id,
  className = "",
}: VideoProps) {
  const widthClass = { full: "w-full", "3/4": "w-3/4", "1/2": "w-1/2", auto: "w-auto" }[width];
  const aspectClass = { video: "aspect-video", square: "aspect-square", "4/3": "aspect-[4/3]", "21/9": "aspect-[21/9]" }[aspectRatio];
  const radiusClass = { none: "rounded-none", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", xl: "rounded-xl" }[borderRadius];
  const shadowClass = { none: "", sm: "shadow-sm", md: "shadow-md", lg: "shadow-lg" }[shadow];

  // Handle YouTube
  if (src.includes("youtube.com") || src.includes("youtu.be")) {
    const videoId = src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/)?.[1];
    if (videoId) {
      const embedUrl = `https://www.youtube.com/embed/${videoId}?${autoplay ? "autoplay=1&" : ""}${muted ? "mute=1&" : ""}${loop ? `loop=1&playlist=${videoId}&` : ""}${!controls ? "controls=0&" : ""}playsinline=1`;
      const videoElement = <iframe id={id} src={embedUrl} className={`${widthClass} ${aspectClass} ${radiusClass} ${shadowClass} ${className}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />;
      if (caption) {
        return <figure>{videoElement}<figcaption className={`mt-2 text-sm text-gray-500 text-${captionAlign}`}>{caption}</figcaption></figure>;
      }
      return videoElement;
    }
  }

  // Handle Vimeo
  if (src.includes("vimeo.com")) {
    const videoId = src.match(/vimeo\.com\/(\d+)/)?.[1];
    if (videoId) {
      const embedUrl = `https://player.vimeo.com/video/${videoId}?${autoplay ? "autoplay=1&" : ""}${muted ? "muted=1&" : ""}${loop ? "loop=1&" : ""}`;
      const videoElement = <iframe id={id} src={embedUrl} className={`${widthClass} ${aspectClass} ${radiusClass} ${shadowClass} ${className}`} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />;
      if (caption) {
        return <figure>{videoElement}<figcaption className={`mt-2 text-sm text-gray-500 text-${captionAlign}`}>{caption}</figcaption></figure>;
      }
      return videoElement;
    }
  }

  // Native video
  const videoElement = (
    <video id={id} src={src} poster={poster} autoPlay={autoplay} muted={muted} loop={loop} controls={controls} playsInline className={`${widthClass} ${aspectClass} ${radiusClass} ${shadowClass} ${className}`} />
  );

  if (caption) {
    return <figure>{videoElement}<figcaption className={`mt-2 text-sm text-gray-500 text-${captionAlign}`}>{caption}</figcaption></figure>;
  }

  return videoElement;
}

// ============================================================================
// MAP - Embedded map
// ============================================================================

export interface MapProps {
  address?: string;
  height?: number;
  zoom?: number;
  borderRadius?: "none" | "sm" | "md" | "lg" | "xl";
  shadow?: "none" | "sm" | "md" | "lg";
  id?: string;
  className?: string;
}

export function MapRender({
  address = "New York, NY",
  height = 300,
  zoom = 14,
  borderRadius = "lg",
  shadow = "md",
  id,
  className = "",
}: MapProps) {
  const radiusClass = { none: "rounded-none", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", xl: "rounded-xl" }[borderRadius];
  const shadowClass = { none: "", sm: "shadow-sm", md: "shadow-md", lg: "shadow-lg" }[shadow];
  const encodedAddress = encodeURIComponent(address);

  return (
    <div id={id} className={`${radiusClass} ${shadowClass} overflow-hidden ${className}`} style={{ height: `${height}px` }}>
      <iframe src={`https://maps.google.com/maps?q=${encodedAddress}&z=${zoom}&output=embed`} className="w-full h-full border-0" loading="lazy" allowFullScreen />
    </div>
  );
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
  backgroundImage?: string;
  backgroundOverlay?: boolean;
  backgroundOverlayOpacity?: number;
  textColor?: string;
  primaryButtonText?: string;
  primaryButtonLink?: string;
  primaryButtonColor?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  image?: string;
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
          backgroundColor: backgroundImage ? undefined : backgroundColor,
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {backgroundImage && backgroundOverlay && (
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
                className="inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 text-base md:text-lg font-medium border-2 rounded-lg hover:bg-gray-50 transition-all"
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
                <a href={secondaryButtonLink} className="inline-flex items-center justify-center px-6 py-3 text-base font-medium border-2 rounded-lg hover:bg-gray-50 transition-all" style={{ borderColor: textColor || "#374151", color: textColor || "#374151" }}>
                  {secondaryButtonText}
                </a>
              )}
            </div>
          </div>
          <div className={`${imageOrder}`}>
            {image && <img src={image} alt={imageAlt} className="w-full h-auto rounded-xl shadow-2xl" loading="lazy" />}
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
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor,
      }}
    >
      {backgroundOverlay && <div className="absolute inset-0 bg-black" style={{ opacity: backgroundOverlayOpacity / 100 }} aria-hidden="true" />}
      <div className={`relative z-10 max-w-4xl mx-auto flex flex-col ${alignClasses}`}>
        {badge && <span className="inline-flex items-center px-3 py-1 rounded-full text-xs md:text-sm font-medium text-white mb-4 md:mb-6" style={{ backgroundColor: badgeColor }}>{badge}</span>}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight" style={{ color: textColor || "#ffffff" }}>{title}</h1>
        <p className="text-lg md:text-xl lg:text-2xl mb-8 opacity-90 max-w-2xl" style={{ color: textColor || "#ffffff" }}>{description}</p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a href={primaryButtonLink} className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white rounded-lg hover:opacity-90 transition-all shadow-lg" style={{ backgroundColor: primaryButtonColor }}>{primaryButtonText}</a>
          {secondaryButtonText && <a href={secondaryButtonLink} className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium border-2 border-white text-white rounded-lg hover:bg-white/10 transition-all">{secondaryButtonText}</a>}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// FEATURES - Feature Grid with Icons
// ============================================================================

export interface FeaturesProps {
  title?: string;
  subtitle?: string;
  description?: string;
  features?: Array<{
    title?: string;
    description?: string;
    icon?: string;
    iconColor?: string;
    link?: string;
  }>;
  columns?: 2 | 3 | 4;
  variant?: "cards" | "minimal" | "centered" | "icons-left";
  backgroundColor?: string;
  cardBackgroundColor?: string;
  textColor?: string;
  paddingY?: "sm" | "md" | "lg" | "xl";
  showBorder?: boolean;
  showShadow?: boolean;
  id?: string;
  className?: string;
}

export function FeaturesRender({
  title = "Amazing Features",
  subtitle,
  description,
  features = [],
  columns = 3,
  variant = "cards",
  backgroundColor = "#ffffff",
  cardBackgroundColor = "#ffffff",
  textColor,
  paddingY = "lg",
  showBorder = true,
  showShadow = true,
  id,
  className = "",
}: FeaturesProps) {
  const paddingClasses = { sm: "py-12 md:py-16", md: "py-16 md:py-20", lg: "py-20 md:py-28", xl: "py-24 md:py-32" }[paddingY];
  const colClasses = { 2: "md:grid-cols-2", 3: "md:grid-cols-2 lg:grid-cols-3", 4: "md:grid-cols-2 lg:grid-cols-4" }[columns];

  return (
    <section id={id} className={`w-full ${paddingClasses} px-4 ${className}`} style={{ backgroundColor }}>
      <div className="max-w-screen-xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          {subtitle && <p className="text-sm md:text-base font-semibold text-blue-600 uppercase tracking-wider mb-2">{subtitle}</p>}
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4" style={{ color: textColor }}>{title}</h2>
          {description && <p className="text-base md:text-lg max-w-2xl mx-auto opacity-80" style={{ color: textColor }}>{description}</p>}
        </div>
        <div className={`grid grid-cols-1 ${colClasses} gap-6 md:gap-8`}>
          {features.map((feature, i) => (
            <div
              key={i}
              className={`p-6 md:p-8 rounded-xl transition-all duration-300 hover:-translate-y-1 ${showBorder ? "border" : ""} ${showShadow ? "shadow-sm hover:shadow-lg" : ""} ${variant === "centered" ? "text-center" : ""}`}
              style={{ backgroundColor: cardBackgroundColor }}
            >
              {feature.icon && (
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-lg flex items-center justify-center mb-4 ${variant === "centered" ? "mx-auto" : ""}`} style={{ backgroundColor: `${feature.iconColor || "#3b82f6"}20` }}>
                  <span className="text-2xl">{feature.icon}</span>
                </div>
              )}
              <h3 className="text-lg md:text-xl font-semibold mb-2" style={{ color: textColor }}>{feature.title}</h3>
              <p className="text-sm md:text-base opacity-75 leading-relaxed" style={{ color: textColor }}>{feature.description}</p>
              {feature.link && <a href={feature.link} className="inline-flex items-center mt-4 text-sm font-medium text-blue-600 hover:text-blue-700">Learn more →</a>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// CTA - Call To Action Section
// ============================================================================

export interface CTAProps {
  title?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  buttonColor?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  variant?: "simple" | "centered" | "split" | "gradient";
  backgroundColor?: string;
  backgroundGradientFrom?: string;
  backgroundGradientTo?: string;
  backgroundImage?: string;
  textColor?: string;
  paddingY?: "sm" | "md" | "lg" | "xl";
  borderRadius?: "none" | "lg" | "xl" | "2xl";
  image?: string;
  imageAlt?: string;
  id?: string;
  className?: string;
}

export function CTARender({
  title = "Ready to get started?",
  description = "Join thousands of satisfied customers using our platform today.",
  buttonText = "Get Started Free",
  buttonLink = "#",
  buttonColor = "#ffffff",
  secondaryButtonText,
  secondaryButtonLink = "#",
  variant = "centered",
  backgroundColor = "#3b82f6",
  backgroundGradientFrom = "#3b82f6",
  backgroundGradientTo = "#8b5cf6",
  backgroundImage,
  textColor = "#ffffff",
  paddingY = "lg",
  borderRadius = "none",
  image,
  imageAlt = "CTA image",
  id,
  className = "",
}: CTAProps) {
  const paddingClasses = { sm: "py-12 md:py-16", md: "py-16 md:py-20", lg: "py-20 md:py-28", xl: "py-24 md:py-32" }[paddingY];
  const radiusClasses = { none: "", lg: "rounded-lg", xl: "rounded-xl", "2xl": "rounded-2xl" }[borderRadius];

  const bgStyle: React.CSSProperties = variant === "gradient"
    ? { background: `linear-gradient(135deg, ${backgroundGradientFrom}, ${backgroundGradientTo})` }
    : backgroundImage
      ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" }
      : { backgroundColor };

  // Split variant
  if (variant === "split" && image) {
    return (
      <section id={id} className={`w-full ${paddingClasses} px-4 ${className}`}>
        <div className={`max-w-screen-xl mx-auto grid md:grid-cols-2 gap-8 md:gap-12 items-center p-8 md:p-12 ${radiusClasses}`} style={bgStyle}>
          <div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4" style={{ color: textColor }}>{title}</h2>
            <p className="text-base md:text-lg mb-6 opacity-90" style={{ color: textColor }}>{description}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href={buttonLink} className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-lg transition-all" style={{ backgroundColor: buttonColor, color: backgroundColor }}>{buttonText}</a>
              {secondaryButtonText && <a href={secondaryButtonLink} className="inline-flex items-center justify-center px-6 py-3 text-base font-medium border-2 rounded-lg transition-all" style={{ borderColor: textColor, color: textColor }}>{secondaryButtonText}</a>}
            </div>
          </div>
          <div className="hidden md:block">
            <img src={image} alt={imageAlt} className="w-full h-auto rounded-lg shadow-xl" loading="lazy" />
          </div>
        </div>
      </section>
    );
  }

  // Centered (default)
  return (
    <section id={id} className={`relative w-full ${paddingClasses} px-4 ${radiusClasses} ${className}`} style={bgStyle}>
      {backgroundImage && <div className="absolute inset-0 bg-black/50" aria-hidden="true" />}
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 md:mb-6" style={{ color: textColor }}>{title}</h2>
        <p className="text-base md:text-lg lg:text-xl mb-6 md:mb-8 opacity-90" style={{ color: textColor }}>{description}</p>
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
          <a href={buttonLink} className="inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 text-base md:text-lg font-medium rounded-lg transition-all hover:opacity-90 shadow-lg" style={{ backgroundColor: buttonColor, color: backgroundColor }}>{buttonText}</a>
          {secondaryButtonText && <a href={secondaryButtonLink} className="inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 text-base md:text-lg font-medium border-2 rounded-lg transition-all hover:bg-white/10" style={{ borderColor: textColor, color: textColor }}>{secondaryButtonText}</a>}
        </div>
      </div>
    </section>
  );
}
// ============================================================================
// TESTIMONIALS - Customer Testimonials
// ============================================================================

export interface TestimonialsProps {
  title?: string;
  subtitle?: string;
  testimonials?: Array<{
    quote?: string;
    author?: string;
    role?: string;
    company?: string;
    image?: string;
    rating?: number;
  }>;
  columns?: 1 | 2 | 3;
  variant?: "cards" | "minimal" | "quote" | "carousel";
  backgroundColor?: string;
  cardBackgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  paddingY?: "sm" | "md" | "lg" | "xl";
  showRating?: boolean;
  id?: string;
  className?: string;
}

export function TestimonialsRender({
  title = "What Our Customers Say",
  subtitle,
  testimonials = [],
  columns = 3,
  variant = "cards",
  backgroundColor = "#f9fafb",
  cardBackgroundColor = "#ffffff",
  textColor,
  accentColor = "#3b82f6",
  paddingY = "lg",
  showRating = true,
  id,
  className = "",
}: TestimonialsProps) {
  const paddingClasses = { sm: "py-12 md:py-16", md: "py-16 md:py-20", lg: "py-20 md:py-28", xl: "py-24 md:py-32" }[paddingY];
  const colClasses = { 1: "max-w-2xl mx-auto", 2: "md:grid-cols-2", 3: "md:grid-cols-2 lg:grid-cols-3" }[columns];

  return (
    <section id={id} className={`w-full ${paddingClasses} px-4 ${className}`} style={{ backgroundColor }}>
      <div className="max-w-screen-xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          {subtitle && <p className="text-sm md:text-base font-semibold uppercase tracking-wider mb-2" style={{ color: accentColor }}>{subtitle}</p>}
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold" style={{ color: textColor }}>{title}</h2>
        </div>
        <div className={`grid grid-cols-1 ${colClasses} gap-6 md:gap-8`}>
          {testimonials.map((testimonial, i) => (
            <div key={i} className="p-6 md:p-8 rounded-xl shadow-sm hover:shadow-lg transition-shadow" style={{ backgroundColor: cardBackgroundColor }}>
              {showRating && testimonial.rating && (
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <svg key={j} className={`w-5 h-5 ${j < (testimonial.rating || 0) ? "text-yellow-400" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              )}
              <blockquote className="text-base md:text-lg leading-relaxed mb-6 italic" style={{ color: textColor }}>
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-4">
                {testimonial.image && <img src={testimonial.image} alt={testimonial.author} className="w-12 h-12 rounded-full object-cover" loading="lazy" />}
                <div>
                  <p className="font-semibold" style={{ color: textColor }}>{testimonial.author}</p>
                  {(testimonial.role || testimonial.company) && (
                    <p className="text-sm opacity-75" style={{ color: textColor }}>
                      {testimonial.role}{testimonial.role && testimonial.company && ", "}{testimonial.company}
                    </p>
                  )}
                </div>
              </div>
            </div>
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
  title?: string;
  subtitle?: string;
  description?: string;
  items?: Array<{
    question?: string;
    answer?: string;
    category?: string;
  }>;
  variant?: "accordion" | "cards" | "two-column";
  backgroundColor?: string;
  cardBackgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  paddingY?: "sm" | "md" | "lg" | "xl";
  defaultOpen?: number;
  id?: string;
  className?: string;
}

export function FAQRender({
  title = "Frequently Asked Questions",
  subtitle,
  description,
  items = [],
  variant = "accordion",
  backgroundColor = "#ffffff",
  cardBackgroundColor = "#f9fafb",
  textColor,
  accentColor = "#3b82f6",
  paddingY = "lg",
  defaultOpen = 0,
  id,
  className = "",
}: FAQProps) {
  const paddingClasses = { sm: "py-12 md:py-16", md: "py-16 md:py-20", lg: "py-20 md:py-28", xl: "py-24 md:py-32" }[paddingY];

  return (
    <section id={id} className={`w-full ${paddingClasses} px-4 ${className}`} style={{ backgroundColor }}>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          {subtitle && <p className="text-sm md:text-base font-semibold uppercase tracking-wider mb-2" style={{ color: accentColor }}>{subtitle}</p>}
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4" style={{ color: textColor }}>{title}</h2>
          {description && <p className="text-base md:text-lg opacity-80" style={{ color: textColor }}>{description}</p>}
        </div>
        <div className="space-y-3 md:space-y-4">
          {items.map((item, i) => (
            <details
              key={i}
              open={i === defaultOpen}
              className="group rounded-lg overflow-hidden transition-all"
              style={{ backgroundColor: cardBackgroundColor }}
            >
              <summary className="p-4 md:p-6 cursor-pointer list-none flex items-center justify-between gap-4 font-medium text-base md:text-lg hover:bg-opacity-80" style={{ color: textColor }}>
                <span>{item.question}</span>
                <svg className="w-5 h-5 flex-shrink-0 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-4 md:px-6 pb-4 md:pb-6 text-sm md:text-base leading-relaxed opacity-80" style={{ color: textColor }}>
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// STATS - Statistics/Metrics Display
// ============================================================================

export interface StatsProps {
  title?: string;
  subtitle?: string;
  stats?: Array<{
    value?: string;
    label?: string;
    prefix?: string;
    suffix?: string;
    icon?: string;
  }>;
  columns?: 2 | 3 | 4;
  variant?: "simple" | "cards" | "bordered" | "icons";
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  paddingY?: "sm" | "md" | "lg" | "xl";
  id?: string;
  className?: string;
}

export function StatsRender({
  title,
  subtitle,
  stats = [],
  columns = 4,
  variant = "simple",
  backgroundColor = "#111827",
  textColor = "#ffffff",
  accentColor = "#3b82f6",
  paddingY = "lg",
  id,
  className = "",
}: StatsProps) {
  const paddingClasses = { sm: "py-12 md:py-16", md: "py-16 md:py-20", lg: "py-20 md:py-28", xl: "py-24 md:py-32" }[paddingY];
  const colClasses = { 2: "grid-cols-2", 3: "grid-cols-2 md:grid-cols-3", 4: "grid-cols-2 md:grid-cols-4" }[columns];

  return (
    <section id={id} className={`w-full ${paddingClasses} px-4 ${className}`} style={{ backgroundColor }}>
      <div className="max-w-screen-xl mx-auto">
        {(title || subtitle) && (
          <div className="text-center mb-12 md:mb-16">
            {subtitle && <p className="text-sm md:text-base font-semibold uppercase tracking-wider mb-2" style={{ color: accentColor }}>{subtitle}</p>}
            {title && <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold" style={{ color: textColor }}>{title}</h2>}
          </div>
        )}
        <div className={`grid ${colClasses} gap-6 md:gap-8 lg:gap-12`}>
          {stats.map((stat, i) => (
            <div key={i} className={`text-center ${variant === "cards" ? "p-6 md:p-8 rounded-xl bg-white/5" : ""} ${variant === "bordered" ? "border-l-4 pl-6" : ""}`} style={variant === "bordered" ? { borderColor: accentColor } : undefined}>
              {stat.icon && variant === "icons" && <div className="text-3xl md:text-4xl mb-4">{stat.icon}</div>}
              <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2" style={{ color: textColor }}>
                {stat.prefix}{stat.value}{stat.suffix}
              </div>
              <div className="text-sm md:text-base opacity-70" style={{ color: textColor }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// TEAM - Team Members Grid
// ============================================================================

export interface TeamProps {
  title?: string;
  subtitle?: string;
  description?: string;
  members?: Array<{
    name?: string;
    role?: string;
    bio?: string;
    image?: string;
    linkedin?: string;
    twitter?: string;
    email?: string;
  }>;
  columns?: 2 | 3 | 4;
  variant?: "cards" | "minimal" | "detailed";
  backgroundColor?: string;
  cardBackgroundColor?: string;
  textColor?: string;
  paddingY?: "sm" | "md" | "lg" | "xl";
  showSocial?: boolean;
  id?: string;
  className?: string;
}

export function TeamRender({
  title = "Meet Our Team",
  subtitle,
  description,
  members = [],
  columns = 4,
  variant = "cards",
  backgroundColor = "#ffffff",
  cardBackgroundColor = "#f9fafb",
  textColor,
  paddingY = "lg",
  showSocial = true,
  id,
  className = "",
}: TeamProps) {
  const paddingClasses = { sm: "py-12 md:py-16", md: "py-16 md:py-20", lg: "py-20 md:py-28", xl: "py-24 md:py-32" }[paddingY];
  const colClasses = { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-2 lg:grid-cols-4" }[columns];

  return (
    <section id={id} className={`w-full ${paddingClasses} px-4 ${className}`} style={{ backgroundColor }}>
      <div className="max-w-screen-xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          {subtitle && <p className="text-sm md:text-base font-semibold text-blue-600 uppercase tracking-wider mb-2">{subtitle}</p>}
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4" style={{ color: textColor }}>{title}</h2>
          {description && <p className="text-base md:text-lg max-w-2xl mx-auto opacity-80" style={{ color: textColor }}>{description}</p>}
        </div>
        <div className={`grid grid-cols-2 ${colClasses} gap-6 md:gap-8`}>
          {members.map((member, i) => (
            <div key={i} className={`text-center ${variant === "cards" ? "p-6 rounded-xl shadow-sm hover:shadow-lg transition-shadow" : ""}`} style={variant === "cards" ? { backgroundColor: cardBackgroundColor } : undefined}>
              <img src={member.image || "/placeholder-avatar.svg"} alt={member.name} className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full mx-auto mb-4 object-cover" loading="lazy" />
              <h3 className="text-base md:text-lg font-semibold mb-1" style={{ color: textColor }}>{member.name}</h3>
              <p className="text-sm opacity-75 mb-2" style={{ color: textColor }}>{member.role}</p>
              {variant === "detailed" && member.bio && <p className="text-sm opacity-60 mb-3" style={{ color: textColor }}>{member.bio}</p>}
              {showSocial && (
                <div className="flex justify-center gap-3">
                  {member.linkedin && <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors" aria-label="LinkedIn"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg></a>}
                  {member.twitter && <a href={member.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors" aria-label="Twitter"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg></a>}
                  {member.email && <a href={`mailto:${member.email}`} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Email"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></a>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// GALLERY - Image Gallery
// ============================================================================

export interface GalleryProps {
  title?: string;
  subtitle?: string;
  images?: Array<{
    src?: string;
    alt?: string;
    caption?: string;
    link?: string;
  }>;
  columns?: 2 | 3 | 4 | 5;
  variant?: "grid" | "masonry" | "carousel";
  gap?: "none" | "sm" | "md" | "lg";
  aspectRatio?: "square" | "video" | "auto";
  borderRadius?: "none" | "sm" | "md" | "lg" | "xl";
  backgroundColor?: string;
  paddingY?: "sm" | "md" | "lg" | "xl";
  hoverEffect?: "zoom" | "overlay" | "none";
  lightbox?: boolean;
  id?: string;
  className?: string;
}

export function GalleryRender({
  title,
  subtitle,
  images = [],
  columns = 3,
  variant = "grid",
  gap = "md",
  aspectRatio = "square",
  borderRadius = "lg",
  backgroundColor = "#ffffff",
  paddingY = "lg",
  hoverEffect = "zoom",
  lightbox = false,
  id,
  className = "",
}: GalleryProps) {
  const paddingClasses = { sm: "py-12 md:py-16", md: "py-16 md:py-20", lg: "py-20 md:py-28", xl: "py-24 md:py-32" }[paddingY];
  const colClasses = { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-2 lg:grid-cols-4", 5: "md:grid-cols-3 lg:grid-cols-5" }[columns];
  const gapClasses = { none: "gap-0", sm: "gap-2", md: "gap-4", lg: "gap-6" }[gap];
  const aspectClasses = { square: "aspect-square", video: "aspect-video", auto: "" }[aspectRatio];
  const radiusClasses = { none: "rounded-none", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", xl: "rounded-xl" }[borderRadius];
  const hoverClasses = { zoom: "hover:scale-105", overlay: "", none: "" }[hoverEffect];

  return (
    <section id={id} className={`w-full ${paddingClasses} px-4 ${className}`} style={{ backgroundColor }}>
      <div className="max-w-screen-xl mx-auto">
        {(title || subtitle) && (
          <div className="text-center mb-12 md:mb-16">
            {subtitle && <p className="text-sm md:text-base font-semibold text-blue-600 uppercase tracking-wider mb-2">{subtitle}</p>}
            {title && <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">{title}</h2>}
          </div>
        )}
        <div className={`grid grid-cols-2 ${colClasses} ${gapClasses}`}>
          {images.map((image, i) => (
            <div key={i} className={`relative overflow-hidden ${radiusClasses} group`}>
              <img
                src={image.src || "/placeholder.svg"}
                alt={image.alt || `Gallery image ${i + 1}`}
                className={`w-full h-full object-cover ${aspectClasses} transition-transform duration-300 ${hoverClasses}`}
                loading="lazy"
              />
              {hoverEffect === "overlay" && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center">
                  {image.caption && <p className="text-white text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-4">{image.caption}</p>}
                </div>
              )}
              {image.link && <a href={image.link} className="absolute inset-0" aria-label={image.alt || "View image"} />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
// ============================================================================
// NAVBAR - Responsive Navigation
// ============================================================================

export interface NavbarProps {
  logo?: string;
  logoText?: string;
  logoLink?: string;
  links?: Array<{
    label?: string;
    href?: string;
    children?: Array<{ label?: string; href?: string }>;
  }>;
  ctaText?: string;
  ctaLink?: string;
  ctaColor?: string;
  backgroundColor?: string;
  textColor?: string;
  sticky?: boolean;
  transparent?: boolean;
  variant?: "simple" | "centered" | "split";
  id?: string;
  className?: string;
}

export function NavbarRender({
  logo,
  logoText = "Logo",
  logoLink = "/",
  links = [],
  ctaText,
  ctaLink = "#",
  ctaColor = "#3b82f6",
  backgroundColor = "#ffffff",
  textColor = "#374151",
  sticky = true,
  transparent = false,
  variant = "simple",
  id,
  className = "",
}: NavbarProps) {
  return (
    <nav
      id={id}
      className={`w-full px-4 py-3 md:py-4 z-50 ${sticky ? "sticky top-0" : ""} ${transparent ? "bg-transparent" : "shadow-sm"} ${className}`}
      style={{ backgroundColor: transparent ? "transparent" : backgroundColor }}
    >
      <div className="max-w-screen-xl mx-auto flex items-center justify-between">
        <a href={logoLink} className="flex items-center gap-2">
          {logo && <img src={logo} alt={logoText} className="h-8 md:h-10 w-auto" />}
          {!logo && <span className="text-xl md:text-2xl font-bold" style={{ color: textColor }}>{logoText}</span>}
        </a>
        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          {links.map((link, i) => (
            <a key={i} href={link.href || "#"} className="text-sm lg:text-base font-medium hover:opacity-75 transition-opacity" style={{ color: textColor }}>
              {link.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-4">
          {ctaText && (
            <a href={ctaLink} className="hidden md:inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg transition-opacity hover:opacity-90" style={{ backgroundColor: ctaColor }}>
              {ctaText}
            </a>
          )}
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Toggle menu">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: textColor }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}

// ============================================================================
// FOOTER - Comprehensive Footer
// ============================================================================

export interface FooterProps {
  logo?: string;
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
  accentColor = "#3b82f6",
  variant = "columns",
  paddingY = "lg",
  id,
  className = "",
}: FooterProps) {
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
              {logo && <img src={logo} alt={logoText} className="h-8 mb-4" />}
              {!logo && <p className="text-xl font-bold mb-4" style={{ color: textColor }}>{logoText}</p>}
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
                      <a href={link.href || "#"} className="text-sm opacity-75 hover:opacity-100 transition-opacity" style={{ color: textColor }}>{link.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        {newsletter && (
          <div className="border-t border-white/10 pt-8 mb-8">
            <div className="max-w-md">
              <h3 className="font-semibold mb-4" style={{ color: textColor }}>{newsletterTitle}</h3>
              <form className="flex flex-col sm:flex-row gap-2">
                <input type="email" placeholder={newsletterPlaceholder} className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30" />
                <button type="submit" className="px-6 py-2 rounded-lg font-medium transition-opacity hover:opacity-90 whitespace-nowrap" style={{ backgroundColor: accentColor, color: "#ffffff" }}>{newsletterButtonText}</button>
              </form>
            </div>
          </div>
        )}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm opacity-75" style={{ color: textColor }}>{copyright}</p>
          {bottomLinks.length > 0 && (
            <div className="flex flex-wrap gap-4 md:gap-6">
              {bottomLinks.map((link, i) => (
                <a key={i} href={link.href || "#"} className="text-sm opacity-75 hover:opacity-100 transition-opacity" style={{ color: textColor }}>{link.label}</a>
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
  const containerClasses = { icons: "", buttons: "p-2 rounded-lg hover:bg-gray-100", rounded: "p-2 rounded-full border hover:bg-gray-50" }[variant];

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
// FORM - Flexible Form Container
// ============================================================================

export interface FormProps {
  children?: React.ReactNode;
  action?: string;
  method?: "GET" | "POST";
  layout?: "vertical" | "horizontal" | "inline";
  gap?: "sm" | "md" | "lg";
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
  backgroundColor?: string;
  padding?: "none" | "sm" | "md" | "lg";
  borderRadius?: "none" | "sm" | "md" | "lg" | "xl";
  shadow?: "none" | "sm" | "md" | "lg";
  border?: boolean;
  id?: string;
  className?: string;
  onSubmit?: (e: React.FormEvent) => void;
}

export function FormRender({
  children,
  action = "#",
  method = "POST",
  layout = "vertical",
  gap = "md",
  maxWidth = "full",
  backgroundColor,
  padding = "none",
  borderRadius = "none",
  shadow = "none",
  border = false,
  id,
  className = "",
  onSubmit,
}: FormProps) {
  const gapClasses = { sm: "gap-3", md: "gap-4 md:gap-6", lg: "gap-6 md:gap-8" }[gap];
  const maxWClasses = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg", xl: "max-w-xl", full: "max-w-full" }[maxWidth];
  const paddingClasses = { none: "", sm: "p-4", md: "p-6 md:p-8", lg: "p-8 md:p-10" }[padding];
  const radiusClasses = { none: "", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", xl: "rounded-xl" }[borderRadius];
  const shadowClasses = { none: "", sm: "shadow-sm", md: "shadow-md", lg: "shadow-lg" }[shadow];
  const layoutClasses = { vertical: "flex flex-col", horizontal: "grid md:grid-cols-2", inline: "flex flex-wrap items-end" }[layout];

  return (
    <form
      id={id}
      action={action}
      method={method}
      className={`${layoutClasses} ${gapClasses} ${maxWClasses} ${paddingClasses} ${radiusClasses} ${shadowClasses} ${border ? "border" : ""} ${className}`}
      style={{ backgroundColor }}
      onSubmit={onSubmit}
    >
      {children}
    </form>
  );
}

// ============================================================================
// FORM FIELD - Universal Input Field
// ============================================================================

export interface FormFieldProps {
  label?: string;
  name?: string;
  type?: "text" | "email" | "password" | "tel" | "url" | "number" | "date" | "time" | "datetime-local" | "textarea" | "select";
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  options?: Array<{ value?: string; label?: string }>;
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
  autocomplete?: string;
  helpText?: string;
  error?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "filled" | "underline";
  fullWidth?: boolean;
  hideLabel?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  id?: string;
  className?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export function FormFieldRender({
  label,
  name,
  type = "text",
  placeholder,
  value,
  defaultValue,
  required = false,
  disabled = false,
  readonly = false,
  options = [],
  rows = 4,
  min,
  max,
  step,
  pattern,
  autocomplete,
  helpText,
  error,
  size = "md",
  variant = "default",
  fullWidth = true,
  hideLabel = false,
  icon,
  iconPosition = "left",
  id,
  className = "",
  onChange,
}: FormFieldProps) {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-base",
    lg: "px-5 py-3.5 text-lg",
  }[size];

  const variantClasses = {
    default: "border border-gray-300 rounded-lg bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
    filled: "border-0 bg-gray-100 rounded-lg focus:bg-gray-50 focus:ring-2 focus:ring-blue-500/20",
    underline: "border-0 border-b-2 border-gray-300 rounded-none bg-transparent focus:border-blue-500",
  }[variant];

  const baseClasses = `${sizeClasses} ${variantClasses} ${fullWidth ? "w-full" : ""} ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : ""} transition-all duration-200 outline-none`;

  const fieldId = id || name;

  const renderInput = () => {
    if (type === "textarea") {
      return <textarea id={fieldId} name={name} placeholder={placeholder} value={value} defaultValue={defaultValue} required={required} disabled={disabled} readOnly={readonly} rows={rows} className={baseClasses} onChange={onChange} />;
    }

    if (type === "select") {
      return (
        <select id={fieldId} name={name} value={value} defaultValue={defaultValue} required={required} disabled={disabled} className={baseClasses} onChange={onChange}>
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((opt, i) => <option key={i} value={opt.value}>{opt.label}</option>)}
        </select>
      );
    }

    return (
      <input
        id={fieldId}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        required={required}
        disabled={disabled}
        readOnly={readonly}
        min={min}
        max={max}
        step={step}
        pattern={pattern}
        autoComplete={autocomplete}
        className={`${baseClasses} ${icon ? (iconPosition === "left" ? "pl-10" : "pr-10") : ""}`}
        onChange={onChange}
      />
    );
  };

  return (
    <div className={`${className}`}>
      {label && !hideLabel && (
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && iconPosition === "left" && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>}
        {renderInput()}
        {icon && iconPosition === "right" && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>}
      </div>
      {helpText && !error && <p className="mt-1.5 text-sm text-gray-500">{helpText}</p>}
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
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
  successMessage,
  action = "#",
  id,
  className = "",
}: ContactFormProps) {
  const paddingClasses = { sm: "p-4 md:p-6", md: "p-6 md:p-8", lg: "p-8 md:p-10" }[padding];
  const radiusClasses = { none: "", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", xl: "rounded-xl" }[borderRadius];
  const shadowClasses = { none: "", sm: "shadow-sm", md: "shadow-md", lg: "shadow-lg", xl: "shadow-xl" }[shadow];

  return (
    <div id={id} className={`max-w-lg mx-auto ${paddingClasses} ${radiusClasses} ${shadowClasses} ${className}`} style={{ backgroundColor }}>
      {title && <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2">{title}</h2>}
      {subtitle && <p className="text-gray-600 mb-6">{subtitle}</p>}
      <form action={action} method="POST" className="space-y-4 md:space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <FormFieldRender label={nameLabel} name="name" placeholder="John Doe" required />
          <FormFieldRender label={emailLabel} name="email" type="email" placeholder="john@example.com" required />
        </div>
        {(showPhone || showSubject) && (
          <div className="grid md:grid-cols-2 gap-4">
            {showPhone && <FormFieldRender label={phoneLabel} name="phone" type="tel" placeholder="+1 (555) 000-0000" />}
            {showSubject && <FormFieldRender label={subjectLabel} name="subject" placeholder="How can we help?" />}
          </div>
        )}
        <FormFieldRender label={messageLabel} name="message" type="textarea" placeholder="Your message..." rows={5} required />
        <button type="submit" className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
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

  if (variant === "card") {
    return (
      <div id={id} className={`p-6 md:p-8 rounded-xl shadow-lg text-center ${className}`} style={{ backgroundColor: backgroundColor || "#ffffff" }}>
        <h3 className={`font-bold mb-2 ${size === "lg" ? "text-xl md:text-2xl" : "text-lg md:text-xl"}`} style={{ color: textColor }}>{title}</h3>
        <p className={`${sizeClasses} opacity-80 mb-6`} style={{ color: textColor }}>{description}</p>
        <form action={action} method="POST" className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input type="email" name="email" placeholder={placeholder} required className={`flex-1 ${inputSizeClasses} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`} />
          <button type="submit" className={`${inputSizeClasses} px-6 font-medium text-white rounded-lg transition-opacity hover:opacity-90 whitespace-nowrap`} style={{ backgroundColor: buttonColor }}>{buttonText}</button>
        </form>
      </div>
    );
  }

  return (
    <div id={id} className={`${variant === "stacked" ? "text-center" : ""} ${className}`} style={{ backgroundColor }}>
      {title && <h3 className={`font-bold mb-2 ${size === "lg" ? "text-xl md:text-2xl" : "text-lg"}`} style={{ color: textColor }}>{title}</h3>}
      {description && <p className={`${sizeClasses} opacity-80 mb-4`} style={{ color: textColor }}>{description}</p>}
      <form action={action} method="POST" className={`flex ${variant === "stacked" ? "flex-col max-w-md mx-auto" : "flex-col sm:flex-row"} gap-3`}>
        <input type="email" name="email" placeholder={placeholder} required className={`flex-1 ${inputSizeClasses} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`} />
        <button type="submit" className={`${inputSizeClasses} px-6 font-medium text-white rounded-lg transition-opacity hover:opacity-90 whitespace-nowrap`} style={{ backgroundColor: buttonColor }}>{buttonText}</button>
      </form>
    </div>
  );
}
// ============================================================================
// CAROUSEL - Image/Content Carousel
// ============================================================================

export interface CarouselProps {
  items?: Array<{
    image?: string;
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
        {items.map((item, i) => (
          <div key={i} className="flex-none w-full h-full relative">
            <img src={item.image || "/placeholder.svg"} alt={item.title || `Slide ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
            {overlay && <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity / 100})` }} />}
            {(item.title || item.description) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                {item.title && <h3 className="text-xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-4" style={{ color: textColor }}>{item.title}</h3>}
                {item.description && <p className="text-sm md:text-lg max-w-2xl mb-4" style={{ color: textColor }}>{item.description}</p>}
                {item.link && item.buttonText && <a href={item.link} className="px-6 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors">{item.buttonText}</a>}
              </div>
            )}
          </div>
        ))}
      </div>
      {showArrows && items.length > 1 && (
        <>
          <button className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-colors" aria-label="Previous slide">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-colors" aria-label="Next slide">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </>
      )}
      {showDots && items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {items.map((_, i) => <button key={i} className={`w-2.5 h-2.5 rounded-full transition-colors ${i === 0 ? "bg-white" : "bg-white/50 hover:bg-white/75"}`} aria-label={`Go to slide ${i + 1}`} />)}
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
                borderColor: plan.popular ? popularBorderColor : "#e5e7eb",
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
                {(plan.features || []).map((feature, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm" style={{ color: textColor }}>
                    <svg className="w-5 h-5 flex-shrink-0 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href={plan.buttonLink || "#"}
                className={`block w-full py-3 text-center font-medium rounded-lg transition-all ${plan.popular ? "text-white hover:opacity-90" : "border-2 hover:bg-gray-50"}`}
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
          <summary className={`p-4 md:p-5 cursor-pointer list-none flex items-center ${iconPosition === "left" ? "flex-row-reverse justify-end" : "justify-between"} gap-4 font-medium hover:bg-gray-50 transition-colors`} style={{ color: textColor }}>
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
          <button className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 transition-colors" onClick={onClose} aria-label="Close modal">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {title && <h2 className="text-xl md:text-2xl font-bold mb-2">{title}</h2>}
        {description && <p className="text-gray-600 mb-6">{description}</p>}
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
  src?: string;
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
  const sizeClasses = { xs: "w-6 h-6 text-xs", sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-12 h-12 text-base", xl: "w-16 h-16 text-lg", "2xl": "w-20 h-20 text-xl" }[size];
  const shapeClasses = { circle: "rounded-full", rounded: "rounded-lg", square: "rounded-none" }[shape];
  const statusSizeClasses = { xs: "w-1.5 h-1.5", sm: "w-2 h-2", md: "w-2.5 h-2.5", lg: "w-3 h-3", xl: "w-3.5 h-3.5", "2xl": "w-4 h-4" }[size];
  const statusPositionClasses = { "top-right": "top-0 right-0", "bottom-right": "bottom-0 right-0" }[statusPosition];
  const statusColors = { online: "#22c55e", offline: "#6b7280", busy: "#ef4444", away: "#f59e0b" };

  const initials = name ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "";

  return (
    <div id={id} className={`relative inline-flex ${className}`}>
      {src ? (
        <img src={src} alt={alt} className={`${sizeClasses} ${shapeClasses} object-cover ${border ? "ring-2 ring-white" : ""}`} loading="lazy" />
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
  backgroundImage?: string;
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
        backgroundImage: `url(${backgroundImage})`,
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
  platformLogo?: string;
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
          {platformLogo && <img src={platformLogo} alt={platform} className="w-4 h-4" />}
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
    { name: "Basic", price: "$9/mo" },
    { name: "Pro", price: "$29/mo", highlight: true },
    { name: "Enterprise", price: "$99/mo" },
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
// E-COMMERCE: PRODUCT CARD
// ============================================================================

export interface ProductCardProps {
  image?: string;
  images?: string[];
  title?: string;
  description?: string;
  price?: number;
  originalPrice?: number;
  currency?: string;
  badge?: string;
  badgeColor?: string;
  rating?: number;
  reviewCount?: number;
  inStock?: boolean;
  stockCount?: number;
  variant?: "simple" | "detailed" | "horizontal" | "minimal";
  size?: ResponsiveValue<"sm" | "md" | "lg">;
  showQuickView?: boolean;
  showAddToCart?: boolean;
  showWishlist?: boolean;
  onAddToCart?: () => void;
  link?: string;
  id?: string;
  className?: string;
}

export function ProductCardRender({
  image = "/products/placeholder.jpg",
  images = [],
  title = "Product Name",
  description,
  price = 99.99,
  originalPrice,
  currency = "$",
  badge,
  badgeColor = "bg-red-500",
  rating,
  reviewCount,
  inStock = true,
  stockCount,
  variant = "simple",
  size = "md",
  showQuickView = true,
  showAddToCart = true,
  showWishlist = true,
  onAddToCart,
  link,
  id,
  className = "",
}: ProductCardProps) {
  const discount = originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0;

  const sizeClasses = getResponsiveClasses(size, {
    sm: ["text-sm", "md:text-sm", "lg:text-sm"],
    md: ["text-base", "md:text-base", "lg:text-base"],
    lg: ["text-lg", "md:text-lg", "lg:text-lg"],
  });

  const CardContent = () => (
    <>
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-100 group">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Badges */}
        {(badge || discount > 0) && (
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {discount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                -{discount}%
              </span>
            )}
            {badge && (
              <span className={`${badgeColor} text-white text-xs font-bold px-2 py-1 rounded`}>
                {badge}
              </span>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {showWishlist && (
            <button className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors">
              <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          )}
          {showQuickView && (
            <button className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors">
              <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          )}
        </div>

        {/* Add to Cart Overlay */}
        {showAddToCart && (
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onAddToCart}
              disabled={!inStock}
              className="w-full py-2 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
            >
              {inStock ? "Add to Cart" : "Out of Stock"}
            </button>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className={`p-3 md:p-4 ${sizeClasses}`}>
        <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors">
          {title}
        </h3>
        
        {description && variant === "detailed" && (
          <p className="text-gray-500 text-sm mt-1 line-clamp-2">{description}</p>
        )}

        {/* Rating */}
        {rating !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-3 h-3 md:w-4 md:h-4 ${i < Math.floor(rating) ? "text-yellow-400" : "text-gray-300"} fill-current`}
                  viewBox="0 0 20 20"
                >
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
              ))}
            </div>
            {reviewCount !== undefined && (
              <span className="text-xs text-gray-500">({reviewCount})</span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 mt-2">
          <span className="font-bold text-gray-900 text-lg md:text-xl">
            {currency}{price.toFixed(2)}
          </span>
          {originalPrice && (
            <span className="text-gray-400 line-through text-sm">
              {currency}{originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Stock Status */}
        {stockCount !== undefined && stockCount > 0 && stockCount < 10 && (
          <p className="text-orange-500 text-xs mt-2">Only {stockCount} left in stock!</p>
        )}
        {!inStock && (
          <p className="text-red-500 text-xs mt-2">Out of Stock</p>
        )}
      </div>
    </>
  );

  const cardClasses = `group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 ${className}`;

  return link ? (
    <a id={id} href={link} className={cardClasses}>
      <CardContent />
    </a>
  ) : (
    <div id={id} className={cardClasses}>
      <CardContent />
    </div>
  );
}

// ============================================================================
// E-COMMERCE: PRODUCT GRID
// ============================================================================

export interface ProductGridProps {
  products?: ProductCardProps[];
  columns?: ResponsiveValue<1 | 2 | 3 | 4 | 5 | 6>;
  gap?: ResponsiveValue<"sm" | "md" | "lg">;
  cardVariant?: "simple" | "detailed" | "minimal";
  showFilters?: boolean;
  showSorting?: boolean;
  emptyMessage?: string;
  id?: string;
  className?: string;
}

export function ProductGridRender({
  products = [
    { title: "Product 1", price: 29.99 },
    { title: "Product 2", price: 49.99, originalPrice: 79.99, badge: "Sale" },
    { title: "Product 3", price: 99.99, rating: 4.5, reviewCount: 128 },
    { title: "Product 4", price: 19.99, inStock: false },
  ],
  columns = { mobile: 2, tablet: 3, desktop: 4 },
  gap = "md",
  cardVariant = "simple",
  showFilters = false,
  showSorting = false,
  emptyMessage = "No products found",
  id,
  className = "",
}: ProductGridProps) {
  const columnClasses = getResponsiveClasses(columns, {
    1: ["grid-cols-1", "md:grid-cols-1", "lg:grid-cols-1"],
    2: ["grid-cols-2", "md:grid-cols-2", "lg:grid-cols-2"],
    3: ["grid-cols-2", "md:grid-cols-3", "lg:grid-cols-3"],
    4: ["grid-cols-2", "md:grid-cols-3", "lg:grid-cols-4"],
    5: ["grid-cols-2", "md:grid-cols-3", "lg:grid-cols-5"],
    6: ["grid-cols-2", "md:grid-cols-4", "lg:grid-cols-6"],
  });

  const gapClasses = getResponsiveClasses(gap, {
    sm: ["gap-2", "md:gap-3", "lg:gap-4"],
    md: ["gap-4", "md:gap-5", "lg:gap-6"],
    lg: ["gap-6", "md:gap-8", "lg:gap-8"],
  });

  if (!products || products.length === 0) {
    return (
      <div id={id} className={`text-center py-12 text-gray-500 ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div id={id} className={className}>
      {(showFilters || showSorting) && (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          {showFilters && (
            <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="text-sm font-medium">Filters</span>
            </button>
          )}
          {showSorting && (
            <select className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Sort by: Featured</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Newest First</option>
              <option>Best Selling</option>
            </select>
          )}
        </div>
      )}
      <div className={`grid ${columnClasses} ${gapClasses}`}>
        {products.map((product, index) => (
          <ProductCardRender key={index} {...product} variant={cardVariant} />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// E-COMMERCE: PRODUCT CATEGORIES
// ============================================================================

export interface ProductCategory {
  name: string;
  image: string;
  link?: string;
  productCount?: number;
}

export interface ProductCategoriesProps {
  categories?: ProductCategory[];
  title?: string;
  subtitle?: string;
  columns?: ResponsiveValue<2 | 3 | 4 | 5 | 6>;
  variant?: "cards" | "circles" | "overlay";
  gap?: ResponsiveValue<"sm" | "md" | "lg">;
  showCount?: boolean;
  id?: string;
  className?: string;
}

export function ProductCategoriesRender({
  categories = [
    { name: "Electronics", image: "/categories/electronics.jpg", productCount: 245 },
    { name: "Clothing", image: "/categories/clothing.jpg", productCount: 512 },
    { name: "Home & Garden", image: "/categories/home.jpg", productCount: 189 },
    { name: "Sports", image: "/categories/sports.jpg", productCount: 98 },
  ],
  title = "Shop by Category",
  subtitle,
  columns = { mobile: 2, tablet: 3, desktop: 4 },
  variant = "cards",
  gap = "md",
  showCount = true,
  id,
  className = "",
}: ProductCategoriesProps) {
  const columnClasses = getResponsiveClasses(columns, {
    2: ["grid-cols-2", "md:grid-cols-2", "lg:grid-cols-2"],
    3: ["grid-cols-2", "md:grid-cols-3", "lg:grid-cols-3"],
    4: ["grid-cols-2", "md:grid-cols-3", "lg:grid-cols-4"],
    5: ["grid-cols-2", "md:grid-cols-3", "lg:grid-cols-5"],
    6: ["grid-cols-3", "md:grid-cols-4", "lg:grid-cols-6"],
  });

  const gapClasses = getResponsiveClasses(gap, {
    sm: ["gap-2", "md:gap-3", "lg:gap-4"],
    md: ["gap-4", "md:gap-5", "lg:gap-6"],
    lg: ["gap-6", "md:gap-8", "lg:gap-8"],
  });

  const renderCategory = (category: ProductCategory, index: number) => {
    if (variant === "circles") {
      return (
        <a key={index} href={category.link || "#"} className="group flex flex-col items-center text-center">
          <div className="w-20 h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full overflow-hidden mb-3 ring-4 ring-transparent group-hover:ring-blue-500 transition-all">
            <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
          </div>
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{category.name}</h3>
          {showCount && category.productCount && (
            <p className="text-sm text-gray-500">{category.productCount} products</p>
          )}
        </a>
      );
    }

    if (variant === "overlay") {
      return (
        <a key={index} href={category.link || "#"} className="group relative aspect-square overflow-hidden rounded-lg">
          <img 
            src={category.image} 
            alt={category.name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
            <h3 className="font-bold text-white text-lg md:text-xl">{category.name}</h3>
            {showCount && category.productCount && (
              <p className="text-white/80 text-sm">{category.productCount} products</p>
            )}
          </div>
        </a>
      );
    }

    // Default: cards
    return (
      <a key={index} href={category.link || "#"} className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all">
        <div className="aspect-video overflow-hidden">
          <img 
            src={category.image} 
            alt={category.name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>
        <div className="p-3 md:p-4">
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{category.name}</h3>
          {showCount && category.productCount && (
            <p className="text-sm text-gray-500">{category.productCount} products</p>
          )}
        </div>
      </a>
    );
  };

  return (
    <div id={id} className={className}>
      {(title || subtitle) && (
        <div className="text-center mb-8 md:mb-12">
          {title && <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>}
          {subtitle && <p className="text-gray-600 mt-2">{subtitle}</p>}
        </div>
      )}
      <div className={`grid ${columnClasses} ${gapClasses}`}>
        {categories.map((cat, index) => renderCategory(cat, index))}
      </div>
    </div>
  );
}

// ============================================================================
// E-COMMERCE: CART SUMMARY
// ============================================================================

export interface CartItem {
  id: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  variant?: string;
}

export interface CartSummaryProps {
  items?: CartItem[];
  currency?: string;
  subtotal?: number;
  shipping?: number | "free";
  tax?: number;
  discount?: number;
  discountCode?: string;
  variant?: "mini" | "sidebar" | "full";
  showQuantityControls?: boolean;
  showRemoveButton?: boolean;
  showCheckoutButton?: boolean;
  checkoutLink?: string;
  id?: string;
  className?: string;
}

export function CartSummaryRender({
  items = [
    { id: "1", name: "Product 1", price: 29.99, quantity: 2 },
    { id: "2", name: "Product 2", price: 49.99, quantity: 1, variant: "Large / Blue" },
  ],
  currency = "$",
  subtotal,
  shipping = "free",
  tax = 0,
  discount = 0,
  discountCode,
  variant = "sidebar",
  showQuantityControls = true,
  showRemoveButton = true,
  showCheckoutButton = true,
  checkoutLink = "/checkout",
  id,
  className = "",
}: CartSummaryProps) {
  const calculatedSubtotal = subtotal ?? items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = shipping === "free" ? 0 : shipping;
  const total = calculatedSubtotal + shippingCost + tax - discount;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  if (variant === "mini") {
    return (
      <div id={id} className={`p-4 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold">Cart ({itemCount})</span>
          <span className="font-bold">{currency}{total.toFixed(2)}</span>
        </div>
        <a 
          href={checkoutLink} 
          className="block w-full py-2 bg-blue-600 text-white text-center font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Checkout
        </a>
      </div>
    );
  }

  return (
    <div id={id} className={`bg-white rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 md:p-6 border-b">
        <h3 className="font-bold text-lg">Shopping Cart ({itemCount} items)</h3>
      </div>

      {/* Items */}
      <div className="divide-y max-h-80 md:max-h-96 overflow-y-auto">
        {items.map((item) => (
          <div key={item.id} className="p-4 md:p-6 flex gap-4">
            {item.image && (
              <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
              {item.variant && <p className="text-sm text-gray-500">{item.variant}</p>}
              <p className="font-semibold mt-1">{currency}{item.price.toFixed(2)}</p>
              
              {showQuantityControls && (
                <div className="flex items-center gap-2 mt-2">
                  <button className="w-6 h-6 rounded border flex items-center justify-center hover:bg-gray-100">−</button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <button className="w-6 h-6 rounded border flex items-center justify-center hover:bg-gray-100">+</button>
                </div>
              )}
            </div>
            {showRemoveButton && (
              <button className="text-gray-400 hover:text-red-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="p-4 md:p-6 border-t bg-gray-50 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{currency}{calculatedSubtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Shipping</span>
          <span className={shipping === "free" ? "text-green-600" : ""}>
            {shipping === "free" ? "FREE" : `${currency}${shippingCost.toFixed(2)}`}
          </span>
        </div>
        {tax > 0 && (
          <div className="flex justify-between text-sm">
            <span>Tax</span>
            <span>{currency}{tax.toFixed(2)}</span>
          </div>
        )}
        {discount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount {discountCode && `(${discountCode})`}</span>
            <span>-{currency}{discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-lg pt-2 border-t">
          <span>Total</span>
          <span>{currency}{total.toFixed(2)}</span>
        </div>
      </div>

      {/* Checkout */}
      {showCheckoutButton && (
        <div className="p-4 md:p-6 border-t">
          <a
            href={checkoutLink}
            className="block w-full py-3 bg-blue-600 text-white text-center font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Proceed to Checkout
          </a>
          <p className="text-xs text-gray-500 text-center mt-2">
            Secure checkout powered by Stripe
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// E-COMMERCE: FEATURED PRODUCTS
// ============================================================================

export interface FeaturedProductsProps {
  title?: string;
  subtitle?: string;
  products?: ProductCardProps[];
  layout?: "carousel" | "grid";
  columns?: ResponsiveValue<2 | 3 | 4>;
  showViewAll?: boolean;
  viewAllLink?: string;
  viewAllText?: string;
  autoplay?: boolean;
  autoplaySpeed?: number;
  id?: string;
  className?: string;
}

export function FeaturedProductsRender({
  title = "Featured Products",
  subtitle,
  products = [
    { title: "Featured 1", price: 99.99, badge: "New" },
    { title: "Featured 2", price: 149.99, originalPrice: 199.99 },
    { title: "Featured 3", price: 79.99, rating: 5, reviewCount: 256 },
    { title: "Featured 4", price: 129.99 },
  ],
  layout = "grid",
  columns = { mobile: 2, tablet: 3, desktop: 4 },
  showViewAll = true,
  viewAllLink = "/products",
  viewAllText = "View All Products →",
  autoplay = false,
  autoplaySpeed = 5000,
  id,
  className = "",
}: FeaturedProductsProps) {
  const columnClasses = getResponsiveClasses(columns, {
    2: ["grid-cols-2", "md:grid-cols-2", "lg:grid-cols-2"],
    3: ["grid-cols-2", "md:grid-cols-3", "lg:grid-cols-3"],
    4: ["grid-cols-2", "md:grid-cols-3", "lg:grid-cols-4"],
  });

  return (
    <div id={id} className={className}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          {title && <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>}
          {subtitle && <p className="text-gray-600 mt-2">{subtitle}</p>}
        </div>
        {showViewAll && (
          <a href={viewAllLink} className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
            {viewAllText}
          </a>
        )}
      </div>

      {/* Products */}
      {layout === "carousel" ? (
        <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
          {products.map((product, index) => (
            <div key={index} className="flex-shrink-0 w-[280px] md:w-[320px] snap-start">
              <ProductCardRender {...product} />
            </div>
          ))}
        </div>
      ) : (
        <div className={`grid ${columnClasses} gap-4 md:gap-6`}>
          {products.map((product, index) => (
            <ProductCardRender key={index} {...product} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// E-COMMERCE: CART ICON
// ============================================================================

export interface CartIconProps {
  itemCount?: number;
  showCount?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "outline" | "filled";
  color?: string;
  badgeColor?: string;
  link?: string;
  onClick?: () => void;
  id?: string;
  className?: string;
}

export function CartIconRender({
  itemCount = 0,
  showCount = true,
  size = "md",
  variant = "outline",
  color = "text-gray-700",
  badgeColor = "bg-blue-600",
  link = "/cart",
  onClick,
  id,
  className = "",
}: CartIconProps) {
  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  }[size];

  const badgeSizeClasses = {
    sm: "w-4 h-4 text-[10px] -top-1 -right-1",
    md: "w-5 h-5 text-xs -top-1.5 -right-1.5",
    lg: "w-6 h-6 text-sm -top-2 -right-2",
  }[size];

  const IconContent = () => (
    <span className={`relative inline-flex ${className}`}>
      {variant === "outline" ? (
        <svg className={`${sizeClasses} ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ) : (
        <svg className={`${sizeClasses} ${color}`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
        </svg>
      )}
      {showCount && itemCount > 0 && (
        <span className={`absolute ${badgeSizeClasses} ${badgeColor} text-white font-bold rounded-full flex items-center justify-center`}>
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </span>
  );

  if (link) {
    return (
      <a id={id} href={link} className="hover:opacity-75 transition-opacity" aria-label={`Cart with ${itemCount} items`}>
        <IconContent />
      </a>
    );
  }

  return (
    <button id={id} onClick={onClick} className="hover:opacity-75 transition-opacity" aria-label={`Cart with ${itemCount} items`}>
      <IconContent />
    </button>
  );
}
