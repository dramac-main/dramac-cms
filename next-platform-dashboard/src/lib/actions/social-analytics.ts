"use server";

/**
 * Social Media Analytics Server Actions
 * 
 * PHASE-DS-03B: Social Analytics Dashboard
 * Server actions for fetching social media analytics data
 */

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

function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return function() {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    return hash / 0x7fffffff;
  };
}

function getDateRange(timeRange: SocialTimeRange): { startDate: Date; endDate: Date; days: number } {
  const endDate = new Date();
  let days = 30;
  
  switch (timeRange) {
    case "7d": days = 7; break;
    case "14d": days = 14; break;
    case "30d": days = 30; break;
    case "90d": days = 90; break;
    case "12m": days = 365; break;
    case "1y": days = 365; break;
    case "all": days = 730; break;
  }
  
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
  return { startDate, endDate, days };
}

const PLATFORM_COLORS: Record<string, string> = {
  facebook: "#1877F2",
  instagram: "#E4405F",
  twitter: "#1DA1F2",
  linkedin: "#0A66C2",
  tiktok: "#000000",
  youtube: "#FF0000",
  pinterest: "#E60023",
  threads: "#000000",
};

const PLATFORMS = ["facebook", "instagram", "twitter", "linkedin", "tiktok", "youtube"];

// ============================================================================
// PLATFORM OVERVIEW
// ============================================================================

