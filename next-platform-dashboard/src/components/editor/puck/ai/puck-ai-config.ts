/**
 * Puck AI Plugin Configuration
 * 
 * Configuration and utilities for AI-powered editing assistance in the Puck editor.
 * Part of PHASE-ED-05A: AI Editor - Puck AI Plugin Integration
 */

import { anthropic, AI_MODELS, GENERATION_CONFIG } from "@/lib/ai/config";

// ============================================
// AI Action Types
// ============================================

export type AIActionType =
  | "improve"
  | "simplify"
  | "expand"
  | "shorten"
  | "translate"
  | "rephrase"
  | "make_professional"
  | "make_friendly"
  | "fix_grammar"
  | "generate_headline"
  | "generate_cta"
  | "generate_description";

export interface AIAction {
  type: AIActionType;
  label: string;
  description: string;
  icon: string;
  prompt: string;
}

// ============================================
// AI Actions Library
// ============================================

export const AI_ACTIONS: Record<AIActionType, AIAction> = {
  improve: {
    type: "improve",
    label: "Improve",
    description: "Enhance the content for better clarity and impact",
    icon: "Sparkles",
    prompt: `Improve this content to be more engaging, clear, and impactful. 
Keep the same meaning but make it more compelling. 
Return ONLY the improved text, nothing else.`,
  },
  simplify: {
    type: "simplify",
    label: "Simplify",
    description: "Make the content easier to read and understand",
    icon: "FileText",
    prompt: `Simplify this content to be easier to read and understand.
Use shorter sentences and simpler words.
Return ONLY the simplified text, nothing else.`,
  },
  expand: {
    type: "expand",
    label: "Expand",
    description: "Add more detail and context to the content",
    icon: "Maximize2",
    prompt: `Expand this content with more detail, examples, or context.
Make it more comprehensive while keeping it engaging.
Return ONLY the expanded text, nothing else.`,
  },
  shorten: {
    type: "shorten",
    label: "Shorten",
    description: "Make the content more concise",
    icon: "Minimize2",
    prompt: `Shorten this content to be more concise.
Keep the key message but remove unnecessary words.
Return ONLY the shortened text, nothing else.`,
  },
  translate: {
    type: "translate",
    label: "Translate",
    description: "Translate content to another language",
    icon: "Languages",
    prompt: `Translate this content to {{language}}.
Maintain the same tone and meaning.
Return ONLY the translated text, nothing else.`,
  },
  rephrase: {
    type: "rephrase",
    label: "Rephrase",
    description: "Say the same thing differently",
    icon: "RefreshCw",
    prompt: `Rephrase this content to say the same thing in a different way.
Keep the meaning but use different wording.
Return ONLY the rephrased text, nothing else.`,
  },
  make_professional: {
    type: "make_professional",
    label: "Make Professional",
    description: "Adjust tone for business/professional contexts",
    icon: "Briefcase",
    prompt: `Rewrite this content in a professional, business-appropriate tone.
Make it suitable for corporate communications.
Return ONLY the professional version, nothing else.`,
  },
  make_friendly: {
    type: "make_friendly",
    label: "Make Friendly",
    description: "Adjust tone to be more warm and approachable",
    icon: "Smile",
    prompt: `Rewrite this content in a friendly, warm, and approachable tone.
Make it feel more personal and conversational.
Return ONLY the friendly version, nothing else.`,
  },
  fix_grammar: {
    type: "fix_grammar",
    label: "Fix Grammar",
    description: "Correct grammar, spelling, and punctuation",
    icon: "Check",
    prompt: `Fix any grammar, spelling, or punctuation errors in this content.
Keep the meaning and style the same.
Return ONLY the corrected text, nothing else.`,
  },
  generate_headline: {
    type: "generate_headline",
    label: "Generate Headlines",
    description: "Create compelling headline variations",
    icon: "Type",
    prompt: `Based on this content, generate 5 compelling headline variations.
Make them attention-grabbing and suitable for marketing.
Return ONLY the headlines, one per line, numbered 1-5.`,
  },
  generate_cta: {
    type: "generate_cta",
    label: "Generate CTAs",
    description: "Create call-to-action button text options",
    icon: "MousePointerClick",
    prompt: `Based on this content context, generate 5 call-to-action button text options.
Make them action-oriented and compelling.
Return ONLY the CTA texts, one per line, numbered 1-5.`,
  },
  generate_description: {
    type: "generate_description",
    label: "Generate Description",
    description: "Create a description based on context",
    icon: "AlignLeft",
    prompt: `Based on this context, generate a compelling description.
Make it engaging and informative.
Return ONLY the description, nothing else.`,
  },
};

