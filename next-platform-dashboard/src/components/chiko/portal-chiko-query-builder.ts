/**
 * Portal Chiko Query Builder
 *
 * Builds SQL context from Supabase for Chiko's AI responses
 * scoped to a single portal client's sites (hard tenancy).
 *
 * Every query filters by `site_id IN (client's sites)` so that cross-client
 * data leakage is impossible even if the classifier or AI goes off-script.
 *
 * 7 categories: revenue, bookings, clients, orders, chat, marketing, general
 * Results capped at ~8000 chars (~2000 tokens) of context.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { classifyQuestion, type QueryCategory } from "./chiko-query-builder";

export { classifyQuestion, type QueryCategory };

interface QueryResult {
  category: QueryCategory;
  context: string;
}

export interface PortalChikoScope {
  clientId: string;
  agencyId: string;
  siteIds: string[];
  clientName: string;
  companyName: string;
}

// ============================================================================
// Helpers
// ============================================================================

const DAYS = (n: number) =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
const DAYS_FROM_NOW = (n: number) =>
  new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString();

function emptyScopeMessage(companyName: string): string {
  return `No sites linked to ${companyName || "your account"} yet. Once your sites are set up, I'll be able to report on their data.`;
}

// ============================================================================
// Query Builders — scoped by site_id IN (...)
// ============================================================================

async function queryRevenue(scope: PortalChikoScope): Promise<string> {
  if (scope.siteIds.length === 0) return emptyScopeMessage(scope.companyName);
  const admin = createAdminClient();
  const thirtyDaysAgo = DAYS(30);

  // Invoices for client's sites
  const { data: invoices } = await (admin as any)
    .from("invoices")
    .select("total, amount_paid, status, issue_date, due_date, paid_date")
    .in("site_id", scope.siteIds)
    .gte("issue_date", thirtyDaysAgo.split("T")[0])
    .order("issue_date", { ascending: false })
    .limit(50);

  // Orders for client's sites
  const { data: orders } = await (admin as any)
    .from("orders")
    .select("total_amount, status, payment_status, created_at")
    .in("site_id", scope.siteIds)
    .gte("created_at", thirtyDaysAgo)
    .limit(200);

  const parts: string[] = [];

  if (invoices?.length) {
    const paid = invoices.filter((i: any) => i.status === "paid");
    const outstanding = invoices.filter((i: any) =>
      ["sent", "overdue", "partial"].includes(i.status),
    );
    const revenue = paid.reduce(
      (s: number, i: any) => s + (i.amount_paid ?? i.total ?? 0),
      0,
    );
    const owed = outstanding.reduce(
      (s: number, i: any) => s + ((i.total ?? 0) - (i.amount_paid ?? 0)),
      0,
    );
    parts.push(
      `Invoices (30d): ${invoices.length} total, ${paid.length} paid ($${(revenue / 100).toFixed(2)}), ${outstanding.length} outstanding ($${(owed / 100).toFixed(2)})`,
    );
  }

  if (orders?.length) {
    const paidOrders = orders.filter(
      (o: any) => o.payment_status === "paid" || o.status === "completed",
    );
    const orderRevenue = paidOrders.reduce(
      (s: number, o: any) => s + (o.total_amount || 0),
      0,
    );
    parts.push(
      `Orders (30d): ${orders.length} total, ${paidOrders.length} paid ($${(orderRevenue / 100).toFixed(2)})`,
    );
  }

  return (
    parts.join("\n") ||
    `No revenue data found in the last 30 days for ${scope.companyName || "your sites"}.`
  );
}

async function queryBookings(scope: PortalChikoScope): Promise<string> {
  if (scope.siteIds.length === 0) return emptyScopeMessage(scope.companyName);
  const admin = createAdminClient();

  const { data: recent } = await (admin as any)
    .from("bookings")
    .select(
      "id, status, start_time, end_time, service_name, customer_name, created_at",
    )
    .in("site_id", scope.siteIds)
    .gte("start_time", DAYS(7))
    .lte("start_time", DAYS_FROM_NOW(30))
    .order("start_time", { ascending: true })
    .limit(30);

  if (!recent?.length)
    return `No bookings found for ${scope.companyName || "your sites"} in the last week or next 30 days.`;

  const now = Date.now();
  const upcoming = recent.filter(
    (b: any) => new Date(b.start_time).getTime() > now,
  );
  const past = recent.filter(
    (b: any) => new Date(b.start_time).getTime() <= now,
  );

  const statuses: Record<string, number> = {};
  for (const b of recent) {
    statuses[b.status] = (statuses[b.status] || 0) + 1;
  }

  const parts: string[] = [];
  parts.push(`Upcoming bookings: ${upcoming.length}`);
  parts.push(`Recent past bookings (last 7d): ${past.length}`);
  parts.push(`Status breakdown: ${JSON.stringify(statuses)}`);
  if (upcoming.length) {
    parts.push(
      `Next bookings: ${JSON.stringify(
        upcoming.slice(0, 5).map((b: any) => ({
          start: b.start_time,
          service: b.service_name,
          customer: b.customer_name,
          status: b.status,
        })),
      )}`,
    );
  }
  return parts.join("\n");
}

async function queryClients(scope: PortalChikoScope): Promise<string> {
  // "Clients" for a portal user means THEIR customers (CRM contacts).
  if (scope.siteIds.length === 0) return emptyScopeMessage(scope.companyName);
  const admin = createAdminClient();
  const thirtyDaysAgo = DAYS(30);

  const { count: totalContacts } = await (admin as any)
    .from("crm_contacts")
    .select("*", { count: "exact", head: true })
    .in("site_id", scope.siteIds);

  const { count: newContacts } = await (admin as any)
    .from("crm_contacts")
    .select("*", { count: "exact", head: true })
    .in("site_id", scope.siteIds)
    .gte("created_at", thirtyDaysAgo);

  const { count: customerCount } = await (admin as any)
    .from("customers")
    .select("*", { count: "exact", head: true })
    .in("site_id", scope.siteIds);

  const parts: string[] = [];
  parts.push(`Total CRM contacts: ${totalContacts ?? 0}`);
  parts.push(`New contacts (30d): ${newContacts ?? 0}`);
  parts.push(`Ecommerce customers: ${customerCount ?? 0}`);
  return parts.join("\n");
}

async function queryOrders(scope: PortalChikoScope): Promise<string> {
  if (scope.siteIds.length === 0) return emptyScopeMessage(scope.companyName);
  const admin = createAdminClient();
  const thirtyDaysAgo = DAYS(30);

  const { data: orders } = await (admin as any)
    .from("orders")
    .select(
      "id, status, payment_status, total_amount, created_at, customer_email",
    )
    .in("site_id", scope.siteIds)
    .gte("created_at", thirtyDaysAgo)
    .order("created_at", { ascending: false })
    .limit(50);

  if (!orders?.length)
    return `No orders for ${scope.companyName || "your sites"} in the last 30 days.`;

  const totalRevenue = orders.reduce(
    (s: number, o: any) => s + (o.total_amount || 0),
    0,
  );
  const statusCounts: Record<string, number> = {};
  const paymentStatusCounts: Record<string, number> = {};
  for (const o of orders) {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    if (o.payment_status) {
      paymentStatusCounts[o.payment_status] =
        (paymentStatusCounts[o.payment_status] || 0) + 1;
    }
  }

  // Top products via order_items (scoped by site)
  const { data: topItems } = await (admin as any)
    .from("order_items")
    .select("product_name, quantity, site_id")
    .in("site_id", scope.siteIds)
    .gte("created_at", thirtyDaysAgo)
    .limit(200);

  const productTotals: Record<string, number> = {};
  for (const it of topItems || []) {
    if (!it.product_name) continue;
    productTotals[it.product_name] =
      (productTotals[it.product_name] || 0) + (it.quantity || 0);
  }
  const topProducts = Object.entries(productTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const parts: string[] = [];
  parts.push(
    `Orders (30d): ${orders.length}, Gross: $${(totalRevenue / 100).toFixed(2)}`,
  );
  parts.push(`Order status: ${JSON.stringify(statusCounts)}`);
  if (Object.keys(paymentStatusCounts).length) {
    parts.push(`Payment status: ${JSON.stringify(paymentStatusCounts)}`);
  }
  if (topProducts.length) {
    parts.push(
      `Top products (by qty): ${topProducts.map(([n, q]) => `${n} (${q})`).join(", ")}`,
    );
  }
  return parts.join("\n");
}

async function queryChat(scope: PortalChikoScope): Promise<string> {
  if (scope.siteIds.length === 0) return emptyScopeMessage(scope.companyName);
  const admin = createAdminClient();
  const sevenDaysAgo = DAYS(7);

  const { data: sessions } = await (admin as any)
    .from("chat_sessions")
    .select("id, status, visitor_name, created_at, ended_at")
    .in("site_id", scope.siteIds)
    .gte("created_at", sevenDaysAgo)
    .order("created_at", { ascending: false })
    .limit(50);

  if (!sessions?.length)
    return `No chat sessions for ${scope.companyName || "your sites"} in the last 7 days.`;

  const statusCounts: Record<string, number> = {};
  for (const s of sessions) {
    statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
  }

  return `Chat sessions (7d): ${sessions.length}\nStatus: ${JSON.stringify(
    statusCounts,
  )}`;
}

async function queryMarketing(scope: PortalChikoScope): Promise<string> {
  if (scope.siteIds.length === 0) return emptyScopeMessage(scope.companyName);
  const admin = createAdminClient();
  const thirtyDaysAgo = DAYS(30);

  const { data: campaigns } = await (admin as any)
    .from("email_campaigns")
    .select("id, name, status, sent_count, open_count, click_count, created_at")
    .in("site_id", scope.siteIds)
    .gte("created_at", thirtyDaysAgo)
    .order("created_at", { ascending: false })
    .limit(10);

  const { count: formSubs } = await (admin as any)
    .from("form_submissions")
    .select("*", { count: "exact", head: true })
    .in("site_id", scope.siteIds)
    .gte("created_at", thirtyDaysAgo);

  const parts: string[] = [];
  if (campaigns?.length) {
    const sent = campaigns.reduce(
      (s: number, c: any) => s + (c.sent_count || 0),
      0,
    );
    const opened = campaigns.reduce(
      (s: number, c: any) => s + (c.open_count || 0),
      0,
    );
    const clicked = campaigns.reduce(
      (s: number, c: any) => s + (c.click_count || 0),
      0,
    );
    parts.push(
      `Campaigns (30d): ${campaigns.length}, Sent: ${sent}, Opened: ${opened}, Clicked: ${clicked}`,
    );
  }
  parts.push(`Form submissions (30d): ${formSubs ?? 0}`);
  return parts.join("\n") || "No marketing data found.";
}

async function queryGeneral(scope: PortalChikoScope): Promise<string> {
  if (scope.siteIds.length === 0) return emptyScopeMessage(scope.companyName);
  const admin = createAdminClient();
  const thirtyDaysAgo = DAYS(30);

  const { data: sites } = await (admin as any)
    .from("sites")
    .select("id, name, published, created_at")
    .in("id", scope.siteIds);

  // Parallel high-level counts
  const [ordersAgg, bookingsAgg, invoicesAgg] = await Promise.all([
    (admin as any)
      .from("orders")
      .select("total_amount, payment_status, status")
      .in("site_id", scope.siteIds)
      .gte("created_at", thirtyDaysAgo)
      .limit(500),
    (admin as any)
      .from("bookings")
      .select("id, status")
      .in("site_id", scope.siteIds)
      .gte("created_at", thirtyDaysAgo)
      .limit(500),
    (admin as any)
      .from("invoices")
      .select("total, amount_paid, status")
      .in("site_id", scope.siteIds)
      .gte("issue_date", thirtyDaysAgo.split("T")[0])
      .limit(500),
  ]);

  const orders = (ordersAgg.data as any[]) || [];
  const bookings = (bookingsAgg.data as any[]) || [];
  const invoices = (invoicesAgg.data as any[]) || [];

  const paidOrderRevenue = orders
    .filter((o) => o.payment_status === "paid" || o.status === "completed")
    .reduce((s, o) => s + (o.total_amount || 0), 0);
  const paidInvoiceRevenue = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + (i.amount_paid ?? i.total ?? 0), 0);

  const parts: string[] = [];
  parts.push(
    `Business: ${scope.companyName || scope.clientName || "your account"}`,
  );
  parts.push(
    `Sites (${sites?.length ?? 0}): ${(sites || [])
      .map((s: any) => `${s.name}${s.published ? "" : " (draft)"}`)
      .join(", ") || "none"}`,
  );
  parts.push(
    `Last 30 days: ${orders.length} orders, ${bookings.length} bookings, ${invoices.length} invoices.`,
  );
  parts.push(
    `Revenue (30d): $${((paidOrderRevenue + paidInvoiceRevenue) / 100).toFixed(2)} (orders $${(
      paidOrderRevenue / 100
    ).toFixed(2)} + invoices $${(paidInvoiceRevenue / 100).toFixed(2)})`,
  );

  return parts.join("\n");
}

// ============================================================================
// Main Builder
// ============================================================================

const QUERY_MAP: Record<
  QueryCategory,
  (scope: PortalChikoScope) => Promise<string>
> = {
  revenue: queryRevenue,
  bookings: queryBookings,
  clients: queryClients,
  orders: queryOrders,
  chat: queryChat,
  marketing: queryMarketing,
  general: queryGeneral,
};

export async function buildPortalContext(
  scope: PortalChikoScope,
  question: string,
): Promise<QueryResult> {
  const category = classifyQuestion(question);
  const fn = QUERY_MAP[category];

  try {
    const context = await fn(scope);
    const truncated =
      context.length > 8000
        ? context.slice(0, 8000) + "\n[truncated]"
        : context;
    return { category, context: truncated };
  } catch (error) {
    console.error(`[Portal Chiko] Query error for ${category}:`, error);
    return {
      category,
      context: `Error fetching ${category} data. Some tables may not yet exist for your sites.`,
    };
  }
}
