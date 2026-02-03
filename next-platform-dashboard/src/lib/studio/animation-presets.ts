/**
 * DRAMAC Studio Animation Presets
 * 
 * Pre-built animation configurations for components.
 * Created in PHASE-STUDIO-29 for consistent, professional animations.
 * 
 * Usage:
 * - Apply via component props: animationPreset="fadeInUp"
 * - Or use CSS classes directly: className={ANIMATION_CLASSES.fadeInUp}
 * - Tailwind keyframes are defined in tailwind.config.ts
 */

// =============================================================================
// ANIMATION PRESET TYPES
// =============================================================================

export type AnimationPreset = 
  | "none"
  | "fadeIn"
  | "fadeInUp"
  | "fadeInDown"
  | "fadeInLeft"
  | "fadeInRight"
  | "scaleIn"
  | "scaleInUp"
  | "slideInUp"
  | "slideInDown"
  | "slideInLeft"
  | "slideInRight"
  | "bounceIn"
  | "bounceInUp"
  | "flipIn"
  | "rotateIn"
  | "zoomIn"
  | "blurIn"
  | "expandIn"
  | "popIn";

export type AnimationDuration = "fast" | "normal" | "slow" | "slower";
export type AnimationEasing = "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out" | "spring" | "bounce";
export type AnimationDelay = "none" | "short" | "medium" | "long";

export interface AnimationConfig {
  preset: AnimationPreset;
  duration: AnimationDuration;
  easing: AnimationEasing;
  delay: AnimationDelay;
  repeat?: boolean;
  stagger?: number; // For child elements, delay between each
}

// =============================================================================
// ANIMATION CLASS MAPPINGS
// =============================================================================

/**
 * CSS animation classes for each preset
 * These use Tailwind's animate-* classes defined in tailwind.config.ts
 */
export const ANIMATION_CLASSES: Record<AnimationPreset, string> = {
  none: "",
  fadeIn: "animate-fadeIn",
  fadeInUp: "animate-fadeInUp",
  fadeInDown: "animate-fadeInDown",
  fadeInLeft: "animate-fadeInLeft",
  fadeInRight: "animate-fadeInRight",
  scaleIn: "animate-scaleIn",
  scaleInUp: "animate-scaleInUp",
  slideInUp: "animate-slideInUp",
  slideInDown: "animate-slideInDown",
  slideInLeft: "animate-slideInLeft",
  slideInRight: "animate-slideInRight",
  bounceIn: "animate-bounceIn",
  bounceInUp: "animate-bounceInUp",
  flipIn: "animate-flipIn",
  rotateIn: "animate-rotateIn",
  zoomIn: "animate-zoomIn",
  blurIn: "animate-blurIn",
  expandIn: "animate-expandIn",
  popIn: "animate-popIn",
};

export const DURATION_CLASSES: Record<AnimationDuration, string> = {
  fast: "duration-200",
  normal: "duration-500",
  slow: "duration-700",
  slower: "duration-1000",
};

export const DELAY_CLASSES: Record<AnimationDelay, string> = {
  none: "delay-0",
  short: "delay-100",
  medium: "delay-300",
  long: "delay-500",
};

export const EASING_CLASSES: Record<AnimationEasing, string> = {
  linear: "ease-linear",
  ease: "ease",
  "ease-in": "ease-in",
  "ease-out": "ease-out",
  "ease-in-out": "ease-in-out",
  spring: "ease-[cubic-bezier(0.34,1.56,0.64,1)]",
  bounce: "ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]",
};

// =============================================================================
// PRESET METADATA
// =============================================================================

export interface AnimationPresetMeta {
  name: string;
  description: string;
  category: "fade" | "slide" | "scale" | "bounce" | "rotate" | "special";
  preview: string; // CSS for preview animation
}

