/**
 * useBookingSettings - Fetch booking settings for a site
 * 
 * Client-side hook for site-specific booking configuration.
 * Used by BookingCalendarBlock, BookingWidgetBlock, BookingFormBlock.
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSettings } from '../actions/booking-actions'
import type { BookingSettings } from '../types/booking-types'

export interface UseBookingSettingsResult {
  settings: BookingSettings | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useBookingSettings(siteId: string): UseBookingSettingsResult {
  const [settings, setSettings] = useState<BookingSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    if (!siteId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await getSettings(siteId)
      setSettings(data)
    } catch (err) {
      console.error('[Booking] Error fetching settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setIsLoading(false)
    }
  }, [siteId])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return { settings, isLoading, error, refetch: fetchSettings }
}
