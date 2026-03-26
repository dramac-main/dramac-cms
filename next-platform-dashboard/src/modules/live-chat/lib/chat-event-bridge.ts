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
    .in("status", ["active", "open", "waiting"])
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
    assistantName: settings?.ai_assistant_name || "AI Assistant",
  };
}

// =============================================================================
// SEND PROACTIVE MESSAGE
// =============================================================================

/**
 * Insert a proactive AI message into an active conversation.
 * The message appears in real-time via Supabase Realtime subscriptions.
 */
export async function sendProactiveMessage(
  siteId: string,
  conversationId: string,
  message: string,
  assistantName: string,
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  const { error } = await supabase.from("mod_chat_messages").insert({
    conversation_id: conversationId,
    site_id: siteId,
    sender_type: "ai",
    sender_name: assistantName,
    content: message,
    content_type: "text",
    status: "sent",
    is_ai_generated: true,
    ai_confidence: 1.0,
    is_internal_note: false,
  });

  if (error) {
    console.error("[ChatEventBridge] Failed to send proactive message:", error);
    return false;
  }

  // Update conversation last_message info
  await supabase
    .from("mod_chat_conversations")
    .update({
      last_message_text: message.substring(0, 255),
      last_message_at: new Date().toISOString(),
      last_message_by: "ai",
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  console.log(
    "[ChatEventBridge] Proactive message sent to conversation:",
    conversationId,
  );
  return true;
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

  const message =
    `Great news! I can see that you've uploaded your payment proof (${fileName}) for order ${orderNumber}. ` +
    `The store owner will now review it and verify your payment. ` +
    `This usually takes a short while — I'll keep you updated on the progress! 😊`;

  await sendProactiveMessage(
    siteId,
    conv.conversationId,
    message,
    conv.assistantName,
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

  const message =
    `Your payment for order ${orderNumber} (${total}) has been confirmed! 🎉 ` +
    `Your order is now being processed. You'll receive updates as it progresses through shipping and delivery.`;

  await sendProactiveMessage(
    siteId,
    conv.conversationId,
    message,
    conv.assistantName,
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

  const message =
    statusMessages[newStatus] ||
    `Your order ${orderNumber} status has been updated to: ${newStatus}.`;

  await sendProactiveMessage(
    siteId,
    conv.conversationId,
    message,
    conv.assistantName,
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

  const message =
    `Your quotation ${quoteNumber} has been converted to order ${orderNumber} (${total})! ` +
    `You can now proceed with payment. Would you like me to guide you through the payment process?`;

  await sendProactiveMessage(
    siteId,
    conv.conversationId,
    message,
    conv.assistantName,
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
    // 1. Get visitor email
    const { data: visitor } = await supabase
      .from("mod_chat_visitors")
      .select("email")
      .eq("id", visitorId)
      .single();

    if (!visitor?.email) {
      console.log("[ChatPaymentBridge] Visitor has no email — skipping bridge");
      return false;
    }

    // 2. Find pending manual payment order for this customer
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
    const order = (pendingOrders || []).find(
      (o: Record<string, unknown>) =>
        !o.payment_provider ||
        o.payment_provider === "manual" ||
        o.payment_provider === "bank_transfer",
    );

    if (!order) {
      // No pending manual order — this image isn't payment proof
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
    const assistantName = widgetSettings?.ai_assistant_name || "AI Assistant";

    await sendProactiveMessage(
      siteId,
      conversationId,
      `I can see you've uploaded your payment proof (${fileName}) for order ${order.order_number}. ` +
        `The store owner will now review it and verify your payment. ` +
        `This usually takes a short while — I'll keep you updated on the progress! 😊`,
      assistantName,
    );

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
