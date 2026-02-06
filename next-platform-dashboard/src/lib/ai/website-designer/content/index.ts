/**
 * PHASE AWD-06: Content Generation Engine
 * Public API Exports
 *
 * This is the main entry point for the Content Generation Engine.
 * Import everything from this file for content generation functionality.
 *
 * @module content
 *
 * @example
 * ```typescript
 * import {
 *   buildContentContext,
 *   generateHeroContent,
 *   generateFeaturesContent,
 *   analyzeContent,
 *   optimizeHeadline,
 *   getIndustryTemplate,
 * } from "@/lib/ai/website-designer/content";
 *
 * // Build context
 * const context = buildContentContext(businessContext, "restaurant", "friendly");
 *
 * // Generate hero content
 * const heroContent = await generateHeroContent(context, businessContext);
 *
 * // Analyze content quality
 * const analysis = analyzeContent(heroContent.headline, context.seoKeywords);
 *
 * // Get headline alternatives
 * const alternatives = await optimizeHeadline(heroContent.headline, context);
 * ```
 */

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  // Core types
  ContentTone,
  ContentStyle,
  BusinessIdentity,
  ContentGenerationContext,
  SectionContent,
  CTAPurpose,

  // Section content types
  HeroContent,
  FeaturesContent,
  TestimonialsContent,
  CTAContent,
  AboutContent,
  ContactContent,
  FAQContent,
  PricingContent,
  TeamContent,
  ServicesContent,
  GalleryContent,
  BlogContent,
  StatsContent,
  GeneratedContent,

  // Template types
  IndustryContentTemplate,

  // Analysis types
  ContentAnalysis,
  ContentLengthRequirements,
  ContentValidation,
} from "./types";

// =============================================================================
// CONTEXT BUILDER EXPORTS
// =============================================================================

export {
  // Main builder
  buildContentContext,

  // Individual builders
  buildBusinessIdentity,
  inferTargetAudience,
  inferUVP,
  getStyleFromTone,
  inferSEOKeywords,
} from "./context-builder";

// =============================================================================
// SECTION GENERATOR EXPORTS
// =============================================================================

export {
  // Individual generators
  generateHeroContent,
  generateFeaturesContent,
  generateCTAContent,
  generateAboutContent,
  generateFAQContent,
  generatePricingContent,
  generateContactContent,
  generateTeamContent,
  generateServicesContent,
  generateTestimonialsContent,
  generateGalleryContent,
  generateBlogContent,
  generateStatsContent,

  // Batch generator
  generateAllContent,
} from "./section-generators";

// =============================================================================
// OPTIMIZER EXPORTS
// =============================================================================

export {
  // Content analysis
  analyzeContent,
  calculateOverallScore,

  // Headline optimization
  optimizeHeadline,
  generateHeadlineVariations,

  // Content validation
  validateContentLength,
  DEFAULT_LENGTH_REQUIREMENTS,

  // SEO optimization
  optimizeForSEO,
  generateMetaDescription,

  // Content enhancement
  enhanceContent,
} from "./optimizer";

// =============================================================================
// TEMPLATE EXPORTS
// =============================================================================

export {
  // Template data
  industryContentTemplates,

  // Template helpers
  getIndustryTemplate,
  getRandomHeadline,
  getIndustryCTAs,
  getIndustryIcons,
  getIndustryFAQTopics,
  getIndustryValueProps,
  getSupportedIndustries,
  hasIndustryTemplate,
} from "./templates";

// =============================================================================
// PROMPT EXPORTS (for advanced usage)
// =============================================================================

export {
  // System prompts
  CONTENT_GENERATOR_SYSTEM_PROMPT,
  SEO_OPTIMIZER_SYSTEM_PROMPT,
  HEADLINE_OPTIMIZER_PROMPT,

  // Tone descriptions
  TONE_DESCRIPTIONS,

  // Prompt builders
  buildHeroPrompt,
  buildFeaturesPrompt,
  buildCTAPrompt,
  buildAboutPrompt,
  buildFAQPrompt,
  buildPricingPrompt,
  buildContactPrompt,
  buildTeamPrompt,
  buildServicesPrompt,

  // CTA contexts
  CTA_PURPOSE_CONTEXTS,
} from "./prompts";

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

import { buildContentContext } from "./context-builder";
import { generateAllContent } from "./section-generators";
import { analyzeContent, calculateOverallScore } from "./optimizer";
import type { BusinessDataContext } from "../data-context/types";
import type { ContentTone, ContentAnalysis, GeneratedContent } from "./types";

/**
 * Generate content with analysis in one call
 */
export async function generateAndAnalyzeContent(
  businessContext: BusinessDataContext,
  industry: string,
  tone: ContentTone,
  sections?: string[]
): Promise<{
  content: Record<string, unknown>;
  context: ReturnType<typeof buildContentContext>;
  analyses: Record<string, ContentAnalysis>;
}> {
  // Build context
  const context = buildContentContext(businessContext, industry, tone);

  // Generate content
  const content = await generateAllContent(
    context,
    businessContext,
    sections
  );

  // Analyze each content piece
  const analyses: Record<string, ContentAnalysis> = {};
  for (const [section, sectionContent] of Object.entries(content)) {
    if (sectionContent && typeof sectionContent === "object") {
      // Get main text content for analysis
      const textContent = extractTextContent(sectionContent as Record<string, unknown>);
      if (textContent) {
        analyses[section] = analyzeContent(textContent, context.seoKeywords || []);
      }
    }
  }

  return { content, context, analyses };
}

/**
 * Extract text content from a section for analysis
 */
function extractTextContent(section: Record<string, unknown>): string {
  const texts: string[] = [];

  for (const value of Object.values(section)) {
    if (typeof value === "string") {
      texts.push(value);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string") {
          texts.push(item);
        } else if (typeof item === "object" && item !== null) {
          const nested = extractTextContent(item as Record<string, unknown>);
          if (nested) texts.push(nested);
        }
      }
    }
  }

  return texts.join(" ");
}

/**
 * Quick content score for a piece of content
 */
export function quickContentScore(
  content: string,
  keywords: string[] = []
): {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  summary: string;
} {
  const analysis = analyzeContent(content, keywords);
  return calculateOverallScore(analysis);
}
