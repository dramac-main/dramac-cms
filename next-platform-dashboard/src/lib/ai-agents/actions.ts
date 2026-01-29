/**
 * Agent Actions (Server Actions)
 * 
 * Phase EM-58A: AI Agents - Core Infrastructure
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { AgentConfig, AgentType } from './types'
import { logAutomationEvent } from '@/modules/automation/services/event-processor'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AgentDB = any

// ============================================================================
// AGENT CRUD OPERATIONS
// ============================================================================

/**
 * Get all agents for a site
 */
export async function getAgents(
  siteId: string,
  options: {
    type?: AgentType
    active?: boolean
    limit?: number
    offset?: number
  } = {}
): Promise<{ agents: AgentConfig[]; total: number }> {
  const supabase = await createClient() as AgentDB
  
  let query = supabase
    .from('ai_agents')
    .select('*, ai_agent_goals(*), ai_agent_tools(*)', { count: 'exact' })
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
  
  if (options.type) {
    query = query.eq('type', options.type)
  }
  
  if (options.active !== undefined) {
    query = query.eq('is_active', options.active)
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
    agents: data?.map(mapAgent) || [],
    total: count || 0
  }
}

/**
 * Get a single agent by ID
 */
export async function getAgent(agentId: string): Promise<AgentConfig | null> {
  const supabase = await createClient() as AgentDB
  
  const { data, error } = await supabase
    .from('ai_agents')
    .select(`
      *,
      ai_agent_goals(*),
      ai_agent_tools(*, tool:ai_agent_tools_catalog(*))
    `)
    .eq('id', agentId)
    .single()
  
  if (error || !data) return null
  return mapAgent(data)
}

/**
 * Get agent by slug
 */
export async function getAgentBySlug(
  siteId: string,
  slug: string
): Promise<AgentConfig | null> {
  const supabase = await createClient() as AgentDB
  
  const { data, error } = await supabase
    .from('ai_agents')
    .select(`
      *,
      ai_agent_goals(*),
      ai_agent_tools(*, tool:ai_agent_tools_catalog(*))
    `)
    .eq('site_id', siteId)
    .eq('slug', slug)
    .single()
  
  if (error || !data) return null
  return mapAgent(data)
}

/**
 * Create a new agent
 */
export async function createAgent(
  siteId: string,
  config: {
    name: string
    type: AgentType
    description?: string
    systemPrompt: string
    modelProvider?: string
    modelId?: string
    goals?: Array<{ title: string; description: string; priority?: number }>
    allowedTools?: string[]
    deniedTools?: string[]
    constraints?: string[]
    maxTokensPerRun?: number
    maxActionsPerRun?: number
  }
): Promise<AgentConfig> {
  const supabase = await createClient() as AgentDB
  
  // Generate slug
  const slug = config.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  
  // Create agent
  const { data: agent, error } = await supabase
    .from('ai_agents')
    .insert({
      site_id: siteId,
      name: config.name,
      slug,
      type: config.type,
      description: config.description || '',
      system_prompt: config.systemPrompt,
      model_provider: config.modelProvider || 'openai',
      model_id: config.modelId || 'gpt-4o',
      allowed_tools: config.allowedTools || ['*'],
      denied_tools: config.deniedTools || [],
      constraints: config.constraints || [],
      max_tokens_per_run: config.maxTokensPerRun || 4000,
      max_actions_per_run: config.maxActionsPerRun || 10
    })
    .select()
    .single()
  
  if (error) throw error
  
  // Create goals if provided
  if (config.goals?.length) {
    await supabase.from('ai_agent_goals').insert(
      config.goals.map((goal, idx) => ({
        agent_id: agent.id,
        title: goal.title,
        description: goal.description,
        priority: goal.priority ?? idx
      }))
    )
  }
  
  // Log automation event
  await logAutomationEvent(
    siteId,
    'ai_agent.agent.created',
    { agentId: agent.id, name: config.name, type: config.type },
    { sourceModule: 'ai_agents' }
  )
  
  revalidatePath(`/dashboard/sites/${siteId}/ai-agents`)
  
  return mapAgent(agent)
}

/**
 * Update an agent
 */
export async function updateAgent(
  agentId: string,
  updates: Partial<{
    name: string
    description: string
    systemPrompt: string
    modelProvider: string
    modelId: string
    allowedTools: string[]
    deniedTools: string[]
    constraints: string[]
    maxTokensPerRun: number
    maxActionsPerRun: number
    isActive: boolean
  }>
): Promise<AgentConfig> {
  const supabase = await createClient() as AgentDB
  
  // Map to DB columns
  const dbUpdates: Record<string, unknown> = {}
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.description !== undefined) dbUpdates.description = updates.description
  if (updates.systemPrompt !== undefined) dbUpdates.system_prompt = updates.systemPrompt
  if (updates.modelProvider !== undefined) dbUpdates.model_provider = updates.modelProvider
  if (updates.modelId !== undefined) dbUpdates.model_id = updates.modelId
  if (updates.allowedTools !== undefined) dbUpdates.allowed_tools = updates.allowedTools
  if (updates.deniedTools !== undefined) dbUpdates.denied_tools = updates.deniedTools
  if (updates.constraints !== undefined) dbUpdates.constraints = updates.constraints
  if (updates.maxTokensPerRun !== undefined) dbUpdates.max_tokens_per_run = updates.maxTokensPerRun
  if (updates.maxActionsPerRun !== undefined) dbUpdates.max_actions_per_run = updates.maxActionsPerRun
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive
  
  const { data, error } = await supabase
    .from('ai_agents')
    .update(dbUpdates)
    .eq('id', agentId)
    .select()
    .single()
  
  if (error) throw error
  
  // Log automation event
  await logAutomationEvent(
    data.site_id,
    'ai_agent.agent.updated',
    { agentId, updates: Object.keys(updates) },
    { sourceModule: 'ai_agents' }
  )
  
  revalidatePath(`/dashboard/sites/${data.site_id}/ai-agents`)
  
  return mapAgent(data)
}

