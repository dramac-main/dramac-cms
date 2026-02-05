# PHASE-ECOM-41A: Analytics & Reports - Schema & Server Actions

> **Priority**: 🟡 MEDIUM
> **Estimated Time**: 6-7 hours
> **Prerequisites**: Waves 1-4 Complete
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Create the database schema and server actions for comprehensive analytics and reporting including sales analytics, product performance, customer insights, conversion funnel tracking, and saved report configurations. This phase establishes the data foundation for business intelligence.

---

## 📋 Pre-Implementation Checklist

- [ ] Read memory bank files (`/memory-bank/*.md`)
- [ ] Review existing analytics-view.tsx component
- [ ] Verify Recharts is installed (check package.json)
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## 🏗️ Architecture Overview

```
Analytics Architecture (Phase 41A)
├── Database Schema
│   ├── mod_ecommod01_analytics_snapshots  → Daily/weekly/monthly metrics
│   └── mod_ecommod01_saved_reports        → User-defined report configs
│
├── Server Actions (analytics-actions.ts)
│   ├── Sales Analytics
│   │   ├── getSalesOverview()        → Key metrics summary
│   │   ├── getSalesByPeriod()        → Time-series data
│   │   ├── getSalesByChannel()       → Channel breakdown
│   │   └── getRevenueBreakdown()     → Revenue components
│   │
│   ├── Product Analytics
│   │   ├── getProductPerformance()   → Product metrics
│   │   ├── getTopProducts()          → Bestsellers
│   │   └── getCategoryPerformance()  → Category breakdown
│   │
│   ├── Customer Analytics
│   │   ├── getCustomerInsights()     → Customer metrics
│   │   ├── getCustomerLifetimeValue()→ CLV calculation
│   │   └── getCustomerSegmentation() → Segments
│   │
│   ├── Conversion Analytics
│   │   ├── getConversionFunnel()     → Funnel stages
│   │   ├── getCartAbandonmentRate()  → Cart abandonment
│   │   └── getCheckoutDropoff()      → Checkout analysis
│   │
│   └── Report Management
│       ├── generateReport()          → Create report
│       ├── scheduleReport()          → Schedule recurring
│       ├── exportReport()            → Export data
│       └── getSavedReports()         → List saved
│
└── Types (analytics-types.ts)
    ├── SalesOverview
    ├── ProductPerformance
    ├── CustomerInsights
    ├── ConversionFunnel
    └── SavedReport
```

---

## 📁 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `migrations/ecom-41-analytics.sql` | Create | Database schema for analytics |
| `src/modules/ecommerce/types/analytics-types.ts` | Create | TypeScript type definitions |
| `src/modules/ecommerce/actions/analytics-actions.ts` | Create | Server actions for analytics |
| `src/modules/ecommerce/lib/analytics-utils.ts` | Create | Utility functions |

---

## 🗃️ Database Migration

**File**: `next-platform-dashboard/migrations/ecom-41-analytics.sql`
**Action**: Create

