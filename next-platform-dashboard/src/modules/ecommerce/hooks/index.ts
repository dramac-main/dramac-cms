/**
 * E-Commerce Storefront Hooks
 * 
 * Phase ECOM-20: Core Data Hooks
 * Phase ECOM-23: Checkout Hook
 * Phase ECOM-24: Navigation & Filtering Hooks
 * Phase ECOM-25: Quotation Hooks
 * 
 * Exports all hooks for use in Studio components and pages.
 */

// Core data hooks (ECOM-20)
export { useStorefrontProducts } from './useStorefrontProducts'
export { useStorefrontProduct } from './useStorefrontProduct'
export { useStorefrontCategories } from './useStorefrontCategories'
export { useStorefrontCart } from './useStorefrontCart'
export { useStorefrontWishlist } from './useStorefrontWishlist'
export { useStorefrontSearch } from './useStorefrontSearch'
export { useRecentlyViewed } from './useRecentlyViewed'

// Checkout hook (ECOM-23)
export { useCheckout } from './useCheckout'
export type { 
  CheckoutStep, 
  ShippingMethod, 
  PaymentMethod, 
  CheckoutState, 
  CheckoutValidation,
  UseCheckoutResult 
} from './useCheckout'

// Product filtering hook (ECOM-24)
export { useProductFilters } from './useProductFilters'
export type {
  FilterState,
  PriceRange,
  SortOption,
  FilterResult
} from './useProductFilters'
export { SORT_OPTIONS } from './useProductFilters'

// Quotations hook (ECOM-25)
export { useQuotations } from './useQuotations'
export type {
  QuoteBuilderItem,
  UseQuotationsResult,
  QuoteRequestData
} from './useQuotations'
