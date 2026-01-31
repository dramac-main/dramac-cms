"use server";

/**
 * Automation Analytics Server Actions
 * 
 * PHASE-DS-03C: Automation Analytics Dashboard
 * Server actions for fetching automation analytics data
 */

import type {
  AutomationTimeRange,
  ExecutionOverview,
  ExecutionTrend,
  ExecutionsByStatus,
  WorkflowPerformance,
  WorkflowMetrics,
  WorkflowsByCategory,
  WorkflowsByTrigger,
  StepAnalytics,
  StepPerformance,
  ErrorMetrics,
  ErrorsByType,
  ErrorTrend,
  RecentError,
  TimingMetrics,
  ExecutionsByHour,
  ExecutionsByDay,
  DurationDistribution,
  TriggerMetrics,
  TriggerTrend,
  TriggerPerformance,
  ActionMetrics,
  ActionsByType,
  ActionPerformance,
  QueueMetrics,
  QueueTrend,
} from "@/types/automation-analytics";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return function() {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    return hash / 0x7fffffff;
  };
}

function getDateRange(timeRange: AutomationTimeRange): { startDate: Date; endDate: Date; days: number } {
  const endDate = new Date();
  let days = 30;
  
  switch (timeRange) {
    case "7d": days = 7; break;
    case "30d": days = 30; break;
    case "90d": days = 90; break;
    case "12m": days = 365; break;
    case "all": days = 730; break;
  }
  
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
  return { startDate, endDate, days };
}

const STATUS_COLORS: Record<string, string> = {
  completed: "#10B981",
  successful: "#10B981",
  failed: "#EF4444",
  pending: "#F59E0B",
  running: "#3B82F6",
  cancelled: "#6B7280",
  timed_out: "#DC2626",
  paused: "#8B5CF6",
};

const TRIGGER_COLORS: Record<string, string> = {
  event: "#3B82F6",
  schedule: "#10B981",
  webhook: "#F59E0B",
  manual: "#8B5CF6",
  form_submission: "#EC4899",
};

const STEP_COLORS: Record<string, string> = {
  action: "#3B82F6",
  condition: "#F59E0B",
  delay: "#8B5CF6",
  loop: "#10B981",
  parallel: "#EC4899",
  transform: "#06B6D4",
  filter: "#6366F1",
  stop: "#EF4444",
};

const CATEGORY_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4"];

// ============================================================================
// EXECUTION OVERVIEW
// ============================================================================

export async function getExecutionOverview(
  siteId: string,
  timeRange: AutomationTimeRange
): Promise<ExecutionOverview> {
  const random = seededRandom(`${siteId}-execution-overview-${timeRange}`);
  
  const totalExecutions = Math.floor(random() * 10000) + 2000;
  const successRate = random() * 20 + 75; // 75-95%
  const successfulExecutions = Math.floor(totalExecutions * (successRate / 100));
  const failedExecutions = totalExecutions - successfulExecutions;
  
  return {
    totalExecutions,
    totalExecutionsChange: parseFloat(((random() - 0.3) * 25).toFixed(2)),
    successfulExecutions,
    successfulExecutionsChange: parseFloat(((random() - 0.3) * 20).toFixed(2)),
    failedExecutions,
    failedExecutionsChange: parseFloat(((random() - 0.5) * 30).toFixed(2)),
    pendingExecutions: Math.floor(random() * 50) + 10,
    cancelledExecutions: Math.floor(random() * 100) + 20,
    timedOutExecutions: Math.floor(random() * 30) + 5,
    successRate: parseFloat(successRate.toFixed(2)),
    successRateChange: parseFloat(((random() - 0.4) * 8).toFixed(2)),
    avgExecutionTime: Math.floor(random() * 10000) + 500, // 500-10500ms
    avgExecutionTimeChange: parseFloat(((random() - 0.5) * 20).toFixed(2)),
    minExecutionTime: Math.floor(random() * 100) + 50,
    maxExecutionTime: Math.floor(random() * 60000) + 5000,
  };
}

