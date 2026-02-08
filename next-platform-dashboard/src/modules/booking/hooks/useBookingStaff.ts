/**
 * useBookingStaff - Fetch staff members for a site
 * 
 * Client-side hook that calls server actions to get real staff data.
 * Used by StaffGridBlock, BookingWidgetBlock, BookingFormBlock.
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { getStaff } from '../actions/booking-actions'
import type { Staff } from '../types/booking-types'

export interface UseBookingStaffResult {
  staff: Staff[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useBookingStaff(siteId: string): UseBookingStaffResult {
  const [staff, setStaff] = useState<Staff[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStaff = useCallback(async () => {
    if (!siteId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await getStaff(siteId)
      // Only show active staff who accept bookings
      const activeStaff = data.filter(s => s.is_active && s.accept_bookings)
      setStaff(activeStaff)
    } catch (err) {
      console.error('[Booking] Error fetching staff:', err)
      setError(err instanceof Error ? err.message : 'Failed to load staff')
    } finally {
      setIsLoading(false)
    }
  }, [siteId])

  useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  return { staff, isLoading, error, refetch: fetchStaff }
}
