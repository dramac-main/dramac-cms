/**
 * Checkout Settings Component
 * 
 * Phase ECOM-03: Settings & Configuration Center
 * 
 * Checkout flow, fields, and experience configuration
 */
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Loader2, Save, GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import type { CheckoutSettings, CheckoutField } from '../../types/ecommerce-types'
import { getSettingsTab, updateCheckoutSettings } from '../../actions/settings-actions'

interface CheckoutSettingsFormProps {
  siteId: string
  agencyId: string
}

// Default checkout fields
const DEFAULT_FIELDS: CheckoutField[] = [
  { id: 'first_name', name: 'first_name', label: 'First Name', type: 'text', required: true, enabled: true, position: 'billing' },
  { id: 'last_name', name: 'last_name', label: 'Last Name', type: 'text', required: true, enabled: true, position: 'billing' },
  { id: 'email', name: 'email', label: 'Email', type: 'email', required: true, enabled: true, position: 'billing' },
  { id: 'phone', name: 'phone', label: 'Phone', type: 'phone', required: false, enabled: true, position: 'billing' },
  { id: 'company', name: 'company', label: 'Company', type: 'text', required: false, enabled: false, position: 'billing' },
  { id: 'address_1', name: 'address_1', label: 'Address Line 1', type: 'text', required: true, enabled: true, position: 'shipping' },
  { id: 'address_2', name: 'address_2', label: 'Address Line 2', type: 'text', required: false, enabled: true, position: 'shipping' },
  { id: 'city', name: 'city', label: 'City', type: 'text', required: true, enabled: true, position: 'shipping' },
  { id: 'state', name: 'state', label: 'State/Province', type: 'text', required: true, enabled: true, position: 'shipping' },
  { id: 'postal_code', name: 'postal_code', label: 'Postal Code', type: 'text', required: true, enabled: true, position: 'shipping' },
  { id: 'country', name: 'country', label: 'Country', type: 'select', required: true, enabled: true, position: 'shipping' },
  { id: 'order_notes', name: 'order_notes', label: 'Order Notes', type: 'textarea', required: false, enabled: true, position: 'order' },
]

export function CheckoutSettingsForm({ siteId, agencyId }: CheckoutSettingsFormProps) {
  const [settings, setSettings] = useState<CheckoutSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getSettingsTab<CheckoutSettings>(siteId, 'checkout')
        // Ensure checkout_fields has default fields if empty
        if (!data.checkout_fields || data.checkout_fields.length === 0) {
          data.checkout_fields = DEFAULT_FIELDS
        }
        setSettings(data)
      } catch (error) {
        console.error('Error loading settings:', error)
        toast.error('Failed to load checkout settings')
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [siteId])

  const updateField = <K extends keyof CheckoutSettings>(field: K, value: CheckoutSettings[K]) => {
    if (!settings) return
    setSettings({ ...settings, [field]: value })
    setHasChanges(true)
  }
  
  const updateExpressCheckout = (key: string, value: unknown) => {
    if (!settings) return
    setSettings({
      ...settings,
      express_checkout: { ...settings.express_checkout, [key]: value }
    })
    setHasChanges(true)
  }
  
  const toggleCheckoutField = (fieldId: string, key: 'enabled' | 'required', value: boolean) => {
    if (!settings) return
    setSettings({
      ...settings,
      checkout_fields: settings.checkout_fields.map(f => 
        f.id === fieldId ? { ...f, [key]: value } : f
      )
    })
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!settings) return
    setIsSaving(true)
    try {
      const result = await updateCheckoutSettings(siteId, agencyId, settings)
      if (result.success) {
        toast.success('Checkout settings saved successfully')
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
      {/* Checkout Options */}
      <Card>
        <CardHeader>
          <CardTitle>Checkout Options</CardTitle>
          <CardDescription>Configure the checkout experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Guest Checkout</Label>
              <p className="text-sm text-muted-foreground">Allow checkout without creating an account</p>
            </div>
            <Switch
              checked={settings.guest_checkout}
              onCheckedChange={(checked) => updateField('guest_checkout', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Phone Number</Label>
              <p className="text-sm text-muted-foreground">Phone is required for checkout (important for delivery)</p>
            </div>
            <Switch
              checked={settings.require_phone}
              onCheckedChange={(checked) => updateField('require_phone', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Company Name</Label>
              <p className="text-sm text-muted-foreground">Show and require company field</p>
            </div>
            <Switch
              checked={settings.require_company}
              onCheckedChange={(checked) => updateField('require_company', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Address Autocomplete</Label>
              <p className="text-sm text-muted-foreground">Enable Google Places autocomplete for addresses</p>
            </div>
            <Switch
              checked={settings.address_autocomplete}
              onCheckedChange={(checked) => updateField('address_autocomplete', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Order Notes</Label>
              <p className="text-sm text-muted-foreground">Let customers add notes to their order</p>
            </div>
            <Switch
              checked={settings.show_order_notes}
              onCheckedChange={(checked) => updateField('show_order_notes', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Express Checkout */}
      <Card>
        <CardHeader>
          <CardTitle>Express Checkout</CardTitle>
          <CardDescription>Enable one-click payment options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Express Checkout</Label>
              <p className="text-sm text-muted-foreground">Show express payment buttons at checkout</p>
            </div>
            <Switch
              checked={settings.express_checkout.enabled}
              onCheckedChange={(checked) => updateExpressCheckout('enabled', checked)}
            />
          </div>
          
          {settings.express_checkout.enabled && (
            <div className="space-y-3 ml-6">
              <Label className="text-sm font-medium">Express Payment Providers</Label>
              {(['apple_pay', 'google_pay', 'paypal_express'] as const).map((provider) => (
                <div key={provider} className="flex items-center gap-2">
                  <Checkbox
                    id={provider}
                    checked={settings.express_checkout.providers.includes(provider)}
                    onCheckedChange={(checked) => {
                      const providers = checked
                        ? [...settings.express_checkout.providers, provider]
                        : settings.express_checkout.providers.filter(p => p !== provider)
                      updateExpressCheckout('providers', providers)
                    }}
                  />
                  <Label htmlFor={provider} className="capitalize">
                    {provider.replace('_', ' ')}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checkout Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Checkout Fields</CardTitle>
          <CardDescription>Configure which fields appear on checkout</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {['billing', 'shipping', 'order'].map((section) => (
              <div key={section} className="space-y-2">
                <h4 className="font-medium capitalize text-sm text-muted-foreground mt-4 first:mt-0">
                  {section} Fields
                </h4>
                {settings.checkout_fields
                  .filter(f => f.position === section)
                  .map((field) => (
                    <div key={field.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                        <div>
                          <p className="font-medium text-sm">{field.label}</p>
                          <p className="text-xs text-muted-foreground capitalize">{field.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`${field.id}_enabled`}
                            checked={field.enabled}
                            onCheckedChange={(checked) => toggleCheckoutField(field.id, 'enabled', !!checked)}
                          />
                          <Label htmlFor={`${field.id}_enabled`} className="text-xs">Enabled</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`${field.id}_required`}
                            checked={field.required}
                            onCheckedChange={(checked) => toggleCheckoutField(field.id, 'required', !!checked)}
                            disabled={!field.enabled}
                          />
                          <Label htmlFor={`${field.id}_required`} className="text-xs">Required</Label>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ))}
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
    </div>
  )
}
