/**
 * Automation Server Actions
 * 
 * Phase EM-57A: Automation Engine - Core Infrastructure
 * 
 * Server actions for managing automation workflows, including:
 * - Workflow CRUD operations
 * - Step management
 * - Execution triggers
 * - Connection management
 * 
 * Following platform conventions:
 * - Server Actions pattern (not class-based services)
 * - createClient() from @/lib/supabase/server
 * - auth.can_access_site() RLS helper
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { emitEvent } from '@/lib/modules/module-events'
import type { 
  Workflow, 
  WorkflowStep, 
  WorkflowExecution, 
  AutomationConnection,
  WebhookEndpoint,
  TriggerConfig
} from '../types/automation-types'

// Type helper for Supabase Json compatibility
type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// ============================================================================
// WORKFLOW CRUD OPERATIONS
// ============================================================================

/**
 * Create a new workflow
 */
export async function createWorkflow(
  siteId: string,
  data: {
    name: string
    description?: string
    trigger_type: Workflow['trigger_type']
    trigger_config: Workflow['trigger_config']
  }
): Promise<{ success: boolean; data?: Workflow; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Generate slug from name
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    
    const { data: workflow, error } = await supabase
      .from('automation_workflows')
      .insert({
        site_id: siteId,
        name: data.name,
        description: data.description || null,
        slug: `${slug}-${Date.now().toString(36)}`,
        trigger_type: data.trigger_type,
        trigger_config: data.trigger_config as unknown as Json,
        is_active: false,
      })
      .select('*')
      .single()
    
    if (error) {
      console.error('[Automation] Create workflow error:', error)
      return { success: false, error: error.message }
    }
    
    // Emit event for other modules
    await emitEvent(
      'automation',
      siteId,
      'automation.workflow_created',
      { workflow_id: workflow.id, name: workflow.name }
    )
    
    revalidatePath('/automation')
    return { success: true, data: workflow as unknown as Workflow }
  } catch (error) {
    console.error('[Automation] Create workflow exception:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create workflow' 
    }
  }
}

/**
 * Get a workflow by ID
 */
export async function getWorkflow(
  workflowId: string
): Promise<{ success: boolean; data?: Workflow; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: workflow, error } = await supabase
      .from('automation_workflows')
      .select('*')
      .eq('id', workflowId)
      .single()
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true, data: workflow as unknown as Workflow }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get workflow' 
    }
  }
}

/**
 * Get all workflows for a site
 */
export async function getWorkflows(
  siteId: string,
  options?: { 
    is_active?: boolean
    trigger_type?: string
    limit?: number
    offset?: number
  }
): Promise<{ success: boolean; data?: Workflow[]; count?: number; error?: string }> {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('automation_workflows')
      .select('*', { count: 'exact' })
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })
    
    if (options?.is_active !== undefined) {
      query = query.eq('is_active', options.is_active)
    }
    
    if (options?.trigger_type) {
      query = query.eq('trigger_type', options.trigger_type)
    }
    
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }
    
    const { data, count, error } = await query
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true, data: data as unknown as Workflow[], count: count || 0 }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get workflows' 
    }
  }
}

/**
 * Update a workflow
 */
export async function updateWorkflow(
  workflowId: string,
  data: Partial<{
    name: string
    description: string
    trigger_type: Workflow['trigger_type']
    trigger_config: TriggerConfig
    is_active: boolean
  }>
): Promise<{ success: boolean; data?: Workflow; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Get current workflow state to check if activation state is changing
    const { data: currentWorkflow } = await supabase
      .from('automation_workflows')
      .select('is_active, trigger_type, trigger_config, site_id')
      .eq('id', workflowId)
      .single()
    
    // Transform data to match DB schema
    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.trigger_type !== undefined) updateData.trigger_type = data.trigger_type
    if (data.trigger_config !== undefined) updateData.trigger_config = data.trigger_config as unknown as Json
    if (data.is_active !== undefined) updateData.is_active = data.is_active
    
    const { data: workflow, error } = await supabase
      .from('automation_workflows')
      .update(updateData)
      .eq('id', workflowId)
      .select('*')
      .single()
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    // CRITICAL: Handle event subscription when workflow becomes active
    // This ensures subscriptions are created whether activated via UI toggle or save button
    const triggerConfig = (data.trigger_config || currentWorkflow?.trigger_config) as TriggerConfig
    const triggerType = data.trigger_type || currentWorkflow?.trigger_type
    const siteId = currentWorkflow?.site_id
    
    if (data.is_active === true && siteId) {
      // Workflow is being activated - create event subscription if needed
      if (triggerType === 'event' && triggerConfig?.event_type) {
        console.log(`[Automation] Creating event subscription for ${triggerConfig.event_type}`)
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: subError } = await (supabase as any)
          .from('automation_event_subscriptions')
          .upsert({
            site_id: siteId,
            workflow_id: workflowId,
            event_type: triggerConfig.event_type,
            source_module: null,
            event_filter: triggerConfig.event_filter || {},
            is_active: true,
          }, {
            onConflict: 'workflow_id,event_type,source_module'
          })
        
        if (subError) {
          console.error('[Automation] Failed to create event subscription:', subError)
        } else {
          console.log(`[Automation] ✅ Subscription created for ${triggerConfig.event_type}`)
        }
      }
    } else if (data.is_active === false && siteId) {
      // Workflow is being deactivated - deactivate event subscriptions
      console.log(`[Automation] Deactivating event subscriptions for workflow ${workflowId}`)
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('automation_event_subscriptions')
        .update({ is_active: false })
        .eq('workflow_id', workflowId)
    }
    
    revalidatePath('/automation')
    return { success: true, data: workflow as unknown as Workflow }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update workflow' 
    }
  }
}

