/**
 * Business Notifications Service
 *
 * Handles sending notifications AND emails for business-critical events:
 * - New bookings → notify business owner + email customer
 * - New orders → notify business owner + email customer
 * - Booking/order status changes → email customer
 * - Quote requests → notify business owner + email customer
 * - Quote accepted/rejected → notify both parties
 *
 * This ensures the business owner NEVER misses a booking, order, or quote.
 */
"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendBrandedEmail } from "@/lib/email/send-branded-email";
import { createNotification } from "@/lib/services/notifications";
import { DOMAINS } from "@/lib/constants/domains";
import { formatCurrency, formatDate, formatTime } from "@/lib/locale-config";
import {
  shouldSendEmail,
  shouldSendInApp,
} from "@/lib/services/notification-channel-resolver";
import type { NotificationTemplateType } from "@/modules/ecommerce/types/ecommerce-types";
// Portal Session 2A: route every business event through the dispatcher so
// portal users (not just the agency owner) receive the notification when
// they have the relevant permission flag. The dispatcher handles dedupe,
// preferences, structured logging, and per-channel routing.
import { dispatchBusinessEvent } from "@/lib/portal/notification-dispatcher";

// =============================================================================
// WEB PUSH HELPER
// =============================================================================

/**
 * Fire a web push notification to the business owner (the dashboard user).
 * Fire-and-forget — never blocks, never throws. Used alongside createNotification()
 * and sendBrandedEmail() so every business-critical event reaches the owner via:
 *   1. In-app bell (createNotification)
 *   2. Email (sendBrandedEmail)
 *   3. Web push — pops up in the OS/browser even when the tab is closed (pushToOwner)
 */
async function pushToOwner(
  ownerUserId: string,
  payload: {
    title: string;
    body: string;
    url?: string;
    tag?: string;
    type?: "chat" | "notification" | "general";
  },
): Promise<void> {
  if (!ownerUserId) return;
  try {
    const mod = await import("@/lib/actions/web-push");
    await mod.sendPushToUser(ownerUserId, {
      title: payload.title,
      body: payload.body,
      url: payload.url,
      tag: payload.tag,
      type: payload.type || "notification",
      renotify: true,
    });
  } catch (err) {
    // Never let push errors break the main flow
    console.error("[BusinessNotify] pushToOwner error:", err);
  }
}

// =============================================================================
// TYPES
// =============================================================================

interface BookingNotificationData {
  siteId: string;
  appointmentId: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  staffName?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  startTime: Date;
  endTime: Date;
  status: "pending" | "confirmed";
  currency?: string;
  timezone?: string;
  paymentStatus?: string;
}

interface BookingCancellationData {
  siteId: string;
  appointmentId: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  staffName?: string;
  customerName: string;
  customerEmail: string;
  startTime: Date;
  cancelledBy: "customer" | "staff" | "system";
  reason?: string;
  currency?: string;
}

interface BookingStatusChangeData {
  siteId: string;
  appointmentId: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  staffName?: string;
  customerName: string;
  customerEmail: string;
  startTime: Date;
  endTime?: Date;
  currency?: string;
  paymentStatus?: string;
  changedBy?: string;
}

interface OrderNotificationData {
  siteId: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: Array<{ name: string; quantity: number; unitPrice: number }>;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  paymentStatus: string;
  paymentProvider?: string;
  manualPaymentInstructions?: string;
  shippingAddress?: string;
}

// =============================================================================
// OWNER RESOLUTION HELPER
// =============================================================================

/**
 * Resolve the correct business owner contact for a site.
 *
 * Multi-tenant routing logic:
 * - Each site belongs to an agency AND has a client (the actual business owner)
 * - Email notifications go to the CLIENT's email (the person who owns the business)
 * - Falls back to the agency owner's email only if the client has no email set
 * - In-app notifications always go to the agency owner (they have dashboard access)
 *
 * Resolution chain:
 *   sites.client_id → clients.email  (preferred — actual business owner)
 *   sites.agency_id → agencies.owner_id → profiles.email  (fallback)
 */
interface BusinessOwnerInfo {
  siteName: string;
  agencyId: string;
  agencyOwnerId: string;
  /** Email for notifications — prefers client email, falls back to agency owner */
  ownerEmail: string | null;
  /** Name for notifications — prefers client name, falls back to agency owner */
  ownerName: string | null;
  /** Site subdomain (for building storefront URLs) */
  siteSubdomain: string | null;
  /** Site custom domain (for building storefront URLs) */
  siteCustomDomain: string | null;
}

async function resolveBusinessOwner(
  supabase: ReturnType<typeof createAdminClient>,
  siteId: string,
): Promise<BusinessOwnerInfo | null> {
  const { data: site } = await supabase
    .from("sites")
    .select("name, agency_id, client_id, subdomain, custom_domain")
    .eq("id", siteId)
    .single();

  if (!site) {
    console.error("[BusinessNotify] Site not found:", siteId);
    return null;
  }

  // 1. Resolve client (the actual business/site owner) if available
  let clientEmail: string | null = null;
  let clientName: string | null = null;
  if (site.client_id) {
    const { data: client } = await supabase
      .from("clients")
      .select("email, name")
      .eq("id", site.client_id)
      .single();
    clientEmail = client?.email || null;
    clientName = client?.name || null;
  }

  // 2. Always resolve agency owner (needed for in-app notifications + email fallback)
  const { data: agency } = await supabase
    .from("agencies")
    .select("owner_id")
    .eq("id", site.agency_id)
    .single();

  if (!agency?.owner_id) {
    console.error("[BusinessNotify] Agency owner not found for site:", siteId);
    return null;
  }

  const { data: ownerProfile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", agency.owner_id)
    .single();

  return {
    siteName: site.name || "Business",
    agencyId: site.agency_id,
    agencyOwnerId: agency.owner_id,
    // Prefer client email (actual business owner), fall back to agency owner
    ownerEmail: clientEmail || ownerProfile?.email || null,
    ownerName: clientName || ownerProfile?.full_name || null,
    siteSubdomain: site.subdomain || null,
    siteCustomDomain: site.custom_domain || null,
  };
}

// =============================================================================
// BOOKING NOTIFICATIONS
// =============================================================================

/**
 * Send all notifications for a new booking:
 * 1. In-app notification to business owner
 * 2. Email to business owner
 * 3. Email to customer (confirmation/pending)
 *
 * Runs async - does not block the booking creation response
 */
export async function notifyNewBooking(
  data: BookingNotificationData,
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const owner = await resolveBusinessOwner(supabase, data.siteId);
    if (!owner) return;

    const businessName = owner.siteName || "Our Business";
    const currency = data.currency || "USD";
    const dateStr = formatDate(data.startTime);
    const timeStr = formatTime(data.startTime);
    const priceStr = formatCurrency(data.servicePrice, currency);
    const durationStr =
      data.serviceDuration >= 60
        ? `${Math.floor(data.serviceDuration / 60)}h ${data.serviceDuration % 60 > 0 ? `${data.serviceDuration % 60}m` : ""}`
        : `${data.serviceDuration}m`;
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/dashboard/sites/${data.siteId}/booking`;

    // Portal dispatch: agency owner + portal users with canManageBookings.
    await dispatchBusinessEvent({
      eventType: "new_booking",
      siteTemplateType:
        "booking_confirmation_owner" as NotificationTemplateType,
      permission: "canManageBookings",
      siteId: data.siteId,
      resourceType: "appointment",
      resourceId: data.appointmentId,
      title: `New Booking: ${data.serviceName}`,
      message: `${data.customerName} booked ${data.serviceName} for ${dateStr} at ${timeStr} (${priceStr})`,
      link: dashboardUrl,
      metadata: {
        appointmentId: data.appointmentId,
        siteId: data.siteId,
        customerEmail: data.customerEmail,
      },
      push: {
        title: `New Booking: ${data.serviceName}`,
        body: `${data.customerName} — ${dateStr} at ${timeStr} (${priceStr})`,
        url: dashboardUrl,
        tag: `booking-${data.appointmentId}`,
      },
      email: {
        emailType: "booking_confirmation_owner",
        data: {
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone || "",
          serviceName: data.serviceName,
          staffName: data.staffName || "",
          date: dateStr,
          time: timeStr,
          duration: durationStr,
          price: priceStr,
          status: data.status,
          paymentStatus: data.paymentStatus || "not_required",
          dashboardUrl,
          bookingId: data.appointmentId,
        },
      },
    });

    // Customer email (site-branded) — NOT a portal dispatch; customer is not
    // a portal recipient. Kept on the original path.
    if (
      data.customerEmail &&
      (await shouldSendEmail(
        data.siteId,
        "booking_confirmation_customer" as NotificationTemplateType,
      ))
    ) {
      await sendBrandedEmail(owner.agencyId, {
        to: { email: data.customerEmail, name: data.customerName },
        emailType: "booking_confirmation_customer",
        siteId: data.siteId,
        data: {
          customerName: data.customerName,
          serviceName: data.serviceName,
          staffName: data.staffName || "",
          date: dateStr,
          time: timeStr,
          duration: durationStr,
          price: priceStr,
          status: data.status,
          paymentStatus: data.paymentStatus || "not_required",
          paymentRequired: data.paymentStatus === "pending",
          businessName,
          bookingId: data.appointmentId,
        },
      });
    }

    console.log(
      `[BusinessNotify] Booking notifications sent for appointment ${data.appointmentId}`,
    );
  } catch (error) {
    // Never let notification errors break the main flow
    console.error(
      "[BusinessNotify] Error sending booking notifications:",
      error,
    );
  }
}

// =============================================================================
// BOOKING CANCELLATION NOTIFICATIONS
// =============================================================================

/**
 * Send all notifications for a cancelled booking:
 * 1. In-app notification to business owner (if cancelled by client)
 * 2. Email to business owner
 * 3. Email to customer (confirmation of cancellation)
 *
 * Runs async - does not block the cancellation response
 */
export async function notifyBookingCancelled(
  data: BookingCancellationData,
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const owner = await resolveBusinessOwner(supabase, data.siteId);
    if (!owner) return;

    const businessName = owner.siteName || "Our Business";
    const currency = data.currency || "USD";
    const dateStr = formatDate(data.startTime);
    const timeStr = formatTime(data.startTime);
    const priceStr = formatCurrency(data.servicePrice, currency);
    const durationStr =
      data.serviceDuration >= 60
        ? `${Math.floor(data.serviceDuration / 60)}h ${data.serviceDuration % 60 > 0 ? `${data.serviceDuration % 60}m` : ""}`
        : `${data.serviceDuration}m`;
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/dashboard/sites/${data.siteId}/booking`;

    // 1. In-app notification to business owner
    if (
      await shouldSendInApp(
        data.siteId,
        "booking_cancelled_owner" as NotificationTemplateType,
      )
    ) {
      await createNotification({
        userId: owner.agencyOwnerId,
        type: "booking_cancelled",
        title: `Booking Cancelled: ${data.serviceName}`,
        message: `${data.customerName}'s booking for ${data.serviceName} on ${dateStr} at ${timeStr} has been cancelled${data.reason ? `: ${data.reason}` : ""}.`,
        link: dashboardUrl,
        metadata: {
          appointmentId: data.appointmentId,
          siteId: data.siteId,
          cancelledBy: data.cancelledBy,
        },
      });

      // Web push — surfaces on OS/browser even when tab is closed
      pushToOwner(owner.agencyOwnerId, {
        title: `Booking Cancelled: ${data.serviceName}`,
        body: `${data.customerName} — ${dateStr} at ${timeStr}${data.reason ? ` (${data.reason})` : ""}`,
        url: dashboardUrl,
        tag: `booking-${data.appointmentId}`,
      }).catch(() => {});
    }

    // 2. Email to business owner
    if (
      owner.ownerEmail &&
      (await shouldSendEmail(
        data.siteId,
        "booking_cancelled_owner" as NotificationTemplateType,
      ))
    ) {
      await sendBrandedEmail(owner.agencyId, {
        to: {
          email: owner.ownerEmail,
          name: owner.ownerName || undefined,
        },
        emailType: "booking_cancelled_owner",
        recipientUserId: owner.agencyOwnerId,
        data: {
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          serviceName: data.serviceName,
          staffName: data.staffName || "",
          date: dateStr,
          time: timeStr,
          duration: durationStr,
          price: priceStr,
          cancelledBy: data.cancelledBy,
          reason: data.reason || "",
          dashboardUrl,
          bookingId: data.appointmentId,
        },
      });
    }

    // 3. Email to customer (uses SITE branding)
    if (
      data.customerEmail &&
      (await shouldSendEmail(
        data.siteId,
        "booking_cancelled_customer" as NotificationTemplateType,
      ))
    ) {
      await sendBrandedEmail(owner.agencyId, {
        to: { email: data.customerEmail, name: data.customerName },
        emailType: "booking_cancelled_customer",
        siteId: data.siteId,
        data: {
          customerName: data.customerName,
          serviceName: data.serviceName,
          staffName: data.staffName || "",
          date: dateStr,
          time: timeStr,
          duration: durationStr,
          price: priceStr,
          businessName,
          bookingId: data.appointmentId,
        },
      });
    }

    // Portal fan-out — portal users with canManageBookings (excl. agency owner already handled above).
    await dispatchBusinessEvent({
      eventType: "booking_cancelled",
      siteTemplateType: "booking_cancelled_owner" as NotificationTemplateType,
      permission: "canManageBookings",
      siteId: data.siteId,
      resourceType: "appointment",
      resourceId: data.appointmentId,
      title: `Booking Cancelled: ${data.serviceName}`,
      message: `${data.customerName}'s booking for ${data.serviceName} on ${dateStr} at ${timeStr} has been cancelled${data.reason ? `: ${data.reason}` : ""}.`,
      link: dashboardUrl,
      metadata: {
        appointmentId: data.appointmentId,
        siteId: data.siteId,
        cancelledBy: data.cancelledBy,
      },
      push: {
        title: `Booking Cancelled: ${data.serviceName}`,
        body: `${data.customerName} — ${dateStr} at ${timeStr}${data.reason ? ` (${data.reason})` : ""}`,
        url: dashboardUrl,
        tag: `booking-${data.appointmentId}`,
      },
      email: {
        emailType: "booking_cancelled_owner",
        data: {
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          serviceName: data.serviceName,
          staffName: data.staffName || "",
          date: dateStr,
          time: timeStr,
          duration: durationStr,
          price: priceStr,
          cancelledBy: data.cancelledBy,
          reason: data.reason || "",
          dashboardUrl,
          bookingId: data.appointmentId,
        },
      },
      excludeUserIds: [owner.agencyOwnerId],
    });

    console.log(
      `[BusinessNotify] Booking cancellation notifications sent for appointment ${data.appointmentId}`,
    );
  } catch (error) {
    console.error(
      "[BusinessNotify] Error sending booking cancellation notifications:",
      error,
    );
  }
}

