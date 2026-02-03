# PHASE-STUDIO-31: 3D Effects & Advanced Animations

## 🎯 Phase Overview

**Wave**: 12 - Award-Winning Features  
**Phase**: 31 of 31 (FINAL PHASE)  
**Priority**: 🟣 FEATURE - AWARD LEVEL  
**Estimated Time**: 20-24 hours  
**Dependencies**: Phase 30 Complete (Component Superpowers)

---

## 📋 Mission

Transform DRAMAC Studio into an award-winning website builder with:
- 3D CSS transforms and perspective effects
- Micro-interactions and delightful animations
- Scroll-triggered animations (Intersection Observer)
- Glassmorphism and modern UI effects
- Parallax scrolling system
- Mouse-following effects
- Particle and background effects
- Lottie animation support

---

## 🚀 Feature Overview

### Feature Set

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| F1 | 3D Transforms | CSS 3D rotations, perspectives, card flips | 🟣 P0 |
| F2 | Micro-interactions | Button feedback, loading states, toggle animations | 🟣 P0 |
| F3 | Scroll Animations | Intersection Observer triggered animations | 🟣 P0 |
| F4 | Glassmorphism | Blur, transparency, frosted glass effects | 🟣 P1 |
| F5 | Parallax System | Multi-layer parallax scrolling | 🟣 P1 |
| F6 | Mouse Effects | Cursor following, tilt on hover | 🟣 P2 |
| F7 | Particle Effects | Background particles and confetti | 🟣 P2 |
| F8 | Lottie Support | Lottie animation embedding | 🟣 P2 |

---

## 🔧 Implementation Tasks

### Task 31.1: 3D Transform System

**Purpose**: CSS 3D transforms with perspective for stunning visual effects.

**File**: `src/lib/studio/effects/transforms-3d.ts`

```typescript
/**
 * DRAMAC Studio - 3D Transform System
 * 
 * CSS 3D transforms with perspective controls.
 */

// 3D Transform Types
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

// Preset 3D effects
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

// Field options for component properties
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
```

---

### Task 31.2: 3D Card Flip Component

**File**: `src/components/studio/effects/card-flip-3d.tsx`

```tsx
/**
 * 3D Card Flip Component
 * 
 * A card that flips to reveal back content on hover or click.
 */

"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface CardFlip3DProps {
  front: React.ReactNode;
  back: React.ReactNode;
  flipOn?: "hover" | "click";
  width?: number | string;
  height?: number | string;
  className?: string;
}

export function CardFlip3D({
  front,
  back,
  flipOn = "hover",
  width = 300,
  height = 400,
  className,
}: CardFlip3DProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  
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
      onMouseEnter={() => flipOn === "hover" && setIsFlipped(true)}
      onMouseLeave={() => flipOn === "hover" && setIsFlipped(false)}
      onClick={() => flipOn === "click" && setIsFlipped(!isFlipped)}
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
```

---

### Task 31.3: Tilt Effect Hook

**File**: `src/lib/studio/effects/use-tilt-effect.ts`

```typescript
/**
 * useTiltEffect Hook
 * 
 * Adds 3D tilt effect on mouse hover.
 */

import { useRef, useEffect, useCallback } from "react";

interface TiltOptions {
  maxRotation?: number;
  perspective?: number;
  scale?: number;
  speed?: number;
  glare?: boolean;
  glareMaxOpacity?: number;
}

export function useTiltEffect<T extends HTMLElement>(options: TiltOptions = {}) {
  const ref = useRef<T>(null);
  const {
    maxRotation = 15,
    perspective = 1000,
    scale = 1.05,
    speed = 400,
    glare = false,
    glareMaxOpacity = 0.3,
  } = options;
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!ref.current) return;
    
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
  }, [maxRotation, perspective, scale, glare, glareMaxOpacity]);
  
  const handleMouseLeave = useCallback(() => {
    if (!ref.current) return;
    
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
  }, [perspective, glare]);
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    // Set initial styles
    element.style.transition = `transform ${speed}ms ease-out`;
    element.style.transformStyle = "preserve-3d";
    
    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseleave", handleMouseLeave);
    
    return () => {
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave, speed]);
  
  return { ref };
}
```

---

### Task 31.4: Scroll Animation System

**File**: `src/lib/studio/effects/scroll-animations.ts`

