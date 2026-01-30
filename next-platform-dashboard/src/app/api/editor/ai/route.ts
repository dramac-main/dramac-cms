/**
 * AI Editor API Route
 * 
 * API endpoint for AI-powered editing operations in the Puck editor.
 * Part of PHASE-ED-05A: AI Editor - Puck AI Plugin Integration
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  executeAIAction,
  AIActionType,
  AI_ACTIONS,
} from "@/components/editor/puck/ai/puck-ai-config";
import { checkRateLimit, recordRateLimitedAction } from "@/lib/rate-limit";
import {
  checkContent,
  sanitizePrompt,
  getHighestSeverity,
} from "@/lib/safety";

// ============================================
// Types
// ============================================

interface AIRequest {
  action: AIActionType;
  content: string;
  context?: string;
  params?: Record<string, string>;
}

// ============================================
// POST Handler
// ============================================

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body: AIRequest = await request.json();
    const { action, content, context, params } = body;

    // 3. Validate action
    if (!action || !AI_ACTIONS[action]) {
      return NextResponse.json(
        { success: false, error: "Invalid action" },
        { status: 400 }
      );
    }

    // 4. Check rate limit
    const rateLimit = await checkRateLimit(user.id, "aiEditor");
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Rate limit exceeded. Please try again in ${Math.ceil(
            (rateLimit.retryAfter || 60) / 60
          )} minutes.`,
        },
        { status: 429 }
      );
    }

    // 5. Safety check on input content
    const fullContent = `${content} ${context || ""}`.trim();
    if (fullContent.length > 0) {
      const sanitization = sanitizePrompt(fullContent);
      const safetyCheck = checkContent(sanitization.sanitized, {
        enabledCategories: [
          "violence",
          "hate_speech",
          "sexual",
          "self_harm",
          "illegal",
          "spam",
        ],
        severityThreshold: "medium",
        logViolations: true,
        autoSanitize: false,
        includeContext: false,
      });

      if (!safetyCheck.safe) {
        const severity = getHighestSeverity(safetyCheck.violations);
        if (severity === "critical" || severity === "high") {
          return NextResponse.json(
            {
              success: false,
              error: "Content flagged for safety review",
            },
            { status: 400 }
          );
        }
      }
    }

    // 6. Execute AI action
    const result = await executeAIAction({
      action,
      content: content || "",
      context,
      params,
    });

    // 7. Record rate limit usage
    if (result.success) {
      await recordRateLimitedAction(user.id, "aiEditor");
    }

    // 8. Return result
    return NextResponse.json(result);
  } catch (error) {
    console.error("AI Editor API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// ============================================
// GET Handler - Get available actions
// ============================================

export async function GET() {
  return NextResponse.json({
    actions: Object.entries(AI_ACTIONS).map(([key, value]) => ({
      type: key,
      label: value.label,
      description: value.description,
      icon: value.icon,
    })),
  });
}
