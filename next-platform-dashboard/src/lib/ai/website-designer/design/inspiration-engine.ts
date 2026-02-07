/**
 * PHASE AWD-INSPIRATION: Design Inspiration Engine
 * 
 * Analyzes award-winning design patterns from Dribbble, Awwwards, and other
 * design platforms to inform AI website generation.
 * 
 * This engine provides the AI with curated design patterns, color schemes,
 * typography combinations, and layout structures from successful websites.
 */

import { generateObject } from "ai";
import { getAIModel } from "../config/ai-provider";
import { z } from "zod";

// =============================================================================
// DESIGN PATTERN DATABASE
// =============================================================================

/**
 * Curated design patterns from award-winning websites
 * These patterns are analyzed from Dribbble, Awwwards, and CSS Design Awards
 */
export const AWARD_WINNING_PATTERNS = {
  // =========================================================================
  // HERO SECTION PATTERNS
  // =========================================================================
  heroPatterns: [
    {
      name: "Split Hero",
      description: "Content on one side, image/video on other. Clean asymmetrical layout.",
      bestFor: ["agency", "saas", "portfolio"],
      elements: ["headline", "subheadline", "cta", "image"],
      animation: "slide-in-from-sides",
      example: "Stripe, Linear, Notion landing pages",
    },
    {
      name: "Full-Screen Video Hero",
      description: "Autoplay muted video background with centered content and overlay",
      bestFor: ["restaurant", "hotel", "luxury", "automotive"],
      elements: ["video", "headline", "cta", "scroll-indicator"],
      animation: "fade-in-scale",
      example: "Apple product pages, Tesla",
    },
    {
      name: "Interactive 3D Hero",
      description: "3D elements or illustrations that respond to mouse movement",
      bestFor: ["tech", "creative", "gaming"],
      elements: ["3d-element", "headline", "cta"],
      animation: "parallax-mouse-tracking",
      example: "Vercel, GitHub Universe",
    },
    {
      name: "Minimalist Text Hero",
      description: "Large typography as the main visual element, minimal imagery",
      bestFor: ["agency", "consulting", "law-firm"],
      elements: ["oversized-headline", "subtle-animation", "cta"],
      animation: "text-reveal-stagger",
      example: "Pentagram, Instrument",
    },
    {
      name: "Product Showcase Hero",
      description: "Hero centered around product image with floating UI elements",
      bestFor: ["ecommerce", "saas", "mobile-app"],
      elements: ["product-image", "feature-badges", "price", "cta"],
      animation: "float-bounce",
      example: "Apple iPhone page, Figma",
    },
    {
      name: "Booking-Focused Hero",
      description: "Hero with embedded booking/reservation form as primary action",
      bestFor: ["restaurant", "hotel", "spa", "salon"],
      elements: ["background-image", "booking-form", "trust-badges"],
      animation: "form-slide-up",
      example: "OpenTable, Resy, Hotels.com",
    },
  ],

  // =========================================================================
  // COLOR SCHEMES (Award-Winning)
  // =========================================================================
  colorSchemes: [
    {
      name: "Dark Elegance",
      primary: "#1a1a2e",
      secondary: "#16213e",
      accent: "#e94560",
      background: "#0f0f23",
      text: "#eaeaea",
      bestFor: ["luxury", "tech", "portfolio", "restaurant"],
    },
    {
      name: "Clean Professional",
      primary: "#2563eb",
      secondary: "#1e40af",
      accent: "#3b82f6",
      background: "#ffffff",
      text: "#1f2937",
      bestFor: ["corporate", "saas", "consulting", "healthcare"],
    },
    {
      name: "Warm Earth",
      primary: "#92400e",
      secondary: "#78350f",
      accent: "#d97706",
      background: "#fffbeb",
      text: "#451a03",
      bestFor: ["restaurant", "cafe", "bakery", "organic"],
    },
    {
      name: "Fresh Mint",
      primary: "#059669",
      secondary: "#047857",
      accent: "#10b981",
      background: "#ecfdf5",
      text: "#064e3b",
      bestFor: ["health", "fitness", "organic", "eco-friendly"],
    },
    {
      name: "Bold Gradient",
      primary: "#7c3aed",
      secondary: "#4f46e5",
      accent: "#ec4899",
      background: "#faf5ff",
      text: "#1e1b4b",
      bestFor: ["creative", "startup", "gaming", "entertainment"],
    },
    {
      name: "Sophisticated Neutral",
      primary: "#374151",
      secondary: "#4b5563",
      accent: "#f59e0b",
      background: "#f9fafb",
      text: "#111827",
      bestFor: ["law-firm", "finance", "consulting", "real-estate"],
    },
    {
      name: "Ocean Blue",
      primary: "#0077b6",
      secondary: "#023e8a",
      accent: "#00b4d8",
      background: "#caf0f8",
      text: "#03045e",
      bestFor: ["travel", "spa", "maritime", "tech"],
    },
    {
      name: "Sunset Warmth",
      primary: "#ea580c",
      secondary: "#c2410c",
      accent: "#fb923c",
      background: "#fff7ed",
      text: "#431407",
      bestFor: ["restaurant", "food", "hospitality", "events"],
    },
  ],

  // =========================================================================
  // TYPOGRAPHY COMBINATIONS
  // =========================================================================
  typographyPairings: [
    {
      name: "Modern Sans",
      heading: "Inter",
      body: "Inter",
      style: "clean, tech-forward, versatile",
      bestFor: ["tech", "saas", "startup"],
    },
    {
      name: "Editorial Elegance",
      heading: "Playfair Display",
      body: "Source Sans Pro",
      style: "sophisticated, editorial, high-end",
      bestFor: ["luxury", "fashion", "magazine", "restaurant"],
    },
    {
      name: "Bold Impact",
      heading: "Bebas Neue",
      body: "Open Sans",
      style: "bold, impactful, sports/automotive",
      bestFor: ["fitness", "automotive", "sports", "events"],
    },
    {
      name: "Friendly Rounded",
      heading: "Nunito",
      body: "Nunito Sans",
      style: "friendly, approachable, warm",
      bestFor: ["education", "children", "community", "nonprofit"],
    },
    {
      name: "Classic Professional",
      heading: "Merriweather",
      body: "Open Sans",
      style: "classic, trustworthy, professional",
      bestFor: ["law-firm", "finance", "healthcare", "consulting"],
    },
    {
      name: "Geometric Modern",
      heading: "Poppins",
      body: "Poppins",
      style: "geometric, modern, balanced",
      bestFor: ["agency", "portfolio", "creative", "tech"],
    },
    {
      name: "Minimal Japanese",
      heading: "Noto Sans JP",
      body: "Noto Sans",
      style: "minimal, zen, clean",
      bestFor: ["spa", "wellness", "minimalist", "gallery"],
    },
  ],

  // =========================================================================
  // SECTION LAYOUTS
  // =========================================================================
  sectionLayouts: [
    {
      name: "Bento Grid",
      description: "Asymmetric grid with varied card sizes (like Apple's bento boxes)",
      columns: "variable",
      animation: "stagger-reveal",
      bestFor: ["features", "services", "portfolio"],
    },
    {
      name: "Horizontal Scroll",
      description: "Horizontal scrolling section for showcasing items",
      columns: "horizontal",
      animation: "smooth-scroll",
      bestFor: ["testimonials", "portfolio", "products"],
    },
    {
      name: "Masonry Gallery",
      description: "Pinterest-style masonry layout for images",
      columns: "masonry",
      animation: "fade-in-stagger",
      bestFor: ["gallery", "portfolio", "products"],
    },
    {
      name: "Split Alternating",
      description: "Alternating left/right content-image pairs",
      columns: "2",
      animation: "slide-alternate",
      bestFor: ["features", "about", "process"],
    },
    {
      name: "Card Stack",
      description: "Stacked cards that reveal on scroll",
      columns: "1",
      animation: "scroll-stack",
      bestFor: ["pricing", "features", "timeline"],
    },
    {
      name: "Full-Width Immersive",
      description: "Full viewport sections with scroll-triggered content",
      columns: "1",
      animation: "scroll-trigger",
      bestFor: ["storytelling", "about", "hero"],
    },
  ],

  // =========================================================================
  // MICRO-INTERACTIONS
  // =========================================================================
  microInteractions: [
    {
      name: "Button Ripple",
      trigger: "click",
      description: "Material-design style ripple effect on buttons",
    },
    {
      name: "Hover Lift",
      trigger: "hover",
      description: "Cards lift with shadow on hover (translateY + shadow)",
    },
    {
      name: "Text Reveal",
      trigger: "scroll",
      description: "Text reveals character by character or word by word",
    },
    {
      name: "Image Zoom",
      trigger: "hover",
      description: "Subtle scale increase on image hover",
    },
    {
      name: "Magnetic Button",
      trigger: "hover",
      description: "Button follows cursor slightly when nearby",
    },
    {
      name: "Scroll Progress",
      trigger: "scroll",
      description: "Progress bar showing page scroll position",
    },
    {
      name: "Counter Animate",
      trigger: "scroll",
      description: "Numbers count up when section enters viewport",
    },
    {
      name: "Stagger Children",
      trigger: "scroll",
      description: "Child elements animate in with delay",
    },
  ],

  // =========================================================================
  // INDUSTRY DESIGN BENCHMARKS
  // =========================================================================
  industryBenchmarks: {
    restaurant: {
      inspirationSites: ["Eleven Madison Park", "Noma", "The French Laundry"],
      keyElements: ["food photography", "reservation CTA", "ambient imagery", "menu tease"],
      colorMood: "warm, appetizing, inviting",
      typography: "elegant serif for headlines, clean sans for body",
      animations: ["image parallax", "menu hover effects", "booking form slide"],
    },
    ecommerce: {
      inspirationSites: ["Apple Store", "Glossier", "Everlane"],
      keyElements: ["product grid", "quick add", "trust badges", "reviews"],
      colorMood: "clean, trustworthy, product-focused",
      typography: "clear, readable, product-focused",
      animations: ["add to cart", "image zoom", "filter transitions"],
    },
    saas: {
      inspirationSites: ["Linear", "Notion", "Stripe", "Vercel"],
      keyElements: ["feature grid", "demo video", "pricing table", "testimonials"],
      colorMood: "professional, innovative, trustworthy",
      typography: "modern sans-serif, clear hierarchy",
      animations: ["scroll reveals", "hover states", "demo interactions"],
    },
    portfolio: {
      inspirationSites: ["Pentagram", "Instrument", "Huge Inc"],
      keyElements: ["case studies", "project grid", "about", "contact"],
      colorMood: "minimal, work-focused, sophisticated",
      typography: "bold headlines, minimal body text",
      animations: ["project hover", "image transitions", "page transitions"],
    },
    healthcare: {
      inspirationSites: ["One Medical", "Oscar Health", "Headspace"],
      keyElements: ["trust indicators", "team photos", "booking", "testimonials"],
      colorMood: "calming, trustworthy, clean",
      typography: "friendly, readable, accessible",
      animations: ["subtle fades", "calm transitions"],
    },
  },
};

// =============================================================================
// DESIGN ANALYSIS SCHEMA
// =============================================================================

const DesignRecommendationSchema = z.object({
  heroPattern: z.object({
    name: z.string(),
    description: z.string(),
    elements: z.array(z.string()),
    animationSuggestion: z.string(),
  }),
  colorScheme: z.object({
    name: z.string(),
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    background: z.string(),
    text: z.string(),
    rationale: z.string(),
  }),
  typography: z.object({
    heading: z.string(),
    body: z.string(),
    style: z.string(),
    rationale: z.string(),
  }),
  layoutRecommendations: z.array(z.object({
    section: z.string(),
    layout: z.string(),
    animation: z.string(),
  })),
  microInteractions: z.array(z.string()),
  designPrinciples: z.array(z.string()),
});

export type DesignRecommendation = z.infer<typeof DesignRecommendationSchema>;

// =============================================================================
// INSPIRATION ENGINE CLASS
// =============================================================================

export class DesignInspirationEngine {
  private industry: string;
  private style: string;
  private userPrompt: string;

  constructor(industry: string, style: string = "modern", userPrompt: string = "") {
    this.industry = industry.toLowerCase();
    this.style = style;
    this.userPrompt = userPrompt;
  }

  /**
   * Get curated design recommendations based on industry and style
   */
  async getDesignRecommendations(): Promise<DesignRecommendation> {
    const industryBenchmark = AWARD_WINNING_PATTERNS.industryBenchmarks[
      this.industry as keyof typeof AWARD_WINNING_PATTERNS.industryBenchmarks
    ] || AWARD_WINNING_PATTERNS.industryBenchmarks.portfolio;

    const relevantHeroPatterns = AWARD_WINNING_PATTERNS.heroPatterns.filter(
      (p) => p.bestFor.some((b) => this.industry.includes(b) || b.includes(this.industry))
    );

    const relevantColorSchemes = AWARD_WINNING_PATTERNS.colorSchemes.filter(
      (c) => c.bestFor.some((b) => this.industry.includes(b) || b.includes(this.industry))
    );

    const relevantTypography = AWARD_WINNING_PATTERNS.typographyPairings.filter(
      (t) => t.bestFor.some((b) => this.industry.includes(b) || b.includes(this.industry))
    );

    // Use AI to select the best combination
    const { object } = await generateObject({
      model: getAIModel("design-inspiration"),
      schema: DesignRecommendationSchema,
      system: `You are a WORLD-CLASS UI/UX designer who has won multiple Awwwards and has designed for Fortune 500 companies.
      
Your task is to recommend the PERFECT design approach for a website. You have encyclopedic knowledge of award-winning designs.

CRITICAL: Your recommendations must be specific, actionable, and result in a jaw-dropping website.`,
      prompt: `Analyze this project and recommend the BEST design approach:

## Industry: ${this.industry}
## Requested Style: ${this.style}
## User Request: ${this.userPrompt}

## Industry Benchmarks (from award-winning sites):
${JSON.stringify(industryBenchmark, null, 2)}

## Available Hero Patterns for this industry:
${JSON.stringify(relevantHeroPatterns, null, 2)}

## Recommended Color Schemes:
${JSON.stringify(relevantColorSchemes.slice(0, 3), null, 2)}

## Recommended Typography:
${JSON.stringify(relevantTypography, null, 2)}

## Available Section Layouts:
${JSON.stringify(AWARD_WINNING_PATTERNS.sectionLayouts, null, 2)}

## Available Micro-Interactions:
${JSON.stringify(AWARD_WINNING_PATTERNS.microInteractions, null, 2)}

Based on this context, provide specific design recommendations that will make this website STAND OUT and WIN AWARDS.

Include:
1. The BEST hero pattern for this use case
2. A cohesive color scheme
3. Typography that matches the brand
4. Section layout recommendations
5. Micro-interactions to add polish
6. Core design principles to follow`,
    });

    return object;
  }

