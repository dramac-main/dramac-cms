/**
 * 3D Card Flip Component
 * 
 * A card that flips to reveal back content on hover or click.
 * 
 * @phase STUDIO-31 - 3D Effects & Advanced Animations
 */

"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

interface CardFlip3DProps {
  front: React.ReactNode;
  back: React.ReactNode;
  flipOn?: "hover" | "click";
  width?: number | string;
  height?: number | string;
  className?: string;
  disabled?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function CardFlip3D({
  front,
  back,
  flipOn = "hover",
  width = 300,
  height = 400,
  className,
  disabled = false,
}: CardFlip3DProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== "undefined" 
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches 
    : false;
  
  const handleMouseEnter = () => {
    if (flipOn === "hover" && !disabled && !prefersReducedMotion) {
      setIsFlipped(true);
    }
  };
  
  const handleMouseLeave = () => {
    if (flipOn === "hover" && !disabled && !prefersReducedMotion) {
      setIsFlipped(false);
    }
  };
  
  const handleClick = () => {
    if (flipOn === "click" && !disabled && !prefersReducedMotion) {
      setIsFlipped(!isFlipped);
    }
  };
  
  return (
    <div
      className={cn(
        "relative cursor-pointer",
        className
      )}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        perspective: "1000px",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front Face */}
        <div
          className="absolute inset-0 w-full h-full rounded-xl overflow-hidden"
          style={{
            backfaceVisibility: "hidden",
          }}
        >
          {front}
        </div>
        
        {/* Back Face */}
        <div
          className="absolute inset-0 w-full h-full rounded-xl overflow-hidden"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {back}
        </div>
      </div>
    </div>
  );
}
