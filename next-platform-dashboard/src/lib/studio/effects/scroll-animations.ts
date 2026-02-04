/**
 * DRAMAC Studio - Scroll Animation System
 * 
 * Intersection Observer based scroll-triggered animations.
 * 
 * @phase STUDIO-31 - 3D Effects & Advanced Animations
 */

import type React from "react";

// =============================================================================
// TYPES
// =============================================================================

/** Scroll animation types */
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

/** Animation config */
export interface ScrollAnimationConfig {
  type: ScrollAnimationType;
  delay?: number;        // ms
  duration?: number;     // ms
  threshold?: number;    // 0-1 (when to trigger)
  once?: boolean;        // Only animate once
  offset?: number;       // Offset from viewport edge
  easing?: string;       // CSS easing function
}

/** Stagger children config */
export interface StaggerConfig {
  enabled: boolean;
  delay: number;     // Delay between each child (ms)
  from?: "first" | "last" | "center";
}

// =============================================================================
// PRESET CONFIGURATIONS
// =============================================================================

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
    initial: { transform: "translateY(100%)", opacity: 0 },
    animate: { transform: "translateY(0)", opacity: 1 },
  },
  "slide-down": {
    initial: { transform: "translateY(-100%)", opacity: 0 },
    animate: { transform: "translateY(0)", opacity: 1 },
  },
  "slide-left": {
    initial: { transform: "translateX(100%)", opacity: 0 },
    animate: { transform: "translateX(0)", opacity: 1 },
  },
  "slide-right": {
    initial: { transform: "translateX(-100%)", opacity: 0 },
    animate: { transform: "translateX(0)", opacity: 1 },
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

// =============================================================================
// FIELD OPTIONS
// =============================================================================

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
