/**
 * AI Website Designer — Step 3: Finalize
 * POST /api/ai/website-designer/steps/finalize
 *
 * Generates navbar, footer, runs quality audit, and returns final output.
 * Runs in its own 60s serverless function budget.
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
    enableRefinement: z.boolean().optional(),
    enableModuleIntegration: z.boolean().optional(),
  }).optional(),
  // Data from previous steps
  architecture: z.any(),
  pages: z.any(),
  navbar: z.any().optional(),
  footer: z.any().optional(),
  siteContext: z.object({
    name: z.string(),
    domain: z.string(),
    industry: z.string(),
    description: z.string(),
  }).optional(),
  startTime: z.number(),
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

    // Run Step 3: Finalize (purely local processing — no AI calls)
    const engine = new WebsiteDesignerEngine(input.siteId, undefined, input.engineConfig);
    const result = await engine.stepFinalize(
      {
        siteId: input.siteId,
        prompt: input.prompt,
        preferences: input.preferences,
        constraints: input.constraints,
      },
      input.architecture,
      input.pages,
      input.startTime,
      input.navbar,
      input.footer,
      input.siteContext
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Website Designer Step 3] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