// =============================================================================
// BOOKING CONFIRMED NOTIFICATIONS
// =============================================================================

/**
 * Send notifications when a booking is confirmed (pending → confirmed):
 * 1. Email to customer (booking confirmed)
 * 2. Email to business owner (booking confirmed)
 */
export async function notifyBookingConfirmed(
  data: BookingStatusChangeData,
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const owner = await resolveBusinessOwner(supabase, data.siteId);
    if (!owner) return;

    // Check if payment is required for this site
    const { data: settings } = await supabase
      .from("mod_bookmod01_settings" as any)
      .select("require_payment")
      .eq("site_id", data.siteId)
      .single();

    const businessName = owner.siteName || "Our Business";
    const currency = data.currency || "USD";
    const dateStr = formatDate(data.startTime);
    const timeStr = formatTime(data.startTime);
    const priceStr = formatCurrency(data.servicePrice, currency);
    const durationStr =
      data.serviceDuration >= 60
        ? `${Math.floor(data.serviceDuration / 60)}h${data.serviceDuration % 60 > 0 ? ` ${data.serviceDuration % 60}m` : ""}`
        : `${data.serviceDuration}m`;
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/dashboard/sites/${data.siteId}/booking`;

    // 1. In-app notification to business owner
    if (
      await shouldSendInApp(
        data.siteId,
        "booking_confirmed_owner" as NotificationTemplateType,
      )
    ) {
      await createNotification({
        userId: owner.agencyOwnerId,
        type: "booking_confirmed",
        title: `Booking Confirmed: ${data.serviceName}`,
        message: `${data.customerName}'s ${data.serviceName} on ${dateStr} at ${timeStr} has been confirmed.`,
        link: dashboardUrl,
        metadata: {
          appointmentId: data.appointmentId,
          siteId: data.siteId,
          customerEmail: data.customerEmail,
        },
      });

      // 2. Web push — pops up on desktop/mobile even when tab is closed
      pushToOwner(owner.agencyOwnerId, {
        title: `Booking Confirmed: ${data.serviceName}`,
        body: `${data.customerName} — ${dateStr} at ${timeStr}`,
        url: dashboardUrl,
        tag: `booking-${data.appointmentId}`,
      }).catch(() => {});
    }

    const emailPromises: Promise<unknown>[] = [];

    // Email to customer
    if (
      data.customerEmail &&
      (await shouldSendEmail(
        data.siteId,
        "booking_confirmed_customer" as NotificationTemplateType,
      ))
    ) {
      emailPromises.push(
        sendBrandedEmail(owner.agencyId, {
          to: { email: data.customerEmail, name: data.customerName },
          emailType: "booking_confirmed_customer",
          siteId: data.siteId,
          data: {
            customerName: data.customerName,
            serviceName: data.serviceName,
            staffName: data.staffName || "",
            date: dateStr,
            time: timeStr,
            duration: durationStr,
            price: priceStr,
            businessName,
            bookingId: data.appointmentId,
            paymentStatus: data.paymentStatus || "not_required",
            paymentRequired: (settings as any)?.require_payment ?? false,
          },
        }),
      );
    }

    // Email to owner
    if (
      owner.ownerEmail &&
      (await shouldSendEmail(
        data.siteId,
        "booking_confirmed_owner" as NotificationTemplateType,
      ))
    ) {
      emailPromises.push(
        sendBrandedEmail(owner.agencyId, {
          to: {
            email: owner.ownerEmail,
            name: owner.ownerName || undefined,
          },
          emailType: "booking_confirmed_owner",
          recipientUserId: owner.agencyOwnerId,
          data: {
            customerName: data.customerName,
            serviceName: data.serviceName,
            date: dateStr,
            time: timeStr,
            price: priceStr,
            paymentStatus: data.paymentStatus || "not_required",
            confirmedBy: data.changedBy || "System",
            dashboardUrl,
            bookingId: data.appointmentId,
          },
        }),
      );
    }

    if (emailPromises.length > 0) {
      await Promise.all(emailPromises);
    }

    await dispatchBusinessEvent({
      eventType: "booking_confirmed",
      siteTemplateType: "booking_confirmed_owner" as NotificationTemplateType,
      permission: "canManageBookings",
      siteId: data.siteId,
      resourceType: "appointment",
      resourceId: data.appointmentId,
      title: `Booking Confirmed: ${data.serviceName}`,
      message: `${data.customerName}'s ${data.serviceName} on ${dateStr} at ${timeStr} has been confirmed.`,
      link: dashboardUrl,
      metadata: { appointmentId: data.appointmentId, siteId: data.siteId },
      push: {
        title: `Booking Confirmed: ${data.serviceName}`,
        body: `${data.customerName} — ${dateStr} at ${timeStr}`,
        url: dashboardUrl,
        tag: `booking-${data.appointmentId}`,
      },
      email: {
        emailType: "booking_confirmed_owner",
        data: {
          customerName: data.customerName,
          serviceName: data.serviceName,
          date: dateStr,
          time: timeStr,
          price: priceStr,
          paymentStatus: data.paymentStatus || "not_required",
          confirmedBy: data.changedBy || "System",
          dashboardUrl,
          bookingId: data.appointmentId,
        },
      },
      excludeUserIds: [owner.agencyOwnerId],
    });

    console.log(
      `[BusinessNotify] Booking confirmed notifications sent for ${data.appointmentId}`,
    );
  } catch (error) {
    console.error(
      "[BusinessNotify] Error sending booking confirmed notifications:",
      error,
    );
  }
}

