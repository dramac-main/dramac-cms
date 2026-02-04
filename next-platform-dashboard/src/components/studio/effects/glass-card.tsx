/**
 * Glass Card Component
 * 
 * A card with glassmorphism effect.
 * 
 * @phase STUDIO-31 - 3D Effects & Advanced Animations
 */

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { 
  type GlassmorphismConfig, 
  type GlassPreset,
  GLASS_PRESETS, 
  generateGlassStyles 
} from "@/lib/studio/effects/glassmorphism";

// =============================================================================
// TYPES
// =============================================================================

interface GlassCardProps extends Partial<GlassmorphismConfig> {
  children: React.ReactNode;
  preset?: GlassPreset;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";
}

// =============================================================================
// COMPONENT
// =============================================================================

export function GlassCard({
  children,
  preset,
  blur,
  opacity,
  saturation,
  tint,
  border,
  borderOpacity,
  shadow,
  shadowIntensity,
  className,
  padding = "md",
  rounded = "lg",
}: GlassCardProps) {
  // Get config from preset or custom props
  const config: GlassmorphismConfig = preset && preset !== "none"
    ? { 
        ...GLASS_PRESETS[preset], 
        blur: blur ?? GLASS_PRESETS[preset].blur, 
        opacity: opacity ?? GLASS_PRESETS[preset].opacity, 
        saturation: saturation ?? GLASS_PRESETS[preset].saturation, 
        tint: tint ?? GLASS_PRESETS[preset].tint, 
        border: border ?? GLASS_PRESETS[preset].border, 
        borderOpacity: borderOpacity ?? GLASS_PRESETS[preset].borderOpacity, 
        shadow: shadow ?? GLASS_PRESETS[preset].shadow, 
        shadowIntensity: shadowIntensity ?? GLASS_PRESETS[preset].shadowIntensity,
      }
    : { blur, opacity, saturation, tint, border, borderOpacity, shadow, shadowIntensity };
  
  const glassStyles = generateGlassStyles(config);
  
  const paddingClasses = {
    none: "",
    sm: "p-3",
    md: "p-5",
    lg: "p-8",
  };
  
  const roundedClasses = {
    none: "",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    full: "rounded-full",
  };
  
  return (
    <div
      className={cn(
        paddingClasses[padding],
        roundedClasses[rounded],
        className
      )}
      style={glassStyles}
    >
      {children}
    </div>
  );
}
