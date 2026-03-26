/**
 * Order Management Actions
 *
 * Phase ECOM-04: Order Management Enhancement
 *
 * Server actions for managing orders, shipments, refunds
 */
"use server";

import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/locale-config";
import { sendBrandedEmail } from "@/lib/email/send-branded-email";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAutomationEvent } from "@/modules/automation/services/event-processor";
import type {
  Order,
  OrderStatus,
  OrderDetailData,
  OrderTimelineEvent,
  OrderNote,
  OrderShipment,
  OrderRefund,
  OrderBulkAction,
  BulkActionResult,
} from "../types/ecommerce-types";

const TABLE_PREFIX = "mod_ecommod01";

async function getModuleClient() {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabase as any;
}

// ============================================================================
// ORDER DETAIL
// ============================================================================

/**
 * Get complete order detail with timeline, notes, shipments, refunds
 */
export async function getOrderDetail(
  siteId: string,
  orderId: string,
): Promise<OrderDetailData | null> {
  const supabase = await getModuleClient();

  // Get order
  const { data: order, error: orderError } = await supabase
    .from(`${TABLE_PREFIX}_orders`)
    .select("*")
    .eq("id", orderId)
    .eq("site_id", siteId)
    .single();

  if (orderError || !order) return null;

  // Get order items
  const { data: items } = await supabase
    .from(`${TABLE_PREFIX}_order_items`)
    .select("*")
    .eq("order_id", orderId);

  // Get timeline events
  const { data: timeline } = await supabase
    .from(`${TABLE_PREFIX}_order_timeline`)
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });

  // Get notes
  const { data: notes } = await supabase
    .from(`${TABLE_PREFIX}_order_notes`)
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });

  // Get shipments
  const { data: shipments } = await supabase
    .from(`${TABLE_PREFIX}_order_shipments`)
    .select("*")
    .eq("order_id", orderId)
    .order("shipped_at", { ascending: false });

  // Get refunds
  const { data: refunds } = await supabase
    .from(`${TABLE_PREFIX}_order_refunds`)
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });

  return {
    ...order,
    items: items || [],
    timeline: timeline || [],
    order_notes: notes || [],
    shipments: shipments || [],
    refunds: refunds || [],
  };
}

/**
 * Get orders list with filters
 */
export async function getOrders(
  siteId: string,
  filters?: {
    status?: OrderStatus | "all";
    paymentStatus?: string | "all";
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  },
): Promise<Order[]> {
  const supabase = await getModuleClient();

  let query = supabase
    .from(`${TABLE_PREFIX}_orders`)
    .select("*, items:mod_ecommod01_order_items(*)")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters?.paymentStatus && filters.paymentStatus !== "all") {
    query = query.eq("payment_status", filters.paymentStatus);
  }

  if (filters?.dateFrom) {
    query = query.gte("created_at", filters.dateFrom);
  }

  if (filters?.dateTo) {
    query = query.lte("created_at", filters.dateTo);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching orders:", error);
    return [];
  }

  return data || [];
}

// ============================================================================
// ORDER STATUS
// ============================================================================

/**
 * Valid order status transitions
 */
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "processing", "cancelled"],
  confirmed: ["processing", "shipped", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};

/**
 * Map status → email type for automatic customer notification
 */
const STATUS_EMAIL_MAP: Record<
  string,
  "shipped" | "delivered" | "cancelled" | "refunded"
> = {
  shipped: "shipped",
  delivered: "delivered",
  cancelled: "cancelled",
  refunded: "refunded",
};

/**
 * Update order status with timeline entry, timestamps, and email notification
 */
