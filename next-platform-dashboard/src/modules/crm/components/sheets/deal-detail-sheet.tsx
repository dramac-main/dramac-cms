/**
 * Deal Detail Sheet
 * 
 * Phase EM-50: CRM Module - Enterprise Ready
 * 
 * Slide-over sheet showing deal details with edit capability
 */
'use client'

import { useState, useEffect } from 'react'
import { useCRM, useDealActivities } from '../../context/crm-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { 
  Loader2, 
  Pencil, 
  Save, 
  X,
  DollarSign,
  Calendar,
  User,
  Building2,
  Target,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Deal, DealUpdate, DealStatus, PipelineStage } from '../../types/crm-types'
import { CreateActivityDialog } from '../dialogs/create-activity-dialog'

interface DealDetailSheetProps {
  dealId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatCurrency(value: number | null | undefined): string {
  if (!value) return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

// Activity timeline item
function ActivityItem({ activity }: { activity: any }) {
  const getIcon = () => {
    switch (activity.activity_type) {
      case 'call': return <Phone className="h-3 w-3" />
      case 'email': return <Mail className="h-3 w-3" />
      case 'meeting': return <Calendar className="h-3 w-3" />
      default: return <FileText className="h-3 w-3" />
    }
  }

  return (
    <div className="flex gap-3 py-3 border-b last:border-0">
      <div className="p-1.5 rounded-full bg-muted">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">
            {activity.subject || activity.activity_type}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(activity.created_at).toLocaleDateString()}
          </span>
        </div>
        {activity.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {activity.description}
          </p>
        )}
      </div>
    </div>
  )
}

