/**
 * Social Media Analytics Types
 * 
 * PHASE-DS-03B: Social Analytics Dashboard
 * Type definitions for social media analytics components
 */

// ============================================================================
// TIME RANGE TYPES
// ============================================================================

export type SocialTimeRange = "7d" | "14d" | "30d" | "90d" | "12m" | "1y" | "all";

// ============================================================================
// PLATFORM METRICS
// ============================================================================

export interface PlatformMetrics {
  platform: string;
  followers: number;
  followersChange: number;
  impressions: number;
  impressionsChange: number;
  engagements: number;
  engagementsChange: number;
  clicks: number;
  clicksChange: number;
  engagementRate: number;
  color: string;
}

export interface PlatformOverview {
  platforms: PlatformMetrics[];
  totalFollowers: number;
  totalFollowersChange: number;
  totalImpressions: number;
  totalImpressionsChange: number;
  totalEngagements: number;
  totalEngagementsChange: number;
  totalClicks: number;
  totalClicksChange: number;
  avgEngagementRate: number;
  avgEngagementRateChange: number;
  activePlatforms: number;
}

// ============================================================================
// CONTENT PERFORMANCE
// ============================================================================

export interface ContentPerformance {
  postId: string;
  platform: string;
  content: string;
  contentType: "image" | "video" | "carousel" | "text" | "link" | "story" | "reel";
  publishedAt: string;
  impressions: number;
  engagements: number;
  engagementRate: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  reach: number;
  videoViews?: number;
}

export interface ContentTypeMetrics {
  type: string;
  count: number;
  avgImpressions: number;
  avgEngagement: number;
  avgEngagementRate: number;
  totalImpressions: number;
  totalEngagements: number;
  color: string;
}

// ============================================================================
// AUDIENCE ANALYTICS
// ============================================================================

export interface AudienceGrowth {
  date: string;
  followers: number;
  following: number;
  gained: number;
  lost: number;
  netGrowth: number;
}

export interface AudienceDemographics {
  ageGroups: Array<{
    range: string;
    percentage: number;
    count: number;
  }>;
  genders: Array<{
    gender: string;
    percentage: number;
    count: number;
  }>;
  topLocations: Array<{
    location: string;
    percentage: number;
    count: number;
  }>;
  topLanguages: Array<{
    language: string;
    percentage: number;
    count: number;
  }>;
}

export interface AudienceActivity {
  dayOfWeek: number;
  dayName: string;
  hours: Array<{
    hour: number;
    activity: number;
  }>;
}

// ============================================================================
// ENGAGEMENT ANALYTICS
// ============================================================================

export interface EngagementMetrics {
  totalEngagements: number;
  totalEngagementsChange: number;
  avgEngagementRate: number;
  avgEngagementRateChange: number;
  likes: number;
  likesChange: number;
  comments: number;
  commentsChange: number;
  shares: number;
  sharesChange: number;
  saves: number;
  savesChange: number;
  clicks: number;
  clicksChange: number;
  replies: number;
  repliesChange: number;
}

export interface EngagementTrend {
  date: string;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  total: number;
}

export interface EngagementByType {
  type: string;
  count: number;
  percentage: number;
  color: string;
}

// ============================================================================
// REACH & IMPRESSIONS
// ============================================================================

export interface ReachMetrics {
  totalReach: number;
  totalReachChange: number;
  totalImpressions: number;
  totalImpressionsChange: number;
  uniqueReach: number;
  uniqueReachChange: number;
  avgReachPerPost: number;
  avgReachPerPostChange: number;
  avgImpressionsPerPost: number;
  avgImpressionsPerPostChange: number;
  viralReach: number;
  viralReachChange: number;
  organicReach: number;
  organicReachChange: number;
  paidReach: number;
  paidReachChange: number;
}

export interface ReachTrend {
  date: string;
  reach: number;
  impressions: number;
  organic: number;
  paid: number;
  viral: number;
}

export interface ReachByPlatform {
  platform: string;
  reach: number;
  impressions: number;
  percentage: number;
  color: string;
}

// ============================================================================
// POSTING ANALYTICS
// ============================================================================

export interface PostingMetrics {
  totalPosts: number;
  totalPostsChange: number;
  postsPublished: number;
  postsScheduled: number;
  postsDraft: number;
  avgPostsPerDay: number;
  avgPostsPerDayChange: number;
  mostActiveDay: string;
  mostActiveHour: number;
  publishSuccessRate: number;
}

export interface PostingTrend {
  date: string;
  posts: number;
  scheduled: number;
  published: number;
  failed: number;
}

export interface PostingByPlatform {
  platform: string;
  posts: number;
  percentage: number;
  avgEngagement: number;
  color: string;
}

// ============================================================================
// BEST TIMES & SCHEDULING
// ============================================================================

export interface OptimalTime {
  dayOfWeek: number;
  dayName: string;
  hour: number;
  timeLabel: string;
  score: number;
  avgEngagement: number;
  avgReach: number;
}

export interface HeatmapData {
  dayOfWeek: number;
  hour: number;
  value: number;
}

// ============================================================================
// HASHTAG ANALYTICS
// ============================================================================

export interface HashtagMetrics {
  hashtag: string;
  usageCount: number;
  totalImpressions: number;
  totalEngagements: number;
  avgEngagementRate: number;
  reach: number;
  trending: boolean;
}

// ============================================================================
// STORY ANALYTICS
// ============================================================================

export interface StoryMetrics {
  totalStories: number;
  totalStoriesChange: number;
  avgViews: number;
  avgViewsChange: number;
  avgCompletionRate: number;
  avgCompletionRateChange: number;
  totalReplies: number;
  totalRepliesChange: number;
  totalTaps: number;
  totalTapsChange: number;
  exitRate: number;
  exitRateChange: number;
}

export interface StoryPerformance {
  storyId: string;
  platform: string;
  postedAt: string;
  views: number;
  completionRate: number;
  replies: number;
  tapsForward: number;
  tapsBack: number;
  exits: number;
  externalTaps: number;
}

// ============================================================================
// COMPETITOR ANALYTICS
// ============================================================================

export interface CompetitorMetrics {
  competitorId: string;
  name: string;
  platform: string;
  followers: number;
  followersChange: number;
  avgEngagementRate: number;
  postsPerWeek: number;
  topContentTypes: string[];
}

// ============================================================================
// COMBINED ANALYTICS
// ============================================================================

export interface SocialAnalyticsData {
  platformOverview: PlatformOverview;
  engagementMetrics: EngagementMetrics;
  reachMetrics: ReachMetrics;
  postingMetrics: PostingMetrics;
  topContent: ContentPerformance[];
  contentTypeMetrics: ContentTypeMetrics[];
  audienceGrowth: AudienceGrowth[];
  engagementTrend: EngagementTrend[];
  reachTrend: ReachTrend[];
  optimalTimes: OptimalTime[];
  hashtagMetrics: HashtagMetrics[];
  storyMetrics?: StoryMetrics;
  timeRange: SocialTimeRange;
  lastUpdated: string;
}
