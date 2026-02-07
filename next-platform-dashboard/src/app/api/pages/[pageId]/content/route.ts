/**
 * API Route: /api/pages/[pageId]/content
 * 
 * Saves and retrieves page content. Used by the AI Website Designer
 * and Studio Editor to manage page content.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { Json } from "@/types/database.types";

// =============================================================================
// REQUEST VALIDATION
// =============================================================================

const UpdateContentSchema = z.object({
  content: z.record(z.string(), z.unknown()),
});

// Route segment config
interface RouteContext {
  params: Promise<{ pageId: string }>;
}

// =============================================================================
// PUT - Update page content
// =============================================================================

export async function PUT(
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

    // Parse and validate request body
    const body = await request.json();
    const parseResult = UpdateContentSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { content } = parseResult.data;

    // Get page and verify access
    const { data: page, error: pageError } = await supabase
      .from("pages")
      .select(`
        id,
        site_id,
        sites!inner(agency_id)
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
      .select("id, role")
      .eq("agency_id", siteData.agency_id)
      .eq("user_id", user.id)
      .single();

    if (!agencyMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Cast content to Json type for Supabase
    const jsonContent = content as Json;

    // Check if page_content already exists
    const { data: existingContent } = await supabase
      .from("page_content")
      .select("id")
      .eq("page_id", pageId)
      .single();

    if (existingContent) {
      // Update existing content
      const { error: updateError } = await supabase
        .from("page_content")
        .update({
          content: jsonContent,
          updated_at: new Date().toISOString(),
        })
        .eq("page_id", pageId);

      if (updateError) {
        console.error("[API /pages/content] Update error:", updateError);
        return NextResponse.json(
          { error: "Failed to update content", details: updateError.message },
          { status: 500 }
        );
      }
    } else {
      // Create new content
      const { error: insertError } = await supabase
        .from("page_content")
        .insert({
          page_id: pageId,
          content: jsonContent,
        });

      if (insertError) {
        console.error("[API /pages/content] Insert error:", insertError);
        return NextResponse.json(
          { error: "Failed to save content", details: insertError.message },
          { status: 500 }
        );
      }
    }

    // Update page's updated_at timestamp
    await supabase
      .from("pages")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", pageId);

    return NextResponse.json({ 
      success: true,
      message: "Content saved successfully" 
    });

  } catch (error) {
    console.error("[API /pages/content] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET - Get page content
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

    // Get page with content and verify access
    const { data: page, error: pageError } = await supabase
      .from("pages")
      .select(`
        id,
        name,
        slug,
        is_homepage,
        site_id,
        sites!inner(agency_id),
        page_content(content)
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

    // Extract content
    let content = null;
    if (page.page_content) {
      if (Array.isArray(page.page_content) && page.page_content.length > 0) {
        content = (page.page_content[0] as { content: Record<string, unknown> }).content;
      } else if (typeof page.page_content === "object" && "content" in page.page_content) {
        content = (page.page_content as { content: Record<string, unknown> }).content;
      }
    }

    return NextResponse.json({
      page: {
        id: page.id,
        name: page.name,
        slug: page.slug,
        isHomepage: page.is_homepage,
        siteId: page.site_id,
      },
      content,
    });

  } catch (error) {
    console.error("[API /pages/content] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
