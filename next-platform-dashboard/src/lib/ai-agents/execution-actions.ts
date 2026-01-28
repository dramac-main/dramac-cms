/**
 * Agent Execution Actions
 * 
 * Phase EM-58A: AI Agents - Core Infrastructure
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ExecutionResult, ExecutionStatus } from './types'
import { executeAgent } from './runtime/agent-executor'
import { getAgent } from './actions'
import { logAutomationEvent } from '@/modules/automation/services/event-processor'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AgentDB = any

// ============================================================================
// EXECUTION MANAGEMENT
// ============================================================================

/**
 * Trigger an agent execution manually
 */
export async function triggerAgent(
  agentId: string,
  input: {
    message?: string
    context?: Record<string, unknown>
    triggerData?: Record<string, unknown>
  } = {}
): Promise<ExecutionResult> {
  const agent = await getAgent(agentId)
  if (!agent) {
    throw new Error('Agent not found')
  }
  
  if (!agent.isActive) {
    throw new Error('Agent is not active')
  }
  
  // Log trigger event
  await logAutomationEvent(
    agent.siteId,
    'ai_agent.execution.started',
    { agentId, trigger: 'manual' },
    { sourceModule: 'ai_agents' }
  )
  
  // Execute agent - pass agentId, not the agent object
  const result = await executeAgent(agentId, {
    type: 'manual',
    data: input.triggerData || {},
  })
  
  // Log completion event
  await logAutomationEvent(
    agent.siteId,
    result.success ? 'ai_agent.execution.completed' : 'ai_agent.execution.failed',
    {
      agentId,
      executionId: result.executionId,
      success: result.success,
      stepsCount: result.steps.length,
      error: result.error
    },
    { sourceModule: 'ai_agents' }
  )
  
  return result
}

/**
 * Alias for triggerAgent - Start agent execution (API compatible)
 */
export const startAgentExecution = triggerAgent
/**
 * Trigger agent from automation workflow
 */
export async function triggerAgentFromWorkflow(
  agentId: string,
  workflowId: string,
  eventData: Record<string, unknown>
): Promise<ExecutionResult> {
  const agent = await getAgent(agentId)
  if (!agent) {
    throw new Error('Agent not found')
  }
  
  if (!agent.isActive) {
    throw new Error('Agent is not active')
  }
  
  return executeAgent(agentId, {
    type: 'event',
    eventType: 'automation',
    data: {
      workflowId,
      ...eventData
    }
  })
}

/**
 * Trigger agent from schedule
 */
export async function triggerAgentFromSchedule(
  agentId: string,
  scheduleId: string
): Promise<ExecutionResult> {
  const agent = await getAgent(agentId)
  if (!agent) {
    throw new Error('Agent not found')
  }
  
  if (!agent.isActive) {
    throw new Error('Agent is not active')
  }
  
  return executeAgent(agentId, {
    type: 'schedule',
    data: { scheduleId }
  })
}

/**
 * Send a message to an agent (chat mode)
 */
export async function sendMessageToAgent(
  agentId: string,
  message: string,
  sessionId?: string
): Promise<ExecutionResult> {
  const agent = await getAgent(agentId)
  if (!agent) {
    throw new Error('Agent not found')
  }
  
  if (!agent.isActive) {
    throw new Error('Agent is not active')
  }
  
  return executeAgent(agentId, {
    type: 'manual',
    data: { sessionId, message }
  })
}

// ============================================================================
// EXECUTION HISTORY
// ============================================================================

/**
 * Get execution history for an agent
 */
export async function getAgentExecutions(
  agentId: string,
  options: {
    status?: ExecutionStatus
    limit?: number
    offset?: number
  } = {}
): Promise<{
  executions: Array<{
    id: string
    status: ExecutionStatus
    triggerType: string
    stepsCompleted: number
    tokensUsed: number
    startedAt: string
    completedAt?: string
    error?: string
  }>
  total: number
}> {
  const supabase = await createClient() as AgentDB
  
  let query = supabase
    .from('ai_agent_executions')
    .select('*', { count: 'exact' })
    .eq('agent_id', agentId)
    .order('started_at', { ascending: false })
  
  if (options.status) {
    query = query.eq('status', options.status)
  }
  
  if (options.limit) {
    query = query.limit(options.limit)
  }
  
  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }
  
  const { data, error, count } = await query
  
  if (error) throw error
  
  return {
    executions: data?.map((e: Record<string, unknown>) => ({
      id: e.id as string,
      status: e.status as ExecutionStatus,
      triggerType: e.trigger_type as string,
      stepsCompleted: e.steps_completed as number,
      tokensUsed: e.tokens_used as number,
      startedAt: e.started_at as string,
      completedAt: e.completed_at as string | undefined,
      error: e.error as string | undefined
    })) || [],
    total: count || 0
  }
}

/**
 * Get execution details including steps
 */
