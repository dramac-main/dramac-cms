/**
 * Campaign Briefing AI Service
 *
 * Phase MKT-09: AI Marketing Intelligence
 *
 * Turns a natural language brief into a structured campaign draft.
 */

import { anthropic, AI_MODELS } from "@/lib/ai/config";
import type { CampaignDraft, MarketingInsight } from "../types";

export async function generateCampaignFromBrief(
  brief: string,
  siteId: string,
): Promise<CampaignDraft> {
  try {
    const response = await anthropic.messages.create({
      model: AI_MODELS.sonnet,
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `You are an expert marketing campaign planner. Turn this natural language brief into a structured campaign plan.

Brief: "${brief}"

Return a JSON object with:
- "name": campaign name (string)
- "type": one of "email", "sms", "whatsapp", "multi_channel"
- "subject": email subject line (string, if applicable)
- "previewText": email preview text (string, if applicable)
- "contentSummary": 2-3 sentence description of the content to create
- "suggestedSegments": array of audience segment names (strings)
- "suggestedSendDay": day of week (string: Monday-Sunday)
- "suggestedSendHour": hour in 24h format (number)
- "estimatedDuration": how long to prepare, e.g. "2-3 hours"
- "keyMessages": array of 3-5 key points to convey (strings)
- "callToAction": the primary CTA text (string)
- "tone": the writing tone, e.g. "Professional", "Casual", "Urgent"

Return ONLY a JSON object, no other text.`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return getDefaultDraft(brief);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      name: String(parsed.name || "Untitled Campaign"),
      type: ["email", "sms", "whatsapp", "multi_channel"].includes(parsed.type)
        ? parsed.type
        : "email",
      subject: parsed.subject ? String(parsed.subject) : undefined,
      previewText: parsed.previewText ? String(parsed.previewText) : undefined,
      contentSummary: String(parsed.contentSummary || ""),
      suggestedSegments: Array.isArray(parsed.suggestedSegments)
        ? parsed.suggestedSegments.map(String)
        : [],
      suggestedSendDay: String(parsed.suggestedSendDay || "Tuesday"),
      suggestedSendHour: Number(parsed.suggestedSendHour) || 10,
      estimatedDuration: String(parsed.estimatedDuration || "2-3 hours"),
      keyMessages: Array.isArray(parsed.keyMessages)
        ? parsed.keyMessages.map(String)
        : [],
      callToAction: String(parsed.callToAction || "Learn More"),
      tone: String(parsed.tone || "Professional"),
    };
  } catch (err: any) {
    console.error("[CampaignBriefAI] Generation error:", err);
    return getDefaultDraft(brief);
  }
}

export async function generateMarketingInsights(
  siteId: string,
  recentStats: {
    totalSent: number;
    avgOpenRate: number;
    avgClickRate: number;
    topCampaign?: string;
    subscriberGrowth: number;
  },
): Promise<MarketingInsight[]> {
  try {
    const response = await anthropic.messages.create({
      model: AI_MODELS.haiku,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a marketing analytics advisor. Based on these stats, provide 3-4 actionable insights.

Stats:
- Total emails sent: ${recentStats.totalSent}
- Average open rate: ${(recentStats.avgOpenRate * 100).toFixed(1)}%
- Average click rate: ${(recentStats.avgClickRate * 100).toFixed(1)}%
- Top campaign: ${recentStats.topCampaign || "N/A"}
- Subscriber growth: ${recentStats.subscriberGrowth > 0 ? "+" : ""}${recentStats.subscriberGrowth}

Industry benchmarks: open rate ~21%, click rate ~2.6%.

Return a JSON array with objects containing:
- "title": short insight title (string)
- "description": 1-2 sentence explanation (string)
- "type": one of "positive", "warning", "suggestion"
- "priority": one of "high", "medium", "low"

Return ONLY a JSON array, no other text.`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]) as Array<Record<string, unknown>>;
    return parsed.slice(0, 5).map((i) => ({
      title: String(i.title || "Insight"),
      description: String(i.description || ""),
      type: (["positive", "warning", "suggestion"].includes(String(i.type))
        ? String(i.type)
        : "suggestion") as MarketingInsight["type"],
      priority: (["high", "medium", "low"].includes(String(i.priority))
        ? String(i.priority)
        : "medium") as MarketingInsight["priority"],
    }));
  } catch (err: any) {
    console.error("[CampaignBriefAI] Insights error:", err);
    return [];
  }
}

function getDefaultDraft(brief: string): CampaignDraft {
  return {
    name: "New Campaign",
    type: "email",
    contentSummary: brief,
    suggestedSegments: ["All Active Subscribers"],
    suggestedSendDay: "Tuesday",
    suggestedSendHour: 10,
    estimatedDuration: "2-3 hours",
    keyMessages: [],
    callToAction: "Learn More",
    tone: "Professional",
  };
}
