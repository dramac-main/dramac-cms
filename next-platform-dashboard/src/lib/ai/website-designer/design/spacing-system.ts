/**
 * PHASE AWD-05: Design System & Brand Intelligence
 * Spacing System Module
 *
 * Handles spacing scale generation, border radius, and shadow systems.
 */

import type {
  SpacingScale,
  BorderRadiusScale,
  ShadowScale,
  DesignPreferences,
  DesignMood,
} from "./types";

// =============================================================================
// SPACING SCALE
// =============================================================================

/**
 * Default Tailwind-compatible spacing scale
 */
export const DEFAULT_SPACING_SCALE: SpacingScale = {
  0: "0px",
  px: "1px",
  0.5: "0.125rem",
  1: "0.25rem",
  1.5: "0.375rem",
  2: "0.5rem",
  2.5: "0.625rem",
  3: "0.75rem",
  3.5: "0.875rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  7: "1.75rem",
  8: "2rem",
  9: "2.25rem",
  10: "2.5rem",
  11: "2.75rem",
  12: "3rem",
  14: "3.5rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
  28: "7rem",
  32: "8rem",
  36: "9rem",
  40: "10rem",
  44: "11rem",
  48: "12rem",
  52: "13rem",
  56: "14rem",
  60: "15rem",
  64: "16rem",
  72: "18rem",
  80: "20rem",
  96: "24rem",
};

/**
 * Generate a custom spacing scale with a different base unit
 */
export function generateSpacingScale(baseUnit: number = 4): SpacingScale {
  const rem = (px: number) => `${px / 16}rem`;

  return {
    0: "0px",
    px: "1px",
    0.5: rem(baseUnit * 0.5),
    1: rem(baseUnit),
    1.5: rem(baseUnit * 1.5),
    2: rem(baseUnit * 2),
    2.5: rem(baseUnit * 2.5),
    3: rem(baseUnit * 3),
    3.5: rem(baseUnit * 3.5),
    4: rem(baseUnit * 4),
    5: rem(baseUnit * 5),
    6: rem(baseUnit * 6),
    7: rem(baseUnit * 7),
    8: rem(baseUnit * 8),
    9: rem(baseUnit * 9),
    10: rem(baseUnit * 10),
    11: rem(baseUnit * 11),
    12: rem(baseUnit * 12),
    14: rem(baseUnit * 14),
    16: rem(baseUnit * 16),
    20: rem(baseUnit * 20),
    24: rem(baseUnit * 24),
    28: rem(baseUnit * 28),
    32: rem(baseUnit * 32),
    36: rem(baseUnit * 36),
    40: rem(baseUnit * 40),
    44: rem(baseUnit * 44),
    48: rem(baseUnit * 48),
    52: rem(baseUnit * 52),
    56: rem(baseUnit * 56),
    60: rem(baseUnit * 60),
    64: rem(baseUnit * 64),
    72: rem(baseUnit * 72),
    80: rem(baseUnit * 80),
    96: rem(baseUnit * 96),
  };
}

// =============================================================================
// BORDER RADIUS
// =============================================================================

/**
 * Border radius presets by corner style
 */
export const BORDER_RADIUS_PRESETS: Record<
  DesignPreferences["cornerStyle"],
  BorderRadiusScale
> = {
  sharp: {
    none: "0px",
    sm: "0px",
    DEFAULT: "0px",
    md: "0px",
    lg: "2px",
    xl: "4px",
    "2xl": "6px",
    "3xl": "8px",
    full: "9999px",
  },
  soft: {
    none: "0px",
    sm: "0.125rem",
    DEFAULT: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
    "2xl": "1rem",
    "3xl": "1.5rem",
    full: "9999px",
  },
  rounded: {
    none: "0px",
    sm: "0.25rem",
    DEFAULT: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.5rem",
    "2xl": "2rem",
    "3xl": "3rem",
    full: "9999px",
  },
  pill: {
    none: "0px",
    sm: "0.5rem",
    DEFAULT: "1rem",
    md: "1.5rem",
    lg: "2rem",
    xl: "3rem",
    "2xl": "4rem",
    "3xl": "6rem",
    full: "9999px",
  },
};

/**
 * Get border radius scale for a corner style
 */
export function getBorderRadiusScale(
  style: DesignPreferences["cornerStyle"]
): BorderRadiusScale {
  return BORDER_RADIUS_PRESETS[style] || BORDER_RADIUS_PRESETS.soft;
}

/**
 * Recommended corner styles by mood
 */
export const MOOD_CORNER_STYLES: Record<
  DesignMood,
  DesignPreferences["cornerStyle"]
