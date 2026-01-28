/**
 * Agent Executor - Core Runtime Engine
 * 
 * Phase EM-58A: AI Agents - Core Infrastructure
 * 
 * Implements the ReAct (Reasoning + Acting) loop for agent execution.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { createProvider } from '../llm/factory'
import { executeTool, getAvailableTools, formatToolsForLLM } from '../tools/executor'
import { 
  retrieveRelevantMemories, 
  getOrCreateConversation, 
  addMessageToConversation,
  recordEpisode
} from '../memory/memory-manager'
import type { 
  AgentConfig, 
  TriggerContext, 
  AgentContext,
  ExecutionResult,
  ExecutionStep,
  ActionRecord,
  Message,
  ThoughtResult
} from '../types'
import type { OpenAITool } from '../tools/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AgentDB = any

// ============================================================================
// AGENT EXECUTOR
// ============================================================================

/**
 * Execute an agent
 */
export async function executeAgent(
  agentId: string,
  trigger: TriggerContext,
  options: {
    maxSteps?: number
    timeout?: number
    userId?: string
    skipApproval?: boolean
  } = {}
): Promise<ExecutionResult> {
  const _supabase = await createClient() as AgentDB
  const startTime = Date.now()
  
  // 1. Load agent configuration
  const agent = await loadAgent(agentId)
  if (!agent) {
    throw new Error(`Agent not found: ${agentId}`)
  }
  
  if (!agent.isActive) {
    throw new Error('Agent is not active')
  }
  
  // 2. Create execution record
  const executionId = await createExecution(agent, trigger)
  
  try {
    // 3. Update status to running
    await updateExecutionStatus(executionId, 'running', {
      startedAt: new Date().toISOString()
    })
    
    // 4. Initialize context
    const context = await initializeContext(agent, trigger, executionId)
    
    // 5. Load relevant memories
    const memories = await retrieveRelevantMemories(
      agent.id,
      context.summary,
      { limit: 10, types: ['fact', 'preference', 'outcome'] }
    )
    
    // 6. Build system prompt
    const systemPrompt = buildSystemPrompt(agent, memories)
    
    // 7. Get or create conversation
    const conversation = await getOrCreateConversation(
      agent.id,
      agent.siteId,
      'session',
      executionId
    )
    
    // Add system message
    await addMessageToConversation(conversation.id, {
      role: 'system',
      content: systemPrompt
    })
    
    // 8. Run ReAct loop
    const maxSteps = options.maxSteps || agent.maxStepsPerRun || 10
    const result = await runReActLoop(
      agent,
      conversation.id,
      context,
      maxSteps,
      options.skipApproval || false
    )
    
    // 9. Finalize execution
    const duration = Date.now() - startTime
    await finalizeExecution(executionId, result, duration)
    
    // 10. Record episode for learning
    await recordEpisode(agent.id, agent.siteId, {
      executionId,
      triggerEvent: trigger.eventType,
      contextSummary: context.summary,
      actionsTaken: result.actions,
      outcome: result.success ? 'success' : 'failure',
      outcomeDetails: result.error,
      durationMs: duration,
      tokensUsed: result.tokensTotal
    })
    
    return {
      ...result,
      executionId,
      durationMs: duration
    }
    
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    await updateExecutionStatus(executionId, 'failed', {
      error: errorMessage,
      completedAt: new Date().toISOString(),
      durationMs: duration
    })
    
    return {
      executionId,
      success: false,
      status: 'failed',
      steps: [],
      actions: [],
      result: {},
      tokensInput: 0,
      tokensOutput: 0,
      tokensTotal: 0,
      durationMs: duration,
      error: errorMessage
    }
  }
}

// ============================================================================
// REACT LOOP
// ============================================================================

