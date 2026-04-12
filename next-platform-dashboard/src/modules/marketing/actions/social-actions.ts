/**
 * Marketing Module - Social Media Server Actions
 *
 * Phase MKT-12: Social Media Integration
 *
 * Server-side actions for social connection management, post CRUD,
 * scheduling, publishing, and calendar data aggregation.
 */
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MKT_TABLES } from "../lib/marketing-constants";
import { mapRecord, mapRecords } from "@/lib/map-db-record";
import type {
  SocialConnection,
  SocialPost,
  SocialPlatform,
  CreateSocialPostInput,
  UpdateSocialPostInput,
  CreateSocialConnectionInput,
  UpdateSocialConnectionInput,
  CalendarEvent,
} from "../types/social-types";

// ============================================================================
// HELPERS
// ============================================================================

const CONNECTIONS_TABLE = MKT_TABLES.socialConnections;
const POSTS_TABLE = MKT_TABLES.socialPosts;

async function getModuleClient() {
  const supabase = await createClient();
  return supabase as any;
}

function getAdminModuleClient() {
  return createAdminClient() as any;
}

// ============================================================================
// SOCIAL CONNECTIONS
// ============================================================================

export async function getSocialConnections(
  siteId: string,
): Promise<SocialConnection[]> {
  const supabase = await getModuleClient();

  const { data, error } = await supabase
    .from(CONNECTIONS_TABLE)
    .select("*")
    .eq("site_id", siteId)
    .order("connected_at", { ascending: false });

  if (error) {
    console.error("[Marketing] getSocialConnections error:", error.message);
    return [] as SocialConnection[];
  }

  return mapRecords(data || []) as SocialConnection[];
}

export async function getActiveSocialConnections(
  siteId: string,
): Promise<SocialConnection[]> {
  const supabase = await getModuleClient();

  const { data, error } = await supabase
    .from(CONNECTIONS_TABLE)
    .select("*")
    .eq("site_id", siteId)
    .eq("status", "active");

  if (error)
    throw new Error(`Failed to fetch active connections: ${error.message}`);

  return mapRecords(data || []) as SocialConnection[];
}

export async function createSocialConnection(
  input: CreateSocialConnectionInput,
): Promise<SocialConnection> {
  const supabase = getAdminModuleClient();

  const { data, error } = await supabase
    .from(CONNECTIONS_TABLE)
    .insert({
      site_id: input.siteId,
      platform: input.platform,
      account_name: input.accountName,
      access_token: input.accessToken,
      refresh_token: input.refreshToken || null,
      token_expires_at: input.tokenExpiresAt || null,
      page_id: input.pageId || null,
      profile_url: input.profileUrl || null,
      avatar_url: input.avatarUrl || null,
      status: "active",
      connected_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error)
    throw new Error(`Failed to create social connection: ${error.message}`);

  return mapRecord(data) as SocialConnection;
}

export async function updateSocialConnection(
  connectionId: string,
  siteId: string,
  input: UpdateSocialConnectionInput,
): Promise<SocialConnection> {
  const supabase = await getModuleClient();

  const updates: Record<string, any> = {};
  if (input.accountName !== undefined) updates.account_name = input.accountName;
  if (input.accessToken !== undefined) updates.access_token = input.accessToken;
  if (input.refreshToken !== undefined)
    updates.refresh_token = input.refreshToken;
  if (input.tokenExpiresAt !== undefined)
    updates.token_expires_at = input.tokenExpiresAt;
  if (input.status !== undefined) updates.status = input.status;

  const { data, error } = await supabase
    .from(CONNECTIONS_TABLE)
    .update(updates)
    .eq("id", connectionId)
    .eq("site_id", siteId)
    .select()
    .single();

  if (error)
    throw new Error(`Failed to update social connection: ${error.message}`);

  return mapRecord(data) as SocialConnection;
}

export async function deleteSocialConnection(
  connectionId: string,
  siteId: string,
): Promise<void> {
  const supabase = await getModuleClient();

  const { error } = await supabase
    .from(CONNECTIONS_TABLE)
    .delete()
    .eq("id", connectionId)
    .eq("site_id", siteId);

  if (error)
    throw new Error(`Failed to delete social connection: ${error.message}`);
}

export async function disconnectSocialConnection(
  connectionId: string,
  siteId: string,
): Promise<SocialConnection> {
  return updateSocialConnection(connectionId, siteId, {
    status: "disconnected",
  });
}

// ============================================================================
// SOCIAL POSTS
// ============================================================================

export async function getSocialPosts(
  siteId: string,
  options?: {
    status?: string;
    platform?: SocialPlatform;
    limit?: number;
    offset?: number;
  },
): Promise<{ posts: SocialPost[]; total: number }> {
  const supabase = await getModuleClient();
  const limit = options?.limit ?? 20;
  const offset = options?.offset ?? 0;

  let query = supabase
    .from(POSTS_TABLE)
    .select("*", { count: "exact" })
    .eq("site_id", siteId);

  if (options?.status) query = query.eq("status", options.status);
  if (options?.platform)
    query = query.contains("platforms", [options.platform]);

  query = query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("[Marketing] getSocialPosts error:", error.message);
    return { posts: [], total: 0 };
  }

  return {
    posts: mapRecords(data || []) as SocialPost[],
    total: count || 0,
  };
}

export async function getSocialPost(
  siteId: string,
  postId: string,
): Promise<SocialPost | null> {
  const supabase = await getModuleClient();

  const { data, error } = await supabase
    .from(POSTS_TABLE)
    .select("*")
    .eq("id", postId)
    .eq("site_id", siteId)
    .single();

  if (error) return null;

  return mapRecord(data) as SocialPost;
}

