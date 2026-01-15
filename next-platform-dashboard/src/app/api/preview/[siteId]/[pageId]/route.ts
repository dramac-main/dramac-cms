import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ siteId: string; pageId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const { siteId, pageId } = resolvedParams;

    console.log("[Preview API] Fetching page:", pageId, "from site:", siteId);

    const supabase = await createClient();

    // Get page content - for preview we allow public access (no auth check)
    const { data, error } = await supabase
      .from("pages")
      .select(`
        id,
        name,
        slug,
        site_id,
        page_content(content)
      `)
      .eq("id", pageId)
      .eq("site_id", siteId)
      .single();

    console.log("[Preview API] Query result:", { data, error });

    if (error || !data) {
      console.log("[Preview API] Page not found:", error);
      return NextResponse.json(
        { error: "Page not found" },
        { status: 404 }
      );
    }

    // Extract content from page_content relation - handle both array and object formats
    let content: Record<string, unknown> | null = null;
    
    if (data.page_content) {
      if (Array.isArray(data.page_content) && data.page_content.length > 0) {
        // Array format
        content = (data.page_content[0] as { content: Record<string, unknown> }).content;
      } else if (typeof data.page_content === 'object' && 'content' in data.page_content) {
        // Object format
        content = (data.page_content as { content: Record<string, unknown> }).content;
      }
    }

    console.log("[Preview API] Extracted content:", content ? `${Object.keys(content).length} nodes` : "No content");

    return NextResponse.json({
      id: data.id,
      name: data.name,
      slug: data.slug,
      content: content ? JSON.stringify(content) : null,
    });
  } catch (error) {
    console.error("[Preview API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
