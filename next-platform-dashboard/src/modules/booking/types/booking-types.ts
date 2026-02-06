/**
 * Booking Module TypeScript Types
 * 
 * Phase EM-51: Booking Module
 * 
 * These types define the data structures for all Booking entities
 * Following CRM module pattern exactly
 */

// ============================================================================
// TYPE ALIASES
// ============================================================================

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed' | 'not_required'
export type ReminderType = 'email' | 'sms' | 'push'
export type ReminderStatus = 'pending' | 'sent' | 'failed' | 'cancelled'
export type CalendarType = 'staff' | 'resource' | 'location'
export type AvailabilityRuleType = 'available' | 'blocked' | 'holiday'
export type TimeFormat = '12h' | '24h'
export type CancelledBy = 'customer' | 'staff' | 'system'

// ============================================================================
// SERVICES
// ============================================================================

export interface Service {
  id: string
  site_id: string
  
  // Details
  name: string
  slug: string
  description?: string | null
  category?: string | null  // For service categorization
  
  // Duration
  duration_minutes: number
  buffer_before_minutes: number
  buffer_after_minutes: number
  
  // Pricing
  price: number
  currency: string
  
  // Capacity
  max_attendees: number
  
  // Settings
  allow_online_booking: boolean
  require_confirmation: boolean
  require_payment: boolean
  
  // Display
  color: string
  image_url?: string | null
  sort_order: number
  
  // Status
  is_active: boolean
  
  // Custom
  custom_fields: Record<string, unknown>
  
  // Audit
  created_by?: string | null
  created_at: string
  updated_at: string
  
  // Relations (when joined)
  staff?: Staff[]
}

export type ServiceInput = Omit<Service, 'id' | 'created_at' | 'updated_at' | 'staff'>
export type ServiceUpdate = Partial<ServiceInput>

// ============================================================================
// STAFF
// ============================================================================

export interface Staff {
  id: string
  site_id: string
  
  // Link to user
  user_id?: string | null
  
  // Details
  name: string
  email?: string | null
  phone?: string | null
  
  // Display
  avatar_url?: string | null
  bio?: string | null
  
  // Availability
  default_availability: Record<string, unknown>
  timezone: string
  
  // Working hours (day-based schedule)
  working_hours?: {
    [key: string]: {
      enabled: boolean
      start: string
      end: string
    }
  }
  
  // Settings
  accept_bookings: boolean
  
  // Status
  is_active: boolean
  
  // Audit
  created_at: string
  updated_at: string
  
  // Relations
  services?: Service[]
  calendar?: Calendar | null
}

export type StaffInput = Omit<Staff, 'id' | 'created_at' | 'updated_at' | 'services' | 'calendar'>
export type StaffUpdate = Partial<StaffInput>

// ============================================================================
// STAFF SERVICE ASSIGNMENT
// ============================================================================

export interface StaffService {
  id: string
  site_id: string
  staff_id: string
  service_id: string
  
  custom_price?: number | null
  custom_duration_minutes?: number | null
  
  created_at: string
  
  // Relations
  staff?: Staff
  service?: Service
}

export type StaffServiceInput = Omit<StaffService, 'id' | 'created_at' | 'staff' | 'service'>

// ============================================================================
// CALENDARS
// ============================================================================

export interface Calendar {
  id: string
  site_id: string
  
  // Details
  name: string
  description?: string | null
  
  // Type
  type: CalendarType
  
  // Link
  staff_id?: string | null
  
  // Timezone
  timezone: string
  
  // External sync
  external_calendar_url?: string | null
  external_calendar_type?: string | null
  last_synced_at?: string | null
  
  // Status
  is_active: boolean
  
  // Audit
  created_at: string
  updated_at: string
  
  // Relations
  staff?: Staff | null
  availability?: Availability[]
}

export type CalendarInput = Omit<Calendar, 'id' | 'created_at' | 'updated_at' | 'staff' | 'availability'>
export type CalendarUpdate = Partial<CalendarInput>

