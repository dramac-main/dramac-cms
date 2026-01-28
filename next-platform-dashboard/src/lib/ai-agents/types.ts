/**
 * AI Agents - Core Type Definitions
 * 
 * Phase EM-58A: AI Agents - Core Infrastructure
 * 
 * This file contains all TypeScript types for the AI Agents system.
 */

// ============================================================================
// AGENT TYPES
// ============================================================================

export type AgentType = 
  | 'assistant'      // General purpose assistant
  | 'specialist'     // Domain-specific (sales, support, etc.)
  | 'orchestrator'   // Manages other agents
  | 'analyst'        // Data analysis and reporting
  | 'guardian'       // Monitoring and alerting

export type AgentDomain = 
  | 'sales'
  | 'support'
  | 'marketing'
  | 'operations'
  | 'finance'
  | 'hr'
  | 'custom'

export type ExecutionStatus = 
  | 'pending'
  | 'running'
  | 'waiting_approval'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timed_out'

export type StepType = 
  | 'observe'
  | 'think'
  | 'act'
  | 'reflect'

export type MemoryType = 
  | 'fact'
  | 'preference'
  | 'pattern'
  | 'relationship'
  | 'outcome'

export type RiskLevel = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'

export type ApprovalStatus = 
  | 'pending'
  | 'approved'
  | 'denied'
  | 'expired'

export type ToolStatus = 
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'denied'

export type ToolHandlerType = 
  | 'internal'
  | 'module'
  | 'external'
  | 'workflow'

// ============================================================================
// AGENT CONFIGURATION
// ============================================================================

export interface AgentGoal {
  name: string
  description?: string
  priority: number // 1-10
  successMetric?: string
  targetValue?: number
  comparison?: 'gt' | 'gte' | 'lt' | 'lte' | 'eq'
  isRecurring?: boolean
  deadline?: string
}

export interface AgentConstraint {
  description: string
  type: 'must_not' | 'should_not' | 'limit'
  action?: string
  limit?: number
}

export interface AgentExample {
  scenario: string
  input: string
  expectedOutput: string
  explanation?: string
}

export interface AgentTriggerCondition {
  field: string
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'not_contains'
  value: unknown
}

export interface AgentConfig {
  id: string
  siteId: string
  agencyId?: string
  
  // Identity
  name: string
  slug: string
  description?: string
  avatarUrl?: string
  personality?: string
  
  // Type & Domain
  agentType: AgentType
  domain?: AgentDomain
  capabilities: string[]
  
  // Instructions
  systemPrompt: string
  goals: AgentGoal[]
  constraints: string[]
  examples: AgentExample[]
  
  // Triggers
  triggerEvents: string[]
  triggerSchedule?: string
  triggerConditions: AgentTriggerCondition[]
  
  // Status
  isActive: boolean
  isPublic: boolean
  
  // LLM Settings
  llmProvider: string
  llmModel: string
  temperature: number
  maxTokens: number
  
  // Execution Limits
  maxStepsPerRun: number
  maxToolCallsPerStep: number
  timeoutSeconds: number
  maxRunsPerHour: number
  maxRunsPerDay: number
  
  // Tool Access
  allowedTools: string[]
  deniedTools: string[]
  
  // Stats
  totalRuns: number
  successfulRuns: number
  failedRuns: number
  totalTokensUsed: number
  totalActionsTaken: number
  avgResponseTimeMs?: number
  lastRunAt?: string
  lastError?: string
  
  // Audit
  createdBy?: string
  updatedBy?: string
  createdAt: string
  updatedAt: string
}

// ============================================================================
// MEMORY TYPES
// ============================================================================

export interface Message {
  id: string
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  toolCalls?: ToolCall[]
  toolCallId?: string
  createdAt: string
}

export interface Conversation {
  id: string
  agentId: string
  siteId: string
  contextType: 'entity' | 'user' | 'session'
  contextId?: string
  messages: Message[]
  metadata: Record<string, unknown>
  startedAt: string
  lastMessageAt: string
  expiresAt?: string
  messageCount: number
  tokensUsed: number
}

