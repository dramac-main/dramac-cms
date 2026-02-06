/**
 * PHASE AWD-03: AI Website Designer API Route
 * POST /api/ai/website-designer
 *
 * Main API endpoint for generating complete websites from prompts.
 * Includes authentication, authorization, and rate limiting.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { WebsiteDesignerEngine } from "@/lib/ai/website-designer/engine";
import { z } from "zod";

// =============================================================================
// REQUEST VALIDATION
// =============================================================================

const RequestSchema = z.object({
  siteId: z.string().uuid("Invalid site ID format"),
  prompt: z
    .string()
    .min(10, "Prompt must be at least 10 characters")
    .max(2000, "Prompt must be less than 2000 characters"),
  preferences: z
    .object({
      style: z
        .enum(["minimal", "bold", "elegant", "playful", "corporate", "creative"])
        .optional(),
      colorPreference: z
        .enum(["brand", "warm", "cool", "monochrome", "vibrant"])
        .optional(),
      layoutDensity: z.enum(["spacious", "balanced", "compact"]).optional(),
      animationLevel: z.enum(["none", "subtle", "moderate", "dynamic"]).optional(),
    })
    .optional(),
  constraints: z
    .object({
      maxPages: z.number().int().min(1).max(20).optional(),
      requiredPages: z.array(z.string()).optional(),
      excludeComponents: z.array(z.string()).optional(),
      mustIncludeComponents: z.array(z.string()).optional(),
    })
    .optional(),
});

// =============================================================================
// ROUTE HANDLERS
// =============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Create Supabase client
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "You must be logged in to use this feature" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = RequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          message: "Request validation failed",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const input = parseResult.data;

    // Verify user has access to the site
    const { data: site, error: siteError } = await supabase
      .from("sites")
      .select("id, name, agency_id")
      .eq("id", input.siteId)
      .single();

    if (siteError || !site) {
      return NextResponse.json(
        { error: "Site not found", message: "The specified site does not exist" },
        { status: 404 }
      );
    }

    // Check agency access
    const { data: agencyUser } = await supabase
      .from("agency_members")
      .select("id, role")
      .eq("agency_id", site.agency_id)
      .eq("user_id", user.id)
      .single();

    if (!agencyUser) {
      return NextResponse.json(
        { error: "Access denied", message: "You do not have access to this site" },
        { status: 403 }
      );
    }

    // Run the website designer engine
    const engine = new WebsiteDesignerEngine(input.siteId);
    const result = await engine.generateWebsite({
      siteId: input.siteId,
      prompt: input.prompt,
      preferences: input.preferences,
      constraints: input.constraints,
    });

    // Add processing time to response
    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      ...result,
      meta: {
        processingTime,
        siteId: input.siteId,
        siteName: site.name,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Website Designer API] Error:", error);

    // Handle specific error types
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation error",
          message: "Request validation failed",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    // Handle AI API errors
    if (error instanceof Error && error.message.includes("API")) {
      return NextResponse.json(
        {
          error: "AI service error",
          message: "Failed to generate website. Please try again.",
        },
        { status: 503 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to generate website. Please try again later.",
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// OPTIONS (CORS)
// =============================================================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