```typescript
/**
 * DRAMAC Studio - Scroll Animation System
 * 
 * Intersection Observer based scroll-triggered animations.
 */

// Scroll animation types
export type ScrollAnimationType = 
  | "fade-in"
  | "fade-up"
  | "fade-down"
  | "fade-left"
  | "fade-right"
  | "zoom-in"
  | "zoom-out"
  | "flip-up"
  | "flip-left"
  | "slide-up"
  | "slide-down"
  | "slide-left"
  | "slide-right"
  | "bounce-in"
  | "rotate-in";

// Animation config
export interface ScrollAnimationConfig {
  type: ScrollAnimationType;
  delay?: number;        // ms
  duration?: number;     // ms
  threshold?: number;    // 0-1 (when to trigger)
  once?: boolean;        // Only animate once
  offset?: number;       // Offset from viewport edge
  easing?: string;       // CSS easing function
}

// Preset configurations
export const SCROLL_ANIMATION_PRESETS: Record<ScrollAnimationType, {
  initial: React.CSSProperties;
  animate: React.CSSProperties;
}> = {
  "fade-in": {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  },
  "fade-up": {
    initial: { opacity: 0, transform: "translateY(40px)" },
    animate: { opacity: 1, transform: "translateY(0)" },
  },
  "fade-down": {
    initial: { opacity: 0, transform: "translateY(-40px)" },
    animate: { opacity: 1, transform: "translateY(0)" },
  },
  "fade-left": {
    initial: { opacity: 0, transform: "translateX(40px)" },
    animate: { opacity: 1, transform: "translateX(0)" },
  },
  "fade-right": {
    initial: { opacity: 0, transform: "translateX(-40px)" },
    animate: { opacity: 1, transform: "translateX(0)" },
  },
  "zoom-in": {
    initial: { opacity: 0, transform: "scale(0.8)" },
    animate: { opacity: 1, transform: "scale(1)" },
  },
  "zoom-out": {
    initial: { opacity: 0, transform: "scale(1.2)" },
    animate: { opacity: 1, transform: "scale(1)" },
  },
  "flip-up": {
    initial: { opacity: 0, transform: "perspective(1000px) rotateX(-90deg)" },
    animate: { opacity: 1, transform: "perspective(1000px) rotateX(0)" },
  },
  "flip-left": {
    initial: { opacity: 0, transform: "perspective(1000px) rotateY(90deg)" },
    animate: { opacity: 1, transform: "perspective(1000px) rotateY(0)" },
  },
  "slide-up": {
    initial: { transform: "translateY(100%)" },
    animate: { transform: "translateY(0)" },
  },
  "slide-down": {
    initial: { transform: "translateY(-100%)" },
    animate: { transform: "translateY(0)" },
  },
  "slide-left": {
    initial: { transform: "translateX(100%)" },
    animate: { transform: "translateX(0)" },
  },
  "slide-right": {
    initial: { transform: "translateX(-100%)" },
    animate: { transform: "translateX(0)" },
  },
  "bounce-in": {
    initial: { opacity: 0, transform: "scale(0.3)" },
    animate: { opacity: 1, transform: "scale(1)" },
  },
  "rotate-in": {
    initial: { opacity: 0, transform: "rotate(-180deg) scale(0)" },
    animate: { opacity: 1, transform: "rotate(0) scale(1)" },
  },
};

// Stagger children option
export interface StaggerConfig {
  enabled: boolean;
  delay: number;     // Delay between each child (ms)
  from?: "first" | "last" | "center";
}

// Field options
export const scrollAnimationFieldOptions = [
  { label: "None", value: "none" },
  { label: "─── Fade ───", value: "", disabled: true },
  { label: "Fade In", value: "fade-in" },
  { label: "Fade Up", value: "fade-up" },
  { label: "Fade Down", value: "fade-down" },
  { label: "Fade Left", value: "fade-left" },
  { label: "Fade Right", value: "fade-right" },
  { label: "─── Zoom ───", value: "", disabled: true },
  { label: "Zoom In", value: "zoom-in" },
  { label: "Zoom Out", value: "zoom-out" },
  { label: "─── Flip ───", value: "", disabled: true },
  { label: "Flip Up", value: "flip-up" },
  { label: "Flip Left", value: "flip-left" },
  { label: "─── Slide ───", value: "", disabled: true },
  { label: "Slide Up", value: "slide-up" },
  { label: "Slide Down", value: "slide-down" },
  { label: "Slide Left", value: "slide-left" },
  { label: "Slide Right", value: "slide-right" },
  { label: "─── Special ───", value: "", disabled: true },
  { label: "Bounce In", value: "bounce-in" },
  { label: "Rotate In", value: "rotate-in" },
];
```

