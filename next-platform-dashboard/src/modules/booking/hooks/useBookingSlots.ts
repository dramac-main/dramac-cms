/**
 * useBookingSlots - Fetch available time slots for a service/date
 * 
 * Client-side hook that calls server actions to get real availability data.
 * Used by BookingCalendarBlock, BookingWidgetBlock.
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { getPublicAvailableSlots } from '../actions/public-booking-actions'
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

  // Stable date string to prevent infinite re-renders
  const dateString = date ? date.toISOString().split('T')[0] : null

  const fetchSlots = useCallback(async () => {
    if (!siteId || !serviceId || !dateString) {
      setSlots([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Reconstruct Date from stable string for server action
      const dateForQuery = new Date(dateString + 'T00:00:00')
      // Uses admin client — safe for public site visitors (bypasses RLS)
      const data = await getPublicAvailableSlots(siteId, serviceId, dateForQuery, staffId)
      // Server actions serialize Date objects to strings — normalize slot times
      const normalizedSlots = data.map((slot: any) => ({
        ...slot,
        start: typeof slot.start === 'string' ? new Date(slot.start) : slot.start,
        end: typeof slot.end === 'string' ? new Date(slot.end) : slot.end,
      }))
      setSlots(normalizedSlots)
    } catch (err) {
      console.error('[Booking] Error fetching slots:', err)
      setError(err instanceof Error ? err.message : 'Failed to load time slots')
    } finally {
      setIsLoading(false)
    }
  }, [siteId, serviceId, dateString, staffId])

  useEffect(() => {
    fetchSlots()
  }, [fetchSlots])

  return { slots, isLoading, error, refetch: fetchSlots }
}
