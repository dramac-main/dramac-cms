import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateWebsite } from "@/lib/ai/generate";
import { getTemplateById } from "@/lib/ai/templates";
import { convertAItocraft, serializeCraftState } from "@/lib/ai/converter";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      businessDescription,
      industryId,
      tone,
      targetAudience,
      sections,
      colorPreference,
      siteId,
      pageId,
    } = body;

    if (!businessDescription) {
      return NextResponse.json(
        { error: "Business description is required" },
        { status: 400 }
      );
    }

    // Get industry template if provided
    const industry = industryId ? getTemplateById(industryId) : undefined;

    // Generate website
    const result = await generateWebsite({
      businessDescription,
      industry,
      tone,
      targetAudience,
      sections,
      colorPreference: colorPreference || industry?.colorScheme,
    });

    if (!result.success || !result.website) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Convert to Craft.js format
    const craftState = convertAItocraft(result.website);
    const craftJson = serializeCraftState(craftState);

    // If pageId provided, verify ownership then save to page_content
    if (pageId) {
      // Verify user has access to this page's site (RLS defense-in-depth)
      const { data: page } = await supabase
        .from("pages")
        .select("id, site_id")
        .eq("id", pageId)
        .single();

      if (!page) {
        return NextResponse.json(
          { error: "Page not found or access denied" },
          { status: 404 }
        );
      }

      // First check if page_content exists for this page
      const { data: existingContent } = await supabase
        .from("page_content")
        .select("id, version")
        .eq("page_id", pageId)
        .order("version", { ascending: false })
        .limit(1)
        .single();

      if (existingContent) {
        // Update existing content with new version
        const { error: contentError } = await supabase
          .from("page_content")
          .insert({
            page_id: pageId,
            content: JSON.parse(craftJson),
            version: (existingContent.version ?? 0) + 1,
          });

        if (contentError) {
          console.error("Failed to save page content:", contentError);
        }
      } else {
        // Create new content entry
        const { error: contentError } = await supabase
          .from("page_content")
          .insert({
            page_id: pageId,
            content: JSON.parse(craftJson),
            version: 1,
          });

        if (contentError) {
          console.error("Failed to save page content:", contentError);
        }
      }
    }

    // If siteId provided, verify ownership then update site metadata
    if (siteId && result.website.metadata) {
      // Verify user has access to this site (RLS defense-in-depth)
      const { data: siteCheck } = await supabase
        .from("sites")
        .select("id")
        .eq("id", siteId)
        .single();

      if (!siteCheck) {
        return NextResponse.json(
          { error: "Site not found or access denied" },
          { status: 404 }
        );
      }

      const { error: siteError } = await supabase
        .from("sites")
        .update({
          seo_title: result.website.metadata.title,
          seo_description: result.website.metadata.description,
          updated_at: new Date().toISOString(),
        })
        .eq("id", siteId);

      if (siteError) {
        console.error("Failed to update site metadata:", siteError);
      }
    }

    return NextResponse.json({
      success: true,
      website: result.website,
      craftState,
      craftJson,
      tokensUsed: result.tokensUsed,
    });
  } catch (error) {
    console.error("AI generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
