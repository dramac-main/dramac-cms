'use client'

/**
 * Analytics Chart Components
 * 
 * Phase ECOM-41B: Analytics & Reports - UI Components
 * 
 * Recharts-based chart components for analytics visualization.
 */

import React from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type {
  SalesByPeriod,
  SalesByChannel,
  ProductPerformance,
  CategoryPerformance,
  CustomerSegmentation,
  CustomerSegment,
  ConversionFunnel,
  GroupByPeriod
} from '../../types/analytics-types'
import {
  formatCurrency,
  formatNumber,
  getChartColors,
  formatPeriodLabel
} from '../../lib/analytics-utils'
import { DEFAULT_CURRENCY_SYMBOL } from '@/lib/locale-config'

// ============================================================================
// CHART WRAPPER COMPONENT
// ============================================================================

interface ChartWrapperProps {
  title: string
  description?: string
  isLoading?: boolean
  isEmpty?: boolean
  emptyMessage?: string
  className?: string
  children: React.ReactNode
}

export function ChartWrapper({
  title,
  description,
  isLoading = false,
  isEmpty = false,
  emptyMessage = 'No data available',
  className,
  children
}: ChartWrapperProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Skeleton className="h-full w-full" />
          </div>
        ) : isEmpty ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// REVENUE CHART
// ============================================================================

interface RevenueChartProps {
  data: SalesByPeriod[]
  groupBy?: GroupByPeriod
  isLoading?: boolean
  className?: string
}