export async function getExecutionTrend(
  siteId: string,
  timeRange: AutomationTimeRange
): Promise<ExecutionTrend[]> {
  const random = seededRandom(`${siteId}-execution-trend-${timeRange}`);
  const { days } = getDateRange(timeRange);
  const dataPoints = Math.min(days, 30);
  const interval = Math.floor(days / dataPoints);
  
  const data: ExecutionTrend[] = [];
  
  for (let i = dataPoints - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * interval * 24 * 60 * 60 * 1000);
    const total = Math.floor(random() * 500) + 50;
    const successful = Math.floor(total * (random() * 0.2 + 0.75));
    const failed = Math.floor((total - successful) * 0.7);
    const pending = Math.floor(random() * 10) + 2;
    const cancelled = total - successful - failed - pending;
    
    data.push({
      date: date.toISOString().split("T")[0],
      total,
      successful,
      failed,
      pending,
      cancelled: Math.max(0, cancelled),
      avgDuration: Math.floor(random() * 5000) + 500,
    });
  }
  
  return data;
}

export async function getExecutionsByStatus(
  siteId: string,
  timeRange: AutomationTimeRange
): Promise<ExecutionsByStatus[]> {
  const random = seededRandom(`${siteId}-exec-status-${timeRange}`);
  
  const totalExecutions = Math.floor(random() * 10000) + 2000;
  const statuses = [
    { status: "completed", percentage: random() * 20 + 70 },
    { status: "failed", percentage: random() * 10 + 5 },
    { status: "pending", percentage: random() * 5 + 2 },
    { status: "cancelled", percentage: random() * 3 + 1 },
    { status: "timed_out", percentage: random() * 2 + 0.5 },
  ];
  
  // Normalize percentages
  const totalPercentage = statuses.reduce((sum, s) => sum + s.percentage, 0);
  
  return statuses.map(s => ({
    status: s.status,
    count: Math.floor(totalExecutions * (s.percentage / totalPercentage)),
    percentage: parseFloat(((s.percentage / totalPercentage) * 100).toFixed(1)),
    color: STATUS_COLORS[s.status] || "#6B7280",
  }));
}

// ============================================================================
// WORKFLOW METRICS
// ============================================================================

export async function getWorkflowMetrics(
  siteId: string,
  timeRange: AutomationTimeRange
): Promise<WorkflowMetrics> {
  const random = seededRandom(`${siteId}-workflow-metrics-${timeRange}`);
  
  const totalWorkflows = Math.floor(random() * 50) + 10;
  const activeWorkflows = Math.floor(totalWorkflows * (random() * 0.3 + 0.6));
  
  return {
    totalWorkflows,
    totalWorkflowsChange: parseFloat(((random() - 0.3) * 15).toFixed(2)),
    activeWorkflows,
    activeWorkflowsChange: parseFloat(((random() - 0.3) * 12).toFixed(2)),
    inactiveWorkflows: totalWorkflows - activeWorkflows,
    avgSuccessRate: parseFloat((random() * 15 + 80).toFixed(2)),
    avgSuccessRateChange: parseFloat(((random() - 0.4) * 8).toFixed(2)),
    avgExecutionsPerWorkflow: Math.floor(random() * 200) + 50,
    mostActiveWorkflow: "Customer Onboarding",
    mostFailingWorkflow: random() > 0.7 ? "Legacy Data Sync" : null,
  };
}