/**
 * Duplicate a workflow
 */
export async function duplicateWorkflow(
  workflowId: string
): Promise<{ success: boolean; data?: Workflow; error?: string }> {
  try {
    const supabase = await createClient()

    // Fetch original workflow
    const { data: original, error: fetchError } = await supabase
      .from('automation_workflows')
      .select('*')
      .eq('id', workflowId)
      .single()

    if (fetchError || !original) {
      return { success: false, error: fetchError?.message || 'Workflow not found' }
    }

    const copyName = `${original.name} (Copy)`
    const slug = copyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    const { data: newWorkflow, error: insertError } = await supabase
      .from('automation_workflows')
      .insert({
        site_id: original.site_id,
        name: copyName,
        description: original.description,
        slug: `${slug}-${Date.now().toString(36)}`,
        trigger_type: original.trigger_type,
        trigger_config: original.trigger_config,
        is_active: false,
        icon: original.icon,
        color: original.color,
        category: original.category,
        tags: original.tags,
      })
      .select('*')
      .single()

    if (insertError) {
      return { success: false, error: insertError.message }
    }

    // Duplicate workflow steps
    const { data: steps } = await supabase
      .from('workflow_steps')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('position', { ascending: true })

    if (steps && steps.length > 0) {
      const newSteps = steps.map((step: Record<string, unknown>) => ({
        workflow_id: newWorkflow.id,
        step_type: step.step_type,
        action_type: step.action_type,
        action_config: step.action_config,
        condition_config: step.condition_config,
        delay_config: step.delay_config,
        name: step.name,
        description: step.description,
        position: step.position,
        is_active: step.is_active,
      }))

      await (supabase as any).from('workflow_steps').insert(newSteps)
    }

    await emitEvent(
      'automation',
      original.site_id,
      'automation.workflow_created',
      { workflow_id: newWorkflow.id, name: copyName, duplicated_from: workflowId }
    )

    revalidatePath('/automation')
    return { success: true, data: newWorkflow as unknown as Workflow }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to duplicate workflow'
    }
  }
}

/**
 * Delete a workflow
 */
export async function deleteWorkflow(
  workflowId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Get workflow first for event emission
    const { data: workflow } = await supabase
      .from('automation_workflows')
      .select('site_id, name')
      .eq('id', workflowId)
      .single()
    
    const { error } = await supabase
      .from('automation_workflows')
      .delete()
      .eq('id', workflowId)
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    if (workflow) {
      await emitEvent(
        'automation',
        workflow.site_id,
        'automation.workflow_deleted',
        { workflow_id: workflowId, name: workflow.name }
      )
    }
    
    revalidatePath('/automation')
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete workflow' 
    }
  }
}

/**
 * Activate a workflow
 */
