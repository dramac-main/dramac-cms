/**
 * Content Optimization API Route
 * 
 * Endpoint for running content optimization analysis.
 * Part of PHASE-ED-05C: AI Editor - Content Optimization
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzePageContent, getAIOptimizations } from "@/lib/ai/content-optimization";
import { analyzeSEO } from "@/lib/ai/seo-analyzer";
import { checkAccessibility } from "@/lib/ai/accessibility-checker";
import type { Data as PuckData } from "@puckeditor/core";

// ============================================
// Types
// ============================================

interface OptimizeRequest {
  puckData: PuckData;
  pageTitle?: string;
  pageDescription?: string;
  targetKeywords?: string[];
  targetAudience?: string;
  pageGoal?: "conversion" | "information" | "engagement" | "branding";
  includeAI?: boolean;
}

// ============================================
// POST Handler
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body: OptimizeRequest = await request.json();
    const {
      puckData,
      pageTitle,
      pageDescription,
      targetKeywords = [],
      targetAudience,
      pageGoal = "conversion",
      includeAI = true,
    } = body;

    if (!puckData || !puckData.content) {
      return NextResponse.json(
        { error: "No page content provided" },
        { status: 400 }
      );
    }

    // Run all analyses in parallel
    const [optimizationResult, seoResult, accessibilityResult] = await Promise.all([
      // Content optimization analysis
      analyzePageContent({
        puckData,
        pageTitle,
        pageDescription,
        targetKeywords,
        targetAudience,
        pageGoal,
      }),
      // SEO analysis
      analyzeSEO({
        puckData,
        pageTitle,
        pageDescription,
        targetKeywords,
      }),
      // Accessibility check
      Promise.resolve(checkAccessibility(puckData)),
    ]);

    // Optionally get AI-powered suggestions
    let aiSuggestions: Awaited<ReturnType<typeof getAIOptimizations>> = [];
    if (includeAI && puckData.content.length > 0) {
      try {
        aiSuggestions = await getAIOptimizations({
          puckData,
          pageTitle,
          pageDescription,
          targetKeywords,
          targetAudience,
          pageGoal,
        });
      } catch (err) {
        console.error("AI optimization error:", err);
        // Continue without AI suggestions
      }
    }

    // Merge AI suggestions into optimization result
    if (aiSuggestions.length > 0) {
      optimizationResult.suggestions = [
        ...optimizationResult.suggestions,
        ...aiSuggestions,
      ];
    }

    // Recalculate overall score considering all factors
    const combinedScore = Math.round(
      (optimizationResult.score * 0.3) +
      (seoResult.score * 0.35) +
      (accessibilityResult.score * 0.35)
    );

    return NextResponse.json({
      success: true,
      overallScore: combinedScore,
      optimization: optimizationResult,
      seo: {
        score: seoResult.score,
        grade: seoResult.grade,
        issues: seoResult.issues,
        summary: seoResult.summary,
      },
      accessibility: {
        score: accessibilityResult.score,
        issues: accessibilityResult.issues,
        passedChecks: accessibilityResult.passedChecks,
        wcagCompliance: accessibilityResult.wcagCompliance,
      },
      analyzedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Optimization API error:", error);
    return NextResponse.json(
      { 
        error: "Optimization analysis failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ============================================
// GET Handler - Quick Health Check
// ============================================

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const quick = searchParams.get("quick") === "true";

  if (quick) {
    return NextResponse.json({
      status: "ok",
      service: "content-optimization",
      capabilities: [
        "seo-analysis",
        "accessibility-check",
        "content-optimization",
        "ai-suggestions",
        "readability-analysis",
        "conversion-analysis",
      ],
    });
  }

  return NextResponse.json({
    service: "Content Optimization API",
    version: "1.0.0",
    endpoints: {
      POST: {
        description: "Analyze page content for optimization opportunities",
        body: {
          puckData: "Required - Puck editor data",
          pageTitle: "Optional - Page title for SEO",
          pageDescription: "Optional - Meta description",
          targetKeywords: "Optional - Array of target keywords",
          targetAudience: "Optional - Target audience description",
          pageGoal: "Optional - 'conversion' | 'information' | 'engagement' | 'branding'",
          includeAI: "Optional - Include AI-powered suggestions (default: true)",
        },
      },
    },
  });
}
