/**
 * Legal Settings Component
 * 
 * Phase ECOM-03: Settings & Configuration Center
 * 
 * Terms, privacy, refund policy, and legal page configuration
 */
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Loader2, Save, FileText, Shield, RotateCcw, Truck, Scale, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import type { LegalSettings, LegalPage } from '../../types/ecommerce-types'
import { getSettingsTab, updateLegalSettings } from '../../actions/settings-actions'

interface LegalSettingsFormProps {
  siteId: string
  agencyId: string
}

// Default legal pages
const DEFAULT_PAGES: LegalPage[] = [
  {
    id: 'terms',
    type: 'terms',
    title: 'Terms & Conditions',
    content: `# Terms & Conditions

## Introduction
Welcome to {{store_name}}. By accessing our website and making a purchase, you agree to be bound by these terms and conditions.

## Orders and Pricing
- All prices are displayed in {{currency}}
- We reserve the right to modify prices at any time
- Orders are subject to availability

## Payment
We accept various payment methods as displayed at checkout. All payments are processed securely.

## Contact
For any questions regarding these terms, please contact us at {{contact_email}}.

*Last updated: {{current_date}}*`,
    is_published: true,
    slug: 'terms-and-conditions'
  },
  {
    id: 'privacy',
    type: 'privacy',
    title: 'Privacy Policy',
    content: `# Privacy Policy

## Information We Collect
We collect information you provide directly to us, including:
- Name and contact information
- Payment information
- Order history
- Communications with us

## How We Use Your Information
We use the information we collect to:
- Process your orders
- Communicate with you about your orders
- Send marketing communications (with your consent)
- Improve our services

## Data Security
We implement appropriate security measures to protect your personal information.

## Your Rights
You have the right to access, correct, or delete your personal information.

*Last updated: {{current_date}}*`,
    is_published: true,
    slug: 'privacy-policy'
  },
  {
    id: 'refund',
    type: 'refund',
    title: 'Refund Policy',
    content: `# Refund Policy

## Returns
You may return most items within {{return_days}} days of delivery for a full refund.

## Conditions
- Items must be in original condition
- Items must be unused and in original packaging
- Proof of purchase is required

## Process
1. Contact us to initiate a return
2. We'll provide a return shipping label
3. Ship the item back to us
4. Refund will be processed within {{refund_days}} business days

## Exceptions
Some items cannot be returned:
- Sale items
- Personalized items
- Perishable goods

*Last updated: {{current_date}}*`,
    is_published: true,
    slug: 'refund-policy'
  },
  {
    id: 'shipping',
    type: 'shipping',
    title: 'Shipping Policy',
    content: `# Shipping Policy

## Processing Time
Orders are processed within {{processing_days}} business days.

## Shipping Options
- Standard Shipping: {{standard_days}} business days
- Express Shipping: {{express_days}} business days

## Shipping Rates
Shipping rates are calculated at checkout based on:
- Delivery location
- Package weight and dimensions
- Shipping method selected

## International Shipping
We ship to select international destinations. Additional customs fees may apply.

## Tracking
You will receive a tracking number via email once your order ships.

*Last updated: {{current_date}}*`,
    is_published: true,
    slug: 'shipping-policy'
  }
]

interface LegalPageEditorProps {
  page: LegalPage
  onChange: (page: LegalPage) => void
}

