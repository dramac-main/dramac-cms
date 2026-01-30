/**
 * Booking UI Components - Barrel Exports
 * 
 * PHASE-UI-15: Booking Module UI Enhancement
 */

// Metric Cards
export {
  BookingMetricCard,
  AppointmentsMetricCard,
  BookingRevenueMetricCard,
  UtilizationMetricCard,
  CustomersMetricCard,
  ServicesMetricCard,
  PendingMetricCard,
  BookingMetricCardSkeleton,
  type BookingMetricCardProps,
  type BookingMetricVariant,
  type BookingMetricChange,
} from './booking-metric-card'

// Appointment Card
export {
  AppointmentCard,
  AppointmentCardSkeleton,
  type AppointmentCardProps,
} from './appointment-card'

// Service Card
export {
  ServiceCard,
  ServiceCardSkeleton,
  type ServiceCardProps,
} from './service-card'

// Staff Card
export {
  StaffCard,
  StaffCardSkeleton,
  type StaffCardProps,
} from './staff-card'

// Calendar Timeline
export {
  CalendarTimeline,
  DayTimeline,
  CalendarTimelineSkeleton,
  type CalendarTimelineProps,
  type DayTimelineProps,
} from './calendar-timeline'

// Filter Bars
export {
  BookingFilterBar,
  ServiceFilterBar,
  StaffFilterBar,
  type BookingFilterBarProps,
  type ServiceFilterBarProps,
  type StaffFilterBarProps,
} from './booking-filter-bar'

// Quick Actions
export {
  BookingQuickActions,
  BookingActionBar,
  BookingStatActions,
  getDefaultBookingActions,
  type BookingAction,
  type BookingQuickActionsProps,
  type BookingActionBarProps,
  type BookingStatAction,
  type BookingStatActionsProps,
} from './booking-quick-actions'

// Availability Alerts
export {
  AvailabilityAlert,
  AvailabilityAlertBanner,
  PendingAppointmentsAlert,
  type AvailabilityIssue,
  type AvailabilityAlertProps,
  type AvailabilityAlertBannerProps,
  type PendingAppointmentsAlertProps,
} from './availability-alert'
