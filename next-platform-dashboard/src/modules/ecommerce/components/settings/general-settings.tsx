/**
 * General Settings Component
 * 
 * Phase ECOM-03: Settings & Configuration Center
 * 
 * Basic store information and regional settings
 */
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import type { GeneralSettings } from '../../types/ecommerce-types'
import { getSettingsTab, updateGeneralSettings } from '../../actions/settings-actions'
import { getTimezoneList, getCountryList } from '../../lib/settings-utils'

// ============================================================================
// TYPES
// ============================================================================

interface GeneralSettingsFormProps {
  siteId: string
  agencyId: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function GeneralSettingsForm({ siteId, agencyId }: GeneralSettingsFormProps) {
  const [settings, setSettings] = useState<GeneralSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const timezones = getTimezoneList()
  const countries = getCountryList()

  // Load settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getSettingsTab<GeneralSettings>(siteId, 'general')
        setSettings(data)
      } catch (error) {
        console.error('Error loading settings:', error)
        toast.error('Failed to load settings')
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [siteId])

  // Update handler
  const updateField = <K extends keyof GeneralSettings>(
    field: K, 
    value: GeneralSettings[K]
  ) => {
    if (!settings) return
    setSettings({ ...settings, [field]: value })
    setHasChanges(true)
  }

  const updateAddressField = (field: string, value: string) => {
    if (!settings) return
    setSettings({
      ...settings,
      store_address: { ...settings.store_address, [field]: value }
    })
    setHasChanges(true)
  }

  // Save handler
  const handleSave = async () => {
    if (!settings) return
    
    setIsSaving(true)
    try {
      const result = await updateGeneralSettings(siteId, agencyId, settings)
      if (result.success) {
        toast.success('Settings saved successfully')
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
      {/* Store Information */}
      <Card>
        <CardHeader>
          <CardTitle>Store Information</CardTitle>
          <CardDescription>
            Basic information about your store
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="store_name">Store Name</Label>
              <Input
                id="store_name"
                value={settings.store_name}
                onChange={(e) => updateField('store_name', e.target.value)}
                placeholder="My Store"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store_email">Store Email</Label>
              <Input
                id="store_email"
                type="email"
                value={settings.store_email}
                onChange={(e) => updateField('store_email', e.target.value)}
                placeholder="store@example.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="store_phone">Store Phone</Label>
            <Input
              id="store_phone"
              value={settings.store_phone}
              onChange={(e) => updateField('store_phone', e.target.value)}
              placeholder="+260 97 1234567"
            />
          </div>
        </CardContent>
      </Card>

      {/* Store Address */}
      <Card>
        <CardHeader>
          <CardTitle>Store Address</CardTitle>
          <CardDescription>
            Physical location of your store
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address_line_1">Address Line 1</Label>
            <Input
              id="address_line_1"
              value={settings.store_address.address_line_1}
              onChange={(e) => updateAddressField('address_line_1', e.target.value)}
              placeholder="123 Main Street"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address_line_2">Address Line 2 (Optional)</Label>
            <Input
              id="address_line_2"
              value={settings.store_address.address_line_2 || ''}
              onChange={(e) => updateAddressField('address_line_2', e.target.value)}
              placeholder="Suite 100"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={settings.store_address.city}
                onChange={(e) => updateAddressField('city', e.target.value)}
                placeholder="New York"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State / Province</Label>
              <Input
                id="state"
                value={settings.store_address.state}
                onChange={(e) => updateAddressField('state', e.target.value)}
                placeholder="NY"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                value={settings.store_address.postal_code}
                onChange={(e) => updateAddressField('postal_code', e.target.value)}
                placeholder="10001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select
                value={settings.store_address.country}
                onValueChange={(value) => updateAddressField('country', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regional Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Regional Settings</CardTitle>
          <CardDescription>
            Timezone, date format, and units
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={settings.timezone}
                onValueChange={(value) => updateField('timezone', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_format">Date Format</Label>
              <Select
                value={settings.date_format}
                onValueChange={(value) => updateField('date_format', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="time_format">Time Format</Label>
              <Select
                value={settings.time_format}
                onValueChange={(value) => updateField('time_format', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12 Hour (AM/PM)</SelectItem>
                  <SelectItem value="24h">24 Hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="weight_unit">Weight Unit</Label>
              <Select
                value={settings.weight_unit}
                onValueChange={(value) => updateField('weight_unit', value as 'kg' | 'lb' | 'g' | 'oz')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">Kilograms (kg)</SelectItem>
                  <SelectItem value="lb">Pounds (lb)</SelectItem>
                  <SelectItem value="g">Grams (g)</SelectItem>
                  <SelectItem value="oz">Ounces (oz)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dimension_unit">Dimension Unit</Label>
              <Select
                value={settings.dimension_unit}
                onValueChange={(value) => updateField('dimension_unit', value as 'cm' | 'in' | 'm' | 'ft')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cm">Centimeters (cm)</SelectItem>
                  <SelectItem value="in">Inches (in)</SelectItem>
                  <SelectItem value="m">Meters (m)</SelectItem>
                  <SelectItem value="ft">Feet (ft)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isSaving || !hasChanges}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