---

### Task 31.5: Scroll Animation Hook

**File**: `src/lib/studio/effects/use-scroll-animation.ts`

```typescript
/**
 * useScrollAnimation Hook
 * 
 * Intersection Observer based scroll-triggered animations.
 */

import { useRef, useEffect, useState, useMemo } from "react";
import { 
  ScrollAnimationType, 
  ScrollAnimationConfig,
  SCROLL_ANIMATION_PRESETS 
} from "./scroll-animations";

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
```

---

### Task 31.6: Scroll Animation Component

**File**: `src/components/studio/effects/scroll-animate.tsx`

```tsx
/**
 * ScrollAnimate Component
 * 
 * Wrapper component for scroll-triggered animations.
 */

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useScrollAnimation } from "@/lib/studio/effects/use-scroll-animation";
import { ScrollAnimationType } from "@/lib/studio/effects/scroll-animations";

interface ScrollAnimateProps {
  children: React.ReactNode;
  animation: ScrollAnimationType;
  delay?: number;
  duration?: number;
  threshold?: number;
  once?: boolean;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export function ScrollAnimate({
  children,
  animation,
  delay = 0,
  duration = 600,
  threshold = 0.1,
  once = true,
  className,
  as: Component = "div",
}: ScrollAnimateProps) {
  const { ref, style } = useScrollAnimation<HTMLDivElement>({
    type: animation,
    delay,
    duration,
    threshold,
    once,
  });
  
  return (
    <Component ref={ref} className={cn(className)} style={style}>
      {children}
    </Component>
  );
}

/**
 * ScrollStagger - Animates children with staggered delays
 */
interface ScrollStaggerProps {
  children: React.ReactNode[];
  animation: ScrollAnimationType;
  staggerDelay?: number;
  baseDelay?: number;
  duration?: number;
  className?: string;
  childClassName?: string;
}

export function ScrollStagger({
  children,
  animation,
  staggerDelay = 100,
  baseDelay = 0,
  duration = 600,
  className,
  childClassName,
}: ScrollStaggerProps) {
  const { ref, childStyles } = useStaggerAnimation<HTMLDivElement>(
    animation,
    React.Children.count(children),
    { baseDelay, staggerDelay, duration }
  );
  
  return (
    <div ref={ref} className={className}>
      {React.Children.map(children, (child, index) => (
        <div className={childClassName} style={childStyles[index]}>
          {child}
        </div>
      ))}
    </div>
  );
}
```

---

### Task 31.7: Glassmorphism System

**File**: `src/lib/studio/effects/glassmorphism.ts`

```typescript
/**
 * DRAMAC Studio - Glassmorphism System
 * 
 * Modern frosted glass UI effects.
 */

export interface GlassmorphismConfig {
  blur?: number;           // 0-50 px
  opacity?: number;        // 0-1
  saturation?: number;     // 0-2
  tint?: string;           // Color overlay
  border?: boolean;        // Show glass border
  borderOpacity?: number;  // 0-1
  shadow?: boolean;        // Drop shadow
  shadowIntensity?: string; // "light" | "medium" | "heavy"
}

// Preset glass effects
export const GLASS_PRESETS = {
  "light": {
    blur: 10,
    opacity: 0.7,
    saturation: 1.2,
    tint: "rgba(255, 255, 255, 0.25)",
    border: true,
    borderOpacity: 0.2,
    shadow: true,
    shadowIntensity: "light",
  },
  "dark": {
    blur: 12,
    opacity: 0.6,
    saturation: 1,
    tint: "rgba(0, 0, 0, 0.3)",
    border: true,
    borderOpacity: 0.1,
    shadow: true,
    shadowIntensity: "medium",
  },
  "colored": {
    blur: 15,
    opacity: 0.5,
    saturation: 1.5,
    tint: "rgba(99, 102, 241, 0.2)", // Indigo
    border: true,
    borderOpacity: 0.3,
    shadow: true,
    shadowIntensity: "medium",
  },
  "subtle": {
    blur: 5,
    opacity: 0.9,
    saturation: 1,
    tint: "rgba(255, 255, 255, 0.1)",
    border: false,
    shadow: false,
  },
  "heavy": {
    blur: 25,
    opacity: 0.4,
    saturation: 1.8,
    tint: "rgba(255, 255, 255, 0.4)",
    border: true,
    borderOpacity: 0.4,
    shadow: true,
    shadowIntensity: "heavy",
  },
} as const;

/**
 * Generate glass effect styles
 */
export function generateGlassStyles(config: GlassmorphismConfig): React.CSSProperties {
  const {
    blur = 10,
    opacity = 0.7,
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
    styles.boxShadow = shadows[shadowIntensity as keyof typeof shadows] || shadows.light;
  }
  
  return styles;
}

// Field options
export const glassPresetFieldOptions = [
  { label: "None", value: "none" },
  { label: "Light Glass", value: "light" },
  { label: "Dark Glass", value: "dark" },
  { label: "Colored Glass", value: "colored" },
  { label: "Subtle Glass", value: "subtle" },
  { label: "Heavy Blur", value: "heavy" },
];
```