async function runReActLoop(
  agent: AgentConfig,
  conversationId: string,
  context: AgentContext,
  maxSteps: number,
  skipApproval: boolean
): Promise<{
  success: boolean
  status: 'completed' | 'failed'
  steps: ExecutionStep[]
  actions: ActionRecord[]
  result: Record<string, unknown>
  tokensInput: number
  tokensOutput: number
  tokensTotal: number
  error?: string
}> {
  const provider = createProvider(agent.llmProvider)
  const steps: ExecutionStep[] = []
  const actions: ActionRecord[] = []
  let tokensInput = 0
  let tokensOutput = 0
  let isComplete = false
  const currentContext = { ...context }
  
  // Get available tools
  const availableTools = getAvailableTools(agent.allowedTools, agent.deniedTools)
  const llmTools = formatToolsForLLM(availableTools)
  
  // Get conversation messages
  const supabase = await createClient() as AgentDB
  const { data: conv } = await supabase
    .from('ai_agent_conversations')
    .select('messages')
    .eq('id', conversationId)
    .single()
  
  const messages: Message[] = conv?.messages || []
  
  // Add initial observation
  const observation = buildObservation(currentContext)
  await addMessageToConversation(conversationId, {
    role: 'user',
    content: observation
  })
  messages.push({
    id: crypto.randomUUID(),
    role: 'user',
    content: observation,
    createdAt: new Date().toISOString()
  })
  
  for (let stepNum = 0; stepNum < maxSteps && !isComplete; stepNum++) {
    const stepStart = Date.now()
    
    // THINK: Get agent's next action
    const thought = await think(provider, messages, llmTools, agent)
    tokensInput += thought.tokensInput
    tokensOutput += thought.tokensOutput
    
    steps.push({
      id: crypto.randomUUID(),
      executionId: context.executionId,
      stepNumber: stepNum,
      stepType: 'think',
      inputText: messages[messages.length - 1]?.content,
      reasoning: thought.result.reasoning,
      startedAt: new Date(stepStart).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - stepStart,
      tokensUsed: thought.tokensInput + thought.tokensOutput
    })
    
    // Check if agent wants to finish
    if (thought.result.action === 'finish') {
      isComplete = true
      
      // Add final message
      await addMessageToConversation(conversationId, {
        role: 'assistant',
        content: thought.result.reasoning
      })
      
      break
    }
    
    // ACT: Execute tool
    if (thought.result.action === 'use_tool' && thought.result.tool) {
      const actStart = Date.now()
      
      // Check if action needs approval
      const tool = availableTools.find(t => t.name === thought.result.tool)
      if (tool?.isDangerous && !skipApproval) {
        // TODO: Implement approval flow
        console.log('[Agent] Dangerous action skipped (no approval flow yet)')
      }
      
      // Execute tool
      const toolResult = await executeTool(
        thought.result.tool,
        thought.result.input || {},
        {
          siteId: agent.siteId,
          agentId: agent.id,
          executionId: context.executionId
        }
      )
      
      const action: ActionRecord = {
        tool: thought.result.tool,
        input: thought.result.input || {},
        output: toolResult.success ? toolResult.data : toolResult.error,
        success: toolResult.success,
        timestamp: new Date().toISOString()
      }
      actions.push(action)
      
      steps.push({
        id: crypto.randomUUID(),
        executionId: context.executionId,
        stepNumber: stepNum,
        stepType: 'act',
        toolName: thought.result.tool,
        toolInput: thought.result.input,
        toolOutput: toolResult.success ? (toolResult.data as Record<string, unknown>) : { error: toolResult.error },
        startedAt: new Date(actStart).toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - actStart,
        tokensUsed: 0
      })
      
      // Add tool result to conversation
      const toolMessage = toolResult.success
        ? `Tool ${thought.result.tool} executed successfully:\n${JSON.stringify(toolResult.data, null, 2)}`
        : `Tool ${thought.result.tool} failed: ${toolResult.error}`
      
      await addMessageToConversation(conversationId, {
        role: 'user',
        content: toolMessage
      })
      messages.push({
        id: crypto.randomUUID(),
        role: 'user',
        content: toolMessage,
        createdAt: new Date().toISOString()
      })
      
      // Add assistant reasoning
      await addMessageToConversation(conversationId, {
        role: 'assistant',
        content: thought.result.reasoning
      })
      messages.push({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: thought.result.reasoning,
        createdAt: new Date().toISOString()
      })
    }
  }
  
  return {
    success: isComplete,
    status: isComplete ? 'completed' : 'failed',
    steps,
    actions,
    result: { completed: isComplete, stepsExecuted: steps.length },
    tokensInput,
    tokensOutput,
    tokensTotal: tokensInput + tokensOutput,
    error: isComplete ? undefined : 'Max steps reached without completion'
  }
}

