/**
 * Appointments View Component
 * 
 * Phase EM-51: Booking Module
 * Displays appointments in a filterable list format
 */
'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useBooking } from '../../context/booking-context'
import {
  Search,
  MoreHorizontal,
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Trash2,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Appointment, AppointmentStatus } from '../../types/booking-types'
import { toast } from 'sonner'

import { DEFAULT_LOCALE } from '@/lib/locale-config'
interface AppointmentsViewProps {
  searchQuery?: string
  onAppointmentClick?: (appointment: Appointment) => void
}

const STATUS_OPTIONS: { value: AppointmentStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No Show' },
]

const DATE_FILTERS = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'this-week', label: 'This Week' },
  { value: 'next-week', label: 'Next Week' },
  { value: 'this-month', label: 'This Month' },
  { value: 'past', label: 'Past' },
]

// Helper to extract date string from ISO timestamp
function getDateFromTimestamp(timestamp: string): string {
  return timestamp.split('T')[0]
}

// Helper to extract time string from ISO timestamp  
function getTimeFromTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString(DEFAULT_LOCALE, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(timeStr: string, format: '12h' | '24h' = '12h'): string {
  const [hours, minutes] = timeStr.split(':').map(Number)
  if (format === '24h') {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }
  const period = hours >= 12 ? 'PM' : 'AM'
  const h = hours % 12 || 12
  return `${h}:${minutes.toString().padStart(2, '0')} ${period}`
}

function getDateFilterRange(filter: string): { start: string; end: string } | null {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]
  
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  
  const startOfNextWeek = new Date(endOfWeek)
  startOfNextWeek.setDate(endOfWeek.getDate() + 1)
  const endOfNextWeek = new Date(startOfNextWeek)
  endOfNextWeek.setDate(startOfNextWeek.getDate() + 6)
  
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  
  switch (filter) {
    case 'today':
      return { start: todayStr, end: todayStr }
    case 'tomorrow':
      return { start: tomorrowStr, end: tomorrowStr }
    case 'this-week':
      return {
        start: startOfWeek.toISOString().split('T')[0],
        end: endOfWeek.toISOString().split('T')[0],
      }
    case 'next-week':
      return {
        start: startOfNextWeek.toISOString().split('T')[0],
        end: endOfNextWeek.toISOString().split('T')[0],
      }
    case 'this-month':
      return {
        start: startOfMonth.toISOString().split('T')[0],
        end: endOfMonth.toISOString().split('T')[0],
      }
    case 'past':
      return {
        start: '2000-01-01',
        end: new Date(today.setDate(today.getDate() - 1)).toISOString().split('T')[0],
      }
    default:
      return null
  }
}

