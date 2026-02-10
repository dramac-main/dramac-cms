/**
 * Shipping Cost Calculator
 * 
 * Phase FIX-02, Task 7a: Shipping Calculation
 * 
 * Calculates shipping cost based on site's ecommerce settings
 * (shipping zones, free shipping threshold, etc.)
 * Returns cost in cents.
 */

import type {
  EcommerceSettings,
  ShippingZone,
  ShippingMethod,
  Address,
  CartItem,
} from '../types/ecommerce-types'

interface ShippingCalculationInput {
  /** Cart items */
  items: CartItem[]
  /** Shipping address */
  shippingAddress: Address
  /** The ecommerce settings for the site (contains shipping_zones, free_shipping_threshold) */
  settings: EcommerceSettings
  /** Subtotal in cents (after discounts) */
  subtotal: number
  /** Optional shipping method ID to use. If omitted, uses the first enabled method in matching zone. */
  shippingMethodId?: string
}

interface ShippingCalculationResult {
  /** Shipping cost in cents */
  cost: number
  /** Name of the shipping method used */
  methodName: string | null
  /** Name of the matched shipping zone */
  zoneName: string | null
  /** Whether free shipping was applied via threshold */
  freeShippingApplied: boolean
}

/**
 * Calculate shipping cost in cents.
 *
 * Logic:
 * 1. If free_shipping_threshold is set and subtotal >= threshold → free shipping
 * 2. Match shipping zone by customer's country/state
 * 3. Find enabled shipping method (by ID or first available)
 * 4. Return flat rate cost (+ optional handling fee)
 * 5. If no zones/methods configured → defaults to 0 (free shipping)
 */
export function calculateShipping(input: ShippingCalculationInput): ShippingCalculationResult {
  const { items, shippingAddress, settings, subtotal, shippingMethodId } = input

  // No items → no shipping
  if (!items || items.length === 0) {
    return { cost: 0, methodName: null, zoneName: null, freeShippingApplied: false }
  }

  // Check free shipping threshold (threshold stored in cents)
  if (
    settings.free_shipping_threshold != null &&
    settings.free_shipping_threshold > 0 &&
    subtotal >= settings.free_shipping_threshold
  ) {
    return {
      cost: 0,
      methodName: 'Free Shipping',
      zoneName: null,
      freeShippingApplied: true,
    }
  }

  // Find matching shipping zone
  const zones = settings.shipping_zones || []
  if (zones.length === 0) {
    // No shipping zones configured → free shipping by default
    return { cost: 0, methodName: null, zoneName: null, freeShippingApplied: false }
  }

  const matchedZone = findMatchingZone(zones, shippingAddress)
  if (!matchedZone) {
    // No zone matches customer's location → free shipping (or could be handled as error)
    return { cost: 0, methodName: null, zoneName: null, freeShippingApplied: false }
  }

  // Find shipping method
  const enabledMethods = (matchedZone.methods || []).filter((m) => m.enabled)
  if (enabledMethods.length === 0) {
    return { cost: 0, methodName: null, zoneName: matchedZone.name, freeShippingApplied: false }
  }

  let method: ShippingMethod | undefined

  if (shippingMethodId) {
    method = enabledMethods.find((m) => m.id === shippingMethodId)
  }

  // Fallback to first enabled method
  if (!method) {
    method = enabledMethods[0]
  }

  // Handle free_shipping type
  if (method.type === 'free_shipping') {
    return {
      cost: 0,
      methodName: method.name,
      zoneName: matchedZone.name,
      freeShippingApplied: false,
    }
  }

  // Handle local_pickup — no shipping cost
  if (method.type === 'local_pickup') {
    return {
      cost: 0,
      methodName: method.name,
      zoneName: matchedZone.name,
      freeShippingApplied: false,
    }
  }

  // Check method-level free shipping threshold
  if (
    method.free_shipping_threshold != null &&
    method.free_shipping_threshold > 0 &&
    subtotal >= method.free_shipping_threshold
  ) {
    return {
      cost: 0,
      methodName: method.name,
      zoneName: matchedZone.name,
      freeShippingApplied: true,
    }
  }

  // Check min/max order amount
  if (method.min_order_amount != null && subtotal < method.min_order_amount) {
    // Below minimum — still charge shipping but method technically doesn't apply.
    // Fall through to next method or use this one anyway.
  }

  // Calculate cost (flat_rate / table_rate / carrier_calculated all use `cost` field)
  let cost = method.cost || 0
  const handlingFee = method.handling_fee || 0
  cost += handlingFee

  return {
    cost: Math.round(cost), // ensure whole cents
    methodName: method.name,
    zoneName: matchedZone.name,
    freeShippingApplied: false,
  }
}

/**
 * Match a shipping zone by the customer's country (and optionally state/region).
 * Zone regions are stored as country codes or "country:state" strings.
 */
function findMatchingZone(zones: ShippingZone[], address: Address): ShippingZone | null {
  const country = (address.country || '').toUpperCase().trim()
  const state = (address.state || '').toUpperCase().trim()

  // Try exact country:state match first, then country-only
  for (const zone of zones) {
    const regions = (zone.regions || []).map((r) => r.toUpperCase().trim())

    // Check "country:state" format
    if (state && regions.includes(`${country}:${state}`)) {
      return zone
    }

    // Check country-only
    if (regions.includes(country)) {
      return zone
    }

    // Check wildcard / "rest of world" zone
    if (regions.includes('*') || regions.includes('ALL') || regions.includes('REST_OF_WORLD')) {
      return zone
    }
  }

  // Second pass — look for a catch-all zone with no specific regions
  for (const zone of zones) {
    if (!zone.regions || zone.regions.length === 0) {
      return zone
    }
  }

  return null
}
