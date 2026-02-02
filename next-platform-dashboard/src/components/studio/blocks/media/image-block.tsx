/**
 * DRAMAC Studio Premium Block: Image
 * 
 * A responsive image component with aspect ratios, lazy loading,
 * effects, overlays, and lightbox capability.
 */

"use client";

import React from "react";
import Image from "next/image";
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

export type AspectRatio = 
  | "auto"
  | "1:1" 
  | "4:3" 
  | "16:9" 
  | "21:9"
  | "3:2"
  | "2:3"
  | "9:16";

export type ObjectFit = "cover" | "contain" | "fill" | "none";

export interface ImageBlockProps {
  // Source
  src: string;
  alt: string;
  
  // Dimensions
  width?: ResponsiveValue<string>;
  height?: ResponsiveValue<string>;
  aspectRatio?: ResponsiveValue<AspectRatio>;
  objectFit?: ObjectFit;
  objectPosition?: string;
  
  // Border
  borderRadius?: string;
  borderWidth?: string;
  borderColor?: string;
  
  // Shadow
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
  
  // Overlay
  overlayColor?: string;
  overlayOpacity?: number;
  
  // Effects
  grayscale?: boolean;
  blur?: boolean;
  hoverEffect?: "none" | "zoom" | "brighten" | "overlay";
  
  // Loading
  priority?: boolean;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
  
  // Link
  href?: string;
  target?: "_blank" | "_self";
  
