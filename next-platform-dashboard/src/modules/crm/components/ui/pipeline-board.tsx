/**
 * Pipeline Board Component
 * 
 * PHASE-UI-10B: CRM Pipeline & Deals View
 * 
 * Full kanban-style pipeline board with drag-and-drop, multi-pipeline support,
 * and stage management capabilities.
 */
'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Plus, 
  Settings2,
  Filter,
  Search,
  Coins,
  LayoutGrid,
  List,
  RefreshCcw,
  Columns,
  SlidersHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PipelineStage } from './pipeline-stage'
import type { Deal, Pipeline, PipelineStage as StageType } from '../../types/crm-types'

import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'
// =============================================================================
// TYPES
// =============================================================================

export interface PipelineBoardProps {
  pipelines: Pipeline[]
  selectedPipelineId?: string
  deals: Deal[]
  onSelectPipeline?: (pipelineId: string) => void
  onDealClick?: (deal: Deal) => void
  onDealEdit?: (deal: Deal) => void
  onDealDelete?: (deal: Deal) => void
  onDealWin?: (deal: Deal) => void
  onDealLose?: (deal: Deal) => void
  onDealMove?: (deal: Deal, stageId: string) => void
  onAddDeal?: (stageId?: string) => void
  onEditPipeline?: (pipeline: Pipeline) => void
  onAddStage?: (pipelineId: string) => void
  onEditStage?: (stage: StageType) => void
  onDeleteStage?: (stage: StageType) => void
  isLoading?: boolean
  error?: string | null
  className?: string
}

interface DragState {
  deal: Deal | null
  sourceStageId: string | null
  targetStageId: string | null
}

// =============================================================================
// HELPERS
// =============================================================================

function formatCurrency(amount: number, currency = DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
    notation: amount >= 1000000 ? 'compact' : 'standard',
  }).format(amount)
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function PipelineSelector({
  pipelines,
  selectedId,
  onSelect,
}: {
  pipelines: Pipeline[]
  selectedId?: string
  onSelect: (id: string) => void
}) {
  const selectedPipeline = pipelines.find(p => p.id === selectedId)
  
  return (
    <Select value={selectedId} onValueChange={onSelect}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select pipeline">
          {selectedPipeline && (
            <span className="flex items-center gap-2">
              <span 
                className="h-2 w-2 rounded-full" 
                style={{ backgroundColor: selectedPipeline.stages?.[0]?.color || '#888' }}
              />
              {selectedPipeline.name}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {pipelines.map((pipeline) => (
          <SelectItem key={pipeline.id} value={pipeline.id}>
            <span className="flex items-center gap-2">
              <span 
                className="h-2 w-2 rounded-full" 
                style={{ backgroundColor: pipeline.stages?.[0]?.color || '#888' }}
              />
              {pipeline.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function BoardStats({ deals, stages }: { deals: Deal[]; stages: StageType[] }) {
  const stats = useMemo(() => {
    const openDeals = deals.filter(d => d.status === 'open')
    const totalValue = openDeals.reduce((sum, d) => sum + (d.amount || 0), 0)
    const weightedValue = openDeals.reduce((sum, d) => sum + (d.weighted_value || 0), 0)
    
    return {
      dealCount: openDeals.length,
      totalValue,
      weightedValue,
      stageCount: stages.filter(s => s.stage_type === 'open').length,
    }
  }, [deals, stages])

  return (
    <div className="flex items-center gap-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <Coins className="h-4 w-4" />
        <span className="font-medium text-foreground">{formatCurrency(stats.totalValue)}</span>
        <span>pipeline value</span>
      </div>
      <span className="text-border">|</span>
      <div className="flex items-center gap-1.5">
        <span className="font-medium text-foreground">{stats.dealCount}</span>
        <span>deals</span>
      </div>
      <span className="text-border">|</span>
      <div className="flex items-center gap-1.5">
        <span className="font-medium text-foreground">{stats.stageCount}</span>
        <span>stages</span>
      </div>
    </div>
  )
}

function BoardLoadingSkeleton() {
  return (
    <div className="flex gap-4 p-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="min-w-[300px]">
          <Skeleton className="h-24 mb-2 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function PipelineBoard({
  pipelines,
  selectedPipelineId,
  deals,
  onSelectPipeline,
  onDealClick,
  onDealEdit,
  onDealDelete,
  onDealWin,
  onDealLose,
  onDealMove,
  onAddDeal,
  onEditPipeline,
  onAddStage,
  onEditStage,
  onDeleteStage,
  isLoading = false,
  error = null,
  className,
}: PipelineBoardProps) {
  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [collapsedStages, setCollapsedStages] = useState<Set<string>>(new Set())
  const [dragState, setDragState] = useState<DragState>({
    deal: null,
    sourceStageId: null,
    targetStageId: null,
  })
  const [deleteConfirm, setDeleteConfirm] = useState<StageType | null>(null)

  // Get selected pipeline and its stages
  const selectedPipeline = useMemo(() => {
    if (!selectedPipelineId) return pipelines[0]
    return pipelines.find(p => p.id === selectedPipelineId) || pipelines[0]
  }, [pipelines, selectedPipelineId])

  const stages = useMemo(() => {
    return selectedPipeline?.stages || []
  }, [selectedPipeline])

  // Sort stages by position
  const sortedStages = useMemo(() => {
    return [...stages].sort((a, b) => a.position - b.position)
  }, [stages])

  // Filter deals by pipeline and search
  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      // Filter by pipeline
      if (deal.pipeline_id !== selectedPipeline?.id) return false
      
      // Filter by search
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const contactName = deal.contact 
          ? [deal.contact.first_name, deal.contact.last_name].filter(Boolean).join(' ')
          : ''
        return (
          deal.name.toLowerCase().includes(query) ||
          contactName.toLowerCase().includes(query) ||
          deal.company?.name?.toLowerCase().includes(query)
        )
      }
      
      return true
    })
  }, [deals, selectedPipeline?.id, searchQuery])

  // Group deals by stage
  const dealsByStage = useMemo(() => {
    const grouped = new Map<string, Deal[]>()
    
    sortedStages.forEach(stage => {
      grouped.set(stage.id, [])
    })
    
    filteredDeals.forEach(deal => {
      if (deal.stage_id) {
        const stageDeals = grouped.get(deal.stage_id) || []
        stageDeals.push(deal)
        grouped.set(deal.stage_id, stageDeals)
      }
    })
    
    return grouped
  }, [filteredDeals, sortedStages])

  // Handlers
  const handleToggleCollapse = useCallback((stageId: string) => {
    setCollapsedStages(prev => {
      const next = new Set(prev)
      if (next.has(stageId)) {
        next.delete(stageId)
      } else {
        next.add(stageId)
      }
      return next
    })
  }, [])

  const handleDragStart = useCallback((e: React.DragEvent, deal: Deal) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', deal.id)
    
    setDragState({
      deal,
      sourceStageId: deal.stage_id || null,
      targetStageId: null,
    })
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    setDragState(prev => ({
      ...prev,
      targetStageId: stageId,
    }))
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    
    const { deal, sourceStageId } = dragState
    
    if (deal && sourceStageId !== stageId && onDealMove) {
      onDealMove(deal, stageId)
    }
    
    setDragState({
      deal: null,
      sourceStageId: null,
      targetStageId: null,
    })
  }, [dragState, onDealMove])

  const handleDragEnd = useCallback(() => {
    setDragState({
      deal: null,
      sourceStageId: null,
      targetStageId: null,
    })
  }, [])

  const handleDeleteStage = useCallback((stage: StageType) => {
    setDeleteConfirm(stage)
  }, [])

  const confirmDeleteStage = useCallback(() => {
    if (deleteConfirm && onDeleteStage) {
      onDeleteStage(deleteConfirm)
    }
    setDeleteConfirm(null)
  }, [deleteConfirm, onDeleteStage])

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div 
      className={cn("flex flex-col h-full", className)}
      onDragEnd={handleDragEnd}
    >
      {/* Board Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-4">
          <PipelineSelector
            pipelines={pipelines}
            selectedId={selectedPipeline?.id}
            onSelect={(id) => onSelectPipeline?.(id)}
          />
          
          {selectedPipeline && (
            <BoardStats deals={filteredDeals} stages={sortedStages} />
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[200px]"
            />
          </div>

          {/* Pipeline Settings */}
          {selectedPipeline && onEditPipeline && (
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => onEditPipeline(selectedPipeline)}
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          )}

          {/* Add Stage */}
          {selectedPipeline && onAddStage && (
            <Button 
              variant="outline"
              onClick={() => onAddStage(selectedPipeline.id)}
            >
              <Columns className="h-4 w-4 mr-2" />
              Add Stage
            </Button>
          )}

          {/* Add Deal */}
          {onAddDeal && (
            <Button onClick={() => onAddDeal()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Deal
            </Button>
          )}
        </div>
      </div>

      {/* Board Content */}
      {isLoading ? (
        <BoardLoadingSkeleton />
      ) : (
        <ScrollArea className="flex-1">
          <div className="flex gap-4 p-4 min-h-full">
            <AnimatePresence mode="popLayout">
              {sortedStages.map((stage) => (
                <PipelineStage
                  key={stage.id}
                  stage={stage}
                  deals={dealsByStage.get(stage.id) || []}
                  onDealClick={onDealClick}
                  onDealEdit={onDealEdit}
                  onDealDelete={onDealDelete}
                  onDealWin={onDealWin}
                  onDealLose={onDealLose}
                  onAddDeal={onAddDeal ? () => onAddDeal(stage.id) : undefined}
                  onEditStage={onEditStage ? () => onEditStage(stage) : undefined}
                  onDeleteStage={
                    onDeleteStage && stage.stage_type === 'open' 
                      ? () => handleDeleteStage(stage) 
                      : undefined
                  }
                  onDragStart={handleDragStart}
                  onDragOver={(e) => handleDragOver(e, stage.id)}
                  onDrop={(e) => handleDrop(e, stage.id)}
                  isDragOver={dragState.targetStageId === stage.id}
                  isCollapsed={collapsedStages.has(stage.id)}
                  onToggleCollapse={() => handleToggleCollapse(stage.id)}
                />
              ))}
            </AnimatePresence>

            {/* Add Stage Button */}
            {selectedPipeline && onAddStage && sortedStages.length < 10 && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="min-w-[200px] border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                onClick={() => onAddStage(selectedPipeline.id)}
              >
                <Plus className="h-8 w-8" />
                <span className="text-sm font-medium">Add Stage</span>
              </motion.button>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {/* Delete Stage Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Stage</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the &ldquo;{deleteConfirm?.name}&rdquo; stage?
              {(dealsByStage.get(deleteConfirm?.id || '')?.length || 0) > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: This stage contains {dealsByStage.get(deleteConfirm?.id || '')?.length} deal(s) that will need to be moved.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteStage}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default PipelineBoard