export async function activateWorkflow(
  workflowId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Get workflow with steps to validate
    const { data: workflow, error: fetchError } = await supabase
      .from('automation_workflows')
      .select('*, workflow_steps(*)')
      .eq('id', workflowId)
      .single()
    
    if (fetchError || !workflow) {
      return { success: false, error: 'Workflow not found' }
    }
    
    // Validate workflow has at least one step
    if (!workflow.workflow_steps || workflow.workflow_steps.length === 0) {
      return { success: false, error: 'Workflow must have at least one step to activate' }
    }
    
    // Update is_active to true
    const { error: updateError } = await supabase
      .from('automation_workflows')
      .update({ is_active: true })
      .eq('id', workflowId)
    
    if (updateError) {
      return { success: false, error: updateError.message }
    }
    
    const triggerConfig = workflow.trigger_config as TriggerConfig
    
    // Handle event-based triggers: create event subscription
    // Use 'any' cast because automation_event_subscriptions may not be in generated types
    if (workflow.trigger_type === 'event' && triggerConfig?.event_type) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: subError } = await (supabase as any)
        .from('automation_event_subscriptions')
        .upsert({
          site_id: workflow.site_id,
          workflow_id: workflowId,
          event_type: triggerConfig.event_type,
          source_module: null, // Must include for unique constraint
          event_filter: triggerConfig.event_filter || {},
          is_active: true,
        }, {
          onConflict: 'workflow_id,event_type,source_module'
        })
      
      if (subError) {
        console.error('[Automation] Failed to create event subscription:', subError)
      } else {
        console.log(`[Automation] Created subscription for ${triggerConfig.event_type}`)
      }
    }
    
    // Handle scheduled triggers: create scheduled job
    if (workflow.trigger_type === 'schedule' && triggerConfig?.cron) {
      await supabase
        .from('automation_scheduled_jobs')
        .upsert({
          site_id: workflow.site_id,
          workflow_id: workflowId,
          cron_expression: triggerConfig.cron,
          next_run_at: calculateNextRun(triggerConfig.cron),
          is_active: true,
        }, {
          onConflict: 'workflow_id'
        })
    }
    
    await emitEvent(
      'automation',
      workflow.site_id,
      'automation.workflow_activated',
      { workflow_id: workflowId, name: workflow.name }
    )
    
    revalidatePath('/automation')
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to activate workflow' 
    }
  }
}

/**
 * Pause a workflow
 */
export async function pauseWorkflow(
  workflowId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: workflow, error } = await supabase
      .from('automation_workflows')
      .update({ is_active: false })
      .eq('id', workflowId)
      .select('site_id, name')
      .single()
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    // Pause any scheduled jobs
    await supabase
      .from('automation_scheduled_jobs')
      .update({ is_active: false })
      .eq('workflow_id', workflowId)
    
    // Pause any event subscriptions
    // Use 'any' cast because automation_event_subscriptions may not be in generated types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('automation_event_subscriptions')
      .update({ is_active: false })
      .eq('workflow_id', workflowId)
    
    await emitEvent(
      'automation',
      workflow.site_id,
      'automation.workflow_paused',
      { workflow_id: workflowId, name: workflow.name }
    )
    
    revalidatePath('/automation')
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to pause workflow' 
    }
  }
}

// ============================================================================
// STEP MANAGEMENT
// ============================================================================

/**
 * Create a workflow step
 */
export async function createWorkflowStep(
  workflowId: string,
  data: {
    step_type?: string
    action_type?: string
    action_config?: Record<string, unknown>
    position?: number
    condition_config?: Record<string, unknown>
    delay_config?: Record<string, unknown>
    name?: string
    on_error?: 'fail' | 'continue' | 'retry' | 'branch'
    max_retries?: number
    retry_delay_seconds?: number
  }
): Promise<{ success: boolean; data?: WorkflowStep; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Get max position if not provided
    let position = data.position
    if (position === undefined) {
      const { data: maxStep } = await supabase
        .from('workflow_steps')
        .select('position')
        .eq('workflow_id', workflowId)
        .order('position', { ascending: false })
        .limit(1)
        .single()
      
      position = maxStep ? maxStep.position + 1 : 1
    }
    
    const { data: step, error } = await supabase
      .from('workflow_steps')
      .insert({
        workflow_id: workflowId,
        step_type: data.step_type || 'action',
        action_type: data.action_type || null,
        action_config: (data.action_config || {}) as unknown as Json,
        position,
        condition_config: (data.condition_config || {}) as unknown as Json,
        delay_config: (data.delay_config || {}) as unknown as Json,
        name: data.name || null,
        on_error: data.on_error || 'continue',
        max_retries: data.max_retries || 0,
        retry_delay_seconds: data.retry_delay_seconds || 60,
      })
      .select('*')
      .single()
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    revalidatePath('/automation')
    return { success: true, data: step as unknown as WorkflowStep }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create step' 
    }
  }
}

/**
 * Get workflow steps
 */
export async function getWorkflowSteps(
  workflowId: string
): Promise<{ success: boolean; data?: WorkflowStep[]; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: steps, error } = await supabase
      .from('workflow_steps')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('position', { ascending: true })
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true, data: steps as unknown as WorkflowStep[] }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get steps' 
    }
  }
}

/**
 * Update a workflow step
 */