// =============================================================================
// BOOKING COMPLETED NOTIFICATIONS
// =============================================================================

/**
 * Send notifications when a booking is completed:
 * 1. Email to customer (thank you)
 * 2. Email to business owner (completion record)
 */
export async function notifyBookingCompleted(
  data: BookingStatusChangeData,
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const owner = await resolveBusinessOwner(supabase, data.siteId);
    if (!owner) return;

    const businessName = owner.siteName || "Our Business";
    const currency = data.currency || "USD";
    const dateStr = formatDate(data.startTime);
    const priceStr = formatCurrency(data.servicePrice, currency);
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/dashboard/sites/${data.siteId}/booking`;

    // 1. In-app notification to business owner
    if (
      await shouldSendInApp(
        data.siteId,
        "booking_completed_owner" as NotificationTemplateType,
      )
    ) {
      await createNotification({
        userId: owner.agencyOwnerId,
        type: "booking_confirmed",
        title: `Booking Completed: ${data.serviceName}`,
        message: `${data.customerName}'s ${data.serviceName} on ${dateStr} marked complete (${priceStr}).`,
        link: dashboardUrl,
        metadata: { appointmentId: data.appointmentId, siteId: data.siteId },
      });

      pushToOwner(owner.agencyOwnerId, {
        title: `Booking Completed: ${data.serviceName}`,
        body: `${data.customerName} — ${dateStr}`,
        url: dashboardUrl,
        tag: `booking-${data.appointmentId}`,
      }).catch(() => {});
    }

    const emailPromises: Promise<unknown>[] = [];

    // Email to customer (thank you)
    if (
      data.customerEmail &&
      (await shouldSendEmail(
        data.siteId,
        "booking_completed_customer" as NotificationTemplateType,
      ))
    ) {
      emailPromises.push(
        sendBrandedEmail(owner.agencyId, {
          to: { email: data.customerEmail, name: data.customerName },
          emailType: "booking_completed_customer",
          siteId: data.siteId,
          data: {
            customerName: data.customerName,
            serviceName: data.serviceName,
            staffName: data.staffName || "",
            date: dateStr,
            price: priceStr,
            businessName,
            bookingId: data.appointmentId,
          },
        }),
      );
    }

    // Email to owner
    if (
      owner.ownerEmail &&
      (await shouldSendEmail(
        data.siteId,
        "booking_completed_owner" as NotificationTemplateType,
      ))
    ) {
      emailPromises.push(
        sendBrandedEmail(owner.agencyId, {
          to: {
            email: owner.ownerEmail,
            name: owner.ownerName || undefined,
          },
          emailType: "booking_completed_owner",
          recipientUserId: owner.agencyOwnerId,
          data: {
            customerName: data.customerName,
            serviceName: data.serviceName,
            date: dateStr,
            price: priceStr,
            paymentStatus: data.paymentStatus || "not_required",
            dashboardUrl,
            bookingId: data.appointmentId,
          },
        }),
      );
    }

    if (emailPromises.length > 0) {
      await Promise.all(emailPromises);
    }

    await dispatchBusinessEvent({
      eventType: "booking_confirmed",
      siteTemplateType: "booking_completed_owner" as NotificationTemplateType,
      permission: "canManageBookings",
      siteId: data.siteId,
      resourceType: "appointment",
      resourceId: data.appointmentId,
      title: `Booking Completed: ${data.serviceName}`,
      message: `${data.customerName}'s ${data.serviceName} on ${dateStr} marked complete (${priceStr}).`,
      link: dashboardUrl,
      metadata: { appointmentId: data.appointmentId, siteId: data.siteId },
      push: {
        title: `Booking Completed: ${data.serviceName}`,
        body: `${data.customerName} — ${dateStr}`,
        url: dashboardUrl,
        tag: `booking-${data.appointmentId}`,
      },
      email: {
        emailType: "booking_completed_owner",
        data: {
          customerName: data.customerName,
          serviceName: data.serviceName,
          date: dateStr,
          price: priceStr,
          paymentStatus: data.paymentStatus || "not_required",
          dashboardUrl,
          bookingId: data.appointmentId,
        },
      },
      excludeUserIds: [owner.agencyOwnerId],
    });

    console.log(
      `[BusinessNotify] Booking completed notifications sent for ${data.appointmentId}`,
    );
  } catch (error) {
    console.error(
      "[BusinessNotify] Error sending booking completed notifications:",
      error,
    );
  }
}

// =============================================================================
// BOOKING NO SHOW NOTIFICATIONS
// =============================================================================

/**
 * Send notification when a customer no-shows:
 * 1. Email to customer (missed appointment — encourage rebook)
 */
export async function notifyBookingNoShow(
  data: BookingStatusChangeData,
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const owner = await resolveBusinessOwner(supabase, data.siteId);
    if (!owner) return;

    const businessName = owner.siteName || "Our Business";
    const _currency = data.currency || "USD";
    const dateStr = formatDate(data.startTime);
    const timeStr = formatTime(data.startTime);
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/dashboard/sites/${data.siteId}/booking`;

    // 1. In-app notification to business owner — they need to know about no-shows immediately
    if (
      await shouldSendInApp(
        data.siteId,
        "booking_no_show_customer" as NotificationTemplateType,
      )
    ) {
      await createNotification({
        userId: owner.agencyOwnerId,
        type: "booking_cancelled",
        title: `No-Show: ${data.serviceName}`,
        message: `${data.customerName} did not show up for ${data.serviceName} on ${dateStr} at ${timeStr}.`,
        link: dashboardUrl,
        metadata: { appointmentId: data.appointmentId, siteId: data.siteId },
      });

      pushToOwner(owner.agencyOwnerId, {
        title: `No-Show: ${data.serviceName}`,
        body: `${data.customerName} — ${dateStr} at ${timeStr}`,
        url: dashboardUrl,
        tag: `booking-${data.appointmentId}`,
      }).catch(() => {});
    }

    if (
      data.customerEmail &&
      (await shouldSendEmail(
        data.siteId,
        "booking_no_show_customer" as NotificationTemplateType,
      ))
    ) {
      await sendBrandedEmail(owner.agencyId, {
        to: { email: data.customerEmail, name: data.customerName },
        emailType: "booking_no_show_customer",
        siteId: data.siteId,
        data: {
          customerName: data.customerName,
          serviceName: data.serviceName,
          date: dateStr,
          time: timeStr,
          businessName,
          bookingId: data.appointmentId,
        },
      });
    }

    await dispatchBusinessEvent({
      eventType: "booking_cancelled",
      siteTemplateType: "booking_no_show_customer" as NotificationTemplateType,
      permission: "canManageBookings",
      siteId: data.siteId,
      resourceType: "appointment",
      resourceId: data.appointmentId,
      title: `No-Show: ${data.serviceName}`,
      message: `${data.customerName} did not show up for ${data.serviceName} on ${dateStr} at ${timeStr}.`,
      link: dashboardUrl,
      metadata: { appointmentId: data.appointmentId, siteId: data.siteId },
      push: {
        title: `No-Show: ${data.serviceName}`,
        body: `${data.customerName} — ${dateStr} at ${timeStr}`,
        url: dashboardUrl,
        tag: `booking-${data.appointmentId}`,
      },
      excludeUserIds: [owner.agencyOwnerId],
    });

    console.log(
      `[BusinessNotify] Booking no-show notification sent for ${data.appointmentId}`,
    );
  } catch (error) {
    console.error(
      "[BusinessNotify] Error sending booking no-show notification:",
      error,
    );
  }
}

// =============================================================================
// BOOKING PAYMENT RECEIVED NOTIFICATIONS
// =============================================================================

/**
 * Send notifications when payment is marked as received for a booking:
 * 1. Email to customer (payment confirmation)
 * 2. Email to business owner (payment received)
 */
export async function notifyBookingPaymentReceived(
  data: BookingStatusChangeData,
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const owner = await resolveBusinessOwner(supabase, data.siteId);
    if (!owner) return;

    const businessName = owner.siteName || "Our Business";
    const currency = data.currency || "USD";
    const dateStr = formatDate(data.startTime);
    const timeStr = formatTime(data.startTime);
    const priceStr = formatCurrency(data.servicePrice, currency);
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/dashboard/sites/${data.siteId}/booking`;

    // 1. In-app notification to business owner — payment received is a money event, must be visible
    if (
      await shouldSendInApp(
        data.siteId,
        "booking_payment_received_owner" as NotificationTemplateType,
      )
    ) {
      await createNotification({
        userId: owner.agencyOwnerId,
        type: "payment_received",
        title: `Payment Received: ${data.serviceName}`,
        message: `${data.customerName} paid ${priceStr} for ${data.serviceName} on ${dateStr} at ${timeStr}.`,
        link: dashboardUrl,
        metadata: { appointmentId: data.appointmentId, siteId: data.siteId },
      });

      pushToOwner(owner.agencyOwnerId, {
        title: `Payment Received: ${priceStr}`,
        body: `${data.customerName} — ${data.serviceName}`,
        url: dashboardUrl,
        tag: `booking-payment-${data.appointmentId}`,
      }).catch(() => {});
    }

    const emailPromises: Promise<unknown>[] = [];

    // Email to customer
    if (
      data.customerEmail &&
      (await shouldSendEmail(
        data.siteId,
        "booking_payment_received_customer" as NotificationTemplateType,
      ))
    ) {
      emailPromises.push(
        sendBrandedEmail(owner.agencyId, {
          to: { email: data.customerEmail, name: data.customerName },
          emailType: "booking_payment_received_customer",
          siteId: data.siteId,
          data: {
            customerName: data.customerName,
            serviceName: data.serviceName,
            staffName: data.staffName || "",
            date: dateStr,
            time: timeStr,
            price: priceStr,
            businessName,
            bookingId: data.appointmentId,
          },
        }),
      );
    }

    // Email to owner
    if (
      owner.ownerEmail &&
      (await shouldSendEmail(
        data.siteId,
        "booking_payment_received_owner" as NotificationTemplateType,
      ))
    ) {
      emailPromises.push(
        sendBrandedEmail(owner.agencyId, {
          to: {
            email: owner.ownerEmail,
            name: owner.ownerName || undefined,
          },
          emailType: "booking_payment_received_owner",
          recipientUserId: owner.agencyOwnerId,
          data: {
            customerName: data.customerName,
            serviceName: data.serviceName,
            date: dateStr,
            time: timeStr,
            price: priceStr,
            dashboardUrl,
            bookingId: data.appointmentId,
          },
        }),
      );
    }

    if (emailPromises.length > 0) {
      await Promise.all(emailPromises);
    }

    await dispatchBusinessEvent({
      eventType: "payment_received",
      siteTemplateType:
        "booking_payment_received_owner" as NotificationTemplateType,
      permission: "canManageBookings",
      siteId: data.siteId,
      resourceType: "appointment",
      resourceId: data.appointmentId,
      title: `Payment Received: ${data.serviceName}`,
      message: `${data.customerName} paid ${priceStr} for ${data.serviceName} on ${dateStr} at ${timeStr}.`,
      link: dashboardUrl,
      metadata: { appointmentId: data.appointmentId, siteId: data.siteId },
      push: {
        title: `Payment Received: ${priceStr}`,
        body: `${data.customerName} — ${data.serviceName}`,
        url: dashboardUrl,
        tag: `booking-payment-${data.appointmentId}`,
      },
      email: {
        emailType: "booking_payment_received_owner",
        data: {
          customerName: data.customerName,
          serviceName: data.serviceName,
          date: dateStr,
          time: timeStr,
          price: priceStr,
          dashboardUrl,
          bookingId: data.appointmentId,
        },
      },
      excludeUserIds: [owner.agencyOwnerId],
    });

    console.log(
      `[BusinessNotify] Booking payment received notifications sent for ${data.appointmentId}`,
    );
  } catch (error) {
    console.error(
      "[BusinessNotify] Error sending booking payment notifications:",
      error,
    );
  }
}

