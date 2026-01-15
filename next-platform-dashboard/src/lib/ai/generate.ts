import { anthropic, DEFAULT_MODEL, GENERATION_CONFIG } from "./config";
import { buildSystemPrompt, buildUserPrompt, GenerationContext } from "./prompts";
import { checkPromptSafety, sanitizeGeneratedContent } from "./safety";
import { checkRateLimit, recordRateLimitedAction } from "@/lib/rate-limit";

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

/**
 * Generate a website with safety checks and rate limiting
 */
export async function generateWebsite(
  context: GenerationContext,
  userId?: string
): Promise<GenerationResult> {
  // 1. Check rate limit (if userId provided)
  if (userId) {
    const rateLimit = await checkRateLimit(userId, "aiGeneration");
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: `Rate limit exceeded. You have ${rateLimit.remaining} generations remaining. Resets in ${Math.ceil((rateLimit.retryAfter || 3600) / 60)} minutes.`,
      };
    }
  }

  // 2. Check content safety
  const promptText = `${context.businessDescription} ${context.industry?.name || ""} ${context.targetAudience || ""}`;
  const safetyCheck = checkPromptSafety(promptText);
  
  if (!safetyCheck.isAllowed) {
    return {
      success: false,
      error: `Content not allowed: ${safetyCheck.reason}`,
    };
  }

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
    const rawWebsite = JSON.parse(content.text) as GeneratedWebsite;

    // Validate structure
    if (!rawWebsite.metadata || !rawWebsite.sections) {
      throw new Error("Invalid website structure");
    }

    // 3. Sanitize output
    const sanitizedContent = sanitizeGeneratedContent(JSON.stringify(rawWebsite));
    const website = JSON.parse(sanitizedContent) as GeneratedWebsite;

    const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

    // 4. Record successful generation (if userId provided)
    if (userId) {
      await recordRateLimitedAction(userId, "aiGeneration", {
        industry: context.industry?.name,
        tokensUsed,
      });
    }

    return {
      success: true,
      website,
      tokensUsed,
    };
  } catch (error) {
    console.error("Generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Generation failed",
    };
  }
}
