/**
 * Event Processor Service
 * 
 * Phase EM-57A: Automation Engine - Core Infrastructure
 * 
 * Processes events from the module_events system and triggers workflows.
 * This service integrates with the existing emitEvent() infrastructure.
 * 
 * NOTE: This is implemented as standalone async functions following the
 * Server Actions pattern used throughout the platform.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { executeWorkflow } from './execution-engine'
import type { AutomationEventLog, EventSubscription } from '../types/automation-types'

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
// EVENT PROCESSING
// ============================================================================

/**
 * Process pending events for a site
 * 
 * This function queries automation_events_log for unprocessed events
 * and triggers any subscribed workflows.
 */
export async function processPendingEvents(
  siteId: string,
  batchSize: number = 100
): Promise<{ processed: number; triggered: number; errors: string[] }> {
  const supabase = await createClient() as AutomationDB
  const errors: string[] = []
  let triggeredCount = 0
  
  // Get unprocessed events
  const { data: events, error: fetchError } = await supabase
    .from('automation_events_log')
    .select('*')
    .eq('site_id', siteId)
    .eq('processed', false)
    .order('created_at', { ascending: true })
    .limit(batchSize)
  
  if (fetchError || !events?.length) {
    return { processed: 0, triggered: 0, errors: fetchError ? [fetchError.message] : [] }
  }
  
  // Process each event
  for (const event of events) {
    try {
      const result = await handleEvent(siteId, event as AutomationEventLog)
      triggeredCount += result.workflowsTriggered
      
      // Mark as processed
      await supabase
        .from('automation_events_log')
        .update({
          processed: true,
          processed_at: new Date().toISOString(),
          workflows_triggered: result.workflowsTriggered,
        })
        .eq('id', event.id)
    } catch (err) {
      errors.push(`Event ${event.id}: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }
  
  return { processed: events.length, triggered: triggeredCount, errors }
}

/**
 * Handle a single event
 */
async function handleEvent(
  siteId: string,
  event: AutomationEventLog
): Promise<{ workflowsTriggered: number }> {
  const supabase = await createClient() as AutomationDB
  
  // Find workflows subscribed to this event
  const { data: subscriptions } = await supabase
    .from('automation_event_subscriptions')
    .select(`
      *,
      workflow:automation_workflows(*)
    `)
    .eq('site_id', siteId)
    .eq('event_type', event.event_type)
    .eq('is_active', true)
  
  if (!subscriptions?.length) {
    return { workflowsTriggered: 0 }
  }
  
  let triggeredCount = 0
  
  // Trigger each subscribed workflow
  for (const sub of subscriptions) {
    const subscription = sub as EventSubscription & { workflow: unknown }
    const workflow = subscription.workflow as { id: string; is_active: boolean } | null
    
    if (!workflow?.is_active) continue
    
    // Check event filter (if any)
    if (subscription.event_filter && Object.keys(subscription.event_filter).length > 0) {
      if (!matchesFilter(event.payload, subscription.event_filter)) {
        continue
      }
    }
    
    // Queue workflow execution
    await queueWorkflowExecution(
      workflow.id,
      siteId,
      'event',
      event.id,
      event.payload
    )
    
    triggeredCount++
    
    // Update subscription stats
    await supabase
      .from('automation_event_subscriptions')
      .update({
        events_received: (subscription.events_received || 0) + 1,
        last_event_at: new Date().toISOString(),
      })
      .eq('id', subscription.id)
  }
  
  return { workflowsTriggered: triggeredCount }
}

/**
 * Queue a workflow execution
 */
export async function queueWorkflowExecution(
  workflowId: string,
  siteId: string,
  triggerType: string,
  triggerEventId: string | null,
  triggerData: Record<string, unknown>
): Promise<string> {
  const supabase = await createClient() as AutomationDB
  
  // Count total steps in workflow
  const { count: stepsCount } = await supabase
    .from('workflow_steps')
    .select('*', { count: 'exact', head: true })
    .eq('workflow_id', workflowId)
  
  const { data, error } = await supabase
    .from('workflow_executions')
    .insert({
      workflow_id: workflowId,
      site_id: siteId,
      status: 'pending',
      trigger_type: triggerType,
      trigger_event_id: triggerEventId,
      trigger_data: triggerData,
      context: { trigger: triggerData, steps: {}, variables: {} },
      steps_total: stepsCount || 0,
    })
    .select('id')
    .single()
  
  if (error) throw error
  return data.id
}

/**
 * Log an event for automation processing
 * 
 * Call this function when emitting events that should trigger automations.
 * This creates a record in automation_events_log and IMMEDIATELY processes it
 * to trigger any matching workflows.
 */
export async function logAutomationEvent(
  siteId: string,
  eventType: string,
  payload: Record<string, unknown>,
  options: {
    sourceModule?: string
    sourceEntityType?: string
    sourceEntityId?: string
    sourceEventId?: string
  } = {}
): Promise<{ success: boolean; eventId?: string; workflowsTriggered?: number; error?: string }> {
  const supabase = await createClient() as AutomationDB
  
  // Log the event
  const { data, error } = await supabase
    .from('automation_events_log')
    .insert({
      site_id: siteId,
      event_type: eventType,
      payload,
      source_module: options.sourceModule || null,
      source_entity_type: options.sourceEntityType || null,
      source_entity_id: options.sourceEntityId || null,
      source_event_id: options.sourceEventId || null,
      processed: false,
    })
    .select('*')
    .single()
  
  if (error) {
    console.error('[Automation] Failed to log event:', error)
    return { success: false, error: error.message }
  }
  
  // IMMEDIATELY process the event to trigger workflows
  try {
    const result = await processEventImmediately(siteId, data as AutomationEventLog)
    
    // Mark as processed
    await supabase
      .from('automation_events_log')
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
        workflows_triggered: result.workflowsTriggered,
      })
      .eq('id', data.id)
    
    console.log(`[Automation] Event ${eventType} processed: ${result.workflowsTriggered} workflows triggered`)
    
    return { 
      success: true, 
      eventId: data.id, 
      workflowsTriggered: result.workflowsTriggered 
    }
  } catch (processError) {
    console.error('[Automation] Failed to process event:', processError)
    // Event is still logged, just not processed - will be picked up by batch processor
    return { success: true, eventId: data.id, workflowsTriggered: 0 }
  }
}

/**
 * Process a single event immediately (inline)
 * Called right after logging for real-time workflow triggering
 */
async function processEventImmediately(
  siteId: string,
  event: AutomationEventLog
): Promise<{ workflowsTriggered: number }> {
  const supabase = await createClient() as AutomationDB
  
  // Find workflows subscribed to this event type that are active
  const { data: subscriptions, error } = await supabase
    .from('automation_event_subscriptions')
    .select(`
      *,
      workflow:automation_workflows(id, name, is_active, site_id)
    `)
    .eq('site_id', siteId)
    .eq('event_type', event.event_type)
    .eq('is_active', true)
  
  if (error || !subscriptions?.length) {
    console.log(`[Automation] No active subscriptions found for ${event.event_type}`)
    return { workflowsTriggered: 0 }
  }
  
  let triggeredCount = 0
  
  for (const sub of subscriptions) {
    const subscription = sub as EventSubscription & { workflow: { id: string; name: string; is_active: boolean; site_id: string } | null }
    const workflow = subscription.workflow
    
    // Skip if workflow is inactive
    if (!workflow?.is_active) {
      console.log(`[Automation] Skipping inactive workflow: ${workflow?.name}`)
      continue
    }
    
    // Check event filter (if any)
    if (subscription.event_filter && Object.keys(subscription.event_filter).length > 0) {
      if (!matchesFilter(event.payload, subscription.event_filter)) {
        console.log(`[Automation] Event doesn't match filter for workflow: ${workflow.name}`)
        continue
      }
    }
    
    // Queue workflow execution
    console.log(`[Automation] Triggering workflow: ${workflow.name} for event ${event.event_type}`)
    
    const executionId = await queueWorkflowExecution(
      workflow.id,
      siteId,
      'event',
      event.id,
      event.payload
    )
    
    // CRITICAL: Actually execute the workflow (don't just queue it!)
    console.log(`[Automation] Executing workflow ${workflow.name} (execution: ${executionId})`)
    try {
      // Execute in background - don't await to avoid blocking the CRM action
      executeWorkflow(executionId).then(() => {
        console.log(`[Automation] ✅ Workflow ${workflow.name} completed`)
      }).catch((execError) => {
        console.error(`[Automation] ❌ Workflow ${workflow.name} failed:`, execError)
      })
    } catch (execError) {
      console.error(`[Automation] Failed to start workflow execution:`, execError)
    }
    
    triggeredCount++
    
    // Update subscription stats
    await supabase
      .from('automation_event_subscriptions')
      .update({
        events_received: (subscription.events_received || 0) + 1,
        last_event_at: new Date().toISOString(),
      })
      .eq('id', subscription.id)
  }
  
  return { workflowsTriggered: triggeredCount }
}