export async function getPlatformOverview(
  siteId: string,
  timeRange: SocialTimeRange
): Promise<PlatformOverview> {
  const random = seededRandom(`${siteId}-platform-overview-${timeRange}`);
  
  const platforms: PlatformMetrics[] = PLATFORMS.map(platform => {
    const baseFollowers = Math.floor(random() * 50000) + 5000;
    const baseImpressions = Math.floor(random() * 200000) + 20000;
    const baseEngagements = Math.floor(baseImpressions * (random() * 0.08 + 0.02));
    const baseClicks = Math.floor(baseEngagements * (random() * 0.3 + 0.1));
    
    return {
      platform,
      followers: baseFollowers,
      followersChange: (random() - 0.3) * 15,
      impressions: baseImpressions,
      impressionsChange: (random() - 0.3) * 25,
      engagements: baseEngagements,
      engagementsChange: (random() - 0.3) * 20,
      clicks: baseClicks,
      clicksChange: (random() - 0.3) * 30,
      engagementRate: parseFloat(((baseEngagements / baseImpressions) * 100).toFixed(2)),
      color: PLATFORM_COLORS[platform] || "#6B7280",
    };
  });
  
  const totalFollowers = platforms.reduce((sum, p) => sum + p.followers, 0);
  const totalImpressions = platforms.reduce((sum, p) => sum + p.impressions, 0);
  const totalEngagements = platforms.reduce((sum, p) => sum + p.engagements, 0);
  const totalClicks = platforms.reduce((sum, p) => sum + p.clicks, 0);
  
  return {
    platforms,
    totalFollowers,
    totalFollowersChange: parseFloat(((random() - 0.3) * 12).toFixed(2)),
    totalImpressions,
    totalImpressionsChange: parseFloat(((random() - 0.3) * 18).toFixed(2)),
    totalEngagements,
    totalEngagementsChange: parseFloat(((random() - 0.3) * 15).toFixed(2)),
    totalClicks,
    totalClicksChange: parseFloat(((random() - 0.3) * 22).toFixed(2)),
    avgEngagementRate: parseFloat(((totalEngagements / totalImpressions) * 100).toFixed(2)),
    avgEngagementRateChange: parseFloat(((random() - 0.4) * 10).toFixed(2)),
    activePlatforms: platforms.length,
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
  const random = seededRandom(`${siteId}-top-content-${timeRange}`);
  const contentTypes: ContentPerformance["contentType"][] = ["image", "video", "carousel", "text", "link", "story", "reel"];
  const { days } = getDateRange(timeRange);
  
  const content: ContentPerformance[] = [];
  
  for (let i = 0; i < limit; i++) {
    const platform = PLATFORMS[Math.floor(random() * PLATFORMS.length)];
    const contentType = contentTypes[Math.floor(random() * contentTypes.length)];
    const impressions = Math.floor(random() * 50000) + 5000;
    const engagements = Math.floor(impressions * (random() * 0.12 + 0.03));
    const daysAgo = Math.floor(random() * days);
    const publishedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    
    content.push({
      postId: `post-${i + 1}-${siteId.slice(0, 8)}`,
      platform,
      content: getRandomPostContent(random),
      contentType,
      publishedAt: publishedAt.toISOString(),
      impressions,
      engagements,
      engagementRate: parseFloat(((engagements / impressions) * 100).toFixed(2)),
      likes: Math.floor(engagements * (random() * 0.5 + 0.3)),
      comments: Math.floor(engagements * (random() * 0.2 + 0.05)),
      shares: Math.floor(engagements * (random() * 0.15 + 0.02)),
      saves: Math.floor(engagements * (random() * 0.1 + 0.02)),
      clicks: Math.floor(engagements * (random() * 0.25 + 0.05)),
      reach: Math.floor(impressions * (random() * 0.3 + 0.6)),
      videoViews: contentType === "video" || contentType === "reel" 
        ? Math.floor(impressions * (random() * 0.4 + 0.5)) 
        : undefined,
    });
  }
  
  return content.sort((a, b) => b.engagements - a.engagements);
}

function getRandomPostContent(random: () => number): string {
  const contents = [
    "🚀 Exciting news! We're launching something big next week. Stay tuned!",
    "Behind the scenes of our latest project. The team has been working hard! 💪",
    "Customer spotlight: See how @customer transformed their business with us.",
    "5 tips for success in 2025. Which one resonates with you most? 🎯",
    "Thank you for 10K followers! We couldn't do this without you. 🙏",
    "New feature alert! Check out what we've been building. Link in bio.",
    "Monday motivation: 'Success is not final, failure is not fatal.'",
    "Product demo time! Watch how easy it is to get started.",
    "Join us for our upcoming webinar on digital transformation. Register now!",
    "Throwback to our team retreat. Building memories and strategies! 🏔️",
  ];
  return contents[Math.floor(random() * contents.length)];
}

export async function getContentTypeMetrics(
  siteId: string,
  timeRange: SocialTimeRange
): Promise<ContentTypeMetrics[]> {
  const random = seededRandom(`${siteId}-content-types-${timeRange}`);
  
  const types = [
    { type: "image", color: "#3B82F6" },
    { type: "video", color: "#EF4444" },
    { type: "carousel", color: "#8B5CF6" },
    { type: "story", color: "#F59E0B" },
    { type: "reel", color: "#EC4899" },
    { type: "text", color: "#10B981" },
    { type: "link", color: "#6366F1" },
  ];
  
  return types.map(({ type, color }) => {
    const count = Math.floor(random() * 50) + 10;
    const avgImpressions = Math.floor(random() * 15000) + 3000;
    const avgEngagement = Math.floor(avgImpressions * (random() * 0.08 + 0.02));
    
    return {
      type,
      count,
      avgImpressions,
      avgEngagement,
      avgEngagementRate: parseFloat(((avgEngagement / avgImpressions) * 100).toFixed(2)),
      totalImpressions: avgImpressions * count,
      totalEngagements: avgEngagement * count,
      color,
    };
  }).sort((a, b) => b.totalEngagements - a.totalEngagements);
}

// ============================================================================
// AUDIENCE ANALYTICS
// ============================================================================

export async function getAudienceGrowth(
  siteId: string,
  timeRange: SocialTimeRange
): Promise<AudienceGrowth[]> {
  const random = seededRandom(`${siteId}-audience-growth-${timeRange}`);
  const { days } = getDateRange(timeRange);
  const dataPoints = Math.min(days, 30);
  const interval = Math.floor(days / dataPoints);
  
  let currentFollowers = Math.floor(random() * 80000) + 20000;
  const data: AudienceGrowth[] = [];
  
  for (let i = dataPoints - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * interval * 24 * 60 * 60 * 1000);
    const gained = Math.floor(random() * 500) + 50;
    const lost = Math.floor(random() * 150) + 10;
    const netGrowth = gained - lost;
    currentFollowers += netGrowth;
    
    data.push({
      date: date.toISOString().split("T")[0],
      followers: currentFollowers,
      following: Math.floor(currentFollowers * 0.1),
      gained,
      lost,
      netGrowth,
    });
  }
  
  return data;
}

