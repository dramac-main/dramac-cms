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

    if (!input.service_id) {
      throw new Error('Service is required')
    }

    if (!input.start_time || !input.end_time) {
      throw new Error('Start time and end time are required')
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Ensure dates are properly serialized as ISO strings for the server action
      const startTimeStr = typeof input.start_time === 'string' ? input.start_time : new Date(input.start_time).toISOString()
      const endTimeStr = typeof input.end_time === 'string' ? input.end_time : new Date(input.end_time).toISOString()
      
      const result = await createPublicAppointment(siteId, {
        serviceId: input.service_id,
        staffId: input.staff_id || undefined,
        startTime: new Date(startTimeStr),
        endTime: new Date(endTimeStr),
        customerName: input.customer_name ?? 'Guest',
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
        service_id: input.service_id,
        staff_id: input.staff_id || null,
        start_time: startTimeStr,
        end_time: endTimeStr,
        status: (result.status || 'pending') as 'pending' | 'confirmed',
        customer_name: input.customer_name ?? 'Guest',
        customer_email: input.customer_email || '',
        customer_phone: input.customer_phone || null,
        customer_notes: input.customer_notes || null,
        payment_status: 'not_required' as const,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        metadata: { source: 'online' },
        custom_fields: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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
