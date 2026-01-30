/**
 * Puck Page Generation Service
 * 
 * AI service for generating full Puck pages from descriptions.
 * Part of PHASE-ED-05B: AI Editor - Custom Generation
 */

import { anthropic, AI_MODELS, GENERATION_CONFIG } from "./config";
import { checkRateLimit, recordRateLimitedAction } from "@/lib/rate-limit";
import { checkContent, sanitizePrompt, getHighestSeverity } from "@/lib/safety";
import type { Data as PuckData, ComponentData } from "@puckeditor/core";

// ============================================
// Types
// ============================================

export interface PageGenerationContext {
  description: string;
  industry?: string;
  style?: "modern" | "classic" | "minimal" | "bold" | "playful";
  colorScheme?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  targetAudience?: string;
  sections?: readonly string[] | string[];
  tone?: "professional" | "friendly" | "casual" | "luxury" | "technical";
  existingBranding?: {
    companyName?: string;
    tagline?: string;
    logoUrl?: string;
  };
}

export interface GenerationResult {
  success: boolean;
  data?: PuckData;
  error?: string;
  tokensUsed?: number;
}

export interface ComponentGenerationContext {
  componentType: string;
  pageContext: PageGenerationContext;
  position?: "start" | "middle" | "end";
  existingContent?: string[];
}

// ============================================
// Page Generation Prompt
// ============================================

function buildPageGenerationPrompt(context: PageGenerationContext): string {
  return `You are an expert website designer. Generate a complete Puck editor page structure based on the following requirements.

BUSINESS DESCRIPTION:
${context.description}

${context.industry ? `INDUSTRY: ${context.industry}` : ""}
${context.style ? `DESIGN STYLE: ${context.style}` : ""}
${context.tone ? `TONE: ${context.tone}` : ""}
${context.targetAudience ? `TARGET AUDIENCE: ${context.targetAudience}` : ""}
${context.existingBranding?.companyName ? `COMPANY NAME: ${context.existingBranding.companyName}` : ""}
${context.existingBranding?.tagline ? `TAGLINE: ${context.existingBranding.tagline}` : ""}

${context.sections?.length ? `REQUIRED SECTIONS: ${context.sections.join(", ")}` : "Include appropriate sections based on the business type."}

COLOR SCHEME:
${context.colorScheme?.primary ? `Primary: ${context.colorScheme.primary}` : "Use a professional primary color"}
${context.colorScheme?.secondary ? `Secondary: ${context.colorScheme.secondary}` : ""}
${context.colorScheme?.accent ? `Accent: ${context.colorScheme.accent}` : ""}

OUTPUT FORMAT:
Return a JSON object matching the Puck editor data format. The structure should be:

{
  "content": [
    {
      "type": "ComponentName",
      "props": { ... component specific props }
    }
  ],
  "root": {
    "props": {
      "title": "Page Title for SEO",
      "description": "Meta description for SEO"
    }
  }
}

AVAILABLE COMPONENTS:
- Hero (title, subtitle, backgroundImage, ctaText, ctaLink, alignment)
- Features (title, subtitle, features: [{icon, title, description}], columns)
- Testimonials (title, testimonials: [{quote, author, role, avatar}])
- CTA (title, subtitle, primaryButton, secondaryButton, backgroundColor)
- FAQ (title, faqs: [{question, answer}])
- Stats (stats: [{value, label, description}])
- Team (title, members: [{name, role, image, bio}])
- ContactForm (title, subtitle, fields, submitText)
- Newsletter (title, subtitle, placeholder, buttonText)
- Navbar (logo, links: [{label, href}], ctaText)
- Footer (logo, columns: [{title, links}], copyright)
- Gallery (images: [{src, alt, caption}], columns)
- Pricing (title, plans: [{name, price, features, ctaText, popular}])
- LogoCloud (title, logos: [{src, alt, href}])
- Video (url, poster, autoplay, title)

RULES:
1. Generate realistic, professional content - no placeholder text like "Lorem ipsum"
2. Use image URLs from picsum.photos with appropriate dimensions
3. Create compelling copy that matches the tone
4. Include all required sections in logical order
5. Output ONLY valid JSON - no markdown, no explanations

Generate the page now:`;
}

// ============================================
// Page Generation Function
// ============================================

export async function generatePuckPage(
  context: PageGenerationContext,
  userId?: string
): Promise<GenerationResult> {
  // 1. Rate limit check
  if (userId) {
    const rateLimit = await checkRateLimit(userId, "aiPageGeneration");
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: `Rate limit exceeded. Please try again in ${Math.ceil(
          (rateLimit.retryAfter || 3600) / 60
        )} minutes.`,
      };
    }
  }

  // 2. Safety check
  const contentToCheck = `${context.description} ${context.industry || ""} ${
    context.existingBranding?.companyName || ""
  }`;
  const sanitization = sanitizePrompt(contentToCheck);
  const safetyCheck = checkContent(sanitization.sanitized, {
    enabledCategories: [
      "violence",
      "hate_speech",
      "sexual",
      "self_harm",
      "illegal",
      "spam",
    ],
    severityThreshold: "medium",
    logViolations: true,
    autoSanitize: false,
    includeContext: false,
  });

  if (!safetyCheck.safe) {
    const severity = getHighestSeverity(safetyCheck.violations);
    if (severity === "critical" || severity === "high") {
      return {
        success: false,
        error: "Content request flagged for safety review",
      };
    }
  }

  // 3. Generate page
  try {
    const prompt = buildPageGenerationPrompt(context);

    const response = await anthropic.messages.create({
      model: AI_MODELS.sonnet,
      max_tokens: GENERATION_CONFIG.maxTokens,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return { success: false, error: "No response from AI" };
    }

    // Parse JSON response
    let pageData: PuckData;
    try {
      // Try to extract JSON from the response
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      pageData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return { success: false, error: "Failed to parse generated page" };
    }

    // Validate structure
    if (!pageData.content || !Array.isArray(pageData.content)) {
      return { success: false, error: "Invalid page structure generated" };
    }

    // Record rate limit usage
    if (userId) {
      await recordRateLimitedAction(userId, "aiPageGeneration");
    }

    return {
      success: true,
      data: pageData,
      tokensUsed: response.usage?.output_tokens,
    };
  } catch (error) {
    console.error("Page generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Generation failed",
    };
  }
}

// ============================================
// Component Generation Function
// ============================================

