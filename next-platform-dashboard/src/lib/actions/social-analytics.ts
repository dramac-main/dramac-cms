"use server";

/**
 * Social Media Analytics Server Actions
 *
 * PHASE-DS-03B + SM-03: Real DB-backed analytics
 * Queries social_analytics_daily, social_post_analytics, social_optimal_times
 */

import { createClient } from "@/lib/supabase/server";

import type {
  SocialTimeRange,
  PlatformOverview,
  PlatformMetrics,
  ContentPerformance,
  ContentTypeMetrics,
  AudienceGrowth,
  AudienceDemographics,
  AudienceActivity,
  EngagementMetrics,
  EngagementTrend,
  EngagementByType,
  ReachMetrics,
  ReachTrend,
  ReachByPlatform,
  PostingMetrics,
  PostingTrend,
  PostingByPlatform,
  OptimalTime,
  HeatmapData,
  HashtagMetrics,
  StoryMetrics,
  StoryPerformance,
} from "@/types/social-analytics";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const PLATFORM_COLORS: Record<string, string> = {
  facebook: "#1877F2",
  instagram: "#E4405F",
  twitter: "#1DA1F2",
  linkedin: "#0A66C2",
  tiktok: "#000000",
  youtube: "#FF0000",
  pinterest: "#E60023",
  threads: "#000000",
  bluesky: "#0085FF",
  mastodon: "#6364FF",
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function timeRangeToDays(timeRange: SocialTimeRange): number {
  switch (timeRange) {
    case "7d": return 7;
    case "14d": return 14;
    case "30d": return 30;
    case "90d": return 90;
    case "12m":
    case "1y": return 365;
    case "all": return 3650;
    default: return 30;
  }
}

function dateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 10000) / 100;
}

// ============================================================================
// PLATFORM OVERVIEW
// ============================================================================

