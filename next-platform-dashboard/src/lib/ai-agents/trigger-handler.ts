/**
 * AI Agent Trigger Handler
 * 
 * Phase EM-58C: AI Agents - Real-World Integration
 * 
 * Integrates AI agents with the automation event system.
 * When an event occurs, this handler checks for agents that should be triggered
 * and executes them with the event payload as context.
 */

import { createClient } from '@/lib/supabase/server'
import { executeAgent } from './runtime'
import { getAgents } from './actions'
import type { AgentConfig } from './types'
import { logAutomationEvent } from '@/modules/automation/services/event-processor'

// ============================================================================
// TYPES
// ============================================================================

export interface EventTriggerPayload {
  eventType: string
  siteId: string
  agencyId: string
  data: Record<string, unknown>
  metadata?: {
    timestamp: string
    sourceModule?: string
    userId?: string
  }
}

export interface TriggerResult {
  triggered: boolean
  agentId?: string
  executionId?: string
  error?: string
}

// ============================================================================
// TRIGGER HANDLER
// ============================================================================

/**
 * Check if an agent should be triggered by an event
 */
function shouldTriggerAgent(
  agent: AgentConfig,
  eventType: string,
  eventData: Record<string, unknown>
): boolean {
  // Check if event type matches any of the agent's trigger events
  if (!agent.triggerEvents.includes(eventType)) {
    return false
  }

  // Check trigger conditions if any exist
  if (agent.triggerConditions.length === 0) {
    return true // No conditions = always trigger
  }

  // Evaluate conditions
  for (const condition of agent.triggerConditions) {
    const { field, operator, value } = condition
    const fieldValue = getNestedValue(eventData, field)

    switch (operator) {
      case 'eq':
        if (fieldValue !== value) return false
        break
      case 'neq':
        if (fieldValue === value) return false
        break
      case 'contains':
        if (typeof fieldValue !== 'string' || !fieldValue.includes(String(value))) return false
        break
      case 'not_contains':
        if (typeof fieldValue === 'string' && fieldValue.includes(String(value))) return false
        break
      case 'gt':
        if (typeof fieldValue !== 'number' || fieldValue <= Number(value)) return false
        break
      case 'gte':
        if (typeof fieldValue !== 'number' || fieldValue < Number(value)) return false
        break
      case 'lt':
        if (typeof fieldValue !== 'number' || fieldValue >= Number(value)) return false
        break
      case 'lte':
        if (typeof fieldValue !== 'number' || fieldValue > Number(value)) return false
        break
      default:
        console.warn(`Unknown condition operator: ${operator}`)
    }
  }

  return true
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current, key) => {
    if (current && typeof current === 'object') {
      return (current as Record<string, unknown>)[key]
    }
    return undefined
  }, obj as unknown)
}

/**
 * Find agents that should be triggered by an event
 */
export async function findTriggeredAgents(
  siteId: string,
  eventType: string
): Promise<AgentConfig[]> {
  const supabase = await createClient()

  // Cast to any since AI agent tables aren't in TypeScript types yet
  const { data, error } = await (supabase as any)
    .from('ai_agents')
    .select('*')
    .eq('site_id', siteId)
    .eq('is_active', true)
    .contains('trigger_events', [eventType])

  if (error) {
    console.error('Error finding triggered agents:', error)
    return []
  }

  return (data || []).map(mapDbAgent)
}

/**
 * Handle an incoming event and trigger matching agents
 */
export async function handleEventTrigger(
  payload: EventTriggerPayload
): Promise<TriggerResult[]> {
  const { eventType, siteId, data, metadata } = payload
  const results: TriggerResult[] = []

  try {
    // Find agents that should be triggered
    const agents = await findTriggeredAgents(siteId, eventType)

    if (agents.length === 0) {
      return [{ triggered: false }]
    }

    // Execute each triggered agent
    for (const agent of agents) {
      // Check conditions
      if (!shouldTriggerAgent(agent, eventType, data)) {
        continue
      }

      try {
        // Log the trigger
        await logAutomationEvent(
          siteId,
          'ai_agent.execution.started',
          {
            agentId: agent.id,
            agentName: agent.name,
            triggerEvent: eventType,
          },
          { sourceModule: 'ai_agents' }
        )

        // Execute agent using the exported function
        const result = await executeAgent(agent.id, {
          type: 'event',
          eventType,
          data: {
            ...data,
            _metadata: metadata,
          },
        })

        results.push({
          triggered: true,
          agentId: agent.id,
          executionId: result.executionId,
        })

        // Log completion
        await logAutomationEvent(
          siteId,
          result.success ? 'ai_agent.execution.completed' : 'ai_agent.execution.failed',
          {
            agentId: agent.id,
            executionId: result.executionId,
            success: result.success,
            error: result.error,
          },
          { sourceModule: 'ai_agents' }
        )

      } catch (error) {
        console.error(`Error executing agent ${agent.id}:`, error)
        results.push({
          triggered: true,
          agentId: agent.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return results

  } catch (error) {
    console.error('Error handling event trigger:', error)
    return [{
      triggered: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }]
  }
}

/**
 * Register AI agent handlers with the automation system
 */
export async function registerAgentTriggers(siteId: string): Promise<void> {
  // This is called when setting up event listeners
  // The actual trigger handling happens via the event processor
  console.log(`AI Agent triggers registered for site ${siteId}`)
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map database row to AgentConfig type
 */
function mapDbAgent(row: Record<string, unknown>): AgentConfig {
  return {
    id: row.id as string,
    siteId: row.site_id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: (row.description as string) || '',
    agentType: (row.type as AgentConfig['agentType']) || 'assistant',
    personality: (row.personality as string) || '',
    systemPrompt: (row.system_prompt as string) || '',
    goals: [],
    constraints: (row.constraints as string[]) || [],
    examples: [],
    triggerEvents: (row.trigger_events as string[]) || [],
    triggerConditions: (row.trigger_conditions as AgentConfig['triggerConditions']) || [],
    isActive: (row.is_active as boolean) || false,
    isPublic: (row.is_public as boolean) || false,
    llmProvider: (row.model_provider as string) || 'openai',
    llmModel: (row.model_id as string) || 'gpt-4o-mini',
    temperature: (row.temperature as number) || 0.7,
    maxTokens: (row.max_tokens_per_run as number) || 4096,
    maxStepsPerRun: (row.max_actions_per_run as number) || 10,
    maxToolCallsPerStep: 3,
    timeoutSeconds: 120,
    maxRunsPerHour: 60,
    maxRunsPerDay: 500,
    allowedTools: (row.allowed_tools as string[]) || ['*'],
    deniedTools: (row.denied_tools as string[]) || [],
    capabilities: [],
    avatarUrl: (row.avatar_url as string) || undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    createdBy: row.created_by as string,
    totalRuns: 0,
    successfulRuns: 0,
    failedRuns: 0,
    totalTokensUsed: 0,
    totalActionsTaken: 0,
  }
}

// ============================================================================
// EVENT PROCESSOR INTEGRATION
// ============================================================================

/**
 * Hook to be called by the automation event processor
 * when an event is received
 */
export async function processAIAgentTriggers(
  siteId: string,
  agencyId: string,
  eventType: string,
  eventData: Record<string, unknown>
): Promise<void> {
  await handleEventTrigger({
    eventType,
    siteId,
    agencyId,
    data: eventData,
    metadata: {
      timestamp: new Date().toISOString(),
      sourceModule: 'automation',
    },
  })
}
