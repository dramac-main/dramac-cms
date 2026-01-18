import { anthropic, DEFAULT_MODEL, GENERATION_CONFIG } from "./config";
import { buildSystemPrompt, buildUserPrompt, GenerationContext } from "./prompts";
import { checkPromptSafety, sanitizeGeneratedContent } from "./safety";
import { checkRateLimit, recordRateLimitedAction } from "@/lib/rate-limit";
import {
  checkContent,
  sanitizeHtml,
  sanitizePrompt,
  getHighestSeverity,
  type ContentCheckResult,
} from "@/lib/safety";

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
  safetyCheck?: ContentCheckResult;
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

  // 2. Check content safety with both legacy and new safety systems
  const promptText = `${context.businessDescription} ${context.industry?.name || ""} ${context.targetAudience || ""}`;
  
  // Legacy check (maintains backward compatibility)
  const legacySafetyCheck = checkPromptSafety(promptText);
  if (!legacySafetyCheck.isAllowed) {
    return {
      success: false,
      error: `Content not allowed: ${legacySafetyCheck.reason}`,
    };
  }

  // New comprehensive safety check
  const promptSanitization = sanitizePrompt(promptText);
  const inputSafetyCheck = checkContent(promptSanitization.sanitized, {
    enabledCategories: ["violence", "hate_speech", "sexual", "self_harm", "illegal", "spam", "malware", "phishing"],
    severityThreshold: "medium",
    logViolations: true,
    autoSanitize: false,
    includeContext: false,
  });

  if (!inputSafetyCheck.safe) {
    const highestSeverity = getHighestSeverity(inputSafetyCheck.violations);
    if (highestSeverity === "critical" || highestSeverity === "high") {
      return {
        success: false,
        error: "Content request flagged for safety review",
        safetyCheck: inputSafetyCheck,
      };
    }
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

    // 3. Sanitize output with both legacy and new systems
    const legacySanitized = sanitizeGeneratedContent(JSON.stringify(rawWebsite));
    let website = JSON.parse(legacySanitized) as GeneratedWebsite;

    // Additional HTML sanitization for any text fields
    if (website.metadata.title) {
      website.metadata.title = sanitizeHtml(website.metadata.title);
    }
    if (website.metadata.description) {
      website.metadata.description = sanitizeHtml(website.metadata.description);
    }

    // Check output safety
    const outputText = JSON.stringify(website);
    const outputSafetyCheck = checkContent(outputText, {
      enabledCategories: ["violence", "hate_speech", "sexual", "self_harm", "illegal", "malware", "phishing"],
      severityThreshold: "medium",
      logViolations: true,
      autoSanitize: true,
      includeContext: false,
    });

    if (!outputSafetyCheck.safe) {
      console.warn("AI output flagged for safety:", outputSafetyCheck.violations);
    }

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
      safetyCheck: outputSafetyCheck,
    };
  } catch (error) {
    console.error("Generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Generation failed",
    };
  }
}
