/**
 * Contact Timeline Component
 * 
 * CRM Enhancement: 360° Contact Timeline
 * Unified activity feed showing all interactions with a contact.
 * Industry-leader pattern: HubSpot Activity Timeline, Salesforce Activity History
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Phone, Mail, Calendar, FileText, MessageSquare, DollarSign, 
  Target, Users, Clock, Activity, StickyNote, Zap, ArrowUp,
  ChevronDown,
} from 'lucide-react'
import { getContactTimeline } from '../../actions/bulk-actions'
import type { TimelineEvent, TimelineEventType } from '../../types/crm-types'
import { cn } from '@/lib/utils'

// ============================================================================
// TIMELINE EVENT COMPONENT
// ============================================================================

function getEventIcon(type: TimelineEventType) {
  switch (type) {
    case 'activity_call': return <Phone className="h-3.5 w-3.5" />
    case 'activity_email': return <Mail className="h-3.5 w-3.5" />
    case 'activity_meeting': return <Calendar className="h-3.5 w-3.5" />
    case 'activity_task': return <Activity className="h-3.5 w-3.5" />
    case 'activity_note': return <StickyNote className="h-3.5 w-3.5" />
    case 'deal_created': return <DollarSign className="h-3.5 w-3.5" />
    case 'deal_won': return <ArrowUp className="h-3.5 w-3.5" />
    case 'deal_lost': return <DollarSign className="h-3.5 w-3.5" />
    case 'deal_stage_changed': return <Target className="h-3.5 w-3.5" />
    case 'email_sent': return <Mail className="h-3.5 w-3.5" />
    case 'email_received': return <Mail className="h-3.5 w-3.5" />
    case 'form_submitted': return <FileText className="h-3.5 w-3.5" />
    case 'note_added': return <MessageSquare className="h-3.5 w-3.5" />
    case 'status_changed': return <Zap className="h-3.5 w-3.5" />
    default: return <Clock className="h-3.5 w-3.5" />
  }
}

function getEventColor(type: TimelineEventType) {
  if (type.startsWith('activity_')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
  if (type.startsWith('deal_')) return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
  if (type.startsWith('email_')) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
  if (type === 'form_submitted') return 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300'
  if (type === 'note_added') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300'
  return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
}

function TimelineEventItem({ event }: { event: TimelineEvent }) {
  const [expanded, setExpanded] = useState(false)

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d ago`
    return new Date(date).toLocaleDateString()
  }

  return (
    <div className="flex gap-3 group">
      {/* Timeline Line & Icon */}
      <div className="flex flex-col items-center">
        <div className={cn('p-1.5 rounded-full', getEventColor(event.type))}>
          {getEventIcon(event.type)}
        </div>
        <div className="w-px flex-1 bg-border group-last:bg-transparent" />
      </div>

      {/* Content */}
      <div className="pb-6 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium">{event.title}</p>
            {event.description && !expanded && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[300px]">
                {event.description}
              </p>
            )}
            {event.description && expanded && (
              <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">
                {event.description}
              </p>
            )}
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {timeAgo(event.timestamp)}
          </span>
        </div>

        {/* Metadata */}
        {event.metadata && Object.keys(event.metadata).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {Object.entries(event.metadata).slice(0, expanded ? undefined : 3).map(([key, val]) => (
              <Badge key={key} variant="outline" className="text-[10px] font-normal">
                {key}: {String(val)}
              </Badge>
            ))}
          </div>
        )}

        {/* Expand */}
        {(event.description || (event.metadata && Object.keys(event.metadata).length > 3)) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 mt-1 text-xs"
            onClick={() => setExpanded(!expanded)}
          >
            <ChevronDown className={cn('h-3 w-3 mr-1 transition-transform', expanded && 'rotate-180')} />
            {expanded ? 'Less' : 'More'}
          </Button>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// MAIN TIMELINE COMPONENT
// ============================================================================

interface ContactTimelineProps {
  contactId: string
  siteId: string
  className?: string
  maxHeight?: string
}

export function ContactTimeline({ contactId, siteId, className, maxHeight = '500px' }: ContactTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  const loadTimeline = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getContactTimeline(contactId, siteId)
      setEvents(data)
    } catch (err) {
      toast.error('Failed to load timeline')
    } finally {
      setLoading(false)
    }
  }, [contactId, siteId])

  useEffect(() => { loadTimeline() }, [loadTimeline])

  const filteredEvents = events.filter(e => {
    if (filter === 'all') return true
    if (filter === 'activities') return e.type.startsWith('activity_')
    if (filter === 'deals') return e.type.startsWith('deal_')
    if (filter === 'emails') return e.type.startsWith('email_')
    if (filter === 'forms') return e.type === 'form_submitted'
    if (filter === 'notes') return e.type === 'note_added'
    return true
  })

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-3 w-[150px]" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          Timeline
          <Badge variant="secondary" className="ml-1">{filteredEvents.length}</Badge>
        </h4>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="activities">Activities</SelectItem>
            <SelectItem value="deals">Deals</SelectItem>
            <SelectItem value="emails">Emails</SelectItem>
            <SelectItem value="forms">Forms</SelectItem>
            <SelectItem value="notes">Notes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Timeline List */}
      <div className="overflow-y-auto" style={{ maxHeight }}>
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
            No timeline events yet
          </div>
        ) : (
          filteredEvents.map((event) => (
            <TimelineEventItem key={event.id} event={event} />
          ))
        )}
      </div>
    </div>
  )
}
