'use client'

/**
 * AgentStatusDot — Small colored dot indicating agent online status
 */

import { cn } from '@/lib/utils'
import type { AgentStatus } from '@/modules/live-chat/types'

const dotColors: Record<AgentStatus, string> = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
  offline: 'bg-gray-400',
}

interface AgentStatusDotProps {
  status: AgentStatus
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showLabel?: boolean
}

const sizeMap = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
}

export function AgentStatusDot({
  status,
  size = 'md',
  className,
  showLabel = false,
}: AgentStatusDotProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span
        className={cn(
          'rounded-full shrink-0',
          sizeMap[size],
          dotColors[status],
          status === 'online' && 'animate-pulse'
        )}
      />
      {showLabel && (
        <span className="text-xs text-muted-foreground capitalize">
          {status}
        </span>
      )}
    </span>
  )
}
