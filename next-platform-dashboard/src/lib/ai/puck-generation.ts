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

// Re-export types and constants from types file
export {
  PAGE_TEMPLATES,
  STYLE_PRESETS,
  INDUSTRY_PRESETS,
  type PageTemplateType,
  type StylePresetType,
  type IndustryPresetType,
  type PageGenerationContext,
  type GenerationResult,
  type ComponentGenerationContext,
} from "./puck-generation-types";

// Import types for use in this file
import type {
  PageGenerationContext,
  GenerationResult,
  ComponentGenerationContext,
} from "./puck-generation-types";

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
