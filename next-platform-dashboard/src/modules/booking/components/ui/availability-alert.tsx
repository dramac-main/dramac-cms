"use client"

/**
 * Availability Alert
 * 
 * PHASE-UI-15: Booking Module UI Enhancement
 * Alerts for scheduling conflicts and availability issues
 */

import * as React from "react"
import { motion } from "framer-motion"
import { 
  AlertTriangle,
  Clock,
  Calendar,
  User,
  X,
  ChevronRight,
  Bell,
  LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { Staff, Appointment } from '../../types/booking-types'

// =============================================================================
// TYPES
// =============================================================================

export interface AvailabilityIssue {
  /** Issue type */
  type: 'overbooking' | 'low_availability' | 'staff_unavailable' | 'no_staff'
  /** Severity */
  severity: 'warning' | 'critical'
  /** Issue message */
  message: string
  /** Related date */
  date?: string
  /** Related staff */
  staff?: Staff
  /** Related appointments */
  appointments?: Appointment[]
  /** Action to take */
  action?: {
    label: string
    onClick: () => void
  }
}

export interface AvailabilityAlertProps {
  /** Issues to display */
  issues: AvailabilityIssue[]
  /** Max issues to show */
  maxItems?: number
  /** Compact mode */
  compact?: boolean
  /** Dismiss handler */
  onDismiss?: (index: number) => void
  /** View all handler */
  onViewAll?: () => void
  /** Additional class names */
  className?: string
}

// =============================================================================
// ISSUE CONFIG
// =============================================================================

const issueConfig: Record<AvailabilityIssue['type'], {
  icon: LucideIcon
  title: string
}> = {
  overbooking: {
    icon: AlertTriangle,
    title: 'Overbooking Detected',
  },
  low_availability: {
    icon: Clock,
    title: 'Low Availability',
  },
  staff_unavailable: {
    icon: User,
    title: 'Staff Unavailable',
  },
  no_staff: {
    icon: User,
    title: 'No Staff Available',
  },
}

const severityConfig: Record<AvailabilityIssue['severity'], {
  badge: 'destructive' | 'default'
  bg: string
  border: string
}> = {
  critical: {
    badge: 'destructive',
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-900',
  },
  warning: {
    badge: 'default',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-900',
  },
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AvailabilityAlert({
  issues,
  maxItems = 5,
  compact = false,
  onDismiss,
  onViewAll,
  className,
}: AvailabilityAlertProps) {
  const displayedIssues = issues.slice(0, maxItems)
  const hasMore = issues.length > maxItems

  if (issues.length === 0) return null

  if (compact) {
    return (
      <Card className={cn("border-amber-200 dark:border-amber-800", className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Availability Alerts
              <Badge variant="secondary" className="ml-1">
                {issues.length}
              </Badge>
            </CardTitle>
            {onViewAll && (
              <Button variant="ghost" size="sm" onClick={onViewAll} className="h-7 text-xs">
                View All
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {displayedIssues.map((issue, index) => {
              const config = issueConfig[issue.type]
              const severity = severityConfig[issue.severity]
              const Icon = config.icon
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-md text-sm",
                    severity.bg
                  )}
                >
                  <Icon className={cn(
                    "h-4 w-4 flex-shrink-0",
                    issue.severity === 'critical' ? 'text-red-600' : 'text-amber-600'
                  )} />
                  <span className="flex-1 truncate">{issue.message}</span>
                  {onDismiss && (
                    <button
                      onClick={() => onDismiss(index)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-600" />
            Availability Alerts
          </CardTitle>
          <Badge variant="secondary">
            {issues.length} {issues.length === 1 ? 'issue' : 'issues'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayedIssues.map((issue, index) => {
            const config = issueConfig[issue.type]
            const severity = severityConfig[issue.severity]
            const Icon = config.icon
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border",
                  severity.bg,
                  severity.border
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg flex-shrink-0",
                  issue.severity === 'critical' ? 'bg-red-100 dark:bg-red-900/50' : 'bg-amber-100 dark:bg-amber-900/50'
                )}>
                  <Icon className={cn(
                    "h-4 w-4",
                    issue.severity === 'critical' ? 'text-red-600' : 'text-amber-600'
                  )} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{config.title}</span>
                    <Badge variant={severity.badge} className="text-xs">
                      {issue.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {issue.message}
                  </p>
                  {issue.date && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(issue.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  )}
                  {issue.action && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={issue.action.onClick}
                      className="mt-2 h-7 text-xs"
                    >
                      {issue.action.label}
                    </Button>
                  )}
                </div>

                {onDismiss && (
                  <button
                    onClick={() => onDismiss(index)}
                    className="text-muted-foreground hover:text-foreground flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </motion.div>
            )
          })}
        </div>

        {hasMore && onViewAll && (
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={onViewAll}
          >
            View All {issues.length} Alerts
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// AVAILABILITY ALERT BANNER
// =============================================================================

export interface AvailabilityAlertBannerProps {
  /** Number of issues */
  count: number
  /** Severity */
  severity?: 'warning' | 'critical'
  /** Custom message */
  message?: string
  /** View all handler */
  onViewAll?: () => void
  /** Dismiss handler */
  onDismiss?: () => void
  /** Additional class names */
  className?: string
}

export function AvailabilityAlertBanner({
  count,
  severity = 'warning',
  message,
  onViewAll,
  onDismiss,
  className,
}: AvailabilityAlertBannerProps) {
  if (count === 0) return null

  const defaultMessage = count === 1
    ? 'There is 1 scheduling issue that needs attention'
    : `There are ${count} scheduling issues that need attention`

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Alert 
        variant={severity === 'critical' ? 'destructive' : 'default'}
        className={cn(
          severity === 'warning' && 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30',
          className
        )}
      >
        <AlertTriangle className={cn(
          "h-4 w-4",
          severity === 'critical' ? 'text-destructive' : 'text-amber-600'
        )} />
        <AlertTitle className="flex items-center gap-2">
          Availability Alerts
          <Badge variant={severity === 'critical' ? 'destructive' : 'secondary'}>
            {count}
          </Badge>
        </AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>{message || defaultMessage}</span>
          <div className="flex items-center gap-2">
            {onViewAll && (
              <Button variant="outline" size="sm" onClick={onViewAll}>
                View Issues
              </Button>
            )}
            {onDismiss && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDismiss}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </motion.div>
  )
}

// =============================================================================
// PENDING APPOINTMENTS ALERT
// =============================================================================

export interface PendingAppointmentsAlertProps {
  /** Pending appointments */
  appointments: Appointment[]
  /** Max to show */
  maxItems?: number
  /** Click handler */
  onAppointmentClick?: (appointment: Appointment) => void
  /** View all handler */
  onViewAll?: () => void
  /** Additional class names */
  className?: string
}

export function PendingAppointmentsAlert({
  appointments,
  maxItems = 3,
  onAppointmentClick,
  onViewAll,
  className,
}: PendingAppointmentsAlertProps) {
  if (appointments.length === 0) return null

  const displayed = appointments.slice(0, maxItems)
  const hasMore = appointments.length > maxItems

  return (
    <Card className={cn("border-amber-200 dark:border-amber-800", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600" />
            Pending Confirmation
            <Badge variant="secondary">{appointments.length}</Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {displayed.map((appointment, index) => (
            <motion.div
              key={appointment.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "flex items-center gap-3 p-2 rounded-md bg-amber-50 dark:bg-amber-950/30",
                onAppointmentClick && "cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-950/50"
              )}
              onClick={() => onAppointmentClick?.(appointment)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {appointment.customer_name}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(appointment.start_time).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                  <span>•</span>
                  {new Date(appointment.start_time).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          ))}
        </div>

        {hasMore && onViewAll && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3"
            onClick={onViewAll}
          >
            View All {appointments.length} Pending
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
