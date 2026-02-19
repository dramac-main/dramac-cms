/**
 * AI Provider Configuration
 * 
 * Centralized configuration for AI models used throughout the website designer.
 * Anthropic Claude is the default provider for superior structured output quality.
 * OpenAI kept as fallback option.
 * 
 * QUALITY NOTE:
 * OpenAI's strict structured output mode rejects many valid Zod patterns
 * (z.record, .optional, .min/.max, z.unknown) and even with strictJsonSchema:false
 * produces inferior creative output. Claude handles complex schemas natively
 * and produces significantly better website designs.
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
      model: "claude-sonnet-4-6",
      description: "Best quality for architecture and page content",
    },
    standard: {
      provider: "anthropic",
      model: "claude-sonnet-4-6",
      description: "Good quality for navbar and footer",
    },
    fast: {
      provider: "anthropic",
      model: "claude-haiku-4-5-20251001",
      description: "Fast and cheap for simple analysis tasks",
    },
  },
};

// =============================================================================
// DEFAULT CONFIGURATION
// =============================================================================

/**
 * Default provider - ANTHROPIC for quality. OpenAI structured output too restrictive.
 */
const DEFAULT_PROVIDER: AIProvider = "anthropic";

/**
 * Task-specific model tier assignments
 * 
 * HYBRID approach for quality + speed within Vercel Hobby 60s timeout:
 * - Page content uses PREMIUM (Sonnet 4.6) — better headlines, CTAs, descriptions
 * - Everything else uses FAST (Haiku 4.5) — structured/constrained outputs
 * 
 * Budget: ~8s arch(Haiku) + ~18s pages(Sonnet, parallel) + ~5s nav/footer(Haiku) = ~31s
 */
const TASK_TIERS: Record<string, AIModelTier> = {
  // Structured outputs — Haiku is equally good here (blueprints dictate structure)
  "architecture": "fast",
  "navbar": "fast",
  "footer": "fast",
  
  // Creative content — Sonnet 4.6 writes noticeably better copy
  "page-content": "premium",
  "iteration": "premium",
  
  // Other tasks (only used when features are explicitly enabled)
  "refinement": "fast",
  "module-configurator": "fast",
  "content-generation": "premium",
  "design-inspiration": "fast",
  "module-analysis": "fast",
  "content-optimization": "fast",
  "responsive": "fast",
  
  // Default fallback
  "default": "fast",
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
export function getModelInfo(
  task: keyof typeof TASK_TIERS | string,
  providerOverride?: AIProvider
): {
  provider: AIProvider;
  model: string;
  tier: AIModelTier;
} {
  const provider = providerOverride || DEFAULT_PROVIDER;
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

  // Claude Haiku 4.5 pricing (all tasks use fast tier)
  const inputCostPer1M = 1;    // $1 per 1M input tokens
  const outputCostPer1M = 5;   // $5 per 1M output tokens
  
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
