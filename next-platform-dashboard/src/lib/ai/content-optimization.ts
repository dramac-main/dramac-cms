/**
 * Content Optimization Service
 * 
 * AI service for analyzing and optimizing page content.
 * Part of PHASE-ED-05C: AI Editor - Content Optimization
 * 
 * @phase STUDIO-27 - Updated to use standalone types
 */

import { anthropic, AI_MODELS } from "./config";
import type { PuckData, ComponentData } from "@/types/puck";

// ============================================
// Types
// ============================================

export type OptimizationType = 
  | "seo"
  | "conversion"
  | "readability"
  | "accessibility"
  | "engagement"
  | "mobile";

export interface OptimizationSuggestion {
  id: string;
  type: OptimizationType;
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  componentId?: string;
  componentType?: string;
  field?: string;
  currentValue?: string;
  suggestedValue?: string;
  autoFixable: boolean;
}

export interface OptimizationResult {
  success: boolean;
  score: number; // 0-100
  suggestions: OptimizationSuggestion[];
  summary: {
    seo: number;
    conversion: number;
    readability: number;
    accessibility: number;
  };
  error?: string;
}

export interface PageAnalysisContext {
  puckData: PuckData;
  pageTitle?: string;
  pageDescription?: string;
  targetKeywords?: string[];
  targetAudience?: string;
  pageGoal?: "conversion" | "information" | "engagement" | "branding";
}

// ============================================
// Content Extraction
// ============================================

function extractTextContent(puckData: PuckData): string[] {
  const texts: string[] = [];
  
  if (!puckData.content) return texts;

  for (const component of puckData.content) {
    if (component.props) {
      const textFields = [
        "title", "subtitle", "text", "content", "description",
        "heading", "quote", "ctaText", "buttonText", "placeholder"
      ];
      
      for (const field of textFields) {
        const value = component.props[field];
        if (typeof value === "string" && value.trim().length > 0) {
          texts.push(value);
        }
      }

      // Handle array fields (features, testimonials, etc.)
      const arrayFields = ["features", "testimonials", "faqs", "items", "links"];
      for (const field of arrayFields) {
        const arr = component.props[field];
        if (Array.isArray(arr)) {
          for (const item of arr) {
            if (typeof item === "object" && item !== null) {
              for (const key of Object.keys(item)) {
                const val = item[key];
                if (typeof val === "string" && val.trim().length > 0) {
                  texts.push(val);
                }
              }
            }
          }
        }
      }
    }
  }

  return texts;
}

function extractImages(puckData: PuckData): Array<{ src?: string; alt?: string }> {
  const images: Array<{ src?: string; alt?: string }> = [];
  
  if (!puckData.content) return images;

  for (const component of puckData.content) {
    if (component.props) {
      // Direct image fields
      if (component.props.src || component.props.image || component.props.backgroundImage) {
        images.push({
          src: (component.props.src || component.props.image || component.props.backgroundImage) as string,
          alt: component.props.alt as string | undefined,
        });
      }

      // Array fields with images
      const arrayFields = ["images", "gallery", "features", "testimonials", "team"];
      for (const field of arrayFields) {
        const arr = component.props[field];
        if (Array.isArray(arr)) {
          for (const item of arr) {
            if (typeof item === "object" && item !== null) {
              if (item.src || item.image || item.avatar) {
                images.push({
                  src: item.src || item.image || item.avatar,
                  alt: item.alt,
                });
              }
            }
          }
        }
      }
    }
  }

  return images;
}

// ============================================
// Local Analysis Functions
// ============================================

function analyzeReadability(texts: string[]): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];
  let suggestionId = 0;

  for (const text of texts) {
    // Check for very long sentences
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    for (const sentence of sentences) {
      const wordCount = sentence.trim().split(/\s+/).length;
      if (wordCount > 30) {
        suggestions.push({
          id: `readability-${++suggestionId}`,
          type: "readability",
          severity: "warning",
          title: "Long sentence detected",
          description: `This sentence has ${wordCount} words. Consider breaking it into shorter sentences for better readability.`,
          currentValue: sentence.trim().substring(0, 100) + "...",
          autoFixable: false,
        });
      }
    }

    // Check for passive voice indicators
    const passiveIndicators = [
      "was done", "is being", "has been", "were done", "are being",
      "will be done", "was made", "is made", "are made"
    ];
    const lowerText = text.toLowerCase();
    for (const indicator of passiveIndicators) {
      if (lowerText.includes(indicator)) {
        suggestions.push({
          id: `readability-${++suggestionId}`,
          type: "readability",
          severity: "info",
          title: "Passive voice detected",
          description: "Consider using active voice for more engaging copy.",
          currentValue: text.substring(0, 100),
          autoFixable: true,
        });
        break;
      }
    }
  }

  return suggestions;
}

