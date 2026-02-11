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
