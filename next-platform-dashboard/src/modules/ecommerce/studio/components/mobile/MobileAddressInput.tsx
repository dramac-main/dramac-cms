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
import { getCountryList } from '../../../lib/settings-utils'

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

// Build country options from centralised list (Zambia first)
const COUNTRIES: MobileSelectOption[] = getCountryList().map((c) => ({
  value: c.code,
  label: c.name,
}))

// Zambian provinces
const ZM_PROVINCES: MobileSelectOption[] = [
  { value: 'Central', label: 'Central' },
  { value: 'Copperbelt', label: 'Copperbelt' },
  { value: 'Eastern', label: 'Eastern' },
  { value: 'Luapula', label: 'Luapula' },
  { value: 'Lusaka', label: 'Lusaka' },
  { value: 'Muchinga', label: 'Muchinga' },
  { value: 'Northern', label: 'Northern' },
  { value: 'North-Western', label: 'North-Western' },
  { value: 'Southern', label: 'Southern' },
  { value: 'Western', label: 'Western' },
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

  // Get provinces/states based on selected country
  const getStates = useCallback((): MobileSelectOption[] => {
    if (address.country === 'ZM') return ZM_PROVINCES
    // Other countries: let user type freely (no predefined list)
    return []
  }, [address.country])

  // Label for the state/province field based on country
  const stateLabel = address.country === 'ZM' ? 'Province' : 'State / Province'
  const postalLabel = address.country === 'ZM' ? 'Postal code' : 'Postal / ZIP code'

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
        value={address.country || 'ZM'}
        onChange={(e) => {
          handleChange('country', e.target.value)
          // Clear state when country changes (previous value may not apply)
          if (e.target.value !== address.country) {
            handleChange('state', '')
          }
        }}
        options={COUNTRIES}
        error={errors.country}
        disabled={disabled}
      />

      {/* State/Province & Postal code row */}
      <div className="grid grid-cols-2 gap-3">
        {getStates().length > 0 ? (
          <MobileSelect
            label={stateLabel}
            value={address.state || ''}
            onChange={(e) => handleChange('state', e.target.value)}
            options={getStates()}
            error={errors.state}
            placeholder={`Select ${stateLabel.toLowerCase()}`}
            disabled={disabled}
          />
        ) : (
          <MobileInput
            label={stateLabel}
            value={address.state || ''}
            onChange={(e) => handleChange('state', e.target.value)}
            error={errors.state}
            autoComplete="address-level1"
            enterKeyHint="next"
            disabled={disabled}
          />
        )}
        <MobileInput
          ref={postalCodeRef}
          label={postalLabel}
          value={address.postalCode || ''}
          onChange={(e) => handleChange('postalCode', e.target.value)}
          error={errors.postalCode}
          autoComplete="postal-code"
          enterKeyHint={showPhone ? 'next' : 'done'}
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (showPhone) {
                phoneRef.current?.focus()
              } else {
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