export async function getAudienceDemographics(
  siteId: string,
  timeRange: SocialTimeRange
): Promise<AudienceDemographics> {
  const random = seededRandom(`${siteId}-demographics-${timeRange}`);
  const totalFollowers = Math.floor(random() * 100000) + 50000;
  
  return {
    ageGroups: [
      { range: "13-17", percentage: 5, count: Math.floor(totalFollowers * 0.05) },
      { range: "18-24", percentage: 28, count: Math.floor(totalFollowers * 0.28) },
      { range: "25-34", percentage: 35, count: Math.floor(totalFollowers * 0.35) },
      { range: "35-44", percentage: 18, count: Math.floor(totalFollowers * 0.18) },
      { range: "45-54", percentage: 9, count: Math.floor(totalFollowers * 0.09) },
      { range: "55+", percentage: 5, count: Math.floor(totalFollowers * 0.05) },
    ],
    genders: [
      { gender: "Female", percentage: 54, count: Math.floor(totalFollowers * 0.54) },
      { gender: "Male", percentage: 42, count: Math.floor(totalFollowers * 0.42) },
      { gender: "Other", percentage: 4, count: Math.floor(totalFollowers * 0.04) },
    ],
    topLocations: [
      { location: "United States", percentage: 45, count: Math.floor(totalFollowers * 0.45) },
      { location: "United Kingdom", percentage: 15, count: Math.floor(totalFollowers * 0.15) },
      { location: "Canada", percentage: 10, count: Math.floor(totalFollowers * 0.10) },
      { location: "Australia", percentage: 8, count: Math.floor(totalFollowers * 0.08) },
      { location: "Germany", percentage: 6, count: Math.floor(totalFollowers * 0.06) },
    ],
    topLanguages: [
      { language: "English", percentage: 72, count: Math.floor(totalFollowers * 0.72) },
      { language: "Spanish", percentage: 12, count: Math.floor(totalFollowers * 0.12) },
      { language: "French", percentage: 6, count: Math.floor(totalFollowers * 0.06) },
      { language: "German", percentage: 5, count: Math.floor(totalFollowers * 0.05) },
      { language: "Portuguese", percentage: 5, count: Math.floor(totalFollowers * 0.05) },
    ],
  };
}

export async function getAudienceActivity(
  siteId: string,
  timeRange: SocialTimeRange
): Promise<AudienceActivity[]> {
  const random = seededRandom(`${siteId}-audience-activity-${timeRange}`);
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  return dayNames.map((dayName, dayOfWeek) => ({
    dayOfWeek,
    dayName,
    hours: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      activity: Math.floor(random() * 80) + 10 + 
        (hour >= 9 && hour <= 21 ? 20 : 0) + // Boost during waking hours
        (dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 12 && hour <= 14 ? 15 : 0), // Lunch boost weekdays
    })),
  }));
}

// ============================================================================
// ENGAGEMENT ANALYTICS
// ============================================================================

