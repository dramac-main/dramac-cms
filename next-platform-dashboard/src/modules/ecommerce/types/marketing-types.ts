/**
 * Marketing Types
 * 
 * Phase ECOM-42A: Marketing Features - Schema & Server Actions
 * 
 * Type definitions for flash sales, bundles, gift cards, and loyalty.
 */

// ============================================================================
// FLASH SALES
// ============================================================================

export type FlashSaleDiscountType = 'percentage' | 'fixed_amount'
export type FlashSaleStatus = 'draft' | 'scheduled' | 'active' | 'ended' | 'cancelled'

export interface FlashSale {
  id: string
  site_id: string
  
  name: string
  description: string | null
  slug: string
  
  starts_at: string
  ends_at: string
  
  discount_type: FlashSaleDiscountType
  discount_value: number  // Percentage or cents
  
  max_uses: number | null
  max_uses_per_customer: number | null
  current_uses: number
  
  is_featured: boolean
  show_countdown: boolean
  banner_image: string | null
  badge_text: string | null
  
  status: FlashSaleStatus
  
  created_by: string | null
  created_at: string
  updated_at: string
  
  // Joined
  products?: FlashSaleProduct[]
  product_count?: number
}

export interface FlashSaleProduct {
  id: string
  flash_sale_id: string
  product_id: string
  
  discount_type: FlashSaleDiscountType | null
  discount_value: number | null
  
  quantity_limit: number | null
  quantity_sold: number
  
  sort_order: number
  created_at: string
  
  // Joined
  product?: {
    id: string
    name: string
    base_price: number
    images: string[]
  }
  sale_price?: number  // Computed
}

export interface FlashSaleInput {
  name: string
  description?: string
  slug: string
  starts_at: string
  ends_at: string
  discount_type: FlashSaleDiscountType
  discount_value: number
  max_uses?: number
  max_uses_per_customer?: number
  is_featured?: boolean
  show_countdown?: boolean
  banner_image?: string
  badge_text?: string
}

export interface FlashSaleUpdate extends Partial<FlashSaleInput> {
  status?: FlashSaleStatus
}

export interface AddFlashSaleProductInput {
  product_id: string
  discount_type?: FlashSaleDiscountType
  discount_value?: number
  quantity_limit?: number
  sort_order?: number
}

// ============================================================================
// PRODUCT BUNDLES
// ============================================================================

export type BundlePricingType = 'fixed' | 'percentage_discount' | 'cheapest_free'

export interface Bundle {
  id: string
  site_id: string
  
  name: string
  description: string | null
  slug: string
  sku: string | null
  
  images: string[]
  
  pricing_type: BundlePricingType
  fixed_price: number | null
  discount_percentage: number | null
  
  original_total: number
  bundle_price: number
  savings: number
  
  track_inventory: boolean
  quantity: number
  
  is_active: boolean
  available_from: string | null
  available_until: string | null
  
  show_savings: boolean
  badge_text: string | null
  
  created_by: string | null
  created_at: string
  updated_at: string
  
  // Joined
  items?: BundleItem[]
}

export interface BundleItem {
  id: string
  bundle_id: string
  product_id: string
  
  quantity: number
  variant_id: string | null
  price_override: number | null
  is_optional: boolean
  sort_order: number
  
  created_at: string
  
  // Joined
  product?: {
    id: string
    name: string
    base_price: number
    images: string[]
  }
  variant?: {
    id: string
    name: string
    price: number | null
  }
}

export interface BundleInput {
  name: string
  description?: string
  slug: string
  sku?: string
  images?: string[]
  pricing_type: BundlePricingType
  fixed_price?: number
  discount_percentage?: number
  track_inventory?: boolean
  quantity?: number
  available_from?: string
  available_until?: string
  show_savings?: boolean
  badge_text?: string
}

export interface BundleUpdate extends Partial<BundleInput> {
  is_active?: boolean
}

export interface BundleItemInput {
  product_id: string
  quantity?: number
  variant_id?: string
  price_override?: number
  is_optional?: boolean
  sort_order?: number
}

// ============================================================================
// GIFT CARDS
// ============================================================================

export type GiftCardType = 'standard' | 'promotional' | 'reward' | 'refund'
export type GiftCardDelivery = 'email' | 'physical' | 'instant'
export type GiftCardTransactionType = 'purchase' | 'redemption' | 'refund' | 'adjustment' | 'expiration'

