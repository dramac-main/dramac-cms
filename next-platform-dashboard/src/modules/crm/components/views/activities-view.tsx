/**
 * Activities View
 * 
 * Phase EM-50: CRM Module - Enterprise Ready
 * 
 * Timeline and list view of CRM activities
 */
'use client'

import { useState, useMemo } from 'react'
import { useCRM } from '../../context/crm-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Plus, 
  Search,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  FileText,
  CheckCircle2,
  Clock,
  User,
  MoreHorizontal,
  Filter,
  LucideIcon,
} from 'lucide-react'
import { CreateActivityDialog } from '../dialogs/create-activity-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { Activity, ActivityType } from '../../types/crm-types'

// ============================================================================
// HELPERS
// ============================================================================

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDateTime(dateString)
}

const activityIcons: Record<ActivityType, LucideIcon> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  task: CheckCircle2,
  note: FileText,
  sms: MessageSquare,
  chat: MessageSquare
}

const activityColors: Record<ActivityType, string> = {
  call: 'text-blue-500 bg-blue-50 dark:bg-blue-950',
  email: 'text-purple-500 bg-purple-50 dark:bg-purple-950',
  meeting: 'text-orange-500 bg-orange-50 dark:bg-orange-950',
  task: 'text-green-500 bg-green-50 dark:bg-green-950',
  note: 'text-gray-500 bg-gray-50 dark:bg-gray-950',
  sms: 'text-pink-500 bg-pink-50 dark:bg-pink-950',
  chat: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950'
}

// ============================================================================
// ACTIVITY CARD
// ============================================================================

interface ActivityCardProps {
  activity: Activity
  onToggleComplete?: (id: string, completed: boolean) => void
}

