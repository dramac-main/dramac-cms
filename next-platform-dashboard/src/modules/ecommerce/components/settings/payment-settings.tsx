/**
 * Payment Settings Component
 * 
 * Phase ECOM-03: Settings & Configuration Center
 * 
 * Payment gateways and payment method configuration
 */
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, Plus, Edit2, CreditCard, Wallet, Building2, Truck } from 'lucide-react'
import { toast } from 'sonner'
import type { PaymentSettings, PaymentGateway } from '../../types/ecommerce-types'
import { getSettingsTab, updatePaymentSettings, testPaymentGateway } from '../../actions/settings-actions'

interface PaymentSettingsFormProps {
  siteId: string
  agencyId: string
}

// Gateway configurations
const GATEWAY_OPTIONS = [
  { id: 'stripe', name: 'Stripe', icon: CreditCard, description: 'Accept credit/debit cards globally' },
  { id: 'paypal', name: 'PayPal', icon: Wallet, description: 'PayPal payments and PayPal Credit' },
  { id: 'manual', name: 'Manual Payment', icon: Building2, description: 'Bank transfer or custom' },
  { id: 'cod', name: 'Cash on Delivery', icon: Truck, description: 'Pay when delivered' },
]

interface GatewayDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gateway?: PaymentGateway | null
  onSave: (gateway: PaymentGateway) => void
}