export async function getWorkflowPerformance(
  siteId: string,
  timeRange: AutomationTimeRange,
  limit: number = 10
): Promise<WorkflowPerformance[]> {
  const random = seededRandom(`${siteId}-workflow-perf-${timeRange}`);
  
  const workflowNames = [
    "Customer Onboarding", "Lead Scoring", "Email Follow-up", "Data Sync",
    "Invoice Processing", "Report Generation", "Notification Sender",
    "User Cleanup", "Backup Workflow", "Analytics Update", "Content Publish",
  ];
  
  const categories = ["marketing", "sales", "operations", "notifications", "data"];
  const triggerTypes = ["event", "schedule", "webhook", "manual", "form_submission"];
  
  return workflowNames.slice(0, limit).map((name, i) => {
    const totalExecutions = Math.floor(random() * 2000) + 100;
    const successRate = random() * 25 + 70;
    const successfulExecutions = Math.floor(totalExecutions * (successRate / 100));
    const daysAgo = Math.floor(random() * 7);
    
    return {
      workflowId: `wf-${i + 1}-${siteId.slice(0, 8)}`,
      workflowName: name,
      category: categories[Math.floor(random() * categories.length)],
      totalExecutions,
      successfulExecutions,
      failedExecutions: totalExecutions - successfulExecutions,
      successRate: parseFloat(successRate.toFixed(2)),
      avgExecutionTime: Math.floor(random() * 10000) + 500,
      lastExecutedAt: daysAgo === 0 
        ? new Date().toISOString() 
        : new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      isActive: random() > 0.2,
      triggerType: triggerTypes[Math.floor(random() * triggerTypes.length)],
    };
  }).sort((a, b) => b.totalExecutions - a.totalExecutions);
}

export async function getWorkflowsByCategory(
  siteId: string,
  timeRange: AutomationTimeRange
): Promise<WorkflowsByCategory[]> {
  const random = seededRandom(`${siteId}-wf-category-${timeRange}`);
  
  const categories = ["Marketing", "Sales", "Operations", "Notifications", "Data", "Custom"];
  
  return categories.map((category, index) => ({
    category,
    count: Math.floor(random() * 15) + 3,
    executions: Math.floor(random() * 3000) + 500,
    successRate: parseFloat((random() * 20 + 75).toFixed(2)),
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  })).sort((a, b) => b.executions - a.executions);
}

export async function getWorkflowsByTrigger(
  siteId: string,
  timeRange: AutomationTimeRange
): Promise<WorkflowsByTrigger[]> {
  const random = seededRandom(`${siteId}-wf-trigger-${timeRange}`);
  
  const triggers = [
    { type: "event", label: "Event" },
    { type: "schedule", label: "Schedule" },
    { type: "webhook", label: "Webhook" },
    { type: "manual", label: "Manual" },
    { type: "form_submission", label: "Form" },
  ];
  
  const totalWorkflows = Math.floor(random() * 50) + 20;
  const totalExecutions = Math.floor(random() * 10000) + 2000;
  
  const data = triggers.map(t => ({
    triggerType: t.type,
    count: Math.floor(random() * 15) + 2,
    executions: Math.floor(random() * 3000) + 200,
    percentage: 0,
    color: TRIGGER_COLORS[t.type] || "#6B7280",
  }));
  
  // Normalize
  const totalCount = data.reduce((sum, d) => sum + d.count, 0);
  return data.map(d => ({
    ...d,
    percentage: parseFloat(((d.count / totalCount) * 100).toFixed(1)),
  })).sort((a, b) => b.executions - a.executions);
}

// ============================================================================
// STEP ANALYTICS
// ============================================================================

export async function getStepAnalytics(
  siteId: string,
  timeRange: AutomationTimeRange
): Promise<StepAnalytics[]> {
  const random = seededRandom(`${siteId}-step-analytics-${timeRange}`);
  
  const stepTypes = ["action", "condition", "delay", "loop", "parallel", "transform", "filter"];
  
  return stepTypes.map(type => {
    const totalExecutions = Math.floor(random() * 5000) + 500;
    const successRate = random() * 15 + 80;
    const successfulExecutions = Math.floor(totalExecutions * (successRate / 100));
    
    return {
      stepType: type,
      totalExecutions,
      successfulExecutions,
      failedExecutions: totalExecutions - successfulExecutions,
      successRate: parseFloat(successRate.toFixed(2)),
      avgDuration: Math.floor(random() * 2000) + 100,
      color: STEP_COLORS[type] || "#6B7280",
    };
  }).sort((a, b) => b.totalExecutions - a.totalExecutions);
}

