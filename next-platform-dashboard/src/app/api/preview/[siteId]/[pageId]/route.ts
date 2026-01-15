import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ siteId: string; pageId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const { siteId, pageId } = resolvedParams;

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

    if (error || !data) {
      return NextResponse.json(
        { error: "Page not found" },
        { status: 404 }
      );
    }

    // Extract content from page_content relation
    const content = Array.isArray(data.page_content) && data.page_content.length > 0
      ? (data.page_content[0] as { content: string }).content
      : null;

    return NextResponse.json({
      id: data.id,
      name: data.name,
      slug: data.slug,
      content: content,
    });
  } catch (error) {
    console.error("Preview API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