---

### Task 31.8: Glass Card Component

**File**: `src/components/studio/effects/glass-card.tsx`

```tsx
/**
 * Glass Card Component
 * 
 * A card with glassmorphism effect.
 */

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { 
  GlassmorphismConfig, 
  GLASS_PRESETS, 
  generateGlassStyles 
} from "@/lib/studio/effects/glassmorphism";

interface GlassCardProps extends Partial<GlassmorphismConfig> {
  children: React.ReactNode;
  preset?: keyof typeof GLASS_PRESETS;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";
}

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
  const config: GlassmorphismConfig = preset 
    ? { ...GLASS_PRESETS[preset], blur, opacity, saturation, tint, border, borderOpacity, shadow, shadowIntensity }
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
```

---

### Task 31.9: Parallax System

**File**: `src/lib/studio/effects/parallax.ts`

```typescript
/**
 * DRAMAC Studio - Parallax System
 * 
 * Multi-layer parallax scrolling effects.
 */

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
```

---

### Task 31.10: Parallax Hook

**File**: `src/lib/studio/effects/use-parallax.ts`

```typescript
/**
 * useParallax Hook
 * 
 * Hook for creating parallax effects.
 */

import { useRef, useEffect, useState, useCallback } from "react";
import { calculateParallaxOffset } from "./parallax";

interface ParallaxOptions {
  speed?: number;      // -1 to 1
  direction?: "up" | "down";
  disabled?: boolean;
}

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

/**
 * useMouseParallax - Parallax based on mouse position
 */
export function useMouseParallax<T extends HTMLElement>(options: {
  intensity?: number;
  inverted?: boolean;
} = {}) {
  const ref = useRef<T>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  const { intensity = 20, inverted = false } = options;
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!ref.current) return;
    
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
  }, [intensity, inverted]);
  
  const handleMouseLeave = useCallback(() => {
    setPosition({ x: 0, y: 0 });
  }, []);
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseleave", handleMouseLeave);
    
    return () => {
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);
  
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
```

---

### Task 31.11: Micro-interactions System

**File**: `src/lib/studio/effects/micro-interactions.ts`

```typescript
/**
 * DRAMAC Studio - Micro-interactions System
 * 
 * Delightful small animations for interactive elements.
 */

// Micro-interaction types
export type MicroInteractionType =
  | "button-press"
  | "button-bounce"
  | "button-shine"
  | "input-focus"
  | "input-shake"
  | "toggle-flip"
  | "checkbox-check"
  | "ripple"
  | "confetti"
  | "heart-burst";

// CSS for micro-interactions
export const MICRO_INTERACTION_CSS = `
/* Button Press */
.micro-button-press:active {
  transform: scale(0.95);
  transition: transform 0.1s ease-out;
}

/* Button Bounce */
.micro-button-bounce:hover {
  animation: micro-bounce 0.5s ease;
}

@keyframes micro-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

/* Button Shine */
.micro-button-shine {
  position: relative;
  overflow: hidden;
}
.micro-button-shine::after {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  transition: left 0.5s ease;
}
.micro-button-shine:hover::after {
  left: 100%;
}