export async function getPlatformOverview(
  siteId: string,
  timeRange: SocialTimeRange
): Promise<PlatformOverview> {
  const supabase = await createClient();
  const days = timeRangeToDays(timeRange);
  const since = dateNDaysAgo(days);
  const prevSince = dateNDaysAgo(days * 2);

  // Get active accounts
  const { data: accounts } = await (supabase as any)
    .from("social_accounts")
    .select("id, platform, followers_count")
    .eq("site_id", siteId)
    .eq("status", "active");

  if (!accounts || accounts.length === 0) {
    return {
      platforms: [],
      totalFollowers: 0, totalFollowersChange: 0,
      totalImpressions: 0, totalImpressionsChange: 0,
      totalEngagements: 0, totalEngagementsChange: 0,
      totalClicks: 0, totalClicksChange: 0,
      avgEngagementRate: 0, avgEngagementRateChange: 0,
      activePlatforms: 0, connected: false,
    };
  }

  // Current period analytics
  const { data: currentRows } = await (supabase as any)
    .from("social_analytics_daily")
    .select("platform, impressions, engagements, clicks, reach, followers")
    .eq("site_id", siteId)
    .gte("date", since);

  // Previous period for change calculation
  const { data: prevRows } = await (supabase as any)
    .from("social_analytics_daily")
    .select("platform, impressions, engagements, clicks, reach, followers")
    .eq("site_id", siteId)
    .gte("date", prevSince)
    .lt("date", since);

  const aggregate = (rows: any[], field: string) =>
    (rows || []).reduce((sum: number, r: any) => sum + (r[field] || 0), 0);

  const byPlatform = (rows: any[], platform: string, field: string) =>
    (rows || []).filter((r: any) => r.platform === platform).reduce((sum: number, r: any) => sum + (r[field] || 0), 0);

  // Get unique platforms from accounts
  const uniquePlatforms = [...new Set(accounts.map((a: any) => a.platform))] as string[];

  const platforms: PlatformMetrics[] = uniquePlatforms.map((platform) => {
    const accs = accounts.filter((a: any) => a.platform === platform);
    const followers = accs.reduce((s: number, a: any) => s + (a.followers_count || 0), 0);
    const currImp = byPlatform(currentRows, platform, "impressions");
    const prevImp = byPlatform(prevRows, platform, "impressions");
    const currEng = byPlatform(currentRows, platform, "engagements");
    const prevEng = byPlatform(prevRows, platform, "engagements");
    const currClk = byPlatform(currentRows, platform, "clicks");
    const prevClk = byPlatform(prevRows, platform, "clicks");

    return {
      platform,
      followers,
      followersChange: 0,
      impressions: currImp,
      impressionsChange: pctChange(currImp, prevImp),
      engagements: currEng,
      engagementsChange: pctChange(currEng, prevEng),
      clicks: currClk,
      clicksChange: pctChange(currClk, prevClk),
      engagementRate: currImp > 0 ? Math.round((currEng / currImp) * 10000) / 100 : 0,
      color: PLATFORM_COLORS[platform] || "#6B7280",
    };
  });

  const totalImp = aggregate(currentRows, "impressions");
  const totalEng = aggregate(currentRows, "engagements");
  const totalClk = aggregate(currentRows, "clicks");
  const prevTotalImp = aggregate(prevRows, "impressions");
  const prevTotalEng = aggregate(prevRows, "engagements");
  const prevTotalClk = aggregate(prevRows, "clicks");
  const totalFollowers = accounts.reduce((s: number, a: any) => s + (a.followers_count || 0), 0);

  return {
    platforms,
    totalFollowers,
    totalFollowersChange: 0,
    totalImpressions: totalImp,
    totalImpressionsChange: pctChange(totalImp, prevTotalImp),
    totalEngagements: totalEng,
    totalEngagementsChange: pctChange(totalEng, prevTotalEng),
    totalClicks: totalClk,
    totalClicksChange: pctChange(totalClk, prevTotalClk),
    avgEngagementRate: totalImp > 0 ? Math.round((totalEng / totalImp) * 10000) / 100 : 0,
    avgEngagementRateChange: 0,
    activePlatforms: uniquePlatforms.length,
    connected: uniquePlatforms.length > 0,
  };
}

// ============================================================================
// CONTENT PERFORMANCE
// ============================================================================

export async function getTopContent(
  siteId: string,
  timeRange: SocialTimeRange,
  limit: number = 10
): Promise<ContentPerformance[]> {
  const supabase = await createClient();
  const days = timeRangeToDays(timeRange);
  const since = dateNDaysAgo(days);

  const { data: posts } = await (supabase as any)
    .from("social_posts")
    .select("id, content, platform, published_at, media")
    .eq("site_id", siteId)
    .eq("status", "published")
    .gte("published_at", since)
    .order("published_at", { ascending: false })
    .limit(limit * 3); // fetch more to rank by engagement

  if (!posts || posts.length === 0) return [];

  const postIds = posts.map((p: any) => p.id);
  const { data: analytics } = await (supabase as any)
    .from("social_post_analytics")
    .select("post_id, impressions, likes, comments, shares, reach, clicks")
    .in("post_id", postIds);

  const analyticsMap: Record<string, any> = {};
  for (const a of analytics || []) {
    analyticsMap[a.post_id] = a;
  }

  const results: ContentPerformance[] = posts.map((p: any) => {
    const a = analyticsMap[p.id] || {};
    const impressions = a.impressions || 0;
    const engagements = (a.likes || 0) + (a.comments || 0) + (a.shares || 0);
    const media = p.media || [];
    let contentType: ContentPerformance["contentType"] = "text";
    if (media.length > 1) contentType = "carousel";
    else if (media.length === 1 && media[0]?.type === "video") contentType = "video";
    else if (media.length === 1) contentType = "image";

    return {
      postId: p.id,
      platform: p.platform || "unknown",
      content: (p.content || "").slice(0, 200),
      contentType,
      publishedAt: p.published_at || "",
      impressions,
      engagements,
      engagementRate: impressions > 0 ? Math.round((engagements / impressions) * 10000) / 100 : 0,
      likes: a.likes || 0,
      comments: a.comments || 0,
      shares: a.shares || 0,
      saves: 0,
      clicks: a.clicks || 0,
      reach: a.reach || 0,
    };
  });

  return results
    .sort((a, b) => b.engagements - a.engagements)
    .slice(0, limit);
}