export const ANIMATION_PRESETS: Record<AnimationPreset, AnimationPresetMeta> = {
  none: {
    name: "None",
    description: "No animation",
    category: "special",
    preview: "",
  },
  fadeIn: {
    name: "Fade In",
    description: "Simple fade in from transparent",
    category: "fade",
    preview: "opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]",
  },
  fadeInUp: {
    name: "Fade In Up",
    description: "Fade in while moving up",
    category: "fade",
    preview: "opacity-0 translate-y-4 animate-[fadeInUp_0.5s_ease-out_forwards]",
  },
  fadeInDown: {
    name: "Fade In Down",
    description: "Fade in while moving down",
    category: "fade",
    preview: "opacity-0 -translate-y-4 animate-[fadeInDown_0.5s_ease-out_forwards]",
  },
  fadeInLeft: {
    name: "Fade In Left",
    description: "Fade in from the left",
    category: "fade",
    preview: "opacity-0 -translate-x-4 animate-[fadeInLeft_0.5s_ease-out_forwards]",
  },
  fadeInRight: {
    name: "Fade In Right",
    description: "Fade in from the right",
    category: "fade",
    preview: "opacity-0 translate-x-4 animate-[fadeInRight_0.5s_ease-out_forwards]",
  },
  scaleIn: {
    name: "Scale In",
    description: "Scale up from smaller size",
    category: "scale",
    preview: "opacity-0 scale-95 animate-[scaleIn_0.3s_ease-out_forwards]",
  },
  scaleInUp: {
    name: "Scale In Up",
    description: "Scale up while moving up",
    category: "scale",
    preview: "opacity-0 scale-95 translate-y-4 animate-[scaleInUp_0.4s_ease-out_forwards]",
  },
  slideInUp: {
    name: "Slide In Up",
    description: "Slide in from below",
    category: "slide",
    preview: "translate-y-full animate-[slideInUp_0.4s_ease-out_forwards]",
  },
  slideInDown: {
    name: "Slide In Down",
    description: "Slide in from above",
    category: "slide",
    preview: "-translate-y-full animate-[slideInDown_0.4s_ease-out_forwards]",
  },
  slideInLeft: {
    name: "Slide In Left",
    description: "Slide in from the left",
    category: "slide",
    preview: "-translate-x-full animate-[slideInLeft_0.4s_ease-out_forwards]",
  },
  slideInRight: {
    name: "Slide In Right",
    description: "Slide in from the right",
    category: "slide",
    preview: "translate-x-full animate-[slideInRight_0.4s_ease-out_forwards]",
  },
  bounceIn: {
    name: "Bounce In",
    description: "Bouncy entrance with scale",
    category: "bounce",
    preview: "opacity-0 scale-50 animate-[bounceIn_0.6s_cubic-bezier(0.68,-0.55,0.265,1.55)_forwards]",
  },
  bounceInUp: {
    name: "Bounce In Up",
    description: "Bounce in from below",
    category: "bounce",
    preview: "opacity-0 translate-y-12 animate-[bounceInUp_0.6s_cubic-bezier(0.68,-0.55,0.265,1.55)_forwards]",
  },
  flipIn: {
    name: "Flip In",
    description: "3D flip entrance",
    category: "rotate",
    preview: "opacity-0 rotateX-90 animate-[flipIn_0.5s_ease-out_forwards]",
  },
  rotateIn: {
    name: "Rotate In",
    description: "Rotate while fading in",
    category: "rotate",
    preview: "opacity-0 rotate-[-45deg] animate-[rotateIn_0.5s_ease-out_forwards]",
  },
  zoomIn: {
    name: "Zoom In",
    description: "Zoom in from very small",
    category: "scale",
    preview: "opacity-0 scale-0 animate-[zoomIn_0.4s_ease-out_forwards]",
  },
  blurIn: {
    name: "Blur In",
    description: "Fade in with blur effect",
    category: "special",
    preview: "opacity-0 blur-sm animate-[blurIn_0.5s_ease-out_forwards]",
  },
  expandIn: {
    name: "Expand In",
    description: "Expand from center",
    category: "special",
    preview: "opacity-0 scale-x-0 animate-[expandIn_0.4s_ease-out_forwards]",
  },
  popIn: {
    name: "Pop In",
    description: "Pop in with overshoot",
    category: "scale",
    preview: "opacity-0 scale-0 animate-[popIn_0.3s_cubic-bezier(0.34,1.56,0.64,1)_forwards]",
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the combined animation class string for a config
 */
export function getAnimationClasses(config: Partial<AnimationConfig>): string {
  const {
    preset = "none",
    duration = "normal",
    easing = "ease-out",
    delay = "none",
  } = config;

  if (preset === "none") return "";

  const classes = [
    ANIMATION_CLASSES[preset],
    DURATION_CLASSES[duration],
    DELAY_CLASSES[delay],
    EASING_CLASSES[easing],
  ].filter(Boolean);

  return classes.join(" ");
}

/**
 * Get staggered animation classes for child elements
 */
export function getStaggeredClasses(
  config: Partial<AnimationConfig>,
  index: number
): string {
  const baseClasses = getAnimationClasses(config);
  const staggerDelay = (config.stagger || 100) * index;
  
  return `${baseClasses} [animation-delay:${staggerDelay}ms]`;
}

/**
 * Get animation presets by category
 */
export function getPresetsByCategory(category: AnimationPresetMeta["category"]): AnimationPreset[] {
  return (Object.entries(ANIMATION_PRESETS) as [AnimationPreset, AnimationPresetMeta][])
    .filter(([_, meta]) => meta.category === category)
    .map(([preset]) => preset);
}

/**
 * Get all animation categories
 */
export function getAnimationCategories(): AnimationPresetMeta["category"][] {
  const categories = new Set<AnimationPresetMeta["category"]>();
  Object.values(ANIMATION_PRESETS).forEach(meta => categories.add(meta.category));
  return Array.from(categories);
}

// =============================================================================
// SCROLL-TRIGGERED ANIMATION HOOK
// =============================================================================

/**
 * Intersection Observer options for scroll animations
 */
export const SCROLL_ANIMATION_OPTIONS = {
  threshold: 0.1,
  rootMargin: "0px 0px -10% 0px",
};

/**
 * Default animation config for component animations
 */
export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  preset: "fadeInUp",
  duration: "normal",
  easing: "ease-out",
  delay: "none",
  repeat: false,
  stagger: 100,
};

// =============================================================================
// TAILWIND KEYFRAME DEFINITIONS
// =============================================================================

/**
 * These keyframes should be added to tailwind.config.ts
 * 
 * Add to extend.keyframes:
 */
export const TAILWIND_KEYFRAMES = {
  fadeIn: {
    "0%": { opacity: "0" },
    "100%": { opacity: "1" },
  },
  fadeInUp: {
    "0%": { opacity: "0", transform: "translateY(20px)" },
    "100%": { opacity: "1", transform: "translateY(0)" },
  },
  fadeInDown: {
    "0%": { opacity: "0", transform: "translateY(-20px)" },
    "100%": { opacity: "1", transform: "translateY(0)" },
  },
  fadeInLeft: {
    "0%": { opacity: "0", transform: "translateX(-20px)" },
    "100%": { opacity: "1", transform: "translateX(0)" },
  },
  fadeInRight: {
    "0%": { opacity: "0", transform: "translateX(20px)" },
    "100%": { opacity: "1", transform: "translateX(0)" },
  },
  scaleIn: {
    "0%": { opacity: "0", transform: "scale(0.95)" },
    "100%": { opacity: "1", transform: "scale(1)" },
  },
  scaleInUp: {
    "0%": { opacity: "0", transform: "scale(0.95) translateY(20px)" },
    "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
  },
  slideInUp: {
    "0%": { transform: "translateY(100%)" },
    "100%": { transform: "translateY(0)" },
  },
  slideInDown: {
    "0%": { transform: "translateY(-100%)" },
    "100%": { transform: "translateY(0)" },
  },
  slideInLeft: {
    "0%": { transform: "translateX(-100%)" },
    "100%": { transform: "translateX(0)" },
  },
  slideInRight: {
    "0%": { transform: "translateX(100%)" },
    "100%": { transform: "translateX(0)" },
  },
  bounceIn: {
    "0%": { opacity: "0", transform: "scale(0.5)" },
    "50%": { opacity: "1", transform: "scale(1.05)" },
    "100%": { opacity: "1", transform: "scale(1)" },
  },
  bounceInUp: {
    "0%": { opacity: "0", transform: "translateY(50px)" },
    "60%": { opacity: "1", transform: "translateY(-10px)" },
    "100%": { opacity: "1", transform: "translateY(0)" },
  },
  flipIn: {
    "0%": { opacity: "0", transform: "perspective(400px) rotateX(90deg)" },
    "100%": { opacity: "1", transform: "perspective(400px) rotateX(0deg)" },
  },
  rotateIn: {
    "0%": { opacity: "0", transform: "rotate(-45deg)" },
    "100%": { opacity: "1", transform: "rotate(0)" },
  },
  zoomIn: {
    "0%": { opacity: "0", transform: "scale(0)" },
    "100%": { opacity: "1", transform: "scale(1)" },
  },
  blurIn: {
    "0%": { opacity: "0", filter: "blur(10px)" },
    "100%": { opacity: "1", filter: "blur(0)" },
  },
  expandIn: {
    "0%": { opacity: "0", transform: "scaleX(0)" },
    "100%": { opacity: "1", transform: "scaleX(1)" },
  },
  popIn: {
    "0%": { opacity: "0", transform: "scale(0)" },
    "80%": { opacity: "1", transform: "scale(1.1)" },
    "100%": { opacity: "1", transform: "scale(1)" },
  },
};

/**
 * Animation names for tailwind.config.ts
 */
export const TAILWIND_ANIMATIONS = {
  fadeIn: "fadeIn 0.5s ease-out forwards",
  fadeInUp: "fadeInUp 0.5s ease-out forwards",
  fadeInDown: "fadeInDown 0.5s ease-out forwards",
  fadeInLeft: "fadeInLeft 0.5s ease-out forwards",
  fadeInRight: "fadeInRight 0.5s ease-out forwards",
  scaleIn: "scaleIn 0.3s ease-out forwards",
  scaleInUp: "scaleInUp 0.4s ease-out forwards",
  slideInUp: "slideInUp 0.4s ease-out forwards",
  slideInDown: "slideInDown 0.4s ease-out forwards",
  slideInLeft: "slideInLeft 0.4s ease-out forwards",
  slideInRight: "slideInRight 0.4s ease-out forwards",
  bounceIn: "bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards",
  bounceInUp: "bounceInUp 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards",
  flipIn: "flipIn 0.5s ease-out forwards",
  rotateIn: "rotateIn 0.5s ease-out forwards",
  zoomIn: "zoomIn 0.4s ease-out forwards",
  blurIn: "blurIn 0.5s ease-out forwards",
  expandIn: "expandIn 0.4s ease-out forwards",
  popIn: "popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
};
