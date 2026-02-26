/**
 * Inventory Settings Component
 * 
 * Phase ECOM-03: Settings & Configuration Center
 * 
 * Inventory tracking and stock management settings
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
import { Loader2, Save, Info } from 'lucide-react'
import { toast } from 'sonner'
import type { InventorySettings } from '../../types/ecommerce-types'
import { getSettingsTab, updateInventorySettings } from '../../actions/settings-actions'

// ============================================================================
// TYPES
// ============================================================================

interface InventorySettingsFormProps {
  siteId: string
  agencyId: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function InventorySettingsForm({ siteId, agencyId }: InventorySettingsFormProps) {
  const [settings, setSettings] = useState<InventorySettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Load settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getSettingsTab<InventorySettings>(siteId, 'inventory')
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
  const updateField = <K extends keyof InventorySettings>(
    field: K, 
    value: InventorySettings[K]
  ) => {
    if (!settings) return
    setSettings({ ...settings, [field]: value })
    setHasChanges(true)
  }

  // Save handler
  const handleSave = async () => {
    if (!settings) return
    
    setIsSaving(true)
    try {
      const result = await updateInventorySettings(siteId, agencyId, settings)
      if (result.success) {
        toast.success('Inventory settings saved')
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
      {/* Stock Management */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Management</CardTitle>
          <CardDescription>
            Configure how inventory is tracked and managed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Track Inventory</Label>
              <p className="text-sm text-muted-foreground">
                Enable stock tracking for products
              </p>
            </div>
            <Switch
              checked={settings.track_inventory}
              onCheckedChange={(checked) => updateField('track_inventory', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Manage Stock Status</Label>
              <p className="text-sm text-muted-foreground">
                Automatically update stock status when inventory changes
              </p>
            </div>
            <Switch
              checked={settings.manage_stock_status}
              onCheckedChange={(checked) => updateField('manage_stock_status', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="allow_backorders">Backorders</Label>
            <Select
              value={settings.allow_backorders}
              onValueChange={(value) => updateField('allow_backorders', value as 'no' | 'notify' | 'yes')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no">Do not allow</SelectItem>
                <SelectItem value="notify">Allow, but notify customer</SelectItem>
                <SelectItem value="yes">Allow</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Low Stock */}
      <Card>
        <CardHeader>
          <CardTitle>Low Stock Alerts</CardTitle>
          <CardDescription>
            Configure when to show low stock warnings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
              <Input
                id="low_stock_threshold"
                type="number"
                min="0"
                value={settings.low_stock_threshold}
                onChange={(e) => updateField('low_stock_threshold', Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Products with stock at or below this number will trigger low stock alerts
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock_display">Stock Display</Label>
              <Select
                value={settings.stock_display}
                onValueChange={(value) => updateField('stock_display', value as 'always' | 'low_only' | 'never')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="always">Always show stock</SelectItem>
                  <SelectItem value="low_only">Only show when low</SelectItem>
                  <SelectItem value="never">Never show stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Out of Stock */}
      <Card>
        <CardHeader>
          <CardTitle>Out of Stock Behavior</CardTitle>
          <CardDescription>
            What happens when products run out of stock
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="out_of_stock_visibility">Out of Stock Visibility</Label>
            <Select
              value={settings.out_of_stock_visibility}
              onValueChange={(value) => updateField('out_of_stock_visibility', value as 'hide' | 'show' | 'show_marked')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hide">Hide out of stock products</SelectItem>
                <SelectItem value="show">Show out of stock products</SelectItem>
                <SelectItem value="show_marked">Show with &quot;Out of Stock&quot; badge</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reserved Stock */}
      <Card>
        <CardHeader>
          <CardTitle>Reserved Stock</CardTitle>
          <CardDescription>
            Manage stock reservation during checkout
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hold_stock_minutes">Hold Stock Duration</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="hold_stock_minutes"
                  type="number"
                  min="0"
                  value={settings.hold_stock_minutes}
                  onChange={(e) => updateField('hold_stock_minutes', Number(e.target.value))}
                />
                <span className="text-sm text-muted-foreground">minutes</span>
              </div>
              <p className="text-xs text-muted-foreground">
                How long to reserve stock for pending orders (0 = no reservation)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reserved_stock_expiry">Reserved Stock Expiry</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="reserved_stock_expiry"
                  type="number"
                  min="0"
                  value={settings.reserved_stock_expiry_hours}
                  onChange={(e) => updateField('reserved_stock_expiry_hours', Number(e.target.value))}
                />
                <span className="text-sm text-muted-foreground">hours</span>
              </div>
              <p className="text-xs text-muted-foreground">
                When to release stock from unpaid orders
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm text-primary dark:text-primary/80">
                <p className="font-medium">How stock reservation works</p>
                <p className="mt-1 text-primary/80 dark:text-primary/70">
                  When a customer adds items to their cart and starts checkout, 
                  stock is reserved for the duration you specify. If the order 
                  isn&apos;t completed within that time, the stock is automatically released.
                </p>
              </div>
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
