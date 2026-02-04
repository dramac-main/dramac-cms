/**
 * Advanced Effect Fields for Studio Registry
 * 
 * Field definitions for 3D effects, animations, and visual enhancements.
 * 
 * @phase STUDIO-31 - 3D Effects & Advanced Animations
 */

import type { FieldDefinition } from "@/types/studio";
import { transform3DFieldOptions, transform3DOriginOptions } from "@/lib/studio/effects/transforms-3d";
import { scrollAnimationFieldOptions } from "@/lib/studio/effects/scroll-animations";
import { glassPresetFieldOptions } from "@/lib/studio/effects/glassmorphism";
import { parallaxSpeedOptions } from "@/lib/studio/effects/parallax";
import { microInteractionFieldOptions } from "@/lib/studio/effects/micro-interactions";

// =============================================================================
// 3D TRANSFORM FIELDS
// =============================================================================

export const TRANSFORM_3D_FIELDS: Record<string, FieldDefinition> = {
  transform3d: {
    key: "transform3d",
    label: "3D Transform",
    type: "select",
    group: "3D Effects",
    options: transform3DFieldOptions,
    defaultValue: "none",
    description: "Apply 3D transformation effect",
  },
  perspective: {
    key: "perspective",
    label: "Perspective",
    type: "number",
    group: "3D Effects",
    min: 100,
    max: 2000,
    step: 50,
    defaultValue: 1000,
    description: "3D perspective depth (lower = more dramatic)",
    showWhen: { transform3d: { $ne: "none" } },
  },
  transformOrigin: {
    key: "transformOrigin",
    label: "Transform Origin",
    type: "select",
    group: "3D Effects",
    options: transform3DOriginOptions,
    defaultValue: "center",
    description: "Origin point for 3D transforms",
    showWhen: { transform3d: { $ne: "none" } },
  },
  rotateX: {
    key: "rotateX",
    label: "Rotate X",
    type: "slider",
    group: "3D Effects",
    min: -180,
    max: 180,
    step: 5,
    defaultValue: 0,
    description: "X-axis rotation in degrees",
  },
  rotateY: {
    key: "rotateY",
    label: "Rotate Y",
    type: "slider",
    group: "3D Effects",
    min: -180,
    max: 180,
    step: 5,
    defaultValue: 0,
    description: "Y-axis rotation in degrees",
  },
  rotateZ: {
    key: "rotateZ",
    label: "Rotate Z",
    type: "slider",
    group: "3D Effects",
    min: -180,
    max: 180,
    step: 5,
    defaultValue: 0,
    description: "Z-axis rotation in degrees",
  },
};

// =============================================================================
// TILT EFFECT FIELDS
// =============================================================================

export const TILT_EFFECT_FIELDS: Record<string, FieldDefinition> = {
  tiltEnabled: {
    key: "tiltEnabled",
    label: "Enable Tilt Effect",
    type: "toggle",
    group: "Mouse Effects",
    defaultValue: false,
    description: "Enable 3D tilt on mouse hover",
  },
  tiltMaxRotation: {
    key: "tiltMaxRotation",
    label: "Max Rotation",
    type: "slider",
    group: "Mouse Effects",
    min: 5,
    max: 45,
    step: 5,
    defaultValue: 15,
    description: "Maximum tilt angle in degrees",
    showWhen: { tiltEnabled: true },
  },
  tiltPerspective: {
    key: "tiltPerspective",
    label: "Tilt Perspective",
    type: "number",
    group: "Mouse Effects",
    min: 500,
    max: 2000,
    step: 100,
    defaultValue: 1000,
    showWhen: { tiltEnabled: true },
  },
  tiltScale: {
    key: "tiltScale",
    label: "Hover Scale",
    type: "slider",
    group: "Mouse Effects",
    min: 1,
    max: 1.2,
    step: 0.01,
    defaultValue: 1.05,
    showWhen: { tiltEnabled: true },
  },
  tiltGlare: {
    key: "tiltGlare",
    label: "Enable Glare",
    type: "toggle",
    group: "Mouse Effects",
    defaultValue: false,
    description: "Add light glare effect",
    showWhen: { tiltEnabled: true },
  },
};

// =============================================================================
// SCROLL ANIMATION FIELDS
// =============================================================================