export async function getExecutionDetails(
  executionId: string
): Promise<{
  execution: {
    id: string
    agentId: string
    status: ExecutionStatus
    triggerType: string
    triggerData: Record<string, unknown>
    result?: Record<string, unknown>
    error?: string
    tokensUsed: number
    stepsCompleted: number
    startedAt: string
    completedAt?: string
  }
  steps: Array<{
    id: string
    stepNumber: number
    stepType: 'thought' | 'action' | 'observation' | 'error'
    toolName?: string
    toolInput?: Record<string, unknown>
    toolOutput?: unknown
    reasoning?: string
    tokensUsed: number
    duration: number
    createdAt: string
  }>
} | null> {
  const supabase = await createClient() as AgentDB
  
  const { data: execution, error } = await supabase
    .from('ai_agent_executions')
    .select('*')
    .eq('id', executionId)
    .single()
  
  if (error || !execution) return null
  
  const { data: steps } = await supabase
    .from('ai_agent_execution_steps')
    .select('*')
    .eq('execution_id', executionId)
    .order('step_number', { ascending: true })
  
  return {
    execution: {
      id: execution.id,
      agentId: execution.agent_id,
      status: execution.status,
      triggerType: execution.trigger_type,
      triggerData: execution.trigger_data,
      result: execution.result,
      error: execution.error,
      tokensUsed: execution.tokens_used,
      stepsCompleted: execution.steps_completed,
      startedAt: execution.started_at,
      completedAt: execution.completed_at
    },
    steps: steps?.map((s: Record<string, unknown>) => ({
      id: s.id as string,
      stepNumber: s.step_number as number,
      stepType: s.step_type as 'thought' | 'action' | 'observation' | 'error',
      toolName: s.tool_name as string | undefined,
      toolInput: s.tool_input as Record<string, unknown> | undefined,
      toolOutput: s.tool_output,
      reasoning: s.reasoning as string | undefined,
      tokensUsed: s.tokens_used as number,
      duration: s.duration_ms as number,
      createdAt: s.created_at as string
    })) || []
  }
}

/**
 * Cancel a running execution
 */
export async function cancelExecution(executionId: string): Promise<void> {
  const supabase = await createClient() as AgentDB
  
  await supabase
    .from('ai_agent_executions')
    .update({
      status: 'cancelled',
      completed_at: new Date().toISOString()
    })
    .eq('id', executionId)
    .eq('status', 'running')
}

// ============================================================================
// USAGE STATISTICS
// ============================================================================

/**
 * Get agent usage statistics
 */
export async function getAgentUsageStats(
  agentId: string,
  days: number = 30
): Promise<{
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  totalTokens: number
  totalCost: number
  avgStepsPerExecution: number
  dailyUsage: Array<{
    date: string
    executions: number
    tokens: number
    cost: number
  }>
}> {
  const supabase = await createClient() as AgentDB
  
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  // Get execution stats
  const { data: executions } = await supabase
    .from('ai_agent_executions')
    .select('status, tokens_used, steps_completed')
    .eq('agent_id', agentId)
    .gte('started_at', startDate.toISOString())
  
  const totalExecutions = executions?.length || 0
  const successfulExecutions = executions?.filter((e: {status: string}) => e.status === 'completed').length || 0
  const failedExecutions = executions?.filter((e: {status: string}) => e.status === 'failed').length || 0
  const totalTokens = executions?.reduce((sum: number, e: {tokens_used: number}) => sum + e.tokens_used, 0) || 0
  const avgStepsPerExecution = totalExecutions > 0
    ? executions!.reduce((sum: number, e: {steps_completed: number}) => sum + e.steps_completed, 0) / totalExecutions
    : 0
  
  // Get daily usage
  const { data: dailyData } = await supabase
    .from('ai_usage_daily')
    .select('*')
    .eq('agent_id', agentId)
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: true })
  
  // Estimate cost (simplified)
  const costPerToken = 0.00001 // $0.01 per 1000 tokens average
  const totalCost = totalTokens * costPerToken
  
  return {
    totalExecutions,
    successfulExecutions,
    failedExecutions,
    totalTokens,
    totalCost,
    avgStepsPerExecution,
    dailyUsage: dailyData?.map((d: Record<string, unknown>) => ({
      date: d.date as string,
      executions: (d.request_count || 0) as number,
      tokens: ((d.input_tokens || 0) as number) + ((d.output_tokens || 0) as number),
      cost: (d.estimated_cost || 0) as number
    })) || []
  }
}

/**
 * Get site-wide AI usage
 */
export async function getSiteAIUsage(
  siteId: string,
  days: number = 30
): Promise<{
  totalExecutions: number
  totalTokens: number
  totalCost: number
  byAgent: Array<{
    agentId: string
    agentName: string
    executions: number
    tokens: number
    cost: number
  }>
}> {
  const supabase = await createClient() as AgentDB
  
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  // Get all agents for site
  const { data: agents } = await supabase
    .from('ai_agents')
    .select('id, name')
    .eq('site_id', siteId)
  
  if (!agents?.length) {
    return {
      totalExecutions: 0,
      totalTokens: 0,
      totalCost: 0,
      byAgent: []
    }
  }
  
  const agentIds = agents.map((a: {id: string}) => a.id)
  
  // Get execution stats
  const { data: executions } = await supabase
    .from('ai_agent_executions')
    .select('agent_id, tokens_used')
    .in('agent_id', agentIds)
    .gte('started_at', startDate.toISOString())
  
  const totalExecutions = executions?.length || 0
  const totalTokens = executions?.reduce((sum: number, e: {tokens_used: number}) => sum + e.tokens_used, 0) || 0
  const costPerToken = 0.00001
  const totalCost = totalTokens * costPerToken
  
  // Group by agent
  const byAgentMap = new Map<string, { executions: number; tokens: number }>()
  for (const exec of executions || []) {
    const existing = byAgentMap.get(exec.agent_id) || { executions: 0, tokens: 0 }
    existing.executions++
    existing.tokens += exec.tokens_used
    byAgentMap.set(exec.agent_id, existing)
  }
  
  const byAgent = agents.map((agent: {id: string, name: string}) => {
    const stats = byAgentMap.get(agent.id) || { executions: 0, tokens: 0 }
    return {
      agentId: agent.id,
      agentName: agent.name,
      executions: stats.executions,
      tokens: stats.tokens,
      cost: stats.tokens * costPerToken
    }
  })
  
  return {
    totalExecutions,
    totalTokens,
    totalCost,
    byAgent
  }
}
