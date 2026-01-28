/**
 * Anthropic Provider Implementation
 * 
 * Phase EM-58A: AI Agents - Core Infrastructure
 */

import Anthropic from '@anthropic-ai/sdk'
import type { 
  Message, 
  CompletionOptions, 
  CompletionResult, 
  ToolCompletionResult,
  StreamChunk 
} from '../../types'
import type { LLMProvider, OpenAITool } from '../provider'

export class AnthropicProvider implements LLMProvider {
  readonly name = 'anthropic'
  private client: Anthropic
  private defaultModel: string

  constructor(config: {
    apiKey?: string
    defaultModel?: string
  } = {}) {
    this.client = new Anthropic({
      apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY
    })
    this.defaultModel = config.defaultModel || 'claude-3-5-sonnet-20241022'
  }

  async complete(
    messages: Message[],
    options: CompletionOptions = {}
  ): Promise<CompletionResult> {
    // Extract system message
    const systemMessage = messages.find(m => m.role === 'system')
    const chatMessages = messages.filter(m => m.role !== 'system')

    const response = await this.client.messages.create({
      model: options.model || this.defaultModel,
      system: systemMessage?.content,
      messages: chatMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      })),
      max_tokens: options.maxTokens ?? 4096
    })

    const textContent = response.content
      .filter(c => c.type === 'text')
      .map(c => c.text)
      .join('')

    return {
      content: textContent,
      tokensInput: response.usage.input_tokens,
      tokensOutput: response.usage.output_tokens,
      finishReason: response.stop_reason as 'stop' | 'length' | 'tool_calls'
    }
  }

  async completeWithTools(
    messages: Message[],
    tools: OpenAITool[],
    options: CompletionOptions = {}
  ): Promise<ToolCompletionResult> {
    // Convert OpenAI tool format to Anthropic format
    const anthropicTools = tools.map(t => ({
      name: t.function.name,
      description: t.function.description,
      input_schema: t.function.parameters as Anthropic.Tool.InputSchema
    }))

    const systemMessage = messages.find(m => m.role === 'system')
    const chatMessages = messages.filter(m => m.role !== 'system')

    const response = await this.client.messages.create({
      model: options.model || this.defaultModel,
      system: systemMessage?.content,
      messages: chatMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      })),
      tools: anthropicTools,
      max_tokens: options.maxTokens ?? 4096
    })

    // Extract tool calls from response
    const toolCalls = response.content
      .filter((c): c is Anthropic.ToolUseBlock => c.type === 'tool_use')
      .map(c => ({
        id: c.id,
        name: c.name,
        arguments: c.input as Record<string, unknown>
      }))

    const textContent = response.content
      .filter((c): c is Anthropic.TextBlock => c.type === 'text')
      .map(c => c.text)
      .join('')

    return {
      content: textContent,
      toolCalls,
      tokensInput: response.usage.input_tokens,
      tokensOutput: response.usage.output_tokens,
      finishReason: response.stop_reason as 'stop' | 'length' | 'tool_calls'
    }
  }

  async *stream(
    messages: Message[],
    options: CompletionOptions = {}
  ): AsyncGenerator<StreamChunk> {
    const systemMessage = messages.find(m => m.role === 'system')
    const chatMessages = messages.filter(m => m.role !== 'system')

    const stream = await this.client.messages.stream({
      model: options.model || this.defaultModel,
      system: systemMessage?.content,
      messages: chatMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      })),
      max_tokens: options.maxTokens ?? 4096
    })

    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        const delta = event.delta
        if ('text' in delta) {
          yield { type: 'content', content: delta.text }
        }
      }
    }
    
    yield { type: 'done' }
  }

  async embed(_text: string): Promise<number[]> {
    // Anthropic doesn't have embeddings, fall back to OpenAI
    // In production, you might want to use a different embedding provider
    throw new Error('Anthropic does not support embeddings. Use OpenAI embeddings instead.')
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.client.messages.create({
        model: this.defaultModel,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5
      })
      return true
    } catch {
      return false
    }
  }
}
