/**
 * DRAMAC Studio AI Configuration
 * 
 * AI-powered editing actions for the Studio editor.
 * Standalone implementation after Puck removal.
 * 
 * @phase STUDIO-27 - Platform Integration & Puck Removal
 */

import OpenAI from "openai";

// ============================================================================
// Types
// ============================================================================

export type AIActionType =
  | "improve_text"
  | "fix_grammar"
  | "expand_content"
  | "summarize"
  | "change_tone"
  | "translate"
  | "generate_alt_text"
  | "suggest_colors"
  | "generate_component"
  | "optimize_seo";

export interface AIAction {
  label: string;
  description: string;
  icon: string;
  systemPrompt: string;
  requiresSelection?: boolean;
}

export interface AIActionRequest {
  action: AIActionType;
  content: string;
  context?: string;
  params?: Record<string, string>;
}

export interface AIActionResult {
  success: boolean;
  result?: string;
  error?: string;
}

// ============================================================================
// AI Actions Configuration
// ============================================================================

export const AI_ACTIONS: Record<AIActionType, AIAction> = {
  improve_text: {
    label: "Improve Text",
    description: "Enhance the writing quality and clarity",
    icon: "Sparkles",
    systemPrompt: `You are an expert content editor. Improve the given text to be clearer, more engaging, and professional while maintaining the original meaning. Return only the improved text without explanations.`,
  },
  fix_grammar: {
    label: "Fix Grammar",
    description: "Correct grammar and spelling errors",
    icon: "CircleCheck",
    systemPrompt: `You are a grammar expert. Fix all grammar, spelling, and punctuation errors in the given text. Return only the corrected text without explanations.`,
  },
  expand_content: {
    label: "Expand Content",
    description: "Add more detail and depth",
    icon: "Plus",
    systemPrompt: `You are a content writer. Expand the given text with more details, examples, or explanations while maintaining the original tone and context. Return only the expanded text.`,
  },
  summarize: {
    label: "Summarize",
    description: "Create a concise summary",
    icon: "Minimize2",
    systemPrompt: `You are an expert at summarization. Create a clear, concise summary of the given text that captures the key points. Return only the summary.`,
  },
  change_tone: {
    label: "Change Tone",
    description: "Adjust the writing tone",
    icon: "Volume2",
    systemPrompt: `You are a content editor. Change the tone of the text to be {tone}. Maintain the meaning while adjusting the style. Return only the modified text.`,
  },
  translate: {
    label: "Translate",
    description: "Translate to another language",
    icon: "Globe",
    systemPrompt: `You are a professional translator. Translate the given text to {language} accurately while preserving the meaning and tone. Return only the translation.`,
  },
  generate_alt_text: {
    label: "Generate Alt Text",
    description: "Create accessible image descriptions",
    icon: "Image",
    systemPrompt: `You are an accessibility expert. Generate a concise, descriptive alt text for the image based on the provided context or URL. The alt text should be under 125 characters and describe the image content clearly for screen readers.`,
  },
  suggest_colors: {
    label: "Suggest Colors",
    description: "Get color palette suggestions",
    icon: "Palette",
    systemPrompt: `You are a design expert. Based on the context provided, suggest a harmonious color palette with 5 colors in hex format. Return the colors as a JSON array like: {"colors": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"], "description": "brief description of the palette"}`,
  },
  generate_component: {
    label: "Generate Component",
    description: "Create a new component from description",
    icon: "Box",
    systemPrompt: `You are a web design expert. Generate a component configuration based on the user's description. Return valid JSON matching the Studio component structure with type, props, and content.`,
  },
  optimize_seo: {
    label: "Optimize SEO",
    description: "Improve content for search engines",
    icon: "Search",
    systemPrompt: `You are an SEO expert. Analyze the given content and suggest improvements for better search engine visibility. Include recommended title, meta description, and content enhancements. Return as JSON.`,
  },
};

// ============================================================================
// AI Client
// ============================================================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// ============================================================================
// Execute AI Action
// ============================================================================

export async function executeAIAction(
  request: AIActionRequest
): Promise<AIActionResult> {
  try {
    const { action, content, context, params } = request;
    const actionConfig = AI_ACTIONS[action];

    if (!actionConfig) {
      return {
        success: false,
        error: `Unknown action: ${action}`,
      };
    }

    // Build the system prompt with parameter substitution
    let systemPrompt = actionConfig.systemPrompt;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        systemPrompt = systemPrompt.replace(`{${key}}`, value);
      });
    }

    // Build the user message
    let userMessage = content;
    if (context) {
      userMessage = `Context: ${context}\n\nContent: ${content}`;
    }

    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const result = response.choices[0]?.message?.content;

    if (!result) {
      return {
        success: false,
        error: "No response from AI",
      };
    }

    return {
      success: true,
      result,
    };
  } catch (error) {
    console.error("AI action error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "AI action failed",
    };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

export function getAvailableActions(): Array<{
  type: AIActionType;
  label: string;
  description: string;
  icon: string;
}> {
  return Object.entries(AI_ACTIONS).map(([type, config]) => ({
    type: type as AIActionType,
    label: config.label,
    description: config.description,
    icon: config.icon,
  }));
}
