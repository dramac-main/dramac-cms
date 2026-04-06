/**
 * Chat Message Template Resolver
 *
 * Phase MSG-TEMPLATES: Allows site owners to customize proactive AI chat messages.
 *
 * Resolution order:
 * 1. Check DB for site-owner customized message template
 * 2. If found and enabled → substitute {{variables}} and return
 * 3. If not found or disabled → return the hardcoded default message
 *
 * Chat message event types map to the proactive messages in chat-event-bridge.ts.
 */

import { createAdminClient } from "@/lib/supabase/admin";

/** All chat message event types that can be customized */
export type ChatMessageEventType =
  // Payment events
  | "payment_proof_uploaded"
  | "payment_confirmed"
  // Order status events
  | "order_confirmed"
  | "order_processing"
  | "order_shipped"
  | "order_delivered"
  | "order_cancelled"
  | "order_refunded"
  | "order_status_generic"
  // Quote events
  | "quote_converted"
  | "quote_requested"
  | "quote_sent"
  | "quote_accepted"
  | "quote_rejected"
  | "quote_amendment_requested"
  // Booking events
  | "booking_created"
  | "booking_confirmed"
  | "booking_cancelled"
  | "booking_rescheduled"
  | "booking_completed"
  | "booking_payment_confirmed";

export interface ChatMessageTemplateConfig {
  label: string;
  description: string;
  defaultMessage: string;
  variables: { key: string; label: string; example: string }[];
}

/** Registry of all chat message event types with defaults and variable info */
export const CHAT_MESSAGE_TEMPLATE_CONFIGS: Record<
  ChatMessageEventType,
  ChatMessageTemplateConfig