// ============================================================================
// THINK STEP
// ============================================================================

async function think(
  provider: ReturnType<typeof createProvider>,
  messages: Message[],
  tools: OpenAITool[],
  agent: AgentConfig
): Promise<{
  result: ThoughtResult
  tokensInput: number
  tokensOutput: number
}> {
  const thinkPrompt = `
Based on the conversation so far and your goals, decide what to do next.

Your goals (in priority order):
${agent.goals.map((g, i) => `${i + 1}. ${g.name}: ${g.description || ''}`).join('\n')}

You can either:
1. Use a tool to take an action
2. Finish if your goal is achieved or you cannot proceed further

Respond with your reasoning and decision in this JSON format:
{
  "reasoning": "Your step-by-step reasoning about what you've learned and what to do next...",
  "action": "use_tool" or "finish",
  "tool": "tool_name (only if action is use_tool)",
  "input": { tool input parameters (only if action is use_tool) },
  "confidence": 0.0-1.0 (your confidence in this decision)
}
`

  // Add think prompt to messages
  const thinkMessages: Message[] = [
    ...messages,
    {
      id: crypto.randomUUID(),
      role: 'user',
      content: thinkPrompt,
      createdAt: new Date().toISOString()
    }
  ]

  try {
    const response = await provider.completeWithTools(
      thinkMessages,
      tools,
      {
        model: agent.llmModel,
        temperature: agent.temperature,
        maxTokens: 1000,
        responseFormat: 'json'
      }
    )
    
    // Try to parse JSON response
    let result: ThoughtResult
    try {
      result = JSON.parse(response.content)
    } catch {
      // If parsing fails, treat as finish
      result = {
        reasoning: response.content,
        action: 'finish',
        confidence: 0.5
      }
    }
    
    // If LLM wants to use a tool via function calling
    if (response.toolCalls?.length) {
      const tc = response.toolCalls[0]
      result = {
        reasoning: response.content || 'Using tool based on analysis',
        action: 'use_tool',
        tool: tc.name,
        input: tc.arguments,
        confidence: 0.9
      }
    }
    
    return {
      result,
      tokensInput: response.tokensInput,
      tokensOutput: response.tokensOutput
    }
  } catch (error) {
    return {
      result: {
        reasoning: `Error during thinking: ${error instanceof Error ? error.message : 'Unknown'}`,
        action: 'finish',
        confidence: 0
      },
      tokensInput: 0,
      tokensOutput: 0
    }
  }
}

// ============================================================================
// HELPERS
// ============================================================================

async function loadAgent(agentId: string): Promise<AgentConfig | null> {
  const supabase = await createClient() as AgentDB
  
  const { data, error } = await supabase
    .from('ai_agents')
    .select('*')
    .eq('id', agentId)
    .single()
  
  if (error || !data) return null
  
  return {
    id: data.id,
    siteId: data.site_id,
    agencyId: data.agency_id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    avatarUrl: data.avatar_url,
    personality: data.personality,
    agentType: data.agent_type,
    domain: data.domain,
    capabilities: data.capabilities || [],
    systemPrompt: data.system_prompt,
    goals: data.goals || [],
    constraints: data.constraints || [],
    examples: data.examples || [],
    triggerEvents: data.trigger_events || [],
    triggerSchedule: data.trigger_schedule,
    triggerConditions: data.trigger_conditions || [],
    isActive: data.is_active,
    isPublic: data.is_public,
    llmProvider: data.llm_provider,
    llmModel: data.llm_model,
    temperature: Number(data.temperature),
    maxTokens: data.max_tokens,
    maxStepsPerRun: data.max_steps_per_run,
    maxToolCallsPerStep: data.max_tool_calls_per_step,
    timeoutSeconds: data.timeout_seconds,
    maxRunsPerHour: data.max_runs_per_hour,
    maxRunsPerDay: data.max_runs_per_day,
    allowedTools: data.allowed_tools || [],
    deniedTools: data.denied_tools || [],
    totalRuns: data.total_runs,
    successfulRuns: data.successful_runs,
    failedRuns: data.failed_runs,
    totalTokensUsed: data.total_tokens_used,
    totalActionsTaken: data.total_actions_taken,
    avgResponseTimeMs: data.avg_response_time_ms,
    lastRunAt: data.last_run_at,
    lastError: data.last_error,
    createdBy: data.created_by,
    updatedBy: data.updated_by,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  }
}

