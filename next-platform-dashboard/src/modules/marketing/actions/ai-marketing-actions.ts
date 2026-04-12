"use server";

/**
 * AI Marketing Actions
 *
 * Phase MKT-09: AI Marketing Intelligence
 *
 * Server actions that wrap AI services for client components.
 */

import { createClient } from "@/lib/supabase/server";
import {
  generateSubjectLines,
  generatePreviewText,
} from "../services/subject-line-ai";
import {
  generateEmailContent,
  improveEmailText,
} from "../services/email-content-ai";
import {
  getOptimalSendTime,
  formatSendTimeRecommendation,
} from "../services/send-time-optimizer";
import { suggestAudiences } from "../services/audience-ai";
import {
  generateCampaignFromBrief,
  generateMarketingInsights,
} from "../services/campaign-briefing-ai";
import type {
  SubjectLineInput,
  SubjectLineSuggestion,
  EmailContentInput,
  EmailContentResult,
  SendTimeRecommendation,
  AudienceSuggestion,
  CampaignDraft,
  MarketingInsight,
} from "../types";

// ─── Subject Lines ─────────────────────────────────────────

export async function aiGenerateSubjectLines(
  input: SubjectLineInput,
): Promise<{
  success: boolean;
  data?: SubjectLineSuggestion[];
  error?: string;
}> {
  try {
    const suggestions = await generateSubjectLines(input);
    return { success: true, data: suggestions };
  } catch (err: any) {
    console.error("[AIAction] Subject lines error:", err);
    return {
      success: false,
      error: err.message || "Failed to generate subject lines",
    };
  }
}

export async function aiGeneratePreviewText(
  subjectLine: string,
  campaignGoal?: string,
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const previewText = await generatePreviewText(subjectLine, campaignGoal || "");
    return { success: true, data: previewText };
  } catch (err: any) {
    console.error("[AIAction] Preview text error:", err);
    return {
      success: false,
      error: err.message || "Failed to generate preview text",
    };
  }
}

// ─── Email Content ─────────────────────────────────────────

export async function aiGenerateEmailContent(
  input: EmailContentInput,
): Promise<{ success: boolean; data?: EmailContentResult; error?: string }> {
  try {
    const result = await generateEmailContent(input);
    return { success: true, data: result };
  } catch (err: any) {
    console.error("[AIAction] Email content error:", err);
    return {
      success: false,
      error: err.message || "Failed to generate email content",
    };
  }
}

export async function aiImproveEmailText(
  currentText: string,
  instruction: string,
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const improved = await improveEmailText(currentText, instruction);
    return { success: true, data: improved };
  } catch (err: any) {
    console.error("[AIAction] Improve text error:", err);
    return { success: false, error: err.message || "Failed to improve text" };
  }
}

// ─── Send Time ─────────────────────────────────────────────

export async function aiGetOptimalSendTime(siteId: string): Promise<{
  success: boolean;
  data?: SendTimeRecommendation & { formatted: string };
  error?: string;
}> {
  try {
    const rec = await getOptimalSendTime(siteId);
    return {
      success: true,
      data: { ...rec, formatted: formatSendTimeRecommendation(rec) },
    };
  } catch (err: any) {
    console.error("[AIAction] Send time error:", err);
    return {
      success: false,
      error: err.message || "Failed to get optimal send time",
    };
  }
}

// ─── Audience Suggestions ──────────────────────────────────

export async function aiSuggestAudiences(
  siteId: string,
  campaignContent: string,
  campaignGoal?: string,
): Promise<{ success: boolean; data?: AudienceSuggestion[]; error?: string }> {
  try {
    const suggestions = await suggestAudiences(
      siteId,
      campaignContent,
      campaignGoal,
    );
    return { success: true, data: suggestions };
  } catch (err: any) {
    console.error("[AIAction] Audience suggestions error:", err);
    return {
      success: false,
      error: err.message || "Failed to suggest audiences",
    };
  }
}

// ─── Campaign Briefing ─────────────────────────────────────

export async function aiGenerateCampaignFromBrief(
  brief: string,
  siteId: string,
): Promise<{ success: boolean; data?: CampaignDraft; error?: string }> {
  try {
    const draft = await generateCampaignFromBrief(brief, siteId);
    return { success: true, data: draft };
  } catch (err: any) {
    console.error("[AIAction] Campaign briefing error:", err);
    return {
      success: false,
      error: err.message || "Failed to generate campaign",
    };
  }
}

// ─── Marketing Insights ────────────────────────────────────

export async function aiGetMarketingInsights(
  siteId: string,
  recentStats: {
    totalSent: number;
    avgOpenRate: number;
    avgClickRate: number;
    topCampaign?: string;
    subscriberGrowth: number;
  },
): Promise<{ success: boolean; data?: MarketingInsight[]; error?: string }> {
  try {
    const insights = await generateMarketingInsights(siteId, recentStats);
    return { success: true, data: insights };
  } catch (err: any) {
    console.error("[AIAction] Marketing insights error:", err);
    return {
      success: false,
      error: err.message || "Failed to generate insights",
    };
  }
}