// ============================================================================
// FILTER MATCHING
// ============================================================================

/**
 * Check if payload matches filter conditions
 * 
 * Supports operators: $eq, $ne, $gt, $gte, $lt, $lte, $contains, $in
 */
function matchesFilter(
  payload: Record<string, unknown>,
  filter: Record<string, unknown>
): boolean {
  for (const [key, expected] of Object.entries(filter)) {
    const actual = getNestedValue(payload, key)
    
    if (typeof expected === 'object' && expected !== null && !Array.isArray(expected)) {
      // Handle operators
      const op = Object.keys(expected)[0]
      const opValue = (expected as Record<string, unknown>)[op]
      
      switch (op) {
        case '$eq':
          if (actual !== opValue) return false
          break
        case '$ne':
          if (actual === opValue) return false
          break
        case '$gt':
          if (!(Number(actual) > Number(opValue))) return false
          break
        case '$gte':
          if (!(Number(actual) >= Number(opValue))) return false
          break
        case '$lt':
          if (!(Number(actual) < Number(opValue))) return false
          break
        case '$lte':
          if (!(Number(actual) <= Number(opValue))) return false
          break
        case '$contains':
          if (typeof actual !== 'string' || !actual.includes(String(opValue))) return false
          break
        case '$in':
          if (!Array.isArray(opValue) || !opValue.includes(actual)) return false
          break
        case '$nin':
          if (!Array.isArray(opValue) || opValue.includes(actual)) return false
          break
        case '$exists':
          if (opValue && actual === undefined) return false
          if (!opValue && actual !== undefined) return false
          break
        default:
          // Unknown operator, treat as direct equality
          if (actual !== expected) return false
      }
    } else {
      // Direct equality check
      if (actual !== expected) return false
    }
  }
  return true
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, part) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[part]
    }
    return undefined
  }, obj)
}

