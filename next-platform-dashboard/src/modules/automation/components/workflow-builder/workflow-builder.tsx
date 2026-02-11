/**
 * WorkflowBuilder Component
 * 
 * Phase EM-57B: Automation Engine - Visual Builder & Advanced Features
 * 
 * Main visual workflow builder that combines:
 * - TriggerPanel (left sidebar top)
 * - ActionPalette (left sidebar bottom)
 * - WorkflowCanvas (center)
 * - StepConfigPanel (right sidebar)
 * 
 * Uses @dnd-kit for drag and drop functionality.
 */

"use client"

import { useState, useCallback, useRef } from "react"
import { 
  DndContext, 
  DragOverlay, 
  useSensor, 
  useSensors, 
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
  closestCenter
} from "@dnd-kit/core"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Save, 
  Play, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  Settings,
  Undo2,
  ArrowLeft
} from "lucide-react"
import { toast } from "sonner"

import { TriggerPanel } from "./trigger-panel"
import { ActionPalette } from "./action-palette"
import { WorkflowCanvas } from "./workflow-canvas"
import { StepConfigPanel } from "./step-config-panel"
import { useWorkflowBuilder } from "../../hooks/use-workflow-builder"
import { triggerWorkflow } from "../../actions/automation-actions"
import type { TriggerConfig, TriggerType, WorkflowStep } from "../../types/automation-types"

// ============================================================================
// TYPES
// ============================================================================

interface WorkflowBuilderProps {
  workflowId?: string
  siteId: string
  onSave?: (workflow: unknown) => void
  onClose?: () => void
}

// ============================================================================
// COMPONENT
// ============================================================================