/* Input Focus */
.micro-input-focus {
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}
.micro-input-focus:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
  border-color: #3b82f6;
}

/* Input Shake (for errors) */
.micro-input-shake {
  animation: micro-shake 0.5s ease;
}

@keyframes micro-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-10px); }
  40% { transform: translateX(10px); }
  60% { transform: translateX(-5px); }
  80% { transform: translateX(5px); }
}

/* Toggle Flip */
.micro-toggle-flip {
  transition: transform 0.3s ease;
}
.micro-toggle-flip.active {
  transform: rotateY(180deg);
}

/* Checkbox Check */
.micro-checkbox-check {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.micro-checkbox-check.checked {
  animation: micro-check-pop 0.3s ease;
}

@keyframes micro-check-pop {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

/* Ripple Effect */
.micro-ripple {
  position: relative;
  overflow: hidden;
}
.micro-ripple-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  transform: scale(0);
  animation: micro-ripple 0.6s ease-out;
}

@keyframes micro-ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}

/* Heart Burst */
.micro-heart-burst {
  animation: micro-heart 0.3s ease;
}

@keyframes micro-heart {
  0% { transform: scale(1); }
  25% { transform: scale(1.2); }
  50% { transform: scale(0.95); }
  100% { transform: scale(1); }
}
`;

/**
 * Get micro-interaction class
 */
export function getMicroInteractionClass(type: MicroInteractionType): string {
  const classMap: Record<MicroInteractionType, string> = {
    "button-press": "micro-button-press",
    "button-bounce": "micro-button-bounce",
    "button-shine": "micro-button-shine",
    "input-focus": "micro-input-focus",
    "input-shake": "micro-input-shake",
    "toggle-flip": "micro-toggle-flip",
    "checkbox-check": "micro-checkbox-check",
    "ripple": "micro-ripple",
    "confetti": "", // Handled by JS
    "heart-burst": "micro-heart-burst",
  };
  
  return classMap[type] || "";
}

/**
 * Create ripple effect on element
 */
export function createRipple(e: React.MouseEvent<HTMLElement>) {
  const element = e.currentTarget;
  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  
  const ripple = document.createElement("span");
  ripple.className = "micro-ripple-circle";
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
  ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
  
  element.appendChild(ripple);
  
  setTimeout(() => ripple.remove(), 600);
}
```

---

### Task 31.12: Particle Background Component

**File**: `src/components/studio/effects/particle-background.tsx`

```tsx
/**
 * Particle Background Component
 * 
 * Animated particle effects for backgrounds.
 */

"use client";

import React, { useRef, useEffect, useMemo } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
}

interface ParticleBackgroundProps {
  particleCount?: number;
  color?: string;
  maxSize?: number;
  speed?: number;
  opacity?: number;
  connected?: boolean;
  connectionDistance?: number;
  className?: string;
}

export function ParticleBackground({
  particleCount = 50,
  color = "#6366f1",
  maxSize = 4,
  speed = 1,
  opacity = 0.6,
  connected = true,
  connectionDistance = 150,
  className,
}: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  
  // Initialize particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Set canvas size
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    
    // Create particles
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * maxSize + 1,
      speedX: (Math.random() - 0.5) * speed,
      speedY: (Math.random() - 0.5) * speed,
      opacity: Math.random() * opacity,
    }));
    
    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particlesRef.current.forEach((particle, i) => {
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = particle.opacity;
        ctx.fill();
        
        // Draw connections
        if (connected) {
          for (let j = i + 1; j < particlesRef.current.length; j++) {
            const other = particlesRef.current[j];
            const dx = particle.x - other.x;
            const dy = particle.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < connectionDistance) {
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(other.x, other.y);
              ctx.strokeStyle = color;
              ctx.globalAlpha = (1 - distance / connectionDistance) * 0.3;
              ctx.stroke();
            }
          }
        }
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [particleCount, color, maxSize, speed, opacity, connected, connectionDistance]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}
```

---

### Task 31.13: Lottie Animation Support

**File**: `src/components/studio/effects/lottie-player.tsx`