export function DealDetailSheet({
  dealId,
  open,
  onOpenChange
}: DealDetailSheetProps) {
  const { deals, contacts, companies, pipelines, editDeal, removeDeal, moveDeal, getStages } = useCRM()
  const { activities, isLoading: activitiesLoading } = useDealActivities(dealId || '')
  
  // State
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activityDialogOpen, setActivityDialogOpen] = useState(false)
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [formData, setFormData] = useState<DealUpdate>({})
  
  // Get deal
  const deal = deals.find(d => d.id === dealId)
  
  // Load stages when deal changes
  useEffect(() => {
    if (deal?.pipeline_id) {
      getStages(deal.pipeline_id).then(setStages)
    }
  }, [deal?.pipeline_id, getStages])
  
  // Initialize form data when deal changes
  useEffect(() => {
    if (deal) {
      setFormData({
        name: deal.name,
        amount: deal.amount,
        pipeline_id: deal.pipeline_id,
        stage_id: deal.stage_id,
        contact_id: deal.contact_id,
        company_id: deal.company_id,
        status: deal.status,
        probability: deal.probability,
        expected_close_date: deal.expected_close_date,
        description: deal.description,
        close_reason: deal.close_reason
      })
    }
  }, [deal])
  
  // Reset editing state when sheet closes
  useEffect(() => {
    if (!open) {
      setIsEditing(false)
    }
  }, [open])
  
  // Handle field change
  const handleChange = (field: keyof DealUpdate, value: string | number | undefined) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      
      // Update probability when stage changes
      if (field === 'stage_id') {
        const stage = stages.find(s => s.id === value)
        if (stage) {
          updated.probability = stage.probability || 0
        }
      }
      
      return updated
    })
  }
  
  // Handle save
  const handleSave = async () => {
    if (!dealId) return
    
    setIsSaving(true)
    try {
      await editDeal(dealId, formData)
      toast.success('Deal updated')
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update deal:', error)
      toast.error('Failed to update deal')
    } finally {
      setIsSaving(false)
    }
  }
  
  // Handle status change (won/lost)
  const handleStatusChange = async (status: 'won' | 'lost') => {
    if (!dealId) return
    
    const updates: DealUpdate = { status }
    if (status === 'won') {
      updates.probability = 100
      updates.actual_close_date = new Date().toISOString().split('T')[0]
    } else if (status === 'lost') {
      updates.probability = 0
      updates.actual_close_date = new Date().toISOString().split('T')[0]
    }
    
    try {
      await editDeal(dealId, updates)
      toast.success(`Deal marked as ${status}`)
    } catch (error) {
      console.error('Failed to update deal:', error)
      toast.error('Failed to update deal')
    }
  }
  
  // Handle delete
  const handleDelete = async () => {
    if (!dealId) return
    
    if (!confirm('Are you sure you want to delete this deal? This action cannot be undone.')) {
      return
    }
    
    try {
      await removeDeal(dealId)
      toast.success('Deal deleted')
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to delete deal:', error)
      toast.error('Failed to delete deal')
    }
  }
  
  if (!deal) {
    return null
  }
  
  const statusColors = {
    open: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    won: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    lost: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
  }
  
  const weightedValue = (deal.amount || 0) * (deal.probability / 100)

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <SheetTitle className="text-xl">{deal.name}</SheetTitle>
                <SheetDescription className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold text-foreground">
                    {formatCurrency(deal.amount || 0)}
                  </span>
                  <Badge className={statusColors[deal.status]}>
                    {deal.status}
                  </Badge>
                </SheetDescription>
              </div>
            </div>
            
            {/* Quick Actions */}
            {deal.status === 'open' && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={() => handleStatusChange('won')}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Mark Won
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleStatusChange('lost')}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Mark Lost
                </Button>
              </div>
            )}
          </SheetHeader>
          
          <Tabs defaultValue="details" className="mt-6">
            <TabsList className="w-full">
              <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
              <TabsTrigger value="activities" className="flex-1">
                Activities ({activities.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="mt-4 space-y-4">
              {/* Edit/Save buttons */}
              <div className="flex justify-end gap-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                      disabled={isSaving}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-1" />
                      )}
                      Save
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
              
              {/* Deal Info */}
              <div className="space-y-4">
                {/* Value & Probability */}
                <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Deal Value</span>
                    </div>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={formData.amount || ''}
                        onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                        className="w-32 text-right"
                      />
                    ) : (
                      <span className="font-semibold">{formatCurrency(deal.amount || 0)}</span>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Probability</span>
                      </div>
                      {isEditing ? (
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={formData.probability || 0}
                          onChange={(e) => handleChange('probability', parseInt(e.target.value) || 0)}
                          className="w-20 text-right"
                        />
                      ) : (
                        <span className="font-semibold">{deal.probability}%</span>
                      )}
                    </div>
                    <Progress value={deal.probability} className="h-2" />
                  </div>
                  
                  <div className="flex items-center justify-between border-t pt-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Weighted Value</span>
                    </div>
                    <span className="font-semibold text-primary">
                      {formatCurrency(weightedValue)}
                    </span>
                  </div>
                </div>
                
                <Separator />
                
                {/* Pipeline & Stage */}
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Pipeline</Label>
                    {isEditing ? (
                      <Select
                        value={formData.pipeline_id || ''}
                        onValueChange={(v) => {
                          handleChange('pipeline_id', v)
                          handleChange('stage_id', '') // Reset stage
                          getStages(v).then(setStages)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {pipelines.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm">{deal.pipeline?.name || '-'}</div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Stage</Label>
                    {isEditing ? (
                      <Select
                        value={formData.stage_id || ''}
                        onValueChange={(v) => handleChange('stage_id', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {stages.map(s => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name} ({s.probability}%)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline">{deal.stage?.name || '-'}</Badge>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                {/* Contact & Company */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Contact
                    </Label>
                    {isEditing ? (
                      <Select
                        value={formData.contact_id || ''}
                        onValueChange={(v) => handleChange('contact_id', v || undefined)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {contacts.map(c => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.first_name} {c.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm">
                        {deal.contact 
                          ? `${deal.contact.first_name} ${deal.contact.last_name}`
                          : '-'
                        }
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Company
                    </Label>
                    {isEditing ? (
                      <Select
                        value={formData.company_id || ''}
                        onValueChange={(v) => handleChange('company_id', v || undefined)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {companies.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm">{deal.company?.name || '-'}</div>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Expected Close
                    </Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={formData.expected_close_date || ''}
                        onChange={(e) => handleChange('expected_close_date', e.target.value || undefined)}
                      />
                    ) : (
                      <div className="text-sm">
                        {deal.expected_close_date 
                          ? new Date(deal.expected_close_date).toLocaleDateString()
                          : '-'
                        }
                      </div>
                    )}
                  </div>
                  
                  {deal.actual_close_date && (
                    <div className="space-y-2">
                      <Label>Actual Close</Label>
                      <div className="text-sm">
                        {new Date(deal.actual_close_date).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Loss Reason (if lost) */}
                {deal.status === 'lost' && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Label>Close Reason</Label>
                      {isEditing ? (
                        <Textarea
                          value={formData.close_reason || ''}
                          onChange={(e) => handleChange('close_reason', e.target.value)}
                          rows={2}
                        />
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          {deal.close_reason || 'Not specified'}
                        </div>
                      )}
                    </div>
                  </>
                )}
                
                {/* Description */}
                <div className="space-y-2">
                  <Label>Description</Label>
                  {isEditing ? (
                    <Textarea
                      value={formData.description || ''}
                      onChange={(e) => handleChange('description', e.target.value)}
                      rows={4}
                    />
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {deal.description || 'No description'}
                    </div>
                  )}
                </div>
                
                {/* Metadata */}
                <div className="text-xs text-muted-foreground space-y-1 pt-4">
                  <div>Created: {new Date(deal.created_at).toLocaleString()}</div>
                  <div>Updated: {new Date(deal.updated_at).toLocaleString()}</div>
                </div>
                
                {/* Delete button */}
                <div className="pt-4">
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleDelete}
                  >
                    Delete Deal
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="activities" className="mt-4">
              <div className="flex justify-end mb-4">
                <Button
                  size="sm"
                  onClick={() => setActivityDialogOpen(true)}
                >
                  Log Activity
                </Button>
              </div>
              
              {activities.length > 0 ? (
                <div className="space-y-1">
                  {activities.map(activity => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No activities logged yet
                </div>
              )}
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
      
      {/* Activity Dialog */}
      <CreateActivityDialog
        open={activityDialogOpen}
        onOpenChange={setActivityDialogOpen}
        defaultDealId={dealId || undefined}
        defaultContactId={deal?.contact_id || undefined}
        defaultCompanyId={deal?.company_id || undefined}
      />
    </>
  )
}

export default DealDetailSheet
