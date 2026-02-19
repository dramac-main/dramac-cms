import { anthropic } from "./config";
import type {
  RegenerationOptions,
  SectionContent,
  RegenerationResult,
  RegenerationContext,
} from "./regeneration-types";

const MODE_PROMPTS: Record<string, string> = {
  rewrite:
    "Completely rewrite this content while maintaining the same structure and key messages.",
  improve:
    "Improve the quality of this content - better word choice, clearer sentences, more engaging.",
  expand:
    "Expand this content with more detail, examples, or supporting information.",
  simplify:
    "Simplify this content - shorter sentences, clearer language, less jargon.",
  professional: "Make this content more professional and formal in tone.",
  casual: "Make this content more friendly, casual, and conversational.",
  seo: "Optimize this content for search engines while keeping it readable. Include relevant keywords naturally.",
};

const LENGTH_INSTRUCTIONS: Record<string, string> = {
  shorter: "Make it about 30% shorter.",
  same: "Keep approximately the same length.",
  longer: "Expand it to be about 50% longer.",
};

/**
 * Regenerate a section's content using AI
 */
export async function regenerateSection(
  sectionContent: SectionContent,
  options: RegenerationOptions,
  context?: RegenerationContext
): Promise<RegenerationResult> {
  try {
    // Get the mode-specific prompt
    const modePrompt =
      options.mode === "custom"
        ? options.customInstructions || "Improve this content."
        : MODE_PROMPTS[options.mode];

    // Get length instruction
    const lengthInstruction =
      LENGTH_INSTRUCTIONS[options.targetLength || "same"];

    // Build keywords instruction if provided
    const keywordsInstruction = options.keywords?.length
      ? `Try to naturally incorporate these keywords: ${options.keywords.join(", ")}.`
      : "";

    // Build structure preservation instruction
    const structureInstruction = options.preserveStructure
      ? "Maintain the exact same structure (headings, bullet points, etc.)."
      : "";

    // Build image preservation instruction
    const imageInstruction = options.preserveImages
      ? "Keep any image references unchanged."
      : "";

    // Build the full prompt
    const prompt = `You are helping regenerate website content for a section.

CURRENT SECTION TYPE: ${sectionContent.type}
CURRENT CONTENT:
${JSON.stringify(sectionContent, null, 2)}

${context?.businessName ? `BUSINESS: ${context.businessName}` : ""}
${context?.industry ? `INDUSTRY: ${context.industry}` : ""}

INSTRUCTIONS:
${modePrompt}
${lengthInstruction}
${keywordsInstruction}
${structureInstruction}
${imageInstruction}

Return the regenerated content as a JSON object matching the input structure. Only return the JSON, no explanation.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Extract JSON from response (handles cases where AI adds extra text)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: false, error: "Failed to parse AI response" };
    }

    const content = JSON.parse(jsonMatch[0]) as SectionContent;

    return {
      success: true,
      content,
      tokensUsed: response.usage?.output_tokens,
    };
  } catch (error) {
    console.error("Regeneration error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Preview regeneration without applying changes
 */
export async function previewRegeneration(
  sectionContent: SectionContent,
  options: RegenerationOptions,
  context?: RegenerationContext
): Promise<RegenerationResult> {
  // Same as regenerateSection but could add additional preview-specific logic
  return regenerateSection(sectionContent, options, context);
}

/**
 * Batch regenerate multiple sections
 */
export async function batchRegenerateSections(
  sections: SectionContent[],
  options: RegenerationOptions,
  context?: RegenerationContext
): Promise<RegenerationResult[]> {
  const results = await Promise.all(
    sections.map((section) => regenerateSection(section, options, context))
  );
  return results;
}
