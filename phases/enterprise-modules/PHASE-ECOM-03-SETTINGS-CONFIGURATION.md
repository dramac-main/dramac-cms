# PHASE-ECOM-03: Settings & Configuration Center

> **Priority**: 🟠 HIGH
> **Estimated Time**: 8-10 hours
> **Prerequisites**: PHASE-ECOM-01 (Dashboard Redesign)
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Implement a comprehensive settings center with tabbed interface covering General, Currency, Tax, Shipping, Payments, Checkout, Notifications, Inventory, and Legal settings. This phase ensures stores can be fully configured without database access, with all settings persisted and validated.

---

## 📋 Pre-Implementation Checklist

- [ ] Read memory bank files (`/memory-bank/*.md`)
- [ ] PHASE-ECOM-01 is complete and tested
- [ ] Review existing settings in ecommerce-types.ts
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## 🏗️ Architecture Overview

```
Settings View
├── Navigation Tabs (horizontal scroll on mobile)
│   ├── General
│   ├── Currency
│   ├── Tax
│   ├── Shipping
│   ├── Payments
│   ├── Checkout
│   ├── Notifications
│   ├── Inventory
│   └── Legal
├── Tab Content
│   ├── Form Fields (per tab)
│   ├── Validation Messages
│   └── Save Button (per tab)
└── Unsaved Changes Warning
```

---

## 📁 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/modules/ecommerce/types/ecommerce-types.ts` | Modify | Add comprehensive settings types |
| `src/modules/ecommerce/actions/settings-actions.ts` | Create | Settings CRUD server actions |
| `src/modules/ecommerce/components/views/settings-view.tsx` | Create | Main settings container |
| `src/modules/ecommerce/components/settings/general-settings.tsx` | Create | General store settings |
| `src/modules/ecommerce/components/settings/currency-settings.tsx` | Create | Currency configuration |
| `src/modules/ecommerce/components/settings/tax-settings.tsx` | Create | Tax zones and rates |
| `src/modules/ecommerce/components/settings/shipping-settings.tsx` | Create | Shipping zones and methods |
| `src/modules/ecommerce/components/settings/payment-settings.tsx` | Create | Payment gateway config |
| `src/modules/ecommerce/components/settings/checkout-settings.tsx` | Create | Checkout customization |
| `src/modules/ecommerce/components/settings/notification-settings.tsx` | Create | Email notifications |
| `src/modules/ecommerce/components/settings/inventory-settings.tsx` | Create | Inventory policies |
| `src/modules/ecommerce/components/settings/legal-settings.tsx` | Create | Legal documents |
| `src/modules/ecommerce/components/settings/index.ts` | Create | Settings exports |

---

## 📋 Implementation Tasks

### Task 3.1: Add Comprehensive Settings Types

**File**: `src/modules/ecommerce/types/ecommerce-types.ts`
**Action**: Modify (Add to end of file)

**Description**: Add complete settings type definitions

```typescript
// ============================================================================
// SETTINGS CONFIGURATION TYPES (Phase ECOM-03)
// ============================================================================

export type SettingsTab = 
  | 'general'
  | 'currency'
  | 'tax'
  | 'shipping'
  | 'payments'
  | 'checkout'
  | 'notifications'
  | 'inventory'
  | 'legal'

export interface GeneralSettings {
  store_name: string
  store_email: string
  store_phone: string
  store_address: {
    address_line_1: string
    address_line_2?: string
    city: string
    state: string
    postal_code: string
    country: string
  }
  timezone: string
  date_format: string
  time_format: string
  weight_unit: 'kg' | 'lb' | 'g' | 'oz'
  dimension_unit: 'cm' | 'in' | 'm' | 'ft'
}

export interface CurrencySettings {
  default_currency: string
  currency_position: 'before' | 'after'
  currency_symbol: string
  decimal_separator: string
  thousand_separator: string
  decimal_places: number
  supported_currencies: string[]
  auto_currency_conversion: boolean
}

export interface TaxZone {
  id: string
  name: string
  countries: string[]
  states?: string[]
  tax_rates: TaxRate[]
}

export interface TaxRate {
  id: string
  name: string
  rate: number // Percentage
  tax_class: string
  compound: boolean // Apply on top of other taxes
  shipping_taxable: boolean
}

export interface TaxSettings {
  tax_enabled: boolean
  prices_include_tax: boolean
  tax_based_on: 'billing' | 'shipping' | 'store'
  shipping_tax_class: string
  display_prices: 'including' | 'excluding'
  display_in_cart: 'including' | 'excluding' | 'both'
  tax_rounding_mode: 'round' | 'ceil' | 'floor'
  tax_zones: TaxZone[]
}

export interface ShippingZone {
  id: string
  name: string
  regions: string[] // Country/state codes
  methods: ShippingMethod[]
}

export interface ShippingMethod {
  id: string
  name: string
  type: 'flat_rate' | 'free_shipping' | 'local_pickup' | 'table_rate' | 'carrier_calculated'
  enabled: boolean
  cost: number
  free_shipping_threshold?: number
  min_order_amount?: number
  max_order_amount?: number
  handling_fee?: number
  tax_status: 'taxable' | 'none'
  delivery_time?: string
}

export interface ShippingSettings {
  enable_shipping: boolean
  shipping_origin: {
    address_line_1: string
    address_line_2?: string
    city: string
    state: string
    postal_code: string
    country: string
  }
  shipping_zones: ShippingZone[]
  default_package_dimensions: {
    length: number
    width: number
    height: number
    weight: number
  }
  shipping_calculations: 'per_order' | 'per_item' | 'per_class'
}

export interface PaymentGateway {
  id: string
  name: string
  type: 'stripe' | 'paypal' | 'square' | 'manual' | 'cod' | 'bank_transfer'
  enabled: boolean
  test_mode: boolean
  api_key?: string
  secret_key?: string
  webhook_secret?: string
  additional_settings?: Record<string, unknown>
}

export interface PaymentSettings {
  accepted_methods: ('credit_card' | 'paypal' | 'bank_transfer' | 'cod')[]
  gateways: PaymentGateway[]
  capture_mode: 'automatic' | 'manual'
  statement_descriptor: string
  allow_partial_payments: boolean
  min_order_amount: number
  max_order_amount?: number
}

export interface CheckoutSettings {
  guest_checkout: boolean
  require_phone: boolean
  require_company: boolean
  address_autocomplete: boolean
  show_order_notes: boolean
  terms_page_id?: string
  privacy_page_id?: string
  thank_you_page_id?: string
  checkout_fields: CheckoutField[]
  express_checkout: {
    enabled: boolean
    providers: ('apple_pay' | 'google_pay' | 'paypal_express')[]
  }
}

export interface CheckoutField {
  id: string
  name: string
  label: string
  type: 'text' | 'email' | 'phone' | 'select' | 'checkbox' | 'textarea'
  required: boolean
  enabled: boolean
  position: 'billing' | 'shipping' | 'order'
  options?: string[]
}

export interface NotificationTemplate {
  id: string
  type: 'order_confirmation' | 'order_shipped' | 'order_delivered' | 'order_cancelled' | 'payment_received' | 'refund_issued' | 'low_stock' | 'back_in_stock' | 'abandoned_cart'
  enabled: boolean
  subject: string
  body: string
  send_to: 'customer' | 'admin' | 'both'
}

export interface NotificationSettings {
  email_from_name: string
  email_from_address: string
  email_header_logo?: string
  email_footer_text: string
  templates: NotificationTemplate[]
  admin_notifications: {
    new_order: boolean
    low_stock: boolean
    new_review: boolean
    refund_request: boolean
  }
}

export interface InventorySettings {
  track_inventory: boolean
  allow_backorders: 'no' | 'notify' | 'yes'
  hold_stock_minutes: number
  low_stock_threshold: number
  out_of_stock_visibility: 'hide' | 'show' | 'show_marked'
  stock_display: 'always' | 'low_only' | 'never'
  manage_stock_status: boolean
  reserved_stock_expiry_hours: number
}

export interface LegalSettings {
  terms_and_conditions: string
  privacy_policy: string
  refund_policy: string
  shipping_policy: string
  cookie_policy?: string
  terms_accepted_timestamp_required: boolean
  minimum_age_verification?: number
}

export interface EcommerceSettingsComplete {
  general: GeneralSettings
  currency: CurrencySettings
  tax: TaxSettings
  shipping: ShippingSettings
  payments: PaymentSettings
  checkout: CheckoutSettings
  notifications: NotificationSettings
  inventory: InventorySettings
  legal: LegalSettings
}
```

