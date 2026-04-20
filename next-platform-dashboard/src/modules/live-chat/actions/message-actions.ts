"use server";

/**
 * Live Chat Module — Message Actions
 *
 * Server actions for sending, retrieving, and managing chat messages.
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { mapRecord, mapRecords } from "../lib/map-db-record";
import type {
  ChatMessage,
  MessageStatus,
  MessageContentType,
  MessageSenderType,
} from "../types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getModuleClient() {
  const supabase = await createClient();
  return supabase as any;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getMessages(
  conversationId: string,
  page = 1,
  pageSize = 50,
): Promise<{ messages: ChatMessage[]; total: number; error: string | null }> {
  try {
    const supabase = await getModuleClient();
    const offset = (page - 1) * pageSize;

    const { data, count, error } = await supabase
      .from("mod_chat_messages")
      .select("*", { count: "exact" })
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    return {
      messages: mapRecords<ChatMessage>(data || []),
      total: count || 0,
      error: null,
    };
  } catch (error) {
    console.error("[LiveChat] Error getting messages:", error);
    return { messages: [], total: 0, error: (error as Error).message };
  }
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function sendMessage(data: {
  conversationId: string;
  siteId: string;
  senderType: MessageSenderType;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  content: string;
  contentType?: MessageContentType;
  isInternalNote?: boolean;
  mentionedAgentIds?: string[];
}): Promise<{ message: ChatMessage | null; error: string | null }> {
  try {
    const supabase = await getModuleClient();

    const insertData: Record<string, unknown> = {
      conversation_id: data.conversationId,
      site_id: data.siteId,
      sender_type: data.senderType,
      content: data.content,
      content_type: data.contentType || "text",
      status: "sent",
      is_internal_note: data.isInternalNote || false,
    };

    if (data.senderId) insertData.sender_id = data.senderId;
    if (data.senderName) insertData.sender_name = data.senderName;
    if (data.senderAvatar) insertData.sender_avatar = data.senderAvatar;
    if (data.isInternalNote) insertData.content_type = "note";
    if (data.mentionedAgentIds && data.mentionedAgentIds.length > 0) {
      insertData.mentioned_agent_ids = data.mentionedAgentIds;
    }

    const { data: msgData, error } = await supabase
      .from("mod_chat_messages")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    // If first agent/AI message, calculate first_response_time
    if (data.senderType === "agent" || data.senderType === "ai") {
      const { data: conv } = await supabase
        .from("mod_chat_conversations")
        .select(
          "first_response_time_seconds, status, created_at, assigned_agent_id, metadata",
        )
        .eq("id", data.conversationId)
        .single();

      if (conv) {
        const updates: Record<string, unknown> = {};

        if (conv.first_response_time_seconds === null) {
          updates.first_response_time_seconds = Math.floor(
            (Date.now() - new Date(conv.created_at).getTime()) / 1000,
          );
        }

        if (conv.status === "pending") {
          updates.status = "active";
        }

        // Auto-pause AI when a human agent sends their first non-internal message
        if (data.senderType === "agent" && !data.isInternalNote) {
          const meta = (conv.metadata || {}) as Record<string, unknown>;
          if (!meta.ai_paused) {
            updates.metadata = {
              ...meta,
              ai_paused: true,
              ai_paused_by: data.senderName || "Agent",
              ai_paused_at: new Date().toISOString(),
            };
          }
        }

        if (Object.keys(updates).length > 0) {
          await supabase
            .from("mod_chat_conversations")
            .update(updates)
            .eq("id", data.conversationId);
        }
      }
    }

    const message = mapRecord<ChatMessage>(msgData);

    // Send web push notification to customer when agent sends a message (non-internal)
    if (
      (data.senderType === "agent" || data.senderType === "ai") &&
      !data.isInternalNote
    ) {
      try {
        const { sendPushToConversation } =
          await import("@/lib/actions/web-push");
        const senderLabel = data.senderName || "Support Agent";
        const preview =
          data.content.length > 100
            ? data.content.slice(0, 100) + "…"
            : data.content;
        sendPushToConversation(data.conversationId, {
          title: `Message from ${senderLabel}`,
          body: preview,
          tag: `chat-${data.conversationId}`,
          type: "chat",
          conversationId: data.conversationId,
          renotify: true,
        }).catch(() => {});
      } catch {
        // web-push module not available — skip silently
      }
    }

    // Create notifications for @mentioned agents
    if (
      data.mentionedAgentIds &&
      data.mentionedAgentIds.length > 0 &&
      data.isInternalNote
    ) {
      try {
        const { createNotification } =
          await import("@/lib/services/notifications");
        const senderLabel = data.senderName || "An agent";
        const preview =
          data.content.length > 80
            ? data.content.slice(0, 80) + "…"
            : data.content;

        // Resolve agent table IDs → auth user IDs for notifications
        const { data: agentRows } = await supabase
          .from("mod_chat_agents")
          .select("id, user_id")
          .in("id", data.mentionedAgentIds);

        const resolvedUserIds = (agentRows || [])
          .filter((a: { id: string; user_id: string }) => a.user_id)
          .map((a: { id: string; user_id: string }) => a.user_id);

        await Promise.allSettled(
          resolvedUserIds.map((authUserId: string) =>
            createNotification({
              userId: authUserId,
              type: "mention",
              title: `${senderLabel} mentioned you in a chat note`,
              message: preview,
              link: `/dashboard/sites/${data.siteId}/live-chat/conversations/${data.conversationId}`,
            }),
          ),
        );
      } catch (notifError) {
        console.error(
          "[LiveChat] Failed to send mention notifications:",
          notifError,
        );
      }
    }

    return { message, error: null };
  } catch (error) {
    console.error("[LiveChat] Error sending message:", error);
    return { message: null, error: (error as Error).message };
  }
}

export async function sendFileMessage(data: {
  conversationId: string;
  siteId: string;
  senderType: MessageSenderType;
  senderId?: string;
  senderName?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileMimeType: string;
  contentType: MessageContentType;
}): Promise<{ message: ChatMessage | null; error: string | null }> {
  try {
    const supabase = await getModuleClient();

    const insertData: Record<string, unknown> = {
      conversation_id: data.conversationId,
      site_id: data.siteId,
      sender_type: data.senderType,
      content_type: data.contentType,
      file_url: data.fileUrl,
      file_name: data.fileName,
      file_size: data.fileSize,
      file_mime_type: data.fileMimeType,
      status: "sent",
    };

    if (data.senderId) insertData.sender_id = data.senderId;
    if (data.senderName) insertData.sender_name = data.senderName;

    const { data: msgData, error } = await supabase
      .from("mod_chat_messages")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return { message: mapRecord<ChatMessage>(msgData), error: null };
  } catch (error) {
    console.error("[LiveChat] Error sending file message:", error);
    return { message: null, error: (error as Error).message };
  }
}

export async function updateMessageStatus(
  messageId: string,
  status: MessageStatus,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient();

    const { error } = await supabase
      .from("mod_chat_messages")
      .update({ status })
      .eq("id", messageId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error("[LiveChat] Error updating message status:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteMessage(
  messageId: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient();

    const { error } = await supabase
      .from("mod_chat_messages")
      .update({
        content: "[Message deleted]",
        file_url: null,
        file_name: null,
        file_size: null,
        file_mime_type: null,
      })
      .eq("id", messageId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error("[LiveChat] Error deleting message:", error);
    return { success: false, error: (error as Error).message };
  }
}

// ─── Agent Approval ──────────────────────────────────────────────────────────

/**
 * Approve a proactive AI message that was staged for agent review.
 * Sets `is_internal_note = false`, `status = 'sent'`, and removes
 * the `pending_agent_approval` flag from metadata so the customer can see it.
 *
 * Optionally accepts edited content before sending.
 */
