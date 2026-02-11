'use client'

/**
 * WhatsApp Window Indicator
 *
 * PHASE LC-05: Shows the 24-hour service window status for WhatsApp conversations.
 */

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Clock, AlertTriangle, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WhatsAppWindowIndicatorProps {
  windowExpiresAt: string | null
  className?: string
}

function getTimeRemaining(expiresAt: string): {
  expired: boolean
  hours: number
  minutes: number
  text: string
} {
  const now = new Date().getTime()
  const expiry = new Date(expiresAt).getTime()
  const diff = expiry - now

  if (diff <= 0) {
    return { expired: true, hours: 0, minutes: 0, text: 'Window expired' }
  }

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  return {
    expired: false,
    hours,
    minutes,
    text: `${hours}h ${minutes}m remaining`,
  }
}

export function WhatsAppWindowIndicator({
  windowExpiresAt,
  className,
}: WhatsAppWindowIndicatorProps) {
  const [timeLeft, setTimeLeft] = useState(
    windowExpiresAt ? getTimeRemaining(windowExpiresAt) : null
  )

  useEffect(() => {
    if (!windowExpiresAt) return

    setTimeLeft(getTimeRemaining(windowExpiresAt))
    const interval = setInterval(() => {
      setTimeLeft(getTimeRemaining(windowExpiresAt))
    }, 60_000) // Update every minute

    return () => clearInterval(interval)
  }, [windowExpiresAt])

  if (!windowExpiresAt || !timeLeft) {
    return null
  }

  if (timeLeft.expired) {
    return (
      <Badge
        variant="outline"
        className={cn(
          'gap-1 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30',
          className
        )}
      >
        <AlertTriangle className="h-3 w-3" />
        Window expired — template required
        <FileText className="h-3 w-3 ml-0.5" />
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 text-green-600 dark:text-green-400 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30',
        className
      )}
    >
      <Clock className="h-3 w-3" />
      Service window: {timeLeft.text}
    </Badge>
  )
}