---

### Task 3.2: Create Settings Server Actions

**File**: `src/modules/ecommerce/actions/settings-actions.ts`
**Action**: Create

**Description**: Server actions for settings CRUD operations

```typescript
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
  return updateSettings(siteId, agencyId, 'general', settings)
}

/**
 * Update currency settings
 */
export async function updateCurrencySettings(
  siteId: string,
  agencyId: string,
  settings: CurrencySettings
): Promise<{ success: boolean; error?: string }> {
  return updateSettings(siteId, agencyId, 'currency', settings)
}

/**
 * Update tax settings
 */
export async function updateTaxSettings(
  siteId: string,
  agencyId: string,
  settings: TaxSettings
): Promise<{ success: boolean; error?: string }> {
  return updateSettings(siteId, agencyId, 'tax', settings)
}

/**
 * Update shipping settings
 */
export async function updateShippingSettings(
  siteId: string,
  agencyId: string,
  settings: ShippingSettings
): Promise<{ success: boolean; error?: string }> {
  return updateSettings(siteId, agencyId, 'shipping', settings)
}

/**
 * Update payment settings
 */
export async function updatePaymentSettings(
  siteId: string,
  agencyId: string,
  settings: PaymentSettings
): Promise<{ success: boolean; error?: string }> {
  return updateSettings(siteId, agencyId, 'payments', settings)
}

/**
 * Update checkout settings
 */
export async function updateCheckoutSettings(
  siteId: string,
  agencyId: string,
  settings: CheckoutSettings
): Promise<{ success: boolean; error?: string }> {
  return updateSettings(siteId, agencyId, 'checkout', settings)
}

/**
 * Update notification settings
 */
export async function updateNotificationSettings(
  siteId: string,
  agencyId: string,
  settings: NotificationSettings
): Promise<{ success: boolean; error?: string }> {
  return updateSettings(siteId, agencyId, 'notifications', settings)
}

/**
 * Update inventory settings
 */
export async function updateInventorySettings(
  siteId: string,
  agencyId: string,
  settings: InventorySettings
): Promise<{ success: boolean; error?: string }> {
  return updateSettings(siteId, agencyId, 'inventory', settings)
}

/**
 * Update legal settings
 */
export async function updateLegalSettings(
  siteId: string,
  agencyId: string,
  settings: LegalSettings
): Promise<{ success: boolean; error?: string }> {
  return updateSettings(siteId, agencyId, 'legal', settings)
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Test payment gateway connection
 */
export async function testPaymentGateway(
  gatewayId: string,
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
    // Add more as needed
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
    // Add more as needed
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
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata',
    'Australia/Sydney',
    'Pacific/Auckland'
  ]
}
```

---

### Task 3.3: Create General Settings Component

**File**: `src/modules/ecommerce/components/settings/general-settings.tsx`
**Action**: Create

**Description**: General store settings form

