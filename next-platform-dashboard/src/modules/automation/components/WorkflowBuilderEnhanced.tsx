/**
 * WorkflowBuilderEnhanced Component
 * 
 * PHASE-UI-12A: Automation Workflow Builder UI
 * 
 * Main enhanced workflow builder integrating all UI-12A components:
 * - Three-panel layout (palette, canvas, config)
 * - Keyboard shortcuts support
 * - Auto-save indicator
 * - Test mode toggle
 */

"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
  closestCenter,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { useDroppable } from "@dnd-kit/core"
import { toast } from "sonner"
import {
  Plus,
  Search,
  ChevronRight,
  Loader2,
  Play,
  Square,
  Settings,
  X,
} from "lucide-react"

import { useWorkflowBuilder } from "../hooks/use-workflow-builder"
import { TriggerPanel } from "./workflow-builder/trigger-panel"
import { ActionPalette } from "./workflow-builder/action-palette"
import { StepConfigPanel } from "./workflow-builder/step-config-panel"

import {
  WorkflowHeader,
  WorkflowStepCard,
  WorkflowMiniMap,
  ActionSearchPalette,
  TriggerCard,
  StepConnectionLine,
} from "./ui"

import type { TriggerConfig, TriggerType, WorkflowStep } from "../types/automation-types"

// ============================================================================
// TYPES
// ============================================================================

interface WorkflowBuilderEnhancedProps {
  workflowId?: string
  siteId: string
  onSave?: (workflow: unknown) => void
  onClose?: () => void
}

// ============================================================================
// SORTABLE STEP WRAPPER
// ============================================================================

function SortableStepItem({
  step,
  isSelected,
  isFirst,
  isLast,
  onSelect,
  onDelete,
  onDuplicate,
  onToggleActive,
  onConfigure,
}: {
  step: WorkflowStep
  isSelected: boolean
  isFirst: boolean
  isLast: boolean
  onSelect: () => void
  onDelete: () => void
  onDuplicate: () => void
  onToggleActive: () => void
  onConfigure: () => void
}) {
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
    <div ref={setNodeRef} style={style}>
      {/* Connection Line */}
      {!isFirst && <StepConnectionLine length="short" animate />}

      <WorkflowStepCard
        id={step.id}
        stepType={step.step_type}
        actionType={step.action_type}
        name={step.name || step.action_type || step.step_type}
        description={step.description}
        isActive={step.is_active}
        isSelected={isSelected}
        position={step.position}
        showConnectionTop={false}
        showConnectionBottom={false}
        onSelect={onSelect}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onToggleActive={onToggleActive}
        onConfigure={onConfigure}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}

// ============================================================================
// DROPPABLE CANVAS
// ============================================================================