export async function updateOrderStatus(
  siteId: string,
  orderId: string,
  status: OrderStatus,
  userId: string,
  userName: string,
  note?: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await getModuleClient();

  // Fetch current status for transition validation
  const { data: currentOrder } = await supabase
    .from(`${TABLE_PREFIX}_orders`)
    .select("status")
    .eq("id", orderId)
    .eq("site_id", siteId)
    .single();

  if (!currentOrder) {
    return { success: false, error: "Order not found" };
  }

  // Validate status transition
  const allowed = VALID_TRANSITIONS[currentOrder.status as OrderStatus];
  if (allowed && !allowed.includes(status)) {
    return {
      success: false,
      error: `Cannot change status from ${currentOrder.status} to ${status}`,
    };
  }

  // Build update payload with status-specific timestamps
  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "shipped") {
    updates.shipped_at = new Date().toISOString();
    updates.fulfillment_status = "shipped";
  } else if (status === "delivered") {
    updates.delivered_at = new Date().toISOString();
    updates.fulfillment_status = "delivered";
  } else if (status === "cancelled") {
    updates.fulfillment_status = "cancelled";
  }

  // Update order
  const { error: orderError } = await supabase
    .from(`${TABLE_PREFIX}_orders`)
    .update(updates)
    .eq("id", orderId)
    .eq("site_id", siteId);

  if (orderError) {
    return { success: false, error: orderError.message };
  }

  // Add timeline event
  await addTimelineEvent(orderId, {
    event_type: "status_changed",
    title: `Status changed to ${status}`,
    description: note,
    created_by: userId,
    metadata: { actor_name: userName, previous_status: currentOrder.status },
  });

  // Send customer notification email for relevant status changes
  const emailType = STATUS_EMAIL_MAP[status];
  if (emailType) {
    sendOrderEmail(orderId, emailType, userId, userName).catch((err) =>
      console.error("[OrderActions] Email notification error:", err),
    );
  }

  // Emit automation event
  logAutomationEvent(
    siteId,
    "ecommerce.order.status_changed",
    {
      order_id: orderId,
      new_status: status,
      previous_status: currentOrder.status,
      changed_by: userName,
    },
    {
      sourceModule: "ecommerce",
      sourceEntityType: "order",
      sourceEntityId: orderId,
    },
  ).catch((err) =>
    console.error("[OrderActions] Automation event error:", err),
  );

  // Notify active chat conversation about the status change (async — don't block)
  supabase
    .from(`${TABLE_PREFIX}_orders`)
    .select("customer_email, order_number")
    .eq("id", orderId)
    .single()
    .then(
      ({
        data: orderData,
      }: {
        data: { customer_email: string; order_number: string } | null;
      }) => {
        if (orderData?.customer_email) {
          import("@/modules/live-chat/lib/chat-event-bridge")
            .then(({ notifyChatOrderStatusChanged }) =>
              notifyChatOrderStatusChanged(
                siteId,
                orderData.customer_email,
                orderData.order_number,
                status,
              ),
            )
            .catch((err) =>
              console.error("[OrderActions] Chat notification error:", err),
            );
        }
      },
    )
    .catch(() => {});

  return { success: true };
}

/**
 * Add timeline event
 *
 * DB columns: id, order_id, event_type, title, description, metadata, created_by, created_at
 */
