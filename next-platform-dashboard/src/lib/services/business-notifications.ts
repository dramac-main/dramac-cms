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
import { formatCurrency, formatDate, formatTime } from "@/lib/locale-config";

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

    // Get site info and owner
    const { data: site } = await supabase
      .from("sites")
      .select("name, agency_id")
      .eq("id", data.siteId)
      .single();

    if (!site) {
      console.error("[BusinessNotify] Site not found:", data.siteId);
      return;
    }

    // Get the agency owner (business owner)
    const { data: agency } = await supabase
      .from("agencies")
      .select("owner_id")
      .eq("id", site.agency_id)
      .single();

    if (!agency?.owner_id) {
      console.error(
        "[BusinessNotify] Agency owner not found for site:",
        data.siteId,
      );
      return;
    }

    // Get owner profile for email
    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", agency.owner_id)
      .single();

    const businessName = site.name || "Our Business";
    const currency = data.currency || "USD";
    const dateStr = formatDate(data.startTime);
    const timeStr = formatTime(data.startTime);
    const priceStr = formatCurrency(data.servicePrice, currency);
    const durationStr =
      data.serviceDuration >= 60
        ? `${Math.floor(data.serviceDuration / 60)}h ${data.serviceDuration % 60 > 0 ? `${data.serviceDuration % 60}m` : ""}`
        : `${data.serviceDuration}m`;
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/sites/${data.siteId}/booking`;

    // 1. In-app notification to business owner
    await createNotification({
      userId: agency.owner_id,
      type: "new_booking",
      title: `New Booking: ${data.serviceName}`,
      message: `${data.customerName} booked ${data.serviceName} for ${dateStr} at ${timeStr} (${priceStr})`,
      link: dashboardUrl,
      metadata: {
        appointmentId: data.appointmentId,
        siteId: data.siteId,
        customerEmail: data.customerEmail,
      },
    });

    // 2 & 3. Email to business owner + customer — sent in PARALLEL for faster delivery.
    // Previously sequential (one after another), which doubled email latency.
    const emailPromises: Promise<unknown>[] = [];

    // Email to business owner
    if (ownerProfile?.email) {
      emailPromises.push(
        sendBrandedEmail(site.agency_id, {
          to: {
            email: ownerProfile.email,
            name: ownerProfile.full_name || undefined,
          },
          emailType: "booking_confirmation_owner",
          recipientUserId: agency.owner_id,
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
            dashboardUrl,
            bookingId: data.appointmentId,
          },
        }),
      );
    }

    // Email to customer (uses SITE branding — customer sees the business name/colors)
    if (data.customerEmail) {
      emailPromises.push(
        sendBrandedEmail(site.agency_id, {
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
            businessName,
            bookingId: data.appointmentId,
          },
        }),
      );
    }

    // Fire both emails at the same time — cuts email latency in half
    if (emailPromises.length > 0) {
      await Promise.all(emailPromises);
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

    const { data: site } = await supabase
      .from("sites")
      .select("name, agency_id")
      .eq("id", data.siteId)
      .single();

    if (!site) {
      console.error("[BusinessNotify] Site not found:", data.siteId);
      return;
    }

    const { data: agency } = await supabase
      .from("agencies")
      .select("owner_id")
      .eq("id", site.agency_id)
      .single();

    if (!agency?.owner_id) {
      console.error(
        "[BusinessNotify] Agency owner not found for site:",
        data.siteId,
      );
      return;
    }

    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", agency.owner_id)
      .single();

    const businessName = site.name || "Our Business";
    const currency = data.currency || "USD";
    const dateStr = formatDate(data.startTime);
    const timeStr = formatTime(data.startTime);
    const priceStr = formatCurrency(data.servicePrice, currency);
    const durationStr =
      data.serviceDuration >= 60
        ? `${Math.floor(data.serviceDuration / 60)}h ${data.serviceDuration % 60 > 0 ? `${data.serviceDuration % 60}m` : ""}`
        : `${data.serviceDuration}m`;
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/sites/${data.siteId}/booking`;

    // 1. In-app notification to business owner
    await createNotification({
      userId: agency.owner_id,
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

    // 2. Email to business owner
    if (ownerProfile?.email) {
      await sendBrandedEmail(site.agency_id, {
        to: {
          email: ownerProfile.email,
          name: ownerProfile.full_name || undefined,
        },
        emailType: "booking_cancelled_owner",
        recipientUserId: agency.owner_id,
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
    if (data.customerEmail) {
      await sendBrandedEmail(site.agency_id, {
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

    // Get site info and owner
    const { data: site } = await supabase
      .from("sites")
      .select("name, agency_id, subdomain, custom_domain")
      .eq("id", data.siteId)
      .single();

    if (!site) {
      console.error("[BusinessNotify] Site not found:", data.siteId);
      return;
    }

    const { data: agency } = await supabase
      .from("agencies")
      .select("owner_id")
      .eq("id", site.agency_id)
      .single();

    if (!agency?.owner_id) {
      console.error("[BusinessNotify] Agency owner not found");
      return;
    }

    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", agency.owner_id)
      .single();

    const businessName = site.name || "Our Store";
    const currency = data.currency || "USD";
    // Ecommerce prices are stored in cents — divide by 100 for display
    const totalStr = formatCurrency(data.total / 100, currency);
    const subtotalStr = formatCurrency(data.subtotal / 100, currency);
    const shippingStr = formatCurrency(data.shipping / 100, currency);
    const taxStr = formatCurrency(data.tax / 100, currency);
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/sites/${data.siteId}/ecommerce/orders`;

    // Build the storefront URL for order confirmation link in customer email
    const siteUrl = site.custom_domain
      ? `https://${site.custom_domain}`
      : site.subdomain
        ? `https://${site.subdomain}.sites.dramacagency.com`
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

    // 1. In-app notification to business owner
    await createNotification({
      userId: agency.owner_id,
      type: "new_order",
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
    });

    // 2. Email to business owner
    if (ownerProfile?.email) {
      await sendBrandedEmail(site.agency_id, {
        to: {
          email: ownerProfile.email,
          name: ownerProfile.full_name || undefined,
        },
        emailType: "order_confirmation_owner",
        recipientUserId: agency.owner_id,
        data: {
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          orderNumber: data.orderNumber,
          items: formattedItems,
          total: totalStr,
          paymentStatus: data.paymentStatus,
          dashboardUrl,
        },
      });
    }

    // 3. Email to customer (uses SITE branding)
    if (data.customerEmail) {
      await sendBrandedEmail(site.agency_id, {
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
    const { data: site } = await supabase
      .from("sites")
      .select("name, agency_id")
      .eq("id", siteId)
      .single();

    if (!site?.agency_id) return;

    const { data: agency } = await supabase
      .from("agencies")
      .select("owner_id")
      .eq("id", site.agency_id)
      .single();

    // In-app notification to business owner
    if (agency?.owner_id) {
      await createNotification({
        userId: agency.owner_id,
        type: "order_shipped",
        title: `Order #${orderNumber} Shipped`,
        message: `Order for ${customerName} has been marked as shipped${trackingNumber ? ` (Tracking: ${trackingNumber})` : ""}`,
        link: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/sites/${siteId}/ecommerce/orders`,
        metadata: { orderNumber, siteId },
      });
    }

    // Email to customer (uses SITE branding)
    await sendBrandedEmail(site?.agency_id || null, {
      to: { email: customerEmail, name: customerName },
      emailType: "order_shipped_customer",
      siteId,
      data: {
        customerName,
        orderNumber,
        trackingNumber: trackingNumber || "",
        trackingUrl: trackingUrl || "",
        businessName: site?.name || "Our Store",
      },
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
    const { data: site } = await supabase
      .from("sites")
      .select("name, agency_id")
      .eq("id", siteId)
      .single();

    if (!site?.agency_id) return;

    const { data: agency } = await supabase
      .from("agencies")
      .select("owner_id")
      .eq("id", site.agency_id)
      .single();

    // In-app notification to business owner
    if (agency?.owner_id) {
      await createNotification({
        userId: agency.owner_id,
        type: "order_delivered",
        title: `Order #${orderNumber} Delivered`,
        message: `Order for ${customerName} has been marked as delivered`,
        link: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/sites/${siteId}/ecommerce/orders`,
        metadata: { orderNumber, siteId },
      });
    }

    // Email to customer (uses SITE branding)
    if (customerEmail) {
      await sendBrandedEmail(site?.agency_id || null, {
        to: { email: customerEmail, name: customerName },
        emailType: "order_delivered_customer",
        siteId,
        data: {
          customerName,
          orderNumber,
          businessName: site?.name || "Our Store",
        },
      });
    }

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
    const { data: site } = await supabase
      .from("sites")
      .select("name, agency_id")
      .eq("id", siteId)
      .single();

    if (!site?.agency_id) return;

    const { data: agency } = await supabase
      .from("agencies")
      .select("owner_id")
      .eq("id", site.agency_id)
      .single();

    const { data: ownerProfile } = agency?.owner_id
      ? await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", agency.owner_id)
          .single()
      : { data: null };

    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/sites/${siteId}/ecommerce/orders`;

    // In-app notification to business owner
    if (agency?.owner_id) {
      await createNotification({
        userId: agency.owner_id,
        type: "order_cancelled",
        title: `Order #${orderNumber} Cancelled`,
        message: `Order from ${customerName} (${total}) has been cancelled${reason ? `: ${reason}` : ""}`,
        link: dashboardUrl,
        metadata: { orderNumber, siteId },
      });
    }

    // Email to business owner
    if (ownerProfile?.email) {
      await sendBrandedEmail(site?.agency_id || null, {
        to: {
          email: ownerProfile.email,
          name: ownerProfile.full_name || undefined,
        },
        emailType: "order_cancelled_owner",
        recipientUserId: agency?.owner_id,
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
    if (customerEmail) {
      await sendBrandedEmail(site?.agency_id || null, {
        to: { email: customerEmail, name: customerName },
        emailType: "order_cancelled_customer",
        siteId,
        data: {
          customerName,
          orderNumber,
          reason: reason || "",
          businessName: site?.name || "Our Store",
        },
      });
    }

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
    const { data: site } = await supabase
      .from("sites")
      .select("name, agency_id")
      .eq("id", siteId)
      .single();

    if (!site?.agency_id) return;

    const { data: agency } = await supabase
      .from("agencies")
      .select("owner_id")
      .eq("id", site.agency_id)
      .single();

    // In-app notification to business owner
    if (agency?.owner_id) {
      await createNotification({
        userId: agency.owner_id,
        type: "payment_received",
        title: `Payment Received: Order #${orderNumber}`,
        message: `${customerName} paid ${total} for order #${orderNumber}${paymentMethod ? ` via ${paymentMethod}` : ""}`,
        link: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/sites/${siteId}/ecommerce/orders`,
        metadata: { orderNumber, siteId },
      });
    }

    if (customerEmail) {
      await sendBrandedEmail(site.agency_id, {
        to: { email: customerEmail, name: customerName },
        emailType: "payment_received_customer",
        siteId,
        data: {
          customerName,
          orderNumber,
          total,
          paymentMethod: paymentMethod || "",
          businessName: site?.name || "Our Store",
        },
      });
    }

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
    const { data: site } = await supabase
      .from("sites")
      .select("name, agency_id")
      .eq("id", siteId)
      .single();

    if (!site?.agency_id) return;

    const { data: agency } = await supabase
      .from("agencies")
      .select("owner_id")
      .eq("id", site.agency_id)
      .single();

    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/sites/${siteId}/ecommerce/orders`;

    // In-app notification to business owner
    if (agency?.owner_id) {
      await createNotification({
        userId: agency.owner_id,
        type: "payment_received",
        title: `Payment Proof Uploaded: Order #${orderNumber}`,
        message: `${customerName} has uploaded payment proof for order #${orderNumber} (${total}). Please review and verify.`,
        link: dashboardUrl,
        metadata: { orderNumber, siteId },
      });
    }

    // Email to business owner
    if (agency?.owner_id) {
      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", agency.owner_id)
        .single();

      if (ownerProfile?.email) {
        await sendBrandedEmail(site.agency_id, {
          to: {
            email: ownerProfile.email,
            name: ownerProfile.full_name || undefined,
          },
          emailType: "payment_proof_uploaded_owner",
          siteId,
          data: {
            orderNumber,
            customerName,
            customerEmail,
            total,
            fileName: fileName || "Receipt",
            businessName: site?.name || "Store",
            dashboardUrl,
          },
        });
      }
    }

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
    const { data: site } = await supabase
      .from("sites")
      .select("name, agency_id")
      .eq("id", siteId)
      .single();

    if (!site?.agency_id) return;

    const { data: agency } = await supabase
      .from("agencies")
      .select("owner_id")
      .eq("id", site.agency_id)
      .single();

    // In-app notification to business owner
    if (agency?.owner_id) {
      await createNotification({
        userId: agency.owner_id,
        type: "refund_issued",
        title: `Refund Issued: Order #${orderNumber}`,
        message: `Refund of ${refundAmount} issued to ${customerName}${reason ? ` — ${reason}` : ""}`,
        link: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/sites/${siteId}/ecommerce/orders`,
        metadata: { orderNumber, siteId },
      });
    }

    // Email to customer (uses SITE branding)
    if (customerEmail) {
      await sendBrandedEmail(site?.agency_id || null, {
        to: { email: customerEmail, name: customerName },
        emailType: "refund_issued_customer",
        siteId,
        data: {
          customerName,
          orderNumber,
          refundAmount,
          reason: reason || "",
          businessName: site?.name || "Our Store",
        },
      });
    }

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
    const { data: site } = await supabase
      .from("sites")
      .select("name, agency_id")
      .eq("id", siteId)
      .single();

    if (!site?.agency_id) return;

    const { data: agency } = await supabase
      .from("agencies")
      .select("owner_id")
      .eq("id", site.agency_id)
      .single();

    const { data: ownerProfile } = agency?.owner_id
      ? await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", agency.owner_id)
          .single()
      : { data: null };

    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/sites/${siteId}/ecommerce/products`;

    // In-app notification to business owner
    if (agency?.owner_id) {
      await createNotification({
        userId: agency.owner_id,
        type: "low_stock",
        title: `Low Stock: ${productName}`,
        message: `${productName}${sku ? ` (${sku})` : ""} is low on stock (${currentStock} remaining, threshold: ${threshold})`,
        link: dashboardUrl,
        metadata: { productName, currentStock, threshold, siteId },
      });
    }

    // Email to business owner
    if (ownerProfile?.email) {
      await sendBrandedEmail(site?.agency_id || null, {
        to: {
          email: ownerProfile.email,
          name: ownerProfile.full_name || undefined,
        },
        emailType: "low_stock_admin",
        recipientUserId: agency?.owner_id,
        data: {
          productName,
          currentStock,
          threshold,
          sku: sku || "",
          dashboardUrl,
        },
      });
    }

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

    const { data: site } = await supabase
      .from("sites")
      .select("name, agency_id")
      .eq("id", data.siteId)
      .single();

    if (!site) {
      console.error("[BusinessNotify] Site not found:", data.siteId);
      return;
    }

    const { data: agency } = await supabase
      .from("agencies")
      .select("owner_id")
      .eq("id", site.agency_id)
      .single();

    if (!agency?.owner_id) {
      console.error(
        "[BusinessNotify] Agency owner not found for site:",
        data.siteId,
      );
      return;
    }

    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", agency.owner_id)
      .single();

    const businessName = site.name || "Our Business";
    const currency = data.currency || "USD";
    const totalStr = data.total ? formatCurrency(data.total / 100, currency) : "";
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/sites/${data.siteId}/ecommerce/quotes`;

    // 1. In-app notification to business owner
    await createNotification({
      userId: agency.owner_id,
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

    // 2 & 3. Emails in parallel
    const emailPromises: Promise<unknown>[] = [];

    // Email to business owner
    if (ownerProfile?.email) {
      emailPromises.push(
        sendBrandedEmail(site.agency_id, {
          to: {
            email: ownerProfile.email,
            name: ownerProfile.full_name || undefined,
          },
          emailType: "quote_request_owner",
          recipientUserId: agency.owner_id,
          data: {
            customerName: data.customerName,
            customerEmail: data.customerEmail,
            customerPhone: data.customerPhone || "",
            companyName: data.companyName || "",
            quoteNumber: data.quoteNumber,
            itemCount: data.itemCount,
            total: totalStr,
            dashboardUrl,
          },
        }),
      );
    }

    // Email to customer (confirmation that quote request was received)
    if (data.customerEmail) {
      emailPromises.push(
        sendBrandedEmail(site.agency_id, {
          to: { email: data.customerEmail, name: data.customerName },
          emailType: "quote_request_customer",
          siteId: data.siteId,
          data: {
            customerName: data.customerName,
            quoteNumber: data.quoteNumber,
            itemCount: data.itemCount,
            businessName,
          },
        }),
      );
    }

    if (emailPromises.length > 0) {
      await Promise.all(emailPromises);
    }

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
    const { data: site } = await supabase
      .from("sites")
      .select("name, agency_id")
      .eq("id", siteId)
      .single();

    if (!site?.agency_id) return;

    const { data: agency } = await supabase
      .from("agencies")
      .select("owner_id")
      .eq("id", site.agency_id)
      .single();

    const { data: ownerProfile } = agency?.owner_id
      ? await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", agency.owner_id)
          .single()
      : { data: null };

    const businessName = site.name || "Our Business";
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/sites/${siteId}/ecommerce/quotes`;

    // 1. In-app notification to business owner
    if (agency?.owner_id) {
      await createNotification({
        userId: agency.owner_id,
        type: "quote_accepted",
        title: `Quote #${quoteNumber} Accepted`,
        message: `${customerName} accepted quote #${quoteNumber}${total ? ` (${total})` : ""}`,
        link: dashboardUrl,
        metadata: { quoteNumber, siteId },
      });
    }

    const emailPromises: Promise<unknown>[] = [];

    // 2. Email to business owner
    if (ownerProfile?.email) {
      emailPromises.push(
        sendBrandedEmail(site.agency_id, {
          to: {
            email: ownerProfile.email,
            name: ownerProfile.full_name || undefined,
          },
          emailType: "quote_accepted_owner",
          recipientUserId: agency?.owner_id,
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
    if (customerEmail) {
      emailPromises.push(
        sendBrandedEmail(site.agency_id, {
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
    const { data: site } = await supabase
      .from("sites")
      .select("name, agency_id")
      .eq("id", siteId)
      .single();

    if (!site?.agency_id) return;

    const { data: agency } = await supabase
      .from("agencies")
      .select("owner_id")
      .eq("id", site.agency_id)
      .single();

    const { data: ownerProfile } = agency?.owner_id
      ? await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", agency.owner_id)
          .single()
      : { data: null };

    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/sites/${siteId}/ecommerce/quotes`;

    // 1. In-app notification to business owner
    if (agency?.owner_id) {
      await createNotification({
        userId: agency.owner_id,
        type: "quote_rejected",
        title: `Quote #${quoteNumber} Rejected`,
        message: `${customerName} rejected quote #${quoteNumber}${reason ? `: ${reason}` : ""}`,
        link: dashboardUrl,
        metadata: { quoteNumber, siteId, reason },
      });
    }

    // 2. Email to business owner
    if (ownerProfile?.email) {
      await sendBrandedEmail(site.agency_id, {
        to: {
          email: ownerProfile.email,
          name: ownerProfile.full_name || undefined,
        },
        emailType: "quote_rejected_owner",
        recipientUserId: agency?.owner_id,
        data: {
          customerName,
          customerEmail,
          quoteNumber,
          reason: reason || "",
          dashboardUrl,
        },
      });
    }

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
