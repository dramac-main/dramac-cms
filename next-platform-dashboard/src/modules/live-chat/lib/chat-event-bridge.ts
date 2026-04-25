/**
 * Chat Event Bridge
 *
 * Sends proactive AI/system messages into active chat conversations when
 * external events happen (payment proof uploaded, order status changed,
 * quote accepted, etc.).
 *
 * Used by ecommerce actions to keep the customer informed in real-time
 * through their active chat session.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import {
  resolveChatMessage,
  type ChatMessageEventType,
} from "./chat-template-resolver";

// =============================================================================
// FIND ACTIVE CONVERSATION
// =============================================================================

/**
 * Find the most recent active/open chat conversation for a customer (by email)
 * on a given site. Returns null if no open conversation exists.
 */
export async function findActiveConversation(
  siteId: string,
  customerEmail: string,
): Promise<{
  conversationId: string;
  visitorId: string;
  assistantName: string;
} | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  // Find visitor by email
  const { data: visitor } = await supabase
    .from("mod_chat_visitors")
    .select("id")
    .eq("site_id", siteId)
    .eq("email", customerEmail)
    .limit(1)
    .single();

  if (!visitor) return null;

  // Find most recent open/active conversation for this visitor
  const { data: conversation } = await supabase
    .from("mod_chat_conversations")
    .select("id")
    .eq("site_id", siteId)
    .eq("visitor_id", visitor.id)
    .in("status", ["active", "open", "waiting", "pending"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!conversation) return null;

  // Get assistant name from settings
  const { data: settings } = await supabase
    .from("mod_chat_widget_settings")
    .select("ai_assistant_name")
    .eq("site_id", siteId)
    .single();

  return {
    conversationId: conversation.id,
    visitorId: visitor.id,
    assistantName: settings?.ai_assistant_name || "Chiko",
  };
}

// =============================================================================
// SEND PROACTIVE MESSAGE
// =============================================================================

/**
 * Insert a proactive AI message into an active conversation.
 * The message appears in real-time via Supabase Realtime subscriptions.
 *
 * When `pendingApproval` is true the message is inserted as an internal note
 * (hidden from the customer) with `metadata.pending_agent_approval = true`.
 * An agent must approve it before the customer can see it.
 */
