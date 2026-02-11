/**
 * Social Media Module - Types
 * 
 * Phase EM-54: Social Media Management Module
 * Comprehensive type definitions for Hootsuite + Sprout Social style management
 */

// ============================================================================
// PLATFORM TYPES
// ============================================================================

export type SocialPlatform = 
  | 'facebook' 
  | 'instagram' 
  | 'twitter' 
  | 'linkedin' 
  | 'tiktok' 
  | 'youtube' 
  | 'pinterest' 
  | 'threads' 
  | 'bluesky' 
  | 'mastodon'

export type AccountType = 'profile' | 'page' | 'business' | 'creator' | 'group'

export type AccountStatus = 
  | 'active' 
  | 'expired' 
  | 'disconnected' 
  | 'error' 
  | 'rate_limited' 
  | 'pending'

export interface SocialAccount {
  id: string
  siteId: string
  tenantId: string
  platform: SocialPlatform
  platformAccountId: string
  accountType: AccountType
  accountName: string
  accountHandle: string | null
  accountAvatar: string | null
  accountUrl: string | null
  accountBio: string | null
  accessToken: string
  refreshToken: string | null
  tokenExpiresAt: string | null
  scopes: string[]
  status: AccountStatus
  healthScore: number
  lastError: string | null
  lastErrorAt: string | null
  lastSyncedAt: string | null
  followersCount: number
  followingCount: number
  postsCount: number
  engagementRate: number
  settings: Record<string, unknown>
  autoReplyEnabled: boolean
  monitoringEnabled: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

// ============================================================================
// CONTENT TYPES
// ============================================================================

export type PostStatus = 
  | 'draft' 
  | 'pending_approval' 
  | 'approved' 
  | 'rejected'
  | 'scheduled' 
  | 'publishing' 
  | 'published' 
  | 'partially_published' 
  | 'failed' 
  | 'deleted' 
  | 'archived'

export type MediaType = 'image' | 'video' | 'gif' | 'carousel' | 'audio'

export interface PostMedia {
  id: string
  type: MediaType
  url: string
  thumbnailUrl?: string
  altText?: string
  dimensions?: { width: number; height: number }
  duration?: number
}

export interface LinkPreview {
  title: string
  description: string
  image: string
  domain: string
}

export interface PlatformContent {
  content: string
  media?: PostMedia[]
  thread?: string[] // For Twitter threads
  firstComment?: string // For Instagram
}

export interface SocialPost {
  id: string
  siteId: string
  tenantId: string
  accountId: string // Primary account for single-account posts
  content: string
  contentHtml: string | null
  media: PostMedia[]
  linkUrl: string | null
  linkPreview: LinkPreview | null
  platformContent: Record<SocialPlatform, PlatformContent>
  targetAccounts: string[]
  targetAudiences: unknown[]
  status: PostStatus
  scheduledAt: string | null
  publishedAt: string | null
  timezone: string
  publishResults: Record<string, PublishResult>
  queuePosition: number | null
  optimalTimeSuggested: string | null
  requiresApproval: boolean
  approvalWorkflowId: string | null
  approvedBy: string | null
  approvedAt: string | null
  rejectionReason: string | null
  labels: string[]
  campaignId: string | null
  contentPillar: string | null
  aiGenerated: boolean
  aiSuggestions: Record<string, unknown>
  sentimentScore: number | null
  totalImpressions: number
  totalEngagement: number
  totalClicks: number
  createdBy: string
  createdAt: string
  updatedAt: string
  firstComment: string | null
  firstCommentDelayMinutes: number
}

export interface PublishResult {
  platformPostId: string
  url: string
  status: 'pending' | 'success' | 'failed' | 'partial'
  error?: string
  publishedAt?: string
}

export interface PublishLog {
  id: string
  postId: string
  accountId: string
  status: 'pending' | 'success' | 'failed' | 'partial'
  platformPostId: string | null
  platformUrl: string | null
  errorMessage: string | null
  errorCode: string | null
  scheduledFor: string | null
  attemptedAt: string
  completedAt: string | null
  retryCount: number
  maxRetries: number
  nextRetryAt: string | null
  createdAt: string
}

// ============================================================================
// QUEUE & SCHEDULING
// ============================================================================

export interface TimeSlot {
  day: number // 0-6 (Sunday-Saturday)
  time: string // "HH:MM"
  timezone: string
}

export interface ContentQueue {
  id: string
  siteId: string
  accountId: string
  name: string
  isActive: boolean
  postsPerDay: number
  timeSlots: TimeSlot[]
  nextAvailableSlot: string | null
  createdAt: string
  updatedAt: string
}

export interface HashtagGroup {
  id: string
  siteId: string
  tenantId: string
  name: string
  hashtags: string[]
  category: string | null
  usageCount: number
  avgEngagement: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

// ============================================================================
// CAMPAIGNS & CALENDAR
// ============================================================================

export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'archived'

export interface CampaignGoals {
  impressions?: number
  engagement?: number
  clicks?: number
  followers?: number
  conversions?: number
}

export interface Campaign {
  id: string
  siteId: string
  tenantId: string
  name: string
  description: string | null
  color: string
  startDate: string
  endDate: string | null
  goals: CampaignGoals
  budget: number | null
  budgetSpent: number
  hashtags: string[]
  utmSource: string
  utmMedium: string | null
  utmCampaign: string | null
  totalPosts: number
  totalImpressions: number
  totalEngagement: number
  totalClicks: number
  totalConversions: number
  status: CampaignStatus
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type CalendarEventType = 
  | 'custom' 
  | 'holiday' 
  | 'awareness_day' 
  | 'campaign' 
  | 'launch' 
  | 'milestone' 
  | 'content_theme' 
  | 'meeting'

export interface CalendarEvent {
  id: string
  siteId: string
  tenantId: string
  title: string
  description: string | null
  color: string
  startDate: string
  endDate: string | null
  startTime: string | null
  allDay: boolean
  isRecurring: boolean
  recurrenceRule: string | null
  eventType: CalendarEventType
  campaignId: string | null
  postIds: string[]
  notes: unknown[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface ContentPillar {
  id: string
  siteId: string
  tenantId: string
  name: string
  description: string | null
  color: string
  icon: string | null
  targetPercentage: number
  keywords: string[]
  exampleTopics: string[]
  postCount: number
  avgEngagement: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ============================================================================
// MEDIA LIBRARY
// ============================================================================

export type MediaFileType = 'image' | 'video' | 'gif' | 'audio'
export type MediaSource = 'upload' | 'canva' | 'stock' | 'ai_generated' | 'import'

export interface PlatformMediaStatus {
  valid: boolean
  error?: string
  dimensions?: { width: number; height: number }
  fileSize?: number
}

export interface MediaLibraryItem {
  id: string
  siteId: string
  tenantId: string
  fileName: string
  fileType: MediaFileType
  fileSize: number
  mimeType: string
  originalUrl: string
  thumbnailUrl: string | null
  optimizedUrls: Record<string, string>
  width: number | null
  height: number | null
  durationSeconds: number | null
  aspectRatio: string | null
  folderId: string | null
  tags: string[]
  altText: string | null
  caption: string | null
  platformStatus: Record<SocialPlatform, PlatformMediaStatus>
  aiTags: string[]
  aiDescription: string | null
  facesDetected: number | null
  dominantColors: string[]
  usedInPosts: string[]
  usageCount: number
  source: MediaSource
  sourceUrl: string | null
  uploadedBy: string
  createdAt: string
  updatedAt: string
}

export interface MediaFolder {
  id: string
  siteId: string
  tenantId: string
  name: string
  parentId: string | null
  color: string | null
  createdBy: string
  createdAt: string
}

// ============================================================================
// ANALYTICS
// ============================================================================

export interface AnalyticsOverview {
  totalFollowers: number
  totalImpressions: number
  totalEngagements: number
  totalClicks: number
  avgEngagementRate: number
  followerGrowth: number
  impressionChange: number
  engagementChange: number
  topPosts: Array<{
    postId: string
    impressions: number
    engagements: number
  }>
  platformBreakdown: Record<SocialPlatform, {
    followers: number
    impressions: number
    engagements: number
  }>
}

export interface DailyAnalytics {
  id: string
  accountId: string
  date: string
  followersCount: number | null
  followersGained: number
  followersLost: number
  followingCount: number | null
  postsPublished: number
  impressions: number
  reach: number
  engagementTotal: number
  likes: number
  comments: number
  shares: number
  saves: number
  clicks: number
  engagementRate: number
  videoViews: number
  videoWatchTimeSeconds: number
  videoCompletionRate: number | null
  storiesPosted: number
  storiesViews: number
  reelsPosted: number
  reelsPlays: number
  profileViews: number
  websiteClicks: number
  emailClicks: number
  phoneClicks: number
  audienceDemographics: Record<string, unknown>
  createdAt: string
}

export interface PostAnalytics {
  id: string
  postId: string
  accountId: string
  platformPostId: string | null
  impressions: number
  reach: number
  engagementTotal: number
  likes: number
  comments: number
  shares: number
  saves: number
  clicks: number
  engagementRate: number
  videoViews: number
  video3sViews: number
  avgWatchTimeSeconds: number | null
  videoCompletionRate: number | null
  linkClicks: number
  ctr: number
  newFollowersFromPost: number
  bestPerformingHour: number | null
  sentimentPositive: number
  sentimentNeutral: number
  sentimentNegative: number
  lastSyncedAt: string
}

export interface Competitor {
  id: string
  siteId: string
  tenantId: string
  name: string
  platform: SocialPlatform
  platformHandle: string
  platformId: string | null
  avatarUrl: string | null
  isActive: boolean
  lastSyncedAt: string | null
  followersCount: number
  followingCount: number
  postsCount: number
  avgEngagementRate: number
  postingFrequency: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface OptimalTime {
  id: string
  accountId: string
  dayOfWeek: number
  hour: number
  engagementScore: number
  reachScore: number
  combinedScore: number
  sampleSize: number
  confidence: number
  updatedAt: string
}

// ============================================================================
// INBOX & ENGAGEMENT
// ============================================================================

export type InboxItemType = 
  | 'comment' 
  | 'message' 
  | 'mention' 
  | 'review' 
  | 'reaction'
  | 'dm' 
  | 'story_mention' 
  | 'story_reply'

export type InboxItemStatus = 'new' | 'read' | 'replied' | 'archived' | 'spam' | 'flagged'
export type InboxPriority = 'low' | 'normal' | 'high' | 'urgent'
export type Sentiment = 'positive' | 'neutral' | 'negative'

export interface InboxReply {
  content: string
  repliedAt: string
  repliedBy?: string
}

export interface InboxItem {
  id: string
  siteId: string
  accountId: string
  // Convenience aliases for UI components
  type: InboxItemType
  itemType: InboxItemType
  isRead: boolean
  isFlagged: boolean
  receivedAt: string
  postContent: string | null
  replies: InboxReply[]
  // Original fields
  platformItemId: string
  platformParentId: string | null
  relatedPostId: string | null
  content: string | null
  mediaUrl: string | null
  authorId: string | null
  authorName: string | null
  authorHandle: string | null
  authorAvatar: string | null
  authorFollowers: number | null
  status: InboxItemStatus
  priority: InboxPriority
  assignedTo: string | null
  assignedAt: string | null
  responseText: string | null
  responseAt: string | null
  responseBy: string | null
  responseTimeSeconds: number | null
  sentiment: Sentiment | null
  sentimentScore: number | null
  tags: string[]
  platformCreatedAt: string
  createdAt: string
  updatedAt: string
}

export interface SavedReply {
  id: string
  siteId: string
  tenantId: string
  name: string
  content: string
  category: string | null
  shortcut: string | null
  usageCount: number
  lastUsedAt: string | null
  isShared: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

// ============================================================================
// BRAND MENTIONS & LISTENING
// ============================================================================

export type MentionStatus = 'new' | 'reviewed' | 'engaged' | 'archived' | 'irrelevant'

export interface BrandMention {
  id: string
  siteId: string
  tenantId: string
  platform: SocialPlatform
  platformPostId: string
  postUrl: string | null
  content: string | null
  authorHandle: string | null
  authorName: string | null
  authorFollowers: number | null
  matchedKeywords: string[]
  sentiment: Sentiment | null
  sentimentScore: number | null
  engagement: number
  reach: number
  status: MentionStatus
  mentionedAt: string
  createdAt: string
}

export type KeywordType = 'brand' | 'product' | 'competitor' | 'industry' | 'hashtag'

export interface ListeningKeyword {
  id: string
  siteId: string
  tenantId: string
  keyword: string
  keywordType: KeywordType
  isActive: boolean
  mentionsCount: number
  lastMentionAt: string | null
  createdAt: string
}

// ============================================================================
// TEAM & PERMISSIONS
// ============================================================================

export type TeamRole = 'admin' | 'manager' | 'publisher' | 'creator' | 'viewer'

export interface TeamPermission {
  id: string
  siteId: string
  userId: string
  role: TeamRole
  canManageAccounts: boolean
  canConnectAccounts: boolean
  canCreatePosts: boolean
  canEditAllPosts: boolean
  canSchedulePosts: boolean
  canPublishPosts: boolean
  canApprovePosts: boolean
  canDeletePosts: boolean
  canViewAnalytics: boolean
  canExportData: boolean
  canManageInbox: boolean
  canRespondInbox: boolean
  canManageCampaigns: boolean
  canManageTeam: boolean
  canUseAiFeatures: boolean
  allowedAccounts: string[]
  restrictedAccounts: string[]
  createdAt: string
  updatedAt: string
}

export type ApprovalStepType = 'any' | 'all'

export interface ApprovalStep {
  order: number
  approvers: string[]
  type: ApprovalStepType
  timeoutHours: number
}

export interface ApprovalWorkflow {
  id: string
  siteId: string
  tenantId: string
  name: string
  description: string | null
  isActive: boolean
  isDefault: boolean
  triggerConditions: {
    platforms?: SocialPlatform[]
    containsKeywords?: string[]
    campaignIds?: string[]
    always?: boolean
  }
  steps: ApprovalStep[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type ApprovalRequestStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled'

export interface ApprovalRequest {
  id: string
  workflowId: string
  postId: string
  status: ApprovalRequestStatus
  currentStep: number
  decidedBy: string | null
  decidedAt: string | null
  decisionNotes: string | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

// ============================================================================
// REPORTS
// ============================================================================

export type ReportType = 
  | 'performance' 
  | 'engagement' 
  | 'audience' 
  | 'competitor' 
  | 'campaign' 
  | 'team' 
  | 'custom'

export type ReportFrequency = 'daily' | 'weekly' | 'monthly'

export interface Report {
  id: string
  siteId: string
  tenantId: string
  name: string
  description: string | null
  reportType: ReportType
  metrics: string[]
  filters: Record<string, unknown>
  dateRangeType: string
  accountIds: string[]
  isScheduled: boolean
  scheduleFrequency: ReportFrequency | null
  scheduleDay: number | null
  scheduleTime: string | null
  scheduleRecipients: string[]
  lastGeneratedAt: string | null
  lastSentAt: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

// ============================================================================
// AI FEATURES
// ============================================================================

export type ContentIdeaStatus = 'new' | 'saved' | 'used' | 'rejected'

export interface AIContentIdea {
  id: string
  siteId: string
  tenantId: string
  title: string
  content: string | null
  platforms: SocialPlatform[]
  prompt: string | null
  contentPillar: string | null
  campaignId: string | null
  status: ContentIdeaStatus
  suggestedDate: string | null
  createdAt: string
}

export interface AICaption {
  content: string
  hashtags: string[]
  emojiLevel: 'none' | 'low' | 'medium' | 'high'
  tone: string
}

export interface AICaptionGeneration {
  id: string
  siteId: string
  prompt: string | null
  mediaUrl: string | null
  platform: SocialPlatform | null
  captions: AICaption[]
  selectedIndex: number | null
  createdAt: string
}

// ============================================================================
// PLATFORM CONFIGS
// ============================================================================

export interface PlatformConfig {
  name: string
  icon: string
  color: string
  characterLimit: number
  mediaTypes: MediaType[]
  maxImages: number
  maxVideoLength: number
  features: string[]
  requiresBusinessAccount?: boolean
}

export const PLATFORM_CONFIGS: Record<SocialPlatform, PlatformConfig> = {
  facebook: {
    name: 'Facebook',
    icon: 'Fb',
    color: '#1877F2',
    characterLimit: 63206,
    mediaTypes: ['image', 'video', 'gif', 'carousel'],
    maxImages: 10,
    maxVideoLength: 240 * 60, // 4 hours
    features: ['posts', 'stories', 'reels', 'events', 'groups'],
  },
  instagram: {
    name: 'Instagram',
    icon: 'Ig',
    color: '#E4405F',
    characterLimit: 2200,
    mediaTypes: ['image', 'video', 'carousel'],
    maxImages: 10,
    maxVideoLength: 60 * 60, // 1 hour for IGTV
    features: ['posts', 'stories', 'reels', 'first_comment'],
    requiresBusinessAccount: true,
  },
  twitter: {
    name: 'X (Twitter)',
    icon: 'Tw',
    color: '#000000',
    characterLimit: 280,
    mediaTypes: ['image', 'video', 'gif'],
    maxImages: 4,
    maxVideoLength: 140, // 2:20
    features: ['posts', 'threads', 'polls'],
  },
  linkedin: {
    name: 'LinkedIn',
    icon: 'Li',
    color: '#0A66C2',
    characterLimit: 3000,
    mediaTypes: ['image', 'video', 'carousel'],
    maxImages: 20,
    maxVideoLength: 10 * 60, // 10 minutes
    features: ['posts', 'articles', 'documents'],
  },
  tiktok: {
    name: 'TikTok',
    icon: 'Tt',
    color: '#000000',
    characterLimit: 2200,
    mediaTypes: ['video'],
    maxImages: 0,
    maxVideoLength: 10 * 60, // 10 minutes
    features: ['videos'],
    requiresBusinessAccount: true,
  },
  youtube: {
    name: 'YouTube',
    icon: 'Yt',
    color: '#FF0000',
    characterLimit: 5000,
    mediaTypes: ['video'],
    maxImages: 0,
    maxVideoLength: 12 * 60 * 60, // 12 hours
    features: ['videos', 'shorts', 'community'],
  },
  pinterest: {
    name: 'Pinterest',
    icon: 'Pi',
    color: '#E60023',
    characterLimit: 500,
    mediaTypes: ['image', 'video'],
    maxImages: 1,
    maxVideoLength: 60,
    features: ['pins', 'idea_pins'],
  },
  threads: {
    name: 'Threads',
    icon: 'Th',
    color: '#000000',
    characterLimit: 500,
    mediaTypes: ['image', 'video'],
    maxImages: 10,
    maxVideoLength: 300,
    features: ['posts'],
  },
  bluesky: {
    name: 'Bluesky',
    icon: 'Bs',
    color: '#0085FF',
    characterLimit: 300,
    mediaTypes: ['image'],
    maxImages: 4,
    maxVideoLength: 0,
    features: ['posts'],
  },
  mastodon: {
    name: 'Mastodon',
    icon: 'Ms',
    color: '#6364FF',
    characterLimit: 500,
    mediaTypes: ['image', 'video', 'audio'],
    maxImages: 4,
    maxVideoLength: 60,
    features: ['posts'],
  },
}
