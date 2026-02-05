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

// Currency symbols map
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  ZMW: 'K',
  KES: 'KSh',
  NGN: '₦',
  ZAR: 'R',
  TZS: 'TSh',
  UGX: 'USh',
  RWF: 'FRw',
  GHS: '₵',
  XOF: 'CFA',
  XAF: 'FCFA',
  INR: '₹',
  JPY: '¥',
  CNY: '¥',
  AUD: 'A$',
  CAD: 'C$',
}

// Default context value
const defaultContextValue: StorefrontContextValue = {
  siteId: '',
  settings: null,
  currency: 'USD',
  currencySymbol: '$',
  taxRate: 0,
  formatPrice: () => '$0.00',
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
  const currency = settings?.currency || 'USD'
  const currencySymbol = CURRENCY_SYMBOLS[currency] || currency
  const taxRate = settings?.tax_rate || 0

  // Format price utility
  const formatPrice = useCallback((amount: number): string => {
    const formatted = amount.toFixed(2)
    return `${currencySymbol}${formatted}`
  }, [currencySymbol])

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
