/**
 * DRAMAC Studio Premium Block: Heading
 * 
 * A rich heading component with typography controls,
 * gradient text, shadows, and animations.
 */

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  type ResponsiveValue,
  type Spacing,
  type AnimationConfig,
  getAnimationClass,
  getAnimationStyles,
  getVisibilityClass,
  DEFAULT_ANIMATION,
  uniformSpacing,
  spacingToCss,
} from "@/lib/studio/utils/responsive-utils";
import type { Breakpoint } from "@/types/studio";

// =============================================================================
// TYPES
// =============================================================================

export interface HeadingBlockProps {
  // Content
  text: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  
  // Typography
  fontFamily?: "heading" | "body" | "mono";
  fontSize?: ResponsiveValue<string>;
  fontWeight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  letterSpacing?: string;
  lineHeight?: string;
  textAlign?: ResponsiveValue<"left" | "center" | "right">;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  
  // Colors
  color?: string;
  gradient?: {
    enabled: boolean;
    type: "linear" | "radial";
    angle: number;
    stops: Array<{ color: string; position: number }>;
  };
  
  // Effects
  textShadow?: {
    enabled: boolean;
    x: number;
    y: number;
    blur: number;
    color: string;
  };
  
  // Spacing
  margin?: ResponsiveValue<Spacing>;
  
  // Animation
  animation?: AnimationConfig;
  
  // Visibility
  hideOn?: Breakpoint[];
  
