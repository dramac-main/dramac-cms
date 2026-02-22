/**
 * AI Website Designer — Step 2B: Shared Elements
 * POST /api/ai/website-designer/steps/shared
 *
 * Generates navbar + footer in parallel.
 * Both use Haiku (fast tier) — completes in ~8-10s total.
 * Called once after all pages are generated.
 *
 * ZERO DB CALLS inside engine — receives siteContext from architecture step.
 * Has bullet-proof fallbacks — this endpoint NEVER fails.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { WebsiteDesignerEngine } from "@/lib/ai/website-designer/engine";
import type { SharedElementsContext } from "@/lib/ai/website-designer/engine";
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
    enableRefinement: z.boolean().optional(),
    enableModuleIntegration: z.boolean().optional(),
  }).optional(),
  // From Step 1
  architecture: z.any(),
  // Generated page summaries for navbar links
  pages: z.array(z.object({
    name: z.string(),
    slug: z.string(),
    isHomepage: z.boolean().optional(),
  })),
  // Business context from architecture step — avoids redundant DB calls
  siteContext: z.object({
    name: z.string(),
    domain: z.string(),
    industry: z.string(),
    description: z.string(),
    logoUrl: z.string(),
    contactEmail: z.string(),
    contactPhone: z.string(),
    contactAddress: z.record(z.string(), z.string().optional()).default({}),
    social: z.array(z.object({ platform: z.string(), url: z.string() })).default([]),
    hours: z.array(z.object({ day: z.string(), openTime: z.string(), closeTime: z.string(), isClosed: z.boolean().optional() })).default([]),
    services: z.array(z.string()).default([]),
  }).optional(),
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

    // Generate navbar + footer in parallel (both Haiku, ~8-10s)
    // Zero DB calls inside — siteContext provides all business data
    const engine = new WebsiteDesignerEngine(input.siteId, undefined, input.engineConfig);
    const result = await engine.stepSharedElements(
      {
        siteId: input.siteId,
        prompt: input.prompt,
        preferences: input.preferences,
        constraints: input.constraints,
      },
      input.architecture,
      input.pages,
      input.siteContext as SharedElementsContext | undefined
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Shared elements generation failed" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      navbar: result.navbar,
      footer: result.footer,
    });
  } catch (error) {
    console.error("[Website Designer Step 2B - Shared Elements] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
