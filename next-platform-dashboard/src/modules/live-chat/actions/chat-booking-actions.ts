"use server";

/**
 * Chat Booking Actions
 *
 * Lightweight server actions for managing bookings directly from the
 * live chat conversation view. Fetches booking context and proxies
 * booking management operations to the booking module.
 *
 * Pattern follows chat-order-actions.ts exactly.
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyUserSiteAccess } from "@/lib/multi-tenant/tenant-context";
import {
  notifyBookingConfirmed,
  notifyBookingCompleted,
  notifyBookingCancelled,
  notifyBookingNoShow,
  notifyBookingPaymentReceived,
} from "@/lib/services/business-notifications";
import {
  notifyChatBookingConfirmed,
  notifyChatBookingCancelled,
  notifyChatBookingCompleted,
  notifyChatBookingPaymentConfirmed,
} from "@/modules/live-chat/lib/chat-event-bridge";
import { logAutomationEvent } from "@/modules/automation/services/event-processor";
import { EVENT_REGISTRY } from "@/modules/automation/lib/event-types";
import { formatDate, formatTime, DEFAULT_CURRENCY } from "@/lib/locale-config";
import {
  dispatchNotification,
  dispatchChatNotification,
} from "@/lib/notifications/automation-aware-dispatcher";

const BOOKING_PREFIX = "mod_bookmod01";

// =============================================================================
// TYPES
// =============================================================================

export interface ChatBookingContext {
  id: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerNotes: string | null;
  status: string;
  paymentStatus: string;
  paymentAmount: number | null;
  startTime: string;
  endTime: string;
  timezone: string;
  createdAt: string;
  service: {
    id: string;
    name: string;
    price: number;
    currency: string;
    durationMinutes: number;
    color: string;
  } | null;
  staff: {
    id: string;
    name: string;
    email: string | null;
    avatarUrl: string | null;
  } | null;
  cancellationReason: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  cancelledByAgentName: string | null;
  // Booking settings relevant to agent actions
  requirePayment: boolean;
  autoConfirm: boolean;
}

// =============================================================================
// FETCH BOOKING CONTEXT FOR CHAT
// =============================================================================

/**
 * Fetch a lightweight booking context by appointment ID for the chat sidebar.
 * Returns null if not found or user not authenticated.
 */
export async function getBookingContextForChat(
  siteId: string,
  bookingId: string,
): Promise<ChatBookingContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const hasAccess = await verifyUserSiteAccess(user.id, siteId);
  if (!hasAccess) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: appointment } = await db
    .from(`${BOOKING_PREFIX}_appointments`)
    .select(
      `
      id, customer_name, customer_email, customer_phone, customer_notes,
      status, payment_status, payment_amount,
      start_time, end_time, timezone, created_at,
      cancellation_reason, cancelled_at, cancelled_by, cancelled_by_agent_name,
      service:${BOOKING_PREFIX}_services(id, name, price, currency, duration_minutes, color),
      staff:${BOOKING_PREFIX}_staff(id, name, email, avatar_url)
    `,
    )
    .eq("site_id", siteId)
    .eq("id", bookingId)
    .single();

  if (!appointment) return null;

  // Fetch booking settings for this site (require_payment, auto_confirm)
  const { data: settings } = await db
    .from(`${BOOKING_PREFIX}_settings`)
    .select("require_payment, auto_confirm")
    .eq("site_id", siteId)
    .single();

  return {
    id: appointment.id,
    customerName: appointment.customer_name,
    customerEmail: appointment.customer_email,
    customerPhone: appointment.customer_phone,
    customerNotes: appointment.customer_notes,
    status: appointment.status,
    paymentStatus: appointment.payment_status,
    paymentAmount: appointment.payment_amount,
    startTime: appointment.start_time,
    endTime: appointment.end_time,
    timezone: appointment.timezone,
    createdAt: appointment.created_at,
    service: appointment.service
      ? {
          id: appointment.service.id,
          name: appointment.service.name,
          price: appointment.service.price,
          currency: appointment.service.currency,
          durationMinutes: appointment.service.duration_minutes,
          color: appointment.service.color,
        }
      : null,
    staff: appointment.staff
      ? {
          id: appointment.staff.id,
          name: appointment.staff.name,
          email: appointment.staff.email,
          avatarUrl: appointment.staff.avatar_url,
        }
      : null,
    cancellationReason: appointment.cancellation_reason,
    cancelledAt: appointment.cancelled_at,
    cancelledBy: appointment.cancelled_by,
    cancelledByAgentName: appointment.cancelled_by_agent_name ?? null,
    requirePayment: settings?.require_payment ?? false,
    autoConfirm: settings?.auto_confirm ?? false,
  };
}

