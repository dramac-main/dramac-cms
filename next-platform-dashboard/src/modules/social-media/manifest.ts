/**
 * Social Media Module - Manifest
 * 
 * Phase EM-54: Social Media Management Module
 * Comprehensive social media management like Hootsuite + Sprout Social
 */

// ============================================================================
// MODULE METADATA
// ============================================================================

export interface SocialMediaModuleMetadata {
  id: string
  shortId: string
  name: string
  description: string
  version: string
  author: string
  category: string
  tags: string[]
  minimumPlatformVersion: string
  capabilities: string[]
  dependencies: string[]
  optionalDependencies: string[]
}

export const moduleMetadata: SocialMediaModuleMetadata = {
  id: 'social-media',
  shortId: 'social01',
  name: 'Social Media Management',
  description: 'Comprehensive social media management with multi-platform publishing, content calendar, analytics, social inbox, and team collaboration. Built like Hootsuite + Sprout Social combined.',
  version: '1.0.0',
  author: 'DRAMAC Platform',
  
  category: 'marketing',
  tags: [
    'social-media', 'publishing', 'scheduling', 'analytics', 
    'engagement', 'inbox', 'campaigns', 'content-calendar',
    'hootsuite', 'sprout-social', 'buffer'
  ],
  
  minimumPlatformVersion: '1.0.0',
  
  capabilities: [
    // Account Management
    'multi-platform-accounts',
    'oauth-connection',
    'account-health-monitoring',
    
    // Content Publishing
    'post-scheduling',
    'content-queue',
    'bulk-scheduling',
    'optimal-time-posting',
    'first-comment',
    'platform-specific-content',
    
    // Content Calendar
    'content-calendar',
    'campaign-management',
    'content-pillars',
    'event-planning',
    
    // Media Management
    'media-library',
    'image-optimization',
    'video-support',
    'canva-integration',
    
    // Analytics & Reporting
    'performance-analytics',
    'post-analytics',
    'competitor-tracking',
    'custom-reports',
    'scheduled-reports',
    
    // Engagement
    'unified-inbox',
    'comment-management',
    'dm-management',
    'saved-replies',
    'sentiment-analysis',
    
    // Social Listening
    'brand-mentions',
    'keyword-tracking',
    'hashtag-monitoring',
    
    // Team Features
    'approval-workflows',
    'role-based-access',
    'team-collaboration',
    
    // AI Features
    'ai-content-ideas',
    'ai-captions',
    'ai-hashtags',
    'ai-optimal-times',
  ],
  
  dependencies: [],
  optionalDependencies: ['crm', 'automation', 'ai-agents', 'ecommerce'],
}

// ============================================================================
// SUPPORTED PLATFORMS
// ============================================================================

export const SUPPORTED_PLATFORMS = [
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '📘',
    color: '#1877F2',
    authType: 'oauth2',
    features: ['posts', 'stories', 'reels', 'events', 'groups', 'ads'],
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📷',
    color: '#E4405F',
    authType: 'oauth2',
    features: ['posts', 'stories', 'reels', 'first_comment'],
    requiresBusinessAccount: true,
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: '𝕏',
    color: '#000000',
    authType: 'oauth2',
    features: ['posts', 'threads', 'polls', 'spaces'],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    color: '#0A66C2',
    authType: 'oauth2',
    features: ['posts', 'articles', 'documents', 'company_pages'],
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    color: '#000000',
    authType: 'oauth2',
    features: ['videos'],
    requiresBusinessAccount: true,
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: '▶️',
    color: '#FF0000',
    authType: 'oauth2',
    features: ['videos', 'shorts', 'community', 'live'],
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    icon: '📌',
    color: '#E60023',
    authType: 'oauth2',
    features: ['pins', 'idea_pins', 'boards'],
  },
  {
    id: 'threads',
    name: 'Threads',
    icon: '🧵',
    color: '#000000',
    authType: 'oauth2',
    features: ['posts'],
  },
  {
    id: 'bluesky',
    name: 'Bluesky',
    icon: '🦋',
    color: '#0085FF',
    authType: 'app_password',
    features: ['posts'],
  },
  {
    id: 'mastodon',
    name: 'Mastodon',
    icon: '🐘',
    color: '#6364FF',
    authType: 'oauth2',
    features: ['posts'],
  },
] as const

// ============================================================================
// DATABASE TABLES
// ============================================================================

