/**
 * Approval System
 * 
 * Phase EM-58A: AI Agents - Core Infrastructure
 * 
 * Human-in-the-loop approval for dangerous agent actions.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { AgentConfig, ApprovalRequest, RiskLevel } from '../types'
import { assessActionRisk } from './permissions'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AgentDB = any

// ============================================================================
// APPROVAL CREATION
// ============================================================================

/**
 * Create an approval request
 */
export async function createApprovalRequest(
  executionId: string,
  agent: AgentConfig,
  toolName: string,
  input: Record<string, unknown>,
  reason: string
): Promise<ApprovalRequest> {
  const supabase = await createClient() as AgentDB
  
  const riskLevel = assessActionRisk(toolName, input)
  
  const { data, error } = await supabase
    .from('ai_agent_approvals')
    .insert({
      execution_id: executionId,
      agent_id: agent.id,
      site_id: agent.siteId,
      action_type: toolName,
      action_description: describeAction(toolName, input),
      action_params: input,
      risk_level: riskLevel,
      risk_explanation: reason,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    })
    .select()
    .single()
  
  if (error) throw error
  
  // Notify relevant users
  await notifyApprovers(agent.siteId, data)
  
  return mapApproval(data)
}

/**
 * Get pending approvals for a site
 */
export async function getPendingApprovals(
  siteId: string,
  options: {
    agentId?: string
    limit?: number
  } = {}
): Promise<ApprovalRequest[]> {
  const supabase = await createClient() as AgentDB
  
  let query = supabase
    .from('ai_agent_approvals')
    .select(`
      *,
      agent:ai_agents(name, slug),
      execution:ai_agent_executions(trigger_type, trigger_data)
    `)
    .eq('site_id', siteId)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
  
  if (options.agentId) {
    query = query.eq('agent_id', options.agentId)
  }
  
  if (options.limit) {
    query = query.limit(options.limit)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  return data?.map(mapApproval) || []
}

/**
 * Get approval by ID
 */
export async function getApproval(approvalId: string): Promise<ApprovalRequest | null> {
  const supabase = await createClient() as AgentDB
  
  const { data, error } = await supabase
    .from('ai_agent_approvals')
    .select(`
      *,
      agent:ai_agents(name, slug),
      execution:ai_agent_executions(trigger_type, trigger_data)
    `)
    .eq('id', approvalId)
    .single()
  
  if (error || !data) return null
  return mapApproval(data)
}

// ============================================================================
// APPROVAL RESOLUTION
// ============================================================================

/**
 * Approve an action
 */
export async function approveAction(
  approvalId: string,
  userId: string,
  note?: string
): Promise<void> {
  const supabase = await createClient() as AgentDB
  
  const { data: approval, error: fetchError } = await supabase
    .from('ai_agent_approvals')
    .select('*, ai_agent_executions(*)')
    .eq('id', approvalId)
    .single()
  
  if (fetchError || !approval) {
    throw new Error('Approval not found')
  }
  
  if (approval.status !== 'pending') {
    throw new Error('Approval already resolved')
  }
  
  // Update approval status
  await supabase
    .from('ai_agent_approvals')
    .update({
      status: 'approved',
      resolved_by: userId,
      resolved_at: new Date().toISOString(),
      resolution_note: note
    })
    .eq('id', approvalId)
  
  // Resume execution if waiting
  if (approval.ai_agent_executions?.status === 'waiting_approval') {
    await supabase
      .from('ai_agent_executions')
      .update({
        status: 'running'
      })
      .eq('id', approval.execution_id)
  }
}

/**
 * Deny an action
 */
export async function denyAction(
  approvalId: string,
  userId: string,
  note?: string
): Promise<void> {
  const supabase = await createClient() as AgentDB
  
  const { data: approval, error: fetchError } = await supabase
    .from('ai_agent_approvals')
    .select('*, ai_agent_executions(*)')
    .eq('id', approvalId)
    .single()
  
  if (fetchError || !approval) {
    throw new Error('Approval not found')
  }
  
  if (approval.status !== 'pending') {
    throw new Error('Approval already resolved')
  }
  
  // Update approval status
  await supabase
    .from('ai_agent_approvals')
    .update({
      status: 'denied',
      resolved_by: userId,
      resolved_at: new Date().toISOString(),
      resolution_note: note
    })
    .eq('id', approvalId)
  
  // Cancel execution if waiting
  if (approval.ai_agent_executions?.status === 'waiting_approval') {
    await supabase
      .from('ai_agent_executions')
      .update({
        status: 'cancelled',
        error: 'Action denied by user',
        completed_at: new Date().toISOString()
      })
      .eq('id', approval.execution_id)
  }
}

/**
 * Expire old pending approvals
 */
export async function expireOldApprovals(): Promise<number> {
  const supabase = await createClient() as AgentDB
  
  const { count } = await supabase
    .from('ai_agent_approvals')
    .update({
      status: 'expired'
    })
    .eq('status', 'pending')
    .lt('expires_at', new Date().toISOString())
  
  return count || 0
}

// ============================================================================
// HELPERS
// ============================================================================

function describeAction(toolName: string, input: Record<string, unknown>): string {
  switch (toolName) {
    case 'email_send':
      return `Send email to ${Array.isArray(input.to) ? input.to.length : 1} recipient(s): "${input.subject}"`
    case 'crm_create_contact':
      return `Create contact: ${input.email}`
    case 'crm_update_contact':
      return `Update contact: ${input.contact_id}`
    case 'crm_delete_contact':
      return `Delete contact: ${input.contact_id}`
    case 'trigger_workflow':
      return `Trigger workflow: ${input.workflow_id}`
    default:
      return `Execute ${toolName} with ${Object.keys(input).length} parameters`
  }
}

async function notifyApprovers(siteId: string, approval: Record<string, unknown>): Promise<void> {
  // TODO: Implement notification to site admins
  // For now, just log
  console.log(`[Approval] Pending approval ${approval.id} for site ${siteId}`)
}

function mapApproval(data: Record<string, unknown>): ApprovalRequest {
  return {
    id: data.id as string,
    executionId: data.execution_id as string,
    agentId: data.agent_id as string,
    siteId: data.site_id as string,
    actionType: data.action_type as string,
    actionDescription: data.action_description as string,
    actionParams: data.action_params as Record<string, unknown>,
    riskLevel: data.risk_level as RiskLevel,
    riskExplanation: data.risk_explanation as string | undefined,
    status: data.status as 'pending' | 'approved' | 'denied' | 'expired',
    resolvedBy: data.resolved_by as string | undefined,
    resolvedAt: data.resolved_at as string | undefined,
    resolutionNote: data.resolution_note as string | undefined,
    expiresAt: data.expires_at as string | undefined,
    createdAt: data.created_at as string
  }
}
