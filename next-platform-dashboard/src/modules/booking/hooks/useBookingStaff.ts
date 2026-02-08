/**
 * useBookingStaff - Fetch staff members for a site
 * 
 * Client-side hook that calls server actions to get real staff data.
 * Used by StaffGridBlock, BookingWidgetBlock, BookingFormBlock.
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { getPublicStaff } from '../actions/public-booking-actions'
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
      // Uses admin client — safe for public site visitors (bypasses RLS)
      const data = await getPublicStaff(siteId)
      // Public action already filters to active + accepting bookings only
      setStaff(data)
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
