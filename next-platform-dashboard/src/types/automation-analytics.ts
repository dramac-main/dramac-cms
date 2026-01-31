/**
 * Automation Analytics Types
 * 
 * PHASE-DS-03C: Automation Analytics Dashboard
 * Extended type definitions for automation analytics components
 */

// ============================================================================
// TIME RANGE TYPES
// ============================================================================

export type AutomationTimeRange = "7d" | "30d" | "90d" | "12m" | "all";

// ============================================================================
// EXECUTION METRICS
// ============================================================================

export interface ExecutionOverview {
  totalExecutions: number;
  totalExecutionsChange: number;
  successfulExecutions: number;
  successfulExecutionsChange: number;
  failedExecutions: number;
  failedExecutionsChange: number;
  pendingExecutions: number;
  cancelledExecutions: number;
  timedOutExecutions: number;
  successRate: number;
  successRateChange: number;
  avgExecutionTime: number;
  avgExecutionTimeChange: number;
  minExecutionTime: number;
  maxExecutionTime: number;
}

export interface ExecutionTrend {
  date: string;
  total: number;
  successful: number;
  failed: number;
  pending: number;
  cancelled: number;
  avgDuration: number;
}

export interface ExecutionsByStatus {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

// ============================================================================
// WORKFLOW PERFORMANCE
// ============================================================================

export interface WorkflowPerformance {
  workflowId: string;
  workflowName: string;
  category: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  successRate: number;
  avgExecutionTime: number;
  lastExecutedAt: string | null;
  isActive: boolean;
  triggerType: string;
}

export interface WorkflowMetrics {
  totalWorkflows: number;
  totalWorkflowsChange: number;
  activeWorkflows: number;
  activeWorkflowsChange: number;
  inactiveWorkflows: number;
  avgSuccessRate: number;
  avgSuccessRateChange: number;
  avgExecutionsPerWorkflow: number;
  mostActiveWorkflow: string | null;
  mostFailingWorkflow: string | null;
}

export interface WorkflowsByCategory {
  category: string;
  count: number;
  executions: number;
  successRate: number;
  color: string;
}

export interface WorkflowsByTrigger {
  triggerType: string;
  count: number;
  executions: number;
  percentage: number;
  color: string;
}

// ============================================================================
// STEP ANALYTICS
// ============================================================================

export interface StepAnalytics {
  stepType: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  successRate: number;
  avgDuration: number;
  color: string;
}

export interface StepPerformance {
  stepId: string;
  stepName: string;
  stepType: string;
  workflowName: string;
  totalExecutions: number;
  successRate: number;
  avgDuration: number;
  failureRate: number;
}

// ============================================================================
// ERROR ANALYTICS
// ============================================================================

export interface ErrorMetrics {
  totalErrors: number;
  totalErrorsChange: number;
  uniqueErrors: number;
  uniqueErrorsChange: number;
  avgErrorsPerDay: number;
  avgErrorsPerDayChange: number;
  mostCommonError: string | null;
  mostAffectedWorkflow: string | null;
  errorResolutionRate: number;
}

export interface ErrorsByType {
  errorType: string;
  count: number;
  percentage: number;
  affectedWorkflows: number;
  color: string;
}

export interface ErrorTrend {
  date: string;
  errors: number;
  resolved: number;
  unresolved: number;
}

export interface RecentError {
  executionId: string;
  workflowId: string;
  workflowName: string;
  stepName: string | null;
  errorMessage: string;
  errorType: string;
  timestamp: string;
  isResolved: boolean;
}

// ============================================================================
// TIMING ANALYTICS
// ============================================================================

export interface TimingMetrics {
  avgExecutionTime: number;
  avgExecutionTimeChange: number;
  p50ExecutionTime: number;
  p90ExecutionTime: number;
  p99ExecutionTime: number;
  fastestExecution: number;
  slowestExecution: number;
  timedOutCount: number;
  timedOutChange: number;
}

export interface ExecutionsByHour {
  hour: number;
  executions: number;
  avgDuration: number;
}

export interface ExecutionsByDay {
  dayOfWeek: number;
  dayName: string;
  executions: number;
  avgDuration: number;
  successRate: number;
}

export interface DurationDistribution {
  range: string;
  count: number;
  percentage: number;
  color: string;
}

// ============================================================================
// TRIGGER ANALYTICS
// ============================================================================

export interface TriggerMetrics {
  totalTriggers: number;
  totalTriggersChange: number;
  eventTriggers: number;
  scheduleTriggers: number;
  webhookTriggers: number;
  manualTriggers: number;
  formTriggers: number;
  avgTriggersPerDay: number;
  avgTriggersPerDayChange: number;
}

export interface TriggerTrend {
  date: string;
  event: number;
  schedule: number;
  webhook: number;
  manual: number;
  form: number;
  total: number;
}

export interface TriggerPerformance {
  triggerType: string;
  totalTriggers: number;
  successfulExecutions: number;
  failedExecutions: number;
  successRate: number;
  avgResponseTime: number;
  color: string;
}

// ============================================================================
// ACTION ANALYTICS
// ============================================================================

export interface ActionMetrics {
  totalActions: number;
  totalActionsChange: number;
  uniqueActionTypes: number;
  avgActionsPerWorkflow: number;
  mostUsedAction: string | null;
  avgActionDuration: number;
}

export interface ActionsByType {
  actionType: string;
  count: number;
  executions: number;
  successRate: number;
  avgDuration: number;
  color: string;
}

export interface ActionPerformance {
  actionType: string;
  totalExecutions: number;
  successRate: number;
  avgDuration: number;
  p95Duration: number;
  errorRate: number;
}

// ============================================================================
// QUEUE ANALYTICS
// ============================================================================

export interface QueueMetrics {
  queuedExecutions: number;
  avgQueueTime: number;
  avgQueueTimeChange: number;
  maxQueueTime: number;
  throughput: number;
  throughputChange: number;
  retryCount: number;
  retryCountChange: number;
}

export interface QueueTrend {
  timestamp: string;
  queued: number;
  processing: number;
  completed: number;
  avgWaitTime: number;
}

// ============================================================================
// COMBINED ANALYTICS
// ============================================================================

export interface AutomationAnalyticsData {
  executionOverview: ExecutionOverview;
  workflowMetrics: WorkflowMetrics;
  errorMetrics: ErrorMetrics;
  timingMetrics: TimingMetrics;
  triggerMetrics: TriggerMetrics;
  executionTrend: ExecutionTrend[];
  workflowPerformance: WorkflowPerformance[];
  stepAnalytics: StepAnalytics[];
  errorsByType: ErrorsByType[];
  executionsByHour: ExecutionsByHour[];
  workflowsByCategory: WorkflowsByCategory[];
  timeRange: AutomationTimeRange;
  lastUpdated: string;
}
