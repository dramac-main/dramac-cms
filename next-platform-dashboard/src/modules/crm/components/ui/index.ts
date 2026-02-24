/**
 * CRM UI Components Index
 * 
 * PHASE-UI-10A & PHASE-UI-10B: CRM Module UI Overhaul
 * 
 * Barrel exports for all CRM UI enhancement components.
 */

// =============================================================================
// PHASE-UI-10A: CRM Dashboard Components
// =============================================================================

export { CRMHeader } from './crm-header'
export type { CRMHeaderProps, TimeRange } from './crm-header'

export { CRMMetricCards, useCRMMetrics } from './crm-metric-cards'
export type { CRMMetric } from './crm-metric-cards'

export { CRMQuickFilters } from './crm-quick-filters'
export type { 
  CRMQuickFiltersProps, 
  FilterValue, 
  FilterOption, 
  SavedFilter 
} from './crm-quick-filters'

export { ContactsTable } from './contacts-table'
export type { 
  ContactsTableProps, 
  SortField, 
  SortDirection 
} from './contacts-table'

export { CRMActivityFeed } from './crm-activity-feed'
export type { CRMActivityFeedProps } from './crm-activity-feed'

// =============================================================================
// PHASE-UI-10B: Pipeline & Deals Components
// =============================================================================

export { DealCard } from './deal-card'
export type { DealCardProps } from './deal-card'

// Note: Renamed to avoid conflict with PipelineStage type from crm-types
export { PipelineStage as PipelineStageColumn } from './pipeline-stage'
export type { PipelineStageProps } from './pipeline-stage'

export { PipelineBoard } from './pipeline-board'
export type { PipelineBoardProps } from './pipeline-board'

export { PipelineAnalytics } from './pipeline-analytics'
export type { PipelineAnalyticsProps } from './pipeline-analytics'

export { DealQuickView } from './deal-quick-view'
export type { DealQuickViewProps } from './deal-quick-view'

// =============================================================================
// CRM ENHANCEMENT: New Components
// =============================================================================

export { ContactTimeline } from './contact-timeline'
export { BulkActionBar } from './bulk-action-bar'
export { LeadScoringSettings } from './lead-scoring-settings'
