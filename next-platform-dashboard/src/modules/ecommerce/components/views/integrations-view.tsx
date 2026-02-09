/**
 * Integrations View Component
 * 
 * Phase ECOM-43B: Integrations & Webhooks - UI Components
 * 
 * View for managing third-party integrations.
 */
'use client'

import { useState } from 'react'
import {
  Plug,
  MoreVertical,
  Trash2,
  Settings,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Clock,
  Activity
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { useIntegrations } from '../../hooks/use-integrations'
import type { Integration, IntegrationLog, IntegrationCategory } from '../../types/integration-types'

import { DEFAULT_LOCALE } from '@/lib/locale-config'
interface IntegrationsViewProps {
  siteId: string
}

// Available integration providers
const AVAILABLE_PROVIDERS: Array<{
  provider: string
  name: string
  description: string
  category: IntegrationCategory
  icon: string
  comingSoon?: boolean
}> = [
  {
    provider: 'stripe',
    name: 'Stripe',
    description: 'Accept payments and manage subscriptions',
    category: 'payment',
    icon: '💳'
  },
  {
    provider: 'paypal',
    name: 'PayPal',
    description: 'PayPal payment processing',
    category: 'payment',
    icon: '🅿️',
    comingSoon: true
  },
  {
    provider: 'shippo',
    name: 'Shippo',
    description: 'Multi-carrier shipping and tracking',
    category: 'shipping',
    icon: '📦'
  },
  {
    provider: 'shipstation',
    name: 'ShipStation',
    description: 'Shipping automation platform',
    category: 'shipping',
    icon: '🚚',
    comingSoon: true
  },
  {
    provider: 'mailchimp',
    name: 'Mailchimp',
    description: 'Email marketing and automation',
    category: 'marketing',
    icon: '📧'
  },
  {
    provider: 'klaviyo',
    name: 'Klaviyo',
    description: 'E-commerce marketing platform',
    category: 'marketing',
    icon: '📊',
    comingSoon: true
  },
  {
    provider: 'quickbooks',
    name: 'QuickBooks',
    description: 'Accounting and bookkeeping',
    category: 'accounting',
    icon: '📒'
  },
  {
    provider: 'xero',
    name: 'Xero',
    description: 'Cloud accounting software',
    category: 'accounting',
    icon: '📈',
    comingSoon: true
  },
  {
    provider: 'google_analytics',
    name: 'Google Analytics',
    description: 'Web analytics and insights',
    category: 'analytics',
    icon: '📉'
  },
  {
    provider: 'facebook_pixel',
    name: 'Facebook Pixel',
    description: 'Conversion tracking and audiences',
    category: 'analytics',
    icon: '📱',
    comingSoon: true
  },
  {
    provider: 'zendesk',
    name: 'Zendesk',
    description: 'Customer support ticketing',
    category: 'crm',
    icon: '🎧',
    comingSoon: true
  },
  {
    provider: 'hubspot',
    name: 'HubSpot',
    description: 'CRM and marketing automation',
    category: 'crm',
    icon: '🔶',
    comingSoon: true
  }
]

export function IntegrationsView({ siteId }: IntegrationsViewProps) {
  const { integrations, isLoading, disconnect, getLogs } = useIntegrations(siteId)
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [logsSheetOpen, setLogsSheetOpen] = useState(false)
  const [logs, setLogs] = useState<IntegrationLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)

  const handleDisconnect = async () => {
    if (!selectedIntegration) return
    const result = await disconnect(selectedIntegration.id)
    if (result.success) {
      toast.success('Integration disconnected')
    } else {
      toast.error(result.error || 'Failed to disconnect')
    }
    setDisconnectDialogOpen(false)
    setSelectedIntegration(null)
  }

  const handleViewLogs = async (integration: Integration) => {
    setSelectedIntegration(integration)
    setLoadingLogs(true)
    setLogsSheetOpen(true)
    const data = await getLogs(integration.id, 100)
    setLogs(data)
    setLoadingLogs(false)
  }

  const getConnectedIntegration = (provider: string) => {
    return integrations.find(i => i.provider === provider)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(DEFAULT_LOCALE, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const getStatusIcon = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-muted-foreground" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-destructive" />
      case 'pending':
        return <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />
      default:
        return null
    }
  }

  const getLogLevelBadge = (level: string) => {
    switch (level) {
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      case 'warning':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Warning</Badge>
      case 'info':
        return <Badge variant="secondary">Info</Badge>
      case 'debug':
        return <Badge variant="outline">Debug</Badge>
      default:
        return <Badge variant="outline">{level}</Badge>
    }
  }

  // Group providers by category
  const groupedProviders = AVAILABLE_PROVIDERS.reduce((acc, provider) => {
    if (!acc[provider.category]) {
      acc[provider.category] = []
    }
    acc[provider.category].push(provider)
    return acc
  }, {} as Record<string, typeof AVAILABLE_PROVIDERS>)

  const categoryLabels: Record<string, string> = {
    payment: 'Payment Processing',
    shipping: 'Shipping & Fulfillment',
    marketing: 'Marketing & Email',
    accounting: 'Accounting & Finance',
    analytics: 'Analytics & Tracking',
    crm: 'CRM & Support'
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[1, 2].map(j => (
                  <Skeleton key={j} className="h-24 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {Object.entries(groupedProviders).map(([category, providers]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle>{categoryLabels[category] || category}</CardTitle>
              <CardDescription>
                Connect your {category.replace('_', ' ')} services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {providers.map((provider) => {
                  const connected = getConnectedIntegration(provider.provider)
                  
                  return (
                    <div
                      key={provider.provider}
                      className="flex items-start justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{provider.icon}</div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{provider.name}</h4>
                            {connected && getStatusIcon(connected.status)}
                            {provider.comingSoon && (
                              <Badge variant="outline" className="text-xs">
                                Coming Soon
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {provider.description}
                          </p>
                          {connected && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              Connected {formatDate(connected.created_at)}
                              {connected.is_test_mode && (
                                <Badge variant="outline" className="text-xs">
                                  Test Mode
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {provider.comingSoon ? (
                        <Button variant="outline" disabled>
                          Coming Soon
                        </Button>
                      ) : connected ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Settings className="h-4 w-4 mr-2" />
                              Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewLogs(connected)}>
                              <Activity className="h-4 w-4 mr-2" />
                              View Logs
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedIntegration(connected)
                                setDisconnectDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Disconnect
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Button variant="outline">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Connect
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {/* Connected Integrations Summary */}
        {integrations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plug className="h-5 w-5" />
                Connected Integrations
              </CardTitle>
              <CardDescription>
                Overview of your active integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Integration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Last Sync</TableHead>
                    <TableHead>Enabled</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {integrations.map((integration) => (
                    <TableRow key={integration.id}>
                      <TableCell>
                        <div className="font-medium">{integration.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {integration.provider}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(integration.status)}
                          <span className="capitalize">{integration.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={integration.is_test_mode ? 'outline' : 'default'}>
                          {integration.is_test_mode ? 'Test' : 'Live'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {integration.last_sync_at 
                          ? formatDate(integration.last_sync_at)
                          : 'Never'
                        }
                      </TableCell>
                      <TableCell>
                        <Switch checked={integration.is_active} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={disconnectDialogOpen} onOpenChange={setDisconnectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Integration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect {selectedIntegration?.name}? 
              This will stop all syncing and remove stored credentials.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={logsSheetOpen} onOpenChange={setLogsSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Integration Logs</SheetTitle>
            <SheetDescription>
              Recent activity for {selectedIntegration?.name}
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6">
            {loadingLogs ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No logs yet
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getLogLevelBadge(log.status)}
                        <span className="font-mono text-sm">{log.action}</span>
                        <Badge variant="outline" className="text-xs">
                          {log.direction}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(log.created_at)}
                        {log.duration_ms && ` (${log.duration_ms}ms)`}
                      </span>
                    </div>
                    {log.error_message && (
                      <p className="text-sm text-destructive">
                        {log.error_message}
                      </p>
                    )}
                    {log.response_data && (
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-32">
                        {JSON.stringify(log.response_data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