export async function getContentTypeMetrics(
  siteId: string,
  timeRange: SocialTimeRange
): Promise<ContentTypeMetrics[]> {
  // Derive from post + analytics data
  const content = await getTopContent(siteId, timeRange, 200);
  const byType: Record<string, { count: number; impressions: number; engagements: number }> = {};

  for (const c of content) {
    if (!byType[c.contentType]) byType[c.contentType] = { count: 0, impressions: 0, engagements: 0 };
    byType[c.contentType].count++;
    byType[c.contentType].impressions += c.impressions;
    byType[c.contentType].engagements += c.engagements;
  }

  const typeColors: Record<string, string> = {
    image: "#3B82F6", video: "#EF4444", carousel: "#8B5CF6",
    text: "#10B981", link: "#F59E0B", story: "#EC4899", reel: "#6366F1",
  };

  return Object.entries(byType).map(([type, d]) => ({
    type,
    count: d.count,
    avgImpressions: d.count > 0 ? Math.round(d.impressions / d.count) : 0,
    avgEngagement: d.count > 0 ? Math.round(d.engagements / d.count) : 0,
    avgEngagementRate: d.impressions > 0 ? Math.round((d.engagements / d.impressions) * 10000) / 100 : 0,
    totalImpressions: d.impressions,
    totalEngagements: d.engagements,
    color: typeColors[type] || "#6B7280",
  }));
}

// ============================================================================
// AUDIENCE ANALYTICS
// ============================================================================

export async function getAudienceGrowth(
  siteId: string,
  timeRange: SocialTimeRange
): Promise<AudienceGrowth[]> {
  const supabase = await createClient();
  const days = timeRangeToDays(timeRange);
  const since = dateNDaysAgo(days);

  const { data: rows } = await (supabase as any)
    .from("social_analytics_daily")
    .select("date, followers")
    .eq("site_id", siteId)
    .gte("date", since)
    .order("date", { ascending: true });

  if (!rows || rows.length === 0) return [];

  // Group by date and sum followers across all accounts
  const byDate: Record<string, number> = {};
  for (const r of rows) {
    byDate[r.date] = (byDate[r.date] || 0) + (r.followers || 0);
  }

  let prevFollowers = 0;
  return Object.entries(byDate).map(([date, followers]) => {
    const netGrowth = prevFollowers > 0 ? followers - prevFollowers : 0;
    const gained = netGrowth > 0 ? netGrowth : 0;
    const lost = netGrowth < 0 ? Math.abs(netGrowth) : 0;
    prevFollowers = followers;
    return { date, followers, following: 0, gained, lost, netGrowth };
  });
}

export async function getAudienceDemographics(
  siteId: string,
  timeRange: SocialTimeRange
): Promise<AudienceDemographics> {
  // Demographics require platform-specific API data not in our daily table
  // Return empty until platform demographics sync is implemented
  return { ageGroups: [], genders: [], topLocations: [], topLanguages: [] };
}

export async function getAudienceActivity(
  siteId: string,
  timeRange: SocialTimeRange
): Promise<AudienceActivity[]> {
  // Use optimal times data as a proxy for audience activity
  const supabase = await createClient();

  const { data: times } = await (supabase as any)
    .from("social_optimal_times")
    .select("day_of_week, hour, score")
    .eq("site_id", siteId);

  if (!times || times.length === 0) return [];

  const byDay: Record<number, { hour: number; activity: number }[]> = {};
  for (const t of times) {
    if (!byDay[t.day_of_week]) byDay[t.day_of_week] = [];
    byDay[t.day_of_week].push({ hour: t.hour, activity: t.score || 0 });
  }

  return Object.entries(byDay).map(([day, hours]) => ({
    dayOfWeek: Number(day),
    dayName: DAY_NAMES[Number(day)] || "",
    hours: hours.sort((a, b) => a.hour - b.hour),
  }));
}

