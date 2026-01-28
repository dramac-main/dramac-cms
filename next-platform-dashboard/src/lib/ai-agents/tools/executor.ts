/**
 * Tool Executor
 * 
 * Phase EM-58A: AI Agents - Core Infrastructure
 * 
 * Executes tools on behalf of agents with validation,
 * rate limiting, and logging.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ToolResult, ToolContext } from '../types'
import type { ToolDefinitionConfig, OpenAITool, JSONSchema } from './types'
import { builtInTools } from './built-in'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AgentDB = any

// ============================================================================
// RATE LIMITER
// ============================================================================

const rateLimitCache = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now()
  const cached = rateLimitCache.get(key)
  
  if (!cached || cached.resetAt < now) {
    rateLimitCache.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  
  if (cached.count >= limit) {
    return false
  }
  
  cached.count++
  return true
}

// ============================================================================
// TOOL REGISTRY
// ============================================================================

const toolRegistry = new Map<string, ToolDefinitionConfig>()

// Register built-in tools
for (const tool of builtInTools) {
  toolRegistry.set(tool.name, tool)
}

/**
 * Register a custom tool
 */
export function registerTool(tool: ToolDefinitionConfig): void {
  toolRegistry.set(tool.name, tool)
}

/**
 * Get a tool by name
 */
export function getTool(name: string): ToolDefinitionConfig | undefined {
  return toolRegistry.get(name)
}

/**
 * List all registered tools
 */
export function listTools(): ToolDefinitionConfig[] {
  return Array.from(toolRegistry.values())
}

// ============================================================================
// TOOL EXECUTION
// ============================================================================

/**
 * Execute a tool
 */
export async function executeTool(
  toolName: string,
  input: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const startTime = Date.now()
  
  // Get tool definition
  const tool = toolRegistry.get(toolName)
  if (!tool) {
    return { success: false, error: `Unknown tool: ${toolName}` }
  }

  // Check rate limits
  if (tool.rateLimitPerMinute) {
    const key = `${toolName}:${context.agentId}:minute`
    if (!checkRateLimit(key, tool.rateLimitPerMinute, 60 * 1000)) {
      return { success: false, error: 'Rate limit exceeded (per minute)' }
    }
  }
  
  if (tool.rateLimitPerHour) {
    const key = `${toolName}:${context.agentId}:hour`
    if (!checkRateLimit(key, tool.rateLimitPerHour, 60 * 60 * 1000)) {
      return { success: false, error: 'Rate limit exceeded (per hour)' }
    }
  }

  // Validate input
  const validation = validateInput(tool.parametersSchema, input)
  if (!validation.valid) {
    return { success: false, error: `Invalid input: ${validation.error}` }
  }

  // Check permissions if needed
  if (tool.requiresPermissions?.length) {
    const hasPermission = await checkPermissions(context, tool.requiresPermissions)
    if (!hasPermission) {
      return { success: false, error: 'Insufficient permissions' }
    }
  }

  // Log tool call start
  const callId = await logToolCallStart(toolName, input, context)

  try {
    // Execute tool
    const result = await tool.handler(input, context)
    
    // Log completion
    await logToolCallComplete(callId, result, Date.now() - startTime)
    
    return result
    
  } catch (error) {
    const errorResult: ToolResult = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
    
    await logToolCallComplete(callId, errorResult, Date.now() - startTime)
    
    return errorResult
  }
}

/**
 * Get tools available to an agent
 */
export function getAvailableTools(
  allowedTools: string[],
  deniedTools: string[] = []
): ToolDefinitionConfig[] {
  const available: ToolDefinitionConfig[] = []
  
  for (const [name, tool] of toolRegistry) {
    // Check if explicitly denied
    if (deniedTools.includes(name)) continue
    
    // Check if allowed (supports wildcards)
    const isAllowed = allowedTools.some(pattern => {
      if (pattern.endsWith('*')) {
        return name.startsWith(pattern.slice(0, -1))
      }
      return name === pattern
    })
    
    if (isAllowed) {
      available.push(tool)
    }
  }
  
  return available
}

/**
 * Format tools for LLM function calling
 */
export function formatToolsForLLM(tools: ToolDefinitionConfig[]): OpenAITool[] {
  return tools.map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parametersSchema
    }
  }))
}

// ============================================================================
// VALIDATION
// ============================================================================

function validateInput(
  schema: JSONSchema,
  input: Record<string, unknown>
): { valid: boolean; error?: string } {
  // Basic validation - in production, use a proper JSON Schema validator
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in input) || input[field] === undefined || input[field] === null) {
        return { valid: false, error: `Missing required field: ${field}` }
      }
    }
  }
  
  if (schema.properties) {
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (key in input && input[key] !== undefined) {
        const value = input[key]
        const propType = propSchema.type
        
        // Type checking
        if (propType === 'string' && typeof value !== 'string') {
          return { valid: false, error: `Field ${key} must be a string` }
        }
        if (propType === 'integer' && !Number.isInteger(value)) {
          return { valid: false, error: `Field ${key} must be an integer` }
        }
        if (propType === 'number' && typeof value !== 'number') {
          return { valid: false, error: `Field ${key} must be a number` }
        }
        if (propType === 'boolean' && typeof value !== 'boolean') {
          return { valid: false, error: `Field ${key} must be a boolean` }
        }
        if (propType === 'array' && !Array.isArray(value)) {
          return { valid: false, error: `Field ${key} must be an array` }
        }
        if (propType === 'object' && (typeof value !== 'object' || value === null)) {
          return { valid: false, error: `Field ${key} must be an object` }
        }
        
        // Enum validation
        if (propSchema.enum && !propSchema.enum.includes(value as string)) {
          return { 
            valid: false, 
            error: `Field ${key} must be one of: ${propSchema.enum.join(', ')}` 
          }
        }
      }
    }
  }
  
  return { valid: true }
}

// ============================================================================
// PERMISSIONS
// ============================================================================

async function checkPermissions(
  context: ToolContext,
  _requiredPermissions: string[]
): Promise<boolean> {
  // TODO: Implement proper permission checking
  // For now, allow all authenticated requests
  return context.siteId !== undefined
}

// ============================================================================
// LOGGING
// ============================================================================

async function logToolCallStart(
  toolName: string,
  input: Record<string, unknown>,
  context: ToolContext
): Promise<string> {
  const supabase = await createClient() as AgentDB
  
  // Get tool ID from database
  const { data: tool } = await supabase
    .from('ai_agent_tools')
    .select('id')
    .eq('name', toolName)
    .single()
  
  const toolId = tool?.id || '00000000-0000-0000-0000-000000000000'
  
  const { data, error } = await supabase
    .from('ai_agent_tool_calls')
    .insert({
      agent_id: context.agentId,
      tool_id: toolId,
      execution_id: context.executionId,
      input_params: input,
      status: 'running',
      started_at: new Date().toISOString()
    })
    .select('id')
    .single()
  
  if (error) {
    console.error('[Tools] Failed to log tool call:', error)
    return crypto.randomUUID()
  }
  
  return data.id
}

async function logToolCallComplete(
  callId: string,
  result: ToolResult,
  durationMs: number
): Promise<void> {
  const supabase = await createClient() as AgentDB
  
  await supabase
    .from('ai_agent_tool_calls')
    .update({
      output_result: result.success ? result.data : { error: result.error },
      status: result.success ? 'completed' : 'failed',
      error_message: result.error,
      completed_at: new Date().toISOString(),
      duration_ms: durationMs
    })
    .eq('id', callId)
}
