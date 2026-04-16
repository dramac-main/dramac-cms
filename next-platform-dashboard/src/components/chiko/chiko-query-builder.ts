/**
 * Chiko Query Builder
 *
 * Phase BIL-10: Chiko AI Business Assistant
 *
 * Builds SQL context from Supabase for Chiko's AI responses.
 * 7 query categories: revenue, bookings, clients, orders, chat, marketing, general
 * All queries scoped by agency_id for multi-tenant safety.
 * Results capped at ~2000 tokens of context.
 */

import { createAdminClient } from "@/lib/supabase/admin";

// ============================================================================
// Types
// ============================================================================

export type QueryCategory =
  | "revenue"
  | "bookings"
  | "clients"
  | "orders"
  | "chat"
  | "marketing"
  | "general";

interface QueryResult {
  category: QueryCategory;
  context: string;
}

// ============================================================================
// Category Classification
// ============================================================================

const CATEGORY_KEYWORDS: Record<QueryCategory, string[]> = {
  revenue: [
    "revenue",
    "income",
    "money",
    "earn",
    "mrr",
    "arr",
    "billing",
    "subscription",
    "payment",
    "invoice",
    "sales",
    "profit",
    "cost",
    "fee",
  ],
  bookings: [
    "booking",
    "appointment",
    "schedule",
    "calendar",
    "reservation",
    "session",
    "slot",
    "availability",
  ],
  clients: [
    "client",
    "customer",
    "user",
    "contact",
    "lead",
    "prospect",
    "crm",
    "people",
  ],
  orders: [
    "order",
    "product",
    "shop",
    "store",
    "ecommerce",
    "cart",
    "purchase",
    "item",
    "inventory",
    "stock",
  ],
  chat: [
    "chat",
    "message",
    "conversation",
    "live chat",
    "support",
    "ticket",
    "response time",
  ],
  marketing: [
    "marketing",
    "campaign",
    "email",
    "newsletter",
    "form",
    "submission",
    "lead",
    "funnel",
    "conversion",
    "seo",
    "traffic",
  ],
  general: [
    "overview",
    "summary",
    "how",
    "what",
    "help",
    "status",
    "dashboard",
    "performance",
    "analytics",
  ],
};

export function classifyQuestion(question: string): QueryCategory {
  const lower = question.toLowerCase();
  const scores: Record<QueryCategory, number> = {
    revenue: 0,
    bookings: 0,
    clients: 0,
    orders: 0,
    chat: 0,
    marketing: 0,
    general: 0,
  };

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        scores[category as QueryCategory] += 1;
      }
    }
  }

  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  // Default to general if no strong match
  return sorted[0][1] > 0 ? (sorted[0][0] as QueryCategory) : "general";
}

// ============================================================================
// Query Builders (scoped by agency_id)
// ============================================================================

async function queryRevenue(agencyId: string): Promise<string> {
  const admin = createAdminClient();

  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  // Get subscription info
  const { data: subs } = await (admin as any)
    .from("paddle_subscriptions")
    .select(
      "plan_name, status, unit_price, billing_cycle, current_period_start, current_period_end",
    )
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false })
    .limit(3);

  // Get recent invoices
  const { data: invoices } = await (admin as any)
    .from("invoices")
    .select("total_amount, status, due_date, created_at")
    .eq("agency_id", agencyId)
    .gte("created_at", thirtyDaysAgo)
    .order("created_at", { ascending: false })
    .limit(10);

  // Get usage for the period
  const { data: usage } = await (admin as any)
    .from("usage_daily")
    .select("usage_type, total_count, overage_count")
    .eq("agency_id", agencyId)
    .gte("date", thirtyDaysAgo.split("T")[0])
    .limit(50);

  const parts: string[] = [];
  if (subs?.length) {
    parts.push(`Current subscriptions: ${JSON.stringify(subs.slice(0, 3))}`);
  }
  if (invoices?.length) {
    const totalRevenue = invoices
      .filter((i: any) => i.status === "paid")
      .reduce((sum: number, i: any) => sum + (i.total_amount || 0), 0);
    parts.push(
      `Last 30 days: ${invoices.length} invoices, $${(totalRevenue / 100).toFixed(2)} total revenue`,
    );
  }
  if (usage?.length) {
    const grouped: Record<string, number> = {};
    for (const u of usage) {
      grouped[u.usage_type] = (grouped[u.usage_type] || 0) + u.total_count;
    }
    parts.push(`Usage (30d): ${JSON.stringify(grouped)}`);
  }

  return parts.join("\n") || "No revenue data found for this agency.";
}