function DroppableCanvas({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: "canvas",
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-1 min-h-[400px] p-6 transition-colors rounded-lg",
        isOver && "bg-primary/5 ring-2 ring-dashed ring-primary/30"
      )}
    >
      {children}
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function WorkflowBuilderEnhanced({
  workflowId,
  siteId,
  onSave,
  onClose,
}: WorkflowBuilderEnhancedProps) {
  // Error handler
  const handleError = useCallback((err: string) => {
    toast.error(err)
  }, [])

  // Workflow builder hook
  const {
    workflow,
    steps,
    selectedStep,
    isDirty,
    isLoading,
    isSaving,
    error,
    setTrigger,
    updateWorkflowData,
    saveWorkflow,
    addStep,
    updateStep,
    deleteStep,
    reorderSteps,
    selectStep,
    resetBuilder: _resetBuilder,
  } = useWorkflowBuilder(workflowId, siteId, {
    onSave: onSave as ((workflow: unknown) => void) | undefined,
    onError: handleError,
  })

  // Local state
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showTriggerPanel, setShowTriggerPanel] = useState(false)
  const [showActionSearch, setShowActionSearch] = useState(false)
  const [showMiniMap, setShowMiniMap] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Keyboard shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K - Open action search
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setShowActionSearch(true)
      }
      // Cmd/Ctrl + S - Save
      if (e.key === "s" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleSave()
      }
      // Escape - Deselect step
      if (e.key === "Escape") {
        selectStep(null)
        setShowActionSearch(false)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [selectStep])

  // Handle trigger changes
  const handleTriggerChange = useCallback(
    (config: TriggerConfig, type: TriggerType) => {
      setTrigger({ ...config })
      updateWorkflowData({ trigger_type: type, trigger_config: config })
      setShowTriggerPanel(false)
    },
    [setTrigger, updateWorkflowData]
  )

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActiveId(null)

      if (!over) return

      // Drop from palette onto canvas
      if (active.data.current?.type === "palette-item" && over.id === "canvas") {
        const actionType = active.data.current.actionType
        const actionName = active.data.current.name

        let stepType: WorkflowStep["step_type"] = "action"
        if (actionType.startsWith("flow.delay")) stepType = "delay"
        if (actionType.startsWith("flow.condition")) stepType = "condition"
        if (actionType.startsWith("flow.loop")) stepType = "loop"
        if (actionType.startsWith("flow.stop")) stepType = "stop"

        addStep({
          step_type: stepType,
          action_type: actionType,
          name: actionName,
        })

        toast.success(`Added "${actionName}" step`)
      }

      // Reorder steps
      if (
        active.data.current?.type === "step" &&
        over.data.current?.type === "step"
      ) {
        const oldIndex = steps.findIndex((s) => s.id === active.id)
        const newIndex = steps.findIndex((s) => s.id === over.id)
        if (oldIndex !== newIndex && oldIndex !== -1 && newIndex !== -1) {
          reorderSteps(oldIndex, newIndex)
        }
      }
    },
    [steps, addStep, reorderSteps]
  )

  // Handle save
  const handleSave = async () => {
    const success = await saveWorkflow()
    if (success) {
      setLastSaved(new Date())
      toast.success("Workflow saved successfully")
    }
  }

  // Handle action selection from search palette
  const handleActionSelect = useCallback(
    (action: { id: string; name: string }) => {
      let stepType: WorkflowStep["step_type"] = "action"
      if (action.id.startsWith("flow.delay")) stepType = "delay"
      if (action.id.startsWith("flow.condition")) stepType = "condition"
      if (action.id.startsWith("flow.loop")) stepType = "loop"
      if (action.id.startsWith("flow.stop")) stepType = "stop"

      addStep({
        step_type: stepType,
        action_type: action.id,
        name: action.name,
      })

      toast.success(`Added "${action.name}" step`)
    },
    [addStep]
  )

  // Handle step toggle active
  const handleToggleStepActive = useCallback(
    (stepId: string) => {
      const step = steps.find((s) => s.id === stepId)
      if (step) {
        updateStep(stepId, { is_active: !step.is_active })
      }
    },
    [steps, updateStep]
  )

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading workflow...</p>
        </div>
      </div>
    )
  }

  const sortedSteps = [...steps].sort((a, b) => a.position - b.position)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <WorkflowHeader
        siteId={siteId}
        workflowId={workflowId}
        workflowName={workflow?.name || "Untitled Workflow"}
        isActive={workflow?.is_active || false}
        isDirty={isDirty}
        isSaving={isSaving}
        lastSaved={lastSaved}
        onNameChange={(name) => updateWorkflowData({ name })}
        onActiveChange={(active) => updateWorkflowData({ is_active: active })}
        onSave={handleSave}
        onTest={() => toast.info("Test mode coming soon!")}
        onRun={() => toast.info("Manual run coming soon!")}
      />

      {/* Main Content */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <ResizablePanelGroup orientation="horizontal" className="flex-1">
          {/* Left Panel - Actions Palette */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
            <div className="h-full border-r flex flex-col">
              {/* Trigger Section */}
              <div className="p-3 border-b">
                <TriggerCard
                  triggerType={workflow?.trigger_type || "event"}
                  triggerConfig={workflow?.trigger_config}
                  isConfigured={!!workflow?.trigger_config?.event_type}
                  onEdit={() => setShowTriggerPanel(true)}
                />
              </div>

              {/* Actions Palette */}
              <div className="flex-1 overflow-hidden">
                <div className="p-3 border-b">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowActionSearch(true)}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Search actions...
                    <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px]">
                      ⌘K
                    </kbd>
                  </Button>
                </div>
                <ScrollArea className="h-[calc(100%-60px)]">
                  <ActionPalette />
                </ScrollArea>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Center Panel - Canvas */}
          <ResizablePanel defaultSize={50} minSize={40}>
            <div className="h-full flex flex-col">
              {/* Mini Map Toggle */}
              {showMiniMap && (
                <div className="absolute right-4 top-4 z-10 w-[200px]">
                  <WorkflowMiniMap
                    steps={steps}
                    selectedStepId={selectedStep?.id}
                    triggerType={workflow?.trigger_type}
                    onStepClick={(id) => {
                      const step = steps.find((s) => s.id === id)
                      if (step) selectStep(step)
                    }}
                  />
                </div>
              )}

              <ScrollArea className="flex-1" ref={canvasRef}>
                <DroppableCanvas>
                  <div className="max-w-md mx-auto py-8">
                    {/* Start Node */}
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-center mb-4"
                    >
                      <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border-2 border-green-500/50 rounded-full">
                        <Play className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium text-green-600">
                          Start
                        </span>
                      </div>
                    </motion.div>

                    {/* Connection from Start */}
                    {(sortedSteps.length > 0 || true) && (
                      <StepConnectionLine length="short" animate />
                    )}

                    {/* Steps */}
                    <SortableContext
                      items={sortedSteps.map((s) => s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {sortedSteps.map((step, index) => (
                        <SortableStepItem
                          key={step.id}
                          step={step}
                          isSelected={selectedStep?.id === step.id}
                          isFirst={index === 0}
                          isLast={index === sortedSteps.length - 1}
                          onSelect={() => selectStep(step)}
                          onDelete={() => {
                            deleteStep(step.id)
                            toast.success("Step deleted")
                          }}
                          onDuplicate={() => {
                            addStep({
                              step_type: step.step_type,
                              action_type: step.action_type,
                              action_config: { ...step.action_config },
                              name: `${step.name || "Step"} (Copy)`,
                            })
                            toast.success("Step duplicated")
                          }}
                          onToggleActive={() => handleToggleStepActive(step.id)}
                          onConfigure={() => selectStep(step)}
                        />
                      ))}
                    </SortableContext>

                    {/* Add Step Button */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="flex justify-center mt-4"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-dashed"
                        onClick={() => setShowActionSearch(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Step
                      </Button>
                    </motion.div>

                    {/* Connection to End */}
                    <StepConnectionLine length="short" animate />

                    {/* End Node */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="flex justify-center mt-4"
                    >
                      <div className="flex items-center gap-2 px-4 py-2 bg-muted border-2 border-muted-foreground/30 rounded-full">
                        <Square className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">
                          End
                        </span>
                      </div>
                    </motion.div>
                  </div>
                </DroppableCanvas>
              </ScrollArea>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Right Panel - Step Configuration */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
            <div className="h-full border-l">
              <AnimatePresence mode="wait">
                {selectedStep ? (
                  <motion.div
                    key="config"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="h-full"
                  >
                    <StepConfigPanel
                      step={selectedStep}
                      onUpdate={updateStep}
                      onClose={() => selectStep(null)}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex items-center justify-center p-6"
                  >
                    <div className="text-center space-y-3">
                      <Settings className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Select a step to configure
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Or press <kbd className="px-1 py-0.5 rounded bg-muted text-xs">⌘K</kbd> to
                        add a new step
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId && (
            <Card className="p-3 shadow-lg opacity-80">
              <span className="text-sm font-medium">Moving step...</span>
            </Card>
          )}
        </DragOverlay>
      </DndContext>

      {/* Trigger Config Sheet */}
      <Sheet open={showTriggerPanel} onOpenChange={setShowTriggerPanel}>
        <SheetContent side="left" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Configure Trigger</SheetTitle>
            <SheetDescription>
              Define when this workflow should run
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <TriggerPanel
              trigger={workflow?.trigger_config}
              triggerType={workflow?.trigger_type}
              onTriggerChange={handleTriggerChange}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Action Search Palette */}
      <ActionSearchPalette
        open={showActionSearch}
        onOpenChange={setShowActionSearch}
        onSelectAction={handleActionSelect}
      />
    </div>
  )
}