// =============================================================================
// UPDATE BOOKING STATUS FROM CHAT
// =============================================================================

/**
 * Update an appointment's status directly from the chat panel.
 * Sends email notifications and chat notifications on status change.
 */
export async function updateBookingStatusFromChat(
  siteId: string,
  bookingId: string,
  newStatus: string,
  options?: {
    cancellationReason?: string;
    agentName?: string;
    conversationId?: string;
  },
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const hasAccess = await verifyUserSiteAccess(user.id, siteId);
  if (!hasAccess) return { error: "Access denied" };

  // Use admin client for DB operations — the UPDATE RLS policy's agency_members
  // JOIN excludes super-admins who pass can_access_site() but aren't in agency_members.
  // Access is already verified above via verifyUserSiteAccess.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;

  const validStatuses = [
    "pending",
    "confirmed",
    "completed",
    "cancelled",
    "no_show",
  ];
  if (!validStatuses.includes(newStatus)) {
    return { error: `Invalid status: ${newStatus}` };
  }

  // ── Payment enforcement: block confirmation of unpaid bookings ──
  // Same rule as booking-actions.ts:updateAppointment. If require_payment=true
  // and payment_status is pending, confirmation must be refused — otherwise
  // the customer would get a "slot confirmed" email while still owing payment.
  if (newStatus === "confirmed") {
    const { data: current } = await db
      .from(`${BOOKING_PREFIX}_appointments`)
      .select("payment_status")
      .eq("site_id", siteId)
      .eq("id", bookingId)
      .single();

    const { data: settings } = await db
      .from(`${BOOKING_PREFIX}_settings`)
      .select("require_payment")
      .eq("site_id", siteId)
      .single();

    const requirePayment = settings?.require_payment === true;
    const currentPaymentStatus = current?.payment_status;

    if (
      requirePayment &&
      currentPaymentStatus !== "paid" &&
      currentPaymentStatus !== "not_required"
    ) {
      return {
        error:
          "Cannot confirm booking: payment is required but has not been received. Please collect payment before confirming this appointment.",
      };
    }
  }

  // Cancellation enforcement — cancelled_by must be one of: customer|staff|system
  // (DB CHECK constraint). "admin" (legacy default) violates the constraint.
  const updates: Record<string, unknown> = { status: newStatus };

  if (newStatus === "cancelled") {
    updates.cancelled_at = new Date().toISOString();
    updates.cancelled_by = "staff";
    updates.cancelled_by_agent_name = options?.agentName || null;
    updates.cancellation_reason =
      options?.cancellationReason?.trim() || "Cancelled via live chat";
  }

  // Update and return full appointment with service/staff for notifications
  const { data: appointment, error } = await db
    .from(`${BOOKING_PREFIX}_appointments`)
    .update(updates)
    .eq("site_id", siteId)
    .eq("id", bookingId)
    .select(
      `
      *,
      service:${BOOKING_PREFIX}_services(name, price, duration_minutes, currency),
      staff:${BOOKING_PREFIX}_staff(name)
    `,
    )
    .single();

  if (error) {
    console.error("[ChatBooking] updateStatus error:", error);
    return { error: error.message };
  }

  // Fire notifications async (don't block the response)
  const serviceName = appointment?.service?.name || "Service";
  const servicePrice = appointment?.service?.price || 0;
  const serviceDuration = appointment?.service?.duration_minutes || 30;
  const staffName = appointment?.staff?.name;
  const customerName = appointment?.customer_name || "Customer";
  const customerEmail = appointment?.customer_email || "";
  const currency = appointment?.service?.currency;
  const startTime = new Date(appointment?.start_time);
  const endTime = appointment?.end_time
    ? new Date(appointment.end_time)
    : undefined;
  const paymentStatus = appointment?.payment_status;

  const startFmt = startTime.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeFmt = startTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const notificationData = {
    siteId,
    appointmentId: bookingId,
    serviceName,
    servicePrice,
    serviceDuration,
    staffName,
    customerName,
    customerEmail,
    startTime,
    endTime,
    currency,
    paymentStatus,
    changedBy: options?.agentName || "Agent",
  };

  if (newStatus === "confirmed") {
    logAutomationEvent(
      siteId,
      EVENT_REGISTRY.booking.appointment.confirmed,
      {
        appointmentId: bookingId,
        serviceName,
        customerName,
        customerEmail,
        startTime: startTime.toISOString(),
        start_date_formatted: formatDate(startTime),
        start_time_formatted: formatTime(startTime),
        staffName,
      },
      {
        sourceModule: "booking",
        sourceEntityType: "appointment",
        sourceEntityId: bookingId,
      },
    ).catch((err) =>
      console.error("[ChatBooking] Automation event error:", err),
    );
    // Email notifications
    dispatchNotification({
      siteId,
      eventType: "booking.appointment.confirmed",
      notificationFunction: () => notifyBookingConfirmed(notificationData),
    }).catch((err) =>
      console.error("[ChatBooking] Confirm notification error:", err),
    );
    // Chat notification
    if (customerEmail) {
      dispatchChatNotification({
        siteId,
        eventType: "booking.appointment.confirmed",
        chatFunction: () =>
          notifyChatBookingConfirmed(
            siteId,
            customerEmail,
            serviceName,
            startFmt,
            timeFmt,
          ),
      }).catch((err) =>
        console.error("[ChatBooking] Chat confirm notify error:", err),
      );
    }
  } else if (newStatus === "completed") {
    logAutomationEvent(
      siteId,
      EVENT_REGISTRY.booking.appointment.completed,
      {
        appointmentId: bookingId,
        serviceName,
        customerName,
        customerEmail,
        startTime: startTime.toISOString(),
        start_date_formatted: formatDate(startTime),
        start_time_formatted: formatTime(startTime),
        staffName,
      },
      {
        sourceModule: "booking",
        sourceEntityType: "appointment",
        sourceEntityId: bookingId,
      },
    ).catch((err) =>
      console.error("[ChatBooking] Automation event error:", err),
    );
    dispatchNotification({
      siteId,
      eventType: "booking.appointment.completed",
      notificationFunction: () => notifyBookingCompleted(notificationData),
    }).catch((err) =>
      console.error("[ChatBooking] Complete notification error:", err),
    );
    if (customerEmail) {
      dispatchChatNotification({
        siteId,
        eventType: "booking.appointment.completed",
        chatFunction: () =>
          notifyChatBookingCompleted(siteId, customerEmail, serviceName),
      }).catch((err) =>
        console.error("[ChatBooking] Chat complete notify error:", err),
      );
    }
  } else if (newStatus === "cancelled") {
    logAutomationEvent(
      siteId,
      EVENT_REGISTRY.booking.appointment.cancelled,
      {
        appointmentId: bookingId,
        serviceName,
        customerName,
        customerEmail,
        startTime: startTime.toISOString(),
        start_date_formatted: formatDate(startTime),
        start_time_formatted: formatTime(startTime),
        staffName,
        reason:
          options?.cancellationReason?.trim() || "Cancelled via live chat",
      },
      {
        sourceModule: "booking",
        sourceEntityType: "appointment",
        sourceEntityId: bookingId,
      },
    ).catch((err) =>
      console.error("[ChatBooking] Automation event error:", err),
    );
    dispatchNotification({
      siteId,
      eventType: "booking.appointment.cancelled",
      notificationFunction: () =>
        notifyBookingCancelled({
          siteId,
          appointmentId: bookingId,
          serviceName,
          servicePrice,
          serviceDuration,
          staffName,
          customerName,
          customerEmail,
          startTime,
          cancelledBy: "staff",
          reason:
            options?.cancellationReason?.trim() || "Cancelled via live chat",
          currency,
        }),
    }).catch((err) =>
      console.error("[ChatBooking] Cancel notification error:", err),
    );
    if (customerEmail) {
      dispatchChatNotification({
        siteId,
        eventType: "booking.appointment.cancelled",
        chatFunction: () =>
          notifyChatBookingCancelled(
            siteId,
            customerEmail,
            serviceName,
            options?.cancellationReason?.trim(),
          ),
      }).catch((err) =>
        console.error("[ChatBooking] Chat cancel notify error:", err),
      );
    }
  } else if (newStatus === "no_show") {
    logAutomationEvent(
      siteId,
      EVENT_REGISTRY.booking.appointment.no_show,
      {
        appointmentId: bookingId,
        serviceName,
        customerName,
        customerEmail,
        startTime: startTime.toISOString(),
        staffName,
      },
      {
        sourceModule: "booking",
        sourceEntityType: "appointment",
        sourceEntityId: bookingId,
      },
    ).catch((err) =>
      console.error("[ChatBooking] Automation event error:", err),
    );
    dispatchNotification({
      siteId,
      eventType: "booking.appointment.no_show",
      notificationFunction: () => notifyBookingNoShow(notificationData),
    }).catch((err) =>
      console.error("[ChatBooking] No-show notification error:", err),
    );
  }

  // ── Agent activity message in chat timeline ────────────────────────────────
  // When an agent performs the action from the chat panel and a conversationId
  // is provided, insert a system-attributed activity record so the full team
  // can see exactly who changed the booking status and why.
  if (options?.conversationId && options?.agentName) {
    const actor = options.agentName;
    let activityContent: string;

    switch (newStatus) {
      case "cancelled": {
        const finalReason =
          options.cancellationReason?.trim() || "No reason provided";
        activityContent = `${actor} cancelled this booking — Reason: "${finalReason}"`;
        break;
      }
      case "confirmed":
        activityContent = `${actor} confirmed this booking`;
        break;
      case "completed":
        activityContent = `${actor} marked this booking as completed`;
        break;
      case "no_show":
        activityContent = `${actor} marked this booking as no-show`;
        break;
      default:
        activityContent = `${actor} changed booking status to ${newStatus}`;
    }

    db.from("mod_chat_messages")
      .insert({
        conversation_id: options.conversationId,
        site_id: siteId,
        sender_type: "system",
        sender_name: actor,
        content: activityContent,
        content_type: "system",
      })
      .then(() => {})
      .catch((err: unknown) =>
        console.error("[ChatBooking] Activity message error:", err),
      );
  }

  return {};
}

