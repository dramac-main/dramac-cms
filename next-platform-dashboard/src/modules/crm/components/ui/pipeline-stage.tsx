/**
 * Pipeline Stage Column Component
 * 
 * PHASE-UI-10B: CRM Pipeline & Deals View
 * 
 * Enhanced stage column with value metrics, conversion rates, and drop zones.
 */
'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { 
  Plus, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Settings,
  Trash2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { DealCard } from './deal-card'
import type { Deal, PipelineStage } from '../../types/crm-types'

// =============================================================================
// TYPES
// =============================================================================

export interface PipelineStageProps {
  stage: PipelineStage
  deals: Deal[]
  onDealClick?: (deal: Deal) => void
  onDealEdit?: (deal: Deal) => void
  onDealDelete?: (deal: Deal) => void
  onDealWin?: (deal: Deal) => void
  onDealLose?: (deal: Deal) => void
  onAddDeal?: () => void
  onEditStage?: () => void
  onDeleteStage?: () => void
  onDragStart?: (e: React.DragEvent, deal: Deal) => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
  isDragOver?: boolean
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  maxHeight?: number
  className?: string
}

// =============================================================================
// HELPERS
// =============================================================================

function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
    notation: amount >= 1000000 ? 'compact' : 'standard',
  }).format(amount)
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function PipelineStage({
  stage,
  deals,
  onDealClick,
  onDealEdit,
  onDealDelete,
  onDealWin,
  onDealLose,
  onAddDeal,
  onEditStage,
  onDeleteStage,
  onDragStart,
  onDragOver,
  onDrop,
  isDragOver = false,
  isCollapsed = false,
  onToggleCollapse,
  maxHeight = 600,
  className,
}: PipelineStageProps) {
  // Calculate metrics
  const metrics = useMemo(() => {
    const openDeals = deals.filter(d => d.status === 'open')
    const totalValue = openDeals.reduce((sum, d) => sum + (d.amount || 0), 0)
    const weightedValue = openDeals.reduce((sum, d) => sum + (d.weighted_value || 0), 0)
    const avgDealSize = openDeals.length > 0 ? totalValue / openDeals.length : 0
    
    return {
      dealCount: openDeals.length,
      totalValue,
      weightedValue,
      avgDealSize,
    }
  }, [deals])

  return (
    <motion.div
      layout
      className={cn(
        "flex flex-col rounded-lg transition-all",
        isCollapsed ? "min-w-[60px] max-w-[60px]" : "min-w-[300px] max-w-[300px]",
        isDragOver && "ring-2 ring-primary/50 bg-primary/5",
        className
      )}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        onDragOver?.(e)
      }}
      onDrop={onDrop}
    >
      {/* Stage Header */}
      <div 
        className="sticky top-0 z-10 bg-background rounded-t-lg border-b"
        style={{ borderLeftColor: stage.color, borderLeftWidth: 4 }}
      >
        <div className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              {onToggleCollapse && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={onToggleCollapse}
                >
                  {isCollapsed ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </Button>
              )}
              
              {!isCollapsed && (
                <>
                  <span className="font-semibold text-sm truncate">{stage.name}</span>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {metrics.dealCount}
                  </Badge>
                </>
              )}
            </div>

            {!isCollapsed && (
              <div className="flex items-center gap-1">
                {onAddDeal && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={onAddDeal}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Add deal to {stage.name}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                {(onEditStage || onDeleteStage) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onEditStage && (
                        <DropdownMenuItem onClick={onEditStage}>
                          <Settings className="h-4 w-4 mr-2" />
                          Edit Stage
                        </DropdownMenuItem>
                      )}
                      {onDeleteStage && stage.stage_type === 'open' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={onDeleteStage}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Stage
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}
          </div>

          {/* Stage Metrics */}
          {!isCollapsed && (
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {formatCurrency(metrics.totalValue)}
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 cursor-help">
                      <span>{stage.probability}%</span>
                      <TrendingUp className="h-3 w-3" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Win probability: {stage.probability}%</p>
                    <p>Weighted value: {formatCurrency(metrics.weightedValue)}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}

          {/* Progress Bar for Stage Fill */}
          {!isCollapsed && metrics.dealCount > 0 && (
            <div className="mt-2">
              <Progress 
                value={Math.min((metrics.dealCount / 10) * 100, 100)} 
                className="h-1"
                style={{ 
                  backgroundColor: `${stage.color}20`,
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Collapsed View */}
      {isCollapsed && (
        <div className="flex-1 flex flex-col items-center py-4 text-sm">
          <span 
            className="writing-vertical-lr transform rotate-180 font-medium"
            style={{ writingMode: 'vertical-lr' }}
          >
            {stage.name}
          </span>
          <Badge variant="secondary" className="mt-2 text-xs">
            {metrics.dealCount}
          </Badge>
        </div>
      )}

      {/* Deals List */}
      {!isCollapsed && (
        <ScrollArea 
          className="flex-1 p-2"
          style={{ maxHeight: `${maxHeight}px` }}
        >
          <AnimatePresence mode="popLayout">
            {deals.length > 0 ? (
              deals.map((deal) => (
                <motion.div
                  key={deal.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="mb-2"
                >
                  <DealCard
                    deal={deal}
                    onClick={() => onDealClick?.(deal)}
                    onEdit={() => onDealEdit?.(deal)}
                    onDelete={() => onDealDelete?.(deal)}
                    onWin={() => onDealWin?.(deal)}
                    onLose={() => onDealLose?.(deal)}
                    onDragStart={onDragStart ? (e) => onDragStart(e, deal) : undefined}
                    isCompact
                    showActions
                  />
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <DollarSign className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-2">No deals here</p>
                {onAddDeal && (
                  <Button size="sm" variant="outline" onClick={onAddDeal}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Deal
                  </Button>
                )}
              </div>
            )}
          </AnimatePresence>

          {/* Drop Zone Indicator */}
          {isDragOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="border-2 border-dashed border-primary/50 rounded-lg p-4 text-center text-primary text-sm"
            >
              Drop deal here
            </motion.div>
          )}
        </ScrollArea>
      )}
    </motion.div>
  )
}

export default PipelineStage