export async function updateWorkflowStep(
  stepId: string,
  data: Partial<{
    action_type: string
    action_config: Record<string, unknown>
    position: number
    condition_config: Record<string, unknown>
    delay_config: Record<string, unknown>
    name: string
    description: string
    is_active: boolean
    on_error: 'fail' | 'continue' | 'retry' | 'branch'
    max_retries: number
    retry_delay_seconds: number
    input_mapping: Record<string, unknown>
    output_key: string
  }>
): Promise<{ success: boolean; data?: WorkflowStep; error?: string }> {
  try {
    // Validate step ID format - reject temporary IDs
    if (stepId.startsWith('temp-')) {
      return { success: false, error: 'Cannot update temporary step - please wait for step to be created' }
    }

    const supabase = await createClient()
    
    // Build update object with proper type casting
    const updateData: Record<string, unknown> = {}
    if (data.action_type !== undefined) updateData.action_type = data.action_type
    if (data.action_config !== undefined) updateData.action_config = data.action_config as unknown as Json
    if (data.position !== undefined) updateData.position = data.position
    if (data.condition_config !== undefined) updateData.condition_config = data.condition_config as unknown as Json
    if (data.delay_config !== undefined) updateData.delay_config = data.delay_config as unknown as Json
    if (data.name !== undefined) updateData.name = data.name || null
    if (data.description !== undefined) updateData.description = data.description || null
    if (data.is_active !== undefined) updateData.is_active = data.is_active
    if (data.on_error !== undefined) updateData.on_error = data.on_error
    if (data.max_retries !== undefined) updateData.max_retries = data.max_retries
    if (data.retry_delay_seconds !== undefined) updateData.retry_delay_seconds = data.retry_delay_seconds
    if (data.input_mapping !== undefined) updateData.input_mapping = data.input_mapping as unknown as Json
    if (data.output_key !== undefined) updateData.output_key = data.output_key || null
    
    // Use maybeSingle to avoid error when step doesn't exist
    const { data: step, error } = await supabase
      .from('workflow_steps')
      .update(updateData)
      .eq('id', stepId)
      .select('*')
      .maybeSingle()
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    if (!step) {
      return { success: false, error: `Step not found: ${stepId}` }
    }
    
    revalidatePath('/automation')
    return { success: true, data: step as unknown as WorkflowStep }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update step' 
    }
  }
}

/**
 * Delete a workflow step
 */
export async function deleteWorkflowStep(
  stepId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('workflow_steps')
      .delete()
      .eq('id', stepId)
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    revalidatePath('/automation')
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete step' 
    }
  }
}

/**
 * Reorder workflow steps
 */
export async function reorderWorkflowSteps(
  workflowId: string,
  stepIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Update each step with new position
    const updates = stepIds.map((stepId, index) => ({
      id: stepId,
      position: index + 1,
    }))
    
    for (const update of updates) {
      const { error } = await supabase
        .from('workflow_steps')
        .update({ position: update.position })
        .eq('id', update.id)
        .eq('workflow_id', workflowId)
      
      if (error) {
        return { success: false, error: error.message }
      }
    }
    
    revalidatePath('/automation')
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to reorder steps' 
    }
  }
}

// ============================================================================
// EXECUTION MANAGEMENT
// ============================================================================

/**
 * Get workflow executions
 */
export async function getWorkflowExecutions(
  workflowId: string,
  options?: { 
    status?: WorkflowExecution['status']
    limit?: number 
    offset?: number 
  }
): Promise<{ success: boolean; data?: WorkflowExecution[]; count?: number; error?: string }> {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('workflow_executions')
      .select('*', { count: 'exact' })
      .eq('workflow_id', workflowId)
      .order('created_at', { ascending: false })
    
    if (options?.status) {
      query = query.eq('status', options.status)
    }
    
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }
    
    const { data, count, error } = await query
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true, data: data as unknown as WorkflowExecution[], count: count || 0 }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get executions' 
    }
  }
}

/**
 * Get execution details with step logs
 */
export async function getExecutionDetails(
  executionId: string
): Promise<{ 
  success: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: WorkflowExecution & { step_logs: any[] }
  error?: string 
}> {
  try {
    const supabase = await createClient()
    
    const { data: execution, error } = await supabase
      .from('workflow_executions')
      .select(`
        *,
        step_execution_logs(*)
      `)
      .eq('id', executionId)
      .single()
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { 
      success: true, 
      data: {
        ...(execution as unknown as WorkflowExecution),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        step_logs: (execution.step_execution_logs || []) as any[],
      },
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get execution details' 
    }
  }
}

/**
 * Cancel a running execution
 */
export async function cancelExecution(
  executionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('workflow_executions')
      .update({ 
        status: 'cancelled',
        completed_at: new Date().toISOString(),
      })
      .eq('id', executionId)
      .in('status', ['pending', 'running', 'paused'])
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    revalidatePath('/automation')
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to cancel execution' 
    }
  }
}

/**
 * Retry a failed execution
 */
