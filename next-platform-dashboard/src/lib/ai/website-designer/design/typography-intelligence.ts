/**
 * PHASE AWD-05: Design System & Brand Intelligence
 * Typography Intelligence Module
 *
 * Handles font pairing, type scale generation, and typography recommendations.
 */

import type {
  FontCategory,
  FontDefinition,
  FontPairing,
  TypeScale,
  TypeScaleStep,
  TypeScaleRatio,
  DesignMood,
  FontWeight,
} from "./types";

// =============================================================================
// TYPE SCALE RATIOS
// =============================================================================

/**
 * Type scale ratio values
 */
export const TYPE_SCALE_RATIOS: Record<TypeScaleRatio, number> = {
  "minor-second": 1.067,
  "major-second": 1.125,
  "minor-third": 1.2,
  "major-third": 1.25,
  "perfect-fourth": 1.333,
  "augmented-fourth": 1.414,
  "perfect-fifth": 1.5,
  "golden-ratio": 1.618,
};

/**
 * Get ratio value from name
 */
export function getRatioValue(ratio: TypeScaleRatio): number {
  return TYPE_SCALE_RATIOS[ratio];
}

/**
 * Recommended ratios for different contexts
 */
export const RECOMMENDED_RATIOS: Record<DesignMood, TypeScaleRatio> = {
  professional: "major-second",
  playful: "perfect-fourth",
  elegant: "minor-third",
  bold: "perfect-fourth",
  minimal: "major-second",
  tech: "minor-third",
  organic: "minor-third",
  luxurious: "minor-third",
  friendly: "major-second",
  corporate: "major-second",
};

// =============================================================================
// FONT DEFINITIONS
// =============================================================================

/**
 * Curated font library
 */
export const FONT_LIBRARY: Record<string, FontDefinition> = {
  // Sans-serif fonts
  inter: {
    family: "Inter",
    category: "sans-serif",
    weights: [400, 500, 600, 700],
    fallback: "system-ui, sans-serif",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
    variable: "--font-inter",
  },
  poppins: {
    family: "Poppins",
    category: "sans-serif",
    weights: [400, 500, 600, 700],
    fallback: "system-ui, sans-serif",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap",
    variable: "--font-poppins",
  },
  dmSans: {
    family: "DM Sans",
    category: "sans-serif",
    weights: [400, 500, 600, 700],
    fallback: "system-ui, sans-serif",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap",
    variable: "--font-dm-sans",
  },
  manrope: {
    family: "Manrope",
    category: "sans-serif",
    weights: [400, 500, 600, 700, 800],
    fallback: "system-ui, sans-serif",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap",
    variable: "--font-manrope",
  },
  spaceGrotesk: {
    family: "Space Grotesk",
    category: "sans-serif",
    weights: [400, 500, 600, 700],
    fallback: "system-ui, sans-serif",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap",
    variable: "--font-space-grotesk",
  },

  // Serif fonts
  playfairDisplay: {
    family: "Playfair Display",
    category: "serif",
    weights: [400, 500, 600, 700],
    fallback: "Georgia, serif",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap",
    variable: "--font-playfair",
  },
  lora: {
    family: "Lora",
    category: "serif",
    weights: [400, 500, 600, 700],
    fallback: "Georgia, serif",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap",
    variable: "--font-lora",
  },
  sourceSerif: {
    family: "Source Serif 4",
    category: "serif",
    weights: [400, 500, 600, 700],
    fallback: "Georgia, serif",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;500;600;700&display=swap",
    variable: "--font-source-serif",
  },
  fraunces: {
    family: "Fraunces",
    category: "serif",
    weights: [400, 500, 600, 700],
    fallback: "Georgia, serif",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600;700&display=swap",
    variable: "--font-fraunces",
  },

  // Display fonts
  syne: {
    family: "Syne",
    category: "display",
    weights: [400, 500, 600, 700, 800],
    fallback: "system-ui, sans-serif",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&display=swap",
    variable: "--font-syne",
  },
  outfit: {
    family: "Outfit",
    category: "display",
    weights: [400, 500, 600, 700, 800],
    fallback: "system-ui, sans-serif",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap",
    variable: "--font-outfit",
  },

  // Monospace fonts
  jetbrainsMono: {
    family: "JetBrains Mono",
    category: "monospace",
    weights: [400, 500, 600, 700],
    fallback: "monospace",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap",
    variable: "--font-jetbrains",
  },
  firaCode: {
    family: "Fira Code",
    category: "monospace",
    weights: [400, 500, 600, 700],
    fallback: "monospace",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&display=swap",
    variable: "--font-fira-code",
  },
};

