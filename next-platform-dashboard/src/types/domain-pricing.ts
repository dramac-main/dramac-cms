// src/types/domain-pricing.ts
// Domain Pricing & Billing Type Definitions for Phase DM-10

// ============================================================================
// Pricing Configuration Types
// ============================================================================

export type PricingMarkupType = 'percentage' | 'fixed' | 'custom';

export type BillingRecordType = 'registration' | 'renewal' | 'transfer' | 'email' | 'addon';

export type BillingRecordStatus = 'pending' | 'paid' | 'failed' | 'refunded';

// ============================================================================
// Agency Domain Pricing Configuration
// ============================================================================

export interface AgencyDomainPricing {
  id: string;
  agency_id: string;
  
  // Markup settings
  default_markup_type: PricingMarkupType;
  default_markup_value: number;
  
  // TLD-specific pricing
  tld_pricing: TldPricingConfig;
  
  // Client tiers
  client_tiers: ClientPricingTier[];
  
  // Billing
  paddle_product_id: string | null;
  paddle_price_id: string | null;
  billing_enabled: boolean;
  
  // White-label
  show_wholesale_prices: boolean;
  custom_terms_url: string | null;
  custom_support_email: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface AgencyDomainPricingInsert {
  agency_id: string;
  default_markup_type?: PricingMarkupType;
  default_markup_value?: number;
  tld_pricing?: TldPricingConfig;
  client_tiers?: ClientPricingTier[];
  paddle_product_id?: string | null;
  paddle_price_id?: string | null;
  billing_enabled?: boolean;
  show_wholesale_prices?: boolean;
  custom_terms_url?: string | null;
  custom_support_email?: string | null;
}

export interface AgencyDomainPricingUpdate {
  default_markup_type?: PricingMarkupType;
  default_markup_value?: number;
  tld_pricing?: TldPricingConfig;
  client_tiers?: ClientPricingTier[];
  paddle_product_id?: string | null;
  paddle_price_id?: string | null;
  billing_enabled?: boolean;
  show_wholesale_prices?: boolean;
  custom_terms_url?: string | null;
  custom_support_email?: string | null;
}

// ============================================================================
// TLD Pricing Configuration
// ============================================================================

export interface TldPricingConfig {
  [tld: string]: TldPricingEntry;
}

export interface TldPricingEntry {
  markup_type: PricingMarkupType;
  markup_value: number;
  custom_register?: Record<number, number>; // years -> price
  custom_renew?: Record<number, number>;
  custom_transfer?: number;
  enabled: boolean;
}

// ============================================================================
// Client Pricing Tiers
// ============================================================================

export interface ClientPricingTier {
  id: string;
  name: string;
  description: string;
  discount_percentage: number;
  min_domains?: number; // Minimum domains for tier
  client_ids?: string[]; // Specific clients in this tier
}

// ============================================================================
// Domain Billing Records
// ============================================================================

export interface DomainBillingRecord {
  id: string;
  agency_id: string;
  domain_id: string | null;
  billing_type: BillingRecordType;
  description: string;
  wholesale_amount: number;
  retail_amount: number;
  markup_amount: number;
  currency: string;
  paddle_transaction_id: string | null;
  paddle_subscription_id: string | null;
  status: BillingRecordStatus;
  paid_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined
  domain?: {
    domain_name: string;
  } | null;
}

export interface DomainBillingRecordInsert {
  agency_id: string;
  domain_id?: string | null;
  billing_type: BillingRecordType;
  description: string;
  wholesale_amount: number;
  retail_amount: number;
  markup_amount: number;
  currency?: string;
  paddle_transaction_id?: string | null;
  paddle_subscription_id?: string | null;
  status?: BillingRecordStatus;
  paid_at?: string | null;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Domain Usage Summary
// ============================================================================

export interface DomainUsageSummary {
  id: string;
  agency_id: string;
  year: number;
  month: number;
  domains_registered: number;
  domains_renewed: number;
  domains_transferred: number;
  email_accounts_created: number;
  wholesale_total: number;
  retail_total: number;
  profit_total: number;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// Pricing Calculation Types
// ============================================================================

export interface PricingCalculation {
  tld: string;
  years: number;
  wholesale_price: number;
  retail_price: number;
  markup_amount: number;
  markup_percentage: number;
  privacy_wholesale?: number;
  privacy_retail?: number;
  total_wholesale: number;
  total_retail: number;
  total_profit: number;
}

export interface PriceCalculationParams {
  tld: string;
  years: number;
  operation: 'register' | 'renew' | 'transfer';
  includePrivacy?: boolean;
  clientId?: string;
}

// ============================================================================
// Revenue Analytics Types
// ============================================================================

export interface RevenueByType {
  revenue: number;
  cost: number;
  profit: number;
  count: number;
}

export interface RevenueAnalytics {
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  profit_margin: number;
  by_type: Record<string, RevenueByType>;
}

// ============================================================================
// Billing Filters
// ============================================================================

export interface BillingRecordFilters {
  status?: BillingRecordStatus;
  billing_type?: BillingRecordType;
  from_date?: string;
  to_date?: string;
  limit?: number;
}

// ============================================================================
// Wholesale Pricing (from ResellerClub)
// ============================================================================

export interface WholesaleTldPricing {
  register: Record<number, number>;
  renew: Record<number, number>;
  transfer: number;
}

export type WholesalePricingMap = Record<string, WholesaleTldPricing>;