export async function getEngagementMetrics(
  siteId: string,
  timeRange: SocialTimeRange
): Promise<EngagementMetrics> {
  const random = seededRandom(`${siteId}-engagement-metrics-${timeRange}`);
  
  const totalEngagements = Math.floor(random() * 100000) + 20000;
  const likes = Math.floor(totalEngagements * 0.5);
  const comments = Math.floor(totalEngagements * 0.15);
  const shares = Math.floor(totalEngagements * 0.1);
  const saves = Math.floor(totalEngagements * 0.08);
  const clicks = Math.floor(totalEngagements * 0.12);
  const replies = Math.floor(totalEngagements * 0.05);
  
  return {
    totalEngagements,
    totalEngagementsChange: parseFloat(((random() - 0.3) * 20).toFixed(2)),
    avgEngagementRate: parseFloat((random() * 4 + 2).toFixed(2)),
    avgEngagementRateChange: parseFloat(((random() - 0.4) * 15).toFixed(2)),
    likes,
    likesChange: parseFloat(((random() - 0.3) * 18).toFixed(2)),
    comments,
    commentsChange: parseFloat(((random() - 0.3) * 22).toFixed(2)),
    shares,
    sharesChange: parseFloat(((random() - 0.3) * 25).toFixed(2)),
    saves,
    savesChange: parseFloat(((random() - 0.3) * 20).toFixed(2)),
    clicks,
    clicksChange: parseFloat(((random() - 0.3) * 28).toFixed(2)),
    replies,
    repliesChange: parseFloat(((random() - 0.3) * 15).toFixed(2)),
  };
}

export async function getEngagementTrend(
  siteId: string,
  timeRange: SocialTimeRange
): Promise<EngagementTrend[]> {
  const random = seededRandom(`${siteId}-engagement-trend-${timeRange}`);
  const { days } = getDateRange(timeRange);
  const dataPoints = Math.min(days, 30);
  const interval = Math.floor(days / dataPoints);
  
  const data: EngagementTrend[] = [];
  
  for (let i = dataPoints - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * interval * 24 * 60 * 60 * 1000);
    const baseLikes = Math.floor(random() * 2000) + 500;
    const baseComments = Math.floor(random() * 400) + 50;
    const baseShares = Math.floor(random() * 200) + 30;
    const baseSaves = Math.floor(random() * 150) + 20;
    const baseClicks = Math.floor(random() * 300) + 40;
    
    data.push({
      date: date.toISOString().split("T")[0],
      likes: baseLikes,
      comments: baseComments,
      shares: baseShares,
      saves: baseSaves,
      clicks: baseClicks,
      total: baseLikes + baseComments + baseShares + baseSaves + baseClicks,
    });
  }
  
  return data;
}

export async function getEngagementByType(
  siteId: string,
  timeRange: SocialTimeRange
): Promise<EngagementByType[]> {
  const random = seededRandom(`${siteId}-engagement-type-${timeRange}`);
  
  const types = [
    { type: "Likes", percentage: 50, color: "#EF4444" },
    { type: "Comments", percentage: 15, color: "#3B82F6" },
    { type: "Shares", percentage: 10, color: "#10B981" },
    { type: "Saves", percentage: 8, color: "#F59E0B" },
    { type: "Clicks", percentage: 12, color: "#8B5CF6" },
    { type: "Replies", percentage: 5, color: "#EC4899" },
  ];
  
  const total = Math.floor(random() * 100000) + 20000;
  
  return types.map(({ type, percentage, color }) => ({
    type,
    count: Math.floor(total * (percentage / 100)),
    percentage,
    color,
  }));
}

// ============================================================================
// REACH & IMPRESSIONS
// ============================================================================

