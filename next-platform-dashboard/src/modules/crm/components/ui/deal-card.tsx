/**
 * Enhanced Deal Card Component
 * 
 * PHASE-UI-10B: CRM Pipeline & Deals View
 * 
 * Modern deal card with avatar, tags, probability visual, and quick actions.
 */
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  DollarSign, 
  Calendar, 
  Building2,
  GripVertical,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Deal, DealStatus } from '../../types/crm-types'

import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'
// =============================================================================
// TYPES
// =============================================================================

export interface DealCardProps {
  deal: Deal
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onWin?: () => void
  onLose?: () => void
  onDragStart?: (e: React.DragEvent) => void
  isDragging?: boolean
  isCompact?: boolean
  showActions?: boolean
  className?: string
}

export type DealCardVariant = 'default' | 'compact' | 'detailed'

// =============================================================================
// HELPERS
// =============================================================================

function formatCurrency(amount: number | null | undefined, currency = DEFAULT_CURRENCY): string {
  if (amount == null) return '-'
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
    notation: amount >= 100000 ? 'compact' : 'standard',
  }).format(amount)
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-'
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return `${Math.abs(diffDays)}d overdue`
  } else if (diffDays === 0) {
    return 'Today'
  } else if (diffDays === 1) {
    return 'Tomorrow'
  } else if (diffDays <= 7) {
    return `${diffDays}d`
  }

  return date.toLocaleDateString(DEFAULT_LOCALE, {
    month: 'short',
    day: 'numeric',
  })
}

function getInitials(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.charAt(0) || ''
  const last = lastName?.charAt(0) || ''
  return (first + last).toUpperCase() || '?'
}

function getDaysUntilClose(dateString: string | null | undefined): number | null {
  if (!dateString) return null
  const date = new Date(dateString)
  const now = new Date()
  return Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function getProbabilityColor(probability: number): string {
  if (probability >= 80) return 'bg-green-500'
  if (probability >= 60) return 'bg-emerald-500'
  if (probability >= 40) return 'bg-yellow-500'
  if (probability >= 20) return 'bg-orange-500'
  return 'bg-red-500'
}

function getStatusConfig(status: DealStatus): { icon: LucideIcon; color: string; label: string } {
  switch (status) {
    case 'won':
      return { icon: CheckCircle2, color: 'text-green-500', label: 'Won' }
    case 'lost':
      return { icon: XCircle, color: 'text-red-500', label: 'Lost' }
    default:
      return { icon: Clock, color: 'text-blue-500', label: 'Open' }
  }
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function DealCard({
  deal,
  onClick,
  onEdit,
  onDelete,
  onWin,
  onLose,
  onDragStart,
  isDragging = false,
  isCompact = false,
  showActions = true,
  className,
}: DealCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  const daysUntilClose = getDaysUntilClose(deal.expected_close_date)
  const isOverdue = daysUntilClose !== null && daysUntilClose < 0
  const isUrgent = daysUntilClose !== null && daysUntilClose >= 0 && daysUntilClose <= 3
  const statusConfig = getStatusConfig(deal.status)
  const StatusIcon = statusConfig.icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: isDragging ? 0.5 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card 
        className={cn(
          "transition-all cursor-pointer hover:shadow-md",
          isDragging && "shadow-lg ring-2 ring-primary/50",
          isOverdue && "border-red-500/30 bg-red-50/5",
          className
        )}
        draggable={!!onDragStart}
        onDragStart={onDragStart}
        onClick={onClick}
      >
        <CardContent className={cn("p-3", isCompact && "p-2")}>
          {/* Header Row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {onDragStart && (
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab flex-shrink-0" />
              )}
              <div className="min-w-0">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className={cn(
                        "font-medium text-sm line-clamp-1 hover:text-primary transition-colors",
                        isCompact && "text-xs"
                      )}>
                        {deal.name}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{deal.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            
            {/* Status Badge */}
            {deal.status !== 'open' && (
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-xs shrink-0",
                  deal.status === 'won' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                  deal.status === 'lost' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                )}
              >
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
            )}
          </div>

          {/* Amount */}
          {deal.amount != null && deal.amount > 0 && (
            <div className={cn(
              "flex items-center gap-1 mt-2 font-semibold",
              deal.status === 'won' ? 'text-green-600 dark:text-green-400' : 'text-foreground',
              isCompact ? "text-sm" : "text-base"
            )}>
              <DollarSign className="h-4 w-4" />
              {formatCurrency(deal.amount, deal.currency)}
              {deal.weighted_value && deal.weighted_value !== deal.amount && (
                <span className="text-xs text-muted-foreground font-normal ml-1">
                  ({formatCurrency(deal.weighted_value)} weighted)
                </span>
              )}
            </div>
          )}

          {/* Contact & Company */}
          {!isCompact && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
              {deal.contact && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                            {getInitials(deal.contact.first_name, deal.contact.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate max-w-[100px]">
                          {deal.contact.first_name} {deal.contact.last_name}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{deal.contact.first_name} {deal.contact.last_name}</p>
                      {deal.contact.email && <p className="text-xs text-muted-foreground">{deal.contact.email}</p>}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {deal.company && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  <span className="truncate max-w-[100px]">{deal.company.name}</span>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {!isCompact && deal.tags && deal.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {deal.tags.slice(0, 3).map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="text-[10px] px-1.5 py-0"
                >
                  {tag}
                </Badge>
              ))}
              {deal.tags.length > 3 && (
                <Badge 
                  variant="outline" 
                  className="text-[10px] px-1.5 py-0 text-muted-foreground"
                >
                  +{deal.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Close Date */}
          {deal.expected_close_date && deal.status === 'open' && (
            <div className={cn(
              "flex items-center gap-1 mt-2 text-xs",
              isOverdue ? "text-red-600 dark:text-red-400" : 
              isUrgent ? "text-yellow-600 dark:text-yellow-400" : 
              "text-muted-foreground"
            )}>
              {isOverdue && <AlertTriangle className="h-3 w-3" />}
              <Calendar className="h-3 w-3" />
              <span>
                {isOverdue ? `${Math.abs(daysUntilClose!)}d overdue` : formatDate(deal.expected_close_date)}
              </span>
            </div>
          )}

          {/* Probability Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Probability</span>
              <span className={cn(
                "font-medium",
                deal.probability >= 70 ? "text-green-600" :
                deal.probability >= 40 ? "text-yellow-600" :
                "text-red-600"
              )}>
                {deal.probability}%
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${deal.probability}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={cn("h-full rounded-full", getProbabilityColor(deal.probability))}
              />
            </div>
          </div>

          {/* Quick Actions (on hover) */}
          {showActions && isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mt-3 pt-2 border-t"
            >
              <div className="flex items-center gap-1">
                {deal.status === 'open' && onWin && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-100"
                          onClick={(e) => { e.stopPropagation(); onWin(); }}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Mark as Won</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {deal.status === 'open' && onLose && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-100"
                          onClick={(e) => { e.stopPropagation(); onLose(); }}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Mark as Lost</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  {onEdit && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default DealCard