export function WorkflowBuilder({ 
  workflowId, 
  siteId, 
  onSave,
  onClose 
}: WorkflowBuilderProps) {
  // Memoize error handler to prevent unnecessary re-renders
  const handleError = useCallback((err: string) => {
    toast.error(err)
  }, [])

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

  const [activeId, setActiveId] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Handle trigger changes
  const handleTriggerChange = useCallback((config: TriggerConfig, type: TriggerType) => {
    setTrigger({ ...config })
    updateWorkflowData({ trigger_type: type, trigger_config: config })
  }, [setTrigger, updateWorkflowData])

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    // Check if dropping from palette onto canvas
    if (active.data.current?.type === "palette-item" && over.id === "canvas") {
      const actionType = active.data.current.actionType
      const actionName = active.data.current.name
      
      // Determine step type based on action
      let stepType: WorkflowStep['step_type'] = 'action'
      if (actionType.startsWith('flow.delay')) stepType = 'delay'
      if (actionType.startsWith('flow.condition')) stepType = 'condition'
      if (actionType.startsWith('flow.loop')) stepType = 'loop'
      if (actionType.startsWith('flow.stop')) stepType = 'stop'
      
      addStep({
        step_type: stepType,
        action_type: actionType,
        name: actionName,
      })
      
      toast.success(`Added "${actionName}" step`)
    }

    // Check if reordering steps
    if (active.data.current?.type === "step" && over.data.current?.type === "step") {
      const oldIndex = steps.findIndex((s) => s.id === active.id)
      const newIndex = steps.findIndex((s) => s.id === over.id)
      if (oldIndex !== newIndex && oldIndex !== -1 && newIndex !== -1) {
        reorderSteps(oldIndex, newIndex)
      }
    }
  }, [steps, addStep, reorderSteps])

  // Handle save
  const handleSave = async () => {
    const success = await saveWorkflow()
    if (success) {
      toast.success("Workflow saved successfully")
    }
  }

  // Handle test run
  const [isTestRunning, setIsTestRunning] = useState(false)
  const handleTestRun = async () => {
    if (!workflow?.id) {
      toast.error("Please save the workflow first")
      return
    }
    if (isDirty) {
      toast.error("Please save your changes before running a test")
      return
    }
    setIsTestRunning(true)
    try {
      const result = await triggerWorkflow(workflow.id, { test: true, source: 'builder_test_run' })
      if (!result.success) {
        throw new Error(result.error || 'Test run failed')
      }
      toast.success(`Test run started (Execution: ${result.executionId?.slice(0, 8)}...)`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Test run failed'
      toast.error(message)
    } finally {
      setIsTestRunning(false)
    }
  }

  // Handle duplicate step
  const handleDuplicateStep = useCallback((step: WorkflowStep) => {
    addStep({
      step_type: step.step_type,
      action_type: step.action_type,
      action_config: { ...step.action_config },
      condition_config: { ...step.condition_config },
      delay_config: { ...step.delay_config },
      name: `${step.name || 'Step'} (Copy)`,
      description: step.description,
    })
    toast.success("Step duplicated")
  }, [addStep])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Loading workflow...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !workflow) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-center space-y-4">
          <AlertCircle className="h-8 w-8 mx-auto text-destructive" />
          <p className="text-destructive">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-background">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/sites/${siteId}/automation`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="h-6 border-l" />
            <Input
              type="text"
              value={workflow?.name || "Untitled Workflow"}
              onChange={(e) => updateWorkflowData({ name: e.target.value })}
              className="text-xl font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 w-[300px]"
            />
            {isDirty && (
              <Badge variant="secondary" className="text-xs">
                Unsaved changes
              </Badge>
            )}
            {workflow?.is_active && (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleTestRun}
              disabled={!workflow?.id || isTestRunning}
            >
              {isTestRunning ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {isTestRunning ? "Running..." : "Test Run"}
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave} 
              disabled={!isDirty || isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSaving ? "Saving..." : "Save Workflow"}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Trigger & Actions */}
          <div className="w-64 border-r flex flex-col overflow-hidden bg-background">
            <TriggerPanel
              trigger={workflow?.trigger_config}
              triggerType={workflow?.trigger_type}
              onTriggerChange={handleTriggerChange}
            />
            <ActionPalette />
          </div>

          {/* Canvas */}
          <div 
            className="flex-1 overflow-auto bg-muted/30" 
            ref={canvasRef}
          >
            <WorkflowCanvas
              steps={steps}
              selectedStepId={selectedStep?.id}
              onStepClick={selectStep}
              onStepDelete={deleteStep}
              onStepDuplicate={handleDuplicateStep}
            />
          </div>

          {/* Right Sidebar - Step Config */}
          {selectedStep && (
            <div className="w-80 border-l overflow-hidden bg-background">
              <StepConfigPanel
                step={selectedStep}
                onUpdate={updateStep}
                onClose={() => selectStep(null)}
              />
            </div>
          )}

          {/* Settings Panel */}
          {showSettings && !selectedStep && (
            <div className="w-80 border-l overflow-y-auto bg-background p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Workflow Settings</h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowSettings(false)}
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={workflow?.description || ''}
                    onChange={(e) => updateWorkflowData({ description: e.target.value })}
                    placeholder="What does this workflow do?"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Input
                    value={workflow?.category || ''}
                    onChange={(e) => updateWorkflowData({ category: e.target.value })}
                    placeholder="e.g., Marketing, Sales"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Icon</label>
                  <Input
                    value={workflow?.icon || 'Zap'}
                    onChange={(e) => updateWorkflowData({ icon: e.target.value })}
                    placeholder="Icon name"
                    maxLength={20}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Active</label>
                    <p className="text-xs text-muted-foreground">
                      Enable workflow execution
                    </p>
                  </div>
                  <Button
                    variant={workflow?.is_active ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateWorkflowData({ is_active: !workflow?.is_active })}
                  >
                    {workflow?.is_active ? "Active" : "Inactive"}
                  </Button>
                </div>

                <div className="pt-4 border-t space-y-4">
                  <h4 className="text-sm font-medium">Execution Settings</h4>
                  
                  <div className="space-y-2">
                    <label className="text-sm">Max executions per hour</label>
                    <Input
                      type="number"
                      min={1}
                      value={workflow?.max_executions_per_hour || 100}
                      onChange={(e) => updateWorkflowData({ 
                        max_executions_per_hour: Number(e.target.value) 
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm">Timeout (seconds)</label>
                    <Input
                      type="number"
                      min={10}
                      value={workflow?.timeout_seconds || 300}
                      onChange={(e) => updateWorkflowData({ 
                        timeout_seconds: Number(e.target.value) 
                      })}
                    />
                  </div>
                </div>

                {workflow?.id && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Statistics</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 bg-muted rounded">
                        <div className="text-muted-foreground text-xs">Total Runs</div>
                        <div className="font-semibold">{workflow.total_runs || 0}</div>
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <div className="text-muted-foreground text-xs">Success Rate</div>
                        <div className="font-semibold">
                          {workflow.total_runs 
                            ? Math.round((workflow.successful_runs / workflow.total_runs) * 100)
                            : 0}%
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeId && (
          <Card className="p-3 shadow-lg opacity-90 bg-background">
            <span className="text-sm font-medium">Dragging step...</span>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  )
}