export const SCROLL_ANIMATION_FIELDS: Record<string, FieldDefinition> = {
  scrollAnimation: {
    key: "scrollAnimation",
    label: "Scroll Animation",
    type: "select",
    group: "Scroll Effects",
    options: scrollAnimationFieldOptions,
    defaultValue: "none",
    description: "Animation triggered when scrolling into view",
  },
  scrollAnimationDuration: {
    key: "scrollAnimationDuration",
    label: "Duration (ms)",
    type: "number",
    group: "Scroll Effects",
    min: 100,
    max: 2000,
    step: 100,
    defaultValue: 600,
    showWhen: { scrollAnimation: { $ne: "none" } },
  },
  scrollAnimationDelay: {
    key: "scrollAnimationDelay",
    label: "Delay (ms)",
    type: "number",
    group: "Scroll Effects",
    min: 0,
    max: 1000,
    step: 50,
    defaultValue: 0,
    showWhen: { scrollAnimation: { $ne: "none" } },
  },
  scrollAnimationThreshold: {
    key: "scrollAnimationThreshold",
    label: "Trigger Threshold",
    type: "slider",
    group: "Scroll Effects",
    min: 0,
    max: 1,
    step: 0.1,
    defaultValue: 0.1,
    description: "How much of element must be visible (0-1)",
    showWhen: { scrollAnimation: { $ne: "none" } },
  },
  scrollAnimationOnce: {
    key: "scrollAnimationOnce",
    label: "Animate Once",
    type: "toggle",
    group: "Scroll Effects",
    defaultValue: true,
    description: "Only animate first time element comes into view",
    showWhen: { scrollAnimation: { $ne: "none" } },
  },
};

// =============================================================================
// GLASSMORPHISM FIELDS
// =============================================================================

export const GLASSMORPHISM_FIELDS: Record<string, FieldDefinition> = {
  glassPreset: {
    key: "glassPreset",
    label: "Glass Effect",
    type: "select",
    group: "Glass Effects",
    options: glassPresetFieldOptions,
    defaultValue: "none",
    description: "Frosted glass visual effect",
  },
  glassBlur: {
    key: "glassBlur",
    label: "Blur Amount",
    type: "slider",
    group: "Glass Effects",
    min: 0,
    max: 30,
    step: 1,
    defaultValue: 10,
    description: "Backdrop blur intensity",
    showWhen: { glassPreset: { $ne: "none" } },
  },
  glassOpacity: {
    key: "glassOpacity",
    label: "Background Opacity",
    type: "slider",
    group: "Glass Effects",
    min: 0,
    max: 1,
    step: 0.05,
    defaultValue: 0.2,
    showWhen: { glassPreset: { $ne: "none" } },
  },
  glassTint: {
    key: "glassTint",
    label: "Tint Color",
    type: "color",
    group: "Glass Effects",
    defaultValue: "#ffffff",
    showWhen: { glassPreset: { $ne: "none" } },
  },
  glassBorder: {
    key: "glassBorder",
    label: "Show Border",
    type: "toggle",
    group: "Glass Effects",
    defaultValue: true,
    showWhen: { glassPreset: { $ne: "none" } },
  },
  glassShadow: {
    key: "glassShadow",
    label: "Shadow",
    type: "toggle",
    group: "Glass Effects",
    defaultValue: true,
    showWhen: { glassPreset: { $ne: "none" } },
  },
};

// =============================================================================
// PARALLAX FIELDS
// =============================================================================

export const PARALLAX_FIELDS: Record<string, FieldDefinition> = {
  parallaxEnabled: {
    key: "parallaxEnabled",
    label: "Enable Parallax",
    type: "toggle",
    group: "Parallax",
    defaultValue: false,
    description: "Enable parallax scrolling effect",
  },
  parallaxSpeed: {
    key: "parallaxSpeed",
    label: "Parallax Speed",
    type: "select",
    group: "Parallax",
    options: parallaxSpeedOptions,
    defaultValue: "0.5",
    description: "Speed of parallax movement",
    showWhen: { parallaxEnabled: true },
  },
  parallaxDirection: {
    key: "parallaxDirection",
    label: "Direction",
    type: "select",
    group: "Parallax",
    options: [
      { label: "Vertical", value: "vertical" },
      { label: "Horizontal", value: "horizontal" },
      { label: "Both", value: "both" },
    ],
    defaultValue: "vertical",
    showWhen: { parallaxEnabled: true },
  },
  mouseParallax: {
    key: "mouseParallax",
    label: "Mouse Parallax",
    type: "toggle",
    group: "Parallax",
    defaultValue: false,
    description: "Element moves with mouse position",
  },
  mouseParallaxIntensity: {
    key: "mouseParallaxIntensity",
    label: "Mouse Intensity",
    type: "slider",
    group: "Parallax",
    min: 5,
    max: 50,
    step: 5,
    defaultValue: 20,
    showWhen: { mouseParallax: true },
  },
};

// =============================================================================
// MICRO INTERACTION FIELDS
// =============================================================================

export const MICRO_INTERACTION_FIELDS: Record<string, FieldDefinition> = {
  microInteraction: {
    key: "microInteraction",
    label: "Micro Interaction",
    type: "select",
    group: "Interactions",
    options: microInteractionFieldOptions,
    defaultValue: "none",
    description: "Small interactive animation feedback",
  },
  hoverLift: {
    key: "hoverLift",
    label: "Hover Lift",
    type: "toggle",
    group: "Interactions",
    defaultValue: false,
    description: "Lift element on hover",
  },
  clickRipple: {
    key: "clickRipple",
    label: "Click Ripple",
    type: "toggle",
    group: "Interactions",
    defaultValue: false,
    description: "Material-style ripple on click",
  },
  focusGlow: {
    key: "focusGlow",
    label: "Focus Glow",
    type: "toggle",
    group: "Interactions",
    defaultValue: false,
    description: "Glow effect on focus",
  },
};

