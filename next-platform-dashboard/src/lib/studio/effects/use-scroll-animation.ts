/**
 * useScrollAnimation Hook
 * 
 * Intersection Observer based scroll-triggered animations.
 * 
 * @phase STUDIO-31 - 3D Effects & Advanced Animations
 */

"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { 
  type ScrollAnimationType, 
  type ScrollAnimationConfig,
  SCROLL_ANIMATION_PRESETS 
} from "./scroll-animations";

// =============================================================================
// USE SCROLL ANIMATION
// =============================================================================

export function useScrollAnimation<T extends HTMLElement>(
  config: ScrollAnimationConfig
) {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  
  const {
    type,
    delay = 0,
    duration = 600,
    threshold = 0.1,
    once = true,
    easing = "ease-out",
  } = config;
  
  // Get animation styles
  const preset = SCROLL_ANIMATION_PRESETS[type];
  
  const styles = useMemo(() => {
    // Check for reduced motion preference
    if (typeof window !== "undefined") {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReducedMotion) {
        return preset.animate;
      }
    }
    
    const shouldAnimate = isVisible && (!once || !hasAnimated);
    
    return {
      ...preset.initial,
      ...(shouldAnimate ? preset.animate : {}),
      transition: `all ${duration}ms ${easing} ${delay}ms`,
    };
  }, [isVisible, hasAnimated, once, preset, duration, easing, delay]);
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      setHasAnimated(true);
      return;
    }
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            setHasAnimated(true);
            observer.disconnect();
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin: "0px",
      }
    );
    
    observer.observe(element);
    
    return () => observer.disconnect();
  }, [threshold, once]);
  
  return {
    ref,
    style: styles,
    isVisible,
    hasAnimated,
  };
}

// =============================================================================
// USE STAGGER ANIMATION
// =============================================================================

/**
 * Hook for staggered children animations
 */
export function useStaggerAnimation<T extends HTMLElement>(
  type: ScrollAnimationType,
  childCount: number,
  options: {
    baseDelay?: number;
    staggerDelay?: number;
    duration?: number;
    threshold?: number;
  } = {}
) {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  const {
    baseDelay = 0,
    staggerDelay = 100,
    duration = 600,
    threshold = 0.1,
  } = options;
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    
    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);
  
  // Generate child styles
  const childStyles = useMemo(() => {
    const preset = SCROLL_ANIMATION_PRESETS[type];
    
    // Check for reduced motion preference
    if (typeof window !== "undefined") {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReducedMotion) {
        return Array.from({ length: childCount }, () => preset.animate);
      }
    }
    
    return Array.from({ length: childCount }, (_, i) => ({
      ...preset.initial,
      ...(isVisible ? preset.animate : {}),
      transition: `all ${duration}ms ease-out ${baseDelay + i * staggerDelay}ms`,
    }));
  }, [type, childCount, isVisible, duration, baseDelay, staggerDelay]);
  
  return {
    ref,
    isVisible,
    childStyles,
  };
}
