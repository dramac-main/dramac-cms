/**
 * useBookingSlots - Fetch available time slots for a service/date
 * 
 * Client-side hook that calls server actions to get real availability data.
 * Used by BookingCalendarBlock, BookingWidgetBlock.
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { getAvailableSlots } from '../actions/booking-actions'
import type { TimeSlot } from '../types/booking-types'

export interface UseBookingSlotsOptions {
  serviceId?: string
  date?: Date | null
  staffId?: string
}

export interface UseBookingSlotsResult {
  slots: TimeSlot[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useBookingSlots(
  siteId: string,
  options: UseBookingSlotsOptions = {}
): UseBookingSlotsResult {
  const { serviceId, date, staffId } = options
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSlots = useCallback(async () => {
    if (!siteId || !serviceId || !date) {
      setSlots([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await getAvailableSlots(siteId, serviceId, date, staffId)
      setSlots(data)
    } catch (err) {
      console.error('[Booking] Error fetching slots:', err)
      setError(err instanceof Error ? err.message : 'Failed to load time slots')
    } finally {
      setIsLoading(false)
    }
  }, [siteId, serviceId, date?.toISOString(), staffId])

  useEffect(() => {
    fetchSlots()
  }, [fetchSlots])

  return { slots, isLoading, error, refetch: fetchSlots }
}