```sql
-- ============================================================================
-- PHASE-ECOM-41A: Analytics & Reports Database Schema
-- ============================================================================
-- Description: Creates tables for analytics snapshots and saved reports.
-- ============================================================================

-- ============================================================================
-- ANALYTICS SNAPSHOTS TABLE
-- ============================================================================
-- Stores daily/weekly/monthly metric snapshots for historical analysis

CREATE TABLE IF NOT EXISTS mod_ecommod01_analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Snapshot metadata
  snapshot_date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly')),
  
  -- Metrics stored as JSONB for flexibility
  metrics JSONB NOT NULL DEFAULT '{}',
  -- Example metrics structure:
  -- {
  --   "revenue": 125000,           -- in cents
  --   "orders": 45,
  --   "average_order_value": 2778,
  --   "products_sold": 127,
  --   "new_customers": 12,
  --   "returning_customers": 33,
  --   "conversion_rate": 3.2,
  --   "cart_abandonment_rate": 68.5,
  --   "top_products": [...],
  --   "top_categories": [...],
  --   "revenue_by_channel": {...}
  -- }
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one snapshot per date/type per site
  UNIQUE(site_id, snapshot_date, type)
);

-- Indexes for analytics snapshots
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_site 
  ON mod_ecommod01_analytics_snapshots(site_id);
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_date 
  ON mod_ecommod01_analytics_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_type 
  ON mod_ecommod01_analytics_snapshots(type);
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_lookup
  ON mod_ecommod01_analytics_snapshots(site_id, type, snapshot_date DESC);

-- ============================================================================
-- SAVED REPORTS TABLE
-- ============================================================================
-- Stores user-defined report configurations for reuse and scheduling

CREATE TABLE IF NOT EXISTS mod_ecommod01_saved_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Report definition
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('sales', 'products', 'customers', 'inventory', 'orders', 'custom')),
  
  -- Configuration stored as JSONB
  config JSONB NOT NULL DEFAULT '{}',
  -- Example config structure:
  -- {
  --   "metrics": ["revenue", "orders", "aov"],
  --   "dimensions": ["date", "product", "category"],
  --   "filters": {
  --     "date_range": "last_30_days",
  --     "categories": ["uuid1", "uuid2"],
  --     "products": []
  --   },
  --   "grouping": "daily",
  --   "sort": {"field": "revenue", "order": "desc"},
  --   "limit": 100
  -- }
  
  -- Scheduling
  schedule TEXT CHECK (schedule IN ('daily', 'weekly', 'monthly')),
  schedule_day INTEGER, -- Day of week (0-6) or day of month (1-31)
  schedule_time TIME,   -- Time to run
  recipients TEXT[],    -- Email addresses for scheduled reports
  
  -- Report state
  is_active BOOLEAN DEFAULT true,
  is_favorite BOOLEAN DEFAULT false,
  last_generated_at TIMESTAMPTZ,
  last_export_format TEXT,
  
  -- Audit
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for saved reports
CREATE INDEX IF NOT EXISTS idx_saved_reports_site 
  ON mod_ecommod01_saved_reports(site_id);
CREATE INDEX IF NOT EXISTS idx_saved_reports_type 
  ON mod_ecommod01_saved_reports(type);
CREATE INDEX IF NOT EXISTS idx_saved_reports_active 
  ON mod_ecommod01_saved_reports(site_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_saved_reports_scheduled
  ON mod_ecommod01_saved_reports(site_id, schedule) WHERE schedule IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_saved_reports_favorite
  ON mod_ecommod01_saved_reports(site_id, is_favorite) WHERE is_favorite = true;

-- ============================================================================
-- REPORT HISTORY TABLE
-- ============================================================================
-- Tracks generated report history for audit and re-download

CREATE TABLE IF NOT EXISTS mod_ecommod01_report_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  report_id UUID REFERENCES mod_ecommod01_saved_reports(id) ON DELETE SET NULL,
  
  -- Report details
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  config JSONB NOT NULL,
  
  -- Execution details
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error_message TEXT,
  
  -- Output
  row_count INTEGER,
  file_url TEXT,           -- Stored file URL if applicable
  file_format TEXT,        -- 'csv', 'xlsx', 'pdf'
  file_size INTEGER,       -- File size in bytes
  
  -- Period covered
  period_start DATE,
  period_end DATE,
  
  -- Audit
  generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for report history
CREATE INDEX IF NOT EXISTS idx_report_history_site 
  ON mod_ecommod01_report_history(site_id);
CREATE INDEX IF NOT EXISTS idx_report_history_report 
  ON mod_ecommod01_report_history(report_id);
CREATE INDEX IF NOT EXISTS idx_report_history_generated 
  ON mod_ecommod01_report_history(generated_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE mod_ecommod01_analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_saved_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_report_history ENABLE ROW LEVEL SECURITY;

-- Analytics snapshots policies
CREATE POLICY "Users can view analytics for their agency sites"
  ON mod_ecommod01_analytics_snapshots FOR SELECT
  USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN agency_members am ON s.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert analytics for their agency sites"
  ON mod_ecommod01_analytics_snapshots FOR INSERT
  WITH CHECK (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN agency_members am ON s.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

-- Saved reports policies
CREATE POLICY "Users can manage saved reports for their agency sites"
  ON mod_ecommod01_saved_reports FOR ALL
  USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN agency_members am ON s.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

-- Report history policies
CREATE POLICY "Users can view report history for their agency sites"
  ON mod_ecommod01_report_history FOR ALL
  USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN agency_members am ON s.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at for saved_reports
CREATE OR REPLACE FUNCTION update_saved_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_saved_reports_updated_at
  BEFORE UPDATE ON mod_ecommod01_saved_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_reports_updated_at();

-- ============================================================================
-- FUNCTION: Generate daily snapshot
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_daily_analytics_snapshot(
  p_site_id UUID,
  p_date DATE DEFAULT CURRENT_DATE - 1
) RETURNS UUID AS $$
DECLARE
  v_snapshot_id UUID;
  v_metrics JSONB;
  v_revenue BIGINT;
  v_order_count INTEGER;
  v_products_sold INTEGER;
  v_new_customers INTEGER;
  v_returning_customers INTEGER;
BEGIN
  -- Calculate revenue
  SELECT COALESCE(SUM(total), 0), COUNT(*)
  INTO v_revenue, v_order_count
  FROM mod_ecommod01_orders
  WHERE site_id = p_site_id
    AND DATE(created_at) = p_date
    AND status NOT IN ('cancelled', 'refunded');
  
  -- Calculate products sold
  SELECT COALESCE(SUM(oi.quantity), 0)
  INTO v_products_sold
  FROM mod_ecommod01_order_items oi
  JOIN mod_ecommod01_orders o ON o.id = oi.order_id
  WHERE o.site_id = p_site_id
    AND DATE(o.created_at) = p_date
    AND o.status NOT IN ('cancelled', 'refunded');
  
  -- Count new vs returning customers
  SELECT 
    COUNT(*) FILTER (WHERE first_order_date = p_date),
    COUNT(*) FILTER (WHERE first_order_date < p_date)
  INTO v_new_customers, v_returning_customers
  FROM (
    SELECT 
      customer_id,
      MIN(DATE(created_at)) as first_order_date
    FROM mod_ecommod01_orders
    WHERE site_id = p_site_id
      AND customer_id IS NOT NULL
    GROUP BY customer_id
  ) customers
  WHERE EXISTS (
    SELECT 1 FROM mod_ecommod01_orders
    WHERE site_id = p_site_id
      AND customer_id = customers.customer_id
      AND DATE(created_at) = p_date
  );
  
  -- Build metrics JSON
  v_metrics = jsonb_build_object(
    'revenue', v_revenue,
    'orders', v_order_count,
    'average_order_value', CASE WHEN v_order_count > 0 THEN v_revenue / v_order_count ELSE 0 END,
    'products_sold', v_products_sold,
    'new_customers', v_new_customers,
    'returning_customers', v_returning_customers
  );
  
  -- Insert or update snapshot
  INSERT INTO mod_ecommod01_analytics_snapshots (site_id, snapshot_date, type, metrics)
  VALUES (p_site_id, p_date, 'daily', v_metrics)
  ON CONFLICT (site_id, snapshot_date, type)
  DO UPDATE SET metrics = EXCLUDED.metrics
  RETURNING id INTO v_snapshot_id;
  
  RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE mod_ecommod01_analytics_snapshots IS 'Stores daily/weekly/monthly analytics snapshots';
COMMENT ON TABLE mod_ecommod01_saved_reports IS 'User-defined saved report configurations';
COMMENT ON TABLE mod_ecommod01_report_history IS 'History of generated reports';
COMMENT ON FUNCTION generate_daily_analytics_snapshot IS 'Generates daily analytics snapshot for a site';
```

---

## 📋 Implementation Tasks

### Task 41A.1: Create Analytics Types

**File**: `src/modules/ecommerce/types/analytics-types.ts`
**Action**: Create

```typescript
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
```

---

### Task 41A.2: Create Analytics Utilities

**File**: `src/modules/ecommerce/lib/analytics-utils.ts`
**Action**: Create

