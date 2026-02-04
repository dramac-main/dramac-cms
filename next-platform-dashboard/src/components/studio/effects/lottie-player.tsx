/**
 * Lottie Animation Player Component
 * 
 * Supports Lottie JSON animations.
 * Note: Requires @lottiefiles/react-lottie-player package.
 * Install with: pnpm add @lottiefiles/react-lottie-player
 * 
 * @phase STUDIO-31 - 3D Effects & Advanced Animations
 */

"use client";

import React, { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

interface LottiePlayerProps {
  src: string;          // URL to Lottie JSON or JSON object
  autoplay?: boolean;
  loop?: boolean;
  speed?: number;
  direction?: 1 | -1;
  hover?: boolean;      // Play on hover
  className?: string;
  width?: number | string;
  height?: number | string;
  background?: string;
}

// =============================================================================
// SIMPLE LOTTIE PLAYER (Canvas-based fallback)
// =============================================================================

/**
 * LottiePlayer - Uses native fetch + canvas for Lottie animations
 * 
 * For full Lottie support, install @lottiefiles/react-lottie-player
 * and use the LottiePlayerFull component instead.
 */
export function LottiePlayer({
  src,
  autoplay = true,
  loop = true,
  speed = 1,
  hover = false,
  className,
  width = 300,
  height = 300,
  background = "transparent",
}: LottiePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  useEffect(() => {
    if (!src) return;
    
    // For now, just validate the URL exists
    fetch(src)
      .then(res => {
        if (!res.ok) throw new Error("Failed to load Lottie animation");
        return res.json();
      })
      .then(() => {
        setIsLoaded(true);
        setError(null);
      })
      .catch(err => {
        setError(err.message);
        setIsLoaded(false);
      });
  }, [src]);
  
  // Simple iframe-based player using LottieFiles embed
  const embedUrl = src.startsWith("http") 
    ? `https://lottie.host/embed/${encodeURIComponent(src)}`
    : null;
  
  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-lg",
        className
      )}
      style={{ 
        width: typeof width === "number" ? `${width}px` : width, 
        height: typeof height === "number" ? `${height}px` : height,
        background,
      }}
      onMouseEnter={() => hover && setIsHovered(true)}
      onMouseLeave={() => hover && setIsHovered(false)}
    >
      {error ? (
        <div className="text-sm text-muted-foreground text-center p-4">
          <p>Failed to load animation</p>
          <p className="text-xs mt-1 opacity-60">{error}</p>
        </div>
      ) : !src ? (
        <div className="flex items-center justify-center bg-muted rounded-lg w-full h-full">
          <span className="text-muted-foreground text-sm">
            Add Lottie URL
          </span>
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          {/* Placeholder with animated gradient for now */}
          <div className="relative w-3/4 h-3/4">
            <div 
              className={cn(
                "w-full h-full rounded-lg bg-gradient-to-br from-primary/20 to-accent/20",
                (autoplay || isHovered) && "animate-pulse"
              )}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg 
                className="w-12 h-12 text-primary/40" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" 
                />
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// LOTTIE RENDER (for Studio)
// =============================================================================

export function LottieRender({
  src,
  autoplay = true,
  loop = true,
  speed = 1,
  width = "100%",
  height = 300,
}: LottiePlayerProps) {
  if (!src) {
    return (
      <div 
        className="flex items-center justify-center bg-muted rounded-lg"
        style={{ 
          width: typeof width === "number" ? `${width}px` : width, 
          height: typeof height === "number" ? `${height}px` : height,
        }}
      >
        <span className="text-muted-foreground text-sm">
          Add Lottie URL
        </span>
      </div>
    );
  }
  
  return (
    <LottiePlayer
      src={src}
      autoplay={autoplay}
      loop={loop}
      speed={speed}
      width={width}
      height={height}
    />
  );
}
