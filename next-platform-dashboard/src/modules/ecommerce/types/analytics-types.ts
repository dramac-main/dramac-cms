/**
 * Analytics & Reports Types
 * 
 * Phase ECOM-41A: Analytics & Reports - Schema & Server Actions
 * 
 * Type definitions for analytics, reports, and business intelligence.
 */

// ============================================================================
// DATE RANGE TYPES
// ============================================================================

export type DateRangePreset = 
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'last_quarter'
  | 'this_year'
  | 'last_year'
  | 'custom'

export interface DateRange {
  start: string  // ISO date string
  end: string    // ISO date string
  preset?: DateRangePreset
}

export type GroupByPeriod = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'

export type ReportType = 'sales' | 'products' | 'customers' | 'inventory' | 'orders' | 'custom'

export type ExportFormat = 'csv' | 'xlsx' | 'pdf' | 'json'

// ============================================================================
// SALES ANALYTICS
// ============================================================================

export interface SalesOverview {
  revenue: number            // Total revenue in cents
  orders: number             // Total orders
  average_order_value: number // AOV in cents
  products_sold: number      // Total items sold
  
  // Comparison to previous period
  revenue_change: number     // Percentage change
  orders_change: number
  aov_change: number
  
  // Additional metrics
  gross_profit: number       // Revenue - cost
  gross_margin: number       // Percentage
  refunds: number            // Refund amount
  refund_count: number       // Number of refunds
  net_revenue: number        // Revenue - refunds
}

export interface SalesByPeriod {
  period: string             // Date/week/month label
  revenue: number
  orders: number
  average_order_value: number
  products_sold: number
}

export interface SalesByChannel {
  channel: string            // 'website', 'quote', 'manual', 'api'
  revenue: number
  orders: number
  percentage: number         // Of total revenue
}

export interface RevenueBreakdown {
  gross_revenue: number
  discounts: number
  shipping_collected: number
  tax_collected: number
  refunds: number
  net_revenue: number
}

export interface SalesAnalytics {
  overview: SalesOverview
  by_period: SalesByPeriod[]
  by_channel: SalesByChannel[]
  revenue_breakdown: RevenueBreakdown
}

// ============================================================================
// PRODUCT ANALYTICS
// ============================================================================

export interface ProductPerformance {
  product_id: string
  product_name: string
  sku: string | null
  category_name: string | null
  image_url: string | null
  
  // Sales metrics
  quantity_sold: number
  revenue: number
  orders: number
  average_price: number
  
  // Performance metrics
  views: number              // If tracking enabled
  conversion_rate: number    // Orders / views
  return_rate: number        // Returns / quantity sold
  
  // Stock
  current_stock: number
  days_of_stock: number      // Estimated based on velocity
  
  // Ranking
  revenue_rank: number
  quantity_rank: number
}

export interface CategoryPerformance {
  category_id: string
  category_name: string
  
  products_count: number
  quantity_sold: number
  revenue: number
  orders: number
  
  percentage_of_revenue: number
  average_product_price: number
}

export interface TopProductsResult {
  products: ProductPerformance[]
  total_products: number
  period: DateRange
}

// ============================================================================
// CUSTOMER ANALYTICS
// ============================================================================

export interface CustomerInsights {
  total_customers: number
  new_customers: number
  returning_customers: number
  
  repeat_customer_rate: number
  average_orders_per_customer: number
  average_lifetime_value: number
  
  // Growth
  customer_growth_rate: number
  new_customers_change: number
}

export interface CustomerLifetimeValue {
  customer_id: string
  customer_email: string
  customer_name: string | null
  
  total_orders: number
  total_revenue: number
  total_items_purchased: number
  average_order_value: number
  
  first_order_date: string
  last_order_date: string
  days_since_last_order: number
  
  customer_since_days: number
  predicted_ltv: number       // Based on historical patterns
  segment: string             // 'high_value', 'active', 'at_risk', 'churned'
}

export interface CustomerSegment {
  segment: string
  label: string
  description: string
  customer_count: number
  percentage: number
  total_revenue: number
  average_ltv: number
}

export interface CustomerSegmentation {
  segments: CustomerSegment[]
  definitions: {
    high_value: { min_orders: number; min_revenue: number }
    active: { last_order_days: number }
    at_risk: { last_order_days: number }
    churned: { last_order_days: number }
  }
}

export interface NewVsReturning {
  new_customers: {
    count: number
    revenue: number
    orders: number
    average_order_value: number
  }
  returning_customers: {
    count: number
    revenue: number
    orders: number
    average_order_value: number
  }
}

// ============================================================================
// CONVERSION ANALYTICS
// ============================================================================

