/**
 * Blog Auto-Share Service
 *
 * Phase MKT-12: Social Media Integration
 *
 * Automatically creates social media posts when blog posts are published.
 * Generates platform-specific captions using AI.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { MKT_TABLES } from "../lib/marketing-constants";
import { mapRecords } from "@/lib/map-db-record";
import { generateSocialCaption } from "./social-caption-ai";
import type { SocialConnection, SocialPlatform } from "../types/social-types";

interface BlogPostData {
  id: string;
  title: string;
  excerpt?: string;
  slug: string;
  siteId: string;
  url?: string;
}

/**
 * Auto-share a blog post to all active social connections.
 *
 * Called when a blog post status changes to "published".
 * Creates individual social posts per platform with AI-generated captions.
 */
export async function autoShareBlogPost(
  blogPost: BlogPostData,
): Promise<{ created: number; errors: string[] }> {
  const supabase = createAdminClient() as any;
  const errors: string[] = [];
  let created = 0;

  // Check if auto-share is enabled in marketing settings
  const { data: settings } = await supabase
    .from(MKT_TABLES.settings)
    .select("social_auto_share_enabled")
    .eq("site_id", blogPost.siteId)
    .single();

  if (!settings?.social_auto_share_enabled) {
    return { created: 0, errors: ["Auto-share is disabled in marketing settings"] };
  }

  // Get active social connections
  const { data: connections } = await supabase
    .from(MKT_TABLES.socialConnections)
    .select("*")
    .eq("site_id", blogPost.siteId)
    .eq("status", "active");

  const activeConnections = mapRecords(connections || []) as SocialConnection[];

  if (activeConnections.length === 0) {
    return { created: 0, errors: ["No active social connections"] };
  }

  // Group connections by platform (avoid duplicate posts to same platform)
  const platformMap = new Map<SocialPlatform, SocialConnection>();
  for (const conn of activeConnections) {
    if (!platformMap.has(conn.platform)) {
      platformMap.set(conn.platform, conn);
    }
  }

  const postUrl = blogPost.url || `/blog/${blogPost.slug}`;

  for (const [platform] of platformMap) {
    try {
      // Generate platform-specific caption
      const captionResult = await generateSocialCaption({
        title: blogPost.title,
        excerpt: blogPost.excerpt,
        platform,
      });

      // Create social post
      const { error } = await supabase
        .from(MKT_TABLES.socialPosts)
        .insert({
          site_id: blogPost.siteId,
          content: captionResult.caption,
          platforms: [platform],
          link_url: postUrl,
          utm_params: {
            utm_source: platform,
            utm_medium: "social",
            utm_campaign: "blog-auto-share",
          },
          blog_post_id: blogPost.id,
          status: "scheduled",
          scheduled_at: new Date().toISOString(),
        });

      if (error) {
        errors.push(`${platform}: ${error.message}`);
      } else {
        created++;
      }
    } catch (err: any) {
      errors.push(`${platform}: ${err.message}`);
    }
  }

  return { created, errors };
}
