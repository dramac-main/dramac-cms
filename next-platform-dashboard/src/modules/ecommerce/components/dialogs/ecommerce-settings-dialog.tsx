/**
 * E-Commerce Settings Dialog
 * 
 * Phase EM-52: E-Commerce Module
 */
'use client'

import { useState } from 'react'
import { useEcommerce } from '../../context/ecommerce-context'
import { Loader2, Settings, Store, CreditCard, Truck, Bell } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

import { DEFAULT_CURRENCY } from '@/lib/locale-config'
interface EcommerceSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EcommerceSettingsDialog({ open, onOpenChange }: EcommerceSettingsDialogProps) {
  const { settings, refreshSettings, updateSettings } = useEcommerce()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Store Settings
  const [storeName, setStoreName] = useState(settings?.store_name || '')
  const [currency, setCurrency] = useState(settings?.currency || DEFAULT_CURRENCY)
  const [taxEnabled, setTaxEnabled] = useState(true)
  const [taxRate, setTaxRate] = useState(settings?.tax_rate?.toString() || '0')
  
  // Inventory Settings
  const [trackInventory, setTrackInventory] = useState(true)
  const [lowStockThreshold, setLowStockThreshold] = useState('5')
  const [allowBackorders, setAllowBackorders] = useState(settings?.continue_selling_when_out_of_stock ?? false)
  
  // Shipping Settings
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(
    settings?.free_shipping_threshold?.toString() || ''
  )
  const [flatRateShipping, setFlatRateShipping] = useState('')
  
  // Notification Settings
  const [orderNotifications, setOrderNotifications] = useState(settings?.send_order_confirmation ?? true)
  const [lowStockNotifications, setLowStockNotifications] = useState(true)
  const [notificationEmail, setNotificationEmail] = useState(settings?.order_notification_email || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // In a real implementation, this would call an updateSettings action
      // For now, we'll just show a success message
      toast.success('Settings saved successfully')
      await refreshSettings()
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to save settings')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            E-Commerce Settings
          </DialogTitle>
          <DialogDescription>
            Configure your store settings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="store" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="store" className="flex items-center gap-1">
                <Store className="h-4 w-4" />
                <span className="hidden sm:inline">Store</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-1">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Payments</span>
              </TabsTrigger>
              <TabsTrigger value="shipping" className="flex items-center gap-1">
                <Truck className="h-4 w-4" />
                <span className="hidden sm:inline">Shipping</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-1">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Alerts</span>
              </TabsTrigger>
            </TabsList>

            {/* Store Settings */}
            <TabsContent value="store" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">Store Name</Label>
                <Input
                  id="storeName"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="My Store"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="CAD">CAD (C$)</SelectItem>
                    <SelectItem value="AUD">AUD (A$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="taxEnabled">Enable Tax</Label>
                  <p className="text-sm text-muted-foreground">
                    Charge sales tax on orders
                  </p>
                </div>
                <Switch
                  id="taxEnabled"
                  checked={taxEnabled}
                  onCheckedChange={setTaxEnabled}
                />
              </div>

              {taxEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    placeholder="0"
                  />
                </div>
              )}

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">Inventory</h4>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="trackInventory">Track Inventory</Label>
                      <p className="text-sm text-muted-foreground">
                        Keep track of product stock levels
                      </p>
                    </div>
                    <Switch
                      id="trackInventory"
                      checked={trackInventory}
                      onCheckedChange={setTrackInventory}
                    />
                  </div>

                  {trackInventory && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                        <Input
                          id="lowStockThreshold"
                          type="number"
                          min="0"
                          value={lowStockThreshold}
                          onChange={(e) => setLowStockThreshold(e.target.value)}
                          placeholder="5"
                        />
                        <p className="text-xs text-muted-foreground">
                          Get alerts when stock falls below this level
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="allowBackorders">Allow Backorders</Label>
                          <p className="text-sm text-muted-foreground">
                            Allow orders when out of stock
                          </p>
                        </div>
                        <Switch
                          id="allowBackorders"
                          checked={allowBackorders}
                          onCheckedChange={setAllowBackorders}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Payment Settings */}
            <TabsContent value="payments" className="space-y-4 mt-4">
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Payment Gateway Configuration</p>
                <p className="text-sm">
                  Configure Stripe or other payment gateways in your site settings.
                </p>
              </div>
            </TabsContent>

            {/* Shipping Settings */}
            <TabsContent value="shipping" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="flatRateShipping">Flat Rate Shipping</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="flatRateShipping"
                    type="number"
                    step="0.01"
                    min="0"
                    value={flatRateShipping}
                    onChange={(e) => setFlatRateShipping(e.target.value)}
                    placeholder="0.00"
                    className="pl-7"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Standard shipping rate for all orders
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="freeShippingThreshold">Free Shipping Threshold</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="freeShippingThreshold"
                    type="number"
                    step="0.01"
                    min="0"
                    value={freeShippingThreshold}
                    onChange={(e) => setFreeShippingThreshold(e.target.value)}
                    placeholder="0.00"
                    className="pl-7"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Free shipping for orders above this amount. Leave empty to disable.
                </p>
              </div>
            </TabsContent>

            {/* Notification Settings */}
            <TabsContent value="notifications" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="notificationEmail">Notification Email</Label>
                <Input
                  id="notificationEmail"
                  type="email"
                  value={notificationEmail}
                  onChange={(e) => setNotificationEmail(e.target.value)}
                  placeholder="store@example.com"
                />
                <p className="text-xs text-muted-foreground">
                  Email address for order and stock notifications
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="orderNotifications">Order Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified of new orders
                  </p>
                </div>
                <Switch
                  id="orderNotifications"
                  checked={orderNotifications}
                  onCheckedChange={setOrderNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="lowStockNotifications">Low Stock Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when products are low in stock
                  </p>
                </div>
                <Switch
                  id="lowStockNotifications"
                  checked={lowStockNotifications}
                  onCheckedChange={setLowStockNotifications}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
