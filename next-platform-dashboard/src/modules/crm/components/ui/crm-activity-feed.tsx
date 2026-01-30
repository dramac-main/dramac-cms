/**
 * CRM Activity Feed Component
 * 
 * PHASE-UI-10A: CRM Module UI Overhaul
 * 
 * Enhanced activity timeline with grouping, filtering, and relative timestamps.
 */
'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Phone, 
  Mail, 
  Calendar, 
  FileText, 
  MessageSquare,
  Video,
  CheckCircle2,
  Clock,
  User,
  Building2,
  TrendingUp,
  Plus,
  Filter,
  ChevronDown,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Activity, ActivityType } from '../../types/crm-types'

// =============================================================================
// TYPES
// =============================================================================

export interface CRMActivityFeedProps {
  activities: Activity[]
  loading?: boolean
  onActivityClick?: (activity: Activity) => void
  onAddActivity?: () => void
  onViewAll?: () => void
  maxHeight?: number
  showFilters?: boolean
  showHeader?: boolean
  title?: string
  className?: string
}

// =============================================================================
// ACTIVITY CONFIG
// =============================================================================

interface ActivityConfig {
  icon: LucideIcon
  color: string
  bgColor: string
  label: string
}

const activityConfig: Record<ActivityType, ActivityConfig> = {
  call: {
    icon: Phone,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    label: 'Call',
  },
  email: {
    icon: Mail,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    label: 'Email',
  },
  meeting: {
    icon: Video,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    label: 'Meeting',
  },
  task: {
    icon: CheckCircle2,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    label: 'Task',
  },
  note: {
    icon: FileText,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    label: 'Note',
  },
  sms: {
    icon: MessageSquare,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    label: 'SMS',
  },
  chat: {
    icon: MessageSquare,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    label: 'Chat',
  },
}

// =============================================================================
// HELPERS
// =============================================================================

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function groupActivitiesByDate(activities: Activity[]): Map<string, Activity[]> {
  const groups = new Map<string, Activity[]>()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  activities.forEach(activity => {
    const activityDate = new Date(activity.created_at)
    activityDate.setHours(0, 0, 0, 0)

    let groupKey: string
    if (activityDate.getTime() === today.getTime()) {
      groupKey = 'Today'
    } else if (activityDate.getTime() === yesterday.getTime()) {
      groupKey = 'Yesterday'
    } else if (activityDate >= weekAgo) {
      groupKey = 'This Week'
    } else {
      groupKey = activityDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }

    const existing = groups.get(groupKey) || []
    groups.set(groupKey, [...existing, activity])
  })

  return groups
}

// =============================================================================
// ACTIVITY ITEM
// =============================================================================

interface ActivityItemProps {
  activity: Activity
  onClick?: () => void
  isLast?: boolean
}

function ActivityItem({ activity, onClick, isLast }: ActivityItemProps) {
  const config = activityConfig[activity.activity_type]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative flex gap-4 pb-4"
    >
      {/* Timeline Line */}
      {!isLast && (
        <div className="absolute left-[18px] top-10 bottom-0 w-px bg-border" />
      )}

      {/* Icon */}
      <div className={cn(
        "relative z-10 flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center",
        config.bgColor
      )}>
        <Icon className={cn("h-4 w-4", config.color)} />
      </div>

      {/* Content */}
      <div 
        className={cn(
          "flex-1 min-w-0 group",
          onClick && "cursor-pointer"
        )}
        onClick={onClick}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs font-normal">
                {config.label}
              </Badge>
              {activity.task_completed && (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Completed
                </Badge>
              )}
              {activity.task_priority === 'urgent' && (
                <Badge variant="destructive" className="text-xs">
                  Urgent
                </Badge>
              )}
            </div>
            
            {/* Subject/Title */}
            {activity.subject && (
              <p className="font-medium mt-1 group-hover:text-primary transition-colors">
                {activity.subject}
              </p>
            )}
            
            {/* Description */}
            {activity.description && (
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                {activity.description}
              </p>
            )}

            {/* Associated Entities */}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              {activity.contact && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {activity.contact.first_name} {activity.contact.last_name}
                </span>
              )}
              {activity.company && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {activity.company.name}
                </span>
              )}
              {activity.deal && (
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {activity.deal.name}
                </span>
              )}
            </div>

            {/* Call Duration */}
            {activity.call_duration_seconds && (
              <p className="text-xs text-muted-foreground mt-1">
                Duration: {Math.floor(activity.call_duration_seconds / 60)}m {activity.call_duration_seconds % 60}s
              </p>
            )}
          </div>

          {/* Timestamp */}
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatRelativeTime(activity.created_at)}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// =============================================================================
// ACTIVITY GROUP
// =============================================================================

interface ActivityGroupProps {
  title: string
  activities: Activity[]
  onActivityClick?: (activity: Activity) => void
  defaultExpanded?: boolean
}

function ActivityGroup({ title, activities, onActivityClick, defaultExpanded = true }: ActivityGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-3"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        {title}
        <Badge variant="secondary" className="text-xs">{activities.length}</Badge>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pl-2"
          >
            {activities.map((activity, index) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                onClick={onActivityClick ? () => onActivityClick(activity) : undefined}
                isLast={index === activities.length - 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// =============================================================================
// SKELETON
// =============================================================================

function ActivityFeedSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-16 bg-muted animate-pulse rounded" />
            <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
            <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function CRMActivityFeed({
  activities,
  loading = false,
  onActivityClick,
  onAddActivity,
  onViewAll,
  maxHeight = 400,
  showFilters = true,
  showHeader = true,
  title = 'Activity Feed',
  className,
}: CRMActivityFeedProps) {
  const [typeFilter, setTypeFilter] = useState<ActivityType | 'all'>('all')

  // Filter activities
  const filteredActivities = useMemo(() => {
    if (typeFilter === 'all') return activities
    return activities.filter(a => a.activity_type === typeFilter)
  }, [activities, typeFilter])

  // Group activities by date
  const groupedActivities = useMemo(() => {
    return groupActivitiesByDate(filteredActivities)
  }, [filteredActivities])

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{title}</CardTitle>
            <div className="flex items-center gap-2">
              {showFilters && (
                <Select 
                  value={typeFilter} 
                  onValueChange={(v) => setTypeFilter(v as ActivityType | 'all')}
                >
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <Filter className="h-3 w-3 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {Object.entries(activityConfig).map(([type, config]) => (
                      <SelectItem key={type} value={type}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {onAddActivity && (
                <Button size="sm" variant="outline" onClick={onAddActivity}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className={cn(!showHeader && "pt-6")}>
        {loading ? (
          <ActivityFeedSkeleton />
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {typeFilter !== 'all' 
                ? `No ${activityConfig[typeFilter].label.toLowerCase()} activities yet`
                : 'No activities yet'
              }
            </p>
            {onAddActivity && (
              <Button size="sm" variant="outline" className="mt-3" onClick={onAddActivity}>
                <Plus className="h-4 w-4 mr-1" />
                Log Activity
              </Button>
            )}
          </div>
        ) : (
          <ScrollArea style={{ maxHeight }} className="pr-4">
            {Array.from(groupedActivities.entries()).map(([group, groupActivities], index) => (
              <ActivityGroup
                key={group}
                title={group}
                activities={groupActivities}
                onActivityClick={onActivityClick}
                defaultExpanded={index === 0}
              />
            ))}
          </ScrollArea>
        )}

        {onViewAll && filteredActivities.length > 0 && (
          <Button 
            variant="ghost" 
            className="w-full mt-4"
            onClick={onViewAll}
          >
            View All Activities
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default CRMActivityFeed
