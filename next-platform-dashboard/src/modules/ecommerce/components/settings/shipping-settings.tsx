/**
 * Shipping Settings Component
 * 
 * Phase ECOM-03: Settings & Configuration Center
 * 
 * Shipping zones, methods, and rates configuration
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
import { Loader2, Save, Plus, Edit2, Trash2, Truck, Package } from 'lucide-react'
import { toast } from 'sonner'
import type { ShippingSettings, ShippingZone, ShippingMethod } from '../../types/ecommerce-types'
import { getSettingsTab, updateShippingSettings } from '../../actions/settings-actions'
import { getCountryList } from '../../lib/settings-utils'
import { DEFAULT_CURRENCY_SYMBOL } from '@/lib/locale-config'

// ============================================================================
// TYPES
// ============================================================================

interface ShippingSettingsFormProps {
  siteId: string
  agencyId: string
}

// ============================================================================
// SHIPPING METHOD DIALOG
// ============================================================================

interface ShippingMethodDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  method?: ShippingMethod | null
  onSave: (method: ShippingMethod) => void
}

function ShippingMethodDialog({ open, onOpenChange, method, onSave }: ShippingMethodDialogProps) {
  // State initializes from method prop - key prop ensures remount with new data
  const [formData, setFormData] = useState<Partial<ShippingMethod>>(() => 
    method ? { ...method } : {
      name: '',
      type: 'flat_rate' as const,
      enabled: true,
      cost: 0,
      free_shipping_threshold: undefined,
      min_order_amount: undefined,
      max_order_amount: undefined,
      handling_fee: 0,
      tax_status: 'taxable' as const,
      delivery_time: ''
    }
  )
  
  const handleSave = () => {
    if (!formData.name) {
      toast.error('Please enter a method name')
      return
    }
    
    onSave({
      id: method?.id || `method-${Date.now()}`,
      name: formData.name,
      type: formData.type || 'flat_rate',
      enabled: formData.enabled ?? true,
      cost: formData.cost || 0,
      free_shipping_threshold: formData.free_shipping_threshold,
      min_order_amount: formData.min_order_amount,
      max_order_amount: formData.max_order_amount,
      handling_fee: formData.handling_fee,
      tax_status: formData.tax_status || 'taxable',
      delivery_time: formData.delivery_time
    })
    onOpenChange(false)
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{method ? 'Edit Shipping Method' : 'Add Shipping Method'}</DialogTitle>
          <DialogDescription>
            Configure shipping method details and pricing
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="method_name">Method Name</Label>
            <Input
              id="method_name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Standard Shipping, Express Delivery"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="method_type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as ShippingMethod['type'] })}
            >
              <SelectTrigger id="method_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flat_rate">Flat Rate</SelectItem>
                <SelectItem value="free_shipping">Free Shipping</SelectItem>
                <SelectItem value="local_pickup">Local Pickup</SelectItem>
                <SelectItem value="table_rate">Table Rate</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {formData.type !== 'free_shipping' && formData.type !== 'local_pickup' && (
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cost">Cost</Label>
                <Input
                  id="cost"
                  type="number"
                  value={formData.cost || ''}
                  onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="handling_fee">Handling Fee</Label>
                <Input
                  id="handling_fee"
                  type="number"
                  value={formData.handling_fee || ''}
                  onChange={(e) => setFormData({ ...formData, handling_fee: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
            </div>
          )}
          
          {formData.type === 'flat_rate' && (
            <div className="space-y-2">
              <Label htmlFor="free_threshold">Free Shipping Threshold</Label>
              <Input
                id="free_threshold"
                type="number"
                value={formData.free_shipping_threshold || ''}
                onChange={(e) => setFormData({ ...formData, free_shipping_threshold: parseFloat(e.target.value) || undefined })}
                placeholder="Orders above this amount ship free"
              />
            </div>
          )}
          
          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="min_order">Min Order Amount</Label>
              <Input
                id="min_order"
                type="number"
                value={formData.min_order_amount || ''}
                onChange={(e) => setFormData({ ...formData, min_order_amount: parseFloat(e.target.value) || undefined })}
                placeholder="Optional"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="max_order">Max Order Amount</Label>
              <Input
                id="max_order"
                type="number"
                value={formData.max_order_amount || ''}
                onChange={(e) => setFormData({ ...formData, max_order_amount: parseFloat(e.target.value) || undefined })}
                placeholder="Optional"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="delivery_time">Estimated Delivery Time</Label>
            <Input
              id="delivery_time"
              value={formData.delivery_time || ''}
              onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
              placeholder="e.g., 3-5 business days"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tax_status">Tax Status</Label>
            <Select
              value={formData.tax_status}
              onValueChange={(value) => setFormData({ ...formData, tax_status: value as ShippingMethod['tax_status'] })}
            >
              <SelectTrigger id="tax_status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="taxable">Taxable</SelectItem>
                <SelectItem value="none">Not Taxable</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="enabled">Enabled</Label>
            <Switch
              id="enabled"
              checked={formData.enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Method</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// SHIPPING ZONE DIALOG
// ============================================================================

interface ShippingZoneDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  zone?: ShippingZone | null
  onSave: (zone: ShippingZone) => void
}

function ShippingZoneDialog({ open, onOpenChange, zone, onSave }: ShippingZoneDialogProps) {
  // State initializes from zone prop - key prop ensures remount with new data
  const [name, setName] = useState(zone?.name || '')
  const [regions, setRegions] = useState<string[]>(zone?.regions || [])
  const [methods, setMethods] = useState<ShippingMethod[]>(zone?.methods || [])
  const [methodDialogOpen, setMethodDialogOpen] = useState(false)
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null)
  
  const countryList = getCountryList()
  
  const handleAddMethod = () => {
    setEditingMethod(null)
    setMethodDialogOpen(true)
  }
  
  const handleEditMethod = (method: ShippingMethod) => {
    setEditingMethod(method)
    setMethodDialogOpen(true)
  }
  
  const handleSaveMethod = (method: ShippingMethod) => {
    const existingIndex = methods.findIndex(m => m.id === method.id)
    if (existingIndex >= 0) {
      const updated = [...methods]
      updated[existingIndex] = method
      setMethods(updated)
    } else {
      setMethods([...methods, method])
    }
    setMethodDialogOpen(false)
  }
  
  const handleDeleteMethod = (methodId: string) => {
    setMethods(methods.filter(m => m.id !== methodId))
  }
  
  const handleSave = () => {
    if (!name) {
      toast.error('Please enter a zone name')
      return
    }
    
    onSave({
      id: zone?.id || `zone-${Date.now()}`,
      name,
      regions,
      methods
    })
    onOpenChange(false)
  }
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{zone ? 'Edit Shipping Zone' : 'Add Shipping Zone'}</DialogTitle>
            <DialogDescription>
              Configure shipping methods for specific regions
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="zone_name">Zone Name</Label>
              <Input
                id="zone_name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Domestic, International, SADC"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Regions</Label>
              <Select
                value=""
                onValueChange={(value) => {
                  if (!regions.includes(value)) {
                    setRegions([...regions, value])
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Add a country or region..." />
                </SelectTrigger>
                <SelectContent>
                  {countryList
                    .filter(c => !regions.includes(c.code))
                    .map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-2 mt-2">
                {regions.map((code) => {
                  const country = countryList.find(c => c.code === code)
                  return (
                    <Badge key={code} variant="secondary" className="flex items-center gap-1">
                      {country?.name || code}
                      <button
                        onClick={() => setRegions(regions.filter(c => c !== code))}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  )
                })}
                {regions.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No regions selected. Leave empty to apply to all regions.
                  </p>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Shipping Methods</Label>
                <Button variant="outline" size="sm" onClick={handleAddMethod}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Method
                </Button>
              </div>
              
              {methods.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <Truck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No shipping methods. Add one to enable shipping for this zone.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Method</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {methods.map((method) => (
                      <TableRow key={method.id}>
                        <TableCell className="font-medium">{method.name}</TableCell>
                        <TableCell className="capitalize">{method.type.replace('_', ' ')}</TableCell>
                        <TableCell>
                          {method.type === 'free_shipping' ? 'Free' : `${DEFAULT_CURRENCY_SYMBOL}${method.cost.toFixed(2)}`}
                        </TableCell>
                        <TableCell>
                          <Badge variant={method.enabled ? 'default' : 'secondary'}>
                            {method.enabled ? 'Active' : 'Disabled'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEditMethod(method)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteMethod(method.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Zone</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <ShippingMethodDialog
        key={editingMethod?.id || 'new-method'}
        open={methodDialogOpen}
        onOpenChange={setMethodDialogOpen}
        method={editingMethod}
        onSave={handleSaveMethod}
      />
    </>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ShippingSettingsForm({ siteId, agencyId }: ShippingSettingsFormProps) {
  const [settings, setSettings] = useState<ShippingSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [zoneDialogOpen, setZoneDialogOpen] = useState(false)
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null)
  
  const countryList = getCountryList()

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getSettingsTab<ShippingSettings>(siteId, 'shipping')
        setSettings(data)
      } catch (error) {
        console.error('Error loading settings:', error)
        toast.error('Failed to load shipping settings')
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [siteId])

  const updateField = <K extends keyof ShippingSettings>(field: K, value: ShippingSettings[K]) => {
    if (!settings) return
    setSettings({ ...settings, [field]: value })
    setHasChanges(true)
  }
  
  const updateOriginField = (field: string, value: string) => {
    if (!settings) return
    setSettings({
      ...settings,
      shipping_origin: { ...settings.shipping_origin, [field]: value }
    })
    setHasChanges(true)
  }
  
  const updatePackageField = (field: string, value: number) => {
    if (!settings) return
    setSettings({
      ...settings,
      default_package_dimensions: { ...settings.default_package_dimensions, [field]: value }
    })
    setHasChanges(true)
  }
  
  const handleAddZone = () => {
    setEditingZone(null)
    setZoneDialogOpen(true)
  }
  
  const handleEditZone = (zone: ShippingZone) => {
    setEditingZone(zone)
    setZoneDialogOpen(true)
  }
  
  const handleDeleteZone = (zoneId: string) => {
    if (!settings) return
    if (!confirm('Are you sure you want to delete this shipping zone?')) return
    setSettings({
      ...settings,
      shipping_zones: settings.shipping_zones.filter(z => z.id !== zoneId)
    })
    setHasChanges(true)
  }
  
  const handleSaveZone = (zone: ShippingZone) => {
    if (!settings) return
    const existingIndex = settings.shipping_zones.findIndex(z => z.id === zone.id)
    if (existingIndex >= 0) {
      const updated = [...settings.shipping_zones]
      updated[existingIndex] = zone
      setSettings({ ...settings, shipping_zones: updated })
    } else {
      setSettings({ ...settings, shipping_zones: [...settings.shipping_zones, zone] })
    }
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!settings) return
    setIsSaving(true)
    try {
      const result = await updateShippingSettings(siteId, agencyId, settings)
      if (result.success) {
        toast.success('Shipping settings saved successfully')
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
      {/* Shipping Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Shipping Configuration</CardTitle>
          <CardDescription>Enable and configure shipping options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Shipping</Label>
              <p className="text-sm text-muted-foreground">Calculate and charge shipping on orders</p>
            </div>
            <Switch
              checked={settings.enable_shipping}
              onCheckedChange={(checked) => updateField('enable_shipping', checked)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="shipping_calculations">Shipping Calculations</Label>
            <Select
              value={settings.shipping_calculations}
              onValueChange={(value) => updateField('shipping_calculations', value as ShippingSettings['shipping_calculations'])}
            >
              <SelectTrigger id="shipping_calculations">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="per_order">Per Order</SelectItem>
                <SelectItem value="per_item">Per Item</SelectItem>
                <SelectItem value="per_class">Per Shipping Class</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Origin */}
      <Card>
        <CardHeader>
          <CardTitle>Shipping Origin</CardTitle>
          <CardDescription>Where your shipments originate from</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="origin_address">Address</Label>
            <Input
              id="origin_address"
              value={settings.shipping_origin.address_line_1}
              onChange={(e) => updateOriginField('address_line_1', e.target.value)}
              placeholder="Street address"
            />
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="origin_city">City</Label>
              <Input
                id="origin_city"
                value={settings.shipping_origin.city}
                onChange={(e) => updateOriginField('city', e.target.value)}
                placeholder="City"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="origin_state">State/Province</Label>
              <Input
                id="origin_state"
                value={settings.shipping_origin.state}
                onChange={(e) => updateOriginField('state', e.target.value)}
                placeholder="State or province"
              />
            </div>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="origin_postal">Postal Code</Label>
              <Input
                id="origin_postal"
                value={settings.shipping_origin.postal_code}
                onChange={(e) => updateOriginField('postal_code', e.target.value)}
                placeholder="Postal code"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="origin_country">Country</Label>
              <Select
                value={settings.shipping_origin.country}
                onValueChange={(value) => updateOriginField('country', value)}
              >
                <SelectTrigger id="origin_country">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countryList.map((country) => (
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

      {/* Default Package Dimensions */}
      <Card>
        <CardHeader>
          <CardTitle>Default Package Dimensions</CardTitle>
          <CardDescription>Default dimensions for shipping calculations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="pkg_length">Length (cm)</Label>
              <Input
                id="pkg_length"
                type="number"
                value={settings.default_package_dimensions.length}
                onChange={(e) => updatePackageField('length', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pkg_width">Width (cm)</Label>
              <Input
                id="pkg_width"
                type="number"
                value={settings.default_package_dimensions.width}
                onChange={(e) => updatePackageField('width', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pkg_height">Height (cm)</Label>
              <Input
                id="pkg_height"
                type="number"
                value={settings.default_package_dimensions.height}
                onChange={(e) => updatePackageField('height', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pkg_weight">Weight (kg)</Label>
              <Input
                id="pkg_weight"
                type="number"
                value={settings.default_package_dimensions.weight}
                onChange={(e) => updatePackageField('weight', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Zones */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Shipping Zones</CardTitle>
            <CardDescription>Configure shipping methods for different regions</CardDescription>
          </div>
          <Button onClick={handleAddZone}>
            <Plus className="h-4 w-4 mr-2" />
            Add Zone
          </Button>
        </CardHeader>
        <CardContent>
          {settings.shipping_zones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No shipping zones configured. Add a zone to start shipping to customers.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zone Name</TableHead>
                  <TableHead>Regions</TableHead>
                  <TableHead>Methods</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settings.shipping_zones.map((zone) => (
                  <TableRow key={zone.id}>
                    <TableCell className="font-medium">{zone.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {zone.regions.length === 0 ? (
                          <Badge variant="outline">All Regions</Badge>
                        ) : (
                          <>
                            {zone.regions.slice(0, 3).map((code) => (
                              <Badge key={code} variant="outline">{code}</Badge>
                            ))}
                            {zone.regions.length > 3 && (
                              <Badge variant="secondary">+{zone.regions.length - 3} more</Badge>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{zone.methods.length} method(s)</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEditZone(zone)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteZone(zone.id)}>
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
        <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* Zone Dialog */}
      <ShippingZoneDialog
        key={editingZone?.id || 'new-zone'}
        open={zoneDialogOpen}
        onOpenChange={setZoneDialogOpen}
        zone={editingZone}
        onSave={handleSaveZone}
      />
    </div>
  )
}