```typescript
/**
 * Analytics Utilities
 * 
 * Phase ECOM-41A: Analytics & Reports
 * 
 * Helper functions for date ranges, formatting, and calculations.
 * NOTE: No 'use server' - these are pure utility functions.
 */

import { 
  startOfDay, 
  endOfDay, 
  subDays, 
  startOfWeek, 
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  subMonths,
  subQuarters,
  subYears,
  format,
  differenceInDays,
  parseISO
} from 'date-fns'
import type { DateRange, DateRangePreset, GroupByPeriod } from '../types/analytics-types'

// ============================================================================
// DATE RANGE HELPERS
// ============================================================================

/**
 * Convert a preset to actual date range
 */
export function getDateRangeFromPreset(preset: DateRangePreset): DateRange {
  const now = new Date()
  
  switch (preset) {
    case 'today':
      return {
        start: startOfDay(now).toISOString(),
        end: endOfDay(now).toISOString(),
        preset
      }
    
    case 'yesterday':
      const yesterday = subDays(now, 1)
      return {
        start: startOfDay(yesterday).toISOString(),
        end: endOfDay(yesterday).toISOString(),
        preset
      }
    
    case 'last_7_days':
      return {
        start: startOfDay(subDays(now, 6)).toISOString(),
        end: endOfDay(now).toISOString(),
        preset
      }
    
    case 'last_30_days':
      return {
        start: startOfDay(subDays(now, 29)).toISOString(),
        end: endOfDay(now).toISOString(),
        preset
      }
    
    case 'last_90_days':
      return {
        start: startOfDay(subDays(now, 89)).toISOString(),
        end: endOfDay(now).toISOString(),
        preset
      }
    
    case 'this_month':
      return {
        start: startOfMonth(now).toISOString(),
        end: endOfMonth(now).toISOString(),
        preset
      }
    
    case 'last_month':
      const lastMonth = subMonths(now, 1)
      return {
        start: startOfMonth(lastMonth).toISOString(),
        end: endOfMonth(lastMonth).toISOString(),
        preset
      }
    
    case 'this_quarter':
      return {
        start: startOfQuarter(now).toISOString(),
        end: endOfQuarter(now).toISOString(),
        preset
      }
    
    case 'last_quarter':
      const lastQuarter = subQuarters(now, 1)
      return {
        start: startOfQuarter(lastQuarter).toISOString(),
        end: endOfQuarter(lastQuarter).toISOString(),
        preset
      }
    
    case 'this_year':
      return {
        start: startOfYear(now).toISOString(),
        end: endOfYear(now).toISOString(),
        preset
      }
    
    case 'last_year':
      const lastYear = subYears(now, 1)
      return {
        start: startOfYear(lastYear).toISOString(),
        end: endOfYear(lastYear).toISOString(),
        preset
      }
    
    default:
      // Default to last 30 days
      return {
        start: startOfDay(subDays(now, 29)).toISOString(),
        end: endOfDay(now).toISOString(),
        preset: 'last_30_days'
      }
  }
}

/**
 * Get comparison date range (previous period of same length)
 */
export function getComparisonDateRange(dateRange: DateRange): DateRange {
  const start = parseISO(dateRange.start)
  const end = parseISO(dateRange.end)
  const daysDiff = differenceInDays(end, start) + 1
  
  return {
    start: subDays(start, daysDiff).toISOString(),
    end: subDays(start, 1).toISOString()
  }
}

/**
 * Format date range for display
 */
export function formatDateRange(dateRange: DateRange): string {
  const start = parseISO(dateRange.start)
  const end = parseISO(dateRange.end)
  
  if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
    return format(start, 'MMM d, yyyy')
  }
  
  if (format(start, 'yyyy') === format(end, 'yyyy')) {
    if (format(start, 'MMM') === format(end, 'MMM')) {
      return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`
    }
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
  }
  
  return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`
}

/**
 * Get preset label for display
 */
export function getPresetLabel(preset: DateRangePreset): string {
  const labels: Record<DateRangePreset, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    last_7_days: 'Last 7 Days',
    last_30_days: 'Last 30 Days',
    last_90_days: 'Last 90 Days',
    this_month: 'This Month',
    last_month: 'Last Month',
    this_quarter: 'This Quarter',
    last_quarter: 'Last Quarter',
    this_year: 'This Year',
    last_year: 'Last Year',
    custom: 'Custom Range'
  }
  
  return labels[preset] || preset
}

// ============================================================================
// GROUPING HELPERS
// ============================================================================

/**
 * Determine best grouping period based on date range
 */
export function suggestGroupingPeriod(dateRange: DateRange): GroupByPeriod {
  const start = parseISO(dateRange.start)
  const end = parseISO(dateRange.end)
  const days = differenceInDays(end, start)
  
  if (days <= 1) return 'hour'
  if (days <= 14) return 'day'
  if (days <= 60) return 'week'
  if (days <= 365) return 'month'
  return 'quarter'
}

/**
 * Format period label based on grouping
 */
export function formatPeriodLabel(date: string, groupBy: GroupByPeriod): string {
  const d = parseISO(date)
  
  switch (groupBy) {
    case 'hour':
      return format(d, 'h:mm a')
    case 'day':
      return format(d, 'MMM d')
    case 'week':
      return `Week of ${format(startOfWeek(d), 'MMM d')}`
    case 'month':
      return format(d, 'MMM yyyy')
    case 'quarter':
      const q = Math.ceil((d.getMonth() + 1) / 3)
      return `Q${q} ${format(d, 'yyyy')}`
    case 'year':
      return format(d, 'yyyy')
    default:
      return format(d, 'MMM d, yyyy')
  }
}

// ============================================================================
// CALCULATION HELPERS
// ============================================================================

/**
 * Calculate percentage change between two values
 */
export function calculateChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0
  }
  return ((current - previous) / previous) * 100
}

/**
 * Calculate percentage of total
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0
  return (value / total) * 100
}

/**
 * Calculate average
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

/**
 * Calculate conversion rate
 */
export function calculateConversionRate(conversions: number, total: number): number {
  if (total === 0) return 0
  return (conversions / total) * 100
}

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

/**
 * Format currency value
 */
export function formatCurrency(cents: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(cents / 100)
}

/**
 * Format large number with abbreviations
 */
export function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toLocaleString()
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
}

/**
 * Format change indicator
 */
export function formatChange(current: number, previous: number): {
  value: number
  formatted: string
  type: 'increase' | 'decrease' | 'neutral'
} {
  const change = calculateChange(current, previous)
  
  return {
    value: change,
    formatted: formatPercentage(change),
    type: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'neutral'
  }
}

// ============================================================================
// CHART HELPERS
// ============================================================================

/**
 * Generate color palette for charts
 */
export function getChartColors(count: number): string[] {
  const baseColors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // violet
    '#06B6D4', // cyan
    '#F97316', // orange
    '#EC4899', // pink
    '#6366F1', // indigo
    '#14B8A6', // teal
  ]
  
  if (count <= baseColors.length) {
    return baseColors.slice(0, count)
  }
  
  // Generate more colors if needed
  const colors = [...baseColors]
  for (let i = baseColors.length; i < count; i++) {
    const hue = (i * 137.508) % 360 // Golden angle approximation
    colors.push(`hsl(${hue}, 70%, 50%)`)
  }
  
  return colors
}

/**
 * Format chart tooltip value
 */
export function formatTooltipValue(value: number, type: 'currency' | 'number' | 'percentage'): string {
  switch (type) {
    case 'currency':
      return formatCurrency(value)
    case 'percentage':
      return `${value.toFixed(1)}%`
    default:
      return value.toLocaleString()
  }
}

// ============================================================================
// EXPORT HELPERS
// ============================================================================

/**
 * Convert data to CSV format
 */
export function toCSV(data: Record<string, unknown>[], columns: { key: string; label: string }[]): string {
  const header = columns.map(c => `"${c.label}"`).join(',')
  const rows = data.map(row => 
    columns.map(c => {
      const value = row[c.key]
      if (value === null || value === undefined) return ''
      if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`
      return String(value)
    }).join(',')
  )
  
  return [header, ...rows].join('\n')
}

/**
 * Trigger CSV download
 */
export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
```

---

### Task 41A.3: Create Analytics Server Actions

**File**: `src/modules/ecommerce/actions/analytics-actions.ts`
**Action**: Create

```typescript
/**
 * Analytics Server Actions
 * 
 * Phase ECOM-41A: Analytics & Reports - Schema & Server Actions
 * 
 * Server actions for sales analytics, product performance,
 * customer insights, and report management.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { 
  getDateRangeFromPreset, 
  getComparisonDateRange,
  calculateChange,
  calculatePercentage 
} from '../lib/analytics-utils'
import type {
  DateRange,
  DateRangePreset,
  GroupByPeriod,
  SalesOverview,
  SalesByPeriod,
  SalesByChannel,
  RevenueBreakdown,
  SalesAnalytics,
  ProductPerformance,
  TopProductsResult,
  CategoryPerformance,
  CustomerInsights,
  CustomerLifetimeValue,
  CustomerSegmentation,
  NewVsReturning,
  ConversionFunnel,
  CartAbandonment,
  CheckoutDropoff,
  SavedReport,
  SavedReportInput,
  SavedReportUpdate,
  ReportHistoryEntry,
  ReportConfig,
  ExportFormat
} from '../types/analytics-types'

const TABLE_PREFIX = 'mod_ecommod01'

// ============================================================================
// HELPERS
// ============================================================================

async function getModuleClient() {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabase as any
}

function resolveDateRange(range: DateRange | DateRangePreset): DateRange {
  if (typeof range === 'string') {
    return getDateRangeFromPreset(range)
  }
  return range
}

// ============================================================================
// SALES ANALYTICS
// ============================================================================

/**
 * Get sales overview with key metrics
 */
