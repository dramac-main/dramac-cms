/**
 * AddressForm - Reusable address form component
 * 
 * Phase ECOM-23: Checkout Components
 * 
 * A reusable address form that can be used for both shipping and billing.
 * Includes validation and auto-complete support.
 */
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getCountryList } from '../../lib/settings-utils'
import type { Address } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface AddressFormProps {
  address: Partial<Address>
  onChange: (address: Partial<Address>) => void
  errors?: string[]
  disabled?: boolean
  showCompany?: boolean
  showPhone?: boolean
  className?: string
}

// ============================================================================
// COUNTRIES LIST — Full list with Zambia at top (from settings-utils)
// ============================================================================

const COUNTRIES = getCountryList()

// ============================================================================
// COMPONENT
// ============================================================================

export function AddressForm({
  address,
  onChange,
  errors = [],
  disabled = false,
  showCompany = true,
  showPhone = true,
  className
}: AddressFormProps) {
  const handleChange = (field: keyof Address, value: string) => {
    onChange({ ...address, [field]: value })
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Name Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">First name *</Label>
          <Input
            id="first_name"
            value={address.first_name || ''}
            onChange={(e) => handleChange('first_name', e.target.value)}
            placeholder="John"
            disabled={disabled}
            autoComplete="given-name"
            enterKeyHint="next"
            className="h-12 text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Last name *</Label>
          <Input
            id="last_name"
            value={address.last_name || ''}
            onChange={(e) => handleChange('last_name', e.target.value)}
            placeholder="Doe"
            disabled={disabled}
            autoComplete="family-name"
            enterKeyHint="next"
            className="h-12 text-base"
          />
        </div>
      </div>

      {/* Company (optional) */}
      {showCompany && (
        <div className="space-y-2">
          <Label htmlFor="company">Company (optional)</Label>
          <Input
            id="company"
            value={address.company || ''}
            onChange={(e) => handleChange('company', e.target.value)}
            placeholder="Company name"
            disabled={disabled}
            autoComplete="organization"
            enterKeyHint="next"
            className="h-12 text-base"
          />
        </div>
      )}

      {/* Address Line 1 */}
      <div className="space-y-2">
        <Label htmlFor="address_line_1">Address *</Label>
        <Input
          id="address_line_1"
          value={address.address_line_1 || ''}
          onChange={(e) => handleChange('address_line_1', e.target.value)}
          placeholder="123 Main Street"
          disabled={disabled}
          autoComplete="address-line1"
          enterKeyHint="next"
          className="h-12 text-base"
        />
      </div>

      {/* Address Line 2 */}
      <div className="space-y-2">
        <Label htmlFor="address_line_2">Apartment, suite, etc. (optional)</Label>
        <Input
          id="address_line_2"
          value={address.address_line_2 || ''}
          onChange={(e) => handleChange('address_line_2', e.target.value)}
          placeholder="Apt 4B"
          disabled={disabled}
          autoComplete="address-line2"
          enterKeyHint="next"
          className="h-12 text-base"
        />
      </div>

      {/* City, State, Zip Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={address.city || ''}
            onChange={(e) => handleChange('city', e.target.value)}
            placeholder="Lusaka"
            disabled={disabled}
            autoComplete="address-level2"
            enterKeyHint="next"
            className="h-12 text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State / Province *</Label>
          <Input
            id="state"
            value={address.state || ''}
            onChange={(e) => handleChange('state', e.target.value)}
            placeholder="Lusaka Province"
            disabled={disabled}
            autoComplete="address-level1"
            enterKeyHint="next"
            className="h-12 text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="postal_code">Postal code *</Label>
          <Input
            id="postal_code"
            value={address.postal_code || ''}
            onChange={(e) => handleChange('postal_code', e.target.value)}
            placeholder="10101"
            disabled={disabled}
            autoComplete="postal-code"
            enterKeyHint="next"
            className="h-12 text-base"
          />
        </div>
      </div>

      {/* Country — Native select for brand consistency + better mobile UX */}
      <div className="space-y-2">
        <Label htmlFor="country">Country *</Label>
        <select
          id="country"
          value={address.country || ''}
          onChange={(e) => handleChange('country', e.target.value)}
          disabled={disabled}
          autoComplete="country"
          className={cn(
            'flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base',
            'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'appearance-none bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23666%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E")] bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-10'
          )}
        >
          <option value="" disabled>Select a country</option>
          {COUNTRIES.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
      </div>

      {/* Phone (optional) */}
      {showPhone && (
        <div className="space-y-2">
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            value={address.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+260 97 1234567"
            disabled={disabled}
            autoComplete="tel"
            enterKeyHint="done"
            className="h-12 text-base"
          />
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <ul className="list-disc list-inside space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm text-destructive">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// SHIPPING ADDRESS FORM - Wrapper with title
// ============================================================================

interface ShippingAddressFormProps extends AddressFormProps {
  title?: string
  email?: string
  onEmailChange?: (email: string) => void
  phone?: string
  onPhoneChange?: (phone: string) => void
}

export function ShippingAddressForm({
  title = 'Shipping Address',
  email,
  onEmailChange,
  phone,
  onPhoneChange,
  ...props
}: ShippingAddressFormProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">{title}</h3>
      
      {/* Contact Information */}
      {(onEmailChange || onPhoneChange) && (
        <div className="space-y-4 pb-4 border-b">
          <h4 className="text-sm font-medium text-muted-foreground">Contact Information</h4>
          
          {onEmailChange && (
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                value={email || ''}
                onChange={(e) => onEmailChange(e.target.value)}
                placeholder="email@example.com"
                disabled={props.disabled}
                autoComplete="email"
                enterKeyHint="next"
                className="h-12 text-base"
              />
            </div>
          )}
          
          {onPhoneChange && (
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Phone (for delivery updates)</Label>
              <Input
                id="contact_phone"
                type="tel"
                inputMode="tel"
                value={phone || ''}
                onChange={(e) => onPhoneChange(e.target.value)}
                placeholder="+260 97 1234567"
                disabled={props.disabled}
                autoComplete="tel"
                enterKeyHint="next"
                className="h-12 text-base"
              />
            </div>
          )}
        </div>
      )}
      
      <AddressForm {...props} showPhone={false} />
    </div>
  )
}

// ============================================================================
// BILLING ADDRESS FORM - Wrapper with title
// ============================================================================

interface BillingAddressFormProps extends AddressFormProps {
  title?: string
  useSameAsShipping?: boolean
  onUseSameAsShippingChange?: (same: boolean) => void
}

export function BillingAddressForm({
  title = 'Billing Address',
  useSameAsShipping,
  onUseSameAsShippingChange,
  ...props
}: BillingAddressFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      
      {/* Same as shipping checkbox */}
      {onUseSameAsShippingChange !== undefined && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={useSameAsShipping}
            onChange={(e) => onUseSameAsShippingChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            disabled={props.disabled}
          />
          <span className="text-sm">Same as shipping address</span>
        </label>
      )}
      
      {/* Show form only if not same as shipping */}
      {!useSameAsShipping && (
        <AddressForm {...props} showCompany={false} showPhone={false} />
      )}
    </div>
  )
}
