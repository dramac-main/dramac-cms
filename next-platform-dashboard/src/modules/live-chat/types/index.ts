/**
 * Live Chat Module — TypeScript Types
 *
 * Complete type definitions for all database tables, UI components,
 * realtime events, and WhatsApp integration.
 */

// =============================================================================
// ENUMS / UNION TYPES
// =============================================================================

export type AgentRole = 'agent' | 'supervisor' | 'admin'
export type AgentStatus = 'online' | 'away' | 'busy' | 'offline'

export type ConversationStatus = 'pending' | 'active' | 'waiting' | 'resolved' | 'closed' | 'missed'
export type ConversationPriority = 'low' | 'normal' | 'high' | 'urgent'
export type ConversationChannel = 'widget' | 'whatsapp' | 'api'

export type MessageSenderType = 'visitor' | 'agent' | 'system' | 'ai'
export type MessageContentType = 'text' | 'image' | 'file' | 'audio' | 'video' | 'location' | 'system' | 'note' | 'whatsapp_template'
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

export type WidgetPosition = 'bottom-right' | 'bottom-left'

export type VisitorChannel = 'widget' | 'whatsapp' | 'api'

// =============================================================================
// DATABASE TABLE INTERFACES
// =============================================================================

// ─── Department ──────────────────────────────────────────────────────────────

export interface ChatDepartment {
  id: string
  siteId: string
  name: string
  description: string | null
  isDefault: boolean
  isActive: boolean
  autoAssign: boolean
  maxConcurrentChats: number
  sortOrder: number
  createdAt: string
  updatedAt: string
}

// ─── Agent ───────────────────────────────────────────────────────────────────

export interface ChatAgent {
  id: string
  siteId: string
  userId: string
  displayName: string
  avatarUrl: string | null
  email: string | null
  role: AgentRole
  status: AgentStatus
  departmentId: string | null
  maxConcurrentChats: number
  currentChatCount: number
  totalChatsHandled: number
  avgResponseTimeSeconds: number
  avgRating: number
  totalRatings: number
  isActive: boolean
  lastActiveAt: string | null
  createdAt: string
  updatedAt: string
}

// ─── Widget Settings ─────────────────────────────────────────────────────────

export interface ChatWidgetSettings {
  id: string
  siteId: string
  // Appearance
  primaryColor: string
  textColor: string
  position: WidgetPosition
  launcherIcon: string
  launcherSize: number
  borderRadius: number
  zIndex: number
  // Branding
  companyName: string | null
  welcomeMessage: string
  awayMessage: string
  offlineMessage: string
  logoUrl: string | null
  // Pre-chat form
  preChatEnabled: boolean
  preChatNameRequired: boolean
  preChatEmailRequired: boolean
  preChatPhoneEnabled: boolean
  preChatPhoneRequired: boolean
  preChatMessageRequired: boolean
  preChatDepartmentSelector: boolean
  // Business hours
  businessHoursEnabled: boolean
  businessHours: BusinessHoursConfig
  timezone: string
  // Behavior
  autoOpenDelaySeconds: number
  showAgentAvatar: boolean
  showAgentName: boolean
  showTypingIndicator: boolean
  enableFileUploads: boolean
  enableEmoji: boolean
  enableSoundNotifications: boolean
  enableSatisfactionRating: boolean
  // Language
  language: string
  customTranslations: Record<string, string>
  // WhatsApp
  whatsappEnabled: boolean
  whatsappPhoneNumber: string | null
  whatsappPhoneNumberId: string | null
  whatsappBusinessAccountId: string | null
  whatsappWelcomeTemplate: string | null
  // Advanced
  allowedDomains: string[]
  blockedIps: string[]
  maxFileSizeMb: number
  allowedFileTypes: string[]
  //
  createdAt: string
  updatedAt: string
}

export interface BusinessHoursConfig {
  monday?: DayHours
  tuesday?: DayHours
  wednesday?: DayHours
  thursday?: DayHours
  friday?: DayHours
  saturday?: DayHours
  sunday?: DayHours
}

