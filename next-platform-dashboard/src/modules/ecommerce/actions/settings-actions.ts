/**
 * E-Commerce Settings Actions
 * 
 * Phase ECOM-03: Settings & Configuration Center
 * 
 * Server actions for managing all e-commerce settings
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { DEFAULT_CURRENCY, DEFAULT_CURRENCY_SYMBOL } from '@/lib/locale-config'
import type { 
  EcommerceSettingsComplete,
  GeneralSettings,
  CurrencySettings,
  TaxSettings,
  ShippingSettings,
  PaymentSettings,
  CheckoutSettings,
  NotificationSettings,
  InventorySettings,
  LegalSettings,
  SettingsTab
} from '../types/ecommerce-types'

const TABLE_PREFIX = 'mod_ecommod01'

async function getModuleClient() {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabase as any
}

// ============================================================================
// DEFAULT SETTINGS
// ============================================================================

const defaultGeneralSettings: GeneralSettings = {
  store_name: 'My Store',
  store_email: '',
  store_phone: '',
  store_address: {
    address_line_1: '',
    city: 'Lusaka',
    state: 'Lusaka Province',
    postal_code: '',
    country: 'ZM'  // ZAMBIA DEFAULT
  },
  timezone: 'Africa/Lusaka',  // ZAMBIA TIMEZONE (CAT, UTC+2)
  date_format: 'DD/MM/YYYY',  // Day-first format common in Zambia
  time_format: '24h',          // 24-hour format common in Zambia
  weight_unit: 'kg',           // Metric system
  dimension_unit: 'cm'         // Metric system
}

const defaultCurrencySettings: CurrencySettings = {
  default_currency: DEFAULT_CURRENCY,     // Platform default (ZMW)
  currency_position: 'before', 
  currency_symbol: DEFAULT_CURRENCY_SYMBOL,  // Platform default symbol (K)
  decimal_separator: '.',
  thousand_separator: ',',
  decimal_places: 2,
  supported_currencies: [DEFAULT_CURRENCY, 'USD', 'ZAR', 'GBP', 'EUR'],  // Platform default first
  auto_currency_conversion: false
}

const defaultTaxSettings: TaxSettings = {
  tax_enabled: false,          // Tax disabled by default
  prices_include_tax: false,   // Prices shown exclusive of tax
  tax_based_on: 'shipping',
  shipping_tax_class: 'standard',
  display_prices: 'excluding', // Display prices excluding tax
  display_in_cart: 'excluding',
  tax_rounding_mode: 'round',
  tax_zones: [
    {
      id: 'default-tax',
      name: 'Platform default',
      countries: [],
      states: [],
      tax_rates: [
        {
          id: 'default-standard',
          name: 'Standard Tax',
          rate: 0,   // No default tax rate - configure per region
          tax_class: 'standard',
          compound: false,
          shipping_taxable: false
        }
      ]
    }
  ]
}

const defaultShippingSettings: ShippingSettings = {
  enable_shipping: true,
  shipping_origin: {
    address_line_1: '',
    city: 'Lusaka',
    state: 'Lusaka Province',
    postal_code: '',
    country: 'ZM'  // ZAMBIA DEFAULT
  },
  shipping_zones: [],  // Will be configured in settings UI
  default_package_dimensions: {
    length: 25,   // cm
    width: 20,    // cm
    height: 15,   // cm
    weight: 1     // kg
  },
  shipping_calculations: 'per_order'
}

const defaultPaymentSettings: PaymentSettings = {
  accepted_methods: ['credit_card'],
  gateways: [],
  capture_mode: 'automatic',
  statement_descriptor: 'My Store',
  allow_partial_payments: false,
  min_order_amount: 0
}

const defaultCheckoutSettings: CheckoutSettings = {
  guest_checkout: true,
  require_phone: false,
  require_company: false,
  address_autocomplete: false,
  show_order_notes: true,
  checkout_fields: [],
  express_checkout: {
    enabled: false,
    providers: []
  }
}

const defaultNotificationSettings: NotificationSettings = {
  email_from_name: 'My Store',
  email_from_address: '',
  email_footer_text: '',
  templates: [],
  admin_notifications: {
    new_order: true,
    low_stock: true,
    new_review: true,
    refund_request: true
  }
}

const defaultInventorySettings: InventorySettings = {
  track_inventory: true,
  allow_backorders: 'no',
  hold_stock_minutes: 60,
  low_stock_threshold: 5,
  out_of_stock_visibility: 'show_marked',
  stock_display: 'low_only',
  manage_stock_status: true,
  reserved_stock_expiry_hours: 24
}

const defaultLegalSettings: LegalSettings = {
  terms_and_conditions: '',
  privacy_policy: '',
  refund_policy: '',
  shipping_policy: '',
  cookie_policy: '',
  terms_accepted_timestamp_required: true,
  minimum_age_verification: undefined,
  pages: [],
  require_terms_acceptance: false,
  require_privacy_acceptance: false,
  gdpr_enabled: false,
  show_cookie_banner: false
}

// ============================================================================
// GET SETTINGS
// ============================================================================

/**
 * Get all settings for a site
 */
