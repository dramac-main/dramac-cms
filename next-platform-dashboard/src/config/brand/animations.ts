/**
 * DRAMAC CMS Animation System
 * 
 * Enterprise-grade animation presets with accessibility support.
 * Includes transitions, keyframe animations, and motion utilities.
 * 
 * Features:
 * - Respects prefers-reduced-motion
 * - GPU-accelerated transforms
 * - Consistent timing across the platform
 * - Stagger animations for lists
 * 
 * @module config/brand/animations
 * @version 1.0.0
 */

// =============================================================================
// TYPES
// =============================================================================

export interface AnimationConfig {
  /** Keyframe name or CSS animation shorthand */
  animation: string;
  /** Duration in milliseconds */
  duration: number;
  /** CSS timing function */
  easing: string;
  /** Fill mode */
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
}

export interface TransitionConfig {
  /** CSS properties to transition */
  properties: string[];
  /** Duration in milliseconds */
  duration: number;
  /** CSS timing function */
  easing: string;
  /** Delay in milliseconds */
  delay?: number;
}

export interface StaggerConfig {
  /** Base delay between items (ms) */
  baseDelay: number;
  /** Maximum delay cap (ms) */
  maxDelay?: number;
  /** Delay increment per item (ms) */
  increment?: number;
}

// =============================================================================
// TIMING CONSTANTS
// =============================================================================

/**
 * Standard durations for consistent animation timing.
 * Based on Material Design motion principles.
 */
export const durations = {
  /** Instant feedback (50ms) */
  instant: 50,
  /** Quick micro-interactions (100ms) */
  fast: 100,
  /** Standard transitions (150ms) */
  normal: 150,
  /** Emphasized transitions (200ms) */
  emphasized: 200,
  /** Complex animations (300ms) */
  complex: 300,
  /** Large-scale transitions (400ms) */
  large: 400,
  /** Page transitions (500ms) */
  page: 500,
  /** Dramatic reveals (700ms) */
  dramatic: 700,
} as const;

/**
 * Easing functions for natural motion.
 */
export const easings = {
  /** Linear - constant speed */
  linear: 'linear',
  /** Standard ease-out for most UI */
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  /** Ease-in for exits */
  decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
  /** Ease-out for entries */
  accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
  /** Sharp for quick movements */
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  /** Bounce effect */
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  /** Elastic overshoot */
  elastic: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
  /** Smooth for subtle transitions */
  smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  /** Spring-like motion */
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
} as const;

// =============================================================================
// TRANSITION PRESETS
// =============================================================================

/**
 * Pre-built transition configurations for common use cases.
 */
export const transitions = {
  /** Color changes (hover states) */
  colors: {
    properties: ['color', 'background-color', 'border-color', 'fill', 'stroke'],
    duration: durations.normal,
    easing: easings.standard,
  },
  /** Opacity changes (fade in/out) */
  opacity: {
    properties: ['opacity'],
    duration: durations.normal,
    easing: easings.standard,
  },
  /** Transform animations (scale, translate, rotate) */
  transform: {
    properties: ['transform'],
    duration: durations.emphasized,
    easing: easings.standard,
  },
  /** Shadow changes (elevation) */
  shadow: {
    properties: ['box-shadow'],
    duration: durations.normal,
    easing: easings.standard,
  },
  /** All common properties */
  all: {
    properties: ['all'],
    duration: durations.normal,
    easing: easings.standard,
  },
  /** Interactive elements (buttons, links) */
  interactive: {
    properties: ['color', 'background-color', 'border-color', 'box-shadow', 'transform'],
    duration: durations.fast,
    easing: easings.standard,
  },
  /** Layout changes (width, height, padding) */
  layout: {
    properties: ['width', 'height', 'padding', 'margin', 'gap'],
    duration: durations.complex,
    easing: easings.standard,
  },
  /** Theme switching */
  theme: {
    properties: ['color', 'background-color', 'border-color', 'box-shadow'],
    duration: durations.emphasized,
    easing: easings.smooth,
  },
} as const;

/**
 * Convert transition config to CSS value.
 */
export function transitionToCss(config: TransitionConfig): string {
  const delay = config.delay ? ` ${config.delay}ms` : '';
  return config.properties
    .map(prop => `${prop} ${config.duration}ms ${config.easing}${delay}`)
    .join(', ');
}

// =============================================================================
// KEYFRAME ANIMATIONS
// =============================================================================

/**
 * Keyframe animation definitions.
 * These generate the @keyframes CSS rules.
 */
