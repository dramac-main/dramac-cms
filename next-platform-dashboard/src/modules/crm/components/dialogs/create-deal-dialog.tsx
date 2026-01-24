/**
 * Create Deal Dialog
 * 
 * Phase EM-50: CRM Module - Enterprise Ready
 * 
 * Dialog for creating new deals
 */
'use client'

import { useState, useEffect } from 'react'
import { useCRM } from '../../context/crm-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { DealStatus, PipelineStage } from '../../types/crm-types'

// Local form data interface (excludes site_id which is added by context)
interface FormData {
  name: string
  amount: string
  pipeline_id: string
  stage_id: string
  contact_id: string
  company_id: string
  status: DealStatus
  probability: string
  expected_close_date: string
  description: string
  currency: string
}

interface CreateDealDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultPipelineId?: string
  defaultStageId?: string
  defaultContactId?: string
  defaultCompanyId?: string
  onSuccess?: (dealId: string) => void
}

export function CreateDealDialog({
  open,
  onOpenChange,
  defaultPipelineId,
  defaultStageId,
  defaultContactId,
  defaultCompanyId,
  onSuccess
}: CreateDealDialogProps) {
  const { addDeal, pipelines, contacts, companies, getStages } = useCRM()
  
  // State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [formData, setFormData] = useState<FormData>({
    name: '',
    amount: '',
    pipeline_id: defaultPipelineId || '',
    stage_id: defaultStageId || '',
    contact_id: defaultContactId || '',
    company_id: defaultCompanyId || '',
    status: 'open',
    probability: '0',
    expected_close_date: '',
    description: '',
    currency: 'USD'
  })

  // Load stages when pipeline changes
  useEffect(() => {
    if (formData.pipeline_id) {
      const loadStages = async () => {
        const pipelineStages = await getStages(formData.pipeline_id)
        setStages(pipelineStages)
        
        // Auto-select first stage if not set
        if (!formData.stage_id && pipelineStages.length > 0) {
          setFormData(prev => ({ 
            ...prev, 
            stage_id: pipelineStages[0].id,
            probability: String(pipelineStages[0].probability || 0)
          }))
        }
      }
      loadStages()
    } else {
      setStages([])
    }
  }, [formData.pipeline_id, getStages])

  // Set default pipeline on open
  useEffect(() => {
    if (open && pipelines.length > 0 && !formData.pipeline_id) {
      const defaultPipeline = pipelines.find(p => p.is_default) || pipelines[0]
      setFormData(prev => ({ ...prev, pipeline_id: defaultPipeline.id }))
    }
  }, [open, pipelines, formData.pipeline_id])

  // Reset form
  const resetForm = () => {
    const defaultPipeline = pipelines.find(p => p.is_default) || pipelines[0]
    setFormData({
      name: '',
      amount: '',
      pipeline_id: defaultPipeline?.id || '',
      stage_id: '',
      contact_id: defaultContactId || '',
      company_id: defaultCompanyId || '',
      status: 'open',
      probability: '0',
      expected_close_date: '',
      description: '',
      currency: 'USD'
    })
  }

  // Handle input change
  const handleChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      
      // Update probability when stage changes
      if (field === 'stage_id') {
        const stage = stages.find(s => s.id === value)
        if (stage) {
          updated.probability = String(stage.probability || 0)
        }
      }
      
      return updated
    })
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name.trim()) {
      toast.error('Deal name is required')
      return
    }
    
    if (!formData.pipeline_id) {
      toast.error('Please select a pipeline')
      return
    }
    
    if (!formData.stage_id) {
      toast.error('Please select a stage')
      return
    }

    setIsSubmitting(true)
    
    try {
      const deal = await addDeal({
        name: formData.name,
        amount: formData.amount ? parseFloat(formData.amount) : undefined,
        pipeline_id: formData.pipeline_id || undefined,
        stage_id: formData.stage_id || undefined,
        contact_id: formData.contact_id || undefined,
        company_id: formData.company_id || undefined,
        status: formData.status,
        probability: parseFloat(formData.probability) || 0,
        expected_close_date: formData.expected_close_date || undefined,
        description: formData.description || undefined,
        currency: formData.currency
      })
      
      if (deal) {
        toast.success('Deal created successfully')
        resetForm()
        onOpenChange(false)
        onSuccess?.(deal.id)
      }
    } catch (error) {
      console.error('Failed to create deal:', error)
      toast.error('Failed to create deal')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Deal</DialogTitle>
          <DialogDescription>
            Add a new deal to your pipeline
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Deal Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Deal Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enterprise Software License"
              disabled={isSubmitting}
            />
          </div>
          
          {/* Value & Currency */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="amount">Deal Value</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                placeholder="50000"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(v) => handleChange('currency', v)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                  <SelectItem value="AUD">AUD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Pipeline & Stage */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pipeline">Pipeline *</Label>
              <Select
                value={formData.pipeline_id}
                onValueChange={(v) => {
                  handleChange('pipeline_id', v)
                  handleChange('stage_id', '') // Reset stage when pipeline changes
                }}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pipeline" />
                </SelectTrigger>
                <SelectContent>
                  {pipelines.map(pipeline => (
                    <SelectItem key={pipeline.id} value={pipeline.id}>
                      {pipeline.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage">Stage *</Label>
              <Select
                value={formData.stage_id}
                onValueChange={(v) => handleChange('stage_id', v)}
                disabled={isSubmitting || !formData.pipeline_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map(stage => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name} ({stage.probability}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Contact & Company */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact">Contact</Label>
              <Select
                value={formData.contact_id}
                onValueChange={(v) => handleChange('contact_id', v)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select contact" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {contacts.map(contact => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.first_name} {contact.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Select
                value={formData.company_id}
                onValueChange={(v) => handleChange('company_id', v)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Probability & Close Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="probability">Probability (%)</Label>
              <Input
                id="probability"
                type="number"
                min="0"
                max="100"
                value={formData.probability}
                onChange={(e) => handleChange('probability', e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expected_close_date">Expected Close</Label>
              <Input
                id="expected_close_date"
                type="date"
                value={formData.expected_close_date}
                onChange={(e) => handleChange('expected_close_date', e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Deal details, requirements, notes..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Deal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateDealDialog
