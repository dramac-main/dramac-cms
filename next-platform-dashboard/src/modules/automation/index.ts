/**
 * Automation Module - Index
 * 
 * Phase EM-57A: Automation Engine - Core Infrastructure
 * 
 * Barrel export file for the Automation module. This file exposes all
 * public APIs and types for use by other modules and components.
 */

// ============================================================================
// MODULE MANIFEST
// ============================================================================

export { default as automationManifest, moduleMetadata } from './manifest'

// ============================================================================
// TYPES
// ============================================================================

export type {
  // Core entities
  Workflow,
  WorkflowStep,
  WorkflowExecution,
  StepExecutionLog,
  AutomationEventLog,
  ScheduledJob,
  AutomationConnection,
  WebhookEndpoint,
  WorkflowVariable,
  EventSubscription,
  
  // Configuration types
  TriggerConfig,
  ConditionConfig,
  DelayConfig,
  
  // Runtime types
  ExecutionContext,
  ActionResult,
  
  // Enum types
  TriggerType,
  ExecutionStatus,
  StepStatus,
  ConnectionStatus,
} from './types/automation-types'

// ============================================================================
// EVENT TYPES REGISTRY
// ============================================================================

export {
  EVENT_REGISTRY,
  getAllEventDefinitions,
  getEventsByCategory,
  type EventDefinition,
} from './lib/event-types'

// ============================================================================
// ACTION TYPES REGISTRY
// ============================================================================

export {
  ACTION_REGISTRY,
  getAllActionDefinitions,
  getActionsByCategory,
  type ActionDefinition,
} from './lib/action-types'

// ============================================================================
// SERVER ACTIONS - WORKFLOW MANAGEMENT
// ============================================================================

export {
  // Workflow CRUD
  createWorkflow,
  getWorkflow,
  getWorkflows,
  updateWorkflow,
  deleteWorkflow,
  activateWorkflow,
  pauseWorkflow,
  
  // Step management
  createWorkflowStep,
  getWorkflowSteps,
  updateWorkflowStep,
  deleteWorkflowStep,
  reorderWorkflowSteps,
  
  // Execution management
  getWorkflowExecutions,
  getExecutionDetails,
  cancelExecution,
  retryExecution,
  triggerWorkflow,
  
  // Connection management
  createConnection,
  getConnections,
  updateConnection,
  deleteConnection,
  testConnection,
  
  // Webhook management
  createWebhookEndpoint,
  getWebhookEndpoints,
  deleteWebhookEndpoint,
  
  // Event subscriptions
  subscribeToEvent,
  unsubscribeFromEvent,
  
  // Statistics
  getAutomationStats,
  
  // Phase EM-57B additions
  getAutomationAnalytics,
  createWorkflowFromTemplate,
} from './actions/automation-actions'

// ============================================================================
// SERVICES - FOR INTERNAL/BACKGROUND USE
// ============================================================================

// Event processor (for background workers)
export {
  processPendingEvents,
  logAutomationEvent,
  processScheduledJobs,
  processIncomingWebhook,
} from './services/event-processor'

// Execution engine (for background workers)
export {
  executeWorkflow,
  resumePausedExecutions,
} from './services/execution-engine'

// Action executor (for internal use)
export {
  executeAction,
} from './services/action-executor'

// ============================================================================
// PHASE EM-57B: VISUAL BUILDER & ADVANCED FEATURES
// ============================================================================

// Workflow Templates
export {
  WORKFLOW_TEMPLATES,
  getTemplateById,
  getTemplateCategories,
  getTemplatesByCategory,
  searchTemplates,
  type WorkflowTemplate,
} from './lib/templates'

// Visual Builder Components
export {
  WorkflowBuilder,
  TriggerPanel,
  ActionPalette,
  WorkflowCanvas,
  StepConfigPanel,
} from './components/workflow-builder'

// Additional UI Components
export { TemplateGallery } from './components/template-gallery'
export { AnalyticsDashboard } from './components/analytics-dashboard'
export { ConnectionSetup, type ServiceConnection } from './components/connection-setup'
export { CreateWorkflowDialog } from './components/create-workflow-dialog'
export { CreateWorkflowButton } from './components/create-workflow-button'
export { WorkflowListCard } from './components/workflow-list-card'

// Hooks
export { useWorkflowBuilder } from './hooks/use-workflow-builder'

// AI Actions Service
export {
  generateText,
  summarizeText,
  classifyText,
  extractData,
  analyzeSentiment,
  moderateContent,
  translateText,
  suggestWorkflowImprovements,
  type AIActionResult,
} from './services/ai-actions'