export async function approveProactiveMessage(
  messageId: string,
  siteId: string,
  editedContent?: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient();

    // Fetch current message to validate ownership and state
    const { data: msg, error: fetchErr } = await supabase
      .from("mod_chat_messages")
      .select("id, site_id, content, conversation_id, metadata, status")
      .eq("id", messageId)
      .single();

    if (fetchErr || !msg) {
      return { success: false, error: "Message not found" };
    }

    if (msg.site_id !== siteId) {
      return { success: false, error: "Unauthorized" };
    }

    if (msg.status !== "pending_approval") {
      return {
        success: false,
        error: "Message is not pending approval",
      };
    }

    // Strip the pending flag from metadata
    const updatedMetadata = { ...(msg.metadata || {}) };
    delete updatedMetadata.pending_agent_approval;

    const finalContent =
      editedContent !== undefined ? editedContent.trim() : (msg.content as string);

    const { error: updateErr } = await supabase
      .from("mod_chat_messages")
      .update({
        is_internal_note: false,
        status: "sent",
        content: finalContent,
        metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", messageId);

    if (updateErr) throw updateErr;

    // Update conversation last_message now that it is visible
    await supabase
      .from("mod_chat_conversations")
      .update({
        last_message_text: finalContent.substring(0, 255),
        last_message_at: new Date().toISOString(),
        last_message_by: "ai",
        updated_at: new Date().toISOString(),
      })
      .eq("id", msg.conversation_id);

    revalidatePath(`/dashboard/sites/${siteId}/live-chat`);
    revalidatePath(`/portal/sites/${siteId}/live-chat`);

    return { success: true, error: null };
  } catch (error) {
    console.error("[LiveChat] Error approving proactive message:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Discard a proactive AI message staged for agent review.
 * Hard-deletes the row since the customer never saw it.
 */
export async function discardProactiveMessage(
  messageId: string,
  siteId: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient();

    const { data: msg, error: fetchErr } = await supabase
      .from("mod_chat_messages")
      .select("id, site_id, status")
      .eq("id", messageId)
      .single();

    if (fetchErr || !msg) {
      return { success: false, error: "Message not found" };
    }

    if (msg.site_id !== siteId) {
      return { success: false, error: "Unauthorized" };
    }

    if (msg.status !== "pending_approval") {
      return { success: false, error: "Message is not pending approval" };
    }

    const { error: deleteErr } = await supabase
      .from("mod_chat_messages")
      .delete()
      .eq("id", messageId);

    if (deleteErr) throw deleteErr;

    revalidatePath(`/dashboard/sites/${siteId}/live-chat`);
    revalidatePath(`/portal/sites/${siteId}/live-chat`);

    return { success: true, error: null };
  } catch (error) {
    console.error("[LiveChat] Error discarding proactive message:", error);
    return { success: false, error: (error as Error).message };
  }
}
