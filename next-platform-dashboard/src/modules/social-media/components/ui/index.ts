// =============================================================================
// SOCIAL MEDIA UI COMPONENTS BARREL EXPORT
// =============================================================================

/**
 * PHASE-UI-11A: Social Media Dashboard UI Overhaul
 * 
 * This module exports enhanced UI components for the Social Media module.
 * Built on top of existing chart and feedback components.
 * 
 * @module @/modules/social-media/components/ui
 * @version 1.0.0
 */

// Metric Cards
export {
  SocialMetricCard,
  SocialMetricCardCompact,
  type SocialMetricCardProps,
  type SocialMetricCardCompactProps,
} from './social-metric-card'

// Engagement Chart
export {
  SocialEngagementChart,
  type SocialEngagementChartProps,
  type EngagementDataPoint,
} from './social-engagement-chart'

// Platform Breakdown
export {
  PlatformBreakdown,
  type PlatformBreakdownProps,
  type PlatformDataPoint,
} from './platform-breakdown'

// Top Posts Widget
export {
  TopPostsWidget,
  type TopPostsWidgetProps,
} from './top-posts-widget'

// Audience Growth Chart
export {
  AudienceGrowthChart,
  type AudienceGrowthChartProps,
  type AudienceDataPoint,
} from './audience-growth-chart'

// Quick Actions
export {
  SocialQuickActions,
  SocialQuickActionsCompact,
  getDefaultSocialActions,
  type SocialQuickActionsProps,
  type SocialQuickActionsCompactProps,
  type QuickAction,
} from './social-quick-actions'

// =============================================================================
// PHASE-UI-11B: Calendar & Composer Components
// =============================================================================

// Calendar Day Cell
export {
  CalendarDayCell,
} from './calendar-day-cell'

// Calendar Post Card
export {
  CalendarPostCard,
} from './calendar-post-card'

// Calendar Week View
export {
  CalendarWeekView,
} from './calendar-week-view'

// Composer Platform Preview
export {
  ComposerPlatformPreview,
} from './composer-platform-preview'

// Composer Media Uploader
export {
  ComposerMediaUploader,
} from './composer-media-uploader'

// Composer Scheduling Panel
export {
  ComposerSchedulingPanel,
} from './composer-scheduling-panel'