> = {
  // Payment events
  payment_proof_uploaded: {
    label: "Payment Proof Uploaded",
    description: "Sent when customer uploads payment proof",
    defaultMessage:
      "Great news! I can see that you've uploaded your payment proof ({{file_name}}) for order {{order_number}}. The store owner will now review it and verify your payment. This usually takes a short while — I'll keep you updated on the progress! 😊",
    variables: [
      { key: "order_number", label: "Order Number", example: "ORD-001" },
      { key: "file_name", label: "File Name", example: "receipt.jpg" },
    ],
  },
  payment_confirmed: {
    label: "Payment Confirmed",
    description: "Sent when payment is verified/confirmed",
    defaultMessage:
      "Your payment for order {{order_number}} ({{total}}) has been confirmed! 🎉 Your order is now confirmed and being prepared. You'll receive updates as it progresses through shipping and delivery.",
    variables: [
      { key: "order_number", label: "Order Number", example: "ORD-001" },
      { key: "total", label: "Order Total", example: "K 1,250.00" },
    ],
  },

  // Order status events
  order_confirmed: {
    label: "Order Confirmed",
    description: "Sent when order status changes to confirmed",
    defaultMessage:
      "Your order {{order_number}} has been confirmed and is being prepared! ✅",
    variables: [
      { key: "order_number", label: "Order Number", example: "ORD-001" },
    ],
  },
  order_processing: {
    label: "Order Processing",
    description: "Sent when order is being processed",
    defaultMessage:
      "Your order {{order_number}} is now being processed. We're getting it ready for you! 📦",
    variables: [
      { key: "order_number", label: "Order Number", example: "ORD-001" },
    ],
  },
  order_shipped: {
    label: "Order Shipped",
    description: "Sent when order is shipped",
    defaultMessage:
      "Your order {{order_number}} has been shipped! 🚚 It's on its way to you. You can check your order page for tracking details.",
    variables: [
      { key: "order_number", label: "Order Number", example: "ORD-001" },
    ],
  },
  order_delivered: {
    label: "Order Delivered",
    description: "Sent when order is delivered",
    defaultMessage:
      "Your order {{order_number}} has been delivered! 🎉 We hope you love your purchase. If you have any questions, feel free to ask!",
    variables: [
      { key: "order_number", label: "Order Number", example: "ORD-001" },
    ],
  },
  order_cancelled: {
    label: "Order Cancelled",
    description: "Sent when order is cancelled",
    defaultMessage:
      "Your order {{order_number}} has been cancelled. If you didn't request this or have any questions, please let us know.",
    variables: [
      { key: "order_number", label: "Order Number", example: "ORD-001" },
    ],
  },
  order_refunded: {
    label: "Order Refunded",
    description: "Sent when a refund is processed",
    defaultMessage:
      "A refund has been processed for order {{order_number}}. It may take a few business days to appear in your account.",
    variables: [
      { key: "order_number", label: "Order Number", example: "ORD-001" },
    ],
  },
  order_status_generic: {
    label: "Order Status Update (Generic)",
    description: "Fallback for unrecognized order status changes",
    defaultMessage:
      "Your order {{order_number}} status has been updated to: {{status}}.",
    variables: [
      { key: "order_number", label: "Order Number", example: "ORD-001" },
      { key: "status", label: "New Status", example: "processing" },
    ],
  },

  // Quote events
  quote_converted: {
    label: "Quote Converted to Order",
    description: "Sent when a quote is converted to an order",
    defaultMessage:
      "Your quotation {{quote_number}} has been converted to order {{order_number}} ({{total}})! You can now proceed with payment. Would you like me to guide you through the payment process?",
    variables: [
      { key: "quote_number", label: "Quote Number", example: "QT-001" },
      { key: "order_number", label: "Order Number", example: "ORD-001" },
      { key: "total", label: "Total", example: "K 5,000.00" },
    ],
  },
  quote_requested: {
    label: "Quote Requested",
    description: "Sent when customer submits a quote request",
    defaultMessage:
      "Quote {{quote_number}} received! ✅ Our team will review your {{item_count}} item(s) and email you when it's ready.",
    variables: [
      { key: "quote_number", label: "Quote Number", example: "QT-001" },
      { key: "item_count", label: "Item Count", example: "3" },
    ],
  },
  quote_sent: {
    label: "Quote Ready",
    description: "Sent when the store sends a quote to the customer",
    defaultMessage:
      "Your quote {{quote_number}} is ready ({{total}})! 🎉 Check your email to review and respond.{{portal_link}}",
    variables: [
      { key: "quote_number", label: "Quote Number", example: "QT-001" },
      { key: "total", label: "Quote Total", example: "K 5,000.00" },
      {
        key: "portal_link",
        label: "Portal Link (optional)",
        example: " View it here: https://...",
      },
    ],
  },
  quote_accepted: {
    label: "Quote Accepted",
    description: "Sent when customer accepts a quote",
    defaultMessage:
      "Quote {{quote_number}} accepted ({{total}})! ✅ The store will process your order shortly.",
    variables: [
      { key: "quote_number", label: "Quote Number", example: "QT-001" },
      { key: "total", label: "Quote Total", example: "K 5,000.00" },
    ],
  },
  quote_rejected: {
    label: "Quote Rejected",
    description: "Sent when customer rejects a quote",
    defaultMessage:
      "Quote {{quote_number}} declined.{{reason}} Let me know if you'd like a revised quote.",
    variables: [
      { key: "quote_number", label: "Quote Number", example: "QT-001" },
      {
        key: "reason",
        label: "Reason (optional)",
        example: ' Reason: "Too expensive".',
      },
    ],
  },
  quote_amendment_requested: {
    label: "Quote Amendment Requested",
    description: "Sent when customer requests changes to a quote",
    defaultMessage:
      "Your change request for {{quote_number}} has been submitted! ✅ We'll review your notes and send an updated quote.",
    variables: [
      { key: "quote_number", label: "Quote Number", example: "QT-001" },
    ],
  },

  // Booking events
  booking_created: {
    label: "Booking Created",
    description: "Sent when a new booking is placed",
    defaultMessage:
      "Your booking for {{service_name}} on {{date}} at {{time}} has been received! 📅 You'll be notified once it's confirmed.",
    variables: [
      {
        key: "service_name",
        label: "Service Name",
        example: "Deep Tissue Massage",
      },
      { key: "date", label: "Date", example: "15 Jan 2026" },
      { key: "time", label: "Time", example: "10:00 AM" },
    ],
  },
  booking_confirmed: {
    label: "Booking Confirmed",
    description: "Sent when booking is confirmed",
    defaultMessage:
      "Great news — your booking for {{service_name}} on {{date}} at {{time}} is confirmed! ✅ We look forward to seeing you.",
    variables: [
      {
        key: "service_name",
        label: "Service Name",
        example: "Deep Tissue Massage",
      },
      { key: "date", label: "Date", example: "15 Jan 2026" },
      { key: "time", label: "Time", example: "10:00 AM" },
    ],
  },
  booking_cancelled: {
    label: "Booking Cancelled",
    description: "Sent when booking is cancelled",
    defaultMessage:
      "Your booking for {{service_name}} has been cancelled.{{reason}} If you'd like to reschedule, just let me know!",
    variables: [
      {
        key: "service_name",
        label: "Service Name",
        example: "Deep Tissue Massage",
      },
      {
        key: "reason",
        label: "Reason (optional)",
        example: ' Reason: "Schedule conflict".',
      },
    ],
  },
  booking_rescheduled: {
    label: "Booking Rescheduled",
    description: "Sent when booking is moved to a new date/time",
    defaultMessage:
      "Your booking for {{service_name}} has been rescheduled to {{new_date}} at {{new_time}}. 🔄 Let me know if this works for you!",
    variables: [
      {
        key: "service_name",
        label: "Service Name",
        example: "Deep Tissue Massage",
      },
      { key: "new_date", label: "New Date", example: "20 Jan 2026" },
      { key: "new_time", label: "New Time", example: "2:00 PM" },
    ],
  },
  booking_completed: {
    label: "Booking Completed",
    description: "Sent when booking is marked complete",
    defaultMessage:
      "Your booking for {{service_name}} is complete! 🎉 Thank you for choosing us. We'd love to hear your feedback — feel free to share!",
    variables: [
      {
        key: "service_name",
        label: "Service Name",
        example: "Deep Tissue Massage",
      },
    ],
  },
  booking_payment_confirmed: {
    label: "Booking Payment Confirmed",
    description: "Sent when booking payment is confirmed",
    defaultMessage:
      "Payment of {{amount}} for your {{service_name}} booking has been confirmed! 💳 Thank you.",
    variables: [
      { key: "amount", label: "Payment Amount", example: "K 250.00" },
      {
        key: "service_name",
        label: "Service Name",
        example: "Deep Tissue Massage",
      },
    ],
  },
};

