/**
 * Webhooks View Component
 * 
 * Phase ECOM-43B: Integrations & Webhooks - UI Components
 * 
 * View for managing webhook endpoints with delivery history.
 */
'use client'

import { useState } from 'react'
import {
  Webhook,
  Plus,
  MoreVertical,
  RefreshCw,
  Trash2,
  Eye,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Copy,
  Check
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { toast } from 'sonner'
import { useWebhooks } from '../../hooks/use-integrations'
import { WebhookEndpointDialog } from '../dialogs/webhook-endpoint-dialog'
import type { WebhookEndpoint, WebhookDelivery, CreateWebhookInput } from '../../types/integration-types'

interface WebhooksViewProps {
  siteId: string
}

export function WebhooksView({ siteId }: WebhooksViewProps) {
  const { webhooks, eventTypes, isLoading, create, update, remove, rotateSecret, test, getDeliveries } = useWebhooks(siteId)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEndpoint, setEditingEndpoint] = useState<WebhookEndpoint | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedEndpoint, setSelectedEndpoint] = useState<WebhookEndpoint | null>(null)
  const [deliveriesSheetOpen, setDeliveriesSheetOpen] = useState(false)
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([])
  const [loadingDeliveries, setLoadingDeliveries] = useState(false)
  const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null)
  const [copiedSecret, setCopiedSecret] = useState<string | null>(null)

  const handleEdit = (endpoint: WebhookEndpoint) => {
    setEditingEndpoint(endpoint)
    setDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedEndpoint) return
    const result = await remove(selectedEndpoint.id)
    if (result.success) {
      toast.success('Webhook deleted')
    } else {
      toast.error(result.error || 'Failed to delete webhook')
    }
    setDeleteDialogOpen(false)
    setSelectedEndpoint(null)
  }

  const handleTest = async (endpoint: WebhookEndpoint) => {
    setTestingEndpoint(endpoint.id)
    const result = await test(endpoint.id)
    if (result.success) {
      toast.success('Test webhook sent successfully')
    } else {
      toast.error(result.error || 'Test webhook failed')
    }
    setTestingEndpoint(null)
  }

  const handleViewDeliveries = async (endpoint: WebhookEndpoint) => {
    setSelectedEndpoint(endpoint)
    setLoadingDeliveries(true)
    setDeliveriesSheetOpen(true)
    const data = await getDeliveries(endpoint.id, 50)
    setDeliveries(data)
    setLoadingDeliveries(false)
  }

  const handleRotateSecret = async (endpoint: WebhookEndpoint) => {
    const result = await rotateSecret(endpoint.id)
    if (result.success && result.secret) {
      await navigator.clipboard.writeText(result.secret)
      setCopiedSecret(endpoint.id)
      toast.success('New secret copied to clipboard')
      setTimeout(() => setCopiedSecret(null), 3000)
    } else {
      toast.error(result.error || 'Failed to rotate secret')
    }
  }

  const handleCopySecret = async (endpoint: WebhookEndpoint) => {
    await navigator.clipboard.writeText(endpoint.secret)
    setCopiedSecret(endpoint.id)
    toast.success('Secret copied')
    setTimeout(() => setCopiedSecret(null), 2000)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Delivered</Badge>
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'retrying':
        return <Badge variant="outline"><RefreshCw className="h-3 w-3 mr-1" />Retrying</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Webhook Endpoints
            </CardTitle>
            <CardDescription>
              Receive real-time notifications when events happen in your store
            </CardDescription>
          </div>
          <Button onClick={() => {
            setEditingEndpoint(null)
            setDialogOpen(true)
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Endpoint
          </Button>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <div className="text-center py-8">
              <Webhook className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Webhook Endpoints</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add an endpoint to start receiving webhook notifications
              </p>
              <Button onClick={() => {
                setEditingEndpoint(null)
                setDialogOpen(true)
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Endpoint
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {webhooks.map((endpoint) => (
                <div 
                  key={endpoint.id} 
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{endpoint.name}</h4>
                        {!endpoint.active ? (
                          <Badge variant="secondary">Disabled</Badge>
                        ) : endpoint.consecutive_failures >= 5 ? (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Failing
                          </Badge>
                        ) : (
                          <Badge className="bg-green-500">Active</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground font-mono">
                        {endpoint.url}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(endpoint)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTest(endpoint)}>
                          <Send className="h-4 w-4 mr-2" />
                          Send Test
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewDeliveries(endpoint)}>
                          <Clock className="h-4 w-4 mr-2" />
                          View Deliveries
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleCopySecret(endpoint)}>
                          {copiedSecret === endpoint.id ? (
                            <Check className="h-4 w-4 mr-2" />
                          ) : (
                            <Copy className="h-4 w-4 mr-2" />
                          )}
                          Copy Secret
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRotateSecret(endpoint)}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Rotate Secret
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setSelectedEndpoint(endpoint)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {endpoint.events.slice(0, 5).map(event => (
                      <Badge key={event} variant="outline" className="text-xs font-mono">
                        {event}
                      </Badge>
                    ))}
                    {endpoint.events.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{endpoint.events.length - 5} more
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Version: {endpoint.secret_version}</span>
                    <span>Timeout: {endpoint.timeout_seconds}s</span>
                    <span>Retries: {endpoint.max_retries}</span>
                    {endpoint.last_triggered_at && (
                      <span>Last delivery: {formatDate(endpoint.last_triggered_at)}</span>
                    )}
                  </div>
                  
                  {testingEndpoint === endpoint.id && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Sending test webhook...
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <WebhookEndpointDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingEndpoint(null)
        }}
        endpoint={editingEndpoint}
        eventTypes={eventTypes}
        onSubmit={async (input) => {
          if (editingEndpoint) {
            return update(editingEndpoint.id, input)
          }
          const result = await create(input as CreateWebhookInput)
          return { success: result.success, error: result.error }
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Webhook Endpoint</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedEndpoint?.name}&quot;? 
              This will stop all webhook deliveries to this endpoint.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={deliveriesSheetOpen} onOpenChange={setDeliveriesSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Delivery History</SheetTitle>
            <SheetDescription>
              Recent webhook deliveries to {selectedEndpoint?.name}
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6">
            {loadingDeliveries ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : deliveries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No deliveries yet
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Response</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell>
                        <code className="text-xs">{delivery.event_type}</code>
                      </TableCell>
                      <TableCell>{getStatusBadge(delivery.status)}</TableCell>
                      <TableCell>
                        {delivery.response_status && (
                          <Badge variant="outline">
                            {delivery.response_status}
                          </Badge>
                        )}
                        {delivery.response_time_ms && (
                          <span className="text-xs text-muted-foreground ml-2">
                            {delivery.response_time_ms}ms
                          </span>
                        )}
                        {delivery.error_message && (
                          <span className="text-xs text-destructive block">
                            {delivery.error_message}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(delivery.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
