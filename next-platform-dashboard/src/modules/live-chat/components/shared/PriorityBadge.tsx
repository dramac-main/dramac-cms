'use client'

/**
 * PriorityBadge — Visual indicator for conversation priority level
 */

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ConversationPriority } from '@/modules/live-chat/types'

const priorityConfig: Record<
  ConversationPriority,
  { label: string; className: string }
> = {
  low: {
    label: 'Low',
    className: 'bg-muted/50 text-muted-foreground border-border',
  },
  normal: {
    label: 'Normal',
    className: 'bg-background text-foreground border-border',
  },
  high: {
    label: 'High',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  },
  urgent: {
    label: 'Urgent',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800 animate-pulse',
  },
}

interface PriorityBadgeProps {
  priority: ConversationPriority
  className?: string
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority] || priorityConfig.normal

  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium', config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
