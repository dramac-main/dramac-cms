/**
 * Branding API Route
 * 
 * Phase WL-01: White-Label Branding Foundation
 * 
 * GET /api/branding/[agencyId] — Fetch branding for an agency
 * PUT /api/branding/[agencyId] — Update branding (owner/admin only)
 * 
 * UNIFIED: Reads/writes from `agencies.custom_branding` JSONB column.
 * The old `agency_branding` separate table approach is deprecated.
 * Data is mapped to the AgencyBranding interface shape for the BrandingProvider.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_BRANDING, type AgencyBranding } from "@/types/branding";

/** Map the JSONB custom_branding column + agency fields into the full AgencyBranding shape */
function mapToBranding(agency: {
  id: string;
  name: string;
  custom_branding: Record<string, unknown> | null;
  white_label_enabled: boolean | null;
}): AgencyBranding {
  const cb = (agency.custom_branding || {}) as Record<string, unknown>;

  return {
    id: agency.id,
    agency_id: agency.id,
    agency_display_name: (cb.agency_display_name as string) || (cb.display_name as string) || agency.name || DEFAULT_BRANDING.agency_display_name,
    tagline: (cb.tagline as string) || null,
    logo_url: (cb.logo_url as string) || null,
    logo_dark_url: (cb.logo_dark_url as string) || null,
    favicon_url: (cb.favicon_url as string) || null,
    apple_touch_icon_url: (cb.apple_touch_icon_url as string) || null,
    primary_color: (cb.primary_color as string) || DEFAULT_BRANDING.primary_color,
    primary_foreground: (cb.primary_foreground as string) || DEFAULT_BRANDING.primary_foreground,
    accent_color: (cb.accent_color as string) || (cb.secondary_color as string) || DEFAULT_BRANDING.accent_color,
    accent_foreground: (cb.accent_foreground as string) || DEFAULT_BRANDING.accent_foreground,
    email_from_name: (cb.email_from_name as string) || null,
    email_reply_to: (cb.email_reply_to as string) || null,
    email_footer_text: (cb.email_footer_text as string) || null,
    email_footer_address: (cb.email_footer_address as string) || null,
    email_logo_url: (cb.email_logo_url as string) || null,
    email_social_links: (cb.email_social_links as Record<string, string>) || {},
    portal_welcome_title: (cb.portal_welcome_title as string) || null,
    portal_welcome_subtitle: (cb.portal_welcome_subtitle as string) || null,
    portal_login_background_url: (cb.portal_login_background_url as string) || null,
    portal_custom_css: (cb.portal_custom_css as string) || null,
    support_email: (cb.support_email as string) || null,
    support_url: (cb.support_url as string) || null,
    privacy_policy_url: (cb.privacy_policy_url as string) || null,
    terms_of_service_url: (cb.terms_of_service_url as string) || null,
    white_label_level: (cb.white_label_level as "basic" | "full" | "custom") || (agency.white_label_enabled ? "full" : "basic"),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ agencyId: string }> }
) {
  const { agencyId } = await params;

  try {
    const supabase = await createClient();

    // Read from the agencies table — the single source of truth
    const { data: agency, error } = await supabase
      .from("agencies")
      .select("id, name, custom_branding, white_label_enabled")
      .eq("id", agencyId)
      .single();

    if (error || !agency) {
      return NextResponse.json(null, { status: 404 });
    }

    const branding = mapToBranding({
      ...agency,
      custom_branding: agency.custom_branding as Record<string, unknown> | null,
    });

    return NextResponse.json(branding, {
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

    // Strip fields that shouldn't be stored in custom_branding JSONB
    const { id, agency_id, created_at, updated_at, ...brandingData } = body;

    // Store the full branding data in the custom_branding JSONB column
    const { data: updatedAgency, error } = await supabase
      .from("agencies")
      .update({
        custom_branding: brandingData,
        white_label_enabled: brandingData.white_label_level !== "basic",
        updated_at: new Date().toISOString(),
      })
      .eq("id", agencyId)
      .select("id, name, custom_branding, white_label_enabled")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(mapToBranding({
      ...updatedAgency,
      custom_branding: updatedAgency.custom_branding as Record<string, unknown> | null,
    }));
  } catch {
    return NextResponse.json(
      { error: "Failed to update branding" },
      { status: 500 }
    );
  }
}