function LegalPageEditor({ page, onChange }: LegalPageEditorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1 mr-4">
          <Label htmlFor={`${page.id}-title`}>Page Title</Label>
          <Input
            id={`${page.id}-title`}
            value={page.title}
            onChange={(e) => onChange({ ...page, title: e.target.value })}
            placeholder="Page title"
          />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <Switch
            checked={page.is_published}
            onCheckedChange={(checked) => onChange({ ...page, is_published: checked })}
          />
          <Label className="text-sm">Published</Label>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor={`${page.id}-slug`}>URL Slug</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">/</span>
          <Input
            id={`${page.id}-slug`}
            value={page.slug}
            onChange={(e) => onChange({ ...page, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
            placeholder="page-slug"
            className="font-mono text-sm"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor={`${page.id}-content`}>Content (Markdown)</Label>
        <Textarea
          id={`${page.id}-content`}
          value={page.content}
          onChange={(e) => onChange({ ...page, content: e.target.value })}
          placeholder="Enter page content in Markdown format..."
          rows={16}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Variables: {`{{store_name}}, {{currency}}, {{contact_email}}, {{return_days}}, {{refund_days}}, {{current_date}}`}
        </p>
      </div>
    </div>
  )
}

export function LegalSettingsForm({ siteId, agencyId }: LegalSettingsFormProps) {
  const [settings, setSettings] = useState<LegalSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState('terms')

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getSettingsTab<LegalSettings>(siteId, 'legal')
        // Ensure pages exist
        if (!data.pages || data.pages.length === 0) {
          data.pages = DEFAULT_PAGES
        }
        setSettings(data)
      } catch (error) {
        console.error('Error loading settings:', error)
        toast.error('Failed to load legal settings')
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [siteId])

  const updateField = <K extends keyof LegalSettings>(field: K, value: LegalSettings[K]) => {
    if (!settings) return
    setSettings({ ...settings, [field]: value })
    setHasChanges(true)
  }
  
  const updatePage = (page: LegalPage) => {
    if (!settings) return
    setSettings({
      ...settings,
      pages: settings.pages.map(p => p.id === page.id ? page : p)
    })
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!settings) return
    setIsSaving(true)
    try {
      const result = await updateLegalSettings(siteId, agencyId, settings)
      if (result.success) {
        toast.success('Legal settings saved successfully')
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
  
  const getPageIcon = (type: string) => {
    switch (type) {
      case 'terms': return FileText
      case 'privacy': return Shield
      case 'refund': return RotateCcw
      case 'shipping': return Truck
      default: return Scale
    }
  }

  return (
    <div className="space-y-6">
      {/* Checkout Legal Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Checkout Requirements</CardTitle>
          <CardDescription>Configure legal requirements during checkout</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Terms & Conditions</Label>
              <p className="text-sm text-muted-foreground">Require acceptance of terms at checkout</p>
            </div>
            <Switch
              checked={settings.require_terms_acceptance}
              onCheckedChange={(checked) => updateField('require_terms_acceptance', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Privacy Policy</Label>
              <p className="text-sm text-muted-foreground">Require acknowledgment of privacy policy</p>
            </div>
            <Switch
              checked={settings.require_privacy_acceptance}
              onCheckedChange={(checked) => updateField('require_privacy_acceptance', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Age Verification</Label>
              <p className="text-sm text-muted-foreground">Require age verification for restricted products</p>
            </div>
            <Switch
              checked={settings.require_age_verification}
              onCheckedChange={(checked) => updateField('require_age_verification', checked)}
            />
          </div>
          
          {settings.require_age_verification && (
            <div className="space-y-2 pl-4 border-l-2">
              <Label htmlFor="min_age">Minimum Age</Label>
              <Input
                id="min_age"
                type="number"
                min={13}
                max={25}
                value={settings.minimum_age || 18}
                onChange={(e) => updateField('minimum_age', parseInt(e.target.value))}
                className="w-24"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* External Policy URLs */}
      <Card>
        <CardHeader>
          <CardTitle>External Policy Links</CardTitle>
          <CardDescription>Link to externally hosted policy pages (optional)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="terms_url">Terms & Conditions URL</Label>
            <div className="flex items-center gap-2">
              <Input
                id="terms_url"
                type="url"
                value={settings.terms_url || ''}
                onChange={(e) => updateField('terms_url', e.target.value || undefined)}
                placeholder="https://example.com/terms (leave empty to use built-in page)"
              />
              {settings.terms_url && (
                <Button variant="outline" size="icon" asChild>
                  <a href={settings.terms_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="privacy_url">Privacy Policy URL</Label>
            <div className="flex items-center gap-2">
              <Input
                id="privacy_url"
                type="url"
                value={settings.privacy_url || ''}
                onChange={(e) => updateField('privacy_url', e.target.value || undefined)}
                placeholder="https://example.com/privacy (leave empty to use built-in page)"
              />
              {settings.privacy_url && (
                <Button variant="outline" size="icon" asChild>
                  <a href={settings.privacy_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cookie_url">Cookie Policy URL</Label>
            <div className="flex items-center gap-2">
              <Input
                id="cookie_url"
                type="url"
                value={settings.cookie_policy_url || ''}
                onChange={(e) => updateField('cookie_policy_url', e.target.value || undefined)}
                placeholder="https://example.com/cookies"
              />
              {settings.cookie_policy_url && (
                <Button variant="outline" size="icon" asChild>
                  <a href={settings.cookie_policy_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legal Pages Editor */}
      <Card>
        <CardHeader>
          <CardTitle>Legal Pages</CardTitle>
          <CardDescription>Create and edit your store&apos;s legal policy pages</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              {settings.pages.map((page) => {
                const Icon = getPageIcon(page.type)
                return (
                  <TabsTrigger key={page.id} value={page.type} className="gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{page.title.split(' ')[0]}</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>
            
            {settings.pages.map((page) => (
              <TabsContent key={page.id} value={page.type} className="mt-4">
                <LegalPageEditor page={page} onChange={updatePage} />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* GDPR & Compliance */}
      <Card>
        <CardHeader>
          <CardTitle>GDPR & Compliance</CardTitle>
          <CardDescription>Configure data protection compliance features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Cookie Banner</Label>
              <p className="text-sm text-muted-foreground">Display a cookie consent banner to visitors</p>
            </div>
            <Switch
              checked={settings.show_cookie_banner}
              onCheckedChange={(checked) => updateField('show_cookie_banner', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Data Export</Label>
              <p className="text-sm text-muted-foreground">Allow customers to export their data</p>
            </div>
            <Switch
              checked={settings.allow_data_export}
              onCheckedChange={(checked) => updateField('allow_data_export', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Account Deletion</Label>
              <p className="text-sm text-muted-foreground">Allow customers to request account deletion</p>
            </div>
            <Switch
              checked={settings.allow_account_deletion}
              onCheckedChange={(checked) => updateField('allow_account_deletion', checked)}
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
    </div>
  )
}
