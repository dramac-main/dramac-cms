"use client"

/**
 * Service Card
 * 
 * PHASE-UI-15: Booking Module UI Enhancement
 * Display card for booking services
 */

import * as React from "react"
import { motion } from "framer-motion"
import { 
  Clock,
  DollarSign,
  Users,
  Calendar,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Zap,
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
import type { Service, Staff } from '../../types/booking-types'

import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'
// =============================================================================
// TYPES
// =============================================================================

export interface ServiceCardProps {
  /** Service data */
  service: Service
  /** Card variant */
  variant?: 'grid' | 'list'
  /** Currency code */
  currency?: string
  /** Number of bookings */
  bookingCount?: number
  /** Assigned staff */
  assignedStaff?: Staff[]
  /** Click handler */
  onClick?: () => void
  /** View action */
  onView?: () => void
  /** Edit action */
  onEdit?: () => void
  /** Delete action */
  onDelete?: () => void
  /** Toggle active state */
  onToggleActive?: () => void
  /** Animation delay */
  animationDelay?: number
  /** Additional class names */
  className?: string
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price)
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

export function ServiceCard({
  service,
  variant = 'grid',
  currency = DEFAULT_CURRENCY,
  bookingCount = 0,
  assignedStaff = [],
  onClick,
  onView,
  onEdit,
  onDelete,
  onToggleActive,
  animationDelay = 0,
  className,
}: ServiceCardProps) {
  const totalDuration = service.duration_minutes + 
    service.buffer_before_minutes + 
    service.buffer_after_minutes

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
            !service.is_active && "opacity-60",
            className
          )}
          onClick={onClick}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {/* Color indicator */}
              <div 
                className="w-1 h-12 rounded-full flex-shrink-0"
                style={{ backgroundColor: service.color || '#6366f1' }}
              />

              {/* Service image or color block */}
              <div className="flex-shrink-0">
                {service.image_url ? (
                  <img
                    src={service.image_url}
                    alt={service.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: service.color || '#6366f1' }}
                  >
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>

              {/* Main info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{service.name}</h3>
                  {!service.is_active && (
                    <Badge variant="secondary" className="text-xs">Inactive</Badge>
                  )}
                  {service.category && (
                    <Badge variant="outline" className="text-xs">{service.category}</Badge>
                  )}
                </div>
                {service.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                    {service.description}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{formatDuration(service.duration_minutes)}</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>{formatPrice(service.price, currency)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{bookingCount} bookings</span>
                </div>
              </div>

              {/* Staff avatars */}
              {assignedStaff.length > 0 && (
                <div className="flex -space-x-2">
                  {assignedStaff.slice(0, 3).map((staff) => (
                    <Avatar key={staff.id} className="h-8 w-8 border-2 border-background">
                      <AvatarImage src={staff.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(staff.name)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {assignedStaff.length > 3 && (
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted border-2 border-background text-xs font-medium">
                      +{assignedStaff.length - 3}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              {(onView || onEdit || onDelete || onToggleActive) && (
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
                        View
                      </DropdownMenuItem>
                    )}
                    {onEdit && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {onToggleActive && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleActive(); }}>
                        {service.is_active ? (
                          <>
                            <ToggleLeft className="h-4 w-4 mr-2" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <ToggleRight className="h-4 w-4 mr-2" />
                            Activate
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
          !service.is_active && "opacity-60",
          className
        )}
        onClick={onClick}
      >
        {/* Service image or color header */}
        <div 
          className="h-24 relative"
          style={{ backgroundColor: service.color || '#6366f1' }}
        >
          {service.image_url ? (
            <img
              src={service.image_url}
              alt={service.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="h-10 w-10 text-white/80" />
            </div>
          )}
          
          {/* Status badges */}
          <div className="absolute top-2 left-2 flex gap-1">
            {!service.is_active && (
              <Badge variant="secondary" className="text-xs bg-background/80">
                Inactive
              </Badge>
            )}
            {service.category && (
              <Badge variant="outline" className="text-xs bg-background/80">
                {service.category}
              </Badge>
            )}
          </div>

          {/* Actions menu */}
          {(onView || onEdit || onDelete || onToggleActive) && (
            <div className="absolute top-2 right-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="secondary" size="icon" className="h-7 w-7 bg-background/80">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onView && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(); }}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </DropdownMenuItem>
                  )}
                  {onEdit && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onToggleActive && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleActive(); }}>
                      {service.is_active ? (
                        <>
                          <ToggleLeft className="h-4 w-4 mr-2" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <ToggleRight className="h-4 w-4 mr-2" />
                          Activate
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
            </div>
          )}
        </div>

        <CardContent className="p-4">
          {/* Name & Description */}
          <div className="mb-3">
            <h3 className="font-semibold truncate">{service.name}</h3>
            {service.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {service.description}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm mb-3">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{formatDuration(service.duration_minutes)}</span>
            </div>
            <div className="font-semibold text-primary">
              {formatPrice(service.price, currency)}
            </div>
          </div>

          {/* Footer info */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>{bookingCount} bookings</span>
            </div>
            
            {/* Capacity */}
            {service.max_attendees > 1 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>Max {service.max_attendees}</span>
              </div>
            )}

            {/* Assigned staff */}
            {assignedStaff.length > 0 && (
              <div className="flex -space-x-1.5">
                {assignedStaff.slice(0, 3).map((staff) => (
                  <Avatar key={staff.id} className="h-6 w-6 border border-background">
                    <AvatarImage src={staff.avatar_url || undefined} />
                    <AvatarFallback className="text-[10px]">
                      {getInitials(staff.name)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {assignedStaff.length > 3 && (
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted border border-background text-[10px] font-medium">
                    +{assignedStaff.length - 3}
                  </div>
                )}
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

export function ServiceCardSkeleton({ 
  variant = 'grid',
  className,
}: { 
  variant?: 'grid' | 'list'
  className?: string
}) {
  if (variant === 'list') {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-1 h-12 rounded-full bg-muted animate-pulse" />
            <div className="w-12 h-12 rounded-lg bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-3 w-48 bg-muted animate-pulse rounded" />
            </div>
            <div className="flex gap-6">
              <div className="h-4 w-16 bg-muted animate-pulse rounded" />
              <div className="h-4 w-16 bg-muted animate-pulse rounded" />
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="h-24 bg-muted animate-pulse" />
      <CardContent className="p-4">
        <div className="space-y-2 mb-3">
          <div className="h-4 w-28 bg-muted animate-pulse rounded" />
          <div className="h-3 w-full bg-muted animate-pulse rounded" />
        </div>
        <div className="flex justify-between mb-3">
          <div className="h-4 w-16 bg-muted animate-pulse rounded" />
          <div className="h-4 w-16 bg-muted animate-pulse rounded" />
        </div>
        <div className="pt-3 border-t">
          <div className="h-3 w-24 bg-muted animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
  )
}
