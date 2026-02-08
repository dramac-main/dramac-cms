/**
 * BookingStorefrontProvider - Public booking context
 * 
 * Provides siteId, booking settings, currency, and formatting utilities
 * to all public-facing booking components (ServiceSelector, Calendar, Form, etc.)
 * 
 * Pattern follows ecommerce StorefrontProvider exactly.
 */
'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react'
import { getSettings } from '../actions/booking-actions'
import type { BookingSettings } from '../types/booking-types'

// ============================================================================
// Currency Symbols (shared with ecommerce)
// ============================================================================

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', ZMW: 'K', KES: 'KSh', NGN: '₦', ZAR: 'R',
  TZS: 'TSh', UGX: 'USh', RWF: 'FRw', GHS: '₵', XOF: 'CFA', XAF: 'FCFA',
  INR: '₹', JPY: '¥', CNY: '¥', AUD: 'A$', CAD: 'C$',
}

// ============================================================================
// Context Type
// ============================================================================

export interface BookingStorefrontContextValue {
  siteId: string
  settings: BookingSettings | null
  currency: string
  currencySymbol: string
  timezone: string
  slotInterval: number
  formatPrice: (amount: number) => string
  isInitialized: boolean
}

const defaultValue: BookingStorefrontContextValue = {
  siteId: '',
  settings: null,
  currency: 'USD',
  currencySymbol: '$',
  timezone: 'UTC',
  slotInterval: 30,
  formatPrice: () => '$0.00',
  isInitialized: false,
}

const BookingStorefrontContext = createContext<BookingStorefrontContextValue>(defaultValue)

// ============================================================================
// Hook
// ============================================================================

export function useBookingStorefront(): BookingStorefrontContextValue {
  return useContext(BookingStorefrontContext)
}

// ============================================================================
// Provider
// ============================================================================

interface BookingStorefrontProviderProps {
  children: ReactNode
  siteId: string
}

export function BookingStorefrontProvider({ children, siteId }: BookingStorefrontProviderProps) {
  const [settings, setSettings] = useState<BookingSettings | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (!siteId) return

    async function loadSettings() {
      try {
        const data = await getSettings(siteId)
        setSettings(data)
      } catch (err) {
        console.error('[BookingStorefront] Error loading settings:', err)
      } finally {
        setIsInitialized(true)
      }
    }

    loadSettings()
  }, [siteId])

  const currency = 'USD' // Default, could come from service prices
  const currencySymbol = CURRENCY_SYMBOLS[currency] || currency
  const timezone = settings?.timezone || 'UTC'
  const slotInterval = settings?.slot_interval_minutes || 30

  const formatPrice = useCallback((amount: number): string => {
    return `${currencySymbol}${amount.toFixed(2)}`
  }, [currencySymbol])

  const value = useMemo((): BookingStorefrontContextValue => ({
    siteId,
    settings,
    currency,
    currencySymbol,
    timezone,
    slotInterval,
    formatPrice,
    isInitialized,
  }), [siteId, settings, currency, currencySymbol, timezone, slotInterval, formatPrice, isInitialized])

  return (
    <BookingStorefrontContext.Provider value={value}>
      {children}
    </BookingStorefrontContext.Provider>
  )
}
