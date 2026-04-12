/**
 * Marketing Module - Landing Page Actions
 *
 * Phase MKT-06: Landing Pages & Opt-In Forms
 * CRUD operations for landing pages.
 */
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapRecord, mapRecords } from "@/lib/map-db-record";
import { MKT_TABLES } from "../lib/marketing-constants";
import type {
  LandingPage,
  LandingPageStatus,
  LandingPageBlock,
  SeoConfig,
} from "../types";

async function getModuleClient() {
  const supabase = await createClient();
  return supabase as any;
}

function getAdminModuleClient() {
  return createAdminClient() as any;
}

// ─── Read ──────────────────────────────────────────────────────

export async function getLandingPages(
  siteId: string,
  filters?: {
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  },
): Promise<{ landingPages: LandingPage[]; total: number }> {
  const supabase = await getModuleClient();
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 20;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from(MKT_TABLES.landingPages)
    .select("*", { count: "exact" })
    .eq("site_id", siteId)
    .order("created_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,slug.ilike.%${filters.search}%`,
    );
  }

  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;
  if (error) {
    console.error("[Marketing] getLandingPages error:", error.message);
    return { landingPages: [], total: 0 };
  }

  return {
    landingPages: mapRecords<LandingPage>(data || []),
    total: count || 0,
  };
}

export async function getLandingPage(
  landingPageId: string,
): Promise<LandingPage | null> {
  const supabase = await getModuleClient();

  const { data, error } = await supabase
    .from(MKT_TABLES.landingPages)
    .select("*")
    .eq("id", landingPageId)
    .single();

  if (error) return null;
  return data ? mapRecord<LandingPage>(data) : null;
}

export async function getLandingPageBySlug(
  siteId: string,
  slug: string,
): Promise<LandingPage | null> {
  const supabase = getAdminModuleClient();

  const { data, error } = await supabase
    .from(MKT_TABLES.landingPages)
    .select("*")
    .eq("site_id", siteId)
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error) return null;
  return data ? mapRecord<LandingPage>(data) : null;
}

// ─── Create ────────────────────────────────────────────────────

export async function createLandingPage(input: {
  siteId: string;
  title: string;
  slug: string;
  description?: string;
  contentJson?: LandingPageBlock[];
  formConfig?: Record<string, unknown>;
  seoConfig?: SeoConfig;
  conversionGoal?: string;
  templateId?: string;
}): Promise<{ landingPage: LandingPage | null; error: string | null }> {
  const supabase = await getModuleClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from(MKT_TABLES.landingPages)
    .insert({
      site_id: input.siteId,
      title: input.title,
      slug: input.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      description: input.description || null,
      content_json: input.contentJson || [],
      form_config: input.formConfig || null,
      seo_config: input.seoConfig || {},
      conversion_goal: input.conversionGoal || "form_submit",
      template_id: input.templateId || null,
      created_by: user?.id || null,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        landingPage: null,
        error: "A landing page with this slug already exists.",
      };
    }
    return { landingPage: null, error: error.message };
  }

  return {
    landingPage: data ? mapRecord<LandingPage>(data) : null,
    error: null,
  };
}

// ─── Update ────────────────────────────────────────────────────

export async function updateLandingPage(
  landingPageId: string,
  updates: {
    title?: string;
    slug?: string;
    description?: string;
    contentJson?: LandingPageBlock[];
    formConfig?: Record<string, unknown> | null;
    seoConfig?: SeoConfig;
    conversionGoal?: string;
  },
): Promise<{ landingPage: LandingPage | null; error: string | null }> {
  const supabase = await getModuleClient();

  const updateData: Record<string, unknown> = {};
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.slug !== undefined)
    updateData.slug = updates.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  if (updates.description !== undefined)
    updateData.description = updates.description;
  if (updates.contentJson !== undefined)
    updateData.content_json = updates.contentJson;
  if (updates.formConfig !== undefined)
    updateData.form_config = updates.formConfig;
  if (updates.seoConfig !== undefined)
    updateData.seo_config = updates.seoConfig;
  if (updates.conversionGoal !== undefined)
    updateData.conversion_goal = updates.conversionGoal;

  const { data, error } = await supabase
    .from(MKT_TABLES.landingPages)
    .update(updateData)
    .eq("id", landingPageId)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        landingPage: null,
        error: "A landing page with this slug already exists.",
      };
    }
    return { landingPage: null, error: error.message };
  }

  return {
    landingPage: data ? mapRecord<LandingPage>(data) : null,
    error: null,
  };
}

// ─── Status ────────────────────────────────────────────────────

export async function updateLandingPageStatus(
  landingPageId: string,
  status: LandingPageStatus,
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await getModuleClient();

  const updateData: Record<string, unknown> = { status };
  if (status === "published") {
    updateData.published_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from(MKT_TABLES.landingPages)
    .update(updateData)
    .eq("id", landingPageId);

  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}

// ─── Delete ────────────────────────────────────────────────────

export async function deleteLandingPage(
  landingPageId: string,
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await getModuleClient();

  const { error } = await supabase
    .from(MKT_TABLES.landingPages)
    .delete()
    .eq("id", landingPageId);

  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}

// ─── Duplicate ─────────────────────────────────────────────────

export async function duplicateLandingPage(
  landingPageId: string,
): Promise<{ landingPage: LandingPage | null; error: string | null }> {
  const original = await getLandingPage(landingPageId);
  if (!original) return { landingPage: null, error: "Landing page not found" };

  return createLandingPage({
    siteId: original.siteId,
    title: `${original.title} (Copy)`,
    slug: `${original.slug}-copy-${Date.now()}`,
    description: original.description || undefined,
    contentJson: original.contentJson,
    formConfig: original.formConfig || undefined,
    seoConfig: original.seoConfig,
    conversionGoal: original.conversionGoal,
    templateId: original.templateId || undefined,
  });
}

// ─── Visit Tracking (Admin client - called from public routes) ─

export async function recordLandingPageVisit(input: {
  landingPageId: string;
  visitorId: string;
  source?: string;
  utmParams?: Record<string, string>;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
}): Promise<void> {
  const supabase = getAdminModuleClient();

  await supabase.from(MKT_TABLES.landingPageVisits).insert({
    landing_page_id: input.landingPageId,
    visitor_id: input.visitorId,
    source: input.source || null,
    utm_params: input.utmParams || null,
    ip_address: input.ipAddress || null,
    user_agent: input.userAgent || null,
    referrer: input.referrer || null,
  });

  // Increment page visit counter
  await supabase
    .rpc("increment_campaign_stat", {
      row_id: input.landingPageId,
      table_name: MKT_TABLES.landingPages,
      column_name: "total_visits",
      increment_by: 1,
    })
    .then(() => {})
    .catch(() => {
      // Fallback: direct update if RPC doesn't support this table
      supabase
        .from(MKT_TABLES.landingPages)
        .update({ total_visits: (input as any)._totalVisits || 1 })
        .eq("id", input.landingPageId);
    });
}