/**
 * Delete an agent
 */
export async function deleteAgent(agentId: string): Promise<void> {
  const supabase = await createClient() as AgentDB
  
  // Get agent for logging
  const { data: agent } = await supabase
    .from('ai_agents')
    .select('site_id, name')
    .eq('id', agentId)
    .single()
  
  // Delete (cascade will handle related records)
  const { error } = await supabase
    .from('ai_agents')
    .delete()
    .eq('id', agentId)
  
  if (error) throw error
  
  if (agent) {
    await logAutomationEvent(
      agent.site_id,
      'ai_agent.agent.deleted',
      { agentId, name: agent.name },
      { sourceModule: 'ai_agents' }
    )
    
    revalidatePath(`/dashboard/sites/${agent.site_id}/ai-agents`)
  }
}

/**
 * Toggle agent active status
 */
export async function toggleAgentActive(
  agentId: string,
  isActive: boolean
): Promise<void> {
  const supabase = await createClient() as AgentDB
  
  const { data, error } = await supabase
    .from('ai_agents')
    .update({ is_active: isActive })
    .eq('id', agentId)
    .select('site_id')
    .single()
  
  if (error) throw error
  
  await logAutomationEvent(
    data.site_id,
    isActive ? 'ai_agent.agent.activated' : 'ai_agent.agent.deactivated',
    { agentId },
    { sourceModule: 'ai_agents' }
  )
  
  revalidatePath(`/dashboard/sites/${data.site_id}/ai-agents`)
}

// ============================================================================
// AGENT GOALS
// ============================================================================

/**
 * Add a goal to an agent
 */
export async function addAgentGoal(
  agentId: string,
  goal: { title: string; description: string; priority?: number }
): Promise<void> {
  const supabase = await createClient() as AgentDB
  
  await supabase.from('ai_agent_goals').insert({
    agent_id: agentId,
    title: goal.title,
    description: goal.description,
    priority: goal.priority ?? 0
  })
}

/**
 * Update agent goals
 */
export async function updateAgentGoals(
  agentId: string,
  goals: Array<{ id?: string; title: string; description: string; priority?: number }>
): Promise<void> {
  const supabase = await createClient() as AgentDB
  
  // Delete existing goals
  await supabase
    .from('ai_agent_goals')
    .delete()
    .eq('agent_id', agentId)
  
  // Insert new goals
  if (goals.length > 0) {
    await supabase.from('ai_agent_goals').insert(
      goals.map((goal, idx) => ({
        agent_id: agentId,
        title: goal.title,
        description: goal.description,
        priority: goal.priority ?? idx
      }))
    )
  }
}

// ============================================================================
// AGENT CONVERSATIONS
// ============================================================================

/**
 * Get agent conversations
 */
export async function getAgentConversations(
  agentId: string,
  options: {
    limit?: number
    before?: string
  } = {}
): Promise<Array<{
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
}>> {
  const supabase = await createClient() as AgentDB
  
  let query = supabase
    .from('ai_agent_conversations')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })
    .limit(options.limit || 50)
  
  if (options.before) {
    query = query.lt('created_at', options.before)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  
  return data?.map((m: Record<string, unknown>) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    createdAt: m.created_at
  })) || []
}

/**
 * Clear agent conversation history
 */
export async function clearAgentConversations(agentId: string): Promise<void> {
  const supabase = await createClient() as AgentDB
  
  await supabase
    .from('ai_agent_conversations')
    .delete()
    .eq('agent_id', agentId)
}

// ============================================================================
// HELPERS
// ============================================================================

function mapAgent(data: Record<string, unknown>): AgentConfig {
  const goals = Array.isArray(data.ai_agent_goals)
    ? data.ai_agent_goals.map((g: Record<string, unknown>) => ({
        name: (g.title as string) || '',
        description: g.description as string | undefined,
        priority: (g.priority as number) || 1
      }))
    : []
  
  return {
    id: data.id as string,
    siteId: data.site_id as string,
    name: data.name as string,
    slug: data.slug as string,
    description: data.description as string | undefined,
    agentType: (data.type as AgentType) || 'assistant',
    capabilities: (data.capabilities as string[]) || [],
    systemPrompt: data.system_prompt as string,
    goals,
    constraints: (data.constraints as string[]) || [],
    examples: [],
    triggerEvents: (data.trigger_events as string[]) || [],
    triggerConditions: [],
    isActive: data.is_active as boolean,
    isPublic: false,
    llmProvider: data.model_provider as string || 'openai',
    llmModel: data.model_id as string || 'gpt-4o',
    temperature: 0.7,
    maxTokens: data.max_tokens_per_run as number || 4000,
    maxStepsPerRun: data.max_actions_per_run as number || 10,
    maxToolCallsPerStep: 5,
    timeoutSeconds: 300,
    maxRunsPerHour: 100,
    maxRunsPerDay: 1000,
    allowedTools: (data.allowed_tools as string[]) || [],
    deniedTools: (data.denied_tools as string[]) || [],
    totalRuns: 0,
    successfulRuns: 0,
    failedRuns: 0,
    totalTokensUsed: 0,
    totalActionsTaken: 0,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string
  }
}