async function addTimelineEvent(
  orderId: string,
  event: {
    event_type: string;
    title: string;
    description?: string;
    created_by?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  const supabase = await getModuleClient();

  await supabase.from(`${TABLE_PREFIX}_order_timeline`).insert({
    order_id: orderId,
    event_type: event.event_type,
    title: event.title,
    description: event.description,
    created_by: event.created_by,
    metadata: event.metadata,
  });
}

// ============================================================================
// ORDER NOTES
// ============================================================================

/**
 * Add note to order
 */
export async function addOrderNote(
  siteId: string,
  orderId: string,
  content: string,
  isInternal: boolean,
  userId: string,
  userName: string,
): Promise<OrderNote | null> {
  const supabase = await getModuleClient();

  // Verify order exists for site
  const { data: order } = await supabase
    .from(`${TABLE_PREFIX}_orders`)
    .select("id")
    .eq("id", orderId)
    .eq("site_id", siteId)
    .single();

  if (!order) return null;

  const { data: note, error } = await supabase
    .from(`${TABLE_PREFIX}_order_notes`)
    .insert({
      order_id: orderId,
      content,
      is_internal: isInternal,
      author_id: userId,
      author_name: userName,
    })
    .select()
    .single();

  if (error) return null;

  // Add timeline event
  await addTimelineEvent(orderId, {
    event_type: "note_added",
    title: isInternal ? "Internal note added" : "Note added",
    description: content.slice(0, 100),
    created_by: userId,
    metadata: { actor_name: userName },
  });

  return note;
}

/**
 * Delete order note
 */
export async function deleteOrderNote(noteId: string): Promise<boolean> {
  const supabase = await getModuleClient();

  const { error } = await supabase
    .from(`${TABLE_PREFIX}_order_notes`)
    .delete()
    .eq("id", noteId);

  return !error;
}

// ============================================================================
// SHIPMENTS
// ============================================================================

/**
 * Add shipment to order
 */
export async function addOrderShipment(
  siteId: string,
  orderId: string,
  shipment: {
    carrier: string;
    tracking_number: string;
    tracking_url?: string;
  },
  userId: string,
  userName: string,
): Promise<OrderShipment | null> {
  const supabase = await getModuleClient();

  // Create shipment record
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_order_shipments`)
    .insert({
      order_id: orderId,
      carrier: shipment.carrier,
      tracking_number: shipment.tracking_number,
      tracking_url: shipment.tracking_url,
      shipped_at: new Date().toISOString(),
      status: "in_transit",
    })
    .select()
    .single();

  if (error) return null;

  // Also store tracking info on the order for easy access by storefront
  await supabase
    .from(`${TABLE_PREFIX}_orders`)
    .update({
      tracking_number: shipment.tracking_number,
      tracking_url: shipment.tracking_url,
    })
    .eq("id", orderId)
    .eq("site_id", siteId);

  // Update order status to shipped (this also sends the email + sets shipped_at)
  await updateOrderStatus(siteId, orderId, "shipped", userId, userName);

  // Add timeline event
  await addTimelineEvent(orderId, {
    event_type: "shipped",
    title: "Order shipped",
    description: `Shipped via ${shipment.carrier} - ${shipment.tracking_number}`,
    created_by: userId,
    metadata: { shipment_id: data.id, actor_name: userName },
  });

  // Emit automation event for shipment
  logAutomationEvent(
    siteId,
    "ecommerce.order.shipped",
    {
      order_id: orderId,
      shipment_id: data.id,
      carrier: shipment.carrier,
      tracking_number: shipment.tracking_number,
      tracking_url: shipment.tracking_url,
    },
    {
      sourceModule: "ecommerce",
      sourceEntityType: "order",
      sourceEntityId: orderId,
    },
  ).catch((err) =>
    console.error("[OrderActions] Automation event error:", err),
  );

  return data;
}

/**
 * Update shipment status
 */
export async function updateShipmentStatus(
  shipmentId: string,
  status: "in_transit" | "delivered" | "failed",
  orderId: string,
): Promise<boolean> {
  const supabase = await getModuleClient();

  const updates: Record<string, unknown> = { status };
  if (status === "delivered") {
    updates.delivered_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from(`${TABLE_PREFIX}_order_shipments`)
    .update(updates)
    .eq("id", shipmentId);

  if (!error && status === "delivered") {
    await addTimelineEvent(orderId, {
      event_type: "delivered",
      title: "Order delivered",
      description: "Shipment marked as delivered",
    });
  }

  return !error;
}

// ============================================================================
// PAYMENT PROOF
// ============================================================================

/**
 * Get payment proof signed URL for viewing in dashboard
 */
export async function getPaymentProofUrl(
  orderId: string,
  siteId: string,
): Promise<{ url?: string; proof?: Record<string, unknown>; error?: string }> {
  const supabase = await getModuleClient();

  const { data: order } = await supabase
    .from(`${TABLE_PREFIX}_orders`)
    .select("metadata")
    .eq("id", orderId)
    .eq("site_id", siteId)
    .single();

  if (!order?.metadata?.payment_proof) {
    return { error: "No payment proof uploaded" };
  }

  const proof = order.metadata.payment_proof as Record<string, unknown>;
  const storagePath = proof.storage_path as string;

  if (!storagePath) {
    return { error: "Payment proof path missing" };
  }

  // Use admin client for storage — payment-proofs bucket is private with no
  // RLS SELECT policy for authenticated users. The bridge uploads via admin,
  // so reads must also use admin to create signed URLs.
  const adminClient = createAdminClient();
  const { data, error } = await adminClient.storage
    .from("payment-proofs")
    .createSignedUrl(storagePath, 3600);

  if (error) {
    return { error: error.message };
  }

  return { url: data.signedUrl, proof };
}

/**
 * Update payment proof status (approve/reject)
 */
export async function updatePaymentProofStatus(
  siteId: string,
  orderId: string,
  status: "approved" | "rejected",
  userId: string,
  userName: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await getModuleClient();

  // Get current metadata
  const { data: order } = await supabase
    .from(`${TABLE_PREFIX}_orders`)
    .select("metadata, payment_status")
    .eq("id", orderId)
    .eq("site_id", siteId)
    .single();

  if (!order) {
    return { success: false, error: "Order not found" };
  }

  const metadata = order.metadata || {};
  const proof = (metadata.payment_proof as Record<string, unknown>) || {};
  proof.status = status;
  proof.reviewed_at = new Date().toISOString();
  proof.reviewed_by = userId;
  metadata.payment_proof = proof;

  const updates: Record<string, unknown> = { metadata };

  // If approved, also update payment_status to paid
  if (status === "approved") {
    updates.payment_status = "paid";
  }

  const { error } = await supabase
    .from(`${TABLE_PREFIX}_orders`)
    .update(updates)
    .eq("id", orderId)
    .eq("site_id", siteId);

  if (error) {
    return { success: false, error: error.message };
  }

  await addTimelineEvent(orderId, {
    event_type: "payment_proof_reviewed",
    title: `Payment proof ${status}`,
    description: `Payment proof was ${status} by ${userName}`,
    created_by: userId,
    metadata: { status, actor_name: userName },
  });

  // Notify customer via chat when payment proof is approved or rejected
  if (status === "approved" || status === "rejected") {
    const { data: orderData } = await supabase
      .from(`${TABLE_PREFIX}_orders`)
      .select("order_number, customer_email, customer_name, currency, total")
      .eq("id", orderId)
      .eq("site_id", siteId)
      .single();

    if (orderData?.customer_email) {
      if (status === "approved") {
        // Notify chat that payment is confirmed
        import("@/modules/live-chat/lib/chat-event-bridge")
          .then(({ notifyChatPaymentConfirmed }) => {
            const totalStr = `${orderData.currency || ""} ${((orderData.total || 0) / 100).toFixed(2)}`;
            notifyChatPaymentConfirmed(
              siteId,
              orderData.customer_email,
              orderData.order_number,
              totalStr,
            ).catch(() => {});
          })
          .catch(() => {});

        // Send payment confirmed email (sendOrderEmail is local to this file)
        sendOrderEmail(orderId, "confirmation", userId, userName).catch(
          () => {},
        );
      } else {
        // Send rejection notification via chat
        import("@/modules/live-chat/lib/chat-event-bridge")
          .then(({ findActiveConversation, sendProactiveMessage }) => {
            findActiveConversation(siteId, orderData.customer_email)
              .then((conv) => {
                if (!conv) return;
                sendProactiveMessage(
                  siteId,
                  conv.conversationId,
                  `Your payment proof for order ${orderData.order_number} could not be verified. ` +
                    `Please upload a new proof of payment on your order page, or contact us for help.`,
                  conv.assistantName,
                ).catch(() => {});
              })
              .catch(() => {});
          })
          .catch(() => {});
      }
    }
  }

  return { success: true };
}

// ============================================================================
// REFUNDS
// ============================================================================

/**
 * Create refund request
 */
export async function createRefund(
  siteId: string,
  orderId: string,
  refund: {
    amount: number;
    reason: string;
    refund_method: "original_payment" | "store_credit" | "other";
    items?: Array<{ order_item_id: string; quantity: number; amount: number }>;
  },
  userId: string,
  userName: string,
): Promise<OrderRefund | null> {
  const supabase = await getModuleClient();

  // Create refund record
  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_order_refunds`)
    .insert({
      order_id: orderId,
      amount: refund.amount,
      reason: refund.reason,
      refund_method: refund.refund_method,
      items: refund.items,
      status: "pending",
    })
    .select()
    .single();

  if (error) return null;

  // Add timeline event
  await addTimelineEvent(orderId, {
    event_type: "refund_requested",
    title: "Refund requested",
    description: `Amount: ${formatCurrency(refund.amount / 100)} - ${refund.reason}`,
    created_by: userId,
    metadata: { refund_id: data.id, actor_name: userName },
  });

  return data;
}

