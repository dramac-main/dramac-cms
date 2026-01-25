/**
 * WorkflowCanvas Component
 * 
 * Phase EM-57B: Automation Engine - Visual Builder & Advanced Features
 * 
 * Visual canvas displaying the workflow steps with:
 * - Start/End nodes
 * - Draggable and reorderable steps
 * - Visual connectors between steps
 * - Drop zone for new actions
 */

"use client"

import { useDroppable } from "@dnd-kit/core"
import { 
  SortableContext, 
  verticalListSortingStrategy, 
  useSortable 
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Trash2, 
  GripVertical, 
  ChevronDown, 
  Play, 
  MoreVertical,
  Copy,
  Settings
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { WorkflowStep } from "../../types/automation-types"

// ============================================================================
// TYPES
// ============================================================================

interface WorkflowCanvasProps {
  steps: WorkflowStep[]
  selectedStepId?: string
  onStepClick: (step: WorkflowStep | null) => void
  onStepDelete: (stepId: string) => void
  onStepDuplicate?: (step: WorkflowStep) => void
}

// ============================================================================
// STEP ICON/COLOR HELPERS
// ============================================================================

function getStepIcon(step: WorkflowStep): string {
  if (step.step_type === 'condition') return '🔀'
  if (step.step_type === 'delay') return '⏱️'
  if (step.step_type === 'loop') return '🔁'
  if (step.step_type === 'stop') return '🛑'
  if (step.step_type === 'transform') return '🔄'
  if (step.step_type === 'filter') return '🔍'
  
  if (step.action_type) {
    if (step.action_type.startsWith('crm')) return '👤'
    if (step.action_type.startsWith('email')) return '📧'
    if (step.action_type.startsWith('notification.send_sms')) return '📱'
    if (step.action_type.startsWith('notification.send_slack')) return '💬'
    if (step.action_type.startsWith('notification.send_discord')) return '🎮'
    if (step.action_type.startsWith('notification')) return '🔔'
    if (step.action_type.startsWith('webhook')) return '🌐'
    if (step.action_type.startsWith('data')) return '🗄️'
    if (step.action_type.startsWith('transform')) return '🔄'
    if (step.action_type.startsWith('ai')) return '🤖'
    if (step.action_type.startsWith('integration')) return '🔗'
    if (step.action_type.startsWith('flow.delay')) return '⏱️'
    if (step.action_type.startsWith('flow.condition')) return '🔀'
    if (step.action_type.startsWith('flow.loop')) return '🔁'
    if (step.action_type.startsWith('flow.stop')) return '🛑'
  }
  
  return '⚡'
}

function getStepColor(step: WorkflowStep): string {
  switch (step.step_type) {
    case 'condition':
      return 'border-l-yellow-500'
    case 'delay':
      return 'border-l-blue-500'
    case 'loop':
      return 'border-l-purple-500'
    case 'stop':
      return 'border-l-red-500'
    case 'transform':
    case 'filter':
      return 'border-l-orange-500'
    default:
      if (step.action_type?.startsWith('ai')) return 'border-l-violet-500'
      if (step.action_type?.startsWith('email') || step.action_type?.startsWith('notification')) {
        return 'border-l-green-500'
      }
      return 'border-l-primary'
  }
}

function formatActionName(step: WorkflowStep): string {
  if (step.name) return step.name
  
  if (step.action_type) {
    const parts = step.action_type.split('.')
    const action = parts[parts.length - 1]
    return action.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }
  
  return step.step_type.charAt(0).toUpperCase() + step.step_type.slice(1)
}

// ============================================================================
// SORTABLE STEP COMPONENT
// ============================================================================

interface SortableStepProps {
  step: WorkflowStep
  isSelected: boolean
  onClick: () => void
  onDelete: () => void
  onDuplicate?: () => void
}

function SortableStep({
  step,
  isSelected,
  onClick,
  onDelete,
  onDuplicate,
}: SortableStepProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: step.id,
    data: { type: "step", step },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Connector Line */}
      <div className="absolute left-1/2 -top-4 w-0.5 h-4 bg-border" />

      <Card
        className={`
          p-3 cursor-pointer transition-all border-l-4 ${getStepColor(step)}
          ${isSelected ? "ring-2 ring-primary shadow-md" : "hover:shadow-md hover:border-primary/50"}
          ${!step.is_active ? "opacity-60" : ""}
        `}
        onClick={onClick}
      >
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab hover:text-primary touch-none"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </div>

          {/* Icon */}
          <div className="text-xl flex-shrink-0">{getStepIcon(step)}</div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">
              {formatActionName(step)}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {step.description || step.action_type || step.step_type}
            </div>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onClick}>
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </DropdownMenuItem>
              {onDuplicate && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation()
                  onDuplicate()
                }}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status indicators */}
        {step.on_error === 'retry' && (
          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
            <span>🔄</span>
            <span>Retry on error ({step.max_retries}x)</span>
          </div>
        )}
      </Card>
    </div>
  )
}

// ============================================================================
// WORKFLOW CANVAS COMPONENT
// ============================================================================

export function WorkflowCanvas({
  steps,
  selectedStepId,
  onStepClick,
  onStepDelete,
  onStepDuplicate,
}: WorkflowCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: "canvas",
  })

  return (
    <div
      ref={setNodeRef}
      className={`
        min-h-full p-8 flex flex-col items-center
        ${isOver ? "bg-primary/5" : ""}
        transition-colors
      `}
    >
      {/* Start Node */}
      <div className="flex flex-col items-center mb-4">
        <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg">
          <Play className="h-6 w-6" />
        </div>
        <div className="text-xs font-medium mt-2 text-muted-foreground">Start</div>
        {steps.length > 0 && <div className="w-0.5 h-4 bg-border mt-2" />}
      </div>

      {/* Steps */}
      {steps.length > 0 ? (
        <SortableContext
          items={steps.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4 w-full max-w-md">
            {steps.map((step) => (
              <SortableStep
                key={step.id}
                step={step}
                isSelected={step.id === selectedStepId}
                onClick={() => onStepClick(step)}
                onDelete={() => onStepDelete(step.id)}
                onDuplicate={onStepDuplicate ? () => onStepDuplicate(step) : undefined}
              />
            ))}
          </div>
        </SortableContext>
      ) : (
        <div 
          className={`
            border-2 border-dashed rounded-lg p-8 text-center 
            transition-colors w-full max-w-md
            ${isOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"}
          `}
        >
          <div className="text-4xl mb-2">📥</div>
          <p className="text-muted-foreground font-medium">
            Drag actions here to build your workflow
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Or click an action in the palette to add it
          </p>
        </div>
      )}

      {/* End Node */}
      {steps.length > 0 && (
        <div className="flex flex-col items-center mt-4">
          <div className="w-0.5 h-4 bg-border mb-2" />
          <div className="w-10 h-10 rounded-full bg-muted border-2 flex items-center justify-center">
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="text-xs font-medium mt-2 text-muted-foreground">End</div>
        </div>
      )}

      {/* Drop hint when dragging */}
      {isOver && steps.length > 0 && (
        <div className="mt-4 p-4 border-2 border-dashed border-primary rounded-lg text-center">
          <p className="text-sm text-primary font-medium">Drop here to add step</p>
        </div>
      )}
    </div>
  )
}