export const MODULE_TABLES = [
  'mod_social.accounts',
  'mod_social.posts',
  'mod_social.publish_log',
  'mod_social.content_queue',
  'mod_social.hashtag_groups',
  'mod_social.campaigns',
  'mod_social.calendar_events',
  'mod_social.content_pillars',
  'mod_social.media_library',
  'mod_social.media_folders',
  'mod_social.analytics_daily',
  'mod_social.post_analytics',
  'mod_social.competitors',
  'mod_social.competitor_analytics',
  'mod_social.inbox_items',
  'mod_social.saved_replies',
  'mod_social.brand_mentions',
  'mod_social.listening_keywords',
  'mod_social.optimal_times',
  'mod_social.team_permissions',
  'mod_social.approval_workflows',
  'mod_social.approval_requests',
  'mod_social.reports',
  'mod_social.ai_content_ideas',
  'mod_social.ai_captions',
]

// ============================================================================
// NAVIGATION
// ============================================================================

export const MODULE_NAVIGATION = {
  mainMenu: {
    label: 'Social Media',
    icon: 'Share2',
    href: '/dashboard/[siteId]/social',
    order: 5,
  },
  subMenu: [
    { label: 'Dashboard', href: '/dashboard/[siteId]/social', icon: 'LayoutDashboard' },
    { label: 'Calendar', href: '/dashboard/[siteId]/social/calendar', icon: 'Calendar' },
    { label: 'Compose', href: '/dashboard/[siteId]/social/compose', icon: 'PenSquare' },
    { label: 'Posts', href: '/dashboard/[siteId]/social/posts', icon: 'FileText' },
    { label: 'Inbox', href: '/dashboard/[siteId]/social/inbox', icon: 'Inbox' },
    { label: 'Analytics', href: '/dashboard/[siteId]/social/analytics', icon: 'BarChart3' },
    { label: 'Campaigns', href: '/dashboard/[siteId]/social/campaigns', icon: 'Target' },
    { label: 'Media', href: '/dashboard/[siteId]/social/media', icon: 'Image' },
    { label: 'Listening', href: '/dashboard/[siteId]/social/listening', icon: 'Ear' },
    { label: 'Competitors', href: '/dashboard/[siteId]/social/competitors', icon: 'Users' },
    { label: 'Reports', href: '/dashboard/[siteId]/social/reports', icon: 'FileBarChart' },
    { label: 'Accounts', href: '/dashboard/[siteId]/social/accounts', icon: 'Link' },
    { label: 'Settings', href: '/dashboard/[siteId]/social/settings', icon: 'Settings' },
  ],
}

// ============================================================================
// PERMISSIONS
// ============================================================================

export const MODULE_PERMISSIONS = [
  { key: 'social.accounts.manage', name: 'Manage Accounts', description: 'Add, edit, and remove social media accounts' },
  { key: 'social.accounts.connect', name: 'Connect Accounts', description: 'Connect new social media accounts' },
  { key: 'social.posts.create', name: 'Create Posts', description: 'Create new social media posts' },
  { key: 'social.posts.edit_all', name: 'Edit All Posts', description: 'Edit posts created by any team member' },
  { key: 'social.posts.schedule', name: 'Schedule Posts', description: 'Schedule posts for future publishing' },
  { key: 'social.posts.publish', name: 'Publish Posts', description: 'Publish posts immediately' },
  { key: 'social.posts.approve', name: 'Approve Posts', description: 'Approve or reject posts in approval workflow' },
  { key: 'social.posts.delete', name: 'Delete Posts', description: 'Delete posts' },
  { key: 'social.analytics.view', name: 'View Analytics', description: 'View performance analytics' },
  { key: 'social.analytics.export', name: 'Export Data', description: 'Export analytics data' },
  { key: 'social.inbox.manage', name: 'Manage Inbox', description: 'View and manage social inbox' },
  { key: 'social.inbox.respond', name: 'Respond to Messages', description: 'Reply to comments and messages' },
  { key: 'social.campaigns.manage', name: 'Manage Campaigns', description: 'Create and manage campaigns' },
  { key: 'social.team.manage', name: 'Manage Team', description: 'Manage team permissions' },
  { key: 'social.ai.use', name: 'Use AI Features', description: 'Use AI-powered features' },
]

// ============================================================================
// EVENTS (for Automation integration)
// ============================================================================

export const MODULE_EVENTS = {
  account: {
    connected: 'social.account.connected',
    disconnected: 'social.account.disconnected',
    expired: 'social.account.expired',
    error: 'social.account.error',
  },
  post: {
    created: 'social.post.created',
    scheduled: 'social.post.scheduled',
    published: 'social.post.published',
    failed: 'social.post.failed',
    approved: 'social.post.approved',
    rejected: 'social.post.rejected',
  },
  inbox: {
    new_item: 'social.inbox.new_item',
    replied: 'social.inbox.replied',
    high_priority: 'social.inbox.high_priority',
  },
  mention: {
    detected: 'social.mention.detected',
    negative: 'social.mention.negative',
    influencer: 'social.mention.influencer',
  },
  analytics: {
    goal_reached: 'social.analytics.goal_reached',
    engagement_spike: 'social.analytics.engagement_spike',
    follower_milestone: 'social.analytics.follower_milestone',
  },
  campaign: {
    started: 'social.campaign.started',
    completed: 'social.campaign.completed',
    goal_reached: 'social.campaign.goal_reached',
  },
}

