/**
 * Social Analytics Components Index
 * 
 * PHASE-DS-03B: Social Analytics Dashboard
 * Barrel exports for all social analytics components
 */

// Platform Overview
export {
  PlatformOverviewCards,
  PlatformBreakdownList,
  PlatformFollowersPieChart,
  PlatformComparisonChart,
  EngagementRateComparison,
  PlatformSummaryCompact,
} from "./platform-overview";

// Engagement Analytics
export {
  EngagementMetricsCards,
  EngagementTrendChart,
  EngagementLineChart,
  EngagementByTypeChart,
  EngagementBreakdownList,
  EngagementRateCard,
  EngagementSummaryCompact,
} from "./engagement-analytics";

// Reach Analytics
export {
  ReachMetricsCards,
  ReachSourceBreakdown,
  ReachTrendChart,
  ReachBySourceChart,
  ReachByPlatformChart,
  ReachPieChart,
  ImpressionsReachComparison,
  ReachSummaryCompact,
} from "./reach-analytics";

// Content Analytics
export {
  TopContentList,
  ContentTypePerformanceChart,
  ContentTypeDistribution,
  ContentTypeEngagementRates,
  PostingMetricsCards,
  PostStatusBreakdown,
  PostingTrendChart,
  PostingByPlatformChart,
  ContentSummaryCompact,
} from "./content-analytics";

// Audience Analytics
export {
  AudienceGrowthChart,
  FollowerGainLossChart,
  AudienceGrowthStats,
  AgeDemographicsChart,
  GenderDemographicsChart,
  TopLocationsChart,
  TopLanguagesChart,
  ActivityHeatmap,
  OptimalTimesChart,
  AudienceSummaryCompact,
} from "./audience-analytics";