```typescript
/**
 * General Settings Component
 * 
 * Phase ECOM-03: Settings & Configuration Center
 * 
 * Basic store information and regional settings
 */
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import type { GeneralSettings } from '../../types/ecommerce-types'
import { getSettingsTab, updateGeneralSettings, getTimezoneList, getCountryList } from '../../actions/settings-actions'

// ============================================================================
// TYPES
// ============================================================================

interface GeneralSettingsFormProps {
  siteId: string
  agencyId: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function GeneralSettingsForm({ siteId, agencyId }: GeneralSettingsFormProps) {
  const [settings, setSettings] = useState<GeneralSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const timezones = getTimezoneList()
  const countries = getCountryList()

  // Load settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getSettingsTab<GeneralSettings>(siteId, 'general')
        setSettings(data)
      } catch (error) {
        console.error('Error loading settings:', error)
        toast.error('Failed to load settings')
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [siteId])

  // Update handler
  const updateField = <K extends keyof GeneralSettings>(
    field: K, 
    value: GeneralSettings[K]
  ) => {
    if (!settings) return
    setSettings({ ...settings, [field]: value })
    setHasChanges(true)
  }

  const updateAddressField = (field: string, value: string) => {
    if (!settings) return
    setSettings({
      ...settings,
      store_address: { ...settings.store_address, [field]: value }
    })
    setHasChanges(true)
  }

  // Save handler
  const handleSave = async () => {
    if (!settings) return
    
    setIsSaving(true)
    try {
      const result = await updateGeneralSettings(siteId, agencyId, settings)
      if (result.success) {
        toast.success('Settings saved successfully')
        setHasChanges(false)
      } else {
        toast.error(result.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Store Information */}
      <Card>
        <CardHeader>
          <CardTitle>Store Information</CardTitle>
          <CardDescription>
            Basic information about your store
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="store_name">Store Name</Label>
              <Input
                id="store_name"
                value={settings.store_name}
                onChange={(e) => updateField('store_name', e.target.value)}
                placeholder="My Store"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store_email">Store Email</Label>
              <Input
                id="store_email"
                type="email"
                value={settings.store_email}
                onChange={(e) => updateField('store_email', e.target.value)}
                placeholder="store@example.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="store_phone">Store Phone</Label>
            <Input
              id="store_phone"
              value={settings.store_phone}
              onChange={(e) => updateField('store_phone', e.target.value)}
              placeholder="+1 (555) 000-0000"
            />
          </div>
        </CardContent>
      </Card>

      {/* Store Address */}
      <Card>
        <CardHeader>
          <CardTitle>Store Address</CardTitle>
          <CardDescription>
            Physical location of your store
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address_line_1">Address Line 1</Label>
            <Input
              id="address_line_1"
              value={settings.store_address.address_line_1}
              onChange={(e) => updateAddressField('address_line_1', e.target.value)}
              placeholder="123 Main Street"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address_line_2">Address Line 2 (Optional)</Label>
            <Input
              id="address_line_2"
              value={settings.store_address.address_line_2 || ''}
              onChange={(e) => updateAddressField('address_line_2', e.target.value)}
              placeholder="Suite 100"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={settings.store_address.city}
                onChange={(e) => updateAddressField('city', e.target.value)}
                placeholder="New York"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State / Province</Label>
              <Input
                id="state"
                value={settings.store_address.state}
                onChange={(e) => updateAddressField('state', e.target.value)}
                placeholder="NY"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                value={settings.store_address.postal_code}
                onChange={(e) => updateAddressField('postal_code', e.target.value)}
                placeholder="10001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select
                value={settings.store_address.country}
                onValueChange={(value) => updateAddressField('country', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regional Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Regional Settings</CardTitle>
          <CardDescription>
            Timezone, date format, and units
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={settings.timezone}
                onValueChange={(value) => updateField('timezone', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_format">Date Format</Label>
              <Select
                value={settings.date_format}
                onValueChange={(value) => updateField('date_format', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="weight_unit">Weight Unit</Label>
              <Select
                value={settings.weight_unit}
                onValueChange={(value) => updateField('weight_unit', value as 'kg' | 'lb' | 'g' | 'oz')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">Kilograms (kg)</SelectItem>
                  <SelectItem value="lb">Pounds (lb)</SelectItem>
                  <SelectItem value="g">Grams (g)</SelectItem>
                  <SelectItem value="oz">Ounces (oz)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dimension_unit">Dimension Unit</Label>
              <Select
                value={settings.dimension_unit}
                onValueChange={(value) => updateField('dimension_unit', value as 'cm' | 'in' | 'm' | 'ft')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cm">Centimeters (cm)</SelectItem>
                  <SelectItem value="in">Inches (in)</SelectItem>
                  <SelectItem value="m">Meters (m)</SelectItem>
                  <SelectItem value="ft">Feet (ft)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isSaving || !hasChanges}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
```

---

### Task 3.4: Create Currency Settings Component

**File**: `src/modules/ecommerce/components/settings/currency-settings.tsx`
**Action**: Create

**Description**: Currency configuration form

