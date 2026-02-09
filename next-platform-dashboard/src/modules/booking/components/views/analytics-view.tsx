/**
 * Analytics View Component
 * 
 * Phase EM-51: Booking Module
 * Displays booking analytics and statistics
 */
'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useBooking } from '../../context/booking-context'
import {
  Calendar,
  DollarSign,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Appointment, AppointmentStatus } from '../../types/booking-types'

import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'
type DateRange = '7d' | '30d' | '90d' | '1y' | 'all'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

function StatCard({ title, value, description, icon: Icon, trend, className }: StatCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className={cn(
            'flex items-center text-xs mt-1',
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          )}>
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            {trend.value}% from previous period
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function formatCurrency(amount: number, currency: string = DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

function getDateRangeStart(range: DateRange): Date {
  const now = new Date()
  switch (range) {
    case '7d':
      return new Date(now.setDate(now.getDate() - 7))
    case '30d':
      return new Date(now.setDate(now.getDate() - 30))
    case '90d':
      return new Date(now.setDate(now.getDate() - 90))
    case '1y':
      return new Date(now.setFullYear(now.getFullYear() - 1))
    case 'all':
      return new Date(2000, 0, 1)
  }
}

export function AnalyticsView() {
  const { appointments, services, staff, isLoading, refreshAll } = useBooking()
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  
  // Filter appointments by date range
  const filteredAppointments = useMemo(() => {
    const startDate = getDateRangeStart(dateRange)
    return appointments.filter((apt) => new Date(apt.start_time) >= startDate)
  }, [appointments, dateRange])
  
  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredAppointments.length
    const completed = filteredAppointments.filter((a) => a.status === 'completed').length
    const cancelled = filteredAppointments.filter((a) => a.status === 'cancelled').length
    const noShows = filteredAppointments.filter((a) => a.status === 'no_show').length
    const pending = filteredAppointments.filter((a) => a.status === 'pending').length
    const confirmed = filteredAppointments.filter((a) => a.status === 'confirmed').length
    
    // Calculate revenue from completed appointments
    const revenue = filteredAppointments
      .filter((a) => a.status === 'completed')
      .reduce((sum, apt) => sum + (apt.payment_amount || 0), 0)
    
    // Average appointments per day
    const days = dateRange === 'all' ? 365 : parseInt(dateRange.replace(/\D/g, '') || '30')
    const avgPerDay = total / days
    
    // Completion rate
    const completionRate = total > 0 ? (completed / total) * 100 : 0
    
    // Cancellation rate
    const cancellationRate = total > 0 ? (cancelled / total) * 100 : 0
    
    // No-show rate
    const noShowRate = total > 0 ? (noShows / total) * 100 : 0
    
    return {
      total,
      completed,
      cancelled,
      noShows,
      pending,
      confirmed,
      revenue,
      avgPerDay,
      completionRate,
      cancellationRate,
      noShowRate,
    }
  }, [filteredAppointments, dateRange])
  
  // Status breakdown for chart
  const statusBreakdown = useMemo(() => {
    const breakdown: Record<AppointmentStatus, number> = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      no_show: 0,
    }
    filteredAppointments.forEach((apt) => {
      breakdown[apt.status]++
    })
    return breakdown
  }, [filteredAppointments])
  
  // Top services
  const topServices = useMemo(() => {
    const serviceCounts: Record<string, { count: number; revenue: number; name: string }> = {}
    
    filteredAppointments.forEach((apt) => {
      const service = services.find((s) => s.id === apt.service_id)
      if (service) {
        if (!serviceCounts[service.id]) {
          serviceCounts[service.id] = { count: 0, revenue: 0, name: service.name }
        }
        serviceCounts[service.id].count++
        if (apt.status === 'completed') {
          serviceCounts[service.id].revenue += apt.payment_amount ?? (service.price ?? 0)
        }
      }
    })
    
    return Object.entries(serviceCounts)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [filteredAppointments, services])
  
  // Top staff
  const topStaff = useMemo(() => {
    const staffCounts: Record<string, { count: number; completed: number; name: string }> = {}
    
    filteredAppointments.forEach((apt) => {
      if (apt.staff_id) {
        const staffMember = staff.find((s) => s.id === apt.staff_id)
        if (staffMember) {
          if (!staffCounts[staffMember.id]) {
            staffCounts[staffMember.id] = { count: 0, completed: 0, name: staffMember.name }
          }
          staffCounts[staffMember.id].count++
          if (apt.status === 'completed') {
            staffCounts[staffMember.id].completed++
          }
        }
      }
    })
    
    return Object.entries(staffCounts)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [filteredAppointments, staff])
  
  // Busiest days
  const busiestDays = useMemo(() => {
    const dayCounts: Record<string, number> = {
      Sunday: 0,
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
    }
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    
    filteredAppointments.forEach((apt) => {
      const day = dayNames[new Date(apt.start_time).getDay()]
      dayCounts[day]++
    })
    
    return Object.entries(dayCounts)
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => b.count - a.count)
  }, [filteredAppointments])
  
  // Busiest hours
  const busiestHours = useMemo(() => {
    const hourCounts: Record<number, number> = {}
    
    filteredAppointments.forEach((apt) => {
      const hour = new Date(apt.start_time).getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })
    
    return Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [filteredAppointments])
  
  const formatHour = (hour: number): string => {
    const period = hour >= 12 ? 'PM' : 'AM'
    const h = hour % 12 || 12
    return `${h}:00 ${period}`
  }
  
  return (
    <div className="p-6 space-y-6">
      {/* Header with date range selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics</h2>
          <p className="text-muted-foreground">Track your booking performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={refreshAll} disabled={isLoading}>
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Appointments"
          value={stats.total}
          description={`${stats.avgPerDay.toFixed(1)} per day average`}
          icon={Calendar}
        />
        <StatCard
          title="Revenue"
          value={formatCurrency(stats.revenue)}
          description="From completed appointments"
          icon={DollarSign}
        />
        <StatCard
          title="Completion Rate"
          value={`${stats.completionRate.toFixed(1)}%`}
          description={`${stats.completed} completed`}
          icon={CheckCircle}
        />
        <StatCard
          title="Active Staff"
          value={staff.filter((s) => s.is_active).length}
          description={`${staff.length} total`}
          icon={Users}
        />
      </div>
      
      {/* Status Breakdown */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <span>Pending</span>
                </div>
                <span className="font-medium">{statusBreakdown.pending}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span>Confirmed</span>
                </div>
                <span className="font-medium">{statusBreakdown.confirmed}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span>Completed</span>
                </div>
                <span className="font-medium">{statusBreakdown.completed}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span>Cancelled</span>
                </div>
                <span className="font-medium">{statusBreakdown.cancelled}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-gray-500" />
                  <span>No Show</span>
                </div>
                <span className="font-medium">{statusBreakdown.no_show}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topServices.length === 0 ? (
                <p className="text-muted-foreground text-sm">No data available</p>
              ) : (
                topServices.map((service, index) => (
                  <div key={service.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                      <span className="truncate">{service.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{service.count}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(service.revenue)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topStaff.length === 0 ? (
                <p className="text-muted-foreground text-sm">No data available</p>
              ) : (
                topStaff.map((staffMember, index) => (
                  <div key={staffMember.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                      <span className="truncate">{staffMember.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{staffMember.count}</div>
                      <div className="text-xs text-muted-foreground">
                        {staffMember.completed} completed
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Timing Analysis */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Busiest Days
            </CardTitle>
            <CardDescription>Appointments by day of week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {busiestDays.map((day, index) => {
                const maxCount = busiestDays[0]?.count || 1
                const percentage = (day.count / maxCount) * 100
                return (
                  <div key={day.day} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{day.day}</span>
                      <span className="font-medium">{day.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          index === 0 ? 'bg-primary' : 'bg-primary/60'
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Peak Hours
            </CardTitle>
            <CardDescription>Most popular booking times</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {busiestHours.length === 0 ? (
                <p className="text-muted-foreground text-sm">No data available</p>
              ) : (
                busiestHours.map((hourData, index) => {
                  const maxCount = busiestHours[0]?.count || 1
                  const percentage = (hourData.count / maxCount) * 100
                  return (
                    <div key={hourData.hour} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{formatHour(hourData.hour)}</span>
                        <span className="font-medium">{hourData.count} bookings</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            index === 0 ? 'bg-green-500' : 'bg-green-500/60'
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Performance Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Performance Indicators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cancellation Rate</span>
                <span className={cn(
                  'font-medium',
                  stats.cancellationRate > 20 ? 'text-red-600' : 'text-green-600'
                )}>
                  {stats.cancellationRate.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full',
                    stats.cancellationRate > 20 ? 'bg-red-500' : 'bg-green-500'
                  )}
                  style={{ width: `${Math.min(stats.cancellationRate, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.cancellationRate > 20 ? 'High cancellation rate' : 'Healthy cancellation rate'}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">No-Show Rate</span>
                <span className={cn(
                  'font-medium',
                  stats.noShowRate > 10 ? 'text-red-600' : 'text-green-600'
                )}>
                  {stats.noShowRate.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full',
                    stats.noShowRate > 10 ? 'bg-red-500' : 'bg-green-500'
                  )}
                  style={{ width: `${Math.min(stats.noShowRate * 2, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.noShowRate > 10 ? 'High no-show rate' : 'Healthy no-show rate'}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Completion Rate</span>
                <span className={cn(
                  'font-medium',
                  stats.completionRate < 70 ? 'text-yellow-600' : 'text-green-600'
                )}>
                  {stats.completionRate.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full',
                    stats.completionRate < 70 ? 'bg-yellow-500' : 'bg-green-500'
                  )}
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.completionRate < 70 ? 'Room for improvement' : 'Excellent completion rate'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
