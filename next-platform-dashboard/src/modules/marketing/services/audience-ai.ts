/**
 * Audience AI Service
 *
 * Phase MKT-09: AI Marketing Intelligence
 *
 * Suggests audience segments and targeting based on campaign content.
 */

import { anthropic, AI_MODELS } from "@/lib/ai/config";
import type { AudienceSuggestion } from "../types";

export async function suggestAudiences(
  siteId: string,
  campaignContent: string,
  campaignGoal?: string,
): Promise<AudienceSuggestion[]> {
  try {
    const response = await anthropic.messages.create({
      model: AI_MODELS.haiku,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a marketing audience strategist. Based on this campaign content, suggest 3-5 audience segments that would be most receptive.

Campaign Content:
${campaignContent.slice(0, 2000)}

${campaignGoal ? `Campaign Goal: ${campaignGoal}` : ""}

Return a JSON array with objects containing:
- "name": segment name (string)
- "description": why this segment fits (string, 1-2 sentences)
- "estimatedMatchRate": number 0-1 representing how well this segment matches
- "filterSuggestions": array of strings describing how to filter for this audience

Return ONLY a JSON array, no other text.`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return getDefaultAudiences();
    }

    const parsed = JSON.parse(jsonMatch[0]) as AudienceSuggestion[];
    return parsed.slice(0, 5).map((s) => ({
      name: String(s.name || "Segment"),
      description: String(s.description || ""),
      estimatedMatchRate: Math.min(
        1,
        Math.max(0, Number(s.estimatedMatchRate) || 0.5),
      ),
      filterSuggestions: Array.isArray(s.filterSuggestions)
        ? s.filterSuggestions.map(String)
        : [],
    }));
  } catch (err: any) {
    console.error("[AudienceAI] Suggestion error:", err);
    return getDefaultAudiences();
  }
}

function getDefaultAudiences(): AudienceSuggestion[] {
  return [
    {
      name: "All Active Subscribers",
      description:
        "Contacts who have opened or clicked emails in the last 90 days.",
      estimatedMatchRate: 0.6,
      filterSuggestions: [
        "Last engagement within 90 days",
        "Status: subscribed",
      ],
    },
    {
      name: "Recent Sign-ups",
      description:
        "Contacts who joined in the last 30 days and are most receptive to new content.",
      estimatedMatchRate: 0.8,
      filterSuggestions: ["Created within 30 days", "Status: subscribed"],
    },
    {
      name: "High Engagement",
      description: "Contacts with above-average open and click rates.",
      estimatedMatchRate: 0.9,
      filterSuggestions: [
        "Open rate > 40%",
        "Click rate > 5%",
        "Status: subscribed",
      ],
    },
  ];
}