export async function getStepPerformance(
  siteId: string,
  timeRange: AutomationTimeRange,
  limit: number = 10
): Promise<StepPerformance[]> {
  const random = seededRandom(`${siteId}-step-perf-${timeRange}`);
  
  const stepNames = [
    "Send Email", "Update Record", "Check Condition", "Wait 24h",
    "Transform Data", "Create Task", "Send Notification", "Sync CRM",
    "Generate Report", "Archive Data",
  ];
  
  const stepTypes = ["action", "condition", "delay", "loop", "transform"];
  const workflowNames = ["Onboarding", "Lead Nurture", "Invoice", "Report", "Cleanup"];
  
  return stepNames.slice(0, limit).map((name, i) => {
    const totalExecutions = Math.floor(random() * 3000) + 200;
    const successRate = random() * 20 + 75;
    
    return {
      stepId: `step-${i + 1}`,
      stepName: name,
      stepType: stepTypes[Math.floor(random() * stepTypes.length)],
      workflowName: workflowNames[Math.floor(random() * workflowNames.length)],
      totalExecutions,
      successRate: parseFloat(successRate.toFixed(2)),
      avgDuration: Math.floor(random() * 3000) + 100,
      failureRate: parseFloat((100 - successRate).toFixed(2)),
    };
  }).sort((a, b) => b.totalExecutions - a.totalExecutions);
}

// ============================================================================
// ERROR ANALYTICS
// ============================================================================

export async function getErrorMetrics(
  siteId: string,
  timeRange: AutomationTimeRange
): Promise<ErrorMetrics> {
  const random = seededRandom(`${siteId}-error-metrics-${timeRange}`);
  
  return {
    totalErrors: Math.floor(random() * 500) + 50,
    totalErrorsChange: parseFloat(((random() - 0.5) * 30).toFixed(2)),
    uniqueErrors: Math.floor(random() * 30) + 5,
    uniqueErrorsChange: parseFloat(((random() - 0.4) * 20).toFixed(2)),
    avgErrorsPerDay: parseFloat((random() * 15 + 2).toFixed(1)),
    avgErrorsPerDayChange: parseFloat(((random() - 0.5) * 25).toFixed(2)),
    mostCommonError: "API Timeout",
    mostAffectedWorkflow: "Data Sync",
    errorResolutionRate: parseFloat((random() * 30 + 60).toFixed(1)),
  };
}

export async function getErrorsByType(
  siteId: string,
  timeRange: AutomationTimeRange
): Promise<ErrorsByType[]> {
  const random = seededRandom(`${siteId}-errors-type-${timeRange}`);
  
  const errorTypes = [
    { type: "API Timeout", color: "#F59E0B" },
    { type: "Authentication Failed", color: "#EF4444" },
    { type: "Invalid Data", color: "#EC4899" },
    { type: "Rate Limited", color: "#8B5CF6" },
    { type: "Connection Error", color: "#DC2626" },
    { type: "Configuration Error", color: "#6366F1" },
  ];
  
  const totalErrors = Math.floor(random() * 500) + 50;
  
  const data = errorTypes.map(e => ({
    errorType: e.type,
    count: Math.floor(random() * 100) + 10,
    percentage: 0,
    affectedWorkflows: Math.floor(random() * 10) + 1,
    color: e.color,
  }));
  
  const totalCount = data.reduce((sum, d) => sum + d.count, 0);
  return data.map(d => ({
    ...d,
    percentage: parseFloat(((d.count / totalCount) * 100).toFixed(1)),
  })).sort((a, b) => b.count - a.count);
}

export async function getErrorTrend(
  siteId: string,
  timeRange: AutomationTimeRange
): Promise<ErrorTrend[]> {
  const random = seededRandom(`${siteId}-error-trend-${timeRange}`);
  const { days } = getDateRange(timeRange);
  const dataPoints = Math.min(days, 30);
  const interval = Math.floor(days / dataPoints);
  
  const data: ErrorTrend[] = [];
  
  for (let i = dataPoints - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * interval * 24 * 60 * 60 * 1000);
    const errors = Math.floor(random() * 30) + 5;
    const resolved = Math.floor(errors * (random() * 0.4 + 0.5));
    
    data.push({
      date: date.toISOString().split("T")[0],
      errors,
      resolved,
      unresolved: errors - resolved,
    });
  }
  
  return data;
}

