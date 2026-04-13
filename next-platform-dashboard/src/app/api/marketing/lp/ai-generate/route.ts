/**
 * AI Landing Page Generator API Route
 * Phase LPB-09: AI Landing Page Generator
 *
 * Generates a complete landing page component tree from a text description
 * using Vercel AI SDK with Claude.
 *
 * Route: POST /api/marketing/lp/ai-generate
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { createClient } from "@/lib/supabase/server";
import { postProcessGeneratedLP } from "@/modules/marketing/lib/lp-ai-utils";
import { LP_COMPONENT_TYPES } from "@/modules/marketing/types/lp-builder-types";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json(null, { headers: CORS_HEADERS });
}

// ─── Zod Schema (no .int(), .min(), .max() — Claude rejects those) ─────

const componentSchema = z.object({
  type: z.string().describe("One of the LP component types"),
  props: z.record(z.string(), z.unknown()).describe("Component props object"),
});

const generatedLPSchema = z.object({
  title: z.string().describe("Landing page title"),
  slug: z.string().describe("URL-safe slug"),
  description: z.string().describe("One-line page description"),
  components: z
    .array(componentSchema)
    .describe("Ordered array of LP components"),
  conversionGoal: z
    .string()
    .describe("Primary conversion goal: lead_gen, signup, purchase, booking"),
  showHeader: z.boolean().describe("Whether to show site header"),
  showFooter: z.boolean().describe("Whether to show site footer"),
});

// ─── System Prompt ─────────────────────────────────────────────

const AVAILABLE_COMPONENTS = Object.entries(LP_COMPONENT_TYPES)
  .map(([key, value]) => `- ${value} (${key})`)
  .join("\n");

function buildSystemPrompt(): string {
  return `You are an expert landing page designer. Generate a high-converting landing page component tree.

AVAILABLE COMPONENT TYPES (use ONLY these):
${AVAILABLE_COMPONENTS}

COMPONENT PROP GUIDELINES:

LPHero props:
- variant: "centered" | "split-left" | "split-right" | "background-video"
- headline: string (compelling, concise)
- subheadline: string (supporting detail)
- ctaText: string (action-oriented button text)
- ctaUrl: string (use "#form" to scroll to form)
- minHeight: string (e.g. "70vh")
- verticalAlign: "center" | "top" | "bottom"
- textAlign: "center" | "left" | "right"

LPForm props:
- variant: "card" | "inline" | "minimal"
- heading: string
- submitText: string (action verb)
- fields: string (comma-separated: "name,email,phone,message,company")
- redirectUrl: string (e.g. "/thank-you")

LPLogoBar props:
- variant: "scroll" | "static" | "grid"
- heading: string (e.g. "Trusted by")
- columns: string (number as string)
- logosJson: string (JSON array of {name, url?})

LPTrustBadges props:
- variant: "horizontal" | "grid" | "minimal"
- heading: string
- iconSize: "sm" | "md" | "lg"
- badgesJson: string (JSON array of {icon, title, description})

LPCountdown props:
- variant: "banner" | "card" | "inline"
- heading: string
- endDate: string (ISO date)
- expiredText: string

LPTestimonialWall props:
- variant: "grid" | "carousel" | "masonry"
- title: string
- columns: string (number as string)
- maxVisible: string (number as string)
- testimonialsJson: string (JSON array of {author, role, company, quote, rating})

LPPricingTable props:
- variant: "cards" | "comparison" | "simple"
- heading: string
- subheading: string
- columns: string (number as string)
- plansJson: string (JSON array of {name, price, period, features[], ctaText, popular?})

LPFloatingCTA props:
- variant: "bar" | "pill" | "corner"
- text: string
- ctaText: string
- ctaUrl: string

RULES:
1. ALWAYS start with an LPHero component.
2. ALWAYS include an LPForm component for lead capture.
3. Return 4-8 components total for a complete page.
4. Use compelling, benefit-driven copy (not lorem ipsum).
5. Make CTAs action-oriented and specific.
6. Use JSON-serialized strings for complex props (logosJson, badgesJson, etc.).
7. Only use the component types listed above — do NOT invent new ones.
8. The slug should be URL-safe (lowercase, hyphens only).
9. Tailor the content to the user's description and industry.`;
}

// ─── Request Validation ────────────────────────────────────────

const requestSchema = z.object({
  description: z.string(),
  category: z.string().optional(),
  preferences: z
    .object({
      includeTestimonials: z.boolean().optional(),
      includePricing: z.boolean().optional(),
      includeCountdown: z.boolean().optional(),
      includeTrustBadges: z.boolean().optional(),
    })
    .optional(),
});

// ─── Handler ───────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: CORS_HEADERS },
      );
    }

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const { description, category, preferences } = parsed.data;

    // Build user prompt
    let userPrompt = `Generate a landing page for: "${description}"`;
    if (category) userPrompt += `\nCategory/Industry: ${category}`;
    if (preferences) {
      const prefs: string[] = [];
      if (preferences.includeTestimonials)
        prefs.push("Include testimonials section");
      if (preferences.includePricing) prefs.push("Include pricing table");
      if (preferences.includeCountdown) prefs.push("Include countdown timer");
      if (preferences.includeTrustBadges)
        prefs.push("Include trust badges/social proof");
      if (prefs.length > 0) userPrompt += `\nRequirements: ${prefs.join(", ")}`;
    }

    // Generate structured LP
    const { object } = await generateObject({
      model: anthropic("claude-sonnet-4-20250514"),
      schema: generatedLPSchema,
      system: buildSystemPrompt(),
      prompt: userPrompt,
    });

    // Post-process: validate types, sanitize, assign IDs
    const processed = postProcessGeneratedLP(object);

    return NextResponse.json(
      { success: true, landingPage: processed },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error("[LP AI Generate] Error:", error);
    const message =
      error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
