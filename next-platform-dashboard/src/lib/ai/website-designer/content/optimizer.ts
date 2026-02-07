/**
 * PHASE AWD-06: Content Generation Engine
 * Content Optimizer
 *
 * Provides content analysis, SEO optimization, readability scoring,
 * and content validation for generated website copy.
 */

import { generateText } from "ai";
import { getAIModel } from "../config/ai-provider";
import { HEADLINE_OPTIMIZER_PROMPT } from "./prompts";
import type {
  ContentGenerationContext,
  ContentAnalysis,
  ContentLengthRequirements,
  ContentValidation,
} from "./types";

// =============================================================================
// CONTENT ANALYSIS
// =============================================================================

/**
 * Analyze content for readability, SEO, and conversion potential
 */
export function analyzeContent(
  content: string,
  keywords: string[] = []
): ContentAnalysis {
  // Calculate word count
  const words = content.split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;

  // Calculate sentence count
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const sentenceCount = Math.max(1, sentences.length);

  // Average words per sentence (readability indicator)
  const avgWordsPerSentence = wordCount / sentenceCount;

  // ============================================
  // READABILITY SCORE (Simplified Flesch-Kincaid)
  // ============================================
  // Target: 12-17 words per sentence is optimal
  // Below 10: May be too choppy
  // Above 20: May be hard to follow
  let readabilityScore = 100;

  if (avgWordsPerSentence < 8) {
    readabilityScore -= 20; // Too choppy
  } else if (avgWordsPerSentence < 10) {
    readabilityScore -= 10; // Slightly choppy
  } else if (avgWordsPerSentence > 25) {
    readabilityScore -= 30; // Too complex
  } else if (avgWordsPerSentence > 20) {
    readabilityScore -= 15; // Getting complex
  }

  // Check for passive voice indicators (simplified)
  const passiveIndicators = ["was", "were", "been", "being", "is being", "was being"];
  const lowerContent = content.toLowerCase();
  const passiveCount = passiveIndicators.filter((p) =>
    lowerContent.includes(` ${p} `)
  ).length;
  readabilityScore -= passiveCount * 5;

  // Check for complex words (3+ syllables, simplified check)
  const complexWords = words.filter(
    (w) => w.length > 10 || countVowelGroups(w) > 3
  );
  const complexRatio = complexWords.length / Math.max(1, wordCount);
  if (complexRatio > 0.3) {
    readabilityScore -= 15;
  } else if (complexRatio > 0.2) {
    readabilityScore -= 8;
  }

  readabilityScore = Math.max(0, Math.min(100, readabilityScore));

  // ============================================
  // SEO SCORE
  // ============================================
  let seoScore = 50; // Base score

  if (keywords.length > 0) {
    // Check keyword presence
    const keywordMatches = keywords.filter((kw) =>
      lowerContent.includes(kw.toLowerCase())
    );
    const keywordRatio = keywordMatches.length / keywords.length;
    seoScore += Math.round(keywordRatio * 40);

    // Check keyword prominence (in first 100 characters)
    const firstPart = lowerContent.slice(0, 100);
    const prominentKeywords = keywords.filter((kw) =>
      firstPart.includes(kw.toLowerCase())
    );
    if (prominentKeywords.length > 0) {
      seoScore += 10;
    }
  } else {
    // No keywords provided, give benefit of the doubt
    seoScore = 70;
  }

  // Content length considerations for SEO
  if (wordCount < 20) {
    seoScore -= 15; // Too short
  } else if (wordCount > 50) {
    seoScore += 5; // Good length
  }

  seoScore = Math.max(0, Math.min(100, seoScore));

  // ============================================
  // CONVERSION SCORE
  // ============================================
  let conversionScore = 40; // Base score

  // Action words that drive conversions
  const actionWords = [
    "get",
    "start",
    "discover",
    "join",
    "unlock",
    "try",
    "free",
    "now",
    "today",
    "claim",
    "save",
    "learn",
    "find",
    "see",
    "explore",
    "contact",
    "call",
    "book",
    "schedule",
    "reserve",
  ];
  const actionMatches = actionWords.filter((aw) =>
    lowerContent.includes(aw)
  );
  conversionScore += Math.min(30, actionMatches.length * 8);

  // Urgency words
  const urgencyWords = [
    "now",
    "today",
    "limited",
    "exclusive",
    "hurry",
    "last chance",
    "don't miss",
    "act fast",
    "only",
    "ending soon",
  ];
  const urgencyMatches = urgencyWords.filter((uw) =>
    lowerContent.includes(uw)
  );
  conversionScore += Math.min(15, urgencyMatches.length * 5);

  // Trust words
  const trustWords = [
    "trusted",
    "proven",
    "guaranteed",
    "secure",
    "verified",
    "certified",
    "expert",
    "professional",
    "quality",
    "reliable",
  ];
  const trustMatches = trustWords.filter((tw) => lowerContent.includes(tw));
  conversionScore += Math.min(15, trustMatches.length * 5);

  conversionScore = Math.max(0, Math.min(100, conversionScore));

  // ============================================
  // SUGGESTIONS
  // ============================================
  const suggestions: string[] = [];

  if (readabilityScore < 60) {
    suggestions.push("Shorten sentences for better readability");
  }
  if (readabilityScore < 70 && passiveCount > 1) {
    suggestions.push("Use more active voice to engage readers");
  }
  if (seoScore < 50) {
    suggestions.push("Include more target keywords naturally");
  }
  if (conversionScore < 40) {
    suggestions.push("Add more action-oriented language (get, start, try)");
  }
  if (conversionScore < 50 && urgencyMatches.length === 0) {
    suggestions.push("Consider adding urgency elements to drive action");
  }
  if (wordCount < 20) {
    suggestions.push("Content may be too brief - consider expanding");
  }
  if (wordCount > 200) {
    suggestions.push("Content is lengthy - consider breaking into sections");
  }
  if (complexRatio > 0.25) {
    suggestions.push("Simplify vocabulary for broader audience appeal");
  }

  return {
    readabilityScore,
    seoScore,
    conversionScore,
    suggestions,
  };
}