export async function createSocialPost(
  input: CreateSocialPostInput,
): Promise<SocialPost> {
  const supabase = await getModuleClient();

  const status = input.scheduledAt ? "scheduled" : "draft";

  const { data, error } = await supabase
    .from(POSTS_TABLE)
    .insert({
      site_id: input.siteId,
      content: input.content,
      media_urls: input.mediaUrls || null,
      platforms: input.platforms,
      scheduled_at: input.scheduledAt || null,
      link_url: input.linkUrl || null,
      utm_params: input.utmParams || null,
      campaign_id: input.campaignId || null,
      blog_post_id: input.blogPostId || null,
      status,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create social post: ${error.message}`);

  return mapRecord(data) as SocialPost;
}

export async function updateSocialPost(
  postId: string,
  siteId: string,
  input: UpdateSocialPostInput,
): Promise<SocialPost> {
  const supabase = await getModuleClient();

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (input.content !== undefined) updates.content = input.content;
  if (input.mediaUrls !== undefined) updates.media_urls = input.mediaUrls;
  if (input.platforms !== undefined) updates.platforms = input.platforms;
  if (input.scheduledAt !== undefined) updates.scheduled_at = input.scheduledAt;
  if (input.linkUrl !== undefined) updates.link_url = input.linkUrl;
  if (input.utmParams !== undefined) updates.utm_params = input.utmParams;
  if (input.status !== undefined) updates.status = input.status;

  const { data, error } = await supabase
    .from(POSTS_TABLE)
    .update(updates)
    .eq("id", postId)
    .eq("site_id", siteId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update social post: ${error.message}`);

  return mapRecord(data) as SocialPost;
}

export async function deleteSocialPost(
  postId: string,
  siteId: string,
): Promise<void> {
  const supabase = await getModuleClient();

  const { error } = await supabase
    .from(POSTS_TABLE)
    .delete()
    .eq("id", postId)
    .eq("site_id", siteId);

  if (error) throw new Error(`Failed to delete social post: ${error.message}`);
}

// ============================================================================
// CALENDAR DATA
// ============================================================================

export async function getCalendarEvents(
  siteId: string,
  startDate: string,
  endDate: string,
): Promise<CalendarEvent[]> {
  const supabase = await getModuleClient();
  const events: CalendarEvent[] = [];

  // Fetch scheduled/sent campaigns
  const { data: campaigns } = await supabase
    .from(MKT_TABLES.campaigns)
    .select("id, name, scheduled_at, completed_at, status")
    .eq("site_id", siteId)
    .or(`scheduled_at.gte.${startDate},completed_at.gte.${startDate}`)
    .or(`scheduled_at.lte.${endDate},completed_at.lte.${endDate}`);

  for (const c of campaigns || []) {
    const date = c.scheduled_at || c.completed_at;
    if (!date) continue;
    events.push({
      id: c.id,
      title: c.name || "Untitled Campaign",
      startDate: date,
      type: "campaign",
      status: c.status,
      color: "#3B82F6",
      link: `/dashboard/sites/${siteId}/marketing/campaigns/${c.id}`,
    });
  }

  // Fetch social posts
  const { data: socialPosts } = await supabase
    .from(POSTS_TABLE)
    .select("id, content, scheduled_at, published_at, status")
    .eq("site_id", siteId)
    .or(`scheduled_at.gte.${startDate},published_at.gte.${startDate}`)
    .or(`scheduled_at.lte.${endDate},published_at.lte.${endDate}`);

  for (const p of socialPosts || []) {
    const date = p.scheduled_at || p.published_at;
    if (!date) continue;
    events.push({
      id: p.id,
      title: (p.content || "").substring(0, 50) || "Social Post",
      startDate: date,
      type: "social",
      status: p.status,
      color: "#22C55E",
      link: `/dashboard/sites/${siteId}/marketing/social`,
    });
  }

  // Fetch active sequences
  const { data: sequences } = await supabase
    .from(MKT_TABLES.sequences)
    .select("id, name, created_at, status")
    .eq("site_id", siteId)
    .eq("status", "active");

  for (const s of sequences || []) {
    events.push({
      id: s.id,
      title: s.name || "Untitled Sequence",
      startDate: s.created_at,
      type: "sequence",
      status: s.status,
      color: "#F97316",
      link: `/dashboard/sites/${siteId}/marketing/sequences/${s.id}`,
    });
  }

  return events.sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );
}

// ============================================================================
// SCHEDULED POST PROCESSING (for cron)
// ============================================================================

export async function processScheduledPosts(): Promise<{
  processed: number;
  failed: number;
}> {
  const supabase = getAdminModuleClient();
  const now = new Date().toISOString();

  const { data: duePosts, error } = await supabase
    .from(POSTS_TABLE)
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_at", now);

  if (error || !duePosts?.length) {
    return { processed: 0, failed: 0 };
  }

  let processed = 0;
  let failed = 0;

  for (const post of duePosts) {
    try {
      // Mark as published (actual API publishing would happen via social-publisher service)
      await supabase
        .from(POSTS_TABLE)
        .update({
          status: "published",
          published_at: now,
          updated_at: now,
        })
        .eq("id", post.id);

      processed++;
    } catch {
      await supabase
        .from(POSTS_TABLE)
        .update({
          status: "failed",
          error_message: "Publishing failed",
          updated_at: now,
        })
        .eq("id", post.id);

      failed++;
    }
  }

  return { processed, failed };
}
