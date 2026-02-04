/**
 * DRAMAC Studio - Universal Props System
 * 
 * Adds animation, hover, visibility, and other universal props to all components.
 * These props are available on every component and handled by the RenderWrapper.
 * 
 * @phase STUDIO-30 - Component Superpowers
 */

import type { FieldDefinition } from "@/types/studio";
import { 
  ANIMATION_CLASSES, 
  DELAY_CLASSES,
  type AnimationPreset,
  type AnimationDelay 
} from "../animation-presets";

// Re-export animation types for convenience
export type { AnimationPreset, AnimationDelay };

// =============================================================================
// TYPES
// =============================================================================

/** Universal prop values available on all components */
export interface UniversalProps {
  // Animation
  animation?: AnimationPreset;
  animationDelay?: AnimationDelay;
  animationDuration?: number;
  
  // Hover effects
  hover?: HoverEffect;
  
  // Visibility
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  hideOnDesktop?: boolean;
  
  // Spacing overrides
  marginTop?: number;
  marginBottom?: number;
  paddingTop?: number;
  paddingBottom?: number;
  
  // Advanced
  customClassName?: string;
  customId?: string;
  ariaLabel?: string;
}

/** Available hover effects */
export type HoverEffect = 
  | "none"
  | "lift"
  | "grow"
  | "shrink"
  | "glow"
  | "shadow"
  | "border"
  | "brightness"
  | "blur-bg"
  | "underline"
  | "slide-up";

// =============================================================================
// HOVER EFFECT CLASSES
// =============================================================================

export const HOVER_EFFECTS: Record<HoverEffect, string> = {
  none: "",
  lift: "transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg",
  grow: "transition-transform duration-300 hover:scale-105",
  shrink: "transition-transform duration-300 hover:scale-95",
  glow: "transition-shadow duration-300 hover:shadow-[0_0_20px_rgba(var(--primary),0.3)]",
  shadow: "transition-shadow duration-300 hover:shadow-xl",
  border: "transition-all duration-300 hover:border-primary",
  brightness: "transition-all duration-300 hover:brightness-110",
  "blur-bg": "transition-all duration-300 hover:backdrop-blur-sm",
  underline: "relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-current after:transition-all after:duration-300 hover:after:w-full",
  "slide-up": "overflow-hidden relative before:absolute before:inset-0 before:bg-primary/10 before:translate-y-full before:transition-transform before:duration-300 hover:before:translate-y-0",
};

// =============================================================================
// FIELD OPTIONS
// =============================================================================

/** Animation preset options for select fields */
export const animationFieldOptions: Array<{ label: string; value: string }> = [
  { label: "None", value: "none" },
  { label: "Fade In", value: "fadeIn" },
  { label: "Fade In Up", value: "fadeInUp" },
  { label: "Fade In Down", value: "fadeInDown" },
  { label: "Fade In Left", value: "fadeInLeft" },
  { label: "Fade In Right", value: "fadeInRight" },
  { label: "Scale In", value: "scaleIn" },
  { label: "Scale In Up", value: "scaleInUp" },
  { label: "Slide In Up", value: "slideInUp" },
  { label: "Slide In Down", value: "slideInDown" },
  { label: "Slide In Left", value: "slideInLeft" },
  { label: "Slide In Right", value: "slideInRight" },
  { label: "Bounce In", value: "bounceIn" },
  { label: "Bounce In Up", value: "bounceInUp" },
  { label: "Flip In", value: "flipIn" },
  { label: "Rotate In", value: "rotateIn" },
  { label: "Zoom In", value: "zoomIn" },
  { label: "Blur In", value: "blurIn" },
  { label: "Expand In", value: "expandIn" },
  { label: "Pop In", value: "popIn" },
];

/** Hover effect options for select fields */
export const hoverFieldOptions: Array<{ label: string; value: string }> = [
  { label: "None", value: "none" },
  { label: "Lift Up", value: "lift" },
  { label: "Grow", value: "grow" },
  { label: "Shrink", value: "shrink" },
  { label: "Glow", value: "glow" },
  { label: "Shadow", value: "shadow" },
  { label: "Border Highlight", value: "border" },
  { label: "Brighten", value: "brightness" },
  { label: "Blur Background", value: "blur-bg" },
  { label: "Underline", value: "underline" },
  { label: "Slide Up Overlay", value: "slide-up" },
];

/** Animation delay options */
export const delayFieldOptions: Array<{ label: string; value: string }> = [
  { label: "None", value: "none" },
  { label: "Short (100ms)", value: "short" },
  { label: "Medium (300ms)", value: "medium" },
  { label: "Long (500ms)", value: "long" },
];

// =============================================================================
// UNIVERSAL FIELD DEFINITIONS
// =============================================================================