export function RevenueChart({
  data,
  groupBy = 'day',
  isLoading = false,
  className
}: RevenueChartProps) {
  const chartData = data.map(d => ({
    ...d,
    period: formatPeriodLabel(d.period, groupBy),
    revenueFormatted: d.revenue / 100 // Convert cents to dollars for display
  }))
  
  return (
    <ChartWrapper
      title="Revenue Over Time"
      description="Total revenue by time period"
      isLoading={isLoading}
      isEmpty={data.length === 0}
      className={className}
    >
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="period" 
            className="text-xs"
            tick={{ fill: 'currentColor' }}
          />
          <YAxis 
            className="text-xs"
            tick={{ fill: 'currentColor' }}
            tickFormatter={(value: number) => `${DEFAULT_CURRENCY_SYMBOL}${formatNumber(value)}`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const item = payload[0].payload as SalesByPeriod & { revenueFormatted: number }
              return (
                <div className="bg-popover border rounded-lg shadow-lg p-3">
                  <p className="font-medium">{item.period}</p>
                  <p className="text-sm text-muted-foreground">
                    Revenue: {formatCurrency(item.revenue)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Orders: {item.orders}
                  </p>
                </div>
              )
            }}
          />
          <Area
            type="monotone"
            dataKey="revenueFormatted"
            stroke="#3B82F6"
            fill="url(#revenueGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

// ============================================================================
// ORDERS CHART
// ============================================================================

interface OrdersChartProps {
  data: SalesByPeriod[]
  groupBy?: GroupByPeriod
  isLoading?: boolean
  className?: string
}

export function OrdersChart({
  data,
  groupBy = 'day',
  isLoading = false,
  className
}: OrdersChartProps) {
  const chartData = data.map(d => ({
    ...d,
    period: formatPeriodLabel(d.period, groupBy)
  }))
  
  return (
    <ChartWrapper
      title="Orders Over Time"
      description="Number of orders by time period"
      isLoading={isLoading}
      isEmpty={data.length === 0}
      className={className}
    >
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="period" 
            className="text-xs"
            tick={{ fill: 'currentColor' }}
          />
          <YAxis 
            className="text-xs"
            tick={{ fill: 'currentColor' }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const item = payload[0].payload as SalesByPeriod
              return (
                <div className="bg-popover border rounded-lg shadow-lg p-3">
                  <p className="font-medium">{item.period}</p>
                  <p className="text-sm text-muted-foreground">
                    Orders: {item.orders}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    AOV: {formatCurrency(item.average_order_value)}
                  </p>
                </div>
              )
            }}
          />
          <Line
            type="monotone"
            dataKey="orders"
            stroke="#10B981"
            strokeWidth={2}
            dot={{ fill: '#10B981', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

// ============================================================================
// SALES BY CHANNEL CHART
// ============================================================================

interface SalesByChannelChartProps {
  data: SalesByChannel[]
  isLoading?: boolean
  className?: string
}

export function SalesByChannelChart({
  data,
  isLoading = false,
  className
}: SalesByChannelChartProps) {
  const colors = getChartColors(data.length)
  
  const chartData = data.map((d, i) => ({
    ...d,
    fill: colors[i],
    revenueFormatted: d.revenue / 100
  }))
  
  return (
    <ChartWrapper
      title="Sales by Channel"
      description="Revenue distribution across sales channels"
      isLoading={isLoading}
      isEmpty={data.length === 0}
      className={className}
    >
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="revenueFormatted"
            nameKey="channel"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            label={(props: any) => `${props.channel || 'Unknown'}: ${(props.percentage ?? 0).toFixed(1)}%`}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const item = payload[0].payload as SalesByChannel & { fill: string }
              return (
                <div className="bg-popover border rounded-lg shadow-lg p-3">
                  <p className="font-medium capitalize">{item.channel || 'Unknown'}</p>
                  <p className="text-sm text-muted-foreground">
                    Revenue: {formatCurrency(item.revenue ?? 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Orders: {item.orders ?? 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Share: {(item.percentage ?? 0).toFixed(1)}%
                  </p>
                </div>
              )
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

// ============================================================================
// TOP PRODUCTS CHART
// ============================================================================

interface TopProductsChartProps {
  data: ProductPerformance[]
  isLoading?: boolean
  className?: string
}

export function TopProductsChart({
  data,
  isLoading = false,
  className
}: TopProductsChartProps) {
  const chartData = data.slice(0, 5).map(d => ({
    ...d,
    name: d.product_name.length > 20 
      ? d.product_name.substring(0, 20) + '...' 
      : d.product_name,
    revenueFormatted: d.revenue / 100
  }))
  
  return (
    <ChartWrapper
      title="Top Products"
      description="Best performing products by revenue"
      isLoading={isLoading}
      isEmpty={data.length === 0}
      className={className}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            type="number" 
            className="text-xs"
            tick={{ fill: 'currentColor' }}
            tickFormatter={(value: number) => `${DEFAULT_CURRENCY_SYMBOL}${formatNumber(value)}`}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            className="text-xs"
            tick={{ fill: 'currentColor' }}
            width={120}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const item = payload[0].payload as ProductPerformance
              return (
                <div className="bg-popover border rounded-lg shadow-lg p-3">
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Revenue: {formatCurrency(item.revenue)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Units Sold: {item.quantity_sold}
                  </p>
                </div>
              )
            }}
          />
          <Bar 
            dataKey="revenueFormatted" 
            fill="#8B5CF6" 
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

// ============================================================================
// CATEGORY PERFORMANCE CHART
// ============================================================================

interface CategoryPerformanceChartProps {
  data: CategoryPerformance[]
  isLoading?: boolean
  className?: string
}

export function CategoryPerformanceChart({
  data,
  isLoading = false,
  className
}: CategoryPerformanceChartProps) {
  const colors = getChartColors(data.length)
  
  const chartData = data.map((d, i) => ({
    ...d,
    fill: colors[i],
    revenueFormatted: d.revenue / 100
  }))
  
  return (
    <ChartWrapper
      title="Category Performance"
      description="Revenue by product category"
      isLoading={isLoading}
      isEmpty={data.length === 0}
      className={className}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="category_name" 
            className="text-xs"
            tick={{ fill: 'currentColor' }}
          />
          <YAxis 
            className="text-xs"
            tick={{ fill: 'currentColor' }}
            tickFormatter={(value: number) => `${DEFAULT_CURRENCY_SYMBOL}${formatNumber(value)}`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const item = payload[0].payload as CategoryPerformance
              return (
                <div className="bg-popover border rounded-lg shadow-lg p-3">
                  <p className="font-medium">{item.category_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Revenue: {formatCurrency(item.revenue)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Units: {item.quantity_sold}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Products: {item.products_count}
                  </p>
                </div>
              )
            }}
          />
          <Bar 
            dataKey="revenueFormatted" 
            radius={[4, 4, 0, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

// ============================================================================
// CUSTOMER SEGMENTATION CHART
// ============================================================================

interface CustomerSegmentationChartProps {
  data: CustomerSegmentation | null
  isLoading?: boolean
  className?: string
}

export function CustomerSegmentationChart({
  data,
  isLoading = false,
  className
}: CustomerSegmentationChartProps) {
  const segments = data?.segments || []
  const colors = getChartColors(segments.length)
  
  const chartData = segments.map((d, i) => ({
    ...d,
    fill: colors[i]
  }))
  
  return (
    <ChartWrapper
      title="Customer Segments"
      description="Distribution of customers by segment"
      isLoading={isLoading}
      isEmpty={segments.length === 0}
      className={className}
    >
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="customer_count"
            nameKey="segment"
            cx="50%"
            cy="50%"
            outerRadius={100}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            label={(props: any) => `${props.segment || 'Unknown'}: ${(props.percentage ?? 0).toFixed(0)}%`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const item = payload[0].payload as CustomerSegment
              return (
                <div className="bg-popover border rounded-lg shadow-lg p-3">
                  <p className="font-medium">{item.segment}</p>
                  <p className="text-sm text-muted-foreground">
                    Customers: {item.customer_count}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Revenue: {formatCurrency(item.total_revenue)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Avg LTV: {formatCurrency(item.average_ltv)}
                  </p>
                </div>
              )
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

// ============================================================================
// CONVERSION FUNNEL CHART
// ============================================================================

interface ConversionFunnelChartProps {
  data: ConversionFunnel | null
  isLoading?: boolean
  className?: string
}

export function ConversionFunnelChart({
  data,
  isLoading = false,
  className
}: ConversionFunnelChartProps) {
  if (!data) {
    return (
      <ChartWrapper
        title="Conversion Funnel"
        description="Customer journey from view to purchase"
        isLoading={isLoading}
        isEmpty={true}
        className={className}
      >
        <div />
      </ChartWrapper>
    )
  }
  
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']
  
  const chartData = data.stages.map((stage, i) => ({
    ...stage,
    fill: colors[i % colors.length]
  }))
  
  return (
    <ChartWrapper
      title="Conversion Funnel"
      description={`Overall conversion: ${(data.overall_conversion_rate ?? 0).toFixed(1)}%`}
      isLoading={isLoading}
      isEmpty={!data.stages || data.stages.length === 0}
      className={className}
    >
      <ResponsiveContainer width="100%" height={300}>
        <FunnelChart>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const item = payload[0].payload as typeof chartData[0]
              return (
                <div className="bg-popover border rounded-lg shadow-lg p-3">
                  <p className="font-medium">{item.label || 'Unknown'}</p>
                  <p className="text-sm text-muted-foreground">
                    Count: {formatNumber(item.count ?? 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Rate: {(item.conversion_rate ?? 0).toFixed(1)}%
                  </p>
                </div>
              )
            }}
          />
          <Funnel
            dataKey="count"
            data={chartData}
            isAnimationActive
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
            <LabelList
              position="right"
              fill="#000"
              stroke="none"
              dataKey="label"
              className="text-xs"
            />
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

// ============================================================================
// EXPORT
// ============================================================================

export {
  type ChartWrapperProps,
  type RevenueChartProps,
  type OrdersChartProps,
  type SalesByChannelChartProps,
  type TopProductsChartProps,
  type CategoryPerformanceChartProps,
  type CustomerSegmentationChartProps,
  type ConversionFunnelChartProps
}