export async function getSalesOverview(
  siteId: string,
  dateRange: DateRange | DateRangePreset = 'last_30_days'
): Promise<SalesOverview> {
  try {
    const supabase = await getModuleClient()
    const range = resolveDateRange(dateRange)
    const comparisonRange = getComparisonDateRange(range)
    
    // Current period metrics
    const { data: currentOrders } = await supabase
      .from(`${TABLE_PREFIX}_orders`)
      .select('id, total, subtotal, tax_amount, shipping_amount, discount_amount, status')
      .eq('site_id', siteId)
      .gte('created_at', range.start)
      .lte('created_at', range.end)
      .not('status', 'in', '("cancelled")')
    
    // Previous period metrics
    const { data: previousOrders } = await supabase
      .from(`${TABLE_PREFIX}_orders`)
      .select('id, total, status')
      .eq('site_id', siteId)
      .gte('created_at', comparisonRange.start)
      .lte('created_at', comparisonRange.end)
      .not('status', 'in', '("cancelled")')
    
    // Calculate current metrics
    const completedOrders = (currentOrders ?? []).filter(o => 
      !['cancelled', 'refunded'].includes(o.status)
    )
    const revenue = completedOrders.reduce((sum, o) => sum + (o.total ?? 0), 0)
    const orders = completedOrders.length
    const aov = orders > 0 ? revenue / orders : 0
    
    // Calculate refunds
    const refundedOrders = (currentOrders ?? []).filter(o => o.status === 'refunded')
    const refunds = refundedOrders.reduce((sum, o) => sum + (o.total ?? 0), 0)
    
    // Products sold
    const { data: orderItems } = await supabase
      .from(`${TABLE_PREFIX}_order_items`)
      .select('quantity, order_id')
      .in('order_id', completedOrders.map(o => o.id))
    
    const productsSold = (orderItems ?? []).reduce((sum, item) => sum + item.quantity, 0)
    
    // Calculate previous metrics for comparison
    const prevCompletedOrders = (previousOrders ?? []).filter(o => 
      !['cancelled', 'refunded'].includes(o.status)
    )
    const prevRevenue = prevCompletedOrders.reduce((sum, o) => sum + (o.total ?? 0), 0)
    const prevOrders = prevCompletedOrders.length
    const prevAov = prevOrders > 0 ? prevRevenue / prevOrders : 0
    
    // Calculate cost (from products)
    const { data: products } = await supabase
      .from(`${TABLE_PREFIX}_products`)
      .select('id, cost_price')
      .eq('site_id', siteId)
    
    const productCosts = new Map((products ?? []).map(p => [p.id, p.cost_price ?? 0]))
    
    // Get order items with product IDs for cost calculation
    const { data: itemsWithProducts } = await supabase
      .from(`${TABLE_PREFIX}_order_items`)
      .select('quantity, product_id, total_price')
      .in('order_id', completedOrders.map(o => o.id))
    
    const totalCost = (itemsWithProducts ?? []).reduce((sum, item) => {
      const unitCost = productCosts.get(item.product_id) ?? 0
      return sum + (unitCost * item.quantity)
    }, 0)
    
    const grossProfit = revenue - totalCost
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0
    
    return {
      revenue,
      orders,
      average_order_value: aov,
      products_sold: productsSold,
      
      revenue_change: calculateChange(revenue, prevRevenue),
      orders_change: calculateChange(orders, prevOrders),
      aov_change: calculateChange(aov, prevAov),
      
      gross_profit: grossProfit,
      gross_margin: grossMargin,
      refunds,
      refund_count: refundedOrders.length,
      net_revenue: revenue - refunds
    }
  } catch (error) {
    console.error('Error getting sales overview:', error)
    return {
      revenue: 0, orders: 0, average_order_value: 0, products_sold: 0,
      revenue_change: 0, orders_change: 0, aov_change: 0,
      gross_profit: 0, gross_margin: 0, refunds: 0, refund_count: 0, net_revenue: 0
    }
  }
}

/**
 * Get sales broken down by time period
 */
export async function getSalesByPeriod(
  siteId: string,
  period: GroupByPeriod = 'day',
  dateRange: DateRange | DateRangePreset = 'last_30_days'
): Promise<SalesByPeriod[]> {
  try {
    const supabase = await getModuleClient()
    const range = resolveDateRange(dateRange)
    
    // Get all orders in range
    const { data: orders } = await supabase
      .from(`${TABLE_PREFIX}_orders`)
      .select('id, total, created_at, status')
      .eq('site_id', siteId)
      .gte('created_at', range.start)
      .lte('created_at', range.end)
      .not('status', 'in', '("cancelled","refunded")')
      .order('created_at', { ascending: true })
    
    // Get order items for product count
    const orderIds = (orders ?? []).map(o => o.id)
    const { data: orderItems } = await supabase
      .from(`${TABLE_PREFIX}_order_items`)
      .select('order_id, quantity')
      .in('order_id', orderIds)
    
    // Create lookup for items by order
    const itemsByOrder = new Map<string, number>()
    for (const item of orderItems ?? []) {
      const current = itemsByOrder.get(item.order_id) ?? 0
      itemsByOrder.set(item.order_id, current + item.quantity)
    }
    
    // Group by period
    const grouped = new Map<string, { revenue: number; orders: number; products: number }>()
    
    for (const order of orders ?? []) {
      const date = new Date(order.created_at)
      let key: string
      
      switch (period) {
        case 'hour':
          key = `${date.toISOString().split('T')[0]}T${date.getHours().toString().padStart(2, '0')}:00`
          break
        case 'day':
          key = date.toISOString().split('T')[0]
          break
        case 'week':
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          key = weekStart.toISOString().split('T')[0]
          break
        case 'month':
          key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
          break
        case 'quarter':
          const quarter = Math.ceil((date.getMonth() + 1) / 3)
          key = `${date.getFullYear()}-Q${quarter}`
          break
        case 'year':
          key = `${date.getFullYear()}`
          break
        default:
          key = date.toISOString().split('T')[0]
      }
      
      const existing = grouped.get(key) ?? { revenue: 0, orders: 0, products: 0 }
      grouped.set(key, {
        revenue: existing.revenue + (order.total ?? 0),
        orders: existing.orders + 1,
        products: existing.products + (itemsByOrder.get(order.id) ?? 0)
      })
    }
    
    // Convert to array and calculate AOV
    return Array.from(grouped.entries()).map(([period, data]) => ({
      period,
      revenue: data.revenue,
      orders: data.orders,
      average_order_value: data.orders > 0 ? data.revenue / data.orders : 0,
      products_sold: data.products
    }))
  } catch (error) {
    console.error('Error getting sales by period:', error)
    return []
  }
}

