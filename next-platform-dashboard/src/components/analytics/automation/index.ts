/**
 * Automation Analytics Components - Barrel Export
 * 
 * PHASE-DS-03C: Automation Analytics Dashboard
 * Re-exports all automation analytics components
 */

// Execution Metrics
export {
  ExecutionOverviewCards,
  ExecutionTrendChart,
  ExecutionLineChart,
  ExecutionsByStatusChart,
  ExecutionDurationChart,
  ExecutionSummaryCompact,
} from "./execution-metrics";

// Workflow Performance
export {
  WorkflowMetricsCards,
  WorkflowPerformanceTable,
  WorkflowPerformanceChart,
  WorkflowsByCategoryChart,
  WorkflowsByTriggerChart,
  SuccessRateRadialChart,
  WorkflowSummaryCompact,
} from "./workflow-performance";

// Error Analytics
export {
  ErrorMetricsCards,
  ErrorsByTypeChart,
  ErrorsByTypeBarChart,
  ErrorTrendChart,
  RecentErrorsList,
  AffectedWorkflowsList,
  ErrorSummaryCompact,
} from "./error-analytics";

// Timing Analytics
export {
  TimingMetricsCards,
  ExecutionsByHourChart,
  ExecutionsByDayChart,
  SuccessRateByDayChart,
  DurationDistributionChart,
  DurationPieChart,
  AvgDurationByHourChart,
  TimingSummaryCompact,
} from "./timing-analytics";

// Trigger Analytics
export {
  TriggerMetricsCards,
  TriggerTrendChart,
  TriggerPerformanceTable,
  TriggerDistributionChart,
  StepAnalyticsChart,
  ActionsByTypeChart,
  TriggerSummaryCompact,
} from "./trigger-analytics";
