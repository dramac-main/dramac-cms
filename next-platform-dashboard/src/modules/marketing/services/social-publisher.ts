/**
 * Social Publisher Service
 *
 * Phase MKT-12: Social Media Integration
 *
 * Handles publishing posts to social media platforms via their APIs.
 * This is a foundation layer — actual OAuth API calls will be
 * implemented per-platform when API keys are configured.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { MKT_TABLES } from "../lib/marketing-constants";
import type {
  SocialPost,
  SocialPlatform,
  UTMParams,
} from "../types/social-types";

// ─── UTM Helpers ──────────────────────────────────────────────

export function appendUTMParams(url: string, utm?: UTMParams | null): string {
  if (!utm || !url) return url;

  try {
    const parsed = new URL(url);
    if (utm.utm_source) parsed.searchParams.set("utm_source", utm.utm_source);
    if (utm.utm_medium) parsed.searchParams.set("utm_medium", utm.utm_medium);
    if (utm.utm_campaign)
      parsed.searchParams.set("utm_campaign", utm.utm_campaign);
    if (utm.utm_term) parsed.searchParams.set("utm_term", utm.utm_term);
    if (utm.utm_content)
      parsed.searchParams.set("utm_content", utm.utm_content);
    return parsed.toString();
  } catch {
    return url;
  }
}

export function buildSocialUTM(
  platform: SocialPlatform,
  campaignName?: string,
): UTMParams {
  return {
    utm_source: platform,
    utm_medium: "social",
    utm_campaign: campaignName || "social-post",
  };
}

// ─── Platform Publisher ───────────────────────────────────────

export interface PublishResult {
  platform: SocialPlatform;
  success: boolean;
  platformPostId?: string;
  error?: string;
}

/**
 * Publish a social post to the specified platforms.
 *
 * Currently sets posts to published status. When actual platform
 * API integrations are added (Facebook Graph API, Twitter API v2, etc.),
 * the platform-specific publishing logic goes here.
 */
export async function publishToSocialPlatforms(
  post: SocialPost,
  platforms: SocialPlatform[],
): Promise<PublishResult[]> {
  const results: PublishResult[] = [];
  const supabase = createAdminClient() as any;

  for (const platform of platforms) {
    try {
      // Check for active connection
      const { data: connection } = await supabase
        .from(MKT_TABLES.socialConnections)
        .select("id, access_token, status")
        .eq("site_id", post.siteId)
        .eq("platform", platform)
        .eq("status", "active")
        .single();

      if (!connection) {
        results.push({
          platform,
          success: false,
          error: `No active ${platform} connection found`,
        });
        continue;
      }

      // Platform-specific publishing would go here
      // For now, we simulate successful publishing
      const platformPostId = `${platform}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      results.push({
        platform,
        success: true,
        platformPostId,
      });
    } catch (err: any) {
      results.push({
        platform,
        success: false,
        error: err.message || "Publishing failed",
      });
    }
  }

  // Update post with platform post IDs
  const platformPostIds: Record<string, string> = {};
  for (const r of results) {
    if (r.success && r.platformPostId) {
      platformPostIds[r.platform] = r.platformPostId;
    }
  }

  const allSucceeded = results.every((r) => r.success);
  const anySucceeded = results.some((r) => r.success);

  await supabase
    .from(MKT_TABLES.socialPosts)
    .update({
      status: allSucceeded
        ? "published"
        : anySucceeded
          ? "published"
          : "failed",
      published_at: anySucceeded ? new Date().toISOString() : null,
      platform_post_ids:
        Object.keys(platformPostIds).length > 0 ? platformPostIds : null,
      error_message: allSucceeded
        ? null
        : results
            .filter((r) => !r.success)
            .map((r) => `${r.platform}: ${r.error}`)
            .join("; "),
      updated_at: new Date().toISOString(),
    })
    .eq("id", post.id);

  return results;
}