// ============================================================================
// ENGAGEMENT ANALYTICS
// ============================================================================

export async function getEngagementMetrics(
  siteId: string,
  timeRange: SocialTimeRange
): Promise<EngagementMetrics> {
  const supabase = await createClient();
  const days = timeRangeToDays(timeRange);
  const since = dateNDaysAgo(days);
  const prevSince = dateNDaysAgo(days * 2);

  const { data: curr } = await (supabase as any)
    .from("social_analytics_daily")
    .select("engagements, likes, comments, shares, clicks, impressions")
    .eq("site_id", siteId)
    .gte("date", since);

  const { data: prev } = await (supabase as any)
    .from("social_analytics_daily")
    .select("engagements, likes, comments, shares, clicks, impressions")
    .eq("site_id", siteId)
    .gte("date", prevSince)
    .lt("date", since);

  const sum = (rows: any[], f: string) => (rows || []).reduce((s: number, r: any) => s + (r[f] || 0), 0);

  const totalEng = sum(curr, "engagements");
  const prevEng = sum(prev, "engagements");
  const totalImp = sum(curr, "impressions");
  const prevImp = sum(prev, "impressions");
  const likes = sum(curr, "likes");
  const comments = sum(curr, "comments");
  const shares = sum(curr, "shares");
  const clicks = sum(curr, "clicks");
  const prevLikes = sum(prev, "likes");
  const prevComments = sum(prev, "comments");
  const prevShares = sum(prev, "shares");
  const prevClicks = sum(prev, "clicks");

  const engRate = totalImp > 0 ? (totalEng / totalImp) * 100 : 0;
  const prevRate = prevImp > 0 ? (prevEng / prevImp) * 100 : 0;

  return {
    totalEngagements: totalEng,
    totalEngagementsChange: pctChange(totalEng, prevEng),
    avgEngagementRate: Math.round(engRate * 100) / 100,
    avgEngagementRateChange: pctChange(engRate, prevRate),
    likes,
    likesChange: pctChange(likes, prevLikes),
    comments,
    commentsChange: pctChange(comments, prevComments),
    shares,
    sharesChange: pctChange(shares, prevShares),
    saves: 0,
    savesChange: 0,
    clicks,
    clicksChange: pctChange(clicks, prevClicks),
    replies: 0,
    repliesChange: 0,
  };
}

export async function getEngagementTrend(
  siteId: string,
  timeRange: SocialTimeRange
): Promise<EngagementTrend[]> {
  const supabase = await createClient();
  const days = timeRangeToDays(timeRange);
  const since = dateNDaysAgo(days);

  const { data: rows } = await (supabase as any)
    .from("social_analytics_daily")
    .select("date, likes, comments, shares, clicks")
    .eq("site_id", siteId)
    .gte("date", since)
    .order("date", { ascending: true });

  if (!rows || rows.length === 0) return [];

  const byDate: Record<string, EngagementTrend> = {};
  for (const r of rows) {
    if (!byDate[r.date]) {
      byDate[r.date] = { date: r.date, likes: 0, comments: 0, shares: 0, saves: 0, clicks: 0, total: 0 };
    }
    byDate[r.date].likes += r.likes || 0;
    byDate[r.date].comments += r.comments || 0;
    byDate[r.date].shares += r.shares || 0;
    byDate[r.date].clicks += r.clicks || 0;
    byDate[r.date].total += (r.likes || 0) + (r.comments || 0) + (r.shares || 0) + (r.clicks || 0);
  }

  return Object.values(byDate);
}