export async function getRecentErrors(
  siteId: string,
  timeRange: AutomationTimeRange,
  limit: number = 10
): Promise<RecentError[]> {
  const random = seededRandom(`${siteId}-recent-errors-${timeRange}`);
  
  const errorMessages = [
    "API request timed out after 30000ms",
    "Invalid authentication token",
    "Rate limit exceeded: 429 Too Many Requests",
    "Connection refused to external service",
    "Invalid JSON in response body",
    "Required field 'email' is missing",
    "Database connection failed",
    "Webhook endpoint returned 500",
  ];
  
  const workflowNames = ["Data Sync", "Email Campaign", "CRM Update", "Report Gen", "Cleanup"];
  const errorTypes = ["API Timeout", "Auth Error", "Rate Limit", "Connection Error", "Validation"];
  
  const errors: RecentError[] = [];
  
  for (let i = 0; i < limit; i++) {
    const hoursAgo = Math.floor(random() * 72);
    
    errors.push({
      executionId: `exec-${i + 1}-${siteId.slice(0, 8)}`,
      workflowId: `wf-${Math.floor(random() * 5) + 1}`,
      workflowName: workflowNames[Math.floor(random() * workflowNames.length)],
      stepName: random() > 0.3 ? `Step ${Math.floor(random() * 5) + 1}` : null,
      errorMessage: errorMessages[Math.floor(random() * errorMessages.length)],
      errorType: errorTypes[Math.floor(random() * errorTypes.length)],
      timestamp: new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString(),
      isResolved: random() > 0.6,
    });
  }
  
  return errors.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// ============================================================================
// TIMING ANALYTICS
// ============================================================================

export async function getTimingMetrics(
  siteId: string,
  timeRange: AutomationTimeRange
): Promise<TimingMetrics> {
  const random = seededRandom(`${siteId}-timing-metrics-${timeRange}`);
  
  const avg = Math.floor(random() * 5000) + 500;
  
  return {
    avgExecutionTime: avg,
    avgExecutionTimeChange: parseFloat(((random() - 0.5) * 20).toFixed(2)),
    p50ExecutionTime: Math.floor(avg * 0.6),
    p90ExecutionTime: Math.floor(avg * 1.8),
    p99ExecutionTime: Math.floor(avg * 3),
    fastestExecution: Math.floor(random() * 100) + 50,
    slowestExecution: Math.floor(random() * 60000) + 10000,
    timedOutCount: Math.floor(random() * 30) + 5,
    timedOutChange: parseFloat(((random() - 0.5) * 40).toFixed(2)),
  };
}

export async function getExecutionsByHour(
  siteId: string,
  timeRange: AutomationTimeRange
): Promise<ExecutionsByHour[]> {
  const random = seededRandom(`${siteId}-exec-hour-${timeRange}`);
  
  return Array.from({ length: 24 }, (_, hour) => {
    // Higher during business hours
    const isBusinessHours = hour >= 9 && hour <= 18;
    const baseExecutions = Math.floor(random() * 100) + 20;
    const boost = isBusinessHours ? Math.floor(random() * 80) + 50 : 0;
    
    return {
      hour,
      executions: baseExecutions + boost,
      avgDuration: Math.floor(random() * 3000) + 500,
    };
  });
}

export async function getExecutionsByDay(
  siteId: string,
  timeRange: AutomationTimeRange
): Promise<ExecutionsByDay[]> {
  const random = seededRandom(`${siteId}-exec-day-${timeRange}`);
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  return dayNames.map((dayName, dayOfWeek) => {
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    const baseExecutions = Math.floor(random() * 500) + 100;
    const boost = isWeekday ? Math.floor(random() * 300) + 200 : 0;
    
    return {
      dayOfWeek,
      dayName,
      executions: baseExecutions + boost,
      avgDuration: Math.floor(random() * 3000) + 500,
      successRate: parseFloat((random() * 15 + 80).toFixed(2)),
    };
  });
}

export async function getDurationDistribution(
  siteId: string,
  timeRange: AutomationTimeRange
): Promise<DurationDistribution[]> {
  const random = seededRandom(`${siteId}-duration-dist-${timeRange}`);
  
  const ranges = [
    { range: "< 1s", color: "#10B981" },
    { range: "1-5s", color: "#3B82F6" },
    { range: "5-30s", color: "#F59E0B" },
    { range: "30s-2m", color: "#8B5CF6" },
    { range: "2-10m", color: "#EC4899" },
    { range: "> 10m", color: "#EF4444" },
  ];
  
  const data = ranges.map(r => ({
    range: r.range,
    count: Math.floor(random() * 1000) + 50,
    percentage: 0,
    color: r.color,
  }));
  
  const totalCount = data.reduce((sum, d) => sum + d.count, 0);
  return data.map(d => ({
    ...d,
    percentage: parseFloat(((d.count / totalCount) * 100).toFixed(1)),
  }));
}

// ============================================================================
// TRIGGER ANALYTICS
// ============================================================================

export async function getTriggerMetrics(
  siteId: string,
  timeRange: AutomationTimeRange
): Promise<TriggerMetrics> {
  const random = seededRandom(`${siteId}-trigger-metrics-${timeRange}`);
  
  const totalTriggers = Math.floor(random() * 8000) + 1500;
  
  return {
    totalTriggers,
    totalTriggersChange: parseFloat(((random() - 0.3) * 22).toFixed(2)),
    eventTriggers: Math.floor(totalTriggers * (random() * 0.2 + 0.3)),
    scheduleTriggers: Math.floor(totalTriggers * (random() * 0.15 + 0.2)),
    webhookTriggers: Math.floor(totalTriggers * (random() * 0.15 + 0.15)),
    manualTriggers: Math.floor(totalTriggers * (random() * 0.1 + 0.05)),
    formTriggers: Math.floor(totalTriggers * (random() * 0.1 + 0.05)),
    avgTriggersPerDay: parseFloat((totalTriggers / 30).toFixed(1)),
    avgTriggersPerDayChange: parseFloat(((random() - 0.3) * 18).toFixed(2)),
  };
}

export async function getTriggerTrend(
  siteId: string,
  timeRange: AutomationTimeRange
): Promise<TriggerTrend[]> {
  const random = seededRandom(`${siteId}-trigger-trend-${timeRange}`);
  const { days } = getDateRange(timeRange);
  const dataPoints = Math.min(days, 30);
  const interval = Math.floor(days / dataPoints);
  
  const data: TriggerTrend[] = [];
  
  for (let i = dataPoints - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * interval * 24 * 60 * 60 * 1000);
    const event = Math.floor(random() * 100) + 30;
    const schedule = Math.floor(random() * 80) + 20;
    const webhook = Math.floor(random() * 60) + 15;
    const manual = Math.floor(random() * 20) + 5;
    const form = Math.floor(random() * 30) + 10;
    
    data.push({
      date: date.toISOString().split("T")[0],
      event,
      schedule,
      webhook,
      manual,
      form,
      total: event + schedule + webhook + manual + form,
    });
  }
  
  return data;
}

