/**
 * Activity Feed Widget
 * 
 * Phase ECOM-01: Dashboard Redesign
 * 
 * Displays recent activity in the store
 */
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Activity, 
  ShoppingCart, 
  Package, 
  Users, 
  Star,
  Percent,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ActivityItem } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface ActivityFeedProps {
  activities: ActivityItem[]
  maxHeight?: number
  isLoading?: boolean
}

// ============================================================================
// ACTIVITY TYPE CONFIG
// ============================================================================

const activityTypeConfig: Record<ActivityItem['type'], {
  icon: typeof ShoppingCart
  bgColor: string
  iconColor: string
}> = {
  order: { 
    icon: ShoppingCart, 
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400'
  },
  product: { 
    icon: Package, 
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400'
  },
  customer: { 
    icon: Users, 
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400'
  },
  review: { 
    icon: Star, 
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    iconColor: 'text-yellow-600 dark:text-yellow-400'
  },
  discount: { 
    icon: Percent, 
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    iconColor: 'text-orange-600 dark:text-orange-400'
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ActivityFeed({
  activities,
  maxHeight = 400,
  isLoading = false
}: ActivityFeedProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) {
      return 'Just now'
    } else if (diffMins < 60) {
      return `${diffMins}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else if (diffDays < 7) {
      return `${diffDays}d ago`
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" />
            Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-start gap-3">
                <div className="h-8 w-8 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" />
            Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
            <p className="text-xs text-muted-foreground mt-1">
              Store activity will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" />
          Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea style={{ height: maxHeight }}>
          <div className="px-6 pb-4 space-y-1">
            {activities.map((activity, index) => {
              const config = activityTypeConfig[activity.type]
              const Icon = config.icon

              return (
                <div 
                  key={activity.id}
                  className={cn(
                    'flex items-start gap-3 py-3',
                    index < activities.length - 1 && 'border-b'
                  )}
                >
                  <div className={cn(
                    'p-1.5 rounded-full flex-shrink-0',
                    config.bgColor
                  )}>
                    <Icon className={cn('h-4 w-4', config.iconColor)} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">
                      {activity.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
