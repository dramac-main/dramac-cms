/**
 * DESIGN VARIETY ENGINE
 * 
 * Ensures every website the AI creates looks UNIQUE and different.
 * Eliminates the "every website looks the same" problem.
 * 
 * STRATEGIES:
 * 1. Layout variety — different section arrangements per industry
 * 2. Hero variety — 8 distinct hero styles randomized
 * 3. Component variant randomization — cards, minimal, centered, etc.
 * 4. Color palette rotation — never the same palette twice
 * 5. Typography pairing variety — different font combos
 * 6. Section background alternation — visual rhythm
 * 7. Animation variety — different entrance animations
 * 8. Spacing personality — tight/standard/spacious
 */

import { getRandomPalette, type CuratedPalette } from "../config/color-intelligence";

// =============================================================================
// TYPES
// =============================================================================

export interface DesignPersonality {
  id: string;
  name: string;
  
  /** Layout density */
  density: "tight" | "standard" | "spacious" | "editorial";
  
  /** Hero style to use */
  heroStyle: HeroStyle;
  
  /** Card style preference */
  cardStyle: CardStyle;
  
  /** Background alternation pattern */
  backgroundPattern: BackgroundPattern;
  
  /** Animation preference */
  animationStyle: AnimationStyle;
  
  /** Border radius preference */
  borderRadius: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  
  /** Shadow preference */
  shadowStyle: "none" | "subtle" | "medium" | "dramatic";
  
  /** Typography scale */
  typographyScale: "compact" | "standard" | "large" | "hero";
  
  /** Section divider style */
  sectionDivider: "none" | "line" | "gradient" | "wave" | "angle";
  
  /** Color palette to apply */
  palette?: CuratedPalette;
}

export type HeroStyle = 
  | "centered-overlay"        // Classic centered text over image
  | "split-image-right"       // Text left, image right
  | "split-image-left"        // Image left, text right  
  | "gradient-bold"           // Bold gradient background, no image
  | "minimal-text"            // Clean minimal with lots of whitespace
  | "video-background"        // Video/animated background
  | "asymmetric"              // Off-center layout
  | "stacked-with-badges";    // Badges + stacked content

export type CardStyle = 
  | "bordered"        // Clean border, no shadow
  | "elevated"        // Shadow, no border
  | "flat"            // No border, no shadow, background difference
  | "glass"           // Glassmorphism effect
  | "outlined"        // Strong border, rounded
  | "minimal";        // Barely there — just content

export type BackgroundPattern = 
  | "uniform"         // Same background throughout
  | "alternating"     // White → Gray → White → Gray
  | "gradient-shift"  // Subtle gradient shifts between sections
  | "accent-band"     // One section uses primary color as background
  | "dark-middle"     // Light → Dark → Light sandwich
  | "all-dark"        // Full dark mode
  | "all-light";      // Full light mode

export type AnimationStyle = 
  | "none"            // No animations (clean, fast)
  | "subtle"          // Gentle fade-in only
  | "scroll-reveal"   // Fade + slide on scroll
  | "staggered"       // Staggered entrance per element
  | "playful";        // Bouncy, spring animations

// =============================================================================
// PERSONALITY PRESETS
// =============================================================================