function ActivityCard({ activity, onToggleComplete }: ActivityCardProps) {
  const Icon = activityIcons[activity.activity_type]
  const colorClass = activityColors[activity.activity_type]
  const isTask = activity.activity_type === 'task'
  const isOverdue = isTask && activity.task_due_date && new Date(activity.task_due_date) < new Date() && !activity.task_completed

  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      activity.task_completed && "opacity-60"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={cn(
            "p-2 rounded-lg flex-shrink-0",
            colorClass
          )}>
            <Icon className="h-4 w-4" />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {isTask && onToggleComplete && (
                  <Checkbox 
                    checked={activity.task_completed}
                    onCheckedChange={(checked) => onToggleComplete(activity.id, checked as boolean)}
                  />
                )}
                <div>
                  <div className={cn(
                    "font-medium",
                    activity.task_completed && "line-through text-muted-foreground"
                  )}>
                    {activity.subject || `${activity.activity_type.charAt(0).toUpperCase()}${activity.activity_type.slice(1)}`}
                  </div>
                  {activity.description && (
                    <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {activity.description}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                {isOverdue && (
                  <Badge variant="destructive" className="text-xs">
                    Overdue
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(activity.created_at)}
                </span>
              </div>
            </div>
            
            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
              {activity.contact && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {activity.contact.first_name} {activity.contact.last_name}
                </div>
              )}
              
              {activity.deal && (
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {activity.deal.name}
                </div>
              )}
              
              {isTask && activity.task_due_date && (
                <div className={cn(
                  "flex items-center gap-1",
                  isOverdue && "text-destructive"
                )}>
                  <Clock className="h-3 w-3" />
                  Due: {formatDateTime(activity.task_due_date)}
                </div>
              )}
              
              {activity.activity_type === 'call' && activity.call_duration_seconds && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {Math.floor(activity.call_duration_seconds / 60)}m {activity.call_duration_seconds % 60}s
                </div>
              )}
              
              {activity.outcome && (
                <Badge variant="outline" className="text-xs">
                  {activity.outcome}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ActivitiesView() {
  const { activities, editActivity, isLoading } = useCRM()
  
  // State
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showCompleted, setShowCompleted] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // Filtered activities
  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchesSearch = 
          activity.subject?.toLowerCase().includes(q) ||
          activity.description?.toLowerCase().includes(q) ||
          activity.contact?.first_name?.toLowerCase().includes(q) ||
          activity.contact?.last_name?.toLowerCase().includes(q)
        if (!matchesSearch) return false
      }
      
      // Type filter
      if (typeFilter !== 'all' && activity.activity_type !== typeFilter) {
        return false
      }
      
      // Completed filter
      if (!showCompleted && activity.activity_type === 'task' && activity.task_completed) {
        return false
      }
      
      return true
    })
  }, [activities, search, typeFilter, showCompleted])

  // Group by date
  const groupedActivities = useMemo(() => {
    const groups = new Map<string, Activity[]>()
    
    filteredActivities.forEach(activity => {
      const date = new Date(activity.created_at).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
      
      if (!groups.has(date)) {
        groups.set(date, [])
      }
      groups.get(date)!.push(activity)
    })
    
    return Array.from(groups.entries())
  }, [filteredActivities])

  // Toggle task completion
  const handleToggleComplete = async (id: string, completed: boolean) => {
    await editActivity(id, { 
      task_completed: completed,
      completed_at: completed ? new Date().toISOString() : null
    })
  }

  // Activity counts by type
  const activityCounts = useMemo(() => {
    const counts: Record<string, number> = { all: activities.length }
    activities.forEach(a => {
      counts[a.activity_type] = (counts[a.activity_type] || 0) + 1
    })
    return counts
  }, [activities])

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search activities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Type filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types ({activityCounts.all || 0})</SelectItem>
              <SelectItem value="call">Calls ({activityCounts.call || 0})</SelectItem>
              <SelectItem value="email">Emails ({activityCounts.email || 0})</SelectItem>
              <SelectItem value="meeting">Meetings ({activityCounts.meeting || 0})</SelectItem>
              <SelectItem value="task">Tasks ({activityCounts.task || 0})</SelectItem>
              <SelectItem value="note">Notes ({activityCounts.note || 0})</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Show completed toggle */}
          <div className="flex items-center gap-2">
            <Checkbox 
              id="showCompleted"
              checked={showCompleted}
              onCheckedChange={(checked) => setShowCompleted(checked as boolean)}
            />
            <label htmlFor="showCompleted" className="text-sm text-muted-foreground">
              Show completed
            </label>
          </div>
        </div>
        
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Log Activity
        </Button>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-6 gap-4">
        {(['call', 'email', 'meeting', 'task', 'note'] as ActivityType[]).map(type => {
          const Icon = activityIcons[type]
          const colorClass = activityColors[type]
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(typeFilter === type ? 'all' : type)}
              className={cn(
                "p-3 rounded-lg border transition-all text-left",
                typeFilter === type ? "border-primary bg-primary/5" : "hover:bg-muted/50"
              )}
            >
              <div className="flex items-center gap-2">
                <div className={cn("p-1.5 rounded", colorClass)}>
                  <Icon className="h-3 w-3" />
                </div>
                <div>
                  <div className="text-lg font-semibold">{activityCounts[type] || 0}</div>
                  <div className="text-xs text-muted-foreground capitalize">{type}s</div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Activity Timeline */}
      <div className="space-y-6">
        {groupedActivities.map(([date, dateActivities]) => (
          <div key={date}>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 sticky top-0 bg-background py-2">
              {date}
            </h3>
            <div className="space-y-3">
              {dateActivities.map(activity => (
                <ActivityCard 
                  key={activity.id} 
                  activity={activity}
                  onToggleComplete={handleToggleComplete}
                />
              ))}
            </div>
          </div>
        ))}
        
        {filteredActivities.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground">
              {search || typeFilter !== 'all'
                ? 'No activities match your filters'
                : 'No activities yet. Log your first activity!'}
            </div>
            {!search && typeFilter === 'all' && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Log Activity
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <CreateActivityDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  )
}

export default ActivitiesView