async function queryBookings(agencyId: string): Promise<string> {
  const admin = createAdminClient();

  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const sevenDaysFromNow = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  // Recent bookings
  const { data: recent } = await (admin as any)
    .from("bookings")
    .select(
      "id, status, start_time, end_time, service_name, client_name, created_at",
    )
    .eq("agency_id", agencyId)
    .gte("start_time", sevenDaysAgo)
    .lte("start_time", sevenDaysFromNow)
    .order("start_time", { ascending: true })
    .limit(20);

  if (!recent?.length) return "No bookings found in the next 7 days.";

  const upcoming = recent.filter(
    (b: any) => new Date(b.start_time) > new Date(),
  );
  const past = recent.filter((b: any) => new Date(b.start_time) <= new Date());

  const parts: string[] = [];
  parts.push(`Upcoming bookings: ${upcoming.length}`);
  parts.push(`Recent past bookings: ${past.length}`);
  if (upcoming.length > 0) {
    parts.push(`Next bookings: ${JSON.stringify(upcoming.slice(0, 5))}`);
  }

  // Get status counts
  const statuses: Record<string, number> = {};
  for (const b of recent) {
    statuses[b.status] = (statuses[b.status] || 0) + 1;
  }
  parts.push(`Status breakdown: ${JSON.stringify(statuses)}`);

  return parts.join("\n");
}

async function queryClients(agencyId: string): Promise<string> {
  const admin = createAdminClient();

  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  // Total clients
  const { count: totalClients } = await (admin as any)
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("agency_id", agencyId);

  // New clients last 30 days
  const { count: newClients } = await (admin as any)
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("agency_id", agencyId)
    .gte("created_at", thirtyDaysAgo);

  // Recent clients
  const { data: recentClients } = await (admin as any)
    .from("clients")
    .select("id, full_name, email, status, created_at")
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false })
    .limit(10);

  const parts: string[] = [];
  parts.push(`Total clients: ${totalClients || 0}`);
  parts.push(`New clients (30d): ${newClients || 0}`);
  if (recentClients?.length) {
    parts.push(`Latest clients: ${JSON.stringify(recentClients.slice(0, 5))}`);
  }

  return parts.join("\n");
}

async function queryOrders(agencyId: string): Promise<string> {
  const admin = createAdminClient();

  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  // Recent orders
  const { data: orders } = await (admin as any)
    .from("orders")
    .select("id, status, total_amount, created_at, item_count")
    .eq("agency_id", agencyId)
    .gte("created_at", thirtyDaysAgo)
    .order("created_at", { ascending: false })
    .limit(20);

  if (!orders?.length) return "No orders in the last 30 days.";

  const totalRevenue = orders.reduce(
    (sum: number, o: any) => sum + (o.total_amount || 0),
    0,
  );
  const statusCounts: Record<string, number> = {};
  for (const o of orders) {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  }

  // Top products
  const { data: topProducts } = await (admin as any)
    .from("order_items")
    .select("product_name, quantity")
    .eq("agency_id", agencyId)
    .gte("created_at", thirtyDaysAgo)
    .order("quantity", { ascending: false })
    .limit(5);

  const parts: string[] = [];
  parts.push(
    `Orders (30d): ${orders.length}, Total: $${(totalRevenue / 100).toFixed(2)}`,
  );
  parts.push(`Status: ${JSON.stringify(statusCounts)}`);
  if (topProducts?.length) {
    parts.push(`Top products: ${JSON.stringify(topProducts)}`);
  }

  return parts.join("\n");
}

