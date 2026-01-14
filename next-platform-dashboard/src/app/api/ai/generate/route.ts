import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateWebsite } from "@/lib/ai/generate";
import { getTemplateById } from "@/lib/ai/templates";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      businessDescription,
      industryId,
      tone,
      targetAudience,
      sections,
      colorPreference,
      siteId,
    } = body;

    if (!businessDescription) {
      return NextResponse.json(
        { error: "Business description is required" },
        { status: 400 }
      );
    }

    // Get industry template if provided
    const industry = industryId ? getTemplateById(industryId) : undefined;

    // Generate website
    const result = await generateWebsite({
      businessDescription,
      industry,
      tone,
      targetAudience,
      sections,
      colorPreference: colorPreference || industry?.colorScheme,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // If siteId provided, save to database
    if (siteId && result.website) {
      // Update site with generated content
      const { error: updateError } = await supabase
        .from("sites")
        .update({
          ai_generated_content: result.website,
          updated_at: new Date().toISOString(),
        })
        .eq("id", siteId);

      if (updateError) {
        console.error("Failed to save generated content:", updateError);
      }
    }

    return NextResponse.json({
      success: true,
      website: result.website,
      tokensUsed: result.tokensUsed,
    });
  } catch (error) {
    console.error("AI generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
