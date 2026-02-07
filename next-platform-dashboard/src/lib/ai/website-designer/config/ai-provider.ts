/**
 * AI Provider Configuration
 * 
 * Centralized configuration for AI models used throughout the website designer.
 * Switch between OpenAI and Anthropic easily. OpenAI is default for cost efficiency.
 * 
 * COST COMPARISON (as of 2026):
 * - GPT-4o: ~$5/1M input, $15/1M output
 * - GPT-4o-mini: ~$0.15/1M input, $0.60/1M output  
 * - Claude Sonnet 4: ~$3/1M input, $15/1M output
 * 
 * For high-volume usage, OpenAI provides better value with comparable quality.
 */

import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";

// =============================================================================
// PROVIDER CONFIGURATION
// =============================================================================

export type AIProvider = "openai" | "anthropic";
export type AIModelTier = "premium" | "standard" | "fast";

interface AIModelConfig {
  provider: AIProvider;
  model: string;
  description: string;
}

/**
 * Model configurations by tier and provider
 */
const MODEL_CONFIGS: Record<AIProvider, Record<AIModelTier, AIModelConfig>> = {
  openai: {
    premium: {
      provider: "openai",
      model: "gpt-4o",
      description: "Best quality, higher cost - for critical generation",
    },
    standard: {
      provider: "openai",
      model: "gpt-4o",
      description: "Good balance of quality and cost",
    },
    fast: {
      provider: "openai",
      model: "gpt-4o-mini",
      description: "Fastest and cheapest - for simple tasks",
    },
  },
  anthropic: {
    premium: {
      provider: "anthropic",
      model: "claude-sonnet-4-20250514",
      description: "Best structured output quality",
    },
    standard: {
      provider: "anthropic",
      model: "claude-sonnet-4-20250514",
      description: "Same as premium for Anthropic",
    },
    fast: {
      provider: "anthropic",
      model: "claude-sonnet-4-20250514",
      description: "Anthropic doesn't have a fast tier",
    },
  },
};

// =============================================================================
// DEFAULT CONFIGURATION
// =============================================================================

/**
 * Default provider - SET TO OPENAI FOR COST EFFICIENCY
 */
const DEFAULT_PROVIDER: AIProvider = "openai";

/**
 * Task-specific model tier assignments
 * Premium: Architecture, Page Content (quality critical)
 * Standard: Navbar, Footer, Refinement
 * Fast: Design inspiration, simple analysis
 */
const TASK_TIERS: Record<string, AIModelTier> = {
  // Critical - affects entire site structure
  "architecture": "premium",
  "page-content": "premium",
  "iteration": "premium",
  
  // Important but more constrained
  "navbar": "standard",
  "footer": "standard",
  "refinement": "standard",
  "module-configurator": "standard",
  "content-generation": "standard",
  
  // Simpler tasks
  "design-inspiration": "fast",
  "module-analysis": "fast",
  "content-optimization": "fast",
  "responsive": "fast",
  
  // Default fallback
  "default": "standard",
};

// =============================================================================
// MODEL GETTER
// =============================================================================

/**
 * Get the AI model for a specific task
 * 
 * @param task - The task type (architecture, page-content, navbar, etc.)
 * @param providerOverride - Override the default provider
 * @returns The configured AI model instance
 */
export function getAIModel(
  task: keyof typeof TASK_TIERS | string,
  providerOverride?: AIProvider
) {
  const provider = providerOverride || DEFAULT_PROVIDER;
  const tier = TASK_TIERS[task] || "standard";
  const config = MODEL_CONFIGS[provider][tier];
  
  if (provider === "openai") {
    return openai(config.model);
  } else {
    return anthropic(config.model);
  }
}

/**
 * Get model info for logging/debugging
 */
export function getModelInfo(task: keyof typeof TASK_TIERS | string): {
  provider: AIProvider;
  model: string;
  tier: AIModelTier;
} {
  const provider = DEFAULT_PROVIDER;
  const tier = TASK_TIERS[task] || "standard";
  const config = MODEL_CONFIGS[provider][tier];
  
  return {
    provider: config.provider,
    model: config.model,
    tier,
  };
}

/**
 * Estimate cost for a generation (rough estimate)
 * Based on typical token counts for each task
 */
export function estimateCost(tasks: (keyof typeof TASK_TIERS)[]): {
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCostUSD: number;
} {
  const tokenEstimates: Record<string, { input: number; output: number }> = {
    "architecture": { input: 3000, output: 2000 },
    "page-content": { input: 4000, output: 3000 },
    "navbar": { input: 2000, output: 1000 },
    "footer": { input: 2000, output: 1000 },
    "refinement": { input: 3000, output: 2000 },
    "design-inspiration": { input: 1500, output: 1000 },
    "module-analysis": { input: 1500, output: 500 },
    "content-optimization": { input: 2000, output: 1500 },
  };

  let totalInput = 0;
  let totalOutput = 0;

  for (const task of tasks) {
    const estimate = tokenEstimates[task] || { input: 2000, output: 1500 };
    totalInput += estimate.input;
    totalOutput += estimate.output;
  }

  // GPT-4o pricing
  const inputCostPer1M = 5;
  const outputCostPer1M = 15;
  
  const estimatedCostUSD = 
    (totalInput / 1_000_000) * inputCostPer1M +
    (totalOutput / 1_000_000) * outputCostPer1M;

  return {
    estimatedInputTokens: totalInput,
    estimatedOutputTokens: totalOutput,
    estimatedCostUSD: Math.round(estimatedCostUSD * 1000) / 1000,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export { DEFAULT_PROVIDER, TASK_TIERS, MODEL_CONFIGS };
