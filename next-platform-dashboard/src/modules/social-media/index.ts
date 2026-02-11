/**
 * Social Media Module - Index
 * 
 * Phase EM-54: Social Media Management Module
 * Comprehensive social media management like Hootsuite + Sprout Social
 */

// ============================================================================
// MODULE MANIFEST
// ============================================================================

export { default as socialMediaManifest, moduleMetadata, SUPPORTED_PLATFORMS } from './manifest'
export { MODULE_EVENTS, MODULE_ACTIONS, MODULE_NAVIGATION, MODULE_PERMISSIONS } from './manifest'

// ============================================================================
// TYPES
// ============================================================================

export type {
  // Platform types
  SocialPlatform,
  AccountType,
  AccountStatus,
  SocialAccount,
  
  // Content types
  PostStatus,
  MediaType,
  PostMedia,
  LinkPreview,
  PlatformContent,
  SocialPost,
  PublishResult,
  PublishLog,
  
  // Queue & Scheduling
  TimeSlot,
  ContentQueue,
  HashtagGroup,
  
  // Campaigns & Calendar
  CampaignStatus,
  CampaignGoals,
  Campaign,
  CalendarEventType,
  CalendarEvent,
  ContentPillar,
  
  // Media Library
  MediaFileType,
  MediaSource,
  PlatformMediaStatus,
  MediaLibraryItem,
  MediaFolder,
  
  // Analytics
  DailyAnalytics,
  PostAnalytics,
  Competitor,
  OptimalTime,
  
  // Inbox & Engagement
  InboxItemType,
  InboxItemStatus,
  InboxPriority,
  Sentiment,
  InboxItem,
  SavedReply,
  
  // Brand Mentions
  MentionStatus,
  BrandMention,
  KeywordType,
  ListeningKeyword,
  
  // Team & Permissions
  TeamRole,
  TeamPermission,
  ApprovalStepType,
  ApprovalStep,
  ApprovalWorkflow,
  ApprovalRequestStatus,
  ApprovalRequest,
  
  // Reports
  ReportType,
  ReportFrequency,
  Report,
  
  // AI Features
  ContentIdeaStatus,
  AIContentIdea,
  AICaption,
  AICaptionGeneration,
  
  // Platform Config
  PlatformConfig,
} from './types'

export { PLATFORM_CONFIGS } from './types'

// ============================================================================
// ACCOUNT ACTIONS
// ============================================================================

export {
  getSocialAccounts,
  getSocialAccount,
  createSocialAccount,
  updateAccountStatus,
  refreshAccountToken,
  disconnectSocialAccount,
  syncAccountStats,
  getAccountHealth,
} from './actions/account-actions'

// ============================================================================
// POST ACTIONS
// ============================================================================

export {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  schedulePost,
  publishPostNow,
  addToQueue,
  approvePost,
  rejectPost,
  bulkSchedulePosts,
  bulkDeletePosts,
  duplicatePost,
} from './actions/post-actions'

// ============================================================================
// ANALYTICS ACTIONS
// ============================================================================

export {
  getAnalyticsOverview,
  getDailyAnalytics,
  getPostAnalytics,
  getTopPosts,
  getOptimalTimes,
  getBestTimesToPost,
  recalculateOptimalTimes,
  generateReportData,
  syncAnalytics,
} from './actions/analytics-actions'

// ============================================================================
// INBOX ACTIONS
// ============================================================================

export {
  getInboxItems,
  getInboxCounts,
  markAsRead,
  replyToItem,
  assignItem,
  updatePriority,
  archiveItem,
  markAsSpam,
  flagItem,
  addTags,
  getSavedReplies,
  createSavedReply,
  useSavedReply,
  deleteSavedReply,
  bulkArchive,
  bulkMarkAsRead,
  syncInbox,
} from './actions/inbox-actions'

// ============================================================================
// MEDIA ACTIONS
// ============================================================================

export {
  createMediaFolder,
  getMediaFolders,
  renameMediaFolder,
  deleteMediaFolder,
  moveMediaToFolder,
  updateMediaMetadata,
  bulkDeleteMedia,
  searchMedia,
  getMediaUsage,
} from './actions/media-actions'

// ============================================================================
// AI ACTIONS
// ============================================================================

export {
  aiGenerateCaptions,
  aiGenerateHashtags,
  aiGenerateContentIdeas,
  aiImproveContent,
  aiGenerateAltText,
  aiGenerateThread,
  aiSuggestPostingTime,
  aiTranslateContent,
} from './actions/ai-actions'

// ============================================================================
// COMPONENTS
// ============================================================================

export {
  PostComposer,
  SocialDashboard,
  ContentCalendar,
  SocialInbox,
} from './components'
