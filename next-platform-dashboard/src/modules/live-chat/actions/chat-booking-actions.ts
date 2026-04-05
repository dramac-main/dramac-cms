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
import { verifyUserSiteAccess } from "@/lib/multi-tenant/tenant-context";

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
      cancellation_reason, cancelled_at, cancelled_by,
      service:${BOOKING_PREFIX}_services(id, name, price, currency, duration_minutes, color),
      staff:${BOOKING_PREFIX}_staff(id, name, email, avatar_url)
    `,
    )
    .eq("site_id", siteId)
    .eq("id", bookingId)
    .single();

  if (!appointment) return null;

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
  };
}

// =============================================================================
// UPDATE BOOKING STATUS FROM CHAT
// =============================================================================

/**
 * Update an appointment's status directly from the chat panel.
 */
export async function updateBookingStatusFromChat(
  siteId: string,
  bookingId: string,
  newStatus: string,
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

  const updates: Record<string, unknown> = { status: newStatus };

  if (newStatus === "cancelled") {
    updates.cancelled_at = new Date().toISOString();
    updates.cancelled_by = "admin";
    updates.cancellation_reason = "Cancelled via live chat";
  }

  const { error } = await db
    .from(`${BOOKING_PREFIX}_appointments`)
    .update(updates)
    .eq("site_id", siteId)
    .eq("id", bookingId);

  if (error) {
    console.error("[ChatBooking] updateStatus error:", error);
    return { error: error.message };
  }

  return {};
}

// =============================================================================
// UPDATE PAYMENT STATUS FROM CHAT
// =============================================================================

/**
 * Update an appointment's payment status directly from the chat panel.
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const validStatuses = ["pending", "paid", "refunded", "not_required"];
  if (!validStatuses.includes(paymentStatus)) {
    return { error: `Invalid payment status: ${paymentStatus}` };
  }

  const { error } = await db
    .from(`${BOOKING_PREFIX}_appointments`)
    .update({ payment_status: paymentStatus })
    .eq("site_id", siteId)
    .eq("id", bookingId);

  if (error) {
    console.error("[ChatBooking] updatePayment error:", error);
    return { error: error.message };
  }

  return {};
}