export async function getReachMetrics(
  siteId: string,
  timeRange: SocialTimeRange
): Promise<ReachMetrics> {
  const random = seededRandom(`${siteId}-reach-metrics-${timeRange}`);
  
  const totalImpressions = Math.floor(random() * 500000) + 100000;
  const totalReach = Math.floor(totalImpressions * (random() * 0.3 + 0.5));
  const uniqueReach = Math.floor(totalReach * (random() * 0.2 + 0.7));
  
  return {
    totalReach,
    totalReachChange: parseFloat(((random() - 0.3) * 20).toFixed(2)),
    totalImpressions,
    totalImpressionsChange: parseFloat(((random() - 0.3) * 18).toFixed(2)),
    uniqueReach,
    uniqueReachChange: parseFloat(((random() - 0.3) * 15).toFixed(2)),
    avgReachPerPost: Math.floor(totalReach / (random() * 50 + 20)),
    avgReachPerPostChange: parseFloat(((random() - 0.4) * 12).toFixed(2)),
    avgImpressionsPerPost: Math.floor(totalImpressions / (random() * 50 + 20)),
    avgImpressionsPerPostChange: parseFloat(((random() - 0.4) * 14).toFixed(2)),
    viralReach: Math.floor(totalReach * (random() * 0.15 + 0.05)),
    viralReachChange: parseFloat(((random() - 0.3) * 30).toFixed(2)),
    organicReach: Math.floor(totalReach * (random() * 0.4 + 0.4)),
    organicReachChange: parseFloat(((random() - 0.3) * 12).toFixed(2)),
    paidReach: Math.floor(totalReach * (random() * 0.3 + 0.1)),
    paidReachChange: parseFloat(((random() - 0.3) * 25).toFixed(2)),
  };
}

export async function getReachTrend(
  siteId: string,
  timeRange: SocialTimeRange
): Promise<ReachTrend[]> {
  const random = seededRandom(`${siteId}-reach-trend-${timeRange}`);
  const { days } = getDateRange(timeRange);
  const dataPoints = Math.min(days, 30);
  const interval = Math.floor(days / dataPoints);
  
  const data: ReachTrend[] = [];
  
  for (let i = dataPoints - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * interval * 24 * 60 * 60 * 1000);
    const impressions = Math.floor(random() * 20000) + 5000;
    const reach = Math.floor(impressions * (random() * 0.3 + 0.5));
    
    data.push({
      date: date.toISOString().split("T")[0],
      reach,
      impressions,
      organic: Math.floor(reach * (random() * 0.3 + 0.5)),
      paid: Math.floor(reach * (random() * 0.2 + 0.1)),
      viral: Math.floor(reach * (random() * 0.15 + 0.05)),
    });
  }
  
  return data;
}

export async function getReachByPlatform(
  siteId: string,
  timeRange: SocialTimeRange
): Promise<ReachByPlatform[]> {
  const random = seededRandom(`${siteId}-reach-platform-${timeRange}`);
  
  const totalReach = Math.floor(random() * 500000) + 100000;
  const totalImpressions = Math.floor(totalReach * (random() * 0.5 + 1.2));
  
  const data: ReachByPlatform[] = PLATFORMS.map(platform => {
    const percentage = random() * 25 + 5;
    return {
      platform,
      reach: Math.floor(totalReach * (percentage / 100)),
      impressions: Math.floor(totalImpressions * (percentage / 100)),
      percentage: parseFloat(percentage.toFixed(1)),
      color: PLATFORM_COLORS[platform] || "#6B7280",
    };
  });
  
  // Normalize percentages to 100
  const totalPercentage = data.reduce((sum, d) => sum + d.percentage, 0);
  return data.map(d => ({
    ...d,
    percentage: parseFloat(((d.percentage / totalPercentage) * 100).toFixed(1)),
  })).sort((a, b) => b.reach - a.reach);
}

// ============================================================================
// POSTING ANALYTICS
// ============================================================================

export async function getPostingMetrics(
  siteId: string,
  timeRange: SocialTimeRange
): Promise<PostingMetrics> {
  const random = seededRandom(`${siteId}-posting-metrics-${timeRange}`);
  const { days } = getDateRange(timeRange);
  
  const totalPosts = Math.floor(random() * 200) + 50;
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  return {
    totalPosts,
    totalPostsChange: parseFloat(((random() - 0.3) * 20).toFixed(2)),
    postsPublished: Math.floor(totalPosts * 0.85),
    postsScheduled: Math.floor(totalPosts * 0.1),
    postsDraft: Math.floor(totalPosts * 0.05),
    avgPostsPerDay: parseFloat((totalPosts / days).toFixed(2)),
    avgPostsPerDayChange: parseFloat(((random() - 0.4) * 15).toFixed(2)),
    mostActiveDay: daysOfWeek[Math.floor(random() * 7)],
    mostActiveHour: Math.floor(random() * 14) + 8, // 8 AM to 10 PM
    publishSuccessRate: parseFloat((random() * 5 + 94).toFixed(1)),
  };
}

