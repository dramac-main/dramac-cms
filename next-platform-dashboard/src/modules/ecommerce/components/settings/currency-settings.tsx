/**
 * Currency Settings Component
 * 
 * Phase ECOM-03: Settings & Configuration Center
 * 
 * Currency format and multi-currency settings
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
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import type { CurrencySettings } from '../../types/ecommerce-types'
import { getSettingsTab, updateCurrencySettings } from '../../actions/settings-actions'
import { getCurrencyList } from '../../lib/settings-utils'

// ============================================================================
// TYPES
// ============================================================================

interface CurrencySettingsFormProps {
  siteId: string
  agencyId: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CurrencySettingsForm({ siteId, agencyId }: CurrencySettingsFormProps) {
  const [settings, setSettings] = useState<CurrencySettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const currencies = getCurrencyList()

  // Load settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getSettingsTab<CurrencySettings>(siteId, 'currency')
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
  const updateField = <K extends keyof CurrencySettings>(
    field: K, 
    value: CurrencySettings[K]
  ) => {
    if (!settings) return
    setSettings({ ...settings, [field]: value })
    setHasChanges(true)
  }

  // Add supported currency
  const addSupportedCurrency = (code: string) => {
    if (!settings) return
    if (settings.supported_currencies.includes(code)) return
    updateField('supported_currencies', [...settings.supported_currencies, code])
  }

  // Remove supported currency
  const removeSupportedCurrency = (code: string) => {
    if (!settings) return
    if (code === settings.default_currency) {
      toast.error('Cannot remove default currency')
      return
    }
    updateField(
      'supported_currencies', 
      settings.supported_currencies.filter(c => c !== code)
    )
  }

  // Save handler
  const handleSave = async () => {
    if (!settings) return
    
    setIsSaving(true)
    try {
      const result = await updateCurrencySettings(siteId, agencyId, settings)
      if (result.success) {
        toast.success('Currency settings saved')
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

  // Format preview
  const formatPreview = () => {
    if (!settings) return '1,234.56'
    
    const number = 1234.56
    const [whole, decimal] = number.toFixed(settings.decimal_places).split('.')
    const formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, settings.thousand_separator)
    const formatted = settings.decimal_places > 0 
      ? `${formattedWhole}${settings.decimal_separator}${decimal}`
      : formattedWhole
    
    return settings.currency_position === 'before' 
      ? `${settings.currency_symbol}${formatted}`
      : `${formatted}${settings.currency_symbol}`
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
      {/* Default Currency */}
      <Card>
        <CardHeader>
          <CardTitle>Default Currency</CardTitle>
          <CardDescription>
            Primary currency for your store
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="default_currency">Currency</Label>
              <Select
                value={settings.default_currency}
                onValueChange={(value) => {
                  updateField('default_currency', value)
                  const curr = currencies.find(c => c.code === value)
                  if (curr) {
                    updateField('currency_symbol', curr.symbol)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name} ({currency.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency_symbol">Symbol</Label>
              <Input
                id="currency_symbol"
                value={settings.currency_symbol}
                onChange={(e) => updateField('currency_symbol', e.target.value)}
                placeholder="$"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Currency Format */}
      <Card>
        <CardHeader>
          <CardTitle>Currency Format</CardTitle>
          <CardDescription>
            How prices are displayed to customers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="currency_position">Symbol Position</Label>
              <Select
                value={settings.currency_position}
                onValueChange={(value) => updateField('currency_position', value as 'before' | 'after')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="before">Before ($100)</SelectItem>
                  <SelectItem value="after">After (100$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="decimal_places">Decimal Places</Label>
              <Select
                value={String(settings.decimal_places)}
                onValueChange={(value) => updateField('decimal_places', Number(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 (100)</SelectItem>
                  <SelectItem value="1">1 (100.0)</SelectItem>
                  <SelectItem value="2">2 (100.00)</SelectItem>
                  <SelectItem value="3">3 (100.000)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="decimal_separator">Decimal Separator</Label>
              <Select
                value={settings.decimal_separator}
                onValueChange={(value) => updateField('decimal_separator', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=".">Period (.)</SelectItem>
                  <SelectItem value=",">Comma (,)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="thousand_separator">Thousand Separator</Label>
              <Select
                value={settings.thousand_separator || 'none'}
                onValueChange={(value) => updateField('thousand_separator', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=",">Comma (,)</SelectItem>
                  <SelectItem value=".">Period (.)</SelectItem>
                  <SelectItem value=" ">Space ( )</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-lg border p-4 bg-muted/50">
            <Label className="text-sm text-muted-foreground">Preview</Label>
            <p className="text-2xl font-bold mt-1">{formatPreview()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Multi-Currency */}
      <Card>
        <CardHeader>
          <CardTitle>Multi-Currency</CardTitle>
          <CardDescription>
            Accept payments in multiple currencies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto Currency Conversion</Label>
              <p className="text-sm text-muted-foreground">
                Automatically convert prices based on customer location
              </p>
            </div>
            <Switch
              checked={settings.auto_currency_conversion}
              onCheckedChange={(checked) => updateField('auto_currency_conversion', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label>Supported Currencies</Label>
            <div className="flex flex-wrap gap-2">
              {settings.supported_currencies.map((code) => {
                const curr = currencies.find(c => c.code === code)
                return (
                  <Badge key={code} variant="secondary" className="gap-1">
                    {curr?.symbol} {code}
                    {code !== settings.default_currency && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => removeSupportedCurrency(code)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </Badge>
                )
              })}
            </div>
            
            <Select onValueChange={addSupportedCurrency} value="">
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Add currency..." />
              </SelectTrigger>
              <SelectContent>
                {currencies
                  .filter(c => !settings.supported_currencies.includes(c.code))
                  .map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
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
