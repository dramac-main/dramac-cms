/**
 * Deals Pipeline View (Kanban Board)
 * 
 * Phase EM-50: CRM Module - Enterprise Ready
 * 
 * Visual pipeline board for managing deals through stages
 */
'use client'

import { useState, useMemo, useCallback } from 'react'
import { useCRM, usePipelineDeals } from '../../context/crm-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Plus, 
  Coins, 
  Calendar, 
  User, 
  Building2,
  GripVertical,
  TrendingUp,
  Settings,
  Settings2
} from 'lucide-react'
import { CreateDealDialog } from '../dialogs/create-deal-dialog'
import { CreatePipelineDialog } from '../dialogs/create-pipeline-dialog'
import { PipelineSettingsDialog } from '../dialogs/pipeline-settings-dialog'
import { DealDetailSheet } from '../sheets/deal-detail-sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { Deal, PipelineStage } from '../../types/crm-types'

import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'
// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(amount: number | null | undefined, currency = DEFAULT_CURRENCY): string {
  if (amount == null) return '-'
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(amount)
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString(DEFAULT_LOCALE, {
    month: 'short',
    day: 'numeric'
  })
}

// ============================================================================
// DEAL CARD
// ============================================================================

interface DealCardProps {
  deal: Deal
  onClick: () => void
  onDragStart: (e: React.DragEvent, deal: Deal) => void
}

