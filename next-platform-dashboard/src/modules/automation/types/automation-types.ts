/**
 * Automation Module TypeScript Types
 * 
 * Phase EM-57A: Automation Engine - Core Infrastructure
 * 
 * These types define the data structures for all automation entities
 */

// ============================================================================
// TYPE ALIASES
// ============================================================================

export type TriggerType = 'event' | 'schedule' | 'webhook' | 'manual' | 'form_submission'

export type StepType = 
  | 'condition'
  | 'delay'
  | 'wait_for_event'
  | 'loop'
  | 'parallel'
  | 'stop'
  | 'transform'
  | 'filter'
  | 'aggregate'
  | 'set_variable'
  | 'action'

export type ExecutionStatus = 
  | 'pending'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timed_out'

export type StepStatus = 
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'cancelled'

export type OnErrorAction = 'fail' | 'continue' | 'retry' | 'branch'

export type VariableType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date'

export type ConnectionStatus = 'active' | 'expired' | 'revoked' | 'error'

export type ConditionOperator = 'and' | 'or'

export type ComparisonOperator = 
  | 'equals' | 'eq'
  | 'not_equals' | 'ne'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than' | 'gt'
  | 'greater_than_or_equals' | 'gte'
  | 'less_than' | 'lt'
  | 'less_than_or_equals' | 'lte'
  | 'is_empty'
  | 'is_not_empty'
  | 'in'
  | 'not_in'

// ============================================================================
// WORKFLOWS
// ============================================================================

export interface Workflow {
  id: string
  site_id: string
  agency_id?: string | null
  
  // Metadata
  name: string
  description?: string | null
  slug: string
  icon: string
  color: string
  category: string
  tags: string[]
  
  // Trigger configuration
  trigger_type: TriggerType
  trigger_config: TriggerConfig
  
  // Execution settings
  is_active: boolean
  run_once: boolean
  max_executions_per_hour: number
  timeout_seconds: number
  retry_on_failure: boolean
  max_retries: number
  
  // Stats
  total_runs: number
  successful_runs: number
  failed_runs: number
  last_run_at?: string | null
  last_success_at?: string | null
  last_error_at?: string | null
  last_error?: string | null
  
  // Audit
  created_by?: string | null
  updated_by?: string | null
  created_at: string
  updated_at: string
  
  // Relations (when joined)
  steps?: WorkflowStep[]
  subscriptions?: EventSubscription[]
  recent_executions?: WorkflowExecution[]
}

export interface TriggerConfig {
  // For 'event' trigger
  event_type?: string
  source_module?: string
  filter?: Record<string, unknown>
  
  // For 'schedule' trigger
  cron?: string
  timezone?: string
  
  // For 'webhook' trigger
  endpoint_path?: string
  secret_key?: string
  
  // For 'form_submission' trigger
  form_id?: string
  
  // Additional config
  [key: string]: unknown
}

export type WorkflowInput = Omit<Workflow, 'id' | 'created_at' | 'updated_at' | 'steps' | 'subscriptions' | 'recent_executions' | 'total_runs' | 'successful_runs' | 'failed_runs' | 'last_run_at' | 'last_success_at' | 'last_error_at' | 'last_error'>
export type WorkflowUpdate = Partial<WorkflowInput>

// ============================================================================
// WORKFLOW STEPS
// ============================================================================

export interface WorkflowStep {
  id: string
  workflow_id: string
  
  // Position
  position: number
  
  // Step type
  step_type: StepType
  
  // Action details (when step_type = 'action')
  action_type?: string | null
  action_config: Record<string, unknown>
  
  // Condition config
  condition_config: ConditionConfig
  
  // Delay config
  delay_config: DelayConfig
  
  // Loop config
  loop_config: LoopConfig
  
  // Parallel config
  parallel_config: ParallelConfig
  
  // Input/Output mapping
  input_mapping: Record<string, unknown>
  output_key?: string | null
  
  // Error handling
  on_error: OnErrorAction
  error_branch_step_id?: string | null
  max_retries: number
  retry_delay_seconds: number
  
