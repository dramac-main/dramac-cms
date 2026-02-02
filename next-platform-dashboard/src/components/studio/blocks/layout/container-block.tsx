/**
 * DRAMAC Studio Premium Block: Container
 * 
 * A flexible container with max-width, flexbox/grid,
 * and responsive gap settings.
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

export interface ContainerBlockProps {
  children?: React.ReactNode;
  
  // Layout
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full" | "none";
  display?: "block" | "flex" | "grid";
  
  // Flex settings
  flexDirection?: ResponsiveValue<"row" | "column" | "row-reverse" | "column-reverse">;
  justifyContent?: "start" | "center" | "end" | "between" | "around" | "evenly";
  alignItems?: "start" | "center" | "end" | "stretch" | "baseline";
  flexWrap?: "nowrap" | "wrap" | "wrap-reverse";
  gap?: ResponsiveValue<string>;
  
  // Grid settings
  gridCols?: ResponsiveValue<1 | 2 | 3 | 4 | 5 | 6 | 12>;
  
  // Spacing
  padding?: ResponsiveValue<Spacing>;
  margin?: ResponsiveValue<Spacing>;
  
  // Style
  backgroundColor?: string;
  borderRadius?: string;
  
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

const MAX_WIDTH_MAP = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
  full: "100%",
  none: "none",
};

const JUSTIFY_MAP = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  between: "space-between",
  around: "space-around",
  evenly: "space-evenly",
};

const ALIGN_MAP = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
  baseline: "baseline",
};

// =============================================================================
// COMPONENT
// =============================================================================

export function ContainerBlock({
  children,
  maxWidth = "xl",
  display = "block",
  flexDirection = { mobile: "column" },
  justifyContent = "start",
  alignItems = "stretch",
  flexWrap = "wrap",
  gap = { mobile: "16px" },
  gridCols = { mobile: 1 },
  padding = { mobile: uniformSpacing("16px") },
  margin = { mobile: { top: "0", right: "auto", bottom: "0", left: "auto" } },
  backgroundColor = "transparent",
  borderRadius = "0",
  animation = DEFAULT_ANIMATION,
  hideOn,
  className,
  id,
}: ContainerBlockProps) {
  // Build styles
  const styles: React.CSSProperties = {
    maxWidth: MAX_WIDTH_MAP[maxWidth],
    backgroundColor,
    borderRadius,
  };
  
  // Display type
  if (display === "flex") {
    styles.display = "flex";
    styles.flexDirection = flexDirection.mobile;
    styles.justifyContent = JUSTIFY_MAP[justifyContent];
    styles.alignItems = ALIGN_MAP[alignItems];
    styles.flexWrap = flexWrap;
    styles.gap = gap.mobile;
  } else if (display === "grid") {
    styles.display = "grid";
    styles.gridTemplateColumns = `repeat(${gridCols.mobile}, minmax(0, 1fr))`;
    styles.gap = gap.mobile;
  }
  
  // Responsive styles
  const responsiveStyles = {
    "--studio-padding-mobile": spacingToCss(padding.mobile),
    "--studio-padding-tablet": spacingToCss(padding.tablet ?? padding.mobile),
    "--studio-padding-desktop": spacingToCss(padding.desktop ?? padding.tablet ?? padding.mobile),
    "--studio-margin-mobile": spacingToCss(margin.mobile),
    "--studio-margin-tablet": spacingToCss(margin.tablet ?? margin.mobile),
    "--studio-margin-desktop": spacingToCss(margin.desktop ?? margin.tablet ?? margin.mobile),
  } as React.CSSProperties;
  
  // Animation
  const animationClass = getAnimationClass(animation);
  const animationStyles = getAnimationStyles(animation);
  
  // Visibility
  const visibilityClass = getVisibilityClass(hideOn);
  
  return (
    <div
      id={id}
      className={cn(
        "studio-responsive-padding studio-responsive-margin",
        animationClass,
        visibilityClass,
        className
      )}
      style={{
        ...styles,
        ...responsiveStyles,
        ...animationStyles,
      }}
    >
      {children}
    </div>
  );
}

// =============================================================================
// FIELD DEFINITIONS
// =============================================================================

export const containerBlockFields = {
  maxWidth: {
    type: "select" as const,
    label: "Max Width",
    options: [
      { label: "Small (640px)", value: "sm" },
      { label: "Medium (768px)", value: "md" },
      { label: "Large (1024px)", value: "lg" },
      { label: "XL (1280px)", value: "xl" },
      { label: "2XL (1536px)", value: "2xl" },
      { label: "Full", value: "full" },
      { label: "None", value: "none" },
    ],
    defaultValue: "xl",
    group: "Layout",
  },
  display: {
    type: "select" as const,
    label: "Display",
    options: [
      { label: "Block", value: "block" },
      { label: "Flex", value: "flex" },
      { label: "Grid", value: "grid" },
    ],
    defaultValue: "block",
    group: "Layout",
  },
  flexDirection: {
    type: "select" as const,
    label: "Flex Direction",
    options: [
      { label: "Row", value: "row" },
      { label: "Column", value: "column" },
      { label: "Row Reverse", value: "row-reverse" },
      { label: "Column Reverse", value: "column-reverse" },
    ],
    defaultValue: "column",
    responsive: true,
    group: "Flex",
  },
  justifyContent: {
    type: "select" as const,
    label: "Justify Content",
    options: [
      { label: "Start", value: "start" },
      { label: "Center", value: "center" },
      { label: "End", value: "end" },
      { label: "Space Between", value: "between" },
      { label: "Space Around", value: "around" },
      { label: "Space Evenly", value: "evenly" },
    ],
    defaultValue: "start",
    group: "Flex",
  },
  alignItems: {
    type: "select" as const,
    label: "Align Items",
    options: [
      { label: "Start", value: "start" },
      { label: "Center", value: "center" },
      { label: "End", value: "end" },
      { label: "Stretch", value: "stretch" },
      { label: "Baseline", value: "baseline" },
    ],
    defaultValue: "stretch",
    group: "Flex",
  },
  gap: {
    type: "text" as const,
    label: "Gap",
    defaultValue: "16px",
    responsive: true,
    group: "Spacing",
  },
  backgroundColor: {
    type: "color" as const,
    label: "Background",
    defaultValue: "transparent",
    group: "Style",
  },
  borderRadius: {
    type: "text" as const,
    label: "Border Radius",
    defaultValue: "0",
    group: "Style",
  },
  padding: {
    type: "spacing" as const,
    label: "Padding",
    responsive: true,
    group: "Spacing",
  },
};

export const containerBlockDefaultProps: ContainerBlockProps = {
  maxWidth: "xl",
  display: "block",
  flexDirection: { mobile: "column" },
  justifyContent: "start",
  alignItems: "stretch",
  flexWrap: "wrap",
  gap: { mobile: "16px" },
  gridCols: { mobile: 1 },
  padding: { mobile: uniformSpacing("16px") },
  margin: { mobile: { top: "0", right: "auto", bottom: "0", left: "auto" } },
  backgroundColor: "transparent",
  borderRadius: "0",
  animation: DEFAULT_ANIMATION,
};