export async function sendProactiveMessage(
  siteId: string,
  conversationId: string,
  message: string,
  assistantName: string,
  options: { pendingApproval?: boolean } = {},
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  const isStaged = options.pendingApproval === true;

  const { error } = await supabase.from("mod_chat_messages").insert({
    conversation_id: conversationId,
    site_id: siteId,
    sender_type: "ai",
    sender_name: assistantName,
    content: message,
    content_type: "text",
    status: isStaged ? "pending_approval" : "sent",
    is_ai_generated: true,
    ai_confidence: 1.0,
    is_internal_note: isStaged, // hidden from customer until approved
    metadata: isStaged ? { pending_agent_approval: true } : {},
  });

  if (error) {
    console.error("[ChatEventBridge] Failed to send proactive message:", error);
    return false;
  }

  // Only update conversation last_message_text when message is visible to customer.
  // Staged (pending_approval) messages are internal notes — skip last_message update.
  if (!isStaged) {
    await supabase
      .from("mod_chat_conversations")
      .update({
        last_message_text: message.substring(0, 255),
        last_message_at: new Date().toISOString(),
        last_message_by: "ai",
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId);
  }

  console.log(
    `[ChatEventBridge] Proactive message ${isStaged ? "staged for approval" : "sent"} to conversation:`,
    conversationId,
  );
  return true;
}

// =============================================================================
// AUTO-CREATE CONVERSATION FOR ENTITIES (Orders / Bookings)
// =============================================================================

/**
 * Entity context passed when auto-creating a conversation server-side.
 */
export interface EntityConversationContext {
  /** The entity type: order, booking, or quote */
  entityType: "order" | "booking" | "quote";
  /** Customer info */
  customerName: string;
  customerEmail: string;
  /** Order-specific */
  orderNumber?: string;
  orderTotal?: string;
  paymentStatus?: string;
  paymentProvider?: string;
  /** Booking-specific */
  bookingId?: string;
  serviceName?: string;
  bookingDate?: string;
  bookingTime?: string;
  bookingStatus?: string;
  paymentAmount?: string;
  currency?: string;
  /** Quote-specific */
  quoteNumber?: string;
}

/**
 * Auto-create (or find existing) chat conversation for an order or booking.
 * Called from server actions after entity creation — ensures a conversation
 * exists before the customer even opens the chat widget.
 *
 * Returns the conversationId, or null if creation failed.
 */
export async function createConversationForEntity(
  siteId: string,
  ctx: EntityConversationContext,
): Promise<string | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  try {
    // 1. Find or create visitor by email
    let visitorId: string;
    const { data: existingVisitor } = await supabase
      .from("mod_chat_visitors")
      .select("id")
      .eq("site_id", siteId)
      .eq("email", ctx.customerEmail)
      .limit(1)
      .single();

    if (existingVisitor) {
      visitorId = existingVisitor.id;
    } else {
      const { data: newVisitor, error: visitorErr } = await supabase
        .from("mod_chat_visitors")
        .insert({
          site_id: siteId,
          name: ctx.customerName,
          email: ctx.customerEmail,
          first_seen_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
          total_conversations: 0,
          total_messages: 0,
        })
        .select("id")
        .single();

      if (visitorErr || !newVisitor) {
        console.error(
          "[ChatEventBridge] Failed to create visitor:",
          visitorErr,
        );
        return null;
      }
      visitorId = newVisitor.id;
    }

    // 2. Check for existing active conversation with this entity
    let existingConvId: string | null = null;

    if (ctx.entityType === "order" && ctx.orderNumber) {
      const { data: conversations } = await supabase
        .from("mod_chat_conversations")
        .select("id, metadata")
        .eq("site_id", siteId)
        .eq("visitor_id", visitorId)
        .in("status", ["active", "open", "waiting", "pending"])
        .order("created_at", { ascending: false });

      existingConvId =
        conversations?.find(
          (c: { metadata: Record<string, unknown> }) =>
            c.metadata?.order_number === ctx.orderNumber,
        )?.id || null;
    } else if (ctx.entityType === "booking" && ctx.bookingId) {
      const { data: conversations } = await supabase
        .from("mod_chat_conversations")
        .select("id, metadata")
        .eq("site_id", siteId)
        .eq("visitor_id", visitorId)
        .in("status", ["active", "open", "waiting", "pending"])
        .order("created_at", { ascending: false });

      existingConvId =
        conversations?.find(
          (c: { metadata: Record<string, unknown> }) =>
            c.metadata?.booking_id === ctx.bookingId,
        )?.id || null;
    }

    if (existingConvId) {
      console.log(
        `[ChatEventBridge] Reusing existing conversation ${existingConvId} for ${ctx.entityType}`,
      );
      return existingConvId;
    }

    // 3. Build metadata based on entity type
    let metadata: Record<string, unknown> = {};
    let subject = "";
    let tags: string[] = [];

    if (ctx.entityType === "order") {
      metadata = {
        order_number: ctx.orderNumber,
        payment_guidance_active:
          ctx.paymentStatus === "pending" &&
          (!ctx.paymentProvider ||
            ctx.paymentProvider === "manual" ||
            ctx.paymentProvider === "bank_transfer"),
      };
      subject = `Order ${ctx.orderNumber}`;
      tags = ["order", "payment"];
    } else if (ctx.entityType === "booking") {
      const paymentRequired =
        ctx.paymentAmount && parseFloat(ctx.paymentAmount) > 0;
      metadata = {
        booking_id: ctx.bookingId,
        booking_guidance_active: true,
        service_name: ctx.serviceName || null,
        booking_date: ctx.bookingDate || null,
        booking_time: ctx.bookingTime || null,
        booking_status: ctx.bookingStatus || "pending",
        payment_guidance_active:
          paymentRequired && ctx.paymentStatus === "pending",
        payment_amount: ctx.paymentAmount || null,
        currency: ctx.currency || null,
      };
      subject = `Booking: ${ctx.serviceName || "Appointment"}`;
      tags = paymentRequired ? ["booking", "payment"] : ["booking"];
    }

    // 4. Create conversation
    const { data: conversation, error: convErr } = await supabase
      .from("mod_chat_conversations")
      .insert({
        site_id: siteId,
        visitor_id: visitorId,
        status: "active",
        priority: "normal",
        subject,
        tags,
        metadata,
        source: "system",
        last_message_at: new Date().toISOString(),
        last_message_by: "system",
        last_message_text: "Conversation started automatically",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (convErr || !conversation) {
      console.error(
        "[ChatEventBridge] Failed to create conversation:",
        convErr,
      );
      return null;
    }

    // 5. Update visitor conversation count
    await supabase
      .rpc("increment_field", {
        table_name: "mod_chat_visitors",
        field_name: "total_conversations",
        row_id: visitorId,
        increment_by: 1,
      })
      .catch(() => {
        // RPC may not exist — try direct update
        supabase
          .from("mod_chat_visitors")
          .update({
            total_conversations:
              (existingVisitor?.total_conversations || 0) + 1,
            last_seen_at: new Date().toISOString(),
          })
          .eq("id", visitorId)
          .then(() => {});
      });

    // 6. Auto-assign to available agent
    const { data: agents } = await supabase
      .from("mod_chat_agents")
      .select(
        "id, user_id, display_name, current_chat_count, max_concurrent_chats",
      )
      .eq("site_id", siteId)
      .eq("is_active", true)
      .eq("status", "online")
      .order("current_chat_count", { ascending: true });

    const availableAgent = (agents || []).find(
      (a: { current_chat_count: number; max_concurrent_chats: number }) =>
        a.current_chat_count < (a.max_concurrent_chats || 5),
    );

    if (availableAgent) {
      await supabase
        .from("mod_chat_conversations")
        .update({
          assigned_agent_id: availableAgent.id,
          status: "active",
        })
        .eq("id", conversation.id);

      // Increment agent chat count
      await supabase
        .from("mod_chat_agents")
        .update({
          current_chat_count: (availableAgent.current_chat_count || 0) + 1,
        })
        .eq("id", availableAgent.id);
    }

    // 7. Send initial greeting message
    const { data: settings } = await supabase
      .from("mod_chat_widget_settings")
      .select("ai_assistant_name, company_name")
      .eq("site_id", siteId)
      .single();
    const assistantName = settings?.ai_assistant_name || "Chiko";
    const companyName = settings?.company_name || "our team";

    let greeting: string;
    if (ctx.entityType === "order") {
      const isManualPayment =
        !ctx.paymentProvider ||
        ctx.paymentProvider === "manual" ||
        ctx.paymentProvider === "bank_transfer";
      greeting =
        ctx.paymentStatus === "pending" && isManualPayment
          ? `Hi ${ctx.customerName}! 👋 Thank you for your order ${ctx.orderNumber} (${ctx.orderTotal}). ` +
            `I'm here to help you complete your payment. Let me show you the available payment options!`
          : `Hi ${ctx.customerName}! 👋 Thank you for placing your order ${ctx.orderNumber} with ${companyName}. ` +
            `I'm here if you have any questions about your order!`;
    } else {
      const paymentRequired =
        ctx.paymentAmount && parseFloat(ctx.paymentAmount) > 0;
      greeting =
        paymentRequired && ctx.paymentStatus === "pending"
          ? `Hi ${ctx.customerName}! 👋 Thank you for booking ${ctx.serviceName}` +
            `${ctx.bookingDate ? ` on ${ctx.bookingDate}` : ""}${ctx.bookingTime ? ` at ${ctx.bookingTime}` : ""}. ` +
            `A payment of ${ctx.currency || ""} ${ctx.paymentAmount} is required to confirm your booking. ` +
            `I'll help you complete the payment — let me show you the available options!`
          : `Hi ${ctx.customerName}! 👋 Your booking for ${ctx.serviceName}` +
            `${ctx.bookingDate ? ` on ${ctx.bookingDate}` : ""}${ctx.bookingTime ? ` at ${ctx.bookingTime}` : ""} ` +
            `has been received! I'm here if you have any questions. 😊`;
    }

    await supabase.from("mod_chat_messages").insert({
      conversation_id: conversation.id,
      site_id: siteId,
      sender_type: "ai",
      sender_name: assistantName,
      content: greeting,
      content_type: "text",
      status: "sent",
      is_ai_generated: true,
      ai_confidence: 1.0,
      is_internal_note: false,
    });

    // Update last message
    await supabase
      .from("mod_chat_conversations")
      .update({
        last_message_text: greeting.substring(0, 255),
        last_message_at: new Date().toISOString(),
        last_message_by: "ai",
      })
      .eq("id", conversation.id);

    // 8. Notify agent(s) / owner — previously this was SILENT.
    // A chat conversation was auto-created but no one was told. Now we fire:
    //   a) in-app notification (bell) to the assigned agent OR site owner
    //   b) web push (OS/browser popup) so agents are alerted even when the tab is closed
    // Fire-and-forget so we never block the booking/order flow.
    (async () => {
      try {
        const { notifyNewChatMessage } = await import("./chat-notifications");
        await notifyNewChatMessage({
          siteId,
          conversationId: conversation.id,
          visitorName: ctx.customerName,
          messageText: greeting,
          agentUserId: availableAgent?.user_id || undefined,
        });
      } catch (err) {
        console.error(
          "[ChatEventBridge] notifyNewChatMessage (create) failed:",
          err,
        );
      }

      try {
        const { sendPushToUser, sendPushToSiteAgents } =
          await import("@/lib/actions/web-push");
        const pushPayload = {
          title: `New chat from ${ctx.customerName}`,
          body:
            ctx.entityType === "order"
              ? `Order ${ctx.orderNumber} — ${ctx.orderTotal || ""}`
              : `Booking: ${ctx.serviceName || "Appointment"}`,
          tag: `chat-${conversation.id}`,
          type: "chat" as const,
          conversationId: conversation.id,
          url: `/dashboard/sites/${siteId}/live-chat/conversations/${conversation.id}`,
          renotify: true,
        };
        if (availableAgent?.user_id) {
          await sendPushToUser(availableAgent.user_id, pushPayload);
        } else {
          await sendPushToSiteAgents(siteId, pushPayload);
        }
      } catch (err) {
        console.error("[ChatEventBridge] web push (create conv) failed:", err);
      }
    })();

    console.log(
      `[ChatEventBridge] Auto-created conversation ${conversation.id} for ${ctx.entityType} (${ctx.entityType === "order" ? ctx.orderNumber : ctx.bookingId})`,
    );
    return conversation.id;
  } catch (err) {
    console.error("[ChatEventBridge] createConversationForEntity error:", err);
    return null;
  }
}

// =============================================================================
// BOOKING PAYMENT-SPECIFIC NOTIFICATIONS
// =============================================================================

/**
 * Notify chat when booking payment proof has been uploaded.
 */
export async function notifyChatBookingPaymentProofUploaded(
  siteId: string,
  customerEmail: string,
  serviceName: string,
  fileName: string,
): Promise<void> {
  const conv = await findActiveConversation(siteId, customerEmail);
  if (!conv) return;

  const defaultMessage =
    `I can see you've uploaded your payment proof (${fileName}) for your ${serviceName} booking. ` +
    `The store owner will review it and verify your payment. ` +
    `This usually takes a short while — I'll keep you updated! 😊`;

  const message = await resolveChatMessage(
    siteId,
    "booking_payment_proof_uploaded" as ChatMessageEventType,
    { service_name: serviceName, file_name: fileName },
    defaultMessage,
  );
  if (!message) return;

  await sendProactiveMessage(
    siteId,
    conv.conversationId,
    message,
    conv.assistantName,
    { pendingApproval: true },
  );
}

/**
 * Notify chat when booking payment proof has been rejected.
 */
export async function notifyChatBookingPaymentRejected(
  siteId: string,
  customerEmail: string,
  serviceName: string,
  reason?: string,
): Promise<void> {
  const conv = await findActiveConversation(siteId, customerEmail);
  if (!conv) return;

  const reasonPart = reason ? ` Reason: ${reason}.` : "";
  const defaultMessage =
    `Your payment proof for the ${serviceName} booking could not be verified.${reasonPart} ` +
    `Please upload a new proof of payment or contact us for assistance.`;

  const message = await resolveChatMessage(
    siteId,
    "booking_payment_rejected" as ChatMessageEventType,
    { service_name: serviceName, reason: reasonPart },
    defaultMessage,
  );
  if (!message) return;

  await sendProactiveMessage(
    siteId,
    conv.conversationId,
    message,
    conv.assistantName,
    { pendingApproval: true },
  );
}

// =============================================================================
// EVENT-SPECIFIC MESSAGES
// =============================================================================

/**
 * Notify chat when customer uploads payment proof.
 */
export async function notifyChatPaymentProofUploaded(
  siteId: string,
  customerEmail: string,
  orderNumber: string,
  fileName: string,
): Promise<void> {
  const conv = await findActiveConversation(siteId, customerEmail);
  if (!conv) return;

  const defaultMessage =
    `Great news! I can see that you've uploaded your payment proof (${fileName}) for order ${orderNumber}. ` +
    `The store owner will now review it and verify your payment. ` +
    `This usually takes a short while — I'll keep you updated on the progress! 😊`;

  const message = await resolveChatMessage(
    siteId,
    "payment_proof_uploaded",
    { order_number: orderNumber, file_name: fileName },
    defaultMessage,
  );
  if (!message) return;

  await sendProactiveMessage(
    siteId,
    conv.conversationId,
    message,
    conv.assistantName,
    { pendingApproval: true },
  );
}

/**
 * Notify chat when payment is confirmed (status changed to "paid").
 */
export async function notifyChatPaymentConfirmed(
  siteId: string,
  customerEmail: string,
  orderNumber: string,
  total: string,
): Promise<void> {
  const conv = await findActiveConversation(siteId, customerEmail);
  if (!conv) return;

  const defaultMessage =
    `Your payment for order ${orderNumber} (${total}) has been confirmed! 🎉 ` +
    `Your order is now confirmed and being prepared. You'll receive updates as it progresses through shipping and delivery.`;

  const message = await resolveChatMessage(
    siteId,
    "payment_confirmed",
    { order_number: orderNumber, total },
    defaultMessage,
  );
  if (!message) return;

  await sendProactiveMessage(
    siteId,
    conv.conversationId,
    message,
    conv.assistantName,
    { pendingApproval: true },
  );
}

/**
 * Notify chat when order status changes.
 */
export async function notifyChatOrderStatusChanged(
  siteId: string,
  customerEmail: string,
  orderNumber: string,
  newStatus: string,
): Promise<void> {
  const conv = await findActiveConversation(siteId, customerEmail);
  if (!conv) return;

  const statusMessages: Record<string, string> = {
    confirmed: `Your order ${orderNumber} has been confirmed and is being prepared! ✅`,
    processing: `Your order ${orderNumber} is now being processed. We're getting it ready for you! 📦`,
    shipped: `Your order ${orderNumber} has been shipped! 🚚 It's on its way to you. You can check your order page for tracking details.`,
    delivered: `Your order ${orderNumber} has been delivered! 🎉 We hope you love your purchase. If you have any questions, feel free to ask!`,
    cancelled: `Your order ${orderNumber} has been cancelled. If you didn't request this or have any questions, please let us know.`,
    refunded: `A refund has been processed for order ${orderNumber}. It may take a few business days to appear in your account.`,
  };

  const statusToEventType: Record<string, ChatMessageEventType> = {
    confirmed: "order_confirmed",
    processing: "order_processing",
    shipped: "order_shipped",
    delivered: "order_delivered",
    cancelled: "order_cancelled",
    refunded: "order_refunded",
  };

  const defaultMessage =
    statusMessages[newStatus] ||
    `Your order ${orderNumber} status has been updated to: ${newStatus}.`;
  const eventType: ChatMessageEventType =
    statusToEventType[newStatus] || "order_status_generic";

  const message = await resolveChatMessage(
    siteId,
    eventType,
    { order_number: orderNumber, status: newStatus },
    defaultMessage,
  );
  if (!message) return;

  await sendProactiveMessage(
    siteId,
    conv.conversationId,
    message,
    conv.assistantName,
    { pendingApproval: true },
  );
}

/**
 * Notify chat when a quote is converted to an order.
 */
export async function notifyChatQuoteConverted(
  siteId: string,
  customerEmail: string,
  quoteNumber: string,
  orderNumber: string,
  total: string,
): Promise<void> {
  const conv = await findActiveConversation(siteId, customerEmail);
  if (!conv) return;

  const defaultMessage =
    `Your quotation ${quoteNumber} has been converted to order ${orderNumber} (${total})! ` +
    `You can now proceed with payment. Would you like me to guide you through the payment process?`;

  const message = await resolveChatMessage(
    siteId,
    "quote_converted",
    { quote_number: quoteNumber, order_number: orderNumber, total },
    defaultMessage,
  );
  if (!message) return;

  await sendProactiveMessage(
    siteId,
    conv.conversationId,
    message,
    conv.assistantName,
    { pendingApproval: true },
  );
}

/**
 * Notify chat when a new quote request is submitted by the customer.
 */
export async function notifyChatQuoteRequested(
  siteId: string,
  customerEmail: string,
  quoteNumber: string,
  itemCount: number,
): Promise<void> {
  const conv = await findActiveConversation(siteId, customerEmail);
  if (!conv) return;

  const defaultMessage = `Quote ${quoteNumber} received! ✅ Our team will review your ${itemCount} item${itemCount !== 1 ? "s" : ""} and email you when it's ready.`;

  const message = await resolveChatMessage(
    siteId,
    "quote_requested",
    { quote_number: quoteNumber, item_count: String(itemCount) },
    defaultMessage,
  );
  if (!message) return;

  await sendProactiveMessage(
    siteId,
    conv.conversationId,
    message,
    conv.assistantName,
    { pendingApproval: true },
  );
}

/**
 * Notify chat when a quote has been sent to the customer by the store.
 */
export async function notifyChatQuoteSent(
  siteId: string,
  customerEmail: string,
  quoteNumber: string,
  total: string,
  portalUrl?: string,
): Promise<void> {
  const conv = await findActiveConversation(siteId, customerEmail);
  if (!conv) return;

  const linkPart = portalUrl ? ` View it here: ${portalUrl}` : "";
  const defaultMessage = `Your quote ${quoteNumber} is ready (${total})! 🎉 Check your email to review and respond.${linkPart}`;

  const message = await resolveChatMessage(
    siteId,
    "quote_sent",
    { quote_number: quoteNumber, total, portal_link: linkPart },
    defaultMessage,
  );
  if (!message) return;

  await sendProactiveMessage(
    siteId,
    conv.conversationId,
    message,
    conv.assistantName,
    { pendingApproval: true },
  );
}

/**
 * Notify chat when a quote has been accepted by the customer.
 */
export async function notifyChatQuoteAccepted(
  siteId: string,
  customerEmail: string,
  quoteNumber: string,
  total: string,
): Promise<void> {
  const conv = await findActiveConversation(siteId, customerEmail);
  if (!conv) return;

  const defaultMessage = `Quote ${quoteNumber} accepted (${total})! ✅ The store will process your order shortly.`;

  const message = await resolveChatMessage(
    siteId,
    "quote_accepted",
    { quote_number: quoteNumber, total },
    defaultMessage,
  );
  if (!message) return;

  await sendProactiveMessage(
    siteId,
    conv.conversationId,
    message,
    conv.assistantName,
    { pendingApproval: true },
  );
}

/**
 * Notify chat when a quote has been rejected by the customer.
 */
export async function notifyChatQuoteRejected(
  siteId: string,
  customerEmail: string,
  quoteNumber: string,
  reason?: string,
): Promise<void> {
  const conv = await findActiveConversation(siteId, customerEmail);
  if (!conv) return;

  const reasonPart = reason
    ? ` Reason: "${reason.length > 100 ? reason.substring(0, 97) + "..." : reason}".`
    : "";
  const defaultMessage = `Quote ${quoteNumber} declined.${reasonPart} Let me know if you'd like a revised quote.`;

  const message = await resolveChatMessage(
    siteId,
    "quote_rejected",
    { quote_number: quoteNumber, reason: reasonPart },
    defaultMessage,
  );
  if (!message) return;

  await sendProactiveMessage(
    siteId,
    conv.conversationId,
    message,
    conv.assistantName,
    { pendingApproval: true },
  );
}

/**
 * Notify chat when the customer requests changes to a quote.
 * This message appears in the customer's chat — use customer-friendly language.
 */
export async function notifyChatQuoteAmendmentRequested(
  siteId: string,
  customerEmail: string,
  quoteNumber: string,
  notes: string,
): Promise<void> {
  const conv = await findActiveConversation(siteId, customerEmail);
  if (!conv) return;

  const defaultMessage = `Your change request for ${quoteNumber} has been submitted! ✅ We'll review your notes and send an updated quote.`;

  const message = await resolveChatMessage(
    siteId,
    "quote_amendment_requested",
    { quote_number: quoteNumber },
    defaultMessage,
  );
  if (!message) return;

  await sendProactiveMessage(
    siteId,
    conv.conversationId,
    message,
    conv.assistantName,
    { pendingApproval: true },
  );
}

// =============================================================================
// BRIDGE CHAT IMAGE → PAYMENT PROOF
// =============================================================================

/**
 * Filename fragments that strongly suggest a payment/receipt document.
 * Checked case-insensitively against the uploaded file's name.
 */
const PAYMENT_FILENAME_PATTERNS = [
  /receipt/i,
  /proof/i,
  /payment/i,
  /paid/i,
  /transfer/i,
  /invoice/i,
  /bank/i,
  /momo/i,
  /mtn/i,
  /airtel/i,
  /zamtel/i,
  /transaction/i,
  /debit/i,
  /confirm/i,
];

/**
 * Text patterns that suggest the visitor was talking about a payment or
 * uploading proof. Checked against each recent visitor text message.
 */
const PAYMENT_MESSAGE_PATTERNS = [
  /\bpaid\b/i,
  /\bpay(?:ment)?\b/i,
  /\bproof\b/i,
  /\breceipt\b/i,
  /\btransfer(?:red)?\b/i,
  /\bsent\b.*\bmoney\b/i,
  /\bmoney\b.*\bsent\b/i,
  /\bi\s+(?:have\s+)?(?:just\s+)?(?:made|done|completed|sent|uploaded|submitted)\b/i,
  /\bhere\s+(?:is|are)\b/i,
  /\bbank\s+transfer\b/i,
  /\bmobile\s+money\b/i,
  /\bORD[-\s]?\d+/i,
  /\border\s*(?:number|#)?\s*\d+/i,
  /\bdeposit(?:ed)?\b/i,
  /\bremittance\b/i,
];

/**
 * Returns true when the filename OR any recent visitor message contains
 * clear payment-related vocabulary. Used to gate the chat-to-proof bridge
 * and prevent false positives (e.g. product photos uploaded mid-conversation).
 */
function isLikelyPaymentProof(
  fileName: string,
  recentVisitorMessages: string[],
): boolean {
  // Fast path: filename itself already hints at a receipt/proof
  if (PAYMENT_FILENAME_PATTERNS.some((re) => re.test(fileName))) return true;

  // Check the last few visitor text messages for payment language
  return recentVisitorMessages.some((msg) =>
    PAYMENT_MESSAGE_PATTERNS.some((re) => re.test(msg)),
  );
}

/**
 * Bridge a chat image/PDF upload to the payment proof system.
 *
 * When a customer uploads an image or PDF in a chat conversation and has
 * a pending manual payment order, this function:
 * 1. Verifies the upload is genuinely payment-proof-related (intent check)
 * 2. Downloads the file from the chat-attachments URL
 * 3. Re-uploads it to the payment-proofs storage bucket
 * 4. Updates the order metadata with proof info
 * 5. Adds an order timeline entry
 * 6. Sends a proactive chat acknowledgment message
 * 7. Notifies the business owner (in-app + email)
 *
 * Returns true if the image was successfully bridged, false otherwise.
 *
 * @param isPaymentConvoActive - true when the AI has already entered payment-
 *   guidance mode for this conversation (conversation metadata flag set by
 *   auto-response-handler). Passed through for logging; the primary gate is
 *   the intent check against filename and conversation history.
 */
export async function bridgeChatImageAsPaymentProof(
  siteId: string,
  conversationId: string,
  visitorId: string,
  fileUrl: string,
  fileName: string,
  fileSize: number,
  fileMimeType: string,
  isPaymentConvoActive: boolean,
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  try {
    // 1. Get visitor email and conversation metadata (for order_number)
    const [{ data: visitor }, { data: conversation }] = await Promise.all([
      supabase
        .from("mod_chat_visitors")
        .select("email")
        .eq("id", visitorId)
        .single(),
      supabase
        .from("mod_chat_conversations")
        .select("metadata")
        .eq("id", conversationId)
        .single(),
    ]);

    if (!visitor?.email) {
      console.log("[ChatPaymentBridge] Visitor has no email — skipping bridge");
      return false;
    }

    // 2. Find the correct pending manual payment order.
    //    Prefer the specific order linked to the conversation (metadata.order_number)
    //    then fall back to most recent pending manual order by email.
    const convMeta = (conversation?.metadata || {}) as Record<string, unknown>;
    const linkedOrderNumber = convMeta.order_number as string | undefined;

    let order: Record<string, unknown> | null = null;

    if (linkedOrderNumber) {
      // Precise match: use the conversation's linked order number
      const { data: linkedOrder } = await supabase
        .from("mod_ecommod01_orders")
        .select(
          "id, order_number, customer_email, customer_name, total, currency, payment_status, payment_provider, metadata",
        )
        .eq("site_id", siteId)
        .eq("order_number", linkedOrderNumber)
        .neq("status", "cancelled")
        .single();

      // Accept if it's a manual payment order still awaiting proof
      if (
        linkedOrder &&
        linkedOrder.payment_status === "pending" &&
        (!linkedOrder.payment_provider ||
          linkedOrder.payment_provider === "manual" ||
          linkedOrder.payment_provider === "bank_transfer")
      ) {
        order = linkedOrder;
      }
    }

    if (!order) {
      // Fallback: find most recent pending manual order by email
      const { data: pendingOrders } = await supabase
        .from("mod_ecommod01_orders")
        .select(
          "id, order_number, customer_email, customer_name, total, currency, payment_status, payment_provider, metadata",
        )
        .eq("site_id", siteId)
        .eq("customer_email", visitor.email)
        .eq("payment_status", "pending")
        .neq("status", "cancelled")
        .order("created_at", { ascending: false })
        .limit(1);

      // Only match manual/bank_transfer orders — not gateway (Paddle/Flutterwave) pending orders
      order =
        (pendingOrders || []).find(
          (o: Record<string, unknown>) =>
            !o.payment_provider ||
            o.payment_provider === "manual" ||
            o.payment_provider === "bank_transfer",
        ) || null;
    }

    if (!order) {
      // No pending manual order — check for a booking with pending payment
      const linkedBookingId = convMeta.booking_id as string | undefined;
      if (linkedBookingId) {
        const { data: appointment } = await supabase
          .from("mod_bookmod01_appointments")
          .select(
            "id, payment_status, payment_amount, customer_email, customer_name, metadata, service:mod_bookmod01_services(name, price, currency)",
          )
          .eq("site_id", siteId)
          .eq("id", linkedBookingId)
          .eq("payment_status", "pending")
          .single();

        if (
          appointment &&
          (appointment.payment_amount > 0 || appointment.service?.price > 0)
        ) {
          // This is a booking payment proof — bridge it!
          return bridgeChatImageAsBookingPaymentProof(
            supabase,
            siteId,
            conversationId,
            appointment,
            fileUrl,
            fileName,
            fileSize,
            fileMimeType,
          );
        }
      }

      // No pending order or booking with payment — skip
      return false;
    }

    // 2b. Intent check: only bridge when the filename or recent visitor messages
    //     genuinely indicate this is a payment proof. This prevents false
    //     positives — e.g. a customer in an active payment conversation who
    //     uploads a product photo or error screenshot should NOT have their
    //     image bridged as proof.
    const { data: recentMsgs } = await supabase
      .from("mod_chat_messages")
      .select("content")
      .eq("conversation_id", conversationId)
      .eq("sender_type", "visitor")
      .eq("content_type", "text")
      .order("created_at", { ascending: false })
      .limit(5);

    const recentVisitorTexts = (recentMsgs || []).map(
      (m: { content: string }) => m.content || "",
    );

    if (!isLikelyPaymentProof(fileName, recentVisitorTexts)) {
      console.log(
        "[ChatPaymentBridge] File upload shows no payment context — skipping bridge.",
        {
          fileName,
          isPaymentConvoActive,
          messageCount: recentVisitorTexts.length,
        },
      );
      return false;
    }

    // 3. Check if proof is already confirmed — don't overwrite
    const existingMeta = (order.metadata || {}) as Record<string, unknown>;
    const existingProof = existingMeta.payment_proof as
      | { status?: string }
      | undefined;
    if (existingProof?.status === "confirmed") {
      console.log(
        "[ChatPaymentBridge] Payment already confirmed for order",
        order.order_number,
        "— skipping",
      );
      return false;
    }

    // 4. Download file from chat-attachments public URL
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      console.error(
        "[ChatPaymentBridge] Failed to download file from chat-attachments:",
        fileResponse.status,
      );
      return false;
    }
    const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());

    // 5. Upload to payment-proofs bucket
    const extMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
      "image/heic": "heic",
      "application/pdf": "pdf",
    };
    const ext = extMap[fileMimeType] || "bin";
    const storagePath = `${siteId}/${order.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(storagePath, fileBuffer, {
        contentType: fileMimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error(
        "[ChatPaymentBridge] Failed to upload to payment-proofs:",
        uploadError,
      );
      return false;
    }

    // 6. Update order metadata with proof info
    const updatedMetadata = {
      ...existingMeta,
      payment_proof: {
        storage_path: storagePath,
        file_name: fileName,
        content_type: fileMimeType,
        file_size: fileSize,
        uploaded_at: new Date().toISOString(),
        status: "pending_review",
        source: "live_chat",
      },
    };

    await supabase
      .from("mod_ecommod01_orders")
      .update({ metadata: updatedMetadata })
      .eq("id", order.id);

    // 7. Add order timeline entry
    await supabase.from("mod_ecommod01_order_timeline").insert({
      order_id: order.id,
      event_type: "payment_proof_uploaded",
      title: "Payment proof uploaded via live chat",
      description: `Customer uploaded payment proof in chat: ${fileName}`,
      metadata: {
        file_name: fileName,
        content_type: fileMimeType,
        source: "live_chat",
      },
    });

    // 8. Send proactive chat acknowledgment message
    const { data: widgetSettings } = await supabase
      .from("mod_chat_widget_settings")
      .select("ai_assistant_name")
      .eq("site_id", siteId)
      .single();
    const assistantName = widgetSettings?.ai_assistant_name || "Chiko";

    const bridgeDefaultMessage =
      `I can see you've uploaded your payment proof (${fileName}) for order ${order.order_number}. ` +
      `The store owner will now review it and verify your payment. ` +
      `This usually takes a short while — I'll keep you updated on the progress! 😊`;

    const bridgeMessage = await resolveChatMessage(
      siteId,
      "payment_proof_uploaded",
      { order_number: order.order_number as string, file_name: fileName },
      bridgeDefaultMessage,
    );
    if (bridgeMessage) {
      await sendProactiveMessage(
        siteId,
        conversationId,
        bridgeMessage,
        assistantName,
        { pendingApproval: true },
      );
    }

    // 9. Notify business owner (in-app notification + email)
    const totalCents = (order.total as number) || 0;
    const currency = (order.currency as string) || "ZMW";
    const totalFormatted = `${currency} ${(totalCents / 100).toFixed(2)}`;

    try {
      const { notifyPaymentProofUploaded } =
        await import("@/lib/services/business-notifications");
      await notifyPaymentProofUploaded(
        siteId,
        order.order_number as string,
        (order.customer_email as string) || "",
        (order.customer_name as string) || "Customer",
        totalFormatted,
        fileName,
      );
    } catch (notifyErr) {
      console.error(
        "[ChatPaymentBridge] Business notification error:",
        notifyErr,
      );
    }

    console.log(
      `[ChatPaymentBridge] Successfully bridged chat image as payment proof for order ${order.order_number}`,
    );
    return true;
  } catch (err) {
    console.error("[ChatPaymentBridge] Unexpected error:", err);
    return false;
  }
}

