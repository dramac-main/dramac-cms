/**
 * Tilt Card Component
 * 
 * A card with 3D tilt effect on mouse hover.
 * 
 * @phase STUDIO-31 - 3D Effects & Advanced Animations
 */

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useTiltEffect } from "@/lib/studio/effects/use-tilt-effect";

// =============================================================================
// TYPES
// =============================================================================

interface TiltCardProps {
  children: React.ReactNode;
  maxRotation?: number;
  perspective?: number;
  scale?: number;
  speed?: number;
  glare?: boolean;
  glareMaxOpacity?: number;
  className?: string;
  disabled?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function TiltCard({
  children,
  maxRotation = 15,
  perspective = 1000,
  scale = 1.05,
  speed = 400,
  glare = false,
  glareMaxOpacity = 0.3,
  className,
  disabled = false,
}: TiltCardProps) {
  const { ref } = useTiltEffect<HTMLDivElement>({
    maxRotation,
    perspective,
    scale,
    speed,
    glare,
    glareMaxOpacity,
    disabled,
  });
  
  return (
    <div 
      ref={ref} 
      className={cn(
        "relative overflow-hidden rounded-xl",
        className
      )}
    >
      {children}
      
      {/* Glare overlay */}
      {glare && (
        <div 
          data-tilt-glare
          className="absolute inset-0 pointer-events-none"
          style={{ background: "transparent" }}
        />
      )}
    </div>
  );
}
