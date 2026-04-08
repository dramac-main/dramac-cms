/**
 * Action Executor Service
 *
 * Phase EM-57A: Automation Engine - Core Infrastructure
 *
 * Executes individual actions within workflows including:
 * - CRM actions (create contact, deal, task)
 * - Email actions (send, send template)
 * - Notification actions (Slack, Discord, in-app)
 * - Webhook actions (HTTP requests)
 * - Data actions (CRUD operations)
 * - Transform actions (map, filter, aggregate)
 *
 * NOTE: This is implemented as standalone async functions following the
 * Server Actions pattern used throughout the platform.
 */

"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send-email";
import { sendBrandedEmail } from "@/lib/email/send-branded-email";
import {
  resend,
  isEmailEnabled,
  getEmailFrom,
  getEmailReplyTo,
} from "@/lib/email/resend-client";
import {
  buildEmailBranding,
  applySiteBranding,
  type SiteBrandingData,
} from "@/lib/email/email-branding";
import { getAgencyBranding } from "@/lib/queries/branding";
import type { EmailType } from "@/lib/email/email-types";
import type { ExecutionContext, ActionResult } from "../types/automation-types";
import { resolveChatMessage } from "@/modules/live-chat/lib/chat-template-resolver";
import type { ChatMessageEventType } from "@/modules/live-chat/lib/chat-template-resolver";

// Cross-module action imports
import {
  updateOrderStatus,
  addOrderNote,
  addOrderShipment,
  createRefund,
} from "@/modules/ecommerce/actions/order-actions";
import { adjustStock } from "@/modules/ecommerce/actions/inventory-actions";
import {
  updateQuoteStatus,
  notifyQuoteCreated,
} from "@/modules/ecommerce/actions/quote-actions";
import {
  sendQuote,
  sendQuoteReminder,
  convertQuoteToOrder,
} from "@/modules/ecommerce/actions/quote-workflow-actions";
import {
  createAppointment,
  updateAppointment,
  cancelAppointment,
  createReminder,
} from "@/modules/booking/actions/booking-actions";
import { sendMessage } from "@/modules/live-chat/actions/message-actions";
import {
  assignConversation,
  resolveConversation,
  closeConversation,
  updateConversationTags,
} from "@/modules/live-chat/actions/conversation-actions";

// ============================================================================
// SUPABASE CLIENT TYPE HELPER
// ============================================================================

/**
 * Cast Supabase client for automation/module tables
 * These tables are created by migrations and may not be in generated types yet.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AutomationDB = any;

// ============================================================================
// CRM MODULE CONSTANTS (per EM-05 naming conventions)
// ============================================================================

const CRM_SHORT_ID = "crmmod01";
const CRM_TABLE_PREFIX = `mod_${CRM_SHORT_ID}`;

// ============================================================================
// MAIN EXECUTION FUNCTION
// ============================================================================

/**
 * Execute an action by type
 */
export async function executeAction(
  actionType: string,
  config: Record<string, unknown>,
  context: ExecutionContext,
): Promise<ActionResult> {
  const [category, action] = actionType.split(".");

  switch (category) {
    case "crm":
      return executeCrmAction(action, config, context);
    case "ecommerce":
      return executeEcommerceAction(action, config, context);
    case "booking":
      return executeBookingAction(action, config, context);
    case "chat":
      return executeChatAction(action, config, context);
    case "email":
      return executeEmailAction(action, config, context);
    case "notification":
      return executeNotificationAction(action, config, context);
    case "webhook":
      return executeWebhookAction(action, config);
    case "data":
      return executeDataAction(action, config, context);
    case "transform":
      return executeTransformAction(action, config);
    case "flow":
      return executeFlowAction(action, config);
    default:
      return {
        status: "failed",
        error: `Unknown action category: ${category}`,
      };
  }
}

// ============================================================================
// CRM ACTIONS
// ============================================================================

