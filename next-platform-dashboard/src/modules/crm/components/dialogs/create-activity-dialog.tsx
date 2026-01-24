/**
 * Create Activity Dialog
 * 
 * Phase EM-50: CRM Module - Enterprise Ready
 * 
 * Dialog for logging new activities
 */
'use client'

import { useState } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Loader2, Phone, Mail, Calendar, CheckCircle2, FileText, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ActivityType } from '../../types/crm-types'

// Local form data interface (excludes site_id which is added by context)
interface FormData {
  activity_type: ActivityType
  subject: string
  description: string
  contact_id: string
  deal_id: string
  company_id: string
  outcome: string
  call_duration_seconds: string
  task_due_date: string
  task_completed: boolean
}

interface CreateActivityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultContactId?: string
  defaultDealId?: string
  defaultCompanyId?: string
  defaultType?: ActivityType
  onSuccess?: (activityId: string) => void
}

const activityTypes: Array<{ value: ActivityType; label: string; icon: React.ElementType }> = [
  { value: 'call', label: 'Call', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'meeting', label: 'Meeting', icon: Calendar },
  { value: 'task', label: 'Task', icon: CheckCircle2 },
  { value: 'note', label: 'Note', icon: FileText },
  { value: 'sms', label: 'SMS', icon: MessageSquare },
]

export function CreateActivityDialog({
  open,
  onOpenChange,
  defaultContactId,
  defaultDealId,
  defaultCompanyId,
  defaultType = 'note',
  onSuccess
}: CreateActivityDialogProps) {
  const { addActivity, contacts, deals, companies } = useCRM()
  
  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    activity_type: defaultType,
    subject: '',
    description: '',
    contact_id: defaultContactId || '',
    deal_id: defaultDealId || '',
    company_id: defaultCompanyId || '',
    outcome: '',
    call_duration_seconds: '',
    task_due_date: '',
    task_completed: false
  })

  // Reset form
  const resetForm = () => {
    setFormData({
      activity_type: defaultType,
      subject: '',
      description: '',
      contact_id: defaultContactId || '',
      deal_id: defaultDealId || '',
      company_id: defaultCompanyId || '',
      outcome: '',
      call_duration_seconds: '',
      task_due_date: '',
      task_completed: false
    })
  }

  // Handle input change
  const handleChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (formData.activity_type === 'task' && !formData.subject?.trim()) {
      toast.error('Task subject is required')
      return
    }

    setIsSubmitting(true)
    
    try {
      const activity = await addActivity({
        activity_type: formData.activity_type,
        subject: formData.subject || undefined,
        description: formData.description || undefined,
        contact_id: formData.contact_id && formData.contact_id !== 'none' ? formData.contact_id : undefined,
        deal_id: formData.deal_id && formData.deal_id !== 'none' ? formData.deal_id : undefined,
        company_id: formData.company_id && formData.company_id !== 'none' ? formData.company_id : undefined,
        outcome: formData.outcome && formData.outcome !== 'not_specified' ? formData.outcome : undefined,
        call_duration_seconds: formData.call_duration_seconds ? parseInt(formData.call_duration_seconds) : undefined,
        task_due_date: formData.task_due_date || undefined,
        task_completed: formData.task_completed
      })
      
      if (activity) {
        toast.success('Activity logged successfully')
        resetForm()
        onOpenChange(false)
        onSuccess?.(activity.id)
      }
    } catch (error) {
      console.error('Failed to log activity:', error)
      toast.error('Failed to log activity')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isTask = formData.activity_type === 'task'
  const isCall = formData.activity_type === 'call'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Log Activity</DialogTitle>
          <DialogDescription>
            Record an activity for your CRM
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Activity Type Selector */}
          <div className="space-y-2">
            <Label>Activity Type</Label>
            <div className="grid grid-cols-6 gap-2">
              {activityTypes.map(type => {
                const Icon = type.icon
                const isSelected = formData.activity_type === type.value
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleChange('activity_type', type.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-2 rounded-lg border transition-all",
                      isSelected 
                        ? "border-primary bg-primary/10" 
                        : "border-muted hover:border-muted-foreground/50"
                    )}
                    disabled={isSubmitting}
                  >
                    <Icon className={cn("h-4 w-4", isSelected && "text-primary")} />
                    <span className="text-xs">{type.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
          
          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">
              {isTask ? 'Task Subject *' : 'Subject'}
            </Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
              placeholder={
                isTask ? "Follow up with client" : 
                isCall ? "Call with prospect" :
                "Subject (optional)"
              }
              disabled={isSubmitting}
            />
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              {formData.activity_type === 'note' ? 'Note' : 'Description'}
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder={
                formData.activity_type === 'note' 
                  ? "Write your note here..."
                  : "Activity details..."
              }
              rows={4}
              disabled={isSubmitting}
            />
          </div>
          
          {/* Contact, Deal, Company */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact">Contact</Label>
              <Select
                value={formData.contact_id}
                onValueChange={(v) => handleChange('contact_id', v)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {contacts.map(contact => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.first_name} {contact.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="deal">Deal</Label>
              <Select
                value={formData.deal_id}
                onValueChange={(v) => handleChange('deal_id', v)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {deals.map(deal => (
                    <SelectItem key={deal.id} value={deal.id}>
                      {deal.name}
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
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Call Duration (for calls) */}
          {isCall && (
            <div className="space-y-2">
              <Label htmlFor="duration">Call Duration (seconds)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.call_duration_seconds}
                onChange={(e) => handleChange('call_duration_seconds', e.target.value)}
                placeholder="300"
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">Enter duration in seconds (e.g., 300 = 5 minutes)</p>
            </div>
          )}
          
          {/* Task-specific fields */}
          {isTask && (
            <>
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="datetime-local"
                  value={formData.task_due_date}
                  onChange={(e) => handleChange('task_due_date', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Checkbox
                  id="completed"
                  checked={formData.task_completed}
                  onCheckedChange={(checked) => handleChange('task_completed', !!checked)}
                  disabled={isSubmitting}
                />
                <Label htmlFor="completed" className="text-sm font-normal">
                  Mark as completed
                </Label>
              </div>
            </>
          )}
          
          {/* Outcome */}
          <div className="space-y-2">
            <Label htmlFor="outcome">Outcome</Label>
            <Select
              value={formData.outcome}
              onValueChange={(v) => handleChange('outcome', v)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_specified">Not specified</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="no_answer">No Answer</SelectItem>
                <SelectItem value="left_voicemail">Left Voicemail</SelectItem>
                <SelectItem value="scheduled_followup">Scheduled Follow-up</SelectItem>
              </SelectContent>
            </Select>
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
              Log Activity
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateActivityDialog
