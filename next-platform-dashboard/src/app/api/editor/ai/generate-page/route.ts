/**
 * Generate Page API Route
 * 
 * API endpoint for AI-powered full page generation.
 * Part of PHASE-ED-05B: AI Editor - Custom Generation
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  generatePuckPage,
  type PageGenerationContext,
} from "@/lib/ai/puck-generation";

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
    const context: PageGenerationContext = await request.json();

    // 3. Validate required fields
    if (!context.description || context.description.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: "Please provide a detailed business description" },
        { status: 400 }
      );
    }

    // 4. Generate page
    const result = await generatePuckPage(context, user.id);

    // 5. Return result
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      tokensUsed: result.tokensUsed,
    });
  } catch (error) {
    console.error("Page generation API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
