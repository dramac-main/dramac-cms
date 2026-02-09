/**
 * Branding API Route
 * 
 * Phase WL-01: White-Label Branding Foundation
 * 
 * GET /api/branding/[agencyId] — Fetch branding for an agency
 * PUT /api/branding/[agencyId] — Update branding (owner/admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ agencyId: string }> }
) {
  const { agencyId } = await params;

  try {
    const supabase = await createClient();
    
    // agency_branding table not in generated types yet — cast to bypass deep type check
    const { data, error } = await (supabase as any)
      .from("agency_branding")
      .select("*")
      .eq("agency_id", agencyId)
      .single();

    if (error || !data) {
      // Return defaults if no branding configured
      return NextResponse.json(null, { status: 404 });
    }

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch branding" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ agencyId: string }> }
) {
  const { agencyId } = await params;

  try {
    const supabase = await createClient();
    
    // Verify the user is an owner/admin of this agency
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: member } = await supabase
      .from("agency_members")
      .select("role")
      .eq("agency_id", agencyId)
      .eq("user_id", user.id)
      .single();

    if (!member || !["owner", "admin"].includes(member.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Upsert branding — agency_branding table not in generated types yet
    const { data, error } = await (supabase as any)
      .from("agency_branding")
      .upsert(
        { ...body, agency_id: agencyId },
        { onConflict: "agency_id" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to update branding" },
      { status: 500 }
    );
  }
}
