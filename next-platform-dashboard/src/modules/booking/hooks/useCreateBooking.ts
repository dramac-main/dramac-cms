/**
 * useCreateBooking - Create a new appointment/booking
 * 
 * Client-side hook that calls server actions to create real bookings.
 * Used by BookingFormBlock, BookingWidgetBlock.
 */
'use client'

import { useState, useCallback } from 'react'
import { createPublicAppointment } from '../actions/public-booking-actions'
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
      const result = await createPublicAppointment(siteId, {
        serviceId: input.service_id || '',
        staffId: input.staff_id || undefined,
        startTime: input.start_time ? new Date(input.start_time) : new Date(),
        endTime: input.end_time ? new Date(input.end_time) : new Date(Date.now() + 3600000),
        customerName: input.customer_name || 'Guest',
        customerEmail: input.customer_email || '',
        customerPhone: input.customer_phone || undefined,
        notes: input.customer_notes || undefined,
      })
      if (!result.success) {
        const message = result.error || 'Failed to create booking'
        setError(message)
        throw new Error(message)
      }
      // Return a minimal Appointment-like object for the UI
      const appointment = {
        id: result.appointmentId || '',
        site_id: siteId,
        service_id: input.service_id || '',
        staff_id: input.staff_id || null,
        start_time: input.start_time || new Date().toISOString(),
        end_time: input.end_time || new Date().toISOString(),
        status: 'pending' as const,
        customer_name: input.customer_name || 'Guest',
        customer_email: input.customer_email || '',
      } as Appointment
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