export interface GiftCard {
  id: string
  site_id: string
  
  code: string
  pin: string | null
  
  initial_balance: number
  current_balance: number
  currency: string
  
  type: GiftCardType
  
  is_active: boolean
  expires_at: string | null
  
  minimum_order: number | null
  max_uses: number | null
  current_uses: number
  
  sender_name: string | null
  sender_email: string | null
  recipient_name: string | null
  recipient_email: string | null
  personal_message: string | null
  
  delivery_method: GiftCardDelivery | null
  delivered_at: string | null
  
  purchased_by: string | null
  order_id: string | null
  
  created_at: string
  updated_at: string
  
  // Joined
  transactions?: GiftCardTransaction[]
}

export interface GiftCardTransaction {
  id: string
  gift_card_id: string
  
  type: GiftCardTransactionType
  amount: number
  balance_after: number
  
  order_id: string | null
  notes: string | null
  
  performed_by: string | null
  created_at: string
}

export interface GiftCardInput {
  initial_balance: number
  currency?: string
  type?: GiftCardType
  expires_at?: string
  minimum_order?: number
  max_uses?: number
  sender_name?: string
  sender_email?: string
  recipient_name?: string
  recipient_email?: string
  personal_message?: string
  delivery_method?: GiftCardDelivery
}

export interface GiftCardRedemption {
  gift_card_id: string
  amount: number
  order_id: string
}

// ============================================================================
// LOYALTY PROGRAM
// ============================================================================

export interface LoyaltyTier {
  name: string
  min_points: number
  multiplier: number
  benefits?: string[]
}

export interface LoyaltyConfig {
  id: string
  site_id: string
  
  is_enabled: boolean
  program_name: string
  points_name: string
  
  points_per_dollar: number
  signup_bonus: number
  referral_bonus: number
  review_bonus: number
  
  points_value_cents: number
  minimum_redemption: number
  maximum_redemption_percent: number
  
  enable_tiers: boolean
  tiers: LoyaltyTier[]
  
  points_expire: boolean
  points_expire_months: number
  
  created_at: string
  updated_at: string
}

export interface LoyaltyConfigInput {
  is_enabled?: boolean
  program_name?: string
  points_name?: string
  points_per_dollar?: number
  signup_bonus?: number
  referral_bonus?: number
  review_bonus?: number
  points_value_cents?: number
  minimum_redemption?: number
  maximum_redemption_percent?: number
  enable_tiers?: boolean
  tiers?: LoyaltyTier[]
  points_expire?: boolean
  points_expire_months?: number
}

export interface LoyaltyPoints {
  id: string
  site_id: string
  customer_id: string
  
  points_balance: number
  lifetime_points: number
  redeemed_points: number
  
  current_tier: string | null
  tier_points: number
  
  last_earned_at: string | null
  last_redeemed_at: string | null
  created_at: string
  updated_at: string
  
  // Joined
  customer?: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string
  }
}

export type LoyaltyTransactionType = 
  | 'earn_purchase' 
  | 'earn_signup' 
  | 'earn_referral' 
  | 'earn_review'
  | 'earn_bonus' 
  | 'earn_adjustment'
  | 'redeem_order' 
  | 'redeem_refund' 
  | 'redeem_adjustment'
  | 'expire' 
  | 'tier_bonus'

export interface LoyaltyTransaction {
  id: string
  site_id: string
  customer_id: string
  
  type: LoyaltyTransactionType
  points: number
  balance_after: number
  
  order_id: string | null
  description: string | null
  
  multiplier: number
  expires_at: string | null
  
  created_at: string
}

export interface EarnPointsInput {
  customer_id: string
  type: LoyaltyTransactionType
  points: number
  order_id?: string
  description?: string
}

export interface RedeemPointsInput {
  customer_id: string
  points: number
  order_id: string
}

// ============================================================================
// MARKETING STATS
// ============================================================================

export interface MarketingStats {
  flash_sales: {
    total: number
    active: number
    total_redemptions: number
  }
  bundles: {
    total: number
    active: number
    total_sold: number
  }
  gift_cards: {
    total_issued: number
    active_cards: number
    total_value: number
    outstanding_balance: number
  }
  loyalty: {
    is_enabled: boolean
    total_members: number
    total_points_issued: number
    total_points_redeemed: number
  }
}
