/**
 * CSV Export Utilities
 *
 * Phase MKT-03: Email Analytics & Tracking
 *
 * Exports campaign report data and subscriber lists as CSV.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { MKT_TABLES } from "@/modules/marketing/lib/marketing-constants";

/**
 * Export campaign send report as CSV string.
 */
export async function exportCampaignReport(
  campaignId: string,
): Promise<string> {
  const supabase = createAdminClient() as any;

  const { data: sends } = await supabase
    .from(MKT_TABLES.campaignSends)
    .select("*")
    .eq("campaign_id", campaignId)
    .order("sent_at", { ascending: false });

  const headers = [
    "Email",
    "Status",
    "Variant",
    "Sent At",
    "Delivered At",
    "First Opened At",
    "Last Opened At",
    "Open Count",
    "First Clicked At",
    "Last Clicked At",
    "Click Count",
  ];

  const rows = (sends ?? []).map((s: any) => [
    s.subscriber_email || "",
    s.status || "",
    s.variant || "",
    s.sent_at || "",
    s.delivered_at || "",
    s.first_opened_at || "",
    s.last_opened_at || "",
    String(s.open_count || 0),
    s.first_clicked_at || "",
    s.last_clicked_at || "",
    String(s.click_count || 0),
  ]);

  return formatCsv(headers, rows);
}

/**
 * Export campaign link performance as CSV.
 */
export async function exportCampaignLinks(campaignId: string): Promise<string> {
  const supabase = createAdminClient() as any;

  const { data: links } = await supabase
    .from(MKT_TABLES.campaignLinks)
    .select("*")
    .eq("campaign_id", campaignId)
    .order("total_clicks", { ascending: false });

  const headers = ["URL", "Total Clicks", "Unique Clicks"];

  const rows = (links ?? []).map((l: any) => [
    l.original_url || "",
    String(l.total_clicks || 0),
    String(l.unique_clicks || 0),
  ]);

  return formatCsv(headers, rows);
}

/**
 * Export subscriber list as CSV.
 */
export async function exportSubscribers(
  siteId: string,
  filters?: { status?: string; tags?: string[] },
): Promise<string> {
  const supabase = createAdminClient() as any;

  let query = supabase
    .from(MKT_TABLES.subscribers)
    .select("*")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.tags && filters.tags.length > 0) {
    query = query.overlaps("tags", filters.tags);
  }

  const { data: subscribers } = await query;

  const headers = [
    "Email",
    "First Name",
    "Last Name",
    "Status",
    "Source",
    "Tags",
    "Engagement Score",
    "Last Email Opened At",
    "Last Email Clicked At",
    "Created At",
    "Unsubscribed At",
  ];

  const rows = (subscribers ?? []).map((s: any) => [
    s.email || "",
    s.first_name || "",
    s.last_name || "",
    s.status || "",
    s.source || "",
    Array.isArray(s.tags) ? s.tags.join("; ") : "",
    String(s.engagement_score ?? ""),
    s.last_email_opened_at || "",
    s.last_email_clicked_at || "",
    s.created_at || "",
    s.unsubscribed_at || "",
  ]);

  return formatCsv(headers, rows);
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function formatCsv(headers: string[], rows: string[][]): string {
  const headerLine = headers.map(escapeCsvField).join(",");
  const dataLines = rows.map((row) => row.map(escapeCsvField).join(","));
  return [headerLine, ...dataLines].join("\n");
}

function escapeCsvField(value: string): string {
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
