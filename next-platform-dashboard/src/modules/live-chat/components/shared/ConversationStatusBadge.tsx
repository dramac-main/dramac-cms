'use client'

/**
 * ConversationStatusBadge — Visual status indicator for conversation state
 */

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ConversationStatus } from '@/modules/live-chat/types'

const statusConfig: Record<
  ConversationStatus,
  { label: string; className: string }
> = {
  pending: {
    label: 'Pending',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  },
  active: {
    label: 'Active',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
  },
  waiting: {
    label: 'Waiting',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  },
  resolved: {
    label: 'Resolved',
    className: 'bg-muted text-muted-foreground border-border',
  },
  closed: {
    label: 'Closed',
    className: 'bg-muted/50 text-muted-foreground border-border',
  },
  missed: {
    label: 'Missed',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
  },
}

interface ConversationStatusBadgeProps {
  status: ConversationStatus
  className?: string
}

export function ConversationStatusBadge({
  status,
  className,
}: ConversationStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending

  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium', config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
