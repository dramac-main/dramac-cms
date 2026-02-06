/**
 * PHASE AWD-04: Component Selection Intelligence
 * Component Scoring System
 *
 * Scores and ranks components based on context to select the optimal
 * component for each section of a website.
 */

import type {
  ComponentScore,
  ScoringContext,
  DataAvailabilityFlags,
  IndustryTemplate,
} from "./types";
import type { BusinessDataContext } from "../data-context/types";

// =============================================================================
// AVAILABLE COMPONENTS
// =============================================================================

/**
 * All available component types organized by purpose
 */
export const COMPONENT_BY_PURPOSE: Record<string, string[]> = {
  hero: ["Hero"],
  features: ["Features", "Card", "Columns"],
  services: ["Features", "Card", "Pricing"],
  testimonials: ["Testimonials", "SocialProof", "Quote"],
  team: ["Team", "Card"],
  pricing: ["Pricing", "ComparisonTable", "Card"],
  faq: ["FAQ", "Accordion"],
  gallery: ["Gallery", "Carousel", "Card"],
  contact: ["ContactForm", "Form", "Card"],
  cta: ["CTA", "Newsletter", "LeadCapture"],
  stats: ["Stats", "Card"],
  trust: ["TrustBadges", "LogoCloud", "SocialProof"],
  about: ["Card", "Features", "RichText"],
  blog: ["Card", "Carousel"],
  location: ["Map", "Card"],
  process: ["Features", "Accordion", "Card"],
  video: ["Video", "Hero"],
  newsletter: ["Newsletter", "CTA", "LeadCapture"],
};

// =============================================================================
// DATA AVAILABILITY CHECK
// =============================================================================

/**
 * Build data availability flags from business context
 */
export function buildDataAvailabilityFlags(context: BusinessDataContext): DataAvailabilityFlags {
  return {
    hasTeam: (context.team?.length ?? 0) > 0,
    hasTestimonials: (context.testimonials?.length ?? 0) > 0,
    hasFaq: (context.faq?.length ?? 0) > 0,
    hasPortfolio: (context.portfolio?.length ?? 0) > 0,
    hasLocations: (context.locations?.length ?? 0) > 0,
    hasLogo: !!context.branding?.logo_url,
    hasServices: (context.services?.length ?? 0) > 0,
    hasSocial: (context.social?.length ?? 0) > 0,
    hasHours: (context.hours?.length ?? 0) > 0,
    hasBlog: (context.blog?.length ?? 0) > 0,
  };
}

// =============================================================================
// COMPONENT SCORING
// =============================================================================

/**
 * Score a single component for a given context
 */
export function scoreComponent(componentType: string, context: ScoringContext): ComponentScore {
  let score = 50; // Base score
  const reasons: string[] = [];
  const suggestedConfig: Record<string, unknown> = {};

  // === Industry Template Boost ===
  if (context.industryTemplate) {
    const preference = context.industryTemplate.componentPreferences.find(
      (p) => p.section === context.sectionIntent
    );

    if (preference?.preferred.includes(componentType)) {
      score += 30;
      reasons.push(`Recommended for ${context.industryTemplate.name} industry`);

      if (preference.config) {
        Object.assign(suggestedConfig, preference.config);
      }

      if (preference.variant) {
        suggestedConfig.variant = preference.variant;
      }
    }
  }

  // === Data Availability Boost ===
  const dataBoosts: Record<string, { check: keyof DataAvailabilityFlags; boost: number }[]> = {
    Team: [{ check: "hasTeam", boost: 25 }],
    Testimonials: [{ check: "hasTestimonials", boost: 25 }],
    FAQ: [{ check: "hasFaq", boost: 25 }],
    Gallery: [{ check: "hasPortfolio", boost: 20 }],
    Map: [{ check: "hasLocations", boost: 20 }],
    LogoCloud: [{ check: "hasLogo", boost: 15 }],
    TrustBadges: [{ check: "hasLogo", boost: 10 }],
    Stats: [{ check: "hasServices", boost: 15 }],
    SocialProof: [{ check: "hasSocial", boost: 15 }, { check: "hasTestimonials", boost: 10 }],
    Features: [{ check: "hasServices", boost: 15 }],
  };

  const boosts = dataBoosts[componentType] || [];
  for (const boost of boosts) {
    if (context.dataAvailability[boost.check]) {
      score += boost.boost;
      reasons.push(`Data available for ${componentType}`);
    } else {
      score -= 10;
      reasons.push(`No data for ${componentType}, will use placeholders`);
    }
  }

  // === Section Intent Match ===
  const intentMatches = COMPONENT_BY_PURPOSE[context.sectionIntent] || [];
  if (intentMatches.includes(componentType)) {
    score += 20;
    reasons.push(`Direct match for "${context.sectionIntent}" section`);
  }

  // === Variety Penalty (avoid repetition) ===
  const sameTypeCount = context.existingComponents.filter((c) => c === componentType).length;
  if (sameTypeCount > 0) {
    score -= 15 * sameTypeCount;
    reasons.push(`Already used ${sameTypeCount}x on this page`);
  }

  // === User Preference Alignment ===
  if (context.userPreferences) {
    // Animation preference
    if (context.userPreferences.animationLevel === "dynamic") {
      const animatedComponents = ["Carousel", "Parallax", "ScrollAnimate", "CardFlip3D", "TiltCard", "Countdown"];
      if (animatedComponents.includes(componentType)) {
        score += 10;
        reasons.push(`Matches dynamic animation preference`);
        suggestedConfig.animate = true;
      }
    }

    if (context.userPreferences.animationLevel === "none") {
      const animatedComponents = ["Carousel", "Parallax", "ScrollAnimate", "CardFlip3D", "TiltCard"];
      if (animatedComponents.includes(componentType)) {
        score -= 15;
        reasons.push(`Conflicts with no-animation preference`);
      }
    }

    // Style preference
    if (context.userPreferences.style === "minimal") {
      const minimalComponents = ["Card", "Text", "Divider", "Spacer", "Heading"];
      const heavyComponents = ["ParticleBackground", "CardFlip3D", "GlassCard", "Parallax"];

      if (minimalComponents.includes(componentType)) {
        score += 10;
        reasons.push(`Fits minimal style preference`);
      }
      if (heavyComponents.includes(componentType)) {
        score -= 10;
        reasons.push(`Too complex for minimal style`);
      }
    }

    if (context.userPreferences.style === "bold") {
      const boldComponents = ["Hero", "CTA", "Stats", "Parallax"];
      if (boldComponents.includes(componentType)) {
        score += 10;
        reasons.push(`Fits bold style preference`);
      }
    }

    // Layout density
    if (context.userPreferences.layoutDensity === "compact") {
      const spaciousComponents = ["Spacer", "Divider"];
      if (spaciousComponents.includes(componentType)) {
        score -= 10;
        reasons.push(`Conflicts with compact density preference`);
      }
    }
  }

  // === Component-Specific Bonuses ===
  // Hero is almost always best for first section
  if (context.sectionIntent === "hero" && componentType === "Hero") {
    score += 15;
    reasons.push("Hero is the standard choice for hero sections");
  }

  // CTA components should be used sparingly
  if (componentType === "CTA" && context.existingComponents.filter((c) => c === "CTA").length >= 2) {
    score -= 20;
    reasons.push("Too many CTAs already");
  }

  return {
    componentType,
    score: Math.max(0, Math.min(100, score)),
    reasons,
    suggestedConfig,
  };
}

