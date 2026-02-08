/**
 * useBookingServices - Fetch bookable services for a site
 * 
 * Client-side hook that calls server actions to get real service data.
 * Used by ServiceSelectorBlock, BookingWidgetBlock, BookingCalendarBlock.
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { getServices } from '../actions/booking-actions'
import type { Service } from '../types/booking-types'

export interface UseBookingServicesResult {
  services: Service[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useBookingServices(siteId: string): UseBookingServicesResult {
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchServices = useCallback(async () => {
    if (!siteId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await getServices(siteId)
      // Only show active services on public-facing components
      const activeServices = data.filter(s => s.is_active && s.allow_online_booking)
      setServices(activeServices)
    } catch (err) {
      console.error('[Booking] Error fetching services:', err)
      setError(err instanceof Error ? err.message : 'Failed to load services')
    } finally {
      setIsLoading(false)
    }
  }, [siteId])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  return { services, isLoading, error, refetch: fetchServices }
}
