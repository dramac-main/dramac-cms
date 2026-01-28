/**
 * OpenAI Provider Implementation
 * 
 * Phase EM-58A: AI Agents - Core Infrastructure
 */

import OpenAI from 'openai'
import type { 
  Message, 
  CompletionOptions, 
  CompletionResult, 
  ToolCompletionResult,
  StreamChunk 
} from '../../types'
import type { LLMProvider, OpenAITool } from '../provider'

export class OpenAIProvider implements LLMProvider {
  readonly name = 'openai'
  private client: OpenAI
  private defaultModel: string

  constructor(config: {
    apiKey?: string
    apiEndpoint?: string
    organizationId?: string
    defaultModel?: string
  } = {}) {
    this.client = new OpenAI({
      apiKey: config.apiKey || process.env.OPENAI_API_KEY,
      baseURL: config.apiEndpoint,
      organization: config.organizationId
    })
    this.defaultModel = config.defaultModel || 'gpt-4o'
  }

  async complete(
    messages: Message[],
    options: CompletionOptions = {}
  ): Promise<CompletionResult> {
    const response = await this.client.chat.completions.create({
      model: options.model || this.defaultModel,
      messages: messages.map(m => {
        const base = {
          role: m.role as 'system' | 'user' | 'assistant' | 'tool',
          content: m.content
        };
        return m.role === 'tool' && m.toolCallId 
          ? { ...base, tool_call_id: m.toolCallId } 
          : base;
      }) as any,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
      response_format: options.responseFormat === 'json' 
        ? { type: 'json_object' } 
        : undefined,
      stop: options.stop
    })

    return {
      content: response.choices[0].message.content || '',
      tokensInput: response.usage?.prompt_tokens || 0,
      tokensOutput: response.usage?.completion_tokens || 0,
      finishReason: response.choices[0].finish_reason as 'stop' | 'length' | 'tool_calls'
    }
  }

  async completeWithTools(
    messages: Message[],
    tools: OpenAITool[],
    options: CompletionOptions = {}
  ): Promise<ToolCompletionResult> {
    const response = await this.client.chat.completions.create({
      model: options.model || this.defaultModel,
      messages: messages.map(m => {
        const baseMsg: any = {
          role: m.role,
          content: m.content
        };
        if (m.toolCalls && m.toolCalls.length > 0 && m.role === 'assistant') {
          baseMsg.tool_calls = m.toolCalls.map(tc => ({
            id: tc.id,
            type: 'function' as const,
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.arguments)
            }
          }));
        }
        if (m.role === 'tool' && m.toolCallId) {
          baseMsg.tool_call_id = m.toolCallId;
        }
        return baseMsg;
      }) as any,
      tools,
      tool_choice: 'auto',
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096
    })

    const message = response.choices[0].message

    return {
      content: message.content || '',
      toolCalls: message.tool_calls?.map((tc: any) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments)
      })) || [],
      tokensInput: response.usage?.prompt_tokens || 0,
      tokensOutput: response.usage?.completion_tokens || 0,
      finishReason: response.choices[0].finish_reason as 'stop' | 'length' | 'tool_calls'
    }
  }

  async *stream(
    messages: Message[],
    options: CompletionOptions = {}
  ): AsyncGenerator<StreamChunk> {
    const stream = await this.client.chat.completions.create({
      model: options.model || this.defaultModel,
      messages: messages.map(m => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content
      })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
      stream: true
    })

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta
      if (delta?.content) {
        yield { type: 'content', content: delta.content }
      }
    }
    
    yield { type: 'done' }
  }

  async embed(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text
    })
    return response.data[0].embedding
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.client.models.list()
      return true
    } catch {
      return false
    }
  }
}