export interface Memory {
  id: string
  agentId: string
  siteId: string
  memoryType: MemoryType
  subjectType?: string
  subjectId?: string
  content: string
  embedding?: number[]
  confidence: number
  source?: string
  tags: string[]
  importance: number
  accessCount: number
  lastAccessedAt?: string
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

export interface Episode {
  id: string
  agentId: string
  siteId: string
  executionId?: string
  triggerEvent?: string
  contextSummary?: string
  actionsTaken: ActionRecord[]
  outcome: 'success' | 'partial' | 'failure'
  outcomeDetails?: string
  lessonsLearned: string[]
  shouldRepeat?: boolean
  durationMs?: number
  tokensUsed?: number
  createdAt: string
}

// ============================================================================
// TOOL TYPES
// ============================================================================

export interface ToolDefinition {
  id: string
  name: string
  displayName: string
  description: string
  category: string
  parametersSchema: Record<string, unknown>
  returnsSchema?: Record<string, unknown>
  handlerType: ToolHandlerType
  handlerConfig: Record<string, unknown>
  requiresPermissions: string[]
  requiresModules: string[]
  rateLimitPerMinute?: number
  rateLimitPerHour?: number
  isDangerous: boolean
  isSystem: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
}

export interface ToolResult {
  success: boolean
  data?: unknown
  error?: string
  metadata?: {
    tokensUsed?: number
    durationMs?: number
  }
}

export interface ToolContext {
  siteId: string
  agentId: string
  executionId: string
  userId?: string
}

export type ToolHandler = (
  input: Record<string, unknown>,
  context: ToolContext
) => Promise<ToolResult>

// ============================================================================
// EXECUTION TYPES
// ============================================================================

export interface TriggerContext {
  type: 'event' | 'schedule' | 'manual' | 'webhook'
  eventId?: string
  eventType?: string
  data: Record<string, unknown>
  userId?: string
}

export interface AgentContext {
  executionId: string
  siteId: string
  agentId: string
  trigger: TriggerContext
  summary: string
  entities: Record<string, unknown>
  variables: Record<string, unknown>
}

export interface ExecutionStep {
  id: string
  executionId: string
  stepNumber: number
  stepType: StepType
  inputText?: string
  reasoning?: string
  outputText?: string
  toolName?: string
  toolInput?: Record<string, unknown>
  toolOutput?: Record<string, unknown>
  startedAt: string
  completedAt?: string
  durationMs?: number
  tokensUsed: number
}

export interface ActionRecord {
  tool: string
  input: Record<string, unknown>
  output: unknown
  success: boolean
  timestamp: string
}

export interface ExecutionResult {
  executionId: string
  success: boolean
  status: ExecutionStatus
  steps: ExecutionStep[]
  actions: ActionRecord[]
  result: Record<string, unknown>
  tokensInput: number
  tokensOutput: number
  tokensTotal: number
  durationMs: number
  error?: string
}

export interface AgentExecution {
  id: string
  agentId: string
  siteId: string
  triggerType: string
  triggerEventId?: string
  triggerData: Record<string, unknown>
  status: ExecutionStatus
  initialContext: Record<string, unknown>
  currentContext: Record<string, unknown>
  steps: ExecutionStep[]
  currentStep: number
  result: Record<string, unknown>
  actionsTaken: ActionRecord[]
  error?: string
  errorDetails?: Record<string, unknown>
  retryCount: number
  tokensInput: number
  tokensOutput: number
  tokensTotal: number
  llmCalls: number
  toolCalls: number
  startedAt?: string
  completedAt?: string
  durationMs?: number
  createdAt: string
}

// ============================================================================
// APPROVAL TYPES
// ============================================================================

export interface ApprovalRequest {
  id: string
  executionId: string
  agentId: string
  siteId: string
  actionType: string
  actionDescription: string
  actionParams?: Record<string, unknown>
  riskLevel: RiskLevel
  riskExplanation?: string
  status: ApprovalStatus
  resolvedBy?: string
  resolvedAt?: string
  resolutionNote?: string
  expiresAt?: string
  createdAt: string
}

// ============================================================================
// LLM PROVIDER TYPES
// ============================================================================

export interface LLMProviderConfig {
  id: string
  siteId?: string
  providerName: string
  isActive: boolean
  isDefault: boolean
  apiKeyEncrypted?: string
  apiEndpoint?: string
  organizationId?: string
  availableModels: string[]
  defaultModel?: string
  requestsPerMinute?: number
  tokensPerMinute?: number
  costPer1kInputTokens?: number
  costPer1kOutputTokens?: number
  createdAt: string
  updatedAt: string
}

export interface CompletionOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  responseFormat?: 'text' | 'json'
  stop?: string[]
}

export interface CompletionResult {
  content: string
  tokensInput: number
  tokensOutput: number
  finishReason: 'stop' | 'length' | 'tool_calls'
}

export interface ToolCompletionResult extends CompletionResult {
  toolCalls: ToolCall[]
}

export interface StreamChunk {
  type: 'content' | 'tool_call' | 'done'
  content?: string
  toolCall?: ToolCall
}

// ============================================================================
// USAGE TRACKING TYPES
// ============================================================================

export interface UsageTracking {
  id: string
  siteId: string
  agencyId?: string
  periodStart: string
  periodEnd: string
  totalAgentRuns: number
  totalTokensInput: number
  totalTokensOutput: number
  totalToolCalls: number
  totalApprovals: number
  usageByProvider: Record<string, unknown>
  estimatedCost: number
  includedRuns: number
  includedTokens: number
  overageRuns: number
  overageTokens: number
  createdAt: string
  updatedAt: string
}

export interface DailyUsage {
  id: string
  siteId: string
  date: string
  agentRuns: number
  tokensUsed: number
  toolCalls: number
  runsByAgent: Record<string, number>
  estimatedCost: number
  createdAt: string
}

// ============================================================================
// EXECUTION EVENT TYPES
// ============================================================================

export interface ExecutionEvent {
  type: 
    | 'execution_started'
    | 'execution_completed'
    | 'execution_failed'
    | 'status'
    | 'step_started'
    | 'step_completed'
    | 'observe_started'
    | 'observe_completed'
    | 'think_started'
    | 'think_completed'
    | 'act_started'
    | 'act_completed'
    | 'act_failed'
    | 'agent_finished'
    | 'approval_required'
  executionId?: string
  step?: number
  observation?: string
  thought?: ThoughtResult
  tool?: string
  input?: Record<string, unknown>
  result?: ToolResult
  error?: string
  reason?: string
  message?: string
}

export interface ThoughtResult {
  reasoning: string
  action: 'use_tool' | 'finish'
  tool?: string
  input?: Record<string, unknown>
  confidence: number
}

export interface ReActResult {
  success: boolean
  steps: ExecutionStep[]
  finalResponse: string
  context: AgentContext
  actions: ActionRecord[]
}

// ============================================================================
// EXECUTION OPTIONS
// ============================================================================

export interface ExecutionOptions {
  maxSteps?: number
  timeout?: number
  stream?: boolean
  userId?: string
  skipApproval?: boolean
}
