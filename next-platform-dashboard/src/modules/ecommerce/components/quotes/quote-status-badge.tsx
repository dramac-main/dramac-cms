/**
 * Quote Status Badge Component
 * 
 * Phase ECOM-11B: Quote UI Components
 * 
 * Displays quote status with appropriate color coding
 */
'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  FileEdit, 
  Clock, 
  Send, 
  Eye, 
  CircleCheck, 
  CircleX, 
  AlertTriangle,
  ArrowRightCircle,
  Ban
} from 'lucide-react'
import type { QuoteStatus } from '../../types/ecommerce-types'
import { QUOTE_STATUS_CONFIG } from '../../lib/quote-utils'

// ============================================================================
// TYPES
// ============================================================================

interface QuoteStatusBadgeProps {
  status: QuoteStatus
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// ============================================================================
// STATUS ICONS
// ============================================================================

const statusIcons: Record<QuoteStatus, React.ComponentType<{ className?: string }>> = {
  draft: FileEdit,
  pending_approval: Clock,
  sent: Send,
  viewed: Eye,
  accepted: CircleCheck,
  rejected: CircleX,
  expired: AlertTriangle,
  converted: ArrowRightCircle,
  cancelled: Ban
}

// ============================================================================
// SIZE CONFIG
// ============================================================================

const sizeConfig = {
  sm: {
    badge: 'text-xs px-2 py-0.5',
    icon: 'h-3 w-3'
  },
  md: {
    badge: 'text-xs px-2.5 py-0.5',
    icon: 'h-3.5 w-3.5'
  },
  lg: {
    badge: 'text-sm px-3 py-1',
    icon: 'h-4 w-4'
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuoteStatusBadge({ 
  status, 
  showIcon = true, 
  size = 'md',
  className 
}: QuoteStatusBadgeProps) {
  const config = QUOTE_STATUS_CONFIG[status]
  const Icon = statusIcons[status]
  const sizes = sizeConfig[size]

  return (
    <Badge 
      variant="outline"
      className={cn(
        'font-medium border-0',
        config.bgColor,
        config.color,
        sizes.badge,
        className
      )}
    >
      {showIcon && Icon && (
        <Icon className={cn('mr-1', sizes.icon)} />
      )}
      {config.label}
    </Badge>
  )
}

/**
 * Get status badge props for use in other components
 */
export function getStatusBadgeProps(status: QuoteStatus) {
  const config = QUOTE_STATUS_CONFIG[status]
  return {
    className: cn(config.bgColor, config.color),
    label: config.label,
    Icon: statusIcons[status]
  }
}
