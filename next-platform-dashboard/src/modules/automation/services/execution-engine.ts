/**
 * Workflow Execution Engine
 * 
 * Phase EM-57A: Automation Engine - Core Infrastructure
 * 
 * Executes workflows step by step with:
 * - Variable resolution ({{trigger.field}})
 * - Condition evaluation
 * - Error handling and retries
 * - Delay/wait support
 * 
 * NOTE: This is implemented as standalone async functions following the
 * Server Actions pattern used throughout the platform.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { executeAction } from './action-executor'
import type { 
  ExecutionContext, 
  WorkflowStep, 
  WorkflowExecution,
  ActionResult 
} from '../types/automation-types'

// ============================================================================
// SUPABASE CLIENT TYPE HELPER
// ============================================================================

/**
 * Cast Supabase client for automation module tables
 * These tables are created by em-57-automation-engine.sql migration
 * and may not be in the generated types yet.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AutomationDB = any

// ============================================================================
// MAIN EXECUTION FUNCTION
// ============================================================================

/**
 * Execute a workflow from an execution record
 */
export async function executeWorkflow(executionId: string): Promise<void> {
  const supabase = await createClient() as AutomationDB
  
  // Get execution details
  const { data: execution, error: execError } = await supabase
    .from('workflow_executions')
    .select(`
      *,
      workflow:automation_workflows(*)
    `)
    .eq('id', executionId)
    .single()
  
  if (execError || !execution) {
    throw new Error(`Execution not found: ${executionId}`)
  }
  
  // Check if already completed or cancelled
  if (['completed', 'failed', 'cancelled'].includes(execution.status)) {
    return
  }
  
  // Mark as running
  await updateExecutionStatus(executionId, 'running', {
    started_at: new Date().toISOString(),
  })
  
  try {
    // Initialize context
    const context: ExecutionContext = {
      trigger: execution.trigger_data || {},
      steps: execution.context?.steps || {},
      variables: execution.context?.variables || {},
      execution: {
        id: executionId,
        workflowId: execution.workflow_id,
        siteId: execution.site_id,
        startedAt: new Date().toISOString(),
      },
    }
    
    // Load workflow variables
    const { data: workflowVars } = await supabase
      .from('workflow_variables')
      .select('key, value')
      .eq('workflow_id', execution.workflow_id)
    
    if (workflowVars) {
      for (const v of workflowVars) {
        context.variables[v.key] = v.value
      }
    }
    
    // Get workflow steps
    const { data: steps } = await supabase
      .from('workflow_steps')
      .select('*')
      .eq('workflow_id', execution.workflow_id)
      .eq('is_active', true)
      .order('position', { ascending: true })
    
    if (!steps?.length) {
      await completeExecution(executionId, context, 'completed')
      return
    }
    
    // Execute steps
    let currentStepIndex = execution.current_step_index || 0
    
    while (currentStepIndex < steps.length) {
      const step = steps[currentStepIndex] as WorkflowStep
      
      // Update current step
      await supabase
        .from('workflow_executions')
        .update({
          current_step_id: step.id,
          current_step_index: currentStepIndex,
        })
        .eq('id', executionId)
      
      // Execute step
      const result = await executeStep(executionId, step, context)
      
      if (result.status === 'failed' && step.on_error === 'fail') {
        await failExecution(executionId, result.error || 'Step failed', context)
        return
      }
      
      if (result.status === 'paused') {
        // Workflow is paused (waiting for delay or event)
        await pauseExecution(executionId, result.resumeAt)
        return
      }
      
      // Store step output in context
      if (step.output_key && result.output) {
        context.steps[step.output_key] = result.output
      }
      
      // Handle condition branching
      if (step.step_type === 'condition' && result.branchIndex !== undefined) {
        // TODO: Implement branch handling for complex workflows
        // For now, just continue to next step
      }
      
      // Check for stop step
      if (step.step_type === 'stop') {
        await completeExecution(executionId, context, 'completed')
        return
      }
      
      currentStepIndex++
      
      // Update execution context
      await supabase
        .from('workflow_executions')
        .update({
          context: { ...context, variables: context.variables },
          steps_completed: currentStepIndex,
        })
        .eq('id', executionId)
    }
    
    // All steps completed
    await completeExecution(executionId, context, 'completed')
  } catch (error) {
    const emptyContext: ExecutionContext = { 
      trigger: {}, 
      steps: {}, 
      variables: {}, 
      execution: { id: executionId, workflowId: execution.workflow_id, siteId: execution.site_id, startedAt: '' }
    }
    await failExecution(
      executionId,
      error instanceof Error ? error.message : 'Unknown error',
      emptyContext
    )
  }
}

