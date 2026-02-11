'use client'

/**
 * WhatsApp Status Indicator
 *
 * PHASE LC-05: Shows message delivery status with WhatsApp-style check marks.
 */

import { cn } from '@/lib/utils'
import {
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip'
import type { MessageStatus } from '@/modules/live-chat/types'

interface WhatsAppStatusIndicatorProps {
  status: MessageStatus | string
  className?: string
  errorMessage?: string
}

export function WhatsAppStatusIndicator({
  status,
  className,
  errorMessage,
}: WhatsAppStatusIndicatorProps) {
  const getIcon = () => {
    switch (status) {
      case 'sending':
        return <Loader2 className={cn('h-3 w-3 text-muted-foreground animate-spin', className)} />
      case 'sent':
        return <Check className={cn('h-3 w-3 text-muted-foreground', className)} />
      case 'delivered':
        return <CheckCheck className={cn('h-3 w-3 text-muted-foreground', className)} />
      case 'read':
        return <CheckCheck className={cn('h-3 w-3 text-blue-500', className)} />
      case 'failed':
        return <AlertCircle className={cn('h-3 w-3 text-destructive', className)} />
      default:
        return <Clock className={cn('h-3 w-3 text-muted-foreground', className)} />
    }
  }

  const getLabel = () => {
    switch (status) {
      case 'sending':
        return 'Sending...'
      case 'sent':
        return 'Sent'
      case 'delivered':
        return 'Delivered'
      case 'read':
        return 'Read'
      case 'failed':
        return errorMessage || 'Failed to send'
      default:
        return 'Pending'
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">{getIcon()}</span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {getLabel()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