const PERSONALITIES: DesignPersonality[] = [
  {
    id: "modern-clean",
    name: "Modern Clean",
    density: "standard",
    heroStyle: "centered-overlay",
    cardStyle: "elevated",
    backgroundPattern: "alternating",
    animationStyle: "scroll-reveal",
    borderRadius: "lg",
    shadowStyle: "subtle",
    typographyScale: "standard",
    sectionDivider: "none",
  },
  {
    id: "bold-editorial",
    name: "Bold Editorial",
    density: "editorial",
    heroStyle: "gradient-bold",
    cardStyle: "flat",
    backgroundPattern: "accent-band",
    animationStyle: "staggered",
    borderRadius: "none",
    shadowStyle: "none",
    typographyScale: "hero",
    sectionDivider: "line",
  },
  {
    id: "soft-elegant",
    name: "Soft & Elegant",
    density: "spacious",
    heroStyle: "split-image-right",
    cardStyle: "bordered",
    backgroundPattern: "gradient-shift",
    animationStyle: "subtle",
    borderRadius: "xl",
    shadowStyle: "subtle",
    typographyScale: "large",
    sectionDivider: "none",
  },
  {
    id: "minimal-stark",
    name: "Minimal Stark",
    density: "spacious",
    heroStyle: "minimal-text",
    cardStyle: "minimal",
    backgroundPattern: "uniform",
    animationStyle: "none",
    borderRadius: "sm",
    shadowStyle: "none",
    typographyScale: "compact",
    sectionDivider: "gradient",
  },
  {
    id: "dark-immersive",
    name: "Dark Immersive",
    density: "standard",
    heroStyle: "centered-overlay",
    cardStyle: "glass",
    backgroundPattern: "all-dark",
    animationStyle: "scroll-reveal",
    borderRadius: "lg",
    shadowStyle: "dramatic",
    typographyScale: "large",
    sectionDivider: "gradient",
  },
  {
    id: "split-dynamic",
    name: "Split Dynamic",
    density: "standard",
    heroStyle: "split-image-left",
    cardStyle: "outlined",
    backgroundPattern: "dark-middle",
    animationStyle: "staggered",
    borderRadius: "md",
    shadowStyle: "medium",
    typographyScale: "standard",
    sectionDivider: "angle",
  },
  {
    id: "playful-rounded",
    name: "Playful & Rounded",
    density: "standard",
    heroStyle: "stacked-with-badges",
    cardStyle: "elevated",
    backgroundPattern: "alternating",
    animationStyle: "playful",
    borderRadius: "2xl",
    shadowStyle: "medium",
    typographyScale: "standard",
    sectionDivider: "wave",
  },
  {
    id: "asymmetric-creative",
    name: "Asymmetric Creative",
    density: "editorial",
    heroStyle: "asymmetric",
    cardStyle: "flat",
    backgroundPattern: "accent-band",
    animationStyle: "staggered",
    borderRadius: "lg",
    shadowStyle: "subtle",
    typographyScale: "hero",
    sectionDivider: "none",
  },
];

// =============================================================================
// INDUSTRY → PERSONALITY PREFERENCES
// =============================================================================

/** Industries and which personalities suit them (weighted) */
const INDUSTRY_PERSONALITY_MAP: Record<string, string[]> = {
  // Each industry can use these personality IDs (first = most suitable, rest = alternatives)
  "restaurant": ["soft-elegant", "dark-immersive", "bold-editorial", "modern-clean"],
  "cafe": ["soft-elegant", "playful-rounded", "modern-clean", "minimal-stark"],
  "bar": ["dark-immersive", "bold-editorial", "asymmetric-creative"],
  "barbershop": ["dark-immersive", "bold-editorial", "minimal-stark", "modern-clean"],
  "salon": ["soft-elegant", "modern-clean", "playful-rounded"],
  "spa": ["soft-elegant", "minimal-stark", "modern-clean"],
  "fitness": ["bold-editorial", "dark-immersive", "split-dynamic"],
  "gym": ["dark-immersive", "bold-editorial", "split-dynamic"],
  "law-firm": ["minimal-stark", "modern-clean", "soft-elegant"],
  "consulting": ["modern-clean", "minimal-stark", "split-dynamic"],
  "healthcare": ["modern-clean", "soft-elegant", "minimal-stark"],
  "dental": ["modern-clean", "playful-rounded", "soft-elegant"],
  "veterinary": ["playful-rounded", "modern-clean", "soft-elegant"],
  "real-estate": ["modern-clean", "split-dynamic", "soft-elegant", "dark-immersive"],
  "portfolio": ["asymmetric-creative", "dark-immersive", "minimal-stark", "bold-editorial"],
  "photography": ["dark-immersive", "minimal-stark", "asymmetric-creative"],
  "ecommerce": ["modern-clean", "split-dynamic", "playful-rounded", "bold-editorial"],
  "saas": ["modern-clean", "minimal-stark", "dark-immersive", "bold-editorial"],
  "startup": ["bold-editorial", "modern-clean", "asymmetric-creative"],
  "construction": ["bold-editorial", "split-dynamic", "modern-clean"],
  "education": ["modern-clean", "playful-rounded", "soft-elegant"],
  "hotel": ["soft-elegant", "dark-immersive", "modern-clean"],
  "travel": ["split-dynamic", "soft-elegant", "playful-rounded"],
  "church": ["soft-elegant", "modern-clean", "playful-rounded"],
  "non-profit": ["modern-clean", "soft-elegant", "playful-rounded"],
};

// =============================================================================
// SECTION VARIANT RANDOMIZATION
// =============================================================================