// ============================================================================
// ACTIONS (for Automation integration)
// ============================================================================

export const MODULE_ACTIONS = {
  post: {
    create: 'social.post.create',
    schedule: 'social.post.schedule',
    publish: 'social.post.publish',
    delete: 'social.post.delete',
  },
  inbox: {
    reply: 'social.inbox.reply',
    assign: 'social.inbox.assign',
    tag: 'social.inbox.tag',
    archive: 'social.inbox.archive',
  },
  account: {
    refresh: 'social.account.refresh',
    sync: 'social.account.sync',
  },
  analytics: {
    sync: 'social.analytics.sync',
    generate_report: 'social.analytics.generate_report',
  },
}

// ============================================================================
// API ROUTES
// ============================================================================

export const MODULE_API_ROUTES = [
  // OAuth
  { path: '/api/sites/[siteId]/social/oauth/[platform]', method: 'GET', description: 'Get OAuth URL' },
  { path: '/api/sites/[siteId]/social/oauth/callback', method: 'GET', description: 'OAuth callback' },
  
  // Accounts
  { path: '/api/sites/[siteId]/social/accounts', method: 'GET', description: 'List accounts' },
  { path: '/api/sites/[siteId]/social/accounts', method: 'POST', description: 'Add account' },
  { path: '/api/sites/[siteId]/social/accounts/[accountId]', method: 'GET', description: 'Get account' },
  { path: '/api/sites/[siteId]/social/accounts/[accountId]', method: 'DELETE', description: 'Disconnect account' },
  { path: '/api/sites/[siteId]/social/accounts/[accountId]/sync', method: 'POST', description: 'Sync account' },
  
  // Posts
  { path: '/api/sites/[siteId]/social/posts', method: 'GET', description: 'List posts' },
  { path: '/api/sites/[siteId]/social/posts', method: 'POST', description: 'Create post' },
  { path: '/api/sites/[siteId]/social/posts/[postId]', method: 'GET', description: 'Get post' },
  { path: '/api/sites/[siteId]/social/posts/[postId]', method: 'PUT', description: 'Update post' },
  { path: '/api/sites/[siteId]/social/posts/[postId]', method: 'DELETE', description: 'Delete post' },
  { path: '/api/sites/[siteId]/social/posts/[postId]/publish', method: 'POST', description: 'Publish post' },
  { path: '/api/sites/[siteId]/social/posts/[postId]/schedule', method: 'POST', description: 'Schedule post' },
  
  // Calendar
  { path: '/api/sites/[siteId]/social/calendar', method: 'GET', description: 'Get calendar data' },
  { path: '/api/sites/[siteId]/social/calendar/events', method: 'POST', description: 'Create event' },
  
  // Inbox
  { path: '/api/sites/[siteId]/social/inbox', method: 'GET', description: 'List inbox items' },
  { path: '/api/sites/[siteId]/social/inbox/[itemId]/reply', method: 'POST', description: 'Reply to item' },
  
  // Analytics
  { path: '/api/sites/[siteId]/social/analytics', method: 'GET', description: 'Get analytics' },
  { path: '/api/sites/[siteId]/social/analytics/sync', method: 'POST', description: 'Sync analytics' },
  
  // Campaigns
  { path: '/api/sites/[siteId]/social/campaigns', method: 'GET', description: 'List campaigns' },
  { path: '/api/sites/[siteId]/social/campaigns', method: 'POST', description: 'Create campaign' },
  
  // AI
  { path: '/api/sites/[siteId]/social/ai/captions', method: 'POST', description: 'Generate captions' },
  { path: '/api/sites/[siteId]/social/ai/ideas', method: 'POST', description: 'Generate content ideas' },
  { path: '/api/sites/[siteId]/social/ai/hashtags', method: 'POST', description: 'Suggest hashtags' },
]

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  ...moduleMetadata,
  tables: MODULE_TABLES,
  navigation: MODULE_NAVIGATION,
  permissions: MODULE_PERMISSIONS,
  events: MODULE_EVENTS,
  actions: MODULE_ACTIONS,
  apiRoutes: MODULE_API_ROUTES,
  supportedPlatforms: SUPPORTED_PLATFORMS,
}