  // Metadata
  name?: string | null
  description?: string | null
  is_active: boolean
  
  created_at: string
  updated_at: string
}

export interface ConditionConfig {
  operator?: ConditionOperator
  conditions?: ConditionRule[]
}

export interface ConditionRule {
  field: string
  operator: ComparisonOperator
  value: unknown
}

export interface DelayConfig {
  type?: 'fixed' | 'until' | 'expression'
  value?: string  // e.g., '5m', '1h', '1d', ISO date, or expression
}

export interface LoopConfig {
  source?: string  // e.g., '{{items}}'
  itemVariable?: string
  maxIterations?: number
}

export interface ParallelConfig {
  branches?: Array<{
    steps: WorkflowStep[]
  }>
  waitForAll?: boolean
}

export type WorkflowStepInput = Omit<WorkflowStep, 'id' | 'created_at' | 'updated_at'>
export type WorkflowStepUpdate = Partial<WorkflowStepInput>

// ============================================================================
// WORKFLOW EXECUTIONS
// ============================================================================

export interface WorkflowExecution {
  id: string
  workflow_id: string
  site_id: string
  
  // Status
  status: ExecutionStatus
  
  // Trigger info
  trigger_type: TriggerType
  trigger_event_id?: string | null
  trigger_data: Record<string, unknown>
  
  // Execution context
  context: ExecutionContext
  current_step_id?: string | null
  current_step_index: number
  
  // Timing
  started_at?: string | null
  completed_at?: string | null
  paused_at?: string | null
  resume_at?: string | null
  
  // Results
  output: Record<string, unknown>
  error?: string | null
  error_details?: Record<string, unknown> | null
  
  // Retry tracking
  attempt_number: number
  parent_execution_id?: string | null
  
  // Stats
  steps_completed: number
  steps_total: number
  duration_ms?: number | null
  
  created_at: string
  
  // Relations (when joined)
  workflow?: Workflow
  step_logs?: StepExecutionLog[]
}

export interface ExecutionContext {
  trigger: Record<string, unknown>
  steps: Record<string, unknown>
  variables: Record<string, unknown>
  execution?: {
    id: string
    workflowId: string
    siteId: string
    startedAt: string
  }
}

// ============================================================================
// STEP EXECUTION LOGS
// ============================================================================

export interface StepExecutionLog {
  id: string
  execution_id: string
  step_id: string
  
  // Status
  status: StepStatus
  
  // Input/Output
  input_data: Record<string, unknown>
  output_data: Record<string, unknown>
  
  // Timing
  started_at?: string | null
  completed_at?: string | null
  duration_ms?: number | null
  
  // Errors
  error?: string | null
  error_stack?: string | null
  error_code?: string | null
  
  // Metadata
  attempt_number: number
  notes?: string | null
  
  created_at: string
}

// ============================================================================
// WORKFLOW VARIABLES
// ============================================================================

export interface WorkflowVariable {
  id: string
  workflow_id: string
  
  key: string
  value: unknown
  value_type: VariableType
  
  description?: string | null
  is_secret: boolean
  
  created_at: string
  updated_at: string
}

export type WorkflowVariableInput = Omit<WorkflowVariable, 'id' | 'created_at' | 'updated_at'>
export type WorkflowVariableUpdate = Partial<WorkflowVariableInput>

// ============================================================================
// EVENT SUBSCRIPTIONS
// ============================================================================

export interface EventSubscription {
  id: string
  site_id: string
  workflow_id: string
  
  // Event matching
  event_type: string
  source_module?: string | null
  event_filter: Record<string, unknown>
  
  // Status
  is_active: boolean
  
  // Stats
  events_received: number
  last_event_at?: string | null
  
  created_at: string
  updated_at: string
}

export type EventSubscriptionInput = Omit<EventSubscription, 'id' | 'created_at' | 'updated_at' | 'events_received' | 'last_event_at'>
export type EventSubscriptionUpdate = Partial<EventSubscriptionInput>

