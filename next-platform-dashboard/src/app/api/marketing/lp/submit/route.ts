/**
 * Landing Page Form Submission API Route
 *
 * Phase LPB-05: Advanced Form System
 *
 * Public endpoint for processing LP form submissions. Handles:
 * - Server-side validation
 * - Rate limiting (per IP per hour)
 * - Honeypot spam detection
 * - Submission storage
 * - Subscriber creation (if enabled)
 * - CRM contact creation (if enabled)
 * - Conversion tracking
 * - Automation event emission
 *
 * Route: POST /api/marketing/lp/submit
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
    const body = await request.json();
    const {
      siteId,
      landingPageId,
      formComponentId,
      data,
      utm,
      referrer,
      timeOnPage,
      honeypot,
    } = body;

    // ── Validate required fields ────────────────────────────────
    if (!siteId || !landingPageId || !data || typeof data !== "object") {
      return NextResponse.json(
        { error: "Missing required fields: siteId, landingPageId, data" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    // ── Honeypot check ──────────────────────────────────────────
    if (honeypot) {
      // Bot detected — return success silently to not reveal detection
      return NextResponse.json(
        { success: true, submissionId: "ok" },
        { headers: CORS_HEADERS },
      );
    }

    const supabase = createAdminClient() as any;

    // ── Rate limiting ───────────────────────────────────────────
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Look up form component settings for rate limit config
    let rateLimitPerHour = 10; // default
    let formSettings: Record<string, unknown> | null = null;

    if (formComponentId) {
      try {
        // LP components are stored in the landing page's components JSON
        const { data: lpData } = await supabase
          .from(MKT_TABLES.landingPages)
          .select("components, site_id")
          .eq("id", landingPageId)
          .single();

        if (lpData?.components) {
          const components = Array.isArray(lpData.components)
            ? lpData.components
            : [];
          const formComp = components.find(
            (c: { id?: string }) => c.id === formComponentId,
          );
          if (formComp?.props) {
            formSettings = formComp.props as Record<string, unknown>;
            if (
              typeof formSettings.rateLimitPerHour === "number" &&
              formSettings.rateLimitPerHour > 0
            ) {
              rateLimitPerHour = formSettings.rateLimitPerHour;
            }
          }
        }
      } catch {
        // Non-critical — use defaults
      }
    }

    // Check submissions from this IP in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentSubmissions } = await supabase
      .from(MKT_TABLES.lpFormSubmissions)
      .select("id", { count: "exact", head: true })
      .eq("landing_page_id", landingPageId)
      .eq("ip_address", clientIp)
      .gte("created_at", oneHourAgo);

    if ((recentSubmissions ?? 0) >= rateLimitPerHour) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        { status: 429, headers: CORS_HEADERS },
      );
    }

    // ── Sanitize form data ──────────────────────────────────────
    const sanitizedData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === "string") {
        sanitizedData[key] = value.slice(0, 5000);
      } else if (
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        sanitizedData[key] = value;
      } else if (Array.isArray(value)) {
        sanitizedData[key] = value.map((v) =>
          typeof v === "string" ? v.slice(0, 1000) : v,
        );
      }
    }

    // ── Detect device type ──────────────────────────────────────
    const userAgent = request.headers.get("user-agent") || "";
    const deviceType = /mobile|android|iphone|ipad/i.test(userAgent)
      ? "mobile"
      : /tablet/i.test(userAgent)
        ? "tablet"
        : "desktop";

    // ── Sanitize UTM params ─────────────────────────────────────
    const safeUtm: Record<string, string | null> = {};
    if (utm && typeof utm === "object") {
      for (const key of [
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_term",
        "utm_content",
      ]) {
        const val = (utm as Record<string, unknown>)[key];
        safeUtm[key] = typeof val === "string" ? val.slice(0, 255) : null;
      }
    }

    const safeReferrer =
      typeof referrer === "string" ? referrer.slice(0, 2048) : null;
    const safeTimeOnPage =
      typeof timeOnPage === "number" ? Math.min(timeOnPage, 86400) : null;

    // Extract email from form data for dedup + subscriber/CRM
    const emailField =
      typeof sanitizedData.email === "string"
        ? sanitizedData.email.toLowerCase().trim()
        : null;

    // ── Check for duplicate submission (same email + LP) ────────
    if (emailField) {
      const { data: existingSub } = await supabase
        .from(MKT_TABLES.lpFormSubmissions)
        .select("id")
        .eq("landing_page_id", landingPageId)
        .eq("email", emailField)
        .limit(1);

      // We still record the submission but mark as duplicate
      if (existingSub && existingSub.length > 0) {
        sanitizedData._duplicate = true;
      }
    }

    // ── Store form submission ───────────────────────────────────
    const { data: submission, error: insertError } = await supabase
      .from(MKT_TABLES.lpFormSubmissions)
      .insert({
        site_id: siteId,
        landing_page_id: landingPageId,
        form_component_id: formComponentId || null,
        email: emailField,
        form_data: sanitizedData,
        ip_address: clientIp,
        user_agent: userAgent.slice(0, 512),
        device_type: deviceType,
        utm_source: safeUtm.utm_source || null,
        utm_medium: safeUtm.utm_medium || null,
        utm_campaign: safeUtm.utm_campaign || null,
        referrer: safeReferrer,
        time_on_page: safeTimeOnPage,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[LP Submit] Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save submission" },
        { status: 500, headers: CORS_HEADERS },
      );
    }

    // ── Create/update subscriber (if enabled) ───────────────────
    const shouldCreateSubscriber =
      formSettings?.createSubscriber === true ||
      formSettings?.createSubscriber === "true";

    if (shouldCreateSubscriber && emailField) {
      try {
        // Check if subscriber already exists
        const { data: existingSub } = await supabase
          .from(MKT_TABLES.subscribers)
          .select("id, tags")
          .eq("site_id", siteId)
          .eq("email", emailField)
          .limit(1);

        const subscriberTags = parseTagsFromSettings(formSettings);
        const subscriberName =
          typeof sanitizedData.name === "string"
            ? sanitizedData.name
            : typeof sanitizedData.first_name === "string"
              ? `${sanitizedData.first_name}${typeof sanitizedData.last_name === "string" ? ` ${sanitizedData.last_name}` : ""}`
              : null;

        if (existingSub && existingSub.length > 0) {
          // Update existing subscriber — merge tags
          const existingTags = Array.isArray(existingSub[0].tags)
            ? existingSub[0].tags
            : [];
          const mergedTags = [
            ...new Set([...existingTags, ...subscriberTags]),
          ];

          await supabase
            .from(MKT_TABLES.subscribers)
            .update({
              tags: mergedTags,
              ...(subscriberName ? { name: subscriberName } : {}),
              source: "landing_page",
            })
            .eq("id", existingSub[0].id);
        } else {
          // Create new subscriber
          await supabase.from(MKT_TABLES.subscribers).insert({
            site_id: siteId,
            email: emailField,
            name: subscriberName,
            status: "active",
            source: "landing_page",
            tags: subscriberTags,
            metadata: {
              landing_page_id: landingPageId,
              form_component_id: formComponentId,
            },
          });
        }
      } catch (subErr) {
        console.error("[LP Submit] Subscriber creation error:", subErr);
        // Non-critical — submission is already saved
      }
    }

    // ── Create/update CRM contact (if enabled) ─────────────────
    const shouldCreateCrmContact =
      formSettings?.createCrmContact === true ||
      formSettings?.createCrmContact === "true";

    if (shouldCreateCrmContact && emailField) {
      try {
        const { data: existingContact } = await supabase
          .from("mod_crmmod01_contacts")
          .select("id")
          .eq("site_id", siteId)
          .eq("email", emailField)
          .limit(1);

        const contactName =
          typeof sanitizedData.name === "string"
            ? sanitizedData.name
            : typeof sanitizedData.first_name === "string"
              ? sanitizedData.first_name
              : null;

        const contactLastName =
          typeof sanitizedData.last_name === "string"
            ? sanitizedData.last_name
            : null;

        if (!existingContact || existingContact.length === 0) {
          await supabase.from("mod_crmmod01_contacts").insert({
            site_id: siteId,
            email: emailField,
            first_name: contactName,
            last_name: contactLastName,
            phone:
              typeof sanitizedData.phone === "string"
                ? sanitizedData.phone
                : null,
            source: "landing_page",
            status: "lead",
            metadata: {
              landing_page_id: landingPageId,
              form_submission_id: submission.id,
            },
          });
        }
      } catch (crmErr) {
        console.error("[LP Submit] CRM contact creation error:", crmErr);
        // Non-critical
      }
    }

    // ── Increment conversion counter ────────────────────────────
    await supabase
      .rpc("increment_lp_conversion", { lp_id: landingPageId })
      .catch(async () => {
        // RPC may not exist — fallback to manual increment
        try {
          const { data: lpRow } = await supabase
            .from(MKT_TABLES.landingPages)
            .select("total_conversions, total_visits")
            .eq("id", landingPageId)
            .single();

          if (lpRow) {
            const newConversions = (lpRow.total_conversions || 0) + 1;
            const totalVisits = lpRow.total_visits || 1;
            await supabase
              .from(MKT_TABLES.landingPages)
              .update({
                total_conversions: newConversions,
                conversion_rate:
                  Math.round((newConversions / totalVisits) * 10000) / 100,
              })
              .eq("id", landingPageId);
          }
        } catch {
          // Best-effort
        }
      });

    // ── Emit automation event ───────────────────────────────────
    try {
      await supabase.from("module_events").insert({
        event_name: "marketing.landing_page.form_submitted",
        source_module_id: "mod_mktmod01_",
        site_id: siteId,
        payload: {
          landing_page_id: landingPageId,
          form_component_id: formComponentId,
          submission_id: submission.id,
          email: emailField,
          form_data: sanitizedData,
          utm: safeUtm,
          device_type: deviceType,
        },
        processed: false,
      });
    } catch (evtErr) {
      console.error("[LP Submit] Event emission error:", evtErr);
      // Non-critical
    }

    return NextResponse.json(
      { success: true, submissionId: submission.id },
      { headers: CORS_HEADERS },
    );
  } catch (err) {
    console.error("[LP Submit] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

// ── Helpers ───────────────────────────────────────────────────

function parseTagsFromSettings(
  settings: Record<string, unknown> | null,
): string[] {
  if (!settings) return [];

  const tagsValue = settings.subscriberTags || settings.subscriberTagsJson;
  if (!tagsValue) return [];

  if (Array.isArray(tagsValue)) {
    return tagsValue.filter(
      (t): t is string => typeof t === "string" && t.length > 0,
    );
  }

  if (typeof tagsValue === "string") {
    // Support comma-separated or JSON array string
    try {
      const parsed = JSON.parse(tagsValue);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (t): t is string => typeof t === "string" && t.length > 0,
        );
      }
    } catch {
      // Treat as comma-separated
      return tagsValue
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
    }
  }

  return [];
}
