/**
 * DRAMAC Studio - Parallax System
 * 
 * Multi-layer parallax scrolling effects.
 * 
 * @phase STUDIO-31 - 3D Effects & Advanced Animations
 */

import type React from "react";

// =============================================================================
// TYPES
// =============================================================================

export interface ParallaxLayer {
  id: string;
  speed: number;        // -1 to 1 (negative = opposite direction)
  type: "background" | "element";
  zIndex?: number;
  opacity?: number;
  scale?: number;
}

export interface ParallaxConfig {
  layers: ParallaxLayer[];
  direction?: "vertical" | "horizontal";
  smooth?: boolean;     // Smooth scrolling
  overflow?: boolean;   // Allow content overflow
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate parallax offset based on scroll position
 */
export function calculateParallaxOffset(
  scrollY: number,
  elementTop: number,
  viewportHeight: number,
  speed: number
): number {
  // Calculate how far the element is from the center of the viewport
  const elementCenter = elementTop - scrollY;
  const viewportCenter = viewportHeight / 2;
  const distanceFromCenter = elementCenter - viewportCenter;
  
  // Apply speed multiplier
  return distanceFromCenter * speed * -1;
}

/**
 * Parallax layer styles generator
 */
export function generateParallaxLayerStyles(
  layer: ParallaxLayer,
  offset: number
): React.CSSProperties {
  const styles: React.CSSProperties = {
    transform: `translateY(${offset}px)`,
    zIndex: layer.zIndex,
    willChange: "transform",
  };
  
  if (layer.opacity !== undefined) {
    styles.opacity = layer.opacity;
  }
  
  if (layer.scale !== undefined) {
    styles.transform = `translateY(${offset}px) scale(${layer.scale})`;
  }
  
  return styles;
}

/**
 * Get parallax speed based on layer depth
 * Higher z-index = faster movement (closer to viewer)
 */
export function getParallaxSpeedByDepth(depth: number): number {
  // depth: 0 = background (slowest), 1 = foreground (fastest)
  return depth * 0.5;
}

// =============================================================================
// FIELD OPTIONS
// =============================================================================

/** Parallax speed field options */
export const parallaxSpeedOptions = [
  { label: "Very Slow (0.1)", value: "0.1" },
  { label: "Slow (0.25)", value: "0.25" },
  { label: "Normal (0.5)", value: "0.5" },
  { label: "Fast (0.75)", value: "0.75" },
  { label: "Very Fast (1)", value: "1" },
];