```tsx
/**
 * Lottie Animation Player Component
 * 
 * Supports Lottie JSON animations.
 */

"use client";

import React, { useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

// Dynamic import for Lottie to avoid SSR issues
const LottiePlayerLib = dynamic(
  () => import("@lottiefiles/react-lottie-player").then((mod) => mod.Player),
  { ssr: false }
);

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

export function LottiePlayer({
  src,
  autoplay = true,
  loop = true,
  speed = 1,
  direction = 1,
  hover = false,
  className,
  width = 300,
  height = 300,
  background = "transparent",
}: LottiePlayerProps) {
  const playerRef = useRef<any>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // Handle hover play
  useEffect(() => {
    if (!hover || !playerRef.current) return;
    
    if (isHovered) {
      playerRef.current.play();
    } else {
      playerRef.current.pause();
    }
  }, [isHovered, hover]);
  
  return (
    <div
      className={cn("relative", className)}
      style={{ width, height }}
      onMouseEnter={() => hover && setIsHovered(true)}
      onMouseLeave={() => hover && setIsHovered(false)}
    >
      <LottiePlayerLib
        ref={playerRef}
        src={src}
        autoplay={hover ? false : autoplay}
        loop={loop}
        speed={speed}
        direction={direction}
        background={background}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

// Lottie render component for Studio
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
        style={{ width, height }}
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
```

---

### Task 31.14: Universal 3D & Animation Fields

**File**: `src/lib/studio/registry/advanced-effect-fields.ts`

```typescript
/**
 * DRAMAC Studio - Advanced Effect Fields
 * 
 * Field definitions for 3D effects and advanced animations.
 */

import { FieldConfig } from "./field-types";
import { transform3DFieldOptions } from "../effects/transforms-3d";
import { scrollAnimationFieldOptions } from "../effects/scroll-animations";
import { glassPresetFieldOptions } from "../effects/glassmorphism";

// Advanced effect fields to add to all components
export const ADVANCED_EFFECT_FIELDS: Record<string, FieldConfig> = {
  // 3D Transforms
  transform3D: {
    type: "select",
    label: "3D Effect",
    options: transform3DFieldOptions,
    defaultValue: "none",
    group: "3D Effects",
  },
  perspective: {
    type: "number",
    label: "Perspective (px)",
    min: 200,
    max: 2000,
    step: 100,
    defaultValue: 1000,
    group: "3D Effects",
  },
  rotateX: {
    type: "number",
    label: "Rotate X (deg)",
    min: -180,
    max: 180,
    step: 5,
    defaultValue: 0,
    group: "3D Effects",
  },
  rotateY: {
    type: "number",
    label: "Rotate Y (deg)",
    min: -180,
    max: 180,
    step: 5,
    defaultValue: 0,
    group: "3D Effects",
  },
  rotateZ: {
    type: "number",
    label: "Rotate Z (deg)",
    min: -180,
    max: 180,
    step: 5,
    defaultValue: 0,
    group: "3D Effects",
  },
  
  // Scroll Animations
  scrollAnimation: {
    type: "select",
    label: "Scroll Animation",
    options: scrollAnimationFieldOptions,
    defaultValue: "none",
    group: "Scroll Effects",
  },
  scrollAnimationDelay: {
    type: "number",
    label: "Animation Delay (ms)",
    min: 0,
    max: 2000,
    step: 100,
    defaultValue: 0,
    group: "Scroll Effects",
  },
  scrollAnimationDuration: {
    type: "number",
    label: "Animation Duration (ms)",
    min: 200,
    max: 2000,
    step: 100,
    defaultValue: 600,
    group: "Scroll Effects",
  },
  scrollThreshold: {
    type: "number",
    label: "Trigger Threshold",
    min: 0,
    max: 1,
    step: 0.1,
    defaultValue: 0.1,
    group: "Scroll Effects",
  },
  scrollAnimationOnce: {
    type: "toggle",
    label: "Animate Once",
    defaultValue: true,
    group: "Scroll Effects",
  },
  
  // Glassmorphism
  glassEffect: {
    type: "select",
    label: "Glass Effect",
    options: glassPresetFieldOptions,
    defaultValue: "none",
    group: "Glass Effects",
  },
  glassBlur: {
    type: "number",
    label: "Blur Amount (px)",
    min: 0,
    max: 50,
    step: 2,
    defaultValue: 10,
    group: "Glass Effects",
  },
  glassOpacity: {
    type: "number",
    label: "Glass Opacity",
    min: 0,
    max: 1,
    step: 0.1,
    defaultValue: 0.7,
    group: "Glass Effects",
  },
  
  // Parallax
  parallaxEnabled: {
    type: "toggle",
    label: "Enable Parallax",
    defaultValue: false,
    group: "Parallax",
  },
  parallaxSpeed: {
    type: "number",
    label: "Parallax Speed",
    min: -1,
    max: 1,
    step: 0.1,
    defaultValue: 0.5,
    group: "Parallax",
  },
  parallaxDirection: {
    type: "select",
    label: "Direction",
    options: [
      { label: "Up (default)", value: "up" },
      { label: "Down", value: "down" },
    ],
    defaultValue: "up",
    group: "Parallax",
  },
  
  // Particles
  particlesEnabled: {
    type: "toggle",
    label: "Show Particles",
    defaultValue: false,
    group: "Particles",
  },
  particleColor: {
    type: "color",
    label: "Particle Color",
    defaultValue: "#6366f1",
    group: "Particles",
  },
  particleCount: {
    type: "number",
    label: "Particle Count",
    min: 10,
    max: 200,
    step: 10,
    defaultValue: 50,
    group: "Particles",
  },
  particlesConnected: {
    type: "toggle",
    label: "Connect Particles",
    defaultValue: true,
    group: "Particles",
  },
};

// Field groups for properties panel
export const ADVANCED_EFFECT_GROUPS = [
  { id: "3D Effects", label: "3D Effects", icon: "Box", defaultOpen: false },
  { id: "Scroll Effects", label: "Scroll Animations", icon: "ScrollText", defaultOpen: false },
  { id: "Glass Effects", label: "Glassmorphism", icon: "Sparkles", defaultOpen: false },
  { id: "Parallax", label: "Parallax", icon: "Layers", defaultOpen: false },
  { id: "Particles", label: "Particles", icon: "Sparkles", defaultOpen: false },
];
```

