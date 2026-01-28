/**
 * AI Agents Module
 * 
 * Phase EM-58A: AI Agents - Core Infrastructure
 * 
 * This module provides the core infrastructure for AI agents including:
 * - Agent configuration and management
 * - LLM provider abstraction (OpenAI, Anthropic)
 * - Memory system (short-term, long-term, episodic)
 * - Tool system for agent actions
 * - Agent runtime with ReAct loop
 * - Security and approval system
 */

// Core types
export * from './types'

// Agent CRUD actions
export {
  getAgents,
  getAgent,
  getAgentBySlug,
  createAgent,
  updateAgent,
  deleteAgent,
  toggleAgentActive,
  addAgentGoal,
  updateAgentGoals,
  getAgentConversations,
  clearAgentConversations,
} from './actions'

// Agent execution actions
export {
  triggerAgent,
  triggerAgentFromWorkflow,
  triggerAgentFromSchedule,
  sendMessageToAgent,
  getAgentExecutions,
  getExecutionDetails,
  cancelExecution,
  getAgentUsageStats,
  getSiteAIUsage,
} from './execution-actions'

// LLM providers
export { createProvider } from './llm'
export type { LLMProvider } from './llm'

// Memory system
export { 
  storeMemory,
  retrieveRelevantMemories,
  getOrCreateConversation,
  addMessageToConversation,
  recordEpisode 
} from './memory'

// Tool system
export { executeTool, getAvailableTools } from './tools'
export type { ToolResult, ToolContext, OpenAITool } from './tools'

// Runtime
export { executeAgent } from './runtime'

// Security
export {
  checkAgentPermissions,
  canAgentUseTool,
  getAgentEffectivePermissions,
  assessActionRisk,
  needsApproval,
  createApprovalRequest,
  getPendingApprovals,
  getApproval,
  approveAction,
  denyAction,
  expireOldApprovals,
} from './security'
