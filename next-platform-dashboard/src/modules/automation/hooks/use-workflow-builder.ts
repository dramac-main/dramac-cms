/**
 * useWorkflowBuilder Hook
 * 
 * Phase EM-57B: Automation Engine - Visual Builder & Advanced Features
 * 
 * Custom hook for managing workflow builder state including:
 * - Workflow CRUD operations
 * - Step management
 * - Drag and drop reordering
 * - Dirty state tracking
 * - Auto-save functionality
 */

"use client"

import { useState, useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { 
  getWorkflow, 
  createWorkflow, 
  updateWorkflow, 
  getWorkflowSteps,
  createWorkflowStep,
  updateWorkflowStep,
  deleteWorkflowStep,
  reorderWorkflowSteps,
} from '../actions/automation-actions'
import type { 
  Workflow, 
  WorkflowStep, 
  TriggerConfig,
  WorkflowUpdate,
  WorkflowStepUpdate 
} from '../types/automation-types'

// ============================================================================
// TYPES
// ============================================================================

export interface UseWorkflowBuilderOptions {
  autoSave?: boolean
  autoSaveDelay?: number
  onSave?: (workflow: Workflow) => void
  onError?: (error: string) => void
}

export interface UseWorkflowBuilderReturn {
  // State
  workflow: Workflow | null
  steps: WorkflowStep[]
  selectedStep: WorkflowStep | null
  isDirty: boolean
  isLoading: boolean
  isSaving: boolean
  error: string | null
  
  // Workflow actions
  setTrigger: (trigger: TriggerConfig) => void
  updateWorkflowData: (updates: WorkflowUpdate) => void
  saveWorkflow: () => Promise<boolean>
  
  // Step actions
  addStep: (step: Partial<WorkflowStep>) => void
  updateStep: (stepId: string, updates: WorkflowStepUpdate) => void
  deleteStep: (stepId: string) => void
  reorderSteps: (oldIndex: number, newIndex: number) => void
  selectStep: (step: WorkflowStep | null) => void
  
  // Utility
  resetBuilder: () => void
  loadWorkflow: (workflowId: string) => Promise<void>
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const DEFAULT_WORKFLOW: Partial<Workflow> = {
  name: 'Untitled Workflow',
  description: '',
  trigger_type: 'event',
  trigger_config: {},
  is_active: false,
  icon: '⚡',
  color: '#6366f1',
  category: 'general',
  tags: [],
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useWorkflowBuilder(
  workflowId: string | undefined,
  siteId: string,
  options: UseWorkflowBuilderOptions = {}
): UseWorkflowBuilderReturn {
  const {
    autoSave = false,
    autoSaveDelay = 2000,
    onSave,
    onError,
  } = options

  // Core state
  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [steps, setSteps] = useState<WorkflowStep[]>([])
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null)
  
  // UI state
  const [isDirty, setIsDirty] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Refs for auto-save
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const pendingChangesRef = useRef<WorkflowUpdate | null>(null)

  // ============================================================================
  // LOAD WORKFLOW
  // ============================================================================

  const loadWorkflow = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Load workflow
      const workflowResult = await getWorkflow(id)
      if (!workflowResult.success || !workflowResult.data) {
        throw new Error(workflowResult.error || 'Failed to load workflow')
      }
      setWorkflow(workflowResult.data)
      
      // Load steps
      const stepsResult = await getWorkflowSteps(id)
      if (stepsResult.success && stepsResult.data) {
        setSteps(stepsResult.data.sort((a, b) => a.position - b.position))
      }
      
      setIsDirty(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load workflow'
      setError(message)
      onError?.(message)
    } finally {
      setIsLoading(false)
    }
  }, [onError])

  // Load workflow on mount if ID provided
  useEffect(() => {
    if (workflowId) {
      loadWorkflow(workflowId)
    } else {
      // Create new workflow state
      setWorkflow({
        ...DEFAULT_WORKFLOW,
        site_id: siteId,
      } as Workflow)
      setSteps([])
      setIsDirty(false)
    }
  }, [workflowId, siteId, loadWorkflow])

  // ============================================================================
  // AUTO-SAVE
  // ============================================================================

  useEffect(() => {
    if (!autoSave || !isDirty || !workflow?.id) return

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      if (pendingChangesRef.current) {
        await saveWorkflow()
      }
    }, autoSaveDelay)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSave, autoSaveDelay, isDirty, workflow?.id])

  // ============================================================================
  // WORKFLOW ACTIONS
  // ============================================================================

  const setTrigger = useCallback((triggerConfig: TriggerConfig) => {
    setWorkflow(prev => {
      if (!prev) return prev
      return {
        ...prev,
        trigger_config: triggerConfig,
        trigger_type: triggerConfig.event_type ? 'event' : 
                      triggerConfig.cron ? 'schedule' : 
                      triggerConfig.endpoint_path ? 'webhook' : 'manual',
      }
    })
    setIsDirty(true)
  }, [])

  const updateWorkflowData = useCallback((updates: WorkflowUpdate) => {
    setWorkflow(prev => {
      if (!prev) return prev
      return { ...prev, ...updates }
    })
    pendingChangesRef.current = { ...pendingChangesRef.current, ...updates }
    setIsDirty(true)
  }, [])

  const saveWorkflow = useCallback(async (): Promise<boolean> => {
    if (!workflow) return false
    
    setIsSaving(true)
    setError(null)
    
    try {
      let savedWorkflow: Workflow

      if (workflow.id) {
        // Update existing workflow
        const result = await updateWorkflow(workflow.id, {
          name: workflow.name,
          description: workflow.description || undefined,
          trigger_type: workflow.trigger_type,
          trigger_config: workflow.trigger_config,
        })
        
        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to update workflow')
        }
        savedWorkflow = result.data
      } else {
        // Create new workflow
        const result = await createWorkflow(siteId, {
          name: workflow.name || 'Untitled Workflow',
          description: workflow.description || undefined,
          trigger_type: workflow.trigger_type,
          trigger_config: workflow.trigger_config,
        })
        
        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to create workflow')
        }
        savedWorkflow = result.data
      }
      
      setWorkflow(savedWorkflow)
      setIsDirty(false)
      pendingChangesRef.current = null
      onSave?.(savedWorkflow)
      
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save workflow'
      setError(message)
      onError?.(message)
      return false
    } finally {
      setIsSaving(false)
    }
  }, [workflow, siteId, onSave, onError])

  // ============================================================================
  // STEP ACTIONS
  // ============================================================================

  const addStep = useCallback(async (stepData: Partial<WorkflowStep>) => {
    if (!workflow?.id) {
      // Workflow not saved yet, save it first
      const saved = await saveWorkflow()
      if (!saved) {
        toast.error('Please save the workflow first')
        return
      }
    }

    const stepToCreate = {
      action_type: stepData.action_type || 'crm.update_contact',
      action_config: stepData.action_config || {},
      condition_config: (stepData.condition_config || undefined) as Record<string, unknown> | undefined,
      delay_config: (stepData.delay_config || undefined) as Record<string, unknown> | undefined,
      position: steps.length + 1,
      on_error: 'fail' as const,
      max_retries: 3,
      retry_delay_seconds: 60,
    }

    // Optimistic update with temp step
    const tempId = `temp-${Date.now()}`
    const tempStep: WorkflowStep = { 
      id: tempId,
      workflow_id: workflow!.id,
      name: stepData.name || 'New Step',
      step_type: stepData.step_type || 'action',
      position: stepToCreate.position,
      action_type: stepToCreate.action_type,
      action_config: stepToCreate.action_config,
      condition_config: stepData.condition_config || { operator: 'and', conditions: [] },
      delay_config: stepData.delay_config || { type: 'fixed', value: '0s' },
      loop_config: { source: '', itemVariable: 'item', maxIterations: 100 },
      parallel_config: { branches: [], waitForAll: true },
      input_mapping: {},
      output_key: null,
      on_error: stepToCreate.on_error,
      error_branch_step_id: null,
      max_retries: stepToCreate.max_retries,
      retry_delay_seconds: stepToCreate.retry_delay_seconds,
      description: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setSteps(prev => [...prev, tempStep])

    try {
      const result = await createWorkflowStep(workflow!.id, stepToCreate)
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to create step')
      }
      
      // Replace temp step with real step
      setSteps(prev => prev.map(s => s.id === tempId ? result.data! : s))
    } catch (err) {
      // Rollback optimistic update
      setSteps(prev => prev.filter(s => s.id !== tempId))
      const message = err instanceof Error ? err.message : 'Failed to add step'
      toast.error(message)
    }
  }, [workflow, steps.length, saveWorkflow])

  const updateStep = useCallback(async (stepId: string, updates: WorkflowStepUpdate) => {
    // Optimistic update
    setSteps(prev => prev.map(s => 
      s.id === stepId ? { ...s, ...updates } : s
    ))
    
    // Update selected step if it's the one being updated
    setSelectedStep(prev => 
      prev?.id === stepId ? { ...prev, ...updates } : prev
    )

    // Convert updates to server format (null -> undefined for optional fields)
    const serverUpdates: Partial<{
      action_type: string
      action_config: Record<string, unknown>
      position: number
      condition_config: Record<string, unknown>
      delay_config: Record<string, unknown>
      on_error: 'fail' | 'continue' | 'retry' | 'branch'
      max_retries: number
      retry_delay_seconds: number
    }> = {}
    
    if (updates.action_type) serverUpdates.action_type = updates.action_type
    if (updates.action_config) serverUpdates.action_config = updates.action_config
    if (updates.position !== undefined) serverUpdates.position = updates.position
    if (updates.condition_config) serverUpdates.condition_config = updates.condition_config as Record<string, unknown>
    if (updates.delay_config) serverUpdates.delay_config = updates.delay_config as Record<string, unknown>
    if (updates.on_error) serverUpdates.on_error = updates.on_error
    if (updates.max_retries !== undefined) serverUpdates.max_retries = updates.max_retries
    if (updates.retry_delay_seconds !== undefined) serverUpdates.retry_delay_seconds = updates.retry_delay_seconds

    try {
      const result = await updateWorkflowStep(stepId, serverUpdates)
      if (!result.success) {
        throw new Error(result.error || 'Failed to update step')
      }
    } catch (err) {
      // Rollback - reload steps
      if (workflow?.id) {
        const stepsResult = await getWorkflowSteps(workflow.id)
        if (stepsResult.success && stepsResult.data) {
          setSteps(stepsResult.data)
        }
      }
      const message = err instanceof Error ? err.message : 'Failed to update step'
      toast.error(message)
    }
  }, [workflow?.id])

  const deleteStep = useCallback(async (stepId: string) => {
    // Optimistic update
    const deletedStep = steps.find(s => s.id === stepId)
    setSteps(prev => prev.filter(s => s.id !== stepId))
    
    if (selectedStep?.id === stepId) {
      setSelectedStep(null)
    }

    try {
      const result = await deleteWorkflowStep(stepId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete step')
      }
    } catch (err) {
      // Rollback - add back deleted step
      if (deletedStep) {
        setSteps(prev => {
          const newSteps = [...prev, deletedStep]
          return newSteps.sort((a, b) => a.position - b.position)
        })
      }
      const message = err instanceof Error ? err.message : 'Failed to delete step'
      toast.error(message)
    }
  }, [steps, selectedStep?.id])

  const reorderSteps = useCallback(async (oldIndex: number, newIndex: number) => {
    if (!workflow?.id) return
    
    // Optimistic update
    const newSteps = [...steps]
    const [movedStep] = newSteps.splice(oldIndex, 1)
    newSteps.splice(newIndex, 0, movedStep)
    
    // Update positions
    const updatedSteps = newSteps.map((step, index) => ({
      ...step,
      position: index,
    }))
    
    setSteps(updatedSteps)

    try {
      const stepIds = updatedSteps.map(s => s.id)
      const result = await reorderWorkflowSteps(workflow.id, stepIds)
      if (!result.success) {
        throw new Error(result.error || 'Failed to reorder steps')
      }
    } catch (err) {
      // Rollback - restore original order
      const stepsResult = await getWorkflowSteps(workflow.id)
      if (stepsResult.success && stepsResult.data) {
        setSteps(stepsResult.data.sort((a, b) => a.position - b.position))
      }
      const message = err instanceof Error ? err.message : 'Failed to reorder steps'
      toast.error(message)
    }
  }, [workflow?.id, steps])

  const selectStep = useCallback((step: WorkflowStep | null) => {
    setSelectedStep(step)
  }, [])

  // ============================================================================
  // UTILITY
  // ============================================================================

  const resetBuilder = useCallback(() => {
    setWorkflow({
      ...DEFAULT_WORKFLOW,
      site_id: siteId,
    } as Workflow)
    setSteps([])
    setSelectedStep(null)
    setIsDirty(false)
    setError(null)
    pendingChangesRef.current = null
  }, [siteId])

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // State
    workflow,
    steps,
    selectedStep,
    isDirty,
    isLoading,
    isSaving,
    error,
    
    // Workflow actions
    setTrigger,
    updateWorkflowData,
    saveWorkflow,
    
    // Step actions
    addStep,
    updateStep,
    deleteStep,
    reorderSteps,
    selectStep,
    
    // Utility
    resetBuilder,
    loadWorkflow,
  }
}