/**
 * Get sales breakdown by channel/source
 */
export async function getSalesByChannel(
  siteId: string,
  dateRange: DateRange | DateRangePreset = 'last_30_days'
): Promise<SalesByChannel[]> {
  try {
    const supabase = await getModuleClient()
    const range = resolveDateRange(dateRange)
    
    // Get orders with source info
    const { data: orders } = await supabase
      .from(`${TABLE_PREFIX}_orders`)
      .select('total, metadata')
      .eq('site_id', siteId)
      .gte('created_at', range.start)
      .lte('created_at', range.end)
      .not('status', 'in', '("cancelled","refunded")')
    
    // Group by channel
    const byChannel = new Map<string, { revenue: number; orders: number }>()
    let totalRevenue = 0
    
    for (const order of orders ?? []) {
      const channel = order.metadata?.source || order.metadata?.channel || 'website'
      const existing = byChannel.get(channel) ?? { revenue: 0, orders: 0 }
      byChannel.set(channel, {
        revenue: existing.revenue + (order.total ?? 0),
        orders: existing.orders + 1
      })
      totalRevenue += order.total ?? 0
    }
    
    return Array.from(byChannel.entries()).map(([channel, data]) => ({
      channel,
      revenue: data.revenue,
      orders: data.orders,
      percentage: calculatePercentage(data.revenue, totalRevenue)
    })).sort((a, b) => b.revenue - a.revenue)
  } catch (error) {
    console.error('Error getting sales by channel:', error)
    return []
  }
}

/**
 * Get revenue breakdown (gross, discounts, shipping, tax, net)
 */
export async function getRevenueBreakdown(
  siteId: string,
  dateRange: DateRange | DateRangePreset = 'last_30_days'
): Promise<RevenueBreakdown> {
  try {
    const supabase = await getModuleClient()
    const range = resolveDateRange(dateRange)
    
    const { data: orders } = await supabase
      .from(`${TABLE_PREFIX}_orders`)
      .select('subtotal, discount_amount, shipping_amount, tax_amount, total, status')
      .eq('site_id', siteId)
      .gte('created_at', range.start)
      .lte('created_at', range.end)
    
    const completed = (orders ?? []).filter(o => !['cancelled'].includes(o.status))
    const refunded = (orders ?? []).filter(o => o.status === 'refunded')
    
    const grossRevenue = completed.reduce((sum, o) => sum + (o.subtotal ?? 0), 0)
    const discounts = completed.reduce((sum, o) => sum + (o.discount_amount ?? 0), 0)
    const shipping = completed.reduce((sum, o) => sum + (o.shipping_amount ?? 0), 0)
    const tax = completed.reduce((sum, o) => sum + (o.tax_amount ?? 0), 0)
    const refunds = refunded.reduce((sum, o) => sum + (o.total ?? 0), 0)
    
    return {
      gross_revenue: grossRevenue,
      discounts,
      shipping_collected: shipping,
      tax_collected: tax,
      refunds,
      net_revenue: grossRevenue - discounts + shipping + tax - refunds
    }
  } catch (error) {
    console.error('Error getting revenue breakdown:', error)
    return {
      gross_revenue: 0, discounts: 0, shipping_collected: 0,
      tax_collected: 0, refunds: 0, net_revenue: 0
    }
  }
}

// ============================================================================
// PRODUCT ANALYTICS
// ============================================================================

/**
 * Get product performance metrics
 */
export async function getProductPerformance(
  siteId: string,
  dateRange: DateRange | DateRangePreset = 'last_30_days',
  limit: number = 50
): Promise<ProductPerformance[]> {
  try {
    const supabase = await getModuleClient()
    const range = resolveDateRange(dateRange)
    
    // Get order items in range (with completed orders)
    const { data: completedOrders } = await supabase
      .from(`${TABLE_PREFIX}_orders`)
      .select('id')
      .eq('site_id', siteId)
      .gte('created_at', range.start)
      .lte('created_at', range.end)
      .not('status', 'in', '("cancelled","refunded")')
    
    const orderIds = (completedOrders ?? []).map(o => o.id)
    
    const { data: orderItems } = await supabase
      .from(`${TABLE_PREFIX}_order_items`)
      .select('product_id, quantity, total_price, order_id')
      .in('order_id', orderIds)
    
    // Aggregate by product
    const productStats = new Map<string, {
      quantity: number
      revenue: number
      orders: Set<string>
    }>()
    
    for (const item of orderItems ?? []) {
      const existing = productStats.get(item.product_id) ?? {
        quantity: 0,
        revenue: 0,
        orders: new Set()
      }
      existing.quantity += item.quantity
      existing.revenue += item.total_price
      existing.orders.add(item.order_id)
      productStats.set(item.product_id, existing)
    }
    
    // Get product details
    const productIds = Array.from(productStats.keys())
    const { data: products } = await supabase
      .from(`${TABLE_PREFIX}_products`)
      .select(`
        id, name, sku, images, quantity,
        categories:${TABLE_PREFIX}_product_category_links(
          category:${TABLE_PREFIX}_categories(name)
        )
      `)
      .in('id', productIds)
    
    // Build results
    const results: ProductPerformance[] = (products ?? []).map((product, index) => {
      const stats = productStats.get(product.id)!
      const avgPrice = stats.quantity > 0 ? stats.revenue / stats.quantity : 0
      
      // Estimate days of stock based on sales velocity
      const daysInRange = Math.max(1, Math.ceil(
        (new Date(range.end).getTime() - new Date(range.start).getTime()) / (1000 * 60 * 60 * 24)
      ))
      const dailyVelocity = stats.quantity / daysInRange
      const daysOfStock = dailyVelocity > 0 ? Math.floor(product.quantity / dailyVelocity) : 999
      
      return {
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        category_name: product.categories?.[0]?.category?.name ?? null,
        image_url: product.images?.[0] ?? null,
        
        quantity_sold: stats.quantity,
        revenue: stats.revenue,
        orders: stats.orders.size,
        average_price: avgPrice,
        
        views: 0, // Would need tracking implementation
        conversion_rate: 0,
        return_rate: 0,
        
        current_stock: product.quantity,
        days_of_stock: daysOfStock,
        
        revenue_rank: 0, // Will be set after sorting
        quantity_rank: 0
      }
    })
    
    // Sort and rank
    const byRevenue = [...results].sort((a, b) => b.revenue - a.revenue)
    const byQuantity = [...results].sort((a, b) => b.quantity_sold - a.quantity_sold)
    
    byRevenue.forEach((p, i) => { p.revenue_rank = i + 1 })
    byQuantity.forEach((p, i) => { p.quantity_rank = i + 1 })
    
    return byRevenue.slice(0, limit)
  } catch (error) {
    console.error('Error getting product performance:', error)
    return []
  }
}

/**
 * Get top selling products
 */
export async function getTopProducts(
  siteId: string,
  by: 'revenue' | 'quantity' | 'orders' = 'revenue',
  dateRange: DateRange | DateRangePreset = 'last_30_days',
  limit: number = 10
): Promise<TopProductsResult> {
  const products = await getProductPerformance(siteId, dateRange, 100)
  const range = resolveDateRange(dateRange)
  
  // Sort by requested metric
  const sorted = [...products].sort((a, b) => {
    switch (by) {
      case 'quantity':
        return b.quantity_sold - a.quantity_sold
      case 'orders':
        return b.orders - a.orders
      default:
        return b.revenue - a.revenue
    }
  })
  
  return {
    products: sorted.slice(0, limit),
    total_products: products.length,
    period: range
  }
}