// =============================================================================
// FONT PAIRINGS
// =============================================================================

/**
 * Curated font pairings
 */
export const FONT_PAIRINGS: Record<string, FontPairing> = {
  // Modern & Clean
  interSystem: {
    heading: FONT_LIBRARY.inter,
    body: FONT_LIBRARY.inter,
    code: FONT_LIBRARY.jetbrainsMono,
  },

  // Professional
  poppinsInter: {
    heading: FONT_LIBRARY.poppins,
    body: FONT_LIBRARY.inter,
    code: FONT_LIBRARY.jetbrainsMono,
  },

  // Elegant
  playfairDmSans: {
    heading: FONT_LIBRARY.playfairDisplay,
    body: FONT_LIBRARY.dmSans,
    code: FONT_LIBRARY.firaCode,
  },

  // Bold & Modern
  spaceGrotesk: {
    heading: FONT_LIBRARY.spaceGrotesk,
    body: FONT_LIBRARY.inter,
    code: FONT_LIBRARY.jetbrainsMono,
  },

  // Tech & Startup
  manropeMono: {
    heading: FONT_LIBRARY.manrope,
    body: FONT_LIBRARY.inter,
    code: FONT_LIBRARY.firaCode,
  },

  // Creative
  syneInter: {
    heading: FONT_LIBRARY.syne,
    body: FONT_LIBRARY.inter,
    code: FONT_LIBRARY.jetbrainsMono,
  },

  // Editorial
  frauncesLora: {
    heading: FONT_LIBRARY.fraunces,
    body: FONT_LIBRARY.lora,
    code: FONT_LIBRARY.firaCode,
  },

  // Versatile
  outfitDmSans: {
    heading: FONT_LIBRARY.outfit,
    body: FONT_LIBRARY.dmSans,
    code: FONT_LIBRARY.jetbrainsMono,
  },
};

/**
 * Get font pairing for a design mood
 */
export function getFontPairingForMood(mood: DesignMood): FontPairing {
  const moodPairings: Record<DesignMood, keyof typeof FONT_PAIRINGS> = {
    professional: "poppinsInter",
    playful: "outfitDmSans",
    elegant: "playfairDmSans",
    bold: "spaceGrotesk",
    minimal: "interSystem",
    tech: "manropeMono",
    organic: "frauncesLora",
    luxurious: "playfairDmSans",
    friendly: "poppinsInter",
    corporate: "interSystem",
  };

  const pairingKey = moodPairings[mood] || "interSystem";
  return FONT_PAIRINGS[pairingKey];
}

/**
 * Get font pairing by heading and body categories
 */
export function getFontPairingByCategory(
  headingCategory: FontCategory,
  bodyCategory: FontCategory
): FontPairing {
  // Find fonts matching categories
  const headingFont = Object.values(FONT_LIBRARY).find(
    (f) => f.category === headingCategory
  ) || FONT_LIBRARY.inter;

  const bodyFont = Object.values(FONT_LIBRARY).find(
    (f) => f.category === bodyCategory
  ) || FONT_LIBRARY.inter;

  return {
    heading: headingFont,
    body: bodyFont,
    code: FONT_LIBRARY.jetbrainsMono,
  };
}

// =============================================================================
// TYPE SCALE GENERATION
// =============================================================================

/**
 * Generate a complete type scale
 */
