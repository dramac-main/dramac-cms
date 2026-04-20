"use server";

/**
 * Live Chat Module — Conversation Actions
 *
 * Server actions for conversation CRUD, assignment, resolution, and stats.
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { mapRecord, mapRecords } from "../lib/map-db-record";
import { logAutomationEvent } from "@/modules/automation/services/event-processor";
import type {
  ChatConversation,
  ConversationListItem,
  ConversationFilters,
  ConversationPriority,
  ChatOverviewStats,
  MessageSenderType,
} from "../types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getModuleClient() {
  const supabase = await createClient();
  return supabase as any;
}

function liveChatPath(siteId: string) {
  return `/dashboard/sites/${siteId}/live-chat`;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getConversations(
  siteId: string,
  filters?: ConversationFilters,
  page = 1,
  pageSize = 20,
): Promise<{
  conversations: ConversationListItem[];
  total: number;
  error: string | null;
}> {
  try {
    const supabase = await getModuleClient();
    const offset = (page - 1) * pageSize;

    // Build base query with joins
    let query = supabase
      .from("mod_chat_conversations")
      .select(
        `*, 
         mod_chat_visitors!inner(name, email, avatar_url),
         mod_chat_agents(display_name),
         mod_chat_departments(name)`,
        { count: "exact" },
      )
      .eq("site_id", siteId)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .range(offset, offset + pageSize - 1);

    // Apply filters
    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }
    if (filters?.channel && filters.channel !== "all") {
      query = query.eq("channel", filters.channel);
    }
    if (filters?.assignedAgentId && filters.assignedAgentId !== "all") {
      if (filters.assignedAgentId === "unassigned") {
        query = query.is("assigned_agent_id", null);
      } else {
        query = query.eq("assigned_agent_id", filters.assignedAgentId);
      }
    }
    if (filters?.departmentId && filters.departmentId !== "all") {
      query = query.eq("department_id", filters.departmentId);
    }
    if (filters?.priority && filters.priority !== "all") {
      query = query.eq("priority", filters.priority);
    }
    if (filters?.search) {
      query = query.or(
        `last_message_text.ilike.%${filters.search}%,mod_chat_visitors.name.ilike.%${filters.search}%,mod_chat_visitors.email.ilike.%${filters.search}%`,
      );
    }
    if (filters?.dateFrom) {
      query = query.gte("created_at", filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte("created_at", filters.dateTo);
    }
    if (filters?.tag && filters.tag !== "all") {
      query = query.contains("tags", [filters.tag]);
    }

    const { data, count, error } = await query;

    if (error) throw error;

    const conversations: ConversationListItem[] = (data || []).map(
      (row: Record<string, any>) => ({
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
        rating: row.rating ?? null,
        ratingComment: row.rating_comment ?? null,
        createdAt: row.created_at,
      }),
    );

    return { conversations, total: count || 0, error: null };
  } catch (error) {
    console.error("[LiveChat] Error getting conversations:", error);
    return { conversations: [], total: 0, error: (error as Error).message };
  }
}

export async function getConversation(
  conversationId: string,
): Promise<{ conversation: ChatConversation | null; error: string | null }> {
  try {
    const supabase = await getModuleClient();

    const { data, error } = await supabase
      .from("mod_chat_conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return { conversation: null, error: null };
      throw error;
    }

    const conversation = mapRecord<ChatConversation>(data);

    // Load visitor
    const { data: visitorData } = await supabase
      .from("mod_chat_visitors")
      .select("*")
      .eq("id", data.visitor_id)
      .single();

    if (visitorData) {
      conversation.visitor = mapRecord(visitorData);
    }

    // Load agent if assigned
    if (data.assigned_agent_id) {
      const { data: agentData } = await supabase
        .from("mod_chat_agents")
        .select("*")
        .eq("id", data.assigned_agent_id)
        .single();

      if (agentData) {
        conversation.assignedAgent = mapRecord(agentData);
      }
    }

    // Load department if set
    if (data.department_id) {
      const { data: deptData } = await supabase
        .from("mod_chat_departments")
        .select("*")
        .eq("id", data.department_id)
        .single();

      if (deptData) {
        conversation.department = mapRecord(deptData);
      }
    }

    return { conversation, error: null };
  } catch (error) {
    console.error("[LiveChat] Error getting conversation:", error);
    return { conversation: null, error: (error as Error).message };
  }
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function createConversation(data: {
  siteId: string;
  visitorId: string;
  channel?: string;
  departmentId?: string;
  subject?: string;
}): Promise<{ conversation: ChatConversation | null; error: string | null }> {
  try {
    const supabase = await getModuleClient();

    const insertData: Record<string, unknown> = {
      site_id: data.siteId,
      visitor_id: data.visitorId,
      channel: data.channel || "widget",
      status: "pending",
      priority: "normal",
    };

    if (data.departmentId) insertData.department_id = data.departmentId;
    if (data.subject) insertData.subject = data.subject;

    const { data: convData, error } = await supabase
      .from("mod_chat_conversations")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    const conversation = mapRecord<ChatConversation>(convData);

    // Try auto-assign if department has auto_assign enabled
    if (data.departmentId) {
      const { data: dept } = await supabase
        .from("mod_chat_departments")
        .select("auto_assign")
        .eq("id", data.departmentId)
        .single();

      if (dept?.auto_assign) {
        // Find available agent in department
        // Note: Supabase .lt() compares against literal values, not column refs.
        // Fetch agents and filter capacity in code.
        const { data: agents } = await supabase
          .from("mod_chat_agents")
          .select("id, current_chat_count, max_concurrent_chats")
          .eq("site_id", data.siteId)
          .eq("department_id", data.departmentId)
          .eq("status", "online")
          .eq("is_active", true)
          .order("current_chat_count", { ascending: true });

        const agent = (agents || []).find(
          (a: { current_chat_count: number; max_concurrent_chats: number }) =>
            (a.current_chat_count || 0) < (a.max_concurrent_chats || 5),
        );

        if (agent) {
          await assignConversation(conversation.id, agent.id);
        }
      }
    } else {
      // No department — try to find any available agent
      const { data: agent } = await supabase
        .from("mod_chat_agents")
        .select("id")
        .eq("site_id", data.siteId)
        .eq("status", "online")
        .eq("is_active", true)
        .order("current_chat_count", { ascending: true })
        .limit(1)
        .single();

      if (agent) {
        await assignConversation(conversation.id, agent.id);
      }
    }

    // Emit automation event for new conversation
    logAutomationEvent(
      data.siteId,
      "live_chat.conversation.started",
      {
        conversation_id: conversation.id,
        visitor_id: data.visitorId,
        channel: data.channel || "widget",
        subject: data.subject,
        department_id: data.departmentId,
      },
      {
        sourceModule: "live-chat",
        sourceEntityType: "conversation",
        sourceEntityId: conversation.id,
      },
    ).catch((err) => console.error("[LiveChat] Automation event error:", err));

    revalidatePath(liveChatPath(data.siteId));
    return { conversation, error: null };
  } catch (error) {
    console.error("[LiveChat] Error creating conversation:", error);
    return { conversation: null, error: (error as Error).message };
  }
}

export async function assignConversation(
  conversationId: string,
  agentId: string,
  actorName?: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient();

    // Get conversation to check current state
    const { data: conv } = await supabase
      .from("mod_chat_conversations")
      .select("site_id, status, assigned_agent_id, created_at")
      .eq("id", conversationId)
      .single();

    if (!conv) return { success: false, error: "Conversation not found" };

    // Decrement old agent's count if reassigning
    if (conv.assigned_agent_id && conv.assigned_agent_id !== agentId) {
      await supabase
        .rpc("decrement_agent_chat_count", {
          agent_uuid: conv.assigned_agent_id,
        })
        .catch(() => {
          // RPC may not exist, do manual update
          return supabase
            .from("mod_chat_agents")
            .update({ current_chat_count: 0 }) // will be recalculated
            .eq("id", conv.assigned_agent_id);
        });
    }

    // Update conversation
    const updates: Record<string, unknown> = {
      assigned_agent_id: agentId,
    };

    if (conv.status === "pending") {
      updates.status = "active";
      const waitTime = Math.floor(
        (Date.now() - new Date(conv.created_at).getTime()) / 1000,
      );
      updates.wait_time_seconds = waitTime;
    }

    const { error: updateError } = await supabase
      .from("mod_chat_conversations")
      .update(updates)
      .eq("id", conversationId);

    if (updateError) throw updateError;

    // Increment new agent's count
    const { data: agentData } = await supabase
      .from("mod_chat_agents")
      .select("current_chat_count")
      .eq("id", agentId)
      .single();

    if (agentData) {
      await supabase
        .from("mod_chat_agents")
        .update({ current_chat_count: (agentData.current_chat_count || 0) + 1 })
        .eq("id", agentId);
    }

    // Send notification to the assigned agent
    try {
      const { notifyChatAssigned } = await import("../lib/chat-notifications");
      // Look up the agent's user_id for the notification
      const { data: agent } = await supabase
        .from("mod_chat_agents")
        .select("user_id, display_name")
        .eq("id", agentId)
        .single();
      if (agent?.user_id) {
        await notifyChatAssigned({
          siteId: conv.site_id,
          conversationId,
          agentUserId: agent.user_id,
          agentName: agent.display_name,
        });
      }

      // Insert agent-attributed activity message
      const actor = actorName || "An agent";
      const systemContent =
        actorName
          ? `${actor} assigned this conversation to ${agent.display_name}`
          : `Conversation assigned to ${agent.display_name}`;
      await supabase.from("mod_chat_messages").insert({
        conversation_id: conversationId,
        site_id: conv.site_id,
        sender_type: "system",
        sender_name: actorName || null,
        content: systemContent,
        content_type: "system",
      });
    } catch {
      // Non-fatal — don't fail the assignment if notification fails
    }

    // Emit automation event for chat assignment
    logAutomationEvent(
      conv.site_id,
      "live_chat.conversation.assigned",
      {
        conversation_id: conversationId,
        agent_id: agentId,
        assigned_agent_id: agentId,
      },
      {
        sourceModule: "live-chat",
        sourceEntityType: "conversation",
        sourceEntityId: conversationId,
      },
    ).catch((err) => console.error("[LiveChat] Automation event error:", err));

    revalidatePath(liveChatPath(conv.site_id));
    return { success: true, error: null };
  } catch (error) {
    console.error("[LiveChat] Error assigning conversation:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function transferConversation(
  conversationId: string,
  toAgentId: string,
  note?: string,
  fromAgentName?: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient();

    const { data: conv } = await supabase
      .from("mod_chat_conversations")
      .select("site_id, assigned_agent_id")
      .eq("id", conversationId)
      .single();

    if (!conv) return { success: false, error: "Conversation not found" };

    // Decrement old agent
    if (conv.assigned_agent_id) {
      const { data: oldAgent } = await supabase
        .from("mod_chat_agents")
        .select("current_chat_count")
        .eq("id", conv.assigned_agent_id)
        .single();

      if (oldAgent) {
        await supabase
          .from("mod_chat_agents")
          .update({
            current_chat_count: Math.max(
              0,
              (oldAgent.current_chat_count || 0) - 1,
            ),
          })
          .eq("id", conv.assigned_agent_id);
      }
    }

    // Assign to new agent + reset AI pause (new agent starts fresh)
    const { data: convMeta } = await supabase
      .from("mod_chat_conversations")
      .select("metadata")
      .eq("id", conversationId)
      .single();

    const cleanedMeta = {
      ...((convMeta?.metadata || {}) as Record<string, unknown>),
    };
    delete cleanedMeta.ai_paused;
    delete cleanedMeta.ai_paused_by;
    delete cleanedMeta.ai_paused_at;

    await supabase
      .from("mod_chat_conversations")
      .update({ assigned_agent_id: toAgentId, metadata: cleanedMeta })
      .eq("id", conversationId);

    // Increment new agent
    const { data: newAgent } = await supabase
      .from("mod_chat_agents")
      .select("current_chat_count, display_name")
      .eq("id", toAgentId)
      .single();

    if (newAgent) {
      await supabase
        .from("mod_chat_agents")
        .update({ current_chat_count: (newAgent.current_chat_count || 0) + 1 })
        .eq("id", toAgentId);

      // Insert agent-attributed system message
      const transferContent = fromAgentName
        ? `${fromAgentName} transferred this conversation to ${newAgent.display_name}`
        : `Conversation transferred to ${newAgent.display_name}`;
      await supabase.from("mod_chat_messages").insert({
        conversation_id: conversationId,
        site_id: conv.site_id,
        sender_type: "system",
        sender_name: fromAgentName || null,
        content: transferContent,
        content_type: "system",
      });
    }

    // Insert transfer note if provided
    if (note) {
      await supabase.from("mod_chat_messages").insert({
        conversation_id: conversationId,
        site_id: conv.site_id,
        sender_type: "system",
        content: note,
        content_type: "note",
        is_internal_note: true,
      });
    }

    revalidatePath(liveChatPath(conv.site_id));
    return { success: true, error: null };
  } catch (error) {
    console.error("[LiveChat] Error transferring conversation:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function resolveConversation(
  conversationId: string,
  agentName?: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient();

    const { data: conv } = await supabase
      .from("mod_chat_conversations")
      .select("site_id, assigned_agent_id, created_at, metadata")
      .eq("id", conversationId)
      .single();

    if (!conv) return { success: false, error: "Conversation not found" };

    const now = new Date().toISOString();
    const resolutionTime = Math.floor(
      (Date.now() - new Date(conv.created_at).getTime()) / 1000,
    );

    // Clear AI pause state — conversation is done
    const cleanedMeta = {
      ...((conv.metadata || {}) as Record<string, unknown>),
    };
    delete cleanedMeta.ai_paused;
    delete cleanedMeta.ai_paused_by;
    delete cleanedMeta.ai_paused_at;

    // Update conversation
    const { error: updateError } = await supabase
      .from("mod_chat_conversations")
      .update({
        status: "resolved",
        resolved_at: now,
        resolution_time_seconds: resolutionTime,
        metadata: cleanedMeta,
      })
      .eq("id", conversationId);

    if (updateError) throw updateError;

    // Update agent stats
    if (conv.assigned_agent_id) {
      const { data: agent } = await supabase
        .from("mod_chat_agents")
        .select("current_chat_count, total_chats_handled")
        .eq("id", conv.assigned_agent_id)
        .single();

      if (agent) {
        await supabase
          .from("mod_chat_agents")
          .update({
            current_chat_count: Math.max(
              0,
              (agent.current_chat_count || 0) - 1,
            ),
            total_chats_handled: (agent.total_chats_handled || 0) + 1,
          })
          .eq("id", conv.assigned_agent_id);
      }
    }

    // Agent-attributed activity message
    await supabase.from("mod_chat_messages").insert({
      conversation_id: conversationId,
      site_id: conv.site_id,
      sender_type: "system",
      sender_name: agentName || null,
      content: agentName
        ? `${agentName} resolved this conversation`
        : "Conversation resolved",
      content_type: "system",
    });

    // Emit automation event for resolved conversation
    logAutomationEvent(
      conv.site_id,
      "live_chat.conversation.resolved",
      {
        conversation_id: conversationId,
        resolution_time_seconds: resolutionTime,
        assigned_agent_id: conv.assigned_agent_id,
      },
      {
        sourceModule: "live-chat",
        sourceEntityType: "conversation",
        sourceEntityId: conversationId,
      },
    ).catch((err) => console.error("[LiveChat] Automation event error:", err));

    revalidatePath(liveChatPath(conv.site_id));
    return { success: true, error: null };
  } catch (error) {
    console.error("[LiveChat] Error resolving conversation:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function closeConversation(
  conversationId: string,
  agentName?: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient();

    const { data: conv } = await supabase
      .from("mod_chat_conversations")
      .select("site_id, assigned_agent_id, resolved_at, metadata")
      .eq("id", conversationId)
      .single();

    if (!conv) return { success: false, error: "Conversation not found" };

    const now = new Date().toISOString();

    // Clear AI pause state — conversation is done
    const cleanedMeta = {
      ...((conv.metadata || {}) as Record<string, unknown>),
    };
    delete cleanedMeta.ai_paused;
    delete cleanedMeta.ai_paused_by;
    delete cleanedMeta.ai_paused_at;

    const updates: Record<string, unknown> = {
      status: "closed",
      closed_at: now,
      metadata: cleanedMeta,
    };

    if (!conv.resolved_at) {
      updates.resolved_at = now;
    }

    const { error: updateError } = await supabase
      .from("mod_chat_conversations")
      .update(updates)
      .eq("id", conversationId);

    if (updateError) throw updateError;

    // Decrement agent count
    if (conv.assigned_agent_id) {
      const { data: agent } = await supabase
        .from("mod_chat_agents")
        .select("current_chat_count")
        .eq("id", conv.assigned_agent_id)
        .single();

      if (agent) {
        await supabase
          .from("mod_chat_agents")
          .update({
            current_chat_count: Math.max(
              0,
              (agent.current_chat_count || 0) - 1,
            ),
          })
          .eq("id", conv.assigned_agent_id);
      }
    }

    // Agent-attributed activity message
    await supabase.from("mod_chat_messages").insert({
      conversation_id: conversationId,
      site_id: conv.site_id,
      sender_type: "system",
      sender_name: agentName || null,
      content: agentName
        ? `${agentName} closed this conversation`
        : "Conversation closed",
      content_type: "system",
    });

    // Emit automation event for closed conversation
    logAutomationEvent(
      conv.site_id,
      "live_chat.conversation.closed",
      {
        conversation_id: conversationId,
        assigned_agent_id: conv.assigned_agent_id,
      },
      {
        sourceModule: "live-chat",
        sourceEntityType: "conversation",
        sourceEntityId: conversationId,
      },
    ).catch((err) => console.error("[LiveChat] Automation event error:", err));

    revalidatePath(liveChatPath(conv.site_id));
    return { success: true, error: null };
  } catch (error) {
    console.error("[LiveChat] Error closing conversation:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function reopenConversation(
  conversationId: string,
  agentName?: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient();

    const { data: conv } = await supabase
      .from("mod_chat_conversations")
      .select("site_id, metadata")
      .eq("id", conversationId)
      .single();

    if (!conv) return { success: false, error: "Conversation not found" };

    // Clear AI pause state — reopened conversations should let AI handle new messages
    const cleanedMeta = {
      ...((conv.metadata || {}) as Record<string, unknown>),
    };
    delete cleanedMeta.ai_paused;
    delete cleanedMeta.ai_paused_by;
    delete cleanedMeta.ai_paused_at;

    const { error: updateError } = await supabase
      .from("mod_chat_conversations")
      .update({
        status: "active",
        resolved_at: null,
        closed_at: null,
        metadata: cleanedMeta,
      })
      .eq("id", conversationId);

    if (updateError) throw updateError;

    // Agent-attributed activity message
    await supabase.from("mod_chat_messages").insert({
      conversation_id: conversationId,
      site_id: conv.site_id,
      sender_type: "system",
      sender_name: agentName || null,
      content: agentName
        ? `${agentName} reopened this conversation`
        : "Conversation reopened",
      content_type: "system",
    });

    revalidatePath(liveChatPath(conv.site_id));
    return { success: true, error: null };
  } catch (error) {
    console.error("[LiveChat] Error reopening conversation:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function updateConversationPriority(
  conversationId: string,
  priority: ConversationPriority,
  agentName?: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient();

    const { data: conv } = await supabase
      .from("mod_chat_conversations")
      .select("site_id")
      .eq("id", conversationId)
      .single();

    if (!conv) return { success: false, error: "Conversation not found" };

    const { error: updateError } = await supabase
      .from("mod_chat_conversations")
      .update({ priority })
      .eq("id", conversationId);

    if (updateError) throw updateError;

    // Agent-attributed activity message
    if (agentName) {
      const priorityLabel =
        priority.charAt(0).toUpperCase() + priority.slice(1);
      await supabase.from("mod_chat_messages").insert({
        conversation_id: conversationId,
        site_id: conv.site_id,
        sender_type: "system",
        sender_name: agentName,
        content: `${agentName} set priority to ${priorityLabel}`,
        content_type: "system",
      });
    }

    revalidatePath(liveChatPath(conv.site_id));
    return { success: true, error: null };
  } catch (error) {
    console.error("[LiveChat] Error updating priority:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function updateConversationTags(
  conversationId: string,
  tags: string[],
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient();

    const { error: updateError } = await supabase
      .from("mod_chat_conversations")
      .update({ tags })
      .eq("id", conversationId);

    if (updateError) throw updateError;

    return { success: true, error: null };
  } catch (error) {
    console.error("[LiveChat] Error updating tags:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function updateInternalNotes(
  conversationId: string,
  notes: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient();

    const { error: updateError } = await supabase
      .from("mod_chat_conversations")
      .update({ internal_notes: notes })
      .eq("id", conversationId);

    if (updateError) throw updateError;

    return { success: true, error: null };
  } catch (error) {
    console.error("[LiveChat] Error updating internal notes:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Toggle AI auto-response for a specific conversation.
 * When paused, AI will not respond to visitor messages in this conversation.
 * Stores who paused/resumed and when for multi-agent visibility.
 */