```typescript
/**
 * Currency Settings Component
 * 
 * Phase ECOM-03: Settings & Configuration Center
 * 
 * Currency format and multi-currency settings
 */
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import type { CurrencySettings } from '../../types/ecommerce-types'
import { getSettingsTab, updateCurrencySettings, getCurrencyList } from '../../actions/settings-actions'

// ============================================================================
// TYPES
// ============================================================================

interface CurrencySettingsFormProps {
  siteId: string
  agencyId: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CurrencySettingsForm({ siteId, agencyId }: CurrencySettingsFormProps) {
  const [settings, setSettings] = useState<CurrencySettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const currencies = getCurrencyList()

  // Load settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getSettingsTab<CurrencySettings>(siteId, 'currency')
        setSettings(data)
      } catch (error) {
        console.error('Error loading settings:', error)
        toast.error('Failed to load settings')
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [siteId])

  // Update handler
  const updateField = <K extends keyof CurrencySettings>(
    field: K, 
    value: CurrencySettings[K]
  ) => {
    if (!settings) return
    setSettings({ ...settings, [field]: value })
    setHasChanges(true)
  }

  // Add supported currency
  const addSupportedCurrency = (code: string) => {
    if (!settings) return
    if (settings.supported_currencies.includes(code)) return
    updateField('supported_currencies', [...settings.supported_currencies, code])
  }

  // Remove supported currency
  const removeSupportedCurrency = (code: string) => {
    if (!settings) return
    if (code === settings.default_currency) {
      toast.error('Cannot remove default currency')
      return
    }
    updateField(
      'supported_currencies', 
      settings.supported_currencies.filter(c => c !== code)
    )
  }

  // Save handler
  const handleSave = async () => {
    if (!settings) return
    
    setIsSaving(true)
    try {
      const result = await updateCurrencySettings(siteId, agencyId, settings)
      if (result.success) {
        toast.success('Currency settings saved')
        setHasChanges(false)
      } else {
        toast.error(result.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  // Format preview
  const formatPreview = () => {
    if (!settings) return '1,234.56'
    
    const number = 1234.56
    const [whole, decimal] = number.toFixed(settings.decimal_places).split('.')
    const formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, settings.thousand_separator)
    const formatted = `${formattedWhole}${settings.decimal_separator}${decimal}`
    
    return settings.currency_position === 'before' 
      ? `${settings.currency_symbol}${formatted}`
      : `${formatted}${settings.currency_symbol}`
  }

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Default Currency */}
      <Card>
        <CardHeader>
          <CardTitle>Default Currency</CardTitle>
          <CardDescription>
            Primary currency for your store
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="default_currency">Currency</Label>
              <Select
                value={settings.default_currency}
                onValueChange={(value) => {
                  updateField('default_currency', value)
                  const curr = currencies.find(c => c.code === value)
                  if (curr) {
                    updateField('currency_symbol', curr.symbol)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name} ({currency.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency_symbol">Symbol</Label>
              <Input
                id="currency_symbol"
                value={settings.currency_symbol}
                onChange={(e) => updateField('currency_symbol', e.target.value)}
                placeholder="$"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Currency Format */}
      <Card>
        <CardHeader>
          <CardTitle>Currency Format</CardTitle>
          <CardDescription>
            How prices are displayed to customers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="currency_position">Symbol Position</Label>
              <Select
                value={settings.currency_position}
                onValueChange={(value) => updateField('currency_position', value as 'before' | 'after')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="before">Before ($100)</SelectItem>
                  <SelectItem value="after">After (100$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="decimal_places">Decimal Places</Label>
              <Select
                value={String(settings.decimal_places)}
                onValueChange={(value) => updateField('decimal_places', Number(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 (100)</SelectItem>
                  <SelectItem value="1">1 (100.0)</SelectItem>
                  <SelectItem value="2">2 (100.00)</SelectItem>
                  <SelectItem value="3">3 (100.000)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="decimal_separator">Decimal Separator</Label>
              <Select
                value={settings.decimal_separator}
                onValueChange={(value) => updateField('decimal_separator', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=".">Period (.)</SelectItem>
                  <SelectItem value=",">Comma (,)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="thousand_separator">Thousand Separator</Label>
              <Select
                value={settings.thousand_separator}
                onValueChange={(value) => updateField('thousand_separator', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=",">Comma (,)</SelectItem>
                  <SelectItem value=".">Period (.)</SelectItem>
                  <SelectItem value=" ">Space ( )</SelectItem>
                  <SelectItem value="">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-lg border p-4 bg-muted/50">
            <Label className="text-sm text-muted-foreground">Preview</Label>
            <p className="text-2xl font-bold mt-1">{formatPreview()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Multi-Currency */}
      <Card>
        <CardHeader>
          <CardTitle>Multi-Currency</CardTitle>
          <CardDescription>
            Accept payments in multiple currencies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto Currency Conversion</Label>
              <p className="text-sm text-muted-foreground">
                Automatically convert prices based on customer location
              </p>
            </div>
            <Switch
              checked={settings.auto_currency_conversion}
              onCheckedChange={(checked) => updateField('auto_currency_conversion', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label>Supported Currencies</Label>
            <div className="flex flex-wrap gap-2">
              {settings.supported_currencies.map((code) => {
                const curr = currencies.find(c => c.code === code)
                return (
                  <Badge key={code} variant="secondary" className="gap-1">
                    {curr?.symbol} {code}
                    {code !== settings.default_currency && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => removeSupportedCurrency(code)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </Badge>
                )
              })}
            </div>
            
            <Select onValueChange={addSupportedCurrency}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Add currency..." />
              </SelectTrigger>
              <SelectContent>
                {currencies
                  .filter(c => !settings.supported_currencies.includes(c.code))
                  .map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isSaving || !hasChanges}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
```

