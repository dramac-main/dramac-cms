"use client"

/**
 * Staff Card
 * 
 * PHASE-UI-15: Booking Module UI Enhancement
 * Display card for booking staff members
 */

import * as React from "react"
import { motion } from "framer-motion"
import { 
  Clock,
  Calendar,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  Check,
  X,
  Star,
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
import type { Staff, Service } from '../../types/booking-types'

// =============================================================================
// TYPES
// =============================================================================

export interface StaffCardProps {
  /** Staff data */
  staff: Staff
  /** Card variant */
  variant?: 'grid' | 'list' | 'compact'
  /** Assigned services */
  assignedServices?: Service[]
  /** Upcoming appointments count */
  upcomingAppointments?: number
  /** Today's appointments count */
  todayAppointments?: number
  /** Click handler */
  onClick?: () => void
  /** View action */
  onView?: () => void
  /** Edit action */
  onEdit?: () => void
  /** Delete action */
  onDelete?: () => void
  /** Toggle accept bookings */
  onToggleBookings?: () => void
  /** Animation delay */
  animationDelay?: number
  /** Additional class names */
  className?: string
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatWorkingHours(workingHours?: Staff['working_hours']): string {
  if (!workingHours) return 'No schedule set'
  
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  const enabledDays = days.filter(day => workingHours[day]?.enabled)
  
  if (enabledDays.length === 0) return 'No working days'
  if (enabledDays.length === 7) return 'Every day'
  if (enabledDays.length === 5 && 
      enabledDays.includes('mon') && 
      enabledDays.includes('tue') && 
      enabledDays.includes('wed') && 
      enabledDays.includes('thu') && 
      enabledDays.includes('fri')) {
    return 'Mon - Fri'
  }
  
  return `${enabledDays.length} days/week`
}

function getTypicalHours(workingHours?: Staff['working_hours']): string | null {
  if (!workingHours) return null
  
  const firstDay = Object.values(workingHours).find(day => day?.enabled)
  if (!firstDay || !firstDay.start || !firstDay.end) return null
  
  return `${firstDay.start} - ${firstDay.end}`
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function StaffCard({
  staff,
  variant = 'grid',
  assignedServices = [],
  upcomingAppointments = 0,
  todayAppointments = 0,
  onClick,
  onView,
  onEdit,
  onDelete,
  onToggleBookings,
  animationDelay = 0,
  className,
}: StaffCardProps) {
  const typicalHours = getTypicalHours(staff.working_hours)

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: animationDelay }}
      >
        <div
          className={cn(
            "flex items-center gap-3 p-2 rounded-lg transition-colors",
            onClick && "cursor-pointer hover:bg-accent",
            !staff.is_active && "opacity-60",
            className
          )}
          onClick={onClick}
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={staff.avatar_url || undefined} />
            <AvatarFallback>{getInitials(staff.name)}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{staff.name}</p>
            <p className="text-xs text-muted-foreground">
              {todayAppointments > 0 ? `${todayAppointments} today` : 'No appointments today'}
            </p>
          </div>

          <div className="flex items-center gap-1">
            {staff.accept_bookings ? (
              <Badge variant="outline" className="text-xs bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200">
                Available
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                Unavailable
              </Badge>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  if (variant === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: animationDelay }}
      >
        <Card
          className={cn(
            "overflow-hidden transition-all duration-200",
            onClick && "cursor-pointer hover:shadow-md",
            !staff.is_active && "opacity-60",
            className
          )}
          onClick={onClick}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <Avatar className="h-12 w-12 flex-shrink-0">
                <AvatarImage src={staff.avatar_url || undefined} />
                <AvatarFallback className="text-lg">{getInitials(staff.name)}</AvatarFallback>
              </Avatar>

              {/* Main info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{staff.name}</h3>
                  {!staff.is_active && (
                    <Badge variant="secondary" className="text-xs">Inactive</Badge>
                  )}
                  {staff.accept_bookings ? (
                    <Badge variant="outline" className="text-xs bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200">
                      Accepting Bookings
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Not Accepting</Badge>
                  )}
                </div>
                {staff.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                    {staff.bio}
                  </p>
                )}
              </div>

              {/* Contact */}
              <div className="flex items-center gap-3 text-muted-foreground">
                {staff.email && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Mail className="h-4 w-4 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>{staff.email}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {staff.phone && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Phone className="h-4 w-4 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>{staff.phone}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{formatWorkingHours(staff.working_hours)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{upcomingAppointments} upcoming</span>
                </div>
              </div>

              {/* Services */}
              {assignedServices.length > 0 && (
                <div className="flex gap-1">
                  {assignedServices.slice(0, 3).map((service) => (
                    <div
                      key={service.id}
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: service.color || '#6366f1' }}
                      title={service.name}
                    />
                  ))}
                  {assignedServices.length > 3 && (
                    <span className="text-xs text-muted-foreground ml-1">
                      +{assignedServices.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Actions */}
              {(onView || onEdit || onDelete || onToggleBookings) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onView && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(); }}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Profile
                      </DropdownMenuItem>
                    )}
                    {onEdit && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {onToggleBookings && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleBookings(); }}>
                        {staff.accept_bookings ? (
                          <>
                            <X className="h-4 w-4 mr-2" />
                            Stop Accepting Bookings
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Start Accepting Bookings
                          </>
                        )}
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={(e) => { e.stopPropagation(); onDelete(); }}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // Grid variant
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: animationDelay }}
      whileHover={{ y: -4 }}
    >
      <Card
        className={cn(
          "overflow-hidden transition-all duration-200 h-full",
          onClick && "cursor-pointer hover:shadow-lg",
          !staff.is_active && "opacity-60",
          className
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          {/* Header with actions */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14">
                <AvatarImage src={staff.avatar_url || undefined} />
                <AvatarFallback className="text-lg">{getInitials(staff.name)}</AvatarFallback>
              </Avatar>
              
              <div>
                <h3 className="font-semibold">{staff.name}</h3>
                {staff.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {staff.bio}
                  </p>
                )}
              </div>
            </div>

            {(onView || onEdit || onDelete || onToggleBookings) && (
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
                      View Profile
                    </DropdownMenuItem>
                  )}
                  {onEdit && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onToggleBookings && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleBookings(); }}>
                      {staff.accept_bookings ? (
                        <>
                          <X className="h-4 w-4 mr-2" />
                          Stop Accepting Bookings
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Start Accepting Bookings
                        </>
                      )}
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 mb-4">
            {!staff.is_active ? (
              <Badge variant="secondary">Inactive</Badge>
            ) : staff.accept_bookings ? (
              <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200">
                <Check className="h-3 w-3 mr-1" />
                Accepting Bookings
              </Badge>
            ) : (
              <Badge variant="secondary">
                <X className="h-3 w-3 mr-1" />
                Not Accepting
              </Badge>
            )}
          </div>

          {/* Schedule */}
          <div className="space-y-2 text-sm mb-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span>{formatWorkingHours(staff.working_hours)}</span>
            </div>
            {typicalHours && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="w-4" />
                <span className="text-xs">{typicalHours}</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-1.5 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                <span className="font-medium">{todayAppointments}</span>
                <span className="text-muted-foreground"> today</span>
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {upcomingAppointments} upcoming
            </div>
          </div>

          {/* Services */}
          {assignedServices.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t">
              {assignedServices.slice(0, 4).map((service) => (
                <Badge
                  key={service.id}
                  variant="outline"
                  className="text-xs"
                  style={{ 
                    borderColor: service.color || '#6366f1',
                    color: service.color || '#6366f1',
                  }}
                >
                  {service.name}
                </Badge>
              ))}
              {assignedServices.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{assignedServices.length - 4} more
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// =============================================================================
// SKELETON
// =============================================================================

export function StaffCardSkeleton({ 
  variant = 'grid',
  className,
}: { 
  variant?: 'grid' | 'list' | 'compact'
  className?: string
}) {
  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-3 p-2", className)}>
        <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          <div className="h-3 w-16 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-5 w-16 bg-muted animate-pulse rounded-full" />
      </div>
    )
  }

  if (variant === 'list') {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-3 w-48 bg-muted animate-pulse rounded" />
            </div>
            <div className="flex gap-6">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </div>
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
            <div className="h-14 w-14 rounded-full bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-28 bg-muted animate-pulse rounded" />
              <div className="h-3 w-36 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
        <div className="h-6 w-32 bg-muted animate-pulse rounded-full mb-4" />
        <div className="space-y-2 mb-4">
          <div className="h-4 w-28 bg-muted animate-pulse rounded" />
        </div>
        <div className="pt-3 border-t flex justify-between">
          <div className="h-4 w-20 bg-muted animate-pulse rounded" />
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
  )
}
