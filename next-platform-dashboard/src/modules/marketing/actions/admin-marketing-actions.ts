/**
 * Marketing Module - Admin Marketing Actions
 *
 * Phase MKT-10: Super Admin Marketing View
 *
 * Server actions for super admin marketing health monitoring.
 */
"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  checkPlatformHealth,
  pauseSiteMarketing,
  resumeSiteMarketing,
  enforceAutoSafety,
  getTopSitesByVolume,
} from "../services/admin-safety";
import type {
  PlatformHealthReport,
  AdminAlertThresholds,
} from "../types/admin-types";

// ============================================================================
// HELPERS
// ============================================================================

async function requireSuperAdmin(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") {
    redirect("/dashboard");
  }

  return user.id;
}

// ============================================================================
// PLATFORM HEALTH
// ============================================================================

export async function getPlatformHealthReport(): Promise<PlatformHealthReport> {
  await requireSuperAdmin();
  return checkPlatformHealth();
}

export async function runAutoSafety(): Promise<{
  paused: string[];
  reason: string;
}> {
  await requireSuperAdmin();
  return enforceAutoSafety();
}

// ============================================================================
// SITE CONTROLS
// ============================================================================

export async function adminPauseSiteMarketing(
  siteId: string,
  reason: string,
): Promise<{ success: boolean }> {
  await requireSuperAdmin();

  if (!siteId || !reason) {
    return { success: false };
  }

  return pauseSiteMarketing(siteId, reason);
}

export async function adminResumeSiteMarketing(
  siteId: string,
): Promise<{ success: boolean }> {
  await requireSuperAdmin();

  if (!siteId) {
    return { success: false };
  }

  return resumeSiteMarketing(siteId);
}

// ============================================================================
// TOP SITES
// ============================================================================

export async function getAdminTopSites(limit: number = 20) {
  await requireSuperAdmin();
  return getTopSitesByVolume(limit);
}
