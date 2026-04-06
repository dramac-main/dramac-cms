"use server";

/**
 * Live Chat Module — Chat Message Template Actions
 *
 * Server actions for CRUD on mod_chat_message_templates.
 * Allows site owners to customize proactive AI chat messages.
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  invalidateChatTemplateCache,
  CHAT_MESSAGE_TEMPLATE_CONFIGS,
  type ChatMessageEventType,
} from "../lib/chat-template-resolver";

async function getModuleClient() {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabase as any;
}

export interface ChatMessageTemplateRow {
  id: string;
  event_type: string;
  message_template: string;
  enabled: boolean;
}

/**
 * Get all chat message templates for a site.
 */
export async function getChatMessageTemplates(
  siteId: string,
): Promise<{ templates: ChatMessageTemplateRow[]; error: string | null }> {
  try {
    const supabase = await getModuleClient();

    const { data, error } = await supabase
      .from("mod_chat_message_templates")
      .select("id, event_type, message_template, enabled")
      .eq("site_id", siteId)
      .order("event_type");

    if (error) {
      return { templates: [], error: error.message };
    }

    return { templates: data || [], error: null };
  } catch (err) {
    return {
      templates: [],
      error: err instanceof Error ? err.message : "Failed to load templates",
    };
  }
}

/**
 * Save (upsert) a single chat message template.
 */
export async function saveChatMessageTemplate(
  siteId: string,
  eventType: ChatMessageEventType,
  messageTemplate: string,
  enabled: boolean,
): Promise<{ error: string | null }> {
  try {
    const supabase = await getModuleClient();

    const { error } = await supabase.from("mod_chat_message_templates").upsert(
      {
        site_id: siteId,
        event_type: eventType,
        message_template: messageTemplate,
        enabled,
      },
      { onConflict: "site_id,event_type" },
    );

    if (error) {
      return { error: error.message };
    }

    invalidateChatTemplateCache(siteId);
    revalidatePath(`/dashboard/sites/${siteId}/live-chat/settings`);
    return { error: null };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to save template",
    };
  }
}

/**
 * Save multiple chat message templates at once (bulk upsert).
 */
export async function saveChatMessageTemplates(
  siteId: string,
  templates: {
    event_type: ChatMessageEventType;
    message_template: string;
    enabled: boolean;
  }[],
): Promise<{ error: string | null }> {
  try {
    const supabase = await getModuleClient();

    const rows = templates.map((t) => ({
      site_id: siteId,
      event_type: t.event_type,
      message_template: t.message_template,
      enabled: t.enabled,
    }));

    const { error } = await supabase
      .from("mod_chat_message_templates")
      .upsert(rows, { onConflict: "site_id,event_type" });

    if (error) {
      return { error: error.message };
    }

    invalidateChatTemplateCache(siteId);
    revalidatePath(`/dashboard/sites/${siteId}/live-chat/settings`);
    return { error: null };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to save templates",
    };
  }
}

/**
 * Toggle a chat message template's enabled state.
 */
export async function toggleChatMessageTemplate(
  siteId: string,
  eventType: ChatMessageEventType,
  enabled: boolean,
): Promise<{ error: string | null }> {
  try {
    const supabase = await getModuleClient();

    // Use upsert so toggles work even if no custom template saved yet
    const { error } = await supabase
      .from("mod_chat_message_templates")
      .upsert(
        {
          site_id: siteId,
          event_type: eventType,
          enabled,
          // If inserting for first time, use the default message
          message_template: "", // Will be overridden by existing row on conflict
        },
        { onConflict: "site_id,event_type" },
      )
      .select("id")
      .single();

    // If the template didn't exist and we need to set the default message
    if (!error) {
      const config = CHAT_MESSAGE_TEMPLATE_CONFIGS[eventType];
      if (config) {
        // Update with default message if the message_template is empty
        await supabase
          .from("mod_chat_message_templates")
          .update({
            message_template: config.defaultMessage,
            enabled,
          })
          .eq("site_id", siteId)
          .eq("event_type", eventType)
          .eq("message_template", "");
      }
    }

    if (error) {
      return { error: error.message };
    }

    invalidateChatTemplateCache(siteId);
    revalidatePath(`/dashboard/sites/${siteId}/live-chat/settings`);
    return { error: null };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to toggle template",
    };
  }
}

/**
 * Reset a chat message template to default (delete the custom row).
 */
export async function resetChatMessageTemplate(
  siteId: string,
  eventType: ChatMessageEventType,
): Promise<{ error: string | null }> {
  try {
    const supabase = await getModuleClient();

    const { error } = await supabase
      .from("mod_chat_message_templates")
      .delete()
      .eq("site_id", siteId)
      .eq("event_type", eventType);

    if (error) {
      return { error: error.message };
    }

    invalidateChatTemplateCache(siteId);
    revalidatePath(`/dashboard/sites/${siteId}/live-chat/settings`);
    return { error: null };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to reset template",
    };
  }
}
