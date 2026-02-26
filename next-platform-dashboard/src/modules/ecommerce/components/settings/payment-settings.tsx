/**
 * Payment Settings Component
 * 
 * Phase ECOM-03: Settings & Configuration Center
 * REWRITTEN: Session 6 — Aligned with actual payment providers
 * (Paddle, Flutterwave, Pesapal, DPO, Manual)
 * 
 * Previously configured Stripe/PayPal/Square which don't exist in the backend.
 * Now configures the 4 real payment providers + manual payments.
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { 
  Loader2, Save, CreditCard, Wallet, Building2, Truck, 
  Shield, AlertTriangle, CheckCircle2, Globe, Smartphone,
  Info
} from 'lucide-react'
import { toast } from 'sonner'
import type { 
  PaymentSettings,
  PaddleConfig,
  FlutterwaveConfig,
  PesapalConfig,
  DpoConfig,
} from '../../types/ecommerce-types'
import type { PaymentProvider } from '../../types/ecommerce-types'
import { getSettingsTab, updatePaymentSettings, testPaymentGateway } from '../../actions/settings-actions'

interface PaymentSettingsFormProps {
  siteId: string
  agencyId: string
}

// ============================================================================
// PROVIDER DEFINITIONS — Aligned with actual backend providers
// ============================================================================

interface ProviderOption {
  id: PaymentProvider
  name: string
  description: string
  icon: typeof CreditCard
  regions: string
  features: string[]
}

const PROVIDER_OPTIONS: ProviderOption[] = [
  { 
    id: 'flutterwave', 
    name: 'Flutterwave', 
    icon: Smartphone,
    description: 'Accept cards, mobile money, bank transfers across Africa',
    regions: '🌍 Africa (Zambia, Nigeria, Kenya, Ghana, 30+ countries)',
    features: ['Cards', 'Mobile Money', 'Bank Transfer', 'USSD'],
  },
  { 
    id: 'pesapal', 
    name: 'Pesapal', 
    icon: Globe,
    description: 'Pan-African payment gateway with M-Pesa integration',
    regions: '🌍 East & Southern Africa (Kenya, Tanzania, Uganda, Zambia)',
    features: ['M-Pesa', 'Cards', 'Mobile Money', 'Bank Transfer'],
  },
  { 
    id: 'dpo', 
    name: 'DPO (Direct Pay Online)', 
    icon: CreditCard,
    description: 'Leading African payment provider with wide coverage',
    regions: '🌍 Africa, Middle East (Zambia, 20+ countries)',
    features: ['Cards', 'Mobile Money', 'Bank Transfer'],
  },
  { 
    id: 'paddle', 
    name: 'Paddle', 
    icon: Wallet,
    description: 'Global merchant of record — handles tax compliance',
    regions: '🌐 Global (200+ countries)',
    features: ['Cards', 'PayPal', 'Apple Pay', 'Tax Compliance'],
  },
  { 
    id: 'manual', 
    name: 'Manual / Bank Transfer', 
    icon: Building2,
    description: 'Accept bank transfers or cash on delivery',
    regions: '🏦 Any region',
    features: ['Bank Transfer', 'Cash on Delivery', 'Custom Instructions'],
  },
]

// ============================================================================
// PROVIDER CONFIG FORMS
// ============================================================================

function FlutterwaveConfigForm({ 
  config, 
  onChange 
}: { 
  config: Partial<FlutterwaveConfig>
  onChange: (config: Partial<FlutterwaveConfig>) => void 
}) {
  return (
    <div className="space-y-4">
      <div className="p-3 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20 dark:border-primary/30 flex gap-2">
        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-primary dark:text-primary/80">
          Get your API keys from the{' '}
          <a href="https://dashboard.flutterwave.com/settings/apis" target="_blank" rel="noopener noreferrer" className="underline font-medium">
            Flutterwave Dashboard → Settings → API Keys
          </a>
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="fw_public_key">Public Key</Label>
        <Input
          id="fw_public_key"
          value={config.public_key || ''}
          onChange={(e) => onChange({ ...config, public_key: e.target.value })}
          placeholder={config.environment === 'test' ? 'FLWPUBK_TEST-...' : 'FLWPUBK-...'}
          type="password"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fw_secret_key">Secret Key</Label>
        <Input
          id="fw_secret_key"
          value={config.secret_key || ''}
          onChange={(e) => onChange({ ...config, secret_key: e.target.value })}
          placeholder={config.environment === 'test' ? 'FLWSECK_TEST-...' : 'FLWSECK-...'}
          type="password"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fw_encryption_key">Encryption Key</Label>
        <Input
          id="fw_encryption_key"
          value={config.encryption_key || ''}
          onChange={(e) => onChange({ ...config, encryption_key: e.target.value })}
          placeholder="Encryption key from Flutterwave dashboard"
          type="password"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fw_secret_hash">Webhook Secret Hash</Label>
        <Input
          id="fw_secret_hash"
          value={config.secret_hash || config.webhook_secret_hash || ''}
          onChange={(e) => onChange({ ...config, secret_hash: e.target.value, webhook_secret_hash: e.target.value })}
          placeholder="Secret hash for webhook verification"
          type="password"
        />
      </div>

      <div className="space-y-2">
        <Label>Environment</Label>
        <Select
          value={config.environment || 'test'}
          onValueChange={(value) => onChange({ ...config, environment: value as 'test' | 'live' })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="test">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 text-yellow-500" />
                Test / Sandbox
              </div>
            </SelectItem>
            <SelectItem value="live">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                Live / Production
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Accepted Payment Methods</Label>
        <div className="flex flex-wrap gap-2">
          {(['card', 'mobilemoney', 'bank_transfer', 'ussd'] as const).map((method) => {
            const labels: Record<string, string> = {
              card: '💳 Cards',
              mobilemoney: '📱 Mobile Money',
              bank_transfer: '🏦 Bank Transfer',
              ussd: '📞 USSD',
            }
            const enabled = config.supported_methods?.includes(method)
            return (
              <Badge
                key={method}
                variant={enabled ? 'default' : 'outline'}
                className="cursor-pointer select-none"
                onClick={() => {
                  const current = config.supported_methods || ['card', 'mobilemoney']
                  const updated = enabled
                    ? current.filter((m) => m !== method)
                    : [...current, method]
                  onChange({ ...config, supported_methods: updated })
                }}
              >
                {labels[method]}
              </Badge>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function PesapalConfigForm({ 
  config, 
  onChange 
}: { 
  config: Partial<PesapalConfig>
  onChange: (config: Partial<PesapalConfig>) => void 
}) {
  return (
    <div className="space-y-4">
      <div className="p-3 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20 dark:border-primary/30 flex gap-2">
        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-primary dark:text-primary/80">
          Get your API credentials from the{' '}
          <a href="https://dashboard.pesapal.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">
            Pesapal Dashboard
          </a>
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pp_consumer_key">Consumer Key</Label>
        <Input
          id="pp_consumer_key"
          value={config.consumer_key || ''}
          onChange={(e) => onChange({ ...config, consumer_key: e.target.value })}
          placeholder="Your Pesapal consumer key"
          type="password"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="pp_consumer_secret">Consumer Secret</Label>
        <Input
          id="pp_consumer_secret"
          value={config.consumer_secret || ''}
          onChange={(e) => onChange({ ...config, consumer_secret: e.target.value })}
          placeholder="Your Pesapal consumer secret"
          type="password"
        />
      </div>

      <div className="space-y-2">
        <Label>Environment</Label>
        <Select
          value={config.environment || 'demo'}
          onValueChange={(value) => onChange({ ...config, environment: value as 'demo' | 'live' })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="demo">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 text-yellow-500" />
                Demo / Sandbox
              </div>
            </SelectItem>
            <SelectItem value="live">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                Live / Production
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pp_callback">Callback URL</Label>
        <Input
          id="pp_callback"
          value={config.callback_url || ''}
          onChange={(e) => onChange({ ...config, callback_url: e.target.value })}
          placeholder="https://yoursite.com/api/modules/ecommerce/webhooks/payment?provider=pesapal"
        />
        <p className="text-xs text-muted-foreground">URL where Pesapal redirects after payment</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pp_ipn">IPN URL</Label>
        <Input
          id="pp_ipn"
          value={config.ipn_url || ''}
          onChange={(e) => onChange({ ...config, ipn_url: e.target.value })}
          placeholder="https://yoursite.com/api/modules/ecommerce/webhooks/payment?provider=pesapal"
        />
        <p className="text-xs text-muted-foreground">Instant Payment Notification URL</p>
      </div>
    </div>
  )
}

function DpoConfigForm({ 
  config, 
  onChange 
}: { 
  config: Partial<DpoConfig>
  onChange: (config: Partial<DpoConfig>) => void 
}) {
  return (
    <div className="space-y-4">
      <div className="p-3 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20 dark:border-primary/30 flex gap-2">
        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-primary dark:text-primary/80">
          Get your Company Token from the{' '}
          <a href="https://www.directpayonline.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">
            DPO Dashboard
          </a>
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dpo_company_token">Company Token</Label>
        <Input
          id="dpo_company_token"
          value={config.company_token || ''}
          onChange={(e) => onChange({ ...config, company_token: e.target.value })}
          placeholder="Your DPO company token"
          type="password"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dpo_service_type">Service Type</Label>
        <Input
          id="dpo_service_type"
          value={config.service_type || ''}
          onChange={(e) => onChange({ ...config, service_type: e.target.value })}
          placeholder="Service type ID (e.g., 5525)"
        />
        <p className="text-xs text-muted-foreground">Your DPO service type identifier</p>
      </div>

      <div className="space-y-2">
        <Label>Environment</Label>
        <Select
          value={config.environment || 'test'}
          onValueChange={(value) => onChange({ ...config, environment: value as 'test' | 'live' })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="test">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 text-yellow-500" />
                Test / Sandbox
              </div>
            </SelectItem>
            <SelectItem value="live">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                Live / Production
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dpo_callback">Callback URL</Label>
        <Input
          id="dpo_callback"
          value={config.callback_url || ''}
          onChange={(e) => onChange({ ...config, callback_url: e.target.value })}
          placeholder="https://yoursite.com/api/modules/ecommerce/webhooks/payment?provider=dpo"
        />
        <p className="text-xs text-muted-foreground">URL where DPO redirects after payment</p>
      </div>
    </div>
  )
}

function PaddleConfigForm({ 
  config, 
  onChange 
}: { 
  config: Partial<PaddleConfig>
  onChange: (config: Partial<PaddleConfig>) => void 
}) {
  return (
    <div className="space-y-4">
      <div className="p-3 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20 dark:border-primary/30 flex gap-2">
        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-primary dark:text-primary/80">
          Get your API credentials from the{' '}
          <a href="https://vendors.paddle.com/authentication" target="_blank" rel="noopener noreferrer" className="underline font-medium">
            Paddle Dashboard → Developer Tools
          </a>
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="paddle_vendor_id">Vendor ID</Label>
        <Input
          id="paddle_vendor_id"
          value={config.vendor_id || ''}
          onChange={(e) => onChange({ ...config, vendor_id: e.target.value })}
          placeholder="Your Paddle vendor ID"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="paddle_api_key">API Key</Label>
        <Input
          id="paddle_api_key"
          value={config.api_key || ''}
          onChange={(e) => onChange({ ...config, api_key: e.target.value })}
          placeholder="Your Paddle API key"
          type="password"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="paddle_public_key">Public Key (Client-side Token)</Label>
        <Input
          id="paddle_public_key"
          value={config.public_key || ''}
          onChange={(e) => onChange({ ...config, public_key: e.target.value })}
          placeholder="Your Paddle client-side token"
          type="password"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="paddle_webhook_secret">Webhook Secret (Optional)</Label>
        <Input
          id="paddle_webhook_secret"
          value={config.webhook_secret || ''}
          onChange={(e) => onChange({ ...config, webhook_secret: e.target.value })}
          placeholder="Webhook signing secret"
          type="password"
        />
      </div>

      <div className="space-y-2">
        <Label>Environment</Label>
        <Select
          value={config.environment || 'sandbox'}
          onValueChange={(value) => onChange({ ...config, environment: value as 'sandbox' | 'production' })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sandbox">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 text-yellow-500" />
                Sandbox
              </div>
            </SelectItem>
            <SelectItem value="production">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                Production
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function ManualPaymentForm({
  instructions,
  onChange,
}: {
  instructions: string
  onChange: (instructions: string) => void
}) {
  return (
    <div className="space-y-4">
      <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900 flex gap-2">
        <Truck className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Customers will see these instructions when choosing manual payment. Include your bank details or cash-on-delivery terms.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="manual_instructions">Payment Instructions</Label>
        <Textarea
          id="manual_instructions"
          value={instructions}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Bank: Zambia National Commercial Bank\nAccount: 1234567890\nBranch: Cairo Road, Lusaka\nSwift: ZNCOZMLU\n\nPlease include your order number as payment reference.\nOrders will be processed once payment is confirmed.`}
          rows={8}
        />
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface ProviderState {
  activeProvider: PaymentProvider | null
  paddle: Partial<PaddleConfig>
  flutterwave: Partial<FlutterwaveConfig>
  pesapal: Partial<PesapalConfig>
  dpo: Partial<DpoConfig>
  manualInstructions: string
  // General settings
  captureMode: 'automatic' | 'manual'
  statementDescriptor: string
  allowPartialPayments: boolean
  minOrderAmount: number
  maxOrderAmount?: number
}

export function PaymentSettingsForm({ siteId, agencyId }: PaymentSettingsFormProps) {
  const [state, setState] = useState<ProviderState>({
    activeProvider: null,
    paddle: { enabled: false, environment: 'sandbox' },
    flutterwave: { enabled: false, environment: 'test', supported_methods: ['card', 'mobilemoney'] },
    pesapal: { enabled: false, environment: 'demo' },
    dpo: { enabled: false, environment: 'test' },
    manualInstructions: '',
    captureMode: 'automatic',
    statementDescriptor: '',
    allowPartialPayments: false,
    minOrderAmount: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState('providers')

  // Load settings from payment_settings JSONB column
  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getSettingsTab<PaymentSettings>(siteId, 'payments')
        const raw = data as unknown as Record<string, unknown> | null
        
        if (raw) {
          setState((prev) => ({
            ...prev,
            activeProvider: (raw.active_provider as PaymentProvider) || null,
            paddle: (raw.paddle as Partial<PaddleConfig>) || prev.paddle,
            flutterwave: (raw.flutterwave as Partial<FlutterwaveConfig>) || prev.flutterwave,
            pesapal: (raw.pesapal as Partial<PesapalConfig>) || prev.pesapal,
            dpo: (raw.dpo as Partial<DpoConfig>) || prev.dpo,
            manualInstructions: (raw.manual_instructions as string) || '',
            captureMode: (raw.capture_mode as 'automatic' | 'manual') || 'automatic',
            statementDescriptor: (raw.statement_descriptor as string) || '',
            allowPartialPayments: (raw.allow_partial_payments as boolean) || false,
            minOrderAmount: (raw.min_order_amount as number) || 0,
            maxOrderAmount: raw.max_order_amount as number | undefined,
          }))
        }
      } catch (error) {
        console.error('Error loading payment settings:', error)
        toast.error('Failed to load payment settings')
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [siteId])

  const updateState = useCallback((updates: Partial<ProviderState>) => {
    setState((prev) => ({ ...prev, ...updates }))
    setHasChanges(true)
  }, [])

  const handleTestConnection = async (provider: PaymentProvider) => {
    setIsTesting(provider)
    try {
      let apiKey = ''
      let secretKey = ''

      switch (provider) {
        case 'flutterwave':
          apiKey = state.flutterwave.public_key || ''
          secretKey = state.flutterwave.secret_key || ''
          break
        case 'pesapal':
          apiKey = state.pesapal.consumer_key || ''
          secretKey = state.pesapal.consumer_secret || ''
          break
        case 'dpo':
          apiKey = state.dpo.company_token || ''
          secretKey = state.dpo.service_type || ''
          break
        case 'paddle':
          apiKey = state.paddle.vendor_id || ''
          secretKey = state.paddle.api_key || ''
          break
        default:
          toast.info('Manual payments don\'t require a connection test')
          setIsTesting(null)
          return
      }

      if (!apiKey || !secretKey) {
        toast.error('Please enter API credentials first')
        setIsTesting(null)
        return
      }

      const result = await testPaymentGateway(provider, apiKey, secretKey)
      if (result.success) {
        toast.success(`${provider} connection test passed!`)
      } else {
        toast.error(result.message || 'Connection test failed')
      }
    } catch {
      toast.error('Connection test failed')
    } finally {
      setIsTesting(null)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Build the payment settings object that gets saved to the payment_settings JSONB column
      const paymentData: Record<string, unknown> = {
        active_provider: state.activeProvider,
        paddle: { ...state.paddle, enabled: state.activeProvider === 'paddle' || !!state.paddle.enabled },
        flutterwave: { ...state.flutterwave, enabled: state.activeProvider === 'flutterwave' || !!state.flutterwave.enabled },
        pesapal: { ...state.pesapal, enabled: state.activeProvider === 'pesapal' || !!state.pesapal.enabled },
        dpo: { ...state.dpo, enabled: state.activeProvider === 'dpo' || !!state.dpo.enabled },
        manual_instructions: state.manualInstructions,
        // General settings
        capture_mode: state.captureMode,
        statement_descriptor: state.statementDescriptor,
        allow_partial_payments: state.allowPartialPayments,
        min_order_amount: state.minOrderAmount,
        max_order_amount: state.maxOrderAmount,
        // Keep backward-compatible gateways array
        gateways: buildLegacyGateways(state),
        accepted_methods: buildAcceptedMethods(state),
      }

      const result = await updatePaymentSettings(
        siteId, 
        agencyId, 
        paymentData as unknown as PaymentSettings
      )

      if (result.success) {
        toast.success('Payment settings saved successfully')
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="providers">Payment Providers</TabsTrigger>
          <TabsTrigger value="options">Payment Options</TabsTrigger>
        </TabsList>

        {/* ============================================================ */}
        {/* PROVIDERS TAB                                                */}
        {/* ============================================================ */}
        <TabsContent value="providers" className="space-y-6 mt-6">
          {/* Active Provider Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Active Payment Provider
              </CardTitle>
              <CardDescription>
                Select which payment provider processes customer payments at checkout
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={state.activeProvider || 'none'}
                onValueChange={(value) => {
                  updateState({ 
                    activeProvider: value === 'none' ? null : value as PaymentProvider 
                  })
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select active payment provider..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">No provider selected</span>
                  </SelectItem>
                  {PROVIDER_OPTIONS.map((p) => {
                    const Icon = p.icon
                    return (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{p.name}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>

              {!state.activeProvider && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  No payment provider is active. Customers cannot complete purchases.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Provider Configuration Cards */}
          <div className="space-y-4">
            {PROVIDER_OPTIONS.map((provider) => {
              const isActive = state.activeProvider === provider.id
              const Icon = provider.icon

              return (
                <Card 
                  key={provider.id}
                  className={isActive ? 'border-primary ring-1 ring-primary' : ''}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isActive ? 'bg-primary/10' : 'bg-muted'}`}>
                          <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`} />
                        </div>
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {provider.name}
                            {isActive && (
                              <Badge variant="default" className="text-xs">Active</Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="text-xs mt-0.5">
                            {provider.description}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {provider.id !== 'manual' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestConnection(provider.id)}
                            disabled={isTesting === provider.id}
                          >
                            {isTesting === provider.id ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                            )}
                            Test
                          </Button>
                        )}
                        {!isActive && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateState({ activeProvider: provider.id })}
                          >
                            Set Active
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{provider.regions}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {provider.features.map((f) => (
                        <Badge key={f} variant="secondary" className="text-xs font-normal">
                          {f}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {provider.id === 'flutterwave' && (
                      <FlutterwaveConfigForm
                        config={state.flutterwave}
                        onChange={(c) => updateState({ flutterwave: c })}
                      />
                    )}
                    {provider.id === 'pesapal' && (
                      <PesapalConfigForm
                        config={state.pesapal}
                        onChange={(c) => updateState({ pesapal: c })}
                      />
                    )}
                    {provider.id === 'dpo' && (
                      <DpoConfigForm
                        config={state.dpo}
                        onChange={(c) => updateState({ dpo: c })}
                      />
                    )}
                    {provider.id === 'paddle' && (
                      <PaddleConfigForm
                        config={state.paddle}
                        onChange={(c) => updateState({ paddle: c })}
                      />
                    )}
                    {provider.id === 'manual' && (
                      <ManualPaymentForm
                        instructions={state.manualInstructions}
                        onChange={(i) => updateState({ manualInstructions: i })}
                      />
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Webhook Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Webhook URLs
              </CardTitle>
              <CardDescription>
                Configure these URLs in your payment provider dashboards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(['flutterwave', 'pesapal', 'dpo', 'paddle'] as const).map((p) => (
                <div key={p} className="flex items-center justify-between text-sm">
                  <span className="font-medium capitalize">{p}</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded select-all">
                    /api/modules/ecommerce/webhooks/payment?provider={p}
                  </code>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================ */}
        {/* OPTIONS TAB                                                  */}
        {/* ============================================================ */}
        <TabsContent value="options" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Options</CardTitle>
              <CardDescription>Configure payment processing settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="capture_mode">Payment Capture</Label>
                <Select
                  value={state.captureMode}
                  onValueChange={(value) => updateState({ captureMode: value as 'automatic' | 'manual' })}
                >
                  <SelectTrigger id="capture_mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="automatic">Automatic — Charge immediately</SelectItem>
                    <SelectItem value="manual">Manual — Authorize first, capture later</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="statement_descriptor">Statement Descriptor</Label>
                <Input
                  id="statement_descriptor"
                  value={state.statementDescriptor}
                  onChange={(e) => updateState({ statementDescriptor: e.target.value })}
                  placeholder="Appears on customer statements"
                  maxLength={22}
                />
                <p className="text-xs text-muted-foreground">Max 22 characters</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="min_order">Minimum Order Amount</Label>
                  <Input
                    id="min_order"
                    type="number"
                    value={state.minOrderAmount}
                    onChange={(e) => updateState({ minOrderAmount: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_order">Maximum Order Amount</Label>
                  <Input
                    id="max_order"
                    type="number"
                    value={state.maxOrderAmount || ''}
                    onChange={(e) => updateState({ maxOrderAmount: parseFloat(e.target.value) || undefined })}
                    placeholder="No limit"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Partial Payments</Label>
                  <p className="text-sm text-muted-foreground">Let customers pay deposits or installments</p>
                </div>
                <Switch
                  checked={state.allowPartialPayments}
                  onCheckedChange={(checked) => updateState({ allowPartialPayments: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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

// ============================================================================
// HELPERS
// ============================================================================

/** Build backward-compatible gateways array from provider state */
function buildLegacyGateways(state: ProviderState): Array<Record<string, unknown>> {
  const gateways: Array<Record<string, unknown>> = []

  if (state.flutterwave.public_key) {
    gateways.push({
      id: 'gateway-flutterwave',
      name: 'Flutterwave',
      type: 'flutterwave',
      enabled: state.activeProvider === 'flutterwave' || !!state.flutterwave.enabled,
      test_mode: state.flutterwave.environment === 'test',
    })
  }
  if (state.pesapal.consumer_key) {
    gateways.push({
      id: 'gateway-pesapal',
      name: 'Pesapal',
      type: 'pesapal',
      enabled: state.activeProvider === 'pesapal' || !!state.pesapal.enabled,
      test_mode: state.pesapal.environment === 'demo',
    })
  }
  if (state.dpo.company_token) {
    gateways.push({
      id: 'gateway-dpo',
      name: 'DPO',
      type: 'dpo',
      enabled: state.activeProvider === 'dpo' || !!state.dpo.enabled,
      test_mode: state.dpo.environment === 'test',
    })
  }
  if (state.paddle.vendor_id) {
    gateways.push({
      id: 'gateway-paddle',
      name: 'Paddle',
      type: 'paddle',
      enabled: state.activeProvider === 'paddle' || !!state.paddle.enabled,
      test_mode: state.paddle.environment === 'sandbox',
    })
  }
  if (state.activeProvider === 'manual' || state.manualInstructions) {
    gateways.push({
      id: 'gateway-manual',
      name: 'Manual / Bank Transfer',
      type: 'manual',
      enabled: state.activeProvider === 'manual',
      test_mode: false,
    })
  }

  return gateways
}

/** Build accepted payment methods from provider state */
function buildAcceptedMethods(state: ProviderState): string[] {
  const methods: string[] = []
  if (state.activeProvider === 'flutterwave' || state.flutterwave.enabled) {
    methods.push('credit_card', 'mobile_money')
  }
  if (state.activeProvider === 'pesapal' || state.pesapal.enabled) {
    methods.push('m_pesa', 'credit_card')
  }
  if (state.activeProvider === 'dpo' || state.dpo.enabled) {
    methods.push('credit_card')
  }
  if (state.activeProvider === 'paddle' || state.paddle.enabled) {
    methods.push('credit_card', 'paypal')
  }
  if (state.activeProvider === 'manual') {
    methods.push('bank_transfer', 'cod')
  }
  return [...new Set(methods)]
}
