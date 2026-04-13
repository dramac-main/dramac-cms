/**
 * LP Builder Pro — Server Actions
 *
 * Template CRUD, analytics, form submissions, and A/B test management.
 *
 * @phase LPB-01 — Foundation
 */
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapRecord, mapRecords } from "@/lib/map-db-record";
import { emitEvent } from "@/lib/modules/module-events";
import { MKT_TABLES } from "../lib/marketing-constants";
import type {
  LPTemplate,
  LPAnalyticsSummary,
  LPFormSubmission,
  LPVisit,
  LPABTestConfig,
} from "../types/lp-builder-types";
import { LP_SYSTEM_TEMPLATES } from "../data/lp-studio-templates";

async function getModuleClient() {
  const supabase = await createClient();
  return supabase as any;
}

function getAdminModuleClient() {
  return createAdminClient() as any;
}

// ─── LP Templates ──────────────────────────────────────────────

export async function getLPTemplates(
  siteId: string,
  category?: string,
): Promise<LPTemplate[]> {
  const supabase = await getModuleClient();

  let query = supabase
    .from(MKT_TABLES.lpTemplates)
    .select("*")
    .or(`site_id.eq.${siteId},is_system.eq.true`)
    .order("usage_count", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[LP Builder] getLPTemplates error:", error.message);
  }

  const dbTemplates = mapRecords<LPTemplate>(data || []);
  const dbIds = new Set(dbTemplates.map((t) => t.id));

  // Merge seed templates that don't already exist in the DB
  let seeds = LP_SYSTEM_TEMPLATES.filter((t) => !dbIds.has(t.id));
  if (category) {
    seeds = seeds.filter((t) => t.category === category);
  }

  return [...dbTemplates, ...seeds];
}

export async function getLPTemplate(
  templateId: string,
): Promise<LPTemplate | null> {
  // Check seed templates first (no DB round-trip needed)
  const seedMatch = LP_SYSTEM_TEMPLATES.find((t) => t.id === templateId);
  if (seedMatch) return seedMatch;

  const supabase = await getModuleClient();

  const { data, error } = await supabase
    .from(MKT_TABLES.lpTemplates)
    .select("*")
    .eq("id", templateId)
    .single();

  if (error) return null;
  return data ? mapRecord<LPTemplate>(data) : null;
}

export async function createLPTemplate(input: {
  siteId: string;
  name: string;
  description?: string;
  category: string;
  thumbnailUrl?: string;
  contentStudio: unknown;
  settings?: Record<string, unknown>;
}): Promise<{ template: LPTemplate | null; error: string | null }> {
  const supabase = await getModuleClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from(MKT_TABLES.lpTemplates)
    .insert({
      site_id: input.siteId,
      name: input.name,
      description: input.description || null,
      category: input.category,
      thumbnail_url: input.thumbnailUrl || null,
      content_studio: input.contentStudio,
      settings: input.settings || {},
      created_by: user?.id || null,
    })
    .select("*")
    .single();

  if (error) return { template: null, error: error.message };
  return { template: data ? mapRecord<LPTemplate>(data) : null, error: null };
}

export async function updateLPTemplate(
  templateId: string,
  updates: {
    name?: string;
    description?: string;
    category?: string;
    thumbnailUrl?: string;
    contentStudio?: unknown;
    settings?: Record<string, unknown>;
  },
): Promise<{ template: LPTemplate | null; error: string | null }> {
  const supabase = await getModuleClient();

  const updateData: Record<string, unknown> = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined)
    updateData.description = updates.description;
  if (updates.category !== undefined) updateData.category = updates.category;
  if (updates.thumbnailUrl !== undefined)
    updateData.thumbnail_url = updates.thumbnailUrl;
  if (updates.contentStudio !== undefined)
    updateData.content_studio = updates.contentStudio;
  if (updates.settings !== undefined) updateData.settings = updates.settings;

  const { data, error } = await supabase
    .from(MKT_TABLES.lpTemplates)
    .update(updateData)
    .eq("id", templateId)
    .select("*")
    .single();

  if (error) return { template: null, error: error.message };
  return { template: data ? mapRecord<LPTemplate>(data) : null, error: null };
}