export async function getPostingTrend(
  siteId: string,
  timeRange: SocialTimeRange
): Promise<PostingTrend[]> {
  const random = seededRandom(`${siteId}-posting-trend-${timeRange}`);
  const { days } = getDateRange(timeRange);
  const dataPoints = Math.min(days, 30);
  const interval = Math.floor(days / dataPoints);
  
  const data: PostingTrend[] = [];
  
  for (let i = dataPoints - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * interval * 24 * 60 * 60 * 1000);
    const posts = Math.floor(random() * 10) + 1;
    const published = Math.floor(posts * (random() * 0.15 + 0.8));
    const scheduled = Math.floor((posts - published) * 0.7);
    const failed = posts - published - scheduled;
    
    data.push({
      date: date.toISOString().split("T")[0],
      posts,
      scheduled,
      published,
      failed: Math.max(0, failed),
    });
  }
  
  return data;
}

export async function getPostingByPlatform(
  siteId: string,
  timeRange: SocialTimeRange
): Promise<PostingByPlatform[]> {
  const random = seededRandom(`${siteId}-posting-platform-${timeRange}`);
  
  const totalPosts = Math.floor(random() * 200) + 50;
  
  const data: PostingByPlatform[] = PLATFORMS.map(platform => {
    const percentage = random() * 25 + 5;
    return {
      platform,
      posts: Math.floor(totalPosts * (percentage / 100)),
      percentage: parseFloat(percentage.toFixed(1)),
      avgEngagement: Math.floor(random() * 500) + 100,
      color: PLATFORM_COLORS[platform] || "#6B7280",
    };
  });
  
  const totalPercentage = data.reduce((sum, d) => sum + d.percentage, 0);
  return data.map(d => ({
    ...d,
    percentage: parseFloat(((d.percentage / totalPercentage) * 100).toFixed(1)),
  })).sort((a, b) => b.posts - a.posts);
}

// ============================================================================
// OPTIMAL TIMES
// ============================================================================

export async function getOptimalTimes(
  siteId: string,
  timeRange: SocialTimeRange
): Promise<OptimalTime[]> {
  const random = seededRandom(`${siteId}-optimal-times-${timeRange}`);
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  const times: OptimalTime[] = [];
  
  for (let day = 0; day < 7; day++) {
    const numSlots = Math.floor(random() * 3) + 2;
    for (let s = 0; s < numSlots; s++) {
      const hour = Math.floor(random() * 14) + 8; // 8 AM to 10 PM
      const score = Math.floor(random() * 40) + 60;
      
      times.push({
        dayOfWeek: day,
        dayName: dayNames[day],
        hour,
        timeLabel: `${hour.toString().padStart(2, "0")}:00`,
        score,
        avgEngagement: Math.floor(random() * 1000) + 200,
        avgReach: Math.floor(random() * 5000) + 1000,
      });
    }
  }
  
  return times.sort((a, b) => b.score - a.score).slice(0, 10);
}

export async function getHeatmapData(
  siteId: string,
  timeRange: SocialTimeRange
): Promise<HeatmapData[]> {
  const random = seededRandom(`${siteId}-heatmap-${timeRange}`);
  
  const data: HeatmapData[] = [];
  
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      // Higher values during business hours on weekdays
      const isWeekday = day >= 1 && day <= 5;
      const isBusinessHours = hour >= 9 && hour <= 18;
      const isLunchTime = hour >= 12 && hour <= 13;
      const isEvening = hour >= 19 && hour <= 21;
      
      let baseValue = Math.floor(random() * 30) + 10;
      
      if (isWeekday && isBusinessHours) baseValue += 30;
      if (isLunchTime) baseValue += 15;
      if (isEvening) baseValue += 20;
      if (!isWeekday && hour >= 10 && hour <= 20) baseValue += 25;
      
      data.push({
        dayOfWeek: day,
        hour,
        value: Math.min(100, baseValue),
      });
    }
  }
  
  return data;
}