export async function getEngagementByType(
  siteId: string,
  timeRange: SocialTimeRange
): Promise<EngagementByType[]> {
  const metrics = await getEngagementMetrics(siteId, timeRange);
  const total = metrics.likes + metrics.comments + metrics.shares + metrics.clicks;
  if (total === 0) return [];

  return [
    { type: "Likes", count: metrics.likes, percentage: Math.round((metrics.likes / total) * 100), color: "#EF4444" },
    { type: "Comments", count: metrics.comments, percentage: Math.round((metrics.comments / total) * 100), color: "#3B82F6" },
    { type: "Shares", count: metrics.shares, percentage: Math.round((metrics.shares / total) * 100), color: "#10B981" },
    { type: "Clicks", count: metrics.clicks, percentage: Math.round((metrics.clicks / total) * 100), color: "#F59E0B" },
  ].filter((e) => e.count > 0);
}

// ============================================================================
// REACH & IMPRESSIONS
// ============================================================================

export async function getReachMetrics(
  siteId: string,
  timeRange: SocialTimeRange
): Promise<ReachMetrics> {
  const supabase = await createClient();
  const days = timeRangeToDays(timeRange);
  const since = dateNDaysAgo(days);
  const prevSince = dateNDaysAgo(days * 2);

  const { data: curr } = await (supabase as any)
    .from("social_analytics_daily")
    .select("reach, impressions")
    .eq("site_id", siteId)
    .gte("date", since);

  const { data: prev } = await (supabase as any)
    .from("social_analytics_daily")
    .select("reach, impressions")
    .eq("site_id", siteId)
    .gte("date", prevSince)
    .lt("date", since);

  const sum = (rows: any[], f: string) => (rows || []).reduce((s: number, r: any) => s + (r[f] || 0), 0);

  const totalReach = sum(curr, "reach");
  const totalImp = sum(curr, "impressions");
  const prevReach = sum(prev, "reach");
  const prevImp = sum(prev, "impressions");

  // Approximate post count from the analytics entries
  const postCount = (curr || []).length || 1;
  const prevPostCount = (prev || []).length || 1;

  return {
    totalReach,
    totalReachChange: pctChange(totalReach, prevReach),
    totalImpressions: totalImp,
    totalImpressionsChange: pctChange(totalImp, prevImp),
    uniqueReach: totalReach,
    uniqueReachChange: pctChange(totalReach, prevReach),
    avgReachPerPost: Math.round(totalReach / postCount),
    avgReachPerPostChange: pctChange(totalReach / postCount, prevReach / prevPostCount),
    avgImpressionsPerPost: Math.round(totalImp / postCount),
    avgImpressionsPerPostChange: pctChange(totalImp / postCount, prevImp / prevPostCount),
    viralReach: 0,
    viralReachChange: 0,
    organicReach: totalReach,
    organicReachChange: pctChange(totalReach, prevReach),
    paidReach: 0,
    paidReachChange: 0,
  };
}

export async function getReachTrend(
  siteId: string,
  timeRange: SocialTimeRange
): Promise<ReachTrend[]> {
  const supabase = await createClient();
  const days = timeRangeToDays(timeRange);
  const since = dateNDaysAgo(days);

  const { data: rows } = await (supabase as any)
    .from("social_analytics_daily")
    .select("date, reach, impressions")
    .eq("site_id", siteId)
    .gte("date", since)
    .order("date", { ascending: true });

  if (!rows || rows.length === 0) return [];

  const byDate: Record<string, ReachTrend> = {};
  for (const r of rows) {
    if (!byDate[r.date]) {
      byDate[r.date] = { date: r.date, reach: 0, impressions: 0, organic: 0, paid: 0, viral: 0 };
    }
    byDate[r.date].reach += r.reach || 0;
    byDate[r.date].impressions += r.impressions || 0;
    byDate[r.date].organic += r.reach || 0;
  }

  return Object.values(byDate);
}