async function queryChat(agencyId: string): Promise<string> {
  const admin = createAdminClient();

  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  // Chat sessions
  const { data: sessions } = await (admin as any)
    .from("chat_sessions")
    .select("id, status, visitor_name, created_at, ended_at")
    .eq("agency_id", agencyId)
    .gte("created_at", sevenDaysAgo)
    .order("created_at", { ascending: false })
    .limit(20);

  if (!sessions?.length) return "No chat sessions in the last 7 days.";

  const statusCounts: Record<string, number> = {};
  for (const s of sessions) {
    statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
  }

  const parts: string[] = [];
  parts.push(`Chat sessions (7d): ${sessions.length}`);
  parts.push(`Status: ${JSON.stringify(statusCounts)}`);

  return parts.join("\n");
}

async function queryMarketing(agencyId: string): Promise<string> {
  const admin = createAdminClient();

  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  // Email campaigns
  const { data: campaigns } = await (admin as any)
    .from("email_campaigns")
    .select("id, name, status, sent_count, open_count, click_count, created_at")
    .eq("agency_id", agencyId)
    .gte("created_at", thirtyDaysAgo)
    .order("created_at", { ascending: false })
    .limit(10);

  // Form submissions
  const { count: formSubs } = await (admin as any)
    .from("form_submissions")
    .select("*", { count: "exact", head: true })
    .eq("agency_id", agencyId)
    .gte("created_at", thirtyDaysAgo);

  const parts: string[] = [];
  if (campaigns?.length) {
    const totalSent = campaigns.reduce(
      (s: number, c: any) => s + (c.sent_count || 0),
      0,
    );
    const totalOpened = campaigns.reduce(
      (s: number, c: any) => s + (c.open_count || 0),
      0,
    );
    parts.push(
      `Campaigns (30d): ${campaigns.length}, Sent: ${totalSent}, Opened: ${totalOpened}`,
    );
  }
  parts.push(`Form submissions (30d): ${formSubs || 0}`);

  return parts.join("\n") || "No marketing data found.";
}

async function queryGeneral(agencyId: string): Promise<string> {
  const admin = createAdminClient();

  // Get agency profile
  const { data: agency } = await (admin as any)
    .from("agencies")
    .select("name, plan_name, created_at, site_count")
    .eq("id", agencyId)
    .single();

  // Count active sites
  const { count: siteCount } = await (admin as any)
    .from("sites")
    .select("*", { count: "exact", head: true })
    .eq("agency_id", agencyId);

  // Count clients
  const { count: clientCount } = await (admin as any)
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("agency_id", agencyId);

  const parts: string[] = [];
  if (agency) {
    parts.push(
      `Agency: ${agency.name}, Plan: ${agency.plan_name || "free"}, Created: ${agency.created_at}`,
    );
  }
  parts.push(`Active sites: ${siteCount || 0}`);
  parts.push(`Total clients: ${clientCount || 0}`);

  return parts.join("\n");
}

// ============================================================================
// Main Query Builder
// ============================================================================

const QUERY_MAP: Record<QueryCategory, (agencyId: string) => Promise<string>> =
  {
    revenue: queryRevenue,
    bookings: queryBookings,
    clients: queryClients,
    orders: queryOrders,
    chat: queryChat,
    marketing: queryMarketing,
    general: queryGeneral,
  };

export async function buildContext(
  agencyId: string,
  question: string,
): Promise<QueryResult> {
  const category = classifyQuestion(question);
  const queryFn = QUERY_MAP[category];

  try {
    const context = await queryFn(agencyId);
    // Truncate to ~2000 tokens (~8000 chars)
    const truncated =
      context.length > 8000
        ? context.slice(0, 8000) + "\n[truncated]"
        : context;
    return { category, context: truncated };
  } catch (error) {
    console.error(`[Chiko] Query error for ${category}:`, error);
    return {
      category,
      context: `Error fetching ${category} data. The data tables may not exist yet.`,
    };
  }
}