// ============================================
// AI Quick Actions (for toolbar)
// ============================================

export const QUICK_ACTIONS: AIActionType[] = [
  "improve",
  "simplify",
  "expand",
  "shorten",
  "fix_grammar",
];

// ============================================
// AI Configuration
// ============================================

export interface AIPluginConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  enabledActions: AIActionType[];
  customPrompts?: Record<string, string>;
}

export const DEFAULT_AI_CONFIG: AIPluginConfig = {
  model: AI_MODELS.sonnet,
  maxTokens: 2048,
  temperature: 0.7,
  enabledActions: Object.keys(AI_ACTIONS) as AIActionType[],
};

// ============================================
// AI Execution
// ============================================

export interface AIExecutionRequest {
  action: AIActionType;
  content: string;
  context?: string;
  params?: Record<string, string>;
}

export interface AIExecutionResult {
  success: boolean;
  result?: string;
  alternatives?: string[];
  error?: string;
  tokensUsed?: number;
}

/**
 * Execute an AI action on content
 */
export async function executeAIAction(
  request: AIExecutionRequest,
  config: AIPluginConfig = DEFAULT_AI_CONFIG
): Promise<AIExecutionResult> {
  const action = AI_ACTIONS[request.action];
  if (!action) {
    return { success: false, error: `Unknown action: ${request.action}` };
  }

  // Build the prompt
  let prompt = action.prompt;
  
  // Replace params in prompt
  if (request.params) {
    for (const [key, value] of Object.entries(request.params)) {
      prompt = prompt.replace(`{{${key}}}`, value);
    }
  }

  // Build full message
  const userMessage = request.context
    ? `Context: ${request.context}\n\nContent to process:\n${request.content}`
    : `Content to process:\n${request.content}`;

  try {
    const response = await anthropic.messages.create({
      model: config.model,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      messages: [
        {
          role: "user",
          content: `${prompt}\n\n${userMessage}`,
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return { success: false, error: "No text response from AI" };
    }

    const result = textContent.text.trim();

    // For generation actions that return multiple options
    if (["generate_headline", "generate_cta"].includes(request.action)) {
      const alternatives = result
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => line.replace(/^\d+[\.\)]\s*/, "").trim());

      return {
        success: true,
        result: alternatives[0] || result,
        alternatives,
        tokensUsed: response.usage?.output_tokens,
      };
    }

    return {
      success: true,
      result,
      tokensUsed: response.usage?.output_tokens,
    };
  } catch (error) {
    console.error("AI execution error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "AI execution failed",
    };
  }
}

// ============================================
// Component Context Builder
// ============================================

export interface ComponentContext {
  componentType: string;
  currentProps: Record<string, unknown>;
  pageContext?: {
    title?: string;
    description?: string;
    industry?: string;
    targetAudience?: string;
  };
}

/**
 * Build context string from component data
 */
export function buildComponentContext(context: ComponentContext): string {
  const parts: string[] = [];

  parts.push(`Component Type: ${context.componentType}`);

  if (context.pageContext) {
    if (context.pageContext.title) {
      parts.push(`Page Title: ${context.pageContext.title}`);
    }
    if (context.pageContext.description) {
      parts.push(`Page Description: ${context.pageContext.description}`);
    }
    if (context.pageContext.industry) {
      parts.push(`Industry: ${context.pageContext.industry}`);
    }
    if (context.pageContext.targetAudience) {
      parts.push(`Target Audience: ${context.pageContext.targetAudience}`);
    }
  }

  // Extract text props
  const textProps = Object.entries(context.currentProps)
    .filter(([, value]) => typeof value === "string" && value.length > 0)
    .map(([key, value]) => `${key}: ${value}`);

  if (textProps.length > 0) {
    parts.push(`Current Content:\n${textProps.join("\n")}`);
  }

  return parts.join("\n");
}

// ============================================
// Supported Languages for Translation
// ============================================

export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "nl", name: "Dutch" },
  { code: "pl", name: "Polish" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese (Simplified)" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "tr", name: "Turkish" },
  { code: "vi", name: "Vietnamese" },
  { code: "th", name: "Thai" },
  { code: "id", name: "Indonesian" },
  { code: "sv", name: "Swedish" },
  { code: "da", name: "Danish" },
  { code: "no", name: "Norwegian" },
  { code: "fi", name: "Finnish" },
];