async function createExecution(
  agent: AgentConfig,
  trigger: TriggerContext
): Promise<string> {
  const supabase = await createClient() as AgentDB
  
  const { data, error } = await supabase
    .from('ai_agent_executions')
    .insert({
      agent_id: agent.id,
      site_id: agent.siteId,
      trigger_type: trigger.type,
      trigger_event_id: trigger.eventId,
      trigger_data: trigger.data,
      status: 'pending',
      initial_context: trigger.data,
      current_context: trigger.data
    })
    .select('id')
    .single()
  
  if (error) throw error
  return data.id
}

async function updateExecutionStatus(
  executionId: string,
  status: string,
  data: Record<string, unknown>
): Promise<void> {
  const supabase = await createClient() as AgentDB
  
  await supabase
    .from('ai_agent_executions')
    .update({
      status,
      ...data
    })
    .eq('id', executionId)
}

async function finalizeExecution(
  executionId: string,
  result: {
    steps: ExecutionStep[]
    actions: ActionRecord[]
    tokensInput: number
    tokensOutput: number
    tokensTotal: number
    error?: string
  },
  durationMs: number
): Promise<void> {
  const supabase = await createClient() as AgentDB
  
  await supabase
    .from('ai_agent_executions')
    .update({
      status: result.error ? 'failed' : 'completed',
      steps: result.steps,
      actions_taken: result.actions,
      tokens_input: result.tokensInput,
      tokens_output: result.tokensOutput,
      tokens_total: result.tokensTotal,
      tool_calls: result.actions.length,
      llm_calls: result.steps.filter(s => s.stepType === 'think').length,
      error: result.error,
      completed_at: new Date().toISOString(),
      duration_ms: durationMs
    })
    .eq('id', executionId)
}

async function initializeContext(
  agent: AgentConfig,
  trigger: TriggerContext,
  executionId: string
): Promise<AgentContext> {
  return {
    executionId,
    siteId: agent.siteId,
    agentId: agent.id,
    trigger,
    summary: `Agent "${agent.name}" triggered by ${trigger.type}${trigger.eventType ? `: ${trigger.eventType}` : ''}`,
    entities: trigger.data,
    variables: {}
  }
}

function buildSystemPrompt(
  agent: AgentConfig,
  memories: { content: string; memoryType: string }[]
): string {
  return `${agent.personality || ''}

${agent.systemPrompt}

## Your Goals
${agent.goals.map((g, i) => `${i + 1}. ${g.name}${g.description ? `: ${g.description}` : ''}`).join('\n')}

## Tools Available
You can use tools to take actions. Available tool categories: CRM, Communication, Calendar, Data, System.

## Relevant Context from Memory
${memories.length > 0 ? memories.map(m => `- [${m.memoryType}] ${m.content}`).join('\n') : 'No relevant memories found.'}

## Constraints
${agent.constraints.length > 0 ? agent.constraints.map(c => `- ${c}`).join('\n') : 'No specific constraints.'}

## Response Guidelines
- Think step by step before taking action
- Use tools when needed to gather information or take action
- Be concise but thorough
- Always explain your reasoning
- If unsure, gather more information before acting
- If you cannot complete the goal, explain why and finish
`
}

function buildObservation(context: AgentContext): string {
  return `
## Current Context

**Trigger:** ${context.trigger.type}${context.trigger.eventType ? ` (${context.trigger.eventType})` : ''}

**Data:**
${JSON.stringify(context.trigger.data, null, 2)}

**Summary:** ${context.summary}

What would you like to do?
`
}