---

### Task 31.15: Update Tailwind Config with All Animations

**File**: `tailwind.config.ts` (additions)

```typescript
// Add to theme.extend.keyframes
keyframes: {
  // ... existing keyframes ...
  
  // 3D Animations
  "flip-in-y": {
    "0%": { opacity: "0", transform: "perspective(1000px) rotateY(-90deg)" },
    "100%": { opacity: "1", transform: "perspective(1000px) rotateY(0)" },
  },
  "flip-in-x": {
    "0%": { opacity: "0", transform: "perspective(1000px) rotateX(-90deg)" },
    "100%": { opacity: "1", transform: "perspective(1000px) rotateX(0)" },
  },
  "float": {
    "0%, 100%": { transform: "translateY(0)" },
    "50%": { transform: "translateY(-10px)" },
  },
  "float-spin": {
    "0%": { transform: "translateY(0) rotate(0deg)" },
    "50%": { transform: "translateY(-10px) rotate(180deg)" },
    "100%": { transform: "translateY(0) rotate(360deg)" },
  },
  
  // Attention grabbers
  "wiggle": {
    "0%, 100%": { transform: "rotate(-3deg)" },
    "50%": { transform: "rotate(3deg)" },
  },
  "heartbeat": {
    "0%, 100%": { transform: "scale(1)" },
    "25%": { transform: "scale(1.1)" },
    "50%": { transform: "scale(1)" },
    "75%": { transform: "scale(1.1)" },
  },
  "jello": {
    "0%, 100%": { transform: "scale3d(1, 1, 1)" },
    "30%": { transform: "scale3d(1.25, 0.75, 1)" },
    "40%": { transform: "scale3d(0.75, 1.25, 1)" },
    "50%": { transform: "scale3d(1.15, 0.85, 1)" },
    "65%": { transform: "scale3d(0.95, 1.05, 1)" },
    "75%": { transform: "scale3d(1.05, 0.95, 1)" },
  },
  
  // Continuous
  "spin-slow": {
    from: { transform: "rotate(0deg)" },
    to: { transform: "rotate(360deg)" },
  },
  "gradient-shift": {
    "0%, 100%": { backgroundPosition: "0% 50%" },
    "50%": { backgroundPosition: "100% 50%" },
  },
  
  // Special
  "text-shimmer": {
    "0%": { backgroundPosition: "-200% center" },
    "100%": { backgroundPosition: "200% center" },
  },
  "confetti": {
    "0%": { transform: "translateY(0) rotate(0)", opacity: "1" },
    "100%": { transform: "translateY(500px) rotate(720deg)", opacity: "0" },
  },
},

// Add to theme.extend.animation
animation: {
  // ... existing animations ...
  
  // 3D
  "flip-in-y": "flip-in-y 0.8s ease-out forwards",
  "flip-in-x": "flip-in-x 0.8s ease-out forwards",
  "float": "float 3s ease-in-out infinite",
  "float-spin": "float-spin 6s ease-in-out infinite",
  
  // Attention
  "wiggle": "wiggle 0.3s ease-in-out infinite",
  "heartbeat": "heartbeat 1.5s ease-in-out infinite",
  "jello": "jello 0.9s ease-in-out",
  
  // Continuous
  "spin-slow": "spin-slow 8s linear infinite",
  "gradient-shift": "gradient-shift 3s ease infinite",
  
  // Special
  "text-shimmer": "text-shimmer 2s linear infinite",
  "confetti": "confetti 3s ease-out forwards",
},
```