export async function retryExecution(
  executionId: string
): Promise<{ success: boolean; newExecutionId?: string; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Get original execution
    const { data: original, error: fetchError } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('id', executionId)
      .single()
    
    if (fetchError || !original) {
      return { success: false, error: 'Execution not found' }
    }
    
    // Create new execution with same trigger data
    const { data: newExecution, error: createError } = await supabase
      .from('workflow_executions')
      .insert({
        site_id: original.site_id,
        workflow_id: original.workflow_id,
        trigger_type: original.trigger_type,
        trigger_data: original.trigger_data,
        status: 'pending',
        context: {},
        parent_execution_id: executionId,
        attempt_number: (original.attempt_number || 1) + 1,
      })
      .select('id')
      .single()
    
    if (createError) {
      return { success: false, error: createError.message }
    }
    
    revalidatePath('/automation')
    return { success: true, newExecutionId: newExecution.id }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to retry execution' 
    }
  }
}

/**
 * Manually trigger a workflow execution
 */
export async function triggerWorkflow(
  workflowId: string,
  triggerData?: Record<string, unknown>
): Promise<{ success: boolean; executionId?: string; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Get workflow to validate it's active or in test mode
    const { data: workflow, error: fetchError } = await supabase
      .from('automation_workflows')
      .select('site_id, is_active, trigger_type')
      .eq('id', workflowId)
      .single()
    
    if (fetchError || !workflow) {
      return { success: false, error: 'Workflow not found' }
    }
    
    // Allow manual trigger even if not active (for testing)
    // Create execution
    const { data: execution, error: createError } = await supabase
      .from('workflow_executions')
      .insert({
        site_id: workflow.site_id,
        workflow_id: workflowId,
        trigger_type: 'manual',
        trigger_data: (triggerData || {}) as unknown as Json,
        status: 'pending',
        context: {} as unknown as Json,
      })
      .select('id')
      .single()
    
    if (createError) {
      return { success: false, error: createError.message }
    }
    
    // Actually execute the workflow steps inline for manual/test triggers
    try {
      const { executeWorkflow } = await import('../services/execution-engine')
      await executeWorkflow(execution.id)
    } catch (execError) {
      // Execution errors are logged in the execution record itself
      // Don't fail the trigger — the execution row exists for inspection
      console.error('[triggerWorkflow] Execution error:', execError)
    }
    
    revalidatePath('/automation')
    return { success: true, executionId: execution.id }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to trigger workflow' 
    }
  }
}

// ============================================================================
// CONNECTION MANAGEMENT
// ============================================================================

/**
 * Create a connection to external service
 */
export async function createConnection(
  siteId: string,
  data: {
    service_type: string
    name: string
    credentials: Record<string, unknown>
  }
): Promise<{ success: boolean; data?: AutomationConnection; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: connection, error } = await supabase
      .from('automation_connections')
      .insert({
        site_id: siteId,
        service_type: data.service_type,
        name: data.name,
        credentials: data.credentials as unknown as Json,
        status: 'active',
      })
      .select('id, site_id, service_type, name, status, created_at, updated_at')
      .single()
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    revalidatePath('/automation/settings')
    return { success: true, data: connection as unknown as AutomationConnection }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create connection' 
    }
  }
}

/**
 * Get all connections for a site
 */
export async function getConnections(
  siteId: string
): Promise<{ success: boolean; data?: AutomationConnection[]; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Don't include credentials in listing
    const { data: connections, error } = await supabase
      .from('automation_connections')
      .select('id, site_id, service_type, name, status, created_at, updated_at')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true, data: connections as unknown as AutomationConnection[] }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get connections' 
    }
  }
}

/**
 * Update a connection
 */
export async function updateConnection(
  connectionId: string,
  data: Partial<{
    name: string
    credentials: Record<string, unknown>
    status: 'active' | 'expired' | 'revoked' | 'error'
  }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.credentials !== undefined) updateData.credentials = data.credentials as unknown as Json
    if (data.status !== undefined) updateData.status = data.status
    
    const { error } = await supabase
      .from('automation_connections')
      .update(updateData)
      .eq('id', connectionId)
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    revalidatePath('/automation/settings')
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update connection' 
    }
  }
}

/**
 * Delete a connection
 */
export async function deleteConnection(
  connectionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('automation_connections')
      .delete()
      .eq('id', connectionId)
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    revalidatePath('/automation/settings')
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete connection' 
    }
  }
}

/**
 * Test a connection
 */