export async function deleteLPTemplate(
  templateId: string,
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await getModuleClient();

  const { error } = await supabase
    .from(MKT_TABLES.lpTemplates)
    .delete()
    .eq("id", templateId)
    .eq("is_system", false); // Prevent deleting system templates

  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}

export async function duplicateLPAsTemplate(
  landingPageId: string,
  name: string,
  siteId: string,
): Promise<{ template: LPTemplate | null; error: string | null }> {
  const supabase = await getModuleClient();

  const { data: lp, error: lpError } = await supabase
    .from(MKT_TABLES.landingPages)
    .select(
      "content_studio, style_config, conversion_goal, show_header, show_footer, branding_override",
    )
    .eq("id", landingPageId)
    .single();

  if (lpError || !lp)
    return {
      template: null,
      error: lpError?.message || "Landing page not found",
    };

  return createLPTemplate({
    siteId,
    name,
    category: "custom",
    contentStudio: lp.content_studio || lp.style_config || {},
    settings: {
      showHeader: lp.show_header,
      showFooter: lp.show_footer,
      brandingOverride: lp.branding_override,
      conversionGoal: lp.conversion_goal,
    },
  });
}

// ─── LP Analytics ──────────────────────────────────────────────

export async function getLPAnalytics(
  landingPageId: string,
  dateRange?: { from: string; to: string },
): Promise<LPAnalyticsSummary> {
  const supabase = await getModuleClient();

  const defaultSummary: LPAnalyticsSummary = {
    totalVisits: 0,
    uniqueVisitors: 0,
    totalSubmissions: 0,
    conversionRate: 0,
    avgTimeOnPage: 0,
    avgScrollDepth: 0,
    bounceRate: 0,
    revenueAttributed: 0,
    dailyStats: [],
    trafficSources: [],
    deviceBreakdown: [],
  };

  // Get visits
  let visitsQuery = supabase
    .from(MKT_TABLES.lpVisits)
    .select("*", { count: "exact" })
    .eq("landing_page_id", landingPageId);

  if (dateRange) {
    visitsQuery = visitsQuery
      .gte("created_at", dateRange.from)
      .lte("created_at", dateRange.to);
  }

  const { data: visits, count: visitCount } = await visitsQuery;

  // Get submissions
  let subsQuery = supabase
    .from(MKT_TABLES.lpFormSubmissions)
    .select("*", { count: "exact" })
    .eq("landing_page_id", landingPageId);

  if (dateRange) {
    subsQuery = subsQuery
      .gte("created_at", dateRange.from)
      .lte("created_at", dateRange.to);
  }

  const { count: subCount } = await subsQuery;

  const totalVisits = visitCount || 0;
  const totalSubmissions = subCount || 0;
  const visitData = mapRecords<LPVisit>(visits || []);

  // Compute unique visitors
  const uniqueVisitorIds = new Set(
    visitData.map((v) => v.visitorId).filter(Boolean),
  );
  const uniqueVisitors = uniqueVisitorIds.size || totalVisits;

  // Compute averages
  const timesOnPage = visitData
    .map((v) => v.timeOnPage || 0)
    .filter((t) => t > 0);
  const scrollDepths = visitData
    .map((v) => v.scrollDepth || 0)
    .filter((s) => s > 0);

  const avgTimeOnPage = timesOnPage.length
    ? Math.round(timesOnPage.reduce((a, b) => a + b, 0) / timesOnPage.length)
    : 0;

  const avgScrollDepth = scrollDepths.length
    ? Math.round(scrollDepths.reduce((a, b) => a + b, 0) / scrollDepths.length)
    : 0;

  // Traffic sources
  const sourceMap = new Map<string, { visits: number; conversions: number }>();
  for (const visit of visitData) {
    const src = visit.utmSource || "direct";
    const existing = sourceMap.get(src) || { visits: 0, conversions: 0 };
    existing.visits++;
    if (visit.converted) existing.conversions++;
    sourceMap.set(src, existing);
  }

  // Device breakdown
  const deviceMap = new Map<string, { visits: number; conversions: number }>();
  for (const visit of visitData) {
    const dev = visit.deviceType || "unknown";
    const existing = deviceMap.get(dev) || { visits: 0, conversions: 0 };
    existing.visits++;
    if (visit.converted) existing.conversions++;
    deviceMap.set(dev, existing);
  }

  // Bounce rate: visits with time_on_page < 10 seconds (or null/0)
  const bounceCount = visitData.filter(
    (v) => !v.timeOnPage || v.timeOnPage < 10,
  ).length;
  const bounceRate =
    totalVisits > 0 ? Math.round((bounceCount / totalVisits) * 100) : 0;

  // Daily stats aggregation
  const dailyMap = new Map<string, { visits: number; conversions: number }>();
  for (const visit of visitData) {
    const day = new Date(visit.createdAt).toISOString().slice(0, 10);
    const entry = dailyMap.get(day) || { visits: 0, conversions: 0 };
    entry.visits++;
    if (visit.converted) entry.conversions++;
    dailyMap.set(day, entry);
  }

  const dailyStats = Array.from(dailyMap, ([date, d]) => ({
    date,
    visits: d.visits,
    conversions: d.conversions,
    conversionRate:
      d.visits > 0 ? Math.round((d.conversions / d.visits) * 10000) / 100 : 0,
  })).sort((a, b) => a.date.localeCompare(b.date));

  return {
    ...defaultSummary,
    totalVisits,
    uniqueVisitors,
    totalSubmissions,
    conversionRate:
      totalVisits > 0
        ? Math.round((totalSubmissions / totalVisits) * 10000) / 100
        : 0,
    avgTimeOnPage,
    avgScrollDepth,
    bounceRate,
    trafficSources: Array.from(sourceMap, ([source, data]) => ({
      source,
      ...data,
    })),
    deviceBreakdown: Array.from(deviceMap, ([device, data]) => ({
      device,
      ...data,
    })),
    dailyStats,
  };
}

