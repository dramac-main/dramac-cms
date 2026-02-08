/**
 * useCreateBooking - Create a new appointment/booking
 * 
 * Client-side hook that calls server actions to create real bookings.
 * Used by BookingFormBlock, BookingWidgetBlock.
 */
'use client'

import { useState, useCallback } from 'react'
import { createAppointment } from '../actions/booking-actions'
import type { Appointment, AppointmentInput } from '../types/booking-types'

export interface UseCreateBookingResult {
  createBooking: (input: Partial<AppointmentInput>) => Promise<Appointment>
  isSubmitting: boolean
  error: string | null
  lastBooking: Appointment | null
  reset: () => void
}

export function useCreateBooking(siteId: string): UseCreateBookingResult {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastBooking, setLastBooking] = useState<Appointment | null>(null)

  const createBookingFn = useCallback(async (input: Partial<AppointmentInput>): Promise<Appointment> => {
    if (!siteId) {
      throw new Error('No site ID provided')
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const appointment = await createAppointment(siteId, {
        ...input,
        timezone: input.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      })
      setLastBooking(appointment)
      return appointment
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create booking'
      setError(message)
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }, [siteId])

  const reset = useCallback(() => {
    setError(null)
    setLastBooking(null)
  }, [])

  return { createBooking: createBookingFn, isSubmitting, error, lastBooking, reset }
}
