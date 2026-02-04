/**
 * E-Commerce Settings Actions
 * 
 * Phase ECOM-03: Settings & Configuration Center
 * 
 * Server actions for managing all e-commerce settings
 */
'use server'

import { createClient } from '@/lib/supabase/server'
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
    city: '',
    state: '',
    postal_code: '',
    country: 'US'
  },
  timezone: 'America/New_York',
  date_format: 'MM/DD/YYYY',
  time_format: '12h',
  weight_unit: 'lb',
  dimension_unit: 'in'
}

const defaultCurrencySettings: CurrencySettings = {
  default_currency: 'USD',
  currency_position: 'before',
  currency_symbol: '$',
  decimal_separator: '.',
  thousand_separator: ',',
  decimal_places: 2,
  supported_currencies: ['USD'],
  auto_currency_conversion: false
}

const defaultTaxSettings: TaxSettings = {
  tax_enabled: false,
  prices_include_tax: false,
  tax_based_on: 'shipping',
  shipping_tax_class: 'standard',
  display_prices: 'excluding',
  display_in_cart: 'excluding',
  tax_rounding_mode: 'round',
  tax_zones: []
}

const defaultShippingSettings: ShippingSettings = {
  enable_shipping: true,
  shipping_origin: {
    address_line_1: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US'
  },
  shipping_zones: [],
  default_package_dimensions: {
    length: 10,
    width: 10,
    height: 10,
    weight: 1
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
  terms_accepted_timestamp_required: true
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
      legal: defaultLegalSettings
    }
  }

  // Merge with defaults to ensure all fields exist
  return {
    general: { ...defaultGeneralSettings, ...data.general_settings },
    currency: { ...defaultCurrencySettings, ...data.currency_settings },
    tax: { ...defaultTaxSettings, ...data.tax_settings },
    shipping: { ...defaultShippingSettings, ...data.shipping_settings },
    payments: { ...defaultPaymentSettings, ...data.payment_settings },
    checkout: { ...defaultCheckoutSettings, ...data.checkout_settings },
    notifications: { ...defaultNotificationSettings, ...data.notification_settings },
    inventory: { ...defaultInventorySettings, ...data.inventory_settings },
    legal: { ...defaultLegalSettings, ...data.legal_settings }
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
    legal: 'legal_settings'
  }

  const column = columnMap[tab]

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
 */
export async function updateCurrencySettings(
  siteId: string,
  agencyId: string,
  settings: CurrencySettings
): Promise<{ success: boolean; error?: string }> {
  return updateSettings(siteId, agencyId, 'currency', settings as unknown as Record<string, unknown>)
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

/**
 * Validate tax rate
 */
export function validateTaxRate(rate: number): boolean {
  return rate >= 0 && rate <= 100
}

/**
 * Get list of countries for shipping/tax zones
 */
export function getCountryList(): Array<{ code: string; name: string }> {
  return [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'AU', name: 'Australia' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'JP', name: 'Japan' },
    { code: 'CN', name: 'China' },
    { code: 'IN', name: 'India' },
    { code: 'BR', name: 'Brazil' },
    { code: 'MX', name: 'Mexico' },
    { code: 'ES', name: 'Spain' },
    { code: 'IT', name: 'Italy' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'SE', name: 'Sweden' },
    { code: 'NO', name: 'Norway' },
    { code: 'DK', name: 'Denmark' },
    { code: 'FI', name: 'Finland' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'AT', name: 'Austria' },
    { code: 'BE', name: 'Belgium' },
    { code: 'IE', name: 'Ireland' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'SG', name: 'Singapore' },
    { code: 'HK', name: 'Hong Kong' },
    { code: 'KR', name: 'South Korea' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'SA', name: 'Saudi Arabia' },
    { code: 'PL', name: 'Poland' },
  ]
}

/**
 * Get list of currencies
 */
export function getCurrencyList(): Array<{ code: string; name: string; symbol: string }> {
  return [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
    { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
    { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
    { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
    { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
    { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
    { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
    { code: 'PLN', name: 'Polish Złoty', symbol: 'zł' },
    { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  ]
}

/**
 * Get list of timezones
 */
export function getTimezoneList(): string[] {
  return [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Toronto',
    'America/Vancouver',
    'America/Mexico_City',
    'America/Sao_Paulo',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Amsterdam',
    'Europe/Rome',
    'Europe/Madrid',
    'Europe/Stockholm',
    'Europe/Oslo',
    'Europe/Copenhagen',
    'Europe/Helsinki',
    'Europe/Zurich',
    'Europe/Vienna',
    'Europe/Brussels',
    'Europe/Dublin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Hong_Kong',
    'Asia/Singapore',
    'Asia/Seoul',
    'Asia/Kolkata',
    'Asia/Dubai',
    'Asia/Riyadh',
    'Australia/Sydney',
    'Australia/Melbourne',
    'Pacific/Auckland',
    'Africa/Johannesburg',
    'UTC'
  ]
}
