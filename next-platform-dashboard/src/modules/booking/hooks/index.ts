/**
 * Booking Module - Client Hooks
 * 
 * Re-exports all hooks for clean imports.
 * Usage: import { useBookingServices, useBookingStaff } from '@/modules/booking/hooks'
 */

export { useBookingServices, type UseBookingServicesResult } from './useBookingServices'
export { useBookingStaff, type UseBookingStaffResult } from './useBookingStaff'
export { useBookingSlots, type UseBookingSlotsOptions, type UseBookingSlotsResult } from './useBookingSlots'
export { useBookingSettings, type UseBookingSettingsResult } from './useBookingSettings'
export { useCreateBooking, type UseCreateBookingResult } from './useCreateBooking'
