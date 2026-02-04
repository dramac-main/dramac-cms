/**
 * Home Dashboard View
 * 
 * Phase ECOM-01: Dashboard Redesign
 * 
 * The main home view with stats and widgets
 */
'use client'

import { useState, useEffect } from 'react'
import { StatsCards, RecentOrdersWidget, LowStockAlerts, ActivityFeed } from '../widgets'
import type { 
  DashboardStats, 
  RecentOrderSummary, 
  LowStockProduct,
  ActivityItem,
  StatsPeriod 
} from '../../types/ecommerce-types'
import {
  getDashboardStats,
  getRecentOrders,
  getLowStockProducts,
  getActivityFeed
} from '../../actions/dashboard-actions'

// ============================================================================
// TYPES
// ============================================================================

interface HomeViewProps {
  siteId: string
  onViewOrder: (orderId: string) => void
  onViewProduct: (productId: string) => void
  onNavigateToOrders: () => void
  onNavigateToProducts: () => void
  currency?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function HomeView({
  siteId,
  onViewOrder,
  onViewProduct,
  onNavigateToOrders,
  onNavigateToProducts,
  currency = 'USD'
}: HomeViewProps) {
  const [period, setPeriod] = useState<StatsPeriod>('month')
  const [isLoading, setIsLoading] = useState(true)
  
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    revenueChange: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    activeProducts: 0,
    draftProducts: 0,
    lowStockProducts: 0,
    totalCustomers: 0,
    newCustomersThisWeek: 0
  })
  
  const [recentOrders, setRecentOrders] = useState<RecentOrderSummary[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])

  // Load all dashboard data
  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true)
      try {
        const [statsData, ordersData, lowStockData, activityData] = await Promise.all([
          getDashboardStats(siteId, period),
          getRecentOrders(siteId, 5),
          getLowStockProducts(siteId, 5),
          getActivityFeed(siteId, 20)
        ])

        setStats(statsData)
        setRecentOrders(ordersData)
        setLowStockProducts(lowStockData)
        setActivities(activityData)
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [siteId, period])

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <StatsCards
        stats={stats}
        period={period}
        onPeriodChange={setPeriod}
        currency={currency}
        isLoading={isLoading}
      />

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders - Takes 2 columns */}
        <div className="lg:col-span-2">
          <RecentOrdersWidget
            orders={recentOrders}
            onViewOrder={onViewOrder}
            onViewAll={onNavigateToOrders}
            isLoading={isLoading}
          />
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-1">
          <ActivityFeed
            activities={activities}
            maxHeight={400}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Low Stock Alerts - Full Width */}
      <LowStockAlerts
        products={lowStockProducts}
        onViewProduct={onViewProduct}
        onViewAll={onNavigateToProducts}
        isLoading={isLoading}
      />
    </div>
  )
}
