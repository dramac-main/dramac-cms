/**
 * Quote Settings Component
 * 
 * Phase ECOM-13: Quote Templates & Automation
 * 
 * Configure quote numbering, defaults, branding, and automation
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Loader2, 
  Save, 
  FileText, 
  Bell, 
  Palette,
  Hash,
  Clock,
  ToggleLeft,
  ShoppingCart,
  Info
} from 'lucide-react'
import { toast } from 'sonner'
import { getQuoteSiteSettings, upsertQuoteSiteSettings } from '../../actions/quote-template-actions'
import { getEcommerceSettings, updateEcommerceSettings } from '../../actions/ecommerce-actions'
import { createQuotePage, deleteQuotePage } from '../../actions/auto-setup-actions'

import { DEFAULT_CURRENCY } from '@/lib/locale-config'
// ============================================================================
// TYPES
// ============================================================================

interface QuoteSettingsFormProps {
  siteId: string
  agencyId: string
}

// Use QuoteSiteSettingsUpdate as form data type since it has all optional fields
type FormData = {
  quote_number_prefix?: string
  quote_number_padding?: number
  next_quote_number?: number
  default_validity_days?: number
  default_tax_rate?: number
  default_currency?: string
  auto_expire_enabled?: boolean
  auto_reminder_enabled?: boolean
  reminder_days_before?: number
  max_reminders?: number
  send_acceptance_notification?: boolean
  send_rejection_notification?: boolean
  cc_email_on_send?: string
  company_name?: string
  company_address?: string
  company_phone?: string
  company_email?: string
  logo_url?: string
  primary_color?: string
  default_introduction?: string
  default_terms?: string
  default_footer?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuoteSettingsForm({ siteId, agencyId }: QuoteSettingsFormProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('numbering')

  // Quotation mode state (stored in EcommerceSettings, not QuoteSiteSettings)
  const [quotationModeEnabled, setQuotationModeEnabled] = useState(false)
  const [quotationHidePrices, setQuotationHidePrices] = useState(false)
  const [quotationButtonLabel, setQuotationButtonLabel] = useState('Request a Quote')
  const [isSavingMode, setIsSavingMode] = useState(false)
  
  const { register, handleSubmit, setValue, watch, reset } = useForm<FormData>({
    defaultValues: {
      quote_number_prefix: 'QUO-',
      quote_number_padding: 5,
      next_quote_number: 1,
      default_validity_days: 30,
      default_tax_rate: 0,
      default_currency: DEFAULT_CURRENCY,
      auto_expire_enabled: true,
      auto_reminder_enabled: false,
      reminder_days_before: 3,
      max_reminders: 2,
      send_acceptance_notification: true,
      send_rejection_notification: true,
      primary_color: ''
    }
  })

  // Load settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const [quoteSettings, ecomSettings] = await Promise.all([
          getQuoteSiteSettings(siteId),
          getEcommerceSettings(siteId)
        ])
        if (quoteSettings) {
          reset(quoteSettings as FormData)
        }
        if (ecomSettings) {
          setQuotationModeEnabled(ecomSettings.quotation_mode_enabled ?? false)
          setQuotationHidePrices(ecomSettings.quotation_hide_prices ?? false)
          setQuotationButtonLabel(ecomSettings.quotation_button_label || 'Request a Quote')
        }
      } catch (error) {
        console.error('Error loading quote settings:', error)
        toast.error('Failed to load quote settings')
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [siteId, reset])

  // Save settings
  const onSubmit = async (data: FormData) => {
    setIsSaving(true)
    try {
      const result = await upsertQuoteSiteSettings(siteId, agencyId, data)
      if (result.success) {
        toast.success('Quote settings saved successfully')
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error saving quote settings:', error)
      toast.error('Failed to save quote settings')
    } finally {
      setIsSaving(false)
    }
  }

  // Save quotation mode settings to EcommerceSettings
  const saveQuotationMode = useCallback(async (updates: {
    quotation_mode_enabled?: boolean
    quotation_hide_prices?: boolean
    quotation_button_label?: string
  }) => {
    setIsSavingMode(true)
    try {
      await updateEcommerceSettings(siteId, agencyId, updates)
      toast.success('Quotation mode updated')
    } catch (error) {
      console.error('Error updating quotation mode:', error)
      toast.error('Failed to update quotation mode')
    } finally {
      setIsSavingMode(false)
    }
  }, [siteId, agencyId])

  // Watch values for color preview
  const primaryColor = watch('primary_color')
  const autoReminderEnabled = watch('auto_reminder_enabled')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* ================================================================
          QUOTATION MODE - Master Toggle (industry-standard feature)
          ================================================================ */}
      <Card className={`border-2 transition-colors ${
        quotationModeEnabled
          ? 'border-orange-500/40 bg-orange-50/50 dark:bg-orange-950/20'
          : 'border-border'
      }`}>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${
                quotationModeEnabled ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-muted'
              }`}>
                <ToggleLeft className={`h-5 w-5 ${
                  quotationModeEnabled ? 'text-orange-600' : 'text-muted-foreground'
                }`} />
              </div>
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  Quotation Mode
                  {quotationModeEnabled && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400">
                      Active
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="mt-1">
                  When enabled, <strong>all &quot;Add to Cart&quot; buttons</strong> across your entire store become
                  &quot;Request a Quote&quot; — no purchases are processed automatically.
                  Ideal for B2B stores, custom-priced products, and wholesale businesses.
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={quotationModeEnabled}
              disabled={isSavingMode}
              onCheckedChange={async (checked) => {
                setQuotationModeEnabled(checked)
                await saveQuotationMode({ quotation_mode_enabled: checked })
                // Create or delete the /quotes page based on toggle
                if (checked) {
                  const result = await createQuotePage(siteId)
                  if (result.success) {
                    toast.success('Quotes page created')
                  } else {
                    toast.error('Failed to create quotes page')
                  }
                } else {
                  const result = await deleteQuotePage(siteId)
                  if (result.success) {
                    toast.success('Quotes page removed')
                  } else {
                    toast.error('Failed to remove quotes page')
                  }
                }
              }}
            />
          </div>
        </CardHeader>
        {quotationModeEnabled && (
          <CardContent className="space-y-4 pt-0">
            <Separator />
            <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-100/60 dark:bg-orange-900/20 text-sm text-orange-800 dark:text-orange-300">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <p>Quotation mode is active. Customers will request quotes instead of purchasing directly.
                All pricing remains visible unless you enable &quot;Hide Prices&quot; below.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quotation_button_label">Button Label</Label>
                <Input
                  id="quotation_button_label"
                  value={quotationButtonLabel}
                  onChange={(e) => setQuotationButtonLabel(e.target.value)}
                  onBlur={() => saveQuotationMode({ quotation_button_label: quotationButtonLabel })}
                  placeholder="Request a Quote"
                />
                <p className="text-xs text-muted-foreground">Text shown on product buttons (e.g. &quot;Get a Price&quot;, &quot;Request Quote&quot;)</p>
              </div>
              <div className="space-y-3">
                <Label>Display Options</Label>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Hide Prices</p>
                    <p className="text-xs text-muted-foreground">Mask all prices — customers must request a quote to see pricing</p>
                  </div>
                  <Switch
                    checked={quotationHidePrices}
                    disabled={isSavingMode}
                    onCheckedChange={async (checked) => {
                      setQuotationHidePrices(checked)
                      await saveQuotationMode({ quotation_hide_prices: checked })
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>The cart is disabled in quotation mode. Customers use the Quotes system instead.</span>
            </div>
          </CardContent>
        )}
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="numbering" className="flex items-center gap-2">
            <Hash className="h-4 w-4" />
            <span className="hidden sm:inline">Numbering</span>
          </TabsTrigger>
          <TabsTrigger value="defaults" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Defaults</span>
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Automation</span>
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Branding</span>
          </TabsTrigger>
        </TabsList>

        {/* Numbering Settings */}
        <TabsContent value="numbering" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Quote Numbering
              </CardTitle>
              <CardDescription>
                Configure how quote numbers are generated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quote_number_prefix">Quote Number Prefix</Label>
                  <Input
                    id="quote_number_prefix"
                    {...register('quote_number_prefix')}
                    placeholder="QUO-"
                  />
                  <p className="text-xs text-muted-foreground">
                    Text that appears before the number (e.g., QUO-, INV-, Q-)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="quote_number_padding">Number Padding</Label>
                  <Input
                    id="quote_number_padding"
                    type="number"
                    min={1}
                    max={10}
                    {...register('quote_number_padding', { valueAsNumber: true })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of digits (e.g., 5 = QUO-00001)
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="next_quote_number">Next Quote Number</Label>
                <Input
                  id="next_quote_number"
                  type="number"
                  min={1}
                  {...register('next_quote_number', { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">
                  The number that will be used for the next quote
                </p>
              </div>
              
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm">
                  <span className="text-muted-foreground">Preview: </span>
                  <span className="font-mono font-medium">
                    {watch('quote_number_prefix')}
                    {String(watch('next_quote_number') || 1).padStart(watch('quote_number_padding') || 5, '0')}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Default Settings */}
        <TabsContent value="defaults" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Default Quote Settings
              </CardTitle>
              <CardDescription>
                Set default values for new quotes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default_validity_days">Validity Period (Days)</Label>
                  <Input
                    id="default_validity_days"
                    type="number"
                    min={1}
                    max={365}
                    {...register('default_validity_days', { valueAsNumber: true })}
                  />
                  <p className="text-xs text-muted-foreground">
                    How long quotes remain valid
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="default_tax_rate">Default Tax Rate (%)</Label>
                  <Input
                    id="default_tax_rate"
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    {...register('default_tax_rate', { valueAsNumber: true })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="default_currency">Default Currency</Label>
                  <Input
                    id="default_currency"
                    {...register('default_currency')}
                    placeholder="ZMW"
                    maxLength={3}
                    className="uppercase"
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="default_introduction">Default Introduction</Label>
                <Textarea
                  id="default_introduction"
                  {...register('default_introduction')}
                  placeholder="Thank you for your interest. Please find our quote below..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Default text shown at the top of quotes
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="default_terms">Default Terms & Conditions</Label>
                <Textarea
                  id="default_terms"
                  {...register('default_terms')}
                  placeholder="Payment terms, delivery information, etc."
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="default_footer">Default Footer</Label>
                <Textarea
                  id="default_footer"
                  {...register('default_footer')}
                  placeholder="Thank you for your business!"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation Settings */}
        <TabsContent value="automation" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Automation & Notifications
              </CardTitle>
              <CardDescription>
                Configure automated actions and email notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Auto-expire */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Expire Quotes</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically mark quotes as expired after validity period
                  </p>
                </div>
                <Switch
                  checked={watch('auto_expire_enabled')}
                  onCheckedChange={(checked) => setValue('auto_expire_enabled', checked)}
                />
              </div>
              
              <Separator />
              
              {/* Reminders */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Send automatic reminders before quote expires
                    </p>
                  </div>
                  <Switch
                    checked={watch('auto_reminder_enabled')}
                    onCheckedChange={(checked) => setValue('auto_reminder_enabled', checked)}
                  />
                </div>
                
                {autoReminderEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-muted">
                    <div className="space-y-2">
                      <Label htmlFor="reminder_days_before">Days Before Expiry</Label>
                      <Input
                        id="reminder_days_before"
                        type="number"
                        min={1}
                        max={30}
                        {...register('reminder_days_before', { valueAsNumber: true })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="max_reminders">Max Reminders</Label>
                      <Input
                        id="max_reminders"
                        type="number"
                        min={1}
                        max={5}
                        {...register('max_reminders', { valueAsNumber: true })}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <Separator />
              
              {/* Notifications */}
              <div className="space-y-4">
                <h4 className="font-medium">Email Notifications</h4>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Quote Accepted Notification</Label>
                    <p className="text-sm text-muted-foreground">
                      Email me when a customer accepts a quote
                    </p>
                  </div>
                  <Switch
                    checked={watch('send_acceptance_notification')}
                    onCheckedChange={(checked) => setValue('send_acceptance_notification', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Quote Rejected Notification</Label>
                    <p className="text-sm text-muted-foreground">
                      Email me when a customer rejects a quote
                    </p>
                  </div>
                  <Switch
                    checked={watch('send_rejection_notification')}
                    onCheckedChange={(checked) => setValue('send_rejection_notification', checked)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cc_email_on_send">CC Email Address</Label>
                  <Input
                    id="cc_email_on_send"
                    type="email"
                    {...register('cc_email_on_send')}
                    placeholder="cc@example.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Send a copy of all quote emails to this address
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Settings */}
        <TabsContent value="branding" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Quote Branding
              </CardTitle>
              <CardDescription>
                Customize how quotes appear to customers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    {...register('company_name')}
                    placeholder="Your Company Name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company_email">Company Email</Label>
                  <Input
                    id="company_email"
                    type="email"
                    {...register('company_email')}
                    placeholder="sales@company.com"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_phone">Company Phone</Label>
                  <Input
                    id="company_phone"
                    {...register('company_phone')}
                    placeholder="+260 97 1234567"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="primary_color">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary_color"
                      {...register('primary_color')}
                      placeholder="Site brand color"
                      className="flex-1"
                    />
                    <div 
                      className="w-10 h-10 rounded-md border"
                      style={{ backgroundColor: primaryColor || '#0f172a' }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company_address">Company Address</Label>
                <Textarea
                  id="company_address"
                  {...register('company_address')}
                  placeholder="123 Business St, Suite 100&#10;City, State 12345&#10;Country"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  {...register('logo_url')}
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-xs text-muted-foreground">
                  URL to your company logo (displayed on quotes and PDFs)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Quote Settings
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