export async function getAllSettings(
  siteId: string
): Promise<EcommerceSettingsComplete> {
  const supabase = await getModuleClient()

  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_settings`)
    .select('*')
    .eq('site_id', siteId)
    .single()

  if (error || !data) {
    // Return defaults if no settings exist
    return {
      general: defaultGeneralSettings,
      currency: defaultCurrencySettings,
      tax: defaultTaxSettings,
      shipping: defaultShippingSettings,
      payments: defaultPaymentSettings,
      checkout: defaultCheckoutSettings,
      notifications: defaultNotificationSettings,
      inventory: defaultInventorySettings,
      legal: defaultLegalSettings,
      quotes: null // Quote settings use separate table
    }
  }

  // Merge with defaults to ensure all fields exist
  // For currency: also sync with top-level `currency` column as source of truth
  const currencyFromTopLevel = data.currency || defaultCurrencySettings.default_currency
  const mergedCurrency: CurrencySettings = {
    ...defaultCurrencySettings,
    ...data.currency_settings,
    // Top-level currency column is the source of truth (used by useCurrency() hook)
    default_currency: data.currency_settings?.default_currency || currencyFromTopLevel,
  }

  return {
    general: { ...defaultGeneralSettings, ...data.general_settings },
    currency: mergedCurrency,
    tax: { ...defaultTaxSettings, ...data.tax_settings },
    shipping: { ...defaultShippingSettings, ...data.shipping_settings },
    payments: { ...defaultPaymentSettings, ...data.payment_settings },
    checkout: { ...defaultCheckoutSettings, ...data.checkout_settings },
    notifications: { ...defaultNotificationSettings, ...data.notification_settings },
    inventory: { ...defaultInventorySettings, ...data.inventory_settings },
    legal: { ...defaultLegalSettings, ...data.legal_settings },
    quotes: null // Quote settings use separate table (mod_ecommod01_quote_settings)
  }
}

/**
 * Get specific settings tab
 */
export async function getSettingsTab<T>(
  siteId: string,
  tab: SettingsTab
): Promise<T> {
  const allSettings = await getAllSettings(siteId)
  return allSettings[tab] as T
}

// ============================================================================
// UPDATE SETTINGS
// ============================================================================

/**
 * Update settings for a specific tab
 */
export async function updateSettings(
  siteId: string,
  agencyId: string,
  tab: SettingsTab,
  data: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await getModuleClient()

  // Get column name for the tab
  const columnMap: Record<SettingsTab, string> = {
    general: 'general_settings',
    currency: 'currency_settings',
    tax: 'tax_settings',
    shipping: 'shipping_settings',
    payments: 'payment_settings',
    checkout: 'checkout_settings',
    notifications: 'notification_settings',
    inventory: 'inventory_settings',
    legal: 'legal_settings',
    quotes: 'quote_settings' // Uses separate table (mod_ecommod01_quote_settings)
  }

  const column = columnMap[tab]

  // Quote settings use a separate table — redirect to the dedicated table
  if (tab === 'quotes') {
    const { data: existingQS } = await supabase
      .from(`${TABLE_PREFIX}_quote_settings`)
      .select('id')
      .eq('site_id', siteId)
      .single()

    if (existingQS) {
      const { error } = await supabase
        .from(`${TABLE_PREFIX}_quote_settings`)
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('site_id', siteId)
      if (error) return { success: false, error: error.message }
    } else {
      const { error } = await supabase
        .from(`${TABLE_PREFIX}_quote_settings`)
        .insert({ site_id: siteId, agency_id: agencyId, ...data })
      if (error) return { success: false, error: error.message }
    }
    return { success: true }
  }

  // Check if settings row exists
  const { data: existing } = await supabase
    .from(`${TABLE_PREFIX}_settings`)
    .select('id')
    .eq('site_id', siteId)
    .single()

  if (existing) {
    // Update existing
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_settings`)
      .update({ [column]: data, updated_at: new Date().toISOString() })
      .eq('site_id', siteId)

    if (error) {
      return { success: false, error: error.message }
    }
  } else {
    // Insert new
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_settings`)
      .insert({
        site_id: siteId,
        agency_id: agencyId,
        [column]: data
      })

    if (error) {
      return { success: false, error: error.message }
    }
  }

  return { success: true }
}

/**
 * Update general settings
 */
export async function updateGeneralSettings(
  siteId: string,
  agencyId: string,
  settings: GeneralSettings
): Promise<{ success: boolean; error?: string }> {
  return updateSettings(siteId, agencyId, 'general', settings as unknown as Record<string, unknown>)
}

/**
 * Update currency settings
 * 
 * Also syncs the top-level `currency` column so `useCurrency()` hook
 * always reads the same value as the Settings page shows.
 */
export async function updateCurrencySettings(
  siteId: string,
  agencyId: string,
  settings: CurrencySettings
): Promise<{ success: boolean; error?: string }> {
  // Save the JSONB currency_settings
  const result = await updateSettings(siteId, agencyId, 'currency', settings as unknown as Record<string, unknown>)
  
  if (result.success && settings.default_currency) {
    // Sync top-level `currency` column so useCurrency() hook reads the same value
    const supabase = await getModuleClient()
    await supabase
      .from(`${TABLE_PREFIX}_settings`)
      .update({ currency: settings.default_currency })
      .eq('site_id', siteId)
  }
  
  return result
}

/**
 * Update tax settings
 */
export async function updateTaxSettings(
  siteId: string,
  agencyId: string,
  settings: TaxSettings
): Promise<{ success: boolean; error?: string }> {
  return updateSettings(siteId, agencyId, 'tax', settings as unknown as Record<string, unknown>)
}

/**
 * Update shipping settings
 */
export async function updateShippingSettings(
  siteId: string,
  agencyId: string,
  settings: ShippingSettings
): Promise<{ success: boolean; error?: string }> {
  return updateSettings(siteId, agencyId, 'shipping', settings as unknown as Record<string, unknown>)
}

/**
 * Update payment settings
 */
export async function updatePaymentSettings(
  siteId: string,
  agencyId: string,
  settings: PaymentSettings
): Promise<{ success: boolean; error?: string }> {
  return updateSettings(siteId, agencyId, 'payments', settings as unknown as Record<string, unknown>)
}

/**
 * Update checkout settings
 */
export async function updateCheckoutSettings(
  siteId: string,
  agencyId: string,
  settings: CheckoutSettings
): Promise<{ success: boolean; error?: string }> {
  return updateSettings(siteId, agencyId, 'checkout', settings as unknown as Record<string, unknown>)
}

/**
 * Update notification settings
 */
export async function updateNotificationSettings(
  siteId: string,
  agencyId: string,
  settings: NotificationSettings
): Promise<{ success: boolean; error?: string }> {
  return updateSettings(siteId, agencyId, 'notifications', settings as unknown as Record<string, unknown>)
}

/**
 * Update inventory settings
 */
export async function updateInventorySettings(
  siteId: string,
  agencyId: string,
  settings: InventorySettings
): Promise<{ success: boolean; error?: string }> {
  return updateSettings(siteId, agencyId, 'inventory', settings as unknown as Record<string, unknown>)
}

/**
 * Update legal settings
 */
export async function updateLegalSettings(
  siteId: string,
  agencyId: string,
  settings: LegalSettings
): Promise<{ success: boolean; error?: string }> {
  return updateSettings(siteId, agencyId, 'legal', settings as unknown as Record<string, unknown>)
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Test payment gateway connection
 */
export async function testPaymentGateway(
  _gatewayId: string,
  apiKey: string,
  secretKey: string
): Promise<{ success: boolean; message: string }> {
  // In production, this would actually test the gateway connection
  // For now, return a simulated response
  
  if (!apiKey || !secretKey) {
    return { success: false, message: 'API key and secret key are required' }
  }

  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  return { success: true, message: 'Connection successful' }
}
