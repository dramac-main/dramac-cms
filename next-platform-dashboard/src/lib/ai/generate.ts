import { anthropic, DEFAULT_MODEL, GENERATION_CONFIG } from "./config";
import { buildSystemPrompt, buildUserPrompt, GenerationContext } from "./prompts";

export interface GeneratedWebsite {
  metadata: {
    title: string;
    description: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
  };
  sections: Array<{
    type: string;
    props: Record<string, unknown>;
  }>;
}

export interface GenerationResult {
  success: boolean;
  website?: GeneratedWebsite;
  error?: string;
  tokensUsed?: number;
}

export async function generateWebsite(
  context: GenerationContext
): Promise<GenerationResult> {
  try {
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(context);

    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: GENERATION_CONFIG.maxTokens,
      temperature: GENERATION_CONFIG.temperature,
      messages: [
        {
          role: "user",
          content: `${systemPrompt}\n\n${userPrompt}`,
        },
      ],
    });

    // Extract text content
    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    // Parse JSON
    const website = JSON.parse(content.text) as GeneratedWebsite;

    // Validate structure
    if (!website.metadata || !website.sections) {
      throw new Error("Invalid website structure");
    }

    return {
      success: true,
      website,
      tokensUsed: response.usage?.input_tokens + response.usage?.output_tokens,
    };
  } catch (error) {
    console.error("Generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Generation failed",
    };
  }
}
