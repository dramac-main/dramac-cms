/**
 * Booking Components Index
 * 
 * Phase EM-51: Booking Module
 * Exports all booking module UI components
 */

// Main dashboard component
export { BookingDashboard } from './booking-dashboard'

// Dialog components
export {
  CreateServiceDialog,
  CreateStaffDialog,
  CreateAppointmentDialog,
  BookingSettingsDialog,
} from './dialogs'

// View components
export {
  CalendarView,
  AppointmentsView,
  ServicesView,
  StaffView,
  AnalyticsView,
} from './views'

// Sheet components
export {
  AppointmentDetailSheet,
  ServiceDetailSheet,
  StaffDetailSheet,
} from './sheets'
