"use client"

/**
 * Booking Quick Actions
 * 
 * PHASE-UI-15: Booking Module UI Enhancement
 * Quick action grid for common booking tasks
 */

import * as React from "react"
import { motion } from "framer-motion"
import { 
  Calendar,
  Plus,
  Clock,
  Users,
  BarChart3,
  Settings,
  CalendarPlus,
  ClipboardList,
  UserPlus,
  type LucideIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// =============================================================================
// TYPES
// =============================================================================

export interface BookingAction {
  /** Unique ID */
  id: string
  /** Action label */
  label: string
  /** Action description */
  description?: string
  /** Icon */
  icon: LucideIcon
  /** Variant for styling */
  variant?: 'default' | 'primary' | 'success' | 'warning'
  /** Click handler */
  onClick?: () => void
  /** Disabled state */
  disabled?: boolean
}

export interface BookingQuickActionsProps {
  /** Actions to display */
  actions: BookingAction[]
  /** Number of columns */
  columns?: 2 | 3 | 4
  /** Show as card */
  asCard?: boolean
  /** Card title */
  title?: string
  /** Additional class names */
  className?: string
}

// =============================================================================
// VARIANT CONFIG
// =============================================================================

const variantConfig: Record<string, { bg: string; hover: string; icon: string }> = {
  default: {
    bg: 'bg-muted/50',
    hover: 'hover:bg-muted',
    icon: 'text-muted-foreground',
  },
  primary: {
    bg: 'bg-primary/10',
    hover: 'hover:bg-primary/20',
    icon: 'text-primary',
  },
  success: {
    bg: 'bg-green-500/10',
    hover: 'hover:bg-green-500/20',
    icon: 'text-green-600 dark:text-green-400',
  },
  warning: {
    bg: 'bg-amber-500/10',
    hover: 'hover:bg-amber-500/20',
    icon: 'text-amber-600 dark:text-amber-400',
  },
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function BookingQuickActions({
  actions,
  columns = 2,
  asCard = true,
  title = "Quick Actions",
  className,
}: BookingQuickActionsProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  }

  const content = (
    <div className={cn("grid gap-3", gridCols[columns])}>
      {actions.map((action, index) => {
        const config = variantConfig[action.variant || 'default']
        const Icon = action.icon
        
        return (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: index * 0.03 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={action.onClick}
            disabled={action.disabled}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-lg transition-colors text-center",
              config.bg,
              config.hover,
              action.disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className={cn("p-2 rounded-lg", config.bg)}>
              <Icon className={cn("h-5 w-5", config.icon)} />
            </div>
            <div>
              <p className="text-sm font-medium">{action.label}</p>
              {action.description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {action.description}
                </p>
              )}
            </div>
          </motion.button>
        )
      })}
    </div>
  )

  if (!asCard) {
    return <div className={className}>{content}</div>
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  )
}

// =============================================================================
// DEFAULT ACTIONS
// =============================================================================

export function getDefaultBookingActions({
  onNewAppointment,
  onViewCalendar,
  onManageServices,
  onManageStaff,
  onViewReports,
  onSettings,
}: {
  onNewAppointment?: () => void
  onViewCalendar?: () => void
  onManageServices?: () => void
  onManageStaff?: () => void
  onViewReports?: () => void
  onSettings?: () => void
}): BookingAction[] {
  return [
    {
      id: 'new-appointment',
      label: 'New Appointment',
      description: 'Book a new appointment',
      icon: CalendarPlus,
      variant: 'primary',
      onClick: onNewAppointment,
    },
    {
      id: 'view-calendar',
      label: 'View Calendar',
      description: 'See all bookings',
      icon: Calendar,
      onClick: onViewCalendar,
    },
    {
      id: 'manage-services',
      label: 'Services',
      description: 'Manage service offerings',
      icon: ClipboardList,
      onClick: onManageServices,
    },
    {
      id: 'manage-staff',
      label: 'Staff',
      description: 'Manage staff members',
      icon: UserPlus,
      onClick: onManageStaff,
    },
    {
      id: 'view-reports',
      label: 'Reports',
      description: 'View booking analytics',
      icon: BarChart3,
      variant: 'success',
      onClick: onViewReports,
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'Configure booking settings',
      icon: Settings,
      onClick: onSettings,
    },
  ]
}

// =============================================================================
// HORIZONTAL ACTIONS (Alternative Layout)
// =============================================================================

export interface BookingActionBarProps {
  /** Actions to display */
  actions: BookingAction[]
  /** Additional class names */
  className?: string
}

export function BookingActionBar({
  actions,
  className,
}: BookingActionBarProps) {
  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {actions.map((action) => {
        const Icon = action.icon
        const isPrimary = action.variant === 'primary'
        
        return (
          <Button
            key={action.id}
            variant={isPrimary ? 'default' : 'outline'}
            size="sm"
            onClick={action.onClick}
            disabled={action.disabled}
            className="gap-2"
          >
            <Icon className="h-4 w-4" />
            {action.label}
          </Button>
        )
      })}
    </div>
  )
}

// =============================================================================
// STATS-BASED ACTIONS
// =============================================================================

export interface BookingStatAction {
  /** Unique ID */
  id: string
  /** Action label */
  label: string
  /** Stat value */
  value: number | string
  /** Icon */
  icon: LucideIcon
  /** Color variant */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  /** Click handler */
  onClick?: () => void
}

export interface BookingStatActionsProps {
  /** Stats to display */
  stats: BookingStatAction[]
  /** Additional class names */
  className?: string
}

const statVariantConfig: Record<string, string> = {
  default: 'bg-muted/50 text-muted-foreground',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-green-500/10 text-green-600 dark:text-green-400',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  danger: 'bg-red-500/10 text-red-600 dark:text-red-400',
}

export function BookingStatActions({
  stats,
  className,
}: BookingStatActionsProps) {
  return (
    <div className={cn("flex items-center gap-3 flex-wrap", className)}>
      {stats.map((stat, index) => {
        const Icon = stat.icon
        const config = statVariantConfig[stat.variant || 'default']
        
        return (
          <motion.button
            key={stat.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            whileHover={{ scale: 1.02 }}
            onClick={stat.onClick}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
              config,
              stat.onClick && "cursor-pointer hover:opacity-80"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="font-semibold">{stat.value}</span>
            <span className="text-sm">{stat.label}</span>
          </motion.button>
        )
      })}
    </div>
  )
}
