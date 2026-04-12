/**
 * Form Submission API Route
 *
 * Phase MKT-06: Landing Pages & Opt-In Forms
 *
 * Public endpoint for form submissions. Accepts POST requests with form data,
 * validates against the form schema, and records the submission.
 *
 * Route: /api/marketing/forms/submit/[formId]
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> },
) {
  try {
    const { formId } = await params;

    if (!formId) {
      return NextResponse.json(
        { error: "Form ID is required" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const supabase = createAdminClient() as any;

    // Fetch form to validate it exists and is active
    const { data: form, error: formError } = await supabase
      .from(MKT_TABLES.forms)
      .select("id, status, fields, success_action, list_id, site_id")
      .eq("id", formId)
      .single();

    if (formError || !form) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404, headers: CORS_HEADERS },
      );
    }

    if (form.status !== "active") {
      return NextResponse.json(
        { error: "Form is not accepting submissions" },
        { status: 403, headers: CORS_HEADERS },
      );
    }

    // Parse request body
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    // Validate required fields
    const fields = form.fields || [];
    for (const field of fields) {
      if (field.required && !body[field.id] && !body[field.label]) {
        return NextResponse.json(
          { error: `Field "${field.label}" is required` },
          { status: 400, headers: CORS_HEADERS },
        );
      }
    }

    // Extract visitor info
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "";
    const referrer = request.headers.get("referer") || "";

    // Extract UTM params from referrer
    let utmParams: Record<string, string> | null = null;
    try {
      if (referrer) {
        const refUrl = new URL(referrer);
        const utm: Record<string, string> = {};
        for (const key of [
          "utm_source",
          "utm_medium",
          "utm_campaign",
          "utm_term",
          "utm_content",
        ]) {
          const val = refUrl.searchParams.get(key);
          if (val) utm[key] = val;
        }
        if (Object.keys(utm).length > 0) utmParams = utm;
      }
    } catch {
      // Invalid referrer URL, ignore
    }

    // Insert submission
    const { error: insertError } = await supabase
      .from(MKT_TABLES.formSubmissions)
      .insert({
        form_id: formId,
        data: body,
        visitor_id: body._visitorId || null,
        source: referrer || null,
        utm_params: utmParams,
        ip_address: ip,
        user_agent: userAgent,
      });

    if (insertError) {
      console.error("[Form Submit] Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save submission" },
        { status: 500, headers: CORS_HEADERS },
      );
    }

    // Increment submission count
    const { data: countData } = await supabase
      .from(MKT_TABLES.forms)
      .select("total_submissions")
      .eq("id", formId)
      .single();

    await supabase
      .from(MKT_TABLES.forms)
      .update({
        total_submissions: ((countData?.total_submissions as number) || 0) + 1,
      })
      .eq("id", formId);

    // If form is linked to a subscriber list, add the email
    if (form.list_id && body.email) {
      const emailStr = String(body.email).trim().toLowerCase();
      if (emailStr && emailStr.includes("@")) {
        await supabase.from(MKT_TABLES.subscribers).upsert(
          {
            site_id: form.site_id,
            list_id: form.list_id,
            email: emailStr,
            first_name: body.first_name || body.firstName || null,
            last_name: body.last_name || body.lastName || null,
            status: "active",
            source: "form",
          },
          { onConflict: "list_id,email" },
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        successAction: form.success_action || {
          type: "message",
          message: "Thank you!",
        },
      },
      { status: 200, headers: CORS_HEADERS },
    );
  } catch (err) {
    console.error("[Form Submit] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
