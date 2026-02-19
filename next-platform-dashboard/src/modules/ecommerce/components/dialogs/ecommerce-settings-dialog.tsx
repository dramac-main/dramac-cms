/**
 * E-Commerce Settings Dialog
 * 
 * Phase EM-52: E-Commerce Module
 */
'use client'

import { useState } from 'react'
import { useEcommerce } from '../../context/ecommerce-context'
import { Loader2, Settings, Store, CreditCard, Truck, Bell, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react'
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

import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES, getCurrencySymbol } from '@/lib/locale-config'
import type { PaymentProvider } from '../../types/ecommerce-types'
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

  // Payment Settings
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider | ''>(
    (settings?.payment_provider as PaymentProvider) || ''
  )
  const [flutterwavePublicKey, setFlutterwavePublicKey] = useState(
    (settings?.flutterwave_config as { public_key?: string } | null)?.public_key || ''
  )
  const [flutterwaveSecretKey, setFlutterwaveSecretKey] = useState('')
  const [flutterwaveEnvironment, setFlutterwaveEnvironment] = useState<'test' | 'live'>('test')
  const [pesapalConsumerKey, setPesapalConsumerKey] = useState(
    (settings?.pesapal_config as { consumer_key?: string } | null)?.consumer_key || ''
  )
  const [pesapalConsumerSecret, setPesapalConsumerSecret] = useState('')
  const [pesapalEnvironment, setPesapalEnvironment] = useState<'demo' | 'live'>('demo')
  const [manualInstructions, setManualInstructions] = useState('')

  // Derived
  const currencySymbol = getCurrencySymbol(currency)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await updateSettings({
        store_name: storeName.trim() || null,
        currency,
        tax_rate: parseFloat(taxRate) || 0,
        tax_included_in_price: taxEnabled,
        continue_selling_when_out_of_stock: allowBackorders,
        free_shipping_threshold: freeShippingThreshold ? parseFloat(freeShippingThreshold) : null,
        send_order_confirmation: orderNotifications,
        order_notification_email: notificationEmail.trim() || null,
        payment_provider: paymentProvider || null,
        ...(paymentProvider === 'flutterwave' && flutterwavePublicKey ? {
          flutterwave_config: {
            enabled: true,
            public_key: flutterwavePublicKey,
            secret_key: flutterwaveSecretKey,
            encryption_key: '',
            webhook_secret_hash: '',
            secret_hash: '',
            environment: flutterwaveEnvironment,
            supported_methods: ['card', 'mobilemoney', 'bank_transfer'],
          }
        } : {}),
        ...(paymentProvider === 'pesapal' && pesapalConsumerKey ? {
          pesapal_config: {
            enabled: true,
            consumer_key: pesapalConsumerKey,
            consumer_secret: pesapalConsumerSecret,
            callback_url: '',
            ipn_url: '',
            environment: pesapalEnvironment,
          }
        } : {}),
      })
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
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.code} ({c.symbol}) — {c.name}
                      </SelectItem>
                    ))}
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
              {/* Provider Selection */}
              <div className="space-y-2">
                <Label htmlFor="paymentProvider">Payment Gateway</Label>
                <Select value={paymentProvider} onValueChange={(v) => setPaymentProvider(v as PaymentProvider | '')}>
                  <SelectTrigger id="paymentProvider">
                    <SelectValue placeholder="Select a payment gateway" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None (disable payments)</SelectItem>
                    <SelectItem value="flutterwave">
                      🦋 Flutterwave — African cards, mobile money, bank transfer
                    </SelectItem>
                    <SelectItem value="pesapal">
                      🌍 Pesapal — East &amp; Southern Africa
                    </SelectItem>
                    <SelectItem value="dpo">
                      💳 DPO Pay — Zambia &amp; regional
                    </SelectItem>
                    <SelectItem value="manual">
                      📋 Manual Payment — Bank transfer / cash instructions
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Flutterwave Config */}
              {paymentProvider === 'flutterwave' && (
                <div className="space-y-4 border rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CreditCard className="h-4 w-4 text-orange-500" />
                    Flutterwave Configuration
                    <a
                      href="https://dashboard.flutterwave.com/settings/apis"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto text-xs text-primary flex items-center gap-1 hover:underline"
                    >
                      Get API keys <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="flwPublicKey">Public Key</Label>
                    <Input
                      id="flwPublicKey"
                      value={flutterwavePublicKey}
                      onChange={(e) => setFlutterwavePublicKey(e.target.value)}
                      placeholder="FLWPUBK_TEST-..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="flwSecretKey">Secret Key</Label>
                    <Input
                      id="flwSecretKey"
                      type="password"
                      value={flutterwaveSecretKey}
                      onChange={(e) => setFlutterwaveSecretKey(e.target.value)}
                      placeholder="FLWSECK_TEST-..."
                    />
                    <p className="text-xs text-muted-foreground">Stored encrypted. Leave blank to keep existing key.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="flwEnv">Environment</Label>
                    <Select value={flutterwaveEnvironment} onValueChange={(v) => setFlutterwaveEnvironment(v as 'test' | 'live')}>
                      <SelectTrigger id="flwEnv">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="test">🧪 Test / Sandbox</SelectItem>
                        <SelectItem value="live">🚀 Live / Production</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {flutterwaveEnvironment === 'live' && (
                    <div className="flex items-center gap-2 p-2 rounded bg-green-50 dark:bg-green-950/20 text-xs text-green-700 dark:text-green-400">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      Live mode — real transactions will be processed
                    </div>
                  )}
                </div>
              )}

              {/* Pesapal Config */}
              {paymentProvider === 'pesapal' && (
                <div className="space-y-4 border rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CreditCard className="h-4 w-4 text-blue-500" />
                    Pesapal Configuration
                    <a
                      href="https://developer.pesapal.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto text-xs text-primary flex items-center gap-1 hover:underline"
                    >
                      Docs <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pesapalKey">Consumer Key</Label>
                    <Input
                      id="pesapalKey"
                      value={pesapalConsumerKey}
                      onChange={(e) => setPesapalConsumerKey(e.target.value)}
                      placeholder="Your Pesapal consumer key"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pesapalSecret">Consumer Secret</Label>
                    <Input
                      id="pesapalSecret"
                      type="password"
                      value={pesapalConsumerSecret}
                      onChange={(e) => setPesapalConsumerSecret(e.target.value)}
                      placeholder="Your Pesapal consumer secret"
                    />
                    <p className="text-xs text-muted-foreground">Stored encrypted. Leave blank to keep existing secret.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pesapalEnv">Environment</Label>
                    <Select value={pesapalEnvironment} onValueChange={(v) => setPesapalEnvironment(v as 'demo' | 'live')}>
                      <SelectTrigger id="pesapalEnv">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="demo">🧪 Demo / Sandbox</SelectItem>
                        <SelectItem value="live">🚀 Live / Production</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* DPO Pay Config */}
              {paymentProvider === 'dpo' && (
                <div className="space-y-3 border rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CreditCard className="h-4 w-4 text-purple-500" />
                    DPO Pay
                    <a
                      href="https://secure.3gdirectpay.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto text-xs text-primary flex items-center gap-1 hover:underline"
                    >
                      Portal <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded bg-muted text-xs text-muted-foreground">
                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    Configure your DPO company token and service type in the full settings.
                    Contact DRAMAC support to complete DPO integration.
                  </div>
                </div>
              )}

              {/* Manual Payment Config */}
              {paymentProvider === 'manual' && (
                <div className="space-y-3 border rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CreditCard className="h-4 w-4 text-gray-500" />
                    Manual Payment Instructions
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Customers will see these instructions at checkout (e.g. bank account details, mobile money number).
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="manualInstructions">Payment Instructions</Label>
                    <textarea
                      id="manualInstructions"
                      className="w-full min-h-20 px-3 py-2 text-sm rounded-md border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                      value={manualInstructions}
                      onChange={(e) => setManualInstructions(e.target.value)}
                      placeholder="e.g. Pay via Airtel Money to: +260 97 123 4567 (DRAMAC AGENCY)&#10;Include your order number as reference."
                    />
                  </div>
                </div>
              )}

              {!paymentProvider && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-sm">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  No payment gateway selected. Customers will not be able to complete purchases.
                </div>
              )}
            </TabsContent>

            {/* Shipping Settings */}
            <TabsContent value="shipping" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="flatRateShipping">Flat Rate Shipping</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{currencySymbol}</span>
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
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{currencySymbol}</span>
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