// =============================================================================
// ORDER NOTIFICATIONS
// =============================================================================

/**
 * Send all notifications for a new order:
 * 1. In-app notification to business owner
 * 2. Email to business owner
 * 3. Email to customer (order confirmation)
 *
 * Runs async - does not block the order creation response
 */
export async function notifyNewOrder(
  data: OrderNotificationData,
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const owner = await resolveBusinessOwner(supabase, data.siteId);
    if (!owner) return;

    const businessName = owner.siteName || "Our Store";
    const currency = data.currency || "USD";
    // Ecommerce prices are stored in cents — divide by 100 for display
    const totalStr = formatCurrency(data.total / 100, currency);
    const subtotalStr = formatCurrency(data.subtotal / 100, currency);
    const shippingStr = formatCurrency(data.shipping / 100, currency);
    const taxStr = formatCurrency(data.tax / 100, currency);
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/dashboard/sites/${data.siteId}/ecommerce?view=orders`;

    // Build the storefront URL for order confirmation link in customer email
    const siteUrl = owner.siteCustomDomain
      ? `https://${owner.siteCustomDomain}`
      : owner.siteSubdomain
        ? `https://${owner.siteSubdomain}.${DOMAINS.SITES_BASE}`
        : null;
    const orderUrl = siteUrl
      ? `${siteUrl}/order-confirmation?order=${data.orderId}`
      : undefined;
    const trackingUrl = siteUrl ? `${siteUrl}/order-tracking` : undefined;

    // Fetch manual payment instructions if provider is manual
    let manualPaymentInstructions = data.manualPaymentInstructions;
    if (data.paymentProvider === "manual" && !manualPaymentInstructions) {
      const { data: ecomSettings } = await supabase
        .from("mod_ecommod01_settings" as never)
        .select("manual_payment_instructions")
        .eq("site_id" as never, data.siteId)
        .single();
      manualPaymentInstructions = (
        ecomSettings as Record<string, unknown> | null
      )?.manual_payment_instructions as string | undefined;
    }

    const formattedItems = data.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: formatCurrency((item.unitPrice * item.quantity) / 100, currency),
    }));

    // Portal dispatch: agency owner + portal users with canManageOrders.
    await dispatchBusinessEvent({
      eventType: "new_order",
      siteTemplateType: "order_confirmation_owner" as NotificationTemplateType,
      permission: "canManageOrders",
      siteId: data.siteId,
      resourceType: "order",
      resourceId: data.orderId,
      title: `New Order #${data.orderNumber}`,
      message: `${data.customerName} placed an order for ${totalStr} (${data.items.length} item${data.items.length > 1 ? "s" : ""})`,
      link: dashboardUrl,
      metadata: {
        orderId: data.orderId,
        orderNumber: data.orderNumber,
        siteId: data.siteId,
        customerEmail: data.customerEmail,
        total: data.total,
      },
      push: {
        title: `New Order #${data.orderNumber}`,
        body: `${data.customerName} — ${totalStr}`,
        url: dashboardUrl,
        tag: `order-${data.orderId}`,
      },
      email: {
        emailType: "order_confirmation_owner",
        data: {
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          orderNumber: data.orderNumber,
          items: formattedItems,
          total: totalStr,
          paymentStatus: data.paymentStatus,
          dashboardUrl,
        },
      },
    });

    // Customer email (site-branded) — NOT a portal dispatch.
    if (
      data.customerEmail &&
      (await shouldSendEmail(
        data.siteId,
        "order_confirmation_customer" as NotificationTemplateType,
      ))
    ) {
      await sendBrandedEmail(owner.agencyId, {
        to: { email: data.customerEmail, name: data.customerName },
        emailType: "order_confirmation_customer",
        siteId: data.siteId,
        data: {
          customerName: data.customerName,
          orderNumber: data.orderNumber,
          items: formattedItems,
          subtotal: subtotalStr,
          shipping: shippingStr,
          tax: taxStr,
          total: totalStr,
          paymentStatus: data.paymentStatus,
          paymentProvider: data.paymentProvider || undefined,
          manualPaymentInstructions: manualPaymentInstructions || undefined,
          shippingAddress: data.shippingAddress || "",
          businessName,
          orderUrl: orderUrl || undefined,
          trackingUrl: trackingUrl || undefined,
        },
      });
    }

    console.log(
      `[BusinessNotify] Order notifications sent for order ${data.orderNumber}`,
    );
  } catch (error) {
    console.error("[BusinessNotify] Error sending order notifications:", error);
  }
}

/**
 * Send shipping notification to customer + in-app notification to owner
 */
export async function notifyOrderShipped(
  siteId: string,
  orderNumber: string,
  customerEmail: string,
  customerName: string,
  trackingNumber?: string,
  trackingUrl?: string,
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const owner = await resolveBusinessOwner(supabase, siteId);
    if (!owner) return;

    // In-app notification to business owner
    if (
      await shouldSendInApp(
        siteId,
        "order_shipped_customer" as NotificationTemplateType,
      )
    ) {
      await createNotification({
        userId: owner.agencyOwnerId,
        type: "order_shipped",
        title: `Order #${orderNumber} Shipped`,
        message: `Order for ${customerName} has been marked as shipped${trackingNumber ? ` (Tracking: ${trackingNumber})` : ""}`,
        link: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/dashboard/sites/${siteId}/ecommerce?view=orders`,
        metadata: { orderNumber, siteId },
      });

      pushToOwner(owner.agencyOwnerId, {
        title: `Order #${orderNumber} Shipped`,
        body: `Shipped to ${customerName}${trackingNumber ? ` — ${trackingNumber}` : ""}`,
        url: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/dashboard/sites/${siteId}/ecommerce?view=orders`,
        tag: `order-shipped-${orderNumber}`,
      }).catch(() => {});
    }

    // Email to customer (uses SITE branding)
    if (
      await shouldSendEmail(
        siteId,
        "order_shipped_customer" as NotificationTemplateType,
      )
    ) {
      await sendBrandedEmail(owner.agencyId, {
        to: { email: customerEmail, name: customerName },
        emailType: "order_shipped_customer",
        siteId,
        data: {
          customerName,
          orderNumber,
          trackingNumber: trackingNumber || "",
          trackingUrl: trackingUrl || "",
          businessName: owner.siteName || "Our Store",
        },
      });
    }

    await dispatchBusinessEvent({
      eventType: "order_shipped",
      siteTemplateType: "order_shipped_customer" as NotificationTemplateType,
      permission: "canManageOrders",
      siteId,
      resourceType: "order",
      resourceId: orderNumber,
      title: `Order #${orderNumber} Shipped`,
      message: `Order for ${customerName} has been marked as shipped${trackingNumber ? ` (Tracking: ${trackingNumber})` : ""}`,
      link: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/dashboard/sites/${siteId}/ecommerce?view=orders`,
      metadata: { orderNumber, siteId },
      push: {
        title: `Order #${orderNumber} Shipped`,
        body: `Shipped to ${customerName}${trackingNumber ? ` — ${trackingNumber}` : ""}`,
        url: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/dashboard/sites/${siteId}/ecommerce?view=orders`,
        tag: `order-shipped-${orderNumber}`,
      },
      excludeUserIds: [owner.agencyOwnerId],
    });

    console.log(
      `[BusinessNotify] Shipping notifications sent for order ${orderNumber}`,
    );
  } catch (error) {
    console.error(
      "[BusinessNotify] Error sending shipping notification:",
      error,
    );
  }
}

// =============================================================================
// ORDER DELIVERED NOTIFICATIONS
// =============================================================================

/**
 * Send delivery notification to customer + in-app notification to owner
 */
export async function notifyOrderDelivered(
  siteId: string,
  orderNumber: string,
  customerEmail: string,
  customerName: string,
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const owner = await resolveBusinessOwner(supabase, siteId);
    if (!owner) return;

    // Build storefront URL for customer email
    const siteUrl = owner.siteCustomDomain
      ? `https://${owner.siteCustomDomain}`
      : owner.siteSubdomain
        ? `https://${owner.siteSubdomain}.${DOMAINS.SITES_BASE}`
        : null;
    const orderUrl = siteUrl ? `${siteUrl}/order-tracking` : undefined;

    // In-app notification to business owner
    if (
      await shouldSendInApp(
        siteId,
        "order_delivered_customer" as NotificationTemplateType,
      )
    ) {
      await createNotification({
        userId: owner.agencyOwnerId,
        type: "order_delivered",
        title: `Order #${orderNumber} Delivered`,
        message: `Order for ${customerName} has been marked as delivered`,
        link: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/dashboard/sites/${siteId}/ecommerce?view=orders`,
        metadata: { orderNumber, siteId },
      });

      pushToOwner(owner.agencyOwnerId, {
        title: `Order #${orderNumber} Delivered`,
        body: `Delivered to ${customerName}`,
        url: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/dashboard/sites/${siteId}/ecommerce?view=orders`,
        tag: `order-delivered-${orderNumber}`,
      }).catch(() => {});
    }

    // Email to customer (uses SITE branding)
    if (
      customerEmail &&
      (await shouldSendEmail(
        siteId,
        "order_delivered_customer" as NotificationTemplateType,
      ))
    ) {
      await sendBrandedEmail(owner.agencyId, {
        to: { email: customerEmail, name: customerName },
        emailType: "order_delivered_customer",
        siteId,
        data: {
          customerName,
          orderNumber,
          orderUrl: orderUrl || undefined,
          businessName: owner.siteName || "Our Store",
        },
      });
    }

    await dispatchBusinessEvent({
      eventType: "order_delivered",
      siteTemplateType: "order_delivered_customer" as NotificationTemplateType,
      permission: "canManageOrders",
      siteId,
      resourceType: "order",
      resourceId: orderNumber,
      title: `Order #${orderNumber} Delivered`,
      message: `Order for ${customerName} has been marked as delivered`,
      link: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/dashboard/sites/${siteId}/ecommerce?view=orders`,
      metadata: { orderNumber, siteId },
      push: {
        title: `Order #${orderNumber} Delivered`,
        body: `Delivered to ${customerName}`,
        url: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/dashboard/sites/${siteId}/ecommerce?view=orders`,
        tag: `order-delivered-${orderNumber}`,
      },
      excludeUserIds: [owner.agencyOwnerId],
    });

    console.log(
      `[BusinessNotify] Delivery notifications sent for order ${orderNumber}`,
    );
  } catch (error) {
    console.error(
      "[BusinessNotify] Error sending delivery notification:",
      error,
    );
  }
}

// =============================================================================
// ORDER CANCELLED NOTIFICATIONS
// =============================================================================

/**
 * Send cancellation notification to customer + owner
 */
export async function notifyOrderCancelled(
  siteId: string,
  orderNumber: string,
  customerEmail: string,
  customerName: string,
  total: string,
  reason?: string,
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const owner = await resolveBusinessOwner(supabase, siteId);
    if (!owner) return;

    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/dashboard/sites/${siteId}/ecommerce?view=orders`;

    // Build storefront URL for customer email
    const siteUrl = owner.siteCustomDomain
      ? `https://${owner.siteCustomDomain}`
      : owner.siteSubdomain
        ? `https://${owner.siteSubdomain}.${DOMAINS.SITES_BASE}`
        : null;
    const orderUrl = siteUrl ? `${siteUrl}/order-tracking` : undefined;

    // In-app notification to business owner
    if (
      await shouldSendInApp(
        siteId,
        "order_cancelled_owner" as NotificationTemplateType,
      )
    ) {
      await createNotification({
        userId: owner.agencyOwnerId,
        type: "order_cancelled",
        title: `Order #${orderNumber} Cancelled`,
        message: `Order from ${customerName} (${total}) has been cancelled${reason ? `: ${reason}` : ""}`,
        link: dashboardUrl,
        metadata: { orderNumber, siteId },
      });

      pushToOwner(owner.agencyOwnerId, {
        title: `Order #${orderNumber} Cancelled`,
        body: `${customerName} — ${total}`,
        url: dashboardUrl,
        tag: `order-cancelled-${orderNumber}`,
      }).catch(() => {});
    }

    // Email to business owner
    if (
      owner.ownerEmail &&
      (await shouldSendEmail(
        siteId,
        "order_cancelled_owner" as NotificationTemplateType,
      ))
    ) {
      await sendBrandedEmail(owner.agencyId, {
        to: {
          email: owner.ownerEmail,
          name: owner.ownerName || undefined,
        },
        emailType: "order_cancelled_owner",
        recipientUserId: owner.agencyOwnerId,
        data: {
          customerName,
          customerEmail,
          orderNumber,
          total,
          reason: reason || "",
          dashboardUrl,
        },
      });
    }

    // Email to customer (uses SITE branding)
    if (
      customerEmail &&
      (await shouldSendEmail(
        siteId,
        "order_cancelled_customer" as NotificationTemplateType,
      ))
    ) {
      await sendBrandedEmail(owner.agencyId, {
        to: { email: customerEmail, name: customerName },
        emailType: "order_cancelled_customer",
        siteId,
        data: {
          customerName,
          orderNumber,
          reason: reason || "",
          orderUrl: orderUrl || undefined,
          businessName: owner.siteName || "Our Store",
        },
      });
    }

    await dispatchBusinessEvent({
      eventType: "order_cancelled",
      siteTemplateType: "order_cancelled_owner" as NotificationTemplateType,
      permission: "canManageOrders",
      siteId,
      resourceType: "order",
      resourceId: orderNumber,
      title: `Order #${orderNumber} Cancelled`,
      message: `Order from ${customerName} (${total}) has been cancelled${reason ? `: ${reason}` : ""}`,
      link: dashboardUrl,
      metadata: { orderNumber, siteId },
      push: {
        title: `Order #${orderNumber} Cancelled`,
        body: `${customerName} — ${total}`,
        url: dashboardUrl,
        tag: `order-cancelled-${orderNumber}`,
      },
      email: {
        emailType: "order_cancelled_owner",
        data: {
          customerName,
          customerEmail,
          orderNumber,
          total,
          reason: reason || "",
          dashboardUrl,
        },
      },
      excludeUserIds: [owner.agencyOwnerId],
    });

    console.log(
      `[BusinessNotify] Cancellation notifications sent for order ${orderNumber}`,
    );
  } catch (error) {
    console.error(
      "[BusinessNotify] Error sending cancellation notification:",
      error,
    );
  }
}

// =============================================================================
// PAYMENT RECEIVED NOTIFICATIONS
// =============================================================================

/**
 * Send payment confirmation notification to customer + in-app to owner
 */
export async function notifyPaymentReceived(
  siteId: string,
  orderNumber: string,
  customerEmail: string,
  customerName: string,
  total: string,
  paymentMethod?: string,
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const owner = await resolveBusinessOwner(supabase, siteId);
    if (!owner) return;

    // Build storefront URL for customer email
    const siteUrl = owner.siteCustomDomain
      ? `https://${owner.siteCustomDomain}`
      : owner.siteSubdomain
        ? `https://${owner.siteSubdomain}.${DOMAINS.SITES_BASE}`
        : null;
    const orderUrl = siteUrl ? `${siteUrl}/order-tracking` : undefined;

    // In-app notification to business owner
    if (
      await shouldSendInApp(
        siteId,
        "payment_received_customer" as NotificationTemplateType,
      )
    ) {
      await createNotification({
        userId: owner.agencyOwnerId,
        type: "payment_received",
        title: `Payment Received: Order #${orderNumber}`,
        message: `${customerName} paid ${total} for order #${orderNumber}${paymentMethod ? ` via ${paymentMethod}` : ""}`,
        link: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/dashboard/sites/${siteId}/ecommerce?view=orders`,
        metadata: { orderNumber, siteId },
      });

      pushToOwner(owner.agencyOwnerId, {
        title: `Payment Received: Order #${orderNumber}`,
        body: `${customerName} paid ${total}${paymentMethod ? ` via ${paymentMethod}` : ""}`,
        url: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/dashboard/sites/${siteId}/ecommerce?view=orders`,
        tag: `payment-${orderNumber}`,
      }).catch(() => {});
    }

    if (
      customerEmail &&
      (await shouldSendEmail(
        siteId,
        "payment_received_customer" as NotificationTemplateType,
      ))
    ) {
      await sendBrandedEmail(owner.agencyId, {
        to: { email: customerEmail, name: customerName },
        emailType: "payment_received_customer",
        siteId,
        data: {
          customerName,
          orderNumber,
          total,
          paymentMethod: paymentMethod || "",
          orderUrl: orderUrl || undefined,
          businessName: owner.siteName || "Our Store",
        },
      });
    }

    await dispatchBusinessEvent({
      eventType: "payment_received",
      siteTemplateType: "payment_received_customer" as NotificationTemplateType,
      permission: "canManageOrders",
      siteId,
      resourceType: "order",
      resourceId: orderNumber,
      title: `Payment Received: Order #${orderNumber}`,
      message: `${customerName} paid ${total} for order #${orderNumber}${paymentMethod ? ` via ${paymentMethod}` : ""}`,
      link: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/dashboard/sites/${siteId}/ecommerce?view=orders`,
      metadata: { orderNumber, siteId },
      push: {
        title: `Payment Received: Order #${orderNumber}`,
        body: `${customerName} paid ${total}${paymentMethod ? ` via ${paymentMethod}` : ""}`,
        url: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/dashboard/sites/${siteId}/ecommerce?view=orders`,
        tag: `payment-${orderNumber}`,
      },
      excludeUserIds: [owner.agencyOwnerId],
    });

    console.log(
      `[BusinessNotify] Payment received notification sent for order ${orderNumber}`,
    );
  } catch (error) {
    console.error(
      "[BusinessNotify] Error sending payment notification:",
      error,
    );
  }
}

// =============================================================================
// PAYMENT PROOF NOTIFICATIONS
// =============================================================================

/**
 * Notify agency owner when a customer uploads payment proof for a manual payment order.
 */
export async function notifyPaymentProofUploaded(
  siteId: string,
  orderNumber: string,
  customerEmail: string,
  customerName: string,
  total: string,
  fileName?: string,
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const owner = await resolveBusinessOwner(supabase, siteId);
    if (!owner) return;

    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/dashboard/sites/${siteId}/ecommerce?view=orders`;

    // In-app notification to business owner
    if (
      await shouldSendInApp(
        siteId,
        "payment_proof_uploaded_owner" as NotificationTemplateType,
      )
    ) {
      await createNotification({
        userId: owner.agencyOwnerId,
        type: "payment_received",
        title: `Payment Proof Uploaded: Order #${orderNumber}`,
        message: `${customerName} has uploaded payment proof for order #${orderNumber} (${total}). Please review and verify.`,
        link: dashboardUrl,
        metadata: { orderNumber, siteId },
      });

      pushToOwner(owner.agencyOwnerId, {
        title: `Payment Proof: Order #${orderNumber}`,
        body: `${customerName} uploaded proof (${total}) — action required`,
        url: dashboardUrl,
        tag: `payment-proof-${orderNumber}`,
      }).catch(() => {});
    }

    // Email to business owner
    if (
      owner.ownerEmail &&
      (await shouldSendEmail(
        siteId,
        "payment_proof_uploaded_owner" as NotificationTemplateType,
      ))
    ) {
      await sendBrandedEmail(owner.agencyId, {
        to: {
          email: owner.ownerEmail,
          name: owner.ownerName || undefined,
        },
        emailType: "payment_proof_uploaded_owner",
        siteId,
        data: {
          orderNumber,
          customerName,
          customerEmail,
          total,
          fileName: fileName || "Receipt",
          businessName: owner.siteName || "Store",
          dashboardUrl,
        },
      });
    }

    await dispatchBusinessEvent({
      eventType: "payment_received",
      siteTemplateType:
        "payment_proof_uploaded_owner" as NotificationTemplateType,
      permission: "canManageOrders",
      siteId,
      resourceType: "order",
      resourceId: orderNumber,
      title: `Payment Proof Uploaded: Order #${orderNumber}`,
      message: `${customerName} has uploaded payment proof for order #${orderNumber} (${total}). Please review and verify.`,
      link: dashboardUrl,
      metadata: { orderNumber, siteId },
      push: {
        title: `Payment Proof: Order #${orderNumber}`,
        body: `${customerName} uploaded proof (${total}) — action required`,
        url: dashboardUrl,
        tag: `payment-proof-${orderNumber}`,
      },
      email: {
        emailType: "payment_proof_uploaded_owner",
        data: {
          orderNumber,
          customerName,
          customerEmail,
          total,
          fileName: fileName || "Receipt",
          businessName: owner.siteName || "Store",
          dashboardUrl,
        },
      },
      excludeUserIds: [owner.agencyOwnerId],
    });

    console.log(
      `[BusinessNotify] Payment proof uploaded notification sent for order ${orderNumber}`,
    );
  } catch (error) {
    console.error(
      "[BusinessNotify] Error sending payment proof notification:",
      error,
    );
  }
}

// =============================================================================
// REFUND NOTIFICATIONS
// =============================================================================

/**
 * Send refund notification to customer
 */
export async function notifyRefundIssued(
  siteId: string,
  orderNumber: string,
  customerEmail: string,
  customerName: string,
  refundAmount: string,
  reason?: string,
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const owner = await resolveBusinessOwner(supabase, siteId);
    if (!owner) return;

    // Build storefront URL for customer email
    const siteUrl = owner.siteCustomDomain
      ? `https://${owner.siteCustomDomain}`
      : owner.siteSubdomain
        ? `https://${owner.siteSubdomain}.${DOMAINS.SITES_BASE}`
        : null;
    const orderUrl = siteUrl ? `${siteUrl}/order-tracking` : undefined;

    // In-app notification to business owner
    if (
      await shouldSendInApp(
        siteId,
        "refund_issued_customer" as NotificationTemplateType,
      )
    ) {
      await createNotification({
        userId: owner.agencyOwnerId,
        type: "refund_issued",
        title: `Refund Issued: Order #${orderNumber}`,
        message: `Refund of ${refundAmount} issued to ${customerName}${reason ? ` — ${reason}` : ""}`,
        link: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/dashboard/sites/${siteId}/ecommerce?view=orders`,
        metadata: { orderNumber, siteId },
      });

      pushToOwner(owner.agencyOwnerId, {
        title: `Refund Issued: Order #${orderNumber}`,
        body: `${refundAmount} — ${customerName}`,
        url: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/dashboard/sites/${siteId}/ecommerce?view=orders`,
        tag: `refund-${orderNumber}`,
      }).catch(() => {});
    }

    // Email to customer (uses SITE branding)
    if (
      customerEmail &&
      (await shouldSendEmail(
        siteId,
        "refund_issued_customer" as NotificationTemplateType,
      ))
    ) {
      await sendBrandedEmail(owner.agencyId, {
        to: { email: customerEmail, name: customerName },
        emailType: "refund_issued_customer",
        siteId,
        data: {
          customerName,
          orderNumber,
          refundAmount,
          reason: reason || "",
          orderUrl: orderUrl || undefined,
          businessName: owner.siteName || "Our Store",
        },
      });
    }

    await dispatchBusinessEvent({
      eventType: "refund_issued",
      siteTemplateType: "refund_issued_customer" as NotificationTemplateType,
      permission: "canManageOrders",
      siteId,
      resourceType: "order",
      resourceId: orderNumber,
      title: `Refund Issued: Order #${orderNumber}`,
      message: `Refund of ${refundAmount} issued to ${customerName}${reason ? ` — ${reason}` : ""}`,
      link: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/dashboard/sites/${siteId}/ecommerce?view=orders`,
      metadata: { orderNumber, siteId },
      push: {
        title: `Refund Issued: Order #${orderNumber}`,
        body: `${refundAmount} — ${customerName}`,
        url: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/dashboard/sites/${siteId}/ecommerce?view=orders`,
        tag: `refund-${orderNumber}`,
      },
      excludeUserIds: [owner.agencyOwnerId],
    });

    console.log(
      `[BusinessNotify] Refund notification sent for order ${orderNumber}`,
    );
  } catch (error) {
    console.error("[BusinessNotify] Error sending refund notification:", error);
  }
}

// =============================================================================
// LOW STOCK NOTIFICATIONS
// =============================================================================

/**
 * Send low stock alert to business owner
 */
export async function notifyLowStock(
  siteId: string,
  productName: string,
  currentStock: number,
  threshold: number,
  sku?: string,
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const owner = await resolveBusinessOwner(supabase, siteId);
    if (!owner) return;

    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/dashboard/sites/${siteId}/ecommerce?view=products`;

    // In-app notification to business owner
    if (
      await shouldSendInApp(
        siteId,
        "low_stock_admin" as NotificationTemplateType,
      )
    ) {
      await createNotification({
        userId: owner.agencyOwnerId,
        type: "low_stock",
        title: `Low Stock: ${productName}`,
        message: `${productName}${sku ? ` (${sku})` : ""} is low on stock (${currentStock} remaining, threshold: ${threshold})`,
        link: dashboardUrl,
        metadata: { productName, currentStock, threshold, siteId },
      });

      pushToOwner(owner.agencyOwnerId, {
        title: `Low Stock: ${productName}`,
        body: `${currentStock} remaining (threshold: ${threshold})${sku ? ` — SKU: ${sku}` : ""}`,
        url: dashboardUrl,
        tag: `low-stock-${sku || productName}`,
      }).catch(() => {});
    }

    // Email to business owner
    if (
      owner.ownerEmail &&
      (await shouldSendEmail(
        siteId,
        "low_stock_admin" as NotificationTemplateType,
      ))
    ) {
      await sendBrandedEmail(owner.agencyId, {
        to: {
          email: owner.ownerEmail,
          name: owner.ownerName || undefined,
        },
        emailType: "low_stock_admin",
        recipientUserId: owner.agencyOwnerId,
        data: {
          productName,
          currentStock,
          threshold,
          sku: sku || "",
          dashboardUrl,
        },
      });
    }

    await dispatchBusinessEvent({
      eventType: "low_stock",
      siteTemplateType: "low_stock_admin" as NotificationTemplateType,
      permission: "canManageProducts",
      siteId,
      resourceType: "product",
      resourceId: sku || productName,
      title: `Low Stock: ${productName}`,
      message: `${productName}${sku ? ` (${sku})` : ""} is low on stock (${currentStock} remaining, threshold: ${threshold})`,
      link: dashboardUrl,
      metadata: { productName, currentStock, threshold, siteId },
      push: {
        title: `Low Stock: ${productName}`,
        body: `${currentStock} remaining (threshold: ${threshold})${sku ? ` — SKU: ${sku}` : ""}`,
        url: dashboardUrl,
        tag: `low-stock-${sku || productName}`,
      },
      email: {
        emailType: "low_stock_admin",
        data: {
          productName,
          currentStock,
          threshold,
          sku: sku || "",
          dashboardUrl,
        },
      },
      excludeUserIds: [owner.agencyOwnerId],
    });

    console.log(`[BusinessNotify] Low stock alert sent for ${productName}`);
  } catch (error) {
    console.error(
      "[BusinessNotify] Error sending low stock notification:",
      error,
    );
  }
}

// =============================================================================
// QUOTE NOTIFICATIONS
// =============================================================================

interface QuoteNotificationData {
  siteId: string;
  quoteId: string;
  quoteNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  companyName?: string;
  itemCount: number;
  total?: number;
  currency?: string;
  portalUrl?: string;
  items?: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
}

/**
 * Send all notifications for a new quote request:
 * 1. In-app notification to business owner
 * 2. Email to business owner
 * 3. Email to customer (confirmation that quote was received)
 */
export async function notifyNewQuote(
  data: QuoteNotificationData,
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const owner = await resolveBusinessOwner(supabase, data.siteId);
    if (!owner) return;

    const businessName = owner.siteName || "Our Business";
    const currency = data.currency || "USD";
    // Quote totals are in main currency unit (not cents) — no /100 needed
    const totalStr = data.total ? formatCurrency(data.total, currency) : "";
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/dashboard/sites/${data.siteId}/ecommerce?view=quotes`;

    // 1. In-app notification to business owner
    if (
      await shouldSendInApp(
        data.siteId,
        "quote_request_owner" as NotificationTemplateType,
      )
    ) {
      await createNotification({
        userId: owner.agencyOwnerId,
        type: "new_quote_request",
        title: `New Quote Request #${data.quoteNumber}`,
        message: `${data.customerName} requested a quote for ${data.itemCount} item${data.itemCount !== 1 ? "s" : ""}${totalStr ? ` (${totalStr})` : ""}`,
        link: dashboardUrl,
        metadata: {
          quoteId: data.quoteId,
          quoteNumber: data.quoteNumber,
          siteId: data.siteId,
          customerEmail: data.customerEmail,
        },
      });

      pushToOwner(owner.agencyOwnerId, {
        title: `New Quote Request #${data.quoteNumber}`,
        body: `${data.customerName} — ${data.itemCount} item${data.itemCount !== 1 ? "s" : ""}${totalStr ? ` (${totalStr})` : ""}`,
        url: dashboardUrl,
        tag: `quote-${data.quoteId}`,
      }).catch(() => {});
    }

    // 2 & 3. Emails in parallel
    const emailPromises: Promise<unknown>[] = [];

    // Email to business owner
    if (
      owner.ownerEmail &&
      (await shouldSendEmail(
        data.siteId,
        "quote_request_owner" as NotificationTemplateType,
      ))
    ) {
      emailPromises.push(
        sendBrandedEmail(owner.agencyId, {
          to: {
            email: owner.ownerEmail,
            name: owner.ownerName || undefined,
          },
          emailType: "quote_request_owner",
          recipientUserId: owner.agencyOwnerId,
          data: {
            customerName: data.customerName,
            customerEmail: data.customerEmail,
            customerPhone: data.customerPhone || "",
            companyName: data.companyName || "",
            quoteNumber: data.quoteNumber,
            itemCount: data.itemCount,
            total: totalStr,
            dashboardUrl,
            items: data.items || [],
            currency,
          },
        }),
      );
    }

    // Email to customer (confirmation that quote request was received)
    if (
      data.customerEmail &&
      (await shouldSendEmail(
        data.siteId,
        "quote_request_customer" as NotificationTemplateType,
      ))
    ) {
      emailPromises.push(
        sendBrandedEmail(owner.agencyId, {
          to: { email: data.customerEmail, name: data.customerName },
          emailType: "quote_request_customer",
          siteId: data.siteId,
          data: {
            customerName: data.customerName,
            quoteNumber: data.quoteNumber,
            itemCount: data.itemCount,
            businessName,
            items: data.items || [],
            currency,
            trackQuoteUrl: data.portalUrl,
          },
        }),
      );
    }

    if (emailPromises.length > 0) {
      await Promise.all(emailPromises);
    }

    await dispatchBusinessEvent({
      eventType: "new_quote_request",
      siteTemplateType: "quote_request_owner" as NotificationTemplateType,
      permission: "canManageQuotes",
      siteId: data.siteId,
      resourceType: "quote",
      resourceId: data.quoteId,
      title: `New Quote Request #${data.quoteNumber}`,
      message: `${data.customerName} requested a quote for ${data.itemCount} item${data.itemCount !== 1 ? "s" : ""}${totalStr ? ` (${totalStr})` : ""}`,
      link: dashboardUrl,
      metadata: {
        quoteId: data.quoteId,
        quoteNumber: data.quoteNumber,
        siteId: data.siteId,
        customerEmail: data.customerEmail,
      },
      push: {
        title: `New Quote Request #${data.quoteNumber}`,
        body: `${data.customerName} — ${data.itemCount} item${data.itemCount !== 1 ? "s" : ""}${totalStr ? ` (${totalStr})` : ""}`,
        url: dashboardUrl,
        tag: `quote-${data.quoteId}`,
      },
      email: {
        emailType: "quote_request_owner",
        data: {
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone || "",
          companyName: data.companyName || "",
          quoteNumber: data.quoteNumber,
          itemCount: data.itemCount,
          total: totalStr,
          dashboardUrl,
          items: data.items || [],
          currency,
        },
      },
      excludeUserIds: [owner.agencyOwnerId],
    });

    console.log(
      `[BusinessNotify] Quote request notifications sent for quote ${data.quoteNumber}`,
    );
  } catch (error) {
    console.error(
      "[BusinessNotify] Error sending quote request notifications:",
      error,
    );
  }
}

/**
 * Send notifications when a quote is accepted by the customer:
 * 1. In-app notification to business owner
 * 2. Email to business owner
 * 3. Email to customer (confirmation of acceptance)
 */
export async function notifyQuoteAccepted(
  siteId: string,
  quoteNumber: string,
  customerEmail: string,
  customerName: string,
  total?: string,
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const owner = await resolveBusinessOwner(supabase, siteId);
    if (!owner) return;

    const businessName = owner.siteName || "Our Business";
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/dashboard/sites/${siteId}/ecommerce?view=quotes`;

    // 1. In-app notification to business owner
    if (
      await shouldSendInApp(
        siteId,
        "quote_accepted_owner" as NotificationTemplateType,
      )
    ) {
      await createNotification({
        userId: owner.agencyOwnerId,
        type: "quote_accepted",
        title: `Quote #${quoteNumber} Accepted`,
        message: `${customerName} accepted quote #${quoteNumber}${total ? ` (${total})` : ""}`,
        link: dashboardUrl,
        metadata: { quoteNumber, siteId },
      });

      pushToOwner(owner.agencyOwnerId, {
        title: `Quote #${quoteNumber} Accepted`,
        body: `${customerName}${total ? ` — ${total}` : ""}`,
        url: dashboardUrl,
        tag: `quote-accepted-${quoteNumber}`,
      }).catch(() => {});
    }

    const emailPromises: Promise<unknown>[] = [];

    // 2. Email to business owner
    if (
      owner.ownerEmail &&
      (await shouldSendEmail(
        siteId,
        "quote_accepted_owner" as NotificationTemplateType,
      ))
    ) {
      emailPromises.push(
        sendBrandedEmail(owner.agencyId, {
          to: {
            email: owner.ownerEmail,
            name: owner.ownerName || undefined,
          },
          emailType: "quote_accepted_owner",
          recipientUserId: owner.agencyOwnerId,
          data: {
            customerName,
            customerEmail,
            quoteNumber,
            total: total || "",
            dashboardUrl,
          },
        }),
      );
    }

    // 3. Email to customer (confirmation)
    if (
      customerEmail &&
      (await shouldSendEmail(
        siteId,
        "quote_accepted_customer" as NotificationTemplateType,
      ))
    ) {
      emailPromises.push(
        sendBrandedEmail(owner.agencyId, {
          to: { email: customerEmail, name: customerName },
          emailType: "quote_accepted_customer",
          siteId,
          data: {
            customerName,
            quoteNumber,
            total: total || "",
            businessName,
          },
        }),
      );
    }

    if (emailPromises.length > 0) {
      await Promise.all(emailPromises);
    }

    await dispatchBusinessEvent({
      eventType: "quote_accepted",
      siteTemplateType: "quote_accepted_owner" as NotificationTemplateType,
      permission: "canManageQuotes",
      siteId,
      resourceType: "quote",
      resourceId: quoteNumber,
      title: `Quote #${quoteNumber} Accepted`,
      message: `${customerName} accepted quote #${quoteNumber}${total ? ` (${total})` : ""}`,
      link: dashboardUrl,
      metadata: { quoteNumber, siteId },
      push: {
        title: `Quote #${quoteNumber} Accepted`,
        body: `${customerName}${total ? ` — ${total}` : ""}`,
        url: dashboardUrl,
        tag: `quote-accepted-${quoteNumber}`,
      },
      email: {
        emailType: "quote_accepted_owner",
        data: {
          customerName,
          customerEmail,
          quoteNumber,
          total: total || "",
          dashboardUrl,
        },
      },
      excludeUserIds: [owner.agencyOwnerId],
    });

    console.log(
      `[BusinessNotify] Quote accepted notifications sent for quote ${quoteNumber}`,
    );
  } catch (error) {
    console.error(
      "[BusinessNotify] Error sending quote accepted notifications:",
      error,
    );
  }
}

/**
 * Send notifications when a quote is rejected by the customer:
 * 1. In-app notification to business owner
 * 2. Email to business owner
 */
export async function notifyQuoteRejected(
  siteId: string,
  quoteNumber: string,
  customerEmail: string,
  customerName: string,
  reason?: string,
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const owner = await resolveBusinessOwner(supabase, siteId);
    if (!owner) return;

    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/dashboard/sites/${siteId}/ecommerce?view=quotes`;

    // Fetch quote total for the email
    const { data: rawQuoteData } = await supabase
      .from("mod_ecommod01_quotes" as never)
      .select("total, currency")
      .eq("quote_number", quoteNumber)
      .eq("site_id", siteId)
      .single();
    const quoteData = rawQuoteData as {
      total: number;
      currency: string;
    } | null;
    const total = quoteData?.total
      ? formatCurrency(quoteData.total, quoteData.currency || "USD")
      : "";

    // 1. In-app notification to business owner
    if (
      await shouldSendInApp(
        siteId,
        "quote_rejected_owner" as NotificationTemplateType,
      )
    ) {
      await createNotification({
        userId: owner.agencyOwnerId,
        type: "quote_rejected",
        title: `Quote #${quoteNumber} Rejected`,
        message: `${customerName} rejected quote #${quoteNumber}${reason ? `: ${reason}` : ""}`,
        link: dashboardUrl,
        metadata: { quoteNumber, siteId, reason },
      });

      pushToOwner(owner.agencyOwnerId, {
        title: `Quote #${quoteNumber} Rejected`,
        body: `${customerName}${reason ? ` — ${reason.substring(0, 60)}` : ""}`,
        url: dashboardUrl,
        tag: `quote-rejected-${quoteNumber}`,
      }).catch(() => {});
    }

    // 2. Email to business owner
    if (
      owner.ownerEmail &&
      (await shouldSendEmail(
        siteId,
        "quote_rejected_owner" as NotificationTemplateType,
      ))
    ) {
      await sendBrandedEmail(owner.agencyId, {
        to: {
          email: owner.ownerEmail,
          name: owner.ownerName || undefined,
        },
        emailType: "quote_rejected_owner",
        recipientUserId: owner.agencyOwnerId,
        data: {
          customerName,
          customerEmail,
          quoteNumber,
          totalAmount: total,
          rejectionReason: reason || "",
          dashboardUrl,
        },
      });
    }

    await dispatchBusinessEvent({
      eventType: "quote_rejected",
      siteTemplateType: "quote_rejected_owner" as NotificationTemplateType,
      permission: "canManageQuotes",
      siteId,
      resourceType: "quote",
      resourceId: quoteNumber,
      title: `Quote #${quoteNumber} Rejected`,
      message: `${customerName} rejected quote #${quoteNumber}${reason ? `: ${reason}` : ""}`,
      link: dashboardUrl,
      metadata: { quoteNumber, siteId, reason },
      push: {
        title: `Quote #${quoteNumber} Rejected`,
        body: `${customerName}${reason ? ` — ${reason.substring(0, 60)}` : ""}`,
        url: dashboardUrl,
        tag: `quote-rejected-${quoteNumber}`,
      },
      email: {
        emailType: "quote_rejected_owner",
        data: {
          customerName,
          customerEmail,
          quoteNumber,
          totalAmount: total,
          rejectionReason: reason || "",
          dashboardUrl,
        },
      },
      excludeUserIds: [owner.agencyOwnerId],
    });

    console.log(
      `[BusinessNotify] Quote rejected notifications sent for quote ${quoteNumber}`,
    );
  } catch (error) {
    console.error(
      "[BusinessNotify] Error sending quote rejected notifications:",
      error,
    );
  }
}