/**
 * Process refund
 */
export async function processRefund(
  refundId: string,
  orderId: string,
  approved: boolean,
  userId: string,
  userName: string,
): Promise<boolean> {
  const supabase = await getModuleClient();

  const status = approved ? "processed" : "rejected";

  // Get refund details
  const { data: refundData } = await supabase
    .from(`${TABLE_PREFIX}_order_refunds`)
    .select("amount, reason")
    .eq("id", refundId)
    .single();

  const { error } = await supabase
    .from(`${TABLE_PREFIX}_order_refunds`)
    .update({
      status,
      processed_at: new Date().toISOString(),
      processed_by: userId,
    })
    .eq("id", refundId);

  if (error) return false;

  // Add timeline event
  await addTimelineEvent(orderId, {
    event_type: "refund_processed",
    title: approved ? "Refund processed" : "Refund rejected",
    created_by: userId,
    metadata: { refund_id: refundId, actor_name: userName },
  });

  // If approved, update order status and send notification
  if (approved) {
    const { data: order } = await supabase
      .from(`${TABLE_PREFIX}_orders`)
      .update({ status: "refunded" })
      .eq("id", orderId)
      .select()
      .single();

    // Send refund notification to customer
    if (order?.customer_email && refundData) {
      const { notifyRefundIssued } =
        await import("@/lib/services/business-notifications");
      notifyRefundIssued(
        order.site_id,
        order.order_number,
        order.customer_email,
        order.customer_name || "Customer",
        formatCurrency(refundData.amount / 100, order.currency || "USD"),
        refundData.reason || undefined,
      ).catch((err) =>
        console.error("[OrderActions] Refund notification error:", err),
      );
    }

    // Emit automation event for refund
    logAutomationEvent(
      order?.site_id || "",
      "ecommerce.order.refunded",
      {
        order_id: orderId,
        refund_id: refundId,
        refund_amount: refundData?.amount,
        reason: refundData?.reason,
        customer_email: order?.customer_email,
        order_number: order?.order_number,
      },
      {
        sourceModule: "ecommerce",
        sourceEntityType: "order",
        sourceEntityId: orderId,
      },
    ).catch((err) =>
      console.error("[OrderActions] Automation event error:", err),
    );
  }

  return true;
}