/**
 * Helper: Count vowel groups (simplified syllable estimate)
 */
function countVowelGroups(word: string): number {
  const matches = word.toLowerCase().match(/[aeiouy]+/g);
  return matches ? matches.length : 1;
}

// =============================================================================
// HEADLINE OPTIMIZER
// =============================================================================

/**
 * Generate alternative headlines using AI
 */
export async function optimizeHeadline(
  headline: string,
  context: ContentGenerationContext
): Promise<string[]> {
  try {
    const { text } = await generateText({
      model: getAIModel("content-generation"),
      system: HEADLINE_OPTIMIZER_PROMPT,
      prompt: `Given this headline: "${headline}"
    
For a ${context.business.industry} business with ${context.tone} tone.
Target audience: ${context.business.targetAudience || "general customers"}

Generate 3 alternative headlines that:
1. Are more compelling and attention-grabbing
2. Include power words that evoke emotion
3. Create urgency or curiosity
4. Stay under 10 words
5. Match the ${context.tone} tone

Return only the headlines, one per line, numbered 1-3.`,
    });

    // Parse the response to extract headlines
    const lines = text.split("\n").filter((h) => h.trim().length > 0);
    const headlines = lines
      .map((line) => line.replace(/^\d+[\.\)\-\s]+/, "").trim())
      .filter((h) => h.length > 0)
      .slice(0, 3);

    return headlines.length > 0 ? headlines : [headline];
  } catch (error) {
    console.error("Failed to optimize headline:", error);
    return [headline]; // Return original on error
  }
}

/**
 * Generate multiple headline variations for A/B testing
 */
export async function generateHeadlineVariations(
  topic: string,
  context: ContentGenerationContext,
  count: number = 5
): Promise<string[]> {
  try {
    const { text } = await generateText({
      model: getAIModel("content-generation"),
      system: HEADLINE_OPTIMIZER_PROMPT,
      prompt: `Create ${count} headline variations for: "${topic}"

Business: ${context.business.name}
Industry: ${context.business.industry}
Tone: ${context.tone}
Audience: ${context.business.targetAudience || "general customers"}

Create headlines using different formulas:
1. Question headline
2. How-to headline
3. Number/list headline
4. Statement headline
5. Curiosity gap headline

Each headline should:
- Be 5-12 words
- Use ${context.tone} tone
- Be compelling and action-oriented

Return only the headlines, one per line, numbered 1-${count}.`,
    });

    const lines = text.split("\n").filter((h) => h.trim().length > 0);
    return lines
      .map((line) => line.replace(/^\d+[\.\)\-\s]+/, "").trim())
      .filter((h) => h.length > 0)
      .slice(0, count);
  } catch (error) {
    console.error("Failed to generate headline variations:", error);
    return [];
  }
}

// =============================================================================
// CONTENT VALIDATION
// =============================================================================

/**
 * Validate content length against requirements
 */
export function validateContentLength(
  content: Record<string, unknown>,
  requirements: ContentLengthRequirements
): ContentValidation {
  const issues: string[] = [];

  for (const [field, { min, max }] of Object.entries(requirements)) {
    const value = content[field];
    if (typeof value === "string") {
      const words = value.split(/\s+/).filter((w) => w.length > 0).length;
      if (words < min) {
        issues.push(
          `${field} is too short (${words} words, minimum ${min})`
        );
      }
      if (words > max) {
        issues.push(`${field} is too long (${words} words, maximum ${max})`);
      }
    }
  }

  return { valid: issues.length === 0, issues };
}

/**
 * Default content length requirements
 */
export const DEFAULT_LENGTH_REQUIREMENTS: Record<
  string,
  ContentLengthRequirements