export interface DayHours {
  enabled: boolean
  start: string // "09:00"
  end: string   // "17:00"
}

// ─── Visitor ─────────────────────────────────────────────────────────────────

export interface ChatVisitor {
  id: string
  siteId: string
  externalId: string | null
  name: string | null
  email: string | null
  phone: string | null
  avatarUrl: string | null
  // Tracking
  browser: string | null
  os: string | null
  device: string | null
  ipAddress: string | null
  country: string | null
  city: string | null
  // Page tracking
  currentPageUrl: string | null
  currentPageTitle: string | null
  referrerUrl: string | null
  landingPageUrl: string | null
  // Engagement
  totalVisits: number
  totalConversations: number
  totalMessages: number
  firstSeenAt: string
  lastSeenAt: string
  // CRM
  crmContactId: string | null
  // Tags
  tags: string[]
  notes: string | null
  customData: Record<string, unknown>
  // Channel
  channel: VisitorChannel
  whatsappPhone: string | null
  //
  createdAt: string
  updatedAt: string
}

// ─── Conversation ────────────────────────────────────────────────────────────

export interface ChatConversation {
  id: string
  siteId: string
  visitorId: string
  // Assignment
  assignedAgentId: string | null
  departmentId: string | null
  // Status
  status: ConversationStatus
  priority: ConversationPriority
  // Channel
  channel: ConversationChannel
  // Content summary
  subject: string | null
  lastMessageText: string | null
  lastMessageAt: string | null
  lastMessageBy: MessageSenderType | null
  // Counts
  messageCount: number
  unreadAgentCount: number
  unreadVisitorCount: number
  // Timing
  firstResponseTimeSeconds: number | null
  resolutionTimeSeconds: number | null
  waitTimeSeconds: number | null
  // Rating
  rating: number | null
  ratingComment: string | null
  ratedAt: string | null
  // Tags & metadata
  tags: string[]
  internalNotes: string | null
  metadata: Record<string, unknown>
  // WhatsApp
  whatsappConversationId: string | null
  whatsappWindowExpiresAt: string | null
  //
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  closedAt: string | null
  // Joined data (optional, populated by queries with joins)
  visitor?: ChatVisitor
  assignedAgent?: ChatAgent
  department?: ChatDepartment
}

// ─── Message ─────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string
  conversationId: string
  siteId: string
  // Sender
  senderType: MessageSenderType
  senderId: string | null
  senderName: string | null
  senderAvatar: string | null
  // Content
  content: string | null
  contentType: MessageContentType
  // File
  fileUrl: string | null
  fileName: string | null
  fileSize: number | null
  fileMimeType: string | null
  // Status
  status: MessageStatus
  isInternalNote: boolean
  // WhatsApp
  whatsappMessageId: string | null
  whatsappStatus: string | null
  // AI
  isAiGenerated: boolean
  aiConfidence: number | null
  //
  createdAt: string
  updatedAt: string
}

// ─── Canned Response ─────────────────────────────────────────────────────────

