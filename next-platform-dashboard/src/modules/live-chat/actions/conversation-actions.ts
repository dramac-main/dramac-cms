'use server'

/**
 * Live Chat Module — Conversation Actions
 *
 * Server actions for conversation CRUD, assignment, resolution, and stats.
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { mapRecord, mapRecords } from '../lib/map-db-record'
import type {
  ChatConversation,
  ConversationListItem,
  ConversationFilters,
  ConversationPriority,
  ChatOverviewStats,
  MessageSenderType,
} from '../types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getModuleClient() {
  const supabase = await createClient()
  return supabase as any
}

function liveChatPath(siteId: string) {
  return `/dashboard/sites/${siteId}/live-chat`
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getConversations(
  siteId: string,
  filters?: ConversationFilters,
  page = 1,
  pageSize = 20
): Promise<{ conversations: ConversationListItem[]; total: number; error: string | null }> {
  try {
    const supabase = await getModuleClient()
    const offset = (page - 1) * pageSize

    // Build base query with joins
    let query = supabase
      .from('mod_chat_conversations')
      .select(
        `*, 
         mod_chat_visitors!inner(name, email, avatar_url),
         mod_chat_agents(display_name),
         mod_chat_departments(name)`,
        { count: 'exact' }
      )
      .eq('site_id', siteId)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + pageSize - 1)

    // Apply filters
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }
    if (filters?.channel && filters.channel !== 'all') {
      query = query.eq('channel', filters.channel)
    }
    if (filters?.assignedAgentId && filters.assignedAgentId !== 'all') {
      if (filters.assignedAgentId === 'unassigned') {
        query = query.is('assigned_agent_id', null)
      } else {
        query = query.eq('assigned_agent_id', filters.assignedAgentId)
      }
    }
    if (filters?.departmentId && filters.departmentId !== 'all') {
      query = query.eq('department_id', filters.departmentId)
    }
    if (filters?.priority && filters.priority !== 'all') {
      query = query.eq('priority', filters.priority)
    }
    if (filters?.search) {
      query = query.or(
        `last_message_text.ilike.%${filters.search}%,mod_chat_visitors.name.ilike.%${filters.search}%,mod_chat_visitors.email.ilike.%${filters.search}%`
      )
    }
    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }
    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }

    const { data, count, error } = await query

    if (error) throw error

    const conversations: ConversationListItem[] = (data || []).map((row: Record<string, any>) => ({
      id: row.id,
      visitorName: row.mod_chat_visitors?.name ?? null,
      visitorEmail: row.mod_chat_visitors?.email ?? null,
      visitorAvatar: row.mod_chat_visitors?.avatar_url ?? null,
      channel: row.channel,
      status: row.status,
      priority: row.priority,
      lastMessageText: row.last_message_text,
      lastMessageAt: row.last_message_at,
      lastMessageBy: row.last_message_by,
      unreadCount: row.unread_agent_count ?? 0,
      assignedAgentName: row.mod_chat_agents?.display_name ?? null,
      departmentName: row.mod_chat_departments?.name ?? null,
      tags: row.tags ?? [],
      createdAt: row.created_at,
    }))

    return { conversations, total: count || 0, error: null }
  } catch (error) {
    console.error('[LiveChat] Error getting conversations:', error)
    return { conversations: [], total: 0, error: (error as Error).message }
  }
}

export async function getConversation(
  conversationId: string
): Promise<{ conversation: ChatConversation | null; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    const { data, error } = await supabase
      .from('mod_chat_conversations')
      .select('*')
      .eq('id', conversationId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return { conversation: null, error: null }
      throw error
    }

    const conversation = mapRecord<ChatConversation>(data)

    // Load visitor
    const { data: visitorData } = await supabase
      .from('mod_chat_visitors')
      .select('*')
      .eq('id', data.visitor_id)
      .single()

    if (visitorData) {
      conversation.visitor = mapRecord(visitorData)
    }

    // Load agent if assigned
    if (data.assigned_agent_id) {
      const { data: agentData } = await supabase
        .from('mod_chat_agents')
        .select('*')
        .eq('id', data.assigned_agent_id)
        .single()

      if (agentData) {
        conversation.assignedAgent = mapRecord(agentData)
      }
    }

    // Load department if set
    if (data.department_id) {
      const { data: deptData } = await supabase
        .from('mod_chat_departments')
        .select('*')
        .eq('id', data.department_id)
        .single()

      if (deptData) {
        conversation.department = mapRecord(deptData)
      }
    }

    return { conversation, error: null }
  } catch (error) {
    console.error('[LiveChat] Error getting conversation:', error)
    return { conversation: null, error: (error as Error).message }
  }
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function createConversation(data: {
  siteId: string
  visitorId: string
  channel?: string
  departmentId?: string
  subject?: string
}): Promise<{ conversation: ChatConversation | null; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    const insertData: Record<string, unknown> = {
      site_id: data.siteId,
      visitor_id: data.visitorId,
      channel: data.channel || 'widget',
      status: 'pending',
      priority: 'normal',
    }

    if (data.departmentId) insertData.department_id = data.departmentId
    if (data.subject) insertData.subject = data.subject

    const { data: convData, error } = await supabase
      .from('mod_chat_conversations')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error

    const conversation = mapRecord<ChatConversation>(convData)

    // Try auto-assign if department has auto_assign enabled
    if (data.departmentId) {
      const { data: dept } = await supabase
        .from('mod_chat_departments')
        .select('auto_assign')
        .eq('id', data.departmentId)
        .single()

      if (dept?.auto_assign) {
        // Find available agent in department
        const { data: agent } = await supabase
          .from('mod_chat_agents')
          .select('id')
          .eq('site_id', data.siteId)
          .eq('department_id', data.departmentId)
          .eq('status', 'online')
          .eq('is_active', true)
          .lt('current_chat_count', 'max_concurrent_chats')
          .order('current_chat_count', { ascending: true })
          .limit(1)
          .single()

        if (agent) {
          await assignConversation(conversation.id, agent.id)
        }
      }
    } else {
      // No department — try to find any available agent
      const { data: agent } = await supabase
        .from('mod_chat_agents')
        .select('id')
        .eq('site_id', data.siteId)
        .eq('status', 'online')
        .eq('is_active', true)
        .order('current_chat_count', { ascending: true })
        .limit(1)
        .single()

      if (agent) {
        await assignConversation(conversation.id, agent.id)
      }
    }

    revalidatePath(liveChatPath(data.siteId))
    return { conversation, error: null }
  } catch (error) {
    console.error('[LiveChat] Error creating conversation:', error)
    return { conversation: null, error: (error as Error).message }
  }
}

export async function assignConversation(
  conversationId: string,
  agentId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    // Get conversation to check current state
    const { data: conv } = await supabase
      .from('mod_chat_conversations')
      .select('site_id, status, assigned_agent_id, created_at')
      .eq('id', conversationId)
      .single()

    if (!conv) return { success: false, error: 'Conversation not found' }

    // Decrement old agent's count if reassigning
    if (conv.assigned_agent_id && conv.assigned_agent_id !== agentId) {
      await supabase.rpc('decrement_agent_chat_count', { agent_uuid: conv.assigned_agent_id }).catch(() => {
        // RPC may not exist, do manual update
        return supabase
          .from('mod_chat_agents')
          .update({ current_chat_count: 0 }) // will be recalculated
          .eq('id', conv.assigned_agent_id)
      })
    }

    // Update conversation
    const updates: Record<string, unknown> = {
      assigned_agent_id: agentId,
    }

    if (conv.status === 'pending') {
      updates.status = 'active'
      const waitTime = Math.floor(
        (Date.now() - new Date(conv.created_at).getTime()) / 1000
      )
      updates.wait_time_seconds = waitTime
    }

    const { error: updateError } = await supabase
      .from('mod_chat_conversations')
      .update(updates)
      .eq('id', conversationId)

    if (updateError) throw updateError

    // Increment new agent's count
    const { data: agentData } = await supabase
      .from('mod_chat_agents')
      .select('current_chat_count')
      .eq('id', agentId)
      .single()

    if (agentData) {
      await supabase
        .from('mod_chat_agents')
        .update({ current_chat_count: (agentData.current_chat_count || 0) + 1 })
        .eq('id', agentId)
    }

    revalidatePath(liveChatPath(conv.site_id))
    return { success: true, error: null }
  } catch (error) {
    console.error('[LiveChat] Error assigning conversation:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function transferConversation(
  conversationId: string,
  toAgentId: string,
  note?: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    const { data: conv } = await supabase
      .from('mod_chat_conversations')
      .select('site_id, assigned_agent_id')
      .eq('id', conversationId)
      .single()

    if (!conv) return { success: false, error: 'Conversation not found' }

    // Decrement old agent
    if (conv.assigned_agent_id) {
      const { data: oldAgent } = await supabase
        .from('mod_chat_agents')
        .select('current_chat_count')
        .eq('id', conv.assigned_agent_id)
        .single()

      if (oldAgent) {
        await supabase
          .from('mod_chat_agents')
          .update({ current_chat_count: Math.max(0, (oldAgent.current_chat_count || 0) - 1) })
          .eq('id', conv.assigned_agent_id)
      }
    }

    // Assign to new agent
    await supabase
      .from('mod_chat_conversations')
      .update({ assigned_agent_id: toAgentId })
      .eq('id', conversationId)

    // Increment new agent
    const { data: newAgent } = await supabase
      .from('mod_chat_agents')
      .select('current_chat_count, display_name')
      .eq('id', toAgentId)
      .single()

    if (newAgent) {
      await supabase
        .from('mod_chat_agents')
        .update({ current_chat_count: (newAgent.current_chat_count || 0) + 1 })
        .eq('id', toAgentId)

      // Insert system message
      await supabase.from('mod_chat_messages').insert({
        conversation_id: conversationId,
        site_id: conv.site_id,
        sender_type: 'system',
        content: `Conversation transferred to ${newAgent.display_name}`,
        content_type: 'system',
      })
    }

    // Insert transfer note if provided
    if (note) {
      await supabase.from('mod_chat_messages').insert({
        conversation_id: conversationId,
        site_id: conv.site_id,
        sender_type: 'system',
        content: note,
        content_type: 'note',
        is_internal_note: true,
      })
    }

    revalidatePath(liveChatPath(conv.site_id))
    return { success: true, error: null }
  } catch (error) {
    console.error('[LiveChat] Error transferring conversation:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function resolveConversation(
  conversationId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    const { data: conv } = await supabase
      .from('mod_chat_conversations')
      .select('site_id, assigned_agent_id, created_at')
      .eq('id', conversationId)
      .single()

    if (!conv) return { success: false, error: 'Conversation not found' }

    const now = new Date().toISOString()
    const resolutionTime = Math.floor(
      (Date.now() - new Date(conv.created_at).getTime()) / 1000
    )

    // Update conversation
    const { error: updateError } = await supabase
      .from('mod_chat_conversations')
      .update({
        status: 'resolved',
        resolved_at: now,
        resolution_time_seconds: resolutionTime,
      })
      .eq('id', conversationId)

    if (updateError) throw updateError

    // Update agent stats
    if (conv.assigned_agent_id) {
      const { data: agent } = await supabase
        .from('mod_chat_agents')
        .select('current_chat_count, total_chats_handled')
        .eq('id', conv.assigned_agent_id)
        .single()

      if (agent) {
        await supabase
          .from('mod_chat_agents')
          .update({
            current_chat_count: Math.max(0, (agent.current_chat_count || 0) - 1),
            total_chats_handled: (agent.total_chats_handled || 0) + 1,
          })
          .eq('id', conv.assigned_agent_id)
      }
    }

    // System message
    await supabase.from('mod_chat_messages').insert({
      conversation_id: conversationId,
      site_id: conv.site_id,
      sender_type: 'system',
      content: 'Conversation resolved',
      content_type: 'system',
    })

    revalidatePath(liveChatPath(conv.site_id))
    return { success: true, error: null }
  } catch (error) {
    console.error('[LiveChat] Error resolving conversation:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function closeConversation(
  conversationId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    const { data: conv } = await supabase
      .from('mod_chat_conversations')
      .select('site_id, assigned_agent_id, resolved_at')
      .eq('id', conversationId)
      .single()

    if (!conv) return { success: false, error: 'Conversation not found' }

    const now = new Date().toISOString()
    const updates: Record<string, unknown> = {
      status: 'closed',
      closed_at: now,
    }

    if (!conv.resolved_at) {
      updates.resolved_at = now
    }

    const { error: updateError } = await supabase
      .from('mod_chat_conversations')
      .update(updates)
      .eq('id', conversationId)

    if (updateError) throw updateError

    // Decrement agent count
    if (conv.assigned_agent_id) {
      const { data: agent } = await supabase
        .from('mod_chat_agents')
        .select('current_chat_count')
        .eq('id', conv.assigned_agent_id)
        .single()

      if (agent) {
        await supabase
          .from('mod_chat_agents')
          .update({ current_chat_count: Math.max(0, (agent.current_chat_count || 0) - 1) })
          .eq('id', conv.assigned_agent_id)
      }
    }

    revalidatePath(liveChatPath(conv.site_id))
    return { success: true, error: null }
  } catch (error) {
    console.error('[LiveChat] Error closing conversation:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function reopenConversation(
  conversationId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    const { data: conv } = await supabase
      .from('mod_chat_conversations')
      .select('site_id')
      .eq('id', conversationId)
      .single()

    if (!conv) return { success: false, error: 'Conversation not found' }

    const { error: updateError } = await supabase
      .from('mod_chat_conversations')
      .update({
        status: 'active',
        resolved_at: null,
        closed_at: null,
      })
      .eq('id', conversationId)

    if (updateError) throw updateError

    revalidatePath(liveChatPath(conv.site_id))
    return { success: true, error: null }
  } catch (error) {
    console.error('[LiveChat] Error reopening conversation:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function updateConversationPriority(
  conversationId: string,
  priority: ConversationPriority
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    const { data: conv } = await supabase
      .from('mod_chat_conversations')
      .select('site_id')
      .eq('id', conversationId)
      .single()

    if (!conv) return { success: false, error: 'Conversation not found' }

    const { error: updateError } = await supabase
      .from('mod_chat_conversations')
      .update({ priority })
      .eq('id', conversationId)

    if (updateError) throw updateError

    revalidatePath(liveChatPath(conv.site_id))
    return { success: true, error: null }
  } catch (error) {
    console.error('[LiveChat] Error updating priority:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function updateConversationTags(
  conversationId: string,
  tags: string[]
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    const { error: updateError } = await supabase
      .from('mod_chat_conversations')
      .update({ tags })
      .eq('id', conversationId)

    if (updateError) throw updateError

    return { success: true, error: null }
  } catch (error) {
    console.error('[LiveChat] Error updating tags:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function updateInternalNotes(
  conversationId: string,
  notes: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    const { error: updateError } = await supabase
      .from('mod_chat_conversations')
      .update({ internal_notes: notes })
      .eq('id', conversationId)

    if (updateError) throw updateError

    return { success: true, error: null }
  } catch (error) {
    console.error('[LiveChat] Error updating internal notes:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function markConversationRead(
  conversationId: string,
  role: 'agent' | 'visitor'
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    const updateField = role === 'agent' ? 'unread_agent_count' : 'unread_visitor_count'

    const { error: updateError } = await supabase
      .from('mod_chat_conversations')
      .update({ [updateField]: 0 })
      .eq('id', conversationId)

    if (updateError) throw updateError

    // Mark messages as read
    const senderTypes: MessageSenderType[] = role === 'agent' ? ['visitor'] : ['agent', 'ai']

    await supabase
      .from('mod_chat_messages')
      .update({ status: 'read' })
      .eq('conversation_id', conversationId)
      .in('sender_type', senderTypes)
      .neq('status', 'read')

    return { success: true, error: null }
  } catch (error) {
    console.error('[LiveChat] Error marking conversation read:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function getConversationStats(
  siteId: string
): Promise<{ stats: ChatOverviewStats; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayStr = todayStart.toISOString()

    // Active conversations
    const { count: activeCount } = await supabase
      .from('mod_chat_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .eq('status', 'active')

    // Pending conversations
    const { count: pendingCount } = await supabase
      .from('mod_chat_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .eq('status', 'pending')

    // Online agents
    const { count: onlineCount } = await supabase
      .from('mod_chat_agents')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .eq('is_active', true)
      .in('status', ['online', 'away', 'busy'])

    // Today's conversations
    const { count: todayCount } = await supabase
      .from('mod_chat_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .gte('created_at', todayStr)

    // Today's resolved
    const { count: resolvedCount } = await supabase
      .from('mod_chat_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .eq('status', 'resolved')
      .gte('resolved_at', todayStr)

    // Today's missed
    const { count: missedCount } = await supabase
      .from('mod_chat_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .eq('status', 'missed')
      .gte('created_at', todayStr)

    // Average response time (from today's resolved)
    const { data: responseData } = await supabase
      .from('mod_chat_conversations')
      .select('first_response_time_seconds')
      .eq('site_id', siteId)
      .gte('created_at', todayStr)
      .not('first_response_time_seconds', 'is', null)

    let avgResponseTime = 0
    if (responseData && responseData.length > 0) {
      const total = responseData.reduce((sum: number, r: Record<string, unknown>) => sum + ((r.first_response_time_seconds as number) || 0), 0)
      avgResponseTime = Math.round(total / responseData.length)
    }

    // Satisfaction score
    const { data: ratingData } = await supabase
      .from('mod_chat_conversations')
      .select('rating')
      .eq('site_id', siteId)
      .gte('rated_at', todayStr)
      .not('rating', 'is', null)

    let satisfactionScore = 0
    if (ratingData && ratingData.length > 0) {
      const total = ratingData.reduce((sum: number, r: Record<string, unknown>) => sum + ((r.rating as number) || 0), 0)
      satisfactionScore = Math.round((total / ratingData.length) * 20) // Convert 1-5 to 0-100
    }

    return {
      stats: {
        activeConversations: activeCount || 0,
        pendingConversations: pendingCount || 0,
        onlineAgents: onlineCount || 0,
        avgResponseTime,
        todayConversations: todayCount || 0,
        todayResolved: resolvedCount || 0,
        todayMissed: missedCount || 0,
        satisfactionScore,
      },
      error: null,
    }
  } catch (error) {
    console.error('[LiveChat] Error getting conversation stats:', error)
    return {
      stats: {
        activeConversations: 0,
        pendingConversations: 0,
        onlineAgents: 0,
        avgResponseTime: 0,
        todayConversations: 0,
        todayResolved: 0,
        todayMissed: 0,
        satisfactionScore: 0,
      },
      error: (error as Error).message,
    }
  }
}