export async function getReachByPlatform(
  siteId: string,
  timeRange: SocialTimeRange
): Promise<ReachByPlatform[]> {
  const supabase = await createClient();
  const days = timeRangeToDays(timeRange);
  const since = dateNDaysAgo(days);

  const { data: rows } = await (supabase as any)
    .from("social_analytics_daily")
    .select("platform, reach, impressions")
    .eq("site_id", siteId)
    .gte("date", since);

  if (!rows || rows.length === 0) return [];

  const byPlatform: Record<string, { reach: number; impressions: number }> = {};
  for (const r of rows) {
    if (!byPlatform[r.platform]) byPlatform[r.platform] = { reach: 0, impressions: 0 };
    byPlatform[r.platform].reach += r.reach || 0;
    byPlatform[r.platform].impressions += r.impressions || 0;
  }

  const totalReach = Object.values(byPlatform).reduce((s, p) => s + p.reach, 0) || 1;

  return Object.entries(byPlatform).map(([platform, d]) => ({
    platform,
    reach: d.reach,
    impressions: d.impressions,
    percentage: Math.round((d.reach / totalReach) * 100),
    color: PLATFORM_COLORS[platform] || "#6B7280",
  }));
}

// ============================================================================
// POSTING ANALYTICS
// ============================================================================

export async function getPostingMetrics(
  siteId: string,
  timeRange: SocialTimeRange
): Promise<PostingMetrics> {
  const supabase = await createClient();
  const days = timeRangeToDays(timeRange);
  const since = dateNDaysAgo(days);
  const prevSince = dateNDaysAgo(days * 2);

  const { data: published } = await (supabase as any)
    .from("social_posts")
    .select("id, published_at")
    .eq("site_id", siteId)
    .eq("status", "published")
    .gte("published_at", since);

  const { data: scheduled } = await (supabase as any)
    .from("social_posts")
    .select("id")
    .eq("site_id", siteId)
    .eq("status", "scheduled");

  const { data: drafts } = await (supabase as any)
    .from("social_posts")
    .select("id")
    .eq("site_id", siteId)
    .eq("status", "draft");

  const { data: prevPublished } = await (supabase as any)
    .from("social_posts")
    .select("id")
    .eq("site_id", siteId)
    .eq("status", "published")
    .gte("published_at", prevSince)
    .lt("published_at", since);

  const pubCount = published?.length || 0;
  const prevPubCount = prevPublished?.length || 0;
  const schedCount = scheduled?.length || 0;
  const draftCount = drafts?.length || 0;
  const total = pubCount + schedCount + draftCount;

  // Find most active day from published posts
  const dayCounts: Record<string, number> = {};
  const hourCounts: Record<number, number> = {};
  for (const p of published || []) {
    if (!p.published_at) continue;
    const dt = new Date(p.published_at);
    const dayName = DAY_NAMES[dt.getDay()];
    dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
    hourCounts[dt.getHours()] = (hourCounts[dt.getHours()] || 0) + 1;
  }

  const mostActiveDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
  const mostActiveHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "0";

  return {
    totalPosts: total,
    totalPostsChange: pctChange(pubCount, prevPubCount),
    postsPublished: pubCount,
    postsScheduled: schedCount,
    postsDraft: draftCount,
    avgPostsPerDay: days > 0 ? Math.round((pubCount / days) * 100) / 100 : 0,
    avgPostsPerDayChange: pctChange(pubCount / days, prevPubCount / days),
    mostActiveDay,
    mostActiveHour: Number(mostActiveHour),
    publishSuccessRate: pubCount > 0 ? 100 : 0,
  };
}

