/**
 * AI Website Designer — Step 2A: Single Page
 * POST /api/ai/website-designer/steps/page
 *
 * Generates ONE page from architecture + pagePlan.
 * Called once per page from the client in a sequential loop.
 * Each call gets its own 60s serverless function budget.
 *
 * Uses Sonnet 4.6 (premium tier) for maximum content quality.
 * Single AI call per invocation — well within 60s (~20-30s).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { WebsiteDesignerEngine } from "@/lib/ai/website-designer/engine";
import { z } from "zod";

export const maxDuration = 300;

const RequestSchema = z.object({
  siteId: z.string().uuid(),
  prompt: z.string().min(10).max(2000),
  preferences: z.object({
    style: z.enum(["minimal", "bold", "elegant", "playful", "corporate", "creative"]).optional(),
    colorPreference: z.enum(["brand", "warm", "cool", "monochrome", "vibrant"]).optional(),
    layoutDensity: z.enum(["spacious", "balanced", "compact"]).optional(),
    animationLevel: z.enum(["none", "subtle", "moderate", "dynamic"]).optional(),
  }).optional(),
  constraints: z.object({
    maxPages: z.number().optional(),
    requiredPages: z.array(z.string()).optional(),
    excludeComponents: z.array(z.string()).optional(),
    mustIncludeComponents: z.array(z.string()).optional(),
  }).optional(),
  engineConfig: z.object({
    enableDesignInspiration: z.boolean().optional(),
    useQuickDesignTokens: z.boolean().optional(),
    enableRefinement: z.boolean().optional(),
    enableModuleIntegration: z.boolean().optional(),
  }).optional(),
  // From Step 1
  architecture: z.any(),
  formattedContext: z.string(),
  // The specific page to generate
  pagePlan: z.object({
    name: z.string(),
    slug: z.string(),
    purpose: z.string(),
    sections: z.array(z.any()),
    priority: z.number(),
  }),
  // Industry from architecture step (avoids redundant DB calls)
  industry: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = RequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid request", details: parseResult.error.issues }, { status: 400 });
    }

    const input = parseResult.data;

    // Verify site access
    const { data: site } = await supabase
      .from("sites")
      .select("id, name, agency_id")
      .eq("id", input.siteId)
      .single();

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const { data: agencyUser } = await supabase
      .from("agency_members")
      .select("id")
      .eq("agency_id", site.agency_id)
      .eq("user_id", user.id)
      .single();

    if (!agencyUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Generate ONE page
    const engine = new WebsiteDesignerEngine(input.siteId, undefined, input.engineConfig);
    const result = await engine.stepSinglePage(
      {
        siteId: input.siteId,
        prompt: input.prompt,
        preferences: input.preferences,
        constraints: input.constraints,
      },
      input.architecture,
      input.pagePlan,
      input.formattedContext,
      input.industry
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Page generation failed" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      page: result.page,
    });
  } catch (error) {
    console.error("[Website Designer Step 2A - Single Page] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