export async function getLPAnalyticsSummary(
  siteId: string,
): Promise<
  Record<string, { visits: number; conversions: number; rate: number }>
> {
  const supabase = await getModuleClient();

  // Get all LPs for the site
  const { data: lps } = await supabase
    .from(MKT_TABLES.landingPages)
    .select("id, total_visits, total_conversions, conversion_rate")
    .eq("site_id", siteId);

  const summary: Record<
    string,
    { visits: number; conversions: number; rate: number }
  > = {};
  for (const lp of lps || []) {
    summary[lp.id] = {
      visits: lp.total_visits || 0,
      conversions: lp.total_conversions || 0,
      rate: lp.conversion_rate || 0,
    };
  }

  return summary;
}

// ─── LP Visit Tracking (Admin - called from public routes) ─────

export async function trackLPVisit(input: {
  siteId: string;
  landingPageId: string;
  visitorId?: string;
  sessionId?: string;
  isUnique?: boolean;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
  deviceType?: string;
  country?: string;
  pageVariant?: string;
}): Promise<void> {
  const supabase = getAdminModuleClient();

  await supabase.from(MKT_TABLES.lpVisits).insert({
    site_id: input.siteId,
    landing_page_id: input.landingPageId,
    visitor_id: input.visitorId || null,
    session_id: input.sessionId || null,
    is_unique: input.isUnique ?? true,
    utm_source: input.utmSource || null,
    utm_medium: input.utmMedium || null,
    utm_campaign: input.utmCampaign || null,
    referrer: input.referrer || null,
    device_type: input.deviceType || null,
    country: input.country || null,
    page_variant: input.pageVariant || null,
  });
}

export async function trackLPConversion(input: {
  siteId: string;
  landingPageId: string;
  visitorId?: string;
  timeOnPage?: number;
  scrollDepth?: number;
}): Promise<void> {
  const supabase = getAdminModuleClient();

  // Mark the most recent visit as converted
  if (input.visitorId) {
    await supabase
      .from(MKT_TABLES.lpVisits)
      .update({
        converted: true,
        time_on_page: input.timeOnPage || null,
        scroll_depth: input.scrollDepth || null,
      })
      .eq("landing_page_id", input.landingPageId)
      .eq("visitor_id", input.visitorId)
      .order("created_at", { ascending: false })
      .limit(1);
  }

  // Increment conversion counter on the LP
  await supabase
    .from(MKT_TABLES.landingPages)
    .rpc("increment_campaign_stat", {
      row_id: input.landingPageId,
      table_name: MKT_TABLES.landingPages,
      column_name: "total_conversions",
      increment_by: 1,
    })
    .then(() => {})
    .catch(() => {});
}