// =============================================================================
// BOOKING PAYMENT PROOF NOTIFICATIONS
// =============================================================================

/**
 * Send notification when a customer uploads payment proof for a booking.
 * 1. In-app notification to business owner
 * 2. Email to business owner
 */
export async function notifyBookingPaymentProofUploaded(
  siteId: string,
  serviceName: string,
  customerEmail: string,
  customerName: string,
  amountFormatted: string,
  fileName?: string,
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const owner = await resolveBusinessOwner(supabase, siteId);
    if (!owner) return;

    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/dashboard/sites/${siteId}/booking?view=appointments`;

    // In-app notification to business owner
    if (
      await shouldSendInApp(
        siteId,
        "payment_proof_uploaded_owner" as NotificationTemplateType,
      )
    ) {
      await createNotification({
        userId: owner.agencyOwnerId,
        type: "payment_received",
        title: `Booking Payment Proof: ${serviceName}`,
        message: `${customerName} has uploaded payment proof for their ${serviceName} booking (${amountFormatted}). Please review and verify.`,
        link: dashboardUrl,
        metadata: { serviceName, siteId },
      });

      pushToOwner(owner.agencyOwnerId, {
        title: `Booking Payment Proof: ${serviceName}`,
        body: `${customerName} — ${amountFormatted} (action required)`,
        url: dashboardUrl,
        tag: `booking-proof-${serviceName.replace(/\s+/g, "-").toLowerCase()}`,
      }).catch(() => {});
    }

    // Email to business owner
    if (
      owner.ownerEmail &&
      (await shouldSendEmail(
        siteId,
        "payment_proof_uploaded_owner" as NotificationTemplateType,
      ))
    ) {
      await sendBrandedEmail(owner.agencyId, {
        to: {
          email: owner.ownerEmail,
          name: owner.ownerName || undefined,
        },
        emailType: "payment_proof_uploaded_owner",
        siteId,
        data: {
          serviceName,
          customerName,
          customerEmail,
          total: amountFormatted,
          fileName: fileName || "Receipt",
          businessName: owner.siteName || "Business",
          dashboardUrl,
        },
      });
    }

    await dispatchBusinessEvent({
      eventType: "payment_received",
      siteTemplateType:
        "payment_proof_uploaded_owner" as NotificationTemplateType,
      permission: "canManageBookings",
      siteId,
      resourceType: "appointment",
      resourceId: serviceName,
      title: `Booking Payment Proof: ${serviceName}`,
      message: `${customerName} has uploaded payment proof for their ${serviceName} booking (${amountFormatted}). Please review and verify.`,
      link: dashboardUrl,
      metadata: { serviceName, siteId },
      push: {
        title: `Booking Payment Proof: ${serviceName}`,
        body: `${customerName} — ${amountFormatted} (action required)`,
        url: dashboardUrl,
        tag: `booking-proof-${serviceName.replace(/\s+/g, "-").toLowerCase()}`,
      },
      email: {
        emailType: "payment_proof_uploaded_owner",
        data: {
          serviceName,
          customerName,
          customerEmail,
          total: amountFormatted,
          fileName: fileName || "Receipt",
          businessName: owner.siteName || "Business",
          dashboardUrl,
        },
      },
      excludeUserIds: [owner.agencyOwnerId],
    });

    console.log(
      `[BusinessNotify] Booking payment proof notification sent for ${serviceName}`,
    );
  } catch (error) {
    console.error(
      "[BusinessNotify] Error sending booking payment proof notification:",
      error,
    );
  }
}

/**
 * Send notifications when a customer requests changes to a quote:
 * 1. In-app notification to business owner
 * 2. Email to business owner
 */
export async function notifyQuoteAmendmentRequested(
  siteId: string,
  quoteNumber: string,
  customerEmail: string,
  customerName: string,
  amendmentNotes: string,
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const owner = await resolveBusinessOwner(supabase, siteId);
    if (!owner) return;

    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/dashboard/sites/${siteId}/ecommerce?view=quotes`;
    const truncatedNotes =
      amendmentNotes.length > 200
        ? amendmentNotes.substring(0, 197) + "..."
        : amendmentNotes;

    // 1. In-app notification to business owner
    if (
      await shouldSendInApp(
        siteId,
        "quote_amendment_requested_owner" as NotificationTemplateType,
      )
    ) {
      await createNotification({
        userId: owner.agencyOwnerId,
        type: "quote_amendment_requested",
        title: `Quote #${quoteNumber} — Changes Requested`,
        message: `${customerName} requested changes: "${truncatedNotes}"`,
        link: dashboardUrl,
        metadata: { quoteNumber, siteId, customerEmail },
      });

      pushToOwner(owner.agencyOwnerId, {
        title: `Quote #${quoteNumber} — Changes Requested`,
        body: `${customerName}: "${truncatedNotes.substring(0, 60)}${truncatedNotes.length > 60 ? "..." : ""}"`,
        url: dashboardUrl,
        tag: `quote-amendment-${quoteNumber}`,
      }).catch(() => {});
    }

    // 2. Email to business owner
    if (
      owner.ownerEmail &&
      (await shouldSendEmail(
        siteId,
        "quote_amendment_requested_owner" as NotificationTemplateType,
      ))
    ) {
      await sendBrandedEmail(owner.agencyId, {
        to: {
          email: owner.ownerEmail,
          name: owner.ownerName || undefined,
        },
        emailType: "quote_amendment_requested_owner",
        recipientUserId: owner.agencyOwnerId,
        data: {
          customerName,
          customerEmail,
          quoteNumber,
          amendmentNotes: truncatedNotes,
          dashboardUrl,
        },
      });
    }

    await dispatchBusinessEvent({
      eventType: "quote_amendment_requested",
      siteTemplateType:
        "quote_amendment_requested_owner" as NotificationTemplateType,
      permission: "canManageQuotes",
      siteId,
      resourceType: "quote",
      resourceId: quoteNumber,
      title: `Quote #${quoteNumber} — Changes Requested`,
      message: `${customerName} requested changes: "${truncatedNotes}"`,
      link: dashboardUrl,
      metadata: { quoteNumber, siteId, customerEmail },
      push: {
        title: `Quote #${quoteNumber} — Changes Requested`,
        body: `${customerName}: "${truncatedNotes.substring(0, 60)}${truncatedNotes.length > 60 ? "..." : ""}"`,
        url: dashboardUrl,
        tag: `quote-amendment-${quoteNumber}`,
      },
      email: {
        emailType: "quote_amendment_requested_owner",
        data: {
          customerName,
          customerEmail,
          quoteNumber,
          amendmentNotes: truncatedNotes,
          dashboardUrl,
        },
      },
      excludeUserIds: [owner.agencyOwnerId],
    });

    console.log(
      `[BusinessNotify] Quote amendment notifications sent for quote ${quoteNumber}`,
    );
  } catch (error) {
    console.error(
      "[BusinessNotify] Error sending quote amendment notifications:",
      error,
    );
  }
}
