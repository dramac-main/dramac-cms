# PHASE-ECOM-41 Analytics & Reports Testing Guide

## Overview

Phase ECOM-41 implements a comprehensive analytics dashboard for the E-Commerce module with:
- **41A**: Database schema, server actions, and utility functions
- **41B**: UI components including charts, cards, tables, and dashboard view

## Prerequisites

### 1. Apply Database Migration

Before testing, run the analytics migration in Supabase:

```sql
-- Run the contents of: migrations/ecom-41-analytics.sql
-- This creates:
--   - mod_ecommod01_analytics_snapshots (daily metrics snapshots)
--   - mod_ecommod01_saved_reports (user report configurations)
--   - mod_ecommod01_report_history (report generation history)
--   - RLS policies for all tables
--   - generate_daily_analytics_snapshot() function
```

### 2. Have Sample Data

The analytics work best with existing e-commerce data:
- Products in `mod_ecommod01_products`
- Categories in `mod_ecommod01_categories`
- Orders in `mod_ecommod01_orders` with `status` = 'completed', 'shipped', or 'delivered'
- Order items in `mod_ecommod01_order_items`
- Carts in `mod_ecommod01_carts` (for abandonment metrics)

## Testing the Analytics Dashboard

### Step 1: Create a Test Page

Create a new page to test the analytics dashboard:

```tsx
// app/(dashboard)/[agencyId]/sites/[siteId]/ecommerce/analytics/page.tsx

import { AnalyticsDashboardView } from '@/modules/ecommerce/components/analytics'

export default async function AnalyticsPage({
  params
}: {
  params: Promise<{ siteId: string }>
}) {
  const { siteId } = await params
  
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">E-Commerce Analytics</h1>
      <AnalyticsDashboardView siteId={siteId} />
    </div>
  )
}
```

### Step 2: Access the Dashboard

1. Start the development server:
   ```bash
   pnpm dev
   ```

2. Navigate to:
   ```
   http://localhost:3000/[your-agency-id]/sites/[your-site-id]/ecommerce/analytics
   ```

### Step 3: Test Dashboard Features

#### 3a. Date Range Selection

The toolbar at the top allows date range selection:

1. Click the date preset dropdown (defaults to "Last 30 Days")
2. Select different presets:
   - Today, Yesterday
   - Last 7 Days, Last 30 Days, Last 90 Days
   - This Month, Last Month
   - This Quarter, Last Quarter
   - This Year, Last Year
   - Custom (opens date picker)

3. For custom range:
   - Click "Custom"
   - Select start and end dates from the calendar popover
   - Dashboard will refresh with new date range

#### 3b. Group By Period

Change how data is aggregated:

1. Click the "Group by" dropdown
2. Options: Hour, Day, Week, Month, Quarter, Year
3. Charts will update to show data grouped by selected period

#### 3c. Sales Tab (Default)

Shows sales metrics:

1. **KPI Cards** (top row):
   - Total Revenue
   - Total Orders  
   - Average Order Value
   - Products Sold

2. **Charts** (middle row):
   - Revenue over time (area chart)
   - Orders over time (line chart)

3. **Sales by Channel** (pie chart):
   - Website, Quote, Manual, API distribution

4. **Revenue Breakdown** (card):
   - Gross Revenue, Discounts, Tax, Shipping, Refunds, Net Revenue

#### 3d. Products Tab

Shows product performance:

1. **Top Products Chart** (horizontal bar):
   - Top 5 products by revenue

2. **Category Performance Chart** (bar):
   - Revenue by category

3. **Product Performance Table**:
   - Sortable columns (Units, Revenue, Views, Conversion)
   - Search by product name or SKU
   - Pagination
   - Export to CSV button

4. **Category Performance Table**:
   - Revenue, units, products per category
   - Progress bar for % of total

#### 3e. Customers Tab

Shows customer analytics:

1. **Customer Insights Card**:
   - New vs Returning customers
   - Repeat rate
   - Average orders per customer

2. **Customer Segmentation Chart** (pie):
   - High Value, Active, At Risk, Churned segments

3. **Customer LTV Table**:
   - Top customers by lifetime value
   - Total spent, orders, AOV, predicted CLV

#### 3f. Conversions Tab

Shows conversion funnel:

1. **Conversion Funnel Chart**:
   - View → Add to Cart → Checkout Started → Completed
   - Shows drop-off at each stage

2. **Cart Abandonment Card**:
   - Abandonment rate badge (red/yellow/green)
   - Total carts, abandoned, recovered
   - Recovery rate
   - Abandoned value

### Step 4: Test Individual Components

You can also test components in isolation:

```tsx
// Testing just the sales overview cards
import { SalesOverviewCards } from '@/modules/ecommerce/components/analytics'
import { useSalesAnalytics, useDateRange } from '@/modules/ecommerce/hooks/use-analytics'

function TestSalesCards() {
  const { dateRange, preset, setPreset } = useDateRange('last_30_days')
  const { overview, isLoading } = useSalesAnalytics('your-site-id', dateRange)
  
  return (
    <SalesOverviewCards data={overview} isLoading={isLoading} />
  )
}
```

```tsx
// Testing just a chart
import { RevenueChart } from '@/modules/ecommerce/components/analytics'
import { useSalesAnalytics, useDateRange } from '@/modules/ecommerce/hooks/use-analytics'

function TestRevenueChart() {
  const { dateRange, groupBy } = useDateRange('last_30_days')
  const { salesByPeriod, isLoading } = useSalesAnalytics('your-site-id', dateRange, groupBy)
  
  return (
    <RevenueChart 
      data={salesByPeriod || []} 
      isLoading={isLoading}
      groupBy={groupBy} 
    />
  )
}
```

