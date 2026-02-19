/**
 * PHASE AWD-03: AI Website Designer Streaming API Route
 * POST /api/ai/website-designer/stream
 *
 * Streaming endpoint for real-time progress updates during website generation.
 * Uses Server-Sent Events (SSE) to stream progress to the client.
 */

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { WebsiteDesignerEngine } from "@/lib/ai/website-designer/engine";
import type { GenerationProgress } from "@/lib/ai/website-designer/types";
import { z } from "zod";

// Vercel route segment config — allow up to 60s for AI generation
export const maxDuration = 300;

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
  engineConfig: z
    .object({
      enableDesignInspiration: z.boolean().optional(),
      useQuickDesignTokens: z.boolean().optional(),
      enableRefinement: z.boolean().optional(),
      refinementPasses: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
      enableModuleIntegration: z.boolean().optional(),
    })
    .optional(),
});

// =============================================================================
// STREAMING ROUTE HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  // Create Supabase client
  const supabase = await createClient();

  // Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Parse and validate request body
  let input: z.infer<typeof RequestSchema>;
  try {
    const body = await request.json();
    const parseResult = RequestSchema.safeParse(body);

    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: "Invalid request", details: parseResult.error.issues }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    input = parseResult.data;
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Verify user has access to the site
  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("id, name, agency_id")
    .eq("id", input.siteId)
    .single();

  if (siteError || !site) {
    return new Response(
      JSON.stringify({ error: "Site not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
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
    return new Response(
      JSON.stringify({ error: "Access denied" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // Create a readable stream for SSE
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Helper to send SSE events
      const sendEvent = (event: string, data: unknown) => {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // Progress callback
      const onProgress = (progress: GenerationProgress) => {
        sendEvent("progress", progress);
      };

      try {
        // Send initial event
        sendEvent("start", { message: "Starting website generation..." });

        // Run the website designer engine with progress callbacks
        const engine = new WebsiteDesignerEngine(input.siteId, onProgress, input.engineConfig);
        const result = await engine.generateWebsite({
          siteId: input.siteId,
          prompt: input.prompt,
          preferences: input.preferences,
          constraints: input.constraints,
        });

        if (result.success) {
          // Send completed pages
          for (const page of result.pages) {
            sendEvent("page-complete", {
              pageId: page.id,
              pageName: page.name,
              slug: page.slug,
              componentCount: page.components.length,
            });
          }

          // Send final result
          sendEvent("complete", result);
        } else {
          sendEvent("error", { message: result.error || "Generation failed" });
        }
      } catch (error) {
        console.error("[Website Designer Stream] Error:", error);
        sendEvent("error", {
          message: error instanceof Error ? error.message : "Generation failed",
        });
      } finally {
        // Close the stream
        controller.close();
      }
    },
  });

  // Return SSE response
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