// In-memory cache for chat message templates. TTL = 2 minutes.
const chatTemplateCache = new Map<
  string,
  {
    templates: Map<string, { message_template: string; enabled: boolean }>;
    expiry: number;
  }
>();
const CHAT_TEMPLATE_CACHE_TTL = 2 * 60 * 1000;

/**
 * Fetch all chat message templates for a site from the database.
 */
async function fetchChatTemplates(
  siteId: string,
): Promise<Map<string, { message_template: string; enabled: boolean }>> {
  const cached = chatTemplateCache.get(siteId);
  if (cached && cached.expiry > Date.now()) {
    return cached.templates;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    const { data, error } = await supabase
      .from("mod_chat_message_templates")
      .select("event_type, message_template, enabled")
      .eq("site_id", siteId);

    const map = new Map<
      string,
      { message_template: string; enabled: boolean }
    >();
    if (!error && data) {
      for (const row of data) {
        map.set(row.event_type, {
          message_template: row.message_template,
          enabled: row.enabled,
        });
      }
    }

    chatTemplateCache.set(siteId, {
      templates: map,
      expiry: Date.now() + CHAT_TEMPLATE_CACHE_TTL,
    });
    return map;
  } catch {
    return new Map();
  }
}

/**
 * Substitute {{variable}} placeholders in a message template.
 */
function substituteVars(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    return vars[key] !== undefined ? vars[key] : match;
  });
}

/**
 * Resolve a chat message for a given event type.
 *
 * Checks the DB for a site-owner customization. If found and enabled,
 * substitutes variables and returns it. Otherwise returns the default
 * hardcoded message.
 *
 * @param siteId - The site to resolve for
 * @param eventType - The chat event type
 * @param vars - Variable values to substitute
 * @param defaultMessage - The hardcoded fallback message (already assembled)
 * @returns The resolved message string, or null if the template is disabled
 */
export async function resolveChatMessage(
  siteId: string,
  eventType: ChatMessageEventType,
  vars: Record<string, string>,
  defaultMessage: string,
): Promise<string | null> {
  const templates = await fetchChatTemplates(siteId);
  const custom = templates.get(eventType);

  if (custom) {
    // Template exists in DB
    if (!custom.enabled) {
      // Site owner disabled this message type
      return null;
    }
    // Use custom template with variable substitution
    return substituteVars(custom.message_template, vars);
  }

  // No custom template — use the default
  return defaultMessage;
}

/**
 * Invalidate the chat template cache for a site.
 */
export function invalidateChatTemplateCache(siteId: string): void {
  chatTemplateCache.delete(siteId);
}