export async function getPostingTrend(
  siteId: string,
  timeRange: SocialTimeRange
): Promise<PostingTrend[]> {
  const supabase = await createClient();
  const days = timeRangeToDays(timeRange);
  const since = dateNDaysAgo(days);

  const { data: posts } = await (supabase as any)
    .from("social_posts")
    .select("status, published_at, scheduled_at")
    .eq("site_id", siteId)
    .or(`published_at.gte.${since},scheduled_at.gte.${since}`);

  if (!posts || posts.length === 0) return [];

  const byDate: Record<string, PostingTrend> = {};
  for (const p of posts) {
    const date = (p.published_at || p.scheduled_at || "").split("T")[0];
    if (!date) continue;
    if (!byDate[date]) byDate[date] = { date, posts: 0, scheduled: 0, published: 0, failed: 0 };
    byDate[date].posts++;
    if (p.status === "published") byDate[date].published++;
    else if (p.status === "scheduled") byDate[date].scheduled++;
    else if (p.status === "failed") byDate[date].failed++;
  }

  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getPostingByPlatform(
  siteId: string,
  timeRange: SocialTimeRange
): Promise<PostingByPlatform[]> {
  const supabase = await createClient();
  const days = timeRangeToDays(timeRange);
  const since = dateNDaysAgo(days);

  const { data: posts } = await (supabase as any)
    .from("social_posts")
    .select("id, platform")
    .eq("site_id", siteId)
    .eq("status", "published")
    .gte("published_at", since);

  if (!posts || posts.length === 0) return [];

  const byPlatform: Record<string, number> = {};
  for (const p of posts) {
    const plat = p.platform || "unknown";
    byPlatform[plat] = (byPlatform[plat] || 0) + 1;
  }

  const total = posts.length || 1;

  return Object.entries(byPlatform).map(([platform, count]) => ({
    platform,
    posts: count,
    percentage: Math.round((count / total) * 100),
    avgEngagement: 0,
    color: PLATFORM_COLORS[platform] || "#6B7280",
  }));
}

// ============================================================================
// OPTIMAL TIMES
// ============================================================================

export async function getOptimalTimes(
  siteId: string,
  timeRange: SocialTimeRange
): Promise<OptimalTime[]> {
  const supabase = await createClient();

  const { data: rows } = await (supabase as any)
    .from("social_optimal_times")
    .select("day_of_week, hour, score, post_count")
    .eq("site_id", siteId)
    .order("score", { ascending: false })
    .limit(21);

  if (!rows || rows.length === 0) return [];

  return rows.map((r: any) => ({
    dayOfWeek: r.day_of_week,
    dayName: DAY_NAMES[r.day_of_week] || "",
    hour: r.hour,
    timeLabel: `${r.hour.toString().padStart(2, "0")}:00`,
    score: r.score || 0,
    avgEngagement: r.score || 0,
    avgReach: 0,
  }));
}

export async function getHeatmapData(
  siteId: string,
  timeRange: SocialTimeRange
): Promise<HeatmapData[]> {
  const supabase = await createClient();

  const { data: rows } = await (supabase as any)
    .from("social_optimal_times")
    .select("day_of_week, hour, score")
    .eq("site_id", siteId);

  if (!rows || rows.length === 0) return [];

  return rows.map((r: any) => ({
    dayOfWeek: r.day_of_week,
    hour: r.hour,
    value: r.score || 0,
  }));
}

// ============================================================================
// HASHTAG ANALYTICS
// ============================================================================

export async function getHashtagMetrics(
  siteId: string,
  timeRange: SocialTimeRange,
  limit: number = 10
): Promise<HashtagMetrics[]> {
  // Extract hashtags from published posts and correlate with analytics
  const supabase = await createClient();
  const days = timeRangeToDays(timeRange);
  const since = dateNDaysAgo(days);

  const { data: posts } = await (supabase as any)
    .from("social_posts")
    .select("id, content")
    .eq("site_id", siteId)
    .eq("status", "published")
    .gte("published_at", since);

  if (!posts || posts.length === 0) return [];

  // Extract hashtags and count usage
  const hashtagPosts: Record<string, string[]> = {};
  for (const p of posts) {
    const tags = (p.content || "").match(/#\w+/g) || [];
    for (const tag of tags) {
      const lower = tag.toLowerCase();
      if (!hashtagPosts[lower]) hashtagPosts[lower] = [];
      hashtagPosts[lower].push(p.id);
    }
  }

  // Get analytics for posts
  const allPostIds = posts.map((p: any) => p.id);
  const { data: analytics } = await (supabase as any)
    .from("social_post_analytics")
    .select("post_id, impressions, likes, comments, shares, reach")
    .in("post_id", allPostIds);

  const analyticsMap: Record<string, any> = {};
  for (const a of analytics || []) {
    analyticsMap[a.post_id] = a;
  }

  const result: HashtagMetrics[] = Object.entries(hashtagPosts)
    .map(([hashtag, postIds]) => {
      let totalImp = 0, totalEng = 0, totalReach = 0;
      for (const pid of postIds) {
        const a = analyticsMap[pid];
        if (a) {
          totalImp += a.impressions || 0;
          totalEng += (a.likes || 0) + (a.comments || 0) + (a.shares || 0);
          totalReach += a.reach || 0;
        }
      }
      return {
        hashtag,
        usageCount: postIds.length,
        totalImpressions: totalImp,
        totalEngagements: totalEng,
        avgEngagementRate: totalImp > 0 ? Math.round((totalEng / totalImp) * 10000) / 100 : 0,
        reach: totalReach,
        trending: postIds.length >= 3,
      };
    })
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, limit);

  return result;
}

// ============================================================================
// STORY ANALYTICS
// ============================================================================

export async function getStoryMetrics(
  siteId: string,
  timeRange: SocialTimeRange
): Promise<StoryMetrics> {
  // Stories are platform-specific (IG/FB) — return empty until stories sync
  return {
    totalStories: 0, totalStoriesChange: 0,
    avgViews: 0, avgViewsChange: 0,
    avgCompletionRate: 0, avgCompletionRateChange: 0,
    totalReplies: 0, totalRepliesChange: 0,
    totalTaps: 0, totalTapsChange: 0,
    exitRate: 0, exitRateChange: 0,
  };
}

export async function getStoryPerformance(
  siteId: string,
  timeRange: SocialTimeRange,
  limit: number = 10
): Promise<StoryPerformance[]> {
  return [];
}

// ============================================================================
// COMBINED FETCH
// ============================================================================

export async function getSocialAnalytics(
  siteId: string,
  timeRange: SocialTimeRange
) {
  const [
    platformOverview,
    topContent,
    contentTypeMetrics,
    audienceGrowth,
    engagementMetrics,
    engagementTrend,
    reachMetrics,
    reachTrend,
    postingMetrics,
    optimalTimes,
    hashtagMetrics,
    storyMetrics,
  ] = await Promise.all([
    getPlatformOverview(siteId, timeRange),
    getTopContent(siteId, timeRange),
    getContentTypeMetrics(siteId, timeRange),
    getAudienceGrowth(siteId, timeRange),
    getEngagementMetrics(siteId, timeRange),
    getEngagementTrend(siteId, timeRange),
    getReachMetrics(siteId, timeRange),
    getReachTrend(siteId, timeRange),
    getPostingMetrics(siteId, timeRange),
    getOptimalTimes(siteId, timeRange),
    getHashtagMetrics(siteId, timeRange),
    getStoryMetrics(siteId, timeRange),
  ]);

  return {
    platformOverview,
    topContent,
    contentTypeMetrics,
    audienceGrowth,
    engagementMetrics,
    engagementTrend,
    reachMetrics,
    reachTrend,
    postingMetrics,
    optimalTimes,
    hashtagMetrics,
    storyMetrics,
    timeRange,
    lastUpdated: new Date().toISOString(),
    connected: platformOverview.connected,
  };
}
