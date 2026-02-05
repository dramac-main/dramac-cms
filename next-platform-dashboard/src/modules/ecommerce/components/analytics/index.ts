/**
 * Analytics Components Index
 * 
 * Phase ECOM-41B: Analytics & Reports - UI Components
 * 
 * Re-exports all analytics components for easy importing.
 */

// Dashboard View
export { AnalyticsDashboardView } from './analytics-dashboard-view'

// Charts
export {
  ChartWrapper,
  RevenueChart,
  OrdersChart,
  SalesByChannelChart,
  TopProductsChart,
  CategoryPerformanceChart,
  CustomerSegmentationChart,
  ConversionFunnelChart
} from './analytics-charts'

export type {
  ChartWrapperProps,
  RevenueChartProps,
  OrdersChartProps,
  SalesByChannelChartProps,
  TopProductsChartProps,
  CategoryPerformanceChartProps,
  CustomerSegmentationChartProps,
  ConversionFunnelChartProps
} from './analytics-charts'

// Cards
export {
  KPICard,
  SalesOverviewCards,
  RevenueBreakdownCard,
  CustomerInsightsCard,
  CartAbandonmentCard,
  MetricTrend
} from './analytics-cards'

export type {
  KPICardProps,
  SalesOverviewCardsProps,
  RevenueBreakdownCardProps,
  CustomerInsightsCardProps,
  CartAbandonmentCardProps,
  MetricTrendProps
} from './analytics-cards'

// Tables
export {
  ProductPerformanceTable,
  CategoryPerformanceTable,
  CustomerLTVTable
} from './analytics-tables'

export type {
  ProductPerformanceTableProps,
  CategoryPerformanceTableProps,
  CustomerLTVTableProps
} from './analytics-tables'

// Date Range Picker
export {
  DateRangePicker,
  GroupBySelector,
  AnalyticsToolbar
} from './date-range-picker'

export type {
  DateRangePickerProps,
  GroupBySelectorProps,
  AnalyticsToolbarProps
} from './date-range-picker'
