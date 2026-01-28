/**
 * Permissions System
 * 
 * Phase EM-58A: AI Agents - Core Infrastructure
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { AgentConfig, RiskLevel } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AgentDB = any

// ============================================================================
// PERMISSION TYPES
// ============================================================================

export interface AgentPermissions {
  // Data access
  canReadContacts: boolean
  canWriteContacts: boolean
  canDeleteContacts: boolean
  
  canReadDeals: boolean
  canWriteDeals: boolean
  
  canReadFinancials: boolean
  
  // Actions
  canSendEmails: boolean
  canSendSMS: boolean
  canMakeAPICalls: boolean
  canTriggerWorkflows: boolean
  
  // External
  canAccessWeb: boolean
  canAccessExternalAPIs: boolean
  
  // System
  canCreateTasks: boolean
  canModifySettings: boolean
}

// Tool to permission mapping
const TOOL_PERMISSIONS: Record<string, (keyof AgentPermissions)[]> = {
  'crm_get_contact': ['canReadContacts'],
  'crm_search_contacts': ['canReadContacts'],
  'crm_create_contact': ['canWriteContacts'],
  'crm_update_contact': ['canWriteContacts'],
  'crm_delete_contact': ['canDeleteContacts'],
  'crm_add_note': ['canWriteContacts'],
  'email_send': ['canSendEmails'],
  'email_draft': ['canSendEmails'],
  'sms_send': ['canSendSMS'],
  'web_search': ['canAccessWeb'],
  'web_scrape': ['canAccessWeb', 'canAccessExternalAPIs'],
  'trigger_workflow': ['canTriggerWorkflows'],
  'data_query': ['canReadContacts', 'canReadDeals'],
  'data_aggregate': ['canReadContacts', 'canReadDeals']
}

// ============================================================================
// PERMISSION CHECKER
// ============================================================================

/**
 * Check if agent has required permissions for a tool
 */
export async function checkAgentPermissions(
  agentId: string,
  siteId: string,
  requiredPermissions: string[]
): Promise<{ allowed: boolean; denied: string[] }> {
  const supabase = await createClient() as AgentDB
  
  // Get agent's allowed/denied tools
  const { data: agent } = await supabase
    .from('ai_agents')
    .select('allowed_tools, denied_tools, constraints')
    .eq('id', agentId)
    .single()
  
  if (!agent) {
    return { allowed: false, denied: requiredPermissions }
  }
  
  const denied: string[] = []
  
  for (const permission of requiredPermissions) {
    // Check if explicitly denied
    if (agent.denied_tools.includes(permission)) {
      denied.push(permission)
      continue
    }
    
    // Check if allowed (with wildcard support)
    const isAllowed = agent.allowed_tools.some((allowed: string) => {
      if (allowed.endsWith('*')) {
        return permission.startsWith(allowed.slice(0, -1))
      }
      return allowed === permission
    })
    
    if (!isAllowed) {
      denied.push(permission)
    }
  }
  
  return {
    allowed: denied.length === 0,
    denied
  }
}

/**
 * Check if a specific tool is allowed for an agent
 */
export async function canAgentUseTool(
  agentId: string,
  toolName: string
): Promise<boolean> {
  const result = await checkAgentPermissions(agentId, '', [toolName])
  return result.allowed
}

/**
 * Get agent's effective permissions
 */
export async function getAgentEffectivePermissions(
  agentId: string
): Promise<Partial<AgentPermissions>> {
  const supabase = await createClient() as AgentDB
  
  const { data: agent } = await supabase
    .from('ai_agents')
    .select('allowed_tools, denied_tools')
    .eq('id', agentId)
    .single()
  
  if (!agent) {
    return {}
  }
  
  const permissions: Partial<AgentPermissions> = {}
  
  // Check each tool and derive permissions
  for (const [tool, perms] of Object.entries(TOOL_PERMISSIONS)) {
    const isAllowed = agent.allowed_tools.some((allowed: string) => {
      if (allowed.endsWith('*')) {
        return tool.startsWith(allowed.slice(0, -1))
      }
      return allowed === tool
    })
    
    const isDenied = agent.denied_tools.includes(tool)
    
    if (isAllowed && !isDenied) {
      for (const perm of perms) {
        permissions[perm] = true
      }
    }
  }
  
  return permissions
}

// ============================================================================
// RISK ASSESSMENT
// ============================================================================

/**
 * Assess risk level of an action
 */
export function assessActionRisk(
  toolName: string,
  input: Record<string, unknown>
): RiskLevel {
  // Critical risk actions
  const criticalTools = ['crm_delete_*', 'data_delete_*', 'settings_*']
  for (const pattern of criticalTools) {
    const regex = new RegExp('^' + pattern.replace('*', '.*') + '$')
    if (regex.test(toolName)) {
      return 'critical'
    }
  }
  
  // High risk actions
  const highRiskTools = ['email_send', 'sms_send', 'data_export']
  if (highRiskTools.includes(toolName)) {
    // Check if sending to many recipients
    if (Array.isArray(input.to) && input.to.length > 10) {
      return 'critical'
    }
    return 'high'
  }
  
  // Medium risk actions
  const mediumRiskTools = ['crm_create_contact', 'crm_update_contact', 'trigger_workflow']
  if (mediumRiskTools.includes(toolName)) {
    return 'medium'
  }
  
  // Read-only operations are low risk
  if (toolName.includes('get') || toolName.includes('search') || toolName.includes('query')) {
    return 'low'
  }
  
  return 'low'
}

/**
 * Check if action needs human approval based on risk
 */
export function needsApproval(
  riskLevel: RiskLevel,
  agentConfig: AgentConfig,
  isDangerous: boolean
): boolean {
  // Always require approval for dangerous tools
  if (isDangerous) {
    return true
  }
  
  // Critical actions always need approval
  if (riskLevel === 'critical') {
    return true
  }
  
  // High risk actions need approval unless explicitly allowed
  if (riskLevel === 'high') {
    // Check if constraints allow high-risk actions
    const allowsHighRisk = agentConfig.constraints.some(
      c => c.toLowerCase().includes('allow high risk') || 
           c.toLowerCase().includes('skip approval')
    )
    return !allowsHighRisk
  }
  
  return false
}
