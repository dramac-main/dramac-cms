/**
 * Engagement Scoring Service
 *
 * Phase MKT-03: Email Analytics & Tracking
 *
 * Calculates an engagement score (0-100) for each subscriber
 * based on their email interaction history. Can be called
 * after each campaign send or on-demand for recalculation.
 *
 * Score breakdown:
 *   Opens in last 30 days:  +5 each (max 25)
 *   Clicks in last 30 days: +10 each (max 30)
 *   Opened last campaign:   +15
 *   Clicked last campaign:  +20
 *   No opens in 90 days:    -30
 *   Bounced:                -50
 *   Complained:             score = 0
 *
 * Engagement levels:
 *   0-19:   Cold    (gray)
 *   20-39:  Cool    (blue)
 *   40-59:  Warm    (yellow)
 *   60-79:  Hot     (orange)
 *   80-100: On Fire (red)
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { MKT_TABLES } from "@/modules/marketing/lib/marketing-constants";

export type EngagementLevel = "cold" | "cool" | "warm" | "hot" | "on_fire";

export interface EngagementResult {
  score: number;
  level: EngagementLevel;
  label: string;
  color: string;
}

const LEVELS: Array<{
  max: number;
  level: EngagementLevel;
  label: string;
  color: string;
}> = [
  { max: 19, level: "cold", label: "Cold", color: "gray" },
  { max: 39, level: "cool", label: "Cool", color: "blue" },
  { max: 59, level: "warm", label: "Warm", color: "yellow" },
  { max: 79, level: "hot", label: "Hot", color: "orange" },
  { max: 100, level: "on_fire", label: "On Fire", color: "red" },
];

export function getEngagementLevel(score: number): EngagementResult {
  const clamped = Math.max(0, Math.min(100, score));
  const match =
    LEVELS.find((l) => clamped <= l.max) || LEVELS[LEVELS.length - 1];
  return {
    score: clamped,
    level: match.level,
    label: match.label,
    color: match.color,
  };
}

/**
 * Calculate engagement score for a single subscriber.
 */
export async function calculateEngagementScore(
  subscriberId: string,
): Promise<EngagementResult> {
  const supabase = createAdminClient() as any;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000).toISOString();

  // Get sends from the last 90 days
  const { data: sends } = await supabase
    .from(MKT_TABLES.campaignSends)
    .select("first_opened_at, first_clicked_at, status, sent_at")
    .eq("subscriber_id", subscriberId)
    .gte("sent_at", ninetyDaysAgo)
    .order("sent_at", { ascending: false });

  if (!sends || sends.length === 0) {
    return getEngagementLevel(0);
  }

  // Check for complaint — immediate score of 0
  if (sends.some((s: any) => s.status === "complained")) {
    return getEngagementLevel(0);
  }

  let score = 0;

  // Opens in last 30 days: +5 each, max 25
  const recentOpens = sends.filter(
    (s: any) => s.first_opened_at && s.first_opened_at >= thirtyDaysAgo,
  );
  score += Math.min(recentOpens.length * 5, 25);

  // Clicks in last 30 days: +10 each, max 30
  const recentClicks = sends.filter(
    (s: any) => s.first_clicked_at && s.first_clicked_at >= thirtyDaysAgo,
  );
  score += Math.min(recentClicks.length * 10, 30);

  // Last campaign engagement
  const lastSend = sends[0];
  if (lastSend.first_opened_at) score += 15;
  if (lastSend.first_clicked_at) score += 20;

  // Inactivity penalty: no opens in 90 days
  const hasAnyOpen = sends.some((s: any) => s.first_opened_at);
  if (!hasAnyOpen) score -= 30;

  // Bounce penalty
  if (sends.some((s: any) => s.status === "bounced")) score -= 50;

  return getEngagementLevel(score);
}

/**
 * Recalculate engagement scores for all active subscribers of a site.
 * Returns the count of subscribers updated.
 */
export async function recalculateAllScores(siteId: string): Promise<number> {
  const supabase = createAdminClient() as any;

  // Get all active subscribers
  const { data: subscribers } = await supabase
    .from(MKT_TABLES.subscribers)
    .select("id")
    .eq("site_id", siteId)
    .eq("status", "active");

  if (!subscribers || subscribers.length === 0) return 0;

  let updated = 0;

  // Process in batches of 50
  const batchSize = 50;
  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (sub: any) => {
        const result = await calculateEngagementScore(sub.id);
        await supabase
          .from(MKT_TABLES.subscribers)
          .update({ engagement_score: result.score })
          .eq("id", sub.id);
        updated++;
      }),
    );
  }

  return updated;
}

/**
 * Update engagement score for a specific subscriber and optionally
 * sync to CRM contact if linked.
 */
export async function updateSubscriberEngagement(
  subscriberId: string,
): Promise<EngagementResult> {
  const supabase = createAdminClient() as any;
  const result = await calculateEngagementScore(subscriberId);

  // Update subscriber
  await supabase
    .from(MKT_TABLES.subscribers)
    .update({ engagement_score: result.score })
    .eq("id", subscriberId);

  // Sync to CRM contact if linked
  const { data: subscriber } = await supabase
    .from(MKT_TABLES.subscribers)
    .select("crm_contact_id")
    .eq("id", subscriberId)
    .single();

  if (subscriber?.crm_contact_id) {
    await supabase
      .from("mod_crmmod01_contacts")
      .update({ marketing_engagement_score: result.score })
      .eq("id", subscriber.crm_contact_id);
  }

  return result;
}