// ============================================================================
// AUTOMATION EVENTS LOG
// ============================================================================

export interface AutomationEventLog {
  id: string
  site_id: string
  
  // Link to source
  source_event_id?: string | null
  
  // Event details
  event_type: string
  source_module?: string | null
  source_entity_type?: string | null
  source_entity_id?: string | null
  
  // Payload
  payload: Record<string, unknown>
  
  // Processing status
  processed: boolean
  processed_at?: string | null
  workflows_triggered: number
  
  created_at: string
}

// ============================================================================
// SCHEDULED JOBS
// ============================================================================

export interface ScheduledJob {
  id: string
  site_id: string
  workflow_id: string
  
  // Schedule
  cron_expression: string
  timezone: string
  
  // Status
  is_active: boolean
  last_run_at?: string | null
  next_run_at?: string | null
  last_status?: string | null
  consecutive_failures: number
  
  // Limits
  max_consecutive_failures: number
  
  created_at: string
  updated_at: string
}

export type ScheduledJobInput = Omit<ScheduledJob, 'id' | 'created_at' | 'updated_at' | 'last_run_at' | 'next_run_at' | 'last_status' | 'consecutive_failures'>
export type ScheduledJobUpdate = Partial<ScheduledJobInput>

// ============================================================================
// CONNECTIONS
// ============================================================================

export interface AutomationConnection {
  id: string
  site_id: string
  
  // Connection type
  service_type: string
  name: string
  description?: string | null
  
  // Credentials (should be encrypted at rest)
  credentials: Record<string, unknown>
  
  // OAuth tokens
  oauth_access_token?: string | null
  oauth_refresh_token?: string | null
  oauth_expires_at?: string | null
  
  // Status
  status: ConnectionStatus
  last_used_at?: string | null
  last_error?: string | null
  
  // Audit
  created_by?: string | null
  created_at: string
  updated_at: string
}

export type AutomationConnectionInput = Omit<AutomationConnection, 'id' | 'created_at' | 'updated_at' | 'last_used_at' | 'last_error'>
export type AutomationConnectionUpdate = Partial<AutomationConnectionInput>

// ============================================================================
// WEBHOOK ENDPOINTS
// ============================================================================

export interface WebhookEndpoint {
  id: string
  site_id: string
  workflow_id: string
  
  // Endpoint configuration
  endpoint_path: string
  secret_key: string
  
  // Allowed methods
  allowed_methods: string[]
  
  // IP restrictions
  allowed_ips?: string[] | null
  
  // Stats
  total_calls: number
  last_called_at?: string | null
  
  // Status
  is_active: boolean
  
  created_at: string
}

export type WebhookEndpointInput = Omit<WebhookEndpoint, 'id' | 'created_at' | 'total_calls' | 'last_called_at'>
export type WebhookEndpointUpdate = Partial<WebhookEndpointInput>

// ============================================================================
// ACTION RESULT
// ============================================================================

export interface ActionResult {
  status: 'completed' | 'failed' | 'paused' | 'skipped'
  output?: unknown
  error?: string
  resumeAt?: string
  branchIndex?: number
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface WorkflowsResponse {
  success: boolean
  workflows?: Workflow[]
  error?: string
}

export interface WorkflowResponse {
  success: boolean
  workflow?: Workflow
  error?: string
}

export interface ExecutionsResponse {
  success: boolean
  executions?: WorkflowExecution[]
  error?: string
}

export interface ConnectionsResponse {
  success: boolean
  connections?: AutomationConnection[]
  error?: string
}

export interface TriggerResponse {
  success: boolean
  executionId?: string
  error?: string
}

// ============================================================================
// AUTOMATION EVENT INTERFACE
// ============================================================================

export interface AutomationEvent {
  id: string
  type: string
  siteId: string
  sourceModule: string
  entityType: string
  entityId: string
  payload: Record<string, unknown>
  metadata: {
    userId?: string
    timestamp: string
    version: string
  }
}