export function AppointmentsView({ onAppointmentClick }: AppointmentsViewProps) {
  const {
    appointments,
    staff,
    services,
    settings,
    isLoading,
    editAppointment,
    removeAppointment,
    refreshAll,
  } = useBooking()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [staffFilter, setStaffFilter] = useState<string>('all')
  const [serviceFilter, setServiceFilter] = useState<string>('all')
  
  // Get staff and service names
  const getStaffName = (staffId?: string | null) => {
    if (!staffId) return 'Unassigned'
    const s = staff.find((st) => st.id === staffId)
    return s ? s.name : 'Unknown'
  }
  
  const getServiceName = (serviceId: string) => {
    const s = services.find((srv) => srv.id === serviceId)
    return s ? s.name : 'Unknown Service'
  }
  
  // Filter appointments
  const filteredAppointments = useMemo(() => {
    let filtered = [...appointments]
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((apt) =>
        apt.customer_name.toLowerCase().includes(query) ||
        apt.customer_email?.toLowerCase().includes(query) ||
        apt.customer_phone?.toLowerCase().includes(query) ||
        getServiceName(apt.service_id).toLowerCase().includes(query)
      )
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((apt) => apt.status === statusFilter)
    }
    
    // Date filter
    const dateRange = getDateFilterRange(dateFilter)
    if (dateRange) {
      filtered = filtered.filter((apt) => {
        const aptDate = getDateFromTimestamp(apt.start_time)
        return aptDate >= dateRange.start && aptDate <= dateRange.end
      })
    }
    
    // Staff filter
    if (staffFilter !== 'all') {
      filtered = filtered.filter((apt) => apt.staff_id === staffFilter)
    }
    
    // Service filter
    if (serviceFilter !== 'all') {
      filtered = filtered.filter((apt) => apt.service_id === serviceFilter)
    }
    
    // Sort by date and time (most recent first)
    filtered.sort((a, b) => {
      return new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    })
    
    return filtered
  }, [appointments, searchQuery, statusFilter, dateFilter, staffFilter, serviceFilter, staff, services])
  
  // Status actions
  const handleStatusChange = async (apt: Appointment, newStatus: AppointmentStatus) => {
    try {
      await editAppointment(apt.id, { status: newStatus })
      toast.success(`Appointment ${newStatus}`)
    } catch {
      toast.error('Failed to update status')
    }
  }
  
  const handleDelete = async (apt: Appointment) => {
    if (!confirm('Are you sure you want to delete this appointment?')) return
    try {
      await removeAppointment(apt.id)
      toast.success('Appointment deleted')
    } catch {
      toast.error('Failed to delete appointment')
    }
  }
  
  return (
    <div className="p-6">
      <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Appointments</CardTitle>
          <Button variant="outline" size="sm" onClick={refreshAll} disabled={isLoading}>
            <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2 pt-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by customer name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as AppointmentStatus | 'all')}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              {DATE_FILTERS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={staffFilter} onValueChange={setStaffFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Staff" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff</SelectItem>
              {staff.filter((s) => s.is_active).map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {services.filter((s) => s.is_active).map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    {isLoading ? 'Loading...' : 'No appointments found'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAppointments.map((apt) => (
                  <TableRow
                    key={apt.id}
                    className="cursor-pointer hover:bg-accent/50"
                    onClick={() => onAppointmentClick?.(apt)}
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(getDateFromTimestamp(apt.start_time))}
                        </span>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(getTimeFromTimestamp(apt.start_time), settings?.time_format)} - {formatTime(getTimeFromTimestamp(apt.end_time), settings?.time_format)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{apt.customer_name}</span>
                        {apt.customer_email && (
                          <span className="text-sm text-muted-foreground">{apt.customer_email}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getServiceName(apt.service_id)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        {getStaffName(apt.staff_id)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          apt.status === 'confirmed' && 'border-blue-500 bg-blue-500/10 text-blue-700',
                          apt.status === 'pending' && 'border-yellow-500 bg-yellow-500/10 text-yellow-700',
                          apt.status === 'completed' && 'border-green-500 bg-green-500/10 text-green-700',
                          apt.status === 'cancelled' && 'border-red-500 bg-red-500/10 text-red-700',
                          apt.status === 'no_show' && 'border-gray-500 bg-gray-500/10 text-gray-700'
                        )}
                      >
                        {apt.status === 'no_show' ? 'No Show' : apt.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            onAppointmentClick?.(apt)
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-xs text-muted-foreground">
                            Change Status
                          </DropdownMenuLabel>
                          {apt.status !== 'confirmed' && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              handleStatusChange(apt, 'confirmed')
                            }}>
                              <CheckCircle className="h-4 w-4 mr-2 text-blue-500" />
                              Confirm
                            </DropdownMenuItem>
                          )}
                          {apt.status !== 'completed' && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              handleStatusChange(apt, 'completed')
                            }}>
                              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                              Complete
                            </DropdownMenuItem>
                          )}
                          {apt.status !== 'cancelled' && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              handleStatusChange(apt, 'cancelled')
                            }}>
                              <XCircle className="h-4 w-4 mr-2 text-red-500" />
                              Cancel
                            </DropdownMenuItem>
                          )}
                          {apt.status !== 'no_show' && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              handleStatusChange(apt, 'no_show')
                            }}>
                              <AlertCircle className="h-4 w-4 mr-2 text-gray-500" />
                              No Show
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(apt)
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Summary */}
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <span>
            Showing {filteredAppointments.length} of {appointments.length} appointments
          </span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              Pending: {appointments.filter((a) => a.status === 'pending').length}
            </span>
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              Confirmed: {appointments.filter((a) => a.status === 'confirmed').length}
            </span>
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              Completed: {appointments.filter((a) => a.status === 'completed').length}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  )
}
