/**
 * Tax Settings Component
 * 
 * Phase ECOM-03: Settings & Configuration Center
 * 
 * Tax zones, rates, and calculation settings
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, Plus, Edit2, Trash2, Globe } from 'lucide-react'
import { toast } from 'sonner'
import type { TaxSettings, TaxZone, TaxRate } from '../../types/ecommerce-types'
import { getSettingsTab, updateTaxSettings } from '../../actions/settings-actions'
import { getCountryList } from '../../lib/settings-utils'

// ============================================================================
// TYPES
// ============================================================================

interface TaxSettingsFormProps {
  siteId: string
  agencyId: string
}

// ============================================================================
// TAX ZONE DIALOG
// ============================================================================

interface TaxZoneDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  zone?: TaxZone | null
  onSave: (zone: TaxZone) => void
}

function TaxZoneDialog({ open, onOpenChange, zone, onSave }: TaxZoneDialogProps) {
  // State initializes from zone prop - key prop ensures remount with new zone data
  const [name, setName] = useState(zone?.name || '')
  const [countries, setCountries] = useState<string[]>(zone?.countries || [])
  const [rates, setRates] = useState<TaxRate[]>(zone?.tax_rates || [])
  const [newRate, setNewRate] = useState({ name: '', rate: 0, tax_class: 'standard' })
  
  const countryList = getCountryList()
  
  const handleAddRate = () => {
    if (!newRate.name || newRate.rate <= 0) {
      toast.error('Please enter a valid rate name and percentage')
      return
    }
    
    setRates([
      ...rates,
      {
        id: `rate-${Date.now()}`,
        name: newRate.name,
        rate: newRate.rate,
        tax_class: newRate.tax_class,
        compound: false,
        shipping_taxable: true
      }
    ])
    setNewRate({ name: '', rate: 0, tax_class: 'standard' })
  }
  
  const handleRemoveRate = (rateId: string) => {
    setRates(rates.filter(r => r.id !== rateId))
  }
  
  const handleSave = () => {
    if (!name) {
      toast.error('Please enter a zone name')
      return
    }
    if (countries.length === 0) {
      toast.error('Please select at least one country')
      return
    }
    if (rates.length === 0) {
      toast.error('Please add at least one tax rate')
      return
    }
    
    onSave({
      id: zone?.id || `zone-${Date.now()}`,
      name,
      countries,
      states: [],
      tax_rates: rates
    })
    onOpenChange(false)
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{zone ? 'Edit Tax Zone' : 'Add Tax Zone'}</DialogTitle>
          <DialogDescription>
            Configure tax rates for specific regions
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Zone Name */}
          <div className="space-y-2">
            <Label htmlFor="zone_name">Zone Name</Label>
            <Input
              id="zone_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Zambia VAT, EU VAT"
            />
          </div>
          
          {/* Countries */}
          <div className="space-y-2">
            <Label>Countries</Label>
            <Select
              value=""
              onValueChange={(value) => {
                if (!countries.includes(value)) {
                  setCountries([...countries, value])
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Add a country..." />
              </SelectTrigger>
              <SelectContent>
                {countryList
                  .filter(c => !countries.includes(c.code))
                  .map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2 mt-2">
              {countries.map((code) => {
                const country = countryList.find(c => c.code === code)
                return (
                  <Badge key={code} variant="secondary" className="flex items-center gap-1">
                    {country?.name || code}
                    <button
                      onClick={() => setCountries(countries.filter(c => c !== code))}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )
              })}
            </div>
          </div>
          
          {/* Tax Rates */}
          <div className="space-y-4">
            <Label>Tax Rates</Label>
            
            {/* Add Rate */}
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-2">
                <Input
                  placeholder="Rate name (e.g., Standard VAT)"
                  value={newRate.name}
                  onChange={(e) => setNewRate({ ...newRate, name: e.target.value })}
                />
              </div>
              <div className="w-24 space-y-2">
                <Input
                  type="number"
                  placeholder="%"
                  value={newRate.rate || ''}
                  onChange={(e) => setNewRate({ ...newRate, rate: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <Button type="button" variant="outline" onClick={handleAddRate}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Rates List */}
            {rates.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rates.map((rate) => (
                    <TableRow key={rate.id}>
                      <TableCell>{rate.name}</TableCell>
                      <TableCell>{rate.rate}%</TableCell>
                      <TableCell className="capitalize">{rate.tax_class}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRate(rate.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Zone
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TaxSettingsForm({ siteId, agencyId }: TaxSettingsFormProps) {
  const [settings, setSettings] = useState<TaxSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [zoneDialogOpen, setZoneDialogOpen] = useState(false)
  const [editingZone, setEditingZone] = useState<TaxZone | null>(null)

  // Load settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getSettingsTab<TaxSettings>(siteId, 'tax')
        setSettings(data)
      } catch (error) {
        console.error('Error loading settings:', error)
        toast.error('Failed to load tax settings')
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [siteId])

  // Update handlers
  const updateField = <K extends keyof TaxSettings>(
    field: K, 
    value: TaxSettings[K]
  ) => {
    if (!settings) return
    setSettings({ ...settings, [field]: value })
    setHasChanges(true)
  }
  
  const handleAddZone = () => {
    setEditingZone(null)
    setZoneDialogOpen(true)
  }
  
  const handleEditZone = (zone: TaxZone) => {
    setEditingZone(zone)
    setZoneDialogOpen(true)
  }
  
  const handleDeleteZone = (zoneId: string) => {
    if (!settings) return
    if (!confirm('Are you sure you want to delete this tax zone?')) return
    
    setSettings({
      ...settings,
      tax_zones: settings.tax_zones.filter(z => z.id !== zoneId)
    })
    setHasChanges(true)
  }
  
  const handleSaveZone = (zone: TaxZone) => {
    if (!settings) return
    
    const existingIndex = settings.tax_zones.findIndex(z => z.id === zone.id)
    
    if (existingIndex >= 0) {
      // Update existing
      const updated = [...settings.tax_zones]
      updated[existingIndex] = zone
      setSettings({ ...settings, tax_zones: updated })
    } else {
      // Add new
      setSettings({ ...settings, tax_zones: [...settings.tax_zones, zone] })
    }
    setHasChanges(true)
  }

  // Save handler
  const handleSave = async () => {
    if (!settings) return
    
    setIsSaving(true)
    try {
      const result = await updateTaxSettings(siteId, agencyId, settings)
      if (result.success) {
        toast.success('Tax settings saved successfully')
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
      {/* Tax Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Configuration</CardTitle>
          <CardDescription>
            Configure how taxes are calculated and displayed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Taxes</Label>
              <p className="text-sm text-muted-foreground">
                Calculate and charge tax on orders
              </p>
            </div>
            <Switch
              checked={settings.tax_enabled}
              onCheckedChange={(checked) => updateField('tax_enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Prices Include Tax</Label>
              <p className="text-sm text-muted-foreground">
                Product prices already include tax
              </p>
            </div>
            <Switch
              checked={settings.prices_include_tax}
              onCheckedChange={(checked) => updateField('prices_include_tax', checked)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tax_based_on">Calculate Tax Based On</Label>
              <Select
                value={settings.tax_based_on}
                onValueChange={(value) => updateField('tax_based_on', value as TaxSettings['tax_based_on'])}
              >
                <SelectTrigger id="tax_based_on">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shipping">Shipping Address</SelectItem>
                  <SelectItem value="billing">Billing Address</SelectItem>
                  <SelectItem value="store">Store Location</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_prices">Display Prices</Label>
              <Select
                value={settings.display_prices}
                onValueChange={(value) => updateField('display_prices', value as TaxSettings['display_prices'])}
              >
                <SelectTrigger id="display_prices">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="including">Including Tax</SelectItem>
                  <SelectItem value="excluding">Excluding Tax</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="display_in_cart">Display in Cart</Label>
              <Select
                value={settings.display_in_cart}
                onValueChange={(value) => updateField('display_in_cart', value as TaxSettings['display_in_cart'])}
              >
                <SelectTrigger id="display_in_cart">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="including">Including Tax</SelectItem>
                  <SelectItem value="excluding">Excluding Tax</SelectItem>
                  <SelectItem value="both">Show Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rounding_mode">Rounding Mode</Label>
              <Select
                value={settings.tax_rounding_mode}
                onValueChange={(value) => updateField('tax_rounding_mode', value as TaxSettings['tax_rounding_mode'])}
              >
                <SelectTrigger id="rounding_mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="round">Round to Nearest</SelectItem>
                  <SelectItem value="ceil">Round Up</SelectItem>
                  <SelectItem value="floor">Round Down</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Zones */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tax Zones</CardTitle>
            <CardDescription>
              Define tax rates for different regions
            </CardDescription>
          </div>
          <Button onClick={handleAddZone}>
            <Plus className="h-4 w-4 mr-2" />
            Add Zone
          </Button>
        </CardHeader>
        <CardContent>
          {settings.tax_zones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Globe className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No tax zones configured. Add a zone to start collecting taxes.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zone Name</TableHead>
                  <TableHead>Countries</TableHead>
                  <TableHead>Rates</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settings.tax_zones.map((zone) => (
                  <TableRow key={zone.id}>
                    <TableCell className="font-medium">{zone.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {zone.countries.slice(0, 3).map((code) => (
                          <Badge key={code} variant="outline">{code}</Badge>
                        ))}
                        {zone.countries.length > 3 && (
                          <Badge variant="secondary">+{zone.countries.length - 3} more</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {zone.tax_rates.map((rate) => (
                          <Badge key={rate.id} variant="secondary">
                            {rate.name}: {rate.rate}%
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditZone(zone)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteZone(zone.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isSaving || !hasChanges}
        >
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* Zone Dialog */}
      <TaxZoneDialog
        key={editingZone?.id || 'new'}
        open={zoneDialogOpen}
        onOpenChange={setZoneDialogOpen}
        zone={editingZone}
        onSave={handleSaveZone}
      />
    </div>
  )
}
