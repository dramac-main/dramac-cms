/**
 * Landing Page Visit Tracking API Route
 *
 * Phase LPB-03: Public LP Serving
 *
 * Public endpoint for tracking LP page views. Fires from client-side
 * on LP load via CraftRenderer's useEffect. Records visit data including
 * UTM parameters, device type, and referrer for analytics.
 *
 * Route: POST /api/marketing/lp/track
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MKT_TABLES } from "@/modules/marketing/lib/marketing-constants";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  try {
    // Handle both JSON (normal fetch) and text/plain (sendBeacon)
    const contentType = request.headers.get("content-type") || "";
    let body: any;

    if (contentType.includes("application/json")) {
      body = await request.json();
    } else {
      const text = await request.text();
      body = JSON.parse(text);
    }

    // Branch: engagement update vs initial visit tracking
    if (body.type === "engagement") {
      return handleEngagementUpdate(body);
    }

    const {
      siteId,
      landingPageId,
      visitorId,
      sessionId,
      referrer,
      utmParams,
      deviceType,
    } = body;

    // Validate required fields
    if (!siteId || !landingPageId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    // Sanitize string inputs
    const safeVisitorId =
      typeof visitorId === "string" ? visitorId.slice(0, 64) : null;
    const safeSessionId =
      typeof sessionId === "string" ? sessionId.slice(0, 64) : null;
    const safeReferrer =
      typeof referrer === "string" ? referrer.slice(0, 2048) : null;
    const safeDeviceType =
      typeof deviceType === "string" ? deviceType.slice(0, 20) : null;

    // Sanitize UTM params
    const safeUtm: Record<string, string | null> = {};
    if (utmParams && typeof utmParams === "object") {
      for (const key of [
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_term",
        "utm_content",
      ]) {
        const val = (utmParams as Record<string, unknown>)[key];
        safeUtm[key] = typeof val === "string" ? val.slice(0, 255) : null;
      }
    }

    const supabase = createAdminClient() as any;

    // Check if this visitor already visited this LP (for unique visit tracking)
    let isUnique = true;
    if (safeVisitorId) {
      const { data: existing } = await supabase
        .from(MKT_TABLES.lpVisits)
        .select("id")
        .eq("landing_page_id", landingPageId)
        .eq("visitor_id", safeVisitorId)
        .limit(1);

      isUnique = !existing || existing.length === 0;
    }

    // Insert visit record
    await supabase.from(MKT_TABLES.lpVisits).insert({
      site_id: siteId,
      landing_page_id: landingPageId,
      visitor_id: safeVisitorId,
      session_id: safeSessionId,
      is_unique: isUnique,
      utm_source: safeUtm.utm_source || null,
      utm_medium: safeUtm.utm_medium || null,
      utm_campaign: safeUtm.utm_campaign || null,
      referrer: safeReferrer,
      device_type: safeDeviceType,
    });

    // Increment landing page visit counter atomically
    // Try RPC first (fast, atomic), fall back to read-then-write
    await supabase
      .rpc("increment_lp_visit", { lp_id: landingPageId })
      .catch(async () => {
        // RPC may not exist yet — fall back to manual increment
        try {
          const { data } = await supabase
            .from(MKT_TABLES.landingPages)
            .select("total_visits")
            .eq("id", landingPageId)
            .single();
          if (data) {
            await supabase
              .from(MKT_TABLES.landingPages)
              .update({ total_visits: (data.total_visits || 0) + 1 })
              .eq("id", landingPageId);
          }
        } catch {
          // Best-effort — visit record is already saved
        }
      });

    return NextResponse.json(
      { success: true, isUnique },
      { headers: CORS_HEADERS },
    );
  } catch (err) {
    console.error("[LP Track] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

// ─── Engagement Update Handler ─────────────────────────────────

async function handleEngagementUpdate(body: any): Promise<NextResponse> {
  const { landingPageId, sessionId, timeOnPage, scrollDepth } = body;

  if (!landingPageId || !sessionId) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const safeTimeOnPage =
    typeof timeOnPage === "number" ? Math.round(timeOnPage) : null;
  const safeScrollDepth =
    typeof scrollDepth === "number"
      ? Math.round(Math.min(scrollDepth, 100))
      : null;

  try {
    const supabase = createAdminClient() as any;

    // Update the most recent visit record with engagement data
    await supabase
      .from(MKT_TABLES.lpVisits)
      .update({
        time_on_page: safeTimeOnPage,
        scroll_depth: safeScrollDepth,
      })
      .eq("landing_page_id", landingPageId)
      .eq("session_id", String(sessionId).slice(0, 64));

    return NextResponse.json({ success: true }, { headers: CORS_HEADERS });
  } catch (err) {
    console.error("[LP Track] Engagement update error:", err);
    return NextResponse.json(
      { error: "Engagement update failed" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
