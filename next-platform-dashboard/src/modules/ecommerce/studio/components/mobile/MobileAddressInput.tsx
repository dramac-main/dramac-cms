/**
 * MobileAddressInput - Optimized address form for mobile
 * 
 * Phase ECOM-31: Mobile Checkout Flow
 * 
 * Features:
 * - Smart field ordering for mobile keyboards
 * - Auto-advance between fields
 * - Address autocomplete integration ready
 */
'use client'

import React, { useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { MobileInput } from './MobileInput'
import { MobileSelect, MobileSelectOption } from './MobileSelect'

// ============================================================================
// TYPES
// ============================================================================

export interface Address {
  firstName: string
  lastName: string
  company?: string
  address1: string
  address2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone?: string
}

export interface AddressErrors {
  firstName?: string
  lastName?: string
  company?: string
  address1?: string
  address2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  phone?: string
}

export interface MobileAddressInputProps {
  address: Partial<Address>
  onChange: (address: Partial<Address>) => void
  errors?: AddressErrors
  showCompany?: boolean
  showPhone?: boolean
  disabled?: boolean
  className?: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const COUNTRIES: MobileSelectOption[] = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'JP', label: 'Japan' },
]

const US_STATES: MobileSelectOption[] = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
]

// ============================================================================
// COMPONENT
// ============================================================================

export function MobileAddressInput({
  address,
  onChange,
  errors = {},
  showCompany = false,
  showPhone = true,
  disabled = false,
  className,
}: MobileAddressInputProps) {
  // Refs for auto-advance
  const lastNameRef = useRef<HTMLInputElement>(null)
  const companyRef = useRef<HTMLInputElement>(null)
  const address1Ref = useRef<HTMLInputElement>(null)
  const address2Ref = useRef<HTMLInputElement>(null)
  const cityRef = useRef<HTMLInputElement>(null)
  const postalCodeRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)

  // Update handler
  const handleChange = useCallback(
    (field: keyof Address, value: string) => {
      onChange({ ...address, [field]: value })
    },
    [address, onChange]
  )

  // Get states based on country
  const getStates = useCallback(() => {
    // For now, just return US states
    // Can be extended to support other countries
    if (address.country === 'US') {
      return US_STATES
    }
    return US_STATES // Default to US states
  }, [address.country])

  return (
    <div className={cn('space-y-4', className)}>
      {/* Name row */}
      <div className="grid grid-cols-2 gap-3">
        <MobileInput
          label="First name"
          value={address.firstName || ''}
          onChange={(e) => handleChange('firstName', e.target.value)}
          error={errors.firstName}
          autoComplete="given-name"
          enterKeyHint="next"
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              lastNameRef.current?.focus()
            }
          }}
        />
        <MobileInput
          ref={lastNameRef}
          label="Last name"
          value={address.lastName || ''}
          onChange={(e) => handleChange('lastName', e.target.value)}
          error={errors.lastName}
          autoComplete="family-name"
          enterKeyHint="next"
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (showCompany) {
                companyRef.current?.focus()
              } else {
                address1Ref.current?.focus()
              }
            }
          }}
        />
      </div>

      {/* Company (optional) */}
      {showCompany && (
        <MobileInput
          ref={companyRef}
          label="Company (optional)"
          value={address.company || ''}
          onChange={(e) => handleChange('company', e.target.value)}
          error={errors.company}
          autoComplete="organization"
          enterKeyHint="next"
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              address1Ref.current?.focus()
            }
          }}
        />
      )}

      {/* Address line 1 */}
      <MobileInput
        ref={address1Ref}
        label="Address"
        value={address.address1 || ''}
        onChange={(e) => handleChange('address1', e.target.value)}
        error={errors.address1}
        autoComplete="address-line1"
        enterKeyHint="next"
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            address2Ref.current?.focus()
          }
        }}
      />

      {/* Address line 2 */}
      <MobileInput
        ref={address2Ref}
        label="Apartment, suite, etc. (optional)"
        value={address.address2 || ''}
        onChange={(e) => handleChange('address2', e.target.value)}
        error={errors.address2}
        autoComplete="address-line2"
        enterKeyHint="next"
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            cityRef.current?.focus()
          }
        }}
      />

      {/* City */}
      <MobileInput
        ref={cityRef}
        label="City"
        value={address.city || ''}
        onChange={(e) => handleChange('city', e.target.value)}
        error={errors.city}
        autoComplete="address-level2"
        enterKeyHint="next"
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            // Can't auto-advance to select, so go to postal code
            postalCodeRef.current?.focus()
          }
        }}
      />

      {/* Country */}
      <MobileSelect
        label="Country"
        value={address.country || 'US'}
        onChange={(e) => handleChange('country', e.target.value)}
        options={COUNTRIES}
        error={errors.country}
        disabled={disabled}
      />

      {/* State & Postal code row */}
      <div className="grid grid-cols-2 gap-3">
        <MobileSelect
          label="State"
          value={address.state || ''}
          onChange={(e) => handleChange('state', e.target.value)}
          options={getStates()}
          error={errors.state}
          placeholder="Select state"
          disabled={disabled}
        />
        <MobileInput
          ref={postalCodeRef}
          label="ZIP code"
          value={address.postalCode || ''}
          onChange={(e) => handleChange('postalCode', e.target.value)}
          error={errors.postalCode}
          autoComplete="postal-code"
          inputMode="numeric"
          enterKeyHint={showPhone ? 'next' : 'done'}
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (showPhone) {
                phoneRef.current?.focus()
              } else {
                // Blur to dismiss keyboard
                e.currentTarget.blur()
              }
            }
          }}
        />
      </div>

      {/* Phone (optional) */}
      {showPhone && (
        <MobileInput
          ref={phoneRef}
          label="Phone (for delivery updates)"
          value={address.phone || ''}
          onChange={(e) => handleChange('phone', e.target.value)}
          error={errors.phone}
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          enterKeyHint="done"
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              e.currentTarget.blur()
            }
          }}
        />
      )}
    </div>
  )
}

export default MobileAddressInput