function DealCard({ deal, onClick, onDragStart }: DealCardProps) {
  return (
    <Card 
      className="mb-2 cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
      draggable
      onDragStart={(e) => onDragStart(e, deal)}
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
            <span className="font-medium text-sm line-clamp-2">{deal.name}</span>
          </div>
        </div>
        
        {deal.amount != null && deal.amount > 0 && (
          <div className="flex items-center gap-1 text-sm font-semibold text-green-600 dark:text-green-400">
            <Coins className="h-3 w-3" />
            {formatCurrency(deal.amount, deal.currency)}
          </div>
        )}
        
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {deal.contact && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {deal.contact.first_name} {deal.contact.last_name}
            </div>
          )}
          {deal.company && (
            <div className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {deal.company.name}
            </div>
          )}
        </div>
        
        {deal.expected_close_date && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            Close: {formatDate(deal.expected_close_date)}
          </div>
        )}
        
        {/* Probability bar */}
        <div className="flex items-center gap-2">
          <div 
            className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden"
            title={`${deal.probability}% probability`}
          >
            <div 
              className="h-full bg-primary transition-all"
              style={{ width: `${deal.probability}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground w-8">{deal.probability}%</span>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// STAGE COLUMN
// ============================================================================

interface StageColumnProps {
  stage: PipelineStage
  deals: Deal[]
  onDealClick: (dealId: string) => void
  onAddDeal: (stageId: string) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, stageId: string) => void
  onDragStart: (e: React.DragEvent, deal: Deal) => void
  isDragOver: boolean
}

function StageColumn({ 
  stage, 
  deals, 
  onDealClick, 
  onAddDeal, 
  onDragOver,
  onDrop,
  onDragStart,
  isDragOver
}: StageColumnProps) {
  const totalValue = deals.reduce((sum, d) => sum + (d.amount || 0), 0)
  const weightedValue = deals.reduce((sum, d) => sum + (d.weighted_value || 0), 0)

  return (
    <div 
      className={cn(
        "flex flex-col min-w-[280px] max-w-[280px] bg-muted/30 rounded-lg transition-colors",
        isDragOver && "ring-2 ring-primary/50 bg-primary/5"
      )}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, stage.id)}
    >
      {/* Column Header */}
      <div 
        className="p-3 border-b rounded-t-lg"
        style={{ borderLeftColor: stage.color, borderLeftWidth: 4 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{stage.name}</span>
            <Badge variant="secondary" className="text-xs">
              {deals.length}
            </Badge>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={() => onAddDeal(stage.id)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
          <span>{formatCurrency(totalValue)}</span>
          <span>{stage.probability}% prob</span>
        </div>
      </div>
      
      {/* Deals List */}
      <ScrollArea className="flex-1 p-2" style={{ maxHeight: 'calc(100vh - 350px)' }}>
        {deals.map(deal => (
          <DealCard 
            key={deal.id} 
            deal={deal} 
            onClick={() => onDealClick(deal.id)}
            onDragStart={onDragStart}
          />
        ))}
        {deals.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-xs">
            No deals in this stage
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DealsView() {
  const { pipelines, deals, moveDeal, isLoading } = useCRM()
  
  // State
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null)
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createDialogStageId, setCreateDialogStageId] = useState<string | undefined>()
  const [createPipelineDialogOpen, setCreatePipelineDialogOpen] = useState(false)
  const [pipelineSettingsOpen, setPipelineSettingsOpen] = useState(false)
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null)
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null)

  // Get current pipeline (default if none selected)
  const currentPipeline = useMemo(() => {
    if (!pipelines.length) return null
    if (selectedPipelineId) {
      return pipelines.find(p => p.id === selectedPipelineId) || pipelines[0]
    }
    return pipelines.find(p => p.is_default) || pipelines[0]
  }, [pipelines, selectedPipelineId])

  // Get pipeline data
  const { pipelineStages, pipelineDeals, dealsByStage } = usePipelineDeals(currentPipeline?.id || null)

  // Pipeline summary (only count open deals for value metrics)
  const pipelineSummary = useMemo(() => {
    const openDeals = pipelineDeals.filter(d => d.status === 'open')
    return {
      totalDeals: openDeals.length,
      totalValue: openDeals.reduce((sum, d) => sum + (d.amount || 0), 0),
      weightedValue: openDeals.reduce((sum, d) => sum + (d.weighted_value || 0), 0)
    }
  }, [pipelineDeals])

  // Win rate
  const winRate = useMemo(() => {
    const allDeals = deals.filter(d => currentPipeline && d.pipeline_id === currentPipeline.id)
    const closed = allDeals.filter(d => d.status !== 'open')
    if (closed.length === 0) return 0
    const won = closed.filter(d => d.status === 'won')
    return Math.round((won.length / closed.length) * 100)
  }, [deals, currentPipeline])

  // Drag handlers
  const handleDragStart = useCallback((e: React.DragEvent, deal: Deal) => {
    setDraggedDeal(deal)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', deal.id)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    setDragOverStageId(null)
    
    if (draggedDeal && draggedDeal.stage_id !== stageId) {
      await moveDeal(draggedDeal.id, stageId)
    }
    setDraggedDeal(null)
  }, [draggedDeal, moveDeal])

  const handleDragEnter = useCallback((stageId: string) => {
    setDragOverStageId(stageId)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverStageId(null)
  }, [])

  // Open create dialog with pre-selected stage
  const handleAddDeal = (stageId?: string) => {
    setCreateDialogStageId(stageId)
    setCreateDialogOpen(true)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-[400px] w-72 flex-shrink-0" />
          ))}
        </div>
      </div>
    )
  }

  if (!currentPipeline) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <TrendingUp className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">No pipeline found. Create one to get started.</p>
        <Button onClick={() => setCreatePipelineDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Pipeline
        </Button>
        
        {/* Pipeline Dialog */}
        <CreatePipelineDialog
          open={createPipelineDialogOpen}
          onOpenChange={setCreatePipelineDialogOpen}
          onSuccess={(pipelineId) => setSelectedPipelineId(pipelineId)}
        />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Pipeline Header */}
      <div className="p-4 border-b flex items-center justify-between bg-background">
        <div className="flex items-center gap-4">
          {/* Pipeline Selector */}
          <Select 
            value={currentPipeline.id} 
            onValueChange={(v) => setSelectedPipelineId(v)}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pipelines.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Deals: </span>
              <span className="font-medium">{pipelineSummary.totalDeals}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Value: </span>
              <span className="font-medium">{formatCurrency(pipelineSummary.totalValue)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Weighted: </span>
              <span className="font-medium">{formatCurrency(pipelineSummary.weightedValue)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Win Rate: </span>
              <span className="font-medium">{winRate}%</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setPipelineSettingsOpen(true)}>
                <Settings2 className="h-4 w-4 mr-2" />
                Pipeline Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCreatePipelineDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Pipeline
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => handleAddDeal()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Deal
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 min-w-max h-full">
          {pipelineStages.map(stage => (
            <div
              key={stage.id}
              onDragEnter={() => handleDragEnter(stage.id)}
              onDragLeave={handleDragLeave}
            >
              <StageColumn
                stage={stage}
                deals={dealsByStage.get(stage.id) || []}
                onDealClick={setSelectedDealId}
                onAddDeal={handleAddDeal}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragStart={handleDragStart}
                isDragOver={dragOverStageId === stage.id}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Dialogs */}
      <CreateDealDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open)
          if (!open) setCreateDialogStageId(undefined)
        }}
        defaultPipelineId={currentPipeline.id}
        defaultStageId={createDialogStageId}
      />

      <CreatePipelineDialog
        open={createPipelineDialogOpen}
        onOpenChange={setCreatePipelineDialogOpen}
        onSuccess={(pipelineId) => setSelectedPipelineId(pipelineId)}
      />

      <PipelineSettingsDialog
        open={pipelineSettingsOpen}
        onOpenChange={setPipelineSettingsOpen}
        pipeline={currentPipeline}
        onPipelineDeleted={() => setSelectedPipelineId(null)}
      />

      {selectedDealId && (
        <DealDetailSheet
          dealId={selectedDealId}
          open={!!selectedDealId}
          onOpenChange={(open) => !open && setSelectedDealId(null)}
        />
      )}
    </div>
  )
}

export default DealsView
