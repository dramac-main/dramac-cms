/**
 * Quote Timeline Component
 * 
 * Phase ECOM-11B: Quote UI Components
 * 
 * Displays activity history for a quote
 */
'use client'

import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { 
  FileEdit, 
  Send, 
  Eye, 
  CircleCheck, 
  CircleX, 
  AlertTriangle,
  ArrowRightCircle,
  Ban,
  MessageSquare,
  Bell,
  Plus,
  Minus,
  RefreshCw,
  Settings,
  Copy
} from 'lucide-react'
import type { QuoteActivity, QuoteActivityType } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface QuoteTimelineProps {
  activities: QuoteActivity[]
  className?: string
}

interface ActivityConfig {
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
}

// ============================================================================
// ACTIVITY CONFIG
// ============================================================================

const activityConfig: Record<QuoteActivityType, ActivityConfig> = {
  created: {
    icon: FileEdit,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30'
  },
  updated: {
    icon: RefreshCw,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800'
  },
  sent: {
    icon: Send,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30'
  },
  viewed: {
    icon: Eye,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30'
  },
  accepted: {
    icon: CircleCheck,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30'
  },
  rejected: {
    icon: CircleX,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30'
  },
  expired: {
    icon: AlertTriangle,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30'
  },
  converted: {
    icon: ArrowRightCircle,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30'
  },
  cancelled: {
    icon: Ban,
    color: 'text-gray-500 dark:text-gray-500',
    bgColor: 'bg-gray-100 dark:bg-gray-800'
  },
  note_added: {
    icon: MessageSquare,
    color: 'text-sky-600 dark:text-sky-400',
    bgColor: 'bg-sky-100 dark:bg-sky-900/30'
  },
  reminder_sent: {
    icon: Bell,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30'
  },
  item_added: {
    icon: Plus,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30'
  },
  item_removed: {
    icon: Minus,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30'
  },
  item_updated: {
    icon: Settings,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800'
  },
  status_changed: {
    icon: RefreshCw,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30'
  },
  resent: {
    icon: Send,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30'
  },
  duplicated: {
    icon: Copy,
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-100 dark:bg-violet-900/30'
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuoteTimeline({ activities, className }: QuoteTimelineProps) {
  if (!activities || activities.length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        No activity recorded yet
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
      
      {/* Activity items */}
      <div className="space-y-4">
        {activities.map((activity) => {
          const config = activityConfig[activity.activity_type] || activityConfig.updated
          const Icon = config.icon
          
          return (
            <div key={activity.id} className="relative flex gap-4 pl-10">
              {/* Icon circle */}
              <div 
                className={cn(
                  'absolute left-0 flex h-8 w-8 items-center justify-center rounded-full',
                  config.bgColor
                )}
              >
                <Icon className={cn('h-4 w-4', config.color)} />
              </div>
              
              {/* Content */}
              <div className="flex-1 pt-0.5">
                <p className="text-sm font-medium">{activity.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(activity.created_at), 'MMM d, yyyy h:mm a')}
                  </span>
                  {activity.performed_by_name && (
                    <>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        by {activity.performed_by_name}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
