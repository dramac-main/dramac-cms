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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
// COUNTRIES LIST (subset for demo - expand as needed)
// ============================================================================

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'NZ', name: 'New Zealand' }
]

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
            placeholder="New York"
            disabled={disabled}
            autoComplete="address-level2"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State / Province *</Label>
          <Input
            id="state"
            value={address.state || ''}
            onChange={(e) => handleChange('state', e.target.value)}
            placeholder="NY"
            disabled={disabled}
            autoComplete="address-level1"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="postal_code">Postal code *</Label>
          <Input
            id="postal_code"
            value={address.postal_code || ''}
            onChange={(e) => handleChange('postal_code', e.target.value)}
            placeholder="10001"
            disabled={disabled}
            autoComplete="postal-code"
          />
        </div>
      </div>

      {/* Country */}
      <div className="space-y-2">
        <Label htmlFor="country">Country *</Label>
        <Select
          value={address.country || ''}
          onValueChange={(value) => handleChange('country', value)}
          disabled={disabled}
        >
          <SelectTrigger id="country" className="w-full">
            <SelectValue placeholder="Select a country" />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Phone (optional) */}
      {showPhone && (
        <div className="space-y-2">
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input
            id="phone"
            type="tel"
            value={address.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+260 97 1234567"
            disabled={disabled}
            autoComplete="tel"
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
                value={email || ''}
                onChange={(e) => onEmailChange(e.target.value)}
                placeholder="email@example.com"
                disabled={props.disabled}
                autoComplete="email"
              />
            </div>
          )}
          
          {onPhoneChange && (
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Phone (for delivery updates)</Label>
              <Input
                id="contact_phone"
                type="tel"
                value={phone || ''}
                onChange={(e) => onPhoneChange(e.target.value)}
                placeholder="+260 97 1234567"
                disabled={props.disabled}
                autoComplete="tel"
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