function buildComponentGenerationPrompt(context: ComponentGenerationContext): string {
  return `Generate a single ${context.componentType} component for a website.

CONTEXT:
Business: ${context.pageContext.description}
${context.pageContext.industry ? `Industry: ${context.pageContext.industry}` : ""}
${context.pageContext.tone ? `Tone: ${context.pageContext.tone}` : ""}
Position on page: ${context.position || "middle"}

${context.existingContent?.length ? `EXISTING CONTENT ON PAGE:\n${context.existingContent.join("\n")}\n\nMake sure the new component complements but doesn't repeat existing content.` : ""}

OUTPUT FORMAT:
Return ONLY a JSON object for the component:
{
  "type": "${context.componentType}",
  "props": { ... all required props with realistic content }
}

Generate compelling, realistic content - no placeholder text.
Use picsum.photos URLs for any images.
Output ONLY the JSON object:`;
}

export async function generateSingleComponent(
  context: ComponentGenerationContext,
  userId?: string
): Promise<{ success: boolean; component?: ComponentData; error?: string }> {
  // Rate limit check
  if (userId) {
    const rateLimit = await checkRateLimit(userId, "aiComponentGeneration");
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: "Rate limit exceeded",
      };
    }
  }

  try {
    const prompt = buildComponentGenerationPrompt(context);

    const response = await anthropic.messages.create({
      model: AI_MODELS.sonnet,
      max_tokens: 2048,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return { success: false, error: "No response from AI" };
    }

    // Parse JSON response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: false, error: "No valid component found" };
    }

    const component = JSON.parse(jsonMatch[0]) as ComponentData;

    if (userId) {
      await recordRateLimitedAction(userId, "aiComponentGeneration");
    }

    return { success: true, component };
  } catch (error) {
    console.error("Component generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Generation failed",
    };
  }
}

// ============================================
// Page Layout Templates
// ============================================

export const PAGE_TEMPLATES = {
  landing: {
    name: "Landing Page",
    description: "High-converting landing page with hero, features, testimonials, and CTA",
    sections: ["Hero", "Features", "Testimonials", "Pricing", "FAQ", "CTA", "Footer"],
  },
  business: {
    name: "Business Website",
    description: "Professional business website with services and about sections",
    sections: ["Navbar", "Hero", "Features", "Team", "Testimonials", "ContactForm", "Footer"],
  },
  portfolio: {
    name: "Portfolio",
    description: "Creative portfolio showcasing work and skills",
    sections: ["Navbar", "Hero", "Gallery", "Stats", "Testimonials", "ContactForm", "Footer"],
  },
  saas: {
    name: "SaaS Product",
    description: "Software product page with pricing and features",
    sections: ["Navbar", "Hero", "LogoCloud", "Features", "Pricing", "FAQ", "CTA", "Footer"],
  },
  ecommerce: {
    name: "E-Commerce",
    description: "Product-focused page for online stores",
    sections: ["Navbar", "Hero", "Features", "Gallery", "Testimonials", "CTA", "Newsletter", "Footer"],
  },
  blog: {
    name: "Blog / Content",
    description: "Content-focused layout for blogs and articles",
    sections: ["Navbar", "Hero", "Features", "Newsletter", "Footer"],
  },
} as const;

export type PageTemplateType = keyof typeof PAGE_TEMPLATES;

// ============================================
// Style Presets
// ============================================

export const STYLE_PRESETS = {
  modern: {
    name: "Modern",
    description: "Clean, contemporary design with bold typography",
    characteristics: "Sharp corners, sans-serif fonts, whitespace",
  },
  classic: {
    name: "Classic",
    description: "Timeless, elegant design with traditional elements",
    characteristics: "Serif fonts, subtle colors, refined details",
  },
  minimal: {
    name: "Minimal",
    description: "Stripped-down design focusing on essentials",
    characteristics: "Maximum whitespace, few colors, simple shapes",
  },
  bold: {
    name: "Bold",
    description: "High-impact design with strong visual elements",
    characteristics: "Large typography, vibrant colors, dramatic contrasts",
  },
  playful: {
    name: "Playful",
    description: "Fun, energetic design with creative elements",
    characteristics: "Rounded shapes, bright colors, animations",
  },
} as const;

export type StylePresetType = keyof typeof STYLE_PRESETS;

// ============================================
// Industry Presets
// ============================================

export const INDUSTRY_PRESETS = {
  technology: {
    name: "Technology",
    suggestedStyle: "modern",
    suggestedTone: "professional",
    suggestedSections: ["Hero", "Features", "Stats", "Pricing", "FAQ"],
  },
  healthcare: {
    name: "Healthcare",
    suggestedStyle: "classic",
    suggestedTone: "professional",
    suggestedSections: ["Hero", "Features", "Team", "Testimonials", "ContactForm"],
  },
  retail: {
    name: "Retail / E-Commerce",
    suggestedStyle: "modern",
    suggestedTone: "friendly",
    suggestedSections: ["Hero", "Features", "Gallery", "Testimonials", "Newsletter"],
  },
  education: {
    name: "Education",
    suggestedStyle: "classic",
    suggestedTone: "friendly",
    suggestedSections: ["Hero", "Features", "Team", "FAQ", "ContactForm"],
  },
  creative: {
    name: "Creative / Design",
    suggestedStyle: "bold",
    suggestedTone: "casual",
    suggestedSections: ["Hero", "Gallery", "Testimonials", "ContactForm"],
  },
  finance: {
    name: "Finance",
    suggestedStyle: "classic",
    suggestedTone: "professional",
    suggestedSections: ["Hero", "Features", "Stats", "Team", "ContactForm"],
  },
  hospitality: {
    name: "Hospitality",
    suggestedStyle: "modern",
    suggestedTone: "friendly",
    suggestedSections: ["Hero", "Gallery", "Features", "Testimonials", "ContactForm"],
  },
  nonprofit: {
    name: "Nonprofit",
    suggestedStyle: "minimal",
    suggestedTone: "friendly",
    suggestedSections: ["Hero", "Stats", "Team", "Testimonials", "CTA", "Newsletter"],
  },
} as const;

export type IndustryPresetType = keyof typeof INDUSTRY_PRESETS;