function GatewayDialog({ open, onOpenChange, gateway, onSave }: GatewayDialogProps) {
  const [formData, setFormData] = useState<Partial<PaymentGateway>>({
    name: '',
    type: 'stripe',
    enabled: true,
    test_mode: true,
    api_key: '',
    secret_key: '',
    webhook_secret: ''
  })
  const [isTesting, setIsTesting] = useState(false)
  
  useEffect(() => {
    if (gateway) {
      setFormData(gateway)
    } else {
      setFormData({
        name: '',
        type: 'stripe',
        enabled: true,
        test_mode: true,
        api_key: '',
        secret_key: '',
        webhook_secret: ''
      })
    }
  }, [gateway, open])
  
  const handleTestConnection = async () => {
    if (!formData.api_key || !formData.secret_key) {
      toast.error('Please enter API credentials first')
      return
    }
    setIsTesting(true)
    try {
      const result = await testPaymentGateway(formData.type || 'stripe', formData.api_key, formData.secret_key)
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (_error) {
      toast.error('Connection test failed')
    } finally {
      setIsTesting(false)
    }
  }
  
  const handleSave = () => {
    if (!formData.name || !formData.type) {
      toast.error('Please fill in all required fields')
      return
    }
    
    onSave({
      id: gateway?.id || `gateway-${Date.now()}`,
      name: formData.name,
      type: formData.type as PaymentGateway['type'],
      enabled: formData.enabled ?? true,
      test_mode: formData.test_mode ?? true,
      api_key: formData.api_key,
      secret_key: formData.secret_key,
      webhook_secret: formData.webhook_secret
    })
    onOpenChange(false)
  }
  
  const needsCredentials = formData.type === 'stripe' || formData.type === 'paypal' || formData.type === 'square'
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{gateway ? 'Edit Payment Gateway' : 'Add Payment Gateway'}</DialogTitle>
          <DialogDescription>Configure payment gateway settings</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Gateway Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => {
                const option = GATEWAY_OPTIONS.find(g => g.id === value)
                setFormData({ 
                  ...formData, 
                  type: value as PaymentGateway['type'],
                  name: option?.name || formData.name
                })
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GATEWAY_OPTIONS.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      <span>{option.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="gateway_name">Display Name</Label>
            <Input
              id="gateway_name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Credit Card, PayPal"
            />
          </div>
          
          {needsCredentials && (
            <>
              <div className="space-y-2">
                <Label htmlFor="api_key">API Key / Client ID</Label>
                <Input
                  id="api_key"
                  value={formData.api_key || ''}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  placeholder={formData.test_mode ? 'Test API key' : 'Live API key'}
                  type="password"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="secret_key">Secret Key / Client Secret</Label>
                <Input
                  id="secret_key"
                  value={formData.secret_key || ''}
                  onChange={(e) => setFormData({ ...formData, secret_key: e.target.value })}
                  placeholder={formData.test_mode ? 'Test secret key' : 'Live secret key'}
                  type="password"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="webhook_secret">Webhook Secret (Optional)</Label>
                <Input
                  id="webhook_secret"
                  value={formData.webhook_secret || ''}
                  onChange={(e) => setFormData({ ...formData, webhook_secret: e.target.value })}
                  placeholder="Webhook signing secret"
                  type="password"
                />
              </div>
              
              <Button 
                type="button" 
                variant="outline" 
                className="w-full"
                onClick={handleTestConnection}
                disabled={isTesting}
              >
                {isTesting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Test Connection
              </Button>
            </>
          )}
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Test Mode</Label>
              <p className="text-sm text-muted-foreground">Use test/sandbox environment</p>
            </div>
            <Switch
              checked={formData.test_mode}
              onCheckedChange={(checked) => setFormData({ ...formData, test_mode: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enabled</Label>
              <p className="text-sm text-muted-foreground">Accept payments with this gateway</p>
            </div>
            <Switch
              checked={formData.enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Gateway</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function PaymentSettingsForm({ siteId, agencyId }: PaymentSettingsFormProps) {
  const [settings, setSettings] = useState<PaymentSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [gatewayDialogOpen, setGatewayDialogOpen] = useState(false)
  const [editingGateway, setEditingGateway] = useState<PaymentGateway | null>(null)

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getSettingsTab<PaymentSettings>(siteId, 'payments')
        setSettings(data)
      } catch (error) {
        console.error('Error loading settings:', error)
        toast.error('Failed to load payment settings')
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [siteId])

  const updateField = <K extends keyof PaymentSettings>(field: K, value: PaymentSettings[K]) => {
    if (!settings) return
    setSettings({ ...settings, [field]: value })
    setHasChanges(true)
  }
  
  const handleAddGateway = () => {
    setEditingGateway(null)
    setGatewayDialogOpen(true)
  }
  
  const handleEditGateway = (gateway: PaymentGateway) => {
    setEditingGateway(gateway)
    setGatewayDialogOpen(true)
  }
  
  const handleSaveGateway = (gateway: PaymentGateway) => {
    if (!settings) return
    const existingIndex = settings.gateways.findIndex(g => g.id === gateway.id)
    if (existingIndex >= 0) {
      const updated = [...settings.gateways]
      updated[existingIndex] = gateway
      setSettings({ ...settings, gateways: updated })
    } else {
      setSettings({ ...settings, gateways: [...settings.gateways, gateway] })
    }
    setHasChanges(true)
  }
  
  // Reserved for future delete functionality
  const _handleDeleteGateway = (gatewayId: string) => {
    if (!settings) return
    if (!confirm('Delete this payment gateway?')) return
    setSettings({
      ...settings,
      gateways: settings.gateways.filter(g => g.id !== gatewayId)
    })
    setHasChanges(true)
  }
  
  const toggleGateway = (gatewayId: string) => {
    if (!settings) return
    setSettings({
      ...settings,
      gateways: settings.gateways.map(g => 
        g.id === gatewayId ? { ...g, enabled: !g.enabled } : g
      )
    })
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!settings) return
    setIsSaving(true)
    try {
      const result = await updatePaymentSettings(siteId, agencyId, settings)
      if (result.success) {
        toast.success('Payment settings saved successfully')
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
      {/* Payment Gateways */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Payment Gateways</CardTitle>
            <CardDescription>Configure how customers can pay</CardDescription>
          </div>
          <Button onClick={handleAddGateway}>
            <Plus className="h-4 w-4 mr-2" />
            Add Gateway
          </Button>
        </CardHeader>
        <CardContent>
          {settings.gateways.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No payment gateways configured. Add one to start accepting payments.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {settings.gateways.map((gateway) => {
                const option = GATEWAY_OPTIONS.find(g => g.id === gateway.type)
                const Icon = option?.icon || CreditCard
                return (
                  <div key={gateway.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{gateway.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={gateway.enabled ? 'default' : 'secondary'}>
                            {gateway.enabled ? 'Active' : 'Disabled'}
                          </Badge>
                          {gateway.test_mode && (
                            <Badge variant="outline">Test Mode</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={gateway.enabled}
                        onCheckedChange={() => toggleGateway(gateway.id)}
                      />
                      <Button variant="ghost" size="sm" onClick={() => handleEditGateway(gateway)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Options</CardTitle>
          <CardDescription>Configure payment processing settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="capture_mode">Payment Capture</Label>
            <Select
              value={settings.capture_mode}
              onValueChange={(value) => updateField('capture_mode', value as PaymentSettings['capture_mode'])}
            >
              <SelectTrigger id="capture_mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="automatic">Automatic - Charge immediately</SelectItem>
                <SelectItem value="manual">Manual - Authorize first, capture later</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="statement_descriptor">Statement Descriptor</Label>
            <Input
              id="statement_descriptor"
              value={settings.statement_descriptor}
              onChange={(e) => updateField('statement_descriptor', e.target.value)}
              placeholder="Appears on customer statements"
              maxLength={22}
            />
            <p className="text-xs text-muted-foreground">Max 22 characters</p>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="min_order">Minimum Order Amount</Label>
              <Input
                id="min_order"
                type="number"
                value={settings.min_order_amount}
                onChange={(e) => updateField('min_order_amount', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_order">Maximum Order Amount</Label>
              <Input
                id="max_order"
                type="number"
                value={settings.max_order_amount || ''}
                onChange={(e) => updateField('max_order_amount', parseFloat(e.target.value) || undefined)}
                placeholder="No limit"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Partial Payments</Label>
              <p className="text-sm text-muted-foreground">Let customers pay deposits or installments</p>
            </div>
            <Switch
              checked={settings.allow_partial_payments}
              onCheckedChange={(checked) => updateField('allow_partial_payments', checked)}
            />
          </div>
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

      <GatewayDialog
        open={gatewayDialogOpen}
        onOpenChange={setGatewayDialogOpen}
        gateway={editingGateway}
        onSave={handleSaveGateway}
      />
    </div>
  )
}
