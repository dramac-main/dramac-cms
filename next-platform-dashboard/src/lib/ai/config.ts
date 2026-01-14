import Anthropic from "@anthropic-ai/sdk";

// Initialize Anthropic client
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Available models
export const AI_MODELS = {
  opus: "claude-sonnet-4-20250514",
  sonnet: "claude-sonnet-4-20250514",
  haiku: "claude-3-haiku-20240307",
} as const;

// Default model for site generation
export const DEFAULT_MODEL = AI_MODELS.sonnet;

// Generation settings
export const GENERATION_CONFIG = {
  maxTokens: 8192,
  temperature: 0.7,
};
