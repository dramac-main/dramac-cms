/**
 * Automation Module UI Components Index
 * 
 * PHASE-UI-12A: Automation Workflow Builder UI
 * PHASE-UI-12B: Automation Logs & Analytics UI
 * 
 * Barrel export for all enhanced UI components.
 */

// PHASE-UI-12A: Workflow Builder UI Components
export { WorkflowStepCard } from "./workflow-step-card"
export { WorkflowMiniMap } from "./workflow-mini-map"
export { ActionSearchPalette } from "./action-search-palette"
export { TriggerCard } from "./trigger-card"
export { StepConnectionLine, HorizontalConnectionLine } from "./step-connection-line"
export { WorkflowHeader } from "./workflow-header"

// PHASE-UI-12B: Logs & Analytics UI Components
export { ExecutionTimeline } from "./execution-timeline"
export { ExecutionLogCard } from "./execution-log-card"
export { 
  AnalyticsMetricCard,
  ExecutionsMetricCard,
  SuccessRateMetricCard,
  AvgDurationMetricCard,
  ActiveWorkflowsMetricCard
} from "./analytics-metric-card"
export { WorkflowPerformanceChart } from "./workflow-performance-chart"
export { ExecutionFilterBar, type ExecutionFilters } from "./execution-filter-bar"
