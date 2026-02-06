/**
 * Notification Settings Component
 * 
 * Phase ECOM-03: Settings & Configuration Center
 * 
 * Email templates and notification configuration
 */
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, Edit2, Mail, Package, CreditCard, RotateCcw, ShoppingCart, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import type { NotificationSettings, NotificationTemplate } from '../../types/ecommerce-types'
import { getSettingsTab, updateNotificationSettings } from '../../actions/settings-actions'

interface NotificationSettingsFormProps {
  siteId: string
  agencyId: string
}

// Template type configurations
const TEMPLATE_CONFIGS: Record<NotificationTemplate['type'], { label: string; icon: typeof Mail; description: string }> = {
  order_confirmation: { label: 'Order Confirmation', icon: Package, description: 'Sent when an order is placed' },
  order_shipped: { label: 'Order Shipped', icon: Package, description: 'Sent when order is shipped' },
  order_delivered: { label: 'Order Delivered', icon: Package, description: 'Sent when order is delivered' },
  order_cancelled: { label: 'Order Cancelled', icon: Package, description: 'Sent when order is cancelled' },
  payment_received: { label: 'Payment Received', icon: CreditCard, description: 'Sent when payment is confirmed' },
  refund_issued: { label: 'Refund Issued', icon: RotateCcw, description: 'Sent when refund is processed' },
  low_stock: { label: 'Low Stock Alert', icon: AlertTriangle, description: 'Sent when product is low on stock' },
  back_in_stock: { label: 'Back in Stock', icon: Package, description: 'Sent when wishlist item is restocked' },
  abandoned_cart: { label: 'Abandoned Cart', icon: ShoppingCart, description: 'Sent when cart is abandoned' },
}

// Default templates
const DEFAULT_TEMPLATES: NotificationTemplate[] = Object.keys(TEMPLATE_CONFIGS).map((type) => ({
  id: `template-${type}`,
  type: type as NotificationTemplate['type'],
  enabled: type === 'order_confirmation' || type === 'order_shipped',
  subject: TEMPLATE_CONFIGS[type as NotificationTemplate['type']].label,
  body: `Thank you for your order!\n\n{{order_details}}\n\nBest regards,\n{{store_name}}`,
  send_to: 'customer' as const,
}))

interface TemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: NotificationTemplate | null
  onSave: (template: NotificationTemplate) => void
}

