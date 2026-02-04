/**
 * ScrollAnimate Component
 * 
 * Wrapper component for scroll-triggered animations.
 * 
 * @phase STUDIO-31 - 3D Effects & Advanced Animations
 */

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useScrollAnimation, useStaggerAnimation } from "@/lib/studio/effects/use-scroll-animation";
import type { ScrollAnimationType } from "@/lib/studio/effects/scroll-animations";

// =============================================================================
// SCROLL ANIMATE COMPONENT
// =============================================================================

type HTMLTag = "div" | "section" | "article" | "aside" | "header" | "footer" | "main" | "nav" | "span";

interface ScrollAnimateProps {
  children: React.ReactNode;
  animation: ScrollAnimationType;
  delay?: number;
  duration?: number;
  threshold?: number;
  once?: boolean;
  className?: string;
  as?: HTMLTag;
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

// =============================================================================
// SCROLL STAGGER COMPONENT
// =============================================================================

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
