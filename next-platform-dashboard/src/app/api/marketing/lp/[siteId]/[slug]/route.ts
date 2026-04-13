/**
 * Public Landing Page Route
 *
 * Serves published landing pages as standalone HTML pages.
 * Route: /api/marketing/lp/[siteId]/[slug]
 *
 * Uses the shared renderer (landing-page-renderer.ts) to guarantee
 * the live output matches the in-editor preview exactly.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MKT_TABLES } from "@/modules/marketing/lib/marketing-constants";
import { mapRecord } from "@/lib/map-db-record";
import type { LandingPage } from "@/modules/marketing/types";
import {
  renderLandingPageHtml,
  render404Page,
} from "@/modules/marketing/lib/landing-page-renderer";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string; slug: string }> },
) {
  try {
    const { siteId, slug } = await params;
    const supabase = createAdminClient() as any;

    // Fetch published landing page
    const { data, error } = await supabase
      .from(MKT_TABLES.landingPages)
      .select("*")
      .eq("site_id", siteId)
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (error || !data) {
      return new NextResponse(render404Page(), {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const page = mapRecord<LandingPage>(data);

    // Record visit (non-blocking)
    const visitorId =
      request.cookies.get("lp_visitor")?.value || crypto.randomUUID();
    const utm = {
      utmSource: request.nextUrl.searchParams.get("utm_source") || undefined,
      utmMedium: request.nextUrl.searchParams.get("utm_medium") || undefined,
      utmCampaign:
        request.nextUrl.searchParams.get("utm_campaign") || undefined,
      utmTerm: request.nextUrl.searchParams.get("utm_term") || undefined,
      utmContent: request.nextUrl.searchParams.get("utm_content") || undefined,
    };

    trackVisit(supabase, {
      landingPageId: page.id,
      visitorId,
      source: utm.utmSource,
      utmParams: utm,
      ipAddress:
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      userAgent: request.headers.get("user-agent") || null,
      referrer: request.headers.get("referer") || null,
    }).catch(() => {
      /* silent fail */
    });

    // Render using shared renderer — same engine as preview
    const html = renderLandingPageHtml({
      page,
      blocks: page.contentJson || [],
      seo: page.seoConfig || {},
      styleConfig: page.styleConfig,
      origin: request.nextUrl.origin,
      pageId: page.id,
      isPreview: false,
    });

    const response = new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });

    // Set visitor cookie for tracking
    if (!request.cookies.get("lp_visitor")) {
      response.cookies.set("lp_visitor", visitorId, {
        maxAge: 60 * 60 * 24 * 365,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
    }

    return response;
  } catch (err) {
    console.error("[Landing Page] Render error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// ============================================================================
// VISIT TRACKING
// ============================================================================

async function trackVisit(
  supabase: any,
  input: {
    landingPageId: string;
    visitorId: string;
    source?: string;
    utmParams?: Record<string, string | undefined>;
    ipAddress?: string | null;
    userAgent?: string | null;
    referrer?: string | null;
  },
) {
  await supabase.from(MKT_TABLES.landingPageVisits).insert({
    landing_page_id: input.landingPageId,
    visitor_id: input.visitorId,
    source: input.source || null,
    utm_params: input.utmParams || null,
    ip_address: input.ipAddress || null,
    user_agent: input.userAgent || null,
    referrer: input.referrer || null,
  });

  await supabase.rpc("increment_campaign_stat", {
    row_id: input.landingPageId,
    table_name: MKT_TABLES.landingPages,
    column_name: "total_visits",
  });
}
