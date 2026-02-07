/**
 * API Route: /api/pages
 * 
 * Creates new pages for a site. Used by the AI Website Designer
 * to save generated pages to the database.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// =============================================================================
// REQUEST VALIDATION
// =============================================================================

const CreatePageSchema = z.object({
  siteId: z.string().uuid("Invalid site ID"),
  name: z.string().min(1, "Page name is required").max(100),
  slug: z.string().min(1, "Page slug is required").max(100),
  isHomepage: z.boolean().optional().default(false),
  description: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

// =============================================================================
// POST - Create a new page
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = CreatePageSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { siteId, name, slug, isHomepage, description, metaTitle, metaDescription } = parseResult.data;

    // Verify user has access to the site
    const { data: site, error: siteError } = await supabase
      .from("sites")
      .select("id, agency_id")
      .eq("id", siteId)
      .single();

    if (siteError || !site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Check agency access
    const { data: agencyMember } = await supabase
      .from("agency_members")
      .select("id, role")
      .eq("agency_id", site.agency_id)
      .eq("user_id", user.id)
      .single();

    if (!agencyMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Normalize slug (ensure it starts with /)
    const normalizedSlug = slug.startsWith("/") ? slug : `/${slug}`;

    // Check if page with this slug already exists
    const { data: existingPage } = await supabase
      .from("pages")
      .select("id")
      .eq("site_id", siteId)
      .eq("slug", normalizedSlug)
      .single();

    if (existingPage) {
      // Return the existing page ID
      return NextResponse.json({ 
        pageId: existingPage.id, 
        message: "Page already exists",
        exists: true 
      });
    }

    // If this is homepage, unset any existing homepage
    if (isHomepage) {
      await supabase
        .from("pages")
        .update({ is_homepage: false })
        .eq("site_id", siteId)
        .eq("is_homepage", true);
    }

    // Create the page
    const { data: page, error: createError } = await supabase
      .from("pages")
      .insert({
        site_id: siteId,
        name,
        slug: normalizedSlug,
        is_homepage: isHomepage,
        seo_description: metaDescription || description || null,
        seo_title: metaTitle || name,
      })
      .select("id")
      .single();

    if (createError) {
      console.error("[API /pages] Create error:", createError);
      return NextResponse.json(
        { error: "Failed to create page", details: createError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      pageId: page.id, 
      message: "Page created successfully",
      exists: false 
    });

  } catch (error) {
    console.error("[API /pages] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET - List pages for a site
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get site ID from query params
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");

    if (!siteId) {
      return NextResponse.json({ error: "Site ID is required" }, { status: 400 });
    }

    // Verify user has access to the site
    const { data: site, error: siteError } = await supabase
      .from("sites")
      .select("id, agency_id")
      .eq("id", siteId)
      .single();

    if (siteError || !site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Check agency access
    const { data: agencyMember } = await supabase
      .from("agency_members")
      .select("id")
      .eq("agency_id", site.agency_id)
      .eq("user_id", user.id)
      .single();

    if (!agencyMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get pages
    const { data: pages, error: pagesError } = await supabase
      .from("pages")
      .select("id, name, slug, is_homepage, created_at, updated_at")
      .eq("site_id", siteId)
      .order("is_homepage", { ascending: false })
      .order("name", { ascending: true });

    if (pagesError) {
      return NextResponse.json(
        { error: "Failed to fetch pages" },
        { status: 500 }
      );
    }

    return NextResponse.json({ pages });

  } catch (error) {
    console.error("[API /pages] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