// =============================================================================
// COMPONENT RANKING
// =============================================================================

/**
 * Rank all components for a section
 */
export function rankComponentsForSection(
  sectionIntent: string,
  context: ScoringContext,
  availableComponents?: string[]
): ComponentScore[] {
  // Get components to consider
  const candidates = availableComponents || COMPONENT_BY_PURPOSE[sectionIntent] || Object.values(COMPONENT_BY_PURPOSE).flat();

  // Remove duplicates
  const uniqueCandidates = [...new Set(candidates)];

  // Score and sort
  return uniqueCandidates
    .map((type) => scoreComponent(type, { ...context, sectionIntent }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Select the best component for a section
 */
export function selectBestComponent(
  sectionIntent: string,
  context: ScoringContext,
  availableComponents?: string[]
): ComponentScore {
  const ranked = rankComponentsForSection(sectionIntent, context, availableComponents);
  return ranked[0] || { componentType: "Card", score: 50, reasons: ["Default fallback"], suggestedConfig: {} };
}

/**
 * Select top N components for a section
 */
export function selectTopComponents(
  sectionIntent: string,
  context: ScoringContext,
  count: number = 3,
  availableComponents?: string[]
): ComponentScore[] {
  const ranked = rankComponentsForSection(sectionIntent, context, availableComponents);
  return ranked.slice(0, count);
}

// =============================================================================
// SECTION PLANNING
// =============================================================================

/**
 * Plan components for an entire page
 */
export function planPageComponents(
  sections: Array<{ intent: string; required?: boolean }>,
  context: Omit<ScoringContext, "sectionIntent" | "existingComponents">
): Array<{ intent: string; selected: ComponentScore; alternatives: ComponentScore[] }> {
  const existingComponents: string[] = [];
  const plan: Array<{ intent: string; selected: ComponentScore; alternatives: ComponentScore[] }> = [];

  for (const section of sections) {
    const fullContext: ScoringContext = {
      ...context,
      sectionIntent: section.intent,
      existingComponents: [...existingComponents],
    };

    const ranked = rankComponentsForSection(section.intent, fullContext);
    const selected = ranked[0];
    const alternatives = ranked.slice(1, 4);

    // Add selected component to existing list to affect future scoring
    existingComponents.push(selected.componentType);

    plan.push({
      intent: section.intent,
      selected,
      alternatives,
    });
  }

  return plan;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get suggested component for a section with full context
 */
export function getSuggestedComponent(
  sectionIntent: string,
  industryTemplate: IndustryTemplate | null,
  dataAvailability: DataAvailabilityFlags,
  existingComponents: string[] = []
): ComponentScore {
  return selectBestComponent(sectionIntent, {
    sectionIntent,
    industryTemplate,
    dataAvailability,
    existingComponents,
  });
}

/**
 * Check if a component type is suitable for a section
 */
export function isComponentSuitableForSection(
  componentType: string,
  sectionIntent: string,
  minScore: number = 40
): boolean {
  const score = scoreComponent(componentType, {
    sectionIntent,
    industryTemplate: null,
    dataAvailability: {
      hasTeam: false,
      hasTestimonials: false,
      hasFaq: false,
      hasPortfolio: false,
      hasLocations: false,
      hasLogo: false,
      hasServices: false,
      hasSocial: false,
      hasHours: false,
      hasBlog: false,
    },
    existingComponents: [],
  });

  return score.score >= minScore;
}
