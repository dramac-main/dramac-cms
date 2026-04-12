/**
 * AI Subject Line Generator
 *
 * Phase MKT-09: AI Marketing Intelligence
 *
 * Generates subject line options with predicted performance.
 * Uses existing AI infrastructure (Anthropic SDK).
 */

import { anthropic, AI_MODELS } from "@/lib/ai/config";
import type { SubjectLineInput, SubjectLineSuggestion } from "../types";

export async function generateSubjectLines(
  input: SubjectLineInput,
): Promise<SubjectLineSuggestion[]> {
  const prompt = `Generate 5 email subject lines for a marketing campaign.

Campaign context:
- Campaign goal: ${input.goal}
- Target audience: ${input.audienceDescription}
- Key message: ${input.keyMessage}
- Brand voice: ${input.brandVoice || "professional and friendly"}
- Industry: ${input.industry || "general"}

For each subject line, provide:
1. The subject line (max 60 characters)
2. A preview text suggestion (max 100 characters)
3. Predicted open rate category: "high", "medium", or "low"
4. Why this subject line works (max 30 words)

Techniques to use across suggestions:
- Curiosity gap
- Personalization (use {{first_name}})
- Numbers/statistics
- Questions
- Urgency (without being spammy)

Output ONLY valid JSON - no markdown, no explanations. Use this exact format:
[
  {
    "subjectLine": "...",
    "previewText": "...",
    "predictedPerformance": "high",
    "reasoning": "..."
  }
]`;

  try {
    const response = await anthropic.messages.create({
      model: AI_MODELS.haiku,
      max_tokens: 1000,
      temperature: 0.8,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No JSON array found in AI response");
    }

    const suggestions: SubjectLineSuggestion[] = JSON.parse(jsonMatch[0]);
    return suggestions.slice(0, 5);
  } catch (err: any) {
    console.error("[AI] Subject line generation error:", err);
    return [
      {
        subjectLine: "Check out what's new!",
        previewText: "We've got exciting updates for you",
        predictedPerformance: "medium",
        reasoning: "Generic fallback — AI generation failed",
      },
    ];
  }
}

export async function generatePreviewText(
  subjectLine: string,
  campaignGoal: string,
): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: AI_MODELS.haiku,
      max_tokens: 200,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: `Generate a compelling email preview text (max 100 characters) that complements this subject line.

Subject line: "${subjectLine}"
Campaign goal: ${campaignGoal}

Output ONLY the preview text, nothing else.`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    return text.trim().slice(0, 100);
  } catch {
    return "";
  }
}