---

### Task 3.5: Create Inventory Settings Component

**File**: `src/modules/ecommerce/components/settings/inventory-settings.tsx`
**Action**: Create

**Description**: Inventory management settings

```typescript
/**
 * Inventory Settings Component
 * 
 * Phase ECOM-03: Settings & Configuration Center
 * 
 * Inventory tracking and stock management settings
 */
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Loader2, Save, Info } from 'lucide-react'
import { toast } from 'sonner'
import type { InventorySettings } from '../../types/ecommerce-types'
import { getSettingsTab, updateInventorySettings } from '../../actions/settings-actions'

// ============================================================================
// TYPES
// ============================================================================

interface InventorySettingsFormProps {
  siteId: string
  agencyId: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function InventorySettingsForm({ siteId, agencyId }: InventorySettingsFormProps) {
  const [settings, setSettings] = useState<InventorySettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Load settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getSettingsTab<InventorySettings>(siteId, 'inventory')
        setSettings(data)
      } catch (error) {
        console.error('Error loading settings:', error)
        toast.error('Failed to load settings')
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [siteId])

  // Update handler
  const updateField = <K extends keyof InventorySettings>(
    field: K, 
    value: InventorySettings[K]
  ) => {
    if (!settings) return
    setSettings({ ...settings, [field]: value })
    setHasChanges(true)
  }

  // Save handler
  const handleSave = async () => {
    if (!settings) return
    
    setIsSaving(true)
    try {
      const result = await updateInventorySettings(siteId, agencyId, settings)
      if (result.success) {
        toast.success('Inventory settings saved')
        setHasChanges(false)
      } else {
        toast.error(result.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stock Management */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Management</CardTitle>
          <CardDescription>
            Configure how inventory is tracked and managed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Track Inventory</Label>
              <p className="text-sm text-muted-foreground">
                Enable stock tracking for products
              </p>
            </div>
            <Switch
              checked={settings.track_inventory}
              onCheckedChange={(checked) => updateField('track_inventory', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Manage Stock Status</Label>
              <p className="text-sm text-muted-foreground">
                Automatically update stock status when inventory changes
              </p>
            </div>
            <Switch
              checked={settings.manage_stock_status}
              onCheckedChange={(checked) => updateField('manage_stock_status', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="allow_backorders">Backorders</Label>
            <Select
              value={settings.allow_backorders}
              onValueChange={(value) => updateField('allow_backorders', value as 'no' | 'notify' | 'yes')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no">Do not allow</SelectItem>
                <SelectItem value="notify">Allow, but notify customer</SelectItem>
                <SelectItem value="yes">Allow</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Low Stock */}
      <Card>
        <CardHeader>
          <CardTitle>Low Stock Alerts</CardTitle>
          <CardDescription>
            Configure when to show low stock warnings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
              <Input
                id="low_stock_threshold"
                type="number"
                min="0"
                value={settings.low_stock_threshold}
                onChange={(e) => updateField('low_stock_threshold', Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Products with stock at or below this number will trigger low stock alerts
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock_display">Stock Display</Label>
              <Select
                value={settings.stock_display}
                onValueChange={(value) => updateField('stock_display', value as 'always' | 'low_only' | 'never')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="always">Always show stock</SelectItem>
                  <SelectItem value="low_only">Only show when low</SelectItem>
                  <SelectItem value="never">Never show stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Out of Stock */}
      <Card>
        <CardHeader>
          <CardTitle>Out of Stock Behavior</CardTitle>
          <CardDescription>
            What happens when products run out of stock
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="out_of_stock_visibility">Out of Stock Visibility</Label>
            <Select
              value={settings.out_of_stock_visibility}
              onValueChange={(value) => updateField('out_of_stock_visibility', value as 'hide' | 'show' | 'show_marked')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hide">Hide out of stock products</SelectItem>
                <SelectItem value="show">Show out of stock products</SelectItem>
                <SelectItem value="show_marked">Show with &quot;Out of Stock&quot; badge</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reserved Stock */}
      <Card>
        <CardHeader>
          <CardTitle>Reserved Stock</CardTitle>
          <CardDescription>
            Manage stock reservation during checkout
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hold_stock_minutes">Hold Stock Duration</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="hold_stock_minutes"
                  type="number"
                  min="0"
                  value={settings.hold_stock_minutes}
                  onChange={(e) => updateField('hold_stock_minutes', Number(e.target.value))}
                />
                <span className="text-sm text-muted-foreground">minutes</span>
              </div>
              <p className="text-xs text-muted-foreground">
                How long to reserve stock for pending orders (0 = no reservation)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reserved_stock_expiry">Reserved Stock Expiry</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="reserved_stock_expiry"
                  type="number"
                  min="0"
                  value={settings.reserved_stock_expiry_hours}
                  onChange={(e) => updateField('reserved_stock_expiry_hours', Number(e.target.value))}
                />
                <span className="text-sm text-muted-foreground">hours</span>
              </div>
              <p className="text-xs text-muted-foreground">
                When to release stock from unpaid orders
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium">How stock reservation works</p>
                <p className="mt-1 text-blue-600 dark:text-blue-400">
                  When a customer adds items to their cart and starts checkout, 
                  stock is reserved for the duration you specify. If the order 
                  isn&apos;t completed within that time, the stock is automatically released.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isSaving || !hasChanges}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
```