// =============================================================================
// UPDATE PAYMENT STATUS FROM CHAT
// =============================================================================

/**
 * Update an appointment's payment status directly from the chat panel.
 * Sends payment confirmation notifications when payment is marked as paid.
 */
export async function updateBookingPaymentFromChat(
  siteId: string,
  bookingId: string,
  paymentStatus: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const hasAccess = await verifyUserSiteAccess(user.id, siteId);
  if (!hasAccess) return { error: "Access denied" };

  // Use admin client for DB operations — same reason as updateBookingStatusFromChat.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;

  const validStatuses = ["pending", "paid", "refunded", "not_required"];
  if (!validStatuses.includes(paymentStatus)) {
    return { error: `Invalid payment status: ${paymentStatus}` };
  }

  // Update and return full appointment with service/staff for notifications
  const { data: appointment, error } = await db
    .from(`${BOOKING_PREFIX}_appointments`)
    .update({ payment_status: paymentStatus })
    .eq("site_id", siteId)
    .eq("id", bookingId)
    .select(
      `
      *,
      service:${BOOKING_PREFIX}_services(name, price, duration_minutes, currency),
      staff:${BOOKING_PREFIX}_staff(name)
    `,
    )
    .single();

  if (error) {
    console.error("[ChatBooking] updatePayment error:", error);
    return { error: error.message };
  }

  // Send payment confirmation notifications when marked as paid
  if (paymentStatus === "paid" && appointment) {
    const serviceName = appointment.service?.name || "Service";
    const servicePrice = appointment.service?.price || 0;
    const serviceDuration = appointment.service?.duration_minutes || 30;
    const staffName = appointment.staff?.name;
    const customerName = appointment.customer_name || "Customer";
    const customerEmail = appointment.customer_email || "";
    const currency = appointment.service?.currency;
    const startTime = new Date(appointment.start_time);
    const endTime = appointment.end_time
      ? new Date(appointment.end_time)
      : undefined;

    logAutomationEvent(
      siteId,
      EVENT_REGISTRY.booking.appointment.payment_received,
      {
        appointmentId: bookingId,
        serviceName,
        servicePrice,
        customerName,
        customerEmail,
        startTime: startTime.toISOString(),
        staffName,
        currency,
      },
      {
        sourceModule: "booking",
        sourceEntityType: "appointment",
        sourceEntityId: bookingId,
      },
    ).catch((err) =>
      console.error("[ChatBooking] Automation event error:", err),
    );

    dispatchNotification({
      siteId,
      eventType: "booking.appointment.payment_received",
      notificationFunction: () =>
        notifyBookingPaymentReceived({
          siteId,
          appointmentId: bookingId,
          serviceName,
          servicePrice,
          serviceDuration,
          staffName,
          customerName,
          customerEmail,
          startTime,
          endTime,
          currency,
          paymentStatus: "paid",
          changedBy: "Agent",
        }),
    }).catch((err) =>
      console.error("[ChatBooking] Payment notification error:", err),
    );

    if (customerEmail) {
      const priceStr =
        servicePrice > 0
          ? `${currency || DEFAULT_CURRENCY} ${servicePrice.toFixed(2)}`
          : "your payment";
      dispatchChatNotification({
        siteId,
        eventType: "booking.appointment.payment_received",
        chatFunction: () =>
          notifyChatBookingPaymentConfirmed(
            siteId,
            customerEmail,
            serviceName,
            priceStr,
          ),
      }).catch((err) =>
        console.error("[ChatBooking] Chat payment notify error:", err),
      );
    }
  }

  return {};
}
// =============================================================================
// REVIEW BOOKING PAYMENT PROOF
// =============================================================================