function TemplateDialog({ open, onOpenChange, template, onSave }: TemplateDialogProps) {
  // State initializes from template prop - key prop on parent ensures remount
  const [formData, setFormData] = useState<Partial<NotificationTemplate>>(() => 
    template ? { ...template } : {
      subject: '',
      body: '',
      send_to: 'customer' as const,
      enabled: true
    }
  )
  
  const handleSave = () => {
    if (!template || !formData.subject || !formData.body) {
      toast.error('Please fill in all fields')
      return
    }
    
    onSave({
      ...template,
      subject: formData.subject || '',
      body: formData.body || '',
      send_to: formData.send_to || 'customer',
      enabled: formData.enabled ?? true
    })
    onOpenChange(false)
  }
  
  const config = template ? TEMPLATE_CONFIGS[template.type] : null
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {config?.label} Template</DialogTitle>
          <DialogDescription>{config?.description}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <Label>Enable this notification</Label>
            <Switch
              checked={formData.enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="send_to">Send To</Label>
            <Select
              value={formData.send_to}
              onValueChange={(value) => setFormData({ ...formData, send_to: value as NotificationTemplate['send_to'] })}
            >
              <SelectTrigger id="send_to">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">Customer Only</SelectItem>
                <SelectItem value="admin">Admin Only</SelectItem>
                <SelectItem value="both">Both Customer & Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subject">Email Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Order Confirmed - {{order_number}}"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="body">Email Body</Label>
            <Textarea
              id="body"
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              placeholder="Email content..."
              rows={12}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Available variables: {`{{store_name}}, {{customer_name}}, {{order_number}}, {{order_total}}, {{order_details}}, {{tracking_number}}, {{tracking_url}}`}
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Template</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function NotificationSettingsForm({ siteId, agencyId }: NotificationSettingsFormProps) {
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null)

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getSettingsTab<NotificationSettings>(siteId, 'notifications')
        // Ensure templates exist
        if (!data.templates || data.templates.length === 0) {
          data.templates = DEFAULT_TEMPLATES
        }
        setSettings(data)
      } catch (error) {
        console.error('Error loading settings:', error)
        toast.error('Failed to load notification settings')
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [siteId])

  const updateField = <K extends keyof NotificationSettings>(field: K, value: NotificationSettings[K]) => {
    if (!settings) return
    setSettings({ ...settings, [field]: value })
    setHasChanges(true)
  }
  
  const updateAdminNotification = (key: string, value: boolean) => {
    if (!settings) return
    setSettings({
      ...settings,
      admin_notifications: { ...settings.admin_notifications, [key]: value }
    })
    setHasChanges(true)
  }
  
  const handleEditTemplate = (template: NotificationTemplate) => {
    setEditingTemplate(template)
    setTemplateDialogOpen(true)
  }
  
  const handleSaveTemplate = (template: NotificationTemplate) => {
    if (!settings) return
    setSettings({
      ...settings,
      templates: settings.templates.map(t => 
        t.id === template.id ? template : t
      )
    })
    setHasChanges(true)
  }
  
  const toggleTemplate = (templateId: string) => {
    if (!settings) return
    setSettings({
      ...settings,
      templates: settings.templates.map(t => 
        t.id === templateId ? { ...t, enabled: !t.enabled } : t
      )
    })
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!settings) return
    setIsSaving(true)
    try {
      const result = await updateNotificationSettings(siteId, agencyId, settings)
      if (result.success) {
        toast.success('Notification settings saved successfully')
        setHasChanges(false)
      } else {
        toast.error(result.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Email Settings</CardTitle>
          <CardDescription>Configure your store email settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="from_name">From Name</Label>
              <Input
                id="from_name"
                value={settings.email_from_name}
                onChange={(e) => updateField('email_from_name', e.target.value)}
                placeholder="My Store"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="from_address">From Email</Label>
              <Input
                id="from_address"
                type="email"
                value={settings.email_from_address}
                onChange={(e) => updateField('email_from_address', e.target.value)}
                placeholder="noreply@mystore.com"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="header_logo">Header Logo URL</Label>
            <Input
              id="header_logo"
              value={settings.email_header_logo || ''}
              onChange={(e) => updateField('email_header_logo', e.target.value)}
              placeholder="https://example.com/logo.png"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="footer_text">Footer Text</Label>
            <Textarea
              id="footer_text"
              value={settings.email_footer_text}
              onChange={(e) => updateField('email_footer_text', e.target.value)}
              placeholder="© 2026 My Store. All rights reserved."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Admin Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Notifications</CardTitle>
          <CardDescription>Get notified about store activity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>New Order</Label>
              <p className="text-sm text-muted-foreground">Notify when a new order is placed</p>
            </div>
            <Switch
              checked={settings.admin_notifications.new_order}
              onCheckedChange={(checked) => updateAdminNotification('new_order', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Low Stock</Label>
              <p className="text-sm text-muted-foreground">Notify when products are running low</p>
            </div>
            <Switch
              checked={settings.admin_notifications.low_stock}
              onCheckedChange={(checked) => updateAdminNotification('low_stock', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>New Review</Label>
              <p className="text-sm text-muted-foreground">Notify when a product review is submitted</p>
            </div>
            <Switch
              checked={settings.admin_notifications.new_review}
              onCheckedChange={(checked) => updateAdminNotification('new_review', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Refund Request</Label>
              <p className="text-sm text-muted-foreground">Notify when a refund is requested</p>
            </div>
            <Switch
              checked={settings.admin_notifications.refund_request}
              onCheckedChange={(checked) => updateAdminNotification('refund_request', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Email Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Email Templates</CardTitle>
          <CardDescription>Customize customer email notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {settings.templates.map((template) => {
              const config = TEMPLATE_CONFIGS[template.type]
              const Icon = config.icon
              return (
                <AccordionItem key={template.id} value={template.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <span>{config.label}</span>
                      <Badge variant={template.enabled ? 'default' : 'secondary'}>
                        {template.enabled ? 'Active' : 'Disabled'}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      <p className="text-sm text-muted-foreground">{config.description}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Subject:</span>
                        <span>{template.subject}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Send to:</span>
                        <span className="capitalize">{template.send_to}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={template.enabled}
                          onCheckedChange={() => toggleTemplate(template.id)}
                        />
                        <Label className="text-sm">Enabled</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-auto"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit Template
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <TemplateDialog
        key={editingTemplate?.id || 'new'}
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        template={editingTemplate}
        onSave={handleSaveTemplate}
      />
    </div>
  )
}