---

### Task 3.6: Create Settings Exports

**File**: `src/modules/ecommerce/components/settings/index.ts`
**Action**: Create

**Description**: Export all settings components

```typescript
/**
 * E-Commerce Settings Components
 * 
 * Phase ECOM-03: Settings & Configuration Center
 */

export { GeneralSettingsForm } from './general-settings'
export { CurrencySettingsForm } from './currency-settings'
export { InventorySettingsForm } from './inventory-settings'
// Export other settings components as they are created
```

---

### Task 3.7: Create Main Settings View

**File**: `src/modules/ecommerce/components/views/settings-view.tsx`
**Action**: Create

**Description**: Main settings container with tab navigation

```typescript
/**
 * Settings View Component
 * 
 * Phase ECOM-03: Settings & Configuration Center
 * 
 * Main settings container with tabbed navigation
 */
'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { 
  Store, 
  DollarSign, 
  Receipt, 
  Truck, 
  CreditCard, 
  ShoppingCart, 
  Bell, 
  Package, 
  FileText 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { GeneralSettingsForm } from '../settings/general-settings'
import { CurrencySettingsForm } from '../settings/currency-settings'
import { InventorySettingsForm } from '../settings/inventory-settings'
import type { SettingsTab } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface SettingsViewProps {
  siteId: string
  agencyId: string
}

interface TabConfig {
  id: SettingsTab
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

// ============================================================================
// TAB CONFIGURATION
// ============================================================================

const tabs: TabConfig[] = [
  {
    id: 'general',
    label: 'General',
    icon: Store,
    description: 'Store name, address, and regional settings'
  },
  {
    id: 'currency',
    label: 'Currency',
    icon: DollarSign,
    description: 'Currency format and multi-currency options'
  },
  {
    id: 'tax',
    label: 'Tax',
    icon: Receipt,
    description: 'Tax zones, rates, and calculations'
  },
  {
    id: 'shipping',
    label: 'Shipping',
    icon: Truck,
    description: 'Shipping zones and delivery methods'
  },
  {
    id: 'payments',
    label: 'Payments',
    icon: CreditCard,
    description: 'Payment gateways and options'
  },
  {
    id: 'checkout',
    label: 'Checkout',
    icon: ShoppingCart,
    description: 'Checkout flow and fields'
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    description: 'Email templates and alerts'
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Package,
    description: 'Stock management policies'
  },
  {
    id: 'legal',
    label: 'Legal',
    icon: FileText,
    description: 'Terms, privacy, and policies'
  }
]

// ============================================================================
// PLACEHOLDER COMPONENT
// ============================================================================

function SettingsPlaceholder({ tab }: { tab: TabConfig }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-4 rounded-full bg-muted mb-4">
        <tab.icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium">{tab.label} Settings</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-md">
        {tab.description}. This section will be implemented in a future update.
      </p>
    </div>
  )
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SettingsView({ siteId, agencyId }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')

  // Render tab content
  const renderTabContent = (tabId: SettingsTab) => {
    switch (tabId) {
      case 'general':
        return <GeneralSettingsForm siteId={siteId} agencyId={agencyId} />
      case 'currency':
        return <CurrencySettingsForm siteId={siteId} agencyId={agencyId} />
      case 'inventory':
        return <InventorySettingsForm siteId={siteId} agencyId={agencyId} />
      default:
        const tab = tabs.find(t => t.id === tabId)!
        return <SettingsPlaceholder tab={tab} />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Configure your e-commerce store settings
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SettingsTab)}>
        {/* Tab List - Horizontal scroll on mobile */}
        <ScrollArea className="w-full">
          <TabsList className="inline-flex h-auto p-1 mb-6">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 whitespace-nowrap',
                  'data-[state=active]:bg-background data-[state=active]:shadow-sm'
                )}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Tab Content */}
        {tabs.map((tab) => (
          <TabsContent 
            key={tab.id} 
            value={tab.id}
            className="mt-0"
          >
            {renderTabContent(tab.id)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
```