/**
 * Get category performance
 */
export async function getCategoryPerformance(
  siteId: string,
  dateRange: DateRange | DateRangePreset = 'last_30_days'
): Promise<CategoryPerformance[]> {
  try {
    const supabase = await getModuleClient()
    const range = resolveDateRange(dateRange)
    
    // Get product performance first
    const products = await getProductPerformance(siteId, dateRange, 1000)
    
    // Get all categories
    const { data: categories } = await supabase
      .from(`${TABLE_PREFIX}_categories`)
      .select('id, name')
      .eq('site_id', siteId)
    
    // Get product-category links
    const { data: links } = await supabase
      .from(`${TABLE_PREFIX}_product_category_links`)
      .select('product_id, category_id')
      .eq('site_id', siteId)
    
    // Build category lookup
    const productCategories = new Map<string, string[]>()
    for (const link of links ?? []) {
      const existing = productCategories.get(link.product_id) ?? []
      existing.push(link.category_id)
      productCategories.set(link.product_id, existing)
    }
    
    // Aggregate by category
    const categoryStats = new Map<string, {
      products: Set<string>
      quantity: number
      revenue: number
      orders: Set<string>
    }>()
    
    let totalRevenue = 0
    
    for (const product of products) {
      const catIds = productCategories.get(product.product_id) ?? ['uncategorized']
      
      for (const catId of catIds) {
        const existing = categoryStats.get(catId) ?? {
          products: new Set(),
          quantity: 0,
          revenue: 0,
          orders: new Set()
        }
        existing.products.add(product.product_id)
        existing.quantity += product.quantity_sold
        existing.revenue += product.revenue
        // Note: orders would double-count if product in multiple categories
        categoryStats.set(catId, existing)
      }
      
      totalRevenue += product.revenue
    }
    
    // Build results
    const categoryMap = new Map((categories ?? []).map(c => [c.id, c.name]))
    
    return Array.from(categoryStats.entries())
      .map(([catId, stats]) => ({
        category_id: catId,
        category_name: categoryMap.get(catId) ?? 'Uncategorized',
        products_count: stats.products.size,
        quantity_sold: stats.quantity,
        revenue: stats.revenue,
        orders: 0, // Would need separate calculation to avoid double-counting
        percentage_of_revenue: calculatePercentage(stats.revenue, totalRevenue),
        average_product_price: stats.quantity > 0 ? stats.revenue / stats.quantity : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
  } catch (error) {
    console.error('Error getting category performance:', error)
    return []
  }
}

// ============================================================================
// CUSTOMER ANALYTICS
// ============================================================================

/**
 * Get customer insights
 */
export async function getCustomerInsights(
  siteId: string,
  dateRange: DateRange | DateRangePreset = 'last_30_days'
): Promise<CustomerInsights> {
  try {
    const supabase = await getModuleClient()
    const range = resolveDateRange(dateRange)
    const comparisonRange = getComparisonDateRange(range)
    
    // Get customers with orders in range
    const { data: currentCustomers } = await supabase
      .from(`${TABLE_PREFIX}_orders`)
      .select('customer_id, total, created_at')
      .eq('site_id', siteId)
      .gte('created_at', range.start)
      .lte('created_at', range.end)
      .not('status', 'in', '("cancelled","refunded")')
      .not('customer_id', 'is', null)
    
    // Get first order date for each customer
    const { data: customerFirstOrders } = await supabase
      .from(`${TABLE_PREFIX}_orders`)
      .select('customer_id, created_at')
      .eq('site_id', siteId)
      .not('customer_id', 'is', null)
      .order('created_at', { ascending: true })
    
    // Build first order lookup
    const firstOrderDate = new Map<string, string>()
    for (const order of customerFirstOrders ?? []) {
      if (!firstOrderDate.has(order.customer_id)) {
        firstOrderDate.set(order.customer_id, order.created_at)
      }
    }
    
    // Count unique customers in period
    const uniqueCustomers = new Set((currentCustomers ?? []).map(o => o.customer_id))
    
    // Categorize as new vs returning
    let newCustomers = 0
    let returningCustomers = 0
    
    for (const customerId of uniqueCustomers) {
      const firstOrder = firstOrderDate.get(customerId)
      if (firstOrder && new Date(firstOrder) >= new Date(range.start)) {
        newCustomers++
      } else {
        returningCustomers++
      }
    }
    
    // Get total customer count
    const { count: totalCustomerCount } = await supabase
      .from(`${TABLE_PREFIX}_customers`)
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteId)
    
    // Previous period comparison
    const { data: prevCustomers } = await supabase
      .from(`${TABLE_PREFIX}_orders`)
      .select('customer_id')
      .eq('site_id', siteId)
      .gte('created_at', comparisonRange.start)
      .lte('created_at', comparisonRange.end)
      .not('customer_id', 'is', null)
    
    const prevUniqueCustomers = new Set((prevCustomers ?? []).map(o => o.customer_id))
    let prevNewCustomers = 0
    for (const customerId of prevUniqueCustomers) {
      const firstOrder = firstOrderDate.get(customerId)
      if (firstOrder && new Date(firstOrder) >= new Date(comparisonRange.start)) {
        prevNewCustomers++
      }
    }
    
    // Calculate metrics
    const totalOrders = (currentCustomers ?? []).length
    const totalRevenue = (currentCustomers ?? []).reduce((sum, o) => sum + (o.total ?? 0), 0)
    const avgOrdersPerCustomer = uniqueCustomers.size > 0 ? totalOrders / uniqueCustomers.size : 0
    const avgLTV = uniqueCustomers.size > 0 ? totalRevenue / uniqueCustomers.size : 0
    const repeatRate = uniqueCustomers.size > 0 ? (returningCustomers / uniqueCustomers.size) * 100 : 0
    
    return {
      total_customers: totalCustomerCount ?? 0,
      new_customers: newCustomers,
      returning_customers: returningCustomers,
      repeat_customer_rate: repeatRate,
      average_orders_per_customer: avgOrdersPerCustomer,
      average_lifetime_value: avgLTV,
      customer_growth_rate: calculateChange(uniqueCustomers.size, prevUniqueCustomers.size),
      new_customers_change: calculateChange(newCustomers, prevNewCustomers)
    }
  } catch (error) {
    console.error('Error getting customer insights:', error)
    return {
      total_customers: 0, new_customers: 0, returning_customers: 0,
      repeat_customer_rate: 0, average_orders_per_customer: 0,
      average_lifetime_value: 0, customer_growth_rate: 0, new_customers_change: 0
    }
  }
}

/**
 * Get customer lifetime value for a specific customer
 */
export async function getCustomerLifetimeValue(
  siteId: string,
  customerId: string
): Promise<CustomerLifetimeValue | null> {
  try {
    const supabase = await getModuleClient()
    
    // Get customer info
    const { data: customer } = await supabase
      .from(`${TABLE_PREFIX}_customers`)
      .select('email, first_name, last_name, created_at')
      .eq('id', customerId)
      .single()
    
    if (!customer) return null
    
    // Get all orders for customer
    const { data: orders } = await supabase
      .from(`${TABLE_PREFIX}_orders`)
      .select('id, total, created_at')
      .eq('site_id', siteId)
      .eq('customer_id', customerId)
      .not('status', 'in', '("cancelled","refunded")')
      .order('created_at', { ascending: true })
    
    if (!orders || orders.length === 0) return null
    
    // Get order items for item count
    const { data: items } = await supabase
      .from(`${TABLE_PREFIX}_order_items`)
      .select('quantity')
      .in('order_id', orders.map(o => o.id))
    
    const totalItems = (items ?? []).reduce((sum, i) => sum + i.quantity, 0)
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total ?? 0), 0)
    const aov = orders.length > 0 ? totalRevenue / orders.length : 0
    
    const firstOrderDate = new Date(orders[0].created_at)
    const lastOrderDate = new Date(orders[orders.length - 1].created_at)
    const daysSinceLastOrder = Math.floor(
      (Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    const customerSinceDays = Math.floor(
      (Date.now() - firstOrderDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    // Simple LTV prediction based on historical patterns
    const ordersPerYear = customerSinceDays > 0 ? (orders.length / customerSinceDays) * 365 : 0
    const predictedLTV = ordersPerYear * aov * 3 // 3-year projection
    
    // Determine segment
    let segment = 'active'
    if (daysSinceLastOrder > 180) segment = 'churned'
    else if (daysSinceLastOrder > 90) segment = 'at_risk'
    else if (totalRevenue > 50000) segment = 'high_value' // $500+
    
    return {
      customer_id: customerId,
      customer_email: customer.email,
      customer_name: customer.first_name 
        ? `${customer.first_name} ${customer.last_name ?? ''}`.trim()
        : null,
      
      total_orders: orders.length,
      total_revenue: totalRevenue,
      total_items_purchased: totalItems,
      average_order_value: aov,
      
      first_order_date: orders[0].created_at,
      last_order_date: orders[orders.length - 1].created_at,
      days_since_last_order: daysSinceLastOrder,
      
      customer_since_days: customerSinceDays,
      predicted_ltv: predictedLTV,
      segment
    }
  } catch (error) {
    console.error('Error getting customer LTV:', error)
    return null
  }
}

/**
 * Get customer segmentation breakdown
 */
export async function getCustomerSegmentation(
  siteId: string
): Promise<CustomerSegmentation> {
  try {
    const supabase = await getModuleClient()
    
    // Get all customers with order summaries
    const { data: customers } = await supabase
      .from(`${TABLE_PREFIX}_customers`)
      .select('id, total_orders, total_spent, last_order_at')
      .eq('site_id', siteId)
    
    const now = Date.now()
    const segments = {
      high_value: { count: 0, revenue: 0 },
      active: { count: 0, revenue: 0 },
      at_risk: { count: 0, revenue: 0 },
      churned: { count: 0, revenue: 0 }
    }
    
    for (const customer of customers ?? []) {
      const daysSinceLastOrder = customer.last_order_at
        ? Math.floor((now - new Date(customer.last_order_at).getTime()) / (1000 * 60 * 60 * 24))
        : 999
      
      let segment: keyof typeof segments
      
      if (customer.total_spent >= 50000) { // $500+
        segment = 'high_value'
      } else if (daysSinceLastOrder <= 90) {
        segment = 'active'
      } else if (daysSinceLastOrder <= 180) {
        segment = 'at_risk'
      } else {
        segment = 'churned'
      }
      
      segments[segment].count++
      segments[segment].revenue += customer.total_spent ?? 0
    }
    
    const totalCustomers = (customers ?? []).length
    
    return {
      segments: [
        {
          segment: 'high_value',
          label: 'High Value',
          description: 'Customers who have spent $500+',
          customer_count: segments.high_value.count,
          percentage: calculatePercentage(segments.high_value.count, totalCustomers),
          total_revenue: segments.high_value.revenue,
          average_ltv: segments.high_value.count > 0 
            ? segments.high_value.revenue / segments.high_value.count : 0
        },
        {
          segment: 'active',
          label: 'Active',
          description: 'Ordered within last 90 days',
          customer_count: segments.active.count,
          percentage: calculatePercentage(segments.active.count, totalCustomers),
          total_revenue: segments.active.revenue,
          average_ltv: segments.active.count > 0 
            ? segments.active.revenue / segments.active.count : 0
        },
        {
          segment: 'at_risk',
          label: 'At Risk',
          description: 'No order in 90-180 days',
          customer_count: segments.at_risk.count,
          percentage: calculatePercentage(segments.at_risk.count, totalCustomers),
          total_revenue: segments.at_risk.revenue,
          average_ltv: segments.at_risk.count > 0 
            ? segments.at_risk.revenue / segments.at_risk.count : 0
        },
        {
          segment: 'churned',
          label: 'Churned',
          description: 'No order in 180+ days',
          customer_count: segments.churned.count,
          percentage: calculatePercentage(segments.churned.count, totalCustomers),
          total_revenue: segments.churned.revenue,
          average_ltv: segments.churned.count > 0 
            ? segments.churned.revenue / segments.churned.count : 0
        }
      ],
      definitions: {
        high_value: { min_orders: 1, min_revenue: 50000 },
        active: { last_order_days: 90 },
        at_risk: { last_order_days: 180 },
        churned: { last_order_days: 180 }
      }
    }
  } catch (error) {
    console.error('Error getting customer segmentation:', error)
    return {
      segments: [],
      definitions: {
        high_value: { min_orders: 1, min_revenue: 50000 },
        active: { last_order_days: 90 },
        at_risk: { last_order_days: 180 },
        churned: { last_order_days: 180 }
      }
    }
  }
}

// ============================================================================
// CONVERSION ANALYTICS
// ============================================================================

/**
 * Get conversion funnel data
 */
export async function getConversionFunnel(
  siteId: string,
  dateRange: DateRange | DateRangePreset = 'last_30_days'
): Promise<ConversionFunnel> {
  try {
    const supabase = await getModuleClient()
    const range = resolveDateRange(dateRange)
    
    // Get cart and order counts
    const { count: totalCarts } = await supabase
      .from(`${TABLE_PREFIX}_carts`)
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .gte('created_at', range.start)
      .lte('created_at', range.end)
    
    const { count: convertedCarts } = await supabase
      .from(`${TABLE_PREFIX}_carts`)
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .eq('status', 'converted')
      .gte('created_at', range.start)
      .lte('created_at', range.end)
    
    const { count: completedOrders } = await supabase
      .from(`${TABLE_PREFIX}_orders`)
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .gte('created_at', range.start)
      .lte('created_at', range.end)
      .not('status', 'in', '("cancelled")')
    
    const cartsCreated = totalCarts ?? 0
    const checkoutsStarted = convertedCarts ?? Math.floor(cartsCreated * 0.4) // Estimate if no tracking
    const ordersCompleted = completedOrders ?? 0
    
    // Build funnel stages
    const stages = [
      {
        stage: 'add_to_cart',
        label: 'Added to Cart',
        count: cartsCreated,
        conversion_rate: 100,
        drop_off_rate: 0
      },
      {
        stage: 'checkout_started',
        label: 'Started Checkout',
        count: checkoutsStarted,
        conversion_rate: calculatePercentage(checkoutsStarted, cartsCreated),
        drop_off_rate: calculatePercentage(cartsCreated - checkoutsStarted, cartsCreated)
      },
      {
        stage: 'checkout_completed',
        label: 'Completed Purchase',
        count: ordersCompleted,
        conversion_rate: calculatePercentage(ordersCompleted, checkoutsStarted),
        drop_off_rate: calculatePercentage(checkoutsStarted - ordersCompleted, checkoutsStarted)
      }
    ]
    
    return {
      stages,
      overall_conversion_rate: calculatePercentage(ordersCompleted, cartsCreated),
      period: range
    }
  } catch (error) {
    console.error('Error getting conversion funnel:', error)
    return {
      stages: [],
      overall_conversion_rate: 0,
      period: resolveDateRange(dateRange)
    }
  }
}

/**
 * Get cart abandonment statistics
 */
export async function getCartAbandonmentRate(
  siteId: string,
  dateRange: DateRange | DateRangePreset = 'last_30_days'
): Promise<CartAbandonment> {
  try {
    const supabase = await getModuleClient()
    const range = resolveDateRange(dateRange)
    
    // Get all carts in range
    const { data: carts } = await supabase
      .from(`${TABLE_PREFIX}_carts`)
      .select('id, status, total')
      .eq('site_id', siteId)
      .gte('created_at', range.start)
      .lte('created_at', range.end)
    
    const totalCarts = (carts ?? []).length
    const abandonedCarts = (carts ?? []).filter(c => c.status === 'abandoned').length
    const convertedCarts = (carts ?? []).filter(c => c.status === 'converted').length
    
    const abandonedValue = (carts ?? [])
      .filter(c => c.status === 'abandoned')
      .reduce((sum, c) => sum + (c.total ?? 0), 0)
    
    // Recovery would need additional tracking
    const recoveredCarts = 0
    const recoveredValue = 0
    
    return {
      total_carts: totalCarts,
      abandoned_carts: abandonedCarts,
      abandonment_rate: calculatePercentage(abandonedCarts, totalCarts),
      recovered_carts: recoveredCarts,
      recovery_rate: calculatePercentage(recoveredCarts, abandonedCarts),
      abandoned_value: abandonedValue,
      recovered_value: recoveredValue,
      abandonment_by_stage: [] // Would need detailed tracking
    }
  } catch (error) {
    console.error('Error getting cart abandonment:', error)
    return {
      total_carts: 0, abandoned_carts: 0, abandonment_rate: 0,
      recovered_carts: 0, recovery_rate: 0, abandoned_value: 0,
      recovered_value: 0, abandonment_by_stage: []
    }
  }
}

// ============================================================================
// SAVED REPORTS
// ============================================================================

/**
 * Get saved reports for a site
 */
export async function getSavedReports(
  siteId: string,
  type?: string
): Promise<SavedReport[]> {
  try {
    const supabase = await getModuleClient()
    
    let query = supabase
      .from(`${TABLE_PREFIX}_saved_reports`)
      .select('*')
      .eq('site_id', siteId)
      .order('is_favorite', { ascending: false })
      .order('updated_at', { ascending: false })
    
    if (type) {
      query = query.eq('type', type)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return data ?? []
  } catch (error) {
    console.error('Error getting saved reports:', error)
    return []
  }
}

/**
 * Create a saved report
 */
export async function createSavedReport(
  siteId: string,
  input: SavedReportInput
): Promise<{ success: boolean; report?: SavedReport; error?: string }> {
  try {
    const supabase = await getModuleClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_saved_reports`)
      .insert({
        site_id: siteId,
        ...input,
        created_by: user?.id
      })
      .select()
      .single()
    
    if (error) throw error
    
    return { success: true, report: data }
  } catch (error) {
    console.error('Error creating saved report:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create report' 
    }
  }
}

/**
 * Update a saved report
 */
export async function updateSavedReport(
  reportId: string,
  updates: SavedReportUpdate
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_saved_reports`)
      .update(updates)
      .eq('id', reportId)
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    console.error('Error updating saved report:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update report' 
    }
  }
}

/**
 * Delete a saved report
 */
export async function deleteSavedReport(
  reportId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_saved_reports`)
      .delete()
      .eq('id', reportId)
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting saved report:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete report' 
    }
  }
}

/**
 * Toggle report favorite status
 */
export async function toggleReportFavorite(
  reportId: string
): Promise<{ success: boolean; is_favorite?: boolean; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    // Get current status
    const { data: report } = await supabase
      .from(`${TABLE_PREFIX}_saved_reports`)
      .select('is_favorite')
      .eq('id', reportId)
      .single()
    
    const newStatus = !report?.is_favorite
    
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_saved_reports`)
      .update({ is_favorite: newStatus })
      .eq('id', reportId)
    
    if (error) throw error
    
    return { success: true, is_favorite: newStatus }
  } catch (error) {
    console.error('Error toggling favorite:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to toggle favorite' 
    }
  }
}
```

---

## ✅ Testing Checklist

- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] Database migration runs without errors
- [ ] Test `getSalesOverview()` returns correct metrics
- [ ] Test `getSalesByPeriod()` with different groupings
- [ ] Test `getProductPerformance()` returns ranked products
- [ ] Test `getCustomerInsights()` returns customer metrics
- [ ] Test `getConversionFunnel()` returns funnel data
- [ ] Test `createSavedReport()` creates and returns report
- [ ] Test date range utilities work correctly
- [ ] Verify RLS policies allow authorized access

---

## 🔄 Rollback Plan

If issues occur:

1. **Database Rollback**:
```sql
DROP TABLE IF EXISTS mod_ecommod01_report_history CASCADE;
DROP TABLE IF EXISTS mod_ecommod01_saved_reports CASCADE;
DROP TABLE IF EXISTS mod_ecommod01_analytics_snapshots CASCADE;
DROP FUNCTION IF EXISTS generate_daily_analytics_snapshot CASCADE;
```

2. **Code Rollback**:
```bash
git checkout HEAD~1 -- src/modules/ecommerce/actions/analytics-actions.ts
git checkout HEAD~1 -- src/modules/ecommerce/types/analytics-types.ts
git checkout HEAD~1 -- src/modules/ecommerce/lib/analytics-utils.ts
```

---

## 📝 Memory Bank Updates

After completion, update:
- `activeContext.md`: Add PHASE-ECOM-41A completion note
- `progress.md`: Update Wave 5 section

---

## ✨ Success Criteria

- [ ] Analytics schema created with proper indexes
- [ ] All 15+ analytics server actions functional
- [ ] Date range utilities work for all presets
- [ ] Sales metrics calculate correctly
- [ ] Product performance ranks accurately
- [ ] Customer segmentation categorizes correctly
- [ ] Saved reports CRUD operations work
- [ ] TypeScript types fully defined
- [ ] Zero TypeScript errors