// ============================================================================
// STEP EXECUTION
// ============================================================================

/**
 * Execute a single step
 */
async function executeStep(
  executionId: string,
  step: WorkflowStep,
  context: ExecutionContext
): Promise<ActionResult> {
  const supabase = await createClient() as AutomationDB
  const startTime = Date.now()
  
  // Create step log
  const { data: stepLog } = await supabase
    .from('step_execution_logs')
    .insert({
      execution_id: executionId,
      step_id: step.id,
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  
  const stepLogId = stepLog?.id
  
  try {
    // Resolve input data
    const inputData = resolveVariables(step.input_mapping || {}, context) as Record<string, unknown>
    
    // Update log with input
    if (stepLogId) {
      await supabase
        .from('step_execution_logs')
        .update({ input_data: inputData })
        .eq('id', stepLogId)
    }
    
    let result: ActionResult
    
    // Execute based on step type
    switch (step.step_type) {
      case 'action':
        result = await executeActionStep(step, inputData, context)
        break
      
      case 'condition':
        result = await evaluateCondition(step, context)
        break
      
      case 'delay':
        result = await executeDelay(step, context)
        break
      
      case 'set_variable':
        result = await setVariable(step, context)
        break
      
      case 'transform':
        result = await executeTransform(step, inputData)
        break
      
      case 'stop':
        result = { status: 'completed', output: { stopped: true, reason: step.action_config?.reason } }
        break
      
      default:
        result = { status: 'failed', error: `Unknown step type: ${step.step_type}` }
    }
    
    // Update step log
    const duration = Date.now() - startTime
    if (stepLogId) {
      await supabase
        .from('step_execution_logs')
        .update({
          status: result.status,
          output_data: result.output as Record<string, unknown> || {},
          error: result.error,
          completed_at: new Date().toISOString(),
          duration_ms: duration,
        })
        .eq('id', stepLogId)
    }
    
    return result
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    
    if (stepLogId) {
      await supabase
        .from('step_execution_logs')
        .update({
          status: 'failed',
          error: errorMsg,
          completed_at: new Date().toISOString(),
          duration_ms: duration,
        })
        .eq('id', stepLogId)
    }
    
    return { status: 'failed', error: errorMsg }
  }
}

/**
 * Execute an action step
 */
async function executeActionStep(
  step: WorkflowStep,
  inputData: Record<string, unknown>,
  context: ExecutionContext
): Promise<ActionResult> {
  const actionType = step.action_type
  if (!actionType) {
    return { status: 'failed', error: 'No action type specified' }
  }
  
  const config = resolveVariables(step.action_config || {}, context) as Record<string, unknown>
  
  return executeAction(
    actionType,
    { ...inputData, ...config },
    context
  )
}

/**
 * Evaluate a condition
 */
async function evaluateCondition(
  step: WorkflowStep,
  context: ExecutionContext
): Promise<ActionResult> {
  const config = step.condition_config
  const conditions = config?.conditions || []
  const operator = config?.operator || 'and'
  
  const results: boolean[] = []
  
  for (const cond of conditions) {
    const field = resolveVariables(cond.field, context)
    const value = resolveVariables(cond.value, context)
    const result = evaluateOperator(field, cond.operator, value)
    results.push(result)
  }
  
  const passed = operator === 'and'
    ? results.every(r => r)
    : results.some(r => r)
  
  return {
    status: 'completed',
    output: { passed, results },
    branchIndex: passed ? 0 : 1,  // 0 = true branch, 1 = false branch
  }
}

/**
 * Execute a delay step
 */
async function executeDelay(
  step: WorkflowStep,
  context: ExecutionContext
): Promise<ActionResult> {
  const config = step.delay_config
  const delayType = config?.type || 'fixed'
  
  let resumeAt: Date
  
  switch (delayType) {
    case 'fixed':
      const duration = parseDuration(config?.value || '5m')
      resumeAt = new Date(Date.now() + duration)
      break
    
    case 'until':
      resumeAt = new Date(resolveVariables(config?.value, context) as string)
      break
    
    default:
      resumeAt = new Date(Date.now() + 5 * 60 * 1000)  // Default 5 minutes
  }
  
  return {
    status: 'paused',
    output: { delayUntil: resumeAt.toISOString() },
    resumeAt: resumeAt.toISOString(),
  }
}

/**
 * Set a workflow variable
 */
async function setVariable(
  step: WorkflowStep,
  context: ExecutionContext
): Promise<ActionResult> {
  const key = step.action_config?.key as string
  const value = resolveVariables(step.action_config?.value, context)
  
  if (key) {
    context.variables[key] = value
  }
  
  return {
    status: 'completed',
    output: { [key]: value },
  }
}

/**
 * Execute a transform step
 */
async function executeTransform(
  step: WorkflowStep,
  inputData: Record<string, unknown>
): Promise<ActionResult> {
  const config = step.action_config || {}
  const mapping = config.mapping as Record<string, string> || {}
  
  const result: Record<string, unknown> = {}
  
  for (const [targetKey, sourceExpr] of Object.entries(mapping)) {
    result[targetKey] = getValueByPath(inputData, sourceExpr)
  }
  
  return {
    status: 'completed',
    output: result,
  }
}

// ============================================================================
// VARIABLE RESOLUTION
// ============================================================================

/**
 * Resolve variables in a value ({{trigger.field}} syntax)
 */
function resolveVariables(value: unknown, context: ExecutionContext): unknown {
  if (typeof value !== 'string') {
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        return value.map(v => resolveVariables(v, context))
      }
      const result: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(value)) {
        result[k] = resolveVariables(v, context)
      }
      return result
    }
    return value
  }
  
  // Check if entire string is a variable reference
  const fullMatch = value.match(/^\{\{([^}]+)\}\}$/)
  if (fullMatch) {
    const resolved = getValueByPath(context, fullMatch[1].trim())
    return resolved !== undefined ? resolved : value
  }
  
  // Replace variable references within string
  return value.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const resolved = getValueByPath(context, path.trim())
    if (resolved === undefined) return match
    if (typeof resolved === 'object') return JSON.stringify(resolved)
    return String(resolved)
  })
}

/**
 * Get value by dot-notation path
 */
function getValueByPath(obj: unknown, path: string): unknown {
  const parts = path.split('.')
  let current: unknown = obj
  
  for (const part of parts) {
    if (current === null || current === undefined) return undefined
    if (typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }
  
  return current
}

// ============================================================================
// CONDITION EVALUATION
// ============================================================================

/**
 * Evaluate condition operator
 */
function evaluateOperator(left: unknown, operator: string, right: unknown): boolean {
  switch (operator) {
    case 'equals':
    case 'eq':
      return left === right
    case 'not_equals':
    case 'ne':
      return left !== right
    case 'contains':
      return typeof left === 'string' && left.includes(String(right))
    case 'not_contains':
      return typeof left === 'string' && !left.includes(String(right))
    case 'starts_with':
      return typeof left === 'string' && left.startsWith(String(right))
    case 'ends_with':
      return typeof left === 'string' && left.endsWith(String(right))
    case 'greater_than':
    case 'gt':
      return Number(left) > Number(right)
    case 'greater_than_or_equals':
    case 'gte':
      return Number(left) >= Number(right)
    case 'less_than':
    case 'lt':
      return Number(left) < Number(right)
    case 'less_than_or_equals':
    case 'lte':
      return Number(left) <= Number(right)
    case 'is_empty':
      return left === null || left === undefined || left === '' || 
             (Array.isArray(left) && left.length === 0)
    case 'is_not_empty':
      return left !== null && left !== undefined && left !== '' && 
             (!Array.isArray(left) || left.length > 0)
    case 'in':
      return Array.isArray(right) && right.includes(left)
    case 'not_in':
      return Array.isArray(right) && !right.includes(left)
    case 'matches':
      try {
        return new RegExp(String(right)).test(String(left))
      } catch {
        return false
      }
    default:
      return false
  }
}

// ============================================================================
// DURATION PARSING
// ============================================================================

/**
 * Parse duration string (5m, 1h, 1d)
 */
function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhdw])$/)
  if (!match) return 5 * 60 * 1000 // Default 5 minutes
  
  const value = parseInt(match[1], 10)
  const unit = match[2]
  
  switch (unit) {
    case 's': return value * 1000
    case 'm': return value * 60 * 1000
    case 'h': return value * 60 * 60 * 1000
    case 'd': return value * 24 * 60 * 60 * 1000
    case 'w': return value * 7 * 24 * 60 * 60 * 1000
    default: return 5 * 60 * 1000
  }
}

// ============================================================================
// STATUS UPDATE HELPERS
// ============================================================================

/**
 * Update execution status
 */
async function updateExecutionStatus(
  executionId: string,
  status: string,
  extra: Record<string, unknown> = {}
): Promise<void> {
  const supabase = await createClient() as AutomationDB
  await supabase
    .from('workflow_executions')
    .update({ status, ...extra })
    .eq('id', executionId)
}

/**
 * Pause execution
 */
async function pauseExecution(executionId: string, resumeAt?: string): Promise<void> {
  await updateExecutionStatus(executionId, 'paused', {
    paused_at: new Date().toISOString(),
    resume_at: resumeAt,
  })
}

/**
 * Complete execution successfully
 */
async function completeExecution(
  executionId: string,
  context: ExecutionContext,
  status: 'completed' | 'failed'
): Promise<void> {
  const supabase = await createClient() as AutomationDB
  const duration = context.execution?.startedAt 
    ? Date.now() - new Date(context.execution.startedAt).getTime()
    : 0
  
  await supabase
    .from('workflow_executions')
    .update({
      status,
      completed_at: new Date().toISOString(),
      output: context.steps,
      duration_ms: duration,
    })
    .eq('id', executionId)
  
  // Update workflow stats
  if (context.execution?.workflowId) {
    await supabase.rpc('update_workflow_stats', {
      p_workflow_id: context.execution.workflowId,
      p_success: status === 'completed',
      p_error: null,
    })
  }
}

/**
 * Fail execution with error
 */
async function failExecution(executionId: string, error: string, context: ExecutionContext): Promise<void> {
  const supabase = await createClient() as AutomationDB
  
  const duration = context.execution?.startedAt
    ? Date.now() - new Date(context.execution.startedAt).getTime()
    : 0
  
  await supabase
    .from('workflow_executions')
    .update({
      status: 'failed',
      completed_at: new Date().toISOString(),
      error,
      duration_ms: duration,
    })
    .eq('id', executionId)
  
  // Update workflow stats
  if (context.execution?.workflowId) {
    await supabase.rpc('update_workflow_stats', {
      p_workflow_id: context.execution.workflowId,
      p_success: false,
      p_error: error,
    })
  }
}

// ============================================================================
// RESUME PAUSED EXECUTIONS
// ============================================================================

/**
 * Resume paused executions that are ready
 */
export async function resumePausedExecutions(): Promise<{ resumed: number; errors: string[] }> {
  const supabase = await createClient() as AutomationDB
  const errors: string[] = []
  let resumed = 0
  
  const now = new Date().toISOString()
  
  // Get executions that should be resumed
  const { data: executions, error: fetchError } = await supabase
    .from('workflow_executions')
    .select('id')
    .eq('status', 'paused')
    .lte('resume_at', now)
    .limit(50)
  
  if (fetchError || !executions?.length) {
    return { resumed: 0, errors: fetchError ? [fetchError.message] : [] }
  }
  
  for (const exec of executions) {
    try {
      // Mark as running and continue execution
      await updateExecutionStatus(exec.id, 'running')
      await executeWorkflow(exec.id)
      resumed++
    } catch (err) {
      errors.push(`Execution ${exec.id}: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }
  
  return { resumed, errors }
}

// ============================================================================
// EXECUTION STATUS QUERIES
// ============================================================================

/**
 * Get execution by ID with full details
 */
export async function getExecution(executionId: string): Promise<WorkflowExecution | null> {
  const supabase = await createClient() as AutomationDB
  
  const { data, error } = await supabase
    .from('workflow_executions')
    .select(`
      *,
      workflow:automation_workflows(*),
      step_logs:step_execution_logs(*)
    `)
    .eq('id', executionId)
    .single()
  
  if (error || !data) return null
  return data as WorkflowExecution
}
