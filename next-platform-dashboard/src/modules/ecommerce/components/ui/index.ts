// =============================================================================
// E-COMMERCE UI COMPONENTS BARREL EXPORT
// =============================================================================

/**
 * PHASE-UI-14: E-Commerce Module UI Enhancement
 * 
 * This module exports enhanced UI components for the E-Commerce module.
 * Built following the patterns established in social-media and ai-agents modules.
 * 
 * @module @/modules/ecommerce/components/ui
 * @version 1.0.0
 */

// Metric Cards
export {
  EcommerceMetricCard,
  RevenueMetricCard,
  OrdersMetricCard,
  InventoryMetricCard,
  ConversionMetricCard,
  CustomersMetricCard,
  LowStockMetricCard,
  type EcommerceMetricCardProps,
} from './ecommerce-metric-card'

// Product Card
export {
  ProductCard,
  ProductCardSkeleton,
  type ProductCardProps,
} from './product-card'

// Order Card
export {
  OrderCard,
  OrderCardSkeleton,
  type OrderCardProps,
} from './order-card'

// Filter Bar
export {
  EcommerceFilterBar,
  ProductFilterBar,
  OrderFilterBar,
  type EcommerceFilterBarProps,
} from './ecommerce-filter-bar'

// Revenue Chart
export {
  RevenueChart,
  type RevenueChartProps,
  type RevenueDataPoint,
} from './revenue-chart'

// Quick Actions
export {
  EcommerceQuickActions,
  EcommerceQuickActionsCompact,
  getDefaultEcommerceActions,
  type EcommerceQuickActionsProps,
  type QuickAction,
} from './ecommerce-quick-actions'

// Inventory Alert
export {
  InventoryAlert,
  InventoryAlertBanner,
  type InventoryAlertProps,
} from './inventory-alert'