/** Universal field definitions for the properties panel */
export const UNIVERSAL_FIELDS: Record<string, FieldDefinition> = {
  // Animation section
  animation: {
    type: "select",
    label: "Entrance Animation",
    options: animationFieldOptions,
    defaultValue: "none",
    group: "Animation",
  },
  animationDelay: {
    type: "select",
    label: "Animation Delay",
    options: delayFieldOptions,
    defaultValue: "none",
    group: "Animation",
  },
  animationDuration: {
    type: "number",
    label: "Animation Duration (ms)",
    min: 100,
    max: 3000,
    step: 100,
    defaultValue: 600,
    group: "Animation",
  },
  
  // Hover section
  hover: {
    type: "select",
    label: "Hover Effect",
    options: hoverFieldOptions,
    defaultValue: "none",
    group: "Interaction",
  },
  
  // Visibility section
  hideOnMobile: {
    type: "toggle",
    label: "Hide on Mobile",
    defaultValue: false,
    group: "Visibility",
  },
  hideOnTablet: {
    type: "toggle",
    label: "Hide on Tablet",
    defaultValue: false,
    group: "Visibility",
  },
  hideOnDesktop: {
    type: "toggle",
    label: "Hide on Desktop",
    defaultValue: false,
    group: "Visibility",
  },
  
  // Spacing section
  marginTop: {
    type: "number",
    label: "Margin Top (px)",
    min: 0,
    max: 200,
    step: 4,
    group: "Spacing",
  },
  marginBottom: {
    type: "number",
    label: "Margin Bottom (px)",
    min: 0,
    max: 200,
    step: 4,
    group: "Spacing",
  },
  paddingTop: {
    type: "number",
    label: "Padding Top (px)",
    min: 0,
    max: 200,
    step: 4,
    group: "Spacing",
  },
  paddingBottom: {
    type: "number",
    label: "Padding Bottom (px)",
    min: 0,
    max: 200,
    step: 4,
    group: "Spacing",
  },
  
  // Advanced section
  customClassName: {
    type: "text",
    label: "Custom CSS Class",
    group: "Advanced",
  },
  customId: {
    type: "text",
    label: "HTML ID",
    group: "Advanced",
  },
  ariaLabel: {
    type: "text",
    label: "Accessibility Label",
    group: "Advanced",
  },
};

// =============================================================================
// UNIVERSAL GROUPS
// =============================================================================

/** Groups for organizing universal props in the properties panel */
export const UNIVERSAL_GROUPS = [
  { id: "Animation", label: "Animation", icon: "Sparkles", defaultOpen: false },
  { id: "Interaction", label: "Interaction", icon: "MousePointer", defaultOpen: false },
  { id: "Visibility", label: "Visibility", icon: "Eye", defaultOpen: false },
  { id: "Spacing", label: "Spacing", icon: "Move", defaultOpen: false },
  { id: "Advanced", label: "Advanced", icon: "Settings", defaultOpen: false },
] as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get universal CSS classes based on props
 */
export function getUniversalClasses(props: Partial<UniversalProps>): string {
  const classes: string[] = [];
  
  // Animation
  if (props.animation && props.animation !== "none") {
    const animClass = ANIMATION_CLASSES[props.animation as keyof typeof ANIMATION_CLASSES];
    if (animClass) classes.push(animClass);
  }
  
  // Animation delay
  if (props.animationDelay && props.animationDelay !== "none") {
    const delayClass = DELAY_CLASSES[props.animationDelay as keyof typeof DELAY_CLASSES];
    if (delayClass) classes.push(delayClass);
  }
  
  // Hover effect
  if (props.hover && props.hover !== "none") {
    const hoverClass = HOVER_EFFECTS[props.hover];
    if (hoverClass) classes.push(hoverClass);
  }
  
  // Visibility
  if (props.hideOnMobile) classes.push("hidden sm:block");
  if (props.hideOnTablet) classes.push("sm:hidden md:block");
  if (props.hideOnDesktop) classes.push("md:hidden");
  
  // Custom class
  if (props.customClassName) classes.push(props.customClassName);
  
  return classes.join(" ");
}

/**
 * Get universal inline styles based on props
 */
export function getUniversalStyles(props: Partial<UniversalProps>): React.CSSProperties {
  const styles: React.CSSProperties = {};
  
  // Animation duration
  if (props.animationDuration && props.animationDuration !== 600) {
    styles.animationDuration = `${props.animationDuration}ms`;
  }
  
  // Spacing
  if (props.marginTop !== undefined && props.marginTop > 0) {
    styles.marginTop = `${props.marginTop}px`;
  }
  if (props.marginBottom !== undefined && props.marginBottom > 0) {
    styles.marginBottom = `${props.marginBottom}px`;
  }
  if (props.paddingTop !== undefined && props.paddingTop > 0) {
    styles.paddingTop = `${props.paddingTop}px`;
  }
  if (props.paddingBottom !== undefined && props.paddingBottom > 0) {
    styles.paddingBottom = `${props.paddingBottom}px`;
  }
  
  return styles;
}

/**
 * Extract universal props from component props
 */
export function extractUniversalProps(props: Record<string, unknown>): UniversalProps {
  return {
    animation: props.animation as UniversalProps["animation"],
    animationDelay: props.animationDelay as UniversalProps["animationDelay"],
    animationDuration: props.animationDuration as UniversalProps["animationDuration"],
    hover: props.hover as UniversalProps["hover"],
    hideOnMobile: props.hideOnMobile as boolean | undefined,
    hideOnTablet: props.hideOnTablet as boolean | undefined,
    hideOnDesktop: props.hideOnDesktop as boolean | undefined,
    marginTop: props.marginTop as number | undefined,
    marginBottom: props.marginBottom as number | undefined,
    paddingTop: props.paddingTop as number | undefined,
    paddingBottom: props.paddingBottom as number | undefined,
    customClassName: props.customClassName as string | undefined,
    customId: props.customId as string | undefined,
    ariaLabel: props.ariaLabel as string | undefined,
  };
}

/**
 * Check if any universal props are set
 */
export function hasUniversalProps(props: Record<string, unknown>): boolean {
  const universalKeys = Object.keys(UNIVERSAL_FIELDS);
  return universalKeys.some((key) => {
    const value = props[key];
    if (value === undefined || value === null) return false;
    if (value === "none" || value === false || value === 0) return false;
    if (value === "") return false;
    return true;
  });
}