export async function setConversationAiPaused(
  conversationId: string,
  paused: boolean,
  agentName?: string,
  insertActivityMessage: boolean = false,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient();

    const { data: conv } = await supabase
      .from("mod_chat_conversations")
      .select("metadata, site_id")
      .eq("id", conversationId)
      .single();

    if (!conv) return { success: false, error: "Conversation not found" };

    const existingMeta = (conv.metadata || {}) as Record<string, unknown>;
    const newMeta: Record<string, unknown> = {
      ...existingMeta,
      ai_paused: paused,
    };

    if (paused) {
      newMeta.ai_paused_by = agentName || "Agent";
      newMeta.ai_paused_at = new Date().toISOString();
    } else {
      // Clean up attribution on resume
      delete newMeta.ai_paused_by;
      delete newMeta.ai_paused_at;
    }

    const { error: updateError } = await supabase
      .from("mod_chat_conversations")
      .update({
        metadata: newMeta,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    if (updateError) throw updateError;

    // Optionally insert an agent-attributed activity message
    if (insertActivityMessage && agentName) {
      await supabase.from("mod_chat_messages").insert({
        conversation_id: conversationId,
        site_id: conv.site_id,
        sender_type: "system",
        sender_name: agentName,
        content: paused
          ? `${agentName} paused AI responses`
          : `${agentName} resumed AI responses`,
        content_type: "system",
      });
    }

    revalidatePath(liveChatPath(conv.site_id));
    return { success: true, error: null };
  } catch (error) {
    console.error("[LiveChat] Error toggling AI:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Take over a conversation: assign the current user as agent + pause AI.
 * Industry-standard "claim" action for human agents.
 *
 * Multi-agent safe:
 * - If already assigned to another agent, still allows take-over (reassignment)
 * - Inserts a system message for audit trail so all agents see what happened
 * - Stores who paused AI for attribution
 */
export async function takeOverConversation(
  conversationId: string,
  agentId: string,
  agentName?: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient();

    // Check current state to produce an informative system message
    const { data: conv } = await supabase
      .from("mod_chat_conversations")
      .select("site_id, assigned_agent_id, status")
      .eq("id", conversationId)
      .single();

    if (!conv) return { success: false, error: "Conversation not found" };

    // Don't allow take-over of closed conversations
    if (conv.status === "closed") {
      return {
        success: false,
        error: "Cannot take over a closed conversation",
      };
    }

    // Already assigned to this agent
    if (conv.assigned_agent_id === agentId) {
      // Just ensure AI is paused
      const pauseResult = await setConversationAiPaused(
        conversationId,
        true,
        agentName,
      );
      return pauseResult;
    }

    // Assign the agent (handles count decrement/increment internally)
    const assignResult = await assignConversation(conversationId, agentId);
    if (!assignResult.success) return assignResult;

    // Pause AI with attribution
    const pauseResult = await setConversationAiPaused(
      conversationId,
      true,
      agentName,
    );
    if (!pauseResult.success) return pauseResult;

    // Insert system message for audit trail
    const label = agentName || "An agent";
    await supabase.from("mod_chat_messages").insert({
      conversation_id: conversationId,
      site_id: conv.site_id,
      sender_type: "system",
      content: `${label} took over this conversation`,
      content_type: "system",
      is_internal_note: true,
    });

    return { success: true, error: null };
  } catch (error) {
    console.error("[LiveChat] Error taking over conversation:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function markConversationRead(
  conversationId: string,
  role: "agent" | "visitor",
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient();

    const updateField =
      role === "agent" ? "unread_agent_count" : "unread_visitor_count";

    const { error: updateError } = await supabase
      .from("mod_chat_conversations")
      .update({ [updateField]: 0 })
      .eq("id", conversationId);

    if (updateError) throw updateError;

    // Mark messages as read
    const senderTypes: MessageSenderType[] =
      role === "agent" ? ["visitor"] : ["agent", "ai"];

    await supabase
      .from("mod_chat_messages")
      .update({ status: "read" })
      .eq("conversation_id", conversationId)
      .in("sender_type", senderTypes)
      .neq("status", "read");

    return { success: true, error: null };
  } catch (error) {
    console.error("[LiveChat] Error marking conversation read:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getConversationStats(
  siteId: string,
): Promise<{ stats: ChatOverviewStats; error: string | null }> {
  try {
    const supabase = await getModuleClient();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStr = todayStart.toISOString();

    // Active conversations
    const { count: activeCount } = await supabase
      .from("mod_chat_conversations")
      .select("*", { count: "exact", head: true })
      .eq("site_id", siteId)
      .eq("status", "active");

    // Pending conversations
    const { count: pendingCount } = await supabase
      .from("mod_chat_conversations")
      .select("*", { count: "exact", head: true })
      .eq("site_id", siteId)
      .eq("status", "pending");

    // Online agents
    const { count: onlineCount } = await supabase
      .from("mod_chat_agents")
      .select("*", { count: "exact", head: true })
      .eq("site_id", siteId)
      .eq("is_active", true)
      .in("status", ["online", "away", "busy"]);

    // Today's conversations
    const { count: todayCount } = await supabase
      .from("mod_chat_conversations")
      .select("*", { count: "exact", head: true })
      .eq("site_id", siteId)
      .gte("created_at", todayStr);

    // Today's resolved
    const { count: resolvedCount } = await supabase
      .from("mod_chat_conversations")
      .select("*", { count: "exact", head: true })
      .eq("site_id", siteId)
      .eq("status", "resolved")
      .gte("resolved_at", todayStr);

    // Today's missed
    const { count: missedCount } = await supabase
      .from("mod_chat_conversations")
      .select("*", { count: "exact", head: true })
      .eq("site_id", siteId)
      .eq("status", "missed")
      .gte("created_at", todayStr);

    // Average response time (from today's resolved)
    const { data: responseData } = await supabase
      .from("mod_chat_conversations")
      .select("first_response_time_seconds")
      .eq("site_id", siteId)
      .gte("created_at", todayStr)
      .not("first_response_time_seconds", "is", null);

    let avgResponseTime = 0;
    if (responseData && responseData.length > 0) {
      const total = responseData.reduce(
        (sum: number, r: Record<string, unknown>) =>
          sum + ((r.first_response_time_seconds as number) || 0),
        0,
      );
      avgResponseTime = Math.round(total / responseData.length);
    }

    // Satisfaction score
    const { data: ratingData } = await supabase
      .from("mod_chat_conversations")
      .select("rating")
      .eq("site_id", siteId)
      .gte("rated_at", todayStr)
      .not("rating", "is", null);

    let satisfactionScore = 0;
    if (ratingData && ratingData.length > 0) {
      const total = ratingData.reduce(
        (sum: number, r: Record<string, unknown>) =>
          sum + ((r.rating as number) || 0),
        0,
      );
      satisfactionScore = Math.round((total / ratingData.length) * 20); // Convert 1-5 to 0-100
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
    };
  } catch (error) {
    console.error("[LiveChat] Error getting conversation stats:", error);
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
    };
  }
}

// =============================================================================
// AGENT ACTIVITY MESSAGES
// =============================================================================

/**
 * Insert an agent-attributed system message into a conversation timeline.
 * Used by order/quote panels when the agent takes an action (e.g. cancels an
 * order) so the full team can see exactly who did what and why.
 */
export async function insertChatActivityMessage(
  conversationId: string,
  siteId: string,
  content: string,
  agentName: string,
): Promise<void> {
  try {
    const supabase = await getModuleClient();
    await supabase.from("mod_chat_messages").insert({
      conversation_id: conversationId,
      site_id: siteId,
      sender_type: "system",
      sender_name: agentName,
      content,
      content_type: "system",
    });
  } catch (err) {
    console.error("[LiveChat] insertChatActivityMessage error:", err);
  }
}
