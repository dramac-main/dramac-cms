/**
 * LP Builder Pro — Admin Landing Page Actions
 *
 * Phase LPB-10: Super Admin Health View
 *
 * Server actions for super admin LP monitoring and management.
 */
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { mapRecord, mapRecords } from "@/lib/map-db-record";
import { MKT_TABLES } from "../lib/marketing-constants";
import type {
  LPAdminSiteStats,
  LPPlatformStats,
  LandingPageStudio,
} from "../types/lp-builder-types";

// ============================================================================
// AUTH HELPER
// ============================================================================

async function requireSuperAdmin(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") redirect("/dashboard");

  return user.id;
}

// ============================================================================
// PLATFORM STATS
// ============================================================================

export async function getLPPlatformStats(): Promise<LPPlatformStats> {
  await requireSuperAdmin();
  const admin = createAdminClient() as any;

  // Fetch from materialized view
  const { data: siteStats } = await admin
    .from("mod_mktmod01_lp_admin_stats")
    .select("*")
    .order("total_visits", { ascending: false });

  const stats = mapRecords<LPAdminSiteStats>(siteStats || []);

  // Aggregate platform totals
  const totalLps = stats.reduce((sum, s) => sum + s.totalLps, 0);
  const totalPublished = stats.reduce((sum, s) => sum + s.publishedLps, 0);
  const totalDraft = stats.reduce((sum, s) => sum + s.draftLps, 0);
  const totalArchived = stats.reduce((sum, s) => sum + s.archivedLps, 0);
  const totalStudio = stats.reduce((sum, s) => sum + s.studioLps, 0);
  const totalLegacy = stats.reduce((sum, s) => sum + s.legacyLps, 0);
  const totalVisits = stats.reduce((sum, s) => sum + s.totalVisits, 0);
  const totalConversions = stats.reduce(
    (sum, s) => sum + s.totalConversions,
    0,
  );
  const platformConversionRate =
    totalVisits > 0
      ? Math.round((totalConversions / totalVisits) * 10000) / 100
      : 0;

  return {
    totalLps,
    totalPublished,
    totalDraft,
    totalArchived,
    totalStudio,
    totalLegacy,
    totalVisits,
    totalConversions,
    platformConversionRate,
    activeSites: stats.length,
    topPerformers: stats.slice(0, 10),
  };
}

// ============================================================================
// PER-SITE STATS
// ============================================================================

export async function getLPAdminSiteStats(filters?: {
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}): Promise<{ stats: LPAdminSiteStats[]; total: number }> {
  await requireSuperAdmin();
  const admin = createAdminClient() as any;

  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 25;
  const offset = (page - 1) * pageSize;

  let query = admin.from("mod_mktmod01_lp_admin_stats").select("*", {
    count: "exact",
  });

  if (filters?.search) {
    query = query.or(
      `site_name.ilike.%${filters.search}%,agency_name.ilike.%${filters.search}%`,
    );
  }

  const sortCol = filters?.sortBy || "total_visits";
  const sortAsc = filters?.sortDir === "asc";
  query = query
    .order(sortCol, { ascending: sortAsc })
    .range(offset, offset + pageSize - 1);

  const { data, count } = await query;

  return {
    stats: mapRecords<LPAdminSiteStats>(data || []),
    total: count || 0,
  };
}

// ============================================================================
// REFRESH MATERIALIZED VIEW
// ============================================================================

export async function refreshLPAdminStats(): Promise<{ success: boolean }> {
  await requireSuperAdmin();
  const admin = createAdminClient() as any;

  const { error } = await admin.rpc("refresh_lp_admin_stats");

  if (error) {
    console.error("[LPB-10] refreshLPAdminStats error:", error.message);
    return { success: false };
  }

  return { success: true };
}

// ============================================================================
// BROWSE ALL LPs
// ============================================================================

export async function getAdminLPList(filters?: {
  siteId?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ pages: LandingPageStudio[]; total: number }> {
  await requireSuperAdmin();
  const admin = createAdminClient() as any;

  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 25;
  const offset = (page - 1) * pageSize;

  let query = admin.from(MKT_TABLES.landingPages).select("*", {
    count: "exact",
  });

  if (filters?.siteId) {
    query = query.eq("site_id", filters.siteId);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }

  query = query
    .order("updated_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  const { data, count } = await query;

  return {
    pages: mapRecords<LandingPageStudio>(data || []),
    total: count || 0,
  };
}

// ============================================================================
// FORCE ARCHIVE
// ============================================================================

export async function adminArchiveLP(
  lpId: string,
): Promise<{ success: boolean }> {
  await requireSuperAdmin();
  const admin = createAdminClient() as any;

  const { error } = await admin
    .from(MKT_TABLES.landingPages)
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", lpId);

  if (error) {
    console.error("[LPB-10] adminArchiveLP error:", error.message);
    return { success: false };
  }

  return { success: true };
}