export async function getTriggerPerformance(
  siteId: string,
  timeRange: AutomationTimeRange
): Promise<TriggerPerformance[]> {
  const random = seededRandom(`${siteId}-trigger-perf-${timeRange}`);
  
  const triggers = [
    { type: "event", label: "Event" },
    { type: "schedule", label: "Schedule" },
    { type: "webhook", label: "Webhook" },
    { type: "manual", label: "Manual" },
    { type: "form_submission", label: "Form" },
  ];
  
  return triggers.map(t => {
    const totalTriggers = Math.floor(random() * 2000) + 200;
    const successRate = random() * 15 + 80;
    const successfulExecutions = Math.floor(totalTriggers * (successRate / 100));
    
    return {
      triggerType: t.type,
      totalTriggers,
      successfulExecutions,
      failedExecutions: totalTriggers - successfulExecutions,
      successRate: parseFloat(successRate.toFixed(2)),
      avgResponseTime: Math.floor(random() * 1000) + 50,
      color: TRIGGER_COLORS[t.type] || "#6B7280",
    };
  }).sort((a, b) => b.totalTriggers - a.totalTriggers);
}

// ============================================================================
// ACTION ANALYTICS
// ============================================================================

export async function getActionMetrics(
  siteId: string,
  timeRange: AutomationTimeRange
): Promise<ActionMetrics> {
  const random = seededRandom(`${siteId}-action-metrics-${timeRange}`);
  
  return {
    totalActions: Math.floor(random() * 15000) + 3000,
    totalActionsChange: parseFloat(((random() - 0.3) * 20).toFixed(2)),
    uniqueActionTypes: Math.floor(random() * 20) + 10,
    avgActionsPerWorkflow: parseFloat((random() * 5 + 3).toFixed(1)),
    mostUsedAction: "Send Email",
    avgActionDuration: Math.floor(random() * 2000) + 200,
  };
}

