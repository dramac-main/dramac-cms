/**
 * Public CRM Form Definition API
 *
 * GET /api/modules/crm/forms/[slug]?siteId=xxx
 * Returns the form definition for rendering on the storefront.
 * Only returns active forms. Strips internal fields.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const TABLE_PREFIX = "mod_crmmod01";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Site-ID",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const siteId = request.nextUrl.searchParams.get("siteId");

    if (!siteId || !slug) {
      return NextResponse.json(
        { error: "siteId and slug are required" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    // Validate slug format (alphanumeric + hyphens only)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: "Invalid form slug" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const supabase = createAdminClient() as any;

    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_form_definitions`)
      .select("id, name, slug, description, fields, settings")
      .eq("site_id", siteId)
      .eq("slug", slug)
      .eq("status", "active")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404, headers: CORS_HEADERS },
      );
    }

    // Increment view/load counter (non-blocking)
    supabase
      .rpc("increment_counter", {
        row_id: data.id,
        table_name: `${TABLE_PREFIX}_form_definitions`,
        column_name: "submission_count",
        increment_by: 0, // We don't increment here — only on submission
      })
      .then(() => {})
      .catch(() => {});

    return NextResponse.json(
      { success: true, form: data },
      { status: 200, headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error("[CRM Forms API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
