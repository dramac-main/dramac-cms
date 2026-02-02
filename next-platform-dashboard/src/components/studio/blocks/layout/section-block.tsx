/**
 * DRAMAC Studio Premium Block: Section
 * 
 * A full-width section with advanced background options,
 * responsive padding, and animation support.
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
  uniformSpacing,
  spacingToCss,
  DEFAULT_ANIMATION,
} from "@/lib/studio/utils/responsive-utils";
import type { Breakpoint } from "@/types/studio";

// =============================================================================
// TYPES
// =============================================================================

// ImageValue type for Wave 3 advanced field system
type ImageValue = {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
};

// Helper to extract URL from string or ImageValue object
function extractImageUrl(src: string | ImageValue | undefined): string {
  if (!src) return "";
  if (typeof src === "string") return src;
  if (typeof src === "object" && "url" in src) return src.url || "";
  return "";
}

export interface SectionBlockProps {
  children?: React.ReactNode;
  
  // Background
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundPosition?: "center" | "top" | "bottom" | "left" | "right";
  backgroundSize?: "cover" | "contain" | "auto";
  backgroundOverlay?: {
    enabled: boolean;
    color: string;
    opacity: number;
  };
  
  // Gradient Background
  gradient?: {
    enabled: boolean;
    type: "linear" | "radial";
    angle: number;
    stops: Array<{ color: string; position: number }>;
  };
  
  // Layout
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full" | "none";
  minHeight?: ResponsiveValue<string>;
  padding?: ResponsiveValue<Spacing>;
  
  // Content Alignment
  contentAlign?: ResponsiveValue<"left" | "center" | "right">;
  verticalAlign?: "top" | "center" | "bottom";
  
  // Border
  borderRadius?: string;
  borderWidth?: string;
  borderColor?: string;
  
  // Effects
  parallax?: boolean;
  parallaxSpeed?: number;
  
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

// =============================================================================
// COMPONENT
// =============================================================================

export function SectionBlock({
  children,
  backgroundColor = "transparent",
  backgroundImage,
  backgroundPosition = "center",
  backgroundSize = "cover",
  backgroundOverlay = { enabled: false, color: "#000000", opacity: 0.5 },
  gradient,
  maxWidth = "xl",
  minHeight = { mobile: "auto" },
  padding = {
    mobile: uniformSpacing("24px"),
    tablet: uniformSpacing("48px"),
    desktop: uniformSpacing("64px"),
  },
  contentAlign = { mobile: "left" },
  verticalAlign = "top",
  borderRadius = "0",
  borderWidth = "0",
  borderColor = "transparent",
  parallax = false,
  animation = DEFAULT_ANIMATION,
  hideOn,
  className,
  id,
}: SectionBlockProps) {
  // Extract URL from ImageValue or string
  const bgImageUrl = extractImageUrl(backgroundImage as string | ImageValue | undefined);
  
  // Build background style
  const backgroundStyles: React.CSSProperties = {
    backgroundColor,
    borderRadius,
    borderWidth,
    borderColor,
    borderStyle: borderWidth !== "0" ? "solid" : undefined,
  };
  
  // Add background image
  if (bgImageUrl) {
    backgroundStyles.backgroundImage = `url(${bgImageUrl})`;
    backgroundStyles.backgroundPosition = backgroundPosition;
    backgroundStyles.backgroundSize = backgroundSize;
    backgroundStyles.backgroundRepeat = "no-repeat";
    
    if (parallax) {
      backgroundStyles.backgroundAttachment = "fixed";
    }
  }
  
  // Add gradient
  if (gradient?.enabled && gradient.stops.length >= 2) {
    const gradientStops = gradient.stops
      .map((s) => `${s.color} ${s.position}%`)
      .join(", ");
    
    if (gradient.type === "linear") {
      backgroundStyles.backgroundImage = `linear-gradient(${gradient.angle}deg, ${gradientStops})`;
    } else {
      backgroundStyles.backgroundImage = `radial-gradient(circle, ${gradientStops})`;
    }
  }
  
  // Animation
  const animationClass = getAnimationClass(animation);
  const animationStyles = getAnimationStyles(animation);
  
  // Visibility
  const visibilityClass = getVisibilityClass(hideOn);
  
  // Responsive padding CSS custom properties
  const responsivePaddingStyles = {
    "--studio-padding-mobile": spacingToCss(padding.mobile),
    "--studio-padding-tablet": spacingToCss(padding.tablet ?? padding.mobile),
    "--studio-padding-desktop": spacingToCss(padding.desktop ?? padding.tablet ?? padding.mobile),
  } as React.CSSProperties;
  
  // Min height responsive
  const responsiveMinHeightStyles = {
    "--studio-min-height-mobile": minHeight.mobile,
    "--studio-min-height-tablet": minHeight.tablet ?? minHeight.mobile,
    "--studio-min-height-desktop": minHeight.desktop ?? minHeight.tablet ?? minHeight.mobile,
  } as React.CSSProperties;
  
  // Vertical alignment
  const verticalAlignMap = {
    top: "flex-start",
    center: "center",
    bottom: "flex-end",
  };
  
  return (
    <section
      id={id}
      className={cn(
        "relative w-full studio-responsive-padding",
        animationClass,
        visibilityClass,
        className
      )}
      style={{
        ...backgroundStyles,
        ...animationStyles,
        ...responsivePaddingStyles,
        ...responsiveMinHeightStyles,
        minHeight: "var(--studio-min-height-mobile)",
        display: "flex",
        flexDirection: "column",
        alignItems: verticalAlignMap[verticalAlign],
      }}
    >
      {/* Background overlay */}
      {backgroundOverlay.enabled && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: backgroundOverlay.color,
            opacity: backgroundOverlay.opacity,
            borderRadius,
          }}
        />
      )}
      
      {/* Content container */}
      <div
        className="relative z-10 w-full mx-auto"
        style={{
          maxWidth: MAX_WIDTH_MAP[maxWidth],
          textAlign: contentAlign.mobile,
        }}
      >
        {children}
      </div>
    </section>
  );
}