// ============================================================================
// BULK ACTIONS
// ============================================================================

/**
 * Execute bulk action on orders
 */
export async function executeOrderBulkAction(
  siteId: string,
  action: OrderBulkAction,
  userId: string,
  userName: string,
): Promise<BulkActionResult> {
  const result: BulkActionResult = {
    success: true,
    affected: 0,
    errors: [],
  };

  if (action.orderIds.length === 0) {
    return { success: false, affected: 0, errors: ["No orders selected"] };
  }

  const supabase = await getModuleClient();

  switch (action.action) {
    case "update_status": {
      const newStatus = action.params?.status as OrderStatus;
      if (!newStatus) {
        return { success: false, affected: 0, errors: ["Status is required"] };
      }

      for (const orderId of action.orderIds) {
        const updateResult = await updateOrderStatus(
          siteId,
          orderId,
          newStatus,
          userId,
          userName,
        );
        if (updateResult.success) {
          result.affected++;
        } else {
          result.errors.push(`Order ${orderId}: ${updateResult.error}`);
        }
      }
      break;
    }

    case "archive": {
      const { error } = await supabase
        .from(`${TABLE_PREFIX}_orders`)
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("site_id", siteId)
        .in("id", action.orderIds);

      if (error) {
        result.success = false;
        result.errors.push(error.message);
      } else {
        result.affected = action.orderIds.length;
      }
      break;
    }

    case "export":
    case "print_invoices":
    case "print_labels":
      // These are handled client-side
      result.affected = action.orderIds.length;
      break;
  }

  return result;
}