export interface FunnelStage {
  stage: string              // 'view', 'add_to_cart', 'checkout_started', 'checkout_completed'
  label: string
  count: number
  conversion_rate: number    // To next stage
  drop_off_rate: number      // Percentage that didn't continue
}

export interface ConversionFunnel {
  stages: FunnelStage[]
  overall_conversion_rate: number
  period: DateRange
}

export interface CartAbandonment {
  total_carts: number
  abandoned_carts: number
  abandonment_rate: number
  
  recovered_carts: number
  recovery_rate: number
  
  abandoned_value: number    // Total value of abandoned carts
  recovered_value: number
  
  // By stage
  abandonment_by_stage: Array<{
    stage: string
    count: number
    percentage: number
  }>
}

export interface CheckoutDropoff {
  started: number
  completed: number
  completion_rate: number
  
  // By step
  by_step: Array<{
    step: string             // 'information', 'shipping', 'payment', 'review'
    entered: number
    completed: number
    drop_off_rate: number
  }>
  
  // Common issues
  error_reasons: Array<{
    reason: string
    count: number
    percentage: number
  }>
}

// ============================================================================
// SAVED REPORTS
// ============================================================================

export interface ReportConfig {
  metrics: string[]          // Metrics to include
  dimensions: string[]       // Grouping dimensions
  filters: {
    date_range: DateRange | DateRangePreset
    categories?: string[]
    products?: string[]
    customers?: string[]
    order_status?: string[]
  }
  grouping?: GroupByPeriod
  sort?: {
    field: string
    order: 'asc' | 'desc'
  }
  limit?: number
  comparison?: boolean       // Compare to previous period
}

export interface SavedReport {
  id: string
  site_id: string
  
  name: string
  description: string | null
  type: ReportType
  config: ReportConfig
  
  schedule: 'daily' | 'weekly' | 'monthly' | null
  schedule_day: number | null
  schedule_time: string | null
  recipients: string[]
  
  is_active: boolean
  is_favorite: boolean
  last_generated_at: string | null
  last_export_format: ExportFormat | null
  
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface SavedReportInput {
  name: string
  description?: string
  type: ReportType
  config: ReportConfig
  schedule?: 'daily' | 'weekly' | 'monthly'
  schedule_day?: number
  schedule_time?: string
  recipients?: string[]
  is_favorite?: boolean
}

export interface SavedReportUpdate {
  name?: string
  description?: string
  config?: ReportConfig
  schedule?: 'daily' | 'weekly' | 'monthly' | null
  schedule_day?: number | null
  schedule_time?: string | null
  recipients?: string[]
  is_active?: boolean
  is_favorite?: boolean
}

// ============================================================================
// REPORT HISTORY
// ============================================================================

export interface ReportHistoryEntry {
  id: string
  site_id: string
  report_id: string | null
  
  name: string
  type: ReportType
  config: ReportConfig
  
  status: 'pending' | 'running' | 'completed' | 'failed'
  error_message: string | null
  
  row_count: number | null
  file_url: string | null
  file_format: ExportFormat | null
  file_size: number | null
  
  period_start: string | null
  period_end: string | null
  
  generated_by: string | null
  generated_at: string
}

// ============================================================================
// ANALYTICS SNAPSHOT
// ============================================================================

export interface AnalyticsSnapshot {
  id: string
  site_id: string
  snapshot_date: string
  type: 'daily' | 'weekly' | 'monthly'
  metrics: {
    revenue: number
    orders: number
    average_order_value: number
    products_sold: number
    new_customers: number
    returning_customers: number
    conversion_rate?: number
    cart_abandonment_rate?: number
    top_products?: Array<{ id: string; name: string; revenue: number }>
    top_categories?: Array<{ id: string; name: string; revenue: number }>
  }
  created_at: string
}

// ============================================================================
// CHART DATA TYPES (for Recharts)
// ============================================================================

export interface ChartDataPoint {
  name: string               // X-axis label (date, category, etc.)
  value: number              // Primary value
  [key: string]: string | number  // Additional series
}

export interface PieChartData {
  name: string
  value: number
  fill?: string
}

export interface LineChartData {
  name: string
  [key: string]: string | number
}

// ============================================================================
// DASHBOARD WIDGETS
// ============================================================================

export interface DashboardWidgetConfig {
  type: 'kpi' | 'chart' | 'table' | 'list'
  metric: string
  chart_type?: 'line' | 'bar' | 'area' | 'pie' | 'funnel'
  date_range: DateRangePreset
  comparison?: boolean
}

export interface KPIWidgetData {
  label: string
  value: number
  formatted_value: string
  change: number
  change_type: 'increase' | 'decrease' | 'neutral'
  trend?: number[]           // Sparkline data
}