function analyzeAccessibility(
  puckData: PuckData,
  images: Array<{ src?: string; alt?: string }>
): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];
  let suggestionId = 0;

  // Check for missing alt text
  for (const image of images) {
    if (image.src && (!image.alt || image.alt.trim().length === 0)) {
      suggestions.push({
        id: `accessibility-${++suggestionId}`,
        type: "accessibility",
        severity: "critical",
        title: "Missing image alt text",
        description: "Images should have descriptive alt text for accessibility and SEO.",
        currentValue: image.src,
        autoFixable: true,
      });
    }
  }

  // Check for heading hierarchy (if we can detect headings)
  if (puckData.content) {
    const headings: Array<{ level: number; index: number }> = [];
    puckData.content.forEach((component, index) => {
      if (component.type === "Heading" && component.props?.level) {
        headings.push({ level: component.props.level as number, index });
      }
    });

    // Check for skipped heading levels
    for (let i = 1; i < headings.length; i++) {
      if (headings[i].level - headings[i - 1].level > 1) {
        suggestions.push({
          id: `accessibility-${++suggestionId}`,
          type: "accessibility",
          severity: "warning",
          title: "Skipped heading level",
          description: `Heading level jumped from H${headings[i - 1].level} to H${headings[i].level}. Maintain proper heading hierarchy.`,
          autoFixable: false,
        });
      }
    }
  }

  return suggestions;
}

function analyzeSEOBasics(
  puckData: PuckData,
  pageTitle?: string,
  pageDescription?: string
): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];
  let suggestionId = 0;

  // Check page title
  if (!pageTitle || pageTitle.trim().length === 0) {
    suggestions.push({
      id: `seo-${++suggestionId}`,
      type: "seo",
      severity: "critical",
      title: "Missing page title",
      description: "Every page should have a unique, descriptive title for SEO.",
      autoFixable: true,
    });
  } else if (pageTitle.length < 30) {
    suggestions.push({
      id: `seo-${++suggestionId}`,
      type: "seo",
      severity: "warning",
      title: "Page title too short",
      description: "Page titles should be 50-60 characters for optimal SEO.",
      currentValue: pageTitle,
      autoFixable: true,
    });
  } else if (pageTitle.length > 60) {
    suggestions.push({
      id: `seo-${++suggestionId}`,
      type: "seo",
      severity: "warning",
      title: "Page title too long",
      description: "Page titles over 60 characters may be truncated in search results.",
      currentValue: pageTitle,
      autoFixable: true,
    });
  }

  // Check meta description
  if (!pageDescription || pageDescription.trim().length === 0) {
    suggestions.push({
      id: `seo-${++suggestionId}`,
      type: "seo",
      severity: "critical",
      title: "Missing meta description",
      description: "Add a meta description to improve click-through rates from search results.",
      autoFixable: true,
    });
  } else if (pageDescription.length < 120) {
    suggestions.push({
      id: `seo-${++suggestionId}`,
      type: "seo",
      severity: "info",
      title: "Meta description could be longer",
      description: "Meta descriptions should be 150-160 characters for best results.",
      currentValue: pageDescription,
      autoFixable: true,
    });
  }

  // Check for H1 (usually in Hero component)
  const hasH1 = puckData.content?.some(
    c => c.type === "Hero" || (c.type === "Heading" && c.props?.level === 1)
  );
  if (!hasH1) {
    suggestions.push({
      id: `seo-${++suggestionId}`,
      type: "seo",
      severity: "warning",
      title: "No H1 heading found",
      description: "Each page should have one H1 heading (usually in the Hero section).",
      autoFixable: false,
    });
  }

  return suggestions;
}

function analyzeConversion(puckData: PuckData): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];
  let suggestionId = 0;

  if (!puckData.content) return suggestions;

  const componentTypes = puckData.content.map(c => c.type);

  // Check for CTA
  const hasCTA = componentTypes.some(t => 
    ["CTA", "ContactForm", "Newsletter", "Button"].includes(t)
  );
  if (!hasCTA) {
    suggestions.push({
      id: `conversion-${++suggestionId}`,
      type: "conversion",
      severity: "critical",
      title: "No clear call-to-action",
      description: "Add a CTA section, contact form, or newsletter signup to capture leads.",
      autoFixable: false,
    });
  }

  // Check for social proof
  const hasSocialProof = componentTypes.some(t =>
    ["Testimonials", "LogoCloud", "Stats", "Reviews"].includes(t)
  );
  if (!hasSocialProof) {
    suggestions.push({
      id: `conversion-${++suggestionId}`,
      type: "conversion",
      severity: "warning",
      title: "Missing social proof",
      description: "Add testimonials, client logos, or statistics to build trust.",
      autoFixable: false,
    });
  }

  // Check CTA button text
  for (const component of puckData.content) {
    if (component.props) {
      const ctaFields = ["ctaText", "buttonText", "primaryButton", "submitText"];
      for (const field of ctaFields) {
        const value = component.props[field];
        if (typeof value === "string") {
          const weakCTAs = ["submit", "click here", "learn more", "read more"];
          if (weakCTAs.includes(value.toLowerCase())) {
            suggestions.push({
              id: `conversion-${++suggestionId}`,
              type: "conversion",
              severity: "info",
              title: "Weak CTA button text",
              description: "Use action-oriented, specific button text like 'Get Started Free' or 'Book Your Demo'.",
              componentType: component.type,
              field,
              currentValue: value,
              autoFixable: true,
            });
          }
        }
      }
    }
  }

  return suggestions;
}

