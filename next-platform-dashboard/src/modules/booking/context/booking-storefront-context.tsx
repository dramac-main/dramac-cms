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
import {
  DEFAULT_CURRENCY,
  DEFAULT_CURRENCY_SYMBOL,
  DEFAULT_TIMEZONE,
  CURRENCY_SYMBOLS,
  formatCurrency,
} from '@/lib/locale-config'

// ============================================================================
// Currency Symbols (shared with ecommerce)
// ============================================================================

// Currency symbols imported from @/lib/locale-config

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
  currency: DEFAULT_CURRENCY,
  currencySymbol: DEFAULT_CURRENCY_SYMBOL,
  timezone: DEFAULT_TIMEZONE,
  slotInterval: 30,
  formatPrice: () => `${DEFAULT_CURRENCY_SYMBOL}0.00`,
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

  // Currency from booking settings (now properly typed)
  const currency = settings?.currency || DEFAULT_CURRENCY
  const currencySymbol = CURRENCY_SYMBOLS[currency] || DEFAULT_CURRENCY_SYMBOL
  const timezone = settings?.timezone || DEFAULT_TIMEZONE
  const slotInterval = settings?.slot_interval_minutes || 30

  const formatPrice = useCallback((amount: number): string => {
    return formatCurrency(amount, currency)
  }, [currency])

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