export const keyframes = {
  // Fade animations
  fadeIn: {
    from: { opacity: '0' },
    to: { opacity: '1' },
  },
  fadeOut: {
    from: { opacity: '1' },
    to: { opacity: '0' },
  },
  fadeInUp: {
    from: { opacity: '0', transform: 'translateY(10px)' },
    to: { opacity: '1', transform: 'translateY(0)' },
  },
  fadeInDown: {
    from: { opacity: '0', transform: 'translateY(-10px)' },
    to: { opacity: '1', transform: 'translateY(0)' },
  },
  fadeInLeft: {
    from: { opacity: '0', transform: 'translateX(-10px)' },
    to: { opacity: '1', transform: 'translateX(0)' },
  },
  fadeInRight: {
    from: { opacity: '0', transform: 'translateX(10px)' },
    to: { opacity: '1', transform: 'translateX(0)' },
  },
  
  // Scale animations
  scaleIn: {
    from: { opacity: '0', transform: 'scale(0.95)' },
    to: { opacity: '1', transform: 'scale(1)' },
  },
  scaleOut: {
    from: { opacity: '1', transform: 'scale(1)' },
    to: { opacity: '0', transform: 'scale(0.95)' },
  },
  scaleUp: {
    from: { transform: 'scale(1)' },
    to: { transform: 'scale(1.05)' },
  },
  
  // Slide animations
  slideInUp: {
    from: { transform: 'translateY(100%)' },
    to: { transform: 'translateY(0)' },
  },
  slideInDown: {
    from: { transform: 'translateY(-100%)' },
    to: { transform: 'translateY(0)' },
  },
  slideInLeft: {
    from: { transform: 'translateX(-100%)' },
    to: { transform: 'translateX(0)' },
  },
  slideInRight: {
    from: { transform: 'translateX(100%)' },
    to: { transform: 'translateX(0)' },
  },
  slideOutUp: {
    from: { transform: 'translateY(0)' },
    to: { transform: 'translateY(-100%)' },
  },
  slideOutDown: {
    from: { transform: 'translateY(0)' },
    to: { transform: 'translateY(100%)' },
  },
  
  // Bounce animations
  bounce: {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-10px)' },
  },
  bounceIn: {
    '0%': { opacity: '0', transform: 'scale(0.3)' },
    '50%': { transform: 'scale(1.05)' },
    '70%': { transform: 'scale(0.9)' },
    '100%': { opacity: '1', transform: 'scale(1)' },
  },
  
  // Shake animation (for errors)
  shake: {
    '0%, 100%': { transform: 'translateX(0)' },
    '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
    '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
  },
  
  // Pulse animation
  pulse: {
    '0%, 100%': { opacity: '1' },
    '50%': { opacity: '0.5' },
  },
  
  // Spin animation
  spin: {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
  
  // Ping animation (for notifications)
  ping: {
    '75%, 100%': { transform: 'scale(2)', opacity: '0' },
  },
  
  // Skeleton loading
  shimmer: {
    '0%': { backgroundPosition: '-200% 0' },
    '100%': { backgroundPosition: '200% 0' },
  },
  
  // Accordion
  accordionDown: {
    from: { height: '0', opacity: '0' },
    to: { height: 'var(--radix-accordion-content-height)', opacity: '1' },
  },
  accordionUp: {
    from: { height: 'var(--radix-accordion-content-height)', opacity: '1' },
    to: { height: '0', opacity: '0' },
  },
  
  // Dialog/Modal
  dialogIn: {
    from: { opacity: '0', transform: 'translate(-50%, -48%) scale(0.96)' },
    to: { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
  },
  dialogOut: {
    from: { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
    to: { opacity: '0', transform: 'translate(-50%, -48%) scale(0.96)' },
  },
  
  // Toast notifications
  toastSlideIn: {
    from: { transform: 'translateX(calc(100% + 1rem))' },
    to: { transform: 'translateX(0)' },
  },
  toastSlideOut: {
    from: { transform: 'translateX(0)' },
    to: { transform: 'translateX(calc(100% + 1rem))' },
  },
} as const;

// =============================================================================
// ANIMATION PRESETS
// =============================================================================

/**
 * Ready-to-use animation presets combining keyframes with timing.
 */
export const animations = {
  // Entrance animations
  fadeIn: `fadeIn ${durations.normal}ms ${easings.standard} forwards`,
  fadeInUp: `fadeInUp ${durations.emphasized}ms ${easings.decelerate} forwards`,
  fadeInDown: `fadeInDown ${durations.emphasized}ms ${easings.decelerate} forwards`,
  fadeInLeft: `fadeInLeft ${durations.emphasized}ms ${easings.decelerate} forwards`,
  fadeInRight: `fadeInRight ${durations.emphasized}ms ${easings.decelerate} forwards`,
  scaleIn: `scaleIn ${durations.emphasized}ms ${easings.spring} forwards`,
  slideInUp: `slideInUp ${durations.complex}ms ${easings.decelerate} forwards`,
  slideInDown: `slideInDown ${durations.complex}ms ${easings.decelerate} forwards`,
  slideInLeft: `slideInLeft ${durations.complex}ms ${easings.decelerate} forwards`,
  slideInRight: `slideInRight ${durations.complex}ms ${easings.decelerate} forwards`,
  bounceIn: `bounceIn ${durations.large}ms ${easings.standard} forwards`,
  
  // Exit animations
  fadeOut: `fadeOut ${durations.normal}ms ${easings.standard} forwards`,
  scaleOut: `scaleOut ${durations.normal}ms ${easings.accelerate} forwards`,
  slideOutUp: `slideOutUp ${durations.complex}ms ${easings.accelerate} forwards`,
  slideOutDown: `slideOutDown ${durations.complex}ms ${easings.accelerate} forwards`,
  
  // Looping animations
  bounce: `bounce 1s ${easings.standard} infinite`,
  pulse: `pulse 2s ${easings.standard} infinite`,
  spin: `spin 1s linear infinite`,
  ping: `ping 1s ${easings.standard} infinite`,
  shimmer: `shimmer 2s linear infinite`,
  
  // Feedback animations
  shake: `shake ${durations.large}ms ${easings.standard}`,
  
  // Component animations
  accordionDown: `accordionDown ${durations.complex}ms ${easings.standard}`,
  accordionUp: `accordionUp ${durations.complex}ms ${easings.standard}`,
  dialogIn: `dialogIn ${durations.emphasized}ms ${easings.spring}`,
  dialogOut: `dialogOut ${durations.normal}ms ${easings.accelerate}`,
  toastSlideIn: `toastSlideIn ${durations.complex}ms ${easings.spring}`,
  toastSlideOut: `toastSlideOut ${durations.emphasized}ms ${easings.accelerate}`,
} as const;

// =============================================================================
// STAGGER UTILITIES
// =============================================================================

/**
 * Calculate stagger delay for list items.
 * 
 * @example
 * ```tsx
 * items.map((item, index) => (
 *   <div style={{ animationDelay: staggerDelay(index) }}>
 *     {item}
 *   </div>
 * ))
 * ```
 */
export function staggerDelay(
  index: number,
  config: StaggerConfig = { baseDelay: 50, maxDelay: 500 }
): string {
  const { baseDelay, maxDelay = 500, increment = baseDelay } = config;
  const delay = Math.min(index * increment + baseDelay, maxDelay);
  return `${delay}ms`;
}

/**
 * Generate CSS custom properties for staggered animations.
 */
export function staggerCssVars(count: number, baseDelay: number = 50): string {
  return Array.from({ length: count }, (_, i) => 
    `--stagger-delay-${i + 1}: ${(i + 1) * baseDelay}ms;`
  ).join('\n');
}

// =============================================================================
// REDUCED MOTION SUPPORT
// =============================================================================

/**
 * CSS for reduced motion preference.
 * Disables animations for users who prefer reduced motion.
 */
export const reducedMotionStyles = `
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
`;

/**
 * Check if user prefers reduced motion.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get animation value respecting reduced motion preference.
 */
export function safeAnimation(animation: string): string {
  if (prefersReducedMotion()) return 'none';
  return animation;
}

// =============================================================================
// CSS GENERATION
// =============================================================================

/**
 * Generate CSS @keyframes rules from keyframe definitions.
 */
export function generateKeyframesCss(): string {
  return Object.entries(keyframes)
    .map(([name, frames]) => {
      const framesCss = Object.entries(frames)
        .map(([key, props]) => {
          const propsStr = Object.entries(props)
            .map(([prop, value]) => `${prop}: ${value}`)
            .join('; ');
          return `${key} { ${propsStr}; }`;
        })
        .join('\n    ');
      return `@keyframes ${name} {\n    ${framesCss}\n  }`;
    })
    .join('\n\n  ');
}

/**
 * Generate CSS custom properties for animations.
 */
export function generateAnimationVars(): Record<string, string> {
  const vars: Record<string, string> = {};
  
  // Duration variables
  Object.entries(durations).forEach(([key, value]) => {
    vars[`--duration-${key}`] = `${value}ms`;
  });
  
  // Easing variables
  Object.entries(easings).forEach(([key, value]) => {
    vars[`--ease-${key}`] = value;
  });
  
  // Animation variables
  Object.entries(animations).forEach(([key, value]) => {
    vars[`--animate-${key}`] = value;
  });
  
  return vars;
}