// ============================================
// Main Analysis Function
// ============================================

export async function analyzePageContent(
  context: PageAnalysisContext
): Promise<OptimizationResult> {
  try {
    const { puckData, pageTitle, pageDescription } = context;
    
    // Extract content
    const texts = extractTextContent(puckData);
    const images = extractImages(puckData);

    // Run local analyses
    const readabilitySuggestions = analyzeReadability(texts);
    const accessibilitySuggestions = analyzeAccessibility(puckData, images);
    const seoSuggestions = analyzeSEOBasics(puckData, pageTitle, pageDescription);
    const conversionSuggestions = analyzeConversion(puckData);

    // Combine all suggestions
    const allSuggestions = [
      ...seoSuggestions,
      ...conversionSuggestions,
      ...readabilitySuggestions,
      ...accessibilitySuggestions,
    ];

    // Calculate scores
    const criticalCount = allSuggestions.filter(s => s.severity === "critical").length;
    const warningCount = allSuggestions.filter(s => s.severity === "warning").length;
    const infoCount = allSuggestions.filter(s => s.severity === "info").length;

    // Calculate overall score (simplified)
    const baseScore = 100;
    const overallScore = Math.max(0, baseScore - (criticalCount * 15) - (warningCount * 5) - (infoCount * 2));

    // Calculate category scores
    const seoScore = Math.max(0, 100 - (seoSuggestions.filter(s => s.severity === "critical").length * 20) - (seoSuggestions.filter(s => s.severity === "warning").length * 10));
    const conversionScore = Math.max(0, 100 - (conversionSuggestions.filter(s => s.severity === "critical").length * 20) - (conversionSuggestions.filter(s => s.severity === "warning").length * 10));
    const readabilityScore = Math.max(0, 100 - (readabilitySuggestions.length * 10));
    const accessibilityScore = Math.max(0, 100 - (accessibilitySuggestions.filter(s => s.severity === "critical").length * 25) - (accessibilitySuggestions.filter(s => s.severity === "warning").length * 10));

    return {
      success: true,
      score: Math.round(overallScore),
      suggestions: allSuggestions,
      summary: {
        seo: Math.round(seoScore),
        conversion: Math.round(conversionScore),
        readability: Math.round(readabilityScore),
        accessibility: Math.round(accessibilityScore),
      },
    };
  } catch (error) {
    console.error("Content analysis error:", error);
    return {
      success: false,
      score: 0,
      suggestions: [],
      summary: { seo: 0, conversion: 0, readability: 0, accessibility: 0 },
      error: error instanceof Error ? error.message : "Analysis failed",
    };
  }
}

// ============================================
// AI-Powered Deep Analysis
// ============================================

export async function getAIOptimizations(
  context: PageAnalysisContext
): Promise<OptimizationSuggestion[]> {
  const texts = extractTextContent(context.puckData);
  const allText = texts.join("\n\n");

  if (allText.length < 50) {
    return [];
  }

  const prompt = `Analyze this website content and provide specific optimization suggestions.

PAGE CONTENT:
${allText.substring(0, 3000)}

PAGE GOAL: ${context.pageGoal || "conversion"}
TARGET AUDIENCE: ${context.targetAudience || "general"}
TARGET KEYWORDS: ${context.targetKeywords?.join(", ") || "none specified"}

Analyze for:
1. SEO improvements (keyword usage, headings, meta content)
2. Conversion optimization (CTAs, value proposition, urgency)
3. Readability (clarity, sentence structure, tone)
4. Engagement (emotional appeal, storytelling, benefits vs features)

Return a JSON array of suggestions:
[
  {
    "type": "seo" | "conversion" | "readability" | "engagement",
    "severity": "critical" | "warning" | "info",
    "title": "Short title",
    "description": "Detailed suggestion",
    "suggestedValue": "Improved text if applicable"
  }
]

Return ONLY the JSON array, maximum 5 suggestions:`;

  try {
    const response = await anthropic.messages.create({
      model: AI_MODELS.haiku,
      max_tokens: 1500,
      temperature: 0.3,
      messages: [{ role: "user", content: prompt }],
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return [];
    }

    const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }

    const suggestions = JSON.parse(jsonMatch[0]) as Array<{
      type: OptimizationType;
      severity: "critical" | "warning" | "info";
      title: string;
      description: string;
      suggestedValue?: string;
    }>;

    return suggestions.map((s, i) => ({
      ...s,
      id: `ai-${Date.now()}-${i}`,
      autoFixable: !!s.suggestedValue,
    }));
  } catch (error) {
    console.error("AI optimization error:", error);
    return [];
  }
}
