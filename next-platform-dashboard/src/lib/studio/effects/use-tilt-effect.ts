/**
 * useTiltEffect Hook
 * 
 * Adds 3D tilt effect on mouse hover.
 * 
 * @phase STUDIO-31 - 3D Effects & Advanced Animations
 */

import { useRef, useEffect, useCallback } from "react";

// =============================================================================
// TYPES
// =============================================================================

interface TiltOptions {
  maxRotation?: number;
  perspective?: number;
  scale?: number;
  speed?: number;
  glare?: boolean;
  glareMaxOpacity?: number;
  disabled?: boolean;
}

// =============================================================================
// HOOK
// =============================================================================

export function useTiltEffect<T extends HTMLElement>(options: TiltOptions = {}) {
  const ref = useRef<T>(null);
  const {
    maxRotation = 15,
    perspective = 1000,
    scale = 1.05,
    speed = 400,
    glare = false,
    glareMaxOpacity = 0.3,
    disabled = false,
  } = options;
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!ref.current || disabled) return;
    
    const element = ref.current;
    const rect = element.getBoundingClientRect();
    
    // Calculate mouse position relative to element center
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    // Calculate rotation (inverted for natural feel)
    const rotateX = (mouseY / (rect.height / 2)) * -maxRotation;
    const rotateY = (mouseX / (rect.width / 2)) * maxRotation;
    
    // Apply transform
    element.style.transform = `
      perspective(${perspective}px) 
      rotateX(${rotateX}deg) 
      rotateY(${rotateY}deg) 
      scale(${scale})
    `;
    
    // Handle glare
    if (glare) {
      const glareElement = element.querySelector("[data-tilt-glare]") as HTMLElement;
      if (glareElement) {
        const percentX = (mouseX / rect.width + 0.5) * 100;
        const percentY = (mouseY / rect.height + 0.5) * 100;
        glareElement.style.background = `
          radial-gradient(
            circle at ${percentX}% ${percentY}%,
            rgba(255,255,255,${glareMaxOpacity}),
            transparent 50%
          )
        `;
      }
    }
  }, [maxRotation, perspective, scale, glare, glareMaxOpacity, disabled]);
  
  const handleMouseLeave = useCallback(() => {
    if (!ref.current || disabled) return;
    
    ref.current.style.transform = `
      perspective(${perspective}px) 
      rotateX(0deg) 
      rotateY(0deg) 
      scale(1)
    `;
    
    // Reset glare
    if (glare) {
      const glareElement = ref.current.querySelector("[data-tilt-glare]") as HTMLElement;
      if (glareElement) {
        glareElement.style.background = "transparent";
      }
    }
  }, [perspective, glare, disabled]);
  
  useEffect(() => {
    const element = ref.current;
    if (!element || disabled) return;
    
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;
    
    // Set initial styles
    element.style.transition = `transform ${speed}ms ease-out`;
    element.style.transformStyle = "preserve-3d";
    
    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseleave", handleMouseLeave);
    
    return () => {
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave, speed, disabled]);
  
  return { ref };
}
