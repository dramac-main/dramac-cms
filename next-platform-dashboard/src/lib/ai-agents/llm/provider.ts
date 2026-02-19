/**
 * LLM Provider Interface
 * 
 * Phase EM-58A: AI Agents - Core Infrastructure
 * 
 * Abstract interface for LLM providers (OpenAI, Anthropic, etc.)
 */

import type { 
  Message, 
  CompletionOptions, 
  CompletionResult, 
  ToolCompletionResult,
  StreamChunk 
} from '../types'

// ============================================================================
// OPENAI TOOL FORMAT
// ============================================================================

export interface OpenAITool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

// ============================================================================
// PROVIDER INTERFACE
// ============================================================================

export interface LLMProvider {
  /**
   * Provider name
   */
  readonly name: string

  /**
   * Complete a chat conversation
   */
  complete(
    messages: Message[],
    options?: CompletionOptions
  ): Promise<CompletionResult>

  /**
   * Complete with function/tool calling
   */
  completeWithTools(
    messages: Message[],
    tools: OpenAITool[],
    options?: CompletionOptions
  ): Promise<ToolCompletionResult>

  /**
   * Stream a completion
   */
  stream(
    messages: Message[],
    options?: CompletionOptions
  ): AsyncGenerator<StreamChunk>

  /**
   * Generate embeddings for text
   */
  embed(text: string): Promise<number[]>

  /**
   * Check if the provider is available
   */
  isAvailable(): Promise<boolean>
}

// ============================================================================
// PROVIDER FACTORY
// ============================================================================

export interface LLMProviderFactory {
  create(
    providerName: string,
    config: {
      apiKey?: string
      apiEndpoint?: string
      organizationId?: string
      defaultModel?: string
    }
  ): LLMProvider
}

// ============================================================================
// PROVIDER REGISTRY
// ============================================================================

export const SUPPORTED_PROVIDERS = [
  'openai',
  'anthropic',
  'google',
  'local'
] as const

export type SupportedProvider = typeof SUPPORTED_PROVIDERS[number]

export const PROVIDER_MODELS: Record<SupportedProvider, string[]> = {
  openai: [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-4',
    'gpt-3.5-turbo'
  ],
  anthropic: [
    'claude-sonnet-4-6',
    'claude-opus-4-6',
    'claude-haiku-4-5-20251001',
  ],
  google: [
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-pro'
  ],
  local: [
    'llama3.2',
    'mistral',
    'codellama'
  ]
}

export const DEFAULT_MODELS: Record<SupportedProvider, string> = {
  openai: 'gpt-4o',
  anthropic: 'claude-sonnet-4-6',
  google: 'gemini-1.5-pro',
  local: 'llama3.2'
}

// ============================================================================
// COST TRACKING
// ============================================================================

export interface ProviderCosts {
  inputPer1k: number
  outputPer1k: number
}

export const MODEL_COSTS: Record<string, ProviderCosts> = {
  // OpenAI
  'gpt-4o': { inputPer1k: 0.0025, outputPer1k: 0.01 },
  'gpt-4o-mini': { inputPer1k: 0.00015, outputPer1k: 0.0006 },
  'gpt-4-turbo': { inputPer1k: 0.01, outputPer1k: 0.03 },
  'gpt-4': { inputPer1k: 0.03, outputPer1k: 0.06 },
  'gpt-3.5-turbo': { inputPer1k: 0.0005, outputPer1k: 0.0015 },
  
  // Anthropic (current pricing as of 2026)
  'claude-sonnet-4-6': { inputPer1k: 0.003, outputPer1k: 0.015 },
  'claude-opus-4-6': { inputPer1k: 0.005, outputPer1k: 0.025 },
  'claude-haiku-4-5-20251001': { inputPer1k: 0.001, outputPer1k: 0.005 },
  
  // Google
  'gemini-1.5-pro': { inputPer1k: 0.00125, outputPer1k: 0.005 },
  'gemini-1.5-flash': { inputPer1k: 0.000075, outputPer1k: 0.0003 },
  'gemini-pro': { inputPer1k: 0.0005, outputPer1k: 0.0015 },
  
  // Local (free)
  'llama3.2': { inputPer1k: 0, outputPer1k: 0 },
  'mistral': { inputPer1k: 0, outputPer1k: 0 },
  'codellama': { inputPer1k: 0, outputPer1k: 0 }
}

export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const costs = MODEL_COSTS[model]
  if (!costs) return 0
  
  return (
    (inputTokens / 1000) * costs.inputPer1k +
    (outputTokens / 1000) * costs.outputPer1k
  )
}