// ============================================================================
// AVAILABILITY
// ============================================================================

export interface Availability {
  id: string
  site_id: string
  
  // What this applies to
  calendar_id?: string | null
  staff_id?: string | null
  service_id?: string | null
  
  // Rule type
  rule_type: AvailabilityRuleType
  
  // When (recurring)
  day_of_week?: number | null  // 0=Sunday, 6=Saturday
  start_time?: string | null   // TIME format
  end_time?: string | null     // TIME format
  
  // When (specific date)
  specific_date?: string | null
  
  // Date range
  valid_from?: string | null
  valid_until?: string | null
  
  // Priority
  priority: number
  
  // Label
  label?: string | null
  
  // Audit
  created_at: string
}

export type AvailabilityInput = Omit<Availability, 'id' | 'created_at'>
export type AvailabilityUpdate = Partial<AvailabilityInput>

// ============================================================================
// APPOINTMENTS
// ============================================================================

export interface Appointment {
  id: string
  site_id: string
  
  // What
  service_id: string
  
  // Who provides
  staff_id?: string | null
  calendar_id?: string | null
  
  // Customer
  customer_name: string
  customer_email?: string | null
  customer_phone?: string | null
  customer_notes?: string | null
  
  // CRM Link
  crm_contact_id?: string | null
  
  // When
  start_time: string
  end_time: string
  timezone: string
  
  // Status
  status: AppointmentStatus
  
  // Cancellation
  cancelled_at?: string | null
  cancelled_by?: CancelledBy | null
  cancellation_reason?: string | null
  
  // Payment
  payment_status: PaymentStatus
  payment_amount?: number | null
  payment_id?: string | null
  
  // Recurring
  recurring_id?: string | null
  recurring_rule?: string | null
  
  // Reminders
  reminder_sent_at?: string | null
  
  // Metadata
  metadata: Record<string, unknown>
  custom_fields: Record<string, unknown>
  
  // Audit
  created_by?: string | null
  created_at: string
  updated_at: string
  
  // Relations
  service?: Service | null
  staff?: Staff | null
  reminders?: Reminder[]
}

export type AppointmentInput = Omit<Appointment, 'id' | 'created_at' | 'updated_at' | 'service' | 'staff' | 'reminders'>
export type AppointmentUpdate = Partial<AppointmentInput>

// ============================================================================
// REMINDERS
// ============================================================================

export interface Reminder {
  id: string
  site_id: string
  appointment_id: string
  
  send_at: string
  type: ReminderType
  status: ReminderStatus
  sent_at?: string | null
  error?: string | null
  
  subject?: string | null
  body?: string | null
  
  created_at: string
}

export type ReminderInput = Omit<Reminder, 'id' | 'created_at'>

// ============================================================================
// SETTINGS
// ============================================================================

export interface BookingSettings {
  id: string
  site_id: string
  
  // General
  business_name?: string | null
  timezone: string
  date_format: string
  time_format: TimeFormat
  
  // Booking rules
  min_booking_notice_hours: number
  max_booking_advance_days: number
  cancellation_notice_hours: number
  slot_interval_minutes: number
  
  // Reminders
  reminder_hours: number[]
  
  // Confirmation
  auto_confirm: boolean
  confirmation_email_enabled: boolean
  
  // Appearance
  accent_color: string
  logo_url?: string | null
  
  // Payment
  require_payment: boolean
  payment_provider?: string | null
  
  // Notifications
  notification_email?: string | null
  
  // CRM Integration
  auto_create_crm_contact: boolean
  
  // Audit
  created_at: string
  updated_at: string
}

export type BookingSettingsInput = Omit<BookingSettings, 'id' | 'created_at' | 'updated_at'>
export type BookingSettingsUpdate = Partial<BookingSettingsInput>

// ============================================================================
// TIME SLOT (computed, not stored)
// ============================================================================

export interface TimeSlot {
  start: Date
  end: Date
  available: boolean
  staffId?: string
  staffName?: string
}

