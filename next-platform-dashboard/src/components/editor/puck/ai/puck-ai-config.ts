/**
 * Puck AI Plugin Configuration - SERVER ONLY
 * 
 * Server-side AI execution functions that use Anthropic SDK.
 * For client-side code, import from ./puck-ai-types instead.
 * Part of PHASE-ED-05A: AI Editor - Puck AI Plugin Integration
 */

import { anthropic, AI_MODELS } from "@/lib/ai/config";

// Re-export all types and constants for backward compatibility with API routes
export {
  AI_ACTIONS,
  QUICK_ACTIONS,
  SUPPORTED_LANGUAGES,
  DEFAULT_AI_CONFIG,
  buildComponentContext,
  type AIActionType,
  type AIAction,
  type AIPluginConfig,
  type AIExecutionRequest,
  type AIExecutionResult,
  type ComponentContext,
} from "./puck-ai-types";

// Import types for use in this file
import {
  AI_ACTIONS,
  DEFAULT_AI_CONFIG,
  type AIPluginConfig,
  type AIExecutionRequest,
  type AIExecutionResult,
} from "./puck-ai-types";

// ============================================
// AI Execution - SERVER ONLY
// ============================================

/**
 * Execute an AI action on content
 * This function uses the Anthropic SDK and must only be called from server-side code.
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
      model: config.model || AI_MODELS.sonnet,
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
