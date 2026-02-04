/**
 * useParallax Hook
 * 
 * Hook for creating parallax effects.
 * 
 * @phase STUDIO-31 - 3D Effects & Advanced Animations
 */

"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { calculateParallaxOffset } from "./parallax";

// =============================================================================
// TYPES
// =============================================================================

interface ParallaxOptions {
  speed?: number;      // -1 to 1
  direction?: "up" | "down";
  disabled?: boolean;
}

interface MouseParallaxOptions {
  intensity?: number;
  inverted?: boolean;
  disabled?: boolean;
}

// =============================================================================
// USE PARALLAX
// =============================================================================

export function useParallax<T extends HTMLElement>(options: ParallaxOptions = {}) {
  const ref = useRef<T>(null);
  const [offset, setOffset] = useState(0);
  
  const {
    speed = 0.5,
    direction = "up",
    disabled = false,
  } = options;
  
  const actualSpeed = direction === "down" ? -speed : speed;
  
  const handleScroll = useCallback(() => {
    if (disabled || !ref.current) return;
    
    const element = ref.current;
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    const newOffset = calculateParallaxOffset(
      window.scrollY,
      rect.top + window.scrollY,
      viewportHeight,
      actualSpeed
    );
    
    setOffset(newOffset);
  }, [actualSpeed, disabled]);
  
  useEffect(() => {
    if (disabled) return;
    
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial calculation
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll, disabled]);
  
  const style: React.CSSProperties = {
    transform: `translateY(${offset}px)`,
    willChange: disabled ? undefined : "transform",
  };
  
  return {
    ref,
    style,
    offset,
  };
}

// =============================================================================
// USE MOUSE PARALLAX
// =============================================================================

/**
 * useMouseParallax - Parallax based on mouse position
 */
export function useMouseParallax<T extends HTMLElement>(options: MouseParallaxOptions = {}) {
  const ref = useRef<T>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  const { intensity = 20, inverted = false, disabled = false } = options;
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!ref.current || disabled) return;
    
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let x = ((e.clientX - centerX) / rect.width) * intensity;
    let y = ((e.clientY - centerY) / rect.height) * intensity;
    
    if (inverted) {
      x = -x;
      y = -y;
    }
    
    setPosition({ x, y });
  }, [intensity, inverted, disabled]);
  
  const handleMouseLeave = useCallback(() => {
    setPosition({ x: 0, y: 0 });
  }, []);
  
  useEffect(() => {
    if (disabled) return;
    
    const element = ref.current;
    if (!element) return;
    
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;
    
    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseleave", handleMouseLeave);
    
    return () => {
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave, disabled]);
  
  const style: React.CSSProperties = {
    transform: `translate(${position.x}px, ${position.y}px)`,
    transition: "transform 0.1s ease-out",
  };
  
  return {
    ref,
    style,
    position,
  };
}
