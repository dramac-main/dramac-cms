/**
 * AI Website Designer — Step 2: Pages (DEPRECATED)
 * POST /api/ai/website-designer/steps/pages
 *
 * DEPRECATED: This bulk endpoint tried to generate ALL pages in one 60s
 * function and would timeout on Vercel Hobby. Replaced by:
 *   - /steps/page   — generates ONE page per call (Sonnet 4.6, ~20-30s)
 *   - /steps/shared  — generates navbar + footer (Haiku, ~8-10s)
 *
 * Kept for backward compatibility — returns deprecation error.
 */

import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    {
      error: "This endpoint is deprecated. Use /api/ai/website-designer/steps/page (singular) for per-page generation and /api/ai/website-designer/steps/shared for navbar+footer.",
      success: false,
    },
    { status: 410 } // 410 Gone
  );
}