/**
 * Bridge a chat-uploaded image as booking payment proof.
 * Mirrors the order proof bridging logic but for appointments.
 */
async function bridgeChatImageAsBookingPaymentProof(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  siteId: string,
  conversationId: string,
  appointment: {
    id: string;
    payment_status: string;
    payment_amount: number;
    customer_email: string;
    customer_name: string;
    metadata: Record<string, unknown> | null;
    service: { name: string; price: number; currency: string } | null;
  },
  fileUrl: string,
  fileName: string,
  fileSize: number,
  fileMimeType: string,
): Promise<boolean> {
  try {
    // 1. Intent check
    const { data: recentMsgs } = await supabase
      .from("mod_chat_messages")
      .select("content")
      .eq("conversation_id", conversationId)
      .eq("sender_type", "visitor")
      .eq("content_type", "text")
      .order("created_at", { ascending: false })
      .limit(5);

    const recentVisitorTexts = (recentMsgs || []).map(
      (m: { content: string }) => m.content || "",
    );

    if (!isLikelyPaymentProof(fileName, recentVisitorTexts)) {
      console.log(
        "[ChatPaymentBridge] Booking file upload shows no payment context — skipping bridge.",
        { fileName, appointmentId: appointment.id },
      );
      return false;
    }

    // 2. Check if proof is already confirmed — don't overwrite
    const existingMeta = (appointment.metadata || {}) as Record<
      string,
      unknown
    >;
    const existingProof = existingMeta.payment_proof as
      | { status?: string }
      | undefined;
    if (existingProof?.status === "confirmed") {
      console.log(
        "[ChatPaymentBridge] Payment already confirmed for booking",
        appointment.id,
        "— skipping",
      );
      return false;
    }

    // 3. Download file from chat-attachments public URL
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      console.error(
        "[ChatPaymentBridge] Failed to download file from chat-attachments:",
        fileResponse.status,
      );
      return false;
    }
    const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());

    // 4. Upload to payment-proofs bucket
    const extMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
      "image/heic": "heic",
      "application/pdf": "pdf",
    };
    const ext = extMap[fileMimeType] || "bin";
    const storagePath = `${siteId}/booking-${appointment.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(storagePath, fileBuffer, {
        contentType: fileMimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error(
        "[ChatPaymentBridge] Failed to upload booking proof to payment-proofs:",
        uploadError,
      );
      return false;
    }

    // 5. Update appointment metadata with proof info
    const updatedMetadata = {
      ...existingMeta,
      payment_proof: {
        storage_path: storagePath,
        file_name: fileName,
        content_type: fileMimeType,
        file_size: fileSize,
        uploaded_at: new Date().toISOString(),
        status: "pending_review",
        source: "live_chat",
      },
    };

    await supabase
      .from("mod_bookmod01_appointments")
      .update({ metadata: updatedMetadata })
      .eq("id", appointment.id);

    // 6. Send proactive chat acknowledgment message
    const serviceName = appointment.service?.name || "your service";
    const { data: widgetSettings } = await supabase
      .from("mod_chat_widget_settings")
      .select("ai_assistant_name")
      .eq("site_id", siteId)
      .single();
    const assistantName = widgetSettings?.ai_assistant_name || "Chiko";

    const bridgeDefaultMessage =
      `I can see you've uploaded your payment proof (${fileName}) for your ${serviceName} booking. ` +
      `The store owner will now review it and verify your payment. ` +
      `This usually takes a short while — I'll keep you updated! 😊`;

    const bridgeMessage = await resolveChatMessage(
      siteId,
      "booking_payment_proof_uploaded" as ChatMessageEventType,
      { service_name: serviceName, file_name: fileName },
      bridgeDefaultMessage,
    );
    if (bridgeMessage) {
      await sendProactiveMessage(
        siteId,
        conversationId,
        bridgeMessage,
        assistantName,
        { pendingApproval: true },
      );
    }

    // 7. Notify business owner
    const amount =
      appointment.payment_amount || appointment.service?.price || 0;
    const currency = appointment.service?.currency || "ZMW";
    const amountFormatted = `${currency} ${(amount / 100).toFixed(2)}`;

    try {
      const { notifyBookingPaymentProofUploaded } =
        await import("@/lib/services/business-notifications");
      await notifyBookingPaymentProofUploaded(
        siteId,
        serviceName,
        appointment.customer_email || "",
        appointment.customer_name || "Customer",
        amountFormatted,
        fileName,
      );
    } catch (notifyErr) {
      console.error(
        "[ChatPaymentBridge] Booking business notification error:",
        notifyErr,
      );
    }

    // 8. Emit automation event
    try {
      const { emitAutomationEvent } =
        await import("@/modules/automation/lib/automation-engine");
      await emitAutomationEvent(siteId, "booking.payment.proof_uploaded", {
        booking_id: appointment.id,
        service_name: serviceName,
        customer_email: appointment.customer_email,
        customer_name: appointment.customer_name,
        file_name: fileName,
        amount: amountFormatted,
      });
    } catch {
      // Automation engine may not be available — non-critical
    }

    console.log(
      `[ChatPaymentBridge] Successfully bridged chat image as payment proof for booking ${appointment.id}`,
    );
    return true;
  } catch (err) {
    console.error("[ChatPaymentBridge] Booking proof bridge error:", err);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOOKING NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Notify the customer's chat when a new booking is created (e.g. from storefront).
 */
export async function notifyChatBookingCreated(
  siteId: string,
  customerEmail: string,
  serviceName: string,
  dateFormatted: string,
  timeFormatted: string,
): Promise<void> {
  const conv = await findActiveConversation(siteId, customerEmail);
  if (!conv) return;

  const defaultMessage =
    `Your booking for ${serviceName} on ${dateFormatted} at ${timeFormatted} has been received! 📅 ` +
    `You'll be notified once it's confirmed.`;

  const message = await resolveChatMessage(
    siteId,
    "booking_created",
    { service_name: serviceName, date: dateFormatted, time: timeFormatted },
    defaultMessage,
  );
  if (!message) return;

  await sendProactiveMessage(
    siteId,
    conv.conversationId,
    message,
    conv.assistantName,
    { pendingApproval: true },
  );
}

/**
 * Notify the customer's chat when their booking has been confirmed.
 */
export async function notifyChatBookingConfirmed(
  siteId: string,
  customerEmail: string,
  serviceName: string,
  dateFormatted: string,
  timeFormatted: string,
): Promise<void> {
  const conv = await findActiveConversation(siteId, customerEmail);
  if (!conv) return;

  const defaultMessage =
    `Great news — your booking for ${serviceName} on ${dateFormatted} at ${timeFormatted} is confirmed! ✅ ` +
    `We look forward to seeing you.`;

  const message = await resolveChatMessage(
    siteId,
    "booking_confirmed",
    { service_name: serviceName, date: dateFormatted, time: timeFormatted },
    defaultMessage,
  );
  if (!message) return;

  await sendProactiveMessage(
    siteId,
    conv.conversationId,
    message,
    conv.assistantName,
    { pendingApproval: true },
  );
}

/**
 * Notify the customer's chat when their booking has been cancelled.
 */
export async function notifyChatBookingCancelled(
  siteId: string,
  customerEmail: string,
  serviceName: string,
  reason?: string,
): Promise<void> {
  const conv = await findActiveConversation(siteId, customerEmail);
  if (!conv) return;

  const reasonPart = reason
    ? ` Reason: "${reason.length > 120 ? reason.substring(0, 117) + "..." : reason}".`
    : "";
  const defaultMessage =
    `Your booking for ${serviceName} has been cancelled.${reasonPart} ` +
    `If you'd like to reschedule, just let me know!`;

  const message = await resolveChatMessage(
    siteId,
    "booking_cancelled",
    { service_name: serviceName, reason: reasonPart },
    defaultMessage,
  );
  if (!message) return;

  await sendProactiveMessage(
    siteId,
    conv.conversationId,
    message,
    conv.assistantName,
    { pendingApproval: true },
  );
}

/**
 * Notify the customer's chat when their booking has been rescheduled.
 */
export async function notifyChatBookingRescheduled(
  siteId: string,
  customerEmail: string,
  serviceName: string,
  newDateFormatted: string,
  newTimeFormatted: string,
): Promise<void> {
  const conv = await findActiveConversation(siteId, customerEmail);
  if (!conv) return;

  const defaultMessage =
    `Your booking for ${serviceName} has been rescheduled to ${newDateFormatted} at ${newTimeFormatted}. 🔄 ` +
    `Let me know if this works for you!`;

  const message = await resolveChatMessage(
    siteId,
    "booking_rescheduled",
    {
      service_name: serviceName,
      new_date: newDateFormatted,
      new_time: newTimeFormatted,
    },
    defaultMessage,
  );
  if (!message) return;

  await sendProactiveMessage(
    siteId,
    conv.conversationId,
    message,
    conv.assistantName,
    { pendingApproval: true },
  );
}

/**
 * Notify the customer's chat when their booking has been completed.
 */
export async function notifyChatBookingCompleted(
  siteId: string,
  customerEmail: string,
  serviceName: string,
): Promise<void> {
  const conv = await findActiveConversation(siteId, customerEmail);
  if (!conv) return;

  const defaultMessage =
    `Your booking for ${serviceName} is complete! 🎉 Thank you for choosing us. ` +
    `We'd love to hear your feedback — feel free to share!`;

  const message = await resolveChatMessage(
    siteId,
    "booking_completed",
    { service_name: serviceName },
    defaultMessage,
  );
  if (!message) return;

  await sendProactiveMessage(
    siteId,
    conv.conversationId,
    message,
    conv.assistantName,
    { pendingApproval: true },
  );
}

/**
 * Notify the customer's chat when their booking payment has been confirmed.
 */
export async function notifyChatBookingPaymentConfirmed(
  siteId: string,
  customerEmail: string,
  serviceName: string,
  amount: string,
): Promise<void> {
  const conv = await findActiveConversation(siteId, customerEmail);
  if (!conv) return;

  const defaultMessage = `Payment of ${amount} for your ${serviceName} booking has been confirmed! 💳 Thank you.`;

  const message = await resolveChatMessage(
    siteId,
    "booking_payment_confirmed",
    { amount, service_name: serviceName },
    defaultMessage,
  );
  if (!message) return;

  await sendProactiveMessage(
    siteId,
    conv.conversationId,
    message,
    conv.assistantName,
    { pendingApproval: true },
  );
}