export async function testConnection(
  connectionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: connection, error: fetchError } = await supabase
      .from('automation_connections')
      .select('*')
      .eq('id', connectionId)
      .single()
    
    if (fetchError || !connection) {
      return { success: false, error: 'Connection not found' }
    }
    
    const credentials = connection.credentials as Record<string, unknown> | null
    
    // Test based on service type
    switch (connection.service_type) {
      case 'slack': {
        if (!credentials?.webhook_url) {
          return { success: false, error: 'Webhook URL not configured' }
        }
        const webhookUrl = credentials.webhook_url as string
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: 'DRAMAC Automation test message' }),
        })
        if (!response.ok) {
          return { success: false, error: 'Slack webhook test failed' }
        }
        break
      }
      
      case 'discord': {
        if (!credentials?.webhook_url) {
          return { success: false, error: 'Webhook URL not configured' }
        }
        const webhookUrl = credentials.webhook_url as string
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: 'DRAMAC Automation test message' }),
        })
        if (!response.ok) {
          return { success: false, error: 'Discord webhook test failed' }
        }
        break
      }
      
      // Add more service tests as needed
      default:
        // Generic test - just verify credentials exist
        if (!credentials || Object.keys(credentials).length === 0) {
          return { success: false, error: 'No credentials configured' }
        }
    }
    
    // Update last tested timestamp
    await supabase
      .from('automation_connections')
      .update({ 
        status: 'active',
        last_used_at: new Date().toISOString(),
      })
      .eq('id', connectionId)
    
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Connection test failed' 
    }
  }
}

// ============================================================================
// WEBHOOK ENDPOINT MANAGEMENT
// ============================================================================

/**
 * Create a webhook endpoint for a workflow
 */
export async function createWebhookEndpoint(
  siteId: string,
  workflowId: string
): Promise<{ success: boolean; data?: WebhookEndpoint; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Generate endpoint path and secret using database functions
    const { data: pathData } = await supabase.rpc('generate_webhook_path')
    const { data: secretData } = await supabase.rpc('generate_webhook_secret')
    
    const endpointPath = pathData || `wh_${Date.now().toString(36)}`
    const secretKey = secretData || `whsec_${Date.now().toString(36)}`
    
    const { data: endpoint, error } = await supabase
      .from('automation_webhook_endpoints')
      .insert({
        site_id: siteId,
        workflow_id: workflowId,
        endpoint_path: endpointPath,
        secret_key: secretKey,
        is_active: true,
      })
      .select('*')
      .single()
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    revalidatePath('/automation')
    return { success: true, data: endpoint as unknown as WebhookEndpoint }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create webhook endpoint' 
    }
  }
}

/**
 * Get webhook endpoints for a workflow
 */
export async function getWebhookEndpoints(
  workflowId: string
): Promise<{ success: boolean; data?: WebhookEndpoint[]; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: endpoints, error } = await supabase
      .from('automation_webhook_endpoints')
      .select('id, site_id, workflow_id, endpoint_path, is_active, total_calls, last_called_at, created_at')
      .eq('workflow_id', workflowId)
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true, data: endpoints as unknown as WebhookEndpoint[] }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get webhook endpoints' 
    }
  }
}

/**
 * Delete a webhook endpoint
 */
export async function deleteWebhookEndpoint(
  endpointId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('automation_webhook_endpoints')
      .delete()
      .eq('id', endpointId)
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    revalidatePath('/automation')
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete webhook endpoint' 
    }
  }
}

// ============================================================================
// EVENT SUBSCRIPTIONS
// ============================================================================

/**
 * Subscribe to events for a workflow
 */
export async function subscribeToEvent(
  siteId: string,
  workflowId: string,
  eventType: string,
  filters?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('automation_event_subscriptions')
      .upsert({
        site_id: siteId,
        workflow_id: workflowId,
        event_type: eventType,
        event_filter: (filters || {}) as unknown as Json,
        is_active: true,
      }, {
        onConflict: 'workflow_id,event_type,source_module',
      })
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to subscribe to event' 
    }
  }
}

/**
 * Unsubscribe from events
 */
export async function unsubscribeFromEvent(
  workflowId: string,
  eventType: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('automation_event_subscriptions')
      .delete()
      .eq('workflow_id', workflowId)
      .eq('event_type', eventType)
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to unsubscribe from event' 
    }
  }
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get automation statistics for a site
 */