export function generateTypeScale(
  baseSize: number = 16,
  ratio: TypeScaleRatio = "minor-third"
): TypeScale {
  const ratioValue = getRatioValue(ratio);

  const generateStep = (
    multiplier: number,
    weight: FontWeight = 400
  ): TypeScaleStep => {
    const size = baseSize * Math.pow(ratioValue, multiplier);
    const lineHeight = multiplier >= 3 ? 1.1 : multiplier >= 1 ? 1.3 : 1.5;
    const letterSpacing = multiplier >= 3 ? "-0.02em" : multiplier >= 1 ? "-0.01em" : "0";

    return {
      size: `${(size / 16).toFixed(3)}rem`,
      lineHeight: lineHeight.toString(),
      letterSpacing,
      fontWeight: weight,
    };
  };

  return {
    xs: generateStep(-2),
    sm: generateStep(-1),
    base: generateStep(0),
    lg: generateStep(1),
    xl: generateStep(2),
    "2xl": generateStep(3, 600),
    "3xl": generateStep(4, 600),
    "4xl": generateStep(5, 700),
    "5xl": generateStep(6, 700),
    "6xl": generateStep(7, 700),
    "7xl": generateStep(8, 800),
    "8xl": generateStep(9, 800),
    "9xl": generateStep(10, 900),
  };
}

/**
 * Get line height recommendation based on font size
 */
export function getLineHeight(fontSize: number): number {
  if (fontSize >= 48) return 1.1;
  if (fontSize >= 32) return 1.2;
  if (fontSize >= 24) return 1.3;
  if (fontSize >= 18) return 1.4;
  return 1.5;
}

/**
 * Get letter spacing recommendation based on font size
 */
export function getLetterSpacing(fontSize: number): string {
  if (fontSize >= 48) return "-0.03em";
  if (fontSize >= 32) return "-0.02em";
  if (fontSize >= 24) return "-0.01em";
  return "0";
}

// =============================================================================
// INDUSTRY TYPOGRAPHY
// =============================================================================

/**
 * Typography recommendations by industry
 */
export const INDUSTRY_TYPOGRAPHY: Record<string, keyof typeof FONT_PAIRINGS> = {
  restaurant: "frauncesLora",
  "law-firm": "playfairDmSans",
  healthcare: "poppinsInter",
  saas: "manropeMono",
  ecommerce: "interSystem",
  portfolio: "spaceGrotesk",
  "real-estate": "playfairDmSans",
  construction: "outfitDmSans",
  education: "poppinsInter",
  nonprofit: "poppinsInter",
};

/**
 * Get typography recommendation for an industry
 */
export function getTypographyForIndustry(industry: string): {
  pairing: FontPairing;
  scale: TypeScale;
  scaleRatio: TypeScaleRatio;
} {
  const pairingKey = INDUSTRY_TYPOGRAPHY[industry] || "interSystem";
  const pairing = FONT_PAIRINGS[pairingKey];

  // Industry-specific scale ratios
  const industryRatios: Record<string, TypeScaleRatio> = {
    "law-firm": "major-second",
    healthcare: "major-second",
    saas: "minor-third",
    portfolio: "perfect-fourth",
    restaurant: "minor-third",
    "real-estate": "minor-third",
  };

  const scaleRatio: TypeScaleRatio = industryRatios[industry] || "minor-third";
  const scale = generateTypeScale(16, scaleRatio);

  return { pairing, scale, scaleRatio };
}

// =============================================================================
// GOOGLE FONTS HELPER
// =============================================================================

/**
 * Generate Google Fonts URL for a font pairing
 */
export function generateGoogleFontsUrl(pairing: FontPairing): string {
  const fonts = [pairing.heading, pairing.body];
  if (pairing.accent) fonts.push(pairing.accent);
  if (pairing.code) fonts.push(pairing.code);

  // Remove duplicates
  const uniqueFonts = fonts.filter(
    (font, index, self) =>
      self.findIndex((f) => f.family === font.family) === index
  );

  const familyParams = uniqueFonts.map((font) => {
    const family = font.family.replace(/\s+/g, "+");
    const weights = font.weights.join(";");
    return `family=${family}:wght@${weights}`;
  });

  return `https://fonts.googleapis.com/css2?${familyParams.join("&")}&display=swap`;
}

/**
 * Generate font-face CSS for a font pairing
 */
export function generateFontFaceCSS(pairing: FontPairing): string {
  const url = generateGoogleFontsUrl(pairing);
  return `@import url('${url}');`;
}