export interface CannedResponse {
  id: string
  siteId: string
  title: string
  content: string
  shortcut: string | null
  category: string | null
  tags: string[]
  usageCount: number
  lastUsedAt: string | null
  createdBy: string | null
  isShared: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ─── Knowledge Base ──────────────────────────────────────────────────────────

export interface KnowledgeBaseArticle {
  id: string
  siteId: string
  title: string
  content: string
  category: string | null
  tags: string[]
  isActive: boolean
  usageCount: number
  lastMatchedAt: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface ChatAnalytics {
  id: string
  siteId: string
  date: string
  // Volume
  totalConversations: number
  totalMessages: number
  newVisitors: number
  returningVisitors: number
  // Channel
  widgetConversations: number
  whatsappConversations: number
  // Status
  resolvedConversations: number
  missedConversations: number
  // Performance
  avgFirstResponseSeconds: number
  avgResolutionSeconds: number
  avgWaitSeconds: number
  avgMessagesPerConversation: number
  // Satisfaction
  avgRating: number
  totalRatings: number
  satisfactionScore: number
  // AI
  aiAutoResponses: number
  aiResolved: number
  // Agent
  agentId: string | null
  //
  createdAt: string
  updatedAt: string
}

// =============================================================================
// UI / COMPONENT TYPES
// =============================================================================

export interface ConversationFilters {
  status?: ConversationStatus | 'all'
  channel?: ConversationChannel | 'all'
  assignedAgentId?: string | 'unassigned' | 'all'
  departmentId?: string | 'all'
  priority?: ConversationPriority | 'all'
  search?: string
  dateFrom?: string
  dateTo?: string
}

export interface ChatOverviewStats {
  activeConversations: number
  pendingConversations: number
  onlineAgents: number
  avgResponseTime: number
  todayConversations: number
  todayResolved: number
  todayMissed: number
  satisfactionScore: number
}

export interface AgentPerformanceData {
  agentId: string
  agentName: string
  avatarUrl: string | null
  totalChats: number
  resolvedChats: number
  avgResponseTime: number
  avgRating: number
  totalRatings: number
  currentLoad: number
  maxLoad: number
}

export interface ConversationListItem {
  id: string
  visitorName: string | null
  visitorEmail: string | null
  visitorAvatar: string | null
  channel: ConversationChannel
  status: ConversationStatus
  priority: ConversationPriority
  lastMessageText: string | null
  lastMessageAt: string | null
  lastMessageBy: MessageSenderType | null
  unreadCount: number
  assignedAgentName: string | null
  departmentName: string | null
  tags: string[]
  createdAt: string
}

// =============================================================================
// REALTIME TYPES
// =============================================================================

export type RealtimeEventType =
  | 'new_message'
  | 'typing_start'
  | 'typing_stop'
  | 'status_change'
  | 'agent_joined'
  | 'agent_left'
  | 'conversation_assigned'
  | 'conversation_resolved'

export interface RealtimeMessage {
  type: RealtimeEventType
  conversationId: string
  data: Record<string, unknown>
}

export interface PresenceState {
  agentId: string
  status: AgentStatus
  currentChats: number
  lastSeen: string
}

// =============================================================================
// WHATSAPP TYPES
// =============================================================================

export interface WhatsAppWebhookPayload {
  object: string
  entry: WhatsAppEntry[]
}

export interface WhatsAppEntry {
  id: string
  changes: WhatsAppChange[]
}

export interface WhatsAppChange {
  value: {
    messaging_product: string
    metadata: {
      display_phone_number: string
      phone_number_id: string
    }
    contacts?: Array<{
      profile: { name: string }
      wa_id: string
    }>
    messages?: WhatsAppIncomingMessage[]
    statuses?: WhatsAppMessageStatus[]
  }
  field: string
}

export interface WhatsAppIncomingMessage {
  from: string
  id: string
  timestamp: string
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'reaction' | 'interactive'
  text?: { body: string }
  image?: { id: string; mime_type: string; sha256: string; caption?: string }
  document?: { id: string; mime_type: string; sha256: string; filename: string; caption?: string }
  audio?: { id: string; mime_type: string; sha256: string }
  video?: { id: string; mime_type: string; sha256: string; caption?: string }
  location?: { latitude: number; longitude: number; name?: string; address?: string }
}

export interface WhatsAppMessageStatus {
  id: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  timestamp: string
  recipient_id: string
  errors?: Array<{ code: number; title: string }>
}

export interface WhatsAppTemplateMessage {
  name: string
  language: { code: string }
  components?: WhatsAppTemplateComponent[]
}

export interface WhatsAppTemplateComponent {
  type: 'header' | 'body' | 'button'
  parameters?: Array<{
    type: 'text' | 'image'
    text?: string
    image?: { link: string }
  }>
}

// =============================================================================
// FORM / INPUT TYPES
// =============================================================================

export interface CreateDepartmentInput {
  name: string
  description?: string
  isDefault?: boolean
  autoAssign?: boolean
  maxConcurrentChats?: number
}

export interface UpdateDepartmentInput {
  name?: string
  description?: string
  isDefault?: boolean
  isActive?: boolean
  autoAssign?: boolean
  maxConcurrentChats?: number
  sortOrder?: number
}

export interface CreateAgentInput {
  userId: string
  displayName: string
  email?: string
  avatarUrl?: string
  role?: AgentRole
  departmentId?: string
  maxConcurrentChats?: number
}

export interface UpdateAgentInput {
  displayName?: string
  email?: string
  avatarUrl?: string
  role?: AgentRole
  status?: AgentStatus
  departmentId?: string | null
  maxConcurrentChats?: number
  isActive?: boolean
}

export interface CreateConversationInput {
  visitorId: string
  channel?: ConversationChannel
  departmentId?: string
  subject?: string
}

export interface SendMessageInput {
  conversationId: string
  content: string
  contentType?: MessageContentType
  senderType: MessageSenderType
  senderId?: string
  senderName?: string
  senderAvatar?: string
  isInternalNote?: boolean
  fileUrl?: string
  fileName?: string
  fileSize?: number
  fileMimeType?: string
}

export interface CreateVisitorInput {
  name?: string
  email?: string
  phone?: string
  channel?: VisitorChannel
  browser?: string
  os?: string
  device?: string
  currentPageUrl?: string
  currentPageTitle?: string
  referrerUrl?: string
  landingPageUrl?: string
  whatsappPhone?: string
}

export interface CreateCannedResponseInput {
  title: string
  content: string
  shortcut?: string
  category?: string
  tags?: string[]
  isShared?: boolean
}

export interface UpdateCannedResponseInput {
  title?: string
  content?: string
  shortcut?: string
  category?: string
  tags?: string[]
  isShared?: boolean
  isActive?: boolean
}

export interface CreateKnowledgeBaseArticleInput {
  title: string
  content: string
  category?: string
  tags?: string[]
}

export interface UpdateKnowledgeBaseArticleInput {
  title?: string
  content?: string
  category?: string
  tags?: string[]
  isActive?: boolean
}

export interface UpdateWidgetSettingsInput {
  primaryColor?: string
  textColor?: string
  position?: WidgetPosition
  launcherIcon?: string
  launcherSize?: number
  borderRadius?: number
  zIndex?: number
  companyName?: string
  welcomeMessage?: string
  awayMessage?: string
  offlineMessage?: string
  logoUrl?: string
  preChatEnabled?: boolean
  preChatNameRequired?: boolean
  preChatEmailRequired?: boolean
  preChatPhoneEnabled?: boolean
  preChatPhoneRequired?: boolean
  preChatMessageRequired?: boolean
  preChatDepartmentSelector?: boolean
  businessHoursEnabled?: boolean
  businessHours?: BusinessHoursConfig
  timezone?: string
  autoOpenDelaySeconds?: number
  showAgentAvatar?: boolean
  showAgentName?: boolean
  showTypingIndicator?: boolean
  enableFileUploads?: boolean
  enableEmoji?: boolean
  enableSoundNotifications?: boolean
  enableSatisfactionRating?: boolean
  language?: string
  customTranslations?: Record<string, string>
  whatsappEnabled?: boolean
  whatsappPhoneNumber?: string
  whatsappPhoneNumberId?: string
  whatsappBusinessAccountId?: string
  whatsappWelcomeTemplate?: string
  allowedDomains?: string[]
  blockedIps?: string[]
  maxFileSizeMb?: number
  allowedFileTypes?: string[]
}

// =============================================================================
// PAGINATION
// =============================================================================

export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// =============================================================================
// ACTION RESULTS
// =============================================================================

export interface ActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
}
