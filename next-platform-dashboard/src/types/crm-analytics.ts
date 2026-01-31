/**
 * CRM Analytics Types
 * 
 * PHASE-DS-03A: CRM Analytics Dashboard
 * Type definitions for CRM analytics components
 */

// ============================================================================
// TIME RANGES
// ============================================================================

export type CRMTimeRange = '7d' | '30d' | '90d' | '12m' | '1y' | 'all' | 'custom';

export interface CRMDateRange {
  start: Date;
  end: Date;
}

// ============================================================================
// PIPELINE ANALYTICS
// ============================================================================

export interface PipelineStageMetrics {
  stageId: string;
  stageName: string;
  stagePosition: number;
  dealCount: number;
  dealValue: number;
  avgTimeInStage: number; // days
  conversionRate: number; // percentage to next stage
  color?: string;
}

export interface PipelineOverview {
  pipelineId: string;
  pipelineName: string;
  totalDeals: number;
  totalValue: number;
  avgDealSize: number;
  winRate: number;
  avgSalesCycle: number; // days
  stages: PipelineStageMetrics[];
}

export interface PipelineFunnelData {
  name: string;
  value: number;
  dealCount: number;
  conversionRate: number;
  fill: string;
}

// ============================================================================
// DEAL ANALYTICS
// ============================================================================

export interface DealVelocityData {
  period: string;
  newDeals: number;
  wonDeals: number;
  lostDeals: number;
  dealValue: number;
  wonValue: number;
}

export interface DealsByStatus {
  status: 'open' | 'won' | 'lost';
  count: number;
  value: number;
  avgValue: number;
  percentage: number;
}

export interface DealsBySource {
  source: string;
  dealCount: number;
  dealValue: number;
  winRate: number;
  avgDealSize: number;
}

export interface DealTrend {
  date: string;
  created: number;
  won: number;
  lost: number;
  value: number;
}

// ============================================================================
// CONTACT ANALYTICS
// ============================================================================

export interface ContactMetrics {
  totalContacts: number;
  newContacts: number;
  activeContacts: number;
  qualifiedLeads: number;
  conversionRate: number;
  avgLeadScore: number;
  contactsWithDeals: number;
  contactsTrend: number; // percentage change
}

export interface ContactsBySource {
  source: string;
  count: number;
  percentage: number;
  conversionRate: number;
}

export interface ContactsByStatus {
  status: string;
  count: number;
  percentage: number;
}

export interface LeadScoreDistribution {
  range: string;
  count: number;
  percentage: number;
  minScore: number;
  maxScore: number;
}

export interface ContactGrowth {
  date: string;
  total: number;
  new: number;
  converted: number;
}

// ============================================================================
// ACTIVITY ANALYTICS
// ============================================================================

export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'task';

export interface ActivityMetrics {
  totalActivities: number;
  activitiesThisPeriod: number;
  activitiesTrend: number;
  avgActivitiesPerDeal: number;
  topActivityType: ActivityType;
  responseRate: number;
}

export interface ActivitiesByType {
  type: ActivityType;
  count: number;
  percentage: number;
  trend: number;
}

export interface ActivityTimeline {
  date: string;
  calls: number;
  emails: number;
  meetings: number;
  notes: number;
  tasks: number;
  total: number;
}

export interface TeamActivityMetrics {
  userId: string;
  userName: string;
  userAvatar?: string;
  totalActivities: number;
  deals: number;
  wonDeals: number;
  revenue: number;
}

// ============================================================================
// REVENUE ANALYTICS
// ============================================================================

export interface RevenueMetrics {
  totalRevenue: number;
  revenueTrend: number;
  avgDealValue: number;
  avgDealValueTrend: number;
  projectedRevenue: number;
  pipeline: number;
  wonThisPeriod: number;
  lostThisPeriod: number;
}

export interface RevenueByMonth {
  month: string;
  won: number;
  lost: number;
  projected: number;
  target?: number;
}

export interface RevenueByOwner {
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  revenue: number;
  deals: number;
  avgDealSize: number;
  winRate: number;
}

export interface RevenueForecast {
  month: string;
  committed: number;
  upside: number;
  pipeline: number;
  target: number;
}

// ============================================================================
// COMBINED CRM ANALYTICS
// ============================================================================

export interface CRMAnalyticsData {
  timeRange: CRMTimeRange;
  pipeline: PipelineOverview;
  dealVelocity: DealVelocityData[];
  dealsByStatus: DealsByStatus[];
  contactMetrics: ContactMetrics;
  contactsBySource: ContactsBySource[];
  activityMetrics: ActivityMetrics;
  activitiesByType: ActivitiesByType[];
  revenueMetrics: RevenueMetrics;
  revenueByMonth: RevenueByMonth[];
}

export interface CRMAnalyticsFilters {
  timeRange: CRMTimeRange;
  customRange?: CRMDateRange;
  pipelineId?: string;
  ownerId?: string;
  source?: string;
}