async function executeCrmAction(
  action: string,
  config: Record<string, unknown>,
  context: ExecutionContext,
): Promise<ActionResult> {
  const supabase = createAdminClient() as AutomationDB;
  const siteId = context.execution?.siteId;

  if (!siteId) {
    return { status: "failed", error: "Site ID not available in context" };
  }

  switch (action) {
    case "create_contact": {
      const { data, error } = await supabase
        .from(`${CRM_TABLE_PREFIX}_contacts`)
        .insert({
          site_id: siteId,
          email: config.email,
          first_name: config.first_name || null,
          last_name: config.last_name || null,
          phone: config.phone || null,
          company: config.company || null,
          tags: config.tags || [],
          custom_fields: config.custom_fields || {},
          status: "active",
          lead_status: "new",
        })
        .select("id, *")
        .single();

      if (error) {
        return { status: "failed", error: error.message };
      }
      return {
        status: "completed",
        output: { contact_id: data.id, contact: data },
      };
    }

    case "update_contact": {
      const { data, error } = await supabase
        .from(`${CRM_TABLE_PREFIX}_contacts`)
        .update(config.fields as Record<string, unknown>)
        .eq("id", config.contact_id)
        .eq("site_id", siteId)
        .select("*")
        .single();

      if (error) {
        return { status: "failed", error: error.message };
      }
      return { status: "completed", output: { contact: data } };
    }

    case "add_tag": {
      // First get current tags
      const { data: contact, error: fetchError } = await supabase
        .from(`${CRM_TABLE_PREFIX}_contacts`)
        .select("tags")
        .eq("id", config.contact_id)
        .eq("site_id", siteId)
        .single();

      if (fetchError) {
        return { status: "failed", error: fetchError.message };
      }

      // Add tag (avoid duplicates)
      const currentTags = (contact.tags || []) as string[];
      const newTag = config.tag as string;
      const updatedTags = currentTags.includes(newTag)
        ? currentTags
        : [...currentTags, newTag];

      const { error: updateError } = await supabase
        .from(`${CRM_TABLE_PREFIX}_contacts`)
        .update({ tags: updatedTags })
        .eq("id", config.contact_id)
        .eq("site_id", siteId);

      if (updateError) {
        return { status: "failed", error: updateError.message };
      }
      return {
        status: "completed",
        output: { success: true, tags: updatedTags },
      };
    }

    case "remove_tag": {
      const { data: contact, error: fetchError } = await supabase
        .from(`${CRM_TABLE_PREFIX}_contacts`)
        .select("tags")
        .eq("id", config.contact_id)
        .eq("site_id", siteId)
        .single();

      if (fetchError) {
        return { status: "failed", error: fetchError.message };
      }

      const currentTags = (contact.tags || []) as string[];
      const tagToRemove = config.tag as string;
      const updatedTags = currentTags.filter((t) => t !== tagToRemove);

      const { error: updateError } = await supabase
        .from(`${CRM_TABLE_PREFIX}_contacts`)
        .update({ tags: updatedTags })
        .eq("id", config.contact_id)
        .eq("site_id", siteId);

      if (updateError) {
        return { status: "failed", error: updateError.message };
      }
      return {
        status: "completed",
        output: { success: true, tags: updatedTags },
      };
    }

    case "find_contact": {
      const field = config.field as string;
      const value = config.value as string;

      const { data, error } = await supabase
        .from(`${CRM_TABLE_PREFIX}_contacts`)
        .select("*")
        .eq("site_id", siteId)
        .eq(field, value)
        .maybeSingle();

      if (error) {
        return { status: "failed", error: error.message };
      }
      return { status: "completed", output: { contact: data, found: !!data } };
    }

    case "create_deal": {
      const { data, error } = await supabase
        .from(`${CRM_TABLE_PREFIX}_deals`)
        .insert({
          site_id: siteId,
          title: config.title,
          value: config.value || 0,
          contact_id: config.contact_id || null,
          company_id: config.company_id || null,
          stage_id: config.stage || null,
          pipeline_id: config.pipeline_id || null,
          status: "open",
        })
        .select("id, *")
        .single();

      if (error) {
        return { status: "failed", error: error.message };
      }
      return { status: "completed", output: { deal_id: data.id, deal: data } };
    }

    case "move_deal_stage": {
      const { data, error } = await supabase
        .from(`${CRM_TABLE_PREFIX}_deals`)
        .update({ stage_id: config.stage })
        .eq("id", config.deal_id)
        .eq("site_id", siteId)
        .select("*")
        .single();

      if (error) {
        return { status: "failed", error: error.message };
      }
      return { status: "completed", output: { deal: data } };
    }

    case "create_task": {
      const { data, error } = await supabase
        .from(`${CRM_TABLE_PREFIX}_tasks`)
        .insert({
          site_id: siteId,
          title: config.title,
          description: config.description || null,
          due_date: config.due_date || null,
          assigned_to: config.assigned_to || null,
          contact_id: config.contact_id || null,
          deal_id: config.deal_id || null,
          status: "pending",
        })
        .select("id")
        .single();

      if (error) {
        return { status: "failed", error: error.message };
      }
      return { status: "completed", output: { task_id: data.id } };
    }

    case "log_activity": {
      const { data, error } = await supabase
        .from(`${CRM_TABLE_PREFIX}_activities`)
        .insert({
          site_id: siteId,
          contact_id: config.contact_id,
          type: config.type,
          description: config.description,
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (error) {
        return { status: "failed", error: error.message };
      }
      return { status: "completed", output: { activity_id: data.id } };
    }

    default:
      return { status: "failed", error: `Unknown CRM action: ${action}` };
  }
}

// ============================================================================
// E-COMMERCE ACTIONS
// ============================================================================

async function executeEcommerceAction(
  action: string,
  config: Record<string, unknown>,
  context: ExecutionContext,
): Promise<ActionResult> {
  const siteId = context.execution?.siteId;

  if (!siteId) {
    return { status: "failed", error: "Site ID not available in context" };
  }

  switch (action) {
    case "update_order_status": {
      try {
        const result = await updateOrderStatus(
          siteId,
          config.order_id as string,
          config.status as
            | "pending"
            | "confirmed"
            | "processing"
            | "shipped"
            | "delivered"
            | "cancelled"
            | "refunded",
          (config.user_id as string) || "automation",
          (config.user_name as string) || "Automation",
          (config.note as string) || undefined,
        );
        if (!result.success) {
          return {
            status: "failed",
            error: result.error || "Failed to update order status",
          };
        }
        return {
          status: "completed",
          output: {
            success: true,
            order_id: config.order_id,
            status: config.status,
          },
        };
      } catch (error) {
        return {
          status: "failed",
          error:
            error instanceof Error
              ? error.message
              : "Failed to update order status",
        };
      }
    }

    case "add_order_note": {
      try {
        const note = await addOrderNote(
          siteId,
          config.order_id as string,
          config.content as string,
          (config.is_internal as boolean) ?? true,
          (config.user_id as string) || "automation",
          (config.user_name as string) || "Automation",
        );
        if (!note) {
          return { status: "failed", error: "Failed to add order note" };
        }
        return {
          status: "completed",
          output: { success: true, note_id: note.id },
        };
      } catch (error) {
        return {
          status: "failed",
          error:
            error instanceof Error ? error.message : "Failed to add order note",
        };
      }
    }

    case "add_shipment": {
      try {
        const shipment = await addOrderShipment(
          siteId,
          config.order_id as string,
          {
            carrier: config.carrier as string,
            tracking_number: config.tracking_number as string,
            tracking_url: (config.tracking_url as string) || undefined,
          },
          (config.user_id as string) || "automation",
          (config.user_name as string) || "Automation",
        );
        if (!shipment) {
          return { status: "failed", error: "Failed to add shipment" };
        }
        return {
          status: "completed",
          output: { success: true, shipment_id: shipment.id },
        };
      } catch (error) {
        return {
          status: "failed",
          error:
            error instanceof Error ? error.message : "Failed to add shipment",
        };
      }
    }

    case "create_refund": {
      try {
        const refund = await createRefund(
          siteId,
          config.order_id as string,
          {
            amount: config.amount as number,
            reason: config.reason as string,
            refund_method:
              (config.refund_method as
                | "original_payment"
                | "store_credit"
                | "other") || "original_payment",
          },
          (config.user_id as string) || "automation",
          (config.user_name as string) || "Automation",
        );
        if (!refund) {
          return { status: "failed", error: "Failed to create refund" };
        }
        return {
          status: "completed",
          output: { success: true, refund_id: refund.id },
        };
      } catch (error) {
        return {
          status: "failed",
          error:
            error instanceof Error ? error.message : "Failed to create refund",
        };
      }
    }

    case "adjust_stock": {
      try {
        const result = await adjustStock(
          siteId,
          config.product_id as string,
          (config.variant_id as string) || null,
          config.quantity as number,
          ((config.movement_type as string) ||
            "adjustment") as import("@/modules/ecommerce/types/inventory-types").InventoryMovementType,
          (config.reason as string) || undefined,
        );
        if (!result.success) {
          return {
            status: "failed",
            error: result.error || "Failed to adjust stock",
          };
        }
        return {
          status: "completed",
          output: { success: true, movement: result.movement },
        };
      } catch (error) {
        return {
          status: "failed",
          error:
            error instanceof Error ? error.message : "Failed to adjust stock",
        };
      }
    }

    case "update_quote_status": {
      try {
        const result = await updateQuoteStatus(
          siteId,
          config.quote_id as string,
          config.status as import("@/modules/ecommerce/types/ecommerce-types").QuoteStatus,
          (config.user_id as string) || undefined,
          (config.user_name as string) || undefined,
          (config.notes as string) || undefined,
        );
        if (!result.success) {
          return {
            status: "failed",
            error: result.error || "Failed to update quote status",
          };
        }
        return {
          status: "completed",
          output: {
            success: true,
            quote_id: config.quote_id,
            status: config.status,
          },
        };
      } catch (error) {
        return {
          status: "failed",
          error:
            error instanceof Error
              ? error.message
              : "Failed to update quote status",
        };
      }
    }

    case "send_quote": {
      try {
        const result = await sendQuote({
          quote_id: config.quote_id as string,
          site_id: siteId,
          subject: (config.subject as string) || undefined,
          message: (config.message as string) || undefined,
        });
        if (!result.success) {
          return {
            status: "failed",
            error: result.error || "Failed to send quote",
          };
        }
        return {
          status: "completed",
          output: { success: true, quote_id: config.quote_id },
        };
      } catch (error) {
        return {
          status: "failed",
          error:
            error instanceof Error ? error.message : "Failed to send quote",
        };
      }
    }

    case "send_quote_reminder": {
      try {
        const result = await sendQuoteReminder(
          siteId,
          config.quote_id as string,
          (config.message as string) || undefined,
        );
        if (!result.success) {
          return {
            status: "failed",
            error: result.error || "Failed to send quote reminder",
          };
        }
        return {
          status: "completed",
          output: { success: true, quote_id: config.quote_id },
        };
      } catch (error) {
        return {
          status: "failed",
          error:
            error instanceof Error
              ? error.message
              : "Failed to send quote reminder",
        };
      }
    }

    case "convert_quote_to_order": {
      try {
        const result = await convertQuoteToOrder({
          quote_id: config.quote_id as string,
          site_id: siteId,
          user_id: (config.user_id as string) || undefined,
          user_name: (config.user_name as string) || undefined,
        });
        if (!result.success) {
          return {
            status: "failed",
            error: result.error || "Failed to convert quote to order",
          };
        }
        return {
          status: "completed",
          output: { success: true, order_id: result.order?.id },
        };
      } catch (error) {
        return {
          status: "failed",
          error:
            error instanceof Error
              ? error.message
              : "Failed to convert quote to order",
        };
      }
    }

    case "notify_quote_created": {
      try {
        await notifyQuoteCreated(siteId, config.quote_id as string);
        return { status: "completed", output: { success: true } };
      } catch (error) {
        return {
          status: "failed",
          error:
            error instanceof Error
              ? error.message
              : "Failed to send quote notification",
        };
      }
    }

    default:
      return {
        status: "failed",
        error: `Unknown e-commerce action: ${action}`,
      };
  }
}

// ============================================================================
// BOOKING ACTIONS
// ============================================================================

async function executeBookingAction(
  action: string,
  config: Record<string, unknown>,
  context: ExecutionContext,
): Promise<ActionResult> {
  const siteId = context.execution?.siteId;

  if (!siteId) {
    return { status: "failed", error: "Site ID not available in context" };
  }

  switch (action) {
    case "create_appointment": {
      try {
        const appointment = await createAppointment(siteId, {
          service_id: config.service_id as string,
          staff_id: (config.staff_id as string) || undefined,
          customer_name: config.customer_name as string,
          customer_email: config.customer_email as string,
          customer_phone: (config.customer_phone as string) || undefined,
          start_time: config.start_time as string,
          end_time: config.end_time as string,
          customer_notes: (config.notes as string) || undefined,
        });
        return {
          status: "completed",
          output: { appointment_id: appointment.id, appointment },
        };
      } catch (error) {
        return {
          status: "failed",
          error:
            error instanceof Error
              ? error.message
              : "Failed to create appointment",
        };
      }
    }

    case "update_appointment": {
      try {
        const appointment = await updateAppointment(
          siteId,
          config.appointment_id as string,
          config.updates as Record<string, unknown>,
        );
        return {
          status: "completed",
          output: { appointment_id: appointment.id, appointment },
        };
      } catch (error) {
        return {
          status: "failed",
          error:
            error instanceof Error
              ? error.message
              : "Failed to update appointment",
        };
      }
    }

    case "update_status": {
      try {
        const appointment = await updateAppointment(
          siteId,
          config.appointment_id as string,
          {
            status:
              config.status as import("@/modules/booking/types/booking-types").AppointmentStatus,
          },
        );
        return {
          status: "completed",
          output: { appointment_id: appointment.id, status: config.status },
        };
      } catch (error) {
        return {
          status: "failed",
          error:
            error instanceof Error
              ? error.message
              : "Failed to update appointment status",
        };
      }
    }

    case "cancel_appointment": {
      try {
        const appointment = await cancelAppointment(
          siteId,
          config.appointment_id as string,
          ((config.cancelled_by as string) ||
            "system") as import("@/modules/booking/types/booking-types").CancelledBy,
          (config.reason as string) || undefined,
        );
        return {
          status: "completed",
          output: { appointment_id: appointment.id, cancelled: true },
        };
      } catch (error) {
        return {
          status: "failed",
          error:
            error instanceof Error
              ? error.message
              : "Failed to cancel appointment",
        };
      }
    }

    case "create_reminder": {
      try {
        const reminder = await createReminder(siteId, {
          appointment_id: config.appointment_id as string,
          type: ((config.type as string) ||
            "email") as import("@/modules/booking/types/booking-types").ReminderType,
          send_at: config.send_at as string,
          subject: (config.subject as string) || undefined,
          body: (config.message as string) || undefined,
        });
        return {
          status: "completed",
          output: { reminder_id: reminder.id, reminder },
        };
      } catch (error) {
        return {
          status: "failed",
          error:
            error instanceof Error
              ? error.message
              : "Failed to create reminder",
        };
      }
    }

    default:
      return { status: "failed", error: `Unknown booking action: ${action}` };
  }
}

// ============================================================================
// LIVE CHAT ACTIONS
// ============================================================================

async function executeChatAction(
  action: string,
  config: Record<string, unknown>,
  context: ExecutionContext,
): Promise<ActionResult> {
  const siteId = context.execution?.siteId;

  if (!siteId) {
    return { status: "failed", error: "Site ID not available in context" };
  }

  switch (action) {
    case "send_message": {
      try {
        const result = await sendMessage({
          conversationId: config.conversation_id as string,
          siteId,
          senderType: (config.sender_type as "agent" | "system") || "system",
          senderId: (config.sender_id as string) || undefined,
          senderName: (config.sender_name as string) || "Automation",
          content: config.content as string,
          contentType: ((config.content_type as string) ||
            "text") as import("@/modules/live-chat/types").MessageContentType,
          isInternalNote: (config.is_internal as boolean) || false,
        });
        if (result.error) {
          return { status: "failed", error: result.error };
        }
        return {
          status: "completed",
          output: { message_id: result.message?.id, success: true },
        };
      } catch (error) {
        return {
          status: "failed",
          error:
            error instanceof Error ? error.message : "Failed to send message",
        };
      }
    }

    case "assign_conversation": {
      try {
        const result = await assignConversation(
          config.conversation_id as string,
          config.agent_id as string,
        );
        if (!result.success) {
          return {
            status: "failed",
            error: result.error || "Failed to assign conversation",
          };
        }
        return { status: "completed", output: { success: true } };
      } catch (error) {
        return {
          status: "failed",
          error:
            error instanceof Error
              ? error.message
              : "Failed to assign conversation",
        };
      }
    }

    case "resolve_conversation": {
      try {
        const result = await resolveConversation(
          config.conversation_id as string,
        );
        if (!result.success) {
          return {
            status: "failed",
            error: result.error || "Failed to resolve conversation",
          };
        }
        return { status: "completed", output: { success: true } };
      } catch (error) {
        return {
          status: "failed",
          error:
            error instanceof Error
              ? error.message
              : "Failed to resolve conversation",
        };
      }
    }

    case "close_conversation": {
      try {
        const result = await closeConversation(
          config.conversation_id as string,
        );
        if (!result.success) {
          return {
            status: "failed",
            error: result.error || "Failed to close conversation",
          };
        }
        return { status: "completed", output: { success: true } };
      } catch (error) {
        return {
          status: "failed",
          error:
            error instanceof Error
              ? error.message
              : "Failed to close conversation",
        };
      }
    }

    case "update_tags": {
      try {
        const result = await updateConversationTags(
          config.conversation_id as string,
          config.tags as string[],
        );
        if (!result.success) {
          return {
            status: "failed",
            error: result.error || "Failed to update tags",
          };
        }
        return {
          status: "completed",
          output: { success: true, tags: config.tags },
        };
      } catch (error) {
        return {
          status: "failed",
          error:
            error instanceof Error ? error.message : "Failed to update tags",
        };
      }
    }

    case "send_system_message": {
      try {
        const conversationId = config.conversation_id as string;
        const eventType = config.event_type as ChatMessageEventType;
        const customMessage = config.custom_message as string | undefined;
        const placeholders =
          (config.placeholders as Record<string, string>) || {};

        // Resolve the message from DB template or use hardcoded default
        const defaultMessage = customMessage || `System event: ${eventType}`;
        const resolvedMessage = await resolveChatMessage(
          siteId,
          eventType,
          placeholders,
          defaultMessage,
        );

        // If template was disabled by site owner, skip
        if (!resolvedMessage) {
          return {
            status: "completed",
            output: {
              success: true,
              skipped: true,
              reason: "template_disabled",
            },
          };
        }

        // Send the resolved message into the conversation
        const result = await sendMessage({
          conversationId,
          siteId,
          senderType: "system",
          senderName: "System",
          content: resolvedMessage,
          contentType:
            "text" as import("@/modules/live-chat/types").MessageContentType,
          isInternalNote: false,
        });

        if (result.error) {
          return { status: "failed", error: result.error };
        }
        return {
          status: "completed",
          output: {
            message_id: result.message?.id,
            resolved_message: resolvedMessage,
            success: true,
          },
        };
      } catch (error) {
        return {
          status: "failed",
          error:
            error instanceof Error
              ? error.message
              : "Failed to send system message",
        };
      }
    }

    default:
      return { status: "failed", error: `Unknown chat action: ${action}` };
  }
}

// ============================================================================
// EMAIL ACTIONS
// ============================================================================

async function executeEmailAction(
  action: string,
  config: Record<string, unknown>,
  context: ExecutionContext,
): Promise<ActionResult> {
  switch (action) {
    case "send": {
      try {
        if (!isEmailEnabled()) {
          return {
            status: "completed",
            output: { skipped: true, reason: "email_not_configured" },
          };
        }

        const siteId = context.execution?.siteId;
        const to = config.to as string;
        const toName = config.to_name as string | undefined;
        const subject = config.subject as string;
        const body = config.body as string;
        const fromName = config.from_name as string | undefined;

        if (!to) {
          return {
            status: "failed",
            error: "No recipient email resolved (check trigger variables)",
          };
        }
        if (!subject) {
          return { status: "failed", error: "Email subject is required" };
        }
        if (!body) {
          return { status: "failed", error: "Email body is required" };
        }

        // Build branded HTML wrapper
        let brandingFrom = fromName
          ? `${fromName} <noreply@${process.env.EMAIL_DOMAIN || "app.dramacagency.com"}>`
          : getEmailFrom();
        let brandingReplyTo = getEmailReplyTo();
        let html = wrapEmailBody(body, subject);

        // Resolve site → agency branding if available
        if (siteId) {
          try {
            const adminSupa = createAdminClient() as AutomationDB;
            const { data: site } = await adminSupa
              .from("sites")
              .select("agency_id")
              .eq("id", siteId)
              .single();

            if (site?.agency_id) {
              const agencyBranding = await getAgencyBranding(site.agency_id);
              const branding = buildEmailBranding(agencyBranding);

              if (branding.from_name) {
                brandingFrom = `${branding.from_name} <noreply@${process.env.EMAIL_DOMAIN || "app.dramacagency.com"}>`;
              }
              if (branding.reply_to) {
                brandingReplyTo = branding.reply_to;
              }

              html = wrapBrandedEmailBody(body, subject, branding);
            }
          } catch {
            // Non-fatal — send without branding
          }
        }

        const toFormatted = toName ? `${toName} <${to}>` : to;

        const { data: emailResult, error: emailError } =
          await resend.emails.send({
            from: brandingFrom,
            to: [toFormatted],
            replyTo: brandingReplyTo,
            subject,
            html,
            text: body.replace(/<[^>]+>/g, ""), // Strip HTML for text version
          });

        if (emailError) {
          return { status: "failed", error: emailError.message };
        }
        return {
          status: "completed",
          output: { success: true, message_id: emailResult?.id },
        };
      } catch (error) {
        return {
          status: "failed",
          error:
            error instanceof Error ? error.message : "Failed to send email",
        };
      }
    }

    case "send_template": {
      try {
        // For template emails, the type determines which template to use
        // Common automation templates might be 'welcome' or similar predefined ones
        const templateType = config.template_id as string;
        const validTypes = [
          "welcome",
          "password_reset",
          "email_changed",
          "team_invitation",
          "team_member_joined",
          "site_published",
          "domain_connected",
          "subscription_created",
          "payment_failed",
          "trial_ending",
        ];

        // Default to 'welcome' if template not recognized
        const emailType = validTypes.includes(templateType)
          ? templateType
          : "welcome";

        const result = await sendEmail({
          to: { email: config.to as string },
          type: emailType as Parameters<typeof sendEmail>[0]["type"],
          data: (config.variables as Record<string, unknown>) || {},
        });

        if (!result.success) {
          return {
            status: "failed",
            error: result.error || "Failed to send template email",
          };
        }
        return {
          status: "completed",
          output: { success: true, message_id: result.messageId },
        };
      } catch (error) {
        return {
          status: "failed",
          error:
            error instanceof Error
              ? error.message
              : "Failed to send template email",
        };
      }
    }

    case "send_branded_template": {
      try {
        const siteId = context.execution?.siteId;
        if (!siteId) {
          return {
            status: "failed",
            error: "Site ID not available in context",
          };
        }

        // Resolve the agency ID from the site
        const supabase = createAdminClient() as AutomationDB;
        const { data: site } = await supabase
          .from("sites")
          .select("agency_id")
          .eq("id", siteId)
          .single();

        if (!site?.agency_id) {
          return {
            status: "failed",
            error: "Could not resolve agency for site",
          };
        }

        const emailType = config.email_type as EmailType;
        const to = config.to as string;
        const toName = config.to_name as string | undefined;
        const data = (config.data as Record<string, unknown>) || {};

        if (!to) {
          return {
            status: "failed",
            error:
              "No recipient email resolved (check that {{trigger.ownerEmail}} or the 'to' field is available)",
          };
        }

        const result = await sendBrandedEmail(site.agency_id, {
          to: { email: to, name: toName },
          emailType,
          data,
          siteId,
        });

        if (!result.success) {
          return {
            status: "failed",
            error: result.error || "Failed to send branded email",
          };
        }
        return {
          status: "completed",
          output: { success: true, message_id: result.messageId },
        };
      } catch (error) {
        return {
          status: "failed",
          error:
            error instanceof Error
              ? error.message
              : "Failed to send branded email",
        };
      }
    }

    default:
      return { status: "failed", error: `Unknown email action: ${action}` };
  }
}

// ============================================================================
// EMAIL HTML WRAPPERS
// ============================================================================

/**
 * Wrap email body in a minimal responsive HTML template (no branding)
 */
function wrapEmailBody(body: string, _subject: string): string {
  const hasHtml = /<[a-z][\s\S]*>/i.test(body);
  const content = hasHtml ? body : body.replace(/\n/g, "<br>");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb"><div style="max-width:600px;margin:0 auto;padding:32px 24px;background:#ffffff">${content}</div></body></html>`;
}

/**
 * Wrap email body in a branded HTML template using the agency/site branding
 */
function wrapBrandedEmailBody(
  body: string,
  _subject: string,
  branding: {
    agency_name?: string;
    company_name?: string;
    primary_color?: string;
    logo_url?: string | null;
    from_name?: string;
  },
): string {
  const hasHtml = /<[a-z][\s\S]*>/i.test(body);
  const content = hasHtml ? body : body.replace(/\n/g, "<br>");
  const color = branding.primary_color || "#2563eb";
  const name = branding.agency_name || branding.company_name || branding.from_name || "";
  const logo = branding.logo_url
    ? `<img src="${branding.logo_url}" alt="${name}" style="max-height:48px;max-width:200px;margin-bottom:16px">`
    : "";
  const header =
    name || logo
      ? `<div style="text-align:center;padding:24px 0 16px;border-bottom:2px solid ${color}">${logo}${name && !logo ? `<h2 style="margin:0;color:${color};font-size:20px">${name}</h2>` : ""}</div>`
      : "";
  const footer = name
    ? `<div style="text-align:center;padding:16px 0 0;border-top:1px solid #e5e7eb;margin-top:24px;color:#6b7280;font-size:12px">&copy; ${new Date().getFullYear()} ${name}</div>`
    : "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb"><div style="max-width:600px;margin:0 auto;padding:0;background:#ffffff;border-radius:8px;overflow:hidden">${header}<div style="padding:24px">${content}</div>${footer}</div></body></html>`;
}

async function executeNotificationAction(
  action: string,
  config: Record<string, unknown>,
  context: ExecutionContext,
): Promise<ActionResult> {
  const supabase = createAdminClient() as AutomationDB;
  const siteId = context.execution?.siteId;

  switch (action) {
    case "in_app": {
      const { data, error } = await supabase
        .from("notifications")
        .insert({
          user_id: config.user_id,
          title: config.title,
          message: config.message,
          type: config.type || "info",
          link: config.link || null,
          read: false,
        })
        .select("id")
        .single();

      if (error) {
        return { status: "failed", error: error.message };
      }
      return { status: "completed", output: { notification_id: data.id } };
    }

    case "send_slack": {
      // Get Slack connection
      const { data: connection } = await supabase
        .from("automation_connections")
        .select("credentials")
        .eq("site_id", siteId)
        .eq("service_type", "slack")
        .eq("status", "active")
        .single();

      if (!connection) {
        return { status: "failed", error: "Slack connection not found" };
      }

      try {
        const webhookUrl = connection.credentials.webhook_url as string;
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channel: config.channel,
            text: config.message,
            blocks: config.blocks,
          }),
        });

        if (!response.ok) {
          return {
            status: "failed",
            error: `Slack API error: ${response.status}`,
          };
        }
        return { status: "completed", output: { success: true } };
      } catch (error) {
        return {
          status: "failed",
          error:
            error instanceof Error
              ? error.message
              : "Failed to send Slack message",
        };
      }
    }

    case "send_discord": {
      // Get Discord connection
      const { data: connection } = await supabase
        .from("automation_connections")
        .select("credentials")
        .eq("site_id", siteId)
        .eq("service_type", "discord")
        .eq("status", "active")
        .single();

      if (!connection) {
        return { status: "failed", error: "Discord connection not found" };
      }

      try {
        const webhookUrl = connection.credentials.webhook_url as string;
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: config.content,
            embeds: config.embeds,
          }),
        });

        if (!response.ok) {
          return {
            status: "failed",
            error: `Discord API error: ${response.status}`,
          };
        }
        return { status: "completed", output: { success: true } };
      } catch (error) {
        return {
          status: "failed",
          error:
            error instanceof Error
              ? error.message
              : "Failed to send Discord message",
        };
      }
    }

    case "send_sms": {
      // Get Twilio connection
      const { data: connection } = await supabase
        .from("automation_connections")
        .select("credentials")
        .eq("site_id", siteId)
        .eq("service_type", "twilio")
        .eq("status", "active")
        .single();

      if (!connection) {
        return { status: "failed", error: "Twilio connection not found" };
      }

      try {
        const accountSid = connection.credentials.account_sid as string;
        const authToken = connection.credentials.auth_token as string;
        const fromNumber = connection.credentials.from_number as string;

        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              To: config.to as string,
              From: fromNumber,
              Body: config.body as string,
            }),
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          return {
            status: "failed",
            error: `Twilio error: ${errorData.message}`,
          };
        }

        const data = await response.json();
        return {
          status: "completed",
          output: { message_sid: data.sid, success: true },
        };
      } catch (error) {
        return {
          status: "failed",
          error: error instanceof Error ? error.message : "Failed to send SMS",
        };
      }
    }

    case "in_app_targeted": {
      // Targeted in-app notification — resolves recipient by role within the site
      if (!siteId) {
        return { status: "failed", error: "Site ID not available in context" };
      }

      try {
        const targetRole = config.target_role as
          | "owner"
          | "agent"
          | "all"
          | undefined;
        const targetUserId = config.target_user_id as string | undefined;
        const title = config.title as string;
        const message = config.message as string;
        const type = (config.type as string) || "info";
        const link = (config.link as string) || null;

        let userIds: string[] = [];

        if (targetUserId) {
          userIds = [targetUserId];
        } else if (targetRole === "owner" || !targetRole) {
          // Resolve site owner via agency
          const { data: site } = await supabase
            .from("sites")
            .select("agency_id")
            .eq("id", siteId)
            .single();
          if (site?.agency_id) {
            const { data: agency } = await supabase
              .from("agencies")
              .select("owner_id")
              .eq("id", site.agency_id)
              .single();
            if (agency?.owner_id) userIds = [agency.owner_id];
          }
        } else if (targetRole === "agent") {
          // Get from trigger data if available (e.g. assigned agent)
          const triggerData = context.trigger as
            | Record<string, unknown>
            | undefined;
          const agentId = (triggerData?.agent_id ??
            triggerData?.assigned_agent_id) as string | undefined;
          if (agentId) userIds = [agentId];
        } else if (targetRole === "all") {
          // Notify all team members for this site's agency
          const { data: site } = await supabase
            .from("sites")
            .select("agency_id")
            .eq("id", siteId)
            .single();
          if (site?.agency_id) {
            const { data: members } = await supabase
              .from("agency_members")
              .select("user_id")
              .eq("agency_id", site.agency_id)
              .eq("status", "active");
            userIds = (members || []).map(
              (m: { user_id: string }) => m.user_id,
            );
          }
        }

        if (userIds.length === 0) {
          return {
            status: "completed",
            output: {
              success: true,
              notifications_sent: 0,
              reason: "no_recipients",
            },
          };
        }

        const notifications = userIds.map((uid) => ({
          user_id: uid,
          title,
          message,
          type,
          link,
          read: false,
        }));

        const { error } = await supabase
          .from("notifications")
          .insert(notifications);

        if (error) {
          return { status: "failed", error: error.message };
        }
        return {
          status: "completed",
          output: { success: true, notifications_sent: userIds.length },
        };
      } catch (error) {
        return {
          status: "failed",
          error:
            error instanceof Error
              ? error.message
              : "Failed to send targeted notification",
        };
      }
    }

    default:
      return {
        status: "failed",
        error: `Unknown notification action: ${action}`,
      };
  }
}

// ============================================================================
// WEBHOOK ACTIONS
// ============================================================================

async function executeWebhookAction(
  action: string,
  config: Record<string, unknown>,
): Promise<ActionResult> {
  switch (action) {
    case "send": {
      const url = config.url as string;
      const method = (config.method as string) || "POST";
      const headers = (config.headers as Record<string, string>) || {};
      const body = config.body;
      const timeout = (config.timeout_ms as number) || 30000;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        let responseBody: unknown;
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          try {
            responseBody = await response.json();
          } catch {
            responseBody = await response.text();
          }
        } else {
          responseBody = await response.text();
        }

        return {
          status: response.ok ? "completed" : "failed",
          output: {
            status_code: response.status,
            response_body: responseBody,
            success: response.ok,
          },
          error: response.ok ? undefined : `HTTP ${response.status}`,
        };
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return {
            status: "failed",
            error: `Request timed out after ${timeout}ms`,
          };
        }
        return {
          status: "failed",
          error:
            error instanceof Error ? error.message : "Webhook request failed",
        };
      }
    }

    default:
      return { status: "failed", error: `Unknown webhook action: ${action}` };
  }
}

// ============================================================================
// DATA ACTIONS
// ============================================================================

async function executeDataAction(
  action: string,
  config: Record<string, unknown>,
  context: ExecutionContext,
): Promise<ActionResult> {
  const supabase = createAdminClient() as AutomationDB;
  const siteId = context.execution?.siteId;

  const moduleName = config.module as string;
  const table = config.table as string;

  // Construct table name based on module
  let fullTableName = table;
  if (moduleName) {
    // Standard module table naming
    const modulePrefix = `mod_${moduleName.replace("-", "")}`;
    fullTableName = `${modulePrefix}_${table}`;
  }

  switch (action) {
    case "lookup": {
      const { data, error } = await supabase
        .from(fullTableName)
        .select("*")
        .eq("site_id", siteId)
        .eq(config.field as string, config.value)
        .maybeSingle();

      if (error) {
        return { status: "failed", error: error.message };
      }
      return { status: "completed", output: { record: data, found: !!data } };
    }

    case "create": {
      const { data, error } = await supabase
        .from(fullTableName)
        .insert({
          site_id: siteId,
          ...(config.data as Record<string, unknown>),
        })
        .select("*")
        .single();

      if (error) {
        return { status: "failed", error: error.message };
      }
      return { status: "completed", output: { record: data, id: data.id } };
    }

    case "update": {
      const { data, error } = await supabase
        .from(fullTableName)
        .update(config.data as Record<string, unknown>)
        .eq("id", config.id)
        .eq("site_id", siteId)
        .select("*")
        .single();

      if (error) {
        return { status: "failed", error: error.message };
      }
      return { status: "completed", output: { record: data, success: true } };
    }

    case "delete": {
      const { error } = await supabase
        .from(fullTableName)
        .delete()
        .eq("id", config.id)
        .eq("site_id", siteId);

      if (error) {
        return { status: "failed", error: error.message };
      }
      return { status: "completed", output: { success: true } };
    }

    default:
      return { status: "failed", error: `Unknown data action: ${action}` };
  }
}

// ============================================================================
// TRANSFORM ACTIONS
// ============================================================================

async function executeTransformAction(
  action: string,
  config: Record<string, unknown>,
): Promise<ActionResult> {
  switch (action) {
    case "map": {
      const source = config.source as Record<string, unknown>;
      const mapping = config.mapping as Record<string, string>;
      const result: Record<string, unknown> = {};

      for (const [targetKey, sourcePath] of Object.entries(mapping)) {
        result[targetKey] = getValueByPath(source, sourcePath);
      }

      return { status: "completed", output: { result } };
    }

    case "filter": {
      const array = config.array as unknown[];
      const conditions = config.conditions as Array<{
        field: string;
        operator: string;
        value: unknown;
      }>;

      const filtered = array.filter((item) => {
        return conditions.every((cond) => {
          const value = getValueByPath(
            item as Record<string, unknown>,
            cond.field,
          );
          return evaluateCondition(value, cond.operator, cond.value);
        });
      });

      return {
        status: "completed",
        output: { result: filtered, count: filtered.length },
      };
    }

    case "aggregate": {
      const array = config.array as unknown[];
      const operation = config.operation as string;
      const field = config.field as string | undefined;

      const values = field
        ? array.map((item) =>
            Number(getValueByPath(item as Record<string, unknown>, field)),
          )
        : array.map(Number);

      // Filter out NaN values
      const validValues = values.filter((v) => !isNaN(v));

      let result: number;
      switch (operation) {
        case "sum":
          result = validValues.reduce((a, b) => a + b, 0);
          break;
        case "average":
          result =
            validValues.length > 0
              ? validValues.reduce((a, b) => a + b, 0) / validValues.length
              : 0;
          break;
        case "count":
          result = validValues.length;
          break;
        case "min":
          result = validValues.length > 0 ? Math.min(...validValues) : 0;
          break;
        case "max":
          result = validValues.length > 0 ? Math.max(...validValues) : 0;
          break;
        default:
          result = 0;
      }

      return { status: "completed", output: { result } };
    }

    case "format_date": {
      const dateStr = config.date as string;
      const format = config.format as string;
      const timezone = config.timezone as string | undefined;

      try {
        const date = new Date(dateStr);
        // Simple format implementation (for production, use date-fns)
        const formatted = format
          .replace("YYYY", date.getFullYear().toString())
          .replace("MM", (date.getMonth() + 1).toString().padStart(2, "0"))
          .replace("DD", date.getDate().toString().padStart(2, "0"))
          .replace("HH", date.getHours().toString().padStart(2, "0"))
          .replace("mm", date.getMinutes().toString().padStart(2, "0"))
          .replace("ss", date.getSeconds().toString().padStart(2, "0"));

        // Timezone handling would require a proper library
        if (timezone) {
          // Placeholder - actual implementation needs Intl.DateTimeFormat or similar
        }

        return { status: "completed", output: { formatted } };
      } catch {
        return { status: "failed", error: "Invalid date format" };
      }
    }

    case "template": {
      const template = config.template as string;
      const variables = (config.variables as Record<string, unknown>) || {};

      // Simple template rendering with {{variable}} syntax
      const result = template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        const value = getValueByPath(variables, key.trim());
        if (value === undefined) return match;
        if (typeof value === "object") return JSON.stringify(value);
        return String(value);
      });

      return { status: "completed", output: { result } };
    }

    case "math": {
      const operation = config.operation as string;
      const a = Number(config.a);
      const b = config.b !== undefined ? Number(config.b) : undefined;

      let result: number;
      switch (operation) {
        case "add":
          result = a + (b ?? 0);
          break;
        case "subtract":
          result = a - (b ?? 0);
          break;
        case "multiply":
          result = a * (b ?? 1);
          break;
        case "divide":
          result = b && b !== 0 ? a / b : 0;
          break;
        case "round":
          result = Math.round(a);
          break;
        case "floor":
          result = Math.floor(a);
          break;
        case "ceil":
          result = Math.ceil(a);
          break;
        case "abs":
          result = Math.abs(a);
          break;
        default:
          result = a;
      }

      return { status: "completed", output: { result } };
    }

    default:
      return { status: "failed", error: `Unknown transform action: ${action}` };
  }
}

// ============================================================================
// FLOW CONTROL ACTIONS
// ============================================================================

async function executeFlowAction(
  action: string,
  config: Record<string, unknown>,
): Promise<ActionResult> {
  switch (action) {
    case "delay": {
      const duration = parseDuration(config.duration as string);
      const resumeAt = new Date(Date.now() + duration).toISOString();

      return {
        status: "paused",
        output: { resumed_at: resumeAt },
        resumeAt,
      };
    }

    case "stop": {
      return {
        status: "completed",
        output: { stopped: true, reason: config.reason || "Workflow stopped" },
      };
    }

    default:
      return { status: "failed", error: `Unknown flow action: ${action}` };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getValueByPath(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

function evaluateCondition(
  left: unknown,
  operator: string,
  right: unknown,
): boolean {
  switch (operator) {
    case "equals":
    case "eq":
      return left === right;
    case "not_equals":
    case "ne":
      return left !== right;
    case "contains":
      return typeof left === "string" && left.includes(String(right));
    case "greater_than":
    case "gt":
      return Number(left) > Number(right);
    case "less_than":
    case "lt":
      return Number(left) < Number(right);
    case "gte":
      return Number(left) >= Number(right);
    case "lte":
      return Number(left) <= Number(right);
    default:
      return false;
  }
}

function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhdw])$/);
  if (!match) return 5 * 60 * 1000; // Default 5 minutes

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    case "w":
      return value * 7 * 24 * 60 * 60 * 1000;
    default:
      return 5 * 60 * 1000;
  }
}
