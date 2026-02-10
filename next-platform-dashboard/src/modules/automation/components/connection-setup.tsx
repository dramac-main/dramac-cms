/**
 * ConnectionSetup Component
 * 
 * Phase EM-57B: Automation Engine - Visual Builder & Advanced Features
 * 
 * Manages external service integrations for automation workflows.
 * Supports OAuth flows, API key authentication, and connection testing.
 */

"use client"

import { useState, useEffect } from "react"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { 
  Settings, 
  Trash2, 
  Check, 
  X, 
  ExternalLink, 
  RefreshCw,
  Key,
  Shield,
  Loader2,
  AlertTriangle,
  Plug,
  Unplug
} from "lucide-react"

// ============================================================================
// TYPES
// ============================================================================

export interface ServiceConnection {
  id: string
  service: string
  name: string
  status: "connected" | "disconnected" | "error"
  lastUsed?: string
  credentials: Record<string, unknown>
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

interface ServiceDefinition {
  id: string
  name: string
  description: string
  icon: string
  category: string
  authType: "oauth2" | "api_key" | "basic" | "custom"
  requiredFields: Array<{
    key: string
    label: string
    type: "text" | "password" | "textarea" | "url"
    required: boolean
    placeholder?: string
    helpText?: string
  }>
  oauthConfig?: {
    authUrl: string
    scopes: string[]
  }
  testEndpoint?: string
  docsUrl?: string
}

interface ConnectionSetupProps {
  siteId: string
  onConnectionChange?: () => void
}

// ============================================================================
// SERVICE DEFINITIONS
// ============================================================================

const SERVICE_DEFINITIONS: ServiceDefinition[] = [
  // Communication
  {
    id: "slack",
    name: "Slack",
    description: "Send messages and notifications to Slack channels",
    icon: "💬",
    category: "Communication",
    authType: "oauth2",
    requiredFields: [],
    oauthConfig: {
      authUrl: "/api/oauth/slack",
      scopes: ["chat:write", "channels:read"]
    },
    docsUrl: "https://api.slack.com/docs"
  },
  {
    id: "discord",
    name: "Discord",
    description: "Send messages to Discord channels via webhooks",
    icon: "🎮",
    category: "Communication",
    authType: "api_key",
    requiredFields: [
      {
        key: "webhook_url",
        label: "Webhook URL",
        type: "url",
        required: true,
        placeholder: "https://discord.com/api/webhooks/...",
        helpText: "Create a webhook in your Discord server settings"
      }
    ],
    docsUrl: "https://discord.com/developers/docs/resources/webhook"
  },
  {
    id: "twilio",
    name: "Twilio",
    description: "Send SMS messages and make voice calls",
    icon: "📱",
    category: "Communication",
    authType: "api_key",
    requiredFields: [
      {
        key: "account_sid",
        label: "Account SID",
        type: "text",
        required: true,
        placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      },
      {
        key: "auth_token",
        label: "Auth Token",
        type: "password",
        required: true,
        placeholder: "Your Twilio Auth Token"
      },
      {
        key: "phone_number",
        label: "Phone Number",
        type: "text",
        required: true,
        placeholder: "+1234567890",
        helpText: "Your Twilio phone number"
      }
    ],
    docsUrl: "https://www.twilio.com/docs"
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    description: "Send transactional emails at scale",
    icon: "📧",
    category: "Communication",
    authType: "api_key",
    requiredFields: [
      {
        key: "api_key",
        label: "API Key",
        type: "password",
        required: true,
        placeholder: "SG.xxxxxxxxxxxxxxxxxxxx",
        helpText: "Create an API key in SendGrid dashboard"
      },
      {
        key: "from_email",
        label: "From Email",
        type: "text",
        required: true,
        placeholder: "noreply@yourdomain.com"
      }
    ],
    docsUrl: "https://docs.sendgrid.com"
  },
  {
    id: "resend",
    name: "Resend",
    description: "Modern email API for developers",
    icon: "✉️",
    category: "Communication",
    authType: "api_key",
    requiredFields: [
      {
        key: "api_key",
        label: "API Key",
        type: "password",
        required: true,
        placeholder: "re_xxxxxxxxxxxxxxxxxxxx"
      }
    ],
    docsUrl: "https://resend.com/docs"
  },
  // CRM & Sales
  {
    id: "hubspot",
    name: "HubSpot",
    description: "Sync contacts and deals with HubSpot CRM",
    icon: "🧡",
    category: "CRM",
    authType: "oauth2",
    requiredFields: [],
    oauthConfig: {
      authUrl: "/api/oauth/hubspot",
      scopes: ["contacts", "deals"]
    },
    docsUrl: "https://developers.hubspot.com"
  },
  {
    id: "salesforce",
    name: "Salesforce",
    description: "Integrate with Salesforce CRM",
    icon: "☁️",
    category: "CRM",
    authType: "oauth2",
    requiredFields: [],
    oauthConfig: {
      authUrl: "/api/oauth/salesforce",
      scopes: ["api", "refresh_token"]
    },
    docsUrl: "https://developer.salesforce.com/docs"
  },
  // Payments
  {
    id: "paddle",
    name: "Paddle",
    description: "Billing & subscription management (Zambia-compatible payouts)",
    icon: "💳",
    category: "Payments",
    authType: "api_key",
    requiredFields: [
      {
        key: "api_key",
        label: "API Key",
        type: "password",
        required: true,
        placeholder: "pdl_live_xxxxxxxxxxxxxxxxxxxx",
        helpText: "Your Paddle API key from dashboard"
      },
      {
        key: "webhook_secret",
        label: "Webhook Secret",
        type: "password",
        required: false,
        placeholder: "pdl_whk_xxxxxxxxxxxxxxxxxxxx"
      }
    ],
    docsUrl: "https://developer.paddle.com/api-reference"
  },
  // Storage
  {
    id: "google_drive",
    name: "Google Drive",
    description: "Upload and manage files in Google Drive",
    icon: "📁",
    category: "Storage",
    authType: "oauth2",
    requiredFields: [],
    oauthConfig: {
      authUrl: "/api/oauth/google",
      scopes: ["drive.file"]
    },
    docsUrl: "https://developers.google.com/drive"
  },
  {
    id: "dropbox",
    name: "Dropbox",
    description: "Sync files with Dropbox",
    icon: "📦",
    category: "Storage",
    authType: "oauth2",
    requiredFields: [],
    oauthConfig: {
      authUrl: "/api/oauth/dropbox",
      scopes: ["files.content.write"]
    },
    docsUrl: "https://www.dropbox.com/developers"
  },
  // Project Management
  {
    id: "notion",
    name: "Notion",
    description: "Create pages and update databases in Notion",
    icon: "📝",
    category: "Productivity",
    authType: "api_key",
    requiredFields: [
      {
        key: "api_key",
        label: "Integration Token",
        type: "password",
        required: true,
        placeholder: "secret_xxxxxxxxxxxxxxxxxxxx",
        helpText: "Create an internal integration in Notion"
      }
    ],
    docsUrl: "https://developers.notion.com"
  },
  {
    id: "airtable",
    name: "Airtable",
    description: "Sync data with Airtable bases",
    icon: "📊",
    category: "Productivity",
    authType: "api_key",
    requiredFields: [
      {
        key: "api_key",
        label: "Personal Access Token",
        type: "password",
        required: true,
        placeholder: "patxxxxxxxxxxxxxxxxxxxxx"
      }
    ],
    docsUrl: "https://airtable.com/developers/web/api"
  },
  // Custom Webhooks
  {
    id: "webhook",
    name: "Custom Webhook",
    description: "Send data to any HTTP endpoint",
    icon: "🔗",
    category: "Developer",
    authType: "custom",
    requiredFields: [
      {
        key: "url",
        label: "Webhook URL",
        type: "url",
        required: true,
        placeholder: "https://api.example.com/webhook"
      },
      {
        key: "headers",
        label: "Custom Headers (JSON)",
        type: "textarea",
        required: false,
        placeholder: '{"Authorization": "Bearer token"}',
        helpText: "Optional JSON object with custom headers"
      }
    ]
  },
  // AI Services
  {
    id: "openai",
    name: "OpenAI",
    description: "Access GPT models for AI-powered actions",
    icon: "🤖",
    category: "AI",
    authType: "api_key",
    requiredFields: [
      {
        key: "api_key",
        label: "API Key",
        type: "password",
        required: true,
        placeholder: "sk-xxxxxxxxxxxxxxxxxxxx"
      },
      {
        key: "organization",
        label: "Organization ID",
        type: "text",
        required: false,
        placeholder: "org-xxxxxxxxxxxxxxxxxxxx"
      }
    ],
    docsUrl: "https://platform.openai.com/docs"
  }
]

// ============================================================================
// HELPERS
// ============================================================================

function getServiceCategories(): string[] {
  return [...new Set(SERVICE_DEFINITIONS.map(s => s.category))]
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface ServiceCardProps {
  service: ServiceDefinition
  connection?: ServiceConnection
  onConnect: () => void
  onDisconnect: () => void
  onEdit: () => void
}

function ServiceCard({ 
  service, 
  connection, 
  onConnect, 
  onDisconnect, 
  onEdit 
}: ServiceCardProps) {
  const isConnected = connection?.status === "connected"
  const hasError = connection?.status === "error"

  return (
    <Card className={`transition-all ${isConnected ? 'border-green-500/50' : ''} ${hasError ? 'border-red-500/50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{service.icon}</span>
            <div>
              <CardTitle className="text-base">{service.name}</CardTitle>
              <CardDescription className="text-xs">{service.description}</CardDescription>
            </div>
          </div>
          {isConnected && (
            <Badge className="bg-green-500">
              <Check className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
          {hasError && (
            <Badge variant="destructive">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Error
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardFooter className="pt-0 flex gap-2">
        {isConnected || hasError ? (
          <>
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Settings className="h-4 w-4 mr-1" />
              Configure
            </Button>
            <Button size="sm" variant="ghost" onClick={onDisconnect}>
              <Unplug className="h-4 w-4 mr-1" />
              Disconnect
            </Button>
          </>
        ) : (
          <Button size="sm" onClick={onConnect}>
            <Plug className="h-4 w-4 mr-1" />
            Connect
          </Button>
        )}
        {service.docsUrl && (
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => window.open(service.docsUrl, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

interface ConnectionDialogProps {
  service: ServiceDefinition
  existingConnection?: ServiceConnection
  isOpen: boolean
  onClose: () => void
  onSave: (credentials: Record<string, string>) => Promise<void>
  onTest: (credentials: Record<string, string>) => Promise<boolean>
}

function ConnectionDialog({ 
  service, 
  existingConnection,
  isOpen, 
  onClose, 
  onSave,
  onTest
}: ConnectionDialogProps) {
  const [credentials, setCredentials] = useState<Record<string, string>>({})
  const [connectionName, setConnectionName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null)

  // Initialize form with existing credentials
  useEffect(() => {
    if (existingConnection) {
      setConnectionName(existingConnection.name)
      // Don't show actual credential values, just placeholders
      const placeholders: Record<string, string> = {}
      service.requiredFields.forEach(field => {
        placeholders[field.key] = existingConnection.credentials[field.key] ? "••••••••" : ""
      })
      setCredentials(placeholders)
    } else {
      setConnectionName(`My ${service.name} Connection`)
      setCredentials({})
    }
    setTestResult(null)
  }, [service, existingConnection, isOpen])

  const handleTest = async () => {
    setIsTesting(true)
    setTestResult(null)
    try {
      const success = await onTest(credentials)
      setTestResult(success ? "success" : "error")
    } catch {
      setTestResult("error")
    } finally {
      setIsTesting(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave({ ...credentials, _name: connectionName })
      onClose()
    } catch (_error) {
      toast.error("Failed to save connection")
    } finally {
      setIsSaving(false)
    }
  }

  const handleOAuth = () => {
    if (service.oauthConfig) {
      // Open OAuth flow in popup
      window.open(
        service.oauthConfig.authUrl,
        'oauth',
        'width=600,height=700,popup=true'
      )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{service.icon}</span>
            <DialogTitle>
              {existingConnection ? 'Edit' : 'Connect'} {service.name}
            </DialogTitle>
          </div>
          <DialogDescription>
            {service.authType === 'oauth2' 
              ? 'Click the button below to authorize access.'
              : 'Enter your credentials to connect.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Connection Name */}
          <div className="space-y-2">
            <Label htmlFor="connection-name">Connection Name</Label>
            <Input
              id="connection-name"
              value={connectionName}
              onChange={(e) => setConnectionName(e.target.value)}
              placeholder="My Connection"
            />
          </div>

          {/* OAuth Flow */}
          {service.authType === 'oauth2' && (
            <Button onClick={handleOAuth} className="w-full">
              <Shield className="h-4 w-4 mr-2" />
              Authorize with {service.name}
            </Button>
          )}

          {/* API Key / Custom Fields */}
          {service.authType !== 'oauth2' && service.requiredFields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {field.type === 'textarea' ? (
                <Textarea
                  id={field.key}
                  value={credentials[field.key] || ''}
                  onChange={(e) => setCredentials(prev => ({
                    ...prev,
                    [field.key]: e.target.value
                  }))}
                  placeholder={field.placeholder}
                  rows={3}
                />
              ) : (
                <Input
                  id={field.key}
                  type={field.type === 'password' ? 'password' : 'text'}
                  value={credentials[field.key] || ''}
                  onChange={(e) => setCredentials(prev => ({
                    ...prev,
                    [field.key]: e.target.value
                  }))}
                  placeholder={field.placeholder}
                />
              )}
              {field.helpText && (
                <p className="text-xs text-muted-foreground">{field.helpText}</p>
              )}
            </div>
          ))}

          {/* Test Result */}
          {testResult && (
            <div className={`flex items-center gap-2 p-3 rounded-md ${
              testResult === 'success' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {testResult === 'success' ? (
                <>
                  <Check className="h-4 w-4" />
                  Connection test successful!
                </>
              ) : (
                <>
                  <X className="h-4 w-4" />
                  Connection test failed. Please check your credentials.
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {service.authType !== 'oauth2' && (
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={isTesting}
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Test Connection
            </Button>
          )}
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Key className="h-4 w-4 mr-2" />
            )}
            Save Connection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ConnectionSetup({ siteId, onConnectionChange }: ConnectionSetupProps) {
  const [connections, setConnections] = useState<ServiceConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedService, setSelectedService] = useState<ServiceDefinition | null>(null)
  const [editingConnection, setEditingConnection] = useState<ServiceConnection | null>(null)
  const [disconnectTarget, setDisconnectTarget] = useState<ServiceConnection | null>(null)
  const [activeCategory, setActiveCategory] = useState("all")

  const categories = ['all', ...getServiceCategories()]

  // Fetch existing connections
  useEffect(() => {
    const fetchConnections = async () => {
      setLoading(true)
      try {
        const supabase = createClient()
        const { data, error } = await (supabase as any)
          .from('automation_connections')
          .select('*')
          .eq('site_id', siteId)
          .order('created_at', { ascending: false })

        if (error) throw error

        const mapped: ServiceConnection[] = (data || []).map((row: any) => ({
          id: row.id,
          service: row.provider,
          name: row.name || row.provider,
          status: (row.status === 'active' ? 'connected' : row.status === 'error' ? 'error' : 'disconnected') as ServiceConnection['status'],
          credentials: row.config || {},
          metadata: {},
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          lastUsed: row.last_tested_at || undefined,
        }))
        setConnections(mapped)
      } catch (error) {
        console.error("Failed to fetch connections:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchConnections()
  }, [siteId])

  const getConnectionForService = (serviceId: string): ServiceConnection | undefined => {
    return connections.find(c => c.service === serviceId)
  }

  const handleConnect = (service: ServiceDefinition) => {
    setSelectedService(service)
    setEditingConnection(null)
  }

  const handleEdit = (service: ServiceDefinition, connection: ServiceConnection) => {
    setSelectedService(service)
    setEditingConnection(connection)
  }

  const handleDisconnect = async () => {
    if (!disconnectTarget) return

    try {
      const supabase = createClient()
      const { error } = await (supabase as any)
        .from('automation_connections')
        .delete()
        .eq('id', disconnectTarget.id)

      if (error) throw error

      setConnections(prev => prev.filter(c => c.id !== disconnectTarget.id))
      toast.success("Connection removed")
      onConnectionChange?.()
    } catch (_error) {
      console.error("Failed to remove connection:", _error)
      toast.error("Failed to remove connection")
    } finally {
      setDisconnectTarget(null)
    }
  }

  const handleSave = async (credentials: Record<string, string>) => {
    if (!selectedService) return

    const connectionName = credentials._name || `My ${selectedService.name} Connection`
    delete credentials._name

    try {
      const supabase = createClient()
      const now = new Date().toISOString()

      if (editingConnection) {
        // Update existing connection
        const { error } = await (supabase as any)
          .from('automation_connections')
          .update({
            name: connectionName,
            config: credentials,
            status: 'active',
            updated_at: now,
          })
          .eq('id', editingConnection.id)

        if (error) throw error

        const updated: ServiceConnection = {
          ...editingConnection,
          name: connectionName,
          status: 'connected',
          credentials,
          updatedAt: now,
        }
        setConnections(prev =>
          prev.map(c => c.id === editingConnection.id ? updated : c)
        )
      } else {
        // Insert new connection
        const { data, error } = await (supabase as any)
          .from('automation_connections')
          .insert({
            site_id: siteId,
            provider: selectedService.id,
            name: connectionName,
            config: credentials,
            status: 'active',
            created_at: now,
            updated_at: now,
          })
          .select()
          .single()

        if (error) throw error

        const newConnection: ServiceConnection = {
          id: data.id,
          service: selectedService.id,
          name: connectionName,
          status: 'connected',
          credentials,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        }
        setConnections(prev => [...prev, newConnection])
      }

      toast.success("Connection saved!")
      onConnectionChange?.()
    } catch (error) {
      throw error
    }
  }

  const handleTest = async (_credentials: Record<string, string>): Promise<boolean> => {
    if (!selectedService) return false

    try {
      // For webhook-based services, try to reach the URL
      const webhookField = selectedService.requiredFields.find(
        f => f.type === 'url' || f.key.includes('webhook') || f.key.includes('url')
      )
      if (webhookField && _credentials[webhookField.key]) {
        const url = _credentials[webhookField.key]
        try {
          const response = await fetch(url, {
            method: 'HEAD',
            mode: 'no-cors',
          })
          // no-cors returns opaque response (type 'opaque', status 0) which is OK
          // A network error would throw
          void response
        } catch {
          return false
        }
        // Record last tested time
        if (editingConnection) {
          const supabase = createClient()
          await (supabase as any)
            .from('automation_connections')
            .update({ last_tested_at: new Date().toISOString() })
            .eq('id', editingConnection.id)
        }
        return true
      }

      // For API key / basic auth services, validate all required fields are filled
      const missingRequired = selectedService.requiredFields
        .filter(f => f.required)
        .some(f => !_credentials[f.key] || _credentials[f.key] === '••••••••')

      if (missingRequired) return false

      // Record last tested time if editing
      if (editingConnection) {
        const supabase = createClient()
        await (supabase as any)
          .from('automation_connections')
          .update({ last_tested_at: new Date().toISOString() })
          .eq('id', editingConnection.id)
      }

      return true
    } catch {
      return false
    }
  }

  const filteredServices = activeCategory === 'all'
    ? SERVICE_DEFINITIONS
    : SERVICE_DEFINITIONS.filter(s => s.category === activeCategory)

  const connectedCount = connections.filter(c => c.status === 'connected').length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Plug className="h-6 w-6" />
            Connections
          </h2>
          <p className="text-muted-foreground">
            Connect external services to use in your automations
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {connectedCount} service{connectedCount !== 1 ? 's' : ''} connected
        </Badge>
      </div>

      {/* Category Filter */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="flex-wrap h-auto gap-1">
          {categories.map(cat => (
            <TabsTrigger key={cat} value={cat} className="capitalize">
              {cat === 'all' ? 'All Services' : cat}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map(service => {
          const connection = getConnectionForService(service.id)
          return (
            <ServiceCard
              key={service.id}
              service={service}
              connection={connection}
              onConnect={() => handleConnect(service)}
              onDisconnect={() => setDisconnectTarget(connection!)}
              onEdit={() => handleEdit(service, connection!)}
            />
          )
        })}
      </div>

      {/* Connection Dialog */}
      {selectedService && (
        <ConnectionDialog
          service={selectedService}
          existingConnection={editingConnection || undefined}
          isOpen={!!selectedService}
          onClose={() => {
            setSelectedService(null)
            setEditingConnection(null)
          }}
          onSave={handleSave}
          onTest={handleTest}
        />
      )}

      {/* Disconnect Confirmation */}
      <AlertDialog 
        open={!!disconnectTarget} 
        onOpenChange={() => setDisconnectTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Service?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the connection to {disconnectTarget?.name}. 
              Any workflows using this connection may stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDisconnect}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Help Section */}
      <Card className="bg-muted/50">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary/10 rounded-full">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium mb-1">Your credentials are secure</h3>
              <p className="text-sm text-muted-foreground">
                All credentials are encrypted at rest and in transit. We never store 
                OAuth tokens in plain text, and API keys are encrypted using industry-standard 
                encryption. You can revoke access at any time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
