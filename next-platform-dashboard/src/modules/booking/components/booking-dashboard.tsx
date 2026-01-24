/**
 * Booking Dashboard Main Component
 * 
 * Phase EM-51: Booking Module
 * 
 * The main dashboard shell that provides navigation between Booking views
 */
'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarView } from './views/calendar-view'
import { AppointmentsView } from './views/appointments-view'
import { ServicesView } from './views/services-view'
import { StaffView } from './views/staff-view'
import { AnalyticsView } from './views/analytics-view'
import { AppointmentDetailSheet } from './sheets/appointment-detail-sheet'
import { ServiceDetailSheet } from './sheets/service-detail-sheet'
import { StaffDetailSheet } from './sheets/staff-detail-sheet'
import { BookingProvider, useBooking } from '../context/booking-context'
import { 
  Calendar, 
  CalendarCheck, 
  Briefcase,
  Users,
  BarChart3,
  Search,
  Plus,
  RefreshCw,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { CreateServiceDialog } from './dialogs/create-service-dialog'
import { CreateStaffDialog } from './dialogs/create-staff-dialog'
import { CreateAppointmentDialog } from './dialogs/create-appointment-dialog'
import { BookingSettingsDialog } from './dialogs/booking-settings-dialog'
import type { BookingView, BookingSettings, Appointment, Service, Staff } from '../types/booking-types'

// ============================================================================
// DASHBOARD PROPS
// ============================================================================

interface BookingDashboardProps {
  siteId: string
  settings?: BookingSettings | null
  initialView?: string
}

// ============================================================================
// DASHBOARD CONTENT
// ============================================================================

function BookingDashboardContent({ initialView }: { initialView?: string }) {
  const { 
    services,
    staff,
    appointments,
    error, 
    isLoading,
    refreshAll,
    activeView,
    setActiveView
  } = useBooking()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showCreateService, setShowCreateService] = useState(false)
  const [showCreateStaff, setShowCreateStaff] = useState(false)
  const [showCreateAppointment, setShowCreateAppointment] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  
  // Detail sheets state
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)

  // Set initial view from URL
  useEffect(() => {
    if (initialView) {
      const view = initialView as BookingView
      if (['calendar', 'appointments', 'services', 'staff', 'analytics'].includes(view)) {
        setActiveView(view)
      }
    }
  }, [initialView, setActiveView])

  // Calculate summary stats
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)
  
  const todayAppointments = appointments.filter(a => {
    const startTime = new Date(a.start_time)
    return startTime >= todayStart && startTime <= todayEnd && a.status !== 'cancelled'
  })
  
  const pendingAppointments = appointments.filter(a => a.status === 'pending')
  const confirmedAppointments = appointments.filter(a => a.status === 'confirmed')
  const activeServices = services.filter(s => s.is_active)
  const activeStaff = staff.filter(s => s.is_active)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshAll()
    setIsRefreshing(false)
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Booking Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Manage appointments, services, and staff schedules
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            {/* Actions */}
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowCreateAppointment(true)}>
                  <CalendarCheck className="h-4 w-4 mr-2" />
                  New Appointment
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowCreateService(true)}>
                  <Briefcase className="h-4 w-4 mr-2" />
                  New Service
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowCreateStaff(true)}>
                  <Users className="h-4 w-4 mr-2" />
                  New Staff Member
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today</p>
                  <p className="text-2xl font-bold">{todayAppointments.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{pendingAppointments.length}</p>
                </div>
                <Badge variant="secondary">{confirmedAppointments.length} confirmed</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Services</p>
                  <p className="text-2xl font-bold">{activeServices.length}</p>
                </div>
                <Briefcase className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Staff</p>
                  <p className="text-2xl font-bold">{activeStaff.length}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs 
          value={activeView} 
          onValueChange={(v) => setActiveView(v as BookingView)}
          className="h-full flex flex-col"
        >
          <div className="border-b px-6">
            <TabsList className="h-12">
              <TabsTrigger value="calendar" className="gap-2">
                <Calendar className="h-4 w-4" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="appointments" className="gap-2">
                <CalendarCheck className="h-4 w-4" />
                Appointments
                {pendingAppointments.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {pendingAppointments.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="services" className="gap-2">
                <Briefcase className="h-4 w-4" />
                Services
              </TabsTrigger>
              <TabsTrigger value="staff" className="gap-2">
                <Users className="h-4 w-4" />
                Staff
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-auto">
            <TabsContent value="calendar" className="h-full m-0">
              <CalendarView 
                onAppointmentClick={setSelectedAppointment}
              />
            </TabsContent>
            <TabsContent value="appointments" className="h-full m-0">
              <AppointmentsView 
                onAppointmentClick={setSelectedAppointment}
              />
            </TabsContent>
            <TabsContent value="services" className="h-full m-0">
              <ServicesView 
                onServiceClick={setSelectedService}
                onCreateClick={() => setShowCreateService(true)}
              />
            </TabsContent>
            <TabsContent value="staff" className="h-full m-0">
              <StaffView 
                onStaffClick={setSelectedStaff}
                onCreateClick={() => setShowCreateStaff(true)}
              />
            </TabsContent>
            <TabsContent value="analytics" className="h-full m-0">
              <AnalyticsView />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Dialogs */}
      <CreateServiceDialog
        open={showCreateService}
        onOpenChange={setShowCreateService}
      />
      <CreateStaffDialog
        open={showCreateStaff}
        onOpenChange={setShowCreateStaff}
      />
      <CreateAppointmentDialog
        open={showCreateAppointment}
        onOpenChange={setShowCreateAppointment}
      />
      <BookingSettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
      />
      
      {/* Detail Sheets */}
      <AppointmentDetailSheet
        appointment={selectedAppointment}
        open={!!selectedAppointment}
        onOpenChange={(open) => !open && setSelectedAppointment(null)}
      />
      <ServiceDetailSheet
        service={selectedService}
        open={!!selectedService}
        onOpenChange={(open) => !open && setSelectedService(null)}
      />
      <StaffDetailSheet
        staffMember={selectedStaff}
        open={!!selectedStaff}
        onOpenChange={(open) => !open && setSelectedStaff(null)}
      />
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function BookingDashboard({ siteId, settings, initialView }: BookingDashboardProps) {
  return (
    <BookingProvider siteId={siteId} settings={settings}>
      <BookingDashboardContent initialView={initialView} />
    </BookingProvider>
  )
}
