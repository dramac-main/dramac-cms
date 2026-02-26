/**
 * useBookingSlots - Fetch available time slots for a service/date
 * 
 * Client-side hook that calls server actions to get real availability data.
 * Used by BookingCalendarBlock, BookingWidgetBlock.
 * 
 * IMPORTANT: Passes date as YYYY-MM-DD string to the server to avoid
 * timezone conversion issues. All slot times use UTC convention where
 * the UTC hour matches the intended wall-clock hour.
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

/**
 * Build a YYYY-MM-DD string from a Date using LOCAL date components.
 * This avoids the bug where `date.toISOString().split('T')[0]` can
 * produce the previous day for timezones east of UTC (e.g., UTC+5
 * midnight local = 19:00 UTC previous day → wrong date string).
 */
function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function useBookingSlots(
  siteId: string,
  options: UseBookingSlotsOptions = {}
): UseBookingSlotsResult {
  const { serviceId, date, staffId } = options
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Stable date string using LOCAL components to prevent timezone-induced date shift.
  // Previously used date.toISOString().split('T')[0] which could produce the wrong
  // date for timezones east of UTC (the root cause of the double-booking bug).
  const dateString = date ? toLocalDateString(date) : null

  const fetchSlots = useCallback(async () => {
    if (!siteId || !serviceId || !dateString) {
      setSlots([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Pass the date as a YYYY-MM-DD string to the server action.
      // This avoids timezone conversion issues entirely — the server
      // constructs all dates using Date.UTC() from the string components.
      const data = await getPublicAvailableSlots(siteId, serviceId, dateString, staffId)
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
