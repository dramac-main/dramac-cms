'use client'

/**
 * Reusable Social Media Empty State Component
 * Phase SM-09: Production Hardening
 */

import { type LucideIcon, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SocialEmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  actionHref?: string
  className?: string
}

export function SocialEmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className,
}: SocialEmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <Icon className="h-12 w-12 text-muted-foreground/50 mb-4" strokeWidth={1.5} />
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="text-muted-foreground mt-1 max-w-sm">{description}</p>
      )}
      {actionLabel && (onAction || actionHref) && (
        actionHref ? (
          <a href={actionHref}>
            <Button className="mt-4" size="sm">{actionLabel}</Button>
          </a>
        ) : (
          <Button className="mt-4" size="sm" onClick={onAction}>{actionLabel}</Button>
        )
      )}
    </div>
  )
}