---

## ✅ Deliverables Checklist

- [ ] 3D transform system with presets
- [ ] Card flip 3D component
- [ ] Tilt effect hook
- [ ] Scroll animation system with 15+ types
- [ ] Scroll animation hook and component
- [ ] Stagger animation for children
- [ ] Glassmorphism system with presets
- [ ] Glass card component
- [ ] Parallax scroll system
- [ ] Mouse parallax hook
- [ ] Micro-interactions CSS library
- [ ] Ripple effect utility
- [ ] Particle background component
- [ ] Lottie animation support
- [ ] Advanced effect fields for all components
- [ ] Tailwind config with all animations
- [ ] 0 TypeScript errors
- [ ] Performance optimized (requestAnimationFrame)

---

## 🧪 Testing Requirements

### After Implementation:
```
1. Add Card with 3D effect "Tilt on Hover" → Should tilt on mouse move
2. Add Card Flip component → Should flip on hover/click
3. Add section with scroll animation "fade-up" → Should animate when scrolling into view
4. Add multiple cards with stagger animation → Should animate sequentially
5. Add glass card → Should show frosted glass effect
6. Test glassmorphism on colorful background → Should look beautiful
7. Enable parallax on section → Content should scroll at different speeds
8. Enable particles on hero → Should show animated particles
9. Add Lottie animation → Should play animation
10. Test all effects on mobile → Should work and perform well
11. Test scroll performance with multiple animations → Should stay smooth
12. Verify preview mode shows all effects
```

---

## 🎨 Award-Winning Examples

### Example 1: Hero with All Effects
```tsx
<Hero
  title="Welcome to the Future"
  backgroundType="video"
  backgroundVideo="/videos/abstract-bg.mp4"
  overlay={true}
  overlayOpacity={50}
  animation="fade-up"
  glassEffect="light"
  particlesEnabled={true}
  particleColor="#ffffff"
  particleCount={80}
/>
```

### Example 2: Feature Cards with Stagger
```tsx
<ScrollStagger animation="fade-up" staggerDelay={150}>
  <GlassCard preset="light">Feature 1</GlassCard>
  <GlassCard preset="light">Feature 2</GlassCard>
  <GlassCard preset="light">Feature 3</GlassCard>
</ScrollStagger>
```

### Example 3: Interactive Team Cards
```tsx
<Card
  transform3D="tilt-hover"
  glassEffect="colored"
  scrollAnimation="zoom-in"
>
  <TeamMember {...props} />
</Card>
```

---

## 📝 Notes

1. **Performance**: Use `will-change` sparingly, clean up animation frames
2. **Accessibility**: Respect `prefers-reduced-motion` media query
3. **Mobile**: Test all effects on real devices
4. **Fallbacks**: Graceful degradation for older browsers
5. **Documentation**: Document all effects with examples

---

## 🏆 Phase Completion = DRAMAC Studio Complete!

Upon completion of this phase:
- ✅ Wave 1-10: Core Editor (Complete)
- ✅ Wave 11: Platform Fixes (Phases 28-29)
- ✅ Wave 12: Award-Winning Features (Phases 30-31)

**DRAMAC Studio is now a world-class, award-winning website builder!**

---

**Phase Duration**: 20-24 hours  
**Dependencies**: Phase 30 complete  
**Result**: PRODUCTION-READY STUDIO
