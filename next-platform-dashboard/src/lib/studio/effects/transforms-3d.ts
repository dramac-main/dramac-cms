/**
 * DRAMAC Studio - 3D Transform System
 * 
 * CSS 3D transforms with perspective controls.
 * 
 * @phase STUDIO-31 - 3D Effects & Advanced Animations
 */

import type React from "react";

// =============================================================================
// TYPES
// =============================================================================

/** 3D Transform Configuration */
export interface Transform3DConfig {
  // Rotation
  rotateX?: number;      // -180 to 180 degrees
  rotateY?: number;      // -180 to 180 degrees
  rotateZ?: number;      // -180 to 180 degrees
  
  // Translation
  translateX?: number;   // pixels
  translateY?: number;   // pixels
  translateZ?: number;   // pixels (depth)
  
  // Scale
  scale?: number;        // 0.1 to 2
  scaleX?: number;
  scaleY?: number;
  
  // Perspective (applied to parent)
  perspective?: number;  // pixels (500-2000 typical)
  perspectiveOrigin?: string; // "50% 50%"
  
  // Transform origin
  transformOrigin?: string;
  
  // Preserve 3D
  preserve3D?: boolean;
  
  // Backface visibility
  backfaceHidden?: boolean;
}

/** 3D Preset type */
export type Transform3DPreset = 
  | "none"
  | "card-flip"
  | "tilt-hover"
  | "float"
  | "swing"
  | "pop-out"
  | "perspective-tilt"
  | "book-open";

// =============================================================================
// PRESET 3D EFFECTS
// =============================================================================

export const TRANSFORM_3D_PRESETS = {
  // Card flip effect
  "card-flip": {
    initial: { rotateY: 0 },
    hover: { rotateY: 180 },
    perspective: 1000,
    preserve3D: true,
    backfaceHidden: true,
  },
  
  // Tilt on hover
  "tilt-hover": {
    hoverEffect: true,
    maxRotation: 15,
    perspective: 1000,
    scale: 1.05,
  },
  
  // Float effect
  "float": {
    animation: {
      keyframes: [
        { translateY: 0, rotateX: 0 },
        { translateY: -10, rotateX: 2 },
        { translateY: 0, rotateX: 0 },
      ],
      duration: 3000,
      easing: "ease-in-out",
      iterations: "infinite",
    },
  },
  
  // Swing effect
  "swing": {
    animation: {
      keyframes: [
        { rotateZ: 0 },
        { rotateZ: 5 },
        { rotateZ: -5 },
        { rotateZ: 0 },
      ],
      duration: 2000,
      easing: "ease-in-out",
      iterations: "infinite",
    },
    transformOrigin: "top center",
  },
  
  // Pop out
  "pop-out": {
    initial: { translateZ: 0, scale: 1 },
    hover: { translateZ: 50, scale: 1.1 },
    perspective: 800,
    transition: "transform 0.3s ease-out",
  },
  
  // Perspective tilt
  "perspective-tilt": {
    rotateX: 10,
    rotateY: -10,
    perspective: 1200,
    preserve3D: true,
  },
  
  // Book open
  "book-open": {
    initial: { rotateY: 0 },
    hover: { rotateY: -30 },
    perspective: 1500,
    transformOrigin: "left center",
  },
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate CSS transform string from config
 */
export function generateTransformCSS(config: Transform3DConfig): string {
  const transforms: string[] = [];
  
  if (config.translateX !== undefined) transforms.push(`translateX(${config.translateX}px)`);
  if (config.translateY !== undefined) transforms.push(`translateY(${config.translateY}px)`);
  if (config.translateZ !== undefined) transforms.push(`translateZ(${config.translateZ}px)`);
  if (config.rotateX !== undefined) transforms.push(`rotateX(${config.rotateX}deg)`);
  if (config.rotateY !== undefined) transforms.push(`rotateY(${config.rotateY}deg)`);
  if (config.rotateZ !== undefined) transforms.push(`rotateZ(${config.rotateZ}deg)`);
  if (config.scale !== undefined) transforms.push(`scale(${config.scale})`);
  if (config.scaleX !== undefined) transforms.push(`scaleX(${config.scaleX})`);
  if (config.scaleY !== undefined) transforms.push(`scaleY(${config.scaleY})`);
  
  return transforms.join(" ");
}

/**
 * Generate parent container styles for 3D perspective
 */
export function generatePerspectiveStyles(config: Transform3DConfig): React.CSSProperties {
  const styles: React.CSSProperties = {};
  
  if (config.perspective) styles.perspective = `${config.perspective}px`;
  if (config.perspectiveOrigin) styles.perspectiveOrigin = config.perspectiveOrigin;
  
  return styles;
}

/**
 * Generate element styles for 3D transform
 */
export function generate3DStyles(config: Transform3DConfig): React.CSSProperties {
  const styles: React.CSSProperties = {
    transform: generateTransformCSS(config),
  };
  
  if (config.transformOrigin) styles.transformOrigin = config.transformOrigin;
  if (config.preserve3D) styles.transformStyle = "preserve-3d";
  if (config.backfaceHidden) styles.backfaceVisibility = "hidden";
  
  return styles;
}

/**
 * Get CSS classes for 3D presets that use Tailwind animations
 */
export function get3DPresetClass(preset: Transform3DPreset): string {
  const classMap: Record<Transform3DPreset, string> = {
    none: "",
    "card-flip": "transform-3d-card-flip",
    "tilt-hover": "transform-3d-tilt-hover",
    float: "animate-float",
    swing: "animate-swing",
    "pop-out": "transform-3d-pop-out hover:scale-110 hover:translate-z-12",
    "perspective-tilt": "transform-3d-perspective-tilt",
    "book-open": "transform-3d-book-open",
  };
  
  return classMap[preset] || "";
}

// =============================================================================
// FIELD OPTIONS
// =============================================================================

/** Field options for component properties */
export const transform3DFieldOptions = [
  { label: "None", value: "none" },
  { label: "─── Interactive ───", value: "", disabled: true },
  { label: "Tilt on Hover", value: "tilt-hover" },
  { label: "Card Flip", value: "card-flip" },
  { label: "Pop Out", value: "pop-out" },
  { label: "Book Open", value: "book-open" },
  { label: "─── Continuous ───", value: "", disabled: true },
  { label: "Float", value: "float" },
  { label: "Swing", value: "swing" },
  { label: "─── Static ───", value: "", disabled: true },
  { label: "Perspective Tilt", value: "perspective-tilt" },
];

/** Transform origin options */
export const transform3DOriginOptions = [
  { label: "Center", value: "center" },
  { label: "Top", value: "top" },
  { label: "Top Left", value: "top left" },
  { label: "Top Right", value: "top right" },
  { label: "Bottom", value: "bottom" },
  { label: "Bottom Left", value: "bottom left" },
  { label: "Bottom Right", value: "bottom right" },
  { label: "Left", value: "left" },
  { label: "Right", value: "right" },
];
