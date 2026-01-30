'use client'

/**
 * Social Quick Actions Component
 * 
 * PHASE-UI-11A: Social Media Dashboard UI Overhaul
 * Quick action cards for common social media tasks
 */

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  PenSquare,
  Calendar,
  Inbox,
  BarChart3,
  Users,
  Settings,
  Megaphone,
  CheckCircle,
  Clock,
  Sparkles,
  LucideIcon,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// =============================================================================
// TYPES
// =============================================================================

export interface QuickAction {
  id: string
  icon: LucideIcon
  label: string
  description?: string
  href?: string
  onClick?: () => void
  badge?: number
  badgeVariant?: 'default' | 'destructive' | 'outline' | 'secondary'
  color?: string
  bgColor?: string
  disabled?: boolean
}

export interface SocialQuickActionsProps {
  /** Actions to display */
  actions: QuickAction[]
  /** Loading state */
  isLoading?: boolean
  /** Columns on different breakpoints */
  columns?: 2 | 3 | 4
  /** Additional class names */
  className?: string
}

// =============================================================================
// DEFAULT ACTIONS
// =============================================================================

export function getDefaultSocialActions(callbacks: {
  onCreatePost: () => void
  onViewCalendar: () => void
  onViewInbox: () => void
  onViewAnalytics: () => void
  onViewAccounts: () => void
  onViewApprovals: () => void
  onViewCampaigns: () => void
  onViewSettings: () => void
  inboxCount?: number
  pendingApprovals?: number
  scheduledCount?: number
}): QuickAction[] {
  return [
    {
      id: 'create-post',
      icon: PenSquare,
      label: 'Create Post',
      description: 'Compose new content',
      onClick: callbacks.onCreatePost,
      color: '#8884d8',
      bgColor: 'rgba(136, 132, 216, 0.1)',
    },
    {
      id: 'calendar',
      icon: Calendar,
      label: 'Calendar',
      description: 'View scheduled posts',
      onClick: callbacks.onViewCalendar,
      badge: callbacks.scheduledCount,
      badgeVariant: 'secondary',
      color: '#00C49F',
      bgColor: 'rgba(0, 196, 159, 0.1)',
    },
    {
      id: 'inbox',
      icon: Inbox,
      label: 'Inbox',
      description: 'Messages & comments',
      onClick: callbacks.onViewInbox,
      badge: callbacks.inboxCount,
      badgeVariant: callbacks.inboxCount && callbacks.inboxCount > 0 ? 'default' : 'secondary',
      color: '#1877F2',
      bgColor: 'rgba(24, 119, 242, 0.1)',
    },
    {
      id: 'analytics',
      icon: BarChart3,
      label: 'Analytics',
      description: 'View performance',
      onClick: callbacks.onViewAnalytics,
      color: '#E4405F',
      bgColor: 'rgba(228, 64, 95, 0.1)',
    },
    {
      id: 'accounts',
      icon: Users,
      label: 'Accounts',
      description: 'Manage connections',
      onClick: callbacks.onViewAccounts,
      color: '#0A66C2',
      bgColor: 'rgba(10, 102, 194, 0.1)',
    },
    {
      id: 'approvals',
      icon: CheckCircle,
      label: 'Approvals',
      description: 'Pending review',
      onClick: callbacks.onViewApprovals,
      badge: callbacks.pendingApprovals,
      badgeVariant: callbacks.pendingApprovals && callbacks.pendingApprovals > 0 ? 'destructive' : 'secondary',
      color: '#ffc658',
      bgColor: 'rgba(255, 198, 88, 0.1)',
    },
    {
      id: 'campaigns',
      icon: Megaphone,
      label: 'Campaigns',
      description: 'Marketing campaigns',
      onClick: callbacks.onViewCampaigns,
      color: '#FF7300',
      bgColor: 'rgba(255, 115, 0, 0.1)',
    },
    {
      id: 'settings',
      icon: Settings,
      label: 'Settings',
      description: 'Module settings',
      onClick: callbacks.onViewSettings,
      color: '#6B7280',
      bgColor: 'rgba(107, 114, 128, 0.1)',
    },
  ]
}

// =============================================================================
// ACTION CARD COMPONENT
// =============================================================================

interface ActionCardProps {
  action: QuickAction
  index: number
}

function ActionCard({ action, index }: ActionCardProps) {
  const Icon = action.icon
  
  const handleClick = () => {
    if (action.disabled) return
    action.onClick?.()
  }

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      whileHover={{ scale: action.disabled ? 1 : 1.02 }}
      whileTap={{ scale: action.disabled ? 1 : 0.98 }}
    >
      <Card 
        className={cn(
          'cursor-pointer transition-all duration-200',
          'hover:shadow-md hover:border-primary/30',
          action.disabled && 'opacity-50 cursor-not-allowed'
        )}
        onClick={handleClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div 
              className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ 
                backgroundColor: action.bgColor || 'hsl(var(--muted))',
              }}
            >
              <Icon 
                className="h-5 w-5" 
                style={{ color: action.color || 'hsl(var(--primary))' }}
              />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">{action.label}</p>
                {action.badge !== undefined && action.badge > 0 && (
                  <Badge 
                    variant={action.badgeVariant || 'default'}
                    className="h-5 px-1.5 text-xs"
                  >
                    {action.badge}
                  </Badge>
                )}
              </div>
              {action.description && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {action.description}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  // If href is provided, wrap in link
  if (action.href && !action.disabled) {
    return (
      <a href={action.href} className="block">
        {content}
      </a>
    )
  }

  return content
}

// =============================================================================
// SKELETON
// =============================================================================

function ActionSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-muted animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            <div className="h-3 w-28 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function SocialQuickActions({
  actions,
  isLoading,
  columns = 4,
  className,
}: SocialQuickActionsProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
  }

  return (
    <div className={cn('grid gap-3', gridCols[columns], className)}>
      {isLoading
        ? Array.from({ length: actions.length || 4 }).map((_, i) => (
            <ActionSkeleton key={i} />
          ))
        : actions.map((action, index) => (
            <ActionCard key={action.id} action={action} index={index} />
          ))
      }
    </div>
  )
}

// =============================================================================
// COMPACT VARIANT
// =============================================================================

export interface SocialQuickActionsCompactProps {
  actions: QuickAction[]
  className?: string
}

export function SocialQuickActionsCompact({ actions, className }: SocialQuickActionsCompactProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {actions.slice(0, 6).map((action) => {
        const Icon = action.icon
        return (
          <motion.button
            key={action.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={action.onClick}
            disabled={action.disabled}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg border',
              'bg-background hover:bg-muted transition-colors',
              'text-sm font-medium',
              action.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Icon className="h-4 w-4" style={{ color: action.color }} />
            {action.label}
            {action.badge !== undefined && action.badge > 0 && (
              <Badge variant={action.badgeVariant || 'default'} className="h-5 px-1.5 text-xs">
                {action.badge}
              </Badge>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}

export default SocialQuickActions