export async function getAutomationStats(
  siteId: string
): Promise<{ 
  success: boolean
  data?: {
    total_workflows: number
    active_workflows: number
    total_executions: number
    successful_executions: number
    failed_executions: number
    executions_today: number
  }
  error?: string 
}> {
  try {
    const supabase = await createClient()
    
    // Get workflow counts
    const { count: totalWorkflows } = await supabase
      .from('automation_workflows')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteId)
    
    const { count: activeWorkflows } = await supabase
      .from('automation_workflows')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .eq('is_active', true)
    
    // Get execution counts
    const { count: totalExecutions } = await supabase
      .from('workflow_executions')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteId)
    
    const { count: successfulExecutions } = await supabase
      .from('workflow_executions')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .eq('status', 'completed')
    
    const { count: failedExecutions } = await supabase
      .from('workflow_executions')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .eq('status', 'failed')
    
    // Today's executions
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { count: executionsToday } = await supabase
      .from('workflow_executions')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .gte('created_at', today.toISOString())
    
    return {
      success: true,
      data: {
        total_workflows: totalWorkflows || 0,
        active_workflows: activeWorkflows || 0,
        total_executions: totalExecutions || 0,
        successful_executions: successfulExecutions || 0,
        failed_executions: failedExecutions || 0,
        executions_today: executionsToday || 0,
      },
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get stats' 
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate next run time for cron schedule
 * Simple implementation - production would use a proper cron parser
 */
function calculateNextRun(cronExpression: string): string {
  // Simplified: assume it runs in 1 hour for any cron expression
  // In production, use a library like cron-parser
  const nextRun = new Date()
  nextRun.setHours(nextRun.getHours() + 1)
  
  // Try to parse simple patterns
  const parts = cronExpression.split(' ')
  if (parts.length === 5) {
    const [minute, hour] = parts
    if (minute !== '*' && hour !== '*') {
      nextRun.setMinutes(parseInt(minute, 10))
      nextRun.setHours(parseInt(hour, 10))
      if (nextRun < new Date()) {
        nextRun.setDate(nextRun.getDate() + 1)
      }
    }
  }
  
  return nextRun.toISOString()
}

// ============================================================================
// PHASE EM-57B: ANALYTICS & TEMPLATES
// ============================================================================

/**
 * Get detailed automation analytics for the analytics dashboard
 */
export async function getAutomationAnalytics(
  siteId: string,
  timeRange: string = '30d'
): Promise<{ 
  success: boolean
  data?: {
    overview: {
      totalExecutions: number
      successfulExecutions: number
      failedExecutions: number
      successRate: number
      averageExecutionTime: number
      totalWorkflows: number
      activeWorkflows: number
      executionTrend: number
    }
    executionsByDay: Array<{
      date: string
      total: number
      successful: number
      failed: number
    }>
    topWorkflows: Array<{
      id: string
      name: string
      executions: number
      successRate: number
    }>
    recentFailures: Array<{
      id: string
      workflowName: string
      errorMessage: string
      timestamp: string
    }>
    executionsByHour: Array<{
      hour: number
      executions: number
    }>
    categoryDistribution: Array<{
      category: string
      count: number
    }>
  }
  error?: string 
}> {
  try {
    const supabase = await createClient()
    
    // Calculate date range
    const days = parseInt(timeRange.replace('d', ''), 10) || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const previousStartDate = new Date(startDate)
    previousStartDate.setDate(previousStartDate.getDate() - days)
    
    // Get workflow counts
    const { count: totalWorkflows } = await supabase
      .from('automation_workflows')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteId)
    
    const { count: activeWorkflows } = await supabase
      .from('automation_workflows')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .eq('is_active', true)
    
    // Get execution statistics for current period
    const { data: executions } = await supabase
      .from('workflow_executions')
      .select('id, status, started_at, completed_at, workflow_id, error')
      .eq('site_id', siteId)
      .gte('started_at', startDate.toISOString())
      .order('started_at', { ascending: false })
    
    type ExecutionRow = {
      id: string
      status: string
      started_at: string | null
      completed_at: string | null
      workflow_id: string
      error: string | null
    }
    
    const executionList = (executions || []) as ExecutionRow[]
    const totalExecutions = executionList.length
    const successfulExecutions = executionList.filter(e => e.status === 'completed').length
    const failedExecutions = executionList.filter(e => e.status === 'failed').length
    const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0
    
    // Calculate average execution time
    const completedExecutions = executionList.filter(e => e.completed_at && e.started_at)
    const avgTime = completedExecutions.length > 0
      ? completedExecutions.reduce((sum, e) => {
          return sum + (new Date(e.completed_at!).getTime() - new Date(e.started_at!).getTime())
        }, 0) / completedExecutions.length
      : 0
    
    // Get previous period count for trend
    const { count: previousExecutions } = await supabase
      .from('workflow_executions')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .gte('started_at', previousStartDate.toISOString())
      .lt('started_at', startDate.toISOString())
    
    const executionTrend = previousExecutions && previousExecutions > 0
      ? ((totalExecutions - previousExecutions) / previousExecutions) * 100
      : 0
    
    // Executions by day
    const executionsByDay: Array<{ date: string; total: number; successful: number; failed: number }> = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayExecutions = executionList.filter(e => 
        e.started_at?.startsWith(dateStr)
      )
      
      executionsByDay.push({
        date: dateStr,
        total: dayExecutions.length,
        successful: dayExecutions.filter(e => e.status === 'completed').length,
        failed: dayExecutions.filter(e => e.status === 'failed').length
      })
    }
    
    // Top workflows
    const { data: workflows } = await supabase
      .from('automation_workflows')
      .select('id, name')
      .eq('site_id', siteId)
    
    type WorkflowRow = { id: string; name: string }
    const workflowList = (workflows || []) as WorkflowRow[]
    
    const workflowStats = workflowList.map(w => {
      const wfExecutions = executionList.filter(e => e.workflow_id === w.id)
      const wfSuccess = wfExecutions.filter(e => e.status === 'completed').length
      return {
        id: w.id,
        name: w.name,
        executions: wfExecutions.length,
        successRate: wfExecutions.length > 0 ? (wfSuccess / wfExecutions.length) * 100 : 0
      }
    }).sort((a, b) => b.executions - a.executions).slice(0, 10)
    
    // Recent failures
    const recentFailures = executionList
      .filter(e => e.status === 'failed')
      .slice(0, 10)
      .map(e => {
        const workflow = workflowList.find(w => w.id === e.workflow_id)
        return {
          id: e.id,
          workflowName: workflow?.name || 'Unknown',
          errorMessage: e.error || 'Unknown error',
          timestamp: e.started_at || ''
        }
      })
    
    // Executions by hour
    const executionsByHour = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      executions: executionList.filter(e => {
        if (!e.started_at) return false
        const execHour = new Date(e.started_at).getHours()
        return execHour === hour
      }).length
    }))
    
    // Category distribution (from workflows)
    const { data: workflowCategories } = await supabase
      .from('automation_workflows')
      .select('category')
      .eq('site_id', siteId)
    
    const categoryCounts: Record<string, number> = {}
    for (const wf of workflowCategories || []) {
      const cat = (wf.category as string) || 'general'
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
    }
    
    const categoryDistribution = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
    
    return {
      success: true,
      data: {
        overview: {
          totalExecutions,
          successfulExecutions,
          failedExecutions,
          successRate,
          averageExecutionTime: avgTime,
          totalWorkflows: totalWorkflows || 0,
          activeWorkflows: activeWorkflows || 0,
          executionTrend
        },
        executionsByDay,
        topWorkflows: workflowStats,
        recentFailures,
        executionsByHour,
        categoryDistribution
      }
    }
  } catch (error) {
    console.error('[Automation] Analytics error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch analytics'
    }
  }
}

