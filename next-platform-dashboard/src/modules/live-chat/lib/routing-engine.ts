/**
 * Smart Routing Engine
 *
 * PHASE LC-06: Routes conversations to the best available agent
 * based on skills, capacity, department, and round-robin fairness.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { detectIntent } from './ai-responder'

// =============================================================================
// TYPES
// =============================================================================

interface RoutingResult {
  agentId: string | null
  departmentId: string | null
  reason: string
  queuePosition?: number
}

interface AgentCandidate {
  id: string
  user_id: string
  display_name: string
  status: string
  current_chat_count: number
  max_concurrent_chats: number
  department_id: string | null
  skills: string[] | null
  is_active: boolean
  last_assignment_at: string | null
}

// =============================================================================
// ROUTE CONVERSATION
// =============================================================================

export async function routeConversation(
  siteId: string,
  conversationId: string,
  visitorMessage?: string,
  preferredDepartmentId?: string
): Promise<RoutingResult> {
  const supabase = createAdminClient() as any

  // 1. Detect intent to determine department if none specified
  let targetDepartmentId = preferredDepartmentId
  if (!targetDepartmentId && visitorMessage) {
    const intent = await detectIntent(visitorMessage)
    if (intent.suggestedDepartment) {
      const { data: dept } = await supabase
        .from('mod_chat_departments')
        .select('id')
        .eq('site_id', siteId)
        .ilike('name', `%${intent.suggestedDepartment}%`)
        .eq('is_active', true)
        .single()

      if (dept) targetDepartmentId = dept.id
    }
  }

  // 2. Get available agents
  let query = supabase
    .from('mod_chat_agents')
    .select('id, user_id, display_name, status, current_chat_count, max_concurrent_chats, department_id, skills, is_active, last_assignment_at')
    .eq('site_id', siteId)
    .eq('is_active', true)
    .eq('status', 'online')

  if (targetDepartmentId) {
    query = query.or(`department_id.eq.${targetDepartmentId},department_id.is.null`)
  }

  const { data: agents } = await query

  if (!agents || agents.length === 0) {
    // No agents online — queue the conversation
    const queuePos = await getQueuePosition(siteId)
    return {
      agentId: null,
      departmentId: targetDepartmentId || null,
      reason: 'No agents currently available',
      queuePosition: queuePos,
    }
  }

  // 3. Filter to agents with capacity
  const available = (agents as AgentCandidate[]).filter(
    (a) => a.current_chat_count < a.max_concurrent_chats
  )

  if (available.length === 0) {
    const queuePos = await getQueuePosition(siteId)
    return {
      agentId: null,
      departmentId: targetDepartmentId || null,
      reason: 'All agents at maximum capacity',
      queuePosition: queuePos,
    }
  }

  // 4. Score each agent
  const scored = available.map((agent) => {
    let score = 0

    // Prefer department match
    if (targetDepartmentId && agent.department_id === targetDepartmentId) {
      score += 10
    }

    // Lower load is better (inverse — fewer chats = higher score)
    const loadRatio = agent.current_chat_count / agent.max_concurrent_chats
    score += (1 - loadRatio) * 5

    // Round-robin fairness — prefer agents who haven't been assigned recently
    if (agent.last_assignment_at) {
      const lastAssigned = new Date(agent.last_assignment_at).getTime()
      const ageMinutes = (Date.now() - lastAssigned) / 60000
      score += Math.min(ageMinutes / 10, 3) // up to 3 bonus points
    } else {
      score += 3 // Never assigned — highest priority
    }

    return { agent, score }
  })

  scored.sort((a, b) => b.score - a.score)
  const best = scored[0].agent

  // 5. Assign conversation
  await supabase
    .from('mod_chat_conversations')
    .update({
      assigned_agent_id: best.id,
      department_id: targetDepartmentId || best.department_id,
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId)

  // 6. Update agent's chat count and assignment time
  await supabase
    .from('mod_chat_agents')
    .update({
      current_chat_count: best.current_chat_count + 1,
      last_assignment_at: new Date().toISOString(),
    })
    .eq('id', best.id)

  return {
    agentId: best.id,
    departmentId: targetDepartmentId || best.department_id,
    reason: `Assigned to ${best.display_name} (score: ${scored[0].score.toFixed(1)})`,
  }
}

// =============================================================================
// REBALANCE CONVERSATIONS
// =============================================================================

export async function rebalanceConversations(siteId: string): Promise<{
  reassigned: number
  errors: string[]
}> {
  const supabase = createAdminClient() as any
  let reassigned = 0
  const errors: string[] = []

  try {
    // Get unassigned active conversations
    const { data: unassigned } = await supabase
      .from('mod_chat_conversations')
      .select('id')
      .eq('site_id', siteId)
      .is('assigned_agent_id', null)
      .in('status', ['new', 'waiting'])
      .order('created_at', { ascending: true })
      .limit(20)

    if (!unassigned || unassigned.length === 0) {
      return { reassigned: 0, errors: [] }
    }

    for (const conv of unassigned) {
      const result = await routeConversation(siteId, conv.id)
      if (result.agentId) {
        reassigned++
      }
    }
  } catch (err) {
    errors.push(err instanceof Error ? err.message : 'Rebalance failed')
  }

  return { reassigned, errors }
}

// =============================================================================
// CHECK MISSED CONVERSATIONS
// =============================================================================

export async function checkMissedConversations(siteId: string): Promise<{
  missed: number
  alerted: number
}> {
  const supabase = createAdminClient() as any
  const STALE_MINUTES = 5

  const staleTime = new Date(
    Date.now() - STALE_MINUTES * 60000
  ).toISOString()

  const { data: stale } = await supabase
    .from('mod_chat_conversations')
    .select('id')
    .eq('site_id', siteId)
    .in('status', ['new', 'waiting'])
    .is('assigned_agent_id', null)
    .lt('created_at', staleTime)

  const missedCount = stale?.length || 0

  if (missedCount > 0) {
    // Mark them as missed
    const ids = stale!.map((c: Record<string, unknown>) => c.id)
    await supabase
      .from('mod_chat_conversations')
      .update({ status: 'waiting', updated_at: new Date().toISOString() })
      .in('id', ids)

    // Try to route them again
    let alerted = 0
    for (const conv of stale!) {
      const result = await routeConversation(siteId, (conv as Record<string, unknown>).id as string)
      if (result.agentId) alerted++
    }

    return { missed: missedCount, alerted }
  }

  return { missed: 0, alerted: 0 }
}

// =============================================================================
// GET QUEUE POSITION
// =============================================================================

export async function getQueuePosition(siteId: string): Promise<number> {
  const supabase = createAdminClient() as any

  const { count } = await supabase
    .from('mod_chat_conversations')
    .select('id', { count: 'exact', head: true })
    .eq('site_id', siteId)
    .in('status', ['new', 'waiting'])
    .is('assigned_agent_id', null)

  return (count || 0) + 1
}