/** Available variants per component type */
const COMPONENT_VARIANTS: Record<string, string[]> = {
  "Hero": ["centered", "split", "minimal", "full-width"],
  "Features": ["cards", "minimal", "centered", "icons-left", "icons-top", "bento"],
  "Testimonials": ["cards", "carousel", "minimal", "large-quote"],
  "Team": ["cards", "grid", "minimal"],
  "FAQ": ["accordion", "two-column", "cards"],
  "Pricing": ["cards", "compact", "comparison"],
  "Gallery": ["grid", "masonry", "carousel"],
  "CTA": ["centered", "split", "banner"],
  "Stats": ["simple", "cards", "centered", "icon-grid"],
  "ContactForm": ["simple", "split", "card"],
};

// =============================================================================
// MAIN API
// =============================================================================

/**
 * Get a unique design personality for a website.
 * Ensures variety by randomly selecting from industry-appropriate personalities.
 */
export function getDesignPersonality(industry: string): DesignPersonality {
  const term = industry.toLowerCase().trim();
  
  // Find matching personality IDs
  let personalityIds: string[] = [];
  for (const [key, ids] of Object.entries(INDUSTRY_PERSONALITY_MAP)) {
    if (term.includes(key) || key.includes(term)) {
      personalityIds = ids;
      break;
    }
  }
  
  // Fallback to general personalities
  if (personalityIds.length === 0) {
    personalityIds = ["modern-clean", "minimal-stark", "split-dynamic", "soft-elegant"];
  }
  
  // Randomly select one (for variety!)
  const selectedId = personalityIds[Math.floor(Math.random() * personalityIds.length)];
  const personality = PERSONALITIES.find(p => p.id === selectedId) || PERSONALITIES[0];
  
  // Attach a random palette for this industry
  const paletteCopy = { ...personality };
  paletteCopy.palette = getRandomPalette(industry);
  
  return paletteCopy;
}

/**
 * Get randomized component variants for variety.
 * Ensures different card sections don't all look the same.
 */
export function getVariantForComponent(
  componentType: string, 
  usedVariants: Set<string> = new Set()
): string {
  const variants = COMPONENT_VARIANTS[componentType] || ["default"];
  
  // Filter out already-used variants to encourage variety
  const available = variants.filter(v => !usedVariants.has(`${componentType}:${v}`));
  const pool = available.length > 0 ? available : variants;
  
  const selected = pool[Math.floor(Math.random() * pool.length)];
  usedVariants.add(`${componentType}:${selected}`);
  
  return selected;
}

/**
 * Get section background colors for visual rhythm.
 * Alternates backgrounds based on the personality's pattern.
 */
export function getSectionBackgrounds(
  personality: DesignPersonality,
  sectionCount: number
): string[] {
  const palette = personality.palette?.colors;
  const bg = palette?.background || "#ffffff";
  const surface = palette?.surface || "#f8fafc";
  const primary = palette?.primary || "#3b82f6";
  const isDark = personality.backgroundPattern === "all-dark";

  switch (personality.backgroundPattern) {
    case "alternating":
      return Array.from({ length: sectionCount }, (_, i) => i % 2 === 0 ? bg : surface);
    
    case "gradient-shift":
      return Array.from({ length: sectionCount }, (_, i) => {
        if (i === 0) return bg;
        if (i === sectionCount - 1) return bg;
        return i % 2 === 0 ? bg : surface;
      });
    
    case "accent-band":
      // One section in the middle uses the primary/accent color
      const mid = Math.floor(sectionCount / 2);
      return Array.from({ length: sectionCount }, (_, i) => {
        if (i === mid) return primary;
        return i % 2 === 0 ? bg : surface;
      });
    
    case "dark-middle":
      const darkStart = Math.floor(sectionCount * 0.33);
      const darkEnd = Math.floor(sectionCount * 0.66);
      return Array.from({ length: sectionCount }, (_, i) => {
        if (i >= darkStart && i <= darkEnd) return isDark ? surface : "#111827";
        return bg;
      });
    
    case "all-dark":
      return Array.from({ length: sectionCount }, (_, i) => 
        i % 2 === 0 ? (palette?.background || "#0d0d0d") : (palette?.surface || "#1a1a1a")
      );
    
    case "all-light":
      return Array.from({ length: sectionCount }, (_, i) => 
        i % 2 === 0 ? "#ffffff" : "#f8fafc"
      );
    
    default: // uniform
      return Array.from({ length: sectionCount }, () => bg);
  }
}

/**
 * Format the design personality as AI prompt context.
 * This tells the AI model exactly how to make this website look unique.
 */