/**
 * Approve or reject payment proof for a booking appointment.
 * Called from the live chat dashboard when the agent reviews the uploaded proof.
 *
 * - approved: sets payment_status to "paid", emits payment_received event,
 *   sends confirmation notifications and chat message.
 * - rejected: emits proof_rejected event, sends rejection message in chat.
 */
export async function updateBookingPaymentProofStatus(
  siteId: string,
  bookingId: string,
  status: "approved" | "rejected",
  options?: { reason?: string },
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const hasAccess = await verifyUserSiteAccess(user.id, siteId);
  if (!hasAccess) return { error: "Access denied" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Fetch booking with service details
  const { data: appointment, error: fetchErr } = await db
    .from(`${BOOKING_PREFIX}_appointments`)
    .select(
      `
      id, payment_status, payment_amount, customer_name, customer_email, metadata, start_time,
      service:${BOOKING_PREFIX}_services(name, price, currency, duration_minutes),
      staff:${BOOKING_PREFIX}_staff(name)
    `,
    )
    .eq("site_id", siteId)
    .eq("id", bookingId)
    .single();

  if (fetchErr || !appointment) {
    return { error: "Booking not found" };
  }

  const existingMeta = (appointment.metadata || {}) as Record<string, unknown>;
  const proof = existingMeta.payment_proof as
    | Record<string, unknown>
    | undefined;
  if (!proof) {
    return { error: "No payment proof uploaded for this booking" };
  }

  const serviceName = appointment.service?.name || "Appointment";
  const customerEmail = appointment.customer_email || "";
  const customerName = appointment.customer_name || "Customer";
  const currency = appointment.service?.currency || DEFAULT_CURRENCY;
  const paymentAmount =
    appointment.payment_amount || appointment.service?.price || 0;
  const priceStr = `${currency} ${paymentAmount.toFixed(2)}`;

  if (status === "approved") {
    // Mark payment as paid and update proof status
    const updatedMetadata = {
      ...existingMeta,
      payment_proof: {
        ...proof,
        status: "confirmed",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      },
    };

    await db
      .from(`${BOOKING_PREFIX}_appointments`)
      .update({
        payment_status: "paid",
        metadata: updatedMetadata,
      })
      .eq("id", bookingId);

    // Emit payment_received automation event
    const startTime = new Date(appointment.start_time);
    logAutomationEvent(
      siteId,
      EVENT_REGISTRY.booking.appointment.payment_received,
      {
        appointmentId: bookingId,
        serviceName,
        customerName,
        customerEmail,
        startTime: startTime.toISOString(),
        start_date_formatted: formatDate(startTime),
        start_time_formatted: formatTime(startTime),
        paymentAmount,
        currency,
        staffName: appointment.staff?.name,
      },
      {
        sourceModule: "booking",
        sourceEntityType: "appointment",
        sourceEntityId: bookingId,
      },
    ).catch((err) =>
      console.error(
        "[ChatBooking] Payment proof approval automation error:",
        err,
      ),
    );

    // Also emit proof_approved event
    logAutomationEvent(
      siteId,
      EVENT_REGISTRY.booking.payment.proof_approved,
      {
        appointmentId: bookingId,
        serviceName,
        customerName,
        customerEmail,
        paymentAmount,
        currency,
      },
      {
        sourceModule: "booking",
        sourceEntityType: "appointment",
        sourceEntityId: bookingId,
      },
    ).catch((err) =>
      console.error("[ChatBooking] Proof approved event error:", err),
    );

    // Send payment confirmation notifications
    dispatchNotification({
      siteId,
      eventType: "booking.appointment.payment_received",
      notificationFunction: () =>
        notifyBookingPaymentReceived({
          siteId,
          appointmentId: bookingId,
          serviceName,
          servicePrice: paymentAmount,
          serviceDuration: appointment.service?.duration_minutes || 30,
          staffName: appointment.staff?.name,
          customerName,
          customerEmail,
          startTime,
          currency,
          paymentStatus: "paid",
          changedBy: "Agent",
        }),
    }).catch((err) =>
      console.error("[ChatBooking] Payment confirm notification error:", err),
    );

    // Send chat confirmation message
    if (customerEmail) {
      dispatchChatNotification({
        siteId,
        eventType: "booking.appointment.payment_received",
        chatFunction: () =>
          notifyChatBookingPaymentConfirmed(
            siteId,
            customerEmail,
            serviceName,
            priceStr,
          ),
      }).catch((err) =>
        console.error("[ChatBooking] Chat payment confirm notify error:", err),
      );
    }
  } else {
    // Rejected — update proof status
    const updatedMetadata = {
      ...existingMeta,
      payment_proof: {
        ...proof,
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        rejection_reason: options?.reason || undefined,
      },
    };

    await db
      .from(`${BOOKING_PREFIX}_appointments`)
      .update({ metadata: updatedMetadata })
      .eq("id", bookingId);

    // Emit proof_rejected event
    logAutomationEvent(
      siteId,
      EVENT_REGISTRY.booking.payment.proof_rejected,
      {
        appointmentId: bookingId,
        serviceName,
        customerName,
        customerEmail,
        reason: options?.reason || "Payment proof could not be verified",
      },
      {
        sourceModule: "booking",
        sourceEntityType: "appointment",
        sourceEntityId: bookingId,
      },
    ).catch((err) =>
      console.error("[ChatBooking] Proof rejected event error:", err),
    );

    // Send rejection message in chat
    if (customerEmail) {
      import("@/modules/live-chat/lib/chat-event-bridge")
        .then(({ notifyChatBookingPaymentRejected }) =>
          notifyChatBookingPaymentRejected(
            siteId,
            customerEmail,
            serviceName,
            options?.reason,
          ),
        )
        .catch((err) =>
          console.error("[ChatBooking] Chat payment reject notify error:", err),
        );
    }
  }

  return {};
}