### Step 5: Test Server Actions Directly

You can test server actions in a component:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { getSalesOverview, getProductPerformance } from '@/modules/ecommerce/actions/analytics-actions'

function TestActions() {
  const [salesData, setSalesData] = useState(null)
  const [productData, setProductData] = useState(null)
  
  useEffect(() => {
    const fetchData = async () => {
      const dateRange = {
        start: '2026-01-01',
        end: '2026-02-05'
      }
      
      const sales = await getSalesOverview('your-site-id', dateRange)
      console.log('Sales Overview:', sales)
      setSalesData(sales.data)
      
      const products = await getProductPerformance('your-site-id', dateRange, 10)
      console.log('Product Performance:', products)
      setProductData(products.data)
    }
    
    fetchData()
  }, [])
  
  return (
    <div>
      <h2>Sales</h2>
      <pre>{JSON.stringify(salesData, null, 2)}</pre>
      <h2>Products</h2>
      <pre>{JSON.stringify(productData, null, 2)}</pre>
    </div>
  )
}
```

### Step 6: Test Export Functionality

1. Go to Products tab
2. Click the Download icon button on the Product Performance Table
3. A CSV file should download with columns:
   - Product, SKU, Units Sold, Revenue (cents), Views, Conversion Rate

## Component Reference

### Available Components

```tsx
// Charts
import {
  RevenueChart,
  OrdersChart,
  SalesByChannelChart,
  TopProductsChart,
  CategoryPerformanceChart,
  CustomerSegmentationChart,
  ConversionFunnelChart
} from '@/modules/ecommerce/components/analytics'

// Cards
import {
  KPICard,
  SalesOverviewCards,
  RevenueBreakdownCard,
  CustomerInsightsCard,
  CartAbandonmentCard
} from '@/modules/ecommerce/components/analytics'

// Tables
import {
  ProductPerformanceTable,
  CategoryPerformanceTable,
  CustomerLTVTable
} from '@/modules/ecommerce/components/analytics'

// Pickers
import {
  DateRangePicker,
  GroupBySelector,
  AnalyticsToolbar
} from '@/modules/ecommerce/components/analytics'

// Dashboard
import {
  AnalyticsDashboardView
} from '@/modules/ecommerce/components/analytics'
```

### Available Hooks

```tsx
import {
  useDateRange,
  useSalesAnalytics,
  useProductAnalytics,
  useCustomerAnalytics,
  useConversionAnalytics,
  useSavedReports,
  useAnalytics // Combined hook
} from '@/modules/ecommerce/hooks/use-analytics'
```

### Available Server Actions

```tsx
import {
  // Sales
  getSalesOverview,
  getSalesByPeriod,
  getSalesByChannel,
  getRevenueBreakdown,
  
  // Products
  getProductPerformance,
  getTopProducts,
  getCategoryPerformance,
  
  // Customers
  getCustomerInsights,
  getCustomerLifetimeValue,
  getCustomerSegmentation,
  
  // Conversions
  getConversionFunnel,
  getCartAbandonmentRate,
  
  // Saved Reports
  getSavedReports,
  createSavedReport,
  updateSavedReport,
  deleteSavedReport,
  toggleReportFavorite
} from '@/modules/ecommerce/actions/analytics-actions'
```

## Troubleshooting

### No Data Showing

1. Check that you have completed orders with `status` in ('completed', 'shipped', 'delivered')
2. Check that orders fall within the selected date range
3. Check browser console for API errors

### Charts Not Rendering

1. Ensure Recharts is installed: `pnpm add recharts`
2. Check that the component is a client component ('use client')
3. Check that data is not null/undefined

### TypeScript Errors

All types use snake_case to match database columns:
- `revenue` not `totalRevenue`
- `average_order_value` not `averageOrderValue`
- `product_name` not `productName`
- `quantity_sold` not `unitsSold`

### Loading States

Components show loading skeletons when:
- `isLoading={true}` prop is passed
- Hook is fetching data (`isLoading` from hook return)

### Empty States

Components show "No data" message when:
- `data` prop is `null` or empty array
- Date range has no orders

## Files Reference

```
src/modules/ecommerce/
├── actions/
│   └── analytics-actions.ts     # 17 server actions (1203 lines)
├── components/
│   └── analytics/
│       ├── index.ts             # Exports all components
│       ├── analytics-charts.tsx # 7 Recharts components (657 lines)
│       ├── analytics-cards.tsx  # 5 KPI/metric cards (424 lines)
│       ├── analytics-tables.tsx # 3 data tables (439 lines)
│       ├── date-range-picker.tsx # Toolbar components (283 lines)
│       └── analytics-dashboard-view.tsx # Main dashboard (324 lines)
├── hooks/
│   └── use-analytics.ts         # 7 analytics hooks (500+ lines)
├── lib/
│   └── analytics-utils.ts       # Date/format utilities
└── types/
    └── analytics-types.ts       # Type definitions (437 lines)

migrations/
└── ecom-41-analytics.sql        # Database migration
```

## Next Steps

After testing analytics:
- **ECOM-42**: Email Notifications (order confirmations, shipping updates)
- **ECOM-43**: Promotions & Discounts (coupons, sales, bundles)
