/**
 * Suggest Components API Route
 * 
 * API endpoint for AI-powered component suggestions.
 * Part of PHASE-ED-05B: AI Editor - Custom Generation
 * 
 * @phase STUDIO-27 - Updated to use standalone types
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getSuggestions,
  type PageContext,
} from "@/lib/ai/component-suggestions";
import type { PuckData } from "@/types/puck";

// ============================================
// Types
// ============================================

interface SuggestRequest {
  context: PageContext;
  puckData?: PuckData;
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
    const body: SuggestRequest = await request.json();
    const { context, puckData } = body;

    // 3. Get suggestions
    const result = await getSuggestions(context, puckData);

    // 4. Return result
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      suggestions: result.suggestions,
    });
  } catch (error) {
    console.error("Component suggestions API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
