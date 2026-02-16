'use server'

/**
 * Live Chat Module — Agent Actions
 *
 * Server actions for agent CRUD, status management, and performance metrics.
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { mapRecord, mapRecords } from '../lib/map-db-record'
import type { ChatAgent, AgentStatus, AgentPerformanceData } from '../types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getModuleClient() {
  const supabase = await createClient()
  return supabase as any
}

function liveChatPath(siteId: string) {
  return `/dashboard/sites/${siteId}/live-chat`
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export interface AgencyMember {
  userId: string
  name: string | null
  email: string
  avatarUrl: string | null
  role: string
}

export async function getAgencyMembersForSite(
  siteId: string
): Promise<{ members: AgencyMember[]; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    // Get the agency_id for this site
    const { data: siteData, error: siteError } = await supabase
      .from('sites')
      .select('agency_id')
      .eq('id', siteId)
      .single()

    if (siteError || !siteData?.agency_id) {
      return { members: [], error: 'Could not find agency for this site' }
    }

    // Get the agency owner
    const { data: agency } = await supabase
      .from('agencies')
      .select('owner_id')
      .eq('id', siteData.agency_id)
      .single()

    // Get agency members
    const { data: members } = await supabase
      .from('agency_members')
      .select('user_id, role')
      .eq('agency_id', siteData.agency_id)

    // Build a combined list of user IDs (owner + members)
    const memberMap = new Map<string, string>()

    // Owner is always included with 'owner' role
    if (agency?.owner_id) {
      memberMap.set(agency.owner_id, 'owner')
    }

    // Add team members (skip if same as owner — owner takes precedence)
    for (const m of (members || [])) {
      if (!memberMap.has(m.user_id)) {
        memberMap.set(m.user_id, m.role)
      }
    }

    if (memberMap.size === 0) {
      return { members: [], error: null }
    }

    // Get profiles for all users
    const userIds = Array.from(memberMap.keys())
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, email, avatar_url')
      .in('id', userIds)

    // Join members with profiles
    const result: AgencyMember[] = userIds.map((userId) => {
      const profile = (profiles || []).find((p: { id: string }) => p.id === userId)
      return {
        userId,
        name: profile?.name || null,
        email: profile?.email || userId,
        avatarUrl: profile?.avatar_url || null,
        role: memberMap.get(userId) || 'member',
      }
    })

    return { members: result, error: null }
  } catch (error) {
    console.error('[LiveChat] Error fetching agency members:', error)
    return { members: [], error: (error as Error).message }
  }
}

export async function getAgents(
  siteId: string
): Promise<{ agents: ChatAgent[]; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    const { data, error } = await supabase
      .from('mod_chat_agents')
      .select('*')
      .eq('site_id', siteId)
      .order('display_name', { ascending: true })

    if (error) throw error

    return { agents: mapRecords<ChatAgent>(data || []), error: null }
  } catch (error) {
    console.error('[LiveChat] Error getting agents:', error)
    return { agents: [], error: (error as Error).message }
  }
}

export async function getAgent(
  agentId: string
): Promise<{ agent: ChatAgent | null; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    const { data, error } = await supabase
      .from('mod_chat_agents')
      .select('*')
      .eq('id', agentId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return { agent: null, error: null }
      throw error
    }

    return { agent: mapRecord<ChatAgent>(data), error: null }
  } catch (error) {
    console.error('[LiveChat] Error getting agent:', error)
    return { agent: null, error: (error as Error).message }
  }
}

export async function getOnlineAgents(
  siteId: string
): Promise<{ agents: ChatAgent[]; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    const { data, error } = await supabase
      .from('mod_chat_agents')
      .select('*')
      .eq('site_id', siteId)
      .eq('is_active', true)
      .in('status', ['online', 'away', 'busy'])
      .order('current_chat_count', { ascending: true })

    if (error) throw error

    return { agents: mapRecords<ChatAgent>(data || []), error: null }
  } catch (error) {
    console.error('[LiveChat] Error getting online agents:', error)
    return { agents: [], error: (error as Error).message }
  }
}

export async function getAvailableAgent(
  siteId: string,
  departmentId?: string
): Promise<{ agent: ChatAgent | null; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    let query = supabase
      .from('mod_chat_agents')
      .select('*')
      .eq('site_id', siteId)
      .eq('status', 'online')
      .eq('is_active', true)
      .order('current_chat_count', { ascending: true })
      .limit(1)

    if (departmentId) {
      query = query.eq('department_id', departmentId)
    }

    const { data, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') return { agent: null, error: null }
      throw error
    }

    // Check concurrent chat limit
    const agent = mapRecord<ChatAgent>(data)
    if (agent.currentChatCount >= agent.maxConcurrentChats) {
      return { agent: null, error: null }
    }

    return { agent, error: null }
  } catch (error) {
    console.error('[LiveChat] Error finding available agent:', error)
    return { agent: null, error: (error as Error).message }
  }
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function createAgent(data: {
  siteId: string
  userId: string
  displayName: string
  email?: string
  avatarUrl?: string
  role?: string
  departmentId?: string
  maxConcurrentChats?: number
}): Promise<{ agent: ChatAgent | null; error: string | null }> {
  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(data.userId)) {
      return { agent: null, error: 'Invalid User ID format. Please select a valid team member.' }
    }

    const supabase = await getModuleClient()

    const insertData: Record<string, unknown> = {
      site_id: data.siteId,
      user_id: data.userId,
      display_name: data.displayName,
      role: data.role || 'agent',
      status: 'offline',
      max_concurrent_chats: data.maxConcurrentChats || 5,
    }

    if (data.email) insertData.email = data.email
    if (data.avatarUrl) insertData.avatar_url = data.avatarUrl
    if (data.departmentId) insertData.department_id = data.departmentId

    const { data: agentData, error } = await supabase
      .from('mod_chat_agents')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return { agent: null, error: 'This user is already registered as a chat agent for this site.' }
      }
      throw error
    }

    revalidatePath(liveChatPath(data.siteId))
    return { agent: mapRecord<ChatAgent>(agentData), error: null }
  } catch (error) {
    console.error('[LiveChat] Error creating agent:', error)
    return { agent: null, error: (error as Error).message }
  }
}

export async function updateAgent(
  agentId: string,
  data: {
    displayName?: string
    email?: string
    avatarUrl?: string
    role?: string
    departmentId?: string | null
    maxConcurrentChats?: number
    isActive?: boolean
  }
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    const updates: Record<string, unknown> = {}

    if (data.displayName !== undefined) updates.display_name = data.displayName
    if (data.email !== undefined) updates.email = data.email
    if (data.avatarUrl !== undefined) updates.avatar_url = data.avatarUrl
    if (data.role !== undefined) updates.role = data.role
    if (data.departmentId !== undefined) updates.department_id = data.departmentId
    if (data.maxConcurrentChats !== undefined) updates.max_concurrent_chats = data.maxConcurrentChats
    if (data.isActive !== undefined) updates.is_active = data.isActive

    const { data: agentData } = await supabase
      .from('mod_chat_agents')
      .select('site_id')
      .eq('id', agentId)
      .single()

    const { error } = await supabase
      .from('mod_chat_agents')
      .update(updates)
      .eq('id', agentId)

    if (error) throw error

    if (agentData) revalidatePath(liveChatPath(agentData.site_id))
    return { success: true, error: null }
  } catch (error) {
    console.error('[LiveChat] Error updating agent:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function updateAgentStatus(
  agentId: string,
  status: AgentStatus
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    const { error } = await supabase
      .from('mod_chat_agents')
      .update({
        status,
        last_active_at: new Date().toISOString(),
      })
      .eq('id', agentId)

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error('[LiveChat] Error updating agent status:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function deleteAgent(
  agentId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    const { data: agent } = await supabase
      .from('mod_chat_agents')
      .select('site_id')
      .eq('id', agentId)
      .single()

    if (!agent) return { success: false, error: 'Agent not found' }

    // Soft delete
    const { error } = await supabase
      .from('mod_chat_agents')
      .update({ is_active: false, status: 'offline' })
      .eq('id', agentId)

    if (error) throw error

    // Unassign active conversations
    await supabase
      .from('mod_chat_conversations')
      .update({ assigned_agent_id: null })
      .eq('assigned_agent_id', agentId)
      .in('status', ['active', 'pending', 'waiting'])

    revalidatePath(liveChatPath(agent.site_id))
    return { success: true, error: null }
  } catch (error) {
    console.error('[LiveChat] Error deleting agent:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function getAgentPerformance(
  siteId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<{ performance: AgentPerformanceData[]; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    // Get all agents
    const { data: agents, error: agentError } = await supabase
      .from('mod_chat_agents')
      .select('*')
      .eq('site_id', siteId)
      .eq('is_active', true)
      .order('display_name', { ascending: true })

    if (agentError) throw agentError

    const performance: AgentPerformanceData[] = []

    for (const agent of (agents || [])) {
      let conversationQuery = supabase
        .from('mod_chat_conversations')
        .select('status, first_response_time_seconds, rating')
        .eq('assigned_agent_id', agent.id)

      if (dateFrom) conversationQuery = conversationQuery.gte('created_at', dateFrom)
      if (dateTo) conversationQuery = conversationQuery.lte('created_at', dateTo)

      const { data: conversations } = await conversationQuery

      const totalChats = (conversations || []).length
      const resolvedChats = (conversations || []).filter((c: Record<string, unknown>) => c.status === 'resolved').length
      const responseTimes = (conversations || [])
        .filter((c: Record<string, unknown>) => c.first_response_time_seconds != null)
        .map((c: Record<string, unknown>) => c.first_response_time_seconds as number)
      const ratings = (conversations || [])
        .filter((c: Record<string, unknown>) => c.rating != null)
        .map((c: Record<string, unknown>) => c.rating as number)

      performance.push({
        agentId: agent.id,
        agentName: agent.display_name,
        avatarUrl: agent.avatar_url,
        totalChats,
        resolvedChats,
        avgResponseTime: responseTimes.length > 0
          ? Math.round(responseTimes.reduce((s: number, t: number) => s + t, 0) / responseTimes.length)
          : 0,
        avgRating: ratings.length > 0
          ? Number((ratings.reduce((s: number, r: number) => s + r, 0) / ratings.length).toFixed(2))
          : 0,
        totalRatings: ratings.length,
        currentLoad: agent.current_chat_count || 0,
        maxLoad: agent.max_concurrent_chats || 5,
      })
    }

    return { performance, error: null }
  } catch (error) {
    console.error('[LiveChat] Error getting agent performance:', error)
    return { performance: [], error: (error as Error).message }
  }
}
