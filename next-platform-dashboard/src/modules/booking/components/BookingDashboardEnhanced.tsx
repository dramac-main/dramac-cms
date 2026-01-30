"use client"

/**
 * Booking Dashboard Enhanced
 * 
 * PHASE-UI-15: Booking Module UI Enhancement
 * Enhanced dashboard integrating all new UI components
 */

import * as React from "react"
import { motion } from "framer-motion"
import { 
  Calendar,
  Clock,
  Plus,
  Users,
  ClipboardList,
  Settings,
  AlertTriangle,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Import new UI components
import {
  AppointmentsMetricCard,
  BookingRevenueMetricCard,
  UtilizationMetricCard,
  PendingMetricCard,
  BookingMetricCard,
} from './ui/booking-metric-card'
import { AppointmentCard, AppointmentCardSkeleton } from './ui/appointment-card'
import { ServiceCard, ServiceCardSkeleton } from './ui/service-card'
import { StaffCard, StaffCardSkeleton } from './ui/staff-card'
import { CalendarTimeline, DayTimeline } from './ui/calendar-timeline'
import { BookingFilterBar, ServiceFilterBar, StaffFilterBar } from './ui/booking-filter-bar'
import { BookingQuickActions, getDefaultBookingActions } from './ui/booking-quick-actions'
import { AvailabilityAlertBanner, PendingAppointmentsAlert } from './ui/availability-alert'

// Import types
import type { 
  Appointment, 
  Service, 
  Staff, 
  AppointmentStatus 
} from '../types/booking-types'
import type { DateRange } from "react-day-picker"

// =============================================================================
// TYPES
// =============================================================================

export type BookingView = 'overview' | 'appointments' | 'services' | 'staff' | 'calendar'

export interface BookingDashboardEnhancedProps {
  /** Site ID */
  siteId: string
  /** Agency ID */
  agencyId: string
  /** Initial active view */
  initialView?: BookingView
  /** Appointments data */
  appointments?: Appointment[]
  /** Services data */
  services?: Service[]
  /** Staff data */
  staff?: Staff[]
  /** Loading state */
  isLoading?: boolean
  /** Error state */
  error?: string | null
  /** Currency */
  currency?: string
  /** Handlers */
  onCreateAppointment?: () => void
  onCreateService?: () => void
  onAddStaff?: () => void
  onOpenSettings?: () => void
  onViewAppointment?: (appointment: Appointment) => void
  onConfirmAppointment?: (appointmentId: string) => void
  onCancelAppointment?: (appointmentId: string) => void
  onViewService?: (service: Service) => void
  onEditService?: (service: Service) => void
  onViewStaff?: (staff: Staff) => void
  onEditStaff?: (staff: Staff) => void
  onRefresh?: () => void
  /** Additional class names */
  className?: string
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateMockSparkline(): number[] {
  return Array.from({ length: 14 }, () => Math.floor(Math.random() * 100) + 20)
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function BookingDashboardEnhanced({
  siteId,
  agencyId,
  initialView = 'overview',
  appointments = [],
  services = [],
  staff = [],
  isLoading = false,
  error,
  currency = 'USD',
  onCreateAppointment,
  onCreateService,
  onAddStaff,
  onOpenSettings,
  onViewAppointment,
  onConfirmAppointment,
  onCancelAppointment,
  onViewService,
  onEditService,
  onViewStaff,
  onEditStaff,
  onRefresh,
  className,
}: BookingDashboardEnhancedProps) {
  const [activeView, setActiveView] = React.useState<BookingView>(initialView)
  
  // Appointment filters
  const [appointmentSearch, setAppointmentSearch] = React.useState('')
  const [appointmentStatus, setAppointmentStatus] = React.useState<AppointmentStatus | 'all'>('all')
  const [appointmentService, setAppointmentService] = React.useState('all')
  const [appointmentStaff, setAppointmentStaff] = React.useState('all')
  const [appointmentDateRange, setAppointmentDateRange] = React.useState<DateRange | undefined>()
  const [appointmentSort, setAppointmentSort] = React.useState('date_asc')
  const [appointmentViewMode, setAppointmentViewMode] = React.useState<'grid' | 'list' | 'calendar'>('list')

  // Service filters
  const [serviceSearch, setServiceSearch] = React.useState('')
  const [serviceActive, setServiceActive] = React.useState<'all' | 'active' | 'inactive'>('all')
  const [serviceSort, setServiceSort] = React.useState('name_asc')
  const [serviceViewMode, setServiceViewMode] = React.useState<'grid' | 'list'>('grid')

  // Staff filters
  const [staffSearch, setStaffSearch] = React.useState('')
  const [staffActive, setStaffActive] = React.useState<'all' | 'active' | 'inactive'>('all')
  const [staffAccepting, setStaffAccepting] = React.useState<'all' | 'accepting' | 'not_accepting'>('all')
  const [staffSort, setStaffSort] = React.useState('name_asc')
  const [staffViewMode, setStaffViewMode] = React.useState<'grid' | 'list'>('grid')

  // Calculate stats
  const today = new Date()
  const todayAppointments = appointments.filter(a => 
    isSameDay(new Date(a.start_time), today)
  )
  const upcomingAppointments = appointments.filter(a => 
    new Date(a.start_time) > today && 
    (a.status === 'pending' || a.status === 'confirmed')
  )
  const pendingAppointments = appointments.filter(a => a.status === 'pending')
  const completedAppointments = appointments.filter(a => a.status === 'completed')
  
  const totalRevenue = appointments
    .filter(a => a.payment_status === 'paid')
    .reduce((sum, a) => sum + (a.payment_amount || 0), 0)

  const activeServices = services.filter(s => s.is_active)
  const activeStaff = staff.filter(s => s.is_active && s.accept_bookings)

  // Utilization calculation (simplified)
  const utilizationRate = staff.length > 0 
    ? Math.round((todayAppointments.length / (staff.length * 8)) * 100) 
    : 0

  // Filter appointments
  const filteredAppointments = React.useMemo(() => {
    return appointments.filter(appointment => {
      if (appointmentStatus !== 'all' && appointment.status !== appointmentStatus) return false
      if (appointmentService !== 'all' && appointment.service_id !== appointmentService) return false
      if (appointmentStaff !== 'all' && appointment.staff_id !== appointmentStaff) return false
      if (appointmentSearch) {
        const query = appointmentSearch.toLowerCase()
        if (
          !appointment.customer_name.toLowerCase().includes(query) &&
          !appointment.customer_email?.toLowerCase().includes(query)
        ) return false
      }
      if (appointmentDateRange?.from) {
        const appointmentDate = new Date(appointment.start_time)
        if (appointmentDate < appointmentDateRange.from) return false
        if (appointmentDateRange.to && appointmentDate > appointmentDateRange.to) return false
      }
      return true
    }).sort((a, b) => {
      switch (appointmentSort) {
        case 'date_asc': return new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        case 'name_asc': return a.customer_name.localeCompare(b.customer_name)
        case 'name_desc': return b.customer_name.localeCompare(a.customer_name)
        case 'created_asc': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        default: return new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
      }
    })
  }, [appointments, appointmentStatus, appointmentService, appointmentStaff, appointmentSearch, appointmentDateRange, appointmentSort])

  // Filter services
  const filteredServices = React.useMemo(() => {
    return services.filter(service => {
      if (serviceActive === 'active' && !service.is_active) return false
      if (serviceActive === 'inactive' && service.is_active) return false
      if (serviceSearch) {
        const query = serviceSearch.toLowerCase()
        if (!service.name.toLowerCase().includes(query)) return false
      }
      return true
    }).sort((a, b) => {
      switch (serviceSort) {
        case 'name_desc': return b.name.localeCompare(a.name)
        case 'price_asc': return a.price - b.price
        case 'price_desc': return b.price - a.price
        case 'duration_asc': return a.duration_minutes - b.duration_minutes
        case 'duration_desc': return b.duration_minutes - a.duration_minutes
        default: return a.name.localeCompare(b.name)
      }
    })
  }, [services, serviceActive, serviceSearch, serviceSort])

  // Filter staff
  const filteredStaff = React.useMemo(() => {
    return staff.filter(member => {
      if (staffActive === 'active' && !member.is_active) return false
      if (staffActive === 'inactive' && member.is_active) return false
      if (staffAccepting === 'accepting' && !member.accept_bookings) return false
      if (staffAccepting === 'not_accepting' && member.accept_bookings) return false
      if (staffSearch) {
        const query = staffSearch.toLowerCase()
        if (!member.name.toLowerCase().includes(query)) return false
      }
      return true
    }).sort((a, b) => {
      switch (staffSort) {
        case 'name_desc': return b.name.localeCompare(a.name)
        case 'created_asc': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'created_desc': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        default: return a.name.localeCompare(b.name)
      }
    })
  }, [staff, staffActive, staffAccepting, staffSearch, staffSort])

  // Quick actions
  const quickActions = getDefaultBookingActions({
    onNewAppointment: onCreateAppointment,
    onViewCalendar: () => setActiveView('calendar'),
    onManageServices: () => setActiveView('services'),
    onManageStaff: () => setActiveView('staff'),
    onSettings: onOpenSettings,
  })

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-destructive">{error}</p>
        <Button onClick={onRefresh}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Booking</h1>
          <p className="text-muted-foreground">
            Manage appointments, services, and staff schedules
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onCreateAppointment}>
                <Calendar className="h-4 w-4 mr-2" />
                New Appointment
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onCreateService}>
                <ClipboardList className="h-4 w-4 mr-2" />
                New Service
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onAddStaff}>
                <Users className="h-4 w-4 mr-2" />
                Add Staff
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onOpenSettings}>
                <Settings className="h-4 w-4 mr-2" />
                Booking Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Pending Appointments Banner */}
      {pendingAppointments.length > 0 && (
        <AvailabilityAlertBanner
          count={pendingAppointments.length}
          severity="warning"
          message={`${pendingAppointments.length} appointment${pendingAppointments.length > 1 ? 's' : ''} pending confirmation`}
          onViewAll={() => {
            setAppointmentStatus('pending')
            setActiveView('appointments')
          }}
        />
      )}

      {/* Tabs */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as BookingView)}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="appointments">
            Appointments
            {todayAppointments.length > 0 && (
              <span className="ml-2 text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                {todayAppointments.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <AppointmentsMetricCard
              title="Today"
              value={todayAppointments.length}
              change={{ value: 10, trend: 'up', period: 'vs yesterday' }}
              sparklineData={generateMockSparkline()}
              animationDelay={0}
            />
            <BookingRevenueMetricCard
              title="Revenue"
              value={totalRevenue}
              currency={currency}
              change={{ value: 12.5, trend: 'up', period: 'vs last month' }}
              sparklineData={generateMockSparkline()}
              animationDelay={0.05}
            />
            <UtilizationMetricCard
              title="Utilization"
              value={utilizationRate}
              change={{ value: 5, trend: 'up' }}
              animationDelay={0.1}
            />
            <BookingMetricCard
              title="Active Services"
              value={activeServices.length}
              variant="services"
              icon={ClipboardList}
              animationDelay={0.15}
            />
            {pendingAppointments.length > 0 && (
              <PendingMetricCard
                title="Pending"
                value={pendingAppointments.length}
                animationDelay={0.2}
                onClick={() => {
                  setAppointmentStatus('pending')
                  setActiveView('appointments')
                }}
              />
            )}
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Today's Schedule */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Today's Schedule</h2>
                <Button variant="ghost" size="sm" onClick={() => setActiveView('calendar')}>
                  View Calendar
                </Button>
              </div>
              <DayTimeline
                date={today}
                appointments={appointments}
                onAppointmentClick={onViewAppointment}
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <BookingQuickActions
                actions={quickActions.slice(0, 4)}
                columns={2}
              />
              
              {pendingAppointments.length > 0 && (
                <PendingAppointmentsAlert
                  appointments={pendingAppointments}
                  maxItems={3}
                  onAppointmentClick={onViewAppointment}
                  onViewAll={() => {
                    setAppointmentStatus('pending')
                    setActiveView('appointments')
                  }}
                />
              )}
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Upcoming Appointments</h2>
              <Button variant="ghost" size="sm" onClick={() => setActiveView('appointments')}>
                View All
              </Button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <AppointmentCardSkeleton key={i} variant="compact" />
                ))
              ) : (
                upcomingAppointments.slice(0, 6).map((appointment, i) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    variant="compact"
                    onClick={() => onViewAppointment?.(appointment)}
                    animationDelay={i * 0.05}
                  />
                ))
              )}
            </div>
          </div>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-6">
          <BookingFilterBar
            searchQuery={appointmentSearch}
            onSearchChange={setAppointmentSearch}
            statusFilter={appointmentStatus}
            onStatusChange={(s) => setAppointmentStatus(s as AppointmentStatus | 'all')}
            serviceFilter={appointmentService}
            onServiceChange={setAppointmentService}
            services={services.map(s => ({ id: s.id, name: s.name }))}
            staffFilter={appointmentStaff}
            onStaffChange={setAppointmentStaff}
            staff={staff.map(s => ({ id: s.id, name: s.name }))}
            dateRange={appointmentDateRange}
            onDateRangeChange={setAppointmentDateRange}
            sortBy={appointmentSort}
            onSortChange={setAppointmentSort}
            viewMode={appointmentViewMode}
            onViewModeChange={setAppointmentViewMode}
          />

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <AppointmentCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No appointments found</h3>
              <p className="text-muted-foreground mb-4">
                {appointmentSearch || appointmentStatus !== 'all'
                  ? "Try adjusting your filters"
                  : "Create your first appointment to get started"}
              </p>
              {!appointmentSearch && appointmentStatus === 'all' && (
                <Button onClick={onCreateAppointment}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Appointment
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((appointment, i) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onClick={() => onViewAppointment?.(appointment)}
                  onView={() => onViewAppointment?.(appointment)}
                  onConfirm={() => onConfirmAppointment?.(appointment.id)}
                  onCancel={() => onCancelAppointment?.(appointment.id)}
                  animationDelay={i * 0.03}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-6">
          <CalendarTimeline
            appointments={appointments}
            onAppointmentClick={onViewAppointment}
            onTimeSlotClick={(date, hour) => {
              console.log('Time slot clicked:', date, hour)
              onCreateAppointment?.()
            }}
          />
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-6">
          <ServiceFilterBar
            searchQuery={serviceSearch}
            onSearchChange={setServiceSearch}
            activeFilter={serviceActive}
            onActiveChange={(f) => setServiceActive(f as 'all' | 'active' | 'inactive')}
            sortBy={serviceSort}
            onSortChange={setServiceSort}
            viewMode={serviceViewMode}
            onViewModeChange={setServiceViewMode}
          />

          {isLoading ? (
            <div className={cn(
              "grid gap-4",
              serviceViewMode === 'grid' 
                ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                : "grid-cols-1"
            )}>
              {Array.from({ length: 8 }).map((_, i) => (
                <ServiceCardSkeleton key={i} variant={serviceViewMode} />
              ))}
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No services found</h3>
              <p className="text-muted-foreground mb-4">
                {serviceSearch || serviceActive !== 'all'
                  ? "Try adjusting your filters"
                  : "Create your first service to get started"}
              </p>
              {!serviceSearch && serviceActive === 'all' && (
                <Button onClick={onCreateService}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              )}
            </div>
          ) : (
            <div className={cn(
              "grid gap-4",
              serviceViewMode === 'grid' 
                ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                : "grid-cols-1"
            )}>
              {filteredServices.map((service, i) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  variant={serviceViewMode}
                  currency={currency}
                  assignedStaff={staff.filter(s => s.services?.some(svc => svc.id === service.id))}
                  onClick={() => onViewService?.(service)}
                  onView={() => onViewService?.(service)}
                  onEdit={() => onEditService?.(service)}
                  animationDelay={i * 0.03}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Staff Tab */}
        <TabsContent value="staff" className="space-y-6">
          <StaffFilterBar
            searchQuery={staffSearch}
            onSearchChange={setStaffSearch}
            activeFilter={staffActive}
            onActiveChange={(f) => setStaffActive(f as 'all' | 'active' | 'inactive')}
            acceptingFilter={staffAccepting}
            onAcceptingChange={(f) => setStaffAccepting(f as 'all' | 'accepting' | 'not_accepting')}
            sortBy={staffSort}
            onSortChange={setStaffSort}
            viewMode={staffViewMode}
            onViewModeChange={setStaffViewMode}
          />

          {isLoading ? (
            <div className={cn(
              "grid gap-4",
              staffViewMode === 'grid' 
                ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                : "grid-cols-1"
            )}>
              {Array.from({ length: 8 }).map((_, i) => (
                <StaffCardSkeleton key={i} variant={staffViewMode} />
              ))}
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No staff found</h3>
              <p className="text-muted-foreground mb-4">
                {staffSearch || staffActive !== 'all'
                  ? "Try adjusting your filters"
                  : "Add your first staff member to get started"}
              </p>
              {!staffSearch && staffActive === 'all' && (
                <Button onClick={onAddStaff}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Staff
                </Button>
              )}
            </div>
          ) : (
            <div className={cn(
              "grid gap-4",
              staffViewMode === 'grid' 
                ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                : "grid-cols-1"
            )}>
              {filteredStaff.map((member, i) => {
                const memberAppointments = appointments.filter(a => a.staff_id === member.id)
                const todayMemberAppointments = memberAppointments.filter(a => 
                  isSameDay(new Date(a.start_time), today)
                )
                const upcomingMemberAppointments = memberAppointments.filter(a => 
                  new Date(a.start_time) > today && 
                  (a.status === 'pending' || a.status === 'confirmed')
                )
                
                return (
                  <StaffCard
                    key={member.id}
                    staff={member}
                    variant={staffViewMode}
                    assignedServices={member.services}
                    todayAppointments={todayMemberAppointments.length}
                    upcomingAppointments={upcomingMemberAppointments.length}
                    onClick={() => onViewStaff?.(member)}
                    onView={() => onViewStaff?.(member)}
                    onEdit={() => onEditStaff?.(member)}
                    animationDelay={i * 0.03}
                  />
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