---

## 🗄️ Database Migration

**File**: `migrations/XXXX_ecommerce_settings.sql`

```sql
-- E-Commerce Settings Table
-- Phase ECOM-03: Settings & Configuration Center

CREATE TABLE IF NOT EXISTS mod_ecommod01_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Settings JSON columns
  general_settings JSONB DEFAULT '{}',
  currency_settings JSONB DEFAULT '{}',
  tax_settings JSONB DEFAULT '{}',
  shipping_settings JSONB DEFAULT '{}',
  payment_settings JSONB DEFAULT '{}',
  checkout_settings JSONB DEFAULT '{}',
  notification_settings JSONB DEFAULT '{}',
  inventory_settings JSONB DEFAULT '{}',
  legal_settings JSONB DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(site_id)
);

-- Index for fast lookups
CREATE INDEX idx_ecom_settings_site ON mod_ecommod01_settings(site_id);

-- RLS Policies
ALTER TABLE mod_ecommod01_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view settings for their sites" ON mod_ecommod01_settings
  FOR SELECT USING (
    site_id IN (
      SELECT site_id FROM user_site_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update settings for their sites" ON mod_ecommod01_settings
  FOR ALL USING (
    site_id IN (
      SELECT site_id FROM user_site_access WHERE user_id = auth.uid()
    )
  );
```

---

## ✅ Testing Checklist

- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] No ESLint errors
- [ ] Settings view loads without errors
- [ ] Tab navigation works correctly
- [ ] Horizontal scroll works on mobile
- [ ] General settings form saves and loads
- [ ] Currency settings form saves and loads
- [ ] Currency format preview updates in real-time
- [ ] Inventory settings form saves and loads
- [ ] Unsaved changes warning works
- [ ] Form validation displays errors correctly
- [ ] Settings persist after page refresh
- [ ] Empty states show for unimplemented tabs

---

## 🔄 Rollback Plan

If issues occur:
1. Remove settings view and components
2. Remove settings actions
3. Revert type additions
4. Drop database table if created

```bash
rm -rf src/modules/ecommerce/components/settings/
rm src/modules/ecommerce/components/views/settings-view.tsx
rm src/modules/ecommerce/actions/settings-actions.ts
```

---

## 📝 Memory Bank Updates

After completion, update these files:
- `activeContext.md`: Add "✅ PHASE-ECOM-03: Settings & Configuration Center Complete"
- `progress.md`: Update e-commerce section with settings status

---

## ✨ Success Criteria

- [ ] Settings view renders with all 9 tabs
- [ ] Tab navigation is smooth and responsive
- [ ] General settings can be saved and retrieved
- [ ] Currency settings update format preview
- [ ] Inventory settings save correctly
- [ ] Database table created and RLS enabled
- [ ] Form validation prevents invalid data
- [ ] TypeScript compiles with zero errors