export function formatPersonalityForAI(personality: DesignPersonality): string {
  const lines: string[] = [
    `\n## 🎨 DESIGN PERSONALITY: ${personality.name.toUpperCase()}`,
    ``,
    `**Layout Density**: ${personality.density} — ${getDensityDescription(personality.density)}`,
    `**Hero Style**: ${personality.heroStyle} — ${getHeroDescription(personality.heroStyle)}`,
    `**Card Style**: ${personality.cardStyle} — ${getCardDescription(personality.cardStyle)}`,
    `**Background Pattern**: ${personality.backgroundPattern} — ${getBgDescription(personality.backgroundPattern)}`,
    `**Animations**: ${personality.animationStyle} — ${getAnimDescription(personality.animationStyle)}`,
    `**Border Radius**: ${personality.borderRadius}`,
    `**Shadow Style**: ${personality.shadowStyle}`,
    `**Typography Scale**: ${personality.typographyScale}`,
    ``,
    `IMPORTANT: Follow this design personality EXACTLY. This is what makes each website UNIQUE.`,
    `DO NOT default to a generic "cards" variant for everything.`,
    `Mix component variants: use "${getVariantForComponent("Features")}" for features, ` +
      `"${getVariantForComponent("Testimonials")}" for testimonials, ` +
      `"${getVariantForComponent("FAQ")}" for FAQ.`,
  ];

  if (personality.palette) {
    const p = personality.palette.colors;
    lines.push(
      ``,
      `**Color Palette**: ${personality.palette.name}`,
      `- Primary: ${p.primary}`,
      `- Background: ${p.background}`,
      `- Surface: ${p.surface}`,
      `- Text: ${p.text}`,
      `- Secondary Text: ${p.textSecondary}`,
      `- Accent: ${personality.palette.colors.accent || p.primary}`,
    );
  }

  return lines.join("\n");
}

// =============================================================================
// DESCRIPTION HELPERS
// =============================================================================

function getDensityDescription(d: string): string {
  const map: Record<string, string> = {
    "tight": "Compact spacing, content-dense. Good for data-heavy sites.",
    "standard": "Balanced spacing. Professional and clean.",
    "spacious": "Generous whitespace. Premium, luxurious feel.",
    "editorial": "Magazine-like layout with dramatic spacing between sections.",
  };
  return map[d] || "Standard spacing.";
}

function getHeroDescription(h: string): string {
  const map: Record<string, string> = {
    "centered-overlay": "Classic: centered text over a full-width background image with dark overlay.",
    "split-image-right": "Modern: text content on the left, large image on the right. 50/50 split.",
    "split-image-left": "Reverse split: large image on the left, text on the right.",
    "gradient-bold": "No image needed. Bold gradient background with large typography.",
    "minimal-text": "Clean and minimal. Large white/dark space with crisp typography. No image.",
    "video-background": "Full video or animated background with text overlay.",
    "asymmetric": "Off-center layout with overlapping elements. Creative and unique.",
    "stacked-with-badges": "Trust badges above headline. Stacked CTAs below. Social proof focused.",
  };
  return map[h] || "Standard hero layout.";
}

function getCardDescription(c: string): string {
  const map: Record<string, string> = {
    "bordered": "Clean border, no shadow. Modern and structured.",
    "elevated": "Soft shadow, no border. Floating effect.",
    "flat": "No border or shadow. Background color difference only.",
    "glass": "Glassmorphism: semi-transparent with blur backdrop.",
    "outlined": "Strong border (2px), prominent rounded corners.",
    "minimal": "Almost invisible cards. Just content with spacing.",
  };
  return map[c] || "Standard card style.";
}

function getBgDescription(b: string): string {
  const map: Record<string, string> = {
    "uniform": "Same background throughout all sections.",
    "alternating": "Alternating backgrounds (white/off-white or dark/darker) for visual rhythm.",
    "gradient-shift": "Subtle gradient transitions between sections.",
    "accent-band": "One section in the middle uses brand primary color as background.",
    "dark-middle": "Light sections sandwich a dark section in the middle for drama.",
    "all-dark": "Full dark mode throughout.",
    "all-light": "Full light mode throughout.",
  };
  return map[b] || "Standard backgrounds.";
}

function getAnimDescription(a: string): string {
  const map: Record<string, string> = {
    "none": "No animations. Clean, fast, professional.",
    "subtle": "Gentle fade-in only. Refined.",
    "scroll-reveal": "Elements fade + slide up as user scrolls. Modern.",
    "staggered": "Elements appear one by one in sequence. Engaging.",
    "playful": "Bouncy spring animations. Fun and energetic.",
  };
  return map[a] || "Standard animations.";
}
