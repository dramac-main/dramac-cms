/**
 * Mobile Components - Barrel Export
 * 
 * Phase ECOM-30: Mobile Cart Experience
 * Phase ECOM-31: Mobile Checkout Flow
 * 
 * Mobile-optimized components for cart and checkout flows.
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