> = {
  professional: "soft",
  playful: "rounded",
  elegant: "soft",
  bold: "sharp",
  minimal: "sharp",
  tech: "soft",
  organic: "rounded",
  luxurious: "soft",
  friendly: "rounded",
  corporate: "soft",
};

// =============================================================================
// SHADOWS
// =============================================================================

/**
 * Shadow presets by intensity
 */
export const SHADOW_PRESETS: Record<
  DesignPreferences["shadowIntensity"],
  ShadowScale
> = {
  none: {
    sm: "none",
    DEFAULT: "none",
    md: "none",
    lg: "none",
    xl: "none",
    "2xl": "none",
    inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
    none: "none",
  },
  subtle: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.03)",
    DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05)",
    "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.15)",
    inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.03)",
    none: "none",
  },
  medium: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
    none: "none",
  },
  strong: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.1)",
    DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.15), 0 1px 2px -1px rgb(0 0 0 / 0.15)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.15), 0 2px 4px -2px rgb(0 0 0 / 0.15)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.15), 0 4px 6px -4px rgb(0 0 0 / 0.15)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.15), 0 8px 10px -6px rgb(0 0 0 / 0.15)",
    "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.35)",
    inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.1)",
    none: "none",
  },
};

/**
 * Get shadow scale for an intensity level
 */
export function getShadowScale(
  intensity: DesignPreferences["shadowIntensity"]
): ShadowScale {
  return SHADOW_PRESETS[intensity] || SHADOW_PRESETS.medium;
}

/**
 * Recommended shadow intensities by mood
 */
export const MOOD_SHADOW_INTENSITY: Record<
  DesignMood,
  DesignPreferences["shadowIntensity"]
> = {
  professional: "medium",
  playful: "medium",
  elegant: "subtle",
  bold: "strong",
  minimal: "subtle",
  tech: "medium",
  organic: "subtle",
  luxurious: "subtle",
  friendly: "medium",
  corporate: "medium",
};

// =============================================================================
// COLOR ACCENT SHADOWS
// =============================================================================

/**
 * Generate colored shadow (e.g., for buttons/cards with brand color glow)
 */
export function generateColoredShadow(
  color: string,
  intensity: "subtle" | "medium" | "strong" = "medium"
): string {
  const opacityMap = {
    subtle: 0.15,
    medium: 0.25,
    strong: 0.35,
  };

  const opacity = opacityMap[intensity];

  // Extract RGB from hex
  const hex = color.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `0 10px 40px -10px rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// =============================================================================
// DESIGN PREFERENCES
// =============================================================================

/**
 * Get design preferences for a mood
 */
export function getDesignPreferencesForMood(mood: DesignMood): DesignPreferences {
  const contrastMap: Record<DesignMood, DesignPreferences["colorContrast"]> = {
    professional: "medium",
    playful: "high",
    elegant: "low",
    bold: "high",
    minimal: "low",
    tech: "medium",
    organic: "medium",
    luxurious: "low",
    friendly: "medium",
    corporate: "medium",
  };

  const animationMap: Record<DesignMood, DesignPreferences["animationLevel"]> = {
    professional: "subtle",
    playful: "dynamic",
    elegant: "subtle",
    bold: "moderate",
    minimal: "none",
    tech: "moderate",
    organic: "subtle",
    luxurious: "subtle",
    friendly: "moderate",
    corporate: "subtle",
  };

  return {
    mood,
    cornerStyle: MOOD_CORNER_STYLES[mood],
    shadowIntensity: MOOD_SHADOW_INTENSITY[mood],
    colorContrast: contrastMap[mood],
    animationLevel: animationMap[mood],
  };
}

// =============================================================================
// TRANSITION PRESETS
// =============================================================================

/**
 * Animation/transition presets by animation level
 */
export const TRANSITION_PRESETS: Record<
  DesignPreferences["animationLevel"],
  {
    fast: string;
    normal: string;
    slow: string;
    easing: string;
  }
> = {
  none: {
    fast: "0ms",
    normal: "0ms",
    slow: "0ms",
    easing: "linear",
  },
  subtle: {
    fast: "100ms",
    normal: "150ms",
    slow: "200ms",
    easing: "ease-out",
  },
  moderate: {
    fast: "150ms",
    normal: "200ms",
    slow: "300ms",
    easing: "ease-in-out",
  },
  dynamic: {
    fast: "200ms",
    normal: "300ms",
    slow: "500ms",
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
};

/**
 * Get transition duration preset
 */
export function getTransitionPreset(
  level: DesignPreferences["animationLevel"]
): (typeof TRANSITION_PRESETS)[DesignPreferences["animationLevel"]] {
  return TRANSITION_PRESETS[level] || TRANSITION_PRESETS.subtle;
}
