'use client'

/**
 * WhatsApp Setup Component
 *
 * PHASE LC-05: Configuration UI for WhatsApp Business integration.
 */

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  MessageCircle,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  Copy,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getWhatsAppStatus,
  saveWhatsAppSettings,
} from '@/modules/live-chat/actions/whatsapp-actions'

interface WhatsAppSetupProps {
  siteId: string
  initialStatus?: {
    configured: boolean
    phoneNumber: string | null
  }
}

export function WhatsAppSetup({ siteId, initialStatus }: WhatsAppSetupProps) {
  const [configured, setConfigured] = useState(initialStatus?.configured ?? false)
  const [phoneNumber, setPhoneNumber] = useState(initialStatus?.phoneNumber ?? '')
  const [phoneNumberId, setPhoneNumberId] = useState('')
  const [businessAccountId, setBusinessAccountId] = useState('')
  const [welcomeTemplate, setWelcomeTemplate] = useState('')
  const [isPending, startTransition] = useTransition()
  const [testing, setTesting] = useState(false)

  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/modules/live-chat/webhooks/whatsapp`
      : 'https://app.dramacagency.com/api/modules/live-chat/webhooks/whatsapp'

  const handleTestConnection = async () => {
    setTesting(true)
    try {
      const { configured: isOk, error } = await getWhatsAppStatus(siteId)
      if (error) {
        toast.error(error)
      } else if (isOk) {
        toast.success('WhatsApp connection verified')
        setConfigured(true)
      } else {
        toast.error('WhatsApp not configured. Please enter credentials below.')
      }
    } finally {
      setTesting(false)
    }
  }

  const handleSave = () => {
    if (!phoneNumber || !phoneNumberId || !businessAccountId) {
      toast.error('Please fill in all required fields')
      return
    }

    startTransition(async () => {
      const { success, error } = await saveWhatsAppSettings(siteId, {
        phoneNumber,
        phoneNumberId,
        businessAccountId,
        welcomeTemplate: welcomeTemplate || undefined,
      })

      if (error) {
        toast.error(error)
      } else if (success) {
        toast.success('WhatsApp settings saved')
        setConfigured(true)
      }
    })
  }

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl)
    toast.success('Webhook URL copied')
  }

  return (
    <div className="space-y-6">
      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-500" />
            WhatsApp Business Integration
          </CardTitle>
          <CardDescription>
            Connect WhatsApp Business to send and receive messages from your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {configured ? (
              <>
                <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
                {phoneNumber && (
                  <span className="text-sm text-muted-foreground">{phoneNumber}</span>
                )}
              </>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                <XCircle className="h-3 w-3 mr-1" />
                Not Configured
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={testing}
            >
              {testing && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Setup Guide */}
      {!configured && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Setup Steps:</strong>
            <ol className="list-decimal ml-4 mt-2 space-y-1 text-sm">
              <li>
                Create a{' '}
                <a
                  href="https://business.facebook.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-primary"
                >
                  Meta Business Account
                  <ExternalLink className="h-3 w-3 inline ml-0.5" />
                </a>
              </li>
              <li>Set up WhatsApp Business in the Business Suite</li>
              <li>Add and verify a phone number</li>
              <li>Create a System User and generate a permanent access token</li>
              <li>Enter the credentials below</li>
              <li>Register the webhook URL in your Meta App settings</li>
            </ol>
          </AlertDescription>
        </Alert>
      )}

      {/* Credentials */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Credentials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="wa-phone">WhatsApp Phone Number</Label>
              <Input
                id="wa-phone"
                placeholder="+260 97 1234567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wa-phone-id">Phone Number ID</Label>
              <Input
                id="wa-phone-id"
                placeholder="From Meta Dashboard"
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="wa-ba-id">Business Account ID</Label>
            <Input
              id="wa-ba-id"
              placeholder="From Meta Business Suite"
              value={businessAccountId}
              onChange={(e) => setBusinessAccountId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wa-template">Welcome Template (optional)</Label>
            <Input
              id="wa-template"
              placeholder="Template name for initial outbound messages"
              value={welcomeTemplate}
              onChange={(e) => setWelcomeTemplate(e.target.value)}
            />
          </div>

          <Separator />

          {/* Webhook URL */}
          <div className="space-y-2">
            <Label>Webhook URL (register in Meta App settings)</Label>
            <div className="flex gap-2">
              <Input value={webhookUrl} readOnly className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={copyWebhookUrl}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Set the Verify Token to match your{' '}
              <code className="text-xs">WHATSAPP_VERIFY_TOKEN</code> environment variable.
            </p>
          </div>

          <Button onClick={handleSave} disabled={isPending} className="w-full sm:w-auto">
            {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save WhatsApp Settings
          </Button>
        </CardContent>
      </Card>

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Important Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <p>
              <strong>24-Hour Window:</strong> You can send free-form messages within 24 hours of the customer&apos;s last message. After that, you must use approved template messages.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <p>
              <strong>Template Messages:</strong> Must be pre-approved by Meta (24-72 hour review). Create them in your Meta Business Suite.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <p>
              <strong>Pricing:</strong> Customer-initiated conversations are free. Business-initiated template messages have per-conversation pricing.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
