/**
 * Send Time Optimizer
 *
 * Phase MKT-09: AI Marketing Intelligence
 *
 * Analyzes historical open data to predict optimal send times.
 * Falls back to industry defaults when data is insufficient.
 */

import { createClient } from "@/lib/supabase/server";
import { MKT_TABLES } from "../lib/marketing-constants";
import type { SendTimeRecommendation } from "../types";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export async function getOptimalSendTime(
  siteId: string,
  _contactId?: string,
): Promise<SendTimeRecommendation> {
  const supabase = await createClient();

  try {
    // Get open events from campaign sends to analyze patterns
    const { data: sends, error } = await (supabase as any)
      .from(MKT_TABLES.campaignSends)
      .select("opened_at")
      .eq("site_id", siteId)
      .not("opened_at", "is", null)
      .order("opened_at", { ascending: false })
      .limit(1000);

    if (error || !sends || sends.length < 50) {
      // Insufficient data — return industry defaults
      return {
        day: 2, // Tuesday
        hour: 10, // 10 AM
        confidence: 0.3,
        dataPoints: sends?.length || 0,
        reasoning:
          sends && sends.length > 0
            ? `Based on only ${sends.length} data points. Recommending industry defaults: Tuesday at 10 AM.`
            : "No open data available. Using industry defaults: Tuesday at 10 AM works well for most audiences.",
      };
    }

    // Analyze hour-of-day and day-of-week patterns
    const hourCounts: Record<number, number> = {};
    const dayCounts: Record<number, number> = {};

    for (const send of sends) {
      const date = new Date(send.opened_at);
      const hour = date.getUTCHours();
      const day = date.getUTCDay();

      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    }

    // Find peak hour
    let bestHour = 10;
    let bestHourCount = 0;
    for (const [hour, count] of Object.entries(hourCounts)) {
      if (count > bestHourCount) {
        bestHourCount = count;
        bestHour = parseInt(hour);
      }
    }

    // Find peak day
    let bestDay = 2;
    let bestDayCount = 0;
    for (const [day, count] of Object.entries(dayCounts)) {
      if (count > bestDayCount) {
        bestDayCount = count;
        bestDay = parseInt(day);
      }
    }

    // Confidence based on data volume
    const confidence = Math.min(sends.length / 500, 0.95);

    return {
      day: bestDay,
      hour: bestHour,
      confidence: Math.round(confidence * 100) / 100,
      dataPoints: sends.length,
      reasoning: `Based on ${sends.length} email opens. Peak engagement: ${DAY_NAMES[bestDay]}s at ${bestHour}:00 (${bestHourCount} opens at this hour, ${bestDayCount} opens on this day).`,
    };
  } catch (err: any) {
    console.error("[SendTime] Optimization error:", err);
    return {
      day: 2,
      hour: 10,
      confidence: 0.2,
      dataPoints: 0,
      reasoning:
        "Error analyzing data. Using industry defaults: Tuesday at 10 AM.",
    };
  }
}

export function formatSendTimeRecommendation(
  rec: SendTimeRecommendation,
): string {
  const day = DAY_NAMES[rec.day];
  const hour = rec.hour;
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const confidenceLabel =
    rec.confidence >= 0.7 ? "High" : rec.confidence >= 0.4 ? "Medium" : "Low";

  return `${day} at ${displayHour}:00 ${ampm} (${confidenceLabel} confidence — ${rec.dataPoints} data points)`;
}
