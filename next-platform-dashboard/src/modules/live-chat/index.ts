/**
 * Live Chat Module — Barrel Export
 *
 * Central entry point for all live-chat module exports.
 */

// ─── Module Manifest ─────────────────────────────────────────────────────────
export {
  LiveChatModuleManifest,
  MODULE_TABLES,
  MODULE_NAVIGATION,
  MODULE_PERMISSIONS,
  MODULE_EVENTS,
  MODULE_ACTIONS,
} from './manifest'

// ─── Types ───────────────────────────────────────────────────────────────────
export type {
  // Enums / Union types
  AgentRole,
  AgentStatus,
  ConversationStatus,
  ConversationPriority,
  ConversationChannel,
  MessageSenderType,
  MessageContentType,
  MessageStatus,
  WidgetPosition,
  VisitorChannel,
  RealtimeEventType,
  // Database table interfaces
  ChatDepartment,
  ChatAgent,
  ChatWidgetSettings,
  ChatVisitor,
  ChatConversation,
  ChatMessage,
  CannedResponse,
  KnowledgeBaseArticle,
  ChatAnalytics,
  // Supporting interfaces
  BusinessHoursConfig,
  DayHours,
  // UI types
  ConversationFilters,
  ChatOverviewStats,
  AgentPerformanceData,
  ConversationListItem,
  // Realtime types
  RealtimeMessage,
  PresenceState,
  // WhatsApp types
  WhatsAppWebhookPayload,
  WhatsAppEntry,
  WhatsAppChange,
  WhatsAppIncomingMessage,
  WhatsAppMessageStatus,
  WhatsAppTemplateMessage,
  WhatsAppTemplateComponent,
  // Form / Input types
  CreateDepartmentInput,
  UpdateDepartmentInput,
  CreateAgentInput,
  UpdateAgentInput,
  CreateConversationInput,
  SendMessageInput,
  CreateVisitorInput,
  CreateCannedResponseInput,
  UpdateCannedResponseInput,
  CreateKnowledgeBaseArticleInput,
  UpdateKnowledgeBaseArticleInput,
  UpdateWidgetSettingsInput,
  // Pagination
  PaginationParams,
  PaginatedResult,
  // Action results
  ActionResult,
} from './types'

// ─── DB Mapping ──────────────────────────────────────────────────────────────
export { mapRecord, mapRecords, toDbRecord } from './lib/map-db-record'