// ─── LP Form Submissions ──────────────────────────────────────

export async function submitLPForm(input: {
  siteId: string;
  landingPageId: string;
  formComponentId: string;
  data: Record<string, unknown>;
  email?: string;
  name?: string;
  phone?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  referrer?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
  pageVariant?: string;
  timeOnPage?: number;
  scrollDepth?: number;
}): Promise<{ submissionId: string | null; error: string | null }> {
  const supabase = getAdminModuleClient();

  // Check for duplicate (same email on same LP)
  let isDuplicate = false;
  if (input.email) {
    const { count } = await supabase
      .from(MKT_TABLES.lpFormSubmissions)
      .select("id", { count: "exact", head: true })
      .eq("landing_page_id", input.landingPageId)
      .eq("email", input.email);

    isDuplicate = (count || 0) > 0;
  }

  const { data, error } = await supabase
    .from(MKT_TABLES.lpFormSubmissions)
    .insert({
      site_id: input.siteId,
      landing_page_id: input.landingPageId,
      form_component_id: input.formComponentId,
      data: input.data,
      email: input.email || null,
      name: input.name || null,
      phone: input.phone || null,
      utm_source: input.utmSource || null,
      utm_medium: input.utmMedium || null,
      utm_campaign: input.utmCampaign || null,
      utm_term: input.utmTerm || null,
      utm_content: input.utmContent || null,
      referrer: input.referrer || null,
      ip_address: input.ipAddress || null,
      user_agent: input.userAgent || null,
      device_type: input.deviceType || null,
      page_variant: input.pageVariant || null,
      time_on_page: input.timeOnPage || null,
      scroll_depth: input.scrollDepth || null,
      is_duplicate: isDuplicate,
    })
    .select("id")
    .single();

  if (error) return { submissionId: null, error: error.message };

  // Fire automation event
  try {
    await emitEvent(
      "mod_mktmod01_",
      input.siteId,
      "marketing.landing_page.form_submitted",
      {
        landing_page_id: input.landingPageId,
        form_component_id: input.formComponentId,
        submission_id: data?.id,
        email: input.email || null,
        form_data: input.data,
      },
    );
  } catch {
    // Non-critical — submission already saved
  }

  return { submissionId: data?.id || null, error: null };
}

export async function getLPFormSubmissions(
  landingPageId: string,
  filters?: {
    page?: number;
    pageSize?: number;
    search?: string;
  },
): Promise<{ submissions: LPFormSubmission[]; total: number }> {
  const supabase = await getModuleClient();
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 20;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from(MKT_TABLES.lpFormSubmissions)
    .select("*", { count: "exact" })
    .eq("landing_page_id", landingPageId)
    .order("created_at", { ascending: false });

  if (filters?.search) {
    query = query.or(
      `email.ilike.%${filters.search}%,name.ilike.%${filters.search}%`,
    );
  }

  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;
  if (error) {
    console.error("[LP Builder] getLPFormSubmissions error:", error.message);
    return { submissions: [], total: 0 };
  }

  return {
    submissions: mapRecords<LPFormSubmission>(data || []),
    total: count || 0,
  };
}