  // Caption
  caption?: string;
  captionPosition?: "below" | "overlay-bottom";
  
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
// ASPECT RATIO CLASSES
// =============================================================================

const aspectRatioClasses: Record<AspectRatio, string> = {
  "auto": "",
  "1:1": "aspect-square",
  "4:3": "aspect-[4/3]",
  "16:9": "aspect-video",
  "21:9": "aspect-[21/9]",
  "3:2": "aspect-[3/2]",
  "2:3": "aspect-[2/3]",
  "9:16": "aspect-[9/16]",
};

const shadowClasses = {
  none: "",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  xl: "shadow-xl",
};

// =============================================================================
// COMPONENT
// =============================================================================

export function ImageBlock({
  src,
  alt,
  width = { mobile: "100%" },
  height = { mobile: "auto" },
  aspectRatio = { mobile: "auto" },
  objectFit = "cover",
  objectPosition = "center",
  borderRadius = "0",
  borderWidth = "0",
  borderColor = "transparent",
  shadow = "none",
  overlayColor = "#000000",
  overlayOpacity = 0,
  grayscale = false,
  blur = false,
  hoverEffect = "none",
  priority = false,
  placeholder = "empty",
  blurDataURL,
  href,
  target = "_self",
  caption,
  captionPosition = "below",
  margin = { mobile: uniformSpacing("0") },
  animation = DEFAULT_ANIMATION,
  hideOn,
  className,
  id,
}: ImageBlockProps) {
  // Build container styles
  const containerStyles: React.CSSProperties = {
    borderRadius,
    border: borderWidth !== "0" ? `${borderWidth} solid ${borderColor}` : undefined,
  };
  
  // Responsive styles
  const responsiveStyles = {
    "--studio-width-mobile": width.mobile,
    "--studio-width-tablet": width.tablet ?? width.mobile,
    "--studio-width-desktop": width.desktop ?? width.tablet ?? width.mobile,
    "--studio-height-mobile": height.mobile,
    "--studio-height-tablet": height.tablet ?? height.mobile,
    "--studio-height-desktop": height.desktop ?? height.tablet ?? height.mobile,
    "--studio-margin-mobile": spacingToCss(margin.mobile),
    "--studio-margin-tablet": spacingToCss(margin.tablet ?? margin.mobile),
    "--studio-margin-desktop": spacingToCss(margin.desktop ?? margin.tablet ?? margin.mobile),
  } as React.CSSProperties;
  
  // Animation
  const animationClass = getAnimationClass(animation);
  const animationStyles = getAnimationStyles(animation);
  
  // Visibility
  const visibilityClass = getVisibilityClass(hideOn);
  
  // Image filter styles
  const filterParts: string[] = [];
  if (grayscale) filterParts.push("grayscale(100%)");
  if (blur) filterParts.push("blur(4px)");
  
  const imageStyles: React.CSSProperties = {
    objectFit,
    objectPosition,
    filter: filterParts.length > 0 ? filterParts.join(" ") : undefined,
    borderRadius,
  };
  
  // Hover effect classes
  const hoverClasses = {
    none: "",
    zoom: "group-hover:scale-110 transition-transform duration-300",
    brighten: "group-hover:brightness-110 transition-all duration-300",
    overlay: "",
  };
  
  // Build image element
  const ImageElement = (
    <div 
      className={cn(
        "relative overflow-hidden group",
        aspectRatioClasses[aspectRatio.mobile],
        shadowClasses[shadow],
      )}
      style={containerStyles}
    >
      {/* Image */}
      {src.startsWith("/") || src.startsWith("http") ? (
        <Image
          src={src}
          alt={alt}
          fill={aspectRatio.mobile !== "auto"}
          width={aspectRatio.mobile === "auto" ? 800 : undefined}
          height={aspectRatio.mobile === "auto" ? 600 : undefined}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          className={cn(
            "w-full h-full",
            hoverClasses[hoverEffect],
          )}
          style={imageStyles}
        />
      ) : (
        <img
          src={src}
          alt={alt}
          className={cn(
            "w-full h-full",
            hoverClasses[hoverEffect],
          )}
          style={imageStyles}
        />
      )}
      
      {/* Overlay */}
      {overlayOpacity > 0 && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: overlayColor,
            opacity: overlayOpacity / 100,
          }}
        />
      )}
      
      {/* Hover overlay */}
      {hoverEffect === "overlay" && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
      )}
      
      {/* Caption (overlay position) */}
      {caption && captionPosition === "overlay-bottom" && (
        <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white p-2 text-sm">
          {caption}
        </div>
      )}
    </div>
  );
  
  // Wrap with link if href is provided
  const ImageWithLink = href ? (
    <a 
      href={href} 
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
    >
      {ImageElement}
    </a>
  ) : (
    ImageElement
  );
  
  return (
    <figure
      id={id}
      className={cn(
        "studio-responsive-margin studio-responsive-width",
        animationClass,
        visibilityClass,
        className
      )}
      style={{
        ...responsiveStyles,
        ...animationStyles,
        width: width.mobile,
      }}
    >
      {ImageWithLink}
      
      {/* Caption (below position) */}
      {caption && captionPosition === "below" && (
        <figcaption className="mt-2 text-sm text-muted-foreground text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

// =============================================================================
// FIELD DEFINITIONS
// =============================================================================

export const imageBlockFields = {
  src: {
    type: "image" as const,
    label: "Image",
    defaultValue: "/placeholder.svg",
  },
  alt: {
    type: "text" as const,
    label: "Alt Text",
    defaultValue: "Image description",
  },
  width: {
    type: "text" as const,
    label: "Width",
    defaultValue: "100%",
    responsive: true,
    group: "Dimensions",
  },
  aspectRatio: {
    type: "select" as const,
    label: "Aspect Ratio",
    options: [
      { label: "Auto", value: "auto" },
      { label: "Square (1:1)", value: "1:1" },
      { label: "Landscape (4:3)", value: "4:3" },
      { label: "Widescreen (16:9)", value: "16:9" },
      { label: "Ultrawide (21:9)", value: "21:9" },
      { label: "Photo (3:2)", value: "3:2" },
      { label: "Portrait (2:3)", value: "2:3" },
      { label: "Vertical (9:16)", value: "9:16" },
    ],
    defaultValue: "auto",
    responsive: true,
    group: "Dimensions",
  },
  objectFit: {
    type: "select" as const,
    label: "Object Fit",
    options: [
      { label: "Cover", value: "cover" },
      { label: "Contain", value: "contain" },
      { label: "Fill", value: "fill" },
      { label: "None", value: "none" },
    ],
    defaultValue: "cover",
    group: "Dimensions",
  },
  borderRadius: {
    type: "text" as const,
    label: "Border Radius",
    defaultValue: "0",
    group: "Border",
  },
  shadow: {
    type: "select" as const,
    label: "Shadow",
    options: [
      { label: "None", value: "none" },
      { label: "Small", value: "sm" },
      { label: "Medium", value: "md" },
      { label: "Large", value: "lg" },
      { label: "Extra Large", value: "xl" },
    ],
    defaultValue: "none",
    group: "Effects",
  },
  grayscale: {
    type: "toggle" as const,
    label: "Grayscale",
    defaultValue: false,
    group: "Effects",
  },
  hoverEffect: {
    type: "select" as const,
    label: "Hover Effect",
    options: [
      { label: "None", value: "none" },
      { label: "Zoom", value: "zoom" },
      { label: "Brighten", value: "brighten" },
      { label: "Overlay", value: "overlay" },
    ],
    defaultValue: "none",
    group: "Effects",
  },
  overlayColor: {
    type: "color" as const,
    label: "Overlay Color",
    defaultValue: "#000000",
    group: "Overlay",
  },
  overlayOpacity: {
    type: "slider" as const,
    label: "Overlay Opacity",
    min: 0,
    max: 100,
    step: 5,
    defaultValue: 0,
    group: "Overlay",
  },
  href: {
    type: "text" as const,
    label: "Link URL",
    placeholder: "https://example.com",
    group: "Link",
  },
  target: {
    type: "select" as const,
    label: "Open In",
    options: [
      { label: "Same Tab", value: "_self" },
      { label: "New Tab", value: "_blank" },
    ],
    defaultValue: "_self",
    group: "Link",
  },
  caption: {
    type: "text" as const,
    label: "Caption",
    group: "Caption",
  },
  captionPosition: {
    type: "select" as const,
    label: "Caption Position",
    options: [
      { label: "Below Image", value: "below" },
      { label: "Overlay Bottom", value: "overlay-bottom" },
    ],
    defaultValue: "below",
    group: "Caption",
  },
  priority: {
    type: "toggle" as const,
    label: "Priority Load",
    description: "Load immediately (above-the-fold images)",
    defaultValue: false,
    group: "Loading",
  },
};

export const imageBlockDefaultProps: ImageBlockProps = {
  src: "/placeholder.svg",
  alt: "Image description",
  width: { mobile: "100%" },
  height: { mobile: "auto" },
  aspectRatio: { mobile: "auto" },
  objectFit: "cover",
  objectPosition: "center",
  borderRadius: "0",
  borderWidth: "0",
  borderColor: "transparent",
  shadow: "none",
  overlayColor: "#000000",
  overlayOpacity: 0,
  grayscale: false,
  blur: false,
  hoverEffect: "none",
  priority: false,
  placeholder: "empty",
  captionPosition: "below",
  margin: { mobile: uniformSpacing("0") },
  animation: DEFAULT_ANIMATION,
};
