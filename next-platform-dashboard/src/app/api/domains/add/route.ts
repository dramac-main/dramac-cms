/**
 * Domain Management API Route
 *
 * Phase DM-01: Domain Management Overhaul
 * POST /api/domains/add — Add/change custom domain for a site (triggers cascade)
 * DELETE /api/domains/add — Remove custom domain from a site (triggers cascade)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleDomainChange } from "@/lib/services/domain-cascade";
import { DOMAINS } from "@/lib/constants/domains";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { siteId, domain } = await request.json();

    if (!siteId || !domain) {
      return NextResponse.json(
        { error: "siteId and domain are required" },
        { status: 400 }
      );
    }

    // Validate domain format
    const domainRegex =
      /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      return NextResponse.json(
        { error: "Invalid domain format" },
        { status: 400 }
      );
    }

    // Verify user owns this site
    const { data: site } = await supabase
      .from("sites")
      .select("id, custom_domain, subdomain, agency_id")
      .eq("id", siteId)
      .single();

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Verify membership
    const { data: member } = await supabase
      .from("agency_members")
      .select("role")
      .eq("agency_id", site.agency_id)
      .eq("user_id", user.id)
      .single();

    if (!member || !["owner", "admin"].includes(member.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if domain is already used by another site
    const { data: existingSite } = await supabase
      .from("sites")
      .select("id")
      .eq("custom_domain", domain)
      .neq("id", siteId)
      .single();

    if (existingSite) {
      return NextResponse.json(
        { error: "This domain is already in use by another site" },
        { status: 409 }
      );
    }

    // Trigger domain cascade
    const previousDomain = site.custom_domain;
    const changeType = previousDomain
      ? "custom_domain_changed"
      : "custom_domain_added";

    const result = await handleDomainChange({
      siteId,
      previousDomain,
      newDomain: domain,
      changeType,
      userId: user.id,
    });

    return NextResponse.json({
      success: result.success,
      domain,
      steps: result.steps,
      totalDuration: result.totalDuration,
    });
  } catch (error) {
    console.error("Domain add error:", error);
    return NextResponse.json(
      { error: "Failed to add domain" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { siteId } = await request.json();

    if (!siteId) {
      return NextResponse.json(
        { error: "siteId is required" },
        { status: 400 }
      );
    }

    // Verify user owns this site
    const { data: site } = await supabase
      .from("sites")
      .select("id, custom_domain, subdomain, agency_id")
      .eq("id", siteId)
      .single();

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Verify membership
    const { data: member } = await supabase
      .from("agency_members")
      .select("role")
      .eq("agency_id", site.agency_id)
      .eq("user_id", user.id)
      .single();

    if (!member || !["owner", "admin"].includes(member.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!site.custom_domain) {
      return NextResponse.json(
        { error: "No custom domain to remove" },
        { status: 400 }
      );
    }

    const result = await handleDomainChange({
      siteId,
      previousDomain: site.custom_domain,
      newDomain: `${site.subdomain}.${DOMAINS.SITES_BASE}`,
      changeType: "custom_domain_removed",
      userId: user.id,
    });

    return NextResponse.json({
      success: result.success,
      steps: result.steps,
    });
  } catch (error) {
    console.error("Domain remove error:", error);
    return NextResponse.json(
      { error: "Failed to remove domain" },
      { status: 500 }
    );
  }
}
