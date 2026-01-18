/**
 * Content Safety Check API
 * POST /api/safety/check
 * 
 * Checks content for safety violations
 */

import { NextRequest, NextResponse } from "next/server";
import { checkContent, sanitizePrompt, quickSafetyCheck } from "@/lib/safety";
import type { SafetyConfig, ContentCategory } from "@/lib/safety";
import { createClient } from "@/lib/supabase/server";

interface CheckRequest {
  content: string;
  type?: "full" | "quick" | "prompt";
  categories?: ContentCategory[];
  includeContext?: boolean;
}

interface CheckResponse {
  safe: boolean;
  violations: Array<{
    category: string;
    severity: string;
    description: string;
  }>;
  confidence: number;
  sanitizedContent?: string;
  processingTime?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json() as CheckRequest;
    const { content, type = "full", categories, includeContext = false } = body;

    // Validate content
    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Content is required and must be a string" },
        { status: 400 }
      );
    }

    // Check content length limits
    if (content.length > 100000) {
      return NextResponse.json(
        { error: "Content exceeds maximum length (100,000 characters)" },
        { status: 400 }
      );
    }

    let response: CheckResponse;

    if (type === "quick") {
      // Quick check - just returns boolean
      const isSafe = quickSafetyCheck(content);
      response = {
        safe: isSafe,
        violations: [],
        confidence: isSafe ? 1.0 : 0.5,
      };
    } else if (type === "prompt") {
      // Prompt sanitization for AI inputs
      const result = sanitizePrompt(content);
      response = {
        safe: !result.modified,
        violations: result.removedPatterns.map((pattern) => ({
          category: "malware",
          severity: "high",
          description: `Removed: ${pattern}`,
        })),
        confidence: result.modified ? 0.7 : 1.0,
        sanitizedContent: result.sanitized,
      };
    } else {
      // Full check
      const config: SafetyConfig = {
        enabledCategories: categories || [
          "violence",
          "hate_speech",
          "sexual",
          "self_harm",
          "illegal",
          "spam",
          "malware",
          "phishing",
        ],
        severityThreshold: "low",
        logViolations: false,
        autoSanitize: true,
        includeContext,
      };

      const result = checkContent(content, config);

      response = {
        safe: result.safe,
        violations: result.violations.map((v) => ({
          category: v.category,
          severity: v.severity,
          description: v.description,
        })),
        confidence: result.confidence,
        sanitizedContent: result.sanitizedContent,
        processingTime: result.processingTime,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Safety check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET handler for health check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "content-safety-filter",
    version: "1.0.0",
  });
}
