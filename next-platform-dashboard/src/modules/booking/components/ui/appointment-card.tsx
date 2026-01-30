"use client"

/**
 * Appointment Card
 * 
 * PHASE-UI-15: Booking Module UI Enhancement
 * Display card for booking appointments
 */

import * as React from "react"
import { motion } from "framer-motion"
import { 
  Calendar,
  Clock,
  User,
  UserCircle,
  Mail,
  Phone,
  MoreHorizontal,
  Eye,
  Check,
  X,
  RefreshCw,
  CreditCard,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Appointment, AppointmentStatus, PaymentStatus } from '../../types/booking-types'

// =============================================================================
// TYPES
// =============================================================================

export interface AppointmentCardProps {
  /** Appointment data */
  appointment: Appointment
  /** Card variant */
  variant?: 'default' | 'compact'
  /** Click handler */
  onClick?: () => void
  /** View action */
  onView?: () => void
  /** Confirm action */
  onConfirm?: () => void
  /** Cancel action */
  onCancel?: () => void
  /** Reschedule action */
  onReschedule?: () => void
  /** Animation delay */
  animationDelay?: number
  /** Additional class names */
  className?: string
}

// =============================================================================
// STATUS CONFIG
// =============================================================================

const statusConfig: Record<AppointmentStatus, {
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  className: string
}> = {
  pending: {
    label: 'Pending',
    variant: 'outline',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border-amber-300',
  },
  confirmed: {
    label: 'Confirmed',
    variant: 'default',
    className: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200 border-green-300',
  },
  completed: {
    label: 'Completed',
    variant: 'secondary',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border-blue-300',
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'destructive',
    className: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200 border-red-300',
  },
  no_show: {
    label: 'No Show',
    variant: 'destructive',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-300',
  },
}

const paymentStatusConfig: Record<PaymentStatus, {
  label: string
  icon: React.ElementType
  className: string
}> = {
  pending: {
    label: 'Payment Pending',
    icon: Clock,
    className: 'text-amber-600',
  },
  paid: {
    label: 'Paid',
    icon: Check,
    className: 'text-green-600',
  },
  refunded: {
    label: 'Refunded',
    icon: RefreshCw,
    className: 'text-blue-600',
  },
  failed: {
    label: 'Payment Failed',
    icon: AlertCircle,
    className: 'text-red-600',
  },
  not_required: {
    label: 'No Payment Required',
    icon: CreditCard,
    className: 'text-muted-foreground',
  },
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  })
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDuration(start: string, end: string): string {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const diffMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000)
  
  if (diffMinutes < 60) return `${diffMinutes} min`
  const hours = Math.floor(diffMinutes / 60)
  const mins = diffMinutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AppointmentCard({
  appointment,
  variant = 'default',
  onClick,
  onView,
  onConfirm,
  onCancel,
  onReschedule,
  animationDelay = 0,
  className,
}: AppointmentCardProps) {
  const statusInfo = statusConfig[appointment.status]
  const paymentInfo = paymentStatusConfig[appointment.payment_status]
  const PaymentIcon = paymentInfo.icon

  const isActionable = appointment.status === 'pending' || appointment.status === 'confirmed'

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: animationDelay }}
      >
        <Card
          className={cn(
            "overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer",
            className
          )}
          onClick={onClick}
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex-shrink-0">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(appointment.customer_name)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">
                    {appointment.customer_name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(appointment.start_time)}</span>
                    {appointment.service && (
                      <>
                        <span>•</span>
                        <span className="truncate">{appointment.service.name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <Badge 
                variant={statusInfo.variant} 
                className={cn("text-xs flex-shrink-0", statusInfo.className)}
              >
                {statusInfo.label}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: animationDelay }}
    >
      <Card
        className={cn(
          "overflow-hidden transition-all duration-200",
          onClick && "cursor-pointer hover:shadow-md",
          className
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {getInitials(appointment.customer_name)}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <p className="font-semibold">{appointment.customer_name}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {appointment.customer_email && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Mail className="h-3 w-3" />
                        </TooltipTrigger>
                        <TooltipContent>{appointment.customer_email}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {appointment.customer_phone && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Phone className="h-3 w-3" />
                        </TooltipTrigger>
                        <TooltipContent>{appointment.customer_phone}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge 
                variant={statusInfo.variant} 
                className={statusInfo.className}
              >
                {statusInfo.label}
              </Badge>
              
              {(onView || onConfirm || onCancel || onReschedule) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onView && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(); }}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                    )}
                    {onConfirm && appointment.status === 'pending' && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onConfirm(); }}>
                        <Check className="h-4 w-4 mr-2" />
                        Confirm
                      </DropdownMenuItem>
                    )}
                    {onReschedule && isActionable && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onReschedule(); }}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reschedule
                      </DropdownMenuItem>
                    )}
                    {onCancel && isActionable && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={(e) => { e.stopPropagation(); onCancel(); }}
                          className="text-destructive"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Service & Time Info */}
          <div className="space-y-3">
            {/* Service */}
            {appointment.service && (
              <div className="flex items-center gap-2 text-sm">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: appointment.service.color || '#6366f1' }}
                />
                <span className="font-medium">{appointment.service.name}</span>
              </div>
            )}

            {/* Date & Time */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(appointment.start_time)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>
                  {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                </span>
                <span className="text-xs">
                  ({formatDuration(appointment.start_time, appointment.end_time)})
                </span>
              </div>
            </div>

            {/* Staff */}
            {appointment.staff && (
              <div className="flex items-center gap-2 text-sm">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={appointment.staff.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(appointment.staff.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-muted-foreground">with</span>
                <span className="font-medium">{appointment.staff.name}</span>
              </div>
            )}

            {/* Payment Status */}
            {appointment.payment_status !== 'not_required' && (
              <div className="flex items-center gap-2 text-sm">
                <PaymentIcon className={cn("h-4 w-4", paymentInfo.className)} />
                <span className={paymentInfo.className}>{paymentInfo.label}</span>
                {appointment.payment_amount && appointment.payment_status === 'paid' && (
                  <span className="font-medium text-foreground">
                    (${appointment.payment_amount.toFixed(2)})
                  </span>
                )}
              </div>
            )}

            {/* Customer Notes */}
            {appointment.customer_notes && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  "{appointment.customer_notes}"
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// =============================================================================
// SKELETON
// =============================================================================

export function AppointmentCardSkeleton({ 
  variant = 'default',
  className,
}: { 
  variant?: 'default' | 'compact'
  className?: string
}) {
  if (variant === 'compact') {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-3 w-32 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-5 w-16 bg-muted animate-pulse rounded-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-4 w-28 bg-muted animate-pulse rounded" />
              <div className="h-3 w-20 bg-muted animate-pulse rounded" />
            </div>
          </div>
          <div className="h-6 w-20 bg-muted animate-pulse rounded-full" />
        </div>
        <div className="space-y-3">
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-36 bg-muted animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
  )
}
