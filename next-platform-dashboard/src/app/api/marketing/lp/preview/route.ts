/**
 * Landing Page Preview API
 *
 * POST /api/marketing/lp/preview
 *
 * Returns rendered HTML for in-editor iframe preview.
 * Uses the exact same renderer as the public route to guarantee WYSIWYG.
 */

import { NextRequest, NextResponse } from "next/server";
import { renderLandingPageHtml } from "@/modules/marketing/lib/landing-page-renderer";
import type {
  LandingPageBlock,
  SeoConfig,
  StyleConfig,
} from "@/modules/marketing/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const blocks: LandingPageBlock[] = body.blocks || [];
    const seo: SeoConfig = body.seo || {};
    const styleConfig: StyleConfig | null = body.styleConfig || null;
    const title: string = body.title || "Preview";

    const html = renderLandingPageHtml({
      page: { title },
      blocks,
      seo,
      styleConfig,
      origin: request.nextUrl.origin,
      pageId: "",
      isPreview: true,
    });

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[Landing Page Preview] Error:", err);
    return NextResponse.json(
      { error: "Failed to render preview" },
      { status: 500 },
    );
  }
}
