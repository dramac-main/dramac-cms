/**
 * Order Timeline Component
 * 
 * Phase ECOM-04: Order Management Enhancement
 * 
 * Visual timeline showing order events and history
 */
'use client'

import { formatDistanceToNow, format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Package, 
  CreditCard, 
  Truck, 
  CheckCircle, 
  XCircle,
  MessageSquare,
  RefreshCw,
  Mail,
  Clock,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OrderTimelineEvent, OrderEventType } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface OrderTimelineProps {
  events: OrderTimelineEvent[]
}

interface EventConfig {
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
}

// ============================================================================
// EVENT CONFIG
// ============================================================================

const eventConfig: Record<OrderEventType, EventConfig> = {
  created: {
    icon: Package,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30'
  },
  confirmed: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30'
  },
  payment_received: {
    icon: CreditCard,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30'
  },
  payment_failed: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30'
  },
  processing: {
    icon: RefreshCw,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30'
  },
  shipped: {
    icon: Truck,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30'
  },
  delivered: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30'
  },
  cancelled: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30'
  },
  refund_requested: {
    icon: RefreshCw,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30'
  },
  refund_processed: {
    icon: CreditCard,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30'
  },
  note_added: {
    icon: MessageSquare,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-800'
  },
  status_changed: {
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30'
  },
  email_sent: {
    icon: Mail,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30'
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function OrderTimeline({ events }: OrderTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No events recorded yet
      </div>
    )
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="relative space-y-0">
        {/* Timeline line */}
        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border" />

        {events.map((event, index) => {
          const config = eventConfig[event.event_type]
          const Icon = config.icon

          return (
            <div key={event.id} className="relative pl-10 pb-6">
              {/* Icon */}
              <div className={cn(
                'absolute left-0 p-2 rounded-full',
                config.bgColor
              )}>
                <Icon className={cn('h-4 w-4', config.color)} />
              </div>

              {/* Content */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{event.title}</span>
                  {index === 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Latest
                    </Badge>
                  )}
                </div>

                {event.description && (
                  <p className="text-sm text-muted-foreground">
                    {event.description}
                  </p>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <time 
                    dateTime={event.created_at}
                    title={format(new Date(event.created_at), 'PPpp')}
                  >
                    {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                  </time>
                  {event.user_name && (
                    <>
                      <span>•</span>
                      <span>by {event.user_name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
