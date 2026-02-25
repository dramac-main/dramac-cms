/**
 * Booking Module - Main Index
 * 
 * Phase EM-51: Booking Module
 * 
 * Full-featured booking/scheduling module with calendar management,
 * appointment booking, multiple service types, and CRM integration.
 */

// Types
export * from './types/booking-types'

// Server Actions
export {
  // Services
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
  
  // Staff
  getStaff,
  getStaffMember,
  createStaff,
  updateStaff,
  deleteStaff,
  
  // Staff-Service assignments
  getStaffServices,
  assignStaffToService,
  removeStaffFromService,
  
  // Appointments
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  deleteAppointment,
  
  // Calendars
  getCalendars,
  createCalendar,
  updateCalendar,
  deleteCalendar,
  
  // Availability
  getAvailability,
  createAvailability,
  updateAvailability,
  deleteAvailability,
  getAvailableSlots,
  
  // Settings
  getSettings,
  updateSettings,
  
  // Reminders
  getReminders,
  createReminder,
  
  // Stats
  getBookingStats,
  
  // Search
  searchBookings,
  
  // Initialize
  initializeBookingForSite
} from './actions/booking-actions'

// Context
export {
  BookingProvider,
  useBooking,
  useBookingOptional,
  useAppointment,
  useService,
  useStaffMember,
  useAppointmentsForDate,
  useStaffAppointments
} from './context/booking-context'

// Components
export * from './components'

// Module Manifest
export { BookingModuleManifest } from './manifest'