// ============================================================================
// SCHEDULED JOB PROCESSING
// ============================================================================

/**
 * Process scheduled jobs that are due to run
 */
export async function processScheduledJobs(): Promise<{ executed: number; errors: string[] }> {
  const supabase = await createClient() as AutomationDB
  const errors: string[] = []
  let executed = 0
  
  // Get jobs that are due
  const now = new Date().toISOString()
  const { data: jobs, error: fetchError } = await supabase
    .from('automation_scheduled_jobs')
    .select(`
      *,
      workflow:automation_workflows(*)
    `)
    .eq('is_active', true)
    .lte('next_run_at', now)
    .limit(50)
  
  if (fetchError || !jobs?.length) {
    return { executed: 0, errors: fetchError ? [fetchError.message] : [] }
  }
  
  for (const job of jobs) {
    try {
      const workflow = job.workflow as { id: string; is_active: boolean; site_id: string } | null
      
      if (!workflow?.is_active) {
        // Skip inactive workflows
        continue
      }
      
      // Queue workflow execution
      await queueWorkflowExecution(
        workflow.id,
        workflow.site_id,
        'schedule',
        null,
        { scheduledAt: now, jobId: job.id }
      )
      
      executed++
      
      // Update job status
      await supabase
        .from('automation_scheduled_jobs')
        .update({
          last_run_at: now,
          last_status: 'triggered',
          consecutive_failures: 0,
          // Calculate next run (simplified - real implementation needs proper cron parsing)
          next_run_at: calculateNextRun(job.cron_expression),
        })
        .eq('id', job.id)
    } catch (err) {
      errors.push(`Job ${job.id}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      
      // Update failure count
      const failures = (job.consecutive_failures || 0) + 1
      await supabase
        .from('automation_scheduled_jobs')
        .update({
          last_status: 'failed',
          consecutive_failures: failures,
          is_active: failures < (job.max_consecutive_failures || 5),
        })
        .eq('id', job.id)
    }
  }
  
  return { executed, errors }
}

/**
 * Calculate next run time from cron expression
 * 
 * NOTE: This is a simplified implementation. For production,
 * consider using a library like cron-parser.
 */
function calculateNextRun(cronExpression: string): string {
  // Simple placeholder - adds 1 hour by default
  // Real implementation should parse cron and calculate actual next run
  const _cron = cronExpression // Acknowledge the parameter
  return new Date(Date.now() + 60 * 60 * 1000).toISOString()
}

// ============================================================================
// WEBHOOK PROCESSING
// ============================================================================

/**
 * Process incoming webhook and trigger workflow
 */
export async function processIncomingWebhook(
  siteId: string,
  endpointPath: string,
  payload: Record<string, unknown>,
  headers: Record<string, string>
): Promise<{ success: boolean; executionId?: string; error?: string }> {
  const supabase = await createClient() as AutomationDB
  
  // Find the webhook endpoint
  const { data: endpoint, error: fetchError } = await supabase
    .from('automation_webhook_endpoints')
    .select(`
      *,
      workflow:automation_workflows(*)
    `)
    .eq('site_id', siteId)
    .eq('endpoint_path', endpointPath)
    .eq('is_active', true)
    .single()
  
  if (fetchError || !endpoint) {
    return { success: false, error: 'Webhook endpoint not found' }
  }
  
  // Verify signature if secret is set
  const signature = headers['x-webhook-signature'] || headers['x-signature']
  if (endpoint.secret_key && signature) {
    // TODO: Implement signature verification
    // const isValid = verifyWebhookSignature(payload, signature, endpoint.secret_key)
    // if (!isValid) return { success: false, error: 'Invalid signature' }
  }
  
  const workflow = endpoint.workflow as { id: string; is_active: boolean } | null
  if (!workflow?.is_active) {
    return { success: false, error: 'Workflow is not active' }
  }
  
  // Queue workflow execution
  const executionId = await queueWorkflowExecution(
    workflow.id,
    siteId,
    'webhook',
    null,
    { ...payload, _headers: headers, _webhookPath: endpointPath }
  )
  
  // Update webhook stats
  await supabase
    .from('automation_webhook_endpoints')
    .update({
      total_calls: (endpoint.total_calls || 0) + 1,
      last_called_at: new Date().toISOString(),
    })
    .eq('id', endpoint.id)
  
  return { success: true, executionId }
}
