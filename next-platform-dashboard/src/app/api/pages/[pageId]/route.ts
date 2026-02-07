/**
 * API Route: /api/pages/[pageId]
 * 
 * Handles page deletion and retrieval
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ pageId: string }>;
}

// =============================================================================
// DELETE - Delete a page
// =============================================================================

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { pageId } = await context.params;
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get page and verify access
    const { data: page, error: pageError } = await supabase
      .from("pages")
      .select(`
        id,
        site_id,
        is_homepage,
        sites!inner(agency_id)
      `)
      .eq("id", pageId)
      .single();

    if (pageError || !page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Prevent deleting the homepage
    if (page.is_homepage) {
      return NextResponse.json(
        { error: "Cannot delete the homepage. Set another page as homepage first." },
        { status: 400 }
      );
    }

    // Check agency access
    const siteData = page.sites as { agency_id: string };
    const { data: agencyMember } = await supabase
      .from("agency_members")
      .select("id, role")
      .eq("agency_id", siteData.agency_id)
      .eq("user_id", user.id)
      .single();

    if (!agencyMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Delete page content first (foreign key constraint)
    const { error: contentDeleteError } = await supabase
      .from("page_content")
      .delete()
      .eq("page_id", pageId);

    if (contentDeleteError) {
      console.error("[API /pages/[pageId]] Content delete error:", contentDeleteError);
      // Continue anyway - content might not exist
    }

    // Delete the page
    const { error: deleteError } = await supabase
      .from("pages")
      .delete()
      .eq("id", pageId);

    if (deleteError) {
      console.error("[API /pages/[pageId]] Delete error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete page", details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: "Page deleted successfully" 
    });

  } catch (error) {
    console.error("[API /pages/[pageId]] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET - Get page details
// =============================================================================

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { pageId } = await context.params;
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get page with access check
    const { data: page, error: pageError } = await supabase
      .from("pages")
      .select(`
        *,
        sites!inner(
          id,
          name,
          agency_id
        )
      `)
      .eq("id", pageId)
      .single();

    if (pageError || !page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Check agency access
    const siteData = page.sites as { agency_id: string };
    const { data: agencyMember } = await supabase
      .from("agency_members")
      .select("id")
      .eq("agency_id", siteData.agency_id)
      .eq("user_id", user.id)
      .single();

    if (!agencyMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ page });

  } catch (error) {
    console.error("[API /pages/[pageId]] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