// =============================================================================
// PARTICLE EFFECT FIELDS
// =============================================================================

export const PARTICLE_EFFECT_FIELDS: Record<string, FieldDefinition> = {
  particlesEnabled: {
    key: "particlesEnabled",
    label: "Enable Particles",
    type: "toggle",
    group: "Particles",
    defaultValue: false,
    description: "Show animated particle background",
  },
  particleCount: {
    key: "particleCount",
    label: "Particle Count",
    type: "slider",
    group: "Particles",
    min: 10,
    max: 150,
    step: 10,
    defaultValue: 50,
    showWhen: { particlesEnabled: true },
  },
  particleColor: {
    key: "particleColor",
    label: "Particle Color",
    type: "color",
    group: "Particles",
    defaultValue: "#6366f1",
    showWhen: { particlesEnabled: true },
  },
  particleSpeed: {
    key: "particleSpeed",
    label: "Speed",
    type: "slider",
    group: "Particles",
    min: 0.1,
    max: 3,
    step: 0.1,
    defaultValue: 1,
    showWhen: { particlesEnabled: true },
  },
  particleConnected: {
    key: "particleConnected",
    label: "Connected Lines",
    type: "toggle",
    group: "Particles",
    defaultValue: true,
    description: "Draw lines between nearby particles",
    showWhen: { particlesEnabled: true },
  },
};

// =============================================================================
// LOTTIE ANIMATION FIELDS
// =============================================================================

export const LOTTIE_FIELDS: Record<string, FieldDefinition> = {
  lottieUrl: {
    key: "lottieUrl",
    label: "Lottie URL",
    type: "text",
    group: "Lottie Animation",
    defaultValue: "",
    description: "URL to Lottie JSON animation",
  },
  lottieAutoplay: {
    key: "lottieAutoplay",
    label: "Autoplay",
    type: "toggle",
    group: "Lottie Animation",
    defaultValue: true,
    showWhen: { lottieUrl: { $ne: "" } },
  },
  lottieLoop: {
    key: "lottieLoop",
    label: "Loop",
    type: "toggle",
    group: "Lottie Animation",
    defaultValue: true,
    showWhen: { lottieUrl: { $ne: "" } },
  },
  lottieSpeed: {
    key: "lottieSpeed",
    label: "Speed",
    type: "slider",
    group: "Lottie Animation",
    min: 0.25,
    max: 3,
    step: 0.25,
    defaultValue: 1,
    showWhen: { lottieUrl: { $ne: "" } },
  },
  lottieHover: {
    key: "lottieHover",
    label: "Play on Hover",
    type: "toggle",
    group: "Lottie Animation",
    defaultValue: false,
    description: "Only play when hovering",
    showWhen: { lottieUrl: { $ne: "" } },
  },
};

// =============================================================================
// CARD FLIP 3D FIELDS
// =============================================================================

export const CARD_FLIP_FIELDS: Record<string, FieldDefinition> = {
  cardFlipEnabled: {
    key: "cardFlipEnabled",
    label: "Enable Card Flip",
    type: "toggle",
    group: "3D Card",
    defaultValue: false,
    description: "Enable 3D flip effect",
  },
  cardFlipOn: {
    key: "cardFlipOn",
    label: "Flip Trigger",
    type: "select",
    group: "3D Card",
    options: [
      { label: "Hover", value: "hover" },
      { label: "Click", value: "click" },
    ],
    defaultValue: "hover",
    showWhen: { cardFlipEnabled: true },
  },
};

// =============================================================================
// COMBINED ADVANCED EFFECTS FIELDS
// =============================================================================

export const ADVANCED_EFFECT_FIELDS: Record<string, FieldDefinition> = {
  ...TRANSFORM_3D_FIELDS,
  ...TILT_EFFECT_FIELDS,
  ...SCROLL_ANIMATION_FIELDS,
  ...GLASSMORPHISM_FIELDS,
  ...PARALLAX_FIELDS,
  ...MICRO_INTERACTION_FIELDS,
  ...PARTICLE_EFFECT_FIELDS,
  ...LOTTIE_FIELDS,
  ...CARD_FLIP_FIELDS,
};

// =============================================================================
// EFFECT GROUPS
// =============================================================================

export const EFFECT_GROUPS = [
  { id: "3d-effects", name: "3D Effects", icon: "cube" },
  { id: "mouse-effects", name: "Mouse Effects", icon: "mouse-pointer" },
  { id: "scroll-effects", name: "Scroll Effects", icon: "scroll" },
  { id: "glass-effects", name: "Glass Effects", icon: "sparkles" },
  { id: "parallax", name: "Parallax", icon: "layers" },
  { id: "interactions", name: "Interactions", icon: "zap" },
  { id: "particles", name: "Particles", icon: "stars" },
  { id: "lottie", name: "Lottie Animation", icon: "play-circle" },
  { id: "3d-card", name: "3D Card", icon: "credit-card" },
] as const;
