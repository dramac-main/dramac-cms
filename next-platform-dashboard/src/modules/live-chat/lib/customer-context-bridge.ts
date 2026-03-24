/**
 * Customer Context Bridge
 *
 * Fetches cross-module customer context (orders, bookings, CRM contact)
 * for the live chat AI responder. Queried by visitor email so the AI
 * can provide informed, contextual support.
 */

import { createAdminClient } from "@/lib/supabase/admin";

export interface CustomerContext {
  crmContact: {
    id: string;
    firstName: string;
    lastName: string;
    leadStatus: string;
    source: string;
    tags: string[];
  } | null;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    total: number;
    currency: string;
    createdAt: string;
    itemCount: number;
  }>;
  recentBookings: Array<{
    id: string;
    serviceName: string;
    staffName: string | null;
    startTime: string;
    status: string;
    price: number;
    currency: string;
  }>;
}

/**
 * Build a cross-module customer profile from the visitor's email.
 * Returns null if no email is available (anonymous visitor).
 */
export async function getCustomerContext(
  siteId: string,
  email: string | null | undefined,
): Promise<CustomerContext | null> {
  if (!email) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  const [crmRes, ordersRes, bookingsRes] = await Promise.all([
    // CRM contact lookup
    supabase
      .from("crm_contacts")
      .select("id, first_name, last_name, lead_status, source, tags")
      .eq("site_id", siteId)
      .eq("email", email)
      .limit(1)
      .single(),

    // Recent orders (last 5)
    supabase
      .from("mod_ecommod01_orders")
      .select(
        "id, order_number, status, payment_status, total, currency, created_at",
      )
      .eq("site_id", siteId)
      .eq("customer_email", email)
      .order("created_at", { ascending: false })
      .limit(5),

    // Recent bookings (last 5)
    supabase
      .from("mod_bookmod01_appointments")
      .select(
        "id, start_time, status, customer_name, service:mod_bookmod01_services(name, price, currency), staff:mod_bookmod01_staff(name)",
      )
      .eq("site_id", siteId)
      .eq("customer_email", email)
      .order("start_time", { ascending: false })
      .limit(5),
  ]);

  const crm = crmRes.data;
  const orders = ordersRes.data || [];
  const bookings = bookingsRes.data || [];

  // If no data found at all, return null to avoid adding empty context
  if (!crm && orders.length === 0 && bookings.length === 0) {
    return null;
  }

  // Get item counts for orders
  const orderItemCounts: Record<string, number> = {};
  if (orders.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderIds = orders.map((o: any) => o.id);
    const { data: items } = await supabase
      .from("mod_ecommod01_order_items")
      .select("order_id")
      .in("order_id", orderIds);

    if (items) {
      for (const item of items) {
        orderItemCounts[item.order_id] =
          (orderItemCounts[item.order_id] || 0) + 1;
      }
    }
  }

  return {
    crmContact: crm
      ? {
          id: crm.id,
          firstName: crm.first_name || "",
          lastName: crm.last_name || "",
          leadStatus: crm.lead_status || "unknown",
          source: crm.source || "unknown",
          tags: crm.tags || [],
        }
      : null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recentOrders: orders.map((o: any) => ({
      id: o.id,
      orderNumber: o.order_number,
      status: o.status,
      paymentStatus: o.payment_status,
      total: o.total,
      currency: o.currency || "USD",
      createdAt: o.created_at,
      itemCount: orderItemCounts[o.id] || 0,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recentBookings: bookings.map((b: any) => ({
      id: b.id,
      serviceName: b.service?.name || "Unknown Service",
      staffName: b.staff?.name || null,
      startTime: b.start_time,
      status: b.status,
      price: b.service?.price || 0,
      currency: b.service?.currency || "USD",
    })),
  };
}

/**
 * Format customer context into a text block for the AI system prompt.
 */
export function formatCustomerContext(ctx: CustomerContext): string {
  const parts: string[] = [];

  if (ctx.crmContact) {
    const c = ctx.crmContact;
    parts.push(
      `CRM PROFILE:\n` +
        `- Name: ${c.firstName} ${c.lastName}\n` +
        `- Status: ${c.leadStatus}\n` +
        `- Source: ${c.source}\n` +
        (c.tags.length > 0 ? `- Tags: ${c.tags.join(", ")}\n` : ""),
    );
  }

  if (ctx.recentOrders.length > 0) {
    const orderLines = ctx.recentOrders.map(
      (o) =>
        `- ${o.orderNumber}: ${o.status} (${o.paymentStatus}), ${o.currency} ${(o.total / 100).toFixed(2)}, ${o.itemCount} item(s), ${new Date(o.createdAt).toLocaleDateString()}`,
    );
    parts.push(`RECENT ORDERS:\n${orderLines.join("\n")}`);
  }

  if (ctx.recentBookings.length > 0) {
    const bookingLines = ctx.recentBookings.map(
      (b) =>
        `- ${b.serviceName}${b.staffName ? ` with ${b.staffName}` : ""}: ${b.status}, ${new Date(b.startTime).toLocaleString()}`,
    );
    parts.push(`RECENT BOOKINGS:\n${bookingLines.join("\n")}`);
  }

  return parts.join("\n\n");
}