// ============================================================================
// DOCUMENT GENERATION
// ============================================================================

/**
 * Generate invoice number
 */
export async function generateInvoiceNumber(
  siteId: string,
  orderId: string,
): Promise<string> {
  const supabase = await getModuleClient();

  // Get order to use order_number
  const { data: order } = await supabase
    .from(`${TABLE_PREFIX}_orders`)
    .select("order_number, created_at")
    .eq("id", orderId)
    .eq("site_id", siteId)
    .single();

  if (!order) {
    return `INV-${Date.now()}`;
  }

  const year = new Date(order.created_at).getFullYear();
  return `INV-${year}-${order.order_number}`;
}

/**
 * Send order notification email via Resend
 *
 * Fetches full order data and sends the appropriate branded email
 * to the customer and/or owner based on the email type.
 */
export async function sendOrderEmail(
  orderId: string,
  emailType:
    | "confirmation"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "refunded",
  userId: string,
  userName: string,
): Promise<boolean> {
  const supabase = await getModuleClient();

  try {
    // Fetch the order with site info
    const { data: order } = await supabase
      .from(`${TABLE_PREFIX}_orders`)
      .select("*, site_id")
      .eq("id", orderId)
      .single();

    if (!order) {
      console.error("[sendOrderEmail] Order not found:", orderId);
      return false;
    }

    // Get site and agency info for branding
    const adminClient = createAdminClient();
    const { data: site } = await adminClient
      .from("sites")
      .select("name, agency_id, subdomain, custom_domain")
      .eq("id", order.site_id)
      .single();

    const agencyId = site?.agency_id || null;
    const businessName = site?.name || "Our Store";
    const currency = order.currency || "USD";

    // Build storefront URL for customer email CTA buttons
    const siteUrl = site?.custom_domain
      ? `https://${site.custom_domain}`
      : site?.subdomain
        ? `https://${site.subdomain}.sites.dramacagency.com`
        : null;
    const orderUrl = siteUrl
      ? `${siteUrl}/order-confirmation?order=${orderId}`
      : undefined;
    const trackingUrlStorefront = siteUrl
      ? `${siteUrl}/order-tracking`
      : undefined;

    // Get order items for confirmation emails
    const { data: orderItems } = await supabase
      .from(`${TABLE_PREFIX}_order_items`)
      .select("product_name, quantity, unit_price, total_price")
      .eq("order_id", orderId);

    const formattedItems = (orderItems || []).map(
      (item: {
        product_name: string;
        quantity: number;
        unit_price: number;
        total_price: number;
      }) => ({
        name: item.product_name,
        quantity: item.quantity,
        price: formatCurrency(item.total_price / 100, currency),
      }),
    );

    // Map emailType to the branded email type and send
    switch (emailType) {
      case "confirmation": {
        if (order.customer_email) {
          await sendBrandedEmail(agencyId, {
            to: {
              email: order.customer_email,
              name: order.customer_name || undefined,
            },
            emailType: "order_confirmation_customer",
            siteId: order.site_id,
            data: {
              customerName: order.customer_name || "Customer",
              orderNumber: order.order_number,
              items: formattedItems,
              subtotal: formatCurrency((order.subtotal || 0) / 100, currency),
              shipping: formatCurrency(
                (order.shipping_amount || 0) / 100,
                currency,
              ),
              tax: formatCurrency((order.tax_amount || 0) / 100, currency),
              total: formatCurrency(order.total / 100, currency),
              shippingAddress: order.shipping_address
                ? `${order.shipping_address.address_line_1 || ""}${order.shipping_address.city ? `, ${order.shipping_address.city}` : ""}${order.shipping_address.country ? `, ${order.shipping_address.country}` : ""}`
                : "",
              orderUrl: orderUrl || undefined,
              trackingUrl: trackingUrlStorefront || undefined,
              businessName,
            },
          });
        }
        break;
      }
      case "shipped": {
        if (order.customer_email) {
          await sendBrandedEmail(agencyId, {
            to: {
              email: order.customer_email,
              name: order.customer_name || undefined,
            },
            emailType: "order_shipped_customer",
            siteId: order.site_id,
            data: {
              customerName: order.customer_name || "Customer",
              orderNumber: order.order_number,
              trackingNumber: order.tracking_number || "",
              trackingUrl: order.tracking_url || "",
              businessName,
            },
          });
        }
        break;
      }
      case "delivered": {
        if (order.customer_email) {
          await sendBrandedEmail(agencyId, {
            to: {
              email: order.customer_email,
              name: order.customer_name || undefined,
            },
            emailType: "order_delivered_customer",
            siteId: order.site_id,
            data: {
              customerName: order.customer_name || "Customer",
              orderNumber: order.order_number,
              orderUrl: orderUrl || undefined,
              businessName,
            },
          });
        }
        break;
      }
      case "cancelled": {
        if (order.customer_email) {
          await sendBrandedEmail(agencyId, {
            to: {
              email: order.customer_email,
              name: order.customer_name || undefined,
            },
            emailType: "order_cancelled_customer",
            siteId: order.site_id,
            data: {
              customerName: order.customer_name || "Customer",
              orderNumber: order.order_number,
              orderUrl: orderUrl || undefined,
              businessName,
            },
          });
        }
        break;
      }
      case "refunded": {
        if (order.customer_email) {
          await sendBrandedEmail(agencyId, {
            to: {
              email: order.customer_email,
              name: order.customer_name || undefined,
            },
            emailType: "refund_issued_customer",
            siteId: order.site_id,
            data: {
              customerName: order.customer_name || "Customer",
              orderNumber: order.order_number,
              refundAmount: formatCurrency(order.total / 100, currency),
              orderUrl: orderUrl || undefined,
              businessName,
            },
          });
        }
        break;
      }
    }

    // Add timeline event
    await supabase.from(`${TABLE_PREFIX}_order_timeline`).insert({
      order_id: orderId,
      event_type: "email_sent",
      title: `Email sent: ${emailType}`,
      created_by: userId,
      metadata: { email_type: emailType, actor_name: userName },
    });

    console.log(
      `[sendOrderEmail] ${emailType} email sent for order ${order.order_number}`,
    );
    return true;
  } catch (error) {
    console.error("[sendOrderEmail] Error sending email:", error);

    // Still log the timeline event even if email fails
    await supabase.from(`${TABLE_PREFIX}_order_timeline`).insert({
      order_id: orderId,
      event_type: "email_failed",
      title: `Email failed: ${emailType}`,
      created_by: userId,
      metadata: {
        email_type: emailType,
        actor_name: userName,
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return false;
  }
}
