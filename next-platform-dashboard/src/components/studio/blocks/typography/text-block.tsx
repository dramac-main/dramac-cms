/**
 * DRAMAC Studio Premium Block: Text
 * 
 * A rich paragraph component with typography controls,
 * columns, drop cap, and animations.
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

export interface TextBlockProps {
  // Content
  text: string;
  
  // Typography
  fontFamily?: "heading" | "body" | "mono";
  fontSize?: ResponsiveValue<string>;
  fontWeight?: 400 | 500 | 600 | 700;
  letterSpacing?: string;
  lineHeight?: string;
  textAlign?: ResponsiveValue<"left" | "center" | "right" | "justify">;
  
  // Colors
  color?: string;
  
  // Advanced Typography
  columns?: ResponsiveValue<1 | 2 | 3>;
  columnGap?: string;
  dropCap?: boolean;
  
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
// COMPONENT
// =============================================================================

export function TextBlock({
  text,
  fontFamily = "body",
  fontSize = { mobile: "16px", tablet: "16px", desktop: "18px" },
  fontWeight = 400,
  letterSpacing = "0",
  lineHeight = "1.7",
  textAlign = { mobile: "left" },
  color = "inherit",
  columns = { mobile: 1 },
  columnGap = "32px",
  dropCap = false,
  margin = { mobile: uniformSpacing("0 0 16px 0") },
  animation = DEFAULT_ANIMATION,
  hideOn,
  className,
  id,
}: TextBlockProps) {
  // Build text styles
  const textStyles: React.CSSProperties = {
    fontFamily: fontFamily === "mono" 
      ? "var(--font-geist-mono), monospace"
      : "var(--font-geist-sans), system-ui, sans-serif",
    fontWeight,
    letterSpacing,
    lineHeight,
    color,
    columnGap,
  };
  
  // Responsive styles
  const responsiveStyles = {
    "--studio-font-size-mobile": fontSize.mobile,
    "--studio-font-size-tablet": fontSize.tablet ?? fontSize.mobile,
    "--studio-font-size-desktop": fontSize.desktop ?? fontSize.tablet ?? fontSize.mobile,
    "--studio-margin-mobile": spacingToCss(margin.mobile),
    "--studio-margin-tablet": spacingToCss(margin.tablet ?? margin.mobile),
    "--studio-margin-desktop": spacingToCss(margin.desktop ?? margin.tablet ?? margin.mobile),
    "--studio-columns-mobile": columns.mobile,
    "--studio-columns-tablet": columns.tablet ?? columns.mobile,
    "--studio-columns-desktop": columns.desktop ?? columns.tablet ?? columns.mobile,
  } as React.CSSProperties;
  
  // Animation
  const animationClass = getAnimationClass(animation);
  const animationStyles = getAnimationStyles(animation);
  
  // Visibility
  const visibilityClass = getVisibilityClass(hideOn);
  
  return (
    <p
      id={id}
      className={cn(
        "studio-responsive-font-size studio-responsive-margin",
        dropCap && "first-letter:float-left first-letter:text-5xl first-letter:font-bold first-letter:mr-2 first-letter:leading-none",
        animationClass,
        visibilityClass,
        className
      )}
      style={{
        ...textStyles,
        ...responsiveStyles,
        ...animationStyles,
        columnCount: columns.mobile,
        textAlign: textAlign.mobile,
      }}
    >
      {text}
    </p>
  );
}

// =============================================================================
// FIELD DEFINITIONS
// =============================================================================

export const textBlockFields = {
  text: {
    type: "textarea" as const,
    label: "Text",
    rows: 4,
    defaultValue: "Enter your text here. This is a paragraph component with rich typography controls.",
  },
  fontFamily: {
    type: "select" as const,
    label: "Font Family",
    options: [
      { label: "Body", value: "body" },
      { label: "Heading", value: "heading" },
      { label: "Mono", value: "mono" },
    ],
    defaultValue: "body",
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
      { label: "Normal (400)", value: 400 },
      { label: "Medium (500)", value: 500 },
      { label: "Semibold (600)", value: 600 },
      { label: "Bold (700)", value: 700 },
    ],
    defaultValue: 400,
    group: "Typography",
  },
  lineHeight: {
    type: "text" as const,
    label: "Line Height",
    defaultValue: "1.7",
    group: "Typography",
  },
  textAlign: {
    type: "select" as const,
    label: "Text Align",
    options: [
      { label: "Left", value: "left" },
      { label: "Center", value: "center" },
      { label: "Right", value: "right" },
      { label: "Justify", value: "justify" },
    ],
    defaultValue: "left",
    responsive: true,
    group: "Typography",
  },
  color: {
    type: "color" as const,
    label: "Color",
    defaultValue: "inherit",
    group: "Colors",
  },
  columns: {
    type: "select" as const,
    label: "Columns",
    options: [
      { label: "1", value: 1 },
      { label: "2", value: 2 },
      { label: "3", value: 3 },
    ],
    defaultValue: 1,
    responsive: true,
    group: "Layout",
  },
  dropCap: {
    type: "toggle" as const,
    label: "Drop Cap",
    defaultValue: false,
    group: "Effects",
  },
};

export const textBlockDefaultProps: TextBlockProps = {
  text: "Enter your text here. This is a paragraph component with rich typography controls.",
  fontFamily: "body",
  fontSize: { mobile: "16px", tablet: "16px", desktop: "18px" },
  fontWeight: 400,
  letterSpacing: "0",
  lineHeight: "1.7",
  textAlign: { mobile: "left" },
  color: "inherit",
  columns: { mobile: 1 },
  columnGap: "32px",
  dropCap: false,
  margin: { mobile: uniformSpacing("0 0 16px 0") },
  animation: DEFAULT_ANIMATION,
};