// ============================================================================
// SEARCH RESULT
// ============================================================================

export interface BookingSearchResult {
  appointments: Appointment[]
  services: Service[]
  staff: Staff[]
}

// ============================================================================
// CONTEXT TYPES
// ============================================================================

export interface BookingProviderProps {
  children: React.ReactNode
  siteId: string
  settings?: BookingSettings | null
}

export type BookingView = 'calendar' | 'appointments' | 'services' | 'staff' | 'analytics' | 'settings' | 'embed'

export interface BookingContextValue {
  // State
  siteId: string
  settings: BookingSettings | null
  services: Service[]
  staff: Staff[]
  appointments: Appointment[]
  calendars: Calendar[]
  isLoading: boolean
  error: string | null
  
  // Active selections (for UI)
  activeView: BookingView
  selectedDate: Date
  selectedAppointment: Appointment | null
  selectedService: Service | null
  selectedStaff: Staff | null
  
  // Actions
  setActiveView: (view: BookingView) => void
  setSelectedDate: (date: Date) => void
  setSelectedAppointment: (appointment: Appointment | null) => void
  setSelectedService: (service: Service | null) => void
  setSelectedStaff: (staff: Staff | null) => void
  
  // Service CRUD
  addService: (input: Partial<ServiceInput>) => Promise<Service>
  editService: (id: string, updates: ServiceUpdate) => Promise<Service>
  removeService: (id: string) => Promise<void>
  
  // Staff CRUD
  addStaff: (input: Partial<StaffInput>) => Promise<Staff>
  editStaff: (id: string, updates: StaffUpdate) => Promise<Staff>
  removeStaff: (id: string) => Promise<void>
  
  // Appointment CRUD
  addAppointment: (input: Partial<AppointmentInput>) => Promise<Appointment>
  editAppointment: (id: string, updates: AppointmentUpdate) => Promise<Appointment>
  removeAppointment: (id: string) => Promise<void>
  cancelAppointment: (id: string, cancelledBy: CancelledBy, reason?: string) => Promise<Appointment>
  
  // Calendar CRUD
  addCalendar: (input: Partial<CalendarInput>) => Promise<Calendar>
  editCalendar: (id: string, updates: CalendarUpdate) => Promise<Calendar>
  removeCalendar: (id: string) => Promise<void>
  
  // Data fetching
  refreshServices: () => Promise<void>
  refreshStaff: () => Promise<void>
  refreshAppointments: (options?: { startDate?: Date; endDate?: Date }) => Promise<void>
  refreshCalendars: () => Promise<void>
  refreshAll: () => Promise<void>
}

// ============================================================================
// DASHBOARD STATS
// ============================================================================

export interface BookingStats {
  totalAppointments: number
  pendingAppointments: number
  confirmedAppointments: number
  cancelledAppointments: number
  completedAppointments: number
  noShowAppointments: number
  todayAppointments: number
  upcomingThisWeek: number
  totalServices: number
  activeServices: number
  totalStaff: number
  activeStaff: number
  averageBookingsPerDay: number
  cancellationRate: number
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

// Day names for availability
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const
export type DayName = typeof DAY_NAMES[number]

// Status labels and colors for UI
export const APPOINTMENT_STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending', color: '#F59E0B', variant: 'secondary' },
  confirmed: { label: 'Confirmed', color: '#10B981', variant: 'default' },
  cancelled: { label: 'Cancelled', color: '#EF4444', variant: 'destructive' },
  completed: { label: 'Completed', color: '#3B82F6', variant: 'outline' },
  no_show: { label: 'No Show', color: '#6B7280', variant: 'secondary' }
}

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string }> = {
  pending: { label: 'Payment Pending', color: '#F59E0B' },
  paid: { label: 'Paid', color: '#10B981' },
  refunded: { label: 'Refunded', color: '#6B7280' },
  failed: { label: 'Payment Failed', color: '#EF4444' },
  not_required: { label: 'Not Required', color: '#9CA3AF' }
}
