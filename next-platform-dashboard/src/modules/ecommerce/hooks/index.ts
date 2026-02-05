/**
 * E-Commerce Storefront Hooks
 * 
 * Phase ECOM-20: Core Data Hooks
 * Phase ECOM-23: Checkout Hook
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
