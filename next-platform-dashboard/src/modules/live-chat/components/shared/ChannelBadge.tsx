'use client'

/**
 * ChannelBadge — Visual indicator for conversation channel (widget, whatsapp, api)
 */

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { MessageCircle, Phone, Code } from 'lucide-react'
import type { ConversationChannel } from '@/modules/live-chat/types'

const channelConfig: Record<
  ConversationChannel,
  { label: string; icon: React.ElementType; className: string }
> = {
  widget: {
    label: 'Widget',
    icon: MessageCircle,
    className: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  },
  whatsapp: {
    label: 'WhatsApp',
    icon: Phone,
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  },
  api: {
    label: 'API',
    icon: Code,
    className: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  },
}

interface ChannelBadgeProps {
  channel: ConversationChannel
  className?: string
}

export function ChannelBadge({ channel, className }: ChannelBadgeProps) {
  const config = channelConfig[channel] || channelConfig.widget
  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium gap-1', config.className, className)}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}
