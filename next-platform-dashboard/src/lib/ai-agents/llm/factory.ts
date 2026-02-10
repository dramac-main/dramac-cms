/**
 * LLM Provider Factory
 * 
 * Phase EM-58A: AI Agents - Core Infrastructure
 * 
 * Creates LLM providers based on configuration.
 */

import type { LLMProvider } from './provider'
import { OpenAIProvider } from './providers/openai'
import { AnthropicProvider } from './providers/anthropic'

export interface ProviderConfig {
  apiKey?: string
  apiEndpoint?: string
  organizationId?: string
  defaultModel?: string
}

/**
 * Create an LLM provider instance
 */
export function createProvider(
  providerName: string,
  config: ProviderConfig = {}
): LLMProvider {
  switch (providerName.toLowerCase()) {
    case 'openai':
      return new OpenAIProvider(config)
    
    case 'anthropic':
      return new AnthropicProvider(config)
    
    case 'google':
      throw new Error('Google AI provider is not yet available. Please use Anthropic (Claude) or OpenAI as your AI provider.')
    
    case 'local':
      throw new Error('Local/Ollama provider is not yet available. Please use Anthropic (Claude) or OpenAI as your AI provider.')
    
    default:
      throw new Error(`Unknown provider: ${providerName}`)
  }
}

/**
 * Get the default provider (OpenAI)
 */
export function getDefaultProvider(): LLMProvider {
  return new OpenAIProvider()
}

/**
 * Provider manager for multi-provider support
 */
export class ProviderManager {
  private providers: Map<string, LLMProvider> = new Map()
  private defaultProvider: string = 'openai'

  constructor(configs?: Record<string, ProviderConfig>) {
    if (configs) {
      for (const [name, config] of Object.entries(configs)) {
        try {
          this.providers.set(name, createProvider(name, config))
        } catch (error) {
          console.warn(`Failed to create provider ${name}:`, error)
        }
      }
    }
    
    // Always have OpenAI as fallback
    if (!this.providers.has('openai')) {
      this.providers.set('openai', new OpenAIProvider())
    }
  }

  /**
   * Get a provider by name
   */
  get(name?: string): LLMProvider {
    const providerName = name || this.defaultProvider
    const provider = this.providers.get(providerName)
    
    if (!provider) {
      throw new Error(`Provider not configured: ${providerName}`)
    }
    
    return provider
  }

  /**
   * Set the default provider
   */
  setDefault(name: string): void {
    if (!this.providers.has(name)) {
      throw new Error(`Provider not configured: ${name}`)
    }
    this.defaultProvider = name
  }

  /**
   * List available providers
   */
  list(): string[] {
    return Array.from(this.providers.keys())
  }

  /**
   * Check if a provider is available
   */
  async isAvailable(name: string): Promise<boolean> {
    const provider = this.providers.get(name)
    if (!provider) return false
    return provider.isAvailable()
  }
}

// Singleton instance
let providerManager: ProviderManager | null = null

export function getProviderManager(): ProviderManager {
  if (!providerManager) {
    providerManager = new ProviderManager()
  }
  return providerManager
}