  /**
   * Get quick design tokens based on industry
   */
  getQuickDesignTokens(): {
    colors: typeof AWARD_WINNING_PATTERNS.colorSchemes[0];
    typography: typeof AWARD_WINNING_PATTERNS.typographyPairings[0];
    heroPattern: typeof AWARD_WINNING_PATTERNS.heroPatterns[0];
  } {
    // Find best matches for industry
    const colors = AWARD_WINNING_PATTERNS.colorSchemes.find(
      (c) => c.bestFor.some((b) => this.industry.includes(b))
    ) || AWARD_WINNING_PATTERNS.colorSchemes[1]; // Default to Clean Professional

    const typography = AWARD_WINNING_PATTERNS.typographyPairings.find(
      (t) => t.bestFor.some((b) => this.industry.includes(b))
    ) || AWARD_WINNING_PATTERNS.typographyPairings[0]; // Default to Modern Sans

    const heroPattern = AWARD_WINNING_PATTERNS.heroPatterns.find(
      (h) => h.bestFor.some((b) => this.industry.includes(b))
    ) || AWARD_WINNING_PATTERNS.heroPatterns[0]; // Default to Split Hero

    return { colors, typography, heroPattern };
  }

  /**
   * Generate CSS variables from design tokens
   */
  generateCSSVariables(colors: typeof AWARD_WINNING_PATTERNS.colorSchemes[0]): string {
    return `
:root {
  --color-primary: ${colors.primary};
  --color-secondary: ${colors.secondary};
  --color-accent: ${colors.accent};
  --color-background: ${colors.background};
  --color-text: ${colors.text};
  
  /* Derived colors */
  --color-primary-light: ${this.lightenColor(colors.primary, 20)};
  --color-primary-dark: ${this.darkenColor(colors.primary, 20)};
  --color-accent-light: ${this.lightenColor(colors.accent, 20)};
  
  /* Gradients */
  --gradient-primary: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});
  --gradient-accent: linear-gradient(135deg, ${colors.accent}, ${colors.primary});
}
    `.trim();
  }

  private lightenColor(hex: string, percent: number): string {
    // Simple color lightening - in production use a proper color library
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
    const B = Math.min(255, (num & 0x0000ff) + amt);
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  }

  private darkenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
    const B = Math.max(0, (num & 0x0000ff) - amt);
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  }
}