export async function exportLPFormSubmissions(
  landingPageId: string,
  format: "csv" | "json",
): Promise<{ data: string; error: string | null }> {
  const supabase = await getModuleClient();

  const { data, error } = await supabase
    .from(MKT_TABLES.lpFormSubmissions)
    .select("*")
    .eq("landing_page_id", landingPageId)
    .order("created_at", { ascending: false });

  if (error) return { data: "", error: error.message };

  const submissions = mapRecords<LPFormSubmission>(data || []);

  if (format === "json") {
    return { data: JSON.stringify(submissions, null, 2), error: null };
  }

  // CSV export
  if (submissions.length === 0) return { data: "", error: null };

  const headers = [
    "id",
    "email",
    "name",
    "phone",
    "data",
    "utmSource",
    "utmMedium",
    "utmCampaign",
    "deviceType",
    "createdAt",
  ];
  const rows = submissions.map((s) =>
    headers.map((h) => {
      const val = (s as any)[h];
      if (val === null || val === undefined) return "";
      if (typeof val === "object") return JSON.stringify(val);
      return String(val).replace(/"/g, '""');
    }),
  );

  const csvContent = [
    headers.join(","),
    ...rows.map((r) => r.map((v) => `"${v}"`).join(",")),
  ].join("\n");

  return { data: csvContent, error: null };
}

// ─── LP A/B Testing ───────────────────────────────────────────

export async function createLPVariant(
  primaryLpId: string,
  name: string,
): Promise<{ variantId: string | null; error: string | null }> {
  const supabase = await getModuleClient();

  // Get the primary LP to duplicate
  const { data: primary, error: getError } = await supabase
    .from(MKT_TABLES.landingPages)
    .select("*")
    .eq("id", primaryLpId)
    .single();

  if (getError || !primary)
    return {
      variantId: null,
      error: getError?.message || "Landing page not found",
    };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Create variant as a copy with primary_variant_id set
  const { data: variant, error: insertError } = await supabase
    .from(MKT_TABLES.landingPages)
    .insert({
      site_id: primary.site_id,
      title: `${primary.title} — ${name}`,
      slug: `${primary.slug}-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      description: primary.description,
      content_json: primary.content_json,
      content_studio: primary.content_studio,
      use_studio_format: primary.use_studio_format,
      style_config: primary.style_config,
      form_config: primary.form_config,
      seo_config: primary.seo_config,
      conversion_goal: primary.conversion_goal,
      show_header: primary.show_header,
      show_footer: primary.show_footer,
      branding_override: primary.branding_override,
      primary_variant_id: primaryLpId,
      status: "draft",
      created_by: user?.id || null,
    })
    .select("id")
    .single();

  if (insertError) return { variantId: null, error: insertError.message };
  return { variantId: variant?.id || null, error: null };
}

export async function updateLPABTestConfig(
  primaryLpId: string,
  config: LPABTestConfig,
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await getModuleClient();

  const { error } = await supabase
    .from(MKT_TABLES.landingPages)
    .update({
      ab_test_enabled: true,
      ab_test_config: config,
    })
    .eq("id", primaryLpId);

  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}

export async function getLPABTestResults(primaryLpId: string): Promise<{
  variants: Array<{
    id: string;
    name: string;
    visits: number;
    conversions: number;
    conversionRate: number;
  }>;
  error: string | null;
}> {
  const supabase = await getModuleClient();

  // Get primary LP and all variants
  const { data: variants, error } = await supabase
    .from(MKT_TABLES.landingPages)
    .select("id, title, total_visits, total_conversions, conversion_rate")
    .or(`id.eq.${primaryLpId},primary_variant_id.eq.${primaryLpId}`);

  if (error) return { variants: [], error: error.message };

  return {
    variants: (variants || []).map((v: any) => ({
      id: v.id,
      name: v.title,
      visits: v.total_visits || 0,
      conversions: v.total_conversions || 0,
      conversionRate: v.conversion_rate || 0,
    })),
    error: null,
  };
}

export async function endLPABTest(
  primaryLpId: string,
  winnerId: string,
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await getModuleClient();

  // Disable A/B testing on the primary
  const { error: updateError } = await supabase
    .from(MKT_TABLES.landingPages)
    .update({
      ab_test_enabled: false,
    })
    .eq("id", primaryLpId);

  if (updateError) return { success: false, error: updateError.message };

  // Archive non-winning variants
  const { error: archiveError } = await supabase
    .from(MKT_TABLES.landingPages)
    .update({ status: "archived" })
    .eq("primary_variant_id", primaryLpId)
    .neq("id", winnerId);

  if (archiveError) return { success: false, error: archiveError.message };

  return { success: true, error: null };
}
