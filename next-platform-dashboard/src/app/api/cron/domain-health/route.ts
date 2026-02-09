/**
 * Domain Health Cron Job
 *
 * Phase DM-01: Domain Management Overhaul
 * GET /api/cron/domain-health — Runs every 6 hours via Vercel Cron
 *
 * Checks all sites with custom domains and alerts owners if unhealthy.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkDomainHealth } from "@/lib/services/domain-health";

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this header)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    // Get all sites with custom domains
    const { data: sites, error } = await supabase
      .from("sites")
      .select("id, custom_domain, name, agency_id")
      .not("custom_domain", "is", null)
      .eq("is_published", true);

    if (error || !sites) {
      return NextResponse.json(
        { error: "Failed to fetch sites", details: error?.message },
        { status: 500 }
      );
    }

    const results: Array<{
      siteId: string;
      domain: string;
      healthy: boolean;
      checks: Array<{ name: string; passed: boolean; detail: string }>;
    }> = [];

    const unhealthySites: Array<{
      siteId: string;
      siteName: string;
      domain: string;
      agencyId: string;
      issues: string[];
    }> = [];

    // Check each domain (batch with small delay to avoid rate limits)
    for (const site of sites) {
      if (!site.custom_domain) continue;

      const report = await checkDomainHealth(site.custom_domain);
      results.push({
        siteId: site.id,
        domain: site.custom_domain,
        healthy: report.healthy,
        checks: report.checks,
      });

      if (!report.healthy) {
        unhealthySites.push({
          siteId: site.id,
          siteName: site.name,
          domain: site.custom_domain,
          agencyId: site.agency_id,
          issues: report.checks
            .filter((c) => !c.passed)
            .map((c) => `${c.name}: ${c.detail}`),
        });
      }

      // Small delay between checks
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Create notifications for unhealthy domains
    for (const unhealthy of unhealthySites) {
      // Get agency owner
      const { data: owner } = await supabase
        .from("agency_members")
        .select("user_id")
        .eq("agency_id", unhealthy.agencyId)
        .eq("role", "owner")
        .single();

      if (owner) {
        await supabase.from("notifications").insert({
          user_id: owner.user_id,
          type: "domain_health_alert",
          title: `Domain Issue: ${unhealthy.domain}`,
          message: `Your site "${unhealthy.siteName}" has domain issues: ${unhealthy.issues.join(", ")}`,
          data: {
            site_id: unhealthy.siteId,
            domain: unhealthy.domain,
            issues: unhealthy.issues,
          },
        });
      }
    }

    return NextResponse.json({
      checked: results.length,
      healthy: results.filter((r) => r.healthy).length,
      unhealthy: unhealthySites.length,
      details: results,
    });
  } catch (error) {
    console.error("Domain health cron error:", error);
    return NextResponse.json(
      { error: "Cron job failed" },
      { status: 500 }
    );
  }
}
