/**
 * Mobile Components - Barrel Export
 * 
 * Phase ECOM-30: Mobile Cart Experience
 * Phase ECOM-31: Mobile Checkout Flow
 * Phase ECOM-32: Mobile Product Experience
 * 
 * Mobile-optimized components for cart, checkout, and product flows.
 */

// ECOM-30: Mobile Cart Experience
export { MobileQuantitySelector } from './MobileQuantitySelector'

export { SwipeableCartItem } from './SwipeableCartItem'

export { CartNotification, useCartNotification } from './CartNotification'
export type { CartNotificationData } from './CartNotification'

export { MobileCartBottomSheet } from './MobileCartBottomSheet'

export { MobileCartButton } from './MobileCartButton'

// ECOM-31: Mobile Checkout Flow
export { MobileInput } from './MobileInput'

export { MobileSelect } from './MobileSelect'
export type { MobileSelectOption } from './MobileSelect'

export { CollapsibleSection } from './CollapsibleSection'
export type { CollapsibleSectionProps, SectionStatus } from './CollapsibleSection'

export { MobileCheckoutProgress } from './MobileCheckoutProgress'
export type { MobileCheckoutProgressProps, CheckoutStep, CheckoutStepConfig } from './MobileCheckoutProgress'

export { MobileAddressInput } from './MobileAddressInput'
export type { MobileAddressInputProps, Address, AddressErrors } from './MobileAddressInput'

export { MobilePaymentSelector } from './MobilePaymentSelector'
export type { MobilePaymentSelectorProps, PaymentMethod, PaymentMethodType } from './MobilePaymentSelector'

export { MobileShippingSelector } from './MobileShippingSelector'
export type { MobileShippingSelectorProps, ShippingOption, ShippingSpeed } from './MobileShippingSelector'

export { MobileOrderReview } from './MobileOrderReview'
export type { MobileOrderReviewProps, OrderSummaryTotals } from './MobileOrderReview'

export { StickyCheckoutFooter } from './StickyCheckoutFooter'
export type { StickyCheckoutFooterProps } from './StickyCheckoutFooter'

export { MobileCheckoutPage } from './MobileCheckoutPage'
export type { MobileCheckoutPageProps, CheckoutData, ContactInfo, ContactErrors } from './MobileCheckoutPage'

// ECOM-32: Mobile Product Experience
export { MobileProductGallery } from './MobileProductGallery'
export type { MobileProductGalleryProps, ProductImage } from './MobileProductGallery'

export { MobileVariantSelector } from './MobileVariantSelector'
export type { 
  MobileVariantSelectorProps, 
  VariantOption as MobileVariantOption 
} from './MobileVariantSelector'

export { StickyAddToCartBar, useStickyAddToCartTarget } from './StickyAddToCartBar'
export type { StickyAddToCartBarProps } from './StickyAddToCartBar'

export { CollapsibleProductDetails, CollapsibleSection as ProductCollapsibleSection } from './CollapsibleProductDetails'
export type { 
  CollapsibleProductDetailsProps,
  ProductDetailSection,
  CollapsibleSectionProps as ProductCollapsibleSectionProps 
} from './CollapsibleProductDetails'

export { MobileProductCard, MobileProductGrid } from './MobileProductCard'
export type { MobileProductCardProps, MobileProductGridProps } from './MobileProductCard'

export { MobileQuickView } from './MobileQuickView'
export type { 
  MobileQuickViewProps,
  VariantOption as QuickViewVariantOption 
} from './MobileQuickView'

export { ProductSwipeView } from './ProductSwipeView'
export type { ProductSwipeViewProps, SwipeAction } from './ProductSwipeView'
