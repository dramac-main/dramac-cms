/**
 * Create Pipeline Dialog
 * 
 * Phase EM-50: CRM Module - Enterprise Ready
 * 
 * Dialog for creating new pipelines with customizable settings
 */
'use client'

import { useState } from 'react'
import { useCRM } from '../../context/crm-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2, TrendingUp, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Local form data interface
interface FormData {
  name: string
  description: string
  is_default: boolean
  deal_rotting_days: string
}

interface CreatePipelineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (pipelineId: string) => void
}

export function CreatePipelineDialog({
  open,
  onOpenChange,
  onSuccess
}: CreatePipelineDialogProps) {
  const { addPipeline, pipelines } = useCRM()
  
  // State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    is_default: false,
    deal_rotting_days: '30'
  })

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      is_default: pipelines.length === 0, // First pipeline should be default
      deal_rotting_days: '30'
    })
  }

  // Handle dialog close
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm()
    }
    onOpenChange(newOpen)
  }

  // Handle input change
  const handleChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name.trim()) {
      toast.error('Please enter a pipeline name')
      return
    }

    const rotting_days = parseInt(formData.deal_rotting_days) || 30
    if (rotting_days < 1 || rotting_days > 365) {
      toast.error('Deal rotting days must be between 1 and 365')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const pipeline = await addPipeline({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        is_default: formData.is_default,
        deal_rotting_days: rotting_days,
        is_active: true
      })
      
      toast.success(`Pipeline "${pipeline.name}" created with default stages`)
      handleOpenChange(false)
      onSuccess?.(pipeline.id)
    } catch (error) {
      console.error('Error creating pipeline:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create pipeline')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFirstPipeline = pipelines.length === 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Create Pipeline
          </DialogTitle>
          <DialogDescription>
            Create a new sales pipeline to track your deals through stages
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Info Alert for first pipeline */}
          {isFirstPipeline && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This will be your first pipeline and will be set as default. 
                Default stages (Lead, Qualified, Proposal, Negotiation, Won, Lost) will be created automatically.
              </AlertDescription>
            </Alert>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Pipeline Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Sales Pipeline, Enterprise Deals, Partner Channel"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the purpose of this pipeline..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Deal Rotting Days */}
          <div className="space-y-2">
            <Label htmlFor="deal_rotting_days">Deal Rotting Days</Label>
            <Input
              id="deal_rotting_days"
              type="number"
              min={1}
              max={365}
              placeholder="30"
              value={formData.deal_rotting_days}
              onChange={(e) => handleChange('deal_rotting_days', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Number of days a deal can remain inactive before it&apos;s considered stale (1-365)
            </p>
          </div>

          {/* Default Pipeline Toggle */}
          {!isFirstPipeline && (
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="is_default">Set as Default Pipeline</Label>
                <p className="text-xs text-muted-foreground">
                  New deals will be added to this pipeline by default
                </p>
              </div>
              <Switch
                id="is_default"
                checked={formData.is_default}
                onCheckedChange={(checked) => handleChange('is_default', checked)}
              />
            </div>
          )}

          {/* Default Stages Info */}
          <div className="rounded-lg border p-4 bg-muted/30">
            <p className="text-sm font-medium mb-2">Default Stages</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 text-xs rounded-md bg-slate-200 dark:bg-slate-700">Lead (10%)</span>
              <span className="px-2 py-1 text-xs rounded-md bg-blue-200 dark:bg-blue-900">Qualified (25%)</span>
              <span className="px-2 py-1 text-xs rounded-md bg-purple-200 dark:bg-purple-900">Proposal (50%)</span>
              <span className="px-2 py-1 text-xs rounded-md bg-amber-200 dark:bg-amber-900">Negotiation (75%)</span>
              <span className="px-2 py-1 text-xs rounded-md bg-green-200 dark:bg-green-900">Won (100%)</span>
              <span className="px-2 py-1 text-xs rounded-md bg-red-200 dark:bg-red-900">Lost (0%)</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              You can customize stages after creating the pipeline
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Pipeline'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreatePipelineDialog
