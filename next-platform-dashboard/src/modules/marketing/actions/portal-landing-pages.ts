/**
 * LP Builder Pro — Portal Landing Page Actions
 *
 * Phase LPB-10: Client Portal LP Management
 *
 * Server actions for portal client LP viewing (read-only).
 */
"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { mapRecords } from "@/lib/map-db-record";
import { MKT_TABLES } from "../lib/marketing-constants";
import type { PortalLandingPage } from "../types/lp-builder-types";

// ============================================================================
// PORTAL LP LIST
// ============================================================================

export async function getPortalLandingPages(
  siteId: string,
): Promise<PortalLandingPage[]> {
  const portalUser = await requirePortalAuth();

  if (!portalUser.canManageMarketing) {
    return [];
  }

  const admin = createAdminClient() as any;

  // Verify the site belongs to the portal user's agency
  const { data: site } = await admin
    .from("sites")
    .select("id, subdomain, custom_domain, agency_id")
    .eq("id", siteId)
    .eq("agency_id", portalUser.agencyId)
    .single();

  if (!site) return [];

  const { data } = await admin
    .from(MKT_TABLES.landingPages)
    .select(
      "id, title, slug, status, total_visits, total_conversions, published_at, created_at, updated_at",
    )
    .eq("site_id", siteId)
    .neq("status", "archived")
    .order("updated_at", { ascending: false });

  const pages = mapRecords<PortalLandingPage>(data || []);

  // Compute public URL and conversion rate for each LP
  const domain = site.custom_domain || `${site.subdomain}.dramacagency.com`;

  return pages.map((lp) => ({
    ...lp,
    conversionRate:
      lp.totalVisits > 0
        ? Math.round((lp.totalConversions / lp.totalVisits) * 10000) / 100
        : 0,
    publicUrl: `https://${domain}/lp/${lp.slug}`,
  }));
}

// ============================================================================
// PORTAL LP STATS
// ============================================================================

export async function getPortalLPStats(siteId: string): Promise<{
  totalPages: number;
  published: number;
  totalVisits: number;
  totalConversions: number;
  avgConversionRate: number;
}> {
  const portalUser = await requirePortalAuth();

  if (!portalUser.canManageMarketing) {
    return {
      totalPages: 0,
      published: 0,
      totalVisits: 0,
      totalConversions: 0,
      avgConversionRate: 0,
    };
  }

  const admin = createAdminClient() as any;

  // Verify site belongs to agency
  const { data: site } = await admin
    .from("sites")
    .select("id, agency_id")
    .eq("id", siteId)
    .eq("agency_id", portalUser.agencyId)
    .single();

  if (!site) {
    return {
      totalPages: 0,
      published: 0,
      totalVisits: 0,
      totalConversions: 0,
      avgConversionRate: 0,
    };
  }

  const { data } = await admin
    .from(MKT_TABLES.landingPages)
    .select("status, total_visits, total_conversions")
    .eq("site_id", siteId)
    .neq("status", "archived");

  if (!data || data.length === 0) {
    return {
      totalPages: 0,
      published: 0,
      totalVisits: 0,
      totalConversions: 0,
      avgConversionRate: 0,
    };
  }

  const totalPages = data.length;
  const published = data.filter(
    (lp: { status: string }) => lp.status === "published",
  ).length;
  const totalVisits = data.reduce(
    (sum: number, lp: { total_visits: number }) => sum + (lp.total_visits || 0),
    0,
  );
  const totalConversions = data.reduce(
    (sum: number, lp: { total_conversions: number }) =>
      sum + (lp.total_conversions || 0),
    0,
  );
  const avgConversionRate =
    totalVisits > 0
      ? Math.round((totalConversions / totalVisits) * 10000) / 100
      : 0;

  return {
    totalPages,
    published,
    totalVisits,
    totalConversions,
    avgConversionRate,
  };
}
