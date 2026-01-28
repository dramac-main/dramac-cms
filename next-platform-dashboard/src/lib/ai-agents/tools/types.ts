/**
 * Tool Types
 * 
 * Phase EM-58A: AI Agents - Core Infrastructure
 */

import type { ToolResult, ToolContext } from '../types'

export type { ToolResult, ToolContext }

/**
 * Tool definition for registration
 */
export interface ToolDefinitionConfig {
  name: string
  displayName: string
  description: string
  category: 'crm' | 'communication' | 'calendar' | 'task' | 'data' | 'web' | 'system'
  parametersSchema: JSONSchema
  returnsSchema?: JSONSchema
  handler: ToolHandler
  requiresPermissions?: string[]
  requiresModules?: string[]
  isDangerous?: boolean
  rateLimitPerMinute?: number
  rateLimitPerHour?: number
}

export type ToolHandler = (
  input: Record<string, unknown>,
  context: ToolContext
) => Promise<ToolResult>

/**
 * JSON Schema type (simplified)
 */
export interface JSONSchema {
  type: string
  properties?: Record<string, JSONSchema>
  required?: string[]
  items?: JSONSchema
  enum?: string[]
  default?: unknown
  description?: string
  format?: string
  minimum?: number
  maximum?: number
  oneOf?: JSONSchema[]
  [key: string]: unknown
}

/**
 * Tool call log entry
 */
export interface ToolCallLog {
  id: string
  agentId: string
  toolId: string
  executionId?: string
  inputParams: Record<string, unknown>
  outputResult?: Record<string, unknown>
  status: 'pending' | 'running' | 'completed' | 'failed' | 'denied'
  errorMessage?: string
  startedAt: string
  completedAt?: string
  durationMs?: number
  tokensUsed: number
}

/**
 * OpenAI function calling format
 */
export interface OpenAITool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: JSONSchema
  }
}
