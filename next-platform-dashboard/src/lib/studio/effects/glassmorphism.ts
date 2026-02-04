/**
 * DRAMAC Studio - Glassmorphism System
 * 
 * Modern frosted glass UI effects.
 * 
 * @phase STUDIO-31 - 3D Effects & Advanced Animations
 */

import type React from "react";

// =============================================================================
// TYPES
// =============================================================================

export interface GlassmorphismConfig {
  blur?: number;           // 0-50 px
  opacity?: number;        // 0-1
  saturation?: number;     // 0-2
  tint?: string;           // Color overlay
  border?: boolean;        // Show glass border
  borderOpacity?: number;  // 0-1
  shadow?: boolean;        // Drop shadow
  shadowIntensity?: "light" | "medium" | "heavy";
}

export type GlassPreset = "none" | "light" | "dark" | "colored" | "subtle" | "heavy";

// =============================================================================
// PRESET GLASS EFFECTS
// =============================================================================

export const GLASS_PRESETS: Record<Exclude<GlassPreset, "none">, GlassmorphismConfig> = {
  light: {
    blur: 10,
    opacity: 0.7,
    saturation: 1.2,
    tint: "rgba(255, 255, 255, 0.25)",
    border: true,
    borderOpacity: 0.2,
    shadow: true,
    shadowIntensity: "light",
  },
  dark: {
    blur: 12,
    opacity: 0.6,
    saturation: 1,
    tint: "rgba(0, 0, 0, 0.3)",
    border: true,
    borderOpacity: 0.1,
    shadow: true,
    shadowIntensity: "medium",
  },
  colored: {
    blur: 15,
    opacity: 0.5,
    saturation: 1.5,
    tint: "rgba(99, 102, 241, 0.2)", // Indigo
    border: true,
    borderOpacity: 0.3,
    shadow: true,
    shadowIntensity: "medium",
  },
  subtle: {
    blur: 5,
    opacity: 0.9,
    saturation: 1,
    tint: "rgba(255, 255, 255, 0.1)",
    border: false,
    shadow: false,
  },
  heavy: {
    blur: 25,
    opacity: 0.4,
    saturation: 1.8,
    tint: "rgba(255, 255, 255, 0.4)",
    border: true,
    borderOpacity: 0.4,
    shadow: true,
    shadowIntensity: "heavy",
  },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate glass effect styles
 */
export function generateGlassStyles(config: GlassmorphismConfig): React.CSSProperties {
  const {
    blur = 10,
    saturation = 1.2,
    tint = "rgba(255, 255, 255, 0.25)",
    border = true,
    borderOpacity = 0.2,
    shadow = true,
    shadowIntensity = "light",
  } = config;
  
  const shadows = {
    light: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    medium: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    heavy: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  };
  
  const styles: React.CSSProperties = {
    backgroundColor: tint,
    backdropFilter: `blur(${blur}px) saturate(${saturation * 100}%)`,
    WebkitBackdropFilter: `blur(${blur}px) saturate(${saturation * 100}%)`,
  };
  
  if (border) {
    styles.border = `1px solid rgba(255, 255, 255, ${borderOpacity})`;
  }
  
  if (shadow) {
    styles.boxShadow = shadows[shadowIntensity] || shadows.light;
  }
  
  return styles;
}

/**
 * Get glass styles from preset
 */
export function getGlassPresetStyles(preset: GlassPreset): React.CSSProperties {
  if (preset === "none") return {};
  return generateGlassStyles(GLASS_PRESETS[preset]);
}

// =============================================================================
// FIELD OPTIONS
// =============================================================================

export const glassPresetFieldOptions = [
  { label: "None", value: "none" },
  { label: "Light Glass", value: "light" },
  { label: "Dark Glass", value: "dark" },
  { label: "Colored Glass", value: "colored" },
  { label: "Subtle Glass", value: "subtle" },
  { label: "Heavy Blur", value: "heavy" },
];
