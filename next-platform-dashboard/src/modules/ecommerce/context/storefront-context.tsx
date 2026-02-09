/**
 * StorefrontProvider - Storefront context
 * 
 * Phase ECOM-20: Core Data Hooks
 * 
 * Provides site settings, currency, and utilities to all storefront components.
 */
'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react'
import { getEcommerceSettings } from '../actions/ecommerce-actions'
import type { 
  EcommerceSettings,
  StorefrontContextValue 
} from '../types/ecommerce-types'
import {
  DEFAULT_CURRENCY,
  DEFAULT_CURRENCY_SYMBOL,
  CURRENCY_SYMBOLS,
  formatCurrency,
} from '@/lib/locale-config'

// Default context value
const defaultContextValue: StorefrontContextValue = {
  siteId: '',
  settings: null,
  currency: DEFAULT_CURRENCY,
  currencySymbol: DEFAULT_CURRENCY_SYMBOL,
  taxRate: 0,
  formatPrice: () => `${DEFAULT_CURRENCY_SYMBOL}0.00`,
  isInitialized: false
}

const StorefrontContext = createContext<StorefrontContextValue>(defaultContextValue)

// ============================================================================
// HOOK
// ============================================================================

export function useStorefront(): StorefrontContextValue {
  const context = useContext(StorefrontContext)
  if (!context.siteId && context.isInitialized) {
    console.warn('useStorefront used outside of StorefrontProvider')
  }
  return context
}

// ============================================================================
// PROVIDER
// ============================================================================

interface StorefrontProviderProps {
  children: ReactNode
  siteId: string
}

export function StorefrontProvider({ children, siteId }: StorefrontProviderProps) {
  const [settings, setSettings] = useState<EcommerceSettings | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Load settings
  useEffect(() => {
    if (!siteId) return

    async function loadSettings() {
      try {
        const data = await getEcommerceSettings(siteId)
        setSettings(data)
      } catch (err) {
        console.error('Error loading storefront settings:', err)
      } finally {
        setIsInitialized(true)
      }
    }

    loadSettings()
  }, [siteId])

  // Derived values
  const currency = settings?.currency || DEFAULT_CURRENCY
  const currencySymbol = CURRENCY_SYMBOLS[currency] || DEFAULT_CURRENCY_SYMBOL
  const taxRate = settings?.tax_rate || 0

  // Format price utility
  const formatPrice = useCallback((amount: number): string => {
    return formatCurrency(amount, currency)
  }, [currency])

  // Context value
  const value = useMemo((): StorefrontContextValue => ({
    siteId,
    settings,
    currency,
    currencySymbol,
    taxRate,
    formatPrice,
    isInitialized
  }), [siteId, settings, currency, currencySymbol, taxRate, formatPrice, isInitialized])

  return (
    <StorefrontContext.Provider value={value}>
      {children}
    </StorefrontContext.Provider>
  )
}