> = {
  hero: {
    headline: { min: 3, max: 12 },
    subheadline: { min: 10, max: 30 },
    ctaPrimary: { min: 1, max: 5 },
  },
  features: {
    sectionTitle: { min: 2, max: 8 },
    sectionSubtitle: { min: 8, max: 25 },
  },
  cta: {
    headline: { min: 3, max: 12 },
    subheadline: { min: 10, max: 30 },
    ctaText: { min: 1, max: 5 },
  },
  about: {
    headline: { min: 2, max: 8 },
    story: { min: 40, max: 150 },
  },
  contact: {
    headline: { min: 2, max: 8 },
    subheadline: { min: 8, max: 25 },
  },
};

// =============================================================================
// SEO OPTIMIZATION
// =============================================================================

/**
 * Optimize text for SEO by naturally including keywords
 */
export async function optimizeForSEO(
  text: string,
  keywords: string[],
  context: ContentGenerationContext
): Promise<string> {
  if (keywords.length === 0) return text;

  try {
    const { text: optimized } = await generateText({
      model: getAIModel("content-generation"),
      prompt: `Optimize this text for SEO while maintaining readability and the ${context.tone} tone.

Original text:
"${text}"

Target keywords to include naturally:
${keywords.join(", ")}

Guidelines:
1. Include keywords naturally - don't stuff them
2. Maintain the original meaning and message
3. Keep the ${context.tone} tone
4. Ensure it reads smoothly
5. Return only the optimized text, no explanations

Optimized text:`,
    });

    return optimized.trim();
  } catch (error) {
    console.error("Failed to optimize for SEO:", error);
    return text; // Return original on error
  }
}

/**
 * Generate meta description for a page
 */
export async function generateMetaDescription(
  pageContent: string,
  context: ContentGenerationContext,
  keywords: string[] = []
): Promise<string> {
  try {
    const { text } = await generateText({
      model: getAIModel("content-generation"),
      prompt: `Generate an SEO-optimized meta description for this page content.

Page summary:
${pageContent.slice(0, 500)}

Business: ${context.business.name}
Industry: ${context.business.industry}
Keywords: ${keywords.join(", ") || "none specified"}

Requirements:
1. 150-160 characters exactly
2. Include primary keyword naturally
3. Include a call to action
4. Be compelling and click-worthy
5. Match ${context.tone} tone

Return only the meta description, nothing else:`,
    });

    // Ensure proper length
    let description = text.trim();
    if (description.length > 160) {
      description = description.slice(0, 157) + "...";
    }

    return description;
  } catch (error) {
    console.error("Failed to generate meta description:", error);
    return `${context.business.name} - ${context.business.industry} services. Contact us today!`;
  }
}

// =============================================================================
// CONTENT ENHANCEMENT
// =============================================================================

/**
 * Enhance content with power words and emotional triggers
 */
export async function enhanceContent(
  text: string,
  context: ContentGenerationContext,
  options: {
    addUrgency?: boolean;
    addSocialProof?: boolean;
    addBenefits?: boolean;
  } = {}
): Promise<string> {
  const enhancements: string[] = [];
  if (options.addUrgency) enhancements.push("urgency elements");
  if (options.addSocialProof) enhancements.push("social proof indicators");
  if (options.addBenefits) enhancements.push("clear benefit statements");

  if (enhancements.length === 0) return text;

  try {
    const { text: enhanced } = await generateText({
      model: getAIModel("content-generation"),
      prompt: `Enhance this text by adding ${enhancements.join(" and ")}.

Original text:
"${text}"

Business: ${context.business.name}
Industry: ${context.business.industry}
Tone: ${context.tone}

Guidelines:
1. Maintain the original message
2. Add ${enhancements.join(" and ")} naturally
3. Keep it concise
4. Use ${context.tone} tone
5. Return only the enhanced text

Enhanced text:`,
    });

    return enhanced.trim();
  } catch (error) {
    console.error("Failed to enhance content:", error);
    return text;
  }
}

// =============================================================================
// OVERALL CONTENT SCORE
// =============================================================================

/**
 * Calculate overall content quality score
 */
export function calculateOverallScore(analysis: ContentAnalysis): {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  summary: string;
} {
  // Weighted average
  const score = Math.round(
    analysis.readabilityScore * 0.35 +
      analysis.seoScore * 0.3 +
      analysis.conversionScore * 0.35
  );

  // Determine grade
  let grade: "A" | "B" | "C" | "D" | "F";
  let summary: string;

  if (score >= 90) {
    grade = "A";
    summary = "Excellent content quality - ready for production";
  } else if (score >= 80) {
    grade = "B";
    summary = "Good content quality - minor improvements possible";
  } else if (score >= 70) {
    grade = "C";
    summary = "Average content - consider implementing suggestions";
  } else if (score >= 60) {
    grade = "D";
    summary = "Below average - improvements recommended";
  } else {
    grade = "F";
    summary = "Poor content quality - significant revisions needed";
  }

  return { score, grade, summary };
}
