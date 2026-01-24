/**
 * Contact Detail Sheet
 * 
 * Phase EM-50: CRM Module - Enterprise Ready
 * 
 * Slide-over sheet showing contact details with edit capability
 */
'use client'

import { useState, useEffect } from 'react'
import { useCRM, useContactActivities } from '../../context/crm-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  Activity as ActivityIcon,
  FileText,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ContactUpdate, ContactStatus, Activity } from '../../types/crm-types'
import { CreateActivityDialog } from '../dialogs/create-activity-dialog'

interface ContactDetailSheetProps {
  contactId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Activity timeline item
function ActivityItem({ activity }: { activity: Activity }) {
  const getIcon = () => {
    switch (activity.activity_type) {
      case 'call': return <Phone className="h-3 w-3" />
      case 'email': return <Mail className="h-3 w-3" />
      case 'meeting': return <Calendar className="h-3 w-3" />
      case 'task': return <ActivityIcon className="h-3 w-3" />
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

export function ContactDetailSheet({
  contactId,
  open,
  onOpenChange
}: ContactDetailSheetProps) {
  const { contacts, companies, editContact, removeContact } = useCRM()
  const { activities } = useContactActivities(contactId || '')
  
  // State
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activityDialogOpen, setActivityDialogOpen] = useState(false)
  const [formData, setFormData] = useState<ContactUpdate>({})
  
  // Get contact
  const contact = contacts.find(c => c.id === contactId)
  
  // Initialize form data when contact changes
  useEffect(() => {
    if (contact) {
      setFormData({
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email,
        phone: contact.phone,
        mobile: contact.mobile,
        job_title: contact.job_title,
        department: contact.department,
        company_id: contact.company_id,
        status: contact.status,
        lead_status: contact.lead_status,
        source: contact.source
      })
    }
  }, [contact])
  
  // Reset editing state when sheet closes
  useEffect(() => {
    if (!open) {
      setIsEditing(false)
    }
  }, [open])
  
  // Handle field change
  const handleChange = (field: keyof ContactUpdate, value: string | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }
  
  // Handle save
  const handleSave = async () => {
    if (!contactId) return
    
    setIsSaving(true)
    try {
      await editContact(contactId, formData)
      toast.success('Contact updated')
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update contact:', error)
      toast.error('Failed to update contact')
    } finally {
      setIsSaving(false)
    }
  }
  
  // Handle delete
  const handleDelete = async () => {
    if (!contactId) return
    
    if (!confirm('Are you sure you want to delete this contact? This action cannot be undone.')) {
      return
    }
    
    try {
      await removeContact(contactId)
      toast.success('Contact deleted')
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to delete contact:', error)
      toast.error('Failed to delete contact')
    }
  }
  
  if (!contact) {
    return null
  }
  
  const initials = `${contact.first_name?.[0] || ''}${contact.last_name?.[0] || ''}`.toUpperCase()
  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
    archived: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    lead: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    customer: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    churned: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <SheetTitle className="text-xl">
                    {contact.first_name} {contact.last_name}
                  </SheetTitle>
                  <SheetDescription className="flex items-center gap-2">
                    {contact.job_title && <span>{contact.job_title}</span>}
                    {contact.job_title && contact.company && <span>at</span>}
                    {contact.company && (
                      <span className="font-medium">{contact.company.name}</span>
                    )}
                  </SheetDescription>
                </div>
              </div>
              <Badge className={cn("ml-2", statusColors[contact.status])}>
                {contact.status}
              </Badge>
            </div>
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
              
              {/* Contact Info */}
              <div className="space-y-4">
                {/* Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    {isEditing ? (
                      <Input
                        value={formData.first_name || ''}
                        onChange={(e) => handleChange('first_name', e.target.value)}
                      />
                    ) : (
                      <div className="text-sm">{contact.first_name || '-'}</div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    {isEditing ? (
                      <Input
                        value={formData.last_name || ''}
                        onChange={(e) => handleChange('last_name', e.target.value)}
                      />
                    ) : (
                      <div className="text-sm">{contact.last_name || '-'}</div>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                {/* Contact Details */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {isEditing ? (
                      <Input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className="flex-1"
                      />
                    ) : (
                      <a href={`mailto:${contact.email}`} className="text-sm text-blue-600 hover:underline">
                        {contact.email}
                      </a>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {isEditing ? (
                      <Input
                        value={formData.phone || ''}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="Phone"
                        className="flex-1"
                      />
                    ) : (
                      <span className="text-sm">{contact.phone || '-'}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {isEditing ? (
                      <Input
                        value={formData.mobile || ''}
                        onChange={(e) => handleChange('mobile', e.target.value)}
                        placeholder="Mobile"
                        className="flex-1"
                      />
                    ) : (
                      <span className="text-sm">{contact.mobile || '-'}</span>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                {/* Work Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {isEditing ? (
                      <Select
                        value={formData.company_id || 'none'}
                        onValueChange={(v) => handleChange('company_id', v === 'none' ? undefined : v)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select company" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {companies.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-sm">{contact.company?.name || '-'}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    {isEditing ? (
                      <Input
                        value={formData.job_title || ''}
                        onChange={(e) => handleChange('job_title', e.target.value)}
                        placeholder="Job title"
                        className="flex-1"
                      />
                    ) : (
                      <span className="text-sm">{contact.job_title || '-'}</span>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                {/* Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    {isEditing ? (
                      <Select
                        value={formData.status}
                        onValueChange={(v) => handleChange('status', v as ContactStatus)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="lead">Lead</SelectItem>
                          <SelectItem value="customer">Customer</SelectItem>
                          <SelectItem value="churned">Churned</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={statusColors[contact.status]}>
                        {contact.status}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Lead Status</Label>
                    {isEditing ? (
                      <Select
                        value={formData.lead_status || ''}
                        onValueChange={(v) => handleChange('lead_status', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                          <SelectItem value="unqualified">Unqualified</SelectItem>
                          <SelectItem value="converted">Converted</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm capitalize">{contact.lead_status || '-'}</div>
                    )}
                  </div>
                </div>
                
                {/* Metadata */}
                <div className="text-xs text-muted-foreground space-y-1 pt-4">
                  <div>Created: {new Date(contact.created_at).toLocaleString()}</div>
                  <div>Updated: {new Date(contact.updated_at).toLocaleString()}</div>
                </div>
                
                {/* Delete button */}
                <div className="pt-4">
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleDelete}
                  >
                    Delete Contact
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
        defaultContactId={contactId || undefined}
      />
    </>
  )
}

export default ContactDetailSheet