/**
 * Create a workflow from a template
 */
export async function createWorkflowFromTemplate(
  siteId: string,
  template: {
    name: string
    description: string
    trigger: { type: string; config: Record<string, unknown> }
    steps: Array<{
      name: string
      step_type: string
      action_type?: string
      config: Record<string, unknown>
    }>
  }
): Promise<{ success: boolean; data?: Workflow; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Generate slug from name
    const slug = template.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    
    // Create the workflow
    const { data: workflow, error: workflowError } = await supabase
      .from('automation_workflows')
      .insert({
        site_id: siteId,
        name: template.name,
        description: template.description,
        slug: `${slug}-${Date.now().toString(36)}`,
        trigger_type: template.trigger.type,
        trigger_config: template.trigger.config as unknown as Json,
        is_active: false,
      })
      .select('*')
      .single()
    
    if (workflowError) {
      console.error('[Automation] Create workflow from template error:', workflowError)
      return { success: false, error: workflowError.message }
    }
    
    // Create the steps
    const stepsToInsert = template.steps.map((step, index) => ({
      workflow_id: workflow.id,
      name: step.name,
      step_type: step.step_type,
      action_type: step.action_type || null,
      action_config: step.config as unknown as Json,
      position: index + 1,
    }))
    
    const { error: stepsError } = await supabase
      .from('workflow_steps')
      .insert(stepsToInsert)
    
    if (stepsError) {
      console.error('[Automation] Create steps from template error:', stepsError)
      // Delete the workflow if steps failed
      await supabase.from('automation_workflows').delete().eq('id', workflow.id)
      return { success: false, error: stepsError.message }
    }
    
    // Emit event
    await emitEvent(
      'automation',
      siteId,
      'automation.workflow_created',
      { 
        workflow_id: workflow.id, 
        name: workflow.name,
        from_template: true 
      }
    )
    
    revalidatePath('/automation')
    return { success: true, data: workflow as unknown as Workflow }
  } catch (error) {
    console.error('[Automation] Create workflow from template exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create workflow'
    }
  }
}

