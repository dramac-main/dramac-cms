/**
 * Effects Index
 * 
 * Central export point for all Studio effects.
 * 
 * @phase STUDIO-31 - 3D Effects & Advanced Animations
 */

// =============================================================================
// 3D TRANSFORMS
// =============================================================================

export {
  type Transform3DConfig,
  type Transform3DPreset,
  TRANSFORM_3D_PRESETS,
  generateTransformCSS,
  generatePerspectiveStyles,
  generate3DStyles,
  get3DPresetClass,
  transform3DFieldOptions,
  transform3DOriginOptions,
} from "./transforms-3d";

// =============================================================================
// TILT EFFECT
// =============================================================================

export { useTiltEffect } from "./use-tilt-effect";

// =============================================================================
// SCROLL ANIMATIONS
// =============================================================================

export {
  type ScrollAnimationType,
  type ScrollAnimationConfig,
  SCROLL_ANIMATION_PRESETS,
  scrollAnimationFieldOptions,
} from "./scroll-animations";

export {
  useScrollAnimation,
  useStaggerAnimation,
} from "./use-scroll-animation";

// =============================================================================
// GLASSMORPHISM
// =============================================================================

export {
  type GlassmorphismConfig,
  type GlassPreset,
  GLASS_PRESETS,
  generateGlassStyles,
  getGlassPresetStyles,
  glassPresetFieldOptions,
} from "./glassmorphism";

// =============================================================================
// PARALLAX
// =============================================================================

export {
  type ParallaxLayer,
  type ParallaxConfig,
  calculateParallaxOffset,
  generateParallaxLayerStyles,
  getParallaxSpeedByDepth,
  parallaxSpeedOptions,
} from "./parallax";

export {
  useParallax,
  useMouseParallax,
} from "./use-parallax";

// =============================================================================
// MICRO INTERACTIONS
// =============================================================================

export {
  type MicroInteractionType,
  MICRO_INTERACTION_CSS,
  getMicroInteractionClass,
  createRipple,
  triggerShake,
  triggerHeartBurst,
  microInteractionFieldOptions,
} from "./micro-interactions";