// ============================================================================
// HASHTAG ANALYTICS
// ============================================================================

export async function getHashtagMetrics(
  siteId: string,
  timeRange: SocialTimeRange,
  limit: number = 10
): Promise<HashtagMetrics[]> {
  const random = seededRandom(`${siteId}-hashtags-${timeRange}`);
  
  const hashtags = [
    "marketing", "business", "socialmedia", "digitalmarketing", "entrepreneur",
    "success", "motivation", "branding", "startup", "growth",
    "content", "strategy", "innovation", "tech", "leadership",
  ];
  
  return hashtags.slice(0, limit).map(hashtag => {
    const usageCount = Math.floor(random() * 50) + 5;
    const totalImpressions = Math.floor(random() * 100000) + 10000;
    const totalEngagements = Math.floor(totalImpressions * (random() * 0.08 + 0.02));
    
    return {
      hashtag: `#${hashtag}`,
      usageCount,
      totalImpressions,
      totalEngagements,
      avgEngagementRate: parseFloat(((totalEngagements / totalImpressions) * 100).toFixed(2)),
      reach: Math.floor(totalImpressions * (random() * 0.3 + 0.5)),
      trending: random() > 0.7,
    };
  }).sort((a, b) => b.totalEngagements - a.totalEngagements);
}

// ============================================================================
// STORY ANALYTICS
// ============================================================================

export async function getStoryMetrics(
  siteId: string,
  timeRange: SocialTimeRange
): Promise<StoryMetrics> {
  const random = seededRandom(`${siteId}-story-metrics-${timeRange}`);
  
  const totalStories = Math.floor(random() * 100) + 20;
  const avgViews = Math.floor(random() * 5000) + 1000;
  
  return {
    totalStories,
    totalStoriesChange: parseFloat(((random() - 0.3) * 25).toFixed(2)),
    avgViews,
    avgViewsChange: parseFloat(((random() - 0.3) * 20).toFixed(2)),
    avgCompletionRate: parseFloat((random() * 30 + 60).toFixed(1)),
    avgCompletionRateChange: parseFloat(((random() - 0.4) * 10).toFixed(2)),
    totalReplies: Math.floor(random() * 500) + 50,
    totalRepliesChange: parseFloat(((random() - 0.3) * 30).toFixed(2)),
    totalTaps: Math.floor(random() * 2000) + 200,
    totalTapsChange: parseFloat(((random() - 0.3) * 22).toFixed(2)),
    exitRate: parseFloat((random() * 20 + 10).toFixed(1)),
    exitRateChange: parseFloat(((random() - 0.5) * 15).toFixed(2)),
  };
}

export async function getStoryPerformance(
  siteId: string,
  timeRange: SocialTimeRange,
  limit: number = 10
): Promise<StoryPerformance[]> {
  const random = seededRandom(`${siteId}-story-performance-${timeRange}`);
  const { days } = getDateRange(timeRange);
  
  const stories: StoryPerformance[] = [];
  
  for (let i = 0; i < limit; i++) {
    const platform = ["instagram", "facebook"][Math.floor(random() * 2)];
    const daysAgo = Math.floor(random() * Math.min(days, 7));
    const postedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const views = Math.floor(random() * 8000) + 1000;
    
    stories.push({
      storyId: `story-${i + 1}-${siteId.slice(0, 8)}`,
      platform,
      postedAt: postedAt.toISOString(),
      views,
      completionRate: parseFloat((random() * 35 + 55).toFixed(1)),
      replies: Math.floor(random() * 50) + 5,
      tapsForward: Math.floor(views * (random() * 0.2 + 0.1)),
      tapsBack: Math.floor(views * (random() * 0.1 + 0.02)),
      exits: Math.floor(views * (random() * 0.15 + 0.05)),
      externalTaps: Math.floor(random() * 100) + 10,
    });
  }
  
  return stories.sort((a, b) => b.views - a.views);
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
  };
}