  // Advanced
  className?: string;
  id?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const FONT_FAMILY_MAP = {
  heading: "var(--font-geist-sans), system-ui, sans-serif",
  body: "var(--font-geist-sans), system-ui, sans-serif",
  mono: "var(--font-geist-mono), monospace",
};

const DEFAULT_FONT_SIZES: Record<number, ResponsiveValue<string>> = {
  1: { mobile: "32px", tablet: "40px", desktop: "48px" },
  2: { mobile: "28px", tablet: "32px", desktop: "40px" },
  3: { mobile: "24px", tablet: "28px", desktop: "32px" },
  4: { mobile: "20px", tablet: "24px", desktop: "28px" },
  5: { mobile: "18px", tablet: "20px", desktop: "24px" },
  6: { mobile: "16px", tablet: "18px", desktop: "20px" },
};

// =============================================================================
// COMPONENT
// =============================================================================

export function HeadingBlock({
  text,
  level = 2,
  fontFamily = "heading",
  fontSize,
  fontWeight = 700,
  letterSpacing = "-0.02em",
  lineHeight = "1.2",
  textAlign = { mobile: "left" },
  textTransform = "none",
  color = "inherit",
  gradient,
  textShadow = { enabled: false, x: 0, y: 2, blur: 4, color: "rgba(0,0,0,0.1)" },
  margin = { mobile: uniformSpacing("0") },
  animation = DEFAULT_ANIMATION,
  hideOn,
  className,
  id,
}: HeadingBlockProps) {
  // Use level-appropriate default font size if not specified
  const effectiveFontSize = fontSize ?? DEFAULT_FONT_SIZES[level];
  
  // Build text styles
  const textStyles: React.CSSProperties = {
    fontFamily: FONT_FAMILY_MAP[fontFamily],
    fontWeight,
    letterSpacing,
    lineHeight,
    textTransform,
    color: gradient?.enabled ? "transparent" : color,
  };
  
  // Responsive font size
  const responsiveFontSizeStyles = {
    "--studio-font-size-mobile": effectiveFontSize.mobile,
    "--studio-font-size-tablet": effectiveFontSize.tablet ?? effectiveFontSize.mobile,
    "--studio-font-size-desktop": effectiveFontSize.desktop ?? effectiveFontSize.tablet ?? effectiveFontSize.mobile,
  } as React.CSSProperties;
  
  // Responsive text align
  const responsiveTextAlignStyles = {
    "--studio-text-align-mobile": textAlign.mobile,
    "--studio-text-align-tablet": textAlign.tablet ?? textAlign.mobile,
    "--studio-text-align-desktop": textAlign.desktop ?? textAlign.tablet ?? textAlign.mobile,
  } as React.CSSProperties;
  
  // Responsive margin
  const responsiveMarginStyles = {
    "--studio-margin-mobile": spacingToCss(margin.mobile),
    "--studio-margin-tablet": spacingToCss(margin.tablet ?? margin.mobile),
    "--studio-margin-desktop": spacingToCss(margin.desktop ?? margin.tablet ?? margin.mobile),
  } as React.CSSProperties;
  
  // Gradient text
  if (gradient?.enabled && gradient.stops.length >= 2) {
    const gradientStops = gradient.stops
      .map((s) => `${s.color} ${s.position}%`)
      .join(", ");
    
    if (gradient.type === "linear") {
      textStyles.backgroundImage = `linear-gradient(${gradient.angle}deg, ${gradientStops})`;
    } else {
      textStyles.backgroundImage = `radial-gradient(circle, ${gradientStops})`;
    }
    textStyles.backgroundClip = "text";
    textStyles.WebkitBackgroundClip = "text";
  }
  
  // Text shadow
  if (textShadow.enabled) {
    textStyles.textShadow = `${textShadow.x}px ${textShadow.y}px ${textShadow.blur}px ${textShadow.color}`;
  }
  
  // Animation
  const animationClass = getAnimationClass(animation);
  const animationStyles = getAnimationStyles(animation);
  
  // Visibility
  const visibilityClass = getVisibilityClass(hideOn);
  
  // Render based on level
  const headingProps = {
    id,
    className: cn(
      "studio-responsive-font-size studio-responsive-margin",
      animationClass,
      visibilityClass,
      className
    ),
    style: {
      ...textStyles,
      ...responsiveFontSizeStyles,
      ...responsiveTextAlignStyles,
      ...responsiveMarginStyles,
      ...animationStyles,
      textAlign: textAlign.mobile,
    },
  };
  
  switch (level) {
    case 1:
      return <h1 {...headingProps}>{text}</h1>;
    case 2:
      return <h2 {...headingProps}>{text}</h2>;
    case 3:
      return <h3 {...headingProps}>{text}</h3>;
    case 4:
      return <h4 {...headingProps}>{text}</h4>;
    case 5:
      return <h5 {...headingProps}>{text}</h5>;
    case 6:
      return <h6 {...headingProps}>{text}</h6>;
    default:
      return <h2 {...headingProps}>{text}</h2>;
  }
}

// =============================================================================
// FIELD DEFINITIONS
// =============================================================================

export const headingBlockFields = {
  text: {
    type: "text" as const,
    label: "Text",
    defaultValue: "Your Heading Here",
  },
  level: {
    type: "select" as const,
    label: "Level",
    options: [
      { label: "H1", value: 1 },
      { label: "H2", value: 2 },
      { label: "H3", value: 3 },
      { label: "H4", value: 4 },
      { label: "H5", value: 5 },
      { label: "H6", value: 6 },
    ],
    defaultValue: 2,
  },
  fontFamily: {
    type: "select" as const,
    label: "Font Family",
    options: [
      { label: "Heading", value: "heading" },
      { label: "Body", value: "body" },
      { label: "Mono", value: "mono" },
    ],
    defaultValue: "heading",
    group: "Typography",
  },
  fontSize: {
    type: "text" as const,
    label: "Font Size",
    responsive: true,
    group: "Typography",
  },
  fontWeight: {
    type: "select" as const,
    label: "Font Weight",
    options: [
      { label: "Thin (100)", value: 100 },
      { label: "Extra Light (200)", value: 200 },
      { label: "Light (300)", value: 300 },
      { label: "Normal (400)", value: 400 },
      { label: "Medium (500)", value: 500 },
      { label: "Semibold (600)", value: 600 },
      { label: "Bold (700)", value: 700 },
      { label: "Extra Bold (800)", value: 800 },
      { label: "Black (900)", value: 900 },
    ],
    defaultValue: 700,
    group: "Typography",
  },
  letterSpacing: {
    type: "text" as const,
    label: "Letter Spacing",
    defaultValue: "-0.02em",
    group: "Typography",
  },
  lineHeight: {
    type: "text" as const,
    label: "Line Height",
    defaultValue: "1.2",
    group: "Typography",
  },
  textAlign: {
    type: "select" as const,
    label: "Text Align",
    options: [
      { label: "Left", value: "left" },
      { label: "Center", value: "center" },
      { label: "Right", value: "right" },
    ],
    defaultValue: "left",
    responsive: true,
    group: "Typography",
  },
  textTransform: {
    type: "select" as const,
    label: "Text Transform",
    options: [
      { label: "None", value: "none" },
      { label: "Uppercase", value: "uppercase" },
      { label: "Lowercase", value: "lowercase" },
      { label: "Capitalize", value: "capitalize" },
    ],
    defaultValue: "none",
    group: "Typography",
  },
  color: {
    type: "color" as const,
    label: "Color",
    defaultValue: "inherit",
    group: "Colors",
  },
};

export const headingBlockDefaultProps: HeadingBlockProps = {
  text: "Your Heading Here",
  level: 2,
  fontFamily: "heading",
  fontWeight: 700,
  letterSpacing: "-0.02em",
  lineHeight: "1.2",
  textAlign: { mobile: "left" },
  textTransform: "none",
  color: "inherit",
  gradient: { enabled: false, type: "linear", angle: 90, stops: [] },
  textShadow: { enabled: false, x: 0, y: 2, blur: 4, color: "rgba(0,0,0,0.1)" },
  margin: { mobile: uniformSpacing("0") },
  animation: DEFAULT_ANIMATION,
};
