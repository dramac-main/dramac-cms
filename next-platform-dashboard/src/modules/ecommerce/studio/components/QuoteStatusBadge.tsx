/**
 * QuoteStatusBadge - Display quotation status
 * 
 * Phase ECOM-25: Quotation Frontend
 * 
 * Shows quote status with appropriate color and icon.
 */
'use client'

import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { QuoteStatus } from '../../types/ecommerce-types'
import { 
  Clock, 
  Send, 
  Eye, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  FileText,
  CreditCard,
  AlertCircle
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

export interface QuoteStatusBadgeProps {
  status: QuoteStatus
  variant?: 'default' | 'outline' | 'pill'
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

// ============================================================================
// STATUS CONFIGURATION
// ============================================================================

interface StatusConfig {
  label: string
  color: string
  bgColor: string
  borderColor: string
  icon: React.ComponentType<{ className?: string }>
}

const STATUS_CONFIG: Record<QuoteStatus, StatusConfig> = {
  draft: {
    label: 'Draft',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    icon: FileText
  },
  pending_approval: {
    label: 'Pending Approval',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-300',
    icon: Clock
  },
  sent: {
    label: 'Sent',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    icon: Send
  },
  viewed: {
    label: 'Viewed',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100',
    borderColor: 'border-indigo-300',
    icon: Eye
  },
  accepted: {
    label: 'Accepted',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    icon: CheckCircle
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    icon: XCircle
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    icon: XCircle
  },
  expired: {
    label: 'Expired',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-300',
    icon: AlertCircle
  },
  converted: {
    label: 'Converted to Order',
    color: 'text-teal-700',
    bgColor: 'bg-teal-100',
    borderColor: 'border-teal-300',
    icon: CreditCard
  }
}

// ============================================================================
// SIZE CLASSES
// ============================================================================

const SIZE_CLASSES = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5'
}

const ICON_SIZES = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5'
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuoteStatusBadge({
  status,
  variant = 'default',
  size = 'md',
  showIcon = true,
  className
}: QuoteStatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  
  if (!config) {
    return (
      <Badge variant="outline" className={className}>
        {status}
      </Badge>
    )
  }

  const Icon = config.icon
  
  const variantClasses = {
    default: cn(config.bgColor, config.color),
    outline: cn('bg-transparent border', config.borderColor, config.color),
    pill: cn(config.bgColor, config.color, 'rounded-full')
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium whitespace-nowrap',
        SIZE_CLASSES[size],
        variant === 'pill' ? 'rounded-full' : 'rounded-md',
        variantClasses[variant],
        className
      )}
    >
      {showIcon && <Icon className={ICON_SIZES[size]} />}
      {config.label}
    </span>
  )
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getQuoteStatusLabel(status: QuoteStatus): string {
  return STATUS_CONFIG[status]?.label || status
}

export function getQuoteStatusColor(status: QuoteStatus): string {
  return STATUS_CONFIG[status]?.color || 'text-gray-700'
}

export function isQuoteActionable(status: QuoteStatus): boolean {
  return status === 'sent' || status === 'viewed'
}

export function isQuoteFinal(status: QuoteStatus): boolean {
  return status === 'accepted' || status === 'rejected' || status === 'expired' || status === 'converted' || status === 'cancelled'
}
