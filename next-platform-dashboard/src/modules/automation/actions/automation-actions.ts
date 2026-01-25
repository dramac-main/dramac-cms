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
  WebhookEndpoint 
} from '../types/automation-types'

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
    
    const { data: workflow, error } = await supabase
      .from('automation_workflows')
      .insert({
        site_id: siteId,
        name: data.name,
        description: data.description,
        trigger_type: data.trigger_type,
        trigger_config: data.trigger_config,
        status: 'draft',
        version: 1,
      })
      .select('*')
      .single()
    
    if (error) {
      console.error('[Automation] Create workflow error:', error)
      return { success: false, error: error.message }
    }
    
    // Emit event for other modules
    await emitEvent({
      siteId,
      source: 'automation',
      type: 'automation.workflow_created',
      payload: { workflow_id: workflow.id, name: workflow.name },
    })
    
    revalidatePath('/automation')
    return { success: true, data: workflow as Workflow }
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
    
    return { success: true, data: workflow as Workflow }
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
    status?: Workflow['status']
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
    
    if (options?.status) {
      query = query.eq('status', options.status)
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
    
    return { success: true, data: data as Workflow[], count: count || 0 }
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
    trigger_config: Workflow['trigger_config']
    status: Workflow['status']
  }>
): Promise<{ success: boolean; data?: Workflow; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: workflow, error } = await supabase
      .from('automation_workflows')
      .update(data)
      .eq('id', workflowId)
      .select('*')
      .single()
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    revalidatePath('/automation')
    return { success: true, data: workflow as Workflow }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update workflow' 
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
      await emitEvent({
        siteId: workflow.site_id,
        source: 'automation',
        type: 'automation.workflow_deleted',
        payload: { workflow_id: workflowId, name: workflow.name },
      })
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
    
    // Update status to active
    const { error: updateError } = await supabase
      .from('automation_workflows')
      .update({ status: 'active' })
      .eq('id', workflowId)
    
    if (updateError) {
      return { success: false, error: updateError.message }
    }
    
    // If scheduled trigger, create scheduled job
    if (workflow.trigger_type === 'scheduled' && workflow.trigger_config?.schedule) {
      await supabase
        .from('automation_scheduled_jobs')
        .upsert({
          site_id: workflow.site_id,
          workflow_id: workflowId,
          schedule_cron: workflow.trigger_config.schedule,
          next_run_at: calculateNextRun(workflow.trigger_config.schedule),
          status: 'scheduled',
        })
    }
    
    await emitEvent({
      siteId: workflow.site_id,
      source: 'automation',
      type: 'automation.workflow_activated',
      payload: { workflow_id: workflowId, name: workflow.name },
    })
    
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
      .update({ status: 'paused' })
      .eq('id', workflowId)
      .select('site_id, name')
      .single()
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    // Pause any scheduled jobs
    await supabase
      .from('automation_scheduled_jobs')
      .update({ status: 'paused' })
      .eq('workflow_id', workflowId)
    
    await emitEvent({
      siteId: workflow.site_id,
      source: 'automation',
      type: 'automation.workflow_paused',
      payload: { workflow_id: workflowId, name: workflow.name },
    })
    
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
    action_type: string
    action_config: Record<string, unknown>
    step_order?: number
    condition_config?: WorkflowStep['condition_config']
    delay_config?: WorkflowStep['delay_config']
    error_handling?: WorkflowStep['error_handling']
  }
): Promise<{ success: boolean; data?: WorkflowStep; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Get max step order if not provided
    let stepOrder = data.step_order
    if (stepOrder === undefined) {
      const { data: maxStep } = await supabase
        .from('workflow_steps')
        .select('step_order')
        .eq('workflow_id', workflowId)
        .order('step_order', { ascending: false })
        .limit(1)
        .single()
      
      stepOrder = maxStep ? maxStep.step_order + 1 : 1
    }
    
    const { data: step, error } = await supabase
      .from('workflow_steps')
      .insert({
        workflow_id: workflowId,
        action_type: data.action_type,
        action_config: data.action_config,
        step_order: stepOrder,
        condition_config: data.condition_config || null,
        delay_config: data.delay_config || null,
        error_handling: data.error_handling || { on_error: 'continue', max_retries: 0 },
      })
      .select('*')
      .single()
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    revalidatePath('/automation')
    return { success: true, data: step as WorkflowStep }
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
      .order('step_order', { ascending: true })
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true, data: steps as WorkflowStep[] }
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
    step_order: number
    condition_config: WorkflowStep['condition_config']
    delay_config: WorkflowStep['delay_config']
    error_handling: WorkflowStep['error_handling']
  }>
): Promise<{ success: boolean; data?: WorkflowStep; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: step, error } = await supabase
      .from('workflow_steps')
      .update(data)
      .eq('id', stepId)
      .select('*')
      .single()
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    revalidatePath('/automation')
    return { success: true, data: step as WorkflowStep }
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
    
    // Update each step with new order
    const updates = stepIds.map((stepId, index) => ({
      id: stepId,
      step_order: index + 1,
    }))
    
    for (const update of updates) {
      const { error } = await supabase
        .from('workflow_steps')
        .update({ step_order: update.step_order })
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
    
    return { success: true, data: data as WorkflowExecution[], count: count || 0 }
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
  data?: WorkflowExecution & { step_logs: unknown[] }
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
        ...execution,
        step_logs: execution.step_execution_logs || [],
      } as WorkflowExecution & { step_logs: unknown[] },
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
        trigger_data: original.trigger_data,
        status: 'pending',
        context: {},
        retry_of: executionId,
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
      .select('site_id, status')
      .eq('id', workflowId)
      .single()
    
    if (fetchError || !workflow) {
      return { success: false, error: 'Workflow not found' }
    }
    
    if (workflow.status !== 'active' && workflow.status !== 'draft') {
      return { success: false, error: 'Workflow is not active' }
    }
    
    // Create execution
    const { data: execution, error: createError } = await supabase
      .from('workflow_executions')
      .insert({
        site_id: workflow.site_id,
        workflow_id: workflowId,
        trigger_data: triggerData || {},
        status: 'pending',
        context: {},
      })
      .select('id')
      .single()
    
    if (createError) {
      return { success: false, error: createError.message }
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
        credentials: data.credentials,
        status: 'active',
      })
      .select('id, site_id, service_type, name, status, created_at, updated_at')
      .single()
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    revalidatePath('/automation/settings')
    return { success: true, data: connection as AutomationConnection }
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
    
    return { success: true, data: connections as AutomationConnection[] }
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
    status: 'active' | 'inactive' | 'error'
  }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('automation_connections')
      .update(data)
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
    
    // Test based on service type
    switch (connection.service_type) {
      case 'slack': {
        const webhookUrl = connection.credentials.webhook_url as string
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
        const webhookUrl = connection.credentials.webhook_url as string
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
        if (!connection.credentials || Object.keys(connection.credentials).length === 0) {
          return { success: false, error: 'No credentials configured' }
        }
    }
    
    // Update last tested timestamp
    await supabase
      .from('automation_connections')
      .update({ 
        status: 'active',
        updated_at: new Date().toISOString(),
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
  workflowId: string,
  options?: { name?: string }
): Promise<{ success: boolean; data?: WebhookEndpoint; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: endpoint, error } = await supabase
      .from('automation_webhook_endpoints')
      .insert({
        site_id: siteId,
        workflow_id: workflowId,
        name: options?.name || 'Webhook Endpoint',
        // webhook_path and webhook_secret are auto-generated by database
      })
      .select('*')
      .single()
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    revalidatePath('/automation')
    return { success: true, data: endpoint as WebhookEndpoint }
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
      .select('id, site_id, workflow_id, name, webhook_path, is_active, created_at')
      .eq('workflow_id', workflowId)
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true, data: endpoints as WebhookEndpoint[] }
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
        filters: filters || {},
        is_active: true,
      }, {
        onConflict: 'workflow_id,event_type',
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
      .eq('status', 'active')
    
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
