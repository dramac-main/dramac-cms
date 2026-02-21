/**
 * E-Commerce Storefront Hooks
 * 
 * Phase ECOM-20: Core Data Hooks
 * Phase ECOM-23: Checkout Hook
 * Phase ECOM-24: Navigation & Filtering Hooks
 * Phase ECOM-25: Quotation Hooks
 * Phase ECOM-30: Mobile Cart Experience
 * Phase ECOM-31: Mobile Checkout Flow
 * Phase ECOM-50: Module Installation Hooks
 * Phase ECOM-52: Module Status & Widget Hooks
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

// Reviews hook (ECOM-60)
export { useStorefrontReviews } from './useStorefrontReviews'

// Mobile hooks (ECOM-30, ECOM-31)
export { useMobile, useBreakpoint, useDeviceInfo, useMediaQuery, usePrefersDarkMode, usePrefersReducedMotion } from './useMobile'
export type { Breakpoint, BreakpointConfig, DeviceInfo } from './useMobile'

export { useSwipeGesture, useSwipeToDelete } from './useSwipeGesture'
export type { SwipeDirection, SwipeState, SwipeConfig, SwipeHandlers, UseSwipeGestureReturn } from './useSwipeGesture'

export { useHapticFeedback, triggerHaptic } from './useHapticFeedback'
export type { HapticPattern, HapticConfig, UseHapticFeedbackReturn } from './useHapticFeedback'

export { useKeyboardVisible, useAutoScrollOnFocus } from './useKeyboardVisible'
export type { KeyboardState, UseKeyboardVisibleReturn } from './useKeyboardVisible'

// Marketing hooks (ECOM-42B)
export { useFlashSales, useBundles, useGiftCards, useLoyalty, useMarketingStats } from './use-marketing'

// Integration hooks (ECOM-43A/B)
export { useApiKeys, useWebhooks, useIntegrations, useSyncJobs } from './use-integrations'
export type { UseApiKeysReturn, UseWebhooksReturn, UseIntegrationsReturn, UseSyncJobsReturn } from './use-integrations'

// ============================================================================
// MODULE STATUS HOOKS (Wave 6 - PHASE-ECOM-52)
// ============================================================================

export {
  useModuleStatus,
  useEcommerceStatus,
  useModulesStatus,
} from './useModuleStatus'
export type { ModuleStatus } from './useModuleStatus'

// ============================================================================
// INSTALLATION HOOK (Wave 6 - PHASE-ECOM-50)
// ============================================================================

export { ecommerceInstallationHook } from './installation-hook'
