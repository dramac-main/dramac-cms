/**
 * Live Chat Module — Actions Barrel Export
 */

export {
  getConversations,
  getConversation,
  createConversation,
  assignConversation,
  transferConversation,
  resolveConversation,
  closeConversation,
  reopenConversation,
  updateConversationPriority,
  updateConversationTags,
  updateInternalNotes,
  markConversationRead,
  getConversationStats,
} from './conversation-actions'

export {
  getMessages,
  sendMessage,
  sendFileMessage,
  updateMessageStatus,
  deleteMessage,
} from './message-actions'

export {
  getAgents,
  getAgent,
  getOnlineAgents,
  getAvailableAgent,
  createAgent,
  updateAgent,
  updateAgentStatus,
  deleteAgent,
  getAgentPerformance,
} from './agent-actions'

export {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  setDefaultDepartment,
} from './department-actions'

export {
  getCannedResponses,
  searchCannedResponses,
  createCannedResponse,
  updateCannedResponse,
  deleteCannedResponse,
  incrementCannedResponseUsage,
} from './canned-response-actions'

export {
  getWidgetSettings,
  getPublicWidgetSettings,
  updateWidgetSettings,
  isWithinBusinessHours,
} from './widget-actions'

export {
  getVisitors,
  getVisitor,
  getVisitorConversations,
  createOrUpdateVisitor,
  updateVisitorInfo,
  updateVisitorPageTracking,
  linkVisitorToCrm,
} from './visitor-actions'

export {
  getKnowledgeBaseArticles,
  searchKnowledgeBase,
  createArticle,
  updateArticle,
  deleteArticle,
} from './knowledge-base-actions'

// LC-05: WhatsApp
export {
  sendWhatsAppMessage,
  sendWhatsAppImage,
  sendWhatsAppDocument,
  sendWhatsAppTemplateMessage,
  getWhatsAppStatus,
  saveWhatsAppSettings,
  getWhatsAppTemplates,
} from './whatsapp-actions'

// LC-06: AI & Routing
export {
  getAiSuggestions,
  getConversationSummary,
  detectMessageIntent,
  getAiStatus,
  routeToAgent,
  getConversationQueuePosition,
  analyzeMessageSentiment,
} from './ai-actions'

// LC-07: Analytics
export {
  getAnalyticsOverview,
  getConversationsByDay,
  getResponseTimeByDay,
  getAgentPerformance as getAgentPerformanceAnalytics,
  getChannelBreakdown,
  getSatisfactionDistribution,
  getBusiestHours,
  exportAnalyticsCsv,
} from './analytics-actions'