// =============================================================================
// FIELD DEFINITIONS (for registry)
// =============================================================================

export const sectionBlockFields = {
  backgroundColor: {
    type: "color" as const,
    label: "Background Color",
    defaultValue: "transparent",
    group: "Background",
  },
  backgroundImage: {
    type: "image" as const,
    label: "Background Image",
    group: "Background",
  },
  backgroundPosition: {
    type: "select" as const,
    label: "Background Position",
    options: [
      { label: "Center", value: "center" },
      { label: "Top", value: "top" },
      { label: "Bottom", value: "bottom" },
      { label: "Left", value: "left" },
      { label: "Right", value: "right" },
    ],
    defaultValue: "center",
    group: "Background",
  },
  backgroundSize: {
    type: "select" as const,
    label: "Background Size",
    options: [
      { label: "Cover", value: "cover" },
      { label: "Contain", value: "contain" },
      { label: "Auto", value: "auto" },
    ],
    defaultValue: "cover",
    group: "Background",
  },
  maxWidth: {
    type: "select" as const,
    label: "Max Width",
    options: [
      { label: "Small (640px)", value: "sm" },
      { label: "Medium (768px)", value: "md" },
      { label: "Large (1024px)", value: "lg" },
      { label: "XL (1280px)", value: "xl" },
      { label: "2XL (1536px)", value: "2xl" },
      { label: "Full Width", value: "full" },
      { label: "None", value: "none" },
    ],
    defaultValue: "xl",
    group: "Layout",
  },
  minHeight: {
    type: "text" as const,
    label: "Min Height",
    defaultValue: "auto",
    responsive: true,
    group: "Layout",
  },
  padding: {
    type: "spacing" as const,
    label: "Padding",
    responsive: true,
    group: "Spacing",
  },
  verticalAlign: {
    type: "select" as const,
    label: "Vertical Align",
    options: [
      { label: "Top", value: "top" },
      { label: "Center", value: "center" },
      { label: "Bottom", value: "bottom" },
    ],
    defaultValue: "top",
    group: "Layout",
  },
  borderRadius: {
    type: "text" as const,
    label: "Border Radius",
    defaultValue: "0",
    group: "Border",
  },
  parallax: {
    type: "toggle" as const,
    label: "Parallax Effect",
    defaultValue: false,
    group: "Effects",
  },
};

export const sectionBlockDefaultProps: SectionBlockProps = {
  backgroundColor: "transparent",
  backgroundPosition: "center",
  backgroundSize: "cover",
  backgroundOverlay: { enabled: false, color: "#000000", opacity: 0.5 },
  maxWidth: "xl",
  minHeight: { mobile: "auto" },
  padding: {
    mobile: uniformSpacing("24px"),
    tablet: uniformSpacing("48px"),
    desktop: uniformSpacing("64px"),
  },
  contentAlign: { mobile: "left" },
  verticalAlign: "top",
  borderRadius: "0",
  borderWidth: "0",
  borderColor: "transparent",
  parallax: false,
  parallaxSpeed: 0.5,
  animation: DEFAULT_ANIMATION,
};