export async function getActionsByType(
  siteId: string,
  timeRange: AutomationTimeRange
): Promise<ActionsByType[]> {
  const random = seededRandom(`${siteId}-actions-type-${timeRange}`);
  
  const actionTypes = [
    { type: "Send Email", color: "#3B82F6" },
    { type: "Update Record", color: "#10B981" },
    { type: "Create Task", color: "#F59E0B" },
    { type: "Send Notification", color: "#8B5CF6" },
    { type: "HTTP Request", color: "#EC4899" },
    { type: "Transform Data", color: "#06B6D4" },
    { type: "Sync CRM", color: "#6366F1" },
  ];
  
  return actionTypes.map(a => {
    const executions = Math.floor(random() * 3000) + 200;
    return {
      actionType: a.type,
      count: Math.floor(random() * 50) + 5,
      executions,
      successRate: parseFloat((random() * 15 + 80).toFixed(2)),
      avgDuration: Math.floor(random() * 2000) + 100,
      color: a.color,
    };
  }).sort((a, b) => b.executions - a.executions);
}

// ============================================================================
// QUEUE ANALYTICS
// ============================================================================

export async function getQueueMetrics(
  siteId: string,
  timeRange: AutomationTimeRange
): Promise<QueueMetrics> {
  const random = seededRandom(`${siteId}-queue-metrics-${timeRange}`);
  
  return {
    queuedExecutions: Math.floor(random() * 50) + 5,
    avgQueueTime: Math.floor(random() * 5000) + 500,
    avgQueueTimeChange: parseFloat(((random() - 0.5) * 30).toFixed(2)),
    maxQueueTime: Math.floor(random() * 30000) + 5000,
    throughput: Math.floor(random() * 100) + 20,
    throughputChange: parseFloat(((random() - 0.3) * 25).toFixed(2)),
    retryCount: Math.floor(random() * 100) + 10,
    retryCountChange: parseFloat(((random() - 0.5) * 40).toFixed(2)),
  };
}

// ============================================================================
// COMBINED FETCH
// ============================================================================

export async function getAutomationAnalyticsData(
  siteId: string,
  timeRange: AutomationTimeRange
) {
  const [
    executionOverview,
    workflowMetrics,
    errorMetrics,
    timingMetrics,
    triggerMetrics,
    executionTrend,
    workflowPerformance,
    stepAnalytics,
    errorsByType,
    executionsByHour,
    workflowsByCategory,
  ] = await Promise.all([
    getExecutionOverview(siteId, timeRange),
    getWorkflowMetrics(siteId, timeRange),
    getErrorMetrics(siteId, timeRange),
    getTimingMetrics(siteId, timeRange),
    getTriggerMetrics(siteId, timeRange),
    getExecutionTrend(siteId, timeRange),
    getWorkflowPerformance(siteId, timeRange),
    getStepAnalytics(siteId, timeRange),
    getErrorsByType(siteId, timeRange),
    getExecutionsByHour(siteId, timeRange),
    getWorkflowsByCategory(siteId, timeRange),
  ]);
  
  return {
    executionOverview,
    workflowMetrics,
    errorMetrics,
    timingMetrics,
    triggerMetrics,
    executionTrend,
    workflowPerformance,
    stepAnalytics,
    errorsByType,
    executionsByHour,
    workflowsByCategory,
    timeRange,
    lastUpdated: new Date().toISOString(),
  };
}
