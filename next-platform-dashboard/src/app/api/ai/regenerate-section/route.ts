import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anthropic, DEFAULT_MODEL, GENERATION_CONFIG } from "@/lib/ai/config";

interface RegenerateRequest {
  sectionType: string;
  currentContent: Record<string, unknown>;
  instruction: string;
  businessContext?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: RegenerateRequest = await request.json();
    const { sectionType, currentContent, instruction, businessContext } = body;

    if (!sectionType || !instruction) {
      return NextResponse.json(
        { error: "Section type and instruction required" },
        { status: 400 }
      );
    }

    const prompt = `You are editing a ${sectionType} section of a website.

Current content:
${JSON.stringify(currentContent, null, 2)}

${businessContext ? `Business context: ${businessContext}` : ""}

User instruction: ${instruction}

Return ONLY valid JSON with the updated section props. Match the exact structure of the current content. Do not add new properties, only modify existing values based on the instruction.`;

    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: GENERATION_CONFIG.maxTokens,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    const updatedProps = JSON.parse(content.text);

    return NextResponse.json({
      success: true,
      props: updatedProps,
      tokensUsed: response.usage?.input_tokens + response.usage?.output_tokens,
    });
  } catch (error) {
    console.error("Regeneration error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Regeneration failed" },
      { status: 500 }
    );
  }
}
