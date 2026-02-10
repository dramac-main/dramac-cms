/**
 * Pipeline Settings Dialog
 * 
 * Phase EM-50: CRM Module - Enterprise Ready
 * 
 * Dialog for managing pipeline settings, editing, and deleting pipelines
 */
'use client'

import { useState, useEffect } from 'react'
import { useCRM } from '../../context/crm-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { 
  Loader2, 
  Settings2, 
  Trash2, 
  AlertTriangle,
  Plus,
  ArrowUp,
  ArrowDown,
  Pencil,
  Check,
  X,
} from 'lucide-react'
import type { Pipeline, PipelineStage } from '../../types/crm-types'

interface PipelineSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pipeline: Pipeline | null
  onPipelineDeleted?: () => void
}

export function PipelineSettingsDialog({
  open,
  onOpenChange,
  pipeline,
  onPipelineDeleted
}: PipelineSettingsDialogProps) {
  const { 
    editPipeline, 
    removePipeline,
    addStage,
    editStage,
    removeStage,
    stages,
    deals,
    pipelines
  } = useCRM()
  
  // State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editingStageId, setEditingStageId] = useState<string | null>(null)
  const [editingStageName, setEditingStageName] = useState('')
  const [showAddStage, setShowAddStage] = useState(false)
  const [newStage, setNewStage] = useState({ name: '', color: '#6366f1', probability: 50, stage_type: 'open' as 'open' | 'won' | 'lost' })
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_default: false,
    deal_rotting_days: '30'
  })

  // Get stages for this pipeline
  const pipelineStages = stages
    .filter(s => s.pipeline_id === pipeline?.id)
    .sort((a, b) => a.position - b.position)

  // Get deals count for this pipeline
  const dealsInPipeline = deals.filter(d => d.pipeline_id === pipeline?.id)

  // Check if this is the only pipeline
  const isOnlyPipeline = pipelines.length <= 1

  // Load pipeline data when dialog opens
  useEffect(() => {
    if (pipeline && open) {
      setFormData({
        name: pipeline.name,
        description: pipeline.description || '',
        is_default: pipeline.is_default,
        deal_rotting_days: String(pipeline.deal_rotting_days || 30)
      })
    }
  }, [pipeline, open])

  // Handle input change
  const handleChange = <K extends keyof typeof formData>(
    field: K, 
    value: typeof formData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Handle save
  const handleSave = async () => {
    if (!pipeline) return
    
    if (!formData.name.trim()) {
      toast.error('Pipeline name is required')
      return
    }

    const rotting_days = parseInt(formData.deal_rotting_days) || 30
    if (rotting_days < 1 || rotting_days > 365) {
      toast.error('Deal rotting days must be between 1 and 365')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      await editPipeline(pipeline.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        is_default: formData.is_default,
        deal_rotting_days: rotting_days
      })
      
      toast.success('Pipeline settings saved')
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving pipeline:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save pipeline')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!pipeline) return
    
    setIsSubmitting(true)
    
    try {
      await removePipeline(pipeline.id)
      toast.success('Pipeline deleted')
      setShowDeleteConfirm(false)
      onOpenChange(false)
      onPipelineDeleted?.()
    } catch (error) {
      console.error('Error deleting pipeline:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete pipeline')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!pipeline) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              Pipeline Settings
            </DialogTitle>
            <DialogDescription>
              Manage settings for &quot;{pipeline.name}&quot;
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6 py-4">
              {/* Basic Settings */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Basic Settings</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Pipeline Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Sales Pipeline"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Describe this pipeline..."
                    rows={2}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deal_rotting_days">Deal Rotting Days</Label>
                    <Input
                      id="deal_rotting_days"
                      type="number"
                      min={1}
                      max={365}
                      value={formData.deal_rotting_days}
                      onChange={(e) => handleChange('deal_rotting_days', e.target.value)}
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      Days before a deal is considered stale
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Default Pipeline</Label>
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch
                        id="is_default"
                        checked={formData.is_default}
                        onCheckedChange={(checked) => handleChange('is_default', checked)}
                        disabled={isSubmitting || pipeline.is_default}
                      />
                      <Label htmlFor="is_default" className="font-normal text-sm">
                        {pipeline.is_default ? 'This is the default' : 'Set as default'}
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Stages Management */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Pipeline Stages</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{pipelineStages.length} stages</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setShowAddStage(true); setNewStage({ name: '', color: '#6366f1', probability: 50, stage_type: 'open' }) }}
                      disabled={isSubmitting}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>

                {/* Add Stage Form */}
                {showAddStage && (
                  <div className="p-3 border rounded-lg space-y-3 bg-muted/30">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Stage name"
                        value={newStage.name}
                        onChange={(e) => setNewStage(prev => ({ ...prev, name: e.target.value }))}
                        disabled={isSubmitting}
                      />
                      <Input
                        type="color"
                        value={newStage.color}
                        onChange={(e) => setNewStage(prev => ({ ...prev, color: e.target.value }))}
                        className="h-9 w-16"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Probability %</Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={newStage.probability}
                          onChange={(e) => setNewStage(prev => ({ ...prev, probability: parseInt(e.target.value) || 0 }))}
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Type</Label>
                        <select
                          className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                          value={newStage.stage_type}
                          onChange={(e) => setNewStage(prev => ({ ...prev, stage_type: e.target.value as 'open' | 'won' | 'lost' }))}
                          disabled={isSubmitting}
                        >
                          <option value="open">Open</option>
                          <option value="won">Won</option>
                          <option value="lost">Lost</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setShowAddStage(false)} disabled={isSubmitting}>
                        Cancel
                      </Button>
                      <Button size="sm" disabled={!newStage.name.trim() || isSubmitting} onClick={async () => {
                        if (!pipeline) return
                        setIsSubmitting(true)
                        try {
                          await addStage(pipeline.id, {
                            name: newStage.name.trim(),
                            color: newStage.color,
                            probability: newStage.probability,
                            stage_type: newStage.stage_type,
                            position: pipelineStages.length,
                          })
                          setShowAddStage(false)
                          toast.success('Stage added')
                        } catch (error) {
                          console.error('Error adding stage:', error)
                          toast.error('Failed to add stage')
                        } finally {
                          setIsSubmitting(false)
                        }
                      }}>
                        {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />}
                        Add Stage
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  {pipelineStages.map((stage, index) => (
                    <div 
                      key={stage.id}
                      className="flex items-center gap-2 p-2 rounded-md bg-muted/50"
                    >
                      {/* Reorder buttons */}
                      <div className="flex flex-col">
                        <button
                          className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                          disabled={index === 0 || isSubmitting}
                          onClick={async () => {
                            setIsSubmitting(true)
                            try {
                              const prev = pipelineStages[index - 1]
                              await editStage(stage.id, { position: prev.position })
                              await editStage(prev.id, { position: stage.position })
                            } catch (error) {
                              console.error('Error reordering:', error)
                              toast.error('Failed to reorder stages')
                            } finally {
                              setIsSubmitting(false)
                            }
                          }}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                          disabled={index === pipelineStages.length - 1 || isSubmitting}
                          onClick={async () => {
                            setIsSubmitting(true)
                            try {
                              const next = pipelineStages[index + 1]
                              await editStage(stage.id, { position: next.position })
                              await editStage(next.id, { position: stage.position })
                            } catch (error) {
                              console.error('Error reordering:', error)
                              toast.error('Failed to reorder stages')
                            } finally {
                              setIsSubmitting(false)
                            }
                          }}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                      </div>

                      <div 
                        className="w-3 h-3 rounded-full shrink-0" 
                        style={{ backgroundColor: stage.color }}
                      />

                      {/* Inline rename */}
                      {editingStageId === stage.id ? (
                        <Input
                          className="h-7 text-sm flex-1"
                          value={editingStageName}
                          onChange={(e) => setEditingStageName(e.target.value)}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter' && editingStageName.trim()) {
                              setIsSubmitting(true)
                              try {
                                await editStage(stage.id, { name: editingStageName.trim() })
                                setEditingStageId(null)
                                toast.success('Stage renamed')
                              } catch (error) {
                                console.error('Error renaming stage:', error)
                                toast.error('Failed to rename stage')
                              } finally {
                                setIsSubmitting(false)
                              }
                            } else if (e.key === 'Escape') {
                              setEditingStageId(null)
                            }
                          }}
                          autoFocus
                          disabled={isSubmitting}
                        />
                      ) : (
                        <span className="flex-1 text-sm">{stage.name}</span>
                      )}

                      <Badge variant="outline" className="text-xs shrink-0">
                        {stage.probability}%
                      </Badge>
                      <Badge 
                        variant={stage.stage_type === 'won' ? 'default' : stage.stage_type === 'lost' ? 'destructive' : 'secondary'}
                        className="text-xs shrink-0"
                      >
                        {stage.stage_type}
                      </Badge>

                      {/* Action buttons */}
                      {editingStageId === stage.id ? (
                        <div className="flex gap-1">
                          <button
                            className="p-1 hover:bg-muted rounded"
                            disabled={isSubmitting}
                            onClick={async () => {
                              if (!editingStageName.trim()) return
                              setIsSubmitting(true)
                              try {
                                await editStage(stage.id, { name: editingStageName.trim() })
                                setEditingStageId(null)
                                toast.success('Stage renamed')
                              } catch (error) {
                                console.error('Error renaming stage:', error)
                                toast.error('Failed to rename stage')
                              } finally {
                                setIsSubmitting(false)
                              }
                            }}
                          >
                            <Check className="h-3 w-3 text-green-600" />
                          </button>
                          <button className="p-1 hover:bg-muted rounded" onClick={() => setEditingStageId(null)}>
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <button
                            className="p-1 hover:bg-muted rounded"
                            disabled={isSubmitting}
                            onClick={() => { setEditingStageId(stage.id); setEditingStageName(stage.name) }}
                          >
                            <Pencil className="h-3 w-3 text-muted-foreground" />
                          </button>
                          <button
                            className="p-1 hover:bg-muted rounded disabled:opacity-30"
                            disabled={isSubmitting || pipelineStages.length <= 1}
                            onClick={async () => {
                              if (!confirm(`Delete stage "${stage.name}"? Deals in this stage will need to be moved.`)) return
                              setIsSubmitting(true)
                              try {
                                await removeStage(stage.id)
                                toast.success('Stage deleted')
                              } catch (error) {
                                console.error('Error deleting stage:', error)
                                toast.error('Failed to delete stage')
                              } finally {
                                setIsSubmitting(false)
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Danger Zone */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-destructive">Danger Zone</h4>
                
                <div className="p-4 border border-destructive/50 rounded-lg space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Delete this pipeline</p>
                      <p className="text-xs text-muted-foreground">
                        {dealsInPipeline.length > 0 
                          ? `This will also delete ${dealsInPipeline.length} deal${dealsInPipeline.length === 1 ? '' : 's'} in this pipeline.`
                          : 'This pipeline has no deals.'
                        }
                        {isOnlyPipeline && ' You cannot delete the only pipeline.'}
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isSubmitting || isOnlyPipeline}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Pipeline
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pipeline?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{pipeline.name}&quot;?
              {dealsInPipeline.length > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  This will permanently delete {dealsInPipeline.length} deal{dealsInPipeline.length === 1 ? '' : 's'}.
                </span>
              )}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Pipeline
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
